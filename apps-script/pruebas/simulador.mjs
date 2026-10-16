// Imitación mínima de Google Apps Script para ejecutar Codigo.gs en Node.
// Reproduce las conversiones automáticas de Sheets que afectan al script.
import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

/** Lo que hace Sheets al escribir un valor en una celda. Con formato "@" (texto) no convierte nada. */
function comoSheets(valor, formato) {
  if (typeof valor !== 'string') return valor
  if (valor.startsWith("'")) return valor.slice(1) // el apóstrofo fuerza texto y no se guarda
  if (formato === '@') return valor
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
        const columna = this.columna - 1 + c
        destino[columna] = comoSheets(valor, this.fila + f > 1 ? this.hoja.formatos[columna] : undefined)
      })
    })
    return this
  }
  /** Se guarda por columna: alcanza para imitar el formato de toda la columna. */
  setNumberFormat(formato) {
    for (let c = 0; c < this.columnas; c++) this.hoja.formatos[this.columna - 1 + c] = formato
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
  constructor(nombre, libro) {
    this.nombre = nombre
    this.libro = libro
    this.datos = []
    this.formatos = {}
    this.columnasOcultas = new Set()
    this.oculta = false
  }
  getName() {
    return this.nombre
  }
  setName(nombre) {
    this.libro.hojas.delete(this.nombre)
    this.nombre = nombre
    this.libro.hojas.set(nombre, this)
    return this
  }
  getMaxRows() {
    return 1000
  }
  hideColumns(numero) {
    this.columnasOcultas.add(numero)
  }
  hideSheet() {
    this.oculta = true
    return this
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
    const primera = this.datos.length === 0
    this.datos.push(fila.map((valor, c) => comoSheets(valor, primera ? undefined : this.formatos[c])))
  }
  deleteRow(numero) {
    this.datos.splice(numero - 1, 1)
  }
  setFrozenRows() {}
}

export class Libro {
  constructor() {
    this.hojas = new Map()
    this.orden = []
    this.zonaHoraria = 'UTC'
  }
  setSpreadsheetTimeZone(zona) {
    this.zonaHoraria = zona
  }
  setActiveSheet(hoja) {
    this.activa = hoja
    return hoja
  }
  /** Mueve la pestaña activa a la posición indicada (base 1). */
  moveActiveSheet(posicion) {
    this.orden = this.orden.filter((hoja) => hoja !== this.activa)
    this.orden.splice(posicion - 1, 0, this.activa)
  }
  /** Nombres de las pestañas en el orden en que se ven. */
  pestanas() {
    return this.orden.map((hoja) => hoja.nombre)
  }
  getSheetByName(nombre) {
    return this.hojas.get(nombre) ?? null
  }
  insertSheet(nombre) {
    const hoja = new Hoja(nombre, this)
    this.hojas.set(nombre, hoja)
    this.orden.push(hoja)
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

/** Fecha con el formato de Utilities.formatDate (yyyy, MM, dd, HH, mm) en una zona horaria. */
function formatearFecha(fecha, zona, formato) {
  const zonaReal = zona === 'GMT-4' ? 'America/La_Paz' : zona
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: zonaReal, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(fecha)
      .map((parte) => [parte.type, parte.value]),
  )
  return formato
    .replace('yyyy', partes.year)
    .replace('MM', partes.month)
    .replace('dd', partes.day)
    .replace('HH', partes.hour)
    .replace('mm', partes.minute)
}

export function cargarScript(rutaCodigo, libro = new Libro(), propiedades = {}, otrosLibros = {}) {
  /** Correos que el script "envió". No sale nada a internet. */
  const correos = []
  const cache = new Map()

  const contexto = vm.createContext({
    MailApp: {
      sendEmail: (opciones) => correos.push(opciones),
      getRemainingDailyQuota: () => 100,
    },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'duenio@ejemplo.test' }) },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => libro,
      openById: (id) => {
        if (!otrosLibros[id]) throw new Error('No se encontró la hoja ' + id)
        return otrosLibros[id]
      },
    },
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
      formatDate: formatearFecha,
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (clave) => propiedades[clave] ?? null,
        setProperty: (clave, valor) => (propiedades[clave] = valor),
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (clave) => cache.get(clave) ?? null,
        put: (clave, valor) => cache.set(clave, valor),
        remove: (clave) => cache.delete(clave),
      }),
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
    correos,
    post: (accion, datos = {}, token = '') =>
      leer(contexto.doPost({ parameter: { accion, datos: JSON.stringify(datos), token } })),
    get: (accion = 'listar_publicaciones') => leer(contexto.doGet({ parameter: { accion } })),
    doPost: (parametros) => contexto.doPost({ parameter: parametros }).getContent(),
    doGet: (parametros) => contexto.doGet({ parameter: parametros }).getContent(),
    /** Ejecuta una función del script, como el botón Ejecutar del editor. */
    ejecutar: (funcion) => contexto[funcion](),
    propiedades,
  }
}
