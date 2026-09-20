/**
 * Manejo de fotos de las publicaciones.
 *
 * Una foto tomada con celular pesa entre 3 y 8 MB en base64, mientras que la
 * cuota de localStorage ronda los 5 MB: guardarlas ahí rompe la aplicación en
 * la segunda subida. Por eso acá se hacen dos cosas:
 *
 *   1. La imagen se redimensiona y recomprime en un canvas (~100 KB).
 *   2. El resultado se guarda en IndexedDB, que no compite con localStorage.
 *
 * Al migrar a un backend real, este módulo se reemplaza por subidas a
 * Supabase Storage, Firebase Storage o S3 sin tocar el resto de la aplicación.
 */

const BASE_DATOS = 'ecoconecta'
const ALMACEN = 'fotos'
const ANCHO_MAXIMO = 900
const CALIDAD = 0.72

function abrirBase(): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    const solicitud = indexedDB.open(BASE_DATOS, 1)
    solicitud.onupgradeneeded = () => {
      const base = solicitud.result
      if (!base.objectStoreNames.contains(ALMACEN)) base.createObjectStore(ALMACEN)
    }
    solicitud.onsuccess = () => resolver(solicitud.result)
    solicitud.onerror = () => rechazar(solicitud.error)
  })
}

/** Reduce la imagen a un ancho máximo y la devuelve como data URL JPEG. */
export function comprimirImagen(archivo: File): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader()

    lector.onload = () => {
      const imagen = new Image()

      imagen.onload = () => {
        const escala = Math.min(1, ANCHO_MAXIMO / imagen.width)
        const lienzo = document.createElement('canvas')
        lienzo.width = Math.round(imagen.width * escala)
        lienzo.height = Math.round(imagen.height * escala)

        const contexto = lienzo.getContext('2d')
        if (!contexto) {
          rechazar(new Error('No se pudo procesar la imagen en este navegador.'))
          return
        }

        contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
        resolver(lienzo.toDataURL('image/jpeg', CALIDAD))
      }

      imagen.onerror = () => rechazar(new Error('El archivo no es una imagen válida.'))
      imagen.src = String(lector.result)
    }

    lector.onerror = () => rechazar(new Error('No se pudo leer el archivo.'))
    lector.readAsDataURL(archivo)
  })
}

export async function guardarFoto(dataUrl: string): Promise<string> {
  const clave = `foto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  try {
    const base = await abrirBase()
    await new Promise<void>((resolver, rechazar) => {
      const transaccion = base.transaction(ALMACEN, 'readwrite')
      transaccion.objectStore(ALMACEN).put(dataUrl, clave)
      transaccion.oncomplete = () => resolver()
      transaccion.onerror = () => rechazar(transaccion.error)
    })
    base.close()
    return clave
  } catch (error) {
    console.warn('[EcoConecta SCZ] No se pudo guardar la foto.', error)
    throw error
  }
}

export async function obtenerFoto(clave: string): Promise<string | null> {
  try {
    const base = await abrirBase()
    const valor = await new Promise<string | null>((resolver, rechazar) => {
      const transaccion = base.transaction(ALMACEN, 'readonly')
      const solicitud = transaccion.objectStore(ALMACEN).get(clave)
      solicitud.onsuccess = () => resolver((solicitud.result as string) ?? null)
      solicitud.onerror = () => rechazar(solicitud.error)
    })
    base.close()
    return valor
  } catch {
    return null
  }
}

export async function eliminarFoto(clave: string): Promise<void> {
  try {
    const base = await abrirBase()
    await new Promise<void>((resolver) => {
      const transaccion = base.transaction(ALMACEN, 'readwrite')
      transaccion.objectStore(ALMACEN).delete(clave)
      transaccion.oncomplete = () => resolver()
      transaccion.onerror = () => resolver()
    })
    base.close()
  } catch {
    /* Si falla la eliminación no hay nada que reportar al usuario. */
  }
}
