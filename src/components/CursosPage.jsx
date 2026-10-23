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
    Laptop,
    SlidersHorizontal
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
    if (color.startsWith('rgba(')) {
        return color.replace(/,[\s\d\.]+\)$/, `, ${alpha})`);
    }
    if (color.startsWith('#')) {
        let hex = color.slice(1);
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
    }
    return color;
}

function getContrastTextColor(hexOrRgb) {
    if (!hexOrRgb) return '#ffffff';
    let r = 255, g = 255, b = 255;
    if (hexOrRgb.startsWith('#')) {
        let hex = hexOrRgb.slice(1);
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        if (hex.length >= 6) {
            r = parseInt(hex.slice(0, 2), 16);
            g = parseInt(hex.slice(2, 4), 16);
            b = parseInt(hex.slice(4, 6), 16);
        }
    } else if (hexOrRgb.startsWith('rgb')) {
        const match = hexOrRgb.match(/\d+/g);
        if (match && match.length >= 3) {
            r = Number(match[0]);
            g = Number(match[1]);
            b = Number(match[2]);
        }
    }
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#090D16' : '#FFFFFF';
}

export function cleanTerritorioName(name) {
    if (!name) return '';
    return String(name)
        .replace(/^territ[oó]rio(\s+de\s+identidade)?\s+/i, '')
        .replace(/^ti\s+/i, '')
        .trim();
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
        if (selectedTerritory) count++;
        if (filtroSemiarido) count++;
        if (searchQuery.trim()) count++;
        return count;
    }, [selectedCategory, selectedRede, selectedIES, selectedTerritory, filtroSemiarido, searchQuery]);

    const handleClearAllFilters = () => {
        setSelectedCategory('todas');
        setSelectedRede('todas');
        setSelectedIES(null);
        setSelectedTerritory(null);
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
        let totalCount = 0;

        base.forEach(c => {
            const rawName = c.territorio_identidade || c.territorio || '';
            const tClean = cleanTerritorioName(rawName);
            if (!tClean || tClean.toLowerCase() === 'não identificado' || tClean.toLowerCase() === 'bahia') return;

            const normKey = normalize(tClean);
            const foundTerr = (territoriosData || []).find(t => {
                const tName = t.nome_territorio || t.territorio || t.nome || '';
                return normalize(cleanTerritorioName(tName)) === normKey || (c.id_territorio && Number(t.id_territorio) === Number(c.id_territorio));
            });

            const canonId = foundTerr?.id_territorio || (c.id_territorio ? Number(c.id_territorio) : null);
            const canonName = (foundTerr ? cleanTerritorioName(foundTerr.nome_territorio || foundTerr.territorio || foundTerr.nome) : '') || tClean;
            const uniqueKey = canonId ? `id_${canonId}` : normKey;

            if (!counts[uniqueKey]) {
                counts[uniqueKey] = {
                    id: canonId,
                    name: canonName,
                    count: 0,
                    publicaCount: 0,
                    privadaCount: 0
                };
            }
            counts[uniqueKey].count += 1;
            const redeInfo = classificarInstituicao(c);
            if (redeInfo.isPublica) counts[uniqueKey].publicaCount += 1;
            else counts[uniqueKey].privadaCount += 1;
            totalCount += 1;
        });

        const maxCount = Math.max(...Object.values(counts).map(t => t.count), 1);

        return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .map((t, idx) => ({
                ...t,
                rank: idx + 1,
                percentTotal: totalCount > 0 ? ((t.count / totalCount) * 100).toFixed(1) : '0.0',
                percentBar: Math.min(100, (t.count / maxCount) * 100),
                heatColor: getHeatColor(t.count)
            }));
    }, [cursosData, territoriosData, filtroSemiarido]);

    // 3B. Ranking de Municípios
    const municipalityRanking = useMemo(() => {
        const targetList = selectedTerritory ? activeScopedCursos : (filtroSemiarido ? activeScopedCursos : territoryCursos);
        if (!targetList || targetList.length === 0) return [];
        const counts = {};
        let totalCount = 0;

        targetList.forEach(c => {
            const mun = (c.municipio || '').trim();
            if (!mun || mun.toLowerCase() === 'não identificado' || mun.toLowerCase() === 'bahia') return;
            const normKey = normalize(mun);
            if (!counts[normKey]) {
                counts[normKey] = {
                    name: mun,
                    count: 0,
                    publicaCount: 0,
                    privadaCount: 0
                };
            }
            counts[normKey].count += 1;
            const redeInfo = classificarInstituicao(c);
            if (redeInfo.isPublica) counts[normKey].publicaCount += 1;
            else counts[normKey].privadaCount += 1;
            totalCount += 1;
        });

        const maxCount = Math.max(...Object.values(counts).map(c => c.count), 1);

        return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .map((m, idx) => ({
                ...m,
                rank: idx + 1,
                percentTotal: totalCount > 0 ? ((m.count / totalCount) * 100).toFixed(1) : '0.0',
                percentBar: Math.min(100, (m.count / maxCount) * 100),
                heatColor: getHeatColor(m.count)
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
                    </div>
                    <p className="text-body-sm text-text-secondary mt-1 font-medium">
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
                        Array.from({ length: 5 }).map((_, i) => (
                            <KpiSkeleton key={i} />
                        ))
                    ) : (
                        kpis.map((kpi, index) => {
                            const isHero = index === 0;

                            return (
                                <motion.div key={index} variants={fadeUp} className="h-full">
                                    <div
                                        title={kpi.tooltip || kpi.label}
                                        className={`p-4 sm:p-5 flex flex-col justify-between h-[104px] rounded-card cursor-default overflow-hidden transition-colors duration-200 select-none ${isHero
                                            ? (filtroSemiarido
                                                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border border-amber-400/40'
                                                : 'bg-gradient-brand text-white border border-primary-500/40')
                                            : (filtroSemiarido
                                                ? 'bg-surface-soft border border-amber-200/50 dark:border-amber-500/30 text-text-primary'
                                                : 'bg-surface-soft border border-border/70 text-text-primary')
                                            }`}
                                    >
                                        {/* LINHA SUPERIOR: LABEL ACIMA + ÍCONE CIRCULAR À DIREITA */}
                                        <div className="flex items-start justify-between gap-2 w-full min-w-0">
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span
                                                    className={`text-[13px] font-medium leading-tight truncate ${isHero ? (filtroSemiarido ? 'text-amber-100' : 'text-white/85') : 'text-text-secondary'
                                                        }`}
                                                    title={kpi.label}
                                                >
                                                    {kpi.label}
                                                </span>
                                            </div>

                                            {/* ÍCONE CIRCULAR NO CANTO SUPERIOR DIREITO */}
                                            <div
                                                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${isHero
                                                    ? 'bg-white/15 text-white border border-white/20'
                                                    : 'bg-surface border border-border/80 text-text-secondary'
                                                    }`}
                                            >
                                                <kpi.icon size={15} strokeWidth={2} />
                                            </div>
                                        </div>

                                        {/* LINHA INFERIOR: VALOR NUMÉRICO GRANDE (28px - 34px) + BADGE */}
                                        <div className="flex items-baseline w-full justify-between min-w-0 pt-0.5">
                                            <div className="flex items-baseline gap-2 min-w-0 flex-1">
                                                <span
                                                    className={`text-[30px] font-bold tracking-tight leading-none shrink-0 tnum ${isHero ? 'text-white' : 'text-text-primary'
                                                        }`}
                                                >
                                                    {kpi.value}
                                                </span>

                                                {filtroSemiarido && kpi.percent && (
                                                    <span
                                                        title={`(${kpi.percent})`}
                                                        className={`text-caption font-semibold px-2 py-0.5 rounded-full inline-flex items-center leading-none ${isHero
                                                            ? 'bg-white/15 text-white border border-white/20'
                                                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60'
                                                            }`}
                                                    >
                                                        {kpi.percent}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
                    style={{ width: isMapExpanded ? 'calc(100% - 440px)' : 'calc(40% - 12px)' }}
                    className="shrink-0 h-full min-h-[460px] min-w-0 bg-surface rounded-card border border-border shadow-card relative overflow-hidden flex flex-col transition-[width] duration-300"
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

                {/* MODO EXPANDIDO: DUAS CAIXAS SEPARADAS CONFORME PROTÓTIPO */}
                {isMapExpanded ? (
                    <motion.div
                        variants={fadeUp}
                        className="w-[420px] shrink-0 h-[480px] lg:h-full flex flex-col gap-4 min-h-0 min-w-0 animate-in fade-in slide-in-from-right-4 duration-300"
                    >
                        {/* BOX 1: CABEÇALHO & BUSCA */}
                        <div className="bg-surface rounded-card border border-border shadow-card p-3.5 flex flex-col gap-2 shrink-0">
                            <div className="flex items-center justify-between gap-2 shrink-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-body-sm font-semibold text-text-primary truncate">
                                        Cursos de CT&I
                                    </span>
                                </div>
                                {selectedCursoId && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={() => setSelectedCursoId(null)}
                                        className="text-caption text-text-secondary hover:text-danger-600"
                                    >
                                        Limpar
                                    </Button>
                                )}
                            </div>

                            <div className="shrink-0">
                                <SearchInput
                                    value={sidebarSearch}
                                    onChange={(e) => setSidebarSearch(e.target.value)}
                                    onClear={() => setSidebarSearch('')}
                                    placeholder="Filtrar cursos..."
                                    size="sm"
                                />
                            </div>
                        </div>

                        {/* BOX 2: LISTA DE CURSOS */}
                        <div className="flex-1 bg-surface rounded-card border border-border shadow-card p-3 flex flex-col min-h-0 min-w-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                                {compactCursosList.length > 0 ? (
                                    compactCursosList.map((c, idx) => {
                                        const catColor = categoryColorMap[c.categoria || c.tipo] || chartTheme.textMuted;
                                        const cursoKey = c.id_curso || c.id || `${c.curso || c.nome}-${c.municipio}-${idx}`;
                                        const isSelected = selectedCursoId === cursoKey;
                                        const redeInfo = classificarInstituicao(c);

                                        return (
                                            <div
                                                key={cursoKey}
                                                onClick={() => {
                                                    setSelectedCursoId(prev => prev === cursoKey ? null : cursoKey);
                                                }}
                                                title={`${c.curso || c.nome} (${redeInfo.isPublica ? 'Pública' : 'Privada'})\n${c.categoria || c.tipo || ''}`}
                                                className={`rounded-card p-2.5 flex items-center justify-between gap-2.5 transition-colors duration-150 group cursor-pointer border w-full ${isSelected
                                                    ? (filtroSemiarido
                                                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/20'
                                                        : 'bg-primary-50/50 dark:bg-primary-950/30 border-primary-500 ring-1 ring-primary-500/20')
                                                    : (filtroSemiarido
                                                        ? 'bg-surface border-border hover:border-amber-400/70 hover:bg-amber-50/30 dark:hover:bg-amber-950/15'
                                                        : 'bg-surface border-border hover:border-border-strong hover:bg-surface-soft/60')
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <div
                                                        className="w-7 h-7 rounded-control flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                                                        style={{
                                                            backgroundColor: getAlphaColor(catColor),
                                                            color: catColor
                                                        }}
                                                        title={c.categoria || c.tipo || 'Geral'}
                                                    >
                                                        <GraduationCap size={14} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <h5
                                                            title={c.curso || c.nome}
                                                            className={`text-caption font-semibold leading-tight truncate transition-colors ${isSelected
                                                                ? (filtroSemiarido ? 'text-amber-800 dark:text-amber-200' : 'text-primary-800 dark:text-primary-200')
                                                                : (filtroSemiarido ? 'text-text-primary group-hover:text-amber-600' : 'text-text-primary group-hover:text-primary-600')
                                                                }`}>
                                                            {c.curso || c.nome}
                                                        </h5>
                                                        <span className="text-caption text-text-secondary truncate leading-tight flex items-center gap-1.5 mt-0.5">
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                style={{ backgroundColor: catColor }}
                                                                title={c.categoria || c.tipo}
                                                            />
                                                            <span className="truncate">
                                                                {c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)} • <strong className="font-semibold text-text-primary">{c.municipio}</strong>
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <Badge
                                                    variant={redeInfo.isPublica ? 'success' : 'accent'}
                                                    className="text-caption font-medium shrink-0"
                                                >
                                                    {redeInfo.isPublica ? 'Pública' : 'Privada'}
                                                </Badge>
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
                        </div>
                    </motion.div>
                ) : (
                    /* LADO DIREITO: CATÁLOGO COM A NOVA ABA DE CURSOS EAD */
                    <motion.div variants={fadeUp} className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">

                        {/* BARRA SUPERIOR DE ABAS E BUSCA */}
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0 min-w-0">
                            <div className="flex items-center gap-2.5 flex-nowrap min-w-0 overflow-x-auto scrollbar-none">
                                <Tabs
                                    items={[
                                        {
                                            id: 'catalogo',
                                            label: 'Catálogo',
                                            icon: <BookOpen size={15} />
                                        },
                                        {
                                            id: 'ead',
                                            label: 'Cursos EaD',
                                            icon: <Laptop size={15} />
                                        },
                                        {
                                            id: 'areas',
                                            label: 'Áreas',
                                            icon: <Filter size={15} />
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
                                        },
                                        {
                                            id: 'filtros',
                                            label: (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span>Filtros</span>
                                                    {activeFiltersCount > 0 && (
                                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] leading-none font-bold bg-primary-600 text-white dark:bg-primary-500">
                                                            {activeFiltersCount}
                                                        </span>
                                                    )}
                                                </span>
                                            ),
                                            icon: <SlidersHorizontal size={15} />
                                        }
                                    ]}
                                    value={activeTab}
                                    onChange={(tab) => setActiveTab(tab)}
                                    variant="pill"
                                    className="shrink-0"
                                />
                            </div>

                            {/* INPUT DE BUSCA */}
                            <div className="w-full lg:w-64 min-w-0 shrink-0">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (e.target.value.trim() && activeTab !== 'catalogo' && activeTab !== 'ead' && activeTab !== 'filtros') {
                                            setActiveTab('catalogo');
                                        }
                                    }}
                                    onClear={() => setSearchQuery('')}
                                    placeholder="Buscar curso, instituição ou cidade... (/)"
                                    size="sm"
                                />
                            </div>
                        </div>

                        {/* CONTEÚDO DAS ABAS */}
                        <div className="flex-1 min-w-0 bg-surface rounded-card border border-border shadow-card p-5 flex flex-col min-h-0 overflow-hidden">

                            {/* ABA 1: CATÁLOGO COMPLETO DE CURSOS PRESENCIAIS */}
                            {activeTab === 'catalogo' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory ? `Cursos Presenciais em ${territoryName}` : 'Cursos Presenciais de CT&I'}
                                            </h3>
                                            {activeFiltersCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('filtros')}
                                                    className="text-caption font-medium text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 px-2 py-0.5 rounded-full cursor-pointer inline-flex items-center gap-1"
                                                    title="Ver e gerenciar filtros aplicados na aba Filtros"
                                                >
                                                    <SlidersHorizontal size={11} />
                                                    <span>{activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* FILTROS DE REDE EMBUTIDOS NO HEADER DA LISTA */}
                                            <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                                                <span className="text-caption font-medium text-text-muted pl-0.5">Rede:</span>
                                                <Chip
                                                    selected={selectedRede === 'todas'}
                                                    onClick={() => setSelectedRede('todas')}
                                                    variant="neutral"
                                                    size="sm"
                                                >
                                                    Todas
                                                </Chip>
                                                <Chip
                                                    selected={selectedRede === 'publica'}
                                                    onClick={() => setSelectedRede(prev => prev === 'publica' ? 'todas' : 'publica')}
                                                    variant="success"
                                                    size="sm"
                                                >
                                                    Pública
                                                </Chip>
                                                <Chip
                                                    selected={selectedRede === 'privada'}
                                                    onClick={() => setSelectedRede(prev => prev === 'privada' ? 'todas' : 'privada')}
                                                    variant="accent"
                                                    size="sm"
                                                >
                                                    Privada
                                                </Chip>
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
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 min-h-0 w-full pb-2">
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
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 88px' }}
                                                        onClick={() => {
                                                            setSelectedCursoId(prev => prev === cursoKey ? null : cursoKey);
                                                        }}
                                                        className={`rounded-card p-3.5 flex flex-col justify-between gap-2.5 transition-colors duration-150 group cursor-pointer border w-full scroll-mt-2 ${isSelected
                                                            ? (filtroSemiarido
                                                                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/20'
                                                                : 'bg-primary-50/50 dark:bg-primary-950/30 border-primary-500 ring-1 ring-primary-500/20')
                                                            : (filtroSemiarido
                                                                ? 'bg-surface border-border hover:border-amber-400/70 hover:bg-amber-50/30 dark:hover:bg-amber-950/15'
                                                                : 'bg-surface border-border hover:border-border-strong hover:bg-surface-soft/60')
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3 w-full">
                                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                                <div
                                                                    className="w-8 h-8 rounded-control flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105"
                                                                    style={{ backgroundColor: getAlphaColor(catColor, chartTheme.isDark ? 0.22 : 0.12), color: catColor }}
                                                                >
                                                                    <GraduationCap size={16} />
                                                                </div>
                                                                <div className="flex flex-col min-w-0 flex-1">
                                                                    <h4 className={`text-body-sm font-semibold leading-tight break-words transition-colors ${isSelected
                                                                        ? (filtroSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-primary-600 dark:text-primary-400')
                                                                        : (filtroSemiarido ? 'text-text-primary group-hover:text-amber-700 dark:group-hover:text-amber-400' : 'text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400')
                                                                        }`}>
                                                                        {c.curso || c.nome}
                                                                    </h4>

                                                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-caption text-text-secondary mt-1 font-medium">
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

                                                            <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                                                                <Badge
                                                                    variant={redeInfo.isPublica ? 'success' : 'accent'}
                                                                    className="text-caption font-medium"
                                                                >
                                                                    {redeInfo.isPublica ? 'Pública' : 'Privada'}
                                                                </Badge>
                                                                <Badge
                                                                    variant="neutral"
                                                                    className="text-caption font-medium"
                                                                >
                                                                    Presencial
                                                                </Badge>
                                                                <Badge
                                                                    variant="neutral"
                                                                    className="text-caption font-medium"
                                                                    style={{
                                                                        backgroundColor: getAlphaColor(catColor, chartTheme.isDark ? 0.18 : 0.12),
                                                                        color: catColor,
                                                                        borderColor: getAlphaColor(catColor, chartTheme.isDark ? 0.35 : 0.25)
                                                                    }}
                                                                >
                                                                    {c.categoria || c.tipo || 'Geral'}
                                                                </Badge>
                                                                {c.url_referencia && (
                                                                    <a
                                                                        href={c.url_referencia}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="p-1 rounded-control text-text-muted hover:text-primary-600 hover:bg-surface-soft transition-colors"
                                                                        title="Fonte Oficial"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <ExternalLink size={14} />
                                                                    </a>
                                                                )}
                                                            </div>
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
                                    <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory ? `Cursos EaD em ${territoryName}` : 'Oferta de Cursos à Distância (EaD) e Semipresenciais'}
                                            </h3>
                                            {activeFiltersCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('filtros')}
                                                    className="text-caption font-medium text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 px-2 py-0.5 rounded-full cursor-pointer inline-flex items-center gap-1"
                                                    title="Ver e gerenciar filtros aplicados na aba Filtros"
                                                >
                                                    <SlidersHorizontal size={11} />
                                                    <span>{activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* FILTROS DE REDE EMBUTIDOS NO HEADER DA LISTA EAD */}
                                            <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                                                <span className="text-caption font-medium text-text-muted pl-0.5">Rede:</span>
                                                <Chip
                                                    selected={selectedRede === 'todas'}
                                                    onClick={() => setSelectedRede('todas')}
                                                    variant="neutral"
                                                    size="sm"
                                                >
                                                    Todas
                                                </Chip>
                                                <Chip
                                                    selected={selectedRede === 'publica'}
                                                    onClick={() => setSelectedRede(prev => prev === 'publica' ? 'todas' : 'publica')}
                                                    variant="success"
                                                    size="sm"
                                                >
                                                    Pública
                                                </Chip>
                                                <Chip
                                                    selected={selectedRede === 'privada'}
                                                    onClick={() => setSelectedRede(prev => prev === 'privada' ? 'todas' : 'privada')}
                                                    variant="accent"
                                                    size="sm"
                                                >
                                                    Privada
                                                </Chip>
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
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 min-h-0 w-full pb-2">
                                        {loadingStats ? (
                                            <div className="p-3">
                                                <ListRowSkeleton count={6} />
                                            </div>
                                        ) : filteredEadCursos.length > 0 ? (
                                            filteredEadCursos.map((c, idx) => {
                                                const catColor = categoryColorMap[c.categoria || c.tipo] || chartTheme.palette[0];
                                                const cursoKey = c.id || `ead-${c.curso || c.nome}-${idx}`;
                                                const isSelected = selectedCursoId === cursoKey;
                                                const redeInfo = classificarInstituicao(c);

                                                return (
                                                    <div
                                                        key={cursoKey}
                                                        ref={(el) => {
                                                            if (el && cursoKey) itemRefs.current[cursoKey] = el;
                                                        }}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 88px' }}
                                                        onClick={() => {
                                                            setSelectedCursoId(prev => prev === cursoKey ? null : cursoKey);
                                                        }}
                                                        className={`rounded-card p-3.5 flex flex-col justify-between gap-2.5 transition-colors duration-150 group cursor-pointer border w-full scroll-mt-2 ${isSelected
                                                            ? (filtroSemiarido
                                                                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/20'
                                                                : 'bg-primary-50/50 dark:bg-primary-950/30 border-primary-500 ring-1 ring-primary-500/20')
                                                            : (filtroSemiarido
                                                                ? 'bg-surface border-border hover:border-amber-400/70 hover:bg-amber-50/30 dark:hover:bg-amber-950/15'
                                                                : 'bg-surface border-border hover:border-border-strong hover:bg-surface-soft/60')
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3 w-full">
                                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                                <div
                                                                    className="w-8 h-8 rounded-control flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105"
                                                                    style={{ backgroundColor: getAlphaColor(catColor, chartTheme.isDark ? 0.22 : 0.12), color: catColor }}
                                                                >
                                                                    <Laptop size={16} />
                                                                </div>
                                                                <div className="flex flex-col min-w-0 flex-1">
                                                                    <h4 className={`text-body-sm font-semibold leading-tight break-words transition-colors ${isSelected
                                                                        ? (filtroSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-primary-600 dark:text-primary-400')
                                                                        : (filtroSemiarido ? 'text-text-primary group-hover:text-amber-700 dark:group-hover:text-amber-400' : 'text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400')
                                                                        }`}>
                                                                        {c.curso || c.nome}
                                                                    </h4>

                                                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-caption text-text-secondary mt-1 font-medium">
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

                                                            <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                                                                <Badge
                                                                    variant={redeInfo.isPublica ? 'success' : 'accent'}
                                                                    className="text-caption font-medium"
                                                                >
                                                                    {redeInfo.isPublica ? 'Pública' : 'Privada'}
                                                                </Badge>
                                                                <Badge
                                                                    variant="primary"
                                                                    icon={<Wifi size={12} strokeWidth={2} />}
                                                                    className="text-caption font-medium"
                                                                >
                                                                    EaD
                                                                </Badge>
                                                                <Badge
                                                                    variant="neutral"
                                                                    className="text-caption font-medium"
                                                                    style={{
                                                                        backgroundColor: getAlphaColor(catColor, chartTheme.isDark ? 0.18 : 0.12),
                                                                        color: catColor,
                                                                        borderColor: getAlphaColor(catColor, chartTheme.isDark ? 0.35 : 0.25)
                                                                    }}
                                                                >
                                                                    {c.categoria || c.tipo || 'Geral'}
                                                                </Badge>
                                                                {c.url_referencia && (
                                                                    <a
                                                                        href={c.url_referencia}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="p-1 rounded-control text-text-muted hover:text-primary-600 hover:bg-surface-soft transition-colors"
                                                                        title="Fonte Oficial"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <ExternalLink size={14} />
                                                                    </a>
                                                                )}
                                                            </div>
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

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                                        {categoryStats.length > 0 ? (
                                            categoryStats.map((cat) => {
                                                const isSelected = selectedCategory === cat.name;
                                                const totalCourses = activeScopedCursos.length || categoryStats.reduce((acc, c) => acc + c.count, 0) || 1;
                                                const remaining = Math.max(0, totalCourses - cat.count);

                                                const negPillStyle = filtroSemiarido
                                                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25'
                                                    : 'bg-surface-soft text-text-secondary border border-border';
                                                const totalPillStyle = filtroSemiarido
                                                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/40'
                                                    : 'bg-surface-soft text-text-primary border border-border';

                                                return (
                                                    <div
                                                        key={cat.name}
                                                        onClick={() => setSelectedCategory(isSelected ? 'todas' : cat.name)}
                                                        className={`p-2 rounded-xl transition-all cursor-pointer border ${isSelected
                                                            ? (filtroSemiarido ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/20 shadow-xs' : 'bg-primary-50/60 dark:bg-primary-950/40 border-primary-400 ring-2 ring-primary-500/20 shadow-xs')
                                                            : (filtroSemiarido ? 'bg-surface border-transparent hover:bg-amber-50/30 dark:hover:bg-amber-950/20 hover:border-amber-200' : 'bg-surface border-transparent hover:bg-surface-soft hover:border-border')
                                                        }`}
                                                    >
                                                        {/* RÓTULO COM NOME DA ÁREA */}
                                                        <div className="text-caption font-semibold text-text-primary leading-tight flex items-center justify-between mb-1 px-0.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: cat.color }} />
                                                                <span className="truncate">{cat.name}</span>
                                                            </div>
                                                            <span className="text-caption text-text-muted font-normal tabular-nums">{cat.percent}% da oferta</span>
                                                        </div>

                                                        {/* BARRAS DE PÍLULAS */}
                                                        <div className="flex items-center gap-2 w-full">
                                                            <div
                                                                className="h-[28px] rounded-full flex items-center justify-center px-2.5 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap"
                                                                style={{
                                                                    flexGrow: cat.count,
                                                                    flexBasis: 0,
                                                                    backgroundColor: cat.color,
                                                                    color: getContrastTextColor(cat.color),
                                                                    minWidth: remaining > 0 ? '76px' : 'auto'
                                                                }}
                                                                title={`${cat.name}: ${cat.count} cursos (${cat.percent}%)`}
                                                            >
                                                                <span className="text-caption font-semibold tabular-nums leading-none whitespace-nowrap">
                                                                    {cat.count} <span className="text-caption font-medium opacity-90">({cat.percent}%)</span>
                                                                </span>
                                                            </div>

                                                            {remaining > 0 && (
                                                                <div
                                                                    className={`h-[28px] rounded-full ${negPillStyle} flex items-center justify-center px-2.5 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap`}
                                                                    style={{
                                                                        flexGrow: remaining,
                                                                        flexBasis: 0
                                                                    }}
                                                                />
                                                            )}

                                                            <div
                                                                className={`h-[28px] min-w-[36px] px-2.5 rounded-full ${totalPillStyle} flex items-center justify-center shrink-0 select-none shadow-2xs`}
                                                                title={`Total de cursos: ${cat.count}`}
                                                            >
                                                                <span className="text-caption font-bold tabular-nums leading-none">
                                                                    {cat.count}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                <EmptyState
                                                    icon={Filter}
                                                    title="Nenhuma área de ensino registrada"
                                                    description="Nenhum dado encontrado para o filtro atual."
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ABA 4: RANKING DE TERRITÓRIOS OU MUNICÍPIOS */}
                            {activeTab === 'ranking' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="mb-3 shrink-0 flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory ? `Ranking de Municípios · ${territoryName}` : 'Ranking Territorial de Oferta de Cursos'}
                                            </h3>
                                            <p className="text-caption text-text-secondary font-medium">
                                                Densidade de cursos de CT&I por localidade
                                            </p>
                                        </div>

                                        {selectedTerritory && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedTerritory(null)}
                                                className="text-caption font-semibold px-2.5 py-1 rounded-full text-primary-700 dark:text-primary-300 bg-primary-100/70 dark:bg-primary-950/40 hover:bg-primary-200/70 dark:hover:bg-primary-900/50 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                            >
                                                ← Ver Todos os Territórios
                                            </button>
                                        )}
                                    </div>

                                    {/* LISTA RANKING: ESTILO DE PÍLULAS PROPORCIONAIS */}
                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0 w-full pb-2">
                                        {selectedTerritory ? (
                                            municipalityRanking.length > 0 ? (
                                                municipalityRanking.map((m) => {
                                                    const pos = Number(m.publicaCount || 0);
                                                    const total = Number(m.count || 0);
                                                    const neg = Math.max(0, total - pos);
                                                    const percentPos = total > 0 ? ((pos / total) * 100).toFixed(1) : '0.0';
                                                    const percentNeg = total > 0 ? ((neg / total) * 100).toFixed(1) : '0.0';

                                                    const posPillColor = filtroSemiarido ? '#D97706' : '#2563EB';
                                                    const negPillStyle = filtroSemiarido
                                                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25'
                                                        : 'bg-surface-soft text-text-secondary border border-border';
                                                    const totalPillStyle = filtroSemiarido
                                                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/40'
                                                        : 'bg-surface-soft text-text-primary border border-border';

                                                    return (
                                                        <div
                                                            key={m.name}
                                                            onClick={() => {
                                                                setSearchQuery(m.name);
                                                                setActiveTab('catalogo');
                                                            }}
                                                            className={`p-2 rounded-xl transition-all cursor-pointer border ${filtroSemiarido
                                                                ? 'bg-surface border-transparent hover:bg-amber-50/30 dark:hover:bg-amber-950/20 hover:border-amber-200'
                                                                : 'bg-surface border-transparent hover:bg-surface-soft hover:border-border'
                                                            }`}
                                                        >
                                                            {/* RÓTULO COM NOME DO MUNICÍPIO */}
                                                            <div className="text-caption font-semibold text-text-primary leading-tight flex items-center justify-between mb-1 px-0.5">
                                                                <span className="truncate">{m.name}</span>
                                                                <span className="text-caption text-text-muted font-normal tabular-nums">{m.percentTotal}% do território</span>
                                                            </div>

                                                            {/* BARRAS DE PÍLULAS */}
                                                            <div className="flex items-center gap-2 w-full">
                                                                {/* PÚBLICA (Positivo) */}
                                                                {pos > 0 && (
                                                                    <div
                                                                        className="h-[28px] rounded-full flex items-center justify-center px-2.5 text-white transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap"
                                                                        style={{
                                                                            flexGrow: pos,
                                                                            flexBasis: 0,
                                                                            backgroundColor: posPillColor,
                                                                            minWidth: neg > 0 ? '76px' : 'auto'
                                                                        }}
                                                                        title={`Rede Pública: ${pos} (${percentPos}%)`}
                                                                    >
                                                                        <span className="text-caption font-medium tabular-nums leading-none whitespace-nowrap">
                                                                            {pos} <span className="text-caption font-medium opacity-90">({percentPos}%)</span>
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* PRIVADA (Negativo) */}
                                                                {neg > 0 && (
                                                                    <div
                                                                        className={`h-[28px] rounded-full ${negPillStyle} flex items-center justify-center px-2.5 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap`}
                                                                        style={{
                                                                            flexGrow: neg,
                                                                            flexBasis: 0,
                                                                            minWidth: pos > 0 ? '76px' : 'auto'
                                                                        }}
                                                                        title={`Rede Privada: ${neg} (${percentNeg}%)`}
                                                                    >
                                                                        <span className="text-caption font-medium tabular-nums leading-none whitespace-nowrap">
                                                                            {neg} <span className="text-caption font-medium opacity-85">({percentNeg}%)</span>
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* TOTAL */}
                                                                <div
                                                                    className={`h-[28px] min-w-[36px] px-2.5 rounded-full ${totalPillStyle} flex items-center justify-center shrink-0 select-none shadow-2xs`}
                                                                    title={`Total de cursos: ${total}`}
                                                                >
                                                                    <span className="text-caption font-bold tabular-nums leading-none">
                                                                        {total}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                    <EmptyState
                                                        icon={MapPin}
                                                        title="Nenhum município com cursos cadastrados neste território"
                                                        description="Não há registros de cursos de CT&I para os municípios deste território."
                                                    />
                                                </div>
                                            )
                                        ) : (
                                            territoryRanking.length > 0 ? (
                                                territoryRanking.map((t) => {
                                                    const isSelected = selectedTerritory && (
                                                        (t.id && Number(selectedTerritory.id_territorio) === Number(t.id)) ||
                                                        normalize(selectedTerritory.nome_territorio || selectedTerritory.territorio || selectedTerritory.nome) === normalize(t.name)
                                                    );
                                                    const pos = Number(t.publicaCount || 0);
                                                    const total = Number(t.count || 0);
                                                    const neg = Math.max(0, total - pos);
                                                    const percentPos = total > 0 ? ((pos / total) * 100).toFixed(1) : '0.0';
                                                    const percentNeg = total > 0 ? ((neg / total) * 100).toFixed(1) : '0.0';

                                                    const posPillColor = filtroSemiarido ? '#D97706' : '#2563EB';
                                                    const negPillStyle = filtroSemiarido
                                                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25'
                                                        : 'bg-surface-soft text-text-secondary border border-border';
                                                    const totalPillStyle = filtroSemiarido
                                                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/40'
                                                        : 'bg-surface-soft text-text-primary border border-border';

                                                    return (
                                                        <div
                                                            key={t.id || t.name}
                                                            onClick={() => {
                                                                const found = (territoriosData || []).find(x => 
                                                                    (t.id && Number(x.id_territorio) === Number(t.id)) ||
                                                                    normalize(x.nome_territorio || x.territorio || x.nome) === normalize(t.name)
                                                                );
                                                                setSelectedTerritory(found || { id_territorio: t.id, nome_territorio: t.name });
                                                            }}
                                                            className={`p-2 rounded-xl transition-all cursor-pointer border ${isSelected
                                                                ? (filtroSemiarido ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/20 shadow-xs' : 'bg-primary-50/60 dark:bg-primary-950/40 border-primary-400 ring-2 ring-primary-500/20 shadow-xs')
                                                                : (filtroSemiarido ? 'bg-surface border-transparent hover:bg-amber-50/30 dark:hover:bg-amber-950/20 hover:border-amber-200' : 'bg-surface border-transparent hover:bg-surface-soft hover:border-border')
                                                            }`}
                                                        >
                                                            {/* RÓTULO COM NOME DO TERRITÓRIO */}
                                                            <div className="text-caption font-semibold text-text-primary leading-tight flex items-center justify-between mb-1 px-0.5">
                                                                <span className="truncate">{t.name}</span>
                                                                <span className="text-caption text-text-muted font-normal tabular-nums">{t.percentTotal}% do estado</span>
                                                            </div>

                                                            {/* BARRAS DE PÍLULAS */}
                                                            <div className="flex items-center gap-2 w-full">
                                                                {/* PÚBLICA (Positivo) */}
                                                                {pos > 0 && (
                                                                    <div
                                                                        className="h-[28px] rounded-full flex items-center justify-center px-2.5 text-white transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap"
                                                                        style={{
                                                                            flexGrow: pos,
                                                                            flexBasis: 0,
                                                                            backgroundColor: posPillColor,
                                                                            minWidth: neg > 0 ? '76px' : 'auto'
                                                                        }}
                                                                        title={`Rede Pública: ${pos} (${percentPos}%)`}
                                                                    >
                                                                        <span className="text-caption font-medium tabular-nums leading-none whitespace-nowrap">
                                                                            {pos} <span className="text-caption font-medium opacity-90">({percentPos}%)</span>
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* PRIVADA (Negativo) */}
                                                                {neg > 0 && (
                                                                    <div
                                                                        className={`h-[28px] rounded-full ${negPillStyle} flex items-center justify-center px-2.5 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap`}
                                                                        style={{
                                                                            flexGrow: neg,
                                                                            flexBasis: 0,
                                                                            minWidth: pos > 0 ? '76px' : 'auto'
                                                                        }}
                                                                        title={`Rede Privada: ${neg} (${percentNeg}%)`}
                                                                    >
                                                                        <span className="text-caption font-medium tabular-nums leading-none whitespace-nowrap">
                                                                            {neg} <span className="text-caption font-medium opacity-85">({percentNeg}%)</span>
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* TOTAL */}
                                                                <div
                                                                    className={`h-[28px] min-w-[36px] px-2.5 rounded-full ${totalPillStyle} flex items-center justify-center shrink-0 select-none shadow-2xs`}
                                                                    title={`Total de cursos: ${total}`}
                                                                >
                                                                    <span className="text-caption font-bold tabular-nums leading-none">
                                                                        {total}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                    <EmptyState
                                                        icon={TrendingUp}
                                                        title="Nenhum território encontrado"
                                                        description="Não há registros de oferta de cursos de CT&I para os filtros selecionados."
                                                    />
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* LEGENDA NO RODAPÉ */}
                                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-border shrink-0 text-caption font-medium mt-auto">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2.5 h-2.5 rounded-full ${filtroSemiarido ? 'bg-amber-600' : 'bg-primary-600'} shadow-2xs`}></span>
                                            <span className={filtroSemiarido ? 'text-amber-900 dark:text-amber-300 font-semibold' : 'text-text-primary font-semibold'}>Rede Pública</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2.5 h-2.5 rounded-full ${filtroSemiarido ? 'bg-amber-500/20' : 'bg-border'} shadow-2xs`}></span>
                                            <span className={filtroSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-text-secondary'}>Rede Privada</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <span className={`w-2.5 h-2.5 rounded-full ${filtroSemiarido ? 'bg-amber-300' : 'bg-border-strong'} shadow-2xs`}></span>
                                            <span className={filtroSemiarido ? 'text-amber-800 dark:text-amber-300 font-medium' : 'text-text-secondary font-medium'}>Total</span>
                                        </div>
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

                                    {/* LISTA RANKING IES */}
                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                                        {iesRanking.length > 0 ? (
                                            iesRanking.map((ies, idx) => {
                                                const isSelected = selectedIES && (
                                                    (ies.sigla && selectedIES.toUpperCase() === ies.sigla.toUpperCase()) ||
                                                    selectedIES === ies.fullName
                                                );
                                                const maxCount = iesRanking[0]?.count || 1;
                                                const pct = Math.min(100, Math.round((ies.count / maxCount) * 100));
                                                const remaining = Math.max(0, maxCount - ies.count);
                                                const rankStr = String(idx + 1).padStart(2, '0');

                                                const fillColor = filtroSemiarido ? '#D97706' : '#2563EB';
                                                const negPillStyle = filtroSemiarido
                                                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25'
                                                    : 'bg-surface-soft text-text-secondary border border-border';
                                                const totalPillStyle = filtroSemiarido
                                                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/40'
                                                    : 'bg-surface-soft text-text-primary border border-border';

                                                return (
                                                    <div
                                                        key={ies.sigla || ies.fullName}
                                                        onClick={() => setSelectedIES(isSelected ? null : (ies.sigla || ies.fullName))}
                                                        className={`p-2 rounded-xl transition-all cursor-pointer border ${isSelected
                                                            ? (filtroSemiarido ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/20 shadow-xs' : 'bg-primary-50/60 dark:bg-primary-950/40 border-primary-400 ring-2 ring-primary-500/20 shadow-xs')
                                                            : (filtroSemiarido ? 'bg-surface border-transparent hover:bg-amber-50/30 dark:hover:bg-amber-950/20 hover:border-amber-200' : 'bg-surface border-transparent hover:bg-surface-soft hover:border-border')
                                                        }`}
                                                    >
                                                        {/* RÓTULO COM RANK E NOME DA IES */}
                                                        <div className="text-caption font-semibold text-text-primary leading-tight flex items-center justify-between mb-1 px-0.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="text-text-muted font-bold tnum">{rankStr}.</span>
                                                                <span className="truncate">{ies.sigla}</span>
                                                                <span className="text-caption text-text-muted font-normal truncate hidden sm:inline">· {ies.fullName}</span>
                                                            </div>
                                                            <span className="text-caption text-text-muted font-normal shrink-0">{ies.municipios.size} {ies.municipios.size === 1 ? 'cid.' : 'cids.'}</span>
                                                        </div>

                                                        {/* BARRAS DE PÍLULAS */}
                                                        <div className="flex items-center gap-2 w-full">
                                                            {/* PREENCHIMENTO */}
                                                            <div
                                                                className="h-[28px] rounded-full flex items-center justify-center px-2.5 text-white transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap"
                                                                style={{
                                                                    flexGrow: ies.count,
                                                                    flexBasis: 0,
                                                                    backgroundColor: fillColor,
                                                                    minWidth: remaining > 0 ? '76px' : 'auto'
                                                                }}
                                                                title={`${ies.fullName}: ${ies.count} cursos (${pct}% do líder)`}
                                                            >
                                                                <span className="text-caption font-medium tabular-nums leading-none whitespace-nowrap">
                                                                    {ies.count} <span className="text-caption font-medium opacity-90">({pct}%)</span>
                                                                </span>
                                                            </div>

                                                            {/* RESTANTE */}
                                                            {remaining > 0 && (
                                                                <div
                                                                    className={`h-[28px] rounded-full ${negPillStyle} flex items-center justify-center px-2.5 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap`}
                                                                    style={{
                                                                        flexGrow: remaining,
                                                                        flexBasis: 0
                                                                    }}
                                                                />
                                                            )}

                                                            {/* TOTAL */}
                                                            <div
                                                                className={`h-[28px] min-w-[36px] px-2.5 rounded-full ${totalPillStyle} flex items-center justify-center shrink-0 select-none shadow-2xs`}
                                                                title={`Total de cursos: ${ies.count}`}
                                                            >
                                                                <span className="text-caption font-bold tabular-nums leading-none">
                                                                    {ies.count}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                <EmptyState
                                                    icon={Building2}
                                                    title="Nenhuma instituição encontrada"
                                                    description="Não foram encontradas instituições para os filtros selecionados."
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ABA 6: FILTROS APLICADOS */}
                            {activeTab === 'filtros' && (
                                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/70 shrink-0 flex-wrap gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-body-sm font-semibold text-text-primary">
                                                    Filtros Aplicados
                                                </h3>
                                                <Badge variant={activeFiltersCount > 0 ? 'primary' : 'neutral'} size="sm">
                                                    {activeFiltersCount} ativo{activeFiltersCount === 1 ? '' : 's'}
                                                </Badge>
                                            </div>
                                            <p className="text-caption text-text-secondary mt-0.5">
                                                Parâmetros que refinam os cursos apresentados no mapa e no catálogo.
                                            </p>
                                        </div>
                                        {activeFiltersCount > 0 && (
                                            <Button
                                                variant="outline"
                                                size="xs"
                                                onClick={handleClearAllFilters}
                                                className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-950/40 text-caption font-semibold cursor-pointer"
                                            >
                                                Limpar Todos os Filtros
                                            </Button>
                                        )}
                                    </div>

                                    {/* GRID DE PARÂMETROS / FILTROS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5 shrink-0">
                                        {/* 1. ÁREA TEMÁTICA */}
                                        <div className="p-3.5 rounded-panel border border-border bg-surface-soft flex flex-col justify-between gap-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-caption font-semibold text-text-secondary flex items-center gap-1.5">
                                                    <Filter size={13} className="text-primary-600" />
                                                    Área Temática de CT&I
                                                </span>
                                                {selectedCategory !== 'todas' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedCategory('todas')}
                                                        className="text-micro font-medium text-text-muted hover:text-danger-600 cursor-pointer"
                                                    >
                                                        Remover
                                                    </button>
                                                )}
                                            </div>
                                            {selectedCategory !== 'todas' ? (
                                                <Chip
                                                    selected
                                                    variant="primary"
                                                    size="md"
                                                    onClick={() => setSelectedCategory('todas')}
                                                    className="w-full justify-between cursor-pointer"
                                                    title={`Clique para remover filtro de ${selectedCategory}`}
                                                >
                                                    <span className="truncate">{selectedCategory}</span>
                                                    <span className="text-text-muted hover:text-text-primary font-bold ml-1">×</span>
                                                </Chip>
                                            ) : (
                                                <p className="text-caption text-text-muted">
                                                    Todas as áreas incluídas (sem restrição).
                                                </p>
                                            )}
                                        </div>

                                        {/* 2. INSTITUIÇÃO DE ENSINO (IES) */}
                                        <div className="p-3.5 rounded-panel border border-border bg-surface-soft flex flex-col justify-between gap-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-caption font-semibold text-text-secondary flex items-center gap-1.5">
                                                    <Building2 size={13} className="text-primary-600" />
                                                    Instituição de Ensino Superior
                                                </span>
                                                {selectedIES && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedIES(null)}
                                                        className="text-micro font-medium text-text-muted hover:text-danger-600 cursor-pointer"
                                                    >
                                                        Remover
                                                    </button>
                                                )}
                                            </div>
                                            {selectedIES ? (
                                                <Chip
                                                    selected
                                                    variant="primary"
                                                    size="md"
                                                    onClick={() => setSelectedIES(null)}
                                                    className="w-full justify-between cursor-pointer"
                                                    title={`Clique para remover filtro de ${selectedIES}`}
                                                >
                                                    <span className="truncate">{selectedIES}</span>
                                                    <span className="text-text-muted hover:text-text-primary font-bold ml-1">×</span>
                                                </Chip>
                                            ) : (
                                                <p className="text-caption text-text-muted">
                                                    Todas as instituições incluídas.
                                                </p>
                                            )}
                                        </div>

                                        {/* 3. TERRITÓRIO DE IDENTIDADE */}
                                        <div className="p-3.5 rounded-panel border border-border bg-surface-soft flex flex-col justify-between gap-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-caption font-semibold text-text-secondary flex items-center gap-1.5">
                                                    <MapPin size={13} className="text-primary-600" />
                                                    Território de Identidade
                                                </span>
                                                {selectedTerritory && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTerritory(null)}
                                                        className="text-micro font-medium text-text-muted hover:text-danger-600 cursor-pointer"
                                                    >
                                                        Remover
                                                    </button>
                                                )}
                                            </div>
                                            {selectedTerritory ? (
                                                <Chip
                                                    selected
                                                    variant="neutral"
                                                    size="md"
                                                    onClick={() => setSelectedTerritory(null)}
                                                    className="w-full justify-between cursor-pointer"
                                                    title={`Clique para remover filtro de ${territoryName}`}
                                                >
                                                    <span className="truncate">{territoryName}</span>
                                                    <span className="text-text-muted hover:text-text-primary font-bold ml-1">×</span>
                                                </Chip>
                                            ) : (
                                                <p className="text-caption text-text-muted">
                                                    Toda a Bahia (27 Territórios de Identidade).
                                                </p>
                                            )}
                                        </div>

                                        {/* 4. REDE DE ENSINO */}
                                        <div className="p-3.5 rounded-panel border border-border bg-surface-soft flex flex-col justify-between gap-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-caption font-semibold text-text-secondary flex items-center gap-1.5">
                                                    <GraduationCap size={13} className="text-primary-600" />
                                                    Rede de Ensino
                                                </span>
                                                {selectedRede !== 'todas' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedRede('todas')}
                                                        className="text-micro font-medium text-text-muted hover:text-danger-600 cursor-pointer"
                                                    >
                                                        Resetar
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Chip
                                                    selected={selectedRede === 'todas'}
                                                    onClick={() => setSelectedRede('todas')}
                                                    variant="neutral"
                                                    size="sm"
                                                >
                                                    Todas ({redeStats.total})
                                                </Chip>
                                                <Chip
                                                    selected={selectedRede === 'publica'}
                                                    onClick={() => setSelectedRede(prev => prev === 'publica' ? 'todas' : 'publica')}
                                                    variant="success"
                                                    size="sm"
                                                >
                                                    Pública ({redeStats.publica})
                                                </Chip>
                                                <Chip
                                                    selected={selectedRede === 'privada'}
                                                    onClick={() => setSelectedRede(prev => prev === 'privada' ? 'todas' : 'privada')}
                                                    variant="accent"
                                                    size="sm"
                                                >
                                                    Privada ({redeStats.privada})
                                                </Chip>
                                            </div>
                                        </div>

                                        {/* 5. RECORTE REGIONAL: SEMIÁRIDO */}
                                        <div className="p-3.5 rounded-panel border border-border bg-surface-soft flex flex-col justify-between gap-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-caption font-semibold text-text-secondary flex items-center gap-1.5">
                                                    <Flame size={13} className="text-amber-500" />
                                                    Recorte Semiárido Baiano
                                                </span>
                                                {filtroSemiarido && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFiltroSemiarido(false)}
                                                        className="text-micro font-medium text-text-muted hover:text-danger-600 cursor-pointer"
                                                    >
                                                        Desativar
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Chip
                                                    selected={!filtroSemiarido}
                                                    onClick={() => setFiltroSemiarido(false)}
                                                    variant="neutral"
                                                    size="sm"
                                                >
                                                    Todo o Estado
                                                </Chip>
                                                <Chip
                                                    selected={filtroSemiarido}
                                                    onClick={() => setFiltroSemiarido(prev => !prev)}
                                                    variant="warning"
                                                    size="sm"
                                                >
                                                    Apenas Semiárido
                                                </Chip>
                                            </div>
                                        </div>

                                        {/* 6. BUSCA POR TEXTO */}
                                        <div className="p-3.5 rounded-panel border border-border bg-surface-soft flex flex-col justify-between gap-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-caption font-semibold text-text-secondary flex items-center gap-1.5">
                                                    Busca por Texto
                                                </span>
                                                {searchQuery.trim() && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSearchQuery('')}
                                                        className="text-micro font-medium text-text-muted hover:text-danger-600 cursor-pointer"
                                                    >
                                                        Limpar busca
                                                    </button>
                                                )}
                                            </div>
                                            {searchQuery.trim() ? (
                                                <p className="text-caption text-text-primary truncate">
                                                    Termo: &ldquo;<strong>{searchQuery}</strong>&rdquo;
                                                </p>
                                            ) : (
                                                <p className="text-caption text-text-muted">
                                                    Nenhum termo de busca ativo.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* FOOTER: RESUMO DE CURSOS COMPATÍVEIS E BOTÕES DE NAVEGAÇÃO */}
                                    <div className="mt-auto p-4 rounded-panel bg-surface-soft dark:bg-surface-raised border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                                        <div>
                                            <span className="text-caption font-semibold uppercase tracking-wider text-text-muted block">
                                                Cursos compatíveis com os filtros
                                            </span>
                                            <span className="text-body font-bold text-text-primary tabular-nums">
                                                {filteredCursos.length} presenciais • {filteredEadCursos.length} EaD
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => setActiveTab('catalogo')}
                                                className="flex-1 sm:flex-initial cursor-pointer"
                                            >
                                                Ver no Catálogo ({filteredCursos.length})
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setActiveTab('ead')}
                                                className="flex-1 sm:flex-initial cursor-pointer"
                                            >
                                                Ver EaD ({filteredEadCursos.length})
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}

            </motion.div>

        </main>
    );
}