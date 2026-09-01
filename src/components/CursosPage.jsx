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
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                            Módulo de Cursos de CT&I
                        </h1>
                        <span className="bg-primary-600/10 text-primary-600 text-[11px] font-medium uppercase px-2.5 py-1 rounded-full border border-primary-600/20 flex items-center gap-1">
                            <Flame size={12} className="text-primary-600" />
                            Heatmap Territorial
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5 font-medium">
                        Mapeamento territorial e densidade de cursos de ensino superior em Ciência, Tecnologia e Inovação
                    </p>
                    <div className="divider-territorial w-48 mt-3"></div>
                </div>
            </div>

            {/* GRID DE KPIS */}
            <div className="w-full relative z-10 shrink-0">
                <div className="grid grid-cols-5 gap-3.5 items-stretch w-full">
                    {kpis.map((kpi, index) => (
                        <div
                            key={index}
                            className={`h-[98px] bg-surface rounded-xl p-4 flex flex-col justify-between border border-border shadow-sm hover:shadow-md transition-shadow duration-200 cursor-default ${index === 0 ? 'kpi-accent-primary' : index === 1 ? 'kpi-accent-success' : index === 2 ? 'kpi-accent-accent' : index === 3 ? 'kpi-accent-warning' : 'kpi-accent-neutral'}`}
                        >
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="w-7 h-7 rounded-lg bg-primary-200/70 text-text-secondary flex items-center justify-center shrink-0">
                                        <kpi.icon size={14} strokeWidth={2.5} />
                                    </div>
                                    <span
                                        className="text-[11px] font-medium uppercase text-text-secondary truncate"
                                        title={kpi.label}
                                    >
                                        {kpi.label}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center w-full min-w-0 pt-1">
                                <span className="text-[30px] font-medium text-text-primary tracking-tight leading-none text-center">
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
                    className="shrink-0 bg-surface rounded-xl border border-border shadow-sm relative overflow-hidden flex flex-col min-h-[460px] transition-[width] duration-300"
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
                    <div className="w-[305px] shrink-0 h-[460px] lg:h-full bg-surface rounded-xl border border-border shadow-sm p-4 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/70 shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[12px] font-semibold text-text-primary truncate">
                                    Cursos de CT&I
                                </span>
                                <span className="bg-primary-600/10 text-primary-600 text-[9.5px] font-medium px-2 py-0.5 rounded-full shrink-0">
                                    {compactCursosList.length}
                                </span>
                            </div>
                            {selectedCursoId && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedCursoId(null)}
                                    className="text-[9.5px] font-medium text-text-secondary hover:text-red-600 bg-surface-soft hover:bg-danger-50 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                                >
                                    <span>Limpar</span>
                                    <X size={10} />
                                </button>
                            )}
                        </div>

                        <div className="relative my-2 shrink-0">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={sidebarSearch}
                                onChange={(e) => setSidebarSearch(e.target.value)}
                                placeholder="Filtrar curso, IES ou cidade..."
                                className="w-full pl-7 pr-3 py-1.5 text-[10.5px] bg-surface-soft border border-border rounded-xl focus:bg-surface focus:border-primary-600 focus:outline-none transition-colors placeholder-text-muted"
                            />
                            {sidebarSearch && (
                                <button
                                    type="button"
                                    onClick={() => setSidebarSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[11px] font-medium"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0 min-h-0">
                            {compactCursosList.length > 0 ? (
                                compactCursosList.map((c, idx) => {
                                    const catColor = categoryColorMap[c.categoria || c.tipo] || '#64748B';
                                    const cursoKey = c.id_curso || c.id || `${c.curso || c.nome}-${c.municipio}-${idx}`;
                                    const isSelected = selectedCursoId === cursoKey;

                                    return (
                                        <div
                                            key={cursoKey}
                                            onClick={() => setSelectedCursoId(prev => prev === cursoKey ? null : cursoKey)}
                                            className={`p-2 flex items-center justify-between gap-2 transition-colors duration-200 group cursor-pointer border-b border-neutral-200/50 w-full ${isSelected
                                                    ? 'bg-primary-50/50'
                                                    : 'bg-transparent hover:bg-surface-soft'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform ${isSelected ? 'scale-105 shadow-2xs' : ''
                                                        }`}
                                                    style={{ backgroundColor: `${catColor}18`, color: catColor }}
                                                >
                                                    <GraduationCap size={12} />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <h5 className={`text-[11px] font-bold leading-tight truncate transition-colors ${isSelected ? 'text-primary-800' : 'text-text-primary group-hover:text-primary-600'
                                                        }`}>
                                                        {c.curso || c.nome}
                                                    </h5>
                                                    <span className="text-[9.5px] text-text-secondary truncate leading-tight">
                                                        {c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)} • <strong className="font-semibold text-text-secondary">{c.municipio}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <span
                                                    className="text-[8px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap"
                                                    style={{ backgroundColor: `${catColor}15`, color: catColor }}
                                                >
                                                    {c.categoria || c.tipo || 'Geral'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-text-muted">
                                    <p className="text-[11px] font-medium">Nenhum curso encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* LADO DIREITO: CATÁLOGO COM A NOVA ABA DE CURSOS EAD */
                    <div className="flex-1 flex flex-col gap-4 h-full min-h-0 animate-in fade-in duration-200">

                        {/* BARRA SUPERIOR DE ABAS */}
                        <div className="bg-surface rounded-xl p-2.5 border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">

                            <div className="flex items-center bg-surface-soft p-1 rounded-xl border border-border gap-1 w-full sm:w-auto overflow-x-auto">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('catalogo')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'catalogo'
                                            ? 'bg-primary-900 text-white shadow-xs'
                                            : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <BookOpen size={13} />
                                    Catálogo ({filteredCursos.length})
                                </button>

                                {/* NOVA ABA ISOLADA: CURSOS EAD */}
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('ead')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'ead'
                                            ? 'bg-primary-900 text-white shadow-xs'
                                            : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <Laptop size={13} />
                                    Cursos EaD e Semipresenciais ({filteredEadCursos.length})
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('areas')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'areas'
                                            ? 'bg-primary-900 text-white shadow-xs'
                                            : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <Filter size={13} />
                                    Áreas ({categoryStats.length})
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('ranking')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'ranking'
                                            ? 'bg-primary-900 text-white shadow-xs'
                                            : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <TrendingUp size={13} />
                                    {selectedTerritory ? 'Ranking Municípios' : 'Ranking Territórios'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('ies')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'ies'
                                            ? 'bg-primary-900 text-white shadow-xs'
                                            : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <Building2 size={13} />
                                    Top Instituições {selectedIES && <span className="w-2 h-2 rounded-full bg-primary-600"></span>}
                                </button>
                            </div>

                            {/* INPUT DE BUSCA */}
                            <div className="relative w-full sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar curso, instituição ou cidade..."
                                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-soft border border-border text-[11px] text-text-primary placeholder-text-muted focus:bg-surface focus:border-primary-600 focus:outline-none transition-colors"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[12px] font-medium"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                        </div>

                        {/* CONTEÚDO DAS ABAS */}
                        <div className="flex-1 bg-surface rounded-xl border border-transparent shadow-card-soft p-5 flex flex-col min-h-0 overflow-hidden">

                            {/* ABA 1: CATÁLOGO COMPLETO DE CURSOS PRESENCIAIS */}
                            {activeTab === 'catalogo' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-[13px] font-semibold text-text-primary">
                                                {selectedTerritory ? `Cursos Presenciais em ${territoryName}` : 'Cursos Presenciais de CT&I'}
                                            </h3>
                                            <span className="bg-primary-600/10 text-primary-600 text-[11px] font-medium px-2 py-0.5 rounded-full">
                                                {filteredCursos.length} resultados
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {selectedIES && (
                                                <span className="text-[11px] font-medium text-text-primary bg-primary-600/10 border border-primary-600/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                    <Building2 size={11} className="text-primary-600" />
                                                    {selectedIES}
                                                </span>
                                            )}
                                            {selectedTerritory && (
                                                <span className="text-[10.5px] font-medium text-text-primary bg-primary-200/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                                                    <MapPin size={11} className="text-primary-600" />
                                                    {territoryName}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0 min-h-0">
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
                                                        className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors duration-200 group cursor-pointer border-b border-neutral-200/50 ${isSelected
                                                                ? 'bg-primary-50/50'
                                                                : 'bg-transparent hover:bg-surface-soft'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div
                                                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5  transition-transform"
                                                                style={{ backgroundColor: `${catColor}15` }}
                                                            >
                                                                <GraduationCap size={16} style={{ color: catColor }} />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <h4 className="text-[12px] font-semibold text-text-primary group-hover:text-blue-600 transition-colors leading-tight truncate">
                                                                    {c.curso || c.nome}
                                                                </h4>
                                                                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-text-secondary mt-0.5 font-medium">
                                                                    <span className="font-medium text-text-primary">{c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)}</span>
                                                                    <span>•</span>
                                                                    <span>{c.municipio}</span>
                                                                    <span>•</span>
                                                                    <span className="text-text-secondary">{c.territorio_identidade}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                            <span className="text-[9.5px] font-medium px-2 py-0.5 rounded-md bg-surface-soft text-text-secondary border border-border/60">
                                                                Presencial
                                                            </span>
                                                            <span
                                                                className="text-[9px] font-medium px-2.5 py-1 rounded-full"
                                                                style={{ backgroundColor: `${catColor}15`, color: catColor }}
                                                            >
                                                                {c.categoria || c.tipo || 'Geral'}
                                                            </span>
                                                            {c.url_referencia && (
                                                                <a
                                                                    href={c.url_referencia}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-1 rounded-lg text-text-muted hover:text-primary-600 hover:bg-primary-200/50 transition-colors"
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
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                <GraduationCap size={32} className="mb-2 opacity-40 text-text-secondary" />
                                                <p className="text-[12px] font-medium text-text-primary">Nenhum curso presencial encontrado</p>
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
                                            <h3 className="text-[13px] font-semibold text-text-primary">
                                                {selectedTerritory ? `Cursos EaD em ${territoryName}` : 'Oferta de Cursos à Distância (EaD) e Semipresenciais'}
                                            </h3>
                                            <span className="bg-primary-50 text-primary-700 text-[11px] font-medium px-2 py-0.5 rounded-full border border-primary-200/60">
                                                {filteredEadCursos.length} cursos
                                            </span>
                                        </div>

                                        {selectedTerritory && (
                                            <span className="text-[10.5px] font-medium text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-primary-200/60">
                                                <MapPin size={11} className="text-primary-600" />
                                                {territoryName}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0 min-h-0">
                                        {filteredEadCursos.length > 0 ? (
                                            filteredEadCursos.map((c, idx) => {
                                                const catColor = categoryColorMap[c.categoria || c.tipo] || '#2563EB';

                                                return (
                                                    <div
                                                        key={c.id || idx}
                                                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors duration-200 bg-transparent hover:bg-surface-soft border-b border-neutral-200/50 group cursor-pointer"
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 mt-0.5 transition-transform">
                                                                 <Laptop size={16} />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <h4 className="text-[12px] font-semibold text-text-primary group-hover:text-primary-600 transition-colors leading-tight truncate">
                                                                    {c.curso || c.nome}
                                                                </h4>
                                                                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-text-secondary mt-0.5 font-medium">
                                                                    <span className="font-medium text-text-primary">
                                                                        {c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{c.municipio}</span>
                                                                    <span>•</span>
                                                                    <span className="text-text-secondary">{c.territorio_identidade}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                            <span className="text-[9.5px] font-medium px-2 py-0.5 rounded-md bg-primary-100 text-primary-800 border border-primary-200 flex items-center gap-1 shadow-2xs">
                                                                <Wifi size={10} strokeWidth={2.5} />
                                                                 EaD
                                                            </span>
                                                            <span
                                                                className="text-[9px] font-medium px-2.5 py-1 rounded-full"
                                                                style={{ backgroundColor: `${catColor}15`, color: catColor }}
                                                            >
                                                                {c.categoria || c.tipo || 'Geral'}
                                                            </span>
                                                            {c.url_referencia && (
                                                                <a
                                                                    href={c.url_referencia}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-1 rounded-lg text-text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
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
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                <Laptop size={32} className="mb-2 opacity-40 text-primary-600" />
                                                <p className="text-[12px] font-medium text-text-primary">Nenhum curso EaD registrado neste território</p>
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
                                            <h3 className="text-[13px] font-semibold text-text-primary">
                                                {selectedTerritory
                                                    ? `Áreas de Conhecimento em ${territoryName}`
                                                    : 'Distribuição por Áreas de Conhecimento'
                                                }
                                            </h3>
                                            <p className="text-[10.5px] text-text-secondary font-medium">
                                                {selectedTerritory
                                                    ? `Exibindo proporção dos ${territoryCursos.length} cursos presenciais neste território`
                                                    : 'Clique em uma categoria para filtrar o catálogo'
                                                }
                                            </p>
                                        </div>
                                        {selectedTerritory && (
                                            <span className="text-[11px] font-medium text-text-primary bg-primary-200/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <MapPin size={11} className="text-primary-600" />
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
                                                        className={`rounded-xl p-3.5 border transition-all cursor-pointer ${isSelected
                                                                ? 'bg-surface border-primary-600 shadow-md ring-2 ring-primary-600/20'
                                                                : 'bg-surface-soft border-transparent hover:bg-surface hover:border-primary-200 shadow-2xs'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span
                                                                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                                                                    style={{ backgroundColor: cat.color }}
                                                                />
                                                                <span className="text-[12px] font-semibold text-text-primary truncate">
                                                                    {cat.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[12px] font-semibold text-text-primary">
                                                                    {cat.count} {cat.count === 1 ? 'curso' : 'cursos'}
                                                                </span>
                                                                <span
                                                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                                                                >
                                                                    {cat.percent}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                                                            <div
                                                                className="h-full rounded-lg transition-all duration-500"
                                                                style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                <Filter size={28} className="mb-2 opacity-40 text-text-secondary" />
                                                <p className="text-[12px] font-medium text-text-primary">Nenhuma área de ensino registrada</p>
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
                                            <h3 className="text-[13px] font-semibold text-text-primary">
                                                {selectedTerritory
                                                    ? `Ranking de Municípios · ${territoryName}`
                                                    : 'Ranking Territorial de Oferta de Cursos'
                                                }
                                            </h3>
                                            <p className="text-[10.5px] text-text-secondary font-medium">
                                                Densidade de cursos de CT&I por localidade
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-semibold text-text-secondary bg-surface-soft px-2.5 py-1 rounded-full">
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
                                                        className="rounded-xl p-2.5 border bg-surface-soft border-transparent hover:bg-surface hover:border-primary-200 shadow-2xs transition-all flex items-center justify-between gap-3"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 ${m.rank <= 3 ? 'bg-primary-900 text-white' : 'bg-border text-text-secondary'
                                                                }`}>
                                                                {m.rank}
                                                            </span>
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="text-[11px] font-semibold text-text-primary truncate">
                                                                    {m.name}
                                                                </span>
                                                                <div className="w-full h-1.5 rounded-full bg-border overflow-hidden mt-1">
                                                                    <div
                                                                        className="h-full rounded-lg transition-all duration-300"
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
                                                                className="text-[11px] font-medium px-2 py-0.5 rounded-full text-white shadow-2xs"
                                                                style={{ backgroundColor: m.heatColor === '#E2E8F0' ? '#64748B' : m.heatColor }}
                                                            >
                                                                {m.count} {m.count === 1 ? 'curso' : 'cursos'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                    <MapPin size={28} className="mb-2 opacity-40 text-text-secondary" />
                                                    <p className="text-[12px] font-medium text-text-primary">Nenhum município com cursos cadastrados neste território</p>
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
                                                    className="rounded-xl p-2.5 border transition-all cursor-pointer flex items-center justify-between gap-3 bg-surface-soft border-transparent hover:bg-surface hover:border-primary-200 shadow-2xs"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 ${t.rank <= 3 ? 'bg-primary-900 text-white' : 'bg-border text-text-secondary'
                                                            }`}>
                                                            {t.rank}
                                                        </span>
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <span className="text-[11px] font-semibold text-text-primary truncate">
                                                                {t.name}
                                                            </span>
                                                            <div className="w-full h-1.5 rounded-full bg-border overflow-hidden mt-1">
                                                                <div
                                                                    className="h-full rounded-lg transition-all duration-300"
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
                                                            className="text-[11px] font-medium px-2 py-0.5 rounded-full text-white shadow-2xs"
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
                                            <h3 className="text-[13px] font-semibold text-text-primary">
                                                {selectedTerritory
                                                    ? `Top Instituições em ${territoryName}`
                                                    : 'Top Instituições Ofertantes de Cursos de CT&I'
                                                }
                                            </h3>
                                            <p className="text-[10.5px] text-text-secondary font-medium">
                                                Clique em uma instituição para filtrar no mapa
                                            </p>
                                        </div>
                                        {selectedIES && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedIES(null)}
                                                className="text-[11px] font-medium text-danger-600 hover:text-red-700 bg-danger-50 px-2.5 py-1 rounded-full cursor-pointer transition-colors"
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
                                                        className={`rounded-xl p-3 flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${isSelected
                                                                ? 'bg-surface border-primary-600 shadow-md ring-2 ring-primary-600/20 border'
                                                                : 'bg-surface-soft hover:bg-surface hover:border-primary-200 border border-transparent shadow-2xs'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[11px] shrink-0 transition-colors ${isSelected ? 'bg-primary-600 text-white' : 'bg-primary-600/10 text-primary-600'
                                                                }`}>
                                                                #{idx + 1}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <h4 className="text-[12px] font-semibold text-text-primary truncate">
                                                                        {ies.sigla}
                                                                    </h4>
                                                                    {isSelected && (
                                                                        <span className="bg-primary-600 text-white text-[8.5px] font-semibold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                                                            <Check size={9} strokeWidth={3} />
                                                                            Ativa no Mapa
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10.5px] text-text-secondary font-medium truncate" title={ies.fullName}>
                                                                    {ies.fullName}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-[9.5px] font-medium text-text-secondary bg-border/50 px-2 py-0.5 rounded-full">
                                                                {ies.municipios.size} {ies.municipios.size === 1 ? 'cidade' : 'cidades'}
                                                            </span>
                                                            <span className="text-[11px] font-medium text-text-primary bg-primary-200 px-2.5 py-0.5 rounded-full">
                                                                {ies.count} {ies.count === 1 ? 'curso' : 'cursos'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                <Building2 size={28} className="mb-2 opacity-40 text-text-secondary" />
                                                <p className="text-[12px] font-medium text-text-primary">Nenhuma instituição cadastrada neste território</p>
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