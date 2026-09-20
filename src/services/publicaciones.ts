import { PUBLICACIONES_DEMO } from '../data/seed'
import type { BorradorPublicacion, EstadoPublicacion, Publicacion, Usuario } from '../types'
import { CLAVES, escribir, generarId, leer } from './almacenamiento'
import { eliminarFoto } from './imagenes'
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
 * localStorage ni la hoja de cálculo directamente. Hoy combina dos fuentes
 * (navegador + Google Sheets) y mañana puede apuntar a Supabase, Firebase o
 * una API REST reemplazando solo este archivo.
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

/**
 * Lista las publicaciones combinando el navegador con la hoja compartida.
 * Ante cualquier problema de red devuelve lo local, así la demo nunca se cae.
 */
export async function listarPublicaciones(): Promise<Publicacion[]> {
  const locales = cargarLocales()
  const remotas = await descargarPublicaciones()

  if (!remotas || remotas.length === 0) return ordenar(locales)

  // Las locales tienen prioridad: son las que este usuario acaba de editar.
  const conocidas = new Set(locales.map((publicacion) => publicacion.id))
  const nuevas = remotas.filter((publicacion) => publicacion.id && !conocidas.has(publicacion.id))

  if (nuevas.length === 0) return ordenar(locales)

  const combinadas = [...locales, ...nuevas]
  guardarLocales(combinadas)
  return ordenar(combinadas)
}

function ordenar(publicaciones: Publicacion[]): Publicacion[] {
  return [...publicaciones].sort(
    (a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime(),
  )
}

export async function obtenerPublicacion(id: string): Promise<Publicacion | undefined> {
  return cargarLocales().find((publicacion) => publicacion.id === id)
}

export async function crearPublicacion(
  borrador: BorradorPublicacion,
  usuario: Usuario,
): Promise<Publicacion> {
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
  void sincronizarPublicacionNueva(publicacion)

  return publicacion
}

export async function actualizarPublicacion(
  id: string,
  cambios: Partial<Publicacion>,
): Promise<Publicacion | undefined> {
  const publicaciones = cargarLocales()
  const indice = publicaciones.findIndex((publicacion) => publicacion.id === id)
  if (indice === -1) return undefined

  const actualizada = { ...publicaciones[indice], ...cambios }
  publicaciones[indice] = actualizada
  guardarLocales(publicaciones)
  void sincronizarPublicacionEditada(actualizada)

  return actualizada
}

export async function cambiarEstado(
  id: string,
  estado: EstadoPublicacion,
): Promise<Publicacion | undefined> {
  return actualizarPublicacion(id, { estado })
}

export async function eliminarPublicacion(id: string): Promise<void> {
  const publicaciones = cargarLocales()
  const publicacion = publicaciones.find((item) => item.id === id)

  guardarLocales(publicaciones.filter((item) => item.id !== id))

  if (publicacion?.fotoId) void eliminarFoto(publicacion.fotoId)
  void sincronizarEliminacion(id)
}

/** Suma un contacto recibido; alimenta el resumen del dashboard. */
export async function registrarContacto(id: string): Promise<void> {
  const publicaciones = cargarLocales()
  const indice = publicaciones.findIndex((publicacion) => publicacion.id === id)
  if (indice === -1) return

  publicaciones[indice] = {
    ...publicaciones[indice],
    contactos: publicaciones[indice].contactos + 1,
  }
  guardarLocales(publicaciones)
  void sincronizarContacto(id)
}

/** Devuelve la demo a su estado original. Útil antes de una presentación. */
export function restablecerDemostracion(): void {
  guardarLocales(PUBLICACIONES_DEMO)
}
