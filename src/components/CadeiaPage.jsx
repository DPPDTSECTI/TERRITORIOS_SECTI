import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import {
    GitPullRequest,
    Award,
    MapPin,
    Sparkles,
    Wheat,
    Filter,
    TrendingUp,
    ExternalLink,
    Layers,
    Compass,
    CheckCircle2,
    Building2,
    X,
    Search
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import { municipiosDB } from '../data/municipiosDB';
import SideMap from './maps/SideMap';
import CardLista from './graph/CardLista';

const SEGMENT_PALETTE = [
    '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
    '#A855F7', '#E11D48', '#0EA5E9', '#D97706'
];

function normalizeName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const MUN_LOOKUP = (() => {
    const byId = {};
    const byName = {};
    municipiosDB.forEach((row) => {
        byId[row.id_municipio] = row;
        byName[normalizeName(row.nome_municipio)] = row;
    });
    return { byId, byName };
})();

function findMunicipioCoords(nome) {
    if (!nome) return null;
    const raw = String(nome).trim();
    const clean = normalizeName(raw);

    if (MUNICIPIOS_COORDS[raw]) return MUNICIPIOS_COORDS[raw];
    if (MUNICIPIOS_COORDS[clean]) return MUNICIPIOS_COORDS[clean];
    if (MUNICIPIOS_COORDS[raw.toLowerCase()]) return MUNICIPIOS_COORDS[raw.toLowerCase()];

    const aliases = {
        'petrolina': [-9.3989, -40.5008],
        'sao francisco': [-9.427268, -40.505742],
        'lem': [-12.087454, -45.796046],
        'saj': [-12.968813, -39.257965]
    };

    if (aliases[clean]) return aliases[clean];

    const lookup = MUN_LOOKUP.byName[clean];
    if (lookup && MUNICIPIOS_COORDS[lookup.nome_municipio]) {
        return MUNICIPIOS_COORDS[lookup.nome_municipio];
    }

    for (const key of Object.keys(MUNICIPIOS_COORDS)) {
        if (normalizeName(key).includes(clean) || clean.includes(normalizeName(key))) {
            return MUNICIPIOS_COORDS[key];
        }
    }

    return null;
}

const getTipoCadeiaConfig = (nomeTipo) => {
    const str = String(nomeTipo || '').toLowerCase();
    if (str.includes('potencial')) {
        return {
            corHex: '#F59E0B',
            bgBadge: 'bg-warning-600/15 text-[#D97706]',
            icone: Compass,
            label: 'IG Potencial',
            iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`
        };
    }
    if (str.includes('ig') || str.includes('indica')) {
        return {
            corHex: '#10B981',
            bgBadge: 'bg-success-500/15 text-success-700',
            icone: Award,
            label: 'IG',
            iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`
        };
    }
    return {
        corHex: '#2563EB',
        bgBadge: 'bg-primary-600/15 text-primary-600',
        icone: Wheat,
        label: 'APL',
        iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22 12 12"/><path d="M7 17a5 5 0 0 1 5-5"/><path d="M12 12a5 5 0 0 1 5-5"/><path d="M17 7a5 5 0 0 1 5-5"/></svg>`
    };
};

export default function CadeiaPage() {
    const {
        listaCadeias = [],
        distribuicaoCadeias = [],
        territoriosData = [],
        loadingStats = false
    } = useContext(DataContext);

    const [selectedTerritory, setSelectedTerritory] = useState(null);
    const [focusedAsset, setFocusedAsset] = useState(null);
    const [selectedSegmento, setSelectedSegmento] = useState(null);
    const [selectedTipo, setSelectedTipo] = useState('todos');
    const [activeTab, setActiveTab] = useState('catalogo');
    const [selectedCadeia, setSelectedCadeia] = useState(null);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [sidebarSearch, setSidebarSearch] = useState('');

    const itemRefs = useRef({});
    const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

    // Sincronização e reset de estados mutuamente exclusivos
    const handleSelectTerritory = (terr) => {
        setSelectedTerritory(terr);
        setSelectedCadeia(null);
        setFocusedAsset(null);
    };

    const handleSelectFromMap = (cadeia) => {
        if (!cadeia || (selectedCadeia && (selectedCadeia.id_cadeia === cadeia.id_cadeia || selectedCadeia.id === cadeia.id))) {
            setSelectedCadeia(null);
            setFocusedAsset(null);
            return;
        }
        setSelectedCadeia(cadeia);
        if (cadeia?.lat && cadeia?.lng) {
            setFocusedAsset([cadeia.lat, cadeia.lng]);
        }
        setActiveTab('catalogo');

        setTimeout(() => {
            if (cadeia?.id_cadeia && itemRefs.current[cadeia.id_cadeia]) {
                itemRefs.current[cadeia.id_cadeia].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }, 150);
    };

    // 1. Enriquecimento de Dados
    const enrichedCadeias = useMemo(() => {
        const fontesMap = new Map();
        const coordsMap = new Map();

        (listaCadeias || []).forEach(lc => {
            const id = Number(lc.id_cadeia);
            if (id && lc.fonte) fontesMap.set(id, lc.fonte);
            if (id && (lc.latitude || lc.lat) && (lc.longitude || lc.lng)) {
                coordsMap.set(id, [Number(lc.latitude || lc.lat), Number(lc.longitude || lc.lng)]);
            }
        });

        const sourceData = (distribuicaoCadeias && distribuicaoCadeias.length > 0) ? distribuicaoCadeias : listaCadeias;
        if (!sourceData || sourceData.length === 0) return [];

        const mapCadeias = new Map();

        sourceData.forEach((row, idx) => {
            const idCadeia = Number(row.id_cadeia || idx + 1);
            const tipoNome = row.nome_tipo || row.tipo || 'APL';
            const configTipo = getTipoCadeiaConfig(tipoNome);
            const entidadeStr = String(row.entidade || '').toLowerCase();

            let overrideSede = null;
            let overrideTerritorioId = null;
            let overrideTerritorioNome = null;

            if (entidadeStr.includes('sao francisco') || entidadeStr.includes('uvas de mesa') || entidadeStr.includes('vinho do vale')) {
                overrideSede = 'Juazeiro';
                overrideTerritorioId = 21;
                overrideTerritorioNome = 'Sertão do São Francisco';
            } else if (entidadeStr.includes('luis eduardo') || entidadeStr.includes('oeste da bahia')) {
                overrideSede = 'Luís Eduardo Magalhães';
                overrideTerritorioId = 4;
                overrideTerritorioNome = 'Bacia do Rio Grande';
            } else if (entidadeStr.includes('cachaça de abaíra') || entidadeStr.includes('abaira')) {
                overrideSede = 'Abaíra';
                overrideTerritorioId = 11;
                overrideTerritorioNome = 'Chapada Diamantina';
            } else if (entidadeStr.includes('cacau do sul') || entidadeStr.includes('sul da bahia')) {
                overrideSede = 'Ilhéus';
                overrideTerritorioId = 6;
                overrideTerritorioNome = 'Litoral Sul';
            }

            let rawMunSede = overrideSede || row.sede || row.municipio_sede || '';
            if ((!rawMunSede || rawMunSede.toLowerCase() === 'bahia') && row.nome_municipio && row.nome_municipio.toLowerCase() !== 'bahia') {
                rawMunSede = row.nome_municipio;
            }

            const lookupSede = (row.id_sede && MUN_LOOKUP.byId[row.id_sede]) ||
                (rawMunSede && MUN_LOOKUP.byName[normalizeName(rawMunSede)]);

            const nomeSedeFinal = lookupSede ? lookupSede.nome_municipio : (rawMunSede || 'Juazeiro');
            const idTerrSede = overrideTerritorioId || (lookupSede ? lookupSede.id_territorio : (row.id_territorio || null));
            const nomeTerrSede = overrideTerritorioNome || (lookupSede ? lookupSede.nome_territorio : (row.nome_territorio || 'Não identificado'));

            if (!mapCadeias.has(idCadeia)) {
                let lat = row.latitude ? Number(row.latitude) : (row.lat ? Number(row.lat) : null);
                let lng = row.longitude ? Number(row.longitude) : (row.lng ? Number(row.lng) : null);

                if ((!lat || !lng) && coordsMap.has(idCadeia)) {
                    const [cLat, cLng] = coordsMap.get(idCadeia);
                    lat = cLat;
                    lng = cLng;
                }

                if (!lat || !lng) {
                    const huntedCoords = findMunicipioCoords(nomeSedeFinal) ||
                        (overrideSede ? findMunicipioCoords(overrideSede) : null) ||
                        [-9.4167, -40.5000];

                    lat = huntedCoords[0];
                    lng = huntedCoords[1];

                    const offsetAngle = (idCadeia * 137.5 * Math.PI) / 180;
                    const offsetRadius = 0.008 + ((idCadeia % 5) * 0.003);
                    lat += Math.cos(offsetAngle) * offsetRadius;
                    lng += Math.sin(offsetAngle) * offsetRadius;
                }

                const rawUrl = row.fonte || fontesMap.get(idCadeia) || row.url_referencia || '';
                const urlFinal = rawUrl !== ''
                    ? rawUrl
                    : (tipoNome.toLowerCase().includes('ig')
                        ? 'https://www.gov.br/inpi/pt-br/servicos/indicacoes-geograficas'
                        : 'http://observatorioapl.mdic.gov.br/');

                mapCadeias.set(idCadeia, {
                    id: idCadeia,
                    id_cadeia: idCadeia,
                    nome: row.entidade || `Arranjo #${idCadeia}`,
                    entidade: row.entidade || `Arranjo #${idCadeia}`,
                    segmento: row.segmento || row.nome_cadeia || 'Outros',
                    tipo: tipoNome,
                    shortTipo: configTipo.label,
                    id_sede: lookupSede ? lookupSede.id_municipio : (row.id_sede || 1),
                    municipio: nomeSedeFinal,
                    municipio_sede: nomeSedeFinal,
                    id_territorio: idTerrSede,
                    territorio: nomeTerrSede,
                    territorio_identidade: nomeTerrSede,
                    lat,
                    lng,
                    latitude: lat,
                    longitude: lng,
                    corHex: configTipo.corHex,
                    bgBadge: configTipo.bgBadge,
                    icone: configTipo.icone,
                    iconSvg: configTipo.iconSvg,
                    fonte: urlFinal,
                    urlReferencia: urlFinal,
                    municipios_cobertos: []
                });
            }

            if (row.id_municipio || row.nome_municipio) {
                const cadeiaObj = mapCadeias.get(idCadeia);
                const lookupMun = (row.id_municipio && MUN_LOOKUP.byId[row.id_municipio]) ||
                    (row.nome_municipio && MUN_LOOKUP.byName[normalizeName(row.nome_municipio)]);

                const mId = row.id_municipio || (lookupMun ? lookupMun.id_municipio : null);
                const mNome = row.nome_municipio || (lookupMun ? lookupMun.nome_municipio : '');
                const mTerrId = row.id_territorio || (lookupMun ? lookupMun.id_territorio : idTerrSede);
                const mTerrNome = row.nome_territorio || (lookupMun ? lookupMun.nome_territorio : nomeTerrSede);

                const munCoords = findMunicipioCoords(mNome);

                if (mId && !cadeiaObj.municipios_cobertos.some(m => m.id_municipio === mId)) {
                    cadeiaObj.municipios_cobertos.push({
                        id_municipio: mId,
                        nome_municipio: mNome,
                        id_territorio: mTerrId,
                        nome_territorio: mTerrNome,
                        lat: munCoords ? munCoords[0] : null,
                        lng: munCoords ? munCoords[1] : null
                    });
                }
            }
        });

        return Array.from(mapCadeias.values());
    }, [listaCadeias, distribuicaoCadeias]);

    const availableTipos = useMemo(() => {
        const tipos = new Set();
        enrichedCadeias.forEach(c => { if (c.tipo) tipos.add(c.tipo); });
        return Array.from(tipos);
    }, [enrichedCadeias]);

    // FILTRO ESTRITO POR SEDE
    const territoryCadeias = useMemo(() => {
        if (!selectedTerritory) return enrichedCadeias;
        const targetId = Number(selectedTerritory.id_territorio);
        const targetNome = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio);

        return enrichedCadeias.filter(c => {
            const matchId = Number(c.id_territorio) === targetId;
            const matchNome = normalizeName(c.territorio_identidade) === targetNome;
            return matchId || matchNome;
        });
    }, [enrichedCadeias, selectedTerritory]);

    const filteredCadeias = useMemo(() => {
        let list = territoryCadeias;
        if (selectedTipo !== 'todos') list = list.filter(c => c.tipo === selectedTipo);
        if (selectedSegmento) list = list.filter(c => c.segmento === selectedSegmento);
        return list;
    }, [territoryCadeias, selectedTipo, selectedSegmento]);

    const compactCadeiasList = useMemo(() => {
        if (!sidebarSearch.trim()) return filteredCadeias;
        const q = sidebarSearch.toLowerCase().trim();
        return filteredCadeias.filter(c =>
            (c.entidade && c.entidade.toLowerCase().includes(q)) ||
            (c.segmento && c.segmento.toLowerCase().includes(q)) ||
            (c.municipio_sede && c.municipio_sede.toLowerCase().includes(q))
        );
    }, [filteredCadeias, sidebarSearch]);

    const segmentStats = useMemo(() => {
        if (!filteredCadeias || filteredCadeias.length === 0) return [];
        const counts = {};
        const total = filteredCadeias.length;

        filteredCadeias.forEach(c => {
            const seg = c.segmento || 'Outros Segmentos';
            counts[seg] = (counts[seg] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, count], idx) => {
                const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                const color = SEGMENT_PALETTE[idx % SEGMENT_PALETTE.length];
                return { name, count, percent, color };
            })
            .sort((a, b) => b.count - a.count);
    }, [filteredCadeias]);

    const totalMunicipiosBeneficiados = useMemo(() => {
        const munSet = new Set();
        filteredCadeias.forEach(c => {
            if (c.municipios_cobertos && c.municipios_cobertos.length > 0) {
                c.municipios_cobertos.forEach(m => {
                    if (m.nome_municipio) munSet.add(normalizeName(m.nome_municipio));
                });
            } else if (c.municipio_sede) {
                munSet.add(normalizeName(c.municipio_sede));
            }
        });
        return munSet.size;
    }, [filteredCadeias]);

    const totalMunicipiosSede = useMemo(() => {
        const sedeSet = new Set();
        filteredCadeias.forEach(c => {
            if (c.municipio_sede) sedeSet.add(normalizeName(c.municipio_sede));
        });
        return sedeSet.size;
    }, [filteredCadeias]);

    const territoryRanking = useMemo(() => {
        if (!enrichedCadeias || enrichedCadeias.length === 0) return [];
        const counts = {};

        enrichedCadeias.forEach(c => {
            const tid = Number(c.id_territorio) || 0;
            const tName = c.territorio_identidade || 'Não identificado';

            if (tid > 0) {
                if (!counts[tid]) counts[tid] = { id: tid, name: tName, count: 0 };
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
                heatColor: t.count >= 8 ? '#1D3557' : t.count >= 4 ? '#2563EB' : '#60A5FA'
            }));
    }, [enrichedCadeias]);

    const municipalityRanking = useMemo(() => {
        if (!filteredCadeias || filteredCadeias.length === 0) return [];
        const counts = {};
        const targetId = selectedTerritory ? Number(selectedTerritory.id_territorio) : null;

        filteredCadeias.forEach(c => {
            if (!targetId || Number(c.id_territorio) === targetId) {
                const munSede = c.municipio_sede || 'Polo Regional';
                counts[munSede] = (counts[munSede] || 0) + 1;
            }
        });

        const maxCount = Math.max(...Object.values(counts), 1);

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count], idx) => ({
                name,
                count,
                rank: idx + 1,
                percentBar: Math.min(100, (count / maxCount) * 100),
                heatColor: count >= 5 ? '#1D3557' : count >= 2 ? '#2563EB' : '#60A5FA'
            }));
    }, [selectedTerritory, filteredCadeias]);

    const topSegment = segmentStats[0];

    const kpis = [
        {
            label: 'Arranjos & IGs Mapeados',
            value: loadingStats ? '...' : filteredCadeias.length,
            icon: GitPullRequest
        },
        {
            label: 'Municípios Beneficiados',
            value: loadingStats ? '...' : totalMunicipiosBeneficiados,
            icon: CheckCircle2
        },
        {
            label: selectedTerritory ? 'Municípios Sede' : 'Territórios com Arranjos',
            value: loadingStats ? '...' : (selectedTerritory ? `${totalMunicipiosSede} munic.` : `${territoryRanking.length} de ${territoriosData.length || 27}`),
            icon: selectedTerritory ? Building2 : MapPin
        },
        {
            label: 'Qtd. de Segmentos',
            value: loadingStats ? '...' : `${segmentStats.length} Segmentos`,
            icon: Layers
        },
        {
            label: topSegment ? `Maior Segmento: ${topSegment.name}` : 'Maior Segmento',
            value: loadingStats ? '...' : (topSegment ? `${topSegment.percent}%` : '-'),
            icon: Sparkles
        }
    ];

    const dynamicTabs = useMemo(() => [
        {
            id: 'catalogo',
            label: 'Catálogo',
            icon: GitPullRequest,
            count: filteredCadeias.length,
            content: (
                <div className="flex-1 flex flex-col min-h-0 w-full">
                    <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[13px] font-semibold text-text-primary">
                                {selectedTerritory ? `Arranjos em ${territoryName}` : 'Arranjos Produtivos e IGs no Estado'}
                            </h3>
                            <span className="bg-primary-600/10 text-primary-600 text-[11px] font-medium px-2 py-0.5 rounded-full">
                                {filteredCadeias.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setSelectedTipo('todos')}
                                className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer ${selectedTipo === 'todos' ? 'bg-primary-900 text-white' : 'bg-surface-soft text-text-secondary hover:bg-border'
                                    }`}
                            >
                                Todos
                            </button>

                            {availableTipos.map((tipo) => {
                                const conf = getTipoCadeiaConfig(tipo);
                                const isSelected = selectedTipo === tipo;
                                return (
                                    <button
                                        key={tipo}
                                        type="button"
                                        onClick={() => setSelectedTipo(tipo)}
                                        className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer ${isSelected ? 'text-white' : `${conf.bgBadge} hover:opacity-80`
                                            }`}
                                        style={{ backgroundColor: isSelected ? conf.corHex : undefined }}
                                    >
                                        {tipo}
                                    </button>
                                );
                            })}

                            {selectedTerritory && (
                                <button
                                    type="button"
                                    onClick={() => handleSelectTerritory(null)}
                                    className="text-[11px] font-medium text-text-primary bg-primary-200/40 hover:bg-primary-200 px-2.5 py-1 rounded-full flex items-center gap-1 ml-1 cursor-pointer transition-colors"
                                >
                                    <MapPin size={11} className="text-primary-600" />
                                    <span>{territoryName}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 min-h-0 w-full pb-2">
                        {filteredCadeias.length > 0 ? (
                            filteredCadeias.map((c, idx) => {
                                const IconComp = c.icone;
                                const totalAbrangencia = (c.municipios_cobertos && c.municipios_cobertos.length > 0) ? c.municipios_cobertos.length : 1;
                                const isSelected = selectedCadeia?.id_cadeia === c.id_cadeia;

                                const listaNomes = (c.municipios_cobertos && c.municipios_cobertos.length > 0)
                                    ? c.municipios_cobertos.map(m => m.nome_municipio).join(', ')
                                    : c.municipio_sede;

                                return (
                                    <div
                                        key={c.id_cadeia || idx}
                                        ref={(el) => { itemRefs.current[c.id_cadeia] = el; }}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedCadeia(null);
                                                setFocusedAsset(null);
                                            } else {
                                                setSelectedCadeia(c);
                                                if (c.lat && c.lng) setFocusedAsset([c.lat, c.lng]);
                                            }
                                        }}
                                        className={`rounded-xl p-3.5 flex flex-col justify-between gap-2 shadow-2xs transition-all duration-200 group cursor-pointer border w-full ${isSelected
                                                ? 'bg-[#EFF6FF] border-primary-600 ring-2 ring-primary-600/25 shadow-md'
                                                : 'bg-surface-soft border-transparent hover:bg-surface hover:border-primary-200 hover:shadow-xs'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3 w-full">
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div
                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform ${isSelected ? 'scale-110 shadow-sm' : 'group-'
                                                        }`}
                                                    style={{ backgroundColor: `${c.corHex}18`, color: c.corHex }}
                                                >
                                                    <IconComp size={16} />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <h4 className={`text-[12.5px] font-semibold leading-tight break-words transition-colors ${isSelected ? 'text-primary-600' : 'text-text-primary group-hover:text-primary-600'
                                                        }`}>
                                                        {c.entidade}
                                                    </h4>

                                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-text-secondary mt-1 font-medium">
                                                        <span className="font-medium text-text-primary bg-border/70 px-1.5 py-0.2 rounded-md">{c.segmento}</span>
                                                        <span>•</span>
                                                        <span className="font-semibold text-text-primary">Sede: {c.municipio_sede}</span>
                                                        <span>•</span>
                                                        <span className="text-text-secondary">{c.territorio_identidade}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                                                <span
                                                    className="text-[9px] font-medium px-2.5 py-1 rounded-full"
                                                    style={{ backgroundColor: `${c.corHex}18`, color: c.corHex }}
                                                >
                                                    {c.tipo}
                                                </span>
                                                {c.fonte && (
                                                    <a
                                                        href={c.fonte}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1 rounded-lg text-text-muted hover:text-primary-600 hover:bg-primary-200/50 transition-colors"
                                                        title="Acessar Fonte Oficial"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink size={13} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`mt-1 text-[10px] leading-relaxed break-words rounded-xl p-2 transition-colors ${isSelected
                                                ? 'bg-surface/90 border border-[#BFDBFE] text-primary-800'
                                                : 'bg-surface/60 border border-border/60 text-[#475569]'
                                            }`}>
                                            <span className="font-medium text-text-primary">
                                                {totalAbrangencia > 1 ? `Atua em ${totalAbrangencia} municípios: ` : 'Atua em 1 município: '}
                                            </span>
                                            <span className="font-medium">
                                                {listaNomes}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
                                <GitPullRequest size={32} className="mb-2 opacity-40 text-text-secondary" />
                                <p className="text-[12px] font-medium text-text-primary">Nenhum arranjo produtivo sediado neste território</p>
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            id: 'segmentos',
            label: 'Segmentos',
            icon: Filter,
            count: segmentStats.length,
            content: (
                <div className="flex-1 flex flex-col min-h-0 w-full">
                    <div className="mb-3 shrink-0 flex items-center justify-between">
                        <div>
                            <h3 className="text-[13px] font-semibold text-text-primary">
                                {selectedTerritory ? `Segmentos em ${territoryName}` : 'Segmentos Econômicos da Bahia'}
                            </h3>
                            <p className="text-[10.5px] text-text-secondary font-medium">Distribuição por vocação produtiva</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0 w-full">
                        {segmentStats.map((seg) => {
                            const isSelected = selectedSegmento === seg.name;
                            return (
                                <div
                                    key={seg.name}
                                    onClick={() => setSelectedSegmento(isSelected ? null : seg.name)}
                                    className={`rounded-xl p-3.5 border transition-all cursor-pointer ${isSelected ? 'bg-surface border-primary-600 shadow-md ring-2 ring-primary-600/20' : 'bg-surface-soft border-transparent hover:bg-surface hover:border-primary-200 shadow-2xs'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: seg.color }} />
                                            <span className="text-[12px] font-semibold text-text-primary truncate">{seg.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-semibold text-text-primary">{seg.count} arranjos</span>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${seg.color}15`, color: seg.color }}>
                                                {seg.percent}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                                        <div className="h-full rounded-lg transition-all duration-500" style={{ width: `${seg.percent}%`, backgroundColor: seg.color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )
        },
        {
            id: 'ranking',
            label: selectedTerritory ? 'Ranking Sede Municípios' : 'Ranking Sede Territórios',
            icon: TrendingUp,
            count: selectedTerritory ? municipalityRanking.length : territoryRanking.length,
            content: (
                <div className="flex-1 flex flex-col min-h-0 w-full">
                    <div className="mb-3 shrink-0 flex items-center justify-between">
                        <div>
                            <h3 className="text-[13px] font-semibold text-text-primary">
                                {selectedTerritory ? `Ranking Sede Municípios · ${territoryName}` : 'Ranking Sede Territórios'}
                            </h3>
                            <p className="text-[10.5px] text-text-secondary font-medium">Densidade de arranjos produtivos por sede oficial</p>
                        </div>
                        <span className="text-[10px] font-semibold text-text-secondary bg-surface-soft px-2.5 py-1 rounded-full">
                            {selectedTerritory ? `${municipalityRanking.length} sedes` : `${territoryRanking.length} territórios`}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0 w-full">
                        {selectedTerritory ? (
                            municipalityRanking.map((m) => (
                                <div
                                    key={m.name}
                                    onClick={() => {
                                        const munKey = String(m.name || '').trim();
                                        const coords = findMunicipioCoords(munKey);
                                        if (coords) setFocusedAsset(coords);
                                    }}
                                    className="p-2.5 flex items-center justify-between gap-3 transition-colors duration-200 cursor-pointer border-b border-neutral-200/50 bg-transparent hover:bg-surface-soft"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 ${m.rank <= 3 ? 'bg-primary-900 text-white' : 'bg-border text-text-secondary'
                                            }`}>
                                            {m.rank}
                                        </span>
                                        <span className="text-[11px] font-semibold text-text-primary truncate">{m.name}</span>
                                    </div>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-white shadow-2xs" style={{ backgroundColor: m.heatColor }}>
                                        {m.count} {m.count === 1 ? 'cadeia' : 'cadeias'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            territoryRanking.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => {
                                        const found = territoriosData.find(x => Number(x.id_territorio) === Number(t.id));
                                        handleSelectTerritory(found || { id_territorio: t.id, nome_territorio: t.name });
                                    }}
                                    className="p-2.5 flex items-center justify-between gap-3 transition-colors duration-200 cursor-pointer border-b border-neutral-200/50 bg-transparent hover:bg-surface-soft"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 ${t.rank <= 3 ? 'bg-primary-900 text-white' : 'bg-border text-text-secondary'
                                            }`}>
                                            {t.rank}
                                        </span>
                                        <span className="text-[11px] font-semibold text-text-primary truncate">{t.name}</span>
                                    </div>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-white shadow-2xs" style={{ backgroundColor: t.heatColor }}>
                                        {t.count} {t.count === 1 ? 'cadeia' : 'cadeias'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )
        }
    ], [filteredCadeias, segmentStats, territoryRanking, municipalityRanking, selectedTerritory, territoryName, selectedTipo, selectedSegmento, availableTipos, selectedCadeia, territoriosData]);

    const activeSelectionName = selectedCadeia ? selectedCadeia.entidade : (selectedTerritory ? territoryName : null);
    const activeSelectionCount = selectedCadeia ? 1 : (selectedTerritory ? filteredCadeias.length : 0);

    return (
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full">

            {/* HEADER DA PÁGINA */}
            <div className="flex items-center justify-between w-full shrink-0">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">
                            Módulo de Cadeias Produtivas & IGs
                        </h1>
                        <span className="bg-success-500/10 text-success-700 text-[11px] font-medium uppercase px-2.5 py-1 rounded-full border border-success-500/20 flex items-center gap-1">
                            <Award size={12} className="text-success-700" />
                            Arranjos & Indicações Geográficas
                        </span>
                    </div>
                    <p className="text-xs lg:text-sm text-text-secondary mt-0.5 font-medium">
                        Mapeamento territorial de Arranjos Produtivos Locais (APLs) e Indicações Geográficas do Estado da Bahia
                    </p>
                    <div className="divider-territorial w-48 mt-3"></div>
                </div>
            </div>

            {/* GRID DE KPIS */}
            <div className="w-full relative z-10 shrink-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 items-stretch w-full">
                    {kpis.map((kpi, index) => (
                        <div
                            key={index}
                            className={`h-[98px] bg-surface rounded-xl p-4 flex flex-col justify-between border border-border shadow-sm hover:shadow-md transition-shadow duration-200 cursor-default ${index === 0 ? 'kpi-accent-primary' : index === 1 ? 'kpi-accent-success' : index === 2 ? 'kpi-accent-accent' : index === 3 ? 'kpi-accent-warning' : 'kpi-accent-neutral'}`}
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

            {/* GRID PRINCIPAL: MAPA (40% ou Expandido) + CARDLISTA ou KPIS VERTICAIS */}
            <div className="flex-1 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[520px] w-full pb-4">

                {/* MAPA DE CADEIAS */}
                <div
                    style={{ width: isMapExpanded ? 'calc(100% - 320px)' : 'calc(40% - 12px)' }}
                    className="shrink-0 h-[480px] lg:h-full bg-surface rounded-xl border border-border shadow-sm relative overflow-hidden flex flex-col min-h-0 transition-[width] duration-300"
                >
                    <SideMap
                        mode="cadeias"
                        cadeiasData={filteredCadeias}
                        processedAtivos={filteredCadeias}
                        selectedTerritory={selectedTerritory}
                        selectedCadeia={selectedCadeia}
                        onSelectTerritory={handleSelectTerritory}
                        selectedSegmento={selectedSegmento}
                        onSelectSegmento={setSelectedSegmento}
                        onAssetClick={handleSelectFromMap}
                        isExpanded={isMapExpanded}
                        onToggleExpand={() => setIsMapExpanded(prev => !prev)}
                    />
                </div>

                {/* MODO EXPANDIDO: LISTA COMPACTA E OTIMIZADA AO LADO DO MAPA */}
                {isMapExpanded ? (
                    <div className="w-[305px] shrink-0 h-[480px] lg:h-full bg-surface rounded-xl border border-border shadow-sm p-4 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* CABEÇALHO DA LISTA COMPACTA */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/70 shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[12px] font-semibold text-text-primary truncate">
                                    Arranjos & IGs
                                </span>
                                <span className="bg-primary-600/10 text-primary-600 text-[9.5px] font-medium px-2 py-0.5 rounded-full shrink-0">
                                    {compactCadeiasList.length}
                                </span>
                            </div>
                            {selectedCadeia && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCadeia(null);
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
                                placeholder="Filtrar arranjo ou cidade..."
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
                        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 min-h-0">
                            {compactCadeiasList.length > 0 ? (
                                compactCadeiasList.map((c, idx) => {
                                    const IconComp = c.icone;
                                    const isSelected = selectedCadeia?.id_cadeia === c.id_cadeia;

                                    return (
                                        <div
                                            key={c.id_cadeia || idx}
                                            ref={(el) => { itemRefs.current[c.id_cadeia] = el; }}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedCadeia(null);
                                                    setFocusedAsset(null);
                                                } else {
                                                    setSelectedCadeia(c);
                                                    if (c.lat && c.lng) setFocusedAsset([c.lat, c.lng]);
                                                }
                                            }}
                                            className={`p-2 rounded-xl flex items-center justify-between gap-2 transition-all duration-200 group cursor-pointer border w-full ${isSelected
                                                    ? 'bg-[#EFF6FF] border-primary-600 ring-2 ring-primary-600/25 shadow-xs'
                                                    : 'bg-surface-soft border-transparent hover:bg-surface hover:border-primary-200 hover:shadow-2xs'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div
                                                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform ${isSelected ? 'scale-105 shadow-2xs' : 'group-'
                                                        }`}
                                                    style={{ backgroundColor: `${c.corHex}18`, color: c.corHex }}
                                                >
                                                    <IconComp size={12} />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <h5 className={`text-[11px] font-bold leading-tight truncate transition-colors ${isSelected ? 'text-primary-800' : 'text-text-primary group-hover:text-primary-600'
                                                        }`}>
                                                        {c.entidade}
                                                    </h5>
                                                    <span className="text-[9.5px] text-text-secondary truncate leading-tight">
                                                        {c.segmento} • <strong className="font-semibold text-text-secondary">{c.municipio_sede}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            <span
                                                className="text-[8px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap"
                                                style={{ backgroundColor: `${c.corHex}15`, color: c.corHex }}
                                            >
                                                {c.tipo}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-text-muted">
                                    <p className="text-[11px] font-medium">Nenhum arranjo encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* LADO DIREITO: BARRA DE SELEÇÃO + CARDLISTA */
                    <div className="flex-1 h-[480px] lg:h-full min-h-0 min-w-0 flex flex-col gap-3 animate-in fade-in duration-200">

                        {/* BARRA DE SELEÇÃO ATIVA (ESTILO EXATO DA PÁGINA DE ATIVOS) */}
                        {activeSelectionName && (
                            <div className="w-full bg-[#E0F2FE]/60 border border-[#BAE6FD]/80 rounded-[22px] py-2 px-4 flex items-center justify-between gap-3 shrink-0 shadow-2xs backdrop-blur-xs animate-in fade-in duration-200">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0" />
                                    <span className="text-[12px] font-medium text-text-primary truncate">
                                        {selectedCadeia ? 'Arranjo Selecionado:' : 'Região Selecionada:'}{' '}
                                        <strong className="font-medium text-primary-600">{activeSelectionName}</strong>
                                    </span>
                                    <span className="bg-surface/80 text-primary-600 border border-[#BAE6FD]/80 text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                                        {activeSelectionCount} {activeSelectionCount === 1 ? (selectedCadeia ? 'arranjo' : 'cadeia') : 'cadeias'}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (selectedCadeia) {
                                            setSelectedCadeia(null);
                                        } else {
                                            handleSelectTerritory(null);
                                        }
                                        setFocusedAsset(null);
                                    }}
                                    className="text-[11px] font-medium text-text-primary hover:text-red-600 bg-surface hover:bg-danger-50/80 px-3 py-1 rounded-full border border-[#BAE6FD]/80 hover:border-red-200 flex items-center gap-1.5 shadow-2xs transition-all duration-200 cursor-pointer shrink-0"
                                >
                                    <X size={12} className="text-text-secondary group-hover:text-danger-600" />
                                    <span>{selectedCadeia ? 'Limpar seleção de arranjo' : 'Limpar filtro da região'}</span>
                                </button>
                            </div>
                        )}

                        {/* CARDLISTA DINÂMICO */}
                        <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                            <CardLista
                                tabs={dynamicTabs}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                showSearch={true}
                                searchPlaceholder="Buscar cadeia, segmento ou cidade..."
                            />
                        </div>
                    </div>
                )}

            </div>

        </main>
    );
}