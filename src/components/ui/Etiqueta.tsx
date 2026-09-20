import type { ReactNode } from 'react'
import type { EstadoPublicacion } from '../../types'

type Tono = 'verde' | 'tierra' | 'neutro' | 'ambar' | 'rojo' | 'blanco'

const TONOS: Record<Tono, string> = {
  verde: 'bg-marca-50 text-marca-700 border-marca-200',
  tierra: 'bg-tierra-50 text-tierra-700 border-tierra-200',
  neutro: 'bg-humo-100 text-humo-600 border-humo-200',
  ambar: 'bg-amber-50 text-amber-700 border-amber-200',
  rojo: 'bg-red-50 text-red-700 border-red-200',
  blanco: 'bg-white/90 text-humo-700 border-white/60 backdrop-blur-sm',
}

interface PropsEtiqueta {
  children: ReactNode
  tono?: Tono
  className?: string
}

export function Etiqueta({ children, tono = 'neutro', className = '' }: PropsEtiqueta) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold ${TONOS[tono]} ${className}`}
    >
      {children}
    </span>
  )
}

const ESTADOS: Record<EstadoPublicacion, { texto: string; tono: Tono }> = {
  disponible: { texto: 'Disponible', tono: 'verde' },
  pausada: { texto: 'Pausada', tono: 'ambar' },
  concretada: { texto: 'Concretada', tono: 'neutro' },
}

export function EtiquetaEstado({ estado }: { estado: EstadoPublicacion }) {
  const { texto, tono } = ESTADOS[estado]

  return (
    <Etiqueta tono={tono}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          estado === 'disponible'
            ? 'bg-marca-500'
            : estado === 'pausada'
              ? 'bg-amber-500'
              : 'bg-humo-400'
        }`}
      />
      {texto}
    </Etiqueta>
  )
}
