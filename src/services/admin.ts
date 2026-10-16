import type { EstadoPublicacion, TipoUsuario, Unidad } from '../types'
import { llamar } from './sheets'
import type { RespuestaHoja } from './sheets'

/**
 * Acceso del administrador a los datos de la hoja.
 *
 * La clave NO está en el código de la web (que es pública): la valida el
 * Apps Script contra la propiedad CLAVE_ADMIN, y es lo único que entrega los
 * correos y teléfonos de los registrados. En el navegador se guarda solo en
 * sessionStorage, que se borra al cerrar el navegador.
 */

const CLAVE_SESION = 'ecoconecta.admin'

export interface UsuarioAdmin {
  id: string
  empresa: string
  contacto: string
  telefono: string
  correo: string
  tipo: TipoUsuario
  creadoEn: string
  fecha: string
  hora: string
  correoConfirmacion: string
}

export interface PublicacionAdmin {
  id: string
  titulo: string
  materialId: string
  cantidad: number
  unidad: Unidad
  zona: string
  empresa: string
  contacto: string
  telefono: string
  estado: EstadoPublicacion
  contactos: number
  creadaEn: string
  fecha: string
  hora: string
}

export interface ContactoAdmin {
  fecha: string
  hora: string
  creadoEn: string
  titulo: string
  publicacionId: string
  /** Quién consultó (vacío si fue un visitante sin cuenta). */
  empresa: string
  contacto: string
  tipo: string
}

export interface DatosAdmin {
  urlHoja: string
  correosRestantesHoy: number
  usuarios: UsuarioAdmin[]
  publicaciones: PublicacionAdmin[]
  contactos: ContactoAdmin[]
}

/** Error del panel. `codigo` es 'clave_admin' cuando la clave no sirve. */
export class ErrorAdmin extends Error {
  readonly codigo: string

  constructor(mensaje: string, codigo = '') {
    super(mensaje)
    this.name = 'ErrorAdmin'
    this.codigo = codigo
  }
}

export const EVENTO_ADMIN = 'ecoconecta:admin'

export function leerClaveAdmin(): string {
  try {
    return sessionStorage.getItem(CLAVE_SESION) ?? ''
  } catch {
    return ''
  }
}

function guardarClaveAdmin(clave: string): void {
  try {
    if (clave) sessionStorage.setItem(CLAVE_SESION, clave)
    else sessionStorage.removeItem(CLAVE_SESION)
  } catch {
    /* Sin sessionStorage la clave se pide en cada visita. */
  }
  window.dispatchEvent(new Event(EVENTO_ADMIN))
}

export function hayAdminActivo(): boolean {
  return leerClaveAdmin() !== ''
}

async function pedir(accion: string, datos: Record<string, unknown>): Promise<RespuestaHoja> {
  const respuesta = await llamar(accion, datos)
  if (!respuesta) {
    throw new ErrorAdmin('No pudimos conectarnos con la hoja. Revisá tu conexión e intentá de nuevo.')
  }
  if (!respuesta.ok) {
    throw new ErrorAdmin(respuesta.error ?? 'No se pudo completar la operación.', respuesta.codigo ?? '')
  }
  return respuesta
}

export async function obtenerDatosAdmin(clave = leerClaveAdmin()): Promise<DatosAdmin> {
  const respuesta = await pedir('admin_datos', { clave })
  guardarClaveAdmin(clave)
  return respuesta as unknown as DatosAdmin
}

export function salirAdmin(): void {
  guardarClaveAdmin('')
}

export async function cambiarEstadoAdmin(id: string, estado: EstadoPublicacion): Promise<void> {
  await pedir('admin_publicacion', { clave: leerClaveAdmin(), id, estado })
}

export async function eliminarPublicacionAdmin(id: string): Promise<void> {
  await pedir('admin_publicacion', { clave: leerClaveAdmin(), id, eliminar: true })
}

/** Descarga filas como CSV que Excel abre bien (UTF-8 con BOM y punto y coma). */
export function descargarCsv(nombre: string, filas: (string | number)[][]): void {
  const celda = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`
  const contenido = '﻿' + filas.map((fila) => fila.map(celda).join(';')).join('\r\n')
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }))
  enlace.download = nombre
  enlace.click()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)
}
