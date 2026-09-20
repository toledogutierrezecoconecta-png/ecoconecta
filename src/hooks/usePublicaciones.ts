import { useCallback, useEffect, useState } from 'react'
import * as repositorio from '../services/publicaciones'
import type { BorradorPublicacion, EstadoPublicacion, Publicacion, Usuario } from '../types'

/**
 * Estado compartido de las publicaciones.
 *
 * Cada vez que se crea, edita o elimina algo se vuelve a leer del repositorio,
 * de modo que todas las pantallas muestren siempre lo mismo.
 */
export function usePublicaciones() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [cargando, setCargando] = useState(true)

  const recargar = useCallback(async () => {
    const datos = await repositorio.listarPublicaciones()
    setPublicaciones(datos)
    setCargando(false)
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  const crear = useCallback(
    async (borrador: BorradorPublicacion, usuario: Usuario) => {
      const nueva = await repositorio.crearPublicacion(borrador, usuario)
      await recargar()
      return nueva
    },
    [recargar],
  )

  const actualizar = useCallback(
    async (id: string, cambios: Partial<Publicacion>) => {
      const actualizada = await repositorio.actualizarPublicacion(id, cambios)
      await recargar()
      return actualizada
    },
    [recargar],
  )

  const cambiarEstado = useCallback(
    async (id: string, estado: EstadoPublicacion) => {
      await repositorio.cambiarEstado(id, estado)
      await recargar()
    },
    [recargar],
  )

  const eliminar = useCallback(
    async (id: string) => {
      await repositorio.eliminarPublicacion(id)
      await recargar()
    },
    [recargar],
  )

  const contactar = useCallback(
    async (id: string) => {
      await repositorio.registrarContacto(id)
      await recargar()
    },
    [recargar],
  )

  const restablecerDemostracion = useCallback(async () => {
    repositorio.restablecerDemostracion()
    await recargar()
  }, [recargar])

  return {
    publicaciones,
    cargando,
    recargar,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
    contactar,
    restablecerDemostracion,
  }
}
