import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Supercluster from 'supercluster';
import * as topojson from 'topojson-client';
import { MapPin, ExternalLink, Layers, Check, ChevronDown, ChevronUp, Building, Flame } from 'lucide-react';

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

// Ícone do Cluster de Ativos
const createClusterIcon = (count) => {
  const size = count >= 50 ? 32 : count >= 10 ? 28 : 24;
  const fontSize = count >= 50 ? 12 : count >= 10 ? 11 : 10;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: #1D3557;
        color: #FFFFFF;
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: ${fontSize}px;
        box-shadow: 0 4px 12px rgba(29, 53, 87, 0.4);
        cursor: pointer;
        font-family: inherit;
        transition: transform 0.2s ease;
      ">
        ${count}
      </div>
    `,
    className: 'custom-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Ícone de Ativo Individual
const createSingleAssetIconWithSvg = (corHex, svgMarkup) => {
  const size = 26;
  const safeColor = corHex || '#2563EB';

  const defaultSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
  const innerSvg = svgMarkup || defaultSvg;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${safeColor};
        color: #ffffff;
        border: 2px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(29, 53, 87, 0.35);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      ">
        ${innerSvg}
      </div>
    `,
    className: 'custom-single-asset-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Escala de Calor (Heatmap) de Cursos por Território
export const HEAT_LEVELS = [
  { min: 0, max: 0, label: '0 cursos', color: '#E2E8F0', text: '#64748B' },
  { min: 1, max: 5, label: '1 a 5', color: '#BAE6FD', text: '#0369A1' },
  { min: 6, max: 15, label: '6 a 15', color: '#38BDF8', text: '#0284C7' },
  { min: 16, max: 35, label: '16 a 35', color: '#2563EB', text: '#FFFFFF' },
  { min: 36, max: 70, label: '36 a 70', color: '#1D4ED8', text: '#FFFFFF' },
  { min: 71, max: Infinity, label: '70+ cursos', color: '#0F1D30', text: '#38BDF8' },
];

export const getHeatColor = (count) => {
  if (count === 0) return '#E2E8F0';
  if (count <= 5) return '#BAE6FD';
  if (count <= 15) return '#38BDF8';
  if (count <= 35) return '#2563EB';
  if (count <= 70) return '#1D4ED8';
  return '#0F1D30';
};

function ZoomDependentTileLayer() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    }
  });

  const showStreets = zoom >= 12;

  if (showStreets) {
    return (
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        opacity={0.8}
        maxZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
    );
  }

  return (
    <TileLayer
      url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      opacity={0.6}
      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
    />
  );
}

function MapClickHandler({ onClearPinned }) {
  useMapEvents({
    click: (e) => {
      const target = e.originalEvent?.target;
      if (target && (target.closest('.custom-cluster-marker') || target.closest('.custom-single-asset-marker') || target.closest('.leaflet-popup'))) {
        return;
      }
      onClearPinned();
    }
  });
  return null;
}

function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat && coords.lng) {
      map.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
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

  const updateBoundsAndZoom = useCallback(() => {
    const b = map.getBounds();
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(map.getZoom());
  }, [map]);

  useMapEvents({
    moveend: updateBoundsAndZoom,
    zoomend: updateBoundsAndZoom
  });

  useEffect(() => {
    updateBoundsAndZoom();
  }, [updateBoundsAndZoom]);

  const renderedElements = useMemo(() => {
    if (!bounds || !superclusterIndex) return [];

    const clusters = superclusterIndex.getClusters(bounds, Math.floor(zoom));
    const elements = [];

    const rawPoints = [];
    clusters.forEach((c) => {
      if (c.properties.cluster) {
        elements.push({
          isCluster: true,
          lng: c.geometry.coordinates[0],
          lat: c.geometry.coordinates[1],
          pointCount: c.properties.point_count,
          clusterId: c.properties.cluster_id,
          key: `cluster-${c.properties.cluster_id}`
        });
      } else {
        rawPoints.push({
          lng: c.geometry.coordinates[0],
          lat: c.geometry.coordinates[1],
          ativo: c.properties.ativoData,
          id: c.properties.ativoId
        });
      }
    });

    const groupedByCoord = new Map();
    rawPoints.forEach((pt) => {
      const coordKey = `${pt.lat.toFixed(5)}_${pt.lng.toFixed(5)}`;
      if (!groupedByCoord.has(coordKey)) {
        groupedByCoord.set(coordKey, []);
      }
      groupedByCoord.get(coordKey).push(pt);
    });

    groupedByCoord.forEach((items, coordKey) => {
      const total = items.length;
      items.forEach((item, idx) => {
        let finalLat = item.lat;
        let finalLng = item.lng;

        if (total > 1) {
          const spreadDistance = 0.00035 * (zoom >= 14 ? 1 : 1.8);
          if (total === 2) {
            finalLng += (idx === 0 ? -1 : 1) * spreadDistance;
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
  cursosData = [],
  mode = 'ativos', // 'ativos' | 'cursos' (Heatmap)
  focusedAsset = null,
  selectedTerritory = null,
  onSelectTerritory = () => {}
}) {
  const mapRef = useRef(null);
  const [territoriosGeoJson, setTerritoriosGeoJson] = useState(null);
  const [pinnedAssetId, setPinnedAssetId] = useState(null);
  const [hoveredTerritory, setHoveredTerritory] = useState(null);
  const [isLayerControlOpen, setIsLayerControlOpen] = useState(false);

  const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);

  // =========================================================================
  // 1. MODO ATIVOS: Categorias e Contagens
  // =========================================================================
  const allAtivosCategories = useMemo(() => {
    if (mode !== 'ativos') return [];
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
  }, [processedAtivos, mode]);

  // =========================================================================
  // 2. MODO CURSOS: Categorias e Contagens
  // =========================================================================
  const allCursosCategories = useMemo(() => {
    if (mode !== 'cursos') return [];
    const map = {};
    const colors = ['#2563EB', '#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899'];
    let colorIdx = 0;

    cursosData.forEach((c) => {
      const cat = c.categoria || 'Outras Áreas';
      if (!map[cat]) {
        map[cat] = {
          key: cat,
          label: cat,
          corHex: colors[colorIdx % colors.length],
          count: 0
        };
        colorIdx++;
      }
      map[cat].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [cursosData, mode]);

  const allCategories = mode === 'cursos' ? allCursosCategories : allAtivosCategories;
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

  // =========================================================================
  // 3. DADOS FILTRADOS (ATIVOS OU CURSOS)
  // =========================================================================
  const visibleAtivos = useMemo(() => {
    if (mode !== 'ativos') return [];
    return processedAtivos.filter((a) => activeCategoryKeys.has(a.tipo || 'Outros'));
  }, [processedAtivos, activeCategoryKeys, mode]);

  const visibleCursos = useMemo(() => {
    if (mode !== 'cursos') return [];
    return cursosData.filter((c) => activeCategoryKeys.has(c.categoria || 'Outras Áreas'));
  }, [cursosData, activeCategoryKeys, mode]);

  // Estatísticas de Cursos por Território para o Heatmap
  const cursosStatsByTerritory = useMemo(() => {
    if (mode !== 'cursos') return {};
    const stats = {};

    visibleCursos.forEach((c) => {
      const rawTerr = (c.territorio_identidade || '').replace(/^Território de Identidade\s+/i, '').trim();
      const tid = c.id_territorio ? String(c.id_territorio) : null;

      const keysToRegister = [];
      if (rawTerr) keysToRegister.push(normalizeName(rawTerr));
      if (tid) keysToRegister.push(`id_${tid}`);

      keysToRegister.forEach(k => {
        if (!stats[k]) {
          stats[k] = { count: 0, nome: c.territorio_identidade, categories: {} };
        }
        stats[k].count += 1;
        const cat = c.categoria || 'Outras';
        stats[k].categories[cat] = (stats[k].categories[cat] || 0) + 1;
      });
    });

    return stats;
  }, [visibleCursos, mode]);

  const territoryStats = useMemo(() => {
    if (mode === 'cursos') return {};
    const stats = {};
    visibleAtivos.forEach((a) => {
      const rawTerr = (a.territorio || '').replace(/^Território de Identidade\s+/i, '').trim();
      if (rawTerr) {
        if (!stats[rawTerr]) stats[rawTerr] = { count: 0 };
        stats[rawTerr].count += 1;
      }
    });
    return stats;
  }, [visibleAtivos, mode]);

  // =========================================================================
  // 4. PROCESSAMENTO DAS DIVISAS DOS 27 TERRITÓRIOS (TOPOJSON MERGE)
  // =========================================================================
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
              id_territorio: idTerr,
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

  // =========================================================================
  // 5. ESTILIZAÇÃO DAS DIVISAS / MAPA DE CALOR POR TERRITÓRIO
  // =========================================================================
  const territoryBorderStyle = (feature) => {
    const rawNome = feature?.properties?.nome_territorio || '';
    const nome = rawNome.replace(/^Território de Identidade\s+/i, '').trim();
    const idTerr = feature?.properties?.id_territorio;
    const norm = normalizeName(nome);

    const isHovered = hoveredTerritory === nome;
    const isSelected = selectedTerritory && (
      (selectedTerritory.id_territorio && String(selectedTerritory.id_territorio) === String(idTerr)) ||
      normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio) === norm
    );

    // MODO CURSOS: HEATMAP POR TERRITÓRIO
    if (mode === 'cursos') {
      const tStat = cursosStatsByTerritory[`id_${idTerr}`] || cursosStatsByTerritory[norm];
      const count = tStat ? tStat.count : 0;
      const heatColor = getHeatColor(count);

      let fillOpacity = 0.88;
      let fillColor = heatColor;
      let weight = 0.6;
      let color = '#FFFFFF';

      if (selectedTerritory) {
        if (isSelected) {
          fillOpacity = 1;
          weight = 1.2;
          color = '#FFFFFF';
        } else {
          fillOpacity = 0.25;
          fillColor = '#E2E8F0';
          weight = 0.4;
          color = '#FFFFFF';
        }
      } else if (isHovered) {
        fillOpacity = 1;
        weight = 1;
        color = '#FFFFFF';
      }

      return {
        fillColor,
        fillOpacity,
        color,
        weight,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'transition-all duration-200 cursor-pointer outline-none'
      };
    }

    // MODO ATIVOS: DIVISAS LIMPAS
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
    const idTerr = feature?.properties?.id_territorio;

    layer.on({
      mouseover: () => setHoveredTerritory(nome),
      mouseout: () => setHoveredTerritory(null),
      click: () => {
        const bounds = layer.getBounds();
        mapRef.current?.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
        
        if (selectedTerritory && (String(selectedTerritory.id_territorio) === String(idTerr) || normalizeName(selectedTerritory.nome_territorio) === normalizeName(nome))) {
          onSelectTerritory(null);
        } else {
          onSelectTerritory({ id_territorio: idTerr, nome_territorio: nome, territorio: nome });
        }
      }
    });
  };

  const hoveredCursosCount = useMemo(() => {
    if (mode !== 'cursos' || !hoveredTerritory) return null;
    const norm = normalizeName(hoveredTerritory);
    const stat = cursosStatsByTerritory[norm];
    return stat ? stat.count : 0;
  }, [mode, hoveredTerritory, cursosStatsByTerritory]);

  const hasActiveFilter = Boolean(
    pinnedAssetId ||
    selectedTerritory ||
    (allCategories.length > 0 && activeCategoryKeys.size < allCategories.length)
  );

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
            key={`territorios-layer-${mode}-${hoveredTerritory || 'none'}-${selectedTerritory?.id_territorio || 'none'}-${activeCategoryKeys.size}`}
            data={territoriosGeoJson}
            style={territoryBorderStyle}
            onEachFeature={onEachTerritoryFeature}
          />
        )}

        {focusedAsset && <ChangeMapView coords={focusedAsset} />}

        {mode === 'ativos' && (
          <SuperclusteredMarkers 
            processedAtivos={visibleAtivos} 
            pinnedAssetId={pinnedAssetId} 
            setPinnedAssetId={setPinnedAssetId} 
          />
        )}
      </MapContainer>

      {/* BADGE DE HOVER SUPERIOR ESQUERDO */}
      {hoveredTerritory && (
        <div className="absolute top-3 left-3.5 z-[400] pointer-events-none select-none flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white shadow-sm">
          {mode === 'cursos' && <Flame size={13} className="text-[#2563EB]" />}
          <span
            className="text-[#1D3557] font-extrabold text-[12px] tracking-tight"
          >
            {hoveredTerritory}
          </span>
          {mode === 'cursos' ? (
            <span className="text-[#2563EB] font-black text-[11px] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
              {hoveredCursosCount} {hoveredCursosCount === 1 ? 'curso' : 'cursos'}
            </span>
          ) : (
            territoryStats[hoveredTerritory] && (
              <span className="text-[#2563EB] font-extrabold text-[10.5px]">
                · {territoryStats[hoveredTerritory].count} {territoryStats[hoveredTerritory].count === 1 ? 'ativo' : 'ativos'}
              </span>
            )
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODO CURSOS: LEGENDA DO MAPA DE CALOR (HEATMAP SCALE) */}
      {/* ========================================================================= */}
      {mode === 'cursos' && (
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-2.5 border border-white shadow-[0_8px_24px_rgba(29,53,87,0.08)] pointer-events-auto">
          <div className="flex items-center gap-1 mb-1.5">
            <Flame size={12} className="text-[#2563EB]" />
            <span className="text-[9.5px] font-extrabold text-[#1D3557] uppercase tracking-wider">
              Densidade de Cursos
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {HEAT_LEVELS.map((lvl, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className="w-5 h-2.5 rounded-[3px] shadow-2xs border border-black/10"
                  style={{ backgroundColor: lvl.color }}
                  title={`${lvl.label}`}
                ></div>
                <span className="text-[7.5px] font-bold text-[#64748B] whitespace-nowrap">
                  {lvl.label.replace(' cursos', '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTROLE DE CAMADAS COM ÍCONES (ATIVOS OU ÁREAS DE CURSOS) */}
      {/* ========================================================================= */}
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
          <span>{mode === 'cursos' ? 'Áreas' : 'Camadas'}</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
            isLayerControlOpen ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#457B9D]'
          }`}>
            {activeCategoryKeys.size}/{allCategories.length}
          </span>
          {isLayerControlOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {isLayerControlOpen && (
          <div className="mt-1.5 w-[240px] max-h-[300px] overflow-y-auto hide-scroll bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_24px_rgba(29,53,87,0.18)] border border-[#E2E8F0] p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-1 px-1">
              <span className="text-[9.5px] font-extrabold text-[#A0AEC0] uppercase tracking-wider">
                {mode === 'cursos' ? 'Filtrar por Área' : `Filtrar Tipos (${visibleAtivos.length} ativos)`}
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
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-[10.5px] font-semibold transition-colors cursor-pointer text-left ${
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

      {/* ========================================================================= */}
      {/* CONTROLES DE ZOOM E BORRACHA CONDICIONAL VERMELHA */}
      {/* ========================================================================= */}
      <div className="absolute bottom-3 right-3 z-[400] flex flex-col bg-white/95 backdrop-blur-md rounded-[18px] border border-[#CBD5E1] shadow-sm overflow-hidden">
        <button
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
          className="w-10 h-10 flex items-center justify-center text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50 transition-colors border-b border-[#E2E8F0] cursor-pointer"
          title="Aproximar"
        >
          <span className="text-lg font-medium leading-none">+</span>
        </button>
        <button
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
          className="w-10 h-10 flex items-center justify-center text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50 transition-colors border-b border-[#E2E8F0] cursor-pointer"
          title="Afastar"
        >
          <span className="text-lg font-medium leading-none">−</span>
        </button>
        <button
          onClick={() => {
            setPinnedAssetId(null);
            setActiveCategoryKeys(new Set(allCategories.map((c) => c.key)));
            mapRef.current?.flyTo([-12.5, -41.5], 6, { duration: 0.8 });
            onSelectTerritory(null);
          }}
          className={`w-10 h-10 flex items-center justify-center transition-all cursor-pointer ${
            hasActiveFilter
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50'
          }`}
          title="Limpar filtros"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m5 11 9 9" />
          </svg>
        </button>
      </div>
    </div>
  );
}