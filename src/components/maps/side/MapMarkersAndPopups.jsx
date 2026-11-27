import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { BookOpen, Building2 } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { normalizeName } from './mapGeoUtils';
import { createClusterIcon, createSingleAssetIconWithSvg, getSemiaridoPointColor } from './mapIcons';
import { getSemanticColors } from '../../graph/chartTheme';
import { formatInstituicaoLabel } from '../../../utils/instituicoes';

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

      {ativo.nome_instituicao && (
        <div
          className="flex items-center gap-1.5 text-xs text-text-secondary"
          title={formatInstituicaoLabel(ativo.nome_instituicao, ativo.sigla_instituicao)}
        >
          <Building2 size={12} className="shrink-0 text-text-muted" />
          <span className="truncate">
            {formatInstituicaoLabel(ativo.nome_instituicao, ativo.sigla_instituicao)}
          </span>
        </div>
      )}

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

export function SingleUniversityPopupContent({ ativo }) {
  if (!ativo || !Array.isArray(ativo.cursos)) return null;

  return (
    <div
      data-no-map-zoom="true"
      className="px-2.5 py-1.5 font-sans bg-surface text-text-primary select-text"
    >
      <h4 className="font-semibold text-text-primary text-xs leading-snug tracking-tight">
        {ativo.iesNome || ativo.nome}
      </h4>
    </div>
  );
}

export const SingleAssetMarkerItem = React.memo(function SingleAssetMarkerItem({ elem, ativo, setPinnedAssetId, onAssetClick, onAssetHover, onSelectIES = null, isSelected, mode, filtroSemiarido = false, getSegmentColor = null }) {
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
          const iesFilterValue = ativo.sigla || ativo.iesNome || ativo.nome;
          if (isSelected) {
            setPinnedAssetId(null);
            onSelectIES?.(null);
          } else {
            setPinnedAssetId(ativo.id);
            onSelectIES?.(iesFilterValue);
          }
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
  }, [isSelected, isUniversityPoint, ativo, setPinnedAssetId, onAssetClick, onAssetHover, onSelectIES]);

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
      {isUniversityPoint ? (
        <Tooltip
          direction="top"
          offset={[0, -14]}
          opacity={1}
          className="clean-city-tooltip"
        >
          <div
            className={`px-2.5 py-1 rounded-lg border shadow-sm backdrop-blur-md text-xs font-semibold whitespace-nowrap max-w-[240px] truncate ${
              isSelected
                ? (filtroSemiarido
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200')
                : 'bg-white/95 dark:bg-zinc-900/95 text-zinc-900 dark:text-zinc-100 border-zinc-200/80 dark:border-zinc-700/80'
            }`}
          >
            {ativo.iesNome || ativo.nome}
          </div>
        </Tooltip>
      ) : (
        <Popup className="custom-premium-popup" autoPan={mode !== 'cadeias'}>
          {(isPopupOpen || isSelected) ? (
            mode !== 'cadeias' ? (
              <SingleAssetPopupContent ativo={ativo} filtroSemiarido={filtroSemiarido} />
            ) : (
              <SingleCadeiaPopupContent cadeia={ativo} filtroSemiarido={filtroSemiarido} getSegmentColor={getSegmentColor} />
            )
          ) : null}
        </Popup>
      )}
    </Marker>
  );
});

export function SuperclusteredMarkers({ processedAtivos = [], pinnedAssetId, setPinnedAssetId, onAssetClick, onAssetHover, selectedCadeia, selectedIES = null, onSelectIES = null, mode, filtroSemiarido = false, getSegmentColor = null, modoGeografico = false }) {
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
        const isUniversitySelected = Boolean(
          Array.isArray(ativo?.cursos) &&
          selectedIES &&
          (
            (ativo.sigla && ativo.sigla.toUpperCase() === String(selectedIES).trim().toUpperCase()) ||
            (ativo.iesNome && ativo.iesNome === selectedIES) ||
            (ativo.nome && ativo.nome === selectedIES)
          )
        );
        const isSelected = Boolean(
          isUniversitySelected ||
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
            onSelectIES={onSelectIES}
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
