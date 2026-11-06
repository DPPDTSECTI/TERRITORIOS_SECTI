import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import {
    Database,
    Layers,
    MapPin,
    TrendingUp,
    Sparkles,
    ExternalLink,
    Filter,
    GraduationCap,
    Network,
    Wifi,
    SunMedium,
    ChevronDown,
    X
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { isMunicipioSemiarido } from '../constants/semiarido';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import { municipiosDB } from '../data/municipiosDB';
import { getDynamicAssetTypeConfig } from '../constants/assetTypes';
import SideMap, { getSemiaridoPointColor } from './maps/SideMap';
import {
    Card,
    Button,
    IconButton,
    Badge,
    Chip,
    SearchInput,
    Tabs,
    EmptyState,
    KpiSkeleton,
    ListRowSkeleton,
    AnimatedNumber,
    PillBar,
    ScrollableList
} from './ui';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../lib/motion';

function cleanTerritorioName(name) {
    if (!name) return '';
    return String(name)
        .replace(/^territ[oó]rio(\s+de\s+identidade)?\s+/i, '')
        .replace(/^ti\s+/i, '')
        .trim();
}

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
    const { isDark } = useTheme();
    const {
        ativosData = [],
        territoriosData = [],
        loadingStats = false,
        filtroSemiarido = false,
        setFiltroSemiarido
    } = useContext(DataContext);

    const [selectedTerritory, setSelectedTerritory] = useState(null);
    const [focusedAsset, setFocusedAsset] = useState(null);
    const [selectedAssetId, setSelectedAssetId] = useState(null);
    const [selectedTipo, setSelectedTipo] = useState('todos');
    const [selectedTipos, setSelectedTipos] = useState([]);
    const [filterRnp, setFilterRnp] = useState('todos'); // 'todos' | 'com_rnp' | 'sem_rnp'
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterDropdownRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo' | 'categorias' | 'ranking'
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [sidebarSearch, setSidebarSearch] = useState('');

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

    const handleToggleTipo = (tipoName) => {
        let current = selectedTipos;
        if (current.length === 0 && selectedTipo !== 'todos') {
            current = [selectedTipo];
        }
        let next;
        if (current.includes(tipoName)) {
            next = current.filter(t => t !== tipoName);
        } else {
            next = [...current.filter(t => t !== 'todos'), tipoName];
        }
        setSelectedTipos(next);
        setSelectedTipo(next.length === 1 ? next[0] : 'todos');
    };

    const handleSelectOnlyTipo = (tipoName) => {
        if (tipoName === 'todos' || (selectedTipos.length === 1 && selectedTipos[0] === tipoName)) {
            setSelectedTipos([]);
            setSelectedTipo('todos');
        } else {
            setSelectedTipos([tipoName]);
            setSelectedTipo(tipoName);
        }
    };

    const handleClearAllFilters = () => {
        setSelectedTipos([]);
        setSelectedTipo('todos');
        setFilterRnp('todos');
    };

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedTipos.length > 0 && !selectedTipos.includes('todos')) {
            count += selectedTipos.length;
        } else if (selectedTipo !== 'todos') {
            count += 1;
        }
        if (filterRnp !== 'todos') {
            count += 1;
        }
        return count;
    }, [selectedTipos, selectedTipo, filterRnp]);

    const itemRefs = useRef({});
    const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

    const handleSelectFromMap = (ativo) => {
        if (!ativo || selectedAssetId === ativo.id) {
            setSelectedAssetId(null);
            setFocusedAsset(null);
            return;
        }
        setSelectedAssetId(ativo.id);
        if (ativo?.lat && ativo?.lng) {
            setFocusedAsset({
                lat: ativo.lat,
                lng: ativo.lng,
                id: ativo.id,
                tipo: ativo.tipo,
                zoom: 15,
                ts: Date.now()
            });
        }
        setActiveTab('catalogo');

        setTimeout(() => {
            if (ativo?.id && itemRefs.current[ativo.id]) {
                itemRefs.current[ativo.id].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }, 150);
    };

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
                corHexDark: configEstilo.corHexDark,
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
            if (tid && a.id_territorio) return String(a.id_territorio) === tid;
            if (tNorm && a.normTerritorio && (
                a.normTerritorio === tNorm ||
                a.normTerritorio.includes(tNorm) ||
                tNorm.includes(a.normTerritorio)
            )) {
                if (a.normTerritorio.length > 3 && tNorm.length > 3) return true;
            }
            return false;
        });
    }, [ativosProcessados, selectedTerritory]);

    // Subconjunto ativo com respeito ao Semiárido
    const activeScopedAtivos = useMemo(() => {
        if (!territoryAtivos || territoryAtivos.length === 0) return [];
        if (!filtroSemiarido) return territoryAtivos;
        return territoryAtivos.filter(a => isMunicipioSemiarido(a.municipio));
    }, [territoryAtivos, filtroSemiarido]);

    // 2. Filtragem Geral (Tipo, RNP, Busca, Território e Semiárido)
    const filteredAtivosList = useMemo(() => {
        let list = activeScopedAtivos;

        if (selectedTipos.length > 0 && !selectedTipos.includes('todos')) {
            list = list.filter(a => selectedTipos.includes(a.tipo) || selectedTipos.includes(a.shortTipo));
        } else if (selectedTipo !== 'todos') {
            list = list.filter(a => a.tipo === selectedTipo || a.shortTipo === selectedTipo);
        }

        if (filterRnp === 'com_rnp') {
            list = list.filter(a => Boolean(a.rnp));
        } else if (filterRnp === 'sem_rnp') {
            list = list.filter(a => !a.rnp);
        }

        if (searchQuery.trim()) {
            const q = normalizeName(searchQuery);
            list = list.filter(a =>
                normalizeName(a.nome).includes(q) ||
                normalizeName(a.sigla).includes(q) ||
                normalizeName(a.tipo).includes(q) ||
                normalizeName(a.shortTipo).includes(q) ||
                normalizeName(a.municipio).includes(q) ||
                normalizeName(a.territorio).includes(q)
            );
        }

        return list;
    }, [activeScopedAtivos, selectedTipos, selectedTipo, filterRnp, searchQuery]);

    const compactAtivosList = useMemo(() => {
        if (!sidebarSearch.trim()) return filteredAtivosList;
        const q = normalizeName(sidebarSearch);
        return filteredAtivosList.filter(a =>
            normalizeName(a.nome).includes(q) ||
            normalizeName(a.sigla).includes(q) ||
            normalizeName(a.tipo).includes(q) ||
            normalizeName(a.shortTipo).includes(q) ||
            normalizeName(a.municipio).includes(q)
        );
    }, [filteredAtivosList, sidebarSearch]);

    // 3. Distribuição por Tipos / Categorias de Ativos (com dados empilhados de RNP)
    const categoryStats = useMemo(() => {
        if (!activeScopedAtivos || activeScopedAtivos.length === 0) return [];
        const counts = {};
        const total = activeScopedAtivos.length;

        activeScopedAtivos.forEach(a => {
            const t = a.tipo || 'Outros';
            if (!counts[t]) {
                counts[t] = {
                    name: t,
                    shortName: a.shortTipo || t,
                    count: 0,
                    rnpCount: 0,
                    corHex: a.corHex || '#3B82F6',
                    corHexDark: a.corHexDark || '#60A5FA',
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
    }, [activeScopedAtivos]);

    // 4A. Ranking Territorial de Ativos (com dados empilhados de RNP e filtro de Semiárido)
    const territoryRanking = useMemo(() => {
        if (!ativosProcessados || ativosProcessados.length === 0) return [];
        const baseAtivos = filtroSemiarido
            ? ativosProcessados.filter(a => isMunicipioSemiarido(a.municipio))
            : ativosProcessados;
        const counts = {};
        let totalCount = 0;

        baseAtivos.forEach(a => {
            const rawName = a.territorio || '';
            const tClean = cleanTerritorioName(rawName);
            if (!tClean || tClean.toLowerCase() === 'não identificado' || tClean.toLowerCase() === 'bahia') return;

            const normKey = normalizeName(tClean);
            const foundTerr = (territoriosData || []).find(t => {
                const tName = t.nome_territorio || t.territorio || t.nome || '';
                return normalizeName(cleanTerritorioName(tName)) === normKey || (a.id_territorio && Number(t.id_territorio) === Number(a.id_territorio));
            });

            const canonId = foundTerr?.id_territorio || (a.id_territorio ? Number(a.id_territorio) : null);
            const canonName = (foundTerr ? cleanTerritorioName(foundTerr.nome_territorio || foundTerr.territorio || foundTerr.nome) : '') || tClean;
            const uniqueKey = canonId ? `id_${canonId}` : normKey;

            if (!counts[uniqueKey]) {
                counts[uniqueKey] = { id: canonId, name: canonName, count: 0, rnpCount: 0 };
            }
            counts[uniqueKey].count += 1;
            if (a.rnp) {
                counts[uniqueKey].rnpCount += 1;
            }
            totalCount += 1;
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
                    percentTotal: totalCount > 0 ? ((t.count / totalCount) * 100).toFixed(1) : '0.0',
                    percentBar: Math.min(100, (t.count / maxCount) * 100),
                    rnpPercent,
                    outrosCount,
                    outrosPercent
                };
            });
    }, [ativosProcessados, territoriosData, filtroSemiarido]);

    // 4B. Ranking de Municípios (com dados empilhados de RNP e filtro de Semiárido)
    const municipalityRanking = useMemo(() => {
        const targetList = selectedTerritory ? activeScopedAtivos : (filtroSemiarido ? activeScopedAtivos : territoryAtivos);
        if (!targetList || targetList.length === 0) return [];
        const counts = {};
        let totalCount = 0;

        targetList.forEach(a => {
            const mun = (a.municipio || '').trim();
            if (!mun || mun.toLowerCase() === 'não identificado' || mun.toLowerCase() === 'bahia') return;
            const normKey = normalizeName(mun);
            if (!counts[normKey]) {
                counts[normKey] = { name: mun, count: 0, rnpCount: 0 };
            }
            counts[normKey].count += 1;
            if (a.rnp) {
                counts[normKey].rnpCount += 1;
            }
            totalCount += 1;
        });

        const maxCount = Math.max(...Object.values(counts).map(c => c.count), 1);

        return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .map((m, idx) => {
                const outrosCount = m.count - m.rnpCount;
                const rnpPercent = m.count > 0 ? (m.rnpCount / m.count) * 100 : 0;
                const outrosPercent = m.count > 0 ? (outrosCount / m.count) * 100 : 0;
                return {
                    ...m,
                    rank: idx + 1,
                    percentTotal: totalCount > 0 ? ((m.count / totalCount) * 100).toFixed(1) : '0.0',
                    percentBar: Math.min(100, (m.count / maxCount) * 100),
                    rnpPercent,
                    outrosCount,
                    outrosPercent
                };
            });
    }, [selectedTerritory, activeScopedAtivos, territoryAtivos, filtroSemiarido]);

    // 5. Contagens Globais e por Grupo (Scoped para a região selecionada e filtro de Semiárido)
    const totalEnsinoPesquisa = useMemo(() => {
        return activeScopedAtivos.filter(a => {
            const t = (a.tipo || '').toLowerCase();
            return t.includes('universidade') || t.includes('faculdade') || t.includes('instituto federal') || t.includes('ict') || t.includes('pesquisa');
        }).length;
    }, [activeScopedAtivos]);

    const totalRnp = useMemo(() => {
        return activeScopedAtivos.filter(a => a.rnp).length;
    }, [activeScopedAtivos]);

    const territoriosComAtivosCount = useMemo(() => {
        if (!filtroSemiarido && territoriosData && territoriosData.length > 0) {
            return territoriosData.filter(t => Number(t.ativos_cti || 0) > 0).length;
        }
        return territoryRanking.length;
    }, [territoriosData, territoryRanking, filtroSemiarido]);

    const semiaridoMetrics = useMemo(() => {
        const totalAtivos = territoryAtivos.length || 1;
        const semiAtivos = territoryAtivos.filter(a => isMunicipioSemiarido(a.municipio)).length;
        const pctAtivos = ((semiAtivos / totalAtivos) * 100).toFixed(0);
        return { semiAtivos, pctAtivos };
    }, [territoryAtivos]);

    // 7. 5 Indicadores Estratégicos (KPIs com adaptação contextual à região e ao Semiárido)
    const kpis = [
        {
            label: filtroSemiarido
                ? (selectedTerritory ? `Ativos no Semiárido · ${territoryName}` : 'Ativos no Semiárido')
                : (selectedTerritory ? `Ativos em ${territoryName}` : 'Total de Ativos CT&I'),
            value: loadingStats ? '...' : (filtroSemiarido ? semiaridoMetrics.semiAtivos : (selectedTerritory ? territoryAtivos.length : (ativosData?.length || territoryAtivos.length))),
            percent: filtroSemiarido ? `${semiaridoMetrics.pctAtivos}% do total` : null,
            tooltip: filtroSemiarido
                ? `No Semiárido: ${semiaridoMetrics.semiAtivos} (${semiaridoMetrics.pctAtivos}% do total de ativos) | Fora: ${Math.max(0, territoryAtivos.length - semiaridoMetrics.semiAtivos)}`
                : undefined,
            icon: Database
        },
        {
            label: filtroSemiarido ? 'Ensino & Pesquisa (Semiárido)' : 'Ensino & Pesquisa (ICTs)',
            value: loadingStats ? '...' : totalEnsinoPesquisa,
            icon: GraduationCap
        },
        {
            label: filtroSemiarido ? 'Ativos com RNP (Semiárido)' : 'Ativos com RNP',
            value: loadingStats ? '...' : totalRnp,
            icon: Network
        },
        {
            label: filtroSemiarido ? 'Municípios com Ativos' : (selectedTerritory ? 'Municípios com Ativos' : 'Territórios Cobertos'),
            value: loadingStats ? '...' : (selectedTerritory || filtroSemiarido ? `${municipalityRanking.length} munic.` : `${territoriosComAtivosCount} / ${territoriosData.length || 27}`),
            icon: MapPin
        },
        {
            label: categoryStats[0] ? (filtroSemiarido ? `Principal: ${categoryStats[0].shortName}` : categoryStats[0].shortName) : 'Principal Tipo',
            value: loadingStats ? '...' : (categoryStats[0] ? `${categoryStats[0].percent}%` : '-'),
            icon: Sparkles
        }
    ];

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
                            Módulo de Ativos de CT&I
                        </h1>
                    </div>
                    <p className="text-body-sm text-text-secondary mt-1 font-medium">
                        {filtroSemiarido
                            ? 'Explore universidades, ICTs e centros de pesquisa mapeados no Semiárido Baiano'
                            : 'Explore universidades, ICTs, parques tecnológicos, hubs e centros de pesquisa distribuídos pelo estado'}
                    </p>
                    <div
                        className={`divider-territorial w-56 mt-3 transition-all duration-500 ${
                            filtroSemiarido
                                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-transparent shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                                : ''
                        }`}
                    />
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
                            const isRnpKpi = index === 2;
                            const isClickable = isRnpKpi;

                            return (
                                <motion.div key={index} variants={fadeUp} className="h-full flex flex-col">
                                    <div
                                        title={isRnpKpi ? (filterRnp === 'com_rnp' ? 'Clique para desativar filtro de RNP' : 'Clique para filtrar apenas ativos com RNP') : (kpi.tooltip || kpi.label)}
                                        onClick={isClickable ? () => {
                                            setFilterRnp(prev => prev === 'com_rnp' ? 'todos' : 'com_rnp');
                                            setActiveTab('catalogo');
                                        } : undefined}
                                        className={`p-4 sm:p-5 flex flex-col justify-between h-[108px] min-h-[108px] max-h-[108px] flex-1 rounded-card overflow-hidden transition-all duration-200 select-none ${isClickable ? 'cursor-pointer' : 'cursor-default'
                                            } ${isRnpKpi && filterRnp === 'com_rnp'
                                                ? (filtroSemiarido ? 'ring-2 ring-amber-500 bg-amber-500/10' : 'ring-2 ring-emerald-500 bg-emerald-500/10')
                                                : ''
                                            } ${isHero
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
                                                    : (isRnpKpi && filterRnp === 'com_rnp'
                                                        ? (filtroSemiarido ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40')
                                                        : (filtroSemiarido
                                                            ? 'bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300/70 dark:border-amber-600/50 text-amber-700 dark:text-amber-300 shadow-2xs'
                                                            : 'bg-surface border border-border/80 text-text-secondary shadow-2xs'))
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

            {/* GRID PRINCIPAL: MAPA (40% ou Expandido) + DASHBOARD / KPIS VERTICAIS */}
            <motion.div
                variants={staggerContainer(0.04)}
                initial="initial"
                animate="animate"
                className="flex-1 min-w-0 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]"
            >

                {/* LADO ESQUERDO: MAPA DE PONTOS DE ATIVOS */}
                <motion.div
                    variants={fadeUp}
                    className={`shrink-0 w-full h-full min-h-[460px] min-w-0 bg-surface rounded-card border shadow-card relative overflow-hidden flex flex-col transition-[width,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        filtroSemiarido
                            ? 'border-amber-400/60 dark:border-amber-500/40 ring-1 ring-amber-400/20 shadow-[0_4px_24px_-2px_rgba(217,119,6,0.12)]'
                            : 'border-border'
                    } ${
                        isMapExpanded ? 'lg:w-[calc(100%-440px)]' : 'lg:w-[calc(40%-10px)]'
                    }`}
                >
                    <SideMap
                        mode="ativos"
                        processedAtivos={filteredAtivosList}
                        selectedTipo={selectedTipo}
                        selectedTipos={selectedTipos}
                        onSelectTipo={setSelectedTipo}
                        onSelectTipos={setSelectedTipos}
                        focusedAsset={focusedAsset}
                        selectedTerritory={selectedTerritory}
                        onSelectTerritory={setSelectedTerritory}
                        onAssetClick={handleSelectFromMap}
                        isExpanded={isMapExpanded}
                        onToggleExpand={() => setIsMapExpanded(prev => !prev)}
                        filtroSemiarido={filtroSemiarido}
                    />
                </motion.div>

                {/* MODO EXPANDIDO: DUAS CAIXAS SEPARADAS CONFORME PROTÓTIPO */}
                {isMapExpanded ? (
                    <motion.div
                        variants={fadeUp}
                        className="w-[420px] shrink-0 h-[480px] lg:h-full flex flex-col gap-4 min-h-0 min-w-0 animate-in fade-in slide-in-from-right-4 duration-300"
                    >
                        {/* BOX 1: CABEÇALHO COMPACTO + BUSCA & FILTRO */}
                        <div className="bg-surface rounded-card border border-border shadow-card p-3.5 flex flex-col gap-2 shrink-0 relative z-20">
                            {/* CABEÇALHO */}
                            <div className="flex items-center justify-between gap-2 shrink-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-body-sm font-semibold text-text-primary truncate">
                                        Ativos de CT&I
                                    </span>
                                </div>
                                {selectedAssetId && (
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={() => {
                                            setSelectedAssetId(null);
                                            setFocusedAsset(null);
                                        }}
                                        className="text-caption text-text-secondary hover:text-danger-600"
                                    >
                                        Limpar
                                    </Button>
                                )}
                            </div>

                            {/* BUSCA COMPACTA + BOTÃO FILTRO */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <div className="flex-1 min-w-0">
                                    <SearchInput
                                        value={sidebarSearch}
                                        onChange={(e) => setSidebarSearch(e.target.value)}
                                        onClear={() => setSidebarSearch('')}
                                        placeholder="Filtrar por nome, cidade..."
                                        size="sm"
                                    />
                                </div>
                                <IconButton
                                    variant={activeFiltersCount > 0 ? (filtroSemiarido ? 'warning' : 'primary') : 'ghost'}
                                    size="sm"
                                    icon={<Filter size={14} />}
                                    onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                                    title="Abrir filtros de tipos e RNP"
                                    aria-label="Abrir filtros de tipos e RNP"
                                    className="shrink-0"
                                />
                            </div>

                            {/* PAINEL DE FILTROS EMBUTIDO NO MODO MAPA EXPANDIDO */}
                            {isFilterDropdownOpen && (
                                <div className="p-2.5 bg-surface-soft/80 dark:bg-zinc-900/90 border border-border dark:border-zinc-800 rounded-panel flex flex-col gap-2 shrink-0 animate-in fade-in duration-150">
                                    <div className="flex items-center justify-between pb-1.5 border-b border-border/70 dark:border-zinc-800">
                                        <div className="flex items-center gap-1.5">
                                            <Filter size={13} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600 dark:text-primary-400'} />
                                            <span className="text-caption font-medium text-text-primary dark:text-zinc-100">Filtros</span>
                                        </div>
                                        {activeFiltersCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleClearAllFilters}
                                                className="text-caption font-medium text-danger-600 dark:text-danger-400 hover:underline cursor-pointer"
                                            >
                                                Limpar
                                            </button>
                                        )}
                                    </div>

                                    {/* CONECTIVIDADE RNP */}
                                    <div className="flex items-center justify-between gap-1.5">
                                        <label className="text-caption font-medium text-text-secondary dark:text-zinc-300 flex items-center gap-1">
                                            <Network size={12} />
                                            <span>RNP:</span>
                                        </label>
                                        <select
                                            value={filterRnp}
                                            onChange={(e) => setFilterRnp(e.target.value)}
                                            className="text-caption rounded-control border border-border dark:border-zinc-700 bg-surface dark:bg-zinc-800 px-2 py-0.5 text-text-primary dark:text-zinc-100"
                                        >
                                            <option value="todos" className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">Todos</option>
                                            <option value="com_rnp" className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">Apenas com RNP ({totalRnp})</option>
                                            <option value="sem_rnp" className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">Sem RNP</option>
                                        </select>
                                    </div>

                                    {/* LISTA COMPACTA DE TIPOS */}
                                    <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedTipos([]);
                                                setSelectedTipo('todos');
                                            }}
                                            className={`text-caption text-left px-2 py-1 rounded-md border flex items-center justify-between transition-colors ${selectedTipos.length === 0 || selectedTipos.includes('todos')
                                                ? (filtroSemiarido ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-semibold border-amber-300/50 dark:border-amber-700/50' : 'bg-primary-50 dark:bg-primary-950/50 text-primary-900 dark:text-primary-200 font-semibold border-primary-200/50 dark:border-primary-800/50')
                                                : 'border-transparent text-text-secondary dark:text-zinc-300 hover:bg-surface dark:hover:bg-zinc-800'
                                                }`}
                                        >
                                            <span className="truncate">Todos os tipos</span>
                                            <span className={`w-8 min-w-[32px] h-5 inline-flex items-center justify-center text-center text-caption font-bold tabular-nums rounded shrink-0 ml-1.5 transition-colors ${
                                                filtroSemiarido
                                                    ? ((selectedTipos.length === 0 || selectedTipos.includes('todos'))
                                                        ? 'bg-amber-600 text-white border border-amber-600 shadow-xs'
                                                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs')
                                                    : ((selectedTipos.length === 0 || selectedTipos.includes('todos'))
                                                        ? 'bg-primary-600 text-white border border-primary-600 shadow-xs'
                                                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs')
                                            }`}>
                                                {activeScopedAtivos.length}
                                            </span>
                                        </button>
                                        {categoryStats.map((cat) => {
                                            const isChecked = selectedTipos.includes(cat.name);
                                            const dotColor = isDark ? (cat.corHexDark || cat.corHex) : cat.corHex;
                                            return (
                                                <button
                                                    key={cat.name}
                                                    type="button"
                                                    onClick={() => handleToggleTipo(cat.name)}
                                                    className={`text-caption text-left px-2 py-1 rounded-md border flex items-center justify-between transition-colors ${isChecked
                                                        ? (filtroSemiarido ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-semibold border-amber-300/50 dark:border-amber-700/50' : 'bg-primary-50 dark:bg-primary-950/50 text-primary-900 dark:text-primary-200 font-semibold border-primary-200/50 dark:border-primary-800/50')
                                                        : 'border-transparent text-text-secondary dark:text-zinc-300 hover:bg-surface dark:hover:bg-zinc-800'
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-1.5 truncate">
                                                        <span className="truncate">{cat.shortName || cat.name}</span>
                                                    </span>
                                                    <span className={`w-8 min-w-[32px] h-5 inline-flex items-center justify-center text-center text-caption font-bold tabular-nums rounded shrink-0 ml-1.5 transition-colors ${
                                                        filtroSemiarido
                                                            ? (isChecked
                                                                ? 'bg-amber-600 text-white border border-amber-600 shadow-xs'
                                                                : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs')
                                                            : (isChecked
                                                                ? 'bg-primary-600 text-white border border-primary-600 shadow-xs'
                                                                : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs')
                                                    }`}>
                                                        {cat.count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BOX 2: LISTA DE CARDS COMPACTOS */}
                        <div className="flex-1 bg-surface rounded-card border border-border shadow-card p-3 flex flex-col min-h-0 min-w-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2 min-h-0">
                                {compactAtivosList.length > 0 ? (
                                    compactAtivosList.map((ativo) => {
                                        const IconComp = ativo.icone || Database;
                                        const itemColor = filtroSemiarido
                                            ? getSemiaridoPointColor(ativo.corHex, ativo.tipo || ativo.shortTipo || ativo.nome)
                                            : (ativo.corHex || '#3B82F6');
                                        const isSelected = selectedAssetId === ativo.id;

                                        return (
                                            <div
                                                key={ativo.id}
                                                ref={(el) => { itemRefs.current[ativo.id] = el; }}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedAssetId(null);
                                                        setFocusedAsset(null);
                                                    } else {
                                                        setSelectedAssetId(ativo.id);
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
                                                    }
                                                }}
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
                                                            backgroundColor: `${itemColor}20`,
                                                            color: itemColor
                                                        }}
                                                    >
                                                        <IconComp size={14} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <h5
                                                            title={ativo.nome}
                                                            className={`text-caption font-semibold leading-tight truncate transition-colors ${isSelected
                                                                ? (filtroSemiarido ? 'text-amber-800 dark:text-amber-200' : 'text-primary-800 dark:text-primary-200')
                                                                : (filtroSemiarido ? 'text-text-primary group-hover:text-amber-600' : 'text-text-primary group-hover:text-primary-600')
                                                                }`}>
                                                            {ativo.nome}
                                                        </h5>
                                                        <span className="text-caption text-text-secondary truncate leading-tight flex items-center gap-1.5 mt-0.5">
                                                            <span className="truncate">
                                                                {ativo.shortTipo || ativo.tipo} • <strong className="font-semibold text-text-primary">{ativo.municipio}</strong>
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {ativo.sigla ? (
                                                        <span className="text-[10px] font-semibold tracking-wider uppercase text-text-muted dark:text-zinc-400 shrink-0">
                                                            {ativo.sigla}
                                                        </span>
                                                    ) : ativo.rnp ? (
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase shrink-0 ${filtroSemiarido
                                                            ? 'text-amber-700 dark:text-amber-400'
                                                            : 'text-emerald-700 dark:text-emerald-400'
                                                            }`}>
                                                            <Network size={11} className="shrink-0" />
                                                            <span>RNP</span>
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <EmptyState
                                        icon={Database}
                                        title="Nenhum ativo encontrado"
                                        description="Tente ajustar a busca."
                                        compact
                                    />
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* LADO DIREITO: DASHBOARD ANALÍTICO & CATÁLOGO DE ATIVOS */
                    <motion.div variants={fadeUp} className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">

                        {/* BARRA SUPERIOR DE NAVEGAÇÃO / ABAS E BUSCA */}
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0 min-w-0 relative z-30 overflow-visible">

                            {/* ABAS + BOTÃO DE FILTROS */}
                            <div className="flex items-center gap-2.5 flex-wrap min-w-0 shrink-0">
                                <Tabs
                                    items={[
                                        {
                                            id: 'catalogo',
                                            label: 'Catálogo',
                                            icon: <Database size={15} />
                                        },
                                        {
                                            id: 'categorias',
                                            label: 'Categorias',
                                            icon: <Filter size={15} />
                                        },
                                        {
                                            id: 'ranking',
                                            label: selectedTerritory ? 'Municípios' : 'Territórios',
                                            icon: <TrendingUp size={15} />
                                        }
                                    ]}
                                    value={activeTab}
                                    onChange={(tab) => setActiveTab(tab)}
                                    variant="pill"
                                    className="shrink-0"
                                    isSemiarido={filtroSemiarido}
                                    trailing={activeTab === 'catalogo' ? (
                                        <div className="relative h-full inline-flex items-center" ref={filterDropdownRef}>
                                            <button
                                                type="button"
                                                onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                                                className={`h-full inline-flex items-center justify-center gap-1.5 px-3 rounded-full text-caption font-medium transition-colors duration-120 whitespace-nowrap select-none cursor-pointer ${activeFiltersCount > 0 || isFilterDropdownOpen
                                                    ? (filtroSemiarido
                                                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white font-semibold shadow-xs'
                                                        : 'bg-carbon dark:bg-primary-600 text-white font-semibold shadow-xs')
                                                    : (filtroSemiarido
                                                        ? 'text-amber-900/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
                                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft dark:hover:bg-surface-raised/70')
                                                    }`}
                                                title="Filtros por Tipo de Ativo e Conectividade RNP"
                                            >
                                                <Filter
                                                    size={14}
                                                    className={
                                                        activeFiltersCount > 0 || isFilterDropdownOpen
                                                            ? 'text-white'
                                                            : (filtroSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-text-muted')
                                                    }
                                                />
                                                <span>Filtros</span>
                                                {activeFiltersCount > 0 && (
                                                    <span className={`w-4 h-4 rounded-full text-2xs font-bold inline-flex items-center justify-center shrink-0 ${
                                                        filtroSemiarido ? 'bg-white text-amber-800' : 'bg-white text-primary-700'
                                                    }`}>
                                                        {activeFiltersCount}
                                                    </span>
                                                )}
                                                <ChevronDown
                                                    size={13}
                                                    className={`transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''} ${
                                                        activeFiltersCount > 0 || isFilterDropdownOpen
                                                            ? 'text-white/80'
                                                            : (filtroSemiarido ? 'text-amber-800/80 dark:text-amber-300/80' : 'text-text-muted')
                                                    }`}
                                                />
                                            </button>

                                            {/* CAIXA COM DROPDOWN FLUTUANTE */}
                                            {isFilterDropdownOpen && (
                                                <div className={`absolute left-0 top-full mt-2 w-[340px] sm:w-[380px] bg-surface dark:bg-zinc-900 border shadow-float rounded-panel p-4 z-50 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150 ${
                                                    filtroSemiarido
                                                        ? 'border-amber-400/60 dark:border-amber-600/40 ring-1 ring-amber-400/20'
                                                        : 'border-border dark:border-zinc-800'
                                                }`}>
                                                    {/* TOPO DA CAIXA */}
                                                    <div className="flex items-center justify-between pb-2 border-b border-border/70 dark:border-zinc-800 min-h-[28px]">
                                                        <div className="flex items-center gap-2">
                                                            <Filter size={14} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600 dark:text-primary-400'} />
                                                            <span className="text-xs font-bold text-text-primary dark:text-zinc-100">Filtros</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {activeFiltersCount > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleClearAllFilters}
                                                                    className="text-caption text-text-muted hover:text-danger-600 cursor-pointer"
                                                                >
                                                                    Limpar ({activeFiltersCount})
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsFilterDropdownOpen(false)}
                                                                className="text-text-muted hover:text-text-primary p-0.5 rounded cursor-pointer"
                                                            >
                                                                <X size={15} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* DROPDOWN 1: TIPOS DE ATIVOS */}
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-caption font-medium text-text-secondary dark:text-zinc-300 flex items-center justify-between min-h-[20px]">
                                                            <span className="flex items-center gap-1.5">
                                                                <Layers size={13} />
                                                                Tipo de Ativo
                                                            </span>
                                                            <span className={`text-caption font-semibold transition-opacity duration-150 ${
                                                                filtroSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-primary-700 dark:text-primary-300'
                                                            } ${selectedTipos.length > 0 ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'}`}>
                                                                {selectedTipos.length} selecionado(s)
                                                            </span>
                                                        </label>

                                                        {/* LISTA COM SCROLL DE TIPOS */}
                                                        <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1">
                                                            <div
                                                                onClick={() => handleToggleTipo('todos')}
                                                                className={`text-caption px-2 py-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${selectedTipos.length === 0 || selectedTipos.includes('todos')
                                                                    ? (filtroSemiarido ? 'bg-amber-500/20 text-amber-900 dark:text-amber-100 font-semibold border-amber-500/40' : 'bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-100 font-semibold border-primary-200 dark:border-primary-800')
                                                                    : 'border-transparent text-text-secondary dark:text-zinc-300 hover:bg-surface-soft dark:hover:bg-zinc-800'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedTipos.length === 0 || selectedTipos.includes('todos')}
                                                                        onChange={() => { }}
                                                                        className={`rounded cursor-pointer w-3.5 h-3.5 shrink-0 ${
                                                                            filtroSemiarido ? 'accent-amber-600' : 'accent-primary-600 dark:accent-primary-500'
                                                                        }`}
                                                                    />
                                                                    <span>Todos os tipos</span>
                                                                </div>
                                                                <span className={`w-9 min-w-[36px] h-5.5 inline-flex items-center justify-center text-center text-caption font-bold tabular-nums rounded-md shrink-0 ml-1.5 transition-colors ${
                                                                    filtroSemiarido && (selectedTipos.length === 0 || selectedTipos.includes('todos'))
                                                                        ? 'bg-amber-600 text-white border border-amber-600 shadow-xs'
                                                                        : (filtroSemiarido
                                                                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs'
                                                                            : ((selectedTipos.length === 0 || selectedTipos.includes('todos'))
                                                                                ? 'bg-primary-600 text-white border border-primary-600 shadow-xs'
                                                                                : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs'))
                                                                }`}>
                                                                    {activeScopedAtivos.length}
                                                                </span>
                                                            </div>
                                                            {categoryStats.map((cat) => {
                                                                const isChecked = selectedTipos.includes(cat.name);
                                                                return (
                                                                    <div
                                                                        key={cat.name}
                                                                        onClick={() => handleToggleTipo(cat.name)}
                                                                        className={`text-caption px-2 py-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${isChecked
                                                                            ? (filtroSemiarido ? 'bg-amber-500/20 text-amber-900 dark:text-amber-100 font-semibold border-amber-500/40' : 'bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-100 font-semibold border-primary-200 dark:border-primary-800')
                                                                            : 'border-transparent text-text-secondary dark:text-zinc-300 hover:bg-surface-soft dark:hover:bg-zinc-800'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isChecked}
                                                                                onChange={() => { }}
                                                                                className={`rounded cursor-pointer w-3.5 h-3.5 shrink-0 ${
                                                                                    filtroSemiarido ? 'accent-amber-600' : 'accent-primary-600 dark:accent-primary-500'
                                                                                }`}
                                                                            />
                                                                            <span className="truncate">{cat.shortName || cat.name}</span>
                                                                        </div>
                                                                        <span className={`w-9 min-w-[36px] h-5.5 inline-flex items-center justify-center text-center text-caption font-bold tabular-nums rounded-md shrink-0 ml-1.5 transition-colors ${
                                                                            filtroSemiarido && isChecked
                                                                                ? 'bg-amber-600 text-white border border-amber-600 shadow-xs'
                                                                                : (filtroSemiarido
                                                                                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs'
                                                                                    : (isChecked
                                                                                        ? 'bg-primary-600 text-white border border-primary-600 shadow-xs'
                                                                                        : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700 shadow-2xs'))
                                                                        }`}>
                                                                            {cat.count}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* DROPDOWN 2: CONECTIVIDADE RNP */}
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-caption font-medium text-text-secondary dark:text-zinc-300 flex items-center justify-between min-h-[20px]">
                                                            <span className="flex items-center gap-1.5">
                                                                <Network size={13} />
                                                                Conectividade RNP
                                                            </span>
                                                            <span className={`text-caption font-medium text-emerald-600 dark:text-emerald-400 transition-opacity duration-150 ${filterRnp !== 'todos' ? 'opacity-100' : 'opacity-0 select-none pointer-events-none'}`}>
                                                                Ativo
                                                            </span>
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                value={filterRnp}
                                                                onChange={(e) => setFilterRnp(e.target.value)}
                                                                className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-surface-soft dark:bg-zinc-800/90 border border-border dark:border-zinc-700 text-xs text-text-primary dark:text-zinc-100 font-medium focus:bg-surface focus:outline-none transition-colors cursor-pointer ${filtroSemiarido ? 'focus:border-amber-500' : 'focus:border-primary-600'
                                                                    }`}
                                                            >
                                                                <option value="todos" className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">Todos (com ou sem RNP)</option>
                                                                <option value="com_rnp" className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">Apenas com RNP ({totalRnp})</option>
                                                                <option value="sem_rnp" className="bg-surface dark:bg-zinc-900 text-text-primary dark:text-zinc-100">Apenas sem RNP ({Math.max(0, activeScopedAtivos.length - totalRnp)})</option>
                                                            </select>
                                                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                                        </div>
                                                    </div>

                                                    {/* STATUS E FECHAR */}
                                                    <div className="flex items-center justify-between pt-2 border-t border-border/70 dark:border-zinc-800 text-caption font-medium">
                                                        <span className="text-text-secondary dark:text-zinc-300">
                                                            <strong className="text-text-primary dark:text-zinc-100">{filteredAtivosList.length}</strong> de {activeScopedAtivos.length} ativos
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
                                    ) : null}
                                />
                            </div>

                            {/* INPUT DE BUSCA (DO TAMANHO DA KPI ACIMA) */}
                            <div className="w-full lg:w-[calc((100%-26px)/3)] min-w-0 shrink-0">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (e.target.value.trim() && activeTab !== 'catalogo') {
                                            setActiveTab('catalogo');
                                        }
                                    }}
                                    onClear={() => setSearchQuery('')}
                                    placeholder="Buscar ativo, tipo, cidade... (/)"
                                    size="sm"
                                />
                            </div>

                        </div>

                        {/* CONTEÚDO DA ABA SELECIONADA */}
                        <div className="flex-1 min-w-0 bg-surface rounded-card border border-border shadow-card p-5 flex flex-col min-h-0 overflow-hidden">

                            {/* ABA 1: CATÁLOGO DE ATIVOS */}
                            {activeTab === 'catalogo' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory ? `Ativos de CT&I em ${territoryName}` : 'Catálogo de Ativos do Estado'}
                                            </h3>
                                        </div>

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



                                    {/* LISTAGEM SCROLLÁVEL */}
                                    <ScrollableList
                                        filtroSemiarido={filtroSemiarido}
                                        resetKey={`${selectedTipo}-${selectedTipos.join(',')}-${filterRnp}-${territoryName}-${searchQuery}`}
                                        className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2.5 min-h-0 w-full pb-2"
                                    >
                                        {loadingStats ? (
                                            <div className="p-3">
                                                <ListRowSkeleton count={6} />
                                            </div>
                                        ) : filteredAtivosList.length > 0 ? (
                                            filteredAtivosList.map((ativo, idx) => {
                                                const IconComponent = ativo.icone || Database;
                                                const isSelected = selectedAssetId === ativo.id;
                                                const itemColor = filtroSemiarido
                                                    ? getSemiaridoPointColor(isDark ? (ativo.corHexDark || ativo.corHex) : ativo.corHex, ativo.tipo || ativo.shortTipo || ativo.nome, isDark)
                                                    : (isDark ? (ativo.corHexDark || ativo.corHex || '#60A5FA') : (ativo.corHex || '#2563EB'));
                                                const assetUrl = ativo.urlReferencia || ativo.url || ativo.link || ativo.site;

                                                return (
                                                    <div
                                                        key={ativo.id || idx}
                                                        ref={(el) => {
                                                            if (el && ativo.id) itemRefs.current[ativo.id] = el;
                                                        }}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 88px' }}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedAssetId(null);
                                                                setFocusedAsset(null);
                                                            } else {
                                                                setSelectedAssetId(ativo.id);
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
                                                                    style={{
                                                                        backgroundColor: `${itemColor}20`,
                                                                        color: itemColor
                                                                    }}
                                                                >
                                                                    <IconComponent size={16} />
                                                                </div>
                                                                <div className="flex flex-col min-w-0 flex-1">
                                                                    <h4 className={`text-body-sm font-semibold leading-tight break-words transition-colors ${isSelected
                                                                        ? (filtroSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-primary-600 dark:text-primary-400')
                                                                        : (filtroSemiarido ? 'text-text-primary group-hover:text-amber-700 dark:group-hover:text-amber-400' : 'text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400')
                                                                        }`}>
                                                                        {ativo.nome}
                                                                    </h4>

                                                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-caption text-text-secondary mt-1 font-medium">
                                                                        <span className="font-medium text-text-secondary dark:text-zinc-300 shrink-0" title={ativo.tipo}>
                                                                            {ativo.shortTipo || ativo.tipo}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span className="font-semibold text-text-primary">{ativo.municipio}</span>
                                                                        <span>•</span>
                                                                        <span className="text-text-muted">{ativo.territorio}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 shrink-0 self-start mt-0.5">
                                                                {ativo.sigla && (
                                                                    <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted dark:text-zinc-400 shrink-0">
                                                                        {ativo.sigla}
                                                                    </span>
                                                                )}
                                                                {ativo.rnp && (
                                                                    <span
                                                                        className={`inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase shrink-0 ${filtroSemiarido
                                                                            ? 'text-amber-700 dark:text-amber-400'
                                                                            : 'text-emerald-700 dark:text-emerald-400'
                                                                            }`}
                                                                        title="Ponto de Presença / Conexão RNP"
                                                                    >
                                                                        <Network size={12} className="shrink-0" />
                                                                        <span>RNP</span>
                                                                    </span>
                                                                )}
                                                                {assetUrl && (
                                                                    <a
                                                                        href={assetUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="p-1 rounded-full text-text-muted hover:text-primary-600 hover:bg-surface-soft transition-colors shrink-0"
                                                                        title="Acessar Fonte / Site Oficial"
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
                                            <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                <EmptyState
                                                    icon={<Database size={32} />}
                                                    title="Nenhum ativo encontrado"
                                                    description="Tente ajustar os termos de busca ou remover os filtros aplicados."
                                                    action={
                                                        (activeFiltersCount > 0 || searchQuery) ? (
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => {
                                                                    handleClearAllFilters();
                                                                    setSearchQuery('');
                                                                }}
                                                            >
                                                                Limpar filtros e busca
                                                            </Button>
                                                        ) : null
                                                    }
                                                />
                                            </div>
                                        )}
                                    </ScrollableList>
                                </div>
                            )}

                            {/* ABA 2: CLASSIFICAÇÃO DOS ATIVOS (ESTILO DE PÍLULAS PROPORCIONAIS RNP) */}
                            {activeTab === 'categorias' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="mb-3 shrink-0 flex items-center justify-between flex-wrap gap-2">
                                        <div>
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory
                                                    ? `Categorias de Ativos em ${territoryName}`
                                                    : 'Classificação dos Ativos de CT&I do Estado'
                                                }
                                            </h3>
                                            <p className="text-caption text-text-secondary font-medium">
                                                Proporção de ativos conectados à Rede Nacional de Pesquisa
                                            </p>
                                        </div>

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

                                    <ScrollableList
                                        filtroSemiarido={filtroSemiarido}
                                        resetKey={territoryName}
                                        className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2 min-h-0"
                                    >
                                        {categoryStats.length > 0 ? (
                                            categoryStats.map((cat, idx) => {
                                                const isSelected = selectedTipos.includes(cat.name) || selectedTipo === cat.name;
                                                const catColor = filtroSemiarido
                                                    ? getSemiaridoPointColor(isDark ? (cat.corHexDark || cat.corHex) : cat.corHex, cat.name || cat.key, isDark)
                                                    : (isDark ? (cat.corHexDark || cat.corHex || '#60A5FA') : (cat.corHex || '#2563EB'));

                                                const pos = Number(cat.rnpCount || 0);
                                                const total = Number(cat.count || 0);
                                                const neg = Math.max(0, total - pos);
                                                const totalScopedAtivos = activeScopedAtivos.length || categoryStats.reduce((acc, c) => acc + Number(c.count || 0), 0) || 1;
                                                const remaining = Math.max(0, totalScopedAtivos - total);

                                                const negPillStyle = filtroSemiarido
                                                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25'
                                                    : 'bg-surface-soft text-text-secondary border border-border';
                                                const totalPillStyle = filtroSemiarido
                                                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/40'
                                                    : 'bg-surface-soft text-text-primary border border-border';

                                                return (
                                                    <div
                                                        key={cat.name}
                                                        onClick={() => handleToggleTipo(cat.name)}
                                                        className={`p-2 rounded-xl transition-all cursor-pointer border ${isSelected
                                                            ? (filtroSemiarido ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/20 shadow-xs' : 'bg-primary-50/60 dark:bg-primary-950/40 border-primary-400 ring-2 ring-primary-500/20 shadow-xs')
                                                            : (filtroSemiarido ? 'bg-surface border-transparent hover:bg-amber-50/30 dark:hover:bg-amber-950/20 hover:border-amber-200' : 'bg-surface border-transparent hover:bg-surface-soft hover:border-border')
                                                            }`}
                                                    >
                                                        {/* RÓTULO COM NOME DA CATEGORIA */}
                                                        <div className="text-caption font-semibold text-text-primary leading-tight flex items-center justify-between mb-1 px-0.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="truncate">{cat.shortName || cat.name}</span>
                                                            </div>
                                                            <span className="text-caption text-text-muted tabular-nums shrink-0 ml-2">
                                                                {total} {total === 1 ? 'ativo' : 'ativos'}
                                                            </span>
                                                        </div>

                                                        {/* BARRAS DE PÍLULAS */}
                                                        <PillBar
                                                            value={total}
                                                            totalScoped={totalScopedAtivos}
                                                            remaining={remaining}
                                                            percent={cat.percent}
                                                            color={catColor}
                                                            negPillStyle={negPillStyle}
                                                            totalPillStyle={totalPillStyle}
                                                            index={idx}
                                                            valueTitle={`${cat.shortName || cat.name}: ${total} ativos (${cat.percent}%) · Com RNP: ${pos} | Sem RNP: ${neg}`}
                                                            percentTitle={`${cat.percent}% dos ativos (${total} ativos)`}
                                                        />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                <EmptyState
                                                    icon={<Filter size={32} />}
                                                    title="Nenhum ativo registrado"
                                                    description={selectedTerritory ? `Não há registros de ativos para o território ${territoryName}.` : 'Nenhum ativo encontrado para esta classificação.'}
                                                />
                                            </div>
                                        )}
                                    </ScrollableList>
                                </div>
                            )}

                            {/* ABA 3: RANKING TERRITORIAL OU MUNICIPAL */}
                            {activeTab === 'ranking' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="mb-3 shrink-0 flex items-center justify-between flex-wrap gap-2">
                                        <div>
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory
                                                    ? `Ranking de Municípios · ${territoryName}`
                                                    : 'Ranking Territorial de Ativos de CT&I'
                                                }
                                            </h3>
                                            <p className="text-caption text-text-secondary font-medium">
                                                {selectedTerritory
                                                    ? 'Distribuição de ativos nos municípios do território'
                                                    : 'Densidade de infraestrutura nos 27 Territórios de Identidade'
                                                }
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2.5">
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
                                    </div>

                                    {/* LISTA RANKING: ESTILO DE PÍLULAS PROPORCIONAIS */}
                                    <ScrollableList
                                        key={selectedTerritory ? `ranking-muni-${selectedTerritory.id_territorio || selectedTerritory.nome_territorio || 'muni'}` : 'ranking-territorios'}
                                        filtroSemiarido={filtroSemiarido}
                                        resetKey={territoryName}
                                        className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2 min-h-0 w-full pb-2"
                                    >
                                        {selectedTerritory ? (
                                            municipalityRanking.length > 0 ? (
                                                municipalityRanking.map((m, idx) => {
                                                    const pos = Number(m.rnpCount || 0);
                                                    const total = Number(m.count || 0);
                                                    const neg = Math.max(0, total - pos);
                                                    const totalMunAtivos = municipalityRanking.reduce((acc, x) => acc + Number(x.count || 0), 0) || 1;
                                                    const remaining = Math.max(0, totalMunAtivos - total);

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
                                                                    {total} {total === 1 ? 'ativo' : 'ativos'}
                                                                </span>
                                                            </div>

                                                            {/* BARRAS DE PÍLULAS */}
                                                            <PillBar
                                                                value={total}
                                                                totalScoped={municipalityRanking.reduce((acc, x) => acc + Number(x.count || 0), 0) || 1}
                                                                remaining={remaining}
                                                                percent={m.percentTotal}
                                                                color={posPillColor}
                                                                negPillStyle={negPillStyle}
                                                                totalPillStyle={totalPillStyle}
                                                                index={idx}
                                                                valueTitle={`${m.name}: ${total} ativos (${m.percentTotal}% do território) · Com RNP: ${pos} | Sem RNP: ${neg}`}
                                                                percentTitle={`${m.percentTotal}% do território (${total} ativos)`}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                    <EmptyState
                                                        icon={<MapPin size={32} />}
                                                        title="Nenhum ativo registrado"
                                                        description={`Não há registros de ativos para o território ${territoryName}.`}
                                                    />
                                                </div>
                                            )
                                        ) : (
                                            territoryRanking.length > 0 ? (
                                                territoryRanking.map((t, idx) => {
                                                    const isSelected = selectedTerritory && (
                                                        (t.id && Number(selectedTerritory.id_territorio) === Number(t.id)) ||
                                                        normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || selectedTerritory.nome) === normalizeName(t.name)
                                                    );
                                                    const pos = Number(t.rnpCount || 0);
                                                    const total = Number(t.count || 0);
                                                    const neg = Math.max(0, total - pos);
                                                    const totalTerrAtivos = territoryRanking.reduce((acc, x) => acc + Number(x.count || 0), 0) || 1;
                                                    const remaining = Math.max(0, totalTerrAtivos - total);

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
                                                                    normalizeName(x.nome_territorio || x.territorio || x.nome) === normalizeName(t.name)
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
                                                                    {total} {total === 1 ? 'ativo' : 'ativos'}
                                                                </span>
                                                            </div>

                                                            {/* BARRAS DE PÍLULAS */}
                                                            <PillBar
                                                                value={total}
                                                                totalScoped={totalTerrAtivos}
                                                                remaining={remaining}
                                                                percent={t.percentTotal}
                                                                color={posPillColor}
                                                                negPillStyle={negPillStyle}
                                                                totalPillStyle={totalPillStyle}
                                                                index={idx}
                                                                valueTitle={`${t.name}: ${total} ativos (${t.percentTotal}% do estado) · Com RNP: ${pos} | Sem RNP: ${neg}`}
                                                                percentTitle={`${t.percentTotal}% do estado (${total} ativos)`}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                    <EmptyState
                                                        icon={<MapPin size={32} />}
                                                        title="Nenhum território com ativos"
                                                        description="Não foram encontrados ativos de CT&I para os filtros aplicados."
                                                    />
                                                </div>
                                            )
                                        )}
                                    </ScrollableList>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}

            </motion.div>

        </main>
    );
}
