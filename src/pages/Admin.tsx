import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Boton, clasesBoton } from '../components/ui/Boton'
import { CampoTexto } from '../components/ui/Campo'
import { EtiquetaEstado } from '../components/ui/Etiqueta'
import { Icono } from '../components/ui/Icono'
import type { NombreIcono } from '../components/ui/Icono'
import { Modal } from '../components/ui/Modal'
import { buscarMaterial } from '../data/catalogos'
import { useAuth } from '../hooks/useAuth'
import {
  ErrorAdmin,
  cambiarEstadoAdmin,
  descargarCsv,
  eliminarPublicacionAdmin,
  leerClaveAdmin,
  obtenerDatosAdmin,
  salirAdmin,
} from '../services/admin'
import type { DatosAdmin, PublicacionAdmin, UsuarioAdmin } from '../services/admin'
import type { EstadoPublicacion, TipoUsuario } from '../types'
import { formatearCantidad, normalizar } from '../utils/formato'

type Seccion = 'resumen' | TipoUsuario | 'publicaciones' | 'contactos'

const SECCIONES: { valor: Seccion; texto: string }[] = [
  { valor: 'resumen', texto: 'Resumen' },
  { valor: 'oferente', texto: 'Empresas' },
  { valor: 'recolector', texto: 'Recolectores' },
  { valor: 'ambos', texto: 'Ambos' },
  { valor: 'publicaciones', texto: 'Publicaciones' },
  { valor: 'contactos', texto: 'Contactos' },
]

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000

function esReciente(fechaIso: string): boolean {
  const tiempo = new Date(fechaIso).getTime()
  return !Number.isNaN(tiempo) && Date.now() - tiempo < SIETE_DIAS_MS
}

function enlaceWhatsAppDirecto(telefono: string): string {
  return `https://wa.me/591${telefono.replace(/\D/g, '')}`
}

/**
 * Panel de administración.
 *
 * Entran las cuentas cuyo correo está en CORREOS_ADMIN (con su sesión
 * normal; para ellas aparece "Admin" en el menú) o, como respaldo, quien
 * escriba /#/admin y conozca la clave de administrador. Todo lo valida el servidor. Muestra lo mismo que la hoja de
 * Google, con buscador, filtros y acciones, sin salir de la web.
 */
export function Admin() {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [datos, setDatos] = useState<DatosAdmin | null>(null)
  const [cargando, setCargando] = useState(Boolean(leerClaveAdmin() || usuario))
  const [error, setError] = useState('')
  const [seccion, setSeccion] = useState<Seccion>('resumen')
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async (clave?: string) => {
    setCargando(true)
    setError('')
    try {
      setDatos(await obtenerDatosAdmin(clave))
    } catch (problema) {
      const codigo = problema instanceof ErrorAdmin ? problema.codigo : ''
      // Clave incorrecta: se olvida para volver a pedirla.
      if (codigo === 'clave_admin') {
        salirAdmin()
        setDatos(null)
      }
      // Se intentó entrar solo con la sesión: si no alcanza, se pide la clave sin mostrar error.
      const intentoConSesion = clave === undefined && !leerClaveAdmin()
      if (intentoConSesion && (codigo === 'no_admin' || codigo === 'clave_admin')) return
      setError(problema instanceof Error ? problema.message : 'No se pudieron cargar los datos.')
    } finally {
      setCargando(false)
    }
  }, [])

  // Se entra directo con la clave ya ingresada o con la sesión de una cuenta administradora.
  useEffect(() => {
    if (leerClaveAdmin() || usuario) void cargar()
  }, [cargar, usuario])

  if (!datos) {
    return (
      <IngresoAdmin
        cargando={cargando}
        error={error}
        conSesion={Boolean(usuario)}
        onIngresar={(clave) => void cargar(clave)}
      />
    )
  }

  const salir = () => {
    salirAdmin()
    setError('')
    // Con una cuenta administradora, "Salir" vuelve al inicio (la sesión sigue abierta).
    if (usuario?.esAdmin) navegar('/')
    else setDatos(null)
  }

  return (
    <div className="contenedor py-8 md:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-marca-700">
            <Icono nombre="grafico" className="h-4 w-4" />
            Administración
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-humo-800">
            Base de datos de EcoConecta SCZ
          </h1>
          <p className="mt-2 text-humo-600">
            Los mismos datos de la hoja de Google, actualizados al momento.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Boton variante="contorno" tamano="sm" disabled={cargando} onClick={() => void cargar()}>
            <Icono nombre="reanudar" className="h-4 w-4" />
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </Boton>
          <a
            href={datos.urlHoja}
            target="_blank"
            rel="noreferrer"
            className={clasesBoton('contorno', 'sm')}
          >
            <Icono nombre="ojo" className="h-4 w-4" />
            Abrir hoja de Google
          </a>
          <Boton variante="fantasma" tamano="sm" onClick={salir}>
            <Icono nombre="salir" className="h-4 w-4" />
            Salir
          </Boton>
        </div>
      </header>

      {error && <Alerta>{error}</Alerta>}

      <nav className="mt-8 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-1 rounded-xl bg-humo-100 p-1">
          {SECCIONES.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => {
                setSeccion(opcion.valor)
                setBusqueda('')
              }}
              className={`rounded-lg px-3.5 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
                seccion === opcion.valor ? 'bg-white text-humo-800 shadow-sm' : 'text-humo-500'
              }`}
            >
              {opcion.texto}
              <span className="ml-1.5 text-xs font-semibold text-humo-400">
                {contar(datos, opcion.valor)}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {seccion === 'resumen' ? (
        <Resumen datos={datos} irA={setSeccion} />
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <CampoTexto
                etiqueta="Buscar"
                type="search"
                placeholder={
                  seccion === 'contactos' ? 'Publicación o empresa' : 'Nombre, correo, teléfono…'
                }
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
              />
            </div>
            <Boton variante="contorno" tamano="sm" onClick={() => exportar(datos, seccion)}>
              <Icono nombre="flecha" className="h-4 w-4 rotate-90" />
              Descargar Excel (CSV)
            </Boton>
          </div>

          {seccion === 'publicaciones' ? (
            <TablaPublicaciones
              publicaciones={filtrar(datos.publicaciones, busqueda)}
              alCambiar={() => void cargar()}
            />
          ) : seccion === 'contactos' ? (
            <TablaContactos datos={datos} busqueda={busqueda} />
          ) : (
            <TablaUsuarios usuarios={filtrar(usuariosDe(datos, seccion), busqueda)} />
          )}
        </>
      )}
    </div>
  )
}

// ------------------------------------------------------------------- ingreso

function IngresoAdmin({
  cargando,
  error,
  conSesion,
  onIngresar,
}: {
  cargando: boolean
  error: string
  /** Hay una sesión abierta, pero de una cuenta que no es administradora. */
  conSesion: boolean
  onIngresar: (clave: string) => void
}) {
  const [clave, setClave] = useState('')

  return (
    <div className="contenedor flex justify-center py-16">
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          onIngresar(clave)
        }}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-humo-200 bg-white p-6"
      >
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-marca-50 text-marca-600">
            <Icono nombre="usuario" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-humo-800">Acceso de administrador</h1>
          <p className="mt-1 text-sm text-humo-600">Ingresá la clave para ver la base de datos.</p>
        </div>

        <CampoTexto
          etiqueta="Clave de administrador"
          type="password"
          autoComplete="current-password"
          value={clave}
          onChange={(evento) => setClave(evento.target.value)}
          required
          autoFocus
        />

        {error && <Alerta>{error}</Alerta>}

        <Boton type="submit" tamano="lg" anchoCompleto disabled={cargando}>
          {cargando ? 'Verificando…' : 'Entrar'}
        </Boton>

        {conSesion ? (
          <p className="text-center text-xs text-humo-500">
            Tu cuenta no es de administrador. Para entrar con tu cuenta, su correo tiene que estar en
            CORREOS_ADMIN.
          </p>
        ) : (
          <Link to="/acceso?volver=%2Fadmin" className={clasesBoton('contorno', 'md', true)}>
            <Icono nombre="usuario" className="h-4 w-4" />
            Ingresar con mi cuenta de administrador
          </Link>
        )}

        <Link to="/" className={clasesBoton('fantasma', 'sm', true)}>
          Volver al inicio
        </Link>
      </form>
    </div>
  )
}

// ------------------------------------------------------------------- resumen

function Resumen({ datos, irA }: { datos: DatosAdmin; irA: (seccion: Seccion) => void }) {
  const tarjetas: { seccion: Seccion; icono: NombreIcono; valor: number; etiqueta: string; nuevos: number }[] = [
    ...(['oferente', 'recolector', 'ambos'] as TipoUsuario[]).map((tipo) => {
      const lista = usuariosDe(datos, tipo)
      return {
        seccion: tipo as Seccion,
        icono: (tipo === 'recolector' ? 'camion' : tipo === 'ambos' ? 'reciclaje' : 'tienda') as NombreIcono,
        valor: lista.length,
        etiqueta: SECCIONES.find((opcion) => opcion.valor === tipo)?.texto ?? tipo,
        nuevos: lista.filter((usuario) => esReciente(usuario.creadoEn)).length,
      }
    }),
    {
      seccion: 'publicaciones',
      icono: 'etiqueta',
      valor: datos.publicaciones.filter((item) => item.estado === 'disponible').length,
      etiqueta: 'Publicaciones activas',
      nuevos: datos.publicaciones.filter((item) => esReciente(item.creadaEn)).length,
    },
    {
      seccion: 'contactos',
      icono: 'telefono',
      valor: datos.contactos.length,
      etiqueta: 'Contactos recibidos',
      nuevos: datos.contactos.filter((item) => esReciente(item.creadoEn)).length,
    },
  ]

  const ultimos = [...datos.usuarios]
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    .slice(0, 6)

  return (
    <>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tarjetas.map((tarjeta) => (
          <button
            key={tarjeta.etiqueta}
            type="button"
            onClick={() => irA(tarjeta.seccion)}
            className="rounded-2xl border border-humo-200 bg-white p-5 text-left transition-colors hover:border-marca-300"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-marca-50 text-marca-600">
              <Icono nombre={tarjeta.icono} className="h-5 w-5" />
            </span>
            <p className="mt-4 text-3xl font-extrabold text-humo-800">{tarjeta.valor}</p>
            <p className="mt-0.5 text-sm text-humo-600">{tarjeta.etiqueta}</p>
            <p className="mt-2 text-xs font-semibold text-marca-700">
              +{tarjeta.nuevos} en los últimos 7 días
            </p>
          </button>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-humo-200 bg-white">
        <h2 className="border-b border-humo-100 px-5 py-4 font-bold text-humo-800">
          Últimos registros
        </h2>
        {ultimos.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-humo-500">Todavía no hay registros.</p>
        ) : (
          <ul className="divide-y divide-humo-100">
            {ultimos.map((usuario) => (
              <li key={usuario.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-humo-800">{usuario.empresa}</p>
                  <p className="truncate text-sm text-humo-500">
                    {usuario.contacto} · {usuario.correo}
                  </p>
                </div>
                <p className="text-sm text-humo-500">
                  {nombreTipo(usuario.tipo)} · {usuario.fecha} {usuario.hora}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-4 text-xs text-humo-500">
        Correos que todavía se pueden enviar hoy: {datos.correosRestantesHoy} (límite diario de
        Gmail).
      </p>
    </>
  )
}

// ------------------------------------------------------------------- tablas

function Tabla({ titulos, vacio, children }: { titulos: string[]; vacio: boolean; children: ReactNode }) {
  if (vacio) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-humo-300 bg-humo-50 px-6 py-12 text-center text-sm text-humo-500">
        No hay datos para mostrar.
      </p>
    )
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-humo-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-humo-200 bg-humo-50">
          <tr>
            {titulos.map((titulo) => (
              <th key={titulo} className="px-4 py-3 text-xs font-bold tracking-wide text-humo-600 uppercase">
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-humo-100">{children}</tbody>
      </table>
    </div>
  )
}

function TablaUsuarios({ usuarios }: { usuarios: UsuarioAdmin[] }) {
  return (
    <Tabla
      titulos={['Fecha', 'Empresa / negocio', 'Contacto', 'Teléfono', 'Correo', 'Confirmación']}
      vacio={usuarios.length === 0}
    >
      {usuarios.map((usuario) => (
        <tr key={usuario.id} className="align-top">
          <td className="px-4 py-3 whitespace-nowrap text-humo-600">
            {usuario.fecha}
            <span className="block text-xs text-humo-400">{usuario.hora}</span>
          </td>
          <td className="px-4 py-3 font-semibold text-humo-800">{usuario.empresa}</td>
          <td className="px-4 py-3 text-humo-700">{usuario.contacto}</td>
          <td className="px-4 py-3 whitespace-nowrap">
            <a
              href={enlaceWhatsAppDirecto(usuario.telefono)}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-marca-700 hover:underline"
            >
              {usuario.telefono}
            </a>
          </td>
          <td className="px-4 py-3">
            <a href={`mailto:${usuario.correo}`} className="break-all text-marca-700 hover:underline">
              {usuario.correo}
            </a>
          </td>
          <td className="px-4 py-3 text-humo-600">{usuario.correoConfirmacion}</td>
        </tr>
      ))}
    </Tabla>
  )
}

function TablaPublicaciones({
  publicaciones,
  alCambiar,
}: {
  publicaciones: PublicacionAdmin[]
  alCambiar: () => void
}) {
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [aEliminar, setAEliminar] = useState<PublicacionAdmin | null>(null)
  const [error, setError] = useState('')

  const ejecutar = async (id: string, accion: () => Promise<void>) => {
    setOcupada(id)
    setError('')
    try {
      await accion()
      alCambiar()
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo completar la acción.')
    } finally {
      setOcupada(null)
    }
  }

  const estado = (id: string, nuevo: EstadoPublicacion) =>
    void ejecutar(id, () => cambiarEstadoAdmin(id, nuevo))

  return (
    <>
      {error && <Alerta>{error}</Alerta>}

      <Tabla
        titulos={['Fecha', 'Publicación', 'Empresa', 'Estado', 'Contactos', 'Acciones']}
        vacio={publicaciones.length === 0}
      >
        {publicaciones.map((publicacion) => (
          <tr key={publicacion.id} className="align-top">
            <td className="px-4 py-3 whitespace-nowrap text-humo-600">
              {publicacion.fecha}
              <span className="block text-xs text-humo-400">{publicacion.hora}</span>
            </td>
            <td className="px-4 py-3">
              <Link
                to={`/residuo/${publicacion.id}`}
                className="font-semibold text-humo-800 hover:text-marca-700 hover:underline"
              >
                {publicacion.titulo}
              </Link>
              <span className="block text-xs text-humo-500">
                {buscarMaterial(publicacion.materialId)?.material.nombre ?? publicacion.materialId} ·{' '}
                {formatearCantidad(publicacion.cantidad, publicacion.unidad)} · {publicacion.zona}
              </span>
            </td>
            <td className="px-4 py-3 text-humo-700">
              {publicacion.empresa}
              <span className="block text-xs text-humo-500">{publicacion.telefono}</span>
            </td>
            <td className="px-4 py-3">
              <EtiquetaEstado estado={publicacion.estado} />
            </td>
            <td className="px-4 py-3 text-center font-semibold text-humo-700">
              {publicacion.contactos}
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                {publicacion.estado !== 'disponible' && (
                  <Boton
                    variante="contorno"
                    tamano="sm"
                    disabled={ocupada === publicacion.id}
                    onClick={() => estado(publicacion.id, 'disponible')}
                  >
                    Activar
                  </Boton>
                )}
                {publicacion.estado === 'disponible' && (
                  <Boton
                    variante="contorno"
                    tamano="sm"
                    disabled={ocupada === publicacion.id}
                    onClick={() => estado(publicacion.id, 'pausada')}
                  >
                    Pausar
                  </Boton>
                )}
                <Boton
                  variante="peligro"
                  tamano="sm"
                  disabled={ocupada === publicacion.id}
                  onClick={() => setAEliminar(publicacion)}
                >
                  Eliminar
                </Boton>
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      <Modal
        abierto={Boolean(aEliminar)}
        titulo="¿Eliminar esta publicación?"
        descripcion={aEliminar ? `${aEliminar.titulo} — ${aEliminar.empresa}` : undefined}
        onCerrar={() => setAEliminar(null)}
      >
        <p className="text-sm text-humo-600">
          Se borra de la hoja y deja de aparecer en el marketplace. Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Boton
            variante="peligro"
            anchoCompleto
            onClick={() => {
              if (aEliminar) void ejecutar(aEliminar.id, () => eliminarPublicacionAdmin(aEliminar.id))
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

function TablaContactos({ datos, busqueda }: { datos: DatosAdmin; busqueda: string }) {
  const contactos = useMemo(() => {
    const termino = normalizar(busqueda)
    return [...datos.contactos]
      .reverse()
      .filter(
        (contacto) =>
          !termino ||
          normalizar(`${contacto.titulo} ${contacto.empresa} ${contacto.contacto}`).includes(termino),
      )
  }, [datos.contactos, busqueda])

  return (
    <Tabla titulos={['Fecha', 'Hora', 'Publicación', 'Quién consultó']} vacio={contactos.length === 0}>
      {contactos.map((contacto, indice) => (
        <tr key={`${contacto.creadoEn}-${indice}`}>
          <td className="px-4 py-3 whitespace-nowrap text-humo-600">{contacto.fecha}</td>
          <td className="px-4 py-3 whitespace-nowrap text-humo-600">{contacto.hora}</td>
          <td className="px-4 py-3 font-semibold text-humo-800">{contacto.titulo}</td>
          <td className="px-4 py-3 text-humo-700">
            {contacto.empresa ? (
              <>
                {contacto.empresa}
                <span className="block text-xs text-humo-500">
                  {contacto.contacto} · {contacto.tipo}
                </span>
              </>
            ) : (
              <span className="text-humo-500">Visitante sin cuenta</span>
            )}
          </td>
        </tr>
      ))}
    </Tabla>
  )
}

// ---------------------------------------------------------------- utilidades

function Alerta({ children }: { children: ReactNode }) {
  return (
    <p
      className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700"
      role="alert"
    >
      <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
      {children}
    </p>
  )
}

function nombreTipo(tipo: TipoUsuario): string {
  return tipo === 'oferente' ? 'Empresa' : tipo === 'recolector' ? 'Recolector' : 'Ambos'
}

function usuariosDe(datos: DatosAdmin, tipo: Seccion): UsuarioAdmin[] {
  return datos.usuarios
    .filter((usuario) => usuario.tipo === tipo)
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
}

function contar(datos: DatosAdmin, seccion: Seccion): string {
  if (seccion === 'resumen') return ''
  if (seccion === 'publicaciones') return String(datos.publicaciones.length)
  if (seccion === 'contactos') return String(datos.contactos.length)
  return String(usuariosDe(datos, seccion).length)
}

/** Filtra usuarios o publicaciones por cualquier texto visible. */
function filtrar<T extends UsuarioAdmin | PublicacionAdmin>(lista: T[], busqueda: string): T[] {
  const termino = normalizar(busqueda)
  if (!termino) return lista
  return lista.filter((item) => normalizar(Object.values(item).join(' ')).includes(termino))
}

function exportar(datos: DatosAdmin, seccion: Seccion): void {
  const hoy = new Date().toISOString().slice(0, 10)

  if (seccion === 'publicaciones') {
    descargarCsv(`ecoconecta-publicaciones-${hoy}.csv`, [
      ['Fecha', 'Hora', 'Título', 'Material', 'Cantidad', 'Zona', 'Empresa', 'Contacto', 'Teléfono', 'Estado', 'Contactos'],
      ...datos.publicaciones.map((p) => [
        p.fecha, p.hora, p.titulo, buscarMaterial(p.materialId)?.material.nombre ?? p.materialId,
        formatearCantidad(p.cantidad, p.unidad), p.zona, p.empresa, p.contacto, p.telefono, p.estado, p.contactos,
      ]),
    ])
    return
  }

  if (seccion === 'contactos') {
    descargarCsv(`ecoconecta-contactos-${hoy}.csv`, [
      ['Fecha', 'Hora', 'Publicación', 'Quién consultó', 'Contacto', 'Tipo'],
      ...datos.contactos.map((c) => [c.fecha, c.hora, c.titulo, c.empresa || 'Visitante sin cuenta', c.contacto, c.tipo]),
    ])
    return
  }

  const nombre = SECCIONES.find((opcion) => opcion.valor === seccion)?.texto.toLowerCase() ?? 'usuarios'
  descargarCsv(`ecoconecta-${nombre}-${hoy}.csv`, [
    ['Fecha', 'Hora', 'Empresa / negocio', 'Contacto', 'Teléfono', 'Correo', 'Confirmación'],
    ...usuariosDe(datos, seccion).map((u) => [
      u.fecha, u.hora, u.empresa, u.contacto, u.telefono, u.correo, u.correoConfirmacion,
    ]),
  ])
}
