import { CLAVES, escribir, leer } from './almacenamiento'
import { obtenerToken } from './sesion'
import { llamar } from './sheets'

/**
 * Actividad de quien busca materiales: publicaciones guardadas y contactos
 * realizados.
 *
 * Con sesión, la hoja es la fuente de verdad (hojas "Guardados" y
 * "Contactos") y el navegador guarda una copia para mostrarla al instante.
 * Sin sesión solo se lleva la cuenta en este navegador, para no sumar dos
 * veces el mismo contacto.
 */

export const VISITANTE_ANONIMO = 'anonimo'

export interface ContactoRealizado {
  publicacionId: string
  fecha: string
}

type PorVisitante<T> = Record<string, T[]>

// Suscripción mínima para que todas las pantallas se enteren de los cambios
// (por ejemplo, el corazón de una tarjeta y el panel del recolector).
const oyentes = new Set<() => void>()
let version = 0

export function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export function versionActual(): number {
  return version
}

function notificar(): void {
  version += 1
  oyentes.forEach((oyente) => oyente())
}

// ------------------------------------------------------------------ guardados

export function obtenerGuardados(visitante: string): string[] {
  return leer<PorVisitante<string>>(CLAVES.guardados, {})[visitante] ?? []
}

function escribirGuardados(visitante: string, ids: string[]): void {
  const todos = leer<PorVisitante<string>>(CLAVES.guardados, {})
  todos[visitante] = ids
  escribir(CLAVES.guardados, todos)
  notificar()
}

/**
 * Guarda o quita la publicación. Se muestra al instante y se envía a la hoja;
 * si la hoja no lo acepta, se deshace. Devuelve true si quedó guardada.
 */
export function alternarGuardado(visitante: string, publicacionId: string): boolean {
  const anteriores = obtenerGuardados(visitante)
  const guardar = !anteriores.includes(publicacionId)

  escribirGuardados(
    visitante,
    guardar ? [publicacionId, ...anteriores] : anteriores.filter((id) => id !== publicacionId),
  )

  if (obtenerToken()) {
    void llamar('alternar_guardado', { publicacionId, guardar }).then((respuesta) => {
      if (!respuesta?.ok) escribirGuardados(visitante, anteriores)
    })
  }

  return guardar
}

// ------------------------------------------------------------ con la hoja

/** Usuarios cuya actividad ya se trajo de la hoja en esta visita. */
const sincronizados = new Set<string>()

/**
 * Trae de la hoja los guardados y contactos del usuario y reemplaza la copia
 * local. Se hace una vez por visita: así lo guardado en el celular aparece en
 * la computadora.
 */
export async function sincronizarActividad(usuarioId: string): Promise<void> {
  if (sincronizados.has(usuarioId) || !obtenerToken()) return
  sincronizados.add(usuarioId)

  const respuesta = await llamar('mi_actividad')
  if (!respuesta?.ok) {
    sincronizados.delete(usuarioId)
    return
  }

  const contactos = Array.isArray(respuesta.contactos) ? (respuesta.contactos as ContactoRealizado[]) : []
  const todosContactos = leer<PorVisitante<ContactoRealizado>>(CLAVES.contactados, {})
  todosContactos[usuarioId] = contactos
  escribir(CLAVES.contactados, todosContactos)

  escribirGuardados(usuarioId, Array.isArray(respuesta.guardados) ? (respuesta.guardados as string[]) : [])
}

// ------------------------------------------------------------------ contactos

/** Contactos realizados, del más reciente al más antiguo. */
export function obtenerContactos(visitante: string): ContactoRealizado[] {
  const contactos = leer<PorVisitante<ContactoRealizado>>(CLAVES.contactados, {})[visitante] ?? []
  return [...contactos].sort((a, b) => b.fecha.localeCompare(a.fecha))
}

/**
 * Anota que el visitante contactó una publicación.
 *
 * Devuelve true solo la primera vez: así el contador del oferente suma una
 * persona interesada, no cada vez que alguien abre la ventana de contacto.
 */
export function anotarContacto(visitante: string, publicacionId: string): boolean {
  const todos = leer<PorVisitante<ContactoRealizado>>(CLAVES.contactados, {})
  const actuales = todos[visitante] ?? []
  const esNuevo = !actuales.some((contacto) => contacto.publicacionId === publicacionId)

  todos[visitante] = [
    { publicacionId, fecha: new Date().toISOString() },
    ...actuales.filter((contacto) => contacto.publicacionId !== publicacionId),
  ]

  escribir(CLAVES.contactados, todos)
  notificar()
  return esNuevo
}
