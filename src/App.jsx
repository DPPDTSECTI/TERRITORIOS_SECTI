import { Helmet, HelmetProvider } from 'react-helmet-async';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import ConectaMap from "../ConectaMap"; 
import LandingHero from './components/hero';
import { Target, BarChart3, Database, Settings, Map as MapIcon, Code, Info, Download, Sun } from 'lucide-react';
import useTerritoriosData from '../useTerritoriosData.js';
import territoriosMunicipios from '../utils/territorioMunicipios.json'; 
import SobrePage from './components/SobrePage';

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================
function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ==========================================
// HOOKS CUSTOMIZADOS
// ==========================================
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}


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
  const [isAreaGeralOpen, setIsAreaGeralOpen] = useState(false);
  const [cursoSearchTerm, setCursoSearchTerm] = useState('');
  const debouncedCursoSearchTerm = useDebounce(cursoSearchTerm, 300);

  // Estados dos Filtros Avançados Flutuantes
  const [isFilterPanelOpen, setIsFilterOpen] = useState(false);
  const [ifdmMin, setIfdmMin] = useState('');
  const [ifdmMax, setIfdmMax] = useState('');

  const [ctiFilters, setCtiFilters] = useState({
      univs: true, ifs: true, icts: true, centrosPesquisa: true, espacos: true, parques: true, incubadoras: true
  });

  const dropdownRef = useRef(null);
  const filterPanelRef = useRef(null);
  const scrollMunsRef = useRef(null);
  const areaGeralRef = useRef(null);
  const mapSectionRef = useRef(null);

  // Função Global de Limpeza (Reset Total)
  const resetGlobalFilters = () => {
      setSearchTerm('');
      setSelectedLocation(null);
      setIfdmMin(''); setIfdmMax('');
      setFiltroSemiarido(false);
      setAreaGeralFilter([]);
      setCursoSearchTerm('');
      setCtiFilters({
          univs: true, ifs: true, icts: true, centrosPesquisa: true, espacos: true, parques: true, incubadoras: true
      });
  };

  // Centralizando toda a lógica de dados no hook customizado
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
    ctiFilters,
    areaGeralFilter,
    debouncedCursoSearchTerm,
  });

  const handleSelectTerritory = useCallback((loc) => {
    setSelectedLocation(loc);
    setSearchTerm(loc ? loc.nome : '');
  }, []); // Setters de estado do useState são estáveis e não precisam ser listados como dependências.

  useEffect(() => {
    function handleClickOutside(event) { 
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false); 
        if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) setIsFilterOpen(false);
        if (areaGeralRef.current && !areaGeralRef.current.contains(event.target)) setIsAreaGeralOpen(false);

        // Lógica para resetar o mapa ao clicar fora
        if (selectedLocation && mapSectionRef.current && !mapSectionRef.current.contains(event.target)) {
            // Evita resetar se o clique for no dropdown de busca, pois ele pode definir uma nova localização
            if (!dropdownRef.current || !dropdownRef.current.contains(event.target)) {
                setSelectedLocation(null);
            }
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedLocation]); // Adicionado selectedLocation para garantir que a lógica de reset tenha a versão mais recente

  useEffect(() => {
    if (selectedLocation && mapSectionRef.current) {
      setTimeout(() => {
        mapSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 150);
    }
  }, [selectedLocation]);

  const toggleCtiFilter = (key) => {
      setCtiFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Lógica para o filtro "Todos" de CTI
  const ctiFilterKeys = useMemo(() => ['univs', 'ifs', 'icts', 'centrosPesquisa', 'espacos', 'parques', 'incubadoras'], []);
  const areAllCtiSelected = useMemo(() => ctiFilterKeys.every(key => ctiFilters[key]), [ctiFilters, ctiFilterKeys]);

  const handleToggleAllCti = () => {
    const newValue = !areAllCtiSelected;
    const newFilters = {};
    ctiFilterKeys.forEach(key => {
        newFilters[key] = newValue;
    });
    setCtiFilters(newFilters);
  };

  // Lógica para clique nos cards de KPI de CTI
  const handleCtiKpiClick = (clickedKey) => {
    const currentlyActiveCount = ctiFilterKeys.filter(key => ctiFilters[key]).length;
    const isClickedKeyActive = ctiFilters[clickedKey];

    // Se nenhum ou vários estiverem ativos, o primeiro clique em um card define ele como o único filtro
    if (!isClickedKeyActive && (currentlyActiveCount === ctiFilterKeys.length || currentlyActiveCount === 0)) {
        const newFilters = {};
        ctiFilterKeys.forEach(key => {
            newFilters[key] = (key === clickedKey);
        });
        setCtiFilters(newFilters);
    } else {
        // Se já estamos em modo de seleção múltipla, apenas alterna o estado do card clicado
        toggleCtiFilter(clickedKey);
    }
  };
  // Efeito para marcar "Todos" se todas as opções individuais forem marcadas
  useEffect(() => {
    // Esta lógica já está coberta pelo `areAllCtiSelected`, mas um useEffect poderia ser usado para lógicas mais complexas.
  }, [ctiFilters]);

  const handleAreaGeralToggle = (areaName) => {
    setAreaGeralFilter(prev => {
        const newFilters = new Set(prev);
        if (newFilters.has(areaName)) {
            newFilters.delete(areaName);
        } else {
            newFilters.add(areaName);
        }
        return Array.from(newFilters);
    });
  };

  const getAreaFilterButtonText = () => {
    if (areaGeralFilter.length === 0) return 'Filtrar Área';
    if (areaGeralFilter.length === 1) return `Área: ${areaGeralFilter[0]}`;
    return `${areaGeralFilter.length} Áreas Selecionadas`;
  };

  const resetAllFilters = () => {
      setIfdmMin(''); setIfdmMax('');
      setFiltroSemiarido(false);
      setCtiFilters({
          univs: true, ifs: true, icts: true, centrosPesquisa: true, espacos: true, parques: true, incubadoras: true
      });
  };

  const getCtiBadgeStyle = (cat, isDark) => {
      const styles = {
          univs: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100',
          ifs: isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-100',
          icts: isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border-cyan-100',
          centrosPesquisa: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
          espacos: isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100',
          parques: isDark ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' : 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
          incubadoras: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100',
      };
      return styles[cat] || (isDark ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200');
  };

  const getBadgeStyle = (tipo) => {
      const t = String(tipo).toLowerCase();
      if (t.includes('potencial')) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      if (t.includes('ig') || t.includes('indicação')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      if (t.includes('apl') || t.includes('arranjo')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      return darkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getAreaStyles = (areaName, darkMode) => {
      const norm = normalize(areaName);
      let theme = 'default';
      
      if (norm.includes('engenharia')) theme = 'red';
      else if (norm.includes('agraria') || norm.includes('agricultura') || norm.includes('veterinaria')) theme = 'green';
      else if (norm.includes('saude')) theme = 'cyan'; // Saúde e Bem-estar
      else if (norm.includes('biologica')) theme = 'teal'; // Ciências Biológicas
      else if (norm.includes('exata') || norm.includes('tecnologia') || norm.includes('computacao')) theme = 'blueDark'; // Exatas e TIC
      else if (norm.includes('naturais') || norm.includes('natureza') || norm.includes('matematica') || norm.includes('estatistica')) theme = 'orange'; // Ciências Naturais e Matemática
      else if (norm.includes('humana')) theme = 'indigo'; // Humanidades
      else if (norm.includes('sociai') || norm.includes('aplicada')) theme = 'fuchsia'; // Sociais Aplicadas
      else if (norm.includes('letra') || norm.includes('arte') || norm.includes('linguistica')) theme = 'yellow';
      else if (norm.includes('multidisciplinar')) theme = 'purple';

      const styles = {
          green: {
              dot: 'bg-emerald-500', text: darkMode ? 'text-emerald-400' : 'text-emerald-600',
              activeBg: darkMode ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-emerald-100 border-emerald-200',
              countBg: darkMode ? 'bg-emerald-500/30 text-emerald-400' : 'bg-white text-emerald-800'
          },
          cyan: {
              dot: 'bg-gov-cyan-500', text: darkMode ? 'text-gov-cyan-400' : 'text-gov-cyan-700',
              activeBg: darkMode ? 'bg-gov-cyan-500/20 border-gov-cyan-500/50' : 'bg-gov-cyan-100 border-gov-cyan-200',
              countBg: darkMode ? 'bg-gov-cyan-500/30 text-gov-cyan-400' : 'bg-white text-gov-cyan-800'
          },
          blueDark: {
              dot: 'bg-gov-blueDark-500', text: darkMode ? 'text-blue-400' : 'text-gov-blueDark-700',
              activeBg: darkMode ? 'bg-blue-500/20 border-blue-500/50' : 'bg-gov-blueDark-100 border-gov-blueDark-200',
              countBg: darkMode ? 'bg-blue-500/30 text-blue-400' : 'bg-white text-gov-blueDark-800'
          },
          magenta: {
              dot: 'bg-gov-magenta-500', text: darkMode ? 'text-gov-magenta-400' : 'text-gov-magenta-700',
              activeBg: darkMode ? 'bg-gov-magenta-500/20 border-gov-magenta-500/50' : 'bg-gov-magenta-100 border-gov-magenta-200',
              countBg: darkMode ? 'bg-gov-magenta-500/30 text-gov-magenta-400' : 'bg-white text-gov-magenta-800'
          },
          red: {
              dot: 'bg-gov-red-500', text: darkMode ? 'text-gov-red-400' : 'text-gov-red-700',
              activeBg: darkMode ? 'bg-gov-red-500/20 border-gov-red-500/50' : 'bg-gov-red-100 border-gov-red-200',
              countBg: darkMode ? 'bg-gov-red-500/30 text-gov-red-400' : 'bg-white text-gov-red-800'
          },
          yellow: {
              dot: 'bg-gov-yellow-500', text: darkMode ? 'text-gov-yellow-400' : 'text-gov-yellow-700',
              activeBg: darkMode ? 'bg-gov-yellow-500/20 border-gov-yellow-500/50' : 'bg-gov-yellow-100 border-gov-yellow-200',
              countBg: darkMode ? 'bg-gov-yellow-500/30 text-gov-yellow-400' : 'bg-white text-gov-yellow-800'
          },
          teal: {
              dot: 'bg-teal-500', text: darkMode ? 'text-teal-400' : 'text-teal-700',
              activeBg: darkMode ? 'bg-teal-500/20 border-teal-500/50' : 'bg-teal-100 border-teal-200',
              countBg: darkMode ? 'bg-teal-500/30 text-teal-400' : 'bg-white text-teal-800'
          },
          purple: {
              dot: 'bg-purple-500', text: darkMode ? 'text-purple-400' : 'text-purple-700',
              activeBg: darkMode ? 'bg-purple-500/20 border-purple-500/50' : 'bg-purple-100 border-purple-200',
              countBg: darkMode ? 'bg-purple-500/30 text-purple-400' : 'bg-white text-purple-800'
          },
          // Novas cores vibrantes baseadas nos KPIs
          indigo: {
              dot: 'bg-indigo-500', text: darkMode ? 'text-indigo-400' : 'text-indigo-600',
              activeBg: darkMode ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-indigo-100 border-indigo-200',
              countBg: darkMode ? 'bg-indigo-500/30 text-indigo-400' : 'bg-white text-indigo-800'
          },
          fuchsia: {
              dot: 'bg-fuchsia-500', text: darkMode ? 'text-fuchsia-400' : 'text-fuchsia-600',
              activeBg: darkMode ? 'bg-fuchsia-500/20 border-fuchsia-500/50' : 'bg-fuchsia-100 border-fuchsia-200',
              countBg: darkMode ? 'bg-fuchsia-500/30 text-fuchsia-400' : 'bg-white text-fuchsia-800'
          },
          orange: {
              dot: 'bg-amber-500', text: darkMode ? 'text-amber-400' : 'text-amber-600',
              activeBg: darkMode ? 'bg-amber-500/20 border-amber-500/50' : 'bg-amber-100 border-amber-200',
              countBg: darkMode ? 'bg-purple-500/30 text-purple-400' : 'bg-white text-purple-800'
          },
          default: {
              dot: 'bg-slate-500', text: darkMode ? 'text-slate-400' : 'text-slate-600',
              activeBg: darkMode ? 'bg-slate-500/20 border-slate-500/50' : 'bg-slate-100 border-slate-200',
              countBg: darkMode ? 'bg-slate-500/30 text-slate-400' : 'bg-white text-slate-800'
          }
      };
      return styles[theme] || styles.default;
  };

  const isActive = (path) => location.pathname === path;

  const themeClasses = {
      app: darkMode ? 'bg-[#0a0f1c] text-slate-200' : 'bg-slate-50 text-slate-800',
      glass: darkMode ? 'bg-slate-900/60 border-slate-700/50 shadow-2xl backdrop-blur-xl' : 'bg-white/80 border-white/60 shadow-xl backdrop-blur-xl',
      input: darkMode ? 'bg-slate-900/50 border-slate-700 text-slate-200 focus:border-blue-500 focus:bg-slate-800' : 'bg-white border-slate-200 text-slate-800 focus:border-gov-blueDark-500',
      textMuted: darkMode ? 'text-slate-400' : 'text-slate-500',
      cardHover: darkMode ? 'hover:bg-slate-800/50 hover:border-slate-600' : 'hover:bg-white hover:border-slate-300'
  };

  const areaGeralSummary = useMemo(() => {
      const counts = {};
      dashboardData.cursos.forEach(c => {
          const area = c.areaGeral || 'Não Informada';
          counts[area] = (counts[area] || 0) + 1;
      });
      return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [dashboardData.cursos]);

  const cursosFiltrados = useMemo(() => {
      let result = dashboardData.cursos;
      if (areaGeralFilter.length > 0) {
          result = result.filter(c => areaGeralFilter.includes(c.areaGeral || 'Não Informada'));
      }
      if (debouncedCursoSearchTerm) {
          const term = normalize(debouncedCursoSearchTerm);
          result = result.filter(curso => normalize(curso.curso).includes(term));
      }
      return result;
  }, [dashboardData.cursos, areaGeralFilter, debouncedCursoSearchTerm]);

  return (
    <div className={`relative flex flex-col font-sans overflow-x-hidden min-h-screen w-full transition-colors duration-500 ${themeClasses.app}`}>
      <Helmet>
        <title>Painel Territorial CT&I | Governo da Bahia</title>
        <meta name="description" content="Plataforma interativa da SECTI com indicadores de Ciência, Tecnologia, Inovação e Cadeias Produtivas dos 27 Territórios de Identidade da Bahia." />
      </Helmet>

      <style>{`
          :root { color-scheme: ${darkMode ? 'dark' : 'light'}; }
          @keyframes softFade { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
          .animate-soft-fade { animation: softFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .hide-scroll::-webkit-scrollbar { height: 4px; width: 4px; }
          
          /* Scrollbar Global da Página */
          ::-webkit-scrollbar { width: 10px; height: 10px; }

          ::-webkit-scrollbar-track { background: ${darkMode ? '#0B1120' : '#F8FAFC'}; }
          ::-webkit-scrollbar-thumb { background-color: ${darkMode ? '#334155' : '#cbd5e1'}; border-radius: 10px; border: 2px solid ${darkMode ? '#0B1120' : '#F8FAFC'}; }
          ::-webkit-scrollbar-thumb:hover { background-color: ${darkMode ? '#475569' : '#94a3b8'}; }

          /* Scrollbar Fina para Painéis Internos */
          .hide-scroll { scrollbar-width: thin; scrollbar-color: ${darkMode ? '#475569 transparent' : '#cbd5e1 transparent'}; }
          .hide-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
          .hide-scroll::-webkit-scrollbar-track { background: transparent; }
          .hide-scroll::-webkit-scrollbar-thumb { background-color: ${darkMode ? '#334155' : '#cbd5e1'}; border-radius: 10px; border: none; }
          .hide-scroll::-webkit-scrollbar-thumb:hover { background-color: ${darkMode ? '#64748b' : '#94a3b8'}; }
          
          @keyframes progress-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
          .animate-progress-slide { animation: progress-slide 1.5s infinite ease-in-out; }
      `}</style>

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full blur-[120px] opacity-[0.15] transition-colors duration-1000 ${darkMode ? 'bg-blue-600' : 'bg-blue-400'}`}></div>
        <div className={`absolute top-[40%] -right-[5%] w-[30vw] h-[30vw] rounded-full blur-[100px] opacity-[0.1] transition-colors duration-1000 ${darkMode ? 'bg-gov-red-500' : 'bg-gov-red-400'}`}></div>
      </div>

      {isLoadingPipeline && territoriosData.length === 0 && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-100/60 dark:bg-slate-900/80 backdrop-blur-2xl transition-all duration-500">
            <div className="absolute w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className={`relative p-10 rounded-[2.5rem] flex flex-col items-center shadow-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/60 border-white/80'}`}>
                <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-slate-200/40 dark:border-slate-700/50 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-3 border-4 border-emerald-500 rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    <div className="absolute w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                </div>
                <h2 className={`text-sm font-black tracking-[0.3em] uppercase mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Sincronizando</h2>
                <div className="w-48 h-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-full mt-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-emerald-400 rounded-full animate-progress-slide"></div>
                </div>
            </div>
          </div>
      )}

      <header className={`fixed top-4 left-0 right-0 mx-auto w-[96%] max-w-[1600px] ${themeClasses.glass} h-16 rounded-2xl flex items-center justify-between px-6 z-[100]`}>
          <div className="flex items-center gap-8">
            <h1 className="text-[11px] sm:text-xs font-black tracking-widest uppercase flex items-center gap-1.5 drop-shadow-sm">
                <span className={darkMode ? 'text-blue-400' : 'text-gov-blueDark-500'}>Painel</span>
                <span className="text-gov-red-500">Territorial</span>
            </h1>
            <nav className="hidden sm:flex items-center gap-2">
                {[ {p: '/', l: 'Início'}, {p: '/sobre', l: 'Sobre'}, {p: '/territorios', l: 'Territórios'}  ].map((tab) => (
                  <Link key={tab.p} to={tab.p} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isActive(tab.p) ? (darkMode ? 'bg-blue-500 text-white' : 'bg-gov-blueDark-500 text-white') : (darkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}`}>
                    {tab.l}
                  </Link>
                ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {location.pathname === '/territorios' && (
                <div ref={filterPanelRef} className="relative">
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterPanelOpen)} 
                        className={`w-auto h-11 px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${isFilterPanelOpen ? 'bg-blue-600 border-blue-700 text-white' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        Filtros Avançados
                    </button>

                    {isFilterPanelOpen && (
                        <div className={`absolute right-0 top-[100%] mt-2 w-72 rounded-2xl p-4 shadow-2xl border z-[150] flex flex-col gap-4 backdrop-blur-2xl ${darkMode ? 'bg-slate-900/95 border-slate-700 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
                            <div>
                                <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Recorte Geográfico</span>
                                <button onClick={() => setFiltroSemiarido(!filtroSemiarido)} className={`w-full h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${filtroSemiarido ? 'bg-orange-500 border-orange-600 text-white hover:bg-orange-600' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}`}>
                                    {filtroSemiarido ? 'Semiárido: Ativo' : 'Ativar Semiárido'}
                                </button>
                            </div>

                            <div>
                                <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">Intervalo D. Territ. (IFDM)</span>
                                <div className="flex gap-2 items-center">
                                    <input type="number" step="0.001" placeholder="Mín" value={ifdmMin} onChange={(e) => setIfdmMin(e.target.value)} className={`w-full h-8 px-2 rounded-lg text-[11px] outline-none border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
                                    <span className="text-[10px] opacity-40">até</span>
                                    <input type="number" step="0.001" placeholder="Máx" value={ifdmMax} onChange={(e) => setIfdmMax(e.target.value)} className={`w-full h-8 px-2 rounded-lg text-[11px] outline-none border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
                                </div>
                            </div>

                            <div>
                                <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">Filtrar Ativos de CTI</span>
                                <div className="max-h-32 overflow-y-auto hide-scroll flex flex-col gap-1.5 border p-2 rounded-xl border-slate-500/20">
                                    <label className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer border-b border-slate-500/10 pb-1.5 mb-1">
                                        <input type="checkbox" checked={areAllCtiSelected} onChange={handleToggleAllCti} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3 w-3" />
                                        <span className={`font-bold ${areAllCtiSelected ? 'opacity-100' : 'opacity-50'}`}>Todos</span>
                                    </label>
                                    {[
                                        { id: 'univs', label: 'Universidades' }, { id: 'ifs', label: 'Institutos Federais' },
                                        { id: 'icts', label: 'ICTs' }, { id: 'centrosPesquisa', label: 'Centros de Pesquisa' },
                                        { id: 'espacos', label: 'Espaços Dinamizadores' }, { id: 'parques', label: 'Parques Tecnológicos' },
                                        { id: 'incubadoras', label: 'Incubadoras' }
                                    ].map((f) => (
                                        <label key={f.id} className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer pl-1">
                                            <input type="checkbox" checked={ctiFilters[f.id]} onChange={() => toggleCtiFilter(f.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3 w-3" />
                                            <span className={ctiFilters[f.id] ? 'opacity-100' : 'opacity-40'}>{f.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <button onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"} className={`p-2 rounded-xl transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {darkMode ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> 
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            <img src={darkMode ? "/img/Brasa╠âo-Horizontal_Branco.png" : "/img/Brasa╠âo-Horizontal_Preto.png"} alt="GOV BA" className="h-6 object-contain hidden lg:block opacity-90" />
          </div>
      </header>

      <main className={`flex-1 overflow-y-auto relative w-full z-10 ${location.pathname === '/' ? '' : 'pt-24 pb-8'}`}>
        <Routes>
          <Route path="/" element={<div className="animate-soft-fade h-full"><LandingHero onAccessDashboard={() => navigate('/territorios')} territoriosData={territoriosData} darkMode={darkMode} /></div>} />
          
          <Route path="/sobre" element={<SobrePage darkMode={darkMode} />} />
            
          <Route path="/territorios" element={
            <>
            <div className="animate-soft-fade relative p-2 lg:p-0 w-[96%] max-w-[1600px] mx-auto min-h-full">
                <div className={`${themeClasses.glass} rounded-[2rem] p-4 lg:p-6 flex flex-col gap-4`}>
                
                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-3 items-center border-b pb-4 ${darkMode ? 'border-slate-700/50' : 'border-slate-200/60'}`}>
                    <div className="lg:col-span-2 relative w-full flex flex-col sm:flex-row gap-3" ref={dropdownRef}>
                        <div className="w-full relative flex-1">
                            <label className={`block text-[9px] font-black uppercase tracking-widest mb-1.5 ${themeClasses.textMuted}`}>Deep Search: Cruzamento Territorial</label>
                            <div className="relative">
                                <input type="text" placeholder={isLoadingPipeline ? "Sincronizando..." : "Pesquise por município, território, segmento ou infraestrutura..."} value={searchTerm} disabled={isLoadingPipeline} onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); if (!e.target.value) setSelectedLocation(null); }} onFocus={() => setIsDropdownOpen(true)} className={`w-full h-11 pl-10 pr-10 rounded-xl text-xs transition-all outline-none border ${themeClasses.input}`} />
                                <svg className={`w-4 h-4 absolute left-3.5 top-3.5 ${themeClasses.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                {searchTerm && ( <button onClick={() => { setSearchTerm(''); setSelectedLocation(null); setIsDropdownOpen(false); }} aria-label="Limpar pesquisa principal" className={`absolute right-3.5 top-3.5 hover:text-red-500 ${themeClasses.textMuted}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button> )}

                                {/* DROPDOWN DE SUGESTÕES DA PESQUISA */}
                                {isDropdownOpen && searchTerm && (
                                    <div className={`absolute top-[100%] left-0 right-0 mt-2 max-h-64 overflow-y-auto hide-scroll rounded-xl border shadow-2xl z-[200] backdrop-blur-2xl ${darkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
                                        {filteredOptions.length > 0 ? (
                                            <div className="flex flex-col p-1.5 gap-0.5">
                                                {filteredOptions.map((opt, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            setSearchTerm(opt.matchText);
                                                            setIsDropdownOpen(false);
                                                            if (opt.matchType === 'Território') {
                                                                setSelectedLocation(opt);
                                                            } else {
                                                                setSelectedLocation(null);
                                                            }
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-colors flex flex-col ${darkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'}`}
                                                    >
                                                        <span className="font-bold truncate">{opt.matchText}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${darkMode ? 'text-blue-400' : 'text-gov-blueDark-500'}`}>
                                                            {opt.matchType} <span className="opacity-50 text-slate-500 ml-1">em {opt.nome}</span>
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={`p-4 text-center text-[10px] font-medium italic ${themeClasses.textMuted}`}>
                                                Nenhum resultado encontrado para "{searchTerm}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BOTÃO DE RESET */}
                        <div className="w-full sm:w-auto pt-0 sm:pt-4 flex items-center">
                            <button 
                                onClick={resetGlobalFilters} 
                                className={`h-11 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-red-400 hover:bg-red-900/30 hover:border-red-500/50' : 'bg-white border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200'}`}
                                title="Limpar todos os filtros e pesquisas ativos"
                            >
                                Limpar
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center lg:justify-end gap-2 lg:pt-4 w-full">
                        <button onClick={() => carregarDadosDoSharePoint(true)} disabled={isLoadingPipeline} className={`h-11 px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'} disabled:opacity-50`}>
                            {isLoadingPipeline ? 'Sincronizando...' : 'Forçar Atualização'}
                        </button>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.textMuted}`}>Cenário Global {selectedLocation ? `— ${selectedLocation.nome}` : (filtroSemiarido ? '— Semiárido Baiano' : '— Estado da Bahia')}</h3>
                        <span className={`text-[9px] font-medium hidden sm:block ${themeClasses.textMuted}`}>Status: {lastUpdate}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            { l: 'Capacidade CTI', v: dashboardData.topKpis.capacidadeCti, pct: dashboardData.topKpisPct.cti, c: darkMode ? 'text-blue-400' : 'text-blue-600', b: 'bg-blue-500' },
                            { l: 'D. Territ. (IFDM)', v: dashboardData.topKpis.ifdm, pct: dashboardData.topKpisPct.ifdm, c: darkMode ? 'text-red-400' : 'text-red-600', b: 'bg-red-500' },
                            { l: 'Semiárido', v: dashboardData.topKpis.coberturaSemiarido, pct: dashboardData.topKpisPct.semiarido, c: darkMode ? 'text-slate-300' : 'text-slate-700', b: 'bg-slate-400', tr: true },
                            { l: 'Cursos Superiores', v: dashboardData.topKpis.cursos, pct: dashboardData.topKpisPct.cursos, c: darkMode ? 'text-cyan-400' : 'text-cyan-600', b: 'bg-cyan-500', tr: true },
                            { l: 'Cadeias Produtivas', v: dashboardData.topKpis.cadeiasIgs, pct: dashboardData.topKpisPct.cadeias, c: darkMode ? 'text-emerald-400' : 'text-emerald-600', b: 'bg-emerald-500', tr: true },
                        ].map((k, idx) => (
                            <div key={idx} className={`relative p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden ${themeClasses.cardHover} ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200/60'}`}>
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 opacity-60 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{k.l}</p>
                                <p className={`text-2xl lg:text-3xl font-black leading-none tracking-tight pb-1.5 ${k.c} ${k.tr ? 'truncate text-xl lg:text-2xl' : ''}`}>{k.v}</p>
                                <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-200/50 dark:bg-slate-700/50">
                                    <div className={`h-full ${k.b} transition-all duration-700 ease-out`} style={{ width: `${Math.min(100, Math.max(0, k.pct))}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-4 lg:grid-cols-7 gap-2 lg:gap-3">
                    {[
                        { id: 'univs', l: 'Univs.', v: dashboardData.subKpis.univs, pct: dashboardData.unfiltSubKpis.univs > 0 ? (dashboardData.subKpis.univs / dashboardData.unfiltSubKpis.univs)*100 : 0, c: darkMode ? 'text-blue-400' : 'text-blue-600', b: 'bg-blue-500', h: darkMode ? 'hover:border-blue-400' : 'hover:border-blue-600' },
                        { id: 'ifs', l: 'Inst. Fed.', v: dashboardData.subKpis.ifs, pct: dashboardData.unfiltSubKpis.ifs > 0 ? (dashboardData.subKpis.ifs / dashboardData.unfiltSubKpis.ifs)*100 : 0, c: darkMode ? 'text-red-400' : 'text-red-600', b: 'bg-red-500', h: darkMode ? 'hover:border-red-400' : 'hover:border-red-600' },
                        { id: 'icts', l: 'ICTs', v: dashboardData.subKpis.icts, pct: dashboardData.unfiltSubKpis.icts > 0 ? (dashboardData.subKpis.icts / dashboardData.unfiltSubKpis.icts)*100 : 0, c: darkMode ? 'text-cyan-400' : 'text-cyan-600', b: 'bg-cyan-500', h: darkMode ? 'hover:border-cyan-400' : 'hover:border-cyan-600' },
                        { id: 'centrosPesquisa', l: 'C. Pesquisa', v: dashboardData.subKpis.centrosPesquisa, pct: dashboardData.unfiltSubKpis.centrosPesquisa > 0 ? (dashboardData.subKpis.centrosPesquisa / dashboardData.unfiltSubKpis.centrosPesquisa)*100 : 0, c: darkMode ? 'text-emerald-400' : 'text-emerald-600', b: 'bg-emerald-500', h: darkMode ? 'hover:border-emerald-400' : 'hover:border-emerald-600' },
                        { id: 'espacos', l: 'Espaços', v: dashboardData.subKpis.espacos, pct: dashboardData.unfiltSubKpis.espacos > 0 ? (dashboardData.subKpis.espacos / dashboardData.unfiltSubKpis.espacos)*100 : 0, c: darkMode ? 'text-indigo-400' : 'text-indigo-600', b: 'bg-indigo-500', h: darkMode ? 'hover:border-indigo-400' : 'hover:border-indigo-600' },
                        { id: 'parques', l: 'Parques', v: dashboardData.subKpis.parques, pct: dashboardData.unfiltSubKpis.parques > 0 ? (dashboardData.subKpis.parques / dashboardData.unfiltSubKpis.parques)*100 : 0, c: darkMode ? 'text-fuchsia-400' : 'text-fuchsia-600', b: 'bg-fuchsia-500', h: darkMode ? 'hover:border-fuchsia-400' : 'hover:border-fuchsia-600' },
                        { id: 'incubadoras', l: 'Incub.', v: dashboardData.subKpis.incubadoras, pct: dashboardData.unfiltSubKpis.incubadoras > 0 ? (dashboardData.subKpis.incubadoras / dashboardData.unfiltSubKpis.incubadoras)*100 : 0, c: darkMode ? 'text-amber-400' : 'text-amber-600', b: 'bg-amber-500', h: darkMode ? 'hover:border-amber-400' : 'hover:border-amber-600' }
                    ].map((sK) => (
                        <div 
                            key={sK.id}
                            onClick={() => handleCtiKpiClick(sK.id)}
                            className={`relative py-2 px-1 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center overflow-hidden transition-all duration-300 cursor-pointer ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white/80 border-slate-200/50'} ${ctiFilters[sK.id] ? `opacity-100 ${sK.h}` : 'opacity-30 grayscale hover:opacity-60 hover:grayscale-0'}`}
                        >
                            <span className={`text-[8px] font-black uppercase tracking-widest opacity-60 mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{sK.l}</span>
                            <span className={`text-xl font-black leading-none pb-1 drop-shadow-sm ${sK.c}`}>{sK.v || 0}</span>
                            <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-200/50 dark:bg-slate-700/50">
                                <div className={`h-full ${sK.b} transition-all duration-700 ease-out`} style={{ width: `${Math.min(100, Math.max(0, sK.pct))}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex flex-col lg:flex-row gap-4 items-stretch min-h-[550px] lg:h-[650px] xl:h-[700px] 2xl:h-[78vh] w-full mt-2 mb-3">
                    
                    <div ref={mapSectionRef} className="w-full lg:w-[50%] xl:w-[55%] flex flex-col relative">
                        <div className={`rounded-[2rem] border p-1 shadow-inner relative flex flex-col flex-1 min-h-0 overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700/50' : 'bg-slate-50 border-slate-200/80'}`}>
                            <div className={`absolute top-5 left-5 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest z-10 flex items-center gap-2 border shadow-lg ${darkMode ? 'bg-slate-800/80 text-white border-slate-600' : 'bg-white/90 text-slate-800 border-slate-200'}`}>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Motor Cartográfico
                            </div><div className="w-full h-full flex-1 rounded-xl overflow-hidden">
                                <ConectaMap 
                                    territoriosData={territoriosData} territoriesDynamicStats={territoriesDynamicStats} 
                                    searchTerm={searchTerm} filtroSemiarido={filtroSemiarido} 
                                    selectedTerritory={selectedLocation} semiaridoMunicipios={semiaridoMunicipios}
                                    onSelectTerritory={handleSelectTerritory} 
                                    darkMode={darkMode} 
                                />
                            </div>
                        </div>
                       
                        <div className="absolute -bottom-10 left-4 flex flex-col">
                            <a 
                                className={`text-[11px] opacity-70 transition-colors ${themeClasses.textMuted} ${darkMode ? 'hover:text-slate-200' : 'hover:text-slate-900'}`} 
                                href="https://www.ibge.gov.br/geociencias/cartas-e-mapas/mapas-regionais/15974-semiarido-brasileiro.html?=&t=o-que-e" 
                                target="_blank" 
                                rel="noreferrer"
                            >
                                IBGE/Semiárido Brasileiro (2022)
                            </a>
                            <a 
                                className={`text-[11px] opacity-70 transition-colors ${themeClasses.textMuted} ${darkMode ? 'hover:text-slate-200' : 'hover:text-slate-900'}`} 
                                href="https://www.ba.gov.br/cultura/314/divisao-territorial-da-bahia" 
                                target="_blank" 
                                rel="noreferrer"
                            >
                                SECULT/Divisão Territorial da Bahia (2024)
                            </a>
                        </div>
                    </div>

                    <div className="w-full lg:w-[50%] xl:w-[45%] flex flex-col gap-4 h-full overflow-hidden">
                        <div className="flex flex-col sm:flex-row gap-4 flex-[0.8] min-h-0">
                            {/* LISTA 1: ESTRUTURAS CT&I */}
                            <div className={`w-full sm:w-1/2 min-h-0 rounded-[1.5rem] border shadow-sm flex flex-col overflow-hidden transition-all ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                                <div className={`p-3 border-b flex items-center justify-between shrink-0 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                                    <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Estruturas CT&I</h4>
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                        {dashboardData.entidades.length}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 hide-scroll">
                                    <div className="flex flex-col gap-2">
                                    {dashboardData.entidades.length > 0 ? (
                                        dashboardData.entidades.map((ent, idx) => (
                                        <div key={idx} className={`p-3 rounded-xl border flex flex-col gap-1 transition-all duration-300 hover:pl-4 ${themeClasses.cardHover} ${darkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white shadow-sm border-slate-100'}`}>
                                            <span className="text-[11px] font-bold leading-tight">{ent.entidade}</span>
                                            <div className="flex justify-between items-end mt-1">
                                                <span className={`text-[8px] flex items-center font-black uppercase px-1.5 py-0.5 rounded border ${getCtiBadgeStyle(ent.categoria, darkMode)}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80"></span>
                                                    {ent.tipo || "Instituição"}
                                                </span>
                                                <div className="text-right"><span className="block text-[9px] font-medium opacity-80">{ent.municipio}</span></div>
                                            </div>
                                        </div>
                                    ))) : (<div className={`flex items-center justify-center h-full text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhuma infraestrutura mapeada para os filtros ativos.</div>)}
                                    </div>
                                </div>
                            </div>

                            {/* LISTA 2: CADEIAS PRODUTIVAS */}
                            <div className={`w-full sm:w-1/2 min-h-0 rounded-[1.5rem] border shadow-sm flex flex-col overflow-hidden transition-all ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                                <div className={`p-3 border-b flex items-center justify-between shrink-0 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                                    <div className="flex items-center gap-1.5">
                                        <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Cadeias Produtivas</h4>
                                        <div className="relative group flex items-center justify-center z-50">
                                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-help outline-none">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4M12 8h.01"></path></svg>
                                            </button>
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                                <div className={`w-max p-3 rounded-xl text-[11px] leading-relaxed shadow-xl border ${darkMode ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                                                    <span className="block font-bold mb-1 opacity-70">Fonte dos Dados:</span>
                                                    <a href="https://datasebrae.com.br/indicacoesgeograficas/" target="_blank" rel="noreferrer" className="block whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">
                                                        DataSebrae / Indicações Geográficas
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>{dashboardData.aplIgs.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 hide-scroll">
                                    <div className="flex flex-col gap-2">
                                    {dashboardData.aplIgs.length > 0 ? dashboardData.aplIgs.map((apl, idx) => (
                                        <div key={idx} className={`p-3 rounded-xl border flex flex-col transition-all duration-300 hover:pl-4 ${themeClasses.cardHover} ${darkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white shadow-sm border-slate-100'}`}>
                                            <div className="flex items-start justify-between mb-1.5">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${darkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{apl.segmento}</span>
                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${getBadgeStyle(apl.tipo)}`}>{apl.tipo}</span>
                                            </div>
                                            {apl.entidade && <span className="text-[11px] font-bold leading-tight mb-1">{apl.entidade}</span>}
                                            <div className={`p-2 rounded-lg border mt-1 ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                                <span className="block text-[8px] font-black uppercase opacity-50 mb-1">Abrangência Municipal:</span>
                                                <p className="text-[9px] font-medium leading-relaxed opacity-90 truncate" title={apl.municipiosPertencentes}>{apl.municipiosPertencentes}</p>
                                                
                                                {apl.municipioSatelite && apl.municipioSatelite !== '' && (
                                                    <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
                                                        <span className="block text-[8px] font-black uppercase opacity-50 mb-0.5">Município(s) Satélite(s):</span>
                                                        <p className="text-[9px] font-medium leading-relaxed opacity-90 truncate" title={apl.municipioSatelite}>{apl.municipioSatelite}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (<div className={`flex items-center justify-center h-full text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhuma cadeia isolada para os filtros ativos.</div>)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NOVA SESSÃO: CURSOS SUPERIORES */}
                        <div className={`flex-1 min-h-0 mt-4 relative rounded-[1.5rem] border shadow-sm flex flex-col transition-all ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                            <div className={`p-4 rounded-t-[1.5rem] border-b flex flex-col shrink-0 gap-3 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <h4 className={`text-xs font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Cursos em CT&I (Ensino Superior)</h4>
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>{cursosFiltrados.length} Cursos</span>
                                    </div>
                                    
                                    {/* DROPDOWN DE FILTRO DE ÁREA GERAL */}
                                    {areaGeralSummary.length > 0 && (
                                        <div className="relative flex-shrink-0" ref={areaGeralRef}>
                                            <button
                                                onClick={() => setIsAreaGeralOpen(!isAreaGeralOpen)}
                                                className={`h-9 px-4 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${isAreaGeralOpen || areaGeralFilter.length > 0 ? 'bg-emerald-600 border-emerald-700 text-white' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                                <span className="whitespace-nowrap">{getAreaFilterButtonText()}</span>
                                            </button>
                                            {isAreaGeralOpen && (
                                                <div className={`absolute right-0 top-[100%] mt-2 w-72 sm:w-80 max-w-[90vw] rounded-2xl p-3 shadow-2xl border z-[150] flex flex-col gap-1.5 backdrop-blur-2xl ${darkMode ? 'bg-slate-900/95 border-slate-700 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
                                                    <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 px-1">Áreas Gerais</span>
                                                    <div className="max-h-64 overflow-y-auto hide-scroll flex flex-col gap-1.5 pr-1">
                                                        {areaGeralSummary.map(area => {
                                                        const styles = getAreaStyles(area.name, darkMode);
                                                        const isSelected = areaGeralFilter.includes(area.name);
                                                        return (
                                                            <button
                                                                key={area.name}
                                                                onClick={() => handleAreaGeralToggle(area.name)}
                                                                className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-start sm:items-center justify-between gap-2 border ${isSelected ? styles.activeBg : (darkMode ? 'bg-transparent border-transparent hover:bg-slate-800' : 'bg-transparent border-transparent hover:bg-slate-50')}`}
                                                            >
                                                                <div className="flex items-center gap-2 pr-2">
                                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 sm:mt-0 ${styles.dot}`}></span>
                                                                    <span className={`whitespace-normal leading-snug ${isSelected ? styles.text : (darkMode ? 'text-slate-300' : 'text-slate-600')}`}>{area.name}</span>
                                                                </div>
                                                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] shrink-0 ${isSelected ? styles.countBg : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>{area.count}</span>
                                                            </button>
                                                        );
                                                    })}
                                                    </div>
                                                    {areaGeralFilter.length > 0 && (
                                                        <button onClick={() => { setAreaGeralFilter([]); setIsAreaGeralOpen(false); }} className={`mt-2 w-full h-8 rounded-xl font-bold text-[9px] uppercase tracking-wider border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors`}>Limpar Filtros</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="relative w-full">
                                    <input 
                                        type="text" 
                                        placeholder="Buscar curso..." 
                                        value={cursoSearchTerm} 
                                        onChange={(e) => setCursoSearchTerm(e.target.value)} 
                                        className={`w-full h-9 pl-8 pr-8 rounded-xl text-[10px] font-medium transition-all outline-none border shadow-sm ${darkMode ? 'bg-slate-900/50 border-slate-700 text-slate-200 focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'}`}
                                    />
                                    <svg className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    {cursoSearchTerm && (
                                        <button onClick={() => setCursoSearchTerm('')} aria-label="Limpar pesquisa de curso" className="absolute right-2.5 top-2.5 hover:text-red-500 text-slate-400">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 flex-1 overflow-y-auto hide-scroll rounded-b-[1.5rem]">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                    {cursosFiltrados.length > 0 ? cursosFiltrados.map((curso, idx) => {
                                        const areaStyles = getAreaStyles(curso.areaGeral, darkMode);
                                        const hoverClasses = darkMode 
                                            ? 'hover:border-current' 
                                            : 'hover:border-current';
                                        return (
                                        <div key={curso.id || idx} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 ${areaStyles.text} ${hoverClasses} ${darkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white shadow-sm border-slate-100'}`}>
                                            
                                            {/* CABEÇALHO */}
                                            <div className="flex flex-col items-start gap-1.5 mb-2">
                                                <h5 className={`text-[13px] font-bold leading-snug ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{curso.curso}</h5>
                                                {curso.areaGeral && (
                                                    <span 
                                                        className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider inline-block text-left ${getAreaStyles(curso.areaGeral, darkMode).activeBg} ${getAreaStyles(curso.areaGeral, darkMode).text}`}
                                                    >
                                                        {curso.areaGeral}
                                                    </span>
                                                )}
                                            </div>

                                            {/* CORPO: Info Institucional */}
                                            <div className={`p-2.5 rounded-lg border ${darkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-200/50'}`}>
                                                <span className={`block text-[10px] font-bold mb-1.5 leading-tight ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{curso.entidade}</span>
                                                {(curso.categoriaAdm || curso.orgAcademica) && (
                                                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[8px] font-medium uppercase tracking-wider opacity-80">
                                                        {[curso.categoriaAdm, curso.orgAcademica].filter(Boolean).map((tag, i, arr) => (
                                                            <React.Fragment key={i}>
                                                                <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{tag}</span>
                                                                {i < arr.length - 1 && <span className="w-0.5 h-0.5 rounded-full bg-current opacity-40"></span>}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* RODAPÉ */}
                                            <div className="flex justify-between items-end mt-auto pt-1 gap-2">
                                                <span className={`text-[9px] font-semibold flex items-center gap-1.5 min-w-0 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} title={`${curso.municipio} • ${curso.territorioRef}`}>
                                                    <svg className="w-3 h-3 opacity-60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    <span className="truncate">{curso.municipio} • {curso.territorioRef}</span>
                                                </span>
                                                
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {curso.nivel && <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200'}`}>{curso.nivel}</span>}
                                                    {curso.modalidade && <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-200'}`}>{curso.modalidade}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                    }) : (<div className={`col-span-full flex items-center justify-center py-8 text-[11px] font-medium italic ${themeClasses.textMuted}`}>{areaGeralFilter.length > 0 || cursoSearchTerm ? `Nenhum curso encontrado para a pesquisa e/ou filtros aplicados.` : 'Nenhum curso superior mapeado ou isolado.'}</div>)}
                                </div>
                            </div>

                            <a 
                                className={`absolute -bottom-6 left-4 text-left text-[12px] font-medium opacity-70 transition-opacity hover:opacity-100 ${themeClasses.textMuted}`} 
                                href="https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior" 
                                target="_blank" 
                                rel="noreferrer"
                            >
                                Fonte: INEP/Censo da Educação Superior (2024)
                            </a>
                        </div>
                    </div>
                </div>

                </div>
            </div>
            </>
          } />

        </Routes>
      </main>
    </div>
  );
}

// ==========================================
// EXPORTAÇÃO
// ==========================================
export default function AppWrapper() {
  return (
    <HelmetProvider>
      <Router>
        <MainApp />
      </Router>
    </HelmetProvider>
  );
}