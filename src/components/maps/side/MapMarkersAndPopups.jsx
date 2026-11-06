import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { MapPin, Building, Layers, BookOpen } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { normalizeName } from './mapGeoUtils';
import { createClusterIcon, createSingleAssetIconWithSvg, getSemiaridoPointColor } from './mapIcons';

export function SingleAssetPopupContent({ ativo, filtroSemiarido = false }) {
  const { isDark } = useTheme();
  if (!ativo) return null;

  const IconComp = ativo.icone;
  const iconColor = filtroSemiarido
    ? getSemiaridoPointColor(isDark ? (ativo.corHexDark || ativo.corHex) : ativo.corHex, ativo.tipo || ativo.shortTipo || ativo.nome, isDark)
    : (isDark ? (ativo.corHexDark || ativo.corHex || '#60A5FA') : (ativo.corHex || '#2563EB'));

  return (
    <div className="p-3.5 min-w-[230px] max-w-[280px] flex flex-col gap-2.5 font-sans bg-surface text-text-primary">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-2 pr-6">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-xs"
            style={{ backgroundColor: iconColor }}
          >
            {IconComp && <IconComp size={11} className="text-white" />}
          </div>
          <span className="text-caption font-medium text-text-muted truncate">
            {ativo.shortTipo || ativo.tipo}
          </span>
        </div>
      </div>

      <h4 className="font-semibold text-text-primary text-body-sm leading-snug tracking-tight">
        {ativo.nome || ativo.entidade}
      </h4>

      <div className="flex flex-col gap-1.5 bg-surface-soft p-2.5 rounded-xl border border-border text-caption">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <MapPin size={14} className={filtroSemiarido ? 'text-amber-600 shrink-0' : 'text-primary-600 shrink-0'} />
          <span className="font-semibold text-text-primary truncate">{ativo.municipio}</span>
        </div>
        {ativo.territorio && (
          <div className="flex items-center gap-1.5 text-text-muted">
            <Building size={14} className="text-text-muted shrink-0" />
            <span className="font-medium text-text-muted truncate">
              {ativo.territorio.replace(/^Território de Identidade\s+/i, '')}
            </span>
          </div>
        )}
        {ativo.rnp && (
          <div className={`flex items-center gap-1.5 text-caption font-medium px-2 py-1 rounded-lg border ${
            filtroSemiarido
              ? 'text-amber-800 dark:text-amber-300 bg-amber-500/15 border-amber-500/30'
              : 'text-info-600 dark:text-info-400 bg-info-500/15 border-info-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${filtroSemiarido ? 'bg-amber-600' : 'bg-info-500'}`}></span>
            <span>Ponto de Presença / Conexão RNP</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SingleCadeiaPopupContent({ cadeia, filtroSemiarido = false, getSegmentColor = null }) {
  if (!cadeia) return null;
  const badgeColor = filtroSemiarido
    ? getSemiaridoPointColor(cadeia.corHex, cadeia.tipo || cadeia.shortTipo || cadeia.nome)
    : (cadeia.corHex || '#2563EB');

  const corSegmento = cadeia?.corSegmento || (getSegmentColor && cadeia?.segmento ? getSegmentColor(cadeia.segmento) : null);

  return (
    <div className="p-3.5 min-w-[240px] max-w-[285px] text-left select-text font-sans bg-surface text-text-primary">
      <div className="flex items-center gap-1.5 mb-2 flex-wrap pr-6">
        <span
          className="text-caption font-medium px-2.5 py-0.5 rounded-control"
          style={{
            backgroundColor: `${badgeColor}20`,
            color: badgeColor
          }}
        >
          {cadeia.shortTipo || cadeia.tipo || 'Cadeia Produtiva'}
        </span>
        {cadeia.segmento && (
          <span
            className="text-caption font-medium px-2.5 py-0.5 rounded-control border border-border/60"
            style={corSegmento ? {
              backgroundColor: `${corSegmento}18`,
              color: corSegmento,
              borderColor: `${corSegmento}35`
            } : undefined}
          >
            {cadeia.segmento}
          </span>
        )}
      </div>

      <h4 className="text-body-sm font-semibold text-text-primary leading-snug mb-2">
        {cadeia.nome || cadeia.entidade || 'Cadeia Produtiva'}
      </h4>

      <div className="flex flex-col gap-1.5 text-caption text-text-muted border-t border-border pt-2.5">
        {(cadeia.municipio_sede || cadeia.municipio) && (
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Building size={13} className="shrink-0 text-text-muted" />
            <span className="truncate">Sede: <strong className="font-semibold text-text-primary">{cadeia.municipio_sede || cadeia.municipio}</strong></span>
          </div>
        )}

        {(cadeia.territorio_identidade || cadeia.territorio) && (
          <div className="flex items-center gap-1.5 text-text-muted">
            <Layers size={13} className="shrink-0 text-text-muted" />
            <span className="font-medium text-text-muted truncate">
              {String(cadeia.territorio_identidade || cadeia.territorio).replace(/^Território de Identidade\s+/i, '')}
            </span>
          </div>
        )}

        {cadeia.municipios_cobertos && cadeia.municipios_cobertos.length > 0 && (
          <div className="flex items-center gap-1.5 text-text-secondary">
            <MapPin size={13} className="shrink-0 text-text-muted" />
            <span className="font-semibold text-text-primary tnum">
              {cadeia.municipios_cobertos.length}
            </span>
            <span>municípios atendidos</span>
          </div>
        )}

        {cadeia.texto_referencia && (
          <div className="mt-1.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-caption text-amber-900 dark:text-amber-200 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300 mb-1">
              <BookOpen size={12} className="text-amber-700 dark:text-amber-400 shrink-0" />
              <span>Artigo / Referência Acadêmica:</span>
            </div>
            <p className="italic line-clamp-3 text-text-secondary dark:text-amber-200/90 m-0">
              "{cadeia.texto_referencia}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export const SingleAssetMarkerItem = React.memo(function SingleAssetMarkerItem({ elem, ativo, setPinnedAssetId, onAssetClick, onAssetHover, isSelected, mode, filtroSemiarido = false, getSegmentColor = null }) {
  const { isDark } = useTheme();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const eventHandlers = useMemo(() => {
    const handlers = {
      popupopen: () => setIsPopupOpen(true),
      popupclose: () => setIsPopupOpen(false),
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
    };
    if (onAssetHover) {
      handlers.mouseover = () => onAssetHover(ativo);
      handlers.mouseout = () => onAssetHover(null);
    }
    return handlers;
  }, [isSelected, ativo, setPinnedAssetId, onAssetClick, onAssetHover]);

  return (
    <Marker
      key={elem.key}
      position={[elem.lat, elem.lng]}
      zIndexOffset={isSelected ? 1000 : 0}
      icon={createSingleAssetIconWithSvg(
        isDark ? (ativo.corHexDark || ativo.corHex) : ativo.corHex,
        ativo.iconSvg,
        isSelected,
        filtroSemiarido,
        ativo.tipo || ativo.shortTipo || ativo.categoria || ativo.nome,
        isDark
      )}
      eventHandlers={eventHandlers}
    >
      <Popup className="custom-premium-popup" autoPan={mode !== 'cadeias'}>
        {(isPopupOpen || isSelected) ? (
          mode !== 'cadeias' ? (
            <SingleAssetPopupContent ativo={ativo} filtroSemiarido={filtroSemiarido} />
          ) : (
            <SingleCadeiaPopupContent cadeia={ativo} filtroSemiarido={filtroSemiarido} getSegmentColor={getSegmentColor} />
          )
        ) : null}
      </Popup>
    </Marker>
  );
});

export function SuperclusteredMarkers({ processedAtivos = [], pinnedAssetId, setPinnedAssetId, onAssetClick, onAssetHover, selectedCadeia, mode, filtroSemiarido = false, getSegmentColor = null, modoGeografico = false }) {
  const map = useMap();
  const { isDark } = useTheme();
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(() => map.getZoom());

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
      radius: 38,
      maxZoom: modoGeografico ? 13 : 9,
      minPoints: 2
    });

    sc.load(points);
    return sc;
  }, [deduplicatedAtivos, selectedCadeia, modoGeografico]);

  const updateBoundsAndZoom = useCallback(() => {
    const b = map.getBounds().pad(0.18);
    const nextBounds = [
      Number(b.getWest().toFixed(3)),
      Number(b.getSouth().toFixed(3)),
      Number(b.getEast().toFixed(3)),
      Number(b.getNorth().toFixed(3))
    ];
    const nextZoom = Math.round(map.getZoom());

    setBounds((prev) => {
      if (
        prev &&
        prev[0] === nextBounds[0] &&
        prev[1] === nextBounds[1] &&
        prev[2] === nextBounds[2] &&
        prev[3] === nextBounds[3]
      ) {
        return prev;
      }
      return nextBounds;
    });
    setZoom((prev) => (prev === nextZoom ? prev : nextZoom));
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
      const focusedList = deduplicatedAtivos.filter(
        (ativo) =>
          (selectedCadeia.id_cadeia != null && ativo.id_cadeia === selectedCadeia.id_cadeia) ||
          (selectedCadeia.id != null && ativo.id === selectedCadeia.id) ||
          (selectedCadeia.nome && ativo.nome === selectedCadeia.nome)
      );
      const listToRender = focusedList.length > 0 ? focusedList : [selectedCadeia];
      return listToRender
        .filter((ativo) => ativo && ativo.lat && ativo.lng)
        .map((ativo, idx) => ({
          isCluster: false,
          lng: Number(ativo.lng),
          lat: Number(ativo.lat),
          ativo,
          key: `ativo-focused-${ativo.id || ativo.id_cadeia}-${idx}`
        }));
    }

    if (!bounds || !superclusterIndex) return [];

    const clusters = superclusterIndex.getClusters(bounds, Math.round(zoom));
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
              icon={createClusterIcon(elem.pointCount, filtroSemiarido, isDark)}
              eventHandlers={{
                click: () => {
                  const maxAllowed = modoGeografico ? 14 : 10;
                  const rawExpansion = superclusterIndex.getClusterExpansionZoom(elem.clusterId);
                  const expansionZoom = Math.min(
                    Math.max(rawExpansion, map.getZoom() + 1.5),
                    maxAllowed
                  );
                  map.flyTo([elem.lat, elem.lng], expansionZoom, { duration: 0.45, easeLinearity: 0.25 });
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
            onAssetHover={onAssetHover}
            isSelected={isSelected}
            mode={mode}
            filtroSemiarido={filtroSemiarido}
            getSegmentColor={getSegmentColor}
          />
        );
      })}
    </>
  );
}
