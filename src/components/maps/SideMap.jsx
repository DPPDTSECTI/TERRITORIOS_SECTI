import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Supercluster from 'supercluster';
import * as topojson from 'topojson-client';
import { MapPin, ExternalLink, Layers, Check, ChevronDown, ChevronUp } from 'lucide-react';

// BASE DE MUNICÍPIOS E COORDENADAS PARA MAPEAMENTO
import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';

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

// 1. ÍCONE DE CLUSTER ULTRA-CLEAN (SEM SOMBRAS PESADAS, CONTORNO BRANCO SÓLIDO)
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
        transition: transform 0.15s ease;
      " class="hover:scale-115 active:scale-95">
        ${count}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// 2. ÍCONE DE PONTO INDIVIDUAL COMPACTO (13px, SEM DROP-SHADOW BORRADO, STROKE BRANCO NÍTIDO)
const createSingleAssetIcon = (colorHex) => L.divIcon({
  className: 'custom-clean-asset-dot',
  html: `
    <div style="
      background-color: ${colorHex || '#2563EB'};
      width: 13px;
      height: 13px;
      border-radius: 50%;
      border: 1.5px solid #ffffff;
      transition: transform 0.15s ease;
      cursor: pointer;
    " class="hover:scale-160"></div>
  `,
  iconSize: [13, 13],
  iconAnchor: [6.5, 6.5],
  popupAnchor: [0, -6.5]
});

// Camada de Tile com controle inteligente de labels
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

// Componente para centralizar o mapa no ativo focado
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] !== 0) {
      map.flyTo(coords, 14, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

// Escutador de nível de zoom do mapa
function ZoomListener({ onZoomChange }) {
  const map = useMap();
  useEffect(() => {
    const update = () => onZoomChange(map.getZoom());
    update();
    map.on('zoomend', update);
    return () => map.off('zoomend', update);
  }, [map, onZoomChange]);
  return null;
}

// Componente de Marcadores com Supercluster para Agrupamento Inteligente
function SuperclusteredMarkers({ processedAtivos = [] }) {
  const map = useMap();
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(map.getZoom());

  // Índice Supercluster com os ativos
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
      radius: 45, // Raio de agrupamento em pixels
      maxZoom: 15, // A partir desse zoom, separa tudo em pontos individuais
      minPoints: 2
    });

    sc.load(points);
    return sc;
  }, [processedAtivos]);

  // Atualiza limites geográficos e zoom quando o mapa é movimentado
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

  // Clusters e pontos calculados para o zoom e viewport atuais
  const clusters = useMemo(() => {
    if (!bounds || !superclusterIndex) return [];
    return superclusterIndex.getClusters(bounds, Math.floor(zoom));
  }, [bounds, zoom, superclusterIndex]);

  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const isCluster = cluster.properties.cluster;

        // CASO 1: É UM CLUSTER AGRUPADO
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

        // CASO 2: É UM ATIVO INDIVIDUAL (PONTO COM COR CONTRASTANTE E POPUP)
        const ativo = cluster.properties.ativoData;
        if (!ativo) return null;

        return (
          <Marker
            key={`ativo-${ativo.id}`}
            position={[lat, lng]}
            icon={createSingleAssetIcon(ativo.corHex)}
            eventHandlers={{
              click: () => {
                map.flyTo([lat, lng], 14, { duration: 0.9 });
              }
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 max-w-[240px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${ativo.cor}/15`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${ativo.cor}`}></span>
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

// ================= MAPA PRINCIPAL COM RÓTULOS SUTIS E CONTROLE DE CAMADAS =================
export default function SideMap({
  processedAtivos = [],
  focusedAsset = null,
  onSelectTerritory = () => {}
}) {
  const mapRef = useRef(null);
  const [currentZoom, setCurrentZoom] = useState(6);
  const [territoriosGeoJson, setTerritoriosGeoJson] = useState(null);
  const [isLayerControlOpen, setIsLayerControlOpen] = useState(false);
  const [hoveredTerritory, setHoveredTerritory] = useState(null);

  const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);

  // Estatísticas de ativos por território
  const territoryStats = useMemo(() => {
    const mapStats = {};
    processedAtivos.forEach((a) => {
      const terr = (a.territorio || '').replace(/^Território de Identidade\s+/i, '').trim();
      if (!terr) return;
      if (!mapStats[terr]) {
        mapStats[terr] = { nome: terr, count: 0 };
      }
      mapStats[terr].count += 1;
    });
    return mapStats;
  }, [processedAtivos]);

  // Centroides dos 27 Territórios para os rótulos tipográficos sutis
  const territoryCentroids = useMemo(() => {
    const mapCent = {};
    municipiosDB.forEach((m) => {
      const c = MUNICIPIOS_COORDS[m.nome_municipio] || MUNICIPIOS_COORDS[normalizeName(m.nome_municipio)];
      if (c) {
        if (!mapCent[m.id_territorio]) {
          mapCent[m.id_territorio] = {
            id: m.id_territorio,
            nome: m.nome_territorio,
            latSum: 0,
            lngSum: 0,
            count: 0
          };
        }
        mapCent[m.id_territorio].latSum += c[0];
        mapCent[m.id_territorio].lngSum += c[1];
        mapCent[m.id_territorio].count += 1;
      }
    });

    return Object.values(mapCent).map((t) => ({
      id: t.id,
      nome: t.nome,
      lat: +(t.latSum / t.count).toFixed(4),
      lng: +(t.lngSum / t.count).toFixed(4)
    }));
  }, []);

  // Lista de todas as categorias únicas disponíveis com contagens e cores
  const allCategories = useMemo(() => {
    const mapCat = {};

    processedAtivos.forEach((a) => {
      const typeKey = a.tipo || 'Outros';
      if (!mapCat[typeKey]) {
        mapCat[typeKey] = {
          key: typeKey,
          label: a.shortTipo || typeKey,
          fullLabel: typeKey,
          corHex: a.corHex || '#2563EB',
          count: 0
        };
      }
      mapCat[typeKey].count += 1;
    });

    return Object.values(mapCat).sort((a, b) => b.count - a.count);
  }, [processedAtivos]);

  // Estado das categorias ativas no filtro de camadas
  const [activeCategoryKeys, setActiveCategoryKeys] = useState(() => {
    return new Set(allCategories.map((c) => c.key));
  });

  // Atualiza categorias selecionadas se novos ativos carregarem
  useEffect(() => {
    if (allCategories.length > 0) {
      setActiveCategoryKeys((prev) => {
        if (prev.size === 0) {
          return new Set(allCategories.map((c) => c.key));
        }
        return prev;
      });
    }
  }, [allCategories]);

  // Alterna uma categoria individual
  const toggleCategory = (key) => {
    setActiveCategoryKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Selecionar todas as categorias
  const selectAllCategories = () => {
    setActiveCategoryKeys(new Set(allCategories.map((c) => c.key)));
  };

  // Desmarcar todas (deixa apenas a primeira)
  const deselectAllCategories = () => {
    if (allCategories.length > 0) {
      setActiveCategoryKeys(new Set([allCategories[0].key]));
    }
  };

  // Ativos filtrados pelo controle de camadas
  const visibleAtivos = useMemo(() => {
    return processedAtivos.filter((a) => activeCategoryKeys.has(a.tipo));
  }, [processedAtivos, activeCategoryKeys]);

  // Linhas de divisa dos 27 Territórios de Identidade da Bahia
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

  // Estilo minimalista e fluido das divisas dos territórios
  const territoryBorderStyle = (feature) => {
    const nome = feature?.properties?.nome_territorio;
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
    const nome = feature?.properties?.nome_territorio;
    layer.on({
      mouseover: () => setHoveredTerritory(nome),
      mouseout: () => setHoveredTerritory(null),
      click: () => {
        const bounds = layer.getBounds();
        mapRef.current?.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
        onSelectTerritory(nome);
      }
    });
  };

  return (
    <div className="relative w-full h-full min-h-0 flex items-center justify-center bg-transparent rounded-md overflow-hidden select-none z-10 flex-1">
      <MapContainer
        ref={mapRef}
        center={[-12.5, -41.7]}
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
        {/* ESCUTADOR DE ZOOM */}
        <ZoomListener onZoomChange={setCurrentZoom} />

        {/* CAMADA DE TILE DINÂMICA */}
        <ZoomDependentTileLayer />

        {/* CAMADA DE DIVISAS DOS TERRITÓRIOS COM HOVER FLUIDO */}
        {territoriosGeoJson && (
          <GeoJSON
            key={`territorios-layer-${hoveredTerritory || 'none'}`}
            data={territoriosGeoJson}
            style={territoryBorderStyle}
            onEachFeature={onEachTerritoryFeature}
          />
        )}

        {/* MARCADORES COM SUPERCLUSTER */}
        <SuperclusteredMarkers processedAtivos={visibleAtivos} />

        {focusedAsset && <ChangeMapView coords={focusedAsset} />}
      </MapContainer>

      {/* NOME DO TERRITÓRIO BEM MENOR E ACIMA QUASE NA MARGEM (SEM PÍLULA/FUNDO) */}
      {hoveredTerritory && (
        <div className="absolute top-3 left-3.5 z-[400] pointer-events-none select-none animate-in fade-in duration-150 flex items-center gap-1.5">
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

      {/* CONTROLE DE CAMADAS INTERATIVO (LAYER CONTROL) NO TOPO DIREITO */}
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

        {/* PAINEL DE CONTROLE DE CAMADAS FLUTUANTE */}
        {isLayerControlOpen && (
          <div className="mt-1.5 w-[230px] max-h-[300px] overflow-y-auto hide-scroll bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_24px_rgba(29,53,87,0.18)] border border-[#E2E8F0] p-2 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1">
            {/* CABEÇALHO DO PAINEL COM AÇÕES RÁPIDAS */}
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

            {/* LISTA DE CAMADAS COM CHECKBOX, COR RESTAURADA E CONTAGEM */}
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
                      {/* CAIXA DE CHECK CUSTOMIZADA COM COR */}
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

      {/* CONTROLES DE ZOOM E RESET COMPACTOS */}
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
            mapRef.current?.flyTo([-12.5, -41.7], 6, { duration: 0.8 });
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