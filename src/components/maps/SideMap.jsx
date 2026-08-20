import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Supercluster from 'supercluster';
import * as topojson from 'topojson-client';
import { MapPin, ExternalLink, Layers, Check, ChevronDown, ChevronUp } from 'lucide-react';

// BASE DE MUNICÍPIOS E MAPEAMENTO
import { municipiosDB } from '../../data/municipiosDB';

function normalizeName(value) {
  if (!value) return '';
  let norm = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const correcoes = {
    'dias davila': 'dias d avila',
    'santa teresinha': 'santa terezinha',
    'camaca': 'camacan',
    'xique xique': 'xiquexique',
    'muquem de sao francisco': 'muquem do sao francisco'
  };

  return correcoes[norm] || norm;
}

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

// 1. ÍCONE DE CLUSTER CLEAN
const createClusterIcon = (count) => {
  const size = count >= 50 ? 30 : count >= 10 ? 26 : 22;
  const fontSize = count >= 50 ? 11.5 : count >= 10 ? 10.5 : 9.5;

  return L.divIcon({
    className: 'custom-clean-cluster-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: #1D3557;
        border: 2px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 800;
        font-size: ${fontSize}px;
        font-family: inherit;
        cursor: pointer;
        user-select: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        transition: transform 0.15s ease;
      ">
        ${count}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// 2. ÍCONE DE PONTO INDIVIDUAL COMPACTO (13px)
const createSingleAssetIcon = (colorHex) => L.divIcon({
  className: 'custom-clean-asset-dot',
  html: `
    <div style="
      background-color: ${colorHex || '#2563EB'};
      width: 13px;
      height: 13px;
      border-radius: 50%;
      border: 1.5px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      transition: transform 0.15s ease;
      cursor: pointer;
    "></div>
  `,
  iconSize: [13, 13],
  iconAnchor: [6.5, 6.5],
  popupAnchor: [0, -6.5]
});

// Camada dinâmica de Tiles (rótulos aparecem em zoom >= 10)
function ZoomDependentTileLayer() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoomEnd = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoomEnd);
    return () => map.off('zoomend', handleZoomEnd);
  }, [map]);

  const showLabels = zoom >= 10;
  const url = showLabels
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';

  return <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url={url} />;
}

// Manipulador de clique no mapa vazio (desfixa e recua zoom)
function MapClickHandler({ onClearPinned }) {
  const map = useMap();
  useMapEvents({
    click: (e) => {
      onClearPinned();
      if (e.originalEvent.target.classList.contains('leaflet-container') || e.originalEvent.target.tagName === 'path') {
        const currentZoom = map.getZoom();
        if (currentZoom > 6) {
          map.flyTo(map.getCenter(), Math.max(6, currentZoom - 2), { duration: 0.8 });
        }
      }
    }
  });
  return null;
}

// Centraliza a visão quando um ativo é focado externamente
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] !== 0) {
      const currentZoom = map.getZoom();
      const targetZoom = Math.max(currentZoom, 13);
      map.flyTo(coords, targetZoom, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

// Componente de Marcadores Clusterizados e Individuais
function SuperclusteredMarkers({ processedAtivos = [], pinnedAssetId, setPinnedAssetId }) {
  const map = useMap();
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(map.getZoom());

  const superclusterIndex = useMemo(() => {
    const points = processedAtivos
      .filter((a) => a.lat && a.lng && !isNaN(a.lat) && !isNaN(a.lng) && a.lat !== 0)
      .map((a) => ({
        type: 'Feature',
        properties: {
          cluster: false,
          ativoId: a.id,
          ativoData: a
        },
        geometry: {
          type: 'Point',
          coordinates: [a.lng, a.lat]
        }
      }));

    const sc = new Supercluster({
      radius: 45,
      maxZoom: 15,
      minPoints: 2
    });

    sc.load(points);
    return sc;
  }, [processedAtivos]);

  const updateMapState = useCallback(() => {
    const b = map.getBounds();
    setBounds([
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth()
    ]);
    setZoom(map.getZoom());
  }, [map]);

  useEffect(() => {
    updateMapState();
    map.on('moveend', updateMapState);
    map.on('zoomend', updateMapState);
    return () => {
      map.off('moveend', updateMapState);
      map.off('zoomend', updateMapState);
    };
  }, [map, updateMapState]);

  const clusters = useMemo(() => {
    if (!bounds || !superclusterIndex) return [];
    return superclusterIndex.getClusters(bounds, Math.floor(zoom));
  }, [bounds, zoom, superclusterIndex]);

  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const isCluster = cluster.properties.cluster;

        // CASO 1: É UM CLUSTER
        if (isCluster) {
          const pointCount = cluster.properties.point_count;
          const clusterId = cluster.id;

          return (
            <Marker
              key={`cluster-${clusterId}`}
              position={[lat, lng]}
              icon={createClusterIcon(pointCount)}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(
                    superclusterIndex.getClusterExpansionZoom(clusterId),
                    15
                  );
                  map.flyTo([lat, lng], expansionZoom, { duration: 0.8 });
                }
              }}
            />
          );
        }

        // CASO 2: É UM ATIVO INDIVIDUAL
        const ativo = cluster.properties.ativoData;
        if (!ativo) return null;

        const isPinned = pinnedAssetId === ativo.id;

        return (
          <Marker
            key={`ativo-${ativo.id}`}
            position={[lat, lng]}
            icon={createSingleAssetIcon(ativo.corHex)}
            eventHandlers={{
              mouseover: (e) => {
                e.target.openPopup();
              },
              mouseout: (e) => {
                if (pinnedAssetId !== ativo.id) {
                  e.target.closePopup();
                }
              },
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                setPinnedAssetId(ativo.id);
                e.target.openPopup();

                const currentZoom = map.getZoom();
                const targetZoom = Math.max(currentZoom, 13);
                map.flyTo([ativo.lat, ativo.lng], targetZoom, { duration: 0.8 });
              }
            }}
          >
            <Popup className="custom-popup" autoPan={false} closeButton={isPinned}>
              <div className="p-1 max-w-[240px] relative">
                <div className="flex items-center gap-2 mb-1.5 pr-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${ativo.cor ? `${ativo.cor}/10` : 'bg-blue-50'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${ativo.cor || 'bg-[#2563EB]'}`}></span>
                  </div>
                  <span className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider truncate">
                    {ativo.tipo}
                  </span>
                </div>
                <h4 className="font-extrabold text-[#1D3557] text-[12.5px] leading-snug mb-1">
                  {ativo.nome}
                </h4>
                <div className="flex items-center justify-between mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-[11px]">
                  <span className="font-bold text-[#457B9D] flex items-center gap-1 truncate">
                    <MapPin size={12} className="shrink-0" /> {ativo.municipio}
                  </span>
                  {ativo.territorio && (
                    <span className="font-bold text-[#1D3557] truncate max-w-[90px]" title={ativo.territorio}>
                      {ativo.territorio}
                    </span>
                  )}
                </div>
                {ativo.urlReferencia && (
                  <a
                    href={ativo.urlReferencia}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-[#2563EB] hover:underline mt-2"
                  >
                    <ExternalLink size={10} /> Fonte dos dados
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// ================= MAPA PRINCIPAL =================
export default function SideMap({
  processedAtivos = [],
  focusedAsset = null,
  onSelectTerritory = () => {}
}) {
  const mapRef = useRef(null);
  const [territoriosGeoJson, setTerritoriosGeoJson] = useState(null);
  const [pinnedAssetId, setPinnedAssetId] = useState(null);
  const [hoveredTerritory, setHoveredTerritory] = useState(null);
  const [isLayerControlOpen, setIsLayerControlOpen] = useState(false);

  const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);

  // Extração das categorias disponíveis para o Layer Control
  const allCategories = useMemo(() => {
    const map = {};
    processedAtivos.forEach((a) => {
      const tipo = a.tipo || 'Outros';
      if (!map[tipo]) {
        map[tipo] = {
          key: tipo,
          label: a.shortTipo || tipo,
          corHex: a.corHex || '#2563EB',
          count: 0
        };
      }
      map[tipo].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [processedAtivos]);

  // Conjunto de categorias ativas
  const [activeCategoryKeys, setActiveCategoryKeys] = useState(new Set());

  // Inicializa com todas as categorias ativas
  useEffect(() => {
    if (allCategories.length > 0) {
      setActiveCategoryKeys(new Set(allCategories.map((c) => c.key)));
    }
  }, [allCategories]);

  const toggleCategory = (key) => {
    setActiveCategoryKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllCategories = () => {
    setActiveCategoryKeys(new Set(allCategories.map((c) => c.key)));
  };

  const deselectAllCategories = () => {
    setActiveCategoryKeys(new Set());
  };

  // Ativos filtrados pelo painel de camadas
  const visibleAtivos = useMemo(() => {
    return processedAtivos.filter((a) => activeCategoryKeys.has(a.tipo || 'Outros'));
  }, [processedAtivos, activeCategoryKeys]);

  // Estatísticas de ativos por território
  const territoryStats = useMemo(() => {
    const stats = {};
    visibleAtivos.forEach((a) => {
      const rawTerr = (a.territorio || '').replace(/^Território de Identidade\s+/i, '').trim();
      if (rawTerr) {
        if (!stats[rawTerr]) stats[rawTerr] = { count: 0 };
        stats[rawTerr].count += 1;
      }
    });
    return stats;
  }, [visibleAtivos]);

  // Processa as divisas por território
  useEffect(() => {
    fetch('/BA_(1)9396399957704198.json')
      .then((resp) => resp.json())
      .then((topology) => {
        const geometries = topology.objects.BA.geometries;
        const groups = {};

        geometries.forEach((geom) => {
          const nome = geom.properties?.NOME || geom.properties?.nome || '';
          const dbInfo = municipioTerritoryMap[normalizeName(nome)];
          const idTerr = dbInfo ? dbInfo.id_territorio : 'outros';

          if (!groups[idTerr]) {
            groups[idTerr] = {
              nome_territorio: dbInfo ? dbInfo.nome_territorio : 'Outros',
              geoms: []
            };
          }
          groups[idTerr].geoms.push(geom);
        });

        const features = Object.entries(groups).map(([idTerr, group]) => {
          const mergedGeometry = topojson.merge(topology, group.geoms);
          return {
            type: 'Feature',
            properties: {
              id_territorio: idTerr,
              nome_territorio: group.nome_territorio
            },
            geometry: mergedGeometry
          };
        });

        setTerritoriosGeoJson({
          type: 'FeatureCollection',
          features
        });
      })
      .catch((err) => console.error('Erro ao processar divisas dos territórios:', err));
  }, [municipioTerritoryMap]);

  // Estilo fluido das divisas dos territórios
  const territoryBorderStyle = (feature) => {
    const rawNome = feature?.properties?.nome_territorio || '';
    const nome = rawNome.replace(/^Território de Identidade\s+/i, '').trim();
    const isHovered = hoveredTerritory === nome;

    return {
      fillColor: isHovered ? '#2563EB' : 'transparent',
      fillOpacity: isHovered ? 0.08 : 0,
      color: isHovered ? '#2563EB' : '#1D3557',
      weight: isHovered ? 1.8 : 1.1,
      opacity: isHovered ? 0.75 : 0.25,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'transition-all duration-300 cursor-pointer'
    };
  };

  const onEachTerritoryFeature = (feature, layer) => {
    const rawNome = feature?.properties?.nome_territorio || '';
    const nome = rawNome.replace(/^Território de Identidade\s+/i, '').trim();

    layer.on({
      mouseover: () => setHoveredTerritory(nome),
      mouseout: () => setHoveredTerritory(null),
      click: () => {
        const bounds = layer.getBounds();
        mapRef.current?.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
        onSelectTerritory({ id_territorio: feature.properties.id_territorio, nome_territorio: nome });
      }
    });
  };

  return (
    <div className="relative w-full h-full min-h-0 flex items-center justify-center bg-transparent rounded-md overflow-hidden select-none z-10 flex-1">
      <MapContainer
        ref={mapRef}
        preferCanvas={true}
        center={[-12.5, -41.5]}
        zoom={6}
        minZoom={5.5}
        maxBounds={[
          [-18.5, -47.0],
          [-8.0, -37.0]
        ]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="w-full h-full z-0 flex-1 min-h-0 outline-none"
        zoomControl={false}
        style={{ background: 'transparent' }}
      >
        <ZoomDependentTileLayer />
        <MapClickHandler onClearPinned={() => setPinnedAssetId(null)} />

        {/* CAMADA DE DIVISAS DOS TERRITÓRIOS COM HOVER FLUIDO */}
        {territoriosGeoJson && (
          <GeoJSON
            key={`territorios-layer-${hoveredTerritory || 'none'}`}
            data={territoriosGeoJson}
            style={territoryBorderStyle}
            onEachFeature={onEachTerritoryFeature}
          />
        )}

        {focusedAsset && <ChangeMapView coords={focusedAsset} />}

        {/* MARCADORES COM SUPERCLUSTER E POPUP FIXÁVEL */}
        <SuperclusteredMarkers 
          processedAtivos={visibleAtivos} 
          pinnedAssetId={pinnedAssetId} 
          setPinnedAssetId={setPinnedAssetId} 
        />
      </MapContainer>

      {/* NOME DO TERRITÓRIO NO HOVER */}
      {hoveredTerritory && (
        <div className="absolute top-3 left-3.5 z-[400] pointer-events-none select-none flex items-center gap-1.5">
          <span
            className="text-[#1D3557] font-black text-[12.5px] tracking-tight"
            style={{
              textShadow: '0 0 8px #ffffff, 0 0 14px #ffffff, 0 1px 2px rgba(255,255,255,0.95)'
            }}
          >
            {hoveredTerritory}
          </span>
          {territoryStats[hoveredTerritory] && (
            <span
              className="text-[#2563EB] font-extrabold text-[10.5px]"
              style={{
                textShadow: '0 0 8px #ffffff, 0 0 12px #ffffff'
              }}
            >
              · {territoryStats[hoveredTerritory].count} {territoryStats[hoveredTerritory].count === 1 ? 'ativo' : 'ativos'}
            </span>
          )}
        </div>
      )}

      {/* CONTROLE DE CAMADAS (LAYER CONTROL) */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col items-end">
        <button
          type="button"
          onClick={() => setIsLayerControlOpen(!isLayerControlOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-bold transition-all border cursor-pointer select-none shadow-sm ${
            isLayerControlOpen
              ? 'bg-[#1D3557] text-white border-[#1D3557]'
              : 'bg-white/95 backdrop-blur-md text-[#1D3557] border-[#CBD5E1] hover:bg-white hover:border-[#2563EB]'
          }`}
        >
          <Layers size={13} className={isLayerControlOpen ? 'text-white' : 'text-[#2563EB]'} />
          <span>Camadas</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
            isLayerControlOpen ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#457B9D]'
          }`}>
            {activeCategoryKeys.size}/{allCategories.length}
          </span>
          {isLayerControlOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* PAINEL DE CONTROLE DE CAMADAS */}
        {isLayerControlOpen && (
          <div className="mt-1.5 w-[230px] max-h-[300px] overflow-y-auto hide-scroll bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_24px_rgba(29,53,87,0.18)] border border-[#E2E8F0] p-2 flex flex-col gap-1">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-1 px-1">
              <span className="text-[9.5px] font-extrabold text-[#A0AEC0] uppercase tracking-wider">
                Filtrar Tipos ({visibleAtivos.length} ativos)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={selectAllCategories}
                  className="text-[9px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                >
                  Todas
                </button>
                <span className="text-gray-300">·</span>
                <button
                  type="button"
                  onClick={deselectAllCategories}
                  className="text-[9px] font-bold text-[#457B9D] hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-0.5 pt-0.5">
              {allCategories.map((cat) => {
                const isActive = activeCategoryKeys.has(cat.key);

                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => toggleCategory(cat.key)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-xl text-[10.5px] font-semibold transition-colors cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#F8FAFC] text-[#1D3557] hover:bg-[#F1F5F9]'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                          isActive
                            ? 'border-transparent text-white'
                            : 'border-[#CBD5E1] bg-white'
                        }`}
                        style={{ backgroundColor: isActive ? cat.corHex : 'transparent' }}
                      >
                        {isActive && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className={`truncate ${isActive ? 'font-bold text-[#1D3557]' : 'font-normal'}`}>
                        {cat.label}
                      </span>
                    </div>
                    <span className={`text-[9.5px] font-bold shrink-0 ml-1 ${
                      isActive ? 'text-[#457B9D]' : 'text-gray-300'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CONTROLES DE ZOOM E RESET */}
      <div className="absolute bottom-3 right-3 z-[400] flex flex-col bg-white/95 backdrop-blur-md rounded-[14px] border border-[#CBD5E1] shadow-sm overflow-hidden">
        <button
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
          className="w-7 h-7 flex items-center justify-center text-[#457B9D] hover:text-[#1D3557] hover:bg-[#F1F5F9] transition-colors border-b border-[#E2E8F0] cursor-pointer"
          title="Aproximar"
        >
          <span className="text-sm font-bold leading-none">+</span>
        </button>
        <button
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
          className="w-7 h-7 flex items-center justify-center text-[#457B9D] hover:text-[#1D3557] hover:bg-[#F1F5F9] transition-colors border-b border-[#E2E8F0] cursor-pointer"
          title="Afastar"
        >
          <span className="text-sm font-bold leading-none">-</span>
        </button>
        <button
          onClick={() => {
            setPinnedAssetId(null);
            mapRef.current?.flyTo([-12.5, -41.5], 6, { duration: 0.8 });
            onSelectTerritory(null);
          }}
          className="w-7 h-7 flex items-center justify-center text-[#457B9D] hover:text-[#1D3557] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          title="Resetar Mapa"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </div>
  );
}