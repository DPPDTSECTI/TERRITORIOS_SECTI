import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as topojson from 'topojson-client';
import territoriosMunicipios from './utils/territorioMunicipios.json';
import { fetchConectaData, parseUploadedFile, clearSpreadsheetCache } from './utils/spreadsheetService';
import PDFExportButton from './src/components/PDFExportButton';

const normalize = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

const MUNICIPIO_ALIASES = {
  camacan: 'camaca',
};

const simplifyName = (s) => {
  const base = normalize(s).replace(/\s*[\-–].*$/g, '').trim();
  return MUNICIPIO_ALIASES[base] || base;
};
const sameMunicipio = (a, b) => simplifyName(a) === simplifyName(b);

const TERRITORY_COLORS = [
  '#EE2F5A', '#FBA751', '#CFDD90', '#0397DA', '#9CD3AF', '#EB278F', '#BE4481',
  '#BF8057', '#D7CB76', '#04AFED', '#b6b317', '#099D9E', '#F38735', '#A4C757',
  '#9493B5', '#01A859', '#5CC3D4', '#0F9296', '#FFCD37', '#9F637C', '#FDF588',
  '#F8AFAD', '#47887A', '#D9CB72', '#B0BD77', '#C5C7DB', '#C8C6C4',
];

const buildMunicipioMap = () => {
  const map = {};
  territoriosMunicipios.territorios_de_identidade.forEach((t) => {
    const color = TERRITORY_COLORS[t.id - 1] || '#94A3B8';
    t.municipios.forEach((m) => {
      map[simplifyName(m)] = { color, territorio: t.nome, territorioId: t.id };
    });
  });
  return map;
};

const SVG_W = 600;
const SVG_H = 600;
const PADDING = 20;

function buildPaths(topology) {
  const geojson = topojson.feature(topology, topology.objects.BA);
  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  geojson.features.forEach((f) => {
    if (!f.geometry) return;
    const rings = f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat(1);
    rings.forEach((ring) =>
      ring.forEach(([lon, lat]) => {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      })
    );
  });

  const rangeX = maxLon - minLon;
  const rangeY = maxLat - minLat;
  const drawW = SVG_W - 2 * PADDING;
  const drawH = SVG_H - 2 * PADDING;

  const project = ([lon, lat]) => [
    PADDING + ((lon - minLon) / rangeX) * drawW,
    PADDING + ((maxLat - lat) / rangeY) * drawH,
  ];

  const ringToD = (ring) =>
    ring.map(([lon, lat], i) => {
      const [x, y] = project([lon, lat]);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ') + ' Z';

  return geojson.features.filter((f) => f.geometry).map((f) => {
    const rings = f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat(1);
    const d = rings.map(ringToD).join(' ');

    let sumX = 0, sumY = 0, count = 0;
    rings.forEach((ring) =>
      ring.forEach(([lon, lat]) => {
        const [x, y] = project([lon, lat]);
        sumX += x; sumY += y; count += 1;
      })
    );
    const centroid = count > 0 ? [sumX / count, sumY / count] : [0, 0];
    return { nome: f.properties.NOME, geocodigo: f.properties.GEOCODIGO, d, centroid };
  });
}

const ConectaGovDashboard = () => {
  const [mapFeatures, setMapFeatures] = useState([]);
  const [mapError, setMapError] = useState(null);
  const [conectaList, setConectaList] = useState([]);
  const [conectaSet, setConectaSet] = useState(new Set());
  const [conectaData, setConectaData] = useState({});
  const [hoveredNome, setHoveredNome] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [dataSource, setDataSource] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const mapContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [selectedMunicipio, setSelectedMunicipio] = useState(null);

  const municipioMap = useMemo(() => buildMunicipioMap(), []);
  const getMunicipioInfo = (nomeTopo) => municipioMap[simplifyName(nomeTopo)];
  const getMunicipioColor = (nomeTopo) => getMunicipioInfo(nomeTopo)?.color || '#94A3B8';

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseUploadedFile(file);
      const list = Object.keys(data).map((nome) => ({ nome, pracas: data[nome] }));
      list.sort((a, b) => a.nome.localeCompare(b.nome));
      setConectaList(list);
      setConectaSet(new Set(list.map((m) => simplifyName(m.nome))));
      setConectaData(data);
      setDataSource('upload');
      setShowUpload(false);
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      alert('Erro ao processar o arquivo. Verifique se é um .xlsx válido.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const coveredTerritories = useMemo(() => {
    const set = new Set();
    conectaList.forEach((m) => {
      const info = getMunicipioInfo(m.nome);
      if (info && info.territorio) set.add(info.territorio);
    });
    return Array.from(set).sort();
  }, [conectaList, municipioMap]);

  const allTerritories = useMemo(() => {
    return territoriosMunicipios.territorios_de_identidade
      .map((t) => t.nome)
      .sort();
  }, []);

  const territoryColorMap = useMemo(() => {
    const map = {};
    territoriosMunicipios.territorios_de_identidade.forEach((t) => {
      const color = TERRITORY_COLORS[t.id - 1] || '#94A3B8';
      map[t.nome] = color;
    });
    return map;
  }, []);

  const missingTerritories = useMemo(() => {
    return allTerritories.filter((t) => !coveredTerritories.includes(t));
  }, [allTerritories, coveredTerritories]);

  const [showTerritoryModal, setShowTerritoryModal] = useState(false);

  const handleClickTerritories = () => {
    setShowTerritoryModal(true);
  };

  const totalPracas = useMemo(() => {
    return conectaList.reduce((acc, m) => acc + (m.pracas ? m.pracas.length : 0), 0);
  }, [conectaList]);

  const getPracas = (nomeMunicipio) => {
    const key = Object.keys(conectaData).find((k) => simplifyName(k) === simplifyName(nomeMunicipio));
    const pracas = key ? conectaData[key] : [];
    return pracas;
  };

  const loading = (mapFeatures.length === 0 && !mapError) || loadingData;

  useEffect(() => {
    let active = true;

    const topoPromise = fetch('/BA_(1)9396399957704198.json')
      .then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((topology) => active && setMapFeatures(buildPaths(topology)));

    const handleBackgroundUpdate = (newData) => {
      if (!active) return;
      const list = Object.keys(newData).map((nome) => ({ nome, pracas: newData[nome] }));
      list.sort((a, b) => a.nome.localeCompare(b.nome));

      setConectaList(list);
      setConectaSet(new Set(list.map((m) => simplifyName(m.nome))));
      setConectaData(newData);
      setDataSource('sharepoint');
      setIsUpdating(false);
    };

    const conectaPromise = fetchConectaData(handleBackgroundUpdate)
      .then(({ data, source, fresh }) => {
        if (!active) return;
        setDataSource(source);
        setLoadingData(false);

        if (!fresh) {
          setIsUpdating(true);
        }

        const list = Object.keys(data).map((nome) => ({ nome, pracas: data[nome] }));
        list.sort((a, b) => a.nome.localeCompare(b.nome));
        setConectaList(list);
        setConectaSet(new Set(list.map((m) => simplifyName(m.nome))));
        setConectaData(data);
      });

    Promise.all([topoPromise, conectaPromise]).catch((e) => {
      if (!active) return;
      console.error('Erro ao carregar dados:', e);
      setMapError('Não foi possível carregar os dados.');
      setLoadingData(false);
    });

    return () => { active = false; };
  }, []);

  const handleZoom = (delta) => setZoom((z) => Math.min(4, Math.max(0.5, z + delta)));
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); setSelectedMunicipio(null); };

  const handleClickMunicipio = (nomeMunicipio) => {
    const feature = mapFeatures.find((f) => sameMunicipio(f.nome, nomeMunicipio));
    if (!feature) return;

    const { centroid } = feature;
    const zoomLevel = 2.0;
    const newPan = {
      x: zoomLevel * (SVG_W / 2 - centroid[0]),
      y: zoomLevel * (SVG_H / 2 - centroid[1]),
    };

    setZoom(zoomLevel);
    setPan(newPan);
    setSelectedMunicipio(feature.nome);
  };

  const handlePointerDown = (e) => {
    setDragStart({ x: e.clientX, y: e.clientY });
    if (e.target.hasPointerCapture) e.target.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!dragStart) return;
    setPan((p) => ({ x: p.x + (e.clientX - dragStart.x), y: p.y + (e.clientY - dragStart.y) }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  const handlePointerUp = (e) => {
    setDragStart(null);
    if (e.target.hasPointerCapture) e.target.releasePointerCapture(e.pointerId);
  };

  const isConecta = (nomeTopo) => conectaSet.has(simplifyName(nomeTopo));

  const filteredList = conectaList.filter(m =>
    normalize(m.nome).includes(normalize(searchTerm))
  );

  useEffect(() => {
    if (!hoveredNome || !mapContainerRef.current || mapFeatures.length === 0) return;

    const feature = mapFeatures.find((f) => sameMunicipio(f.nome, hoveredNome));
    if (!feature) return;

    const [centroidX, centroidY] = feature.centroid;
    const transformedX = (1 - zoom) * SVG_W / 2 + pan.x + centroidX * zoom;
    const transformedY = (1 - zoom) * SVG_H / 2 + pan.y + centroidY * zoom;

    const containerRect = mapContainerRef.current.getBoundingClientRect();
    const scale = Math.min(containerRect.width / SVG_W, containerRect.height / SVG_H);
    const offsetX = (containerRect.width - SVG_W * scale) / 2;
    const offsetY = (containerRect.height - SVG_H * scale) / 2;

    setTooltipPos({
      x: offsetX + transformedX * scale,
      y: offsetY + transformedY * scale,
    });
  }, [hoveredNome, mapFeatures, zoom, pan]);

  return (
    // Removido min-h-screen para usar 100dvh e overflow-hidden. Com isso, a tela não rola mais, agindo como um App.
    <div className="flex flex-col md:flex-row h-[100dvh] md:h-[85vh] w-full bg-white font-sans border border-slate-300 md:rounded-lg overflow-hidden shadow-sm">
      
      {/* ========================================================================
        ÁREA DO MAPA (order-1 no mobile, order-2 no desktop)
        No mobile ocupa 55% da tela.
        ========================================================================
      */}
      <div className="order-1 md:order-2 flex flex-col relative h-[55%] md:h-auto md:flex-1 shrink-0 bg-[#F8FAFC] touch-none border-b md:border-b-0 border-slate-200">

        {/* Legenda - Ajustada para ficar compacta no mobile */}
        <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 z-10 bg-white/90 backdrop-blur-sm px-2 py-1.5 md:px-3 md:py-2 rounded-md shadow-sm border border-slate-200 pointer-events-none">
          <h2 className="text-[9px] md:text-[10px] font-bold text-slate-800 uppercase mb-1">Legenda</h2>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#1E3A8A] border border-white shadow-sm block"></span>
            <span className="text-[9px] md:text-xs text-slate-600 font-medium">Conexão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#E2E8F0] border border-slate-300 block"></span>
            <span className="text-[9px] md:text-xs text-slate-600 font-medium">Sem cobertura</span>
          </div>
        </div>

        {/* Controles de Zoom */}
        <div className="absolute top-3 right-3 z-10 flex flex-col bg-white shadow-md rounded-md border border-slate-200 overflow-hidden">
          <button onClick={() => handleZoom(0.3)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-bold border-b border-slate-200 text-lg" title="Aproximar">+</button>
          <button onClick={() => handleZoom(-0.3)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-bold border-b border-slate-200 text-lg" title="Afastar">−</button>
          <button onClick={resetZoom} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-bold text-xl" title="Centralizar">⟳</button>
        </div>

        {/* Botão de Exportação PDF */}
        <div className="absolute top-3 left-3 z-20">
          <div className="bg-white/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-1 md:p-0 rounded-lg md:rounded-none shadow-sm md:shadow-none border border-slate-200 md:border-transparent transition-all">
            <PDFExportButton
              municipiosData={conectaList.map((m) => ({
                nome: m.nome,
                quantidade: m.pracas ? m.pracas.length : 0,
                territorio: getMunicipioInfo(m.nome)?.territorio || 'N/A',
              }))}
              mapRef={mapContainerRef}
              className="shadow-sm md:shadow-md block scale-90 md:scale-100 origin-top-left"
            />
          </div>
        </div>

        {/* Container do SVG do Mapa */}
        <div
          ref={mapContainerRef}
          className="w-full h-full overflow-hidden outline-none"
          style={{ cursor: dragStart ? 'grabbing' : 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white z-20">
              {/* Skeleton do Mapa */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 600 600" className="w-3/4 h-3/4 animate-pulse">
                    {/* Forma genérica da Bahia */}
                    <path d="M 200 100 Q 250 80, 300 90 Q 350 85, 400 120 L 450 200 Q 460 280, 440 350 Q 430 420, 380 480 Q 320 520, 250 510 Q 180 500, 150 450 Q 120 380, 130 300 Q 140 220, 180 160 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2"/>
                    {/* Pontos simulados */}
                    <circle cx="250" cy="200" r="6" fill="#64748B" opacity="0.4" className="animate-pulse"/>
                    <circle cx="320" cy="250" r="6" fill="#64748B" opacity="0.4" className="animate-pulse" style={{animationDelay: '0.1s'}}/>
                    <circle cx="280" cy="320" r="6" fill="#64748B" opacity="0.4" className="animate-pulse" style={{animationDelay: '0.2s'}}/>
                    <circle cx="370" cy="280" r="6" fill="#64748B" opacity="0.4" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
                  </svg>
                </div>
              </div>
              
              {/* Spinner e mensagem */}
              <div className="relative z-10 flex flex-col items-center bg-white/90 backdrop-blur-sm px-8 py-6 rounded-xl shadow-lg border border-slate-200">
                <div className="relative mb-4">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-400 rounded-full animate-spin" style={{animationDuration: '1.5s', animationDirection: 'reverse'}} />
                </div>
                <p className="text-sm md:text-base font-bold text-slate-700 mb-1">
                  {loadingData ? 'Carregando dados...' : 'Carregando mapa...'}
                </p>
                <p className="text-[10px] md:text-xs text-slate-500 text-center px-4 max-w-xs">
                  {loadingData ? 'Processando informações do SharePoint em alta velocidade' : 'Preparando cartografia da Bahia'}
                </p>
                {loadingData && (
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                    <span>Otimizando dados...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center z-20 px-4 text-center">
              <div className="bg-red-50 text-red-700 px-6 py-4 rounded-md shadow-sm border border-red-200 text-sm font-semibold">
                {mapError}
              </div>
            </div>
          )}

          {mapFeatures.length > 0 && (
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full">
              <g
                className="transform-gpu transition-transform duration-500 ease-out"
                style={{
                  transform: `translate(${(1 - zoom) * SVG_W / 2 + pan.x}px, ${(1 - zoom) * SVG_H / 2 + pan.y}px) scale(${zoom})`,
                }}
              >
                {mapFeatures.map(({ nome, geocodigo, d }) => {
                  const isHovered = sameMunicipio(hoveredNome, nome);
                  const isSelected = sameMunicipio(selectedMunicipio, nome);
                  const hasConecta = isConecta(nome);
                  const baseColor = hasConecta ? getMunicipioColor(nome) : '#E2E8F0';

                  return (
                    <path
                      key={geocodigo}
                      d={d}
                      className="transition-colors duration-200 outline-none cursor-pointer"
                      style={{
                        fill: baseColor,
                        stroke: isHovered || isSelected ? '#0F172A' : '#FFFFFF',
                        strokeWidth: isHovered || isSelected ? '1.5' : '0.5',
                        strokeLinejoin: 'round',
                        opacity: (isHovered || isSelected) && !hasConecta ? 0.8 : 1,
                      }}
                      onClick={() => handleClickMunicipio(nome)}
                      onMouseEnter={() => setHoveredNome(nome)}
                      onMouseLeave={() => setHoveredNome(null)}
                    />
                  );
                })}

                {mapFeatures.map(({ nome, centroid }) => {
                  if (!isConecta(nome)) return null;
                  const isHovered = sameMunicipio(hoveredNome, nome);
                  const isSelected = sameMunicipio(selectedMunicipio, nome);
                  const fillColor = isSelected ? '#EF4444' : '#1E3A8A';

                  return (
                    <g key={`marker-${nome}`} className="pointer-events-none transition-transform duration-200" style={{ transform: isHovered || isSelected ? 'scale(1.5)' : 'scale(1)', transformOrigin: `${centroid[0]}px ${centroid[1]}px` }}>
                      <circle cx={centroid[0]} cy={centroid[1] + 1} r={4} fill="rgba(0,0,0,0.2)" />
                      <circle cx={centroid[0]} cy={centroid[1]} r={4} fill={fillColor} stroke="#FFFFFF" strokeWidth="1.5" />
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        {/* Tooltip Desktop */}
        {hoveredNome && !selectedMunicipio && (
          <div
            className="hidden md:flex absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full pb-3"
            style={{ top: tooltipPos.y, left: tooltipPos.x }}
          >
            <div className="bg-white px-4 py-3 rounded-md shadow-lg border border-slate-200 flex flex-col min-w-[160px]">
              <span className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">{hoveredNome}</span>
              {isConecta(hoveredNome) ? (
                <>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Território</span>
                  <span className="text-xs text-blue-700 font-medium mb-1 truncate">{getMunicipioInfo(hoveredNome)?.territorio || 'N/A'}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold mt-1">Praças</span>
                  <span className="text-xs text-green-700 font-medium">{getPracas(hoveredNome).length} ponto(s)</span>
                </>
              ) : (
                <span className="text-xs text-slate-500 font-medium mt-1">Sem cobertura</span>
              )}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full border-4 border-transparent border-t-white" />
            </div>
          </div>
        )}

        {/* QR Code Oculto no Mobile */}
        <div className="absolute bottom-4 right-4 bg-white p-4 rounded-xl shadow-lg border border-slate-200 items-center z-10 max-w-[200px] hidden md:flex flex-col">
          <img
            src="/img/qr-code-DIRETORIA DE TECNOLOGIA E CONECTIVIDADE - DTC.png"
            alt="QR Code Documento do Projeto"
            className="w-32 h-32 mb-3"
          />
          <div className="text-center">
            <p className="text-xs font-bold text-slate-800 mb-1">Escaneie o QR Code</p>
            <p className="text-[10px] text-slate-600 leading-tight">
              Acesse o documento completo do Projeto Conecta Bahia
            </p>
          </div>
        </div>

        {/* Card do Município Selecionado - Com max-height para não quebrar a tela dividida */}
        {selectedMunicipio && (
          <div className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-80 bg-white p-3 md:p-4 rounded-xl shadow-2xl border border-blue-100 flex flex-col z-20 animate-in slide-in-from-bottom-5 max-h-[90%] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-2 sticky top-0 bg-white z-10 pb-1">
              <span className="text-base md:text-lg font-bold text-slate-800 leading-none">{selectedMunicipio}</span>
              <button
                onClick={() => setSelectedMunicipio(null)}
                className="bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full p-1.5"
                aria-label="Fechar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {isConecta(selectedMunicipio) ? (
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold tracking-wider">Território de Identidade</span>
                  <span className="text-sm text-blue-800 font-medium">{getMunicipioInfo(selectedMunicipio)?.territorio || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 bg-green-50 p-2 rounded-lg border border-green-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse"></span>
                  <span className="text-[10px] md:text-xs font-bold text-green-800 uppercase">Cobertura Ativa</span>
                </div>
                {(() => {
                  const pracas = getPracas(selectedMunicipio);
                  if (pracas.length === 0) return null;

                  const DISPLAY_FIELDS = [
                    { key: 'status_homologacao_pontos', label: 'Homologação' },
                    { key: 'status_instalacao_com_link_pontos', label: 'Link Instalado' },
                    { key: 'data_instalacao', label: 'Data Instalação' },
                    { key: 'ano_implantacao', label: 'Ano' },
                    { key: 'cep', label: 'CEP' },
                    { key: 'populacao_beneficiada', label: 'Pop. Beneficiada' },
                    { key: 'status_inauguracao', label: 'Inauguração' },
                    { key: 'data_inauguracao', label: 'Data Inauguração' },
                    { key: 'observacao', label: 'Observação' },
                  ];

                  return (
                    <div className="flex flex-col mt-2">
                      <span className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Praças ({pracas.length})</span>
                      <div className="flex flex-col space-y-1.5">
                        {pracas.map((p, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-100 rounded-md px-2 py-2 flex flex-col gap-1">
                            <div className="flex items-start gap-2">
                              <span className={`text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${p.projeto === 'Conecta I' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{p.projeto || 'N/A'}</span>
                              <span className="text-[11px] md:text-xs text-slate-700 leading-tight font-medium">{p.nome_da_praca || 'Sem nome'}</span>
                            </div>
                            {dataSource !== 'static' && DISPLAY_FIELDS.map(({ key, label }) => {
                              const val = p[key];
                              if (!val) return null;
                              return (
                                <div key={key} className="flex items-baseline gap-1.5 pl-1">
                                  <span className="text-[7px] md:text-[8px] text-slate-400 uppercase font-semibold shrink-0">{label}:</span>
                                  <span className="text-[9px] md:text-[10px] text-slate-600 leading-tight">{val}</span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xs text-slate-600 font-medium">Município sem pontos instalados no momento.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================
        BARRA LATERAL / LISTA (order-2 no mobile, order-1 no desktop)
        No mobile ocupa 45% da tela (ficando exatamente abaixo do mapa).
        ========================================================================
      */}
      <div className="order-2 md:order-1 flex flex-col w-full md:w-80 h-[45%] md:h-auto bg-slate-50 border-t md:border-t-0 md:border-r border-slate-200 z-10 shrink-0">
        
        {/* Cabeçalho da Lista - Espaçamentos otimizados */}
        <div className="p-3 md:p-6 pb-2 md:pb-6 border-b border-slate-200 bg-white shadow-sm md:shadow-none z-10 relative shrink-0">
          <h1 className="text-base md:text-xl font-bold text-slate-800 leading-tight md:mb-1">
            Programa Conecta Bahia
          </h1>
          <p className="hidden md:block text-[10px] md:text-xs text-slate-500 mb-4 font-medium uppercase tracking-wide">
            Mapa de Cobertura Oficial
          </p>

          {/* Grid de Estatísticas: Horizontal no mobile (3 colunas), Vertical no desktop */}
          <div className="grid grid-cols-3 md:grid-cols-1 gap-1.5 md:gap-3 my-2 md:mb-4">
            {/* Box 1: Municípios */}
            <div className="flex flex-col md:flex-row items-center md:justify-between bg-blue-50 border border-blue-100 rounded-md py-1.5 px-1 md:p-3">
              <div className="text-center md:text-left">
                <span className="block text-base md:text-2xl font-bold text-blue-800 leading-none">{conectaList.length}</span>
                <span className="text-[8px] md:text-[10px] uppercase font-bold text-blue-600 mt-0.5 md:mt-1 block leading-tight">Municípios</span>
              </div>
              <div className="hidden md:flex h-10 w-10 bg-white rounded-full items-center justify-center shadow-sm text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
              </div>
            </div>

            {/* Box 2: Territórios */}
            <div onClick={handleClickTerritories} className="flex flex-col md:flex-row items-center md:justify-between bg-green-50 border border-green-100 rounded-md py-1.5 px-1 md:p-3 cursor-pointer hover:bg-green-100 transition-colors">
              <div className="text-center md:text-left">
                <span className="block text-base md:text-2xl font-bold text-green-800 leading-none">{coveredTerritories.length}</span>
                <span className="text-[8px] md:text-[10px] uppercase font-bold text-green-600 mt-0.5 md:mt-1 block leading-tight">Territórios</span>
              </div>
              <div className="hidden md:flex h-10 w-10 bg-white rounded-full items-center justify-center shadow-sm text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18" /></svg>
              </div>
            </div>

            {/* Box 3: Praças */}
            <div className="flex flex-col md:flex-row items-center md:justify-between bg-amber-50 border border-amber-100 rounded-md py-1.5 px-1 md:p-3">
              <div className="text-center md:text-left">
                <span className="block text-base md:text-2xl font-bold text-amber-800 leading-none">{totalPracas}</span>
                <span className="text-[8px] md:text-[10px] uppercase font-bold text-amber-600 mt-0.5 md:mt-1 block leading-tight">Praças</span>
              </div>
              <div className="hidden md:flex h-10 w-10 bg-white rounded-full items-center justify-center shadow-sm text-amber-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
          </div>

          {/* Avisos */}
          {isUpdating && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-2.5 mb-2 md:mb-4 flex items-center gap-2 shadow-sm">
              <div className="relative">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] md:text-xs text-blue-900 font-bold truncate">Atualizando dados...</p>
                <p className="text-[9px] md:text-[10px] text-blue-600 truncate">Sincronizando com SharePoint em segundo plano</p>
              </div>
            </div>
          )}

          {dataSource === 'cache' && !isUpdating && (
            <div className="hidden md:flex bg-amber-50 border border-amber-200 rounded-md p-2 mb-4 gap-2 items-center">
              <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-xs text-amber-800">Carregado do cache (ultra-rápido)</p>
            </div>
          )}

          {dataSource === 'sharepoint' && !isUpdating && (
            <div className="hidden md:flex bg-green-50 border border-green-200 rounded-md p-2 mb-4 gap-2 items-center">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-green-800">Dados atualizados do SharePoint</p>
            </div>
          )}

          {/* Input invisível e Limpeza de Cache */}
          {dataSource === 'upload' && (
            <div className="flex justify-end mb-2">
              <button
                onClick={() => { clearSpreadsheetCache(); window.location.reload(); }}
                className="text-[10px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                title="Voltar aos dados pré-carregados"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Limpar planilha local
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />

          {/* Barra de Pesquisa */}
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar município..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 md:py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md text-sm transition-all outline-none appearance-none"
            />
            <svg className="absolute left-2.5 top-2 md:top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {/* Lista de Municípios - Sempre visível, rolagem independente */}
        <div className="flex-1 overflow-y-auto p-1.5 md:p-2 custom-scrollbar bg-slate-50">
          {filteredList.length === 0 ? (
            <p className="text-center text-sm text-slate-500 mt-4 font-medium">Nenhum registro encontrado.</p>
          ) : (
            filteredList.map((m, idx) => (
              <button
                key={idx}
                onClick={() => handleClickMunicipio(m.nome)}
                onMouseEnter={() => setHoveredNome(m.nome)}
                onMouseLeave={() => setHoveredNome(null)}
                className={`w-full text-left px-3 py-2 md:py-2.5 mb-1 rounded-md transition-all flex items-center justify-between outline-none ${sameMunicipio(selectedMunicipio, m.nome) ? 'bg-blue-700 text-white shadow-md' : sameMunicipio(hoveredNome, m.nome) ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-700 active:bg-slate-300'}`}
              >
                <span className="text-xs md:text-sm font-medium truncate pr-2">{m.nome}</span>
                {(sameMunicipio(hoveredNome, m.nome) || sameMunicipio(selectedMunicipio, m.nome)) && (
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Modal Territórios - Mantido intacto */}
      {showTerritoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowTerritoryModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-800">Cobertura por Território</h3>
                <p className="text-[10px] md:text-sm text-slate-500 mt-0.5 md:mt-1">Visão geral das áreas de atuação</p>
              </div>
              <button onClick={() => setShowTerritoryModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" aria-label="Fechar">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar">
              <div className="mb-6 md:mb-8">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="p-1.5 bg-green-100 rounded-full text-green-600">
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h4 className="text-sm md:text-base font-semibold text-slate-800">Atendidos <span className="text-slate-400 text-xs md:text-sm font-normal ml-1">({coveredTerritories.length})</span></h4>
                </div>
                {coveredTerritories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {coveredTerritories.map((t) => (
                      <span key={t} className="flex items-center gap-1.5 text-[10px] md:text-sm font-medium px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shadow-sm border border-black/5" style={{ backgroundColor: territoryColorMap[t] || '#64748b', color: '#ffffff' }}>{t}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-slate-500 italic">Nenhum território atendido no momento.</p>
                )}
              </div>
              <hr className="border-slate-100 mb-6 md:mb-8" />
              <div>
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="p-1.5 bg-red-100 rounded-full text-red-600">
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h4 className="text-sm md:text-base font-semibold text-slate-800">Pendentes <span className="text-slate-400 text-xs md:text-sm font-normal ml-1">({missingTerritories.length})</span></h4>
                </div>
                {missingTerritories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {missingTerritories.map((t) => (
                      <span key={t} className="flex items-center gap-1.5 text-[10px] md:text-sm font-medium px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-default">{t}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-slate-500 italic">Todos os territórios foram cobertos! 🎉</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConectaGovDashboard;