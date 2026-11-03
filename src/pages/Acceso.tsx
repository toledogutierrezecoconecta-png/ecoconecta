import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Boton } from '../components/ui/Boton'
import { CampoArea, CampoSelect, CampoTexto } from '../components/ui/Campo'
import { Icono } from '../components/ui/Icono'
import { TIPOS_USUARIO, ZONAS } from '../data/catalogos'
import { useAuth } from '../hooks/useAuth'
import { consumirAvisoSesionVencida } from '../services/sesion'
import type { TipoUsuario } from '../types'
import simbolo from '../assets/marca/simbolo.webp'

type Modo = 'ingreso' | 'registro'

/** Fecha de hoy en Bolivia, "yyyy-MM-dd": mínimo para la fecha estimada. */
function hoyEnBolivia(): string {
  return new Date(Date.now() - 4 * 3600000).toISOString().slice(0, 10)
}

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
    zona: '',
    fecha: '',
    mensaje: '',
    // Campo trampa: las personas no lo ven; si llega con texto, es un robot.
    website: '',
  })
  // Al llegar desde "Guardar" o "Contactar" se vuelve a esa página después de
  // ingresar. Solo se aceptan rutas internas, nunca una dirección externa.
  const volver = parametros.get('volver') ?? ''

  // Quien llega desde una publicación ajena viene a buscar materiales.
  const [tipo, setTipo] = useState<TipoUsuario>(volver ? 'recolector' : 'oferente')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sesionVencida] = useState(consumirAvisoSesionVencida)

  const destino = volver.startsWith('/') && !volver.startsWith('//') ? volver : '/panel'

  // Si ya hay sesión activa no tiene sentido mostrar el formulario.
  useEffect(() => {
    if (usuario) navegar(destino, { replace: true })
  }, [usuario, navegar, destino])

  const cambiar = (campo: keyof typeof formulario, valor: string) =>
    setFormulario((actual) => ({ ...actual, [campo]: valor }))

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    setError('')
    setEnviando(true)

    try {
      if (modo === 'registro') {
        // Un robot llenó el campo invisible: no se envía nada.
        if (formulario.website) throw new Error('No se pudo completar el registro.')
        await registrar({ ...formulario, tipo })
      } else {
        await iniciarSesion(formulario.correo, formulario.clave)
      }
      navegar(destino)
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
          <img src={simbolo} alt="" className="mx-auto h-14 w-14" width={128} height={128} />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-humo-800">
            {modo === 'registro' ? 'Creá tu cuenta' : 'Ingresá a tu cuenta'}
          </h1>
          <p className="mt-2 text-sm text-humo-600">
            {modo === 'registro'
              ? 'Publicá materiales o encontrá los que tu negocio necesita.'
              : 'Accedé a tus publicaciones y a las consultas que recibiste.'}
          </p>
        </div>

        {sesionVencida && (
          <p
            className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
            role="status"
          >
            <Icono nombre="reloj" className="mt-0.5 h-4 w-4 shrink-0" />
            Tu sesión venció. Volvé a ingresar para seguir; los cambios que no se guardaron se
            envían solos después de ingresar.
          </p>
        )}

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
                ? 'Con este correo y contraseña ingresás desde cualquier dispositivo. Usá una contraseña que no uses en otros sitios.'
                : undefined
            }
            value={formulario.clave}
            onChange={(evento) => cambiar('clave', evento.target.value)}
            required
          />

          {modo === 'ingreso' && (
            <div className="-mt-1 text-right">
              <Link
                to="/recuperar"
                state={{ correo: formulario.correo }}
                className="text-sm font-semibold text-marca-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}

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

          {modo === 'registro' && (
            <>
              <CampoSelect
                etiqueta="Lugar: zona donde operás"
                value={formulario.zona}
                onChange={(evento) => cambiar('zona', evento.target.value)}
                required
              >
                <option value="" disabled>
                  Elegí tu zona
                </option>
                {ZONAS.map((zona) => (
                  <option key={zona} value={zona}>
                    {zona}
                  </option>
                ))}
              </CampoSelect>

              <CampoTexto
                etiqueta={
                  tipo === 'recolector'
                    ? 'Fecha estimada de tu primera recolección'
                    : 'Fecha estimada de tu primera entrega de material'
                }
                type="date"
                min={hoyEnBolivia()}
                value={formulario.fecha}
                onChange={(evento) => cambiar('fecha', evento.target.value)}
                required
              />

              <CampoArea
                etiqueta={
                  tipo === 'recolector'
                    ? 'Mensaje: ¿qué materiales buscás?'
                    : tipo === 'ambos'
                      ? 'Mensaje: ¿qué materiales generás y cuáles buscás?'
                      : 'Mensaje: ¿qué materiales genera tu negocio?'
                }
                placeholder="Ej: aceite de cocina usado, unos 40 litros por semana"
                rows={3}
                maxLength={500}
                value={formulario.mensaje}
                onChange={(evento) => cambiar('mensaje', evento.target.value)}
                required
              />

              {/* Honeypot: fuera de la vista y del teclado; solo un robot lo completa. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={formulario.website}
                onChange={(evento) => cambiar('website', evento.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
              />
            </>
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
