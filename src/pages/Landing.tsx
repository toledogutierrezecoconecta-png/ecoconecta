import { Link } from 'react-router-dom'
import { TarjetaResiduo } from '../components/residuos/TarjetaResiduo'
import { clasesBoton } from '../components/ui/Boton'
import { Etiqueta } from '../components/ui/Etiqueta'
import { Icono } from '../components/ui/Icono'
import type { NombreIcono } from '../components/ui/Icono'
import { ABREVIATURA_UNIDAD, TODOS_LOS_MATERIALES } from '../data/catalogos'
import { FOTO_MATERIAL } from '../data/imagenes'
import { buscarPrecio } from '../data/precios'
import { INDICADORES_DEMO } from '../data/seed'
import { usePublicaciones } from '../hooks/usePublicaciones'
import { formatearMonto } from '../utils/formato'

/** Los cuatro pasos, en una línea cada uno: se leen de un vistazo. */
const PASOS: { icono: NombreIcono; titulo: string; detalle: string }[] = [
  { icono: 'etiqueta', titulo: 'Publicá', detalle: 'Qué tenés y cuánto' },
  { icono: 'buscar', titulo: 'Encontrá', detalle: 'Filtrá por zona' },
  { icono: 'telefono', titulo: 'Conectá', detalle: 'Por WhatsApp' },
  { icono: 'reciclaje', titulo: 'Reutilizá', detalle: 'El material se aprovecha' },
]

const PERFILES: { icono: NombreIcono; nombre: string }[] = [
  { icono: 'tienda', nombre: 'Restaurantes' },
  { icono: 'gota', nombre: 'Cafeterías' },
  { icono: 'fabrica', nombre: 'Fábricas' },
  { icono: 'caja', nombre: 'Imprentas' },
  { icono: 'tijera', nombre: 'Textileras' },
  { icono: 'reciclaje', nombre: 'Recicladores' },
  { icono: 'camion', nombre: 'Recolectores' },
  { icono: 'chispa', nombre: 'Artesanos' },
]

const ESTADISTICAS = [
  { valor: `+${INDICADORES_DEMO.publicaciones}`, etiqueta: 'publicaciones' },
  { valor: `+${INDICADORES_DEMO.negocios}`, etiqueta: 'negocios' },
  { valor: `+${INDICADORES_DEMO.recolectores}`, etiqueta: 'recolectores' },
  { valor: `+${INDICADORES_DEMO.toneladas} t`, etiqueta: 'valorizadas' },
]

/** Precio compacto para la galería: "Bs. 1,80–2,50/L" o "Donación". */
function precioCorto(materialId: string): string {
  const precio = buscarPrecio(materialId)
  if (!precio || precio.minimo === null || precio.maximo === null) return 'Donación'

  return `Bs. ${formatearMonto(precio.minimo)}–${formatearMonto(precio.maximo)}/${
    ABREVIATURA_UNIDAD[precio.unidad]
  }`
}

export function Landing() {
  const { publicaciones } = usePublicaciones()
  const destacadas = publicaciones.filter((item) => item.estado === 'disponible').slice(0, 4)

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ Hero */}
      <section className="relative overflow-hidden bg-marca-800 text-white">
        {/* En móvil la foto va de fondo; en escritorio, como mosaico al costado. */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 lg:hidden"
          style={{ backgroundImage: `url(${FOTO_MATERIAL['carton-prensado']})` }}
          aria-hidden="true"
        />
        <div className="trama-circular absolute inset-0" aria-hidden="true" />

        <div className="contenedor relative grid gap-12 py-16 md:py-20 lg:grid-cols-[1fr_1fr] lg:items-center lg:py-24">
          <div className="aparece">
            <Etiqueta tono="blanco" className="mb-5">
              <Icono nombre="ubicacion" className="h-3.5 w-3.5" />
              Santa Cruz de la Sierra
            </Etiqueta>

            <h1 className="text-[2.6rem] leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Tus residuos valen.
              <br />
              <span className="text-marca-200">Nosotros te decimos cuánto.</span>
            </h1>

            <p className="mt-5 max-w-md text-lg text-marca-100/90">
              Publicá los materiales que tu negocio desecha. Los recicladores los retiran.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/publicar"
                className={`${clasesBoton('primario', 'lg')} bg-white !text-marca-700 shadow-lg shadow-marca-900/30 hover:bg-marca-50`}
              >
                <Icono nombre="mas" className="h-5 w-5" />
                Tengo material
              </Link>

              <Link
                to="/explorar"
                className={`${clasesBoton('contorno', 'lg')} border-white/40 !bg-transparent !text-white hover:!border-white hover:!bg-white/10 hover:!text-white`}
              >
                <Icono nombre="buscar" className="h-5 w-5" />
                Busco material
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-4 gap-4 border-t border-white/15 pt-6">
              {ESTADISTICAS.map((estadistica) => (
                <div key={estadistica.etiqueta}>
                  <dt className="text-xl font-extrabold sm:text-2xl">{estadistica.valor}</dt>
                  <dd className="text-[11px] text-marca-100/70">{estadistica.etiqueta}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Mosaico: se ve de inmediato con qué materiales trabaja la plataforma. */}
          <div className="hidden grid-cols-2 gap-3 lg:grid">
            {(
              ['carton-prensado', 'retazos-plastico', 'retazos-textiles', 'chatarra-metalica'] as const
            ).map((materialId, indice) => (
              <div
                key={materialId}
                className={`overflow-hidden rounded-2xl ${indice % 3 === 0 ? 'mt-8' : ''}`}
              >
                <img
                  src={FOTO_MATERIAL[materialId]}
                  alt=""
                  className="h-52 w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ Los 4 pasos */}
      <section className="border-b border-humo-200 bg-white">
        <div className="contenedor grid grid-cols-2 gap-6 py-10 md:grid-cols-4 md:py-12">
          {PASOS.map((paso, indice) => (
            <div key={paso.titulo} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-marca-50 text-marca-600">
                <Icono nombre={paso.icono} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-humo-400">0{indice + 1}</p>
                <p className="font-bold text-humo-800">{paso.titulo}</p>
                <p className="text-sm text-humo-500">{paso.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ Galería de materiales y precios */}
      <section className="contenedor py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
              Qué se compra acá
            </h2>
            <p className="mt-2 text-humo-600">Precios de referencia, definidos por nosotros.</p>
          </div>

          <Link to="/precios" className={clasesBoton('contorno', 'md')}>
            Cómo los calculamos
            <Icono nombre="flecha" className="h-4 w-4" />
          </Link>
        </div>

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

                {/* Degradado para que el texto sea legible sobre cualquier foto. */}
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
      </section>

      {/* ══════════════════════════════════════════════ Ejemplo de valuación */}
      <section className="bg-humo-50 py-14 md:py-20">
        <div className="contenedor grid gap-10 md:grid-cols-2 md:items-center">
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src={FOTO_MATERIAL['aceite-vegetal']}
              alt="Aceite vegetal usado de freidora"
              className="h-72 w-full object-cover md:h-96"
              loading="lazy"
            />

            {/* La cuenta sobre la foto: se entiende sin leer un párrafo. */}
            <div className="absolute right-4 bottom-4 left-4 rounded-2xl bg-white/95 p-5 backdrop-blur">
              <p className="text-xs font-semibold tracking-wide text-humo-500 uppercase">
                80 litros de aceite usado
              </p>
              <p className="mt-1 text-3xl font-extrabold text-marca-700">Bs. 144 – 200</p>
              <p className="mt-1 text-sm text-humo-600">Antes lo tirabas.</p>
            </div>
          </div>

          <div>
            <Etiqueta tono="verde" className="mb-4">
              <Icono nombre="chispa" className="h-3.5 w-3.5" />
              Lo que nos hace distintos
            </Etiqueta>

            <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-humo-800 sm:text-4xl">
              No tenés que saber cuánto vale.
            </h2>

            <p className="mt-4 text-lg text-humo-600">
              El precio lo ponemos nosotros, con las recicladoras de la ciudad. Vos solo cargás
              cuánto tenés.
            </p>

            <Link to="/publicar" className={`${clasesBoton('primario', 'lg')} mt-7`}>
              Calcular lo que tengo
              <Icono nombre="flecha" className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════ Publicaciones recientes */}
      {destacadas.length > 0 && (
        <section className="contenedor py-14 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
              Disponible ahora
            </h2>

            <Link to="/explorar" className={clasesBoton('contorno', 'md')}>
              Ver todo
              <Icono nombre="flecha" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {destacadas.map((publicacion) => (
              <TarjetaResiduo key={publicacion.id} publicacion={publicacion} />
            ))}
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════ Quiénes la usan */}
      <section className="bg-humo-50 py-14 md:py-20" id="quienes">
        <div className="contenedor">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
            Para quién es
          </h2>

          <ul className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-3">
            {PERFILES.map((perfil) => (
              <li
                key={perfil.nombre}
                className="flex items-center gap-2 rounded-full border border-humo-200 bg-white py-2.5 pr-5 pl-3 text-sm font-semibold text-humo-700"
              >
                <span className="text-marca-600">
                  <Icono nombre={perfil.icono} className="h-4.5 w-4.5" />
                </span>
                {perfil.nombre}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ CTA final */}
      <section className="relative overflow-hidden bg-marca-700 py-16 text-white md:py-20">
        <div className="trama-circular absolute inset-0" aria-hidden="true" />

        <div className="contenedor relative text-center">
          <h2 className="mx-auto max-w-3xl text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            El residuo de un negocio es la materia prima de otro.
          </h2>

          <Link
            to="/acceso?modo=registro"
            className={`${clasesBoton('primario', 'lg')} mt-8 bg-white !text-marca-700 hover:bg-marca-50`}
          >
            Comenzar ahora
            <Icono nombre="flecha" className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
