import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ImagenResiduo } from '../components/residuos/ImagenResiduo'
import { Boton, clasesBoton } from '../components/ui/Boton'
import { CampoArea, CampoSelect, CampoTexto } from '../components/ui/Campo'
import { Icono } from '../components/ui/Icono'
import { CATEGORIAS, FRECUENCIAS, UNIDADES, ZONAS } from '../data/catalogos'
import { buscarPrecio, esSoloDonacion } from '../data/precios'
import { useAuth } from '../hooks/useAuth'
import { usePublicaciones } from '../hooks/usePublicaciones'
import { comprimirImagen, guardarFoto } from '../services/imagenes'
import type { ModalidadPrecio, Unidad } from '../types'
import {
  calcularValorEstimado,
  formatearCantidad,
  formatearRangoReferencia,
  formatearValorEstimado,
} from '../utils/formato'

interface Formulario {
  titulo: string
  categoriaId: string
  materialId: string
  descripcion: string
  cantidad: string
  unidad: Unidad
  frecuencia: string
  zona: string
  direccion: string
  modalidadPrecio: ModalidadPrecio
  fechaDisponible: string
}

const HOY = new Date().toISOString().slice(0, 10)

const INICIAL: Formulario = {
  titulo: '',
  categoriaId: 'organicos',
  materialId: 'aceite-vegetal',
  descripcion: '',
  cantidad: '',
  unidad: 'litros',
  frecuencia: 'Semanal',
  zona: 'DM-1',
  direccion: '',
  modalidadPrecio: 'referencia',
  fechaDisponible: HOY,
}

export function PublicarResiduo() {
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const idEdicion = parametros.get('editar')

  const { usuario, cargando: cargandoSesion } = useAuth()
  const { publicaciones, crear, actualizar } = usePublicaciones()

  const [formulario, setFormulario] = useState<Formulario>(INICIAL)
  const [fotoPrevia, setFotoPrevia] = useState<string | null>(null)
  const [fotoIdActual, setFotoIdActual] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState<string | null>(null)

  const enEdicion = Boolean(idEdicion)

  // Carga los valores existentes cuando se entra en modo edición.
  useEffect(() => {
    if (!idEdicion) return

    const original = publicaciones.find((item) => item.id === idEdicion)
    if (!original) return

    setFormulario({
      titulo: original.titulo,
      categoriaId: original.categoriaId,
      materialId: original.materialId,
      descripcion: original.descripcion,
      cantidad: String(original.cantidad),
      unidad: original.unidad,
      frecuencia: original.frecuencia,
      zona: original.zona,
      direccion: original.direccion,
      modalidadPrecio: original.modalidadPrecio,
      fechaDisponible: original.fechaDisponible,
    })
    setFotoIdActual(original.fotoId)
  }, [idEdicion, publicaciones])

  const materiales = useMemo(
    () => CATEGORIAS.find((categoria) => categoria.id === formulario.categoriaId)?.materiales ?? [],
    [formulario.categoriaId],
  )

  // El precio no lo escribe el oferente: se toma de la tabla de referencia.
  const precioReferencia = buscarPrecio(formulario.materialId)
  const soloDonacion = esSoloDonacion(formulario.materialId)

  const valorEstimado = useMemo(
    () =>
      calcularValorEstimado(
        formulario.materialId,
        Number(formulario.cantidad),
        soloDonacion ? 'donacion' : formulario.modalidadPrecio,
      ),
    [formulario.materialId, formulario.cantidad, formulario.modalidadPrecio, soloDonacion],
  )

  const cambiar = <C extends keyof Formulario>(campo: C, valor: Formulario[C]) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
    setErrores((actuales) => {
      const { [campo]: _descartado, ...resto } = actuales
      return resto
    })
  }

  const cambiarCategoria = (categoriaId: string) => {
    const primeroDeLaCategoria = CATEGORIAS.find(
      (categoria) => categoria.id === categoriaId,
    )?.materiales[0]

    setFormulario((actual) => ({
      ...actual,
      categoriaId,
      materialId: primeroDeLaCategoria?.id ?? '',
      unidad: primeroDeLaCategoria?.unidadSugerida ?? actual.unidad,
    }))
  }

  const cambiarMaterial = (materialId: string) => {
    const material = materiales.find((item) => item.id === materialId)
    setFormulario((actual) => ({
      ...actual,
      materialId,
      unidad: material?.unidadSugerida ?? actual.unidad,
      titulo: actual.titulo || (material?.nombre ?? ''),
    }))
  }

  const subirFoto = async (archivo: File | undefined) => {
    if (!archivo) return

    try {
      const comprimida = await comprimirImagen(archivo)
      setFotoPrevia(comprimida)
    } catch (problema) {
      setErrores((actuales) => ({
        ...actuales,
        foto: problema instanceof Error ? problema.message : 'No se pudo procesar la imagen.',
      }))
    }
  }

  const validar = (): boolean => {
    const nuevos: Record<string, string> = {}

    if (formulario.titulo.trim().length < 4) {
      nuevos.titulo = 'Escribí un nombre claro para el material.'
    }
    if (formulario.descripcion.trim().length < 15) {
      nuevos.descripcion = 'Contá en pocas líneas en qué estado está y cómo se entrega.'
    }

    const cantidad = Number(formulario.cantidad)
    if (!formulario.cantidad || Number.isNaN(cantidad) || cantidad <= 0) {
      nuevos.cantidad = 'Ingresá una cantidad mayor a cero.'
    }
    if (!formulario.direccion.trim()) {
      nuevos.direccion = 'Indicá una dirección aproximada para el retiro.'
    }

    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    if (!usuario || !validar()) return

    setEnviando(true)

    try {
      let fotoId = fotoIdActual
      if (fotoPrevia) fotoId = await guardarFoto(fotoPrevia)

      const borrador = {
        titulo: formulario.titulo.trim(),
        categoriaId: formulario.categoriaId,
        materialId: formulario.materialId,
        descripcion: formulario.descripcion.trim(),
        cantidad: Number(formulario.cantidad),
        unidad: formulario.unidad,
        frecuencia: formulario.frecuencia,
        zona: formulario.zona,
        direccion: formulario.direccion.trim(),
        modalidadPrecio: soloDonacion ? 'donacion' : formulario.modalidadPrecio,
        fotoId,
        fechaDisponible: formulario.fechaDisponible,
      }

      if (enEdicion && idEdicion) {
        await actualizar(idEdicion, borrador)
        navegar('/panel')
        return
      }

      const nueva = await crear(borrador, usuario)
      setExito(nueva.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setEnviando(false)
    }
  }

  if (cargandoSesion) return null

  // Sin sesión no se puede publicar: se explica y se ofrece el acceso.
  if (!usuario) {
    return (
      <div className="contenedor flex justify-center py-16">
        <div className="max-w-md rounded-2xl border border-humo-200 bg-white p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-marca-50 text-marca-600">
            <Icono nombre="usuario" className="h-6 w-6" />
          </span>

          <h1 className="mt-5 text-2xl font-bold text-humo-800">Necesitás una cuenta</h1>
          <p className="mt-2 text-humo-600">
            Para publicar un residuo primero creá tu cuenta. Toma menos de un minuto y es gratis.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link to="/acceso?modo=registro" className={clasesBoton('primario', 'lg', true)}>
              Crear cuenta
            </Link>
            <Link to="/acceso" className={clasesBoton('contorno', 'md', true)}>
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (exito) {
    return (
      <div className="contenedor flex justify-center py-16">
        <div className="max-w-md rounded-2xl border border-marca-200 bg-marca-50 p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-marca-600 text-white">
            <Icono nombre="check" className="h-7 w-7" />
          </span>

          <h1 className="mt-5 text-2xl font-bold text-marca-800">¡Publicación creada!</h1>
          <p className="mt-2 text-marca-700">
            Ahora los compradores pueden encontrar tu material.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <Link to={`/residuo/${exito}`} className={clasesBoton('primario', 'lg', true)}>
              <Icono nombre="ojo" className="h-5 w-5" />
              Ver mi publicación
            </Link>
            <Link to="/panel" className={clasesBoton('contorno', 'md', true)}>
              Ir a mis publicaciones
            </Link>
            <button
              type="button"
              onClick={() => {
                setExito(null)
                setFormulario(INICIAL)
                setFotoPrevia(null)
                setFotoIdActual(null)
              }}
              className={clasesBoton('fantasma', 'md', true)}
            >
              Publicar otro material
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="contenedor py-8 md:py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
          {enEdicion ? 'Editar publicación' : 'Publicar un residuo'}
        </h1>
        <p className="mt-3 text-humo-600">
          Completá los datos del material. Mientras más claro sea, más rápido vas a recibir
          consultas.
        </p>
      </header>

      <form onSubmit={enviar} className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-6">
          {/* ----------------------------------------- Qué material es */}
          <fieldset className="space-y-5 rounded-2xl border border-humo-200 bg-white p-6">
            <legend className="px-2 text-sm font-bold tracking-wide text-marca-700 uppercase">
              1. Qué material ofrecés
            </legend>

            <CampoSelect
              etiqueta="Categoría"
              value={formulario.categoriaId}
              onChange={(evento) => cambiarCategoria(evento.target.value)}
              required
            >
              {CATEGORIAS.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </CampoSelect>

            <CampoSelect
              etiqueta="Tipo de material"
              value={formulario.materialId}
              onChange={(evento) => cambiarMaterial(evento.target.value)}
              required
            >
              {materiales.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.nombre}
                </option>
              ))}
            </CampoSelect>

            <CampoTexto
              etiqueta="Nombre del residuo"
              placeholder="Ej: Aceite vegetal usado de freidora"
              value={formulario.titulo}
              error={errores.titulo}
              onChange={(evento) => cambiar('titulo', evento.target.value)}
              required
            />

            <CampoArea
              etiqueta="Descripción"
              placeholder="¿En qué estado está? ¿Cómo se entrega? ¿Hay alguna condición para el retiro?"
              value={formulario.descripcion}
              error={errores.descripcion}
              onChange={(evento) => cambiar('descripcion', evento.target.value)}
              required
            />
          </fieldset>

          {/* ------------------------------------- Cantidad y frecuencia */}
          <fieldset className="space-y-5 rounded-2xl border border-humo-200 bg-white p-6">
            <legend className="px-2 text-sm font-bold tracking-wide text-marca-700 uppercase">
              2. Cuánto y cada cuánto
            </legend>

            <div className="grid gap-5 sm:grid-cols-2">
              <CampoTexto
                etiqueta="Cantidad"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="50"
                value={formulario.cantidad}
                error={errores.cantidad}
                onChange={(evento) => cambiar('cantidad', evento.target.value)}
                required
              />

              <CampoSelect
                etiqueta="Unidad"
                value={formulario.unidad}
                onChange={(evento) => cambiar('unidad', evento.target.value as Unidad)}
                required
              >
                {UNIDADES.map((unidad) => (
                  <option key={unidad.valor} value={unidad.valor}>
                    {unidad.etiqueta}
                  </option>
                ))}
              </CampoSelect>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <CampoSelect
                etiqueta="Frecuencia"
                ayuda="Cada cuánto vuelve a estar disponible."
                value={formulario.frecuencia}
                onChange={(evento) => cambiar('frecuencia', evento.target.value)}
                required
              >
                {FRECUENCIAS.map((frecuencia) => (
                  <option key={frecuencia} value={frecuencia}>
                    {frecuencia}
                  </option>
                ))}
              </CampoSelect>

              <CampoTexto
                etiqueta="Disponible desde"
                type="date"
                value={formulario.fechaDisponible}
                onChange={(evento) => cambiar('fechaDisponible', evento.target.value)}
                required
              />
            </div>
          </fieldset>

          {/* ------------------------------------------------ Ubicación */}
          <fieldset className="space-y-5 rounded-2xl border border-humo-200 bg-white p-6">
            <legend className="px-2 text-sm font-bold tracking-wide text-marca-700 uppercase">
              3. Dónde se retira
            </legend>

            <CampoSelect
              etiqueta="Zona / distrito municipal"
              value={formulario.zona}
              onChange={(evento) => cambiar('zona', evento.target.value)}
              required
            >
              {ZONAS.map((zona) => (
                <option key={zona} value={zona}>
                  {zona}
                </option>
              ))}
            </CampoSelect>

            <CampoTexto
              etiqueta="Dirección aproximada"
              placeholder="Ej: Av. Cañoto, zona centro"
              ayuda="No hace falta la dirección exacta: se coordina al momento del contacto."
              value={formulario.direccion}
              error={errores.direccion}
              onChange={(evento) => cambiar('direccion', evento.target.value)}
              required
            />
          </fieldset>

          {/* --------------------------------------------------- Precio */}
          <fieldset className="space-y-5 rounded-2xl border border-humo-200 bg-white p-6">
            <legend className="px-2 text-sm font-bold tracking-wide text-marca-700 uppercase">
              4. Precio
            </legend>

            <div className="flex items-start gap-3 rounded-xl bg-marca-50 p-4">
              <span className="mt-0.5 shrink-0 text-marca-600">
                <Icono nombre="chispa" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-marca-800">
                  No tenés que averiguar cuánto vale
                </p>
                <p className="mt-1 text-sm text-marca-700">
                  EcoConecta SCZ define el precio de cada material con las empresas recicladoras de
                  Santa Cruz.{' '}
                  <Link to="/precios" className="font-semibold underline">
                    Ver cómo lo calculamos
                  </Link>
                </p>
              </div>
            </div>

            {soloDonacion ? (
              <p className="rounded-xl border border-humo-200 px-4 py-3 text-sm text-humo-600">
                {precioReferencia?.factores ??
                  'Este material no tiene valor de mercado en la ciudad.'}{' '}
                La publicación se ofrece como <strong className="text-humo-800">donación</strong>.
              </p>
            ) : (
              <>
                {precioReferencia && (
                  <div className="rounded-xl border border-humo-200 px-4 py-3">
                    <p className="text-xs font-semibold tracking-wide text-humo-500 uppercase">
                      Precio de referencia para este material
                    </p>
                    <p className="mt-0.5 text-xl font-extrabold text-humo-800">
                      {formatearRangoReferencia(precioReferencia)}
                    </p>
                    <p className="mt-1 text-xs text-humo-500">{precioReferencia.factores}</p>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-sm font-semibold text-humo-700">¿Cómo lo entregás?</p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        {
                          valor: 'referencia',
                          texto: 'Al precio de referencia',
                          detalle: 'Cobrás según el rango de EcoConecta SCZ.',
                        },
                        {
                          valor: 'donacion',
                          texto: 'Lo dono',
                          detalle: 'Lo entregás sin costo a quien lo retire.',
                        },
                      ] as { valor: ModalidadPrecio; texto: string; detalle: string }[]
                    ).map((opcion) => (
                      <button
                        key={opcion.valor}
                        type="button"
                        onClick={() => cambiar('modalidadPrecio', opcion.valor)}
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                          formulario.modalidadPrecio === opcion.valor
                            ? 'border-marca-500 bg-marca-50'
                            : 'border-humo-200 bg-white hover:border-humo-400'
                        }`}
                      >
                        <span
                          className={`block text-sm font-bold ${
                            formulario.modalidadPrecio === opcion.valor
                              ? 'text-marca-700'
                              : 'text-humo-800'
                          }`}
                        >
                          {opcion.texto}
                        </span>
                        <span className="mt-0.5 block text-xs text-humo-600">{opcion.detalle}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </fieldset>
        </div>

        {/* ------------------------------------------ Foto y publicación */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-humo-200 bg-white p-6">
            <p className="text-sm font-bold tracking-wide text-marca-700 uppercase">
              Foto (opcional)
            </p>
            <p className="mt-1.5 text-sm text-humo-600">
              Una foto real multiplica las consultas. Se comprime automáticamente.
            </p>

            <div className="mt-4 overflow-hidden rounded-xl border border-humo-200">
              {fotoPrevia ? (
                <img src={fotoPrevia} alt="Vista previa" className="h-44 w-full object-cover" />
              ) : (
                <ImagenResiduo
                  fotoId={fotoIdActual}
                  materialId={formulario.materialId}
                  titulo="Vista previa"
                  className="h-44 w-full"
                />
              )}
            </div>

            <label className={`${clasesBoton('contorno', 'md', true)} mt-4 cursor-pointer`}>
              <Icono nombre="mas" className="h-4 w-4" />
              {fotoPrevia || fotoIdActual ? 'Cambiar foto' : 'Subir foto'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(evento) => void subirFoto(evento.target.files?.[0])}
              />
            </label>

            {(fotoPrevia || fotoIdActual) && (
              <button
                type="button"
                onClick={() => {
                  setFotoPrevia(null)
                  setFotoIdActual(null)
                }}
                className={`${clasesBoton('fantasma', 'sm', true)} mt-2`}
              >
                Quitar foto
              </button>
            )}

            {errores.foto && <p className="mt-2 text-xs text-red-600">{errores.foto}</p>}
          </div>

          {/* El número que convierte "tengo un residuo" en "tengo dinero". */}
          <div
            className={`rounded-2xl border p-6 ${
              valorEstimado ? 'border-marca-200 bg-marca-50' : 'border-humo-200 bg-white'
            }`}
          >
            <p
              className={`text-xs font-semibold tracking-wide uppercase ${
                valorEstimado ? 'text-marca-700' : 'text-humo-500'
              }`}
            >
              Valor estimado de tu publicación
            </p>

            {valorEstimado ? (
              <>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-marca-700">
                  {formatearValorEstimado(valorEstimado)}
                </p>
                <p className="mt-1.5 text-sm text-marca-700/90">
                  Por {formatearCantidad(Number(formulario.cantidad), formulario.unidad)} de
                  material, según el precio de referencia vigente.
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-sm text-humo-600">
                {soloDonacion || formulario.modalidadPrecio === 'donacion'
                  ? 'Esta publicación se ofrece como donación, sin costo para quien la retire.'
                  : 'Ingresá la cantidad para ver cuánto vale tu material.'}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-humo-200 bg-white p-6">
            <p className="text-sm text-humo-600">
              Se publicará a nombre de{' '}
              <span className="font-bold text-humo-800">{usuario.empresa}</span> y los interesados
              te escribirán al <span className="font-bold text-humo-800">{usuario.telefono}</span>.
            </p>

            <Boton type="submit" tamano="lg" anchoCompleto className="mt-5" disabled={enviando}>
              {enviando ? 'Guardando…' : enEdicion ? 'Guardar cambios' : 'Publicar oferta'}
            </Boton>

            {enEdicion && (
              <Link to="/panel" className={`${clasesBoton('fantasma', 'md', true)} mt-2`}>
                Cancelar
              </Link>
            )}
          </div>
        </aside>
      </form>
    </div>
  )
}
