import React, { useEffect, useMemo, useState, useRef } from 'react';
import * as topojson from 'topojson-client';
import territoriosMunicipios from './utils/territorioMunicipios.json';

const SVG_W = 800;
const SVG_H = 800;
const PADDING = 20;

const TERRITORY_COLORS = [
    '#E03C5A', '#F9A03F', '#C3D471', '#149BDB', '#86CBA0', '#E53B94', '#B94B85',
    '#B57753', '#CFBE5C', '#1AB2ED', '#B0AD23', '#1A9F9E', '#ED7D31', '#9CC14A',
    '#8786AD', '#12A759', '#4EC1D3', '#1C9395', '#FAC637', '#9A5B74', '#F6ED70',
    '#F2A09E', '#3D8576', '#D2C365', '#A7B665', '#B8BAD2', '#BDBBB9',
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

const territoryColorMap = {};
territoriosMunicipios.territorios_de_identidade.forEach((territorio) => {
    territoryColorMap[getTerritoryKey(territorio.nome)] = TERRITORY_COLORS[territorio.id - 1] || '#E2E8F0';
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
    
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const dragTotal = useRef(0);
    const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);

    useEffect(() => { setUserScale(1); setUserPan({ x: 0, y: 0 }); }, [selectedTerritory]);

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

            if (!tB[tKey]) tB[tKey] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
            if (!tBS[tKey]) tBS[tKey] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

            const updateBounds = (b) => {
                if (feat.fBounds.minX < b.minX) b.minX = feat.fBounds.minX;
                if (feat.fBounds.maxX > b.maxX) b.maxX = feat.fBounds.maxX;
                if (feat.fBounds.minY < b.minY) b.minY = feat.fBounds.minY;
                if (feat.fBounds.maxY > b.maxY) b.maxY = feat.fBounds.maxY;
            };

            updateBounds(tB[tKey]);
            if (isMunSemi) updateBounds(tBS[tKey]);
        });
        return { calcBoundsGlobal: tB, calcBoundsSemi: tBS };
    }, [mapFeatures, semiaridoMunicipios]);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const handleNativeWheel = (e) => {
            e.preventDefault(); 
            const zoomFactor = 0.1;
            const delta = e.deltaY < 0 ? 1 + zoomFactor : 1 - zoomFactor;
            setUserScale(prev => Math.min(Math.max(prev * delta, 0.5), 15));
        };
        svg.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => svg.removeEventListener('wheel', handleNativeWheel);
    }, [loading]);

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

    const handleMouseDown = (e) => { setIsDragging(true); dragTotal.current = 0; lastMousePos.current = { x: e.clientX, y: e.clientY }; };
    const handleMouseMoveSVG = (e) => {
        if (isDragging) {
            const dx = e.clientX - lastMousePos.current.x; const dy = e.clientY - lastMousePos.current.y;
            dragTotal.current += Math.abs(dx) + Math.abs(dy);
            setUserPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };
    const handleMouseUp = () => setIsDragging(false);

    // LÓGICA DE HOVER
    const onMapHover = (e, feat) => {
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
    };

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
                        setTooltip({visible: false}); 
                        setHoveredTerritory(null);
                        setHoveredMunicipality(null);
                    }}
                >
                    <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor={darkMode ? '#3b82f6' : '#0f766e'} floodOpacity="0.4" />
                        </filter>
                    </defs>

                    <g style={{ transform: `translate(${userPan.x}px, ${userPan.y}px) scale(${userScale})`, transformOrigin: 'center', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
                        <g style={{ transform: `translate(${baseTransform.tx}px, ${baseTransform.ty}px) scale(${baseTransform.scale})`, transformOrigin: '0 0', transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            
                            {/* 1. MUNICÍPIOS (POLÍGONOS) */}
                            {mapFeatures.map((feat, index) => {
                                const normalizedFeatName = getTerritoryKey(feat.territory);
                                
                                // ACESSO AOS CÁLCULOS CRUZADOS DE FILTROS VINDOS DO APP.JSX
                                const dStats = territoriesDynamicStats[normalizedFeatName];
                                const matchesFilters = dStats ? dStats.matchesFilters : true;

                                const isMunSemi = semiaridoMunicipios.includes(normalizeName(feat.nome));
                                
                                // BLOQUEIA SE: Filtro semiárido chocar com cidade não-semiárida, OU Se os filtros de CTI/IFDM removerem essa região.
                                const blockClickAndColor = (filtroSemiarido && !isMunSemi) || !matchesFilters;
                                
                                const isSelectedMap = selectedTerritory && getTerritoryKey(selectedTerritory.nome) === normalizedFeatName;
                                const isHovered = !blockClickAndColor && (hoveredTerritory === feat.territory || hoveredMunicipality === feat.nome);

                                let opacity = 0.90; 
                                let fillColor = territoryColorMap[normalizedFeatName] || '#E2E8F0';

                                if (blockClickAndColor) {
                                    fillColor = darkMode ? '#1e293b' : '#e2e8f0'; 
                                    opacity = 0.1;        
                                } else if (selectedTerritory) {
                                    if (isSelectedMap) {
                                        opacity = 1;
                                        if (isMunSemi) fillColor = '#F97316'; 
                                    } else {
                                        fillColor = darkMode ? '#334155' : '#cbd5e1'; 
                                        opacity = 0.15; 
                                    }
                                } else {
                                    if (isHovered) opacity = 1;
                                }

                                return (
                                    <path
                                        key={`${feat.nome}-${index}`}
                                        d={feat.d}
                                        fill={fillColor}
                                        stroke={isSelectedMap || isHovered ? '#ffffff' : (darkMode ? '#1e293b' : '#f8fafc')}
                                        strokeWidth={isSelectedMap ? 2 : isHovered ? 2 : 0.8}
                                        strokeLinejoin="round"
                                        vectorEffect="non-scaling-stroke" 
                                        className="transition-all duration-300 ease-out outline-none"
                                        style={{ 
                                            pointerEvents: blockClickAndColor ? 'none' : 'auto',
                                            cursor: blockClickAndColor ? 'default' : 'pointer'
                                        }}
                                        opacity={opacity}
                                        filter={isSelectedMap || isHovered ? 'url(#glow)' : undefined}
                                        onMouseEnter={(e) => onMapHover(e, feat)}
                                        onMouseMove={(e) => onMapHover(e, feat)}
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            if (dragTotal.current > 10) return; 
                                            if (!blockClickAndColor && feat.territory !== 'Sem Território') {
                                                const foundData = territoriosData.find(t => getTerritoryKey(t.nome) === getTerritoryKey(feat.territory));
                                                if (selectedTerritory && getTerritoryKey(selectedTerritory.nome) === getTerritoryKey(feat.territory)) onSelectTerritory(null);
                                                else onSelectTerritory(foundData);
                                            }
                                        }}
                                    />
                                );
                            })}

                            {/* 2. TEXTOS DOS TERRITÓRIOS (Sem seleção) */}
                            {!selectedTerritory && (
                                <g style={{ opacity: userScale > 1.05 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: 'none' }}>
                                    {territoryLabels.map((lbl, i) => {
                                        // Oculta o texto também se a região estiver bloqueada pelos filtros cruzados
                                        const dStats = territoriesDynamicStats[getTerritoryKey(lbl.name)];
                                        if (dStats && !dStats.matchesFilters) return null;

                                        const lines = wrapText(lbl.name);
                                        const fontSize = 16 / effectiveScale; 
                                        const strokeW = 4 / effectiveScale;
                                        const lineHeight = fontSize * 1.1;
                                        const startY = lbl.y - ((lines.length - 1) * lineHeight) / 2;

                                        return (
                                            <text 
                                                key={`t-lbl-${i}`} x={lbl.x} y={lbl.y} textAnchor="middle" alignmentBaseline="middle" 
                                                style={{ 
                                                    paintOrder: 'stroke', stroke: 'rgba(0, 0, 0, 0.65)', strokeWidth: `${strokeW * 0.8}px`, 
                                                    fill: 'rgba(255, 255, 255, 0.95)', fontSize: `${fontSize}px`, fontWeight: '600', pointerEvents: 'none',
                                                }}
                                            >
                                                {lines.map((line, idx) => (
                                                    <tspan key={idx} x={lbl.x} y={startY + (idx * lineHeight)}>{line}</tspan>
                                                ))}
                                            </text>
                                        );
                                    })}
                                </g>
                            )}

                            {/* 3. TEXTOS DOS MUNICÍPIOS (Com seleção) */}
                            {selectedTerritory && (
                                <g style={{ opacity: userScale > 1.05 ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: 'none' }}>
                                    {mapFeatures.filter(f => {
                                        const isSameTerritory = getTerritoryKey(f.territory) === getTerritoryKey(selectedTerritory.nome);
                                        if (!isSameTerritory) return false;
                                        const isMunSemi = semiaridoMunicipios.includes(normalizeName(f.nome));
                                        if (filtroSemiarido && !isMunSemi) return false;
                                        return true;
                                    }).map((feat, i) => {
                                        const lines = wrapText(feat.nome);
                                        const fontSize = 14 / effectiveScale; 
                                        const strokeW = 3.5 / effectiveScale;
                                        const lineHeight = fontSize * 1.1;
                                        const startY = feat.cy - ((lines.length - 1) * lineHeight) / 2;

                                        return (
                                            <text 
                                                key={`m-lbl-${i}`} x={feat.cx} y={feat.cy} textAnchor="middle" alignmentBaseline="middle" 
                                                style={{ 
                                                    paintOrder: 'stroke', stroke: 'rgba(0, 0, 0, 0.65)', strokeWidth: `${strokeW * 0.7}px`, 
                                                    fill: 'rgba(255, 255, 255, 0.9)', fontSize: `${fontSize}px`, fontWeight: '500', pointerEvents: 'none',
                                                }}
                                            >
                                                {lines.map((line, idx) => (
                                                    <tspan key={idx} x={feat.cx} y={startY + (idx * lineHeight)}>{line}</tspan>
                                                ))}
                                            </text>
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
                <div className={`absolute top-5 right-5 z-30 w-56 md:w-64 max-h-[calc(100%-80px)] overflow-y-auto hide-scroll p-4 rounded-[1.5rem] border backdrop-blur-xl shadow-2xl transition-all animate-soft-fade ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-white/60'}`}>
                    <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 border-b pb-2 leading-tight ${darkMode ? 'text-slate-300 border-slate-700/50' : 'text-slate-500 border-slate-200/60'}`}>
                        {selectedTerritory.nome}
                    </h4>
                    <ul className="flex flex-col gap-1.5">
                        {selectedTerritoryMunicipalities.map((m, idx) => {
                            const isSemi = semiaridoMunicipios.includes(normalizeName(m));
                            return (
                                <li key={idx} className={`text-[11px] font-medium flex items-center gap-2 leading-tight ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    <span className={`shrink-0 w-2 h-2 rounded-full border ${isSemi ? 'bg-orange-500 border-orange-600' : (darkMode ? 'bg-slate-300 border-slate-400' : 'bg-slate-200 border-slate-300')}`}></span>
                                    {m}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}

            {/* LEGENDA DO MAPA */}
            <div className={`absolute bottom-6 left-6 z-20 px-4 py-3.5 rounded-2xl border shadow-xl backdrop-blur-xl flex flex-col gap-2.5 pointer-events-none transition-colors duration-500 ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/70 border-white/60'}`}>
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shadow-sm"></span>
                    <span className={`text-[10px] font-medium tracking-wide ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Pertencente ao Semiárido
                    </span>
                </div>
                <div className="flex items-center gap-2.5 opacity-80">
                    <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></span>
                    <span className={`text-[10px] font-medium tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Oculto ou Sem Dados
                    </span>
                </div>
            </div>

            {/* CONTROLES MANUAIS FLUTUANTES */}
            <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-20">
                <button onClick={() => setUserScale(p => Math.min(p * 1.3, 10))} className={`w-8 h-8 rounded-lg shadow-md font-black text-lg flex items-center justify-center transition-colors border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'}`}>+</button>
                <button onClick={() => setUserScale(p => Math.max(p / 1.3, 0.5))} className={`w-8 h-8 rounded-lg shadow-md font-black text-lg flex items-center justify-center transition-colors border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'}`}>-</button>
                <button onClick={() => { setUserScale(1); setUserPan({x:0, y:0}); onSelectTerritory(null); }} className={`w-8 h-8 rounded-lg shadow-md font-bold text-[10px] flex items-center justify-center transition-colors border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'}`}>↺</button>
            </div>

            {/* TOOLTIP DO MOUSE DINÂMICO (Território OU Município) */}
            {tooltip.visible && !isDragging && (
                <div className={`absolute z-50 overflow-hidden rounded-2xl border backdrop-blur-md shadow-2xl pointer-events-none transition-opacity duration-200 ${darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-white/60'}`} style={{ top: tooltip.y, left: tooltip.x, width: 280 }}>
                    
                    {/* CASO 1: HOVER NUM TERRITÓRIO GERAL */}
                    {hoveredTerritory && hoveredData && dynamicStats && (
                        <>
                            <div className="h-1.5 w-full" style={{ backgroundColor: territoryColorMap[getTerritoryKey(hoveredData.nome)] || '#0f766e' }}></div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className={`font-bold text-[14px] uppercase tracking-tight leading-tight pr-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{hoveredData.nome}</h2>
                                    {dynamicStats.pctSemiarido > 0 && (
                                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 mt-0.5 ${dynamicStats.pctSemiarido >= 100 ? 'text-gov-red-500 bg-gov-red-50 border border-gov-red-100' : 'text-orange-600 bg-orange-50 border border-orange-100'}`}>
                                            {dynamicStats.pctSemiarido >= 100 ? 'Semiárido' : `Semiárido: ${dynamicStats.pctSemiarido.toFixed(0)}%`}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className={`rounded-lg p-2 border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/50 border-slate-200/50'}`}>
                                        <span className="block text-[8px] font-bold uppercase text-slate-400">Entidades CT&I</span>
                                        <span className="block text-base font-black text-gov-blueDark-500">{dynamicStats.capacidadeCti}</span>
                                    </div>
                                    <div className={`rounded-lg p-2 border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/50 border-slate-200/50'}`}>
                                        <span className="block text-[8px] font-bold uppercase text-slate-400">IFDM (Média)</span>
                                        <span className="block text-base font-black text-gov-red-500">{dynamicStats.ifdm}</span>
                                    </div>
                                </div>
                                <div className={`rounded-lg p-2 border mb-2 ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/50 border-slate-200/50'}`}>
                                    <span className="block text-[8px] font-bold uppercase text-slate-400">Iniciativas Estaduais</span>
                                    <span className="block text-[11px] font-bold text-gov-cyan-700">{dynamicStats.conectaBahia}</span>
                                </div>
                                <div className={`rounded-lg p-2 border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/50 border-slate-200/50'}`}>
                                    <span className="block text-[8px] font-bold uppercase text-slate-400">Cadeias & IGs</span>
                                    <span className={`block text-xs font-semibold truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`} title={dynamicStats.cadeiasIgs}>{dynamicStats.cadeiasIgs}</span>
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
                                    <h2 className={`font-bold text-[14px] uppercase tracking-tight leading-tight pr-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                        {hoveredMunData.nome}
                                    </h2>
                                    {hoveredMunData.isSemi && (
                                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 mt-0.5 text-orange-600 bg-orange-50 border border-orange-100">
                                            Semiárido
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className={`rounded-lg p-2 border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/50 border-slate-200/50'}`}>
                                        <span className="block text-[8px] font-bold uppercase text-slate-400">Entidades CT&I</span>
                                        <span className="block text-base font-black text-gov-blueDark-500">{hoveredMunData.entidadesCount}</span>
                                    </div>
                                    <div className={`rounded-lg p-2 border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/50 border-slate-200/50'}`}>
                                        <span className="block text-[8px] font-bold uppercase text-slate-400">Cadeias & IGs</span>
                                        <span className="block text-base font-black text-emerald-500">{hoveredMunData.cadeiasCount}</span>
                                    </div>
                                </div>
                                <div className={`rounded-lg p-2 border mb-2 ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100/50 border-slate-200/50'}`}>
                                    <span className="block text-[8px] font-bold uppercase text-slate-400">D. Territ. (IFDM)</span>
                                    <span className="block text-[11px] font-bold text-gov-red-500">{hoveredMunData.ifdm}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}