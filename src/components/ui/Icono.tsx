import type { ReactNode } from 'react'

/**
 * Set de iconos dibujados a mano (SVG inline).
 *
 * Se evita una librería externa para no sumar peso ni dependencias: todos
 * heredan el color del texto y el grosor de trazo es uniforme, de modo que la
 * iconografía se ve consistente en toda la plataforma.
 */

export type NombreIcono =
  | 'reciclaje'
  | 'buscar'
  | 'menu'
  | 'cerrar'
  | 'filtro'
  | 'telefono'
  | 'correo'
  | 'ubicacion'
  | 'calendario'
  | 'balanza'
  | 'camion'
  | 'fabrica'
  | 'hoja'
  | 'gota'
  | 'caja'
  | 'tijera'
  | 'flecha'
  | 'check'
  | 'editar'
  | 'pausa'
  | 'reanudar'
  | 'basura'
  | 'ojo'
  | 'mas'
  | 'usuario'
  | 'salir'
  | 'alerta'
  | 'reloj'
  | 'etiqueta'
  | 'tienda'
  | 'chispa'
  | 'grafico'

const TRAZOS: Record<NombreIcono, ReactNode> = {
  reciclaje: (
    <>
      <path d="M12 3.5 9.3 8.2M12 3.5l2.7 4.7M12 3.5 9.7 4.9" />
      <path d="m5 18 2.7-4.7M5 18h5.4M5 18l1.3-2.4" />
      <path d="M19 18h-5.4M19 18l-2.7-4.7M19 18l-1.3-2.4" />
      <path d="m7.7 13.3-2.6-1.5M16.3 13.3l2.6-1.5M13.6 18l-1.6 2.6" />
    </>
  ),
  buscar: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  cerrar: <path d="m6 6 12 12M18 6 6 18" />,
  filtro: <path d="M4 6h16M7 12h10M10 18h4" />,
  telefono: (
    <path d="M6.5 4h3l1.5 4-2 1.3a12 12 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" />
  ),
  correo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7.5 8 5.5 8-5.5" />
    </>
  ),
  ubicacion: (
    <>
      <path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </>
  ),
  balanza: (
    <>
      <path d="M12 4v16M7 20h10M4 9h16" />
      <path d="M4 9 1.8 14.5h4.4L4 9ZM20 9l-2.2 5.5h4.4L20 9Z" />
    </>
  ),
  camion: (
    <>
      <path d="M3 7h10v8H3zM13 10h4l3 3v2h-7z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  fabrica: (
    <>
      <path d="M3 20V11l5 3V11l5 3V8l8 4v8z" />
      <path d="M3 20h18" />
    </>
  ),
  hoja: (
    <>
      <path d="M20 4c0 9-5.5 13-10.5 13A4.5 4.5 0 0 1 5 12.5C5 7 11 4 20 4Z" />
      <path d="M15 9 5.5 19" />
    </>
  ),
  gota: <path d="M12 3.5c3.5 4 5.5 6.6 5.5 9.3a5.5 5.5 0 1 1-11 0c0-2.7 2-5.3 5.5-9.3Z" />,
  caja: (
    <>
      <path d="M3.5 8 12 4l8.5 4v8L12 20l-8.5-4z" />
      <path d="M3.5 8 12 12l8.5-4M12 12v8" />
    </>
  ),
  tijera: (
    <>
      <circle cx="6.5" cy="17" r="2.4" />
      <circle cx="17.5" cy="17" r="2.4" />
      <path d="M8.3 15.3 18 4M15.7 15.3 6 4" />
    </>
  ),
  flecha: <path d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  editar: <path d="M4 20h4l10-10-4-4L4 16zM14 6l4 4" />,
  pausa: <path d="M9 5v14M15 5v14" />,
  reanudar: <path d="M7 4.5v15l13-7.5z" />,
  basura: (
    <>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
      <path d="M10.5 11v5M13.5 11v5" />
    </>
  ),
  ojo: (
    <>
      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  mas: <path d="M12 5v14M5 12h14" />,
  usuario: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  salir: <path d="M14 4h4.5v16H14M10 8l-4 4 4 4M6 12h9" />,
  alerta: (
    <>
      <path d="M12 4 2.8 20h18.4z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  etiqueta: (
    <>
      <path d="M4 4h7.5l8.5 8.5-7.5 7.5L4 11.5z" />
      <circle cx="8.5" cy="8.5" r="1.3" />
    </>
  ),
  tienda: (
    <>
      <path d="M4 9.5V20h16V9.5M3 9.5 5 4h14l2 5.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  chispa: <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9L4.5 10.8 10.2 9z" />,
  grafico: <path d="M4 20V4M4 20h16M8 16V9M12.5 16v-4.5M17 16V7" />,
}

interface PropsIcono {
  nombre: NombreIcono
  className?: string
}

export function Icono({ nombre, className = 'h-5 w-5' }: PropsIcono) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {TRAZOS[nombre]}
    </svg>
  )
}

/** Logotipo de WhatsApp: necesita relleno sólido, va aparte del resto. */
export function IconoWhatsApp({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.55-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04s.87 2.37.99 2.53c.12.16 1.71 2.61 4.15 3.66.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  )
}
