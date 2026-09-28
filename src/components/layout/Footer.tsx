import { Link } from 'react-router-dom'
import { EMPRESA, WHATSAPP_SOPORTE } from '../../services/config'
import { Icono } from '../ui/Icono'
import logo from '../../assets/marca/logo.webp'

const ENLACES = [
  { a: '/como-funciona', texto: 'Cómo funciona' },
  { a: '/precios', texto: 'Cómo definimos los precios' },
  { a: '/como-funciona#quienes', texto: 'Sobre nosotros' },
  { a: '/como-funciona#preguntas', texto: 'Preguntas frecuentes' },
  { a: '/como-funciona#contacto', texto: 'Contacto' },
  { a: '/terminos', texto: 'Términos y condiciones' },
  { a: '/privacidad', texto: 'Política de privacidad' },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-humo-200 bg-humo-50">
      <div className="contenedor py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <img src={logo} alt="EcoConecta SCZ" className="h-12 w-auto" width={460} height={112} />

            <p className="mt-3 max-w-sm text-sm text-humo-600">
              Conectamos residuos con nuevas oportunidades. Lo que para un negocio es descarte,
              para otro es materia prima.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-humo-700">
              <li className="flex items-center gap-1.5 font-semibold">
                <Icono nombre="ubicacion" className="h-4 w-4 shrink-0 text-marca-600" />
                {EMPRESA.ciudad}
              </li>

              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_SOPORTE}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 transition-colors hover:text-marca-700"
                >
                  <Icono nombre="telefono" className="h-4 w-4 shrink-0 text-marca-600" />
                  {EMPRESA.telefono}
                </a>
              </li>

              <li>
                <a
                  href={`mailto:${EMPRESA.correo}`}
                  className="flex items-center gap-1.5 transition-colors hover:text-marca-700"
                >
                  <Icono nombre="correo" className="h-4 w-4 shrink-0 text-marca-600" />
                  <span className="break-all">{EMPRESA.correo}</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold tracking-wide text-humo-800 uppercase">Plataforma</h3>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {ENLACES.map((enlace) => (
                <li key={enlace.texto}>
                  <Link
                    to={enlace.a}
                    className="text-sm text-humo-600 transition-colors hover:text-marca-700"
                  >
                    {enlace.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-humo-200 pt-6 text-xs text-humo-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EcoConecta SCZ. Todos los derechos reservados.</p>
          <p>Versión de demostración con datos de ejemplo.</p>
        </div>
      </div>
    </footer>
  )
}
