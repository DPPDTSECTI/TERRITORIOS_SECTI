import React, { Suspense, lazy, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { DataProvider, DataContext } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { Analytics } from '@vercel/analytics/react';

import Sidebar from './components/Sidebar';
import TourGuide from './components/TourGuide';
import { ToastProvider, Skeleton, KpiSkeleton } from './components/ui';

// CARREGAMENTO PREGUIÇOSO (LAZY LOADING)
const LandingHero = lazy(() => import('./components/hero'));
const SobrePage = lazy(() => import('./components/SobrePage'));
const DashboardPainel = lazy(() => import('./components/DashboardPainel'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const AtivosPage = lazy(() => import('./components/AtivosPage'));
const CadeiaPage = lazy(() => import('./components/CadeiaPage'));
const CursosPage = lazy(() => import('./components/CursosPage'));
const RelatorioPage = lazy(() => import('./components/RelatorioPage'));
const RelatorioCursosPage = lazy(() => import('./components/pdf/RelatorioEnsino'));
const RelatorioAtivosPage = lazy(() => import('./components/pdf/RelatorioAtivos'));
const RelatorioCadeias = lazy(() => import('./components/pdf/RelatorioCadeias'));
const RelatorioSintesePage = lazy(() => import('./components/pdf/RelatorioSintese'));
const RelatorioAnalisePage = lazy(() => import('./components/pdf/RelatorioAnalise'));
const UiShowcasePage = lazy(() => import('./components/ui/UiShowcasePage'));

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
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return null;
}



// COMPONENTE DE TRANSIÇÃO E SKELETON DE PÁGINA
const PageLoadingFallback = () => (
  <div className="w-full h-full p-6 sm:p-8 space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiSkeleton />
      <KpiSkeleton />
      <KpiSkeleton />
      <KpiSkeleton />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
      <div className="lg:col-span-2 h-72 bg-surface border border-border rounded-card p-5 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-48 w-full rounded-control" />
      </div>
      <div className="h-72 bg-surface border border-border rounded-card p-5 space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </div>
);

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transitionEnd: { transform: 'none' } }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full flex flex-col relative"
    >
      <Suspense fallback={<PageLoadingFallback />}>
        {children}
      </Suspense>
    </motion.div>
  );
};

function AnimatedRoutes() {
  const location = useLocation();
  const { filtroSemiarido } = useContext(DataContext) || {};
  const isHome = location.pathname === '/';
  const isPrintPage = location.pathname.startsWith('/relatorio/');
  const hideNavigation = isHome || isPrintPage;

  return (
    <div className={`flex w-full relative ${isHome ? 'min-h-screen bg-background text-text-primary overflow-x-clip' : 'h-dvh bg-background text-text-primary overflow-hidden'} font-sans print:h-auto print:overflow-visible print:bg-transparent`}>
      {/* ATMOSFERA GLOBAL: ESFERAS SUTIS ESTILO LANTERNA DE MAGMA */}
      {!hideNavigation && (
        <div
          aria-hidden="true"
          data-html2canvas-ignore="true"
          className="pointer-events-none fixed inset-0 overflow-hidden z-0 print:hidden select-none"
        >
          {/* Esfera 1 — Topo Esquerdo / Centro */}
          <div
            className="
              absolute -top-[10%] left-[8%]
              w-[42vw] h-[42vw] min-w-[380px] min-h-[380px] max-w-[660px] max-h-[660px]
              rounded-full animate-magma-1
            "
            style={{
              background: filtroSemiarido
                ? 'radial-gradient(circle, rgba(245, 158, 11, 0.30) 0%, rgba(217, 119, 6, 0.16) 36%, rgba(245, 158, 11, 0.05) 58%, transparent 74%)'
                : 'radial-gradient(circle, rgba(37, 99, 235, 0.32) 0%, rgba(59, 130, 246, 0.17) 36%, rgba(56, 189, 248, 0.06) 58%, transparent 74%)'
            }}
          />

          {/* Esfera 2 — Topo / Direita */}
          <div
            className="
              absolute top-[8%] right-[2%]
              w-[44vw] h-[44vw] min-w-[400px] min-h-[400px] max-w-[700px] max-h-[700px]
              rounded-full animate-magma-2
            "
            style={{
              background: filtroSemiarido
                ? 'radial-gradient(circle, rgba(251, 191, 36, 0.30) 0%, rgba(245, 158, 11, 0.16) 36%, rgba(251, 191, 36, 0.05) 58%, transparent 74%)'
                : 'radial-gradient(circle, rgba(56, 189, 248, 0.34) 0%, rgba(37, 99, 235, 0.18) 36%, rgba(56, 189, 248, 0.06) 58%, transparent 74%)'
            }}
          />

          {/* Esfera 3 — Centro / Esquerda */}
          <div
            className="
              absolute -bottom-[12%] left-[4%]
              w-[40vw] h-[40vw] min-w-[360px] min-h-[360px] max-w-[620px] max-h-[620px]
              rounded-full animate-magma-3
            "
            style={{
              background: filtroSemiarido
                ? 'radial-gradient(circle, rgba(217, 119, 6, 0.28) 0%, rgba(245, 158, 11, 0.14) 36%, rgba(217, 119, 6, 0.05) 58%, transparent 74%)'
                : 'radial-gradient(circle, rgba(14, 165, 233, 0.30) 0%, rgba(56, 189, 248, 0.16) 36%, rgba(14, 165, 233, 0.05) 58%, transparent 74%)'
            }}
          />

          {/* Esfera 4 — Base Direita / Centro */}
          <div
            className="
              absolute bottom-[0%] right-[14%]
              w-[38vw] h-[38vw] min-w-[340px] min-h-[340px] max-w-[580px] max-h-[580px]
              rounded-full animate-magma-4
            "
            style={{
              background: filtroSemiarido
                ? 'radial-gradient(circle, rgba(245, 158, 11, 0.28) 0%, rgba(251, 191, 36, 0.14) 36%, rgba(245, 158, 11, 0.05) 58%, transparent 74%)'
                : 'radial-gradient(circle, rgba(59, 130, 246, 0.30) 0%, rgba(37, 99, 235, 0.16) 36%, rgba(96, 165, 250, 0.05) 58%, transparent 74%)'
            }}
          />
        </div>
      )}
      {/* SIDEBAR GLOBAL */}
      <AnimatePresence initial={false} mode="wait">
        {!hideNavigation && (
          <motion.div
            key="global-sidebar"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1, transitionEnd: { transform: 'none' } }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-dvh sticky top-0 z-50 flex-shrink-0 print:hidden"
          >
            <Sidebar
              username="PTI Bahia"
              navOnly={location.pathname === '/sobre'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ÁREA PRINCIPAL */}
      <div className={`flex-1 min-w-0 relative ${isHome ? 'min-h-screen' : 'h-dvh overflow-hidden'} bg-transparent print:h-auto print:overflow-visible`}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><LandingHero /></PageWrapper>} />
            <Route path="/sobre" element={<PageWrapper><SobrePage /></PageWrapper>} />
            <Route path="/territorios" element={<PageWrapper><DashboardPainel /></PageWrapper>} />
            <Route path="/ativos" element={<PageWrapper><AtivosPage /></PageWrapper>} />
            <Route path="/cadeia" element={<PageWrapper><CadeiaPage /></PageWrapper>} />
            <Route path="/cursos" element={<PageWrapper><CursosPage /></PageWrapper>} />
            <Route path="/relatorio" element={<PageWrapper><RelatorioPage /></PageWrapper>} />
            <Route path="/admin" element={<PageWrapper><AdminPage /></PageWrapper>} />

            {/* ROTAS DE RELATÓRIO EXECUTIVO / PDF */}
            <Route path="/relatorio/sintese" element={<PageWrapper><RelatorioSintesePage /></PageWrapper>} />
            <Route path="/relatorio/cursos" element={<PageWrapper><RelatorioCursosPage /></PageWrapper>} />
            <Route path="/relatorio/ativos" element={<PageWrapper><RelatorioAtivosPage /></PageWrapper>} />
            <Route path="/relatorio/cadeias" element={<PageWrapper><RelatorioCadeias /></PageWrapper>} />
            <Route path="/relatorio/analise" element={<PageWrapper><RelatorioAnalisePage /></PageWrapper>} />

            {/* VITRINE DE COMPONENTES UI (DEV ONLY) */}
            {import.meta.env.DEV && (
              <Route path="/__ui" element={<PageWrapper><UiShowcasePage /></PageWrapper>} />
            )}
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

      <TourGuide />
      <GlobalScroll />
      <Analytics />

      <AnimatedRoutes />
    </>
  );
}

export default function AppWrapper() {
  return (
    <MotionConfig reducedMotion="user">
      <HelmetProvider>
        <ThemeProvider>
          <Router>
            <DataProvider>
              <ToastProvider>
                <MainApp />
              </ToastProvider>
            </DataProvider>
          </Router>
        </ThemeProvider>
      </HelmetProvider>
    </MotionConfig>
  );
}