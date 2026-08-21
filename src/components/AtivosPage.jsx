import React, { useState, useMemo, useContext, useDeferredValue } from 'react';
import { GripHorizontal } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { DataContext } from '../context/DataContext';
import SideMap from './maps/SideMap';
import StackedBarChart from './graph/StackedBarChart';
import CardLista from './graph/CardLista';

import { MUNICIPIOS_COORDS } from '../data/municipiosCoords';
import { getDynamicAssetTypeConfig } from '../constants/assetTypes';

function SortableCard({ id, className = '', children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 50 : 1,
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative h-full flex flex-col min-h-0 transform-gpu backface-hidden will-change-transform ${className} ${
        isDragging ? 'opacity-40 scale-[1.02] shadow-2xl' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="absolute top-4 right-4 z-40 p-1.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 rounded-md hover:bg-gray-100 transition-colors duration-200 group-hover:text-[#1D3557]"
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
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [selectedTipoFilter, setSelectedTipoFilter] = useState('todos');
  const deferredTipoFilter = useDeferredValue(selectedTipoFilter);

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

  const handleDragEnd = (event) => {
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

  const ativosProcessados = useMemo(() => {
    if (!ativosData || ativosData.length === 0) return [];

    return ativosData.map((a, idx) => {
      const nomeTipoColuna = a.tipo || a.nome_tipo || 'Outros';
      const configEstilo = getDynamicAssetTypeConfig(nomeTipoColuna);

      const rawLat = a.latitude != null && a.latitude !== '' ? Number(a.latitude) : null;
      const rawLng = a.longitude != null && a.longitude !== '' ? Number(a.longitude) : null;

      let lat = rawLat;
      let lng = rawLng;

      if (lat == null || lng == null || isNaN(lat) || isNaN(lng) || lat === 0) {
        const munKey = String(a.municipio || '').trim();
        const fallback = MUNICIPIOS_COORDS[munKey] || MUNICIPIOS_COORDS[munKey.toLowerCase()] || [-12.9714, -38.5014];
        lat = fallback[0];
        lng = fallback[1];
      }

      return {
        id: a.id_ativo || idx + 1,
        id_territorio: a.id_territorio,
        nome: a.nome_ativo || a.sigla || 'Ativo de CTI',
        sigla: a.sigla || '',
        tipo: nomeTipoColuna,
        idTipoAtivo: configEstilo.id,
        shortTipo: configEstilo.shortLabel,
        municipio: a.municipio || 'Bahia',
        territorio: a.territorio_identidade || '',
        lat,
        lng,
        icone: configEstilo.icone,
        iconSvg: configEstilo.iconSvg,
        cor: configEstilo.bgClass,
        textCor: configEstilo.textClass,
        corHex: configEstilo.corHex,
        urlReferencia: a.url_referencia || '',
        tituloReferencia: a.titulo_referencia || ''
      };
    });
  }, [ativosData]);

  const tiposUnicosDisponiveis = useMemo(() => {
    const tiposSet = new Set();
    ativosProcessados.forEach(a => { if (a.tipo) tiposSet.add(a.tipo); });
    return Array.from(tiposSet).sort();
  }, [ativosProcessados]);

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

  const filteredAtivosList = useMemo(() => {
    let lista = ativosProcessados;
    if (deferredTipoFilter !== 'todos') {
      lista = lista.filter(a => a.tipo === deferredTipoFilter);
    }
    if (selectedTerritory) {
      lista = lista.filter(a => a.id_territorio === selectedTerritory.id_territorio);
    }
    return lista;
  }, [ativosProcessados, deferredTipoFilter, selectedTerritory]);

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
      <div className="flex items-center justify-between w-full shrink-0 pr-[340px]">
        <div className="flex flex-col">
          <h1 className="text-[28px] font-extrabold text-[#1D3557] tracking-tight leading-none mb-1">
            Ativos de CTI
          </h1>
          <p className="text-[#457B9D] font-medium text-[14px]">
            Explore os institutos, universidades, ICTs e parques tecnológicos pelo estado
          </p>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 min-h-0">
        
        {/* LADO ESQUERDO: MAPA COM ÍCONES */}
        <div className="lg:col-span-5 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 relative overflow-hidden flex flex-col group h-full min-h-0">
          <SideMap
            territoriosData={territoriosData}
            territoriesDynamicStats={territoriesDynamicStats}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            processedAtivos={filteredAtivosList}
            focusedAsset={focusedAsset}
          />
        </div>

        {/* LADO DIREITO: CARDS DND */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 auto-rows-[1fr] gap-5 h-full min-h-0">
            <SortableContext items={cardsOrder} strategy={rectSortingStrategy}>
              {cardsOrder.map((cardId) => {
                if (cardId === 'slot-empty') return null;

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