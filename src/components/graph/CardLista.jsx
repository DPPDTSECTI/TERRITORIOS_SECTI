import React, { useState, useEffect, useRef, useMemo, memo, useContext } from 'react';
import { 
  MapPin, 
  Filter, 
  ChevronDown, 
  Search, 
  Microscope,
  X
} from 'lucide-react';
import { normalize } from '../../utils/normalization';
import { DataContext } from '../../context/DataContext';

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
  tabs = [],
  activeTab = null,
  onTabChange = () => {},
  searchValue,
  onSearchChange,
  showSearch = false,
  searchPlaceholder = "Buscar..."
}) {
  const { filtroSemiarido } = useContext(DataContext) || {};
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const dropdownRef = useRef(null);

  const currentSearch = searchValue !== undefined ? searchValue : internalSearch;
  const hasTabs = tabs && tabs.length > 0;
  const currentTab = hasTabs ? (tabs.find(t => t.id === activeTab) || tabs[0]) : null;

  const displayItems = useMemo(() => {
    const term = normalize(currentSearch);
    if (!term) return items;
    return items.filter(item =>
      normalize(item.nome || item.entidade || '').includes(term) ||
      normalize(item.municipio || item.municipio_sede || '').includes(term) ||
      normalize(item.shortTipo || item.tipo || item.segmento || '').includes(term)
    );
  }, [items, currentSearch]);

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
        <div className="bg-surface rounded-card p-2.5 border border-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 min-w-0 overflow-hidden">
          <div className="flex items-center bg-surface-sunken p-1 rounded-control border border-border/70 gap-1 w-full sm:w-auto overflow-x-auto min-w-0 shrink-0 scrollbar-none">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = (activeTab || tabs[0]?.id) === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-control text-caption font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? (filtroSemiarido ? 'bg-accent-600 text-white shadow-xs' : 'bg-primary-600 text-white shadow-xs')
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {TabIcon && <TabIcon size={16} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {showSearch && (
            <div className="relative w-full lg:w-[calc((100%-26px)/3)] min-w-0 shrink-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={currentSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setInternalSearch(val);
                  if (onSearchChange) onSearchChange(val);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 h-9 rounded-control bg-surface border border-border text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              />
              {currentSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setInternalSearch('');
                    if (onSearchChange) onSearchChange('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-body font-medium p-0.5 rounded"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTAINER PRINCIPAL DO CARD */}
      <div className={`bg-surface rounded-card border border-border p-5 relative flex flex-col justify-start flex-1 group cursor-default min-h-0 min-w-0 overflow-hidden ${
        isDropdownOpen ? '!z-50' : 'z-10'
      }`}>

        {/* SE FOR UMA ABA COM CONTEÚDO CUSTOMIZADO */}
        {hasTabs && currentTab?.content ? (
          currentTab.content
        ) : (
          <>
            {/* CABEÇALHO PADRÃO DE LISTA COM FILTRO */}
            <div className="flex items-center justify-between gap-2 mb-3 shrink-0 pr-8 relative z-30">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={16} className="text-text-secondary shrink-0" />
                <h3 className="text-text-primary font-semibold text-subtitle tracking-tight truncate max-w-[180px]">
                  {selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : title}
                </h3>
                <span className="text-caption tnum font-medium text-text-muted bg-surface-sunken px-2 py-0.5 rounded-full border border-border shrink-0 inline-flex items-center justify-center leading-none">
                  {displayItems.length}
                </span>
              </div>

              {/* CONTROLE DE FILTRO DROPDOWN */}
              {filterOptions.length > 0 && (
                <div ref={dropdownRef} className="flex items-center gap-2 relative shrink-0">
                  {selectedTerritory && (
                    <button
                      onClick={onClearTerritory}
                      className="text-caption font-semibold text-danger-700 bg-danger-50 dark:bg-danger-950/40 dark:text-danger-300 px-2 py-1 rounded-control hover:bg-danger-100 transition-colors cursor-pointer inline-flex items-center justify-center leading-none"
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control text-caption font-medium transition-colors border cursor-pointer select-none ${
                      selectedFilter !== 'todos'
                        ? (filtroSemiarido ? 'bg-accent-600 text-white border-accent-600 shadow-xs' : 'bg-primary-600 text-white border-primary-600 shadow-xs')
                        : 'bg-surface text-text-secondary border-border hover:bg-surface-soft'
                    }`}
                  >
                    <Filter size={14} className={selectedFilter !== 'todos' ? 'text-white' : 'text-text-secondary'} />
                    <span className="max-w-[110px] truncate">
                      {selectedFilter === 'todos' ? filterLabel : selectedFilter}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div 
                      className="absolute right-0 top-full mt-1.5 w-[260px] max-h-[260px] overflow-y-auto scrollbar-none bg-surface-raised rounded-subcard shadow-float border border-border p-1.5 z-[200] flex flex-col gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-2.5 py-1 text-caption font-medium text-text-muted border-b border-border/60 mb-1">
                        {filterTitle}
                      </div>

                      <button
                        type="button"
                        onClick={() => { 
                          onSelectFilter('todos'); 
                          setIsDropdownOpen(false); 
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-control text-caption font-medium transition-colors text-left cursor-pointer ${
                          selectedFilter === 'todos' 
                            ? (filtroSemiarido ? 'bg-accent-50 text-accent-800 dark:bg-accent-950 dark:text-accent-200 font-bold' : 'bg-surface-soft text-text-primary font-semibold')
                            : 'text-text-secondary hover:bg-surface-soft'
                        }`}
                      >
                        <span className="truncate">Todos</span>
                        <span className="text-caption tnum text-text-muted">({items.length})</span>
                      </button>

                      {filterOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => { 
                            onSelectFilter(option); 
                            setIsDropdownOpen(false); 
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-control text-caption font-semibold transition-colors text-left cursor-pointer ${
                            selectedFilter === option 
                              ? (filtroSemiarido ? 'bg-accent-50 text-accent-800 dark:bg-accent-950 dark:text-accent-200 font-bold' : 'bg-surface-soft text-text-primary font-bold')
                              : 'text-text-secondary hover:bg-surface-soft'
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
            <div className={`flex-1 overflow-y-auto pr-2.5 scrollbar-none min-h-0 relative z-10 pb-4 ${
              isAlone ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5 content-start' : 'flex flex-col gap-2'
            }`}>
              {displayItems.length === 0 ? (
                <div className="relative col-span-full py-8 text-center text-body-sm font-medium text-text-muted">
                  {emptyMessage}
                </div>
              ) : (
                displayItems.map((item) => {
                  const IconComponent = item.icone || Microscope;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onItemClick(item)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-subcard hover:bg-surface-soft transition-colors duration-120 cursor-pointer border border-transparent ${
                        filtroSemiarido ? 'hover:border-accent-200' : 'hover:border-border'
                      } group shrink-0`}
                    >
                      <div 
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200"
                        style={{ backgroundColor: `${item.corHex || '#2563EB'}18` }}
                      >
                        <IconComponent size={16} style={{ color: item.corHex || '#2563EB' }} />
                      </div>

                      <div className="flex flex-col flex-1 min-w-0">
                        <span className={`text-caption font-semibold text-text-primary leading-tight mb-0.5 ${
                          filtroSemiarido ? 'group-hover:text-accent-700' : 'group-hover:text-primary-600'
                        } transition-colors line-clamp-1 truncate`} title={item.nome || item.entidade}>
                          {item.nome || item.entidade}
                        </span>
                        <div className="flex items-center justify-between mt-0.5 gap-1.5">
                          <span className="text-caption font-medium text-text-muted bg-surface-sunken px-2 py-0.5 rounded-full border border-border truncate max-w-[155px] inline-block leading-tight">
                            {item.shortTipo || item.tipo || item.segmento}
                          </span>
                          <span className="text-caption font-normal text-text-secondary truncate">
                            {item.municipio || item.municipio_sede}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-surface to-transparent pointer-events-none rounded-b-card z-20" />
          </>
        )}
      </div>
    </div>
  );
}

export default memo(CardLista);