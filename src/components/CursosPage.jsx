import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import {
    GraduationCap,
    BookOpen,
    Building2,
    MapPin,
    TrendingUp,
    Sparkles,
    ExternalLink,
    Filter,
    Database,
    X,
    Wifi,
    Laptop,
    SlidersHorizontal,
    ChevronDown,
    CheckCircle2,
    MinusCircle,
    Clock,
    Info,
    Layers
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { isMunicipioSemiarido } from '../constants/semiarido';
import SideMap, { getHeatColor } from './maps/SideMap';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import { normalize, classificarInstituicao } from '../utils/normalization';
import {
    normalizeIctStatus,
    computeInstituicoesKpis,
    buildAtivosByInstituicaoMap,
    extractNaturezasInstitucionais,
    filterInstituicoes,
    enrichInstituicoesWithAtivos,
    getAtivosDaInstituicao,
    formatSafeUrl
} from '../utils/instituicoes';
import {
    Card,
    Button,
    Badge,
    Chip,
    SearchInput,
    Select,
    Drawer,
    Tabs,
    EmptyState,
    KpiSkeleton,
    ListRowSkeleton,
    AnimatedNumber,
    PillBar,
    ScrollableList,
    DetailIsland
} from './ui';
import { buildEntitySearchData } from './ui/Input';
import { useChartTheme, getSemanticColors } from './graph/chartTheme';
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
    const semantic = getSemanticColors();
    if (!hexOrRgb) return semantic.white;
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
    return luminance > 0.55 ? semantic.textPrimary : semantic.white;
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

const ICT_STATUS_META = {
    sim: { label: 'ICT — Sim', shortLabel: 'Sim', badgeVariant: 'success' },
    nao: { label: 'ICT — Não', shortLabel: 'Não', badgeVariant: 'danger' },
    pendente: { label: 'ICT — Pendente', shortLabel: 'Pendente', badgeVariant: 'warning' },
    outro: { label: 'Não definido', shortLabel: 'Outro', badgeVariant: 'neutral' },
};

export default function CursosPage() {
    const chartTheme = useChartTheme();
    const [searchParams] = useSearchParams();
    const {
        cursosData = [],
        cursosEadData = [],
        instituicoesData = [],
        ativosData = [],
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
    const [selectedCurso, setSelectedCurso] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(() => (
        searchParams.get('tab') === 'ies' ? 'ies' : 'catalogo'
    )); // 'catalogo' | 'ead' | 'areas' | 'ranking' | 'ies'
    const [instSearch, setInstSearch] = useState('');
    const [instIctStatus, setInstIctStatus] = useState('todos');
    const [instNatureza, setInstNatureza] = useState('todas');
    const [selectedInstituicao, setSelectedInstituicao] = useState(null);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef(null);

    // Fechar dropdown de filtros ao clicar fora ou pressionar Esc
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsFilterDropdownOpen(false);
            }
        };
        if (isFilterDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isFilterDropdownOpen]);

    const itemRefs = useRef({});
    const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;
    const isEadTab = activeTab === 'ead';
    const baseCursosPool = isEadTab ? cursosEadData : cursosData;

    // Indicadores e filtragem de Instituições de CT&I (Aba Instituições)
    const instKpis = useMemo(
        () => computeInstituicoesKpis(instituicoesData),
        [instituicoesData]
    );
    const instAtivosMap = useMemo(
        () => buildAtivosByInstituicaoMap(ativosData),
        [ativosData]
    );
    const instNaturezas = useMemo(
        () => extractNaturezasInstitucionais(instituicoesData),
        [instituicoesData]
    );
    const filteredInstituicoes = useMemo(() => {
        const filtered = filterInstituicoes(instituicoesData, {
            search: instSearch,
            ictStatus: instIctStatus,
            natureza: instNatureza,
        });
        return enrichInstituicoesWithAtivos(filtered, instAtivosMap);
    }, [instituicoesData, instSearch, instIctStatus, instNatureza, instAtivosMap]);
    const selectedInstAtivos = useMemo(
        () => getAtivosDaInstituicao(selectedInstituicao?.id_instituicao, instAtivosMap),
        [selectedInstituicao, instAtivosMap]
    );
    const selectedInstSafeUrl = useMemo(
        () => formatSafeUrl(selectedInstituicao?.site_oficial),
        [selectedInstituicao]
    );
    const hasInstFilters = Boolean(instSearch.trim()) || instIctStatus !== 'todos' || instNatureza !== 'todas';
    const handleClearInstFilters = () => {
        setInstSearch('');
        setInstIctStatus('todos');
        setInstNatureza('todas');
    };

    // Cursos (presenciais ou EaD na aba EaD) restritos ao território selecionado
    const territoryCursos = useMemo(() => {
        if (!baseCursosPool || baseCursosPool.length === 0) return [];
        if (!selectedTerritory) return baseCursosPool;
        return baseCursosPool.filter(c => Number(c.id_territorio) === Number(selectedTerritory.id_territorio));
    }, [baseCursosPool, selectedTerritory]);

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
        setSelectedCurso(null);
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
        const source = isEadTab ? filteredEadCursos : filteredCursos;
        if (!sidebarSearch.trim()) return source;
        const q = normalize(sidebarSearch);
        return source.filter(c =>
            normalize(c.curso || c.nome).includes(q) ||
            normalize(c.sigla).includes(q) ||
            normalize(c.entidade).includes(q) ||
            normalize(c.instituicao).includes(q) ||
            normalize(c.municipio).includes(q) ||
            normalize(c.categoria || c.tipo).includes(q)
        );
    }, [filteredCursos, filteredEadCursos, isEadTab, sidebarSearch]);

    const cursosDataForMap = useMemo(() => {
        let list = baseCursosPool;
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
    }, [baseCursosPool, selectedCategory, selectedRede, selectedIES, filtroSemiarido]);

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

        const sorted = Object.entries(counts)
            .sort((a, b) => b[1].total - a[1].total);

        const palette = filtroSemiarido
            ? chartTheme.goldenPalette
            : chartTheme.bluePalette;

        return sorted.map(([name, data], idx) => {
            const percent = total > 0 ? ((data.total / total) * 100).toFixed(1) : '0.0';
            const color = palette[idx % palette.length];
            return {
                name,
                count: data.total,
                percent,
                color,
                shortName: name
            };
        });
    }, [activeScopedCursos, filtroSemiarido, chartTheme.goldenPalette, chartTheme.bluePalette]);

    const categoryColorMap = useMemo(() => {
        const map = {};
        categoryStats.forEach((cat) => {
            map[cat.name] = cat.color;
        });
        return map;
    }, [categoryStats]);

    // 3A. Ranking de Territórios
    const territoryRanking = useMemo(() => {
        if (!baseCursosPool || baseCursosPool.length === 0) return [];
        const base = filtroSemiarido ? baseCursosPool.filter(c => isMunicipioSemiarido(c.municipio)) : baseCursosPool;
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
    }, [baseCursosPool, territoriosData, filtroSemiarido]);

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
        if (!baseCursosPool || baseCursosPool.length === 0) return 0;
        const iesSet = new Set();
        const base = filtroSemiarido ? baseCursosPool.filter(c => isMunicipioSemiarido(c.municipio)) : baseCursosPool;
        base.forEach(c => {
            const nome = c.sigla ? String(c.sigla).trim().toUpperCase() : String(c.entidade || c.instituicao || '').trim();
            if (nome) iesSet.add(nome);
        });
        return iesSet.size;
    }, [baseCursosPool, filtroSemiarido]);

    const territoriosComCursosCount = useMemo(() => {
        if (!filtroSemiarido && !isEadTab && territoriosData && territoriosData.length > 0) {
            return territoriosData.filter(t => Number(t.qtd_cursos_cti || 0) > 0).length;
        }
        return territoryRanking.length;
    }, [territoriosData, territoryRanking, filtroSemiarido, isEadTab]);

    const cursosSemiaridoCount = useMemo(() => {
        if (isEadTab) {
            return (baseCursosPool || []).filter(c => isMunicipioSemiarido(c.municipio)).length;
        }
        if (!territoriosData || territoriosData.length === 0) return 0;
        return territoriosData
            .filter(t => Number(t.qtd_mun_semiarido || 0) > 0)
            .reduce((acc, t) => acc + Number(t.qtd_cursos_cti || 0), 0);
    }, [territoriosData, isEadTab, baseCursosPool]);

    const semiaridoMetrics = useMemo(() => {
        const totalCursos = territoryCursos.length || 1;
        const semiCursos = territoryCursos.filter(c => isMunicipioSemiarido(c.municipio)).length;
        const pctCursos = ((semiCursos / totalCursos) * 100).toFixed(0);
        return { semiCursos, pctCursos };
    }, [territoryCursos]);

    const selectedCursoDetails = useMemo(() => {
        if (!selectedCurso) return null;
        const redeInfo = classificarInstituicao(selectedCurso);
        const ead = isCursoEad(selectedCurso);
        const iesFull = cleanIesName(selectedCurso.entidade || selectedCurso.instituicao || 'Instituição de Ensino', selectedCurso.municipio);
        const iesSigla = selectedCurso.sigla ? String(selectedCurso.sigla).trim().toUpperCase() : '';
        const areaNome = selectedCurso.categoria || selectedCurso.tipo || 'Geral';
        const munNome = selectedCurso.municipio || 'Bahia';
        const terrNome = cleanTerritorioName(selectedCurso.territorio_identidade || selectedCurso.territorio) || 'Bahia';
        const isSemi = isMunicipioSemiarido(munNome);

        const basePool = ead ? (cursosEadData || []) : (cursosData || []);
        const cursosMesmaIes = basePool.filter(c => {
            const s = c.sigla ? String(c.sigla).trim().toUpperCase() : '';
            const f = cleanIesName(c.entidade || c.instituicao || '', c.municipio);
            return (iesSigla && s === iesSigla) || (iesFull && f === iesFull);
        });
        const outrosCursosIesMun = cursosMesmaIes.filter(
            c => normalize(c.municipio) === normalize(munNome) && (c.curso || c.nome) !== (selectedCurso.curso || selectedCurso.nome)
        );
        const cursosMesmoMun = basePool.filter(c => normalize(c.municipio) === normalize(munNome));
        const cursosMesmaArea = basePool.filter(c => (c.categoria || c.tipo) === areaNome);

        const territorioInfo = (territoriosData || []).find(t =>
            (selectedCurso.id_territorio && Number(t.id_territorio) === Number(selectedCurso.id_territorio)) ||
            normalize(cleanTerritorioName(t.nome_territorio || t.territorio || '')) === normalize(terrNome)
        );

        const accentColor = categoryColorMap[areaNome] || (filtroSemiarido ? getSemanticColors().warningDeep : getSemanticColors().primaryBase);

        const statusPills = [
            {
                label: redeInfo.isPublica ? 'Rede Pública' : 'Rede Privada',
                variant: redeInfo.isPublica ? 'success' : 'neutral'
            },
            {
                label: ead ? 'Modalidade EaD' : 'Presencial',
                variant: 'primary',
                icon: ead ? <Wifi size={11} /> : <Building2 size={11} />
            },
            {
                label: isSemi ? 'Semiárido Baiano' : 'Fora do Semiárido',
                variant: isSemi ? 'warning' : 'neutral'
            }
        ];

        const metrics = [
            { label: 'Instituição (IES)', value: iesFull, fullWidth: true },
            { label: 'Sigla da IES', value: iesSigla || '-' },
            { label: 'Município de Oferta', value: munNome },
            { label: 'Território de Identidade', value: terrNome, fullWidth: true },
            { label: 'Oferta da IES na BA', value: `${cursosMesmaIes.length} curso(s)`, tabular: true },
            { label: 'Cursos no Município', value: `${cursosMesmoMun.length} curso(s)`, tabular: true },
            { label: 'Mesma Área na BA', value: `${cursosMesmaArea.length} curso(s)`, tabular: true },
            {
                label: 'IFDM Educação (Terr.)',
                value: territorioInfo?.ifdm_educacao != null ? Number(territorioInfo.ifdm_educacao).toFixed(3).replace('.', ',') : '-',
                tabular: true
            }
        ];

        const extraSection = outrosCursosIesMun.length > 0 ? (
            <div className="rounded-subcard bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 p-3.5 flex flex-col gap-2 shrink-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Outros cursos de {iesSigla || iesFull} em {munNome} ({outrosCursosIesMun.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {outrosCursosIesMun.slice(0, 10).map((outro, i) => (
                        <button
                            key={outro.id || `${outro.curso || outro.nome}-${i}`}
                            type="button"
                            onClick={() => {
                                setSelectedCurso(outro);
                                setSelectedCursoId(outro.id || outro.id_curso || `${outro.curso || outro.nome}`);
                            }}
                            title={outro.curso || outro.nome}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-pill bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 truncate max-w-full transition-colors cursor-pointer"
                        >
                            {outro.curso || outro.nome}
                        </button>
                    ))}
                </div>
            </div>
        ) : null;

        const targetIesFilter = iesSigla || iesFull;
        const isCurrentIesFiltered = selectedIES && (
            (iesSigla && selectedIES.toUpperCase() === iesSigla) ||
            selectedIES === iesFull
        );

        return {
            title: selectedCurso.curso || selectedCurso.nome || 'Curso de CT&I',
            subtitle: `${iesSigla ? `${iesSigla} · ` : ''}${munNome} · ${terrNome}`,
            badgeText: areaNome,
            accentColor,
            icon: ead ? Laptop : GraduationCap,
            statusPills,
            metrics,
            extraSection,
            externalUrl: selectedCurso.url_referencia || null,
            secondaryAction: targetIesFilter
                ? {
                    label: isCurrentIesFiltered ? 'Remover filtro IES' : `Filtrar ${iesSigla || 'IES'}`,
                    icon: <Building2 size={13} />,
                    onClick: () => setSelectedIES(isCurrentIesFiltered ? null : targetIesFilter)
                }
                : null
        };
    }, [selectedCurso, cursosData, cursosEadData, territoriosData, categoryColorMap, filtroSemiarido, selectedIES]);

    const cursosSearchData = useMemo(
        () => buildEntitySearchData(activeScopedCursos, {
            facets: [
                {
                    category: 'Instituição',
                    getValue: (c) => (c.sigla && String(c.sigla).trim())
                        ? String(c.sigla).trim().toUpperCase()
                        : (c.entidade || c.instituicao),
                    priority: 14,
                    recommendationLimit: 2
                },
                {
                    category: 'Área',
                    getValue: (c) => c.categoria || c.tipo,
                    priority: 12,
                    recommendationLimit: 2
                },
                {
                    category: 'Município',
                    getValue: (c) => c.municipio,
                    priority: 11,
                    recommendationLimit: 2
                }
            ],
            itemExtractor: {
                category: 'Curso',
                getLabel: (c) => c.nome || c.curso,
                getSubtitle: (c) => [c.categoria || c.tipo, c.sigla].filter(Boolean).join(' · '),
                aggregate: true,
                priority: 6,
                maxItems: 700
            }
        }),
        [activeScopedCursos]
    );

    const kpis = [
        {
            label: isEadTab
                ? (filtroSemiarido
                    ? (selectedTerritory ? `Cursos EaD no Semiárido · ${territoryName}` : 'Cursos EaD no Semiárido')
                    : (selectedTerritory ? `Cursos EaD em ${territoryName}` : 'Cursos EaD de CT&I'))
                : (filtroSemiarido
                    ? (selectedTerritory ? `Cursos no Semiárido · ${territoryName}` : 'Cursos CT&I no Semiárido')
                    : (selectedTerritory ? `Cursos em ${territoryName}` : 'Cursos Presenciais de CT&I')),
            value: loadingStats
                ? '...'
                : (filtroSemiarido
                    ? semiaridoMetrics.semiCursos
                    : (selectedTerritory || isEadTab
                        ? territoryCursos.length
                        : (kpisGlobais?.cursos != null ? kpisGlobais.cursos : cursosData.length))),
            percent: filtroSemiarido ? `${semiaridoMetrics.pctCursos}% do total` : null,
            tooltip: filtroSemiarido
                ? `No Semiárido: ${semiaridoMetrics.semiCursos} (${semiaridoMetrics.pctCursos}% do total de cursos) | Fora: ${Math.max(0, territoryCursos.length - semiaridoMetrics.semiCursos)}`
                : undefined,
            icon: isEadTab ? Laptop : GraduationCap
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
            label: filtroSemiarido ? 'Municípios com Oferta' : (isEadTab ? 'Cursos EaD no Semiárido' : 'Cursos no Semiárido'),
            value: loadingStats ? '...' : (filtroSemiarido ? `${municipalityRanking.length} munic.` : cursosSemiaridoCount),
            icon: Database
        },
        {
            label: categoryStats[0] ? (filtroSemiarido ? `Principal: ${categoryStats[0].name}` : categoryStats[0].name) : 'Principal Área',
            value: loadingStats ? '...' : (categoryStats[0] ? `${categoryStats[0].percent}%` : '-'),
            icon: Sparkles
        }
    ];

    const selectedInstDetails = useMemo(() => {
        if (!selectedInstituicao) return null;
        const ictStatus = normalizeIctStatus(selectedInstituicao.ict_status);
        const ictMeta = ICT_STATUS_META[ictStatus] || ICT_STATUS_META.outro;
        const accentColor =
            ictStatus === 'sim'
                ? '#10b981'
                : ictStatus === 'nao'
                    ? '#f43f5e'
                    : ictStatus === 'pendente'
                        ? '#f59e0b'
                        : '#6366f1';
        const hasCursosOffer = Boolean(
            selectedInstituicao.sigla &&
            iesRanking.some((item) => item.sigla === selectedInstituicao.sigla)
        );

        return {
            title: selectedInstituicao.nome_instituicao || 'Detalhes da Instituição',
            subtitle: [
                selectedInstituicao.sigla || 'Sem sigla cadastrada',
                selectedInstituicao.natureza_institucional || 'Natureza não informada',
            ].join(' · '),
            badgeText: ictMeta.label,
            accentColor,
            icon: Building2,
            statusPills: [
                { label: ictMeta.label, variant: ictMeta.badgeVariant },
                {
                    label: selectedInstituicao.ativa === false ? 'Inativa' : 'Ativa',
                    variant: selectedInstituicao.ativa === false ? 'danger' : 'primary',
                },
                {
                    label: `${selectedInstAtivos.length} ${selectedInstAtivos.length === 1 ? 'ativo vinculado' : 'ativos vinculados'}`,
                    variant: 'neutral',
                },
            ],
            metrics: [
                { label: 'SIGLA', value: selectedInstituicao.sigla || '—' },
                { label: 'NATUREZA INSTITUCIONAL', value: selectedInstituicao.natureza_institucional || 'Não informada' },
                {
                    label: 'ATIVOS VINCULADOS',
                    value: `${selectedInstAtivos.length} ${selectedInstAtivos.length === 1 ? 'ativo' : 'ativos'}`,
                    tabular: true,
                },
                ...(selectedInstituicao.observacao_ict
                    ? [{ label: 'OBSERVAÇÃO ICT', value: selectedInstituicao.observacao_ict, fullWidth: true }]
                    : []),
            ],
            extraSection: (
                <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Ativos Físicos Vinculados
                        </span>
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 tabular-nums">
                            {selectedInstAtivos.length} {selectedInstAtivos.length === 1 ? 'registro' : 'registros'}
                        </span>
                    </div>

                    {selectedInstAtivos.length === 0 ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 py-2">
                            Nenhum ativo físico vinculado a esta instituição até o momento.
                        </p>
                    ) : (
                        <ul className="divide-y divide-zinc-200/60 dark:divide-zinc-700/60">
                            {selectedInstAtivos.map((ativo) => (
                                <li key={ativo.id_ativo} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                                        {ativo.nome_ativo}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                                        {ativo.tipo && (
                                            <span className="inline-flex items-center gap-1">
                                                <Layers className="w-3.5 h-3.5 shrink-0" />
                                                <span>{ativo.tipo}</span>
                                            </span>
                                        )}
                                        {(ativo.municipio || ativo.territorio_identidade) && (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                <span>{[ativo.municipio, ativo.territorio_identidade].filter(Boolean).join(' · ')}</span>
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ),
            externalUrl: selectedInstSafeUrl,
            externalLabel: 'Fonte Oficial',
            secondaryAction: hasCursosOffer
                ? {
                    label: `Filtrar ${selectedInstituicao.sigla}`,
                    icon: <Building2 size={15} />,
                    onClick: () => {
                        setSelectedIES(selectedInstituicao.sigla);
                        setSelectedInstituicao(null);
                        setActiveTab('catalogo');
                    },
                }
                : null,
        };
    }, [selectedInstituicao, selectedInstAtivos, selectedInstSafeUrl, iesRanking]);

    const activeDetailIsland = selectedCurso && selectedCursoDetails ? (
        <DetailIsland
            compact={isMapExpanded}
            isOpen={true}
            onClose={() => {
                setSelectedCursoId(null);
                setSelectedCurso(null);
            }}
            title={selectedCursoDetails.title}
            subtitle={selectedCursoDetails.subtitle}
            badgeText={selectedCursoDetails.badgeText}
            accentColor={selectedCursoDetails.accentColor}
            icon={selectedCursoDetails.icon}
            statusPills={selectedCursoDetails.statusPills}
            metrics={selectedCursoDetails.metrics}
            extraSection={selectedCursoDetails.extraSection}
            externalUrl={selectedCursoDetails.externalUrl}
            externalLabel="Fonte Oficial"
            secondaryAction={selectedCursoDetails.secondaryAction}
            filtroSemiarido={filtroSemiarido}
            className={
                isMapExpanded
                    ? 'flex-1 h-full w-full min-h-0'
                    : 'absolute inset-x-0 top-0 bottom-0 lg:left-[calc(40%+5.6px)] lg:right-0 z-40'
            }
        />
    ) : selectedInstituicao && selectedInstDetails ? (
        <DetailIsland
            compact={isMapExpanded}
            isOpen={true}
            onClose={() => setSelectedInstituicao(null)}
            title={selectedInstDetails.title}
            subtitle={selectedInstDetails.subtitle}
            badgeText={selectedInstDetails.badgeText}
            accentColor={selectedInstDetails.accentColor}
            icon={selectedInstDetails.icon}
            statusPills={selectedInstDetails.statusPills}
            metrics={selectedInstDetails.metrics}
            extraSection={selectedInstDetails.extraSection}
            externalUrl={selectedInstDetails.externalUrl}
            externalLabel={selectedInstDetails.externalLabel}
            secondaryAction={selectedInstDetails.secondaryAction}
            filtroSemiarido={filtroSemiarido}
            className={
                isMapExpanded
                    ? 'flex-1 h-full w-full min-h-0'
                    : 'absolute inset-x-0 top-0 bottom-0 lg:left-[calc(40%+5.6px)] lg:right-0 z-40'
            }
        />
    ) : null;

    return (
        <main className="flex-1 min-w-0 h-full min-h-0 overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-5 bg-transparent font-sans w-full">

            {/* ================= ATMOSFERA: SOL DO SEMIÁRIDO ================= */}
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 overflow-hidden z-0 transition-opacity duration-500 ease-out select-none ${filtroSemiarido ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
            >
                {/* 0. AMBIENT WARM TINT ACROSS CANVAS */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.06] via-amber-400/[0.02] to-transparent pointer-events-none" />

                {/* 1. HALO RADIAL DIFUSO */}
                <div
                    className="absolute -top-[16vw] -right-[10vw] w-[64vw] h-[64vw] min-w-[580px] min-h-[580px] max-w-[1100px] max-h-[1100px] rounded-full animate-sun-breath"
                    style={{
                        background: 'radial-gradient(circle at 75% 25%, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.12) 32%, rgba(251, 191, 36, 0.05) 55%, transparent 75%)',
                        filter: 'blur(45px)',
                    }}
                />

                {/* 2. ARCO / ANEL LUMINOSO */}
                <div
                    className="absolute -top-[14vw] -right-[8vw] w-[54vw] h-[54vw] min-w-[480px] min-h-[480px] max-w-[940px] max-h-[940px] rounded-full animate-sun-arc"
                    style={{
                        border: '2px solid rgba(245, 158, 11, 0.35)',
                        boxShadow: '0 0 50px rgba(251, 191, 36, 0.18), inset 0 0 50px rgba(245, 158, 11, 0.06)',
                        maskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0) 70%)',
                        WebkitMaskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0) 70%)',
                    }}
                />

                {/* 3. SEGUNDO ARCO EXPANSIVO */}
                <div
                    className="absolute -top-[20vw] -right-[14vw] w-[70vw] h-[70vw] min-w-[620px] min-h-[620px] max-w-[1220px] max-h-[1220px] rounded-full animate-sun-breath"
                    style={{
                        border: '1.5px solid rgba(217, 119, 6, 0.22)',
                        maskImage: 'linear-gradient(to bottom left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0) 60%)',
                        WebkitMaskImage: 'linear-gradient(to bottom left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0) 60%)',
                    }}
                />

                {/* 4. GLOW DOURADO DE TOPO */}
                <div
                    className="absolute top-0 right-0 w-[520px] h-[360px] rounded-full opacity-80 animate-sun-breath"
                    style={{
                        background: 'radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 50%, transparent 80%)',
                        filter: 'blur(45px)',
                    }}
                />
            </div>

            {/* HEADER DA PÁGINA */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full shrink-0 relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="text-headline font-bold text-text-primary tracking-tight">
                            Módulo de Ensino Superior em CT&I
                        </h1>
                    </div>
                    <p className="text-body-sm text-text-secondary mt-1 font-medium">
                        {filtroSemiarido
                            ? 'Mapeamento territorial da oferta de cursos de CT&I no Semiárido Baiano'
                            : 'Mapeamento territorial da oferta presencial e EaD de ensino superior voltada exclusivamente a Ciência, Tecnologia e Inovação (CT&I)'}
                    </p>
                    <div className={`divider-territorial w-56 mt-3 transition-all duration-500 ${filtroSemiarido
                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-transparent shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                        : ''
                        }`} />
                </div>
            </div>

            {/* CONTAINER DE CONTEÚDO (KPIS + MAPA + PAINEL DIREITO + ILHA FLUTUANTE POR CIMA) */}
            <div className="flex-1 min-h-0 min-w-0 flex flex-col gap-5 relative z-10">

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
                                    <motion.div key={index} variants={fadeUp} className="h-full flex flex-col">
                                        <div
                                            title={kpi.tooltip || kpi.label}
                                            className={`p-4 sm:p-5 flex flex-col justify-between h-[108px] min-h-[108px] max-h-[108px] flex-1 rounded-card cursor-default overflow-hidden transition-all duration-200 select-none ${isHero
                                                ? (filtroSemiarido
                                                    ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white border border-amber-400/50 shadow-sm'
                                                    : 'bg-gradient-brand text-white border border-primary-500/40 shadow-xs')
                                                : (filtroSemiarido
                                                    ? 'bg-gradient-to-br from-amber-50/80 via-surface to-surface dark:from-amber-950/30 dark:via-zinc-900 dark:to-zinc-900 border border-amber-300/70 dark:border-amber-600/40 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500 text-text-primary'
                                                    : 'bg-surface-soft border border-border/70 text-text-primary hover:border-border-strong')
                                                }`}
                                        >
                                            {/* LINHA SUPERIOR: LABEL ACIMA + ÍCONE CIRCULAR À DIREITA */}
                                            <div className="flex items-start justify-between gap-2 w-full min-w-0">
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span
                                                        className={`text-[13px] font-medium leading-tight truncate ${isHero
                                                            ? (filtroSemiarido ? 'text-amber-100' : 'text-white/85')
                                                            : (filtroSemiarido ? 'text-amber-900/85 dark:text-amber-200/90' : 'text-text-secondary')
                                                            }`}
                                                        title={kpi.label}
                                                    >
                                                        {kpi.label}
                                                    </span>
                                                </div>

                                                {/* ÍCONE CIRCULAR NO CANTO SUPERIOR DIREITO */}
                                                <div
                                                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-colors duration-150 ${isHero
                                                        ? 'bg-white/15 text-white border border-white/20 shadow-2xs'
                                                        : (filtroSemiarido
                                                            ? 'bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300/70 dark:border-amber-600/50 text-amber-700 dark:text-amber-300 shadow-2xs'
                                                            : 'bg-surface border border-border/80 text-text-secondary shadow-2xs')
                                                        }`}
                                                >
                                                    <kpi.icon size={15} strokeWidth={2} />
                                                </div>
                                            </div>

                                            {/* LINHA INFERIOR: VALOR NUMÉRICO GRANDE (28px - 34px) + TEXTO PURO */}
                                            <div className="flex items-baseline w-full justify-between min-w-0 pt-0.5">
                                                <div className="flex items-baseline gap-2 min-w-0 flex-1 flex-wrap">
                                                    <span
                                                        className={`text-[30px] font-bold tracking-tight leading-none shrink-0 tnum ${isHero
                                                            ? 'text-white'
                                                            : (filtroSemiarido ? 'text-amber-950 dark:text-amber-100' : 'text-text-primary')
                                                            }`}
                                                    >
                                                        <AnimatedNumber value={kpi.value} />
                                                    </span>

                                                    {filtroSemiarido && kpi.percent && (
                                                        <span
                                                            title={`(${kpi.percent})`}
                                                            className={`text-caption font-semibold tabular-nums truncate shrink-0 ${isHero
                                                                ? 'text-white/80'
                                                                : 'text-amber-700 dark:text-amber-400'
                                                                }`}
                                                        >
                                                            ({kpi.percent})
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
                        className={`shrink-0 w-full h-full min-h-[460px] min-w-0 bg-surface rounded-card border shadow-card relative overflow-hidden flex flex-col transition-[border-color,box-shadow] duration-200 ${filtroSemiarido
                            ? 'border-amber-400/60 dark:border-amber-500/40 ring-1 ring-amber-400/20 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.12)]'
                            : 'border-border'
                            } ${isMapExpanded ? 'lg:w-[calc(100%-440px)]' : 'lg:w-[calc(40%-10px)]'
                            }`}
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
                            onAssetClick={(curso) => {
                                if (curso) {
                                    setSelectedCurso(curso);
                                    setSelectedCursoId(curso.id_curso || curso.id || `${curso.curso || curso.nome}-${curso.municipio}`);
                                } else {
                                    setSelectedCurso(null);
                                    setSelectedCursoId(null);
                                }
                            }}
                            isExpanded={isMapExpanded}
                            onToggleExpand={() => setIsMapExpanded(prev => !prev)}
                            filtroSemiarido={filtroSemiarido}
                        />
                    </motion.div>

                    {/* MODO EXPANDIDO: DUAS CAIXAS SEPARADAS OU BOX DE DETALHES DEDICADA */}
                    {isMapExpanded ? (
                        <motion.div
                            variants={fadeUp}
                            className="w-full lg:w-[420px] shrink-0 h-[480px] lg:h-full flex flex-col gap-4 min-h-0 min-w-0 animate-in fade-in slide-in-from-right-4 duration-300"
                        >
                            {activeDetailIsland ? (
                                activeDetailIsland
                            ) : (
                                <>
                                    {/* BOX 1: CABEÇALHO & BUSCA */}
                                    <div className="bg-surface rounded-card border border-border shadow-card p-3.5 flex flex-col gap-2 shrink-0 relative z-20">
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
                                                    onClick={() => {
                                                        setSelectedCursoId(null);
                                                        setSelectedCurso(null);
                                                    }}
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
                                                suggestions={cursosSearchData.suggestions}
                                                recommendations={cursosSearchData.recommendations}
                                                placeholder="Filtrar cursos..."
                                                size="sm"
                                            />
                                        </div>
                                    </div>

                                    {/* BOX 2: LISTA DE CURSOS */}
                                    <div className="flex-1 bg-surface rounded-card border border-border shadow-card p-3 flex flex-col min-h-0 min-w-0 overflow-hidden">
                                        <div className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2 min-h-0">
                                            {compactCursosList.length > 0 ? (
                                                compactCursosList.map((c, idx) => {
                                                    const catColor = categoryColorMap[c.categoria || c.tipo] || chartTheme.textMuted;
                                                    const cursoKey = c.id_curso || c.id || `${c.curso || c.nome}-${c.municipio}-${idx}`;
                                                    const isSelected = selectedCursoId === cursoKey;
                                                    const redeInfo = classificarInstituicao(c);

                                                    return (
                                                        <div
                                                            key={cursoKey}
                                                            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 56px' }}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setSelectedCursoId(null);
                                                                    setSelectedCurso(null);
                                                                } else {
                                                                    setSelectedCursoId(cursoKey);
                                                                    setSelectedCurso(c);
                                                                }
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
                                                                        <span className="truncate">
                                                                            {c.sigla || cleanIesName(c.entidade || c.instituicao, c.municipio)} • <strong className="font-semibold text-text-primary">{c.municipio}</strong>
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* STATUS REDE (Pública / Privada) */}
                                                            <span
                                                                className={`text-[10px] font-semibold tracking-wider uppercase shrink-0 ${redeInfo.isPublica
                                                                    ? 'text-emerald-700 dark:text-emerald-400'
                                                                    : 'text-text-muted dark:text-zinc-400'
                                                                    }`}
                                                            >
                                                                {redeInfo.isPublica ? 'Pública' : 'Privada'}
                                                            </span>
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
                                </>
                            )}
                        </motion.div>
                    ) : (
                        /* LADO DIREITO: CATÁLOGO COM A NOVA ABA DE CURSOS EAD */
                        <motion.div variants={fadeUp} className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">

                            {/* BARRA SUPERIOR DE ABAS E BUSCA */}
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 shrink-0 min-w-0 relative z-30 overflow-visible">
                                <div className="flex items-center gap-2 flex-wrap min-w-0 shrink-0">
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
                                            }
                                        ]}
                                        value={activeTab}
                                        onChange={(tab) => setActiveTab(tab)}
                                        variant="pill"
                                        className="shrink-0"
                                        isSemiarido={filtroSemiarido}
                                    />

                                    {(activeTab === 'catalogo' || activeTab === 'ead' || activeTab === 'ies') && (() => {
                                        const isIesTab = activeTab === 'ies';
                                        const tabFiltersCount = isIesTab
                                            ? (instIctStatus !== 'todos' ? 1 : 0) + (instNatureza !== 'todas' ? 1 : 0)
                                            : activeFiltersCount;
                                        return (
                                            <div className="relative inline-flex items-center shrink-0" ref={filterDropdownRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                                                    className={`h-9 inline-flex items-center justify-center gap-2 px-3.5 rounded-full text-caption transition-colors duration-120 whitespace-nowrap select-none cursor-pointer shadow-xs ${tabFiltersCount > 0 || isFilterDropdownOpen
                                                        ? (filtroSemiarido
                                                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white font-semibold'
                                                            : 'bg-carbon dark:bg-primary-600 text-white font-semibold')
                                                        : (filtroSemiarido
                                                            ? 'bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-700/60 text-amber-900/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 font-medium'
                                                            : 'bg-surface-soft dark:bg-surface-raised border border-border text-text-secondary hover:text-text-primary hover:bg-surface dark:hover:bg-surface-raised/70 font-medium')
                                                        }`}
                                                    title={isIesTab ? 'Filtros de Instituições' : 'Filtros por Área, Rede de Ensino, Instituição e Região'}
                                                >
                                                    {tabFiltersCount > 0 ? (
                                                        <span className={`w-4 h-4 rounded-full text-2xs font-bold inline-flex items-center justify-center shrink-0 tabular-nums ${filtroSemiarido ? 'bg-white text-amber-800' : 'bg-white text-primary-700'}`}>
                                                            {tabFiltersCount}
                                                        </span>
                                                    ) : (
                                                        <Filter
                                                            size={14}
                                                            className={
                                                                isFilterDropdownOpen
                                                                    ? 'text-white'
                                                                    : (filtroSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-text-muted')
                                                            }
                                                        />
                                                    )}
                                                    <span>Filtros</span>
                                                    <ChevronDown
                                                        size={13}
                                                        className={`transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''} ${tabFiltersCount > 0 || isFilterDropdownOpen
                                                            ? 'text-white/80'
                                                            : (filtroSemiarido ? 'text-amber-800/80 dark:text-amber-300/80' : 'text-text-muted')
                                                            }`}
                                                    />
                                                </button>

                                                {/* CAIXA COM DROPDOWN FLUTUANTE */}
                                                {isFilterDropdownOpen && isIesTab && (
                                                    <div className={`absolute right-0 top-full mt-2 w-[320px] sm:w-[360px] bg-surface dark:bg-zinc-900 border shadow-float rounded-panel p-4 z-50 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150 ${filtroSemiarido
                                                        ? 'border-amber-400/60 dark:border-amber-600/40 ring-1 ring-amber-400/20'
                                                        : 'border-border dark:border-zinc-800'
                                                        }`}>
                                                        <div className="flex items-center justify-between pb-2 border-b border-border/70 dark:border-zinc-800 min-h-[28px]">
                                                            <div className="flex items-center gap-2">
                                                                <Filter size={14} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600 dark:text-primary-400'} />
                                                                <span className="text-xs font-bold text-text-primary dark:text-zinc-100">Filtros de Instituições</span>
                                                            </div>
                                                            {hasInstFilters ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleClearInstFilters}
                                                                    className="text-caption font-medium text-danger-600 dark:text-danger-400 hover:underline cursor-pointer"
                                                                >
                                                                    Limpar todos
                                                                </button>
                                                            ) : (
                                                                <div className="h-4 w-16" aria-hidden="true" />
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col gap-1.5">
                                                            <label htmlFor="cursos-instituicoes-natureza" className="text-caption font-medium text-text-secondary dark:text-zinc-300 flex items-center gap-1.5">
                                                                <Building2 size={13} />
                                                                <span>Natureza institucional</span>
                                                            </label>
                                                            <div className="relative">
                                                                <select
                                                                    id="cursos-instituicoes-natureza"
                                                                    value={instNatureza}
                                                                    onChange={(e) => setInstNatureza(e.target.value)}
                                                                    aria-label="Filtrar por natureza institucional"
                                                                    className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-surface-soft dark:bg-zinc-800/90 border border-border dark:border-zinc-700 text-xs text-text-primary dark:text-zinc-100 font-medium focus:bg-surface focus:outline-none transition-colors cursor-pointer ${filtroSemiarido ? 'focus:border-amber-500' : 'focus:border-primary-600'}`}
                                                                >
                                                                    <option value="todas" className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">
                                                                        Todas as naturezas
                                                                    </option>
                                                                    {instNaturezas.map((nat) => (
                                                                        <option key={nat} value={nat} className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">
                                                                            {nat}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-2 border-t border-border/70 dark:border-zinc-800 text-caption font-medium">
                                                            <span className="text-text-secondary dark:text-zinc-300">
                                                                <strong className="text-text-primary dark:text-zinc-100 tnum">{filteredInstituicoes.length}</strong> de {instKpis.total} instituições
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsFilterDropdownOpen(false)}
                                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs ${filtroSemiarido ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary-600 hover:bg-primary-500'}`}
                                                            >
                                                                Fechar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {isFilterDropdownOpen && !isIesTab && (
                                                    <div className={`absolute left-0 top-full mt-2 w-[340px] sm:w-[380px] bg-surface dark:bg-zinc-900 border shadow-float rounded-panel p-4 z-50 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150 ${filtroSemiarido
                                                        ? 'border-amber-400/60 dark:border-amber-600/40 ring-1 ring-amber-400/20'
                                                        : 'border-border dark:border-zinc-800'
                                                        }`}>
                                                        {/* TOPO DA CAIXA */}
                                                        <div className="flex items-center justify-between pb-2 border-b border-border/70 dark:border-zinc-800 min-h-[28px]">
                                                            <div className="flex items-center gap-2">
                                                                <Filter size={14} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600 dark:text-primary-400'} />
                                                                <span className="text-xs font-bold text-text-primary dark:text-zinc-100">Filtros de Cursos</span>
                                                            </div>
                                                            {activeFiltersCount > 0 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleClearAllFilters}
                                                                    className="text-caption font-medium text-danger-600 dark:text-danger-400 hover:underline cursor-pointer"
                                                                >
                                                                    Limpar todos
                                                                </button>
                                                            ) : (
                                                                <div className="h-4 w-16" aria-hidden="true" />
                                                            )}
                                                        </div>

                                                        {/* FILTRO 1: REDE DE ENSINO */}
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-caption font-medium text-text-secondary dark:text-zinc-300 flex items-center gap-1.5">
                                                                <GraduationCap size={13} />
                                                                Rede de Ensino
                                                            </label>
                                                            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface-soft/60 dark:bg-zinc-950/40 border border-border dark:border-zinc-800">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedRede('todas')}
                                                                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center select-none whitespace-nowrap border ${selectedRede === 'todas'
                                                                        ? (filtroSemiarido ? 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white font-semibold shadow-xs border-amber-500' : 'bg-surface dark:bg-zinc-800 text-text-primary shadow-2xs border-border/70 dark:border-zinc-700')
                                                                        : 'border-transparent text-text-muted hover:text-text-primary'
                                                                        }`}
                                                                >
                                                                    Todas <span className="text-caption opacity-80 tnum">({redeStats.total})</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedRede(prev => prev === 'publica' ? 'todas' : 'publica')}
                                                                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center select-none whitespace-nowrap border ${selectedRede === 'publica'
                                                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 shadow-2xs border-emerald-300/50 dark:border-emerald-700/50'
                                                                        : 'border-transparent text-text-muted hover:text-emerald-700 dark:hover:text-emerald-400'
                                                                        }`}
                                                                >
                                                                    Pública <span className="text-caption opacity-80 tnum">({redeStats.publica})</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedRede(prev => prev === 'privada' ? 'todas' : 'privada')}
                                                                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center select-none whitespace-nowrap border ${selectedRede === 'privada'
                                                                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 shadow-2xs border-purple-300/50 dark:border-purple-700/50'
                                                                        : 'border-transparent text-text-muted hover:text-purple-700 dark:hover:text-purple-400'
                                                                        }`}
                                                                >
                                                                    Privada <span className="text-caption opacity-80 tnum">({redeStats.privada})</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* FILTRO 2: ÁREA TEMÁTICA DE CT&I */}
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-caption font-medium text-text-secondary dark:text-zinc-300 flex items-center gap-1.5">
                                                                <Filter size={13} />
                                                                <span>Área Temática de CT&I</span>
                                                            </label>
                                                            <div className="relative">
                                                                <select
                                                                    value={selectedCategory}
                                                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                                                    className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-surface-soft dark:bg-zinc-800/90 border border-border dark:border-zinc-700 text-xs text-text-primary dark:text-zinc-100 font-medium focus:bg-surface focus:outline-none transition-colors cursor-pointer ${filtroSemiarido ? 'focus:border-amber-500' : 'focus:border-primary-600'
                                                                        }`}
                                                                >
                                                                    <option value="todas" className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">
                                                                        Todas as Áreas ({activeScopedCursos.length})
                                                                    </option>
                                                                    {categoryStats.map((cat) => (
                                                                        <option key={cat.name} value={cat.name} className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">
                                                                            {cat.name} ({cat.count})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                                            </div>
                                                        </div>

                                                        {/* FILTRO 3: INSTITUIÇÃO DE ENSINO SUPERIOR (IES) */}
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-caption font-medium text-text-secondary dark:text-zinc-300 flex items-center gap-1.5">
                                                                <Building2 size={13} />
                                                                <span>Instituição (IES)</span>
                                                            </label>
                                                            <div className="relative">
                                                                <select
                                                                    value={selectedIES || ''}
                                                                    onChange={(e) => setSelectedIES(e.target.value ? e.target.value : null)}
                                                                    className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-surface-soft dark:bg-zinc-800/90 border border-border dark:border-zinc-700 text-xs text-text-primary dark:text-zinc-100 font-medium focus:bg-surface focus:outline-none transition-colors cursor-pointer ${filtroSemiarido ? 'focus:border-amber-500' : 'focus:border-primary-600'
                                                                        }`}
                                                                >
                                                                    <option value="" className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">
                                                                        Todas as Instituições ({totalIesUnicas})
                                                                    </option>
                                                                    {iesRanking.map((ies) => (
                                                                        <option key={ies.sigla} value={ies.sigla} className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">
                                                                            {ies.sigla} ({ies.count} curso{ies.count === 1 ? '' : 's'})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                                            </div>
                                                        </div>

                                                        {/* FILTRO 4: RECORTE SEMIÁRIDO BAIANO */}
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-caption font-medium text-text-secondary dark:text-zinc-300 flex items-center justify-between min-h-[20px]">
                                                                <span>
                                                                    Recorte Semiárido
                                                                </span>
                                                                <span className={`text-caption font-medium text-amber-600 dark:text-amber-400 transition-opacity duration-150 ${filtroSemiarido ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'}`}>
                                                                    Ativo
                                                                </span>
                                                            </label>
                                                            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-soft/60 dark:bg-zinc-950/40 border border-border dark:border-zinc-800">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFiltroSemiarido(false)}
                                                                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center select-none whitespace-nowrap ${!filtroSemiarido
                                                                        ? 'bg-surface dark:bg-zinc-800 text-text-primary shadow-2xs border-border/70 dark:border-zinc-700'
                                                                        : 'border-transparent text-text-muted hover:text-text-primary'
                                                                        }`}
                                                                >
                                                                    Todo o Estado
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFiltroSemiarido(true)}
                                                                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center select-none whitespace-nowrap ${filtroSemiarido
                                                                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 shadow-2xs border-amber-300/50 dark:border-amber-700/50'
                                                                        : 'border-transparent text-text-muted hover:text-amber-700 dark:hover:text-amber-400'
                                                                        }`}
                                                                >
                                                                    Apenas Semiárido
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* STATUS E FECHAR */}
                                                        <div className="flex items-center justify-between pt-2 border-t border-border/70 dark:border-zinc-800 text-caption font-medium">
                                                            <span className="text-text-secondary dark:text-zinc-300">
                                                                <strong className="text-text-primary dark:text-zinc-100 tnum">{filteredCursos.length}</strong> pres. • <strong className="text-text-primary dark:text-zinc-100 tnum">{filteredEadCursos.length}</strong> EaD
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsFilterDropdownOpen(false)}
                                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs ${filtroSemiarido ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary-600 hover:bg-primary-500'
                                                                    }`}
                                                            >
                                                                Fechar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* INPUT DE BUSCA */}
                                <div className="w-full lg:w-[190px] xl:w-[220px] shrink-0 min-w-0">
                                    {activeTab === 'ies' ? (
                                        <SearchInput
                                            value={instSearch}
                                            onChange={(e) => setInstSearch(e.target.value)}
                                            onClear={() => setInstSearch('')}
                                            placeholder="Buscar instituição por nome ou sigla..."
                                            aria-label="Buscar instituição por nome ou sigla"
                                            size="sm"
                                        />
                                    ) : (
                                        <SearchInput
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                if (e.target.value.trim() && activeTab !== 'catalogo' && activeTab !== 'ead') {
                                                    setActiveTab('catalogo');
                                                }
                                            }}
                                            onClear={() => setSearchQuery('')}
                                            suggestions={cursosSearchData.suggestions}
                                            recommendations={cursosSearchData.recommendations}
                                            placeholder="Buscar curso, instituição ou cidade... (/)"
                                            size="sm"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* 4 KPIs DA ABA INSTITUIÇÕES (BOTÕES DE FILTRO ENTRE AS ABAS E A LISTA) */}
                            {activeTab === 'ies' && (
                                <section aria-label="Indicadores institucionais" className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
                                    {[
                                        { label: 'Total de Instituições', value: instKpis.total, icon: Building2, tone: 'default', filterValue: 'todos' },
                                        { label: 'ICT — Sim', value: instKpis.sim, icon: CheckCircle2, tone: 'success', filterValue: 'sim' },
                                        { label: 'ICT — Não', value: instKpis.nao, icon: MinusCircle, tone: 'danger', filterValue: 'nao' },
                                        { label: 'ICT — Pendente', value: instKpis.pendente, icon: Clock, tone: 'warning', filterValue: 'pendente' },
                                    ].map((kpi) => {
                                        const IconComp = kpi.icon;
                                        const isActive = instIctStatus === kpi.filterValue;
                                        const baseSurface = filtroSemiarido
                                            ? 'bg-gradient-to-br from-amber-50/80 via-surface to-surface dark:from-amber-950/30 dark:via-zinc-900 dark:to-zinc-900'
                                            : 'bg-surface-soft text-text-primary';
                                        const toneClasses = isActive
                                            ? kpi.tone === 'success'
                                                ? `${baseSurface} border-emerald-500/70 ring-2 ring-emerald-500/20`
                                                : kpi.tone === 'danger'
                                                    ? `${baseSurface} border-rose-500/70 ring-2 ring-rose-500/20`
                                                    : kpi.tone === 'warning'
                                                        ? `${baseSurface} border-amber-500/70 ring-2 ring-amber-500/20`
                                                        : `${baseSurface} border-primary-500/70 ring-2 ring-primary-500/20`
                                            : filtroSemiarido
                                                ? `${baseSurface} border-amber-300/70 dark:border-amber-600/40 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500`
                                                : `${baseSurface} border-border/70 hover:border-border-strong`;

                                        const iconClasses = kpi.tone === 'success'
                                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                                            : kpi.tone === 'danger'
                                                ? 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
                                                : kpi.tone === 'warning'
                                                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
                                                    : isActive
                                                        ? 'bg-primary/10 border-primary/25 text-primary'
                                                        : 'bg-surface border-border/80 text-text-secondary shadow-2xs';

                                        return (
                                            <button
                                                key={kpi.label}
                                                type="button"
                                                aria-pressed={isActive}
                                                onClick={() => setInstIctStatus((prev) => (kpi.filterValue !== 'todos' && prev === kpi.filterValue ? 'todos' : kpi.filterValue))}
                                                className={`px-4 py-3.5 rounded-card border flex items-center justify-between gap-3 text-left transition-all duration-150 ease-out active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${toneClasses}`}
                                            >
                                                <div className="min-w-0">
                                                    <div className="text-xs font-medium text-text-secondary truncate" title={kpi.label}>
                                                        {kpi.label}
                                                    </div>
                                                    <div className="text-2xl font-bold text-text-primary tabular-nums leading-tight mt-1">
                                                        {kpi.value}
                                                    </div>
                                                </div>
                                                <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center border ${iconClasses}`}>
                                                    <IconComp size={17} strokeWidth={2} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </section>
                            )}

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

                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    {selectedCategory !== 'todas' && (
                                                        <Badge
                                                            variant="neutral"
                                                            icon={<Filter size={12} />}
                                                            className="h-6 inline-flex items-center cursor-pointer hover:opacity-80"
                                                            onClick={() => setSelectedCategory('todas')}
                                                            title="Clique para remover filtro de área"
                                                        >
                                                            <span className="max-w-[140px] truncate">{selectedCategory}</span>
                                                            <span className="ml-0.5 font-bold text-text-muted hover:text-text-primary text-[11px] leading-none">×</span>
                                                        </Badge>
                                                    )}
                                                    {selectedIES && (
                                                        <Badge
                                                            variant={filtroSemiarido ? 'warning' : 'primary'}
                                                            icon={<Building2 size={12} />}
                                                            className="h-6 inline-flex items-center cursor-pointer hover:opacity-80"
                                                            onClick={() => setSelectedIES(null)}
                                                            title="Clique para remover filtro de instituição"
                                                        >
                                                            <span className="max-w-[140px] truncate">{selectedIES}</span>
                                                            <span className="ml-0.5 font-bold opacity-60 hover:opacity-100 text-[11px] leading-none">×</span>
                                                        </Badge>
                                                    )}
                                                    {selectedTerritory && (
                                                        <Badge
                                                            variant={filtroSemiarido ? 'warning' : 'primary'}
                                                            icon={<MapPin size={12} />}
                                                            className="h-6 inline-flex items-center cursor-pointer hover:opacity-80"
                                                            onClick={() => setSelectedTerritory(null)}
                                                            title="Clique para remover filtro de território"
                                                        >
                                                            <span className="max-w-[140px] truncate">{territoryName}</span>
                                                            <span className="ml-0.5 font-bold opacity-60 hover:opacity-100 text-[11px] leading-none">×</span>
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <ScrollableList
                                            filtroSemiarido={filtroSemiarido}
                                            resetKey={`${selectedCategory}-${selectedIES}-${selectedRede}-${territoryName}-${searchQuery}`}
                                            className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2.5 min-h-0 w-full pb-2"
                                        >
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
                                                                if (isSelected) {
                                                                    setSelectedCursoId(null);
                                                                    setSelectedCurso(null);
                                                                } else {
                                                                    setSelectedCursoId(cursoKey);
                                                                    setSelectedCurso(c);
                                                                }
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

                                                                {/* METADADOS DO CURSO */}
                                                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-caption text-text-secondary font-medium shrink-0 self-start mt-0.5">
                                                                    {/* 1. Indicador de Rede */}
                                                                    <span className={`text-[11px] font-semibold tracking-wider uppercase shrink-0 ${redeInfo.isPublica
                                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                                        : 'text-text-muted dark:text-zinc-400'
                                                                        }`}>
                                                                        {redeInfo.isPublica ? 'Pública' : 'Privada'}
                                                                    </span>
                                                                    <span className="text-text-muted/60">•</span>

                                                                    {/* 2. Modalidade */}
                                                                    <span className="text-caption text-text-muted font-medium inline-flex items-center gap-1 shrink-0">
                                                                        <Building2 size={12} className="text-text-muted/70 shrink-0" />
                                                                        <span>Presencial</span>
                                                                    </span>
                                                                    <span className="text-text-muted/60">•</span>

                                                                    {/* 3. Área / Categoria */}
                                                                    <span
                                                                        className="text-caption font-medium text-text-secondary dark:text-zinc-300 shrink-0 whitespace-nowrap"
                                                                        title={c.categoria || c.tipo || 'Geral'}
                                                                    >
                                                                        {c.categoria || c.tipo || 'Geral'}
                                                                    </span>

                                                                    {/* Link oficial */}
                                                                    {c.url_referencia && (
                                                                        <a
                                                                            href={c.url_referencia}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="p-1 rounded-full text-text-muted hover:text-primary-600 hover:bg-surface-soft transition-colors shrink-0"
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
                                        </ScrollableList>
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

                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    {selectedCategory !== 'todas' && (
                                                        <Badge
                                                            variant="neutral"
                                                            icon={<Filter size={12} />}
                                                            className="h-6 inline-flex items-center cursor-pointer hover:opacity-80"
                                                            onClick={() => setSelectedCategory('todas')}
                                                            title="Clique para remover filtro de área"
                                                        >
                                                            <span className="max-w-[140px] truncate">{selectedCategory}</span>
                                                            <span className="ml-0.5 font-bold text-text-muted hover:text-text-primary text-[11px] leading-none">×</span>
                                                        </Badge>
                                                    )}
                                                    {selectedIES && (
                                                        <Badge
                                                            variant={filtroSemiarido ? 'warning' : 'primary'}
                                                            icon={<Building2 size={12} />}
                                                            className="h-6 inline-flex items-center cursor-pointer hover:opacity-80"
                                                            onClick={() => setSelectedIES(null)}
                                                            title="Clique para remover filtro de instituição"
                                                        >
                                                            <span className="max-w-[140px] truncate">{selectedIES}</span>
                                                            <span className="ml-0.5 font-bold opacity-60 hover:opacity-100 text-[11px] leading-none">×</span>
                                                        </Badge>
                                                    )}
                                                    {selectedTerritory && (
                                                        <Badge
                                                            variant={filtroSemiarido ? 'warning' : 'primary'}
                                                            icon={<MapPin size={12} />}
                                                            className="h-6 inline-flex items-center cursor-pointer hover:opacity-80"
                                                            onClick={() => setSelectedTerritory(null)}
                                                            title="Clique para remover filtro de território"
                                                        >
                                                            <span className="max-w-[140px] truncate">{territoryName}</span>
                                                            <span className="ml-0.5 font-bold opacity-60 hover:opacity-100 text-[11px] leading-none">×</span>
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <ScrollableList
                                            filtroSemiarido={filtroSemiarido}
                                            resetKey={`${selectedCategory}-${selectedIES}-${selectedRede}-${territoryName}-${searchQuery}`}
                                            className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2.5 min-h-0 w-full pb-2"
                                        >
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
                                                                if (isSelected) {
                                                                    setSelectedCursoId(null);
                                                                    setSelectedCurso(null);
                                                                } else {
                                                                    setSelectedCursoId(cursoKey);
                                                                    setSelectedCurso(c);
                                                                }
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

                                                                {/* METADADOS DO CURSO EAD */}
                                                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-caption text-text-secondary font-medium shrink-0 self-start mt-0.5">
                                                                    {/* 1. Indicador de Rede */}
                                                                    <span className={`text-[11px] font-semibold tracking-wider uppercase shrink-0 ${redeInfo.isPublica
                                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                                        : 'text-text-muted dark:text-zinc-400'
                                                                        }`}>
                                                                        {redeInfo.isPublica ? 'Pública' : 'Privada'}
                                                                    </span>
                                                                    <span className="text-text-muted/60">•</span>

                                                                    {/* 2. Modalidade */}
                                                                    <span className="text-caption text-primary-600 dark:text-primary-400 font-medium inline-flex items-center gap-1 shrink-0">
                                                                        <Wifi size={12} className="shrink-0" />
                                                                        <span>EaD</span>
                                                                    </span>
                                                                    <span className="text-text-muted/60">•</span>

                                                                    {/* 3. Área / Categoria */}
                                                                    <span
                                                                        className="text-caption font-medium text-text-secondary dark:text-zinc-300 shrink-0 whitespace-nowrap"
                                                                        title={c.categoria || c.tipo || 'Geral'}
                                                                    >
                                                                        {c.categoria || c.tipo || 'Geral'}
                                                                    </span>

                                                                    {/* Link oficial */}
                                                                    {c.url_referencia && (
                                                                        <a
                                                                            href={c.url_referencia}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="p-1 rounded-full text-text-muted hover:text-primary-600 hover:bg-surface-soft transition-colors shrink-0"
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
                                        </ScrollableList>
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

                                        <ScrollableList
                                            filtroSemiarido={filtroSemiarido}
                                            resetKey={territoryName}
                                            className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2 min-h-0"
                                        >
                                            {categoryStats.length > 0 ? (
                                                categoryStats.map((cat, idx) => {
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
                                                                    <span className="truncate">{cat.name}</span>
                                                                </div>
                                                                <span className="text-caption text-text-muted tabular-nums shrink-0 ml-2">
                                                                    {cat.count} {cat.count === 1 ? 'curso' : 'cursos'}
                                                                </span>
                                                            </div>

                                                            {/* BARRAS DE PÍLULAS */}
                                                            <PillBar
                                                                value={cat.count}
                                                                totalScoped={totalCourses}
                                                                remaining={remaining}
                                                                percent={cat.percent}
                                                                color={cat.color}
                                                                negPillStyle={negPillStyle}
                                                                totalPillStyle={totalPillStyle}
                                                                index={idx}
                                                                valueTitle={`${cat.name}: ${cat.count} cursos (${cat.percent}%)`}
                                                                percentTitle={`${cat.percent}% da oferta (${cat.count} cursos)`}
                                                            />
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
                                        </ScrollableList>
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
                                                    className={`text-caption font-medium px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer justify-center leading-none ${filtroSemiarido
                                                        ? 'text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 bg-amber-100/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-700/50'
                                                        : 'text-primary-700 dark:text-primary-300 hover:text-primary-900 dark:hover:text-primary-100 hover:underline bg-primary-200/50 dark:bg-primary-950/40'
                                                        }`}
                                                >
                                                    ← Ver Todos os Territórios
                                                </button>
                                            )}
                                        </div>

                                        {/* LISTA RANKING: ESTILO DE PÍLULAS PROPORCIONAIS */}
                                        <ScrollableList
                                            key={selectedTerritory ? `ranking-muni-${selectedTerritory.id_territorio || 'muni'}` : 'ranking-territorios'}
                                            filtroSemiarido={filtroSemiarido}
                                            resetKey={territoryName}
                                            className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2 min-h-0 w-full pb-2"
                                        >
                                            {selectedTerritory ? (
                                                municipalityRanking.length > 0 ? (
                                                    municipalityRanking.map((m, idx) => {
                                                        const pos = Number(m.publicaCount || 0);
                                                        const total = Number(m.count || 0);
                                                        const neg = Math.max(0, total - pos);
                                                        const totalMunCourses = municipalityRanking.reduce((acc, x) => acc + Number(x.count || 0), 0) || 1;
                                                        const remaining = Math.max(0, totalMunCourses - total);

                                                        const posPillColor = filtroSemiarido ? getSemanticColors().warningDeep : getSemanticColors().primaryBase;
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
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        <span className="w-5 text-[11px] font-bold text-text-muted dark:text-zinc-400 tabular-nums shrink-0">{idx + 1}º</span>
                                                                        <span className="truncate">{m.name}</span>
                                                                    </div>
                                                                    <span className="text-caption text-text-muted tabular-nums shrink-0 ml-2">
                                                                        {total} {total === 1 ? 'curso' : 'cursos'}
                                                                    </span>
                                                                </div>

                                                                {/* BARRAS DE PÍLULAS */}
                                                                <PillBar
                                                                    value={total}
                                                                    totalScoped={totalMunCourses}
                                                                    remaining={remaining}
                                                                    percent={m.percentTotal}
                                                                    color={posPillColor}
                                                                    negPillStyle={negPillStyle}
                                                                    totalPillStyle={totalPillStyle}
                                                                    index={idx}
                                                                    valueTitle={`${m.name}: ${total} cursos (${m.percentTotal}% do território) · Pública: ${pos} | Privada: ${neg}`}
                                                                    percentTitle={`${m.percentTotal}% do território (${total} cursos)`}
                                                                />
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
                                                    territoryRanking.map((t, idx) => {
                                                        const isSelected = selectedTerritory && (
                                                            (t.id && Number(selectedTerritory.id_territorio) === Number(t.id)) ||
                                                            normalize(selectedTerritory.nome_territorio || selectedTerritory.territorio || selectedTerritory.nome) === normalize(t.name)
                                                        );
                                                        const pos = Number(t.publicaCount || 0);
                                                        const total = Number(t.count || 0);
                                                        const neg = Math.max(0, total - pos);
                                                        const totalTerrCourses = territoryRanking.reduce((acc, x) => acc + Number(x.count || 0), 0) || 1;
                                                        const remaining = Math.max(0, totalTerrCourses - total);

                                                        const posPillColor = filtroSemiarido ? getSemanticColors().warningDeep : getSemanticColors().primaryBase;
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
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        <span className="w-5 text-[11px] font-bold text-text-muted dark:text-zinc-400 tabular-nums shrink-0">{idx + 1}º</span>
                                                                        <span className="truncate">{t.name}</span>
                                                                    </div>
                                                                    <span className="text-caption text-text-muted tabular-nums shrink-0 ml-2">
                                                                        {total} {total === 1 ? 'curso' : 'cursos'}
                                                                    </span>
                                                                </div>

                                                                {/* BARRAS DE PÍLULAS */}
                                                                <PillBar
                                                                    value={total}
                                                                    totalScoped={totalTerrCourses}
                                                                    remaining={remaining}
                                                                    percent={t.percentTotal}
                                                                    color={posPillColor}
                                                                    negPillStyle={negPillStyle}
                                                                    totalPillStyle={totalPillStyle}
                                                                    index={idx}
                                                                    valueTitle={`${t.name}: ${total} cursos (${t.percentTotal}% do estado) · Pública: ${pos} | Privada: ${neg}`}
                                                                    percentTitle={`${t.percentTotal}% do estado (${total} cursos)`}
                                                                />
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
                                        </ScrollableList>
                                    </div>
                                )}

                                {/* ABA 5: INSTITUIÇÕES DE CT&I */}
                                {activeTab === 'ies' && (
                                    <div className="flex-1 flex flex-col min-h-0">
                                        {/* LISTAGEM DE INSTITUIÇÕES */}
                                        <ScrollableList
                                            filtroSemiarido={filtroSemiarido}
                                            resetKey={`${instIctStatus}-${instNatureza}-${instSearch}`}
                                            className="flex-1 overflow-y-auto pr-2.5 flex flex-col divide-y divide-border/60 min-h-0"
                                        >
                                            {loadingStats ? (
                                                <div className="space-y-2.5 py-2">
                                                    <ListRowSkeleton />
                                                    <ListRowSkeleton />
                                                    <ListRowSkeleton />
                                                    <ListRowSkeleton />
                                                </div>
                                            ) : filteredInstituicoes.length > 0 ? (
                                                filteredInstituicoes.map((inst) => {
                                                    const ictKey = normalizeIctStatus(inst.ict_status);
                                                    const ictMeta = ICT_STATUS_META[ictKey] || ICT_STATUS_META.outro;
                                                    return (
                                                        <div
                                                            key={inst.id_instituicao}
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => setSelectedInstituicao(inst)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                    e.preventDefault();
                                                                    setSelectedInstituicao(inst);
                                                                }
                                                            }}
                                                            className="py-2.5 px-2.5 hover:bg-surface-soft/80 rounded-lg transition-colors duration-150 cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:bg-surface-soft"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <span className="text-body-sm font-medium text-text-primary truncate" title={inst.nome_instituicao}>
                                                                        {inst.nome_instituicao}
                                                                    </span>
                                                                    {inst.sigla && (
                                                                        <span className="text-caption font-semibold text-text-muted shrink-0">
                                                                            ({inst.sigla})
                                                                        </span>
                                                                    )}
                                                                    {inst.ativa === false && (
                                                                        <Badge variant="danger">Inativa</Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-caption text-text-muted truncate mt-0.5">
                                                                    {inst.natureza_institucional || 'Natureza não informada'}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2.5 shrink-0">
                                                                <Badge variant={ictMeta.badgeVariant}>{ictMeta.shortLabel}</Badge>
                                                                <span className="text-caption font-semibold text-text-primary tabular-nums min-w-[64px] text-right">
                                                                    {inst.qtdAtivos} {inst.qtdAtivos === 1 ? 'ativo' : 'ativos'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                    <EmptyState
                                                        icon={Building2}
                                                        title="Nenhuma instituição encontrada"
                                                        description="Nenhuma instituição corresponde aos critérios de busca ou filtros selecionados."
                                                        action={
                                                            hasInstFilters ? (
                                                                <Button variant="secondary" size="sm" onClick={handleClearInstFilters}>
                                                                    Limpar filtros
                                                                </Button>
                                                            ) : null
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </ScrollableList>
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    )}

                </motion.div>

                {/* ILHA FLUTUANTE DE DETALHES POR CIMA DOS COMPONENTES ATUAIS */}
                {!isMapExpanded && activeDetailIsland}

            </div>

        </main>
    );
}