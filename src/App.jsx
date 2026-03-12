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

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }
      if (window.localStorage) {
        window.localStorage.clear();
      }
      if (window.sessionStorage) {
        window.sessionStorage.clear();
      }

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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">

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
              Consulte a disponibilidade de pontos com Wi-Fi gratuito em todo o estado. Uma iniciativa oficial para democratizar o acesso à internet e promover a inclusão digital do cidadão.
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
        <section className="mb-4 sm:mb-6 overflow-hidden sm:rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-white shadow-lg">
          <div className="relative px-4 py-5 sm:px-6 sm:py-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-blue-700" />
            <div className="pl-3 sm:pl-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-700 px-3 py-1 text-[10px] sm:text-xs font-bold tracking-wide uppercase text-white">
                      Novidade 
                    </span>
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-blue-800">
                      11 de março de 2026
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg sm:text-2xl font-extrabold text-slate-900 leading-tight">
                    Decreto nº 24.419 institui oficialmente o Programa Conecta Bahia
                  </h2>
                  <p className="mt-2 text-sm sm:text-[15px] text-slate-700 leading-relaxed max-w-4xl">
                    A iniciativa amplia o acesso à internet gratuita e de qualidade em espaços públicos, comunidades rurais e territórios com menor cobertura, fortalecendo a inclusão digital, o acesso a serviços públicos, a educação e o desenvolvimento socioeconômico na Bahia.
                  </p>
                </div>
                <div className="sm:pt-1 shrink-0">
                  <a
                    href="https://www.ba.gov.br/secti/sites/site-secti/files/2026-03/DECRETO%20CONECTA.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs sm:text-sm font-semibold tracking-wide text-white transition hover:bg-blue-800 shadow-sm"
                  >
                    Ler decreto na íntegra
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-white sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 overflow-hidden min-h-[500px]">
          <ConectaMap />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 pt-12 pb-10 mt-auto text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 text-xs text-center md:text-left">

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
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