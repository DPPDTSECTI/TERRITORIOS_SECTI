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
import { municipiosDB } from '../data/municipiosDB';
import PtiMap from './maps/PtiMap.jsx';

// COMPONENTES DE GRÁFICOS MODULARIZADOS
import DonutChart from './graph/DonutChart.jsx';
import CustomPieChart from './graph/CustomPieChart.jsx';
import RankingBarChart from './graph/RankingBarChart.jsx';
import ProportionBarChart from './graph/ProportionBarChart.jsx';

function normalizeName(value) {
  if (!value) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTerritoryName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(territorio\s+de\s+identidade|territorio\s+identidade|territorio)\s+/i, '')
    .trim();
}

const MUN_LOOKUP = (() => {
  const byName = {};
  municipiosDB.forEach((row) => {
    byName[normalizeName(row.nome_municipio)] = row;
  });
  return { byName };
})();

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
      className={`relative h-full flex flex-col min-h-0 backface-hidden ${className} ${isDragging ? 'opacity-40 scale-[1.02] shadow-card-hover' : ''
        }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute top-4 right-4 z-40 p-1.5 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary rounded-md hover:bg-surface-soft transition-colors duration-200"
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

  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // 1. Ativos Filtrados pelo Território Selecionado
  const scopedAtivos = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];
    if (!selectedTerritory) return ativosData;

    const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
    const tNorm = normalizeTerritoryName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

    return ativosData.filter(a => {
      const munKey = normalizeName(a.municipio || '');
      const munRow = MUN_LOOKUP.byName[munKey];
      const idTerr = a.id_territorio != null && a.id_territorio !== '' ? String(a.id_territorio) : (munRow?.id_territorio ? String(munRow.id_territorio) : null);
      const rawTerr = a.territorio_identidade || a.territorio || munRow?.nome_territorio || '';
      const normTerr = normalizeTerritoryName(rawTerr);

      if (tid && idTerr && idTerr === tid) return true;
      if (tNorm && normTerr && (normTerr === tNorm || normTerr.includes(tNorm) || tNorm.includes(normTerr))) return true;
      return false;
    });
  }, [ativosData, selectedTerritory]);

  // 2. Cursos Filtrados pelo Território Selecionado
  const scopedCursos = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    if (!selectedTerritory) return cursosData;

    const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
    const tNorm = normalizeTerritoryName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

    return cursosData.filter(c => {
      const munKey = normalizeName(c.municipio || '');
      const munRow = MUN_LOOKUP.byName[munKey];
      const idTerr = c.id_territorio != null && c.id_territorio !== '' ? String(c.id_territorio) : (munRow?.id_territorio ? String(munRow.id_territorio) : null);
      const rawTerr = c.territorio_identidade || c.territorio || munRow?.nome_territorio || '';
      const normTerr = normalizeTerritoryName(rawTerr);

      if (tid && idTerr && idTerr === tid) return true;
      if (tNorm && normTerr && (normTerr === tNorm || normTerr.includes(tNorm) || tNorm.includes(normTerr))) return true;
      return false;
    });
  }, [cursosData, selectedTerritory]);

  // 3. Dados Consolidados do Território Selecionado
  const scopedTerritorioRow = useMemo(() => {
    if (!selectedTerritory || !territoriosData) return null;
    const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
    const tNorm = normalizeTerritoryName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

    return territoriosData.find(t => {
      if (tid && String(t.id_territorio) === tid) return true;
      const norm = normalizeTerritoryName(t.territorio || t.nome_territorio || '');
      return norm === tNorm || norm.includes(tNorm) || tNorm.includes(norm);
    });
  }, [selectedTerritory, territoriosData]);

  // 4. Cálculo de municípios do Semiárido (global ou por território)
  const semiaridoStats = useMemo(() => {
    if (!territoriosData || territoriosData.length === 0) return { semiarido: 0, total: 0 };

    if (selectedTerritory && scopedTerritorioRow) {
      const semiarido = Number(scopedTerritorioRow.qtd_mun_semiarido || 0);
      const total = Number(scopedTerritorioRow.qtd_mun_total || (semiarido + Number(scopedTerritorioRow.qtd_mun_nao_semiarido || 0)));
      return { semiarido, total };
    }

    const semiarido = territoriosData.reduce((acc, t) => acc + Number(t.qtd_mun_semiarido || 0), 0);
    const naoSemiarido = territoriosData.reduce((acc, t) => acc + Number(t.qtd_mun_nao_semiarido || 0), 0);
    const total = semiarido + naoSemiarido;

    return {
      semiarido,
      total: total > 0 ? total : 417
    };
  }, [territoriosData, selectedTerritory, scopedTerritorioRow]);

  // 5. DonutChart (Cursos por Área)
  const donutChartData = useMemo(() => {
    if (!scopedCursos || scopedCursos.length === 0) return [];
    const counts = {};
    scopedCursos.forEach(c => {
      const cat = c.categoria || 'Outras Áreas';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const palette = ['#1D3557', '#2563EB', '#457B9D', '#A8DADC', '#F87171', '#F59E0B'];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], idx) => ({
        label, value, color: palette[idx % palette.length]
      }));
  }, [scopedCursos]);

  // Top Instituições de Ensino com Cursos
  const topEntidadesCursos = useMemo(() => {
    if (!scopedCursos || scopedCursos.length === 0) return [];

    const mapEntidades = {};
    scopedCursos.forEach(c => {
      // Pega a instituição com fallback em cascata (instituicao -> nome_ativo -> sigla -> entidade)
      const nomeInst = c.instituicao || c.nome_ativo || c.entidade || c.sigla || 'Outras Instituições';
      const siglaInst = (c.sigla && String(c.sigla).trim() !== '')
        ? String(c.sigla).toUpperCase().trim()
        : nomeInst;

      const chaveAgrupamento = siglaInst;

      if (!mapEntidades[chaveAgrupamento]) {
        mapEntidades[chaveAgrupamento] = {
          name: nomeInst,
          sigla: siglaInst,
          count: 0
        };
      }
      mapEntidades[chaveAgrupamento].count += 1;
    });

    const styles = [
      { bg: 'bg-primary-900', text: 'text-white' },
      { bg: 'bg-primary-600/10', text: 'text-primary-600' },
      { bg: 'bg-primary-600/10', text: 'text-text-secondary' },
      { bg: 'bg-primary-300/20', text: 'text-text-secondary' },
      { bg: 'bg-border/50', text: 'text-text-primary' }
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
  }, [scopedCursos]);

  // 6. CustomPieChart (Distribuição dos Ativos de CT&I)
  const ecosystemData = useMemo(() => {
    if (!scopedAtivos || scopedAtivos.length === 0) return [];
    const counts = {};
    scopedAtivos.forEach(a => {
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
  }, [scopedAtivos]);

  // Top Territórios (ou Municípios se território selecionado) com mais ativos
  const topTerritoriosOuMunicipiosAtivos = useMemo(() => {
    if (!scopedAtivos || scopedAtivos.length === 0) return [];
    const counts = {};

    scopedAtivos.forEach(a => {
      let key;
      if (selectedTerritory) {
        key = a.municipio || 'Não informado';
      } else {
        const munKey = normalizeName(a.municipio || '');
        const munRow = MUN_LOOKUP.byName[munKey];
        const rawTerr = a.territorio_identidade || a.territorio || munRow?.nome_territorio || 'Não identificado';
        key = rawTerr.replace(/^Território de Identidade\s+/i, '').trim();
      }
      counts[key] = (counts[key] || 0) + 1;
    });

    const styles = [
      { bg: 'bg-primary-900', text: 'text-white' },
      { bg: 'bg-primary-600/10', text: 'text-primary-600' },
      { bg: 'bg-primary-600/10', text: 'text-text-secondary' },
      { bg: 'bg-primary-300/20', text: 'text-text-secondary' },
      { bg: 'bg-border/50', text: 'text-text-primary' }
    ];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], idx) => ({
        rank: idx + 1,
        name,
        count,
        color: styles[idx % styles.length].bg,
        text: styles[idx % styles.length].text
      }));
  }, [scopedAtivos, selectedTerritory]);

  // 7. Infraestrutura RNP
  const rnpComparisonData = useMemo(() => {
    if (!scopedAtivos || scopedAtivos.length === 0) return [];

    const stats = {
      'Univ. Federal': { com: 0, sem: 0 },
      'Univ. Estadual': { com: 0, sem: 0 },
      'Inst. Federal': { com: 0, sem: 0 },
      'ICT': { com: 0, sem: 0 }
    };

    scopedAtivos.forEach(a => {
      const str = String(a.tipo || a.nome_tipo || '').toLowerCase();
      let categoria = null;

      if (str.includes('federal') && str.includes('universidade')) categoria = 'Univ. Federal';
      else if (str.includes('estadual')) categoria = 'Univ. Estadual';
      else if (str.includes('instituto federal') || str.includes('ifba') || str.includes('if baiano')) categoria = 'Inst. Federal';
      else if (str.includes('ict') || str.includes('pesquisa')) categoria = 'ICT';

      if (categoria) {
        const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || a.rnp === '1' || a.rnp === 't' || a.rnp === 'T' || String(a.rnp || '').toLowerCase() === 'sim' || String(a.rnp || '').toLowerCase() === 'true';
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
  }, [scopedAtivos]);

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

  // Formatação com vírgula para o índice IFDM
  const formattedIfdm = useMemo(() => {
    if (loadingStats) return '...';
    const raw = selectedTerritory
      ? (scopedTerritorioRow?.media_ifdm != null ? Number(scopedTerritorioRow.media_ifdm).toFixed(3) : kpisGlobais.ifdmMedio)
      : kpisGlobais.ifdmMedio;
    if (raw === null || raw === undefined || raw === '') return '-';
    return String(raw).replace('.', ',');
  }, [selectedTerritory, scopedTerritorioRow, kpisGlobais.ifdmMedio, loadingStats]);

  // KPIs Dinâmicos contextuais à região
  const kpis = [
    {
      label: selectedTerritory ? `Ativos em ${territoryName}` : 'Ativos de CT&I',
      value: loadingStats ? '...' : (selectedTerritory ? scopedAtivos.length : kpisGlobais.ativos),
      icon: Settings,
      isIndex: false
    },
    {
      label: selectedTerritory ? `Cursos em ${territoryName}` : 'Cursos de CT&I',
      value: loadingStats ? '...' : (selectedTerritory ? scopedCursos.length : kpisGlobais.cursos),
      icon: GraduationCap,
      isIndex: false
    },
    {
      label: selectedTerritory ? `IFDM · ${territoryName}` : 'D. Territorial (IFDM)',
      value: formattedIfdm,
      icon: TrendingUp,
      isIndex: true
    },
    {
      label: selectedTerritory ? `Cadeias no Território` : 'Cadeias Produtivas',
      value: loadingStats ? '...' : (selectedTerritory ? (scopedTerritorioRow?.cadeias_produtivas ?? 0) : kpisGlobais.cadeias),
      icon: Database,
      isIndex: false
    },
    {
      label: selectedTerritory ? 'Municípios no Território' : 'Municípios Semiárido',
      value: loadingStats ? '...' : (selectedTerritory ? (scopedTerritorioRow ? `${scopedTerritorioRow.qtd_mun_total || (Number(scopedTerritorioRow.qtd_mun_semiarido || 0) + Number(scopedTerritorioRow.qtd_mun_nao_semiarido || 0))} mun.` : '-') : `${semiaridoStats.semiarido}`),
      icon: Building2,
      isIndex: false
    }
  ];

  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-5 bg-transparent font-sans w-full">

      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between w-full pr-[320px] shrink-0">
        <div>
          <div className="flex items-center gap-3 relative z-10">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Visão Geral</h1>
            <div className="carto-node mt-2 opacity-80"></div>
          </div>
          <p className="text-sm text-text-secondary mt-1 font-medium">Dashboard Integrado de CTI</p>
          <div className="divider-territorial w-48 mt-3"></div>
        </div>
      </div>

      {/* GRID DE KPIs (5 COLUNAS, FAIXA HORIZONTAL ÚNICA, DESIGN MODERNO/LINEAR) */}
      <div className="tour-kpis w-full relative z-10 shrink-0">
        <div className="grid grid-cols-5 gap-3.5 items-stretch w-full">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className={`h-[98px] bg-surface rounded-xl p-4 flex flex-col justify-between border border-border shadow-sm hover:shadow-md transition-shadow duration-200 cursor-default ${index === 0 ? 'kpi-accent-primary' : index === 1 ? 'kpi-accent-success' : index === 2 ? 'kpi-accent-accent' : index === 3 ? 'kpi-accent-warning' : 'kpi-accent-neutral'}`}
            >
              {/* LINHA SUPERIOR: ÍCONE DISCRETO + TÍTULO COM CORES ORIGINAIS */}
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-primary-200/70 text-text-secondary flex items-center justify-center shrink-0">
                    <kpi.icon size={14} strokeWidth={2.5} />
                  </div>
                  <span
                    className="text-[11px] font-semibold uppercase text-text-secondary truncate"
                    title={kpi.label}
                  >
                    {kpi.label}
                  </span>
                </div>
                {kpi.isIndex && (
                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md bg-primary-200/60 text-text-primary shrink-0 leading-none">
                    Índice
                  </span>
                )}
              </div>

              {/* LINHA INFERIOR: NÚMERO PRINCIPAL CENTRALIZADO */}
              <div className="flex items-center justify-center w-full min-w-0 pt-1">
                <span className="text-[30px] font-medium text-text-primary tracking-tight leading-none text-center">
                  {kpi.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]">

        {/* LADO ESQUERDO: MAPA INTEGRADO */}
        <div style={{ width: 'calc(40% - 12px)' }} className="tour-map shrink-0 bg-surface rounded-xl border border-border shadow-sm relative overflow-hidden flex flex-col min-h-[400px]">
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
          <div className="tour-charts flex-1 grid grid-cols-1 md:grid-cols-2 auto-rows-[1fr] gap-5 h-full">
            <SortableContext items={cardsOrder} strategy={rectSortingStrategy}>
              {cardsOrder.map(cardId => (
                <React.Fragment key={cardId}>

                  {/* CARD 1: DONUT CHART (CURSOS) */}
                  {cardId === 'card-donut' && (
                    <SortableCard id="card-donut">
                      <DonutChart
                        title={selectedTerritory ? `Cursos em ${territoryName}` : 'Cursos por Área'}
                        subtitle={selectedTerritory ? `${scopedCursos.length} cursos mapeados na região` : 'Distribuição oficial de cursos no estado'}
                        totalLabel="Total de Cursos"
                        listTitle={selectedTerritory ? 'Top Instituições na Região' : 'Top 5 Instituições com mais cursos'}
                        data={donutChartData.length > 0 ? donutChartData : [{ label: 'Sem cursos mapeados', value: 1, color: '#E2E8F0' }]}
                        topList={topEntidadesCursos}
                      />
                    </SortableCard>
                  )}

                  {/* CARD 2: PIE CHART (ATIVOS CT&I) */}
                  {cardId === 'card-pie' && (
                    <SortableCard id="card-pie">
                      <CustomPieChart
                        data={ecosystemData}
                        topList={topTerritoriosOuMunicipiosAtivos}
                        title={selectedTerritory ? `Ativos em ${territoryName}` : 'Distribuição dos Ativos de CT&I'}
                        subtitle={selectedTerritory ? `${scopedAtivos.length} ativos distribuídos por tipologia` : 'Visão geral das categorias e ranking'}
                        listTitle={selectedTerritory ? 'Top Municípios com Mais Ativos' : 'Top 5 Territórios com Mais Ativos'}
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
                        highlightLabel={territoryName}
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
                        subtitle={selectedTerritory ? `Proporção de ativos conectados à RNP em ${territoryName}` : 'Proporção de ativos conectados à Rede Nacional de Pesquisa'}
                        positiveLabel="Com RNP"
                        negativeLabel="Sem RNP"
                        positiveColor="bg-primary-600"
                        negativeColor="bg-border"
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