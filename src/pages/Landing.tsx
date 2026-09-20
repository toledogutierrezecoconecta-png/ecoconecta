import { Link } from 'react-router-dom'
import { TarjetaResiduo } from '../components/residuos/TarjetaResiduo'
import { clasesBoton } from '../components/ui/Boton'
import { Etiqueta } from '../components/ui/Etiqueta'
import { Icono } from '../components/ui/Icono'
import type { NombreIcono } from '../components/ui/Icono'
import { CATEGORIAS } from '../data/catalogos'
import { INDICADORES_DEMO } from '../data/seed'
import { usePublicaciones } from '../hooks/usePublicaciones'

const PASOS: { icono: NombreIcono; titulo: string; detalle: string }[] = [
  {
    icono: 'etiqueta',
    titulo: 'Publicá',
    detalle: 'Cargá el material, la cantidad y la zona. El precio lo ponemos nosotros.',
  },
  {
    icono: 'buscar',
    titulo: 'Encontrá',
    detalle: 'Los recolectores filtran por categoría y distrito, y ven qué hay cerca suyo.',
  },
  {
    icono: 'telefono',
    titulo: 'Conectá',
    detalle: 'Se contactan directamente por WhatsApp para coordinar el retiro y las condiciones.',
  },
  {
    icono: 'reciclaje',
    titulo: 'Reutilizá',
    detalle: 'El material vuelve a la cadena productiva en lugar de terminar en el relleno.',
  },
]

const PERFILES: { icono: NombreIcono; nombre: string }[] = [
  { icono: 'tienda', nombre: 'Restaurantes' },
  { icono: 'gota', nombre: 'Cafeterías' },
  { icono: 'fabrica', nombre: 'Fábricas' },
  { icono: 'caja', nombre: 'Imprentas' },
  { icono: 'tijera', nombre: 'Empresas textiles' },
  { icono: 'reciclaje', nombre: 'Recicladores' },
  { icono: 'camion', nombre: 'Recolectores' },
  { icono: 'chispa', nombre: 'Artesanos' },
]

const ESTADISTICAS = [
  { valor: `+${INDICADORES_DEMO.publicaciones}`, etiqueta: 'publicaciones' },
  { valor: `+${INDICADORES_DEMO.negocios}`, etiqueta: 'negocios registrados' },
  { valor: `+${INDICADORES_DEMO.recolectores}`, etiqueta: 'recolectores' },
  { valor: `+${INDICADORES_DEMO.toneladas} t`, etiqueta: 'valorizadas' },
]

export function Landing() {
  const { publicaciones } = usePublicaciones()
  const destacadas = publicaciones.filter((item) => item.estado === 'disponible').slice(0, 4)

  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="trama-circular relative overflow-hidden bg-marca-800 text-white">
        <div className="contenedor grid gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="aparece">
            <Etiqueta tono="blanco" className="mb-5">
              <Icono nombre="ubicacion" className="h-3.5 w-3.5" />
              Santa Cruz de la Sierra
            </Etiqueta>

            <h1 className="text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Convertí tus residuos en{' '}
              <span className="text-marca-200">oportunidades.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg text-marca-100/90">
              Conectamos negocios que generan materiales aprovechables con recicladores,
              recolectores y empresas que los necesitan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/publicar"
                className={`${clasesBoton('primario', 'lg')} bg-white !text-marca-700 hover:bg-marca-50`}
              >
                <Icono nombre="mas" className="h-5 w-5" />
                Publicar un residuo
              </Link>

              <Link
                to="/explorar"
                className={`${clasesBoton('contorno', 'lg')} border-white/30 !bg-transparent !text-white hover:!border-white hover:!bg-white/10 hover:!text-white`}
              >
                <Icono nombre="buscar" className="h-5 w-5" />
                Buscar materiales
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-4">
              {ESTADISTICAS.map((estadistica) => (
                <div key={estadistica.etiqueta}>
                  <dt className="text-2xl font-extrabold text-white sm:text-3xl">
                    {estadistica.valor}
                  </dt>
                  <dd className="mt-0.5 text-xs text-marca-100/80">{estadistica.etiqueta}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-4 text-xs text-marca-200/70">
              * Cifras de demostración para esta versión de prueba.
            </p>
          </div>

          {/* Ilustración: el ciclo de la economía circular. */}
          <div className="relative hidden lg:block">
            <div className="rounded-3xl border border-white/15 bg-white/5 p-8 backdrop-blur-sm">
              <p className="text-sm font-semibold tracking-wide text-marca-200 uppercase">
                Ciclo EcoConecta SCZ
              </p>

              <ul className="mt-6 space-y-4">
                {PASOS.map((paso, indice) => (
                  <li key={paso.titulo} className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-marca-100">
                      <Icono nombre={paso.icono} className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-white">
                        {indice + 1}. {paso.titulo}
                      </p>
                      <p className="text-sm text-marca-100/80">{paso.detalle}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- Cómo funciona */}
      <section className="contenedor py-16 md:py-20" id="como-funciona">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
            ¿Cómo funciona?
          </h2>
          <p className="mt-3 text-humo-600">
            Cuatro pasos simples. Sin intermediarios, sin trámites y sin costo para publicar.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, indice) => (
            <div
              key={paso.titulo}
              className="rounded-2xl border border-humo-200 bg-white p-6 transition-colors hover:border-marca-300"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-marca-50 text-marca-600">
                  <Icono nombre={paso.icono} className="h-5 w-5" />
                </span>
                <span className="text-3xl font-extrabold text-humo-200">0{indice + 1}</span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-humo-800">{paso.titulo}</h3>
              <p className="mt-1.5 text-sm text-humo-600">{paso.detalle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------ Precios de referencia */}
      <section className="contenedor pb-16 md:pb-20">
        <div className="overflow-hidden rounded-3xl border border-marca-200 bg-marca-50">
          <div className="grid gap-8 p-8 md:grid-cols-[1.2fr_1fr] md:items-center md:p-12">
            <div>
              <Etiqueta tono="verde" className="mb-4">
                <Icono nombre="chispa" className="h-3.5 w-3.5" />
                Lo que nos hace distintos
              </Etiqueta>

              <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-humo-800 sm:text-4xl">
                No tenés que saber cuánto vale tu residuo.
              </h2>

              <p className="mt-4 text-humo-600">
                Un restaurante no tiene por qué conocer el precio del aceite usado, ni una imprenta
                el del recorte de papel. Por eso el precio no lo pone quien publica:{' '}
                <strong className="text-humo-800">
                  lo definimos nosotros junto a las empresas recicladoras
                </strong>{' '}
                de Santa Cruz, y lo actualizamos periódicamente.
              </p>

              <Link to="/precios" className={`${clasesBoton('primario', 'md')} mt-6`}>
                Ver cómo definimos los precios
                <Icono nombre="flecha" className="h-4 w-4" />
              </Link>
            </div>

            {/* Ejemplo concreto: el cálculo que ve el oferente al publicar. */}
            <div className="rounded-2xl border border-marca-200 bg-white p-6">
              <p className="text-xs font-semibold tracking-wide text-humo-500 uppercase">Ejemplo</p>
              <p className="mt-1 font-bold text-humo-800">80 litros de aceite usado</p>

              <div className="mt-4 space-y-2 border-t border-humo-100 pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-humo-600">Precio de referencia</span>
                  <span className="font-semibold text-humo-800">Bs. 1,80 – 2,50/L</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-humo-600">Cantidad publicada</span>
                  <span className="font-semibold text-humo-800">80 litros</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-marca-600 px-4 py-3 text-white">
                <p className="text-xs font-semibold tracking-wide text-marca-100 uppercase">
                  Valor estimado
                </p>
                <p className="text-2xl font-extrabold">Bs. 144 – 200</p>
              </div>

              <p className="mt-3 text-xs text-humo-500">
                Antes ese aceite se tiraba. Valores de demostración.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- Categorías */}
      <section className="bg-humo-50 py-16 md:py-20">
        <div className="contenedor">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
              ¿Qué materiales se publican?
            </h2>
            <p className="mt-3 text-humo-600">
              Dos grandes categorías que cubren la mayoría de los residuos aprovechables de la
              ciudad.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {CATEGORIAS.map((categoria) => (
              <div
                key={categoria.id}
                className="rounded-2xl border border-humo-200 bg-white p-7"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-marca-600 text-white">
                  <Icono
                    nombre={categoria.id === 'organicos' ? 'hoja' : 'fabrica'}
                    className="h-6 w-6"
                  />
                </span>

                <h3 className="mt-5 text-xl font-bold text-humo-800">{categoria.nombre}</h3>
                <p className="mt-1.5 text-sm text-humo-600">{categoria.descripcion}</p>

                <ul className="mt-5 flex flex-wrap gap-2">
                  {categoria.materiales.map((material) => (
                    <li key={material.id}>
                      <Link
                        to={`/explorar?material=${material.id}`}
                        className="inline-block rounded-lg border border-humo-200 bg-humo-50 px-3 py-1.5 text-sm font-medium text-humo-700 transition-colors hover:border-marca-400 hover:bg-marca-50 hover:text-marca-700"
                      >
                        {material.nombre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------- Últimas publicaciones */}
      {destacadas.length > 0 && (
        <section className="contenedor py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
                Publicado recientemente
              </h2>
              <p className="mt-3 text-humo-600">Materiales disponibles ahora mismo en la ciudad.</p>
            </div>

            <Link to="/explorar" className={clasesBoton('contorno', 'md')}>
              Ver todo el marketplace
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

      {/* ------------------------------------------------------- Perfiles */}
      <section className="bg-humo-50 py-16 md:py-20" id="quienes">
        <div className="contenedor">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
              ¿Quiénes pueden usar EcoConecta SCZ?
            </h2>
            <p className="mt-3 text-humo-600">
              Cualquier negocio que genere materiales aprovechables y cualquier actor que los
              necesite como insumo.
            </p>
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PERFILES.map((perfil) => (
              <li
                key={perfil.nombre}
                className="flex flex-col items-center gap-3 rounded-2xl border border-humo-200 bg-white px-4 py-6 text-center transition-colors hover:border-marca-300"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-tierra-100 text-tierra-700">
                  <Icono nombre={perfil.icono} className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-humo-700">{perfil.nombre}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------------- Impacto */}
      <section className="contenedor py-16 md:py-20">
        <div className="rounded-3xl border border-humo-200 bg-white p-8 md:p-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
              El impacto de EcoConecta SCZ
            </h2>
            <Etiqueta tono="ambar">
              <Icono nombre="alerta" className="h-3.5 w-3.5" />
              Datos de demostración
            </Etiqueta>
          </div>

          <p className="mt-3 max-w-2xl text-humo-600">
            Estos indicadores se calcularán automáticamente a partir de las publicaciones
            concretadas cuando la plataforma esté operativa.
          </p>

          <dl className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                valor: INDICADORES_DEMO.kilosValorizados.toLocaleString('es-BO'),
                unidad: 'kg',
                etiqueta: 'Residuos valorizados',
                icono: 'balanza' as NombreIcono,
              },
              {
                valor: INDICADORES_DEMO.litrosAceite.toLocaleString('es-BO'),
                unidad: 'L',
                etiqueta: 'Aceite recuperado',
                icono: 'gota' as NombreIcono,
              },
              {
                valor: String(INDICADORES_DEMO.concretadas),
                unidad: '',
                etiqueta: 'Publicaciones concretadas',
                icono: 'check' as NombreIcono,
              },
              {
                valor: String(INDICADORES_DEMO.negocios),
                unidad: '',
                etiqueta: 'Negocios conectados',
                icono: 'tienda' as NombreIcono,
              },
            ].map((indicador) => (
              <div key={indicador.etiqueta} className="border-l-2 border-marca-200 pl-4">
                <span className="text-marca-600">
                  <Icono nombre={indicador.icono} className="h-5 w-5" />
                </span>
                <dt className="mt-2 text-3xl font-extrabold text-humo-800">
                  {indicador.valor}
                  <span className="ml-1 text-lg text-humo-500">{indicador.unidad}</span>
                </dt>
                <dd className="mt-1 text-sm text-humo-600">{indicador.etiqueta}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------- CTA final */}
      <section className="trama-circular bg-marca-700 py-16 text-white md:py-20">
        <div className="contenedor text-center">
          <h2 className="mx-auto max-w-3xl text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            El residuo de un negocio puede ser la materia prima de otro.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-marca-100/90">
            Sumate a la red de economía circular de Santa Cruz. Publicar es gratis y toma menos de
            dos minutos.
          </p>

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
