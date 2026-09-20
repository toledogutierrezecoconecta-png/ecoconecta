import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'

const BASE_CONTROL =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-[15px] text-humo-800 placeholder:text-humo-400 transition-colors'

function clasesControl(hayError: boolean): string {
  return `${BASE_CONTROL} ${
    hayError ? 'border-red-300 bg-red-50/40' : 'border-humo-300 hover:border-humo-400'
  }`
}

interface Envoltorio {
  etiqueta: string
  ayuda?: string
  error?: string
  requerido?: boolean
  children: (id: string, hayError: boolean) => ReactNode
}

function Envoltura({ etiqueta, ayuda, error, requerido, children }: Envoltorio) {
  const id = useId()
  const hayError = Boolean(error)

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-humo-700">
        {etiqueta}
        {requerido && <span className="ml-1 text-marca-600">*</span>}
      </label>

      {children(id, hayError)}

      {ayuda && !error && <p className="text-xs text-humo-500">{ayuda}</p>}
      {error && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

type PropsTexto = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  etiqueta: string
  ayuda?: string
  error?: string
}

export function CampoTexto({ etiqueta, ayuda, error, required, ...resto }: PropsTexto) {
  return (
    <Envoltura etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={required}>
      {(id, hayError) => <input id={id} className={clasesControl(hayError)} {...resto} />}
    </Envoltura>
  )
}

type PropsArea = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  etiqueta: string
  ayuda?: string
  error?: string
}

export function CampoArea({ etiqueta, ayuda, error, required, rows = 4, ...resto }: PropsArea) {
  return (
    <Envoltura etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={required}>
      {(id, hayError) => (
        <textarea id={id} rows={rows} className={`${clasesControl(hayError)} resize-y`} {...resto} />
      )}
    </Envoltura>
  )
}

type PropsSelect = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  etiqueta: string
  ayuda?: string
  error?: string
  children: ReactNode
}

export function CampoSelect({
  etiqueta,
  ayuda,
  error,
  required,
  children,
  ...resto
}: PropsSelect) {
  return (
    <Envoltura etiqueta={etiqueta} ayuda={ayuda} error={error} requerido={required}>
      {(id, hayError) => (
        <select id={id} className={`${clasesControl(hayError)} appearance-none pr-9`} {...resto}>
          {children}
        </select>
      )}
    </Envoltura>
  )
}
