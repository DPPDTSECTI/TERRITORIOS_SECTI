import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Filter, ChevronDown, Microscope } from 'lucide-react';

export default function CardLista({
  items = [],
  filterOptions = [],
  selectedFilter = 'todos',
  onSelectFilter = () => {},
  onItemClick = () => {},
  title = "Lista de Itens",
  filterLabel = "Filtrar Tipo",
  filterTitle = "Filtrar por Categoria",
  emptyMessage = "Nenhum item encontrado.",
  isAlone = false,
  selectedTerritory = null,
  onClearTerritory = () => {}
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha o dropdown ao clicar fora ou apertar Escape
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handlePointerDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  return (
    <div className={`bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.08)] p-5 relative flex flex-col justify-start h-full group cursor-default min-h-0 ${
      isDropdownOpen ? '!z-50' : 'z-10'
    }`}>
      
      {/* CABEÇALHO */}
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

        {/* ÁREA DE CONTROLE DE FILTRO */}
        <div ref={dropdownRef} className="flex items-center gap-2 relative">
          {selectedTerritory && (
            <button
              onClick={onClearTerritory}
              className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
            >
              Limpar Região
            </button>
          )}

          {/* BOTÃO DO DROPDOWN */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors duration-150 border cursor-pointer select-none active:scale-95 ${
              selectedFilter !== 'todos'
                ? 'bg-[#1D3557] text-white border-[#1D3557] shadow-xs'
                : 'bg-[#F8FAFC] text-[#1D3557] border-[#E2E8F0] hover:bg-[#F1F5F9]'
            }`}
          >
            <Filter size={12} className={selectedFilter !== 'todos' ? 'text-white' : 'text-[#457B9D]'} />
            <span className="max-w-[110px] truncate">
              {selectedFilter === 'todos' ? filterLabel : selectedFilter}
            </span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* MENU SUSPENSO */}
          {isDropdownOpen && (
            <div 
              className="absolute right-0 top-full mt-2 w-[270px] max-h-[260px] overflow-y-auto hide-scroll bg-white rounded-2xl shadow-[0_16px_40px_rgba(29,53,87,0.22)] border border-[#E2E8F0] p-1.5 z-[200] flex flex-col gap-0.5"
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
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors text-left cursor-pointer ${
                  selectedFilter === 'todos' ? 'bg-[#F1F5F9] text-[#1D3557] font-bold' : 'text-[#457B9D] hover:bg-[#F8FAFC]'
                }`}
              >
                <span className="truncate">Todos</span>
                <span className="text-[10px] text-[#A0AEC0]">({items.length})</span>
              </button>

              {filterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => { 
                    onSelectFilter(option); 
                    setIsDropdownOpen(false); 
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors text-left cursor-pointer ${
                    selectedFilter === option ? 'bg-[#F1F5F9] text-[#1D3557] font-bold' : 'text-[#457B9D] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span className="truncate pr-2">{option}</span>
                </button>
              ))}
            </div>
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
          items.map((item) => {
            const IconComponent = item.icone || Microscope;

            return (
              <div
                key={item.id}
                onClick={() => onItemClick(item)}
                className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors duration-150 cursor-pointer border border-transparent hover:border-[#E2E8F0] group shrink-0"
              >
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200"
                  style={{ backgroundColor: `${item.corHex || '#2563EB'}18` }}
                >
                  <IconComponent size={16} style={{ color: item.corHex || '#2563EB' }} />
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
            );
          })
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-[24px] z-20" />
    </div>
  );
}