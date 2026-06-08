import React, { useState } from 'react';
import ConectaMap from "../ConectaMap"; // Ajuste o caminho conforme sua estrutura
import LandingHero from './components/hero';

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const pageFromUrl = queryParams.get('tab') || 'overview';
  const [page, setPage] = useState(pageFromUrl);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  const handleForceRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }
      if (window.localStorage) window.localStorage.clear();
      if (window.sessionStorage) window.sessionStorage.clear();

      if (window.indexedDB && window.indexedDB.databases) {
        const databases = await window.indexedDB.databases();
        await Promise.all(
          databases.map((db) => {
            if (db.name) {
              return new Promise((resolve, reject) => {
                const deleteRequest = window.indexedDB.deleteDatabase(db.name);
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => reject();
                deleteRequest.onblocked = () => resolve(); 
              });
            }
          })
        );
      }

      document.cookie.split(';').forEach((cookie) => {
        const name = cookie.split('=')[0].trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
    } catch (err) {
      console.warn('[App] Falha ao forcar atualizacao completa:', err);
    }

    const refreshUrl = new URL(window.location.href);
    refreshUrl.searchParams.set('tab', page); 
    refreshUrl.searchParams.set('refresh', String(Date.now()));
    window.location.replace(refreshUrl.toString());
  };

  return (
    // Adicionado 'relative' para ser o contêiner âncora do header
    <div className="relative flex flex-col h-screen bg-surface-bg font-sans text-slate-800 overflow-hidden">
      
      {/* Barra de Navegação Superior com Glassmorphism */}
      {/* O 'absolute' faz ela flutuar, 'bg-white/80' dá transparência de 80% e 'backdrop-blur-md' cria o desfoque */}
      <header className="absolute top-0 w-full bg-white/80 backdrop-blur-md h-16 sm:h-20 flex items-center justify-between px-6 sm:px-12 lg:px-16 shadow-sm border-b border-surface-border/40 z-50 transition-all duration-300">
        <div className="flex items-center gap-8 lg:gap-12 h-full">
          
          {/* Título Institucional da Navbar */}
          <h1 className="text-lg sm:text-xl font-light text-slate-800 tracking-tight uppercase flex items-center gap-2">
            <span className="text-gov-blueDark-500">Painel</span>
            <span className="text-gov-red-500">Territorial</span>
          </h1>

          {/* Botões de Navegação Globais */}
          <nav className="flex items-center gap-6 sm:gap-8 h-full pt-1">
            <button
              onClick={() => setPage('overview')}
              className={`h-full flex items-center text-sm sm:text-base font-extralight transition-all border-b-[3px] ${
                page === 'overview' 
                  ? 'text-gov-blueDark-500 border-gov-blueDark-500 font-medium' 
                  : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              Início
            </button>
            <button
              onClick={() => setPage('territorios')}
              className={`h-full flex items-center text-sm sm:text-base font-extralight transition-all border-b-[3px] ${
                page === 'territorios' 
                  ? 'text-gov-blueDark-500 border-gov-blueDark-500 font-medium' 
                  : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              Territórios
            </button>
          </nav>
        </div>

        {/* Informação Secundária à Direita */}
        <div className="hidden md:flex items-center">
            <img src="/img/SECTI - SECRETARIA DE CIENCIA, TECNOLOGIA E INOVACAO - GOVBA 0126__H.png" 
            alt="Logo SECTI" 
            className="h-16 lg:h-16 object-contain" />
        </div>
      </header>

      {/* Conteúdo Principal Dinâmico */}
      {/* Adicionado 'pt-16 sm:pt-20' para compensar a altura do header flutuante e o conteúdo não ficar escondido logo de cara */}
      <main className="flex-1 overflow-y-auto relative w-full pt-16 sm:pt-20">
        {page === 'overview' ? (
          <LandingHero onAccessDashboard={() => setPage('territorios')} />
        ) : (
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            
            {/* Barra de Ferramentas / Atualização */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-sm border border-surface-border">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleForceRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold tracking-wide text-white transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 shadow-sm"
                >
                  {isRefreshing ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  )}
                  {isRefreshing ? 'Atualizando...' : 'Verificar atualizações'}
                </button>

                {!isRefreshing && (
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:block">
                    Última atualização: [{lastUpdate}]
                  </span>
                )}
              </div>

              <div className="text-right hidden lg:block">
                <h2 className="text-sm font-bold text-slate-700">Painel Territorial CT&I</h2>
                <p className="text-xs text-slate-500">Dados Consolidados</p>
              </div>
            </div>

            {/* Injeção do Mapa */}
            <div className="w-full">
              <ConectaMap />
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}