import type { Publicacion } from '../types'

/**
 * Publicaciones de demostración.
 *
 * Se cargan la primera vez que alguien abre la plataforma para que el marketplace
 * tenga contenido desde el primer acceso. Son datos ficticios: los nombres de
 * empresa y los teléfonos no corresponden a negocios reales.
 *
 * Al conectar un backend real, este archivo deja de usarse (ver services/storage).
 */

const HOY = new Date()

function enDias(dias: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

function haceDias(dias: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() - dias)
  return fecha.toISOString()
}

type BasePublicacion = Omit<Publicacion, 'estado' | 'contactos' | 'origen' | 'fotoId'> &
  Partial<Pick<Publicacion, 'estado' | 'contactos' | 'fotoId'>>

const BASE: BasePublicacion[] = [
  {
    id: 'demo-01',
    titulo: 'Aceite vegetal usado de freidora',
    categoriaId: 'organicos',
    materialId: 'aceite-vegetal',
    descripcion:
      'Aceite de freidora filtrado y almacenado en bidones cerrados de 20 litros. Se entrega en el depósito del local, con acceso para vehículo. Pedimos retirar los bidones vacíos en la siguiente visita.',
    cantidad: 80,
    unidad: 'litros',
    frecuencia: 'Semanal',
    zona: 'DM-1',
    direccion: 'Av. Cañoto, zona centro',
    modalidadPrecio: 'referencia',
    fechaDisponible: enDias(3),
    usuarioId: 'demo-u1',
    empresa: 'Pollos El Fogón',
    contacto: 'Marcela Áñez',
    telefono: '70011223',
    creadaEn: haceDias(2),
    contactos: 7,
  },
  {
    id: 'demo-02',
    titulo: 'Cartón prensado en fardos',
    categoriaId: 'secos',
    materialId: 'carton-prensado',
    descripcion:
      'Cajas de embalaje prensadas en fardos de aproximadamente 25 kg. Material seco y limpio, sin restos de cinta adhesiva. Disponible para retiro en horario comercial.',
    cantidad: 250,
    unidad: 'kg',
    frecuencia: 'Quincenal',
    zona: 'DM-3',
    direccion: 'Parque Industrial, manzana 12',
    modalidadPrecio: 'donacion',
    fechaDisponible: enDias(1),
    usuarioId: 'demo-u2',
    empresa: 'Distribuidora Santa Mónica',
    contacto: 'Rubén Justiniano',
    telefono: '71234455',
    creadaEn: haceDias(4),
    contactos: 12,
  },
  {
    id: 'demo-03',
    titulo: 'Pallets de madera en buen estado',
    categoriaId: 'secos',
    materialId: 'pallets-madera',
    descripcion:
      'Pallets estándar de 1,20 x 1,00 m usados una sola vez. Estructura firme, aptos para reacondicionar como mobiliario o para reutilizar en almacenaje.',
    cantidad: 35,
    unidad: 'unidades',
    frecuencia: 'Mensual',
    zona: 'DM-4',
    direccion: 'Doble Vía La Guardia, km 6',
    modalidadPrecio: 'referencia',
    fechaDisponible: enDias(6),
    usuarioId: 'demo-u3',
    empresa: 'Logística Oriental SRL',
    contacto: 'Daniel Suárez',
    telefono: '76554433',
    creadaEn: haceDias(6),
    contactos: 5,
  },
  {
    id: 'demo-04',
    titulo: 'Posos de café de cafetería',
    categoriaId: 'organicos',
    materialId: 'posos-cafe',
    descripcion:
      'Borra de café acumulada durante la semana, entregada en bolsas selladas. Ideal para compostaje, cultivo de hongos o elaboración de exfoliantes artesanales.',
    cantidad: 40,
    unidad: 'kg',
    frecuencia: 'Semanal',
    zona: 'DM-2',
    direccion: 'Barrio Equipetrol, calle 5 Oeste',
    modalidadPrecio: 'donacion',
    fechaDisponible: enDias(2),
    usuarioId: 'demo-u4',
    empresa: 'Café Tajibo',
    contacto: 'Lucía Melgar',
    telefono: '77889900',
    creadaEn: haceDias(1),
    contactos: 9,
  },
  {
    id: 'demo-05',
    titulo: 'Retazos textiles de confección',
    categoriaId: 'secos',
    materialId: 'retazos-textiles',
    descripcion:
      'Recortes de algodón y mezclilla provenientes de corte industrial. Piezas de tamaño variable, clasificadas por color. Se entregan en sacos de 25 kg.',
    cantidad: 120,
    unidad: 'kg',
    frecuencia: 'Quincenal',
    zona: 'DM-5',
    direccion: 'Av. Paraguá, tercer anillo',
    modalidadPrecio: 'referencia',
    fechaDisponible: enDias(5),
    usuarioId: 'demo-u5',
    empresa: 'Textiles Camba',
    contacto: 'Ana Rivero',
    telefono: '72556688',
    creadaEn: haceDias(8),
    contactos: 4,
  },
  {
    id: 'demo-06',
    titulo: 'Chatarra metálica mixta de taller',
    categoriaId: 'secos',
    materialId: 'chatarra-metalica',
    descripcion:
      'Recortes de hierro, restos de perfilería y virutas de torno acumulados en el taller. El retiro debe hacerse con vehículo de carga; contamos con montacargas para el traslado.',
    cantidad: 500,
    unidad: 'kg',
    frecuencia: 'Según acumulación',
    zona: 'DM-6',
    direccion: 'Av. Virgen de Cotoca, sexto anillo',
    modalidadPrecio: 'referencia',
    fechaDisponible: enDias(4),
    usuarioId: 'demo-u6',
    empresa: 'Metalmecánica del Este',
    contacto: 'Jorge Peña',
    telefono: '73998877',
    creadaEn: haceDias(3),
    contactos: 15,
  },
  {
    id: 'demo-07',
    titulo: 'Retazos de plástico de inyección',
    categoriaId: 'secos',
    materialId: 'retazos-plastico',
    descripcion:
      'Descarte de producción de polipropileno y polietileno, limpio y separado por tipo. Entregado en bolsas grandes de rafia.',
    cantidad: 180,
    unidad: 'kg',
    frecuencia: 'Semanal',
    zona: 'DM-7',
    direccion: 'Parque Industrial, sector norte',
    modalidadPrecio: 'referencia',
    fechaDisponible: enDias(2),
    usuarioId: 'demo-u7',
    empresa: 'Plásticos Guapay',
    contacto: 'Iván Céspedes',
    telefono: '75332211',
    creadaEn: haceDias(5),
    contactos: 6,
  },
  {
    id: 'demo-08',
    titulo: 'Restos de poda de mantenimiento',
    categoriaId: 'organicos',
    materialId: 'restos-poda',
    descripcion:
      'Ramas y follaje de poda de áreas verdes del condominio. Material fresco, sin tierra ni escombros. Se requiere retiro dentro de las 48 horas posteriores al corte.',
    cantidad: 300,
    unidad: 'kg',
    frecuencia: 'Mensual',
    zona: 'DM-8',
    direccion: 'Urbanización Las Palmas, octavo anillo',
    modalidadPrecio: 'donacion',
    fechaDisponible: enDias(1),
    usuarioId: 'demo-u8',
    empresa: 'Condominio Las Palmas',
    contacto: 'Silvia Roca',
    telefono: '78223344',
    creadaEn: haceDias(1),
    contactos: 3,
  },
  {
    id: 'demo-09',
    titulo: 'Descarte de frutas y verduras de feria',
    categoriaId: 'organicos',
    materialId: 'descarte-frutas',
    descripcion:
      'Producto que pierde valor comercial por aspecto o maduración, apto para alimentación animal o compostaje. Se entrega en cajas plásticas al cierre de la jornada.',
    cantidad: 150,
    unidad: 'kg',
    frecuencia: 'Todos los días',
    zona: 'DM-2',
    direccion: 'Mercado Abasto, sector frutas',
    modalidadPrecio: 'donacion',
    fechaDisponible: enDias(0),
    usuarioId: 'demo-u9',
    empresa: 'Frutas Doña Elsa',
    contacto: 'Elsa Cuéllar',
    telefono: '79114466',
    creadaEn: haceDias(1),
    contactos: 11,
  },
  {
    id: 'demo-10',
    titulo: 'Cartón de imprenta con recortes de papel',
    categoriaId: 'secos',
    materialId: 'carton-prensado',
    descripcion:
      'Descarte de guillotina: recortes de papel bond y cartulina en cajas. Material limpio y seco, sin tintas especiales.',
    cantidad: 90,
    unidad: 'kg',
    frecuencia: 'Semanal',
    zona: 'DM-1',
    direccion: 'Calle Sucre, casco viejo',
    modalidadPrecio: 'referencia',
    fechaDisponible: enDias(7),
    usuarioId: 'demo-u10',
    empresa: 'Imprenta La Fuente',
    contacto: 'Pablo Ortiz',
    telefono: '70667788',
    creadaEn: haceDias(9),
    contactos: 2,
    estado: 'concretada',
  },
]

export const PUBLICACIONES_DEMO: Publicacion[] = BASE.map((item) => ({
  ...item,
  fotoId: item.fotoId ?? null,
  estado: item.estado ?? 'disponible',
  contactos: item.contactos ?? 0,
  origen: 'demo' as const,
}))

/** Indicadores de impacto mostrados en la landing. Son valores de demostración. */
export const INDICADORES_DEMO = {
  publicaciones: 120,
  negocios: 80,
  recolectores: 45,
  toneladas: 10,
  kilosValorizados: 10400,
  litrosAceite: 1850,
  concretadas: 64,
}
