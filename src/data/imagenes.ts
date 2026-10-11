import aceite from '../assets/materiales/aceite.webp'
import cafe from '../assets/materiales/cafe.webp'
import carton from '../assets/materiales/carton.webp'
import frutas from '../assets/materiales/frutas.webp'
import hero from '../assets/materiales/hero.webp'
import metal from '../assets/materiales/metal.webp'
import pallets from '../assets/materiales/pallets.webp'
import plastico from '../assets/materiales/plastico.webp'
import poda from '../assets/materiales/poda.webp'
import portadaEscritorio from '../assets/portada/portada-escritorio.webp'
import portadaMovil from '../assets/portada/portada-movil.webp'
import textil from '../assets/materiales/textil.webp'

/**
 * Fotografías de cada material.
 *
 * Se importan (en vez de referenciarlas por ruta) para que Vite las incluya en
 * la compilación con la URL correcta: el sitio se publica en una subcarpeta de
 * GitHub Pages y una ruta absoluta como "/img/aceite.webp" no funcionaría ahí.
 *
 * Están en WebP a 900x600: pesan la mitad que en JPG y alcanzan para el ancho
 * completo del detalle.
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

/** Ilustraciones de portada. Los botones se superponen sobre ellas. */
export const PORTADA_ESCRITORIO = portadaEscritorio
export const PORTADA_MOVIL = portadaMovil

/** Tamaño real de cada ilustración, para reservar su espacio antes de que cargue. */
export const MEDIDAS_PORTADA = {
  escritorio: { ancho: 1536, alto: 1024 },
  movil: { ancho: 940, alto: 1672 },
} as const

export function fotoDeMaterial(materialId: string): string | undefined {
  return FOTO_MATERIAL[materialId]
}
