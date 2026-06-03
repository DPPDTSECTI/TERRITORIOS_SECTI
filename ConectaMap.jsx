import React, { useEffect, useMemo, useState, useRef } from 'react';
import * as topojson from 'topojson-client';
import territoriosMunicipios from './utils/territorioMunicipios.json';
import { fetchTerritorialData } from './utils/territorialDataService';
import { fetchConectaData, applyFilterMode } from './utils/spreadsheetService';

const SVG_W = 700;
const SVG_H = 700;
const PADDING = 20;

// Constantes de cores brutas estritas para propriedades nativas de SVG/Filters
const SVG_COLOR_TOKENS = {
    secti700: '#0F766E',
    kpiDanger: '#DC2626',
    white: '#FFFFFF',
    fallbackSlate: '#E2E8F0'
};

const TERRITORY_COLORS = [
    '#EE2F5A', '#FBA751', '#CFDD90', '#0397DA', '#9CD3AF', '#EB278F', '#BE4481',
    '#BF8057', '#D7CB76', '#04AFED', '#b6b317', '#099D9E', '#F38735', '#A4C757',
    '#9493B5', '#01A859', '#5CC3D4', '#0F9296', '#FFCD37', '#9F637C', '#FDF588',
    '#F8AFAD', '#47887A', '#D9CB72', '#B0BD77', '#C5C7DB', '#C8C6C4',
];

const INTEGER_FORMATTER = new Intl.NumberFormat('pt-BR');
const formatCount = (value) => INTEGER_FORMATTER.format(Number(value || 0));

const getUniversityCampusCount = (capacidade) => {
    const campiUniversitarios = Number(capacidade?.campiUniversitarios || 0);
    if (campiUniversitarios > 0) return campiUniversitarios;
    return Number(capacidade?.universidades || 0);
};

const DEFAULT_MAP_FILTERS = {
    query: '',
    assistencia: 'todos',
    parques: 'todos',
    capacidade: 'todas',
};

const matchesCapacityFilter = (value, filterValue) => {
    switch (filterValue) {
        case 'ate-10': return value <= 10;
        case '11-25': return value >= 11 && value <= 25;
        case '26+': return value >= 26;
        default: return true;
    }
};

function normalizeName(value) {
    if (!value) return '';
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const TERRITORY_NAME_ALIASES = {
    [normalizeName('Rio Corrente')]: 'Bacia do Rio Corrente',
};

const getCanonicalTerritoryName = (value) => {
    const normalizedValue = normalizeName(value);
    if (!normalizedValue) return '';
    return TERRITORY_NAME_ALIASES[normalizedValue] || String(value || '').trim();
};

const getTerritoryKey = (value) => normalizeName(getCanonicalTerritoryName(value));

const territoryColorMap = {};
const territoryNameMap = {};
const territoryMunicipalityCountMap = {};
territoriosMunicipios.territorios_de_identidade.forEach((territorio) => {
    const territoryKey = getTerritoryKey(territorio.nome);
    const canonicalTerritoryName = getCanonicalTerritoryName(territorio.nome);

    territoryColorMap[territoryKey] = TERRITORY_COLORS[territorio.id - 1] || SVG_COLOR_TOKENS.fallbackSlate;
    territoryNameMap[territoryKey] = canonicalTerritoryName;
    territoryMunicipalityCountMap[territoryKey] = territorio.municipios.length;
});

const resolveTerritoryName = (value) => {
    const territoryKey = getTerritoryKey(value);
    return territoryNameMap[territoryKey] || getCanonicalTerritoryName(value);
};

const buildMunicipioTerritoryMap = () => {
    const m = {};
    territoriosMunicipios.territorios_de_identidade.forEach((territorio) => {
        territorio.municipios.forEach((municipio) => {
            m[normalizeName(municipio)] = getCanonicalTerritoryName(territorio.nome);
        });
    });
    return m;
};

const hasAssistencia = (value) => {
    const normalizedValue = normalizeName(value);
    return value === true || ['sim', 'existente', 'conecta'].includes(normalizedValue);
};

const getAssistenciaDisplayLabel = (value) => (hasAssistencia(value) ? 'Existente' : 'Não existente');

const buildPriorityChains = (territoryData) => {
    if (!territoryData) return [];

    const summarizedChains = (territoryData.cadeiasProdutivas || [])
        .map((item) => ({
            cadeia: item?.cadeia || '',
            municipioSede: item?.municipioSatelite || item?.municipio || '',
        }))
        .filter((item) => item.cadeia)
        .slice(0, 2);

    if (summarizedChains.length > 0) return summarizedChains;

    const rankedChains = new Map();
    const detailedChains = territoryData.cadeiasProdutivasDetalhado || territoryData.cadeiasRows || [];

    detailedChains.forEach((row) => {
        const cadeias = Array.isArray(row?.cadeias) ? row.cadeias : row?.cadeia ? [row.cadeia] : [];
        const municipioSede = row?.municipioSatelite || row?.municipio || '';

        cadeias.forEach((cadeia) => {
            if (!cadeia) return;
            if (!rankedChains.has(cadeia)) {
                rankedChains.set(cadeia, { cadeia, municipioSede, total: 0 });
            }
            const currentChain = rankedChains.get(cadeia);
            currentChain.total += 1;
            if (!currentChain.municipioSede && municipioSede) {
                currentChain.municipioSede = municipioSede;
            }
        });
    });

    return Array.from(rankedChains.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 2)
        .map(({ cadeia, municipioSede }) => ({ cadeia, municipioSede }));
};

const getPathD = (geometry, project) => {
    if (!geometry) return '';
    if (geometry.type === 'Polygon') {
        return geometry.coordinates.map((ring) => {
            return ring.map(([x, y], i) => {
                const [px, py] = project([x, y]);
                return `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`;
            }).join(' ') + ' Z';
        }).join(' ');
    }
    if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.flatMap((polygon) =>
            polygon.map((ring) =>
                ring.map(([x, y], i) => {
                    const [px, py] = project([x, y]);
                    return `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`;
                }).join(' ') + ' Z'
            )
        ).join(' ');
    }
    return '';
};

// COMPONENTE DE KPI ROBUSTO
const StatCard = ({ title, value, variant = 'primary', icon, totalForContext }) => {
    const variants = {
        primary: { 
            text: 'text-secti-700', bg: 'bg-secti-50', line: 'bg-secti-700', bar: 'bg-secti-500', glow: 'from-secti-500/20' 
        },
        warning: { 
            text: 'text-inovacao-600', bg: 'bg-inovacao-50', line: 'bg-inovacao-600', bar: 'bg-inovacao-500', glow: 'from-inovacao-500/20' 
        },
        info: { 
            text: 'text-blue-600', bg: 'bg-blue-50', line: 'bg-blue-600', bar: 'bg-blue-500', glow: 'from-blue-500/20' 
        },
        success: { 
            text: 'text-emerald-600', bg: 'bg-emerald-50', line: 'bg-emerald-600', bar: 'bg-emerald-500', glow: 'from-emerald-500/20' 
        }
    };
    
    const current = variants[variant] || variants.primary;
    
    const numericValue = typeof value === 'string' ? Number(value.replace(/[^0-9.-]+/g, "")) : Number(value);
    const percentage = totalForContext && numericValue ? Math.min(100, Math.round((numericValue / totalForContext) * 100)) : 0;

    return (
        <div className="group relative overflow-hidden bg-white/90 backdrop-blur-xl p-5 rounded-[1.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgb(15,118,110,0.12)] flex flex-col justify-between z-10">
            <div className={`absolute -inset-4 bg-gradient-to-br ${current.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl -z-10`}></div>
            <div className={`absolute top-0 left-0 w-full h-1 opacity-80 ${current.line}`}></div>
            
            <div className="flex justify-between items-start mb-5 z-10">
                <h3 className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-widest pr-4 leading-relaxed">
                    {title}
                </h3>
                <div className={`p-2.5 rounded-xl shadow-sm border border-white ${current.bg} ${current.text}`}>
                    {icon}
                </div>
            </div>
            
            <div className="flex flex-col gap-2 z-10">
                <span className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tighter drop-shadow-sm">
                    {value}
                </span>
                
                {totalForContext > 0 && (
                    <div className="flex flex-col gap-1.5 mt-2">
                        <div className="w-full bg-slate-100/80 rounded-full h-1.5 overflow-hidden shadow-inner">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${current.bar}`} 
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold tracking-wide">
                            Representa <strong className="text-slate-700">{percentage}%</strong> do estado
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const ConectaGovDashboard = () => {
    const [territorialData, setTerritorialData] = useState({ territories: [], summary: {} });
    const [mapFeatures, setMapFeatures] = useState([]);
    const [hoveredTerritory, setHoveredTerritory] = useState(null);
    const [selectedTerritory, setSelectedTerritory] = useState(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const mapContainerRef = useRef(null);
    const [error, setError] = useState(null);
    const [homologatedConectaTerritories, setHomologatedConectaTerritories] = useState(() => new Set());
    const [hasHomologacaoConectaData, setHasHomologacaoConectaData] = useState(false);
    const [filters, setFilters] = useState(DEFAULT_MAP_FILTERS);

    const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);
    
    const territoryDataMap = useMemo(() => {
        const map = {};
        (territorialData.territories || []).forEach((t) => {
            const territoryKey = getTerritoryKey(t?.territory);
            if (!territoryKey) return;

            map[territoryKey] = {
                ...t,
                territory: resolveTerritoryName(t.territory),
            };
        });
        return map;
    }, [territorialData]);

    // Cálculos globais para dar contexto aos KPIs (Barra de progresso)
    const stateTotals = useMemo(() => {
        return (territorialData.territories || []).reduce((acc, t) => {
            const cap = t.capacidade || {};
            acc.entidades += cap.entidadesTotal || 0;
            acc.universidades += getUniversityCampusCount(cap);
            acc.ifs += cap.campiIFs || 0;
            acc.espacos += cap.espacosDinamizadores || 0;
            acc.incubadoras += cap.incubadoras || 0;
            return acc;
        }, { entidades: 0, universidades: 0, ifs: 0, espacos: 0, incubadoras: 0 });
    }, [territorialData]);

    useEffect(() => {
        const load = async () => {
            setError(null);
            setLoading(true);
            try {
                const { data } = await fetchTerritorialData();
                setTerritorialData(data);
            } catch (err) {
                setError(err.message || 'Erro ao carregar dados territoriais');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        let active = true;
        const loadHomologatedConectaData = async () => {
            try {
                const { data } = await fetchConectaData(null, 'ambos');
                if (!active || !data || typeof data !== 'object') return;

                const hasMetadata = Object.values(data).some((pracas) =>
                    Array.isArray(pracas) && pracas.some((praca) => praca && ('homologacao_prodeb' in praca || 'status_homologacao_pontos' in praca))
                );

                const homologatedData = applyFilterMode(data, 'homologacao');
                const nextTerritories = new Set();

                Object.entries(homologatedData || {}).forEach(([municipio, pracas]) => {
                    if (!Array.isArray(pracas) || pracas.length === 0) return;

                    const mappedTerritory = municipioTerritoryMap[normalizeName(municipio)];
                    const fallbackTerritory = pracas.find((praca) => praca?.territorio_identidade)?.territorio_identidade || '';
                    const territoryName = getTerritoryKey(mappedTerritory || fallbackTerritory);

                    if (territoryName) {
                        nextTerritories.add(territoryName);
                    }
                });

                setHasHomologacaoConectaData(hasMetadata);
                setHomologatedConectaTerritories(nextTerritories);
            } catch (err) {
                console.warn('[ConectaMap] Falha ao correlacionar homologação do Conecta:', err);
                if (active) {
                    setHasHomologacaoConectaData(false);
                    setHomologatedConectaTerritories(new Set());
                }
            }
        };

        loadHomologatedConectaData();
        return () => { active = false; };
    }, [municipioTerritoryMap]);

    useEffect(() => {
        fetch('/BA_(1)9396399957704198.json')
            .then((resp) => resp.json())
            .then((topology) => {
                const geo = topojson.feature(topology, topology.objects.BA);
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                geo.features.forEach((feat) => {
                    if (!feat.geometry) return;
                    const coords = feat.geometry.type === 'Polygon' ? feat.geometry.coordinates.flat() : feat.geometry.coordinates.flat(2);
                    coords.forEach(([x, y]) => {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    });
                });

                const width = SVG_W - 2 * PADDING;
                const height = SVG_H - 2 * PADDING;
                const scaleX = width / (maxX - minX);
                const scaleY = height / (maxY - minY);
                const scale = Math.min(scaleX, scaleY);

                const project = ([x, y]) => [PADDING + (x - minX) * scale + (width - (maxX - minX) * scale) / 2, PADDING + (maxY - y) * scale + (height - (maxY - minY) * scale) / 2];

                const features = geo.features.map((feat) => {
                    const municipio = feat.properties?.NOME || feat.properties?.nome || '';
                    const territoryName = resolveTerritoryName(municipioTerritoryMap[normalizeName(municipio)] || 'Sem Território');
                    const d = getPathD(feat.geometry, project);

                    let centroid = [0, 0];
                    let count = 0;
                    (feat.geometry.type === 'Polygon' ? feat.geometry.coordinates.flat() : feat.geometry.coordinates.flat(2)).forEach(([x, y]) => {
                        const [cx, cy] = project([x, y]);
                        centroid[0] += cx;
                        centroid[1] += cy;
                        count += 1;
                    });
                    if (count > 0) {
                        centroid = [centroid[0] / count, centroid[1] / count];
                    }
                    return { nome: municipio, territory: territoryName, d, centroid };
                });
                setMapFeatures(features);
            })
            .catch((err) => setError(err.message || 'Falha ao carregar TopoJSON'));
    }, [municipioTerritoryMap]);

    const territoryPaths = useMemo(() => {
        const boundary = new Map();
        mapFeatures.forEach((m) => {
            if (!boundary.has(m.territory)) {
                boundary.set(m.territory, []);
            }
            boundary.get(m.territory).push(m);
        });

        return Array.from(boundary.entries()).map(([territory, features]) => {
            const points = features.map((feat) => feat.centroid).filter((ct) => ct[0] && ct[1]);
            const centroid = points.length > 0 ? [points.reduce((a, v) => a + v[0], 0) / points.length, points.reduce((a, v) => a + v[1], 0) / points.length] : [0, 0];
            return { territory, centroid, count: features.length };
        });
    }, [mapFeatures]);

    const hoveredData = hoveredTerritory ? territoryDataMap[getTerritoryKey(hoveredTerritory)] : null;
    const selectedData = selectedTerritory ? territoryDataMap[getTerritoryKey(selectedTerritory)] : null;
    const hoveredPriorityChains = hoveredData ? buildPriorityChains(hoveredData) : [];

    const getTerritoryAssistenciaStatus = (territoryName, fallbackValue) => {
        if (hasHomologacaoConectaData) {
            return homologatedConectaTerritories.has(getTerritoryKey(territoryName)) ? 'Existente' : 'Não existente';
        }
        return getAssistenciaDisplayLabel(fallbackValue);
    };

    const filteredTerritorySummaries = useMemo(() => {
        const normalizedQuery = normalizeName(filters.query);

        return territoryPaths
            .map((territory) => {
                const normalizedTerritory = getTerritoryKey(territory.territory);
                const data = territoryDataMap[normalizedTerritory];
                const entitiesTotal = data?.capacidade?.entidadesTotal || 0;
                const parkCount = data?.capacidade?.parquesTecnologicos || 0;
                const assistenciaStatus = getTerritoryAssistenciaStatus(territory.territory, data?.assistenciaPublica?.existe);

                const matchesQuery = !normalizedQuery || normalizedTerritory.includes(normalizedQuery);
                const matchesAssistencia = filters.assistencia === 'todos'
                    ? true
                    : filters.assistencia === 'existente'
                        ? assistenciaStatus === 'Existente'
                        : assistenciaStatus !== 'Existente';
                const matchesParques = filters.parques === 'todos'
                    ? true
                    : filters.parques === 'com'
                        ? parkCount > 0
                        : parkCount === 0;
                const matchesCapacidade = matchesCapacityFilter(entitiesTotal, filters.capacidade);

                return {
                    territory: territory.territory,
                    normalizedTerritory,
                    entitiesTotal,
                    parkCount,
                    hasParks: parkCount > 0,
                    assistenciaStatus,
                    municipalityCount: territoryMunicipalityCountMap[normalizedTerritory] || 0,
                    matchesFilters: matchesQuery && matchesAssistencia && matchesParques && matchesCapacidade,
                };
            })
            .filter((item) => item.matchesFilters)
            .sort((a, b) => a.territory.localeCompare(b.territory, 'pt-BR'));
    }, [filters, getTerritoryAssistenciaStatus, territoryDataMap, territoryPaths]);

    const filteredTerritoryKeys = useMemo(
        () => new Set(filteredTerritorySummaries.map((item) => item.normalizedTerritory)),
        [filteredTerritorySummaries],
    );

    const filteredTerritoryCount = filteredTerritorySummaries.length;
    const filteredTerritoriesWithParks = useMemo(
        () => filteredTerritorySummaries.reduce((total, territory) => total + (territory.hasParks ? 1 : 0), 0),
        [filteredTerritorySummaries],
    );

    const hasActiveFilters = Boolean(
        filters.query.trim() || filters.assistencia !== 'todos' || filters.parques !== 'todos' || filters.capacidade !== 'todas',
    );

    const activeFilterTags = useMemo(() => {
        const tags = [];
        if (filters.query.trim()) tags.push(`Busca: ${filters.query.trim()}`);
        if (filters.assistencia === 'existente') tags.push('Assistência: existente');
        else if (filters.assistencia === 'nao-existente') tags.push('Assistência: não existente');
        if (filters.parques === 'com') tags.push('Parques: com');
        else if (filters.parques === 'sem') tags.push('Parques: sem');
        if (filters.capacidade === 'ate-10') tags.push('Capacidade: até 10');
        else if (filters.capacidade === '11-25') tags.push('Capacidade: 11 a 25');
        else if (filters.capacidade === '26+') tags.push('Capacidade: 26+');
        return tags;
    }, [filters]);

    const hoveredAssistenciaStatus = hoveredTerritory
        ? getTerritoryAssistenciaStatus(hoveredTerritory, hoveredData?.assistenciaPublica?.existe)
        : 'Não existente';
    const selectedTerritoryColor = selectedTerritory
        ? territoryColorMap[getTerritoryKey(selectedTerritory)] || SVG_COLOR_TOKENS.secti700
        : SVG_COLOR_TOKENS.secti700;

    const overviewItems = selectedData ? [
        { label: 'CAPACIDADE TERRITORIAL EM CT&I', value: formatCount(selectedData.capacidade?.entidadesTotal || 0) },
        { label: 'QUANTIDADE CAMPI DE UNIVERSIDADES ESTADUAIS E FEDERAIS', value: formatCount(getUniversityCampusCount(selectedData.capacidade)) },
        { label: 'QUANTIDADE CAMPI DE INSTITUTOS FEDERAIS', value: formatCount(selectedData.capacidade?.campiIFs || 0) },
        { label: 'QUANTIDADE ESPAÇOS DINAMIZADORES', value: formatCount(selectedData.capacidade?.espacosDinamizadores || 0) },
        { label: 'QUANTIDADE INCUBADORAS', value: formatCount(selectedData.capacidade?.incubadoras || 0) },
    ] : [];

    const handleTerritorySelect = (territory) => {
        setSelectedTerritory((currentTerritory) => (currentTerritory === territory ? null : territory));
    };

    const handleFilterChange = (field, value) => {
        setFilters((currentFilters) => ({ ...currentFilters, [field]: value }));
    };

    const clearSelection = () => { setSelectedTerritory(null); };
    const clearFilters = () => { setFilters(DEFAULT_MAP_FILTERS); };

    useEffect(() => {
        if (selectedTerritory && !filteredTerritoryKeys.has(getTerritoryKey(selectedTerritory))) {
            setSelectedTerritory(null);
        }
        if (hoveredTerritory && !filteredTerritoryKeys.has(getTerritoryKey(hoveredTerritory))) {
            setHoveredTerritory(null);
            setTooltip((currentTooltip) => ({ ...currentTooltip, visible: false }));
        }
    }, [filteredTerritoryKeys, hoveredTerritory, selectedTerritory]);

    const onTerritoryMouseMove = (e, territory) => {
        setHoveredTerritory(territory);
        const container = mapContainerRef.current;
        if (!container) {
            setTooltip({ visible: true, x: e.clientX + 8, y: e.clientY + 8 });
            return;
        }

        const rect = container.getBoundingClientRect();
        const tooltipWidth = 280, tooltipHeight = 260, offset = 12;

        let x = e.clientX - rect.left + offset;
        let y = e.clientY - rect.top + offset;

        if (x + tooltipWidth > rect.width) x = Math.max(8, e.clientX - rect.left - tooltipWidth - offset);
        if (y + tooltipHeight > rect.height) y = Math.max(8, e.clientY - rect.top - tooltipHeight - offset);

        setTooltip({ visible: true, x, y });
    };

    const onMouseLeave = () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
        setHoveredTerritory(null);
    };

    return (
        <div className="relative w-full h-full overflow-hidden rounded-[2rem] bg-surface-bg p-4 sm:p-6">
            <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 rounded-full bg-secti-500/10 blur-3xl"></div>
            <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-slate-200/50 blur-3xl"></div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secti-700/20 to-transparent"></div>
            
            <div className="relative flex h-full flex-col gap-6">
            
            {loading && (
                <div className="flex items-center justify-center p-8 text-secti-700 font-semibold">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-secti-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Carregando dados territoriais...
                </div>
            )}
            
            {error && (
                <div className="p-4 bg-kpi-danger/10 text-kpi-danger border border-kpi-danger/20 rounded-xl font-medium">
                    Erro: {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Linha de KPIs Semântica e Dinâmica */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                        <StatCard 
                            title="CAPACIDADE EM CT&I" 
                            value={selectedData ? formatCount(selectedData.capacidade?.entidadesTotal || 0) : '-'} 
                            totalForContext={selectedData ? stateTotals.entidades : null}
                            variant="info" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
                        />
                        <StatCard 
                            title="UNIVERSIDADES EST. E FEDERAIS" 
                            value={selectedData ? formatCount(getUniversityCampusCount(selectedData.capacidade)) : '-'} 
                            totalForContext={selectedData ? stateTotals.universidades : null}
                            variant="warning" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>}
                        />
                        <StatCard 
                            title="CAMPI DE INSTITUTOS FEDERAIS" 
                            value={selectedData ? formatCount(selectedData.capacidade?.campiIFs || 0) : '-'} 
                            totalForContext={selectedData ? stateTotals.ifs : null}
                            variant="info" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>}
                        />
                        <StatCard 
                            title="ESPAÇOS DINAMIZADORES" 
                            value={selectedData ? formatCount(selectedData.capacidade?.espacosDinamizadores || 0) : '-'} 
                            totalForContext={selectedData ? stateTotals.espacos : null}
                            variant="primary" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8" /></svg>}
                        />
                        <StatCard 
                            title="QUANTIDADE INCUBADORAS" 
                            value={selectedData ? formatCount(selectedData.capacidade?.incubadoras || 0) : '-'} 
                            totalForContext={selectedData ? stateTotals.incubadoras : null}
                            variant="success" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a4 4 0 00-5.656 0L12 17.2l-1.772-1.772a4 4 0 10-5.656 5.656L12 28.512l7.428-7.428a4 4 0 000-5.656z" transform="scale(.75) translate(4 -2)" /></svg>}
                        />
                    </div>

                    {/* Área Central: Estrutura em acrílico translúcido */}
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                        
                        {/* MAPA (Lado Esquerdo) */}
                        <div className="flex-[3] bg-surface-card rounded-[1.75rem] border border-surface-border overflow-hidden relative flex flex-col min-h-[560px] shadow-glass">
                            <div className="bg-secti-700 text-white px-5 py-4 shadow-md z-10 flex flex-col gap-3 border-b border-black/10 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1">
                                    <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-secti-100">Mapa interativo territorial</span>
                                    <span className="font-semibold tracking-wide text-sm sm:text-base">
                                        DETALHAMENTO DO TERRITÓRIO: <span className="font-bold text-inovacao-100">{selectedTerritory || hoveredTerritory || 'Selecione no mapa'}</span>
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]">
                                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">Passe o mouse para prévia</span>
                                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">Clique para fixar</span>
                                    {selectedTerritory && (
                                        <button
                                            type="button"
                                            onClick={clearSelection}
                                            className="rounded-full border border-surface-border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-secti-700 transition-colors hover:bg-secti-50"
                                        >
                                            Limpar seleção
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Seção Filtros */}
                            <div className="border-b border-surface-border bg-white/80 px-5 py-4 backdrop-blur-md">
                                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.95fr))_auto]">
                                    <label className="block">
                                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Buscar território</span>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            </span>
                                            <input
                                                type="text"
                                                value={filters.query}
                                                onChange={(e) => handleFilterChange('query', e.target.value)}
                                                placeholder="Digite o nome do território"
                                                className="w-full rounded-2xl border border-surface-border bg-white px-10 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-secti-500 focus:ring-2 focus:ring-secti-500/15"
                                            />
                                        </div>
                                    </label>

                                    <label className="block">
                                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Assistência pública</span>
                                        <select
                                            value={filters.assistencia}
                                            onChange={(e) => handleFilterChange('assistencia', e.target.value)}
                                            className="w-full rounded-2xl border border-surface-border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-secti-500 focus:ring-2 focus:ring-secti-500/15"
                                        >
                                            <option value="todos">Todos</option>
                                            <option value="existente">Existente</option>
                                            <option value="nao-existente">Não existente</option>
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Parques tecnológicos</span>
                                        <select
                                            value={filters.parques}
                                            onChange={(e) => handleFilterChange('parques', e.target.value)}
                                            className="w-full rounded-2xl border border-surface-border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-secti-500 focus:ring-2 focus:ring-secti-500/15"
                                        >
                                            <option value="todos">Todos</option>
                                            <option value="com">Com parques</option>
                                            <option value="sem">Sem parques</option>
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Capacidade CT&amp;I</span>
                                        <select
                                            value={filters.capacidade}
                                            onChange={(e) => handleFilterChange('capacidade', e.target.value)}
                                            className="w-full rounded-2xl border border-surface-border bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-secti-500 focus:ring-2 focus:ring-secti-500/15"
                                        >
                                            <option value="todas">Todas</option>
                                            <option value="ate-10">Até 10 entidades</option>
                                            <option value="11-25">11 a 25 entidades</option>
                                            <option value="26+">26 ou mais</option>
                                        </select>
                                    </label>

                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            disabled={!hasActiveFilters}
                                            className="w-full rounded-2xl border border-transparent bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                                        >
                                            Limpar filtros
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap gap-2">
                                        {hasActiveFilters ? activeFilterTags.map((tag) => (
                                            <span key={tag} className="rounded-full border border-surface-border bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-sm">
                                                {tag}
                                            </span>
                                        )) : (
                                            <span className="rounded-full border border-surface-border bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                Sem filtros ativos
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Exibindo {formatCount(filteredTerritoryCount)} de {formatCount(territoryPaths.length)} territórios
                                    </p>
                                </div>
                            </div>

                            {/* Canvas do Mapa Geográfico SVG */}
                            <div ref={mapContainerRef} onMouseLeave={onMouseLeave} className="flex-1 relative isolate w-full overflow-hidden bg-slate-50 p-4 sm:p-6">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.08),transparent_34%)]"></div>
                                <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:34px_34px]"></div>

                                <div className="absolute inset-x-4 top-4 z-20 flex flex-wrap items-start justify-between gap-3 sm:inset-x-6">
                                    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-glass backdrop-blur-md">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Leitura rápida</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Visíveis: {formatCount(filteredTerritoryCount)}</span>
                                            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-sm border border-surface-border">Com parques: {formatCount(filteredTerritoriesWithParks)}</span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-glass backdrop-blur-md">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Legenda</p>
                                        <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-slate-600">
                                            <span className="inline-flex h-3.5 w-3.5 rounded-full bg-kpi-danger shadow-[0_0_0_6px_rgba(220,38,38,0.16)]"></span>
                                            <span>Parques tecnológicos</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 flex h-full w-full items-center justify-center rounded-[1.5rem] border border-white/70 bg-white/55 p-2 pb-24 pt-24 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-sm sm:p-4 sm:pb-28 sm:pt-24">
                                    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto max-h-[620px] bg-transparent cursor-pointer [filter:drop-shadow(0_20px_30px_rgba(15,23,42,0.08))]">
                                        <defs>
                                            <filter id="territoryGlow" x="-25%" y="-25%" width="150%" height="150%">
                                                <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor={SVG_COLOR_TOKENS.secti700} floodOpacity="0.15" />
                                            </filter>
                                            <filter id="territoryFocus" x="-30%" y="-30%" width="160%" height="160%">
                                                <feDropShadow dx="0" dy="14" stdDeviation="8" floodColor={SVG_COLOR_TOKENS.secti700} floodOpacity="0.25" />
                                            </filter>
                                            <filter id="markerGlow" x="-60%" y="-60%" width="220%" height="220%">
                                                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor={SVG_COLOR_TOKENS.kpiDanger} floodOpacity="0.3" />
                                            </filter>
                                        </defs>

                                        {mapFeatures.map((feat, index) => {
                                            const normalizedTerritory = getTerritoryKey(feat.territory);
                                            const matchesFilters = filteredTerritoryKeys.has(normalizedTerritory);
                                            const isHovered = matchesFilters && hoveredTerritory === feat.territory;
                                            const isSelected = matchesFilters && selectedTerritory === feat.territory;
                                            const hasHoverState = Boolean(hoveredTerritory) && filteredTerritoryKeys.has(getTerritoryKey(hoveredTerritory));
                                            const hasSelectionState = Boolean(selectedTerritory) && filteredTerritoryKeys.has(getTerritoryKey(selectedTerritory));
                                            const isRelatedToFocus = isHovered || isSelected;
                                            const isMuted = matchesFilters && (hasHoverState
                                                ? !isRelatedToFocus
                                                : hasSelectionState
                                                    ? !isSelected
                                                    : false);
                                            const territoryColor = territoryColorMap[normalizedTerritory] || SVG_COLOR_TOKENS.fallbackSlate;

                                            return (
                                                <path
                                                    key={`${feat.nome}-${index}`}
                                                    d={feat.d}
                                                    fill={territoryColor}
                                                    stroke={matchesFilters && (isSelected || isHovered) ? SVG_COLOR_TOKENS.secti700 : SVG_COLOR_TOKENS.white}
                                                    strokeWidth={!matchesFilters ? 0.5 : isSelected ? 2.6 : isHovered ? 1.8 : 0.7}
                                                    strokeLinejoin="round"
                                                    vectorEffect="non-scaling-stroke"
                                                    filter={matchesFilters ? (isSelected ? 'url(#territoryFocus)' : isHovered ? 'url(#territoryGlow)' : undefined) : undefined}
                                                    className="transition-all duration-200 ease-out"
                                                    opacity={!matchesFilters ? 0.12 : isMuted ? 0.28 : isSelected ? 1 : isHovered ? 0.98 : 0.92}
                                                    style={{ cursor: matchesFilters ? 'pointer' : 'default', pointerEvents: matchesFilters ? 'auto' : 'none' }}
                                                    onMouseEnter={matchesFilters ? (e) => onTerritoryMouseMove(e, feat.territory) : undefined}
                                                    onMouseMove={matchesFilters ? (e) => onTerritoryMouseMove(e, feat.territory) : undefined}
                                                    onMouseLeave={matchesFilters ? onMouseLeave : undefined}
                                                    onClick={matchesFilters ? () => handleTerritorySelect(feat.territory) : undefined}
                                                />
                                            );
                                        })}

                                        {territoryPaths.map((territory) => {
                                            const normalizedTerritory = getTerritoryKey(territory.territory);
                                            const matchesFilters = filteredTerritoryKeys.has(normalizedTerritory);
                                            const data = territoryDataMap[normalizedTerritory];
                                            const parkCount = data?.capacidade?.parquesTecnologicos || 0;
                                            if (parkCount <= 0 || !matchesFilters) return null;

                                            const isHovered = hoveredTerritory === territory.territory;
                                            const isSelected = selectedTerritory === territory.territory;
                                            const hasHoverState = Boolean(hoveredTerritory) && filteredTerritoryKeys.has(getTerritoryKey(hoveredTerritory));
                                            const hasSelectionState = Boolean(selectedTerritory) && filteredTerritoryKeys.has(getTerritoryKey(selectedTerritory));
                                            const isRelatedToFocus = isHovered || isSelected;
                                            const isMuted = hasHoverState ? !isRelatedToFocus : hasSelectionState ? !isSelected : false;
                                            const iconSize = Math.min(12 + parkCount * 1.8, 32);

                                            return (
                                                <g key={`park-icon-${territory.territory}`}>
                                                    {(isSelected || isHovered) && (
                                                        <circle
                                                            cx={territory.centroid[0] || 0}
                                                            cy={territory.centroid[1] || 0}
                                                            r={iconSize / 2 + 8}
                                                            fill="rgba(220, 38, 38, 0.10)"
                                                            stroke="rgba(220, 38, 38, 0.28)"
                                                            strokeWidth="1"
                                                            className="animate-pulse"
                                                            pointerEvents="none"
                                                        />
                                                    )}
                                                    <circle
                                                        cx={territory.centroid[0] || 0}
                                                        cy={territory.centroid[1] || 0}
                                                        r={iconSize / 2}
                                                        fill="rgba(220, 38, 38, 0.85)"
                                                        stroke={SVG_COLOR_TOKENS.white}
                                                        strokeWidth="1.5"
                                                        filter={isSelected || isHovered ? 'url(#markerGlow)' : undefined}
                                                        className="transition-all duration-200 ease-out"
                                                        opacity={isMuted ? 0.38 : 0.96}
                                                        style={{ cursor: 'pointer' }}
                                                        onMouseEnter={(e) => onTerritoryMouseMove(e, territory.territory)}
                                                        onMouseMove={(e) => onTerritoryMouseMove(e, territory.territory)}
                                                        onMouseLeave={onMouseLeave}
                                                        onClick={() => handleTerritorySelect(territory.territory)}
                                                    />
                                                    {parkCount > 1 && (
                                                        <text
                                                            x={territory.centroid[0] || 0}
                                                            y={territory.centroid[1] || 0}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                            fill={SVG_COLOR_TOKENS.white}
                                                            fontSize="10"
                                                            fontWeight="700"
                                                            className="pointer-events-none select-none"
                                                        >
                                                            {parkCount}
                                                        </text>
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>

                                {/* Tooltip Flutuante */}
                                {tooltip.visible && hoveredTerritory && hoveredData && (
                                    <div
                                        className="absolute z-30 overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/95 text-xs text-slate-700 shadow-glass pointer-events-none backdrop-blur-md"
                                        style={{ top: tooltip.y, left: tooltip.x, width: 300 }}
                                    >
                                        <div className="h-1.5" style={{ backgroundColor: territoryColorMap[getTerritoryKey(hoveredTerritory)] || SVG_COLOR_TOKENS.secti700 }}></div>
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <h2 className="font-bold text-sm text-slate-900">{hoveredTerritory}</h2>
                                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${hoveredAssistenciaStatus === 'Não existente' ? 'bg-slate-100 text-slate-600' : 'bg-secti-50 text-secti-700'}`}>
                                                    {hoveredAssistenciaStatus}
                                                </span>
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                <div className="rounded-xl border border-surface-border bg-slate-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">CT&amp;I</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-900">{formatCount(hoveredData.capacidade?.entidadesTotal || 0)}</p>
                                                </div>
                                                <div className="rounded-xl border border-surface-border bg-slate-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">IFDM</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-900">{hoveredData.desenvolvimento?.ifdmTi != null ? hoveredData.desenvolvimento.ifdmTi.toFixed(3) : 'N/A'}</p>
                                                </div>
                                                <div className="rounded-xl border border-surface-border bg-slate-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Municípios</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-900">{formatCount(territoryMunicipalityCountMap[getTerritoryKey(hoveredTerritory)] || 0)}</p>
                                                </div>
                                                <div className="rounded-xl border border-surface-border bg-slate-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Parques</p>
                                                    <p className="mt-1 text-sm font-bold text-slate-900">{formatCount(hoveredData.capacidade?.parquesTecnologicos || 0)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 rounded-xl border border-surface-border bg-slate-50 px-3 py-2.5">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Principais cadeias</p>
                                                {hoveredPriorityChains.length > 0 ? (
                                                    <div className="mt-2 space-y-1.5">
                                                        {hoveredPriorityChains.map((cadeia, index) => (
                                                            <p key={`${cadeia.cadeia}-${index}`} className="text-[11px] text-slate-600">
                                                                <strong className="text-slate-900">{cadeia.cadeia}</strong>
                                                                {cadeia.municipioSede ? ` - ${cadeia.municipioSede}` : ''}
                                                            </p>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="mt-2 text-[11px] text-slate-500">Não identificadas.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* LISTA LATERAL (Lado Direito) */}
                        <div className="flex-[1.02] bg-surface-card rounded-[1.75rem] border border-surface-border flex flex-col min-w-[300px] overflow-hidden shadow-glass">
                            <div className="p-5 border-b border-surface-border bg-slate-50">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Visão Geral</p>
                                <div className="mt-2 flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Indicadores do território</h3>
                                        <p className="text-xs text-slate-500 mt-1">{selectedTerritory || 'Selecione um território no mapa'}</p>
                                    </div>
                                    {selectedTerritory && (
                                        <span className="mt-1 inline-flex h-3.5 w-3.5 rounded-full shadow-[0_0_0_6px_rgba(15,23,42,0.05)]" style={{ backgroundColor: selectedTerritoryColor }}></span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-5 flex-1">
                                {selectedTerritory && selectedData ? (
                                    <div className="space-y-3">
                                        {overviewItems.map((item) => (
                                            <div key={item.label} className="relative overflow-hidden rounded-2xl border border-surface-border bg-slate-50 px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full" style={{ backgroundColor: selectedTerritoryColor }}></div>
                                                <div className="pl-3">
                                                    <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{item.label}</span>
                                                    <span className="mt-2 block text-2xl font-extrabold text-slate-900">{item.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : hasActiveFilters ? (
                                    filteredTerritoryCount > 0 ? (
                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-surface-border bg-slate-50 px-4 py-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Resultados do filtro</p>
                                                <h4 className="mt-2 text-lg font-bold text-slate-900">{formatCount(filteredTerritoryCount)} territórios encontrados</h4>
                                                <p className="mt-1 text-xs text-slate-500">Clique em um item para fixar o território no mapa e abrir os indicadores.</p>
                                            </div>

                                            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                                                {filteredTerritorySummaries.map((territory) => {
                                                    const territoryColor = territoryColorMap[territory.normalizedTerritory] || SVG_COLOR_TOKENS.secti700;

                                                    return (
                                                        <button
                                                            key={territory.territory}
                                                            type="button"
                                                            onClick={() => handleTerritorySelect(territory.territory)}
                                                            className="w-full rounded-2xl border border-surface-border bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: territoryColor }}></span>
                                                                        <p className="truncate text-sm font-bold text-slate-900">{territory.territory}</p>
                                                                    </div>
                                                                    <p className="mt-2 text-[11px] text-slate-500">
                                                                        {formatCount(territory.entitiesTotal)} entidades CT&amp;I • {formatCount(territory.municipalityCount)} municípios
                                                                    </p>
                                                                </div>
                                                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${territory.assistenciaStatus === 'Existente' ? 'bg-secti-50 text-secti-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                    {territory.assistenciaStatus}
                                                                </span>
                                                            </div>

                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                                                    Parques: {formatCount(territory.parkCount)}
                                                                </span>
                                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                                                    Capacidade: {formatCount(territory.entitiesTotal)}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center">
                                            <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            <p className="text-sm font-medium text-slate-600">Nenhum território corresponde.</p>
                                            <p className="text-xs text-slate-400 mt-2 max-w-[230px]">Revise os critérios aplicados ou limpe os filtros para restaurar a visualização.</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center">
                                        <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                        <p className="text-sm font-medium text-slate-600">Nenhum território selecionado.</p>
                                        <p className="text-xs text-slate-400 mt-2 max-w-[220px]">Use o mapa para abrir os indicadores detalhados e manter o foco no território desejado.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </>
            )}
            </div>
        </div>
    );
};

export default ConectaGovDashboard;