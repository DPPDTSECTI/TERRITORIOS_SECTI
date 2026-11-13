import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  X,
  BookOpen,
  Layers,
  BarChart3,
  Wifi,
  Award,
  Sun,
  Moon,
  GraduationCap,
  Database,
  Sparkles
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
import { useTheme } from '../../context/ThemeContext';
import SideMap from '../maps/SideMap';
import ProportionBarChart from '../graph/ProportionBarChart';
import StackedBarChart from '../graph/StackedBarChart';
import { municipiosDB } from '../../data/municipiosDB';
import { isMunicipioSemiarido, SEMIARIDO_TOTAL_MUNICIPIOS, BAHIA_TOTAL_MUNICIPIOS } from '../../constants/semiarido';
import { useReactToPrint } from 'react-to-print';
import { REPORT_PRINT_PAGE_STYLE, prepareReportForPrint, printWithCanvasSync } from '../../utils/reportPrint';
import { getSemanticColors, LIGHT_CHART_PALETTE } from '../graph/chartTheme';

const PALETTE = LIGHT_CHART_PALETTE;

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

const initialPdfEnsinoSemantic = getSemanticColors();
const ENSINO_CATEGORIES = [
  { key: 'federal', label: 'Univ. Pública Federal', shortLabel: 'Federal', colorHex: initialPdfEnsinoSemantic.primaryNavy },
  { key: 'estadual', label: 'Univ. Pública Estadual', shortLabel: 'Estadual', colorHex: initialPdfEnsinoSemantic.primaryBase },
  { key: 'ifba', label: 'Instituto Federal', shortLabel: 'IF', colorHex: initialPdfEnsinoSemantic.success },
  { key: 'privada', label: 'Univ. Privada', shortLabel: 'Privada', colorHex: initialPdfEnsinoSemantic.warning }
];

export default function RelatorioEnsinoPage() {
  const { isDark, toggleTheme } = useTheme();
  const {
    ativosData = [],
    cursosData = [],
    territoriosData = [],
    loadingStats = false,
    filtroSemiarido,
    setFiltroSemiarido
  } = useContext(DataContext);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reportMode = searchParams.has('modo')
    ? searchParams.get('modo')
    : (filtroSemiarido ? 'semiarido' : 'normal');
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

  // React-to-print: referência do relatório 1920x1080 para renderização e impressão nativa
  const contentRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `relatorio_cursos_${isSemiarido ? 'semiarido' : (selectedTerritory ? territoryName : 'bahia')}`,
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
    if ((autoPrint === '1' || autoPrint === 'true') && !loadingStats && (territoriosData && territoriosData.length > 0)) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [searchParams, loadingStats, handlePrint, territoriosData]);

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

  const semiaridoCursosCount = useMemo(() => {
    return filteredCursos.filter(c => c.semiarido === true).length;
  }, [filteredCursos]);

  // 5. Indicadores Executivos (KPIs)
  const statsCursosKpis = useMemo(() => {
    const totalCursos = filteredCursos.length;
    const totalCampi = filteredAtivos.length;
    const campiSemiaridoCount = filteredAtivos.filter(a => a.semiarido === true).length;

    const munSet = new Set();
    const munSemiSet = new Set();
    const terrSet = new Set();
    const iesSet = new Set();
    const areaCounts = {};

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

      const iesNome = c.sigla ? String(c.sigla).trim().toUpperCase() : String(c.entidade || c.instituicao || '').trim();
      if (iesNome) iesSet.add(iesNome);

      const areaName = formatAreaConhecimento(c.categoria || c.tipo || 'Outras Áreas');
      areaCounts[areaName] = (areaCounts[areaName] || 0) + 1;
    });

    let topArea = null;
    let maxAreaCount = 0;
    Object.entries(areaCounts).forEach(([name, count]) => {
      if (count > maxAreaCount) {
        maxAreaCount = count;
        topArea = {
          name,
          count,
          percent: totalCursos > 0 ? ((count / totalCursos) * 100).toFixed(0) : '0'
        };
      }
    });

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
      totalIesUnicas: iesSet.size,
      topArea,
      campiRnpCount,
      rnpTaxa,
      campiRnpSemiCount
    };
  }, [filteredCursos, filteredAtivos, semiaridoCursosCount, isSemiarido, selectedTerritory, totalCursosBahia, totalCampiBahia, territoriosData]);

  // 6. Dados para o ProportionBarChart: Áreas de Conhecimento (Pública vs Privada)
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

  // 7. Dados para o StackedBarChart: Territórios Empilhados por Natureza de Ensino
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

  // 8. Gráfico 3: Matriz de Distribuição por Área e Natureza Jurídica
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

  // 9. Cobertura RNP dos Campi por Categoria para o ProportionBarChart
  const rnpStackedData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const stats = {};

    filteredAtivos.forEach(a => {
      const rawTipo = (a.tipo || a.nome_tipo || 'Outros').replace(/^Campi\s+/i, '');
      const tipo = getTipoPadronizado(rawTipo);
      if (!stats[tipo]) {
        stats[tipo] = {
          label: tipo,
          positive: 0,
          negative: 0,
          total: 0
        };
      }

      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || String(a.rnp || '').toLowerCase() === 'sim';
      if (hasRnp) {
        stats[tipo].positive += 1;
      } else {
        stats[tipo].negative += 1;
      }
      stats[tipo].total += 1;
    });

    return Object.values(stats)
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [filteredAtivos]);

  // Configuração dos 5 KPIs unificada
  // Configuração dos 5 KPIs idêntica ao CursosPage.jsx
  const kpiCards = [
    {
      label: isSemiarido
        ? (selectedTerritory ? `Cursos no Semiárido · ${territoryName}` : 'Cursos CT&I no Semiárido')
        : (selectedTerritory ? `Cursos em ${territoryName}` : 'Cursos Presenciais de CT&I'),
      value: loadingStats ? '...' : statsCursosKpis.totalCursos,
      percent: isSemiarido ? `${statsCursosKpis.pctCursosBahia}% do total` : null,
      icon: GraduationCap,
      isHero: true
    },
    {
      label: isSemiarido ? 'Territórios com Oferta (Semiárido)' : 'Territórios com Oferta',
      value: loadingStats
        ? '...'
        : (isSemiarido
            ? `${statsCursosKpis.territoriosComCursos} territórios`
            : `${statsCursosKpis.territoriosComCursos} / ${territoriosData.length || 27}`),
      percent: null,
      icon: MapPin,
      isHero: false
    },
    {
      label: isSemiarido ? 'IES com Oferta no Semiárido' : 'Instituições Ofertantes',
      value: loadingStats ? '...' : statsCursosKpis.totalIesUnicas,
      percent: null,
      icon: Building2,
      isHero: false
    },
    {
      label: isSemiarido ? 'Municípios com Oferta' : 'Cursos no Semiárido',
      value: loadingStats
        ? '...'
        : (isSemiarido ? `${statsCursosKpis.municipiosComCursos} munic.` : statsCursosKpis.semiaridoCount),
      percent: null,
      icon: Database,
      isHero: false
    },
    {
      label: statsCursosKpis.topArea
        ? (isSemiarido ? `Principal: ${statsCursosKpis.topArea.name}` : statsCursosKpis.topArea.name)
        : 'Principal Área',
      value: loadingStats ? '...' : (statsCursosKpis.topArea ? `${statsCursosKpis.topArea.percent}%` : '-'),
      percent: null,
      icon: Sparkles,
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

      {/* CABEÇALHO */}
      <header className="flex items-center justify-between w-full shrink-0 relative z-10">
        <div>
          <h1 className="text-headline font-bold text-text-primary tracking-tight leading-none">
            Relatório Executivo de Ensino Superior em CT&amp;I
          </h1>
          <p className="text-body-sm text-text-secondary mt-1 font-medium">
            {isSemiarido
              ? 'Diagnóstico territorial da oferta presencial de ensino superior em CT&I nos 278 municípios do Semiárido'
              : 'Diagnóstico territorial exclusivo da oferta presencial de ensino superior voltada a CT&I na Bahia'}
          </p>
          <div className={`divider-territorial w-56 mt-3 ${isSemiarido ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-transparent' : ''}`} />
        </div>
      </header>

      {/* GRID DE KPIS UNIFICADO (5 CARDS NO PADRÃO DO CURSOSPAGE.JSX) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 items-stretch w-full">
          {kpiCards.map((kpi, index) => {
            const isHero = kpi.isHero;
            const IconComp = kpi.icon;

            return (
              <div
                key={index}
                className={`p-4 sm:p-5 flex flex-col justify-between h-[100px] min-h-[100px] max-h-[100px] rounded-card cursor-default overflow-hidden select-none ${
                  isHero
                    ? (isSemiarido
                        ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white border border-amber-400/50 shadow-sm'
                        : 'bg-gradient-brand text-white border border-primary-500/40 shadow-xs')
                    : (isSemiarido
                        ? 'bg-white/90 dark:bg-zinc-900/90 border border-amber-200/70 dark:border-amber-700/35 shadow-2xs text-text-primary'
                        : 'bg-surface-soft border border-border/70 text-text-primary')
                }`}
              >
                {/* LINHA SUPERIOR: LABEL + ÍCONE CIRCULAR À DIREITA */}
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                  <span
                    className={`text-[13px] font-medium leading-tight truncate ${
                      isHero
                        ? (isSemiarido ? 'text-amber-100' : 'text-white/85')
                        : (isSemiarido ? 'text-amber-900/85 dark:text-amber-200/90' : 'text-text-secondary')
                    }`}
                    title={kpi.label}
                  >
                    {kpi.label}
                  </span>

                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                      isHero
                        ? 'bg-white/15 text-white border border-white/20 shadow-2xs'
                        : (isSemiarido
                            ? 'bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300/70 dark:border-amber-600/50 text-amber-700 dark:text-amber-300 shadow-2xs'
                            : 'bg-surface border border-border/80 text-text-secondary shadow-2xs')
                    }`}
                  >
                    <IconComp size={15} strokeWidth={2} />
                  </div>
                </div>

                {/* LINHA INFERIOR: VALOR GRANDE + PERCENTUAL OPCIONAL NO SEMIÁRIDO */}
                <div className="flex items-baseline justify-between gap-2 w-full min-w-0 pt-0.5">
                  <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
                    <span
                      className={`text-[28px] sm:text-[30px] font-bold tracking-tight leading-none shrink-0 tnum ${
                        isHero
                          ? 'text-white'
                          : (isSemiarido ? 'text-amber-950 dark:text-amber-100' : 'text-text-primary')
                      }`}
                    >
                      {kpi.value}
                    </span>

                    {isSemiarido && kpi.percent && (
                      <span
                        className={`text-caption font-semibold tabular-nums truncate shrink-0 ${
                          isHero ? 'text-white/80' : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
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

      {/* GRID PRINCIPAL: SIDEMAP À ESQUERDA (30%) + 4 GRÁFICOS (2x2 À DIREITA) — PADRÃO DO PAINEL */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 relative z-10 min-h-0 w-full overflow-hidden">

        {/* COLUNA ESQUERDA: SIDEMAP INTEGRADO */}
        <div style={{ width: 'calc(30% - 12px)' }} className={`shrink-0 h-full bg-surface rounded-card border shadow-card relative overflow-hidden flex flex-col min-h-0 ${
          isSemiarido
            ? 'border-amber-400/60 dark:border-amber-500/40 ring-1 ring-amber-400/20 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.12)]'
            : 'border-border'
        }`}>
          <SideMap
            key={`map-cursos-${isSemiarido ? 'semi' : 'normal'}-${selectedTerritory?.id_territorio || 'all'}`}
            mode="cursos"
            cursosData={filteredCursos}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            filtroSemiarido={isSemiarido}
            hideLayerControls={true}
          />
        </div>

        {/* COLUNA DIREITA: GRID 2x2 */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full min-h-0">

          {/* GRÁFICO 1: ÁREAS DE CONHECIMENTO (PROPORTIONBARCHART NATIVO) */}
          <div className="h-full min-h-0 overflow-hidden flex flex-col">
            <ProportionBarChart
              isVisaoGeral={true}
              isSemiarido={isSemiarido}
              data={areasProportionData.slice(0, 5)}
              title={isSemiarido ? "Áreas no Semiárido" : "Áreas de Conhecimento"}
              subtitle={isSemiarido ? "Proporção de Ensino Público vs Privado no Semiárido" : "Proporção de Ensino Público vs Privado na Bahia"}
              positiveLabel="Rede Pública"
              negativeLabel="Rede Privada"
              positiveColor={isSemiarido ? "bg-amber-600" : "bg-primary-600"}
              negativeColor={isSemiarido ? "bg-amber-500/15" : "bg-border"}
              positiveTextColor={isSemiarido ? "text-amber-700 dark:text-amber-300" : "text-primary-700 dark:text-primary-300"}
              negativeTextColor={isSemiarido ? "text-amber-800 dark:text-amber-300" : "text-text-secondary"}
            />
          </div>

          {/* GRÁFICO 2: CONCENTRAÇÃO POR TERRITÓRIO (STACKED BARCHART) */}
          <div className="h-full min-h-0 overflow-hidden">
            {selectedTerritory ? (
              <div className={`bg-surface rounded-card p-4 border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} flex flex-col justify-between h-full min-h-0 shadow-card`}>
                <div className="flex items-start justify-between mb-1.5 shrink-0">
                  <div className="flex flex-col min-w-0">
                    <h2 className="text-text-primary font-semibold text-subtitle tracking-tight truncate">Polos de Oferta</h2>
                    <p className="text-text-muted text-caption font-medium mt-0.5 truncate">Cidades com mais cursos em {territoryName}</p>
                  </div>
                  <BarChart3 size={16} className={isSemiarido ? "text-amber-600" : "text-primary-600"} />
                </div>
                <div className="w-full h-px bg-border/70 mb-2 shrink-0" />
                <div className="flex-1 w-full min-h-0 pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMunicipiosData} layout="vertical" margin={{ left: 5, right: 28, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 11, fill: isDark ? getSemanticColors(true).border : getSemanticColors(false).primaryNavy, fontWeight: 600 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: getSemanticColors(isDark).slateSurface, borderRadius: '8px', border: `1px solid ${getSemanticColors(isDark).border}`, color: getSemanticColors(isDark).textPrimary, fontSize: '12px', fontWeight: 'bold' }} />
                      <Bar dataKey="count" fill={isSemiarido ? getSemanticColors(isDark).warningDeep : getSemanticColors(isDark).primaryBase} radius={[0, 8, 8, 0]}>
                        {topMunicipiosData.map((_, index) => (
                          <Cell key={`cell-bar-${index}`} fill={isSemiarido ? getSemanticColors(isDark).warningDeep : PALETTE[index % PALETTE.length]} />
                        ))}
                        <LabelList dataKey="count" position="insideRight" fill={getSemanticColors().white} fontSize={11} fontWeight={700} offset={8} />
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
                subtitle={isSemiarido ? "Territórios do Semiárido líderes em cursos" : "Top 10 Territórios da Bahia por Rede de Ensino"}
                allowToggleView={false}
                showTopBadge={false}
                isSemiarido={isSemiarido}
              />
            )}
          </div>

          {/* GRÁFICO 3: COMPOSIÇÃO POR ÁREA E REDE (PÍLULAS PROPORCIONAIS MULTI-SEGMENTO) */}
          <div className={`bg-surface rounded-card p-4 border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} flex flex-col justify-between min-h-0 h-full overflow-hidden shadow-card`}>
            <div className="flex items-start justify-between mb-1 shrink-0">
              <div className="flex flex-col min-w-0">
                <h2 className="text-text-primary font-semibold text-subtitle tracking-tight truncate">
                  {isSemiarido ? "Composição por Rede no Semiárido" : "Composição por Área e Rede"}
                </h2>
                <p className="text-text-muted text-caption font-medium mt-0.5 truncate">
                  Distribuição Federal, Estadual, IF e Privada
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10.5px] font-semibold shrink-0 pt-0.5">
                <span className="flex items-center gap-1 text-text-secondary"><span className="w-2 h-2 rounded-full bg-primary-900"></span>Fed.</span>
                <span className="flex items-center gap-1 text-text-secondary"><span className="w-2 h-2 rounded-full bg-primary-600"></span>Est.</span>
                <span className="flex items-center gap-1 text-text-secondary"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>IF</span>
                <span className="flex items-center gap-1 text-text-secondary"><span className="w-2 h-2 rounded-full bg-warning-500"></span>Priv.</span>
              </div>
            </div>

            <div className="w-full h-px bg-border/70 mb-1.5 shrink-0" />

            <div className="flex-1 flex flex-col justify-between gap-1.5 min-h-0 my-auto py-0.5">
              {matrixAreaNaturezaData.slice(0, 5).map((row, idx) => {
                const segments = [
                  { key: 'privada', label: 'Priv', name: 'Privada', count: row.privada, color: 'bg-warning-500' },
                  { key: 'federal', label: 'Fed', name: 'Federal', count: row.federal, color: 'bg-primary-900' },
                  { key: 'estadual', label: 'Est', name: 'Estadual', count: row.estadual, color: 'bg-primary-600' },
                  { key: 'ifba', label: 'IF', name: 'IF', count: row.ifba, color: 'bg-emerald-500' },
                ]
                  .filter(s => s.count > 0)
                  .sort((a, b) => b.count - a.count);

                return (
                  <div key={idx} className="flex flex-col gap-0.5 w-full">
                    <div className="flex items-center justify-between text-caption leading-tight px-0.5">
                      <span className="font-semibold text-text-primary truncate flex-1 min-w-0" title={row.categoria}>
                        {row.categoria}
                      </span>
                      <span className="font-semibold text-text-primary text-caption shrink-0 tabular-nums">
                        {row.total} <span className="font-normal text-text-muted text-[11px]">cursos</span>
                      </span>
                    </div>

                    {/* BARRA DE PÍLULA PROPORCIONAL MULTI-SEGMENTO */}
                    <div className="w-full h-[22px] rounded-full bg-surface-sunken border border-border/80 overflow-hidden flex shadow-2xs">
                      {segments.map(seg => (
                        <div
                          key={seg.key}
                          className={`h-full ${seg.color} transition-all duration-500 flex items-center justify-center px-1.5 min-w-[20px]`}
                          style={{ width: `${(seg.count / row.total) * 100}%` }}
                          title={`${seg.name}: ${seg.count} (${((seg.count / row.total) * 100).toFixed(1)}%)`}
                        >
                          {(seg.count / row.total) > 0.12 && (
                            <span className="text-[10px] font-bold text-white tabular-nums leading-none">
                              {seg.count}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GRÁFICO 4: COBERTURA DE REDE RNP (PROPORTIONBARCHART NATIVO) */}
          <div className="h-full min-h-0 overflow-hidden flex flex-col">
            <ProportionBarChart
              isVisaoGeral={true}
              isSemiarido={isSemiarido}
              data={rnpStackedData}
              title={isSemiarido ? "Infraestrutura RNP · Semiárido" : "Cobertura de Rede RNP"}
              subtitle={isSemiarido ? "Campi do Semiárido conectados à RNP" : "Campi conectados ao backbone de pesquisa"}
              positiveLabel="Com RNP"
              negativeLabel="Sem RNP"
              positiveColor={isSemiarido ? "bg-amber-600" : "bg-primary-600"}
              negativeColor={isSemiarido ? "bg-amber-500/15" : "bg-primary-100"}
              positiveTextColor={isSemiarido ? "text-amber-700 dark:text-amber-300" : "text-primary-700 dark:text-primary-300"}
              negativeTextColor={isSemiarido ? "text-amber-800 dark:text-amber-300" : "text-primary-700 dark:text-primary-300"}
            />
          </div>

        </div>

      </div>

    </main>
  );
}
