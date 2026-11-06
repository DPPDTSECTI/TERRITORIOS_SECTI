import React, { useEffect, useMemo, useState, useRef, useCallback, useContext } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Globe } from 'lucide-react';

import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';
import { isMunicipioSemiarido } from '../../constants/semiarido';
import { DataContext } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useMapTheme } from './mapTheme';
import { getCachedBahiaTopologia, loadBahiaTopologia } from './bahiaTopologiaCache';
import { normalizeName } from './side/mapGeoUtils';

// Buffer equilibrado (65% além da tela) para evitar cortes ao afastar o zoom sem sobrecarregar a GPU
if (typeof L !== 'undefined' && L.Renderer) {
  L.Renderer.prototype.options.padding = 0.65;
  if (L.SVG) L.SVG.prototype.options.padding = 0.65;
  if (L.Canvas) L.Canvas.prototype.options.padding = 0.65;
}

// Paleta Soft Blue & Teal com Alto Contraste Geográfico entre Territórios Vizinhos (Modo Normal)
const TERRITORY_COLORS = [
  '#1D3557', // 0: Bacia do Rio Grande (Deep Navy)
  '#38BDF8', // 1: Bacia do Rio Corrente (Sky Blue vibrante - contrasta com o 0)
  '#0D9488', // 2: Velho Chico (Teal rico - contrasta com 0 e 1)
  '#1E40AF', // 3: Sertão do São Francisco (Royal Blue profundo)
  '#7DD3FC', // 4: Piemonte Norte do Itapicuru (Celeste suave)
  '#0F766E', // 5: Itaparica (Teal floresta profundo)
  '#2563EB', // 6: Irecê (Cobalto vibrante)
  '#A8DADC', // 7: Chapada Diamantina (Teal pastel luminoso)
  '#334155', // 8: Piemonte da Diamantina (Slate escuro elegante)
  '#0284C7', // 9: Sisal (Azul Oceano)
  '#93C5FD', // 10: Bacia do Jacuípe (Azul Gelo suave)
  '#1E293B', // 11: Semiárido Nordeste II (Grafite Navy profundo)
  '#14B8A6', // 12: Litoral Norte e Agreste Baiano (Teal vibrante)
  '#38BDF8', // 13: Portal do Sertão (Céu luminoso)
  '#1D3557', // 14: Metropolitano de Salvador (Navy imponente)
  '#5EEAD4', // 15: Recôncavo (Turquesa suave)
  '#1E40AF', // 16: Baixo Sul (Safira profundo)
  '#93C5FD', // 17: Vale do Jiquiriçá (Azul suave)
  '#475569', // 18: Piemonte do Paraguaçu (Slate intermediário)
  '#0284C7', // 19: Médio Rio de Contas (Azul Mediterrâneo)
  '#1E293B', // 20: Sudoeste Baiano (Azul Meia-Noite)
  '#38BDF8', // 21: Sertão Produtivo (Azul Céu claro - contrasta com 20 e 2)
  '#0D9488', // 22: Bacia do Paramirim (Teal Médio)
  '#60A5FA', // 23: Médio Sudoeste da Bahia (Azul Real luminoso)
  '#0F766E', // 24: Litoral Sul (Teal profundo)
  '#38BDF8', // 25: Costa do Descobrimento (Azul Mar claro)
  '#1D3557'  // 26: Extremo Sul (Deep Navy)
];

// Paleta Ampliada e Contrastante de Tons de Amarelo, Dourado, Âmbar e Ocre para o Semiárido
const SEMIARIDO_TERRITORY_COLORS = [
  '#F6E05E', // 0: Bacia do Rio Grande (amarelo quente)
  '#B85D19', // 1: Bacia do Rio Corrente (âmbar acobreado)
  '#EAB308', // 2: Velho Chico (girassol vibrante)
  '#78350F', // 3: Sertão do São Francisco (castanho âmbar profundo)
  '#FEE140', // 4: Piemonte Norte do Itapicuru (amarelo citrino)
  '#CA8A04', // 5: Itaparica (ouro envelhecido)
  '#C67800', // 6: Irecê (açafrão escuro)
  '#FDE68A', // 7: Chapada Diamantina (amarelo pastel iluminado)
  '#F59E0B', // 8: Piemonte da Diamantina (âmbar clássico)
  '#C2410C', // 9: Sisal (âmbar terracota)
  '#FFF59D', // 10: Bacia do Jacuípe (amarelo creme suave)
  '#FDE047', // 11: Semiárido Nordeste II (amarelo canário)
  '#B8860B', // 12: Litoral Norte e Agreste Baiano (goldenrod escuro)
  '#FACC15', // 13: Portal do Sertão (amarelo ouro vibrante)
  '#92400E', // 14: Metropolitano de Salvador (castanho âmbar)
  '#FEF08A', // 15: Recôncavo (amarelo manteiga suave)
  '#CD7F32', // 16: Baixo Sul (bronze dourado)
  '#FBBF24', // 17: Vale do Jiquiriçá (calêndula / ouro solar)
  '#A16207', // 18: Piemonte do Paraguaçu (ocre dourado)
  '#854D0E', // 19: Médio Rio de Contas (ocre escuro)
  '#ECC94B', // 20: Sudoeste Baiano (trigo dourado)
  '#D97706', // 21: Sertão Produtivo (ouro mostarda)
  '#9A3412', // 22: Bacia do Paramirim (caramelo tostado)
  '#D48806', // 23: Médio Sudoeste da Bahia (mel queimado)
  '#F5D061', // 24: Litoral Sul (ouro areia)
  '#B45309', // 25: Costa do Descobrimento (âmbar conhaque)
  '#FCD34D'  // 26: Extremo Sul (damasco dourado)
];

const GEOGRAPHICAL_ORDER = [
  'Bacia do Rio Grande', 'Bacia do Rio Corrente', 'Velho Chico', 'Sertão do São Francisco',
  'Piemonte Norte do Itapicuru', 'Itaparica', 'Irecê', 'Chapada Diamantina',
  'Piemonte da Diamantina', 'Sisal', 'Bacia do Jacuípe', 'Semiárido Nordeste II',
  'Litoral Norte e Agreste Baiano', 'Portal do Sertão', 'Metropolitano de Salvador',
  'Recôncavo', 'Baixo Sul', 'Vale do Jiquiriçá', 'Piemonte do Paraguaçu',
  'Médio Rio de Contas', 'Sudoeste Baiano', 'Sertão Produtivo', 'Bacia do Paramirim',
  'Médio Sudoeste da Bahia', 'Litoral Sul', 'Costa do Descobrimento', 'Extremo Sul'
];

const uniqueTerritories = Object.values(
  municipiosDB.reduce((acc, row) => {
    if (!acc[row.id_territorio]) {
      acc[row.id_territorio] = { id: row.id_territorio, nome: row.nome_territorio };
    }
    return acc;
  }, {})
).sort((a, b) => {
  const indexA = GEOGRAPHICAL_ORDER.indexOf(a.nome);
  const indexB = GEOGRAPHICAL_ORDER.indexOf(b.nome);
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  return indexA - indexB;
});

const territoryColorMap = {};
const semiaridoTerritoryColorMap = {};
uniqueTerritories.forEach((territorio, index) => {
  territoryColorMap[territorio.id] = TERRITORY_COLORS[index] || '#333333';
  semiaridoTerritoryColorMap[territorio.id] = SEMIARIDO_TERRITORY_COLORS[index] || '#F59E0B';
});

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
  onToggleSemiarido = null
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

  const [topologia, setTopologia] = useState(() => getCachedBahiaTopologia());
  const [loading, setLoading] = useState(() => !getCachedBahiaTopologia());

  const [currentZoom, setCurrentZoom] = useState(5.8);
  const isZoomedIn = currentZoom >= 6.75;

  const [hoveredTerritoryId, setHoveredTerritoryId] = useState(null);
  const [hoveredMunicipalityId, setHoveredMunicipalityId] = useState(null);
  const [isMunListExpanded, setIsMunListExpanded] = useState(false);

  const geoJsonLayerRef = useRef(null);
  const selectedMunLayerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layersByTerritory = useRef({});
  const tooltipDomRef = useRef(null);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });

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

  // ResizeObserver para manter o canvas do Leaflet nítido em qualquer mudança de layout
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
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

  // Estilo da camada base (Territórios mesclados ou Municípios quando em zoom profundo sem seleção)
  const styleBaseFeature = useCallback(
    (feature) => {
      const idTer = Number(feature.properties.id_territorio);
      if (!idTer) return { fillOpacity: 0.1, stroke: false, fillColor: '#fee2e2' };

      const neutralFill = mapPalette.choropleth.zero;
      const strokeColor = mapPalette.stroke.default;
      const faintStroke = mapPalette.border;

      const isSelectedMap = selectedTerritory && Number(selectedTerritory.id_territorio) === idTer;

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
              fillColor: semiaridoTerritoryColorMap[idTer] || '#F59E0B',
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
          fillColor: matchesFilters ? territoryColorMap[idTer] || '#D6EAF8' : neutralFill,
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
          fillColor: isSemi ? semiaridoTerritoryColorMap[idTer] || '#F59E0B' : neutralFill,
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
        fillColor: matchesFilters ? territoryColorMap[idTer] || '#D6EAF8' : neutralFill,
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
    [selectedTerritory, isZoomedIn, filtroSemiarido, territoriesDynamicStats, mapPalette, isDark]
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

      let fillColor = territoryColorMap[idTer] || '#D6EAF8';
      let opacity = 0.95;

      if (filtroSemiarido) {
        if (isMunSemi) {
          fillColor = semiaridoTerritoryColorMap[idTer] || '#F59E0B';
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
    [filtroSemiarido, mapPalette]
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
    territoriosData,
    onSelectTerritory,
    mapPalette,
    styleBaseFeature,
    styleSelectedMunicipio
  });
  useEffect(() => {
    stateRef.current = {
      selectedTerritory,
      isZoomedIn,
      filtroSemiarido,
      territoriosData,
      onSelectTerritory,
      mapPalette,
      styleBaseFeature,
      styleSelectedMunicipio
    };
  });

  const updateTooltipPosition = useCallback((clientX, clientY) => {
    const container = mapContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const tooltipWidth = 244;
    const tooltipHeight = 165;
    const offset = 16;

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

  // Posiciona o tooltip imediatamente quando ele monta no DOM
  useEffect(() => {
    if (hoveredTerritoryId && tooltipDomRef.current) {
      const { x, y } = lastPointerPosRef.current;
      tooltipDomRef.current.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    }
  }, [hoveredTerritoryId, hoveredMunicipalityId]);

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
          const { selectedTerritory: selTer, isZoomedIn: zoomed, mapPalette: palette } = stateRef.current;
          const isSelectedMap = selTer && Number(selTer.id_territorio) === idTer;
          if (selTer && isSelectedMap) return;

          if (e.originalEvent) {
            updateTooltipPosition(e.originalEvent.clientX, e.originalEvent.clientY);
          }

          if (!selTer && !zoomed) {
            setHoveredTerritoryId(idTer);
            setHoveredMunicipalityId(null);

            layersByTerritory.current[idTer]?.forEach((l) => {
              l.setStyle({
                fillOpacity: 1.0,
                weight: 2.2,
                color: palette.stroke.hover
              });
              if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                l.bringToFront();
              }
            });
          } else {
            setHoveredTerritoryId(idTer);
            setHoveredMunicipalityId(feature.properties.id_municipio || null);
            e.target.setStyle({
              fillOpacity: selTer ? 0.72 : 1,
              color: palette.stroke.hover,
              weight: 2.0
            });
          }
        },
        mouseout: (e) => {
          const { selectedTerritory: selTer, isZoomedIn: zoomed, styleBaseFeature: styleFn } = stateRef.current;
          if (!selTer && !zoomed) {
            layersByTerritory.current[idTer]?.forEach((l) => {
              l.setStyle(styleFn(l.feature));
            });
          } else {
            e.target.setStyle(styleFn(feature));
          }
          setHoveredTerritoryId(null);
          setHoveredMunicipalityId(null);
        },
        click: (e) => {
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
    [selectTerritoryById, updateTooltipPosition]
  );

  const onEachSelectedMunicipioFeature = useCallback(
    (feature, layer) => {
      const idTer = Number(feature.properties.id_territorio);
      if (!idTer) return;

      layer.on({
        mouseover: (e) => {
          if (e.originalEvent) {
            updateTooltipPosition(e.originalEvent.clientX, e.originalEvent.clientY);
          }
          setHoveredTerritoryId(idTer);
          setHoveredMunicipalityId(feature.properties.id_municipio || null);
          e.target.setStyle({
            fillOpacity: 1,
            color: stateRef.current.mapPalette.stroke.hover,
            weight: 2.4
          });
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            e.target.bringToFront();
          }
        },
        mouseout: (e) => {
          e.target.setStyle(stateRef.current.styleSelectedMunicipio(feature));
          setHoveredTerritoryId(null);
          setHoveredMunicipalityId(null);
        },
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          selectTerritoryById(idTer, feature.properties.nome_territorio);
        }
      });
    },
    [selectTerritoryById, updateTooltipPosition]
  );

  const hoveredData = useMemo(
    () => (hoveredTerritoryId ? territoriosData.find((t) => Number(t.id_territorio) === hoveredTerritoryId) : null),
    [hoveredTerritoryId, territoriosData]
  );

  const fallbackName = useMemo(
    () => (hoveredTerritoryId ? uniqueTerritories.find((t) => t.id === hoveredTerritoryId)?.nome : ''),
    [hoveredTerritoryId]
  );

  const hoveredMunName = hoveredMunicipalityId ? municipioByIdMap[hoveredMunicipalityId]?.nome_municipio : null;

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
      className="tour-map relative isolate w-full h-full min-h-0 flex items-center justify-center bg-surface-sunken rounded-card overflow-hidden select-none z-10"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setHoveredTerritoryId(null);
        setHoveredMunicipalityId(null);
      }}
    >
      {loading || !baseLayerData ? (
        <div className="flex flex-col items-center text-primary-600">
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
          minZoom={modoGeografico ? 4.0 : 5.0}
          maxZoom={modoGeografico ? 19 : 11}
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
                  [-19.0, -47.5],
                  [-7.5, -36.5]
                ]
          }
          maxBoundsViscosity={modoGeografico ? 0.3 : 0.85}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={false}
          className="w-full h-full outline-none z-0"
          style={{ background: 'rgb(var(--color-surface-sunken))' }}
        >
          <MapInteractionTracker
            onZoomChange={setCurrentZoom}
            onBackgroundClick={() => {
              if (selectedTerritory) onSelectTerritory(null);
            }}
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

          {!modoGeografico && (
            <GeoJSON
              key={baseLayerKey}
              ref={geoJsonLayerRef}
              data={baseLayerData}
              style={styleBaseFeature}
              onEachFeature={onEachBaseFeature}
            />
          )}

          {/* Malha contínua de divisas municipais (renderizada apenas quando o zoom está aproximado) */}
          {!modoGeografico && !selectedTerritory && isZoomedIn && allMunicipiosMesh && (
            <GeoJSON
              key={`all-mun-mesh-${filtroSemiarido ? 'semi' : 'normal'}-${isDark ? 'dark' : 'light'}`}
              data={allMunicipiosMesh}
              style={{
                color: filtroSemiarido ? (isDark ? '#F59E0B' : '#92400E') : isDark ? '#334666' : '#FFFFFF',
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

          {/* Contornos nítidos de TODOS os territórios de identidade na visão geral */}
          {!modoGeografico && !selectedTerritory && allTerritoryMesh && (
            <GeoJSON
              key={`all-territory-mesh-${filtroSemiarido ? 'semi' : 'normal'}-${isDark ? 'dark' : 'light'}`}
              data={allTerritoryMesh}
              style={{
                color: filtroSemiarido ? (isDark ? '#F59E0B' : '#78350F') : isDark ? '#334666' : '#FFFFFF',
                weight: filtroSemiarido ? 1.6 : 1.8,
                opacity: filtroSemiarido ? 0.7 : isDark ? 0.85 : 0.95,
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
                color: filtroSemiarido ? '#92400E' : isDark ? '#4a6288' : (modoGeografico ? '#64748B' : '#FFFFFF'),
                weight: modoGeografico ? 1.6 : 2.2,
                opacity: modoGeografico ? 0.6 : 1,
                fill: false,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              interactive={false}
            />
          )}

          {/* Destaque perimetral externo do território ao passar o mouse */}
          {hoveredTerritoryId && !selectedTerritory && !isZoomedIn && territoryMeshes[hoveredTerritoryId] && (
            <GeoJSON
              key={`hover-mesh-${hoveredTerritoryId}-${filtroSemiarido ? '1' : '0'}`}
              data={territoryMeshes[hoveredTerritoryId]}
              style={{
                color: filtroSemiarido ? '#92400E' : '#1D3557',
                weight: 3.2,
                opacity: 1,
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
              key={`selected-mesh-${selectedTerritory.id_territorio}-${filtroSemiarido ? '1' : '0'}`}
              data={territoryMeshes[selectedTerritory.id_territorio]}
              style={{
                color: filtroSemiarido ? '#78350F' : isDark ? '#60A5FA' : '#1D3557',
                weight: 3.0,
                opacity: 1,
                fill: false,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              interactive={false}
            />
          )}
        </MapContainer>
      )}

      {/* ================= CONTROLES DE NAVEGAÇÃO ================= */}
      <div className="absolute bottom-4 right-4 z-[400] flex flex-col bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
        <button
          onClick={() => mapRef.current?.zoomIn(0.75)}
          aria-label="Aproximar mapa"
          className="w-9 h-9 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-all duration-150 ease-out active:scale-[0.99] border-b border-zinc-200/80 dark:border-zinc-800 cursor-pointer"
          title="Aproximar"
        >
          <span className="text-lg font-medium leading-none">+</span>
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut(0.75)}
          aria-label="Afastar mapa"
          className="w-9 h-9 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-all duration-150 ease-out active:scale-[0.99] border-b border-zinc-200/80 dark:border-zinc-800 cursor-pointer"
          title="Afastar"
        >
          <span className="text-lg font-medium leading-none">−</span>
        </button>
        <button
          onClick={() => {
            if (geoJsonLayerRef.current) {
              const b = geoJsonLayerRef.current.getBounds();
              if (b.isValid()) {
                mapRef.current?.fitBounds(b, { padding: [14, 14], duration: 0.55 });
              }
            } else {
              mapRef.current?.flyTo([-12.8, -41.2], 5.8, { duration: 0.55, easeLinearity: 0.25 });
            }
            onSelectTerritory(null);
          }}
          aria-label="Limpar seleção e ver toda a Bahia"
          className={`w-9 h-9 flex items-center justify-center transition-all duration-150 ease-out active:scale-[0.99] cursor-pointer ${
            selectedTerritory
              ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
              : 'text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70'
          }`}
          title="Limpar seleção e centralizar Bahia (Esc)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
            <path d="M22 21H7" />
            <path d="m5 11 9 9" />
          </svg>
        </button>
      </div>

      {/* ================= TOGGLE GEOGRÁFICO + SEMIÁRIDO (CANTO SUPERIOR DIREITO) ================= */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
        <button
          type="button"
          onClick={toggleModoGeografico}
          title={
            modoGeografico
              ? 'Voltar para camada de Territórios'
              : 'Ver mapa real com precisão geográfica (sem camada por cima)'
          }
          className={`relative flex items-center gap-2 h-[32px] px-2.5 rounded-full text-caption font-semibold transition-all duration-150 cursor-pointer border select-none backdrop-blur-md ${
            modoGeografico
              ? (filtroSemiarido
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white border-amber-500/80 shadow-xs ring-1 ring-amber-500/30'
                : 'bg-primary-600 text-white border-primary-700 shadow-sm')
              : (filtroSemiarido
                ? 'border-amber-300/70 dark:border-amber-700/60 bg-white/90 dark:bg-zinc-900/90 text-amber-900/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-100 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 shadow-xs'
                : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 text-text-secondary hover:text-text-primary shadow-sm')
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 shadow-2xs ${
              modoGeografico
                ? (filtroSemiarido
                  ? 'bg-white text-amber-600 shadow-2xs'
                  : 'bg-white text-primary-600 shadow-2xs')
                : (filtroSemiarido
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/50'
                  : 'bg-surface-soft border border-border text-text-muted')
            }`}
          >
            <Globe size={13} strokeWidth={2.1} />
          </span>
          <span className="truncate text-left">Geográfico</span>
        </button>

        {Boolean(onToggleSemiarido) && (
          <button
            type="button"
            onClick={() => onToggleSemiarido && onToggleSemiarido(!filtroSemiarido)}
            title={filtroSemiarido ? 'Voltar ao Modo Normal' : 'Ativar Modo Semiárido'}
            className={`tour-toggle-semiarido relative flex items-center gap-2 h-[32px] w-[114px] min-w-[114px] max-w-[114px] px-2 rounded-full text-caption font-semibold transition-all duration-150 cursor-pointer border select-none backdrop-blur-md active:scale-[0.99] ${
              filtroSemiarido
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/30'
                : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 text-text-secondary hover:text-text-primary shadow-sm'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150 shadow-2xs ${
                filtroSemiarido
                  ? 'bg-white text-amber-600'
                  : 'bg-surface-soft border border-border text-text-muted'
              }`}
            >
              {filtroSemiarido ? (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
      </div>

      {/* ================= CAIXA LATERAL DE MUNICÍPIOS (LADO OPOSTO AO TERRITÓRIO) ================= */}
      {selectedTerritory && selectedTerritoryMunicipalities.length > 0 && (
        <div
          className={`absolute ${
            isTerritoryOnRight ? 'top-3.5 left-3.5' : 'top-[52px] right-3.5'
          } z-[400] w-60 max-h-[calc(100%-84px)] overflow-y-auto hide-scroll p-3.5 rounded-xl border bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800 shadow-sm transition-all duration-200 animate-soft-fade pointer-events-auto`}
        >
          <div className="flex justify-between items-center mb-2.5 border-b border-zinc-200/70 dark:border-zinc-800/70 pb-2.5">
            <div className="min-w-0 pr-2">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Municípios ({selectedTerritoryMunicipalities.length})
              </span>
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                {selectedTerritory.nome_territorio || selectedTerritory.territorio}
              </h4>
            </div>
            <button
              onClick={() => onSelectTerritory(null)}
              aria-label="Fechar seleção de território"
              className="text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-rose-500/10 rounded-lg p-1.5 shrink-0 cursor-pointer"
              title="Voltar para visão estadual (Esc)"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <ul className="flex flex-col gap-0.5">
            {municipalitiesToShow.map((m, idx) => (
              <li
                key={idx}
                className="text-xs font-medium flex items-center justify-between gap-2 text-zinc-700 dark:text-zinc-300 py-1 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 rounded-md px-2 cursor-default transition-colors"
              >
                <span className="truncate">{m}</span>
              </li>
            ))}
          </ul>
          {selectedTerritoryMunicipalities.length > 4 && (
            <button
              onClick={() => setIsMunListExpanded(!isMunListExpanded)}
              className="w-full mt-2.5 text-center text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white py-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 transition-colors cursor-pointer tabular-nums"
            >
              {isMunListExpanded ? 'Ver menos' : `Ver todos (${selectedTerritoryMunicipalities.length})`}
            </button>
          )}
        </div>
      )}

      {/* ================= TOOLTIP ACELERADO POR GPU (ZERO RE-RENDERS NO MOUSEMOVE) ================= */}
      {hoveredTerritoryId && (
        <div
          ref={tooltipDomRef}
          className="absolute top-0 left-0 z-[1000] overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-md pointer-events-none will-change-transform"
          style={{ width: 244 }}
        >
          <div
            className="h-1 w-full"
            style={{
              backgroundColor: filtroSemiarido
                ? semiaridoTerritoryColorMap[hoveredTerritoryId] || '#F59E0B'
                : territoryColorMap[hoveredTerritoryId] || 'rgb(var(--color-primary-600))'
            }}
          />
          <div className="p-3">
            <div className="flex flex-col mb-2.5">
              {hoveredMunName && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-0.5 truncate">
                  {hoveredMunName}
                </span>
              )}
              <h2 className="font-semibold text-sm text-zinc-950 dark:text-zinc-50 leading-snug truncate">
                {hoveredData ? hoveredData.territorio : fallbackName}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
                  Ativos CT&I
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {hoveredData?.ativos_cti || 0}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
                  Média IFDM
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {hoveredData?.media_ifdm
                    ? (Math.trunc(Number(hoveredData.media_ifdm) * 1000) / 1000).toFixed(3)
                    : '0.000'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
