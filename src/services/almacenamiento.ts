/**
 * Acceso a localStorage con manejo de errores.
 *
 * localStorage puede fallar en modo incógnito, con cookies bloqueadas o al
 * superar la cuota. Todas las lecturas y escrituras pasan por acá para que un
 * fallo nunca rompa la aplicación.
 */

const PREFIJO = 'ecoconecta.'

export const CLAVES = {
  // v2: las publicaciones dejaron de llevar precio propio y pasaron al modelo
  // de precios de referencia. Subir la versión descarta los datos del modelo
  // anterior en los navegadores que ya habían usado la plataforma.
  publicaciones: `${PREFIJO}publicaciones.v2`,
  // Cuentas creadas antes de que vivieran en la hoja. Solo se leen para
  // pasarlas a la hoja la primera vez que su dueño inicia sesión.
  usuariosLocales: `${PREFIJO}usuarios.v1`,
  // v2: la sesión guarda también la llave que entrega la hoja. Las sesiones
  // v1 (sin llave) se descartan y piden volver a ingresar.
  sesion: `${PREFIJO}sesion.v2`,
  guardados: `${PREFIJO}guardados.v1`,
  contactados: `${PREFIJO}contactados.v1`,
  pendientes: `${PREFIJO}pendientes.v1`,
} as const

export function leer<T>(clave: string, porDefecto: T): T {
  try {
    const crudo = localStorage.getItem(clave)
    if (!crudo) return porDefecto
    return JSON.parse(crudo) as T
  } catch {
    return porDefecto
  }
}

export function escribir(clave: string, valor: unknown): boolean {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
    return true
  } catch (error) {
    console.warn(`[EcoConecta SCZ] No se pudo guardar "${clave}" en el navegador.`, error)
    return false
  }
}

export function borrar(clave: string): void {
  try {
    localStorage.removeItem(clave)
  } catch {
    /* Sin acción: el dato simplemente no se elimina. */
  }
}

/** Identificador único simple, suficiente para el MVP. */
export function generarId(prefijo: string): string {
  return `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
