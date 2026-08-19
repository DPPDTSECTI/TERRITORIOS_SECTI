import React, { useState, useMemo, useContext } from 'react';
import { Building2, Microscope, BookOpen, GraduationCap, MapPin, GripHorizontal, BarChart3, ListOrdered, Layers, Filter, ChevronDown, Check } from 'lucide-react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToWindowEdges, snapCenterToCursor } from '@dnd-kit/modifiers';

import { DataContext } from '../context/DataContext';
import UserHeaderProfile from './UserHeaderProfile';
import SideMap from './SideMap'; // <-- O NOVO MAPA ISOLADO IMPORTADO COM SUCESSO!

// === MAPEAMENTO DINÂMICO DOS TIPOS DE ATIVOS (LENDO DIRETO DA COLUNA) ===
export const getDynamicAssetTypeConfig = (nomeTipo) => {
  const str = String(nomeTipo || '').toLowerCase();
  
  if (str.includes('privada')) return { id: 9, shortLabel: 'Univ. Privada', icone: GraduationCap, cor: 'bg-[#60A5FA]', textCor: 'text-[#2563EB]', corHex: '#60A5FA' };
  if (str.includes('estadual')) return { id: 7, shortLabel: 'Univ. Estadual', icone: GraduationCap, cor: 'bg-[#2563EB]', textCor: 'text-[#2563EB]', corHex: '#2563EB' };
  if (str.includes('federal') && str.includes('universidade')) return { id: 8, shortLabel: 'Univ. Federal', icone: GraduationCap, cor: 'bg-[#1E40AF]', textCor: 'text-[#1E40AF]', corHex: '#1E40AF' };
  if (str.includes('instituto federal') || str.includes('ifba') || str.includes('if baiano')) return { id: 5, shortLabel: 'Inst. Federal', icone: BookOpen, cor: 'bg-[#0EA5E9]', textCor: 'text-[#0284C7]', corHex: '#0EA5E9' };
  if (str.includes('aceleradora')) return { id: 10, shortLabel: 'Aceleradora', icone: Layers, cor: 'bg-[#10B981]', textCor: 'text-[#059669]', corHex: '#10B981' };
  if (str.includes('dinamizador')) return { id: 2, shortLabel: 'Espaço Dinamizador', icone: Layers, cor: 'bg-[#06B6D4]', textCor: 'text-[#0891B2]', corHex: '#06B6D4' };
  if (str.includes('incubadora')) return { id: 4, shortLabel: 'Incubadora', icone: Building2, cor: 'bg-[#38BDF8]', textCor: 'text-[#0284C7]', corHex: '#38BDF8' };
  if (str.includes('parque')) return { id: 6, shortLabel: 'Parque Tecnológico', icone: Building2, cor: 'bg-[#1D3557]', textCor: 'text-[#1D3557]', corHex: '#1D3557' };
  if (str.includes('ict')) return { id: 3, shortLabel: 'ICT', icone: Microscope, cor: 'bg-[#0284C7]', textCor: 'text-[#0284C7]', corHex: '#0284C7' };
  
  // Default / Entidade de Pesquisa
  return { id: 1, shortLabel: nomeTipo || 'Entidade Pesquisa', icone: Microscope, cor: 'bg-[#457B9D]', textCor: 'text-[#457B9D]', corHex: '#457B9D' };
};

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
  const { ativosData, territoriosData, territoriesDynamicStats, loadingStats } = useContext(DataContext);

  const [focusedAsset, setFocusedAsset] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [selectedTerritory, setSelectedTerritory] = useState(null);

  // Filtro por string exata vinda da coluna nome_tipo / tipo
  const [selectedTipoFilter, setSelectedTipoFilter] = useState('todos');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Filtro no modo minimizado do gráfico: 'acima' (Top 10) ou 'abaixo' (Demais)
  const [minimizedFilter, setMinimizedFilter] = useState('acima');

  // Ordem dos cards
  const INITIAL_CARDS = ['card-ativos-list', 'card-empty', 'card-chart-ifdm', 'slot-empty'];
  const [cardsOrder, setCardsOrder] = useState(() => {
    const saved = localStorage.getItem('ativos-cards-order-v10');
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

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCardsOrder((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      const newArray = arrayMove(items, oldIndex, newIndex);
      localStorage.setItem('ativos-cards-order-v10', JSON.stringify(newArray));
      return newArray;
    });
  };

  // Processamento e enriquecimento dos ativos usando a coluna oficial do banco
  const ativosProcessados = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];

    return ativosData.map((a, idx) => {
      // Pega o nome do tipo diretamente da coluna 'tipo' ou 'nome_tipo' da View
      const nomeTipoColuna = a.tipo || a.nome_tipo || 'Outros';
      const configEstilo = getDynamicAssetTypeConfig(nomeTipoColuna);

      return {
        id: a.id_ativo || idx + 1,
        id_territorio: a.id_territorio,
        nome: a.nome_ativo || a.sigla || 'Ativo de CTI',
        sigla: a.sigla || '',
        tipo: nomeTipoColuna, // Rótulo oficial vindo direto do banco
        shortTipo: configEstilo.shortLabel,
        municipio: a.municipio || 'Bahia',
        territorio: a.territorio_identidade || '',
        lat: Number(a.latitude || a.lat || 0),
        lng: Number(a.longitude || a.lng || 0),
        icone: configEstilo.icone,
        cor: configEstilo.cor,
        textCor: configEstilo.textCor,
        corHex: configEstilo.corHex,
        urlReferencia: a.url_referencia || '',
        tituloReferencia: a.titulo_referencia || ''
      };
    });
  }, [ativosData]);

  // Lista de tipos únicos extraídos direto do banco para popular o dropdown de filtro
  const tiposUnicosDisponiveis = useMemo(() => {
    const tiposSet = new Set();
    ativosProcessados.forEach(a => {
      if (a.tipo) tiposSet.add(a.tipo);
    });
    return Array.from(tiposSet).sort();
  }, [ativosProcessados]);

  // Lista de ativos filtrada por tipo e território selecionado
  const filteredAtivosList = useMemo(() => {
    let lista = ativosProcessados;
    if (selectedTipoFilter !== 'todos') {
      lista = lista.filter(a => a.tipo === selectedTipoFilter);
    }
    if (selectedTerritory) {
      lista = lista.filter(a => a.id_territorio === selectedTerritory.id_territorio);
    }
    return lista;
  }, [ativosProcessados, selectedTipoFilter, selectedTerritory]);

  // Agregação para o Gráfico de Barras Segmentado
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
      }

      map[nomeRegiao].total += 1;
      const tKey = a.tipo;
      map[nomeRegiao].typesCount[tKey] = (map[nomeRegiao].typesCount[tKey] || 0) + 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [ativosProcessados]);

  const maxAtivosScale = useMemo(() => {
    if (!regioesAtivosCalculado.length) return 40;
    const maxTotal = Math.max(...regioesAtivosCalculado.map(r => r.total));
    return Math.ceil(maxTotal * 1.05);
  }, [regioesAtivosCalculado]);

  const getIsAlone = (cardId) => {
    const cardIndex = cardsOrder.indexOf(cardId);
    if (cardIndex === -1) return false;
    const neighborIdx = cardIndex === 0 ? 1 : cardIndex === 1 ? 0 : cardIndex === 2 ? 3 : 2;
    return cardsOrder[neighborIdx] === 'slot-empty';
  };

  const isChartAlone = getIsAlone('card-chart-ifdm');
  const isChartMinimized = !isChartAlone;

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

        {/* LEFT COLUMN: NOVO MAPA ISOLADO (SIDEMAP) */}
        <div className="lg:col-span-5 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 relative overflow-hidden flex flex-col group h-full min-h-0">
          <p className="absolute top-5 left-5 text-[#457B9D]/50 font-mono tracking-widest uppercase text-[10px] z-20 pointer-events-none group-hover:text-[#457B9D] transition-colors">
            Mapa Territorial & Ativos ({filteredAtivosList.length})
          </p>

          <SideMap
            territoriosData={territoriosData}
            territoriesDynamicStats={territoriesDynamicStats}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            processedAtivos={filteredAtivosList} // <-- Aqui garante que os pinos acompanham o filtro e aparecem!
            focusedAsset={focusedAsset}
          />
        </div>

        {/* RIGHT COLUMN: 3 CARDS EM 2x2 DND */}
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
                if (cardId === 'slot-empty') return null;

                // 1. LISTA DE ATIVOS
                if (cardId === 'card-ativos-list') {
                  const isAlone = getIsAlone('card-ativos-list');

                  return (
                    <SortableCard
                      key="card-ativos-list"
                      id="card-ativos-list"
                      className={`${isAlone ? 'md:col-span-2' : ''} ${isFilterDropdownOpen ? '!z-50' : 'z-10'}`}
                    >
                      <div className={`bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default min-h-0 ${
                        isFilterDropdownOpen ? '!z-50' : ''
                      }`}>

                        {/* CABEÇALHO DA LISTA COM FILTRO DINÂMICO */}
                        <div className="flex items-center justify-between gap-2 mb-3 shrink-0 pr-8 relative z-30">
                          <div className="flex items-center gap-2">
                            <MapPin size={15} className="text-[#457B9D]" />
                            <h3 className="text-[#1D3557] font-extrabold text-[13px] tracking-tight truncate max-w-[150px]">
                              {selectedTerritory ? selectedTerritory.nome_territorio || selectedTerritory.territorio : 'Lista de Ativos'}
                            </h3>
                            <span className="text-[10px] font-bold text-[#457B9D] bg-[#F1F5F9] px-2 py-0.5 rounded-full border border-[#E2E8F0] shrink-0">
                              {filteredAtivosList.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 relative">
                            {selectedTerritory && (
                              <button
                                onClick={() => setSelectedTerritory(null)}
                                className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                Limpar Região
                              </button>
                            )}

                            {/* BOTÃO DROPDOWN DE FILTRO */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsFilterDropdownOpen(!isFilterDropdownOpen);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border cursor-pointer select-none active:scale-95 ${
                                selectedTipoFilter !== 'todos'
                                  ? 'bg-[#1D3557] text-white border-[#1D3557] shadow-sm'
                                  : 'bg-[#F8FAFC] text-[#1D3557] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                              }`}
                            >
                              <Filter size={12} className={selectedTipoFilter !== 'todos' ? 'text-white' : 'text-[#457B9D]'} />
                              <span className="max-w-[110px] truncate">
                                {selectedTipoFilter === 'todos' ? 'Filtrar Tipo' : selectedTipoFilter}
                              </span>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* MENU DROPDOWN */}
                            {isFilterDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsFilterDropdownOpen(false); }} />
                                <div className="absolute right-0 mt-2 w-[270px] max-h-[240px] overflow-y-auto hide-scroll bg-white rounded-2xl shadow-[0_20px_50px_rgba(29,53,87,0.28)] border border-[#E2E8F0] p-1.5 z-50 flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#A0AEC0] border-b border-[#F1F5F9] mb-1">
                                    Filtrar por Tipo Oficial
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => { setSelectedTipoFilter('todos'); setIsFilterDropdownOpen(false); }}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all text-left ${selectedTipoFilter === 'todos' ? 'bg-[#F1F5F9] text-[#1D3557] font-bold' : 'text-[#457B9D] hover:bg-[#F8FAFC]'}`}
                                  >
                                    <span className="truncate">Todos os Tipos</span>
                                    <span className="text-[10px] text-[#A0AEC0]">({ativosProcessados.length})</span>
                                  </button>

                                  {tiposUnicosDisponiveis.map((tName) => {
                                    const isSelected = selectedTipoFilter === tName;
                                    const count = ativosProcessados.filter(a => a.tipo === tName).length;

                                    return (
                                      <button
                                        key={tName}
                                        type="button"
                                        onClick={() => { setSelectedTipoFilter(tName); setIsFilterDropdownOpen(false); }}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all text-left ${isSelected ? 'bg-[#F1F5F9] text-[#1D3557] font-bold' : 'text-[#457B9D] hover:bg-[#F8FAFC]'}`}
                                      >
                                        <span className="truncate pr-2">{tName}</span>
                                        <span className="text-[10px] text-[#A0AEC0] shrink-0">({count})</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* LISTAGEM DE ATIVOS */}
                        <div className={`flex-1 overflow-y-auto pr-1 hide-scroll min-h-0 relative z-10 pb-4 ${
                          isAlone ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5 content-start' : 'flex flex-col gap-2'
                        }`}>
                          {filteredAtivosList.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-[11px] font-semibold text-[#A0AEC0]">
                              {loadingStats ? 'Carregando...' : 'Nenhum ativo encontrado para os filtros selecionados.'}
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
                    <SortableCard key="card-empty" id="card-empty" className={isAlone ? 'md:col-span-2' : ''}>
                      <div className="bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col items-center justify-center h-full group cursor-default text-center min-h-0">
                        <span className="text-[#A0AEC0] font-medium text-[12px] uppercase tracking-widest">Card Vazio</span>
                      </div>
                    </SortableCard>
                  );
                }

                // 3. GRÁFICO DE BARRAS POR REGIÃO
                if (cardId === 'card-chart-ifdm') {
                  return (
                    <SortableCard key="card-chart-ifdm" id="card-chart-ifdm" className={isChartAlone ? 'md:col-span-2' : ''}>
                      <div className="bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default min-h-0">

                        <div className="flex items-center justify-between gap-2 mb-3 shrink-0 pr-8">
                          <div className="flex flex-col">
                            <h3 className="text-[#1D3557] font-extrabold text-[13px] tracking-tight flex items-center gap-2">
                              Ativos por Região
                            </h3>
                            <span className="text-[10px] font-semibold text-[#457B9D]">
                              {regioesAtivosCalculado.length} Territórios de Identidade
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isChartMinimized ? (
                              <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-full border border-[#E2E8F0]">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setMinimizedFilter('acima'); }}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all flex items-center gap-1 ${minimizedFilter === 'acima' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#457B9D] hover:text-[#1D3557]'}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                  Top 10 Regiões
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setMinimizedFilter('abaixo'); }}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all flex items-center gap-1 ${minimizedFilter === 'abaixo' ? 'bg-[#1D3557] text-white shadow-sm' : 'text-[#457B9D] hover:text-[#1D3557]'}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#A8DADC]"></span>
                                  Demais ({Math.max(0, regioesAtivosCalculado.length - 10)})
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold">
                                {tiposUnicosDisponiveis.slice(0, 4).map((tName, i) => {
                                  const conf = getDynamicAssetTypeConfig(tName);
                                  return (
                                    <div key={i} className="flex items-center gap-1">
                                      <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: conf.corHex }}></span>
                                      <span className="text-[#1D3557] truncate max-w-[90px]">{conf.shortLabel}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 w-full h-full relative min-h-0 pt-4 pb-1 px-1">
                          <div className="relative w-full h-full">
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                              <div className="w-full h-px bg-[#D6EAF8]"></div>
                              <div className="w-full h-px bg-[#D6EAF8]"></div>
                              <div className="w-full h-px bg-[#D6EAF8]"></div>
                            </div>

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
                                    {/* TOOLTIP */}
                                    {hoveredSlice && hoveredSlice.regiao === item.regiao && (
                                      <div
                                        className={`absolute bg-[#1D3557] text-white shadow-[0_10px_28px_rgba(29,53,87,0.4)] rounded-xl p-2 pointer-events-none z-50 whitespace-nowrap text-left flex flex-col gap-1 border border-white/15 w-max max-w-[190px] ${
                                          isRightEdge ? 'right-[calc(100%+8px)]' : 'left-[calc(100%+8px)]'
                                        }`}
                                        style={{ bottom: `${Math.max(4, Math.min(60, heightPercent - 5))}%` }}
                                      >
                                        <div className="flex items-center justify-between border-b border-white/10 pb-1 gap-2">
                                          <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{hoveredSlice.regiao}</span>
                                          <span className="text-[9px] font-semibold text-[#A8DADC] bg-white/10 px-1.5 py-0.5 rounded-full shrink-0">{hoveredSlice.total} total</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 pt-0.5">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: hoveredSlice.corHex }}></span>
                                            <span className="text-[10px] font-medium text-white/90 truncate">{hoveredSlice.typeLabel}</span>
                                          </div>
                                          <span className="text-[11px] font-black text-white px-1.5 py-0.5 rounded bg-white/10 shrink-0">{hoveredSlice.count}</span>
                                        </div>
                                        <div className={`absolute bottom-3 w-2 h-2 bg-[#1D3557] rotate-45 border-white/15 ${isRightEdge ? '-right-1 border-r border-t' : '-left-1 border-l border-b'}`}></div>
                                      </div>
                                    )}

                                    <div className="w-full flex items-end justify-center h-full relative">
                                      <div
                                        className="w-full max-w-[14px] sm:max-w-[18px] rounded-full relative flex flex-col-reverse overflow-hidden transition-all duration-500 ease-out group-hover/bar:scale-105 group-hover/bar:ring-2 group-hover/bar:ring-[#2563EB]/40 shadow-sm"
                                        style={{ height: `${heightPercent}%` }}
                                      >
                                        {Object.entries(item.typesCount).map(([tName, count]) => {
                                          if (count === 0) return null;
                                          const conf = getDynamicAssetTypeConfig(tName);
                                          const segPercent = (count / item.total) * 100;
                                          const isThisSliceHovered = hoveredSlice?.regiao === item.regiao && hoveredSlice?.typeLabel === tName;

                                          return (
                                            <div
                                              key={tName}
                                              onMouseEnter={(e) => {
                                                e.stopPropagation();
                                                setHoveredSlice({
                                                  regiao: item.regiao,
                                                  typeLabel: tName,
                                                  corHex: conf.corHex,
                                                  count: count,
                                                  total: item.total,
                                                });
                                              }}
                                              className={`w-full transition-all duration-200 cursor-pointer min-h-[3px] ${
                                                isThisSliceHovered ? 'brightness-125 saturate-150 ring-1 ring-white' : 'hover:brightness-110'
                                              }`}
                                              style={{ height: `${segPercent}%`, backgroundColor: conf.corHex }}
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
        </DndContext>
      </div>

      <style>{`
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