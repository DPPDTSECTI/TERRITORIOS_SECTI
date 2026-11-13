import React, { useEffect, useMemo, useState, useRef, useCallback, useContext } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Globe, Maximize2, RotateCcw, ChevronRight, X, Layers } from 'lucide-react';

import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';
import { isMunicipioSemiarido } from '../../constants/semiarido';
import { DataContext } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useMapTheme } from './mapTheme';
import { getRelativeHeatColor } from './side/mapHeatScale';
import CtrlScrollZoom from './CtrlScrollZoom';
import { getSemanticColors } from '../graph/chartTheme';
import { getCachedBahiaTopologia, loadBahiaTopologia } from './bahiaTopologiaCache';
import { normalizeName } from './side/mapGeoUtils';

// Buffer equilibrado (65% além da tela) para evitar cortes ao afastar o zoom sem sobrecarregar a GPU
if (typeof L !== 'undefined' && L.Renderer) {
  L.Renderer.prototype.options.padding = 0.65;
  if (L.SVG) L.SVG.prototype.options.padding = 0.65;
  if (L.Canvas) L.Canvas.prototype.options.padding = 0.65;
}

const uniqueTerritories = Object.values(
  municipiosDB.reduce((acc, row) => {
    if (!acc[row.id_territorio]) {
      acc[row.id_territorio] = { id: row.id_territorio, nome: row.nome_territorio };
    }
    return acc;
  }, {})
);

const municipioByIdMap = municipiosDB.reduce((acc, m) => {
  acc[m.id_municipio] = m;
  return acc;
}, {});

function MapInteractionTracker({ onZoomChange, onBackgroundClick }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
    click: (e) => {
      const target = e.originalEvent?.target;
      if (target && target.closest('.leaflet-interactive')) return;
      onBackgroundClick?.();
    }
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

export default function PtiMap({
  territoriosData = [],
  territoriesDynamicStats = {},
  searchTerm = '',
  filtroSemiarido = false,
  selectedTerritory = null,
  onSelectTerritory = () => {},
  semiaridoMunicipios = [],
  onToggleSemiarido = null,
  hideLayerControls = false
}) {
  const { isDark } = useTheme();
  const mapPalette = useMapTheme(filtroSemiarido);
  const { modoGeografico: contextModoGeo, setModoGeografico: setContextModoGeo } = useContext(DataContext) || {};
  const [localModoGeo, setLocalModoGeo] = useState(false);
  const modoGeografico = contextModoGeo !== undefined ? Boolean(contextModoGeo) : localModoGeo;
  const toggleModoGeografico = useCallback(() => {
    if (setContextModoGeo) {
      setContextModoGeo((prev) => !prev);
    } else {
      setLocalModoGeo((prev) => !prev);
    }
  }, [setContextModoGeo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const bahiaBounds = [
      [-19.0, -47.5],
      [-7.5, -36.5]
    ];
    const targetMinZoom = 5.25;
    const targetMaxZoom = modoGeografico ? 18 : 10.5;
    map.options.maxBoundsViscosity = 0.9;
    map.setMinZoom(targetMinZoom);
    map.setMaxZoom(targetMaxZoom);
    map.setMaxBounds(bahiaBounds);
    if (map.getZoom() > targetMaxZoom) {
      map.setZoom(targetMaxZoom);
    } else if (map.getZoom() < targetMinZoom) {
      map.setZoom(targetMinZoom);
    }
    map.panInsideBounds(bahiaBounds, { animate: false });
  }, [modoGeografico]);

  const [topologia, setTopologia] = useState(() => getCachedBahiaTopologia());
  const [loading, setLoading] = useState(() => !getCachedBahiaTopologia());

  const [currentZoom, setCurrentZoom] = useState(5.8);
  const isZoomedIn = currentZoom >= 6.75;

  const [isMunListExpanded, setIsMunListExpanded] = useState(false);

  const geoJsonLayerRef = useRef(null);
  const selectedMunLayerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const containerRectRef = useRef(null);
  const mapRef = useRef(null);
  const layersByTerritory = useRef({});
  const tooltipDomRef = useRef(null);
  const tooltipAccentRef = useRef(null);
  const tooltipMunRef = useRef(null);
  const tooltipTitleRef = useRef(null);
  const tooltipAtivosRef = useRef(null);
  const tooltipIfdmRef = useRef(null);
  const isTooltipVisibleRef = useRef(false);
  const isTouchInteractionRef = useRef(false);

  useEffect(() => {
    let active = true;
    if (topologia) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadBahiaTopologia()
      .then((data) => {
        if (!active) return;
        setTopologia(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar mapa:', err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [topologia]);

  // ResizeObserver para manter o canvas do Leaflet nítido e cachear o rect do container sem reflow no mousemove
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    containerRectRef.current = container.getBoundingClientRect();
    const ro = new ResizeObserver(() => {
      if (mapContainerRef.current) {
        containerRectRef.current = mapContainerRef.current.getBoundingClientRect();
      }
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: false });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Atalho de teclado Escape para limpar seleção de território
  useEffect(() => {
    if (!selectedTerritory) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onSelectTerritory(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTerritory, onSelectTerritory]);

  const mergedNormalData = topologia?.mergedNormalData || null;
  const mergedSemiData = topologia?.mergedSemiData || null;
  const territoryMeshes = topologia?.territoryMeshes || {};
  const allTerritoryMesh = topologia?.allTerritoryMesh || null;
  const stateBoundaryMesh = topologia?.stateBoundaryMesh || null;
  const allMunicipiosMesh = topologia?.allMunicipiosMesh || null;
  const municipiosByTerritory = topologia?.municipiosByTerritory || {};

  // Escala sequencial canônica de 5 classes (--color-map-1..5 / --chart-seq) para os 27 territórios
  const territoryHeatColorMap = useMemo(() => {
    const countsByTer = {};
    let maxVal = 0;

    uniqueTerritories.forEach((ter) => {
      const idTer = Number(ter.id);
      const dyn = territoriesDynamicStats?.[idTer];
      const rawData = territoriosData.find((t) => Number(t.id_territorio) === idTer);
      const val = Number(
        dyn?.capacidadeCti ??
          rawData?.ativos_cti ??
          0
      );
      countsByTer[idTer] = val;
      if (val > maxVal) maxVal = val;
    });

    const colorMap = {};
    uniqueTerritories.forEach((ter) => {
      const idTer = Number(ter.id);
      const val = countsByTer[idTer] || 0;
      colorMap[idTer] = maxVal > 0
        ? getRelativeHeatColor(val, maxVal, filtroSemiarido, isDark)
        : mapPalette.choropleth.level5;
    });
    return colorMap;
  }, [territoriosData, territoriesDynamicStats, filtroSemiarido, isDark, mapPalette]);

  // Estilo da camada base (Territórios mesclados ou Municípios quando em zoom profundo sem seleção)
  const styleBaseFeature = useCallback(
    (feature) => {
      const semantic = getSemanticColors(isDark);
      const idTer = Number(feature.properties.id_territorio);
      if (!idTer) return { fillOpacity: 0.1, stroke: false, fillColor: semantic.dangerTint };

      const neutralFill = mapPalette.choropleth.zero;
      const strokeColor = mapPalette.stroke.default;
      const faintStroke = mapPalette.border;

      const isSelectedMap = selectedTerritory && Number(selectedTerritory.id_territorio) === idTer;

      if (modoGeografico) {
        if (filtroSemiarido) {
          const isSemi =
            feature.properties.is_semiarido ??
            isMunicipioSemiarido(
              feature.properties.nome_municipio_oficial ||
                feature.properties.NOME ||
                feature.properties.nome ||
                ''
            );
          if (!isSemi) {
            return {
              fillColor: 'rgb(0, 0, 0)',
              fillOpacity: 0,
              stroke: false,
              weight: 0,
              className: 'outline-none'
            };
          }
        }
        if (selectedTerritory) {
          if (isSelectedMap) {
            return {
              fillColor: filtroSemiarido ? semantic.warning : semantic.primarySoft,
              fillOpacity: 0.04,
              stroke: false,
              weight: 0,
              className: 'outline-none cursor-pointer'
            };
          }
          return {
            fillColor: 'rgb(0, 0, 0)',
            fillOpacity: 0.002,
            stroke: false,
            weight: 0,
            className: 'outline-none cursor-pointer'
          };
        }
        return {
          fillColor: 'rgb(0, 0, 0)',
          fillOpacity: 0.002,
          stroke: false,
          weight: 0,
          className: 'outline-none cursor-pointer'
        };
      }

      // Quando há território selecionado, a camada base renderiza os demais territórios suavemente esmaecidos (e clicáveis!)
      if (selectedTerritory) {
        if (isSelectedMap) {
          return {
            fillColor: 'transparent',
            stroke: false,
            weight: 0,
            fillOpacity: 0,
            className: 'outline-none'
          };
        }
        return {
          fillColor: neutralFill,
          stroke: true,
          weight: 0.8,
          color: faintStroke,
          fillOpacity: isDark ? 0.42 : 0.48,
          className: 'outline-none cursor-pointer'
        };
      }

      // Quando o usuário deu zoom profundo na visão geral (zoom >= 6.75)
      if (isZoomedIn) {
        if (filtroSemiarido) {
          const isMunSemi =
            feature.properties.is_semiarido ??
            isMunicipioSemiarido(
              feature.properties.nome_municipio_oficial ||
                feature.properties.NOME ||
                feature.properties.nome ||
                ''
            );
          if (isMunSemi) {
            return {
              fillColor: territoryHeatColorMap[idTer] || mapPalette.choropleth.level3,
              stroke: true,
              weight: 1.0,
              color: strokeColor,
              fillOpacity: 0.92,
              className: 'outline-none cursor-pointer'
            };
          }
          return {
            fillColor: neutralFill,
            stroke: true,
            weight: 0.6,
            color: faintStroke,
            fillOpacity: 0.35,
            className: 'outline-none'
          };
        }

        const dStats = territoriesDynamicStats[idTer];
        const matchesFilters = dStats ? dStats.matchesFilters : true;
        return {
          fillColor: matchesFilters ? territoryHeatColorMap[idTer] || mapPalette.choropleth.level4 : neutralFill,
          stroke: true,
          weight: 1.0,
          color: strokeColor,
          fillOpacity: matchesFilters ? 0.90 : 0.40,
          className: 'outline-none cursor-pointer'
        };
      }

      // Visão Geral padrão (27 polígonos mesclados super leves)
      if (filtroSemiarido) {
        const isSemi = feature.properties.is_semiarido;
        return {
          fillColor: isSemi ? territoryHeatColorMap[idTer] || mapPalette.choropleth.level3 : neutralFill,
          stroke: true,
          weight: 1.2,
          color: strokeColor,
          fillOpacity: isSemi ? 0.95 : 0.35,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'outline-none cursor-pointer'
        };
      }

      const dStats = territoriesDynamicStats[idTer];
      const matchesFilters = dStats ? dStats.matchesFilters : true;
      return {
        fillColor: matchesFilters ? territoryHeatColorMap[idTer] || mapPalette.choropleth.level4 : neutralFill,
        stroke: true,
        weight: 1.4,
        color: strokeColor,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        fillOpacity: matchesFilters ? 0.92 : 0.40,
        className: 'outline-none cursor-pointer'
      };
    },
    [selectedTerritory, isZoomedIn, filtroSemiarido, modoGeografico, territoriesDynamicStats, territoryHeatColorMap, mapPalette, isDark]
  );

  // Estilo exclusivo para os municípios do território selecionado (~15 polígonos em vez de 417)
  const styleSelectedMunicipio = useCallback(
    (feature) => {
      const idTer = Number(feature.properties.id_territorio);
      const isMunSemi =
        feature.properties.is_semiarido ??
        isMunicipioSemiarido(
          feature.properties.nome_municipio_oficial ||
            feature.properties.NOME ||
            feature.properties.nome ||
            ''
        );

      let fillColor = territoryHeatColorMap[idTer] || mapPalette.choropleth.level3;
      let opacity = 0.95;

      if (filtroSemiarido) {
        if (isMunSemi) {
          fillColor = territoryHeatColorMap[idTer] || mapPalette.choropleth.level2;
        } else {
          fillColor = mapPalette.choropleth.zero;
          opacity = 0.38;
        }
      }

      return {
        fillColor,
        stroke: true,
        weight: 1.25,
        color: mapPalette.stroke.default,
        fillOpacity: opacity,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'outline-none cursor-pointer'
      };
    },
    [filtroSemiarido, mapPalette, territoryHeatColorMap]
  );

  // Atualiza estilos imperativamente quando filtros ou seleção mudam sem destruir o GeoJSON
  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.setStyle(styleBaseFeature);
    }
  }, [styleBaseFeature]);

  useEffect(() => {
    if (selectedMunLayerRef.current) {
      selectedMunLayerRef.current.setStyle(styleSelectedMunicipio);
    }
  }, [styleSelectedMunicipio]);

  // Refs para callbacks nos listeners do Leaflet sem precisar recriar camadas
  const stateRef = useRef({
    selectedTerritory,
    isZoomedIn,
    filtroSemiarido,
    modoGeografico,
    isDark,
    territoriosData,
    onSelectTerritory,
    mapPalette,
    territoryHeatColorMap,
    styleBaseFeature,
    styleSelectedMunicipio
  });
  useEffect(() => {
    stateRef.current = {
      selectedTerritory,
      isZoomedIn,
      filtroSemiarido,
      modoGeografico,
      isDark,
      territoriosData,
      onSelectTerritory,
      mapPalette,
      territoryHeatColorMap,
      styleBaseFeature,
      styleSelectedMunicipio
    };
  });

  const updateTooltipPosition = useCallback((clientX, clientY) => {
    if (!tooltipDomRef.current) return;
    const rect = containerRectRef.current || mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tooltipWidth = 244;
    const tooltipHeight = 165;
    const offset = 16;

    let x = clientX - rect.left + offset;
    let y = clientY - rect.top + offset;

    if (x + tooltipWidth > rect.width - 8) x = clientX - rect.left - tooltipWidth - offset;
    if (y + tooltipHeight > rect.height - 8) y = clientY - rect.top - tooltipHeight - offset;
    if (x < 8) x = 8;
    if (y < 8) y = 8;

    tooltipDomRef.current.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  }, []);

  const showHoverTooltip = useCallback(
    (idTer, munId, clientX, clientY) => {
      if (isTouchInteractionRef.current) return;
      const { territoriosData: tData, filtroSemiarido: semi, territoryHeatColorMap: heatMap } = stateRef.current;
      const hoveredData = idTer ? tData.find((t) => Number(t.id_territorio) === idTer) : null;
      const fallbackName = idTer ? uniqueTerritories.find((t) => t.id === idTer)?.nome || '' : '';
      const munName = munId ? municipioByIdMap[munId]?.nome_municipio || '' : '';

      if (tooltipAccentRef.current) {
        tooltipAccentRef.current.style.backgroundColor = heatMap?.[idTer] || (semi
          ? getSemanticColors().warning
          : 'rgb(var(--color-brand))');
      }
      if (tooltipMunRef.current) {
        if (munName) {
          tooltipMunRef.current.textContent = munName;
          tooltipMunRef.current.style.display = 'block';
        } else {
          tooltipMunRef.current.style.display = 'none';
        }
      }
      if (tooltipTitleRef.current) {
        tooltipTitleRef.current.textContent = hoveredData ? hoveredData.territorio : fallbackName;
      }
      if (tooltipAtivosRef.current) {
        tooltipAtivosRef.current.textContent = String(hoveredData?.ativos_cti || 0);
      }
      if (tooltipIfdmRef.current) {
        tooltipIfdmRef.current.textContent = hoveredData?.media_ifdm
          ? (Math.trunc(Number(hoveredData.media_ifdm) * 1000) / 1000).toFixed(3)
          : '0.000';
      }

      isTooltipVisibleRef.current = true;
      if (clientX != null && clientY != null) {
        updateTooltipPosition(clientX, clientY);
      }
      if (tooltipDomRef.current) {
        tooltipDomRef.current.style.opacity = '1';
      }
    },
    [updateTooltipPosition]
  );

  const hideHoverTooltip = useCallback(() => {
    isTooltipVisibleRef.current = false;
    if (tooltipDomRef.current) {
      tooltipDomRef.current.style.opacity = '0';
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isTooltipVisibleRef.current) return;
      updateTooltipPosition(e.clientX, e.clientY);
    },
    [updateTooltipPosition]
  );

  const selectTerritoryById = useCallback((idTer, fallbackNome) => {
    const { territoriosData: tData, selectedTerritory: selTer, onSelectTerritory: onSelect } = stateRef.current;
    const foundData = tData.find((t) => Number(t.id_territorio) === idTer);
    if (selTer && Number(selTer.id_territorio) === idTer) {
      onSelect(null);
    } else if (foundData) {
      onSelect(foundData);
    } else {
      onSelect({ id_territorio: idTer, nome_territorio: fallbackNome });
    }
  }, []);

  const onEachBaseFeature = useCallback(
    (feature, layer) => {
      const idTer = Number(feature.properties.id_territorio);
      if (!idTer) return;

      if (!layersByTerritory.current[idTer]) {
        layersByTerritory.current[idTer] = [];
      }
      layersByTerritory.current[idTer].push(layer);

      layer.on({
        mouseover: (e) => {
          const { selectedTerritory: selTer, isZoomedIn: zoomed, modoGeografico: modoGeo, filtroSemiarido: semi } = stateRef.current;
          const isSelectedMap = selTer && Number(selTer.id_territorio) === idTer;
          if (!modoGeo && selTer && isSelectedMap) return;

          const cx = e.originalEvent?.clientX;
          const cy = e.originalEvent?.clientY;

          if (modoGeo) {
            showHoverTooltip(idTer, zoomed ? (feature.properties.id_municipio || null) : null, cx, cy);
            if (!isSelectedMap) {
              const hoverSemantic = getSemanticColors(stateRef.current.isDark);
              layersByTerritory.current[idTer]?.forEach((l) => {
                l.setStyle({
                  fillColor: semi ? hoverSemantic.warning : hoverSemantic.primarySoft,
                  fillOpacity: 0.08,
                  stroke: false,
                  weight: 0
                });
              });
            }
            return;
          }

          if (!selTer && !zoomed) {
            showHoverTooltip(idTer, null, cx, cy);

            layersByTerritory.current[idTer]?.forEach((l) => {
              l.setStyle({
                fillOpacity: 1.0
              });
            });
          } else {
            showHoverTooltip(idTer, feature.properties.id_municipio || null, cx, cy);
            e.target.setStyle({
              fillOpacity: selTer ? 0.72 : 1
            });
          }
        },
        mouseout: (e) => {
          const { selectedTerritory: selTer, isZoomedIn: zoomed, modoGeografico: modoGeo, styleBaseFeature: styleFn } = stateRef.current;
          if (modoGeo || (!selTer && !zoomed)) {
            layersByTerritory.current[idTer]?.forEach((l) => {
              l.setStyle(styleFn(l.feature));
            });
          } else {
            e.target.setStyle(styleFn(feature));
          }
          hideHoverTooltip();
        },
        click: (e) => {
          hideHoverTooltip();
          L.DomEvent.stopPropagation(e);
          const { filtroSemiarido: semi } = stateRef.current;
          const isSemi =
            feature.properties.is_semiarido !== undefined
              ? feature.properties.is_semiarido
              : isMunicipioSemiarido(
                  feature.properties.nome_municipio_oficial ||
                    feature.properties.NOME ||
                    feature.properties.nome ||
                    ''
                );
          if (semi && !isSemi) return;
          selectTerritoryById(idTer, feature.properties.nome_territorio);
        }
      });
    },
    [selectTerritoryById, showHoverTooltip, hideHoverTooltip]
  );

  const onEachSelectedMunicipioFeature = useCallback(
    (feature, layer) => {
      const idTer = Number(feature.properties.id_territorio);
      if (!idTer) return;

      layer.on({
        mouseover: (e) => {
          showHoverTooltip(
            idTer,
            feature.properties.id_municipio || null,
            e.originalEvent?.clientX,
            e.originalEvent?.clientY
          );
          e.target.setStyle({
            fillOpacity: 1
          });
        },
        mouseout: (e) => {
          e.target.setStyle(stateRef.current.styleSelectedMunicipio(feature));
          hideHoverTooltip();
        },
        click: (e) => {
          hideHoverTooltip();
          L.DomEvent.stopPropagation(e);
          if (mapRef.current && e.target && typeof e.target.getBounds === 'function') {
            const b = e.target.getBounds();
            if (b && b.isValid()) {
              mapRef.current.fitBounds(b, { padding: [48, 48], maxZoom: 9.5, duration: 0.35 });
            }
          }
        }
      });
    },
    [showHoverTooltip, hideHoverTooltip]
  );

  const selectedTerritoryMunicipalities = useMemo(() => {
    if (!selectedTerritory || !selectedTerritory.id_territorio) return [];
    const terId = Number(selectedTerritory.id_territorio);

    let muns = municipiosDB
      .filter((m) => Number(m.id_territorio) === terId)
      .map((m) => m.nome_municipio);

    if (filtroSemiarido) {
      muns = muns.filter((m) => isMunicipioSemiarido(m));
    }
    return muns.sort();
  }, [selectedTerritory, filtroSemiarido, semiaridoMunicipios]);

  const isTerritoryOnRight = useMemo(() => {
    if (!selectedTerritory) return false;
    const idTer = Number(selectedTerritory.id_territorio);
    const muns = idTer
      ? municipiosDB.filter((m) => Number(m.id_territorio) === idTer)
      : municipiosDB.filter(
          (m) =>
            normalizeName(m.nome_territorio) ===
            normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '')
        );

    if (muns.length === 0) return false;

    let sumLng = 0;
    let count = 0;
    muns.forEach((m) => {
      const munNorm = normalizeName(m.nome_municipio);
      const coords = MUNICIPIOS_COORDS[m.nome_municipio] || MUNICIPIOS_COORDS[munNorm];
      if (coords) {
        sumLng += coords[1];
        count++;
      }
    });

    if (count === 0) return false;
    return sumLng / count > -41.5;
  }, [selectedTerritory]);

  // Enquadramento inicial suave ao montar
  useEffect(() => {
    if (!topologia || !mapRef.current) return;
    const timer = setTimeout(() => {
      if (geoJsonLayerRef.current && mapRef.current && !selectedTerritory) {
        const b = geoJsonLayerRef.current.getBounds();
        if (b.isValid()) {
          mapRef.current.fitBounds(b, { padding: [14, 14], animate: false });
        }
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [topologia]);

  // Zoom focado quando seleciona ou limpa um território
  useEffect(() => {
    if (!mapRef.current || !topologia) return;
    if (selectedTerritory && selectedTerritory.id_territorio) {
      const terId = Number(selectedTerritory.id_territorio);

      const tryZoomToTerritory = () => {
        if (!mapRef.current) return false;
        if (selectedMunLayerRef.current) {
          const b = selectedMunLayerRef.current.getBounds();
          if (b && b.isValid()) {
            mapRef.current.fitBounds(b, { padding: [36, 36], maxZoom: 8.5, duration: 0.65 });
            return true;
          }
        }
        const indexed = layersByTerritory.current[terId];
        if (indexed && indexed.length > 0) {
          const group = L.featureGroup(indexed);
          const b = group.getBounds();
          if (b.isValid()) {
            mapRef.current.fitBounds(b, { padding: [36, 36], maxZoom: 8.5, duration: 0.65 });
            return true;
          }
        }
        return false;
      };

      if (!tryZoomToTerritory()) {
        const t1 = setTimeout(tryZoomToTerritory, 60);
        const t2 = setTimeout(tryZoomToTerritory, 200);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    } else if (geoJsonLayerRef.current) {
      const b = geoJsonLayerRef.current.getBounds();
      if (b.isValid()) {
        mapRef.current.fitBounds(b, { padding: [14, 14], duration: 0.55 });
      }
    }
  }, [selectedTerritory, topologia]);

  // Camada base permanece SEMPRE montada (sem desmontar/recriar ao dar ou tirar zoom)
  const baseLayerData = filtroSemiarido ? mergedSemiData : mergedNormalData;
  const baseLayerKey = filtroSemiarido ? 'base-merged-semi' : 'base-merged-normal';

  // Reseta o índice de layers por território apenas quando o modo Semiárido alterna
  useMemo(() => {
    layersByTerritory.current = {};
  }, [baseLayerKey]);

  const selectedTerritoryMunGeoJson = useMemo(() => {
    if (!selectedTerritory?.id_territorio) return null;
    return municipiosByTerritory[String(selectedTerritory.id_territorio)] || null;
  }, [selectedTerritory, municipiosByTerritory]);

  const municipalitiesToShow = isMunListExpanded
    ? selectedTerritoryMunicipalities
    : selectedTerritoryMunicipalities.slice(0, 4);

  return (
    <div
      ref={mapContainerRef}
      className="tour-map relative isolate w-full h-full min-h-0 flex items-center justify-center bg-surface dark:bg-surface-sunken rounded-card overflow-hidden select-none z-10"
      onTouchStart={() => {
        isTouchInteractionRef.current = true;
        hideHoverTooltip();
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen') {
          isTouchInteractionRef.current = true;
          hideHoverTooltip();
        } else if (e.pointerType === 'mouse') {
          isTouchInteractionRef.current = false;
        }
      }}
      onPointerMove={(e) => {
        if (e.pointerType === 'mouse') {
          isTouchInteractionRef.current = false;
        }
      }}
      onMouseEnter={() => {
        if (mapContainerRef.current) {
          containerRectRef.current = mapContainerRef.current.getBoundingClientRect();
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={hideHoverTooltip}
    >

      {loading || !baseLayerData ? (
        <div className="flex flex-col items-center text-primary-600 relative z-10">
          <svg className="animate-spin h-6 w-6 mb-2 text-primary-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-caption font-medium">Carregando malha territorial...</span>
        </div>
      ) : (
        <MapContainer
          ref={mapRef}
          preferCanvas={true}
          center={[-12.8, -41.2]}
          zoom={5.8}
          minZoom={5.25}
          maxZoom={modoGeografico ? 18 : 10.5}
          zoomSnap={0.5}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={110}
          wheelDebounceTime={40}
          inertia={true}
          inertiaDeceleration={3000}
          maxBounds={[
            [-19.0, -47.5],
            [-7.5, -36.5]
          ]}
          maxBoundsViscosity={0.9}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
          touchZoom={true}
          dragging={true}
          doubleClickZoom={true}
          className="w-full h-full outline-none z-10"
          style={{ background: 'transparent' }}
        >
          <CtrlScrollZoom />
          <MapInteractionTracker
            onZoomChange={setCurrentZoom}
          />

          {modoGeografico && (
            <TileLayer
              key={`pti-geo-tiles-${isDark ? 'dark' : 'light'}`}
              url={
                isDark
                  ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
                  : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
              }
              maxZoom={19}
              minZoom={3}
              keepBuffer={2}
              updateWhenZooming={false}
              updateWhenIdle={true}
              eventHandlers={{
                tileerror: (e) => {
                  const target = e.tile;
                  if (target && !target._retried) {
                    target._retried = true;
                    const currentSrc = target.src;
                    setTimeout(() => {
                      target.src = currentSrc;
                    }, 300);
                  }
                }
              }}
            />
          )}

          <GeoJSON
            key={baseLayerKey}
            ref={geoJsonLayerRef}
            data={baseLayerData}
            style={styleBaseFeature}
            onEachFeature={onEachBaseFeature}
          />

          {/* Malha contínua de divisas municipais (renderizada apenas quando o zoom está aproximado) */}
          {!modoGeografico && !selectedTerritory && isZoomedIn && allMunicipiosMesh && (
            <GeoJSON
              key={`all-mun-mesh-${filtroSemiarido ? 'semi' : 'normal'}-${isDark ? 'dark' : 'light'}`}
              data={allMunicipiosMesh}
              style={{
                color: filtroSemiarido ? (isDark ? getSemanticColors(true).warning : getSemanticColors(false).warningWarm) : isDark ? getSemanticColors(true).slateBorder : getSemanticColors(false).white,
                weight: 0.75,
                opacity: 0.55,
                fill: false,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              interactive={false}
            />
          )}

          {/* Municípios apenas do território selecionado (~15 polígonos em vez de 417) */}
          {!modoGeografico && selectedTerritory && selectedTerritoryMunGeoJson && (
            <GeoJSON
              key={`sel-mun-${selectedTerritory.id_territorio}`}
              ref={selectedMunLayerRef}
              data={selectedTerritoryMunGeoJson}
              style={styleSelectedMunicipio}
              onEachFeature={onEachSelectedMunicipioFeature}
            />
          )}

          {/* Contornos de TODOS os territórios de identidade */}
          {(!selectedTerritory || modoGeografico) && allTerritoryMesh && (
            <GeoJSON
              key={`all-territory-mesh-${filtroSemiarido ? 'semi' : 'normal'}-${isDark ? 'dark' : 'light'}-${modoGeografico ? 'geo' : 'carto'}-${selectedTerritory ? 'sel' : 'all'}`}
              data={allTerritoryMesh}
              style={{
                color: modoGeografico
                  ? (filtroSemiarido ? (isDark ? getSemanticColors(true).warning : getSemanticColors(false).warningWarm) : getSemanticColors(isDark).slateMuted)
                  : (filtroSemiarido ? (isDark ? getSemanticColors(true).warning : getSemanticColors(false).warningWarm) : isDark ? getSemanticColors(true).slateBorder : getSemanticColors(false).white),
                weight: modoGeografico ? 0.75 : (filtroSemiarido ? 1.6 : 1.8),
                opacity: modoGeografico ? (selectedTerritory ? 0.25 : 0.38) : (filtroSemiarido ? 0.7 : isDark ? 0.85 : 0.95),
                fill: false,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              interactive={false}
            />
          )}

          {/* Contorno perimetral externo da Bahia */}
          {!selectedTerritory && stateBoundaryMesh && (
            <GeoJSON
              key={`state-boundary-mesh-${filtroSemiarido ? 'semi' : 'normal'}-${isDark ? 'dark' : 'light'}-${modoGeografico ? 'geo' : 'carto'}`}
              data={stateBoundaryMesh}
              style={{
                color: filtroSemiarido ? getSemanticColors(isDark).warningWarm : isDark ? getSemanticColors(true).slateDeep : (modoGeografico ? getSemanticColors(false).slateMuted : getSemanticColors(false).white),
                weight: modoGeografico ? 1.1 : 2.2,
                opacity: modoGeografico ? 0.45 : 1,
                fill: false,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              interactive={false}
            />
          )}

          {/* Contorno perimetral externo do território selecionado */}
          {selectedTerritory && territoryMeshes[selectedTerritory.id_territorio] && (
            <GeoJSON
              key={`selected-mesh-${selectedTerritory.id_territorio}-${filtroSemiarido ? '1' : '0'}-${modoGeografico ? 'geo' : 'carto'}`}
              data={territoryMeshes[selectedTerritory.id_territorio]}
              style={{
                color: filtroSemiarido ? getSemanticColors(isDark).warningWarm : isDark ? getSemanticColors(true).primaryLight : (modoGeografico ? getSemanticColors(false).primaryBase : getSemanticColors(false).primaryNavy),
                weight: modoGeografico ? 1.35 : 3.0,
                opacity: modoGeografico ? 0.75 : 1,
                fill: false,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              interactive={false}
            />
          )}
        </MapContainer>
      )}

      {/* ================= BREADCRUMB DE NAVEGAÇÃO (CANTO SUPERIOR ESQUERDO) ================= */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2 pointer-events-none select-none max-w-[calc(100%-220px)]">
        <div className="pointer-events-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-sm text-xs">
          <button
            type="button"
            onClick={() => {
              onSelectTerritory(null);
              if (geoJsonLayerRef.current) {
                const b = geoJsonLayerRef.current.getBounds();
                if (b.isValid()) {
                  mapRef.current?.fitBounds(b, { padding: [14, 14], duration: 0.45 });
                  return;
                }
              }
              mapRef.current?.flyTo([-12.8, -41.2], 5.8, { duration: 0.45 });
            }}
            className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
              selectedTerritory
                ? 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                : 'text-zinc-900 dark:text-zinc-100'
            }`}
            title="Enquadrar toda a Bahia"
          >
            <Layers size={13} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />
            <span>Bahia</span>
          </button>

          {selectedTerritory ? (
            <>
              <ChevronRight size={12} className="text-zinc-400 shrink-0" />
              <span
                className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]"
                title={selectedTerritory.nome_territorio || selectedTerritory.territorio}
              >
                {selectedTerritory.nome_territorio || selectedTerritory.territorio}
              </span>
              <button
                type="button"
                onClick={() => onSelectTerritory(null)}
                aria-label="Voltar para visão da Bahia"
                title="Voltar para toda a Bahia (Esc)"
                className="ml-0.5 w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              >
                <X size={12} strokeWidth={2.25} />
              </button>
            </>
          ) : (
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal pl-0.5 hidden sm:inline">
              · {currentZoom >= 7.0 ? 'Divisas Municipais' : '27 Territórios'}
            </span>
          )}
        </div>

        {/* LISTA COMPACTA DE MUNICÍPIOS DO TERRITÓRIO SELECIONADO */}
        {selectedTerritory && selectedTerritoryMunicipalities.length > 0 && (
          <div className="pointer-events-auto w-56 max-h-[240px] overflow-y-auto hide-scroll p-3 rounded-xl border bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800 shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-zinc-200/70 dark:border-zinc-800/70">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 tabular-nums">
                {selectedTerritoryMunicipalities.length} Municípios
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedMunLayerRef.current) {
                    const b = selectedMunLayerRef.current.getBounds();
                    if (b && b.isValid()) {
                      mapRef.current?.fitBounds(b, { padding: [36, 36], maxZoom: 8.5, duration: 0.45 });
                    }
                  }
                }}
                className="text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                title="Centralizar território"
              >
                Enquadrar
              </button>
            </div>
            <ul className="flex flex-col gap-0.5">
              {municipalitiesToShow.map((m, idx) => (
                <li
                  key={idx}
                  className="text-xs font-medium flex items-center justify-between gap-2 text-zinc-700 dark:text-zinc-300 py-1 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 rounded-md px-1.5 cursor-default transition-colors"
                >
                  <span className="truncate">{m}</span>
                </li>
              ))}
            </ul>
            {selectedTerritoryMunicipalities.length > 4 && (
              <button
                type="button"
                onClick={() => setIsMunListExpanded(!isMunListExpanded)}
                className="w-full mt-2 text-center text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white py-1 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 transition-colors cursor-pointer tabular-nums"
              >
                {isMunListExpanded ? 'Ver menos' : `Ver todos (${selectedTerritoryMunicipalities.length})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ================= BARRA DE CAMADAS (CANTO SUPERIOR DIREITO) ================= */}
      {!hideLayerControls && (
        <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleModoGeografico}
            title={
              modoGeografico
                ? 'Voltar para malha cartográfica dos Territórios'
                : 'Alternar para mapa geográfico com ruas e relevo'
            }
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer border select-none backdrop-blur-md active:scale-[0.99] ${
              modoGeografico
                ? filtroSemiarido
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs'
                : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 shadow-sm'
            }`}
          >
            <Globe size={13} strokeWidth={2} />
            <span className="truncate">Geográfico</span>
          </button>

          {Boolean(onToggleSemiarido) && (
            <button
              type="button"
              onClick={() => onToggleSemiarido && onToggleSemiarido(!filtroSemiarido)}
              title={filtroSemiarido ? 'Voltar ao Modo Normal (27 Territórios)' : 'Filtrar municípios do Semiárido'}
              className={`tour-toggle-semiarido inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer border select-none backdrop-blur-md active:scale-[0.99] ${
                filtroSemiarido
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30'
                  : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 shadow-sm'
              }`}
            >
              <span className="truncate">Semiárido</span>
            </button>
          )}
        </div>
      )}

      {/* ================= CONTROLES DE ZOOM E ENQUADRAMENTO (CANTO INFERIOR DIREITO) ================= */}
      <div className="absolute bottom-3 right-3 z-[400] flex flex-col items-end gap-1.5">
        {(selectedTerritory || Math.abs(currentZoom - 5.8) > 0.35) && (
          <button
            type="button"
            onClick={() => {
              onSelectTerritory(null);
              if (geoJsonLayerRef.current) {
                const b = geoJsonLayerRef.current.getBounds();
                if (b.isValid()) {
                  mapRef.current?.fitBounds(b, { padding: [14, 14], duration: 0.45 });
                  return;
                }
              }
              mapRef.current?.flyTo([-12.8, -41.2], 5.8, { duration: 0.45 });
            }}
            aria-label="Enquadrar toda a Bahia"
            title="Enquadrar toda a Bahia"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-sm text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all duration-150 ease-out active:scale-[0.99] cursor-pointer touch-manipulation"
          >
            {selectedTerritory ? <RotateCcw size={15} /> : <Maximize2 size={15} />}
          </button>
        )}

        <div className="flex flex-col bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-full border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn(0.5)}
            disabled={currentZoom >= (modoGeografico ? 18 : 10.5)}
            aria-label="Aproximar mapa"
            className="w-10 h-9 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-all duration-150 ease-out active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none cursor-pointer touch-manipulation"
            title="Aproximar"
          >
            <span className="text-base font-medium leading-none">+</span>
          </button>

          <div
            className="px-1.5 py-1 border-y border-zinc-200/70 dark:border-zinc-800/80 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 text-center tabular-nums select-none"
            title="Nível de zoom atual"
          >
            {Math.max(1, (currentZoom / 5.8)).toFixed(1)}x
          </div>

          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut(0.5)}
            disabled={currentZoom <= (modoGeografico ? 4.5 : 5.25)}
            aria-label="Afastar mapa"
            className="w-10 h-9 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-all duration-150 ease-out active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none cursor-pointer touch-manipulation"
            title="Afastar"
          >
            <span className="text-base font-medium leading-none">−</span>
          </button>
        </div>
      </div>

      {/* ================= TOOLTIP FLUTUANTE (ZERO RE-RENDERS NO HOVER E MOUSEMOVE) ================= */}
      <div
        ref={tooltipDomRef}
        className="absolute top-0 left-0 z-[1000] overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-md pointer-events-none transition-opacity duration-75"
        style={{ width: 244, opacity: 0, transform: 'translate3d(0px, 0px, 0)' }}
      >
        <div
          ref={tooltipAccentRef}
          className="h-1 w-full"
          style={{ backgroundColor: 'rgb(var(--color-primary-600))' }}
        />
        <div className="p-3">
          <div className="flex flex-col mb-2.5">
            <span
              ref={tooltipMunRef}
              className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-0.5 truncate"
              style={{ display: 'none' }}
            />
            <h2
              ref={tooltipTitleRef}
              className="font-semibold text-sm text-zinc-950 dark:text-zinc-50 leading-snug truncate"
            >
              Território
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
                Ativos CT&I
              </span>
              <span
                ref={tooltipAtivosRef}
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums"
              >
                0
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
                Média IFDM
              </span>
              <span
                ref={tooltipIfdmRef}
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums"
              >
                0.000
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
