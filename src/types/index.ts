/**
 * Modelos de dominio de EcoConecta SCZ.
 *
 * Estas interfaces son el contrato entre la interfaz y la capa de servicios.
 * Al migrar de localStorage/Google Sheets a Supabase, PostgreSQL o una API REST
 * solo cambian los adaptadores de `services/storage`; estos tipos no se tocan.
 */

export type TipoUsuario = 'oferente' | 'recolector' | 'ambos'

export type EstadoPublicacion = 'disponible' | 'pausada' | 'concretada'

/**
 * El precio no lo fija el oferente: EcoConecta SCZ publica un rango de referencia
 * por material (ver data/precios.ts). El oferente solo decide si cobra según esa
 * referencia o si entrega el material en donación.
 */
export type ModalidadPrecio = 'referencia' | 'donacion'

export type Unidad = 'kg' | 'litros' | 'unidades' | 'toneladas' | 'm3' | 'bolsas'

export interface Usuario {
  id: string
  empresa: string
  contacto: string
  telefono: string
  correo: string
  tipo: TipoUsuario
  creadoEn: string
}

/** Lo que se guarda localmente: el usuario más el hash de su contraseña. */
export interface UsuarioAlmacenado extends Usuario {
  hashClave: string
}

export interface Publicacion {
  id: string
  titulo: string
  categoriaId: string
  materialId: string
  descripcion: string
  cantidad: number
  unidad: Unidad
  frecuencia: string
  zona: string
  direccion: string
  modalidadPrecio: ModalidadPrecio
  /** Clave de la foto en IndexedDB. Null cuando no se subió imagen. */
  fotoId: string | null
  fechaDisponible: string
  estado: EstadoPublicacion
  contactos: number
  usuarioId: string
  empresa: string
  contacto: string
  telefono: string
  creadaEn: string
  /** 'demo' son las publicaciones de ejemplo; 'usuario' las creadas en la app. */
  origen: 'demo' | 'usuario'
}

/** Campos que el formulario de publicación entrega; el resto lo completa el servicio. */
export type BorradorPublicacion = Omit<
  Publicacion,
  'id' | 'estado' | 'contactos' | 'usuarioId' | 'empresa' | 'contacto' | 'telefono' | 'creadaEn' | 'origen'
>

export interface Material {
  id: string
  nombre: string
  unidadSugerida: Unidad
}

export interface Categoria {
  id: string
  nombre: string
  descripcion: string
  materiales: Material[]
}

export interface FiltrosExploracion {
  busqueda: string
  categoriaId: string
  materialId: string
  zona: string
  soloDonaciones: boolean
  soloConValor: boolean
  soloDisponibles: boolean
}

/** Valor total estimado de una publicación, calculado con la tabla de referencia. */
export interface ValorEstimado {
  minimo: number
  maximo: number
}

export interface CredencialesRegistro {
  empresa: string
  contacto: string
  telefono: string
  correo: string
  clave: string
  tipo: TipoUsuario
}
