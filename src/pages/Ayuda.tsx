import { Link } from 'react-router-dom'
import { clasesBoton } from '../components/ui/Boton'
import { Icono } from '../components/ui/Icono'
import type { NombreIcono } from '../components/ui/Icono'
import { EMPRESA, WHATSAPP_SOPORTE } from '../services/config'

/**
 * Manual de uso dentro del sitio (botón «Ayuda»). Tiene el mismo contenido
 * que el PDF de public/manual-ecoconecta-scz.pdf, que se descarga desde acá.
 */

/** base: './' en Vite: el PDF queda junto al index.html publicado. */
const URL_MANUAL_PDF = `${import.meta.env.BASE_URL}manual-ecoconecta-scz.pdf`

const URL_PUBLICA = 'https://toledogutierrezecoconecta-png.github.io/ecoconecta/'

const INDICE = [
  { id: 'secciones', texto: 'Secciones del sitio' },
  { id: 'registro', texto: 'Crear una cuenta paso a paso' },
  { id: 'datos', texto: 'Dónde quedan los datos' },
  { id: 'problemas', texto: 'Problemas frecuentes' },
  { id: 'soporte', texto: 'Soporte' },
  { id: 'ficha', texto: 'Ficha técnica' },
]

const SECCIONES: { icono: NombreIcono; nombre: string; a: string; detalle: string }[] = [
  {
    icono: 'hoja',
    nombre: 'Inicio',
    a: '/',
    detalle: 'Presenta la plataforma, los materiales más buscados y los botones para empezar.',
  },
  {
    icono: 'buscar',
    nombre: 'Explorar',
    a: '/explorar',
    detalle: 'Lista de materiales publicados, con filtros por categoría, distrito, precio y disponibilidad.',
  },
  {
    icono: 'ojo',
    nombre: 'Detalle de un material',
    a: '/explorar',
    detalle: 'Cantidad, frecuencia, zona, valor estimado y el botón «Contactar» (pide iniciar sesión).',
  },
  {
    icono: 'etiqueta',
    nombre: 'Publicar',
    a: '/publicar',
    detalle: 'Formulario para ofrecer un material. Solo para cuentas de oferente o ambos.',
  },
  {
    icono: 'grafico',
    nombre: 'Precios',
    a: '/precios',
    detalle: 'Rangos de referencia por material, en bolivianos, que usa EcoConecta SCZ.',
  },
  {
    icono: 'reciclaje',
    nombre: 'Cómo funciona',
    a: '/como-funciona',
    detalle: 'Pasos para oferentes y recolectores, preguntas frecuentes y contacto.',
  },
  {
    icono: 'usuario',
    nombre: 'Iniciar sesión / Crear cuenta',
    a: '/acceso?modo=registro',
    detalle: 'Ingreso con correo y contraseña, y el formulario de registro.',
  },
  {
    icono: 'tienda',
    nombre: 'Mi panel y Mi perfil',
    a: '/panel',
    detalle: 'Con sesión iniciada: tus publicaciones, las consultas recibidas, guardados y tus datos.',
  },
]

const CAMPOS: { campo: string; detalle: string }[] = [
  { campo: 'Tipo de usuario', detalle: 'Oferente (genera residuos), recolector/comprador o ambos.' },
  { campo: 'Nombre del negocio o empresa', detalle: 'Como querés que aparezca en tus publicaciones.' },
  { campo: 'Nombre de contacto', detalle: 'La persona que atiende las consultas.' },
  { campo: 'Teléfono / WhatsApp', detalle: 'Al menos 7 dígitos.' },
  { campo: 'Correo electrónico', detalle: 'Un correo válido; ahí llega la confirmación. Una cuenta por correo.' },
  { campo: 'Contraseña', detalle: 'Mínimo 6 caracteres.' },
  { campo: 'Lugar', detalle: 'Distrito municipal donde operás (DM-1 a DM-8).' },
  { campo: 'Fecha estimada', detalle: 'De tu primera entrega o recolección de material.' },
  { campo: 'Mensaje', detalle: 'Qué materiales generás o buscás.' },
]

const PROBLEMAS: { problema: string; solucion: string }[] = [
  {
    problema: 'No me llegó el correo de confirmación',
    solucion:
      'Revisá la carpeta Spam o Correo no deseado y marcalo como «No es spam». Si tampoco está ahí, revisá que el correo esté bien escrito en Mi perfil. La cuenta queda creada igual.',
  },
  {
    problema: '«Ya existe una cuenta registrada con ese correo electrónico»',
    solucion:
      'Ese correo ya tiene cuenta. Usá «Iniciar sesión» o, si no recordás la contraseña, «¿Olvidaste tu contraseña?».',
  },
  {
    problema: 'Olvidé mi contraseña',
    solucion:
      'En Iniciar sesión tocá «¿Olvidaste tu contraseña?». Te enviamos un código de 6 dígitos al correo para crear una nueva.',
  },
  {
    problema: 'El botón dice «Procesando…» unos segundos',
    solucion:
      'Es normal: la hoja de Google tarda de 2 a 5 segundos en guardar. No toques el botón de nuevo ni cierres la página.',
  },
  {
    problema: '«No pudimos conectarnos con EcoConecta SCZ»',
    solucion:
      'Revisá tu conexión a internet y volvé a intentar. Si tenías cambios sin guardar, se envían solos cuando vuelve la conexión.',
  },
  {
    problema: '«Tu sesión venció»',
    solucion: 'Volvé a iniciar sesión. Las sesiones duran 60 días.',
  },
  {
    problema: 'Un campo aparece en rojo y no deja enviar',
    solucion:
      'Falta un dato obligatorio o tiene un formato que no se acepta (por ejemplo, un correo sin @). El mensaje debajo del formulario dice cuál.',
  },
  {
    problema: 'No veo el botón «Publicar»',
    solucion:
      'Solo las cuentas de tipo oferente o ambos pueden publicar. Podés cambiar el tipo de cuenta en Mi perfil.',
  },
]

function Titulo({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="scroll-mt-20 text-2xl font-extrabold tracking-tight text-humo-800">
      {children}
    </h2>
  )
}

export function Ayuda() {
  return (
    <div>
      <section className="bg-marca-800 py-14 text-white md:py-16">
        <div className="contenedor max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Ayuda</h1>
          <p className="mt-4 text-lg text-marca-100/90">
            Manual de uso de EcoConecta SCZ: el marketplace que conecta a los negocios que generan
            residuos aprovechables con quienes los reciclan o reutilizan en Santa Cruz de la Sierra.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={URL_MANUAL_PDF}
              target="_blank"
              rel="noreferrer"
              className={clasesBoton('secundario', 'lg')}
            >
              <Icono nombre="flecha" className="h-5 w-5 rotate-90" />
              Descargar el manual (PDF)
            </a>
          </div>
        </div>
      </section>

      <div className="contenedor max-w-3xl space-y-14 py-12 md:py-16">
        <nav aria-label="Contenido de la ayuda" className="rounded-2xl border border-humo-200 bg-humo-50 p-5">
          <p className="text-sm font-bold tracking-wide text-humo-800 uppercase">Contenido</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {INDICE.map((item, indice) => (
              <li key={item.id}>
                <a href={`#${item.id}`} onClick={(evento) => irA(evento, item.id)} className="text-sm font-semibold text-marca-700 hover:underline">
                  {indice + 1}. {item.texto}
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-humo-600">
            Dirección pública del sitio:{' '}
            <a href={URL_PUBLICA} className="font-semibold break-all text-marca-700 hover:underline">
              {URL_PUBLICA}
            </a>
          </p>
        </nav>

        <section>
          <Titulo id="secciones">1. Secciones del sitio</Titulo>
          <p className="mt-3 text-humo-600">
            El menú de arriba lleva a cada sección. En el celular se abre con el botón de las tres
            rayas. Ver los materiales es libre; publicar y contactar piden una cuenta.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {SECCIONES.map((seccion) => (
              <li key={seccion.nombre} className="flex gap-3 rounded-2xl border border-humo-200 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marca-50 text-marca-600">
                  <Icono nombre={seccion.icono} className="h-5 w-5" />
                </span>
                <div>
                  <Link to={seccion.a} className="font-bold text-humo-800 hover:text-marca-700">
                    {seccion.nombre}
                  </Link>
                  <p className="mt-0.5 text-sm text-humo-600">{seccion.detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <Titulo id="registro">2. Crear una cuenta paso a paso</Titulo>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-humo-700">
            <li>
              Tocá <strong>Crear cuenta</strong> arriba a la derecha (o andá a{' '}
              <Link to="/acceso?modo=registro" className="font-semibold text-marca-700 hover:underline">
                Registrarme
              </Link>
              ).
            </li>
            <li>Completá todos los campos. Todos son obligatorios:</li>
          </ol>

          <div className="mt-4 overflow-hidden rounded-2xl border border-humo-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-humo-50 text-humo-800">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Campo</th>
                  <th className="px-4 py-2.5 font-bold">Qué poner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-humo-200">
                {CAMPOS.map((fila) => (
                  <tr key={fila.campo}>
                    <td className="px-4 py-2.5 font-semibold text-humo-800">{fila.campo}</td>
                    <td className="px-4 py-2.5 text-humo-600">{fila.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ol start={3} className="mt-4 list-decimal space-y-2 pl-5 text-humo-700">
            <li>
              Tocá <strong>Crear cuenta y continuar</strong>. El botón muestra «Procesando…» unos
              segundos mientras se guarda.
            </li>
            <li>
              Listo: aparece el aviso <strong>«¡Bienvenido a EcoConecta SCZ!»</strong>, entrás a tu
              panel y te llega un correo de confirmación con el resumen de tus datos.
            </li>
          </ol>
        </section>

        <section>
          <Titulo id="datos">3. Dónde quedan los datos y quién los ve</Titulo>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-humo-700">
            <li>
              Todo se guarda en una <strong>hoja de Google Sheets</strong> del grupo. Cada cuenta nueva es
              una fila en la pestaña <strong>Respuestas</strong>; los materiales van en{' '}
              <strong>Publicaciones</strong> y los contactos en <strong>Consultas</strong>.
            </li>
            <li>
              La hoja está en modo <strong>Restringido</strong>: solo la abren las personas agregadas.
              La cuenta del proyecto es la dueña y el docente la puede ver como lector.
            </li>
            <li>
              Las contraseñas no se guardan tal cual: se guarda un código cifrado (hash con sal) en un
              archivo privado aparte, que no se comparte con nadie.
            </li>
            <li>
              Cualquier visitante ve los materiales publicados, pero no los teléfonos: el WhatsApp de
              quien publica se muestra solo al tocar «Contactar» con una cuenta.
            </li>
          </ul>
          <p className="mt-4 text-sm text-humo-600">
            Más detalle en la{' '}
            <Link to="/privacidad" className="font-semibold text-marca-700 hover:underline">
              política de privacidad
            </Link>
            .
          </p>
        </section>

        <section>
          <Titulo id="problemas">4. Problemas frecuentes</Titulo>
          <div className="mt-4 divide-y divide-humo-200 border-y border-humo-200">
            {PROBLEMAS.map((item) => (
              <details key={item.problema} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-humo-800">
                  {item.problema}
                  <span className="shrink-0 text-humo-400 transition-transform group-open:rotate-45">
                    <Icono nombre="mas" className="h-5 w-5" />
                  </span>
                </summary>
                <p className="mt-2 text-humo-600">{item.solucion}</p>
              </details>
            ))}
          </div>
        </section>

        <section>
          <Titulo id="soporte">5. Soporte</Titulo>
          <p className="mt-3 text-humo-600">
            Si algo no funciona o tenés una duda que no está acá, escribinos. Contá qué estabas
            haciendo y, si podés, mandá una captura de pantalla.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${WHATSAPP_SOPORTE}`}
              target="_blank"
              rel="noreferrer"
              className={clasesBoton('primario', 'md')}
            >
              <Icono nombre="telefono" className="h-5 w-5" />
              WhatsApp {EMPRESA.telefono}
            </a>
            <a href={`mailto:${EMPRESA.correo}`} className={clasesBoton('contorno', 'md')}>
              <Icono nombre="correo" className="h-5 w-5" />
              <span className="break-all">{EMPRESA.correo}</span>
            </a>
          </div>
        </section>

        <section>
          <Titulo id="ficha">6. Ficha técnica (para quien mantenga el sitio)</Titulo>
          <dl className="mt-4 divide-y divide-humo-200 rounded-2xl border border-humo-200 text-sm">
            {[
              ['Sitio publicado', 'GitHub Pages, desde la rama gh-pages del repositorio toledogutierrezecoconecta-png/ecoconecta.'],
              ['Código', 'React + Vite + Tailwind en la rama main del mismo repositorio.'],
              ['Base de datos', 'Hoja de Google Sheets (pestañas Respuestas, Empresas, Recolectores, Ambos, Publicaciones y Consultas).'],
              ['Servidor', 'Google Apps Script publicado como aplicación web (una sola URL /exec). Código en apps-script/Codigo.gs.'],
              ['Dueño de la cuenta', `Cuenta de Google del proyecto: ${EMPRESA.correo} (hoja, Apps Script y GitHub).`],
              ['Cambiar un texto', 'Editar el archivo de la página en src/pages/ (por ejemplo, Ayuda.tsx) o los datos de contacto en src/services/config.ts, y publicar con npm run deploy.'],
              ['Cambiar un campo del formulario', 'Página: src/pages/Acceso.tsx (y el tipo en src/types/index.ts). Hoja: la lista COLUMNAS_RESPUESTAS y la función de registro en apps-script/Codigo.gs; luego npm run sheets:publicar y npm run deploy.'],
            ].map(([dato, detalle]) => (
              <div key={dato} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                <dt className="font-bold text-humo-800">{dato}</dt>
                <dd className="text-humo-600">{detalle}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}

/** Con HashRouter un enlace «#seccion» cambiaría de página: se desplaza a mano. */
function irA(evento: React.MouseEvent, id: string) {
  evento.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
