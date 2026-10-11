import type { CredencialesRegistro, PerfilEditable, Usuario, UsuarioAlmacenado } from '../types'
import { CLAVES, escribir, leer } from './almacenamiento'
import { borrarSesion, guardarSesion, obtenerUsuario, actualizarUsuario } from './sesion'
import { llamar } from './sheets'
import type { RespuestaHoja } from './sheets'

/**
 * Cuentas de usuario, guardadas en la hoja de Google.
 *
 * El Apps Script guarda la contraseña como hash con sal y, al ingresar,
 * entrega una llave de sesión que vence a los 60 días. Así la misma cuenta
 * funciona desde cualquier dispositivo y nadie puede modificar lo ajeno.
 */

const SIN_CONEXION =
  'No pudimos conectarnos con EcoConecta SCZ. Revisá tu conexión a internet e intentá de nuevo.'

interface RespuestaSesion extends RespuestaHoja {
  usuario?: Usuario
  token?: string
}

/** Convierte la respuesta del script en sesión iniciada, o en un error legible. */
function abrirSesion(respuesta: RespuestaSesion | null): Usuario {
  if (!respuesta) throw new Error(SIN_CONEXION)
  if (!respuesta.ok || !respuesta.usuario || !respuesta.token) {
    throw new Error(respuesta.error ?? 'No se pudo completar la operación.')
  }

  guardarSesion(respuesta.usuario, respuesta.token)
  return respuesta.usuario
}

export async function registrar(credenciales: CredencialesRegistro): Promise<Usuario> {
  const respuesta = (await llamar('registrar_usuario', { ...credenciales })) as RespuestaSesion | null
  return abrirSesion(respuesta)
}

export async function iniciarSesion(correo: string, clave: string): Promise<Usuario> {
  const respuesta = (await llamar('iniciar_sesion', { correo, clave })) as RespuestaSesion | null

  // Cuentas creadas antes de esta versión: vivían solo en el navegador y la
  // hoja no conoce su contraseña. Si este navegador tiene la cuenta y la
  // contraseña coincide, se pasa a la hoja con el mismo id.
  if (respuesta && (respuesta.codigo === 'cuenta_sin_clave' || respuesta.codigo === 'no_existe')) {
    const local = await buscarCuentaLocal(correo, clave)

    if (local) {
      const recuperada = (await llamar('reclamar_cuenta', {
        usuario: sinClave(local),
        clave,
      })) as RespuestaSesion | null
      const usuario = abrirSesion(recuperada)
      olvidarCuentaLocal(local.id)
      return usuario
    }

    if (respuesta.codigo === 'cuenta_sin_clave') {
      throw new Error(
        'Esta cuenta se creó en otro dispositivo con una versión anterior. Ingresá una vez desde ese dispositivo para activarla en todos los demás.',
      )
    }
    throw new Error('No encontramos una cuenta con ese correo. Registrate para continuar.')
  }

  return abrirSesion(respuesta)
}

export function obtenerSesion(): Usuario | null {
  return obtenerUsuario()
}

export function cerrarSesion(): void {
  // Se avisa a la hoja para que la llave deje de servir; no hace falta esperar.
  void llamar('cerrar_sesion')
  borrarSesion()
}

/** Guarda el perfil en la hoja. El script también actualiza las publicaciones del usuario. */
export async function actualizarPerfil(
  cambios: PerfilEditable,
): Promise<{ usuario: Usuario; publicacionesActualizadas: number }> {
  const respuesta = (await llamar('actualizar_perfil', { ...cambios })) as
    | (RespuestaSesion & { publicacionesActualizadas?: number })
    | null

  if (!respuesta) throw new Error(SIN_CONEXION)
  if (!respuesta.ok || !respuesta.usuario) {
    throw new Error(respuesta.error ?? 'No se pudieron guardar los cambios.')
  }

  actualizarUsuario(respuesta.usuario)
  return {
    usuario: respuesta.usuario,
    publicacionesActualizadas: respuesta.publicacionesActualizadas ?? 0,
  }
}

// ----------------------------------------------- cuentas de versiones previas

/** Mismo hash que usaba la versión anterior para guardar la contraseña en el navegador. */
async function hashAnterior(texto: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const resumen = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto))
    return Array.from(new Uint8Array(resumen))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  let acumulado = 0
  for (let i = 0; i < texto.length; i += 1) {
    acumulado = (acumulado << 5) - acumulado + texto.charCodeAt(i)
    acumulado |= 0
  }
  return `fallback-${Math.abs(acumulado).toString(16)}`
}

async function buscarCuentaLocal(correo: string, clave: string): Promise<UsuarioAlmacenado | null> {
  const cuentas = leer<UsuarioAlmacenado[]>(CLAVES.usuariosLocales, [])
  const cuenta = cuentas.find((item) => item.correo === correo.trim().toLowerCase())
  if (!cuenta) return null

  return (await hashAnterior(clave)) === cuenta.hashClave ? cuenta : null
}

/** Una vez en la hoja, la copia local (con su hash) ya no hace falta. */
function olvidarCuentaLocal(id: string): void {
  const cuentas = leer<UsuarioAlmacenado[]>(CLAVES.usuariosLocales, [])
  escribir(
    CLAVES.usuariosLocales,
    cuentas.filter((cuenta) => cuenta.id !== id),
  )
}

function sinClave(usuario: UsuarioAlmacenado): Usuario {
  const { hashClave: _hashClave, ...publico } = usuario
  return publico
}
