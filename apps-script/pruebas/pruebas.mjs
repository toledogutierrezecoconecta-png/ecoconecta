// Pruebas del Apps Script: ejecutan el Codigo.gs real sobre una hoja simulada.
// Uso: npm run sheets:probar   (sheets:subir y sheets:publicar las corren antes de subir)
import assert from 'node:assert/strict'
import { libroComoElReal } from './escenario.mjs'
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
  let tokenAna, tokenLuis, idAna

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
  prueba('agrega las columnas nuevas a la hoja Usuarios existente', () => {
    assert.deepEqual(hoja('Usuarios')[0].slice(7), ['zonaInteres', 'hashClave', 'sal'])
  })
  prueba('la contraseña no queda en texto plano en la hoja', () => {
    const fila = hoja('Usuarios').find((f) => f[0] === idAna)
    assert.ok(!fila.includes('secreta1'))
    assert.ok(String(fila[8]).length > 20)
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

  console.log('\nContactos')
  prueba('un visitante sin cuenta suma un contacto', () => {
    assert.equal(s.post('registrar_contacto', { id: 'pub-a' }).nuevo, true)
    assert.equal(s.get().publicaciones.find((x) => x.id === 'pub-a').contactos, 1)
  })
  prueba('una cuenta suma una sola vez, aunque contacte varias veces', () => {
    assert.equal(s.post('registrar_contacto', { id: 'pub-a' }, tokenAna).nuevo, true)
    assert.equal(s.post('registrar_contacto', { id: 'pub-a' }, tokenAna).nuevo, false)
    assert.equal(s.get().publicaciones.find((x) => x.id === 'pub-a').contactos, 2)
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
  prueba('una acción desconocida se rechaza', () => {
    assert.equal(s.post('borrar_todo', {}).codigo, 'accion_desconocida')
  })

  console.log(`\n${pasadas} pruebas pasaron${process.exitCode ? ', hay fallas' : ''}.`)
}
