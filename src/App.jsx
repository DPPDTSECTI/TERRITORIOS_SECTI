import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { DataProvider } from './context/DataContext';

// ==========================================
// CARREGAMENTO PREGUIÇOSO (LAZY LOADING)
// Isso garante que o código pesado do mapa só seja baixado 
// quando o usuário realmente clicar em "Explorar o Painel"
// ==========================================
const LandingHero = lazy(() => import('./components/hero'));
const SobrePage = lazy(() => import('./components/SobrePage'));

// Nota: Todo aquele código de filtros, modais e useTerritoriosData
// que estava aqui, agora vai morar dentro deste arquivo Dashboard.jsx
const DashboardPainel = lazy(() => import('./components/DashboardPainel')); 

function MainApp() {
  // Tema escuro fixo para todo o app
  const darkMode = true;

  return (
    // O container principal define o fundo escuro e o comportamento da tela
    <div className="min-h-screen w-full bg-[#1c1c1c] text-white font-sans overflow-x-hidden relative flex flex-col">
      
      <Helmet>
        <title>Painel Territorial CT&I | Governo da Bahia</title>
        <meta name="description" content="Plataforma interativa da SECTI com indicadores de Ciência, Tecnologia, Inovação e Cadeias Produtivas." />
      </Helmet>

      {/* 
        ==================================================
        ESPAÇO RESERVADO PARA OS NOVOS NAVBARS
        ==================================================
        Quando você me enviar os novos designs de Navbar (superior e lateral),
        eles serão importados e colocados aqui. Exemplo:
        <NavbarSuperior />
        <SidebarVertical />
      */}

      {/* 
        ==================================================
        CORPO PRINCIPAL (ROTAS)
        ==================================================
      */}
      <main className="flex-1 w-full h-full relative z-10">
        <Suspense 
          fallback={
            // Tela de carregamento global super minimalista e elegante
            <div className="flex flex-col items-center justify-center min-h-screen w-full gap-4">
              <div className="w-8 h-8 border-2 border-white/10 border-t-[#9170FA] rounded-full animate-spin"></div>
              <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-gray-400 animate-pulse">
                Carregando...
              </span>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<LandingHero />} />
            <Route path="/sobre" element={<SobrePage darkMode={darkMode} />} />
            <Route path="/dashboard" element={<DashboardPainel darkMode={darkMode} />} />
            <Route path="/territorios" element={<DashboardPainel darkMode={darkMode} />} />
          </Routes>
        </Suspense>
      </main>

    </div>
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