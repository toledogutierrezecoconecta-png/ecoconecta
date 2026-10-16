import type { MedioContacto, Publicacion } from '../types'
import { valorDePublicacion } from '../utils/formato'
import { haySheetsConfigurado, obtenerUrlSheets } from './config'
import { marcarSesionVencida, obtenerToken } from './sesion'

/**
 * Cliente del Apps Script que hace de servidor sobre la hoja de cálculo.
 *
 * Detalles importantes de implementación:
 *
 * 1. Los envíos usan URLSearchParams (application/x-www-form-urlencoded).
 *    Eso los convierte en "simple requests" y evita el preflight CORS, que es
 *    el motivo por el que fallan la mayoría de las integraciones con Apps Script.
 *
 * 2. Cada pedido viaja con la llave de sesión (token). El script la verifica y
 *    decide si el usuario puede hacer lo que pide.
 *
 * 3. Si el script responde que la llave venció, se cierra la sesión local.
 */

const TIEMPO_LIMITE_MS = 15000

/** Respuesta del Apps Script. `codigo` explica el rechazo cuando ok es false. */
export interface RespuestaHoja {
  ok: boolean
  codigo?: string
  error?: string
  [campo: string]: unknown
}

async function conLimiteDeTiempo(peticion: (senal: AbortSignal) => Promise<Response>) {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS)
  try {
    return await peticion(controlador.signal)
  } finally {
    clearTimeout(temporizador)
  }
}

/**
 * Hace un pedido al script y devuelve su respuesta, o null si no hubo
 * conexión (sin internet, tiempo agotado o la hoja no está configurada).
 */
export async function llamar(
  accion: string,
  datos: Record<string, unknown> = {},
): Promise<RespuestaHoja | null> {
  if (!haySheetsConfigurado()) return null

  const cuerpo = new URLSearchParams({ accion, datos: JSON.stringify(datos), token: obtenerToken() })

  try {
    const respuesta = await conLimiteDeTiempo((senal) =>
      fetch(obtenerUrlSheets(), { method: 'POST', body: cuerpo, signal: senal }),
    )
    if (!respuesta.ok) return null

    const contenido = (await respuesta.json()) as RespuestaHoja
    if (contenido.codigo === 'sesion_invalida') marcarSesionVencida()
    if (!contenido.ok) console.warn(`[EcoConecta SCZ] La hoja rechazó "${accion}".`, contenido)
    return contenido
  } catch (error) {
    console.warn(`[EcoConecta SCZ] No se pudo conectar con la hoja ("${accion}").`, error)
    return null
  }
}

/**
 * Resultado de un cambio:
 *   - "confirmado": la hoja lo guardó.
 *   - "reintentar": no hubo conexión o falta la sesión; queda pendiente.
 *   - "rechazado": la hoja no lo acepta (por ejemplo, no es del usuario);
 *     reintentarlo no sirve y manda la versión de la hoja.
 */
export type ResultadoEnvio = 'confirmado' | 'reintentar' | 'rechazado'

async function enviar(accion: string, datos: Record<string, unknown>): Promise<ResultadoEnvio> {
  const respuesta = await llamar(accion, datos)
  if (!respuesta) return 'reintentar'
  if (respuesta.ok) return 'confirmado'
  if (respuesta.codigo === 'sesion_invalida' || respuesta.codigo === 'error_interno') return 'reintentar'
  return 'rechazado'
}

/**
 * Prepara la publicación para la hoja.
 *
 * La foto no viaja (llenaría la planilla) y se agregan los valores estimados
 * ya calculados, que son los que sirven para analizar el mercado desde la hoja.
 * El dueño, el contacto y el contador los fija el script, no la web.
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

export function sincronizarPublicacionNueva(publicacion: Publicacion): Promise<ResultadoEnvio> {
  return enviar('crear_publicacion', paraHoja(publicacion))
}

export function sincronizarPublicacionEditada(publicacion: Publicacion): Promise<ResultadoEnvio> {
  return enviar('actualizar_publicacion', paraHoja(publicacion))
}

export function sincronizarEliminacion(id: string): Promise<ResultadoEnvio> {
  return enviar('eliminar_publicacion', { id })
}

export function sincronizarContacto(id: string, medio: MedioContacto): Promise<ResultadoEnvio> {
  return enviar('registrar_contacto', { id, medio })
}

/**
 * Trae las publicaciones de la hoja (lectura pública, sin sesión).
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
