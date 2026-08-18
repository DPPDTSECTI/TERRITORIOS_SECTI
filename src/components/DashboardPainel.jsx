import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Settings, GraduationCap, TrendingUp, Database, Building2,
  ChevronDown, ChevronUp, Minus, Map, MapPin, LogOut, GripHorizontal
} from 'lucide-react';
import { PieChart, Pie, Cell, Sector } from 'recharts';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

// IMPORTAÇÃO DOS DADOS E MAPA
import { DataContext } from '../context/DataContext';
import PtiMap from './PtiMap.jsx';
import DonutChart from './DonutChart.jsx';
import UserHeaderProfile from './UserHeaderProfile.jsx';

function SortableCard({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative',
    height: '100%',
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative h-full group ${isDragging ? 'opacity-80 scale-105 shadow-2xl' : ''}`}>
      {/* DRAG HANDLE */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-4 right-4 z-50 p-1.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 rounded-md hover:bg-gray-100 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-1"
        title="Arrastar card"
      >
        <GripHorizontal size={18} />
      </button>
      {children}
    </div>
  );
}

export default function DashboardPainel() {
  // =========================================================================
  // CONSUMINDO O NOSSO CONTEXTO GLOBAL (SUPER RÁPIDO)
  // =========================================================================
  const { 
    kpisGlobais, 
    loadingStats, 
    territoriosData, 
    territoriesDynamicStats, 
    selectedTerritory, 
    setSelectedTerritory 
  } = useContext(DataContext);

  // Estado que guarda o modo de visualização (território vs município)
  const [viewMode, setViewMode] = useState('territorio');
  // Estado do filtro IFDM
  const [ifdmFilter, setIfdmFilter] = useState('top');
  // Estado do item hoverado no gráfico de pizza
  const [hoveredPieIndex, setHoveredPieIndex] = useState(null);

  // DND KIt state para a ordem dos cards
  const INITIAL_CARDS = ['card-donut', 'card-pie', 'card-ranking', 'card-mapeamento'];
  const [cardsOrder, setCardsOrder] = useState(() => {
    const saved = localStorage.getItem('dashboard-cards-order');
    if (saved) {
      try {
        const order = JSON.parse(saved);
        if (order.length === INITIAL_CARDS.length) return order;
      } catch (e) { }
    }
    return INITIAL_CARDS;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setCardsOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('dashboard-cards-order', JSON.stringify(newArray));
        return newArray;
      });
    }
  };

  const pieHoverTimeoutRef = useRef(null);

  const handlePieMouseEnter = (index) => {
    if (pieHoverTimeoutRef.current) clearTimeout(pieHoverTimeoutRef.current);
    setHoveredPieIndex(index);
  };

  const handlePieMouseLeave = () => {
    pieHoverTimeoutRef.current = setTimeout(() => {
      setHoveredPieIndex(null);
    }, 150);
  };

  // =========================================================================
  // ALIMENTANDO OS KPIs COM OS DADOS REAIS DA API
  // =========================================================================
  const kpis = [
    { label: 'Ativos', value: loadingStats ? '...' : kpisGlobais.ativos, icon: Settings },
    { label: 'Cursos', value: loadingStats ? '...' : kpisGlobais.cursos, icon: GraduationCap },
    { label: 'Índice', value: loadingStats ? '...' : kpisGlobais.ifdmMedio, icon: TrendingUp },
    { label: 'Cadeias', value: loadingStats ? '...' : kpisGlobais.cadeias, icon: Database },
    { label: 'Territórios', value: loadingStats ? '...' : kpisGlobais.territorios, icon: Building2 }
  ];

  // Dados simulados baseados no seu print do Figma (Ecossistema)
  const ecosystemData = [
    { region: 'Campi Univ. Privadas', value: 85, percent: '100%', colorHex: '#1D3557', tailwind: 'bg-[#1D3557]' },
    { region: 'Campi Univ. Públicas', value: 54, percent: '63.5%', colorHex: '#2563EB', tailwind: 'bg-[#2563EB]' },
    { region: 'Campi Inst. Federais', value: 40, percent: '47%', colorHex: '#457B9D', tailwind: 'bg-[#457B9D]' },
    { region: 'Incubadoras & Acel.', value: 31, percent: '36.4%', colorHex: '#06B6D4', tailwind: 'bg-[#06B6D4]' },
    { region: 'Espaços Dinamizadores', value: 28, percent: '32.9%', colorHex: '#10B981', tailwind: 'bg-[#10B981]' },
    { region: 'Centros de Pesquisa', value: 4, percent: '4.7%', colorHex: '#F59E0B', tailwind: 'bg-[#F59E0B]' },
    { region: 'ICTs Mapeadas', value: 2, percent: '2.3%', colorHex: '#EF4444', tailwind: 'bg-[#EF4444]' },
    { region: 'Parques Tecnológicos', value: 2, percent: '2.3%', colorHex: '#8B5CF6', tailwind: 'bg-[#8B5CF6]' }
  ];

  const pieDataWithFill = ecosystemData.map(item => ({ ...item, fill: item.colorHex }));

  return (
    <main className="flex-1 h-screen overflow-hidden relative py-6 px-6 lg:px-8 flex flex-col gap-6 bg-transparent font-sans w-full">

      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold text-[#1D3557] tracking-tight">Visão Geral</h1>
          <p className="text-sm text-[#457B9D] mt-1.5 font-medium">Sexta-feira, 14 de Agosto de 2026</p>
        </div>

        {/* AÇÕES E PERFIL DO USUÁRIO */}
        <div className="flex items-center gap-6">
          {/* ================= TOGGLE MAPA/PIN (HORIZONTAL) ================= */}
          <div className="flex items-center p-1 bg-white/80 rounded-full border border-[#D6EAF8] shadow-sm relative">
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

            {/* Fundo indicador animado */}
            <div
              className="absolute top-1 left-1 w-10 h-10 bg-[#D6EAF8] rounded-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm pointer-events-none"
              style={{ transform: viewMode === 'municipio' ? 'translateX(100%)' : 'translateX(0)' }}
            />
          </div>

          <UserHeaderProfile />
        </div>
      </div>

      {/* ================= GRID DE KPIs ================= */}
      <div className="w-full relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="aspect-auto h-20 md:h-24 bg-white rounded-[16px] flex flex-col items-center justify-center relative border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_2px_12px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group overflow-hidden text-center p-2 cursor-default"
            >
              <div className="w-8 h-8 rounded-xl bg-[#D6EAF8] text-[#457B9D] flex items-center justify-center mb-1 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:rotate-3">
                <kpi.icon size={16} strokeWidth={2.5} />
              </div>
              <span className="text-xl xl:text-2xl font-extrabold text-[#1D3557] tracking-tight leading-none mb-0.5">
                {kpi.value}
              </span>
              <span className="text-[#457B9D] text-[8px] uppercase font-bold tracking-widest">
                {kpi.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= GRID PRINCIPAL ================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 min-h-0">

        {/* LADO ESQUERDO: MAPA INTEGRADO */}
        <div className="lg:col-span-5 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 relative overflow-hidden flex flex-col group">
          <p className="absolute top-5 left-5 text-[#457B9D]/50 font-mono tracking-widest uppercase text-[10px] z-20 pointer-events-none group-hover:text-[#457B9D] transition-colors">
            Mapa Territorial
          </p>

          {/* MAPA AGORA CONECTADO AO CONTEXTO */}
          <div className="flex-1 w-full h-full relative">
            <PtiMap
              selectedTerritory={selectedTerritory}
              onSelectTerritory={setSelectedTerritory}
              territoriosData={territoriosData}
              territoriesDynamicStats={territoriesDynamicStats}
              semiaridoMunicipios={[]}
              filtroSemiarido={false}
            />
          </div>
        </div>

        {/* LADO DIREITO: DASHBOARD DE CURSOS E INDICADORES */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 auto-rows-[1fr] gap-5 h-full">
            <SortableContext items={cardsOrder} strategy={rectSortingStrategy}>
              {cardsOrder.map(cardId => (
                <React.Fragment key={cardId}>
                  {cardId === 'card-donut' && (
                    <SortableCard id="card-donut">
                      {/* CARD 1: DONUT CHART (Cursos por Área) */}
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
                    </SortableCard>
                  )}
                  {cardId === 'card-pie' && (
                    <SortableCard id="card-pie">
                      {/* CARD 2: PIE CHART (Distribuição do Ecossistema) */}
                      <div className="flex-1 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default">

                        {/* HEADER SECTION */}
                        <div className="flex justify-between items-start mb-3 relative z-10 w-full">
                          <div className="flex flex-col">
                            <h2 className="text-[#1D3557] font-extrabold text-[15px] tracking-tight">Distribuição do Ecossistema</h2>
                            <p className="text-[#457B9D]/60 text-[11px] font-medium mt-0.5">Visão geral das categorias e ranking</p>
                          </div>
                        </div>

                        <div className="flex flex-row items-center justify-between flex-1 gap-4">
                          {/* PIE CHART SVG */}
                          <div className="flex flex-col items-center justify-center w-[160px] shrink-0">
                            <div className="relative">
                              <PieChart width={160} height={160} className="drop-shadow-sm">
                                <Pie
                                  data={pieDataWithFill}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={0} // Buraco = 0 (Gráfico de Pizza completo)
                                  outerRadius={65} // Tamanho base
                                  paddingAngle={4} // O espaço/gap entre as fatias
                                  cornerRadius={5} // O tão desejado arredondamento de exatos 5px nas bordas!
                                  dataKey="value"
                                  stroke="none"
                                  minAngle={15} // Garante que fatias pequenas (valores 2, 5) tenham um tamanho mínimo visível perfeitamente matemático
                                  shape={(props) => {
                                    // Renderizamos um shape customizado para todas as fatias para poder aplicar CSS Transitions fluidas
                                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, cornerRadius, index } = props;
                                    const isHovered = hoveredPieIndex === index;
                                    const isOtherHovered = hoveredPieIndex !== null && !isHovered;

                                    return (
                                      <g
                                        style={{
                                          transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                                          transformOrigin: `${cx}px ${cy}px`,
                                          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)'
                                        }}
                                      >
                                        <Sector
                                          cx={cx}
                                          cy={cy}
                                          innerRadius={innerRadius}
                                          outerRadius={outerRadius}
                                          startAngle={startAngle}
                                          endAngle={endAngle}
                                          fill={fill}
                                          cornerRadius={cornerRadius}
                                          className="cursor-pointer drop-shadow-sm transition-opacity duration-300 ease-in-out"
                                          style={{ opacity: isOtherHovered ? 0.3 : 1 }}
                                          onMouseEnter={() => handlePieMouseEnter(index)}
                                          onMouseLeave={handlePieMouseLeave}
                                        />
                                      </g>
                                    );
                                  }}
                                />
                              </PieChart>
                            </div>
                            {/* TEXT STATS */}
                            <div className="flex flex-col items-center justify-center text-center w-full mt-3 h-[42px]">
                              <span className="text-[#1D3557] font-extrabold text-[22px] leading-none mb-1 tracking-tight transition-all duration-300">
                                {hoveredPieIndex !== null
                                  ? ecosystemData[hoveredPieIndex].value
                                  : ecosystemData.reduce((acc, item) => acc + item.value, 0)}
                              </span>
                              <span className="text-[#457B9D]/80 font-semibold text-[11px] leading-tight transition-all duration-300 px-1 w-full truncate">
                                {hoveredPieIndex !== null
                                  ? ecosystemData[hoveredPieIndex].region
                                  : 'Ativos Mapeados'}
                              </span>
                            </div>
                          </div>

                          {/* TOP 5 TERRITORIOS */}
                          <div className="flex flex-col flex-1 pl-8 lg:pl-10 border-l border-[#E2E8F0]/50 ml-6 justify-center h-full py-1">
                            <h3 className="text-[#1D3557] font-extrabold text-[11px] tracking-widest uppercase mb-4">Top 5 Territórios</h3>

                            <div className="flex flex-col gap-4">
                              {/* Isso ainda é estático, conectaremos depois se precisar */}
                              {[
                                { rank: 1, name: 'Metropolitano', count: 23, color: 'bg-[#1D3557]', text: 'text-white' },
                                { rank: 2, name: 'Litoral Norte', count: 14, color: 'bg-[#2563EB]/10', text: 'text-[#2563EB]' },
                                { rank: 3, name: 'Sudoeste', count: 9, color: 'bg-[#457B9D]/10', text: 'text-[#457B9D]' },
                                { rank: 4, name: 'Sul Baiano', count: 9, color: 'bg-[#A8DADC]/20', text: 'text-[#457B9D]' },
                                { rank: 5, name: 'Chapada', count: 4, color: 'bg-[#E2E8F0]/50', text: 'text-[#1D3557]' }
                              ].map((terr) => (
                                <div key={terr.rank} className="flex items-center justify-between group">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-[22px] h-[22px] rounded-full ${terr.color} ${terr.text} flex items-center justify-center font-bold text-[10px] shadow-sm`}>
                                      {terr.rank}º
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-[12px] font-bold text-[#2563EB] group-hover:text-[#1D3557] transition-colors line-clamp-1">{terr.name}</span>
                                    </div>
                                  </div>
                                  <span className="font-extrabold text-[#1D3557] text-[13px] ml-2">{terr.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </SortableCard>
                  )}
                  {cardId === 'card-ranking' && (
                    <SortableCard id="card-ranking">
                      {/* CARD 3: RANKING IFDM - AGORA 100% DINÂMICO E COM TOFIXED */}
                      <div className="flex-1 bg-white rounded-[24px] border border-gray-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col group cursor-default h-full">

                        {/* CABEÇALHO INSPIRADO NA REFERÊNCIA */}
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-[#1A202C] font-bold text-[15px] tracking-tight">Ranking IFDM</h3>
                            <p className="text-[#A0AEC0] font-medium text-[11px] mt-0.5">
                              {ifdmFilter === 'top' ? 'Top 5 melhores' : ifdmFilter === 'medium' ? '5 na média' : 'Top 5 piores'}
                            </p>
                          </div>

                          {/* TOGGLE HORIZONTAL (TOP / MEDIUM / BOTTOM) */}
                          <div className="flex flex-row items-center justify-center gap-[2px] bg-gray-50 border border-gray-100 rounded-[8px] p-1 mr-7 relative z-40">
                            <button
                              onClick={() => setIfdmFilter('top')}
                              className={`p-0.5 rounded transition-all duration-300 ${ifdmFilter === 'top' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
                              title="Top 5 melhores"
                            >
                              <ChevronUp size={14} strokeWidth={3.5} />
                            </button>
                            <button
                              onClick={() => setIfdmFilter('medium')}
                              className={`p-0.5 rounded transition-all duration-300 ${ifdmFilter === 'medium' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
                              title="5 na média"
                            >
                              <Minus size={14} strokeWidth={3.5} />
                            </button>
                            <button
                              onClick={() => setIfdmFilter('bottom')}
                              className={`p-0.5 rounded transition-all duration-300 ${ifdmFilter === 'bottom' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
                              title="Top 5 piores"
                            >
                              <ChevronDown size={14} strokeWidth={3.5} />
                            </button>
                          </div>
                        </div>

                        {/* GRÁFICO DE BARRAS DINÂMICO */}
                        <div className="flex-1 flex items-end justify-between gap-2 lg:gap-6 mt-4 px-2 pb-1 relative min-h-[140px]">

                          {/* Linhas de grade (Opcional, sutil) */}
                          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-gray-50 pb-6">
                            <div className="w-full h-px bg-gray-50"></div>
                            <div className="w-full h-px bg-gray-50"></div>
                            <div className="w-full h-px bg-gray-50"></div>
                          </div>

                          {(() => {
                            let data = [];
                            
                            // 1. Clonamos e ordenamos os dados reais da API pelo IFDM (Maior para o Menor)
                            const territoriosOrdenados = [...territoriosData]
                              .filter(t => t.media_ifdm !== null) // Tira quem não tem IFDM calculado
                              .sort((a, b) => Number(b.media_ifdm) - Number(a.media_ifdm));

                            if (territoriosOrdenados.length > 0) {
                              if (ifdmFilter === 'top') {
                                data = territoriosOrdenados.slice(0, 5);
                              } else if (ifdmFilter === 'bottom') {
                                data = territoriosOrdenados.slice(-5).reverse();
                              } else if (ifdmFilter === 'medium') {
                                const meio = Math.floor(territoriosOrdenados.length / 2);
                                data = territoriosOrdenados.slice(Math.max(0, meio - 2), meio + 3);
                              }
                            }

                            // 2. Mapeamos os dados reais para o formato exato
                            const chartData = data.map(t => ({
                              name: t.territorio.replace('Território de Identidade ', ''), // Limpa nomes longos
                              apls: Number(t.cadeias_produtivas || 0), 
                              igs: 0, 
                              ifdm: Number(t.media_ifdm)
                            }));

                            // 3. Renderiza as barrinhas
                            return chartData.map((item, idx) => {
                              const ifdmPercent = item.ifdm * 100;

                              return (
                                <div key={idx} className="flex flex-col items-center gap-3 group/col flex-1 h-full justify-end relative z-10">
                                  <div className="flex items-end justify-center w-full h-[85%] relative transition-transform duration-300">
                                    <div
                                      className="w-full max-w-[22px] bg-[#4361EE] rounded-full relative flex justify-center transition-all duration-500 ease-out group-hover/col:opacity-90 group-hover/col:shadow-[0_0_15px_rgba(67,97,238,0.3)]"
                                      style={{ height: `${ifdmPercent}%` }}
                                    >
                                      {/* DOT FLUTUANTE */}
                                      <div className="absolute -top-1 w-2.5 h-2.5 bg-gray-200 rounded-full border-[2px] border-white opacity-0 group-hover/col:opacity-100 transition-opacity duration-300 z-20 shadow-sm flex items-center justify-center">
                                        <div className="w-1 h-1 bg-[#1A202C] rounded-full"></div>
                                      </div>

                                      {/* TEXTO IFDM COM TOFIXED */}
                                      <span className="absolute -top-7 text-[10px] font-bold text-[#A0AEC0] group-hover/col:opacity-0 transition-opacity">
                                        {Number(item.ifdm).toFixed(3)}
                                      </span>

                                      {/* TOOLTIP DO GRÁFICO */}
                                      <div className="absolute bottom-[calc(100%+14px)] bg-[#1A202C] shadow-[0_10px_25px_rgba(0,0,0,0.15)] rounded-[12px] px-3 py-2.5 flex flex-col justify-center opacity-0 group-hover/col:opacity-100 transition-all duration-300 pointer-events-none z-30 translate-y-2 group-hover/col:translate-y-0 min-w-[105px] left-1/2 -translate-x-1/2">
                                        <div className="flex items-center mb-2">
                                          <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                                          <span className="text-[11px] font-bold text-white leading-none">{item.apls} <span className="text-[#A0AEC0] font-medium ml-0.5">Cadeias</span></span>
                                        </div>
                                        <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1A202C] rotate-45 rounded-sm"></div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-medium text-[#A0AEC0] text-center leading-tight truncate w-full group-hover/col:text-[#1A202C] transition-colors mt-1" title={item.name}>
                                    {item.name}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </SortableCard>
                  )}
                  {cardId === 'card-mapeamento' && (
                    <SortableCard id="card-mapeamento">
                      {/* CARD 4: MAPEAMENTO GERAL (GRÁFICO COMPACTO) */}
                      <div className="flex-1 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-between cursor-default h-full">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h2 className="text-[#1D3557] font-extrabold text-[14px] tracking-tight">Mapeamento Geral</h2>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between flex-1 w-full gap-2 mt-1">
                          {ecosystemData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 group">
                              <span className="text-[9px] font-bold text-[#1D3557] group-hover:text-[#2563EB] transition-colors w-[110px] truncate text-right">{item.region}</span>
                              <div className="flex-1 bg-[#E2E8F0]/40 h-1.5 rounded-full overflow-hidden flex items-center">
                                <div
                                  className={`h-full ${item.tailwind} rounded-full transition-all duration-1000 ease-out`}
                                  style={{ width: item.percent }}
                                />
                              </div>
                              <span className="text-[9px] font-extrabold text-[#457B9D] w-[20px]">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SortableCard>
                  )}
                </React.Fragment>
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </div>
    </main>
  );
}