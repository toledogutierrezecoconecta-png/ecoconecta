import { Link } from 'react-router-dom'
import { BotonPortada } from '../components/portada/BotonPortada'
import type { MedidasBoton } from '../components/portada/BotonPortada'
import { clasesBoton } from '../components/ui/Boton'
import { Icono } from '../components/ui/Icono'
import { ABREVIATURA_UNIDAD, TODOS_LOS_MATERIALES } from '../data/catalogos'
import { FOTO_MATERIAL, PORTADA_ESCRITORIO, PORTADA_MOVIL } from '../data/imagenes'
import { buscarPrecio } from '../data/precios'
import { formatearMonto } from '../utils/formato'

/**
 * Ubicación de los botones sobre cada ilustración, en porcentaje de la imagen.
 *
 * Los valores salen de medir los botones dibujados en el arte original
 * (escritorio 1536x1024, móvil 940x1672). Al estar en porcentajes, quedan
 * clavados en su lugar aunque la imagen cambie de tamaño.
 */
const UBICACION = {
  escritorio: {
    arriba: '35.16%',
    alto: '9.38%',
    ancho: '24.22%',
    izquierdaClaro: '19.53%',
    izquierdaOscuro: '56.25%',
  },
  movil: {
    izquierda: '18.51%',
    ancho: '62.98%',
    alto: '8.01%',
    arribaClaro: '31.94%',
    arribaOscuro: '41.39%',
  },
} as const

/** Tipografía e iconos en cqw: 1cqw = 1% del ancho de la ilustración. */
const MEDIDAS_ESCRITORIO: MedidasBoton = {
  alto: '100%',
  espaciado: '1.6cqw',
  icono: '2.7cqw',
  flecha: '1.8cqw',
  titulo: '1.7cqw',
  subtitulo: '0.95cqw',
  hueco: '1.05cqw',
}

const MEDIDAS_MOVIL: MedidasBoton = {
  alto: '100%',
  espaciado: '5cqw',
  icono: '7cqw',
  flecha: '5cqw',
  titulo: '4.3cqw',
  subtitulo: '2.6cqw',
  hueco: '3.4cqw',
}

const ACCIONES = [
  {
    a: '/publicar',
    icono: 'caja' as const,
    titulo: 'Tengo material',
    subtitulo: 'Quiero ofrecer un residuo',
    tono: 'claro' as const,
  },
  {
    a: '/explorar',
    icono: 'buscar' as const,
    titulo: 'Busco material',
    subtitulo: 'Quiero encontrar un residuo',
    tono: 'oscuro' as const,
  },
]

/** Precio compacto bajo cada foto: "Bs. 1,80–2,50/L" o "Donación". */
function precioCorto(materialId: string): string {
  const precio = buscarPrecio(materialId)
  if (!precio || precio.minimo === null || precio.maximo === null) return 'Donación'

  return `Bs. ${formatearMonto(precio.minimo)}–${formatearMonto(precio.maximo)}/${
    ABREVIATURA_UNIDAD[precio.unidad]
  }`
}

export function Landing() {
  return (
    <>
      {/*
        El título y el lema viven dentro de la ilustración, así que se repiten
        acá para los buscadores y los lectores de pantalla.
      */}
      <h1 className="sr-only">
        EcoConecta SCZ — El residuo de un negocio puede ser la materia prima de otro
      </h1>

      {/* ════════════════════════════════════════════ Portada en escritorio */}
      <section
        className="relative hidden lg:block"
        style={{ containerType: 'inline-size' }}
        aria-label="Portada"
      >
        <img
          src={PORTADA_ESCRITORIO}
          alt="EcoConecta SCZ conecta negocios que generan materiales aprovechables con recicladores de Santa Cruz de la Sierra"
          className="block w-full"
          fetchPriority="high"
        />

        {ACCIONES.map((accion, indice) => (
          <div
            key={accion.a}
            className="absolute"
            style={{
              top: UBICACION.escritorio.arriba,
              height: UBICACION.escritorio.alto,
              width: UBICACION.escritorio.ancho,
              left:
                indice === 0
                  ? UBICACION.escritorio.izquierdaClaro
                  : UBICACION.escritorio.izquierdaOscuro,
            }}
          >
            <BotonPortada {...accion} medidas={MEDIDAS_ESCRITORIO} />
          </div>
        ))}
      </section>

      {/* ═════════════════════════════════════════════════ Portada en móvil */}
      <section
        className="relative lg:hidden"
        style={{ containerType: 'inline-size' }}
        aria-label="Portada"
      >
        <img
          src={PORTADA_MOVIL}
          alt="EcoConecta SCZ conecta negocios que generan materiales aprovechables con recicladores de Santa Cruz de la Sierra"
          className="block w-full"
          fetchPriority="high"
        />

        {ACCIONES.map((accion, indice) => (
          <div
            key={accion.a}
            className="absolute"
            style={{
              left: UBICACION.movil.izquierda,
              width: UBICACION.movil.ancho,
              height: UBICACION.movil.alto,
              top: indice === 0 ? UBICACION.movil.arribaClaro : UBICACION.movil.arribaOscuro,
            }}
          >
            <BotonPortada {...accion} medidas={MEDIDAS_MOVIL} />
          </div>
        ))}
      </section>

      {/* ═══════════════════════════════════════════════ Qué se compra acá */}
      <section className="contenedor py-14 md:py-20" id="materiales">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-humo-800 sm:text-3xl">
          Qué se compra acá
        </h2>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TODOS_LOS_MATERIALES.map((material) => (
            <li key={material.id}>
              <Link
                to={`/explorar?material=${material.id}`}
                className="group relative block aspect-4/5 overflow-hidden rounded-2xl"
              >
                <img
                  src={FOTO_MATERIAL[material.id]}
                  alt={material.nombre}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />

                <span className="absolute inset-0 bg-gradient-to-t from-humo-800/90 via-humo-800/20 to-transparent" />

                <span className="absolute inset-x-0 bottom-0 p-3">
                  <span className="block text-sm leading-tight font-bold text-white">
                    {material.nombre}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-marca-200">
                    {precioCorto(material.id)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link to="/explorar" className={clasesBoton('primario', 'lg')}>
            Ver todo lo disponible
            <Icono nombre="flecha" className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
