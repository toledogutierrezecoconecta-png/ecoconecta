import type { Unidad } from '../types'

/**
 * ============================================================================
 *  Tabla de precios de referencia de EcoConecta SCZ
 * ============================================================================
 *
 * A diferencia de un marketplace tradicional, acá el precio NO lo define el
 * negocio que publica: lo define EcoConecta SCZ a partir de un estudio de mercado
 * con las empresas recicladoras de Santa Cruz.
 *
 * El motivo es simple: un restaurante no sabe cuánto vale su aceite usado. Sin
 * una referencia, o lo regala (pierde dinero) o pide de más (nadie lo contacta).
 *
 * Se trabaja con RANGOS y no con un precio único porque el valor real depende
 * del estado del material: limpio o con impurezas, seco o húmedo, prensado o
 * suelto, y del volumen disponible.
 *
 * ⚠️  Los valores de abajo son de DEMOSTRACIÓN. Reemplazalos por los resultados
 *     del estudio de mercado real y actualizá VIGENCIA_PRECIOS.
 */

export interface PrecioReferencia {
  materialId: string
  unidad: Unidad
  /** null cuando el material no tiene valor de mercado y se entrega en donación. */
  minimo: number | null
  maximo: number | null
  /** Qué hace que el precio suba o baje dentro del rango. */
  factores: string
}

/** Mes de la última actualización del estudio de mercado. */
export const VIGENCIA_PRECIOS = 'septiembre de 2026'

export const PRECIOS_REFERENCIA: PrecioReferencia[] = [
  {
    materialId: 'aceite-vegetal',
    unidad: 'litros',
    minimo: 1.8,
    maximo: 2.5,
    factores:
      'Sube si está filtrado, sin agua ni restos de comida, y entregado en bidones cerrados.',
  },
  {
    materialId: 'posos-cafe',
    unidad: 'kg',
    minimo: 0.3,
    maximo: 0.8,
    factores: 'Sube si está seco y en bolsas selladas. La humedad reduce el valor.',
  },
  {
    materialId: 'restos-poda',
    unidad: 'kg',
    minimo: null,
    maximo: null,
    factores:
      'Sin valor de mercado en la ciudad: se entrega en donación a compostadores y viveros.',
  },
  {
    materialId: 'descarte-frutas',
    unidad: 'kg',
    minimo: null,
    maximo: null,
    factores:
      'Sin valor de mercado: se entrega en donación para alimentación animal o compostaje.',
  },
  {
    materialId: 'carton-prensado',
    unidad: 'kg',
    minimo: 0.8,
    maximo: 1.4,
    factores: 'Sube si está prensado en fardos, seco y sin cintas ni grapas.',
  },
  {
    materialId: 'pallets-madera',
    unidad: 'unidades',
    minimo: 12,
    maximo: 18,
    factores: 'Sube si la estructura está firme y las tablas no están quebradas.',
  },
  {
    materialId: 'retazos-plastico',
    unidad: 'kg',
    minimo: 1.2,
    maximo: 2,
    factores: 'Sube si está separado por tipo de plástico y libre de etiquetas.',
  },
  {
    materialId: 'chatarra-metalica',
    unidad: 'kg',
    minimo: 1.5,
    maximo: 2.8,
    factores:
      'Sube si el metal está separado por tipo. Sigue los precios internacionales, se revisa cada mes.',
  },
  {
    materialId: 'retazos-textiles',
    unidad: 'kg',
    minimo: 2.5,
    maximo: 3.5,
    factores: 'Sube si los retazos son de algodón o mezclilla y están clasificados por color.',
  },
]

export function buscarPrecio(materialId: string): PrecioReferencia | undefined {
  return PRECIOS_REFERENCIA.find((precio) => precio.materialId === materialId)
}

/** true cuando el material no tiene valor de mercado y solo puede donarse. */
export function esSoloDonacion(materialId: string): boolean {
  const precio = buscarPrecio(materialId)
  return !precio || precio.minimo === null
}
