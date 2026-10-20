import React, { useContext, useState, useMemo, useRef } from 'react';
import {
    GraduationCap,
    BookOpen,
    Building2,
    MapPin,
    Flame,
    TrendingUp,
    Sparkles,
    ExternalLink,
    Filter,
    Database,
    X,
    Wifi,
    Laptop
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { isMunicipioSemiarido } from '../constants/semiarido';
import SideMap, { getHeatColor } from './maps/SideMap';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import { normalize, classificarInstituicao } from '../utils/normalization';
import {
    Card,
    Button,
    Badge,
    Chip,
    SearchInput,
    Tabs,
    Drawer,
    EmptyState,
    KpiSkeleton,
    ListRowSkeleton
} from './ui';
import { useChartTheme } from './graph/chartTheme';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../lib/motion';

function getAlphaColor(color, alpha = 0.12) {
    if (!color) return 'transparent';
    if (color.startsWith('rgb(')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    return color.startsWith('#') ? `${color}20` : color;
}

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
    const chartTheme = useChartTheme();
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
    const [selectedRede, setSelectedRede] = useState('todas'); // 'todas' | 'publica' | 'privada'
    const [selectedIES, setSelectedIES] = useState(null);
    const [selectedCursoId, setSelectedCursoId] = useState(null);
    const [selectedCursoDrawer, setSelectedCursoDrawer] = useState(null);
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

    // Estatísticas da Rede (Pública vs Privada)
    const redeStats = useMemo(() => {
        let publica = 0;
        let privada = 0;
        const base = activeScopedCursos || [];
        base.forEach(c => {
            const info = classificarInstituicao(c);
            if (info.isPublica) publica++;
            else if (info.isPrivada) privada++;
        });
        return { publica, privada, total: base.length };
    }, [activeScopedCursos]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedCategory !== 'todas') count++;
        if (selectedRede !== 'todas') count++;
        if (selectedIES) count++;
        if (searchQuery.trim()) count++;
        return count;
    }, [selectedCategory, selectedRede, selectedIES, searchQuery]);

    const handleClearAllFilters = () => {
        setSelectedCategory('todas');
        setSelectedRede('todas');
        setSelectedIES(null);
        setSearchQuery('');
        setSelectedCursoId(null);
    };

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

        if (selectedRede !== 'todas') {
            list = list.filter(c => {
                const info = classificarInstituicao(c);
                if (selectedRede === 'publica') return info.isPublica;
                if (selectedRede === 'privada') return info.isPrivada;
                return true;
            });
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
    }, [cursosData, selectedCategory, selectedRede, selectedIES, selectedTerritory, searchQuery, filtroSemiarido]);

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

        if (selectedRede !== 'todas') {
            list = list.filter(c => {
                const info = classificarInstituicao(c);
                if (selectedRede === 'publica') return info.isPublica;
                if (selectedRede === 'privada') return info.isPrivada;
                return true;
            });
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
    }, [cursosEadData, selectedCategory, selectedRede, selectedIES, selectedTerritory, searchQuery, filtroSemiarido]);

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
        if (selectedRede !== 'todas') {
            list = list.filter(c => {
                const info = classificarInstituicao(c);
                if (selectedRede === 'publica') return info.isPublica;
                if (selectedRede === 'privada') return info.isPrivada;
                return true;
            });
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
    }, [cursosData, selectedCategory, selectedRede, selectedIES, filtroSemiarido]);

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

        const palette = filtroSemiarido ? chartTheme.semiaridoPalette : chartTheme.palette;

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
    }, [activeScopedCursos, filtroSemiarido, chartTheme.semiaridoPalette, chartTheme.palette]);

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
        <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-5 bg-transparent font-sans w-full">

            {/* ================= ATMOSFERA: SOL DO SEMIÁRIDO ================= */}
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 overflow-hidden z-0 transition-opacity duration-700 ease-in-out select-none ${filtroSemiarido ? 'opacity-100' : 'opacity-0'
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full pr-52 sm:pr-60 lg:pr-64 shrink-0 relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="text-headline font-bold text-text-primary tracking-tight">
                            Módulo de Ensino Superior em CT&I
                        </h1>
                        <Badge
                            variant={filtroSemiarido ? 'warning' : 'primary'}
                            icon={<Flame size={14} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />}
                            className="text-micro font-medium uppercase px-2.5 py-1"
                        >
                            Somente Oferta de CT&I
                        </Badge>
                    </div>
                    <p className="text-body-sm text-text-secondary mt-1 font-normal">
                        Mapeamento territorial da oferta presencial e EaD de ensino superior voltada exclusivamente a Ciência, Tecnologia e Inovação (CT&I)
                    </p>
                    <div className={`divider-territorial w-48 mt-3 ${filtroSemiarido ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-transparent' : ''}`}></div>
                </div>
            </div>

            {/* GRID DE KPIS */}
            <div className="tour-kpis w-full relative z-10 shrink-0 min-w-0">
                <motion.div
                    variants={staggerContainer(0.04)}
                    initial="initial"
                    animate="animate"
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 items-stretch w-full min-w-0"
                >
                    {loadingStats ? (
                        <KpiSkeleton count={5} />
                    ) : (
                        kpis.map((kpi, index) => {
                            const isHero = index === 0;

                            return (
                                <motion.div key={index} variants={fadeUp} className="h-full">
                                    <Card
                                        variant={isHero ? (filtroSemiarido ? 'warning' : 'brand') : 'default'}
                                        title={kpi.tooltip || kpi.label}
                                        className="p-4 flex flex-col justify-between h-[88px] min-w-0 transition-all duration-300 hover:shadow-card-elevated"
                                    >
                                        {/* LINHA SUPERIOR: ÍCONE + TÍTULO */}
                                        <div className="flex items-center gap-2 w-full min-w-0">
                                            <kpi.icon size={16} strokeWidth={2} className={isHero ? 'opacity-90' : 'text-primary-600 dark:text-primary-400'} />
                                            <span
                                                className={`text-micro font-medium uppercase tracking-wider truncate flex-1 ${isHero ? 'text-white/80' : 'text-text-muted'
                                                    }`}
                                                title={kpi.label}
                                            >
                                                {kpi.label}
                                            </span>
                                        </div>

                                        {/* LINHA INFERIOR: NÚMERO */}
                                        <div className="flex items-baseline w-full justify-between">
                                            <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
                                                <span className={`text-kpi font-bold tracking-tight leading-none tnum ${isHero ? 'text-white' : 'text-text-primary'
                                                    }`}>
                                                    {kpi.value}
                                                </span>
                                                {filtroSemiarido && kpi.percent && (
                                                    <span
                                                        title={`(${kpi.percent})`}
                                                        className={`text-caption font-semibold truncate ${isHero ? 'text-white/90' : 'text-amber-600 dark:text-amber-400'
                                                            }`}
                                                    >
                                                        ({kpi.percent})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>
            </div>

            {/* GRID PRINCIPAL: MAPA + DASHBOARD */}
            <motion.div
                variants={staggerContainer(0.04)}
                initial="initial"
                animate="animate"
                className="flex-1 min-w-0 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]"
            >

                {/* LADO ESQUERDO: MAPA */}
                <motion.div
                    variants={fadeUp}
                    style={{ width: isMapExpanded ? 'calc(100% - 330px)' : 'calc(40% - 12px)' }}
                    className="shrink-0 min-w-0 bg-surface rounded-card border border-border shadow-card relative overflow-hidden flex flex-col min-h-[460px] transition-[width] duration-300"
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
                </motion.div>

                {/* MODO EXPANDIDO */}
                {isMapExpanded ? (
                    <motion.div variants={fadeUp} className="w-[320px] shrink-0 h-[460px] lg:h-full bg-surface rounded-card border border-border shadow-card p-3.5 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/70 shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-body-sm font-semibold text-text-primary truncate">
                                    Cursos de CT&I
                                </span>
                                <Badge variant={filtroSemiarido ? 'warning' : 'primary'} className="tnum">
                                    {compactCursosList.length}
                                </Badge>
                            </div>
                            {selectedCursoId && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedCursoId(null)}
                                    className="text-micro font-medium text-text-secondary hover:text-danger-600 bg-surface-soft hover:bg-danger-50 dark:hover:bg-danger-950/40 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer shrink-0 leading-none"
                                >
                                    <span>Limpar</span>
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        <div className="my-2.5 shrink-0">
                            <SearchInput
                                value={sidebarSearch}
                                onChange={(e) => setSidebarSearch(e.target.value)}
                                onClear={() => setSidebarSearch('')}
                                placeholder="Filtrar cursos..."
                                size="sm"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 flex flex-col min-h-0 divide-y divide-border/40">
                            {compactCursosList.length > 0 ? (
                                compactCursosList.map((c, idx) => {
                                    const catColor = categoryColorMap[c.categoria || c.tipo] || chartTheme.textMuted;
                                    const cursoKey = c.id_curso || c.id || `${c.curso || c.nome}-${c.municipio}-${idx}`;
                                    const isSelected = selectedCursoId === cursoKey;
                                    const redeInfo = classificarInstituicao(c);

                                    return (
                                        <div
                                            key={cursoKey}
                                            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 54px' }}
                                            onClick={() => {
                                                setSelectedCursoId(prev => prev === cursoKey ? null : cursoKey);
                                                setSelectedCursoDrawer(c);
                                            }}
                                            className={`p-2 flex items-center justify-between gap-2 transition-colors duration-200 group cursor-pointer w-full ${isSelected
                                                ? (filtroSemiarido ? 'bg-amber-500/15' : 'bg-primary-50/50 dark:bg-primary-950/40')
                                                : 'bg-transparent hover:bg-surface-soft'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div
                                                    className={`w-6 h-6 rounded-control flex items-center justify-center shrink-0 transition-transform ${isSelected ? 'scale-105 shadow-2xs' : ''}`}
                                                    style={{
                                                        backgroundColor: getAlphaColor(catColor),
                                                        color: catColor
                                                    }}
                                                >
                                                    <GraduationCap size={14} />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <h5 className={`text-caption font-bold leading-tight truncate transition-colors ${isSelected ? (filtroSemiarido ? 'text-amber-800 dark:text-amber-200' : 'text-primary-800 dark:text-primary-200') : (filtroSemiarido ? 'text-text-primary group-hover:text-amber-600' : 'text-text-primary group-hover:text-primary-600')}`}>
                                                        {c.curso || c.nome}
                                                    </h5>
                                                    <span className="text-micro text-text-secondary truncate leading-tight">
                                                        {c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)} • <strong className="font-semibold text-text-secondary">{c.municipio}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Badge
                                                    variant={redeInfo.isPublica ? 'success' : 'accent'}
                                                    className="text-micro font-semibold px-1.5 py-0.2"
                                                >
                                                    {redeInfo.isPublica ? 'Pública' : 'Privada'}
                                                </Badge>
                                                <span
                                                    className="text-micro font-semibold px-1.5 py-0.5 rounded-control shrink-0 whitespace-nowrap inline-flex items-center justify-center leading-none"
                                                    style={{ backgroundColor: getAlphaColor(catColor, 0.1), color: catColor }}
                                                >
                                                    {c.categoria || c.tipo || 'Geral'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <EmptyState
                                    icon={GraduationCap}
                                    title="Nenhum curso encontrado"
                                    description="Tente ajustar a busca."
                                    compact
                                />
                            )}
                        </div>
                    </motion.div>
                ) : (
                    /* LADO DIREITO: CATÁLOGO COM A NOVA ABA DE CURSOS EAD */
                    <motion.div variants={fadeUp} className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">

                        {/* BARRA SUPERIOR DE ABAS E BUSCA */}
                        <div className="bg-surface rounded-card p-2.5 border border-border shadow-card flex flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-3 shrink-0 min-w-0 overflow-hidden">
                            <Tabs
                                items={[
                                    {
                                        id: 'catalogo',
                                        label: 'Catálogo',
                                        icon: <BookOpen size={15} />,
                                        count: filteredCursos.length
                                    },
                                    {
                                        id: 'ead',
                                        label: 'Cursos EaD',
                                        icon: <Laptop size={15} />,
                                        count: filteredEadCursos.length
                                    },
                                    {
                                        id: 'areas',
                                        label: 'Áreas',
                                        icon: <Filter size={15} />,
                                        count: categoryStats.length
                                    },
                                    {
                                        id: 'ranking',
                                        label: selectedTerritory ? 'Municípios' : 'Territórios',
                                        icon: <TrendingUp size={15} />
                                    },
                                    {
                                        id: 'ies',
                                        label: 'Instituições',
                                        icon: <Building2 size={15} />
                                    }
                                ]}
                                value={activeTab}
                                onChange={(tab) => setActiveTab(tab)}
                                variant="pill"
                                className="w-full 2xl:w-auto"
                            />

                            {/* INPUT DE BUSCA */}
                            <div className="flex items-center gap-2 w-full 2xl:w-auto min-w-0 justify-end">
                                <div className="w-full 2xl:w-64 min-w-0">
                                    <SearchInput
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            if (e.target.value.trim() && activeTab !== 'catalogo' && activeTab !== 'ead') {
                                                setActiveTab('catalogo');
                                            }
                                        }}
                                        onClear={() => setSearchQuery('')}
                                        placeholder="Buscar curso, instituição ou cidade... (/)"
                                        size="sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BARRA DE FILTROS: REDE (PÚBLICA VS PRIVADA) E FILTROS ATIVOS */}
                        <div className="flex items-center justify-between gap-2 flex-wrap px-3 py-2 bg-surface rounded-card border border-border shadow-card shrink-0 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <span className="text-micro font-bold text-text-muted uppercase tracking-wider pl-0.5">Rede:</span>
                                <Chip
                                    selected={selectedRede === 'todas'}
                                    onClick={() => setSelectedRede('todas')}
                                    count={redeStats.total}
                                    variant="neutral"
                                    size="sm"
                                >
                                    Todas
                                </Chip>
                                <Chip
                                    selected={selectedRede === 'publica'}
                                    onClick={() => setSelectedRede(prev => prev === 'publica' ? 'todas' : 'publica')}
                                    count={redeStats.publica}
                                    variant="success"
                                    size="sm"
                                >
                                    Pública
                                </Chip>
                                <Chip
                                    selected={selectedRede === 'privada'}
                                    onClick={() => setSelectedRede(prev => prev === 'privada' ? 'todas' : 'privada')}
                                    count={redeStats.privada}
                                    variant="accent"
                                    size="sm"
                                >
                                    Privada
                                </Chip>
                            </div>

                            {/* CHIPS DE FILTROS ATIVOS & BOTÃO LIMPAR */}
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                {selectedCategory !== 'todas' && (
                                    <Chip
                                        selected
                                        onClick={() => setSelectedCategory('todas')}
                                        variant="primary"
                                        size="sm"
                                    >
                                        Área: {selectedCategory} ×
                                    </Chip>
                                )}
                                {selectedIES && (
                                    <Chip
                                        selected
                                        onClick={() => setSelectedIES(null)}
                                        icon={<Building2 size={12} />}
                                        variant="primary"
                                        size="sm"
                                    >
                                        IES: {selectedIES} ×
                                    </Chip>
                                )}
                                {selectedTerritory && (
                                    <Chip
                                        selected
                                        onClick={() => setSelectedTerritory(null)}
                                        icon={<MapPin size={12} />}
                                        variant="neutral"
                                        size="sm"
                                    >
                                        {territoryName} ×
                                    </Chip>
                                )}
                                {activeFiltersCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={handleClearAllFilters}
                                        className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-950/40 text-caption font-semibold"
                                    >
                                        Limpar filtros ({activeFiltersCount})
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* CONTEÚDO DAS ABAS */}
                        <div className="flex-1 min-w-0 bg-surface rounded-card border border-border shadow-card p-5 flex flex-col min-h-0 overflow-hidden">

                            {/* ABA 1: CATÁLOGO COMPLETO DE CURSOS PRESENCIAIS */}
                            {activeTab === 'catalogo' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory ? `Cursos Presenciais em ${territoryName}` : 'Cursos Presenciais de CT&I'}
                                            </h3>
                                            <Badge
                                                variant={filtroSemiarido ? 'warning' : 'primary'}
                                                className="tnum"
                                            >
                                                {filteredCursos.length} {filteredCursos.length === 1 ? 'resultado' : 'resultados'}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {selectedIES && (
                                                <Badge
                                                    variant={filtroSemiarido ? 'warning' : 'primary'}
                                                    icon={<Building2 size={13} />}
                                                >
                                                    {selectedIES}
                                                </Badge>
                                            )}
                                            {selectedTerritory && (
                                                <Badge
                                                    variant={filtroSemiarido ? 'warning' : 'primary'}
                                                    icon={<MapPin size={13} />}
                                                >
                                                    {territoryName}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col min-h-0 divide-y divide-border/40">
                                        {loadingStats ? (
                                            <div className="p-3">
                                                <ListRowSkeleton count={6} />
                                            </div>
                                        ) : filteredCursos.length > 0 ? (
                                            filteredCursos.map((c, idx) => {
                                                const catColor = categoryColorMap[c.categoria || c.tipo] || chartTheme.palette[0];
                                                const cursoKey = c.id || `${c.curso || c.nome}-${idx}`;
                                                const isSelected = selectedCursoId === cursoKey;
                                                const redeInfo = classificarInstituicao(c);

                                                return (
                                                    <div
                                                        key={cursoKey}
                                                        ref={(el) => {
                                                            if (el && cursoKey) itemRefs.current[cursoKey] = el;
                                                        }}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 68px' }}
                                                        onClick={() => {
                                                            setSelectedCursoId(prev => prev === cursoKey ? null : cursoKey);
                                                            setSelectedCursoDrawer(c);
                                                        }}
                                                        className={`p-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 transition-colors duration-200 group cursor-pointer border-b border-border/40 ${isSelected
                                                            ? (filtroSemiarido ? 'bg-amber-500/15' : 'bg-primary-50/50 dark:bg-primary-950/40')
                                                            : 'bg-transparent hover:bg-surface-soft'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0 flex-1 basis-[240px]">
                                                            <div
                                                                className="w-8 h-8 rounded-control flex items-center justify-center shrink-0 mt-0.5 transition-transform"
                                                                style={{ backgroundColor: getAlphaColor(catColor), color: catColor }}
                                                            >
                                                                <GraduationCap size={16} />
                                                            </div>
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <h4 className="text-body-sm font-semibold text-text-primary group-hover:text-primary-600 transition-colors leading-tight truncate">
                                                                    {c.curso || c.nome}
                                                                </h4>
                                                                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-caption text-text-secondary mt-0.5 font-medium">
                                                                    <span className="font-semibold text-text-primary">
                                                                        {c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{c.municipio}</span>
                                                                    <span>•</span>
                                                                    <span className="text-text-muted">{c.territorio_identidade}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center flex-wrap gap-2 ml-auto max-w-full">
                                                            <Badge
                                                                variant={redeInfo.isPublica ? 'success' : 'accent'}
                                                                className="text-micro font-semibold"
                                                            >
                                                                {redeInfo.isPublica ? 'Pública' : 'Privada'}
                                                            </Badge>
                                                            <Badge
                                                                variant="neutral"
                                                                className="text-micro font-medium"
                                                            >
                                                                Presencial
                                                            </Badge>
                                                            <span
                                                                className="text-micro font-medium px-2 py-0.5 rounded-full inline-flex items-center justify-center leading-none"
                                                                style={{
                                                                    backgroundColor: getAlphaColor(catColor),
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
                                                                    className="p-1.5 rounded-control text-text-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                                                                    title="Fonte Oficial"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <ExternalLink size={14} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <EmptyState
                                                icon={GraduationCap}
                                                title="Nenhum curso presencial encontrado"
                                                description="Tente ajustar os filtros ou a busca para visualizar resultados."
                                                action={
                                                    activeFiltersCount > 0 ? (
                                                        <Button variant="outline" size="sm" onClick={handleClearAllFilters}>
                                                            Limpar Filtros
                                                        </Button>
                                                    ) : null
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ABA 2: CURSOS EAD ISOLADOS */}
                            {activeTab === 'ead' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory ? `Cursos EaD em ${territoryName}` : 'Oferta de Cursos à Distância (EaD) e Semipresenciais'}
                                            </h3>
                                            <Badge
                                                variant={filtroSemiarido ? 'warning' : 'primary'}
                                                className="tnum"
                                            >
                                                {filteredEadCursos.length} {filteredEadCursos.length === 1 ? 'curso' : 'cursos'}
                                            </Badge>
                                        </div>

                                        {selectedTerritory && (
                                            <Badge
                                                variant={filtroSemiarido ? 'warning' : 'primary'}
                                                icon={<MapPin size={13} />}
                                            >
                                                {territoryName}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col min-h-0 divide-y divide-border/40">
                                        {loadingStats ? (
                                            <div className="p-3">
                                                <ListRowSkeleton count={6} />
                                            </div>
                                        ) : filteredEadCursos.length > 0 ? (
                                            filteredEadCursos.map((c, idx) => {
                                                const catColor = categoryColorMap[c.categoria || c.tipo] || chartTheme.palette[0];
                                                const redeInfo = classificarInstituicao(c);

                                                return (
                                                    <div
                                                        key={c.id || idx}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 68px' }}
                                                        onClick={() => setSelectedCursoDrawer(c)}
                                                        className="p-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 transition-colors duration-200 bg-transparent hover:bg-surface-soft border-b border-border/40 group cursor-pointer"
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0 flex-1 basis-[240px]">
                                                            <div
                                                                className="w-8 h-8 rounded-control flex items-center justify-center shrink-0 mt-0.5 transition-transform"
                                                                style={{ backgroundColor: getAlphaColor(catColor), color: catColor }}
                                                            >
                                                                <Laptop size={16} />
                                                            </div>
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <h4 className="text-body-sm font-semibold text-text-primary group-hover:text-primary-600 transition-colors leading-tight truncate">
                                                                    {c.curso || c.nome}
                                                                </h4>
                                                                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-caption text-text-secondary mt-0.5 font-medium">
                                                                    <span className="font-semibold text-text-primary">
                                                                        {c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{c.municipio}</span>
                                                                    <span>•</span>
                                                                    <span className="text-text-muted">{c.territorio_identidade}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center flex-wrap gap-2 ml-auto max-w-full">
                                                            <Badge
                                                                variant={redeInfo.isPublica ? 'success' : 'accent'}
                                                                className="text-micro font-semibold"
                                                            >
                                                                {redeInfo.isPublica ? 'Pública' : 'Privada'}
                                                            </Badge>
                                                            <Badge
                                                                variant="primary"
                                                                icon={<Wifi size={12} strokeWidth={2} />}
                                                                className="text-micro font-medium"
                                                            >
                                                                EaD
                                                            </Badge>
                                                            <span
                                                                className="text-micro font-medium px-2 py-0.5 rounded-full inline-flex items-center justify-center leading-none"
                                                                style={{
                                                                    backgroundColor: getAlphaColor(catColor),
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
                                                                    className="p-1.5 rounded-control text-text-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                                                                    title="Fonte Oficial"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <ExternalLink size={14} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <EmptyState
                                                icon={Laptop}
                                                title="Nenhum curso EaD registrado neste território"
                                                description="Tente ajustar os filtros ou selecionar outro território."
                                                action={
                                                    activeFiltersCount > 0 ? (
                                                        <Button variant="outline" size="sm" onClick={handleClearAllFilters}>
                                                            Limpar Filtros
                                                        </Button>
                                                    ) : null
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ABA 3: ÁREAS DE CONHECIMENTO */}
                            {activeTab === 'areas' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="mb-3 shrink-0 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory
                                                    ? `Áreas de Conhecimento em ${territoryName}`
                                                    : 'Distribuição por Áreas de Conhecimento'
                                                }
                                            </h3>
                                            <p className="text-caption text-text-secondary font-medium">
                                                {selectedTerritory
                                                    ? `Exibindo proporção dos ${territoryCursos.length} cursos presenciais neste território`
                                                    : 'Clique em uma categoria para filtrar o catálogo'
                                                }
                                            </p>
                                        </div>
                                        {selectedTerritory && (
                                            <Badge
                                                variant={filtroSemiarido ? 'warning' : 'primary'}
                                                icon={<MapPin size={13} />}
                                            >
                                                {territoryName}
                                            </Badge>
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
                                                        className={`rounded-card p-3 border transition-all cursor-pointer ${isSelected
                                                            ? (filtroSemiarido ? 'bg-surface border-amber-500 shadow-md ring-2 ring-amber-500/20' : 'bg-surface border-primary-600 shadow-md ring-2 ring-primary-600/20')
                                                            : (filtroSemiarido ? 'bg-surface-soft/60 border-border hover:bg-surface hover:border-amber-300 shadow-2xs' : 'bg-surface-soft/60 border-border hover:bg-surface hover:border-primary-200 dark:hover:border-primary-800 shadow-2xs')
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span
                                                                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                                                                    style={{ backgroundColor: dotColor }}
                                                                />
                                                                <span className="text-body-sm font-semibold text-text-primary truncate">
                                                                    {cat.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-caption font-semibold text-text-primary tnum">
                                                                    {cat.count} {cat.count === 1 ? 'curso' : 'cursos'}
                                                                </span>
                                                                <span
                                                                    className="text-micro font-semibold px-2 py-0.5 rounded-full inline-flex items-center justify-center leading-none tnum"
                                                                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                                                >
                                                                    {cat.percent}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className={`w-full h-[18px] rounded-full overflow-hidden relative flex items-center ${filtroSemiarido ? 'bg-amber-500/10 dark:bg-amber-950/30' : 'bg-primary-50/50 dark:bg-primary-950/40'}`}>
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <EmptyState
                                                icon={Filter}
                                                title="Nenhuma área de ensino registrada"
                                                description="Nenhum dado encontrado para o filtro atual."
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ABA 4: RANKING DE TERRITÓRIOS OU MUNICÍPIOS */}
                            {activeTab === 'ranking' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="mb-3 shrink-0 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory
                                                    ? `Ranking de Municípios · ${territoryName}`
                                                    : 'Ranking Territorial de Oferta de Cursos'
                                                }
                                            </h3>
                                            <p className="text-caption text-text-secondary font-medium">
                                                Densidade de cursos de CT&I por localidade
                                            </p>
                                        </div>
                                        <Badge variant="neutral" className="tnum">
                                            {selectedTerritory
                                                ? `${municipalityRanking.length} municípios com oferta`
                                                : `${territoryRanking.length} territórios`
                                            }
                                        </Badge>
                                    </div>

                                    {/* LISTA RANKING: RANK + BARRA PROPORCIONAL COM NOME + PILULA DE VALOR */}
                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                                        {selectedTerritory ? (
                                            municipalityRanking.length > 0 ? (
                                                municipalityRanking.map((m, index) => {
                                                    const isFirst = index === 0;
                                                    const rankStr = String(m.rank || index + 1).padStart(2, '0');
                                                    const rankStyle = isFirst
                                                        ? (filtroSemiarido ? 'bg-amber-600 text-white shadow-2xs' : 'bg-primary-500 text-white shadow-2xs')
                                                        : (filtroSemiarido ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30' : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-700/50');
                                                    const fillColor = isFirst ? (filtroSemiarido ? 'bg-amber-600' : 'bg-primary-500') : (filtroSemiarido ? 'bg-amber-500/60' : 'bg-primary-400');
                                                    const textStyle = isFirst ? 'font-semibold text-white' : (filtroSemiarido ? 'font-medium text-amber-950 dark:text-amber-100' : 'font-medium text-text-primary');
                                                    const valueStyle = isFirst
                                                        ? (filtroSemiarido ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25' : 'bg-primary-50 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 border border-primary-200/70 dark:border-primary-700/50')
                                                        : (filtroSemiarido ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20' : 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/50');

                                                    return (
                                                        <div
                                                            key={m.name}
                                                            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 28px' }}
                                                            title={`${m.name}: ${m.count} cursos`}
                                                            className="flex items-center gap-2 w-full min-w-0 transition-opacity duration-200 hover:opacity-90 cursor-default"
                                                        >
                                                            {/* RANK */}
                                                            <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-micro font-semibold tnum leading-none ${rankStyle}`}>
                                                                {rankStr}
                                                            </div>

                                                            {/* BARRA: TRACK + FILL + NOME */}
                                                            <div className={`relative flex-1 h-[24px] rounded-full overflow-hidden min-w-0 flex items-center ${filtroSemiarido ? 'bg-amber-500/10 dark:bg-amber-950/30' : 'bg-primary-50/50 dark:bg-primary-950/40'}`}>
                                                                <div
                                                                    className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                                                                    style={{ width: `${Math.max(4, m.percentBar || 0)}%` }}
                                                                />
                                                                <span className={`absolute left-2.5 right-2.5 text-caption truncate leading-none pointer-events-none select-none z-10 ${textStyle}`}>
                                                                    {m.name}
                                                                </span>
                                                            </div>

                                                            {/* VALOR PILL */}
                                                            <div className={`h-[24px] min-w-[34px] px-2 rounded-full shrink-0 flex items-center justify-center text-caption font-semibold tnum leading-none ${valueStyle}`}>
                                                                {m.count}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <EmptyState
                                                    icon={MapPin}
                                                    title="Nenhum município com cursos cadastrados neste território"
                                                />
                                            )
                                        ) : (
                                            territoryRanking.map((t, index) => {
                                                const isFirst = index === 0;
                                                const rankStr = String(t.rank || index + 1).padStart(2, '0');
                                                const rankStyle = isFirst
                                                    ? (filtroSemiarido ? 'bg-amber-600 text-white shadow-2xs' : 'bg-primary-500 text-white shadow-2xs')
                                                    : (filtroSemiarido ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30' : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-700/50');
                                                const fillColor = isFirst ? (filtroSemiarido ? 'bg-amber-600' : 'bg-primary-500') : (filtroSemiarido ? 'bg-amber-500/60' : 'bg-primary-400');
                                                const textStyle = isFirst ? 'font-semibold text-white' : (filtroSemiarido ? 'font-medium text-amber-950 dark:text-amber-100' : 'font-medium text-text-primary');
                                                const valueStyle = isFirst
                                                    ? (filtroSemiarido ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25' : 'bg-primary-50 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 border border-primary-200/70 dark:border-primary-700/50')
                                                    : (filtroSemiarido ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20' : 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/50');

                                                return (
                                                    <div
                                                        key={t.id}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 28px' }}
                                                        onClick={() => {
                                                            const found = territoriosData.find(x => Number(x.id_territorio) === Number(t.id));
                                                            setSelectedTerritory(found || { id_territorio: t.id, nome_territorio: t.name });
                                                        }}
                                                        title={`${t.name}: ${t.count} cursos`}
                                                        className="flex items-center gap-2 w-full min-w-0 transition-opacity duration-200 hover:opacity-90 cursor-pointer"
                                                    >
                                                        {/* RANK */}
                                                        <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-micro font-semibold tnum leading-none ${rankStyle}`}>
                                                            {rankStr}
                                                        </div>

                                                        {/* BARRA: TRACK + FILL + NOME */}
                                                        <div className={`relative flex-1 h-[24px] rounded-full overflow-hidden min-w-0 flex items-center ${filtroSemiarido ? 'bg-amber-500/10 dark:bg-amber-950/30' : 'bg-primary-50/50 dark:bg-primary-950/40'}`}>
                                                            <div
                                                                className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                                                                style={{ width: `${Math.max(4, t.percentBar || 0)}%` }}
                                                            />
                                                            <span className={`absolute left-2.5 right-2.5 text-caption truncate leading-none pointer-events-none select-none z-10 ${textStyle}`}>
                                                                {t.name}
                                                            </span>
                                                        </div>

                                                        {/* VALOR PILL */}
                                                        <div className={`h-[24px] min-w-[34px] px-2 rounded-full shrink-0 flex items-center justify-center text-caption font-semibold tnum leading-none ${valueStyle}`}>
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
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory
                                                    ? `Top Instituições em ${territoryName}`
                                                    : 'Top Instituições Ofertantes de Cursos de CT&I'
                                                }
                                            </h3>
                                            <p className="text-caption text-text-secondary font-medium">
                                                Clique em uma instituição para filtrar no mapa
                                            </p>
                                        </div>
                                        {selectedIES && (
                                            <Button
                                                variant="ghost"
                                                size="xs"
                                                onClick={() => setSelectedIES(null)}
                                                className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-950/40 text-caption font-semibold"
                                            >
                                                Limpar Filtro
                                            </Button>
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
                                                    : (filtroSemiarido ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-700/50' : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-700/50');
                                                const fillColor = isSelected
                                                    ? (filtroSemiarido ? 'bg-amber-600' : 'bg-primary-600')
                                                    : (isFirst ? (filtroSemiarido ? 'bg-amber-500' : 'bg-primary-500') : (filtroSemiarido ? 'bg-amber-300/80' : 'bg-primary-200'));
                                                const textStyle = isFirst || isSelected
                                                    ? 'font-medium text-white'
                                                    : (filtroSemiarido ? 'font-medium text-amber-950 dark:text-amber-100' : 'font-medium text-primary-950 dark:text-neutral-900');
                                                const valueStyle = isFirst
                                                    ? (filtroSemiarido ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60' : 'bg-primary-50 dark:bg-primary-950/50 text-primary-800 dark:text-primary-300 border border-primary-200/70 dark:border-primary-700/60')
                                                    : (filtroSemiarido ? 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-700/50' : 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-700/50');

                                                return (
                                                    <div
                                                        key={ies.sigla}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 32px' }}
                                                        onClick={() => setSelectedIES(isSelected ? null : (ies.sigla || ies.fullName))}
                                                        title={`${ies.fullName}: ${ies.count} cursos em ${ies.municipios.size} cidades`}
                                                        className={`flex items-center gap-2 w-full min-w-0 transition-all duration-200 hover:opacity-95 cursor-pointer p-1 rounded-xl ${isSelected ? (filtroSemiarido ? 'bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-500/30' : 'bg-primary-50/80 dark:bg-primary-950/30 ring-1 ring-primary-500/30') : ''
                                                            }`}
                                                    >
                                                        {/* RANK */}
                                                        <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-micro font-semibold tnum leading-none ${rankStyle}`}>
                                                            {rankStr}
                                                        </div>

                                                        {/* BARRA: TRACK + FILL + NOME */}
                                                        <div className={`relative flex-1 h-[24px] rounded-full overflow-hidden min-w-0 flex items-center ${filtroSemiarido ? 'bg-amber-50/60 dark:bg-amber-950/20' : 'bg-primary-50/50 dark:bg-primary-950/20'}`}>
                                                            <div
                                                                className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                                                                style={{ width: `${Math.max(4, pct)}%` }}
                                                            />
                                                            <span className={`absolute left-2.5 right-2.5 text-caption truncate leading-none pointer-events-none select-none z-10 ${textStyle}`}>
                                                                {ies.sigla} <span className="opacity-75 text-micro">· {ies.fullName}</span>
                                                            </span>
                                                        </div>

                                                        {/* BADGE CIDADES */}
                                                        <div className={`h-[24px] px-2 rounded-full shrink-0 flex items-center justify-center text-micro font-semibold tnum leading-none ${filtroSemiarido ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700/60' : 'bg-primary-100/80 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300 border border-primary-200/60 dark:border-primary-700/60'}`}>
                                                            {ies.municipios.size} {ies.municipios.size === 1 ? 'cid.' : 'cids.'}
                                                        </div>

                                                        {/* VALOR PILL */}
                                                        <div className={`h-[24px] min-w-[34px] px-2 rounded-full shrink-0 flex items-center justify-center text-caption font-semibold tnum leading-none ${valueStyle}`}>
                                                            {ies.count}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <EmptyState
                                                icon={Building2}
                                                title="Nenhuma instituição cadastrada neste território"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}

            </motion.div>

            {/* DRAWER LATERAL DE DETALHES DO CURSO */}
            <Drawer
                open={Boolean(selectedCursoDrawer)}
                onClose={() => setSelectedCursoDrawer(null)}
                title={selectedCursoDrawer?.curso || selectedCursoDrawer?.nome || 'Detalhes do Curso'}
                subtitle={
                    selectedCursoDrawer
                        ? `${selectedCursoDrawer.sigla || cleanIesName(selectedCursoDrawer.entidade || selectedCursoDrawer.instituicao, selectedCursoDrawer.municipio)} • ${selectedCursoDrawer.municipio || 'Bahia'}`
                        : ''
                }
                footer={
                    <div className="flex items-center justify-between w-full gap-2">
                        {(selectedCursoDrawer?.url_referencia || selectedCursoDrawer?.url || selectedCursoDrawer?.link || selectedCursoDrawer?.site) ? (
                            <Button
                                variant="primary"
                                size="sm"
                                as="a"
                                href={selectedCursoDrawer.url_referencia || selectedCursoDrawer.url || selectedCursoDrawer.link || selectedCursoDrawer.site}
                                target="_blank"
                                rel="noreferrer"
                                icon={<ExternalLink size={14} />}
                            >
                                Acessar Fonte Oficial
                            </Button>
                        ) : <div />}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCursoDrawer(null)}
                        >
                            Fechar
                        </Button>
                    </div>
                }
            >
                {selectedCursoDrawer && (() => {
                    const redeInfo = classificarInstituicao(selectedCursoDrawer);
                    const catColor = categoryColorMap[selectedCursoDrawer.categoria || selectedCursoDrawer.tipo] || chartTheme.palette[0];
                    const modalidade = selectedCursoDrawer.modalidade || (selectedCursoDrawer.tipo_oferta?.toLowerCase().includes('ead') ? 'EaD / A Distância' : activeTab === 'ead' ? 'EaD / A Distância' : 'Presencial');

                    return (
                        <div className="flex flex-col gap-4 text-body-sm">
                            {/* STATUS BADGES */}
                            <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-border/70">
                                <Badge
                                    variant={redeInfo.isPublica ? 'success' : 'accent'}
                                    className="text-caption font-semibold"
                                >
                                    Rede {redeInfo.isPublica ? 'Pública' : 'Privada'}
                                </Badge>
                                <Badge variant="neutral" className="text-caption">
                                    {modalidade}
                                </Badge>
                                <span
                                    className="text-caption font-medium px-2.5 py-0.5 rounded-full inline-flex items-center"
                                    style={{ backgroundColor: getAlphaColor(catColor), color: catColor }}
                                >
                                    {selectedCursoDrawer.categoria || selectedCursoDrawer.tipo || 'CT&I'}
                                </span>
                            </div>

                            {/* METADADOS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="p-3 bg-surface-soft rounded-control border border-border/70">
                                    <span className="text-micro font-semibold uppercase text-text-muted block mb-0.5">Instituição (IES)</span>
                                    <p className="font-bold text-text-primary">{selectedCursoDrawer.sigla || '—'}</p>
                                    <p className="text-caption text-text-secondary truncate">{selectedCursoDrawer.entidade || selectedCursoDrawer.instituicao || '—'}</p>
                                </div>

                                <div className="p-3 bg-surface-soft rounded-control border border-border/70">
                                    <span className="text-micro font-semibold uppercase text-text-muted block mb-0.5">Rede Administrativa</span>
                                    <p className="font-bold text-text-primary">
                                        {redeInfo.isPublica ? 'Pública (Estadual/Federal/Municipal)' : 'Privada / Comunitária'}
                                    </p>
                                </div>

                                <div className="p-3 bg-surface-soft rounded-control border border-border/70">
                                    <span className="text-micro font-semibold uppercase text-text-muted block mb-0.5">Município</span>
                                    <p className="font-bold text-text-primary flex items-center gap-1.5">
                                        <MapPin size={14} className="text-primary-600" />
                                        {selectedCursoDrawer.municipio || '—'}
                                    </p>
                                </div>

                                <div className="p-3 bg-surface-soft rounded-control border border-border/70">
                                    <span className="text-micro font-semibold uppercase text-text-muted block mb-0.5">Território de Identidade</span>
                                    <p className="font-bold text-text-primary">
                                        {selectedCursoDrawer.territorio_identidade || selectedCursoDrawer.territorio || '—'}
                                    </p>
                                </div>

                                <div className="p-3 bg-surface-soft rounded-control border border-border/70">
                                    <span className="text-micro font-semibold uppercase text-text-muted block mb-0.5">Modalidade de Ensino</span>
                                    <p className="font-bold text-text-primary">{modalidade}</p>
                                </div>

                                <div className="p-3 bg-surface-soft rounded-control border border-border/70">
                                    <span className="text-micro font-semibold uppercase text-text-muted block mb-0.5">Vagas / Matrículas</span>
                                    <p className="font-bold text-text-primary tnum">
                                        {selectedCursoDrawer.vagas || selectedCursoDrawer.matriculas
                                            ? `${selectedCursoDrawer.vagas || '—'} vagas / ${selectedCursoDrawer.matriculas || '—'} matrículas`
                                            : 'Sob consulta institucional'}
                                    </p>
                                </div>
                            </div>

                            {selectedCursoDrawer.grau && (
                                <div className="p-3 bg-surface-soft rounded-control border border-border/70">
                                    <span className="text-micro font-semibold uppercase text-text-muted block mb-0.5">Grau Acadêmico</span>
                                    <p className="font-bold text-text-primary">{selectedCursoDrawer.grau}</p>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Drawer>

        </main>
    );
}