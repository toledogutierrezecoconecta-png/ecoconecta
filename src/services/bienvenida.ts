/**
 * Recuerda, solo hasta la próxima pantalla, que la cuenta se acaba de crear y
 * si salió el correo de confirmación. Se guarda en sessionStorage para que el
 * aviso sobreviva a la redirección pero no a una recarga posterior.
 */

const CLAVE = 'ecoconecta.bienvenida'

export interface Bienvenida {
  correo: string
  correoEnviado: boolean
}

export function anotarBienvenida(bienvenida: Bienvenida): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(bienvenida))
  } catch {
    /* Sin sessionStorage simplemente no se muestra el aviso. */
  }
}

/** Devuelve el aviso pendiente y lo borra, para que se vea una sola vez. */
export function tomarBienvenida(): Bienvenida | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    sessionStorage.removeItem(CLAVE)
    return crudo ? (JSON.parse(crudo) as Bienvenida) : null
  } catch {
    return null
  }
}
