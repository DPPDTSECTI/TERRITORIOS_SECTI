import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { BookOpen } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { normalizeName } from './mapGeoUtils';
import { createClusterIcon, createSingleAssetIconWithSvg, getSemiaridoPointColor } from './mapIcons';
import { getSemanticColors } from '../../graph/chartTheme';

export function SingleAssetPopupContent({ ativo, filtroSemiarido = false }) {
  const { isDark } = useTheme();
  if (!ativo) return null;

  const semantic = getSemanticColors(isDark);
  const dotColor = filtroSemiarido
    ? getSemiaridoPointColor(isDark ? (ativo.corHexDark || ativo.corHex) : ativo.corHex, ativo.tipo || ativo.shortTipo || ativo.nome, isDark)
    : (isDark ? (ativo.corHexDark || ativo.corHex || semantic.primaryLight) : (ativo.corHex || semantic.primaryBase));
  const terrName = ativo.territorio ? String(ativo.territorio).replace(/^Território de Identidade\s+/i, '') : '';

  return (
    <div
      data-no-map-zoom="true"
      className="p-3.5 min-w-[220px] max-w-[275px] flex flex-col gap-2 font-sans bg-surface text-text-primary select-text"
    >
      <div className="flex items-center gap-2 pr-6">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        <span className="text-[11px] font-medium text-text-muted truncate">
          {ativo.shortTipo || ativo.tipo}
        </span>
      </div>

      <h4 className="font-semibold text-text-primary text-sm leading-snug tracking-tight">
        {ativo.nome || ativo.entidade}
      </h4>

      <p className="text-xs text-text-secondary truncate">
        <span className="font-medium text-text-primary">{ativo.municipio}</span>
        {terrName ? ` · ${terrName}` : ''}
      </p>

      {ativo.rnp && (
        <div className={`inline-flex items-center gap-1.5 w-fit text-[11px] font-medium px-2 py-0.5 rounded-md ${filtroSemiarido
          ? 'text-amber-800 dark:text-amber-300 bg-amber-500/10'
          : 'text-info-600 dark:text-info-400 bg-info-500/10'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${filtroSemiarido ? 'bg-amber-600' : 'bg-info-500'}`} />
          <span>Ponto de Presença / Conexão RNP</span>
        </div>
      )}
    </div>
  );
}

export function SingleCadeiaPopupContent({ cadeia, filtroSemiarido = false, getSegmentColor = null }) {
  if (!cadeia) return null;
  const badgeColor = filtroSemiarido
    ? getSemiaridoPointColor(cadeia.corHex, cadeia.tipo || cadeia.shortTipo || cadeia.nome)
    : (cadeia.corHex || getSemanticColors().primaryBase);

  const corSegmento = cadeia?.corSegmento || (getSegmentColor && cadeia?.segmento ? getSegmentColor(cadeia.segmento) : null);
  const sede = cadeia.municipio_sede || cadeia.municipio;
  const munCount = cadeia.municipios_cobertos?.length || 0;

  return (
    <div
      data-no-map-zoom="true"
      className="p-3.5 min-w-[235px] max-w-[285px] flex flex-col gap-2 text-left select-text font-sans bg-surface text-text-primary"
    >
      <div className="flex items-center gap-1.5 flex-wrap pr-6">
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: `${badgeColor}18`,
            color: badgeColor
          }}
        >
          {cadeia.shortTipo || cadeia.tipo || 'Cadeia Produtiva'}
        </span>
        {cadeia.segmento && (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-md"
            style={corSegmento ? {
              backgroundColor: `${corSegmento}16`,
              color: corSegmento
            } : undefined}
          >
            {cadeia.segmento}
          </span>
        )}
      </div>

      <h4 className="text-sm font-semibold text-text-primary leading-snug tracking-tight">
        {cadeia.nome || cadeia.entidade || 'Cadeia Produtiva'}
      </h4>

      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-text-secondary">
        {sede && (
          <span className="truncate">
            Sede: <strong className="font-medium text-text-primary">{sede}</strong>
          </span>
        )}
        {munCount > 0 && (
          <span className="text-text-muted tabular-nums">
            · {munCount} {munCount === 1 ? 'município' : 'municípios'}
          </span>
        )}
      </div>

      {cadeia.texto_referencia && (
        <div className="mt-0.5 px-2.5 py-2 rounded-lg bg-amber-500/10 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300 mb-0.5">
            <BookOpen size={11} className="shrink-0" />
            <span>Referência Acadêmica</span>
          </div>
          <p className="italic line-clamp-3 text-text-secondary dark:text-amber-200/90 m-0">
            &ldquo;{cadeia.texto_referencia}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

export function SingleUniversityPopupContent({ ativo, filtroSemiarido = false, onCourseClick = null }) {
  const { isDark } = useTheme();
  if (!ativo || !Array.isArray(ativo.cursos)) return null;

  const semantic = getSemanticColors(isDark);
  const dotColor = filtroSemiarido
    ? getSemiaridoPointColor(isDark ? (ativo.corHexDark || ativo.corHex) : ativo.corHex, 'Instituição de Ensino', isDark)
    : (isDark ? (ativo.corHexDark || ativo.corHex || semantic.primaryLight) : (ativo.corHex || semantic.primaryBase));
  const cursosList = ativo.cursos;

  return (
    <div
      data-no-map-zoom="true"
      className="p-3.5 min-w-[250px] max-w-[310px] flex flex-col gap-2 font-sans bg-surface text-text-primary select-text"
    >
      <div className="flex items-center justify-between gap-2 pr-6">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
          />
          <span className="text-[11px] font-semibold text-text-secondary truncate">
            {ativo.sigla || 'IES'}
          </span>
        </div>
        <span className="text-[11px] font-medium text-text-muted tabular-nums shrink-0">
          {cursosList.length} {cursosList.length === 1 ? 'curso' : 'cursos'}
        </span>
      </div>

      <div className="border-b border-border/70 pb-2">
        <h4 className="font-semibold text-text-primary text-sm leading-snug tracking-tight">
          {ativo.iesNome || ativo.nome}
        </h4>
        {ativo.municipio && (
          <p className="text-xs text-text-muted truncate mt-0.5">
            {ativo.municipio}
          </p>
        )}
      </div>

      <div
        className="flex flex-col gap-0.5 max-h-[196px] overflow-y-auto pr-1"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {cursosList.map((cursoItem, idx) => (
          <button
            key={cursoItem.id || `${cursoItem.nome}-${idx}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCourseClick?.(cursoItem.raw);
            }}
            className="w-full text-left py-1.5 px-2 rounded-md hover:bg-surface-soft/90 dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-between gap-2 cursor-pointer group"
          >
            <span className="text-xs font-medium text-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 leading-snug truncate">
              {cursoItem.nome}
            </span>
            {cursoItem.ead && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 shrink-0">
                EaD
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export const SingleAssetMarkerItem = React.memo(function SingleAssetMarkerItem({ elem, ativo, setPinnedAssetId, onAssetClick, onAssetHover, isSelected, mode, filtroSemiarido = false, getSegmentColor = null }) {
  const { isDark } = useTheme();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const isUniversityPoint = Array.isArray(ativo?.cursos);

  const eventHandlers = useMemo(() => {
    const handlers = {
      popupopen: () => setIsPopupOpen(true),
      popupclose: () => {
        setIsPopupOpen(false);
        if (isUniversityPoint) {
          setPinnedAssetId((prev) => (prev === ativo.id ? null : prev));
        }
      },
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        if (isUniversityPoint) {
          setPinnedAssetId(isSelected ? null : ativo.id);
          return;
        }
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
  }, [isSelected, isUniversityPoint, ativo, setPinnedAssetId, onAssetClick, onAssetHover]);

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
          isUniversityPoint ? (
            <SingleUniversityPopupContent ativo={ativo} filtroSemiarido={filtroSemiarido} onCourseClick={onAssetClick} />
          ) : mode !== 'cadeias' ? (
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
          const SPREAD = mode === 'cursos' ? 0.008 : 0.00065;
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
  }, [processedAtivos, mode]);

  const superclusterIndex = useMemo(() => {
    if (selectedCadeia || mode === 'cursos') return null;

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
  }, [deduplicatedAtivos, selectedCadeia, modoGeografico, mode]);

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
    if (mode === 'cursos') {
      return deduplicatedAtivos
        .filter((ativo) => ativo && ativo.lat && ativo.lng)
        .map((ativo, idx) => ({
          isCluster: false,
          lng: Number(ativo.lng),
          lat: Number(ativo.lat),
          ativo,
          key: `ativo-${ativo.id || idx}`
        }));
    }

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
  }, [bounds, zoom, superclusterIndex, selectedCadeia, deduplicatedAtivos, mode]);

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
