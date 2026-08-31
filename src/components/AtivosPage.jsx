import React, { useContext, useState, useMemo, useRef } from 'react';
import {
    Database,
    Building2,
    Layers,
    MapPin,
    Search,
    TrendingUp,
    Sparkles,
    ExternalLink,
    Filter,
    GraduationCap,
    Microscope,
    Rocket,
    Cpu,
    Network,
    Wifi,
    X
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import { municipiosDB } from '../data/municipiosDB';
import { getDynamicAssetTypeConfig } from '../constants/assetTypes';
import SideMap from './maps/SideMap';

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
        loadingStats = false
    } = useContext(DataContext);

    const [selectedTerritory, setSelectedTerritory] = useState(null);
    const [focusedAsset, setFocusedAsset] = useState(null);
    const [selectedAssetId, setSelectedAssetId] = useState(null);
    const [selectedTipo, setSelectedTipo] = useState('todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo' | 'categorias' | 'ranking'
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [sidebarSearch, setSidebarSearch] = useState('');

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
            if (tid && a.id_territorio && String(a.id_territorio) === tid) return true;
            if (tNorm && a.normTerritorio && (
                a.normTerritorio === tNorm ||
                a.normTerritorio.includes(tNorm) ||
                tNorm.includes(a.normTerritorio)
            )) return true;
            return false;
        });
    }, [ativosProcessados, selectedTerritory]);

    // 2. Filtragem Geral (Tipo, Busca e Território)
    const filteredAtivosList = useMemo(() => {
        let list = territoryAtivos;

        if (selectedTipo !== 'todos') {
            list = list.filter(a => a.tipo === selectedTipo || a.shortTipo === selectedTipo);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(a =>
                (a.nome && a.nome.toLowerCase().includes(q)) ||
                (a.sigla && a.sigla.toLowerCase().includes(q)) ||
                (a.tipo && a.tipo.toLowerCase().includes(q)) ||
                (a.municipio && a.municipio.toLowerCase().includes(q)) ||
                (a.territorio && a.territorio.toLowerCase().includes(q))
            );
        }

        return list;
    }, [territoryAtivos, selectedTipo, searchQuery]);

    const compactAtivosList = useMemo(() => {
        if (!sidebarSearch.trim()) return filteredAtivosList;
        const q = sidebarSearch.toLowerCase().trim();
        return filteredAtivosList.filter(a =>
            (a.nome && a.nome.toLowerCase().includes(q)) ||
            (a.sigla && a.sigla.toLowerCase().includes(q)) ||
            (a.tipo && a.tipo.toLowerCase().includes(q)) ||
            (a.municipio && a.municipio.toLowerCase().includes(q))
        );
    }, [filteredAtivosList, sidebarSearch]);

    // 3. Distribuição por Tipos / Categorias de Ativos (com dados empilhados de RNP)
    const categoryStats = useMemo(() => {
        if (!territoryAtivos || territoryAtivos.length === 0) return [];
        const counts = {};
        const total = territoryAtivos.length;

        territoryAtivos.forEach(a => {
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
    }, [territoryAtivos]);

    // 4A. Ranking Territorial de Ativos (com dados empilhados de RNP)
    const territoryRanking = useMemo(() => {
        if (!ativosProcessados || ativosProcessados.length === 0) return [];
        const counts = {};

        ativosProcessados.forEach(a => {
            const tid = a.id_territorio ? String(a.id_territorio) : null;
            const tName = (a.territorio || 'Outros').replace(/^Território de Identidade\s+/i, '').trim();
            const key = tid || normalizeName(tName);

            if (!counts[key]) {
                counts[key] = { id: tid, name: tName, count: 0, rnpCount: 0 };
            }
            counts[key].count += 1;
            if (a.rnp) {
                counts[key].rnpCount += 1;
            }
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
                    percentBar: Math.min(100, (t.count / maxCount) * 100),
                    rnpPercent,
                    outrosCount,
                    outrosPercent
                };
            });
    }, [ativosProcessados]);

    // 4B. Ranking de Municípios do Território (com dados empilhados de RNP)
    const municipalityRanking = useMemo(() => {
        if (!selectedTerritory || !territoryAtivos || territoryAtivos.length === 0) return [];
        const counts = {};

        territoryAtivos.forEach(a => {
            const mun = a.municipio || 'Bahia';
            if (!counts[mun]) {
                counts[mun] = { count: 0, rnpCount: 0 };
            }
            counts[mun].count += 1;
            if (a.rnp) {
                counts[mun].rnpCount += 1;
            }
        });

        const maxCount = Math.max(...Object.values(counts).map(c => c.count), 1);

        return Object.entries(counts)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([name, data], idx) => {
                const outrosCount = data.count - data.rnpCount;
                const rnpPercent = data.count > 0 ? (data.rnpCount / data.count) * 100 : 0;
                const outrosPercent = data.count > 0 ? (outrosCount / data.count) * 100 : 0;
                return {
                    name,
                    count: data.count,
                    rnpCount: data.rnpCount,
                    outrosCount,
                    rnpPercent,
                    outrosPercent,
                    rank: idx + 1,
                    percentBar: Math.min(100, (data.count / maxCount) * 100)
                };
            });
    }, [selectedTerritory, territoryAtivos]);

    // 5. Contagens Globais e por Grupo (Scoped para a região selecionada)
    const totalEnsinoPesquisa = useMemo(() => {
        return territoryAtivos.filter(a => {
            const t = (a.tipo || '').toLowerCase();
            return t.includes('universidade') || t.includes('faculdade') || t.includes('instituto federal') || t.includes('ict') || t.includes('pesquisa');
        }).length;
    }, [territoryAtivos]);

    const totalRnp = useMemo(() => {
        return territoryAtivos.filter(a => a.rnp).length;
    }, [territoryAtivos]);

    const territoriosComAtivosCount = useMemo(() => {
        if (territoriosData && territoriosData.length > 0) {
            return territoriosData.filter(t => Number(t.ativos_cti || 0) > 0).length;
        }
        return territoryRanking.length;
    }, [territoriosData, territoryRanking]);

    // 7. 5 Indicadores Estratégicos (KPIs com adaptação contextual à região)
    const kpis = [
        {
            label: selectedTerritory ? `Ativos em ${territoryName}` : 'Total de Ativos CT&I',
            value: loadingStats ? '...' : territoryAtivos.length,
            icon: Database
        },
        {
            label: 'Ensino & Pesquisa (ICTs)',
            value: loadingStats ? '...' : totalEnsinoPesquisa,
            icon: GraduationCap
        },
        {
            label: 'Ativos com RNP',
            value: loadingStats ? '...' : totalRnp,
            icon: Network
        },
        {
            label: selectedTerritory ? 'Municípios com Ativos' : 'Territórios Cobertos',
            value: loadingStats ? '...' : (selectedTerritory ? `${municipalityRanking.length} munic.` : `${territoriosComAtivosCount} / ${territoriosData.length || 27}`),
            icon: MapPin
        },
        {
            label: categoryStats[0] ? categoryStats[0].shortName : 'Principal Tipo',
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
                            Módulo de Ativos de CT&I
                        </h1>
                        <span className="bg-primary-600/10 text-primary-700 text-[11px] font-medium uppercase px-2.5 py-1 rounded-full border border-primary-600/20 flex items-center gap-1">
                            <Sparkles size={12} className="text-primary-700" />
                            Ecossistema de Inovação da Bahia
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5 font-medium">
                        Explore universidades, ICTs, parques tecnológicos, hubs e centros de pesquisa distribuídos pelo estado
                    </p>
                </div>
            </div>

            {/* GRID DE KPIS */}
            <div className="w-full relative z-10 shrink-0">
                <div className="grid grid-cols-5 gap-3.5 items-stretch w-full">
                    {kpis.map((kpi, index) => (
                        <div
                            key={index}
                            className="h-[98px] bg-surface rounded-xl p-4 flex flex-col justify-between border border-border shadow-sm hover:shadow-md transition-shadow duration-300 cursor-default"
                        >
                            {/* LINHA SUPERIOR: ÍCONE DISCRETO + TÍTULO */}
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

                            {/* LINHA INFERIOR: NÚMERO PRINCIPAL CENTRALIZADO */}
                            <div className="flex items-center justify-center w-full min-w-0 pt-1">
                                <span className="text-[30px] font-medium text-text-primary tracking-tight leading-none text-center">
                                    {kpi.value}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* GRID PRINCIPAL: MAPA (calc(40% - 12px) ou Expandido) + DASHBOARD / KPIS VERTICAIS */}
            <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]">

                {/* LADO ESQUERDO: MAPA DE PONTOS DE ATIVOS */}
                <div
                    style={{ width: isMapExpanded ? 'calc(100% - 320px)' : 'calc(40% - 12px)' }}
                    className="shrink-0 bg-surface rounded-xl border border-border shadow-sm relative overflow-hidden flex flex-col min-h-[460px] transition-[width] duration-300"
                >
                    <SideMap
                        mode="ativos"
                        processedAtivos={ativosProcessados}
                        focusedAsset={focusedAsset}
                        selectedTerritory={selectedTerritory}
                        onSelectTerritory={setSelectedTerritory}
                        onAssetClick={handleSelectFromMap}
                        isExpanded={isMapExpanded}
                        onToggleExpand={() => setIsMapExpanded(prev => !prev)}
                    />
                </div>

                {/* MODO EXPANDIDO: LISTA COMPACTA E OTIMIZADA AO LADO DO MAPA */}
                {isMapExpanded ? (
                    <div className="w-[305px] shrink-0 h-[460px] lg:h-full bg-surface rounded-xl border border-transparent shadow-card-soft p-3.5 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* CABEÇALHO DA LISTA COMPACTA */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/70 shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[12px] font-semibold text-text-primary truncate">
                                    Ativos de CT&I
                                </span>
                                <span className="bg-primary-600/10 text-primary-700 text-[9.5px] font-medium px-2 py-0.5 rounded-full shrink-0">
                                    {compactAtivosList.length}
                                </span>
                            </div>
                            {selectedAssetId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedAssetId(null);
                                        setFocusedAsset(null);
                                    }}
                                    className="text-[9.5px] font-medium text-text-secondary hover:text-red-600 bg-surface-soft hover:bg-danger-50 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                                >
                                    <span>Limpar</span>
                                    <X size={10} />
                                </button>
                            )}
                        </div>

                        {/* BUSCA COMPACTA */}
                        <div className="relative my-2 shrink-0">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={sidebarSearch}
                                onChange={(e) => setSidebarSearch(e.target.value)}
                                placeholder="Filtrar ativo, tipo ou cidade..."
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

                        {/* LISTA SCROLLÁVEL COMPACTA */}
                        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0 min-h-0">
                            {compactAtivosList.length > 0 ? (
                                compactAtivosList.map((ativo) => {
                                    const IconComp = ativo.icone || Database;
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
                                            className={`p-2 flex items-center justify-between gap-2 transition-colors duration-200 group cursor-pointer border-b border-neutral-200/50 w-full ${isSelected
                                                    ? 'bg-primary-50/50'
                                                    : 'bg-transparent hover:bg-surface-soft'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform ${isSelected ? 'scale-105 shadow-2xs' : ''
                                                        }`}
                                                    style={{ backgroundColor: `${ativo.corHex}18`, color: ativo.corHex }}
                                                >
                                                    <IconComp size={12} />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <h5 className={`text-[11px] font-bold leading-tight truncate transition-colors ${isSelected ? 'text-primary-800' : 'text-text-primary group-hover:text-primary-700'
                                                        }`}>
                                                        {ativo.nome}
                                                    </h5>
                                                    <span className="text-[9.5px] text-text-secondary truncate leading-tight">
                                                        {ativo.shortTipo || ativo.tipo} • <strong className="font-semibold text-text-secondary">{ativo.municipio}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            {ativo.sigla ? (
                                                <span
                                                    className="text-[8px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap"
                                                    style={{ backgroundColor: `${ativo.corHex}15`, color: ativo.corHex }}
                                                >
                                                    {ativo.sigla}
                                                </span>
                                            ) : null}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-text-muted">
                                    <p className="text-[11px] font-medium">Nenhum ativo encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* LADO DIREITO: DASHBOARD ANALÍTICO & CATÁLOGO DE ATIVOS */
                    <div className="flex-1 flex flex-col gap-4 h-full min-h-0 animate-in fade-in duration-200">

                        {/* BARRA SUPERIOR DE NAVEGAÇÃO / ABAS E BUSCA */}
                        <div className="bg-surface rounded-xl p-2.5 border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">

                            {/* ABAS */}
                            <div className="flex items-center bg-surface-soft p-1 rounded-xl border border-border gap-1 w-full sm:w-auto overflow-x-auto">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('catalogo')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'catalogo'
                                        ? 'bg-primary-900 text-white shadow-xs'
                                        : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <Database size={13} />
                                    Catálogo ({filteredAtivosList.length})
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('categorias')}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'categorias'
                                        ? 'bg-primary-900 text-white shadow-xs'
                                        : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    <Filter size={13} />
                                    Categorias ({categoryStats.length})
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
                            </div>

                            {/* INPUT DE BUSCA */}
                            <div className="relative w-full sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar ativo, tipo, cidade ou sigla..."
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

                        {/* CONTEÚDO DA ABA SELECIONADA */}
                        <div className="flex-1 bg-surface rounded-xl border border-transparent shadow-card-soft p-5 flex flex-col min-h-0 overflow-hidden">

                            {/* ABA 1: CATÁLOGO DE ATIVOS */}
                            {activeTab === 'catalogo' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between mb-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-[13px] font-semibold text-text-primary">
                                                {selectedTerritory ? `Ativos de CT&I em ${territoryName}` : 'Catálogo de Ativos do Estado'}
                                            </h3>
                                            <span className="bg-primary-600/10 text-primary-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
                                                {filteredAtivosList.length} ativos
                                            </span>
                                        </div>

                                        {/* CHIPS DE FILTRAGEM RÁPIDA */}
                                        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedTipo('todos')}
                                                className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${selectedTipo === 'todos'
                                                    ? 'bg-primary-900 text-white'
                                                    : 'bg-surface-soft text-text-secondary hover:bg-border'
                                                    }`}
                                            >
                                                Todos
                                            </button>
                                            {categoryStats.slice(0, 3).map((cat) => (
                                                <button
                                                    key={cat.name}
                                                    type="button"
                                                    onClick={() => setSelectedTipo(selectedTipo === cat.name ? 'todos' : cat.name)}
                                                    className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${selectedTipo === cat.name
                                                        ? 'text-white'
                                                        : 'hover:opacity-80'
                                                        }`}
                                                    style={{
                                                        backgroundColor: selectedTipo === cat.name ? cat.corHex : `${cat.corHex}15`,
                                                        color: selectedTipo === cat.name ? '#ffffff' : cat.corHex
                                                    }}
                                                >
                                                    {cat.shortName}
                                                </button>
                                            ))}
                                            {selectedTerritory && (
                                                <span className="text-[10.5px] font-medium text-text-primary bg-primary-200/40 px-2.5 py-1 rounded-full flex items-center gap-1 ml-1 whitespace-nowrap">
                                                    <MapPin size={11} className="text-primary-700" />
                                                    {territoryName}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* LISTAGEM SCROLLÁVEL */}
                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0 min-h-0">
                                        {filteredAtivosList.length > 0 ? (
                                            filteredAtivosList.map((ativo, idx) => {
                                                const IconComponent = ativo.icone || Database;
                                                const isSelected = selectedAssetId === ativo.id;

                                                return (
                                                    <div
                                                        key={ativo.id || idx}
                                                        ref={(el) => {
                                                            if (el && ativo.id) itemRefs.current[ativo.id] = el;
                                                        }}
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
                                                        className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors duration-200 group cursor-pointer border-b border-neutral-200/50 ${isSelected
                                                                ? 'bg-primary-50/50'
                                                                : `bg-transparent hover:bg-surface-soft ${ativo.rnp ? 'shadow-[inset_3px_0_0_var(--color-info-500)]' : ''
                                                                }`
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div
                                                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5  transition-transform"
                                                                style={{ backgroundColor: `${ativo.corHex || '#3B82F6'}15`, color: ativo.corHex || '#3B82F6' }}
                                                            >
                                                                <IconComponent size={16} />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-[12px] font-semibold text-text-primary group-hover:text-blue-600 transition-colors leading-tight truncate">
                                                                        {ativo.nome}
                                                                    </h4>
                                                                    {ativo.sigla && (
                                                                        <span className="text-[9px] font-medium px-1.5 py-0.2 bg-border text-text-primary rounded-md shrink-0">
                                                                            {ativo.sigla}
                                                                        </span>
                                                                    )}
                                                                    {ativo.rnp && (
                                                                        <span
                                                                            className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 bg-primary-700/15 text-primary-800 border border-info-500/30 rounded-md shrink-0 shadow-2xs"
                                                                            title="Ponto de Presença / Conexão RNP"
                                                                        >
                                                                            <Network size={10} className="text-info-500 shrink-0" />
                                                                            <span>RNP</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-text-secondary mt-0.5 font-medium">
                                                                    <span
                                                                        className="font-medium px-1.5 py-0.2 rounded-md"
                                                                        style={{ backgroundColor: `${ativo.corHex || '#3B82F6'}12`, color: ativo.corHex || '#3B82F6' }}
                                                                    >
                                                                        {ativo.shortTipo || ativo.tipo}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{ativo.municipio}</span>
                                                                    <span>•</span>
                                                                    <span className="text-text-secondary">{ativo.territorio}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                            {ativo.urlReferencia && (
                                                                <a
                                                                    href={ativo.urlReferencia}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary-600/10 hover:bg-primary-600 text-primary-700 hover:text-white transition-all text-[11px] font-medium shrink-0"
                                                                    title="Acessar Página / Informações"
                                                                >
                                                                    <span>Acessar</span>
                                                                    <ExternalLink size={11} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                <Database size={32} className="mb-2 opacity-40 text-text-secondary" />
                                                <p className="text-[12px] font-medium text-text-primary">Nenhum ativo encontrado</p>
                                                <p className="text-[10px] mt-1 text-text-secondary">Tente ajustar o termo de busca ou filtros de tipo.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ABA 2: TIPOS & CATEGORIAS (BARRAS EMPILHADAS COM RNP) */}
                            {activeTab === 'categorias' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="mb-3 shrink-0 flex items-center justify-between flex-wrap gap-2">
                                        <div>
                                            <h3 className="text-[13px] font-semibold text-text-primary">
                                                {selectedTerritory
                                                    ? `Categorias de Ativos em ${territoryName}`
                                                    : 'Classificação dos Ativos de CT&I do Estado'
                                                }
                                            </h3>
                                            <p className="text-[10.5px] text-text-secondary font-medium">
                                                Distribuição quantitativa e proporção com conexão à rede RNP por tipologia oficial
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            {/* LEGENDA BARRAS EMPILHADAS */}
                                            <div className="flex items-center gap-2.5 bg-surface-soft border border-border px-2.5 py-1 rounded-full text-[9.5px] font-medium shadow-2xs">
                                                <div className="flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-primary-700"></span>
                                                    <span className="text-primary-800">Com RNP</span>
                                                </div>
                                                <span className="text-gray-300">|</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-primary-300"></span>
                                                    <span className="text-primary-700">Demais Ativos</span>
                                                </div>
                                            </div>

                                            {selectedTerritory && (
                                                <span className="text-[11px] font-medium text-text-primary bg-primary-200/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                                                    <MapPin size={11} className="text-primary-500" />
                                                    {territoryName}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0">
                                        {categoryStats.length > 0 ? (
                                            categoryStats.map((cat) => {
                                                const isSelected = selectedTipo === cat.name;
                                                const IconComponent = cat.icone || Database;

                                                return (
                                                    <div
                                                        key={cat.name}
                                                        onClick={() => setSelectedTipo(isSelected ? 'todos' : cat.name)}
                                                        className={`rounded-xl p-3.5 border transition-all cursor-pointer ${isSelected
                                                            ? 'bg-surface border-primary-500 shadow-md ring-2 ring-primary-500/20'
                                                            : 'bg-surface-soft border-transparent hover:bg-surface hover:border-primary-200 shadow-2xs'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div
                                                                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                                                                    style={{ backgroundColor: `${cat.corHex}20`, color: cat.corHex }}
                                                                >
                                                                    <IconComponent size={12} />
                                                                </div>
                                                                <span className="text-[12px] font-semibold text-text-primary truncate">
                                                                    {cat.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[12px] font-semibold text-text-primary w-[64px] text-right inline-block">
                                                                    {cat.count} {cat.count === 1 ? 'ativo' : 'ativos'}
                                                                </span>
                                                                <span
                                                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-300/10 text-primary-700"
                                                                    title={`${cat.percent}% do total de ativos`}
                                                                >
                                                                    {cat.percent}%
                                                                </span>
                                                                {cat.rnpCount > 0 && (
                                                                    <span
                                                                        className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary-700/15 text-primary-800 border border-primary-700/20 shadow-2xs w-[92px] text-center inline-block shrink-0"
                                                                        title={`${cat.rnpCount} de ${cat.count} ativo(s) com conexão RNP (${cat.rnpPercent.toFixed(1)}%)`}
                                                                    >
                                                                        {cat.rnpCount} RNP ({cat.rnpPercent % 1 === 0 ? cat.rnpPercent.toFixed(0) : cat.rnpPercent.toFixed(1)}%)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* BARRA DE PROGRESSO EMPILHADA */}
                                                        <div className="w-full h-2 rounded-full bg-border overflow-hidden relative">
                                                            <div
                                                                className="h-full flex rounded-lg overflow-hidden transition-all duration-500"
                                                                style={{ width: `${cat.percent}%` }}
                                                            >
                                                                {cat.rnpCount > 0 && (
                                                                    <div
                                                                        className="h-full bg-primary-700 transition-all duration-300"
                                                                        style={{ width: `${cat.rnpPercent}%` }}
                                                                        title={`${cat.name}: ${cat.rnpCount} com RNP (${cat.rnpPercent.toFixed(0)}%)`}
                                                                    ></div>
                                                                )}
                                                                {cat.outrosCount > 0 && (
                                                                    <div
                                                                        className="h-full bg-primary-300 transition-all duration-300"
                                                                        style={{ width: `${cat.outrosPercent}%` }}
                                                                        title={`${cat.name}: ${cat.outrosCount} demais (${cat.outrosPercent.toFixed(0)}%)`}
                                                                    ></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                <Filter size={28} className="mb-2 opacity-40 text-text-secondary" />
                                                <p className="text-[12px] font-medium text-text-primary">Nenhum ativo registrado neste território</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ABA 3: RANKING TERRITORIAL OU MUNICIPAL (BARRAS EMPILHADAS COM RNP) */}
                            {activeTab === 'ranking' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    <div className="mb-3 shrink-0 flex items-center justify-between flex-wrap gap-2">
                                        <div>
                                            <h3 className="text-[13px] font-semibold text-text-primary">
                                                {selectedTerritory
                                                    ? `Ranking de Municípios · ${territoryName}`
                                                    : 'Ranking Territorial de Ativos de CT&I'
                                                }
                                            </h3>
                                            <p className="text-[10.5px] text-text-secondary font-medium">
                                                {selectedTerritory
                                                    ? 'Distribuição de ativos e proporção com conexão à rede RNP nos municípios'
                                                    : 'Densidade de infraestrutura e proporção com conexão RNP nos 27 Territórios'
                                                }
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            {/* LEGENDA BARRAS EMPILHADAS */}
                                            <div className="flex items-center gap-2.5 bg-surface-soft border border-border px-2.5 py-1 rounded-full text-[9.5px] font-medium shadow-2xs">
                                                <div className="flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-primary-700"></span>
                                                    <span className="text-primary-800">Com RNP</span>
                                                </div>
                                                <span className="text-gray-300">|</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-primary-300"></span>
                                                    <span className="text-primary-700">Demais Ativos</span>
                                                </div>
                                            </div>

                                            {selectedTerritory ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTerritory(null)}
                                                    className="text-[10px] font-medium text-primary-700 hover:text-[#0369A1] hover:underline bg-primary-200/50 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer"
                                                >
                                                    ← Ver Todos os Territórios
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-semibold text-text-secondary bg-surface-soft px-2.5 py-1 rounded-full shrink-0">
                                                    {territoryRanking.length} territórios
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-0 min-h-0">
                                        {selectedTerritory ? (
                                            municipalityRanking.length > 0 ? (
                                                municipalityRanking.map((m) => (
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
                                                        className="p-2.5 flex items-center justify-between gap-3 transition-colors duration-200 group cursor-pointer border-b border-neutral-200/50 bg-transparent hover:bg-surface-soft"
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

                                                                {/* BARRA EMPILHADA */}
                                                                <div className="w-full h-2 rounded-full bg-border overflow-hidden mt-1.5 relative">
                                                                    <div
                                                                        className="h-full flex rounded-lg overflow-hidden transition-all duration-500"
                                                                        style={{ width: `${m.percentBar}%` }}
                                                                    >
                                                                        {m.rnpCount > 0 && (
                                                                            <div
                                                                                className="h-full bg-primary-700 transition-all duration-300"
                                                                                style={{ width: `${m.rnpPercent}%` }}
                                                                                title={`${m.name}: ${m.rnpCount} ativo(s) com RNP (${m.rnpPercent.toFixed(0)}%)`}
                                                                            ></div>
                                                                        )}
                                                                        {m.outrosCount > 0 && (
                                                                            <div
                                                                                className="h-full bg-primary-300 transition-all duration-300"
                                                                                style={{ width: `${m.outrosPercent}%` }}
                                                                                title={`${m.name}: ${m.outrosCount} demais ativo(s) (${m.outrosPercent.toFixed(0)}%)`}
                                                                            ></div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span
                                                                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary-300 text-white shadow-2xs w-[68px] text-center inline-block shrink-0"
                                                                title={`Total: ${m.count} ativo(s)`}
                                                            >
                                                                {m.count} {m.count === 1 ? 'ativo' : 'ativos'}
                                                            </span>
                                                            {m.rnpCount > 0 && (
                                                                <span
                                                                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary-700/15 text-primary-800 border border-primary-700/20 shadow-2xs w-[92px] text-center inline-block shrink-0"
                                                                    title={`${m.rnpCount} de ${m.count} ativo(s) com conexão RNP (${m.rnpPercent.toFixed(1)}%)`}
                                                                >
                                                                    {m.rnpCount} RNP ({m.rnpPercent % 1 === 0 ? m.rnpPercent.toFixed(0) : m.rnpPercent.toFixed(1)}%)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                                    <MapPin size={28} className="mb-2 opacity-40 text-text-secondary" />
                                                    <p className="text-[12px] font-medium text-text-primary">Nenhum ativo registrado neste território</p>
                                                </div>
                                            )
                                        ) : (
                                            territoryRanking.map((t) => (
                                                <div
                                                    key={t.id || t.name}
                                                    onClick={() => {
                                                        const found = territoriosData.find(x => String(x.id_territorio) === String(t.id) || normalizeName(x.territorio) === normalizeName(t.name));
                                                        setSelectedTerritory(found || { id_territorio: t.id, nome_territorio: t.name });
                                                    }}
                                                    className="p-2.5 flex items-center justify-between gap-3 transition-colors duration-200 group cursor-pointer border-b border-neutral-200/50 bg-transparent hover:bg-surface-soft"
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

                                                            {/* BARRA EMPILHADA */}
                                                            <div className="w-full h-2 rounded-full bg-border overflow-hidden mt-1.5 relative">
                                                                <div
                                                                    className="h-full flex rounded-lg overflow-hidden transition-all duration-500"
                                                                    style={{ width: `${t.percentBar}%` }}
                                                                >
                                                                    {t.rnpCount > 0 && (
                                                                        <div
                                                                            className="h-full bg-primary-700 transition-all duration-300"
                                                                            style={{ width: `${t.rnpPercent}%` }}
                                                                            title={`${t.name}: ${t.rnpCount} ativo(s) com RNP (${t.rnpPercent.toFixed(0)}%)`}
                                                                        ></div>
                                                                    )}
                                                                    {t.outrosCount > 0 && (
                                                                        <div
                                                                            className="h-full bg-primary-300 transition-all duration-300"
                                                                            style={{ width: `${t.outrosPercent}%` }}
                                                                            title={`${t.name}: ${t.outrosCount} demais ativo(s) (${t.outrosPercent.toFixed(0)}%)`}
                                                                        ></div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span
                                                            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary-300 text-white shadow-2xs w-[68px] text-center inline-block shrink-0"
                                                            title={`Total: ${t.count} ativo(s)`}
                                                        >
                                                            {t.count} {t.count === 1 ? 'ativo' : 'ativos'}
                                                        </span>
                                                        {t.rnpCount > 0 && (
                                                            <span
                                                                className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary-700/15 text-primary-800 border border-primary-700/20 shadow-2xs w-[92px] text-center inline-block shrink-0"
                                                                title={`${t.rnpCount} de ${t.count} ativo(s) com conexão RNP (${t.rnpPercent.toFixed(1)}%)`}
                                                            >
                                                                {t.rnpCount} RNP ({t.rnpPercent % 1 === 0 ? t.rnpPercent.toFixed(0) : t.rnpPercent.toFixed(1)}%)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
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