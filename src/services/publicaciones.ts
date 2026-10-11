import { PUBLICACIONES_DEMO } from '../data/seed'
import type {
  BorradorPublicacion,
  EstadoPublicacion,
  Publicacion,
  Usuario,
  UsuarioAlmacenado,
} from '../types'
import { CLAVES, escribir, generarId, leer } from './almacenamiento'
import { haySheetsConfigurado } from './config'
import { eliminarFoto } from './imagenes'
import {
  anotarPendiente,
  confirmarPendiente,
  iniciarRegistro,
  leerPendientes,
  obtenerPendientes,
} from './pendientes'
import type { Pendiente } from './pendientes'
import {
  descargarPublicaciones,
  sincronizarContacto,
  sincronizarEliminacion,
  sincronizarPublicacionEditada,
  sincronizarPublicacionNueva,
} from './sheets'

/**
 * Repositorio de publicaciones.
 *
 * Es la única puerta de entrada a los datos: los componentes nunca tocan
 * localStorage ni la hoja de cálculo directamente. Mañana puede apuntar a
 * Supabase, Firebase o una API REST reemplazando solo este archivo.
 *
 * Cómo se combinan las dos fuentes:
 *
 *   - La hoja es la fuente de verdad. Si responde, se usa su versión de cada
 *     publicación y lo que ya no está en ella desaparece del navegador.
 *   - Los cambios hechos acá que la hoja aún no confirmó (ver pendientes.ts)
 *     mandan sobre la hoja hasta que se confirman.
 *   - Si la hoja no responde, se muestra lo guardado en el navegador.
 */

function cargarLocales(): Publicacion[] {
  const guardadas = leer<Publicacion[] | null>(CLAVES.publicaciones, null)

  // Primer acceso: se siembran las publicaciones de demostración.
  if (!guardadas) {
    escribir(CLAVES.publicaciones, PUBLICACIONES_DEMO)
    return PUBLICACIONES_DEMO
  }

  return guardadas
}

function guardarLocales(publicaciones: Publicacion[]): void {
  escribir(CLAVES.publicaciones, publicaciones)
}

// ------------------------------------------------------------- sincronización

/** Ids que se están enviando ahora mismo, para no mandarlos dos veces a la vez. */
const enCurso = new Set<string>()

/**
 * Envía un cambio a la hoja y, si la hoja lo confirma, borra el pendiente.
 * Devuelve una promesa que se resuelve cuando termina, haya funcionado o no.
 */
async function enviarCambio(id: string, pendiente: Pendiente): Promise<void> {
  enCurso.add(id)

  try {
    let confirmado: boolean

    if (pendiente.operacion === 'eliminar') {
      confirmado = await sincronizarEliminacion(id)
    } else {
      const publicacion = cargarLocales().find((item) => item.id === id)
      // Si ya no existe localmente no hay nada que guardar.
      confirmado = publicacion ? await sincronizarPublicacionEditada(publicacion) : true
    }

    if (confirmado) confirmarPendiente(id, pendiente.marca)
  } finally {
    enCurso.delete(id)
  }
}

/** Anota el cambio como pendiente y lo envía. Sin hoja configurada no hay nada que esperar. */
function registrarCambio(id: string, operacion: Pendiente['operacion']): Promise<void> {
  if (!haySheetsConfigurado()) return Promise.resolve()

  const marca = anotarPendiente(id, operacion)
  return enviarCambio(id, { operacion, marca })
}

/** Reintenta en segundo plano los cambios que quedaron sin confirmar (por ejemplo, sin internet). */
function reintentarPendientes(): void {
  for (const [id, pendiente] of Object.entries(obtenerPendientes())) {
    if (!enCurso.has(id)) void enviarCambio(id, pendiente)
  }
}

/**
 * Primera vez con la versión que usa la hoja como fuente de verdad.
 *
 * Antes, una publicación creada en este navegador podía no haber llegado a la
 * hoja (por ejemplo, sin internet) y nadie lo registraba. Para no perderla,
 * las publicaciones de cuentas de este navegador que no están en la hoja se
 * marcan como pendientes y se suben. Las de otros negocios que la hoja ya no
 * tiene se consideran eliminadas.
 */
function migrarSiHaceFalta(locales: Publicacion[], remotas: Publicacion[]): void {
  if (leerPendientes() !== null) return

  const cuentasLocales = new Set(
    leer<UsuarioAlmacenado[]>(CLAVES.usuarios, []).map((usuario) => usuario.id),
  )
  const enLaHoja = new Set(remotas.map((publicacion) => publicacion.id))
  const registro: Record<string, Pendiente> = {}

  for (const publicacion of locales) {
    if (
      publicacion.origen === 'usuario' &&
      cuentasLocales.has(publicacion.usuarioId) &&
      !enLaHoja.has(publicacion.id)
    ) {
      registro[publicacion.id] = { operacion: 'guardar', marca: 'migracion' }
    }
  }

  iniciarRegistro(registro)
}

/** Une la hoja con lo local respetando los cambios pendientes. */
function combinar(
  locales: Publicacion[],
  remotas: Publicacion[],
  pendientes: Record<string, Pendiente>,
): Publicacion[] {
  const localPorId = new Map(locales.map((publicacion) => [publicacion.id, publicacion]))
  const resultado: Publicacion[] = []
  const vistas = new Set<string>()

  for (const remota of remotas) {
    if (!remota.id || vistas.has(remota.id)) continue
    vistas.add(remota.id)

    const pendiente = pendientes[remota.id]
    const local = localPorId.get(remota.id)

    // Eliminada acá pero la hoja todavía no se enteró: no se muestra.
    if (pendiente?.operacion === 'eliminar') continue

    // Editada acá y aún sin confirmar: la versión local es la más nueva.
    if (pendiente?.operacion === 'guardar' && local) {
      resultado.push(local)
      continue
    }

    // La hoja no guarda las fotos: se conserva la que haya en este dispositivo.
    resultado.push({ ...remota, fotoId: local?.fotoId ?? null })
  }

  for (const local of locales) {
    if (vistas.has(local.id)) continue

    // Lo que no está en la hoja solo sigue si es de ejemplo o si es un cambio
    // de este navegador que la hoja todavía no recibió.
    if (local.origen === 'demo' || pendientes[local.id]?.operacion === 'guardar') {
      resultado.push(local)
    }
  }

  return resultado
}

// ------------------------------------------------------------------- lectura

/**
 * Lista las publicaciones. Si la hoja responde, manda la hoja (salvo los
 * cambios pendientes de este navegador). Si no responde, se muestra lo local.
 */
export async function listarPublicaciones(): Promise<Publicacion[]> {
  const remotas = await descargarPublicaciones()
  const locales = cargarLocales()

  if (remotas) migrarSiHaceFalta(locales, remotas)

  // Después de migrar, para que también se suban las publicaciones recuperadas.
  reintentarPendientes()

  if (!remotas) return ordenar(locales)

  const combinadas = combinar(locales, remotas, obtenerPendientes())
  guardarLocales(combinadas)
  return ordenar(combinadas)
}

/**
 * Las publicaciones reales van primero y las de ejemplo al final: las de
 * ejemplo se fechan siempre "hace unos días" y si no taparían a las reales.
 */
function ordenar(publicaciones: Publicacion[]): Publicacion[] {
  return [...publicaciones].sort((a, b) => {
    const demoA = a.origen === 'demo' ? 1 : 0
    const demoB = b.origen === 'demo' ? 1 : 0
    if (demoA !== demoB) return demoA - demoB
    return new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime()
  })
}

export { contarPendientes } from './pendientes'

// ------------------------------------------------------------------ escritura
//
// Cada escritura guarda primero en el navegador y devuelve enseguida, junto con
// la promesa `confirmacion`, que termina cuando la hoja respondió. La interfaz
// no espera a la red, y gracias a los pendientes nunca muestra datos viejos.

export interface Resultado<T> {
  valor: T
  confirmacion: Promise<void>
}

export async function crearPublicacion(
  borrador: BorradorPublicacion,
  usuario: Usuario,
): Promise<Resultado<Publicacion>> {
  const publicacion: Publicacion = {
    ...borrador,
    id: generarId('pub'),
    estado: 'disponible',
    contactos: 0,
    usuarioId: usuario.id,
    empresa: usuario.empresa,
    contacto: usuario.contacto,
    telefono: usuario.telefono,
    creadaEn: new Date().toISOString(),
    origen: 'usuario',
  }

  guardarLocales([publicacion, ...cargarLocales()])

  if (!haySheetsConfigurado()) return { valor: publicacion, confirmacion: Promise.resolve() }

  // Crear usa su propia acción en la hoja, que ignora duplicados si se reintenta.
  const marca = anotarPendiente(publicacion.id, 'guardar')
  enCurso.add(publicacion.id)
  const confirmacion = sincronizarPublicacionNueva(publicacion)
    .then((confirmado) => {
      if (confirmado) confirmarPendiente(publicacion.id, marca)
    })
    .finally(() => enCurso.delete(publicacion.id))

  return { valor: publicacion, confirmacion }
}

export async function actualizarPublicacion(
  id: string,
  cambios: Partial<Publicacion>,
): Promise<Resultado<Publicacion | undefined>> {
  const publicaciones = cargarLocales()
  const indice = publicaciones.findIndex((publicacion) => publicacion.id === id)
  if (indice === -1) return { valor: undefined, confirmacion: Promise.resolve() }

  const anterior = publicaciones[indice]
  const actualizada = { ...anterior, ...cambios }
  publicaciones[indice] = actualizada
  guardarLocales(publicaciones)

  // Si la foto se reemplazó o se quitó, la anterior ya no la usa nadie.
  if (anterior.fotoId && anterior.fotoId !== actualizada.fotoId) void eliminarFoto(anterior.fotoId)

  return { valor: actualizada, confirmacion: registrarCambio(id, 'guardar') }
}

/**
 * Copia los datos de contacto del perfil a todas las publicaciones del
 * usuario. Sin esto, quien cambia de teléfono seguiría recibiendo consultas
 * en el número viejo. Devuelve cuántas publicaciones se actualizaron.
 */
export function actualizarDatosDeContacto(
  usuario: Pick<Usuario, 'id' | 'empresa' | 'contacto' | 'telefono'>,
): number {
  const publicaciones = cargarLocales()
  const cambiadas: string[] = []

  const actualizadas = publicaciones.map((publicacion) => {
    if (publicacion.usuarioId !== usuario.id || publicacion.origen !== 'usuario') return publicacion

    const igual =
      publicacion.empresa === usuario.empresa &&
      publicacion.contacto === usuario.contacto &&
      String(publicacion.telefono) === usuario.telefono
    if (igual) return publicacion

    cambiadas.push(publicacion.id)
    return {
      ...publicacion,
      empresa: usuario.empresa,
      contacto: usuario.contacto,
      telefono: usuario.telefono,
    }
  })

  if (cambiadas.length === 0) return 0

  guardarLocales(actualizadas)
  for (const id of cambiadas) void registrarCambio(id, 'guardar')
  return cambiadas.length
}

export async function cambiarEstado(
  id: string,
  estado: EstadoPublicacion,
): Promise<Resultado<Publicacion | undefined>> {
  return actualizarPublicacion(id, { estado })
}

export async function eliminarPublicacion(id: string): Promise<Resultado<void>> {
  const publicaciones = cargarLocales()
  const publicacion = publicaciones.find((item) => item.id === id)

  guardarLocales(publicaciones.filter((item) => item.id !== id))
  if (publicacion?.fotoId) void eliminarFoto(publicacion.fotoId)

  return { valor: undefined, confirmacion: registrarCambio(id, 'eliminar') }
}

/**
 * Suma un contacto recibido. Se espera a la hoja para que, al recargar, el
 * contador que devuelve ya incluya este contacto.
 */
export async function registrarContacto(id: string): Promise<void> {
  const publicaciones = cargarLocales()
  const indice = publicaciones.findIndex((publicacion) => publicacion.id === id)
  if (indice === -1) return

  publicaciones[indice] = {
    ...publicaciones[indice],
    contactos: publicaciones[indice].contactos + 1,
  }
  guardarLocales(publicaciones)
  await sincronizarContacto(id)
}
