import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as topojson from 'topojson-client';
import territoriosMunicipios from './utils/territorioMunicipios.json';
import { fetchConectaData, parseUploadedFile, clearSpreadsheetCache } from './utils/spreadsheetService';

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
  const [dataSource, setDataSource] = useState(null); // 'sharepoint' | 'upload' | 'cache'
  const [showUpload, setShowUpload] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // Indica atualização em background
  const [loadingData, setLoadingData] = useState(true); // Indica carregamento inicial dos dados
  
  const mapContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState(null);
  const [selectedMunicipio, setSelectedMunicipio] = useState(null);

  const municipioMap = useMemo(() => buildMunicipioMap(), []);
  const getMunicipioInfo = (nomeTopo) => municipioMap[simplifyName(nomeTopo)];
  const getMunicipioColor = (nomeTopo) => getMunicipioInfo(nomeTopo)?.color || '#94A3B8';

  // Handler para upload de arquivo Excel local
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
    // Limpar input para permitir reenvio do mesmo arquivo
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

  const totalPracas = useMemo(() => {
    return conectaList.reduce((acc, m) => acc + (m.pracas ? m.pracas.length : 0), 0);
  }, [conectaList]);

  const getPracas = (nomeMunicipio) => {
    const key = Object.keys(conectaData).find((k) => simplifyName(k) === simplifyName(nomeMunicipio));
    const pracas = key ? conectaData[key] : [];
    
    // Debug: mostrar quantas praças foram encontradas
    if (key && pracas.length > 0) {
      console.log(`[GetPracas] ${nomeMunicipio}: encontradas ${pracas.length} praças:`, pracas.map(p => p.nome_da_praca));
    } else if (key && pracas.length === 0) {
      console.warn(`[GetPracas] ${nomeMunicipio}: encontrado mas com 0 praças!`);
    }
    
    return pracas;
  };

  const loading = (mapFeatures.length === 0 && !mapError) || loadingData;

  useEffect(() => {
    let active = true;

    const topoPromise = fetch('/BA_(1)9396399957704198.json')
      .then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((topology) => active && setMapFeatures(buildPaths(topology)));

    // Callback para atualização em background
    const handleBackgroundUpdate = (newData) => {
      if (!active) return;
      
      console.log('[ConectaMap] ✓ Dados atualizados em background!');
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
        
        // Se usou cache expirado, marca como atualizando
        if (!fresh) {
          setIsUpdating(true);
        }
        
        // Debug: mostrar estrutura dos dados carregados
        console.log('[ConectaMap] Dados carregados:', {
          source,
          fresh,
          totalMunicipios: Object.keys(data).length,
          amostraMunicipios: Object.keys(data).slice(0, 3),
          estruturaAmostra: Object.keys(data).slice(0, 1).map(nome => ({
            nome,
            pracasCount: data[nome]?.length,
            primeiraProca: data[nome]?.[0]
          }))
        });
        
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
    
    <div className="flex flex-col md:flex-row h-auto md:h-[85vh] min-h-[700px] md:min-h-[600px] w-full bg-white font-sans border border-slate-300 rounded-lg overflow-hidden shadow-sm">
      
      
      <div className="w-full md:w-80 flex flex-col shrink-0 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 z-10">
        <div className="p-4 md:p-6 border-b border-slate-200 bg-white">
          <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">
            Programa Conecta Bahia
          </h1>
          <p className="text-[10px] md:text-xs text-slate-500 mt-1 mb-4 font-medium uppercase tracking-wide">
            Mapa de Cobertura Oficial
          </p>
          
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-md p-3 mb-4">
            <div>
              <span className="block text-xl md:text-2xl font-bold text-blue-800 leading-none">{conectaList.length}</span>
              <span className="text-[10px] uppercase font-bold text-blue-600 mt-1 block">Municípios Atendidos</span>
            </div>
            <div className="h-8 w-8 md:h-10 md:w-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-md p-3 mb-4">
            <div>
              <span className="block text-xl md:text-2xl font-bold text-green-800 leading-none">{coveredTerritories.length}</span>
              <span className="text-[10px] uppercase font-bold text-green-600 mt-1 block">Territórios Atendidos</span>
            </div>
            <div className="h-8 w-8 md:h-10 md:w-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-600">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18" /></svg>
            </div>
          </div>

          <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-md p-3 mb-4">
            <div>
              <span className="block text-xl md:text-2xl font-bold text-amber-800 leading-none">{totalPracas}</span>
              <span className="text-[10px] uppercase font-bold text-amber-600 mt-1 block">Praças Conectadas</span>
            </div>
            <div className="h-8 w-8 md:h-10 md:w-10 bg-white rounded-full flex items-center justify-center shadow-sm text-amber-600">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>




          {/* Indicador de atualização em background */}
          {isUpdating && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs text-green-800 leading-relaxed font-semibold">
                    Atualizando dados em segundo plano...
                  </p>
                  <p className="text-[10px] text-green-700 mt-0.5">
                    Os dados mais recentes estão sendo carregados
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Aviso quando usando planilha carregada */}
          {dataSource === 'sharepoint' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-2 mb-4">
              <div className="flex gap-2 items-center">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs text-green-800">
                  Dados atualizados do SharePoint
                </p>
              </div>
            </div>
          )}

          {/* Indicador de fonte de dados + Upload */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center justify-between">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            {dataSource === 'upload' && (
              <button
                onClick={() => {
                  clearSpreadsheetCache();
                  window.location.reload();
                }}
                className="text-[10px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors self-end"
                title="Voltar aos dados pré-carregados"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Limpar planilha
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar município..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 md:py-2.5 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md text-sm transition-all outline-none appearance-none"
            />
            <svg className="absolute left-3 top-2.5 md:top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-slate-50 max-h-[35vh] md:max-h-none">
          {filteredList.length === 0 ? (
            <p className="text-center text-sm text-slate-500 mt-4 font-medium">Nenhum registro encontrado.</p>
          ) : (
            filteredList.map((m, idx) => (
              <button
                key={idx}
                onClick={() => handleClickMunicipio(m.nome)}
                onMouseEnter={() => setHoveredNome(m.nome)}
                onMouseLeave={() => setHoveredNome(null)}
                className={`w-full text-left px-3 py-2.5 mb-1 rounded-md transition-all flex items-center justify-between outline-none ${sameMunicipio(selectedMunicipio, m.nome) ? 'bg-blue-700 text-white shadow-md md:ring-2 ring-blue-400' : sameMunicipio(hoveredNome, m.nome) ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-700 active:bg-slate-300'}`}
              >
                <span className="text-sm font-medium truncate pr-2">
                  {m.nome}
                </span>
                {(sameMunicipio(hoveredNome, m.nome) || sameMunicipio(selectedMunicipio, m.nome)) && (
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      
      <div className="flex-1 min-h-[400px] relative bg-[#F8FAFC] flex flex-col touch-none">
        
        
        <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-sm border border-slate-200 pointer-events-none">
          <h2 className="text-[10px] font-bold text-slate-800 uppercase mb-1.5">Legenda</h2>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A] border-2 border-white shadow-sm block"></span>
            <span className="text-[10px] md:text-xs text-slate-600 font-medium">Ponto de Conexão</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#E2E8F0] border border-slate-300 block"></span>
            <span className="text-[10px] md:text-xs text-slate-600 font-medium">Sem cobertura</span>
          </div>
        </div>

        
        <div className="absolute top-3 right-3 z-10 flex flex-col bg-white shadow-md rounded-md border border-slate-200 overflow-hidden">
          <button onClick={() => handleZoom(0.3)} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-bold border-b border-slate-200 text-lg" title="Aproximar">+</button>
          <button onClick={() => handleZoom(-0.3)} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-bold border-b border-slate-200 text-lg" title="Afastar">−</button>
          <button onClick={resetZoom} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 font-bold text-xl" title="Centralizar">⟳</button>
        </div>

        
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-base font-bold text-slate-700 mb-1">
                {loadingData ? 'Carregando dados...' : 'Carregando mapa...'}
              </p>
              <p className="text-xs text-slate-500">
                {loadingData ? 'Buscando informações do SharePoint' : 'Preparando cartografia'}
              </p>
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

        
        <div className="absolute bottom-4 right-4 bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex flex-col items-center z-10 max-w-[200px] hidden md:flex">
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

        
        {selectedMunicipio && (
          <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-80 bg-white p-4 rounded-xl shadow-2xl border border-blue-100 flex flex-col z-20 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-lg font-bold text-slate-800 leading-none">{selectedMunicipio}</span>
              <button 
                onClick={() => setSelectedMunicipio(null)}
                className="bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full p-1"
                aria-label="Fechar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {isConecta(selectedMunicipio) ? (
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Território de Identidade</span>
                  <span className="text-sm text-blue-800 font-medium">{getMunicipioInfo(selectedMunicipio)?.territorio || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 bg-green-50 p-2 rounded-lg border border-green-100">
                  <span className="w-3 h-3 rounded-full bg-green-600 animate-pulse"></span>
                  <span className="text-xs font-bold text-green-800 uppercase">Cobertura Ativa</span>
                </div>
                {(() => {
                  const pracas = getPracas(selectedMunicipio);
                  if (pracas.length === 0) return null;
                  
                  // Campos extras relevantes para exibição (não-financeiros)
                  const DISPLAY_FIELDS = [
                    // campos extras exibidos no card (não financeiros)
                    // 'status_instalacao', 'localizacao' e 'equipamento_fabricante' são omitidos
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
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Praças ({pracas.length})</span>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
                        {pracas.map((p, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-100 rounded-md px-2 py-2 flex flex-col gap-1">
                            <div className="flex items-start gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${p.projeto === 'Conecta I' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{p.projeto || 'N/A'}</span>
                              <span className="text-xs text-slate-700 leading-tight font-medium">{p.nome_da_praca || 'Sem nome'}</span>
                            </div>
                            {/* Campos extras da planilha */}
                            {dataSource !== 'static' && DISPLAY_FIELDS.map(({ key, label }) => {
                              const val = p[key];
                              if (!val) return null;
                              return (
                                <div key={key} className="flex items-baseline gap-1.5 pl-1">
                                  <span className="text-[8px] text-slate-400 uppercase font-semibold shrink-0">{label}:</span>
                                  <span className="text-[10px] text-slate-600 leading-tight">{val}</span>
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
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm text-slate-600 font-medium">Município sem pontos de cobertura instalados no momento.</span>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default ConectaGovDashboard;