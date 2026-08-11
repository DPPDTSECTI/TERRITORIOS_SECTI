import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import * as topojson from 'topojson-client';
import { forceSimulation, forceCollide, forceX, forceY } from 'd3-force';
import territoriosMunicipios from './utils/territorioMunicipios.json';

const SVG_W = 800;
const SVG_H = 800;
const PADDING = 20;

const LABEL_COLLISION_PADDING = 2; 
const LABEL_FORCE_STRENGTH = 0.45; 
const SIMULATION_ITERATIONS = 250; 

// Paleta Categórica Linear UI
const TERRITORY_COLORS = [
    '#5E6AD2', '#26B5CE', '#F2A65A', '#E76E50', '#8D34F9', '#F94D67', 
    '#24C38E', '#F0D45E', '#55A4F9', '#B574F2', '#4CBF99', '#E2805F', 
    '#6875F5', '#D65B82', '#43A047', '#F4923C', '#3984DA', '#9E57E5', 
    '#14B8A6', '#EF4444', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', 
    '#EC4899', '#6366F1', '#06B6D4' 
];

const GEOGRAPHICAL_ORDER = [
    'Bacia do Rio Grande', 'Bacia do Rio Corrente', 'Velho Chico', 'Sertão do São Francisco',
    'Piemonte Norte do Itapicuru', 'Itaparica', 'Irecê', 'Chapada Diamantina',
    'Piemonte da Diamantina', 'Sisal', 'Bacia do Jacuípe', 'Semiárido Nordeste II',
    'Litoral Norte e Agreste Baiano', 'Portal do Sertão', 'Metropolitano de Salvador',
    'Recôncavo', 'Baixo Sul', 'Vale do Jiquiriçá', 'Piemonte do Paraguaçu',
    'Médio Rio de Contas', 'Sudoeste Baiano', 'Sertão Produtivo', 'Bacia do Paramirim',
    'Médio Sudoeste da Bahia', 'Litoral Sul', 'Costa do Descobrimento', 'Extremo Sul'
];

function normalizeName(value) {
    if (!value) return '';
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function wrapText(text) {
    if (!text) return [];
    const words = text.split(' ');
    if (words.length <= 2) return [text];
    if (words.length === 3) return [words[0] + ' ' + words[1], words[2]];
    const half = Math.ceil(words.length / 2);
    return [words.slice(0, half).join(' '), words.slice(half).join(' ')];
}

const getTerritoryKey = (value) => normalizeName(value);

const sortedTerritories = [...territoriosMunicipios.territorios_de_identidade].sort((a, b) => {
    const indexA = GEOGRAPHICAL_ORDER.indexOf(a.nome);
    const indexB = GEOGRAPHICAL_ORDER.indexOf(b.nome);
    if (indexA === -1) return 1; 
    if (indexB === -1) return -1;
    return indexA - indexB;
});

const territoryColorMap = {};
sortedTerritories.forEach((territorio, index) => {
    territoryColorMap[getTerritoryKey(territorio.nome)] = TERRITORY_COLORS[index] || '#333333';
});

const buildMunicipioTerritoryMap = () => {
    const m = {};
    territoriosMunicipios.territorios_de_identidade.forEach((territorio) => {
        territorio.municipios.forEach((municipio) => { m[normalizeName(municipio)] = territorio.nome; });
    });
    return m;
};

const getPathD = (geometry, project) => {
    if (!geometry) return '';
    if (geometry.type === 'Polygon') {
        return geometry.coordinates.map((ring) => ring.map(([x, y], i) => {
            const [px, py] = project([x, y]); return `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`;
        }).join(' ') + ' Z').join(' ');
    }
    if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.flatMap((polygon) => polygon.map((ring) => ring.map(([x, y], i) => {
            const [px, py] = project([x, y]); return `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`;
        }).join(' ') + ' Z')).join(' ');
    }
    return '';
};

// ================= COMPONENTE DE PATH (MUNICÍPIO) =================
const MunicipioPath = React.memo(function MunicipioPath({
    feat, d, fill, stroke, strokeWidth, opacity, blockClickAndColor, isHovered,
    onEnter, onLeave, onClick,
}) {
    return (
        <path
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="outline-none"
            style={{
                pointerEvents: blockClickAndColor ? 'none' : 'auto',
                cursor: blockClickAndColor ? 'default' : 'pointer',
                transform: isHovered ? 'translateY(-3px)' : 'translateY(0px)',
                filter: isHovered ? 'drop-shadow(0px 8px 12px rgba(0,0,0,0.8))' : 'none',
                transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.25s ease, fill 0.2s ease, opacity 0.2s ease'
            }}
            opacity={opacity}
            onMouseEnter={(e) => onEnter(e, feat)}
            onMouseMove={(e) => onEnter(e, feat)}
            onMouseLeave={onLeave}
            onClick={(e) => { e.stopPropagation(); onClick(feat, blockClickAndColor); }}
        />
    );
});

// ================= MAPA PRINCIPAL =================
const PtiMap = React.memo(function PtiMap({
    territoriosData = [], territoriesDynamicStats = {}, searchTerm = '',
    filtroSemiarido = false, selectedTerritory = null,
    onSelectTerritory = () => { }, semiaridoMunicipios = []
}) {
    const [mapFeatures, setMapFeatures] = useState([]);
    const [territoryLabels, setTerritoryLabels] = useState([]);
    const [hoveredTerritory, setHoveredTerritory] = useState(null);
    const [hoveredMunicipality, setHoveredMunicipality] = useState(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
    const [loading, setLoading] = useState(true);

    const [userScale, setUserScale] = useState(1);
    const [userPan, setUserPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isMunListExpanded, setIsMunListExpanded] = useState(false);

    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const dragTotal = useRef(0);
    const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);

    const userPanRef = useRef(userPan);
    const userScaleRef = useRef(userScale);
    const pendingPan = useRef(null);
    const pendingScale = useRef(null);
    const rafPanId = useRef(null);
    const rafScaleId = useRef(null);

    useEffect(() => { userPanRef.current = userPan; }, [userPan]);
    useEffect(() => { userScaleRef.current = userScale; }, [userScale]);

    useEffect(() => () => {
        if (rafPanId.current) cancelAnimationFrame(rafPanId.current);
        if (rafScaleId.current) cancelAnimationFrame(rafScaleId.current);
    }, []);

    useEffect(() => {
        setUserScale(1);
        setUserPan({ x: 0, y: 0 });
        setIsMunListExpanded(false);
    }, [selectedTerritory]);

    useEffect(() => {
        setLoading(true);
        fetch('/BA_(1)9396399957704198.json')
            .then((resp) => resp.json())
            .then((topology) => {
                const geo = topojson.feature(topology, topology.objects.BA);
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                geo.features.forEach((feat) => {
                    if (!feat.geometry) return;
                    const coords = feat.geometry.type === 'Polygon' ? feat.geometry.coordinates.flat() : feat.geometry.coordinates.flat(2);
                    coords.forEach(([x, y]) => {
                        if (x < minX) minX = x; if (x > maxX) maxX = x;
                        if (y < minY) minY = y; if (y > maxY) maxY = y;
                    });
                });

                const width = SVG_W - 2 * PADDING; const height = SVG_H - 2 * PADDING;
                const scaleX = width / (maxX - minX); const scaleY = height / (maxY - minY);
                const scale = Math.min(scaleX, scaleY);
                const project = ([x, y]) => [PADDING + (x - minX) * scale + (width - (maxX - minX) * scale) / 2, PADDING + (maxY - y) * scale + (height - (maxY - minY) * scale) / 2];

                const tLabelsData = {};

                const features = geo.features.map((feat) => {
                    const municipio = feat.properties?.NOME || feat.properties?.nome || '';
                    const territoryName = municipioTerritoryMap[normalizeName(municipio)] || 'Sem Território';
                    const tKey = getTerritoryKey(territoryName);

                    let fMinX = Infinity, fMaxX = -Infinity, fMinY = Infinity, fMaxY = -Infinity;
                    let bestCx = 0, bestCy = 0, maxArea = -1;

                    if (feat.geometry) {
                        let rings = [];
                        if (feat.geometry.type === 'Polygon') {
                            rings = [feat.geometry.coordinates[0]];
                        } else if (feat.geometry.type === 'MultiPolygon') {
                            rings = feat.geometry.coordinates.map(p => p[0]);
                        } else {
                            const coords = feat.geometry.coordinates.flat(2);
                            rings = [coords];
                        }

                        rings.forEach(ring => {
                            if (!ring || ring.length === 0) return;
                            let rMinX = Infinity, rMaxX = -Infinity, rMinY = Infinity, rMaxY = -Infinity;
                            let sumX = 0, sumY = 0, count = 0;

                            ring.forEach(([x, y]) => {
                                const [px, py] = project([x, y]);
                                if (px < fMinX) fMinX = px; if (px > fMaxX) fMaxX = px;
                                if (py < fMinY) fMinY = py; if (py > fMaxY) fMaxY = py;
                                if (px < rMinX) rMinX = px; if (px > rMaxX) rMaxX = px;
                                if (py < rMinY) rMinY = py; if (py > rMaxY) rMaxY = py;
                                sumX += px; sumY += py; count++;
                            });

                            const area = (rMaxX - rMinX) * (rMaxY - rMinY);
                            if (area > maxArea && count > 0) {
                                maxArea = area;
                                bestCx = sumX / count;
                                bestCy = sumY / count;
                            }
                        });
                    }

                    const cx = bestCx || (fMinX + fMaxX) / 2;
                    const cy = bestCy || (fMinY + fMaxY) / 2;

                    if (!tLabelsData[tKey]) tLabelsData[tKey] = { sumX: 0, sumY: 0, count: 0, name: territoryName };
                    tLabelsData[tKey].sumX += cx; tLabelsData[tKey].sumY += cy; tLabelsData[tKey].count += 1;

                    const d = getPathD(feat.geometry, project);
                    return { nome: municipio, territory: territoryName, d, cx, cy, fBounds: { minX: fMinX, maxX: fMaxX, minY: fMinY, maxY: fMaxY } };
                });

                const labels = Object.values(tLabelsData).map(t => ({ name: t.name, x: t.sumX / t.count, y: t.sumY / t.count }));

                setMapFeatures(features);
                setTerritoryLabels(labels);
                setLoading(false);
            }).catch((err) => { console.error("Erro ao carregar mapa:", err); setLoading(false); });
    }, [municipioTerritoryMap]);

    // ================= ORDENAÇÃO DINÂMICA (Z-INDEX DO SVG) =================
    // O SVG desenha o que está no final da lista por cima de tudo.
    // Separamos as features em camadas de prioridade para os itens com "hover" ou selecionados ficarem por cima.
    const featuresToRender = useMemo(() => {
        return [...mapFeatures].sort((a, b) => {
            const aIsHovered = hoveredTerritory === a.territory || hoveredMunicipality === a.nome;
            const bIsHovered = hoveredTerritory === b.territory || hoveredMunicipality === b.nome;
            
            const aIsSelected = selectedTerritory && getTerritoryKey(selectedTerritory.nome) === getTerritoryKey(a.territory);
            const bIsSelected = selectedTerritory && getTerritoryKey(selectedTerritory.nome) === getTerritoryKey(b.territory);

            const scoreA = (aIsHovered ? 2 : 0) + (aIsSelected ? 1 : 0);
            const scoreB = (bIsHovered ? 2 : 0) + (bIsSelected ? 1 : 0);

            return scoreA - scoreB;
        });
    }, [mapFeatures, hoveredTerritory, hoveredMunicipality, selectedTerritory]);

    const { calcBoundsGlobal, calcBoundsSemi } = useMemo(() => {
        const tB = {}; const tBS = {};
        mapFeatures.forEach(feat => {
            const tKey = getTerritoryKey(feat.territory);
            const isMunSemi = semiaridoMunicipios.includes(normalizeName(feat.nome));

            if (!tB[tKey]) tB[tKey] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, area: 0 };
            if (!tBS[tKey]) tBS[tKey] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

            const updateBounds = (b) => {
                if (feat.fBounds.minX < b.minX) b.minX = feat.fBounds.minX;
                if (feat.fBounds.maxX > b.maxX) b.maxX = feat.fBounds.maxX;
                if (feat.fBounds.minY < b.minY) b.minY = feat.fBounds.minY;
                if (feat.fBounds.maxY > b.maxY) b.maxY = feat.fBounds.maxY;
                b.area = (b.maxX - b.minX) * (b.maxY - b.minY);
            };

            updateBounds(tB[tKey]);
            if (isMunSemi) updateBounds(tBS[tKey]);
        });
        return { calcBoundsGlobal: tB, calcBoundsSemi: tBS };
    }, [mapFeatures, semiaridoMunicipios]);

    const baseTransform = useMemo(() => {
        if (!selectedTerritory || Object.keys(calcBoundsGlobal).length === 0) return { tx: 0, ty: 0, scale: 1 };

        const tKey = getTerritoryKey(selectedTerritory.nome);
        let bounds = calcBoundsGlobal[tKey];

        if (filtroSemiarido && calcBoundsSemi[tKey] && calcBoundsSemi[tKey].minX !== Infinity) {
            bounds = calcBoundsSemi[tKey];
        }

        if (!bounds || bounds.minX === Infinity) return { tx: 0, ty: 0, scale: 1 };

        const w = bounds.maxX - bounds.minX;
        const h = bounds.maxY - bounds.minY;
        const cx = bounds.minX + w / 2;
        const cy = bounds.minY + h / 2;

        const availableWidth = SVG_W - 280;
        const scale = Math.min(availableWidth / w, SVG_H / h) * 0.88;
        const clampedScale = Math.min(scale, 8);

        const tx = (availableWidth / 2) - cx * clampedScale;
        const ty = (SVG_H / 2) - cy * clampedScale;

        return { tx, ty, scale: clampedScale };
    }, [selectedTerritory, calcBoundsGlobal, calcBoundsSemi, filtroSemiarido]);

    const effectiveScale = userScale * baseTransform.scale;

    const laidOutLabels = useMemo(() => {
        if (territoryLabels.length === 0) return [];
        const fontSize = 16 / baseTransform.scale;
        const lineHeight = fontSize * 1.1;

        const nodes = territoryLabels.map(label => {
            const lines = wrapText(label.name);
            const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
            const width = longestLine.length * fontSize * 0.55 + LABEL_COLLISION_PADDING;
            const height = lines.length * lineHeight + LABEL_COLLISION_PADDING;
            return {
                id: getTerritoryKey(label.name),
                idealX: label.x, idealY: label.y,
                x: label.x, y: label.y,
                width, height, radius: Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2)),
                lines, name: label.name,
            };
        });

        const simulation = forceSimulation(nodes)
            .force('collide', forceCollide(d => d.radius).strength(1))
            .force('x', forceX(d => d.idealX).strength(LABEL_FORCE_STRENGTH))
            .force('y', forceY(d => d.idealY).strength(LABEL_FORCE_STRENGTH))
            .stop();

        for (let i = 0; i < SIMULATION_ITERATIONS; ++i) simulation.tick();

        const maxDist = 20 / baseTransform.scale;
        nodes.forEach(node => {
            const dx = node.x - node.idealX; const dy = node.y - node.idealY;
            const dist = Math.hypot(dx, dy);
            if (dist > maxDist) {
                node.x = node.idealX + (dx / dist) * maxDist;
                node.y = node.idealY + (dy / dist) * maxDist;
            }
        });
        return nodes;
    }, [territoryLabels, baseTransform.scale]);

    const laidOutMunicipalityLabels = useMemo(() => {
        if (!selectedTerritory || mapFeatures.length === 0) return [];
        const fontSize = 14 / baseTransform.scale;
        const lineHeight = fontSize * 1.1;
        const visibleMunicipalities = mapFeatures.filter(f => {
            const isSameTerritory = getTerritoryKey(f.territory) === getTerritoryKey(selectedTerritory.nome);
            if (!isSameTerritory) return false;
            const isMunSemi = semiaridoMunicipios.includes(normalizeName(f.nome));
            if (filtroSemiarido && !isMunSemi) return false;
            return true;
        });

        const nodes = visibleMunicipalities.map(feat => {
            const lines = wrapText(feat.nome);
            const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
            const width = longestLine.length * fontSize * 0.55 + LABEL_COLLISION_PADDING;
            const height = lines.length * lineHeight + LABEL_COLLISION_PADDING;
            return {
                id: normalizeName(feat.nome),
                idealX: feat.cx, idealY: feat.cy,
                x: feat.cx, y: feat.cy,
                width, height, radius: Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2)),
                lines, name: feat.nome,
            };
        });

        const simulation = forceSimulation(nodes)
            .force('collide', forceCollide(d => d.radius).strength(1))
            .force('x', forceX(d => d.idealX).strength(LABEL_FORCE_STRENGTH))
            .force('y', forceY(d => d.idealY).strength(LABEL_FORCE_STRENGTH))
            .stop();

        for (let i = 0; i < SIMULATION_ITERATIONS; ++i) simulation.tick();

        const maxMunDist = 15 / baseTransform.scale;
        nodes.forEach(node => {
            const dx = node.x - node.idealX; const dy = node.y - node.idealY;
            const dist = Math.hypot(dx, dy);
            if (dist > maxMunDist) {
                node.x = node.idealX + (dx / dist) * maxMunDist;
                node.y = node.idealY + (dy / dist) * maxMunDist;
            }
        });
        return nodes;
    }, [selectedTerritory, mapFeatures, baseTransform.scale, filtroSemiarido, semiaridoMunicipios]);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const handleNativeWheel = (e) => {
            e.preventDefault();
            const zoomFactor = 0.1;
            const delta = e.deltaY < 0 ? 1 + zoomFactor : 1 - zoomFactor;
            const base = pendingScale.current ?? userScaleRef.current;
            pendingScale.current = Math.min(Math.max(base * delta, 0.5), 15);
            if (rafScaleId.current == null) {
                rafScaleId.current = requestAnimationFrame(() => {
                    setUserScale(pendingScale.current);
                    pendingScale.current = null;
                    rafScaleId.current = null;
                });
            }
        };
        svg.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => svg.removeEventListener('wheel', handleNativeWheel);
    }, [loading]);

    const handleMouseDown = (e) => { 
        if (e.button === 0) window.getSelection()?.removeAllRanges();
        setIsDragging(true); 
        dragTotal.current = 0; 
        lastMousePos.current = { x: e.clientX, y: e.clientY }; 
    };
    
    const handleMouseMoveSVG = (e) => {
        if (!isDragging) return;
        window.getSelection()?.removeAllRanges();
        const dx = e.clientX - lastMousePos.current.x; const dy = e.clientY - lastMousePos.current.y;
        dragTotal.current += Math.abs(dx) + Math.abs(dy);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        const base = pendingPan.current ?? userPanRef.current;
        pendingPan.current = { x: base.x + dx, y: base.y + dy };
        if (rafPanId.current == null) {
            rafPanId.current = requestAnimationFrame(() => {
                setUserPan(pendingPan.current);
                pendingPan.current = null;
                rafPanId.current = null;
            });
        }
    };
    
    const handleMouseUp = () => setIsDragging(false);

    const onMapHover = useCallback((e, feat) => {
        if (feat.territory === 'Sem Território' || isDragging) return;

        if (selectedTerritory) {
            const isSameTerritory = getTerritoryKey(feat.territory) === getTerritoryKey(selectedTerritory.nome);
            if (isSameTerritory) {
                setHoveredMunicipality(feat.nome);
                setHoveredTerritory(null);
            } else {
                setTooltip(p => ({ ...p, visible: false }));
                setHoveredMunicipality(null);
                setHoveredTerritory(null);
                return;
            }
        } else {
            setHoveredTerritory(feat.territory);
            setHoveredMunicipality(null);
        }

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const tooltipWidth = 240; const tooltipHeight = 160; const offset = 12;
        let x = e.clientX - rect.left + offset; let y = e.clientY - rect.top + offset;
        if (x + tooltipWidth > rect.width) x = e.clientX - rect.left - tooltipWidth - offset;
        if (y + tooltipHeight > rect.height) y = e.clientY - rect.top - tooltipHeight - offset;

        setTooltip({ visible: true, x, y });
    }, [isDragging, selectedTerritory]);

    const onMapLeave = useCallback(() => {
        setTooltip({ visible: false, x: 0, y: 0 });
        setHoveredTerritory(null);
        setHoveredMunicipality(null);
    }, []);

    const onMapClick = useCallback((feat, blockClickAndColor) => {
        if (dragTotal.current > 10) return;
        if (!blockClickAndColor && feat.territory !== 'Sem Território') {
            const foundData = territoriosData.find(t => getTerritoryKey(t.nome) === getTerritoryKey(feat.territory));
            if (selectedTerritory && getTerritoryKey(selectedTerritory.nome) === getTerritoryKey(feat.territory)) onSelectTerritory(null);
            else onSelectTerritory(foundData);
        }
    }, [territoriosData, selectedTerritory, onSelectTerritory]);

    const hoveredData = hoveredTerritory ? territoriosData.find(t => getTerritoryKey(t.nome) === getTerritoryKey(hoveredTerritory)) : null;
    const dynamicStats = hoveredTerritory ? territoriesDynamicStats[getTerritoryKey(hoveredTerritory)] : null;

    const hoveredMunData = useMemo(() => {
        if (!hoveredMunicipality || !selectedTerritory) return null;
        const munKey = normalizeName(hoveredMunicipality);
        const devData = selectedTerritory.desenvolvimentoDetalhado?.find(d => normalizeName(d.municipio) === munKey);
        const ifdm = devData?.ifdm ? Number(devData.ifdm).toFixed(3) : '-';
        const entidades = selectedTerritory.entidadesDetalhadas?.filter(e => normalizeName(e.municipio) === munKey) || [];
        const cadeias = selectedTerritory.cadeiasProdutivasDetalhado?.filter(c => {
            const sede = normalizeName(c.sede);
            let satelite = normalizeName(c.municipioSatelite || c.municipiosSatelites || c.satelite || '');
            if (typeof c.municipioSatelite === 'object' || Array.isArray(c.municipioSatelite)) satelite = JSON.stringify(c.municipioSatelite).toLowerCase();
            const perts = String(c.municipiosPertencentes || '').split(/[,;\-]/).map(m => normalizeName(m));
            return sede === munKey || satelite.includes(munKey) || perts.includes(munKey);
        }) || [];
        const isSemi = semiaridoMunicipios.includes(munKey);
        return { nome: hoveredMunicipality, ifdm, entidadesCount: entidades.length, cadeiasCount: cadeias.length, isSemi };
    }, [hoveredMunicipality, selectedTerritory, semiaridoMunicipios]);

    const selectedTerritoryMunicipalities = useMemo(() => {
        if (!selectedTerritory) return [];
        const tBase = territoriosMunicipios.territorios_de_identidade.find(t => getTerritoryKey(t.nome) === getTerritoryKey(selectedTerritory.nome));
        if (!tBase) return [];
        let muns = tBase.municipios;
        if (filtroSemiarido) muns = muns.filter(m => semiaridoMunicipios.includes(normalizeName(m)));
        return muns.sort();
    }, [selectedTerritory, filtroSemiarido, semiaridoMunicipios]);

    const municipalitiesToShow = isMunListExpanded ? selectedTerritoryMunicipalities : selectedTerritoryMunicipalities.slice(0, 4);

    return (
        <div ref={containerRef} className="relative isolate w-full h-full min-h-[500px] flex items-center justify-center bg-transparent rounded-md overflow-hidden select-none">
            
            {loading ? (
                <div className="flex flex-col items-center text-white/50">
                    <svg className="animate-spin h-6 w-6 mb-2 text-[#8D34F9]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-[10px] font-medium tracking-widest uppercase">Carregando Malha...</span>
                </div>
            ) : (
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    className={`w-full h-full overflow-visible select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ 
                        userSelect: 'none', 
                        WebkitUserSelect: 'none',
                        transform: 'none',
                        filter: 'drop-shadow(0px 10px 25px rgba(0, 0, 0, 0.5)) drop-shadow(0px 0px 15px rgba(141, 52, 249, 0.1))',
                        transition: 'transform 0.5s ease'
                    }}
                    onMouseDown={handleMouseDown} onMouseMove={handleMouseMoveSVG}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                        handleMouseUp();
                        setTooltip({ visible: false, x: 0, y: 0 });
                        setHoveredTerritory(null);
                        setHoveredMunicipality(null);
                    }}
                >
                    <g style={{ transform: `translate(${userPan.x}px, ${userPan.y}px) scale(${userScale})`, transformOrigin: 'center', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
                        <g style={{ transform: `translate(${baseTransform.tx}px, ${baseTransform.ty}px) scale(${baseTransform.scale})`, transformOrigin: '0 0', transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)' }}>

                            {/* 1. MUNICÍPIOS COM RENDERIZAÇÃO ORDENADA */}
                            {featuresToRender.map((feat) => {
                                const normalizedFeatName = getTerritoryKey(feat.territory);
                                const dStats = territoriesDynamicStats[normalizedFeatName];
                                const matchesFilters = dStats ? dStats.matchesFilters : true;
                                const isSelectedMap = selectedTerritory && getTerritoryKey(selectedTerritory.nome) === normalizedFeatName;
                                const isMunSemi = semiaridoMunicipios.includes(normalizeName(feat.nome));
                                const blockClickAndColor = (filtroSemiarido && !isMunSemi) || (!isSelectedMap && !matchesFilters);
                                const isHovered = !blockClickAndColor && (hoveredTerritory === feat.territory || hoveredMunicipality === feat.nome);

                                let opacity = 0.95;
                                let fillColor = territoryColorMap[normalizedFeatName] || '#333333';

                                if (blockClickAndColor && !selectedTerritory) {
                                    fillColor = '#18181B'; 
                                    opacity = 0.40;
                                } else if (selectedTerritory) {
                                    if (isSelectedMap) {
                                        opacity = 1;
                                        if (filtroSemiarido && isMunSemi) fillColor = '#F59E0B'; 
                                    } else {
                                        fillColor = '#18181B';
                                        opacity = 0.15; 
                                    }
                                } else {
                                    if (isHovered) opacity = 1;
                                }

                                return (
                                    <MunicipioPath
                                        // Usando o nome+território como key para o React não perder a referência durante a ordenação
                                        key={`${feat.nome}-${feat.territory}`}
                                        feat={feat}
                                        d={feat.d}
                                        fill={fillColor}
                                        stroke={isSelectedMap || isHovered ? '#FFFFFF' : '#141415'} 
                                        strokeWidth={isSelectedMap ? 1.5 : isHovered ? 1.5 : 0.5}
                                        opacity={opacity}
                                        blockClickAndColor={blockClickAndColor}
                                        isHovered={isHovered} 
                                        onEnter={onMapHover}
                                        onLeave={onMapLeave}
                                        onClick={onMapClick}
                                    />
                                );
                            })}

                            {/* 2. TEXTOS DOS TERRITÓRIOS: PILLS MODERNAS */}
                            {!selectedTerritory && (
                                <g className="territory-labels-container" style={{ opacity: userScale > 1.05 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: 'none' }}>
                                    {laidOutLabels.map((node, i) => {
                                        const dStats = territoriesDynamicStats[node.id];
                                        if (dStats && !dStats.matchesFilters) return null;

                                        const { x, y, idealX, idealY, lines } = node;
                                        const distance = Math.hypot(x - idealX, y - idealY);
                                        const needsLeaderLine = distance > 14 / baseTransform.scale;

                                        const fontSize = 10 / effectiveScale; 
                                        const lineHeight = fontSize * 1.3;
                                        const paddingX = 12 / effectiveScale;
                                        const paddingY = 6 / effectiveScale;
                                        
                                        const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
                                        const rectWidth = longestLine.length * (fontSize * 0.65) + paddingX * 2;
                                        const rectHeight = lines.length * lineHeight + paddingY;
                                        const rectX = x - rectWidth / 2;
                                        const rectY = y - rectHeight / 2;

                                        const startY = y - ((lines.length - 1) * lineHeight) / 2;

                                        return (
                                            <g key={`t-lbl-${i}`}>
                                                {needsLeaderLine && (
                                                    <g opacity={0.4}>
                                                        <line x1={idealX} y1={idealY} x2={x} y2={y} stroke="#FFFFFF" strokeWidth={1 / effectiveScale} strokeDasharray={`${2 / effectiveScale},${2 / effectiveScale}`} />
                                                        <circle cx={idealX} cy={idealY} r={1.5 / effectiveScale} fill="#FFFFFF" />
                                                    </g>
                                                )}
                                                
                                                <rect 
                                                    x={rectX} y={rectY} 
                                                    width={rectWidth} height={rectHeight} 
                                                    rx={4 / effectiveScale} 
                                                    fill="rgba(24, 24, 27, 0.85)" 
                                                    stroke="rgba(255, 255, 255, 0.15)"
                                                    strokeWidth={1 / effectiveScale}
                                                    filter={`drop-shadow(0px ${4/effectiveScale}px ${8/effectiveScale}px rgba(0,0,0,0.5))`}
                                                />

                                                <text
                                                    x={x} y={y} textAnchor="middle" dominantBaseline="central"
                                                    style={{
                                                        fill: '#F9FAFB', 
                                                        fontSize: `${fontSize}px`, 
                                                        fontWeight: '700',
                                                        letterSpacing: '0.05em',
                                                        textTransform: 'uppercase'
                                                    }}
                                                >
                                                    {lines.map((line, idx) => (
                                                        <tspan key={idx} x={x} y={startY + (idx * lineHeight)}>{line}</tspan>
                                                    ))}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </g>
                            )}

                            {/* 3. TEXTOS DOS MUNICÍPIOS */}
                            {selectedTerritory && (
                                <g style={{ pointerEvents: 'none' }}>
                                    {laidOutMunicipalityLabels.map((node, i) => {
                                        const { x, y, idealX, idealY, lines } = node;
                                        const fontSize = 11 / effectiveScale;
                                        const strokeW = 2.5 / effectiveScale;
                                        const lineHeight = fontSize * 1.1;
                                        const startY = y - ((lines.length - 1) * lineHeight) / 2;
                                        const distance = Math.hypot(x - idealX, y - idealY);
                                        const needsLeaderLine = distance > 10 / baseTransform.scale;

                                        return (
                                            <g key={`m-lbl-${i}`}>
                                                {needsLeaderLine && (
                                                    <g opacity={0.4}>
                                                        <line x1={idealX} y1={idealY} x2={x} y2={y} stroke="#FFFFFF" strokeWidth={0.8 / effectiveScale} strokeDasharray={`${1.5 / effectiveScale},${1.5 / effectiveScale}`} />
                                                        <circle cx={idealX} cy={idealY} r={1 / effectiveScale} fill="#FFFFFF" />
                                                    </g>
                                                )}
                                                <text
                                                    x={x} y={y} textAnchor="middle" dominantBaseline="central"
                                                    style={{
                                                        paintOrder: 'stroke', stroke: '#141415', strokeWidth: `${strokeW}px`, strokeLinejoin: 'round',
                                                        fill: '#FFFFFF', fontSize: `${fontSize}px`, fontWeight: '500',
                                                    }}
                                                >
                                                    {lines.map((line, idx) => (
                                                        <tspan key={idx} x={x} y={startY + (idx * lineHeight)}>{line}</tspan>
                                                    ))}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </g>
                            )}
                        </g>
                    </g>
                </svg>
            )}

            {/* ================= CAIXA LATERAL DE MUNICÍPIOS ================= */}
            {selectedTerritory && selectedTerritoryMunicipalities.length > 0 && (
                <div className="absolute top-4 right-4 z-30 w-56 max-h-[calc(100%-80px)] overflow-y-auto hide-scroll p-3 rounded-md border bg-[#141415] border-white/5 shadow-md transition-all animate-soft-fade">
                    <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">
                        {selectedTerritory.nome}
                    </h4>
                    <ul className="flex flex-col gap-[2px]">
                        {municipalitiesToShow.map((m, idx) => {
                            const isSemi = semiaridoMunicipios.includes(normalizeName(m));
                            return (
                                <li key={idx} className="text-[12px] font-medium flex items-center gap-2 text-white/80 py-1 hover:bg-white/5 rounded-sm px-1 cursor-default transition-colors">
                                    <span className={`shrink-0 w-1.5 h-1.5 rounded-sm ${isSemi ? 'bg-[#F59E0B]' : 'bg-white/20'}`}></span>
                                    <span className="truncate">{m}</span>
                                </li>
                            );
                        })}
                    </ul>
                    {selectedTerritoryMunicipalities.length > 4 && (
                        <button
                            onClick={() => setIsMunListExpanded(!isMunListExpanded)}
                            className="w-full mt-2 text-center text-[10px] font-semibold text-white/50 uppercase tracking-wider py-1.5 rounded-sm bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            {isMunListExpanded ? 'Ver menos' : `Ver mais ${selectedTerritoryMunicipalities.length - 4}`}
                        </button>
                    )}
                </div>
            )}

            {/* ================= LEGENDA ================= */}
            {selectedTerritory && (
                <div className="absolute bottom-4 left-4 z-20 px-3 py-2 rounded-md border bg-[#141415] border-white/5 shadow-md flex flex-col gap-1.5 pointer-events-none transition-all duration-300 animate-soft-fade">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-sm bg-[#F59E0B]"></span>
                        <span className="text-[10px] font-medium text-white/70 tracking-wide">Semiárido</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-sm bg-white/10"></span>
                        <span className="text-[10px] font-medium text-white/40 tracking-wide">Comum</span>
                    </div>
                </div>
            )}

            {/* ================= CONTROLES MANUAIS ================= */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-20">
                <button onClick={() => setUserScale(p => Math.min(p * 1.3, 10))} className="w-7 h-7 rounded-md bg-[#232326] border border-white/5 text-white/60 hover:text-white hover:bg-[#2A2A2E] flex items-center justify-center transition-colors text-sm">+</button>
                <button onClick={() => setUserScale(p => Math.max(p / 1.3, 0.5))} className="w-7 h-7 rounded-md bg-[#232326] border border-white/5 text-white/60 hover:text-white hover:bg-[#2A2A2E] flex items-center justify-center transition-colors text-sm">-</button>
                <button onClick={() => { setUserScale(1); setUserPan({ x: 0, y: 0 }); onSelectTerritory(null); }} className="w-7 h-7 rounded-md bg-[#232326] border border-white/5 text-white/60 hover:text-white hover:bg-[#2A2A2E] flex items-center justify-center transition-colors text-[10px]">↺</button>
            </div>

            {/* ================= TOOLTIP ================= */}
            {tooltip.visible && !isDragging && (hoveredTerritory || hoveredMunicipality) && (
                <div
                    className="absolute z-50 overflow-hidden rounded-md border bg-[#18181B] border-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.4)] pointer-events-none transition-opacity duration-150"
                    style={{ top: tooltip.y, left: tooltip.x, width: 220 }}
                >
                    {hoveredTerritory && hoveredData && dynamicStats && (
                        <>
                            <div className="h-1 w-full" style={{ backgroundColor: territoryColorMap[getTerritoryKey(hoveredData.nome)] || '#8D34F9' }}></div>
                            <div className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="font-semibold text-[12px] text-white/90 leading-tight pr-2">{hoveredData.nome}</h2>
                                    {dynamicStats.pctSemiarido > 0 && (
                                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-sm flex-shrink-0 ${dynamicStats.pctSemiarido >= 100 ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#F59E0B]/80 bg-[#F59E0B]/5'}`}>
                                            {dynamicStats.pctSemiarido >= 100 ? '100%' : `${dynamicStats.pctSemiarido.toFixed(0)}%`} Semi
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-1 mb-1">
                                    <div className="rounded-sm p-1.5 border bg-white/[0.02] border-white/5 flex flex-col">
                                        <span className="text-[9px] text-white/40 mb-0.5">Ativos</span>
                                        <span className="text-[13px] font-semibold text-white/90">{dynamicStats.capacidadeCti}</span>
                                    </div>
                                    <div className="rounded-sm p-1.5 border bg-white/[0.02] border-white/5 flex flex-col">
                                        <span className="text-[9px] text-white/40 mb-0.5">Média IFDM</span>
                                        <span className="text-[13px] font-semibold text-[#8D34F9]">{dynamicStats.ifdm}</span>
                                    </div>
                                </div>
                                <div className="rounded-sm p-1.5 border bg-white/[0.02] border-white/5 flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-white/40">Conecta Bahia</span>
                                    <span className="text-[11px] font-semibold text-[#06B6D4]">{dynamicStats.conectaBahia}</span>
                                </div>
                                <div className="rounded-sm p-1.5 border bg-white/[0.02] border-white/5 flex flex-col">
                                    <span className="text-[9px] text-white/40 mb-0.5">Cadeias Produtivas</span>
                                    <span className="text-[10px] text-white/70 truncate" title={dynamicStats.cadeiasIgs}>{dynamicStats.cadeiasIgs}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {hoveredMunicipality && hoveredMunData && !hoveredTerritory && (
                        <>
                            <div className="h-1 w-full bg-[#06B6D4]"></div>
                            <div className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="font-semibold text-[12px] text-white/90 leading-tight pr-2">{hoveredMunData.nome}</h2>
                                    {hoveredMunData.isSemi && (
                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-sm flex-shrink-0 text-[#F59E0B] bg-[#F59E0B]/10">Semi</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-1 mb-1">
                                    <div className="rounded-sm p-1.5 border bg-white/[0.02] border-white/5 flex flex-col">
                                        <span className="text-[9px] text-white/40 mb-0.5">Ativos CT&I</span>
                                        <span className="text-[13px] font-semibold text-white/90">{hoveredMunData.entidadesCount}</span>
                                    </div>
                                    <div className="rounded-sm p-1.5 border bg-white/[0.02] border-white/5 flex flex-col">
                                        <span className="text-[9px] text-white/40 mb-0.5">Cadeias/IGs</span>
                                        <span className="text-[13px] font-semibold text-white/90">{hoveredMunData.cadeiasCount}</span>
                                    </div>
                                </div>
                                <div className="rounded-sm p-1.5 border bg-white/[0.02] border-white/5 flex justify-between items-center">
                                    <span className="text-[9px] text-white/40">Índice FIRJAN</span>
                                    <span className="text-[11px] font-semibold text-[#8D34F9]">{hoveredMunData.ifdm}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
});

export default PtiMap;