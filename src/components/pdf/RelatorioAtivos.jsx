import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Layers,
  X,
  Wifi,
  Award,
  Sun,
  Moon
} from 'lucide-react';

import { DataContext } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import SideMap from '../maps/SideMap';
import StackedBarChart from '../graph/StackedBarChart';
import ProportionBarChart from '../graph/ProportionBarChart';
import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';
import { getDynamicAssetTypeConfig } from '../../constants/assetTypes';
import { isMunicipioSemiarido, SEMIARIDO_TOTAL_MUNICIPIOS, BAHIA_TOTAL_MUNICIPIOS } from '../../constants/semiarido';
import { useReactToPrint } from 'react-to-print';
import { REPORT_PRINT_PAGE_STYLE, prepareReportForPrint, printWithCanvasSync } from '../../utils/reportPrint';
import { getSemanticColors, LIGHT_CHART_PALETTE } from '../graph/chartTheme';

const PALETTE = LIGHT_CHART_PALETTE;

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

function checkSemiaridoValue(val) {
  if (val === true || val === 1) return true;
  const s = String(val ?? '').toLowerCase().trim();
  return s === 'sim' || s === 'true' || s === '1' || s === 't';
}

function formatTipoUnificado(tipoStr) {
  const norm = normalizeName(tipoStr || '');
  if (norm.includes('incubadora') || norm.includes('aceleradora')) {
    return 'Aceleradoras & Incubadoras';
  }
  if (norm.includes('estadual')) {
    return 'Univ. Pública Estadual';
  }
  if (norm.includes('federal') && (norm.includes('universidade') || norm.includes('publica'))) {
    return 'Univ. Pública Federal';
  }
  if (norm.includes('privada')) {
    return 'Univ. Privada';
  }
  if (norm.includes('instituto federal') || norm.includes('ifba') || norm.includes('if baiano')) {
    return 'Campi Instituto Federal';
  }
  return tipoStr || 'Outros';
}

function getRedeInfo(tipoStr, siglaStr) {
  const semantic = getSemanticColors();
  const t = normalizeName(String(tipoStr || ''));
  const s = normalizeName(String(siglaStr || ''));

  // 1. Estadual
  if (t.includes('estadual') || s === 'uneb' || s === 'uefs' || s === 'uesc' || s === 'uesb') {
    return {
      rede: 'Estadual',
      label: 'Univ. Pública Estadual',
      corHex: semantic.primaryBase,
      fillBg: 'rgba(37, 99, 235, 0.18)',
      rankClass: 'bg-blue-600 text-white',
      badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25'
    };
  }

  // 2. Instituto Federal
  if (t.includes('instituto federal') || t.includes('inst federal') || s === 'ifba' || s === 'if baiano' || s.includes('ifba') || s.includes('if baiano')) {
    return {
      rede: 'Inst. Federal',
      label: 'Instituto Federal',
      corHex: semantic.success,
      fillBg: 'rgba(16, 185, 129, 0.20)',
      rankClass: 'bg-emerald-600 text-white',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
    };
  }

  // 3. Universidade Federal
  if (t.includes('federal') || s === 'ufba' || s === 'ufrb' || s === 'ufob' || s === 'ufsb' || s === 'univasf') {
    return {
      rede: 'Univ. Federal',
      label: 'Univ. Pública Federal',
      corHex: semantic.primaryNavy,
      fillBg: 'rgba(29, 53, 87, 0.16)',
      rankClass: 'bg-primary-900 text-white',
      badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/25'
    };
  }

  // 4. Privada
  if (t.includes('privada') || s === 'unirb' || s === 'anhanguera' || s === 'unex' || s === 'ages' || s === 'ftc' || s === 'unifacs') {
    return {
      rede: 'Univ. Privada',
      label: 'Univ. Privada',
      corHex: semantic.warning,
      fillBg: 'rgba(245, 158, 11, 0.22)',
      rankClass: 'bg-amber-500 text-white',
      badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
    };
  }

  // 5. Outros / ICT
  return {
    rede: 'ICT / Outros',
    label: 'Outros / ICT',
    corHex: semantic.purple,
    fillBg: 'rgba(139, 92, 246, 0.18)',
    rankClass: 'bg-purple-600 text-white',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25'
  };
}

// Mapeamento estrito das Categorias para o RNP
function getRnpTargetCategory(tipoStr) {
  const s = normalizeName(tipoStr || '');

  if (s.includes('instituto federal') || s.includes('ifba') || s.includes('if baiano')) {
    return 'Campi Instituto Federal';
  }
  if (s.includes('federal') && (s.includes('universidade') || s.includes('publica') || s.includes('univ'))) {
    return 'Univ. Pública Federal';
  }
  if (s.includes('estadual')) {
    return 'Univ. Pública Estadual';
  }
  if (s.includes('privada')) {
    return 'Univ. Privada';
  }
  if (s === 'ict' || s.includes('ict') || s.includes('instituto de ciencia e tecnologia')) {
    return 'ICT';
  }

  return null;
}

const MUN_LOOKUP = (() => {
  const byName = {};
  municipiosDB.forEach((row) => {
    byName[normalizeName(row.nome_municipio)] = row;
  });
  return { byName };
})();

export default function RelatorioAtivosPage() {
  const {
    ativosData = [],
    territoriosData = [],
    loadingStats = false,
    filtroSemiarido,
    setFiltroSemiarido
  } = useContext(DataContext);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const reportMode = searchParams.has('modo')
    ? searchParams.get('modo')
    : (filtroSemiarido ? 'semiarido' : 'normal');
  const isSemiarido = reportMode === 'semiarido';

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [focusedAsset, setFocusedAsset] = useState(null);

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

  // React-to-print: referência do relatório 1920x1080 para renderização e impressão nativa
  const contentRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `relatorio_ativos_${isSemiarido ? 'semiarido' : (selectedTerritory ? territoryName : 'bahia')}`,
    pageStyle: REPORT_PRINT_PAGE_STYLE,
    onBeforePrint: async () => {
      setIsPrinting(true);
      await prepareReportForPrint();
    },
    onAfterPrint: () => setIsPrinting(false),
    print: (iframe) => {
      setIsPrinting(false);
      return printWithCanvasSync(iframe, contentRef);
    }
  });

  // 0. Processamento Completo dos Ativos
  const ativosProcessados = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];

    return ativosData.map((a, idx) => {
      const nomeTipoColuna = a.tipo || a.nome_tipo || 'Outros';
      const configEstilo = getDynamicAssetTypeConfig(nomeTipoColuna);

      const munKey = normalizeName(a.municipio || '');
      const munRow = MUN_LOOKUP.byName[munKey];

      const rawLat = a.latitude != null && a.latitude !== '' ? Number(a.latitude) : null;
      const rawLng = a.longitude != null && a.longitude !== '' ? Number(a.longitude) : null;

      let lat = rawLat;
      let lng = rawLng;

      if (lat == null || lng == null || isNaN(lat) || isNaN(lng) || lat === 0) {
        const fallback = MUNICIPIOS_COORDS[String(a.municipio || '').trim()] ||
          MUNICIPIOS_COORDS[munKey] ||
          [-12.9714, -38.5014];
        lat = fallback[0];
        lng = fallback[1];
      }

      const id_territorio = a.id_territorio != null && a.id_territorio !== ''
        ? Number(a.id_territorio)
        : (munRow?.id_territorio || null);

      const rawTerr = a.territorio_identidade || a.territorio || munRow?.nome_territorio || '';
      const cleanTerr = rawTerr.replace(/^Território de Identidade\s+/i, '').trim();

      const rawSemiarido = a.semiarido ?? a.semi_arido ?? a.is_semiarido ?? munRow?.semiarido;
      const isSemi = checkSemiaridoValue(rawSemiarido) || isMunicipioSemiarido(a.municipio);

      return {
        id: a.id_ativo || idx + 1,
        id_territorio,
        nome: a.nome_ativo || a.sigla || 'Ativo de CT&I',
        sigla: (a.sigla || a.sigla_ativo || a.nome_ativo || 'S/S').trim(),
        tipo: nomeTipoColuna,
        shortTipo: configEstilo.shortLabel,
        municipio: a.municipio || munRow?.nome_municipio || 'Bahia',
        territorio: cleanTerr || 'Bahia',
        territorio_identidade: cleanTerr || 'Bahia',
        lat,
        lng,
        icone: configEstilo.icone,
        iconSvg: configEstilo.iconSvg,
        cor: configEstilo.bgClass,
        textCor: configEstilo.textClass,
        corHex: configEstilo.corHex,
        urlReferencia: a.url_referencia || '',
        tituloReferencia: a.titulo_referencia || '',
        rnp: a.rnp,
        semiarido: isSemi
      };
    });
  }, [ativosData]);

  const totalAtivosBahia = useMemo(() => ativosProcessados.length, [ativosProcessados]);

  // 1. Filtragem dos Ativos pelo Território Selecionado e Modo
  const filteredAtivos = useMemo(() => {
    if (!ativosProcessados || ativosProcessados.length === 0) return [];
    let list = ativosProcessados;

    if (selectedTerritory) {
      const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
      const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

      list = list.filter(a => {
        const idTerr = a.id_territorio ? String(a.id_territorio) : null;
        const normTerr = normalizeName(a.territorio || '');

        if (tid && a.id_territorio && String(a.id_territorio) === tid) return true;
        if (tid && idTerr) return idTerr === tid;

        if (tNorm && normTerr && (normTerr === tNorm || normTerr.includes(tNorm) || tNorm.includes(normTerr))) {
          if (normTerr.length > 3 && tNorm.length > 3) return true;
        }
        return false;
      });
    }

    if (isSemiarido) {
      list = list.filter(a => a.semiarido === true || isMunicipioSemiarido(a.municipio));
    }

    return list;
  }, [ativosProcessados, selectedTerritory, isSemiarido]);

  // Auto-impressão caso explicitamente solicitado via query param
  useEffect(() => {
    const autoPrint = searchParams.get('autoPrint') || searchParams.get('autoprint');
    if ((autoPrint === '1' || autoPrint === 'true') && !loadingStats && (filteredAtivos.length > 0 || (territoriosData && territoriosData.length > 0))) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [searchParams, loadingStats, handlePrint, filteredAtivos.length, territoriosData]);

  // 2. Indicadores Executivos (KPIs)
  const statsKpis = useMemo(() => {
    const total = filteredAtivos.length;
    const semiaridoCount = filteredAtivos.filter(a => a.semiarido).length;

    const munSet = new Set();
    const munSemiSet = new Set();
    const terrSet = new Set();
    let rnpTotal = 0;
    let rnpSemi = 0;

    filteredAtivos.forEach(a => {
      if (a.municipio) {
        const mKey = normalizeName(a.municipio);
        munSet.add(mKey);
        if (a.semiarido) munSemiSet.add(mKey);
      }
      if (a.territorio) terrSet.add(normalizeName(a.territorio));

      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim';
      if (hasRnp) {
        rnpTotal += 1;
        if (a.semiarido) rnpSemi += 1;
      }
    });

    const pctBahia = totalAtivosBahia > 0 ? ((total / totalAtivosBahia) * 100).toFixed(1) : '0.0';
    const totalMunUniverso = isSemiarido ? SEMIARIDO_TOTAL_MUNICIPIOS : (selectedTerritory ? munSet.size : BAHIA_TOTAL_MUNICIPIOS);
    const taxaMun = totalMunUniverso > 0 ? ((munSet.size / totalMunUniverso) * 100).toFixed(1) : '0.0';
    const rnpTaxa = total > 0 ? ((rnpTotal / total) * 100).toFixed(1) : '0.0';

    const totalTerrUniverso = isSemiarido ? 22 : (selectedTerritory ? 1 : (territoriosData.length || 27));
    const territoriosAtendidos = selectedTerritory ? (terrSet.size > 0 ? 1 : 0) : terrSet.size;
    const taxaTerr = totalTerrUniverso > 0 ? ((territoriosAtendidos / totalTerrUniverso) * 100).toFixed(1) : '0.0';

    return {
      total,
      pctBahia,
      semiaridoCount,
      municipiosAtendidos: munSet.size,
      totalMunUniverso,
      taxaMun,
      municipiosSemiCount: munSemiSet.size,
      territoriosAtendidos,
      totalTerrUniverso,
      taxaTerr,
      rnpTotal,
      rnpTaxa,
      rnpSemi
    };
  }, [filteredAtivos, isSemiarido, selectedTerritory, totalAtivosBahia, territoriosData]);

  // 3. Top 10 Entidades por Sigla
  const topSiglasData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const map = {};

    filteredAtivos.forEach(a => {
      const sigla = a.sigla || 'OUTROS';
      if (!map[sigla]) {
        const rawTipo = a.shortTipo || a.tipo || '';
        const redeInfo = getRedeInfo(rawTipo, sigla);
        map[sigla] = {
          sigla,
          nome: a.nome || sigla,
          tipo: rawTipo,
          redeInfo,
          corHex: redeInfo.corHex,
          total: 0,
          semiarido: 0
        };
      }
      map[sigla].total += 1;
      if (a.semiarido) map[sigla].semiarido += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredAtivos]);

  const maxSiglaTotal = useMemo(() => {
    if (!topSiglasData || topSiglasData.length === 0) return 1;
    return Math.max(...topSiglasData.map(d => d.total)) || 1;
  }, [topSiglasData]);

  // 4. Categorias Agrupadas (Top 4 + Outros)
  const { top4TiposSet, tipologiaCategories } = useMemo(() => {
    const counts = {};
    ativosProcessados.forEach(a => {
      const tipo = a.tipo || 'Outros';
      counts[tipo] = (counts[tipo] || 0) + 1;
    });

    const top4 = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(entry => entry[0]);

    const top4Set = new Set(top4.map(normalizeName));

    const categories = top4.map((tipo, idx) => ({
      key: normalizeName(tipo),
      label: tipo,
      shortLabel: tipo,
      colorHex: PALETTE[idx % PALETTE.length]
    }));

    categories.push({
      key: 'outros',
      label: 'Outras Tipologias',
      shortLabel: 'Outras Tipologias',
      colorHex: getSemanticColors().textMuted
    });

    return { top4TiposSet: top4Set, tipologiaCategories: categories };
  }, [ativosProcessados]);

  // 5. Dados de Concentração para o StackedBarChart
  const concentracaoTipologiaStackedData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const groups = {};

    filteredAtivos.forEach(a => {
      const groupKey = selectedTerritory ? (a.municipio || 'Não informado') : (a.territorio || 'Não identificado');
      if (!groups[groupKey]) {
        groups[groupKey] = { label: groupKey, total: 0, segments: {} };
      }

      const rawKey = normalizeName(a.tipo || 'Outros');
      const finalKey = top4TiposSet.has(rawKey) ? rawKey : 'outros';

      groups[groupKey].segments[finalKey] = (groups[groupKey].segments[finalKey] || 0) + 1;
      groups[groupKey].total += 1;
    });

    return Object.values(groups)
      .sort((a, b) => b.total - a.total)
      .map(g => ({
        ...g,
        totalLabel: String(g.total)
      }));
  }, [filteredAtivos, selectedTerritory, top4TiposSet]);

  // 6. Dados de Tipologia no padrão de Pílulas Proporcionais do AtivosPage
  const categoriasEmpilhadasData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const stats = {};
    const totalGeral = filteredAtivos.length || 1;

    filteredAtivos.forEach(a => {
      const tipoUnified = formatTipoUnificado(a.tipo);
      if (!stats[tipoUnified]) {
        const cfg = getDynamicAssetTypeConfig(a.tipo);
        stats[tipoUnified] = {
          name: tipoUnified,
          total: 0,
          corHex: cfg.corHex || getSemanticColors().primaryBase
        };
      }
      stats[tipoUnified].total += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        corHex: isSemiarido ? getSemanticColors().warningDeep : (PALETTE[idx % PALETTE.length] || item.corHex),
        remaining: Math.max(0, totalGeral - item.total),
        pctTotal: ((item.total / totalGeral) * 100).toFixed(1)
      }));
  }, [filteredAtivos, isSemiarido]);

  // 7. Dados de Conectividade RNP para o ProportionBarChart (idêntico ao DashboardPainel)
  const rnpComparisonData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];

    const stats = {
      'Campi Instituto Federal': { com: 0, sem: 0 },
      'Univ. Pública Estadual': { com: 0, sem: 0 },
      'Univ. Pública Federal': { com: 0, sem: 0 },
      'Univ. Privada': { com: 0, sem: 0 },
      'ICT': { com: 0, sem: 0 }
    };

    filteredAtivos.forEach(a => {
      const targetCat = getRnpTargetCategory(a.tipo || a.nome_tipo);
      if (!targetCat || !stats[targetCat]) return;

      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim';
      if (hasRnp) stats[targetCat].com += 1;
      else stats[targetCat].sem += 1;
    });

    return Object.entries(stats)
      .map(([label, v]) => ({
        label,
        positive: v.com,
        negative: v.sem,
        total: v.com + v.sem
      }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [filteredAtivos]);

  // Lista de KPIs com a mesma arquitetura visual de AtivosPage.jsx e DashboardPainel.jsx
  const kpiCards = [
    {
      label: isSemiarido ? 'Ativos no Semiárido' : 'Ativos de CT&I Mapeados',
      value: loadingStats ? '...' : statsKpis.total,
      suffix: null,
      badge: isSemiarido ? `${statsKpis.pctBahia}% da Bahia` : `${statsKpis.rnpTotal} com RNP (${statsKpis.rnpTaxa}%)`,
      icon: Building2,
      isHero: true
    },
    {
      label: 'Municípios com Presença',
      value: loadingStats ? '...' : statsKpis.municipiosAtendidos,
      suffix: `/ ${statsKpis.totalMunUniverso}`,
      badge: `${statsKpis.taxaMun}% de cobertura`,
      icon: MapPin,
      isHero: false
    },
    {
      label: 'Ativos Conectados RNP',
      value: loadingStats ? '...' : statsKpis.rnpTotal,
      suffix: null,
      badge: isSemiarido ? `${statsKpis.rnpTaxa}% conectados` : `${statsKpis.rnpTaxa}% do total`,
      icon: Wifi,
      isHero: false
    },
    {
      label: 'Territórios Cobertos',
      value: loadingStats ? '...' : (selectedTerritory ? '1' : statsKpis.territoriosAtendidos),
      suffix: `/ ${statsKpis.totalTerrUniverso}`,
      badge: selectedTerritory ? 'Território Selecionado' : `${statsKpis.taxaTerr}% dos territórios`,
      icon: Layers,
      isHero: false
    }
  ];

  return (
    <main
      id="pdf-report"
      data-ready={!loadingStats ? 'true' : 'false'}
      data-loading={loadingStats ? 'true' : 'false'}
      ref={contentRef}
      className="flex-1 h-screen overflow-hidden relative p-5 lg:p-6 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-transparent select-none"
    >
      {/* ================= ATMOSFERA: SOL DO SEMIÁRIDO ================= */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden z-0 transition-opacity duration-700 ease-in-out select-none ${
          isSemiarido ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="absolute -top-[18vw] -right-[12vw] w-[62vw] h-[62vw] min-w-[550px] min-h-[550px] max-w-[1080px] max-h-[1080px] rounded-full animate-sun-breath"
          style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.07) 30%, rgba(251, 191, 36, 0.03) 55%, transparent 75%)',
            filter: 'blur(35px)',
          }}
        />
      </div>

      {/* CABEÇALHO DO PAINEL */}
      <header className="flex items-center justify-between w-full shrink-0 relative z-10">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-headline font-bold text-text-primary tracking-tight leading-none">
              Relatório Executivo de Ativos de CT&I
            </h1>

            {isSemiarido ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Recorte Oficial: Semiárido Baiano (278 Municípios)
              </span>
            ) : selectedTerritory ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                <MapPin size={13} className="text-primary-600 dark:text-primary-400" />
                Recorte: {territoryName}
                <button
                  type="button"
                  onClick={() => setSelectedTerritory(null)}
                  className="text-primary-600 hover:text-rose-500 transition-colors ml-0.5 cursor-pointer print:hidden"
                  title="Limpar seleção territorial"
                >
                  <X size={12} />
                </button>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                <span className="w-2 h-2 rounded-full bg-primary-600" />
                Cenário Geral: Estado da Bahia (417 Municípios)
              </span>
            )}
          </div>

          <p className="text-body-sm text-text-secondary mt-1 font-medium">
            {isSemiarido
              ? 'Diagnóstico territorial e mapeamento estrutural dos ativos de CT&I nos 278 municípios do Semiárido'
              : 'Diagnóstico territorial e mapeamento estrutural dos ativos de ciência, tecnologia e inovação na Bahia'}
          </p>
          <div className={`divider-territorial w-48 mt-2 ${isSemiarido ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-transparent' : ''}`} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const next = !isSemiarido;
              setFiltroSemiarido?.(next);
              const newParams = new URLSearchParams(searchParams);
              if (next) {
                newParams.set('modo', 'semiarido');
              } else {
                newParams.delete('modo');
              }
              navigate(`?${newParams.toString()}`, { replace: true });
            }}
            title={isSemiarido ? 'Desativar modo Semiárido' : 'Ativar modo Semiárido'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-semibold transition-all shadow-xs active:scale-95 print:hidden cursor-pointer border ${
              isSemiarido
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                : 'bg-surface-soft border-border/70 text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isSemiarido ? 'bg-amber-500' : 'bg-slate-400'}`} />
            <span>Semiárido</span>
          </button>

          <span className="text-caption font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/40 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Award size={14} className="text-primary-600 dark:text-primary-400" />
            Dados Oficiais SECTI/BA
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            aria-label={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            className="w-8 h-8 rounded-full bg-surface-soft text-text-secondary hover:text-primary-600 hover:bg-surface border border-border/70 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 print:hidden cursor-pointer"
          >
            {isDark ? (
              <Sun size={15} strokeWidth={2} className="text-amber-400" />
            ) : (
              <Moon size={15} strokeWidth={2} className="text-neutral-600" />
            )}
          </button>
        </div>
      </header>

      {/* GRID DE KPIS (IDÊNTICO AO ATIVOSPAGE / DASHBOARDPAINEL) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch w-full">
          {kpiCards.map((kpi, index) => {
            const isHero = kpi.isHero;
            const IconComp = kpi.icon;

            return (
              <div
                key={index}
                className={`p-4 flex flex-col justify-between h-[98px] rounded-card cursor-default overflow-hidden select-none ${
                  isHero
                    ? (isSemiarido
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border border-amber-400/40 shadow-xs'
                        : 'bg-gradient-brand text-white border border-primary-500/40 shadow-xs')
                    : (isSemiarido
                        ? 'bg-surface-soft border border-amber-200/60 dark:border-amber-500/30 text-text-primary'
                        : 'bg-surface-soft border border-border/70 text-text-primary')
                }`}
              >
                {/* LINHA SUPERIOR: LABEL + ÍCONE CIRCULAR À DIREITA */}
                <div className="flex items-start justify-between gap-2 w-full min-w-0">
                  <span
                    className={`text-[13px] font-medium leading-tight truncate ${
                      isHero ? (isSemiarido ? 'text-amber-100' : 'text-white/85') : 'text-text-secondary'
                    }`}
                  >
                    {kpi.label}
                  </span>

                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                      isHero
                        ? 'bg-white/15 text-white border border-white/20 shadow-2xs'
                        : 'bg-surface border border-border/80 text-text-secondary shadow-2xs'
                    }`}
                  >
                    <IconComp size={15} strokeWidth={2} />
                  </div>
                </div>

                {/* LINHA INFERIOR: VALOR GRANDE + BADGE PILL */}
                <div className="flex items-baseline justify-between gap-2 w-full min-w-0 pt-0.5">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span
                      className={`text-[30px] font-bold tracking-tight leading-none shrink-0 tnum ${
                        isHero ? 'text-white' : 'text-text-primary'
                      }`}
                    >
                      {kpi.value}
                    </span>
                    {kpi.suffix && (
                      <span
                        className={`text-caption font-semibold tnum ${
                          isHero ? 'text-white/75' : 'text-text-muted'
                        }`}
                      >
                        {kpi.suffix}
                      </span>
                    )}
                  </div>

                  {kpi.badge && (
                    <span
                      className={`text-caption font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center leading-none truncate shrink-0 ${
                        isHero
                          ? 'bg-white/15 text-white border border-white/20'
                          : (isSemiarido
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60'
                              : 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60')
                      }`}
                    >
                      {kpi.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GRID PRINCIPAL: 4 GRÁFICOS (2x2 SIMÉTRICO) + SIDEMAP */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 relative z-10 min-h-0 w-full overflow-hidden">

        {/* COLUNA ESQUERDA: GRID 2x2 DE COMPONENTES DO PAINEL */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full min-h-0">

          {/* GRÁFICO 1: TOP 10 ENTIDADES POR SIGLA (ESTILO PÍLULAS DO CUSTOMPIECHART) */}
          <div className={`bg-surface rounded-card p-4 border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} flex flex-col justify-between min-h-0 h-full overflow-hidden`}>
            <div className="flex items-start justify-between gap-2 mb-1.5 shrink-0">
              <div className="flex flex-col min-w-0">
                <h2 className="text-text-primary font-semibold text-subtitle tracking-tight truncate">
                  Top 10 Entidades por Sigla
                </h2>
                <p className="text-text-muted text-caption font-medium mt-0.5 truncate">
                  Volume de infraestruturas instaladas por rede
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-text-secondary shrink-0 pt-0.5">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-600"></span>Est.</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>IF</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-900"></span>Fed.</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning-500"></span>Priv.</span>
              </div>
            </div>

            <div className="w-full h-px bg-border/70 mb-2 shrink-0" />

            {/* DUAS COLUNAS x 5 LINHAS DE PÍLULAS PROPORCIONAIS SÓLIDAS */}
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5 min-h-0 overflow-hidden py-0.5 content-between">
              {topSiglasData.map((item, idx) => {
                const rankStr = String(idx + 1).padStart(2, '0');
                const scaleTotal = Math.max(maxSiglaTotal + 4, 10);
                const remaining = Math.max(1, scaleTotal - item.total);

                return (
                  <div
                    key={idx}
                    title={`${item.sigla} (${item.redeInfo.label}): ${item.total} ativos`}
                    className="flex flex-col gap-0.5 w-full min-w-0"
                  >
                    {/* LINHA DE TÍTULO: POSIÇÃO + SIGLA + BADGE DA REDE */}
                    <div className="flex items-center justify-between gap-1.5 px-0.5 leading-tight">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] font-bold text-text-muted tabular-nums shrink-0">
                          {rankStr}.
                        </span>
                        <span className="text-caption font-bold text-text-primary truncate tracking-tight">
                          {item.sigla}
                        </span>
                      </div>
                      <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full leading-none shrink-0 ${item.redeInfo.badgeClass}`}>
                        {item.redeInfo.rede}
                      </span>
                    </div>

                    {/* BARRA DE PÍLULAS PROPORCIONAIS (PÍLULA DE COR SÓLIDA + PÍLULA COMPLEMENTAR) */}
                    <div className="flex items-center gap-1.5 w-full">
                      <div
                        className="h-[22px] rounded-full flex items-center justify-center px-2.5 text-white transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap"
                        style={{
                          flexGrow: item.total,
                          flexBasis: 0,
                          backgroundColor: isSemiarido ? getSemanticColors().warningDeep : item.redeInfo.corHex,
                          minWidth: '38px'
                        }}
                      >
                        <span className="text-caption font-bold tabular-nums leading-none whitespace-nowrap">
                          {item.total}
                        </span>
                      </div>

                      <div
                        className={`h-[22px] rounded-full ${
                          isSemiarido
                            ? 'bg-amber-500/15 border border-amber-500/25'
                            : 'bg-surface-soft border border-border'
                        } flex items-center justify-center px-2 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs`}
                        style={{
                          flexGrow: remaining,
                          flexBasis: 0
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GRÁFICO 2: CONCENTRAÇÃO TERRITORIAL (STACKED BAR CHART) */}
          <div className="h-full min-h-0 overflow-hidden">
            <StackedBarChart
              data={concentracaoTipologiaStackedData}
              categories={tipologiaCategories}
              title={isSemiarido ? 'Concentração no Semiárido' : (selectedTerritory ? `Municípios em ${territoryName}` : 'Concentração por Território')}
              subtitle={isSemiarido ? 'Principais territórios do Semiárido' : 'Top 4 categorias + Outros'}
              allowToggleView={false}
              showTotalLabel={true}
              isSemiarido={isSemiarido}
            />
          </div>

          {/* GRÁFICO 3: DISTRIBUIÇÃO POR TIPOLOGIA (ESTILO PÍLULAS PROPORCIONAIS DO ATIVOSPAGE) */}
          <div className={`bg-surface rounded-card p-4 border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} flex flex-col justify-between min-h-0 h-full overflow-hidden`}>
            <div className="flex items-start justify-between gap-2 mb-1.5 shrink-0">
              <div className="flex flex-col min-w-0">
                <h2 className="text-text-primary font-semibold text-subtitle tracking-tight truncate">
                  {isSemiarido
                    ? 'Distribuição por Tipologia no Semiárido'
                    : (selectedTerritory ? `Tipologias em ${territoryName}` : 'Distribuição por Tipologia')}
                </h2>
                <p className="text-text-muted text-caption font-medium mt-0.5 truncate">
                  {isSemiarido ? 'Principais categorias instaladas no Semiárido' : 'Volume de ativos por categoria na Bahia'}
                </p>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-semibold shrink-0 border ${
                isSemiarido
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                  : 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border-primary-200/60 dark:border-primary-800/60'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSemiarido ? 'bg-amber-500' : 'bg-primary-600'}`} />
                {isSemiarido ? 'Recorte Semiárido' : 'Top 5 Categorias'}
              </span>
            </div>

            <div className="w-full h-px bg-border/70 mb-1.5 shrink-0" />

            {/* LISTA DE BARRAS DE PÍLULAS PROPORCIONAIS (IDÊNTICA À ABA 2 DO ATIVOSPAGE) */}
            <div className="flex-1 flex flex-col justify-between gap-1.5 min-h-0 my-auto py-0.5">
              {categoriasEmpilhadasData.map((cat, idx) => {
                const negPillStyle = isSemiarido
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25'
                  : 'bg-surface-soft text-text-secondary border border-border';
                const totalPillStyle = isSemiarido
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/40'
                  : 'bg-surface-soft text-text-primary border border-border';

                return (
                  <div key={idx} className="flex flex-col gap-0.5 w-full">
                    <div className="text-caption font-semibold text-text-primary leading-tight flex items-center justify-between px-0.5">
                      <span className="truncate">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 w-full">
                      <div
                        className="h-[24px] rounded-full flex items-center justify-center px-2.5 text-white transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap"
                        style={{
                          flexGrow: cat.total,
                          flexBasis: 0,
                          backgroundColor: cat.corHex,
                          minWidth: cat.remaining > 0 ? '44px' : 'auto'
                        }}
                      >
                        <span className="text-caption font-semibold tabular-nums leading-none whitespace-nowrap">
                          {cat.total}
                        </span>
                      </div>

                      {cat.remaining > 0 && (
                        <div
                          className={`h-[24px] rounded-full ${negPillStyle} flex items-center justify-center px-2.5 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap`}
                          style={{
                            flexGrow: cat.remaining,
                            flexBasis: 0
                          }}
                        />
                      )}

                      <div
                        className={`h-[24px] min-w-[54px] px-2.5 rounded-full ${totalPillStyle} flex items-center justify-center shrink-0 select-none shadow-2xs`}
                      >
                        <span className="text-caption font-semibold tabular-nums leading-none">
                          {cat.pctTotal}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GRÁFICO 4: INFRAESTRUTURA RNP (COMPONENTE NATIVO PROPORTIONBARCHART DO PAINEL) */}
          <div className="h-full min-h-0 overflow-hidden flex flex-col">
            <ProportionBarChart
              isVisaoGeral={true}
              isSemiarido={isSemiarido}
              data={rnpComparisonData}
              title={isSemiarido ? 'Infraestrutura RNP · Semiárido' : 'Infraestrutura RNP'}
              subtitle={isSemiarido ? 'Proporção de ativos conectados à RNP no Semiárido' : 'Proporção de ativos conectados à Rede Nacional de Pesquisa'}
              positiveLabel="Com RNP"
              negativeLabel="Sem RNP"
              positiveColor={isSemiarido ? 'bg-amber-600' : 'bg-primary-600'}
              negativeColor={isSemiarido ? 'bg-amber-500/15' : 'bg-primary-100'}
              positiveTextColor={isSemiarido ? 'text-amber-700 dark:text-amber-300' : 'text-primary-700 dark:text-primary-300'}
              negativeTextColor={isSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-primary-700 dark:text-primary-300'}
            />
          </div>

        </div>

        {/* COLUNA DIREITA: SIDEMAP INTEGRADO NO MODO ATIVOS */}
        <div style={{ width: 'calc(30% - 12px)' }} className={`shrink-0 h-full bg-surface rounded-card border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} shadow-card relative overflow-hidden flex flex-col min-h-0`}>
          <SideMap
            key={`map-ativos-${isSemiarido ? 'semi' : 'normal'}-${selectedTerritory?.id_territorio || 'all'}`}
            mode="ativos"
            processedAtivos={filteredAtivos}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            focusedAsset={focusedAsset}
            filtroSemiarido={isSemiarido}
          />
        </div>

      </div>

    </main>
  );
}
