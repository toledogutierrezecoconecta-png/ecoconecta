import { Link } from 'react-router-dom'
import { clasesBoton } from '../components/ui/Boton'
import { Icono } from '../components/ui/Icono'

interface Seccion {
  titulo: string
  parrafos: string[]
}

function PaginaLegal({
  titulo,
  introduccion,
  secciones,
}: {
  titulo: string
  introduccion: string
  secciones: Seccion[]
}) {
  return (
    <div className="contenedor max-w-3xl py-10 md:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">{titulo}</h1>
      <p className="mt-4 text-humo-600">{introduccion}</p>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-tierra-200 bg-tierra-50 p-4">
        <span className="mt-0.5 text-tierra-700">
          <Icono nombre="alerta" className="h-5 w-5" />
        </span>
        <p className="text-sm text-tierra-800">
          Este documento es un texto de referencia para la versión de demostración de EcoConecta SCZ.
          Antes de operar comercialmente debe ser revisado por un profesional legal.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {secciones.map((seccion) => (
          <section key={seccion.titulo}>
            <h2 className="text-lg font-bold text-humo-800">{seccion.titulo}</h2>
            <div className="mt-2 space-y-3 leading-relaxed text-humo-600">
              {seccion.parrafos.map((parrafo) => (
                <p key={parrafo.slice(0, 40)}>{parrafo}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Link to="/" className={`${clasesBoton('contorno', 'md')} mt-12`}>
        Volver al inicio
      </Link>
    </div>
  )
}

export function Terminos() {
  return (
    <PaginaLegal
      titulo="Términos y condiciones"
      introduccion="Estas condiciones regulan el uso de la plataforma EcoConecta SCZ en Santa Cruz de la Sierra, Bolivia."
      secciones={[
        {
          titulo: '1. Qué es EcoConecta SCZ',
          parrafos: [
            'EcoConecta SCZ es una plataforma digital que conecta a empresas que generan materiales aprovechables con recicladores, centros de acopio, recolectores y compradores interesados en reutilizarlos.',
            'Actuamos como intermediario: ayudamos a publicar los materiales, encontrar posibles interesados, facilitar la comunicación y dar seguimiento a las operaciones.',
            'La plataforma no compra, no vende, no transporta ni almacena materiales, y no interviene en el pago entre las partes.',
          ],
        },
        {
          titulo: '2. Naturaleza de los precios publicados',
          parrafos: [
            'Los montos que la plataforma muestra son PRECIOS DE REFERENCIA elaborados por EcoConecta SCZ a partir de un relevamiento con empresas recicladoras. No constituyen una oferta de compra, una tasación ni un precio de venta obligatorio.',
            'El valor estimado de cada publicación es una proyección calculada sobre la cantidad declarada por el oferente y el rango de referencia vigente. El monto efectivamente pagado puede diferir según el estado real del material, el volumen y las condiciones de retiro.',
            'EcoConecta SCZ no garantiza que una operación se concrete a los valores publicados.',
          ],
        },
        {
          titulo: '3. Responsabilidad de las partes',
          parrafos: [
            'El acuerdo sobre cantidad, precio final, horario de retiro y condiciones de entrega se realiza directamente entre el oferente y el interesado.',
            'Cada usuario es responsable de la veracidad de la información que publica y del cumplimiento de la normativa municipal y ambiental que corresponda a su actividad.',
          ],
        },
        {
          titulo: '4. Uso de las publicaciones',
          parrafos: [
            'Solo pueden publicarse materiales aprovechables. Queda prohibido publicar residuos peligrosos, patogénicos, sustancias controladas o cualquier material cuya comercialización requiera una autorización que el usuario no posea.',
            'EcoConecta SCZ puede dar de baja publicaciones que incumplan estas condiciones.',
          ],
        },
        {
          titulo: '5. Cuentas',
          parrafos: [
            'Cada usuario es responsable de mantener la confidencialidad de sus credenciales y de la actividad realizada desde su cuenta.',
            'En esta versión de demostración la autenticación es simulada y los datos se guardan en el navegador del usuario.',
          ],
        },
        {
          titulo: '6. Modificaciones',
          parrafos: [
            'EcoConecta SCZ puede actualizar estas condiciones. Los cambios relevantes se comunicarán dentro de la plataforma.',
          ],
        },
      ]}
    />
  )
}

export function Privacidad() {
  return (
    <PaginaLegal
      titulo="Política de privacidad"
      introduccion="Así se tratan los datos que se cargan en EcoConecta SCZ."
      secciones={[
        {
          titulo: '1. Qué datos se recolectan',
          parrafos: [
            'Al crear una cuenta se solicitan: nombre del negocio, nombre de contacto, teléfono y correo electrónico.',
            'Al publicar un material se registran los datos de la oferta: descripción, cantidad, frecuencia, zona, dirección aproximada, modalidad de entrega y, opcionalmente, una fotografía.',
          ],
        },
        {
          titulo: '2. Para qué se usan',
          parrafos: [
            'Los datos se usan para mostrar las publicaciones en el marketplace y permitir que los interesados contacten al oferente.',
            'El nombre del negocio, el nombre de contacto y la zona son visibles públicamente en cada publicación. El teléfono se utiliza para habilitar el contacto directo.',
          ],
        },
        {
          titulo: '3. Dónde se guardan',
          parrafos: [
            'En esta versión de demostración la información se almacena en el navegador del usuario y, cuando la integración está activa, en una hoja de cálculo de Google administrada por el equipo de EcoConecta SCZ.',
            'Las fotografías se guardan únicamente en el dispositivo desde el que se realizó la publicación.',
          ],
        },
        {
          titulo: '4. Con quién se comparten',
          parrafos: [
            'Los datos no se venden ni se ceden a terceros con fines publicitarios.',
            'La información de contacto queda disponible para los usuarios de la plataforma que consulten por una publicación.',
          ],
        },
        {
          titulo: '5. Derechos del usuario',
          parrafos: [
            'Cualquier usuario puede editar o eliminar sus publicaciones desde su panel, y solicitar la baja de su cuenta escribiendo al canal de contacto de la plataforma.',
          ],
        },
      ]}
    />
  )
}

export function NoEncontrada() {
  return (
    <div className="contenedor py-24 text-center">
      <p className="text-6xl font-extrabold text-humo-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-humo-800">Esta página no existe</h1>
      <p className="mt-2 text-humo-600">
        Puede que el enlace esté mal escrito o que la publicación ya no esté disponible.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/" className={clasesBoton('primario', 'md')}>
          Ir al inicio
        </Link>
        <Link to="/explorar" className={clasesBoton('contorno', 'md')}>
          Explorar materiales
        </Link>
      </div>
    </div>
  )
}
