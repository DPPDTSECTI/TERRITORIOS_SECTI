import React, { useState } from 'react';
import {
  Settings, GraduationCap, TrendingUp, Database, Building2,
  ChevronDown, Map, MapPin, LogOut
} from 'lucide-react';

// IMPORTAÇÃO DO MAPA
import PtiMap from './PtiMap.jsx';
import DonutChart from './DonutChart.jsx';

export default function DashboardPainel() {
  // Estado que guarda qual território foi clicado no mapa
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  // Estado que guarda o modo de visualização (território vs município)
  const [viewMode, setViewMode] = useState('territorio');

  // Dados simulados baseados no seu print do Figma (estes depois virão do DataContext)
  const kpis = [
    { label: 'Ativos', value: '287', icon: Settings },
    { label: 'Cursos', value: '642', icon: GraduationCap },
    { label: 'Índice', value: '0.492', icon: TrendingUp },
    { label: 'Cadeias', value: '267', icon: Database },
    { label: 'Territórios', value: '88', icon: Building2 }
  ];

  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-6 bg-transparent font-sans w-full">

      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold text-[#1D3557] tracking-tight">Visão Geral</h1>
          <p className="text-sm text-[#457B9D] mt-1.5 font-medium">Sexta-feira, 14 de Agosto de 2026</p>
        </div>

        {/* AÇÕES E PERFIL DO USUÁRIO */}
        <div className="flex items-center gap-4">
          {/* PERFIL DO USUÁRIO */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop" 
                alt="Avatar do Usuário" 
                className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-[14px] font-bold text-[#1D3557] leading-tight group-hover:text-[#457B9D] transition-colors">
                Usuario
              </span>
              <span className="text-[12px] font-medium text-[#457B9D] mt-0.5">
                Admin SECTI
              </span>
            </div>
          </div>

          {/* DIVISOR SUTIL */}
          <div className="h-6 w-[1px] bg-[#D6EAF8] hidden sm:block"></div>

          {/* BOTÕES DE CONFIGURAÇÃO E LOGOUT */}
          <div className="flex items-center gap-2">
            <button 
              title="Configurações"
              className="w-9 h-9 rounded-full bg-white text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 active:scale-90 shadow-[0_2px_10px_rgba(29,53,87,0.04)]"
            >
              <Settings size={16} strokeWidth={2} />
            </button>
            <button 
              title="Sair da Sessão"
              className="w-9 h-9 rounded-full bg-white text-[#457B9D] hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 active:scale-90 shadow-[0_2px_10px_rgba(29,53,87,0.04)]"
            >
              <LogOut size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>



      {/* ================= GRID DE KPIs (MOVIDO PARA O TOPO) ================= */}
      <div className="w-full relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="aspect-auto h-32 md:h-36 bg-white rounded-[24px] flex flex-col items-center justify-center relative border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-2 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group overflow-hidden text-center p-4 cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#D6EAF8] text-[#457B9D] flex items-center justify-center mb-2 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:rotate-3">
                <kpi.icon size={22} strokeWidth={2.5} />
              </div>
              <span className="text-3xl xl:text-4xl font-extrabold text-[#1D3557] tracking-tight leading-none mb-1">
                {kpi.value}
              </span>
              <span className="text-[#457B9D] text-[10px] uppercase font-bold tracking-widest mt-1">
                {kpi.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= GRID PRINCIPAL ================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 min-h-[500px]">

        {/* LADO ESQUERDO: MAPA INTEGRADO */}
        <div className="lg:col-span-5 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 relative overflow-hidden flex flex-col group">
          <p className="absolute top-5 left-5 text-[#457B9D]/50 font-mono tracking-widest uppercase text-[10px] z-20 pointer-events-none group-hover:text-[#457B9D] transition-colors">
            Mapa Territorial
          </p>

          {/* ================= TOGGLE MAPA/PIN ================= */}
          <div className="absolute top-4 right-4 z-50 flex items-center p-1 bg-white/80 rounded-full border border-[#D6EAF8] backdrop-blur-md shadow-sm">
            <button
              onClick={() => setViewMode('territorio')}
              className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-500 active:scale-95 ${viewMode === 'territorio' ? 'text-[#1D3557] font-bold' : 'text-[#457B9D] hover:text-[#1D3557]'}`}
              title="Território"
            >
              <Map size={18} strokeWidth={2} />
            </button>
            <button
              onClick={() => setViewMode('municipio')}
              className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-500 active:scale-95 ${viewMode === 'municipio' ? 'text-[#1D3557] font-bold' : 'text-[#457B9D] hover:text-[#1D3557]'}`}
              title="Município"
            >
              <MapPin size={18} strokeWidth={2} />
            </button>

            {/* Círculo indicador animado */}
            <div
              className="absolute top-1 left-1 w-10 h-10 bg-[#D6EAF8] rounded-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm pointer-events-none"
              style={{ transform: viewMode === 'municipio' ? 'translateX(100%)' : 'translateX(0)' }}
            />
          </div>

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

        {/* LADO DIREITO: ESBOÇOS DOS GRÁFICOS */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[240px]">
            <DonutChart
              title=""
              totalLabel="Total de Cursos"
              data={[
                { label: 'Tecnologia da Informação', value: 340, color: '#1D3557' },
                { label: 'Engenharias', value: 285, color: '#2563EB' },
                { label: 'Saúde', value: 210, color: '#457B9D' },
                { label: 'Ciências Humanas', value: 160, color: '#A8DADC' },
                { label: 'Artes e Design', value: 95, color: '#F87171' },
              ]}
            />

            <div className="bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-6 relative flex flex-col items-center justify-center group cursor-default">
              <p className="absolute top-5 left-5 text-[#457B9D]/50 font-mono tracking-widest uppercase text-[10px] group-hover:text-[#457B9D] transition-colors">
                Novo Indicador
              </p>
              <span className="text-[#457B9D]/60 text-sm font-medium">Em breve</span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[220px]">
            <div className="bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-6 relative flex items-end justify-center gap-3 lg:gap-5 pb-8 group cursor-default">
              <p className="absolute top-5 left-5 text-[#457B9D]/50 font-mono tracking-widest uppercase text-[10px] group-hover:text-[#457B9D] transition-colors">
                Comparativo
              </p>
              <div className="w-6 lg:w-8 h-[40%] bg-[#457B9D] rounded-sm relative transition-transform duration-500 group-hover:scale-y-110 origin-bottom"><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#1D3557]">A</span></div>
              <div className="w-6 lg:w-8 h-[70%] bg-[#1D3557] rounded-sm relative transition-transform duration-500 group-hover:scale-y-110 origin-bottom"><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#1D3557]">B</span></div>
              <div className="w-6 lg:w-8 h-[30%] bg-[#A8DADC] rounded-sm relative transition-transform duration-500 group-hover:scale-y-110 origin-bottom"><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#1D3557]">C</span></div>
              <div className="w-6 lg:w-8 h-[90%] bg-[#457B9D] rounded-sm relative transition-transform duration-500 group-hover:scale-y-110 origin-bottom"><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#1D3557]">D</span></div>
              <div className="w-6 lg:w-8 h-[60%] bg-[#1D3557] rounded-sm relative transition-transform duration-500 group-hover:scale-y-110 origin-bottom"><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#1D3557]">E</span></div>
            </div>

            <div className="bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-6 relative flex flex-col justify-end gap-5 group cursor-default">
              <p className="absolute top-5 left-5 text-[#457B9D]/50 font-mono tracking-widest uppercase text-[10px] group-hover:text-[#457B9D] transition-colors">
                Regiões
              </p>
              <div className="flex flex-col gap-1.5 group-hover:translate-x-1 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                <span className="text-[10px] font-bold text-[#1D3557]">Produto A</span>
                <div className="h-4 w-[85%] bg-[#1D3557] rounded-sm" />
              </div>
              <div className="flex flex-col gap-1.5 group-hover:translate-x-1 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-75">
                <span className="text-[10px] font-bold text-[#1D3557]">Produto B</span>
                <div className="h-4 w-[65%] bg-[#457B9D] rounded-sm" />
              </div>
              <div className="flex flex-col gap-1.5 group-hover:translate-x-1 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] delay-150">
                <span className="text-[10px] font-bold text-[#1D3557]">Produto C</span>
                <div className="h-4 w-[45%] bg-[#A8DADC] rounded-sm" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}





  
