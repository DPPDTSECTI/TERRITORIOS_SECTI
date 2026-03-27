import React from "react";

const LandingHero = ({ onAccessDashboard }) => {
  return (
    <div className="relative w-full h-full min-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden font-sans flex flex-col">
      {/* Background Orbs & Effects (Light Theme) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400 opacity-10 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400 opacity-10 blur-[100px]"></div>
        {/* Padrão de pontos subtil adaptado para fundo claro */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
      </div>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-6 lg:px-12 py-12 lg:py-0 gap-12 lg:gap-8 w-full h-full">
        {/* Text Section (Esquerda) */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-800 tracking-tight mb-6 leading-[1.15]">
            Painel Territorial de <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0f766e] to-cyan-600 drop-shadow-sm">
              Ciência e Tecnologia
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Uma plataforma interativa desenvolvida pela SECTI para explorar,
            analisar e gerir os indicadores de capacidade e desenvolvimento em
            inovação nos territórios de identidade do Estado da Bahia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={onAccessDashboard}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Acessar o Painel
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>

            <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-1 shadow-sm">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Baixar Relatório
            </button>
          </div>
        </div>

        {/* Visual/Graphic Section (Mockup Abstrato 3D adaptado para Light Theme) */}
        <div className="flex-1 w-full max-w-2xl relative perspective-1000 hidden md:block">
          <div className="relative w-full aspect-[4/3] rounded-2xl bg-[#f8fafc] border border-slate-200 shadow-2xl overflow-hidden transform md:rotate-y-[-12deg] md:rotate-x-[8deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out">
            {/* Fake Dashboard Header */}
            <div className="h-10 border-b border-slate-200 bg-white flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <div className="ml-4 h-3 w-32 bg-slate-100 rounded-full"></div>
            </div>

            {/* Fake Dashboard Body */}
            <div className="p-6 flex flex-col gap-4 h-full">
              {/* KPIs Mock */}
              <div className="flex gap-4">
                <div className="h-20 flex-1 bg-white border border-slate-100 shadow-sm rounded-lg p-3">
                  <div className="h-2 w-8 bg-emerald-100 rounded mb-2"></div>
                  <div className="h-6 w-16 bg-emerald-500 rounded"></div>
                </div>
                <div className="h-20 flex-1 bg-white border border-slate-100 shadow-sm rounded-lg p-3">
                  <div className="h-2 w-8 bg-cyan-100 rounded mb-2"></div>
                  <div className="h-6 w-16 bg-cyan-500 rounded"></div>
                </div>
                <div className="h-20 flex-1 bg-white border border-slate-100 shadow-sm rounded-lg p-3">
                  <div className="h-2 w-8 bg-blue-100 rounded mb-2"></div>
                  <div className="h-6 w-16 bg-blue-500 rounded"></div>
                </div>
              </div>

              {/* Map Mock */}
              <div className="flex gap-4 flex-1">
                <div className="flex-[2] bg-white rounded-lg border border-slate-200 shadow-sm relative overflow-hidden flex items-center justify-center p-4">
                  {/* Representação abstrata do mapa da Bahia */}
                  <svg
                    className="w-full h-full text-slate-100"
                    viewBox="0 0 100 100"
                    fill="currentColor"
                  >
                    <path
                      d="M40,20 L60,10 L80,30 L90,60 L70,90 L40,80 L10,70 L20,40 Z"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                    <circle cx="50" cy="50" r="4" className="text-[#0f766e]" />
                    <circle
                      cx="30"
                      cy="40"
                      r="3"
                      className="text-emerald-400"
                    />
                    <circle cx="70" cy="60" r="3" className="text-cyan-500" />
                  </svg>
                </div>
                {/* List Mock */}
                <div className="flex-[1] flex flex-col gap-3">
                  <div className="flex-[1] bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                    <div className="h-2 w-full bg-slate-200 rounded mb-2"></div>
                    <div className="h-2 w-2/3 bg-slate-200 rounded mb-2"></div>
                    <div className="h-2 w-4/5 bg-slate-100 rounded"></div>
                  </div>
                  <div className="flex-[2] bg-white rounded-lg border border-slate-200 shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative floating widget */}
          <div
            className="absolute -top-6 -right-6 bg-gradient-to-tr from-[#0f766e] to-emerald-400 p-4 rounded-2xl shadow-xl shadow-emerald-500/30 animate-bounce"
            style={{ animationDuration: "4s" }}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingHero;
