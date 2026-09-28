import { Link } from 'react-router-dom'
import { clasesBoton } from '../components/ui/Boton'
import { Icono } from '../components/ui/Icono'
import { ABREVIATURA_UNIDAD, TODOS_LOS_MATERIALES } from '../data/catalogos'
import { FONDO_PORTADA, FOTO_MATERIAL } from '../data/imagenes'
import { buscarPrecio } from '../data/precios'
import { formatearMonto } from '../utils/formato'

/** Precio compacto bajo cada foto: "Bs. 1,80–2,50/L" o "Donación". */
function precioCorto(materialId: string): string {
  const precio = buscarPrecio(materialId)
  if (!precio || precio.minimo === null || precio.maximo === null) return 'Donación'

  return `Bs. ${formatearMonto(precio.minimo)}–${formatearMonto(precio.maximo)}/${
    ABREVIATURA_UNIDAD[precio.unidad]
  }`
}

/**
 * Portada.
 *
 * Deliberadamente mínima: una pantalla completa con la propuesta en una frase
 * y dos caminos posibles. Todo lo demás —cómo funciona, precios, quiénes la
 * usan— vive en sus propias páginas, enlazadas desde el menú.
 */
export function Landing() {
  return (
    <>
      {/* ═══════════════════════════════════════════ Portada a pantalla completa */}
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
        <img
          src={FONDO_PORTADA}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />

        {/*
          Dos capas: un tinte parejo de marca sobre la foto y, encima, un
          degradado que oscurece el lado del texto. Deja ver la fotografía y
          mantiene el contraste necesario para leer sobre ella.
        */}
        <div className="absolute inset-0 bg-marca-900/55" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-gradient-to-r from-marca-900/90 via-marca-900/60 to-marca-900/25"
          aria-hidden="true"
        />

        <div className="contenedor relative py-16 text-white">
          <div className="aparece max-w-2xl">
            <h1 className="text-[2.75rem] leading-[1.03] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Tus residuos valen.
              <br />
              <span className="text-marca-200">Te decimos cuánto.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg text-marca-100/90 sm:text-xl">
              Conectamos negocios con recicladores en Santa Cruz.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/publicar"
                className={`${clasesBoton('primario', 'lg')} bg-white !text-marca-700 shadow-xl shadow-marca-900/40 hover:bg-marca-50 sm:min-w-52`}
              >
                <Icono nombre="mas" className="h-5 w-5" />
                Tengo material
              </Link>

              <Link
                to="/explorar"
                className={`${clasesBoton('contorno', 'lg')} border-white/40 !bg-transparent !text-white hover:!border-white hover:!bg-white/10 hover:!text-white sm:min-w-52`}
              >
                <Icono nombre="buscar" className="h-5 w-5" />
                Busco material
              </Link>
            </div>
          </div>
        </div>

        {/* Señal de que la página continúa. */}
        <a
          href="#materiales"
          className="absolute inset-x-0 bottom-6 mx-auto flex w-fit flex-col items-center gap-1 text-marca-100/70 transition-colors hover:text-white"
          aria-label="Ver los materiales"
        >
          <span className="text-xs font-semibold tracking-wide uppercase">Ver materiales</span>
          <Icono nombre="flecha" className="h-5 w-5 rotate-90" />
        </a>
      </section>

      {/* ═══════════════════════════════════════════════ Qué se compra, en fotos */}
      <section className="contenedor scroll-mt-20 py-14 md:py-20" id="materiales">
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
