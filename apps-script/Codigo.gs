/**
 * ============================================================================
 *  EcoConecta SCZ — Conexión con Google Sheets
 * ============================================================================
 *
 * Este script convierte una hoja de cálculo de Google en el almacenamiento
 * compartido de la plataforma. Se encarga de:
 *
 *   - Guardar los usuarios que se registran.
 *   - Guardar, actualizar y eliminar publicaciones.
 *   - Contar los contactos recibidos por cada publicación.
 *   - Entregar las publicaciones a la web para que todos vean lo mismo.
 *
 * INSTALACIÓN (ver README.md para el paso a paso con más detalle):
 *
 *   1. Creá una hoja de cálculo nueva en Google Sheets.
 *   2. Menú Extensiones → Apps Script.
 *   3. Borrá el contenido del editor y pegá TODO este archivo.
 *   4. Guardá (icono de disquete).
 *   5. Botón "Implementar" → "Nueva implementación" → tipo "Aplicación web".
 *        - Ejecutar como: Yo
 *        - Quién tiene acceso: Cualquier usuario
 *   6. Copiá la URL que termina en /exec.
 *   7. Pegala en src/services/config.ts, en la constante URL_APPS_SCRIPT.
 *
 * Las hojas y los encabezados se crean solos la primera vez.
 */

var HOJA_USUARIOS = 'Usuarios'
var HOJA_PUBLICACIONES = 'Publicaciones'
var HOJA_CONTACTOS = 'Contactos'

var COLUMNAS_USUARIOS = [
  'id',
  'empresa',
  'contacto',
  'telefono',
  'correo',
  'tipo',
  'creadoEn',
]

var COLUMNAS_PUBLICACIONES = [
  'id',
  'titulo',
  'categoriaId',
  'materialId',
  'descripcion',
  'cantidad',
  'unidad',
  'frecuencia',
  'zona',
  'direccion',
  'modalidadPrecio',
  'valorEstimadoMin',
  'valorEstimadoMax',
  'fechaDisponible',
  'estado',
  'contactos',
  'usuarioId',
  'empresa',
  'contacto',
  'telefono',
  'creadaEn',
  'origen',
]

var COLUMNAS_CONTACTOS = ['publicacionId', 'fecha']

// ---------------------------------------------------------------- utilidades

function obtenerHoja(nombre, columnas) {
  var libro = SpreadsheetApp.getActiveSpreadsheet()
  var hoja = libro.getSheetByName(nombre)

  if (!hoja) {
    hoja = libro.insertSheet(nombre)
    hoja.appendRow(columnas)
    hoja.getRange(1, 1, 1, columnas.length).setFontWeight('bold')
    hoja.setFrozenRows(1)
  }

  return hoja
}

function respuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function filaDesdeObjeto(objeto, columnas) {
  return columnas.map(function (columna) {
    var valor = objeto[columna]
    return valor === undefined || valor === null ? '' : valor
  })
}

/** Devuelve el número de fila (base 1) de un id, o -1 si no existe. */
function buscarFilaPorId(hoja, id) {
  var ids = hoja.getRange(2, 1, Math.max(hoja.getLastRow() - 1, 1), 1).getValues()

  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2
  }

  return -1
}

// ------------------------------------------------------------------ escritura

function doPost(e) {
  try {
    var accion = e.parameter.accion
    var datos = JSON.parse(e.parameter.datos || '{}')

    if (accion === 'registrar_usuario') return registrarUsuario(datos)
    if (accion === 'crear_publicacion') return crearPublicacion(datos)
    if (accion === 'actualizar_publicacion') return actualizarPublicacion(datos)
    if (accion === 'eliminar_publicacion') return eliminarPublicacion(datos)
    if (accion === 'registrar_contacto') return registrarContacto(datos)

    return respuesta({ ok: false, error: 'Acción no reconocida: ' + accion })
  } catch (error) {
    return respuesta({ ok: false, error: String(error) })
  }
}

function registrarUsuario(datos) {
  var hoja = obtenerHoja(HOJA_USUARIOS, COLUMNAS_USUARIOS)
  hoja.appendRow(filaDesdeObjeto(datos, COLUMNAS_USUARIOS))
  return respuesta({ ok: true })
}

function crearPublicacion(datos) {
  var hoja = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)

  // Evita duplicados si la web reintenta el envío.
  if (buscarFilaPorId(hoja, datos.id) !== -1) return respuesta({ ok: true, duplicada: true })

  hoja.appendRow(filaDesdeObjeto(datos, COLUMNAS_PUBLICACIONES))
  return respuesta({ ok: true })
}

function actualizarPublicacion(datos) {
  var hoja = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var fila = buscarFilaPorId(hoja, datos.id)

  if (fila === -1) {
    hoja.appendRow(filaDesdeObjeto(datos, COLUMNAS_PUBLICACIONES))
    return respuesta({ ok: true, creada: true })
  }

  hoja
    .getRange(fila, 1, 1, COLUMNAS_PUBLICACIONES.length)
    .setValues([filaDesdeObjeto(datos, COLUMNAS_PUBLICACIONES)])

  return respuesta({ ok: true })
}

function eliminarPublicacion(datos) {
  var hoja = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var fila = buscarFilaPorId(hoja, datos.id)

  if (fila !== -1) hoja.deleteRow(fila)

  return respuesta({ ok: true })
}

function registrarContacto(datos) {
  var hojaContactos = obtenerHoja(HOJA_CONTACTOS, COLUMNAS_CONTACTOS)
  hojaContactos.appendRow([datos.id, datos.fecha])

  // Mantiene sincronizado el contador de la publicación.
  var hoja = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var fila = buscarFilaPorId(hoja, datos.id)

  if (fila !== -1) {
    var columna = COLUMNAS_PUBLICACIONES.indexOf('contactos') + 1
    var actual = Number(hoja.getRange(fila, columna).getValue()) || 0
    hoja.getRange(fila, columna).setValue(actual + 1)
  }

  return respuesta({ ok: true })
}

// -------------------------------------------------------------------- lectura

function doGet(e) {
  try {
    var accion = (e && e.parameter && e.parameter.accion) || 'listar_publicaciones'

    if (accion === 'listar_publicaciones') return listarPublicaciones()

    return respuesta({ ok: false, error: 'Acción no reconocida: ' + accion })
  } catch (error) {
    return respuesta({ ok: false, error: String(error) })
  }
}

function listarPublicaciones() {
  var hoja = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)

  if (hoja.getLastRow() < 2) return respuesta({ ok: true, publicaciones: [] })

  var filas = hoja
    .getRange(2, 1, hoja.getLastRow() - 1, COLUMNAS_PUBLICACIONES.length)
    .getValues()

  var publicaciones = filas
    .filter(function (fila) {
      return fila[0] !== '' // descarta filas vacías
    })
    .map(function (fila) {
      var publicacion = {}

      COLUMNAS_PUBLICACIONES.forEach(function (columna, indice) {
        publicacion[columna] = fila[indice]
      })

      // Normaliza los tipos que la hoja devuelve.
      //
      // Google Sheets reinterpreta lo que guarda: "2026-09-20" vuelve como
      // objeto Date y un teléfono como 70000000 vuelve como número, perdiendo
      // los ceros a la izquierda. Sin esta normalización la web recibe datos
      // con el tipo equivocado.
      publicacion.cantidad = Number(publicacion.cantidad) || 0
      publicacion.contactos = Number(publicacion.contactos) || 0
      publicacion.fotoId = null
      publicacion.telefono = normalizarTelefono(publicacion.telefono)
      publicacion.fechaDisponible = formatearFecha(publicacion.fechaDisponible)
      publicacion.creadaEn = formatearMarcaTemporal(publicacion.creadaEn)

      return publicacion
    })

  return respuesta({ ok: true, publicaciones: publicaciones })
}

/**
 * Detecta fechas de forma confiable.
 *
 * `instanceof Date` no siempre funciona con los objetos que devuelve
 * SpreadsheetApp, así que se comprueba la forma del objeto.
 */
function esFecha(valor) {
  return (
    valor &&
    typeof valor === 'object' &&
    typeof valor.getTime === 'function' &&
    !isNaN(valor.getTime())
  )
}

function formatearFecha(valor) {
  if (esFecha(valor)) return Utilities.formatDate(valor, 'GMT-4', 'yyyy-MM-dd')

  var texto = String(valor)
  // Ya viene en formato ISO: se recorta la parte de la fecha.
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10)

  // Último recurso: se intenta interpretar el texto como fecha.
  var interpretada = new Date(texto)
  if (!isNaN(interpretada.getTime())) {
    return Utilities.formatDate(interpretada, 'GMT-4', 'yyyy-MM-dd')
  }

  return ''
}

function formatearMarcaTemporal(valor) {
  if (esFecha(valor)) return valor.toISOString()
  return String(valor)
}

/** Devuelve el teléfono como texto, recuperando los ceros que Sheets descarta. */
function normalizarTelefono(valor) {
  if (valor === '' || valor === null || valor === undefined) return ''

  var texto = String(valor)
  // Sheets puede devolver 7.0000000E7 para números largos.
  if (typeof valor === 'number') texto = valor.toFixed(0)

  return texto
}
