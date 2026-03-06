import React, { useState } from 'react';
import ConectaMap from '../ConectaMap';

export default function App() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleForceRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();

        await Promise.all(
          registrations.map(async (registration) => {
            await registration.update();

            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            if (registration.active) {
              registration.active.postMessage({ type: 'CLEAR_CACHE' });
            }
          })
        );
      }

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }
    } catch (err) {
      console.warn('[App] Falha ao forcar atualizacao completa:', err);
    }

    const refreshUrl = new URL(window.location.href);
    refreshUrl.searchParams.set('refresh', String(Date.now()));
    window.location.replace(refreshUrl.toString());
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">

      {/* 1. TOPBAR - Barra Institucional do Governo */}
      <div className="bg-slate-900 text-slate-200 py-2 px-4 sm:px-6 lg:px-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest flex justify-between items-center z-20 relative">
        <span className="hidden sm:inline opacity-90">
          Governo do Estado da Bahia
        </span>
        <span className="sm:hidden opacity-90 tracking-widest">
          GOV.BA
        </span>
      </div>
     
      <header className="bg-[#1E3A8A] relative overflow-hidden pb-24 pt-10 md:pb-28 md:pt-16 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[40px] border-white/10"></div>
          <div className="absolute top-1/2 -left-20 w-64 h-64 rounded-full border-[20px] border-blue-400/20"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12">
          <div className="flex-1 text-center md:text-left w-full">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
              Painel Conecta Bahia
            </h1>
            <p className="text-blue-100/90 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto md:mx-0 font-medium">
              Consulte a disponibilidade de praças com Wi-Fi gratuito em todo o estado. Uma iniciativa oficial para democratizar o acesso à internet e promover a inclusão digital do cidadão.
            </p>
            <div className="mt-6 flex justify-center md:justify-start">
              <button
                type="button"
                onClick={handleForceRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-xs sm:text-sm font-semibold tracking-wide text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70"
                title="Limpa cache e recarrega a aplicação com os dados mais recentes"
              >
                {isRefreshing ? 'Atualizando...' : 'Forçar atualização'}
              </button>
            </div>
          </div>
          <div className="w-full md:w-auto flex justify-center shrink-0">
            <img
              src="/img/LogoConecta.png"
              alt="Logo Conecta"
              className="w-56 sm:w-64 md:w-80 lg:w-[400px] object-contain"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 -mt-8 md:-mt-16 relative z-20 mb-12">
        <div className="bg-white sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 overflow-hidden min-h-[500px]">
          <ConectaMap />
        </div>
      </main>

      {/* 4. RODAPÉ INSTITUCIONAL OFICIAL */}
      <footer className="bg-white border-t border-slate-200 pt-12 pb-10 mt-auto text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 text-xs text-center md:text-left">

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {/* Centered items on mobile, left-aligned on desktop */}
            <span className="flex flex-col gap-1 items-center md:items-start">
              <img src="/img/MARCA%20GOVBA%200126%20-%20DO%20LADO%20DA%20GENTE__H.png" alt="Logo Governo BA" className="h-16 sm:h-20 w-auto object-contain" />
              <p className="font-medium text-slate-500 text-center md:text-left">Secretaria de Ciência, Tecnologia e Inovação</p>
            </span>
          </div>

          <div>
            <p className="font-medium">© {new Date().getFullYear()} Todos os direitos reservados.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}