import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import * as topojson from 'topojson-client';
import territoriosMunicipios from './utils/territorioMunicipios.json';
import { fetchTerritorialData, clearTerritorialCache, getAssistenciaStatusLabel } from './utils/territorialDataService';

// ========== CONFIGURAÇÕES ==========
const SVG_W = 700;
const SVG_H = 700;
const PADDING = 20;

// Paleta moderna com base no verde institucional
const TERRITORY_COLORS = [
  '#94A3B8', '#CBD5E1', '#A5F3C3', '#6EE7B7', '#34D399', '#10B981', '#059669', '#047857',
  '#FCD34D', '#FBBF24', '#F59E0B', '#EF4444', '#EC489A', '#8B5CF6', '#6366F1', '#3B82F6',
  '#06B6D4', '#14B8A6', '#F97316', '#EAB308'
];

// ========== UTILITÁRIOS ==========
const normalizeName = (value) => {
  if (!value) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Mapa de cores por território (cacheado)
const buildTerritoryColorMap = () => {
  const map = {};
  territoriosMunicipios.territorios_de_identidade.forEach((territorio) => {
    map[normalizeName(territorio.nome)] = TERRITORY_COLORS[(territorio.id - 1) % TERRITORY_COLORS.length];
  });
  return map;
};

const territoryColorMap = buildTerritoryColorMap();

const buildMunicipioTerritoryMap = () => {
  const m = {};
  territoriosMunicipios.territorios_de_identidade.forEach((territorio) => {
    territorio.municipios.forEach((municipio) => {
      m[normalizeName(municipio)] = territorio.nome;
    });
  });
  return m;
};

// Função para desenhar paths (otimizada)
const getPathD = (geometry, project) => {
  if (!geometry) return '';
  const drawRing = (ring) =>
    ring.map(([x, y], i) => {
      const [px, py] = project([x, y]);
      return `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`;
    }).join(' ') + ' Z';

  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(drawRing).join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap(polygon => polygon.map(drawRing)).join(' ');
  }
  return '';
};

// ========== COMPONENTES REUTILIZÁVEIS ==========
const StatCard = ({ title, value, color, icon, trend }) => (
  <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 overflow-hidden">
    <div className="p-5 relative">
      <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }} />
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {trend && (
            <span className={`inline-flex items-center text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="p-3 rounded-full bg-slate-50 group-hover:scale-110 transition-transform" style={{ color }}>
          {icon}
        </div>
      </div>
    </div>
  </div>
);

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };
  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        placeholder="Buscar território..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
      />
      <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </form>
  );
};

const SkeletonLoader = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
    <div className="h-32 bg-slate-100 rounded-lg"></div>
  </div>
);

// ========== COMPONENTE PRINCIPAL ==========
const ConectaGovDashboard = () => {
  const [territorialData, setTerritorialData] = useState({ territories: [], summary: {} });
  const [mapFeatures, setMapFeatures] = useState([]);
  const [hoveredTerritory, setHoveredTerritory] = useState(null);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapContainerRef = useRef(null);

  // Memoização dos mapeamentos
  const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);
  const territoryDataMap = useMemo(() => {
    const map = {};
    (territorialData.territories || []).forEach((t) => { map[t.territory] = t; });
    return map;
  }, [territorialData]);

  // Carrega dados da API
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await fetchTerritorialData();
        setTerritorialData(data);
      } catch (err) {
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Carrega e processa o mapa TopoJSON
  useEffect(() => {
    fetch('/BA_(1)9396399957704198.json')
      .then((resp) => resp.json())
      .then((topology) => {
        const geo = topojson.feature(topology, topology.objects.BA);
        // Cálculo do bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        geo.features.forEach((feat) => {
          if (!feat.geometry) return;
          const coords = feat.geometry.type === 'Polygon' ? feat.geometry.coordinates.flat() : feat.geometry.coordinates.flat(2);
          coords.forEach(([x, y]) => {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          });
        });

        const width = SVG_W - 2 * PADDING;
        const height = SVG_H - 2 * PADDING;
        const scaleX = width / (maxX - minX);
        const scaleY = height / (maxY - minY);
        const scale = Math.min(scaleX, scaleY);
        const offsetX = (width - (maxX - minX) * scale) / 2;
        const offsetY = (height - (maxY - minY) * scale) / 2;

        const project = ([x, y]) => [
          PADDING + (x - minX) * scale + offsetX,
          PADDING + (maxY - y) * scale + offsetY
        ];

        const features = geo.features.map((feat) => {
          const municipio = feat.properties?.NOME || feat.properties?.nome || '';
          const territoryName = municipioTerritoryMap[normalizeName(municipio)] || 'Sem Território';
          const d = getPathD(feat.geometry, project);

          // Cálculo do centroide aproximado
          let sumX = 0, sumY = 0, count = 0;
          const coords = feat.geometry.type === 'Polygon' ? feat.geometry.coordinates.flat() : feat.geometry.coordinates.flat(2);
          coords.forEach(([x, y]) => {
            const [cx, cy] = project([x, y]);
            sumX += cx;
            sumY += cy;
            count++;
          });
          const centroid = count ? [sumX / count, sumY / count] : [0, 0];
          return { nome: municipio, territory: territoryName, d, centroid };
        });
        setMapFeatures(features);
      })
      .catch((err) => setError(err.message || 'Falha ao carregar mapa'));
  }, [municipioTerritoryMap]);

  // Agrupa polígonos por território para posicionar ícones
  const territoryPaths = useMemo(() => {
    const boundary = new Map();
    mapFeatures.forEach((m) => {
      if (!boundary.has(m.territory)) boundary.set(m.territory, []);
      boundary.get(m.territory).push(m);
    });
    return Array.from(boundary.entries()).map(([territory, features]) => {
      const points = features.map(f => f.centroid).filter(c => c[0] && c[1]);
      const centroid = points.length ? [
        points.reduce((a, v) => a + v[0], 0) / points.length,
        points.reduce((a, v) => a + v[1], 0) / points.length
      ] : [0, 0];
      return { territory, centroid, count: features.length };
    });
  }, [mapFeatures]);

  // Handlers do mapa com tooltip moderno
  const handleMouseMove = useCallback((e, territory) => {
    setHoveredTerritory(territory);
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tooltipWidth = 300;
    const tooltipHeight = 280;
    let x = e.clientX - rect.left + 12;
    let y = e.clientY - rect.top + 12;
    if (x + tooltipWidth > rect.width) x = Math.max(8, e.clientX - rect.left - tooltipWidth - 12);
    if (y + tooltipHeight > rect.height) y = Math.max(8, e.clientY - rect.top - tooltipHeight - 12);
    setTooltip({ visible: true, x, y });
  }, []);

  const handleMouseLeave = () => {
    setTooltip({ visible: false });
    setHoveredTerritory(null);
  };

  // Filtro de território por texto
  const [searchQuery, setSearchQuery] = useState('');
  const filteredTerritoryPaths = useMemo(() => {
    if (!searchQuery) return territoryPaths;
    const q = normalizeName(searchQuery);
    return territoryPaths.filter(t => normalizeName(t.territory).includes(q));
  }, [searchQuery, territoryPaths]);

  // Dados do território selecionado/hover
  const hoveredData = hoveredTerritory ? territoryDataMap[hoveredTerritory] : null;
  const selectedData = selectedTerritory ? territoryDataMap[selectedTerritory] : null;

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header com título */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              Conecta<span className="text-emerald-700">Gov</span>
            </h1>
            <p className="text-slate-500 text-sm">Monitoramento territorial de CT&I na Bahia</p>
          </div>
          <SearchBar onSearch={setSearchQuery} />
        </div>

        {loading && <SkeletonLoader />}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700">
            <p className="font-medium">Erro ao carregar dados</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPIs - linha superior */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Capacidade Territorial"
                value={selectedData ? selectedData.capacidade?.entidadesTotal || 0 : '-'}
                color="#059669"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
              />
              <StatCard
                title="Universidades"
                value={selectedData ? selectedData.capacidade?.universidades || 0 : '-'}
                color="#3B82F6"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}
              />
              <StatCard
                title="Empresas Dinamizadoras"
                value={selectedData ? selectedData.capacidade?.espacosDinamizadores || 0 : '-'}
                color="#F97316"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8" /></svg>}
              />
              <StatCard
                title="Índice IFDM"
                value={selectedData?.desenvolvimento?.ifdmTi != null ? selectedData.desenvolvimento.ifdmTi.toFixed(3) : '-'}
                color="#8B5CF6"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
              />
            </div>

            {/* Área principal: Mapa + Detalhes */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Mapa */}
              <div className="lg:flex-[2] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-emerald-800 px-5 py-3 text-white flex justify-between items-center">
                  <span className="font-semibold tracking-wide text-sm">
                    TERRITÓRIO SELECIONADO: <span className="text-emerald-200">{selectedTerritory || 'Nenhum'}</span>
                  </span>
                  {selectedTerritory && (
                    <button
                      onClick={() => setSelectedTerritory(null)}
                      className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div ref={mapContainerRef} className="relative bg-slate-50 flex justify-center items-center p-4 min-h-[500px]">
                  <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto max-h-[600px] cursor-pointer">
                    {mapFeatures.map((feat, idx) => {
                      const isHovered = hoveredTerritory === feat.territory;
                      const isSelected = selectedTerritory === feat.territory;
                      const normalized = normalizeName(feat.territory);
                      const baseColor = territoryColorMap[normalized] || '#CBD5E1';

                      let fill = baseColor;
                      let stroke = '#fff';
                      let strokeWidth = 0.5;
                      if (isHovered) {
                        fill = '#FDE047';
                        stroke = '#0f172a';
                        strokeWidth = 2;
                      } else if (isSelected) {
                        fill = baseColor;
                        stroke = '#0f766e';
                        strokeWidth = 3;
                      }

                      return (
                        <path
                          key={`${feat.nome}-${idx}`}
                          d={feat.d}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                          className="transition-all duration-200"
                          style={{ filter: isSelected ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' : 'none' }}
                          onMouseEnter={(e) => handleMouseMove(e, feat.territory)}
                          onMouseMove={(e) => handleMouseMove(e, feat.territory)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => setSelectedTerritory(feat.territory)}
                        />
                      );
                    })}
                    {/* Ícones de parques tecnológicos */}
                    {territoryPaths.map((terr) => {
                      const data = territoryDataMap[terr.territory];
                      if (!data?.capacidade?.parquesTecnologicos) return null;
                      const size = Math.min(12 + data.capacidade.parquesTecnologicos * 2, 24);
                      return (
                        <circle
                          key={`park-${terr.territory}`}
                          cx={terr.centroid[0]}
                          cy={terr.centroid[1]}
                          r={size / 2}
                          fill="rgba(220,38,38,0.9)"
                          stroke="white"
                          strokeWidth="2"
                          className="transition-transform hover:scale-110 cursor-pointer"
                          onMouseEnter={(e) => handleMouseMove(e, terr.territory)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => setSelectedTerritory(terr.territory)}
                        />
                      );
                    })}
                  </svg>

                  {/* Tooltip moderno */}
                  {tooltip.visible && hoveredTerritory && hoveredData && (
                    <div
                      className="absolute z-30 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200 p-4 w-72 pointer-events-none transition-all duration-150"
                      style={{ top: tooltip.y, left: tooltip.x }}
                    >
                      <h3 className="font-bold text-emerald-800 text-base mb-2 border-b border-slate-100 pb-1">{hoveredTerritory}</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span>Capacidade Total:</span><strong>{hoveredData.capacidade.entidadesTotal ?? 0}</strong></div>
                        <div className="flex justify-between"><span>Universidades:</span><span>{hoveredData.capacidade.universidades}</span></div>
                        <div className="flex justify-between"><span>Incubadoras:</span><span>{hoveredData.capacidade.incubadoras}</span></div>
                        <div className="flex justify-between"><span>Parques Tecnológicos:</span><span>{hoveredData.capacidade.parquesTecnologicos}</span></div>
                        <div className="flex justify-between"><span>IFDM Territorial:</span><strong>{hoveredData.desenvolvimento.ifdmTi?.toFixed(3) || 'N/A'}</strong></div>
                        <div className="flex justify-between"><span>Assistência Pública:</span><span className="px-2 py-0.5 rounded-full bg-slate-100">{getAssistenciaStatusLabel(hoveredData.assistenciaPublica.existe)}</span></div>
                        {hoveredData.cadeiasProdutivas?.length > 0 && (
                          <div className="pt-1">
                            <p className="font-semibold">Cadeias principais:</p>
                            <ul className="list-disc pl-4 text-slate-600">
                              {hoveredData.cadeiasProdutivas.slice(0, 2).map((c, i) => (
                                <li key={i} className="truncate">{c.cadeia}</li>
                              ))}
                              {hoveredData.cadeiasProdutivas.length > 2 && <li>+ {hoveredData.cadeiasProdutivas.length - 2}</li>}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Painel lateral de detalhes */}
              <div className="lg:flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-fit max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-4 border-b border-slate-100 z-10">
                  <h2 className="text-lg font-bold text-slate-800">Detalhamento</h2>
                  <p className="text-xs text-slate-500">Clique em um território no mapa para ver os indicadores</p>
                </div>
                <div className="p-5 space-y-6">
                  {selectedTerritory && selectedData ? (
                    <>
                      {/* Grid de métricas rápidas */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl text-center">
                          <p className="text-xs text-slate-500">Municípios</p>
                          <p className="text-xl font-bold">{selectedData.capacidade?.municipios || '-'}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl text-center">
                          <p className="text-xs text-slate-500">População</p>
                          <p className="text-xl font-bold">{selectedData.desenvolvimento?.populacaoTotal?.toLocaleString() || '-'}</p>
                        </div>
                      </div>

                      {/* Tabela de Capacidade */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8" /></svg>
                          Capacidade Territorial
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span>Universidades:</span><span className="font-medium">{selectedData.capacidade.universidades || 0}</span></div>
                          <div className="flex justify-between"><span>Campi Universitários:</span><span>{selectedData.capacidade.campiUniversitarios || 0}</span></div>
                          <div className="flex justify-between"><span>Institutos Federais:</span><span>{selectedData.capacidade.campiIFs || 0}</span></div>
                          <div className="flex justify-between"><span>Incubadoras:</span><span>{selectedData.capacidade.incubadoras || 0}</span></div>
                          <div className="flex justify-between"><span>Parques Tecnológicos:</span><span>{selectedData.capacidade.parquesTecnologicos || 0}</span></div>
                        </div>
                      </div>

                      {/* Cadeias produtivas */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Cadeias Produtivas</h3>
                        {selectedData.cadeiasProdutivas?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedData.cadeiasProdutivas.map((c, i) => (
                              <span key={i} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">{c.cadeia}</span>
                            ))}
                          </div>
                        ) : <p className="text-xs text-slate-400">Nenhuma cadeia identificada</p>}
                      </div>

                      {/* Semiárido */}
                      <div className="bg-emerald-50 p-4 rounded-xl">
                        <p className="text-xs text-emerald-700 font-medium">Pertencimento ao Semiárido</p>
                        <p className="text-2xl font-bold text-emerald-800">{selectedData.semiaridoPercentual?.toFixed(1)}%</p>
                        <p className="text-[10px] text-emerald-600 mt-1">dos municípios do território</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      <p>Nenhum território selecionado</p>
                      <p className="text-xs mt-1">Clique em uma região do mapa para ver os detalhes</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConectaGovDashboard;