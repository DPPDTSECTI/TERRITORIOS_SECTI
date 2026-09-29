import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Layers,
  X,
  ListOrdered,
  BarChart2,
  Wifi,
  Printer,
  ArrowLeft,
  Award,
  Image as ImageIcon,
  Sun,
  Moon
} from 'lucide-react';

import { DataContext } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import SideMap from '../maps/SideMap';
import StackedBarChart from '../graph/StackedBarChart';
import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';
import { getDynamicAssetTypeConfig } from '../../constants/assetTypes';
import { isMunicipioSemiarido, SEMIARIDO_TOTAL_MUNICIPIOS, BAHIA_TOTAL_MUNICIPIOS } from '../../constants/semiarido';
import { useReactToPrint } from 'react-to-print';
import { REPORT_PRINT_PAGE_STYLE, prepareReportForPrint, printWithCanvasSync } from '../../utils/reportPrint';

const PALETTE = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#1D3557'];

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
  const t = normalizeName(String(tipoStr || ''));
  const s = normalizeName(String(siglaStr || ''));

  // 1. Estadual
  if (t.includes('estadual') || s === 'uneb' || s === 'uefs' || s === 'uesc' || s === 'uesb') {
    return {
      rede: 'Estadual',
      label: 'Univ. Pública Estadual',
      corHex: '#2563EB',
      bgClass: 'bg-[#2563EB]',
      textClass: 'text-[#2563EB]',
      badgeBg: 'bg-[#EFF6FF]',
      badgeBorder: 'border-[#BFDBFE]'
    };
  }

  // 2. Instituto Federal
  if (t.includes('instituto federal') || t.includes('inst federal') || s === 'ifba' || s === 'if baiano' || s.includes('ifba') || s.includes('if baiano')) {
    return {
      rede: 'Inst. Federal',
      label: 'Instituto Federal',
      corHex: '#10B981',
      bgClass: 'bg-[#10B981]',
      textClass: 'text-[#059669]',
      badgeBg: 'bg-[#ECFDF5]',
      badgeBorder: 'border-[#A7F3D0]'
    };
  }

  // 3. Universidade Federal
  if (t.includes('federal') || s === 'ufba' || s === 'ufrb' || s === 'ufob' || s === 'ufsb' || s === 'univasf') {
    return {
      rede: 'Univ. Federal',
      label: 'Univ. Pública Federal',
      corHex: '#1D3557',
      bgClass: 'bg-[#1D3557]',
      textClass: 'text-[#1D3557]',
      badgeBg: 'bg-[#F1F5F9]',
      badgeBorder: 'border-[#CBD5E1]'
    };
  }

  // 4. Privada
  if (t.includes('privada') || s === 'unirb' || s === 'anhanguera' || s === 'unex' || s === 'ages' || s === 'ftc' || s === 'unifacs') {
    return {
      rede: 'Univ. Privada',
      label: 'Univ. Privada',
      corHex: '#F59E0B',
      bgClass: 'bg-[#F59E0B]',
      textClass: 'text-[#D97706]',
      badgeBg: 'bg-[#FEF3C7]',
      badgeBorder: 'border-[#FDE68A]'
    };
  }

  // 5. Outros / ICT
  return {
    rede: 'Outros / ICT',
    label: 'Outros / ICT',
    corHex: '#8B5CF6',
    bgClass: 'bg-[#8B5CF6]',
    textClass: 'text-[#7C3AED]',
    badgeBg: 'bg-[#F5F3FF]',
    badgeBorder: 'border-[#DDD6FE]'
  };
}

// Mapeamento estrito das 5 categorias solicitadas para o RNP
function getRnpTargetCategory(tipoStr) {
  const s = normalizeName(tipoStr || '');

  // 1. Instituto Federal (IFBA, IF Baiano, etc.)
  if (s.includes('instituto federal') || s.includes('ifba') || s.includes('if baiano')) {
    return 'Campi Instituto Federal';
  }
  // 2. Universidade Pública Federal (UFBA, UFRB, UFSB, UFOB, etc.)
  if (s.includes('federal') && (s.includes('universidade') || s.includes('publica') || s.includes('univ'))) {
    return 'Univ. Pública Federal';
  }
  // 3. Universidade Pública Estadual (UNEB, UEFS, UESC, UESB)
  if (s.includes('estadual')) {
    return 'Univ. Pública Estadual';
  }
  // 4. Universidade Privada
  if (s.includes('privada')) {
    return 'Univ. Privada';
  }
  // 5. ICT
  if (s === 'ict' || s.includes('ict') || s.includes('instituto de ciencia e tecnologia')) {
    return 'ICT';
  }

  return null; // Demais tipologias são ignoradas
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

  // Auto-impressão caso explicitamente solicitado via query param (ex: autoPrint=1 ou autoprint=true)
  useEffect(() => {
    const autoPrint = searchParams.get('autoPrint') || searchParams.get('autoprint');
    if ((autoPrint === '1' || autoPrint === 'true') && !loadingStats) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [searchParams, loadingStats, handlePrint]);

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

  // 3. Top 10 Entidades por Sigla com barras horizontais e cores por rede
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

  // 4. Categorias Agrupadas (Top 4 + Outros) com Nomes Completos (Sem Reticências)
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
      shortLabel: tipo, // Nome completo exibido
      colorHex: PALETTE[idx % PALETTE.length]
    }));

    categories.push({
      key: 'outros',
      label: 'Outras Tipologias',
      shortLabel: 'Outras Tipologias',
      colorHex: '#94A3B8'
    });

    return { top4TiposSet: top4Set, tipologiaCategories: categories };
  }, [ativosProcessados]);

  // 5. Dados de Concentração
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

  // 6. Dados Empilhados por Categoria de Ativo (Top 6 em 2 Colunas)
  const categoriasEmpilhadasData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const stats = {};
    const totalGeral = filteredAtivos.length;

    filteredAtivos.forEach(a => {
      const tipoUnified = formatTipoUnificado(a.tipo);
      if (!stats[tipoUnified]) {
        stats[tipoUnified] = { name: tipoUnified, total: 0, semi: 0, fora: 0 };
      }
      stats[tipoUnified].total += 1;
      if (a.semiarido) stats[tipoUnified].semi += 1;
      else stats[tipoUnified].fora += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(item => ({
        ...item,
        pctTotal: totalGeral > 0 ? ((item.total / totalGeral) * 100).toFixed(1) : '0.0',
        pctSemi: item.total > 0 ? ((item.semi / item.total) * 100).toFixed(0) : '0',
        pctFora: item.total > 0 ? ((item.fora / item.total) * 100).toFixed(0) : '0'
      }));
  }, [filteredAtivos]);

  // 7. Dados de Conectividade RNP com as 5 Categorias e Comparação ao Semiárido
  const rnpStackedData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];

    const stats = {
      'Campi Instituto Federal': { name: 'Campi Instituto Federal', semi: 0, fora: 0, comRnpTotal: 0, total: 0 },
      'Univ. Pública Federal': { name: 'Univ. Pública Federal', semi: 0, fora: 0, comRnpTotal: 0, total: 0 },
      'Univ. Pública Estadual': { name: 'Univ. Pública Estadual', semi: 0, fora: 0, comRnpTotal: 0, total: 0 },
      'Univ. Privada': { name: 'Univ. Privada', semi: 0, fora: 0, comRnpTotal: 0, total: 0 },
      'ICT': { name: 'ICT', semi: 0, fora: 0, comRnpTotal: 0, total: 0 }
    };

    filteredAtivos.forEach(a => {
      const targetCat = getRnpTargetCategory(a.tipo || a.nome_tipo);
      if (!targetCat) return;

      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim';

      if (hasRnp) {
        if (a.semiarido === true) {
          stats[targetCat].semi += 1;
        } else {
          stats[targetCat].fora += 1;
        }
        stats[targetCat].comRnpTotal += 1;
      }
      stats[targetCat].total += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .map(item => ({
        ...item,
        pctTotal: item.total > 0 ? ((item.comRnpTotal / item.total) * 100).toFixed(1) : '0.0',
        pctSemi: item.total > 0 ? ((item.semi / item.total) * 100).toFixed(1) : '0.0',
        pctFora: item.total > 0 ? ((item.fora / item.total) * 100).toFixed(1) : '0.0'
      }));
  }, [filteredAtivos]);

  return (
    <main id="pdf-report" ref={contentRef} className="flex-1 h-screen overflow-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-transparent select-none">
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
        <div
          className="absolute -top-[16vw] -right-[10vw] w-[54vw] h-[54vw] min-w-[480px] min-h-[480px] max-w-[940px] max-h-[940px] rounded-full animate-sun-arc"
          style={{
            border: '1.5px solid rgba(245, 158, 11, 0.22)',
            boxShadow: '0 0 45px rgba(251, 191, 36, 0.10), inset 0 0 45px rgba(245, 158, 11, 0.04)',
            maskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0) 70%)',
            WebkitMaskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0) 70%)',
          }}
        />
        <div
          className="absolute -top-[22vw] -right-[16vw] w-[70vw] h-[70vw] min-w-[620px] min-h-[620px] max-w-[1220px] max-h-[1220px] rounded-full animate-sun-breath"
          style={{
            border: '1px solid rgba(217, 119, 6, 0.11)',
            maskImage: 'linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0) 60%)',
            WebkitMaskImage: 'linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0) 60%)',
          }}
        />
        <div
          className="absolute top-0 right-0 w-[460px] h-[320px] rounded-full opacity-60 animate-sun-breath"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.02) 50%, transparent 80%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* CABEÇALHO */}
      <div className="flex items-center justify-between w-full shrink-0 relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[30px] lg:text-[32px] font-black text-[#1D3557] dark:text-text-primary tracking-tight leading-none">
              Relatório Executivo de Ativos de CT&I
            </h1>

            {isSemiarido ? (
              <div className="flex items-center gap-1.5 bg-[#FEF3C7] dark:bg-amber-950/50 border border-[#FDE68A] dark:border-amber-600/40 px-3.5 py-1 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                <span className="text-[12px] font-bold text-[#92400E] dark:text-amber-200">
                  Recorte Oficial: <strong>Semiárido Baiano (278 Municípios)</strong>
                </span>
              </div>
            ) : selectedTerritory ? (
              <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 dark:bg-primary-950/50 border border-[#BAE6FD] dark:border-primary-700/50 px-3 py-1 rounded-full">
                <MapPin size={13} className="text-[#0284C7] dark:text-primary-400" />
                <span className="text-[12px] font-bold text-[#0369A1] dark:text-primary-300">
                  Recorte: <strong className="text-[#0C4A6E] dark:text-text-primary">{territoryName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTerritory(null)}
                  className="text-[#0369A1] dark:text-primary-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer print:hidden"
                  title="Limpar seleção territorial"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#E0F2FE]/80 dark:bg-primary-950/50 border border-[#BAE6FD] dark:border-primary-700/50 px-3.5 py-1 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span className="text-[12px] font-bold text-[#0369A1] dark:text-primary-300">
                  Cenário Geral: <strong className="text-[#0C4A6E] dark:text-text-primary">Estado da Bahia (417 Municípios)</strong>
                </span>
              </div>
            )}
          </div>
          <p className="text-[13.5px] text-[#457B9D] dark:text-text-secondary font-medium mt-1">
            {isSemiarido
              ? 'Diagnóstico territorial e mapeamento estrutural dos ativos de CT&I nos 278 municípios do Semiárido'
              : 'Diagnóstico territorial e mapeamento estrutural dos ativos de ciência, tecnologia e inovação na Bahia'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* BOTÃO TOGGLE SEMIÁRIDO (print:hidden) */}
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
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold transition-all shadow-xs active:scale-95 print:hidden cursor-pointer border ${
              isSemiarido
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                : 'bg-surface-soft border-border/70 text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isSemiarido ? 'bg-amber-500' : 'bg-slate-400'}`} />
            <span>Semiárido</span>
          </button>

          <span className="text-[12px] font-bold text-[#1D3557] dark:text-primary-300 bg-[#D6EAF8]/50 dark:bg-primary-950/40 border border-[#BAE6FD] dark:border-primary-800/40 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5">
            <Award size={14} className="text-[#2563EB] dark:text-primary-400" />
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
              <Sun size={15} strokeWidth={2} className="text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon size={15} strokeWidth={2} className="text-neutral-600 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>

      {/* GRID DE KPIS (h-[96px]) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch w-full">

          {/* KPI 1: ATIVOS MAPEADOS */}
          <div className={`h-[96px] bg-white dark:bg-surface rounded-[24px] p-3 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border'}`}>
            <div className="flex items-center gap-2 text-[#457B9D] dark:text-text-secondary">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSemiarido ? 'bg-amber-500/15 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-[#D6EAF8]/70 dark:bg-primary-950/50 text-[#2563EB] dark:text-primary-400'}`}>
                <Building2 size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[12px] font-bold text-[#64748B] dark:text-text-muted uppercase tracking-wider">Ativos Mapeados</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[38px] lg:text-[42px] font-black text-[#1D3557] dark:text-text-primary leading-none tracking-tight">
                {loadingStats ? '...' : statsKpis.total}
              </span>
              <span
                className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${isSemiarido
                  ? 'text-[#B45309] dark:text-amber-300 bg-[#F59E0B]/12 dark:bg-amber-950/40 border border-[#F59E0B]/25 dark:border-amber-600/30'
                  : 'text-[#2563EB] dark:text-primary-300 bg-[#2563EB]/10 dark:bg-primary-950/40 border border-[#2563EB]/20 dark:border-primary-700/40'
                  }`}
                title={`${statsKpis.total} de ${totalAtivosBahia} ativos estaduais`}
              >
                {isSemiarido ? `${statsKpis.pctBahia}% da Bahia` : `${statsKpis.rnpTotal} com RNP (${statsKpis.rnpTaxa}%)`}
              </span>
            </div>
          </div>

          {/* KPI 2: MUNICÍPIOS COM PRESENÇA */}
          <div className={`h-[96px] bg-white dark:bg-surface rounded-[24px] p-3 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border'}`}>
            <div className="flex items-center gap-2 text-[#457B9D] dark:text-text-secondary">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSemiarido ? 'bg-amber-500/15 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-[#D6EAF8]/70 dark:bg-primary-950/50 text-[#2563EB] dark:text-primary-400'}`}>
                <MapPin size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[12px] font-bold text-[#64748B] dark:text-text-muted uppercase tracking-wider">Municípios com Presença</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[38px] lg:text-[42px] font-black text-[#1D3557] dark:text-text-primary leading-none tracking-tight">
                  {loadingStats ? '...' : statsKpis.municipiosAtendidos}
                </span>
                <span className="text-[14px] font-bold text-[#64748B] dark:text-text-muted">/ {statsKpis.totalMunUniverso}</span>
              </div>
              <span
                className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${isSemiarido
                  ? 'text-[#B45309] dark:text-amber-300 bg-[#F59E0B]/12 dark:bg-amber-950/40 border border-[#F59E0B]/25 dark:border-amber-600/30'
                  : 'text-[#2563EB] dark:text-primary-300 bg-[#2563EB]/10 dark:bg-primary-950/40 border border-[#2563EB]/20 dark:border-primary-700/40'
                  }`}
              >
                {isSemiarido ? `${statsKpis.taxaMun}% de cobertura` : `${statsKpis.taxaMun}% de cobertura estadual`}
              </span>
            </div>
          </div>

          {/* KPI 3: CONECTADOS À REDE RNP */}
          <div className={`h-[96px] bg-white dark:bg-surface rounded-[24px] p-3 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border'}`}>
            <div className="flex items-center gap-2 text-[#457B9D] dark:text-text-secondary">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSemiarido ? 'bg-amber-500/15 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-[#D6EAF8]/70 dark:bg-primary-950/50 text-[#2563EB] dark:text-primary-400'}`}>
                <Wifi size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[12px] font-bold text-[#64748B] dark:text-text-muted uppercase tracking-wider">Ativos Conectados RNP</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[38px] lg:text-[42px] font-black text-[#1D3557] dark:text-text-primary leading-none tracking-tight">
                {loadingStats ? '...' : statsKpis.rnpTotal}
              </span>
              <span
                className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${isSemiarido
                  ? 'text-[#B45309] dark:text-amber-300 bg-[#F59E0B]/12 dark:bg-amber-950/40 border border-[#F59E0B]/25 dark:border-amber-600/30'
                  : 'text-[#2563EB] dark:text-primary-300 bg-[#2563EB]/10 dark:bg-primary-950/40 border border-[#2563EB]/20 dark:border-primary-700/40'
                  }`}
              >
                {isSemiarido ? `${statsKpis.rnpTaxa}% conectados` : 'Rede de Pesquisa'}
              </span>
            </div>
          </div>

          {/* KPI 4: TERRITÓRIOS COBERTOS */}
          <div className={`h-[96px] bg-white dark:bg-surface rounded-[24px] p-3 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border'}`}>
            <div className="flex items-center gap-2 text-[#457B9D] dark:text-text-secondary">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSemiarido ? 'bg-amber-500/15 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-[#D6EAF8]/70 dark:bg-primary-950/50 text-[#2563EB] dark:text-primary-400'}`}>
                <Layers size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[12px] font-bold text-[#64748B] dark:text-text-muted uppercase tracking-wider">Territórios Cobertos</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[38px] lg:text-[42px] font-black text-[#1D3557] dark:text-text-primary leading-none tracking-tight">
                  {loadingStats ? '...' : (selectedTerritory ? '1' : statsKpis.territoriosAtendidos)}
                </span>
                <span className="text-[14px] font-bold text-[#64748B] dark:text-text-muted">/ {statsKpis.totalTerrUniverso}</span>
              </div>
              <span
                className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${isSemiarido
                  ? 'text-[#B45309] dark:text-amber-300 bg-[#F59E0B]/12 dark:bg-amber-950/40 border border-[#F59E0B]/25 dark:border-amber-600/30'
                  : 'text-[#2563EB] dark:text-primary-300 bg-[#2563EB]/10 dark:bg-primary-950/40 border border-[#2563EB]/20 dark:border-primary-700/40'
                  }`}
              >
                {selectedTerritory ? 'Território Selecionado' : (isSemiarido ? `${statsKpis.taxaTerr}% do Semiárido` : `${statsKpis.taxaTerr}% dos territórios`)}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* GRID PRINCIPAL: 4 GRÁFICOS (2x2 SIMÉTRICO) + SIDEMAP */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-0 w-full overflow-hidden">

        {/* COLUNA ESQUERDA: GRID 2x2 */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full min-h-0">

          {/* GRÁFICO 1: TOP 10 SIGLAS COM BARRAS HORIZONTAIS EM ORDEM DESC */}
          <div className={`bg-white dark:bg-surface rounded-[24px] p-4 border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card'} flex flex-col justify-between min-h-0 h-full overflow-hidden`}>
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] dark:border-border pb-1.5">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-[17px] lg:text-[18px] font-bold text-[#1D3557] dark:text-text-primary flex items-center gap-1.5">
                  <ListOrdered size={18} className={isSemiarido ? "text-[#D97706] shrink-0" : "text-[#2563EB] shrink-0"} />
                  Top 10 Entidades por Sigla
                </h3>
                <p className="text-[12px] text-[#457B9D] dark:text-text-secondary">Volume de infraestruturas instaladas por rede</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold shrink-0">
                <span className="flex items-center gap-1 text-[#2563EB] dark:text-primary-400"><span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>Estadual</span>
                <span className="flex items-center gap-1 text-[#10B981] dark:text-emerald-400"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span>IF</span>
                <span className="flex items-center gap-1 text-[#1D3557] dark:text-slate-300"><span className="w-2 h-2 rounded-full bg-[#1D3557] dark:bg-slate-300"></span>Federal</span>
                <span className="flex items-center gap-1 text-[#F59E0B] dark:text-amber-400"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>Privada</span>
              </div>
            </div>

            {/* DUAS BANDAS (2 COLUNAS x 5 LINHAS) COM BARRAS HORIZONTAIS */}
            <div className="flex-1 grid grid-cols-2 gap-x-2.5 gap-y-1 min-h-0 overflow-hidden py-0.5 items-stretch">
              {topSiglasData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between p-1.5 px-2.5 rounded-xl bg-[#F8FAFC] dark:bg-surface-soft hover:bg-[#F1F5F9] dark:hover:bg-surface transition-all border border-[#E2E8F0]/50 dark:border-border h-[40px]"
                >
                  <div className="flex items-center justify-between text-[11.5px] leading-none gap-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className="w-4 h-4 rounded-md flex items-center justify-center text-[9.5px] font-black text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.redeInfo.corHex }}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-extrabold text-[#1D3557] dark:text-text-primary truncate text-[12px]" title={item.nome}>
                        {item.sigla}
                      </span>
                      <span className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded shrink-0 border ${item.redeInfo.badgeBg} ${item.redeInfo.textClass} ${item.redeInfo.badgeBorder} dark:bg-surface dark:border-border`}>
                        {item.redeInfo.rede}
                      </span>
                    </div>

                    <span className="font-extrabold text-[#1D3557] dark:text-text-primary text-[12px] shrink-0">
                      {item.total} <span className="text-[9.5px] font-medium text-[#64748B] dark:text-text-muted">inst.</span>
                    </span>
                  </div>

                  {/* BARRA HORIZONTAL COM COR DA REDE */}
                  <div className="w-full h-[6px] rounded-full bg-[#E2E8F0] dark:bg-primary-950/40 overflow-hidden flex shadow-2xs mt-1">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(6, (item.total / maxSiglaTotal) * 100)}%`,
                        backgroundColor: item.redeInfo.corHex
                      }}
                      title={`${item.sigla} (${item.redeInfo.label}): ${item.total} infraestruturas instaladas`}
                    />
                  </div>
                </div>
              ))}
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

          {/* GRÁFICO 3: DISTRIBUIÇÃO POR TIPOLOGIA */}
          <div className={`bg-white dark:bg-surface rounded-[24px] p-4 border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card'} flex flex-col justify-between min-h-0 h-full overflow-hidden`}>
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] dark:border-border pb-1.5">
              <div>
                <h3 className="text-[17px] lg:text-[18px] font-bold text-[#1D3557] dark:text-text-primary flex items-center gap-1.5">
                  <BarChart2 size={18} className={isSemiarido ? "text-[#D97706]" : "text-[#2563EB]"} />
                  {isSemiarido
                    ? 'Distribuição por Tipologia no Semiárido'
                    : (selectedTerritory ? `Tipologias em ${territoryName}` : 'Distribuição Estadual por Tipologia')}
                </h3>
                <p className="text-[12px] text-[#457B9D] dark:text-text-secondary">
                  {isSemiarido ? 'Top 6 Categorias instaladas no Semiárido' : 'Top 6 Categorias de Ativos de CT&I na Bahia'}
                </p>
              </div>

              <div className="flex items-center gap-2.5 text-[11.5px] font-bold">
                {isSemiarido ? (
                  <span className="flex items-center gap-1.5 text-[#B45309] dark:text-amber-300 bg-[#FEF3C7] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-600/30 px-2.5 py-0.5 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>Recorte Semiárido
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#2563EB] dark:text-primary-300 bg-[#2563EB]/10 dark:bg-primary-950/40 border border-[#2563EB]/20 dark:border-primary-700/40 px-2.5 py-0.5 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>Volume Estadual
                  </span>
                )}
              </div>
            </div>

            {/* GRID SIMÉTRICO COM QUEBRA INTELIGENTE DE LINHA */}
            <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 min-h-0 overflow-hidden py-0.5">
              {categoriasEmpilhadasData.map((cat, idx) => (
                <div key={idx} className="flex flex-col justify-between p-2 px-2.5 rounded-xl bg-[#F8FAFC] dark:bg-surface-soft border border-[#E2E8F0]/50 dark:border-border min-h-[54px]">
                  <div className="flex items-start justify-between text-[13px] leading-tight gap-1">
                    <span className="font-extrabold text-[#1D3557] dark:text-text-primary truncate flex-1 min-w-0" title={cat.name}>
                      {cat.name}
                    </span>
                    <span className="font-bold text-[#457B9D] dark:text-text-secondary text-[12px] shrink-0">
                      <strong className="text-[#1D3557] dark:text-text-primary font-black">{cat.total}</strong> ({cat.pctTotal}%)
                    </span>
                  </div>

                  {/* BARRA */}
                  <div className="w-full h-[7px] rounded-full bg-[#E2E8F0] dark:bg-primary-950/40 overflow-hidden flex shadow-2xs my-0.5">
                    <div
                      className={`h-full transition-all duration-500 ${isSemiarido ? 'bg-[#F59E0B]' : 'bg-[#2563EB]'}`}
                      style={{ width: `${cat.pctTotal}%` }}
                      title={`${cat.name}: ${cat.total} (${cat.pctTotal}%)`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold">
                    {isSemiarido ? (
                      <>
                        <span className="text-[#B45309] dark:text-amber-300">
                          No Semiárido: <strong>{cat.total}</strong>
                        </span>
                        <span className="text-[#64748B] dark:text-text-muted">
                          <strong>{cat.pctTotal}%</strong> do recorte
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#2563EB] dark:text-primary-300">
                          Ativos no Estado: <strong>{cat.total}</strong>
                        </span>
                        <span className="text-[#64748B] dark:text-text-muted">
                          <strong>{cat.pctTotal}%</strong> do total
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRÁFICO 4: COBERTURA DE REDE RNP */}
          <div className={`bg-white dark:bg-surface rounded-[24px] p-4 border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card'} flex flex-col justify-between min-h-0 h-full overflow-hidden`}>
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] dark:border-border pb-1.5">
              <div>
                <h3 className="text-[17px] lg:text-[18px] font-bold text-[#1D3557] dark:text-text-primary flex items-center gap-1.5">
                  <Wifi size={18} className={isSemiarido ? "text-[#D97706]" : "text-[#2563EB]"} />
                  {isSemiarido ? 'Cobertura de Rede RNP no Semiárido' : 'Cobertura de Rede RNP'}
                </h3>
                <p className="text-[12px] text-[#457B9D] dark:text-text-secondary">
                  {isSemiarido
                    ? 'Campi e ICTs do Semiárido conectados à Rede'
                    : 'Campi e ICTs conectados à Rede de pesquisa na Bahia'}
                </p>
              </div>

              {/* LEGENDA */}
              <div className="flex items-center gap-2 text-[11.5px] font-bold">
                {isSemiarido ? (
                  <span className="flex items-center gap-1.5 text-[#B45309] dark:text-amber-300 bg-[#FEF3C7] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-600/30 px-2.5 py-0.5 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>Conectados no Semiárido
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#2563EB] dark:text-primary-300 bg-[#2563EB]/10 dark:bg-primary-950/40 border border-[#2563EB]/20 dark:border-primary-700/40 px-2.5 py-0.5 rounded-full">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>Conectados à RNP
                  </span>
                )}
              </div>
            </div>

            {/* LISTA PADRONIZADA: NOME + VALOR/PERCENTUAL + BARRA */}
            <div className="flex-1 flex flex-col justify-between gap-1.5 min-h-0 py-0.5">
              {rnpStackedData.map((cat, idx) => (
                <div key={idx} className="flex flex-col justify-between p-2 px-2.5 rounded-xl bg-[#F8FAFC] dark:bg-surface-soft border border-[#E2E8F0]/50 dark:border-border h-[54px]">
                  <div className="flex items-center justify-between text-[13px] leading-tight gap-1">
                    <span className="font-extrabold text-[#1D3557] dark:text-text-primary truncate flex-1 min-w-0" title={cat.name}>
                      {cat.name}
                    </span>
                    <span className="font-bold text-[#457B9D] dark:text-text-secondary text-[12px] shrink-0">
                      <strong className="text-[#1D3557] dark:text-text-primary font-black">{cat.comRnpTotal}</strong> de {cat.total} ({cat.pctTotal}%)
                    </span>
                  </div>

                  {/* BARRA DE ADESÃO À RNP */}
                  <div className="w-full h-[7px] rounded-full bg-[#E2E8F0] dark:bg-primary-950/40 overflow-hidden flex shadow-2xs my-0.5">
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

        {/* COLUNA DIREITA: SIDEMAP INTEGRADO NO MODO ATIVOS */}
        <div style={{ width: 'calc(30% - 12px)' }} className={`shrink-0 h-full bg-white dark:bg-surface rounded-[24px] border ${isSemiarido ? 'border-amber-200/50 dark:border-amber-500/30 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.06)]' : 'border-transparent dark:border-border shadow-[0_4px_20px_rgba(29,53,87,0.04)] dark:shadow-card'} hover:border-[#D6EAF8]/50 transition-all duration-300 relative overflow-hidden flex flex-col min-h-0`}>
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