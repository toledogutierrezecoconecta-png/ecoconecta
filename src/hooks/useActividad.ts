import { useSyncExternalStore } from 'react'
import * as actividad from '../services/actividad'
import { useAuth } from './useAuth'

/** Guardados y contactos realizados del usuario actual (o del visitante sin sesión). */
export function useActividad() {
  const { usuario } = useAuth()
  useSyncExternalStore(actividad.suscribir, actividad.versionActual)

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
