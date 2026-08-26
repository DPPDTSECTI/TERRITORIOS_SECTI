import React, { useContext, useState, useMemo } from 'react';
import {
  Database,
  Building2,
  Layers,
  MapPin,
  Search,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Filter,
  GraduationCap,
  Microscope,
  Rocket,
  Cpu,
  Network,
  Wifi
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import { municipiosDB } from '../data/municipiosDB';
import { getDynamicAssetTypeConfig } from '../constants/assetTypes';
import SideMap from './maps/SideMap';

function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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

export default function AtivosPage() {
  const {
    ativosData = [],
    territoriosData = [],
    loadingStats = false
  } = useContext(DataContext);

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [focusedAsset, setFocusedAsset] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo' | 'categorias' | 'ranking'

  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // 1. Processamento e Normalização de Ativos com Coordenadas, Territórios e Estilos
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

      const hasRnp = a.rnp === true || a.rnp === 'true' || a.rnp === 1 || a.rnp === '1' || a.rnp === 't' || a.rnp === 'T' || String(a.rnp || '').toLowerCase() === 'sim' || String(a.rnp || '').toLowerCase() === 'true';

      const id_territorio = a.id_territorio != null && a.id_territorio !== '' 
        ? Number(a.id_territorio) 
        : (munRow?.id_territorio || null);
        
      const rawTerr = a.territorio_identidade || a.territorio || munRow?.nome_territorio || '';
      const cleanTerr = rawTerr.replace(/^Território de Identidade\s+/i, '').trim();
      const normTerr = normalizeTerritoryName(cleanTerr);

      return {
        id: a.id_ativo || idx + 1,
        id_territorio,
        normTerritorio: normTerr,
        nome: a.nome_ativo || a.sigla || 'Ativo de CT&I',
        sigla: a.sigla || '',
        tipo: nomeTipoColuna,
        idTipoAtivo: configEstilo.id,
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
        rnp: hasRnp
      };
    });
  }, [ativosData]);

  // Ativos Filtrados pelo Território Selecionado
  const territoryAtivos = useMemo(() => {
    if (!ativosProcessados || ativosProcessados.length === 0) return [];
    if (!selectedTerritory) return ativosProcessados;

    const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
    const tNorm = normalizeTerritoryName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

    return ativosProcessados.filter(a => {
      if (tid && a.id_territorio && String(a.id_territorio) === tid) return true;
      if (tNorm && a.normTerritorio && (
        a.normTerritorio === tNorm || 
        a.normTerritorio.includes(tNorm) || 
        tNorm.includes(a.normTerritorio)
      )) return true;
      return false;
    });
  }, [ativosProcessados, selectedTerritory]);

  // 2. Filtragem Geral (Tipo, Busca e Território)
  const filteredAtivosList = useMemo(() => {
    let list = territoryAtivos;

    if (selectedTipo !== 'todos') {
      list = list.filter(a => a.tipo === selectedTipo || a.shortTipo === selectedTipo);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a =>
        (a.nome && a.nome.toLowerCase().includes(q)) ||
        (a.sigla && a.sigla.toLowerCase().includes(q)) ||
        (a.tipo && a.tipo.toLowerCase().includes(q)) ||
        (a.municipio && a.municipio.toLowerCase().includes(q)) ||
        (a.territorio && a.territorio.toLowerCase().includes(q))
      );
    }

    return list;
  }, [territoryAtivos, selectedTipo, searchQuery]);

  // 3. Distribuição por Tipos / Categorias de Ativos (com dados empilhados de RNP)
  const categoryStats = useMemo(() => {
    if (!territoryAtivos || territoryAtivos.length === 0) return [];
    const counts = {};
    const total = territoryAtivos.length;

    territoryAtivos.forEach(a => {
      const t = a.tipo || 'Outros';
      if (!counts[t]) {
        counts[t] = {
          name: t,
          shortName: a.shortTipo || t,
          count: 0,
          rnpCount: 0,
          corHex: a.corHex || '#3B82F6',
          icone: a.icone || Database
        };
      }
      counts[t].count += 1;
      if (a.rnp) {
        counts[t].rnpCount += 1;
      }
    });

    return Object.values(counts)
      .map(c => {
        const outrosCount = c.count - c.rnpCount;
        const rnpPercent = c.count > 0 ? (c.rnpCount / c.count) * 100 : 0;
        const outrosPercent = c.count > 0 ? (outrosCount / c.count) * 100 : 0;

        return {
          ...c,
          outrosCount,
          rnpPercent,
          outrosPercent,
          percent: total > 0 ? ((c.count / total) * 100).toFixed(1) : '0.0'
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [territoryAtivos]);

  // 4A. Ranking Territorial de Ativos (com dados empilhados de RNP)
  const territoryRanking = useMemo(() => {
    if (!ativosProcessados || ativosProcessados.length === 0) return [];
    const counts = {};

    ativosProcessados.forEach(a => {
      const tid = a.id_territorio ? String(a.id_territorio) : null;
      const tName = (a.territorio || 'Outros').replace(/^Território de Identidade\s+/i, '').trim();
      const key = tid || normalizeName(tName);

      if (!counts[key]) {
        counts[key] = { id: tid, name: tName, count: 0, rnpCount: 0 };
      }
      counts[key].count += 1;
      if (a.rnp) {
        counts[key].rnpCount += 1;
      }
    });

    const maxCount = Math.max(...Object.values(counts).map(t => t.count), 1);

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .map((t, idx) => {
        const outrosCount = t.count - t.rnpCount;
        const rnpPercent = t.count > 0 ? (t.rnpCount / t.count) * 100 : 0;
        const outrosPercent = t.count > 0 ? (outrosCount / t.count) * 100 : 0;
        return {
          ...t,
          rank: idx + 1,
          percentBar: Math.min(100, (t.count / maxCount) * 100),
          rnpPercent,
          outrosCount,
          outrosPercent
        };
      });
  }, [ativosProcessados]);

  // 4B. Ranking de Municípios do Território (com dados empilhados de RNP)
  const municipalityRanking = useMemo(() => {
    if (!selectedTerritory || !territoryAtivos || territoryAtivos.length === 0) return [];
    const counts = {};

    territoryAtivos.forEach(a => {
      const mun = a.municipio || 'Bahia';
      if (!counts[mun]) {
        counts[mun] = { count: 0, rnpCount: 0 };
      }
      counts[mun].count += 1;
      if (a.rnp) {
        counts[mun].rnpCount += 1;
      }
    });

    const maxCount = Math.max(...Object.values(counts).map(c => c.count), 1);

    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data], idx) => {
        const outrosCount = data.count - data.rnpCount;
        const rnpPercent = data.count > 0 ? (data.rnpCount / data.count) * 100 : 0;
        const outrosPercent = data.count > 0 ? (outrosCount / data.count) * 100 : 0;
        return {
          name,
          count: data.count,
          rnpCount: data.rnpCount,
          outrosCount,
          rnpPercent,
          outrosPercent,
          rank: idx + 1,
          percentBar: Math.min(100, (data.count / maxCount) * 100)
        };
      });
  }, [selectedTerritory, territoryAtivos]);

  // 5. Contagens Globais e por Grupo (Scoped para a região selecionada)
  const totalEnsinoPesquisa = useMemo(() => {
    return territoryAtivos.filter(a => {
      const t = (a.tipo || '').toLowerCase();
      return t.includes('universidade') || t.includes('faculdade') || t.includes('instituto federal') || t.includes('ict') || t.includes('pesquisa');
    }).length;
  }, [territoryAtivos]);

  const totalRnp = useMemo(() => {
    return territoryAtivos.filter(a => a.rnp).length;
  }, [territoryAtivos]);

  const territoriosComAtivosCount = useMemo(() => {
    if (territoriosData && territoriosData.length > 0) {
      return territoriosData.filter(t => Number(t.ativos_cti || 0) > 0).length;
    }
    return territoryRanking.length;
  }, [territoriosData, territoryRanking]);

  // 7. 5 Indicadores Estratégicos (KPIs com adaptação contextual à região)
  const kpis = [
    {
      label: selectedTerritory ? `Ativos em ${territoryName}` : 'Total de Ativos CT&I',
      value: loadingStats ? '...' : territoryAtivos.length,
      icon: Database
    },
    {
      label: 'Ensino & Pesquisa (ICTs)',
      value: loadingStats ? '...' : totalEnsinoPesquisa,
      icon: GraduationCap
    },
    {
      label: 'Ativos com RNP',
      value: loadingStats ? '...' : totalRnp,
      icon: Network
    },
    {
      label: selectedTerritory ? 'Municípios com Ativos' : 'Territórios Cobertos',
      value: loadingStats ? '...' : (selectedTerritory ? `${municipalityRanking.length} munic.` : `${territoriosComAtivosCount} / ${territoriosData.length || 27}`),
      icon: MapPin
    },
    {
      label: categoryStats[0] ? categoryStats[0].shortName : 'Principal Tipo',
      value: loadingStats ? '...' : (categoryStats[0] ? `${categoryStats[0].percent}%` : '-'),
      icon: Sparkles
    }
  ];

  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-5 bg-transparent font-sans w-full">

      {/* HEADER DA PÁGINA */}
      <div className="flex items-center justify-between w-full pr-[320px] shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-[#1D3557] tracking-tight">
              Módulo de Ativos de CT&I
            </h1>
            <span className="bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#2563EB]/20 flex items-center gap-1">
              <Sparkles size={12} className="text-[#2563EB]" />
              Ecossistema de Inovação da Bahia
            </span>
          </div>
          <p className="text-sm text-[#457B9D] mt-0.5 font-medium">
            Explore universidades, ICTs, parques tecnológicos, hubs e centros de pesquisa distribuídos pelo estado
          </p>
        </div>
      </div>

      {/* GRID DE KPIS COM ALINHAMENTO PROPORCIONAL AO GRID INFERIOR (5 COLUNAS) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-5 gap-3.5 items-stretch w-full">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="h-[98px] bg-white rounded-[16px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] hover:shadow-[0_8px_24px_rgba(29,53,87,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-default"
            >
              {/* LINHA SUPERIOR: ÍCONE DISCRETO + TÍTULO */}
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-[#D6EAF8]/70 text-[#457B9D] flex items-center justify-center shrink-0">
                    <kpi.icon size={14} strokeWidth={2.5} />
                  </div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider text-[#457B9D] truncate"
                    title={kpi.label}
                  >
                    {kpi.label}
                  </span>
                </div>
              </div>

              {/* LINHA INFERIOR: NÚMERO PRINCIPAL CENTRALIZADO */}
              <div className="flex items-center justify-center w-full min-w-0 pt-1">
                <span className="text-[30px] font-bold text-[#1D3557] tracking-tight leading-none text-center">
                  {kpi.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GRID PRINCIPAL: MAPA (calc(40% - 12px)) + DASHBOARD ANALÍTICO (flex-1) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]">

        {/* ========================================================================= */}
        {/* LADO ESQUERDO: MAPA DE PONTOS DE ATIVOS (ALINHADO COM 2 KPIS) */}
        {/* ========================================================================= */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.08)] transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden flex flex-col group min-h-[460px]">
          <SideMap
            mode="ativos"
            processedAtivos={ativosProcessados}
            focusedAsset={focusedAsset}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
          />
        </div>

        {/* ========================================================================= */}
        {/* LADO DIREITO: DASHBOARD ANALÍTICO & CATÁLOGO DE ATIVOS (FLEX-1) */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col gap-4 h-full min-h-0">

          {/* BARRA SUPERIOR DE NAVEGAÇÃO / ABAS E BUSCA */}
          <div className="bg-white rounded-[24px] p-3 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">

            {/* ABAS */}
            <div className="flex items-center bg-[#F1F5F9] p-1 rounded-2xl border border-[#E2E8F0] gap-1 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('catalogo')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'catalogo'
                    ? 'bg-[#1D3557] text-white shadow-xs'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                  }`}
              >
                <Database size={13} />
                Catálogo ({filteredAtivosList.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('categorias')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'categorias'
                    ? 'bg-[#1D3557] text-white shadow-xs'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                  }`}
              >
                <Filter size={13} />
                Categorias ({categoryStats.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ranking')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'ranking'
                    ? 'bg-[#1D3557] text-white shadow-xs'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                  }`}
              >
                <TrendingUp size={13} />
                {selectedTerritory ? 'Ranking Municípios' : 'Ranking Territórios'}
              </button>
            </div>

            {/* INPUT DE BUSCA */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#457B9D]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar ativo, tipo, cidade ou sigla..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#1D3557] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1D3557] text-[12px] font-bold"
                >
                  ×
                </button>
              )}
            </div>

          </div>

          {/* CONTEÚDO DA ABA SELECIONADA */}
          <div className="flex-1 bg-white rounded-[28px] border border-transparent shadow-[0_4px_24px_rgba(29,53,87,0.04)] p-5 flex flex-col min-h-0 overflow-hidden">

            {/* ABA 1: CATÁLOGO DE ATIVOS */}
            {activeTab === 'catalogo' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory ? `Ativos de CT&I em ${territoryName}` : 'Catálogo de Ativos do Estado'}
                    </h3>
                    <span className="bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black px-2 py-0.5 rounded-full">
                      {filteredAtivosList.length} ativos
                    </span>
                  </div>

                  {/* CHIPS DE FILTRAGEM RÁPIDA */}
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                    <button
                      type="button"
                      onClick={() => setSelectedTipo('todos')}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${selectedTipo === 'todos'
                          ? 'bg-[#1D3557] text-white'
                          : 'bg-[#F1F5F9] text-[#457B9D] hover:bg-[#E2E8F0]'
                        }`}
                    >
                      Todos
                    </button>
                    {categoryStats.slice(0, 3).map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setSelectedTipo(selectedTipo === cat.name ? 'todos' : cat.name)}
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${selectedTipo === cat.name
                            ? 'text-white'
                            : 'hover:opacity-80'
                          }`}
                        style={{
                          backgroundColor: selectedTipo === cat.name ? cat.corHex : `${cat.corHex}15`,
                          color: selectedTipo === cat.name ? '#ffffff' : cat.corHex
                        }}
                      >
                        {cat.shortName}
                      </button>
                    ))}
                    {selectedTerritory && (
                      <span className="text-[10.5px] font-bold text-[#1D3557] bg-[#D6EAF8]/40 px-2.5 py-1 rounded-full flex items-center gap-1 ml-1 whitespace-nowrap">
                        <MapPin size={11} className="text-[#2563EB]" />
                        {territoryName}
                      </span>
                    )}
                  </div>
                </div>

                {/* LISTAGEM SCROLLÁVEL */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {filteredAtivosList.length > 0 ? (
                    filteredAtivosList.map((ativo, idx) => {
                      const IconComponent = ativo.icone || Database;

                      return (
                        <div
                          key={ativo.id || idx}
                          onClick={() => {
                            if (ativo.lat && ativo.lng) {
                              setFocusedAsset({
                                lat: ativo.lat,
                                lng: ativo.lng,
                                id: ativo.id,
                                tipo: ativo.tipo,
                                zoom: 15,
                                ts: Date.now()
                              });
                            }
                          }}
                          className={`bg-[#F8FAFC] hover:bg-white hover:border-[#D6EAF8] border ${
                            ativo.rnp ? 'border-l-[3.5px] border-l-[#00B4D8]' : 'border-transparent'
                          } rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-all duration-200 group cursor-pointer`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: `${ativo.corHex || '#3B82F6'}15`, color: ativo.corHex || '#3B82F6' }}
                            >
                              <IconComponent size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[12px] font-extrabold text-[#1D3557] group-hover:text-[#3B82F6] transition-colors leading-tight truncate">
                                  {ativo.nome}
                                </h4>
                                {ativo.sigla && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#E2E8F0] text-[#1D3557] rounded-md shrink-0">
                                    {ativo.sigla}
                                  </span>
                                )}
                                {ativo.rnp && (
                                  <span 
                                    className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 bg-[#00B4D8]/15 text-[#0096C7] border border-[#00B4D8]/30 rounded-md shrink-0 shadow-2xs"
                                    title="Ponto de Presença / Conexão RNP"
                                  >
                                    <Network size={10} className="text-[#00B4D8] shrink-0" />
                                    <span>RNP</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#457B9D] mt-0.5 font-medium">
                                <span
                                  className="font-bold px-1.5 py-0.2 rounded-md"
                                  style={{ backgroundColor: `${ativo.corHex || '#3B82F6'}12`, color: ativo.corHex || '#3B82F6' }}
                                >
                                  {ativo.shortTipo || ativo.tipo}
                                </span>
                                <span>•</span>
                                <span>{ativo.municipio}</span>
                                <span>•</span>
                                <span className="text-[#64748B]">{ativo.territorio}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {ativo.urlReferencia && (
                              <a
                                href={ativo.urlReferencia}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#2563EB]/10 hover:bg-[#2563EB] text-[#2563EB] hover:text-white transition-all text-[10px] font-bold shrink-0"
                                title="Acessar Página / Informações"
                              >
                                <span>Acessar</span>
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                      <Database size={32} className="mb-2 opacity-40 text-[#457B9D]" />
                      <p className="text-[12px] font-bold text-[#1D3557]">Nenhum ativo encontrado</p>
                      <p className="text-[10px] mt-1 text-[#457B9D]">Tente ajustar o termo de busca ou filtros de tipo.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 2: TIPOS & CATEGORIAS (BARRAS EMPILHADAS COM RNP) */}
            {activeTab === 'categorias' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory
                        ? `Categorias de Ativos em ${territoryName}`
                        : 'Classificação dos Ativos de CT&I do Estado'
                      }
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      Distribuição quantitativa e proporção com conexão à rede RNP por tipologia oficial
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* LEGENDA BARRAS EMPILHADAS */}
                    <div className="flex items-center gap-2.5 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-full text-[9.5px] font-bold shadow-2xs">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00B4D8]"></span>
                        <span className="text-[#0096C7]">Com RNP</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                        <span className="text-[#2563EB]">Demais Ativos</span>
                      </div>
                    </div>

                    {selectedTerritory && (
                      <span className="text-[10px] font-bold text-[#1D3557] bg-[#D6EAF8]/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <MapPin size={11} className="text-[#3B82F6]" />
                        {territoryName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0">
                  {categoryStats.length > 0 ? (
                    categoryStats.map((cat) => {
                      const isSelected = selectedTipo === cat.name;
                      const IconComponent = cat.icone || Database;

                      return (
                        <div
                          key={cat.name}
                          onClick={() => setSelectedTipo(isSelected ? 'todos' : cat.name)}
                          className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${isSelected
                              ? 'bg-white border-[#3B82F6] shadow-md ring-2 ring-[#3B82F6]/20'
                              : 'bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${cat.corHex}20`, color: cat.corHex }}
                              >
                                <IconComponent size={12} />
                              </div>
                              <span className="text-[12px] font-extrabold text-[#1D3557] truncate">
                                {cat.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-black text-[#1D3557]">
                                {cat.count} {cat.count === 1 ? 'ativo' : 'ativos'}
                              </span>
                              <span
                                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#2563EB]"
                                title={`${cat.percent}% do total de ativos`}
                              >
                                {cat.percent}%
                              </span>
                              {cat.rnpCount > 0 && (
                                <span
                                  className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#00B4D8]/15 text-[#0096C7] border border-[#00B4D8]/25 shadow-2xs"
                                  title={`${cat.rnpCount} de ${cat.count} ativo(s) com conexão RNP (${cat.rnpPercent.toFixed(1)}%)`}
                                >
                                  {cat.rnpCount} RNP ({cat.rnpPercent % 1 === 0 ? cat.rnpPercent.toFixed(0) : cat.rnpPercent.toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* BARRA DE PROGRESSO EMPILHADA */}
                          <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden relative">
                            <div
                              className="h-full flex rounded-full overflow-hidden transition-all duration-500"
                              style={{ width: `${cat.percent}%` }}
                            >
                              {cat.rnpCount > 0 && (
                                <div
                                  className="h-full bg-[#00B4D8] transition-all duration-300"
                                  style={{ width: `${cat.rnpPercent}%` }}
                                  title={`${cat.name}: ${cat.rnpCount} com RNP (${cat.rnpPercent.toFixed(0)}%)`}
                                ></div>
                              )}
                              {cat.outrosCount > 0 && (
                                <div
                                  className="h-full bg-[#3B82F6] transition-all duration-300"
                                  style={{ width: `${cat.outrosPercent}%` }}
                                  title={`${cat.name}: ${cat.outrosCount} demais (${cat.outrosPercent.toFixed(0)}%)`}
                                ></div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                      <Filter size={28} className="mb-2 opacity-40 text-[#457B9D]" />
                      <p className="text-[12px] font-bold text-[#1D3557]">Nenhum ativo registrado neste território</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 3: RANKING TERRITORIAL OU MUNICIPAL (BARRAS EMPILHADAS COM RNP) */}
            {activeTab === 'ranking' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory
                        ? `Ranking de Municípios · ${territoryName}`
                        : 'Ranking Territorial de Ativos de CT&I'
                      }
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      {selectedTerritory
                        ? 'Distribuição de ativos e proporção com conexão à rede RNP nos municípios'
                        : 'Densidade de infraestrutura e proporção com conexão RNP nos 27 Territórios'
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* LEGENDA BARRAS EMPILHADAS */}
                    <div className="flex items-center gap-2.5 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-full text-[9.5px] font-bold shadow-2xs">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00B4D8]"></span>
                        <span className="text-[#0096C7]">Com RNP</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                        <span className="text-[#2563EB]">Demais Ativos</span>
                      </div>
                    </div>

                    {selectedTerritory ? (
                      <button
                        type="button"
                        onClick={() => setSelectedTerritory(null)}
                        className="text-[10px] font-extrabold text-[#0284C7] hover:text-[#0369A1] hover:underline bg-[#D6EAF8]/50 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer"
                      >
                        ← Ver Todos os Territórios
                      </button>
                    ) : (
                      <span className="text-[10px] font-black text-[#457B9D] bg-[#F1F5F9] px-2.5 py-1 rounded-full shrink-0">
                        {territoryRanking.length} territórios
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {selectedTerritory ? (
                    municipalityRanking.length > 0 ? (
                      municipalityRanking.map((m) => (
                        <div
                          key={m.name}
                          onClick={() => {
                            const munKey = String(m.name || '').trim();
                            const coords = MUNICIPIOS_COORDS[munKey] || MUNICIPIOS_COORDS[munKey.toLowerCase()];
                            if (coords) {
                              setFocusedAsset({
                                lat: coords[0],
                                lng: coords[1],
                                zoom: 12,
                                ts: Date.now()
                              });
                            }
                          }}
                          className="rounded-2xl p-2.5 border bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${m.rank <= 3 ? 'bg-[#1D3557] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                              }`}>
                              {m.rank}
                            </span>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[11px] font-extrabold text-[#1D3557] truncate">
                                {m.name}
                              </span>

                              {/* BARRA EMPILHADA */}
                              <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden mt-1.5 relative">
                                <div
                                  className="h-full flex rounded-full overflow-hidden transition-all duration-500"
                                  style={{ width: `${m.percentBar}%` }}
                                >
                                  {m.rnpCount > 0 && (
                                    <div
                                      className="h-full bg-[#00B4D8] transition-all duration-300"
                                      style={{ width: `${m.rnpPercent}%` }}
                                      title={`${m.name}: ${m.rnpCount} ativo(s) com RNP (${m.rnpPercent.toFixed(0)}%)`}
                                    ></div>
                                  )}
                                  {m.outrosCount > 0 && (
                                    <div
                                      className="h-full bg-[#3B82F6] transition-all duration-300"
                                      style={{ width: `${m.outrosPercent}%` }}
                                      title={`${m.name}: ${m.outrosCount} demais ativo(s) (${m.outrosPercent.toFixed(0)}%)`}
                                    ></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#3B82F6] text-white shadow-2xs"
                              title={`Total: ${m.count} ativo(s)`}
                            >
                              {m.count} {m.count === 1 ? 'ativo' : 'ativos'}
                            </span>
                            {m.rnpCount > 0 && (
                              <span
                                className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#00B4D8]/15 text-[#0096C7] border border-[#00B4D8]/25 shadow-2xs"
                                title={`${m.rnpCount} de ${m.count} ativo(s) com conexão RNP (${m.rnpPercent.toFixed(1)}%)`}
                              >
                                {m.rnpCount} RNP ({m.rnpPercent % 1 === 0 ? m.rnpPercent.toFixed(0) : m.rnpPercent.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                        <MapPin size={28} className="mb-2 opacity-40 text-[#457B9D]" />
                        <p className="text-[12px] font-bold text-[#1D3557]">Nenhum ativo registrado neste território</p>
                      </div>
                    )
                  ) : (
                    territoryRanking.map((t) => (
                      <div
                        key={t.id || t.name}
                        onClick={() => {
                          const found = territoriosData.find(x => String(x.id_territorio) === String(t.id) || normalizeName(x.territorio) === normalizeName(t.name));
                          setSelectedTerritory(found || { id_territorio: t.id, nome_territorio: t.name });
                        }}
                        className="rounded-2xl p-2.5 border transition-all cursor-pointer flex items-center justify-between gap-3 bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${t.rank <= 3 ? 'bg-[#1D3557] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                            }`}>
                            {t.rank}
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[11px] font-extrabold text-[#1D3557] truncate">
                              {t.name}
                            </span>

                            {/* BARRA EMPILHADA */}
                            <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden mt-1.5 relative">
                              <div
                                className="h-full flex rounded-full overflow-hidden transition-all duration-500"
                                style={{ width: `${t.percentBar}%` }}
                              >
                                {t.rnpCount > 0 && (
                                  <div
                                    className="h-full bg-[#00B4D8] transition-all duration-300"
                                    style={{ width: `${t.rnpPercent}%` }}
                                    title={`${t.name}: ${t.rnpCount} ativo(s) com RNP (${t.rnpPercent.toFixed(0)}%)`}
                                  ></div>
                                )}
                                {t.outrosCount > 0 && (
                                  <div
                                    className="h-full bg-[#3B82F6] transition-all duration-300"
                                    style={{ width: `${t.outrosPercent}%` }}
                                    title={`${t.name}: ${t.outrosCount} demais ativo(s) (${t.outrosPercent.toFixed(0)}%)`}
                                  ></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#3B82F6] text-white shadow-2xs"
                            title={`Total: ${t.count} ativo(s)`}
                          >
                            {t.count} {t.count === 1 ? 'ativo' : 'ativos'}
                          </span>
                          {t.rnpCount > 0 && (
                            <span
                              className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#00B4D8]/15 text-[#0096C7] border border-[#00B4D8]/25 shadow-2xs"
                              title={`${t.rnpCount} de ${t.count} ativo(s) com conexão RNP (${t.rnpPercent.toFixed(1)}%)`}
                            >
                              {t.rnpCount} RNP ({t.rnpPercent % 1 === 0 ? t.rnpPercent.toFixed(0) : t.rnpPercent.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </main>
  );
}