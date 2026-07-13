import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import * as topojson from 'topojson-client';
import { forceSimulation, forceCollide, forceX, forceY } from 'd3-force';
import territoriosMunicipios from './utils/territorioMunicipios.json';

const SVG_W = 800;
const SVG_H = 800;
const PADDING = 20;

// Constantes para o algoritmo de anti-colisão de rótulos
const LABEL_COLLISION_PADDING = 4; // Espaçamento extra entre rótulos
const LABEL_FORCE_STRENGTH = 0.08; // Força que "puxa" o rótulo de volta ao seu centroide
const SIMULATION_ITERATIONS = 250; // Número de iterações da simulação

// Paleta de cores baseada no sistema de design gov.br, ordenada para criar um visual mais harmonioso no mapa.
// Paleta de cores de alto contraste para garantir que territórios adjacentes sejam visualmente distintos.
const TERRITORY_COLORS = [
    // Ciclo 1: Cores primárias e secundárias bem distintas
    '#0174DF', // Azul (gov-blue)
    '#28A745', // Verde (gov-green)
    '#FFC107', // Amarelo (gov-yellow)
    '#DC3545', // Vermelho (gov-red)
    '#6610F2', // Roxo (gov-purple)
    '#17A2B8', // Ciano (gov-cyan)
    '#FD7E14', // Laranja (gov-orange)
    '#E83E8C', // Rosa (gov-pink)

    // Ciclo 2: Tons mais escuros ou secundários das mesmas famílias
    '#004A80', // Azul escuro
    '#1B9A59', // Verde escuro
    '#E0A000', // Amarelo/Mostarda
    '#B02532', // Vermelho escuro
    '#45099A', // Roxo escuro
    '#008B96', // Ciano escuro
    '#CC630C', // Laranja escuro
    '#BF2E73', // Rosa escuro

    // Ciclo 3: Tons intermediários ou restantes
    '#005A9C', // Azul médio
    '#0F8243', // Verde médio
    '#FFB300', // Amarelo-laranja
    '#C42A39', // Vermelho médio
    '#580BC1', // Roxo médio
    '#00A8B5', // Ciano médio
    '#E66F0E', // Laranja médio
    '#D63384', // Rosa médio

    // Cores restantes para completar 27 territórios
    '#003B66', // Azul muito escuro
    '#076833', // Verde muito escuro
    '#7A28D9', // Roxo claro
];

// Ordem geográfica dos territórios para uma paleta de cores mais coesa
const GEOGRAPHICAL_ORDER = [
    'Bacia do Rio Grande',
    'Bacia do Rio Corrente',
    'Velho Chico',
    'Sertão do São Francisco',
    'Piemonte Norte do Itapicuru',
    'Itaparica',
    'Irecê',
    'Chapada Diamantina',
    'Piemonte da Diamantina',
    'Sisal',
    'Bacia do Jacuípe',
    'Semiárido Nordeste II',
    'Litoral Norte e Agreste Baiano',
    'Portal do Sertão',
    'Metropolitano de Salvador',
    'Recôncavo',
    'Baixo Sul',
    'Vale do Jiquiriçá',
    'Piemonte do Paraguaçu',
    'Médio Rio de Contas',
    'Sudoeste Baiano',
    'Sertão Produtivo',
    'Bacia do Paramirim',
    'Médio Sudoeste da Bahia',
    'Litoral Sul',
    'Costa do Descobrimento',
    'Extremo Sul'
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

// Ordena os territórios geograficamente antes de atribuir as cores
const sortedTerritories = [...territoriosMunicipios.territorios_de_identidade].sort((a, b) => {
    const indexA = GEOGRAPHICAL_ORDER.indexOf(a.nome);
    const indexB = GEOGRAPHICAL_ORDER.indexOf(b.nome);
    if (indexA === -1) return 1; // Coloca territórios não listados no final
    if (indexB === -1) return -1;
    return indexA - indexB;
});

const territoryColorMap = {};
sortedTerritories.forEach((territorio, index) => {
    territoryColorMap[getTerritoryKey(territorio.nome)] = TERRITORY_COLORS[index] || '#D1D5DB'; // gray-300
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

// Componente memoizado para cada polígono de município. Evita re-renderizar
// os ~400 <path> quando o pai re-renderiza por motivos que não afetam aquele
// município específico (ex: hover em outro, mudança de tooltip, etc). Como
// pan/zoom agora são throttled via rAF (ver ConectaMap) e a simulação de
// labels não depende mais de effectiveScale, o pai já re-renderiza bem menos —
// este memo é uma segunda camada de proteção para quando ele ainda re-renderizar.
const MunicipioPath = React.memo(function MunicipioPath({
    feat, d, fill, stroke, strokeWidth, opacity, blockClickAndColor,
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
                cursor: blockClickAndColor ? 'default' : 'pointer'
            }}
            opacity={opacity}
            onMouseEnter={(e) => onEnter(e, feat)}
            onMouseMove={(e) => onEnter(e, feat)}
            onMouseLeave={onLeave}
            onClick={(e) => { e.stopPropagation(); onClick(feat, blockClickAndColor); }}
        />
    );
});

export default function ConectaMap({ 
    territoriosData = [], territoriesDynamicStats = {}, searchTerm = '', 
    filtroSemiarido = false, selectedTerritory = null, 
    onSelectTerritory = () => {}, semiaridoMunicipios = [], darkMode = false
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

    // --- Throttle via requestAnimationFrame para pan (arraste) e zoom (scroll) ---
    // Em vez de chamar setState a cada evento de mousemove/wheel (que pode disparar
    // dezenas de re-renders por segundo, cada um reconciliando ~400 <path>), acumulamos
    // o delta em refs e só sincronizamos o estado React uma vez por frame de animação
    // (no máximo ~60x/s), mantendo a fluidez visual e o comportamento reativo idêntico.
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

                    if (feat.geometry) {
                        const coords = feat.geometry.type === 'Polygon' ? feat.geometry.coordinates.flat() : feat.geometry.coordinates.flat(2);
                        coords.forEach(([x, y]) => {
                            const [px, py] = project([x, y]);
                            if (px < fMinX) fMinX = px; if (px > fMaxX) fMaxX = px;
                            if (py < fMinY) fMinY = py; if (py > fMaxY) fMaxY = py;
                        });
                    }

                    const cx = (fMinX + fMaxX) / 2;
                    const cy = (fMinY + fMaxY) / 2;

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
                // Recalcula a área do bounding box
                b.area = (b.maxX - b.minX) * (b.maxY - b.minY);
            };

            updateBounds(tB[tKey]);
            if (isMunSemi) updateBounds(tBS[tKey]);
        });
        return { calcBoundsGlobal: tB, calcBoundsSemi: tBS };
    }, [mapFeatures, semiaridoMunicipios]);

    // === CÂMERA INTELIGENTE ===
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

    // Hook para calcular o layout dos rótulos com anti-colisão
    // IMPORTANTE: usa baseTransform.scale (câmera/território selecionado), não effectiveScale.
    // effectiveScale muda a cada tick da roda do mouse (zoom manual), o que faria a simulação
    // de 250 iterações rodar em todo scroll, travando a interação. baseTransform.scale só
    // muda quando o território selecionado muda, então o layout é recalculado raramente,
    // mas o tamanho visual do texto continua reativo ao zoom (calculado fora do memo, no render).
    const laidOutLabels = useMemo(() => {
        if (territoryLabels.length === 0) return [];

        const fontSize = 16 / baseTransform.scale;
        const lineHeight = fontSize * 1.1;

        // 1. Preparar nós para a simulação
        const nodes = territoryLabels.map(label => {
            const lines = wrapText(label.name);
            const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
            
            // Estimar dimensões do rótulo
            const width = longestLine.length * fontSize * 0.55 + LABEL_COLLISION_PADDING;
            const height = lines.length * lineHeight + LABEL_COLLISION_PADDING;

            return {
                id: getTerritoryKey(label.name),
                idealX: label.x, // Posição ideal (centroide)
                idealY: label.y,
                x: label.x, // Posição inicial
                y: label.y,
                width,
                height,
                radius: Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2)), // Raio para colisão
                lines,
                name: label.name,
            };
        });

        // 2. Configurar e rodar a simulação de força
        const simulation = forceSimulation(nodes)
            .force('collide', forceCollide(d => d.radius).strength(1))
            .force('x', forceX(d => d.idealX).strength(LABEL_FORCE_STRENGTH))
            .force('y', forceY(d => d.idealY).strength(LABEL_FORCE_STRENGTH))
            .stop();

        // Rodar a simulação de forma síncrona
        for (let i = 0; i < SIMULATION_ITERATIONS; ++i) {
            simulation.tick();
        }

        // 3. Retornar os nós com as posições finais calculadas
        return nodes;
    }, [territoryLabels, baseTransform.scale]);

    // Hook para calcular o layout dos rótulos dos MUNICÍPIOS com anti-colisão
    // Mesma correção: usa baseTransform.scale em vez de effectiveScale para não
    // recalcular a simulação a cada tick de zoom manual (userScale).
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
                width, height,
                radius: Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2)),
                lines, name: feat.nome,
            };
        });

        const simulation = forceSimulation(nodes)
            .force('collide', forceCollide(d => d.radius).strength(1))
            .force('x', forceX(d => d.idealX).strength(LABEL_FORCE_STRENGTH))
            .force('y', forceY(d => d.idealY).strength(LABEL_FORCE_STRENGTH))
            .stop();

        for (let i = 0; i < SIMULATION_ITERATIONS; ++i) {
            simulation.tick();
        }

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

            // Só agenda 1 atualização de estado por frame de animação, mesmo que
            // vários eventos de wheel cheguem entre um frame e outro (comum em trackpads).
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

    const handleMouseDown = (e) => { setIsDragging(true); dragTotal.current = 0; lastMousePos.current = { x: e.clientX, y: e.clientY }; };
    const handleMouseMoveSVG = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMousePos.current.x; const dy = e.clientY - lastMousePos.current.y;
        dragTotal.current += Math.abs(dx) + Math.abs(dy);
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        const base = pendingPan.current ?? userPanRef.current;
        pendingPan.current = { x: base.x + dx, y: base.y + dy };

        // Mesma lógica de throttle do zoom: no máximo 1 setState por frame de animação,
        // independente de quantos eventos de mousemove chegarem nesse intervalo.
        if (rafPanId.current == null) {
            rafPanId.current = requestAnimationFrame(() => {
                setUserPan(pendingPan.current);
                pendingPan.current = null;
                rafPanId.current = null;
            });
        }
    };
    const handleMouseUp = () => setIsDragging(false);

    // LÓGICA DE HOVER
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
        
        const tooltipWidth = 260; const tooltipHeight = 180; const offset = 15;
        let x = e.clientX - rect.left + offset; let y = e.clientY - rect.top + offset;
        if (x + tooltipWidth > rect.width) x = e.clientX - rect.left - tooltipWidth - offset;
        if (y + tooltipHeight > rect.height) y = e.clientY - rect.top - tooltipHeight - offset;
        
        setTooltip({ visible: true, x, y });
    }, [isDragging, selectedTerritory]);

    // Handler de saída do hover, estável entre renders (usado pelo MunicipioPath memoizado)
    const onMapLeave = useCallback(() => {
        setTooltip({ visible: false, x: 0, y: 0 });
        setHoveredTerritory(null);
        setHoveredMunicipality(null);
    }, []);

    // Handler de clique num município, estável entre renders (usado pelo MunicipioPath memoizado)
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
            if (typeof c.municipioSatelite === 'object' || Array.isArray(c.municipioSatelite)) {
                satelite = JSON.stringify(c.municipioSatelite).toLowerCase();
            }
            const perts = String(c.municipiosPertencentes || '').split(/[,;\-]/).map(m => normalizeName(m));
            return sede === munKey || satelite.includes(munKey) || perts.includes(munKey);
        }) || [];

        const isSemi = semiaridoMunicipios.includes(munKey);

        return {
            nome: hoveredMunicipality,
            ifdm,
            entidadesCount: entidades.length,
            cadeiasCount: cadeias.length,
            isSemi
        };
    }, [hoveredMunicipality, selectedTerritory, semiaridoMunicipios]);

    const selectedTerritoryMunicipalities = useMemo(() => {
        if (!selectedTerritory) return [];
        const tBase = territoriosMunicipios.territorios_de_identidade.find(t => getTerritoryKey(t.nome) === getTerritoryKey(selectedTerritory.nome));
        if (!tBase) return [];
        
        let muns = tBase.municipios;
        if (filtroSemiarido) {
            muns = muns.filter(m => semiaridoMunicipios.includes(normalizeName(m)));
        }
        return muns.sort();
    }, [selectedTerritory, filtroSemiarido, semiaridoMunicipios]);

    const municipalitiesToShow = isMunListExpanded ? selectedTerritoryMunicipalities : selectedTerritoryMunicipalities.slice(0, 4);

    return (
        <div ref={containerRef} className="relative isolate w-full h-full min-h-[500px] flex items-center justify-center bg-transparent rounded-xl overflow-hidden">
            
            {loading ? (
                <div className="flex flex-col items-center text-gov-blueDark-500">
                    <svg className="animate-spin h-8 w-8 mb-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-semibold tracking-wider uppercase">Carregando Malha...</span>
                </div>
            ) : (
                <svg 
                    ref={svgRef}
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`} 
                    className={`w-full h-full overflow-visible ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
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
                            
                            {/* 1. MUNICÍPIOS (POLÍGONOS) */}
                            {mapFeatures.map((feat, index) => {
                                const normalizedFeatName = getTerritoryKey(feat.territory);
                                
                                // ACESSO AOS CÁLCULOS CRUZADOS DE FILTROS VINDOS DO APP.JSX
                                const dStats = territoriesDynamicStats[normalizedFeatName];
                                const matchesFilters = dStats ? dStats.matchesFilters : true;

                                const isSelectedMap = selectedTerritory && getTerritoryKey(selectedTerritory.nome) === normalizedFeatName;
                                const isMunSemi = semiaridoMunicipios.includes(normalizeName(feat.nome));
                                
                                // A lógica de bloqueio agora considera se um território está selecionado.
                                // Se um território estiver selecionado, não bloqueamos os outros visualmente, apenas a interatividade.
                                const blockClickAndColor = (filtroSemiarido && !isMunSemi) || (!isSelectedMap && !matchesFilters);
                                
                                const isHovered = !blockClickAndColor && (hoveredTerritory === feat.territory || hoveredMunicipality === feat.nome);

                                let opacity = 0.90; 
                                let fillColor = territoryColorMap[normalizedFeatName] || '#E2E8F0';

                                if (blockClickAndColor && !selectedTerritory) {
                                    // Se o bloqueio for pelo filtro do semiárido, apenas diminui a opacidade, mantendo a cor.
                                    if (filtroSemiarido && !isMunSemi) {
                                        opacity = 0.15;
                                    } else { // Se for por outros filtros (CTI, IFDM), deixa cinza.
                                        fillColor = darkMode ? '#374151' : '#E5E7EB'; // gray-700 / gray-200
                                        opacity = 0.1;
                                    }
                                } else if (selectedTerritory) {
                                    if (isSelectedMap) {
                                        opacity = 1;
                                        // A cor laranja do semiárido só se aplica se o filtro estiver ativo.
                                        if (filtroSemiarido && isMunSemi) fillColor = '#FFC107'; // gov-yellow
                                    } else {
                                        fillColor = darkMode ? '#374151' : '#e5e7eb'; // gray-700 / gray-200
                                        opacity = 0.25; // Reduz a opacidade para aumentar o contraste com o selecionado
                                    }
                                } else {
                                    if (isHovered) opacity = 1;
                                }

                                return (
                                    <MunicipioPath
                                        key={`${feat.nome}-${index}`}
                                        feat={feat}
                                        d={feat.d}
                                        fill={fillColor}
                                        stroke={isSelectedMap || isHovered ? (darkMode ? '#000' : '#fff') : (darkMode ? '#111827' : '#F9FAFB')}
                                        strokeWidth={isSelectedMap ? 2 : isHovered ? 2 : 0.8}
                                        opacity={opacity}
                                        blockClickAndColor={blockClickAndColor}
                                        onEnter={onMapHover}
                                        onLeave={onMapLeave}
                                        onClick={onMapClick}
                                    />
                                );
                            })}

                            {/* 2. TEXTOS DOS TERRITÓRIOS (Sem seleção) */}
                            {!selectedTerritory && (
                                <g 
                                    className="territory-labels-container"
                                    style={{ opacity: userScale > 1.05 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: 'none' }}
                                >
                                    {laidOutLabels.map((node, i) => {
                                        // Oculta o texto também se a região estiver bloqueada pelos filtros cruzados
                                        const dStats = territoriesDynamicStats[node.id];
                                        if (dStats && !dStats.matchesFilters) return null;

                                        const { x, y, idealX, idealY, lines } = node;
                                        const fontSize = 16 / effectiveScale; 
                                        const strokeW = 4 / effectiveScale;
                                        const lineHeight = fontSize * 1.1;
                                        const startY = y - ((lines.length - 1) * lineHeight) / 2;

                                        // Verifica se precisa de uma leader line
                                        const dx = x - idealX;
                                        const dy = y - idealY;
                                        const distance = Math.sqrt(dx * dx + dy * dy);
                                        const needsLeaderLine = distance > 10 / baseTransform.scale;

                                        return (
                                            <g key={`t-lbl-${i}`}>
                                                {needsLeaderLine && (
                                                    <g opacity={0.7}>
                                                        <line 
                                                            x1={idealX} y1={idealY} x2={x} y2={y} 
                                                            stroke={darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"} 
                                                            strokeWidth={0.8 / effectiveScale} 
                                                        />
                                                        <circle cx={idealX} cy={idealY} r={1.5 / effectiveScale} fill={darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                                                    </g>
                                                )}
                                                <text 
                                                    x={x} y={y} textAnchor="middle" alignmentBaseline="middle" 
                                                    style={{ 
                                                        paintOrder: 'stroke', stroke: darkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)', strokeWidth: `${strokeW * 0.8}px`, strokeLinejoin: 'round',
                                                        fill: darkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0,0,0,0.85)', fontSize: `${fontSize}px`, fontWeight: '600',
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

                            {/* TEXTOS DOS TERRITÓRIOS (QUANDO HÁ SELEÇÃO - para os não selecionados) */}
                            {selectedTerritory && (
                                <g style={{ pointerEvents: 'none' }}>
                                    {territoryLabels.map((lbl, i) => {
                                        const isSelectedLabel = getTerritoryKey(lbl.name) === getTerritoryKey(selectedTerritory.nome);
                                        if (isSelectedLabel) return null; // Não renderiza o nome do território já selecionado

                                        const lines = wrapText(lbl.name);
                                        const fontSize = 14 / effectiveScale;
                                        const lineHeight = fontSize * 1.1;
                                        const startY = lbl.y - ((lines.length - 1) * lineHeight) / 2;

                                        // Determina a cor do texto: mais sutil se não corresponder aos filtros
                                        const dStats = territoriesDynamicStats[getTerritoryKey(lbl.name)];
                                        const matchesFilters = !dStats || dStats.matchesFilters;
                                        const fillColor = darkMode 
                                            ? (matchesFilters ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)') 
                                            : (matchesFilters ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)');

                                        return (
                                            <text key={`t-lbl-inactive-${i}`} x={lbl.x} y={lbl.y} textAnchor="middle" alignmentBaseline="middle" style={{ fill: fillColor, fontSize: `${fontSize}px`, fontWeight: '600' }}>
                                                {lines.map((line, idx) => (
                                                    <tspan key={idx} x={lbl.x} y={startY + (idx * lineHeight)}>{line}</tspan>
                                                ))}
                                            </text>
                                        );
                                    })}
                                </g>
                            )}

                            {/* 3. TEXTOS DOS MUNICÍPIOS (Aparecem apenas quando um território é selecionado) */}
                            {selectedTerritory && (
                                <g style={{ opacity: 1, transition: 'opacity 0.4s ease', pointerEvents: 'none' }}>
                                    {laidOutMunicipalityLabels.map((node, i) => {
                                        const { x, y, idealX, idealY, lines } = node;
                                        const fontSize = 14 / effectiveScale; 
                                        const strokeW = 3.5 / effectiveScale;
                                        const lineHeight = fontSize * 1.1;
                                        const startY = y - ((lines.length - 1) * lineHeight) / 2;

                                        const dx = x - idealX;
                                        const dy = y - idealY;
                                        const distance = Math.sqrt(dx * dx + dy * dy);
                                        const needsLeaderLine = distance > 5 / baseTransform.scale;

                                        return (
                                            <g key={`m-lbl-${i}`}>
                                                {needsLeaderLine && (
                                                    <>
                                                        <line x1={idealX} y1={idealY} x2={x} y2={y} stroke={darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"} strokeWidth={0.7 / effectiveScale} />
                                                        <circle cx={idealX} cy={idealY} r={1.2 / effectiveScale} fill={darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} />
                                                    </>
                                                )}
                                                <text 
                                                    x={x} y={y} textAnchor="middle" alignmentBaseline="middle"
                                                    style={{ 
                                                        paintOrder: 'stroke',
                                                        stroke: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
                                                        strokeWidth: `${strokeW * 0.7}px`, strokeLinejoin: 'round',
                                                        fill: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0,0,0,0.8)', 
                                                        fontSize: `${fontSize}px`, fontWeight: '500',
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

            {/* CAIXA LATERAL DE MUNICÍPIOS COM TRANSPARÊNCIA */}
            {selectedTerritory && selectedTerritoryMunicipalities.length > 0 && (
                <div className={`absolute top-5 right-5 z-30 w-56 md:w-64 max-h-[calc(100%-80px)] overflow-y-auto hide-scroll p-4 rounded-[1.5rem] border backdrop-blur-xl shadow-2xl transition-all animate-soft-fade ${darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-white/60'}`}>
                    <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 border-b pb-2 leading-tight ${darkMode ? 'text-gray-300 border-gray-700/50' : 'text-gray-500 border-gray-200/60'}`}>
                        {selectedTerritory.nome}
                    </h4>
                    <ul className="flex flex-col gap-1.5">
                        {municipalitiesToShow.map((m, idx) => {
                            const isSemi = semiaridoMunicipios.includes(normalizeName(m));
                            return (
                                <li key={idx} className={`text-[11px] font-medium flex items-center gap-2 leading-tight ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <span className={`shrink-0 w-2 h-2 rounded-full border ${isSemi ? 'bg-gov-yellow border-yellow-600' : (darkMode ? 'bg-gray-300 border-gray-400' : 'bg-gray-200 border-gray-300')}`}></span>
                                    {m}
                                </li>
                            );
                        })}
                    </ul>
                    {selectedTerritoryMunicipalities.length > 4 && (
                        <button 
                            onClick={() => setIsMunListExpanded(!isMunListExpanded)}
                            className={`w-full mt-3 text-center text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800/70 hover:bg-gray-700/90 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        >
                            {isMunListExpanded ? 'Ver menos' : `Ver mais ${selectedTerritoryMunicipalities.length - 4}...`}
                        </button>
                    )}
                </div>
            )}

            {/* LEGENDA DO MAPA */}
            <div className={`absolute bottom-6 left-6 z-20 px-4 py-3.5 rounded-2xl border shadow-xl backdrop-blur-xl flex flex-col gap-2.5 pointer-events-none transition-colors duration-500 ${darkMode ? 'bg-gray-900/60 border-gray-700/50' : 'bg-white/70 border-white/60'}`}>
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-gov-yellow shadow-sm"></span>
                    <span className={`text-[10px] font-medium tracking-wide ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Pertencente ao Semiárido
                    </span>
                </div>
                <div className="flex items-center gap-2.5 opacity-80">
                    <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></span>
                    <span className={`text-[10px] font-medium tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Não pertencente ao Semiárido
                    </span>
                </div>
            </div>

            {/* CONTROLES MANUAIS FLUTUANTES */}
            <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-20">
                <button onClick={() => setUserScale(p => Math.min(p * 1.3, 10))} className={`w-8 h-8 rounded-lg shadow-md font-black text-lg flex items-center justify-center transition-colors border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100'}`}>+</button>
                <button onClick={() => setUserScale(p => Math.max(p / 1.3, 0.5))} className={`w-8 h-8 rounded-lg shadow-md font-black text-lg flex items-center justify-center transition-colors border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100'}`}>-</button>
                <button onClick={() => { setUserScale(1); setUserPan({x:0, y:0}); onSelectTerritory(null); }} className={`w-8 h-8 rounded-lg shadow-md font-bold text-[10px] flex items-center justify-center transition-colors border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100'}`}>↺</button>
            </div>

            {/* TOOLTIP DO MOUSE DINÂMICO (Território OU Município) */}
            {tooltip.visible && !isDragging && (hoveredTerritory || hoveredMunicipality) && (
                <div 
                    className={`absolute z-50 overflow-hidden rounded-2xl border backdrop-blur-md shadow-2xl pointer-events-none transition-opacity duration-200 ${darkMode ? 'bg-gray-900/90 border-gray-700' : 'bg-white/90 border-white/60'}`} 
                    style={{ top: tooltip.y, left: tooltip.x, width: 280 }}
                >
                    
                    {/* CASO 1: HOVER NUM TERRITÓRIO GERAL */}
                    {hoveredTerritory && hoveredData && dynamicStats && (
                        <>
                            <div className="h-1.5 w-full" style={{ backgroundColor: territoryColorMap[getTerritoryKey(hoveredData.nome)] || '#0f766e' }}></div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className={`font-bold text-[14px] uppercase tracking-tight leading-tight pr-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{hoveredData.nome}</h2>
                                    {dynamicStats.pctSemiarido > 0 && (
                                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 mt-0.5 ${dynamicStats.pctSemiarido >= 100 ? 'text-gov-red bg-gov-red/10 border border-gov-red/20' : 'text-yellow-600 bg-yellow-50 border border-yellow-100'}`}>
                                            {dynamicStats.pctSemiarido >= 100 ? 'Semiárido' : `Semiárido: ${dynamicStats.pctSemiarido.toFixed(0)}%`}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className={`rounded-lg p-2 border ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100/50 border-gray-200/50'}`}>
                                        <span className="block text-[8px] font-bold uppercase text-gray-400">Entidades CT&I</span>
                                        <span className="block text-base font-black text-gov-blue">{dynamicStats.capacidadeCti}</span>
                                    </div>
                                    <div className={`rounded-lg p-2 border ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100/50 border-gray-200/50'}`}>
                                        <span className="block text-[8px] font-bold uppercase text-gray-400">IFDM (Média)</span>
                                        <span className="block text-base font-black text-gov-red">{dynamicStats.ifdm}</span>
                                    </div>
                                </div>
                                <div className={`rounded-lg p-2 border mb-2 ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100/50 border-gray-200/50'}`}>
                                    <span className="block text-[8px] font-bold uppercase text-gray-400">Iniciativas Estaduais</span>
                                    <span className="block text-[11px] font-bold text-gov-cyan">{dynamicStats.conectaBahia}</span>
                                </div>
                                <div className={`rounded-lg p-2 border ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100/50 border-gray-200/50'}`}>
                                    <span className="block text-[8px] font-bold uppercase text-gray-400">Cadeias & IGs</span>
                                    <span className={`block text-xs font-semibold truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} title={dynamicStats.cadeiasIgs}>{dynamicStats.cadeiasIgs}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* CASO 2: HOVER NUM MUNICÍPIO ESPECÍFICO */}
                    {hoveredMunicipality && hoveredMunData && !hoveredTerritory && (
                        <>
                            <div className="h-1.5 w-full" style={{ backgroundColor: '#0ea5e9' }}></div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className={`font-bold text-[14px] uppercase tracking-tight leading-tight pr-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                        {hoveredMunData.nome}
                                    </h2>
                                    {hoveredMunData.isSemi && (
                                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 mt-0.5 text-yellow-700 bg-gov-yellow/20 border border-gov-yellow/30">
                                            Semiárido
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className={`rounded-lg p-2 border ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100/50 border-gray-200/50'}`}>
                                        <span className="block text-[8px] font-bold uppercase text-gray-400">Entidades CT&I</span>
                                        <span className="block text-base font-black text-gov-blue">{hoveredMunData.entidadesCount}</span>
                                    </div>
                                    <div className={`rounded-lg p-2 border ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100/50 border-gray-200/50'}`}>
                                        <span className="block text-[8px] font-bold uppercase text-gray-400">Cadeias & IGs</span>
                                        <span className="block text-base font-black text-gov-green">{hoveredMunData.cadeiasCount}</span>
                                    </div>
                                </div>
                                <div className={`rounded-lg p-2 border mb-2 ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-100/50 border-gray-200/50'}`}>
                                    <span className="block text-[8px] font-bold uppercase text-gray-400">D. Territ. (IFDM)</span>
                                    <span className="block text-[11px] font-bold text-gov-red">{hoveredMunData.ifdm}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}