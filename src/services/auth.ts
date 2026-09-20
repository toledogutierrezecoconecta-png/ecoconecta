import type { CredencialesRegistro, Usuario, UsuarioAlmacenado } from '../types'
import { CLAVES, borrar, escribir, generarId, leer } from './almacenamiento'
import { sincronizarUsuario } from './sheets'

/**
 * Autenticación simulada del MVP.
 *
 * No reemplaza a un sistema real: los datos viven en el navegador. Aun así la
 * contraseña nunca se guarda en texto plano (se almacena su hash SHA-256) y
 * tampoco se envía a la hoja de cálculo.
 *
 * Al incorporar autenticación real (Supabase Auth, Firebase Auth), se
 * reemplazan estas funciones manteniendo las mismas firmas.
 */

async function calcularHash(texto: string): Promise<string> {
  // crypto.subtle solo existe en contextos seguros (https o localhost).
  if (globalThis.crypto?.subtle) {
    const datos = new TextEncoder().encode(texto)
    const resumen = await globalThis.crypto.subtle.digest('SHA-256', datos)
    return Array.from(new Uint8Array(resumen))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  // Respaldo simple para entornos sin crypto.subtle.
  let acumulado = 0
  for (let i = 0; i < texto.length; i += 1) {
    acumulado = (acumulado << 5) - acumulado + texto.charCodeAt(i)
    acumulado |= 0
  }
  return `fallback-${Math.abs(acumulado).toString(16)}`
}

function cargarUsuarios(): UsuarioAlmacenado[] {
  return leer<UsuarioAlmacenado[]>(CLAVES.usuarios, [])
}

function sinClave(usuario: UsuarioAlmacenado): Usuario {
  const { hashClave: _hashClave, ...publico } = usuario
  return publico
}

export async function registrar(credenciales: CredencialesRegistro): Promise<Usuario> {
  const usuarios = cargarUsuarios()
  const correo = credenciales.correo.trim().toLowerCase()

  if (usuarios.some((usuario) => usuario.correo === correo)) {
    throw new Error('Ya existe una cuenta registrada con ese correo electrónico.')
  }

  const nuevo: UsuarioAlmacenado = {
    id: generarId('usr'),
    empresa: credenciales.empresa.trim(),
    contacto: credenciales.contacto.trim(),
    telefono: credenciales.telefono.replace(/\s+/g, ''),
    correo,
    tipo: credenciales.tipo,
    creadoEn: new Date().toISOString(),
    hashClave: await calcularHash(credenciales.clave),
  }

  escribir(CLAVES.usuarios, [...usuarios, nuevo])

  const publico = sinClave(nuevo)
  iniciarSesionLocal(publico)
  void sincronizarUsuario(publico)

  return publico
}

export async function iniciarSesion(correo: string, clave: string): Promise<Usuario> {
  const usuarios = cargarUsuarios()
  const buscado = usuarios.find((usuario) => usuario.correo === correo.trim().toLowerCase())

  if (!buscado) {
    throw new Error('No encontramos una cuenta con ese correo. Registrate para continuar.')
  }

  const hash = await calcularHash(clave)
  if (hash !== buscado.hashClave) {
    throw new Error('La contraseña no es correcta.')
  }

  const publico = sinClave(buscado)
  iniciarSesionLocal(publico)
  return publico
}

function iniciarSesionLocal(usuario: Usuario): void {
  escribir(CLAVES.sesion, usuario)
}

export function obtenerSesion(): Usuario | null {
  return leer<Usuario | null>(CLAVES.sesion, null)
}

export function cerrarSesion(): void {
  borrar(CLAVES.sesion)
}

export function actualizarPerfil(cambios: Partial<Usuario>): Usuario | null {
  const actual = obtenerSesion()
  if (!actual) return null

  const actualizado = { ...actual, ...cambios }
  escribir(CLAVES.sesion, actualizado)

  const usuarios = cargarUsuarios().map((usuario) =>
    usuario.id === actual.id ? { ...usuario, ...cambios } : usuario,
  )
  escribir(CLAVES.usuarios, usuarios)

  return actualizado
}
