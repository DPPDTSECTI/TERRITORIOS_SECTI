import React, { useState, useContext, useMemo } from 'react';
import {
  Settings, GraduationCap, TrendingUp, Database, Building2, GripHorizontal, SunMedium
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

// IMPORTAÇÃO DOS DADOS E COMPONENTES
import { DataContext } from '../context/DataContext';
import { municipiosDB } from '../data/municipiosDB';
import { isMunicipioSemiarido, SEMIARIDO_MUNICIPIOS_NORMALIZADOS } from '../constants/semiarido';
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

  const [filtroSemiarido, setFiltroSemiarido] = useState(false);
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

  // Subconjuntos ativos quando o filtro de semiárido está ativado
  const activeScopedCursos = useMemo(() => {
    if (!scopedCursos || scopedCursos.length === 0) return [];
    if (!filtroSemiarido) return scopedCursos;
    return scopedCursos.filter(c => isMunicipioSemiarido(c.municipio));
  }, [scopedCursos, filtroSemiarido]);

  const activeScopedAtivos = useMemo(() => {
    if (!scopedAtivos || scopedAtivos.length === 0) return [];
    if (!filtroSemiarido) return scopedAtivos;
    return scopedAtivos.filter(a => isMunicipioSemiarido(a.municipio));
  }, [scopedAtivos, filtroSemiarido]);

  // 5. DonutChart (Cursos por Área)
  const donutChartData = useMemo(() => {
    if (!activeScopedCursos || activeScopedCursos.length === 0) return [];
    const counts = {};
    activeScopedCursos.forEach(c => {
      const cat = c.categoria || 'Outras Áreas';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const palette = ['#1D3557', '#2563EB', '#457B9D', '#A8DADC', '#F87171', '#F59E0B'];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], idx) => ({
        label, value, color: palette[idx % palette.length]
      }));
  }, [activeScopedCursos]);

  // Top Instituições de Ensino com Cursos
  const topEntidadesCursos = useMemo(() => {
    if (!activeScopedCursos || activeScopedCursos.length === 0) return [];

    const mapEntidades = {};
    activeScopedCursos.forEach(c => {
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
  }, [activeScopedCursos]);

  // 6. CustomPieChart (Distribuição dos Ativos de CT&I)
  const ecosystemData = useMemo(() => {
    if (!activeScopedAtivos || activeScopedAtivos.length === 0) return [];
    const counts = {};
    activeScopedAtivos.forEach(a => {
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
  }, [activeScopedAtivos]);

  // Top Territórios (ou Municípios se território selecionado) com mais ativos
  const topTerritoriosOuMunicipiosAtivos = useMemo(() => {
    if (!activeScopedAtivos || activeScopedAtivos.length === 0) return [];
    const counts = {};

    activeScopedAtivos.forEach(a => {
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
  }, [activeScopedAtivos, selectedTerritory]);

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

  // 8. Comparativo de Barras Empilhadas: Semiárido vs Demais Regiões
  const semiaridoStackedComparisonData = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];

    const stats = {
      'Univ. Federal': { semi: 0, nonSemi: 0 },
      'Univ. Estadual': { semi: 0, nonSemi: 0 },
      'Inst. Federal': { semi: 0, nonSemi: 0 },
      'ICTs e Centros': { semi: 0, nonSemi: 0 },
      'Cursos Presenciais': { semi: 0, nonSemi: 0 }
    };

    scopedAtivos.forEach(a => {
      const str = String(a.tipo || a.nome_tipo || '').toLowerCase();
      const isSemi = isMunicipioSemiarido(a.municipio);
      let cat = null;

      if (str.includes('federal') && str.includes('universidade')) cat = 'Univ. Federal';
      else if (str.includes('estadual')) cat = 'Univ. Estadual';
      else if (str.includes('instituto federal') || str.includes('ifba') || str.includes('if baiano')) cat = 'Inst. Federal';
      else if (str.includes('ict') || str.includes('pesquisa') || str.includes('centro')) cat = 'ICTs e Centros';

      if (cat) {
        if (isSemi) stats[cat].semi += 1;
        else stats[cat].nonSemi += 1;
      }
    });

    scopedCursos.forEach(c => {
      const isSemi = isMunicipioSemiarido(c.municipio);
      if (isSemi) stats['Cursos Presenciais'].semi += 1;
      else stats['Cursos Presenciais'].nonSemi += 1;
    });

    return Object.entries(stats)
      .map(([label, v]) => ({
        label,
        positive: v.semi,
        negative: v.nonSemi,
        total: v.semi + v.nonSemi
      }))
      .filter(row => row.total > 0);
  }, [scopedAtivos, scopedCursos, ativosData]);

  // Territórios filtrados por presença no Semiárido para o ranking
  const rankingDataSemiarido = useMemo(() => {
    if (!territoriosData) return [];
    return territoriosData.filter(t => Number(t.pct_semiarido || t.qtd_mun_semiarido || 0) > 0);
  }, [territoriosData]);

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
    if (selectedTerritory) {
      const raw = scopedTerritorioRow?.media_ifdm != null ? Number(scopedTerritorioRow.media_ifdm).toFixed(3) : kpisGlobais.ifdmMedio;
      if (raw === null || raw === undefined || raw === '') return '-';
      return String(raw).replace('.', ',');
    }
    if (filtroSemiarido) {
      const semiTerrs = (territoriosData || []).filter(t => Number(t.pct_semiarido || t.qtd_mun_semiarido || 0) > 0 && t.media_ifdm);
      if (semiTerrs.length === 0) return kpisGlobais.ifdmMedio ? String(kpisGlobais.ifdmMedio).replace('.', ',') : '-';
      const soma = semiTerrs.reduce((acc, t) => acc + Number(t.media_ifdm), 0);
      return (soma / semiTerrs.length).toFixed(3).replace('.', ',');
    }
    const raw = kpisGlobais.ifdmMedio;
    if (raw === null || raw === undefined || raw === '') return '-';
    return String(raw).replace('.', ',');
  }, [selectedTerritory, scopedTerritorioRow, kpisGlobais.ifdmMedio, loadingStats, filtroSemiarido, territoriosData]);

  // Cálculos de métricas do Semiárido com percentuais
  const semiaridoMetrics = useMemo(() => {
    const totalAtivos = scopedAtivos.length || 1;
    const semiAtivos = scopedAtivos.filter(a => isMunicipioSemiarido(a.municipio)).length;
    const pctAtivos = ((semiAtivos / totalAtivos) * 100).toFixed(0);

    const totalCursos = scopedCursos.length || 1;
    const semiCursos = scopedCursos.filter(c => isMunicipioSemiarido(c.municipio)).length;
    const pctCursos = ((semiCursos / totalCursos) * 100).toFixed(0);

    let semiCadeias = 0;
    let totalCadeias = 1;
    if (selectedTerritory) {
      semiCadeias = scopedTerritorioRow?.cadeias_produtivas ?? 0;
      totalCadeias = semiCadeias || 1;
    } else {
      totalCadeias = kpisGlobais.cadeias || 1;
      semiCadeias = (territoriosData || [])
        .filter(t => Number(t.pct_semiarido || t.qtd_mun_semiarido || 0) > 0)
        .reduce((acc, t) => acc + Number(t.cadeias_produtivas || 0), 0);
    }
    const pctCadeias = ((semiCadeias / totalCadeias) * 100).toFixed(0);

    let munSemi = 278;
    let munTot = 417;
    if (selectedTerritory && scopedTerritorioRow) {
      munSemi = Number(scopedTerritorioRow.qtd_mun_semiarido || 0);
      const ns = Number(scopedTerritorioRow.qtd_mun_nao_semiarido || 0);
      munTot = Number(scopedTerritorioRow.qtd_mun_total || (munSemi + ns)) || 1;
    }
    const pctMun = ((munSemi / munTot) * 100).toFixed(0);

    return {
      semiAtivos,
      pctAtivos,
      semiCursos,
      pctCursos,
      semiCadeias,
      pctCadeias,
      munSemi,
      munTot,
      pctMun
    };
  }, [scopedAtivos, scopedCursos, selectedTerritory, scopedTerritorioRow, kpisGlobais.cadeias, territoriosData]);

  // KPIs Dinâmicos contextuais à região e ao filtro de Semiárido
  const kpis = [
    {
      label: filtroSemiarido
        ? (selectedTerritory ? `Ativos no Semiárido · ${territoryName}` : 'Ativos no Semiárido')
        : (selectedTerritory ? `Ativos em ${territoryName}` : 'Ativos de CT&I'),
      value: loadingStats ? '...' : (filtroSemiarido ? semiaridoMetrics.semiAtivos : (selectedTerritory ? scopedAtivos.length : kpisGlobais.ativos)),
      percent: filtroSemiarido ? `${semiaridoMetrics.pctAtivos}%` : null,
      tooltip: filtroSemiarido
        ? `No Semiárido: ${semiaridoMetrics.semiAtivos} (${semiaridoMetrics.pctAtivos}%) | Fora: ${Math.max(0, scopedAtivos.length - semiaridoMetrics.semiAtivos)}`
        : undefined,
      icon: Settings,
      isIndex: false
    },
    {
      label: filtroSemiarido
        ? (selectedTerritory ? `Cursos no Semiárido · ${territoryName}` : 'Cursos no Semiárido')
        : (selectedTerritory ? `Cursos em ${territoryName}` : 'Cursos de CT&I'),
      value: loadingStats ? '...' : (filtroSemiarido ? semiaridoMetrics.semiCursos : (selectedTerritory ? scopedCursos.length : kpisGlobais.cursos)),
      percent: filtroSemiarido ? `${semiaridoMetrics.pctCursos}%` : null,
      tooltip: filtroSemiarido
        ? `No Semiárido: ${semiaridoMetrics.semiCursos} (${semiaridoMetrics.pctCursos}%) | Fora: ${Math.max(0, scopedCursos.length - semiaridoMetrics.semiCursos)}`
        : undefined,
      icon: GraduationCap,
      isIndex: false
    },
    {
      label: filtroSemiarido
        ? (selectedTerritory ? `IFDM · ${territoryName}` : 'IFDM Médio · Semiárido')
        : (selectedTerritory ? `IFDM · ${territoryName}` : 'D. Territorial (IFDM)'),
      value: formattedIfdm,
      percent: null,
      tooltip: filtroSemiarido ? 'Média dos territórios com área semiárida' : undefined,
      icon: TrendingUp,
      isIndex: true
    },
    {
      label: filtroSemiarido
        ? (selectedTerritory ? `Cadeias no Território` : 'Cadeias no Semiárido')
        : (selectedTerritory ? `Cadeias no Território` : 'Cadeias Produtivas'),
      value: loadingStats ? '...' : (filtroSemiarido ? semiaridoMetrics.semiCadeias : (selectedTerritory ? (scopedTerritorioRow?.cadeias_produtivas ?? 0) : kpisGlobais.cadeias)),
      percent: filtroSemiarido && !selectedTerritory ? `${semiaridoMetrics.pctCadeias}%` : null,
      tooltip: filtroSemiarido && !selectedTerritory
        ? `No Semiárido: ${semiaridoMetrics.semiCadeias} (${semiaridoMetrics.pctCadeias}%) | Fora: ${Math.max(0, (kpisGlobais.cadeias || 0) - semiaridoMetrics.semiCadeias)}`
        : undefined,
      icon: Database,
      isIndex: false
    },
    {
      label: filtroSemiarido
        ? (selectedTerritory ? 'Municípios no Semiárido' : 'Municípios no Semiárido')
        : (selectedTerritory ? 'Municípios no Território' : 'Municípios Semiárido'),
      value: loadingStats ? '...' : (filtroSemiarido ? `${semiaridoMetrics.munSemi}` : (selectedTerritory ? (scopedTerritorioRow ? `${scopedTerritorioRow.qtd_mun_total || (Number(scopedTerritorioRow.qtd_mun_semiarido || 0) + Number(scopedTerritorioRow.qtd_mun_nao_semiarido || 0))} mun.` : '-') : `${semiaridoStats.semiarido}`)),
      percent: filtroSemiarido ? `${semiaridoMetrics.pctMun}%` : null,
      tooltip: filtroSemiarido
        ? `No Semiárido: ${semiaridoMetrics.munSemi} (${semiaridoMetrics.pctMun}%) | Fora: ${semiaridoMetrics.munTot - semiaridoMetrics.munSemi}`
        : undefined,
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
            {filtroSemiarido && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30 shadow-2xs">
                <SunMedium size={13} className="text-amber-500" />
                Semiárido Ativo ({semiaridoMetrics.munSemi} mun.)
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1 font-medium">Dashboard Integrado de CTI</p>
          <div className="divider-territorial w-48 mt-3"></div>
        </div>
      </div>

      {/* GRID DE KPIs */}
      <div className="tour-kpis w-full relative z-10 shrink-0">
        <div className="grid grid-cols-5 gap-4 items-stretch w-full">
          {kpis.map((kpi, index) => {
            const isHero = index === 0;
            const accentColors = [
              'text-white/70',
              'text-[#0D9488]',
              'text-accent-600',
              'text-warning-600',
              'text-success-600'
            ];

            return (
              <div
                key={index}
                title={kpi.tooltip || kpi.label}
                className={`relative rounded-2xl p-4 flex flex-col justify-between h-[88px] cursor-default overflow-hidden transition-all duration-200 hover:shadow-card-elevated ${
                  isHero
                    ? 'bg-primary-900 text-white shadow-card-elevated'
                    : 'bg-surface border border-neutral-100 shadow-card'
                }`}
              >
                {/* LINHA SUPERIOR: ÍCONE + TÍTULO */}
                <div className="flex items-center gap-2 w-full min-w-0">
                  <kpi.icon size={16} strokeWidth={2} className={isHero ? accentColors[0] : accentColors[index]} />
                  <span
                    className={`text-[11px] font-medium uppercase tracking-wider truncate flex-1 ${
                      isHero ? 'text-white/60' : 'text-text-muted'
                    }`}
                    title={kpi.label}
                  >
                    {kpi.label}
                  </span>
                  {filtroSemiarido && (
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md shrink-0 leading-none inline-flex items-center justify-center ${
                      isHero ? 'bg-amber-400 text-primary-950 font-bold' : 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                    }`}>
                      Semiárido
                    </span>
                  )}
                  {!filtroSemiarido && kpi.isIndex && (
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md shrink-0 leading-none inline-flex items-center justify-center ${
                      isHero ? 'bg-white/15 text-white/80' : 'bg-primary-100 text-primary-700'
                    }`}>
                      Índice
                    </span>
                  )}
                </div>

                {/* LINHA INFERIOR: NÚMERO */}
                <div className="flex items-baseline w-full justify-between">
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className={`text-[28px] font-bold tracking-tight leading-none ${
                      isHero ? 'text-white' : 'text-text-primary'
                    }`}>
                      {kpi.value}
                    </span>
                    {filtroSemiarido && kpi.percent && (
                      <span className={`text-[12px] font-semibold ${
                        isHero ? 'text-amber-300' : 'text-amber-600'
                      }`}>
                        ({kpi.percent})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]">

        {/* LADO ESQUERDO: MAPA INTEGRADO */}
        <div style={{ width: 'calc(40% - 12px)' }} className="tour-map shrink-0 bg-surface rounded-2xl border border-neutral-100 shadow-card relative overflow-hidden flex flex-col min-h-[400px]">
          <div className="flex-1 w-full h-full relative">
            <PtiMap
              selectedTerritory={selectedTerritory}
              onSelectTerritory={setSelectedTerritory}
              territoriosData={territoriosData}
              territoriesDynamicStats={territoriesDynamicStats}
              semiaridoMunicipios={Array.from(SEMIARIDO_MUNICIPIOS_NORMALIZADOS)}
              filtroSemiarido={filtroSemiarido}
              onToggleSemiarido={setFiltroSemiarido}
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
                        title={filtroSemiarido ? (selectedTerritory ? `Cursos no Semiárido · ${territoryName}` : 'Cursos no Semiárido') : (selectedTerritory ? `Cursos em ${territoryName}` : 'Cursos por Área')}
                        subtitle={filtroSemiarido ? `${activeScopedCursos.length} no Semiárido · ${Math.max(0, scopedCursos.length - activeScopedCursos.length)} fora (${semiaridoMetrics.pctCursos}%)` : (selectedTerritory ? `${scopedCursos.length} cursos mapeados na região` : 'Distribuição oficial de cursos no estado')}
                        totalLabel="Total de Cursos"
                        listTitle={filtroSemiarido ? 'Top IES no Semiárido' : (selectedTerritory ? 'Top Instituições na Região' : 'Top 5 Instituições com mais cursos')}
                        data={donutChartData.length > 0 ? donutChartData : [{ label: 'Sem cursos mapeados', value: 1, color: '#E2E8F0' }]}
                        topList={topEntidadesCursos}
                        badge={filtroSemiarido ? "Semiárido" : null}
                      />
                    </SortableCard>
                  )}

                  {/* CARD 2: PIE CHART (ATIVOS CT&I) */}
                  {cardId === 'card-pie' && (
                    <SortableCard id="card-pie">
                      <CustomPieChart
                        data={ecosystemData}
                        topList={topTerritoriosOuMunicipiosAtivos}
                        title={filtroSemiarido ? (selectedTerritory ? `Ativos no Semiárido · ${territoryName}` : 'Ativos no Semiárido') : (selectedTerritory ? `Ativos em ${territoryName}` : 'Distribuição dos Ativos de CT&I')}
                        subtitle={filtroSemiarido ? `${activeScopedAtivos.length} no Semiárido · ${Math.max(0, scopedAtivos.length - activeScopedAtivos.length)} fora (${semiaridoMetrics.pctAtivos}%)` : (selectedTerritory ? `${scopedAtivos.length} ativos distribuídos por tipologia` : 'Visão geral das categorias e ranking')}
                        listTitle={filtroSemiarido ? 'Top Municípios do Semiárido' : (selectedTerritory ? 'Top Municípios com Mais Ativos' : 'Top 5 Territórios com Mais Ativos')}
                        defaultCenterLabel="Ativos Mapeados"
                        labelKey="region"
                        valueKey="value"
                        colorKey="colorHex"
                        badge={filtroSemiarido ? "Semiárido" : null}
                      />
                    </SortableCard>
                  )}

                  {/* CARD 3: RANKING IFDM */}
                  {cardId === 'card-ranking' && (
                    <SortableCard id="card-ranking">
                      <RankingBarChart
                        data={filtroSemiarido ? rankingDataSemiarido : territoriosData}
                        title={filtroSemiarido ? "Ranking IFDM · Semiárido" : "Ranking IFDM"}
                        valueKey="media_ifdm"
                        labelKey="territorio"
                        extraKey="cadeias_produtivas"
                        extraLabel="Cadeias"
                        topSubtitle={filtroSemiarido ? "Top no Semiárido" : "Top 5 melhores"}
                        mediumSubtitle="5 na média"
                        bottomSubtitle={filtroSemiarido ? "Menores no Semiárido" : "Top 5 piores"}
                        highlightLabel={territoryName}
                        maxScale={1}
                        badge={filtroSemiarido ? "Semiárido" : null}
                      />
                    </SortableCard>
                  )}

                  {/* CARD 4: PROPORTION RNP OU BARRAS EMPILHADAS SEMIÁRIDO */}
                  {cardId === 'card-mapeamento' && (
                    <SortableCard id="card-mapeamento">
                      <ProportionBarChart
                        data={filtroSemiarido ? semiaridoStackedComparisonData : rnpComparisonData}
                        title={filtroSemiarido ? "Distribuição no Semiárido" : "Infraestrutura RNP"}
                        subtitle={filtroSemiarido ? "No Semiárido vs. Fora do Semiárido" : (selectedTerritory ? `Proporção de ativos conectados à RNP em ${territoryName}` : 'Proporção de ativos conectados à Rede Nacional de Pesquisa')}
                        positiveLabel={filtroSemiarido ? "No Semiárido" : "Com RNP"}
                        negativeLabel={filtroSemiarido ? "Fora do Semiárido" : "Sem RNP"}
                        positiveColor={filtroSemiarido ? "bg-amber-500" : "bg-primary-600"}
                        negativeColor={filtroSemiarido ? "bg-blue-600" : "bg-neutral-200"}
                        positiveTextColor={filtroSemiarido ? "text-amber-600" : "text-primary-700"}
                        negativeTextColor={filtroSemiarido ? "text-blue-600" : "text-text-muted"}
                        badge={filtroSemiarido ? "Semiárido" : null}
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