import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type VarianteBoton = 'primario' | 'secundario' | 'contorno' | 'fantasma' | 'peligro'
export type TamanoBoton = 'sm' | 'md' | 'lg'

const VARIANTES: Record<VarianteBoton, string> = {
  primario: 'bg-marca-600 text-white hover:bg-marca-700 shadow-sm shadow-marca-900/20',
  secundario: 'bg-tierra-500 text-white hover:bg-tierra-600 shadow-sm shadow-tierra-800/20',
  contorno: 'border border-humo-300 bg-white text-humo-800 hover:border-marca-500 hover:text-marca-700',
  fantasma: 'text-humo-700 hover:bg-humo-100',
  peligro: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
}

const TAMANOS: Record<TamanoBoton, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-[15px] gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
}

/** Botones grandes y con estados claros: muchos usuarios entran desde Android. */
export function clasesBoton(
  variante: VarianteBoton = 'primario',
  tamano: TamanoBoton = 'md',
  anchoCompleto = false,
): string {
  return [
    'inline-flex items-center justify-center rounded-xl font-semibold',
    'transition-all duration-150 active:scale-[0.98]',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
    VARIANTES[variante],
    TAMANOS[tamano],
    anchoCompleto ? 'w-full' : '',
  ].join(' ')
}

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton
  tamano?: TamanoBoton
  anchoCompleto?: boolean
  children: ReactNode
}

export function Boton({
  variante = 'primario',
  tamano = 'md',
  anchoCompleto = false,
  className = '',
  children,
  ...resto
}: PropsBoton) {
  return (
    <button className={`${clasesBoton(variante, tamano, anchoCompleto)} ${className}`} {...resto}>
      {children}
    </button>
  )
}
