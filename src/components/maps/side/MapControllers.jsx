import React, { useRef, useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { normalizeName, findMunicipioCoords, isInsideBahia } from './mapGeoUtils';

export function ZoomDependentTileLayer() {
  return null;
}

export function MapPaneManager() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('connectionsPane')) {
      const pane = map.createPane('connectionsPane');
      pane.style.zIndex = '450';
      pane.style.pointerEvents = 'none';
    }
    if (!map.getPane('territoryOutlinePane')) {
      const outlinePane = map.createPane('territoryOutlinePane');
      outlinePane.style.zIndex = '460';
      outlinePane.style.pointerEvents = 'none';
    }
  }, [map]);
  return null;
}

export function MapClickHandler({ onClearPinned, onClearTerritory }) {
  const map = useMap();
  useMapEvents({
    click: (e) => {
      const target = e.originalEvent?.target;
      if (
        target &&
        (target.closest('.custom-cluster-marker') ||
          target.closest('.custom-single-asset-marker') ||
          target.closest('.partner-map-pin') ||
          target.closest('.leaflet-popup') ||
          target.closest('.leaflet-interactive'))
      ) {
        return;
      }
      onClearPinned?.();
      if (onClearTerritory) {
        onClearTerritory();
        map.flyTo([-13.1, -41.7], 5.6, { duration: 0.6 });
      }
    }
  });
  return null;
}

export function TerritoryFocusController({ selectedTerritory, geoJsonLayersByTerritoryRef }) {
  const map = useMap();
  const prevTerritoryRef = useRef(selectedTerritory);

  useEffect(() => {
    if (selectedTerritory) {
      const idTerr = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
      const numId = idTerr ? Number(idTerr) : null;
      const rawNome = selectedTerritory.nome_territorio || selectedTerritory.territorio || '';
      const nome = normalizeName(rawNome.replace(/^Território de Identidade\s+/i, '').trim());

      const tryZoom = () => {
        if (!map) return false;
        const dict = geoJsonLayersByTerritoryRef?.current || {};
        const layer =
          (idTerr && dict[idTerr]) ||
          (numId && dict[numId]) ||
          (nome && dict[nome]) ||
          dict[rawNome];

        if (layer && typeof layer.getBounds === 'function') {
          const bounds = layer.getBounds();
          if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [35, 35], maxZoom: 9, duration: 0.6 });
            return true;
          }
        }
        return false;
      };

      if (!tryZoom()) {
        const t1 = setTimeout(tryZoom, 120);
        const t2 = setTimeout(tryZoom, 350);
        const t3 = setTimeout(tryZoom, 800);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      }
    } else if (prevTerritoryRef.current && !selectedTerritory) {
      map.flyTo([-13.1, -41.7], 5.6, { duration: 0.6 });
    }
    prevTerritoryRef.current = selectedTerritory;
  }, [selectedTerritory, map, geoJsonLayersByTerritoryRef]);

  return null;
}

export function CadeiaFocusController({ selectedCadeia }) {
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
          duration: 0.6
        });
      } else {
        map.flyTo([cLat, cLng], 9.0, { duration: 0.6 });
      }
    }
  }, [selectedCadeia, map]);

  return null;
}

export function ConnectionsFocusController({ showAllConnections, mode, connectionLines, selectedTerritory }) {
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
          duration: 0.6
        });
      }
    }
  }, [showAllConnections, mode, selectedTerritory, connectionLines, map]);

  return null;
}

export function ChangeMapView({ coords }) {
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
        map.panTo([lat, lng], { animate: true, duration: 0.6 });
      } else {
        map.flyTo([lat, lng], targetZoom, { duration: 0.6 });
      }
    }
  }, [coords, map]);
  return null;
}

export function MapResizeHandler({ isExpanded }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [isExpanded, map]);
  return null;
}

export function MapZoomWatcher({ onZoomChange }) {
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
