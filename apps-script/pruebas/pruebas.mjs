// Pruebas del Apps Script: ejecutan el Codigo.gs real sobre una hoja simulada.
// Uso: npm run sheets:probar   (sheets:subir y sheets:publicar las corren antes de subir)
import assert from 'node:assert/strict'
import { CLAVE_IMPRENTA, libroComoElReal } from './escenario.mjs'
import { cargarScript } from './simulador.mjs'

const CODIGO = process.argv[2]
if (!CODIGO) {
  console.error('Uso: node apps-script/pruebas/pruebas.mjs apps-script/Codigo.gs')
  process.exit(1)
}

/** Lugar, Fecha y Mensaje: los tres campos que se agregaron al registro. */
const EXTRA = { zona: 'DM-3', fecha: '2026-11-15', mensaje: 'Generamos cartón y plástico todas las semanas' }

const pub = (id, extra = {}) => ({ id, titulo: 'Cartón ' + id, categoriaId: 'secos', materialId: 'carton-prensado', descripcion: 'Cartón de prueba', cantidad: 100, unidad: 'kg', frecuencia: 'Semanal', zona: 'DM-3', direccion: 'Prueba', modalidadPrecio: 'referencia', valorEstimadoMin: 80, valorEstimadoMax: 140, fechaDisponible: '2026-10-12', estado: 'disponible', contactos: 0, creadaEn: '2026-10-11T20:00:00.000Z', origen: 'usuario', ...extra })

let pasadas = 0
function prueba(nombre, fn) {
  try {
    fn()
    pasadas++
    console.log('  ✓ ' + nombre)
  } catch (error) {
    console.log('  ✗ ' + nombre)
    console.log('    ' + error.message.split('\n').join('\n    '))
    process.exitCode = 1
  }
}

if (CODIGO) {
  const s = cargarScript(CODIGO, libroComoElReal())
  const hoja = (n) => s.libro.getSheetByName(n).datos
  const pestana = (n) => s.libro.getSheetByName(n)
  const privada = (n) => s.privado().getSheetByName(n).datos
  const esFecha = (v) => v && typeof v.getTime === 'function'
  /** Una cuenta en Respuestas (la columna K es el ID). */
  const cuentaEnRespuestas = (id) => hoja('Respuestas').find((f) => f[10] === id)
  /** ¿Algún valor de la hoja compartida es un hash o una sal? */
  /** Teléfono guardado en la pestaña Publicaciones (la lista pública ya no lo trae). */
  const telefonoEnHoja = (id) => hoja('Publicaciones').find((f) => f[21] === id)[5]
  const compartidaTiene = (valor) => s.libro.getSheets().some((h) => h.datos.some((f) => f.includes(valor)))
  let tokenAna, tokenLuis, idAna

  console.log('\nActualización de la hoja (actualizarHojas)')
  let resumen
  prueba('se ejecuta sin errores y deja un resumen', () => {
    resumen = s.ejecutar('actualizarHojas')
    assert.match(resumen, /Cuentas pasadas a Respuestas desde "Usuarios": 3/)
    assert.match(resumen, /Publicaciones con fecha y hora: 2/)
    assert.match(resumen, /Consultas \(antes "Contactos"\): 1/)
    assert.match(resumen, /Archivo privado \(NO compartir\): https:\/\/docs\.google\.com/)
    assert.match(resumen, /Clave de administrador: FALTA/)
  })
  prueba('pone la hoja en hora de Bolivia', () => {
    assert.equal(s.libro.zonaHoraria, 'America/La_Paz')
  })
  prueba('"Respuestas" tiene los 7 títulos de la guía de A a G', () => {
    assert.deepEqual([...hoja('Respuestas')[0].slice(0, 7)], ['Marca temporal', 'Nombre', 'Email', 'Tipo', 'Lugar', 'Fecha', 'Mensaje'])
    assert.deepEqual([...hoja('Respuestas')[0].slice(7)], ['Empresa / negocio', 'Teléfono', 'Correo de confirmación', 'ID'])
    assert.match(pestana('Respuestas').notas['1,6'], /Fecha estimada/)
  })
  prueba('todas las cuentas viejas pasan a Respuestas', () => {
    assert.equal(hoja('Respuestas').length, 4)
    const pollos = cuentaEnRespuestas('usr-viejo-1')
    assert.ok(esFecha(pollos[0]))
    assert.deepEqual([...pollos.slice(1, 5)], ['Marcela Prueba', 'pollos@ejemplo.test', 'oferente', ''])
    assert.equal(pollos[8], '70000010', 'el teléfono queda como texto')
    assert.equal(cuentaEnRespuestas('usr-imprenta')[4], 'DM-5', 'la zona pasa a Lugar')
  })
  prueba('Empresas, Recolectores y Ambos son vistas automáticas de Respuestas', () => {
    assert.match(pestana('Empresas').getRange(2, 1).getFormula(), /^=IFERROR\(FILTER\(Respuestas!A2:K, Respuestas!D2:D="oferente"\)/)
    assert.match(pestana('Recolectores').getRange(2, 1).getFormula(), /D2:D="recolector"/)
    assert.match(pestana('Ambos').getRange(2, 1).getFormula(), /D2:D="ambos"/)
    assert.equal(hoja('Empresas')[0][0], 'Marca temporal')
    assert.match(pestana('Empresas').notas['1,1'], /se llena sola/)
  })
  prueba('conserva la contraseña de quien se registró con la versión anterior', () => {
    const r = s.post('iniciar_sesion', { correo: 'imprenta@ejemplo.test', clave: CLAVE_IMPRENTA })
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.equal(r.usuario.id, 'usr-imprenta')
    assert.equal(r.usuario.tipo, 'recolector')
    assert.equal(r.usuario.zonaInteres, 'DM-5')
  })
  prueba('las contraseñas viven solo en el archivo privado', () => {
    const credencial = privada('Credenciales').find((f) => f[0] === 'usr-imprenta')
    assert.ok(credencial && String(credencial[1]).length > 20)
    assert.equal(compartidaTiene(credencial[1]), false, 'el hash no está en la hoja compartida')
    assert.equal(compartidaTiene(credencial[2]), false, 'la sal no está en la hoja compartida')
  })
  prueba('sesiones, guardados y recuperaciones pasan al archivo privado', () => {
    for (const nombre of ['Sesiones', 'Guardados', 'Recuperaciones']) {
      assert.equal(s.libro.getSheetByName(nombre), null, nombre + ' sigue en la hoja compartida')
      assert.ok(s.privado().getSheetByName(nombre), nombre + ' no está en el archivo privado')
    }
  })
  prueba('no borra nada: los respaldos quedan en el archivo privado, no en la hoja compartida', () => {
    for (const nombre of ['Usuarios (respaldo)', 'Publicaciones (respaldo)', 'Contactos (respaldo)']) {
      assert.ok(s.privado().getSheetByName(nombre), nombre)
      assert.equal(s.libro.getSheetByName(nombre), null)
    }
    assert.ok(s.privado().getSheetByName('Usuarios (respaldo)').datos.length === 4)
  })
  prueba('la hoja compartida queda solo con las pestañas que se leen, en orden', () => {
    assert.deepEqual(s.libro.pestanas(), ['Respuestas', 'Empresas', 'Recolectores', 'Ambos', 'Publicaciones', 'Consultas'])
  })
  prueba('las publicaciones ganan fecha y hora sin perder nada', () => {
    assert.equal(hoja('Publicaciones')[0][0], 'Fecha')
    assert.ok(esFecha(hoja('Publicaciones')[1][0]))
  })
  prueba('"Contactos" pasa a "Consultas", con columnas que se explican solas', () => {
    assert.deepEqual([...hoja('Consultas')[0].slice(0, 10)], ['Fecha', 'Hora', 'Material consultado', 'Publicado por', 'Consultado por', 'Persona que consultó', 'Teléfono de quien consultó', 'Correo de quien consultó', 'Tipo de cuenta de quien consultó', 'Medio'])
    assert.match(pestana('Consultas').notas['1,3'], /Cada fila es una consulta/)
    const consulta = hoja('Consultas')[1]
    assert.ok(esFecha(consulta[0]))
    assert.deepEqual([...consulta.slice(2, 10)], ['Aceite pub-viejo-1', 'Pollos Prueba', 'Imprenta Prueba', 'Melisa Prueba', '70000012', 'imprenta@ejemplo.test', 'recolector', 'No registrado'])
  })
  prueba('la columna de Publicaciones se llama "Consultas recibidas"', () => {
    assert.ok(hoja('Publicaciones')[0].includes('Consultas recibidas'))
  })
  prueba('ejecutarla dos veces no duplica nada', () => {
    s.ejecutar('actualizarHojas')
    assert.equal(hoja('Respuestas').length, 4)
    assert.equal(hoja('Publicaciones').length, 3)
    assert.equal(hoja('Consultas').length, 2)
    assert.equal(privada('Credenciales').length, 2)
  })
  prueba('pasa también la hoja del 17/10 (una pestaña por tipo, con contraseñas)', () => {
    const otra = cargarScript(CODIGO)
    const titulos = ['Fecha', 'Hora', 'Empresa / negocio', 'Contacto', 'Teléfono', 'Correo', 'Tipo', 'Correo de confirmación', 'Zona de interés', 'ID', 'Creado (UTC)', 'hashClave', 'sal']
    const empresas = otra.libro.insertSheet('Empresas')
    empresas.appendRow(titulos)
    const registro = new Date('2026-10-16T22:50:27-04:00')
    empresas.appendRow([registro, registro, 'PRUEBA PROFESOR', 'PRUEBA PROFESOR', '70000000', 'profe@ejemplo.test', 'oferente', 'Enviado', '', 'usr-profe', '2026-10-17T02:50:26.880Z', 'hash-del-profe', 'sal-del-profe'])
    otra.libro.insertSheet('Sesiones').appendRow(['token', 'usuarioId', 'creadaEn', 'expiraEn'])
    otra.libro.getSheetByName('Sesiones').appendRow(['token-del-profe', 'usr-profe', '2026-10-17T02:50:27.000Z', Date.now() + 86400000])

    assert.match(otra.ejecutar('actualizarHojas'), /desde "Empresas": 1/)
    const fila = otra.libro.getSheetByName('Respuestas').datos[1]
    assert.equal(fila[0].getTime(), registro.getTime(), 'conserva la marca temporal original')
    assert.deepEqual([...fila.slice(1, 4)], ['PRUEBA PROFESOR', 'profe@ejemplo.test', 'oferente'])
    assert.equal(fila[9], 'Enviado')
    assert.ok(otra.libro.getSheetByName('Empresas').getRange(2, 1).getFormula().includes('FILTER'))
    assert.ok(otra.privado().getSheetByName('Empresas (respaldo)'), 'la pestaña vieja queda de respaldo')
    assert.deepEqual([...otra.privado().getSheetByName('Credenciales').datos[1]], ['usr-profe', 'hash-del-profe', 'sal-del-profe'])
    assert.equal(otra.post('mi_actividad', {}, 'token-del-profe').ok, true, 'su sesión sigue sirviendo')
  })
  prueba('se niega a convertir una hoja con el formato del 16/10', () => {
    const otra = cargarScript(CODIGO)
    const empresas = otra.libro.insertSheet('Empresas')
    empresas.appendRow(['Fecha', 'Hora', 'Empresa / negocio', 'Contacto', 'Teléfono', 'Correo', 'Tipo', 'Correo de confirmación', 'ID'])
    assert.throws(() => otra.ejecutar('actualizarHojas'), /Historial de versiones/)
  })

  console.log('\nLectura')
  prueba('la lista pública no trae teléfonos ni personas de contacto', () => {
    const r = s.get()
    assert.equal(r.ok, true)
    assert.equal(r.publicaciones.length, 2)
    assert.equal(r.publicaciones[0].telefono, undefined)
    assert.equal(r.publicaciones[0].contacto, undefined)
    assert.equal(r.publicaciones[0].empresa, 'Pollos Prueba')
    assert.equal(r.publicaciones[0].fechaDisponible, '2026-09-23')
    assert.equal(r.publicaciones[0].cantidad, 50)
  })
  prueba('el teléfono se entrega de a una publicación, al tocar "Contactar"', () => {
    const r = s.post('datos_contacto', { id: 'pub-viejo-1' })
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.equal(r.telefono, '70000010')
    assert.equal(r.contacto, 'X')
    assert.equal(s.post('datos_contacto', { id: 'no-existe' }).codigo, 'no_existe')
  })

  console.log('\nRegistro e inicio de sesión')
  prueba('registra una cuenta nueva y entrega una llave de sesión', () => {
    const r = s.post('registrar_usuario', { ...EXTRA, empresa: 'Reciclajes Ana', contacto: 'Ana', telefono: '7000 0020', correo: 'Ana@Ejemplo.test', clave: 'secreta1', tipo: 'recolector' })
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.ok(r.token.length >= 60)
    assert.equal(r.usuario.correo, 'ana@ejemplo.test')
    assert.equal(r.usuario.telefono, '70000020')
    assert.equal(r.usuario.hashClave, undefined, 'el hash no debe salir del servidor')
    tokenAna = r.token
    idAna = r.usuario.id
  })
  prueba('queda en Respuestas con cada dato en su columna', () => {
    const fila = cuentaEnRespuestas(idAna)
    assert.ok(fila, 'Ana no está en Respuestas')
    assert.ok(esFecha(fila[0]) && Date.now() - fila[0].getTime() < 60000)
    assert.deepEqual([...fila.slice(1, 5)], ['Ana', 'ana@ejemplo.test', 'recolector', 'DM-3'])
    assert.ok(esFecha(fila[5]))
    assert.deepEqual([...fila.slice(6, 10)], ['Generamos cartón y plástico todas las semanas', 'Reciclajes Ana', '70000020', 'Enviado'])
  })
  prueba('pide Lugar, Fecha y Mensaje', () => {
    const base = { empresa: 'Sin datos', contacto: 'X', telefono: '70000023', correo: 'sin@datos.test', clave: 'secreta1', tipo: 'oferente' }
    assert.match(s.post('registrar_usuario', { ...base, fecha: '2026-11-15', mensaje: 'Algo' }).error, /zona/)
    assert.match(s.post('registrar_usuario', { ...base, zona: 'DM-1', mensaje: 'Algo' }).error, /fecha/)
    assert.match(s.post('registrar_usuario', { ...base, zona: 'DM-1', fecha: '2026-11-15' }).error, /materiales/)
  })
  prueba('el campo trampa (honeypot) frena a los robots sin crear nada', () => {
    const antes = hoja('Respuestas').length
    const r = s.post('registrar_usuario', { ...EXTRA, empresa: 'Robot', contacto: 'Bot', telefono: '70000024', correo: 'bot@spam.test', clave: 'secreta1', tipo: 'oferente', website: 'http://spam.test' })
    assert.equal(r.ok, false)
    assert.equal(hoja('Respuestas').length, antes)
  })
  prueba('le llega el correo de confirmación con sus datos', () => {
    const correo = s.correos.find((c) => c.to === 'ana@ejemplo.test')
    assert.ok(correo, 'no se envió el correo')
    assert.match(correo.subject, /Bienvenido a EcoConecta SCZ, Ana/)
    assert.ok(correo.htmlBody.includes('Reciclajes Ana'))
    assert.ok(correo.htmlBody.includes('Recolector / comprador'))
    assert.ok(correo.htmlBody.includes('logo-correo.png'))
    assert.ok(correo.htmlBody.includes('DM-3'), 'incluye el Lugar')
    assert.ok(correo.htmlBody.includes('15/11/2026'), 'incluye la Fecha')
    assert.ok(correo.htmlBody.includes('Generamos cartón'), 'incluye el Mensaje')
  })
  prueba('la contraseña no queda en texto plano y su hash no está en la hoja compartida', () => {
    assert.ok(!cuentaEnRespuestas(idAna).includes('secreta1'))
    const credencial = privada('Credenciales').find((f) => f[0] === idAna)
    assert.ok(String(credencial[1]).length > 20)
    assert.equal(compartidaTiene(credencial[1]), false)
  })
  prueba('rechaza un correo repetido (sin importar mayúsculas)', () => {
    const r = s.post('registrar_usuario', { ...EXTRA, empresa: 'Otra', contacto: 'Otra', telefono: '70000021', correo: 'ANA@ejemplo.test', clave: 'secreta1', tipo: 'oferente' })
    assert.equal(r.codigo, 'correo_existente')
  })
  prueba('rechaza contraseñas cortas y tipos inválidos', () => {
    assert.equal(s.post('registrar_usuario', { ...EXTRA, empresa: 'A', contacto: 'A', telefono: '70000022', correo: 'a@b.test', clave: '123', tipo: 'oferente' }).codigo, 'datos_invalidos')
    assert.equal(s.post('registrar_usuario', { ...EXTRA, empresa: 'A', contacto: 'A', telefono: '70000022', correo: 'a@b.test', clave: '123456', tipo: 'admin' }).codigo, 'datos_invalidos')
  })
  prueba('inicia sesión con la contraseña correcta (desde otro dispositivo)', () => {
    const r = s.post('iniciar_sesion', { correo: 'ana@ejemplo.test', clave: 'secreta1' })
    assert.equal(r.ok, true)
    assert.equal(r.usuario.id, idAna)
  })
  prueba('rechaza la contraseña incorrecta y el correo inexistente', () => {
    assert.equal(s.post('iniciar_sesion', { correo: 'ana@ejemplo.test', clave: 'otra123' }).codigo, 'credenciales')
    assert.equal(s.post('iniciar_sesion', { correo: 'nadie@ejemplo.test', clave: 'secreta1' }).codigo, 'no_existe')
  })

  console.log('\nCuentas viejas (sin contraseña en la hoja)')
  prueba('avisa que la cuenta vieja no tiene contraseña', () => {
    assert.equal(s.post('iniciar_sesion', { correo: 'pollos@ejemplo.test', clave: 'loquesea' }).codigo, 'cuenta_sin_clave')
  })
  prueba('no deja reclamar la cuenta con otro id', () => {
    const r = s.post('reclamar_cuenta', { usuario: { id: 'usr-impostor', correo: 'pollos@ejemplo.test', empresa: 'X', contacto: 'X', telefono: '70000099', tipo: 'oferente' }, clave: 'nueva123' })
    assert.equal(r.codigo, 'no_autorizado')
  })
  prueba('reclama la cuenta vieja con su id y después puede iniciar sesión', () => {
    const r = s.post('reclamar_cuenta', { usuario: { id: 'usr-viejo-1', correo: 'pollos@ejemplo.test', empresa: 'Pollos Prueba', contacto: 'Marcela Prueba', telefono: '70000010', tipo: 'oferente' }, clave: 'pollos123' })
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.equal(s.post('iniciar_sesion', { correo: 'pollos@ejemplo.test', clave: 'pollos123' }).ok, true)
  })
  prueba('una cuenta ya reclamada no se puede volver a reclamar', () => {
    const r = s.post('reclamar_cuenta', { usuario: { id: 'usr-viejo-1', correo: 'pollos@ejemplo.test', empresa: 'X', contacto: 'X', telefono: '70000010', tipo: 'oferente' }, clave: 'otra1234' })
    assert.equal(r.codigo, 'correo_existente')
  })
  prueba('una cuenta que solo existía en un navegador se crea con su mismo id', () => {
    const r = s.post('reclamar_cuenta', { usuario: { id: 'usr-local-9', correo: 'luis@ejemplo.test', empresa: 'Imprenta Luis', contacto: 'Luis', telefono: '70000030', tipo: 'ambos', creadoEn: '2026-09-30T10:00:00.000Z' }, clave: 'luis1234' })
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.equal(r.usuario.id, 'usr-local-9')
    tokenLuis = r.token
  })

  console.log('\nPublicaciones y permisos')
  prueba('sin sesión no se puede publicar', () => {
    assert.equal(s.post('crear_publicacion', pub('pub-a')).codigo, 'sesion_invalida')
    assert.equal(s.post('crear_publicacion', pub('pub-a'), 'token-inventado').codigo, 'sesion_invalida')
  })
  prueba('al publicar, el dueño y el contacto los fija el servidor', () => {
    const r = s.post('crear_publicacion', pub('pub-a', { usuarioId: 'usr-viejo-2', empresa: 'Falsa', telefono: '79999999', contactos: 500 }), tokenLuis)
    assert.equal(r.ok, true, JSON.stringify(r))
    const p = s.get().publicaciones.find((x) => x.id === 'pub-a')
    assert.equal(p.usuarioId, 'usr-local-9')
    assert.equal(p.empresa, 'Imprenta Luis')
    assert.equal(telefonoEnHoja('pub-a'), '70000030')
    assert.equal(p.contactos, 0)
  })
  prueba('reintentar la creación no duplica', () => {
    s.post('crear_publicacion', pub('pub-a'), tokenLuis)
    assert.equal(s.get().publicaciones.filter((x) => x.id === 'pub-a').length, 1)
  })
  prueba('una fórmula escrita en la descripción queda como texto', () => {
    s.post('actualizar_publicacion', pub('pub-a', { descripcion: '=IMPORTXML("http://x","//a")' }), tokenLuis)
    const p = s.get().publicaciones.find((x) => x.id === 'pub-a')
    assert.equal(p.descripcion, '=IMPORTXML("http://x","//a")')
  })
  prueba('otra cuenta no puede editar ni eliminar la publicación', () => {
    assert.equal(s.post('actualizar_publicacion', pub('pub-a', { titulo: 'Hackeado' }), tokenAna).codigo, 'no_autorizado')
    assert.equal(s.post('eliminar_publicacion', { id: 'pub-a' }, tokenAna).codigo, 'no_autorizado')
    assert.equal(s.post('eliminar_publicacion', { id: 'pub-viejo-2' }, tokenLuis).codigo, 'no_autorizado')
    assert.notEqual(s.get().publicaciones.find((x) => x.id === 'pub-a').titulo, 'Hackeado')
  })

  console.log('\nConsultas')
  prueba('un visitante sin cuenta suma un contacto', () => {
    assert.equal(s.post('registrar_contacto', { id: 'pub-a' }).nuevo, true)
    assert.equal(s.get().publicaciones.find((x) => x.id === 'pub-a').contactos, 1)
  })
  prueba('el visitante queda como "Visitante sin cuenta" y el medio sin registrar', () => {
    const fila = hoja('Consultas').at(-1)
    assert.equal(fila[4], 'Visitante sin cuenta')
    assert.equal(fila[9], 'No registrado')
  })
  prueba('una cuenta suma una sola vez, aunque contacte varias veces', () => {
    assert.equal(s.post('registrar_contacto', { id: 'pub-a', medio: 'whatsapp' }, tokenAna).nuevo, true)
    assert.equal(s.post('registrar_contacto', { id: 'pub-a' }, tokenAna).nuevo, false)
    assert.equal(s.get().publicaciones.find((x) => x.id === 'pub-a').contactos, 2)
  })
  prueba('guarda quién consultó, cómo ubicarlo, quién publicó y por qué medio', () => {
    const fila = hoja('Consultas').at(-1)
    assert.deepEqual([...fila.slice(3, 10)], ['Imprenta Luis', 'Reciclajes Ana', 'Ana', '70000020', 'ana@ejemplo.test', 'recolector', 'WhatsApp'])
  })
  prueba('el dueño no se suma contactos a sí mismo', () => {
    assert.equal(s.post('registrar_contacto', { id: 'pub-a' }, tokenLuis).nuevo, false)
  })
  prueba('al editar, la web no puede pisar el contador de contactos', () => {
    s.post('actualizar_publicacion', pub('pub-a', { contactos: 0, estado: 'pausada' }), tokenLuis)
    const p = s.get().publicaciones.find((x) => x.id === 'pub-a')
    assert.equal(p.contactos, 2)
    assert.equal(p.estado, 'pausada')
  })
  prueba('el oferente ve quién lo contactó (solo cuentas)', () => {
    const r = s.post('contactos_recibidos', {}, tokenLuis)
    assert.equal(r.contactos.length, 1)
    assert.equal(r.contactos[0].empresa, 'Reciclajes Ana')
    assert.equal(r.contactos[0].publicacionId, 'pub-a')
    assert.equal(r.contactos[0].medio, 'WhatsApp')
  })
  prueba('los contactos de otros oferentes no se ven', () => {
    assert.equal(s.post('contactos_recibidos', {}, tokenAna).contactos.length, 0)
  })

  console.log('\nGuardados y actividad')
  prueba('guarda, lista y quita publicaciones', () => {
    s.post('alternar_guardado', { publicacionId: 'pub-a', guardar: true }, tokenAna)
    s.post('alternar_guardado', { publicacionId: 'pub-viejo-2', guardar: true }, tokenAna)
    s.post('alternar_guardado', { publicacionId: 'pub-a', guardar: true }, tokenAna) // repetido
    let r = s.post('mi_actividad', {}, tokenAna)
    assert.deepEqual(r.guardados, ['pub-viejo-2', 'pub-a'])
    assert.equal(r.contactos.length, 1)
    s.post('alternar_guardado', { publicacionId: 'pub-a', guardar: false }, tokenAna)
    r = s.post('mi_actividad', {}, tokenAna)
    assert.deepEqual(r.guardados, ['pub-viejo-2'])
  })

  console.log('\nPerfil y sesiones')
  prueba('actualizar el perfil cambia la hoja de usuarios y sus publicaciones', () => {
    const r = s.post('actualizar_perfil', { empresa: 'Imprenta Luis SRL', contacto: 'Luis', telefono: '7111 3333', tipo: 'ambos', zonaInteres: 'DM-3' }, tokenLuis)
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.equal(r.publicacionesActualizadas, 1)
    assert.equal(r.usuario.telefono, '71113333')
    const p = s.get().publicaciones.find((x) => x.id === 'pub-a')
    assert.equal(p.empresa, 'Imprenta Luis SRL')
    assert.equal(telefonoEnHoja('pub-a'), '71113333')
  })
  prueba('al cerrar sesión la llave deja de servir', () => {
    s.post('cerrar_sesion', {}, tokenAna)
    assert.equal(s.post('mi_actividad', {}, tokenAna).codigo, 'sesion_invalida')
  })
  prueba('una sesión vencida no sirve', () => {
    const sesiones = privada('Sesiones')
    const fila = sesiones.find((f) => f[0] === tokenLuis)
    fila[3] = Date.now() - 1000
    assert.equal(s.post('mi_actividad', {}, tokenLuis).codigo, 'sesion_invalida')
  })
  prueba('cambiar de tipo muda la cuenta de pestaña', () => {
    const r = s.post('iniciar_sesion', { correo: 'imprenta@ejemplo.test', clave: CLAVE_IMPRENTA })
    const cambio = s.post('actualizar_perfil', { empresa: 'Imprenta Prueba', contacto: 'Melisa Prueba', telefono: '70000012', tipo: 'ambos', zonaInteres: 'DM-5' }, r.token)
    assert.equal(cambio.ok, true, JSON.stringify(cambio))
    assert.equal(cuentaEnRespuestas('usr-imprenta')[3], 'ambos', 'la vista Ambos la muestra sola')
    assert.equal(s.post('iniciar_sesion', { correo: 'imprenta@ejemplo.test', clave: CLAVE_IMPRENTA }).usuario.tipo, 'ambos')
  })
  prueba('una acción desconocida se rechaza', () => {
    assert.equal(s.post('borrar_todo', {}).codigo, 'accion_desconocida')
  })

  console.log('\nRecuperar la contraseña')
  const ultimoCodigo = () => s.correos.at(-1).subject.match(/(\d{6})$/)[1]
  const filaRecuperacion = (correo) => privada('Recuperaciones').filter((f) => f[0] === correo).at(-1)

  prueba('con un correo que no existe responde igual y no manda nada', () => {
    const antes = s.correos.length
    assert.equal(s.post('solicitar_recuperacion', { correo: 'nadie@ejemplo.test' }).ok, true)
    assert.equal(s.correos.length, antes)
  })
  prueba('manda un código de 6 dígitos al correo de la cuenta', () => {
    assert.equal(s.post('solicitar_recuperacion', { correo: 'ANA@ejemplo.test' }).ok, true)
    const correo = s.correos.at(-1)
    assert.equal(correo.to, 'ana@ejemplo.test')
    assert.match(ultimoCodigo(), /^\d{6}$/)
    assert.ok(correo.htmlBody.includes(ultimoCodigo()))
    assert.ok(correo.body.includes('#/recuperar?correo=ana%40ejemplo.test'))
  })
  prueba('el código no queda guardado tal cual en la hoja', () => {
    assert.ok(!filaRecuperacion('ana@ejemplo.test').includes(ultimoCodigo()))
    assert.ok(!filaRecuperacion('ana@ejemplo.test').includes(Number(ultimoCodigo())))
  })
  prueba('un código incorrecto avisa cuántos intentos quedan', () => {
    const r = s.post('restablecer_clave', { correo: 'ana@ejemplo.test', codigo: '000000', clave: 'nueva123' })
    assert.equal(r.codigo, 'codigo_invalido')
    assert.match(r.error, /Te quedan 4 intentos/)
  })
  prueba('con el código correcto cambia la contraseña e inicia sesión', () => {
    const viejaSesion = s.post('iniciar_sesion', { correo: 'ana@ejemplo.test', clave: 'secreta1' }).token
    const r = s.post('restablecer_clave', { correo: 'ana@ejemplo.test', codigo: ultimoCodigo(), clave: 'nueva123' })
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.ok(r.token)
    assert.equal(s.post('iniciar_sesion', { correo: 'ana@ejemplo.test', clave: 'secreta1' }).codigo, 'credenciales')
    assert.equal(s.post('iniciar_sesion', { correo: 'ana@ejemplo.test', clave: 'nueva123' }).ok, true)
    assert.equal(s.post('mi_actividad', {}, viejaSesion).codigo, 'sesion_invalida', 'las sesiones anteriores se cierran')
    assert.equal(s.post('mi_actividad', {}, r.token).ok, true)
  })
  prueba('el código sirve una sola vez', () => {
    const r = s.post('restablecer_clave', { correo: 'ana@ejemplo.test', codigo: ultimoCodigo(), clave: 'otra1234' })
    assert.equal(r.codigo, 'codigo_invalido')
  })
  prueba('después de 5 intentos fallidos el código se bloquea aunque se acierte', () => {
    s.post('solicitar_recuperacion', { correo: 'ana@ejemplo.test' })
    const bueno = ultimoCodigo()
    const malo = bueno === '111111' ? '222222' : '111111'
    let ultima
    for (let i = 0; i < 5; i++) ultima = s.post('restablecer_clave', { correo: 'ana@ejemplo.test', codigo: malo, clave: 'otra1234' })
    assert.equal(ultima.codigo, 'demasiados_intentos')
    assert.equal(s.post('restablecer_clave', { correo: 'ana@ejemplo.test', codigo: bueno, clave: 'otra1234' }).codigo, 'demasiados_intentos')
  })
  prueba('como máximo 3 códigos por hora para el mismo correo', () => {
    // Ya se pidieron 2 en esta hora para ana: el tercero pasa, el cuarto no.
    assert.equal(s.post('solicitar_recuperacion', { correo: 'ana@ejemplo.test' }).ok, true)
    assert.equal(s.post('solicitar_recuperacion', { correo: 'ana@ejemplo.test' }).codigo, 'limite_envios')
  })
  prueba('un código nuevo anula el anterior', () => {
    s.post('solicitar_recuperacion', { correo: 'mendez@ejemplo.test' })
    const primero = ultimoCodigo()
    s.post('solicitar_recuperacion', { correo: 'mendez@ejemplo.test' })
    const segundo = ultimoCodigo()
    if (primero !== segundo) {
      assert.equal(s.post('restablecer_clave', { correo: 'mendez@ejemplo.test', codigo: primero, clave: 'mendez123' }).codigo, 'codigo_invalido')
    }
  })
  prueba('un código vencido no sirve', () => {
    const codigo = ultimoCodigo()
    filaRecuperacion('mendez@ejemplo.test')[4] = Date.now() - 1000
    assert.equal(s.post('restablecer_clave', { correo: 'mendez@ejemplo.test', codigo, clave: 'mendez123' }).codigo, 'codigo_vencido')
  })
  prueba('una cuenta vieja sin contraseña se activa con el código del correo', () => {
    assert.equal(s.post('iniciar_sesion', { correo: 'mendez@ejemplo.test', clave: 'mendez123' }).codigo, 'cuenta_sin_clave')
    s.post('solicitar_recuperacion', { correo: 'mendez@ejemplo.test' })
    const r = s.post('restablecer_clave', { correo: 'mendez@ejemplo.test', codigo: ultimoCodigo(), clave: 'mendez123' })
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.equal(r.usuario.id, 'usr-viejo-2', 'conserva su id y sus publicaciones')
    assert.equal(s.post('iniciar_sesion', { correo: 'mendez@ejemplo.test', clave: 'mendez123' }).ok, true)
  })
  prueba('200 recuperaciones seguidas funcionan (hashes que empiezan con "+")', () => {
    // El hash del código en base64 empieza con "+" una de cada 64 veces; sin
    // seguro() Sheets lo tomaría como fórmula y el código nunca coincidiría.
    for (let i = 0; i < 200; i++) {
      privada('Recuperaciones').forEach((fila, n) => {
        if (n > 0) fila[3] = '2000-01-01T00:00:00.000Z' // fuera del límite por hora
      })
      assert.equal(s.post('solicitar_recuperacion', { correo: 'mendez@ejemplo.test' }).ok, true)
      const r = s.post('restablecer_clave', { correo: 'mendez@ejemplo.test', codigo: ultimoCodigo(), clave: 'mendez123' })
      assert.equal(r.ok, true, `falló en la vuelta ${i + 1}: ${JSON.stringify(r)}`)
    }
  })
  prueba('una contraseña nueva demasiado corta se rechaza', () => {
    assert.equal(s.post('restablecer_clave', { correo: 'mendez@ejemplo.test', codigo: '123456', clave: '123' }).codigo, 'datos_invalidos')
  })

  console.log('\nAdministrador')
  prueba('sin CLAVE_ADMIN configurada no entrega datos', () => {
    const r = s.post('admin_datos', { clave: 'cualquiera' })
    assert.equal(r.codigo, 'clave_admin')
    assert.match(r.error, /Falta configurar/)
  })
  prueba('con una clave incorrecta tampoco', () => {
    s.propiedades.CLAVE_ADMIN = 'clave-admin-prueba'
    assert.equal(s.post('admin_datos', { clave: 'otra' }).codigo, 'clave_admin')
  })
  prueba('con la clave correcta entrega cuentas, publicaciones y contactos con fecha y hora', () => {
    const r = s.post('admin_datos', { clave: 'clave-admin-prueba' })
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.equal(r.usuarios.length, 5)
    const ana = r.usuarios.find((u) => u.correo === 'ana@ejemplo.test')
    assert.equal(ana.lugar, 'DM-3')
    assert.equal(ana.fechaServicio, '15/11/2026')
    assert.match(ana.mensaje, /cartón/)
    assert.ok(r.usuarios.every((u) => u.hashClave === undefined && u.sal === undefined), 'nunca el hash')
    const pollos = r.usuarios.find((u) => u.id === 'usr-viejo-1')
    assert.equal(pollos.fecha, '23/09/2026')
    assert.equal(pollos.hora, '09:00', '13:00 UTC son las 09:00 en Bolivia')
    assert.equal(pollos.tipo, 'oferente')
    assert.ok(r.publicaciones.length >= 3)
    assert.match(r.publicaciones[0].fecha, /^\d{2}\/\d{2}\/\d{4}$/)
    const consulta = r.contactos.find((c) => c.titulo === 'Aceite pub-viejo-1')
    assert.equal(consulta.publicadoPor, 'Pollos Prueba')
    assert.equal(consulta.consultadoPor, 'Imprenta Prueba')
    assert.equal(consulta.telefono, '70000012')
    assert.equal(r.correosRestantesHoy, 100)
  })
  prueba('pausa, activa y elimina cualquier publicación', () => {
    assert.equal(s.post('admin_publicacion', { clave: 'clave-admin-prueba', id: 'pub-viejo-2', estado: 'pausada' }).ok, true)
    assert.equal(s.get().publicaciones.find((x) => x.id === 'pub-viejo-2').estado, 'pausada')
    assert.equal(s.post('admin_publicacion', { clave: 'otra', id: 'pub-viejo-2', eliminar: true }).codigo, 'clave_admin')
    assert.equal(s.post('admin_publicacion', { clave: 'clave-admin-prueba', id: 'pub-viejo-2', eliminar: true }).ok, true)
    assert.equal(s.get().publicaciones.find((x) => x.id === 'pub-viejo-2'), undefined)
  })
  prueba('tras 8 intentos fallidos se bloquea, aunque después se acierte', () => {
    for (let i = 0; i < 8; i++) s.post('admin_datos', { clave: 'mala' })
    const r = s.post('admin_datos', { clave: 'clave-admin-prueba' })
    assert.equal(r.codigo, 'clave_admin')
    assert.match(r.error, /Demasiados intentos/)
  })
  prueba('una cuenta de CORREOS_ADMIN entra al panel con su sesión, sin clave', () => {
    s.propiedades.CORREOS_ADMIN = 'otra@ejemplo.test, IMPRENTA@ejemplo.test'
    const sesion = s.post('iniciar_sesion', { correo: 'imprenta@ejemplo.test', clave: CLAVE_IMPRENTA })
    assert.equal(sesion.usuario.esAdmin, true)
    // Aunque la clave esté bloqueada por los intentos de la prueba anterior.
    const r = s.post('admin_datos', {}, sesion.token)
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.equal(s.post('admin_publicacion', { id: 'pub-a', estado: 'disponible' }, sesion.token).ok, true)
  })
  prueba('una cuenta común no entra al panel con su sesión', () => {
    const sesion = s.post('iniciar_sesion', { correo: 'pollos@ejemplo.test', clave: 'pollos123' })
    assert.equal(sesion.usuario.esAdmin, false)
    assert.equal(s.post('admin_datos', {}, sesion.token).codigo, 'no_admin')
  })
  prueba('sin sesión ni clave se pide la clave', () => {
    const r = s.post('admin_datos', {})
    assert.equal(r.codigo, 'clave_admin')
    assert.match(r.error, /Ingresá la clave/)
  })
  prueba('una sesión cerrada ya no da acceso al panel', () => {
    const sesion = s.post('iniciar_sesion', { correo: 'imprenta@ejemplo.test', clave: CLAVE_IMPRENTA })
    s.post('cerrar_sesion', {}, sesion.token)
    assert.equal(s.post('admin_datos', {}, sesion.token).codigo, 'clave_admin')
  })
  prueba('la lectura pública no expone fecha y hora internas', () => {
    const p = s.get().publicaciones[0]
    assert.equal(p.fecha, undefined)
    assert.equal(p.hora, undefined)
    assert.match(p.creadaEn, /^\d{4}-\d{2}-\d{2}T/)
  })
  prueba('la versión del script se puede consultar', () => {
    assert.equal(s.get('estado').version, 6)
  })

  console.log('\nEmpresas de muestra de Santa Cruz')
  const esMuestra = (p) => p.empresa && hoja('Respuestas').some((f) => f[7] === p.empresa && String(f[2]).startsWith('toledogutierrezecoconecta+ej'))
  const muestrasPublicas = () => s.get().publicaciones.filter(esMuestra)
  prueba('cargarEmpresasDeMuestra agrega 11 empresas y 12 publicaciones sin mandar correos', () => {
    const cuentasAntes = hoja('Respuestas').length
    const correosAntes = s.correos.length
    const resumen = s.ejecutar('cargarEmpresasDeMuestra')
    assert.match(resumen, /Empresas de muestra agregadas: 11 \(de 11\)/)
    assert.match(resumen, /Publicaciones agregadas: 12 \(de 12\)/)
    assert.equal(hoja('Respuestas').length, cuentasAntes + 11)
    assert.equal(s.correos.length, correosAntes, 'no se envía ningún correo')
    const camba = hoja('Respuestas').find((f) => f[7] === 'Restaurante Sabor Camba')
    assert.deepEqual([...camba.slice(1, 5)], ['Carla Rojas', 'toledogutierrezecoconecta+ej01@gmail.com', 'oferente', 'DM-2'])
    assert.equal(camba[8], '78906939')
    assert.equal(camba[9], 'No se envía (carga de muestra)')
  })
  prueba('se ven como publicaciones comunes, con el teléfono del proyecto', () => {
    const lista = muestrasPublicas()
    assert.equal(lista.length, 12)
    assert.ok(lista.every((p) => p.origen === 'usuario' && p.estado === 'disponible'))
    const aceite = lista.find((p) => p.titulo === 'Aceite vegetal usado de freidora')
    assert.equal(aceite.telefono, undefined, 'la lista pública no trae teléfonos')
    assert.equal(s.post('datos_contacto', { id: aceite.id }).telefono, '78906939')
  })
  prueba('repetir la carga no duplica nada', () => {
    assert.match(s.ejecutar('cargarEmpresasDeMuestra'), /agregadas: 0 \(de 11\).*agregadas: 0 \(de 12\)/)
    assert.equal(muestrasPublicas().length, 12)
  })
  prueba('las cuentas de muestra no permiten iniciar sesión', () => {
    const r = s.post('iniciar_sesion', { correo: 'toledogutierrezecoconecta+ej01@gmail.com', clave: 'cualquiera' })
    assert.equal(r.ok, false)
  })
  prueba('marcarComoEjemplo y marcarComoReales cambian solo las de muestra', () => {
    const otras = () => s.get().publicaciones.filter((p) => !esMuestra(p)).map((p) => p.origen).join()
    const antes = otras()
    assert.match(s.ejecutar('marcarComoEjemplo'), /"demo": 12 cambiadas/)
    assert.ok(muestrasPublicas().every((p) => p.origen === 'demo'))
    assert.equal(otras(), antes)
    assert.match(s.ejecutar('marcarComoReales'), /"usuario": 12 cambiadas/)
    assert.ok(muestrasPublicas().every((p) => p.origen === 'usuario'))
  })

  console.log(`\n${pasadas} pruebas pasaron${process.exitCode ? ', hay fallas' : ''}.`)
}
