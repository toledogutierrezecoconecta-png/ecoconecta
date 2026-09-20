import type { Categoria, TipoUsuario, Unidad } from '../types'

/** Categorías y materiales aprovechables que acepta la plataforma. */
export const CATEGORIAS: Categoria[] = [
  {
    id: 'organicos',
    nombre: 'Orgánicos y gastronomía',
    descripcion: 'Residuos de cocinas, cafeterías, ferias y mantenimiento de áreas verdes.',
    materiales: [
      { id: 'aceite-vegetal', nombre: 'Aceite vegetal usado', unidadSugerida: 'litros' },
      { id: 'posos-cafe', nombre: 'Posos de café', unidadSugerida: 'kg' },
      { id: 'restos-poda', nombre: 'Restos de poda', unidadSugerida: 'kg' },
      { id: 'descarte-frutas', nombre: 'Descarte de frutas y verduras', unidadSugerida: 'kg' },
    ],
  },
  {
    id: 'secos',
    nombre: 'Secos e industriales',
    descripcion: 'Materiales de talleres, fábricas, imprentas, comercios y textileras.',
    materiales: [
      { id: 'carton-prensado', nombre: 'Cartón prensado', unidadSugerida: 'kg' },
      { id: 'pallets-madera', nombre: 'Pallets de madera', unidadSugerida: 'unidades' },
      { id: 'retazos-plastico', nombre: 'Retazos de plástico', unidadSugerida: 'kg' },
      { id: 'chatarra-metalica', nombre: 'Chatarra metálica', unidadSugerida: 'kg' },
      { id: 'retazos-textiles', nombre: 'Retazos textiles', unidadSugerida: 'kg' },
    ],
  },
]

/**
 * Distritos municipales de Santa Cruz de la Sierra usados como referencia geográfica.
 * La estructura ya contempla coordenadas para incorporar mapas más adelante.
 */
export const ZONAS = [
  'DM-1',
  'DM-2',
  'DM-3',
  'DM-4',
  'DM-5',
  'DM-6',
  'DM-7',
  'DM-8',
] as const

export const UNIDADES: { valor: Unidad; etiqueta: string }[] = [
  { valor: 'kg', etiqueta: 'Kilogramos (kg)' },
  { valor: 'litros', etiqueta: 'Litros' },
  { valor: 'unidades', etiqueta: 'Unidades' },
  { valor: 'toneladas', etiqueta: 'Toneladas' },
  { valor: 'm3', etiqueta: 'Metros cúbicos (m³)' },
  { valor: 'bolsas', etiqueta: 'Bolsas' },
]

export const FRECUENCIAS = [
  'Una sola vez',
  'Todos los días',
  'Semanal',
  'Quincenal',
  'Mensual',
  'Según acumulación',
] as const

export const TIPOS_USUARIO: { valor: TipoUsuario; titulo: string; detalle: string }[] = [
  {
    valor: 'oferente',
    titulo: 'Soy oferente',
    detalle: 'Mi negocio genera materiales aprovechables y quiero publicarlos.',
  },
  {
    valor: 'recolector',
    titulo: 'Soy recolector/comprador',
    detalle: 'Busco materiales para reciclar, transformar o revender.',
  },
  {
    valor: 'ambos',
    titulo: 'Ambos',
    detalle: 'Genero residuos y también busco materiales de otros negocios.',
  },
]

/** Abreviatura que se muestra junto a la cantidad y el precio. */
export const ABREVIATURA_UNIDAD: Record<Unidad, string> = {
  kg: 'kg',
  litros: 'L',
  unidades: 'u',
  toneladas: 't',
  m3: 'm³',
  bolsas: 'bolsas',
}

/** Singular de la unidad, para textos del tipo "Bs. 2 por litro". */
export const UNIDAD_SINGULAR: Record<Unidad, string> = {
  kg: 'kg',
  litros: 'litro',
  unidades: 'unidad',
  toneladas: 'tonelada',
  m3: 'm³',
  bolsas: 'bolsa',
}

export function buscarCategoria(id: string): Categoria | undefined {
  return CATEGORIAS.find((categoria) => categoria.id === id)
}

export function buscarMaterial(id: string) {
  for (const categoria of CATEGORIAS) {
    const material = categoria.materiales.find((item) => item.id === id)
    if (material) return { material, categoria }
  }
  return undefined
}

export const TODOS_LOS_MATERIALES = CATEGORIAS.flatMap((categoria) =>
  categoria.materiales.map((material) => ({ ...material, categoriaId: categoria.id })),
)
