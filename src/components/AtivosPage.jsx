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
    ChevronDown
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
    Drawer,
    EmptyState,
    KpiSkeleton,
    ListRowSkeleton
} from './ui';
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
    const [selectedAtivoDrawer, setSelectedAtivoDrawer] = useState(null);
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
                            Módulo de Ativos de CT&I
                        </h1>
                    </div>
                    <p className="text-body-sm text-text-secondary mt-0.5 font-medium">
                        Explore universidades, ICTs, parques tecnológicos, hubs e centros de pesquisa distribuídos pelo estado
                    </p>
                    <div
                        className="divider-territorial w-48 mt-3"
                        style={filtroSemiarido ? { background: 'linear-gradient(90deg, rgb(var(--color-warning-500)) 0%, rgb(var(--color-warning-600)) 50%, transparent 100%)' } : undefined}
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
                                <motion.div key={index} variants={fadeUp} className="h-full">
                                    <div
                                        title={isRnpKpi ? (filterRnp === 'com_rnp' ? 'Clique para desativar filtro de RNP' : 'Clique para filtrar apenas ativos com RNP') : (kpi.tooltip || kpi.label)}
                                        onClick={isClickable ? () => {
                                            setFilterRnp(prev => prev === 'com_rnp' ? 'todos' : 'com_rnp');
                                            setActiveTab('catalogo');
                                        } : undefined}
                                        className={`p-4 sm:p-5 flex flex-col justify-between h-[104px] rounded-card overflow-hidden transition-colors duration-200 select-none ${isClickable ? 'cursor-pointer hover:border-border-strong' : 'cursor-default'
                                            } ${isRnpKpi && filterRnp === 'com_rnp'
                                                ? (filtroSemiarido ? 'ring-2 ring-amber-500 bg-amber-500/10' : 'ring-2 ring-emerald-500 bg-emerald-500/10')
                                                : ''
                                            } ${isHero
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
                                                    : (isRnpKpi && filterRnp === 'com_rnp'
                                                        ? (filtroSemiarido ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40')
                                                        : 'bg-surface border border-border/80 text-text-secondary')
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

            {/* GRID PRINCIPAL: MAPA (calc(40% - 12px) ou Expandido) + DASHBOARD / KPIS VERTICAIS */}
            <motion.div
                variants={staggerContainer(0.04)}
                initial="initial"
                animate="animate"
                className="flex-1 min-w-0 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]"
            >

                {/* LADO ESQUERDO: MAPA DE PONTOS DE ATIVOS */}
                <motion.div
                    variants={fadeUp}
                    style={{ width: isMapExpanded ? 'calc(100% - 440px)' : 'calc(40% - 12px)' }}
                    className="shrink-0 bg-surface rounded-card border border-border shadow-card relative overflow-hidden flex flex-col min-h-[460px] min-w-0 transition-[width] duration-300"
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
                                <div className="p-2.5 bg-surface-soft/80 border border-border rounded-panel flex flex-col gap-2 shrink-0 animate-in fade-in duration-150">
                                    <div className="flex items-center justify-between pb-1.5 border-b border-border/70">
                                        <div className="flex items-center gap-1.5">
                                            <Filter size={13} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />
                                            <span className="text-caption font-medium text-text-primary">Filtros</span>
                                        </div>
                                        {activeFiltersCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleClearAllFilters}
                                                className="text-caption font-medium text-danger-600 hover:underline cursor-pointer"
                                            >
                                                Limpar
                                            </button>
                                        )}
                                    </div>

                                    {/* CONECTIVIDADE RNP */}
                                    <div className="flex items-center justify-between gap-1.5">
                                        <label className="text-caption font-medium text-text-secondary flex items-center gap-1">
                                            <Network size={12} />
                                            <span>RNP:</span>
                                        </label>
                                        <select
                                            value={filterRnp}
                                            onChange={(e) => setFilterRnp(e.target.value)}
                                            className="text-caption rounded-control border border-border bg-surface px-2 py-0.5 text-text-primary"
                                        >
                                            <option value="todos">Todos</option>
                                            <option value="com_rnp">Apenas com RNP ({totalRnp})</option>
                                            <option value="sem_rnp">Sem RNP</option>
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
                                            className={`text-caption text-left px-2 py-1 rounded-md transition-colors ${selectedTipos.length === 0 || selectedTipos.includes('todos')
                                                ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-semibold'
                                                : 'text-text-secondary hover:bg-surface'
                                                }`}
                                        >
                                            Todos os tipos ({activeScopedAtivos.length})
                                        </button>
                                        {categoryStats.map((cat) => {
                                            const isChecked = selectedTipos.includes(cat.name);
                                            return (
                                                <button
                                                    key={cat.name}
                                                    type="button"
                                                    onClick={() => handleToggleTipo(cat.name)}
                                                    className={`text-caption text-left px-2 py-1 rounded-md flex items-center justify-between transition-colors ${isChecked
                                                        ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-semibold'
                                                        : 'text-text-secondary hover:bg-surface'
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-1.5 truncate">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.corHex }} />
                                                        <span className="truncate">{cat.shortName || cat.name}</span>
                                                    </span>
                                                    <span className="text-caption text-text-muted shrink-0 ml-1">{cat.count}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BOX 2: LISTA DE CARDS COMPACTOS */}
                        <div className="flex-1 bg-surface rounded-card border border-border shadow-card p-3 flex flex-col min-h-0 min-w-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
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
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                style={{ backgroundColor: itemColor }}
                                                            />
                                                            <span className="truncate">
                                                                {ativo.shortTipo || ativo.tipo} • <strong className="font-semibold text-text-primary">{ativo.municipio}</strong>
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {ativo.sigla ? (
                                                        <Badge
                                                            variant="neutral"
                                                            className="text-caption font-medium shrink-0"
                                                        >
                                                            {ativo.sigla}
                                                        </Badge>
                                                    ) : ativo.rnp ? (
                                                        <Badge
                                                            variant={filtroSemiarido ? 'warning' : 'success'}
                                                            className="text-caption font-medium shrink-0"
                                                        >
                                                            RNP
                                                        </Badge>
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
                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 shrink-0 min-w-0 relative z-30 overflow-visible">

                            {/* ABAS */}
                            <div className="flex items-center gap-2.5 flex-nowrap min-w-0 shrink-0 overflow-x-auto scrollbar-none">
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
                                            label: selectedTerritory ? 'Ranking Municípios' : 'Ranking Territórios',
                                            icon: <TrendingUp size={15} />
                                        }
                                    ]}
                                    value={activeTab}
                                    onChange={(tab) => setActiveTab(tab)}
                                    variant="pill"
                                    className="shrink-0"
                                />
                            </div>

                            {/* INPUT DE BUSCA + BOTÃO DE FILTROS */}
                            <div className="flex items-center gap-2 w-full xl:w-auto min-w-0 justify-end">
                                <div className="w-full sm:w-64 min-w-0">
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

                                {/* BOTÃO E CAIXA COM DROPDOWN DE FILTROS */}
                                <div className="relative" ref={filterDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                                        className={`px-3 py-1.5 rounded-control border text-caption font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${activeFiltersCount > 0
                                            ? (filtroSemiarido
                                                ? 'bg-amber-500/20 border-amber-400 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-400/40'
                                                : 'bg-primary-50 dark:bg-primary-950 border-primary-400 text-primary-900 dark:text-primary-100 shadow-xs ring-1 ring-primary-500/40')
                                            : 'bg-surface-soft border-border text-text-secondary hover:text-text-primary hover:border-border-strong'
                                            }`}
                                        title="Filtros por Tipo de Ativo e Conectividade RNP"
                                    >
                                        <Filter size={14} className={activeFiltersCount > 0 ? (filtroSemiarido ? 'text-amber-600' : 'text-primary-600') : ''} />
                                        <span>Filtros</span>
                                        {activeFiltersCount > 0 && (
                                            <span className={`w-4 h-4 rounded-full text-caption font-medium flex items-center justify-center text-white leading-none ${filtroSemiarido ? 'bg-amber-600' : 'bg-primary-600'
                                                }`}>
                                                {activeFiltersCount}
                                            </span>
                                        )}
                                        <ChevronDown size={13} className={`text-text-muted transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* CAIXA COM DROPDOWN */}
                                    {isFilterDropdownOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border shadow-float rounded-panel p-4 z-50 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
                                            {/* TOPO DA CAIXA */}
                                            <div className="flex items-center justify-between pb-2 border-b border-border/70">
                                                <div className="flex items-center gap-2">
                                                    <Filter size={14} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />
                                                    <span className="text-xs font-bold text-text-primary">Filtros</span>
                                                </div>
                                                {activeFiltersCount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={handleClearAllFilters}
                                                        className="text-caption font-medium text-danger-600 hover:underline cursor-pointer"
                                                    >
                                                        Limpar
                                                    </button>
                                                )}
                                            </div>

                                            {/* DROPDOWN 1: TIPOS DE ATIVO (MULTI-SELEÇÃO) */}
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-caption font-medium text-text-secondary flex items-center gap-1.5">
                                                        <Layers size={13} />
                                                        <span>Tipos de Ativo</span>
                                                    </label>
                                                    {selectedTipos.length > 0 && !selectedTipos.includes('todos') ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-caption font-medium text-primary-600 dark:text-primary-400">
                                                                {selectedTipos.length} selecionado{selectedTipos.length > 1 ? 's' : ''}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedTipos([]);
                                                                    setSelectedTipo('todos');
                                                                }}
                                                                className="text-caption font-medium text-text-muted hover:text-danger-600 cursor-pointer"
                                                            >
                                                                (Limpar)
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-caption text-text-muted">Todos ({activeScopedAtivos.length})</span>
                                                    )}
                                                </div>

                                                {/* LISTA MULTI-SELECT COM CHECKBOXES */}
                                                <div className="max-h-44 overflow-y-auto pr-1 flex flex-col gap-1 rounded-xl border border-border bg-surface-soft/40 p-1.5">
                                                    {/* Opção Todos os Tipos */}
                                                    <div
                                                        onClick={() => {
                                                            setSelectedTipos([]);
                                                            setSelectedTipo('todos');
                                                        }}
                                                        className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors select-none ${selectedTipos.length === 0 || selectedTipos.includes('todos')
                                                            ? (filtroSemiarido ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 font-semibold' : 'bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-semibold')
                                                            : 'hover:bg-surface text-text-secondary'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTipos.length === 0 || selectedTipos.includes('todos')}
                                                                onChange={() => { }}
                                                                className="rounded accent-primary-600 cursor-pointer w-3.5 h-3.5"
                                                            />
                                                            <span>Todos os tipos</span>
                                                        </div>
                                                        <span className="text-caption px-1.5 py-0.2 rounded bg-surface border border-border/60 text-text-secondary font-medium">
                                                            {activeScopedAtivos.length}
                                                        </span>
                                                    </div>

                                                    {/* Lista de Categorias */}
                                                    {categoryStats.map((cat) => {
                                                        const isChecked = selectedTipos.includes(cat.name);
                                                        return (
                                                            <div
                                                                key={cat.name}
                                                                onClick={() => handleToggleTipo(cat.name)}
                                                                className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors select-none ${isChecked
                                                                    ? (filtroSemiarido ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 font-semibold border border-amber-300/50 dark:border-amber-700/50' : 'bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 font-semibold border border-primary-200/50 dark:border-primary-800/50')
                                                                    : 'hover:bg-surface text-text-primary'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => { }}
                                                                        className="rounded accent-primary-600 cursor-pointer w-3.5 h-3.5 shrink-0"
                                                                    />
                                                                    <span className="w-2 h-2 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: cat.corHex }} />
                                                                    <span className="truncate">{cat.shortName || cat.name}</span>
                                                                </div>
                                                                <span className="text-caption px-1.5 py-0.2 rounded bg-surface border border-border/60 text-text-secondary font-medium shrink-0 ml-1">
                                                                    {cat.count}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* DROPDOWN 2: CONECTIVIDADE RNP */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-caption font-medium text-text-secondary flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5">
                                                        <Network size={13} />
                                                        Conectividade RNP
                                                    </span>
                                                    {filterRnp !== 'todos' && (
                                                        <span className="text-caption font-medium text-emerald-600 dark:text-emerald-400">Ativo</span>
                                                    )}
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={filterRnp}
                                                        onChange={(e) => setFilterRnp(e.target.value)}
                                                        className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl bg-surface-soft border border-border text-xs text-text-primary font-medium focus:bg-surface focus:outline-none transition-colors cursor-pointer ${filtroSemiarido ? 'focus:border-amber-500' : 'focus:border-primary-600'
                                                            }`}
                                                    >
                                                        <option value="todos">Todos (com ou sem RNP)</option>
                                                        <option value="com_rnp">Apenas com RNP ({totalRnp})</option>
                                                        <option value="sem_rnp">Apenas sem RNP ({Math.max(0, activeScopedAtivos.length - totalRnp)})</option>
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* STATUS E FECHAR */}
                                            <div className="flex items-center justify-between pt-2 border-t border-border/70 text-caption font-medium">
                                                <span className="text-text-secondary">
                                                    <strong>{filteredAtivosList.length}</strong> de {activeScopedAtivos.length} ativos
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsFilterDropdownOpen(false)}
                                                    className={`px-3 py-1 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer ${filtroSemiarido ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary-900 hover:bg-primary-800'
                                                        }`}
                                                >
                                                    Fechar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                                icon={<MapPin size={13} />}
                                            >
                                                {territoryName}
                                            </Badge>
                                        )}
                                    </div>



                                    {/* LISTAGEM SCROLLÁVEL */}
                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 min-h-0 w-full pb-2">
                                        {loadingStats ? (
                                            <div className="p-3">
                                                <ListRowSkeleton count={6} />
                                            </div>
                                        ) : filteredAtivosList.length > 0 ? (
                                            filteredAtivosList.map((ativo, idx) => {
                                                const IconComponent = ativo.icone || Database;
                                                const isSelected = selectedAssetId === ativo.id;
                                                const itemColor = filtroSemiarido
                                                    ? getSemiaridoPointColor(ativo.corHex, ativo.tipo || ativo.shortTipo || ativo.nome)
                                                    : (ativo.corHex || '#2563EB');
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
                                                            setSelectedAtivoDrawer(ativo);
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
                                                                        ? (filtroSemiarido ? 'text-amber-800 dark:text-amber-200' : 'text-primary-600 dark:text-primary-300')
                                                                        : (filtroSemiarido ? 'text-text-primary group-hover:text-amber-700' : 'text-text-primary group-hover:text-primary-600')
                                                                        }`}>
                                                                        {ativo.nome}
                                                                    </h4>

                                                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-caption text-text-secondary mt-1 font-medium">
                                                                        <Badge
                                                                            variant="neutral"
                                                                            className="text-caption font-medium"
                                                                            style={{
                                                                                backgroundColor: `${itemColor}15`,
                                                                                color: itemColor,
                                                                                borderColor: `${itemColor}30`
                                                                            }}
                                                                        >
                                                                            {ativo.shortTipo || ativo.tipo}
                                                                        </Badge>
                                                                        <span>•</span>
                                                                        <span className="font-semibold text-text-primary">{ativo.municipio}</span>
                                                                        <span>•</span>
                                                                        <span className="text-text-muted">{ativo.territorio}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                                                                {ativo.sigla && (
                                                                    <Badge variant="neutral" className="text-caption font-medium">
                                                                        {ativo.sigla}
                                                                    </Badge>
                                                                )}
                                                                {ativo.rnp && (
                                                                    <Badge
                                                                        variant={filtroSemiarido ? 'warning' : 'success'}
                                                                        className="text-caption font-medium"
                                                                        icon={<Network size={12} />}
                                                                        title="Ponto de Presença / Conexão RNP"
                                                                    >
                                                                        RNP
                                                                    </Badge>
                                                                )}
                                                                {assetUrl && (
                                                                    <a
                                                                        href={assetUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="p-1 rounded-control text-text-muted hover:text-primary-600 hover:bg-surface-soft transition-colors"
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
                                    </div>
                                </div>
                            )}

                            {/* ABA 2: CLASSIFICAÇÃO DOS ATIVOS (ESTILO DE PÍLULAS PROPORCIONAIS RNP) */}
                            {activeTab === 'categorias' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="mb-3 shrink-0 flex items-center justify-between flex-wrap gap-2">
                                        <div>
                                            <h3 className="text-body font-bold text-text-primary tracking-tight">
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
                                            <span className={`text-caption font-medium text-text-primary px-2.5 py-1 rounded-full flex items-center gap-1 justify-center leading-none ${filtroSemiarido ? 'bg-amber-200/60' : 'bg-primary-200/40'}`}>
                                                <MapPin size={16} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-500'} />
                                                {territoryName}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
                                        {categoryStats.length > 0 ? (
                                            categoryStats.map((cat) => {
                                                const isSelected = selectedTipos.includes(cat.name) || selectedTipo === cat.name;
                                                const catColor = filtroSemiarido
                                                    ? getSemiaridoPointColor(cat.corHex, cat.name || cat.key)
                                                    : '#2563EB';

                                                const pos = Number(cat.rnpCount || 0);
                                                const total = Number(cat.count || 0);
                                                const neg = Math.max(0, total - pos);
                                                const percentPos = total > 0 ? ((pos / total) * 100).toFixed(1) : '0.0';
                                                const percentNeg = total > 0 ? ((neg / total) * 100).toFixed(1) : '0.0';

                                                const posPillColor = filtroSemiarido ? catColor : '#2563EB';
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
                                                        </div>

                                                        {/* BARRAS DE PÍLULAS: [ COM RNP (xx%) ] [ SEM RNP (yy%) ] [ TOTAL ] */}
                                                        <div className="flex items-center gap-2 w-full">
                                                            {/* COM RNP (Positivo) */}
                                                            {pos > 0 && (
                                                                <div
                                                                    className="h-[28px] rounded-full flex items-center justify-center px-3 text-white transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs"
                                                                    style={{
                                                                        flexGrow: pos,
                                                                        flexBasis: 0,
                                                                        backgroundColor: posPillColor,
                                                                        minWidth: neg > 0 ? '64px' : 'auto'
                                                                    }}
                                                                    title={`Com RNP: ${pos} (${percentPos}%)`}
                                                                >
                                                                    <span className="text-caption font-medium tabular-nums leading-none">
                                                                        {pos} <span className="text-caption font-medium opacity-90">({percentPos}%)</span>
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* SEM RNP (Negativo) */}
                                                            {neg > 0 && (
                                                                <div
                                                                    className={`h-[28px] rounded-full ${negPillStyle} flex items-center justify-center px-3 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs`}
                                                                    style={{
                                                                        flexGrow: neg,
                                                                        flexBasis: 0,
                                                                        minWidth: pos > 0 ? '64px' : 'auto'
                                                                    }}
                                                                    title={`Sem RNP: ${neg} (${percentNeg}%)`}
                                                                >
                                                                    <span className="text-caption font-medium tabular-nums leading-none">
                                                                        {neg} <span className="text-caption font-medium opacity-85">({percentNeg}%)</span>
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* TOTAL */}
                                                            <div
                                                                className={`h-[28px] min-w-[36px] px-2.5 rounded-full ${totalPillStyle} flex items-center justify-center shrink-0 select-none shadow-2xs`}
                                                                title={`Total de ativos: ${total}`}
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
                                                    icon={<Filter size={32} />}
                                                    title="Nenhum ativo registrado"
                                                    description={selectedTerritory ? `Não há registros de ativos para o território ${territoryName}.` : 'Nenhum ativo encontrado para esta classificação.'}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* LEGENDA NO RODAPÉ (PADRÃO IDÊNTICO AO REFERENCIAL) */}
                                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-border shrink-0 text-caption font-medium mt-auto">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2.5 h-2.5 rounded-full ${filtroSemiarido ? 'bg-amber-600' : 'bg-primary-600'} shadow-2xs`}></span>
                                            <span className={filtroSemiarido ? 'text-amber-900 dark:text-amber-300 font-semibold' : 'text-text-primary font-semibold'}>Com RNP</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2.5 h-2.5 rounded-full ${filtroSemiarido ? 'bg-amber-500/20' : 'bg-border'} shadow-2xs`}></span>
                                            <span className={filtroSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-text-secondary'}>Sem RNP</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <span className={`w-2.5 h-2.5 rounded-full ${filtroSemiarido ? 'bg-amber-300' : 'bg-border-strong'} shadow-2xs`}></span>
                                            <span className={filtroSemiarido ? 'text-amber-800 dark:text-amber-300 font-medium' : 'text-text-secondary font-medium'}>Total</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ABA 3: RANKING TERRITORIAL OU MUNICIPAL (BARRAS COMPARATIVAS VISÃO GERAL) */}
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
                                                    ? 'Distribuição de ativos e proporção com conexão à rede RNP nos municípios'
                                                    : 'Densidade de infraestrutura e proporção com conexão RNP nos 27 Territórios'
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

                                    {/* LISTA RANKING: 3 NÍVEIS COM CÁPSULA E VALORES ALINHADOS */}
                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0 w-full pb-2">
                                        {selectedTerritory ? (
                                            municipalityRanking.length > 0 ? (
                                                municipalityRanking.map((m) => (
                                                    <div
                                                        key={m.name}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 54px' }}
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
                                                        className="group flex flex-col gap-1.5 p-2 rounded-xl hover:bg-surface-soft/80 transition-all cursor-pointer"
                                                    >
                                                        {/* LINHA 1: TÍTULO EM CAIXA ALTA */}
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-body-sm font-bold uppercase tracking-wider text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                                                {m.name}
                                                            </span>
                                                        </div>

                                                        {/* LINHA 2: SUBTÍTULO + VALOR */}
                                                        <div className="flex items-baseline justify-between text-caption font-medium">
                                                            <span className="text-text-muted truncate">
                                                                {m.percentTotal}% da infraestrutura no território
                                                            </span>
                                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                {m.rnpCount > 0 && (
                                                                    <span className={`text-caption px-1.5 py-0.5 rounded-full font-medium border ${filtroSemiarido
                                                                            ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25'
                                                                            : 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/50'
                                                                        }`} title={`${m.rnpCount} com conectividade RNP`}>
                                                                        {m.rnpCount} RNP
                                                                    </span>
                                                                )}
                                                                <span className="text-text-primary font-bold tabular-nums">
                                                                    {m.count} <span className="font-normal text-text-muted">{m.count === 1 ? 'ativo' : 'ativos'}</span>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* LINHA 3: CÁPSULA COM BORDA E BARRA INTERNA */}
                                                        <div className="w-full h-3 rounded-full border border-neutral-800/80 dark:border-neutral-200/80 p-[2px] flex items-center bg-transparent">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ease-out ${filtroSemiarido ? 'bg-amber-600 dark:bg-amber-400' : 'bg-neutral-900 dark:bg-neutral-100'
                                                                    }`}
                                                                style={{ width: `${Math.max(4, m.percentBar || 0)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))
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
                                                territoryRanking.map((t) => (
                                                    <div
                                                        key={t.id || t.name}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 54px' }}
                                                        onClick={() => {
                                                            const found = (territoriosData || []).find(x =>
                                                                (t.id && Number(x.id_territorio) === Number(t.id)) ||
                                                                normalizeName(x.nome_territorio || x.territorio || x.nome) === normalizeName(t.name)
                                                            );
                                                            setSelectedTerritory(found || { id_territorio: t.id, nome_territorio: t.name });
                                                        }}
                                                        className="group flex flex-col gap-1.5 p-2 rounded-xl hover:bg-surface-soft/80 transition-all cursor-pointer"
                                                    >
                                                        {/* LINHA 1: TÍTULO EM CAIXA ALTA */}
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-body-sm font-bold uppercase tracking-wider text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                                                {t.name}
                                                            </span>
                                                        </div>

                                                        {/* LINHA 2: SUBTÍTULO + VALOR */}
                                                        <div className="flex items-baseline justify-between text-caption font-medium">
                                                            <span className="text-text-muted truncate">
                                                                {t.percentTotal}% da infraestrutura estadual
                                                            </span>
                                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                {t.rnpCount > 0 && (
                                                                    <span className={`text-caption px-1.5 py-0.5 rounded-full font-medium border ${filtroSemiarido
                                                                            ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25'
                                                                            : 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/50'
                                                                        }`} title={`${t.rnpCount} com conectividade RNP`}>
                                                                        {t.rnpCount} RNP
                                                                    </span>
                                                                )}
                                                                <span className="text-text-primary font-bold tabular-nums">
                                                                    {t.count} <span className="font-normal text-text-muted">{t.count === 1 ? 'ativo' : 'ativos'}</span>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* LINHA 3: CÁPSULA COM BORDA E BARRA INTERNA */}
                                                        <div className="w-full h-3 rounded-full border border-neutral-800/80 dark:border-neutral-200/80 p-[2px] flex items-center bg-transparent">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ease-out ${filtroSemiarido ? 'bg-amber-600 dark:bg-amber-400' : 'bg-neutral-900 dark:bg-neutral-100'
                                                                    }`}
                                                                style={{ width: `${Math.max(4, t.percentBar || 0)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))
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
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}

            </motion.div>

            {/* DRAWER DE DETALHES DO ATIVO */}
            <Drawer
                open={Boolean(selectedAtivoDrawer)}
                onClose={() => setSelectedAtivoDrawer(null)}
                title={selectedAtivoDrawer?.nome}
                subtitle={selectedAtivoDrawer?.sigla ? `Sigla: ${selectedAtivoDrawer.sigla}` : undefined}
                footer={
                    (selectedAtivoDrawer?.urlReferencia || selectedAtivoDrawer?.link || selectedAtivoDrawer?.url || selectedAtivoDrawer?.site) ? (
                        <div className="flex items-center justify-end gap-2 w-full">
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedAtivoDrawer(null)}
                            >
                                Fechar
                            </Button>
                            <Button
                                variant="primary"
                                iconRight={<ExternalLink size={16} />}
                                onClick={() => {
                                    const targetUrl = selectedAtivoDrawer.urlReferencia || selectedAtivoDrawer.link || selectedAtivoDrawer.url || selectedAtivoDrawer.site;
                                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                                }}
                            >
                                Acessar Link Oficial
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-end w-full">
                            <Button variant="secondary" onClick={() => setSelectedAtivoDrawer(null)}>
                                Fechar
                            </Button>
                        </div>
                    )
                }
            >
                {selectedAtivoDrawer && (
                    <div className="flex flex-col gap-5 p-1">
                        {/* Badges / Destaques */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                                variant="primary"
                                className="text-caption py-1 px-3 font-semibold"
                                style={{
                                    backgroundColor: `${selectedAtivoDrawer.corHex}15`,
                                    color: selectedAtivoDrawer.corHex,
                                    borderColor: `${selectedAtivoDrawer.corHex}40`
                                }}
                            >
                                {selectedAtivoDrawer.tipo}
                            </Badge>
                            {selectedAtivoDrawer.rnp && (
                                <Badge variant="success" icon={<Wifi size={13} />} className="text-caption py-1 px-2.5">
                                    Conectado à RNP
                                </Badge>
                            )}
                            {isMunicipioSemiarido(selectedAtivoDrawer.municipio) && (
                                <Badge variant="warning" icon={<SunMedium size={13} />} className="text-caption py-1 px-2.5">
                                    Semiárido Baiano
                                </Badge>
                            )}
                        </div>

                        {/* Informações Estruturadas */}
                        <div className="bg-surface-sunken rounded-card p-4 border border-border/70 space-y-3">
                            <div className="flex justify-between items-start gap-2 border-b border-border/60 pb-2.5">
                                <span className="text-caption text-text-muted font-medium">Município</span>
                                <span className="text-body-sm font-semibold text-text-primary text-right">
                                    {selectedAtivoDrawer.municipio}
                                </span>
                            </div>
                            <div className="flex justify-between items-start gap-2 border-b border-border/60 pb-2.5">
                                <span className="text-caption text-text-muted font-medium">Território de Identidade</span>
                                <span className="text-body-sm font-semibold text-text-primary text-right">
                                    {selectedAtivoDrawer.territorio}
                                </span>
                            </div>
                            <div className="flex justify-between items-start gap-2 border-b border-border/60 pb-2.5">
                                <span className="text-caption text-text-muted font-medium">Tipologia</span>
                                <span className="text-body-sm font-semibold text-text-primary text-right">
                                    {selectedAtivoDrawer.tipo}
                                </span>
                            </div>
                            {selectedAtivoDrawer.lat && selectedAtivoDrawer.lng && (
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-caption text-text-muted font-medium">Coordenadas Geográficas</span>
                                    <span className="text-caption font-mono text-text-secondary text-right">
                                        {Number(selectedAtivoDrawer.lat).toFixed(4)}, {Number(selectedAtivoDrawer.lng).toFixed(4)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Ação no Mapa */}
                        <Button
                            variant="secondary"
                            iconLeft={<MapPin size={16} />}
                            onClick={() => {
                                handleSelectFromMap(selectedAtivoDrawer);
                                setSelectedAtivoDrawer(null);
                            }}
                            className="w-full justify-center"
                        >
                            Centralizar no Mapa
                        </Button>
                    </div>
                )}
            </Drawer>

        </main>
    );
}
