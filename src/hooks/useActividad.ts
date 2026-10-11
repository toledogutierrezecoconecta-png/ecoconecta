import { useEffect, useSyncExternalStore } from 'react'
import * as actividad from '../services/actividad'
import { useAuth } from './useAuth'

/**
 * Guardados y contactos realizados del usuario actual (o del visitante sin
 * sesión). Con sesión, la primera vez que se usa en la visita los trae de la hoja.
 */
export function useActividad() {
  const { usuario } = useAuth()
  useSyncExternalStore(actividad.suscribir, actividad.versionActual)

  useEffect(() => {
    if (usuario) void actividad.sincronizarActividad(usuario.id)
  }, [usuario])

  const visitante = usuario?.id ?? actividad.VISITANTE_ANONIMO
  const guardados = actividad.obtenerGuardados(visitante)

  return {
    guardados,
    contactos: actividad.obtenerContactos(visitante),
    estaGuardada: (publicacionId: string) => guardados.includes(publicacionId),
    alternarGuardado: (publicacionId: string) =>
      actividad.alternarGuardado(visitante, publicacionId),
    anotarContacto: (publicacionId: string) => actividad.anotarContacto(visitante, publicacionId),
  }
}
