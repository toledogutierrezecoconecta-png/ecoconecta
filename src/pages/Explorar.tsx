import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TarjetaResiduo } from '../components/residuos/TarjetaResiduo'
import { Boton, clasesBoton } from '../components/ui/Boton'
import { Icono } from '../components/ui/Icono'
import { CATEGORIAS, TODOS_LOS_MATERIALES, ZONAS } from '../data/catalogos'
import { usePublicaciones } from '../hooks/usePublicaciones'
import type { FiltrosExploracion } from '../types'
import { normalizar, valorDePublicacion } from '../utils/formato'

const FILTROS_INICIALES: FiltrosExploracion = {
  busqueda: '',
  categoriaId: '',
  materialId: '',
  zona: '',
  soloDonaciones: false,
  soloConValor: false,
  soloDisponibles: true,
}

export function Explorar() {
  const { publicaciones, cargando } = usePublicaciones()
  const [parametros, setParametros] = useSearchParams()
  const [filtros, setFiltros] = useState<FiltrosExploracion>(FILTROS_INICIALES)
  const [panelAbierto, setPanelAbierto] = useState(false)

  // Permite llegar desde la landing con una categoría o material preseleccionado.
  useEffect(() => {
    const material = parametros.get('material') ?? ''
    const categoria = parametros.get('categoria') ?? ''
    if (material || categoria) {
      setFiltros((actuales) => ({ ...actuales, materialId: material, categoriaId: categoria }))
    }
  }, [parametros])

  const materialesDisponibles = useMemo(() => {
    if (!filtros.categoriaId) return TODOS_LOS_MATERIALES
    return TODOS_LOS_MATERIALES.filter((material) => material.categoriaId === filtros.categoriaId)
  }, [filtros.categoriaId])

  const resultados = useMemo(() => {
    const termino = normalizar(filtros.busqueda.trim())

    return publicaciones.filter((publicacion) => {
      if (filtros.soloDisponibles && publicacion.estado !== 'disponible') return false
      if (filtros.categoriaId && publicacion.categoriaId !== filtros.categoriaId) return false
      if (filtros.materialId && publicacion.materialId !== filtros.materialId) return false
      if (filtros.zona && publicacion.zona !== filtros.zona) return false

      const tieneValor = Boolean(valorDePublicacion(publicacion))
      if (filtros.soloDonaciones && tieneValor) return false
      if (filtros.soloConValor && !tieneValor) return false

      if (termino) {
        const texto = normalizar(
          `${publicacion.titulo} ${publicacion.descripcion} ${publicacion.empresa} ${publicacion.zona}`,
        )
        if (!texto.includes(termino)) return false
      }

      return true
    })
  }, [publicaciones, filtros])

  const hayFiltrosActivos =
    filtros.busqueda !== '' ||
    filtros.categoriaId !== '' ||
    filtros.materialId !== '' ||
    filtros.zona !== '' ||
    filtros.soloDonaciones ||
    filtros.soloConValor ||
    !filtros.soloDisponibles

  const limpiar = () => {
    setFiltros(FILTROS_INICIALES)
    setParametros({})
  }

  const actualizar = (cambios: Partial<FiltrosExploracion>) =>
    setFiltros((actuales) => ({ ...actuales, ...cambios }))

  const panelFiltros = (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-bold text-humo-800">Categoría</label>
        <div className="space-y-1.5">
          <OpcionFiltro
            activa={filtros.categoriaId === ''}
            onClick={() => actualizar({ categoriaId: '', materialId: '' })}
          >
            Todas las categorías
          </OpcionFiltro>

          {CATEGORIAS.map((categoria) => (
            <OpcionFiltro
              key={categoria.id}
              activa={filtros.categoriaId === categoria.id}
              onClick={() => actualizar({ categoriaId: categoria.id, materialId: '' })}
            >
              {categoria.nombre}
            </OpcionFiltro>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="filtro-material" className="mb-2 block text-sm font-bold text-humo-800">
          Tipo de material
        </label>
        <select
          id="filtro-material"
          value={filtros.materialId}
          onChange={(evento) => actualizar({ materialId: evento.target.value })}
          className="w-full rounded-xl border border-humo-300 bg-white px-3.5 py-2.5 text-[15px]"
        >
          <option value="">Todos los materiales</option>
          {materialesDisponibles.map((material) => (
            <option key={material.id} value={material.id}>
              {material.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-humo-800">Zona (distrito)</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => actualizar({ zona: '' })}
            className={`col-span-3 rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${
              filtros.zona === ''
                ? 'border-marca-500 bg-marca-50 text-marca-700'
                : 'border-humo-200 bg-white text-humo-600 hover:border-humo-400'
            }`}
          >
            Toda la ciudad
          </button>

          {ZONAS.map((zona) => (
            <button
              key={zona}
              type="button"
              onClick={() => actualizar({ zona: filtros.zona === zona ? '' : zona })}
              className={`rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${
                filtros.zona === zona
                  ? 'border-marca-500 bg-marca-50 text-marca-700'
                  : 'border-humo-200 bg-white text-humo-600 hover:border-humo-400'
              }`}
            >
              {zona}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-humo-200 pt-5">
        <Interruptor
          etiqueta="Solo donaciones"
          activo={filtros.soloDonaciones}
          onChange={(valor) => actualizar({ soloDonaciones: valor, soloConValor: false })}
        />
        <Interruptor
          etiqueta="Solo con valor de mercado"
          activo={filtros.soloConValor}
          onChange={(valor) => actualizar({ soloConValor: valor, soloDonaciones: false })}
        />
        <Interruptor
          etiqueta="Solo publicaciones disponibles"
          activo={filtros.soloDisponibles}
          onChange={(valor) => actualizar({ soloDisponibles: valor })}
        />
      </div>

      {hayFiltrosActivos && (
        <Boton variante="fantasma" tamano="sm" anchoCompleto onClick={limpiar}>
          <Icono nombre="cerrar" className="h-4 w-4" />
          Limpiar filtros
        </Boton>
      )}
    </div>
  )

  return (
    <div className="contenedor py-8 md:py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
          Encontrá materiales disponibles
        </h1>
        <p className="mt-3 text-humo-600">
          Explorá lo que los negocios de Santa Cruz están ofreciendo hoy y contactá directamente al
          oferente.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-humo-400">
            <Icono nombre="buscar" />
          </span>
          <input
            type="search"
            value={filtros.busqueda}
            onChange={(evento) => actualizar({ busqueda: evento.target.value })}
            placeholder="¿Qué material estás buscando?"
            aria-label="Buscar materiales"
            className="h-13 w-full rounded-xl border border-humo-300 bg-white pr-4 pl-12 text-[15px] transition-colors hover:border-humo-400"
          />
        </div>

        <button
          type="button"
          onClick={() => setPanelAbierto((valor) => !valor)}
          className={`${clasesBoton('contorno', 'lg')} lg:hidden`}
        >
          <Icono nombre="filtro" className="h-5 w-5" />
          Filtros
          {hayFiltrosActivos && <span className="h-2 w-2 rounded-full bg-marca-500" />}
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className={`${panelAbierto ? 'block' : 'hidden'} lg:block`}>
          <div className="rounded-2xl border border-humo-200 bg-white p-5 lg:sticky lg:top-24">
            {panelFiltros}
          </div>
        </aside>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-humo-600">
              {cargando ? (
                'Cargando publicaciones…'
              ) : (
                <>
                  <span className="font-bold text-humo-800">{resultados.length}</span>{' '}
                  {resultados.length === 1 ? 'publicación encontrada' : 'publicaciones encontradas'}
                </>
              )}
            </p>
          </div>

          {cargando ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((indice) => (
                <div
                  key={indice}
                  className="h-80 animate-pulse rounded-2xl border border-humo-200 bg-humo-50"
                />
              ))}
            </div>
          ) : resultados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-humo-300 bg-humo-50 px-6 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-humo-400">
                <Icono nombre="buscar" className="h-7 w-7" />
              </span>

              <h2 className="mt-5 text-lg font-bold text-humo-800">
                No encontramos materiales con esos filtros
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-humo-600">
                Probá ampliando la zona o quitando algún filtro. También podés publicar lo que
                necesitás para que los negocios te encuentren.
              </p>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Boton variante="contorno" onClick={limpiar}>
                  Limpiar filtros
                </Boton>
                <Link to="/publicar" className={clasesBoton('primario', 'md')}>
                  Publicar un residuo
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {resultados.map((publicacion) => (
                <TarjetaResiduo key={publicacion.id} publicacion={publicacion} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function OpcionFiltro({
  activa,
  onClick,
  children,
}: {
  activa: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
        activa ? 'bg-marca-50 text-marca-700' : 'text-humo-600 hover:bg-humo-100'
      }`}
    >
      {children}
    </button>
  )
}

function Interruptor({
  etiqueta,
  activo,
  onChange,
}: {
  etiqueta: string
  activo: boolean
  onChange: (valor: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm font-medium text-humo-700">{etiqueta}</span>

      <span className="relative inline-flex">
        <input
          type="checkbox"
          checked={activo}
          onChange={(evento) => onChange(evento.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-humo-300 transition-colors peer-checked:bg-marca-500 peer-focus-visible:ring-2 peer-focus-visible:ring-marca-500 peer-focus-visible:ring-offset-2" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  )
}
