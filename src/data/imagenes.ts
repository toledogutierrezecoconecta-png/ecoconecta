import aceite from '../assets/materiales/aceite.jpg'
import cafe from '../assets/materiales/cafe.jpg'
import carton from '../assets/materiales/carton.jpg'
import fondoPortada from '../assets/materiales/fondo-portada.jpg'
import frutas from '../assets/materiales/frutas.jpg'
import hero from '../assets/materiales/hero.jpg'
import metal from '../assets/materiales/metal.jpg'
import pallets from '../assets/materiales/pallets.jpg'
import plastico from '../assets/materiales/plastico.jpg'
import poda from '../assets/materiales/poda.jpg'
import portadaEscritorio from '../assets/portada/portada-escritorio.webp'
import portadaMovil from '../assets/portada/portada-movil.webp'
import textil from '../assets/materiales/textil.jpg'

/**
 * Fotografías de cada material.
 *
 * Se importan (en vez de referenciarlas por ruta) para que Vite las incluya en
 * la compilación con la URL correcta: el sitio se publica en una subcarpeta de
 * GitHub Pages y una ruta absoluta como "/img/aceite.jpg" no funcionaría ahí.
 *
 * Origen: Pexels, licencia de uso libre incluso comercial y sin atribución.
 */
export const FOTO_MATERIAL: Record<string, string> = {
  'aceite-vegetal': aceite,
  'posos-cafe': cafe,
  'restos-poda': poda,
  'descarte-frutas': frutas,
  'carton-prensado': carton,
  'pallets-madera': pallets,
  'retazos-plastico': plastico,
  'chatarra-metalica': metal,
  'retazos-textiles': textil,
}

export const FOTO_PORTADA = hero

/** Fondo a pantalla completa de la portada: fardos de cartón listos para reciclar. */
export const FONDO_PORTADA = fondoPortada

/** Ilustraciones de portada. Los botones se superponen sobre ellas. */
export const PORTADA_ESCRITORIO = portadaEscritorio
export const PORTADA_MOVIL = portadaMovil

export function fotoDeMaterial(materialId: string): string | undefined {
  return FOTO_MATERIAL[materialId]
}
