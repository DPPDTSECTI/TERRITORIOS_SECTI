import React, { useEffect, useMemo, useState, useRef } from 'react';
import * as topojson from 'topojson-client';
import territoriosMunicipios from './utils/territorioMunicipios.json';

const SVG_W = 800;
const SVG_H = 800;
const PADDING = 20;

const TERRITORY_COLORS = [
    '#EE2F5A', '#FBA751', '#CFDD90', '#0397DA', '#9CD3AF', '#EB278F', '#BE4481',
    '#BF8057', '#D7CB76', '#04AFED', '#b6b317', '#099D9E', '#F38735', '#A4C757',
    '#9493B5', '#01A859', '#5CC3D4', '#0F9296', '#FFCD37', '#9F637C', '#FDF588',
    '#F8AFAD', '#47887A', '#D9CB72', '#B0BD77', '#C5C7DB', '#C8C6C4',
];

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

const getTerritoryKey = (value) => normalizeName(value);

const territoryColorMap = {};
territoriosMunicipios.territorios_de_identidade.forEach((territorio) => {
    territoryColorMap[getTerritoryKey(territorio.nome)] = TERRITORY_COLORS[territorio.id - 1] || '#E2E8F0';
});

const buildMunicipioTerritoryMap = () => {
    const m = {};
    territoriosMunicipios.territorios_de_identidade.forEach((territorio) => {
        territorio.municipios.forEach((municipio) => {
            m[normalizeName(municipio)] = territorio.nome;
        });
    });
    return m;
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

export default function ConectaMap({ 
    territoriosData = [], 
    territoriesDynamicStats = {}, 
    searchTerm = '', 
    filtroSemiarido = false, 
    selectedTerritory = null, 
    onSelectTerritory = () => {},
    semiaridoMunicipios = [] 
}) {
    const [mapFeatures, setMapFeatures] = useState([]);
    const [hoveredTerritory, setHoveredTerritory] = useState(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const mapContainerRef = useRef(null);

    const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);

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
                    const territoryName = municipioTerritoryMap[normalizeName(municipio)] || 'Sem Território';
                    const d = getPathD(feat.geometry, project);
                    return { nome: municipio, territory: territoryName, d };
                });
                setMapFeatures(features);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Erro ao carregar o mapa:", err);
                setLoading(false);
            });
    }, [municipioTerritoryMap]);

    const onTerritoryMouseMove = (e, territoryName) => {
        if (territoryName === 'Sem Território') return;
        setHoveredTerritory(territoryName);

        const container = mapContainerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const tooltipWidth = 260;
        const tooltipHeight = 180;
        const offset = 15;

        let x = e.clientX - rect.left + offset;
        let y = e.clientY - rect.top + offset;

        if (x + tooltipWidth > rect.width) x = e.clientX - rect.left - tooltipWidth - offset;
        if (y + tooltipHeight > rect.height) y = e.clientY - rect.top - tooltipHeight - offset;

        setTooltip({ visible: true, x, y });
    };

    const onMouseLeave = () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
        setHoveredTerritory(null);
    };

    const handleMapClick = (territoryName) => {
        if (territoryName === 'Sem Território') return;
        const foundData = territoriosData.find(t => getTerritoryKey(t.nome) === getTerritoryKey(territoryName));
        if (foundData) {
            if (selectedTerritory && getTerritoryKey(selectedTerritory.nome) === getTerritoryKey(territoryName)) {
                onSelectTerritory(null);
            } else {
                onSelectTerritory(foundData);
            }
        }
    };

    const hoveredData = hoveredTerritory 
        ? territoriosData.find(t => getTerritoryKey(t.nome) === getTerritoryKey(hoveredTerritory)) 
        : null;

    const dynamicStats = hoveredTerritory ? territoriesDynamicStats[getTerritoryKey(hoveredTerritory)] : null;

    return (
        <div ref={mapContainerRef} className="relative isolate w-full h-full min-h-[500px] flex items-center justify-center bg-slate-50/40 rounded-xl overflow-hidden" onMouseLeave={onMouseLeave}>
            
            {loading ? (
                <div className="flex flex-col items-center text-gov-blueDark-500">
                    <svg className="animate-spin h-8 w-8 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-semibold tracking-wider uppercase">A Desenhar Malha Cartográfica...</span>
                </div>
            ) : (
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full max-h-[750px] drop-shadow-xl">
                    <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0f766e" floodOpacity="0.25" />
                        </filter>
                    </defs>

                    {mapFeatures.map((feat, index) => {
                        const normalizedFeatName = getTerritoryKey(feat.territory);
                        
                        const isMunSemi = semiaridoMunicipios.includes(normalizeName(feat.nome));
                        const blockClickAndColor = filtroSemiarido && !isMunSemi;

                        const isHovered = !blockClickAndColor && hoveredTerritory === feat.territory;
                        const isSelected = !blockClickAndColor && selectedTerritory && getTerritoryKey(selectedTerritory.nome) === normalizedFeatName;
                        
                        // LÊ A INSTRUÇÃO DO CÉREBRO (App.jsx)
                        const curStat = territoriesDynamicStats[normalizedFeatName];
                        let matchesSearch = curStat ? curStat.matchesSearch : true;

                        let opacity = 0.75;
                        let fillColor = territoryColorMap[normalizedFeatName] || '#E2E8F0';

                        if (blockClickAndColor) {
                            fillColor = '#cbd5e1'; 
                            opacity = 0.35;        
                        } else {
                            if (!matchesSearch) {
                                opacity = 0.08; 
                            } else if (isSelected) {
                                opacity = 1;
                            } else if (isHovered) {
                                opacity = 0.9;
                            }
                        }

                        return (
                            <path
                                key={`${feat.nome}-${index}`}
                                d={feat.d}
                                fill={fillColor}
                                stroke={isSelected || isHovered ? '#ffffff' : '#f8fafc'}
                                strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.5}
                                strokeLinejoin="round"
                                className="transition-all duration-300 ease-out"
                                style={{ 
                                    pointerEvents: blockClickAndColor ? 'none' : 'auto',
                                    cursor: blockClickAndColor ? 'default' : 'pointer'
                                }}
                                opacity={opacity}
                                filter={isSelected || isHovered ? 'url(#glow)' : undefined}
                                onMouseEnter={(e) => {
                                    if (!blockClickAndColor) onTerritoryMouseMove(e, feat.territory);
                                }}
                                onMouseMove={(e) => {
                                    if (!blockClickAndColor) onTerritoryMouseMove(e, feat.territory);
                                }}
                                onClick={() => {
                                    if (!blockClickAndColor) handleMapClick(feat.territory);
                                }}
                            />
                        );
                    })}
                </svg>
            )}

            {tooltip.visible && hoveredData && dynamicStats && (
                <div 
                    className="absolute z-50 overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur-md shadow-glass pointer-events-none transition-opacity duration-200"
                    style={{ top: tooltip.y, left: tooltip.x, width: 280 }}
                >
                    <div className="h-1.5 w-full" style={{ backgroundColor: territoryColorMap[getTerritoryKey(hoveredData.nome)] || '#0f766e' }}></div>
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <h2 className="font-bold text-[14px] text-slate-800 uppercase tracking-tight leading-tight pr-2">{hoveredData.nome}</h2>
                            
                            {dynamicStats.pctSemiarido > 0 && (
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 mt-0.5 ${dynamicStats.pctSemiarido >= 100 ? 'text-gov-red-500 bg-gov-red-50 border border-gov-red-100' : 'text-orange-600 bg-orange-50 border border-orange-100'}`}>
                                    {dynamicStats.pctSemiarido >= 100 ? 'Semiárido' : `Semiárido: ${dynamicStats.pctSemiarido.toFixed(0)}%`}
                                </span>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="bg-slate-100/50 rounded-lg p-2 border border-slate-200/50">
                                <span className="block text-[8px] font-bold uppercase text-slate-400">Entidades CT&I</span>
                                <span className="block text-base font-black text-gov-blueDark-500">{dynamicStats.capacidadeCti}</span>
                            </div>
                            <div className="bg-slate-100/50 rounded-lg p-2 border border-slate-200/50">
                                <span className="block text-[8px] font-bold uppercase text-slate-400">IFDM (Média)</span>
                                <span className="block text-base font-black text-gov-red-500">{dynamicStats.ifdm}</span>
                            </div>
                        </div>

                        <div className="bg-slate-100/50 rounded-lg p-2 border border-slate-200/50 mb-2">
                            <span className="block text-[8px] font-bold uppercase text-slate-400">Iniciativas Estaduais</span>
                            <span className="block text-[11px] font-bold text-gov-cyan-700">{dynamicStats.conectaBahia}</span>
                        </div>

                        <div className="bg-slate-100/50 rounded-lg p-2 border border-slate-200/50">
                            <span className="block text-[8px] font-bold uppercase text-slate-400">Cadeias & IGs</span>
                            <span className="block text-xs font-semibold text-slate-700 truncate" title={dynamicStats.cadeiasIgs}>
                                {dynamicStats.cadeiasIgs}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}