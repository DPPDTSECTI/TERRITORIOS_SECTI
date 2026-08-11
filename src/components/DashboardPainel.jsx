import React, { useState } from 'react';
import { 
  Settings, GraduationCap, TrendingUp, Database, Building2, 
  ChevronDown 
} from 'lucide-react';

// IMPORTAÇÃO DO MAPA
import PtiMap from '../../PtiMap.jsx';

export default function DashboardPainel() {
  // Estado que guarda qual território foi clicado no mapa
  const [selectedTerritory, setSelectedTerritory] = useState(null);

  // Dados simulados baseados no seu print do Figma (estes depois virão do DataContext)
  const kpis = [
    { label: 'Ativos', value: '287', icon: Settings, color: 'text-blue-400' },
    { label: 'Cursos', value: '642', icon: GraduationCap, color: 'text-indigo-400' },
    { label: 'Índice', value: '0.492', icon: TrendingUp, color: 'text-[#8D34F9]' },
    { label: 'Cadeias', value: '267', icon: Database, color: 'text-purple-300' },
    { label: 'Territórios', value: '88', icon: Building2, color: 'text-[#D19EFF]' }
  ];

  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-6 bg-[#141415] font-sans w-full">
      
      {/* Curva Sutil de Fundo */}
      <div className="absolute top-[-10%] right-[-20%] w-[800px] h-[800px] lg:w-[1200px] lg:h-[1200px] border-[1px] rounded-full pointer-events-none border-white/[0.03] z-0" />
      
      {/* ================= HEADER DO DASHBOARD ================= */}
      <header className="flex items-center justify-between relative z-10 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-white text-2xl font-normal tracking-wide">
            Visão Geral
          </h1>
          
          <div className="hidden md:flex items-center gap-3">
            <button className="h-[36px] bg-[#18181B] hover:bg-white/5 transition-colors rounded-md flex items-center justify-between px-4 text-white/60 text-xs border border-white/5 w-[140px]">
              Território <ChevronDown size={14} />
            </button>
            <button className="h-[36px] bg-[#18181B] hover:bg-white/5 transition-colors rounded-md flex items-center justify-between px-4 text-white/60 text-xs border border-white/5 w-[140px]">
              Município <ChevronDown size={14} />
            </button>
          </div>
        </div>
        
        <img 
          src="/img/Brasao-Horizontal_Branco.webp" 
          alt="Governo da Bahia" 
          className="h-[35px] lg:h-[45px] object-contain opacity-90" 
        />
      </header>
      
      {/* ================= LINHA DE KPIs (Topo) ================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10 shrink-0">
        {kpis.map((kpi, index) => (
          <div 
            key={index} 
            className="h-[112px] bg-[#18181B] rounded-xl flex flex-col justify-center px-6 relative border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="absolute top-4 left-4">
              <kpi.icon size={16} className={kpi.color} strokeWidth={2} />
            </div>
            <span className="text-4xl font-light text-white mt-4 tracking-tighter">
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* ================= GRID PRINCIPAL ================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 min-h-[550px]">
        
        {/* LADO ESQUERDO: MAPA INTEGRADO */}
        <div className="lg:col-span-5 bg-[#18181B] rounded-xl border border-white/5 relative overflow-hidden flex flex-col">
          <p className="absolute top-5 left-5 text-white/40 font-mono tracking-widest uppercase text-[10px] z-20 pointer-events-none">
            Mapa Territorial
          </p>
          
          {/* Aqui chamamos o componente do Mapa. 
              Por enquanto arrays vazios nas props de dados para não quebrar até ligarmos o contexto. */}
          <div className="flex-1 w-full h-full relative">
            <PtiMap 
              selectedTerritory={selectedTerritory}
              onSelectTerritory={setSelectedTerritory}
              territoriosData={[]} 
              territoriesDynamicStats={{}}
              semiaridoMunicipios={[]}
              filtroSemiarido={false}
            />
          </div>
        </div>

        {/* LADO DIREITO: ESBOÇOS DOS GRÁFICOS (Para serem substituídos depois) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="flex-1 bg-[#18181B] rounded-xl border border-white/5 flex items-center justify-center relative min-h-[240px]">
            <p className="absolute top-5 left-5 text-white/40 font-mono tracking-widest uppercase text-[10px]">
              Distribuição (Donut)
            </p>
            <div className="w-[160px] h-[160px] rounded-full border-[25px] border-[#6875F5] border-t-[#8D34F9] border-r-[#B574F2] flex items-center justify-center shadow-inner">
              <div className="text-center flex flex-col">
                <span className="text-white/40 text-[9px] uppercase font-mono tracking-wider mb-1">Total</span>
                <span className="text-white font-bold text-xl leading-none">100</span>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[220px]">
            <div className="bg-[#18181B] rounded-xl border border-white/5 p-6 relative flex items-end justify-center gap-3 lg:gap-5 pb-8">
              <p className="absolute top-5 left-5 text-white/40 font-mono tracking-widest uppercase text-[10px]">
                Comparativo
              </p>
              <div className="w-6 lg:w-8 h-[40%] bg-[#B574F2] rounded-sm relative"><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/30">A</span></div>
              <div className="w-6 lg:w-8 h-[70%] bg-[#8D34F9] rounded-sm relative"><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/30">B</span></div>
              <div className="w-6 lg:w-8 h-[30%] bg-[#6875F5] rounded-sm relative"><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/30">C</span></div>
              <div className="w-6 lg:w-8 h-[90%] bg-[#3984DA] rounded-sm relative"><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/30">D</span></div>
              <div className="w-6 lg:w-8 h-[60%] bg-[#26B5CE] rounded-sm relative"><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/30">E</span></div>
            </div>

            <div className="bg-[#18181B] rounded-xl border border-white/5 p-6 relative flex flex-col justify-end gap-5">
              <p className="absolute top-5 left-5 text-white/40 font-mono tracking-widest uppercase text-[10px]">
                Regiões
              </p>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-white/30">Produto A</span>
                <div className="h-4 w-[85%] bg-[#8D34F9] rounded-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-white/30">Produto B</span>
                <div className="h-4 w-[65%] bg-[#6875F5] rounded-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-white/30">Produto C</span>
                <div className="h-4 w-[45%] bg-[#3984DA] rounded-sm" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}