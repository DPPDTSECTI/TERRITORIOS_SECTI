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

export function fitMapToBahia(map, territoriosLayerRef, padding = [18, 18]) {
  if (!map) return;
  if (territoriosLayerRef?.current && typeof territoriosLayerRef.current.getBounds === 'function') {
    const b = territoriosLayerRef.current.getBounds();
    if (b && b.isValid()) {
      map.fitBounds(b, { padding, maxZoom: 6.5, duration: 0.32 });
      return;
    }
  }
  map.flyTo([-12.9, -41.6], 5.75, { duration: 0.32, easeLinearity: 0.3 });
}

export function MapClickHandler({ onClearPinned }) {
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
    }
  });
  return null;
}

export function TerritoryFocusController({ selectedTerritory, geoJsonLayersByTerritoryRef, territoriosLayerRef }) {
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
            map.fitBounds(bounds, { padding: [32, 32], maxZoom: 8.5, duration: 0.45 });
            return true;
          }
        }
        return false;
      };

      if (!tryZoom()) {
        const t1 = setTimeout(tryZoom, 60);
        const t2 = setTimeout(tryZoom, 220);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    } else if (prevTerritoryRef.current && !selectedTerritory) {
      fitMapToBahia(map, territoriosLayerRef);
    }
    prevTerritoryRef.current = selectedTerritory;
  }, [selectedTerritory, map, geoJsonLayersByTerritoryRef, territoriosLayerRef]);

  return null;
}

export function CadeiaFocusController({
  selectedCadeia,
  selectedTerritory,
  geoJsonLayersByTerritoryRef,
  territoriosLayerRef
}) {
  const map = useMap();
  const prevCadeiaRef = useRef(selectedCadeia);

  useEffect(() => {
    if (selectedCadeia) {
      let cLat = Number(selectedCadeia.lat);
      let cLng = Number(selectedCadeia.lng);
      if (!isInsideBahia(cLat, cLng)) {
        const fallback = findMunicipioCoords(
          selectedCadeia.municipio || selectedCadeia.municipio_sede || selectedCadeia.sede
        );
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

        if (isInsideBahia(mLat, mLng)) {
          const isSame = Math.abs(mLat - cLat) < 0.001 && Math.abs(mLng - cLng) < 0.001;
          if (!isSame) bounds.push([mLat, mLng]);
        }
      });

      if (bounds.length > 1) {
        map.fitBounds(bounds, {
          padding: [56, 56],
          maxZoom: 7.5,
          animate: true,
          duration: 0.45
        });
      } else {
        map.flyTo([cLat, cLng], 7.5, { duration: 0.45, easeLinearity: 0.25 });
      }
    } else if (prevCadeiaRef.current && !selectedCadeia) {
      if (selectedTerritory) {
        const idTerr = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
        const numId = idTerr ? Number(idTerr) : null;
        const rawNome = selectedTerritory.nome_territorio || selectedTerritory.territorio || '';
        const nome = normalizeName(rawNome.replace(/^Território de Identidade\s+/i, '').trim());
        const dict = geoJsonLayersByTerritoryRef?.current || {};
        const layer =
          (idTerr && dict[idTerr]) ||
          (numId && dict[numId]) ||
          (nome && dict[nome]) ||
          dict[rawNome];

        if (layer && typeof layer.getBounds === 'function') {
          const b = layer.getBounds();
          if (b && b.isValid()) {
            map.fitBounds(b, { padding: [32, 32], maxZoom: 8.5, duration: 0.45 });
            prevCadeiaRef.current = selectedCadeia;
            return;
          }
        }
      }
      fitMapToBahia(map, territoriosLayerRef);
    }
    prevCadeiaRef.current = selectedCadeia;
  }, [selectedCadeia, selectedTerritory, geoJsonLayersByTerritoryRef, territoriosLayerRef, map]);

  return null;
}

export function ConnectionsFocusController() {
  return null;
}

export function ChangeMapView({ coords, modoGeografico = false }) {
  const map = useMap();
  useEffect(() => {
    if (!coords) return;
    let lat, lng;
    let targetZoom = modoGeografico ? 13.0 : 9.25;
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
      const maxZoomAllowed = modoGeografico ? 15 : 10.5;
      const desiredZoom = Math.min(Math.max(currentZoom, targetZoom), maxZoomAllowed);
      map.flyTo([lat, lng], desiredZoom, { duration: 0.45, easeLinearity: 0.25 });
    }
  }, [coords, modoGeografico, map]);
  return null;
}

export function MapResizeHandler({ isExpanded }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);

  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize({ animate: false }), 120);
    const t2 = setTimeout(() => map.invalidateSize({ animate: false }), 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isExpanded, map]);

  return null;
}

export function MapZoomWatcher({ onZoomChange, onBoundsChange }) {
  const map = useMap();
  const lastZoomRef = useRef(null);

  const reportView = () => {
    const z = map.getZoom();
    const rounded = Math.round(z * 4) / 4;
    if (lastZoomRef.current !== rounded) {
      lastZoomRef.current = rounded;
      onZoomChange?.(rounded);
    }
    if (onBoundsChange) {
      const b = map.getBounds();
      onBoundsChange({
        south: Number(b.getSouth().toFixed(4)),
        west: Number(b.getWest().toFixed(4)),
        north: Number(b.getNorth().toFixed(4)),
        east: Number(b.getEast().toFixed(4))
      });
    }
  };

  useMapEvents({
    zoomend: reportView,
    moveend: reportView
  });
  useEffect(() => {
    reportView();
  }, [map]);
  return null;
}
