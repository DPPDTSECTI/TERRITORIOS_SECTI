import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as topojson from 'topojson-client';
import { SunMedium } from 'lucide-react';

// IMPORTANDO A NOSSA NOVA BASE DE IDs
import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';

// Paleta Soft Blue & Teal
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
 let norm = String(value || '')
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .toLowerCase()
 .replace(/[^a-z0-9]/g, ' ')
 .replace(/\s+/g, ' ')
 .trim();

 // Dicionario de Correcao (O que vem do GeoJSON -> O que esta no nosso Banco)
 // NOTA: Verifique o console e adicione os municipios faltantes aqui se necessario:
 const correcoes = {
 'dias davila': 'dias d avila',
 'santa teresinha': 'santa terezinha',
 'camaca': 'camacan',
 'xique xique': 'xiquexique',
 'muquem de sao francisco': 'muquem do sao francisco'
 };

 return correcoes[norm] || norm;
}

// 1. Mapeamos os Territórios únicos direto do nosso DB estático
const uniqueTerritories = Object.values(
 municipiosDB.reduce((acc, row) => {
 if (!acc[row.id_territorio]) {
 acc[row.id_territorio] = { id: row.id_territorio, nome: row.nome_territorio };
 }
 return acc;
 }, {})
).sort((a, b) => {
 const indexA = GEOGRAPHICAL_ORDER.indexOf(a.nome);
 const indexB = GEOGRAPHICAL_ORDER.indexOf(b.nome);
 if (indexA === -1) return 1;
 if (indexB === -1) return -1;
 return indexA - indexB;
});

// 2. Agora as cores são indexadas pelo ID DO TERRITÓRIO (Zero chance de falha!)
const territoryColorMap = {};
uniqueTerritories.forEach((territorio, index) => {
 territoryColorMap[territorio.id] = TERRITORY_COLORS[index] || '#333333';
});

// 3. Ponte de cruzamento: Nome do GeoJSON -> Objeto de IDs do Supabase
const buildMunicipioTerritoryMap = () => {
 const m = {};
 municipiosDB.forEach((row) => {
 m[normalizeName(row.nome_municipio)] = {
 id_municipio: row.id_municipio,
 id_territorio: row.id_territorio,
 nome_territorio: row.nome_territorio
 };
 });
 return m;
};

// ================= MAPA PRINCIPAL =================
export default function PtiMap({
	territoriosData = [],
	territoriesDynamicStats = {},
	searchTerm = '',
	filtroSemiarido = false,
	selectedTerritory = null,
	onSelectTerritory = () => { },
	semiaridoMunicipios = [],
	onToggleSemiarido = () => { }
}) {
 const [geoJsonData, setGeoJsonData] = useState(null);
 const [loading, setLoading] = useState(true);

 // Estados do Hover e Tooltip usam IDs
 const [hoveredTerritoryId, setHoveredTerritoryId] = useState(null);
 const [hoveredMunicipalityId, setHoveredMunicipalityId] = useState(null);

 const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
 const [isMunListExpanded, setIsMunListExpanded] = useState(false);

 const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);
 const geoJsonLayerRef = useRef(null);
 const mapContainerRef = useRef(null);
 const mapRef = useRef(null);
 const layersByTerritory = useRef({});

 useEffect(() => {
 setLoading(true);
 layersByTerritory.current = {};

 fetch('/BA_(1)9396399957704198.json')
 .then((resp) => resp.json())
 .then((topology) => {
 const geojson = topojson.feature(topology, topology.objects.BA);
 const groups = {};

 geojson.features.forEach(feat => {
 const nome = feat.properties?.NOME || feat.properties?.nome || '';
 const dbInfo = municipioTerritoryMap[normalizeName(nome)];

 if (dbInfo) {
 feat.properties.id_municipio = dbInfo.id_municipio;
 feat.properties.id_territorio = dbInfo.id_territorio;
 feat.properties.nome_territorio = dbInfo.nome_territorio;
 feat.properties.nome_municipio_oficial = dbInfo.nome_municipio;

 if (!groups[dbInfo.id_territorio]) groups[dbInfo.id_territorio] = [];
 groups[dbInfo.id_territorio].push(feat);
 } else {
 // Verificacao de municipios sem par no banco:
 console.warn(`Aviso: A cidade "${nome}" do GeoJSON nao achou par no BD.`);
 feat.properties.id_territorio = null;
 }
 });

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
		const idTer = feature.properties.id_territorio;
		if (!idTer) return { fillOpacity: 0.1, weight: 1, color: '#f87171', fillColor: '#fee2e2' };

		const dStats = territoriesDynamicStats[idTer];
		const matchesFilters = dStats ? dStats.matchesFilters : true;
		const isSelectedMap = selectedTerritory && selectedTerritory.id_territorio === idTer;
		const isMunSemi = semiaridoMunicipios.includes(normalizeName(feature.properties.nome_municipio_oficial));
		const blockClickAndColor = (filtroSemiarido && !isMunSemi) || (!isSelectedMap && !matchesFilters);

		let opacity = 0.85;
		let fillColor = territoryColorMap[idTer] || '#D6EAF8';
		let weight = 0.8;
		let color = '#FFFFFF';

		if (filtroSemiarido && !selectedTerritory) {
			if (isMunSemi) {
				fillColor = '#F59E0B';
				opacity = 0.92;
				weight = 1.0;
				color = '#FFFFFF';
			} else {
				fillColor = '#E2E8F0';
				opacity = 0.35;
				weight = 0.6;
				color = '#CBD5E1';
			}
		} else if (blockClickAndColor && !selectedTerritory) {
			fillColor = '#E2E8F0';
			opacity = 0.50;
		} else if (selectedTerritory) {
			if (isSelectedMap) {
				opacity = 0.95;
				weight = 1.2;
				if (filtroSemiarido && isMunSemi) {
					fillColor = '#F59E0B';
				} else if (filtroSemiarido && !isMunSemi) {
					fillColor = '#E2E8F0';
					opacity = 0.40;
				}
			} else {
				fillColor = '#E2E8F0';
				opacity = 0.35;
				weight = 0.6;
			}
		}

		return { fillColor, weight, opacity: 1, color, fillOpacity: opacity, className: 'outline-none' };
	};

 // ================= CONTROLE DE HOVER =================
 const onEachFeature = (feature, layer) => {
 const idTer = feature.properties.id_territorio;
 if (!idTer) return;

 if (!layersByTerritory.current[idTer]) {
 layersByTerritory.current[idTer] = [];
 }
 layersByTerritory.current[idTer].push(layer);

 layer.on({
 mouseover: (e) => {
 const isSelectedMap = selectedTerritory && selectedTerritory.id_territorio === idTer;

 if (selectedTerritory && !isSelectedMap) return;

 if (!selectedTerritory) {
 setHoveredTerritoryId(idTer);
 setHoveredMunicipalityId(null);

 layersByTerritory.current[idTer].forEach(l => {
 l.setStyle({ fillOpacity: 1, color: '#FFFFFF', weight: 1.5 });
 l.bringToFront();
 });
 } else {
 setHoveredMunicipalityId(feature.properties.id_municipio);
 e.target.setStyle({ fillOpacity: 1, color: '#1D3557', weight: 2 });
 e.target.bringToFront();
 }
 },
 mouseout: (e) => {
 if (!selectedTerritory) {
 layersByTerritory.current[idTer].forEach(l => {
 if (geoJsonLayerRef.current) geoJsonLayerRef.current.resetStyle(l);
 });
 } else {
 if (geoJsonLayerRef.current) geoJsonLayerRef.current.resetStyle(e.target);
 }

 setHoveredTerritoryId(null);
 setHoveredMunicipalityId(null);
 setTooltip({ visible: false, x: 0, y: 0 });
 },
 click: (e) => {
 const isMunSemi = semiaridoMunicipios.includes(normalizeName(feature.properties.nome_municipio_oficial));
 const blockClick = (filtroSemiarido && !isMunSemi);

 if (!blockClick) {
 const foundData = territoriosData.find(t => t.id_territorio === idTer);
 if (selectedTerritory && selectedTerritory.id_territorio === idTer) {
 onSelectTerritory(null);
 } else if (foundData) {
 onSelectTerritory(foundData);
 } else {
 // Se clicar num território que não voltou da API, manda só o básico
 onSelectTerritory({ id_territorio: idTer, nome_territorio: feature.properties.nome_territorio });
 }
 }
 }
 });
 };

 const handleMouseMove = (e) => {
 if (!hoveredTerritoryId && !hoveredMunicipalityId) return;
 const rect = mapContainerRef.current?.getBoundingClientRect();
 if (!rect) return;

 const tooltipWidth = 220; const tooltipHeight = 160; const offset = 15;
 let x = e.clientX - rect.left + offset;
 let y = e.clientY - rect.top + offset;

 if (x + tooltipWidth > rect.width) x = e.clientX - rect.left - tooltipWidth - offset;
 if (y + tooltipHeight > rect.height) y = e.clientY - rect.top - tooltipHeight - offset;

 setTooltip({ visible: true, x, y });
 };

 const hoveredData = hoveredTerritoryId ? territoriosData.find(t => t.id_territorio === hoveredTerritoryId) : null;

 // Dados temporários pro tooltip quando não tem dados da API
 const fallbackName = hoveredTerritoryId ? uniqueTerritories.find(t => t.id === hoveredTerritoryId)?.nome : '';

 const selectedTerritoryMunicipalities = useMemo(() => {
 if (!selectedTerritory || !selectedTerritory.id_territorio) return [];

 let muns = municipiosDB
 .filter(m => m.id_territorio === selectedTerritory.id_territorio)
 .map(m => m.nome_municipio);

 if (filtroSemiarido) {
 muns = muns.filter(m => semiaridoMunicipios.includes(normalizeName(m)));
 }
 return muns.sort();
 }, [selectedTerritory, filtroSemiarido, semiaridoMunicipios]);

 // Determina se o território selecionado está a Leste (Direita) ou Oeste (Esquerda) da Bahia
 const isTerritoryOnRight = useMemo(() => {
 if (!selectedTerritory) return false;
 const idTer = selectedTerritory.id_territorio;
 const muns = idTer 
 ? municipiosDB.filter(m => m.id_territorio === idTer)
 : municipiosDB.filter(m => normalizeName(m.nome_territorio) === normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || ''));
 
 if (muns.length === 0) return false;

 let sumLng = 0;
 let count = 0;
 muns.forEach(m => {
 const munNorm = normalizeName(m.nome_municipio);
 const coords = MUNICIPIOS_COORDS[m.nome_municipio] || MUNICIPIOS_COORDS[munNorm];
 if (coords) {
 sumLng += coords[1];
 count++;
 }
 });

 if (count === 0) return false;
 const avgLng = sumLng / count;
 // Se a longitude média for maior que -41.5 (Leste/Direita), o território fica no lado direito do mapa
 // Portanto, a caixa deve ficar no lado OPOSTO (Esquerda / left-4) para não cobrir a região!
 return avgLng > -41.5;
 }, [selectedTerritory]);

 const municipalitiesToShow = isMunListExpanded ? selectedTerritoryMunicipalities : selectedTerritoryMunicipalities.slice(0, 4);

 return (
 <div
 ref={mapContainerRef}
 className="relative isolate w-full h-full min-h-0 flex items-center justify-center bg-transparent rounded-md overflow-hidden select-none z-10"
 onMouseMove={handleMouseMove}
 onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0 })}
 >
 {loading || !geoJsonData ? (
 <div className="flex flex-col items-center text-primary-600">
 <svg className="animate-spin h-6 w-6 mb-2 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
 <span className="text-[11px] font-medium uppercase">Processando Malha...</span>
 </div>
 ) : (
 <MapContainer
 ref={mapRef}
 preferCanvas={true}
 center={[-12.5, -41.5]}
 zoom={6}

 // ==========================================
 // NOVAS TRAVAS DE LIMITES (BAHIA)
 // ==========================================
 minZoom={6}
 maxBounds={[
 [-18.5, -47.0], // Canto Inferior Esquerdo (Sudoeste)
 [-8.0, -37.0] // Canto Superior Direito (Nordeste)
 ]}
 maxBoundsViscosity={1.0}
 // ==========================================

 zoomControl={false}
 attributionControl={false}
 scrollWheelZoom={true}
 doubleClickZoom={false}
 className="w-full h-full outline-none z-0"
 style={{ background: 'transparent' }}
 >
 <TileLayer
 url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
 opacity={0.7}
 maxZoom={16}
 crossOrigin="anonymous"
 />

 <GeoJSON
 key={selectedTerritory?.id_territorio || 'muns'}
 ref={geoJsonLayerRef}
 data={geoJsonData}
 style={styleFeature}
 onEachFeature={onEachFeature}
 />
 </MapContainer>
 )}

 {/* ================= CONTROLES DE NAVEGAÇÃO ================= */}
 <div className="absolute bottom-6 right-6 z-[400] flex flex-col bg-white/90 backdrop-blur-xl rounded-xl border border-white shadow-[0_8px_32px_rgba(29,53,87,0.1)] overflow-hidden">
 <button
 onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
 className="w-10 h-10 flex items-center justify-center text-primary-600 hover:text-primary-950 hover:bg-surface-soft transition-colors border-b border-border cursor-pointer"
 title="Aproximar"
 >
 <span className="text-lg font-medium leading-none">+</span>
 </button>
 <button
 onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
 className="w-10 h-10 flex items-center justify-center text-primary-600 hover:text-primary-950 hover:bg-surface-soft transition-colors border-b border-border cursor-pointer"
 title="Afastar"
 >
 <span className="text-lg font-medium leading-none">−</span>
 </button>
 <button
 onClick={() => {
 mapRef.current?.flyTo([-12.5, -41.5], 6, { duration: 0.8, easeLinearity: 0.25 });
 onSelectTerritory(null);
 }}
 className={`w-10 h-10 flex items-center justify-center transition-all cursor-pointer ${
 selectedTerritory
 ? 'text-danger-600 bg-danger-50 hover:bg-danger-100'
 : 'text-primary-600 hover:text-primary-950 hover:bg-surface-soft'
 }`}
 title="Limpar seleção"
 >
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
 <path d="M22 21H7"/>
 <path d="m5 11 9 9"/>
 </svg>
 </button>
 </div>

 {/* ================= BOTÃO SEMIÁRIDO (CANTO SUPERIOR DIREITO) ================= */}
 <div className="absolute top-4 right-4 z-[400] flex items-center">
 <button
 type="button"
 onClick={() => onToggleSemiarido && onToggleSemiarido(!filtroSemiarido)}
 className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold shadow-card transition-all duration-300 border cursor-pointer select-none backdrop-blur-xl ${
 filtroSemiarido
 ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 shadow-amber-500/25 ring-2 ring-amber-400/30'
 : 'bg-white/95 hover:bg-white text-text-primary border-border/80 hover:border-amber-400/60 shadow-xs'
 }`}
 title={filtroSemiarido ? 'Desativar cruzamento com o Semiárido' : 'Cruzar dados e destacar os 278 municípios do Semiárido'}
 >
 <SunMedium size={14} className={filtroSemiarido ? 'text-white' : 'text-amber-500'} />
 <span className="tracking-tight">Semiárido</span>
 <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-colors leading-none ${
 filtroSemiarido
 ? 'bg-white/20 text-white'
 : 'bg-amber-50 text-amber-700 border border-amber-200'
 }`}>
 278 mun.
 </span>
 </button>
 </div>

 {/* ================= CAIXA LATERAL DE MUNICÍPIOS (LADO OPOSTO AO TERRITÓRIO) ================= */}
 {selectedTerritory && selectedTerritoryMunicipalities.length > 0 && (
 <div className={`absolute ${isTerritoryOnRight ? 'top-4 left-4' : 'top-[58px] right-4'} z-[400] w-64 max-h-[calc(100%-80px)] overflow-y-auto hide-scroll p-4 rounded-xl border bg-white/95 backdrop-blur-xl border-white shadow-card-soft transition-all duration-300 animate-soft-fade pointer-events-auto`}>
 <div className="flex justify-between items-center mb-3 border-b border-border pb-3">
 <h4 className="text-[11px] font-medium text-primary-950 uppercase leading-tight">
 {selectedTerritory.nome_territorio || selectedTerritory.territorio}
 </h4>
 <button
 onClick={() => onSelectTerritory(null)}
 className="text-primary-600 hover:text-danger-600 transition-colors bg-surface-soft hover:bg-danger-50 rounded-lg p-1.5 ml-2"
 >
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
 </button>
 </div>
 <ul className="flex flex-col gap-1">
 {municipalitiesToShow.map((m, idx) => {
 const isSemi = semiaridoMunicipios.includes(normalizeName(m));
 return (
 <li key={idx} className="text-[12px] font-medium flex items-center gap-2 text-text-secondary py-1.5 hover:bg-surface-soft rounded-lg px-2 cursor-default transition-colors justify-center leading-none">
 <span className={`shrink-0 w-1.5 h-1.5 rounded-full shadow-sm ${isSemi ? 'bg-warning-600' : 'bg-primary-300'}`}></span>
 <span className="truncate">{m}</span>
 </li>
 );
 })}
 </ul>
 {selectedTerritoryMunicipalities.length > 4 && (
 <button
 onClick={() => setIsMunListExpanded(!isMunListExpanded)}
 className="w-full mt-3 text-center text-[11px] font-medium text-primary-600 hover:text-primary-950 uppercase py-2.5 rounded-lg bg-surface-soft hover:bg-primary-100 transition-colors"
 >
 {isMunListExpanded ? 'Ver menos' : `Ver os ${selectedTerritoryMunicipalities.length} municípios`}
 </button>
 )}
 </div>
 )}

 {/* ================= TOOLTIP ================= */}
 {tooltip.visible && hoveredTerritoryId && !selectedTerritory && (
 <div
 className="absolute z-[1000] overflow-hidden rounded-xl border bg-white/95 backdrop-blur-md border-white shadow-card-soft pointer-events-none transition-opacity duration-150"
 style={{ top: tooltip.y, left: tooltip.x, width: 240 }}
 >
 <div className="h-1.5 w-full" style={{ backgroundColor: territoryColorMap[hoveredTerritoryId] || 'rgb(var(--color-primary-600))' }}></div>
 <div className="p-4">
 <div className="flex justify-between items-start mb-3">
 <h2 className="font-medium text-[13px] text-primary-950 leading-tight pr-2">
 {hoveredData ? hoveredData.territorio : fallbackName}
 </h2>
 </div>
 <div className="grid grid-cols-2 gap-2 mb-2">
 <div className="rounded-xl p-2 border bg-surface-soft border-border flex flex-col">
 <span className="text-[10px] text-text-muted font-medium mb-0.5">Ativos</span>
 <span className="text-[14px] font-medium text-primary-950">{hoveredData?.ativos_cti || 0}</span>
 </div>
 <div className="rounded-xl p-2 border bg-surface-soft border-border flex flex-col">
 <span className="text-[10px] text-text-muted font-medium mb-0.5">Média IFDM</span>
 <span className="text-[14px] font-medium text-primary-950">
 {hoveredData?.media_ifdm
 ? (Math.trunc(Number(hoveredData.media_ifdm) * 1000) / 1000).toFixed(3)
 : '0.000'}
 </span>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}