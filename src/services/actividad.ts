import { CLAVES, escribir, leer } from './almacenamiento'

/**
 * Actividad de quien busca materiales: publicaciones guardadas y contactos
 * realizados.
 *
 * Se guarda por visitante (el id del usuario, o "anonimo" sin sesión) en este
 * navegador. Al migrar a una base de datos real, este módulo pasa a leer y
 * escribir en ella sin cambiar sus firmas.
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

/** Guarda o quita la publicación. Devuelve true si quedó guardada. */
export function alternarGuardado(visitante: string, publicacionId: string): boolean {
  const todos = leer<PorVisitante<string>>(CLAVES.guardados, {})
  const actuales = todos[visitante] ?? []
  const yaEstaba = actuales.includes(publicacionId)

  todos[visitante] = yaEstaba
    ? actuales.filter((id) => id !== publicacionId)
    : [publicacionId, ...actuales]

  escribir(CLAVES.guardados, todos)
  notificar()
  return !yaEstaba
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
