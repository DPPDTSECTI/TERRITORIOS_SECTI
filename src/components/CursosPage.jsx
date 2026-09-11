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
    Laptop,
    SunMedium
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { isMunicipioSemiarido } from '../constants/semiarido';
import SideMap, { getHeatColor } from './maps/SideMap';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import { normalize } from '../utils/normalization';

const PALETTE_CORES = ['#2563EB', '#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

const SEMIARIDO_PALETTE_CORES = [
    '#D97706', // Âmbar Intenso
    '#F59E0B', // Âmbar Dourado
    '#CA8A04', // Ouro Mostarda
    '#B45309', // Âmbar Terracota
    '#EAB308', // Amarelo Girassol
    '#FBBF24', // Calêndula Solar
    '#92400E', // Castanho Dourado
    '#CD7F32', // Bronze Âmbar
    '#D48806', // Mel Queimado
    '#ECC94B', // Trigo Ouro
    '#B8860B', // Dark Goldenrod
    '#78350F'  // Ocre Profundo
];

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
        loadingStats = false,
        filtroSemiarido = false,
        setFiltroSemiarido
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

    // Subconjunto ativo com respeito ao Semiárido
    const activeScopedCursos = useMemo(() => {
        if (!territoryCursos || territoryCursos.length === 0) return [];
        if (!filtroSemiarido) return territoryCursos;
        return territoryCursos.filter(c => isMunicipioSemiarido(c.municipio));
    }, [territoryCursos, filtroSemiarido]);

    // 1. Filtragem Geral dos Cursos Presenciais
    const filteredCursos = useMemo(() => {
        if (!cursosData || cursosData.length === 0) return [];
        let list = cursosData;

        if (filtroSemiarido) {
            list = list.filter(c => isMunicipioSemiarido(c.municipio));
        }

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
            const q = normalize(searchQuery);
            list = list.filter(c =>
                normalize(c.curso || c.nome).includes(q) ||
                normalize(c.entidade).includes(q) ||
                normalize(c.instituicao).includes(q) ||
                normalize(c.sigla).includes(q) ||
                normalize(c.municipio).includes(q) ||
                normalize(c.categoria || c.tipo).includes(q) ||
                normalize(c.territorio_identidade).includes(q)
            );
        }

        return list;
    }, [cursosData, selectedCategory, selectedIES, selectedTerritory, searchQuery, filtroSemiarido]);

    // 1.1 Filtragem Exclusiva dos Cursos EaD
    const filteredEadCursos = useMemo(() => {
        if (!cursosEadData || cursosEadData.length === 0) return [];
        let list = cursosEadData;

        if (filtroSemiarido) {
            list = list.filter(c => isMunicipioSemiarido(c.municipio));
        }

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
            const q = normalize(searchQuery);
            list = list.filter(c =>
                normalize(c.curso || c.nome).includes(q) ||
                normalize(c.entidade).includes(q) ||
                normalize(c.instituicao).includes(q) ||
                normalize(c.sigla).includes(q) ||
                normalize(c.municipio).includes(q) ||
                normalize(c.categoria || c.tipo).includes(q) ||
                normalize(c.territorio_identidade).includes(q)
            );
        }

        return list;
    }, [cursosEadData, selectedCategory, selectedIES, selectedTerritory, searchQuery]);

    const compactCursosList = useMemo(() => {
        if (!sidebarSearch.trim()) return filteredCursos;
        const q = normalize(sidebarSearch);
        return filteredCursos.filter(c =>
            normalize(c.curso || c.nome).includes(q) ||
            normalize(c.sigla).includes(q) ||
            normalize(c.entidade).includes(q) ||
            normalize(c.instituicao).includes(q) ||
            normalize(c.municipio).includes(q) ||
            normalize(c.categoria || c.tipo).includes(q)
        );
    }, [filteredCursos, sidebarSearch]);

    const cursosDataForMap = useMemo(() => {
        let list = cursosData;
        if (filtroSemiarido) {
            list = list.filter(c => isMunicipioSemiarido(c.municipio));
        }
        if (selectedCategory && selectedCategory !== 'todas') {
            list = list.filter(c => (c.categoria || c.tipo) === selectedCategory);
        }
        if (!selectedIES) return list;
        return list.filter(c => {
            const sigla = c.sigla ? String(c.sigla).trim().toUpperCase() : '';
            const ent = c.entidade || c.instituicao ? String(c.entidade || c.instituicao).trim() : '';
            const cleanEnt = cleanIesName(ent, c.municipio);
            return (
                sigla === selectedIES.toUpperCase() ||
                ent === selectedIES ||
                cleanEnt === selectedIES
            );
        });
    }, [cursosData, selectedCategory, selectedIES, filtroSemiarido]);

    // 2. Mapeamento e Estatísticas de Categorias (Áreas)
    const categoryStats = useMemo(() => {
        if (!activeScopedCursos || activeScopedCursos.length === 0) return [];
        const counts = {};
        const total = activeScopedCursos.length;

        activeScopedCursos.forEach(c => {
            const cat = c.categoria || c.tipo || 'Outras Áreas';
            if (!counts[cat]) {
                counts[cat] = { total: 0 };
            }
            counts[cat].total += 1;
        });

        const palette = filtroSemiarido ? SEMIARIDO_PALETTE_CORES : PALETTE_CORES;

        return Object.entries(counts)
            .map(([name, data], idx) => {
                const percent = total > 0 ? ((data.total / total) * 100).toFixed(1) : '0.0';
                const color = palette[idx % palette.length];
                return {
                    name,
                    count: data.total,
                    percent,
                    color,
                    shortName: name
                };
            })
            .sort((a, b) => b.count - a.count);
    }, [activeScopedCursos, filtroSemiarido]);

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
        const base = filtroSemiarido ? cursosData.filter(c => isMunicipioSemiarido(c.municipio)) : cursosData;
        const counts = {};

        base.forEach(c => {
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
    }, [cursosData, filtroSemiarido]);

    // 3B. Ranking de Municípios
    const municipalityRanking = useMemo(() => {
        const targetList = selectedTerritory ? activeScopedCursos : (filtroSemiarido ? activeScopedCursos : territoryCursos);
        if (!targetList || targetList.length === 0) return [];
        const counts = {};

        targetList.forEach(c => {
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
    }, [selectedTerritory, activeScopedCursos, territoryCursos, filtroSemiarido]);

    // 4. Ranking de Instituições (IES)
    const iesRanking = useMemo(() => {
        if (!activeScopedCursos || activeScopedCursos.length === 0) return [];
        const counts = {};

        activeScopedCursos.forEach(c => {
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
    }, [activeScopedCursos]);

    const totalIesUnicas = useMemo(() => {
        if (!cursosData || cursosData.length === 0) return 0;
        const iesSet = new Set();
        const base = filtroSemiarido ? cursosData.filter(c => isMunicipioSemiarido(c.municipio)) : cursosData;
        base.forEach(c => {
            const nome = c.sigla ? String(c.sigla).trim().toUpperCase() : String(c.entidade || c.instituicao || '').trim();
            if (nome) iesSet.add(nome);
        });
        return iesSet.size;
    }, [cursosData, filtroSemiarido]);

    const territoriosComCursosCount = useMemo(() => {
        if (!filtroSemiarido && territoriosData && territoriosData.length > 0) {
            return territoriosData.filter(t => Number(t.qtd_cursos_cti || 0) > 0).length;
        }
        return territoryRanking.length;
    }, [territoriosData, territoryRanking, filtroSemiarido]);

    const cursosSemiaridoCount = useMemo(() => {
        if (!territoriosData || territoriosData.length === 0) return 0;
        return territoriosData
            .filter(t => Number(t.qtd_mun_semiarido || 0) > 0)
            .reduce((acc, t) => acc + Number(t.qtd_cursos_cti || 0), 0);
    }, [territoriosData]);

    const semiaridoMetrics = useMemo(() => {
        const totalCursos = territoryCursos.length || 1;
        const semiCursos = territoryCursos.filter(c => isMunicipioSemiarido(c.municipio)).length;
        const pctCursos = ((semiCursos / totalCursos) * 100).toFixed(0);
        return { semiCursos, pctCursos };
    }, [territoryCursos]);

    const kpis = [
        {
            label: filtroSemiarido
                ? (selectedTerritory ? `Cursos no Semiárido · ${territoryName}` : 'Cursos CT&I no Semiárido')
                : (selectedTerritory ? `Cursos em ${territoryName}` : 'Cursos Presenciais de CT&I'),
            value: loadingStats ? '...' : (filtroSemiarido ? semiaridoMetrics.semiCursos : (selectedTerritory ? territoryCursos.length : (kpisGlobais?.cursos != null ? kpisGlobais.cursos : cursosData.length))),
            percent: filtroSemiarido ? `${semiaridoMetrics.pctCursos}% do total` : null,
            tooltip: filtroSemiarido
                ? `No Semiárido: ${semiaridoMetrics.semiCursos} (${semiaridoMetrics.pctCursos}% do total de cursos) | Fora: ${Math.max(0, territoryCursos.length - semiaridoMetrics.semiCursos)}`
                : undefined,
            icon: GraduationCap
        },
        {
            label: filtroSemiarido ? 'Territórios com Oferta (Semiárido)' : 'Territórios com Oferta',
            value: loadingStats ? '...' : (filtroSemiarido ? `${territoryRanking.length} territórios` : `${territoriosComCursosCount} / ${territoriosData.length || 27}`),
            icon: MapPin
        },
        {
            label: filtroSemiarido ? 'IES com Oferta no Semiárido' : 'Instituições Ofertantes',
            value: loadingStats ? '...' : totalIesUnicas,
            icon: Building2
        },
        {
            label: filtroSemiarido ? 'Municípios com Oferta' : 'Cursos no Semiárido',
            value: loadingStats ? '...' : (filtroSemiarido ? `${municipalityRanking.length} munic.` : cursosSemiaridoCount),
            icon: Database
        },
        {
            label: categoryStats[0] ? (filtroSemiarido ? `Principal: ${categoryStats[0].name}` : categoryStats[0].name) : 'Principal Área',
            value: loadingStats ? '...' : (categoryStats[0] ? `${categoryStats[0].percent}%` : '-'),
            icon: Sparkles
        }
    ];

    return (
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-5 bg-transparent font-sans w-full">

            {/* ================= ATMOSFERA: SOL DO SEMIÁRIDO ================= */}
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 overflow-hidden z-0 transition-opacity duration-700 ease-in-out select-none ${
                    filtroSemiarido ? 'opacity-100' : 'opacity-0'
                }`}
            >
                {/* 1. HALO RADIAL DIFUSO */}
                <div
                    className="absolute -top-[18vw] -right-[12vw] w-[62vw] h-[62vw] min-w-[550px] min-h-[550px] max-w-[1080px] max-h-[1080px] rounded-full animate-sun-breath"
                    style={{
                        background: 'radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.07) 30%, rgba(251, 191, 36, 0.03) 55%, transparent 75%)',
                        filter: 'blur(35px)',
                    }}
                />

                {/* 2. ARCO / ANEL LUMINOSO */}
                <div
                    className="absolute -top-[16vw] -right-[10vw] w-[54vw] h-[54vw] min-w-[480px] min-h-[480px] max-w-[940px] max-h-[940px] rounded-full animate-sun-arc"
                    style={{
                        border: '1.5px solid rgba(245, 158, 11, 0.22)',
                        boxShadow: '0 0 45px rgba(251, 191, 36, 0.10), inset 0 0 45px rgba(245, 158, 11, 0.04)',
                        maskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0) 70%)',
                        WebkitMaskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0) 70%)',
                    }}
                />

                {/* 3. SEGUNDO ARCO EXPANSIVO */}
                <div
                    className="absolute -top-[22vw] -right-[16vw] w-[70vw] h-[70vw] min-w-[620px] min-h-[620px] max-w-[1220px] max-h-[1220px] rounded-full animate-sun-breath"
                    style={{
                        border: '1px solid rgba(217, 119, 6, 0.11)',
                        maskImage: 'linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0) 60%)',
                        WebkitMaskImage: 'linear-gradient(to bottom left, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0) 60%)',
                    }}
                />

                {/* 4. GLOW DOURADO DE TOPO */}
                <div
                    className="absolute top-0 right-0 w-[460px] h-[320px] rounded-full opacity-60 animate-sun-breath"
                    style={{
                        background: 'radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.02) 50%, transparent 80%)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            {/* HEADER DA PÁGINA */}
            <div className="flex items-center justify-between w-full pr-[320px] shrink-0 relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                            Módulo de Ensino Superior em CT&I
                        </h1>
                        <span className={`${filtroSemiarido ? 'bg-amber-500/15 text-amber-800 border-amber-500/30' : 'bg-primary-600/10 text-primary-600 border-primary-600/20'} text-[11px] font-medium uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 justify-center leading-none`}>
                            <Flame size={16} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />
                            Somente Oferta de CT&I
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5 font-medium">
                        Mapeamento territorial da oferta presencial de ensino superior voltada exclusivamente a Ciência, Tecnologia e Inovação (CT&I)
                    </p>
                    <div className={`divider-territorial w-48 mt-3 ${filtroSemiarido ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-transparent' : ''}`}></div>
                </div>
            </div>

            {/* GRID DE KPIS */}
            <div className="tour-kpis w-full relative z-10 shrink-0">
                <div className="grid grid-cols-5 gap-4 items-stretch w-full">
                    {kpis.map((kpi, index) => {
                        const isHero = index === 0;
                        const accentColors = [
                            'text-white/70',
                            'text-[#0D9488]',
                            'text-accent-600',
                            'text-warning-600',
                            'text-success-600'
                        ];

                        return (
                            <div
                                key={index}
                                title={kpi.tooltip || kpi.label}
                                className={`relative rounded-2xl p-4 flex flex-col justify-between h-[88px] cursor-default overflow-hidden transition-all duration-500 hover:shadow-card-elevated ${
                                    isHero
                                        ? (filtroSemiarido
                                            ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-card-elevated shadow-amber-500/20'
                                            : 'bg-primary-900 text-white shadow-card-elevated')
                                        : (filtroSemiarido
                                            ? 'bg-white/95 border border-amber-200/40 shadow-card'
                                            : 'bg-surface border border-neutral-100 shadow-card')
                                }`}
                            >
                                {/* LINHA SUPERIOR: ÍCONE + TÍTULO */}
                                <div className="flex items-center gap-2 w-full min-w-0">
                                    <kpi.icon size={16} strokeWidth={2} className={isHero ? (filtroSemiarido ? 'text-white/90' : accentColors[0]) : accentColors[index]} />
                                    <span
                                        className={`text-[11px] font-medium uppercase tracking-wider truncate flex-1 ${
                                            isHero ? (filtroSemiarido ? 'text-amber-100' : 'text-white/60') : 'text-text-muted'
                                        }`}
                                        title={kpi.label}
                                    >
                                        {kpi.label}
                                    </span>
                                </div>

                                {/* LINHA INFERIOR: NÚMERO */}
                                <div className="flex items-baseline w-full justify-between">
                                    <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
                                        <span className={`text-[28px] font-bold tracking-tight leading-none ${
                                            isHero ? 'text-white' : 'text-text-primary'
                                        }`}>
                                            {kpi.value}
                                        </span>
                                        {filtroSemiarido && kpi.percent && (
                                            <span
                                                title={`(${kpi.percent})`}
                                                className={`text-[11px] font-semibold truncate ${
                                                    isHero ? 'text-amber-100/90 font-medium' : 'text-amber-600'
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

            {/* GRID PRINCIPAL: MAPA + DASHBOARD */}
            <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]">

                {/* LADO ESQUERDO: MAPA */}
                <div
                    style={{ width: isMapExpanded ? 'calc(100% - 320px)' : 'calc(40% - 12px)' }}
                    className="shrink-0 bg-surface rounded-2xl border border-neutral-100 shadow-card relative overflow-hidden flex flex-col min-h-[460px] transition-[width] duration-300"
                >
                    <SideMap
                        mode="cursos"
                        cursosData={cursosDataForMap}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
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
                                <span className={`${filtroSemiarido ? 'bg-amber-500/15 text-amber-700' : 'bg-primary-600/10 text-primary-600'} text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 inline-flex items-center justify-center leading-none`}>
                                    {compactCursosList.length}
                                </span>
                            </div>
                            {selectedCursoId && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedCursoId(null)}
                                    className="text-[10px] font-medium text-text-secondary hover:text-red-600 bg-surface-soft hover:bg-danger-50 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer shrink-0 justify-center leading-none"
                                >
                                    <span>Limpar</span>
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <div className="relative my-2 shrink-0">
                            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={sidebarSearch}
                                onChange={(e) => setSidebarSearch(e.target.value)}
                                placeholder="Filtrar curso, IES ou cidade..."
                                className={`w-full pl-7 pr-3 py-1.5 text-[11px] bg-surface-soft border border-border rounded-xl focus:bg-surface ${filtroSemiarido ? 'focus:border-amber-500' : 'focus:border-primary-600'} focus:outline-none transition-colors placeholder-text-muted`}
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
                                                    ? (filtroSemiarido ? 'bg-amber-500/15' : 'bg-primary-50/50')
                                                    : 'bg-transparent hover:bg-surface-soft'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform ${isSelected ? 'scale-105 shadow-2xs' : ''
                                                        }`}
                                                    style={{
                                                        backgroundColor: `${catColor}20`,
                                                        color: catColor
                                                    }}
                                                >
                                                    <GraduationCap size={16} />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <h5 className={`text-[11px] font-bold leading-tight truncate transition-colors ${isSelected ? (filtroSemiarido ? 'text-amber-800' : 'text-primary-800') : (filtroSemiarido ? 'text-text-primary group-hover:text-amber-600' : 'text-text-primary group-hover:text-primary-600')
                                                        }`}>
                                                        {c.curso || c.nome}
                                                    </h5>
                                                    <span className="text-[10px] text-text-secondary truncate leading-tight">
                                                        {c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)} • <strong className="font-semibold text-text-secondary">{c.municipio}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <span
                                                    className="text-[8px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap inline-flex items-center justify-center leading-none"
                                                    style={{ backgroundColor: `${catColor}18`, color: catColor }}
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
                        <div className="bg-surface rounded-2xl p-2.5 border border-neutral-100 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">

                            <div className="flex items-center bg-surface-soft p-1 rounded-xl border border-border gap-1 w-full sm:w-auto overflow-x-auto">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('catalogo')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'catalogo'
                                            ? (filtroSemiarido ? 'bg-amber-600 text-white shadow-xs' : 'bg-primary-900 text-white shadow-xs')
                                            : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <BookOpen size={16} />
                                    Catálogo ({filteredCursos.length})
                                </button>

                                {/* NOVA ABA ISOLADA: CURSOS EAD */}
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('ead')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'ead'
                                            ? (filtroSemiarido ? 'bg-amber-600 text-white shadow-xs' : 'bg-primary-900 text-white shadow-xs')
                                            : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <Laptop size={16} />
                                    Cursos EaD e Semipresenciais ({filteredEadCursos.length})
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('areas')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'areas'
                                            ? (filtroSemiarido ? 'bg-amber-600 text-white shadow-xs' : 'bg-primary-900 text-white shadow-xs')
                                            : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <Filter size={16} />
                                    Áreas ({categoryStats.length})
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('ranking')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'ranking'
                                            ? (filtroSemiarido ? 'bg-amber-600 text-white shadow-xs' : 'bg-primary-900 text-white shadow-xs')
                                            : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <TrendingUp size={16} />
                                    {selectedTerritory ? 'Ranking Municípios' : 'Ranking Territórios'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('ies')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'ies'
                                            ? (filtroSemiarido ? 'bg-amber-600 text-white shadow-xs' : 'bg-primary-900 text-white shadow-xs')
                                            : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <Building2 size={16} />
                                    Top Instituições {selectedIES && <span className={`w-2 h-2 rounded-full ${filtroSemiarido ? 'bg-amber-500' : 'bg-primary-600'}`}></span>}
                                </button>
                            </div>

                            {/* INPUT DE BUSCA */}
                            <div className="relative w-full sm:w-64">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (e.target.value.trim() && activeTab !== 'catalogo' && activeTab !== 'ead') {
                                            setActiveTab('catalogo');
                                        }
                                    }}
                                    placeholder="Buscar curso, instituição ou cidade..."
                                    className={`w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-soft border border-border text-[11px] text-text-primary placeholder-text-muted focus:bg-surface ${filtroSemiarido ? 'focus:border-amber-500' : 'focus:border-primary-600'} focus:outline-none transition-colors`}
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
                        <div className="flex-1 bg-surface rounded-2xl border border-neutral-100 shadow-card p-5 flex flex-col min-h-0 overflow-hidden">

                            {/* ABA 1: CATÁLOGO COMPLETO DE CURSOS PRESENCIAIS */}
                            {activeTab === 'catalogo' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-[13px] font-semibold text-text-primary">
                                                {selectedTerritory ? `Cursos Presenciais em ${territoryName}` : 'Cursos Presenciais de CT&I'}
                                            </h3>
                                            <span className={`${filtroSemiarido ? 'bg-amber-500/15 text-amber-700' : 'bg-primary-600/10 text-primary-600'} text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center justify-center leading-none`}>
                                                {filteredCursos.length} resultados
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {selectedIES && (
                                                <span className={`text-[11px] font-medium text-text-primary px-2.5 py-0.5 rounded-full flex items-center gap-1 justify-center leading-none border ${filtroSemiarido ? 'bg-amber-500/15 border-amber-500/30' : 'bg-primary-600/10 border-primary-600/20'}`}>
                                                    <Building2 size={16} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />
                                                    {selectedIES}
                                                </span>
                                            )}
                                            {selectedTerritory && (
                                                <span className={`text-[11px] font-medium text-text-primary px-2.5 py-1 rounded-full flex items-center gap-1 justify-center leading-none ${filtroSemiarido ? 'bg-amber-200/60' : 'bg-primary-200/40'}`}>
                                                    <MapPin size={16} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />
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
                                                                ? (filtroSemiarido ? 'bg-amber-500/15' : 'bg-primary-50/50')
                                                                : 'bg-transparent hover:bg-surface-soft'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div
                                                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform"
                                                                style={{ backgroundColor: `${catColor}20` }}
                                                            >
                                                                <GraduationCap size={16} style={{ color: catColor }} />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <h4 className={`text-[12px] font-semibold text-text-primary ${filtroSemiarido ? 'group-hover:text-amber-600' : 'group-hover:text-blue-600'} transition-colors leading-tight truncate`}>
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
                                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-soft text-text-secondary border border-border/60 inline-flex items-center justify-center leading-none">
                                                                Presencial
                                                            </span>
                                                            <span
                                                                className="text-[9px] font-medium px-2.5 py-1 rounded-full inline-flex items-center justify-center leading-none"
                                                                style={{
                                                                    backgroundColor: `${catColor}20`,
                                                                    color: catColor
                                                                }}
                                                            >
                                                                {c.categoria || c.tipo || 'Geral'}
                                                            </span>
                                                            {c.url_referencia && (
                                                                <a
                                                                    href={c.url_referencia}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className={`p-1 rounded-lg text-text-muted ${filtroSemiarido ? 'hover:text-amber-600 hover:bg-amber-100' : 'hover:text-primary-600 hover:bg-primary-200/50'} transition-colors`}
                                                                    title="Fonte Oficial"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <ExternalLink size={16} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                <GraduationCap size={24} className="mb-2 opacity-40 text-text-secondary" />
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
                                            <span className={`${filtroSemiarido ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-primary-50 text-primary-700 border-primary-200/60'} text-[11px] font-medium px-2 py-0.5 rounded-full border inline-flex items-center justify-center leading-none`}>
                                                {filteredEadCursos.length} cursos
                                            </span>
                                        </div>

                                        {selectedTerritory && (
                                            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 border justify-center leading-none ${filtroSemiarido ? 'text-amber-800 bg-amber-50 border-amber-300' : 'text-primary-700 bg-primary-50 border-primary-200/60'}`}>
                                                <MapPin size={16} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />
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
                                                            <div 
                                                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform"
                                                                style={{ backgroundColor: `${catColor}20`, color: catColor }}
                                                            >
                                                                <Laptop size={16} />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <h4 className={`text-[12px] font-semibold text-text-primary ${filtroSemiarido ? 'group-hover:text-amber-600' : 'group-hover:text-primary-600'} transition-colors leading-tight truncate`}>
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
                                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs justify-center leading-none border ${filtroSemiarido ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-primary-100 text-primary-800 border-primary-200'}`}>
                                                                <Wifi size={16} strokeWidth={2} />
                                                                 EaD
                                                            </span>
                                                            <span
                                                                className="text-[9px] font-medium px-2.5 py-1 rounded-full inline-flex items-center justify-center leading-none"
                                                                style={{ 
                                                                    backgroundColor: `${catColor}20`, 
                                                                    color: catColor 
                                                                }}
                                                            >
                                                                {c.categoria || c.tipo || 'Geral'}
                                                            </span>
                                                            {c.url_referencia && (
                                                                <a
                                                                    href={c.url_referencia}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className={`p-1 rounded-lg text-text-muted ${filtroSemiarido ? 'hover:text-amber-600 hover:bg-amber-100' : 'hover:text-primary-600 hover:bg-primary-50'} transition-colors`}
                                                                    title="Fonte Oficial"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <ExternalLink size={16} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                <Laptop size={24} className={`mb-2 opacity-40 ${filtroSemiarido ? 'text-amber-600' : 'text-primary-600'}`} />
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
                                            <p className="text-[11px] text-text-secondary font-medium">
                                                {selectedTerritory
                                                    ? `Exibindo proporção dos ${territoryCursos.length} cursos presenciais neste território`
                                                    : 'Clique em uma categoria para filtrar o catálogo'
                                                }
                                            </p>
                                        </div>
                                        {selectedTerritory && (
                                            <span className={`text-[11px] font-medium text-text-primary px-2.5 py-1 rounded-full flex items-center gap-1 justify-center leading-none ${filtroSemiarido ? 'bg-amber-200/60' : 'bg-primary-200/40'}`}>
                                                <MapPin size={16} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />
                                                {territoryName}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 min-h-0">
                                        {categoryStats.length > 0 ? (
                                            categoryStats.map((cat) => {
                                                const isSelected = selectedCategory === cat.name;
                                                const dotColor = cat.color;

                                                return (
                                                    <div
                                                        key={cat.name}
                                                        onClick={() => setSelectedCategory(isSelected ? 'todas' : cat.name)}
                                                        className={`rounded-2xl p-3 border transition-all cursor-pointer ${isSelected
                                                                ? (filtroSemiarido ? 'bg-surface border-amber-500 shadow-md ring-2 ring-amber-500/20' : 'bg-surface border-primary-600 shadow-md ring-2 ring-primary-600/20')
                                                                : (filtroSemiarido ? 'bg-surface-soft/60 border-neutral-100 hover:bg-surface hover:border-amber-300 shadow-2xs' : 'bg-surface-soft/60 border-neutral-100 hover:bg-surface hover:border-primary-200 shadow-2xs')
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span
                                                                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                                                                    style={{ backgroundColor: dotColor }}
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
                                                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center justify-center leading-none"
                                                                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                                                >
                                                                    {cat.percent}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className={`w-full h-[18px] rounded-full overflow-hidden relative flex items-center ${filtroSemiarido ? 'bg-amber-50/60' : 'bg-primary-50/50'}`}>
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                <Filter size={24} className="mb-2 opacity-40 text-text-secondary" />
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
                                            <p className="text-[11px] text-text-secondary font-medium">
                                                Densidade de cursos de CT&I por localidade
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-semibold text-text-secondary bg-surface-soft px-2.5 py-1 rounded-full inline-flex items-center justify-center leading-none">
                                            {selectedTerritory
                                                ? `${municipalityRanking.length} municípios com oferta`
                                                : `${territoryRanking.length} territórios`
                                            }
                                        </span>
                                    </div>

                                    {/* LISTA RANKING: RANK + BARRA PROPORCIONAL COM NOME + PILULA DE VALOR */}
                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                                        {selectedTerritory ? (
                                            municipalityRanking.length > 0 ? (
                                                municipalityRanking.map((m, index) => {
                                                    const isFirst = index === 0;
                                                    const rankStr = String(m.rank || index + 1).padStart(2, '0');
                                                    const rankStyle = isFirst
                                                        ? (filtroSemiarido ? 'bg-amber-500 text-white shadow-2xs' : 'bg-primary-500 text-white shadow-2xs')
                                                        : (filtroSemiarido ? 'bg-amber-100 text-amber-800 border border-amber-200/60' : 'bg-primary-100 text-primary-700 border border-primary-200/50');
                                                    const fillColor = isFirst ? (filtroSemiarido ? 'bg-amber-500' : 'bg-primary-500') : (filtroSemiarido ? 'bg-amber-300/80' : 'bg-primary-200');
                                                    const textStyle = isFirst ? 'font-medium text-white' : (filtroSemiarido ? 'font-medium text-amber-950' : 'font-medium text-primary-950');
                                                    const valueStyle = isFirst
                                                        ? (filtroSemiarido ? 'bg-amber-50 text-amber-900 border border-amber-300' : 'bg-primary-50 text-primary-800 border border-primary-200/70')
                                                        : (filtroSemiarido ? 'bg-amber-50/70 text-amber-800 border border-amber-200/60' : 'bg-primary-50 text-primary-700 border border-primary-200/50');

                                                    return (
                                                        <div
                                                            key={m.name}
                                                            title={`${m.name}: ${m.count} cursos`}
                                                            className="flex items-center gap-2 w-full min-w-0 transition-opacity duration-200 hover:opacity-90 cursor-default"
                                                        >
                                                            {/* RANK */}
                                                            <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold tabular-nums leading-none ${rankStyle}`}>
                                                                {rankStr}
                                                            </div>

                                                            {/* BARRA: TRACK + FILL + NOME */}
                                                            <div className={`relative flex-1 h-[24px] rounded-full overflow-hidden min-w-0 flex items-center ${filtroSemiarido ? 'bg-amber-50/60' : 'bg-primary-50/50'}`}>
                                                                <div 
                                                                    className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                                                                    style={{ width: `${Math.max(4, m.percentBar || 0)}%` }}
                                                                />
                                                                <span className={`absolute left-2.5 right-2.5 text-[11.5px] truncate leading-none pointer-events-none select-none z-10 ${textStyle}`}>
                                                                    {m.name}
                                                                </span>
                                                            </div>

                                                            {/* VALOR PILL */}
                                                            <div className={`h-[24px] min-w-[34px] px-2 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold tabular-nums leading-none ${valueStyle}`}>
                                                                {m.count}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                    <MapPin size={24} className="mb-2 opacity-40 text-text-secondary" />
                                                    <p className="text-[12px] font-medium text-text-primary">Nenhum município com cursos cadastrados neste território</p>
                                                </div>
                                            )
                                        ) : (
                                            territoryRanking.map((t, index) => {
                                                const isFirst = index === 0;
                                                const rankStr = String(t.rank || index + 1).padStart(2, '0');
                                                const rankStyle = isFirst
                                                    ? (filtroSemiarido ? 'bg-amber-500 text-white shadow-2xs' : 'bg-primary-500 text-white shadow-2xs')
                                                    : (filtroSemiarido ? 'bg-amber-100 text-amber-800 border border-amber-200/60' : 'bg-primary-100 text-primary-700 border border-primary-200/50');
                                                const fillColor = isFirst ? (filtroSemiarido ? 'bg-amber-500' : 'bg-primary-500') : (filtroSemiarido ? 'bg-amber-300/80' : 'bg-primary-200');
                                                const textStyle = isFirst ? 'font-medium text-white' : (filtroSemiarido ? 'font-medium text-amber-950' : 'font-medium text-primary-950');
                                                const valueStyle = isFirst
                                                    ? (filtroSemiarido ? 'bg-amber-50 text-amber-900 border border-amber-300' : 'bg-primary-50 text-primary-800 border border-primary-200/70')
                                                    : (filtroSemiarido ? 'bg-amber-50/70 text-amber-800 border border-amber-200/60' : 'bg-primary-50 text-primary-700 border border-primary-200/50');

                                                return (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => {
                                                            const found = territoriosData.find(x => Number(x.id_territorio) === Number(t.id));
                                                            setSelectedTerritory(found || { id_territorio: t.id, nome_territorio: t.name });
                                                        }}
                                                        title={`${t.name}: ${t.count} cursos`}
                                                        className="flex items-center gap-2 w-full min-w-0 transition-opacity duration-200 hover:opacity-90 cursor-pointer"
                                                    >
                                                        {/* RANK */}
                                                        <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold tabular-nums leading-none ${rankStyle}`}>
                                                            {rankStr}
                                                        </div>

                                                        {/* BARRA: TRACK + FILL + NOME */}
                                                        <div className={`relative flex-1 h-[24px] rounded-full overflow-hidden min-w-0 flex items-center ${filtroSemiarido ? 'bg-amber-50/60' : 'bg-primary-50/50'}`}>
                                                            <div 
                                                                className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                                                                style={{ width: `${Math.max(4, t.percentBar || 0)}%` }}
                                                            />
                                                            <span className={`absolute left-2.5 right-2.5 text-[11.5px] truncate leading-none pointer-events-none select-none z-10 ${textStyle}`}>
                                                                {t.name}
                                                            </span>
                                                        </div>

                                                        {/* VALOR PILL */}
                                                        <div className={`h-[24px] min-w-[34px] px-2 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold tabular-nums leading-none ${valueStyle}`}>
                                                            {t.count}
                                                        </div>
                                                    </div>
                                                );
                                            })
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
                                            <p className="text-[11px] text-text-secondary font-medium">
                                                Clique em uma instituição para filtrar no mapa
                                            </p>
                                        </div>
                                        {selectedIES && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedIES(null)}
                                                className="text-[11px] font-medium text-danger-600 hover:text-red-700 bg-danger-50 px-2.5 py-1 rounded-full cursor-pointer transition-colors inline-flex items-center justify-center leading-none"
                                            >
                                                Limpar Filtro
                                            </button>
                                        )}
                                    </div>

                                    {/* LISTA RANKING IES COM PADRÃO VISÃO GERAL */}
                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                                        {iesRanking.length > 0 ? (
                                            iesRanking.map((ies, idx) => {
                                                const isSelected = selectedIES && (
                                                    (ies.sigla && selectedIES.toUpperCase() === ies.sigla.toUpperCase()) ||
                                                    selectedIES === ies.fullName
                                                );
                                                const isFirst = idx === 0;
                                                const maxCount = iesRanking[0]?.count || 1;
                                                const pct = Math.min(100, Math.round((ies.count / maxCount) * 100));
                                                const rankStr = String(idx + 1).padStart(2, '0');
                                                const rankStyle = isFirst
                                                    ? (filtroSemiarido ? 'bg-amber-500 text-white shadow-2xs' : 'bg-primary-500 text-white shadow-2xs')
                                                    : (filtroSemiarido ? 'bg-amber-100 text-amber-800 border border-amber-200/60' : 'bg-primary-100 text-primary-700 border border-primary-200/50');
                                                const fillColor = isSelected
                                                    ? (filtroSemiarido ? 'bg-amber-600' : 'bg-primary-600')
                                                    : (isFirst ? (filtroSemiarido ? 'bg-amber-500' : 'bg-primary-500') : (filtroSemiarido ? 'bg-amber-300/80' : 'bg-primary-200'));
                                                const textStyle = isFirst || isSelected
                                                    ? 'font-medium text-white'
                                                    : (filtroSemiarido ? 'font-medium text-amber-950' : 'font-medium text-primary-950');
                                                const valueStyle = isFirst
                                                    ? (filtroSemiarido ? 'bg-amber-50 text-amber-900 border border-amber-300' : 'bg-primary-50 text-primary-800 border border-primary-200/70')
                                                    : (filtroSemiarido ? 'bg-amber-50/70 text-amber-800 border border-amber-200/60' : 'bg-primary-50 text-primary-700 border border-primary-200/50');

                                                return (
                                                    <div
                                                        key={ies.sigla}
                                                        onClick={() => setSelectedIES(isSelected ? null : (ies.sigla || ies.fullName))}
                                                        title={`${ies.fullName}: ${ies.count} cursos em ${ies.municipios.size} cidades`}
                                                        className={`flex items-center gap-2 w-full min-w-0 transition-all duration-200 hover:opacity-95 cursor-pointer p-1 rounded-xl ${
                                                            isSelected ? (filtroSemiarido ? 'bg-amber-50 ring-1 ring-amber-500/30' : 'bg-primary-50/80 ring-1 ring-primary-500/30') : ''
                                                        }`}
                                                    >
                                                        {/* RANK */}
                                                        <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold tabular-nums leading-none ${rankStyle}`}>
                                                            {rankStr}
                                                        </div>

                                                        {/* BARRA: TRACK + FILL + NOME */}
                                                        <div className={`relative flex-1 h-[24px] rounded-full overflow-hidden min-w-0 flex items-center ${filtroSemiarido ? 'bg-amber-50/60' : 'bg-primary-50/50'}`}>
                                                            <div 
                                                                className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                                                                style={{ width: `${Math.max(4, pct)}%` }}
                                                            />
                                                            <span className={`absolute left-2.5 right-2.5 text-[11.5px] truncate leading-none pointer-events-none select-none z-10 ${textStyle}`}>
                                                                {ies.sigla} <span className="opacity-75 text-[10px]">· {ies.fullName}</span>
                                                            </span>
                                                        </div>

                                                        {/* BADGE CIDADES */}
                                                        <div className={`h-[24px] px-2 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold tabular-nums leading-none ${filtroSemiarido ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-primary-100/80 text-primary-800 border border-primary-200/60'}`}>
                                                            {ies.municipios.size} {ies.municipios.size === 1 ? 'cid.' : 'cids.'}
                                                        </div>

                                                        {/* VALOR PILL */}
                                                        <div className={`h-[24px] min-w-[34px] px-2 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold tabular-nums leading-none ${valueStyle}`}>
                                                            {ies.count}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                <Building2 size={24} className="mb-2 opacity-40 text-text-secondary" />
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