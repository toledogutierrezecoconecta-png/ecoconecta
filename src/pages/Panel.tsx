import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { PanelRecolector } from '../components/panel/PanelRecolector'
import { ImagenResiduo } from '../components/residuos/ImagenResiduo'
import { Boton, clasesBoton } from '../components/ui/Boton'
import { EtiquetaEstado } from '../components/ui/Etiqueta'
import { Icono } from '../components/ui/Icono'
import type { NombreIcono } from '../components/ui/Icono'
import { Modal } from '../components/ui/Modal'
import { VIGENCIA_PRECIOS } from '../data/precios'
import { useAuth } from '../hooks/useAuth'
import { usePublicaciones } from '../hooks/usePublicaciones'
import { obtenerContactosRecibidos } from '../services/publicaciones'
import type { ContactoRecibido, EstadoPublicacion, Publicacion, ValorEstimado } from '../types'
import {
  formatearCantidad,
  formatearPrecio,
  formatearTiempoRelativo,
  formatearFechaHora,
  formatearValorEstimado,
  valorDePublicacion,
} from '../utils/formato'
import { buscaMateriales, puedePublicar } from '../utils/roles'

type Pestana = 'todas' | 'disponible' | 'pausada' | 'concretada'
type Vista = 'ofrezco' | 'busco'

const PESTANAS: { valor: Pestana; texto: string }[] = [
  { valor: 'todas', texto: 'Todas' },
  { valor: 'disponible', texto: 'Activas' },
  { valor: 'pausada', texto: 'Pausadas' },
  { valor: 'concretada', texto: 'Concretadas' },
]

/**
 * Panel del usuario. El oferente gestiona sus publicaciones, el recolector ve
 * lo que guardó y a quién contactó, y quien hace las dos cosas cambia de vista.
 */
export function Panel() {
  const { usuario } = useAuth()
  const { publicaciones, pendientes, cambiarEstado, eliminar } = usePublicaciones()
  const [parametros, setParametros] = useSearchParams()

  const mias = useMemo(
    () => publicaciones.filter((publicacion) => publicacion.usuarioId === usuario?.id),
    [publicaciones, usuario],
  )

  if (!usuario) return <Navigate to="/acceso" replace />

  // Un recolector que antes publicaba conserva el acceso a sus publicaciones.
  const ofrece = puedePublicar(usuario.tipo) || mias.length > 0
  const busca = buscaMateriales(usuario.tipo)
  const vista: Vista = !ofrece || (busca && parametros.get('vista') === 'busco') ? 'busco' : 'ofrezco'

  return (
    <div className="contenedor py-8 md:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-marca-700">Hola, {usuario.contacto}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
            {usuario.empresa}
          </h1>
          <p className="mt-2 text-humo-600">
            {vista === 'ofrezco'
              ? 'Gestioná tus publicaciones y seguí las consultas que recibís.'
              : 'Tus publicaciones guardadas, los negocios que contactaste y lo nuevo en tu zona.'}
          </p>
        </div>

        {vista === 'ofrezco' ? (
          <Link to="/publicar" className={clasesBoton('primario', 'lg')}>
            <Icono nombre="mas" className="h-5 w-5" />
            Publicar nuevo residuo
          </Link>
        ) : (
          <Link to="/explorar" className={clasesBoton('primario', 'lg')}>
            <Icono nombre="buscar" className="h-5 w-5" />
            Buscar materiales
          </Link>
        )}
      </header>

      {ofrece && busca && (
        <div className="mt-8 inline-flex gap-1 rounded-xl bg-humo-100 p-1" role="tablist">
          {(
            [
              { valor: 'ofrezco', texto: 'Lo que ofrezco', icono: 'etiqueta' },
              { valor: 'busco', texto: 'Lo que busco', icono: 'buscar' },
            ] as { valor: Vista; texto: string; icono: NombreIcono }[]
          ).map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              role="tab"
              aria-selected={vista === opcion.valor}
              onClick={() =>
                setParametros(opcion.valor === 'busco' ? { vista: 'busco' } : {}, { replace: true })
              }
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
                vista === opcion.valor ? 'bg-white text-humo-800 shadow-sm' : 'text-humo-500'
              }`}
            >
              <Icono nombre={opcion.icono} className="h-4 w-4" />
              {opcion.texto}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {vista === 'ofrezco' ? (
          <PanelOferente
            mias={mias}
            pendientes={pendientes}
            cambiarEstado={cambiarEstado}
            eliminar={eliminar}
          />
        ) : (
          <PanelRecolector publicaciones={publicaciones} usuario={usuario} />
        )}
      </div>
    </div>
  )
}

interface PropsOferente {
  mias: Publicacion[]
  pendientes: number
  cambiarEstado: (id: string, estado: EstadoPublicacion) => Promise<void>
  eliminar: (id: string) => Promise<void>
}

function PanelOferente({ mias, pendientes, cambiarEstado, eliminar }: PropsOferente) {
  const [pestana, setPestana] = useState<Pestana>('todas')
  const [aEliminar, setAEliminar] = useState<Publicacion | null>(null)
  const recibidos = useContactosRecibidos()

  const resumen = useMemo(() => {
    const disponibles = mias.filter((item) => item.estado === 'disponible')
    const concretadas = mias.filter((item) => item.estado === 'concretada').length
    const contactos = mias.reduce((total, item) => total + item.contactos, 0)
    const materiales = new Set(mias.map((item) => item.materialId)).size

    // Valor potencial: cuánto valen, según la tabla de referencia, los
    // materiales que este negocio tiene publicados y aún disponibles.
    const potencial = disponibles.reduce<ValorEstimado>(
      (total, publicacion) => {
        const valor = valorDePublicacion(publicacion)
        if (!valor) return total
        return { minimo: total.minimo + valor.minimo, maximo: total.maximo + valor.maximo }
      },
      { minimo: 0, maximo: 0 },
    )

    return {
      activas: disponibles.length,
      concretadas,
      contactos,
      materiales,
      potencial: potencial.maximo > 0 ? potencial : null,
    }
  }, [mias])

  const visibles = pestana === 'todas' ? mias : mias.filter((item) => item.estado === pestana)

  const tarjetas: { icono: NombreIcono; valor: number; etiqueta: string }[] = [
    { icono: 'etiqueta', valor: resumen.activas, etiqueta: 'Publicaciones activas' },
    { icono: 'check', valor: resumen.concretadas, etiqueta: 'Publicaciones concretadas' },
    { icono: 'telefono', valor: resumen.contactos, etiqueta: 'Contactos recibidos' },
    { icono: 'reciclaje', valor: resumen.materiales, etiqueta: 'Materiales publicados' },
  ]

  return (
    <>
      {pendientes > 0 && (
        <p
          className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          role="status"
        >
          <Icono nombre="reloj" className="mt-0.5 h-4 w-4 shrink-0" />
          {pendientes === 1
            ? 'Hay 1 cambio que todavía no llegó al marketplace compartido.'
            : `Hay ${pendientes} cambios que todavía no llegaron al marketplace compartido.`}{' '}
          Se reintenta solo cuando hay conexión; en este dispositivo ya se ven aplicados.
        </p>
      )}

      {resumen.potencial && (
        <section className="trama-circular mb-8 rounded-2xl bg-marca-700 p-6 text-white md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-marca-200 uppercase">
                <Icono nombre="chispa" className="h-4 w-4" />
                Valor potencial de tus publicaciones activas
              </p>

              <p className="mt-2 text-4xl font-extrabold tracking-tight">
                {formatearValorEstimado(resumen.potencial)}
              </p>

              <p className="mt-1.5 max-w-xl text-sm text-marca-100/85">
                Calculado con los precios de referencia de EcoConecta SCZ vigentes en{' '}
                {VIGENCIA_PRECIOS}.
              </p>
            </div>

            <Link
              to="/precios"
              className={`${clasesBoton('contorno', 'md')} border-white/30 !bg-transparent !text-white hover:!border-white hover:!bg-white/10`}
            >
              Cómo se calcula
            </Link>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tarjetas.map((tarjeta) => (
          <div key={tarjeta.etiqueta} className="rounded-2xl border border-humo-200 bg-white p-4 sm:p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-marca-50 text-marca-600">
              <Icono nombre={tarjeta.icono} className="h-5 w-5" />
            </span>
            <p className="mt-4 text-3xl font-extrabold text-humo-800">{tarjeta.valor}</p>
            <p className="mt-0.5 text-sm text-humo-600">{tarjeta.etiqueta}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-humo-800">Mis publicaciones</h2>

          <div className="flex gap-1 rounded-xl bg-humo-100 p-1">
            {PESTANAS.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                onClick={() => setPestana(opcion.valor)}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                  pestana === opcion.valor ? 'bg-white text-humo-800 shadow-sm' : 'text-humo-500'
                }`}
              >
                {opcion.texto}
              </button>
            ))}
          </div>
        </div>

        {visibles.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-humo-300 bg-humo-50 px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-humo-400">
              <Icono nombre="etiqueta" className="h-7 w-7" />
            </span>

            <h3 className="mt-5 text-lg font-bold text-humo-800">
              {mias.length === 0
                ? 'Todavía no publicaste ningún material'
                : 'No hay publicaciones en esta pestaña'}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-humo-600">
              {mias.length === 0
                ? 'Publicá el primer residuo de tu negocio y empezá a recibir consultas de recolectores.'
                : 'Cambiá de pestaña para ver el resto de tus publicaciones.'}
            </p>

            {mias.length === 0 && (
              <Link to="/publicar" className={`${clasesBoton('primario', 'md')} mt-6`}>
                Publicar mi primer residuo
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {visibles.map((publicacion) => (
              <li
                key={publicacion.id}
                className="overflow-hidden rounded-2xl border border-humo-200 bg-white"
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="w-full shrink-0 overflow-hidden rounded-xl sm:w-32">
                    <ImagenResiduo
                      fotoId={publicacion.fotoId}
                      materialId={publicacion.materialId}
                      titulo={publicacion.titulo}
                      className="h-32 w-full sm:h-20"
                      tamanoIcono="h-8 w-8"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <EtiquetaEstado estado={publicacion.estado} />
                      <span className="text-xs text-humo-500">
                        {formatearTiempoRelativo(publicacion.creadaEn)}
                      </span>
                    </div>

                    <h3 className="mt-1.5 truncate font-bold text-humo-800">
                      {publicacion.titulo}
                    </h3>

                    <p className="mt-1 text-sm text-humo-600">
                      {formatearCantidad(publicacion.cantidad, publicacion.unidad)} ·{' '}
                      {publicacion.zona} · {formatearPrecio(publicacion)}
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-marca-700">
                      <Icono nombre="telefono" className="h-4 w-4" />
                      {publicacion.contactos}{' '}
                      {publicacion.contactos === 1 ? 'contacto recibido' : 'contactos recibidos'}
                    </p>
                  </div>
                </div>

                <QuienContacto
                  contactos={recibidos?.get(publicacion.id) ?? []}
                  total={publicacion.contactos}
                />


                <div className="flex flex-wrap gap-2 border-t border-humo-100 bg-humo-50 px-4 py-3">
                  <Link
                    to={`/residuo/${publicacion.id}`}
                    className={clasesBoton('contorno', 'sm')}
                  >
                    <Icono nombre="ojo" className="h-4 w-4" />
                    Ver
                  </Link>

                  <Link
                    to={`/publicar?editar=${publicacion.id}`}
                    className={clasesBoton('contorno', 'sm')}
                  >
                    <Icono nombre="editar" className="h-4 w-4" />
                    Editar
                  </Link>

                  {publicacion.estado !== 'concretada' && (
                    <Boton
                      variante="contorno"
                      tamano="sm"
                      onClick={() =>
                        void cambiarEstado(
                          publicacion.id,
                          publicacion.estado === 'pausada' ? 'disponible' : 'pausada',
                        )
                      }
                    >
                      <Icono
                        nombre={publicacion.estado === 'pausada' ? 'reanudar' : 'pausa'}
                        className="h-4 w-4"
                      />
                      {publicacion.estado === 'pausada' ? 'Reanudar' : 'Pausar'}
                    </Boton>
                  )}

                  {publicacion.estado !== 'concretada' && (
                    <Boton
                      variante="contorno"
                      tamano="sm"
                      onClick={() => void cambiarEstado(publicacion.id, 'concretada')}
                    >
                      <Icono nombre="check" className="h-4 w-4" />
                      Marcar concretada
                    </Boton>
                  )}

                  <Boton
                    variante="peligro"
                    tamano="sm"
                    className="ml-auto"
                    onClick={() => setAEliminar(publicacion)}
                  >
                    <Icono nombre="basura" className="h-4 w-4" />
                    Eliminar
                  </Boton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        abierto={Boolean(aEliminar)}
        titulo="¿Eliminar esta publicación?"
        descripcion={aEliminar?.titulo}
        onCerrar={() => setAEliminar(null)}
      >
        <p className="text-sm text-humo-600">
          La publicación dejará de aparecer en el marketplace. Esta acción no se puede deshacer.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Boton
            variante="peligro"
            anchoCompleto
            onClick={() => {
              if (aEliminar) void eliminar(aEliminar.id)
              setAEliminar(null)
            }}
          >
            Sí, eliminar
          </Boton>
          <Boton variante="contorno" anchoCompleto onClick={() => setAEliminar(null)}>
            Cancelar
          </Boton>
        </div>
      </Modal>
    </>
  )
}

/** Contactos recibidos agrupados por publicación. null mientras carga o si no hubo conexión. */
function useContactosRecibidos(): Map<string, ContactoRecibido[]> | null {
  const [porPublicacion, setPorPublicacion] = useState<Map<string, ContactoRecibido[]> | null>(null)

  useEffect(() => {
    let vigente = true

    void obtenerContactosRecibidos().then((contactos) => {
      if (!vigente || !contactos) return

      const agrupados = new Map<string, ContactoRecibido[]>()
      for (const contacto of contactos) {
        agrupados.set(contacto.publicacionId, [...(agrupados.get(contacto.publicacionId) ?? []), contacto])
      }
      setPorPublicacion(agrupados)
    })

    return () => {
      vigente = false
    }
  }, [])

  return porPublicacion
}

const MAXIMO_VISIBLES = 3

/**
 * Quién consultó por la publicación. Las personas con cuenta aparecen con su
 * empresa; los visitantes sin cuenta solo se cuentan.
 */
function QuienContacto({ contactos, total }: { contactos: ContactoRecibido[]; total: number }) {
  const [verTodos, setVerTodos] = useState(false)
  const sinCuenta = Math.max(0, total - contactos.length)

  if (contactos.length === 0) return null

  const visibles = verTodos ? contactos : contactos.slice(0, MAXIMO_VISIBLES)

  return (
    <div className="border-t border-humo-100 px-4 py-3">
      <p className="text-xs font-semibold tracking-wide text-humo-500 uppercase">Te consultaron</p>

      <ul className="mt-2 space-y-1.5">
        {visibles.map((contacto) => (
          <li
            key={`${contacto.empresa}-${contacto.fecha}`}
            className="flex flex-wrap items-baseline gap-x-2 text-sm"
          >
            <span className="font-semibold text-humo-800">{contacto.empresa}</span>
            <span className="text-humo-600">{contacto.contacto}</span>
            {contacto.tipo === 'recolector' && (
              <span className="text-xs text-marca-700">Recolector</span>
            )}
            <span className="text-xs text-humo-500">· {formatearFechaHora(contacto.fecha)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-humo-500">
        {contactos.length > MAXIMO_VISIBLES && (
          <button
            type="button"
            onClick={() => setVerTodos((valor) => !valor)}
            className="font-semibold text-marca-700 hover:underline"
          >
            {verTodos ? 'Ver menos' : `Ver los ${contactos.length}`}
          </button>
        )}
        {sinCuenta > 0 && (
          <span>
            y {sinCuenta} {sinCuenta === 1 ? 'visitante' : 'visitantes'} sin cuenta
          </span>
        )}
      </div>
    </div>
  )
}
