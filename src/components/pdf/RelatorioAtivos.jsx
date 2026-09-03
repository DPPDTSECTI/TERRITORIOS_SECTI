import React, { useContext, useState, useMemo, useEffect } from 'react';
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
  ArrowLeft
} from 'lucide-react';

import { DataContext } from '../../context/DataContext';
import SideMap from '../maps/SideMap';
import StackedBarChart from '../graph/StackedBarChart';
import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';
import { getDynamicAssetTypeConfig } from '../../constants/assetTypes';

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
    loadingStats = false 
  } = useContext(DataContext);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
        semiarido: checkSemiaridoValue(rawSemiarido)
      };
    });
  }, [ativosData]);

  // 1. Filtragem dos Ativos pelo Território Selecionado
  const filteredAtivos = useMemo(() => {
    if (!ativosProcessados || ativosProcessados.length === 0) return [];
    if (!selectedTerritory) return ativosProcessados;

    const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
    const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

    return ativosProcessados.filter(a => {
      if (tid && a.id_territorio && String(a.id_territorio) === tid) return true;
      const normTerr = normalizeName(a.territorio || '');
      if (tNorm && normTerr && (normTerr === tNorm || normTerr.includes(tNorm) || tNorm.includes(normTerr))) return true;
      return false;
    });
  }, [ativosProcessados, selectedTerritory]);

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

    return {
      total,
      semiaridoCount,
      municipiosAtendidos: munSet.size,
      municipiosSemiCount: munSemiSet.size,
      territoriosAtendidos: terrSet.size,
      rnpTotal,
      rnpSemi
    };
  }, [filteredAtivos]);

  // 3. Top 10 Entidades por Sigla (Duas Bandas: 2 colunas x 5 linhas)
  const topSiglasData = useMemo(() => {
    if (!filteredAtivos || filteredAtivos.length === 0) return [];
    const map = {};

    filteredAtivos.forEach(a => {
      const sigla = a.sigla || 'OUTROS';
      if (!map[sigla]) {
        map[sigla] = { 
          sigla, 
          nome: a.nome || sigla, 
          tipo: a.shortTipo || a.tipo, 
          corHex: a.corHex || '#2563EB',
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
    <main id="pdf-report" className="flex-1 h-screen overflow-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-white select-none">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between w-full shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-black text-[#1D3557] tracking-tight">
              Relatório Executivo de Ativos de CT&I
            </h1>

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
                  title="Limpar seleção territorial"
                >
                  <X size={11} />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-[#457B9D] font-medium mt-1">
            Diagnóstico territorial e mapeamento estrutural dos ativos de ciência, tecnologia e inovação na Bahia
          </p>
        </div>
      </div>

      {/* GRID DE KPIS (h-[92px]) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch w-full">
          
          {/* KPI 1: ATIVOS MAPEADOS */}
          <div className="h-[92px] bg-white rounded-[24px] p-3.5 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-6 h-6 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB] shrink-0">
                <Building2 size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Ativos Mapeados</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[28px] lg:text-[32px] font-black text-[#1D3557] leading-none tracking-tight">
                {loadingStats ? '...' : statsKpis.total}
              </span>
              <span className="text-[9.5px] font-bold text-[#B45309] bg-[#F59E0B]/12 border border-[#F59E0B]/25 px-2 py-0.5 rounded-md whitespace-nowrap">
                {statsKpis.semiaridoCount} no semiárido
              </span>
            </div>
          </div>

          {/* KPI 2: MUNICÍPIOS COM PRESENÇA */}
          <div className="h-[92px] bg-white rounded-[24px] p-3.5 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-6 h-6 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB] shrink-0">
                <MapPin size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Municípios com Presença</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] lg:text-[32px] font-black text-[#1D3557] leading-none tracking-tight">
                  {loadingStats ? '...' : statsKpis.municipiosAtendidos}
                </span>
                <span className="text-[11px] font-bold text-[#64748B]">munic.</span>
              </div>
              <span className="text-[9.5px] font-bold text-[#B45309] bg-[#F59E0B]/12 border border-[#F59E0B]/25 px-2 py-0.5 rounded-md whitespace-nowrap">
                {statsKpis.municipiosSemiCount} no semiárido
              </span>
            </div>
          </div>

          {/* KPI 3: CONECTADOS À REDE RNP */}
          <div className="h-[92px] bg-white rounded-[24px] p-3.5 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-6 h-6 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB] shrink-0">
                <Wifi size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Ativos Conectados RNP</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[28px] lg:text-[32px] font-black text-[#1D3557] leading-none tracking-tight">
                {loadingStats ? '...' : statsKpis.rnpTotal}
              </span>
              <span className="text-[9.5px] font-bold text-[#B45309] bg-[#F59E0B]/12 border border-[#F59E0B]/25 px-2 py-0.5 rounded-md whitespace-nowrap">
                {statsKpis.rnpSemi} no semiárido
              </span>
            </div>
          </div>

          {/* KPI 4: TERRITÓRIOS COBERTOS */}
          <div className="h-[92px] bg-white rounded-[24px] p-3.5 px-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] border border-transparent">
            <div className="flex items-center gap-2 text-[#457B9D]">
              <div className="w-6 h-6 rounded-lg bg-[#D6EAF8]/70 flex items-center justify-center text-[#2563EB] shrink-0">
                <Layers size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Territórios Cobertos</span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] lg:text-[32px] font-black text-[#1D3557] leading-none tracking-tight">
                  {loadingStats ? '...' : (selectedTerritory ? '1' : statsKpis.territoriosAtendidos)}
                </span>
                <span className="text-[11px] font-bold text-[#64748B]">de 27</span>
              </div>
              <span className="text-[9.5px] font-bold text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20 px-2 py-0.5 rounded-md whitespace-nowrap">
                {selectedTerritory ? 'Território' : 'cobertura estadual'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* GRID PRINCIPAL: 4 GRÁFICOS (2x2 SIMÉTRICO) + SIDEMAP */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-0 w-full overflow-hidden">
        
        {/* COLUNA ESQUERDA: GRID 2x2 */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full min-h-0">
          
          {/* GRÁFICO 1: TOP 10 SIGLAS EM DUAS BANDAS COM NOMES COMPLETOS */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1.5">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-[13.5px] font-extrabold text-[#1D3557] flex items-center gap-1.5">
                  <ListOrdered size={15} className="text-[#2563EB] shrink-0" />
                  Top 10 Entidades por Sigla
                </h3>
                <p className="text-[10px] text-[#457B9D]">Volume de infraestruturas instaladas</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md border border-[#E2E8F0]">Total</span>
                <span className="text-[9px] font-bold text-[#B45309] bg-[#F59E0B]/15 px-2 py-0.5 rounded-md border border-[#F59E0B]/20">Semiárido</span>
              </div>
            </div>

            {/* DUAS BANDAS (2 COLUNAS x 5 LINHAS) COM QUEBRA DE LINHA LIMPA */}
            <div className="flex-1 grid grid-cols-2 gap-x-2.5 gap-y-1.5 min-h-0 overflow-hidden py-0.5 items-stretch">
              {topSiglasData.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between py-1 px-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-[9.5px] min-w-0 border border-[#E2E8F0]/40"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
                    <span 
                      className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-2xs" 
                      style={{ backgroundColor: item.corHex }}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="font-extrabold text-[12px] text-[#1D3557] truncate" title={item.nome}>
                        {item.sigla}
                      </span>
                      <span className="text-[9px] text-[#64748B] font-medium truncate leading-tight">
                        {item.tipo}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 font-extrabold">
                    <span className="text-[#1D3557] text-[10.5px] font-bold bg-white px-1.5 py-0.5 rounded-md border border-[#E2E8F0] min-w-[26px] text-center shadow-2xs">
                      {item.total}
                    </span>
                    <span className="text-[#B45309] bg-[#F59E0B]/15 border border-[#F59E0B]/20 px-1.5 py-0.5 rounded-md text-[10px] min-w-[24px] text-center font-bold">
                      {item.semiarido}
                    </span>
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
              title={selectedTerritory ? `Municípios em ${territoryName}` : 'Concentração por Território'}
              subtitle="Top 4 categorias + Outros"
              allowToggleView={false}
              showTotalLabel={true}
            />
          </div>

          {/* GRÁFICO 3: DISTRIBUIÇÃO ESTADUAL POR TIPOLOGIA (SEM RETICÊNCIAS) */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1.5">
              <div>
                <h3 className="text-[13.5px] font-extrabold text-[#1D3557] flex items-center gap-1.5">
                  <BarChart2 size={15} className="text-[#2563EB]" />
                  {selectedTerritory ? `Tipologias em ${territoryName}` : 'Distribuição Estadual por Tipologia'}
                </h3>
                <p className="text-[10px] text-[#457B9D]">Semiárido vs Outras Regiões (Top 6 Categorias)</p>
              </div>

              <div className="flex items-center gap-2.5 text-[9px] font-black">
                <span className="flex items-center gap-1 text-[#B45309]">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>Semiárido
                </span>
                <span className="flex items-center gap-1 text-[#2563EB]">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>Outras Regiões
                </span>
              </div>
            </div>

            {/* GRID SIMÉTRICO COM QUEBRA INTELIGENTE DE LINHA */}
            <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 min-h-0 overflow-hidden py-0.5">
              {categoriasEmpilhadasData.map((cat, idx) => (
                <div key={idx} className="flex flex-col justify-between p-1.5 px-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/50 min-h-[54px]">
                  <div className="flex items-start justify-between text-[10.5px] leading-tight gap-1">
                    <span className="font-extrabold text-[#1D3557] truncate flex-1 min-w-0" title={cat.name}>
                      {cat.name}
                    </span>
                    <span className="font-bold text-[#457B9D] text-[10px] shrink-0">
                      <strong className="text-[#1D3557] font-black">{cat.total}</strong> ({cat.pctTotal}%)
                    </span>
                  </div>

                  {/* BARRA EMPILHADA */}
                  <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden flex shadow-2xs my-0.5">
                    {cat.semi > 0 && (
                      <div 
                        className="h-full bg-[#F59E0B] transition-all duration-500"
                        style={{ width: `${(cat.semi / cat.total) * 100}%` }}
                        title={`Semiárido: ${cat.semi}`}
                      />
                    )}
                    {cat.fora > 0 && (
                      <div 
                        className="h-full bg-[#2563EB] transition-all duration-500"
                        style={{ width: `${(cat.fora / cat.total) * 100}%` }}
                        title={`Outras Regiões: ${cat.fora}`}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[8.5px] font-bold">
                    <span className="text-[#B45309]">
                      Semi: <strong>{cat.semi}</strong> ({cat.pctSemi}%)
                    </span>
                    <span className="text-[#2563EB]">
                      Fora: <strong>{cat.fora}</strong> ({cat.pctFora}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRÁFICO 4: COBERTURA DE REDE RNP (EMPILHADO COM COMPARAÇÃO AO SEMIÁRIDO) */}
          <div className="bg-white rounded-[24px] p-4 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col justify-between min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1.5">
              <div>
                <h3 className="text-[13.5px] font-extrabold text-[#1D3557] flex items-center gap-1.5">
                  <Wifi size={15} className="text-[#2563EB]" />
                  Cobertura de Rede RNP
                </h3>
                <p className="text-[10px] text-[#457B9D]">Campi e ICTs conectados ao backbone de pesquisa</p>
              </div>

              {/* LEGENDA DO EMPILHAMENTO */}
              <div className="flex items-center gap-2 text-[9px] font-black">
                <span className="flex items-center gap-1 text-[#B45309]">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>Semiárido
                </span>
                <span className="flex items-center gap-1 text-[#2563EB]">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>Outras Regiões
                </span>
              </div>
            </div>

            {/* LISTA PADRONIZADA: NOME + VALOR/PERCENTUAL + BARRA (SEM CORTES, TODAS AS 5 LINHAS VISÍVEIS) */}
            <div className="flex-1 flex flex-col justify-between gap-1.5 min-h-0 py-0.5">
              {rnpStackedData.map((cat, idx) => (
                <div key={idx} className="flex flex-col justify-between p-1.5 px-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/50 h-[43px]">
                  <div className="flex items-center justify-between text-[11px] leading-tight gap-2">
                    <span className="font-extrabold text-[#1D3557] truncate" title={cat.name}>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10.5px] shrink-0 font-bold text-[#457B9D]">
                      <span className="text-[#1D3557] font-black">
                        {cat.comRnpTotal} <span className="text-[#64748B] font-semibold text-[9.5px]">de {cat.total}</span>
                      </span>
                      <span className="text-[#2563EB] font-black">({cat.pctTotal}%)</span>
                    </div>
                  </div>

                  {/* BARRA EMPILHADA */}
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden flex shadow-2xs">
                    {cat.semi > 0 && (
                      <div 
                        className="h-full bg-[#F59E0B] transition-all duration-500"
                        style={{ width: `${cat.pctSemi}%` }}
                        title={`Semiárido com RNP: ${cat.semi}`}
                      />
                    )}
                    {cat.fora > 0 && (
                      <div 
                        className="h-full bg-[#2563EB] transition-all duration-500"
                        style={{ width: `${cat.pctFora}%` }}
                        title={`Outras Regiões com RNP: ${cat.fora}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: SIDEMAP INTEGRADO NO MODO ATIVOS */}
        <div style={{ width: 'calc(30% - 12px)' }} className="shrink-0 h-full bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_20px_rgba(29,53,87,0.04)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-0">
          <SideMap
            mode="ativos"
            processedAtivos={filteredAtivos}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            focusedAsset={focusedAsset}
          />
        </div>

      </div>

 </main>
 );
}