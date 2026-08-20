import React, { useState, useMemo, useContext } from 'react';
import { GripHorizontal } from 'lucide-react';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

import { DataContext } from '../context/DataContext';
import UserHeaderProfile from './UserHeaderProfile';
import SideMap from './maps/SideMap';
import StackedBarChart from './graph/StackedBarChart';
import CardLista from './graph/CardLista';

// === MAPEAMENTO DINÂMICO DOS TIPOS DE ATIVOS ===
export const getDynamicAssetTypeConfig = (nomeTipo) => {
  const str = String(nomeTipo || '').toLowerCase();
  
  if (str.includes('privada')) return { id: 9, shortLabel: 'Univ. Privada', cor: 'bg-[#60A5FA]', textCor: 'text-[#2563EB]', corHex: '#60A5FA' };
  if (str.includes('estadual')) return { id: 7, shortLabel: 'Univ. Estadual', cor: 'bg-[#2563EB]', textCor: 'text-[#2563EB]', corHex: '#2563EB' };
  if (str.includes('federal') && str.includes('universidade')) return { id: 8, shortLabel: 'Univ. Federal', cor: 'bg-[#1E40AF]', textCor: 'text-[#1E40AF]', corHex: '#1E40AF' };
  if (str.includes('instituto federal') || str.includes('ifba') || str.includes('if baiano')) return { id: 5, shortLabel: 'Inst. Federal', cor: 'bg-[#0EA5E9]', textCor: 'text-[#0284C7]', corHex: '#0EA5E9' };
  if (str.includes('aceleradora')) return { id: 10, shortLabel: 'Aceleradora', cor: 'bg-[#10B981]', textCor: 'text-[#059669]', corHex: '#10B981' };
  if (str.includes('dinamizador')) return { id: 2, shortLabel: 'Espaço Dinamizador', cor: 'bg-[#06B6D4]', textCor: 'text-[#0891B2]', corHex: '#06B6D4' };
  if (str.includes('incubadora')) return { id: 4, shortLabel: 'Incubadora', cor: 'bg-[#38BDF8]', textCor: 'text-[#0284C7]', corHex: '#38BDF8' };
  if (str.includes('parque')) return { id: 6, shortLabel: 'Parque Tecnológico', cor: 'bg-[#1D3557]', textCor: 'text-[#1D3557]', corHex: '#1D3557' };
  if (str.includes('ict')) return { id: 3, shortLabel: 'ICT', cor: 'bg-[#0284C7]', textCor: 'text-[#0284C7]', corHex: '#0284C7' };
  
  return { id: 1, shortLabel: nomeTipo || 'Entidade Pesquisa', cor: 'bg-[#457B9D]', textCor: 'text-[#457B9D]', corHex: '#457B9D' };
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
  const [selectedTerritory, setSelectedTerritory] = useState(null);

  // Filtro por string exata vinda da coluna nome_tipo / tipo
  const [selectedTipoFilter, setSelectedTipoFilter] = useState('todos');

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

  // Processamento dos dados de ativos
  const ativosProcessados = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];

    return ativosData.map((a, idx) => {
      const nomeTipoColuna = a.tipo || a.nome_tipo || 'Outros';
      const configEstilo = getDynamicAssetTypeConfig(nomeTipoColuna);

      return {
        id: a.id_ativo || idx + 1,
        id_territorio: a.id_territorio,
        nome: a.nome_ativo || a.sigla || 'Ativo de CTI',
        sigla: a.sigla || '',
        tipo: nomeTipoColuna,
        shortTipo: configEstilo.shortLabel,
        municipio: a.municipio || 'Bahia',
        territorio: a.territorio_identidade || '',
        lat: Number(a.latitude || a.lat || 0),
        lng: Number(a.longitude || a.lng || 0),
        cor: configEstilo.cor,
        textCor: configEstilo.textCor,
        corHex: configEstilo.corHex,
        urlReferencia: a.url_referencia || '',
        tituloReferencia: a.titulo_referencia || ''
      };
    });
  }, [ativosData]);

  // Tipos únicos para o dropdown
  const tiposUnicosDisponiveis = useMemo(() => {
    const tiposSet = new Set();
    ativosProcessados.forEach(a => {
      if (a.tipo) tiposSet.add(a.tipo);
    });
    return Array.from(tiposSet).sort();
  }, [ativosProcessados]);

  // Configuração das legendas/fatias do gráfico StackedBarChart
  const categoriesConfig = useMemo(() => {
    return tiposUnicosDisponiveis.map(tName => {
      const conf = getDynamicAssetTypeConfig(tName);
      return {
        key: tName,
        label: tName,
        shortLabel: conf.shortLabel,
        colorHex: conf.corHex
      };
    });
  }, [tiposUnicosDisponiveis]);

  // Lista de ativos filtrada por tipo e território
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

  // Agregação dos dados para o StackedBarChart
  const regioesStackedData = useMemo(() => {
    if (!ativosProcessados.length) return [];

    const map = {};
    ativosProcessados.forEach(a => {
      const rawTerr = (a.territorio || '').replace(/^Território de Identidade\s+/i, '').trim();
      const nomeRegiao = rawTerr || 'Outros';

      if (!map[nomeRegiao]) {
        map[nomeRegiao] = {
          label: nomeRegiao,
          total: 0,
          segments: {}
        };
      }

      map[nomeRegiao].total += 1;
      map[nomeRegiao].segments[a.tipo] = (map[nomeRegiao].segments[a.tipo] || 0) + 1;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [ativosProcessados]);

  const getIsAlone = (cardId) => {
    const cardIndex = cardsOrder.indexOf(cardId);
    if (cardIndex === -1) return false;
    const neighborIdx = cardIndex === 0 ? 1 : cardIndex === 1 ? 0 : cardIndex === 2 ? 3 : 2;
    return cardsOrder[neighborIdx] === 'slot-empty';
  };

  const isChartAlone = getIsAlone('card-chart-ifdm');
  const isListAlone = getIsAlone('card-ativos-list');

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

        {/* LEFT COLUMN: MAPA SIDEMAP */}
        <div className="lg:col-span-5 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 relative overflow-hidden flex flex-col group h-full min-h-0">
          <p className="absolute top-5 left-5 text-[#457B9D]/50 font-mono tracking-widest uppercase text-[10px] z-20 pointer-events-none group-hover:text-[#457B9D] transition-colors">
            Mapa Territorial & Ativos ({filteredAtivosList.length})
          </p>

          <SideMap
            territoriosData={territoriosData}
            territoriesDynamicStats={territoriesDynamicStats}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            processedAtivos={filteredAtivosList}
            focusedAsset={focusedAsset}
          />
        </div>

        {/* RIGHT COLUMN: CARDS DND */}
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

                // 1. CARD LISTA MODULARIZADO
                if (cardId === 'card-ativos-list') {
                  return (
                    <SortableCard
                      key="card-ativos-list"
                      id="card-ativos-list"
                      className={isListAlone ? 'md:col-span-2' : ''}
                    >
                      <CardLista
                        items={filteredAtivosList}
                        filterOptions={tiposUnicosDisponiveis}
                        selectedFilter={selectedTipoFilter}
                        onSelectFilter={setSelectedTipoFilter}
                        onItemClick={(ativo) => setFocusedAsset([ativo.lat, ativo.lng])}
                        title="Lista de Ativos"
                        filterLabel="Filtrar Tipo"
                        filterTitle="Filtrar por Tipo Oficial"
                        emptyMessage={loadingStats ? 'Carregando...' : 'Nenhum ativo encontrado para os filtros selecionados.'}
                        isAlone={isListAlone}
                        selectedTerritory={selectedTerritory}
                        onClearTerritory={() => setSelectedTerritory(null)}
                      />
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

                // 3. GRÁFICO STACKED BAR CHART MODULARIZADO
                if (cardId === 'card-chart-ifdm') {
                  return (
                    <SortableCard key="card-chart-ifdm" id="card-chart-ifdm" className={isChartAlone ? 'md:col-span-2' : ''}>
                      <StackedBarChart
                        data={regioesStackedData}
                        categories={categoriesConfig}
                        title="Ativos por Região"
                        subtitle={`${regioesStackedData.length} Territórios de Identidade`}
                        allowToggleView={!isChartAlone}
                      />
                    </SortableCard>
                  );
                }

                return null;
              })}
            </SortableContext>
          </div>
        </DndContext>
      </div>
    </main>
  );
}