import React, { useContext, useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
    BookOpen,
    SunMedium
} from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { isMunicipioSemiarido } from '../constants/semiarido';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import { municipiosDB } from '../data/municipiosDB';
import { getTextoReferencia } from '../data/referenciasDB';
import SideMap from './maps/SideMap';
import {
    Card,
    Button,
    Badge,
    Chip,
    SearchInput,
    Tabs,
    Drawer,
    EmptyState,
    KpiSkeleton
} from './ui';
import { useChartTheme, resolveCssRgb } from './graph/chartTheme';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '../lib/motion';

function getAlphaColor(color, alpha = 0.12) {
    if (!color) return 'transparent';
    if (color.startsWith('rgb(')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    return color.startsWith('#') ? `${color}20` : color;
}

export const getSemiaridoArrangementColor = (nomeTipo, chartTheme) => {
    const str = String(nomeTipo || '').toLowerCase();
    if (chartTheme?.goldenPalette) {
        if (str.includes('potencial')) return chartTheme.goldenPalette[2];
        if (str.includes('ig') || str.includes('indica')) return chartTheme.goldenPalette[1];
        return chartTheme.goldenPalette[0];
    }
    if (str.includes('potencial')) return 'rgb(250, 196, 70)';
    if (str.includes('ig') || str.includes('indica')) return 'rgb(228, 150, 24)';
    return 'rgb(192, 138, 28)';
};

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

const getTipoCadeiaConfig = (nomeTipo, chartTheme) => {
    const str = String(nomeTipo || '').toLowerCase();
    const corWarning = chartTheme?.warning || resolveCssRgb('--color-warning-600', 'rgb(245, 158, 11)');
    const corSuccess = chartTheme?.success || resolveCssRgb('--color-success-600', 'rgb(34, 197, 94)');
    const corPrimary = chartTheme?.primary || resolveCssRgb('--color-primary-600', 'rgb(37, 112, 184)');

    if (str.includes('potencial')) {
        return {
            corHex: corWarning,
            bgBadge: 'bg-warning-600/15 text-warning-700',
            icone: Compass,
            label: 'IG Potencial',
            iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${corWarning}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`
        };
    }
    if (str.includes('ig') || str.includes('indica')) {
        return {
            corHex: corSuccess,
            bgBadge: 'bg-success-500/15 text-success-700',
            icone: Award,
            label: 'IG',
            iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${corSuccess}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`
        };
    }
    return {
        corHex: corPrimary,
        bgBadge: 'bg-primary-600/15 text-primary-600',
        icone: Wheat,
        label: 'APL',
        iconSvg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${corPrimary}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22 12 12"/><path d="M7 17a5 5 0 0 1 5-5"/><path d="M12 12a5 5 0 0 1 5-5"/><path d="M17 7a5 5 0 0 1 5-5"/></svg>`
    };
};

export const getTipoBadgeVariant = (nomeTipo) => {
    const str = String(nomeTipo || '').toLowerCase();
    if (str.includes('potencial')) return 'warning';
    if (str.includes('ig') || str.includes('indica')) return 'success';
    return 'primary';
};

export default function CadeiaPage() {
    const chartTheme = useChartTheme();
    const {
        listaCadeias = [],
        distribuicaoCadeias = [],
        territoriosData = [],
        loadingStats = false,
        filtroSemiarido = false,
        setFiltroSemiarido
    } = useContext(DataContext);

    const [selectedTerritory, setSelectedTerritory] = useState(null);
    const [focusedAsset, setFocusedAsset] = useState(null);
    const [selectedSegmento, setSelectedSegmento] = useState(null);
    const [selectedTipo, setSelectedTipo] = useState('todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('catalogo');
    const [selectedCadeia, setSelectedCadeia] = useState(null);
    const [selectedCadeiaDrawer, setSelectedCadeiaDrawer] = useState(null);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [sidebarSearch, setSidebarSearch] = useState('');

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedTipo !== 'todos') count++;
        if (selectedSegmento) count++;
        if (searchQuery.trim()) count++;
        return count;
    }, [selectedTipo, selectedSegmento, searchQuery]);

    const handleClearAllFilters = () => {
        setSelectedTipo('todos');
        setSelectedSegmento(null);
        setSearchQuery('');
        setSelectedCadeia(null);
        setFocusedAsset(null);
    };

    const itemRefs = useRef({});
    const catalogListRef = useRef(null);
    const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

    // Resetar scroll do catálogo ao alterar filtros
    useEffect(() => {
        if (catalogListRef.current) {
            catalogListRef.current.scrollTop = 0;
        }
    }, [selectedTipo, selectedSegmento, selectedTerritory, searchQuery]);

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
                    block: 'start'
                });
            }
        }, 150);
    };

    // 1. Enriquecimento de Dados
    const enrichedCadeias = useMemo(() => {
        const fontesMap = new Map();
        const coordsMap = new Map();
        const textoRefMap = new Map();

        (listaCadeias || []).forEach(lc => {
            const id = Number(lc.id_cadeia);
            if (id && lc.fonte) fontesMap.set(id, lc.fonte);
            if (id && lc.texto_referencia) textoRefMap.set(id, lc.texto_referencia);
            const cLat = Number(lc.latitude || lc.lat);
            const cLng = Number(lc.longitude || lc.lng);
            if (id && cLat && cLng && cLat >= -18.5 && cLat <= -8.0 && cLng >= -47.0 && cLng <= -36.5) {
                coordsMap.set(id, [cLat, cLng]);
            }
        });

        const sourceData = (distribuicaoCadeias && distribuicaoCadeias.length > 0) ? distribuicaoCadeias : listaCadeias;
        if (!sourceData || sourceData.length === 0) return [];

        const mapCadeias = new Map();

        sourceData.forEach((row, idx) => {
            const idCadeia = Number(row.id_cadeia || idx + 1);
            const tipoNome = row.nome_tipo || row.tipo || 'APL';
            const configTipo = getTipoCadeiaConfig(tipoNome, chartTheme);
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

                // Garantir limites da Bahia
                if (lat && (lat < -18.5 || lat > -8.0)) lat = null;
                if (lng && (lng < -47.0 || lng > -36.5)) lng = null;

                if ((!lat || !lng) && coordsMap.has(idCadeia)) {
                    const [cLat, cLng] = coordsMap.get(idCadeia);
                    lat = cLat;
                    lng = cLng;
                }

                if (!lat || !lng) {
                    const huntedCoords = findMunicipioCoords(nomeSedeFinal) ||
                        (overrideSede ? findMunicipioCoords(overrideSede) : null) ||
                        [-12.9714, -38.5014];

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

                const isIgPotencial = tipoNome.toLowerCase().includes('potencial') || configTipo.label === 'IG Potencial';
                const textoRefFinal = isIgPotencial
                    ? (row.texto_referencia || textoRefMap.get(idCadeia) || getTextoReferencia(urlFinal, row.entidade))
                    : null;

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
                    texto_referencia: textoRefFinal,
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

                let munCoords = findMunicipioCoords(mNome);
                if (!munCoords || munCoords[0] < -18.5 || munCoords[0] > -8.0 || munCoords[1] < -47.0 || munCoords[1] > -36.5) {
                    munCoords = null;
                }

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
    }, [listaCadeias, distribuicaoCadeias, chartTheme]);

    const availableTipos = useMemo(() => {
        const tipos = new Set();
        enrichedCadeias.forEach(c => { if (c.tipo) tipos.add(c.tipo); });
        return Array.from(tipos);
    }, [enrichedCadeias]);

    // Helper para verificar se a cadeia tem sede ou municípios cobertos no semiárido
    const isCadeiaSemiarido = (c) => {
        if (!c) return false;
        if (isMunicipioSemiarido(c.municipio_sede || c.municipio)) return true;
        if (c.municipios_cobertos && c.municipios_cobertos.some(m => isMunicipioSemiarido(m.nome_municipio))) return true;
        return false;
    };

    // Subconjunto ativo com respeito ao Semiárido
    const activeScopedCadeias = useMemo(() => {
        if (!enrichedCadeias || enrichedCadeias.length === 0) return [];
        if (!filtroSemiarido) return enrichedCadeias;
        return enrichedCadeias.filter(isCadeiaSemiarido);
    }, [enrichedCadeias, filtroSemiarido]);

    // FILTRO ESTRITO POR SEDE
    const territoryCadeias = useMemo(() => {
        if (!selectedTerritory) return activeScopedCadeias;
        const targetId = Number(selectedTerritory.id_territorio);
        const targetNome = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio);

        return activeScopedCadeias.filter(c => {
            const matchId = Number(c.id_territorio) === targetId;
            const matchNome = normalizeName(c.territorio_identidade) === targetNome;
            return matchId || matchNome;
        });
    }, [activeScopedCadeias, selectedTerritory]);

    const tipoStats = useMemo(() => {
        const counts = { todos: territoryCadeias.length };
        territoryCadeias.forEach(c => {
            const t = c.tipo || 'APL';
            counts[t] = (counts[t] || 0) + 1;
        });
        return counts;
    }, [territoryCadeias]);

    const baseCadeiasForStats = useMemo(() => {
        let list = territoryCadeias;
        if (selectedTipo !== 'todos') list = list.filter(c => c.tipo === selectedTipo);
        return list;
    }, [territoryCadeias, selectedTipo]);

    // 1. Ranking global de segmentos (calculado uma vez sobre o conjunto COMPLETO de cadeias, estável entre filtros)
    const { globalTop7Set, segmentColorMap, neutralSegmentColor } = useMemo(() => {
        const counts = {};
        (enrichedCadeias || []).forEach(c => {
            const seg = c.segmento || 'Outros Segmentos';
            counts[seg] = (counts[seg] || 0) + 1;
        });

        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1]);

        const palette = chartTheme.palette || [];
        const neutral = palette[7] || chartTheme.textMuted || 'rgb(148, 163, 184)';

        const colorMap = new Map();
        const top7 = new Set();

        sorted.forEach(([name], idx) => {
            if (idx < 7) {
                top7.add(name);
                colorMap.set(name, palette[idx] || palette[0]);
            } else {
                colorMap.set(name, neutral);
            }
        });

        return {
            globalTop7Set: top7,
            segmentColorMap: colorMap,
            neutralSegmentColor: neutral
        };
    }, [enrichedCadeias, chartTheme.palette, chartTheme.textMuted]);

    // 2. getSegmentColor estável que consulta exclusivamente o ranking global
    const getSegmentColor = useCallback((segName) => {
        if (!segName) return neutralSegmentColor;
        return segmentColorMap.get(segName) || neutralSegmentColor;
    }, [segmentColorMap, neutralSegmentColor]);

    const segmentStats = useMemo(() => {
        if (!baseCadeiasForStats || baseCadeiasForStats.length === 0) return [];
        const counts = {};
        const total = baseCadeiasForStats.length;

        baseCadeiasForStats.forEach(c => {
            const seg = c.segmento || 'Outros Segmentos';
            counts[seg] = (counts[seg] || 0) + 1;
        });

        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1]);

        return sorted.map(([name, count]) => {
            const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            const isTop7 = globalTop7Set.has(name);
            const color = getSegmentColor(name);
            const legendLabel = isTop7 ? name : 'Demais segmentos';

            return {
                name,
                count,
                percent,
                color,
                isTop7,
                legendLabel
            };
        });
    }, [baseCadeiasForStats, globalTop7Set, getSegmentColor]);

    const filteredCadeias = useMemo(() => {
        let list = territoryCadeias;
        if (selectedTipo !== 'todos') list = list.filter(c => c.tipo === selectedTipo);
        if (selectedSegmento) list = list.filter(c => c.segmento === selectedSegmento);
        if (searchQuery.trim()) {
            const q = normalizeName(searchQuery);
            list = list.filter(c =>
                normalizeName(c.nome).includes(q) ||
                normalizeName(c.entidade).includes(q) ||
                normalizeName(c.segmento).includes(q) ||
                normalizeName(c.tipo).includes(q) ||
                normalizeName(c.municipio).includes(q) ||
                normalizeName(c.municipio_sede).includes(q) ||
                normalizeName(c.territorio_identidade).includes(q) ||
                (c.texto_referencia && normalizeName(c.texto_referencia).includes(q))
            );
        }
        return list.map(c => ({
            ...c,
            corSegmento: getSegmentColor(c.segmento)
        }));
    }, [territoryCadeias, selectedTipo, selectedSegmento, searchQuery, getSegmentColor]);

    const compactCadeiasList = useMemo(() => {
        if (!sidebarSearch.trim()) return filteredCadeias;
        const q = normalizeName(sidebarSearch);
        return filteredCadeias.filter(c =>
            normalizeName(c.entidade).includes(q) ||
            normalizeName(c.nome).includes(q) ||
            normalizeName(c.segmento).includes(q) ||
            normalizeName(c.tipo).includes(q) ||
            normalizeName(c.municipio_sede).includes(q) ||
            normalizeName(c.municipio).includes(q)
        );
    }, [filteredCadeias, sidebarSearch]);

    const totalMunicipiosBeneficiados = useMemo(() => {
        const munSet = new Set();
        filteredCadeias.forEach(c => {
            if (c.municipios_cobertos && c.municipios_cobertos.length > 0) {
                c.municipios_cobertos.forEach(m => {
                    if (m.nome_municipio) {
                        if (!filtroSemiarido || isMunicipioSemiarido(m.nome_municipio)) {
                            munSet.add(normalizeName(m.nome_municipio));
                        }
                    }
                });
            } else if (c.municipio_sede) {
                if (!filtroSemiarido || isMunicipioSemiarido(c.municipio_sede)) {
                    munSet.add(normalizeName(c.municipio_sede));
                }
            }
        });
        return munSet.size;
    }, [filteredCadeias, filtroSemiarido]);

    const totalMunicipiosSede = useMemo(() => {
        const sedeSet = new Set();
        filteredCadeias.forEach(c => {
            if (c.municipio_sede) {
                if (!filtroSemiarido || isMunicipioSemiarido(c.municipio_sede)) {
                    sedeSet.add(normalizeName(c.municipio_sede));
                }
            }
        });
        return sedeSet.size;
    }, [filteredCadeias, filtroSemiarido]);

    const territoryRanking = useMemo(() => {
        if (!activeScopedCadeias || activeScopedCadeias.length === 0) return [];
        const counts = {};

        activeScopedCadeias.forEach(c => {
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
                heatColor: t.count >= 8 ? (filtroSemiarido ? chartTheme.goldenPalette[5] : chartTheme.palette[0]) : t.count >= 4 ? (filtroSemiarido ? chartTheme.goldenPalette[1] : chartTheme.palette[1]) : (filtroSemiarido ? chartTheme.goldenPalette[2] : chartTheme.palette[4])
            }));
    }, [activeScopedCadeias, filtroSemiarido, chartTheme.goldenPalette, chartTheme.palette]);

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
                heatColor: count >= 5 ? (filtroSemiarido ? chartTheme.goldenPalette[5] : chartTheme.palette[0]) : count >= 2 ? (filtroSemiarido ? chartTheme.goldenPalette[1] : chartTheme.palette[1]) : (filtroSemiarido ? chartTheme.goldenPalette[2] : chartTheme.palette[4])
            }));
    }, [selectedTerritory, filteredCadeias, filtroSemiarido, chartTheme.goldenPalette, chartTheme.palette]);

    const topSegment = segmentStats[0];

    const rankingBaseColor = filtroSemiarido
        ? (chartTheme.accent || 'rgb(228, 150, 24)')
        : (chartTheme.primary || 'rgb(37, 112, 184)');

    const getRankingBarOpacity = (index, totalItems) => {
        if (!totalItems || totalItems <= 8) return 1;
        return Math.max(0.45, 1 - (index / Math.max(1, totalItems - 1)) * 0.55);
    };

    const semiaridoMetrics = useMemo(() => {
        const total = enrichedCadeias.length || 1;
        const semi = enrichedCadeias.filter(isCadeiaSemiarido).length;
        const pct = ((semi / total) * 100).toFixed(0);
        return { total, semi, pct };
    }, [enrichedCadeias]);

    const kpis = [
        {
            label: filtroSemiarido
                ? (selectedTerritory ? `Arranjos no Semiárido · ${territoryName}` : 'Arranjos no Semiárido')
                : (selectedTerritory ? `Arranjos em ${territoryName}` : 'Arranjos & IGs Mapeados'),
            value: loadingStats ? '...' : filteredCadeias.length,
            percent: filtroSemiarido ? `${semiaridoMetrics.pct}% do total` : null,
            tooltip: filtroSemiarido
                ? `No Semiárido: ${filteredCadeias.length} (${semiaridoMetrics.pct}% do total de cadeias) | Fora: ${Math.max(0, enrichedCadeias.length - filteredCadeias.length)}`
                : undefined,
            icon: GitPullRequest
        },
        {
            label: filtroSemiarido ? 'Municípios Beneficiados (Semiárido)' : 'Municípios Beneficiados',
            value: loadingStats ? '...' : totalMunicipiosBeneficiados,
            icon: CheckCircle2
        },
        {
            label: filtroSemiarido
                ? (selectedTerritory ? 'Municípios Sede no Semiárido' : 'Territórios no Semiárido')
                : (selectedTerritory ? 'Municípios Sede' : 'Territórios com Arranjos'),
            value: loadingStats ? '...' : (selectedTerritory ? `${totalMunicipiosSede} munic.` : `${territoryRanking.length} de ${territoriosData.length || 27}`),
            icon: selectedTerritory ? Building2 : MapPin
        },
        {
            label: filtroSemiarido ? 'Segmentos no Semiárido' : 'Qtd. de Segmentos',
            value: loadingStats ? '...' : segmentStats.length,
            icon: Layers
        },
        {
            label: topSegment ? (filtroSemiarido ? `Maior Segmento: ${topSegment.name}` : `Maior Segmento: ${topSegment.name}`) : 'Maior Segmento',
            value: loadingStats ? '...' : (topSegment ? `${topSegment.percent}%` : '-'),
            icon: Sparkles
        }
    ];

    return (
        <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden relative p-6 lg:p-8 flex flex-col gap-4 bg-transparent font-sans w-full">

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
            <div className="flex items-center justify-between w-full pr-52 sm:pr-60 lg:pr-64 shrink-0 relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="text-headline font-bold text-text-primary tracking-tight">
                            Módulo de Cadeias Produtivas & IGs
                        </h1>
                        <Badge
                            variant={filtroSemiarido ? 'warning' : 'success'}
                            icon={<Award size={14} className={filtroSemiarido ? 'text-amber-600' : 'text-success-600'} />}
                            className="text-caption font-medium px-2.5 py-1"
                        >
                            Arranjos & Indicações Geográficas
                        </Badge>
                    </div>
                    <p className="text-body-sm text-text-secondary mt-1 font-normal">
                        Mapeamento territorial de Arranjos Produtivos Locais (APLs) e Indicações Geográficas do Estado da Bahia
                    </p>
                    <div
                        className={`divider-territorial w-48 mt-3 ${filtroSemiarido ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-transparent' : ''}`}
                    />
                </div>
            </div>

            {/* GRID DE KPIS */}
            <motion.div
                variants={staggerContainer(0.04)}
                initial="initial"
                animate="animate"
                className="tour-kpis w-full relative z-10 shrink-0 min-w-0"
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 items-stretch w-full min-w-0">
                    {loadingStats ? (
                        <KpiSkeleton count={5} />
                    ) : (
                        kpis.map((kpi, index) => {
                            const isHero = index === 0;

                            return (
                                <motion.div
                                    key={index}
                                    variants={fadeUp}
                                    className="h-full"
                                >
                                    <Card
                                        variant={isHero ? (filtroSemiarido ? 'warning' : 'brand') : 'default'}
                                        title={kpi.tooltip || kpi.label}
                                        className="p-4 flex flex-col justify-between min-h-[92px] min-w-0 h-full transition-all duration-300 hover:shadow-card-elevated"
                                    >
                                        {/* LINHA SUPERIOR: ÍCONE + TÍTULO */}
                                        <div className="flex items-center gap-2 w-full min-w-0">
                                            <kpi.icon size={16} strokeWidth={2} className={isHero ? 'opacity-90' : 'text-primary-600 dark:text-primary-400'} />
                                            <span
                                                className={`text-caption font-medium truncate flex-1 ${isHero ? 'text-white/80' : 'text-text-muted'
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
                </div>
            </motion.div>

            {/* GRID PRINCIPAL: MAPA (40% ou Expandido) + CARDLISTA ou KPIS VERTICAIS */}
            <motion.div
                variants={staggerContainer(0.04)}
                initial="initial"
                animate="animate"
                className="flex-1 min-w-0 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[520px] w-full pb-4"
            >

                {/* MAPA DE CADEIAS */}
                <motion.div
                    variants={fadeUp}
                    style={{ width: isMapExpanded ? 'calc(100% - 320px)' : 'calc(40% - 12px)' }}
                    className="shrink-0 h-[480px] lg:h-full bg-surface rounded-card border border-border shadow-card relative overflow-hidden flex flex-col min-h-0 min-w-0 transition-[width] duration-300"
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
                        selectedTipo={selectedTipo}
                        onSelectTipo={setSelectedTipo}
                        onAssetClick={handleSelectFromMap}
                        isExpanded={isMapExpanded}
                        onToggleExpand={() => setIsMapExpanded(prev => !prev)}
                        getSegmentColor={getSegmentColor}
                    />
                </motion.div>

                {/* MODO EXPANDIDO: LISTA COMPACTA E OTIMIZADA AO LADO DO MAPA */}
                {isMapExpanded ? (
                    <motion.div
                        variants={fadeUp}
                        className="w-[320px] shrink-0 h-[480px] lg:h-full bg-surface rounded-card border border-border shadow-card p-4 flex flex-col min-h-0 min-w-0 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300"
                    >
                        {/* CABEÇALHO DA LISTA COMPACTA */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/70 shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-body-sm font-semibold text-text-primary truncate">
                                    Arranjos & IGs
                                </span>
                                <Badge
                                    variant={filtroSemiarido ? 'warning' : 'primary'}
                                    className="text-caption font-medium tnum"
                                >
                                    {compactCadeiasList.length}
                                </Badge>
                            </div>
                            {selectedCadeia && (
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => {
                                        setSelectedCadeia(null);
                                        setFocusedAsset(null);
                                    }}
                                    className="text-caption text-text-secondary hover:text-danger-600"
                                >
                                    Limpar
                                </Button>
                            )}
                        </div>

                        {/* BUSCA COMPACTA */}
                        <div className="my-2 shrink-0">
                            <SearchInput
                                value={sidebarSearch}
                                onChange={(e) => setSidebarSearch(e.target.value)}
                                onClear={() => setSidebarSearch('')}
                                placeholder="Filtrar arranjo ou cidade..."
                                size="sm"
                            />
                        </div>

                        {/* LISTA SCROLLÁVEL COMPACTA */}
                        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 min-h-0">
                            {compactCadeiasList.length > 0 ? (
                                compactCadeiasList.map((c, idx) => {
                                    const IconComp = c.icone || Wheat;
                                    const isSelected = selectedCadeia?.id_cadeia === c.id_cadeia;
                                    const itemColor = filtroSemiarido ? getSemiaridoArrangementColor(c.tipo, chartTheme) : c.corHex;
                                    const tipoVariant = getTipoBadgeVariant(c.tipo);

                                    return (
                                        <div
                                            key={c.id_cadeia || idx}
                                            ref={(el) => { itemRefs.current[c.id_cadeia] = el; }}
                                            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 54px' }}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedCadeia(null);
                                                    setFocusedAsset(null);
                                                } else {
                                                    setSelectedCadeia(c);
                                                    if (c.lat && c.lng) setFocusedAsset([c.lat, c.lng]);
                                                }
                                                setSelectedCadeiaDrawer(c);
                                            }}
                                            className={`p-2 rounded-control flex items-center justify-between gap-2 transition-all duration-200 group cursor-pointer border w-full ${isSelected
                                                    ? (filtroSemiarido
                                                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/25 shadow-xs'
                                                        : 'bg-primary-50 dark:bg-primary-950/40 border-primary-600 ring-2 ring-primary-600/25 shadow-xs')
                                                    : (filtroSemiarido
                                                        ? 'bg-surface-soft border-transparent hover:bg-surface hover:border-amber-300'
                                                        : 'bg-surface-soft border-transparent hover:bg-surface hover:border-primary-200')
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <div
                                                    className="w-6 h-6 rounded-control flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                                                    style={{
                                                        backgroundColor: getAlphaColor(itemColor),
                                                        color: itemColor
                                                    }}
                                                >
                                                    <IconComp size={12} />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <h5 className={`text-caption font-bold leading-tight truncate transition-colors ${isSelected
                                                            ? (filtroSemiarido ? 'text-amber-800 dark:text-amber-200' : 'text-primary-800 dark:text-primary-200')
                                                            : (filtroSemiarido ? 'text-text-primary group-hover:text-amber-600' : 'text-text-primary group-hover:text-primary-600')
                                                        }`}>
                                                        {c.entidade}
                                                    </h5>
                                                    <span className="text-caption text-text-secondary truncate leading-tight flex items-center gap-1.5">
                                                        <span
                                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: getSegmentColor(c.segmento) }}
                                                        />
                                                        <span className="truncate">
                                                            {c.segmento} • <strong className="font-semibold text-text-secondary">{c.municipio_sede}</strong>
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>

                                            <Badge
                                                variant={tipoVariant}
                                                className="text-caption font-medium"
                                            >
                                                {c.tipo}
                                            </Badge>
                                        </div>
                                    );
                                })
                            ) : (
                                <EmptyState
                                    icon={GitPullRequest}
                                    title="Nenhum arranjo encontrado"
                                    description="Tente ajustar os termos da busca."
                                />
                            )}
                        </div>
                    </motion.div>
                ) : (
                    /* LADO DIREITO: TABS, FILTROS E CONTEÚDO */
                    <motion.div
                        variants={fadeUp}
                        className="flex-1 min-w-0 h-[520px] lg:h-full flex flex-col gap-3 min-h-0 overflow-hidden"
                    >
                        {/* BARRA SUPERIOR: TABS + BUSCA */}
                        <div className="flex flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-3 shrink-0">
                            <Tabs
                                items={[
                                    {
                                        id: 'catalogo',
                                        label: 'Catálogo',
                                        icon: <GitPullRequest size={15} />,
                                        count: filteredCadeias.length
                                    },
                                    {
                                        id: 'segmentos',
                                        label: 'Segmentos',
                                        icon: <Filter size={15} />,
                                        count: segmentStats.length
                                    },
                                    {
                                        id: 'ranking',
                                        label: selectedTerritory ? 'Municípios' : 'Territórios',
                                        icon: <TrendingUp size={15} />
                                    }
                                ]}
                                value={activeTab}
                                onChange={setActiveTab}
                                variant="pill"
                                className="w-full 2xl:w-auto"
                            />

                            {/* BUSCA COM ATALHO "/" E BOTÃO LIMPAR */}
                            <div className="w-full 2xl:w-72 min-w-0">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (e.target.value.trim() && activeTab !== 'catalogo') {
                                            setActiveTab('catalogo');
                                        }
                                    }}
                                    onClear={() => setSearchQuery('')}
                                    placeholder="Buscar cadeia, segmento ou cidade... (/)"
                                    size="sm"
                                />
                            </div>
                        </div>

                        {/* BARRA DE FILTROS POR TIPO (CHIPS COM .tnum) + FILTROS ATIVOS */}
                        <div className="flex items-center justify-between gap-2 flex-wrap shrink-0">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <Chip
                                    selected={selectedTipo === 'todos'}
                                    onClick={() => setSelectedTipo('todos')}
                                    count={tipoStats.todos}
                                    variant={selectedTipo === 'todos' ? (filtroSemiarido ? 'warning' : 'primary') : 'neutral'}
                                    size="sm"
                                >
                                    Todos
                                </Chip>
                                {availableTipos.map((tipo) => (
                                    <Chip
                                        key={tipo}
                                        selected={selectedTipo === tipo}
                                        onClick={() => setSelectedTipo(selectedTipo === tipo ? 'todos' : tipo)}
                                        count={tipoStats[tipo] || 0}
                                        variant={selectedTipo === tipo ? (filtroSemiarido ? 'warning' : getTipoBadgeVariant(tipo)) : 'neutral'}
                                        size="sm"
                                    >
                                        {tipo}
                                    </Chip>
                                ))}
                            </div>

                            {/* CHIPS DE FILTROS ATIVOS & BOTÃO LIMPAR */}
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                {selectedSegmento && (
                                    <Chip
                                        selected
                                        onClick={() => setSelectedSegmento(null)}
                                        icon={<Filter size={12} />}
                                        variant="primary"
                                        size="sm"
                                    >
                                        Segmento: {selectedSegmento} ×
                                    </Chip>
                                )}
                                {selectedTerritory && (
                                    <Chip
                                        selected
                                        onClick={() => handleSelectTerritory(null)}
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
                            {/* ABA 1: CATÁLOGO */}
                            {activeTab === 'catalogo' && (
                                <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
                                    <div className="flex items-center justify-between mb-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory ? `Arranjos em ${territoryName}` : 'Arranjos Produtivos e IGs no Estado'}
                                            </h3>
                                            <Badge
                                                variant={filtroSemiarido ? 'warning' : 'primary'}
                                                className="tnum"
                                            >
                                                {filteredCadeias.length} {filteredCadeias.length === 1 ? 'resultado' : 'resultados'}
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

                                    <div ref={catalogListRef} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 min-h-0 w-full pb-2">
                                        {filteredCadeias.length > 0 ? (
                                            filteredCadeias.map((c, idx) => {
                                                const IconComp = c.icone || Wheat;
                                                const totalAbrangencia = (c.municipios_cobertos && c.municipios_cobertos.length > 0) ? c.municipios_cobertos.length : 1;
                                                const isSelected = selectedCadeia?.id_cadeia === c.id_cadeia;
                                                const itemColor = filtroSemiarido ? getSemiaridoArrangementColor(c.tipo, chartTheme) : c.corHex;
                                                const tipoVariant = getTipoBadgeVariant(c.tipo);

                                                const listaNomes = (c.municipios_cobertos && c.municipios_cobertos.length > 0)
                                                    ? c.municipios_cobertos.map(m => m.nome_municipio).join(', ')
                                                    : c.municipio_sede;

                                                return (
                                                    <div
                                                        key={c.id_cadeia || idx}
                                                        ref={(el) => { itemRefs.current[c.id_cadeia] = el; }}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 88px' }}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedCadeia(null);
                                                                setFocusedAsset(null);
                                                            } else {
                                                                setSelectedCadeia(c);
                                                                if (c.lat && c.lng) setFocusedAsset([c.lat, c.lng]);
                                                            }
                                                            setSelectedCadeiaDrawer(c);
                                                        }}
                                                        className={`rounded-card p-3.5 flex flex-col justify-between gap-2.5 transition-all duration-200 group cursor-pointer border w-full scroll-mt-2 ${isSelected
                                                                ? (filtroSemiarido
                                                                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20 shadow-card-elevated'
                                                                    : 'bg-primary-50/50 dark:bg-primary-950/30 border-primary-500 ring-2 ring-primary-500/20 shadow-card-elevated')
                                                                : (filtroSemiarido
                                                                    ? 'bg-surface border-border hover:border-amber-300 shadow-card hover:shadow-card-elevated'
                                                                    : 'bg-surface border-border hover:border-primary-200 shadow-card hover:shadow-card-elevated')
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3 w-full">
                                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                                <div
                                                                    className="w-8 h-8 rounded-control flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105"
                                                                    style={{
                                                                        backgroundColor: getAlphaColor(itemColor),
                                                                        color: itemColor
                                                                    }}
                                                                >
                                                                    <IconComp size={16} />
                                                                </div>
                                                                <div className="flex flex-col min-w-0 flex-1">
                                                                    <h4 className={`text-body-sm font-semibold leading-tight break-words transition-colors ${isSelected
                                                                            ? (filtroSemiarido ? 'text-amber-800 dark:text-amber-200' : 'text-primary-600 dark:text-primary-300')
                                                                            : (filtroSemiarido ? 'text-text-primary group-hover:text-amber-700' : 'text-text-primary group-hover:text-primary-600')
                                                                        }`}>
                                                                        {c.entidade}
                                                                    </h4>

                                                                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-caption text-text-secondary mt-1 font-medium">
                                                                        <Badge
                                                                            variant="neutral"
                                                                            className="text-caption font-medium"
                                                                            style={{
                                                                                backgroundColor: `${getSegmentColor(c.segmento)}15`,
                                                                                color: getSegmentColor(c.segmento),
                                                                                borderColor: `${getSegmentColor(c.segmento)}30`
                                                                            }}
                                                                        >
                                                                            {c.segmento}
                                                                        </Badge>
                                                                        <span>•</span>
                                                                        <span className="font-semibold text-text-primary">Sede: {c.municipio_sede}</span>
                                                                        <span>•</span>
                                                                        <span className="text-text-muted">{c.territorio_identidade}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                                                                <Badge
                                                                    variant={tipoVariant}
                                                                    className="text-caption font-medium"
                                                                >
                                                                    {c.tipo}
                                                                </Badge>
                                                                {c.fonte && (
                                                                    <a
                                                                        href={c.fonte}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="p-1 rounded-control text-text-muted hover:text-primary-600 hover:bg-surface-soft transition-colors"
                                                                        title="Acessar Fonte Oficial"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <ExternalLink size={14} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className={`text-caption leading-relaxed break-words rounded-control p-2 transition-colors border ${isSelected
                                                                ? (filtroSemiarido ? 'bg-amber-100/50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200' : 'bg-primary-50/70 dark:bg-primary-950/40 border-primary-200 dark:border-primary-700/60 text-primary-900 dark:text-primary-200')
                                                                : 'bg-surface-soft border-border text-text-secondary'
                                                            }`}>
                                                            <span className="font-semibold text-text-primary">
                                                                {totalAbrangencia > 1 ? `Atua em ${totalAbrangencia} municípios: ` : 'Atua em 1 município: '}
                                                            </span>
                                                            <span className="font-medium text-text-secondary">
                                                                {listaNomes}
                                                            </span>
                                                        </div>

                                                        {c.texto_referencia && (
                                                            <div className={`text-caption leading-relaxed break-words rounded-control p-2.5 transition-colors border ${isSelected
                                                                    ? 'bg-amber-100/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 shadow-2xs'
                                                                    : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/90 dark:border-amber-800/40 text-amber-950 dark:text-amber-200'
                                                                }`}>
                                                                <div className="flex items-center gap-1.5 font-medium text-caption text-amber-800 dark:text-amber-300 mb-1">
                                                                    <BookOpen size={12} className="text-amber-700 dark:text-amber-400 shrink-0" />
                                                                    <span>Referência / Citação do Artigo:</span>
                                                                </div>
                                                                <p className="text-caption leading-relaxed italic text-text-secondary dark:text-amber-200/90">
                                                                    "{c.texto_referencia}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <EmptyState
                                                icon={GitPullRequest}
                                                title={selectedTerritory ? `Nenhum arranjo produtivo sediado em ${territoryName}` : 'Nenhum arranjo encontrado'}
                                                description="Tente ajustar os filtros por tipo, segmento ou busca para visualizar resultados."
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

                            {/* ABA 2: SEGMENTOS */}
                            {activeTab === 'segmentos' && (
                                <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
                                    <div className="mb-2.5 shrink-0 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory ? `Segmentos em ${territoryName}` : 'Segmentos Econômicos da Bahia'}
                                            </h3>
                                            <p className="text-caption text-text-secondary font-medium">Distribuição por vocação produtiva</p>
                                        </div>
                                        <Badge variant="neutral" className="tnum">
                                            {segmentStats.length} segmentos
                                        </Badge>
                                    </div>

                                    {/* LEGENDA DE SEGMENTOS: TOP 7 DESTACADOS + DEMAIS SEGMENTOS */}
                                    <div className="flex items-center gap-2.5 text-caption font-medium text-text-muted mb-2 px-0.5 shrink-0 flex-wrap">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: chartTheme.palette?.[0] }}
                                            />
                                            Top 7 segmentos (em destaque)
                                        </span>
                                        <span className="text-border-strong">•</span>
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: neutralSegmentColor }}
                                            />
                                            Demais segmentos
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0 w-full">
                                        {segmentStats.length > 0 ? (
                                            segmentStats.map((seg) => {
                                                const isSelected = selectedSegmento === seg.name;
                                                const dotColor = getSegmentColor(seg.name);

                                                return (
                                                    <div
                                                        key={seg.name}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 56px' }}
                                                        onClick={() => {
                                                            const nextSeg = isSelected ? null : seg.name;
                                                            setSelectedSegmento(nextSeg);
                                                            if (selectedCadeia && nextSeg && selectedCadeia.segmento !== nextSeg) {
                                                                setSelectedCadeia(null);
                                                                setFocusedAsset(null);
                                                            }
                                                        }}
                                                        className={`rounded-card p-3 border transition-all cursor-pointer ${isSelected
                                                                ? (filtroSemiarido ? 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-500 shadow-sm ring-2 ring-amber-500/20' : 'bg-primary-50/40 dark:bg-primary-950/40 border-primary-500 shadow-sm ring-2 ring-primary-500/20')
                                                                : (filtroSemiarido ? 'bg-surface border-border hover:border-amber-300 shadow-card hover:shadow-card-elevated' : 'bg-surface border-border hover:border-primary-200 shadow-card hover:shadow-card-elevated')
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: dotColor }} />
                                                                <span className="text-body-sm font-semibold text-text-primary truncate">{seg.name}</span>
                                                                {!seg.isTop7 && (
                                                                    <span className="text-caption font-medium text-text-muted px-1.5 py-0.5 rounded-control bg-surface-soft border border-border/60 shrink-0">
                                                                        Demais segmentos
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-caption font-medium text-text-secondary tnum">{seg.count} {seg.count === 1 ? 'arranjo' : 'arranjos'}</span>
                                                                <span
                                                                    className="text-caption font-semibold px-2 py-0.5 rounded-full inline-flex items-center justify-center leading-none tnum"
                                                                    style={{ backgroundColor: `${dotColor}20`, color: dotColor }}
                                                                >
                                                                    {seg.percent}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={`w-full h-2 rounded-full overflow-hidden relative flex items-center ${filtroSemiarido ? 'bg-amber-500/10 dark:bg-amber-950/30' : 'bg-surface-sunken'
                                                            }`}>
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${seg.percent}%`, backgroundColor: dotColor }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <EmptyState
                                                icon={Filter}
                                                title="Nenhum segmento encontrado"
                                                description="Não há dados de segmentos para o filtro atual."
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ABA 3: RANKING */}
                            {activeTab === 'ranking' && (
                                <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
                                    <div className="mb-3 shrink-0 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory ? `Ranking Sede Municípios · ${territoryName}` : 'Ranking Sede Territórios'}
                                            </h3>
                                            <p className="text-caption text-text-secondary font-medium">Densidade de arranjos produtivos por sede oficial</p>
                                        </div>
                                        <Badge variant="neutral" className="tnum">
                                            {selectedTerritory ? `${municipalityRanking.length} sedes` : `${territoryRanking.length} territórios`}
                                        </Badge>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 min-h-0 w-full">
                                        {selectedTerritory ? (
                                            municipalityRanking.length > 0 ? (
                                                municipalityRanking.map((m, index) => (
                                                    <div
                                                        key={m.name}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 40px' }}
                                                        onClick={() => {
                                                            const munKey = String(m.name || '').trim();
                                                            const coords = findMunicipioCoords(munKey);
                                                            if (coords) setFocusedAsset(coords);
                                                        }}
                                                        className="flex items-center gap-2 p-1.5 rounded-control hover:bg-surface-soft transition-colors cursor-pointer group"
                                                    >
                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-caption font-bold shrink-0 shadow-xs tnum ${index === 0
                                                                ? (filtroSemiarido ? 'bg-amber-600 text-white' : 'bg-primary-600 text-white')
                                                                : (filtroSemiarido ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30' : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-700/50')
                                                            }`}>
                                                            {m.rank}
                                                        </span>

                                                        <div className={`relative flex-1 h-6 rounded-full overflow-hidden min-w-0 flex items-center ${filtroSemiarido ? 'bg-amber-500/10 dark:bg-amber-950/30' : 'bg-surface-sunken'
                                                            }`}>
                                                            <div
                                                                className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${m.percentBar}%`,
                                                                    backgroundColor: rankingBaseColor,
                                                                    opacity: getRankingBarOpacity(index, municipalityRanking.length)
                                                                }}
                                                            />
                                                            <span className={`relative z-10 px-2.5 text-caption font-medium truncate flex-1 ${filtroSemiarido ? 'text-amber-950 dark:text-amber-100' : 'text-text-primary'
                                                                }`}>
                                                                {m.name}
                                                            </span>
                                                        </div>

                                                        <span className={`h-6 min-w-[34px] px-2 rounded-full text-caption font-semibold flex items-center justify-center tnum shrink-0 ${filtroSemiarido ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25' : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-700/50'
                                                            }`}>
                                                            {m.count}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <EmptyState
                                                    icon={TrendingUp}
                                                    title="Nenhum município com sede registrada"
                                                    description="Não há sedes de arranjos produtivos registradas para este território."
                                                />
                                            )
                                        ) : (
                                            territoryRanking.length > 0 ? (
                                                territoryRanking.map((t, index) => (
                                                    <div
                                                        key={t.id}
                                                        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 40px' }}
                                                        onClick={() => {
                                                            const found = territoriosData.find(x => Number(x.id_territorio) === Number(t.id));
                                                            handleSelectTerritory(found || { id_territorio: t.id, nome_territorio: t.name });
                                                        }}
                                                        className="flex items-center gap-2 p-1.5 rounded-control hover:bg-surface-soft transition-colors cursor-pointer group"
                                                    >
                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-caption font-bold shrink-0 shadow-xs tnum ${index === 0
                                                                ? (filtroSemiarido ? 'bg-amber-600 text-white' : 'bg-primary-600 text-white')
                                                                : (filtroSemiarido ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30' : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-700/50')
                                                            }`}>
                                                            {t.rank}
                                                        </span>

                                                        <div className={`relative flex-1 h-6 rounded-full overflow-hidden min-w-0 flex items-center ${filtroSemiarido ? 'bg-amber-500/10 dark:bg-amber-950/30' : 'bg-surface-sunken'
                                                            }`}>
                                                            <div
                                                                className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${t.percentBar}%`,
                                                                    backgroundColor: rankingBaseColor,
                                                                    opacity: getRankingBarOpacity(index, territoryRanking.length)
                                                                }}
                                                            />
                                                            <span className={`relative z-10 px-2.5 text-caption font-medium truncate flex-1 ${filtroSemiarido ? 'text-amber-950 dark:text-amber-100' : 'text-text-primary'
                                                                }`}>
                                                                {t.name}
                                                            </span>
                                                        </div>

                                                        <span className={`h-6 min-w-[34px] px-2 rounded-full text-caption font-semibold flex items-center justify-center tnum shrink-0 ${filtroSemiarido ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25' : 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-700/50'
                                                            }`}>
                                                            {t.count}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <EmptyState
                                                    icon={TrendingUp}
                                                    title="Nenhum território encontrado"
                                                    description="Não há registros de arranjos produtivos."
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

            </motion.div>

            {/* DRAWER LATERAL DE DETALHES DA CADEIA */}
            <Drawer
                open={Boolean(selectedCadeiaDrawer)}
                onClose={() => setSelectedCadeiaDrawer(null)}
                title={selectedCadeiaDrawer?.entidade || 'Detalhes da Cadeia Produtiva'}
                subtitle={selectedCadeiaDrawer ? `${selectedCadeiaDrawer.tipo} • ${selectedCadeiaDrawer.segmento}` : ''}
                footer={
                    <div className="flex items-center justify-between w-full">
                        {selectedCadeiaDrawer?.fonte ? (
                            <a
                                href={selectedCadeiaDrawer.fonte}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-control font-medium inline-flex items-center justify-center gap-2 h-8 px-3 text-caption bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition-colors"
                            >
                                <span>Acessar Fonte Oficial</span>
                                <ExternalLink size={14} />
                            </a>
                        ) : <div />}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedCadeiaDrawer(null)}
                        >
                            Fechar
                        </Button>
                    </div>
                }
            >
                {selectedCadeiaDrawer && (() => {
                    const tipoVariant = getTipoBadgeVariant(selectedCadeiaDrawer.tipo);
                    const totalAbrangencia = (selectedCadeiaDrawer.municipios_cobertos && selectedCadeiaDrawer.municipios_cobertos.length > 0)
                        ? selectedCadeiaDrawer.municipios_cobertos.length
                        : 1;

                    return (
                        <div className="flex flex-col gap-4 text-body-sm">
                            {/* BADGES PRINCIPAIS */}
                            <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-border/70">
                                <Badge
                                    variant={tipoVariant}
                                    className="text-caption font-semibold"
                                >
                                    {selectedCadeiaDrawer.tipo}
                                </Badge>
                                <Badge
                                    variant="neutral"
                                    className="text-caption font-semibold"
                                    style={{
                                        backgroundColor: `${getSegmentColor(selectedCadeiaDrawer.segmento)}15`,
                                        color: getSegmentColor(selectedCadeiaDrawer.segmento),
                                        borderColor: `${getSegmentColor(selectedCadeiaDrawer.segmento)}35`
                                    }}
                                >
                                    {selectedCadeiaDrawer.segmento}
                                </Badge>
                                {isMunicipioSemiarido(selectedCadeiaDrawer.municipio_sede) && (
                                    <Badge variant="warning" icon={<SunMedium size={12} />} className="text-caption">
                                        Semiárido
                                    </Badge>
                                )}
                            </div>

                            {/* GRID DE METADADOS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="p-3 bg-surface-soft rounded-control border border-border/70">
                                    <span className="text-caption font-medium text-text-muted block mb-0.5">Tipo / Classificação</span>
                                    <p className="font-bold text-text-primary">{selectedCadeiaDrawer.tipo || '—'}</p>
                                </div>

                                <div className="p-3 bg-surface-soft rounded-control border border-border/70">
                                    <span className="text-caption font-medium text-text-muted block mb-0.5">Segmento Produtivo</span>
                                    <p className="font-bold text-text-primary">{selectedCadeiaDrawer.segmento || '—'}</p>
                                </div>

                                <div className="p-3 bg-surface-soft rounded-control border border-border/70">
                                    <span className="text-caption font-medium text-text-muted block mb-0.5">Município Sede</span>
                                    <p className="font-bold text-text-primary flex items-center gap-1.5">
                                        <MapPin size={14} className="text-primary-600" />
                                        {selectedCadeiaDrawer.municipio_sede || '—'}
                                    </p>
                                </div>

                                <div className="p-3 bg-surface-soft rounded-control border border-border/70">
                                    <span className="text-caption font-medium text-text-muted block mb-0.5">Território de Identidade</span>
                                    <p className="font-bold text-text-primary">
                                        {selectedCadeiaDrawer.territorio_identidade || '—'}
                                    </p>
                                </div>
                            </div>

                            {/* MUNICÍPIOS COBERTOS / ABRANGÊNCIA */}
                            <div className="p-3 bg-surface-soft rounded-control border border-border/70 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-caption font-medium text-text-muted">
                                        Municípios Cobertos / Parceiros
                                    </span>
                                    <Badge variant="neutral" className="text-caption tnum font-medium">
                                        {totalAbrangencia} {totalAbrangencia === 1 ? 'município' : 'municípios'}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                                    {selectedCadeiaDrawer.municipios_cobertos && selectedCadeiaDrawer.municipios_cobertos.length > 0 ? (
                                        selectedCadeiaDrawer.municipios_cobertos.map(m => (
                                            <span
                                                key={m.id_municipio || m.nome_municipio}
                                                className="text-caption bg-surface border border-border/60 px-2 py-0.5 rounded-control text-text-primary font-medium"
                                            >
                                                {m.nome_municipio}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-caption bg-surface border border-border/60 px-2 py-0.5 rounded-control text-text-primary font-medium">
                                            {selectedCadeiaDrawer.municipio_sede}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* CITAÇÃO / REFERÊNCIA */}
                            {selectedCadeiaDrawer.texto_referencia && (
                                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-control border border-amber-200/90 dark:border-amber-800/40 text-amber-950 dark:text-amber-200">
                                    <div className="flex items-center gap-1.5 font-medium text-caption text-amber-800 dark:text-amber-300 mb-1">
                                        <BookOpen size={12} className="text-amber-700 dark:text-amber-400 shrink-0" />
                                        <span>Referência / Citação do Artigo</span>
                                    </div>
                                    <p className="text-caption leading-relaxed italic text-text-secondary dark:text-amber-200/90">
                                        "{selectedCadeiaDrawer.texto_referencia}"
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Drawer>

        </main>
    );
}