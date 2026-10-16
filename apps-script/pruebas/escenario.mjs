import { createHash } from 'node:crypto'
import { Libro } from './simulador.mjs'

/** Mismo hash que calcularHash() del script: SHA-256 con sal, repetido 1000 veces. */
function hashComoElScript(clave, sal) {
  let bytes = createHash('sha256').update(sal + clave, 'utf8').digest()
  for (let i = 1; i < 1000; i++) bytes = createHash('sha256').update(bytes).digest()
  return bytes.toString('base64')
}

/** Contraseña de la cuenta de prueba que ya se había registrado con la versión del 11/10. */
export const CLAVE_IMPRENTA = 'imprenta1'

/**
 * Hoja con la forma que tiene la planilla real antes de esta versión (11/10):
 * una sola pestaña Usuarios, publicaciones y contactos sin fecha legible.
 */
export function libroComoElReal() {
  const libro = new Libro()
  const usuarios = libro.insertSheet('Usuarios')
  usuarios.appendRow(['id', 'empresa', 'contacto', 'telefono', 'correo', 'tipo', 'creadoEn', 'zonaInteres', 'hashClave', 'sal'])
  // Cuentas de septiembre: todavía sin contraseña en la hoja.
  usuarios.appendRow(['usr-viejo-1', 'Pollos Prueba', 'Marcela Prueba', '70000010', 'pollos@ejemplo.test', 'oferente', '2026-09-23T13:00:00.000Z', '', '', ''])
  usuarios.appendRow(['usr-viejo-2', 'Mendez Prueba', 'Franz Prueba', '70000011', 'mendez@ejemplo.test', 'oferente', '2026-09-23T16:00:00.000Z', '', '', ''])
  // Cuenta registrada con la versión del 11/10: su contraseña está en la hoja.
  const sal = 'sal-de-prueba-imprenta'
  usuarios.appendRow(['usr-imprenta', 'Imprenta Prueba', 'Melisa Prueba', '70000012', 'imprenta@ejemplo.test', 'recolector', '2026-10-12T16:20:00.000Z', 'DM-5', hashComoElScript(CLAVE_IMPRENTA, sal), sal])

  const publicaciones = libro.insertSheet('Publicaciones')
  const columnas = ['id', 'titulo', 'categoriaId', 'materialId', 'descripcion', 'cantidad', 'unidad', 'frecuencia', 'zona', 'direccion', 'modalidadPrecio', 'valorEstimadoMin', 'valorEstimadoMax', 'fechaDisponible', 'estado', 'contactos', 'usuarioId', 'empresa', 'contacto', 'telefono', 'creadaEn', 'origen']
  publicaciones.appendRow(columnas)
  const fila = (id, usuarioId, empresa, telefono) => columnas.map((c) => ({ id, titulo: 'Aceite ' + id, categoriaId: 'organicos', materialId: 'aceite-vegetal', descripcion: 'Aceite filtrado de prueba', cantidad: '50', unidad: 'litros', frecuencia: 'Semanal', zona: 'DM-1', direccion: 'Prueba', modalidadPrecio: 'referencia', valorEstimadoMin: '90', valorEstimadoMax: '125', fechaDisponible: '2026-09-23', estado: 'disponible', contactos: '1', usuarioId, empresa, contacto: 'X', telefono, creadaEn: '2026-09-23T13:20:01.607Z', origen: 'usuario' })[c])
  publicaciones.appendRow(fila('pub-viejo-1', 'usr-viejo-1', 'Pollos Prueba', '70000010'))
  publicaciones.appendRow(fila('pub-viejo-2', 'usr-viejo-2', 'Mendez Prueba', '70000011'))

  // Un contacto de la imprenta (con cuenta) a la publicación de Pollos.
  const contactos = libro.insertSheet('Contactos')
  contactos.appendRow(['publicacionId', 'fecha', 'usuarioId', 'empresa', 'contacto', 'tipo'])
  contactos.appendRow(['pub-viejo-1', '2026-10-13T14:00:00.000Z', 'usr-imprenta', 'Imprenta Prueba', 'Melisa Prueba', 'recolector'])

  // Pestañas técnicas de la versión del 11/10.
  libro.insertSheet('Sesiones').appendRow(['token', 'usuarioId', 'creadaEn', 'expiraEn'])
  return libro
}

/**
 * Lo que pasó el 16/10: la hoja se restauró a una versión vieja (sin las
 * cuentas ni la publicación de la imprenta) y se convirtió. Devuelve esa hoja
 * y una copia de la versión correcta, de donde hay que recuperar lo que falta.
 */
export function hojaRestauradaDeMasYCopia() {
  const actual = libroComoElReal()
  const usuarios = actual.getSheetByName('Usuarios')
  usuarios.datos = usuarios.datos.filter((fila) => fila[0] !== 'usr-imprenta')
  const contactos = actual.getSheetByName('Contactos')
  contactos.datos = contactos.datos.slice(0, 1)

  const copia = libroComoElReal()
  // En la copia, además, una cuenta que después se volvió a registrar con el mismo correo.
  copia.getSheetByName('Usuarios').appendRow(['usr-duplicada', 'Repetida', 'Rita', '70000013', 'rita@ejemplo.test', 'ambos', '2026-10-14T10:00:00.000Z', '', '', ''])
  const columnas = copia.getSheetByName('Publicaciones').datos[0]
  const valores = { id: 'pub-carton', titulo: 'CARTON', categoriaId: 'secos', materialId: 'carton-prensado', descripcion: 'Cartón de imprenta', cantidad: '60', unidad: 'kg', frecuencia: 'Semanal', zona: 'DM-5', direccion: 'Prueba', modalidadPrecio: 'referencia', valorEstimadoMin: '30', valorEstimadoMax: '45', fechaDisponible: '2026-10-12', estado: 'disponible', contactos: '0', usuarioId: 'usr-imprenta', empresa: 'Imprenta Prueba', contacto: 'Melisa Prueba', telefono: '70000012', creadaEn: '2026-10-12T16:31:16.929Z', origen: 'usuario' }
  copia.getSheetByName('Publicaciones').appendRow(columnas.map((c) => valores[c]))
  const guardados = copia.insertSheet('Guardados')
  guardados.appendRow(['usuarioId', 'publicacionId', 'fecha'])
  guardados.appendRow(['usr-imprenta', 'pub-viejo-1', '2026-10-13T15:00:00.000Z'])

  return { actual, copia }
}
