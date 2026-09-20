import type { Publicacion, Usuario } from '../types'
import { valorDePublicacion } from '../utils/formato'
import { haySheetsConfigurado, obtenerUrlSheets } from './config'

/**
 * Cliente de la Web App de Google Apps Script que escribe y lee la hoja de cálculo.
 *
 * Detalles importantes de implementación:
 *
 * 1. Los envíos usan URLSearchParams (application/x-www-form-urlencoded).
 *    Eso los convierte en "simple requests" y evita el preflight CORS, que es
 *    el motivo por el que fallan la mayoría de las integraciones con Apps Script.
 *
 * 2. Ninguna llamada bloquea la interfaz: si la hoja no está configurada o la red
 *    falla, la aplicación sigue funcionando con los datos locales.
 */

const TIEMPO_LIMITE_MS = 12000

async function conLimiteDeTiempo(peticion: (senal: AbortSignal) => Promise<Response>) {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS)
  try {
    return await peticion(controlador.signal)
  } finally {
    clearTimeout(temporizador)
  }
}

async function enviar(accion: string, datos: Record<string, unknown>): Promise<boolean> {
  if (!haySheetsConfigurado()) return false

  const cuerpo = new URLSearchParams({ accion, datos: JSON.stringify(datos) })

  try {
    const respuesta = await conLimiteDeTiempo((senal) =>
      fetch(obtenerUrlSheets(), { method: 'POST', body: cuerpo, signal: senal }),
    )
    return respuesta.ok
  } catch (error) {
    console.warn(`[EcoConecta SCZ] No se pudo sincronizar "${accion}" con Google Sheets.`, error)
    return false
  }
}

/** Registra un usuario nuevo en la hoja. Nunca se envía la contraseña. */
export function sincronizarUsuario(usuario: Usuario): Promise<boolean> {
  const { id, empresa, contacto, telefono, correo, tipo, creadoEn } = usuario
  return enviar('registrar_usuario', { id, empresa, contacto, telefono, correo, tipo, creadoEn })
}

/**
 * Prepara la publicación para la hoja.
 *
 * La foto no viaja (llenaría la planilla) y se agregan los valores estimados
 * ya calculados, que son los que sirven para analizar el mercado desde la hoja.
 */
function paraHoja(publicacion: Publicacion) {
  const { fotoId: _fotoId, ...resto } = publicacion
  const valor = valorDePublicacion(publicacion)

  return {
    ...resto,
    valorEstimadoMin: valor ? Math.round(valor.minimo) : '',
    valorEstimadoMax: valor ? Math.round(valor.maximo) : '',
  }
}

export function sincronizarPublicacionNueva(publicacion: Publicacion): Promise<boolean> {
  return enviar('crear_publicacion', paraHoja(publicacion))
}

export function sincronizarPublicacionEditada(publicacion: Publicacion): Promise<boolean> {
  return enviar('actualizar_publicacion', paraHoja(publicacion))
}

export function sincronizarEliminacion(id: string): Promise<boolean> {
  return enviar('eliminar_publicacion', { id })
}

export function sincronizarContacto(id: string): Promise<boolean> {
  return enviar('registrar_contacto', { id, fecha: new Date().toISOString() })
}

/**
 * Trae las publicaciones que otros dispositivos guardaron en la hoja.
 * Devuelve null si la hoja no está configurada o la consulta falla.
 */
export async function descargarPublicaciones(): Promise<Publicacion[] | null> {
  if (!haySheetsConfigurado()) return null

  const url = `${obtenerUrlSheets()}?accion=listar_publicaciones&t=${Date.now()}`

  try {
    const respuesta = await conLimiteDeTiempo((senal) => fetch(url, { signal: senal }))
    if (!respuesta.ok) return null

    const contenido = (await respuesta.json()) as { ok?: boolean; publicaciones?: unknown }
    if (!contenido?.ok || !Array.isArray(contenido.publicaciones)) return null

    return contenido.publicaciones as Publicacion[]
  } catch (error) {
    console.warn('[EcoConecta SCZ] No se pudieron leer las publicaciones de Google Sheets.', error)
    return null
  }
}
