import { CLAVES, escribir, leer } from './almacenamiento'

/**
 * Cambios hechos en este navegador que la hoja todavía no confirmó.
 *
 * Mientras un cambio está pendiente, la versión local manda sobre la de la
 * hoja: así una publicación eliminada no reaparece y una recién creada no
 * desaparece porque la hoja aún no la tiene. Cuando la hoja confirma, el
 * pendiente se borra y desde ese momento manda la hoja.
 */

export type OperacionPendiente = 'guardar' | 'eliminar'

export interface Pendiente {
  operacion: OperacionPendiente
  /** Identifica cada cambio: si llega otro sobre la misma publicación, el anterior no lo borra. */
  marca: string
}

type Registro = Record<string, Pendiente>

/** Devuelve null si este navegador todavía no usó el registro (antes de la versión con pendientes). */
export function leerPendientes(): Registro | null {
  return leer<Registro | null>(CLAVES.pendientes, null)
}

export function obtenerPendientes(): Registro {
  return leerPendientes() ?? {}
}

export function contarPendientes(): number {
  return Object.keys(obtenerPendientes()).length
}

/** Anota un cambio y devuelve su marca, que se usa para confirmarlo. */
export function anotarPendiente(id: string, operacion: OperacionPendiente): string {
  const marca = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  escribir(CLAVES.pendientes, { ...obtenerPendientes(), [id]: { operacion, marca } })
  return marca
}

/** Borra el pendiente solo si sigue siendo el mismo cambio que se envió. */
export function confirmarPendiente(id: string, marca: string): void {
  const registro = obtenerPendientes()
  if (registro[id]?.marca !== marca) return

  const { [id]: _confirmado, ...resto } = registro
  escribir(CLAVES.pendientes, resto)
}

export function iniciarRegistro(registro: Registro): void {
  escribir(CLAVES.pendientes, registro)
}
