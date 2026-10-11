import type { TipoUsuario } from '../types'

/**
 * Qué puede hacer cada tipo de usuario.
 *
 * El oferente publica, el recolector busca y "ambos" hace las dos cosas. Toda
 * la interfaz consulta estas funciones en lugar de comparar el tipo a mano.
 */

export function puedePublicar(tipo: TipoUsuario): boolean {
  return tipo !== 'recolector'
}

export function buscaMateriales(tipo: TipoUsuario): boolean {
  return tipo !== 'oferente'
}
