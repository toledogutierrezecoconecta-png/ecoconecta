import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as servicioAuth from '../services/auth'
import * as repositorio from '../services/publicaciones'
import { alCambiarSesion } from '../services/sesion'
import type { CredencialesRegistro, PerfilEditable, Usuario } from '../types'

interface ContextoAuth {
  usuario: Usuario | null
  registrar: (credenciales: CredencialesRegistro) => Promise<Usuario>
  iniciarSesion: (correo: string, clave: string) => Promise<Usuario>
  cerrarSesion: () => void
  /** Guarda el perfil en la hoja. Devuelve cuántas publicaciones recibieron los datos nuevos. */
  actualizarPerfil: (cambios: PerfilEditable) => Promise<number>
}

const Contexto = createContext<ContextoAuth | null>(null)

/**
 * Mantiene la sesión viva entre recargas.
 *
 * La sesión se lee de localStorage al crear el estado, no en un efecto: así
 * ninguna pantalla se dibuja primero "sin usuario" (el perfil, por ejemplo,
 * armaba su formulario vacío al recargar la página). Si la hoja avisa que la
 * llave venció, la sesión se cierra en todas las pantallas.
 */
export function ProveedorAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => servicioAuth.obtenerSesion())

  useEffect(() => alCambiarSesion(() => setUsuario(servicioAuth.obtenerSesion())), [])

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

  const actualizarPerfil = useCallback(async (cambios: PerfilEditable) => {
    const { usuario: actualizado, publicacionesActualizadas } =
      await servicioAuth.actualizarPerfil(cambios)

    setUsuario(actualizado)
    // La hoja ya actualizó las publicaciones; se refleja también en la copia local.
    repositorio.actualizarDatosDeContacto(actualizado)
    return publicacionesActualizadas
  }, [])

  const valor = useMemo(
    () => ({ usuario, registrar, iniciarSesion, cerrarSesion, actualizarPerfil }),
    [usuario, registrar, iniciarSesion, cerrarSesion, actualizarPerfil],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useAuth debe usarse dentro de ProveedorAuth.')
  return contexto
}
