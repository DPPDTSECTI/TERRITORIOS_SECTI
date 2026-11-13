import React, { useRef, useEffect, useState, useMemo, useContext, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, Polyline, Tooltip, Pane } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Layers, Network, Expand, Shrink, Flame, Globe, Maximize2, RotateCcw, ChevronRight, X } from 'lucide-react';
import { DataContext } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { isMunicipioSemiarido } from '../../constants/semiarido';
import { getCachedBahiaTopologia, loadBahiaTopologia } from './bahiaTopologiaCache';

// Buffer leve (25% além da tela) para alta performance sem sobrecarregar a GPU
if (typeof L !== 'undefined' && L.Renderer) {
  L.Renderer.prototype.options.padding = 0.25;
  if (L.SVG) L.SVG.prototype.options.padding = 0.25;
  if (L.Canvas) {
    L.Canvas.prototype.options.padding = 0.25;
    L.Canvas.prototype.options.tolerance = 1.5;
  }
}

import {
  SEMIARIDO_TERRITORY_IDS,
  normalizeName,
  buildMunicipioTerritoryMap,
  findMunicipioCoords,
  isInsideBahia
} from './side/mapGeoUtils';

import { useMapTheme } from './mapTheme';
import CtrlScrollZoom from './CtrlScrollZoom';
import { getSemanticColors, LIGHT_CHART_PALETTE, DARK_CHART_PALETTE } from '../graph/chartTheme';
import {
  HEAT_LEVELS,
  SEMIARIDO_HEAT_LEVELS,
  getHeatColor,
  getRelativeHeatColor,
  getDynamicHeatLevels
} from './side/mapHeatScale';

import {
  getSemiaridoPointColor,
  createPartnerPinIcon,
  createSelectedPartnerPinIcon
} from './side/mapIcons';

import {
   fitMapToBahia,
  MapPaneManager,
  MapClickHandler,
  TerritoryFocusController,
  CadeiaFocusController,
  ConnectionsFocusController,
  ChangeMapView,
  MapResizeHandler,
  MapZoomWatcher
} from './side/MapControllers';

import {
  SuperclusteredMarkers
} from './side/MapMarkersAndPopups';

export {
  findMunicipioCoords,
  isInsideBahia,
  getSemiaridoPointColor,
  HEAT_LEVELS,
  SEMIARIDO_HEAT_LEVELS,
  getHeatColor,
  getRelativeHeatColor,
  getDynamicHeatLevels
};

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
  selectedTipo = null,
  onSelectTipo = () => { },
  selectedTipos = [],
  onSelectTipos = () => { },
  selectedCategory = null,
  onSelectCategory = () => { },
  onAssetClick = () => { },
  isExpanded = false,
  onToggleExpand = null,
  filtroSemiarido: propFiltroSemiarido,
  getSegmentColor = null,
  hideLayerControls = false
}) {
  const {
    filtroSemiarido: contextFiltroSemiarido,
    setFiltroSemiarido,
    modoGeografico: contextModoGeo,
    setModoGeografico: setContextModoGeo
  } = useContext(DataContext) || {};
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
    const targetMaxZoom = modoGeografico ? 18 : 11;
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

  const filtroSemiarido = propFiltroSemiarido !== undefined ? Boolean(propFiltroSemiarido) : Boolean(contextFiltroSemiarido);
  const { isDark } = useTheme();
  const mapPalette = useMapTheme(filtroSemiarido);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const containerRectRef = useRef(null);
  const territoriosLayerRef = useRef(null);
  const municipiosLayerRef = useRef(null);
  const tooltipDomRef = useRef(null);
  const tooltipTypeRef = useRef(null);
  const tooltipLabelRef = useRef(null);
  const tooltipSubRef = useRef(null);
  const tooltipCountRef = useRef(null);
  const isTooltipVisibleRef = useRef(false);
  const isTouchInteractionRef = useRef(false);

  const [topologia, setTopologia] = useState(() => getCachedBahiaTopologia());
  const [pinnedAssetId, setPinnedAssetId] = useState(null);
  const [isLayerControlOpen, setIsLayerControlOpen] = useState(false);
  const [showAllConnections, setShowAllConnections] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(6);
  const [viewportBounds, setViewportBounds] = useState(null);

  const territoriosGeoJson = topologia?.mergedNormalData || null;
  const municipiosByTerritory = topologia?.municipiosByTerritory || {};
  const territoryMeshes = topologia?.territoryMeshes || {};
  const allTerritoryMesh = topologia?.allTerritoryMesh || null;
  const stateBoundaryMesh = topologia?.stateBoundaryMesh || null;

  useEffect(() => {
    if (topologia) return;
    let active = true;
    loadBahiaTopologia()
      .then((data) => {
        if (active) setTopologia(data);
      })
      .catch((err) => console.error('Erro ao carregar topologia:', err));
    return () => {
      active = false;
    };
  }, [topologia]);

  // Atalho Escape para fechar modo expandido ou limpar seleção de território
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isExpanded && onToggleExpand) {
          onToggleExpand();
        } else if (selectedTerritory) {
          onSelectTerritory(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, onToggleExpand, selectedTerritory, onSelectTerritory]);

  useEffect(() => {
    if (focusedAsset) {
      if (focusedAsset.id != null) setPinnedAssetId(focusedAsset.id);
    }
  }, [focusedAsset]);

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
          corHex: a.corHex || getSemanticColors().primaryBase,
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
    const colors = isDark ? DARK_CHART_PALETTE : LIGHT_CHART_PALETTE;
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
  }, [cursosData, mode, isDark]);

  const allCadeiasCategories = useMemo(() => {
    if (mode !== 'cadeias') return [];
    const semantic = getSemanticColors();
    const map = {};
    const colors = {
      'APL': semantic.primaryBase,
      'IG': semantic.success,
      'IG POTENCIAL': semantic.warning
    };

    cadeiasData.forEach((c) => {
      const tipo = c.tipo || 'APL';
      if (!map[tipo]) {
        map[tipo] = {
          key: tipo,
          label: tipo === 'APL' ? 'APL' : tipo === 'IG' ? 'IG' : tipo,
          corHex: colors[tipo] || semantic.indigo,
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

    if (selectedTipos && selectedTipos.length > 0 && !selectedTipos.includes('todos')) {
      list = list.filter((a) => selectedTipos.includes(a.tipo) || selectedTipos.includes(a.shortTipo));
    } else if (selectedTipo && selectedTipo !== 'todos') {
      list = list.filter((a) => a.tipo === selectedTipo || a.shortTipo === selectedTipo);
    }

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
  }, [processedAtivos, activeCategoryKeys, selectedTerritory, selectedTipo, selectedTipos, mode]);

  const visibleCursos = useMemo(() => {
    if (mode !== 'cursos') return [];
    let list = cursosData;
    if (selectedCategory && selectedCategory !== 'todas') {
      list = list.filter((c) => (c.categoria || c.tipo) === selectedCategory);
    }
    if (selectedTerritory) {
      const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
      const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio || '');
      list = list.filter((c) => {
        if (tid && String(c.id_territorio) === tid) return true;
        if (tNorm && normalizeName(c.territorio_identidade || c.territorio || '') === tNorm) return true;
        return false;
      });
    }
    return list.filter((c) => activeCategoryKeys.has(c.categoria || 'Outras Áreas'));
  }, [cursosData, activeCategoryKeys, selectedCategory, selectedTerritory, mode]);

  const visibleCursosGeoMarkers = useMemo(() => {
    if (mode !== 'cursos' || !modoGeografico) return [];
    return visibleCursos
      .map((c, idx) => {
        let lat = c.lat ? Number(c.lat) : null;
        let lng = c.lng ? Number(c.lng) : null;
        if (!isInsideBahia(lat, lng)) {
          const coords = findMunicipioCoords(c.municipio);
          if (coords) {
            lat = coords[0];
            lng = coords[1];
          }
        }
        if (!isInsideBahia(lat, lng)) return null;
        return {
          ...c,
          id: c.id_curso || c.id || `curso-${idx}`,
          nome: c.nome_curso || c.curso || c.nome || 'Curso Superior / Técnico',
          tipo: c.categoria || 'Curso CT&I',
          shortTipo: c.ies ? `${c.ies} · ${c.categoria || 'Curso'}` : (c.categoria || 'Curso'),
          territorio: c.territorio_identidade || c.territorio,
          corHex: getSemanticColors().primaryBase,
          corHexDark: getSemanticColors(true).primaryLight,
          lat,
          lng
        };
      })
      .filter(Boolean);
  }, [mode, modoGeografico, visibleCursos]);

  const visibleCadeias = useMemo(() => {
    if (mode !== 'cadeias') return [];
    let list = cadeiasData.filter((c) => activeCategoryKeys.has(c.tipo || 'APL'));

    if (selectedSegmento) {
      list = list.filter((c) => c.segmento === selectedSegmento);
    }

    if (selectedTipo && selectedTipo !== 'todos') {
      list = list.filter((c) => c.tipo === selectedTipo || c.shortTipo === selectedTipo);
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
  }, [cadeiasData, activeCategoryKeys, selectedSegmento, selectedTipo, selectedTerritory, mode]);

  // Linhas de conexão curvadas (Arcos Bézier suaves para evitar sobreposição confusa)
  const buildCurvedArc = useCallback((origin, dest) => {
    const [lat1, lng1] = origin;
    const [lat2, lng2] = dest;
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    // Curvatura perpendicular suave (15%)
    const ctrlLat = midLat - dLng * 0.15;
    const ctrlLng = midLng + dLat * 0.15;

    const steps = 10;
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const inv = 1 - t;
      const lat = inv * inv * lat1 + 2 * inv * t * ctrlLat + t * t * lat2;
      const lng = inv * inv * lng1 + 2 * inv * t * ctrlLng + t * t * lng2;
      points.push([lat, lng]);
    }
    return points;
  }, []);

  const activeFocusCadeia = selectedCadeia;

  const connectionLines = useMemo(() => {
    if (mode !== 'cadeias') return [];
    const lines = [];

    // 1. Quando há uma Cadeia selecionada ou em hover: exibe APENAS a teia limpa dessa cadeia
    if (activeFocusCadeia) {
      let cLat = Number(activeFocusCadeia.lat);
      let cLng = Number(activeFocusCadeia.lng);
      if (!isInsideBahia(cLat, cLng)) {
        const fallback = findMunicipioCoords(
          activeFocusCadeia.municipio || activeFocusCadeia.municipio_sede || activeFocusCadeia.sede
        );
        if (fallback) {
          cLat = fallback[0];
          cLng = fallback[1];
        }
      }
      if (!isInsideBahia(cLat, cLng)) return [];

      const origin = [cLat, cLng];
      const semantic = getSemanticColors(isDark);
      const lineColor =
        (getSegmentColor && activeFocusCadeia.segmento
          ? getSegmentColor(activeFocusCadeia.segmento)
          : activeFocusCadeia.corHex) || (filtroSemiarido ? semantic.warningDeep : semantic.primaryBase);

      (activeFocusCadeia.municipios_cobertos || []).forEach((mun) => {
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
              positions: buildCurvedArc(origin, [mLat, mLng]),
              destPosition: [mLat, mLng],
              municipio: mun.nome_municipio,
              territorio: mun.nome_territorio,
              cadeiaNome: activeFocusCadeia.nome || activeFocusCadeia.cadeia_produtiva,
              color: lineColor,
              isSelected: true
            });
          }
        }
      });

      return lines;
    }

    // 2. Quando "Conexões" (showAllConnections) está ativo sem cadeia focada: exibe arcos sutis por segmento
    if (showAllConnections) {
      const targetCadeias = visibleCadeias.filter((c) => c.lat && c.lng);

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
        const semantic = getSemanticColors(isDark);
        const lineColor =
          (getSegmentColor && c.segmento ? getSegmentColor(c.segmento) : c.corHex) ||
          (filtroSemiarido ? semantic.warning : semantic.primarySoft);

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
                positions: buildCurvedArc(origin, [mLat, mLng]),
                destPosition: [mLat, mLng],
                municipio: mun.nome_municipio,
                territorio: mun.nome_territorio,
                cadeiaNome: c.nome || c.cadeia_produtiva,
                color: lineColor,
                isSelected: false
              });
            }
          }
        });
      });

      return lines;
    }

    return [];
  }, [mode, showAllConnections, visibleCadeias, activeFocusCadeia, buildCurvedArc, getSegmentColor, filtroSemiarido]);

  // Exibe marcadores e legendas dos municípios atendidos APENAS quando uma cadeia está selecionada
  const uniquePartnerMunicipios = useMemo(() => {
    if (mode !== 'cadeias' || !selectedCadeia || connectionLines.length === 0) return [];

    const mapMuns = new Map();
    connectionLines.forEach((line) => {
      if (!line.isSelected) return;
      const key = normalizeName(line.municipio);
      if (!mapMuns.has(key)) {
        mapMuns.set(key, {
          position: line.destPosition || line.positions[line.positions.length - 1],
          municipio: line.municipio,
          territorio: line.territorio,
          count: 1,
          isSelected: true
        });
      } else {
        const existing = mapMuns.get(key);
        existing.count += 1;
      }
    });

    return Array.from(mapMuns.values());
  }, [mode, selectedCadeia, connectionLines]);

  // Filtra apenas os municípios vinculados que estão enquadrados dentro da área visível da tela (viewportBounds)
  const framedPartnerMunicipios = useMemo(() => {
    if (mode !== 'cadeias' || !selectedCadeia || uniquePartnerMunicipios.length === 0) return [];
    if (!viewportBounds) return uniquePartnerMunicipios;

    return uniquePartnerMunicipios.filter((p) => {
      const [lat, lng] = p.position || [];
      if (lat == null || lng == null) return false;
      return (
        lat >= viewportBounds.south &&
        lat <= viewportBounds.north &&
        lng >= viewportBounds.west &&
        lng <= viewportBounds.east
      );
    });
  }, [mode, selectedCadeia, uniquePartnerMunicipios, viewportBounds]);

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

  const baseAtivosForStats = useMemo(() => {
    if (mode !== 'ativos') return [];
    let list = processedAtivos.filter((a) => activeCategoryKeys.has(a.tipo || 'Outros'));
    if (selectedTipos && selectedTipos.length > 0 && !selectedTipos.includes('todos')) {
      list = list.filter((a) => selectedTipos.includes(a.tipo) || selectedTipos.includes(a.shortTipo));
    } else if (selectedTipo && selectedTipo !== 'todos') {
      list = list.filter((a) => a.tipo === selectedTipo || a.shortTipo === selectedTipo);
    }
    return list;
  }, [processedAtivos, activeCategoryKeys, selectedTipo, selectedTipos, mode]);

  const ativosStatsByTerritory = useMemo(() => {
    if (mode !== 'ativos') return {};
    const stats = {};
    baseAtivosForStats.forEach((a) => {
      const rawTerr = (a.territorio || a.territorio_identidade || '').replace(/^Território de Identidade\s+/i, '').trim();
      const tid = a.id_territorio ? String(a.id_territorio) : null;

      const keysToRegister = [];
      if (rawTerr) keysToRegister.push(normalizeName(rawTerr));
      if (tid) keysToRegister.push(`id_${tid}`);

      keysToRegister.forEach(k => {
        if (!stats[k]) {
          stats[k] = { count: 0, nome: rawTerr };
        }
        stats[k].count += 1;
      });
    });
    return stats;
  }, [baseAtivosForStats, mode]);

  const ativosStatsByMunicipio = useMemo(() => {
    if (mode !== 'ativos') return {};
    const stats = {};
    baseAtivosForStats.forEach((a) => {
      const munNorm = normalizeName(a.municipio || '');
      if (munNorm) {
        if (!stats[munNorm]) {
          stats[munNorm] = { count: 0, nome: a.municipio };
        }
        stats[munNorm].count += 1;
      }
    });
    return stats;
  }, [baseAtivosForStats, mode]);

  const baseCadeiasForStats = useMemo(() => {
    if (mode !== 'cadeias') return [];
    let list = (cadeiasData && cadeiasData.length > 0 ? cadeiasData : processedAtivos)
      .filter((c) => activeCategoryKeys.has(c.tipo || 'APL'));

    if (selectedSegmento) {
      list = list.filter((c) => c.segmento === selectedSegmento);
    }
    if (selectedTipo && selectedTipo !== 'todos') {
      list = list.filter((c) => c.tipo === selectedTipo || c.shortTipo === selectedTipo);
    }
    return list;
  }, [cadeiasData, processedAtivos, activeCategoryKeys, selectedSegmento, selectedTipo, mode]);

  const cadeiasStatsByTerritory = useMemo(() => {
    if (mode !== 'cadeias') return {};
    const stats = {};

    baseCadeiasForStats.forEach((c) => {
      const rawTerr = (c.territorio_identidade || c.territorio_sede || c.territorio || '').replace(/^Território de Identidade\s+/i, '').trim();
      const tid = c.id_territorio ? String(c.id_territorio) : null;

      const terrKeys = new Set();
      if (rawTerr) terrKeys.add(normalizeName(rawTerr));
      if (tid) terrKeys.add(`id_${tid}`);

      if (Array.isArray(c.municipios_cobertos)) {
        c.municipios_cobertos.forEach(m => {
          if (m.nome_territorio) terrKeys.add(normalizeName(m.nome_territorio.replace(/^Território de Identidade\s+/i, '').trim()));
          if (m.id_territorio) terrKeys.add(`id_${m.id_territorio}`);
        });
      }

      terrKeys.forEach(k => {
        if (!stats[k]) {
          stats[k] = { count: 0, nome: rawTerr };
        }
        stats[k].count += 1;
      });
    });
    return stats;
  }, [baseCadeiasForStats, mode]);

  const cadeiasStatsByMunicipio = useMemo(() => {
    if (mode !== 'cadeias') return {};
    const stats = {};

    baseCadeiasForStats.forEach((c) => {
      const munKeys = new Set();
      const munSede = normalizeName(c.municipio_sede || c.municipio || '');
      if (munSede) munKeys.add(munSede);

      if (Array.isArray(c.municipios_cobertos)) {
        c.municipios_cobertos.forEach(m => {
          const mNorm = normalizeName(m.nome_municipio || m.municipio || '');
          if (mNorm) munKeys.add(mNorm);
        });
      }

      munKeys.forEach(m => {
        if (!stats[m]) stats[m] = { count: 0 };
        stats[m].count += 1;
      });
    });
    return stats;
  }, [baseCadeiasForStats, mode]);

  const updateTooltipPosition = useCallback((clientX, clientY) => {
    if (!tooltipDomRef.current) return;
    const rect = containerRectRef.current || mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tooltipWidth = 220;
    const tooltipHeight = 82;
    const offset = 14;

    let x = clientX - rect.left + offset;
    let y = clientY - rect.top + offset;

    if (x + tooltipWidth > rect.width - 8) x = clientX - rect.left - tooltipWidth - offset;
    if (y + tooltipHeight > rect.height - 8) y = clientY - rect.top - tooltipHeight - offset;
    if (x < 8) x = 8;
    if (y < 8) y = 8;

    tooltipDomRef.current.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  }, []);

  const showHoverTooltip = useCallback(
    (featureName, featureId, isMunicipio, clientX, clientY) => {
      if (isTouchInteractionRef.current) return;
      if (!featureName) return;
      const norm = normalizeName(featureName);
      const {
        mode: curMode,
        cursosStatsByMunicipio: cMun,
        cursosStatsByTerritory: cTer,
        ativosStatsByMunicipio: aMun,
        ativosStatsByTerritory: aTer,
        cadeiasStatsByMunicipio: cadMun,
        cadeiasStatsByTerritory: cadTer
      } = styleRefs.current;

      let count = 0;
      let unitSingular = 'item';
      let unitPlural = 'itens';

      if (curMode === 'cursos') {
        unitSingular = 'curso';
        unitPlural = 'cursos';
        const stat = isMunicipio
          ? cMun[norm]
          : (featureId ? cTer[`id_${featureId}`] : null) || cTer[norm];
        count = stat ? stat.count : 0;
      } else if (curMode === 'ativos') {
        unitSingular = 'ativo';
        unitPlural = 'ativos';
        const stat = isMunicipio
          ? aMun[norm]
          : (featureId ? aTer[`id_${featureId}`] : null) || aTer[norm];
        count = stat ? stat.count : 0;
      } else if (curMode === 'cadeias') {
        unitSingular = 'cadeia';
        unitPlural = 'cadeias';
        const stat = isMunicipio
          ? cadMun[norm]
          : (featureId ? cadTer[`id_${featureId}`] : null) || cadTer[norm];
        count = stat ? stat.count : 0;
      }

      if (tooltipTypeRef.current) {
        tooltipTypeRef.current.textContent = isMunicipio ? 'Município' : 'Território de Identidade';
      }
      if (tooltipLabelRef.current) {
        tooltipLabelRef.current.textContent = featureName;
      }
      if (tooltipSubRef.current) {
        tooltipSubRef.current.textContent = `Total ${isMunicipio ? 'no município' : 'no território'}`;
      }
      if (tooltipCountRef.current) {
        tooltipCountRef.current.textContent = `${count} ${count === 1 ? unitSingular : unitPlural}`;
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

  // 1. Estilização dos Territórios de Identidade (Sem re-render no hover)
  const territoryBorderStyle = (feature) => {
    const rawNome = feature?.properties?.nome_territorio || '';
    const nome = rawNome.replace(/^Território de Identidade\s+/i, '').trim();
    const idTerr = feature?.properties?.id_territorio;
    const norm = normalizeName(nome);
    const isTerrSemiarido = SEMIARIDO_TERRITORY_IDS.has(String(idTerr));

    const isSelected = selectedTerritory && (
      (selectedTerritory.id_territorio && String(selectedTerritory.id_territorio) === String(idTerr)) ||
      normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio) === norm
    );

    const semantic = getSemanticColors(isDark);

    if (modoGeografico) {
      if (filtroSemiarido && !isTerrSemiarido) {
        return {
          fillColor: 'rgb(0, 0, 0)',
          fillOpacity: 0,
          stroke: false,
          weight: 0,
          opacity: 0,
          className: 'outline-none pointer-events-none'
        };
      }

      if (selectedTerritory) {
        if (isSelected) {
          return {
            fillColor: filtroSemiarido ? semantic.warning : semantic.primarySoft,
            fillOpacity: 0.04,
            stroke: false,
            weight: 0,
            opacity: 0,
            className: 'outline-none cursor-pointer'
          };
        }
        return {
          fillColor: 'rgb(0, 0, 0)',
          fillOpacity: 0.002,
          stroke: false,
          weight: 0,
          opacity: 0,
          className: 'outline-none cursor-pointer'
        };
      }

      return {
        fillColor: 'rgb(0, 0, 0)',
        fillOpacity: 0.002,
        stroke: false,
        weight: 0,
        opacity: 0,
        className: 'cursor-pointer outline-none'
      };
    }

    if (mode === 'cursos') {
      const tStat = cursosStatsByTerritory[`id_${idTerr}`] || cursosStatsByTerritory[norm];
      const count = tStat ? tStat.count : 0;
      const heatColor = getHeatColor(count, filtroSemiarido, isDark);

      if (filtroSemiarido && !isTerrSemiarido) {
        return {
          fillColor: mapPalette.choropleth.zero,
          fillOpacity: 0.35,
          color: mapPalette.stroke.default,
          weight: 0.8,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'outline-none pointer-events-none'
        };
      }

      if (selectedTerritory) {
        if (isSelected) {
          return {
            fillColor: 'transparent',
            fillOpacity: 0,
            color: mapPalette.stroke.selected,
            weight: 2.2,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'outline-none pointer-events-none'
          };
        }
        return {
          fillColor: isDark ? semantic.slateSurface : semantic.slateBorder,
          fillOpacity: isDark ? 0.40 : 0.55,
          color: mapPalette.stroke.default,
          weight: 0.8,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'outline-none cursor-pointer'
        };
      }

      return {
        fillColor: heatColor,
        fillOpacity: 0.92,
        color: mapPalette.stroke.default,
        weight: 1.1,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'cursor-pointer outline-none'
      };
    }

    // mode !== 'cursos' (Ativos ou Cadeias)
    if (filtroSemiarido && !isTerrSemiarido) {
      return {
        fillColor: mapPalette.choropleth.zero,
        fillOpacity: 0.35,
        color: mapPalette.stroke.default,
        weight: 0.8,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'outline-none pointer-events-none'
      };
    }

    if (selectedTerritory) {
      if (isSelected) {
        return {
          fillColor: filtroSemiarido ? (isDark ? 'rgba(120, 53, 15, 0.25)' : semantic.warningTint) : (isDark ? 'rgba(30, 58, 138, 0.3)' : semantic.primarySurface),
          fillOpacity: 1,
          color: mapPalette.stroke.selected,
          weight: 2.2,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'outline-none cursor-pointer'
        };
      }
      return {
        fillColor: isDark ? semantic.surface : semantic.slateSurface,
        fillOpacity: isDark ? 0.70 : 0.85,
        color: isDark ? semantic.border : semantic.border,
        weight: 0.8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'outline-none cursor-pointer'
      };
    }

    return {
      fillColor: filtroSemiarido ? (isDark ? semantic.surface : semantic.warningSurface) : (isDark ? semantic.surface : semantic.white),
      fillOpacity: 1,
      color: filtroSemiarido ? (isDark ? semantic.warningWarm : semantic.warning) : (isDark ? semantic.borderStrong : semantic.slateBorder),
      weight: 0.9,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'cursor-pointer outline-none'
    };
  };

  // 2. Estilização dos Municípios com Escala Logarítmica (Sem re-render no hover)
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

    const semantic = getSemanticColors(isDark);

    if (!isInsideSelectedTerritory) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        weight: 0,
        opacity: 0,
        stroke: false
      };
    }

    if (filtroSemiarido && !isMunicipioSemiarido(munNome)) {
      return {
        fillColor: semantic.border,
        fillOpacity: 0.35,
        color: semantic.slateBorder,
        weight: 0.6,
        opacity: 0.8,
        stroke: true
      };
    }

    if (mode !== 'cursos') {
      const munStat = mode === 'ativos' ? ativosStatsByMunicipio[munNorm] : cadeiasStatsByMunicipio[munNorm];
      const count = munStat ? munStat.count : 0;
      return {
        fillColor: count > 0 ? (filtroSemiarido ? semantic.warningSurface : semantic.primarySurface) : 'transparent',
        fillOpacity: count > 0 ? 0.4 : 0,
        color: count > 0 ? (filtroSemiarido ? `${semantic.warningDeep}80` : semantic.infoCyan) : (isDark ? semantic.borderStrong : semantic.slateBorder),
        weight: 0.8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'cursor-pointer outline-none'
      };
    }

    const munStat = cursosStatsByMunicipio[munNorm];
    const count = munStat ? munStat.count : 0;
    const relativeHeatColor = getRelativeHeatColor(count, maxCursosNoTerritorioSelecionado, filtroSemiarido, isDark);

    return {
      fillColor: relativeHeatColor,
      fillOpacity: 0.95,
      color: isDark ? mapPalette.stroke.default : semantic.white,
      weight: 1.2,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'cursor-pointer outline-none'
    };
  };

  const geoJsonLayersByTerritoryRef = useRef({});
  const styleRefs = useRef({
    territoryBorderStyle,
    municipioBorderStyle,
    mode,
    modoGeografico,
    selectedTerritory,
    selectedCadeia,
    filtroSemiarido,
    isDark,
    mapPalette,
    onSelectTerritory,
    cursosStatsByMunicipio,
    cursosStatsByTerritory,
    ativosStatsByMunicipio,
    ativosStatsByTerritory,
    cadeiasStatsByMunicipio,
    cadeiasStatsByTerritory
  });
  useEffect(() => {
    styleRefs.current = {
      territoryBorderStyle,
      municipioBorderStyle,
      mode,
      modoGeografico,
      selectedTerritory,
      selectedCadeia,
      filtroSemiarido,
      isDark,
      mapPalette,
      onSelectTerritory,
      cursosStatsByMunicipio,
      cursosStatsByTerritory,
      ativosStatsByMunicipio,
      ativosStatsByTerritory,
      cadeiasStatsByMunicipio,
      cadeiasStatsByTerritory
    };
  });

  useEffect(() => {
    if (territoriosLayerRef.current) {
      territoriosLayerRef.current.setStyle((feature) => styleRefs.current.territoryBorderStyle(feature));
    }
  }, [
    mode,
    modoGeografico,
    filtroSemiarido,
    isDark,
    selectedTerritory,
    cursosStatsByTerritory,
    ativosStatsByTerritory,
    cadeiasStatsByTerritory
  ]);

  useEffect(() => {
    if (municipiosLayerRef.current) {
      municipiosLayerRef.current.setStyle((feature) => styleRefs.current.municipioBorderStyle(feature));
    }
  }, [
    mode,
    filtroSemiarido,
    isDark,
    selectedTerritory,
    cursosStatsByMunicipio,
    ativosStatsByMunicipio,
    cadeiasStatsByMunicipio,
    maxCursosNoTerritorioSelecionado
  ]);

  const selectedTerritoryMunicipiosGeoJson = useMemo(() => {
    if (!selectedTerritory) return null;
    const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
    if (tid && municipiosByTerritory[tid]) return municipiosByTerritory[tid];

    const rawNome = selectedTerritory.nome_territorio || selectedTerritory.territorio || '';
    const cleanNome = rawNome.replace(/^Território de Identidade\s+/i, '').trim();
    const norm = normalizeName(cleanNome);
    if (norm && municipiosByTerritory[norm]) return municipiosByTerritory[norm];

    return topologia?.municipiosGeoJson || null;
  }, [selectedTerritory, municipiosByTerritory, topologia]);

  const onEachTerritoryFeature = useCallback((feature, layer) => {
    const rawNome = feature?.properties?.nome_territorio || '';
    const nome = rawNome.replace(/^Território de Identidade\s+/i, '').trim();
    const idTerr = feature?.properties?.id_territorio;
    const norm = normalizeName(nome);

    if (idTerr != null) {
      geoJsonLayersByTerritoryRef.current[idTerr] = layer;
      geoJsonLayersByTerritoryRef.current[String(idTerr)] = layer;
    }
    if (norm) geoJsonLayersByTerritoryRef.current[norm] = layer;

    layer.on({
      mouseover: (e) => {
        const { mode: curMode, modoGeografico: modoGeo, selectedTerritory: selTer, selectedCadeia: selCad, filtroSemiarido: semi, isDark: dark } = styleRefs.current;
        if (selCad) return;
        showHoverTooltip(
          nome,
          idTerr != null ? String(idTerr) : null,
          false,
          e.originalEvent?.clientX,
          e.originalEvent?.clientY
        );
        if (!selTer) {
          const hoverColors = getSemanticColors(dark);
          if (modoGeo) {
            e.target.setStyle({
              fillColor: semi ? hoverColors.warning : hoverColors.primarySoft,
              fillOpacity: 0.08,
              stroke: false,
              weight: 0
            });
          } else if (curMode === 'cursos') {
            e.target.setStyle({
              fillOpacity: 1.0
            });
          } else {
            e.target.setStyle({
              fillColor: semi ? (dark ? 'rgba(120, 53, 15, 0.21)' : hoverColors.warningTint) : (dark ? hoverColors.slateSurface : hoverColors.primarySurface),
              fillOpacity: 1
            });
          }
        }
      },
      mouseout: (e) => {
        hideHoverTooltip();
        const { selectedTerritory: selTer, selectedCadeia: selCad, territoryBorderStyle: styleFn } = styleRefs.current;
        if (selCad) return;
        if (!selTer) {
          e.target.setStyle(styleFn(feature));
        }
      },
      click: (e) => {
        hideHoverTooltip();
        const { selectedTerritory: selTer, selectedCadeia: selCad, onSelectTerritory: onSelect } = styleRefs.current;
        if (selCad) return;
        L.DomEvent.stopPropagation(e);
        const isCurrentSelected = selTer && (
          (selTer.id_territorio && String(selTer.id_territorio) === String(idTerr)) ||
          normalizeName(selTer.nome_territorio || selTer.territorio || '') === norm
        );

        if (isCurrentSelected) {
          onSelect(null);
        } else {
          onSelect({ id_territorio: idTerr, nome_territorio: nome, territorio: nome });
        }
      }
    });
  }, [showHoverTooltip, hideHoverTooltip]);

  const onEachMunicipioFeature = useCallback((feature, layer) => {
    const munNome = feature?.properties?.nome_municipio || feature?.properties?.NOME || '';
    const idTerr = feature?.properties?.id_territorio;
    const terrNome = feature?.properties?.nome_territorio || '';

    layer.on({
      mouseover: (e) => {
        if (styleRefs.current.selectedCadeia) return;
        showHoverTooltip(
          munNome,
          idTerr != null ? String(idTerr) : null,
          true,
          e.originalEvent?.clientX,
          e.originalEvent?.clientY
        );
        e.target.setStyle({
          fillOpacity: styleRefs.current.mode === 'cursos' ? 1 : 0.65
        });
      },
      mouseout: (e) => {
        hideHoverTooltip();
        if (styleRefs.current.selectedCadeia) return;
        e.target.setStyle(styleRefs.current.municipioBorderStyle(feature));
      },
      click: (e) => {
        hideHoverTooltip();
        const { selectedTerritory: selTer, selectedCadeia: selCad, onSelectTerritory: onSelect } = styleRefs.current;
        if (selCad) return;
        L.DomEvent.stopPropagation(e);
        if (!selTer && idTerr) {
          onSelect({ id_territorio: idTerr, nome_territorio: terrNome, territorio: terrNome });
        }
      }
    });
  }, [showHoverTooltip, hideHoverTooltip]);

  const selectedTerritoryInfo = useMemo(() => {
    if (!selectedTerritory) return null;
    const rawTerr = selectedTerritory.nome_territorio || selectedTerritory.territorio || '';
    const cleanTerr = rawTerr.replace(/^Território de Identidade\s+/i, '').trim();
    const norm = normalizeName(cleanTerr);
    const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;

    let count = 0;
    let unitSingular = 'item';
    let unitPlural = 'itens';
    let IconComponent = Layers;

    if (mode === 'cursos') {
      unitSingular = 'curso';
      unitPlural = 'cursos';
      IconComponent = Flame;
      const stat = (tid ? cursosStatsByTerritory[`id_${tid}`] : null) || cursosStatsByTerritory[norm];
      count = stat ? stat.count : 0;
    } else if (mode === 'ativos') {
      unitSingular = 'ativo';
      unitPlural = 'ativos';
      IconComponent = Layers;
      const stat = (tid ? ativosStatsByTerritory[`id_${tid}`] : null) || ativosStatsByTerritory[norm];
      count = stat ? stat.count : 0;
    } else if (mode === 'cadeias') {
      unitSingular = 'cadeia';
      unitPlural = 'cadeias';
      IconComponent = Network;
      const stat = (tid ? cadeiasStatsByTerritory[`id_${tid}`] : null) || cadeiasStatsByTerritory[norm];
      count = stat ? stat.count : 0;
    }

    return {
      label: cleanTerr,
      count,
      unit: count === 1 ? unitSingular : unitPlural,
      IconComponent
    };
  }, [
    selectedTerritory,
    mode,
    cursosStatsByTerritory,
    ativosStatsByTerritory,
    cadeiasStatsByTerritory
  ]);

  const selectedTerritoryMesh = useMemo(() => {
    if (!selectedTerritory) return null;
    const tid = selectedTerritory.id_territorio ? String(selectedTerritory.id_territorio) : null;
    if (tid && territoryMeshes[tid]) return territoryMeshes[tid];

    const rawNome = selectedTerritory.nome_territorio || selectedTerritory.territorio || '';
    const cleanNome = rawNome.replace(/^Território de Identidade\s+/i, '').trim();
    const norm = normalizeName(cleanNome);
    if (norm && territoryMeshes[norm]) return territoryMeshes[norm];

    return null;
  }, [selectedTerritory, territoryMeshes]);

  const hasActiveFilter = Boolean(
    pinnedAssetId ||
    selectedTerritory ||
    selectedCadeia ||
    selectedIES ||
    selectedSegmento ||
    (selectedTipo && selectedTipo !== 'todos') ||
    (selectedCategory && selectedCategory !== 'todas') ||
    (allCategories.length > 0 && activeCategoryKeys.size < allCategories.length)
  );

  const emptyPinIcon = useMemo(
    () => L.divIcon({ className: 'pointer-events-none', html: '', iconSize: [0, 0], iconAnchor: [0, 0] }),
    []
  );
  const currentHeatLevels = useMemo(
    () => getDynamicHeatLevels(filtroSemiarido, isDark),
    [filtroSemiarido, isDark]
  );

  return (
    <div
      ref={mapContainerRef}
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
      className={`relative isolate w-full h-full min-h-0 flex items-center justify-center ${filtroSemiarido ? 'bg-warning-50/70 dark:bg-surface-sunken' : 'bg-surface dark:bg-surface-sunken'} bg-carto-grid rounded-panel overflow-hidden select-none z-10 flex-1`}
    >

      <MapContainer
        ref={mapRef}
        preferCanvas={true}
        center={[-13.0, -41.6]}
        zoom={5.75}
        minZoom={5.25}
        maxZoom={modoGeografico ? 18 : 11}
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
        scrollWheelZoom={false}
        touchZoom={true}
        dragging={true}
        doubleClickZoom={true}
        className="w-full h-full z-10 flex-1 min-h-0 outline-none"
        style={{ background: 'transparent' }}
        zoomControl={false}
        attributionControl={false}
      >
        <CtrlScrollZoom />
        <MapPaneManager />
        <MapResizeHandler isExpanded={isExpanded} />
        <MapZoomWatcher
          onZoomChange={setCurrentZoom}
          onBoundsChange={mode === 'cadeias' && selectedCadeia ? setViewportBounds : undefined}
        />
        <MapClickHandler
          onClearPinned={() => {
            setPinnedAssetId(null);
          }}
        />
        <TerritoryFocusController
          selectedTerritory={selectedTerritory}
          geoJsonLayersByTerritoryRef={geoJsonLayersByTerritoryRef}
          territoriosLayerRef={territoriosLayerRef}
        />
        <CadeiaFocusController
          selectedCadeia={selectedCadeia}
          selectedTerritory={selectedTerritory}
          geoJsonLayersByTerritoryRef={geoJsonLayersByTerritoryRef}
          territoriosLayerRef={territoriosLayerRef}
        />
        <ConnectionsFocusController
          showAllConnections={showAllConnections}
          mode={mode}
          connectionLines={connectionLines}
          selectedTerritory={selectedTerritory}
        />

        {/* MAPA BASE COM PRECISÃO GEOGRÁFICA REAL (SEM BLOQUEIOS OU MARCAS D'ÁGUA) */}
        {modoGeografico && (
          <TileLayer
            key={`geo-tiles-${isDark ? 'dark' : 'light'}`}
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

        {territoriosGeoJson && (
          <GeoJSON
            key="territorios-base-layer"
            ref={territoriosLayerRef}
            data={territoriosGeoJson}
            style={territoryBorderStyle}
            onEachFeature={onEachTerritoryFeature}
          />
        )}

        {!modoGeografico && selectedTerritory && selectedTerritoryMunicipiosGeoJson && (
          <GeoJSON
            key={`municipios-layer-${selectedTerritory.id_territorio || selectedTerritory.territorio}`}
            ref={municipiosLayerRef}
            data={selectedTerritoryMunicipiosGeoJson}
            style={municipioBorderStyle}
            onEachFeature={onEachMunicipioFeature}
          />
        )}

        <Pane name="boundaries-pane" style={{ zIndex: 430, pointerEvents: 'none' }}>
          {/* MALHA DE CONTORNOS UNIFICADOS DE TODOS OS TERRITÓRIOS (SEM LINHAS DUPLAS) */}
          {(!selectedTerritory || modoGeografico) && allTerritoryMesh && (
            <GeoJSON
              key={`all-territory-mesh-${filtroSemiarido ? 'semi' : 'norm'}-${isDark ? 'dark' : 'light'}-${modoGeografico ? 'geo' : 'carto'}-${selectedTerritory ? 'sel' : 'all'}`}
              data={allTerritoryMesh}
              style={{
                color: modoGeografico
                  ? (filtroSemiarido ? (isDark ? getSemanticColors(true).warning : getSemanticColors(false).warningDark) : getSemanticColors(isDark).slateMuted)
                  : (filtroSemiarido ? (isDark ? getSemanticColors(true).warning : getSemanticColors(false).warningDark) : (isDark ? getSemanticColors(true).slateBorder : getSemanticColors(false).slateBorder)),
                weight: modoGeografico ? 0.75 : (filtroSemiarido ? 1.5 : 1.2),
                opacity: modoGeografico ? (selectedTerritory ? 0.25 : 0.38) : (filtroSemiarido ? 0.85 : 0.95),
                fill: false,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              interactive={false}
            />
          )}

          {/* CONTORNO PERIMETRAL EXTERNO DO ESTADO DA BAHIA */}
          {!selectedTerritory && stateBoundaryMesh && (
            <GeoJSON
              key={`state-boundary-mesh-${filtroSemiarido ? 'semi' : 'norm'}-${isDark ? 'dark' : 'light'}-${modoGeografico ? 'geo' : 'carto'}`}
              data={stateBoundaryMesh}
              style={{
                color: filtroSemiarido ? getSemanticColors(isDark).warningWarm : (isDark ? getSemanticColors(true).slateDeep : getSemanticColors(false).slateMuted),
                weight: modoGeografico ? 1.1 : 1.8,
                opacity: modoGeografico ? 0.45 : 1,
                fill: false,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              interactive={false}
            />
          )}

          {/* CONTORNO COMPLETO, NÍTIDO E SEM CORTES DO TERRITÓRIO SELECIONADO */}
          {selectedTerritory && selectedTerritoryMesh && (
            <GeoJSON
              key={`selected-territory-mesh-${selectedTerritory.id_territorio || selectedTerritory.nome_territorio || 'sel'}-${filtroSemiarido ? '1' : '0'}-${isDark ? 'dark' : 'light'}-${modoGeografico ? 'geo' : 'carto'}`}
              data={selectedTerritoryMesh}
              style={{
                color: filtroSemiarido
                  ? (isDark ? getSemanticColors(true).warning : getSemanticColors(false).warningDeep)
                  : (isDark ? getSemanticColors(true).primaryLight : getSemanticColors(false).primaryDeep),
                weight: modoGeografico ? 1.35 : 2.8,
                opacity: modoGeografico ? 0.75 : 1,
                fill: false,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              interactive={false}
            />
          )}
        </Pane>

        {mode !== 'cadeias' && focusedAsset && <ChangeMapView coords={focusedAsset} modoGeografico={modoGeografico} />}

        {mode === 'cadeias' && connectionLines.length > 0 && (
          <Pane name="connections-pane" style={{ zIndex: 465, pointerEvents: 'none' }}>
            {connectionLines.map((line, idx) => {
              const totalLines = connectionLines.length;
              const adaptiveWeight = line.isSelected
                ? (totalLines > 35 ? 1.35 : totalLines > 15 ? 1.65 : 2.1)
                : ((selectedTerritory || selectedSegmento) ? 1.6 : 1.35);
              const adaptiveOpacity = line.isSelected
                ? (totalLines > 35 ? 0.42 : totalLines > 15 ? 0.58 : 0.8)
                : ((selectedTerritory || selectedSegmento) ? 0.55 : 0.42);
              const adaptiveDash = line.isSelected
                ? (totalLines > 20 ? '4 4' : null)
                : '5 5';

              return (
                <Polyline
                  key={`conn-line-${idx}`}
                  pane="connections-pane"
                  interactive={false}
                  positions={line.positions}
                  pathOptions={{
                    color: line.color || (line.isSelected
                      ? (filtroSemiarido ? getSemanticColors(isDark).warningDark : getSemanticColors(isDark).primaryBase)
                      : (filtroSemiarido ? getSemanticColors(isDark).warning : getSemanticColors(isDark).primarySoft)),
                    weight: adaptiveWeight,
                    opacity: adaptiveOpacity,
                    lineCap: 'round',
                    lineJoin: 'round',
                    dashArray: adaptiveDash
                  }}
                />
              );
            })}
          </Pane>
        )}

        {mode === 'cadeias' &&
          currentZoom >= 8.0 &&
          (framedPartnerMunicipios.length <= 16 || currentZoom >= 8.5) &&
          framedPartnerMunicipios.map((p) => (
            <Marker key={`partner-pin-${p.municipio}`} position={p.position} icon={emptyPinIcon} interactive={false}>
              <Tooltip
                key={`city-tip-${p.municipio}`}
                direction="center"
                offset={[0, 0]}
                opacity={1}
                permanent={true}
                className="clean-city-tooltip"
              >
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shadow-xs border whitespace-nowrap transition-all ${
                  filtroSemiarido
                    ? 'text-amber-900 dark:text-amber-200 bg-white/95 dark:bg-zinc-900/95 border-amber-500/30'
                    : 'text-zinc-800 dark:text-zinc-100 bg-white/95 dark:bg-zinc-900/95 border-zinc-200/90 dark:border-zinc-700'
                }`}>
                  {p.municipio}
                </span>
              </Tooltip>
            </Marker>
          ))}

        {(mode === 'ativos' || mode === 'cadeias' || (mode === 'cursos' && modoGeografico)) && (
          <SuperclusteredMarkers
            processedAtivos={
              mode === 'cadeias'
                ? visibleCadeias
                : mode === 'cursos'
                  ? visibleCursosGeoMarkers
                  : visibleAtivos
            }
            pinnedAssetId={pinnedAssetId}
            setPinnedAssetId={setPinnedAssetId}
            onAssetClick={onAssetClick}
            selectedCadeia={selectedCadeia}
            mode={mode}
            filtroSemiarido={filtroSemiarido}
            getSegmentColor={getSegmentColor}
            modoGeografico={modoGeografico}
          />
        )}
      </MapContainer>

      {/* PAINEL SUPERIOR ESQUERDO: BREADCRUMB DE NAVEGAÇÃO + FILTRO ATIVO */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 pointer-events-none select-none max-w-[calc(100%-260px)]">
        {/* BREADCRUMB FIXO (BAHIA / TERRITÓRIO SELECIONADO) */}
        <div className="pointer-events-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-sm text-xs w-fit max-w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTerritory?.(null);
              fitMapToBahia(mapRef.current, territoriosLayerRef);
            }}
            className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer shrink-0 ${
              selectedTerritoryInfo
                ? 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                : 'text-zinc-900 dark:text-zinc-100'
            }`}
            title="Enquadrar toda a Bahia"
          >
            <Layers size={13} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />
            <span>Bahia</span>
          </button>

          {selectedTerritoryInfo ? (
            <>
              <ChevronRight size={12} className="text-zinc-400 shrink-0" />
              <span
                className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]"
                title={selectedTerritoryInfo.label}
              >
                {selectedTerritoryInfo.label}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTerritory?.(null);
                }}
                aria-label="Remover filtro de território"
                title="Voltar para toda a Bahia"
                className="ml-0.5 w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0 touch-manipulation"
              >
                <X size={12} strokeWidth={2.25} />
              </button>
            </>
          ) : (
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal pl-0.5 hidden sm:inline">
              · 27 Territórios
            </span>
          )}
        </div>

        {/* BADGE DE FILTRO ATIVO DA ABA (CATEGORIA, ÁREA OU SEGMENTO) */}
        {(
          (mode === 'ativos' && ((selectedTipos && selectedTipos.length > 0 && !selectedTipos.includes('todos')) || (selectedTipo && selectedTipo !== 'todos'))) ||
          (mode === 'cursos' && selectedCategory && selectedCategory !== 'todas') ||
          (mode === 'cadeias' && (selectedSegmento || (selectedTipo && selectedTipo !== 'todos')))
        ) && (
            <div className="pointer-events-auto inline-flex items-center gap-1.5 h-7 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 rounded-full border border-zinc-200/80 dark:border-zinc-800 shadow-sm w-fit max-w-full">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${mode === 'cadeias' && selectedSegmento && getSegmentColor
                  ? ''
                  : (filtroSemiarido ? 'bg-amber-500' : 'bg-primary-600')
                  }`}
                style={
                  mode === 'cadeias' && selectedSegmento && getSegmentColor
                    ? { backgroundColor: getSegmentColor(selectedSegmento) }
                    : undefined
                }
              />
              <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[160px]">
                {mode === 'ativos' && (selectedTipos && selectedTipos.length > 1 ? `${selectedTipos.length} Tipos` : `${selectedTipo || selectedTipos[0]}`)}
                {mode === 'cursos' && `${selectedCategory}`}
                {mode === 'cadeias' && (selectedSegmento ? `${selectedSegmento}` : `${selectedTipo}`)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (mode === 'ativos') {
                    onSelectTipo?.('todos');
                    onSelectTipos?.([]);
                  }
                  if (mode === 'cursos') onSelectCategory?.('todas');
                  if (mode === 'cadeias') {
                    if (selectedSegmento) onSelectSegmento?.(null);
                    else onSelectTipo?.('todos');
                  }
                }}
                aria-label="Remover filtro de categoria"
                className="w-4 h-4 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                title="Remover filtro"
              >
                <X size={11} strokeWidth={2.25} />
              </button>
            </div>
          )}
      </div>

      {mode === 'cursos' && !modoGeografico && (
        <div className="absolute bottom-3 left-3 z-[400] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl px-3.5 py-3 border border-zinc-200/80 dark:border-zinc-800 shadow-sm pointer-events-auto min-w-[290px]">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <span className={`text-caption font-semibold tracking-tight leading-none ${filtroSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-text-primary'}`}>
              {selectedTerritory ? 'Densidade Relativa Municipal (Log)' : 'Densidade de Cursos'}
            </span>
            {selectedTerritory && (
              <span className={`text-[10px] font-medium leading-none px-1.5 py-0.5 rounded-full tnum ${filtroSemiarido ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300' : 'bg-primary-500/10 text-primary-600 dark:text-primary-300'}`}>
                Máx: {maxCursosNoTerritorioSelecionado}
              </span>
            )}
          </div>

          <div className="grid grid-cols-6 gap-1.5 items-start">
            {currentHeatLevels.map((lvl, idx) => {
              const labelText = selectedTerritory
                ? (idx === 0 ? '0' : idx === currentHeatLevels.length - 1 ? `${maxCursosNoTerritorioSelecionado}` : '')
                : lvl.label.replace(' cursos', '');

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 min-w-0">
                  <div
                    className="w-full h-2 rounded-[3px] shadow-2xs border border-black/5 dark:border-white/10"
                    style={{ backgroundColor: lvl.color }}
                    title={lvl.label}
                  />
                  <span className={`w-full text-center text-[10px] font-medium leading-none whitespace-nowrap tnum ${filtroSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-text-muted'}`}>
                    {labelText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BARRA DE CAMADAS E AÇÕES (CANTO SUPERIOR DIREITO) */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
        {!hideLayerControls && mode === 'cadeias' && (
          <button
            type="button"
            onClick={() => setShowAllConnections((prev) => !prev)}
            title={showAllConnections ? 'Ocultar teia de conexões' : 'Exibir teia de conexões entre cadeias e municípios'}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-all duration-150 border cursor-pointer select-none backdrop-blur-md active:scale-[0.99] ${showAllConnections
              ? (filtroSemiarido
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs')
              : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 shadow-sm'
              }`}
          >
            <Network size={13} strokeWidth={2} />
            <span className="hidden sm:inline">Conexões</span>
          </button>
        )}

        {/* TOGGLE MAPA GEOGRÁFICO */}
        {!hideLayerControls && (
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
                ? (filtroSemiarido
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs')
                : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 shadow-sm'
            }`}
          >
            <Globe size={13} strokeWidth={2} />
            <span className="truncate">Geográfico</span>
          </button>
        )}

        {/* BOTÃO MODO SEMIÁRIDO */}
        {!hideLayerControls && Boolean(setFiltroSemiarido) && (
          <button
            type="button"
            onClick={() => setFiltroSemiarido(prev => !prev)}
            title={filtroSemiarido ? 'Voltar ao Modo Normal (27 Territórios)' : 'Filtrar municípios do Semiárido'}
            className={`tour-toggle-semiarido inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer border select-none backdrop-blur-md active:scale-[0.99] ${filtroSemiarido
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30'
              : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 shadow-sm'
              }`}
          >
            <span className="truncate">Semiárido</span>
          </button>
        )}

        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            title={isExpanded ? 'Recolher mapa' : 'Expandir mapa'}
            aria-label={isExpanded ? 'Recolher mapa' : 'Expandir mapa'}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 border cursor-pointer select-none backdrop-blur-md active:scale-[0.99] ${isExpanded
              ? (filtroSemiarido
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs')
              : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 shadow-sm'
              }`}
          >
            {isExpanded ? <Shrink size={14} /> : <Expand size={14} />}
          </button>
        )}
      </div>

      {/* CONTROLES DE ZOOM E RESET (CANTO INFERIOR DIREITO) */}
      <div className="absolute bottom-3 right-3 z-[400] flex flex-col items-end gap-1.5">
        {(selectedTerritory || pinnedAssetId != null || Math.abs(currentZoom - 5.75) > 0.35) && (
          <button
            type="button"
            onClick={() => {
              setPinnedAssetId(null);
              onSelectTerritory?.(null);
              onAssetClick?.(null);
              fitMapToBahia(mapRef.current, territoriosLayerRef);
            }}
            aria-label="Enquadrar toda a Bahia"
            title="Enquadrar toda a Bahia"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-sm text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all duration-150 ease-out active:scale-[0.99] cursor-pointer touch-manipulation"
          >
            <Maximize2 size={15} />
          </button>
        )}

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setPinnedAssetId(null);
              setActiveCategoryKeys(new Set(allCategories.map((c) => c.key)));
              fitMapToBahia(mapRef.current, territoriosLayerRef);
              onSelectTerritory(null);
              onSelectIES?.(null);
              onSelectSegmento?.(null);
              onSelectTipo?.('todos');
              onSelectTipos?.([]);
              onSelectCategory?.('todas');
              onAssetClick?.(null);
            }}
            aria-label="Limpar todos os filtros"
            title="Limpar todos os filtros e centralizar Bahia"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-500/10 hover:bg-rose-500/20 backdrop-blur-md border border-rose-500/25 shadow-sm text-rose-600 dark:text-rose-400 transition-all duration-150 ease-out active:scale-[0.99] cursor-pointer touch-manipulation"
          >
            <RotateCcw size={15} />
          </button>
        )}

        <div className="flex flex-col bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-full border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn(0.5)}
            disabled={currentZoom >= (modoGeografico ? 18 : 11)}
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
            {Math.max(1, (currentZoom / 5.75)).toFixed(1)}x
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

      {/* TOOLTIP FLUTUANTE (ZERO RE-RENDERS NO HOVER E MOUSEMOVE) */}
      <div
        ref={tooltipDomRef}
        className="absolute top-0 left-0 z-[1000] rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2.5 shadow-md pointer-events-none transition-opacity duration-75"
        style={{ width: 216, opacity: 0, transform: 'translate3d(0px, 0px, 0)' }}
      >
        <div className="flex flex-col gap-1">
          <span
            ref={tooltipTypeRef}
            className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
          >
            Território de Identidade
          </span>
          <span
            ref={tooltipLabelRef}
            className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 leading-snug truncate"
          >
            Território
          </span>
          <div className="flex items-center justify-between pt-1.5 mt-0.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <span
              ref={tooltipSubRef}
              className="text-[11px] text-zinc-500 dark:text-zinc-400"
            >
              Total no território
            </span>
            <span
              ref={tooltipCountRef}
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums"
            >
              0 itens
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}