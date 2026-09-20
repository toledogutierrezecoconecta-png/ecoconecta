/**
 * ============================================================
 *  CONEXIÓN CON GOOGLE SHEETS
 * ============================================================
 *
 * Pegá acá la URL que te entrega Google al implementar el Apps Script
 * (apps-script/Codigo.gs). Tiene esta forma:
 *
 *   https://script.google.com/macros/s/AKfycb.../exec
 *
 * Mientras esté vacía, la aplicación funciona igual: guarda todo en el
 * navegador (localStorage) y no intenta ninguna llamada de red.
 *
 * Los pasos para obtener la URL están en README.md.
 */
export const URL_APPS_SCRIPT = ''

/**
 * Permite probar la conexión sin recompilar: si en la consola del navegador
 * ejecutás localStorage.setItem('ecoconecta.sheetsUrl', 'https://...'),
 * esa URL tiene prioridad sobre la constante de arriba.
 */
export function obtenerUrlSheets(): string {
  try {
    const manual = localStorage.getItem('ecoconecta.sheetsUrl')
    if (manual && manual.startsWith('https://')) return manual
  } catch {
    /* localStorage bloqueado: se ignora y se usa la constante. */
  }
  return URL_APPS_SCRIPT
}

export function haySheetsConfigurado(): boolean {
  return obtenerUrlSheets().length > 0
}

/** Número de WhatsApp de contacto de EcoConecta SCZ. */
export const WHATSAPP_SOPORTE = '59178906939'

/** Datos de contacto institucionales de EcoConecta SCZ. */
export const EMPRESA = {
  nombre: 'EcoConecta SCZ',
  correo: 'toledogutierrezecoconecta@gmail.com',
  telefono: '78906939',
  ciudad: 'Santa Cruz de la Sierra, Bolivia',
} as const

/** Prefijo internacional de Bolivia, usado al armar los enlaces de contacto. */
export const PREFIJO_PAIS = '591'
