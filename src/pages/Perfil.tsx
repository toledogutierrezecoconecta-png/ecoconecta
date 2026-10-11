import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Boton } from '../components/ui/Boton'
import { CampoSelect, CampoTexto } from '../components/ui/Campo'
import { Icono } from '../components/ui/Icono'
import { TIPOS_USUARIO, ZONAS } from '../data/catalogos'
import { useAuth } from '../hooks/useAuth'
import type { TipoUsuario } from '../types'
import { buscaMateriales } from '../utils/roles'

export function Perfil() {
  const { usuario, actualizarPerfil, cerrarSesion } = useAuth()
  const navegar = useNavigate()
  /** null: sin guardar; número: guardado, con cuántas publicaciones se actualizaron. */
  const [guardado, setGuardado] = useState<number | null>(null)

  const [formulario, setFormulario] = useState({
    empresa: usuario?.empresa ?? '',
    contacto: usuario?.contacto ?? '',
    telefono: usuario?.telefono ?? '',
    tipo: (usuario?.tipo ?? 'oferente') as TipoUsuario,
    zonaInteres: usuario?.zonaInteres ?? '',
  })

  if (!usuario) return <Navigate to="/acceso" replace />

  const cambiar = (campo: keyof typeof formulario, valor: string) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
    setGuardado(null)
  }

  const guardar = (evento: React.FormEvent) => {
    evento.preventDefault()
    setGuardado(actualizarPerfil(formulario))
  }

  return (
    <div className="contenedor flex justify-center py-8 md:py-12">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-humo-800">Mi perfil</h1>
        <p className="mt-2 text-humo-600">
          Estos datos son los que ven los negocios con los que te conectás.
        </p>

        <form
          onSubmit={guardar}
          className="mt-8 space-y-5 rounded-2xl border border-humo-200 bg-white p-6"
        >
          <CampoTexto
            etiqueta="Nombre del negocio o empresa"
            value={formulario.empresa}
            onChange={(evento) => cambiar('empresa', evento.target.value)}
            required
          />

          <CampoTexto
            etiqueta="Nombre de contacto"
            value={formulario.contacto}
            onChange={(evento) => cambiar('contacto', evento.target.value)}
            required
          />

          <CampoTexto
            etiqueta="Teléfono / WhatsApp"
            type="tel"
            inputMode="tel"
            value={formulario.telefono}
            onChange={(evento) => cambiar('telefono', evento.target.value)}
            required
          />

          <CampoSelect
            etiqueta="Tipo de usuario"
            ayuda="Define qué ves en tu panel y en el menú."
            value={formulario.tipo}
            onChange={(evento) => cambiar('tipo', evento.target.value)}
          >
            {TIPOS_USUARIO.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.titulo}
              </option>
            ))}
          </CampoSelect>

          {buscaMateriales(formulario.tipo) && (
            <CampoSelect
              etiqueta="Zona donde trabajás"
              ayuda="Tu panel te muestra primero lo que se publica en esta zona."
              value={formulario.zonaInteres}
              onChange={(evento) => cambiar('zonaInteres', evento.target.value)}
            >
              <option value="">Toda la ciudad</option>
              {ZONAS.map((zona) => (
                <option key={zona} value={zona}>
                  {zona}
                </option>
              ))}
            </CampoSelect>
          )}

          <div className="rounded-xl bg-humo-50 px-4 py-3">
            <p className="text-xs font-semibold tracking-wide text-humo-500 uppercase">
              Correo electrónico
            </p>
            <p className="mt-0.5 font-semibold text-humo-700">{usuario.correo}</p>
            <p className="mt-1 text-xs text-humo-500">
              El correo no se puede modificar en esta versión.
            </p>
          </div>

          {guardado !== null && (
            <p
              className="flex items-start gap-2 rounded-xl bg-marca-50 p-3 text-sm font-semibold text-marca-700"
              role="status"
            >
              <Icono nombre="check" className="mt-0.5 h-4 w-4 shrink-0" />
              {guardado === 0
                ? 'Cambios guardados correctamente.'
                : guardado === 1
                  ? 'Cambios guardados. También se actualizó tu publicación con los datos nuevos.'
                  : `Cambios guardados. También se actualizaron tus ${guardado} publicaciones con los datos nuevos.`}
            </p>
          )}

          <Boton type="submit" tamano="lg" anchoCompleto>
            Guardar cambios
          </Boton>
        </form>

        <div className="mt-6 rounded-2xl border border-humo-200 bg-white p-6">
          <h2 className="font-bold text-humo-800">Sesión</h2>
          <p className="mt-1 text-sm text-humo-600">
            Cerrá la sesión si estás usando un dispositivo compartido.
          </p>

          <Boton
            variante="contorno"
            anchoCompleto
            className="mt-4"
            onClick={() => {
              cerrarSesion()
              navegar('/')
            }}
          >
            <Icono nombre="salir" className="h-4 w-4" />
            Cerrar sesión
          </Boton>
        </div>
      </div>
    </div>
  )
}
