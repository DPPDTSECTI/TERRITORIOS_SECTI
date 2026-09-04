import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Supercluster from 'supercluster';
import * as topojson from 'topojson-client';
import { MapPin, Layers, Check, ChevronDown, ChevronUp, Building, Flame, Network, Maximize2, Minimize2 } from 'lucide-react';

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

const MUN_LOOKUP = (() => {
  const byId = {};
  const byName = {};
  municipiosDB.forEach((row) => {
    byId[row.id_municipio] = row;
    byName[normalizeName(row.nome_municipio)] = row;
  });
  return { byId, byName };
})();

export function findMunicipioCoords(nome) {
  if (!nome) return null;
  const raw = String(nome).trim();
  const clean = normalizeName(raw);

  if (MUNICIPIOS_COORDS[raw]) return MUNICIPIOS_COORDS[raw];
  if (MUNICIPIOS_COORDS[clean]) return MUNICIPIOS_COORDS[clean];
  if (MUNICIPIOS_COORDS[raw.toLowerCase()]) return MUNICIPIOS_COORDS[raw.toLowerCase()];

  const aliases = {
    petrolina: [-9.3989, -40.5008],
    'sao francisco': [-9.427268, -40.505742],
    lem: [-12.087454, -45.796046],
    saj: [-12.968813, -39.257965]
  };

  if (aliases[clean]) return aliases[clean];

  const lookup = MUN_LOOKUP.byName[clean];
  if (lookup && MUNICIPIOS_COORDS[lookup.nome_municipio]) {
    return MUNICIPIOS_COORDS[lookup.nome_municipio];
  }

  for (const key of Object.keys(MUNICIPIOS_COORDS)) {
    if (normalizeName(key).includes(clean) || clean.includes(normalizeName(key))) {
      return MUNICIPIOS_COORDS[key];
    }
  }

  return null;
}

export function isInsideBahia(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -18.5 &&
    lat <= -8.0 &&
    lng >= -47.0 &&
    lng <= -36.5
  );
}

// Marcador do Cluster
const createClusterIcon = (count) => {
 const size = 20;
 const fontSize = 9.5;

 return L.divIcon({
 html: `
 <div style="
 width: ${size}px;
 height: ${size}px;
 background: #1E40AF;
 color: #FFFFFF;
 border: 1.5px solid #FFFFFF;
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 font-weight: 700;
 font-size: ${fontSize}px;
 box-shadow: 0 1px 3px rgba(30, 64, 175, 0.3);
 cursor: pointer;
 font-family: inherit;
 transform: none !important;
 ">
 ${count}
 </div>
 `,
 className: 'custom-cluster-marker',
 iconSize: [size, size],
 iconAnchor: [size / 2, size / 2]
 });
};

// Marcador Individual
const createSingleAssetIconWithSvg = (corHex, svgMarkup, isSelected = false) => {
 const size = isSelected ? 24 : 18;
 const safeColor = corHex || '#3B82F6';

 const defaultSvg = `<svg width="${isSelected ? 13 : 10}" height="${isSelected ? 13 : 10}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
 const innerSvg = svgMarkup || defaultSvg;

 return L.divIcon({
 html: `
 <div style="
 width: ${size}px;
 height: ${size}px;
 background-color: ${safeColor};
 color: #ffffff;
 border: ${isSelected ? '2.5px solid #1E40AF' : '1.5px solid #ffffff'};
 border-radius: 50%;
 display: flex;
 align-items: center;
 justify-content: center;
 box-shadow: ${isSelected ? '0 3px 10px rgba(30, 64, 175, 0.45)' : '0 1px 3px rgba(0, 0, 0, 0.15)'};
 cursor: pointer;
 transform: none !important;
 ">
 ${innerSvg}
 </div>
 `,
 className: `custom-single-asset-marker ${isSelected ? 'z-50' : ''}`,
 iconSize: [size, size],
 iconAnchor: [size / 2, size / 2]
 });
};

const partnerPinIcon = L.divIcon({
 html: `
 <div style="
 background-color: #3B82F6;
 width: 6px;
 height: 6px;
 border-radius: 50%;
 border: 1px solid #FFFFFF;
 box-shadow: 0 1px 2px rgba(37, 99, 235, 0.3);
 "></div>
 `,
 className: 'partner-map-pin',
 iconSize: [6, 6],
 iconAnchor: [3, 3]
});

const selectedPartnerPinIcon = L.divIcon({
 html: `
 <div style="
 background-color: #1E40AF;
 width: 7px;
 height: 7px;
 border-radius: 50%;
 border: 1px solid #FFFFFF;
 box-shadow: 0 1px 3px rgba(30, 64, 175, 0.4);
 "></div>
 `,
 className: 'partner-map-pin-selected',
 iconSize: [7, 7],
 iconAnchor: [3.5, 3.5]
});

export const HEAT_LEVELS = [
  { min: 0, max: 0, label: '0 cursos', color: '#F1F5F9', text: '#64748B' },
  { min: 1, max: 5, label: '1 a 5', color: '#BAE6FD', text: '#0369A1' },
  { min: 6, max: 15, label: '6 a 15', color: '#38BDF8', text: '#0284C7' },
  { min: 16, max: 35, label: '16 a 35', color: '#2563EB', text: '#FFFFFF' },
  { min: 36, max: 70, label: '36 a 70', color: '#1D4ED8', text: '#FFFFFF' },
  { min: 71, max: Infinity, label: '70+ cursos', color: '#0F1D30', text: '#38BDF8' },
];

export const getHeatColor = (count) => {
  if (count === 0) return '#F1F5F9';
  if (count <= 5) return '#BAE6FD';
  if (count <= 15) return '#38BDF8';
  if (count <= 35) return '#2563EB';
  if (count <= 70) return '#1D4ED8';
  return '#0F1D30';
};

// Escala Logarítmica para mitigar o impacto de grandes outliers e destacar valores intermediários
export const getRelativeHeatColor = (count, maxCount) => {
  if (!count || count === 0) return '#F1F5F9';
  if (maxCount <= 0) return '#F1F5F9';

  const logVal = Math.log(count + 1);
  const logMax = Math.log(maxCount + 1);
  const ratio = logMax > 0 ? logVal / logMax : 0;

  if (ratio <= 0.15) return '#BAE6FD';
  if (ratio <= 0.35) return '#38BDF8';
  if (ratio <= 0.60) return '#2563EB';
  if (ratio <= 0.85) return '#1D4ED8';
  return '#0F1D30';
};

function ZoomDependentTileLayer() {
  return null;
}

function MapPaneManager() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('connectionsPane')) {
      const pane = map.createPane('connectionsPane');
      pane.style.zIndex = '450';
      pane.style.pointerEvents = 'none';
    }
  }, [map]);
  return null;
}

function MapClickHandler({ onClearPinned, onClearTerritory }) {
 const map = useMap();
 useMapEvents({
 click: (e) => {
 const target = e.originalEvent?.target;
 if (target && (target.closest('.custom-cluster-marker') || target.closest('.custom-single-asset-marker') || target.closest('.partner-map-pin') || target.closest('.leaflet-popup') || target.closest('.leaflet-interactive'))) {
 return;
 }
 onClearPinned?.();
  if (onClearTerritory) {
  onClearTerritory();
  map.flyTo([-13.1, -41.7], 5.6, { duration: 0.8 });
  }
  }
  });
  return null;
}

function TerritoryFocusController({ selectedTerritory, geoJsonLayersByTerritoryRef }) {
  const map = useMap();
  const prevTerritoryRef = useRef(selectedTerritory);

  useEffect(() => {
  if (selectedTerritory) {
  const idTerr = selectedTerritory.id_territorio;
  const nome = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');
  const layer = (idTerr && geoJsonLayersByTerritoryRef.current[idTerr]) || geoJsonLayersByTerritoryRef.current[nome];

  if (layer) {
  const bounds = layer.getBounds();
  map.fitBounds(bounds, { padding: [35, 35], maxZoom: 9, duration: 0.8 });
  }
  } else if (prevTerritoryRef.current && !selectedTerritory) {
  map.flyTo([-13.1, -41.7], 5.6, { duration: 0.8 });
  }
  prevTerritoryRef.current = selectedTerritory;
  }, [selectedTerritory, map, geoJsonLayersByTerritoryRef]);

  return null;
}
function CadeiaFocusController({ selectedCadeia }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCadeia) {
      let cLat = Number(selectedCadeia.lat);
      let cLng = Number(selectedCadeia.lng);
      if (!isInsideBahia(cLat, cLng)) {
        const fallback = findMunicipioCoords(selectedCadeia.municipio || selectedCadeia.municipio_sede || selectedCadeia.sede);
        if (fallback) {
          cLat = fallback[0];
          cLng = fallback[1];
        }
      }

      if (!isInsideBahia(cLat, cLng)) return;

      const bounds = [[cLat, cLng]];

      (selectedCadeia.municipios_cobertos || []).forEach((mun) => {
        let mLat = mun.lat ? Number(mun.lat) : null;
        let mLng = mun.lng ? Number(mun.lng) : null;

        if (!isInsideBahia(mLat, mLng)) {
          const fallback = findMunicipioCoords(mun.nome_municipio);
          if (fallback) {
            mLat = fallback[0];
            mLng = fallback[1];
          }
        }

        if (isInsideBahia(mLat, mLng)) bounds.push([mLat, mLng]);
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 9,
          animate: true,
          duration: 1.0
        });
      } else {
        map.flyTo([cLat, cLng], 9.0, { duration: 1.0 });
      }
    }
  }, [selectedCadeia, map]);

  return null;
}

function ConnectionsFocusController({ showAllConnections, mode, connectionLines, selectedTerritory }) {
  const map = useMap();

  useEffect(() => {
    if (mode === 'cadeias' && showAllConnections && !selectedTerritory && connectionLines.length > 0) {
      const points = [];
      connectionLines.forEach((l) => {
        if (l.positions && l.positions.length >= 2) {
          if (isInsideBahia(l.positions[0][0], l.positions[0][1])) points.push(l.positions[0]);
          if (isInsideBahia(l.positions[1][0], l.positions[1][1])) points.push(l.positions[1]);
        }
      });
      if (points.length > 0) {
        map.fitBounds(points, {
          padding: [25, 25],
          maxZoom: 7,
          animate: true,
          duration: 0.8
        });
      }
    }
  }, [showAllConnections, mode, selectedTerritory, connectionLines, map]);

  return null;
}

function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (!coords) return;
    let lat, lng;
    let targetZoom = 15;
    if (Array.isArray(coords) && coords.length >= 2) {
      lat = Number(coords[0]);
      lng = Number(coords[1]);
      if (coords.length >= 3 && typeof coords[2] === 'number') {
        targetZoom = coords[2];
      }
    } else if (typeof coords === 'object') {
      lat = Number(coords.lat ?? coords.latitude);
      lng = Number(coords.lng ?? coords.longitude);
      if (coords.zoom) targetZoom = coords.zoom;
    }
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng) && lat !== 0) {
      const currentZoom = map.getZoom();
      if (currentZoom >= 9.5) {
        map.panTo([lat, lng], { animate: true, duration: 0.8 });
      } else {
        map.flyTo([lat, lng], targetZoom, { duration: 1.0 });
      }
    }
  }, [coords, map]);
  return null;
}

function SingleAssetPopupContent({ ativo }) {
 if (!ativo) return null;

 const IconComp = ativo.icone;

 return (
 <div className="p-2 min-w-[220px] max-w-[260px] flex flex-col gap-1.5 font-sans">
 <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1">
 <div className="flex items-center gap-1.5 min-w-0">
 <div
 className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs"
 style={{ backgroundColor: ativo.corHex || '#2563EB' }}
 >
 {IconComp && <IconComp size={11} className="text-white" />}
 </div>
 <span className="text-[11px] font-medium text-text-primary uppercase truncate">
 {ativo.shortTipo || ativo.tipo}
 </span>
 </div>
 </div>

 <h4 className="font-medium text-text-primary text-[13px] leading-tight tracking-tight">
 {ativo.nome || ativo.entidade}
 </h4>

 <div className="flex flex-col gap-1 bg-surface-soft p-2 rounded-xl border border-border/70 text-[11px]">
 <div className="flex items-center gap-1.5 text-text-secondary">
 <MapPin size={16} className="text-primary-600 shrink-0" />
 <span className="font-semibold text-text-primary truncate">{ativo.municipio}</span>
 </div>
 {ativo.territorio && (
 <div className="flex items-center gap-1.5 text-text-secondary">
 <Building size={16} className="text-text-secondary shrink-0" />
 <span className="font-medium text-text-secondary truncate">
 {ativo.territorio.replace(/^Território de Identidade\s+/i, '')}
 </span>
 </div>
 )}
 {ativo.rnp && (
 <div className="flex items-center gap-1.5 text-[11px] font-medium text-info-600 bg-info-500/15 px-2 py-0.5 rounded-lg border border-info-500/20 justify-center leading-none">
 <span className="w-1.5 h-1.5 rounded-full bg-info-500"></span>
 <span>Ponto de Presença / Conexão RNP</span>
 </div>
 )}
 </div>
 </div>
 );
}

function SingleCadeiaPopupContent({ cadeia }) {
  if (!cadeia) return null;
  return (
    <div className="p-3 max-w-[260px] text-left select-text font-sans">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: `${cadeia.corHex || '#2563EB'}20`,
            color: cadeia.corHex || '#2563EB'
          }}
        >
          {cadeia.shortTipo || cadeia.tipo || 'Cadeia Produtiva'}
        </span>
      </div>

      <h4 className="text-[13px] font-bold text-text-primary leading-snug mb-1">
        {cadeia.nome || cadeia.entidade || 'Cadeia Produtiva'}
      </h4>

      <div className="flex flex-col gap-1 text-[11px] text-text-muted mt-2 border-t border-border pt-1.5">
        {(cadeia.municipio_sede || cadeia.municipio) && (
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Building size={12} className="shrink-0 text-text-muted" />
            <span className="truncate">Sede: {cadeia.municipio_sede || cadeia.municipio}</span>
          </div>
        )}

        {(cadeia.territorio_identidade || cadeia.territorio) && (
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Layers size={12} className="shrink-0 text-text-muted" />
            <span className="font-medium text-text-secondary truncate">
              {String(cadeia.territorio_identidade || cadeia.territorio).replace(/^Território de Identidade\s+/i, '')}
            </span>
          </div>
        )}

        {cadeia.municipios_cobertos && cadeia.municipios_cobertos.length > 0 && (
          <div className="flex items-center gap-1.5 text-text-secondary mt-0.5">
            <MapPin size={12} className="shrink-0 text-text-muted" />
            <span className="font-semibold text-text-secondary">
              {cadeia.municipios_cobertos.length}
            </span>
            <span>municípios atendidos</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SingleAssetMarkerItem({ elem, ativo, pinnedAssetId, setPinnedAssetId, onAssetClick, isSelected, mode }) {
  return (
    <Marker
      key={elem.key}
      position={[elem.lat, elem.lng]}
      icon={createSingleAssetIconWithSvg(ativo.corHex, ativo.iconSvg, isSelected)}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          if (isSelected) {
            setPinnedAssetId(null);
            onAssetClick?.(null);
          } else {
            setPinnedAssetId(ativo.id);
            onAssetClick?.(ativo);
          }
        }
      }}
    >
      {mode !== 'cadeias' ? (
        <Popup className="custom-premium-popup" autoPan={true}>
          <SingleAssetPopupContent ativo={ativo} />
        </Popup>
      ) : (
        <Popup className="custom-premium-popup" autoPan={true}>
          <SingleCadeiaPopupContent cadeia={ativo} />
        </Popup>
      )}
    </Marker>
  );
}

function SuperclusteredMarkers({ processedAtivos = [], pinnedAssetId, setPinnedAssetId, onAssetClick, selectedCadeia, mode }) {
 const map = useMap();
 const [bounds, setBounds] = useState(null);
 const [zoom, setZoom] = useState(map.getZoom());

 const deduplicatedAtivos = useMemo(() => {
 const seen = new Map();

 processedAtivos.forEach((a) => {
 if (!a.lat || !a.lng || isNaN(a.lat) || isNaN(a.lng) || a.lat === 0) return;

 const normNome = normalizeName(a.nome || a.entidade || a.nome_ativo || '');
 const latKey = Number(a.lat).toFixed(5);
 const lngKey = Number(a.lng).toFixed(5);
 const key = `${normNome}_${latKey}_${lngKey}_${a.tipo || ''}`;

 if (!seen.has(key)) {
 seen.set(key, a);
 }
 });

 const rawList = Array.from(seen.values());

    const coordGroups = new Map();
    rawList.forEach((a) => {
      const cKey = `${Number(a.lat).toFixed(3)}_${Number(a.lng).toFixed(3)}`;
      if (!coordGroups.has(cKey)) {
        coordGroups.set(cKey, []);
      }
      coordGroups.get(cKey).push(a);
    });

 const fixedAtivos = [];
 coordGroups.forEach((group) => {
 const total = group.length;
 group.forEach((a, idx) => {
 let fixedLat = Number(a.lat);
 let fixedLng = Number(a.lng);

        if (total > 1) {
          const SPREAD = 0.00065;
          if (total === 2) {
            fixedLng += (idx === 0 ? -1 : 1) * SPREAD;
          } else {
            const angle = (idx / total) * 2 * Math.PI - (Math.PI / 2);
            fixedLat += SPREAD * Math.sin(angle);
            fixedLng += SPREAD * Math.cos(angle);
          }
        }

 fixedAtivos.push({
 ...a,
 lat: fixedLat,
 lng: fixedLng
 });
 });
 });

 return fixedAtivos;
 }, [processedAtivos]);

 const superclusterIndex = useMemo(() => {
 if (selectedCadeia) return null;

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
 }, [deduplicatedAtivos, selectedCadeia]);

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
 if (selectedCadeia) {
 return deduplicatedAtivos.map((ativo, idx) => ({
 isCluster: false,
 lng: ativo.lng,
 lat: ativo.lat,
 ativo,
 key: `ativo-focused-${ativo.id}-${idx}`
 }));
 }

 if (!bounds || !superclusterIndex) return [];

 const clusters = superclusterIndex.getClusters(bounds, Math.floor(zoom));
 const elements = [];

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
 const ativo = c.properties.ativoData;
 elements.push({
 isCluster: false,
 lng: c.geometry.coordinates[0],
 lat: c.geometry.coordinates[1],
 ativo,
 key: `ativo-${c.properties.ativoId}`
 });
 }
 });

 return elements;
 }, [bounds, zoom, superclusterIndex, selectedCadeia, deduplicatedAtivos]);

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
 const isSelected = Boolean(
 (selectedCadeia && (selectedCadeia.id_cadeia === ativo.id_cadeia || selectedCadeia.id === ativo.id)) ||
 (pinnedAssetId != null && (pinnedAssetId === ativo.id || pinnedAssetId === ativo.id_ativo))
 );

 return (
 <SingleAssetMarkerItem
 key={elem.key}
 elem={elem}
 ativo={ativo}
 pinnedAssetId={pinnedAssetId}
 setPinnedAssetId={setPinnedAssetId}
 onAssetClick={onAssetClick}
 isSelected={isSelected}
 mode={mode}
 />
 );
 })}
 </>
 );
}

function MapResizeHandler({ isExpanded }) {
 const map = useMap();
 useEffect(() => {
 const timer = setTimeout(() => {
 map.invalidateSize();
 }, 250);
 return () => clearTimeout(timer);
 }, [isExpanded, map]);
 return null;
}

function MapZoomWatcher({ onZoomChange }) {
 const map = useMap();
 useMapEvents({
 zoomend: () => onZoomChange(map.getZoom()),
 zoom: () => onZoomChange(map.getZoom())
 });
 useEffect(() => {
 onZoomChange(map.getZoom());
 }, [map, onZoomChange]);
 return null;
}

export default function SideMap({
  processedAtivos = [],
  cursosData = [],
  cadeiasData = [],
  mode = 'ativos',
  focusedAsset = null,
  selectedTerritory = null,
  selectedCadeia = null,
  onSelectTerritory = () => { },
  selectedIES = null,
  onSelectIES = () => { },
  selectedSegmento = null,
  onSelectSegmento = () => { },
  onAssetClick = () => { },
  isExpanded = false,
  onToggleExpand = null
}) {
  const mapRef = useRef(null);
  const [territoriosGeoJson, setTerritoriosGeoJson] = useState(null);
  const [municipiosGeoJson, setMunicipiosGeoJson] = useState(null);
  const [pinnedAssetId, setPinnedAssetId] = useState(null);
  const [hoveredFeatureName, setHoveredFeatureName] = useState(null);
  const [isLayerControlOpen, setIsLayerControlOpen] = useState(false);
  const [showAllConnections, setShowAllConnections] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(6);

  useEffect(() => {
    if (focusedAsset) {
      if (focusedAsset.id != null) setPinnedAssetId(focusedAsset.id);
    }
  }, [focusedAsset]);

  const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);

  // Categorias
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

  const allCadeiasCategories = useMemo(() => {
    if (mode !== 'cadeias') return [];
    const map = {};
    const colors = {
      'APL': '#2563EB',
      'IG': '#10B981',
      'IG POTENCIAL': '#F59E0B'
    };

    cadeiasData.forEach((c) => {
      const tipo = c.tipo || 'APL';
      if (!map[tipo]) {
        map[tipo] = {
          key: tipo,
          label: tipo === 'APL' ? 'APL' : tipo === 'IG' ? 'IG' : tipo,
          corHex: colors[tipo] || '#6366F1',
          count: 0
        };
      }
      map[tipo].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [cadeiasData, mode]);

  const allCategories = mode === 'cursos' ? allCursosCategories : mode === 'cadeias' ? allCadeiasCategories : allAtivosCategories;
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
    if (mode !== 'ativos') return [];
    let list = processedAtivos.filter((a) => activeCategoryKeys.has(a.tipo || 'Outros'));

    if (selectedTerritory) {
      const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
      const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');
      list = list.filter((a) => {
        if (tid && String(a.id_territorio) === tid) return true;
        if (tNorm && normalizeName(a.territorio || a.territorio_identidade || '') === tNorm) return true;
        return false;
      });
    }

    return list;
  }, [processedAtivos, activeCategoryKeys, selectedTerritory, mode]);

  const visibleCursos = useMemo(() => {
    if (mode !== 'cursos') return [];
    return cursosData.filter((c) => activeCategoryKeys.has(c.categoria || 'Outras Áreas'));
  }, [cursosData, activeCategoryKeys, mode]);

  const visibleCadeias = useMemo(() => {
    if (mode !== 'cadeias') return [];
    let list = cadeiasData.filter((c) => activeCategoryKeys.has(c.tipo || 'APL'));

    if (selectedSegmento) {
      list = list.filter((c) => c.segmento === selectedSegmento);
    }

    if (selectedTerritory) {
      const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
      const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');
      list = list.filter((c) => {
        if (tid && String(c.id_territorio) === tid) return true;
        if (tNorm && normalizeName(c.territorio_identidade || c.territorio || '') === tNorm) return true;
        if (c.municipios_cobertos?.some(m => (tid && String(m.id_territorio) === tid) || (tNorm && normalizeName(m.nome_territorio || m.territorio || '') === tNorm))) return true;
        return false;
      });
    }

    return list;
  }, [cadeiasData, activeCategoryKeys, selectedSegmento, selectedTerritory, mode]);

  // Linhas de conexão
  const connectionLines = useMemo(() => {
    if (mode !== 'cadeias') return [];
    const lines = [];

    if (showAllConnections) {
      const targetCadeias = visibleCadeias.filter(c => c.lat && c.lng);

      targetCadeias.forEach((c) => {
        let cLat = Number(c.lat);
        let cLng = Number(c.lng);
        if (!isInsideBahia(cLat, cLng)) {
          const fallback = findMunicipioCoords(c.municipio || c.municipio_sede || c.sede);
          if (fallback) {
            cLat = fallback[0];
            cLng = fallback[1];
          }
        }
        if (!isInsideBahia(cLat, cLng)) return;

        const origin = [cLat, cLng];
        const isSelected = selectedCadeia && (String(selectedCadeia.id) === String(c.id) || selectedCadeia.nome === c.nome);

        (c.municipios_cobertos || []).forEach((mun) => {
          let mLat = mun.lat ? Number(mun.lat) : null;
          let mLng = mun.lng ? Number(mun.lng) : null;

          if (!isInsideBahia(mLat, mLng)) {
            const fallback = findMunicipioCoords(mun.nome_municipio);
            if (fallback) {
              mLat = fallback[0];
              mLng = fallback[1];
            }
          }

          if (isInsideBahia(mLat, mLng)) {
            const isSamePoint = Math.abs(mLat - cLat) < 0.001 && Math.abs(mLng - cLng) < 0.001;
            if (!isSamePoint) {
              lines.push({
                positions: [origin, [mLat, mLng]],
                municipio: mun.nome_municipio,
                territorio: mun.nome_territorio,
                cadeiaNome: c.nome || c.cadeia_produtiva,
                isSelected
              });
            }
          }
        });
      });

      return lines;
    }

    if (!selectedCadeia) return [];

    let cLat = Number(selectedCadeia.lat);
    let cLng = Number(selectedCadeia.lng);
    if (!isInsideBahia(cLat, cLng)) {
      const fallback = findMunicipioCoords(selectedCadeia.municipio || selectedCadeia.municipio_sede || selectedCadeia.sede);
      if (fallback) {
        cLat = fallback[0];
        cLng = fallback[1];
      }
    }
    if (!isInsideBahia(cLat, cLng)) return [];

    const origin = [cLat, cLng];

    (selectedCadeia.municipios_cobertos || []).forEach((mun) => {
      let mLat = mun.lat ? Number(mun.lat) : null;
      let mLng = mun.lng ? Number(mun.lng) : null;

      if (!isInsideBahia(mLat, mLng)) {
        const fallback = findMunicipioCoords(mun.nome_municipio);
        if (fallback) {
          mLat = fallback[0];
          mLng = fallback[1];
        }
      }

      if (isInsideBahia(mLat, mLng)) {
        const isSamePoint = Math.abs(mLat - cLat) < 0.001 && Math.abs(mLng - cLng) < 0.001;
        if (!isSamePoint) {
          lines.push({
            positions: [origin, [mLat, mLng]],
            municipio: mun.nome_municipio,
            territorio: mun.nome_territorio,
            cadeiaNome: selectedCadeia.nome || selectedCadeia.cadeia_produtiva,
            isSelected: true
          });
        }
      }
    });

    return lines;
  }, [mode, showAllConnections, visibleCadeias, selectedCadeia]);

  const uniquePartnerMunicipios = useMemo(() => {
    if (mode !== 'cadeias' || connectionLines.length === 0) return [];

    const mapMuns = new Map();
    connectionLines.forEach((line) => {
      const key = normalizeName(line.municipio);
      if (!mapMuns.has(key)) {
        mapMuns.set(key, {
          position: line.positions[1],
          municipio: line.municipio,
          territorio: line.territorio,
          count: 1,
          isSelected: line.isSelected
        });
      } else {
        const existing = mapMuns.get(key);
        existing.count += 1;
        if (line.isSelected) existing.isSelected = true;
      }
    });

    return Array.from(mapMuns.values());
  }, [mode, connectionLines]);

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

  const cursosStatsByMunicipio = useMemo(() => {
    if (mode !== 'cursos') return {};
    const stats = {};

    visibleCursos.forEach((c) => {
      const munNorm = normalizeName(c.municipio || '');
      if (munNorm) {
        if (!stats[munNorm]) {
          stats[munNorm] = { count: 0, nome: c.municipio };
        }
        stats[munNorm].count += 1;
      }
    });

    return stats;
  }, [visibleCursos, mode]);

  // Máximo relativo baseado no município líder daquele território
  const maxCursosNoTerritorioSelecionado = useMemo(() => {
    if (mode !== 'cursos' || !selectedTerritory) return 1;

    const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
    const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');

    const cursosDoTerritorio = visibleCursos.filter(c => {
      if (tid && String(c.id_territorio) === tid) return true;
      if (tNorm && normalizeName(c.territorio_identidade || c.territorio || '') === tNorm) return true;
      return false;
    });

    const mCounts = {};
    cursosDoTerritorio.forEach(c => {
      const m = normalizeName(c.municipio || '');
      if (m) mCounts[m] = (mCounts[m] || 0) + 1;
    });

    return Math.max(...Object.values(mCounts), 1);
  }, [mode, selectedTerritory, visibleCursos]);

  const territoryStats = useMemo(() => {
    if (mode === 'cursos') return {};
    const stats = {};
    const sourceList = mode === 'cadeias' ? visibleCadeias : visibleAtivos;
    sourceList.forEach((a) => {
      const rawTerr = (a.territorio || a.territorio_identidade || '').replace(/^Território de Identidade\s+/i, '').trim();
      if (rawTerr) {
        if (!stats[rawTerr]) stats[rawTerr] = { count: 0 };
        stats[rawTerr].count += 1;
      }
    });
    return stats;
  }, [visibleAtivos, visibleCadeias, mode]);

  // Carrega a topologia base
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

        const terrFeatures = Object.entries(groups).map(([idTerr, group]) => {
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
          features: terrFeatures
        });

        const munFeatures = topojson.feature(topology, topology.objects.BA).features.map(feat => {
          const rawMunName = feat.properties?.NOME || feat.properties?.nome || '';
          const dbInfo = municipioTerritoryMap[normalizeName(rawMunName)];
          return {
            ...feat,
            properties: {
              ...feat.properties,
              nome_municipio: dbInfo ? dbInfo.nome_municipio : rawMunName,
              id_territorio: dbInfo ? dbInfo.id_territorio : null,
              nome_territorio: dbInfo ? dbInfo.nome_territorio : null
            }
          };
        });

        setMunicipiosGeoJson({
          type: 'FeatureCollection',
          features: munFeatures
        });
      })
      .catch((err) => console.error('Erro ao carregar topologia:', err));
  }, [municipioTerritoryMap]);

  // 1. Estilização dos Territórios de Identidade
  const territoryBorderStyle = (feature) => {
    const rawNome = feature?.properties?.nome_territorio || '';
    const nome = rawNome.replace(/^Território de Identidade\s+/i, '').trim();
    const idTerr = feature?.properties?.id_territorio;
    const norm = normalizeName(nome);

    const isHovered = hoveredFeatureName === nome;
    const isSelected = selectedTerritory && (
      (selectedTerritory.id_territorio && String(selectedTerritory.id_territorio) === String(idTerr)) ||
      normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio) === norm
    );

    if (mode === 'cursos') {
      const tStat = cursosStatsByTerritory[`id_${idTerr}`] || cursosStatsByTerritory[norm];
      const count = tStat ? tStat.count : 0;
      const heatColor = getHeatColor(count);

      if (selectedTerritory) {
        if (isSelected) {
          return {
            fillColor: 'transparent',
            fillOpacity: 0,
            color: '#1E293B',
            weight: 2.2,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'outline-none pointer-events-none'
          };
        }
        return {
          fillColor: '#CBD5E1',
          fillOpacity: 0.55,
          color: '#FFFFFF',
          weight: 0.8,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'outline-none cursor-pointer hover:opacity-80 transition-opacity'
        };
      }

      return {
        fillColor: heatColor,
        fillOpacity: isHovered ? 1.0 : 0.92,
        color: '#FFFFFF',
        weight: isHovered ? 1.8 : 1.1,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'transition-all duration-200 cursor-pointer outline-none'
      };
    }

    if (selectedTerritory) {
      if (isSelected) {
        return {
          fillColor: '#EFF6FF',
          fillOpacity: 1,
          color: '#1D4ED8',
          weight: 2.2,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'outline-none cursor-pointer'
        };
      }
      return {
        fillColor: '#F8FAFC',
        fillOpacity: 0.85,
        color: '#E2E8F0',
        weight: 0.8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'outline-none cursor-pointer hover:opacity-80 transition-opacity'
      };
    }

    return {
      fillColor: isHovered ? '#EFF6FF' : '#FFFFFF',
      fillOpacity: 1,
      color: isHovered ? '#2563EB' : '#CBD5E1',
      weight: isHovered ? 1.8 : 0.9,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'transition-all duration-200 cursor-pointer outline-none'
    };
  };

  // 2. Estilização dos Municípios com Escala Logarítmica
  const municipioBorderStyle = (feature) => {
    const munNome = feature?.properties?.nome_municipio || feature?.properties?.NOME || '';
    const munNorm = normalizeName(munNome);
    const idTerr = feature?.properties?.id_territorio;
    const terrNome = feature?.properties?.nome_territorio || '';
    const terrNorm = normalizeName(terrNome);

    const targetId = selectedTerritory?.id_territorio ? String(selectedTerritory.id_territorio) : null;
    const targetTerrNorm = normalizeName(selectedTerritory?.nome_territorio || selectedTerritory?.territorio || '');

    const isInsideSelectedTerritory = Boolean(
      (targetId && idTerr && String(idTerr) === targetId) ||
      (targetTerrNorm && (terrNorm === targetTerrNorm || terrNorm.includes(targetTerrNorm)))
    );

    if (!isInsideSelectedTerritory) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        weight: 0,
        opacity: 0,
        stroke: false
      };
    }

    const munStat = cursosStatsByMunicipio[munNorm];
    const count = munStat ? munStat.count : 0;
    const isHovered = hoveredFeatureName === munNome;
    
    // Aplicação da Escala Logarítmica para equilibrar o contraste visual
    const relativeHeatColor = getRelativeHeatColor(count, maxCursosNoTerritorioSelecionado);

    return {
      fillColor: relativeHeatColor,
      fillOpacity: isHovered ? 1.0 : 0.95,
      color: '#FFFFFF',
      weight: isHovered ? 2.0 : 1.2,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'transition-all duration-150 cursor-pointer outline-none'
    };
  };

  const geoJsonLayersByTerritoryRef = useRef({});

  const onEachTerritoryFeature = (feature, layer) => {
    const rawNome = feature?.properties?.nome_territorio || '';
    const nome = rawNome.replace(/^Território de Identidade\s+/i, '').trim();
    const idTerr = feature?.properties?.id_territorio;
    const norm = normalizeName(nome);

    if (idTerr) geoJsonLayersByTerritoryRef.current[idTerr] = layer;
    if (norm) geoJsonLayersByTerritoryRef.current[norm] = layer;

    layer.on({
      mouseover: (e) => {
        setHoveredFeatureName(nome);
        if (mode !== 'cursos' && !selectedTerritory) {
          e.target.setStyle({
            fillColor: '#EFF6FF',
            fillOpacity: 1,
            color: '#2563EB',
            weight: 1.8
          });
        }
      },
      mouseout: (e) => {
        setHoveredFeatureName(null);
        if (mode !== 'cursos' && !selectedTerritory) {
          e.target.setStyle(territoryBorderStyle(feature));
        }
      },
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        const isCurrentSelected = selectedTerritory && (
          (selectedTerritory.id_territorio && String(selectedTerritory.id_territorio) === String(idTerr)) ||
          normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '') === norm
        );

        if (isCurrentSelected) {
          onSelectTerritory(null);
        } else {
          onSelectTerritory({ id_territorio: idTerr, nome_territorio: nome, territorio: nome });
        }
      }
    });
  };

  const onEachMunicipioFeature = (feature, layer) => {
    const munNome = feature?.properties?.nome_municipio || feature?.properties?.NOME || '';
    const idTerr = feature?.properties?.id_territorio;
    const terrNome = feature?.properties?.nome_territorio || '';

    layer.on({
      mouseover: (e) => {
        setHoveredFeatureName(munNome);
        e.target.setStyle({
          weight: 2.0,
          color: '#1D3557'
        });
      },
      mouseout: (e) => {
        setHoveredFeatureName(null);
        e.target.setStyle(municipioBorderStyle(feature));
      },
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        if (!selectedTerritory && idTerr) {
          onSelectTerritory({ id_territorio: idTerr, nome_territorio: terrNome, territorio: terrNome });
        }
      }
    });
  };

  const hoveredInfo = useMemo(() => {
    if (mode !== 'cursos' || !hoveredFeatureName) return null;
    const norm = normalizeName(hoveredFeatureName);

    if (selectedTerritory) {
      const stat = cursosStatsByMunicipio[norm];
      return {
        label: hoveredFeatureName,
        count: stat ? stat.count : 0,
        sub: 'no município'
      };
    }

    const stat = cursosStatsByTerritory[norm];
    return {
      label: hoveredFeatureName,
      count: stat ? stat.count : 0,
      sub: 'no território'
    };
  }, [mode, hoveredFeatureName, selectedTerritory, cursosStatsByMunicipio, cursosStatsByTerritory]);

  const hasActiveFilter = Boolean(
    pinnedAssetId ||
    selectedTerritory ||
    selectedCadeia ||
    selectedIES ||
    selectedSegmento ||
    (allCategories.length > 0 && activeCategoryKeys.size < allCategories.length)
  );

  return (
    <div className="relative w-full h-full min-h-0 flex items-center justify-center bg-[#EBF1F6] bg-carto-grid rounded-[24px] overflow-hidden select-none z-10 flex-1">
      <MapContainer
        ref={mapRef}
        center={[-13.1, -41.7]}
        zoom={5.6}
        minZoom={5.0}
        maxBounds={[
          [-18.5, -47.0],
          [-8.0, -37.0]
        ]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="w-full h-full z-0 flex-1 min-h-0 outline-none"
        zoomControl={false}
        attributionControl={false}
      >
        <MapPaneManager />
        <MapResizeHandler isExpanded={isExpanded} />
        <MapZoomWatcher onZoomChange={setCurrentZoom} />
        <ZoomDependentTileLayer />
        <MapClickHandler
          onClearPinned={() => setPinnedAssetId(null)}
          onClearTerritory={() => onSelectTerritory(null)}
        />
        <TerritoryFocusController
          selectedTerritory={selectedTerritory}
          geoJsonLayersByTerritoryRef={geoJsonLayersByTerritoryRef}
        />
        <CadeiaFocusController selectedCadeia={selectedCadeia} />
        <ConnectionsFocusController
          showAllConnections={showAllConnections}
          mode={mode}
          connectionLines={connectionLines}
          selectedTerritory={selectedTerritory}
        />

        {territoriosGeoJson && (
          <GeoJSON
            key={`territorios-layer-${mode}-${selectedTerritory?.id_territorio || 'none'}-${activeCategoryKeys.size}`}
            data={territoriosGeoJson}
            style={territoryBorderStyle}
            onEachFeature={onEachTerritoryFeature}
          />
        )}

        {mode === 'cursos' && selectedTerritory && municipiosGeoJson && (
          <GeoJSON
            key={`municipios-heat-layer-${selectedTerritory.id_territorio || selectedTerritory.territorio}-${activeCategoryKeys.size}`}
            data={municipiosGeoJson}
            style={municipioBorderStyle}
            onEachFeature={onEachMunicipioFeature}
          />
        )}

        {focusedAsset && <ChangeMapView coords={focusedAsset} />}

        {mode === 'cadeias' && connectionLines.map((line, idx) => (
          <Polyline
            key={`conn-line-${idx}`}
            pane="connectionsPane"
            positions={line.positions}
            pathOptions={{
              color: line.isSelected ? '#1E40AF' : '#3B82F6',
              weight: line.isSelected ? 2.4 : 1.15,
              opacity: line.isSelected ? 0.95 : 0.38,
              dashArray: null
            }}
          />
        ))}

        {mode === 'cadeias' && uniquePartnerMunicipios.map((p, idx) => {
          const showLabel = Boolean(p.isSelected && currentZoom >= 8.0);

          return (
            <Marker key={`partner-pin-${p.municipio}-${idx}`} position={p.position} icon={p.isSelected ? selectedPartnerPinIcon : partnerPinIcon}>
              <Tooltip
                key={`city-tip-${p.municipio}-${p.isSelected ? 'sel' : 'norm'}-${showLabel ? 'perm' : 'hover'}`}
                direction="top"
                offset={[0, -4]}
                opacity={0.98}
                permanent={showLabel}
                className="clean-city-tooltip"
              >
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-sm border tracking-tight whitespace-nowrap transition-all ${
                  p.isSelected
                    ? 'text-white bg-[#1E40AF] border-[#1E40AF] font-bold'
                    : 'text-[#1E40AF] bg-white/95 backdrop-blur-xs border-[#E2E8F0]'
                }`}>
                  {p.municipio}
                </span>
              </Tooltip>
            </Marker>
          );
        })}

        {(mode === 'ativos' || mode === 'cadeias') && (
          <SuperclusteredMarkers
            processedAtivos={mode === 'cadeias' ? visibleCadeias : visibleAtivos}
            pinnedAssetId={pinnedAssetId}
            setPinnedAssetId={setPinnedAssetId}
            onAssetClick={onAssetClick}
            selectedCadeia={selectedCadeia}
            mode={mode}
          />
        )}
      </MapContainer>

      {hoveredInfo && (
        <div className="absolute top-3 left-3.5 z-[400] pointer-events-none select-none flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white shadow-sm">
          {mode === 'cursos' && <Flame size={13} className="text-[#2563EB]" />}
          <span className="text-[#1D3557] font-extrabold text-[12px] tracking-tight">
            {hoveredInfo.label}
          </span>
          <span className="text-[#2563EB] font-black text-[11px] bg-[#2563EB]/10 px-2 py-0.5 rounded-full">
            {hoveredInfo.count} {hoveredInfo.count === 1 ? 'curso' : 'cursos'}
          </span>
        </div>
      )}

      {mode === 'cursos' && (
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-2.5 border border-white shadow-[0_8px_24px_rgba(29,53,87,0.08)] pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1">
              <Flame size={12} className="text-[#2563EB]" />
              <span className="text-[9.5px] font-extrabold text-[#1D3557] uppercase tracking-wider">
                {selectedTerritory ? 'Densidade Relativa Municipal (Log)' : 'Densidade de Cursos'}
              </span>
            </div>
            {selectedTerritory && (
              <span className="text-[8.5px] font-black bg-[#2563EB]/10 text-[#2563EB] px-1.5 py-0.2 rounded-md">
                Máx: {maxCursosNoTerritorioSelecionado}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            {HEAT_LEVELS.map((lvl, idx) => {
              const labelText = selectedTerritory 
                ? (idx === 0 ? '0' : idx === HEAT_LEVELS.length - 1 ? `${maxCursosNoTerritorioSelecionado}` : '')
                : lvl.label.replace(' cursos', '');

              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className="w-5 h-2.5 rounded-[3px] shadow-2xs border border-black/10"
                    style={{ backgroundColor: lvl.color }}
                    title={lvl.label}
                  />
                  <span className="text-[7.5px] font-bold text-[#64748B] whitespace-nowrap">
                    {labelText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTROLES DO MAPA */}
      <div className="absolute top-3 right-3 z-[400] flex items-start gap-2">
        {mode === 'cadeias' && (
          <button
            type="button"
            onClick={() => setShowAllConnections((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-bold transition-all border cursor-pointer select-none shadow-sm ${
              showAllConnections
                ? 'bg-[#1D3557] text-white border-[#1D3557] shadow-[0_3px_12px_rgba(29,53,87,0.3)]'
                : 'bg-white/95 backdrop-blur-md text-[#1D3557] border-[#CBD5E1] hover:bg-white hover:border-[#2563EB]'
            }`}
          >
            <Network size={13} className={showAllConnections ? 'text-[#00B4D8]' : 'text-[#2563EB]'} />
            <span>Teia de Conexões</span>
          </button>
        )}

        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10.5px] font-bold transition-all border cursor-pointer select-none shadow-sm ${
              isExpanded
                ? 'bg-[#1D3557] text-white border-[#1D3557] shadow-[0_3px_12px_rgba(29,53,87,0.3)]'
                : 'bg-white/95 backdrop-blur-md text-[#1D3557] border-[#CBD5E1] hover:bg-white hover:border-[#2563EB]'
            }`}
          >
            {isExpanded ? <Minimize2 size={13} className="text-[#00B4D8]" /> : <Maximize2 size={13} className="text-[#2563EB]" />}
            <span>{isExpanded ? 'Modo Normal' : 'Expandir'}</span>
          </button>
        )}
      </div>

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
            mapRef.current?.flyTo([-13.1, -41.7], 5.6, { duration: 0.8 });
            onSelectTerritory(null);
            onSelectIES?.(null);
            onSelectSegmento?.(null);
            onAssetClick?.(null);
          }}
          className={`w-10 h-10 flex items-center justify-center transition-all cursor-pointer ${
            hasActiveFilter ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50'
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