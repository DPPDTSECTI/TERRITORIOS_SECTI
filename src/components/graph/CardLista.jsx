import React, { useState } from 'react';
import { MapPin, Filter, ChevronDown } from 'lucide-react';

/**
 * Componente genérico de lista com filtros suspensos.
 *
 * Props:
 * @param {Array} items - Array de itens para listagem [{ id, nome, shortTipo, municipio, cor, textCor, lat, lng, ... }]
 * @param {Array} filterOptions - Array de opções de filtro (strings dos tipos disponíveis)
 * @param {String} selectedFilter - Filtro ativo ('todos' ou valor específico)
 * @param {Function} onSelectFilter - Callback para atualizar o filtro
 * @param {Function} onItemClick - Callback disparado ao clicar em um item (ex: focar no mapa)
 * @param {String} title - Título exibido no cabeçalho
 * @param {String} filterLabel - Rótulo padrão do botão de filtro
 * @param {String} filterTitle - Título dentro do menu dropdown
 * @param {String} emptyMessage - Mensagem quando a lista estiver vazia
 * @param {Boolean} isAlone - Define se o card ocupa 2 colunas no grid
 * @param {Object} selectedTerritory - Território selecionado (opcional)
 * @param {Function} onClearTerritory - Callback para limpar o território selecionado
 */
export default function CardLista({
  items = [],
  filterOptions = [],
  selectedFilter = 'todos',
  onSelectFilter = () => {},
  onItemClick = () => {},
  title = "Lista de Itens",
  filterLabel = "Filtrar Tipo",
  filterTitle = "Filtrar por Categoria",
  emptyMessage = "Nenhum item encontrado para os filtros selecionados.",
  isAlone = false,
  selectedTerritory = null,
  onClearTerritory = () => {}
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className={`bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default min-h-0 ${
      isDropdownOpen ? '!z-50' : ''
    }`}>
      
      {/* CABEÇALHO COM CONTROLES DE FILTRO */}
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0 pr-8 relative z-30">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-[#457B9D]" />
          <h3 className="text-[#1D3557] font-extrabold text-[13px] tracking-tight truncate max-w-[150px]">
            {selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : title}
          </h3>
          <span className="text-[10px] font-bold text-[#457B9D] bg-[#F1F5F9] px-2 py-0.5 rounded-full border border-[#E2E8F0] shrink-0">
            {items.length}
          </span>
        </div>

        <div className="flex items-center gap-2 relative">
          {selectedTerritory && (
            <button
              onClick={onClearTerritory}
              className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors"
            >
              Limpar Região
            </button>
          )}

          {/* BOTÃO DROPDOWN */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border cursor-pointer select-none active:scale-95 ${
              selectedFilter !== 'todos'
                ? 'bg-[#1D3557] text-white border-[#1D3557] shadow-sm'
                : 'bg-[#F8FAFC] text-[#1D3557] border-[#E2E8F0] hover:bg-[#F1F5F9]'
            }`}
          >
            <Filter size={12} className={selectedFilter !== 'todos' ? 'text-white' : 'text-[#457B9D]'} />
            <span className="max-w-[110px] truncate">
              {selectedFilter === 'todos' ? filterLabel : selectedFilter}
            </span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* MENU FLUTUANTE DROPDOWN */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(false);
                }}
              />
              <div
                className="absolute right-0 mt-2 w-[270px] max-h-[240px] overflow-y-auto hide-scroll bg-white rounded-2xl shadow-[0_20px_50px_rgba(29,53,87,0.28)] border border-[#E2E8F0] p-1.5 z-50 flex flex-col gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#A0AEC0] border-b border-[#F1F5F9] mb-1">
                  {filterTitle}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectFilter('todos');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all text-left ${
                    selectedFilter === 'todos' ? 'bg-[#F1F5F9] text-[#1D3557] font-bold' : 'text-[#457B9D] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="truncate">Todos</span>
                  <span className="text-[10px] text-[#A0AEC0]">({items.length})</span>
                </button>

                {filterOptions.map((option) => {
                  const isSelected = selectedFilter === option;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        onSelectFilter(option);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all text-left ${
                        isSelected ? 'bg-[#F1F5F9] text-[#1D3557] font-bold' : 'text-[#457B9D] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span className="truncate pr-2">{option}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* LISTA ROLÁVEL */}
      <div className={`flex-1 overflow-y-auto pr-1 hide-scroll min-h-0 relative z-10 pb-4 ${
        isAlone ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5 content-start' : 'flex flex-col gap-2'
      }`}>
        {items.length === 0 ? (
          <div className="col-span-full py-8 text-center text-[11px] font-semibold text-[#A0AEC0]">
            {emptyMessage}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-all duration-300 cursor-pointer border border-transparent hover:border-[#E2E8F0] hover:-translate-y-0.5 group shrink-0"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${item.cor ? `${item.cor}/10` : 'bg-blue-50'} group-hover:scale-110 transition-transform duration-300`}>
                <span className={`w-2.5 h-2.5 rounded-full ${item.cor || 'bg-[#2563EB]'}`}></span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[12px] font-bold text-[#1D3557] leading-tight mb-0.5 group-hover:text-[#2563EB] transition-colors line-clamp-1 truncate" title={item.nome}>
                  {item.nome}
                </span>
                <div className="flex items-center justify-between mt-0.5 gap-1.5">
                  <span className="text-[9px] font-semibold text-[#A0AEC0] bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100 truncate max-w-[135px]">
                    {item.shortTipo || item.tipo}
                  </span>
                  <span className="text-[10px] font-bold text-[#457B9D] truncate">{item.municipio}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-[24px] z-20" />
    </div>
  );
}