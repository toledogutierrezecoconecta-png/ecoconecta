import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useActividad } from '../../hooks/useActividad'
import type { Publicacion, Usuario } from '../../types'
import {
  enlaceWhatsApp,
  formatearCantidad,
  formatearFechaHora,
  formatearPrecio,
} from '../../utils/formato'
import { ImagenResiduo } from '../residuos/ImagenResiduo'
import { TarjetaResiduo } from '../residuos/TarjetaResiduo'
import { clasesBoton } from '../ui/Boton'
import { EtiquetaEstado } from '../ui/Etiqueta'
import { Icono, IconoWhatsApp } from '../ui/Icono'
import type { NombreIcono } from '../ui/Icono'

/** Cuántos días se considera "nueva" una publicación. */
const DIAS_NOVEDAD = 14
const MAXIMO_NOVEDADES = 6

interface PropsPanel {
  publicaciones: Publicacion[]
  usuario: Usuario
}

/**
 * Panel de quien busca materiales: lo que guardó, a quién contactó y qué
 * apareció en su zona de trabajo.
 */
export function PanelRecolector({ publicaciones, usuario }: PropsPanel) {
  const { guardados, contactos } = useActividad()
  const porId = new Map(publicaciones.map((publicacion) => [publicacion.id, publicacion]))

  // Las publicaciones eliminadas desaparecen solas de ambas listas.
  const guardadas = guardados.flatMap((id) => porId.get(id) ?? [])
  const contactadas = contactos.flatMap((contacto) => {
    const publicacion = porId.get(contacto.publicacionId)
    return publicacion ? [{ ...contacto, publicacion }] : []
  })

  const zona = usuario.zonaInteres ?? ''
  // Se fija al abrir el panel: no hace falta recalcularlo en cada render.
  const [desde] = useState(() => Date.now() - DIAS_NOVEDAD * 86_400_000)
  const novedades = publicaciones
    .filter(
      (publicacion) =>
        publicacion.estado === 'disponible' &&
        publicacion.origen !== 'demo' &&
        publicacion.usuarioId !== usuario.id &&
        (!zona || publicacion.zona === zona) &&
        new Date(publicacion.creadaEn).getTime() >= desde,
    )
    .slice(0, MAXIMO_NOVEDADES)

  const tarjetas: { icono: NombreIcono; valor: number; etiqueta: string }[] = [
    { icono: 'corazon', valor: guardadas.length, etiqueta: 'Publicaciones guardadas' },
    { icono: 'telefono', valor: contactadas.length, etiqueta: 'Negocios contactados' },
    {
      icono: 'chispa',
      valor: novedades.length,
      etiqueta: zona ? `Novedades en ${zona}` : 'Novedades recientes',
    },
  ]

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-3">
        {tarjetas.map((tarjeta) => (
          <div key={tarjeta.etiqueta} className="rounded-2xl border border-humo-200 bg-white p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-marca-50 text-marca-600">
              <Icono nombre={tarjeta.icono} className="h-5 w-5" />
            </span>
            <p className="mt-4 text-3xl font-extrabold text-humo-800">{tarjeta.valor}</p>
            <p className="mt-0.5 text-sm text-humo-600">{tarjeta.etiqueta}</p>
          </div>
        ))}
      </section>

      {/* -------------------------------------------------------- Novedades */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-humo-800">
              {zona ? `Nuevo en ${zona}` : 'Nuevo en la ciudad'}
            </h2>
            <p className="mt-1 text-sm text-humo-600">
              Publicaciones disponibles de los últimos {DIAS_NOVEDAD} días.
              {!zona && (
                <>
                  {' '}
                  <Link to="/perfil" className="font-semibold text-marca-700 hover:underline">
                    Elegí tu zona de trabajo
                  </Link>{' '}
                  para ver solo lo que te queda cerca.
                </>
              )}
            </p>
          </div>

          <Link
            to={zona ? `/explorar?zona=${zona}` : '/explorar'}
            className={clasesBoton('contorno', 'sm')}
          >
            Ver todo
            <Icono nombre="flecha" className="h-4 w-4" />
          </Link>
        </div>

        {novedades.length === 0 ? (
          <Vacio
            icono="chispa"
            titulo="Todavía no hay novedades"
            texto={
              zona
                ? `No se publicó nada nuevo en ${zona} en los últimos ${DIAS_NOVEDAD} días. Probá explorando toda la ciudad.`
                : `No se publicó nada nuevo en los últimos ${DIAS_NOVEDAD} días.`
            }
          />
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {novedades.map((publicacion) => (
              <TarjetaResiduo key={publicacion.id} publicacion={publicacion} />
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- Guardadas */}
      <section>
        <h2 className="text-xl font-bold text-humo-800">Guardadas</h2>

        {guardadas.length === 0 ? (
          <Vacio
            icono="corazon"
            titulo="No guardaste ninguna publicación"
            texto="Tocá el corazón en cualquier publicación del marketplace para tenerla a mano acá."
            accion={{ a: '/explorar', texto: 'Explorar materiales' }}
          />
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {guardadas.map((publicacion) => (
              <TarjetaResiduo key={publicacion.id} publicacion={publicacion} />
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------------------- Contactos realizados */}
      <section>
        <h2 className="text-xl font-bold text-humo-800">Negocios que contactaste</h2>

        {contactadas.length === 0 ? (
          <Vacio
            icono="telefono"
            titulo="Todavía no contactaste a ningún negocio"
            texto="Cuando toques Contactar en una publicación, queda registrada acá para que puedas retomar la conversación."
          />
        ) : (
          <ul className="mt-5 space-y-3">
            {contactadas.map(({ publicacion, fecha }) => (
              <li
                key={publicacion.id}
                className="flex flex-col gap-4 rounded-2xl border border-humo-200 bg-white p-4 sm:flex-row sm:items-center"
              >
                <div className="w-full shrink-0 overflow-hidden rounded-xl sm:w-24">
                  <ImagenResiduo
                    fotoId={publicacion.fotoId}
                    materialId={publicacion.materialId}
                    titulo={publicacion.titulo}
                    className="h-28 w-full sm:h-16"
                    tamanoIcono="h-7 w-7"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <EtiquetaEstado estado={publicacion.estado} />
                    <span className="text-xs text-humo-500">
                      Contactado: {formatearFechaHora(fecha)}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-bold text-humo-800">{publicacion.titulo}</p>
                  <p className="text-sm text-humo-600">
                    {publicacion.empresa} · {formatearCantidad(publicacion.cantidad, publicacion.unidad)}{' '}
                    · {publicacion.zona} · {formatearPrecio(publicacion)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link to={`/residuo/${publicacion.id}`} className={clasesBoton('contorno', 'sm')}>
                    <Icono nombre="ojo" className="h-4 w-4" />
                    Ver
                  </Link>

                  {publicacion.estado === 'disponible' && (
                    <a
                      href={enlaceWhatsApp(publicacion, usuario)}
                      target="_blank"
                      rel="noreferrer"
                      className={clasesBoton('primario', 'sm')}
                    >
                      <IconoWhatsApp className="h-4 w-4" />
                      Escribir
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Vacio({
  icono,
  titulo,
  texto,
  accion,
}: {
  icono: NombreIcono
  titulo: string
  texto: string
  accion?: { a: string; texto: string }
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-humo-300 bg-humo-50 px-6 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-humo-400">
        <Icono nombre={icono} className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-bold text-humo-800">{titulo}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-humo-600">{texto}</p>

      {accion && (
        <Link to={accion.a} className={`${clasesBoton('primario', 'md')} mt-5`}>
          {accion.texto}
        </Link>
      )}
    </div>
  )
}
