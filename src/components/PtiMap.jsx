import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, GeoJSON, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as topojson from 'topojson-client';
import territoriosMunicipios from '../data/territorioMunicipios.json';

// Paleta Soft Blue & Teal (Variations of #1D3557, #457B9D, #A8DADC)
const TERRITORY_COLORS = [
    '#1D3557', '#2A4665', '#385874', '#457B9D', '#548FB4', '#64A4CB',
    '#75B8E3', '#87CBEB', '#9FDDF3', '#A8DADC', '#96C6C8', '#85B2B4',
    '#739DA0', '#62898D', '#507479', '#3F6065', '#2E4C51', '#213B40',
    '#274D60', '#2C5E80', '#3270A0', '#3881C0', '#4293D8', '#4FA4EF',
    '#26597A', '#336D96', '#3D81B2'
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
        let fillColor = territoryColorMap[normalizedFeatName] || '#D6EAF8';
        let weight = 0.8; 
        let color = '#FFFFFF'; 

        if (blockClickAndColor && !selectedTerritory) {
            fillColor = '#E2E8F0'; 
            opacity = 0.50;
            color = '#FFFFFF';
        } else if (selectedTerritory) {
            if (isSelectedMap) {
                opacity = 0.95;
                weight = 1.2;
                color = '#FFFFFF';
                if (filtroSemiarido && isMunSemi) fillColor = '#F59E0B'; 
            } else {
                fillColor = '#E2E8F0';
                opacity = 0.35; 
                weight = 0.6;
                color = '#FFFFFF'; 
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
                        l.setStyle({ fillOpacity: 1, color: '#FFFFFF', weight: 1.5 });
                        l.bringToFront();
                    });
                } else {
                    setHoveredMunicipality(feature.properties.nome);
                    e.target.setStyle({ fillOpacity: 1, color: '#1D3557', weight: 2 });
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

        setTooltip({ visible: false, x, y });
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
                <div className="flex flex-col items-center text-[#457B9D]">
                    <svg className="animate-spin h-6 w-6 mb-2 text-[#457B9D]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-[10px] font-bold tracking-widest uppercase">Carregando Malha...</span>
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
                    style={{ background: 'transparent' }} 
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                        opacity={0.6} 
                    />

                    <GeoJSON 
                        key={selectedTerritory?.nome || 'muns'}
                        ref={geoJsonLayerRef}
                        data={geoJsonData} 
                        style={styleFeature}
                        onEachFeature={onEachFeature}
                    />

                    {/* REMOVIDO: TEXTOS DOS TERRITÓRIOS (Causava sobreposição e poluição visual, o tooltip já resolve isso) */}
                </MapContainer>
            )}

            {/* ================= CONTROLES DE NAVEGAÇÃO ================= */}
            <div className="absolute bottom-6 right-6 z-[400] flex flex-col bg-white/90 backdrop-blur-xl rounded-[18px] border border-white shadow-[0_8px_32px_rgba(29,53,87,0.1)] overflow-hidden">
                <button 
                    onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
                    className="w-10 h-10 flex items-center justify-center text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50 transition-colors border-b border-[#D6EAF8]/40"
                    title="Aproximar"
                >
                    <span className="text-xl font-medium leading-none mb-0.5">+</span>
                </button>
                <button 
                    onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
                    className="w-10 h-10 flex items-center justify-center text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50 transition-colors border-b border-[#D6EAF8]/40"
                    title="Afastar"
                >
                    <span className="text-xl font-medium leading-none mb-0.5">-</span>
                </button>
                <button 
                    onClick={() => {
                        mapRef.current?.flyTo([-12.5, -41.5], 6, { duration: 0.8, easeLinearity: 0.25 });
                        onSelectTerritory(null);
                    }}
                    className="w-10 h-10 flex items-center justify-center text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50 transition-colors"
                    title="Resetar Mapa"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                        <path d="M3 3v5h5"/>
                    </svg>
                </button>
            </div>

            {/* ================= CAIXA LATERAL DE MUNICÍPIOS (Aberta no Foco) ================= */}
            {selectedTerritory && selectedTerritoryMunicipalities.length > 0 && (
                <div className="absolute top-4 right-4 z-[400] w-64 max-h-[calc(100%-80px)] overflow-y-auto hide-scroll p-4 rounded-[20px] border bg-white/95 backdrop-blur-xl border-white shadow-[0_12px_40px_rgba(29,53,87,0.15)] transition-all animate-soft-fade pointer-events-auto">
                    <div className="flex justify-between items-center mb-3 border-b border-[#D6EAF8] pb-3">
                        <h4 className="text-[11px] font-bold text-[#1D3557] uppercase tracking-widest leading-tight">
                            {selectedTerritory.nome}
                        </h4>
                        <button 
                            onClick={() => onSelectTerritory(null)}
                            className="text-[#457B9D] hover:text-red-500 transition-colors bg-[#D6EAF8]/30 hover:bg-red-50 rounded-full p-1.5 ml-2"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <ul className="flex flex-col gap-1">
                        {municipalitiesToShow.map((m, idx) => {
                            const isSemi = semiaridoMunicipios.includes(normalizeName(m));
                            return (
                                <li key={idx} className="text-[12px] font-medium flex items-center gap-2 text-[#457B9D] py-1.5 hover:bg-[#D6EAF8]/40 rounded-lg px-2 cursor-default transition-colors">
                                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full shadow-sm ${isSemi ? 'bg-[#F59E0B]' : 'bg-[#A8DADC]'}`}></span>
                                    <span className="truncate">{m}</span>
                                </li>
                            );
                        })}
                    </ul>
                    {selectedTerritoryMunicipalities.length > 4 && (
                        <button
                            onClick={() => setIsMunListExpanded(!isMunListExpanded)}
                            className="w-full mt-3 text-center text-[10px] font-bold text-[#457B9D] hover:text-[#1D3557] uppercase tracking-wider py-2.5 rounded-lg bg-[#D6EAF8]/30 hover:bg-[#D6EAF8]/70 transition-colors"
                        >
                            {isMunListExpanded ? 'Ver menos' : `Ver os ${selectedTerritoryMunicipalities.length} municípios`}
                        </button>
                    )}
                </div>
            )}

            {/* ================= TOOLTIP ================= */}
            {tooltip.visible && (hoveredTerritory || hoveredMunicipality) && (
                <div
                    className="absolute z-[1000] overflow-hidden rounded-[16px] border bg-white/95 backdrop-blur-md border-white shadow-[0_12px_40px_rgba(29,53,87,0.15)] pointer-events-none transition-opacity duration-150"
                    style={{ top: tooltip.y, left: tooltip.x, width: 240 }}
                >
                    {hoveredTerritory && hoveredData && dynamicStats && !selectedTerritory && (
                        <>
                            <div className="h-1.5 w-full" style={{ backgroundColor: territoryColorMap[getTerritoryKey(hoveredData.nome)] || '#457B9D' }}></div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className="font-bold text-[13px] text-[#1D3557] leading-tight pr-2">{hoveredData.nome}</h2>
                                    {dynamicStats.pctSemiarido > 0 && (
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${dynamicStats.pctSemiarido >= 100 ? 'text-[#D97706] bg-[#FEF3C7]' : 'text-[#D97706] bg-[#FEF3C7]/60'}`}>
                                            {dynamicStats.pctSemiarido >= 100 ? '100%' : `${dynamicStats.pctSemiarido.toFixed(0)}%`} Semi
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="rounded-xl p-2 border bg-[#F1FAEE]/50 border-[#D6EAF8]/50 flex flex-col">
                                        <span className="text-[10px] text-[#457B9D] font-medium mb-0.5">Ativos</span>
                                        <span className="text-[14px] font-bold text-[#1D3557]">{dynamicStats.capacidadeCti}</span>
                                    </div>
                                    <div className="rounded-xl p-2 border bg-[#F1FAEE]/50 border-[#D6EAF8]/50 flex flex-col">
                                        <span className="text-[10px] text-[#457B9D] font-medium mb-0.5">Média IFDM</span>
                                        <span className="text-[14px] font-bold text-[#1D3557]">{dynamicStats.ifdm}</span>
                                    </div>
                                </div>
                                <div className="rounded-xl p-2 border bg-[#F1FAEE]/50 border-[#D6EAF8]/50 flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-[#457B9D] font-medium">Conecta Bahia</span>
                                    <span className="text-[12px] font-bold text-[#1D3557]">{dynamicStats.conectaBahia}</span>
                                </div>
                                <div className="rounded-xl p-2 border bg-[#F1FAEE]/50 border-[#D6EAF8]/50 flex flex-col">
                                    <span className="text-[10px] text-[#457B9D] font-medium mb-0.5">Cadeias Produtivas</span>
                                    <span className="text-[11px] text-[#1D3557] font-medium truncate" title={dynamicStats.cadeiasIgs}>{dynamicStats.cadeiasIgs || '-'}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {hoveredMunicipality && hoveredMunData && selectedTerritory && (
                        <>
                            <div className="h-1.5 w-full bg-[#457B9D]"></div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <h2 className="font-bold text-[13px] text-[#1D3557] leading-tight pr-2">{hoveredMunData.nome}</h2>
                                    {hoveredMunData.isSemi && (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 text-[#D97706] bg-[#FEF3C7]">Semi</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="rounded-xl p-2 border bg-[#F1FAEE]/50 border-[#D6EAF8]/50 flex flex-col">
                                        <span className="text-[10px] text-[#457B9D] font-medium mb-0.5">Ativos CT&I</span>
                                        <span className="text-[14px] font-bold text-[#1D3557]">{hoveredMunData.entidadesCount}</span>
                                    </div>
                                    <div className="rounded-xl p-2 border bg-[#F1FAEE]/50 border-[#D6EAF8]/50 flex flex-col">
                                        <span className="text-[10px] text-[#457B9D] font-medium mb-0.5">Cadeias/IGs</span>
                                        <span className="text-[14px] font-bold text-[#1D3557]">{hoveredMunData.cadeiasCount}</span>
                                    </div>
                                </div>
                                <div className="rounded-xl p-2 border bg-[#F1FAEE]/50 border-[#D6EAF8]/50 flex justify-between items-center">
                                    <span className="text-[10px] text-[#457B9D] font-medium">Índice FIRJAN</span>
                                    <span className="text-[12px] font-bold text-[#1D3557]">{hoveredMunData.ifdm}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}