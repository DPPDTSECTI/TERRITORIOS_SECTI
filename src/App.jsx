import React, { Suspense, lazy, useEffect, useContext, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { DataProvider, DataContext } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { Analytics } from '@vercel/analytics/react';

import Sidebar from './components/Sidebar';
import TourGuide from './components/TourGuide';
import AccessibilityBar from './components/AccessibilityBar';
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

const MAGMA_ORBS_CONFIG = [
  {
    sizeClass: 'w-[42vw] h-[42vw] min-w-[380px] min-h-[380px] max-w-[660px] max-h-[660px]',
    normalBg: 'radial-gradient(circle, rgba(37, 99, 235, 0.32) 0%, rgba(59, 130, 246, 0.17) 36%, rgba(56, 189, 248, 0.06) 58%, transparent 74%)',
    semiBg: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.09) 36%, rgba(245, 158, 11, 0.03) 58%, transparent 74%)'
  },
  {
    sizeClass: 'w-[44vw] h-[44vw] min-w-[400px] min-h-[400px] max-w-[700px] max-h-[700px]',
    normalBg: 'radial-gradient(circle, rgba(56, 189, 248, 0.34) 0%, rgba(37, 99, 235, 0.18) 36%, rgba(56, 189, 248, 0.06) 58%, transparent 74%)',
    semiBg: 'radial-gradient(circle, rgba(251, 191, 36, 0.18) 0%, rgba(245, 158, 11, 0.09) 36%, rgba(251, 191, 36, 0.03) 58%, transparent 74%)'
  },
  {
    sizeClass: 'w-[40vw] h-[40vw] min-w-[360px] min-h-[360px] max-w-[620px] max-h-[620px]',
    normalBg: 'radial-gradient(circle, rgba(14, 165, 233, 0.30) 0%, rgba(56, 189, 248, 0.16) 36%, rgba(14, 165, 233, 0.05) 58%, transparent 74%)',
    semiBg: 'radial-gradient(circle, rgba(217, 119, 6, 0.16) 0%, rgba(245, 158, 11, 0.08) 36%, rgba(217, 119, 6, 0.03) 58%, transparent 74%)'
  },
  {
    sizeClass: 'w-[38vw] h-[38vw] min-w-[340px] min-h-[340px] max-w-[580px] max-h-[580px]',
    normalBg: 'radial-gradient(circle, rgba(59, 130, 246, 0.30) 0%, rgba(37, 99, 235, 0.16) 36%, rgba(96, 165, 250, 0.05) 58%, transparent 74%)',
    semiBg: 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(251, 191, 36, 0.08) 36%, rgba(245, 158, 11, 0.03) 58%, transparent 74%)'
  },
  {
    sizeClass: 'w-[34vw] h-[34vw] min-w-[300px] min-h-[300px] max-w-[520px] max-h-[520px]',
    normalBg: 'radial-gradient(circle, rgba(96, 165, 250, 0.28) 0%, rgba(14, 165, 233, 0.15) 36%, rgba(59, 130, 246, 0.05) 58%, transparent 74%)',
    semiBg: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, rgba(217, 119, 6, 0.08) 36%, rgba(245, 158, 11, 0.03) 58%, transparent 74%)'
  }
];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function generateRandomState() {
  const x = randomBetween(-14, 72);
  const y = randomBetween(-16, 68);
  const sx = randomBetween(0.76, 1.34);
  const sy = randomBetween(0.76, 1.34);
  const rot = randomBetween(-35, 35);
  return `translate3d(${x.toFixed(1)}vw, ${y.toFixed(1)}vh, 0) rotate(${rot.toFixed(1)}deg) scale3d(${sx.toFixed(2)}, ${sy.toFixed(2)}, 1)`;
}

function MagmaLampBackground({ filtroSemiarido }) {
  const orbRefs = useRef([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let cancelled = false;
    const activeAnimations = [];

    orbRefs.current.forEach((el, idx) => {
      if (!el || typeof el.animate !== 'function') return;

      let currentTransform = generateRandomState();
      el.style.transform = currentTransform;

      const runNextLeg = () => {
        if (cancelled || !el) return;
        const midTransform1 = generateRandomState();
        const midTransform2 = generateRandomState();
        const nextTransform = generateRandomState();
        const duration = Math.round(randomBetween(11000, 21000));

        const anim = el.animate(
          [
            { transform: currentTransform },
            { transform: midTransform1, offset: randomBetween(0.28, 0.42) },
            { transform: midTransform2, offset: randomBetween(0.62, 0.78) },
            { transform: nextTransform }
          ],
          {
            duration,
            easing: 'cubic-bezier(0.42, 0, 0.58, 1)',
            fill: 'forwards'
          }
        );

        activeAnimations[idx] = anim;
        anim.onfinish = () => {
          currentTransform = nextTransform;
          runNextLeg();
        };
      };

      runNextLeg();
    });

    return () => {
      cancelled = true;
      activeAnimations.forEach((a) => {
        try {
          a?.cancel();
        } catch {
          // ignore
        }
      });
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-html2canvas-ignore="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 print:hidden select-none"
    >
      {MAGMA_ORBS_CONFIG.map((orb, idx) => (
        <div
          key={idx}
          ref={(el) => {
            orbRefs.current[idx] = el;
          }}
          className={`absolute top-0 left-0 rounded-full ${orb.sizeClass}`}
          style={{
            background: filtroSemiarido ? orb.semiBg : orb.normalBg
          }}
        />
      ))}
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const { filtroSemiarido } = useContext(DataContext) || {};
  const isHome = location.pathname === '/';
  const isPrintPage = location.pathname.startsWith('/relatorio/');
  const hideNavigation = isHome || isPrintPage;

  useEffect(() => {
    document.body.classList.toggle('route-print', isPrintPage);
    return () => {
      document.body.classList.remove('route-print');
    };
  }, [isPrintPage]);

  return (
    <div className={`flex w-full relative ${isHome ? 'min-h-screen bg-background text-text-primary overflow-x-clip' : 'h-dvh bg-background text-text-primary overflow-hidden'} font-sans print:h-auto print:overflow-visible print:bg-transparent`}>
      {!isPrintPage && <AccessibilityBar showFloatingButton={isHome} />}
      {/* ATMOSFERA GLOBAL: ESFERAS ALEATORIZADAS ESTILO LANTERNA DE MAGMA */}
      {!hideNavigation && <MagmaLampBackground filtroSemiarido={filtroSemiarido} />}
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
        <title>Painel Territorial CT&I · SECTI</title>
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