import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { clasesBoton } from '../ui/Boton'
import { Icono } from '../ui/Icono'

interface Enlace {
  a: string
  texto: string
}

const PUBLICOS: Enlace[] = [
  { a: '/', texto: 'Inicio' },
  { a: '/explorar', texto: 'Explorar' },
  { a: '/publicar', texto: 'Publicar' },
  { a: '/precios', texto: 'Precios' },
  { a: '/como-funciona', texto: 'Cómo funciona' },
]

const PRIVADOS: Enlace[] = [
  { a: '/explorar', texto: 'Explorar' },
  { a: '/publicar', texto: 'Publicar' },
  { a: '/panel', texto: 'Mis publicaciones' },
  { a: '/precios', texto: 'Precios' },
  { a: '/perfil', texto: 'Mi perfil' },
]

/** A partir de cuántos píxeles de desplazamiento aparece el menú en la portada. */
const UMBRAL_APARICION = 80

export function Navbar() {
  const { usuario, cerrarSesion } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const [desplazado, setDesplazado] = useState(false)
  const ubicacion = useLocation()
  const navegar = useNavigate()

  // En la portada el menú estorba la ilustración, así que arranca escondido y
  // aparece apenas se baja. Al volver al tope vuelve a esconderse.
  const esPortada = ubicacion.pathname === '/'

  useEffect(() => {
    if (!esPortada) {
      setDesplazado(false)
      return
    }

    const alDesplazar = () => setDesplazado(window.scrollY > UMBRAL_APARICION)

    alDesplazar() // por si se entra con la página ya desplazada
    window.addEventListener('scroll', alDesplazar, { passive: true })

    return () => window.removeEventListener('scroll', alDesplazar)
  }, [esPortada])

  // Al cambiar de página se cierra el menú móvil.
  useEffect(() => setAbierto(false), [ubicacion.pathname])

  // Con el menú desplegado nunca se esconde: dejaría las opciones inalcanzables.
  const escondido = esPortada && !desplazado && !abierto

  const enlaces = usuario ? PRIVADOS : PUBLICOS

  const salir = () => {
    cerrarSesion()
    navegar('/')
  }

  const clasesEnlace = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-[15px] font-semibold transition-colors ${
      isActive ? 'bg-marca-50 text-marca-700' : 'text-humo-600 hover:bg-humo-100 hover:text-humo-800'
    }`

  return (
    <header
      className={`z-40 border-b border-humo-200 bg-white/95 backdrop-blur transition-transform duration-300 ease-out ${
        // En la portada va fijo para no dejar un hueco blanco cuando se esconde.
        esPortada ? 'fixed inset-x-0 top-0' : 'sticky top-0'
      } ${escondido ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <nav className="contenedor flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="EcoConecta SCZ, ir al inicio">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-marca-600 text-white">
            <Icono nombre="reciclaje" className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-humo-800">
            EcoConecta <span className="text-marca-600">SCZ</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {enlaces.map((enlace) => (
            <NavLink key={enlace.a} to={enlace.a} className={clasesEnlace} end={enlace.a === '/'}>
              {enlace.texto}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {usuario ? (
            <>
              <div className="text-right leading-tight">
                <p className="max-w-[160px] truncate text-sm font-semibold text-humo-800">
                  {usuario.empresa}
                </p>
                <p className="text-xs text-humo-500">{usuario.contacto}</p>
              </div>
              <button
                type="button"
                onClick={salir}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-humo-600 transition-colors hover:bg-humo-100 hover:text-humo-800"
              >
                <Icono nombre="salir" className="h-4 w-4" />
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/acceso" className={clasesBoton('contorno', 'sm')}>
                Iniciar sesión
              </Link>
              <Link to="/acceso?modo=registro" className={clasesBoton('primario', 'sm')}>
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          className="rounded-lg p-2 text-humo-700 transition-colors hover:bg-humo-100 lg:hidden"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto}
        >
          <Icono nombre={abierto ? 'cerrar' : 'menu'} className="h-6 w-6" />
        </button>
      </nav>

      {abierto && (
        <div className="border-t border-humo-200 bg-white lg:hidden">
          <div className="contenedor flex flex-col gap-1 py-3">
            {usuario && (
              <div className="mb-2 rounded-xl bg-humo-50 px-3 py-2.5">
                <p className="text-sm font-bold text-humo-800">{usuario.empresa}</p>
                <p className="text-xs text-humo-500">{usuario.correo}</p>
              </div>
            )}

            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.a}
                to={enlace.a}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-3 text-base font-semibold transition-colors ${
                    isActive ? 'bg-marca-50 text-marca-700' : 'text-humo-700 hover:bg-humo-100'
                  }`
                }
                end={enlace.a === '/'}
              >
                {enlace.texto}
              </NavLink>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-humo-200 pt-3">
              {usuario ? (
                <button type="button" onClick={salir} className={clasesBoton('contorno', 'md', true)}>
                  <Icono nombre="salir" className="h-4 w-4" />
                  Cerrar sesión
                </button>
              ) : (
                <>
                  <Link to="/acceso" className={clasesBoton('contorno', 'md', true)}>
                    Iniciar sesión
                  </Link>
                  <Link to="/acceso?modo=registro" className={clasesBoton('primario', 'md', true)}>
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
