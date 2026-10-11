import { useCallback, useSyncExternalStore } from 'react'

/**
 * true mientras la pantalla cumple la media query, y se actualiza si cambia
 * (por ejemplo, al girar el celular o achicar la ventana).
 */
export function useMediaQuery(consulta: string): boolean {
  const suscribir = useCallback(
    (avisar: () => void) => {
      const lista = window.matchMedia(consulta)
      lista.addEventListener('change', avisar)
      return () => lista.removeEventListener('change', avisar)
    },
    [consulta],
  )

  return useSyncExternalStore(suscribir, () => window.matchMedia(consulta).matches)
}
