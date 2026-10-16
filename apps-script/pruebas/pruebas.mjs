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
  const esFecha = (v) => v && typeof v.getTime === 'function'
  let tokenAna, tokenLuis, idAna

  console.log('\nActualización de la hoja (actualizarHojas)')
  let resumen
  prueba('se ejecuta sin errores y deja un resumen', () => {
    resumen = s.ejecutar('actualizarHojas')
    assert.match(resumen, /Cuentas repartidas en Empresas, Recolectores y Ambos: 3/)
    assert.match(resumen, /Publicaciones con fecha y hora: 2/)
    assert.match(resumen, /Consultas \(antes "Contactos"\): 1/)
    assert.match(resumen, /Clave de administrador: FALTA/)
  })
  prueba('pone la hoja en hora de Bolivia', () => {
    assert.equal(s.libro.zonaHoraria, 'America/La_Paz')
  })
  prueba('reparte las cuentas por tipo, con fecha y hora legibles', () => {
    assert.deepEqual([...hoja('Empresas')[0].slice(0, 7)], ['Fecha', 'Hora', 'Empresa / negocio', 'Contacto', 'Teléfono', 'Correo', 'Tipo'])
    assert.equal(hoja('Empresas').length, 3)
    assert.equal(hoja('Recolectores').length, 2)
    assert.equal(hoja('Ambos').length, 1)
    const pollos = hoja('Empresas').find((f) => f[9] === 'usr-viejo-1')
    assert.ok(esFecha(pollos[0]) && esFecha(pollos[1]))
    assert.equal(pollos[4], '70000010', 'el teléfono queda como texto')
  })
  prueba('conserva la contraseña de quien se registró con la versión anterior', () => {
    const r = s.post('iniciar_sesion', { correo: 'imprenta@ejemplo.test', clave: CLAVE_IMPRENTA })
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.equal(r.usuario.id, 'usr-imprenta')
    assert.equal(r.usuario.tipo, 'recolector')
    assert.equal(r.usuario.zonaInteres, 'DM-5')
  })
  prueba('oculta el hash y la sal', () => {
    assert.ok(pestana('Recolectores').columnasOcultas.has(12) && pestana('Recolectores').columnasOcultas.has(13))
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
    assert.equal(s.libro.getSheetByName('Contactos'), null)
  })
  prueba('no borra nada: las pestañas viejas quedan ocultas como respaldo', () => {
    for (const nombre of ['Usuarios (respaldo)', 'Publicaciones (respaldo)', 'Contactos (respaldo)']) {
      assert.ok(pestana(nombre), nombre)
      assert.equal(pestana(nombre).oculta, true)
    }
    assert.equal(s.libro.getSheetByName('Usuarios'), null)
  })
  prueba('oculta las pestañas técnicas y ordena las que se leen', () => {
    for (const nombre of ['Sesiones', 'Guardados', 'Recuperaciones']) assert.equal(pestana(nombre).oculta, true, nombre)
    assert.deepEqual(s.libro.pestanas().slice(0, 5), ['Empresas', 'Recolectores', 'Ambos', 'Publicaciones', 'Consultas'])
  })
  prueba('la columna de Publicaciones se llama "Consultas recibidas"', () => {
    assert.ok(hoja('Publicaciones')[0].includes('Consultas recibidas'))
    assert.ok(!hoja('Publicaciones')[0].includes('Contactos recibidos'))
  })
  prueba('una hoja con el título viejo "Contactos recibidos" no gana una columna de más', () => {
    const otra = cargarScript(CODIGO, libroComoElReal())
    otra.ejecutar('actualizarHojas')
    const encabezado = otra.libro.getSheetByName('Publicaciones').datos[0]
    encabezado[encabezado.indexOf('Consultas recibidas')] = 'Contactos recibidos'
    const ancho = encabezado.length
    otra.get()
    assert.equal(otra.libro.getSheetByName('Publicaciones').datos[0].length, ancho)
    otra.ejecutar('actualizarHojas')
    assert.ok(otra.libro.getSheetByName('Publicaciones').datos[0].includes('Consultas recibidas'))
  })
  prueba('ejecutarla dos veces no duplica nada', () => {
    s.ejecutar('actualizarHojas')
    assert.equal(hoja('Empresas').length, 3)
    assert.equal(hoja('Publicaciones').length, 3)
    assert.equal(hoja('Consultas').length, 2)
  })
  prueba('convierte también "Contactos" con el formato del 16/10', () => {
    const otra = cargarScript(CODIGO)
    otra.libro.insertSheet('Contactos').appendRow(['Fecha', 'Hora', 'Título', 'ID publicación', 'ID usuario', 'Empresa / negocio', 'Contacto', 'Tipo'])
    otra.libro.getSheetByName('Contactos').appendRow([new Date('2026-10-15T15:00:00Z'), new Date('2026-10-15T15:00:00Z'), 'Vidrio', 'pub-x', '', '', '', ''])
    assert.match(otra.ejecutar('actualizarHojas'), /Consultas \(antes "Contactos"\): 1/)
    const fila = otra.libro.getSheetByName('Consultas').datos[1]
    assert.equal(fila[2], 'Vidrio')
    assert.equal(fila[4], 'Visitante sin cuenta')
  })
  prueba('se niega a convertir una hoja con el formato del 16/10', () => {
    const otra = cargarScript(CODIGO)
    const empresas = otra.libro.insertSheet('Empresas')
    empresas.appendRow(['Fecha', 'Hora', 'Empresa / negocio', 'Contacto', 'Teléfono', 'Correo', 'Tipo', 'Correo de confirmación', 'ID'])
    assert.throws(() => otra.ejecutar('actualizarHojas'), /Historial de versiones/)
  })

  console.log('\nLectura')
  prueba('lista las publicaciones existentes con teléfono y fecha como texto', () => {
    const r = s.get()
    assert.equal(r.ok, true)
    assert.equal(r.publicaciones.length, 2)
    assert.equal(r.publicaciones[0].telefono, '70000010')
    assert.equal(r.publicaciones[0].fechaDisponible, '2026-09-23')
    assert.equal(r.publicaciones[0].cantidad, 50)
  })

  console.log('\nRegistro e inicio de sesión')
  prueba('registra una cuenta nueva y entrega una llave de sesión', () => {
    const r = s.post('registrar_usuario', { empresa: 'Reciclajes Ana', contacto: 'Ana', telefono: '7000 0020', correo: 'Ana@Ejemplo.test', clave: 'secreta1', tipo: 'recolector' })
    assert.equal(r.ok, true, JSON.stringify(r))
    assert.ok(r.token.length >= 60)
    assert.equal(r.usuario.correo, 'ana@ejemplo.test')
    assert.equal(r.usuario.telefono, '70000020')
    assert.equal(r.usuario.hashClave, undefined, 'el hash no debe salir del servidor')
    tokenAna = r.token
    idAna = r.usuario.id
  })
  prueba('queda en la pestaña de su tipo, con fecha y hora de hoy', () => {
    const fila = hoja('Recolectores').find((f) => f[9] === idAna)
    assert.ok(fila, 'Ana es recolectora')
    assert.ok(esFecha(fila[0]) && esFecha(fila[1]))
    assert.ok(Date.now() - fila[0].getTime() < 60000)
    assert.equal(fila[7], 'Enviado')
  })
  prueba('le llega el correo de confirmación con sus datos', () => {
    const correo = s.correos.find((c) => c.to === 'ana@ejemplo.test')
    assert.ok(correo, 'no se envió el correo')
    assert.match(correo.subject, /Bienvenido a EcoConecta SCZ, Ana/)
    assert.ok(correo.htmlBody.includes('Reciclajes Ana'))
    assert.ok(correo.htmlBody.includes('Recolector / comprador'))
    assert.ok(correo.htmlBody.includes('logo-correo.png'))
  })
  prueba('la contraseña no queda en texto plano en la hoja', () => {
    const fila = hoja('Recolectores').find((f) => f[9] === idAna)
    assert.ok(!fila.includes('secreta1'))
    assert.ok(String(fila[11]).length > 20)
  })
  prueba('rechaza un correo repetido (sin importar mayúsculas)', () => {
    const r = s.post('registrar_usuario', { empresa: 'Otra', contacto: 'Otra', telefono: '70000021', correo: 'ANA@ejemplo.test', clave: 'secreta1', tipo: 'oferente' })
    assert.equal(r.codigo, 'correo_existente')
  })
  prueba('rechaza contraseñas cortas y tipos inválidos', () => {
    assert.equal(s.post('registrar_usuario', { empresa: 'A', contacto: 'A', telefono: '70000022', correo: 'a@b.test', clave: '123', tipo: 'oferente' }).codigo, 'datos_invalidos')
    assert.equal(s.post('registrar_usuario', { empresa: 'A', contacto: 'A', telefono: '70000022', correo: 'a@b.test', clave: '123456', tipo: 'admin' }).codigo, 'datos_invalidos')
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
    assert.equal(p.telefono, '70000030')
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
    assert.equal(p.telefono, '71113333')
  })
  prueba('al cerrar sesión la llave deja de servir', () => {
    s.post('cerrar_sesion', {}, tokenAna)
    assert.equal(s.post('mi_actividad', {}, tokenAna).codigo, 'sesion_invalida')
  })
  prueba('una sesión vencida no sirve', () => {
    const sesiones = hoja('Sesiones')
    const fila = sesiones.find((f) => f[0] === tokenLuis)
    fila[3] = Date.now() - 1000
    assert.equal(s.post('mi_actividad', {}, tokenLuis).codigo, 'sesion_invalida')
  })
  prueba('cambiar de tipo muda la cuenta de pestaña', () => {
    const r = s.post('iniciar_sesion', { correo: 'imprenta@ejemplo.test', clave: CLAVE_IMPRENTA })
    const cambio = s.post('actualizar_perfil', { empresa: 'Imprenta Prueba', contacto: 'Melisa Prueba', telefono: '70000012', tipo: 'ambos', zonaInteres: 'DM-5' }, r.token)
    assert.equal(cambio.ok, true, JSON.stringify(cambio))
    assert.equal(hoja('Recolectores').filter((f) => f[9] === 'usr-imprenta').length, 0)
    assert.equal(hoja('Ambos').filter((f) => f[9] === 'usr-imprenta').length, 1)
    assert.equal(s.post('iniciar_sesion', { correo: 'imprenta@ejemplo.test', clave: CLAVE_IMPRENTA }).usuario.tipo, 'ambos')
  })
  prueba('una acción desconocida se rechaza', () => {
    assert.equal(s.post('borrar_todo', {}).codigo, 'accion_desconocida')
  })

  console.log('\nRecuperar la contraseña')
  const ultimoCodigo = () => s.correos.at(-1).subject.match(/(\d{6})$/)[1]
  const filaRecuperacion = (correo) => hoja('Recuperaciones').filter((f) => f[0] === correo).at(-1)

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
      hoja('Recuperaciones').forEach((fila, n) => {
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
    assert.equal(s.get('estado').version, 5)
  })

  console.log(`\n${pasadas} pruebas pasaron${process.exitCode ? ', hay fallas' : ''}.`)
}
