import { Link, useLocation } from 'react-router-dom'
import { useActividad } from '../../hooks/useActividad'
import { useAuth } from '../../hooks/useAuth'
import type { Publicacion } from '../../types'
import { Icono } from '../ui/Icono'

interface PropsGuardar {
  publicacion: Publicacion
  /** "flotante" va sobre la foto de la tarjeta; "normal", junto al título del detalle. */
  estilo?: 'flotante' | 'normal'
}

/**
 * Corazón para guardar una publicación y encontrarla después en el panel.
 *
 * Sin sesión lleva a crear una cuenta y vuelve a la misma página. En las
 * publicaciones propias no se muestra.
 */
export function BotonGuardar({ publicacion, estilo = 'flotante' }: PropsGuardar) {
  const { usuario } = useAuth()
  const { estaGuardada, alternarGuardado } = useActividad()
  const { pathname, search } = useLocation()

  if (usuario?.id === publicacion.usuarioId) return null

  const guardada = estaGuardada(publicacion.id)
  const texto = guardada ? 'Quitar de guardados' : 'Guardar publicación'

  const clases =
    estilo === 'flotante'
      ? `flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white ${
          guardada ? 'text-red-500' : 'text-humo-600 hover:text-red-500'
        }`
      : `inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition-colors ${
          guardada
            ? 'border-red-200 bg-red-50 text-red-600'
            : 'border-humo-300 bg-white text-humo-700 hover:border-red-300 hover:text-red-600'
        }`

  const contenido = (
    <>
      <Icono nombre="corazon" className={`h-5 w-5 ${guardada ? 'fill-current' : ''}`} />
      {estilo === 'normal' && (guardada ? 'Guardada' : 'Guardar')}
    </>
  )

  if (!usuario) {
    const volver = encodeURIComponent(`${pathname}${search}`)
    return (
      <Link
        to={`/acceso?modo=registro&volver=${volver}`}
        className={clases}
        aria-label="Creá una cuenta para guardar publicaciones"
        title="Creá una cuenta para guardar publicaciones"
      >
        {contenido}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => alternarGuardado(publicacion.id)}
      className={clases}
      aria-label={texto}
      aria-pressed={guardada}
      title={texto}
    >
      {contenido}
    </button>
  )
}
