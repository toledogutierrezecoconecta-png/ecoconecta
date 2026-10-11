import { Libro } from './simulador.mjs'

/** Hoja con la forma que tiene hoy la planilla real (antes de esta versión). */
export function libroComoElReal() {
  const libro = new Libro()
  const usuarios = libro.insertSheet('Usuarios')
  usuarios.appendRow(['id', 'empresa', 'contacto', 'telefono', 'correo', 'tipo', 'creadoEn'])
  usuarios.appendRow(['usr-viejo-1', 'Pollos Prueba', 'Marcela Prueba', '70000010', 'pollos@ejemplo.test', 'oferente', '2026-09-23T13:00:00.000Z'])
  usuarios.appendRow(['usr-viejo-2', 'Mendez Prueba', 'Franz Prueba', '70000011', 'mendez@ejemplo.test', 'oferente', '2026-09-23T16:00:00.000Z'])

  const publicaciones = libro.insertSheet('Publicaciones')
  const columnas = ['id', 'titulo', 'categoriaId', 'materialId', 'descripcion', 'cantidad', 'unidad', 'frecuencia', 'zona', 'direccion', 'modalidadPrecio', 'valorEstimadoMin', 'valorEstimadoMax', 'fechaDisponible', 'estado', 'contactos', 'usuarioId', 'empresa', 'contacto', 'telefono', 'creadaEn', 'origen']
  publicaciones.appendRow(columnas)
  const fila = (id, usuarioId, empresa, telefono) => columnas.map((c) => ({ id, titulo: 'Aceite ' + id, categoriaId: 'organicos', materialId: 'aceite-vegetal', descripcion: 'Aceite filtrado de prueba', cantidad: '50', unidad: 'litros', frecuencia: 'Semanal', zona: 'DM-1', direccion: 'Prueba', modalidadPrecio: 'referencia', valorEstimadoMin: '90', valorEstimadoMax: '125', fechaDisponible: '2026-09-23', estado: 'disponible', contactos: '0', usuarioId, empresa, contacto: 'X', telefono, creadaEn: '2026-09-23T13:20:01.607Z', origen: 'usuario' })[c])
  publicaciones.appendRow(fila('pub-viejo-1', 'usr-viejo-1', 'Pollos Prueba', '70000010'))
  publicaciones.appendRow(fila('pub-viejo-2', 'usr-viejo-2', 'Mendez Prueba', '70000011'))

  const contactos = libro.insertSheet('Contactos')
  contactos.appendRow(['publicacionId', 'fecha'])
  return libro
}
