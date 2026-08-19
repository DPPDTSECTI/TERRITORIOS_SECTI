import React, { useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, ExternalLink } from 'lucide-react';

// === CUSTOM MARKER ICON ===
const createCustomIcon = (colorHex) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: ${colorHex}; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.2s; cursor: pointer;"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11]
});

// Componente para centralizar o mapa quando um ativo da lista é clicado
function ChangeMapView({ coords }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords && coords[0] !== 0) {
      map.flyTo(coords, 14, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

// ================= MAPA EXCLUSIVO DA PÁGINA DE ATIVOS =================
export default function SideMap({
    processedAtivos = [],
    focusedAsset = null,
    onSelectTerritory = () => {}
}) {
    const mapRef = useRef(null);

    return (
        <div className="relative w-full h-full min-h-0 flex items-center justify-center bg-transparent rounded-md overflow-hidden select-none z-10 flex-1">
            <MapContainer
                ref={mapRef}
                center={[-12.9714, -38.5014]}
                zoom={7}
                scrollWheelZoom={true}
                className="w-full h-full z-0 flex-1 min-h-0 outline-none"
                zoomControl={false}
                style={{ background: 'transparent' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {focusedAsset && <ChangeMapView coords={focusedAsset} />}

                {/* RENDERIZAÇÃO DOS PINOS DOS ATIVOS */}
                {processedAtivos.map((ativo) => {
                    if (ativo.lat === 0 || ativo.lng === 0 || isNaN(ativo.lat) || isNaN(ativo.lng)) return null;

                    return (
                        <Marker 
                            key={ativo.id} 
                            position={[ativo.lat, ativo.lng]} 
                            icon={createCustomIcon(ativo.corHex)}
                        >
                            <Popup className="custom-popup">
                                <div className="p-1 max-w-[240px]">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${ativo.cor}/10`}>
                                            <ativo.icone size={13} className={ativo.textCor} />
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
            </MapContainer>

            {/* LEGENDA FLUTUANTE NO CANTO SUPERIOR DIREITO */}
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

            {/* BOTÕES DE ZOOM E RESET */}
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
                        mapRef.current?.flyTo([-12.9714, -38.5014], 7, { duration: 0.8 });
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