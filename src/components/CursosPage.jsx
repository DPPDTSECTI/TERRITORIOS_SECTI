import React, { useContext, useState, useMemo, useRef } from 'react';
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
  Database,
  Check,
  X,
  Wifi,
  Laptop
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import SideMap, { getHeatColor } from './maps/SideMap';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';

const PALETTE_CORES = ['#2563EB', '#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export function cleanIesName(name, municipio) {
  if (!name) return '';
  let clean = String(name).trim();

  clean = clean.replace(/\s*-\s*Campus\b.*$/i, '');
  clean = clean.replace(/\s*-\s*Polo\b.*$/i, '');
  clean = clean.replace(/\s*-\s*Unidade\b.*$/i, '');
  clean = clean.replace(/\s*\((?:campus|polo|sede|ead).*?\)/gi, '');

  if (municipio) {
    const munTrim = String(municipio).trim();
    if (clean.toLowerCase().endsWith(' - ' + munTrim.toLowerCase())) {
      clean = clean.slice(0, -(munTrim.length + 3)).trim();
    }
  }

  clean = clean.replace(/\s*-\s*([A-Za-zÀ-ÖØ-öø-ÿ\s]+)$/, (match, candidate) => {
    const c = candidate.trim();
    if (MUNICIPIOS_COORDS[c] || MUNICIPIOS_COORDS[c.toLowerCase()]) {
      return '';
    }
    return match;
  });

  return clean.trim();
}

export function isCursoEad(c) {
  if (!c) return false;
  if (c.ead === true || c.ead === 'true' || c.ead === 1 || c.ead === '1' || c.ead === 't') return true;
  const cursoLower = String(c.curso || c.nome || '').toLowerCase();
  const modLower = String(c.modalidade || '').toLowerCase();
  const munLower = String(c.municipio || '').toLowerCase();
  return cursoLower.includes('ead') || modLower.includes('distância') || modLower.includes('distancia') || modLower.includes('ead') || munLower.includes('ead');
}

export default function CursosPage() {
  const { 
    cursosData = [], 
    cursosEadData = [], 
    territoriosData = [], 
    kpisGlobais = {}, 
    loadingStats = false 
  } = useContext(DataContext);

  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedIES, setSelectedIES] = useState(null);
  const [selectedCursoId, setSelectedCursoId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo' | 'ead' | 'areas' | 'ranking' | 'ies'
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const itemRefs = useRef({});
  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // Cursos presenciais restritos ao território selecionado
  const territoryCursos = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    if (!selectedTerritory) return cursosData;
    return cursosData.filter(c => Number(c.id_territorio) === Number(selectedTerritory.id_territorio));
  }, [cursosData, selectedTerritory]);

  // 1. Filtragem Geral dos Cursos Presenciais
  const filteredCursos = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    let list = cursosData;

    if (selectedCategory !== 'todas') {
      list = list.filter(c => (c.categoria || c.tipo) === selectedCategory);
    }

    if (selectedIES) {
      list = list.filter(c => {
        const sigla = c.sigla ? String(c.sigla).trim().toUpperCase() : '';
        const ent = c.entidade || c.instituicao ? String(c.entidade || c.instituicao).trim() : '';
        const cleanEnt = cleanIesName(ent, c.municipio);
        return (
          sigla === selectedIES.toUpperCase() || 
          ent === selectedIES ||
          cleanEnt === selectedIES
        );
      });
    }

    if (selectedTerritory) {
      list = list.filter(c => Number(c.id_territorio) === Number(selectedTerritory.id_territorio));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nomeCurso = c => String(c.curso || c.nome || '').toLowerCase();
      list = list.filter(c => 
        nomeCurso(c).includes(q) ||
        (c.entidade && String(c.entidade).toLowerCase().includes(q)) ||
        (c.instituicao && String(c.instituicao).toLowerCase().includes(q)) ||
        (c.sigla && String(c.sigla).toLowerCase().includes(q)) ||
        (c.municipio && String(c.municipio).toLowerCase().includes(q)) ||
        (c.territorio_identidade && String(c.territorio_identidade).toLowerCase().includes(q))
      );
    }

    return list;
  }, [cursosData, selectedCategory, selectedIES, selectedTerritory, searchQuery]);

  // 1.1 Filtragem Exclusiva dos Cursos EaD
  const filteredEadCursos = useMemo(() => {
    if (!cursosEadData || cursosEadData.length === 0) return [];
    let list = cursosEadData;

    if (selectedCategory !== 'todas') {
      list = list.filter(c => (c.categoria || c.tipo) === selectedCategory);
    }

    if (selectedIES) {
      list = list.filter(c => {
        const sigla = c.sigla ? String(c.sigla).trim().toUpperCase() : '';
        const ent = c.entidade || c.instituicao ? String(c.entidade || c.instituicao).trim() : '';
        const cleanEnt = cleanIesName(ent, c.municipio);
        return (
          sigla === selectedIES.toUpperCase() || 
          ent === selectedIES ||
          cleanEnt === selectedIES
        );
      });
    }

    if (selectedTerritory) {
      list = list.filter(c => Number(c.id_territorio) === Number(selectedTerritory.id_territorio));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nomeCurso = c => String(c.curso || c.nome || '').toLowerCase();
      list = list.filter(c => 
        nomeCurso(c).includes(q) ||
        (c.entidade && String(c.entidade).toLowerCase().includes(q)) ||
        (c.instituicao && String(c.instituicao).toLowerCase().includes(q)) ||
        (c.sigla && String(c.sigla).toLowerCase().includes(q)) ||
        (c.municipio && String(c.municipio).toLowerCase().includes(q)) ||
        (c.territorio_identidade && String(c.territorio_identidade).toLowerCase().includes(q))
      );
    }

    return list;
  }, [cursosEadData, selectedCategory, selectedIES, selectedTerritory, searchQuery]);

  const compactCursosList = useMemo(() => {
    if (!sidebarSearch.trim()) return filteredCursos;
    const q = sidebarSearch.toLowerCase().trim();
    const nomeCurso = c => String(c.curso || c.nome || '').toLowerCase();
    return filteredCursos.filter(c =>
      nomeCurso(c).includes(q) ||
      (c.sigla && String(c.sigla).toLowerCase().includes(q)) ||
      (c.entidade && String(c.entidade).toLowerCase().includes(q)) ||
      (c.instituicao && String(c.instituicao).toLowerCase().includes(q)) ||
      (c.municipio && String(c.municipio).toLowerCase().includes(q)) ||
      ((c.categoria || c.tipo) && String(c.categoria || c.tipo).toLowerCase().includes(q))
    );
  }, [filteredCursos, sidebarSearch]);

  const cursosDataForMap = useMemo(() => {
    if (!selectedIES) return cursosData;
    return cursosData.filter(c => {
      const sigla = c.sigla ? String(c.sigla).trim().toUpperCase() : '';
      const ent = c.entidade || c.instituicao ? String(c.entidade || c.instituicao).trim() : '';
      const cleanEnt = cleanIesName(ent, c.municipio);
      return (
        sigla === selectedIES.toUpperCase() || 
        ent === selectedIES ||
        cleanEnt === selectedIES
      );
    });
  }, [cursosData, selectedIES]);

  // 2. Mapeamento e Estatísticas de Categorias (Áreas)
  const categoryStats = useMemo(() => {
    if (!territoryCursos || territoryCursos.length === 0) return [];
    const counts = {};
    const total = territoryCursos.length;

    territoryCursos.forEach(c => {
      const cat = c.categoria || c.tipo || 'Outras Áreas';
      if (!counts[cat]) {
        counts[cat] = { total: 0 };
      }
      counts[cat].total += 1;
    });

    return Object.entries(counts)
      .map(([name, data], idx) => {
        const percent = total > 0 ? ((data.total / total) * 100).toFixed(1) : '0.0';
        const color = PALETTE_CORES[idx % PALETTE_CORES.length];
        return { 
          name, 
          count: data.total, 
          percent, 
          color,
          shortName: name
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [territoryCursos]);

  const categoryColorMap = useMemo(() => {
    const map = {};
    categoryStats.forEach((cat) => {
      map[cat.name] = cat.color;
    });
    return map;
  }, [categoryStats]);

  // 3A. Ranking de Territórios
  const territoryRanking = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return [];
    const counts = {};

    cursosData.forEach(c => {
      const tid = Number(c.id_territorio);
      const tName = c.territorio_identidade || 'Não identificado';
      if (tid > 0) {
        if (!counts[tid]) {
          counts[tid] = { id: tid, name: tName, count: 0 };
        }
        counts[tid].count += 1;
      }
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

  // 3B. Ranking de Municípios
  const municipalityRanking = useMemo(() => {
    if (!selectedTerritory || !territoryCursos || territoryCursos.length === 0) return [];
    const counts = {};

    territoryCursos.forEach(c => {
      const mun = c.municipio || 'Não identificado';
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
        heatColor: getHeatColor(count)
      }));
  }, [selectedTerritory, territoryCursos]);

  // 4. Ranking de Instituições (IES)
  const iesRanking = useMemo(() => {
    if (!territoryCursos || territoryCursos.length === 0) return [];
    const counts = {};

    territoryCursos.forEach(c => {
      const fullClean = cleanIesName(c.entidade || c.instituicao || 'Outra', c.municipio);
      const sigla = c.sigla ? String(c.sigla).toUpperCase().trim() : fullClean;
      const key = sigla || fullClean;
      if (!counts[key]) {
        counts[key] = { 
          sigla: sigla || fullClean, 
          fullName: fullClean, 
          count: 0, 
          municipios: new Set(), 
          territorios: new Set() 
        };
      }
      counts[key].count += 1;
      if (c.municipio) counts[key].municipios.add(c.municipio);
      if (c.territorio_identidade) counts[key].territorios.add(c.territorio_identidade);
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [territoryCursos]);

  const totalIesUnicas = useMemo(() => {
    if (!cursosData || cursosData.length === 0) return 0;
    const iesSet = new Set();
    cursosData.forEach(c => {
      const nome = c.sigla ? String(c.sigla).trim().toUpperCase() : String(c.entidade || c.instituicao || '').trim();
      if (nome) iesSet.add(nome);
    });
    return iesSet.size;
  }, [cursosData]);

  const territoriosComCursosCount = useMemo(() => {
    if (territoriosData && territoriosData.length > 0) {
      return territoriosData.filter(t => Number(t.qtd_cursos_cti || 0) > 0).length;
    }
    return territoryRanking.length;
  }, [territoriosData, territoryRanking]);

  const cursosSemiaridoCount = useMemo(() => {
    if (!territoriosData || territoriosData.length === 0) return 0;
    return territoriosData
      .filter(t => Number(t.qtd_mun_semiarido || 0) > 0)
      .reduce((acc, t) => acc + Number(t.qtd_cursos_cti || 0), 0);
  }, [territoriosData]);

  const kpis = [
    { 
      label: 'Cursos Presenciais', 
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

      {/* GRID DE KPIS */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-5 gap-3.5 items-stretch w-full">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="h-[98px] bg-white rounded-[16px] p-4 flex flex-col justify-between shadow-[0_4px_20px_rgba(29,53,87,0.04)] hover:shadow-[0_8px_24px_rgba(29,53,87,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-default"
            >
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

              <div className="flex items-center justify-center w-full min-w-0 pt-1">
                <span className="text-[30px] font-bold text-[#1D3557] tracking-tight leading-none text-center">
                  {kpi.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GRID PRINCIPAL: MAPA + DASHBOARD */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]">
        
        {/* LADO ESQUERDO: MAPA */}
        <div
          style={{ width: isMapExpanded ? 'calc(100% - 320px)' : 'calc(40% - 12px)' }}
          className="shrink-0 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.08)] transition-all duration-300 relative overflow-hidden flex flex-col min-h-[460px]"
        >
          <SideMap
            mode="cursos"
            cursosData={cursosDataForMap}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            selectedIES={selectedIES}
            onSelectIES={setSelectedIES}
            isExpanded={isMapExpanded}
            onToggleExpand={() => setIsMapExpanded(prev => !prev)}
          />
        </div>

        {/* MODO EXPANDIDO */}
        {isMapExpanded ? (
          <div className="w-[305px] shrink-0 h-[460px] lg:h-full bg-white rounded-[28px] border border-transparent shadow-[0_4px_24px_rgba(29,53,87,0.04)] p-3.5 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E2E8F0]/70 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[12px] font-extrabold text-[#1D3557] truncate">
                  Cursos de CT&I
                </span>
                <span className="bg-[#2563EB]/10 text-[#2563EB] text-[9.5px] font-black px-2 py-0.5 rounded-full shrink-0">
                  {compactCursosList.length}
                </span>
              </div>
              {selectedCursoId && (
                <button
                  type="button"
                  onClick={() => setSelectedCursoId(null)}
                  className="text-[9.5px] font-bold text-[#64748B] hover:text-red-600 bg-[#F1F5F9] hover:bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <span>Limpar</span>
                  <X size={10} />
                </button>
              )}
            </div>

            <div className="relative my-2 shrink-0">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Filtrar curso, IES ou cidade..."
                className="w-full pl-7 pr-3 py-1.5 text-[10.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors placeholder-[#94A3B8]"
              />
              {sidebarSearch && (
                <button
                  type="button"
                  onClick={() => setSidebarSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1D3557] text-[11px] font-bold"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 min-h-0">
              {compactCursosList.length > 0 ? (
                compactCursosList.map((c, idx) => {
                  const catColor = categoryColorMap[c.categoria || c.tipo] || '#64748B';
                  const cursoKey = c.id_curso || c.id || `${c.curso || c.nome}-${c.municipio}-${idx}`;
                  const isSelected = selectedCursoId === cursoKey;

                  return (
                    <div
                      key={cursoKey}
                      onClick={() => setSelectedCursoId(prev => prev === cursoKey ? null : cursoKey)}
                      className={`p-2 rounded-xl flex items-center justify-between gap-2 transition-all duration-200 group cursor-pointer border w-full ${
                        isSelected
                          ? 'bg-[#EFF6FF] border-[#2563EB] ring-2 ring-[#2563EB]/25 shadow-xs'
                          : 'bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform ${
                            isSelected ? 'scale-105 shadow-2xs' : 'group-hover:scale-105'
                          }`}
                          style={{ backgroundColor: `${catColor}18`, color: catColor }}
                        >
                          <GraduationCap size={12} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <h5 className={`text-[11px] font-bold leading-tight truncate transition-colors ${
                            isSelected ? 'text-[#1E40AF]' : 'text-[#1D3557] group-hover:text-[#2563EB]'
                          }`}>
                            {c.curso || c.nome}
                          </h5>
                          <span className="text-[9.5px] text-[#64748B] truncate leading-tight">
                            {c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)} • <strong className="font-semibold text-[#457B9D]">{c.municipio}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap"
                          style={{ backgroundColor: `${catColor}15`, color: catColor }}
                        >
                          {c.categoria || c.tipo || 'Geral'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-[#94A3B8]">
                  <p className="text-[11px] font-bold">Nenhum curso encontrado</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* LADO DIREITO: CATÁLOGO COM A NOVA ABA DE CURSOS EAD */
          <div className="flex-1 flex flex-col gap-4 h-full min-h-0 animate-in fade-in duration-200">
          
          {/* BARRA SUPERIOR DE ABAS */}
          <div className="bg-white rounded-[24px] p-3 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            
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

              {/* NOVA ABA ISOLADA: CURSOS EAD */}
              <button
                type="button"
                onClick={() => setActiveTab('ead')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'ead'
                    ? 'bg-[#7C3AED] text-white shadow-xs'
                    : 'text-[#7C3AED] hover:bg-[#8B5CF6]/10'
                }`}
              >
                <Laptop size={13} />
                Cursos EaD e Semipresenciais ({filteredEadCursos.length})
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
                {selectedTerritory ? 'Ranking Municípios' : 'Ranking Territórios'}
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
                Top Instituições {selectedIES && <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>}
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

          {/* CONTEÚDO DAS ABAS */}
          <div className="flex-1 bg-white rounded-[28px] border border-transparent shadow-[0_4px_24px_rgba(29,53,87,0.04)] p-5 flex flex-col min-h-0 overflow-hidden">
            
            {/* ABA 1: CATÁLOGO COMPLETO DE CURSOS PRESENCIAIS */}
            {activeTab === 'catalogo' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory ? `Cursos Presenciais em ${territoryName}` : 'Cursos Presenciais de CT&I'}
                    </h3>
                    <span className="bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black px-2 py-0.5 rounded-full">
                      {filteredCursos.length} resultados
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedIES && (
                      <span className="text-[10px] font-bold text-[#1D3557] bg-[#2563EB]/10 border border-[#2563EB]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Building2 size={11} className="text-[#2563EB]" />
                        {selectedIES}
                      </span>
                    )}
                    {selectedTerritory && (
                      <span className="text-[10.5px] font-bold text-[#1D3557] bg-[#D6EAF8]/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <MapPin size={11} className="text-[#2563EB]" />
                        {territoryName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {filteredCursos.length > 0 ? (
                    filteredCursos.map((c, idx) => {
                      const catColor = categoryColorMap[c.categoria || c.tipo] || '#2563EB';
                      const isSelected = selectedCursoId === (c.id || `${c.curso || c.nome}-${idx}`);

                      return (
                        <div
                          key={c.id || idx}
                          ref={(el) => {
                            const key = c.id || `${c.curso || c.nome}-${idx}`;
                            if (el && key) itemRefs.current[key] = el;
                          }}
                          onClick={() => {
                            const key = c.id || `${c.curso || c.nome}-${idx}`;
                            setSelectedCursoId(prev => prev === key ? null : key);
                          }}
                          className={`rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs transition-all duration-200 group cursor-pointer border ${
                            isSelected
                              ? 'bg-[#EFF6FF] border-[#2563EB] ring-2 ring-[#2563EB]/25 shadow-md'
                              : 'bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] hover:shadow-xs'
                          }`}
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
                                {c.curso || c.nome}
                              </h4>
                              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#457B9D] mt-0.5 font-medium">
                                <span className="font-bold text-[#1D3557]">{c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)}</span>
                                <span>•</span>
                                <span>{c.municipio}</span>
                                <span>•</span>
                                <span className="text-[#64748B]">{c.territorio_identidade}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                              Presencial
                            </span>
                            <span 
                              className="text-[9px] font-extrabold px-2.5 py-1 rounded-full"
                              style={{ backgroundColor: `${catColor}15`, color: catColor }}
                            >
                              {c.categoria || c.tipo || 'Geral'}
                            </span>
                            {c.url_referencia && (
                              <a
                                href={c.url_referencia}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#D6EAF8]/50 transition-colors"
                                title="Fonte Oficial"
                                onClick={(e) => e.stopPropagation()}
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
                      <p className="text-[12px] font-bold text-[#1D3557]">Nenhum curso presencial encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 2: CURSOS EAD ISOLADOS */}
            {activeTab === 'ead' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-extrabold text-[#7C3AED]">
                      {selectedTerritory ? `Cursos EaD em ${territoryName}` : 'Oferta de Cursos à Distância (EaD) e Semipresenciais'}
                    </h3>
                    <span className="bg-[#8B5CF6]/15 text-[#7C3AED] text-[10px] font-black px-2 py-0.5 rounded-full">
                      {filteredEadCursos.length} cursos
                    </span>
                  </div>
                  
                  {selectedTerritory && (
                    <span className="text-[10.5px] font-bold text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-purple-100">
                      <MapPin size={11} className="text-[#7C3AED]" />
                      {territoryName}
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {filteredEadCursos.length > 0 ? (
                    filteredEadCursos.map((c, idx) => (
                      <div
                        key={c.id || idx}
                        className="rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs transition-all duration-200 bg-[#FAF5FF] hover:bg-white hover:border-[#DDD6FE] border border-transparent group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                            <Laptop size={16} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <h4 className="text-[12px] font-extrabold text-[#1D3557] group-hover:text-[#7C3AED] transition-colors leading-tight truncate">
                              {c.curso || c.nome}
                            </h4>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#457B9D] mt-0.5 font-medium">
                              <span className="font-bold text-[#1D3557]">
                                {c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)}
                              </span>
                              <span>•</span>
                              <span>{c.municipio}</span>
                              <span>•</span>
                              <span className="text-[#64748B]">{c.territorio_identidade}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 shadow-2xs">
                            <Wifi size={10} strokeWidth={2.5} />
                            EaD
                          </span>
                          <span className="text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-[#8B5CF6]/10 text-[#7C3AED]">
                            {c.categoria || c.tipo || 'Geral'}
                          </span>
                          {c.url_referencia && (
                            <a
                              href={c.url_referencia}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-lg text-[#94A3B8] hover:text-[#7C3AED] hover:bg-[#8B5CF6]/10 transition-colors"
                              title="Fonte Oficial"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                      <Laptop size={32} className="mb-2 opacity-40 text-[#7C3AED]" />
                      <p className="text-[12px] font-bold text-[#1D3557]">Nenhum curso EaD registrado neste território</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 3: ÁREAS DE CONHECIMENTO */}
            {activeTab === 'areas' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory 
                        ? `Áreas de Conhecimento em ${territoryName}` 
                        : 'Distribuição por Áreas de Conhecimento'
                      }
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      {selectedTerritory 
                        ? `Exibindo proporção dos ${territoryCursos.length} cursos presenciais neste território`
                        : 'Clique em uma categoria para filtrar o catálogo'
                      }
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
                              />
                              <span className="text-[12px] font-extrabold text-[#1D3557] truncate">
                                {cat.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[12px] font-black text-[#1D3557]">
                                {cat.count} {cat.count === 1 ? 'curso' : 'cursos'}
                              </span>
                              <span
                                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                              >
                                {cat.percent}%
                              </span>
                            </div>
                          </div>

                          <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                      <Filter size={28} className="mb-2 opacity-40 text-[#457B9D]" />
                      <p className="text-[12px] font-bold text-[#1D3557]">Nenhuma área de ensino registrada</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 4: RANKING DE TERRITÓRIOS OU MUNICÍPIOS */}
            {activeTab === 'ranking' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory 
                        ? `Ranking de Municípios · ${territoryName}` 
                        : 'Ranking Territorial de Oferta de Cursos'
                      }
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      Densidade de cursos de CT&I por localidade
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-[#457B9D] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
                    {selectedTerritory 
                      ? `${municipalityRanking.length} municípios com oferta`
                      : `${territoryRanking.length} territórios`
                    }
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {selectedTerritory ? (
                    municipalityRanking.length > 0 ? (
                      municipalityRanking.map((m) => (
                        <div
                          key={m.name}
                          className="rounded-2xl p-2.5 border bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#D6EAF8] shadow-2xs transition-all flex items-center justify-between gap-3"
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
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-2xs"
                              style={{ backgroundColor: m.heatColor === '#E2E8F0' ? '#64748B' : m.heatColor }}
                            >
                              {m.count} {m.count === 1 ? 'curso' : 'cursos'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                        <MapPin size={28} className="mb-2 opacity-40 text-[#457B9D]" />
                        <p className="text-[12px] font-bold text-[#1D3557]">Nenhum município com cursos cadastrados neste território</p>
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
                              />
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
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ABA 5: TOP INSTITUIÇÕES */}
            {activeTab === 'ies' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-3 shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[#1D3557]">
                      {selectedTerritory 
                        ? `Top Instituições em ${territoryName}` 
                        : 'Top Instituições Ofertantes de Cursos de CT&I'
                      }
                    </h3>
                    <p className="text-[10.5px] text-[#457B9D] font-medium">
                      Clique em uma instituição para filtrar no mapa
                    </p>
                  </div>
                  {selectedIES && (
                    <button
                      type="button"
                      onClick={() => setSelectedIES(null)}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                    >
                      Limpar Filtro
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                  {iesRanking.length > 0 ? (
                    iesRanking.map((ies, idx) => {
                      const isSelected = selectedIES && (
                        (ies.sigla && selectedIES.toUpperCase() === ies.sigla.toUpperCase()) ||
                        selectedIES === ies.fullName
                      );

                      return (
                        <div
                          key={ies.sigla}
                          onClick={() => setSelectedIES(isSelected ? null : (ies.sigla || ies.fullName))}
                          className={`rounded-2xl p-3 flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-white border-[#2563EB] shadow-md ring-2 ring-[#2563EB]/20 border'
                              : 'bg-[#F8FAFC] hover:bg-white hover:border-[#D6EAF8] border border-transparent shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 transition-colors ${
                              isSelected ? 'bg-[#2563EB] text-white' : 'bg-[#2563EB]/10 text-[#2563EB]'
                            }`}>
                              #{idx + 1}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-[12px] font-black text-[#1D3557] truncate">
                                  {ies.sigla}
                                </h4>
                                {isSelected && (
                                  <span className="bg-[#2563EB] text-white text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                    <Check size={9} strokeWidth={3} />
                                    Ativa no Mapa
                                  </span>
                                )}
                              </div>
                              <span className="text-[10.5px] text-[#457B9D] font-bold truncate" title={ies.fullName}>
                                {ies.fullName}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9.5px] font-bold text-[#457B9D] bg-[#E2E8F0]/50 px-2 py-0.5 rounded-full">
                              {ies.municipios.size} {ies.municipios.size === 1 ? 'cidade' : 'cidades'}
                            </span>
                            <span className="text-[11px] font-black text-[#1D3557] bg-[#D6EAF8] px-2.5 py-0.5 rounded-full">
                              {ies.count} {ies.count === 1 ? 'curso' : 'cursos'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94A3B8]">
                      <Building2 size={28} className="mb-2 opacity-40 text-[#457B9D]" />
                      <p className="text-[12px] font-bold text-[#1D3557]">Nenhuma instituição cadastrada neste território</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      </div>

    </main>
  );
}