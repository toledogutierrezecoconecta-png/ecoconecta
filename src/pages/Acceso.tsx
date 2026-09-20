import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Boton } from '../components/ui/Boton'
import { CampoTexto } from '../components/ui/Campo'
import { Icono } from '../components/ui/Icono'
import { TIPOS_USUARIO } from '../data/catalogos'
import { useAuth } from '../hooks/useAuth'
import type { TipoUsuario } from '../types'

type Modo = 'ingreso' | 'registro'

export function Acceso() {
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const { usuario, registrar, iniciarSesion } = useAuth()

  const [modo, setModo] = useState<Modo>(
    parametros.get('modo') === 'registro' ? 'registro' : 'ingreso',
  )
  const [formulario, setFormulario] = useState({
    empresa: '',
    contacto: '',
    telefono: '',
    correo: '',
    clave: '',
  })
  const [tipo, setTipo] = useState<TipoUsuario>('oferente')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Si ya hay sesión activa no tiene sentido mostrar el formulario.
  useEffect(() => {
    if (usuario) navegar('/panel', { replace: true })
  }, [usuario, navegar])

  const cambiar = (campo: keyof typeof formulario, valor: string) =>
    setFormulario((actual) => ({ ...actual, [campo]: valor }))

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    setError('')
    setEnviando(true)

    try {
      if (modo === 'registro') {
        await registrar({ ...formulario, tipo })
      } else {
        await iniciarSesion(formulario.correo, formulario.clave)
      }
      navegar('/panel')
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo completar la operación.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="contenedor flex justify-center py-10 md:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-marca-600 text-white">
            <Icono nombre="reciclaje" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-humo-800">
            {modo === 'registro' ? 'Creá tu cuenta' : 'Ingresá a tu cuenta'}
          </h1>
          <p className="mt-2 text-sm text-humo-600">
            {modo === 'registro'
              ? 'Publicá materiales o encontrá los que tu negocio necesita.'
              : 'Accedé a tus publicaciones y a los contactos recibidos.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-humo-100 p-1">
          {(['ingreso', 'registro'] as Modo[]).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => {
                setModo(opcion)
                setError('')
              }}
              className={`rounded-lg py-2.5 text-sm font-bold transition-colors ${
                modo === opcion ? 'bg-white text-humo-800 shadow-sm' : 'text-humo-500'
              }`}
            >
              {opcion === 'ingreso' ? 'Iniciar sesión' : 'Registrarme'}
            </button>
          ))}
        </div>

        <form
          onSubmit={enviar}
          className="space-y-4 rounded-2xl border border-humo-200 bg-white p-6"
        >
          {modo === 'registro' && (
            <>
              <CampoTexto
                etiqueta="Nombre del negocio o empresa"
                placeholder="Ej: Pollos El Fogón"
                value={formulario.empresa}
                onChange={(evento) => cambiar('empresa', evento.target.value)}
                required
              />

              <CampoTexto
                etiqueta="Nombre de contacto"
                placeholder="Ej: Marcela Áñez"
                value={formulario.contacto}
                onChange={(evento) => cambiar('contacto', evento.target.value)}
                required
              />

              <CampoTexto
                etiqueta="Teléfono / WhatsApp"
                type="tel"
                inputMode="tel"
                placeholder="70011223"
                ayuda="Con este número los interesados te contactarán por WhatsApp."
                value={formulario.telefono}
                onChange={(evento) => cambiar('telefono', evento.target.value)}
                required
              />
            </>
          )}

          <CampoTexto
            etiqueta="Correo electrónico"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="contacto@minegocio.bo"
            value={formulario.correo}
            onChange={(evento) => cambiar('correo', evento.target.value)}
            required
          />

          <CampoTexto
            etiqueta="Contraseña"
            type="password"
            autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            ayuda={
              modo === 'registro'
                ? 'Versión de demostración: no uses una contraseña real.'
                : undefined
            }
            value={formulario.clave}
            onChange={(evento) => cambiar('clave', evento.target.value)}
            required
          />

          {modo === 'registro' && (
            <fieldset>
              <legend className="mb-2 block text-sm font-semibold text-humo-700">
                Tipo de usuario <span className="text-marca-600">*</span>
              </legend>

              <div className="space-y-2">
                {TIPOS_USUARIO.map((opcion) => (
                  <label
                    key={opcion.valor}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                      tipo === opcion.valor
                        ? 'border-marca-500 bg-marca-50'
                        : 'border-humo-200 hover:border-humo-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={opcion.valor}
                      checked={tipo === opcion.valor}
                      onChange={() => setTipo(opcion.valor)}
                      className="mt-1 h-4 w-4 accent-marca-600"
                    />
                    <span>
                      <span className="block text-sm font-bold text-humo-800">{opcion.titulo}</span>
                      <span className="block text-xs text-humo-600">{opcion.detalle}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {error && (
            <p
              className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700"
              role="alert"
            >
              <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <Boton type="submit" tamano="lg" anchoCompleto disabled={enviando}>
            {enviando
              ? 'Procesando…'
              : modo === 'registro'
                ? 'Crear cuenta y continuar'
                : 'Ingresar'}
          </Boton>
        </form>

        <p className="mt-5 text-center text-xs text-humo-500">
          Al continuar aceptás los{' '}
          <Link to="/terminos" className="font-semibold text-marca-700 hover:underline">
            términos y condiciones
          </Link>{' '}
          de la plataforma.
        </p>
      </div>
    </div>
  )
}
