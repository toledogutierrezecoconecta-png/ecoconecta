import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Icono } from './Icono'

interface PropsModal {
  abierto: boolean
  titulo: string
  descripcion?: string
  onCerrar: () => void
  children: ReactNode
}

/** En móvil aparece como hoja inferior; en escritorio, centrado. */
export function Modal({ abierto, titulo, descripcion, onCerrar, children }: PropsModal) {
  useEffect(() => {
    if (!abierto) return

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
    }

    document.addEventListener('keydown', alPresionar)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-humo-800/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={onCerrar}
    >
      <div
        className="aparece w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-humo-800">{titulo}</h2>
            {descripcion && <p className="mt-1 text-sm text-humo-600">{descripcion}</p>}
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="-mt-1 -mr-1 rounded-lg p-1.5 text-humo-500 transition-colors hover:bg-humo-100 hover:text-humo-800"
            aria-label="Cerrar"
          >
            <Icono nombre="cerrar" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
