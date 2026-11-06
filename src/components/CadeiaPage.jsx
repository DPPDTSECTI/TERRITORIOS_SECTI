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
    EmptyState,
    KpiSkeleton,
    AnimatedNumber,
    PillBar,
    ScrollableList
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

function cleanTerritorioName(name) {
    if (!name) return '';
    return String(name)
        .replace(/^territ[oó]rio(\s+de\s+identidade)?\s+/i, '')
        .replace(/^ti\s+/i, '')
        .trim();
}

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
        if (terr && selectedCadeia) return;
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
        setFocusedAsset(null);
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

    // 1. Mapeamento de cores dos segmentos em tons azuis harmonizados (estável entre filtros)
    const { segmentColorMap, neutralSegmentColor } = useMemo(() => {
        const counts = {};
        (enrichedCadeias || []).forEach(c => {
            const seg = c.segmento || 'Outros Segmentos';
            counts[seg] = (counts[seg] || 0) + 1;
        });

        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1]);

        // Paleta em padrão de tons azuis profissionais (ou âmbar no modo semiárido)
        const palette = filtroSemiarido
            ? (chartTheme.goldenPalette || ['#D97706', '#B45309', '#F59E0B', '#92400E', '#FBBF24', '#CA8A04'])
            : (chartTheme.bluePalette || ['#2563EB', '#1D4ED8', '#0284C7', '#1E40AF', '#3B82F6', '#0369A1', '#1E3A8A', '#0EA5E9']);

        const neutral = palette[0] || (filtroSemiarido ? '#D97706' : '#2563EB');

        const colorMap = new Map();
        sorted.forEach(([name], idx) => {
            colorMap.set(name, palette[idx % palette.length] || neutral);
        });

        return {
            segmentColorMap: colorMap,
            neutralSegmentColor: neutral
        };
    }, [enrichedCadeias, chartTheme.bluePalette, chartTheme.goldenPalette, filtroSemiarido]);

    // 2. getSegmentColor estável que consulta o mapa de cores de segmentos
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
            const color = getSegmentColor(name);

            return {
                name,
                count,
                percent,
                color
            };
        });
    }, [baseCadeiasForStats, getSegmentColor]);

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
        let totalCount = 0;

        activeScopedCadeias.forEach(c => {
            const rawName = c.territorio_identidade || c.territorio || '';
            const tClean = cleanTerritorioName(rawName);
            if (!tClean || tClean.toLowerCase() === 'não identificado' || tClean.toLowerCase() === 'bahia') return;

            const normKey = normalizeName(tClean);
            const foundTerr = (territoriosData || []).find(t => {
                const tName = t.nome_territorio || t.territorio || t.nome || '';
                return normalizeName(cleanTerritorioName(tName)) === normKey || (c.id_territorio && Number(t.id_territorio) === Number(c.id_territorio));
            });

            const canonId = foundTerr?.id_territorio || (c.id_territorio ? Number(c.id_territorio) : null);
            const canonName = (foundTerr ? cleanTerritorioName(foundTerr.nome_territorio || foundTerr.territorio || foundTerr.nome) : '') || tClean;
            const uniqueKey = canonId ? `id_${canonId}` : normKey;

            if (!counts[uniqueKey]) {
                counts[uniqueKey] = {
                    id: canonId,
                    name: canonName,
                    count: 0
                };
            }
            counts[uniqueKey].count += 1;
            totalCount += 1;
        });

        const maxCount = Math.max(...Object.values(counts).map(t => t.count), 1);

        return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .map((t, idx) => ({
                ...t,
                rank: idx + 1,
                percentTotal: totalCount > 0 ? ((t.count / totalCount) * 100).toFixed(1) : '0.0',
                percentBar: Math.min(100, (t.count / maxCount) * 100)
            }));
    }, [activeScopedCadeias, territoriosData]);

    const municipalityRanking = useMemo(() => {
        if (!filteredCadeias || filteredCadeias.length === 0) return [];
        const counts = {};
        const targetId = selectedTerritory ? Number(selectedTerritory.id_territorio) : null;
        const targetNome = selectedTerritory ? normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;
        let totalCount = 0;

        filteredCadeias.forEach(c => {
            const matchId = targetId && Number(c.id_territorio) === targetId;
            const matchNome = targetNome && normalizeName(c.territorio_identidade) === targetNome;
            if (!selectedTerritory || matchId || matchNome) {
                const munSede = (c.municipio_sede || c.municipio || '').trim();
                if (!munSede || munSede.toLowerCase() === 'bahia' || munSede.toLowerCase() === 'não identificado') return;
                const normKey = normalizeName(munSede);
                if (!counts[normKey]) {
                    counts[normKey] = {
                        name: munSede,
                        count: 0
                    };
                }
                counts[normKey].count += 1;
                totalCount += 1;
            }
        });

        const maxCount = Math.max(...Object.values(counts).map(c => c.count), 1);

        return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .map((m, idx) => ({
                ...m,
                rank: idx + 1,
                percentTotal: totalCount > 0 ? ((m.count / totalCount) * 100).toFixed(1) : '0.0',
                percentBar: Math.min(100, (m.count / maxCount) * 100)
            }));
    }, [selectedTerritory, filteredCadeias]);

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
            value: loadingStats ? '...' : (selectedTerritory ? `${totalMunicipiosSede} munic.` : `${territoryRanking.length} / ${territoriosData.length || 27}`),
            icon: selectedTerritory ? Building2 : MapPin
        },
        {
            label: filtroSemiarido ? 'Segmentos no Semiárido' : 'Qtd. de Segmentos',
            value: loadingStats ? '...' : segmentStats.length,
            icon: Layers
        },
        {
            label: topSegment ? (filtroSemiarido ? `Principal: ${topSegment.name}` : `Principal: ${topSegment.name}`) : 'Maior Segmento',
            value: loadingStats ? '...' : (topSegment ? `${topSegment.percent}%` : '-'),
            tooltip: topSegment ? `${topSegment.name} (${topSegment.percent}%)` : undefined,
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
                            Módulo de Cadeias Produtivas & IGs
                        </h1>
                    </div>
                    <p className="text-body-sm text-text-secondary mt-1 font-medium">
                        {filtroSemiarido
                            ? 'Mapeamento territorial de APLs e IGs presentes no Semiárido Baiano'
                            : 'Mapeamento territorial de Arranjos Produtivos Locais (APLs) e Indicações Geográficas do Estado da Bahia'}
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

                            return (
                                <motion.div
                                    key={index}
                                    variants={fadeUp}
                                    className="h-full flex flex-col"
                                >
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

            {/* GRID PRINCIPAL: MAPA (40% ou Expandido) + CARDLISTA ou KPIS VERTICAIS */}
            <motion.div
                variants={staggerContainer(0.04)}
                initial="initial"
                animate="animate"
                className="flex-1 min-w-0 flex flex-col lg:flex-row gap-5 relative z-10 min-h-[500px]"
            >

                {/* MAPA DE CADEIAS */}
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
                        filtroSemiarido={filtroSemiarido}
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
                                        Arranjos & IGs
                                    </span>
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

                            <div className="shrink-0">
                                <SearchInput
                                    value={sidebarSearch}
                                    onChange={(e) => setSidebarSearch(e.target.value)}
                                    onClear={() => setSidebarSearch('')}
                                    placeholder="Filtrar arranjo ou cidade..."
                                    size="sm"
                                />
                            </div>
                        </div>

                        {/* BOX 2: LISTA SCROLLÁVEL */}
                        <div className="flex-1 bg-surface rounded-card border border-border shadow-card p-3 flex flex-col min-h-0 min-w-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2 min-h-0">
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
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedCadeia(null);
                                                        setFocusedAsset(null);
                                                    } else {
                                                        setSelectedCadeia(c);
                                                        if (c.lat && c.lng) setFocusedAsset([c.lat, c.lng]);
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
                                                            backgroundColor: getAlphaColor(itemColor),
                                                            color: itemColor
                                                        }}
                                                    >
                                                        <IconComp size={14} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <h5
                                                            title={c.entidade}
                                                            className={`text-caption font-semibold leading-tight truncate transition-colors ${isSelected
                                                                ? (filtroSemiarido ? 'text-amber-800 dark:text-amber-200' : 'text-primary-800 dark:text-primary-200')
                                                                : (filtroSemiarido ? 'text-text-primary group-hover:text-amber-600' : 'text-text-primary group-hover:text-primary-600')
                                                                }`}>
                                                            {c.entidade}
                                                        </h5>
                                                        <span className="text-caption text-text-secondary truncate leading-tight flex items-center gap-1.5 mt-0.5">
                                                            <span className="truncate">
                                                                {c.segmento} • <strong className="font-semibold text-text-primary">{c.municipio_sede}</strong>
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <span className="text-caption font-semibold text-text-muted dark:text-zinc-400 uppercase tracking-wider shrink-0">
                                                    {c.tipo}
                                                </span>
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
                        </div>
                    </motion.div>
                ) : (
                    /* LADO DIREITO: TABS, FILTROS E CONTEÚDO */
                    <motion.div
                        variants={fadeUp}
                        className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0"
                    >
                        {/* BARRA SUPERIOR: TABS + FILTROS AO LADO + BUSCA */}
                        <div className="flex flex-col gap-2.5 shrink-0">
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 min-w-0">
                                <div className="flex items-center gap-2.5 flex-nowrap min-w-0 overflow-x-auto scrollbar-none">
                                    <Tabs
                                        items={[
                                            {
                                                id: 'catalogo',
                                                label: 'Catálogo',
                                                icon: <GitPullRequest size={15} />
                                            },
                                            {
                                                id: 'segmentos',
                                                label: 'Segmentos',
                                                icon: <Layers size={15} />
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
                                        className="shrink-0"
                                        isSemiarido={filtroSemiarido}
                                        trailing={activeTab === 'catalogo' ? (
                                            <div className="h-full inline-flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTipo('todos')}
                                                    className={`relative h-full inline-flex items-center justify-center px-3.5 rounded-full text-caption font-medium transition-colors duration-120 whitespace-nowrap select-none cursor-pointer ${
                                                        selectedTipo === 'todos'
                                                            ? (filtroSemiarido
                                                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white font-semibold shadow-xs'
                                                                : 'bg-carbon dark:bg-primary-600 text-white font-semibold shadow-xs')
                                                            : (filtroSemiarido
                                                                ? 'text-amber-900/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
                                                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft dark:hover:bg-surface-raised/70')
                                                    }`}
                                                >
                                                    Todos
                                                </button>
                                                {availableTipos.map((tipo) => {
                                                    const isSelected = selectedTipo === tipo;
                                                    return (
                                                        <button
                                                            key={tipo}
                                                            type="button"
                                                            onClick={() => setSelectedTipo(isSelected ? 'todos' : tipo)}
                                                            className={`relative h-full inline-flex items-center justify-center px-3.5 rounded-full text-caption font-medium transition-colors duration-120 whitespace-nowrap select-none cursor-pointer ${
                                                                isSelected
                                                                    ? (filtroSemiarido
                                                                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white font-semibold shadow-xs'
                                                                        : 'bg-carbon dark:bg-primary-600 text-white font-semibold shadow-xs')
                                                                    : (filtroSemiarido
                                                                        ? 'text-amber-900/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
                                                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft dark:hover:bg-surface-raised/70')
                                                            }`}
                                                        >
                                                            {tipo}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : null}
                                    />
                                </div>

                                {/* BUSCA COM ATALHO "/" E BOTÃO LIMPAR */}
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
                                        placeholder="Buscar cadeia, segmento ou cidade... (/)"
                                        size="sm"
                                    />
                                </div>
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
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedSegmento && (
                                                <Badge
                                                    variant="neutral"
                                                    icon={<Layers size={12} />}
                                                    className="h-6 inline-flex items-center cursor-pointer hover:opacity-80"
                                                    onClick={() => setSelectedSegmento(null)}
                                                    title="Clique para remover filtro de segmento"
                                                >
                                                    <span className="max-w-[140px] truncate">{selectedSegmento}</span>
                                                    <span className="ml-0.5 font-bold text-text-muted hover:text-text-primary text-[11px] leading-none">×</span>
                                                </Badge>
                                            )}
                                            {selectedTerritory && (
                                                <Badge
                                                    variant={filtroSemiarido ? 'warning' : 'primary'}
                                                    icon={<MapPin size={12} />}
                                                    className="h-6 inline-flex items-center cursor-pointer hover:opacity-80"
                                                    onClick={() => handleSelectTerritory(null)}
                                                    title="Clique para remover filtro de território"
                                                >
                                                    <span className="max-w-[140px] truncate">{territoryName}</span>
                                                    <span className="ml-0.5 font-bold opacity-60 hover:opacity-100 text-[11px] leading-none">×</span>
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <ScrollableList
                                        ref={catalogListRef}
                                        filtroSemiarido={filtroSemiarido}
                                        resetKey={`${selectedTipo}-${selectedSegmento}-${territoryName}-${searchQuery}`}
                                        className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2.5 min-h-0 w-full pb-2"
                                    >
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
                                                                setFocusedAsset(null);
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
                                                                        <span className="font-medium text-text-secondary dark:text-zinc-300">
                                                                            {c.segmento}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span className="font-semibold text-text-primary">{c.municipio_sede}</span>
                                                                        <span>•</span>
                                                                        <span className="text-text-muted">{c.territorio_identidade}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 shrink-0 self-start mt-0.5">
                                                                <span className="text-caption font-semibold text-text-muted dark:text-zinc-400 uppercase tracking-wider shrink-0">
                                                                    {c.tipo}
                                                                </span>
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

                                                        <div className={`text-caption leading-relaxed break-words rounded-subcard px-3.5 py-2.5 transition-colors border ${isSelected
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
                                                            <div className={`text-caption leading-relaxed break-words rounded-subcard px-3.5 py-2.5 transition-colors border ${isSelected
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
                                    </ScrollableList>
                                </div>
                            )}

                            {/* ABA 2: SEGMENTOS */}
                            {activeTab === 'segmentos' && (
                                <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
                                    <div className="mb-3 shrink-0 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory ? `Segmentos em ${territoryName}` : 'Segmentos Econômicos da Bahia'}
                                            </h3>
                                            <p className="text-caption text-text-secondary font-medium">Distribuição por vocação produtiva</p>
                                        </div>
                                        {selectedTerritory && (
                                            <Badge
                                                variant={filtroSemiarido ? 'warning' : 'primary'}
                                                icon={<MapPin size={12} />}
                                                className="h-6 inline-flex items-center cursor-pointer hover:opacity-80"
                                                onClick={() => handleSelectTerritory(null)}
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
                                        className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2 min-h-0 w-full"
                                    >
                                        {segmentStats.length > 0 ? (
                                            segmentStats.map((seg, idx) => {
                                                const isSelected = selectedSegmento === seg.name;
                                                const dotColor = getSegmentColor(seg.name);
                                                const totalDensity = baseCadeiasForStats.length || segmentStats.reduce((acc, s) => acc + s.count, 0) || 1;
                                                const remaining = Math.max(0, totalDensity - seg.count);

                                                const negPillStyle = filtroSemiarido
                                                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25'
                                                    : 'bg-surface-soft text-text-secondary border border-border';
                                                const totalPillStyle = filtroSemiarido
                                                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/40'
                                                    : 'bg-surface-soft text-text-primary border border-border';

                                                return (
                                                    <div
                                                        key={seg.name}
                                                        onClick={() => {
                                                            const nextSeg = isSelected ? null : seg.name;
                                                            setSelectedSegmento(nextSeg);
                                                            if (selectedCadeia && nextSeg && selectedCadeia.segmento !== nextSeg) {
                                                                setSelectedCadeia(null);
                                                                setFocusedAsset(null);
                                                            }
                                                        }}
                                                        className={`p-2 rounded-xl transition-all cursor-pointer border ${isSelected
                                                            ? (filtroSemiarido ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/20 shadow-xs' : 'bg-primary-50/60 dark:bg-primary-950/40 border-primary-400 ring-2 ring-primary-500/20 shadow-xs')
                                                            : (filtroSemiarido ? 'bg-surface border-transparent hover:bg-amber-50/30 dark:hover:bg-amber-950/20 hover:border-amber-200' : 'bg-surface border-transparent hover:bg-surface-soft hover:border-border')
                                                        }`}
                                                    >
                                                        {/* RÓTULO COM NOME DO SEGMENTO */}
                                                        <div className="text-caption font-semibold text-text-primary leading-tight flex items-center justify-between mb-1 px-0.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="truncate">{seg.name}</span>
                                                            </div>
                                                            <span className="text-caption text-text-muted tabular-nums shrink-0 ml-2">
                                                                {seg.count} {seg.count === 1 ? 'arranjo' : 'arranjos'}
                                                            </span>
                                                        </div>

                                                        {/* BARRAS DE PÍLULAS */}
                                                        <PillBar
                                                            value={seg.count}
                                                            totalScoped={totalDensity}
                                                            remaining={remaining}
                                                            percent={seg.percent}
                                                            color={dotColor}
                                                            negPillStyle={negPillStyle}
                                                            totalPillStyle={totalPillStyle}
                                                            index={idx}
                                                            valueTitle={`${seg.name}: ${seg.count} arranjos (${seg.percent}%)`}
                                                            percentTitle={`${seg.percent}% da densidade (${seg.count} arranjos)`}
                                                        />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                <EmptyState
                                                    icon={Filter}
                                                    title="Nenhum segmento encontrado"
                                                    description="Não há dados de segmentos para o filtro atual."
                                                />
                                            </div>
                                        )}
                                    </ScrollableList>
                                </div>
                            )}

                            {/* ABA 3: RANKING */}
                            {activeTab === 'ranking' && (
                                <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
                                    <div className="mb-3 shrink-0 flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-body-sm font-semibold text-text-primary">
                                                {selectedTerritory ? `Ranking Sede Municípios · ${territoryName}` : 'Ranking Sede Territórios'}
                                            </h3>
                                            <p className="text-caption text-text-secondary font-medium">
                                                Densidade de arranjos produtivos por sede oficial
                                            </p>
                                        </div>

                                        {selectedTerritory && (
                                            <button
                                                type="button"
                                                onClick={() => handleSelectTerritory(null)}
                                                className={`text-caption font-medium px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer justify-center leading-none ${filtroSemiarido
                                                    ? 'text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 bg-amber-100/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-700/50'
                                                    : 'text-primary-700 dark:text-primary-300 hover:text-primary-900 dark:hover:text-primary-100 hover:underline bg-primary-200/50 dark:bg-primary-950/40'
                                                    }`}
                                            >
                                                ← Ver Todos os Territórios
                                            </button>
                                        )}
                                    </div>

                                    <ScrollableList
                                        key={selectedTerritory ? `ranking-muni-${selectedTerritory.id_territorio || 'muni'}` : 'ranking-territorios'}
                                        filtroSemiarido={filtroSemiarido}
                                        resetKey={territoryName}
                                        className="flex-1 overflow-y-auto pr-2.5 flex flex-col gap-2 min-h-0 w-full pb-2"
                                    >
                                        {selectedTerritory ? (
                                            municipalityRanking.length > 0 ? (
                                                municipalityRanking.map((m, idx) => {
                                                    const totalMunCount = municipalityRanking.reduce((acc, x) => acc + x.count, 0) || 1;
                                                    const remaining = Math.max(0, totalMunCount - m.count);

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
                                                                const coords = findMunicipioCoords(munKey);
                                                                if (coords) setFocusedAsset(coords);
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
                                                                    {m.count} {m.count === 1 ? 'arranjo' : 'arranjos'}
                                                                </span>
                                                            </div>

                                                            {/* BARRAS DE PÍLULAS */}
                                                            <PillBar
                                                                value={m.count}
                                                                totalScoped={totalMunCount}
                                                                remaining={remaining}
                                                                percent={m.percentTotal}
                                                                color={posPillColor}
                                                                negPillStyle={negPillStyle}
                                                                totalPillStyle={totalPillStyle}
                                                                index={idx}
                                                                valueTitle={`${m.name}: ${m.count} arranjos (${m.percentTotal}%)`}
                                                                percentTitle={`${m.percentTotal}% do território (${m.count} arranjos)`}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                    <EmptyState
                                                        icon={TrendingUp}
                                                        title="Nenhum município com sede registrada"
                                                        description="Não há sedes de arranjos produtivos registradas para este território."
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
                                                    const totalTerrCount = territoryRanking.reduce((acc, x) => acc + x.count, 0) || 1;
                                                    const remaining = Math.max(0, totalTerrCount - t.count);

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
                                                                handleSelectTerritory(found || { id_territorio: t.id, nome_territorio: t.name });
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
                                                                    {t.count} {t.count === 1 ? 'arranjo' : 'arranjos'}
                                                                </span>
                                                            </div>

                                                            {/* BARRAS DE PÍLULAS */}
                                                            <PillBar
                                                                value={t.count}
                                                                totalScoped={totalTerrCount}
                                                                remaining={remaining}
                                                                percent={t.percentTotal}
                                                                color={posPillColor}
                                                                negPillStyle={negPillStyle}
                                                                totalPillStyle={totalPillStyle}
                                                                index={idx}
                                                                valueTitle={`${t.name}: ${t.count} arranjos (${t.percentTotal}%)`}
                                                                percentTitle={`${t.percentTotal}% do estado (${t.count} arranjos)`}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center p-8">
                                                    <EmptyState
                                                        icon={TrendingUp}
                                                        title="Nenhum território encontrado"
                                                        description="Não há registros de arranjos produtivos."
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