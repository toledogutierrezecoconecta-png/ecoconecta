import { ABREVIATURA_UNIDAD, UNIDAD_SINGULAR } from '../data/catalogos'
import { buscarPrecio } from '../data/precios'
import type { PrecioReferencia } from '../data/precios'
import { PREFIJO_PAIS } from '../services/config'
import type { Publicacion, Unidad, ValorEstimado } from '../types'

/** Formatea un monto en bolivianos sin decimales innecesarios. */
export function formatearMonto(monto: number): string {
  return monto.toLocaleString('es-BO', {
    minimumFractionDigits: monto % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

/** "Bs. 1,80 – 2,50 por litro": el rango de referencia del material. */
export function formatearRangoReferencia(precio: PrecioReferencia): string {
  if (precio.minimo === null || precio.maximo === null) return 'Sin valor de mercado'

  return `Bs. ${formatearMonto(precio.minimo)} – ${formatearMonto(precio.maximo)} por ${
    UNIDAD_SINGULAR[precio.unidad]
  }`
}

/**
 * Precio que se muestra en tarjetas y detalle.
 *
 * El oferente no define este número: sale de la tabla de referencia de
 * EcoConecta SCZ, salvo que haya elegido entregar el material en donación.
 */
export function formatearPrecio(publicacion: Publicacion): string {
  if (publicacion.modalidadPrecio === 'donacion') return 'Donación'

  const precio = buscarPrecio(publicacion.materialId)
  if (!precio || precio.minimo === null || precio.maximo === null) return 'Donación'

  return `Bs. ${formatearMonto(precio.minimo)} – ${formatearMonto(precio.maximo)}/${
    ABREVIATURA_UNIDAD[publicacion.unidad]
  }`
}

/**
 * Valor total estimado de la publicación: cantidad por el rango de referencia.
 * Es el número que convierte "tengo un residuo" en "tengo Bs. 144 a 200".
 */
export function calcularValorEstimado(
  materialId: string,
  cantidad: number,
  modalidad: Publicacion['modalidadPrecio'] = 'referencia',
): ValorEstimado | null {
  if (modalidad === 'donacion') return null

  const precio = buscarPrecio(materialId)
  if (!precio || precio.minimo === null || precio.maximo === null) return null
  if (!cantidad || cantidad <= 0) return null

  return { minimo: precio.minimo * cantidad, maximo: precio.maximo * cantidad }
}

export function formatearValorEstimado(valor: ValorEstimado): string {
  return `Bs. ${formatearMonto(Math.round(valor.minimo))} – ${formatearMonto(
    Math.round(valor.maximo),
  )}`
}

/** Valor estimado de una publicación ya creada. */
export function valorDePublicacion(publicacion: Publicacion): ValorEstimado | null {
  return calcularValorEstimado(
    publicacion.materialId,
    publicacion.cantidad,
    publicacion.modalidadPrecio,
  )
}

export function formatearCantidad(cantidad: number, unidad: Unidad): string {
  return `${cantidad.toLocaleString('es-BO')} ${ABREVIATURA_UNIDAD[unidad]}`
}

export function formatearFecha(fechaIso: string): string {
  if (!fechaIso) return 'Sin fecha'

  const fecha = new Date(`${fechaIso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha'

  return fecha.toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** "Hoy", "Mañana" o la fecha, para que se lea rápido en las tarjetas. */
export function formatearDisponibilidad(fechaIso: string): string {
  if (!fechaIso) return 'Sin fecha'

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(`${fechaIso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha'

  const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000)
  if (dias < 0) return 'Disponible ahora'
  if (dias === 0) return 'Disponible hoy'
  if (dias === 1) return 'Disponible mañana'
  if (dias <= 7) return `Disponible en ${dias} días`

  return `Disponible el ${formatearFecha(fechaIso)}`
}

export function formatearTiempoRelativo(fechaIso: string): string {
  const fecha = new Date(fechaIso)
  if (Number.isNaN(fecha.getTime())) return ''

  const minutos = Math.round((Date.now() - fecha.getTime()) / 60_000)
  if (minutos < 1) return 'hace un momento'
  if (minutos < 60) return `hace ${minutos} min`

  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`

  const dias = Math.round(horas / 24)
  if (dias === 1) return 'ayer'
  if (dias < 30) return `hace ${dias} días`

  return formatearFecha(fechaIso)
}

/** Normaliza texto para buscar sin importar tildes ni mayúsculas. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function limpiarTelefono(telefono: string): string {
  const soloDigitos = telefono.replace(/\D/g, '')
  if (soloDigitos.startsWith(PREFIJO_PAIS)) return soloDigitos
  return `${PREFIJO_PAIS}${soloDigitos}`
}

/** Enlace real de WhatsApp con el mensaje precargado. No requiere API. */
export function enlaceWhatsApp(publicacion: Publicacion): string {
  const mensaje =
    `Hola ${publicacion.contacto}, vi su publicación de "${publicacion.titulo}" ` +
    `(${formatearCantidad(publicacion.cantidad, publicacion.unidad)}, ${publicacion.zona}) ` +
    `en EcoConecta SCZ y me interesa coordinar el retiro.`

  return `https://wa.me/${limpiarTelefono(publicacion.telefono)}?text=${encodeURIComponent(mensaje)}`
}

export function enlaceLlamada(telefono: string): string {
  return `tel:+${limpiarTelefono(telefono)}`
}

export function enlaceCorreo(publicacion: Publicacion): string {
  const asunto = `Consulta por ${publicacion.titulo} — EcoConecta SCZ`
  return `mailto:?subject=${encodeURIComponent(asunto)}`
}
