import React from 'react';
import ConectaMap from '../ConectaMap';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">

      {/* 1. TOPBAR - Barra Institucional do Governo */}
      {/* Mobile First: Fonte menor, padding ajustado */}
      <div className="bg-slate-900 text-slate-200 py-2 px-4 sm:px-6 lg:px-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest flex justify-between items-center z-20 relative">

        <span className="hidden sm:inline opacity-90">
          Governo do Estado da Bahia
        </span>
        {/* Mobile apenas: Sigla para economizar espaço */}
        <span className="sm:hidden opacity-90 tracking-widest">
          GOV.BA
        </span>
      </div>

      {/* 2. HERO SECTION - Cabeçalho de Impacto Oficial */}
      <header className="bg-[#1E3A8A] relative overflow-hidden pb-16 pt-8 md:pb-24 md:pt-12 px-4 sm:px-6 lg:px-8 shadow-inner">
        {/* Elementos Decorativos Sutis ao Fundo */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[40px] border-white/10"></div>
          <div className="absolute top-1/2 -left-20 w-64 h-64 rounded-full border-[20px] border-blue-400/20"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="w-full flex gap-6 mb-6 items-center">
            <div className="flex-1">
              <div className='w-full'>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
                  Painel Conecta Bahia
                </h1>

                <p className="text-blue-100/90 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl font-medium">
                  Consulte a disponibilidade de praças com Wi-Fi gratuito em todo o estado. Uma iniciativa oficial para democratizar o acesso à internet e promover a inclusão digital do cidadão.
                </p>
              </div>
            </div>
            <img
              src="/img/LogoConecta.png"
              alt="Logo Conecta"
              className="ml-auto"
              style={{ maxWidth: '400px' }}
            />
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 -mt-8 md:-mt-16 relative z-20 mb-12">
        {/* Mobile: Edge-to-edge (encosta na tela, sem borda redonda). Desktop: Arredondado com sombra forte. */}
        <div className="bg-white sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 overflow-hidden min-h-[500px]">
          <ConectaMap />
        </div>
      </main>

      {/* 4. RODAPÉ INSTITUCIONAL OFICIAL */}
      <footer className="bg-white border-t border-slate-200 pt-12 pb-10 mt-auto text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 text-xs text-center md:text-left">

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {/* Mockup de Brasão Governamental */}
            <span className="flex flex-col gap-1">
              <img src="/img/MARCA%20GOVBA%200126%20-%20DO%20LADO%20DA%20GENTE__H.png" alt="Logo Governo BA" className="h-16 sm:h-20 w-auto object-contain" />
              <p className="font-medium text-slate-500 text-center">Secretaria de Ciência, Tecnologia e Inovação</p>
            </span>
            <div>
            </div>
          </div>

          <div>
            <p className="font-medium">© {new Date().getFullYear()} Todos os direitos reservados.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}