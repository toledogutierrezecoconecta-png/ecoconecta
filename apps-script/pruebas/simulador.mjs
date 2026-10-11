// Imitación mínima de Google Apps Script para ejecutar Codigo.gs en Node.
// Reproduce las conversiones automáticas de Sheets que afectan al script.
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

/** Lo que hace Sheets al escribir un valor en una celda. */
function comoSheets(valor) {
  if (typeof valor !== 'string') return valor
  if (valor.startsWith("'")) return valor.slice(1) // el apóstrofo fuerza texto y no se guarda
  if (/^-?\d+(\.\d+)?$/.test(valor)) return Number(valor) // "70011223" -> 70011223
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return new Date(`${valor}T00:00:00-04:00`) // fecha
  if (/^[=+]/.test(valor)) return `#FORMULA(${valor})` // se ejecutaría como fórmula
  return valor
}

class Rango {
  constructor(hoja, fila, columna, filas, columnas) {
    Object.assign(this, { hoja, fila, columna, filas, columnas })
  }
  getValues() {
    const salida = []
    for (let f = 0; f < this.filas; f++) {
      const fila = this.hoja.datos[this.fila - 1 + f] ?? []
      const valores = []
      for (let c = 0; c < this.columnas; c++) valores.push(fila[this.columna - 1 + c] ?? '')
      salida.push(valores)
    }
    return salida
  }
  getValue() {
    return this.getValues()[0][0]
  }
  setValues(valores) {
    valores.forEach((fila, f) => {
      const destino = (this.hoja.datos[this.fila - 1 + f] ??= [])
      fila.forEach((valor, c) => {
        destino[this.columna - 1 + c] = comoSheets(valor)
      })
    })
    return this
  }
  setValue(valor) {
    return this.setValues([[valor]])
  }
  setFontWeight() {
    return this
  }
}

class Hoja {
  constructor(nombre) {
    this.nombre = nombre
    this.datos = []
  }
  getLastRow() {
    return this.datos.length
  }
  getLastColumn() {
    return Math.max(0, ...this.datos.map((fila) => fila.length))
  }
  getRange(fila, columna, filas = 1, columnas = 1) {
    return new Rango(this, fila, columna, filas, columnas)
  }
  appendRow(fila) {
    this.datos.push(fila.map(comoSheets))
  }
  deleteRow(numero) {
    this.datos.splice(numero - 1, 1)
  }
  setFrozenRows() {}
}

export class Libro {
  constructor() {
    this.hojas = new Map()
  }
  getSheetByName(nombre) {
    return this.hojas.get(nombre) ?? null
  }
  insertSheet(nombre) {
    const hoja = new Hoja(nombre)
    this.hojas.set(nombre, hoja)
    return hoja
  }
  getUrl() {
    return 'https://docs.google.com/spreadsheets/d/simulada'
  }
  /** Estado legible para las pruebas. */
  volcar() {
    return Object.fromEntries([...this.hojas].map(([nombre, hoja]) => [nombre, hoja.datos]))
  }
}

const aBytes = (buffer) => [...buffer].map((b) => (b > 127 ? b - 256 : b))
const deBytes = (bytes) => Buffer.from(bytes.map((b) => (b < 0 ? b + 256 : b)))

export function cargarScript(rutaCodigo, libro = new Libro()) {
  const contexto = vm.createContext({
    SpreadsheetApp: { getActiveSpreadsheet: () => libro },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (contenido) => ({
        setMimeType() {
          return this
        },
        getContent: () => contenido,
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Logger: { log: () => {} },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (algoritmo, entrada) =>
        aBytes(createHash(algoritmo).update(typeof entrada === 'string' ? Buffer.from(entrada, 'utf8') : deBytes(entrada)).digest()),
      base64Encode: (bytes) => deBytes(bytes).toString('base64'),
      getUuid: () => randomUUID(),
      formatDate: (fecha, _zona, _formato) => new Date(fecha.getTime() - 4 * 3600000).toISOString().slice(0, 10),
    },
    Date,
    JSON,
    Math,
    String,
    Number,
    isNaN,
    console,
  })

  vm.runInContext(readFileSync(rutaCodigo, 'utf8'), contexto, { filename: 'Codigo.gs' })

  const leer = (salida) => JSON.parse(salida.getContent())
  return {
    libro,
    post: (accion, datos = {}, token = '') =>
      leer(contexto.doPost({ parameter: { accion, datos: JSON.stringify(datos), token } })),
    get: (accion = 'listar_publicaciones') => leer(contexto.doGet({ parameter: { accion } })),
    doPost: (parametros) => contexto.doPost({ parameter: parametros }).getContent(),
    doGet: (parametros) => contexto.doGet({ parameter: parametros }).getContent(),
  }
}
