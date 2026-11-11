/**
 * ============================================================================
 *  EcoConecta SCZ — Servidor sobre Google Sheets
 * ============================================================================
 *
 * Este script convierte una hoja de cálculo de Google en la base de datos de
 * la plataforma y hace de servidor: decide quién puede leer y modificar qué.
 *
 *   - Cuentas: registro, inicio de sesión y perfil. La contraseña se guarda
 *     como hash con sal; nunca en texto plano.
 *   - Sesiones: al ingresar se entrega una llave (token) que vence a los
 *     60 días. Toda modificación exige esa llave.
 *   - Publicaciones: solo el dueño puede editarlas o eliminarlas.
 *   - Contactos: quién consultó por cada publicación (una vez por cuenta).
 *   - Guardados: las publicaciones que cada usuario marcó con el corazón.
 *   - Recuperar la contraseña con un código de 6 dígitos enviado por correo.
 *   - Correo de confirmación al registrarse.
 *   - Fecha y hora de Bolivia, legibles, en cada registro, publicación y contacto.
 *   - Panel de administrador en la web, protegido con la clave CLAVE_ADMIN.
 *
 * Hoja compartida (la que se entrega; se crean solas las pestañas que falten):
 *
 *   Respuestas   todas las cuentas: Marca temporal | Nombre | Email | Tipo |
 *                Lugar | Fecha | Mensaje | y las columnas propias del proyecto
 *   Empresas, Recolectores, Ambos   vistas automáticas de Respuestas por tipo
 *                                   (fórmula FILTER: no se escribe en ellas)
 *   Publicaciones
 *   Consultas    cada vez que alguien tomó el WhatsApp o el teléfono de una
 *                publicación para contactar a quien la publicó
 *
 * Archivo privado "EcoConecta SCZ – Datos privados (NO compartir)", que el
 * script crea en el Drive de la cuenta dueña y nunca se comparte:
 *
 *   Credenciales (hash y sal de las contraseñas), Sesiones, Guardados,
 *   Recuperaciones y los respaldos de versiones anteriores.
 *
 * INSTALACIÓN: ver README.md, sección "Conectar con Google Sheets". Al pasar de
 * una versión anterior hay que ejecutar UNA vez la función actualizarHojas.
 */

var ZONA_HORARIA = 'America/La_Paz'
var HOJA_PUBLICACIONES = 'Publicaciones'
var HOJA_CONSULTAS = 'Consultas'
/** Nombre que tenía la pestaña de consultas hasta el 16/10; actualizarHojas la convierte. */
var HOJA_CONTACTOS = 'Contactos'
var HOJA_SESIONES = 'Sesiones'
var HOJA_GUARDADOS = 'Guardados'

/** Pestaña principal de cuentas: la que pide la guía del profesor. */
var HOJA_RESPUESTAS = 'Respuestas'

/** Vista automática de Respuestas para cada tipo de cuenta. */
var HOJA_POR_TIPO = { oferente: 'Empresas', recolector: 'Recolectores', ambos: 'Ambos' }

/**
 * Las columnas se leen por posición: el orden de estas listas es el orden de
 * la hoja. De A a G, los 7 títulos de la guía; desde H, los del proyecto.
 */
var COLUMNAS_RESPUESTAS = [
  'marcaTemporal',
  'nombre',
  'email',
  'tipo',
  'lugar',
  'fechaServicio',
  'mensaje',
  'empresa',
  'telefono',
  'correoConfirmacion',
  'id',
]

/** Columnas de las pestañas por tipo en la versión del 17/10 (antes de Respuestas). */
var CUENTAS_17_OCTUBRE = [
  'fecha',
  'hora',
  'empresa',
  'contacto',
  'telefono',
  'correo',
  'tipo',
  'correoConfirmacion',
  'zonaInteres',
  'id',
  'creadoEn',
  'hashClave',
  'sal',
]

/** Contraseñas (hash con sal), en el archivo privado. Una fila por cuenta. */
var HOJA_CREDENCIALES = 'Credenciales'
var COLUMNAS_CREDENCIALES = ['usuarioId', 'hashClave', 'sal']

/** Lo que se le devuelve a la web: nunca el hash ni la sal. */
var CAMPOS_PUBLICOS_USUARIO = [
  'id',
  'empresa',
  'contacto',
  'telefono',
  'correo',
  'tipo',
  'creadoEn',
  'zonaInteres',
]

var COLUMNAS_PUBLICACIONES = [
  'fecha',
  'hora',
  'titulo',
  'empresa',
  'contacto',
  'telefono',
  'estado',
  'cantidad',
  'unidad',
  'frecuencia',
  'zona',
  'direccion',
  'descripcion',
  'modalidadPrecio',
  'valorEstimadoMin',
  'valorEstimadoMax',
  'fechaDisponible',
  'contactos',
  'categoriaId',
  'materialId',
  'usuarioId',
  'id',
  'creadaEn',
  'origen',
]

/**
 * Una fila por cada vez que alguien tomó el WhatsApp o el teléfono de una
 * publicación. Sirve para medir el interés por cada material y para que quien
 * publicó sepa quién lo consultó. usuarioId vacío = visitante sin cuenta.
 */
var COLUMNAS_CONSULTAS = [
  'fecha',
  'hora',
  'publicacion',
  'publicadoPor',
  'consultadoPor',
  'persona',
  'telefonoConsulta',
  'correoConsulta',
  'tipoConsulta',
  'medio',
  'publicacionId',
  'usuarioId',
]

/** Columnas de "Contactos" en la versión del 16/10, para convertirla. */
var CONTACTOS_16_OCTUBRE = ['fecha', 'hora', 'titulo', 'publicacionId', 'usuarioId', 'empresa', 'contacto', 'tipo']

var VISITANTE = 'Visitante sin cuenta'

/** Cómo contactó: lo manda la web según el botón que se tocó. */
var MEDIOS = { whatsapp: 'WhatsApp', llamada: 'Llamada' }

/** expiraEn en milisegundos: un número evita que Sheets lo convierta en fecha. */
var COLUMNAS_SESIONES = ['token', 'usuarioId', 'creadaEn', 'expiraEn']

var COLUMNAS_GUARDADOS = ['usuarioId', 'publicacionId', 'fecha']

/** Códigos para restablecer la contraseña. El código se guarda como hash, nunca tal cual. */
var HOJA_RECUPERACIONES = 'Recuperaciones'
var COLUMNAS_RECUPERACIONES = ['correo', 'hashCodigo', 'sal', 'creadoEn', 'expiraEn', 'intentos', 'usado']

/** Pestañas que viven en el archivo privado, nunca en la hoja compartida. */
var HOJAS_PRIVADAS = [HOJA_CREDENCIALES, HOJA_SESIONES, HOJA_GUARDADOS, HOJA_RECUPERACIONES]

/** Nombre del archivo privado y propiedad donde se guarda su id. */
var NOMBRE_LIBRO_PRIVADO = 'EcoConecta SCZ – Datos privados (NO compartir)'
var PROPIEDAD_LIBRO_PRIVADO = 'LIBRO_PRIVADO_ID'

/**
 * Títulos que se ven en la fila 1. Las columnas sin título acá muestran su
 * nombre interno (las pestañas técnicas). Se puede renombrar un título en la
 * hoja sin romper nada, porque el script lee por posición.
 */
var TITULOS = {
  marcaTemporal: 'Marca temporal',
  nombre: 'Nombre',
  email: 'Email',
  lugar: 'Lugar',
  fechaServicio: 'Fecha',
  mensaje: 'Mensaje',
  fecha: 'Fecha',
  hora: 'Hora',
  empresa: 'Empresa / negocio',
  contacto: 'Contacto',
  telefono: 'Teléfono',
  correo: 'Correo',
  tipo: 'Tipo',
  correoConfirmacion: 'Correo de confirmación',
  zonaInteres: 'Zona de interés',
  id: 'ID',
  creadoEn: 'Creado (UTC)',
  creadaEn: 'Creada (UTC)',
  hashClave: 'hashClave',
  sal: 'sal',
  titulo: 'Título',
  estado: 'Estado',
  cantidad: 'Cantidad',
  unidad: 'Unidad',
  frecuencia: 'Frecuencia',
  zona: 'Zona',
  direccion: 'Dirección',
  descripcion: 'Descripción',
  modalidadPrecio: 'Modalidad',
  valorEstimadoMin: 'Valor estimado mín. (Bs)',
  valorEstimadoMax: 'Valor estimado máx. (Bs)',
  fechaDisponible: 'Disponible desde',
  contactos: 'Consultas recibidas',
  categoriaId: 'Categoría',
  materialId: 'Material',
  usuarioId: 'ID usuario',
  origen: 'Origen',
  publicacionId: 'ID publicación',
  publicacion: 'Material consultado',
  publicadoPor: 'Publicado por',
  consultadoPor: 'Consultado por',
  persona: 'Persona que consultó',
  telefonoConsulta: 'Teléfono de quien consultó',
  correoConsulta: 'Correo de quien consultó',
  tipoConsulta: 'Tipo de cuenta de quien consultó',
  medio: 'Medio',
}

/** Títulos que tuvieron antes algunas columnas: se reconocen y actualizarHojas los renombra. */
var TITULOS_ANTERIORES = { contactos: 'Contactos recibidos' }

/** Explicación que aparece al pasar el mouse por el título de la columna. */
var NOTAS = {
  marcaTemporal: 'Fecha y hora del registro, en hora de Bolivia.',
  nombre: 'Persona de contacto de la cuenta.',
  tipo: 'oferente (genera residuos), recolector (los busca) o ambos.',
  lugar: 'Zona (distrito) de Santa Cruz donde opera.',
  fechaServicio:
    'Fecha estimada de la primera entrega (si ofrece material) o recolección (si lo busca), indicada al registrarse.',
  mensaje: 'Qué materiales genera o busca, en sus palabras.',
  publicacion:
    'Cada fila es una consulta: alguien tocó WhatsApp o Llamar en esta publicación para contactar a quien la publicó.',
  publicadoPor: 'Negocio dueño de la publicación (el que recibe la consulta).',
  consultadoPor: 'Negocio que consultó. "Visitante sin cuenta" si no había iniciado sesión.',
  persona: 'Nombre de contacto de la cuenta que consultó.',
  telefonoConsulta: 'Para hacer seguimiento: el teléfono de quien consultó.',
  correoConsulta: 'Para hacer seguimiento: el correo de quien consultó.',
  medio: 'Botón que tocó: WhatsApp o Llamada. "No registrado" en las consultas anteriores al 17/10.',
}

/** Formato de cada columna. Teléfonos y textos como texto: así no pierden ceros. */
var FORMATOS = {
  marcaTemporal: 'dd/mm/yyyy HH:mm:ss',
  fechaServicio: 'dd/mm/yyyy',
  fecha: 'dd/mm/yyyy',
  hora: 'HH:mm',
  telefono: '@',
  telefonoConsulta: '@',
  fechaDisponible: '@',
}

/** Columnas que nadie necesita ver: se ocultan (siguen ahí para el script). */
var COLUMNAS_OCULTAS = []

/** Clave del administrador: Configuración del proyecto → Propiedades de la secuencia de comandos. */
var PROPIEDAD_CLAVE_ADMIN = 'CLAVE_ADMIN'

/**
 * Correos de las cuentas administradoras, separados por coma, en la misma
 * sección de propiedades. Esas cuentas entran al panel con su sesión normal.
 */
var PROPIEDAD_CORREOS_ADMIN = 'CORREOS_ADMIN'
var INTENTOS_ADMIN = 8

var MINUTOS_CODIGO = 15
var INTENTOS_CODIGO = 5
var CODIGOS_POR_HORA = 3
var URL_SITIO = 'https://toledogutierrezecoconecta-png.github.io/ecoconecta/'

var DIAS_SESION = 60
var ITERACIONES_HASH = 1000
var LARGO_MAXIMO = 2000
var TIPOS_USUARIO = ['oferente', 'recolector', 'ambos']
var ESTADOS = ['disponible', 'pausada', 'concretada']

// ================================================================= utilidades

function titulo(columna) {
  return TITULOS[columna] || columna
}

/** Aplica formatos y oculta columnas técnicas desde la columna `desde` (base 1). */
function prepararColumnas(hoja, columnas, desde) {
  var filas = Math.max(hoja.getMaxRows() - 1, 1)
  columnas.forEach(function (columna, posicion) {
    var numero = desde + posicion
    if (NOTAS[columna]) hoja.getRange(1, numero).setNote(NOTAS[columna])
    if (FORMATOS[columna]) hoja.getRange(2, numero, filas, 1).setNumberFormat(FORMATOS[columna])
    if (COLUMNAS_OCULTAS.indexOf(columna) !== -1) hoja.hideColumns(numero)
  })
}

/** Devuelve la hoja; si no existe la crea, y si le faltan columnas las agrega al final. */
function obtenerHoja(nombre, columnas) {
  // Si se ejecuta sola desde el editor (sin nombre ni columnas), no crea
  // una pestaña vacía: avisa qué función había que elegir.
  if (!nombre || !columnas) {
    throw new Error('Esta función no se ejecuta sola. Elegí "actualizarHojas" en el menú de funciones y tocá Ejecutar.')
  }

  var libro = HOJAS_PRIVADAS.indexOf(nombre) !== -1 ? libroPrivado() : SpreadsheetApp.getActiveSpreadsheet()
  var hoja = libro.getSheetByName(nombre)
  var titulos = columnas.map(titulo)

  if (!hoja) {
    hoja = libro.insertSheet(nombre)
    hoja.appendRow(titulos)
    hoja.getRange(1, 1, 1, titulos.length).setFontWeight('bold')
    hoja.setFrozenRows(1)
    prepararColumnas(hoja, columnas, 1)
    return hoja
  }

  // Una columna existe si su título está, o su nombre interno (hojas de antes).
  var ancho = Math.max(hoja.getLastColumn(), 1)
  var encabezado = hoja.getRange(1, 1, 1, ancho).getValues()[0].map(String)
  var faltantes = columnas.filter(function (columna) {
    return (
      encabezado.indexOf(titulo(columna)) === -1 &&
      encabezado.indexOf(columna) === -1 &&
      encabezado.indexOf(TITULOS_ANTERIORES[columna]) === -1
    )
  })

  if (faltantes.length > 0) {
    var desde = encabezado.filter(String).length + 1
    hoja.getRange(1, desde, 1, faltantes.length).setValues([faltantes.map(titulo)])
    hoja.getRange(1, desde, 1, faltantes.length).setFontWeight('bold')
    prepararColumnas(hoja, faltantes, desde)
  }

  return hoja
}

/** Archivo privado abierto en esta ejecución (abrirlo cuesta: se reutiliza). */
var libroPrivadoAbierto = null

/**
 * El archivo privado con contraseñas, sesiones y respaldos. Se crea la primera
 * vez en el Drive de la cuenta dueña del script y su id queda en las
 * propiedades. Si el id existe pero no se puede abrir, NO se crea otro: eso
 * dejaría a todos sin contraseña. Se avisa con un error.
 */
function libroPrivado() {
  if (libroPrivadoAbierto) return libroPrivadoAbierto

  var propiedades = PropertiesService.getScriptProperties()
  var id = propiedades.getProperty(PROPIEDAD_LIBRO_PRIVADO)
  if (id) {
    libroPrivadoAbierto = SpreadsheetApp.openById(id)
    return libroPrivadoAbierto
  }

  libroPrivadoAbierto = SpreadsheetApp.create(NOMBRE_LIBRO_PRIVADO)
  propiedades.setProperty(PROPIEDAD_LIBRO_PRIVADO, libroPrivadoAbierto.getId())
  return libroPrivadoAbierto
}

function respuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function rechazo(codigo, mensaje) {
  return respuesta({ ok: false, codigo: codigo, error: mensaje })
}

/**
 * Evita que la hoja ejecute fórmulas escritas por los usuarios.
 *
 * Sheets interpreta como fórmula cualquier texto que empiece con = + - o @
 * (por ejemplo "=IMPORTXML(...)" en una descripción). El apóstrofo inicial lo
 * fuerza a texto: no se ve en la celda y getValues() lo devuelve sin él.
 */
function seguro(valor) {
  if (typeof valor === 'string' && /^[=+\-@]/.test(valor)) return "'" + valor
  return valor
}

/** Texto recortado y con largo máximo, para que nadie llene la hoja. */
function texto(valor, maximo) {
  if (valor === undefined || valor === null) return ''
  return String(valor).trim().slice(0, maximo || LARGO_MAXIMO)
}

function filaDesdeObjeto(objeto, columnas) {
  return columnas.map(function (columna) {
    var valor = objeto[columna]
    return valor === undefined || valor === null ? '' : seguro(valor)
  })
}

/** Lee todas las filas como objetos. `_fila` es el número de fila (base 1). */
function leerFilas(hoja, columnas) {
  var ultima = hoja.getLastRow()
  if (ultima < 2) return []

  var valores = hoja.getRange(2, 1, ultima - 1, columnas.length).getValues()
  return valores
    .map(function (fila, indice) {
      var objeto = { _fila: indice + 2 }
      columnas.forEach(function (columna, posicion) {
        objeto[columna] = fila[posicion]
      })
      return objeto
    })
    .filter(function (objeto) {
      return objeto[columnas[0]] !== ''
    })
}

/** Primera fila cuyo campo coincide (comparando como texto), o null. */
function buscar(filas, campo, valor) {
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i][campo]) === String(valor)) return filas[i]
  }
  return null
}

function escribirFila(hoja, numeroFila, objeto, columnas) {
  hoja.getRange(numeroFila, 1, 1, columnas.length).setValues([filaDesdeObjeto(objeto, columnas)])
}

function generarId(prefijo) {
  return prefijo + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16)
}

// ================================================================= cuentas

/** SHA-256 con sal, repetido para que adivinar contraseñas sea lento. */
function calcularHash(clave, sal) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    sal + clave,
    Utilities.Charset.UTF_8,
  )
  for (var i = 1; i < ITERACIONES_HASH; i++) {
    bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
  }
  return Utilities.base64Encode(bytes)
}

/** Fecha (con hora de mediodía en Bolivia, para que no cambie de día) a partir de "yyyy-MM-dd". */
function fechaDeTexto(valor) {
  if (esFecha(valor)) return valor
  var coincidencia = /^(\d{4}-\d{2}-\d{2})/.exec(String(valor || ''))
  return coincidencia ? new Date(coincidencia[1] + 'T12:00:00-04:00') : ''
}

/** Una fila de Respuestas a partir de una cuenta. */
function cuentaAFila(cuenta) {
  return {
    marcaTemporal: esFecha(cuenta.fecha) ? cuenta.fecha : fechaDesde(cuenta.creadoEn),
    nombre: cuenta.contacto,
    email: cuenta.correo,
    tipo: cuenta.tipo,
    lugar: cuenta.zonaInteres,
    fechaServicio: fechaDeTexto(cuenta.fechaServicio),
    mensaje: cuenta.mensaje,
    empresa: cuenta.empresa,
    telefono: normalizarTelefono(cuenta.telefono),
    correoConfirmacion: cuenta.correoConfirmacion,
    id: cuenta.id,
  }
}

/** Una cuenta a partir de una fila de Respuestas. */
function filaACuenta(fila) {
  var marca = fechaDesde(fila.marcaTemporal)
  return {
    id: String(fila.id),
    empresa: String(fila.empresa),
    contacto: String(fila.nombre),
    telefono: normalizarTelefono(fila.telefono),
    correo: String(fila.email).toLowerCase(),
    tipo: String(fila.tipo),
    creadoEn: marca.toISOString(),
    zonaInteres: String(fila.lugar),
    fechaServicio: fila.fechaServicio === '' ? '' : formatearFecha(fila.fechaServicio),
    mensaje: String(fila.mensaje),
    correoConfirmacion: String(fila.correoConfirmacion),
    fecha: marca,
    hora: marca,
    _fila: fila._fila,
  }
}

function hojaRespuestas() {
  return obtenerHoja(HOJA_RESPUESTAS, COLUMNAS_RESPUESTAS)
}

/** Todas las cuentas (pestaña Respuestas). */
function leerCuentas() {
  return leerFilas(hojaRespuestas(), COLUMNAS_RESPUESTAS).map(filaACuenta)
}

function buscarCuenta(campo, valor) {
  return buscar(leerCuentas(), campo, valor)
}

/** Agrega una cuenta nueva a Respuestas (con la fecha y hora de ahora si no trae). */
function agregarCuenta(cuenta) {
  if (!esFecha(cuenta.fecha) && !cuenta.creadoEn) cuenta.fecha = new Date()
  hojaRespuestas().appendRow(filaDesdeObjeto(cuentaAFila(cuenta), COLUMNAS_RESPUESTAS))
}

/** Reescribe la fila de una cuenta que ya está en Respuestas. */
function guardarCuenta(cuenta) {
  escribirFila(hojaRespuestas(), cuenta._fila, cuentaAFila(cuenta), COLUMNAS_RESPUESTAS)
}

// --------------------------------------------- contraseñas (archivo privado)

function hojaCredenciales() {
  return obtenerHoja(HOJA_CREDENCIALES, COLUMNAS_CREDENCIALES)
}

/** Hash y sal de una cuenta, o null si todavía no tiene contraseña. */
function credencialDe(usuarioId) {
  var fila = buscar(leerFilas(hojaCredenciales(), COLUMNAS_CREDENCIALES), 'usuarioId', usuarioId)
  return fila && fila.hashClave ? fila : null
}

/** Guarda (o reemplaza) la contraseña de una cuenta. */
function guardarCredencial(usuarioId, hashClave, sal) {
  var hoja = hojaCredenciales()
  var datos = { usuarioId: String(usuarioId), hashClave: hashClave, sal: sal }
  var existente = buscar(leerFilas(hoja, COLUMNAS_CREDENCIALES), 'usuarioId', usuarioId)
  if (existente) escribirFila(hoja, existente._fila, datos, COLUMNAS_CREDENCIALES)
  else hoja.appendRow(filaDesdeObjeto(datos, COLUMNAS_CREDENCIALES))
}

function claveCorrecta(usuarioId, clave) {
  var credencial = credencialDe(usuarioId)
  return Boolean(credencial) && calcularHash(String(clave || ''), String(credencial.sal)) === String(credencial.hashClave)
}

function usuarioPublico(fila) {
  var usuario = {}
  CAMPOS_PUBLICOS_USUARIO.forEach(function (campo) {
    usuario[campo] = fila[campo] === undefined ? '' : fila[campo]
  })
  usuario.telefono = normalizarTelefono(usuario.telefono)
  usuario.creadoEn = formatearMarcaTemporal(usuario.creadoEn)
  usuario.correo = String(usuario.correo)
  usuario.esAdmin = esCorreoAdmin(usuario.correo)
  return usuario
}

function correoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
}

/** Valida y limpia los datos de perfil. Devuelve un texto de error o null. */
function validarPerfil(datos) {
  if (!texto(datos.empresa)) return 'Falta el nombre del negocio.'
  if (!texto(datos.contacto)) return 'Falta el nombre de contacto.'
  if (texto(datos.telefono).replace(/\D/g, '').length < 7) return 'El teléfono no es válido.'
  if (TIPOS_USUARIO.indexOf(datos.tipo) === -1) return 'El tipo de usuario no es válido.'
  return null
}

function crearSesion(usuarioId) {
  var hoja = obtenerHoja(HOJA_SESIONES, COLUMNAS_SESIONES)
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '')
  var ahora = Date.now()

  hoja.appendRow(
    filaDesdeObjeto(
      { token: token, usuarioId: usuarioId, creadaEn: new Date(ahora).toISOString(), expiraEn: ahora + DIAS_SESION * 86400000 },
      COLUMNAS_SESIONES,
    ),
  )
  return token
}

/** Devuelve el usuarioId de una sesión vigente, o null. */
function validarSesion(token) {
  if (!token) return null

  var sesion = buscar(leerFilas(obtenerHoja(HOJA_SESIONES, COLUMNAS_SESIONES), COLUMNAS_SESIONES), 'token', token)
  if (!sesion) return null
  if (Number(sesion.expiraEn) < Date.now()) return null

  return String(sesion.usuarioId)
}

function entregarSesion(fila) {
  return respuesta({ ok: true, usuario: usuarioPublico(fila), token: crearSesion(String(fila.id)) })
}

function registrarUsuario(datos) {
  var correo = texto(datos.correo, 200).toLowerCase()
  var clave = String(datos.clave || '')

  // Campo trampa: invisible para las personas, solo un robot lo llena.
  if (texto(datos.website)) return rechazo('datos_invalidos', 'No se pudo completar el registro.')

  if (!correoValido(correo)) return rechazo('datos_invalidos', 'El correo no es válido.')
  if (clave.length < 6) return rechazo('datos_invalidos', 'La contraseña debe tener al menos 6 caracteres.')
  var error = validarPerfil(datos)
  if (error) return rechazo('datos_invalidos', error)
  if (!texto(datos.zona, 30)) return rechazo('datos_invalidos', 'Elegí la zona donde operás.')
  if (!fechaDeTexto(datos.fecha)) return rechazo('datos_invalidos', 'Indicá una fecha estimada válida.')
  if (!texto(datos.mensaje, 500)) return rechazo('datos_invalidos', 'Contanos qué materiales generás o buscás.')

  if (buscarCuenta('correo', correo)) {
    return rechazo('correo_existente', 'Ya existe una cuenta registrada con ese correo electrónico.')
  }

  var sal = Utilities.getUuid()
  var ahora = new Date()
  var fila = {
    fecha: ahora,
    hora: ahora,
    id: generarId('usr'),
    empresa: texto(datos.empresa, 120),
    contacto: texto(datos.contacto, 120),
    telefono: texto(datos.telefono, 30).replace(/\s+/g, ''),
    correo: correo,
    tipo: datos.tipo,
    creadoEn: ahora.toISOString(),
    zonaInteres: texto(datos.zona, 30),
    fechaServicio: texto(datos.fecha, 10),
    mensaje: texto(datos.mensaje, 500),
  }

  var correoEnviado = enviarBienvenida(fila)
  fila.correoConfirmacion = correoEnviado ? 'Enviado' : 'No se pudo enviar'
  agregarCuenta(fila)
  guardarCredencial(fila.id, calcularHash(clave, sal), sal)

  return respuesta({
    ok: true,
    usuario: usuarioPublico(fila),
    token: crearSesion(String(fila.id)),
    correoEnviado: correoEnviado,
  })
}

function iniciarSesion(datos) {
  var correo = texto(datos.correo, 200).toLowerCase()
  var fila = buscarCuenta('correo', correo)

  if (!fila) return rechazo('no_existe', 'No encontramos una cuenta con ese correo.')
  // Cuenta creada antes de que existieran las contraseñas en la hoja: la web
  // intenta recuperarla con los datos que guardó el navegador.
  if (!credencialDe(fila.id)) return rechazo('cuenta_sin_clave', 'Esta cuenta todavía no tiene contraseña en la hoja.')
  if (!claveCorrecta(fila.id, datos.clave)) {
    return rechazo('credenciales', 'La contraseña no es correcta.')
  }

  return entregarSesion(fila)
}

/**
 * Pasa a la hoja una cuenta que hasta ahora existía solo en un navegador.
 *
 * La web solo llama a esto después de comprobar la contraseña contra la copia
 * local. Si la cuenta ya está en la hoja sin contraseña, el id debe coincidir.
 */
function reclamarCuenta(datos) {
  var usuario = datos.usuario || {}
  var correo = texto(usuario.correo, 200).toLowerCase()
  var clave = String(datos.clave || '')
  var id = texto(usuario.id, 60)

  if (!id || !correoValido(correo) || clave.length < 6) {
    return rechazo('datos_invalidos', 'Los datos de la cuenta no son válidos.')
  }

  var filas = leerCuentas()
  var existente = buscar(filas, 'correo', correo)
  var sal = Utilities.getUuid()

  if (existente) {
    if (credencialDe(existente.id)) return rechazo('correo_existente', 'Esta cuenta ya tiene contraseña. Iniciá sesión normalmente.')
    if (String(existente.id) !== id) return rechazo('no_autorizado', 'No se pudo recuperar la cuenta.')

    guardarCredencial(existente.id, calcularHash(clave, sal), sal)
    return entregarSesion(existente)
  }

  if (buscar(filas, 'id', id)) return rechazo('no_autorizado', 'No se pudo recuperar la cuenta.')

  var perfil = {
    empresa: usuario.empresa,
    contacto: usuario.contacto,
    telefono: usuario.telefono,
    tipo: usuario.tipo,
  }
  var error = validarPerfil(perfil)
  if (error) return rechazo('datos_invalidos', error)

  var creadoEn = texto(usuario.creadoEn, 40) || new Date().toISOString()
  var fecha = new Date(creadoEn)
  if (isNaN(fecha.getTime())) fecha = new Date()

  var fila = {
    fecha: fecha,
    hora: fecha,
    correoConfirmacion: 'Cuenta anterior (sin correo)',
    id: id,
    empresa: texto(perfil.empresa, 120),
    contacto: texto(perfil.contacto, 120),
    telefono: texto(perfil.telefono, 30).replace(/\s+/g, ''),
    correo: correo,
    tipo: perfil.tipo,
    creadoEn: creadoEn,
    zonaInteres: texto(usuario.zonaInteres, 20),
  }

  agregarCuenta(fila)
  guardarCredencial(id, calcularHash(clave, sal), sal)
  return entregarSesion(fila)
}

// ================================================== recuperar la contraseña

function hashCodigo(codigo, sal) {
  return Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sal + codigo, Utilities.Charset.UTF_8),
  )
}

/** Código de 6 dígitos a partir de un UUID (más aleatorio que Math.random). */
function generarCodigo() {
  var numero = parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 12), 16) % 1000000
  return ('000000' + numero).slice(-6)
}

/**
 * Envía un código por correo para restablecer la contraseña.
 *
 * Siempre responde lo mismo exista o no la cuenta, para que nadie pueda usar
 * esta pantalla para averiguar qué correos están registrados.
 */
function solicitarRecuperacion(datos) {
  var correo = texto(datos.correo, 200).toLowerCase()
  if (!correoValido(correo)) return rechazo('datos_invalidos', 'El correo no es válido.')

  var cuenta = buscarCuenta('correo', correo)
  if (!cuenta) return respuesta({ ok: true })

  var hoja = obtenerHoja(HOJA_RECUPERACIONES, COLUMNAS_RECUPERACIONES)
  var filas = leerFilas(hoja, COLUMNAS_RECUPERACIONES)
  var haceUnaHora = Date.now() - 3600000

  var recientes = filas.filter(function (fila) {
    return String(fila.correo) === correo && new Date(formatearMarcaTemporal(fila.creadoEn)).getTime() > haceUnaHora
  })
  if (recientes.length >= CODIGOS_POR_HORA) {
    return rechazo('limite_envios', 'Ya enviamos varios códigos a este correo. Esperá una hora y probá de nuevo.')
  }

  // Un código nuevo anula los anteriores.
  filas.forEach(function (fila) {
    if (String(fila.correo) === correo && fila.usado !== true && String(fila.usado) !== 'TRUE') {
      hoja.getRange(fila._fila, COLUMNAS_RECUPERACIONES.indexOf('usado') + 1).setValue(true)
    }
  })

  var codigo = generarCodigo()
  var sal = Utilities.getUuid()
  var ahora = Date.now()
  // filaDesdeObjeto pasa todo por seguro(): el hash en base64 puede empezar con
  // "+" y Sheets lo tomaría como fórmula, y el código nunca coincidiría.
  hoja.appendRow(
    filaDesdeObjeto(
      {
        correo: correo,
        hashCodigo: hashCodigo(codigo, sal),
        sal: sal,
        creadoEn: new Date(ahora).toISOString(),
        expiraEn: ahora + MINUTOS_CODIGO * 60000,
        intentos: 0,
        usado: false,
      },
      COLUMNAS_RECUPERACIONES,
    ),
  )

  var enlace = URL_SITIO + '#/recuperar?correo=' + encodeURIComponent(correo)
  MailApp.sendEmail({
    to: correo,
    name: 'EcoConecta SCZ',
    subject: 'Tu código para restablecer la contraseña: ' + codigo,
    body:
      'Hola ' + cuenta.contacto + ',\n\n' +
      'Tu código para crear una contraseña nueva en EcoConecta SCZ es:\n\n' +
      '    ' + codigo + '\n\n' +
      'Vence en ' + MINUTOS_CODIGO + ' minutos y sirve una sola vez. Escribilo en:\n' + enlace + '\n\n' +
      'Si no pediste este código, ignorá este correo: tu contraseña no cambia.\n\n' +
      'EcoConecta SCZ — Santa Cruz de la Sierra',
    htmlBody:
      '<div style="font-family:Arial,sans-serif;max-width:480px;color:#222a26">' +
      '<p>Hola ' + escaparHtml(cuenta.contacto) + ',</p>' +
      '<p>Tu código para crear una contraseña nueva en <b>EcoConecta SCZ</b> es:</p>' +
      '<p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#0f4a2d">' + codigo + '</p>' +
      '<p>Vence en ' + MINUTOS_CODIGO + ' minutos y sirve una sola vez.</p>' +
      '<p><a href="' + enlace + '" style="background:#16613c;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;display:inline-block">Escribir el código</a></p>' +
      '<p style="color:#6d7a74;font-size:13px">Si no pediste este código, ignorá este correo: tu contraseña no cambia.</p>' +
      '</div>',
  })

  return respuesta({ ok: true })
}

function escaparHtml(valor) {
  return String(valor).replace(/[&<>"']/g, function (caracter) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caracter]
  })
}

/** Cierra todas las sesiones de una cuenta (por ejemplo, al cambiar la contraseña). */
function cerrarSesionesDe(usuarioId) {
  var hoja = obtenerHoja(HOJA_SESIONES, COLUMNAS_SESIONES)
  var filas = leerFilas(hoja, COLUMNAS_SESIONES)
  // De abajo hacia arriba, para que borrar una fila no corra las siguientes.
  for (var i = filas.length - 1; i >= 0; i--) {
    if (String(filas[i].usuarioId) === usuarioId) hoja.deleteRow(filas[i]._fila)
  }
}

/** Con el código correcto, guarda la contraseña nueva e inicia sesión. */
function restablecerClave(datos) {
  var correo = texto(datos.correo, 200).toLowerCase()
  var codigo = texto(datos.codigo, 10).replace(/\D/g, '')
  var clave = String(datos.clave || '')

  if (clave.length < 6) return rechazo('datos_invalidos', 'La contraseña debe tener al menos 6 caracteres.')

  var hoja = obtenerHoja(HOJA_RECUPERACIONES, COLUMNAS_RECUPERACIONES)
  var vigente = null
  leerFilas(hoja, COLUMNAS_RECUPERACIONES).forEach(function (fila) {
    var usado = fila.usado === true || String(fila.usado) === 'TRUE'
    if (String(fila.correo) === correo && !usado) vigente = fila
  })

  if (!vigente) return rechazo('codigo_invalido', 'El código no es válido. Pedí uno nuevo.')
  if (Number(vigente.expiraEn) < Date.now()) return rechazo('codigo_vencido', 'El código venció. Pedí uno nuevo.')

  var intentos = Number(vigente.intentos) || 0
  if (intentos >= INTENTOS_CODIGO) {
    return rechazo('demasiados_intentos', 'Demasiados intentos con este código. Pedí uno nuevo.')
  }

  if (hashCodigo(codigo, String(vigente.sal)) !== String(vigente.hashCodigo)) {
    hoja.getRange(vigente._fila, COLUMNAS_RECUPERACIONES.indexOf('intentos') + 1).setValue(intentos + 1)
    var quedan = INTENTOS_CODIGO - intentos - 1
    return rechazo(
      quedan > 0 ? 'codigo_invalido' : 'demasiados_intentos',
      quedan > 0
        ? 'El código no es correcto. ' + (quedan === 1 ? 'Te queda 1 intento.' : 'Te quedan ' + quedan + ' intentos.')
        : 'Demasiados intentos con este código. Pedí uno nuevo.',
    )
  }

  var cuenta = buscarCuenta('correo', correo)
  if (!cuenta) return rechazo('codigo_invalido', 'El código no es válido. Pedí uno nuevo.')

  hoja.getRange(vigente._fila, COLUMNAS_RECUPERACIONES.indexOf('usado') + 1).setValue(true)

  var sal = Utilities.getUuid()
  guardarCredencial(cuenta.id, calcularHash(clave, sal), sal)

  // Si alguien más tenía la sesión abierta, deja de servirle.
  cerrarSesionesDe(String(cuenta.id))
  return entregarSesion(cuenta)
}

/**
 * Ejecutar UNA VEZ desde el editor de Apps Script antes de publicar esta
 * versión: Google pide autorizar el permiso para enviar correos. Manda un
 * correo de prueba a la cuenta dueña del script.
 */
function autorizarCorreo() {
  var cuenta = Session.getEffectiveUser().getEmail()
  MailApp.sendEmail(cuenta, 'EcoConecta SCZ: envío de correos autorizado', 'Listo: el script ya puede enviar los correos de confirmación y los códigos para restablecer contraseñas.')
  Logger.log('Correo de prueba enviado a ' + cuenta + '. Quedan ' + MailApp.getRemainingDailyQuota() + ' envíos hoy.')
}

// ======================================================= actualizar la hoja

/** Columnas de la versión anterior (11/10), en su orden. */
var ANTERIOR_USUARIOS = ['id', 'empresa', 'contacto', 'telefono', 'correo', 'tipo', 'creadoEn', 'zonaInteres', 'hashClave', 'sal']
var ANTERIOR_PUBLICACIONES = [
  'id', 'titulo', 'categoriaId', 'materialId', 'descripcion', 'cantidad', 'unidad', 'frecuencia', 'zona',
  'direccion', 'modalidadPrecio', 'valorEstimadoMin', 'valorEstimadoMax', 'fechaDisponible', 'estado',
  'contactos', 'usuarioId', 'empresa', 'contacto', 'telefono', 'creadaEn', 'origen',
]
var ANTERIOR_CONTACTOS = ['publicacionId', 'fecha', 'usuarioId', 'empresa', 'contacto', 'tipo']

/** Fecha a partir de lo que haya en la celda (fecha de Sheets o texto ISO). */
function fechaDesde(valor) {
  if (esFecha(valor)) return valor
  var fecha = new Date(String(valor))
  return isNaN(fecha.getTime()) ? new Date() : fecha
}

/** Nombre libre en un libro: "Nombre", "Nombre 2", "Nombre 3"… */
function nombreLibre(libro, nombre) {
  var destino = nombre
  for (var n = 2; libro.getSheetByName(destino); n++) destino = nombre + ' ' + n
  return destino
}

/**
 * Copia una pestaña al archivo privado (como respaldo) y la saca de la hoja
 * compartida. Nada se pierde: queda completa en el archivo privado.
 */
function moverAlPrivado(hoja, nombre) {
  var privado = libroPrivado()
  var copia = hoja.copyTo(privado)
  copia.setName(nombreLibre(privado, nombre))
  SpreadsheetApp.getActiveSpreadsheet().deleteSheet(hoja)
}

/** Pasa al archivo privado las filas de una pestaña técnica de la hoja compartida. */
function moverFilasAlPrivado(nombre, columnas) {
  var compartida = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre)
  if (!compartida) return 0

  var destino = obtenerHoja(nombre, columnas)
  var filas = leerFilas(compartida, columnas)
  filas.forEach(function (fila) {
    destino.appendRow(filaDesdeObjeto(fila, columnas))
  })
  SpreadsheetApp.getActiveSpreadsheet().deleteSheet(compartida)
  return filas.length
}

/**
 * Convierte una pestaña por tipo en vista automática de Respuestas: títulos
 * en la fila 1 y una fórmula FILTER en A2. Nadie escribe en ella.
 */
function prepararVista(tipo) {
  var libro = SpreadsheetApp.getActiveSpreadsheet()
  var nombre = HOJA_POR_TIPO[tipo]
  var hoja = libro.getSheetByName(nombre) || libro.insertSheet(nombre)

  hoja.clear()
  hoja.showColumns(1, hoja.getMaxColumns())
  var titulos = COLUMNAS_RESPUESTAS.map(titulo)
  hoja.getRange(1, 1, 1, titulos.length).setValues([titulos]).setFontWeight('bold')
  hoja.setFrozenRows(1)
  prepararColumnas(hoja, COLUMNAS_RESPUESTAS, 1)
  hoja
    .getRange(1, 1)
    .setNote(
      'Esta pestaña se llena sola con las cuentas de tipo "' + tipo + '" de la pestaña Respuestas. ' +
        'No escribas acá: los cambios se hacen en Respuestas.',
    )
  hoja
    .getRange(2, 1)
    .setFormula('=IFERROR(FILTER(' + HOJA_RESPUESTAS + '!A2:K, ' + HOJA_RESPUESTAS + '!D2:D="' + tipo + '"), "")')
}

/** ¿La pestaña por tipo ya es una vista (y no tiene datos propios)? */
function esVista(hoja) {
  return String(hoja.getRange(1, 1).getValue()) === titulo('marcaTemporal')
}

/**
 * Pasa la hoja del formato anterior al nuevo. Ejecutar UNA vez desde el
 * editor (menú de funciones → actualizarHojas → Ejecutar).
 *
 *   - Hora de Bolivia para toda la hoja.
 *   - Todas las cuentas pasan a "Respuestas" (los 7 títulos de la guía, de A
 *     a G). Empresas, Recolectores y Ambos quedan como vistas automáticas.
 *   - Contraseñas, sesiones, guardados, códigos de recuperación y respaldos se
 *     mudan a un archivo privado que no se comparte. Nadie pierde su
 *     contraseña y nada se borra: los respaldos quedan en el archivo privado.
 *   - Publicaciones y Consultas en su formato nuevo.
 *
 * Se puede ejecutar más de una vez: lo que ya está convertido no se duplica.
 */
function actualizarHojas() {
  var libro = SpreadsheetApp.getActiveSpreadsheet()

  // La versión del 16/10 usaba otras columnas y no guardaba las contraseñas
  // en la hoja: convertirla perdería cuentas.
  var empresas = libro.getSheetByName('Empresas')
  if (empresas && String(empresas.getRange(1, 9).getValue()) === 'ID') {
    throw new Error(
      'La hoja tiene el formato de la versión del 16/10. Primero restaurá la versión anterior ' +
        '(Archivo → Historial de versiones) y después volvé a ejecutar actualizarHojas.',
    )
  }

  libro.setSpreadsheetTimeZone(ZONA_HORARIA)
  var privado = libroPrivado()
  var resumen = []

  var ids = {}
  var correos = {}
  leerCuentas().forEach(function (cuenta) {
    ids[cuenta.id] = true
    correos[cuenta.correo] = true
  })

  /** Pasa una cuenta vieja a Respuestas y su contraseña al archivo privado. */
  var pasarCuenta = function (cuenta, hashClave, sal) {
    var correo = String(cuenta.correo).toLowerCase()
    if (ids[String(cuenta.id)] || correos[correo] || /^PRUEBA CLAUDE/i.test(String(cuenta.empresa))) return false
    cuenta.correo = correo
    cuenta.tipo = HOJA_POR_TIPO[cuenta.tipo] ? cuenta.tipo : 'oferente'
    agregarCuenta(cuenta)
    if (hashClave && !credencialDe(cuenta.id)) guardarCredencial(cuenta.id, String(hashClave), String(sal))
    ids[String(cuenta.id)] = true
    correos[correo] = true
    return true
  }

  // 1. Cuentas de la versión del 11/10 (una sola pestaña "Usuarios").
  var usuarios = libro.getSheetByName('Usuarios')
  if (usuarios) {
    var movidas = 0
    leerFilas(usuarios, ANTERIOR_USUARIOS).forEach(function (fila) {
      var cuenta = {
        id: String(fila.id),
        empresa: fila.empresa,
        contacto: fila.contacto,
        telefono: normalizarTelefono(fila.telefono),
        correo: fila.correo,
        tipo: String(fila.tipo),
        creadoEn: formatearMarcaTemporal(fila.creadoEn),
        zonaInteres: fila.zonaInteres,
        correoConfirmacion: 'Registro anterior (sin correo)',
      }
      if (pasarCuenta(cuenta, fila.hashClave, fila.sal)) movidas++
    })
    moverAlPrivado(usuarios, 'Usuarios (respaldo)')
    resumen.push('Cuentas pasadas a Respuestas desde "Usuarios": ' + movidas)
  }

  // 2. Cuentas de la versión del 17/10 (una pestaña por tipo, con contraseñas).
  Object.keys(HOJA_POR_TIPO).forEach(function (tipo) {
    var hoja = libro.getSheetByName(HOJA_POR_TIPO[tipo])
    if (!hoja || esVista(hoja) || hoja.getLastRow() < 1) return

    var pasadas = 0
    leerFilas(hoja, CUENTAS_17_OCTUBRE).forEach(function (fila) {
      var cuenta = {
        id: String(fila.id),
        empresa: fila.empresa,
        contacto: fila.contacto,
        telefono: normalizarTelefono(fila.telefono),
        correo: fila.correo,
        tipo: String(fila.tipo || tipo),
        fecha: esFecha(fila.fecha) ? fila.fecha : '',
        creadoEn: formatearMarcaTemporal(fila.creadoEn),
        zonaInteres: fila.zonaInteres,
        correoConfirmacion: fila.correoConfirmacion,
      }
      if (pasarCuenta(cuenta, fila.hashClave, fila.sal)) pasadas++
    })

    // La pestaña vieja (con hash y sal) queda como respaldo en el archivo privado.
    var copia = hoja.copyTo(privado)
    copia.setName(nombreLibre(privado, HOJA_POR_TIPO[tipo] + ' (respaldo)'))
    resumen.push('Cuentas pasadas a Respuestas desde "' + HOJA_POR_TIPO[tipo] + '": ' + pasadas)
  })

  // 3. Publicaciones del formato anterior (la columna A se llamaba "id").
  var publicaciones = libro.getSheetByName(HOJA_PUBLICACIONES)
  if (publicaciones && String(publicaciones.getRange(1, 1).getValue()) === 'id') {
    var filasPublicaciones = leerFilas(publicaciones, ANTERIOR_PUBLICACIONES)
    moverAlPrivado(publicaciones, 'Publicaciones (respaldo)')
    var nuevas = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)

    filasPublicaciones.forEach(function (fila) {
      var creada = fechaDesde(fila.creadaEn)
      fila.fecha = creada
      fila.hora = creada
      fila.creadaEn = formatearMarcaTemporal(fila.creadaEn)
      fila.telefono = normalizarTelefono(fila.telefono)
      fila.fechaDisponible = formatearFecha(fila.fechaDisponible)
      nuevas.appendRow(filaDesdeObjeto(fila, COLUMNAS_PUBLICACIONES))
    })
    resumen.push('Publicaciones con fecha y hora: ' + filasPublicaciones.length)
  }

  // 4. Consultas: antes la pestaña se llamaba "Contactos" (formato del 11/10 o del 16/10).
  var contactos = libro.getSheetByName(HOJA_CONTACTOS)
  if (contactos) {
    var delOnce = String(contactos.getRange(1, 1).getValue()) === 'publicacionId'
    var filasContactos = leerFilas(contactos, delOnce ? ANTERIOR_CONTACTOS : CONTACTOS_16_OCTUBRE)
    moverAlPrivado(contactos, 'Contactos (respaldo)')

    var consultas = obtenerHoja(HOJA_CONSULTAS, COLUMNAS_CONSULTAS)
    var vistas = {}
    leerFilas(consultas, COLUMNAS_CONSULTAS).forEach(function (fila) {
      vistas[claveConsulta(fila.publicacionId, fila.usuarioId, fila.fecha)] = true
    })

    var publicacionesPorId = {}
    leerFilas(obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES), COLUMNAS_PUBLICACIONES).forEach(
      function (publicacion) {
        publicacionesPorId[String(publicacion.id)] = publicacion
      },
    )
    var cuentasPorId = {}
    leerCuentas().forEach(function (cuenta) {
      cuentasPorId[String(cuenta.id)] = cuenta
    })

    var convertidas = 0
    filasContactos.forEach(function (fila) {
      var clave = claveConsulta(fila.publicacionId, fila.usuarioId, fila.fecha)
      if (vistas[clave]) return
      vistas[clave] = true

      var fecha = fechaDesde(fila.fecha)
      var publicacion = publicacionesPorId[String(fila.publicacionId)]
      var cuenta = cuentasPorId[String(fila.usuarioId)]
      var conCuenta = String(fila.usuarioId || '') !== ''

      consultas.appendRow(
        filaDesdeObjeto(
          {
            fecha: fecha,
            hora: fecha,
            publicacion: publicacion ? String(publicacion.titulo) : String(fila.titulo || '(publicación eliminada)'),
            publicadoPor: publicacion ? String(publicacion.empresa) : '',
            consultadoPor: conCuenta ? String(fila.empresa) : VISITANTE,
            persona: conCuenta ? String(fila.contacto) : '',
            telefonoConsulta: cuenta ? normalizarTelefono(cuenta.telefono) : '',
            correoConsulta: cuenta ? String(cuenta.correo) : '',
            tipoConsulta: conCuenta ? String(fila.tipo) : '',
            medio: 'No registrado',
            publicacionId: String(fila.publicacionId),
            usuarioId: conCuenta ? String(fila.usuarioId) : '',
          },
          COLUMNAS_CONSULTAS,
        ),
      )
      convertidas++
    })
    resumen.push('Consultas (antes "Contactos"): ' + convertidas)
  }

  // 5. Títulos que cambiaron de nombre (por ejemplo "Contactos recibidos").
  var hojaPublicacionesActual = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  Object.keys(TITULOS_ANTERIORES).forEach(function (columna) {
    var numero = COLUMNAS_PUBLICACIONES.indexOf(columna) + 1
    if (numero < 1) return
    var celda = hojaPublicacionesActual.getRange(1, numero)
    if (String(celda.getValue()) === TITULOS_ANTERIORES[columna]) celda.setValue(titulo(columna))
  })

  // 6. Sesiones, guardados y códigos de recuperación: al archivo privado.
  var sesiones = moverFilasAlPrivado(HOJA_SESIONES, COLUMNAS_SESIONES)
  var guardados = moverFilasAlPrivado(HOJA_GUARDADOS, COLUMNAS_GUARDADOS)
  var recuperaciones = moverFilasAlPrivado(HOJA_RECUPERACIONES, COLUMNAS_RECUPERACIONES)
  if (sesiones + guardados + recuperaciones > 0) {
    resumen.push(
      'Pasadas al archivo privado: ' + sesiones + ' sesiones, ' + guardados + ' guardados, ' +
        recuperaciones + ' códigos de recuperación',
    )
  }

  // 7. Respaldos de versiones anteriores (con contraseñas): al archivo privado.
  libro.getSheets().forEach(function (hoja) {
    if (/\(respaldo\)/.test(hoja.getName())) {
      resumen.push('Respaldo pasado al archivo privado: ' + hoja.getName())
      moverAlPrivado(hoja, hoja.getName())
    }
  })

  // 8. Vistas por tipo, pestañas que falten y orden de lectura.
  hojaRespuestas()
  Object.keys(HOJA_POR_TIPO).forEach(prepararVista)
  obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  obtenerHoja(HOJA_CONSULTAS, COLUMNAS_CONSULTAS)
  hojaCredenciales()
  obtenerHoja(HOJA_SESIONES, COLUMNAS_SESIONES)
  obtenerHoja(HOJA_GUARDADOS, COLUMNAS_GUARDADOS)
  obtenerHoja(HOJA_RECUPERACIONES, COLUMNAS_RECUPERACIONES)

  var orden = [HOJA_RESPUESTAS, 'Empresas', 'Recolectores', 'Ambos', HOJA_PUBLICACIONES, HOJA_CONSULTAS]
  orden.forEach(function (nombre, posicion) {
    libro.setActiveSheet(libro.getSheetByName(nombre))
    libro.moveActiveSheet(posicion + 1)
  })
  libro.setActiveSheet(libro.getSheetByName(HOJA_RESPUESTAS))

  // 9. Lo que necesita el script para funcionar.
  resumen.push('Cuentas en Respuestas: ' + leerCuentas().length)
  resumen.push('Archivo privado (NO compartir): ' + privado.getUrl())
  resumen.push('Correos disponibles hoy: ' + MailApp.getRemainingDailyQuota())
  resumen.push(
    PropertiesService.getScriptProperties().getProperty(PROPIEDAD_CLAVE_ADMIN)
      ? 'Clave de administrador: configurada'
      : 'Clave de administrador: FALTA (agregá CLAVE_ADMIN en las propiedades del script)',
  )
  resumen.push(
    'Correos administradores: ' +
      (PropertiesService.getScriptProperties().getProperty(PROPIEDAD_CORREOS_ADMIN) || 'ninguno (CORREOS_ADMIN)'),
  )

  var texto = 'Listo.\n' + resumen.join('\n')
  Logger.log(texto)
  return texto
}

/**
 * Ejecutar desde el editor ANTES de implementar la versión nueva: crea (o
 * abre) el archivo privado para que Google pida el permiso una sola vez.
 */
function prepararArchivoPrivado() {
  var privado = libroPrivado()
  Logger.log('Archivo privado listo (NO compartir): ' + privado.getUrl())
  return privado.getUrl()
}

function cerrarSesion(token) {
  var hoja = obtenerHoja(HOJA_SESIONES, COLUMNAS_SESIONES)
  var sesion = buscar(leerFilas(hoja, COLUMNAS_SESIONES), 'token', token)
  if (sesion) hoja.deleteRow(sesion._fila)
  return respuesta({ ok: true })
}

/** Guarda el perfil y copia los datos de contacto a todas sus publicaciones. */
function actualizarPerfil(usuarioId, datos) {
  var error = validarPerfil(datos)
  if (error) return rechazo('datos_invalidos', error)

  var fila = buscarCuenta('id', usuarioId)
  if (!fila) return rechazo('sesion_invalida', 'La cuenta ya no existe.')

  fila.empresa = texto(datos.empresa, 120)
  fila.contacto = texto(datos.contacto, 120)
  fila.telefono = texto(datos.telefono, 30).replace(/\s+/g, '')
  fila.tipo = datos.tipo
  fila.zonaInteres = texto(datos.zonaInteres, 30)
  // Si cambió de tipo, las vistas Empresas / Recolectores / Ambos se actualizan solas.
  guardarCuenta(fila)

  var hojaPublicaciones = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var actualizadas = 0
  leerFilas(hojaPublicaciones, COLUMNAS_PUBLICACIONES).forEach(function (publicacion) {
    if (String(publicacion.usuarioId) !== usuarioId) return
    publicacion.empresa = fila.empresa
    publicacion.contacto = fila.contacto
    publicacion.telefono = fila.telefono
    escribirFila(hojaPublicaciones, publicacion._fila, publicacion, COLUMNAS_PUBLICACIONES)
    actualizadas++
  })

  return respuesta({ ok: true, usuario: usuarioPublico(fila), publicacionesActualizadas: actualizadas })
}

// ============================================================ publicaciones

/** Fila de Usuarios de la sesión actual, o null si la cuenta ya no existe. */
function buscarUsuario(usuarioId) {
  return buscarCuenta('id', usuarioId)
}

/** Limpia una publicación que llega de la web y fija los campos que decide el servidor. */
function prepararPublicacion(datos, usuario, existente) {
  var publicacion = {}
  COLUMNAS_PUBLICACIONES.forEach(function (columna) {
    publicacion[columna] = texto(datos[columna])
  })

  publicacion.cantidad = Number(datos.cantidad) || 0
  publicacion.valorEstimadoMin = datos.valorEstimadoMin === '' ? '' : Number(datos.valorEstimadoMin) || ''
  publicacion.valorEstimadoMax = datos.valorEstimadoMax === '' ? '' : Number(datos.valorEstimadoMax) || ''
  if (ESTADOS.indexOf(publicacion.estado) === -1) publicacion.estado = 'disponible'

  // Lo que nunca decide la web: de quién es, con qué datos de contacto,
  // cuántos contactos tiene y cuándo se creó.
  publicacion.usuarioId = String(usuario.id)
  publicacion.empresa = String(usuario.empresa)
  publicacion.contacto = String(usuario.contacto)
  publicacion.telefono = normalizarTelefono(usuario.telefono)
  publicacion.origen = 'usuario'
  publicacion.contactos = existente ? Number(existente.contactos) || 0 : 0
  publicacion.creadaEn = existente
    ? formatearMarcaTemporal(existente.creadaEn)
    : publicacion.creadaEn || new Date().toISOString()

  // Fecha y hora legibles: las de creación, que no cambian al editar.
  var creada = existente && esFecha(existente.fecha) ? existente.fecha : new Date(publicacion.creadaEn)
  if (!esFecha(creada)) creada = new Date()
  publicacion.fecha = creada
  publicacion.hora = creada

  return publicacion
}

function crearPublicacion(usuarioId, datos) {
  var hoja = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var existente = buscar(leerFilas(hoja, COLUMNAS_PUBLICACIONES), 'id', datos.id)

  // Evita duplicados si la web reintenta el envío.
  if (existente) {
    if (String(existente.usuarioId) !== usuarioId) return rechazo('no_autorizado', 'Esa publicación es de otra cuenta.')
    return respuesta({ ok: true, duplicada: true })
  }
  if (!texto(datos.id)) return rechazo('datos_invalidos', 'Falta el identificador de la publicación.')

  var usuario = buscarUsuario(usuarioId)
  if (!usuario) return rechazo('sesion_invalida', 'La cuenta ya no existe.')

  hoja.appendRow(filaDesdeObjeto(prepararPublicacion(datos, usuario, null), COLUMNAS_PUBLICACIONES))
  return respuesta({ ok: true })
}

function actualizarPublicacion(usuarioId, datos) {
  var hoja = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var existente = buscar(leerFilas(hoja, COLUMNAS_PUBLICACIONES), 'id', datos.id)

  // Si no existe (por ejemplo, se creó sin conexión), se crea.
  if (!existente) return crearPublicacion(usuarioId, datos)
  if (String(existente.usuarioId) !== usuarioId) {
    return rechazo('no_autorizado', 'Solo el negocio que publicó puede modificar esta publicación.')
  }

  var usuario = buscarUsuario(usuarioId)
  if (!usuario) return rechazo('sesion_invalida', 'La cuenta ya no existe.')

  escribirFila(hoja, existente._fila, prepararPublicacion(datos, usuario, existente), COLUMNAS_PUBLICACIONES)
  return respuesta({ ok: true })
}

function eliminarPublicacion(usuarioId, datos) {
  var hoja = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var existente = buscar(leerFilas(hoja, COLUMNAS_PUBLICACIONES), 'id', datos.id)

  if (!existente) return respuesta({ ok: true })
  if (String(existente.usuarioId) !== usuarioId) {
    return rechazo('no_autorizado', 'Solo el negocio que publicó puede eliminar esta publicación.')
  }

  hoja.deleteRow(existente._fila)
  return respuesta({ ok: true })
}

// ================================================================ consultas

/** Identifica una consulta para no repetirla al convertir hojas viejas. */
function claveConsulta(publicacionId, usuarioId, fecha) {
  return [String(publicacionId), String(usuarioId || ''), fechaDesde(fecha).getTime()].join('|')
}

/**
 * Registra una consulta: alguien tocó WhatsApp o Llamar en una publicación.
 * Con sesión, cada cuenta suma una sola vez por publicación y quien publicó
 * puede ver quién fue. Sin sesión se cuenta igual, como visitante.
 */
function registrarContacto(usuarioId, datos) {
  var hojaPublicaciones = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var publicacion = buscar(leerFilas(hojaPublicaciones, COLUMNAS_PUBLICACIONES), 'id', datos.id)
  if (!publicacion) return respuesta({ ok: true, nuevo: false })

  var hoja = obtenerHoja(HOJA_CONSULTAS, COLUMNAS_CONSULTAS)
  var ahora = new Date()
  var consulta = {
    fecha: ahora,
    hora: ahora,
    publicacion: String(publicacion.titulo),
    publicadoPor: String(publicacion.empresa),
    consultadoPor: VISITANTE,
    medio: MEDIOS[datos.medio] || 'No registrado',
    publicacionId: String(publicacion.id),
  }

  if (usuarioId) {
    if (String(publicacion.usuarioId) === usuarioId) return respuesta({ ok: true, nuevo: false })

    var repetido = leerFilas(hoja, COLUMNAS_CONSULTAS).some(function (fila) {
      return String(fila.publicacionId) === consulta.publicacionId && String(fila.usuarioId) === usuarioId
    })
    if (repetido) return respuesta({ ok: true, nuevo: false })

    var usuario = buscarUsuario(usuarioId)
    consulta.usuarioId = usuarioId
    if (usuario) {
      consulta.consultadoPor = String(usuario.empresa)
      consulta.persona = String(usuario.contacto)
      consulta.telefonoConsulta = normalizarTelefono(usuario.telefono)
      consulta.correoConsulta = String(usuario.correo)
      consulta.tipoConsulta = String(usuario.tipo)
    }
  }

  hoja.appendRow(filaDesdeObjeto(consulta, COLUMNAS_CONSULTAS))

  var columna = COLUMNAS_PUBLICACIONES.indexOf('contactos') + 1
  hojaPublicaciones
    .getRange(publicacion._fila, columna)
    .setValue((Number(publicacion.contactos) || 0) + 1)

  return respuesta({ ok: true, nuevo: true })
}

/** Quién consultó por las publicaciones del usuario (solo cuentas, no visitantes). */
function contactosRecibidos(usuarioId) {
  var propias = {}
  leerFilas(obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES), COLUMNAS_PUBLICACIONES).forEach(
    function (publicacion) {
      if (String(publicacion.usuarioId) === usuarioId) propias[String(publicacion.id)] = true
    },
  )

  var contactos = leerFilas(obtenerHoja(HOJA_CONSULTAS, COLUMNAS_CONSULTAS), COLUMNAS_CONSULTAS)
    .filter(function (fila) {
      return propias[String(fila.publicacionId)] && String(fila.usuarioId) !== ''
    })
    .map(function (fila) {
      return {
        publicacionId: String(fila.publicacionId),
        fecha: formatearMarcaTemporal(fila.fecha),
        empresa: String(fila.consultadoPor),
        contacto: String(fila.persona),
        tipo: String(fila.tipoConsulta),
        medio: String(fila.medio),
      }
    })
    .reverse()

  return respuesta({ ok: true, contactos: contactos })
}

// ================================================================ guardados

function alternarGuardado(usuarioId, datos) {
  var hoja = obtenerHoja(HOJA_GUARDADOS, COLUMNAS_GUARDADOS)
  var publicacionId = texto(datos.publicacionId, 60)
  if (!publicacionId) return rechazo('datos_invalidos', 'Falta la publicación.')

  var existente = null
  leerFilas(hoja, COLUMNAS_GUARDADOS).forEach(function (fila) {
    if (String(fila.usuarioId) === usuarioId && String(fila.publicacionId) === publicacionId) existente = fila
  })

  if (datos.guardar && !existente) {
    hoja.appendRow(filaDesdeObjeto({ usuarioId: usuarioId, publicacionId: publicacionId, fecha: new Date().toISOString() }, COLUMNAS_GUARDADOS))
  }
  if (!datos.guardar && existente) hoja.deleteRow(existente._fila)

  return respuesta({ ok: true })
}

/** Guardados y contactos realizados por el usuario, del más reciente al más antiguo. */
function miActividad(usuarioId) {
  var guardados = leerFilas(obtenerHoja(HOJA_GUARDADOS, COLUMNAS_GUARDADOS), COLUMNAS_GUARDADOS)
    .filter(function (fila) {
      return String(fila.usuarioId) === usuarioId
    })
    .map(function (fila) {
      return String(fila.publicacionId)
    })
    .reverse()

  var contactos = leerFilas(obtenerHoja(HOJA_CONSULTAS, COLUMNAS_CONSULTAS), COLUMNAS_CONSULTAS)
    .filter(function (fila) {
      return String(fila.usuarioId) === usuarioId
    })
    .map(function (fila) {
      return { publicacionId: String(fila.publicacionId), fecha: formatearMarcaTemporal(fila.fecha) }
    })
    .reverse()

  return respuesta({ ok: true, guardados: guardados, contactos: contactos })
}

// ================================================================== correos

var NOMBRE_TIPO = {
  oferente: 'Empresa / oferente',
  recolector: 'Recolector / comprador',
  ambos: 'Oferente y recolector',
}

/** "2026-11-10" → "10/11/2026". */
function formatearFechaLegible(valor) {
  var fecha = fechaDeTexto(valor)
  return fecha ? Utilities.formatDate(fecha, ZONA_HORARIA, 'dd/MM/yyyy') : ''
}

function horaDeBolivia(fecha) {
  return Utilities.formatDate(fecha, ZONA_HORARIA, 'dd/MM/yyyy HH:mm')
}

function datoCorreo(etiqueta, valor) {
  return (
    '<tr><td style="padding:4px 16px 4px 0;color:#6d7a74">' + etiqueta +
    '</td><td style="padding:4px 0;font-weight:bold">' + escaparHtml(valor) + '</td></tr>'
  )
}

/** Correo de confirmación del registro. Devuelve false si no se pudo enviar. */
function enviarBienvenida(cuenta) {
  try {
    var pasos =
      cuenta.tipo === 'recolector'
        ? '<li>Explorá los materiales disponibles en Santa Cruz.</li>' +
          '<li>Contactá directamente a los negocios por WhatsApp.</li>'
        : '<li>Publicá tu primer residuo: te calculamos su valor estimado.</li>' +
          '<li>Los recolectores interesados te contactan por WhatsApp.</li>'

    MailApp.sendEmail({
      to: cuenta.correo,
      name: 'EcoConecta SCZ',
      subject: '¡Bienvenido a EcoConecta SCZ, ' + cuenta.contacto + '!',
      body:
        'Hola ' + cuenta.contacto + ',\n\n' +
        'Confirmamos el registro de ' + cuenta.empresa + ' en EcoConecta SCZ como ' +
        NOMBRE_TIPO[cuenta.tipo] + '.\n\n' +
        'Correo: ' + cuenta.correo + '\nTeléfono / WhatsApp: ' + cuenta.telefono + '\n' +
        'Lugar: ' + (cuenta.zonaInteres || '—') + '\nFecha estimada: ' +
        (cuenta.fechaServicio ? formatearFechaLegible(cuenta.fechaServicio) : '—') + '\n' +
        'Mensaje: ' + (cuenta.mensaje || '—') + '\n' +
        'Fecha de registro: ' + horaDeBolivia(cuenta.fecha) + '\n\n' +
        'Ingresá en ' + URL_SITIO + '\n\nEcoConecta SCZ — Santa Cruz de la Sierra',
      htmlBody:
        '<div style="background:#f3f6f4;padding:24px 12px;font-family:Arial,sans-serif;color:#222a26">' +
        '<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">' +
        '<div style="padding:20px 24px;border-bottom:1px solid #e5e9e7">' +
        '<img src="' + URL_SITIO + 'logo-correo.png" alt="EcoConecta SCZ" width="190" style="display:block"></div>' +
        '<div style="padding:24px;font-size:15px;line-height:1.6">' +
        '<h1 style="font-size:21px;margin:0 0 14px;color:#0f4a2d">¡Tu cuenta está lista!</h1>' +
        '<p>Hola ' + escaparHtml(cuenta.contacto) + ',</p>' +
        '<p>Confirmamos el registro de <b>' + escaparHtml(cuenta.empresa) +
        '</b> en EcoConecta SCZ como <b>' + NOMBRE_TIPO[cuenta.tipo] + '</b>.</p>' +
        '<table style="border-collapse:collapse;margin:12px 0;font-size:14px">' +
        datoCorreo('Correo', cuenta.correo) +
        datoCorreo('Teléfono / WhatsApp', cuenta.telefono) +
        datoCorreo('Lugar', cuenta.zonaInteres || '—') +
        datoCorreo(cuenta.tipo === 'recolector' ? 'Fecha estimada de recolección' : 'Fecha estimada de entrega',
          cuenta.fechaServicio ? formatearFechaLegible(cuenta.fechaServicio) : '—') +
        datoCorreo('Mensaje', cuenta.mensaje || '—') +
        datoCorreo('Fecha de registro', horaDeBolivia(cuenta.fecha)) +
        '</table><p><b>Próximos pasos:</b></p><ul>' + pasos + '</ul>' +
        '<p style="margin:24px 0"><a href="' + URL_SITIO + '" style="background:#16613c;color:#fff;' +
        'padding:11px 20px;border-radius:10px;text-decoration:none;display:inline-block">Ir a EcoConecta SCZ</a></p>' +
        '</div><div style="padding:14px 24px;background:#f7f9f8;font-size:12px;color:#6d7a74">' +
        'EcoConecta SCZ · Santa Cruz de la Sierra, Bolivia.<br>Recibís este correo porque se registró esta dirección.' +
        '</div></div></div>',
    })
    return true
  } catch (error) {
    console.error('No se pudo enviar el correo de bienvenida', error)
    return false
  }
}

// ============================================================ administrador

/**
 * Verifica la clave de administrador. Tras varios intentos fallidos se
 * bloquea 15 minutos, para que no se pueda adivinar probando.
 */
function claveAdminValida(clave) {
  var configurada = PropertiesService.getScriptProperties().getProperty(PROPIEDAD_CLAVE_ADMIN)
  if (!configurada) return 'sin_configurar'

  var cache = CacheService.getScriptCache()
  var fallidos = Number(cache.get('admin_fallidos') || 0)
  if (fallidos >= INTENTOS_ADMIN) return 'bloqueado'

  if (String(clave || '') !== configurada) {
    cache.put('admin_fallidos', String(fallidos + 1), 15 * 60)
    return 'incorrecta'
  }

  cache.remove('admin_fallidos')
  return 'ok'
}

/** ¿El correo está en la lista CORREOS_ADMIN? */
function esCorreoAdmin(correo) {
  var buscado = String(correo || '').trim().toLowerCase()
  if (!buscado) return false

  var lista = String(PropertiesService.getScriptProperties().getProperty(PROPIEDAD_CORREOS_ADMIN) || '')
  return lista.split(/[\s,;]+/).some(function (admin) {
    return admin.toLowerCase() === buscado
  })
}

/**
 * Permiso para el panel: la sesión de una cuenta administradora o, como
 * respaldo, la clave CLAVE_ADMIN. Devuelve 'ok' o el motivo del rechazo.
 */
function accesoAdmin(datos, token) {
  var usuarioId = validarSesion(token)
  if (usuarioId) {
    var cuenta = buscarCuenta('id', usuarioId)
    if (cuenta && esCorreoAdmin(cuenta.correo)) return 'ok'
  }

  if (!datos.clave) return usuarioId ? 'no_admin' : 'sin_clave'
  return claveAdminValida(datos.clave)
}

function rechazoAdmin(estado) {
  if (estado === 'no_admin') {
    return rechazo('no_admin', 'Esta cuenta no es de administrador. Ingresá con la clave de administrador.')
  }
  if (estado === 'sin_clave') {
    return rechazo('clave_admin', 'Ingresá la clave de administrador.')
  }
  if (estado === 'sin_configurar') {
    return rechazo('clave_admin', 'Falta configurar la clave de administrador (CLAVE_ADMIN) en el script.')
  }
  if (estado === 'bloqueado') {
    return rechazo('clave_admin', 'Demasiados intentos. Esperá 15 minutos y volvé a probar.')
  }
  return rechazo('clave_admin', 'La clave de administrador no es correcta.')
}

function fechaLegible(valor) {
  return esFecha(valor) ? Utilities.formatDate(valor, ZONA_HORARIA, 'dd/MM/yyyy') : ''
}

function horaLegible(valor) {
  return esFecha(valor) ? Utilities.formatDate(valor, ZONA_HORARIA, 'HH:mm') : ''
}

/** Todo lo que muestra el panel de administrador. */
function datosAdmin(datos, token) {
  var estado = accesoAdmin(datos, token)
  if (estado !== 'ok') return rechazoAdmin(estado)

  var usuarios = leerCuentas().map(function (fila) {
    var usuario = usuarioPublico(fila)
    usuario.tipo = String(fila.tipo)
    usuario.fecha = fechaLegible(fila.fecha)
    usuario.hora = horaLegible(fila.hora)
    usuario.correoConfirmacion = String(fila.correoConfirmacion)
    usuario.lugar = String(fila.zonaInteres)
    usuario.fechaServicio = fila.fechaServicio ? formatearFechaLegible(fila.fechaServicio) : ''
    usuario.mensaje = String(fila.mensaje)
    return usuario
  })

  var publicaciones = leerFilas(obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES), COLUMNAS_PUBLICACIONES).map(
    function (fila) {
      return {
        id: String(fila.id),
        titulo: String(fila.titulo),
        materialId: String(fila.materialId),
        cantidad: Number(fila.cantidad) || 0,
        unidad: String(fila.unidad),
        zona: String(fila.zona),
        empresa: String(fila.empresa),
        contacto: String(fila.contacto),
        telefono: normalizarTelefono(fila.telefono),
        estado: String(fila.estado),
        contactos: Number(fila.contactos) || 0,
        creadaEn: formatearMarcaTemporal(fila.creadaEn),
        fecha: fechaLegible(fila.fecha),
        hora: horaLegible(fila.hora),
      }
    },
  )

  var contactos = leerFilas(obtenerHoja(HOJA_CONSULTAS, COLUMNAS_CONSULTAS), COLUMNAS_CONSULTAS).map(
    function (fila) {
      return {
        fecha: fechaLegible(fila.fecha),
        hora: horaLegible(fila.hora),
        creadoEn: formatearMarcaTemporal(fila.fecha),
        titulo: String(fila.publicacion),
        publicacionId: String(fila.publicacionId),
        publicadoPor: String(fila.publicadoPor),
        consultadoPor: String(fila.consultadoPor),
        persona: String(fila.persona),
        telefono: normalizarTelefono(fila.telefonoConsulta),
        correo: String(fila.correoConsulta),
        tipo: String(fila.tipoConsulta),
        medio: String(fila.medio),
      }
    },
  )

  return respuesta({
    ok: true,
    urlHoja: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    correosRestantesHoy: MailApp.getRemainingDailyQuota(),
    usuarios: usuarios,
    publicaciones: publicaciones,
    contactos: contactos,
  })
}

/** Pausar, activar o eliminar cualquier publicación desde el panel. */
function publicacionAdmin(datos, token) {
  var estado = accesoAdmin(datos, token)
  if (estado !== 'ok') return rechazoAdmin(estado)

  var hoja = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var existente = buscar(leerFilas(hoja, COLUMNAS_PUBLICACIONES), 'id', datos.id)
  if (!existente) return rechazo('no_existe', 'La publicación ya no existe.')

  if (datos.eliminar) {
    hoja.deleteRow(existente._fila)
  } else if (ESTADOS.indexOf(datos.estado) !== -1) {
    hoja.getRange(existente._fila, COLUMNAS_PUBLICACIONES.indexOf('estado') + 1).setValue(datos.estado)
  } else {
    return rechazo('datos_invalidos', 'El estado no es válido.')
  }

  return respuesta({ ok: true })
}

// ================================================================== entrada

/** Acciones que exigen una sesión válida. Reciben el usuarioId y los datos. */
var ACCIONES_CON_SESION = {
  actualizar_perfil: actualizarPerfil,
  crear_publicacion: crearPublicacion,
  actualizar_publicacion: actualizarPublicacion,
  eliminar_publicacion: eliminarPublicacion,
  alternar_guardado: alternarGuardado,
  mi_actividad: miActividad,
  contactos_recibidos: contactosRecibidos,
}

function doPost(e) {
  // Una escritura a la vez: evita que dos pedidos simultáneos pisen filas.
  var candado = LockService.getScriptLock()
  candado.waitLock(20000)

  try {
    var parametros = (e && e.parameter) || {}
    var accion = parametros.accion
    var datos = JSON.parse(parametros.datos || '{}')
    var token = parametros.token || ''

    if (accion === 'registrar_usuario') return registrarUsuario(datos)
    if (accion === 'iniciar_sesion') return iniciarSesion(datos)
    if (accion === 'reclamar_cuenta') return reclamarCuenta(datos)
    if (accion === 'solicitar_recuperacion') return solicitarRecuperacion(datos)
    if (accion === 'restablecer_clave') return restablecerClave(datos)
    if (accion === 'cerrar_sesion') return cerrarSesion(token)
    if (accion === 'registrar_contacto') return registrarContacto(validarSesion(token), datos)
    if (accion === 'datos_contacto') return datosContacto(datos)
    if (accion === 'admin_datos') return datosAdmin(datos, token)
    if (accion === 'admin_publicacion') return publicacionAdmin(datos, token)

    var manejador = ACCIONES_CON_SESION[accion]
    if (!manejador) return rechazo('accion_desconocida', 'Acción no reconocida: ' + accion)

    var usuarioId = validarSesion(token)
    if (!usuarioId) return rechazo('sesion_invalida', 'Tu sesión venció. Volvé a iniciar sesión.')

    return manejador(usuarioId, datos)
  } catch (error) {
    return rechazo('error_interno', String(error))
  } finally {
    candado.releaseLock()
  }
}

// ================================================================== lectura

function doGet(e) {
  try {
    var accion = (e && e.parameter && e.parameter.accion) || 'listar_publicaciones'

    if (accion === 'listar_publicaciones') return listarPublicaciones()
    if (accion === 'estado') return respuesta({ ok: true, version: 6 })

    return rechazo('accion_desconocida', 'Acción no reconocida: ' + accion)
  } catch (error) {
    return rechazo('error_interno', String(error))
  }
}

/**
 * Datos de contacto de UNA publicación disponible: se piden al tocar
 * "Contactar". Así no se puede descargar la lista completa de teléfonos.
 */
function datosContacto(datos) {
  var publicacion = buscar(
    leerFilas(obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES), COLUMNAS_PUBLICACIONES),
    'id',
    datos.id,
  )
  if (!publicacion || String(publicacion.estado) !== 'disponible') {
    return rechazo('no_existe', 'Esta publicación ya no está disponible.')
  }
  return respuesta({
    ok: true,
    telefono: normalizarTelefono(publicacion.telefono),
    contacto: String(publicacion.contacto),
  })
}

function listarPublicaciones() {
  var publicaciones = leerFilas(
    obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES),
    COLUMNAS_PUBLICACIONES,
  ).map(function (publicacion) {
    delete publicacion._fila
    // La web usa creadaEn; fecha y hora son solo para leer la hoja.
    delete publicacion.fecha
    delete publicacion.hora

    // Normaliza los tipos que la hoja devuelve.
    //
    // Google Sheets reinterpreta lo que guarda: "2026-09-20" vuelve como
    // objeto Date y un teléfono como 70000000 vuelve como número, perdiendo
    // los ceros a la izquierda. Sin esta normalización la web recibe datos
    // con el tipo equivocado.
    publicacion.cantidad = Number(publicacion.cantidad) || 0
    publicacion.contactos = Number(publicacion.contactos) || 0
    publicacion.fotoId = null
    publicacion.id = String(publicacion.id)
    publicacion.usuarioId = String(publicacion.usuarioId)
    // El teléfono y la persona de contacto no van en la lista pública: se
    // entregan de a uno, cuando alguien toca "Contactar" (datos_contacto).
    delete publicacion.telefono
    delete publicacion.contacto
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

  var cadena = String(valor)
  // Ya viene en formato ISO: se recorta la parte de la fecha.
  if (/^\d{4}-\d{2}-\d{2}/.test(cadena)) return cadena.slice(0, 10)

  // Último recurso: se intenta interpretar el texto como fecha.
  var interpretada = new Date(cadena)
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

  var cadena = String(valor)
  // Sheets puede devolver 7.0000000E7 para números largos.
  if (typeof valor === 'number') cadena = valor.toFixed(0)

  return cadena
}

/** Ejecutar desde el editor para ver en el registro la URL de la hoja. */
function verEnlaceDeLaHoja() {
  Logger.log(SpreadsheetApp.getActiveSpreadsheet().getUrl())
}

/**
 * Ordena Respuestas por Marca temporal (la más antigua arriba) y aplica
 * los formatos, notas y negrita de los títulos. Ejecutar UNA vez.
 */
function corregirRespuestas() {
  var hoja = hojaRespuestas()
  var ultima = hoja.getLastRow()

  // Formatos de fecha y hora, teléfonos como texto, notas en los títulos.
  prepararColumnas(hoja, COLUMNAS_RESPUESTAS, 1)
  hoja.getRange(1, 1, 1, COLUMNAS_RESPUESTAS.length).setFontWeight('bold')
  hoja.setFrozenRows(1)

  // Orden cronológico: la cuenta más antigua arriba, la más nueva abajo.
  if (ultima > 2) {
    hoja
      .getRange(2, 1, ultima - 1, COLUMNAS_RESPUESTAS.length)
      .sort({ column: 1, ascending: true })
  }

  Logger.log('Respuestas ordenada y con formato: ' + (ultima - 1) + ' cuentas.')
}

// ================================================= empresas de muestra (SCZ)

/**
 * Empresas y publicaciones de muestra de Santa Cruz para que el marketplace
 * se vea con movimiento. Los negocios son inventados: el teléfono es el del
 * proyecto (WhatsApp de soporte) y el correo, un alias del correo del
 * proyecto (+ej01, +ej02…), así se reconocen en la hoja y nadie le escribe
 * a un número ajeno. No tienen contraseña: no se puede ingresar con ellas.
 *
 *   cargarEmpresasDeMuestra()  agrega las que falten (se puede repetir).
 *   marcarComoEjemplo()        sus publicaciones muestran «Publicación de ejemplo».
 *   marcarComoReales()         se muestran como publicaciones comunes.
 */
var CORREO_MUESTRAS = 'toledogutierrezecoconecta+ej'
var TELEFONO_MUESTRAS = '78906939'

var EMPRESAS_MUESTRA = [
  { n: '01', empresa: 'Restaurante Sabor Camba', contacto: 'Carla Rojas', tipo: 'oferente', zona: 'DM-2', mensaje: 'Generamos aceite de freidora y descarte de verduras de la cocina todos los días.' },
  { n: '02', empresa: 'Cafetería Grano Oriental', contacto: 'Diego Suárez', tipo: 'oferente', zona: 'DM-1', mensaje: 'Tenemos posos de café de la máquina espresso para compost o abono.' },
  { n: '03', empresa: 'Distribuidora Frutas del Oriente', contacto: 'Rosa Vaca', tipo: 'oferente', zona: 'DM-3', mensaje: 'Fruta y verdura que ya no se vende en nuestro puesto del Mercado Abasto.' },
  { n: '04', empresa: 'Gráfica Tropical', contacto: 'Marco Antelo', tipo: 'ambos', zona: 'DM-2', mensaje: 'Imprenta: generamos cartón y plástico de embalaje; buscamos pallets de madera.' },
  { n: '05', empresa: 'Metalmecánica El Pari', contacto: 'Jorge Justiniano', tipo: 'oferente', zona: 'DM-4', mensaje: 'Recortes de fierro y viruta de torno del taller.' },
  { n: '06', empresa: 'Confecciones Moda Cruceña', contacto: 'Patricia Melgar', tipo: 'oferente', zona: 'DM-7', mensaje: 'Retazos de tela de algodón y jean de la confección.' },
  { n: '07', empresa: 'Distribuidora de Bebidas Norte', contacto: 'Luis Áñez', tipo: 'oferente', zona: 'DM-5', mensaje: 'Pallets, cartón y film plástico que salen del almacén.' },
  { n: '08', empresa: 'Jardines del Piraí', contacto: 'Ramiro Flores', tipo: 'oferente', zona: 'DM-1', mensaje: 'Restos de poda del mantenimiento de jardines de condominios.' },
  { n: '09', empresa: 'Acopio Reciclados Plan 3000', contacto: 'Mirtha Choque', tipo: 'recolector', zona: 'DM-8', mensaje: 'Compramos cartón, plástico y chatarra; retiramos con camioneta.' },
  { n: '10', empresa: 'Biocombustibles del Oriente', contacto: 'Fernando Ribera', tipo: 'recolector', zona: 'DM-6', mensaje: 'Compramos aceite vegetal usado para producir biodiésel.' },
  { n: '11', empresa: 'Compostera Tierra Viva', contacto: 'Ana Cuéllar', tipo: 'recolector', zona: 'DM-6', mensaje: 'Recibimos residuos orgánicos y poda para hacer compost.' },
]

/** v = valor estimado [mínimo, máximo] con la tabla de precios de la web ('' en donaciones). */
var PUBLICACIONES_MUESTRA = [
  { n: '01', titulo: 'Aceite vegetal usado de freidora', categoriaId: 'organicos', materialId: 'aceite-vegetal', cantidad: 60, unidad: 'litros', frecuencia: 'Semanal', zona: 'DM-2', direccion: 'Av. Banzer, entre 2do y 3er anillo', modalidadPrecio: 'referencia', v: [108, 150], descripcion: 'Aceite de freidora filtrado, en bidones de 20 litros con tapa. Retiro los lunes por la mañana.' },
  { n: '01', titulo: 'Descarte de verduras de cocina', categoriaId: 'organicos', materialId: 'descarte-frutas', cantidad: 15, unidad: 'kg', frecuencia: 'Todos los días', zona: 'DM-2', direccion: 'Av. Banzer, entre 2do y 3er anillo', modalidadPrecio: 'donacion', v: ['', ''], descripcion: 'Cáscaras y recortes de verduras, sin carne ni grasa. Ideal para compost o alimento de animales. Retiro antes de las 10:00.' },
  { n: '02', titulo: 'Posos de café de espresso', categoriaId: 'organicos', materialId: 'posos-cafe', cantidad: 25, unidad: 'kg', frecuencia: 'Semanal', zona: 'DM-1', direccion: 'Zona Equipetrol, cerca del 3er anillo', modalidadPrecio: 'donacion', v: ['', ''], descripcion: 'Posos de café secos, en bolsas de 5 kg. Sirven como abono o para compost.' },
  { n: '03', titulo: 'Fruta y verdura de descarte', categoriaId: 'organicos', materialId: 'descarte-frutas', cantidad: 300, unidad: 'kg', frecuencia: 'Semanal', zona: 'DM-3', direccion: 'Mercado Abasto', modalidadPrecio: 'donacion', v: ['', ''], descripcion: 'Fruta y verdura madura que no se vende. Se entrega en cajas los sábados por la tarde.' },
  { n: '04', titulo: 'Cartón de cajas de papel', categoriaId: 'secos', materialId: 'carton-prensado', cantidad: 400, unidad: 'kg', frecuencia: 'Mensual', zona: 'DM-2', direccion: 'Calle Warnes, 2do anillo', modalidadPrecio: 'referencia', v: [320, 560], descripcion: 'Cajas de cartón desarmadas y atadas, secas y limpias. Se carga en nuestra puerta.' },
  { n: '04', titulo: 'Plástico de embalaje', categoriaId: 'secos', materialId: 'retazos-plastico', cantidad: 50, unidad: 'kg', frecuencia: 'Mensual', zona: 'DM-2', direccion: 'Calle Warnes, 2do anillo', modalidadPrecio: 'referencia', v: [60, 100], descripcion: 'Film y bolsas de embalaje de resmas, limpios, en bolsas grandes.' },
  { n: '05', titulo: 'Recortes de fierro y viruta', categoriaId: 'secos', materialId: 'chatarra-metalica', cantidad: 800, unidad: 'kg', frecuencia: 'Según acumulación', zona: 'DM-4', direccion: 'Av. Santos Dumont, 4to anillo', modalidadPrecio: 'referencia', v: [1200, 2240], descripcion: 'Recortes de planchas y perfiles de fierro, y viruta de torno. Se necesita vehículo de carga.' },
  { n: '06', titulo: 'Retazos de algodón y jean', categoriaId: 'secos', materialId: 'retazos-textiles', cantidad: 120, unidad: 'kg', frecuencia: 'Quincenal', zona: 'DM-7', direccion: 'Villa 1ro de Mayo, cerca de la avenida principal', modalidadPrecio: 'referencia', v: [300, 420], descripcion: 'Retazos de tela separados por color, en bolsas. Sirven para relleno, trapos o hilado.' },
  { n: '07', titulo: 'Pallets de madera', categoriaId: 'secos', materialId: 'pallets-madera', cantidad: 40, unidad: 'unidades', frecuencia: 'Mensual', zona: 'DM-5', direccion: 'Av. Banzer, después del 6to anillo', modalidadPrecio: 'referencia', v: [480, 720], descripcion: 'Pallets estándar, algunos con tablas sueltas. Retiro de lunes a viernes en horario de oficina.' },
  { n: '07', titulo: 'Cartón prensado de almacén', categoriaId: 'secos', materialId: 'carton-prensado', cantidad: 600, unidad: 'kg', frecuencia: 'Semanal', zona: 'DM-5', direccion: 'Av. Banzer, después del 6to anillo', modalidadPrecio: 'referencia', v: [480, 840], descripcion: 'Cajas de bebidas prensadas en fardos. Se carga con montacargas.' },
  { n: '07', titulo: 'Film stretch de pallets', categoriaId: 'secos', materialId: 'retazos-plastico', cantidad: 150, unidad: 'kg', frecuencia: 'Quincenal', zona: 'DM-5', direccion: 'Av. Banzer, después del 6to anillo', modalidadPrecio: 'referencia', v: [180, 300], descripcion: 'Film plástico transparente de envolver pallets, limpio y compactado en bolsas.' },
  { n: '08', titulo: 'Restos de poda de condominios', categoriaId: 'organicos', materialId: 'restos-poda', cantidad: 2, unidad: 'm3', frecuencia: 'Quincenal', zona: 'DM-1', direccion: 'Zona oeste, cerca del 4to anillo', modalidadPrecio: 'donacion', v: ['', ''], descripcion: 'Ramas, hojas y césped cortado, sin basura. Ideal para compost o chipeado.' },
]

function correoMuestra(n) {
  return CORREO_MUESTRAS + n + '@gmail.com'
}

/** Fecha "yyyy-MM-dd" dentro de `dias` días, en hora de Bolivia. */
function fechaDentroDe(dias) {
  return Utilities.formatDate(new Date(Date.now() + dias * 86400000), ZONA_HORARIA, 'yyyy-MM-dd')
}

/** Agrega a Respuestas y Publicaciones las empresas y publicaciones de muestra que falten. */
function cargarEmpresasDeMuestra() {
  var cuentasNuevas = 0
  var cuentas = {}

  EMPRESAS_MUESTRA.forEach(function (e) {
    var correo = correoMuestra(e.n)
    var existente = buscarCuenta('correo', correo)
    if (existente) {
      cuentas[e.n] = existente
      return
    }
    var ahora = new Date()
    var cuenta = {
      fecha: ahora,
      id: generarId('usr'),
      empresa: e.empresa,
      contacto: e.contacto,
      telefono: TELEFONO_MUESTRAS,
      correo: correo,
      tipo: e.tipo,
      creadoEn: ahora.toISOString(),
      zonaInteres: e.zona,
      fechaServicio: fechaDentroDe(7),
      mensaje: e.mensaje,
      correoConfirmacion: 'No se envía (carga de muestra)',
    }
    agregarCuenta(cuenta)
    cuentas[e.n] = cuenta
    cuentasNuevas++
  })

  var hoja = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var existentes = leerFilas(hoja, COLUMNAS_PUBLICACIONES)
  var publicacionesNuevas = 0

  PUBLICACIONES_MUESTRA.forEach(function (p) {
    var cuenta = cuentas[p.n]
    var repetida = existentes.some(function (fila) {
      return String(fila.usuarioId) === String(cuenta.id) && String(fila.titulo) === p.titulo
    })
    if (repetida) return

    var datos = {
      id: generarId('pub'),
      titulo: p.titulo,
      categoriaId: p.categoriaId,
      materialId: p.materialId,
      descripcion: p.descripcion,
      cantidad: p.cantidad,
      unidad: p.unidad,
      frecuencia: p.frecuencia,
      zona: p.zona,
      direccion: p.direccion,
      modalidadPrecio: p.modalidadPrecio,
      valorEstimadoMin: p.v[0],
      valorEstimadoMax: p.v[1],
      fechaDisponible: fechaDentroDe(0),
      estado: 'disponible',
      creadaEn: new Date().toISOString(),
    }
    hoja.appendRow(filaDesdeObjeto(prepararPublicacion(datos, cuenta, null), COLUMNAS_PUBLICACIONES))
    publicacionesNuevas++
  })

  var resumen =
    'Empresas de muestra agregadas: ' + cuentasNuevas + ' (de ' + EMPRESAS_MUESTRA.length + '). ' +
    'Publicaciones agregadas: ' + publicacionesNuevas + ' (de ' + PUBLICACIONES_MUESTRA.length + ').'
  Logger.log(resumen)
  return resumen
}

/** Cambia el Origen de las publicaciones de las empresas de muestra ('demo' o 'usuario'). */
function cambiarOrigenMuestras(origen) {
  var idsMuestra = {}
  leerCuentas().forEach(function (cuenta) {
    if (String(cuenta.correo).indexOf(CORREO_MUESTRAS) === 0) idsMuestra[String(cuenta.id)] = true
  })

  var hoja = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var cambiadas = 0
  leerFilas(hoja, COLUMNAS_PUBLICACIONES).forEach(function (publicacion) {
    if (!idsMuestra[String(publicacion.usuarioId)] || publicacion.origen === origen) return
    publicacion.origen = origen
    escribirFila(hoja, publicacion._fila, publicacion, COLUMNAS_PUBLICACIONES)
    cambiadas++
  })

  var resumen = 'Publicaciones de muestra con Origen "' + origen + '": ' + cambiadas + ' cambiadas.'
  Logger.log(resumen)
  return resumen
}

/** Las publicaciones de muestra se ven con la etiqueta «Publicación de ejemplo» y sin «Contactar». */
function marcarComoEjemplo() {
  return cambiarOrigenMuestras('demo')
}

/** Las publicaciones de muestra se ven como publicaciones comunes. */
function marcarComoReales() {
  return cambiarOrigenMuestras('usuario')
}
