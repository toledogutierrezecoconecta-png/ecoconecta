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
