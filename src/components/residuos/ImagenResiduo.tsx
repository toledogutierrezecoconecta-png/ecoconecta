import { useEffect, useState } from 'react'
import { fotoDeMaterial } from '../../data/imagenes'
import { obtenerFoto } from '../../services/imagenes'
import { Icono } from '../ui/Icono'
import type { NombreIcono } from '../ui/Icono'

/**
 * Imagen de una publicación.
 *
 * Si el oferente subió una foto, se muestra esa. Si no, se dibuja una
 * ilustración propia según el material: funciona sin conexión, nunca aparece
 * una imagen rota y el catálogo se ve uniforme.
 */

interface Ilustracion {
  icono: NombreIcono
  desde: string
  hasta: string
  tinta: string
}

const ILUSTRACIONES: Record<string, Ilustracion> = {
  'aceite-vegetal': { icono: 'gota', desde: '#fdf3d8', hasta: '#f3dda0', tinta: '#8a6a1f' },
  'posos-cafe': { icono: 'hoja', desde: '#efe4d8', hasta: '#d8bfa6', tinta: '#5f4830' },
  'restos-poda': { icono: 'hoja', desde: '#e4f2e6', hasta: '#bdddc6', tinta: '#16613c' },
  'descarte-frutas': { icono: 'hoja', desde: '#fbe9df', hasta: '#f3cdb6', tinta: '#a8542a' },
  'carton-prensado': { icono: 'caja', desde: '#f6ecdc', hasta: '#e4cba6', tinta: '#7d5f3d' },
  'pallets-madera': { icono: 'caja', desde: '#f2e6d4', hasta: '#dcc19a', tinta: '#6b4f31' },
  'retazos-plastico': { icono: 'gota', desde: '#e2eff2', hasta: '#bcdae2', tinta: '#2d6470' },
  'chatarra-metalica': { icono: 'fabrica', desde: '#e9ecee', hasta: '#c7ced3', tinta: '#414c53' },
  'retazos-textiles': { icono: 'tijera', desde: '#ece7f3', hasta: '#cfc4e2', tinta: '#4f4270' },
}

const POR_DEFECTO: Ilustracion = {
  icono: 'reciclaje',
  desde: '#eef7f1',
  hasta: '#c7e2d2',
  tinta: '#16613c',
}

interface PropsImagen {
  fotoId: string | null
  materialId: string
  titulo: string
  className?: string
  tamanoIcono?: string
}

export function ImagenResiduo({
  fotoId,
  materialId,
  titulo,
  className = 'h-44 w-full',
  tamanoIcono = 'h-14 w-14',
}: PropsImagen) {
  const [foto, setFoto] = useState<string | null>(null)
  const ilustracion = ILUSTRACIONES[materialId] ?? POR_DEFECTO

  useEffect(() => {
    let vigente = true
    if (!fotoId) {
      setFoto(null)
      return
    }

    void obtenerFoto(fotoId).then((valor) => {
      if (vigente) setFoto(valor)
    })

    return () => {
      vigente = false
    }
  }, [fotoId])

  // Prioridad: la foto que subió el oferente, luego la foto del material.
  const imagen = foto ?? fotoDeMaterial(materialId)

  if (imagen) {
    return <img src={imagen} alt={titulo} className={`${className} object-cover`} loading="lazy" />
  }

  // Último recurso: ilustración propia, por si se agrega un material sin foto.
  return (
    <div
      className={`${className} flex items-center justify-center`}
      style={{
        background: `linear-gradient(135deg, ${ilustracion.desde} 0%, ${ilustracion.hasta} 100%)`,
        color: ilustracion.tinta,
      }}
      role="img"
      aria-label={titulo}
    >
      <Icono nombre={ilustracion.icono} className={`${tamanoIcono} opacity-70`} />
    </div>
  )
}
