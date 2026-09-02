import React, { useContext, useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Printer, 
  X, 
  BookOpen,
  Layers,
  BarChart3,
  Flame,
  Wifi
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart,
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Cell, 
  LabelList
} from 'recharts';

import { DataContext } from '../../context/DataContext';
import SideMap from '../maps/SideMap';
import ProportionBarChart from '../graph/ProportionBarChart';
import StackedBarChart from '../graph/StackedBarChart';
import { municipiosDB } from '../../data/municipiosDB';

const PALETTE = ['#1D3557', '#2563EB', '#457B9D', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const CATEGORIAS_ENSINO_VALIDAS = [
 'Campi Instituto Federal',
 'Campi Universidade Privada',
 'Campi Universidade Pública - Federal',
 'Campi Universidade Pública - Estadual'
];

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

const MUN_LOOKUP = (() => {
 const byName = {};
 municipiosDB.forEach((row) => {
 byName[normalizeName(row.nome_municipio)] = row;
 });
 return { byName };
})();

function getTipoPadronizado(tipoStr) {
 const s = String(tipoStr || '').toLowerCase();
 if (s.includes('federal') && (s.includes('instituto') || s.includes('ifba') || s.includes('if baiano'))) {
 return 'Instituto Federal';
 }
 if (s.includes('estadual')) {
 return 'Univ. Pública Estadual';
 }
 if (s.includes('federal')) {
 return 'Univ. Pública Federal';
 }
 return 'Univ. Privada';
}

function checkSemiaridoValue(val) {
  if (val === true || val === 1) return true;
  const s = String(val ?? '').toLowerCase().trim();
  return s === 'sim' || s === 'true' || s === '1' || s === 't';
}

const SEMIARIDO_CATEGORIES = [
  { key: 'Semiárido', label: 'Semiárido', shortLabel: 'Semiárido', colorHex: '#F59E0B' },
  { key: 'fora', label: 'Fora do Semiárido', shortLabel: 'Fora do Semiárido', colorHex: '#3B82F6' }
];

export default function RelatorioAtivosPage() {
 const { 
 ativosData = [], 
 cursosData = [], 
 loadingStats = false 
 } = useContext(DataContext);

 const [selectedTerritory, setSelectedTerritory] = useState(null);
 const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // 1. Isola ativos de ensino superior e normaliza o booleano semiarido direto da view de ativos
  const baseEnsinoAtivos = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];
    return ativosData
      .filter(a => {
        const tipo = a.tipo || a.nome_tipo || '';
        return CATEGORIAS_ENSINO_VALIDAS.some(cat => 
          normalizeName(cat) === normalizeName(tipo)
        );
      })
      .map(a => ({
        ...a,
        semiarido: checkSemiaridoValue(a.semiarido ?? a.semi_arido ?? a.is_semiarido)
      }));
  }, [ativosData]);

  // 2. Mapeamentos rápidos de ativos para herança de semiárido
  const ativoSemiaridoMaps = useMemo(() => {
    const byId = new Map();
    const byMun = new Map();

    baseEnsinoAtivos.forEach(a => {
      const isSemi = a.semiarido === true;
      if (a.id_ativo || a.id) {
        byId.set(Number(a.id_ativo || a.id), isSemi);
      }
      const munNorm = normalizeName(a.municipio || '');
      if (munNorm && !byMun.has(munNorm)) {
        byMun.set(munNorm, isSemi);
      }
    });

    return { byId, byMun };
  }, [baseEnsinoAtivos]);

  // 3. Filtro dos Ativos pelo Território
  const filteredAtivos = useMemo(() => {
    let list = baseEnsinoAtivos;

 if (selectedTerritory) {
 const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
 const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

 list = list.filter(a => {
 const munKey = normalizeName(a.municipio || '');
 const munRow = MUN_LOOKUP.byName[munKey];
 const idTerr = a.id_territorio != null && a.id_territorio !== '' 
 ? String(a.id_territorio) 
 : (munRow?.id_territorio ? String(munRow.id_territorio) : null);
 const rawTerr = a.territorio_identidade || a.territorio || munRow?.nome_territorio || '';
 const normTerr = normalizeName(rawTerr);

 if (tid && idTerr && idTerr === tid) return true;
 if (tNorm && normTerr && (normTerr === tNorm || normTerr.includes(tNorm) || tNorm.includes(normTerr))) return true;
 return false;
 });
 }

 return list;
 }, [baseEnsinoAtivos, selectedTerritory]);

  // 4. Filtro dos Cursos e injeção do booleano semiarido
  const filteredCursos = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    let list = cursosData;

 if (selectedTerritory) {
 const tid = selectedTerritory.id_territorio ? Number(selectedTerritory.id_territorio) : null;
 const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio);
 list = list.filter(c => 
 (tid && Number(c.id_territorio) === tid) || 
 (tNorm && normalizeName(c.territorio_identidade || c.territorio) === tNorm)
 );
 }

    return list.map(c => {
      let isSemi = false;
      if (c.id_ativo && ativoSemiaridoMaps.byId.has(Number(c.id_ativo))) {
        isSemi = ativoSemiaridoMaps.byId.get(Number(c.id_ativo));
      } else {
        const munNorm = normalizeName(c.municipio || '');
        isSemi = ativoSemiaridoMaps.byMun.get(munNorm) || false;
      }
      return {
        ...c,
        semiarido: isSemi
      };
    });
  }, [cursosData, selectedTerritory, ativoSemiaridoMaps]);

  // 5. Contagem de cursos no semiárido
  const semiaridoCursosCount = useMemo(() => {
    return filteredCursos.filter(c => c.semiarido === true).length;
  }, [filteredCursos]);

  // 6. Indicadores Executivos (KPIs) com Contagem de Campi com RNP
  const statsCursosKpis = useMemo(() => {
    const totalCursos = filteredCursos.length;
    const totalCampi = filteredAtivos.length;
    const campiSemiaridoCount = filteredAtivos.filter(a => a.semiarido === true).length;

    const munSet = new Set();
    const munSemiSet = new Set();
    const terrSet = new Set();

    filteredCursos.forEach(c => {
      if (c.municipio) {
        const mKey = normalizeName(c.municipio);
        munSet.add(mKey);
        if (c.semiarido === true) {
          munSemiSet.add(mKey);
        }
      }
      const terr = c.territorio_identidade || c.territorio;
      if (terr) terrSet.add(normalizeName(terr));
    });

    // Contagem de CAMPI (pontos físicos de presença) com RNP (bate 100% com o total do gráfico de RNP)
    let campiRnpCount = 0;
    let campiRnpSemiCount = 0;

    filteredAtivos.forEach(a => {
      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim';
      if (hasRnp) {
        campiRnpCount += 1;
        if (a.semiarido === true) {
          campiRnpSemiCount += 1;
        }
      }
    });

    const mediaCursosPorCampus = totalCampi > 0 ? (totalCursos / totalCampi).toFixed(1) : '0';

    return {
      totalCursos,
      totalCampi,
      campiSemiaridoCount,
      semiaridoCount: semiaridoCursosCount,
      municipiosComCursos: munSet.size,
      municipiosSemiComCursos: munSemiSet.size,
      territoriosComCursos: terrSet.size,
      mediaCursosPorCampus,
      campiRnpCount,
      campiRnpSemiCount
    };
  }, [filteredCursos, filteredAtivos, semiaridoCursosCount]);

  // 7. Dados para o ProportionBarChart: Áreas de Conhecimento (Semiárido vs Fora)
  const areasProportionData = useMemo(() => {
    if (!filteredCursos || filteredCursos.length === 0) return [];
    const counts = {};

    filteredCursos.forEach(c => {
      const area = c.categoria || c.tipo || 'Outras Áreas';
      if (!counts[area]) {
        counts[area] = { label: area, positive: 0, negative: 0, total: 0 };
      }
      if (c.semiarido) counts[area].positive += 1;
      else counts[area].negative += 1;
      counts[area].total += 1;
    });

    return Object.values(counts).sort((a, b) => b.total - a.total);
  }, [filteredCursos]);

  // 8. Dados para o StackedBarChart: Territórios Empilhados (ou Ranking de Municípios)
  const territoriosStackedData = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];

    const terrStats = {};
    cursosData.forEach(c => {
      const rawTerr = c.territorio_identidade || c.territorio || 'Não identificado';
      const cleanTerr = rawTerr.replace(/^Território de Identidade\s+/i, '').trim();

      if (!terrStats[cleanTerr]) {
        terrStats[cleanTerr] = { label: cleanTerr, total: 0, segments: { Semiárido: 0, fora: 0 } };
      }

      let isSemi = false;
      if (c.id_ativo && ativoSemiaridoMaps.byId.has(Number(c.id_ativo))) {
        isSemi = ativoSemiaridoMaps.byId.get(Number(c.id_ativo));
      } else {
        const munNorm = normalizeName(c.municipio || '');
        isSemi = ativoSemiaridoMaps.byMun.get(munNorm) || false;
      }

      if (isSemi) terrStats[cleanTerr].segments.Semiárido += 1;
      else terrStats[cleanTerr].segments.fora += 1;
      terrStats[cleanTerr].total += 1;
    });

    return Object.values(terrStats).sort((a, b) => b.total - a.total);
  }, [cursosData, ativoSemiaridoMaps]);

  const topMunicipiosData = useMemo(() => {
    if (!filteredCursos || filteredCursos.length === 0) return [];
    const counts = {};
    filteredCursos.forEach(c => {
      const mun = c.municipio || 'Não informado';
      counts[mun] = (counts[mun] || 0) + 1;
    });

 return Object.entries(counts)
 .sort((a, b) => b[1] - a[1])
 .slice(0, 5)
 .map(([name, count]) => ({ name, count }));
 }, [filteredCursos]);

  // 9. Gráfico 3: Matriz de Distribuição por Área e Natureza Jurídica
  const matrixAreaNaturezaData = useMemo(() => {
    if (!filteredCursos || filteredCursos.length === 0) return [];

 const ativoTipoMap = new Map();
 baseEnsinoAtivos.forEach(a => {
 if (a.id_ativo || a.id) {
 ativoTipoMap.set(Number(a.id_ativo || a.id), getTipoPadronizado(a.tipo || a.nome_tipo));
 }
 });

    const countsByArea = {};
    filteredCursos.forEach(c => {
      const area = c.categoria || c.tipo || 'Geral';
      if (!countsByArea[area]) {
        countsByArea[area] = { categoria: area, federal: 0, estadual: 0, ifba: 0, privada: 0, total: 0 };
      }

 let tipoFinal = 'Univ. Privada';
 if (c.id_ativo && ativoTipoMap.has(Number(c.id_ativo))) {
 tipoFinal = ativoTipoMap.get(Number(c.id_ativo));
 } else if (c.sigla || c.entidade || c.instituicao) {
 tipoFinal = getTipoPadronizado(c.sigla || c.entidade || c.instituicao);
 }

      if (tipoFinal === 'Univ. Pública Federal') countsByArea[area].federal += 1;
      else if (tipoFinal === 'Univ. Pública Estadual') countsByArea[area].estadual += 1;
      else if (tipoFinal === 'Instituto Federal') countsByArea[area].ifba += 1;
      else countsByArea[area].privada += 1;

      countsByArea[area].total += 1;
    });

 return Object.values(countsByArea).sort((a, b) => b.total - a.total);
 }, [filteredCursos, baseEnsinoAtivos]);

  // 10. Cobertura RNP empilhada por Semiárido vs Fora do Semiárido
  const rnpStackedData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const stats = {};

    filteredAtivos.forEach(a => {
      const tipo = (a.tipo || a.nome_tipo || 'Outros').replace(/^Campi\s+/i, '');
      if (!stats[tipo]) {
        stats[tipo] = { 
          name: tipo, 
          Semiárido: 0, 
          fora: 0, 
          comRnpTotal: 0, 
          total: 0 
        };
      }

      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim';

      if (hasRnp) {
        if (a.semiarido === true) {
          stats[tipo].Semiárido += 1;
        } else {
          stats[tipo].fora += 1;
        }
        stats[tipo].comRnpTotal += 1;
      }
      stats[tipo].total += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .map(item => ({
        ...item,
        pctTotal: item.total > 0 ? ((item.comRnpTotal / item.total) * 100).toFixed(1) : '0.0',
        pctSemi: item.total > 0 ? ((item.Semiárido / item.total) * 100).toFixed(1) : 0,
        pctFora: item.total > 0 ? ((item.fora / item.total) * 100).toFixed(1) : 0
      }));
  }, [filteredAtivos]);

  return (
    <main className="flex-1 h-screen overflow-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-white print:overflow-visible">
      
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between w-full pr-[340px] shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-black text-[#1D3557] tracking-tight">
              Relatório Executivo de Cursos e Ensino Superior de CT&I
            </h1>
            <span className="bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#2563EB]/20 flex items-center gap-1">
              <Flame size={13} className="text-[#2563EB]" />
              Heatmap & Infraestrutura
            </span>

            {selectedTerritory && (
              <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 border border-[#BAE6FD] px-2.5 py-0.5 rounded-full">
                <MapPin size={11} className="text-[#0284C7]" />
                <span className="text-[10.5px] font-bold text-[#0369A1]">
                  Recorte: <strong className="text-[#0C4A6E]">{territoryName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTerritory(null)}
                  className="text-[#0369A1] hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-[#457B9D] font-medium">
              Diagnóstico territorial da densidade de cursos e distribuição dos campi universitários na Bahia
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 bg-[#1D3557] hover:bg-[#2563EB] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer print:hidden"
            >
              <Printer size={11} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* GRID DE KPIS (5 CARDS UNIFICADOS EM h-[92px]) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-stretch w-full">
          
          {/* KPI 1: CURSOS MAPEADOS */}
          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <BookOpen size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Cursos Mapeados</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1D3557] leading-none">
                {loadingStats ? '...' : statsCursosKpis.totalCursos}
              </span>
              <span className="text-[9.5px] font-bold text-[#B45309] bg-[#F59E0B]/15 px-2 py-0.5 rounded-md whitespace-nowrap">
                {statsCursosKpis.semiaridoCount} no semiárido
              </span>
            </div>
          </div>

          {/* KPI 2: CAMPI OFERTANTES */}
          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <Building2 size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Campi Ofertantes</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1D3557] leading-none">
                {loadingStats ? '...' : statsCursosKpis.totalCampi}
              </span>
              <span className="text-[9.5px] font-bold text-[#B45309] bg-[#F59E0B]/15 px-2 py-0.5 rounded-md whitespace-nowrap">
                {statsCursosKpis.campiSemiaridoCount} no semiárido
              </span>
            </div>
          </div>

          {/* KPI 3: MUNICÍPIOS COM CURSOS */}
          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <MapPin size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Municípios com Cursos</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1D3557] leading-none">
                {loadingStats ? '...' : `${statsCursosKpis.municipiosComCursos} munic.`}
              </span>
              <span className="text-[9.5px] font-bold text-[#B45309] bg-[#F59E0B]/15 px-2 py-0.5 rounded-md whitespace-nowrap">
                {statsCursosKpis.municipiosSemiComCursos} no semiárido
              </span>
            </div>
          </div>

          {/* KPI 4: CAMPI COM REDE RNP */}
          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <Wifi size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Campi com Rede RNP</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1D3557] leading-none">
                {loadingStats ? '...' : statsCursosKpis.campiRnpCount}
              </span>
              <span className="text-[9.5px] font-bold text-[#B45309] bg-[#F59E0B]/15 px-2 py-0.5 rounded-md whitespace-nowrap">
                {statsCursosKpis.campiRnpSemiCount} no semiárido
              </span>
            </div>
          </div>

          {/* KPI 5: TERRITÓRIOS COM OFERTA */}
          <div className="h-[92px] bg-white rounded-[20px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB]">
                <Layers size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Territórios com Oferta</span>
            </div>
            <span className="text-2xl font-black text-[#1D3557] leading-none">
              {loadingStats ? '...' : (selectedTerritory ? '1 Território' : `${statsCursosKpis.territoriosComCursos} de 27`)}
            </span>
          </div>

        </div>
      </div>

      {/* GRID PRINCIPAL DE GRÁFICOS + SIDEMAP */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-0 w-full">
        
        {/* COLUNA ESQUERDA: GRID 2x2 COM COMPONENTES MODULARES */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full min-h-0">
          
          {/* GRÁFICO 1: ÁREAS DE CONHECIMENTO */}
          <div className="h-full min-h-0">
            <ProportionBarChart
              data={areasProportionData}
              title="Áreas de Conhecimento"
              subtitle="Distribuição e presença no Semiárido"
              positiveLabel="Semiárido"
              negativeLabel="Fora do Semiárido"
              positiveColor="bg-[#F59E0B]"
              negativeColor="bg-[#3B82F6]"
            />
          </div>

          {/* GRÁFICO 2: CONCENTRAÇÃO POR TERRITÓRIO OU POLOS DE OFERTA */}
          <div className="h-full min-h-0">
            {selectedTerritory ? (
              <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgba(29,53,87,0.04)] flex flex-col justify-between h-full min-h-0">
                <div className="flex items-center justify-between mb-1 shrink-0">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">Polos de Oferta</h3>
                    <p className="text-[10px] text-[#457B9D]">Cidades com mais cursos em {territoryName}</p>
                  </div>
                  <BarChart3 size={16} className="text-[#2563EB]" />
                </div>
                <div className="flex-1 w-full min-h-0 pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMunicipiosData} layout="vertical" margin={{ left: 5, right: 28, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#1D3557', fontWeight: 700 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1D3557', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} />
                      <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]}>
                        {topMunicipiosData.map((_, index) => (
                          <Cell key={`cell-bar-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                        <LabelList dataKey="count" position="insideRight" fill="#ffffff" fontSize={10.5} fontWeight={800} offset={8} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <StackedBarChart
                data={territoriosStackedData}
                categories={SEMIARIDO_CATEGORIES}
                title="Concentração por Território"
                subtitle="Presença e distribuição no Semiárido"
                allowToggleView={true}
              />
            )}
          </div>

          {/* GRÁFICO 3: COMPOSIÇÃO POR ÁREA E REDE */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1">
              <div>
                <h3 className="text-[12.5px] font-extrabold text-[#1D3557]">Composição por Área e Rede</h3>
                <p className="text-[9.5px] text-[#457B9D]">Proporção Federal, Estadual, IF e Privada</p>
              </div>

              <div className="flex items-center gap-2 text-[8.5px] font-black">
                <span className="flex items-center gap-1 text-[#1D3557]"><span className="w-2 h-2 rounded-full bg-[#1D3557]"></span>Fed.</span>
                <span className="flex items-center gap-1 text-[#2563EB]"><span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>Est.</span>
                <span className="flex items-center gap-1 text-[#10B981]"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span>IF</span>
                <span className="flex items-center gap-1 text-[#F59E0B]"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>Priv.</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-around gap-1 overflow-y-auto pr-1 min-h-0">
              {matrixAreaNaturezaData.map((row, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-extrabold text-[#1D3557] truncate max-w-[65%]" title={row.categoria}>
                      {row.categoria}
                    </span>
                    <span className="font-bold text-[#457B9D] text-[10px]">
                      {row.total} cursos
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden flex shadow-2xs">
                    {row.federal > 0 && (
                      <div className="h-full bg-[#1D3557]" style={{ width: `${(row.federal / row.total) * 100}%` }} title={`Federal: ${row.federal}`} />
                    )}
                    {row.estadual > 0 && (
                      <div className="h-full bg-[#2563EB]" style={{ width: `${(row.estadual / row.total) * 100}%` }} title={`Estadual: ${row.estadual}`} />
                    )}
                    {row.ifba > 0 && (
                      <div className="h-full bg-[#10B981]" style={{ width: `${(row.ifba / row.total) * 100}%` }} title={`IF: ${row.ifba}`} />
                    )}
                    {row.privada > 0 && (
                      <div className="h-full bg-[#F59E0B]" style={{ width: `${(row.privada / row.total) * 100}%` }} title={`Privada: ${row.privada}`} />
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[8px] font-extrabold text-[#64748B]">
                    {row.federal > 0 && <span className="text-[#1D3557]">Fed: {row.federal}</span>}
                    {row.estadual > 0 && <span className="text-[#2563EB]">Est: {row.estadual}</span>}
                    {row.ifba > 0 && <span className="text-[#10B981]">IF: {row.ifba}</span>}
                    {row.privada > 0 && <span className="text-[#D97706]">Priv: {row.privada}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRÁFICO 4: COBERTURA DE REDE RNP EMPILHADA COM SEMIÁRIDO */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1">
              <div>
                <h3 className="text-[12.5px] font-extrabold text-[#1D3557]">Cobertura de Rede RNP</h3>
                <p className="text-[9.5px] text-[#457B9D]">Campi conectados ao backbone de pesquisa</p>
              </div>

              {/* LEGENDA DO EMPILHAMENTO */}
              <div className="flex items-center gap-2 text-[8.5px] font-black">
                <span className="flex items-center gap-1 text-[#B45309]">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>Semiárido
                </span>
                <span className="flex items-center gap-1 text-[#2563EB]">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>Fora do Semiárido
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-around gap-1.5 my-auto min-h-0 overflow-y-auto pr-1">
              {rnpStackedData.map((cat, idx) => (
                <div key={idx} className="flex flex-col gap-0.5 p-1.5 px-2 rounded-xl bg-[#F8FAFC]">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-extrabold text-[#1D3557] truncate max-w-[55%]" title={cat.name}>
                      {cat.name}
                    </span>
                    <span className="font-bold text-[#457B9D] text-[10px]">
                      <strong className="text-[#1D3557] font-black">{cat.comRnpTotal}</strong> de {cat.total} ({cat.pctTotal}%)
                    </span>
                  </div>

                  {/* BARRA EMPILHADA */}
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden flex shadow-2xs">
                    {cat.Semiárido > 0 && (
                      <div 
                        className="h-full bg-[#F59E0B] transition-all duration-500"
                        style={{ width: `${cat.pctSemi}%` }}
                        title={`Semiárido com RNP: ${cat.Semiárido}`}
                      />
                    )}
                    {cat.fora > 0 && (
                      <div 
                        className="h-full bg-[#3B82F6] transition-all duration-500"
                        style={{ width: `${cat.pctFora}%` }}
                        title={`Fora do Semiárido com RNP: ${cat.fora}`}
                      />
                    )}
                  </div>

                  {/* SUBLEGENDA DE CONTAGEM */}
                  <div className="flex items-center justify-between text-[8.5px] font-bold">
                    <span className="text-[#B45309]">
                      Semiárido: <strong>{cat.Semiárido}</strong> ({cat.pctSemi}%)
                    </span>
                    <span className="text-[#2563EB]">
                      Fora: <strong>{cat.fora}</strong> ({cat.pctFora}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

 </div>

        {/* COLUNA DIREITA: SIDEMAP INTEGRADO NO MODO HEATMAP DE CURSOS */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 h-full bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-0">
          <SideMap
            mode="cursos"
            cursosData={cursosData}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
          />
        </div>

 </div>

 </main>
 );
}