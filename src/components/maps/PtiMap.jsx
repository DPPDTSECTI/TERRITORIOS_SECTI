import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, GeoJSON, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as topojson from 'topojson-client';

// IMPORTANDO A NOSSA NOVA BASE DE IDs
import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';
import { isMunicipioSemiarido } from '../../constants/semiarido';

// Paleta Soft Blue & Teal (Modo Normal)
const TERRITORY_COLORS = [
 '#1D3557', '#2A4665', '#385874', '#457B9D', '#548FB4', '#64A4CB',
 '#75B8E3', '#87CBEB', '#9FDDF3', '#A8DADC', '#96C6C8', '#85B2B4',
 '#739DA0', '#62898D', '#507479', '#3F6065', '#2E4C51', '#213B40',
 '#274D60', '#2C5E80', '#3270A0', '#3881C0', '#4293D8', '#4FA4EF',
 '#26597A', '#336D96', '#3D81B2'
];

// Paleta Ampliada e Contrastante de Tons de Amarelo, Dourado, Âmbar e Ocre para o Semiárido
const SEMIARIDO_TERRITORY_COLORS = [
  '#F6E05E', // 0: Bacia do Rio Grande (amarelo quente)
  '#B85D19', // 1: Bacia do Rio Corrente (âmbar acobreado)
  '#EAB308', // 2: Velho Chico (girassol vibrante)
  '#78350F', // 3: Sertão do São Francisco (castanho âmbar profundo)
  '#FEE140', // 4: Piemonte Norte do Itapicuru (amarelo citrino)
  '#CA8A04', // 5: Itaparica (ouro envelhecido)
  '#C67800', // 6: Irecê (açafrão escuro)
  '#FDE68A', // 7: Chapada Diamantina (amarelo pastel iluminado)
  '#F59E0B', // 8: Piemonte da Diamantina (âmbar clássico)
  '#C2410C', // 9: Sisal (âmbar terracota)
  '#FFF59D', // 10: Bacia do Jacuípe (amarelo creme suave)
  '#FDE047', // 11: Semiárido Nordeste II (amarelo canário)
  '#B8860B', // 12: Litoral Norte e Agreste Baiano (goldenrod escuro)
  '#FACC15', // 13: Portal do Sertão (amarelo ouro vibrante)
  '#92400E', // 14: Metropolitano de Salvador (castanho âmbar)
  '#FEF08A', // 15: Recôncavo (amarelo manteiga suave)
  '#CD7F32', // 16: Baixo Sul (bronze dourado)
  '#FBBF24', // 17: Vale do Jiquiriçá (calêndula / ouro solar)
  '#A16207', // 18: Piemonte do Paraguaçu (ocre dourado)
  '#854D0E', // 19: Médio Rio de Contas (ocre escuro)
  '#ECC94B', // 20: Sudoeste Baiano (trigo dourado)
  '#D97706', // 21: Sertão Produtivo (ouro mostarda)
  '#9A3412', // 22: Bacia do Paramirim (caramelo tostado)
  '#D48806', // 23: Médio Sudoeste da Bahia (mel queimado)
  '#F5D061', // 24: Litoral Sul (ouro areia)
  '#B45309', // 25: Costa do Descobrimento (âmbar conhaque)
  '#FCD34D'  // 26: Extremo Sul (damasco dourado)
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
const semiaridoTerritoryColorMap = {};
uniqueTerritories.forEach((territorio, index) => {
 territoryColorMap[territorio.id] = TERRITORY_COLORS[index] || '#333333';
 semiaridoTerritoryColorMap[territorio.id] = SEMIARIDO_TERRITORY_COLORS[index] || '#F59E0B';
});

// 3. Ponte de cruzamento: Nome do GeoJSON -> Objeto de IDs do Supabase
const buildMunicipioTerritoryMap = () => {
 const m = {};
 municipiosDB.forEach((row) => {
  m[normalizeName(row.nome_municipio)] = {
  id_municipio: row.id_municipio,
  id_territorio: row.id_territorio,
  nome_territorio: row.nome_territorio,
  nome_municipio: row.nome_municipio
  };
 });
 return m;
};

// Rastreador de zoom do Leaflet
function ZoomTracker({ onZoomChange }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    }
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

// ================= MAPA PRINCIPAL =================
export default function PtiMap({
	territoriosData = [],
	territoriesDynamicStats = {},
	searchTerm = '',
	filtroSemiarido = false,
	selectedTerritory = null,
	onSelectTerritory = () => { },
	semiaridoMunicipios = [],
	onToggleSemiarido = null
}) {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [mergedNormalData, setMergedNormalData] = useState(null);
  const [mergedSemiData, setMergedSemiData] = useState(null);
  const [territoryMeshes, setTerritoryMeshes] = useState({});
  const [allTerritoryMesh, setAllTerritoryMesh] = useState(null);
  const [loading, setLoading] = useState(true);

  // Controle de Zoom para exibição dinâmica de divisas municipais
  const [currentZoom, setCurrentZoom] = useState(5.8);
  const isZoomedIn = currentZoom >= 6.7;
  const showMunicipalityLines = Boolean(selectedTerritory) || isZoomedIn;

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
    layersByTerritory.current = {};
  }, [selectedTerritory, filtroSemiarido, isZoomedIn]);

  useEffect(() => {
    setLoading(true);
    layersByTerritory.current = {};

    fetch('/BA_(1)9396399957704198.json')
      .then((resp) => resp.json())
      .then((topology) => {
        const groupsNormal = {};
        const groupsSemi = {};

        // 1. Mapear id_territorio nas geometrias TopoJSON
        topology.objects.BA.geometries.forEach(geom => {
          const nome = geom.properties?.NOME || geom.properties?.nome || '';
          const dbInfo = municipioTerritoryMap[normalizeName(nome)];
          geom.id_territorio = dbInfo ? dbInfo.id_territorio : null;
          geom.nome_territorio = dbInfo ? dbInfo.nome_territorio : null;
          const isSemi = dbInfo ? isMunicipioSemiarido(dbInfo.nome_municipio) : false;
          geom.is_semiarido = isSemi;

          if (dbInfo) {
            if (!groupsNormal[dbInfo.id_territorio]) groupsNormal[dbInfo.id_territorio] = [];
            groupsNormal[dbInfo.id_territorio].push(geom);

            const semiKey = `${dbInfo.id_territorio}_${isSemi ? '1' : '0'}`;
            if (!groupsSemi[semiKey]) {
              groupsSemi[semiKey] = {
                id_territorio: dbInfo.id_territorio,
                nome_territorio: dbInfo.nome_territorio,
                is_semiarido: isSemi,
                geoms: []
              };
            }
            groupsSemi[semiKey].geoms.push(geom);
          }
        });

        // 2. Mesclar territórios em polígonos únicos (SEM LINHAS INTERNAS DE MUNICÍPIOS)
        const mergedNormal = {
          type: 'FeatureCollection',
          features: Object.entries(groupsNormal).map(([idTer, geoms]) => ({
            type: 'Feature',
            id: `ter-${idTer}`,
            properties: {
              id_territorio: Number(idTer),
              nome_territorio: geoms[0]?.nome_territorio || ''
            },
            geometry: topojson.merge(topology, geoms)
          }))
        };

        const mergedSemi = {
          type: 'FeatureCollection',
          features: Object.values(groupsSemi).map(item => ({
            type: 'Feature',
            id: `semi-${item.id_territorio}-${item.is_semiarido ? '1' : '0'}`,
            properties: {
              id_territorio: Number(item.id_territorio),
              nome_territorio: item.nome_territorio,
              is_semiarido: item.is_semiarido
            },
            geometry: topojson.merge(topology, item.geoms)
          }))
        };

        // 3. Pré-computar os contornos perimetrais de cada território
        const tMeshes = {};
        uniqueTerritories.forEach(t => {
          tMeshes[t.id] = topojson.mesh(
            topology,
            topology.objects.BA,
            (a, b) => (a.id_territorio === t.id) !== (b.id_territorio === t.id)
          );
        });

        // 3b. Mesh único com TODOS os contornos de território (para modo semiárido)
        const combinedTerritoryMesh = topojson.mesh(
          topology,
          topology.objects.BA,
          (a, b) => a.id_territorio !== b.id_territorio
        );

        // 4. Gerar GeoJSON padrão das features dos municípios (usado quando um território é selecionado)
        const geojson = topojson.feature(topology, topology.objects.BA);
        geojson.features.forEach(feat => {
          const nome = feat.properties?.NOME || feat.properties?.nome || '';
          const dbInfo = municipioTerritoryMap[normalizeName(nome)];

          if (dbInfo) {
            feat.properties.id_municipio = dbInfo.id_municipio;
            feat.properties.id_territorio = dbInfo.id_territorio;
            feat.properties.nome_territorio = dbInfo.nome_territorio;
            feat.properties.nome_municipio_oficial = dbInfo.nome_municipio;
          } else {
            console.warn(`Aviso: A cidade "${nome}" do GeoJSON nao achou par no BD.`);
            feat.properties.id_territorio = null;
          }
        });

        setMergedNormalData(mergedNormal);
        setMergedSemiData(mergedSemi);
        setTerritoryMeshes(tMeshes);
        setAllTerritoryMesh(combinedTerritoryMesh);
        setGeoJsonData(geojson);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar mapa:", err);
        setLoading(false);
      });
  }, [municipioTerritoryMap]);

  // ================= ESTILO DOS TERRITÓRIOS / MUNICÍPIOS =================
  const styleFeature = (feature) => {
    const idTer = Number(feature.properties.id_territorio);
    if (!idTer) return { fillOpacity: 0.1, stroke: false, fillColor: '#fee2e2' };

    const isSelectedMap = selectedTerritory && Number(selectedTerritory.id_territorio) === idTer;

    // 1. QUANDO HÁ UM TERRITÓRIO SELECIONADO / FILTRADO:
    if (selectedTerritory) {
      if (isSelectedMap) {
        const isMunSemi = isMunicipioSemiarido(feature.properties.nome_municipio_oficial || feature.properties.NOME || feature.properties.nome || '');
        let fillColor = territoryColorMap[idTer] || '#D6EAF8';
        let opacity = 0.95;

        if (filtroSemiarido) {
          if (isMunSemi) {
            fillColor = semiaridoTerritoryColorMap[idTer] || '#F59E0B';
          } else {
            fillColor = '#E2E8F0';
            opacity = 0.40;
          }
        }

        return {
          fillColor,
          stroke: true,
          weight: 1.2,
          color: '#FFFFFF',
          fillOpacity: opacity,
          className: 'outline-none'
        };
      }

      // Demais territórios esmaecidos sem linhas
      return {
        fillColor: '#E2E8F0',
        stroke: false,
        weight: 0,
        color: 'transparent',
        fillOpacity: 0.35,
        className: 'outline-none'
      };
    }

    // 2. QUANDO NÃO HÁ SELEÇÃO, MAS O USUÁRIO DEU ZOOM (zoom >= 6.7):
    // Aparecem as divisas dos municípios com traço branco!
    if (isZoomedIn) {
      if (filtroSemiarido) {
        const isMunSemi = isMunicipioSemiarido(feature.properties.nome_municipio_oficial || feature.properties.NOME || feature.properties.nome || '');
        if (isMunSemi) {
          return {
            fillColor: semiaridoTerritoryColorMap[idTer] || '#F59E0B',
            stroke: true,
            weight: 1.0,
            color: '#FFFFFF',
            fillOpacity: 0.92,
            className: 'outline-none'
          };
        } else {
          return {
            fillColor: '#E2E8F0',
            stroke: true,
            weight: 0.6,
            color: '#CBD5E1',
            fillOpacity: 0.35,
            className: 'outline-none'
          };
        }
      }

      const dStats = territoriesDynamicStats[idTer];
      const matchesFilters = dStats ? dStats.matchesFilters : true;
      return {
        fillColor: matchesFilters ? (territoryColorMap[idTer] || '#D6EAF8') : '#E2E8F0',
        stroke: true,
        weight: 1.0,
        color: '#FFFFFF',
        fillOpacity: matchesFilters ? 0.90 : 0.40,
        className: 'outline-none'
      };
    }

    // 3. VISÃO GERAL (SEM ZOOM E SEM FILTRO):
    // ZERO LINHAS! Polígonos mesclados puros e sem divisas.
    if (filtroSemiarido) {
      const isSemi = feature.properties.is_semiarido;
      return {
        fillColor: isSemi ? (semiaridoTerritoryColorMap[idTer] || '#F59E0B') : '#E2E8F0',
        stroke: false,
        weight: 0,
        color: 'transparent',
        fillOpacity: isSemi ? 0.95 : 0.35,
        className: 'outline-none'
      };
    }

    const dStats = territoriesDynamicStats[idTer];
    const matchesFilters = dStats ? dStats.matchesFilters : true;
    return {
      fillColor: matchesFilters ? (territoryColorMap[idTer] || '#D6EAF8') : '#E2E8F0',
      stroke: false,
      weight: 0,
      color: 'transparent',
      fillOpacity: matchesFilters ? 0.92 : 0.40,
      className: 'outline-none'
    };
  };

  // ================= CONTROLE DE HOVER =================
  const onEachFeature = (feature, layer) => {
    const idTer = Number(feature.properties.id_territorio);
    if (!idTer) return;

    if (!layersByTerritory.current[idTer]) {
      layersByTerritory.current[idTer] = [];
    }
    layersByTerritory.current[idTer].push(layer);

    layer.on({
      mouseover: (e) => {
        const isSelectedMap = selectedTerritory && Number(selectedTerritory.id_territorio) === idTer;

        if (selectedTerritory && !isSelectedMap) return;

        if (!selectedTerritory && !isZoomedIn) {
          setHoveredTerritoryId(idTer);
          setHoveredMunicipalityId(null);

          // Aumenta a opacidade do território na visão geral
          layersByTerritory.current[idTer]?.forEach(l => {
            l.setStyle({ fillOpacity: 1.0 });
          });
        } else {
          setHoveredTerritoryId(idTer);
          setHoveredMunicipalityId(feature.properties.id_municipio);
          e.target.setStyle({
            fillOpacity: 1,
            color: filtroSemiarido ? '#78350F' : '#1D3557',
            weight: 2.2
          });
          e.target.bringToFront();
        }
      },
      mouseout: (e) => {
        if (!selectedTerritory && !isZoomedIn) {
          layersByTerritory.current[idTer]?.forEach(l => {
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
        const isSemi = feature.properties.is_semiarido !== undefined
          ? feature.properties.is_semiarido
          : isMunicipioSemiarido(feature.properties.nome_municipio_oficial || feature.properties.NOME || feature.properties.nome || '');
        const blockClick = (filtroSemiarido && !isSemi);

        if (!blockClick) {
          const foundData = territoriosData.find(t => Number(t.id_territorio) === idTer);
          if (selectedTerritory && Number(selectedTerritory.id_territorio) === idTer) {
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

  const hoveredData = hoveredTerritoryId ? territoriosData.find(t => Number(t.id_territorio) === hoveredTerritoryId) : null;

  // Dados temporários pro tooltip quando não tem dados da API
  const fallbackName = hoveredTerritoryId ? uniqueTerritories.find(t => t.id === hoveredTerritoryId)?.nome : '';

  const hoveredMunName = hoveredMunicipalityId
    ? municipiosDB.find(m => m.id_municipio === hoveredMunicipalityId)?.nome_municipio
    : null;

 const selectedTerritoryMunicipalities = useMemo(() => {
    if (!selectedTerritory || !selectedTerritory.id_territorio) return [];
    const terId = Number(selectedTerritory.id_territorio);

    let muns = municipiosDB
      .filter(m => Number(m.id_territorio) === terId)
      .map(m => m.nome_municipio);

    if (filtroSemiarido) {
      muns = muns.filter(m => isMunicipioSemiarido(m));
    }
    return muns.sort();
  }, [selectedTerritory, filtroSemiarido, semiaridoMunicipios]);

  // Determina se o território selecionado está a Leste (Direita) ou Oeste (Esquerda) da Bahia
  const isTerritoryOnRight = useMemo(() => {
    if (!selectedTerritory) return false;
    const idTer = Number(selectedTerritory.id_territorio);
    const muns = idTer 
      ? municipiosDB.filter(m => Number(m.id_territorio) === idTer)
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
    return avgLng > -41.5;
  }, [selectedTerritory]);

  useEffect(() => {
    if (!geoJsonData || !mapRef.current) return;
    const timer = setTimeout(() => {
      if (geoJsonLayerRef.current && mapRef.current) {
        const b = geoJsonLayerRef.current.getBounds();
        if (b.isValid()) {
          mapRef.current.fitBounds(b, { padding: [12, 12] });
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [geoJsonData]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedTerritory && selectedTerritory.id_territorio) {
      const terId = Number(selectedTerritory.id_territorio);
      const timer = setTimeout(() => {
        const layers = layersByTerritory.current[terId];
        if (layers && layers.length > 0) {
          const group = L.featureGroup(layers);
          const b = group.getBounds();
          if (b.isValid()) {
            mapRef.current?.fitBounds(b, { padding: [24, 24], maxZoom: 8.5, duration: 0.8 });
          }
        }
      }, 60);
      return () => clearTimeout(timer);
    } else {
      if (geoJsonLayerRef.current) {
        const b = geoJsonLayerRef.current.getBounds();
        if (b.isValid()) {
          mapRef.current?.fitBounds(b, { padding: [12, 12], duration: 0.8 });
        }
      } else {
        mapRef.current?.flyTo([-12.8, -41.2], 5.8, { duration: 0.8 });
      }
    }
  }, [selectedTerritory]);

  const currentData = showMunicipalityLines
    ? geoJsonData
    : (filtroSemiarido ? mergedSemiData : mergedNormalData);

  const municipalitiesToShow = isMunListExpanded ? selectedTerritoryMunicipalities : selectedTerritoryMunicipalities.slice(0, 4);

  return (
    <div
      ref={mapContainerRef}
      className="relative isolate w-full h-full min-h-0 flex items-center justify-center bg-transparent rounded-md overflow-hidden select-none z-10"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0 })}
    >
      {loading || !currentData ? (
        <div className="flex flex-col items-center text-primary-600">
          <svg className="animate-spin h-6 w-6 mb-2 text-primary-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="text-[11px] font-medium uppercase">Processando Malha...</span>
        </div>
      ) : (
        <MapContainer
          ref={mapRef}
          preferCanvas={true}
          center={[-12.8, -41.2]}
          zoom={5.8}
          minZoom={5.0}
          maxBounds={[
            [-19.0, -47.5],
            [-7.5, -36.5]
          ]}
          maxBoundsViscosity={0.7}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={false}
          className="w-full h-full outline-none z-0"
          style={{ background: 'transparent' }}
        >
          <ZoomTracker onZoomChange={setCurrentZoom} />

          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            opacity={0.7}
            maxZoom={16}
            crossOrigin="anonymous"
          />

          <GeoJSON
            key={`${selectedTerritory ? `sel-${selectedTerritory.id_territorio}` : (isZoomedIn ? `zoom-${filtroSemiarido ? '1' : '0'}` : `overview-${filtroSemiarido ? '1' : '0'}`)}`}
            ref={geoJsonLayerRef}
            data={currentData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />

          {/* Destaque externo do território apenas ao passar o mouse quando visão geral não aproximada */}
          {hoveredTerritoryId && !selectedTerritory && !isZoomedIn && territoryMeshes[hoveredTerritoryId] && (
            <GeoJSON
              key={`hover-mesh-${hoveredTerritoryId}`}
              data={territoryMeshes[hoveredTerritoryId]}
              style={{
                color: '#FFFFFF',
                weight: 2.5,
                opacity: 1,
                fill: false
              }}
              interactive={false}
            />
          )}

          {/* Contornos de TODOS os territórios no modo semiárido (visão geral) */}
          {filtroSemiarido && !selectedTerritory && allTerritoryMesh && (
            <GeoJSON
              key={`semi-all-meshes`}
              data={allTerritoryMesh}
              style={{
                color: '#78350F',
                weight: 1.8,
                opacity: 0.5,
                fill: false
              }}
              interactive={false}
            />
          )}

          {/* Contorno perimetral externo do território selecionado quando filtrado */}
          {selectedTerritory && territoryMeshes[selectedTerritory.id_territorio] && (
            <GeoJSON
              key={`selected-mesh-${selectedTerritory.id_territorio}-${filtroSemiarido ? '1' : '0'}`}
              data={territoryMeshes[selectedTerritory.id_territorio]}
              style={{
                color: filtroSemiarido ? '#78350F' : '#1D3557',
                weight: 2.8,
                opacity: 1,
                fill: false
              }}
              interactive={false}
            />
          )}
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
            if (geoJsonLayerRef.current) {
              const b = geoJsonLayerRef.current.getBounds();
              if (b.isValid()) {
                mapRef.current?.fitBounds(b, { padding: [12, 12], duration: 0.8 });
              }
            } else {
              mapRef.current?.flyTo([-12.8, -41.2], 5.8, { duration: 0.8, easeLinearity: 0.25 });
            }
            onSelectTerritory(null);
          }}
          className={`w-10 h-10 flex items-center justify-center transition-all cursor-pointer ${
            selectedTerritory
              ? 'text-danger-600 bg-danger-50 hover:bg-danger-100'
              : 'text-primary-600 hover:text-primary-950 hover:bg-surface-soft'
          }`}
          title="Limpar seleção e ver toda a Bahia"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
            <path d="M22 21H7"/>
            <path d="m5 11 9 9"/>
          </svg>
        </button>
      </div>

 {/* ================= TOGGLE SEMIÁRIDO (CANTO SUPERIOR DIREITO) ================= */}
 {Boolean(onToggleSemiarido) && (
   <div className="absolute top-3 right-3 z-[400]">
     <button
       type="button"
       onClick={() => onToggleSemiarido && onToggleSemiarido(!filtroSemiarido)}
       title={filtroSemiarido ? 'Voltar ao Modo Normal' : 'Ativar Modo Semiárido'}
       className={`relative flex items-center gap-2 h-[32px] pl-1 pr-3 rounded-full text-[11px] font-semibold transition-all duration-300 cursor-pointer border select-none backdrop-blur-md ${
         filtroSemiarido
           ? 'bg-amber-50/95 border-amber-300 text-amber-800 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]'
           : 'bg-white/95 border-white/80 text-text-secondary hover:border-slate-300 hover:text-text-primary shadow-sm'
       }`}
     >
       <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-xs ${
         filtroSemiarido
           ? 'bg-amber-400 text-white'
           : 'bg-white border border-slate-200 text-slate-400'
       }`}>
         {filtroSemiarido ? (
           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
             <circle cx="12" cy="12" r="4"/>
             <line x1="12" y1="2" x2="12" y2="5"/>
             <line x1="12" y1="19" x2="12" y2="22"/>
             <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/>
             <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
             <line x1="2" y1="12" x2="5" y2="12"/>
             <line x1="19" y1="12" x2="22" y2="12"/>
             <line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/>
             <line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>
           </svg>
         ) : (
           <span className="w-2 h-2 rounded-full bg-slate-300 block" />
         )}
       </span>
       <span>{filtroSemiarido ? 'Semiárido' : 'Normal'}</span>
     </button>
   </div>
 )}

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
  const isSemi = isMunicipioSemiarido(m);
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
          <div
            className="h-1.5 w-full"
            style={{
              backgroundColor: filtroSemiarido
                ? (semiaridoTerritoryColorMap[hoveredTerritoryId] || '#F59E0B')
                : (territoryColorMap[hoveredTerritoryId] || 'rgb(var(--color-primary-600))')
            }}
          ></div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col">
                {hoveredMunName && (
                  <span className="text-[11px] font-semibold text-primary-600 uppercase tracking-wide mb-0.5">
                    {hoveredMunName}
                  </span>
                )}
                <h2 className="font-medium text-[13px] text-primary-950 leading-tight pr-2">
                  {hoveredData ? hoveredData.territorio : fallbackName}
                </h2>
              </div>
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