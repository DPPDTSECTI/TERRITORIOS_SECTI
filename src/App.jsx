import React, { useState } from 'react';
import ConectaMap from '../ConectaMap'; // Ajuste o caminho conforme necessário
import LandingHero from './components/hero';

export default function App() {
  const [page, setPage] = useState('overview');
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
    refreshUrl.searchParams.set('refresh', String(Date.now()));
    window.location.replace(refreshUrl.toString());
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans text-slate-800 overflow-hidden">
      
      {/* Sidebar - Menu Lateral (Desktop) */}
      <aside className="w-64 bg-[#fff] text-white flex-col hidden md:flex shrink-0 z-20 shadow-xl">
        

        {/* Itens de Navegação (Mocks baseados na imagem) */}
        <nav className="flex-1 px-3 py-6 space-y-2 text-sm font-medium">
          <div
            className={`px-4 py-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${page === 'overview' ? 'bg-[#0f766e] text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            onClick={() => setPage('overview')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Visão Geral
          </div>
          <div
            className={`px-4 py-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${page === 'territorios' ? 'bg-[#0f766e] text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            onClick={() => setPage('territorios')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Territórios
          </div>
          <div className="px-4 py-3 rounded-lg flex items-center gap-3 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Relatórios
          </div>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
            <img src="/img/Secti_Vertical.png" alt="Brasão da Bahia" className="mx-auto mb-2 object-contain" />
            <p className="mt-1">© {new Date().getFullYear()}</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header Superior Top Bar */}
        <header className="h-16 bg-[#fff] flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-md z-10 border-b border-slate-700 md:border-none">
          {/* Menu Hambúrguer (Mobile) & Título */}
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-300 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-lg sm:text-xl font-semibold tracking-wide text-slate-800 uppercase flex items-center gap-2">
               <span className="hidden sm:inline">PAINEL SECTI TERRITÓRIOS</span>
               <span className="sm:hidden">TERRITÓRIOS</span>
            </h1>
          </div>

        </header>

        {/* Content Body (Onde vai o Dashboard) */}
        <div className="flex-1 overflow-y-auto ">
          {page === 'overview' ? (
            <LandingHero onAccessDashboard={() => setPage('territorios')} />
          ) : (
            <>
              {/* Toolbar Principal (Botão de Atualizar que você pediu) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleForceRefresh}
                    disabled={isRefreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e293b] px-4 py-2 text-sm font-semibold tracking-wide text-white transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 shadow-sm"
                    title="Verifica se há atualizações e recarrega a aplicação com os dados mais recentes"
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

                {/* Subtítulo Opcional do Relatório */}
                <div className="text-right hidden lg:block">
                  <h2 className="text-sm font-bold text-slate-700">Painel Territorial CT&I</h2>
                  <p className="text-xs text-slate-500">Dados Consolidados</p>
                </div>
              </div>

              {/* Injeção do seu Componente do Mapa */}
              <div className="w-full">
                <ConectaMap />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}