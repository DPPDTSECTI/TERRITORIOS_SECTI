import React, { useState, useMemo, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Building2, Microscope, BookOpen, GraduationCap, MapPin, GripHorizontal, BarChart3, ListOrdered, Layers, Filter, ChevronDown, Check, ExternalLink } from 'lucide-react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToWindowEdges, snapCenterToCursor } from '@dnd-kit/modifiers';

import { DataContext } from '../context/DataContext';
import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import UserHeaderProfile from './UserHeaderProfile';

// === OS 10 TIPOS OFICIAIS DE ATIVOS DE CTI (DATABASE SCHEMA) ===
export const TIPOS_ATIVOS_CONFIG = {
  1: { id: 1, label: 'Entidade de Pesquisa', shortLabel: 'Entidade Pesquisa', icone: Microscope, cor: 'bg-[#457B9D]', textCor: 'text-[#457B9D]', corHex: '#457B9D' },
  2: { id: 2, label: 'Espaço Dinamizador', shortLabel: 'Espaço Dinamizador', icone: Layers, cor: 'bg-[#06B6D4]', textCor: 'text-[#0891B2]', corHex: '#06B6D4' },
  3: { id: 3, label: 'ICT', shortLabel: 'ICT', icone: Microscope, cor: 'bg-[#0284C7]', textCor: 'text-[#0284C7]', corHex: '#0284C7' },
  4: { id: 4, label: 'Incubadora', shortLabel: 'Incubadora', icone: Building2, cor: 'bg-[#38BDF8]', textCor: 'text-[#0284C7]', corHex: '#38BDF8' },
  5: { id: 5, label: 'Campi Instituto Federal', shortLabel: 'Inst. Federal', icone: BookOpen, cor: 'bg-[#0EA5E9]', textCor: 'text-[#0284C7]', corHex: '#0EA5E9' },
  6: { id: 6, label: 'Parque Tecnológico', shortLabel: 'Parque Tecnológico', icone: Building2, cor: 'bg-[#1D3557]', textCor: 'text-[#1D3557]', corHex: '#1D3557' },
  7: { id: 7, label: 'Campi Universidade Pública - Estadual', shortLabel: 'Univ. Estadual', icone: GraduationCap, cor: 'bg-[#2563EB]', textCor: 'text-[#2563EB]', corHex: '#2563EB' },
  8: { id: 8, label: 'Campi Universidade Pública - Federal', shortLabel: 'Univ. Federal', icone: GraduationCap, cor: 'bg-[#1E40AF]', textCor: 'text-[#1E40AF]', corHex: '#1E40AF' },
  9: { id: 9, label: 'Campi Universidade Privada', shortLabel: 'Univ. Privada', icone: GraduationCap, cor: 'bg-[#60A5FA]', textCor: 'text-[#2563EB]', corHex: '#60A5FA' },
  10: { id: 10, label: 'Aceleradora', shortLabel: 'Aceleradora', icone: Layers, cor: 'bg-[#10B981]', textCor: 'text-[#059669]', corHex: '#10B981' },
};

export const TIPOS_ATIVOS_ARRAY = Object.values(TIPOS_ATIVOS_CONFIG);

// Função auxiliar para mapear o tipo caso venha como ID ou como String
function resolveAssetType(idTipo, nomeTipo) {
  if (idTipo && TIPOS_ATIVOS_CONFIG[idTipo]) {
    return TIPOS_ATIVOS_CONFIG[idTipo];
  }
  const str = String(nomeTipo || '').toLowerCase();
  if (str.includes('privada')) return TIPOS_ATIVOS_CONFIG[9];
  if (str.includes('estadual')) return TIPOS_ATIVOS_CONFIG[7];
  if (str.includes('federal') && str.includes('universidade')) return TIPOS_ATIVOS_CONFIG[8];
  if (str.includes('instituto federal') || str.includes('ifba') || str.includes('if baiano')) return TIPOS_ATIVOS_CONFIG[5];
  if (str.includes('aceleradora')) return TIPOS_ATIVOS_CONFIG[10];
  if (str.includes('dinamizador')) return TIPOS_ATIVOS_CONFIG[2];
  if (str.includes('incubadora')) return TIPOS_ATIVOS_CONFIG[4];
  if (str.includes('parque')) return TIPOS_ATIVOS_CONFIG[6];
  if (str.includes('ict')) return TIPOS_ATIVOS_CONFIG[3];
  if (str.includes('pesquisa') || str.includes('entidade')) return TIPOS_ATIVOS_CONFIG[1];
  return TIPOS_ATIVOS_CONFIG[4];
}

// === CUSTOM MARKER ICON ===
const createCustomIcon = (colorHex) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: ${colorHex}; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.2s; cursor: pointer;"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11]
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
  const { ativosData, loadingStats } = useContext(DataContext);

  const [focusedAsset, setFocusedAsset] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Filtro por ID do Tipo de Ativo: 'todos' ou 1..10
  const [selectedTypeId, setSelectedTypeId] = useState('todos');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Filtro no modo minimizado do gráfico: 'acima' (Top 10) ou 'abaixo' (Demais)
  const [minimizedFilter, setMinimizedFilter] = useState('acima');

  // Ordem dos cards em 4 slots (3 cards reais + 1 slot vazio invisível)
  const INITIAL_CARDS = ['card-ativos-list', 'card-empty', 'card-chart-ifdm', 'slot-empty'];
  const [cardsOrder, setCardsOrder] = useState(() => {
    const saved = localStorage.getItem('ativos-cards-order-v9');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === INITIAL_CARDS.length) return parsed;
      } catch (e) { }
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

  // Processamento e enriquecimento dos 260 ativos reais de lista_ativos_cti com os 10 tipos oficiais
  const ativosProcessados = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];

    const cityCount = {};

    return ativosData.map((a, idx) => {
      const tipoConf = resolveAssetType(a.id_tipo_ativo, a.tipo);
      const munKey = String(a.municipio || '').trim();
      const baseCoords = MUNICIPIOS_COORDS[munKey] || MUNICIPIOS_COORDS[munKey.toLowerCase()] || [-12.9714, -38.5014];
      
      cityCount[munKey] = (cityCount[munKey] || 0) + 1;
      const offsetIndex = cityCount[munKey] - 1;
      
      // Espalhamento em espiral suave para múltiplos ativos no mesmo município
      const angle = offsetIndex * 1.3;
      const radius = offsetIndex === 0 ? 0 : 0.008 + (offsetIndex * 0.003);
      const lat = baseCoords[0] + Math.sin(angle) * radius;
      const lng = baseCoords[1] + Math.cos(angle) * radius;

      return {
        id: a.id_ativo || idx + 1,
        idTipoAtivo: tipoConf.id,
        nome: a.nome_ativo || a.sigla || 'Ativo de CTI',
        sigla: a.sigla || '',
        tipo: tipoConf.label,
        shortTipo: tipoConf.shortLabel,
        municipio: a.municipio || 'Bahia',
        territorio: a.territorio_identidade || '',
        lat,
        lng,
        icone: tipoConf.icone,
        cor: tipoConf.cor,
        textCor: tipoConf.textCor,
        corHex: tipoConf.corHex,
        urlReferencia: a.url_referencia || '',
        tituloReferencia: a.titulo_referencia || ''
      };
    });
  }, [ativosData]);

  // Lista de ativos filtrada por tipo
  const filteredAtivosList = useMemo(() => {
    if (selectedTypeId === 'todos') return ativosProcessados;
    return ativosProcessados.filter(a => a.idTipoAtivo === Number(selectedTypeId));
  }, [ativosProcessados, selectedTypeId]);

  // Agregação dos 27 Territórios para o Gráfico Segmentado com os 10 tipos oficiais
  const regioesAtivosCalculado = useMemo(() => {
    if (!ativosProcessados.length) return [];

    const map = {};

    ativosProcessados.forEach(a => {
      const rawTerr = (a.territorio || '').replace(/^Território de Identidade\s+/i, '').trim();
      const nomeRegiao = rawTerr || 'Outros';

      if (!map[nomeRegiao]) {
        map[nomeRegiao] = {
          regiao: nomeRegiao,
          total: 0,
          typesCount: {}
        };
        // Inicializa os 10 tipos
        TIPOS_ATIVOS_ARRAY.forEach(t => {
          map[nomeRegiao].typesCount[t.id] = 0;
        });
      }

      map[nomeRegiao].total += 1;
      map[nomeRegiao].typesCount[a.idTipoAtivo] = (map[nomeRegiao].typesCount[a.idTipoAtivo] || 0) + 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [ativosProcessados]);

  const maxAtivosScale = useMemo(() => {
    if (!regioesAtivosCalculado.length) return 40;
    const maxTotal = Math.max(...regioesAtivosCalculado.map(r => r.total));
    return Math.ceil(maxTotal * 1.05);
  }, [regioesAtivosCalculado]);

  // Função que verifica se um card está sozinho na sua linha (o vizinho é 'slot-empty')
  const getIsAlone = (cardId) => {
    const cardIndex = cardsOrder.indexOf(cardId);
    if (cardIndex === -1) return false;
    const neighborIdx = cardIndex === 0 ? 1 : cardIndex === 1 ? 0 : cardIndex === 2 ? 3 : 2;
    return cardsOrder[neighborIdx] === 'slot-empty';
  };

  const isChartAlone = getIsAlone('card-chart-ifdm');
  const isChartMinimized = !isChartAlone;

  // Filtragem de dados para o modo minimizado (Top 10 vs Demais)
  const filteredChartData = useMemo(() => {
    if (minimizedFilter === 'acima') {
      return regioesAtivosCalculado.slice(0, 10);
    }
    return regioesAtivosCalculado.slice(10);
  }, [minimizedFilter, regioesAtivosCalculado]);

  return (
    <main className="flex-1 h-screen overflow-hidden relative py-6 px-6 lg:px-8 flex flex-col gap-6 bg-transparent w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between w-full shrink-0">
        <div className="flex flex-col">
          <h1 className="text-[28px] font-extrabold text-[#1D3557] tracking-tight leading-none mb-1">
            Ativos de CTI
          </h1>
          <p className="text-[#457B9D] font-medium text-[14px]">
            Explore os institutos, universidades, ICTs e parques tecnológicos pelo estado
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-[#E2E8F0] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
            <span className="text-[13px] font-bold text-[#1D3557]">
              {loadingStats ? 'Carregando...' : `${ativosProcessados.length} Ativos Mapeados`}
            </span>
          </div>
          <UserHeaderProfile />
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 min-h-0">

        {/* LEFT COLUMN: MAP */}
        <div className="lg:col-span-5 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 relative overflow-hidden flex flex-col group h-full min-h-0">
          <p className="absolute top-5 left-5 text-[#457B9D]/50 font-mono tracking-widest uppercase text-[10px] z-20 pointer-events-none group-hover:text-[#457B9D] transition-colors">
            Mapa de Ativos ({ativosProcessados.length})
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

            {ativosProcessados.map((ativo) => (
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
            ))}
          </MapContainer>

          {/* Map Controls Overlay */}
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

        </div>

        {/* RIGHT COLUMN: 3 CARDS IN A 2x2 DND GRID */}
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
                  const currentSelectedType = selectedTypeId === 'todos' 
                    ? null 
                    : TIPOS_ATIVOS_CONFIG[selectedTypeId];

                  return (
                    <SortableCard
                      key="card-ativos-list"
                      id="card-ativos-list"
                      className={`${isAlone ? 'md:col-span-2' : ''} ${isFilterDropdownOpen ? '!z-50' : 'z-10'}`}
                    >
                      <div className={`bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default min-h-0 ${
                        isFilterDropdownOpen ? '!z-50' : ''
                      }`}>

                        {/* CABEÇALHO DA LISTA DE ATIVOS COM BOTÃO E DROPDOWN DE FILTRO */}
                        <div className="flex items-center justify-between gap-2 mb-3 shrink-0 pr-8 relative z-30">
                          <div className="flex items-center gap-2">
                            <MapPin size={15} className="text-[#457B9D]" />
                            <h3 className="text-[#1D3557] font-extrabold text-[13px] tracking-tight">
                              Lista de Ativos
                            </h3>
                            <span className="text-[10px] font-bold text-[#457B9D] bg-[#F1F5F9] px-2 py-0.5 rounded-full border border-[#E2E8F0]">
                              {filteredAtivosList.length}
                            </span>
                          </div>

                          {/* BOTÃO E MENU DROPDOWN DE FILTRO COM OS 10 TIPOS OFICIAIS */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsFilterDropdownOpen(!isFilterDropdownOpen);
                              }}
                              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border cursor-pointer select-none active:scale-95 ${
                                selectedTypeId !== 'todos'
                                  ? 'bg-[#1D3557] text-white border-[#1D3557] shadow-sm'
                                  : 'bg-[#F8FAFC] text-[#1D3557] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                              }`}
                            >
                              <Filter size={12} className={selectedTypeId !== 'todos' ? 'text-white' : 'text-[#457B9D]'} />
                              <span className="max-w-[130px] truncate">
                                {currentSelectedType ? currentSelectedType.shortLabel : 'Filtrar Tipo'}
                              </span>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* MENU FLUTUANTE DROPDOWN */}
                            {isFilterDropdownOpen && (
                              <>
                                {/* Backdrop transparente para fechar ao clicar fora */}
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFilterDropdownOpen(false);
                                  }}
                                />

                                <div
                                  className="absolute right-0 mt-2 w-[285px] sm:w-[310px] max-h-[260px] overflow-y-auto hide-scroll bg-white rounded-2xl shadow-[0_20px_50px_rgba(29,53,87,0.28)] border border-[#E2E8F0] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#A0AEC0] border-b border-[#F1F5F9] mb-1 flex items-center justify-between">
                                    <span>Tipos de Ativos</span>
                                    <span className="text-[9px] font-bold text-[#457B9D]">({ativosProcessados.length} no total)</span>
                                  </div>

                                  {/* OPÇÃO TODOS */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTypeId('todos');
                                      setIsFilterDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-150 text-left cursor-pointer ${
                                      selectedTypeId === 'todos'
                                        ? 'bg-[#F1F5F9] text-[#1D3557] font-bold'
                                        : 'text-[#457B9D] hover:bg-[#F8FAFC] hover:text-[#1D3557]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="w-2 h-2 rounded-full shrink-0 bg-[#1D3557]/30"></span>
                                      <span className="truncate">Todos os Tipos</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[10px] text-[#A0AEC0] font-bold">({ativosProcessados.length})</span>
                                      {selectedTypeId === 'todos' && <Check size={13} className="text-[#2563EB]" />}
                                    </div>
                                  </button>

                                  {/* OS 10 TIPOS ESPECÍFICOS */}
                                  {TIPOS_ATIVOS_ARRAY.map((tipo) => {
                                    const isSelected = selectedTypeId === tipo.id;
                                    const count = ativosProcessados.filter(a => a.idTipoAtivo === tipo.id).length;

                                    return (
                                      <button
                                        key={tipo.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedTypeId(tipo.id);
                                          setIsFilterDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-150 text-left cursor-pointer ${
                                          isSelected
                                            ? 'bg-[#F1F5F9] text-[#1D3557] font-bold'
                                            : 'text-[#457B9D] hover:bg-[#F8FAFC] hover:text-[#1D3557]'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0 pr-1">
                                          <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: tipo.corHex }}></span>
                                          <span className="truncate text-[11px]">{tipo.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[10px] text-[#A0AEC0] font-bold">({count})</span>
                                          {isSelected && <Check size={13} className="text-[#2563EB]" />}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* LISTAGEM DE ATIVOS DO SUPABASE */}
                        <div className={`flex-1 overflow-y-auto pr-1 hide-scroll min-h-0 relative z-10 pb-4 ${
                          isAlone
                            ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5 content-start'
                            : 'flex flex-col gap-2'
                        }`}>
                          {filteredAtivosList.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-[11px] font-semibold text-[#A0AEC0]">
                              {loadingStats ? 'Carregando ativos do Supabase...' : 'Nenhum ativo encontrado para esta categoria.'}
                            </div>
                          ) : (
                            filteredAtivosList.map((ativo) => (
                              <div
                                key={ativo.id}
                                onClick={() => setFocusedAsset([ativo.lat, ativo.lng])}
                                className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-all duration-300 cursor-pointer border border-transparent hover:border-[#E2E8F0] hover:-translate-y-0.5 group shrink-0"
                              >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${ativo.cor}/10 group-hover:scale-110 transition-transform duration-300`}>
                                  <ativo.icone size={16} className={ativo.textCor} />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="text-[12px] font-bold text-[#1D3557] leading-tight mb-0.5 group-hover:text-[#2563EB] transition-colors line-clamp-1 truncate" title={ativo.nome}>
                                    {ativo.nome}
                                  </span>
                                  <div className="flex items-center justify-between mt-0.5 gap-1.5">
                                    <span className="text-[9px] font-semibold text-[#A0AEC0] bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100 truncate max-w-[135px]">
                                      {ativo.shortTipo}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#457B9D] truncate">{ativo.municipio}</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
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

                // 3. GRÁFICO DE ATIVOS POR REGIÃO (STACKED BARS DINÂMICO DOS 10 TIPOS)
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
                              Ativos por Região
                            </h3>
                            <span className="text-[10px] font-semibold text-[#457B9D]">
                              {regioesAtivosCalculado.length} Territórios de Identidade
                            </span>
                          </div>

                          {/* CONTROLES DO CABEÇALHO */}
                          <div className="flex items-center gap-2">
                            {/* TOGGLE NO MODO MINIMIZADO (QUANDO HÁ OUTRO CARD AO LADO) */}
                            {isChartMinimized ? (
                              <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-full border border-[#E2E8F0]">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setMinimizedFilter('acima'); }}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all flex items-center gap-1 ${
                                    minimizedFilter === 'acima'
                                      ? 'bg-[#2563EB] text-white shadow-sm'
                                      : 'text-[#457B9D] hover:text-[#1D3557]'
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                  Top 10 Regiões
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setMinimizedFilter('abaixo'); }}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all flex items-center gap-1 ${
                                    minimizedFilter === 'abaixo'
                                      ? 'bg-[#1D3557] text-white shadow-sm'
                                      : 'text-[#457B9D] hover:text-[#1D3557]'
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#A8DADC]"></span>
                                  Demais ({Math.max(0, regioesAtivosCalculado.length - 10)})
                                </button>
                              </div>
                            ) : (
                              /* LEGENDA NO MODO NORMAL (QUANDO ESTÁ SOZINHO NA LINHA) */
                              <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold">
                                {TIPOS_ATIVOS_ARRAY.slice(0, 6).map((t) => (
                                  <div key={t.id} className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: t.corHex }}></span>
                                    <span className="text-[#1D3557]">{t.shortLabel}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ÁREA DO GRÁFICO COM BARRAS STACKED CAPSULE */}
                        <div className="flex-1 w-full h-full relative min-h-0 pt-4 pb-1 px-1">
                          <div className="relative w-full h-full">

                            {/* LINHAS DE GRADE SUTIS DE FUNDO */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                              <div className="w-full h-px bg-[#D6EAF8]"></div>
                              <div className="w-full h-px bg-[#D6EAF8]"></div>
                              <div className="w-full h-px bg-[#D6EAF8]"></div>
                            </div>

                            {/* BARRAS CAPSULE EMPILHADAS (STACKED PILL) */}
                            <div className="w-full h-full flex items-end justify-between gap-1 sm:gap-1.5 relative z-10">
                              {(isChartMinimized ? filteredChartData : regioesAtivosCalculado).map((item, index) => {
                                const heightPercent = Math.min(100, (item.total / maxAtivosScale) * 100);
                                const listLength = (isChartMinimized ? filteredChartData : regioesAtivosCalculado).length;
                                const isRightEdge = index >= listLength - 7;

                                return (
                                  <div
                                    key={index}
                                    onMouseLeave={() => setHoveredSlice(null)}
                                    className="flex-1 h-full flex flex-col items-center justify-end group/bar relative cursor-pointer hover:z-50"
                                  >
                                    {/* TOOLTIP LATERAL ULTRA-COMPACTO ESPECÍFICO DA FATIA */}
                                    {hoveredSlice && hoveredSlice.regiao === item.regiao && (
                                      <div
                                        className={`absolute bg-[#1D3557] text-white shadow-[0_10px_28px_rgba(29,53,87,0.4)] rounded-xl p-2 pointer-events-none z-50 whitespace-nowrap text-left flex flex-col gap-1 border border-white/15 w-max max-w-[190px] ${
                                          isRightEdge
                                            ? 'right-[calc(100%+8px)]'
                                            : 'left-[calc(100%+8px)]'
                                        }`}
                                        style={{
                                          bottom: `${Math.max(4, Math.min(60, heightPercent - 5))}%`
                                        }}
                                      >
                                        {/* CABEÇALHO COMPACTO */}
                                        <div className="flex items-center justify-between border-b border-white/10 pb-1 gap-2">
                                          <span className="text-[10px] font-bold text-white truncate max-w-[120px]">
                                            {hoveredSlice.regiao}
                                          </span>
                                          <span className="text-[9px] font-semibold text-[#A8DADC] bg-white/10 px-1.5 py-0.5 rounded-full shrink-0">
                                            {hoveredSlice.total} total
                                          </span>
                                        </div>

                                        {/* TIPO + VALOR DA FATIA */}
                                        <div className="flex items-center justify-between gap-3 pt-0.5">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: hoveredSlice.corHex }}></span>
                                            <span className="text-[10px] font-medium text-white/90 truncate">{hoveredSlice.typeLabel}</span>
                                          </div>
                                          <span className="text-[11px] font-black text-white px-1.5 py-0.5 rounded bg-white/10 shrink-0">
                                            {hoveredSlice.count}
                                          </span>
                                        </div>

                                        {/* SETA LATERAL APONTANDO PARA A BARRA */}
                                        <div className={`absolute bottom-3 w-2 h-2 bg-[#1D3557] rotate-45 border-white/15 ${
                                          isRightEdge
                                            ? '-right-1 border-r border-t'
                                            : '-left-1 border-l border-b'
                                        }`}></div>
                                      </div>
                                    )}

                                    {/* BARRA CAPSULE (PILL) SEGMENTADA */}
                                    <div className="w-full flex items-end justify-center h-full relative">
                                      <div
                                        className="w-full max-w-[14px] sm:max-w-[18px] rounded-full relative flex flex-col-reverse overflow-hidden transition-all duration-500 ease-out group-hover/bar:scale-105 group-hover/bar:ring-2 group-hover/bar:ring-[#2563EB]/40 shadow-sm"
                                        style={{ height: `${heightPercent}%` }}
                                      >
                                        {TIPOS_ATIVOS_ARRAY.map((t) => {
                                          const count = item.typesCount[t.id] || 0;
                                          if (count === 0) return null;
                                          const segPercent = (count / item.total) * 100;
                                          const isThisSliceHovered = hoveredSlice?.regiao === item.regiao && hoveredSlice?.typeId === t.id;

                                          return (
                                            <div
                                              key={t.id}
                                              onMouseEnter={(e) => {
                                                e.stopPropagation();
                                                setHoveredSlice({
                                                  regiao: item.regiao,
                                                  typeId: t.id,
                                                  typeLabel: t.label,
                                                  corHex: t.corHex,
                                                  count: count,
                                                  total: item.total,
                                                });
                                              }}
                                              className={`w-full transition-all duration-200 cursor-pointer min-h-[3px] ${
                                                isThisSliceHovered
                                                  ? 'brightness-125 saturate-150 ring-1 ring-white'
                                                  : 'hover:brightness-110'
                                              }`}
                                              style={{
                                                height: `${segPercent}%`,
                                                backgroundColor: t.corHex,
                                              }}
                                            />
                                          );
                                        })}
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
                  {activeId === 'card-chart-ifdm' && 'Gráfico de Ativos por Região'}
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
