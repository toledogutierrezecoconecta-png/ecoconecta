import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { ProveedorAuth } from './hooks/useAuth'
import { Acceso } from './pages/Acceso'
import { ComoFunciona } from './pages/ComoFunciona'
import { DetalleResiduo } from './pages/DetalleResiduo'
import { Explorar } from './pages/Explorar'
import { Landing } from './pages/Landing'
import { NoEncontrada, Privacidad, Terminos } from './pages/Legales'
import { Panel } from './pages/Panel'
import { Precios } from './pages/Precios'
import { Perfil } from './pages/Perfil'
import { PublicarResiduo } from './pages/PublicarResiduo'

/** Al cambiar de ruta la vista vuelve arriba, como en una navegación real. */
function IrArriba() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

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
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/explorar" element={<Explorar />} />
              <Route path="/residuo/:id" element={<DetalleResiduo />} />
              <Route path="/publicar" element={<PublicarResiduo />} />
              <Route path="/acceso" element={<Acceso />} />
              <Route path="/panel" element={<Panel />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/como-funciona" element={<ComoFunciona />} />
              <Route path="/precios" element={<Precios />} />
              <Route path="/terminos" element={<Terminos />} />
              <Route path="/privacidad" element={<Privacidad />} />
              <Route path="*" element={<NoEncontrada />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </HashRouter>
    </ProveedorAuth>
  )
}
