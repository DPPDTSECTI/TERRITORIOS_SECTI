import React, { useEffect, useMemo, useState, useRef } from 'react';
import * as topojson from 'topojson-client';
import territoriosMunicipios from './utils/territorioMunicipios.json';
import { fetchTerritorialData, clearTerritorialCache, getAssistenciaStatusLabel } from './utils/territorialDataService';

const SVG_W = 700;
const SVG_H = 700;
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
        .replace(/\s+/g, ' ').trim();
}

const territoryColorMap = {};
territoriosMunicipios.territorios_de_identidade.forEach((territorio) => {
    territoryColorMap[normalizeName(territorio.nome)] = TERRITORY_COLORS[territorio.id - 1] || '#E2E8F0';
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

// Componente visual para os Cards de KPI
const StatCard = ({ title, value, color, icon }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1`} style={{ backgroundColor: color }}></div>
        <div className="flex justify-between items-start pl-2">
            <div>
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{title}</h3>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">{value}</span>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15`, color: color }}>
                {icon}
            </div>
        </div>
    </div>
);

const ConectaGovDashboard = () => {
    const [territorialData, setTerritorialData] = useState({ territories: [], summary: {} });
    const [mapFeatures, setMapFeatures] = useState([]);
    const [hoveredTerritory, setHoveredTerritory] = useState(null);
    const [selectedTerritory, setSelectedTerritory] = useState(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const mapContainerRef = useRef(null);
    const [error, setError] = useState(null);

    const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);
    const territoryDataMap = useMemo(() => {
        const map = {};
        (territorialData.territories || []).forEach((t) => {
            map[t.territory] = t;
        });
        return map;
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
        fetch('/BA_(1)9396399957704198.json')
            .then((resp) => resp.json())
            .then((topology) => {
                const geo = topojson.feature(topology, topology.objects.BA);
                let minX = Infinity;
                let minY = Infinity;
                let maxX = -Infinity;
                let maxY = -Infinity;

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

    const hoveredData = hoveredTerritory ? territoryDataMap[hoveredTerritory] : null;
    const selectedData = selectedTerritory ? territoryDataMap[selectedTerritory] : null;

    const selectedCapacidadeDetalhada = selectedData?.capacidadeDetalhada?.length
        ? selectedData.capacidadeDetalhada
        : selectedData?.capacidadeRows || [];
    const selectedCadeiasDetalhado = selectedData?.cadeiasProdutivasDetalhado?.length
        ? selectedData.cadeiasProdutivasDetalhado
        : selectedData?.cadeiasRows || [];

    const onTerritoryMouseMove = (e, territory) => {
        setHoveredTerritory(territory);

        const container = mapContainerRef.current;
        if (!container) {
            setTooltip({ visible: true, x: e.clientX + 8, y: e.clientY + 8 });
            return;
        }

        const rect = container.getBoundingClientRect();
        const tooltipWidth = 280;
        const tooltipHeight = 260;
        const offset = 12;

        let x = e.clientX - rect.left + offset;
        let y = e.clientY - rect.top + offset;

        if (x + tooltipWidth > rect.width) {
            x = Math.max(8, e.clientX - rect.left - tooltipWidth - offset);
        }

        if (y + tooltipHeight > rect.height) {
            y = Math.max(8, e.clientY - rect.top - tooltipHeight - offset);
        }

        setTooltip({ visible: true, x, y });
    };

    const onMouseLeave = () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
        setHoveredTerritory(null);
    };

    return (
        <div className="w-full h-full p-4 sm:p-6 bg-slate-50/50 flex flex-col gap-6">
            
            {loading && (
                <div className="flex items-center justify-center p-8 text-emerald-600 font-semibold">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Carregando dados territoriais...
                </div>
            )}
            
            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                    Erro: {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Linha de KPIs (Estilo Painel Corporativo) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard 
                            title="Capacidade Territorial" 
                            value={selectedData ? (selectedData.capacidade?.entidadesTotal || 0) : '-'} 
                            color="#0284c7" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
                        />
                        <StatCard 
                            title="Universidades" 
                            value={selectedData ? (selectedData.capacidade?.universidades || 0) : '-'} 
                            color="#d97706" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>}
                        />
                        <StatCard 
                            title="Empresas Dinamizadoras" 
                            value={selectedData ? (selectedData.capacidade?.espacosDinamizadores || 0) : '-'} 
                            color="#2563eb" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8" /></svg>}
                        />
                        <StatCard 
                            title="Pontuação FDMI" 
                            value={selectedData && selectedData.desenvolvimento?.ifdmTi != null ? selectedData.desenvolvimento.ifdmTi.toFixed(3) : '-'} 
                            color="#16a34a" 
                            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                        />
                    </div>

                    {/* Área Central: Mapa e Detalhamento */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        
                        {/* MAPA (Lado Esquerdo) */}
                        <div className="flex-[3] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col min-h-[500px]">
                            {/* Título Estilizado Igual à Imagem */}
                            <div className="bg-[#0f766e] text-white px-5 py-3 shadow-md z-10 flex items-center justify-between">
                                <span className="font-semibold tracking-wide text-sm sm:text-base">
                                    DETALHAMENTO DO TERRITÓRIO: <span className="font-bold text-emerald-200">{selectedTerritory || 'Selecione no mapa'}</span>
                                </span>
                            </div>

                            <div ref={mapContainerRef} className="flex-1 relative w-full h-full bg-[#f8fafc] flex items-center justify-center p-4">
                                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto max-h-[600px] bg-transparent cursor-pointer">
                                    {mapFeatures.map((feat, index) => {
                                        const isHovered = hoveredTerritory === feat.territory;
                                        const isSelected = selectedTerritory === feat.territory;
                                        const normalizedTerritory = normalizeName(feat.territory);
                                        const territoryColor = territoryColorMap[normalizedTerritory] || '#E2E8F0';

                                        let fillColor = territoryColor;
                                        let strokeColor = '#ffffff';
                                        let strokeWidth = 0.5;

                                        if (isHovered) {
                                            fillColor = '#F7AA16';
                                            strokeColor = '#1f2937';
                                            strokeWidth = 1.5;
                                        } else if (isSelected) {
                                            fillColor = territoryColor;
                                            strokeColor = '#0f766e';
                                            strokeWidth = 2;
                                        }

                                        return (
                                            <path
                                                key={`${feat.nome}-${index}`}
                                                d={feat.d}
                                                fill={fillColor}
                                                stroke={strokeColor}
                                                strokeWidth={strokeWidth}
                                                className="transition-all duration-200"
                                                opacity={isSelected ? 1 : 0.92}
                                                onMouseEnter={(e) => onTerritoryMouseMove(e, feat.territory)}
                                                onMouseMove={(e) => onTerritoryMouseMove(e, feat.territory)}
                                                onMouseLeave={onMouseLeave}
                                                onClick={() => setSelectedTerritory(feat.territory)}
                                            />
                                        );
                                    })}
                                    {territoryPaths.map((territory) => {
                                        const data = territoryDataMap[territory.territory];
                                        if (!data || !data.capacidade) return null;

                                        const iconSize = Math.min(12 + (data.capacidade.parquesTecnologicos || 0) * 1.6, 28);
                                        return (
                                            <circle
                                                key={`park-icon-${territory.territory}`}
                                                cx={territory.centroid[0] || 0}
                                                cy={territory.centroid[1] || 0}
                                                r={iconSize / 2}
                                                fill="rgba(220, 38, 38, 0.85)"
                                                stroke="#fff"
                                                strokeWidth="1.5"
                                                className="transition-transform cursor-pointer"
                                                onMouseEnter={(e) => onTerritoryMouseMove(e, territory.territory)}
                                                onMouseLeave={onMouseLeave}
                                                onClick={() => setSelectedTerritory(territory.territory)}
                                            />
                                        );
                                    })}
                                </svg>

                                {/* Tooltip Original */}
                                {tooltip.visible && hoveredTerritory && hoveredData && (
                                    <div
                                        className="absolute z-30 shadow-xl rounded-lg bg-white p-4 border border-slate-200 text-xs text-slate-700 pointer-events-none"
                                        style={{ top: tooltip.y, left: tooltip.x, width: 280 }}
                                    >
                                        <h2 className="font-bold text-sm text-[#0f766e] mb-2 pb-1 border-b border-slate-100">{hoveredTerritory}</h2>
                                        <div className="space-y-1">
                                            <p>Capacidade Territorial em CT&I: <strong className="text-slate-900">{hoveredData.capacidade.entidadesTotal ?? 0}</strong></p>
                                            <p>Universidades: {hoveredData.capacidade.universidades}</p>
                                            <p>Campi Universitários: {hoveredData.capacidade.campiUniversitarios}</p>
                                            <p>Campi de IFs: {hoveredData.capacidade.campiIFs}</p>
                                            <p>Espaços Dinamizadores: {hoveredData.capacidade.espacosDinamizadores}</p>
                                            <p>Incubadoras: {hoveredData.capacidade.incubadoras}</p>
                                            <p>Parques Tecnológicos: {hoveredData.capacidade.parquesTecnologicos}</p>
                                            <p className="pt-1">IFDMT: <strong className="text-slate-900">{hoveredData.desenvolvimento.ifdmTi != null ? hoveredData.desenvolvimento.ifdmTi.toFixed(3) : 'N/A'}</strong></p>
                                            <p>Assistência Pública: <strong className="text-slate-900">{getAssistenciaStatusLabel(hoveredData.assistenciaPublica.existe)}</strong></p>
                                            
                                            <div className="pt-2">
                                                <p className="font-semibold text-slate-800">Cadeias Produtivas:</p>
                                                {(hoveredData.cadeiasProdutivas || []).length > 0 ? (
                                                    (hoveredData.cadeiasProdutivas || []).map((cadeia, i) => (
                                                        <p key={i} className="text-[10px] text-slate-600 truncate">- {cadeia.cadeia}</p>
                                                    ))
                                                ) : <p className="text-[10px] text-slate-500">Não identificada</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* LISTA LATERAL (Lado Direito) */}
                        <div className="flex-[1] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-w-[280px]">
                            <div className="p-4 border-b border-slate-100">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Visão Geral</h3>
                                <p className="text-xs text-slate-500 mt-1">Indicadores do território selecionado</p>
                            </div>
                            
                            <div className="p-4 flex-1">
                                {selectedTerritory && selectedData ? (
                                    <div className="space-y-4">
                                        
                                        {/* Item da Lista */}
                                        <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                                            <span className="text-xs text-slate-600 font-medium">Universidades</span>
                                            <span className="text-sm font-bold text-slate-800">{selectedData.capacidade.universidades || 0}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                                            <span className="text-xs text-slate-600 font-medium">Campi Universitários</span>
                                            <span className="text-sm font-bold text-slate-800">{selectedData.capacidade.campiUniversitarios || 0}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                                            <span className="text-xs text-slate-600 font-medium">Campi de IFs</span>
                                            <span className="text-sm font-bold text-slate-800">{selectedData.capacidade.campiIFs || 0}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                                            <span className="text-xs text-slate-600 font-medium">Incubadoras</span>
                                            <span className="text-sm font-bold text-slate-800">{selectedData.capacidade.incubadoras || 0}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                                            <span className="text-xs text-slate-600 font-medium">Parques Tecnológicos</span>
                                            <span className="text-sm font-bold text-slate-800">{selectedData.capacidade.parquesTecnologicos || 0}</span>
                                        </div>

                                        <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                                            <span className="text-xs text-slate-600 font-medium">Assistência Pública</span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${getAssistenciaStatusLabel(selectedData.assistenciaPublica.existe) === 'Não identificada' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {getAssistenciaStatusLabel(selectedData.assistenciaPublica.existe)}
                                            </span>
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-lg mt-4 border border-slate-100">
                                            <span className="text-xs text-slate-500 block mb-1">Pertencimento ao Semiárido</span>
                                            <span className="text-lg font-bold text-[#0f766e]">
                                                {selectedData.semiaridoPercentual != null ? `${selectedData.semiaridoPercentual.toFixed(1)}%` : 'N/A'}
                                            </span>
                                        </div>

                                        <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200 max-h-[180px] overflow-y-auto">
                                            <h4 className="text-xs font-bold text-slate-700 mb-2">Capacidade Territorial - Itens</h4>
                                            {selectedCapacidadeDetalhada && selectedCapacidadeDetalhada.length > 0 ? (
                                                <ul className="space-y-2 text-[11px] text-slate-700">
                                                    {selectedCapacidadeDetalhada.slice(0, 12).map((item, idx) => (
                                                        <li key={`capacidade-item-${idx}`} className="rounded-md border border-slate-100 p-2 bg-slate-50">
                                                            <div className="text-[12px] font-semibold text-slate-800">Entidade: {item.entidade || 'N/D'}</div>
                                                            <div className="text-[11px] text-slate-600">Tipo: {item.tipo || 'N/D'} • Município: {item.municipio || 'N/D'}</div>
                                                            <div className="text-[10px] text-slate-500">Qtd: {item.valor ?? item.quantidade ?? 0}</div>
                                                        </li>
                                                    ))}
                                                    {selectedCapacidadeDetalhada.length > 12 && <li className="text-[10px] text-slate-400">... e mais {selectedCapacidadeDetalhada.length - 12} itens</li>}
                                                </ul>
                                            ) : (
                                                <p className="text-[11px] text-slate-400">Não há dados detalhados de capacidade disponíveis.</p>
                                            )}
                                        </div>

                                        <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                                            <h4 className="text-xs font-bold text-slate-700 mb-2">Desenvolvimento Territorial</h4>
                                            <p className="text-[11px] text-slate-600"><strong>IFDM Territorial:</strong> {selectedData.desenvolvimento.ifdmTi != null ? selectedData.desenvolvimento.ifdmTi.toFixed(3) : 'N/A'}</p>
                                            <p className="text-[11px] text-slate-600"><strong>População estimada:</strong> {selectedData.desenvolvimento.populacaoTotal != null ? selectedData.desenvolvimento.populacaoTotal.toLocaleString() : 'N/A'}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{selectedData.desenvolvimento.metodologia || 'Metodologia não disponível'}</p>
                                        </div>

                                        <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200 max-h-[150px] overflow-y-auto">
                                            <h4 className="text-xs font-bold text-slate-700 mb-2">Cadeias Produtivas</h4>
                                            {selectedCadeiasDetalhado && selectedCadeiasDetalhado.length > 0 ? (
                                                <ul className="space-y-1 text-[11px] text-slate-600">
                                                    {selectedCadeiasDetalhado.slice(0, 8).map((item, idx) => (
                                                        <li key={`cadeia-item-${idx}`}>
                                                            <strong>{Array.isArray(item.cadeias) ? item.cadeias.join(', ') : item.cadeia}</strong>
                                                            {item.municipio ? ` — município ${item.municipio}` : ''}
                                                            {item.municipioSatelite ? ` — satélite ${item.municipioSatelite}` : ''}
                                                        </li>
                                                    ))}
                                                    {selectedCadeiasDetalhado.length > 8 && <li className="text-[10px] text-slate-400">... e mais {selectedCadeiasDetalhado.length - 8} itens</li>}
                                                </ul>
                                            ) : selectedData.cadeiasProdutivas && selectedData.cadeiasProdutivas.length > 0 ? (
                                                <ul className="space-y-1 text-[11px] text-slate-600">
                                                    {selectedData.cadeiasProdutivas.map((item, idx) => (
                                                        <li key={`cadeia-summary-${idx}`}><strong>{item.cadeia}</strong> ({item.municipiosEnvolvidos} municípios)</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-[11px] text-slate-400">Não há cadeias produtivas identificadas.</p>
                                            )}
                                        </div>

                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-10">
                                        <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                        <p className="text-sm text-slate-500">Nenhum território selecionado.</p>
                                        <p className="text-xs text-slate-400 mt-1">Clique no mapa para exibir as informações.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};

export default ConectaGovDashboard;