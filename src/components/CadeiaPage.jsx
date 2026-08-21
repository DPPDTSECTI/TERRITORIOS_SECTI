import React, { useContext, useState, useMemo } from 'react';
import { 
  GitPullRequest, 
  Award, 
  Layers, 
  MapPin, 
  Search, 
  Flame, 
  TrendingUp, 
  Sparkles, 
  ExternalLink,
  Filter,
  Check,
  Building,
  Wheat
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import SideMap, { getCadeiasHeatColor } from './maps/SideMap';

const SEGMENT_PALETTE = [
  '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', 
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', 
  '#A855F7', '#E11D48', '#0EA5E9', '#D97706'
];

const APL_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22 12 12"/><path d="M7 17a5 5 0 0 1 5-5"/><path d="M12 12a5 5 0 0 1 5-5"/><path d="M17 7a5 5 0 0 1 5-5"/></svg>`;
const IG_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`;

function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export default function CadeiaPage() {
  const { 
    listaCadeias = [], 
    municipiosTerritorios = [], 
    territoriosData = [], 
    kpisGlobais = {}, 
    loadingStats = false 
  } = useContext(DataContext);

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [focusedAsset, setFocusedAsset] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState('todos'); // 'todos' | 'APL' | 'IG'
  const [selectedSegmento, setSelectedSegmento] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo' | 'segmentos' | 'ranking' | 'igs'

  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // 1. Enriquecimento de Dados com Municípios, Coordenadas e Territórios
  const enrichedCadeias = useMemo(() => {
    if (!listaCadeias || listaCadeias.length === 0) return [];

    const munMapById = {};
    const munMapByName = {};
    (municipiosTerritorios || []).forEach(m => {
      munMapById[m.id_municipio] = m;
      if (m.nome_municipio) munMapByName[normalizeName(m.nome_municipio)] = m;
    });

    return listaCadeias.map((c, idx) => {
      let info = (c.id_municipio && munMapById[c.id_municipio]) || (c.municipio_sede && munMapByName[normalizeName(c.municipio_sede)]);
      
      let id_territorio = info ? info.id_territorio : null;
      let territorio_identidade = info ? info.nome_territorio : null;

      // Tratamento para IGs regionais sem município sede unitário
      if (!id_territorio) {
        const str = `${c.entidade || ''} ${c.segmento || ''}`.toLowerCase();
        if (str.includes('são francisco') || str.includes('juazeiro') || str.includes('vinho')) {
          id_territorio = 21;
          territorio_identidade = 'Sertão do São Francisco';
        } else if (str.includes('diamantina') || str.includes('abaíra')) {
          id_territorio = 11;
          territorio_identidade = 'Chapada Diamantina';
        } else if (str.includes('sul da bahia') || str.includes('cacau')) {
          id_territorio = 6;
          territorio_identidade = 'Litoral Sul';
        } else if (str.includes('oeste') || str.includes('barreiras')) {
          id_territorio = 4;
          territorio_identidade = 'Bacia do Rio Grande';
        }
      }

      const munKey = String(c.municipio_sede || '').trim();
      const coords = MUNICIPIOS_COORDS[munKey] || MUNICIPIOS_COORDS[munKey.toLowerCase()] || (
        id_territorio === 21 ? [-9.4167, -40.5000] :
        id_territorio === 11 ? [-12.5500, -41.3833] :
        id_territorio === 6 ? [-14.7889, -39.0494] :
        id_territorio === 4 ? [-12.1444, -44.9969] :
        [-12.9714, -38.5014]
      );

      const isIG = c.tipo === 'IG' || (c.tipo && c.tipo.includes('IG'));
      const corHex = isIG ? '#10B981' : '#2563EB';

      return {
        ...c,
        id: c.id_cadeia || idx + 1,
        nome: c.entidade,
        tipo: c.tipo || 'APL',
        shortTipo: c.tipo || 'APL',
        municipio: c.municipio_sede || 'Polo Regional',
        territorio: territorio_identidade || 'Território não identificado',
        id_territorio,
        territorio_identidade: territorio_identidade || 'Território não identificado',
        lat: coords[0],
        lng: coords[1],
        corHex,
        icone: isIG ? Award : Wheat,
        iconSvg: isIG ? IG_SVG : APL_SVG,
        urlReferencia: c.fonte || '',
        tituloReferencia: c.entidade
      };
    });
  }, [listaCadeias, municipiosTerritorios]);

  // Cursos / Cadeias no Território Selecionado
  const territoryCadeias = useMemo(() => {
    if (!enrichedCadeias || enrichedCadeias.length === 0) return [];
    if (!selectedTerritory) return enrichedCadeias;
    return enrichedCadeias.filter(c => Number(c.id_territorio) === Number(selectedTerritory.id_territorio));
  }, [enrichedCadeias, selectedTerritory]);

  // 2. Filtragem Geral dos Dados
  const filteredCadeias = useMemo(() => {
    let list = territoryCadeias;

    if (selectedTipo !== 'todos') {
      list = list.filter(c => c.tipo === selectedTipo);
    }

    if (selectedSegmento) {
      list = list.filter(c => c.segmento === selectedSegmento);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        (c.entidade && c.entidade.toLowerCase().includes(q)) ||
        (c.segmento && c.segmento.toLowerCase().includes(q)) ||
        (c.municipio_sede && c.municipio_sede.toLowerCase().includes(q)) ||
        (c.territorio_identidade && c.territorio_identidade.toLowerCase().includes(q))
      );
    }

    return list;
  }, [territoryCadeias, selectedTipo, selectedSegmento, searchQuery]);

  // 3. Segmentos Econômicos (Distribuição Dinâmica)
  const segmentStats = useMemo(() => {
    if (!territoryCadeias || territoryCadeias.length === 0) return [];
    const counts = {};
    const total = territoryCadeias.length;

    territoryCadeias.forEach(c => {
      const seg = c.segmento || 'Outros Segmentos';
      counts[seg] = (counts[seg] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count], idx) => {
        const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
        const color = SEGMENT_PALETTE[idx % SEGMENT_PALETTE.length];
        return { name, count, percent, color };
      })
      .sort((a, b) => b.count - a.count);
  }, [territoryCadeias]);

  // 4A. Ranking Territorial de Cadeias
  const territoryRanking = useMemo(() => {
    if (!enrichedCadeias || enrichedCadeias.length === 0) return [];
    const counts = {};

    enrichedCadeias.forEach(c => {
      const tid = Number(c.id_territorio);
      const tName = c.territorio_identidade || 'Não identificado';
      if (!counts[tid]) {
        counts[tid] = { id: tid, name: tName, count: 0, aplCount: 0, igCount: 0 };
      }
      counts[tid].count += 1;
      if (c.tipo === 'APL') counts[tid].aplCount += 1;
      if (c.tipo === 'IG') counts[tid].igCount += 1;
    });

    const maxCount = Math.max(...Object.values(counts).map(t => t.count), 1);

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .map((t, idx) => ({
        ...t,
        rank: idx + 1,
        percentBar: Math.min(100, (t.count / maxCount) * 100),
        heatColor: getCadeiasHeatColor(t.count)
      }));
  }, [enrichedCadeias]);

  // 4B. Ranking de Municípios do Território
  const municipalityRanking = useMemo(() => {
    if (!selectedTerritory || !territoryCadeias || territoryCadeias.length === 0) return [];
    const counts = {};

    territoryCadeias.forEach(c => {
      const mun = c.municipio_sede || 'Regional / Polo';
      counts[mun] = (counts[mun] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        rank: idx + 1,
        percentBar: Math.min(100, (count / maxCount) * 100),
        heatColor: getCadeiasHeatColor(count)
      }));
  }, [selectedTerritory, territoryCadeias]);

  // 5. Lista de Indicações Geográficas (IGs)
  const igsList = useMemo(() => {
    return territoryCadeias.filter(c => c.tipo === 'IG' || (c.tipo && c.tipo.includes('IG')));
  }, [territoryCadeias]);

  // 6. Contagens Globais e por Tipo
  const totalAPLs = useMemo(() => enrichedCadeias.filter(c => c.tipo === 'APL').length, [enrichedCadeias]);
  const totalIGs = useMemo(() => enrichedCadeias.filter(c => c.tipo === 'IG' || (c.tipo && c.tipo.includes('IG'))).length, [enrichedCadeias]);
  
  const territoriosComCadeiasCount = useMemo(() => {
    if (territoriosData && territoriosData.length > 0) {
      return territoriosData.filter(t => Number(t.cadeias_produtivas || 0) > 0).length;
    }
    return territoryRanking.length;
  }, [territoriosData, territoryRanking]);

  // 7. Definição dos 5 KPIs Calculados Dinamicamente
  const kpis = [
    { 
      label: 'Cadeias & IGs Mapeadas', 
      value: loadingStats ? '...' : enrichedCadeias.length, 
      icon: GitPullRequest 
    },
    { 
      label: 'Arranjos Produtivos (APL)', 
      value: loadingStats ? '...' : totalAPLs, 
      icon: Wheat 
    },
    { 
      label: 'Indicações Geográficas (IG)', 
      value: loadingStats ? '...' : totalIGs, 
      icon: Award 
    },
    { 
      label: 'Territórios Atendidos', 
      value: loadingStats ? '...' : `${territoriosComCadeiasCount} / ${territoriosData.length || 27}`, 
      icon: MapPin 
    },
    { 
      label: segmentStats[0] ? segmentStats[0].name : 'Principal Segmento', 
      value: loadingStats ? '...' : (segmentStats[0] ? `${segmentStats[0].percent}%` : '-'), 
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
              Módulo de Cadeias Produtivas & IGs
            </h1>
            <span className="bg-[#10B981]/10 text-[#059669] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#10B981]/20 flex items-center gap-1">
              <Award size={12} className="text-[#059669]" />
              APLs & Indicações Geográficas
            </span>
          </div>
          <p className="text-sm text-[#457B9D] mt-0.5 font-medium">
            Mapeamento territorial de Arranjos Produtivos Locais (APLs) e Indicações Geográficas do Estado da Bahia
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
        {/* LADO ESQUERDO: MAPA DE PONTOS DE CADEIAS PRODUTIVAS (ALINHADO COM 2 KPIS) */}
        {/* ========================================================================= */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.08)] transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden flex flex-col group min-h-[460px]">
          <SideMap
            mode="cadeias"
            cadeiasData={enrichedCadeias}
            focusedAsset={focusedAsset}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            selectedSegmento={selectedSegmento}
            onSelectSegmento={setSelectedSegmento}
          />
        </div>

        {/* ========================================================================= */}
        {/* LADO DIREITO: DASHBOARD ANALÍTICO & CATÁLOGO DE CADEIAS (FLEX-1) */}
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
                <GitPullRequest size={13} />
                Catálogo ({filteredCadeias.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('segmentos')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'segmentos'
                    ? 'bg-[#1D3557] text-white shadow-xs'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                }`}
              >
                <Filter size={13} />
                Segmentos ({segmentStats.length})
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
                onClick={() => setActiveTab('igs')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'igs'
                    ? 'bg-[#1D3557] text-white shadow-xs'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                }`}
              >
                <Award size={13} />
                Indicações Geográficas ({igsList.length})
              </button>
            </div>

            {/* INPUT DE BUSCA */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#457B9D]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cadeia, segmento ou cidade..."
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
            
            {/* ABA 1: CATÁLOGO DE CADEIAS E APLS */}
            {activeTab === 'catalogo' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory ? `Cadeias & IGs em ${territoryName}` : 'Cadeias Produtivas e APLs do Estado'}
                    </h3>
                    <span className="bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black px-2 py-0.5 rounded-full">
                      {filteredCadeias.length} resultados
                    </span>
                  </div>

                  {/* FILTROS RÁPIDOS DE TIPO (APL / IG) */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedTipo('todos')}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                        selectedTipo === 'todos'
                          ? 'bg-[#1D3557] text-white'
                          : 'bg-[#F1F5F9] text-[#457B9D] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTipo('APL')}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                        selectedTipo === 'APL'
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20'
                      }`}
                    >
                      APLs
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTipo('IG')}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                        selectedTipo === 'IG'
                          ? 'bg-[#10B981] text-white'
                          : 'bg-[#10B981]/10 text-[#059669] hover:bg-[#10B981]/20'
                      }`}
                    >
                      IGs
                    </button>
                    {selectedTerritory && (
                      <span className="text-[10.5px] font-bold text-[#1D3557] bg-[#D6EAF8]/40 px-2.5 py-1 rounded-full flex items-center gap-1 ml-1">
                        <MapPin size={11} className="text-[#2563EB]" />
                        {territoryName}
                      </span>
                    )}
                  </div>
                </div>

                {/* LISTAGEM SCROLLÁVEL */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {filteredCadeias.length > 0 ? (
                    filteredCadeias.map((c, idx) => {
                      const isIG = c.tipo === 'IG';

                      return (
                        <div
                          key={c.id_cadeia || idx}
                          onClick={() => {
                            if (c.lat && c.lng) {
                              setFocusedAsset([c.lat, c.lng]);
                            }
                          }}
                          className="bg-[#F8FAFC] hover:bg-white hover:border-[#D6EAF8] border border-transparent rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-all duration-200 group cursor-pointer"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform ${
                              isIG ? 'bg-[#10B981]/15 text-[#059669]' : 'bg-[#2563EB]/15 text-[#2563EB]'
                            }`}>
                              {isIG ? <Award size={16} /> : <Wheat size={16} />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[12px] font-extrabold text-[#1D3557] group-hover:text-[#2563EB] transition-colors leading-tight truncate">
                                  {c.entidade}
                                </h4>
                              </div>
                              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#457B9D] mt-0.5 font-medium">
                                <span className="font-bold text-[#1D3557] bg-[#E2E8F0]/60 px-1.5 py-0.2 rounded-md">
                                  {c.segmento}
                                </span>
                                <span>•</span>
                                <span>{c.municipio_sede || 'Polo Regional'}</span>
                                <span>•</span>
                                <span className="text-[#64748B]">{c.territorio_identidade}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full ${
                              isIG 
                                ? 'bg-[#10B981]/15 text-[#059669]' 
                                : 'bg-[#2563EB]/15 text-[#2563EB]'
                            }`}>
                              {c.tipo || 'APL'}
                            </span>
                            {c.fonte && (
                              <a
                                href={c.fonte}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#D6EAF8]/50 transition-colors"
                                title="Fonte Oficial Observatório APL / INPI"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                      <GitPullRequest size={32} className="mb-2 opacity-40 text-[#457B9D]" />
                      <p className="text-[12px] font-bold text-[#1D3557]">Nenhuma cadeia ou APL encontrada</p>
                      <p className="text-[10px] mt-1 text-[#457B9D]">Tente ajustar o termo de busca ou filtros de segmento.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 2: SEGMENTOS ECONÔMICOS */}
            {activeTab === 'segmentos' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory 
                        ? `Segmentos Econômicos em ${territoryName}` 
                        : 'Segmentos Econômicos e Produtivos da Bahia'
                      }
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      Distribuição dos arranjos por vocação produtiva e setor econômico
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
                  {segmentStats.length > 0 ? (
                    segmentStats.map((seg) => {
                      const isSelected = selectedSegmento === seg.name;

                      return (
                        <div
                          key={seg.name}
                          onClick={() => setSelectedSegmento(isSelected ? null : seg.name)}
                          className={`rounded-2xl p-3.5 border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20'
                              : 'bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: seg.color }}
                              ></span>
                              <span className="text-[12px] font-extrabold text-[#1D3557] truncate">
                                {seg.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-black text-[#1D3557]">
                                {seg.count} {seg.count === 1 ? 'arranjo' : 'arranjos'}
                              </span>
                              <span
                                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${seg.color}15`, color: seg.color }}
                              >
                                {seg.percent}%
                              </span>
                            </div>
                          </div>

                          {/* BARRA DE PROGRESSO */}
                          <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${seg.percent}%`,
                                backgroundColor: seg.color
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                      <Filter size={28} className="mb-2 opacity-40 text-[#457B9D]" />
                      <p className="text-[12px] font-bold text-[#1D3557]">Nenhum segmento registrado neste território</p>
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
                        : 'Ranking Territorial de Cadeias e APLs'
                      }
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      {selectedTerritory 
                        ? 'Concentração de arranjos produtivos nos municípios deste território'
                        : 'Densidade de cadeias produtivas nos 27 Territórios de Identidade'
                      }
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-[#457B9D] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
                    {selectedTerritory 
                      ? `${municipalityRanking.length} municípios polo`
                      : `${territoryRanking.length} territórios atendidos`
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
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${m.percentBar}%`,
                                    backgroundColor: m.heatColor === '#E2E8F0' ? '#64748B' : m.heatColor
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-2xs"
                              style={{ backgroundColor: m.heatColor === '#E2E8F0' ? '#64748B' : m.heatColor }}
                            >
                              {m.count} {m.count === 1 ? 'cadeia' : 'cadeias'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                        <MapPin size={28} className="mb-2 opacity-40 text-[#457B9D]" />
                        <p className="text-[12px] font-bold text-[#1D3557]">Nenhuma cadeia registrada neste território</p>
                      </div>
                    )
                  ) : (
                    territoryRanking.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          const found = territoriosData.find(x => Number(x.id_territorio) === Number(t.id));
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
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${t.percentBar}%`,
                                  backgroundColor: t.heatColor === '#E2E8F0' ? '#64748B' : t.heatColor
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {t.igCount > 0 && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#10B981]/15 text-[#059669]">
                              {t.igCount} IG
                            </span>
                          )}
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-2xs"
                            style={{ backgroundColor: t.heatColor === '#E2E8F0' ? '#64748B' : t.heatColor }}
                          >
                            {t.count} {t.count === 1 ? 'cadeia' : 'cadeias'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ABA 4: INDICAÇÕES GEOGRÁFICAS (IGs) */}
            {activeTab === 'igs' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory 
                        ? `Indicações Geográficas em ${territoryName}` 
                        : 'Indicações Geográficas Reconhecidas (IGs da Bahia)'
                      }
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      Produtos tradicionais com selo de Indicação de Procedência (IP) ou Denominação de Origem (DO)
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-[#059669] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-1 rounded-full">
                    {igsList.length} IGs Mapeadas
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {igsList.length > 0 ? (
                    igsList.map((ig, idx) => (
                      <div
                        key={ig.id_cadeia || idx}
                        onClick={() => {
                          if (ig.lat && ig.lng) {
                            setFocusedAsset([ig.lat, ig.lng]);
                          }
                        }}
                        className="bg-[#F8FAFC] hover:bg-white hover:border-[#10B981]/40 border border-transparent rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all duration-200 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 text-[#059669] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Award size={18} strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[12.5px] font-black text-[#1D3557] group-hover:text-[#059669] transition-colors truncate">
                                {ig.entidade}
                              </h4>
                              <span className="bg-[#10B981] text-white text-[8.5px] font-black px-1.5 py-0.2 rounded-md uppercase">
                                Selo IG
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#457B9D] mt-0.5 font-medium">
                              <span className="font-bold text-[#1D3557]">{ig.segmento}</span>
                              <span>•</span>
                              <span>{ig.territorio_identidade}</span>
                              {ig.municipio_sede && (
                                <>
                                  <span>•</span>
                                  <span>{ig.municipio_sede}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {ig.fonte && (
                          <a
                            href={ig.fonte}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#10B981]/10 hover:bg-[#10B981] text-[#059669] hover:text-white transition-all text-[10px] font-bold shrink-0"
                          >
                            <span>Certificação</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                      <Award size={32} className="mb-2 opacity-40 text-[#457B9D]" />
                      <p className="text-[12px] font-bold text-[#1D3557]">Nenhuma Indicação Geográfica registrada neste território</p>
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
