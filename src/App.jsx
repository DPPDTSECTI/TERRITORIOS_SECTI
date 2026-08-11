import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { DataProvider } from './context/DataContext';
import { Analytics } from '@vercel/analytics/react';

// Importa a Sidebar globalmente
import Sidebar from './components/Sidebar';

// CARREGAMENTO PREGUIÇOSO (LAZY LOADING)
const LandingHero = lazy(() => import('./components/hero'));
const SobrePage = lazy(() => import('./components/SobrePage'));
const DashboardPainel = lazy(() => import('./components/DashboardPainel'));

// ================= GERENCIADOR GLOBAL DE SCROLL =================
function GlobalScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem(`scroll-${pathname}`);
    
    if (savedScrollPosition) {
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedScrollPosition, 10),
          behavior: 'instant'
        });
      }, 0);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(`scroll-${window.location.pathname}`, window.scrollY);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
}

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
      {/* O SUSPENSE AGORA FICA AQUI: Abraça apenas o conteúdo da página! */}
      <Suspense 
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4 bg-transparent">
            <div className="w-8 h-8 border-2 border-white/10 border-t-[#9170FA] rounded-full animate-spin"></div>
          </div>
        }
      >
        {children}
      </Suspense>
    </motion.div>
  );
};

function AnimatedRoutes() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="flex w-full min-h-screen bg-[#1c1c1c] text-white font-sans overflow-x-clip">
      
      {/* SIDEBAR: Fica de fora do sistema de Rotas, garantindo que nunca pisque */}
      <AnimatePresence initial={false} mode="wait">
        {!isHome && (
          <motion.div
            key="global-sidebar"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-screen sticky top-0 z-50 flex-shrink-0"
          >
            <Sidebar 
              username="Gestor BA" 
              navOnly={location.pathname === '/sobre'} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ROTEADOR: Onde as páginas são renderizadas */}
      <div className="flex-1 relative min-h-screen bg-transparent">
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
      
      <GlobalScroll />
      <Analytics />

      {/* O Suspense foi removido daqui e levado para o PageWrapper */}
      <AnimatedRoutes />
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