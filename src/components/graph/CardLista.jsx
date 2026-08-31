import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  MapPin, 
  Filter, 
  ChevronDown, 
  Search, 
  Microscope,
  Award,
  Wheat,
  ExternalLink
} from 'lucide-react';

function CardLista({
  // --- Props Comuns ---
  items = [],
  title = "Lista de Itens",
  emptyMessage = "Nenhum item encontrado.",
  onItemClick = () => {},
  selectedTerritory = null,
  onClearTerritory = () => {},
  isAlone = false,
  className = '',

  // --- Modo 1: Filtro Dropdown Simples (ex: AtivosPage / CursosPage) ---
  filterOptions = [],
  selectedFilter = 'todos',
  onSelectFilter = () => {},
  filterLabel = "Filtrar Tipo",
  filterTitle = "Filtrar por Categoria",

  // --- Modo 2: Abas Dinâmicas (ex: CadeiaPage) ---
  tabs = [], // [{ id: 'catalogo', label: 'Catálogo', icon: GitPullRequest, count: 10, content: ... }]
  activeTab = null,
  onTabChange = () => {},
  showSearch = false,
  searchPlaceholder = "Buscar..."
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const dropdownRef = useRef(null);

  const hasTabs = tabs && tabs.length > 0;
  const currentTab = hasTabs ? (tabs.find(t => t.id === activeTab) || tabs[0]) : null;

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
    <div className={`flex flex-col gap-3 h-full min-h-0 ${className}`}>
      
      {/* SE HOUVER ABAS DINÂMICAS: RENDERIZA A BARRA DE NAVEGAÇÃO E BUSCA */}
      {hasTabs && (
        <div className="bg-white rounded-[24px] p-2.5 border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-2xl border border-[#E2E8F0] gap-1 w-full sm:w-auto overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = (activeTab || tabs[0]?.id) === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#1D3557] text-white shadow-xs'
                      : 'text-[#457B9D] hover:text-[#1D3557]'
                  }`}
                >
                  {TabIcon && <TabIcon size={13} />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#457B9D]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showSearch && (
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 transform-gpu text-[#457B9D]" />
              <input
                type="text"
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#1D3557] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
              />
              {internalSearch && (
                <button
                  type="button"
                  onClick={() => setInternalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 transform-gpu text-[#94A3B8] hover:text-[#1D3557] text-[12px] font-bold"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTAINER PRINCIPAL DO CARD */}
      <div className={`bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.08)] p-5 relative flex flex-col justify-start flex-1 group cursor-default min-h-0 ${
        isDropdownOpen ? '!z-50' : 'z-10'
      }`}>

        {/* SE FOR UMA ABA COM CONTEÚDO CUSTOMIZADO */}
        {hasTabs && currentTab?.content ? (
          currentTab.content
        ) : (
          <>
            {/* CABEÇALHO PADRÃO DE LISTA COM FILTRO */}
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

              {/* CONTROLE DE FILTRO DROPDOWN */}
              {filterOptions.length > 0 && (
                <div ref={dropdownRef} className="flex items-center gap-2 relative">
                  {selectedTerritory && (
                    <button
                      onClick={onClearTerritory}
                      className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Limpar Região
                    </button>
                  )}

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
              )}
            </div>

            {/* LISTAGEM DOS ITENS */}
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
                  const isIG = item.tipo === 'IG';

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
                        <span className="text-[12px] font-bold text-[#1D3557] leading-tight mb-0.5 group-hover:text-[#2563EB] transition-colors line-clamp-1 truncate" title={item.nome || item.entidade}>
                          {item.nome || item.entidade}
                        </span>
                        <div className="flex items-center justify-between mt-0.5 gap-1.5">
                          <span className="text-[9px] font-semibold text-[#A0AEC0] bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100 truncate max-w-[135px]">
                            {item.shortTipo || item.tipo || item.segmento}
                          </span>
                          <span className="text-[10px] font-bold text-[#457B9D] truncate">
                            {item.municipio || item.municipio_sede}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-[24px] z-20" />
          </>
        )}
      </div>
    </div>
  );
}

export default memo(CardLista);