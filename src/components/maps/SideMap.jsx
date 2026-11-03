import React, { useRef, useEffect, useState, useMemo, useContext, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Layers, Network, Expand, Shrink, Flame, Globe } from 'lucide-react';
import { DataContext } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { isMunicipioSemiarido } from '../../constants/semiarido';
import { getCachedBahiaTopologia, loadBahiaTopologia } from './bahiaTopologiaCache';

// Buffer equilibrado (65% além da tela) para evitar cortes ao afastar o zoom sem sobrecarregar a GPU
if (typeof L !== 'undefined' && L.Renderer) {
  L.Renderer.prototype.options.padding = 0.65;
  if (L.SVG) L.SVG.prototype.options.padding = 0.65;
  if (L.Canvas) L.Canvas.prototype.options.padding = 0.65;
}

import {
  SEMIARIDO_TERRITORY_IDS,
  normalizeName,
  buildMunicipioTerritoryMap,
  findMunicipioCoords,
  isInsideBahia
} from './side/mapGeoUtils';

import { useMapTheme } from './mapTheme';
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
  getSegmentColor = null
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

  const filtroSemiarido = propFiltroSemiarido !== undefined ? Boolean(propFiltroSemiarido) : Boolean(contextFiltroSemiarido);
  const { isDark } = useTheme();
  const mapPalette = useMapTheme(filtroSemiarido);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const territoriosLayerRef = useRef(null);
  const municipiosLayerRef = useRef(null);
  const tooltipDomRef = useRef(null);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });

  const [topologia, setTopologia] = useState(() => getCachedBahiaTopologia());
  const [pinnedAssetId, setPinnedAssetId] = useState(null);
  const [hoveredFeatureName, setHoveredFeatureName] = useState(null);
  const [hoveredFeatureId, setHoveredFeatureId] = useState(null);
  const [isLayerControlOpen, setIsLayerControlOpen] = useState(false);
  const [showAllConnections, setShowAllConnections] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(6);

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
          corHex: '#2563EB',
          corHexDark: '#60A5FA',
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
    const container = mapContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const tooltipWidth = 220;
    const tooltipHeight = 82;
    const offset = 14;

    let x = clientX - rect.left + offset;
    let y = clientY - rect.top + offset;

    if (x + tooltipWidth > rect.width - 8) x = clientX - rect.left - tooltipWidth - offset;
    if (y + tooltipHeight > rect.height - 8) y = clientY - rect.top - tooltipHeight - offset;
    if (x < 8) x = 8;
    if (y < 8) y = 8;

    lastPointerPosRef.current = { x, y };
    if (tooltipDomRef.current) {
      tooltipDomRef.current.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      updateTooltipPosition(e.clientX, e.clientY);
    },
    [updateTooltipPosition]
  );

  useEffect(() => {
    if (hoveredFeatureName && tooltipDomRef.current) {
      const { x, y } = lastPointerPosRef.current;
      tooltipDomRef.current.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    }
  }, [hoveredFeatureName]);

  // 1. Estilização dos Territórios de Identidade
  const territoryBorderStyle = (feature) => {
    const rawNome = feature?.properties?.nome_territorio || '';
    const nome = rawNome.replace(/^Território de Identidade\s+/i, '').trim();
    const idTerr = feature?.properties?.id_territorio;
    const norm = normalizeName(nome);
    const isTerrSemiarido = SEMIARIDO_TERRITORY_IDS.has(String(idTerr));

    const isHovered = hoveredFeatureName === nome;
    const isSelected = selectedTerritory && (
      (selectedTerritory.id_territorio && String(selectedTerritory.id_territorio) === String(idTerr)) ||
      normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio) === norm
    );

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
          fillColor: isDark ? '#141c2c' : '#CBD5E1',
          fillOpacity: isDark ? 0.40 : 0.55,
          color: mapPalette.stroke.default,
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
        color: isHovered ? mapPalette.stroke.hover : mapPalette.stroke.default,
        weight: isHovered ? 1.8 : 1.1,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'transition-all duration-200 cursor-pointer outline-none'
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
          fillColor: filtroSemiarido ? (isDark ? '#78350F40' : '#FEF3C7') : (isDark ? 'rgba(30, 58, 138, 0.3)' : '#EFF6FF'),
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
        fillColor: isDark ? '#101726' : '#F8FAFC',
        fillOpacity: isDark ? 0.70 : 0.85,
        color: isDark ? '#1e283c' : '#E2E8F0',
        weight: 0.8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'outline-none cursor-pointer hover:opacity-80 transition-opacity'
      };
    }

    return {
      fillColor: isHovered
        ? (filtroSemiarido ? (isDark ? '#78350F35' : '#FEF3C7') : (isDark ? '#1e293b' : '#EFF6FF'))
        : (filtroSemiarido ? (isDark ? '#1c1917' : '#FFFBEB') : (isDark ? '#141d2e' : '#FFFFFF')),
      fillOpacity: 1,
      color: isHovered
        ? (filtroSemiarido ? '#D97706' : (isDark ? '#60A5FA' : '#2563EB'))
        : (filtroSemiarido ? (isDark ? '#92400E' : '#F59E0B') : (isDark ? '#26364d' : '#CBD5E1')),
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
    const isHovered = hoveredFeatureName === munNome;

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

    if (filtroSemiarido && !isMunicipioSemiarido(munNome)) {
      return {
        fillColor: '#E2E8F0',
        fillOpacity: 0.35,
        color: '#CBD5E1',
        weight: 0.6,
        opacity: 0.8,
        stroke: true
      };
    }

    if (mode !== 'cursos') {
      const munStat = mode === 'ativos' ? ativosStatsByMunicipio[munNorm] : cadeiasStatsByMunicipio[munNorm];
      const count = munStat ? munStat.count : 0;
      return {
        fillColor: isHovered
          ? (filtroSemiarido ? '#FEF3C7' : '#EFF6FF')
          : (count > 0 ? (filtroSemiarido ? '#FFFBEB' : '#F0F9FF') : 'transparent'),
        fillOpacity: isHovered ? 0.75 : (count > 0 ? 0.4 : 0),
        color: isHovered
          ? (filtroSemiarido ? '#D97706' : '#2563EB')
          : (count > 0 ? (filtroSemiarido ? '#D9770680' : '#38BDF8') : (isDark ? '#334155' : '#CBD5E1')),
        weight: isHovered ? 2.0 : 0.8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'transition-all duration-150 cursor-pointer outline-none'
      };
    }

    const munStat = cursosStatsByMunicipio[munNorm];
    const count = munStat ? munStat.count : 0;

    // Aplicação da Escala Logarítmica para equilibrar o contraste visual
    const relativeHeatColor = getRelativeHeatColor(count, maxCursosNoTerritorioSelecionado, filtroSemiarido, isDark);

    return {
      fillColor: relativeHeatColor,
      fillOpacity: isHovered ? 1.0 : 0.95,
      color: isHovered ? mapPalette.stroke.hover : (isDark ? mapPalette.stroke.default : '#FFFFFF'),
      weight: isHovered ? 2.0 : 1.2,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'transition-all duration-150 cursor-pointer outline-none'
    };
  };

  const geoJsonLayersByTerritoryRef = useRef({});
  const styleRefs = useRef({ territoryBorderStyle, municipioBorderStyle, mode, selectedTerritory, filtroSemiarido, onSelectTerritory });
  useEffect(() => {
    styleRefs.current = { territoryBorderStyle, municipioBorderStyle, mode, selectedTerritory, filtroSemiarido, onSelectTerritory };
  });

  useEffect(() => {
    if (territoriosLayerRef.current) {
      territoriosLayerRef.current.setStyle((feature) => styleRefs.current.territoryBorderStyle(feature));
    }
  }, [
    mode,
    filtroSemiarido,
    isDark,
    selectedTerritory,
    hoveredFeatureName,
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
    hoveredFeatureName,
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
        if (e.originalEvent) {
          updateTooltipPosition(e.originalEvent.clientX, e.originalEvent.clientY);
        }
        setHoveredFeatureName(nome);
        setHoveredFeatureId(idTerr != null ? String(idTerr) : null);
        const { mode: curMode, selectedTerritory: selTer, filtroSemiarido: semi } = styleRefs.current;
        if (curMode !== 'cursos' && !selTer) {
          e.target.setStyle({
            fillColor: semi ? '#FEF3C7' : '#EFF6FF',
            fillOpacity: 1,
            color: semi ? '#D97706' : '#2563EB',
            weight: 1.8
          });
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            e.target.bringToFront();
          }
        }
      },
      mouseout: (e) => {
        setHoveredFeatureName(null);
        setHoveredFeatureId(null);
        const { mode: curMode, selectedTerritory: selTer, territoryBorderStyle: styleFn } = styleRefs.current;
        if (curMode !== 'cursos' && !selTer) {
          e.target.setStyle(styleFn(feature));
        }
      },
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        const { selectedTerritory: selTer, onSelectTerritory: onSelect } = styleRefs.current;
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
  }, [updateTooltipPosition]);

  const onEachMunicipioFeature = useCallback((feature, layer) => {
    const munNome = feature?.properties?.nome_municipio || feature?.properties?.NOME || '';
    const idTerr = feature?.properties?.id_territorio;
    const terrNome = feature?.properties?.nome_territorio || '';

    layer.on({
      mouseover: (e) => {
        if (e.originalEvent) {
          updateTooltipPosition(e.originalEvent.clientX, e.originalEvent.clientY);
        }
        setHoveredFeatureName(munNome);
        setHoveredFeatureId(idTerr != null ? String(idTerr) : null);
        e.target.setStyle({
          weight: 2.0,
          color: styleRefs.current.filtroSemiarido ? '#D97706' : '#1D3557'
        });
      },
      mouseout: (e) => {
        setHoveredFeatureName(null);
        setHoveredFeatureId(null);
        e.target.setStyle(styleRefs.current.municipioBorderStyle(feature));
      },
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        const { selectedTerritory: selTer, onSelectTerritory: onSelect } = styleRefs.current;
        if (!selTer && idTerr) {
          onSelect({ id_territorio: idTerr, nome_territorio: terrNome, territorio: terrNome });
        }
      }
    });
  }, [updateTooltipPosition]);

  const hoveredInfo = useMemo(() => {
    if (!hoveredFeatureName) return null;
    const norm = normalizeName(hoveredFeatureName);

    let count = 0;
    let unitSingular = 'item';
    let unitPlural = 'itens';
    let IconComponent = Layers;

    if (mode === 'cursos') {
      unitSingular = 'curso';
      unitPlural = 'cursos';
      IconComponent = Flame;
      if (selectedTerritory) {
        const stat = cursosStatsByMunicipio[norm];
        count = stat ? stat.count : 0;
      } else {
        const stat = (hoveredFeatureId ? cursosStatsByTerritory[`id_${hoveredFeatureId}`] : null) || cursosStatsByTerritory[norm];
        count = stat ? stat.count : 0;
      }
    } else if (mode === 'ativos') {
      unitSingular = 'ativo';
      unitPlural = 'ativos';
      IconComponent = Layers;
      if (selectedTerritory) {
        const stat = ativosStatsByMunicipio[norm];
        count = stat ? stat.count : 0;
      } else {
        const stat = (hoveredFeatureId ? ativosStatsByTerritory[`id_${hoveredFeatureId}`] : null) || ativosStatsByTerritory[norm];
        count = stat ? stat.count : 0;
      }
    } else if (mode === 'cadeias') {
      unitSingular = 'cadeia';
      unitPlural = 'cadeias';
      IconComponent = Network;
      if (selectedTerritory) {
        const stat = cadeiasStatsByMunicipio[norm];
        count = stat ? stat.count : 0;
      } else {
        const stat = (hoveredFeatureId ? cadeiasStatsByTerritory[`id_${hoveredFeatureId}`] : null) || cadeiasStatsByTerritory[norm];
        count = stat ? stat.count : 0;
      }
    }

    return {
      label: hoveredFeatureName,
      count,
      unit: count === 1 ? unitSingular : unitPlural,
      IconComponent,
      sub: selectedTerritory ? 'no município' : 'no território'
    };
  }, [
    mode,
    hoveredFeatureName,
    hoveredFeatureId,
    selectedTerritory,
    cursosStatsByMunicipio,
    cursosStatsByTerritory,
    ativosStatsByMunicipio,
    ativosStatsByTerritory,
    cadeiasStatsByMunicipio,
    cadeiasStatsByTerritory
  ]);

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

  const hoveredTerritoryMesh = useMemo(() => {
    if (selectedTerritory) return null;
    if (hoveredFeatureId && territoryMeshes[String(hoveredFeatureId)]) {
      return territoryMeshes[String(hoveredFeatureId)];
    }
    if (hoveredFeatureName) {
      const norm = normalizeName(hoveredFeatureName.replace(/^Território de Identidade\s+/i, '').trim());
      if (norm && territoryMeshes[norm]) return territoryMeshes[norm];
    }
    return null;
  }, [hoveredFeatureId, hoveredFeatureName, selectedTerritory, territoryMeshes]);

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

  const partnerPin = useMemo(() => createPartnerPinIcon(filtroSemiarido), [filtroSemiarido]);
  const selectedPartnerPin = useMemo(() => createSelectedPartnerPinIcon(filtroSemiarido), [filtroSemiarido]);
  const currentHeatLevels = useMemo(
    () => getDynamicHeatLevels(filtroSemiarido, isDark),
    [filtroSemiarido, isDark]
  );

  return (
    <div
      ref={mapContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setHoveredFeatureName(null);
        setHoveredFeatureId(null);
      }}
      className={`relative w-full h-full min-h-0 flex items-center justify-center ${filtroSemiarido ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'bg-surface-sunken'} bg-carto-grid rounded-panel overflow-hidden select-none z-10 flex-1`}
    >
      <MapContainer
        ref={mapRef}
        preferCanvas={true}
        center={[-13.0, -41.6]}
        zoom={5.75}
        minZoom={modoGeografico ? 4.0 : 5.0}
        maxZoom={modoGeografico ? 19 : 15}
        zoomSnap={0.25}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={90}
        wheelDebounceTime={30}
        inertia={true}
        inertiaDeceleration={3000}
        maxBounds={
          modoGeografico
            ? [
                [-35.0, -75.0],
                [6.0, -32.0]
              ]
            : [
                [-18.8, -47.5],
                [-7.5, -36.5]
              ]
        }
        maxBoundsViscosity={modoGeografico ? 0.3 : 0.85}
        scrollWheelZoom={true}
        doubleClickZoom={false}
        className="w-full h-full z-0 flex-1 min-h-0 outline-none"
        zoomControl={false}
        attributionControl={false}
      >
        <MapPaneManager />
        <MapResizeHandler isExpanded={isExpanded} />
        <MapZoomWatcher onZoomChange={setCurrentZoom} />
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
            keepBuffer={8}
            updateWhenZooming={false}
            updateWhenIdle={false}
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

        {!modoGeografico && territoriosGeoJson && (
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

        {/* MALHA DE CONTORNOS UNIFICADOS DE TODOS OS TERRITÓRIOS (SEM LINHAS DUPLAS) */}
        {!modoGeografico && !selectedTerritory && allTerritoryMesh && (
          <GeoJSON
            key={`all-territory-mesh-${filtroSemiarido ? 'semi' : 'norm'}-${isDark ? 'dark' : 'light'}`}
            pane="territoryOutlinePane"
            data={allTerritoryMesh}
            style={{
              color: filtroSemiarido ? (isDark ? '#F59E0B' : '#B45309') : (isDark ? '#334666' : '#CBD5E1'),
              weight: filtroSemiarido ? 1.5 : 1.2,
              opacity: filtroSemiarido ? 0.85 : 0.95,
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
            pane="territoryOutlinePane"
            data={stateBoundaryMesh}
            style={{
              color: filtroSemiarido ? '#92400E' : (isDark ? '#475569' : '#64748B'),
              weight: modoGeografico ? 1.5 : 1.8,
              opacity: modoGeografico ? 0.55 : 1,
              fill: false,
              lineCap: 'round',
              lineJoin: 'round'
            }}
            interactive={false}
          />
        )}

        {/* CONTORNO EM DESTAQUE NO HOVER (QUANDO NÃO HÁ SELEÇÃO) */}
        {!modoGeografico && hoveredTerritoryMesh && !selectedTerritory && (
          <GeoJSON
            key={`hover-territory-mesh-${hoveredFeatureId || hoveredFeatureName}-${filtroSemiarido ? '1' : '0'}`}
            pane="territoryOutlinePane"
            data={hoveredTerritoryMesh}
            style={{
              color: filtroSemiarido ? '#D97706' : (isDark ? '#60A5FA' : '#2563EB'),
              weight: 2.2,
              opacity: 1,
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
            key={`selected-territory-mesh-${selectedTerritory.id_territorio || selectedTerritory.nome_territorio || 'sel'}-${filtroSemiarido ? '1' : '0'}-${isDark ? 'dark' : 'light'}`}
            pane="territoryOutlinePane"
            data={selectedTerritoryMesh}
            style={{
              color: filtroSemiarido
                ? (isDark ? '#F59E0B' : '#D97706')
                : (isDark ? '#60A5FA' : '#1D4ED8'),
              weight: 2.8,
              opacity: 1,
              fill: false,
              lineCap: 'round',
              lineJoin: 'round'
            }}
            interactive={false}
          />
        )}

        {focusedAsset && <ChangeMapView coords={focusedAsset} />}

        {mode === 'cadeias' && connectionLines.map((line, idx) => (
          <Polyline
            key={`conn-line-${idx}`}
            pane="connectionsPane"
            positions={line.positions}
            pathOptions={{
              color: line.isSelected
                ? (filtroSemiarido ? '#B45309' : '#1E40AF')
                : (filtroSemiarido ? '#F59E0B' : '#3B82F6'),
              weight: line.isSelected ? 2.4 : 1.15,
              opacity: line.isSelected ? 0.95 : (filtroSemiarido ? 0.45 : 0.38),
              dashArray: null
            }}
          />
        ))}

        {mode === 'cadeias' && uniquePartnerMunicipios.map((p, idx) => {
          const showLabel = Boolean(p.isSelected && currentZoom >= 8.0);

          return (
            <Marker key={`partner-pin-${p.municipio}-${idx}`} position={p.position} icon={p.isSelected ? selectedPartnerPin : partnerPin}>
              <Tooltip
                key={`city-tip-${p.municipio}-${p.isSelected ? 'sel' : 'norm'}-${showLabel ? 'perm' : 'hover'}`}
                direction="top"
                offset={[0, -4]}
                opacity={0.98}
                permanent={showLabel}
                className="clean-city-tooltip"
              >
                <span className={`text-caption font-medium px-2 py-0.5 rounded-full shadow-2xs border whitespace-nowrap transition-all ${p.isSelected
                  ? (filtroSemiarido ? 'text-white bg-warning-700 border-warning-700 font-bold' : 'text-white bg-primary-700 border-primary-700 font-bold')
                  : (filtroSemiarido ? 'text-amber-800 dark:text-amber-300 bg-surface border-amber-500/30' : 'text-text-primary bg-surface border-border')
                  }`}>
                  {p.municipio}
                </span>
              </Tooltip>
            </Marker>
          );
        })}

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
          />
        )}
      </MapContainer>

      {/* PAINEL SUPERIOR ESQUERDO: FILTRO ATIVO DA ABA + HOVER */}
      <div className="absolute top-3 left-3.5 z-[400] flex flex-col gap-1.5 pointer-events-none select-none max-w-[280px]">
        {/* BADGE DE FILTRO ATIVO DA ABA (CATEGORIA, ÁREA OU SEGMENTO) */}
        {(
          (mode === 'ativos' && ((selectedTipos && selectedTipos.length > 0 && !selectedTipos.includes('todos')) || (selectedTipo && selectedTipo !== 'todos'))) ||
          (mode === 'cursos' && selectedCategory && selectedCategory !== 'todas') ||
          (mode === 'cadeias' && (selectedSegmento || (selectedTipo && selectedTipo !== 'todos')))
        ) && (
            <div className="pointer-events-auto flex items-center gap-2 bg-surface px-3 py-1.5 rounded-control border border-border shadow-card animate-in fade-in slide-in-from-top-2 duration-200">
              <span
                className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${mode === 'cadeias' && selectedSegmento && getSegmentColor
                  ? ''
                  : (filtroSemiarido ? 'bg-warning-600' : 'bg-primary-600')
                  }`}
                style={
                  mode === 'cadeias' && selectedSegmento && getSegmentColor
                    ? { backgroundColor: getSegmentColor(selectedSegmento) }
                    : undefined
                }
              />
              <span className="text-caption font-semibold text-text-primary truncate">
                {mode === 'ativos' && (selectedTipos && selectedTipos.length > 1 ? `${selectedTipos.length} Tipos Selecionados` : `Categoria: ${selectedTipo || selectedTipos[0]}`)}
                {mode === 'cursos' && `Área: ${selectedCategory}`}
                {mode === 'cadeias' && (selectedSegmento ? `Segmento: ${selectedSegmento}` : `Tipo: ${selectedTipo}`)}
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
                className="w-4 h-4 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors ml-auto cursor-pointer leading-none text-xs font-bold"
                title="Remover filtro"
              >
                ×
              </button>
            </div>
          )}

        {/* INFO DO TERRITÓRIO NO TOPO (HOVER OU TERRITÓRIO SELECIONADO) */}
        {(hoveredInfo || selectedTerritoryInfo) && (() => {
          const display = hoveredInfo || selectedTerritoryInfo;
          const Icon = display.IconComponent;
          const isSelectedBadge = !hoveredInfo && Boolean(selectedTerritoryInfo);

          return (
            <div className="pointer-events-auto flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-control border border-border shadow-card animate-in fade-in slide-in-from-top-1 duration-150">
              <Icon size={13} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />
              <span className="text-text-primary font-semibold text-caption tracking-tight truncate max-w-[160px]">
                {display.label}
              </span>
              {isSelectedBadge && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTerritory?.(null);
                  }}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors ml-0.5 cursor-pointer leading-none text-xs font-bold"
                  title="Remover filtro de território"
                >
                  ×
                </button>
              )}
            </div>
          );
        })()}
      </div>

      {mode === 'cursos' && !modoGeografico && (
        <div className="absolute bottom-3 left-3 z-[400] bg-surface/95 dark:bg-surface/95 backdrop-blur-md rounded-xl px-3.5 py-3 border border-border/80 shadow-card pointer-events-auto min-w-[308px]">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <span className={`text-caption font-semibold tracking-tight leading-none ${filtroSemiarido ? 'text-amber-800 dark:text-amber-300' : 'text-text-primary'}`}>
              {selectedTerritory ? 'Densidade Relativa Municipal (Log)' : 'Densidade de Cursos'}
            </span>
            {selectedTerritory && (
              <span className={`text-[10px] font-medium leading-none px-1.5 py-0.5 rounded-md tnum ${filtroSemiarido ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300' : 'bg-primary-500/10 text-primary-600 dark:text-primary-300'}`}>
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

      {/* CONTROLES DO MAPA */}
      <div className="absolute top-3 right-3 z-[400] flex items-start gap-2">
        {mode === 'cadeias' && (
          <button
            type="button"
            onClick={() => setShowAllConnections((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control text-caption font-semibold transition-all border cursor-pointer select-none shadow-card ${showAllConnections
              ? (filtroSemiarido
                ? 'bg-amber-600 text-white border-amber-600 shadow-card'
                : 'bg-primary-700 text-white border-primary-700 shadow-card')
              : (filtroSemiarido
                ? 'bg-surface text-amber-800 dark:text-amber-300 border-border hover:bg-surface-soft hover:border-amber-400'
                : 'bg-surface text-text-primary border-border hover:bg-surface-soft hover:border-primary-500')
              }`}
          >
            <Network size={13} className={showAllConnections ? (filtroSemiarido ? 'text-amber-200' : 'text-primary-200') : (filtroSemiarido ? 'text-amber-600' : 'text-primary-600')} />
            <span>Teia de Conexões</span>
          </button>
        )}

        {/* TOGGLE MAPA GEOGRÁFICO (SEM CAMADA DE TERRITÓRIOS POR CIMA) */}
        <button
          type="button"
          onClick={toggleModoGeografico}
          title={
            modoGeografico
              ? 'Voltar para camada de Territórios'
              : 'Ver mapa real com precisão geográfica (sem camada por cima)'
          }
          className={`relative flex items-center gap-2 h-[32px] px-2.5 rounded-control text-caption font-semibold transition-colors duration-150 cursor-pointer border select-none ${
            modoGeografico
              ? 'bg-surface border-primary-500/40 text-primary-700 dark:text-primary-300 shadow-card'
              : 'bg-surface border-border text-text-secondary hover:border-border-strong hover:text-text-primary shadow-card'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 shadow-xs ${
              modoGeografico
                ? 'bg-primary-600 text-white'
                : 'bg-surface-soft border border-border text-text-muted'
            }`}
          >
            <Globe size={13} strokeWidth={2.1} />
          </span>
          <span className="truncate text-left">Geográfico</span>
        </button>

        {/* BOTÃO MODO SEMIÁRIDO AO LADO DO EXPANDIR (PADRÃO VISÃO GERAL) */}
        {Boolean(setFiltroSemiarido) && (
          <button
            type="button"
            onClick={() => setFiltroSemiarido(prev => !prev)}
            title={filtroSemiarido ? 'Voltar ao Modo Normal' : 'Ativar Modo Semiárido'}
            className={`tour-toggle-semiarido relative flex items-center gap-2 h-[32px] w-[114px] min-w-[114px] max-w-[114px] px-2 rounded-control text-caption font-semibold transition-colors duration-150 cursor-pointer border select-none ${filtroSemiarido
              ? 'bg-surface border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-card'
              : 'bg-surface border-border text-text-secondary hover:border-border-strong hover:text-text-primary shadow-card'
              }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 shadow-xs ${filtroSemiarido
              ? 'bg-amber-500 text-white'
              : 'bg-surface-soft border border-border text-text-muted'
              }`}>
              {filtroSemiarido ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
                  <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                  <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
                  <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300 block" />
              )}
            </span>
            <span className="truncate flex-1 text-left">{filtroSemiarido ? 'Semiárido' : 'Normal'}</span>
          </button>
        )}

        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            title={isExpanded ? 'Recolher mapa' : 'Expandir mapa'}
            aria-label={isExpanded ? 'Recolher mapa' : 'Expandir mapa'}
            className={`flex items-center justify-center w-[32px] h-[32px] rounded-control transition-all border cursor-pointer select-none shadow-card ${isExpanded
              ? (filtroSemiarido
                ? 'bg-amber-600 text-white border-amber-600 shadow-card'
                : 'bg-primary-700 text-white border-primary-700 shadow-card')
              : (filtroSemiarido
                ? 'bg-surface text-amber-800 dark:text-amber-300 border-border hover:bg-surface-soft hover:border-amber-400'
                : 'bg-surface text-text-primary border-border hover:bg-surface-soft hover:border-primary-500')
              }`}
          >
            {isExpanded ? (
              <Shrink size={15} className={filtroSemiarido ? 'text-amber-200' : 'text-primary-200'} />
            ) : (
              <Expand size={15} className={filtroSemiarido ? 'text-amber-600' : 'text-primary-600'} />
            )}
          </button>
        )}
      </div>

      <div className="absolute bottom-3 right-3 z-[400] flex flex-col bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
        <button
          onClick={() => mapRef.current?.zoomIn(0.75)}
          aria-label="Aproximar mapa"
          className={`w-9 h-9 flex items-center justify-center transition-all duration-150 ease-out active:scale-[0.99] border-b border-zinc-200/80 dark:border-zinc-800 cursor-pointer ${filtroSemiarido ? 'text-amber-800 dark:text-amber-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70' : 'text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70'
            }`}
          title="Aproximar"
        >
          <span className="text-lg font-medium leading-none">+</span>
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut(0.75)}
          aria-label="Afastar mapa"
          className={`w-9 h-9 flex items-center justify-center transition-all duration-150 ease-out active:scale-[0.99] border-b border-zinc-200/80 dark:border-zinc-800 cursor-pointer ${filtroSemiarido ? 'text-amber-800 dark:text-amber-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70' : 'text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70'
            }`}
          title="Afastar"
        >
          <span className="text-lg font-medium leading-none">−</span>
        </button>
        <button
          onClick={() => {
            setPinnedAssetId(null);
            setActiveCategoryKeys(new Set(allCategories.map((c) => c.key)));
            mapRef.current?.flyTo([-13.0, -41.6], 5.75, { duration: 0.55 });
            onSelectTerritory(null);
            onSelectIES?.(null);
            onSelectSegmento?.(null);
            onSelectTipo?.('todos');
            onSelectCategory?.('todas');
            onAssetClick?.(null);
          }}
          aria-label="Limpar filtros"
          className={`w-9 h-9 flex items-center justify-center transition-all duration-150 ease-out active:scale-[0.99] cursor-pointer ${hasActiveFilter
            ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
            : (filtroSemiarido ? 'text-amber-800 dark:text-amber-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70' : 'text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70')
            }`}
          title="Limpar filtros e centralizar Bahia (Esc)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m5 11 9 9" />
          </svg>
        </button>
      </div>

      {/* TOOLTIP FLUTUANTE ACELERADO POR GPU (ZERO RE-RENDERS NO MOUSEMOVE) */}
      {hoveredInfo && (
        <div
          ref={tooltipDomRef}
          className="absolute top-0 left-0 z-[1000] rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2.5 shadow-md pointer-events-none will-change-transform"
          style={{ width: 216 }}
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {selectedTerritory ? 'Município' : 'Território de Identidade'}
            </span>
            <span className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 leading-snug truncate">
              {hoveredInfo.label}
            </span>
            <div className="flex items-center justify-between pt-1.5 mt-0.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Total {hoveredInfo.sub}
              </span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {hoveredInfo.count} {hoveredInfo.unit}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}