import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import useTerritoriosData from '../../useTerritoriosData.js';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

export const DataContext = createContext(null);

export function DataProvider({ children }) {
  // Tema e Navegação
  const [darkMode, setDarkMode] = useState(false);
  const [navVisible, setNavVisible] = useState(true);

  // Estados de Busca e Filtro Geográfico
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filtroSemiarido, setFiltroSemiarido] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filtros de Desenvolvimento Territorial (IFDM)
  const [ifdmMin, setIfdmMin] = useState('');
  const [ifdmMax, setIfdmMax] = useState('');

  // Filtros de CTI
  const [ctiFilters, setCtiFilters] = useState({
    campiUniversidadePublica: true,
    campiUniversidadePrivada: true,
    campiInstitutoFederal: true,
    icts: true,
    centrosPesquisa: true,
    espacoDinamizadoress: true,
    parquesTecnologicos: true,
    incubadoras: true
  });

  // Filtros de Área e Cadeias
  const [areaGeralFilter, setAreaGeralFilter] = useState([]);
  const [cadeiaProdutivaFilter, setCadeiaProdutivaFilter] = useState([]);
  const [cadeiaSearchTerm, setCadeiaSearchTerm] = useState('');
  const debouncedCadeiaSearchTerm = useDebounce(cadeiaSearchTerm, 300);
  const [cursoSearchTerm, setCursoSearchTerm] = useState('');
  const debouncedCursoSearchTerm = useDebounce(cursoSearchTerm, 300);
  const [ctiSearchTerm, setCtiSearchTerm] = useState('');
  const debouncedCtiSearchTerm = useDebounce(ctiSearchTerm, 300);

  // Estados de Modais e Listas Expandidas
  const [expandedLists, setExpandedLists] = useState([]);
  const [modalVisibleCounts, setModalVisibleCounts] = useState({});
  const [isSideFilterOpen, setIsSideFilterOpen] = useState(false);
  const [isVerticalSearchOpen, setIsVerticalSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Tutorial auto-start tracking
  const handleCloseTutorial = useCallback(() => {
    setIsTutorialOpen(false);
    localStorage.setItem('painel_tutorial_seen', 'true');
  }, []);

  // Seleção de Território
  const handleSelectTerritory = useCallback((loc) => {
    setSelectedLocation(loc);
    setSearchTerm('');
  }, []);

  // Reset Geral de Filtros
  const resetGlobalFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedLocation(null);
    setIfdmMin('');
    setIfdmMax('');
    setFiltroSemiarido(false);
    setAreaGeralFilter([]);
    setCadeiaProdutivaFilter([]);
    setCadeiaSearchTerm('');
    setCursoSearchTerm('');
    setCtiSearchTerm('');
    setCtiFilters({
      campiUniversidadePublica: true,
      campiUniversidadePrivada: true,
      campiInstitutoFederal: true,
      icts: true,
      centrosPesquisa: true,
      espacoDinamizadoress: true,
      parquesTecnologicos: true,
      incubadoras: true
    });
    setIsDropdownOpen(false);
  }, []);

  // Pipeline Principal de Dados
  const {
    territoriosData,
    isLoadingPipeline,
    lastUpdate,
    carregarDadosDoSharePoint,
    filteredOptions,
    territoriesDynamicStats,
    dashboardData,
    semiaridoMunicipios
  } = useTerritoriosData({
    selectedLocation,
    filtroSemiarido,
    debouncedSearchTerm,
    ifdmMin,
    ifdmMax,
    cadeiaProdutivaFilter,
    ctiFilters,
    areaGeralFilter,
    debouncedCursoSearchTerm,
    debouncedCadeiaSearchTerm,
    debouncedCtiSearchTerm
  });

  const value = {
    // Tema e Nav
    darkMode, setDarkMode,
    navVisible, setNavVisible,

    // Filtros e Busca
    searchTerm, setSearchTerm, debouncedSearchTerm,
    selectedLocation, setSelectedLocation, handleSelectTerritory,
    filtroSemiarido, setFiltroSemiarido,
    isDropdownOpen, setIsDropdownOpen,
    ifdmMin, setIfdmMin,
    ifdmMax, setIfdmMax,
    ctiFilters, setCtiFilters,
    areaGeralFilter, setAreaGeralFilter,
    cadeiaProdutivaFilter, setCadeiaProdutivaFilter,
    cadeiaSearchTerm, setCadeiaSearchTerm, debouncedCadeiaSearchTerm,
    cursoSearchTerm, setCursoSearchTerm, debouncedCursoSearchTerm,
    ctiSearchTerm, setCtiSearchTerm, debouncedCtiSearchTerm,

    // Modais e Tutorial
    expandedLists, setExpandedLists,
    modalVisibleCounts, setModalVisibleCounts,
    isSideFilterOpen, setIsSideFilterOpen,
    isVerticalSearchOpen, setIsVerticalSearchOpen,
    isMobileMenuOpen, setIsMobileMenuOpen,
    isTutorialOpen, setIsTutorialOpen, handleCloseTutorial,
    resetGlobalFilters,

    // Dados do SharePoint / Pipeline
    territoriosData,
    isLoadingPipeline,
    lastUpdate,
    carregarDadosDoSharePoint,
    filteredOptions,
    territoriesDynamicStats,
    dashboardData,
    semiaridoMunicipios
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
}

export default DataContext;
