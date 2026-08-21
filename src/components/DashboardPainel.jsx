import React, { useState, useContext, useMemo } from 'react';
import {
  Settings, GraduationCap, TrendingUp, Database, Building2, GripHorizontal
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

// IMPORTAÇÃO DOS DADOS E COMPONENTES
import { DataContext } from '../context/DataContext';
import PtiMap from './maps/PtiMap.jsx';

// COMPONENTES DE GRÁFICOS MODULARIZADOS
import DonutChart from './graph/DonutChart.jsx';
import CustomPieChart from './graph/CustomPieChart.jsx';
import RankingBarChart from './graph/RankingBarChart.jsx';
import ProportionBarChart from './graph/ProportionBarChart.jsx';

function SortableCard({ id, className = '', children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS?.Transform?.toString(transform) ?? undefined,
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 50 : 1,
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative h-full flex flex-col min-h-0 transform-gpu backface-hidden will-change-transform ${className} ${isDragging ? 'opacity-40 scale-[1.02] shadow-2xl' : ''
        }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute top-4 right-4 z-40 p-1.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 rounded-md hover:bg-gray-100 transition-colors duration-200 group-hover:text-[#1D3557]"
        title="Arrastar card"
      >
        <GripHorizontal size={18} />
      </button>
      {children}
    </div>
  );
}

export default function DashboardPainel() {
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

  // Cálculo de municípios do Semiárido
  const semiaridoStats = useMemo(() => {
    if (!territoriosData || territoriosData.length === 0) return { semiarido: 0, total: 0 };

    const semiarido = territoriosData.reduce((acc, t) => acc + Number(t.qtd_mun_semiarido || 0), 0);
    const naoSemiarido = territoriosData.reduce((acc, t) => acc + Number(t.qtd_mun_nao_semiarido || 0), 0);
    const total = semiarido + naoSemiarido;

    return {
      semiarido,
      total: total > 0 ? total : 417
    };
  }, [territoriosData]);

  // 1. DonutChart (Cursos)
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

  const topEntidadesCursos = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];

    const mapEntidades = {};
    cursosData.forEach(c => {
      const ent = c.entidade || 'Não informada';
      if (!mapEntidades[ent]) {
        const siglaDB = c.sigla ? String(c.sigla).toUpperCase().trim() : '';
        const textoParaExibir = siglaDB !== '' ? siglaDB : ent;
        mapEntidades[ent] = { name: ent, sigla: textoParaExibir, count: 0 };
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
        sigla: item.sigla,
        count: item.count,
        color: styles[idx % styles.length].bg,
        text: styles[idx % styles.length].text
      }));
  }, [cursosData]);

  // 2. CustomPieChart (Ativos CT&I)
  const ecosystemData = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];
    const counts = {};
    ativosData.forEach(a => {
      const tipo = a.tipo || a.nome_tipo || 'Outros';
      counts[tipo] = (counts[tipo] || 0) + 1;
    });

    const palette = ['#1D3557', '#2563EB', '#457B9D', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([region, value], idx) => ({
        region,
        value,
        colorHex: palette[idx % palette.length]
      }));
  }, [ativosData]);

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

  // 3. Infraestrutura RNP
  const rnpComparisonData = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];

    const stats = {
      'Univ. Federal': { com: 0, sem: 0 },
      'Univ. Estadual': { com: 0, sem: 0 },
      'Inst. Federal': { com: 0, sem: 0 },
      'ICT': { com: 0, sem: 0 }
    };

    ativosData.forEach(a => {
      const str = String(a.tipo || a.nome_tipo || '').toLowerCase();
      let categoria = null;

      if (str.includes('federal') && str.includes('universidade')) categoria = 'Univ. Federal';
      else if (str.includes('estadual')) categoria = 'Univ. Estadual';
      else if (str.includes('instituto federal') || str.includes('ifba') || str.includes('if baiano')) categoria = 'Inst. Federal';
      else if (str.includes('ict') || str.includes('pesquisa')) categoria = 'ICT';

      if (categoria) {
        const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || a.rnp === 't';
        if (hasRnp) stats[categoria].com += 1;
        else stats[categoria].sem += 1;
      }
    });

    return Object.entries(stats).map(([label, valores]) => ({
      label,
      positive: valores.com,
      negative: valores.sem,
      total: valores.com + valores.sem
    }));
  }, [ativosData]);

  // Configurações DnD
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

  const kpis = [
    { label: 'Ativos de CT&I', value: loadingStats ? '...' : kpisGlobais.ativos, icon: Settings },
    { label: 'Cursos de CT&I', value: loadingStats ? '...' : kpisGlobais.cursos, icon: GraduationCap },
    { label: 'D. Territorial (IFDM)', value: loadingStats ? '...' : kpisGlobais.ifdmMedio, icon: TrendingUp },
    { label: 'Cadeias Produtivas', value: loadingStats ? '...' : kpisGlobais.cadeias, icon: Database },
    {
      label: 'Municípios Semiárido',
      value: loadingStats ? '...' : `${semiaridoStats.semiarido}`,
      icon: Building2
    }
  ];

  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-5 bg-transparent font-sans w-full">

      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between w-full pr-[320px] shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-[#1D3557] tracking-tight">Visão Geral</h1>
          <p className="text-sm text-[#457B9D] mt-1 font-medium">Dashboard Integrado de CTI</p>
        </div>
      </div>

      {/* GRID DE KPIs COM ALINHAMENTO PROPORCIONAL AO GRID INFERIOR (12 COLUNAS) */}
      <div className="w-full relative z-10 shrink-0">
        {/* Layout sincronizado: 5 colunas estritamente proporcionais */}
        <div className="grid grid-cols-5 gap-5 items-stretch w-full">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="h-[88px] bg-white rounded-[22px] flex flex-col items-center justify-center relative border border-transparent hover:border-[#D6EAF8]/60 shadow-[0_4px_20px_rgba(29,53,87,0.04)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(29,53,87,0.08)] transition-all duration-300 group overflow-hidden text-center px-3 py-2 cursor-default"
            >
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8] text-[#457B9D] flex items-center justify-center mb-1 transition-transform duration-300 group-hover:scale-110">
                <kpi.icon size={15} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black text-[#1D3557] tracking-tight leading-none mb-1 whitespace-nowrap">
                {kpi.value}
              </span>
              <span className="text-[#457B9D] text-[8.5px] uppercase font-extrabold tracking-widest truncate max-w-full">
                {kpi.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]">

        {/* LADO ESQUERDO: MAPA INTEGRADO (alinhado com 2 KPIs: 2cols + 1gap do grid-cols-5 gap-5) */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.08)] transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden flex flex-col group min-h-[400px]">
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
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 auto-rows-[1fr] gap-5 h-full">
            <SortableContext items={cardsOrder} strategy={rectSortingStrategy}>
              {cardsOrder.map(cardId => (
                <React.Fragment key={cardId}>

                  {/* CARD 1: DONUT CHART */}
                  {cardId === 'card-donut' && (
                    <SortableCard id="card-donut">
                      <DonutChart
                        title="Cursos por Área"
                        subtitle="Distribuição oficial de cursos no estado"
                        totalLabel="Total de Cursos"
                        listTitle="Top 5 Instituições com mais cursos"
                        data={donutChartData.length > 0 ? donutChartData : [{ label: 'Carregando...', value: 1, color: '#E2E8F0' }]}
                        topList={topEntidadesCursos}
                      />
                    </SortableCard>
                  )}

                  {/* CARD 2: PIE CHART */}
                  {cardId === 'card-pie' && (
                    <SortableCard id="card-pie">
                      <CustomPieChart
                        data={ecosystemData}
                        topList={topTerritoriosAtivos}
                        title="Distribuição dos Ativos de CT&I"
                        subtitle="Visão geral das categorias e ranking"
                        listTitle="Top 5 Territórios com Mais Ativos"
                        defaultCenterLabel="Ativos Mapeados"
                        labelKey="region"
                        valueKey="value"
                        colorKey="colorHex"
                      />
                    </SortableCard>
                  )}

                  {/* CARD 3: RANKING IFDM */}
                  {cardId === 'card-ranking' && (
                    <SortableCard id="card-ranking">
                      <RankingBarChart
                        data={territoriosData}
                        title="Ranking IFDM"
                        valueKey="media_ifdm"
                        labelKey="territorio"
                        extraKey="cadeias_produtivas"
                        extraLabel="Cadeias"
                        topSubtitle="Top 5 melhores"
                        mediumSubtitle="5 na média"
                        bottomSubtitle="Top 5 piores"
                        maxScale={1}
                      />
                    </SortableCard>
                  )}

                  {/* CARD 4: PROPORTION RNP */}
                  {cardId === 'card-mapeamento' && (
                    <SortableCard id="card-mapeamento">
                      <ProportionBarChart
                        data={rnpComparisonData}
                        title="Infraestrutura RNP"
                        subtitle="Proporção de ativos conectados à Rede Nacional de Pesquisa"
                        positiveLabel="Com RNP"
                        negativeLabel="Sem RNP"
                        positiveColor="bg-[#2563EB]"
                        negativeColor="bg-[#E2E8F0]"
                      />
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