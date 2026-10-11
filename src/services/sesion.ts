import type { Usuario } from '../types'
import { CLAVES, borrar, escribir, leer } from './almacenamiento'

/**
 * Sesión del usuario en este navegador: sus datos y la llave (token) que
 * entrega la hoja al iniciar sesión. Toda modificación viaja con esa llave y
 * el Apps Script la verifica.
 *
 * Si la hoja responde que la llave venció, la sesión se cierra y se avisa a
 * las pantallas para que pidan volver a ingresar.
 */

interface SesionGuardada {
  usuario: Usuario
  token: string
}

const oyentes = new Set<() => void>()

export function alCambiarSesion(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

function avisar(): void {
  oyentes.forEach((oyente) => oyente())
}

function leerSesion(): SesionGuardada | null {
  const sesion = leer<SesionGuardada | null>(CLAVES.sesion, null)
  return sesion?.token && sesion.usuario ? sesion : null
}

export function obtenerUsuario(): Usuario | null {
  return leerSesion()?.usuario ?? null
}

export function obtenerToken(): string {
  return leerSesion()?.token ?? ''
}

export function guardarSesion(usuario: Usuario, token: string): void {
  escribir(CLAVES.sesion, { usuario, token })
  avisar()
}

/** Reemplaza los datos del usuario conservando la llave. */
export function actualizarUsuario(usuario: Usuario): void {
  const sesion = leerSesion()
  if (sesion) escribir(CLAVES.sesion, { ...sesion, usuario })
}

export function borrarSesion(): void {
  borrar(CLAVES.sesion)
  avisar()
}

let vencida = false

/** La hoja rechazó la llave: se cierra la sesión y se recuerda para explicarlo al ingresar. */
export function marcarSesionVencida(): void {
  if (!leerSesion()) return
  vencida = true
  borrarSesion()
}

/** true una sola vez después de que la sesión venció. */
export function consumirAvisoSesionVencida(): boolean {
  const valor = vencida
  vencida = false
  return valor
}
