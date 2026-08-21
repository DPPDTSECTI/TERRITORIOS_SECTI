import React, { useContext, useState, useMemo } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Building2, 
  MapPin, 
  Search, 
  Flame, 
  TrendingUp, 
  Sparkles, 
  ExternalLink,
  Filter,
  Database
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import SideMap, { getHeatColor } from './maps/SideMap';

const PALETTE_CORES = ['#2563EB', '#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export default function CursosPage() {
  const { 
    cursosData = [], 
    territoriosData = [], 
    kpisGlobais = {}, 
    loadingStats = false 
  } = useContext(DataContext);

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo' | 'areas' | 'ranking' | 'ies'

  // 1. Filtragem Geral dos Cursos (Direto do DataContext)
  const filteredCursos = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    let list = cursosData;

    if (selectedCategory !== 'todas') {
      list = list.filter(c => c.categoria === selectedCategory);
    }

    if (selectedTerritory) {
      list = list.filter(c => Number(c.id_territorio) === Number(selectedTerritory.id_territorio));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        (c.curso && c.curso.toLowerCase().includes(q)) ||
        (c.entidade && c.entidade.toLowerCase().includes(q)) ||
        (c.sigla && c.sigla.toLowerCase().includes(q)) ||
        (c.municipio && c.municipio.toLowerCase().includes(q)) ||
        (c.territorio_identidade && c.territorio_identidade.toLowerCase().includes(q))
      );
    }

    return list;
  }, [cursosData, selectedCategory, selectedTerritory, searchQuery]);

  // 2. Mapeamento e Estatísticas de Categorias (Áreas) 100% Dinâmicas
  const categoryStats = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    const counts = {};
    const total = cursosData.length;

    cursosData.forEach(c => {
      const cat = c.categoria || 'Outras Áreas';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count], idx) => {
        const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
        const color = PALETTE_CORES[idx % PALETTE_CORES.length];
        return { 
          name, 
          count, 
          percent, 
          color,
          bgLight: 'bg-[#F1F5F9]',
          shortName: name
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [cursosData]);

  // Mapa rápido de cores por categoria
  const categoryColorMap = useMemo(() => {
    const map = {};
    categoryStats.forEach((cat) => {
      map[cat.name] = cat.color;
    });
    return map;
  }, [categoryStats]);

  // 3. Ranking de Territórios por Contagem de Cursos
  const territoryRanking = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    const counts = {};

    cursosData.forEach(c => {
      const tid = Number(c.id_territorio);
      const tName = c.territorio_identidade || 'Não identificado';
      if (!counts[tid]) {
        counts[tid] = { id: tid, name: tName, count: 0 };
      }
      counts[tid].count += 1;
    });

    const maxCount = Math.max(...Object.values(counts).map(t => t.count), 1);

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .map((t, idx) => ({
        ...t,
        rank: idx + 1,
        percentBar: Math.min(100, (t.count / maxCount) * 100),
        heatColor: getHeatColor(t.count)
      }));
  }, [cursosData]);

  // 4. Ranking de Instituições Ofertantes (IES)
  const iesRanking = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    const counts = {};

    cursosData.forEach(c => {
      const entName = c.entidade || 'Outra';
      const sigla = c.sigla ? String(c.sigla).toUpperCase().trim() : entName;
      if (!counts[sigla]) {
        counts[sigla] = { sigla, fullName: entName, count: 0, municipios: new Set() };
      }
      counts[sigla].count += 1;
      if (c.municipio) counts[sigla].municipios.add(c.municipio);
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [cursosData]);

  // 5. Contagem de IES Únicas
  const totalIesUnicas = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return 0;
    const iesSet = new Set();
    cursosData.forEach(c => {
      const nome = c.sigla ? String(c.sigla).trim().toUpperCase() : String(c.entidade || '').trim();
      if (nome) iesSet.add(nome);
    });
    return iesSet.size;
  }, [cursosData]);

  // 6. Territórios com Cursos a partir de DataContext (stats_ti e cursosData)
  const territoriosComCursosCount = useMemo(() => {
    if (territoriosData && territoriosData.length > 0) {
      return territoriosData.filter(t => Number(t.qtd_cursos_cti || 0) > 0).length;
    }
    return territoryRanking.length;
  }, [territoriosData, territoryRanking]);

  // 7. Cursos no Semiárido via DataContext
  const cursosSemiaridoCount = useMemo(() => {
    if (!territoriosData || territoriosData.length === 0) return 0;
    return territoriosData
      .filter(t => Number(t.qtd_mun_semiarido || 0) > 0)
      .reduce((acc, t) => acc + Number(t.qtd_cursos_cti || 0), 0);
  }, [territoriosData]);

  // 8. Definição dos 5 KPIs calculados dinamicamente do DataContext
  const kpis = [
    { 
      label: 'Cursos de CT&I Mapeados', 
      value: loadingStats ? '...' : (kpisGlobais?.cursos != null ? kpisGlobais.cursos : cursosData.length), 
      icon: GraduationCap 
    },
    { 
      label: 'Territórios com Oferta', 
      value: loadingStats ? '...' : `${territoriosComCursosCount} / ${territoriosData.length || 27}`, 
      icon: MapPin 
    },
    { 
      label: 'Instituições Ofertantes', 
      value: loadingStats ? '...' : totalIesUnicas, 
      icon: Building2 
    },
    { 
      label: 'Cursos no Semiárido', 
      value: loadingStats ? '...' : cursosSemiaridoCount, 
      icon: Database 
    },
    { 
      label: categoryStats[0] ? categoryStats[0].name : 'Principal Área', 
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
              Módulo de Cursos de CT&I
            </h1>
            <span className="bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#2563EB]/20 flex items-center gap-1">
              <Flame size={12} className="text-[#2563EB]" />
              Heatmap Territorial
            </span>
          </div>
          <p className="text-sm text-[#457B9D] mt-0.5 font-medium">
            Mapeamento territorial e densidade de cursos de ensino superior em Ciência, Tecnologia e Inovação
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
        {/* LADO ESQUERDO: MAPA DE CALOR DE CURSOS (ALINHADO COM 2 KPIS) */}
        {/* ========================================================================= */}
        <div style={{ width: 'calc(40% - 12px)' }} className="shrink-0 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.08)] transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden flex flex-col group min-h-[460px]">
          <SideMap
            mode="cursos"
            cursosData={cursosData}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
          />
        </div>

        {/* ========================================================================= */}
        {/* LADO DIREITO: DASHBOARD ANALÍTICO & CATÁLOGO DE CURSOS (FLEX-1) */}
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
                <BookOpen size={13} />
                Catálogo ({filteredCursos.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('areas')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'areas'
                    ? 'bg-[#1D3557] text-white shadow-xs'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                }`}
              >
                <Filter size={13} />
                Áreas ({categoryStats.length})
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
                Ranking Territórios
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ies')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'ies'
                    ? 'bg-[#1D3557] text-white shadow-xs'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                }`}
              >
                <Building2 size={13} />
                Top Instituições
              </button>
            </div>

            {/* INPUT DE BUSCA */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#457B9D]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar curso, instituição ou cidade..."
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
            
            {/* ABA 1: CATÁLOGO COMPLETO DE CURSOS */}
            {activeTab === 'catalogo' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      Cursos de Ciência, Tecnologia e Inovação
                    </h3>
                    <span className="bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black px-2 py-0.5 rounded-full">
                      {filteredCursos.length} resultados
                    </span>
                  </div>
                  
                  {selectedTerritory && (
                    <span className="text-[10.5px] font-bold text-[#1D3557] bg-[#D6EAF8]/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <MapPin size={11} className="text-[#2563EB]" />
                      {selectedTerritory.nome_territorio || selectedTerritory.territorio}
                    </span>
                  )}
                </div>

                {/* LISTAGEM SCROLLÁVEL */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {filteredCursos.length > 0 ? (
                    filteredCursos.map((c, idx) => {
                      const catColor = categoryColorMap[c.categoria] || '#2563EB';

                      return (
                        <div
                          key={c.id || idx}
                          className="bg-[#F8FAFC] hover:bg-white hover:border-[#D6EAF8] border border-transparent rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:shadow-xs transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div 
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: `${catColor}15` }}
                            >
                              <GraduationCap size={16} style={{ color: catColor }} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h4 className="text-[12px] font-extrabold text-[#1D3557] group-hover:text-[#2563EB] transition-colors leading-tight truncate">
                                {c.curso}
                              </h4>
                              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#457B9D] mt-0.5 font-medium">
                                <span className="font-bold text-[#1D3557]">{c.sigla || c.entidade}</span>
                                <span>•</span>
                                <span>{c.municipio}</span>
                                <span>•</span>
                                <span className="text-[#64748B]">{c.territorio_identidade}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <span 
                              className="text-[9px] font-extrabold px-2.5 py-1 rounded-full"
                              style={{ backgroundColor: `${catColor}15`, color: catColor }}
                            >
                              {c.categoria || 'Geral'}
                            </span>
                            {c.url_referencia && (
                              <a
                                href={c.url_referencia}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#D6EAF8]/50 transition-colors"
                                title="Fonte INEP Censo da Educação Superior"
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
                      <GraduationCap size={32} className="mb-2 opacity-40 text-[#457B9D]" />
                      <p className="text-[12px] font-bold text-[#1D3557]">Nenhum curso encontrado</p>
                      <p className="text-[10px] mt-1 text-[#457B9D]">Tente ajustar os filtros de categoria ou termo de busca.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 2: DISTRIBUIÇÃO POR ÁREAS DE CONHECIMENTO */}
            {activeTab === 'areas' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0">
                  <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                    Distribuição por Áreas de Conhecimento
                  </h3>
                  <p className="text-[10.5px] text-[#457B9D] font-medium">
                    Clique em uma categoria para filtrar o catálogo e o mapa
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0">
                  {categoryStats.map((cat) => {
                    const isSelected = selectedCategory === cat.name;

                    return (
                      <div
                        key={cat.name}
                        onClick={() => setSelectedCategory(isSelected ? 'todas' : cat.name)}
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
                              style={{ backgroundColor: cat.color }}
                            ></span>
                            <span className="text-[12px] font-extrabold text-[#1D3557] truncate">
                              {cat.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-black text-[#1D3557]">
                              {cat.count} cursos
                            </span>
                            <span
                              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
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
                              backgroundColor: cat.color
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ABA 3: RANKING DE TERRITÓRIOS */}
            {activeTab === 'ranking' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      Ranking Territorial de Oferta de Cursos
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      Densidade total de cursos em cada Território de Identidade da Bahia
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-[#457B9D] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
                    {territoryRanking.length} territórios
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {territoryRanking.map((t) => {
                    const isSelected = selectedTerritory && Number(selectedTerritory.id_territorio) === Number(t.id);

                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          if (isSelected) setSelectedTerritory(null);
                          else {
                            const found = territoriosData.find(x => Number(x.id_territorio) === Number(t.id));
                            setSelectedTerritory(found || { id_territorio: t.id, nome_territorio: t.name });
                          }
                        }}
                        className={`rounded-2xl p-2.5 border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-white border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20'
                            : 'bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs'
                        }`}
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
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-2xs"
                            style={{ backgroundColor: t.heatColor === '#E2E8F0' ? '#64748B' : t.heatColor }}
                          >
                            {t.count} cursos
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ABA 4: TOP INSTITUIÇÕES (IES) */}
            {activeTab === 'ies' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0">
                  <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                    Top Instituições Ofertantes de Cursos de CT&I
                  </h3>
                  <p className="text-[10.5px] text-[#457B9D] font-medium">
                    Universidades, faculdades e institutos federais com maior catálogo no estado
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {iesRanking.map((ies, idx) => (
                    <div
                      key={ies.sigla}
                      className="bg-[#F8FAFC] hover:bg-white hover:border-[#D6EAF8] border border-transparent rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center font-black text-[11px] shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h4 className="text-[12px] font-black text-[#1D3557] truncate">
                            {ies.sigla}
                          </h4>
                          <span className="text-[10px] text-[#457B9D] font-medium truncate">
                            {ies.fullName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9.5px] font-bold text-[#457B9D] bg-[#E2E8F0]/50 px-2 py-0.5 rounded-full">
                          {ies.municipios.size} {ies.municipios.size === 1 ? 'cidade' : 'cidades'}
                        </span>
                        <span className="text-[11px] font-black text-[#1D3557] bg-[#D6EAF8] px-2.5 py-0.5 rounded-full">
                          {ies.count} cursos
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </main>
  );
}
