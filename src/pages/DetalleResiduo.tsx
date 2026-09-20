import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ImagenResiduo } from '../components/residuos/ImagenResiduo'
import { Boton, clasesBoton } from '../components/ui/Boton'
import { Etiqueta, EtiquetaEstado } from '../components/ui/Etiqueta'
import { Icono, IconoWhatsApp } from '../components/ui/Icono'
import { Modal } from '../components/ui/Modal'
import { buscarCategoria, buscarMaterial } from '../data/catalogos'
import { VIGENCIA_PRECIOS, buscarPrecio } from '../data/precios'
import { useAuth } from '../hooks/useAuth'
import { usePublicaciones } from '../hooks/usePublicaciones'
import {
  enlaceCorreo,
  enlaceLlamada,
  enlaceWhatsApp,
  formatearCantidad,
  formatearFecha,
  formatearRangoReferencia,
  formatearTiempoRelativo,
  formatearValorEstimado,
  valorDePublicacion,
} from '../utils/formato'

export function DetalleResiduo() {
  const { id } = useParams<{ id: string }>()
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const { publicaciones, cargando, contactar } = usePublicaciones()
  const [modalAbierto, setModalAbierto] = useState(false)

  const publicacion = publicaciones.find((item) => item.id === id)

  if (cargando) {
    return (
      <div className="contenedor py-12">
        <div className="h-96 animate-pulse rounded-2xl bg-humo-100" />
      </div>
    )
  }

  if (!publicacion) {
    return (
      <div className="contenedor py-20 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-humo-100 text-humo-400">
          <Icono nombre="alerta" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-humo-800">Publicación no encontrada</h1>
        <p className="mt-2 text-humo-600">Puede haber sido eliminada o ya se concretó.</p>
        <Link to="/explorar" className={`${clasesBoton('primario', 'md')} mt-6`}>
          Volver al marketplace
        </Link>
      </div>
    )
  }

  const categoria = buscarCategoria(publicacion.categoriaId)
  const material = buscarMaterial(publicacion.materialId)
  const esPropia = usuario?.id === publicacion.usuarioId

  // El precio no lo puso el oferente: sale de la tabla de referencia.
  const precioReferencia = buscarPrecio(publicacion.materialId)
  const valor = valorDePublicacion(publicacion)

  const abrirContacto = () => {
    setModalAbierto(true)
    if (!esPropia) void contactar(publicacion.id)
  }

  const datos = [
    {
      icono: 'balanza' as const,
      etiqueta: 'Cantidad disponible',
      valor: formatearCantidad(publicacion.cantidad, publicacion.unidad),
    },
    { icono: 'reloj' as const, etiqueta: 'Frecuencia', valor: publicacion.frecuencia },
    {
      icono: 'ubicacion' as const,
      etiqueta: 'Zona',
      valor: `${publicacion.zona} · ${publicacion.direccion}`,
    },
    {
      icono: 'calendario' as const,
      etiqueta: 'Disponible desde',
      valor: formatearFecha(publicacion.fechaDisponible),
    },
    { icono: 'etiqueta' as const, etiqueta: 'Material', valor: material?.material.nombre ?? '—' },
    { icono: 'reciclaje' as const, etiqueta: 'Categoría', valor: categoria?.nombre ?? '—' },
  ]

  return (
    <div className="contenedor py-6 md:py-10">
      <button
        type="button"
        onClick={() => navegar(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-humo-600 transition-colors hover:text-marca-700"
      >
        <Icono nombre="flecha" className="h-4 w-4 rotate-180" />
        Volver
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div>
          <div className="overflow-hidden rounded-2xl border border-humo-200">
            <ImagenResiduo
              fotoId={publicacion.fotoId}
              materialId={publicacion.materialId}
              titulo={publicacion.titulo}
              className="h-64 w-full sm:h-96"
              tamanoIcono="h-24 w-24"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <EtiquetaEstado estado={publicacion.estado} />
            <Etiqueta tono="tierra">{categoria?.nombre}</Etiqueta>
            <Etiqueta tono="neutro">{publicacion.zona}</Etiqueta>
            <span className="text-xs text-humo-500">
              Publicado {formatearTiempoRelativo(publicacion.creadaEn)}
            </span>
          </div>

          <h1 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight text-humo-800 sm:text-4xl">
            {publicacion.titulo}
          </h1>

          <p className="mt-5 leading-relaxed whitespace-pre-line text-humo-600">
            {publicacion.descripcion}
          </p>

          <dl className="mt-8 grid gap-5 sm:grid-cols-2">
            {datos.map((dato) => (
              <div key={dato.etiqueta} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-humo-100 text-humo-500">
                  <Icono nombre={dato.icono} className="h-4.5 w-4.5" />
                </span>
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-humo-500 uppercase">
                    {dato.etiqueta}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-humo-800">{dato.valor}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {/* Panel de contacto: fijo en escritorio para que el CTA siempre esté visible. */}
        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-humo-200 bg-white p-6 shadow-sm">
            {valor && precioReferencia ? (
              <>
                <div className="flex items-center gap-1.5 text-marca-700">
                  <Icono nombre="chispa" className="h-4 w-4" />
                  <p className="text-xs font-semibold tracking-wide uppercase">
                    Precio de referencia EcoConecta SCZ
                  </p>
                </div>

                <p className="mt-2 text-3xl font-extrabold tracking-tight text-humo-800">
                  {formatearRangoReferencia(precioReferencia)}
                </p>

                <div className="mt-4 rounded-xl bg-marca-50 px-4 py-3">
                  <p className="text-xs font-semibold tracking-wide text-marca-700 uppercase">
                    Valor estimado de esta publicación
                  </p>
                  <p className="mt-0.5 text-2xl font-extrabold text-marca-700">
                    {formatearValorEstimado(valor)}
                  </p>
                  <p className="mt-1 text-xs text-marca-700/80">
                    Por {formatearCantidad(publicacion.cantidad, publicacion.unidad)} de material.
                  </p>
                </div>

                <p className="mt-3 text-sm text-humo-600">{precioReferencia.factores}</p>

                <p className="mt-3 text-xs text-humo-500">
                  Rango definido por EcoConecta SCZ con las recicladoras de la ciudad. Vigente desde{' '}
                  {VIGENCIA_PRECIOS}. El monto final se acuerda entre las partes.{' '}
                  <Link to="/precios" className="font-semibold text-marca-700 hover:underline">
                    Ver metodología
                  </Link>
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold tracking-wide text-humo-500 uppercase">
                  Modalidad
                </p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-marca-600">
                  Donación
                </p>
                <p className="mt-3 text-sm text-humo-600">
                  {publicacion.modalidadPrecio === 'donacion'
                    ? 'El oferente entrega este material sin costo: solo hay que coordinar el retiro.'
                    : 'Este material no tiene valor de mercado en la ciudad y se entrega sin costo.'}
                </p>
              </>
            )}

            <div className="mt-6 border-t border-humo-100 pt-5">
              <p className="text-xs font-semibold tracking-wide text-humo-500 uppercase">
                Publicado por
              </p>

              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-marca-50 font-bold text-marca-700">
                  {publicacion.empresa.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-humo-800">{publicacion.empresa}</p>
                  <p className="truncate text-sm text-humo-500">{publicacion.contacto}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {esPropia ? (
                <Link to="/panel" className={clasesBoton('contorno', 'lg', true)}>
                  <Icono nombre="editar" className="h-5 w-5" />
                  Gestionar mi publicación
                </Link>
              ) : publicacion.estado === 'disponible' ? (
                <Boton tamano="lg" anchoCompleto onClick={abrirContacto}>
                  <Icono nombre="telefono" className="h-5 w-5" />
                  Contactar
                </Boton>
              ) : (
                <div className="rounded-xl bg-humo-100 px-4 py-3 text-center text-sm font-semibold text-humo-600">
                  Esta publicación ya no está disponible
                </div>
              )}

              <p className="mt-3 text-center text-xs text-humo-500">
                {publicacion.contactos} {publicacion.contactos === 1 ? 'persona' : 'personas'} ya
                consultaron por este material
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-tierra-200 bg-tierra-50 p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-tierra-800">
              <Icono nombre="alerta" className="h-4 w-4" />
              Recomendación
            </p>
            <p className="mt-2 text-sm text-tierra-700">
              Acordá la cantidad exacta, el horario de retiro y quién provee los envases antes de
              movilizar el vehículo.
            </p>
          </div>
        </aside>
      </div>

      <Modal
        abierto={modalAbierto}
        titulo={`Contactar a ${publicacion.empresa}`}
        descripcion="Podés contactar al oferente para coordinar el retiro y negociar las condiciones."
        onCerrar={() => setModalAbierto(false)}
      >
        <div className="space-y-3">
          <a
            href={enlaceWhatsApp(publicacion)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-humo-200 p-4 transition-colors hover:border-marca-400 hover:bg-marca-50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#128C7E]">
              <IconoWhatsApp className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block font-bold text-humo-800">WhatsApp</span>
              <span className="block text-sm text-humo-500">
                Abre el chat con el mensaje ya escrito
              </span>
            </span>
            <Icono nombre="flecha" className="h-5 w-5 text-humo-400" />
          </a>

          <a
            href={enlaceLlamada(publicacion.telefono)}
            className="flex items-center gap-3 rounded-xl border border-humo-200 p-4 transition-colors hover:border-marca-400 hover:bg-marca-50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-marca-50 text-marca-700">
              <Icono nombre="telefono" className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block font-bold text-humo-800">Llamar</span>
              <span className="block text-sm text-humo-500">+591 {publicacion.telefono}</span>
            </span>
            <Icono nombre="flecha" className="h-5 w-5 text-humo-400" />
          </a>

          <a
            href={enlaceCorreo(publicacion)}
            className="flex items-center gap-3 rounded-xl border border-humo-200 p-4 transition-colors hover:border-marca-400 hover:bg-marca-50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-humo-100 text-humo-600">
              <Icono nombre="correo" className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block font-bold text-humo-800">Enviar mensaje</span>
              <span className="block text-sm text-humo-500">Por correo electrónico</span>
            </span>
            <Icono nombre="flecha" className="h-5 w-5 text-humo-400" />
          </a>
        </div>

        <p className="mt-5 text-xs text-humo-500">
          EcoConecta SCZ no participa en la negociación ni en el pago. El acuerdo se realiza
          directamente entre las partes.
        </p>
      </Modal>
    </div>
  )
}
