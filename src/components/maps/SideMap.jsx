import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Supercluster from 'supercluster';
import * as topojson from 'topojson-client';
import { MapPin, ExternalLink, Layers, Check, ChevronDown, ChevronUp, Building } from 'lucide-react';

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

// Ícone do Cluster
const createClusterIcon = (count) => {
  const size = count >= 50 ? 32 : count >= 10 ? 28 : 24;
  const fontSize = count >= 50 ? 12 : count >= 10 ? 11 : 10;

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
        box-shadow: 0 3px 10px rgba(29,53,87,0.35);
        transition: transform 0.15s ease;
      ">
        ${count}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Ícone do Ativo com SVG do Tipo Embarcado
const createSingleAssetIconWithSvg = (colorHex, iconSvg) => L.divIcon({
  className: 'custom-clean-asset-dot',
  html: `
    <div style="
      background-color: ${colorHex || '#2563EB'};
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s ease;
      cursor: pointer;
    " class="hover:scale-125 active:scale-95">
      ${iconSvg || `<span style="width:5px;height:5px;background:#fff;border-radius:50%"></span>`}
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11]
});

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

function SingleAssetPopupContent({ ativo }) {
  if (!ativo) return null;

  const IconComp = ativo.icone;

  return (
    <div className="p-2 min-w-[230px] max-w-[280px] flex flex-col gap-2 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: ativo.corHex || '#2563EB' }}
          >
            {IconComp && <IconComp size={11} className="text-white" />}
          </div>
          <span className="text-[10px] font-extrabold text-[#1D3557] tracking-wider uppercase truncate">
            {ativo.shortTipo || ativo.tipo}
          </span>
        </div>
        {ativo.sigla && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#F1F5F9] text-[#457B9D] rounded-md shrink-0">
            {ativo.sigla}
          </span>
        )}
      </div>

      <h4 className="font-extrabold text-[#1D3557] text-[13px] leading-tight tracking-tight mt-0.5">
        {ativo.nome}
      </h4>

      <div className="flex flex-col gap-1 bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0]/70 text-[10.5px]">
        <div className="flex items-center gap-1.5 text-[#457B9D]">
          <MapPin size={12} className="text-[#2563EB] shrink-0" />
          <span className="font-semibold text-[#1D3557] truncate">{ativo.municipio}</span>
        </div>
        {ativo.territorio && (
          <div className="flex items-center gap-1.5 text-[#457B9D]">
            <Building size={12} className="text-[#457B9D] shrink-0" />
            <span className="font-medium text-[#457B9D] truncate">
              {ativo.territorio.replace(/^Território de Identidade\s+/i, '')}
            </span>
          </div>
        )}
      </div>

      {ativo.urlReferencia && (
        <a
          href={ativo.urlReferencia}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-1.5 mt-0.5 rounded-lg bg-[#2563EB]/10 hover:bg-[#2563EB] text-[#2563EB] hover:text-white transition-all text-[10px] font-bold shadow-xs active:scale-98"
        >
          <ExternalLink size={11} />
          <span>Acessar Informações</span>
        </a>
      )}
    </div>
  );
}

function SuperclusteredMarkers({ processedAtivos = [], pinnedAssetId, setPinnedAssetId }) {
  const map = useMap();
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(map.getZoom());

  const deduplicatedAtivos = useMemo(() => {
    const seen = new Map();

    processedAtivos.forEach((a) => {
      if (!a.lat || !a.lng || isNaN(a.lat) || isNaN(a.lng) || a.lat === 0) return;

      const normNome = normalizeName(a.nome || a.nome_ativo || '');
      const latKey = Number(a.lat).toFixed(5);
      const lngKey = Number(a.lng).toFixed(5);
      const key = `${normNome}_${latKey}_${lngKey}_${a.tipo || ''}`;

      if (!seen.has(key)) {
        seen.set(key, a);
      }
    });

    return Array.from(seen.values());
  }, [processedAtivos]);

  const superclusterIndex = useMemo(() => {
    const points = deduplicatedAtivos.map((a) => ({
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
      radius: 40,
      maxZoom: 14,
      minPoints: 2
    });

    sc.load(points);
    return sc;
  }, [deduplicatedAtivos]);

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

  const renderedElements = useMemo(() => {
    if (!bounds || !superclusterIndex) return [];
    const currentZoomLevel = Math.floor(zoom);
    const rawClusters = superclusterIndex.getClusters(bounds, currentZoomLevel);
    const elements = [];
    const unclusteredPoints = [];

    rawClusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const isCluster = cluster.properties.cluster;

      if (isCluster) {
        const pointCount = cluster.properties.point_count;
        const clusterId = cluster.id;

        if (currentZoomLevel >= 15 || pointCount <= 1) {
          const leaves = superclusterIndex.getLeaves(clusterId, 100, 0);
          leaves.forEach((leaf) => {
            unclusteredPoints.push({
              lng: leaf.geometry.coordinates[0],
              lat: leaf.geometry.coordinates[1],
              ativo: leaf.properties.ativoData,
              id: leaf.properties.ativoId
            });
          });
        } else {
          elements.push({
            isCluster: true,
            lng,
            lat,
            pointCount,
            clusterId,
            key: `cluster-${clusterId}`
          });
        }
      } else {
        unclusteredPoints.push({
          lng,
          lat,
          ativo: cluster.properties.ativoData,
          id: cluster.properties.ativoId
        });
      }
    });

    const locationGroups = {};
    unclusteredPoints.forEach((p) => {
      const locKey = `${p.lat.toFixed(4)}_${p.lng.toFixed(4)}`;
      if (!locationGroups[locKey]) {
        locationGroups[locKey] = [];
      }
      locationGroups[locKey].push(p);
    });

    Object.values(locationGroups).forEach((group) => {
      const total = group.length;

      group.forEach((item, idx) => {
        let finalLat = item.lat;
        let finalLng = item.lng;

        if (total > 1) {
          const spreadDistance = 0.00048; // ~50 metros de separação visual

          if (total === 2) {
            const offset = (idx === 0 ? -1 : 1) * spreadDistance;
            finalLng += offset;
          } else if (total === 3) {
            const angles = [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6];
            finalLat += spreadDistance * Math.sin(angles[idx]);
            finalLng += spreadDistance * Math.cos(angles[idx]);
          } else {
            const angle = (idx / total) * 2 * Math.PI;
            finalLat += spreadDistance * Math.sin(angle);
            finalLng += spreadDistance * Math.cos(angle);
          }
        }

        elements.push({
          isCluster: false,
          lng: finalLng,
          lat: finalLat,
          ativo: item.ativo,
          key: `ativo-${item.id}-${idx}`
        });
      });
    });

    return elements;
  }, [bounds, zoom, superclusterIndex]);

  return (
    <>
      {renderedElements.map((elem) => {
        if (elem.isCluster) {
          return (
            <Marker
              key={elem.key}
              position={[elem.lat, elem.lng]}
              icon={createClusterIcon(elem.pointCount)}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(
                    superclusterIndex.getClusterExpansionZoom(elem.clusterId),
                    16
                  );
                  map.flyTo([elem.lat, elem.lng], expansionZoom, { duration: 0.8 });
                }
              }}
            />
          );
        }

        const ativo = elem.ativo;
        if (!ativo) return null;

        const isPinned = pinnedAssetId === ativo.id;

        return (
          <Marker
            key={elem.key}
            position={[elem.lat, elem.lng]}
            icon={createSingleAssetIconWithSvg(ativo.corHex, ativo.iconSvg)}
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
                const targetZoom = Math.max(currentZoom, 14);
                map.flyTo([elem.lat, elem.lng], targetZoom, { duration: 0.8 });
              }
            }}
          >
            <Popup className="custom-premium-popup" autoPan={false} closeButton={isPinned}>
              <SingleAssetPopupContent ativo={ativo} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

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

  const allCategories = useMemo(() => {
    const map = {};
    processedAtivos.forEach((a) => {
      const tipo = a.tipo || 'Outros';
      if (!map[tipo]) {
        map[tipo] = {
          key: tipo,
          label: a.shortTipo || tipo,
          corHex: a.corHex || '#2563EB',
          icone: a.icone,
          count: 0
        };
      }
      map[tipo].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [processedAtivos]);

  const [activeCategoryKeys, setActiveCategoryKeys] = useState(new Set());

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

  const visibleAtivos = useMemo(() => {
    return processedAtivos.filter((a) => activeCategoryKeys.has(a.tipo || 'Outros'));
  }, [processedAtivos, activeCategoryKeys]);

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

        {territoriosGeoJson && (
          <GeoJSON
            key={`territorios-layer-${hoveredTerritory || 'none'}`}
            data={territoriosGeoJson}
            style={territoryBorderStyle}
            onEachFeature={onEachTerritoryFeature}
          />
        )}

        {focusedAsset && <ChangeMapView coords={focusedAsset} />}

        <SuperclusteredMarkers 
          processedAtivos={visibleAtivos} 
          pinnedAssetId={pinnedAssetId} 
          setPinnedAssetId={setPinnedAssetId} 
        />
      </MapContainer>

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

      {/* CONTROLE DE CAMADAS COM ÍCONES */}
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
                const IconComponent = cat.icone;

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
                      <div className="flex items-center gap-1.5 truncate">
                        {IconComponent && <IconComponent size={12} style={{ color: cat.corHex }} className="shrink-0" />}
                        <span className={`truncate ${isActive ? 'font-bold text-[#1D3557]' : 'font-normal'}`}>
                          {cat.label}
                        </span>
                      </div>
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

      {/* CONTROLES DE ZOOM */}
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