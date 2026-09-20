import { Link } from 'react-router-dom'
import { buscarCategoria } from '../../data/catalogos'
import type { Publicacion } from '../../types'
import {
  formatearCantidad,
  formatearDisponibilidad,
  formatearPrecio,
  formatearValorEstimado,
  valorDePublicacion,
} from '../../utils/formato'
import { Etiqueta, EtiquetaEstado } from '../ui/Etiqueta'
import { Icono } from '../ui/Icono'
import { ImagenResiduo } from './ImagenResiduo'

export function TarjetaResiduo({ publicacion }: { publicacion: Publicacion }) {
  const categoria = buscarCategoria(publicacion.categoriaId)
  const valor = valorDePublicacion(publicacion)
  const esDonacion = !valor

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-humo-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-lg hover:shadow-marca-900/5">
      <div className="relative">
        <ImagenResiduo
          fotoId={publicacion.fotoId}
          materialId={publicacion.materialId}
          titulo={publicacion.titulo}
          className="h-40 w-full"
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Etiqueta tono="blanco">{publicacion.zona}</Etiqueta>
          {esDonacion && <Etiqueta tono="verde">Donación</Etiqueta>}
        </div>

        <div className="absolute top-3 right-3">
          <EtiquetaEstado estado={publicacion.estado} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold tracking-wide text-humo-500 uppercase">
          {categoria?.nombre}
        </p>

        <h3 className="mt-1 line-clamp-2 text-base leading-snug font-bold text-humo-800 group-hover:text-marca-700">
          {publicacion.titulo}
        </h3>

        <div className="mt-3 space-y-1.5 text-sm text-humo-600">
          <p className="flex items-center gap-1.5">
            <Icono nombre="balanza" className="h-4 w-4 shrink-0 text-humo-400" />
            {formatearCantidad(publicacion.cantidad, publicacion.unidad)} · {publicacion.frecuencia}
          </p>
          <p className="flex items-center gap-1.5">
            <Icono nombre="calendario" className="h-4 w-4 shrink-0 text-humo-400" />
            {formatearDisponibilidad(publicacion.fechaDisponible)}
          </p>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-humo-100 pt-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-humo-500">{publicacion.empresa}</p>

            {valor ? (
              <>
                <p className="text-lg leading-tight font-extrabold text-humo-800">
                  {formatearValorEstimado(valor)}
                </p>
                <p className="text-xs text-humo-500">{formatearPrecio(publicacion)} ref.</p>
              </>
            ) : (
              <p className="text-lg leading-tight font-extrabold text-marca-600">Donación</p>
            )}
          </div>

          <Link
            to={`/residuo/${publicacion.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-marca-50 px-3 text-sm font-semibold text-marca-700 transition-colors hover:bg-marca-600 hover:text-white"
          >
            Ver detalle
            <Icono nombre="flecha" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}
