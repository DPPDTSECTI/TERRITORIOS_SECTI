import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, GeoJSON, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as topojson from 'topojson-client';
import territoriosMunicipios from '../data/territorioMunicipios.json';

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

// ================= MAPA PRINCIPAL =================
export default function PtiMap({
    territoriosData = [], territoriesDynamicStats = {}, searchTerm = '',
    filtroSemiarido = false, selectedTerritory = null,
    onSelectTerritory = () => { }, semiaridoMunicipios = []
}) {
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [territoryCenters, setTerritoryCenters] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Estados do Hover e Tooltip
    const [hoveredTerritory, setHoveredTerritory] = useState(null);
    const [hoveredMunicipality, setHoveredMunicipality] = useState(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
    const [isMunListExpanded, setIsMunListExpanded] = useState(false);

    const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);
    const geoJsonLayerRef = useRef(null);
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    
    // Dicionário de referências para destacar um território inteiro de uma vez
    const layersByTerritory = useRef({});

    useEffect(() => {
        setLoading(true);
        layersByTerritory.current = {}; 

        fetch('/BA_(1)9396399957704198.json')
            .then((resp) => resp.json())
            .then((topology) => {
                const geojson = topojson.feature(topology, topology.objects.BA);
                const groups = {};

                // Processar propriedades e agrupar para achar o centro de cada território
                geojson.features.forEach(feat => {
                    const municipio = feat.properties?.NOME || feat.properties?.nome || '';
                    const territory = municipioTerritoryMap[normalizeName(municipio)] || 'Sem Território';
                    
                    feat.properties.territory = territory;
                    feat.properties.nome = municipio;

                    if (territory !== 'Sem Território') {
                        if (!groups[territory]) groups[territory] = [];
                        groups[territory].push(feat);
                    }
                });

                // Calculando o centro (Bounds) nativo do Leaflet para os nomes flutuantes
                const centers = {};
                Object.keys(groups).forEach(t => {
                    const layerGroup = L.geoJSON(groups[t]);
                    centers[t] = layerGroup.getBounds().getCenter();
                });

                setTerritoryCenters(centers);
                setGeoJsonData(geojson);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erro ao carregar mapa:", err);
                setLoading(false);
            });
    }, [municipioTerritoryMap]);

    // ================= ESTILO DOS MUNICÍPIOS =================
    const styleFeature = (feature) => {
        const normalizedFeatName = getTerritoryKey(feature.properties.territory);
        const dStats = territoriesDynamicStats[normalizedFeatName];
        const matchesFilters = dStats ? dStats.matchesFilters : true;
        const isSelectedMap = selectedTerritory && getTerritoryKey(selectedTerritory.nome) === normalizedFeatName;
        const isMunSemi = semiaridoMunicipios.includes(normalizeName(feature.properties.nome));
        const blockClickAndColor = (filtroSemiarido && !isMunSemi) || (!isSelectedMap && !matchesFilters);

        let opacity = 0.85; 
        let fillColor = territoryColorMap[normalizedFeatName] || '#333333';
        let weight = 0.8; 
        let color = 'rgba(255, 255, 255, 0.4)'; 

        if (blockClickAndColor && !selectedTerritory) {
            fillColor = '#18181B'; 
            opacity = 0.40;
            color = 'rgba(255, 255, 255, 0.1)';
        } else if (selectedTerritory) {
            if (isSelectedMap) {
                opacity = 0.95;
                weight = 1.2;
                color = '#FFFFFF';
                if (filtroSemiarido && isMunSemi) fillColor = '#F59E0B'; 
            } else {
                fillColor = '#18181B';
                opacity = 0.15; 
                weight = 0.4;
                color = 'rgba(255, 255, 255, 0.1)'; 
            }
        }

        return {
            fillColor,
            weight,
            opacity: 1,
            color,
            fillOpacity: opacity,
            className: 'outline-none' // Removido transition-all para não gerar lag no Zoom
        };
    };

    // ================= CONTROLE DE HOVER =================
    const onEachFeature = (feature, layer) => {
        const tKey = getTerritoryKey(feature.properties.territory);
        
        if (!layersByTerritory.current[tKey]) {
            layersByTerritory.current[tKey] = [];
        }
        layersByTerritory.current[tKey].push(layer);

        layer.on({
            mouseover: (e) => {
                const isSelectedMap = selectedTerritory && getTerritoryKey(selectedTerritory.nome) === tKey;
                const isMunSemi = semiaridoMunicipios.includes(normalizeName(feature.properties.nome));
                const blockClickAndColor = (filtroSemiarido && !isMunSemi);
                
                if (selectedTerritory && !isSelectedMap) return; 

                if (!selectedTerritory) {
                    setHoveredTerritory(feature.properties.territory);
                    setHoveredMunicipality(null);
                    
                    layersByTerritory.current[tKey].forEach(l => {
                        l.setStyle({ fillOpacity: 1, color: 'rgba(255, 255, 255, 0.8)' });
                        l.bringToFront();
                    });
                } else {
                    setHoveredMunicipality(feature.properties.nome);
                    e.target.setStyle({ fillOpacity: 1, color: '#FFFFFF', weight: 1.5 });
                    e.target.bringToFront();
                }
            },
            mouseout: (e) => {
                if (!selectedTerritory) {
                    layersByTerritory.current[tKey].forEach(l => {
                        if (geoJsonLayerRef.current) geoJsonLayerRef.current.resetStyle(l);
                    });
                } else {
                    if (geoJsonLayerRef.current) geoJsonLayerRef.current.resetStyle(e.target);
                }
                
                setHoveredTerritory(null);
                setHoveredMunicipality(null);
                setTooltip({ visible: false, x: 0, y: 0 });
            },
            click: (e) => {
                const isMunSemi = semiaridoMunicipios.includes(normalizeName(feature.properties.nome));
                const blockClick = (filtroSemiarido && !isMunSemi);

                if (!blockClick && feature.properties.territory !== 'Sem Território') {
                    const foundData = territoriosData.find(t => getTerritoryKey(t.nome) === tKey);
                    if (selectedTerritory && getTerritoryKey(selectedTerritory.nome) === tKey) {
                        onSelectTerritory(null);
                    } else {
                        onSelectTerritory(foundData);
                    }
                }
            }
        });
    };

    const handleMouseMove = (e) => {
        if (!hoveredTerritory && !hoveredMunicipality) return;
        const rect = mapContainerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const tooltipWidth = 220; const tooltipHeight = 160; const offset = 15;
        let x = e.clientX - rect.left + offset; 
        let y = e.clientY - rect.top + offset;
        
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
        <div 
            ref={mapContainerRef} 
            className="relative isolate w-full h-full min-h-[500px] flex items-center justify-center bg-transparent rounded-md overflow-hidden select-none z-10"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0 })}
        >
            {loading || !geoJsonData ? (
                <div className="flex flex-col items-center text-white/50">
                    <svg className="animate-spin h-6 w-6 mb-2 text-[#8D34F9]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-[10px] font-medium tracking-widest uppercase">Carregando Malha...</span>
                </div>
            ) : (
                <MapContainer 
                    ref={mapRef}
                    center={[-12.5, -41.5]} 
                    zoom={6} 
                    zoomControl={false} 
                    scrollWheelZoom={true}
                    doubleClickZoom={false}
                    className="w-full h-full outline-none z-0"
                    style={{ background: '#141415' }} 
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                        opacity={0.8} 
                    />

                    <GeoJSON 
                        key={selectedTerritory?.nome || 'muns'}
                        ref={geoJsonLayerRef}
                        data={geoJsonData} 
                        style={styleFeature}
                        onEachFeature={onEachFeature}
                    />

                    {/* TEXTOS DOS TERRITÓRIOS (Aparecem apenas se não tiver nada selecionado) */}
                    {!selectedTerritory && Object.entries(territoryCenters).map(([name, center]) => (
                        <Marker 
                            key={name} 
                            position={[center.lat, center.lng]} 
                            icon={L.divIcon({
                                className: 'bg-transparent border-0 shadow-none',
                                html: `<div style="transform: translate(-50%, -50%); pointer-events: none;" class="px-2 py-1 rounded bg-[#18181B]/85 text-[#F9FAFB] text-[8px] font-bold uppercase tracking-widest border border-white/10 shadow-md backdrop-blur-sm whitespace-nowrap text-center">${name}</div>`,
                                iconSize: [0, 0]
                            })} 
                            interactive={false} // Não bloqueia o mouse de tocar no município por baixo
                        />
                    ))}
                </MapContainer>
            )}

            {/* ================= CONTROLES DE NAVEGAÇÃO ================= */}
            <div className="absolute bottom-6 right-6 z-[400] flex flex-col bg-[#141415]/90 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden">
                <button 
                    onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
                    className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors border-b border-white/5"
                    title="Aproximar"
                >
                    <span className="text-xl font-light leading-none mb-0.5">+</span>
                </button>
                <button 
                    onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
                    className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors border-b border-white/5"
                    title="Afastar"
                >
                    <span className="text-xl font-light leading-none mb-0.5">-</span>
                </button>
                <button 
                    onClick={() => {
                        mapRef.current?.flyTo([-12.5, -41.5], 6, { duration: 0.8, easeLinearity: 0.25 });
                        onSelectTerritory(null);
                    }}
                    className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    title="Resetar Mapa"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                    </svg>
                </button>
            </div>

            {/* ================= CAIXA LATERAL DE MUNICÍPIOS (Aberta no Foco) ================= */}
            {selectedTerritory && selectedTerritoryMunicipalities.length > 0 && (
                <div className="absolute top-4 right-4 z-[400] w-56 max-h-[calc(100%-80px)] overflow-y-auto hide-scroll p-3 rounded-md border bg-[#141415]/95 backdrop-blur-xl border-white/10 shadow-2xl transition-all animate-soft-fade pointer-events-auto">
                    <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                        <h4 className="text-[10px] font-bold text-[#8D34F9] uppercase tracking-widest leading-tight">
                            {selectedTerritory.nome}
                        </h4>
                        <button 
                            onClick={() => onSelectTerritory(null)}
                            className="text-white/30 hover:text-red-400 transition-colors bg-white/5 hover:bg-white/10 rounded-sm p-1 ml-2"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <ul className="flex flex-col gap-[2px]">
                        {municipalitiesToShow.map((m, idx) => {
                            const isSemi = semiaridoMunicipios.includes(normalizeName(m));
                            return (
                                <li key={idx} className="text-[12px] font-medium flex items-center gap-2 text-white/80 py-1 hover:bg-white/5 rounded-sm px-1.5 cursor-default transition-colors">
                                    <span className={`shrink-0 w-1.5 h-1.5 rounded-sm shadow-sm ${isSemi ? 'bg-[#F59E0B]' : 'bg-white/20'}`}></span>
                                    <span className="truncate">{m}</span>
                                </li>
                            );
                        })}
                    </ul>
                    {selectedTerritoryMunicipalities.length > 4 && (
                        <button
                            onClick={() => setIsMunListExpanded(!isMunListExpanded)}
                            className="w-full mt-2 text-center text-[10px] font-semibold text-white/50 uppercase tracking-wider py-2 rounded-sm bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            {isMunListExpanded ? 'Ver menos' : `Ver os ${selectedTerritoryMunicipalities.length} municípios`}
                        </button>
                    )}
                </div>
            )}

            {/* ================= TOOLTIP ================= */}
            {tooltip.visible && (hoveredTerritory || hoveredMunicipality) && (
                <div
                    className="absolute z-[1000] overflow-hidden rounded-md border bg-[#18181B] border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] pointer-events-none transition-opacity duration-150"
                    style={{ top: tooltip.y, left: tooltip.x, width: 220 }}
                >
                    {hoveredTerritory && hoveredData && dynamicStats && !selectedTerritory && (
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

                    {hoveredMunicipality && hoveredMunData && selectedTerritory && (
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
}