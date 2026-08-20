import React, { useRef, useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as topojson from 'topojson-client';
import { MapPin, ExternalLink } from 'lucide-react';

// IMPORTAÇÃO DA BASE DE MUNICÍPIOS PARA MAPEAMENTO
import { municipiosDB } from '../../data/municipiosDB';

function normalizeName(value) {
  if (!value) return '';
  let norm = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const correcoes = {
    'dias davila': 'dias d avila',
    'santa teresinha': 'santa terezinha',
    'camaca': 'camacan',
    'xique xique': 'xiquexique',
    'muquem de sao francisco': 'muquem do sao francisco'
  };

  return correcoes[norm] || norm;
}

const buildMunicipioTerritoryMap = () => {
  const m = {};
  municipiosDB.forEach((row) => {
    m[normalizeName(row.nome_municipio)] = {
      id_municipio: row.id_municipio,
      id_territorio: row.id_territorio,
      nome_territorio: row.nome_territorio,
      nome_municipio: row.nome_municipio
    };
  });
  return m;
};

// === CUSTOM MARKER ICON ===
const createCustomIcon = (colorHex) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: ${colorHex}; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.2s; cursor: pointer;"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11]
});

// Camada dinâmica: rótulos aparecem após zoom avançado (>= 10)
function ZoomDependentTileLayer() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoomEnd = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoomEnd);
    return () => map.off('zoomend', handleZoomEnd);
  }, [map]);

  const showLabels = zoom >= 10;
  const url = showLabels
    ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';

  return <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url={url} />;
}

// Manipulador de clique no mapa vazio (desfixa o ativo e recua o zoom)
function MapClickHandler({ onClearPinned }) {
  const map = useMap();
  useMapEvents({
    click: (e) => {
      onClearPinned();
      if (e.originalEvent.target.classList.contains('leaflet-container') || e.originalEvent.target.tagName === 'path') {
        const currentZoom = map.getZoom();
        if (currentZoom > 6) {
          map.flyTo(map.getCenter(), Math.max(6, currentZoom - 2), { duration: 0.8 });
        }
      }
    }
  });
  return null;
}

// Centraliza a visão quando um ativo é focado externamente
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] !== 0) {
      const currentZoom = map.getZoom();
      const targetZoom = Math.max(currentZoom, 13);
      map.flyTo(coords, targetZoom, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

// Componente de Marcadores com Hover Popup, Fixação ao Clique e Zoom Inteligente
function AssetMarkers({ processedAtivos, pinnedAssetId, setPinnedAssetId }) {
  const map = useMap();

  return (
    <>
      {processedAtivos.map((ativo) => {
        if (ativo.lat === 0 || ativo.lng === 0 || isNaN(ativo.lat) || isNaN(ativo.lng)) return null;

        const isPinned = pinnedAssetId === ativo.id;

        return (
          <Marker 
            key={ativo.id} 
            position={[ativo.lat, ativo.lng]} 
            icon={createCustomIcon(ativo.corHex)}
            eventHandlers={{
              mouseover: (e) => {
                e.target.openPopup();
              },
              mouseout: (e) => {
                // Só fecha no mouseout se o ativo não estiver fixado
                if (pinnedAssetId !== ativo.id) {
                  e.target.closePopup();
                }
              },
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                setPinnedAssetId(ativo.id);
                e.target.openPopup();

                const currentZoom = map.getZoom();
                const targetZoom = Math.max(currentZoom, 13);
                map.flyTo([ativo.lat, ativo.lng], targetZoom, { duration: 0.8 });
              }
            }}
          >
            <Popup className="custom-popup" autoPan={false} closeButton={isPinned}>
              <div className="p-1 max-w-[240px] relative">
                <div className="flex items-center gap-2 mb-1.5 pr-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${ativo.cor}/10`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${ativo.cor}`}></span>
                  </div>
                  <span className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider truncate">
                    {ativo.tipo}
                  </span>
                </div>
                <h4 className="font-extrabold text-[#1D3557] text-[13px] leading-snug mb-1">
                  {ativo.nome}
                </h4>
                <div className="flex items-center justify-between mt-2.5 bg-gray-50 p-2 rounded-lg border border-gray-100 text-[11px]">
                  <span className="font-bold text-[#457B9D] flex items-center gap-1 truncate">
                    <MapPin size={12} className="shrink-0" /> {ativo.municipio}
                  </span>
                  {ativo.territorio && (
                    <span className="font-bold text-[#1D3557] truncate max-w-[90px]" title={ativo.territorio}>
                      {ativo.territorio}
                    </span>
                  )}
                </div>
                {ativo.urlReferencia && (
                  <a
                    href={ativo.urlReferencia}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-[#2563EB] hover:underline mt-2"
                  >
                    <ExternalLink size={10} /> Fonte dos dados
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// ================= MAPA EXCLUSIVO DA PÁGINA DE ATIVOS =================
export default function SideMap({
  processedAtivos = [],
  focusedAsset = null,
  onSelectTerritory = () => {}
}) {
  const mapRef = useRef(null);
  const [territoriosGeoJson, setTerritoriosGeoJson] = useState(null);
  const [pinnedAssetId, setPinnedAssetId] = useState(null);
  const municipioTerritoryMap = useMemo(() => buildMunicipioTerritoryMap(), []);

  // Processa as divisas mesclando os municípios em polígonos por território
  useEffect(() => {
    fetch('/BA_(1)9396399957704198.json')
      .then((resp) => resp.json())
      .then((topology) => {
        const geometries = topology.objects.BA.geometries;
        const groups = {};

        geometries.forEach((geom) => {
          const nome = geom.properties?.NOME || geom.properties?.nome || '';
          const dbInfo = municipioTerritoryMap[normalizeName(nome)];
          const idTerr = dbInfo ? dbInfo.id_territorio : 'outros';

          if (!groups[idTerr]) {
            groups[idTerr] = {
              nome_territorio: dbInfo ? dbInfo.nome_territorio : 'Outros',
              geoms: []
            };
          }
          groups[idTerr].geoms.push(geom);
        });

        const features = Object.entries(groups).map(([idTerr, group]) => {
          const mergedGeometry = topojson.merge(topology, group.geoms);
          return {
            type: 'Feature',
            properties: {
              id_territorio: idTerr,
              nome_territorio: group.nome_territorio
            },
            geometry: mergedGeometry
          };
        });

        setTerritoriosGeoJson({
          type: 'FeatureCollection',
          features
        });
      })
      .catch((err) => console.error('Erro ao processar divisas dos territórios:', err));
  }, [municipioTerritoryMap]);

  const territoryBorderStyle = () => ({
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#000000',
    weight: 1.5,
    opacity: 0.85,
    lineCap: 'round',
    lineJoin: 'round',
    className: 'pointer-events-none'
  });

  return (
    <div className="relative w-full h-full min-h-0 flex items-center justify-center bg-transparent rounded-md overflow-hidden select-none z-10 flex-1">
      <MapContainer
        ref={mapRef}
        preferCanvas={true}
        center={[-12.5, -41.5]}
        zoom={6}
        minZoom={6}
        maxBounds={[
          [-18.5, -47.0],
          [-8.0, -37.0]
        ]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="w-full h-full z-0 flex-1 min-h-0 outline-none"
        zoomControl={false}
        style={{ background: 'transparent' }}
      >
        <ZoomDependentTileLayer />
        <MapClickHandler onClearPinned={() => setPinnedAssetId(null)} />

        {/* CAMADA DE DIVISAS DOS TERRITÓRIOS */}
        {territoriosGeoJson && (
          <GeoJSON
            key="territorios-layer"
            data={territoriosGeoJson}
            style={territoryBorderStyle}
          />
        )}

        {focusedAsset && <ChangeMapView coords={focusedAsset} />}

        {/* MARCADORES COM FIXAÇÃO E HOVER */}
        <AssetMarkers 
          processedAtivos={processedAtivos} 
          pinnedAssetId={pinnedAssetId} 
          setPinnedAssetId={setPinnedAssetId} 
        />
      </MapContainer>

      {/* LEGENDA FLUTUANTE */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-white flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#60A5FA]"></span>
            <span className="text-[10px] font-bold text-[#1D3557]">Univ. Privadas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
            <span className="text-[10px] font-bold text-[#1D3557]">Univ. Estaduais</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E40AF]"></span>
            <span className="text-[10px] font-bold text-[#1D3557]">Univ. Federais</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9]"></span>
            <span className="text-[10px] font-bold text-[#1D3557]">Inst. Federais</span>
          </div>
        </div>
      </div>

      {/* CONTROLES DE ZOOM E RESET */}
      <div className="absolute bottom-6 right-6 z-[400] flex flex-col bg-white/90 backdrop-blur-xl rounded-[18px] border border-white shadow-[0_8px_32px_rgba(29,53,87,0.1)] overflow-hidden">
        <button 
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
          className="w-10 h-10 flex items-center justify-center text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50 transition-colors border-b border-[#D6EAF8]/40"
          title="Aproximar"
        >
          <span className="text-xl font-medium leading-none mb-0.5">+</span>
        </button>
        <button 
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
          className="w-10 h-10 flex items-center justify-center text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50 transition-colors border-b border-[#D6EAF8]/40"
          title="Afastar"
        >
          <span className="text-xl font-medium leading-none mb-0.5">-</span>
        </button>
        <button 
          onClick={() => {
            setPinnedAssetId(null);
            mapRef.current?.flyTo([-12.5, -41.5], 6, { duration: 0.8 });
            onSelectTerritory(null);
          }}
          className="w-10 h-10 flex items-center justify-center text-[#457B9D] hover:text-[#1D3557] hover:bg-[#D6EAF8]/50 transition-colors"
          title="Resetar Mapa"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
      </div>
    </div>
  );
}