import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { AvisoBienvenida } from './components/panel/AvisoBienvenida'
import { ProveedorAuth } from './hooks/useAuth'
import { Acceso } from './pages/Acceso'
import { Admin } from './pages/Admin'
import { ComoFunciona } from './pages/ComoFunciona'
import { DetalleResiduo } from './pages/DetalleResiduo'
import { Explorar } from './pages/Explorar'
import { Landing } from './pages/Landing'
import { NoEncontrada, Privacidad, Terminos } from './pages/Legales'
import { Panel } from './pages/Panel'
import { Precios } from './pages/Precios'
import { Perfil } from './pages/Perfil'
import { PublicarResiduo } from './pages/PublicarResiduo'
import { Recuperar } from './pages/Recuperar'

/**
 * Al cambiar de ruta la vista vuelve arriba, como en una navegación real.
 * Si el enlace apunta a una sección (/como-funciona#preguntas), baja hasta ella.
 */
function IrArriba() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      return
    }

    // Se espera un cuadro para que la página nueva ya esté dibujada.
    const cuadro = requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(cuadro)
  }, [pathname, hash])

  return null
}

export default function App() {
  return (
    <ProveedorAuth>
      {/* HashRouter evita errores 404 al recargar en GitHub Pages. */}
      <HashRouter>
        <IrArriba />

        <div className="flex min-h-screen flex-col">
          <Navbar />

          <main className="flex-1">
            {/* Solo después de registrarse, en la página a la que vuelva. */}
            <AvisoBienvenida />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/explorar" element={<Explorar />} />
              <Route path="/residuo/:id" element={<DetalleResiduo />} />
              <Route path="/publicar" element={<PublicarResiduo />} />
              <Route path="/acceso" element={<Acceso />} />
              <Route path="/recuperar" element={<Recuperar />} />
              <Route path="/panel" element={<Panel />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/como-funciona" element={<ComoFunciona />} />
              <Route path="/precios" element={<Precios />} />
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/privacidad" element={<Privacidad />} />
              {/* Sin enlace público: se entra escribiendo /#/admin y pide la clave. */}
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NoEncontrada />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </HashRouter>
    </ProveedorAuth>
  )
}
