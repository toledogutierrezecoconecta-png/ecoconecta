import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as servicioAuth from '../services/auth'
import type { CredencialesRegistro, Usuario } from '../types'

interface ContextoAuth {
  usuario: Usuario | null
  cargando: boolean
  registrar: (credenciales: CredencialesRegistro) => Promise<Usuario>
  iniciarSesion: (correo: string, clave: string) => Promise<Usuario>
  cerrarSesion: () => void
  actualizarPerfil: (cambios: Partial<Usuario>) => void
}

const Contexto = createContext<ContextoAuth | null>(null)

/** Mantiene la sesión viva entre recargas leyendo localStorage al montar. */
export function ProveedorAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setUsuario(servicioAuth.obtenerSesion())
    setCargando(false)
  }, [])

  const registrar = useCallback(async (credenciales: CredencialesRegistro) => {
    const nuevo = await servicioAuth.registrar(credenciales)
    setUsuario(nuevo)
    return nuevo
  }, [])

  const iniciarSesion = useCallback(async (correo: string, clave: string) => {
    const encontrado = await servicioAuth.iniciarSesion(correo, clave)
    setUsuario(encontrado)
    return encontrado
  }, [])

  const cerrarSesion = useCallback(() => {
    servicioAuth.cerrarSesion()
    setUsuario(null)
  }, [])

  const actualizarPerfil = useCallback((cambios: Partial<Usuario>) => {
    const actualizado = servicioAuth.actualizarPerfil(cambios)
    if (actualizado) setUsuario(actualizado)
  }, [])

  const valor = useMemo(
    () => ({ usuario, cargando, registrar, iniciarSesion, cerrarSesion, actualizarPerfil }),
    [usuario, cargando, registrar, iniciarSesion, cerrarSesion, actualizarPerfil],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useAuth debe usarse dentro de ProveedorAuth.')
  return contexto
}
