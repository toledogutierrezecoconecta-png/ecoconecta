import { Link } from 'react-router-dom'
import { clasesBoton } from '../components/ui/Boton'
import { Etiqueta } from '../components/ui/Etiqueta'
import { Icono } from '../components/ui/Icono'
import type { NombreIcono } from '../components/ui/Icono'
import { TODOS_LOS_MATERIALES, buscarCategoria } from '../data/catalogos'
import { PRECIOS_REFERENCIA, VIGENCIA_PRECIOS, buscarPrecio } from '../data/precios'
import { formatearRangoReferencia } from '../utils/formato'

const METODOLOGIA: { icono: NombreIcono; titulo: string; detalle: string }[] = [
  {
    icono: 'buscar',
    titulo: 'Relevamiento con recicladoras',
    detalle:
      'Consultamos a las empresas recicladoras y a los acopiadores de Santa Cruz cuánto pagan hoy por cada material, según volumen y condición de entrega.',
  },
  {
    icono: 'balanza',
    titulo: 'Construcción del rango',
    detalle:
      'Con esos datos armamos un rango, no un precio único: el valor real cambia si el material está limpio, seco, prensado o separado por tipo.',
  },
  {
    icono: 'check',
    titulo: 'Validación cruzada',
    detalle:
      'Contrastamos el rango con operaciones ya concretadas en la plataforma para verificar que refleje lo que efectivamente se paga.',
  },
  {
    icono: 'reloj',
    titulo: 'Actualización periódica',
    detalle:
      'Los metales y los plásticos siguen precios internacionales, así que se revisan cada mes. El resto se actualiza cada trimestre.',
  },
]

export function Precios() {
  return (
    <div>
      <section className="trama-circular bg-marca-800 py-16 text-white md:py-20">
        <div className="contenedor max-w-3xl">
          <Etiqueta tono="blanco" className="mb-5">
            <Icono nombre="chispa" className="h-3.5 w-3.5" />
            Precios de referencia
          </Etiqueta>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Cómo definimos los precios
          </h1>

          <p className="mt-4 text-lg text-marca-100/90">
            En EcoConecta SCZ el precio no lo pone el negocio que publica. Lo definimos nosotros, a
            partir de un estudio de mercado con las empresas recicladoras de la ciudad.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------- Por qué lo hacemos */}
      <section className="contenedor py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-humo-800">
              ¿Por qué no lo define el oferente?
            </h2>

            <div className="mt-5 space-y-4 leading-relaxed text-humo-600">
              <p>
                Porque un restaurante no tiene por qué saber cuánto vale su aceite usado, ni una
                imprenta cuánto vale su recorte de papel. Esa información la manejan las
                recicladoras, no quien genera el residuo.
              </p>
              <p>
                Sin una referencia, el negocio solo tiene dos caminos: regalar el material y perder
                dinero, o pedir de más y quedarse sin contactos. En los dos casos el residuo termina
                donde no debería.
              </p>
              <p>
                Al publicar un rango propio, el oferente sabe de entrada cuánto vale lo que tiene y
                el recolector puede comparar publicaciones con un criterio común.
              </p>
            </div>
          </div>

          <ol className="space-y-5">
            {METODOLOGIA.map((paso, indice) => (
              <li
                key={paso.titulo}
                className="flex gap-4 rounded-2xl border border-humo-200 bg-white p-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-marca-50 text-marca-600">
                  <Icono nombre={paso.icono} className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-humo-800">
                    {indice + 1}. {paso.titulo}
                  </p>
                  <p className="mt-1 text-sm text-humo-600">{paso.detalle}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------ Tabla de precios */}
      <section className="bg-humo-50 py-16 md:py-20">
        <div className="contenedor">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-humo-800">
                Precios vigentes
              </h2>
              <p className="mt-2 text-humo-600">
                Actualizados en {VIGENCIA_PRECIOS}. Expresados en bolivianos.
              </p>
            </div>

            <Etiqueta tono="ambar">
              <Icono nombre="alerta" className="h-3.5 w-3.5" />
              Valores de demostración
            </Etiqueta>
          </div>

          {/* Escritorio: tabla. Móvil: tarjetas apiladas. */}
          <div className="mt-8 hidden overflow-hidden rounded-2xl border border-humo-200 bg-white md:block">
            <table className="w-full text-left">
              <thead className="border-b border-humo-200 bg-humo-50">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold tracking-wide text-humo-600 uppercase">
                    Material
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold tracking-wide text-humo-600 uppercase">
                    Categoría
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold tracking-wide text-humo-600 uppercase">
                    Rango de referencia
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold tracking-wide text-humo-600 uppercase">
                    Qué hace variar el precio
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-humo-100">
                {TODOS_LOS_MATERIALES.map((material) => {
                  const precio = buscarPrecio(material.id)
                  const categoria = buscarCategoria(material.categoriaId)

                  return (
                    <tr key={material.id} className="align-top">
                      <td className="px-5 py-4 font-bold text-humo-800">{material.nombre}</td>
                      <td className="px-5 py-4 text-sm text-humo-600">{categoria?.nombre}</td>
                      <td className="px-5 py-4">
                        {precio && precio.minimo !== null ? (
                          <span className="font-bold whitespace-nowrap text-marca-700">
                            {formatearRangoReferencia(precio)}
                          </span>
                        ) : (
                          <Etiqueta tono="verde">Donación</Etiqueta>
                        )}
                      </td>
                      <td className="max-w-md px-5 py-4 text-sm text-humo-600">
                        {precio?.factores}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <ul className="mt-8 space-y-3 md:hidden">
            {PRECIOS_REFERENCIA.map((precio) => {
              const material = TODOS_LOS_MATERIALES.find((item) => item.id === precio.materialId)

              return (
                <li
                  key={precio.materialId}
                  className="rounded-2xl border border-humo-200 bg-white p-5"
                >
                  <p className="font-bold text-humo-800">{material?.nombre}</p>

                  {precio.minimo !== null ? (
                    <p className="mt-1 text-lg font-extrabold text-marca-700">
                      {formatearRangoReferencia(precio)}
                    </p>
                  ) : (
                    <Etiqueta tono="verde" className="mt-2">
                      Donación
                    </Etiqueta>
                  )}

                  <p className="mt-2 text-sm text-humo-600">{precio.factores}</p>
                </li>
              )
            })}
          </ul>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-tierra-200 bg-tierra-50 p-5">
            <span className="mt-0.5 shrink-0 text-tierra-700">
              <Icono nombre="alerta" className="h-5 w-5" />
            </span>
            <div className="text-sm text-tierra-800">
              <p className="font-bold">Es un precio de referencia, no un precio de venta.</p>
              <p className="mt-1">
                EcoConecta SCZ no compra, no vende ni participa en el pago. El monto final lo acuerdan
                el oferente y el recolector, tomando este rango como punto de partida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="contenedor py-16 text-center md:py-20">
        <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-humo-800 sm:text-4xl">
          Averiguá cuánto vale lo que tu negocio desecha
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-humo-600">
          Cargá el material y la cantidad: la plataforma calcula sola el valor estimado de tu
          publicación.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/publicar" className={clasesBoton('primario', 'lg')}>
            Publicar un residuo
          </Link>
          <Link to="/explorar" className={clasesBoton('contorno', 'lg')}>
            Ver el marketplace
          </Link>
        </div>
      </section>
    </div>
  )
}
