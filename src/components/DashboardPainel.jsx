import React, { useState, useRef, useContext, useMemo } from 'react';
import {
  Settings, GraduationCap, TrendingUp, Database, Building2,
  ChevronDown, ChevronUp, Minus, Map, MapPin, GripHorizontal
} from 'lucide-react';
import { PieChart, Pie, Sector } from 'recharts';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

// IMPORTAÇÃO DOS DADOS E COMPONENTES
import { DataContext } from '../context/DataContext';
import PtiMap from './PtiMap.jsx';
import DonutChart from './DonutChart.jsx';
import UserHeaderProfile from './UserHeaderProfile.jsx';

function SortableCard({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative',
    height: '100%',
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative h-full group ${isDragging ? 'opacity-80 scale-105 shadow-2xl' : ''}`}>
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
  // CONSUMINDO O CONTEXTO GLOBAL DA API
  // =========================================================================
  const { 
    kpisGlobais, 
    loadingStats, 
    territoriosData, 
    ativosData, 
    cursosData, 
    territoriesDynamicStats, 
    selectedTerritory, 
    setSelectedTerritory 
  } = useContext(DataContext);

  const [viewMode, setViewMode] = useState('territorio');
  const [ifdmFilter, setIfdmFilter] = useState('top');
  const [hoveredPieIndex, setHoveredPieIndex] = useState(null);

  // =========================================================================
  // PROCESSAMENTO DE DADOS REAIS PARA OS GRÁFICOS
  // =========================================================================

  // 1. Dados para o DonutChart (Cursos)
  const donutChartData = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    const counts = {};
    cursosData.forEach(c => {
      const cat = c.categoria || 'Outras Áreas';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const palette = ['#1D3557', '#2563EB', '#457B9D', '#A8DADC', '#F87171', '#F59E0B'];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], idx) => ({
        label, value, color: palette[idx % palette.length]
      }));
  }, [cursosData]);

  // Top 5 Entidades que mais oferecem cursos (USANDO A SIGLA DO BANCO EM UPPERCASE)
  const topEntidadesCursos = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    
    const mapEntidades = {};

    cursosData.forEach(c => {
      const ent = c.entidade || 'Não informada';
      
      if (!mapEntidades[ent]) {
        // Puxa a sigla oficial do banco e tira os espaços
        const siglaDB = c.sigla ? String(c.sigla).toUpperCase().trim() : '';

        // A REGRA: Se tiver sigla no banco, usa ela. Se não tiver, usa o nome por extenso!
        const textoParaExibir = siglaDB !== '' ? siglaDB : ent;

        mapEntidades[ent] = {
          name: ent,
          sigla: textoParaExibir,
          count: 0
        };
      }
      mapEntidades[ent].count += 1;
    });

    const styles = [
      { bg: 'bg-[#1D3557]', text: 'text-white' },
      { bg: 'bg-[#2563EB]/10', text: 'text-[#2563EB]' },
      { bg: 'bg-[#457B9D]/10', text: 'text-[#457B9D]' },
      { bg: 'bg-[#A8DADC]/20', text: 'text-[#457B9D]' },
      { bg: 'bg-[#E2E8F0]/50', text: 'text-[#1D3557]' }
    ];

    return Object.values(mapEntidades)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item, idx) => ({
        rank: idx + 1, 
        name: item.name, 
        sigla: item.sigla, // Aqui vai a sigla ou o nome extenso
        count: item.count,
        color: styles[idx % styles.length].bg,
        text: styles[idx % styles.length].text
      }));
  }, [cursosData]);

  // 2. Dados para o PieChart e Mapeamento (Distribuição do Ecossistema)
  const ecosystemData = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];
    const counts = {};
    ativosData.forEach(a => {
      const tipo = a.tipo || a.nome_tipo || 'Outros';
      counts[tipo] = (counts[tipo] || 0) + 1;
    });

    // Encontra a Categoria que tem MAIS ativos para basear o 100% da barra horizontal nela
    const maxCount = Math.max(...Object.values(counts), 1);

    const palette = [
      { hex: '#1D3557', tailwind: 'bg-[#1D3557]' },
      { hex: '#2563EB', tailwind: 'bg-[#2563EB]' },
      { hex: '#457B9D', tailwind: 'bg-[#457B9D]' },
      { hex: '#06B6D4', tailwind: 'bg-[#06B6D4]' },
      { hex: '#10B981', tailwind: 'bg-[#10B981]' },
      { hex: '#F59E0B', tailwind: 'bg-[#F59E0B]' },
      { hex: '#EF4444', tailwind: 'bg-[#EF4444]' },
      { hex: '#8B5CF6', tailwind: 'bg-[#8B5CF6]' }
    ];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([region, value], idx) => ({
        region, 
        value,
        // Proporção baseada no Máximo (para as barras horizontais preencherem 100%)
        percentMax: `${((value / maxCount) * 100).toFixed(1)}%`,
        colorHex: palette[idx % palette.length].hex,
        tailwind: palette[idx % palette.length].tailwind
      }));
  }, [ativosData]);

  const pieDataWithFill = ecosystemData.map(item => ({ ...item, fill: item.colorHex }));

  // Top 5 Territórios com mais Ativos
  const topTerritoriosAtivos = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];
    const counts = {};
    ativosData.forEach(a => {
      const terr = a.territorio_identidade || 'Não identificado';
      counts[terr] = (counts[terr] || 0) + 1;
    });

    const styles = [
      { bg: 'bg-[#1D3557]', text: 'text-white' },
      { bg: 'bg-[#2563EB]/10', text: 'text-[#2563EB]' },
      { bg: 'bg-[#457B9D]/10', text: 'text-[#457B9D]' },
      { bg: 'bg-[#A8DADC]/20', text: 'text-[#457B9D]' },
      { bg: 'bg-[#E2E8F0]/50', text: 'text-[#1D3557]' }
    ];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([terr, count], idx) => ({
        rank: idx + 1,
        name: terr.replace('Território de Identidade ', ''),
        count,
        color: styles[idx % styles.length].bg,
        text: styles[idx % styles.length].text
      }));
  }, [ativosData]);


  // =========================================================================
  // CONFIGURAÇÕES DO DRAG & DROP
  // =========================================================================
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
    pieHoverTimeoutRef.current = setTimeout(() => setHoveredPieIndex(null), 150);
  };

  const kpis = [
    { label: 'Ativos', value: loadingStats ? '...' : kpisGlobais.ativos, icon: Settings },
    { label: 'Cursos', value: loadingStats ? '...' : kpisGlobais.cursos, icon: GraduationCap },
    { label: 'Índice', value: loadingStats ? '...' : kpisGlobais.ifdmMedio, icon: TrendingUp },
    { label: 'Cadeias', value: loadingStats ? '...' : kpisGlobais.cadeias, icon: Database },
    { label: 'Territórios', value: loadingStats ? '...' : kpisGlobais.territorios, icon: Building2 }
  ];

  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-6 bg-transparent font-sans w-full">

      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl font-bold text-[#1D3557] tracking-tight">Visão Geral</h1>
          <p className="text-sm text-[#457B9D] mt-1.5 font-medium">Dashboard Integrado de CTI</p>
        </div>

        <div className="flex items-center gap-6">
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 min-h-[500px]">

        {/* LADO ESQUERDO: MAPA INTEGRADO */}
        <div className="lg:col-span-5 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 relative overflow-hidden flex flex-col group min-h-[400px]">
          <p className="absolute top-5 left-5 text-[#457B9D]/50 font-mono tracking-widest uppercase text-[10px] z-20 pointer-events-none group-hover:text-[#457B9D] transition-colors">
            Mapa Territorial
          </p>

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

        {/* LADO DIREITO: DASHBOARD DE CARDS (DND) */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 auto-rows-[1fr] gap-5 h-full">
            <SortableContext items={cardsOrder} strategy={rectSortingStrategy}>
              {cardsOrder.map(cardId => (
                <React.Fragment key={cardId}>
                  
                  {cardId === 'card-donut' && (
                    <SortableCard id="card-donut">
                      <DonutChart
                        title="Cursos por Área"
                        subtitle="Distribuição oficial de cursos no estado"
                        totalLabel="Total de Cursos"
                        listTitle="Top 5 Instituições"
                        data={donutChartData.length > 0 ? donutChartData : [{ label: 'Carregando...', value: 1, color: '#E2E8F0' }]}
                        topList={topEntidadesCursos}
                      />
                    </SortableCard>
                  )}

                  {cardId === 'card-pie' && (
                    <SortableCard id="card-pie">
                      <div className="flex-1 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default">
                        <div className="flex justify-between items-start mb-3 relative z-10 w-full">
                          <div className="flex flex-col">
                            <h2 className="text-[#1D3557] font-extrabold text-[15px] tracking-tight">Distribuição do Ecossistema</h2>
                            <p className="text-[#457B9D]/60 text-[11px] font-medium mt-0.5">Visão geral das categorias e ranking</p>
                          </div>
                        </div>

                        <div className="flex flex-row items-center justify-between flex-1 gap-4 min-w-0">
                          <div className="flex flex-col items-center justify-center w-[140px] shrink-0">
                            <div className="relative">
                              <PieChart width={140} height={140} className="drop-shadow-sm">
                                <Pie
                                  data={pieDataWithFill.length > 0 ? pieDataWithFill : [{ value: 1, fill: '#E2E8F0' }]}
                                  cx="50%" cy="50%" innerRadius={0} outerRadius={60} paddingAngle={4} cornerRadius={5}
                                  dataKey="value" stroke="none" minAngle={15}
                                  shape={(props) => {
                                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, cornerRadius, index } = props;
                                    const isHovered = hoveredPieIndex === index;
                                    const isOtherHovered = hoveredPieIndex !== null && !isHovered;
                                    
                                    return (
                                      <g style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)', transformOrigin: `${cx}px ${cy}px`, transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
                                        <Sector
                                          cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius}
                                          startAngle={startAngle} endAngle={endAngle} fill={fill} cornerRadius={cornerRadius}
                                          className="cursor-pointer drop-shadow-sm transition-opacity duration-300 ease-in-out"
                                          style={{ opacity: isOtherHovered ? 0.3 : 1 }}
                                          onMouseEnter={() => handlePieMouseEnter(index)} onMouseLeave={handlePieMouseLeave}
                                        />
                                      </g>
                                    );
                                  }}
                                />
                              </PieChart>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center w-full mt-3 h-[38px]">
                              <span className="text-[#1D3557] font-extrabold text-[20px] leading-none mb-1 tracking-tight transition-all duration-300">
                                {hoveredPieIndex !== null ? ecosystemData[hoveredPieIndex].value : ecosystemData.reduce((acc, item) => acc + item.value, 0)}
                              </span>
                              <span className="text-[#457B9D]/80 font-semibold text-[10px] leading-tight transition-all duration-300 px-1 w-full truncate">
                                {hoveredPieIndex !== null ? ecosystemData[hoveredPieIndex].region : 'Ativos Mapeados'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col flex-1 pl-4 lg:pl-6 border-l border-[#E2E8F0]/50 justify-center h-full py-1 min-w-0">
                            <h3 className="text-[#1D3557] font-extrabold text-[10px] tracking-widest uppercase mb-3 truncate">Top 5 Territórios</h3>
                            <div className="flex flex-col gap-3.5 w-full">
                              {topTerritoriosAtivos.map((terr) => (
                                <div key={terr.rank} className="flex items-center justify-between group min-w-0 gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`w-[20px] h-[20px] rounded-md ${terr.color} ${terr.text} flex items-center justify-center font-bold text-[9px] shadow-sm shrink-0`}>
                                      {terr.rank}º
                                    </div>
                                    <span className="text-[11px] font-bold text-[#2563EB] group-hover:text-[#1D3557] transition-colors truncate" title={terr.name}>{terr.name}</span>
                                  </div>
                                  <span className="font-extrabold text-[#1D3557] text-[12px] shrink-0">{terr.count}</span>
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
                      <div className="flex-1 bg-white rounded-[24px] border border-gray-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col group cursor-default h-full">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-[#1A202C] font-bold text-[15px] tracking-tight">Ranking IFDM</h3>
                            <p className="text-[#A0AEC0] font-medium text-[11px] mt-0.5">
                              {ifdmFilter === 'top' ? 'Top 5 melhores' : ifdmFilter === 'medium' ? '5 na média' : 'Top 5 piores'}
                            </p>
                          </div>
                          <div className="flex flex-row items-center justify-center gap-[2px] bg-gray-50 border border-gray-100 rounded-[8px] p-1 mr-7 relative z-40">
                            <button onClick={() => setIfdmFilter('top')} className={`p-0.5 rounded transition-all duration-300 ${ifdmFilter === 'top' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`} title="Top 5 melhores"><ChevronUp size={14} strokeWidth={3.5} /></button>
                            <button onClick={() => setIfdmFilter('medium')} className={`p-0.5 rounded transition-all duration-300 ${ifdmFilter === 'medium' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`} title="5 na média"><Minus size={14} strokeWidth={3.5} /></button>
                            <button onClick={() => setIfdmFilter('bottom')} className={`p-0.5 rounded transition-all duration-300 ${ifdmFilter === 'bottom' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`} title="Top 5 piores"><ChevronDown size={14} strokeWidth={3.5} /></button>
                          </div>
                        </div>

                        <div className="flex-1 flex items-end justify-between gap-1.5 lg:gap-4 mt-2 px-1 pb-2 relative min-h-[140px]">
                          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-gray-50 pb-6 z-0">
                            <div className="w-full h-px bg-gray-50"></div>
                            <div className="w-full h-px bg-gray-50"></div>
                            <div className="w-full h-px bg-gray-50"></div>
                          </div>

                          {(() => {
                            let data = [];
                            const territoriosOrdenados = [...territoriosData]
                              .filter(t => t.media_ifdm !== null)
                              .sort((a, b) => Number(b.media_ifdm) - Number(a.media_ifdm));

                            if (territoriosOrdenados.length > 0) {
                              if (ifdmFilter === 'top') data = territoriosOrdenados.slice(0, 5);
                              else if (ifdmFilter === 'bottom') data = territoriosOrdenados.slice(-5).reverse();
                              else if (ifdmFilter === 'medium') {
                                const meio = Math.floor(territoriosOrdenados.length / 2);
                                data = territoriosOrdenados.slice(Math.max(0, meio - 2), meio + 3);
                              }
                            }

                            const chartData = data.map(t => ({
                              name: t.territorio.replace('Território de Identidade ', ''),
                              apls: Number(t.cadeias_produtivas || 0), 
                              igs: 0, 
                              ifdm: Number(t.media_ifdm)
                            }));

                            return chartData.map((item, idx) => {
                              const ifdmPercent = item.ifdm * 100;
                              return (
                                <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end relative z-10 min-w-0 group/col">
                                  <div className="flex items-end justify-center w-full h-[80%] relative transition-transform duration-300">
                                    <div
                                      className="w-full max-w-[20px] bg-[#4361EE] rounded-full relative flex justify-center transition-all duration-500 ease-out group-hover/col:opacity-90 group-hover/col:shadow-[0_0_15px_rgba(67,97,238,0.3)]"
                                      style={{ height: `${ifdmPercent}%` }}
                                    >
                                      <div className="absolute -top-1 w-2.5 h-2.5 bg-gray-200 rounded-full border-[2px] border-white opacity-0 group-hover/col:opacity-100 transition-opacity duration-300 z-20 shadow-sm flex items-center justify-center">
                                        <div className="w-1 h-1 bg-[#1A202C] rounded-full"></div>
                                      </div>
                                      <span className="absolute -top-6 text-[9px] font-bold text-[#A0AEC0] group-hover/col:opacity-0 transition-opacity">
                                        {(Math.trunc(Number(item.ifdm) * 1000) / 1000).toFixed(3)}
                                      </span>
                                      <div className="absolute bottom-[calc(100%+14px)] bg-[#1A202C] shadow-[0_10px_25px_rgba(0,0,0,0.15)] rounded-[12px] px-3 py-2.5 flex flex-col justify-center opacity-0 group-hover/col:opacity-100 transition-all duration-300 pointer-events-none z-30 translate-y-2 group-hover/col:translate-y-0 min-w-[105px] left-1/2 -translate-x-1/2">
                                        <div className="flex items-center mb-2">
                                          <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                                          <span className="text-[11px] font-bold text-white leading-none">{item.apls} <span className="text-[#A0AEC0] font-medium ml-0.5">Cadeias</span></span>
                                        </div>
                                        <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1A202C] rotate-45 rounded-sm"></div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-[9px] font-medium text-[#A0AEC0] text-center leading-tight truncate w-full group-hover/col:text-[#1A202C] transition-colors mt-2 px-0.5" title={item.name}>
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
                      <div className="flex-1 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-between cursor-default h-full">
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <h2 className="text-[#1D3557] font-extrabold text-[14px] tracking-tight">Mapeamento Geral</h2>
                            <p className="text-[#457B9D]/60 text-[10px] font-medium mt-0.5">Proporção total baseada na categoria líder</p>
                          </div>
                        </div>
                        <div className="flex flex-col justify-between flex-1 w-full gap-2 mt-1">
                          {ecosystemData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 group min-w-0">
                              <span className="text-[10px] font-bold text-[#1D3557] group-hover:text-[#2563EB] transition-colors w-[120px] truncate text-right shrink-0" title={item.region}>
                                {item.region}
                              </span>
                              <div className="flex-1 bg-[#E2E8F0]/40 h-1.5 rounded-full overflow-hidden flex items-center min-w-0">
                                {/* BARRA PREENCHIDA COM BASE NO VALOR MÁXIMO E NÃO NO TOTAL */}
                                <div className={`h-full ${item.tailwind} rounded-full transition-all duration-1000 ease-out`} style={{ width: item.percentMax }} />
                              </div>
                              <span className="text-[10px] font-extrabold text-[#457B9D] w-[24px] text-left shrink-0">
                                {item.value}
                              </span>
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