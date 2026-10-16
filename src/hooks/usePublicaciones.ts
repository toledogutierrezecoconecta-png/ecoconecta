import { useCallback, useEffect, useState } from 'react'
import * as repositorio from '../services/publicaciones'
import type { BorradorPublicacion, EstadoPublicacion, MedioContacto, Publicacion, Usuario } from '../types'

/**
 * Estado compartido de las publicaciones.
 *
 * Cada vez que se crea, edita o elimina algo se vuelve a leer del repositorio,
 * de modo que todas las pantallas muestren siempre lo mismo. `pendientes`
 * cuenta los cambios que la hoja todavía no confirmó.
 */
export function usePublicaciones() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [pendientes, setPendientes] = useState(repositorio.contarPendientes)

  const recargar = useCallback(async () => {
    const datos = await repositorio.listarPublicaciones()
    setPublicaciones(datos)
    setPendientes(repositorio.contarPendientes())
    setCargando(false)
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  /** Actualiza la pantalla ya, y otra vez cuando la hoja confirma el cambio. */
  const aplicar = useCallback(
    async <T,>(resultado: repositorio.Resultado<T>): Promise<T> => {
      await recargar()
      void resultado.confirmacion.then(() => setPendientes(repositorio.contarPendientes()))
      return resultado.valor
    },
    [recargar],
  )

  const crear = useCallback(
    async (borrador: BorradorPublicacion, usuario: Usuario) =>
      aplicar(await repositorio.crearPublicacion(borrador, usuario)),
    [aplicar],
  )

  const actualizar = useCallback(
    async (id: string, cambios: Partial<Publicacion>) =>
      aplicar(await repositorio.actualizarPublicacion(id, cambios)),
    [aplicar],
  )

  const cambiarEstado = useCallback(
    async (id: string, estado: EstadoPublicacion) => {
      await aplicar(await repositorio.cambiarEstado(id, estado))
    },
    [aplicar],
  )

  const eliminar = useCallback(
    async (id: string) => aplicar(await repositorio.eliminarPublicacion(id)),
    [aplicar],
  )

  const contactar = useCallback(
    async (id: string, medio: MedioContacto) => {
      await repositorio.registrarContacto(id, medio)
      await recargar()
    },
    [recargar],
  )

  return {
    publicaciones,
    cargando,
    pendientes,
    recargar,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
    contactar,
  }
}
