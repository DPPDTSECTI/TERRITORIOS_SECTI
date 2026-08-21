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
  Cpu
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import { getDynamicAssetTypeConfig } from '../constants/assetTypes';
import SideMap from './maps/SideMap';

function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

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
  const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo' | 'categorias' | 'ranking' | 'inovacao'

  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // 1. Processamento e Normalização de Ativos com Coordenadas e Estilos
  const ativosProcessados = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];

    return ativosData.map((a, idx) => {
      const nomeTipoColuna = a.tipo || a.nome_tipo || 'Outros';
      const configEstilo = getDynamicAssetTypeConfig(nomeTipoColuna);

      const rawLat = a.latitude != null && a.latitude !== '' ? Number(a.latitude) : null;
      const rawLng = a.longitude != null && a.longitude !== '' ? Number(a.longitude) : null;

      let lat = rawLat;
      let lng = rawLng;

      if (lat == null || lng == null || isNaN(lat) || isNaN(lng) || lat === 0) {
        const munKey = String(a.municipio || '').trim();
        const fallback = MUNICIPIOS_COORDS[munKey] || MUNICIPIOS_COORDS[munKey.toLowerCase()] || [-12.9714, -38.5014];
        lat = fallback[0];
        lng = fallback[1];
      }

      return {
        id: a.id_ativo || idx + 1,
        id_territorio: a.id_territorio,
        nome: a.nome_ativo || a.sigla || 'Ativo de CT&I',
        sigla: a.sigla || '',
        tipo: nomeTipoColuna,
        idTipoAtivo: configEstilo.id,
        shortTipo: configEstilo.shortLabel,
        municipio: a.municipio || 'Bahia',
        territorio: a.territorio_identidade || a.territorio || '',
        territorio_identidade: a.territorio_identidade || a.territorio || '',
        lat,
        lng,
        icone: configEstilo.icone,
        iconSvg: configEstilo.iconSvg,
        cor: configEstilo.bgClass,
        textCor: configEstilo.textClass,
        corHex: configEstilo.corHex,
        urlReferencia: a.url_referencia || '',
        tituloReferencia: a.titulo_referencia || ''
      };
    });
  }, [ativosData]);

  // Ativos Filtrados pelo Território Selecionado
  const territoryAtivos = useMemo(() => {
    if (!ativosProcessados || ativosProcessados.length === 0) return [];
    if (!selectedTerritory) return ativosProcessados;
    
    const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
    const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

    return ativosProcessados.filter(a => {
      if (tid && String(a.id_territorio) === tid) return true;
      if (tNorm && normalizeName(a.territorio || '') === tNorm) return true;
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

  // 3. Distribuição por Tipos / Categorias de Ativos
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
          corHex: a.corHex || '#2563EB',
          icone: a.icone || Database
        };
      }
      counts[t].count += 1;
    });

    return Object.values(counts)
      .map(c => ({
        ...c,
        percent: total > 0 ? ((c.count / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count);
  }, [territoryAtivos]);

  // 4A. Ranking Territorial de Ativos
  const territoryRanking = useMemo(() => {
    if (!ativosProcessados || ativosProcessados.length === 0) return [];
    const counts = {};

    ativosProcessados.forEach(a => {
      const tid = a.id_territorio ? String(a.id_territorio) : null;
      const tName = (a.territorio || 'Outros').replace(/^Território de Identidade\s+/i, '').trim();
      const key = tid || normalizeName(tName);

      if (!counts[key]) {
        counts[key] = { id: tid, name: tName, count: 0 };
      }
      counts[key].count += 1;
    });

    const maxCount = Math.max(...Object.values(counts).map(t => t.count), 1);

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .map((t, idx) => ({
        ...t,
        rank: idx + 1,
        percentBar: Math.min(100, (t.count / maxCount) * 100)
      }));
  }, [ativosProcessados]);

  // 4B. Ranking de Municípios do Território
  const municipalityRanking = useMemo(() => {
    if (!selectedTerritory || !territoryAtivos || territoryAtivos.length === 0) return [];
    const counts = {};

    territoryAtivos.forEach(a => {
      const mun = a.municipio || 'Bahia';
      counts[mun] = (counts[mun] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        rank: idx + 1,
        percentBar: Math.min(100, (count / maxCount) * 100)
      }));
  }, [selectedTerritory, territoryAtivos]);

  // 5. Ambientes de Inovação (Hubs, Parques, Incubadoras, Aceleradoras)
  const inovacaoList = useMemo(() => {
    return territoryAtivos.filter(a => {
      const t = (a.tipo || '').toLowerCase();
      return t.includes('parque') || t.includes('hub') || t.includes('incubadora') || t.includes('aceleradora') || t.includes('dinamizador') || t.includes('fablab') || t.includes('centro');
    });
  }, [territoryAtivos]);

  // 6. Contagens Globais e por Grupo
  const totalEnsinoPesquisa = useMemo(() => {
    return ativosProcessados.filter(a => {
      const t = (a.tipo || '').toLowerCase();
      return t.includes('universidade') || t.includes('faculdade') || t.includes('instituto federal') || t.includes('ict') || t.includes('pesquisa');
    }).length;
  }, [ativosProcessados]);

  const totalInovacao = useMemo(() => {
    return ativosProcessados.filter(a => {
      const t = (a.tipo || '').toLowerCase();
      return t.includes('parque') || t.includes('hub') || t.includes('incubadora') || t.includes('aceleradora') || t.includes('dinamizador');
    }).length;
  }, [ativosProcessados]);

  const territoriosComAtivosCount = useMemo(() => {
    if (territoriosData && territoriosData.length > 0) {
      return territoriosData.filter(t => Number(t.ativos_cti || 0) > 0).length;
    }
    return territoryRanking.length;
  }, [territoriosData, territoryRanking]);

  // 7. 5 Indicadores Estratégicos (KPIs)
  const kpis = [
    { 
      label: 'Total de Ativos CT&I', 
      value: loadingStats ? '...' : ativosProcessados.length, 
      icon: Database 
    },
    { 
      label: 'Ensino & Pesquisa (ICTs)', 
      value: loadingStats ? '...' : totalEnsinoPesquisa, 
      icon: GraduationCap 
    },
    { 
      label: 'Ambientes de Inovação', 
      value: loadingStats ? '...' : totalInovacao, 
      icon: Rocket 
    },
    { 
      label: 'Territórios Cobertos', 
      value: loadingStats ? '...' : `${territoriosComAtivosCount} / ${territoriosData.length || 27}`, 
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
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'catalogo'
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
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'categorias'
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
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'ranking'
                    ? 'bg-[#1D3557] text-white shadow-xs'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                }`}
              >
                <TrendingUp size={13} />
                {selectedTerritory ? 'Ranking Municípios' : 'Ranking Territórios'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('inovacao')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'inovacao'
                    ? 'bg-[#1D3557] text-white shadow-xs'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                }`}
              >
                <Rocket size={13} />
                Inovação ({inovacaoList.length})
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
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                        selectedTipo === 'todos'
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
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                          selectedTipo === cat.name
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
                              setFocusedAsset([ativo.lat, ativo.lng]);
                            }
                          }}
                          className="bg-[#F8FAFC] hover:bg-white hover:border-[#D6EAF8] border border-transparent rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-all duration-200 group cursor-pointer"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: `${ativo.corHex || '#2563EB'}15`, color: ativo.corHex || '#2563EB' }}
                            >
                              <IconComponent size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[12px] font-extrabold text-[#1D3557] group-hover:text-[#2563EB] transition-colors leading-tight truncate">
                                  {ativo.nome}
                                </h4>
                                {ativo.sigla && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#E2E8F0] text-[#1D3557] rounded-md shrink-0">
                                    {ativo.sigla}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#457B9D] mt-0.5 font-medium">
                                <span 
                                  className="font-bold px-1.5 py-0.2 rounded-md"
                                  style={{ backgroundColor: `${ativo.corHex || '#2563EB'}12`, color: ativo.corHex || '#2563EB' }}
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

            {/* ABA 2: TIPOS & CATEGORIAS */}
            {activeTab === 'categorias' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory 
                        ? `Categorias de Ativos em ${territoryName}` 
                        : 'Classificação dos Ativos de CT&I do Estado'
                      }
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      Distribuição quantitativa e percentual por tipologia oficial
                    </p>
                  </div>
                  {selectedTerritory && (
                    <span className="text-[10px] font-bold text-[#1D3557] bg-[#D6EAF8]/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <MapPin size={11} className="text-[#2563EB]" />
                      {territoryName}
                    </span>
                  )}
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
                          className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20'
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
                                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${cat.corHex}15`, color: cat.corHex }}
                              >
                                {cat.percent}%
                              </span>
                            </div>
                          </div>

                          {/* BARRA DE PROGRESSO */}
                          <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${cat.percent}%`,
                                backgroundColor: cat.corHex
                              }}
                            ></div>
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

            {/* ABA 3: RANKING TERRITORIAL OU MUNICIPAL */}
            {activeTab === 'ranking' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory 
                        ? `Ranking de Municípios · ${territoryName}` 
                        : 'Ranking Territorial de Ativos de CT&I'
                      }
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      {selectedTerritory 
                        ? 'Concentração de infraestrutura de CT&I nos municípios deste território'
                        : 'Densidade de infraestrutura nos 27 Territórios de Identidade'
                      }
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-[#457B9D] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
                    {selectedTerritory 
                      ? `${municipalityRanking.length} municípios polo`
                      : `${territoryRanking.length} territórios com ativos`
                    }
                  </span>
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
                              setFocusedAsset(coords);
                            }
                          }}
                          className="rounded-2xl p-2.5 border bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs transition-all flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              m.rank <= 3 ? 'bg-[#1D3557] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                            }`}>
                              {m.rank}
                            </span>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[11px] font-extrabold text-[#1D3557] truncate">
                                {m.name}
                              </span>
                              <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden mt-1">
                                <div
                                  className="h-full rounded-full transition-all duration-300 bg-[#2563EB]"
                                  style={{ width: `${m.percentBar}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#2563EB] text-white shadow-2xs">
                              {m.count} {m.count === 1 ? 'ativo' : 'ativos'}
                            </span>
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
                        className="rounded-2xl p-2.5 border transition-all cursor-pointer flex items-center justify-between gap-3 bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            t.rank <= 3 ? 'bg-[#1D3557] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                          }`}>
                            {t.rank}
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[11px] font-extrabold text-[#1D3557] truncate">
                              {t.name}
                            </span>
                            <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden mt-1">
                              <div
                                className="h-full rounded-full transition-all duration-300 bg-[#2563EB]"
                                style={{ width: `${t.percentBar}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#2563EB] text-white shadow-2xs">
                            {t.count} {t.count === 1 ? 'ativo' : 'ativos'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ABA 4: AMBIENTES DE INOVAÇÃO */}
            {activeTab === 'inovacao' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory 
                        ? `Ambientes de Inovação em ${territoryName}` 
                        : 'Parques Tecnológicos, Hubs & Incubadoras'
                      }
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      Infraestruturas dedicadas à aceleração, dinamização e criação de negócios inovadores
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-2.5 py-1 rounded-full">
                    {inovacaoList.length} Ambientes Mapeados
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {inovacaoList.length > 0 ? (
                    inovacaoList.map((amb, idx) => (
                      <div
                        key={amb.id || idx}
                        onClick={() => {
                          if (amb.lat && amb.lng) {
                            setFocusedAsset([amb.lat, amb.lng]);
                          }
                        }}
                        className="bg-[#F8FAFC] hover:bg-white hover:border-[#8B5CF6]/40 border border-transparent rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all duration-200 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Rocket size={18} strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[12.5px] font-black text-[#1D3557] group-hover:text-[#8B5CF6] transition-colors truncate">
                                {amb.nome}
                              </h4>
                              {amb.sigla && (
                                <span className="bg-[#8B5CF6] text-white text-[8.5px] font-black px-1.5 py-0.2 rounded-md uppercase">
                                  {amb.sigla}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#457B9D] mt-0.5 font-medium">
                              <span className="font-bold text-[#1D3557]">{amb.shortTipo || amb.tipo}</span>
                              <span>•</span>
                              <span>{amb.municipio}</span>
                              <span>•</span>
                              <span className="text-[#64748B]">{amb.territorio}</span>
                            </div>
                          </div>
                        </div>

                        {amb.urlReferencia && (
                          <a
                            href={amb.urlReferencia}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#8B5CF6]/10 hover:bg-[#8B5CF6] text-[#8B5CF6] hover:text-white transition-all text-[10px] font-bold shrink-0"
                          >
                            <span>Visitar</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                      <Rocket size={32} className="mb-2 opacity-40 text-[#457B9D]" />
                      <p className="text-[12px] font-bold text-[#1D3557]">Nenhum ambiente de inovação registrado neste território</p>
                    </div>
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