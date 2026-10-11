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
 *
 * Hojas que usa (se crean solas, y si les faltan columnas se agregan al final):
 *
 *   Usuarios, Publicaciones, Contactos, Sesiones, Guardados
 *
 * INSTALACIÓN: ver README.md, sección "Publicar cambios". Este archivo se sube
 * con clasp (npm run sheets:publicar); no hace falta copiarlo a mano.
 */

var HOJA_USUARIOS = 'Usuarios'
var HOJA_PUBLICACIONES = 'Publicaciones'
var HOJA_CONTACTOS = 'Contactos'
var HOJA_SESIONES = 'Sesiones'
var HOJA_GUARDADOS = 'Guardados'

var COLUMNAS_USUARIOS = [
  'id',
  'empresa',
  'contacto',
  'telefono',
  'correo',
  'tipo',
  'creadoEn',
  'zonaInteres',
  'hashClave',
  'sal',
]

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

/** usuarioId vacío = contacto de un visitante sin cuenta. */
var COLUMNAS_CONTACTOS = ['publicacionId', 'fecha', 'usuarioId', 'empresa', 'contacto', 'tipo']

/** expiraEn en milisegundos: un número evita que Sheets lo convierta en fecha. */
var COLUMNAS_SESIONES = ['token', 'usuarioId', 'creadaEn', 'expiraEn']

var COLUMNAS_GUARDADOS = ['usuarioId', 'publicacionId', 'fecha']

var DIAS_SESION = 60
var ITERACIONES_HASH = 1000
var LARGO_MAXIMO = 2000
var TIPOS_USUARIO = ['oferente', 'recolector', 'ambos']
var ESTADOS = ['disponible', 'pausada', 'concretada']

// ================================================================= utilidades

/** Devuelve la hoja; si no existe la crea, y si le faltan columnas las agrega al final. */
function obtenerHoja(nombre, columnas) {
  var libro = SpreadsheetApp.getActiveSpreadsheet()
  var hoja = libro.getSheetByName(nombre)

  if (!hoja) {
    hoja = libro.insertSheet(nombre)
    hoja.appendRow(columnas)
    hoja.getRange(1, 1, 1, columnas.length).setFontWeight('bold')
    hoja.setFrozenRows(1)
    return hoja
  }

  var ancho = Math.max(hoja.getLastColumn(), 1)
  var encabezado = hoja.getRange(1, 1, 1, ancho).getValues()[0].map(String)
  var faltantes = columnas.filter(function (columna) {
    return encabezado.indexOf(columna) === -1
  })

  if (faltantes.length > 0) {
    var desde = encabezado.filter(String).length + 1
    hoja.getRange(1, desde, 1, faltantes.length).setValues([faltantes])
    hoja.getRange(1, desde, 1, faltantes.length).setFontWeight('bold')
  }

  return hoja
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

function usuarioPublico(fila) {
  var usuario = {}
  CAMPOS_PUBLICOS_USUARIO.forEach(function (campo) {
    usuario[campo] = fila[campo] === undefined ? '' : fila[campo]
  })
  usuario.telefono = normalizarTelefono(usuario.telefono)
  usuario.creadoEn = formatearMarcaTemporal(usuario.creadoEn)
  usuario.correo = String(usuario.correo)
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

  hoja.appendRow([token, usuarioId, new Date(ahora).toISOString(), ahora + DIAS_SESION * 86400000])
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

  if (!correoValido(correo)) return rechazo('datos_invalidos', 'El correo no es válido.')
  if (clave.length < 6) return rechazo('datos_invalidos', 'La contraseña debe tener al menos 6 caracteres.')
  var error = validarPerfil(datos)
  if (error) return rechazo('datos_invalidos', error)

  var hoja = obtenerHoja(HOJA_USUARIOS, COLUMNAS_USUARIOS)
  if (buscar(leerFilas(hoja, COLUMNAS_USUARIOS), 'correo', correo)) {
    return rechazo('correo_existente', 'Ya existe una cuenta registrada con ese correo electrónico.')
  }

  var sal = Utilities.getUuid()
  var fila = {
    id: generarId('usr'),
    empresa: texto(datos.empresa, 120),
    contacto: texto(datos.contacto, 120),
    telefono: texto(datos.telefono, 30).replace(/\s+/g, ''),
    correo: correo,
    tipo: datos.tipo,
    creadoEn: new Date().toISOString(),
    zonaInteres: '',
    hashClave: calcularHash(clave, sal),
    sal: sal,
  }

  hoja.appendRow(filaDesdeObjeto(fila, COLUMNAS_USUARIOS))
  return entregarSesion(fila)
}

function iniciarSesion(datos) {
  var correo = texto(datos.correo, 200).toLowerCase()
  var fila = buscar(leerFilas(obtenerHoja(HOJA_USUARIOS, COLUMNAS_USUARIOS), COLUMNAS_USUARIOS), 'correo', correo)

  if (!fila) return rechazo('no_existe', 'No encontramos una cuenta con ese correo.')
  // Cuenta creada antes de que existieran las contraseñas en la hoja: la web
  // intenta recuperarla con los datos que guardó el navegador.
  if (!fila.hashClave) return rechazo('cuenta_sin_clave', 'Esta cuenta todavía no tiene contraseña en la hoja.')
  if (calcularHash(String(datos.clave || ''), String(fila.sal)) !== String(fila.hashClave)) {
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

  var hoja = obtenerHoja(HOJA_USUARIOS, COLUMNAS_USUARIOS)
  var filas = leerFilas(hoja, COLUMNAS_USUARIOS)
  var existente = buscar(filas, 'correo', correo)
  var sal = Utilities.getUuid()

  if (existente) {
    if (existente.hashClave) return rechazo('correo_existente', 'Esta cuenta ya tiene contraseña. Iniciá sesión normalmente.')
    if (String(existente.id) !== id) return rechazo('no_autorizado', 'No se pudo recuperar la cuenta.')

    existente.hashClave = calcularHash(clave, sal)
    existente.sal = sal
    escribirFila(hoja, existente._fila, existente, COLUMNAS_USUARIOS)
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

  var fila = {
    id: id,
    empresa: texto(perfil.empresa, 120),
    contacto: texto(perfil.contacto, 120),
    telefono: texto(perfil.telefono, 30).replace(/\s+/g, ''),
    correo: correo,
    tipo: perfil.tipo,
    creadoEn: texto(usuario.creadoEn, 40) || new Date().toISOString(),
    zonaInteres: texto(usuario.zonaInteres, 20),
    hashClave: calcularHash(clave, sal),
    sal: sal,
  }

  hoja.appendRow(filaDesdeObjeto(fila, COLUMNAS_USUARIOS))
  return entregarSesion(fila)
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

  var hoja = obtenerHoja(HOJA_USUARIOS, COLUMNAS_USUARIOS)
  var fila = buscar(leerFilas(hoja, COLUMNAS_USUARIOS), 'id', usuarioId)
  if (!fila) return rechazo('sesion_invalida', 'La cuenta ya no existe.')

  fila.empresa = texto(datos.empresa, 120)
  fila.contacto = texto(datos.contacto, 120)
  fila.telefono = texto(datos.telefono, 30).replace(/\s+/g, '')
  fila.tipo = datos.tipo
  fila.zonaInteres = texto(datos.zonaInteres, 20)
  escribirFila(hoja, fila._fila, fila, COLUMNAS_USUARIOS)

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
  return buscar(leerFilas(obtenerHoja(HOJA_USUARIOS, COLUMNAS_USUARIOS), COLUMNAS_USUARIOS), 'id', usuarioId)
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

// ================================================================ contactos

/**
 * Registra una consulta. Con sesión, cada cuenta suma una sola vez por
 * publicación y el oferente puede ver quién fue. Sin sesión se cuenta igual.
 */
function registrarContacto(usuarioId, datos) {
  var hojaPublicaciones = obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES)
  var publicacion = buscar(leerFilas(hojaPublicaciones, COLUMNAS_PUBLICACIONES), 'id', datos.id)
  if (!publicacion) return respuesta({ ok: true, nuevo: false })

  var hojaContactos = obtenerHoja(HOJA_CONTACTOS, COLUMNAS_CONTACTOS)
  var contacto = { publicacionId: String(publicacion.id), fecha: new Date().toISOString() }

  if (usuarioId) {
    if (String(publicacion.usuarioId) === usuarioId) return respuesta({ ok: true, nuevo: false })

    var repetido = leerFilas(hojaContactos, COLUMNAS_CONTACTOS).some(function (fila) {
      return String(fila.publicacionId) === contacto.publicacionId && String(fila.usuarioId) === usuarioId
    })
    if (repetido) return respuesta({ ok: true, nuevo: false })

    var usuario = buscarUsuario(usuarioId)
    contacto.usuarioId = usuarioId
    contacto.empresa = usuario ? usuario.empresa : ''
    contacto.contacto = usuario ? usuario.contacto : ''
    contacto.tipo = usuario ? usuario.tipo : ''
  }

  hojaContactos.appendRow(filaDesdeObjeto(contacto, COLUMNAS_CONTACTOS))

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

  var contactos = leerFilas(obtenerHoja(HOJA_CONTACTOS, COLUMNAS_CONTACTOS), COLUMNAS_CONTACTOS)
    .filter(function (fila) {
      return propias[String(fila.publicacionId)] && String(fila.usuarioId) !== ''
    })
    .map(function (fila) {
      return {
        publicacionId: String(fila.publicacionId),
        fecha: formatearMarcaTemporal(fila.fecha),
        empresa: String(fila.empresa),
        contacto: String(fila.contacto),
        tipo: String(fila.tipo),
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

  var contactos = leerFilas(obtenerHoja(HOJA_CONTACTOS, COLUMNAS_CONTACTOS), COLUMNAS_CONTACTOS)
    .filter(function (fila) {
      return String(fila.usuarioId) === usuarioId
    })
    .map(function (fila) {
      return { publicacionId: String(fila.publicacionId), fecha: formatearMarcaTemporal(fila.fecha) }
    })
    .reverse()

  return respuesta({ ok: true, guardados: guardados, contactos: contactos })
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
    if (accion === 'cerrar_sesion') return cerrarSesion(token)
    if (accion === 'registrar_contacto') return registrarContacto(validarSesion(token), datos)

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

    return rechazo('accion_desconocida', 'Acción no reconocida: ' + accion)
  } catch (error) {
    return rechazo('error_interno', String(error))
  }
}

function listarPublicaciones() {
  var publicaciones = leerFilas(
    obtenerHoja(HOJA_PUBLICACIONES, COLUMNAS_PUBLICACIONES),
    COLUMNAS_PUBLICACIONES,
  ).map(function (publicacion) {
    delete publicacion._fila

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
