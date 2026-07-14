import { Helmet, HelmetProvider } from 'react-helmet-async';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import ConectaMap from "../ConectaMap"; 
import LandingHero from './components/hero';
import { Target, BarChart3, Database, Settings, Map as MapIcon, Code, Info, Download, Sun, Home, Filter, Search, Eraser, RefreshCw, Expand, Minimize, Plus } from 'lucide-react';
import useTerritoriosData from '../useTerritoriosData.js';
import territoriosMunicipios from '../utils/territorioMunicipios.json'; 
import SobrePage from './components/SobrePage';

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================
function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function fixWeirdCapitalization(str) {
    if (!str || typeof str !== 'string') return str;
    return str.split(' ').map(word => {
        const letters = word.replace(/[^a-zA-ZáéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]/g, '');
        if (letters.length < 3) return word.replace(/(?<=[áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ])([A-Z])/g, (match) => match.toLowerCase());
        const upperCount = (letters.match(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g) || []).length;
        const ratio = upperCount / letters.length;
        if (ratio > 0.5) return word.toLocaleUpperCase('pt-BR');
        return word.replace(/(?<=[áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ])([A-Z])/g, (match) => match.toLowerCase());
    }).join(' ');
}

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

const createArrayFilterToggleHandler = (setter) => (itemName) => {
    setter(prev => {
        const newItems = new Set(prev);
        if (newItems.has(itemName)) {
            newItems.delete(itemName);
        } else {
            newItems.add(itemName);
        }
        return Array.from(newItems);
    });
};
// ==========================================
// COMPONENTE PRINCIPAL DO APP
// ==========================================
function MainApp() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados Básicos
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filtroSemiarido, setFiltroSemiarido] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [areaGeralFilter, setAreaGeralFilter] = useState([]);
  const [cadeiaProdutivaFilter, setCadeiaProdutivaFilter] = useState([]);
  const [isAreaGeralOpen, setIsAreaGeralOpen] = useState(false);
  const [cursoSearchTerm, setCursoSearchTerm] = useState('');
  const debouncedCursoSearchTerm = useDebounce(cursoSearchTerm, 300);
  const [expandedLists, setExpandedLists] = useState([]);
  const [isModalAreaGeralOpen, setIsModalAreaGeralOpen] = useState(false);
  const [isModalCtiFilterOpen, setIsModalCtiFilterOpen] = useState(false);
  const [isModalCadeiaFilterOpen, setIsModalCadeiaFilterOpen] = useState(false);
  const [isModalAddListOpen, setIsModalAddListOpen] = useState(false);

  // Navbars e Scroll
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Menus Laterais
  const [isSideFilterOpen, setIsSideFilterOpen] = useState(false);
  const [isVerticalSearchOpen, setIsVerticalSearchOpen] = useState(false);

  // Filtros de D.Territorial
  const [ifdmMin, setIfdmMin] = useState('');
  const [ifdmMax, setIfdmMax] = useState('');
  const [semiMunsMin, setSemiMunsMin] = useState('');
  const [semiMunsMax, setSemiMunsMax] = useState('');

  // Filtros de CTI
  const [ctiFilters, setCtiFilters] = useState({
      campiUniversidadePublica: true, campiUniversidadePrivada: true, ifs: true, icts: true, centrosPesquisa: true, espacos: true, parques: true, incubadoras: true
  });

  const sideFilterRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const areaGeralRef = useRef(null);
  const mapSectionRef = useRef(null);
  const modalAreaGeralRef = useRef(null);
  const modalCtiFilterRef = useRef(null);
  const modalCadeiaFilterRef = useRef(null);
  const modalAddListRef = useRef(null);

  const resetGlobalFilters = () => {
      setSearchTerm('');
      setSelectedLocation(null);
      setIfdmMin(''); setIfdmMax('');
      setSemiMunsMin(''); setSemiMunsMax('');
      setFiltroSemiarido(false);
      setAreaGeralFilter([]);
      setCadeiaProdutivaFilter([]);
      setCursoSearchTerm('');
      setCtiFilters({
          campiUniversidadePublica: true, campiUniversidadePrivada: true, ifs: true, icts: true, centrosPesquisa: true, espacos: true, parques: true, incubadoras: true
      });
      setIsDropdownOpen(false);
  };

  const handleCloseModal = useCallback(() => {
    setExpandedLists([]);
    setIsModalAreaGeralOpen(false);
    setIsModalCtiFilterOpen(false);
    setIsModalCadeiaFilterOpen(false);
    setIsModalAddListOpen(false);
  }, []);

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
    semiMunsMin,
    semiMunsMax,
    cadeiaProdutivaFilter,
    ctiFilters,
    areaGeralFilter,
    debouncedCursoSearchTerm,
  });

  const handleSelectTerritory = useCallback((loc) => {
    setSelectedLocation(loc);
    setSearchTerm(''); 
  }, []); 

  useEffect(() => {
    function handleClickOutside(event) { 
        if (sideFilterRef.current && !sideFilterRef.current.contains(event.target)) {
            setIsSideFilterOpen(false);
        }
        if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
    if (areaGeralRef.current && !areaGeralRef.current.contains(event.target)) {
        setIsAreaGeralOpen(false);
    }
    if (modalAreaGeralRef.current && !modalAreaGeralRef.current.contains(event.target)) {
        setIsModalAreaGeralOpen(false);
    }
    if (modalCtiFilterRef.current && !modalCtiFilterRef.current.contains(event.target)) {
        setIsModalCtiFilterOpen(false);
    }
    if (modalCadeiaFilterRef.current && !modalCadeiaFilterRef.current.contains(event.target)) {
        setIsModalCadeiaFilterOpen(false);
    }
    if (modalAddListRef.current && !modalAddListRef.current.contains(event.target)) {
        setIsModalAddListOpen(false);
    }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); 

  useEffect(() => {
    if (selectedLocation && mapSectionRef.current) {
      setTimeout(() => { mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
    }
  }, [selectedLocation]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setNavVisible(false); 
      } else {
        setNavVisible(true);  
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleCtiFilter = (key) => { setCtiFilters(prev => ({ ...prev, [key]: !prev[key] })); };
  const ctiFilterKeys = useMemo(() => ['campiUniversidadePublica', 'campiUniversidadePrivada', 'ifs', 'icts', 'centrosPesquisa', 'espacos', 'parques', 'incubadoras'], []);
  const areAllCtiSelected = useMemo(() => ctiFilterKeys.every(key => ctiFilters[key]), [ctiFilters, ctiFilterKeys]);

  const handleToggleAllCti = () => {
    const newValue = !areAllCtiSelected;
    const newFilters = {};
    ctiFilterKeys.forEach(key => { newFilters[key] = newValue; });
    setCtiFilters(newFilters);
  };

  const handleCtiKpiClick = (clickedKey) => {
    const activeKeys = ctiFilterKeys.filter(key => ctiFilters[key]);
    const areAllCurrentlyActive = activeKeys.length === ctiFilterKeys.length;

    if (areAllCurrentlyActive) {
      const newFilters = {};
      ctiFilterKeys.forEach(key => { newFilters[key] = (key === clickedKey); });
      setCtiFilters(newFilters);
    } else if (activeKeys.length === 1 && ctiFilters[clickedKey]) {
      handleToggleAllCti();
    } else {
      toggleCtiFilter(clickedKey);
    }
  };

  const handleAreaGeralToggle = createArrayFilterToggleHandler(setAreaGeralFilter);
  const handleCadeiaProdutivaToggle = createArrayFilterToggleHandler(setCadeiaProdutivaFilter);

  const getAreaFilterButtonText = () => {
    if (areaGeralFilter.length === 0) return 'Filtrar Área';
    if (areaGeralFilter.length === 1) return `Área: ${areaGeralFilter[0]}`;
    return `${areaGeralFilter.length} Selecionadas`;
  };

  const getCtiBadgeStyle = (cat, isDark) => {
      const styles = {
          campiUniversidadePublica: isDark ? 'bg-gov-blue/10 text-blue-400 border-gov-blue/20' : 'bg-gov-blue/10 text-gov-blue-dark border-gov-blue/20',
          campiUniversidadePrivada: isDark ? 'bg-gov-cyan/10 text-cyan-400 border-gov-cyan/20' : 'bg-gov-cyan/10 text-gov-cyan-dark border-gov-cyan/20',
          ifs: isDark ? 'bg-gov-green/10 text-green-400 border-gov-green/20' : 'bg-gov-green/10 text-gov-green-dark border-gov-green/20',
          icts: isDark ? 'bg-gov-purple/10 text-purple-400 border-gov-purple/20' : 'bg-gov-purple/10 text-gov-purple-dark border-gov-purple/20',
          centrosPesquisa: isDark ? 'bg-gov-orange/10 text-orange-400 border-gov-orange/20' : 'bg-gov-orange/10 text-gov-orange-dark border-gov-orange/20',
          espacos: isDark ? 'bg-gov-pink/10 text-pink-400 border-gov-pink/20' : 'bg-gov-pink/10 text-gov-pink-dark border-gov-pink/20',
          parques: isDark ? 'bg-gov-yellow/10 text-yellow-400 border-gov-yellow/20' : 'bg-gov-yellow/10 text-gov-yellow-dark border-gov-yellow/20',
          incubadoras: isDark ? 'bg-gov-teal/10 text-teal-400 border-gov-teal/20' : 'bg-gov-teal/10 text-gov-teal-dark border-gov-teal/20',
      };
      return styles[cat] || (isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200');
  };

  const getBadgeStyle = (tipo) => {
      const t = String(tipo).toLowerCase();
      if (t.includes('potencial')) return darkMode ? 'bg-gov-orange/10 text-orange-400 border-gov-orange/20' : 'bg-gov-orange/10 text-gov-orange-dark border-gov-orange/20';
      if (t.includes('ig') || t.includes('indicação')) return darkMode ? 'bg-gov-purple/10 text-purple-400 border-gov-purple/20' : 'bg-gov-purple/10 text-gov-purple-dark border-gov-purple/20';
      if (t.includes('apl') || t.includes('arranjo')) return darkMode ? 'bg-gov-blue/10 text-blue-400 border-gov-blue/20' : 'bg-gov-blue/10 text-gov-blue-dark border-gov-blue/20';
      return darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getAreaStyles = (areaName, darkMode) => {
      const norm = normalize(areaName);
      let theme = 'default';
      
      if (norm.includes('engenharia')) theme = 'gov-red';
      else if (norm.includes('agraria') || norm.includes('agricultura') || norm.includes('veterinaria')) theme = 'gov-green';
      else if (norm.includes('saude')) theme = 'gov-cyan'; 
      else if (norm.includes('biologica')) theme = 'gov-teal'; 
      else if (norm.includes('exata') || norm.includes('tecnologia') || norm.includes('computacao')) theme = 'gov-blue'; 
      else if (norm.includes('naturais') || norm.includes('natureza') || norm.includes('matematica') || norm.includes('estatistica')) theme = 'gov-orange'; 
      else if (norm.includes('humana')) theme = 'gov-purple'; 
      else if (norm.includes('sociai') || norm.includes('aplicada')) theme = 'gov-pink'; 
      else if (norm.includes('letra') || norm.includes('arte') || norm.includes('linguistica')) theme = 'gov-yellow';
      else if (norm.includes('multidisciplinar')) theme = 'gov-purple';

      const styles = {
          'gov-green': { dot: 'bg-gov-green', text: darkMode ? 'text-green-400' : 'text-gov-green-dark', activeBg: darkMode ? 'bg-gov-green/20 border-gov-green/50' : 'bg-gov-green/10 border-gov-green/20', countBg: darkMode ? 'bg-gov-green/30 text-green-400' : 'bg-white text-gov-green-dark' },
          'gov-cyan': { dot: 'bg-gov-cyan', text: darkMode ? 'text-cyan-400' : 'text-gov-cyan-dark', activeBg: darkMode ? 'bg-gov-cyan/20 border-gov-cyan/50' : 'bg-gov-cyan/10 border-gov-cyan/20', countBg: darkMode ? 'bg-gov-cyan/30 text-cyan-400' : 'bg-white text-gov-cyan-dark' },
          'gov-blue': { dot: 'bg-gov-blue', text: darkMode ? 'text-blue-400' : 'text-gov-blue-dark', activeBg: darkMode ? 'bg-gov-blue/20 border-gov-blue/50' : 'bg-gov-blue/10 border-gov-blue/20', countBg: darkMode ? 'bg-gov-blue/30 text-blue-400' : 'bg-white text-gov-blue-dark' },
          'gov-pink': { dot: 'bg-gov-pink', text: darkMode ? 'text-pink-400' : 'text-gov-pink-dark', activeBg: darkMode ? 'bg-gov-pink/20 border-gov-pink/50' : 'bg-gov-pink/10 border-gov-pink/20', countBg: darkMode ? 'bg-gov-pink/30 text-pink-400' : 'bg-white text-gov-pink-dark' },
          'gov-red': { dot: 'bg-gov-red', text: darkMode ? 'text-red-400' : 'text-gov-red-dark', activeBg: darkMode ? 'bg-gov-red/20 border-gov-red/50' : 'bg-gov-red/10 border-gov-red/20', countBg: darkMode ? 'bg-gov-red/30 text-red-400' : 'bg-white text-gov-red-dark' },
          'gov-yellow': { dot: 'bg-gov-yellow', text: darkMode ? 'text-yellow-400' : 'text-gov-yellow-dark', activeBg: darkMode ? 'bg-gov-yellow/20 border-gov-yellow/50' : 'bg-gov-yellow/10 border-gov-yellow/20', countBg: darkMode ? 'bg-gov-yellow/30 text-yellow-400' : 'bg-white text-gov-yellow-dark' },
          'gov-teal': { dot: 'bg-gov-teal', text: darkMode ? 'text-teal-400' : 'text-gov-teal-dark', activeBg: darkMode ? 'bg-gov-teal/20 border-gov-teal/50' : 'bg-gov-teal/10 border-gov-teal/20', countBg: darkMode ? 'bg-gov-teal/30 text-teal-400' : 'bg-white text-gov-teal-dark' },
          'gov-purple': { dot: 'bg-gov-purple', text: darkMode ? 'text-purple-400' : 'text-gov-purple-dark', activeBg: darkMode ? 'bg-gov-purple/20 border-gov-purple/50' : 'bg-gov-purple/10 border-gov-purple/20', countBg: darkMode ? 'bg-gov-purple/30 text-purple-400' : 'bg-white text-gov-purple-dark' },
          'gov-orange': { dot: 'bg-gov-orange', text: darkMode ? 'text-orange-400' : 'text-gov-orange-dark', activeBg: darkMode ? 'bg-gov-orange/20 border-gov-orange/50' : 'bg-gov-orange/10 border-gov-orange/20', countBg: darkMode ? 'bg-gov-orange/30 text-orange-400' : 'bg-white text-gov-orange-dark' },
          default: { dot: 'bg-gray-500', text: darkMode ? 'text-gray-400' : 'text-gray-600', activeBg: darkMode ? 'bg-gray-500/20 border-gray-500/50' : 'bg-gray-100 border-gray-200', countBg: darkMode ? 'bg-gray-500/30 text-gray-400' : 'bg-white text-gray-800' }
      };
      return styles[theme] || styles.default;
  };

  const isActive = (path) => location.pathname === path;

  // NOTA: As cores 'gov-*' devem ser configuradas no seu arquivo tailwind.config.js.
  // Exemplo:
  // theme: { extend: { colors: {
  //   'gov-blue': '#005A9C',
  //   'gov-green': '#28A745',
  //   'gov-red': '#DC3545',
  //   'gov-yellow': '#FFC107',
  //   'gov-cyan': '#17A2B8',
  //   /* ... etc ... */
  // }}}

  const themeClasses = {
      app: darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800',
      glass: darkMode ? 'bg-gray-900/80 border-gray-700/60 shadow-2xl backdrop-blur-xl' : 'bg-white/80 border-gray-200/80 shadow-xl backdrop-blur-xl',
      textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
      cardHover: darkMode ? 'hover:bg-gray-800/50 hover:border-gray-700' : 'hover:bg-white hover:border-gray-300'
  };

  const areaGeralSummary = useMemo(() => {
      const counts = {};
      (dashboardData.cursos || []).forEach(c => {
          const area = c.areaGeral || 'Não Informada';
          counts[area] = (counts[area] || 0) + 1;
      });
      return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [dashboardData.cursos]);

  const cursosFiltrados = useMemo(() => {
      let result = dashboardData.cursos || [];
      if (areaGeralFilter.length > 0) result = result.filter(c => areaGeralFilter.includes(c.areaGeral || 'Não Informada'));
      if (debouncedCursoSearchTerm) {
          const term = normalize(debouncedCursoSearchTerm);
          result = result.filter(curso => normalize(curso.curso).includes(term));
      }
      return result;
  }, [dashboardData.cursos, areaGeralFilter, debouncedCursoSearchTerm]);

  // `todasAsAreasGerais` é a lista completa de todas as áreas possíveis, usada para renderizar todas as opções no dropdown.
  // É derivada de `territoriosData` para ser estável e não mudar com os filtros.
  const todasAsAreasGerais = useMemo(() => {
    const areas = new Set();
    territoriosData.forEach(t => {
        (t.cursosDetalhado || []).forEach(c => {
            areas.add(c.areaGeral || 'Não Informada');
        });
    });
    return [...areas].sort();
  }, [territoriosData]);

  const hasActiveFilters = searchTerm !== '' || 
                           selectedLocation !== null || 
                           ifdmMin !== '' || 
                           ifdmMax !== '' || 
                           semiMunsMin !== '' ||
                           semiMunsMax !== '' ||
                           filtroSemiarido !== false || 
                           areaGeralFilter.length > 0 || 
                           cadeiaProdutivaFilter.length > 0 ||
                           cursoSearchTerm !== '' || 
                           !Object.values(ctiFilters).every(val => val === true);

  const availableListsToAdd = ['cti', 'cadeias', 'cursos'].filter(type => !expandedLists.includes(type));

  const subKpisList = useMemo(() => {
    if (!dashboardData?.subKpis || !dashboardData?.unfiltSubKpis) return [];
    const kpiData = [
        { id: 'campiUniversidadePublica', l: 'Univ. Públicas', c: darkMode ? 'text-blue-400' : 'text-gov-blue', b: 'bg-gov-blue' },
        { id: 'campiUniversidadePrivada', l: 'Univ. Privadas', c: darkMode ? 'text-cyan-400' : 'text-gov-cyan', b: 'bg-gov-cyan' },
        { id: 'ifs', l: 'Inst. Federais', c: darkMode ? 'text-green-400' : 'text-gov-green', b: 'bg-gov-green' },
        { id: 'icts', l: 'ICTs', c: darkMode ? 'text-purple-400' : 'text-gov-purple', b: 'bg-gov-purple' },
        { id: 'centrosPesquisa', l: 'C. Pesquisa', c: darkMode ? 'text-orange-400' : 'text-gov-orange', b: 'bg-gov-orange' },
        { id: 'espacos', l: 'Espaços', c: darkMode ? 'text-pink-400' : 'text-gov-pink', b: 'bg-gov-pink' },
        { id: 'parques', l: 'Parques', c: darkMode ? 'text-yellow-400' : 'text-gov-yellow', b: 'bg-gov-yellow' },
        { id: 'incubadoras', l: 'Incubadoras', c: darkMode ? 'text-teal-400' : 'text-gov-teal', b: 'bg-gov-teal' }
    ];
    return kpiData.map(kpi => ({ ...kpi, v: dashboardData.subKpis[kpi.id] || 0, pct: (dashboardData.unfiltSubKpis[kpi.id] || 0) > 0 ? ((dashboardData.subKpis[kpi.id] || 0) / dashboardData.unfiltSubKpis[kpi.id]) * 100 : 0 }));
  }, [dashboardData, darkMode]);

  return (
    <div className={`relative flex flex-col font-sans overflow-x-hidden min-h-screen w-full transition-colors duration-500 ${themeClasses.app}`}>
      {expandedLists.length > 0 && (
        <div className="fixed inset-0 z-[150] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-soft-fade" onClick={handleCloseModal}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <div 
              className={`h-[85vh] rounded-[2rem] border shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/95 border-gray-200'} ${
              expandedLists.length === 1 ? 'max-w-4xl' : expandedLists.length === 2 ? 'max-w-7xl' : 'w-[90vw] max-w-[1800px]'
            }`} 
            >
            {/* HEADER DO MODAL */}
            <div className={`p-3 border-b flex items-center justify-between shrink-0 gap-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-800'}`}>Listas Expandidas</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleCloseModal} className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Fechar"><Minimize size={18} /></button>
              </div>
            </div>

            {/* GRID DE CONTEÚDO DO MODAL */}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="grid h-full gap-4" style={{ gridTemplateColumns: `repeat(${expandedLists.length}, minmax(0, 1fr))` }}>
                {expandedLists.map(listType => {
                  let listData, renderItem, listTitle, filterControls, gridColsClass;

                  const renderCtiItem = (ent, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border flex flex-col gap-1 transition-all duration-300 ${themeClasses.cardHover} ${darkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'}`}>
                          <span className="text-[11px] font-bold leading-tight">{fixWeirdCapitalization(ent.entidade)}</span>
                          <div className="flex justify-between items-end mt-1">
                              <span className={`text-[8px] flex items-center font-black uppercase px-1.5 py-0.5 rounded border ${getCtiBadgeStyle(ent.categoria, darkMode)}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80"></span>
                                  {ent.tipo || "Instituição"}
                              </span>
                              <div className="text-right"><span className={`block text-[9px] font-medium ${themeClasses.textMuted}`}>{ent.municipio}</span></div>
                          </div>
                      </div>
                  );

                  const renderCadeiaItem = (apl, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border flex flex-col transition-all duration-300 ${themeClasses.cardHover} ${darkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'}`}>
                          <div className="flex items-start justify-between mb-2">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${darkMode ? 'bg-gov-green/10 text-green-400 border-gov-green/20' : 'bg-gov-green/10 text-gov-green-dark border-gov-green/20'}`}>{apl.segmento}</span>
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${getBadgeStyle(apl.tipo)}`}>{apl.tipo}</span>
                          </div>
                          {apl.entidade && <div className="mb-2"><span className="block text-[7px] font-black uppercase tracking-widest opacity-50 mb-0.5 text-gov-blue dark:text-blue-400">Entidade Vinculada</span><span className={`block text-[11px] font-bold leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{fixWeirdCapitalization(apl.entidade)}</span></div>}
                          <div className={`p-2.5 rounded-lg border mt-auto ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                              <div className="grid grid-cols-2 gap-3 mb-2">
                                  <div><span className="block text-[8px] font-black uppercase opacity-50 mb-0.5">Sede:</span><p className={`text-[10px] font-bold leading-relaxed opacity-90 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{apl.sede}</p></div>
                                  <div><span className="block text-[8px] font-black uppercase opacity-50 mb-0.5">Território(s):</span><p className={`text-[10px] font-bold leading-relaxed opacity-90 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{apl.territorios ? apl.territorios.join(', ') : 'N/A'}</p></div>
                              </div>
                              <div className={`pt-2 border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}><span className="block text-[8px] font-black uppercase opacity-50 mb-0.5">Municípios Pertencentes:</span><p className={`text-[9px] font-medium leading-relaxed opacity-80 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{apl.municipiosPertencentes}</p></div>
                          </div>
                      </div>
                  );

                  const renderCursoItem = (curso, idx) => {
                      const areaStyles = getAreaStyles(curso.areaGeral, darkMode);
                      return (
                          <div key={curso.id || idx} className={`p-3 rounded-xl border flex flex-col gap-2 transition-all duration-300 ${themeClasses.cardHover} ${areaStyles.text} ${darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'}`}>
                              <div className="flex flex-col items-start gap-1">
                                  <h5 className={`text-[11px] font-bold leading-snug line-clamp-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`} title={fixWeirdCapitalization(curso.curso)}>{fixWeirdCapitalization(curso.curso)}</h5>
                                  {curso.areaGeral && <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider inline-block text-left ${getAreaStyles(curso.areaGeral, darkMode).activeBg} ${getAreaStyles(curso.areaGeral, darkMode).text}`}>{curso.areaGeral}</span>}
                              </div>
                              <div className={`p-2 rounded-lg border mt-auto ${darkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200/50'}`}>
                                  <span className={`block text-[9px] font-bold mb-1 leading-tight truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} title={fixWeirdCapitalization(curso.entidade)}>{fixWeirdCapitalization(curso.entidade)}</span>
                                  {(curso.categoriaAdm || curso.orgAcademica) && <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[7px] font-medium uppercase tracking-wider opacity-80">{[curso.categoriaAdm, curso.orgAcademica].filter(Boolean).map((tag, i, arr) => (<React.Fragment key={i}><span>{tag}</span>{i < arr.length - 1 && <span className="w-0.5 h-0.5 rounded-full bg-current opacity-40"></span>}</React.Fragment>))}</div>}
                                  <div className="flex justify-between items-end mt-2 pt-1 border-t border-gray-500/10 gap-1.5">
                                      <span className={`text-[8px] font-semibold flex items-center gap-1 min-w-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={`${curso.municipio} • ${curso.territorioRef}`}><svg className="w-2.5 h-2.5 opacity-60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 016 0z" /></svg><span className="truncate">{curso.municipio}</span></span>
                                      <div className="flex items-center gap-1 shrink-0">{curso.nivel && <span className={`px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-200'}`}>{curso.nivel}</span>}{curso.modalidade && <span className={`px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-200'}`}>{curso.modalidade}</span>}</div>
                                  </div>
                              </div>
                          </div>
                      );
                  };

                  if (listType === 'cti') {
                      listData = dashboardData.entidades;
                      renderItem = renderCtiItem;
                      listTitle = 'Estruturas CT&I';
                      gridColsClass = 'grid-cols-1';
                      filterControls = (
                          <div className="relative" ref={modalCtiFilterRef}>
                              <button onClick={() => setIsModalCtiFilterOpen(!isModalCtiFilterOpen)} className={`h-7 px-2 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border shadow-sm ${isModalCtiFilterOpen || !areAllCtiSelected ? (darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200') : (darkMode ? 'bg-transparent border-gray-700 hover:bg-gray-700' : 'bg-transparent border-gray-200 hover:bg-gray-100')}`}><Filter size={12} /></button>
                              {isModalCtiFilterOpen && <div className={`absolute right-0 top-[100%] mt-2 w-60 max-w-[85vw] rounded-xl p-2 shadow-2xl border z-[150] flex flex-col gap-1 backdrop-blur-2xl ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}><div className="max-h-48 overflow-y-auto hide-scroll flex flex-col gap-1.5 pr-1"><label className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer border-b border-gray-500/10 pb-1.5 mb-1"><input type="checkbox" checked={areAllCtiSelected} onChange={handleToggleAllCti} className="rounded border-gray-300 text-gov-blue focus:ring-gov-blue h-3 w-3" /><span className={`font-bold ${areAllCtiSelected ? 'opacity-100' : 'opacity-50'}`}>Todos</span></label>{ctiFilterKeys.map((key) => (<label key={key} className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer pl-1"><input type="checkbox" checked={ctiFilters[key]} onChange={() => toggleCtiFilter(key)} className="rounded border-gray-300 text-gov-blue focus:ring-gov-blue h-3 w-3" /><span className={ctiFilters[key] ? 'opacity-100' : 'opacity-40'}>{{campiUniversidadePublica: 'Campi Universidade Pública', campiUniversidadePrivada: 'Campi Universidade Privada', ifs: 'Institutos Federais', icts: 'ICTs', centrosPesquisa: 'Centros de Pesquisa', espacos: 'Espaços Dinamizadores', parques: 'Parques Tecnológicos', incubadoras: 'Incubadoras'}[key]}</span></label>))}</div>{!areAllCtiSelected && <button onClick={handleToggleAllCti} className={`mt-1.5 w-full h-7 rounded-lg font-bold text-[8px] uppercase tracking-wider border transition-colors ${darkMode ? 'border-gov-red/30 text-red-400 hover:bg-gov-red/20' : 'border-gov-red/30 text-gov-red-dark hover:bg-gov-red/10'}`}>Limpar</button>}</div>}
                          </div>
                      );
                  } else if (listType === 'cadeias') {
                      listData = dashboardData.aplIgs;
                      renderItem = renderCadeiaItem;
                      listTitle = 'Cadeias Produtivas';
                      gridColsClass = 'grid-cols-1';
                      filterControls = (
                          <div className="relative" ref={modalCadeiaFilterRef}>
                              <button onClick={() => setIsModalCadeiaFilterOpen(!isModalCadeiaFilterOpen)} className={`h-7 px-2 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border shadow-sm ${isModalCadeiaFilterOpen || cadeiaProdutivaFilter.length > 0 ? (darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200') : (darkMode ? 'bg-transparent border-gray-700 hover:bg-gray-700' : 'bg-transparent border-gray-200 hover:bg-gray-100')}`}><Filter size={12} /></button>
                              {isModalCadeiaFilterOpen && <div className={`absolute right-0 top-[100%] mt-2 w-48 max-w-[85vw] rounded-xl p-2 shadow-2xl border z-[150] flex flex-col gap-1 backdrop-blur-2xl ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>{['APL', 'IG'].map(tipo => (<button key={tipo} onClick={() => handleCadeiaProdutivaToggle(tipo)} className={`w-full text-left px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-between gap-2 border ${cadeiaProdutivaFilter.includes(tipo) ? (darkMode ? 'bg-gov-green/20 border-gov-green/50 text-green-400' : 'bg-gov-green/10 border-gov-green/20 text-gov-green-dark') : (darkMode ? 'bg-transparent border-transparent hover:bg-gray-800' : 'bg-transparent border-transparent hover:bg-gray-50')}`}><span>{tipo}</span></button>))}{cadeiaProdutivaFilter.length > 0 && <button onClick={() => { setCadeiaProdutivaFilter([]); setIsModalCadeiaFilterOpen(false); }} className={`mt-1.5 w-full h-7 rounded-lg font-bold text-[8px] uppercase tracking-wider border transition-colors ${darkMode ? 'border-gov-red/30 text-red-400 hover:bg-gov-red/20' : 'border-gov-red/30 text-gov-red-dark hover:bg-gov-red/10'}`}>Limpar</button>}</div>}
                          </div>
                      );
                  } else if (listType === 'cursos') {
                      listData = cursosFiltrados;
                      renderItem = renderCursoItem;
                      listTitle = 'Cursos CT&I';
                      gridColsClass = 'grid-cols-1 md:grid-cols-2';
                      filterControls = (
                          <>
                              <div className="relative w-32 sm:w-40"><input type="text" placeholder="Buscar curso..." value={cursoSearchTerm} onChange={(e) => setCursoSearchTerm(e.target.value)} className={`w-full h-7 pl-7 pr-7 rounded-lg text-[9px] font-medium transition-all outline-none border shadow-sm ${darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-200 focus:border-gov-green' : 'bg-white border-gray-200 text-gray-800 focus:border-gov-green'}`} /><Search size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />{cursoSearchTerm && <button onClick={() => setCursoSearchTerm('')} aria-label="Limpar pesquisa" className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gov-red text-gray-400"><Eraser size={12} /></button>}</div>
                              {areaGeralSummary.length > 0 && <div className="relative" ref={modalAreaGeralRef}><button onClick={() => setIsModalAreaGeralOpen(!isModalAreaGeralOpen)} className={`h-7 px-2 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border shadow-sm ${isModalAreaGeralOpen || areaGeralFilter.length > 0 ? (darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200') : (darkMode ? 'bg-transparent border-gray-700 hover:bg-gray-700' : 'bg-transparent border-gray-200 hover:bg-gray-100')}`}><Filter size={12} /></button>{isModalAreaGeralOpen && <div className={`absolute right-0 top-[100%] mt-2 w-72 max-w-[85vw] rounded-xl p-2 shadow-2xl border z-[150] flex flex-col gap-1 backdrop-blur-2xl ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}><div className="max-h-48 overflow-y-auto hide-scroll flex flex-col gap-1 pr-1">{todasAsAreasGerais.map(areaName => { const areaData = areaGeralSummary.find(a => a.name === areaName); const count = areaData ? areaData.count : 0; const styles = getAreaStyles(areaName, darkMode); const isSelected = areaGeralFilter.includes(areaName); if (count === 0 && !isSelected) return null; return (<button key={areaName} onClick={() => handleAreaGeralToggle(areaName)} className={`w-full text-left px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-start sm:items-center justify-between gap-2 border ${isSelected ? styles.activeBg : (darkMode ? 'bg-transparent border-transparent hover:bg-gray-800' : 'bg-transparent border-transparent hover:bg-gray-50')}`}><div className="flex items-center gap-1.5 pr-1"><span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 sm:mt-0 ${styles.dot}`}></span><span className={`whitespace-normal leading-snug ${isSelected ? styles.text : (darkMode ? 'text-gray-300' : 'text-gray-600')}`}>{areaName}</span></div><span className={`px-1.5 py-0.5 rounded text-[8px] shrink-0 ${isSelected ? styles.countBg : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>{count}</span></button>);})}</div>{areaGeralFilter.length > 0 && <button onClick={() => { setAreaGeralFilter([]); setIsModalAreaGeralOpen(false); }} className={`mt-1.5 w-full h-7 rounded-lg font-bold text-[8px] uppercase tracking-wider border transition-colors ${darkMode ? 'border-gov-red/30 text-red-400 hover:bg-gov-red/20' : 'border-gov-red/30 text-gov-red-dark hover:bg-gov-red/10'}`}>Limpar</button>}</div>}</div>}
                          </>
                      );
                  } else {
                      return null;
                  }

                  return (
                    <div key={listType} className={`rounded-2xl border flex flex-col min-h-0 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
                      <div className={`p-3 border-b flex items-center justify-between shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-gray-800'}`}>{listTitle}</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{listData.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {filterControls}
                          <button onClick={() => setExpandedLists(p => p.filter(l => l !== listType))} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`} title={`Remover ${listTitle}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 hide-scroll">
                        <div className={`grid gap-2 ${gridColsClass}`}>
                          {listData.map(renderItem)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTÃO FLUTUANTE AO LADO */}
          {availableListsToAdd.length > 0 && (
            <div ref={modalAddListRef} className="absolute top-1/2 -translate-y-1/2 left-full ml-4">
              <button
                onClick={() => setIsModalAddListOpen(prev => !prev)}
                className={`w-[72px] h-[72px] rounded-3xl flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105 border ${
                  darkMode 
                  ? 'bg-gray-900/40 border-gray-700/30 text-gray-200 backdrop-blur-xl hover:bg-gray-800/60' 
                  : 'bg-white/50 border-gray-200/60 text-gray-700 backdrop-blur-xl hover:bg-white/70'
                }`}
                aria-label="Adicionar nova lista"
              >
                <Plus size={30} strokeWidth={3} />
              </button>

              {isModalAddListOpen && (
                <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 max-w-[85vw] rounded-xl p-2 shadow-2xl border z-20 flex flex-col gap-1 ${themeClasses.glass}`}>
                  {availableListsToAdd.map(type => {
                    const config = {
                      cti: { title: 'Estruturas CT&I', icon: <Database size={14} className="text-gov-blue" /> },
                      cadeias: { title: 'Cadeias Produtivas', icon: <BarChart3 size={14} className="text-gov-green" /> },
                      cursos: { title: 'Cursos CT&I', icon: <Target size={14} className="text-gov-cyan" /> }
                    }[type];
                    return (
                      <button key={type} onClick={() => { setExpandedLists(prev => [...prev, type]); setIsModalAddListOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>
                        {config.icon}
                        {config.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}
      <Helmet>
        <title>Painel Territorial CT&I | Governo da Bahia</title>
        <meta name="description" content="Plataforma interativa da SECTI com indicadores de Ciência, Tecnologia, Inovação e Cadeias Produtivas dos 27 Territórios de Identidade da Bahia." />
        <link rel="icon" type="image/png" sizes="any" href="/img/favicon-512.png?v=4" />
        <link rel="apple-touch-icon" href="/img/favicon-512.png?v=4" />
      </Helmet>

      <style>{`
          :root { color-scheme: ${darkMode ? 'dark' : 'light'}; }
          @keyframes softFade { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
          .animate-soft-fade { animation: softFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .hide-scroll::-webkit-scrollbar { height: 4px; width: 4px; }
          ::-webkit-scrollbar { width: 10px; height: 10px; } /* General scrollbar */
          ::-webkit-scrollbar-track { background: ${darkMode ? '#111827' : '#F3F4F6'}; } /* gray-900 or gray-100 */
          ::-webkit-scrollbar-thumb { background-color: ${darkMode ? '#4B5563' : '#D1D5DB'}; border-radius: 10px; border: 2px solid ${darkMode ? '#111827' : '#F3F4F6'}; } /* gray-600/gray-300 */
          ::-webkit-scrollbar-thumb:hover { background-color: ${darkMode ? '#6B7280' : '#9CA3AF'}; } /* gray-500/gray-400 */
          .hide-scroll { scrollbar-width: thin; scrollbar-color: ${darkMode ? '#4B5563 transparent' : '#D1D5DB transparent'}; }
          .hide-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
          .hide-scroll::-webkit-scrollbar-track { background: transparent; }
          .hide-scroll::-webkit-scrollbar-thumb { background-color: ${darkMode ? '#4B5563' : '#D1D5DB'}; border-radius: 10px; border: none; }
          .hide-scroll::-webkit-scrollbar-thumb:hover { background-color: ${darkMode ? '#6B7280' : '#9CA3AF'}; }
          @keyframes progress-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
          .animate-progress-slide { animation: progress-slide 1.5s infinite ease-in-out; }
      `}</style>

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full blur-[120px] opacity-[0.15] transition-colors duration-1000 bg-gov-blue`}></div>
        <div className={`absolute top-[40%] -right-[5%] w-[30vw] h-[30vw] rounded-full blur-[100px] opacity-[0.1] transition-colors duration-1000 bg-gov-red`}></div>
      </div>

      {/* OVERLAY DE SINCRONIZAÇÃO */}
      {isLoadingPipeline && territoriosData.length === 0 && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gray-100/60 dark:bg-gray-900/80 backdrop-blur-2xl transition-all duration-500">
            <div className="absolute w-72 h-72 bg-gov-blue/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className={`relative p-10 rounded-[2.5rem] flex flex-col items-center shadow-2xl border ${darkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white/60 border-white/80'}`}>
                <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-gray-200/40 dark:border-gray-700/50 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-gov-blue rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-3 border-4 border-gov-green rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    <div className="absolute w-2 h-2 bg-gov-blue rounded-full animate-ping"></div>
                </div>
                <h2 className={`text-sm font-black tracking-[0.3em] uppercase mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Sincronizando</h2>
                <div className="w-48 h-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-full mt-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-gov-blue to-gov-green rounded-full animate-progress-slide"></div>
                </div>
            </div>
          </div>
      )}

      {/* HEADER PRINCIPAL FIXO NO TOPO */}
      <header className={`sticky top-4 mx-auto w-[96%] max-w-[1600px] ${themeClasses.glass} h-16 rounded-2xl flex items-center justify-between px-6 z-[100] transition-all duration-500 ${navVisible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-8">
            <h1 className="text-[11px] sm:text-xs font-black tracking-widest uppercase flex items-center gap-1.5 drop-shadow-sm">
                <span className={darkMode ? 'text-blue-400' : 'text-gov-blue'}>Painel</span>
                <span className="text-gov-red">Territorial</span>
            </h1>
            <nav className="hidden sm:flex items-center gap-2">
                {[ {p: '/', l: 'Início'}, {p: '/sobre', l: 'Sobre'}, {p: '/territorios', l: 'Territórios'}  ].map((tab) => (
                  <Link key={tab.p} to={tab.p} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isActive(tab.p) ? 'bg-gov-blue text-white' : (darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')}`}>
                    {tab.l}
                  </Link>
                ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} aria-label="Alterar Tema" className={`p-2 rounded-xl transition-all border ${darkMode ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {darkMode ? <Sun size={16} strokeWidth={2.5} /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            <img src={darkMode ? "/img/Brasao-Horizontal_Branco.png" : "/img/Brasao-Horizontal_Preto.png"} alt="GOV BA" className="h-6 object-contain hidden lg:block opacity-90" />
          </div>
      </header>

      {/* NAVBAR LATERAL VERTICAL (Sempre visível em /territorios) */}
      <div className={`fixed right-4 top-1/2 -translate-y-1/2 z-[120] flex flex-col items-end gap-3 transition-all duration-500 ${location.pathname === '/territorios' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'}`}>
          <div className={`flex flex-col items-center gap-2 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl ${darkMode ? 'bg-gray-900/90 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
              <Link to="/" className={`p-2.5 rounded-xl transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-blue-400' : 'text-gray-500 hover:bg-gray-100 hover:text-gov-blue'}`} title="Início">
                  <Home size={18} strokeWidth={2.5} />
              </Link>
              <div className={`w-6 h-[1px] ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200'}`}></div>
              <Link to="/sobre" className={`p-2.5 rounded-xl transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-blue-400' : 'text-gray-500 hover:bg-gray-100 hover:text-gov-blue'}`} title="Sobre">
                  <Info size={18} strokeWidth={2.5} />
              </Link>
          </div>

          <div ref={sideFilterRef} className={`relative flex flex-col items-center gap-2 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl ${darkMode ? 'bg-gray-900/90 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
              <div className="relative flex items-center justify-end w-full" ref={searchDropdownRef}>
                  <div className={`absolute right-[115%] transition-all duration-300 ${isVerticalSearchOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
                      <input 
                          type="text" 
                          placeholder="Buscar no painel..."
                          value={searchTerm}
                          onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                          className={`w-full h-10 px-4 rounded-xl text-[11px] font-medium outline-none border shadow-2xl backdrop-blur-xl transition-all ${darkMode ? 'bg-gray-900/95 border-gray-700 text-white focus:border-gov-blue' : 'bg-white/95 border-gray-200 text-gray-800 focus:border-gov-blue'}`}
                      />
                      {isDropdownOpen && searchTerm && isVerticalSearchOpen && (
                          <div className={`absolute left-0 top-full mt-2 w-full max-h-64 overflow-y-auto hide-scroll rounded-xl border shadow-2xl z-[200] backdrop-blur-2xl ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
                              {filteredOptions.length > 0 ? (
                                  <div className="flex flex-col p-1.5 gap-0.5">
                                      {filteredOptions.map((opt, i) => (
                                          <button key={i} onClick={() => { setSearchTerm(opt.matchText); setIsDropdownOpen(false); if (opt.matchType === 'Território') setSelectedLocation(opt); else setSelectedLocation(null); }} className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-colors flex flex-col ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>
                                              <span className="font-bold truncate">{opt.matchText}</span>
                                              <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${darkMode ? 'text-blue-400' : 'text-gov-blue'}`}> {opt.matchType} <span className="opacity-50 text-gray-500 ml-1">em {opt.nome}</span> </span>
                                          </button>
                                      ))}
                                  </div>
                              ) : ( <div className={`p-4 text-center text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhum resultado encontrado.</div> )}
                          </div>
                      )}
                  </div>
                  <button onClick={() => setIsVerticalSearchOpen(!isVerticalSearchOpen)} className={`p-2.5 rounded-xl transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-blue-400' : 'text-gray-500 hover:bg-gray-100 hover:text-gov-blue'} ${isVerticalSearchOpen ? (darkMode ? 'bg-gov-blue/20 text-blue-400' : 'bg-gov-blue/10 text-gov-blue') : ''}`} title="Pesquisar">
                      <Search size={18} strokeWidth={2.5} />
                  </button>
              </div>

              <div className={`w-6 h-[1px] ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200'}`}></div>

              <button onClick={resetGlobalFilters} className={`p-2.5 rounded-xl transition-colors ${hasActiveFilters ? (darkMode ? 'text-gov-red bg-gov-red/10 hover:bg-gov-red/20' : 'text-gov-red bg-gov-red/10 hover:bg-gov-red/20') : (darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800')}`} title="Limpar todos os filtros">
                  <Eraser size={18} strokeWidth={2.5} />
              </button>

              <div className={`w-6 h-[1px] ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200'}`}></div>

              <button onClick={() => carregarDadosDoSharePoint(true)} disabled={isLoadingPipeline} className={`p-2.5 rounded-xl transition-colors ${isLoadingPipeline ? 'opacity-50 cursor-not-allowed animate-pulse' : ''} ${darkMode ? 'text-gray-400 hover:bg-gov-green/20 hover:text-green-400' : 'text-gray-500 hover:bg-gov-green/10 hover:text-gov-green-dark'}`} title="Sincronizar Dados">
                  <RefreshCw size={18} strokeWidth={2.5} className={isLoadingPipeline ? "animate-spin" : ""} />
              </button>

              <div className={`w-6 h-[1px] ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200'}`}></div>

              <button onClick={() => setIsSideFilterOpen(!isSideFilterOpen)} className={`py-4 px-2.5 rounded-xl flex flex-col items-center gap-3 transition-all ${isSideFilterOpen ? 'bg-gov-blue text-white shadow-md' : (darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-blue-400' : 'text-gray-500 hover:bg-gray-100 hover:text-gov-blue')}`} title="Filtros Avançados">
                  <Filter size={18} strokeWidth={2.5} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Filtros</span>
              </button>

              {isSideFilterOpen && (
                  <div className={`absolute right-[125%] bottom-0 w-72 rounded-[2rem] p-5 shadow-2xl border flex flex-col gap-4 backdrop-blur-2xl animate-soft-fade ${darkMode ? 'bg-gray-900/95 border-gray-700 text-gray-200' : 'bg-white/95 border-gray-200 text-gray-800'}`}>
                      <div>
                          <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Recorte Geográfico</span>
                          <button onClick={() => { setFiltroSemiarido(!filtroSemiarido); setSelectedLocation(null); setSearchTerm(''); }} className={`w-full h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${filtroSemiarido ? 'bg-gov-yellow border-yellow-600 text-white hover:bg-yellow-600' : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}`}>\
                              {filtroSemiarido ? 'Semiárido: Ativo' : 'Ativar Semiárido'}
                          </button>
                      </div>
                      <div>
                          <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">Intervalo D. Territ. (IFDM)</span>
                          <div className="flex gap-2 items-center">
                              <input type="number" step="0.001" placeholder="Mín" value={ifdmMin} onChange={(e) => setIfdmMin(e.target.value)} className={`w-full h-8 px-2 rounded-lg text-[11px] outline-none border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                              <span className="text-[10px] opacity-40">até</span>
                              <input type="number" step="0.001" placeholder="Máx" value={ifdmMax} onChange={(e) => setIfdmMax(e.target.value)} className={`w-full h-8 px-2 rounded-lg text-[11px] outline-none border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                          </div>
                      </div>
                      <div>
                          <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">Muns. no Semiárido (Qtd)</span>
                          <div className="flex gap-2 items-center">
                              <input type="number" placeholder="Mín" value={semiMunsMin} onChange={(e) => setSemiMunsMin(e.target.value)} className={`w-full h-8 px-2 rounded-lg text-[11px] outline-none border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                              <span className="text-[10px] opacity-40">até</span>
                              <input type="number" placeholder="Máx" value={semiMunsMax} onChange={(e) => setSemiMunsMax(e.target.value)} className={`w-full h-8 px-2 rounded-lg text-[11px] outline-none border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                          </div>
                      </div>
                      <div>
                          <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">Filtrar Ativos de CTI</span>
                          <div className="max-h-32 overflow-y-auto hide-scroll flex flex-col gap-1.5 border p-2 rounded-xl border-gray-500/20">
                              <label className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer border-b border-gray-500/10 pb-1.5 mb-1">
                                  <input type="checkbox" checked={areAllCtiSelected} onChange={handleToggleAllCti} className="rounded border-gray-300 text-gov-blue focus:ring-gov-blue h-3 w-3" /> 
                                  <span className={`font-bold ${areAllCtiSelected ? 'opacity-100' : 'opacity-50'}`}>Todos</span>
                              </label>
                              {[
                                  { id: 'campiUniversidadePublica', label: 'Campi Universidade Pública' }, { id: 'campiUniversidadePrivada', label: 'Campi Universidade Privada' }, { id: 'ifs', label: 'Institutos Federais' },
                                  { id: 'icts', label: 'ICTs' }, { id: 'centrosPesquisa', label: 'Centros de Pesquisa' },
                                  { id: 'espacos', label: 'Espaços Dinamizadores' }, { id: 'parques', label: 'Parques Tecnológicos' },
                                  { id: 'incubadoras', label: 'Incubadoras' }
                              ].map((f) => (
                                  <label key={f.id} className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer pl-1">
                                      <input type="checkbox" checked={ctiFilters[f.id]} onChange={() => toggleCtiFilter(f.id)} className="rounded border-gray-300 text-gov-blue focus:ring-gov-blue h-3 w-3" />
                                      <span className={ctiFilters[f.id] ? 'opacity-100' : 'opacity-40'}>{f.label}</span>
                                  </label>
                              ))}
                          </div>
                      </div>
                      <div>
                          <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">Filtrar Cadeias Produtivas</span>
                          <div className="flex flex-col gap-1.5">
                              {['APL', 'IG'].map(tipo => {
                                  const isSelected = cadeiaProdutivaFilter.includes(tipo);
                                  return (
                                      <button key={tipo} onClick={() => handleCadeiaProdutivaToggle(tipo)} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-between gap-2 border ${isSelected ? (darkMode ? 'bg-gov-green/20 border-gov-green/50 text-green-400' : 'bg-gov-green/10 border-gov-green/20 text-gov-green-dark') : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}`}>
                                          <span>{tipo}</span>
                                      </button>
                                  )
                              })}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      <main className={`flex-1 overflow-y-auto relative w-full z-10 ${location.pathname === '/' ? '' : 'pt-4'}`}>
        <Routes>
          <Route path="/" element={<div className="animate-soft-fade h-full"><LandingHero onAccessDashboard={() => navigate('/territorios')} territoriosData={territoriosData} darkMode={darkMode} /></div>} />
          <Route path="/sobre" element={<SobrePage darkMode={darkMode} />} />
          
          <Route path="/territorios" element={
            <div className="animate-soft-fade relative p-2 lg:p-0 w-[96%] max-w-[1600px] mx-auto min-h-full">
                <div className={`${themeClasses.glass} rounded-[2rem] p-4 lg:p-6 flex flex-col gap-4 mt-6`}>
                
                {/* KPIs GLOBAIS */}
                <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.textMuted}`}>Cenário Global {selectedLocation ? `— ${selectedLocation.nome}` : (filtroSemiarido ? '— Semiárido Baiano' : '— Estado da Bahia')}</h3>
                        <span className={`text-[9px] font-medium hidden sm:block ${themeClasses.textMuted}`}>Status: {lastUpdate}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            { l: 'Estrutura CT&I', v: dashboardData.topKpis.capacidadeCti, pct: dashboardData.topKpisPct.cti, c: darkMode ? 'text-blue-400' : 'text-gov-blue', b: 'bg-gov-blue', sourceText: 'INEP / Censo da Educação Superior (2022)', sourceLink: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior', listType: 'cti' },
                            { l: 'D. Territ. (IFDM)', v: dashboardData.topKpis.ifdm, pct: dashboardData.topKpisPct.ifdm, c: darkMode ? 'text-red-400' : 'text-gov-red', b: 'bg-gov-red', sourceText: 'FIRJAN / IFDM (2021)', sourceLink: 'https://www.firjan.com.br/ifdm/' },
                            { l: 'Semiárido', v: dashboardData.topKpis.coberturaSemiarido, pct: dashboardData.topKpisPct.semiarido, c: darkMode ? 'text-yellow-300' : 'text-gov-yellow-dark', b: 'bg-gov-yellow', tr: true, sourceText: 'IBGE / Semiárido Brasileiro (2022)', sourceLink: 'https://www.ibge.gov.br/geociencias/cartas-e-mapas/mapas-regionais/15974-semiarido-brasileiro.html?=&t=o-que-e' },
                            { l: 'Cursos Superiores', v: dashboardData.topKpis.cursos, pct: dashboardData.topKpisPct.cursos, c: darkMode ? 'text-cyan-400' : 'text-gov-cyan', b: 'bg-gov-cyan', tr: true, sourceText: 'INEP / Censo da Educação Superior (2022)', sourceLink: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior', listType: 'cursos' },
                            { l: 'Cadeias Produtivas', v: dashboardData.topKpis.cadeiasIgs, pct: dashboardData.topKpisPct.cadeias, c: darkMode ? 'text-green-400' : 'text-gov-green', b: 'bg-gov-green', tr: true, sourceText: 'DataSebrae / Indicações Geográficas', sourceLink: 'https://datasebrae.com.br/indicacoesgeograficas/', listType: 'cadeias' },
                        ].map((k, idx) => (
                            <div
                                key={idx} 
                                className={`relative p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:z-30 ${themeClasses.cardHover} ${darkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-200/60'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 opacity-60 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{k.l}</p>
                                    {k.sourceText && (
                                        <div className="relative group flex items-center justify-center">
                                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none">
                                                <Info size={12} />
                                            </button>
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                                <div className={`p-2 rounded-lg text-[10px] leading-snug shadow-lg border ${darkMode ? 'bg-gray-900 text-gray-200 border-gray-700' : 'bg-white text-gray-700 border-gray-200'}`}>
                                                    <span className="block font-bold mb-1 opacity-70">Fonte:</span>
                                                    {k.sourceLink ? (
                                                        <a href={k.sourceLink} target="_blank" rel="noreferrer" className="block opacity-80 hover:opacity-100 transition-opacity">{k.sourceText}</a>
                                                    ) : (
                                                        <span className="block opacity-80">{k.sourceText}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className={`text-2xl lg:text-3xl font-black leading-none tracking-tight pb-1.5 ${k.c} ${k.tr ? 'truncate text-xl lg:text-2xl' : ''}`}>{k.v}</p>
                                <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-b-xl">
                                    <div className={`h-full ${k.b} transition-all duration-700 ease-out`} style={{ width: `${Math.min(100, Math.max(0, k.pct))}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* A "Ilha" Encaixada na tela */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch h-[calc(100vh-180px)] min-h-[500px] w-full mt-4 mb-3">
                    
                    {/* PAINEL VERTICAL DE KPIS (coluna da esquerda) */}
                    {!selectedLocation && subKpisList.length > 0 && (
                        <div className={`w-full lg:w-44 flex-shrink-0 h-full overflow-y-auto hide-scroll p-3 rounded-[1.5rem] border backdrop-blur-xl shadow-2xl transition-all animate-soft-fade ${darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-white/60'}`}>
                            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 border-b pb-2 leading-tight ${darkMode ? 'text-gray-300 border-gray-700/50' : 'text-gray-500 border-gray-200/60'}`}>
                                Ativos de CT&I
                            </h4>
                            <div className="flex flex-col gap-2">
                                {subKpisList.map(kpi => (
                                    <div 
                                        key={kpi.id} 
                                        onClick={() => handleCtiKpiClick(kpi.id)}
                                        className={`relative p-2 pr-4 rounded-lg border flex items-center justify-between text-left overflow-hidden transition-all duration-300 cursor-pointer ${ctiFilters[kpi.id] ?? true ? 'opacity-100' : 'opacity-40 grayscale'} ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white/80 border-slate-200/50'}`}
                                    >
                                        <div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{kpi.l}</span>
                                            <span className={`block text-lg font-black leading-none pt-1 drop-shadow-sm ${kpi.c}`}>{kpi.v || 0}</span>
                                        </div>
                                        <div className="absolute top-0 right-0 h-full w-1 bg-slate-200/50 dark:bg-slate-700/50">
                                            <div className={`absolute bottom-0 w-full ${kpi.b} transition-all duration-700 ease-out`} style={{ height: `${Math.min(100, Math.max(0, kpi.pct))}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    
                    {/* COLUNA DO MAPA (40%) */}
                    <div ref={mapSectionRef} className="w-full lg:w-[40%] flex-shrink-0 flex flex-col relative">
                        <div className={`rounded-[2rem] border p-1 shadow-inner relative flex flex-col flex-1 min-h-0 overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-700/50' : 'bg-gray-50 border-gray-200/80'}`}>
                            <div className={`absolute top-5 left-5 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest z-10 flex items-center gap-2.5 border shadow-lg ${darkMode ? 'bg-gray-800/80 text-white border-gray-600' : 'bg-white/90 text-gray-800 border-gray-200'}`}>
                                <span className="w-2 h-2 rounded-full bg-gov-green animate-pulse"></span>
                                <span>Motor Cartográfico</span>
                                <div className="relative group flex items-center justify-center">
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4M12 8h.01"></path></svg>
                                    </button>
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                        <div className={`w-max p-2 rounded-lg text-[10px] leading-snug shadow-lg border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                                            <span className="block font-bold mb-1 opacity-70">Fontes dos Dados:</span>
                                            <a href="https://www.ibge.gov.br/geociencias/cartas-e-mapas/mapas-regionais/15974-semiarido-brasileiro.html?=&t=o-que-e" target="_blank" rel="noreferrer" className="block whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">IBGE/Semiárido Brasileiro (2022)</a>
                                            <a href="https://www.ba.gov.br/cultura/314/divisao-territorial-da-bahia" target="_blank" rel="noreferrer" className="block whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity mt-1">SECULT/Divisão Territorial da Bahia (2024)</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-full flex-1 rounded-xl overflow-hidden">
                                <ConectaMap 
                                    territoriosData={territoriosData} territoriesDynamicStats={territoriesDynamicStats} 
                                    searchTerm={searchTerm} filtroSemiarido={filtroSemiarido} 
                                    selectedTerritory={selectedLocation} semiaridoMunicipios={semiaridoMunicipios}
                                    onSelectTerritory={handleSelectTerritory} 
                                    darkMode={darkMode} 
                                    dashboardData={dashboardData}
                                    ctiFilters={ctiFilters}
                                />
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DAS LISTAS (60%) */}
                    <div className="flex-1 flex flex-col gap-4 h-full overflow-hidden min-w-0">
                        <div className="flex flex-col sm:flex-row gap-4 flex-[0.8] min-h-0">
                            
                            {/* LISTA 1: ESTRUTURAS CT&I */}
                            <div className={`w-full sm:w-1/2 min-h-0 rounded-[2rem] border shadow-sm flex flex-col overflow-hidden transition-all ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200/80'}`}>
                                <div className={`p-4 border-b flex items-center justify-between shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                                    <div className="flex items-center gap-1.5">
                                        <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Estruturas CT&I</h4>
                                        <div className="relative group flex items-center justify-center z-50">
                                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4M12 8h.01"></path></svg>
                                            </button>
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                                <div className={`w-max p-2 rounded-lg text-[10px] leading-snug shadow-lg border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                                                    <span className="block font-bold mb-1 opacity-70">Fonte dos Dados:</span>
                                                    <a href="https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior" target="_blank" rel="noreferrer" className="block whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">
                                                        INEP / Censo da Educação Superior (2022)
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${darkMode ? 'bg-gov-blue/20 text-blue-400' : 'bg-gov-blue/10 text-gov-blue-dark'}`}>
                                            {dashboardData.entidades.length}
                                        </span>
                                    {dashboardData.entidades.length > 0 && !expandedLists.length && (
                                        <button onClick={() => setExpandedLists(['cti'])} className={`p-1 rounded-md transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`} title="Expandir lista">
                                                <Expand size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 hide-scroll">
                                    <div className="flex flex-col gap-2">
                                    {dashboardData.entidades.length > 0 ? (
                                        dashboardData.entidades.map((ent, idx) => (
                                        <div key={idx} className={`p-3 rounded-xl border flex flex-col gap-1 transition-all duration-300 ${themeClasses.cardHover} ${darkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'}`}>
                                            <span className="text-[11px] font-bold leading-tight">{fixWeirdCapitalization(ent.entidade)}</span>
                                            <div className="flex justify-between items-end mt-1">
                                                <span className={`text-[8px] flex items-center font-black uppercase px-1.5 py-0.5 rounded border ${getCtiBadgeStyle(ent.categoria, darkMode)}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80"></span>
                                                    {ent.tipo || "Instituição"}
                                                </span>
                                                <div className="text-right"><span className={`block text-[9px] font-medium ${themeClasses.textMuted}`}>{ent.municipio}</span></div>
                                            </div>
                                        </div>
                                    ))) : (<div className={`flex items-center justify-center h-full text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhuma infraestrutura mapeada para os filtros ativos.</div>)}
                                    </div>
                                </div>
                            </div>

                            {/* LISTA 2: CADEIAS PRODUTIVAS */}
                            <div className={`w-full sm:w-1/2 min-h-0 rounded-[2rem] border shadow-sm flex flex-col overflow-hidden transition-all ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200/80'}`}>
                                <div className={`p-4 border-b flex items-center justify-between shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                                    <div className="flex items-center gap-1.5">
                                        <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Cadeias Produtivas</h4>
                                        <div className="relative group flex items-center justify-center z-50">
                                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4M12 8h.01"></path></svg>
                                            </button>
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                                <div className={`w-max p-2 rounded-lg text-[10px] leading-snug shadow-lg border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                                                    <span className="block font-bold mb-1 opacity-70">Fonte dos Dados:</span>
                                                    <a href="https://datasebrae.com.br/indicacoesgeograficas/" target="_blank" rel="noreferrer" className="block whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">
                                                        DataSebrae / Indicações Geográficas
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${darkMode ? 'bg-gov-green/20 text-green-400' : 'bg-gov-green/10 text-gov-green-dark'}`}>{dashboardData.aplIgs.length}</span>
                                        {dashboardData.aplIgs.length > 0 && !expandedLists.length && (
                                            <button onClick={() => setExpandedLists(['cadeias'])} className={`p-1 rounded-md transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`} title="Expandir lista">
                                                <Expand size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 hide-scroll">
                                    <div className="flex flex-col gap-2">
                                    {dashboardData.aplIgs.length > 0 ? dashboardData.aplIgs.map((apl, idx) => (
                                        <div key={idx} className={`p-3 rounded-xl border flex flex-col transition-all duration-300 ${themeClasses.cardHover} ${darkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'}`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${darkMode ? 'bg-gov-green/10 text-green-400 border-gov-green/20' : 'bg-gov-green/10 text-gov-green-dark border-gov-green/20'}`}>
                                                    {apl.segmento}
                                                </span>
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${getBadgeStyle(apl.tipo)}`}>
                                                    {apl.tipo}
                                                </span>
                                            </div>
                                            
                                            {apl.entidade && (
                                                <div className="mb-2">
                                                    <span className="block text-[7px] font-black uppercase tracking-widest opacity-50 mb-0.5 text-gov-blue dark:text-blue-400">Entidade Vinculada</span>
                                                    <span className={`block text-[11px] font-bold leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                        {fixWeirdCapitalization(apl.entidade)}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className={`p-2.5 rounded-lg border mt-auto ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                                <div className="grid grid-cols-2 gap-3 mb-2">
                                                    <div>
                                                        <span className="block text-[8px] font-black uppercase opacity-50 mb-0.5">Sede:</span>
                                                        <p className={`text-[10px] font-bold leading-relaxed opacity-90 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{apl.sede}</p>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[8px] font-black uppercase opacity-50 mb-0.5">Território(s):</span>
                                                        <p className={`text-[10px] font-bold leading-relaxed opacity-90 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{apl.territorios ? apl.territorios.join(', ') : 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className={`pt-2 border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                                                    <span className="block text-[8px] font-black uppercase opacity-50 mb-0.5">Municípios Pertencentes:</span>
                                                    <p className={`text-[9px] font-medium leading-relaxed opacity-80 line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} title={apl.municipiosPertencentes}>{apl.municipiosPertencentes}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (<div className={`flex items-center justify-center h-full text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhuma cadeia isolada para os filtros ativos.</div>)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* LISTA 3: CURSOS SUPERIORES */}
                        <div className={`flex-[0.6] min-h-0 relative rounded-[2rem] border shadow-sm flex flex-col overflow-hidden transition-all ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200/80'}`}>
                            <div className={`p-4 border-b flex items-center justify-between shrink-0 gap-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                                <div className="flex items-center gap-2">
                                    <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Cursos CT&I</h4>
                                    <div className="relative group flex items-center justify-center z-50">
                                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4M12 8h.01"></path></svg>
                                        </button>
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                            <div className={`w-max p-2 rounded-lg text-[10px] leading-snug shadow-lg border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                                                <span className="block font-bold mb-1 opacity-70">Fonte dos Dados:</span>
                                                <a href="https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior" target="_blank" rel="noreferrer" className="block whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">
                                                    INEP/ Censo de Educação Superior (2022)
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black hidden lg:inline-block ${darkMode ? 'bg-gov-cyan/20 text-cyan-400' : 'bg-gov-cyan/10 text-gov-cyan-dark'}`}>{cursosFiltrados.length}</span>
                                        {cursosFiltrados.length > 0 && !expandedLists.length && (
                                            <button onClick={() => setExpandedLists(['cursos'])} className={`p-1 rounded-md transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`} title="Expandir lista">
                                                <Expand size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                <div className="relative w-32 sm:w-40 lg:w-48">
                                    <input 
                                        type="text" 
                                        placeholder="Buscar curso..." 
                                        value={cursoSearchTerm} 
                                        onChange={(e) => setCursoSearchTerm(e.target.value)} 
                                        className={`w-full h-8 pl-7 pr-7 rounded-lg text-[9px] font-medium transition-all outline-none border shadow-sm ${darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-200 focus:border-gov-green' : 'bg-white border-gray-200 text-gray-800 focus:border-gov-green'}`}
                                    />
                                    <svg className={`w-3 h-3 absolute left-2 top-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    {cursoSearchTerm && (
                                        <button onClick={() => setCursoSearchTerm('')} aria-label="Limpar pesquisa" className="absolute right-2 top-2.5 hover:text-gov-red text-gray-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                </div>

                                {/* DROPDOWN DE FILTRO DE ÁREA GERAL */}
                                {areaGeralSummary.length > 0 && (
                                    <div className="relative" ref={areaGeralRef}>
                                        <button
                                            onClick={() => setIsAreaGeralOpen(!isAreaGeralOpen)}
                                            className={`h-8 px-3 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border shadow-sm ${isAreaGeralOpen || areaGeralFilter.length > 0 ? (darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700') : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}`}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                            <span className="whitespace-nowrap hidden sm:inline">{getAreaFilterButtonText()}</span>
                                        </button>

                                        {isAreaGeralOpen && (
                                            <div className={`absolute right-0 top-[100%] mt-2 w-64 sm:w-72 max-w-[85vw] rounded-xl p-2 shadow-2xl border z-[150] flex flex-col gap-1 backdrop-blur-2xl ${darkMode ? 'bg-gray-900/95 border-gray-700 text-gray-200' : 'bg-white/95 border-gray-200 text-gray-800'}`}>
                                                <span className="block text-[8px] font-black uppercase tracking-widest opacity-60 mb-1 px-1">Áreas Gerais</span>
                                                <div className="max-h-48 overflow-y-auto hide-scroll flex flex-col gap-1 pr-1">
                                                    {areaGeralSummary.map(area => { 
                                                        const styles = getAreaStyles(area.name, darkMode);
                                                        const isSelected = areaGeralFilter.includes(area.name);
                                                        return (
                                                            <button
                                                                key={area.name}
                                                                onClick={() => handleAreaGeralToggle(area.name)}
                                                                className={`w-full text-left px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-start sm:items-center justify-between gap-2 border ${isSelected ? styles.activeBg : (darkMode ? 'bg-transparent border-transparent hover:bg-gray-800' : 'bg-transparent border-transparent hover:bg-gray-50')}`}
                                                            >
                                                                <div className="flex items-center gap-1.5 pr-1">
                                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 sm:mt-0 ${styles.dot}`}></span>
                                                                    <span className={`whitespace-normal leading-snug ${isSelected ? styles.text : (darkMode ? 'text-gray-300' : 'text-gray-600')}`}>{area.name}</span>
                                                                </div>
                                                                <span className={`px-1.5 py-0.5 rounded text-[8px] shrink-0 ${isSelected ? styles.countBg : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>{area.count}</span> 
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {areaGeralFilter.length > 0 && (
                                                    <button onClick={() => { setAreaGeralFilter([]); setIsAreaGeralOpen(false); }} className={`mt-1.5 w-full h-7 rounded-lg font-bold text-[8px] uppercase tracking-wider border transition-colors ${darkMode ? 'border-gov-red/30 text-red-400 hover:bg-gov-red/20' : 'border-gov-red/30 text-gov-red-dark hover:bg-gov-red/10'}`}>Limpar Filtros</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                </div>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto hide-scroll">
                                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2.5">
                                    {cursosFiltrados.length > 0 ? cursosFiltrados.map((curso, idx) => {
                                        const areaStyles = getAreaStyles(curso.areaGeral, darkMode);
                                        const hoverClasses = darkMode ? 'hover:border-current' : 'hover:border-current';
                                        return (
                                        <div key={curso.id || idx} className={`p-3 rounded-xl border flex flex-col gap-2 transition-all duration-300 hover:-translate-y-0.5 ${areaStyles.text} hover:border-current ${darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'}`}>
                                            <div className="flex flex-col items-start gap-1">
                                                <h5 className={`text-[11px] font-bold leading-snug line-clamp-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`} title={fixWeirdCapitalization(curso.curso)}>{fixWeirdCapitalization(curso.curso)}</h5>
                                                {curso.areaGeral && (
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider inline-block text-left ${getAreaStyles(curso.areaGeral, darkMode).activeBg} ${getAreaStyles(curso.areaGeral, darkMode).text}`}>
                                                        {curso.areaGeral}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`p-2 rounded-lg border mt-auto ${darkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200/50'}`}>
                                                <span className={`block text-[9px] font-bold mb-1 leading-tight truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} title={fixWeirdCapitalization(curso.entidade)}>{fixWeirdCapitalization(curso.entidade)}</span>
                                                {(curso.categoriaAdm || curso.orgAcademica) && (
                                                    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[7px] font-medium uppercase tracking-wider opacity-80">
                                                        {[curso.categoriaAdm, curso.orgAcademica].filter(Boolean).map((tag, i, arr) => (
                                                            <React.Fragment key={i}>
                                                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{tag}</span>
                                                                {i < arr.length - 1 && <span className="w-0.5 h-0.5 rounded-full bg-current opacity-40"></span>}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-end mt-2 pt-1 border-t border-gray-500/10 gap-1.5">
                                                    <span className={`text-[8px] font-semibold flex items-center gap-1 min-w-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={`${curso.municipio} • ${curso.territorioRef}`}>
                                                        <svg className="w-2.5 h-2.5 opacity-60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 016 0z" /></svg>
                                                        <span className="truncate">{curso.municipio}</span>
                                                    </span>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {curso.nivel && <span className={`px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-200'}`}>{curso.nivel}</span>}
                                                        {curso.modalidade && <span className={`px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-200'}`}>{curso.modalidade}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                    }) : (<div className={`col-span-full flex items-center justify-center py-6 text-[10px] font-medium italic ${themeClasses.textMuted}`}>{areaGeralFilter.length > 0 || cursoSearchTerm ? `Nenhum curso encontrado para a pesquisa e/ou filtros aplicados.` : 'Nenhum curso superior mapeado ou isolado.'}</div>)}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                </div>
            </div>
          } />

        </Routes>
      </main>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <HelmetProvider>
      <Router>
        <MainApp />
      </Router>
    </HelmetProvider>
  );
}