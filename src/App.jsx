import React, { Suspense, lazy, useEffect, useState, useRef, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AnimatePresence, motion } from 'framer-motion';
import { DataProvider, DataContext } from './context/DataContext';
import { Analytics } from '@vercel/analytics/react';
import { supabase } from './services/supabase';

export function useDadosSupabase() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from('stats_ti') 
        .select('*');

      if (error) {
        console.error("Erro ao buscar no Supabase:", error);
      } else {
        setDados(data);
      }
      setCarregando(false);
    }
    
    carregar();
  }, []);

  return { dados, carregando };
}

// Importações Globais
import Sidebar from './components/Sidebar';
import UserHeaderProfile from './components/UserHeaderProfile';

// CARREGAMENTO PREGUIÇOSO (LAZY LOADING)
const LandingHero = lazy(() => import('./components/hero'));
const SobrePage = lazy(() => import('./components/SobrePage'));
const DashboardPainel = lazy(() => import('./components/DashboardPainel'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const AtivosPage = lazy(() => import('./components/AtivosPage'));
const CadeiaPage = lazy(() => import('./components/CadeiaPage'));
const CursosPage = lazy(() => import('./components/CursosPage'));
const RelatorioPage = lazy(() => import('./components/RelatorioPage'));
const RelatorioAtivosPage = lazy(() => import('./components/pdf/RelatorioEnsino'));

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

// ================= ROLAGEM GLOBAL ENTRE MÓDULOS (EXCETO SOBRE LISTAS/TABELAS/MAPA) =================
const DEFAULT_MODULES_ORDER = ['/territorios', '/ativos', '/cadeia', '/cursos'];

function getDynamicRoutesOrder() {
  return DEFAULT_MODULES_ORDER;
}

function PageScrollNavigator() {
  const location = useLocation();
  const navigate = useNavigate();
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    const handleWheel = (e) => {
      // 1. Ignora páginas fora do fluxo de módulos
      if (location.pathname === '/' || location.pathname === '/admin' || location.pathname === '/sobre' || location.pathname === '/relatorio') return;

      // 2. REGRA ESTRITA: Se o cursor estiver sobre QUALQUER lista interna, tabela, catálogo ou mapa, NUNCA troca de página!
      const target = e.target;
      if (target) {
        // Se estiver dentro do mapa Leaflet
        if (target.closest('.leaflet-container, .leaflet-pane')) {
          return;
        }

        // Se estiver dentro de um container com scroll interno (excluindo o <main> da página)
        const scrollable = target.closest('.overflow-y-auto, .overflow-y-scroll, .overflow-auto, .overflow-scroll, table, tbody, [data-scrollable="true"]');
        if (scrollable && scrollable.tagName.toLowerCase() !== 'main') {
          return;
        }
      }

      // 3. Se estiver rolando no fundo da página / áreas gerais / KPIs / cabeçalho, permite transição entre módulos
      const currentOrder = getDynamicRoutesOrder();
      const currentIndex = currentOrder.indexOf(location.pathname);
      if (currentIndex === -1) return;

      // Limiar de força do scroll para evitar trocas acidentais
      if (Math.abs(e.deltaY) < 35) return;

      if (isTransitioningRef.current) return;

      if (e.deltaY > 0) {
        // Descer scroll no fundo: Próximo módulo
        if (currentIndex < currentOrder.length - 1) {
          isTransitioningRef.current = true;
          navigate(currentOrder[currentIndex + 1]);
          setTimeout(() => { isTransitioningRef.current = false; }, 750);
        }
      } else if (e.deltaY < 0) {
        // Subir scroll no fundo: Módulo anterior
        if (currentIndex > 0) {
          isTransitioningRef.current = true;
          navigate(currentOrder[currentIndex - 1]);
          setTimeout(() => { isTransitioningRef.current = false; }, 750);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [location.pathname, navigate]);

  return null;
}

// HEADER SUPERIOR FIXO (Badge e Perfil do Usuário)
function TopFixedBar() {
  const { kpisGlobais, loadingStats } = useContext(DataContext);
  const location = useLocation();

  if (location.pathname === '/' || location.pathname === '/admin') return null;

  return (
    <div className="fixed top-6 right-6 lg:top-8 lg:right-8 z-[100] flex items-center gap-3 pointer-events-auto select-none print:hidden">
      <UserHeaderProfile />
    </div>
  );
}

// COMPONENTE DE TRANSIÇÃO
const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full h-full flex flex-col relative"
    >
      <Suspense 
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4 bg-transparent">
            <div className="w-8 h-8 border-2 border-white/10 border-t-[#2563EB] rounded-full animate-spin"></div>
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
    <div className={`flex w-full ${isHome ? 'min-h-screen bg-[#F0F7FD] text-[#1D3557] overflow-x-clip' : 'h-screen bg-[#F1FAEE] text-[#1D3557] overflow-hidden'} font-sans print:h-auto print:overflow-visible print:bg-white`}>
      
      {/* SIDEBAR GLOBAL */}
      <AnimatePresence initial={false} mode="wait">
        {!isHome && (
          <motion.div
            key="global-sidebar"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-screen sticky top-0 z-50 flex-shrink-0 print:hidden"
          >
            <Sidebar 
              username="Gestor BA" 
              navOnly={location.pathname === '/sobre'} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ÁREA PRINCIPAL COM HEADER FIXO */}
      <div className={`flex-1 relative ${isHome ? 'min-h-screen' : 'h-screen overflow-hidden'} bg-transparent print:h-auto print:overflow-visible`}>
        {!isHome && <TopFixedBar />}

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
            <Route path="/relatorio/cursos" element={<PageWrapper><RelatorioCursosPage /></PageWrapper>} />
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
      <PageScrollNavigator />
      <Analytics />

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