import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Building2, Microscope, BookOpen, GraduationCap, MapPin, GripHorizontal, BarChart3, ListOrdered, Layers } from 'lucide-react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToWindowEdges, snapCenterToCursor } from '@dnd-kit/modifiers';

import UserHeaderProfile from './UserHeaderProfile';

// === DADOS MOCKADOS ===
const ATIVOS_MOCK = [
  { id: 1, nome: "Parque Tecnológico da Bahia", tipo: "Parque Tecnológico", municipio: "Salvador", ifdm: 0.759, lat: -12.9372, lng: -38.4068, icone: Building2, cor: "bg-[#1D3557]", textCor: "text-[#1D3557]", corHex: "#1D3557" },
  { id: 2, nome: "Universidade Federal da Bahia (UFBA)", tipo: "Universidade Pública", municipio: "Salvador", ifdm: 0.759, lat: -12.9972, lng: -38.5193, icone: GraduationCap, cor: "bg-[#2563EB]", textCor: "text-[#2563EB]", corHex: "#2563EB" },
  { id: 3, nome: "Centro de Pesquisa do Cacau (CEPEC)", tipo: "Centro de Pesquisa", municipio: "Ilhéus", ifdm: 0.697, lat: -14.7891, lng: -39.0494, icone: Microscope, cor: "bg-[#457B9D]", textCor: "text-[#457B9D]", corHex: "#457B9D" },
  { id: 4, nome: "Univ. Estadual de Feira de Santana (UEFS)", tipo: "Universidade Pública", municipio: "Feira de Santana", ifdm: 0.712, lat: -12.1965, lng: -38.9712, icone: GraduationCap, cor: "bg-[#2563EB]", textCor: "text-[#2563EB]", corHex: "#2563EB" },
  { id: 5, nome: "SENAI CIMATEC", tipo: "ICT", municipio: "Salvador", ifdm: 0.759, lat: -12.9324, lng: -38.3685, icone: Microscope, cor: "bg-[#457B9D]", textCor: "text-[#457B9D]", corHex: "#457B9D" },
  { id: 6, nome: "Incubadora INBATECS", tipo: "Incubadora", municipio: "Vitória da Conquista", ifdm: 0.702, lat: -14.8617, lng: -40.8396, icone: Building2, cor: "bg-[#1D3557]", textCor: "text-[#1D3557]", corHex: "#1D3557" },
  { id: 7, nome: "Instituto Federal Baiano", tipo: "Instituto Federal", municipio: "Uruçuca", ifdm: 0.598, lat: -14.5937, lng: -39.2842, icone: BookOpen, cor: "bg-[#E63946]", textCor: "text-[#E63946]", corHex: "#E63946" },
  { id: 8, nome: "Polo de Inovação IFBA", tipo: "ICT", municipio: "Salvador", ifdm: 0.759, lat: -12.9649, lng: -38.5085, icone: Microscope, cor: "bg-[#457B9D]", textCor: "text-[#457B9D]", corHex: "#457B9D" }
];

const MUNICIPALITIES_IFDM_DATA = [
  { municipio: "Salvador", ifdm: 0.759 },
  { municipio: "Lauro de Freitas", ifdm: 0.742 },
  { municipio: "Camaçari", ifdm: 0.725 },
  { municipio: "Feira de Santana", ifdm: 0.712 },
  { municipio: "Vitória da Conquista", ifdm: 0.702 },
  { municipio: "Ilhéus", ifdm: 0.697 },
  { municipio: "Itabuna", ifdm: 0.685 },
  { municipio: "Luís Eduardo Magalhães", ifdm: 0.671 },
  { municipio: "Barreiras", ifdm: 0.665 },
  { municipio: "Juazeiro", ifdm: 0.658 },
  { municipio: "Alagoinhas", ifdm: 0.643 },
  { municipio: "Jequié", ifdm: 0.634 },
  { municipio: "Porto Seguro", ifdm: 0.628 },
  { municipio: "Paulo Afonso", ifdm: 0.612 },
  { municipio: "Santo Antônio de Jesus", ifdm: 0.605 },
  { municipio: "Simões Filho", ifdm: 0.598 },
  { municipio: "Eunápolis", ifdm: 0.589 },
  { municipio: "Teixeira de Freitas", ifdm: 0.580 },
  { municipio: "Valença", ifdm: 0.572 },
  { municipio: "Guanambi", ifdm: 0.564 },
  { municipio: "Jacobina", ifdm: 0.548 },
  { municipio: "Serrinha", ifdm: 0.532 },
  { municipio: "Irecê", ifdm: 0.520 },
  { municipio: "Senhor do Bonfim", ifdm: 0.510 },
  { municipio: "Cruz das Almas", ifdm: 0.505 },
  { municipio: "Seabra", ifdm: 0.498 },
  { municipio: "Bom Jesus da Lapa", ifdm: 0.485 }
];

const averageIFDM = (
  MUNICIPALITIES_IFDM_DATA.reduce((acc, curr) => acc + curr.ifdm, 0) / MUNICIPALITIES_IFDM_DATA.length
).toFixed(3);

// === CUSTOM MARKER ICON ===
const createCustomIcon = (colorHex) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: ${colorHex}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); transition: transform 0.2s; cursor: pointer;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

// Componente para mudar a visão do mapa quando um ativo é focado
function ChangeMapView({ coords }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords) {
      map.flyTo(coords, 14, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

// === COMPONENTE SORTABLE CARD ===
function SortableCard({ id, className = '', children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`relative h-full flex flex-col min-h-0 group ${className} ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      {/* DRAG HANDLE */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-4 right-4 z-50 p-1.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 rounded-md hover:bg-gray-100 transition-all duration-300 group-hover:text-[#1D3557]"
        title="Arrastar card"
      >
        <GripHorizontal size={18} />
      </button>
      {children}
    </div>
  );
}

export default function AtivosPage() {
  const [focusedAsset, setFocusedAsset] = useState(null);
  const [activeId, setActiveId] = useState(null);

  // Filtro no modo minimizado: 'acima' ou 'abaixo'
  const [minimizedFilter, setMinimizedFilter] = useState('acima');

  // Ordem dos cards em 4 slots (3 cards reais + 1 slot vazio invisível)
  const INITIAL_CARDS = ['card-ativos-list', 'card-empty', 'card-chart-ifdm', 'slot-empty'];
  const [cardsOrder, setCardsOrder] = useState(() => {
    const saved = localStorage.getItem('ativos-cards-order-v9');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === INITIAL_CARDS.length) return parsed;
      } catch (e) {}
    }
    return INITIAL_CARDS;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCardsOrder((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      const newArray = arrayMove(items, oldIndex, newIndex);
      localStorage.setItem('ativos-cards-order-v9', JSON.stringify(newArray));
      return newArray;
    });
  };

  // Função que verifica se um card está sozinho na sua linha (o vizinho é 'slot-empty')
  const getIsAlone = (cardId) => {
    const cardIndex = cardsOrder.indexOf(cardId);
    if (cardIndex === -1) return false;
    const neighborIdx = cardIndex === 0 ? 1 : cardIndex === 1 ? 0 : cardIndex === 2 ? 3 : 2;
    return cardsOrder[neighborIdx] === 'slot-empty';
  };

  const isChartAlone = getIsAlone('card-chart-ifdm');
  const isChartMinimized = !isChartAlone;

  // Filtragem de dados para o modo minimizado
  const filteredData = minimizedFilter === 'acima'
    ? MUNICIPALITIES_IFDM_DATA.filter((m) => m.ifdm >= Number(averageIFDM))
    : MUNICIPALITIES_IFDM_DATA.filter((m) => m.ifdm < Number(averageIFDM));

  return (
    <main className="flex-1 h-screen overflow-hidden relative py-6 px-6 lg:px-8 flex flex-col gap-6 bg-transparent w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between w-full shrink-0">
        <div className="flex flex-col">
          <h1 className="text-[28px] font-extrabold text-[#1D3557] tracking-tight leading-none mb-1">
            Ativos de CTI
          </h1>
          <p className="text-[#457B9D] font-medium text-[14px]">
            Explore os institutos, universidades e parques tecnológicos pelo estado
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-[#E2E8F0] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
            <span className="text-[13px] font-bold text-[#1D3557]">{ATIVOS_MOCK.length} Ativos</span>
          </div>
          <UserHeaderProfile />
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 min-h-0">

        {/* LEFT COLUMN: MAP */}
        <div className="lg:col-span-5 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 relative overflow-hidden flex flex-col group h-full min-h-0">
          <p className="absolute top-5 left-5 text-[#457B9D]/50 font-mono tracking-widest uppercase text-[10px] z-20 pointer-events-none group-hover:text-[#457B9D] transition-colors">
            Mapa de Ativos
          </p>

          <MapContainer
            center={[-12.9714, -38.5014]}
            zoom={7}
            scrollWheelZoom={true}
            className="w-full h-full z-0 flex-1 min-h-0"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {focusedAsset && <ChangeMapView coords={focusedAsset} />}

            {ATIVOS_MOCK.map((ativo) => (
              <Marker
                key={ativo.id}
                position={[ativo.lat, ativo.lng]}
                icon={createCustomIcon(ativo.corHex)}
              >
                <Popup className="custom-popup">
                  <div className="p-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ativo.cor}/10`}>
                        <ativo.icone size={14} className={ativo.textCor} />
                      </div>
                      <span className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider">{ativo.tipo}</span>
                    </div>
                    <h4 className="font-extrabold text-[#1D3557] text-[14px] leading-tight mb-1">{ativo.nome}</h4>
                    <div className="flex items-center justify-between mt-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="text-[11px] font-bold text-[#457B9D] flex items-center gap-1">
                        <MapPin size={12} /> {ativo.municipio}
                      </span>
                      <span className="text-[11px] font-extrabold text-[#1D3557]">IFDM: {ativo.ifdm}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-white flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1D3557]"></span>
                <span className="text-[10px] font-bold text-[#1D3557]">Alto Desenv. (&gt;0.7)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#457B9D]"></span>
                <span className="text-[10px] font-bold text-[#1D3557]">Médio Desenv.</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 3 CARDS IN A 2x2 DND GRID (SEM ESPAÇO VAGO, AUTO-MAXIMIZADOS) */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 auto-rows-[1fr] gap-5 h-full min-h-0">
            <SortableContext items={cardsOrder} strategy={rectSortingStrategy}>
              {cardsOrder.map((cardId) => {
                // O slot-empty NUNCA é renderizado, garantindo 0 espaços vagos na tela
                if (cardId === 'slot-empty') return null;

                // 1. LISTA DE ATIVOS
                if (cardId === 'card-ativos-list') {
                  const isAlone = getIsAlone('card-ativos-list');
                  return (
                    <SortableCard
                      key="card-ativos-list"
                      id="card-ativos-list"
                      className={isAlone ? 'md:col-span-2' : ''}
                    >
                      <div className="bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default min-h-0 overflow-hidden">
                        <h3 className="text-[#1D3557] font-extrabold text-[13px] tracking-tight mb-3 flex items-center gap-2 shrink-0 pr-8">
                          <MapPin size={15} className="text-[#457B9D]" />
                          Lista de Ativos
                        </h3>

                        <div className={`flex-1 overflow-y-auto pr-1 hide-scroll min-h-0 relative z-10 pb-4 ${
                          isAlone
                            ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5 content-start'
                            : 'flex flex-col gap-2'
                        }`}>
                          {ATIVOS_MOCK.map((ativo) => (
                            <div
                              key={ativo.id}
                              onClick={() => setFocusedAsset([ativo.lat, ativo.lng])}
                              className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-all duration-300 cursor-pointer border border-transparent hover:border-[#E2E8F0] hover:-translate-y-0.5 group shrink-0"
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${ativo.cor}/10 group-hover:scale-110 transition-transform duration-300`}>
                                <ativo.icone size={16} className={ativo.textCor} />
                              </div>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-[12px] font-bold text-[#1D3557] leading-tight mb-0.5 group-hover:text-[#2563EB] transition-colors line-clamp-1 truncate">
                                  {ativo.nome}
                                </span>
                                <div className="flex items-center justify-between mt-0.5 gap-1.5">
                                  <span className="text-[9px] font-semibold text-[#A0AEC0] bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100 truncate max-w-[120px]">
                                    {ativo.tipo}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#457B9D] truncate">{ativo.municipio}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-[24px] z-20" />
                      </div>
                    </SortableCard>
                  );
                }

                // 2. CARD VAZIO
                if (cardId === 'card-empty') {
                  const isAlone = getIsAlone('card-empty');
                  return (
                    <SortableCard
                      key="card-empty"
                      id="card-empty"
                      className={isAlone ? 'md:col-span-2' : ''}
                    >
                      <div className="bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col items-center justify-center h-full group cursor-default text-center min-h-0">
                        <span className="text-[#A0AEC0] font-medium text-[12px] uppercase tracking-widest">Card Vazio</span>
                      </div>
                    </SortableCard>
                  );
                }

                // 3. GRÁFICO IFDM
                if (cardId === 'card-chart-ifdm') {
                  return (
                    <SortableCard
                      key="card-chart-ifdm"
                      id="card-chart-ifdm"
                      className={isChartAlone ? 'md:col-span-2' : ''}
                    >
                      <div className="bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default min-h-0">
                        
                        {/* CABEÇALHO DO GRÁFICO */}
                        <div className="flex items-center justify-between gap-2 mb-3 shrink-0 pr-8">
                          <div className="flex flex-col">
                            <h3 className="text-[#1D3557] font-extrabold text-[13px] tracking-tight flex items-center gap-2">
                              Índice IFDM
                            </h3>
                            <span className="text-[10px] font-semibold text-[#457B9D]">Média: {averageIFDM}</span>
                          </div>

                          {/* CONTROLES DO CABEÇALHO */}
                          <div className="flex items-center gap-2">
                            {/* TOGGLE NO MODO MINIMIZADO (QUANDO HÁ OUTRO CARD AO LADO) */}
                            {isChartMinimized ? (
                              <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0]">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setMinimizedFilter('acima'); }}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${
                                    minimizedFilter === 'acima'
                                      ? 'bg-[#2563EB] text-white shadow-sm'
                                      : 'text-[#457B9D] hover:text-[#1D3557]'
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                  Acima ({MUNICIPALITIES_IFDM_DATA.filter(m => m.ifdm >= Number(averageIFDM)).length})
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setMinimizedFilter('abaixo'); }}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${
                                    minimizedFilter === 'abaixo'
                                      ? 'bg-[#1D3557] text-white shadow-sm'
                                      : 'text-[#457B9D] hover:text-[#1D3557]'
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#A8DADC]"></span>
                                  Abaixo ({MUNICIPALITIES_IFDM_DATA.filter(m => m.ifdm < Number(averageIFDM)).length})
                                </button>
                              </div>
                            ) : (
                              /* LEGENDA NO MODO NORMAL (QUANDO ESTÁ SOZINHO NA LINHA) */
                              <div className="flex items-center gap-3 text-[10px] font-bold">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                                  <span className="text-[#1D3557]">Acima da Média</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#1D3557]"></span>
                                  <span className="text-[#457B9D]">Abaixo da Média</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ÁREA DO GRÁFICO COM BARRAS CAPSULE E LINHA DE MÉDIA */}
                        <div className="flex-1 w-full h-full relative min-h-0 pt-4 pb-1 px-1">
                          <div className="relative w-full h-full">
                            
                            {/* LINHA DE MÉDIA ESTADUAL (HORIZONTAL) */}
                            {(() => {
                              const avgNum = Number(averageIFDM);
                              const avgPercent = (avgNum / 0.85) * 100;
                              return (
                                <div 
                                  className="absolute left-0 right-0 border-b-2 border-dashed border-[#457B9D]/60 pointer-events-none z-20 flex items-center justify-end pr-1 transition-all duration-500"
                                  style={{ bottom: `${avgPercent}%` }}
                                >
                                  <div className="bg-[#457B9D] text-white px-2 py-0.5 rounded-full shadow-sm text-[9px] font-extrabold tracking-wider uppercase -translate-y-1/2 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                    Média: {averageIFDM}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* LINHAS DE GRADE SUTIS DE FUNDO */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                              <div className="w-full h-px bg-[#D6EAF8]"></div>
                              <div className="w-full h-px bg-[#D6EAF8]"></div>
                              <div className="w-full h-px bg-[#D6EAF8]"></div>
                            </div>

                            {/* BARRAS CAPSULE PILL */}
                            <div className="w-full h-full flex items-end justify-between gap-1 sm:gap-1.5 relative z-10">
                              {(isChartMinimized ? filteredData : MUNICIPALITIES_IFDM_DATA).map((item, index) => {
                                const isAboveAvg = item.ifdm >= Number(averageIFDM);
                                const heightPercent = Math.min(100, (item.ifdm / 0.85) * 100);

                                return (
                                  <div
                                    key={index}
                                    className="flex-1 h-full flex flex-col items-center justify-end group/bar relative cursor-pointer"
                                  >
                                    {/* TOOLTIP FLUTUANTE (APENAS NO HOVER) */}
                                    <div className="absolute bottom-[calc(100%+8px)] bg-[#1D3557] text-white shadow-[0_8px_20px_rgba(29,53,87,0.25)] rounded-xl px-3 py-2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap translate-y-2 group-hover/bar:translate-y-0 text-center flex flex-col items-center border border-white/10">
                                      <span className="text-[11px] font-bold text-white leading-tight">
                                        {item.municipio}
                                      </span>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${isAboveAvg ? 'bg-[#38BDF8]' : 'bg-[#A0AEC0]'}`}></span>
                                        <span className="text-[10px] font-extrabold text-[#A8DADC]">
                                          IFDM: {item.ifdm.toFixed(3)}
                                        </span>
                                      </div>
                                      {/* Seta do tooltip */}
                                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1D3557] rotate-45"></div>
                                    </div>

                                    {/* BARRA CAPSULE (PILL) */}
                                    <div className="w-full flex items-end justify-center h-full relative">
                                      <div
                                        className={`w-full max-w-[14px] sm:max-w-[18px] rounded-full relative flex items-start justify-center transition-all duration-500 ease-out group-hover/bar:scale-105 ${
                                          isAboveAvg
                                            ? 'bg-[#2563EB] group-hover/bar:bg-[#1D4ED8] shadow-[0_2px_10px_rgba(37,99,235,0.25)]'
                                            : 'bg-[#1D3557] group-hover/bar:bg-[#2A4665]'
                                        }`}
                                        style={{ height: `${heightPercent}%` }}
                                      >
                                        {/* ANEL / PONTO DESTAQUE NO TOPO (VISÍVEL NO HOVER) */}
                                        <div
                                          className={`absolute -top-1 w-2.5 h-2.5 rounded-full border-2 border-white opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300 z-30 shadow-md flex items-center justify-center ${
                                            isAboveAvg ? 'bg-[#38BDF8]' : 'bg-[#CBD5E1]'
                                          }`}
                                        >
                                          <div className="w-1 h-1 rounded-full bg-white"></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                          </div>
                        </div>
                      </div>
                    </SortableCard>
                  );
                }

                return null;
              })}
            </SortableContext>
          </div>

          {/* DRAG OVERLAY: CARD FLUTUANTE DE TAMANHO FIXO E CENTRALIZADO NO CURSOR */}
          <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
            {activeId ? (
              <div className="w-[340px] h-[200px] bg-white rounded-[24px] border-2 border-dashed border-[#2563EB] flex flex-col items-center justify-center p-6 text-center shadow-[0_25px_60px_rgba(29,53,87,0.35)] ring-4 ring-[#2563EB]/20 cursor-grabbing">
                <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center mb-2.5 shadow-inner">
                  {activeId === 'card-ativos-list' && <ListOrdered size={24} />}
                  {activeId === 'card-empty' && <Layers size={24} />}
                  {activeId === 'card-chart-ifdm' && <BarChart3 size={24} />}
                </div>
                <span className="text-[13px] font-extrabold text-[#1D3557] tracking-tight">
                  {activeId === 'card-ativos-list' && 'Lista de Ativos'}
                  {activeId === 'card-empty' && 'Card Vazio'}
                  {activeId === 'card-chart-ifdm' && 'Gráfico IFDM'}
                </span>
                <span className="text-[11px] font-medium text-[#457B9D]/80 mt-0.5">Solte no local desejado</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <style>{`
        /* Sobrescrever Leaflet Popup Defaults para um visual premium */
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          box-shadow: 0 10px 25px -5px rgba(29, 53, 87, 0.1), 0 8px 10px -6px rgba(29, 53, 87, 0.1) !important;
          padding: 4px !important;
        }
        .leaflet-popup-content {
          margin: 12px 14px !important;
        }
        .leaflet-popup-tip {
          box-shadow: none !important;
        }
      `}</style>
    </main>
  );
}
