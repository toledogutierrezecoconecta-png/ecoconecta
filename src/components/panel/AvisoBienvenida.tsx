import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { tomarBienvenida } from '../../services/bienvenida'
import type { Bienvenida } from '../../services/bienvenida'
import { Icono } from '../ui/Icono'

/**
 * Aviso que aparece una sola vez, justo después de registrarse, para contar
 * que se envió el correo de confirmación (o que no se pudo enviar).
 */
export function AvisoBienvenida() {
  const { pathname } = useLocation()
  const [bienvenida, setBienvenida] = useState<Bienvenida | null>(null)

  // Se revisa al llegar a cada página: el registro deja el aviso y redirige.
  // tomarBienvenida lo borra, así que aparece una sola vez y se va al cambiar de página.
  useEffect(() => {
    setBienvenida(tomarBienvenida())
  }, [pathname])

  if (!bienvenida) return null

  return (
    <div className="contenedor pt-6">
      <div className="flex items-start gap-3 rounded-2xl border border-marca-200 bg-marca-50 p-4 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-marca-600">
          <Icono nombre="correo" className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-marca-800">¡Bienvenido a EcoConecta SCZ!</p>
          <p className="mt-0.5 text-sm text-marca-800/85">
            {bienvenida.correoEnviado ? (
              <>
                Te enviamos un correo de confirmación a{' '}
                <strong className="break-all">{bienvenida.correo}</strong>. Si no lo ves, revisá
                la carpeta de spam.
              </>
            ) : (
              'Tu cuenta quedó creada. No pudimos enviarte el correo de confirmación, pero ya podés usar la plataforma.'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setBienvenida(null)}
          className="rounded-lg p-1 text-marca-700 hover:bg-white"
          aria-label="Cerrar aviso"
        >
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
