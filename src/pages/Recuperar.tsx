import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Boton } from '../components/ui/Boton'
import { CampoTexto } from '../components/ui/Campo'
import { Icono } from '../components/ui/Icono'
import { useAuth } from '../hooks/useAuth'
import { solicitarRecuperacion } from '../services/auth'
import simbolo from '../assets/marca/simbolo.webp'

type Paso = 'correo' | 'codigo'

/**
 * Restablecer la contraseña en dos pasos: pedir un código por correo y
 * escribirlo junto con la contraseña nueva. El enlace del correo trae el
 * correo en la dirección, así que se llega directo al segundo paso.
 */
export function Recuperar() {
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const { restablecerClave } = useAuth()

  // Desde el correo llega en la dirección (directo a escribir el código);
  // desde "¿Olvidaste tu contraseña?" llega lo que ya se había escrito.
  const correoDelEnlace = parametros.get('correo') ?? ''
  const correoEscrito = (ubicacion.state as { correo?: string } | null)?.correo ?? ''
  const [paso, setPaso] = useState<Paso>(correoDelEnlace ? 'codigo' : 'correo')
  const [correo, setCorreo] = useState(correoDelEnlace || correoEscrito)
  const [codigo, setCodigo] = useState('')
  const [clave, setClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const pedirCodigo = async (evento?: React.FormEvent) => {
    evento?.preventDefault()
    setError('')
    setEnviando(true)

    try {
      await solicitarRecuperacion(correo)
      setPaso('codigo')
      setCodigo('')
      setAviso(
        `Si hay una cuenta con ${correo.trim().toLowerCase()}, te mandamos un código de 6 dígitos. Revisá también la carpeta de spam.`,
      )
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo enviar el código.')
    } finally {
      setEnviando(false)
    }
  }

  const guardarClave = async (evento: React.FormEvent) => {
    evento.preventDefault()
    setError('')

    if (clave !== confirmacion) {
      setError('Las dos contraseñas no coinciden.')
      return
    }

    setEnviando(true)
    try {
      await restablecerClave(correo, codigo, clave)
      navegar('/panel', { replace: true })
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo guardar la contraseña.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="contenedor flex justify-center py-10 md:py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img src={simbolo} alt="" className="mx-auto h-14 w-14" width={128} height={128} />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-humo-800">
            {paso === 'correo' ? 'Recuperá tu contraseña' : 'Creá una contraseña nueva'}
          </h1>
          <p className="mt-2 text-sm text-humo-600">
            {paso === 'correo'
              ? 'Te mandamos un código a tu correo para crear una contraseña nueva.'
              : 'Escribí el código que te llegó por correo y elegí tu contraseña nueva.'}
          </p>
        </div>

        {paso === 'correo' ? (
          <form
            onSubmit={pedirCodigo}
            className="space-y-4 rounded-2xl border border-humo-200 bg-white p-6"
          >
            <CampoTexto
              etiqueta="Correo electrónico de tu cuenta"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="contacto@minegocio.bo"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              required
            />

            <Mensajes error={error} />

            <Boton type="submit" tamano="lg" anchoCompleto disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar código'}
            </Boton>
          </form>
        ) : (
          <form
            onSubmit={guardarClave}
            className="space-y-4 rounded-2xl border border-humo-200 bg-white p-6"
          >
            <div className="rounded-xl bg-humo-50 px-4 py-3 text-sm text-humo-600">
              {aviso || (
                <>
                  Código enviado a <span className="font-semibold text-humo-800">{correo}</span>.
                  Revisá también la carpeta de spam.
                </>
              )}
            </div>

            <CampoTexto
              etiqueta="Código de 6 dígitos"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              pattern="\d{6}"
              title="El código tiene 6 números."
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, ''))}
              required
            />

            <CampoTexto
              etiqueta="Contraseña nueva"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              value={clave}
              onChange={(evento) => setClave(evento.target.value)}
              required
            />

            <CampoTexto
              etiqueta="Repetí la contraseña nueva"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={confirmacion}
              onChange={(evento) => setConfirmacion(evento.target.value)}
              required
            />

            <Mensajes error={error} />

            <Boton type="submit" tamano="lg" anchoCompleto disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar contraseña e ingresar'}
            </Boton>

            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <button
                type="button"
                onClick={() => void pedirCodigo()}
                disabled={enviando || !correo}
                className="font-semibold text-marca-700 hover:underline disabled:opacity-50"
              >
                Reenviar el código
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaso('correo')
                  setAviso('')
                  setError('')
                }}
                className="font-semibold text-humo-600 hover:underline"
              >
                Usar otro correo
              </button>
            </div>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-humo-500">
          ¿Te acordaste?{' '}
          <Link to="/acceso" className="font-semibold text-marca-700 hover:underline">
            Volver a ingresar
          </Link>
        </p>
      </div>
    </div>
  )
}

function Mensajes({ error }: { error: string }) {
  if (!error) return null

  return (
    <p
      className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700"
      role="alert"
    >
      <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
      {error}
    </p>
  )
}
