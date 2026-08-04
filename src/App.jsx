import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { DataProvider } from './context/DataContext';

// Importa a Sidebar globalmente
import Sidebar from './components/Sidebar';

// CARREGAMENTO PREGUIÇOSO (LAZY LOADING)
const LandingHero = lazy(() => import('./components/hero'));
const SobrePage = lazy(() => import('./components/SobrePage'));
const DashboardPainel = lazy(() => import('./components/DashboardPainel'));

// COMPONENTE DE TRANSIÇÃO (Área Principal)
const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-full flex flex-col relative"
    >
      {children}
    </motion.div>
  );
};

// ROTAS ANIMADAS E LAYOUT
function AnimatedRoutes() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="flex w-full min-h-screen bg-[#1c1c1c] overflow-hidden text-white font-sans">
      
      {/* 
        A Sidebar fica FIXA AQUI, fora da animação principal.
        Coloquei um AnimatePresence só para ela deslizar quando sairmos do Início.
      */}
      <AnimatePresence>
        {!isHome && (
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-screen z-50 flex-shrink-0"
          >
            <Sidebar 
              username="Gestor BA" 
              navOnly={location.pathname === '/sobre'} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* O container flex-1 onde as páginas de fato trocam */}
      <div className="flex-1 relative h-screen overflow-hidden bg-transparent">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><LandingHero /></PageWrapper>} />
            <Route path="/sobre" element={<PageWrapper><SobrePage darkMode={true} /></PageWrapper>} />
            <Route path="/territorios" element={<PageWrapper><DashboardPainel /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}

function MainApp() {
  return (
    <>
      <Helmet>
        <title>Painel Territorial CT&I | Governo da Bahia</title>
      </Helmet>
      <Suspense 
        fallback={
          <div className="flex flex-col items-center justify-center min-h-screen w-full gap-4 bg-[#1c1c1c]">
            <div className="w-8 h-8 border-2 border-white/10 border-t-[#9170FA] rounded-full animate-spin"></div>
          </div>
        }
      >
        <AnimatedRoutes />
      </Suspense>
    </>
  );
}

export default function AppWrapper() {
  return (
    <HelmetProvider>
      <Router>
        <DataProvider>
          <MainApp />
        </DataProvider>
      </Router>
    </HelmetProvider>
  );
}