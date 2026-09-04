import React, { useContext, useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  X,
  BookOpen,
  Layers,
  BarChart3,
  Wifi,
  Printer,
  ArrowLeft
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
import { isMunicipioSemiarido, SEMIARIDO_TOTAL_MUNICIPIOS, BAHIA_TOTAL_MUNICIPIOS } from '../../constants/semiarido';

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

function formatAreaConhecimento(area) {
  const str = String(area || '').toLowerCase();
  if (str.includes('computa') || str.includes('tic') || str.includes('informacao')) return 'Computação e TICs';
  if (str.includes('engenharia') || str.includes('producao') || str.includes('construcao')) return 'Engenharia e Produção';
  if (str.includes('saude') || str.includes('bem-estar')) return 'Saúde e Bem-Estar';
  if (str.includes('agri') || str.includes('veterin') || str.includes('silv') || str.includes('pesca')) return 'Agricultura e Veterinária';
  if (str.includes('naturais') || str.includes('matematica') || str.includes('estatistica')) return 'Ciências Naturais e Matemática';
  return area;
}

function checkSemiaridoValue(val) {
  if (val === true || val === 1) return true;
  const s = String(val ?? '').toLowerCase().trim();
  return s === 'sim' || s === 'true' || s === '1' || s === 't';
}

const ENSINO_CATEGORIES = [
  { key: 'federal', label: 'Univ. Pública Federal', shortLabel: 'Federal', colorHex: '#1D3557' },
  { key: 'estadual', label: 'Univ. Pública Estadual', shortLabel: 'Estadual', colorHex: '#2563EB' },
  { key: 'ifba', label: 'Instituto Federal', shortLabel: 'IF', colorHex: '#10B981' },
  { key: 'privada', label: 'Univ. Privada', shortLabel: 'Privada', colorHex: '#F59E0B' }
];

export default function RelatorioEnsinoPage() {
  const {
    ativosData = [],
    cursosData = [],
    territoriosData = [],
    loadingStats = false
  } = useContext(DataContext);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reportMode = searchParams.get('modo') || 'normal';
  const isSemiarido = reportMode === 'semiarido';

  const [selectedTerritory, setSelectedTerritory] = useState(null);

  // Inicializa o território a partir dos parâmetros de busca na URL
  useEffect(() => {
    const terrParam = searchParams.get('territorio');
    if (terrParam && terrParam !== 'bahia' && territoriosData.length > 0) {
      const match = territoriosData.find(t => String(t.id_territorio) === String(terrParam));
      if (match) {
        setSelectedTerritory(match);
      }
    } else if (terrParam === 'bahia') {
      setSelectedTerritory(null);
    }
  }, [searchParams, territoriosData]);

  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // Fallback de auto-impressão caso explicitamente solicitado
  useEffect(() => {
    const autoPrint = searchParams.get('autoPrint');
    if ((autoPrint === '1' || autoPrint === 'true') && !loadingStats) {
      const timer = setTimeout(() => {
        window.print();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [searchParams, loadingStats]);

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
      .map(a => {
        const rawSemi = a.semiarido ?? a.semi_arido ?? a.is_semiarido;
        const isSemi = checkSemiaridoValue(rawSemi) || isMunicipioSemiarido(a.municipio);
        return {
          ...a,
          semiarido: isSemi
        };
      });
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

  // 3. Filtro dos Ativos pelo Território e Modo
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

    if (isSemiarido) {
      list = list.filter(a => a.semiarido === true || isMunicipioSemiarido(a.municipio));
    }

    return list;
  }, [baseEnsinoAtivos, selectedTerritory, isSemiarido]);

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

    const mapped = list.map(c => {
      let isSemi = false;
      if (c.id_ativo && ativoSemiaridoMaps.byId.has(Number(c.id_ativo))) {
        isSemi = ativoSemiaridoMaps.byId.get(Number(c.id_ativo));
      } else {
        const munNorm = normalizeName(c.municipio || '');
        isSemi = ativoSemiaridoMaps.byMun.get(munNorm) || false;
      }
      isSemi = isSemi || isMunicipioSemiarido(c.municipio);
      return {
        ...c,
        semiarido: isSemi
      };
    });

    if (isSemiarido) {
      return mapped.filter(c => c.semiarido === true);
    }

    return mapped;
  }, [cursosData, selectedTerritory, ativoSemiaridoMaps, isSemiarido]);

  const totalCursosBahia = useMemo(() => cursosData.length, [cursosData]);
  const totalCampiBahia = useMemo(() => baseEnsinoAtivos.length, [baseEnsinoAtivos]);

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

    // Contagem de CAMPI com RNP
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
    const pctCursosBahia = totalCursosBahia > 0 ? ((totalCursos / totalCursosBahia) * 100).toFixed(1) : '0.0';
    const pctCampiBahia = totalCampiBahia > 0 ? ((totalCampi / totalCampiBahia) * 100).toFixed(1) : '0.0';
    const totalMunUniverso = isSemiarido ? SEMIARIDO_TOTAL_MUNICIPIOS : (selectedTerritory ? munSet.size : BAHIA_TOTAL_MUNICIPIOS);
    const taxaMun = totalMunUniverso > 0 ? ((munSet.size / totalMunUniverso) * 100).toFixed(1) : '0.0';
    const rnpTaxa = totalCampi > 0 ? ((campiRnpCount / totalCampi) * 100).toFixed(1) : '0.0';

    const totalTerrUniverso = isSemiarido ? 22 : (selectedTerritory ? 1 : (territoriosData.length || 27));
    const taxaTerr = totalTerrUniverso > 0 ? ((terrSet.size / totalTerrUniverso) * 100).toFixed(1) : '0.0';

    return {
      totalCursos,
      pctCursosBahia,
      totalCampi,
      pctCampiBahia,
      campiSemiaridoCount,
      semiaridoCount: semiaridoCursosCount,
      municipiosComCursos: munSet.size,
      totalMunUniverso,
      taxaMun,
      totalTerrUniverso,
      taxaTerr,
      municipiosSemiComCursos: munSemiSet.size,
      territoriosComCursos: terrSet.size,
      mediaCursosPorCampus,
      campiRnpCount,
      rnpTaxa,
      campiRnpSemiCount
    };
  }, [filteredCursos, filteredAtivos, semiaridoCursosCount, isSemiarido, selectedTerritory, totalCursosBahia, totalCampiBahia, territoriosData]);

  // 7. Dados para o ProportionBarChart: Áreas de Conhecimento (Pública vs Privada)
  const areasProportionData = useMemo(() => {
    if (!filteredCursos || filteredCursos.length === 0) return [];

    const ativoTipoMap = new Map();
    baseEnsinoAtivos.forEach(a => {
      if (a.id_ativo || a.id) {
        ativoTipoMap.set(Number(a.id_ativo || a.id), getTipoPadronizado(a.tipo || a.nome_tipo));
      }
    });

    const counts = {};

    filteredCursos.forEach(c => {
      const rawArea = c.categoria || c.tipo || 'Outras Áreas';
      const area = formatAreaConhecimento(rawArea);
      if (!counts[area]) {
        counts[area] = { label: area, positive: 0, negative: 0, total: 0 };
      }

      let tipoFinal = 'Univ. Privada';
      if (c.id_ativo && ativoTipoMap.has(Number(c.id_ativo))) {
        tipoFinal = ativoTipoMap.get(Number(c.id_ativo));
      } else if (c.sigla || c.entidade || c.instituicao) {
        tipoFinal = getTipoPadronizado(c.sigla || c.entidade || c.instituicao);
      }

      const isPublica = tipoFinal !== 'Univ. Privada';
      if (isPublica) {
        counts[area].positive += 1;
      } else {
        counts[area].negative += 1;
      }
      counts[area].total += 1;
    });

    return Object.values(counts).sort((a, b) => b.total - a.total);
  }, [filteredCursos, baseEnsinoAtivos]);

  // 8. Dados para o StackedBarChart: Territórios Empilhados por Natureza de Ensino
  const territoriosStackedData = useMemo(() => {
    if (!filteredCursos || filteredCursos.length === 0) return [];

    const ativoTipoMap = new Map();
    baseEnsinoAtivos.forEach(a => {
      if (a.id_ativo || a.id) {
        ativoTipoMap.set(Number(a.id_ativo || a.id), getTipoPadronizado(a.tipo || a.nome_tipo));
      }
    });

    const terrStats = {};
    filteredCursos.forEach(c => {
      const rawTerr = c.territorio_identidade || c.territorio || 'Não identificado';
      const cleanTerr = rawTerr.replace(/^Território de Identidade\s+/i, '').trim();

      if (!terrStats[cleanTerr]) {
        terrStats[cleanTerr] = { label: cleanTerr, total: 0, segments: { federal: 0, estadual: 0, ifba: 0, privada: 0 } };
      }

      let tipoFinal = 'Univ. Privada';
      if (c.id_ativo && ativoTipoMap.has(Number(c.id_ativo))) {
        tipoFinal = ativoTipoMap.get(Number(c.id_ativo));
      } else if (c.sigla || c.entidade || c.instituicao) {
        tipoFinal = getTipoPadronizado(c.sigla || c.entidade || c.instituicao);
      }

      if (tipoFinal === 'Univ. Pública Federal') terrStats[cleanTerr].segments.federal += 1;
      else if (tipoFinal === 'Univ. Pública Estadual') terrStats[cleanTerr].segments.estadual += 1;
      else if (tipoFinal === 'Instituto Federal') terrStats[cleanTerr].segments.ifba += 1;
      else terrStats[cleanTerr].segments.privada += 1;

      terrStats[cleanTerr].total += 1;
    });

    return Object.values(terrStats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredCursos, baseEnsinoAtivos]);

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
      const rawArea = c.categoria || c.tipo || 'Geral';
      const area = formatAreaConhecimento(rawArea);
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

  // 10. Cobertura RNP dos Campi por Categoria
  const rnpStackedData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const stats = {};

    filteredAtivos.forEach(a => {
      const rawTipo = (a.tipo || a.nome_tipo || 'Outros').replace(/^Campi\s+/i, '');
      const tipo = getTipoPadronizado(rawTipo);
      if (!stats[tipo]) {
        stats[tipo] = {
          name: tipo,
          comRnpTotal: 0,
          total: 0
        };
      }

      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim';
      if (hasRnp) {
        stats[tipo].comRnpTotal += 1;
      }
      stats[tipo].total += 1;
    });

    return Object.values(stats)
      .map(item => ({
        ...item,
        pctTotal: item.total > 0 ? ((item.comRnpTotal / item.total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => Number(b.pctTotal) - Number(a.pctTotal) || b.comRnpTotal - a.comRnpTotal);
  }, [filteredAtivos]);

  return (
    <main id="pdf-report" className="flex-1 h-screen overflow-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-white print:overflow-visible select-none">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between w-full shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[30px] lg:text-[32px] font-black text-[#1D3557] tracking-tight leading-none">
              Relatório Executivo de Cursos e Ensino Superior de CT&I
            </h1>

            {isSemiarido ? (
              <div className="flex items-center gap-1.5 bg-[#FEF3C7] border border-[#FDE68A] px-3.5 py-1 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                <span className="text-[12px] font-bold text-[#92400E]">
                  Recorte Oficial: <strong>Semiárido Baiano (278 Municípios)</strong>
                </span>
              </div>
            ) : selectedTerritory ? (
              <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 border border-[#BAE6FD] px-3 py-1 rounded-full">
                <MapPin size={13} className="text-[#0284C7]" />
                <span className="text-[12px] font-bold text-[#0369A1]">
                  Recorte: <strong className="text-[#0C4A6E]">{territoryName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTerritory(null)}
                  className="text-[#0369A1] hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                  title="Limpar seleção territorial"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 border border-[#BAE6FD] px-3.5 py-1 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span className="text-[12px] font-bold text-[#0369A1]">
                  Cenário Geral: <strong className="text-[#0C4A6E]">Estado da Bahia (417 Municípios)</strong>
                </span>
              </div>
            )}
          </div>
          <p className="text-[13.5px] text-[#457B9D] font-medium mt-1">
            {isSemiarido
              ? 'Diagnóstico territorial da densidade de cursos e distribuição dos campi universitários nos 278 municípios do Semiárido'
              : 'Diagnóstico territorial da densidade de cursos e distribuição dos campi universitários na Bahia'}
          </p>
        </div>
      </div>

      {/* GRID DE KPIS (5 CARDS UNIFICADOS EM h-[96px]) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-stretch w-full">

          {/* KPI 1: CURSOS MAPEADOS */}
          <div className="h-[96px] bg-white rounded-[24px] p-3 px-3.5 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB] shrink-0">
                <BookOpen size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[11.5px] font-bold text-[#64748B] uppercase tracking-wider">Cursos Mapeados</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[34px] lg:text-[38px] font-black text-[#1D3557] leading-none tracking-tight">
                {loadingStats ? '...' : statsCursosKpis.totalCursos}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${isSemiarido
                  ? 'text-[#B45309] bg-[#F59E0B]/12 border border-[#F59E0B]/25'
                  : 'text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20'
                  }`}
                title={`${statsCursosKpis.totalCursos} de ${totalCursosBahia} cursos estaduais`}
              >
                {isSemiarido ? `${statsCursosKpis.pctCursosBahia}% da Bahia` : 'Graduação & Pós'}
              </span>
            </div>
          </div>

          {/* KPI 2: CAMPI OFERTANTES */}
          <div className="h-[96px] bg-white rounded-[24px] p-3 px-3.5 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB] shrink-0">
                <Building2 size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[11.5px] font-bold text-[#64748B] uppercase tracking-wider">Campi Ofertantes</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[34px] lg:text-[38px] font-black text-[#1D3557] leading-none tracking-tight">
                {loadingStats ? '...' : statsCursosKpis.totalCampi}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${isSemiarido
                  ? 'text-[#B45309] bg-[#F59E0B]/12 border border-[#F59E0B]/25'
                  : 'text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20'
                  }`}
                title={`${statsCursosKpis.totalCampi} de ${totalCampiBahia} campi estaduais`}
              >
                {isSemiarido ? `${statsCursosKpis.pctCampiBahia}% da Bahia` : 'Polos & Universidades'}
              </span>
            </div>
          </div>

          {/* KPI 3: MUNICÍPIOS COM CURSOS */}
          <div className="h-[96px] bg-white rounded-[24px] p-3 px-3.5 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB] shrink-0">
                <MapPin size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[11.5px] font-bold text-[#64748B] uppercase tracking-wider">Municípios com Cursos</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[34px] lg:text-[38px] font-black text-[#1D3557] leading-none tracking-tight">
                  {loadingStats ? '...' : statsCursosKpis.municipiosComCursos}
                </span>
                <span className="text-[13px] font-bold text-[#64748B]">/ {statsCursosKpis.totalMunUniverso}</span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${isSemiarido
                  ? 'text-[#B45309] bg-[#F59E0B]/12 border border-[#F59E0B]/25'
                  : 'text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20'
                  }`}
              >
                {isSemiarido ? `${statsCursosKpis.taxaMun}% de cobertura` : `${statsCursosKpis.taxaMun}% de cobertura estadual`}
              </span>
            </div>
          </div>

          {/* KPI 4: CAMPI COM REDE RNP */}
          <div className="h-[96px] bg-white rounded-[24px] p-3 px-3.5 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB] shrink-0">
                <Wifi size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[11.5px] font-bold text-[#64748B] uppercase tracking-wider">Campi com Rede RNP</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[34px] lg:text-[38px] font-black text-[#1D3557] leading-none tracking-tight">
                {loadingStats ? '...' : statsCursosKpis.campiRnpCount}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${isSemiarido
                  ? 'text-[#B45309] bg-[#F59E0B]/12 border border-[#F59E0B]/25'
                  : 'text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20'
                  }`}
              >
                {isSemiarido ? `${statsCursosKpis.rnpTaxa}% com RNP` : `${statsCursosKpis.rnpTaxa}% dos campi com RNP`}
              </span>
            </div>
          </div>

          {/* KPI 5: TERRITÓRIOS COM OFERTA */}
          <div className="h-[96px] bg-white rounded-[24px] p-3 px-3.5 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB] shrink-0">
                <Layers size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[11.5px] font-bold text-[#64748B] uppercase tracking-wider">Territórios com Oferta</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[34px] lg:text-[38px] font-black text-[#1D3557] leading-none tracking-tight">
                  {loadingStats ? '...' : (selectedTerritory ? '1' : statsCursosKpis.territoriosComCursos)}
                </span>
                <span className="text-[13px] font-bold text-[#64748B]">/ {statsCursosKpis.totalTerrUniverso}</span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${isSemiarido
                  ? 'text-[#B45309] bg-[#F59E0B]/12 border border-[#F59E0B]/25'
                  : 'text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20'
                  }`}
              >
                {selectedTerritory ? 'Território Selecionado' : `${statsCursosKpis.taxaTerr}% dos territórios`}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* GRID PRINCIPAL: 4 GRÁFICOS (70%) EM 2x2 SIMÉTRICO + SIDEMAP (30%) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-0 w-full overflow-hidden">

        {/* COLUNA ESQUERDA: GRID 2x2 */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full min-h-0">

          {/* GRÁFICO 1: ÁREAS DE CONHECIMENTO */}
          <div className="h-full min-h-0 overflow-hidden">
            <ProportionBarChart
              data={areasProportionData.slice(0, 5)}
              title={isSemiarido ? "Áreas de Conhecimento no Semiárido" : "Áreas de Conhecimento"}
              subtitle={isSemiarido ? "Proporção de Ensino Público vs Privado no Semiárido" : "Proporção de Ensino Público vs Privado na Bahia"}
              positiveLabel="Rede Pública"
              negativeLabel="Rede Privada"
              positiveColor="bg-[#2563EB]"
              negativeColor="bg-[#F59E0B]"
              positiveTextColor="text-[#2563EB]"
              negativeTextColor="text-[#D97706]"
              isReport={true}
            />
          </div>

          {/* GRÁFICO 2: CONCENTRAÇÃO POR TERRITÓRIO OU POLOS DE OFERTA */}
          <div className="h-full min-h-0 overflow-hidden">
            {selectedTerritory ? (
              <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between h-full min-h-0">
                <div className="flex items-center justify-between mb-1 shrink-0">
                  <div>
                    <h3 className="text-[17px] lg:text-[18px] font-bold text-[#1D3557]">Polos de Oferta</h3>
                    <p className="text-[12px] text-[#457B9D]">Cidades com mais cursos em {territoryName}</p>
                  </div>
                  <BarChart3 size={18} className="text-[#2563EB]" />
                </div>
                <div className="flex-1 w-full min-h-0 pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMunicipiosData} layout="vertical" margin={{ left: 5, right: 28, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: '#1D3557', fontWeight: 700 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1D3557', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                      <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]}>
                        {topMunicipiosData.map((_, index) => (
                          <Cell key={`cell-bar-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                        <LabelList dataKey="count" position="insideRight" fill="#ffffff" fontSize={11} fontWeight={800} offset={8} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <StackedBarChart
                data={territoriosStackedData}
                categories={ENSINO_CATEGORIES}
                title={isSemiarido ? "Concentração no Semiárido" : "Concentração por Território"}
                subtitle={isSemiarido ? "Territórios do Semiárido com maior oferta de cursos" : "Top 10 Territórios da Bahia por Rede de Ensino"}
                allowToggleView={false}
                showTotalLabel={true}
              />
            )}
          </div>

          {/* GRÁFICO 3: COMPOSIÇÃO POR ÁREA E REDE */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1.5">
              <div>
                <h3 className="text-[17px] lg:text-[18px] font-bold text-[#1D3557] flex items-center gap-1.5">
                  <BarChart3 size={18} className={isSemiarido ? "text-[#D97706]" : "text-[#2563EB]"} />
                  {isSemiarido ? "Composição por Área e Rede no Semiárido" : "Composição por Área e Rede"}
                </h3>
                <p className="text-[12px] text-[#457B9D]">Proporção Federal, Estadual, IF e Privada</p>
              </div>

              <div className="flex items-center gap-2 text-[10.5px] font-bold">
                <span className="flex items-center gap-1 text-[#1D3557]"><span className="w-2 h-2 rounded-full bg-[#1D3557]"></span>Fed.</span>
                <span className="flex items-center gap-1 text-[#2563EB]"><span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>Est.</span>
                <span className="flex items-center gap-1 text-[#10B981]"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span>IF</span>
                <span className="flex items-center gap-1 text-[#F59E0B]"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>Priv.</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between gap-1.5 min-h-0 py-0.5">
              {matrixAreaNaturezaData.slice(0, 5).map((row, idx) => {
                const segments = [
                  { key: 'privada', label: 'Priv', name: 'Privada', count: row.privada, color: 'bg-[#F59E0B]', textColor: 'text-[#D97706]' },
                  { key: 'federal', label: 'Fed', name: 'Federal', count: row.federal, color: 'bg-[#1D3557]', textColor: 'text-[#1D3557]' },
                  { key: 'estadual', label: 'Est', name: 'Estadual', count: row.estadual, color: 'bg-[#2563EB]', textColor: 'text-[#2563EB]' },
                  { key: 'ifba', label: 'IF', name: 'IF', count: row.ifba, color: 'bg-[#10B981]', textColor: 'text-[#10B981]' },
                ]
                  .filter(s => s.count > 0)
                  .sort((a, b) => b.count - a.count);

                return (
                  <div key={idx} className="flex flex-col justify-between p-1.5 px-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/50 h-[52px]">
                    <div className="flex items-center justify-between text-[12.5px] leading-tight gap-1 shrink-0">
                      <span className="font-extrabold text-[#1D3557] truncate flex-1 min-w-0" title={row.categoria}>
                        {row.categoria}
                      </span>
                      <span className="font-bold text-[#457B9D] text-[11.5px] shrink-0">
                        <strong className="text-[#1D3557] font-black">{row.total}</strong> cursos
                      </span>
                    </div>

                    {/* BARRA COM FATIAS ORDENADAS DE MAIOR PARA MENOR */}
                    <div className="w-full h-[7px] shrink-0 rounded-full bg-[#E2E8F0] overflow-hidden flex shadow-2xs my-1">
                      {segments.map(seg => (
                        <div
                          key={seg.key}
                          className={`h-full ${seg.color} transition-all duration-500`}
                          style={{ width: `${(seg.count / row.total) * 100}%` }}
                          title={`${seg.name}: ${seg.count} (${((seg.count / row.total) * 100).toFixed(1)}%)`}
                        />
                      ))}
                    </div>

                    {/* VALORES DAS REDES ORDENADOS DE MAIOR PARA MENOR */}
                    <div className="flex items-center gap-2.5 text-[10px] font-extrabold text-[#64748B] shrink-0">
                      {segments.map(seg => (
                        <span key={seg.key} className={seg.textColor}>
                          {seg.label}: {seg.count}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GRÁFICO 4: COBERTURA DE REDE RNP */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1.5">
              <div>
                <h3 className="text-[17px] lg:text-[18px] font-bold text-[#1D3557] flex items-center gap-1.5">
                  <Wifi size={18} className={isSemiarido ? "text-[#D97706]" : "text-[#2563EB]"} />
                  {isSemiarido ? "Cobertura de Rede RNP no Semiárido" : "Cobertura de Rede RNP nos Campi"}
                </h3>
                <p className="text-[12px] text-[#457B9D]">
                  {isSemiarido ? "Campi do Semiárido conectados ao backbone acadêmico" : "Adesão dos campi universitários ao backbone de pesquisa na Bahia"}
                </p>
              </div>

              {/* LEGENDA */}
              <div className="flex items-center gap-2 text-[11.5px] font-bold">
                {isSemiarido ? (
                  <span className="flex items-center gap-1.5 text-[#B45309] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>Conectados no Semiárido
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20 px-2.5 py-0.5 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>Conectados à RNP
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between gap-1.5 min-h-0 py-0.5">
              {rnpStackedData.map((cat, idx) => (
                <div key={idx} className="flex flex-col justify-between p-1.5 px-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/50 h-[46px]">
                  <div className="flex items-center justify-between text-[13px] leading-tight gap-1">
                    <span className="font-extrabold text-[#1D3557] truncate flex-1 min-w-0" title={cat.name}>
                      {cat.name}
                    </span>
                    <span className="font-bold text-[#457B9D] text-[12px] shrink-0">
                      <strong className="text-[#1D3557] font-black">{cat.comRnpTotal}</strong> de {cat.total} ({cat.pctTotal}%)
                    </span>
                  </div>

                  {/* BARRA */}
                  <div className="w-full h-[7px] shrink-0 rounded-full bg-[#E2E8F0] overflow-hidden flex shadow-2xs my-0.5">
                    <div
                      className={`h-full transition-all duration-500 ${isSemiarido ? 'bg-[#F59E0B]' : 'bg-[#2563EB]'}`}
                      style={{ width: `${cat.pctTotal}%` }}
                      title={`${cat.name}: ${cat.comRnpTotal} de ${cat.total} (${cat.pctTotal}%)`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: SIDEMAP INTEGRADO NO MODO HEATMAP DE CURSOS */}
        <div style={{ width: 'calc(30% - 12px)' }} className="shrink-0 h-full bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_20px_rgba(29,53,87,0.04)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-0">
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