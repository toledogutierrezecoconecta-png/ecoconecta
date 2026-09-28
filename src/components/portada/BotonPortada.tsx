import { Link } from 'react-router-dom'
import { Icono } from '../ui/Icono'
import type { NombreIcono } from '../ui/Icono'

/**
 * Botón de la portada, replicando el arte del diseño: píldora verde, ícono a la
 * izquierda, título con una bajada más chica debajo y flecha a la derecha.
 *
 * Los tamaños van en unidades `cqw` (1% del ancho del contenedor) en lugar de
 * píxeles: así el botón escala en la misma proporción que la ilustración de
 * fondo y queda alineado con ella en cualquier pantalla.
 */

export interface MedidasBoton {
  alto: string
  espaciado: string
  icono: string
  flecha: string
  titulo: string
  subtitulo: string
  hueco: string
}

interface PropsBoton {
  a: string
  icono: NombreIcono
  titulo: string
  subtitulo: string
  tono: 'claro' | 'oscuro'
  medidas: MedidasBoton
}

export function BotonPortada({ a, icono, titulo, subtitulo, tono, medidas }: PropsBoton) {
  const colores =
    tono === 'claro'
      ? 'bg-portada-claro hover:bg-portada-claro-vivo'
      : 'bg-portada-oscuro hover:bg-portada-oscuro-vivo'

  return (
    <Link
      to={a}
      className={`flex w-full items-center rounded-full text-white shadow-lg shadow-black/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 ${colores}`}
      style={{ height: medidas.alto, paddingInline: medidas.espaciado, gap: medidas.hueco }}
    >
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: medidas.icono, height: medidas.icono }}
      >
        <Icono nombre={icono} className="h-full w-full" />
      </span>

      <span className="flex-1 text-left leading-tight">
        <span className="block font-extrabold" style={{ fontSize: medidas.titulo }}>
          {titulo}
        </span>
        {/* Una sola línea, como en el arte original. */}
        <span
          className="block font-medium whitespace-nowrap text-white/85"
          style={{ fontSize: medidas.subtitulo, marginTop: '0.12em' }}
        >
          {subtitulo}
        </span>
      </span>

      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: medidas.flecha, height: medidas.flecha }}
      >
        <Icono nombre="flecha" className="h-full w-full" />
      </span>
    </Link>
  )
}
