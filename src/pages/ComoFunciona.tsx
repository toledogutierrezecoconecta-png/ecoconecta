import { Link } from 'react-router-dom'
import { clasesBoton } from '../components/ui/Boton'
import { Icono } from '../components/ui/Icono'
import type { NombreIcono } from '../components/ui/Icono'
import { EMPRESA, WHATSAPP_SOPORTE } from '../services/config'

const OFERENTE: { icono: NombreIcono; titulo: string; detalle: string }[] = [
  {
    icono: 'usuario',
    titulo: 'Creá tu cuenta',
    detalle: 'Registrá tu negocio con un nombre de contacto y un número de WhatsApp.',
  },
  {
    icono: 'etiqueta',
    titulo: 'Publicá el material',
    detalle:
      'Indicá qué es, cuánto tenés, cada cuánto se genera y en qué zona. El precio lo pone EcoConecta SCZ.',
  },
  {
    icono: 'telefono',
    titulo: 'Recibí consultas',
    detalle: 'Los recolectores te escriben directamente para coordinar el retiro.',
  },
  {
    icono: 'check',
    titulo: 'Marcá como concretada',
    detalle: 'Cuando el material se retira, cerrás la publicación desde tu panel.',
  },
]

const RECOLECTOR: { icono: NombreIcono; titulo: string; detalle: string }[] = [
  {
    icono: 'buscar',
    titulo: 'Explorá el marketplace',
    detalle: 'Filtrá por categoría, distrito, precio o disponibilidad.',
  },
  {
    icono: 'ojo',
    titulo: 'Revisá el detalle',
    detalle: 'Cantidad, frecuencia, estado del material y condiciones de retiro.',
  },
  {
    icono: 'camion',
    titulo: 'Coordiná el retiro',
    detalle: 'Contactás al oferente y acordás horario, cantidad y precio final.',
  },
  {
    icono: 'reciclaje',
    titulo: 'Valorizá el material',
    detalle: 'El residuo vuelve a la cadena productiva en lugar de terminar enterrado.',
  },
]

const PREGUNTAS = [
  {
    pregunta: '¿Tiene costo publicar en EcoConecta SCZ?',
    respuesta:
      'No. Publicar y contactar es gratuito. A futuro se evalúa una comisión por operación concretada para los volúmenes grandes.',
  },
  {
    pregunta: '¿EcoConecta SCZ retira los materiales?',
    respuesta:
      'No. La plataforma conecta a las partes; el retiro y el transporte los coordinan directamente el oferente y el recolector.',
  },
  {
    pregunta: '¿Quién define el precio de los materiales?',
    respuesta:
      'EcoConecta SCZ. Publicamos un rango de referencia por material, construido con las empresas recicladoras de la ciudad, porque el negocio que genera el residuo normalmente no sabe cuánto vale. El monto final lo acuerdan las partes tomando ese rango como base.',
  },
  {
    pregunta: '¿Puedo donar el material en lugar de venderlo?',
    respuesta:
      'Sí. Al publicar elegís entre cobrar según el precio de referencia o entregarlo en donación. Algunos materiales, como los restos de poda, no tienen valor de mercado y siempre se publican como donación.',
  },
  {
    pregunta: '¿Qué pasa si no se retira todo el material?',
    respuesta:
      'Podés editar la cantidad disponible en cualquier momento o pausar la publicación hasta volver a tener stock.',
  },
  {
    pregunta: '¿Cómo sé que el otro negocio es confiable?',
    respuesta:
      'En esta versión el contacto es directo entre las partes. Las próximas versiones incorporarán verificación de empresas y un sistema de calificaciones.',
  },
  {
    pregunta: '¿Funciona en otras ciudades?',
    respuesta:
      'Por ahora la plataforma está enfocada en Santa Cruz de la Sierra y usa los distritos municipales como referencia geográfica.',
  },
]

export function ComoFunciona() {
  return (
    <div>
      <section className="trama-circular bg-marca-800 py-16 text-white md:py-20">
        <div className="contenedor max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Cómo funciona</h1>
          <p className="mt-4 text-lg text-marca-100/90">
            EcoConecta SCZ es un punto de encuentro entre quienes generan materiales aprovechables y
            quienes los necesitan como insumo. Sin intermediarios y sin trámites.
          </p>
        </div>
      </section>

      <section className="contenedor py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-humo-800">
              Si tu negocio genera residuos
            </h2>
            <ol className="mt-8 space-y-6">
              {OFERENTE.map((paso, indice) => (
                <li key={paso.titulo} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-marca-50 text-marca-600">
                    <Icono nombre={paso.icono} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-humo-800">
                      {indice + 1}. {paso.titulo}
                    </p>
                    <p className="mt-0.5 text-sm text-humo-600">{paso.detalle}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link to="/publicar" className={`${clasesBoton('primario', 'md')} mt-8`}>
              Publicar un residuo
            </Link>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-humo-800">
              Si buscás materiales
            </h2>
            <ol className="mt-8 space-y-6">
              {RECOLECTOR.map((paso, indice) => (
                <li key={paso.titulo} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tierra-100 text-tierra-700">
                    <Icono nombre={paso.icono} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold text-humo-800">
                      {indice + 1}. {paso.titulo}
                    </p>
                    <p className="mt-0.5 text-sm text-humo-600">{paso.detalle}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link to="/explorar" className={`${clasesBoton('contorno', 'md')} mt-8`}>
              Buscar materiales
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-humo-50 py-16 md:py-20" id="quienes">
        <div className="contenedor max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-humo-800">Sobre nosotros</h2>

          <div className="mt-6 space-y-4 leading-relaxed text-humo-600">
            <p>
              <strong className="text-humo-800">EcoConecta SCZ</strong> es una plataforma digital
              que busca conectar a empresas que generan materiales aprovechables con recicladores,
              centros de acopio y compradores interesados en reutilizarlos.
            </p>
            <p>
              Nacemos con la idea de que un material que ya no es útil para una empresa puede
              convertirse en un recurso para otra. Por eso, facilitamos el encuentro entre quienes
              tienen materiales disponibles y quienes los necesitan.
            </p>
            <p>
              Nuestra función es actuar como intermediario: ayudamos a publicar los materiales,
              encontrar posibles interesados, facilitar la comunicación y dar seguimiento a las
              operaciones.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-humo-200 bg-white p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-marca-600 text-white">
                <Icono nombre="flecha" className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-xl font-bold text-humo-800">Nuestra misión</h3>
              <p className="mt-2 leading-relaxed text-humo-600">
                Facilitar la conexión entre empresas y recicladores para promover el
                aprovechamiento de materiales y contribuir a una economía más circular.
              </p>
            </div>

            <div className="rounded-2xl border border-humo-200 bg-white p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-tierra-500 text-white">
                <Icono nombre="ojo" className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-xl font-bold text-humo-800">Nuestra visión</h3>
              <p className="mt-2 leading-relaxed text-humo-600">
                Ser una plataforma de referencia en Santa Cruz de la Sierra para conectar
                materiales aprovechables con las personas y empresas que pueden darles un nuevo
                uso.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="contenedor py-16 md:py-20" id="preguntas">
        <h2 className="text-3xl font-extrabold tracking-tight text-humo-800">
          Preguntas frecuentes
        </h2>

        <div className="mt-8 divide-y divide-humo-200 border-y border-humo-200">
          {PREGUNTAS.map((item) => (
            <details key={item.pregunta} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-humo-800">
                {item.pregunta}
                <span className="shrink-0 text-humo-400 transition-transform group-open:rotate-45">
                  <Icono nombre="mas" className="h-5 w-5" />
                </span>
              </summary>
              <p className="mt-3 text-humo-600">{item.respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-humo-50 py-16 md:py-20" id="contacto">
        <div className="contenedor max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-humo-800">Contacto</h2>
          <p className="mt-3 text-humo-600">
            ¿Tenés dudas, querés sumar tu empresa o proponer una alianza? Escribinos.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${WHATSAPP_SOPORTE}`}
              target="_blank"
              rel="noreferrer"
              className={clasesBoton('primario', 'lg')}
            >
              <Icono nombre="telefono" className="h-5 w-5" />
              WhatsApp {EMPRESA.telefono}
            </a>

            <a href={`mailto:${EMPRESA.correo}`} className={clasesBoton('contorno', 'lg')}>
              <Icono nombre="correo" className="h-5 w-5" />
              Enviar un correo
            </a>
          </div>

          <p className="mt-6 text-sm break-all text-humo-500">{EMPRESA.correo}</p>

          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-humo-500">
            <Icono nombre="ubicacion" className="h-4 w-4" />
            {EMPRESA.ciudad}
          </p>
        </div>
      </section>
    </div>
  )
}
