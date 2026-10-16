// Servidor local que ejecuta el Codigo.gs real sobre la hoja simulada.
// Responde como la Web App de Apps Script en /exec. Solo para pruebas.
import http from 'node:http'
import { libroComoElReal } from './escenario.mjs'
import { cargarScript } from './simulador.mjs'

const CODIGO = process.argv[2]
const PUERTO = Number(process.argv[3] ?? 8787)

/** Hoja simulada ya convertida con actualizarHojas, como queda la real al instalar. */
function nuevaHoja() {
  const script = cargarScript(CODIGO, libroComoElReal(), { CLAVE_ADMIN: 'admin-local', CORREOS_ADMIN: 'imprenta@ejemplo.test' })
  script.ejecutar('actualizarHojas')
  return script
}

let script = nuevaHoja()

const cabeceras = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json; charset=utf-8',
}

http
  .createServer((pedido, respuesta) => {
    const url = new URL(pedido.url, `http://localhost:${PUERTO}`)
    let cuerpo = ''
    pedido.on('data', (parte) => (cuerpo += parte))
    pedido.on('end', () => {
      let salida
      if (url.pathname === '/exec' && pedido.method === 'GET') {
        salida = script.doGet(Object.fromEntries(url.searchParams))
      } else if (url.pathname === '/exec' && pedido.method === 'POST') {
        salida = script.doPost(Object.fromEntries(new URLSearchParams(cuerpo)))
      } else if (url.pathname === '/__estado') {
        salida = JSON.stringify(script.libro.volcar())
      } else if (url.pathname === '/__correos') {
        // Los correos que el script "envió" (nada sale a internet).
        salida = JSON.stringify(script.correos)
      } else if (url.pathname === '/__reiniciar') {
        script = nuevaHoja()
        salida = JSON.stringify({ ok: true })
      } else {
        salida = '<!doctype html><title>Hoja local</title><p>Hoja simulada de EcoConecta: POST/GET en /exec.</p>'
        respuesta.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        respuesta.end(salida)
        return
      }
      respuesta.writeHead(200, cabeceras)
      respuesta.end(salida)
    })
  })
  .listen(PUERTO, () =>
    console.log(`Hoja simulada en http://localhost:${PUERTO}/exec (clave de administrador local: admin-local)`),
  )
