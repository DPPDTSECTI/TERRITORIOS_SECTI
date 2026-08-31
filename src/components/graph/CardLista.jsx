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
        <div className="bg-surface rounded-xl p-2.5 border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center bg-surface-soft p-1 rounded-xl border border-border gap-1 w-full sm:w-auto overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = (activeTab || tabs[0]?.id) === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary-900 text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {TabIcon && <TabIcon size={13} />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-border text-text-secondary'
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
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 transform-gpu text-text-secondary" />
              <input
                type="text"
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-soft border border-border text-[11px] text-text-primary placeholder-text-muted focus:bg-surface focus:border-primary-600 focus:outline-none transition-colors"
              />
              {internalSearch && (
                <button
                  type="button"
                  onClick={() => setInternalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 transform-gpu text-text-muted hover:text-text-primary text-[12px] font-bold"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTAINER PRINCIPAL DO CARD */}
      <div className={`bg-surface rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow p-6 relative flex flex-col justify-start flex-1 group cursor-default min-h-0 ${
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
                <MapPin size={15} className="text-text-secondary" />
                <h3 className="text-text-primary font-semibold text-[13px] tracking-tight truncate max-w-[150px]">
                  {selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : title}
                </h3>
                <span className="text-[10px] font-medium text-text-muted bg-surface-soft px-2 py-0.5 rounded-full border border-border shrink-0">
                  {items.length}
                </span>
              </div>

              {/* CONTROLE DE FILTRO DROPDOWN */}
              {filterOptions.length > 0 && (
                <div ref={dropdownRef} className="flex items-center gap-2 relative">
                  {selectedTerritory && (
                    <button
                      onClick={onClearTerritory}
                      className="text-[10px] font-bold text-danger-700 bg-danger-50 px-2 py-1 rounded-lg hover:bg-danger-100 transition-colors cursor-pointer"
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors duration-150 border cursor-pointer select-none active:scale-95 ${
                      selectedFilter !== 'todos'
                        ? 'bg-primary-900 text-white border-primary-900 shadow-sm'
                        : 'bg-surface text-text-secondary border-border hover:bg-surface-soft'
                    }`}
                  >
                    <Filter size={12} className={selectedFilter !== 'todos' ? 'text-white' : 'text-text-secondary'} />
                    <span className="max-w-[110px] truncate">
                      {selectedFilter === 'todos' ? filterLabel : selectedFilter}
                    </span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-[270px] max-h-[260px] overflow-y-auto hide-scroll bg-surface rounded-xl shadow-md border border-border p-1.5 z-[200] flex flex-col gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted border-b border-border mb-1">
                        {filterTitle}
                      </div>

                      <button
                        type="button"
                        onClick={() => { 
                          onSelectFilter('todos'); 
                          setIsDropdownOpen(false); 
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors text-left cursor-pointer ${
                          selectedFilter === 'todos' ? 'bg-surface-soft text-text-primary font-semibold' : 'text-text-secondary hover:bg-surface-soft'
                        }`}
                      >
                        <span className="truncate">Todos</span>
                        <span className="text-[10px] text-text-muted">({items.length})</span>
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
                            selectedFilter === option ? 'bg-surface-soft text-text-primary font-bold' : 'text-text-secondary hover:bg-surface-soft'
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
                <div className="col-span-full py-8 text-center text-[11px] font-semibold text-text-muted">
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
                      className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-surface-soft transition-colors duration-150 cursor-pointer border border-transparent hover:border-border group shrink-0"
                    >
                      <div 
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200"
                        style={{ backgroundColor: `${item.corHex || '#2563EB'}18` }}
                      >
                        <IconComponent size={16} style={{ color: item.corHex || '#2563EB' }} />
                      </div>

                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[12px] font-bold text-text-primary leading-tight mb-0.5 group-hover:text-primary-600 transition-colors line-clamp-1 truncate" title={item.nome || item.entidade}>
                          {item.nome || item.entidade}
                        </span>
                        <div className="flex items-center justify-between mt-0.5 gap-1.5">
                          <span className="text-[9px] font-semibold text-text-muted bg-surface-soft px-1.5 py-0.5 rounded-full border border-border truncate max-w-[135px]">
                            {item.shortTipo || item.tipo || item.segmento}
                          </span>
                          <span className="text-[10px] font-bold text-text-secondary truncate">
                            {item.municipio || item.municipio_sede}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface to-transparent pointer-events-none rounded-b-[24px] z-20" />
          </>
        )}
      </div>
    </div>
  );
}

export default memo(CardLista);