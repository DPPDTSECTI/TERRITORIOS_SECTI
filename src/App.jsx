import { Helmet, HelmetProvider } from 'react-helmet-async';
import React, { useState, useRef, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import PtiMap from "../PtiMap";
import { Target, BarChart3, Database, Settings, Map as MapIcon, Code, Info, Download, Sun, Home, Filter, Search, Eraser, RefreshCw, Expand, Minimize, Plus, FlaskConical, Leaf, HeartPulse, Cpu, Sigma, Brain, Landmark, Palette, Network, HelpCircle, TrendingUp, School, Library, Microscope, Lightbulb, Factory, Egg, Menu, GraduationCap, ExternalLink } from 'lucide-react';
import useTerritoriosData from '../useTerritoriosData.js';
import territoriosMunicipios from '../utils/territorioMunicipios.json';
import { DataProvider } from './context/DataContext';
import KpiSection, { SubKpiPanel } from './components/KpiSection';
import MapSection from './components/MapSection';
import ListSection from './components/ListSection';
import { resolveCadeiaFonte } from './utils/cadeiasUtils';
import { buildMunicipiosInstituicoesList, buildAreaHeatmapData, buildCadeiasPorSegmento, classificarInstituicao, filterTerritoriosByLocation } from '../utils/reportAggregation.js';
import { getTerritoryArrayByFonte } from '../utils/reportCategorias.js';
import ReportExportMenu from './components/report/ReportExportMenu';
import MunicipiosReportImage from './components/report/MunicipiosReportImage';
import AreaHeatmap from './components/report/AreaHeatmap';
import MapaNumeradoMunicipios from './components/report/MapaNumeradoMunicipios';
import StackedBarCursosMunicipios from './components/report/StackedBarCursosMunicipios';
import MapaCadeiasProdutivas from './components/report/MapaCadeiasProdutivas';

// Carregamento Preguiçoso (Lazy Loading) das Rotas e Componentes Pesados
const LandingHero = lazy(() => import('./components/hero'));
const SobrePage = lazy(() => import('./components/SobrePage'));
const Tutorial = lazy(() => import('./components/Tutorial'));
const ExcelExportButton = lazy(() => import('./components/ExcelExportButton'));

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
    const [cadeiaSearchTerm, setCadeiaSearchTerm] = useState('');
    const debouncedCadeiaSearchTerm = useDebounce(cadeiaSearchTerm, 300);
    const [isAreaGeralOpen, setIsAreaGeralOpen] = useState(false);
    const [cursoSearchTerm, setCursoSearchTerm] = useState('');
    const debouncedCursoSearchTerm = useDebounce(cursoSearchTerm, 300);
    const [ctiSearchTerm, setCtiSearchTerm] = useState('');
    const debouncedCtiSearchTerm = useDebounce(ctiSearchTerm, 300);
    const [expandedLists, setExpandedLists] = useState([]);
    const [modalVisibleCounts, setModalVisibleCounts] = useState({});
    const [isModalAreaGeralOpen, setIsModalAreaGeralOpen] = useState(false);
    const [isModalCtiFilterOpen, setIsModalCtiFilterOpen] = useState(false);
    const [isModalCadeiaFilterOpen, setIsModalCadeiaFilterOpen] = useState(false);
    const [isCardCadeiaFilterOpen, setIsCardCadeiaFilterOpen] = useState(false);
    const [isModalAddListOpen, setIsModalAddListOpen] = useState(false);
    const [expandedCourse, setExpandedCourse] = useState(null);
    const [expandedCadeia, setExpandedCadeia] = useState(null);
    const [expandedCti, setExpandedCti] = useState(null);
    const [sidebarCadeiaSearch, setSidebarCadeiaSearch] = useState('');
    const [expandedSidebarCadeia, setExpandedSidebarCadeia] = useState({});

    // Navbars e Scroll
    const [navVisible, setNavVisible] = useState(true);
    const lastScrollY = useRef(0);

    // Menus Laterais
    const [isSideFilterOpen, setIsSideFilterOpen] = useState(false);
    const [isVerticalSearchOpen, setIsVerticalSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    // Auto-open tutorial on first visit
    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('painel_tutorial_seen');
        if (!hasSeenTutorial && location.pathname === '/territorios') {
            const timer = setTimeout(() => setIsTutorialOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [location.pathname]);

    const handleCloseTutorial = useCallback(() => {
        setIsTutorialOpen(false);
        localStorage.setItem('painel_tutorial_seen', 'true');
    }, []);

    // Filtros de D.Territorial
    const [ifdmMin, setIfdmMin] = useState('');
    const [ifdmMax, setIfdmMax] = useState('');

    // Filtros de CTI (AGORA COM ACELERADORAS INCLUÍDO)
    const [ctiFilters, setCtiFilters] = useState({
        campiUniversidadePublica: true, campiUniversidadePrivada: true, campiInstitutoFederal: true, icts: true, centrosPesquisa: true, espacoDinamizadoress: true, parquesTecnologicos: true, incubadorasAceleradoras: true
    });
    const [isCtiFilterActive, setIsCtiFilterActive] = useState(false);

    const sideFilterRef = useRef(null);
    const searchDropdownRef = useRef(null);
    const areaGeralRef = useRef(null);
    const mapSectionRef = useRef(null);
    const modalAreaGeralRef = useRef(null);
    const modalCtiFilterRef = useRef(null);
    const modalCadeiaFilterRef = useRef(null);
    const cardCadeiaFilterRef = useRef(null);
    const modalAddListRef = useRef(null);

    const resetGlobalFilters = () => {
        setSearchTerm('');
        setSelectedLocation(null);
        setIfdmMin(''); setIfdmMax('');
        setFiltroSemiarido(false);
        setAreaGeralFilter([]);
        setCadeiaProdutivaFilter([]);
        setCadeiaSearchTerm('');
        setCursoSearchTerm('');
        setCtiSearchTerm('');
        setCtiFilters({
            campiUniversidadePublica: true, campiUniversidadePrivada: true, campiInstitutoFederal: true, icts: true, centrosPesquisa: true, espacoDinamizadoress: true, parquesTecnologicos: true, incubadorasAceleradoras: true
        });
        setIsCtiFilterActive(false);
        setIsDropdownOpen(false);
        setIsCardCadeiaFilterOpen(false);
    };

    const handleCloseModal = useCallback(() => {
        setExpandedLists([]);
        setModalVisibleCounts({});
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
        cadeiaProdutivaFilter,
        ctiFilters,
        isCtiFilterActive,
        areaGeralFilter,
        debouncedCursoSearchTerm,
        debouncedCadeiaSearchTerm,
        debouncedCtiSearchTerm
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
            if (cardCadeiaFilterRef.current && !cardCadeiaFilterRef.current.contains(event.target)) {
                setIsCardCadeiaFilterOpen(false);
            }
            if (modalAddListRef.current && !modalAddListRef.current.contains(event.target)) {
                setIsModalAddListOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                if (expandedCourse) setExpandedCourse(null);
                else if (expandedCadeia) setExpandedCadeia(null);
                else if (expandedCti) setExpandedCti(null);
                else if (expandedLists.length > 0) handleCloseModal();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [expandedCourse, expandedCadeia, expandedCti, expandedLists, handleCloseModal]);

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

    const toggleCtiFilter = (key) => {
        setCtiFilters(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // AQUI TAMBÉM INCLUI ACELERADORAS NAS CHAVES
    const ctiFilterKeys = useMemo(() => ['campiUniversidadePublica', 'campiUniversidadePrivada', 'campiInstitutoFederal', 'icts', 'centrosPesquisa', 'espacoDinamizadoress', 'parquesTecnologicos', 'incubadorasAceleradoras'], []);
    const areAllCtiSelected = useMemo(() => ctiFilterKeys.every(key => ctiFilters[key]), [ctiFilters, ctiFilterKeys]);

    const handleToggleAllCti = () => {
        const newValue = !areAllCtiSelected;
        const newFilters = {};
        ctiFilterKeys.forEach(key => { newFilters[key] = newValue; });
        setCtiFilters(newFilters);
    };

    const handleAreaGeralToggle = createArrayFilterToggleHandler(setAreaGeralFilter);
    const handleCadeiaProdutivaToggle = createArrayFilterToggleHandler(setCadeiaProdutivaFilter);

    const getAreaFilterButtonText = () => {
        if (areaGeralFilter.length === 0) return 'Filtros';
        return `${areaGeralFilter.length} Selecionada${areaGeralFilter.length > 1 ? 's' : ''}`;
    };

    const formatEntidadeTipo = (tipo, cat) => {
        let t = String(tipo || '').trim();
        if (cat === 'campiUniversidadePublica' || cat === 'campiUniversidadePrivada' || t.toLowerCase().includes('universidade')) {
            if (!t.toLowerCase().startsWith('campi')) {
                return `Campi  ${t}`;
            }
        }
        return t || "Instituição";
    };

    const getCtiBadgeStyle = (cat, isDark) => {
        return isDark ? 'bg-gov-cyan/10 text-cyan-400 border-gov-cyan/20' : 'bg-gov-cyan/10 text-gov-cyan-dark border-gov-cyan/20';
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

    const getAreaInfo = (areaName) => {
        const norm = normalize(areaName);

        if (norm.includes('engenharia')) return { icon: <Settings size={12} />, acronym: 'ENG' };
        if (norm.includes('agraria') || norm.includes('agricultura') || norm.includes('veterinaria')) return { icon: <Leaf size={12} />, acronym: 'AGRO' };
        if (norm.includes('saude')) return { icon: <HeartPulse size={12} />, acronym: 'SAÚDE' };
        if (norm.includes('biologica')) return { icon: <FlaskConical size={12} />, acronym: 'BIO' };
        if (norm.includes('exata') || norm.includes('tecnologia') || norm.includes('computacao')) return { icon: <Cpu size={12} />, acronym: 'TIC' };
        if (norm.includes('naturais') || norm.includes('natureza') || norm.includes('matematica') || norm.includes('estatistica')) return { icon: <Sigma size={12} />, acronym: 'CNME' };
        if (norm.includes('humana')) return { icon: <Brain size={12} />, acronym: 'HUMAN' };
        if (norm.includes('sociai') || norm.includes('aplicada')) return { icon: <Landmark size={12} />, acronym: 'SOCIAIS' };
        if (norm.includes('letra') || norm.includes('arte') || norm.includes('linguistica')) return { icon: <Palette size={12} />, acronym: 'ARTES' };
        if (norm.includes('multidisciplinar')) return { icon: <Network size={12} />, acronym: 'MULTI' };

        return { icon: <HelpCircle size={12} />, acronym: 'N/A' };
    };

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

    const todasAsAreasGerais = useMemo(() => {
        const areas = new Set();
        territoriosData.forEach(t => {
            (t.cursosDetalhado || []).forEach(c => {
                areas.add(c.areaGeral || 'Não Informada');
            });
        });
        return [...areas].sort();
    }, [territoriosData]);

    const todasAsCadeiasPorTipo = useMemo(() => {
        const aplSegments = new Set();
        const igSegments = new Set();
        territoriosData.forEach(t => {
            (t.cadeiasProdutivasDetalhado || []).forEach(cad => {
                const tipoLower = String(cad.tipo || '').toLowerCase();
                const seg = cad.segmento;
                if (!seg) return;
                if (tipoLower.includes('apl') || tipoLower.includes('arranjo')) {
                    aplSegments.add(seg);
                } else if (tipoLower.includes('ig') || tipoLower.includes('indicação')) {
                    igSegments.add(seg);
                }
            });
        });
        return {
            APL: Array.from(aplSegments).sort((a, b) => a.localeCompare(b, 'pt-BR')),
            IG: Array.from(igSegments).sort((a, b) => a.localeCompare(b, 'pt-BR'))
        };
    }, [territoriosData]);

    const handleCadeiaParentToggle = (parentCategory) => {
        const subSegments = todasAsCadeiasPorTipo[parentCategory] || [];
        const subKeys = subSegments.map(s => `${parentCategory}__${s}`);

        setCadeiaProdutivaFilter(prev => {
            const current = new Set(prev);
            const isParentSelected = current.has(parentCategory);
            const allSubsSelected = subKeys.every(k => current.has(k));

            if (isParentSelected || allSubsSelected) {
                current.delete(parentCategory);
                subKeys.forEach(k => current.delete(k));
            } else {
                current.add(parentCategory);
                subKeys.forEach(k => current.add(k));
            }
            return Array.from(current);
        });
    };

    const handleCadeiaSubToggle = (parentCategory, segmentName) => {
        const key = `${parentCategory}__${segmentName}`;
        const subSegments = todasAsCadeiasPorTipo[parentCategory] || [];
        const subKeys = subSegments.map(s => `${parentCategory}__${s}`);

        setCadeiaProdutivaFilter(prev => {
            const current = new Set(prev);
            if (current.has(key)) {
                current.delete(key);
                current.delete(parentCategory);
            } else {
                current.add(key);
                const allOthersSelected = subKeys.every(k => k === key || current.has(k));
                if (allOthersSelected) {
                    current.add(parentCategory);
                }
            }
            return Array.from(current);
        });
    };

    const hasActiveFilters = searchTerm !== '' ||
        selectedLocation !== null ||
        ifdmMin !== '' ||
        ifdmMax !== '' ||
        filtroSemiarido !== false ||
        areaGeralFilter.length > 0 ||
        cadeiaProdutivaFilter.length > 0 ||
        cadeiaSearchTerm !== '' ||
        cursoSearchTerm !== '' ||
        ctiSearchTerm !== '' ||
        isCtiFilterActive ||
        !Object.values(ctiFilters).every(val => val === true);

    const availableListsToAdd = ['cti', 'cadeias', 'cursos'].filter(type => !expandedLists.includes(type));

    const reportFiltros = useMemo(() => ({
        selectedLocation: selectedLocation && selectedLocation.matchType !== 'Município' ? selectedLocation : null,
        filtroSemiarido,
        semiaridoMunicipios,
        areaGeralFilter,
        debouncedCursoSearchTerm: '',
        searchTerm: '',
        ctiFilters,
        isCtiFilterActive
    }), [
        selectedLocation,
        filtroSemiarido,
        semiaridoMunicipios,
        areaGeralFilter,
        ctiFilters,
        isCtiFilterActive
    ]);

    const reportMunicipiosList = useMemo(() => {
        return buildMunicipiosInstituicoesList(territoriosData, reportFiltros);
    }, [territoriosData, reportFiltros]);

    const reportHeatmapData = useMemo(() => {
        return buildAreaHeatmapData(territoriosData, reportFiltros);
    }, [territoriosData, reportFiltros]);

    const filteredForReports = useMemo(() => filterTerritoriosByLocation(territoriosData, reportFiltros), [territoriosData, reportFiltros]);

    const reportUnivPublicasList = useMemo(() => {
        return buildMunicipiosInstituicoesList(filteredForReports, reportFiltros).filter(m =>
            m.instituicoes && m.instituicoes.some(i => ['federal', 'estadual', 'institutoFederal', 'campiUniversidadePublica', 'campiInstitutoFederal'].includes(i.categoria))
        );
    }, [filteredForReports, reportFiltros]);

    const reportUnivPrivadasList = useMemo(() => {
        const privEntities = [];
        filteredForReports.forEach(t => {
            const arrCap = getTerritoryArrayByFonte(t, 'capacidadeDetalhada');
            arrCap.forEach(ent => {
                if (ent && ent.categoria === 'campiUniversidadePrivada') {
                    privEntities.push({ ...ent, territory: t.nome || t.territory });
                }
            });
            const arrCursos = Array.isArray(t.cursosDetalhado) ? t.cursosDetalhado : [];
            arrCursos.forEach(c => {
                const info = classificarInstituicao(c);
                if (info.categoria === 'privada' || c.categoria === 'campiUniversidadePrivada') {
                    privEntities.push({ ...c, territory: t.nome || t.territory });
                }
            });
        });
        return buildMunicipiosInstituicoesList(privEntities, reportFiltros);
    }, [filteredForReports, reportFiltros]);

    const reportCadeiasList = useMemo(() => {
        return buildCadeiasPorSegmento(filteredForReports);
    }, [filteredForReports]);

    const reportAtivosCtiList = useMemo(() => {
        const ativos = [];
        filteredForReports.forEach(t => {
            const arrCap = getTerritoryArrayByFonte(t, 'capacidadeDetalhada');
            arrCap.forEach(ent => {
                if (ent && ['icts', 'centrosPesquisa', 'parquesTecnologicos', 'incubadoras', 'aceleradoras', 'espacoDinamizadoress'].includes(ent.categoria)) {
                    ativos.push({
                        ...ent,
                        municipio: ent.municipio || t.territory,
                        territory: t.nome || t.territory
                    });
                }
            });
        });
        return buildMunicipiosInstituicoesList(ativos, reportFiltros);
    }, [filteredForReports, reportFiltros]);

    const subKpisList = useMemo(() => {
        if (!dashboardData?.subKpis || !dashboardData?.unfiltSubKpis) return [];
        const singleColorClass = darkMode ? 'text-cyan-400' : 'text-gov-cyan';
        const singleBarClass = 'bg-gov-cyan';

        const kpiData = [
            { id: 'campiUniversidadePublica', l: 'Campi Univ. Públicas', c: singleColorClass, b: singleBarClass, sourceText: 'INEP / Censo da Educação Superior (2024)', sourceLink: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior' },
            { id: 'campiUniversidadePrivada', l: 'Campi Univ. Privadas', c: singleColorClass, b: singleBarClass, sourceText: 'INEP / Censo da Educação Superior (2024)', sourceLink: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior' },
            { id: 'campiInstitutoFederal', l: 'Campi Inst. Federais', c: singleColorClass, b: singleBarClass, sourceText: 'INEP / Censo da Educação Superior (2024)', sourceLink: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior' },
            { id: 'icts', l: 'ICTs', c: singleColorClass, b: singleBarClass },
            { id: 'centrosPesquisa', l: 'C. Pesquisa', c: singleColorClass, b: singleBarClass },
            { id: 'espacoDinamizadoress', l: 'Espaços Dinamizadores', c: singleColorClass, b: singleBarClass },
            { id: 'parquesTecnologicos', l: 'Parques Tec.', c: singleColorClass, b: singleBarClass },
            { id: 'incubadorasAceleradoras', l: 'Incub. & Acel.', c: singleColorClass, b: singleBarClass } // INCLUÍDO AQUI
        ];

        return kpiData.map(kpi => ({ ...kpi, v: dashboardData.subKpis[kpi.id] || 0, pct: (dashboardData.unfiltSubKpis[kpi.id] || 0) > 0 ? ((dashboardData.subKpis[kpi.id] || 0) / dashboardData.unfiltSubKpis[kpi.id]) * 100 : 0 }));
    }, [dashboardData, darkMode]);

    return (
        <div className={`relative flex flex-col font-sans overflow-x-hidden min-h-screen w-full transition-colors duration-500 ${themeClasses.app}`}>
            {expandedLists.length > 0 && (
                <div className={`fixed inset-0 z-[150] bg-gray-900/90 flex items-center p-4 animate-soft-fade transition-all duration-500 ${isTutorialOpen ? 'justify-start pl-4 xl:pl-6 pr-4 xl:pr-[440px]' : 'justify-center'}`} onClick={handleCloseModal}>
                    <div className="relative w-full min-w-0 flex items-center justify-center">
                        <div
                            data-tutorial="expanded-lists-modal"
                            onClick={e => e.stopPropagation()}
                            className={`h-[85vh] ${isTutorialOpen ? 'w-full max-w-none' : 'w-[95vw] sm:w-[90vw]'} min-w-0 rounded-2xl border shadow-2xl flex flex-col overflow-visible transition-all duration-500 ${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/95 border-gray-200'} ${isTutorialOpen ? '' : (expandedLists.length === 1 ? 'max-w-4xl' : expandedLists.length === 2 ? 'max-w-7xl' : 'max-w-[1800px]')}`}
                        >
                            {/* HEADER DO MODAL */}
                            <div className={`p-3 rounded-t-2xl border-b flex items-center justify-between shrink-0 gap-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-800'}`}>Listas Expandidas</h3>
                                <div className="flex items-center gap-2">
                                    {availableListsToAdd.length > 0 && (
                                        <div data-tutorial="add-list-button" ref={modalAddListRef} className="relative">
                                            <button
                                                onClick={() => {
                                                    setIsModalAddListOpen(prev => !prev);
                                                    if (isTutorialOpen) {
                                                        window.dispatchEvent(new Event('tutorial-next-step'));
                                                    }
                                                }}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all shadow-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                                aria-label="Adicionar nova lista"
                                            >
                                                <Plus size={14} strokeWidth={2.5} />
                                                Adicionar Lista
                                            </button>
                                            {isModalAddListOpen && (
                                                <div data-tutorial="add-list-dropdown" className={`absolute top-full right-0 mt-2 w-56 max-w-[85vw] rounded-lg p-2 shadow-2xl border z-20 flex flex-col gap-1 ${themeClasses.glass}`}>
                                                    {availableListsToAdd.map(type => {
                                                        const config = {
                                                            cti: { title: 'Ativos de CT&I', icon: <Database size={14} className="text-gov-blue" /> },
                                                            cadeias: { title: 'Cadeias Produtivas', icon: <BarChart3 size={14} className="text-gov-green" /> },
                                                            cursos: { title: 'Cursos de CT&I', icon: <GraduationCap size={14} className="text-gov-cyan" /> }
                                                        }[type];
                                                        return (
                                                            <button key={type} onClick={() => {
                                                                setExpandedLists(prev => [...prev, type]);
                                                                setIsModalAddListOpen(false);
                                                                if (isTutorialOpen) {
                                                                    window.dispatchEvent(new Event('tutorial-next-step'));
                                                                }
                                                            }} className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>
                                                                {config.icon}
                                                                {config.title}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button onClick={handleCloseModal} className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Fechar"><Minimize size={18} /></button>
                                </div>
                            </div>

                            {/* GRID DE CONTEÚDO DO MODAL */}
                            <div className="flex-1 min-h-0 p-4 overflow-visible rounded-b-2xl">
                                <div data-tutorial="expanded-lists-grid" className="grid h-full gap-4" style={{ gridTemplateColumns: `repeat(${expandedLists.length}, minmax(0, 1fr))` }}>
                                    {expandedLists.map((listType, listIndex) => {
                                        let listData, renderItem, listTitle, filterControls, gridColsClass;

                                        // MUDANÇA: RENDER CTI ITEM (Inclui indicador de Site e Descrição)
                                        const renderCtiItem = (ent, idx) => (
                                            <div key={idx} onClick={() => setExpandedCti(ent)} className={`p-3 rounded-lg border flex flex-col gap-1 transition-colors duration-200 ${themeClasses.cardHover} ${darkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'} cursor-pointer`}>
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="text-[11px] font-bold leading-tight">{fixWeirdCapitalization(ent.entidade)}</span>
                                                    {ent.site && <ExternalLink size={10} className={`shrink-0 mt-0.5 opacity-50 ${darkMode ? 'text-blue-400' : 'text-gov-blue'}`} title="Possui site cadastrado" />}
                                                </div>
                                                {ent.descricao && <span className="text-[9px] line-clamp-2 opacity-70 leading-relaxed mt-0.5">{ent.descricao}</span>}
                                                <div className="flex justify-between items-end mt-1">
                                                    <span className={`text-[8px] flex items-center font-black uppercase px-1.5 py-0.5 rounded border ${getCtiBadgeStyle(ent.categoria, darkMode)}`}>
                                                        {ent.tipo || "Instituição"}
                                                    </span>
                                                    <div className="text-right"><span className={`block text-[9px] font-medium ${themeClasses.textMuted}`}>{ent.municipio}</span></div>
                                                </div>
                                            </div>
                                        );

                                        const renderCadeiaItem = (apl, idx) => (
                                            <div key={idx} onClick={() => setExpandedCadeia(apl)} className={`p-3 rounded-lg border flex flex-col transition-colors duration-200 ${themeClasses.cardHover} ${darkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'} cursor-pointer`}>
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${darkMode ? 'bg-gov-green/10 text-green-400 border-gov-green/20' : 'bg-gov-green/10 text-gov-green-dark border-gov-green/20'}`}>{apl.segmento}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${getBadgeStyle(apl.tipo)}`}>{apl.tipo}</span>
                                                        {apl.fonte && (
                                                            <div className="relative group flex items-center justify-center z-50 shrink-0" onClick={e => e.stopPropagation()}>
                                                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none">
                                                                    <Info size={12} />
                                                                </button>
                                                                <div className="absolute right-0 top-full pt-1 w-max max-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[99999] pointer-events-none group-hover:pointer-events-auto">
                                                                    <div className={`p-2.5 rounded-lg text-[9px] leading-snug shadow-2xl border backdrop-blur-xl ${darkMode ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                                                                        <span className="block font-bold mb-0.5 opacity-70">Fonte dos Dados:</span>
                                                                        {(() => {
                                                                            const info = resolveCadeiaFonte(apl);
                                                                            return (
                                                                                <a
                                                                                    href={info.url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="group/link flex items-start gap-1 underline hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400 font-semibold leading-relaxed break-words"
                                                                                    onClick={e => e.stopPropagation()}
                                                                                >
                                                                                    <span className="line-clamp-4">{info.isArticle ? info.label : (info.originalFonte || info.label)}</span>
                                                                                    <ExternalLink size={10} className="shrink-0 mt-0.5" />
                                                                                </a>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {apl.entidade && <div className="mb-2"><span className="block text-[7px] font-black uppercase tracking-widest opacity-50 mb-0.5 text-gov-blue dark:text-blue-400">Entidade Vinculada</span><span className={`block text-[11px] font-bold leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{fixWeirdCapitalization(apl.entidade)}</span></div>}
                                                <div className={`p-2.5 rounded-md border mt-auto ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
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
                                                <div
                                                    key={curso.id || idx}
                                                    onClick={() => setExpandedCourse(curso)}
                                                    className={`p-3 rounded-lg border flex flex-col gap-2 transition-colors duration-200 ${themeClasses.cardHover} ${areaStyles.text} ${darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'} cursor-pointer`}
                                                >
                                                    <div className="flex flex-col items-start gap-1">
                                                        <h5 className={`text-[11px] font-bold leading-snug line-clamp-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`} title={fixWeirdCapitalization(curso.curso)}>{fixWeirdCapitalization(curso.curso)}</h5>
                                                        {curso.areaGeral && <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider inline-block text-left ${areaStyles.activeBg} ${areaStyles.text}`}>{curso.areaGeral}</span>}
                                                    </div>
                                                    <div className={`p-2 rounded-md border mt-auto ${darkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200/50'}`}>
                                                        <span className={`block text-[9px] font-bold mb-1 leading-tight ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} title={fixWeirdCapitalization(curso.entidade)}>{fixWeirdCapitalization(curso.entidade)}</span>
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
                                            listTitle = 'Ativos de CT&I';
                                            gridColsClass = expandedLists.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1';
                                            filterControls = (
                                                <React.Fragment>
                                                    <div className="relative w-36 sm:w-48">
                                                        <input
                                                            type="text"
                                                            placeholder="Buscar estrutura CT&I..."
                                                            value={ctiSearchTerm}
                                                            onChange={(e) => setCtiSearchTerm(e.target.value)}
                                                            className={`w-full h-7 pl-7 pr-7 rounded-md text-[9px] font-medium transition-all outline-none border shadow-sm ${darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-200 focus:border-gov-blue' : 'bg-white border-gray-200 text-gray-800 focus:border-gov-blue'}`}
                                                        />
                                                        <Search size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                                                        {ctiSearchTerm && (
                                                            <button onClick={() => setCtiSearchTerm('')} aria-label="Limpar pesquisa" className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gov-red text-gray-400">
                                                                <Eraser size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="relative" ref={modalCtiFilterRef}>
                                                        <button onClick={() => setIsModalCtiFilterOpen(!isModalCtiFilterOpen)} className={`h-7 px-2 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border shadow-sm ${isModalCtiFilterOpen || !areAllCtiSelected ? (darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200') : (darkMode ? 'bg-transparent border-gray-700 hover:bg-gray-700' : 'bg-transparent border-gray-200 hover:bg-gray-100')}`}><Filter size={12} /></button>
                                                        {isModalCtiFilterOpen && (
                                                            <div className={`absolute right-0 top-[100%] mt-2 w-60 max-w-[85vw] rounded-lg p-2 shadow-2xl border z-[150] flex flex-col gap-1 backdrop-blur-2xl ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
                                                                <div className="max-h-48 overflow-y-auto hide-scroll flex flex-col gap-1.5 pr-1">
                                                                    <label className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer border-b border-gray-500/10 pb-1.5 mb-1">
                                                                        <input type="checkbox" checked={areAllCtiSelected} onChange={handleToggleAllCti} className="rounded border-gray-300 text-gov-blue focus:ring-gov-blue h-3 w-3" />
                                                                        <span className={`font-bold ${areAllCtiSelected ? 'opacity-100' : 'opacity-50'}`}>Todos</span>
                                                                    </label>
                                                                    {ctiFilterKeys.map((key) => (
                                                                        <label key={key} className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer pl-1">
                                                                            <input type="checkbox" checked={ctiFilters[key]} onChange={() => toggleCtiFilter(key)} className="rounded border-gray-300 text-gov-blue focus:ring-gov-blue h-3 w-3" />
                                                                            <span className={ctiFilters[key] ? 'opacity-100' : 'opacity-40'}>
                                                                                {{
                                                                                    campiUniversidadePublica: 'Campi Universidade Pública',
                                                                                    campiUniversidadePrivada: 'Campi Universidade Privada',
                                                                                    campiInstitutoFederal: 'Campi Inst. Federais',
                                                                                    icts: 'ICTs',
                                                                                    centrosPesquisa: 'Centros de Pesquisa',
                                                                                    espacoDinamizadoress: 'Espaços Dinamizadores',
                                                                                    parquesTecnologicos: 'Parques Tecnológicos',
                                                                                    incubadorasAceleradoras: 'Incubadoras & Aceleradoras'
                                                                                }[key]}
                                                                            </span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                                {!areAllCtiSelected && (
                                                                    <button onClick={handleToggleAllCti} className={`mt-1.5 w-full h-7 rounded-md font-bold text-[8px] uppercase tracking-wider border transition-colors ${darkMode ? 'border-gov-red/30 text-red-400 hover:bg-gov-red/20' : 'border-gov-red/30 text-gov-red-dark hover:bg-gov-red/10'}`}>Limpar</button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </React.Fragment>
                                            );
                                        } else if (listType === 'cadeias') {
                                            listData = dashboardData.aplIgs;
                                            renderItem = renderCadeiaItem;
                                            listTitle = 'Cadeias Produtivas';
                                            gridColsClass = 'grid-cols-1';
                                            filterControls = (
                                                <React.Fragment>
                                                    <div className="relative w-36 sm:w-48">
                                                        <input
                                                            type="text"
                                                            placeholder="Buscar sede, satélite, segmento..."
                                                            value={cadeiaSearchTerm}
                                                            onChange={(e) => setCadeiaSearchTerm(e.target.value)}
                                                            className={`w-full h-7 pl-7 pr-7 rounded-md text-[9px] font-medium transition-all outline-none border shadow-sm ${darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-200 focus:border-gov-green' : 'bg-white border-gray-200 text-gray-800 focus:border-gov-green'}`}
                                                        />
                                                        <Search size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                                                        {cadeiaSearchTerm && (
                                                            <button onClick={() => setCadeiaSearchTerm('')} aria-label="Limpar pesquisa" className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gov-red text-gray-400">
                                                                <Eraser size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="relative" ref={modalCadeiaFilterRef}>
                                                        <button onClick={() => setIsModalCadeiaFilterOpen(!isModalCadeiaFilterOpen)} className={`h-7 px-2 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border shadow-sm ${isModalCadeiaFilterOpen || cadeiaProdutivaFilter.length > 0 ? (darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200') : (darkMode ? 'bg-transparent border-gray-700 hover:bg-gray-700' : 'bg-transparent border-gray-200 hover:bg-gray-100')}`}><Filter size={12} /></button>
                                                        {isModalCadeiaFilterOpen && (
                                                            <div className={`absolute right-0 top-[100%] mt-2 w-72 max-w-[85vw] rounded-xl p-3 shadow-2xl border z-[150] flex flex-col gap-2.5 backdrop-blur-2xl ${darkMode ? 'bg-gray-900/95 border-gray-700 text-gray-200' : 'bg-white/95 border-gray-200 text-gray-800'}`}>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="block text-[9px] font-black uppercase tracking-widest opacity-60">Filtrar Cadeias Produtivas</span>
                                                                    {cadeiaProdutivaFilter.length > 0 && (
                                                                        <button
                                                                            onClick={() => setCadeiaProdutivaFilter([])}
                                                                            className={`text-[9px] font-bold text-gov-red hover:underline opacity-80 hover:opacity-100 transition-opacity`}
                                                                        >
                                                                            Limpar ({cadeiaProdutivaFilter.length})
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="relative w-full">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Buscar segmento..."
                                                                        value={sidebarCadeiaSearch}
                                                                        onChange={(e) => setSidebarCadeiaSearch(e.target.value)}
                                                                        className={`w-full h-7 pl-7 pr-7 rounded-lg text-[10px] font-medium transition-all outline-none border ${darkMode ? 'bg-gray-800/80 border-gray-700 text-gray-200 focus:border-emerald-500' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-emerald-600'}`}
                                                                    />
                                                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                                    {sidebarCadeiaSearch && (
                                                                        <button onClick={() => setSidebarCadeiaSearch('')} aria-label="Limpar pesquisa" className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:text-gov-red text-gray-400">
                                                                            <Eraser size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className="max-h-60 overflow-y-auto hide-scroll flex flex-col gap-2 border p-2 rounded-lg border-gray-500/20 bg-gray-500/5">
                                                                    {['APL', 'IG'].map(tipo => {
                                                                        const allSubSegments = todasAsCadeiasPorTipo[tipo] || [];
                                                                        const searchNorm = normalize(sidebarCadeiaSearch);
                                                                        const filteredSubSegments = searchNorm
                                                                            ? allSubSegments.filter(seg => normalize(seg).includes(searchNorm))
                                                                            : allSubSegments;
                                                                        const subKeys = filteredSubSegments.map(s => `${tipo}__${s}`);
                                                                        const isParentSelected = cadeiaProdutivaFilter.includes(tipo);
                                                                        const isSomeSubSelected = subKeys.some(k => cadeiaProdutivaFilter.includes(k));
                                                                        const allSubKeys = allSubSegments.map(s => `${tipo}__${s}`);
                                                                        const isAllSubSelected = allSubSegments.length > 0 && allSubKeys.every(k => cadeiaProdutivaFilter.includes(k));
                                                                        const isExpanded = expandedSidebarCadeia[tipo] || false;
                                                                        const LIMIT = 3;
                                                                        const visibleSegments = (searchNorm || isExpanded) ? filteredSubSegments : filteredSubSegments.slice(0, LIMIT);
                                                                        const hasMore = !searchNorm && filteredSubSegments.length > LIMIT;

                                                                        if (searchNorm && filteredSubSegments.length === 0) return null;

                                                                        return (
                                                                            <div key={tipo} className={`flex flex-col gap-1.5 p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800/40 border border-gray-700/50' : 'bg-white border border-gray-100 shadow-xs'}`}>
                                                                                <div className="flex items-center justify-between">
                                                                                    <label className="flex items-center gap-2 text-[10px] font-black cursor-pointer select-none">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={isParentSelected || isAllSubSelected}
                                                                                            onChange={() => handleCadeiaParentToggle(tipo)}
                                                                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3 accent-emerald-600 cursor-pointer"
                                                                                        />
                                                                                        <span className={isParentSelected || isSomeSubSelected ? (darkMode ? 'text-emerald-400 font-extrabold' : 'text-emerald-700 font-extrabold') : (darkMode ? 'text-gray-200' : 'text-gray-800')}>
                                                                                            {tipo}
                                                                                        </span>
                                                                                    </label>
                                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'}`}>
                                                                                        {filteredSubSegments.length}
                                                                                    </span>
                                                                                </div>
                                                                                {filteredSubSegments.length > 0 && (
                                                                                    <div className="pl-3 flex flex-col gap-0.5 border-l-2 border-emerald-500/30 ml-1.5 mt-0.5">
                                                                                        {visibleSegments.map(seg => {
                                                                                            const key = `${tipo}__${seg}`;
                                                                                            const isSubChecked = isParentSelected || cadeiaProdutivaFilter.includes(key);
                                                                                            return (
                                                                                                <label key={seg} className={`flex items-center gap-2 text-[9px] font-medium cursor-pointer select-none px-2 py-0.5 rounded-md transition-all ${isSubChecked ? (darkMode ? 'bg-emerald-950/40 text-emerald-300 font-semibold' : 'bg-emerald-50 text-emerald-900 font-semibold') : (darkMode ? 'hover:bg-gray-700/40 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}`}>
                                                                                                    <input
                                                                                                        type="checkbox"
                                                                                                        checked={isSubChecked}
                                                                                                        onChange={() => handleCadeiaSubToggle(tipo, seg)}
                                                                                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-2.5 w-2.5 accent-emerald-600 cursor-pointer"
                                                                                                    />
                                                                                                    <span className="truncate">{seg}</span>
                                                                                                </label>
                                                                                            );
                                                                                        })}
                                                                                        {hasMore && (
                                                                                            <button
                                                                                                onClick={() => setExpandedSidebarCadeia(prev => ({ ...prev, [tipo]: !prev[tipo] }))}
                                                                                                className={`w-full py-1 mt-1 text-[8px] font-bold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-1 ${darkMode ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}
                                                                                            >
                                                                                                {isExpanded ? '▲ Ver menos' : `▼ Ver mais (${filteredSubSegments.length - LIMIT})`}
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </React.Fragment>
                                            );
                                        } else if (listType === 'cursos') {
                                            listData = cursosFiltrados;
                                            renderItem = renderCursoItem;
                                            listTitle = 'Cursos de CT&I';
                                            gridColsClass = 'grid-cols-1 md:grid-cols-2';
                                            filterControls = (
                                                <React.Fragment>
                                                    <div className="relative w-32 sm:w-40"><input type="text" placeholder="Buscar curso..." value={cursoSearchTerm} onChange={(e) => setCursoSearchTerm(e.target.value)} className={`w-full h-7 pl-7 pr-7 rounded-md text-[9px] font-medium transition-all outline-none border shadow-sm ${darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-200 focus:border-gov-green' : 'bg-white border-gray-200 text-gray-800 focus:border-gov-green'}`} /><Search size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />{cursoSearchTerm && <button onClick={() => setCursoSearchTerm('')} aria-label="Limpar pesquisa" className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gov-red text-gray-400"><Eraser size={12} /></button>}</div>
                                                    {areaGeralSummary.length > 0 && <div className="relative" ref={modalAreaGeralRef}><button onClick={() => setIsModalAreaGeralOpen(!isModalAreaGeralOpen)} className={`h-7 px-2 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border shadow-sm ${isModalAreaGeralOpen || areaGeralFilter.length > 0 ? (darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200') : (darkMode ? 'bg-transparent border-gray-700 hover:bg-gray-700' : 'bg-transparent border-gray-200 hover:bg-gray-100')}`}>{areaGeralFilter.length > 0 ? (<div className="flex items-center gap-0.5">{areaGeralFilter.map(areaName => (<span key={areaName} className={`flex items-center justify-center [&>svg]:w-3 [&>svg]:h-3 ${getAreaStyles(areaName, darkMode).text}`} title={areaName}>{getAreaInfo(areaName).icon}</span>))}</div>) : (<Filter size={12} />)}</button>{isModalAreaGeralOpen && <div className={`absolute right-0 top-[100%] mt-2 w-72 max-w-[85vw] rounded-lg p-2 shadow-2xl border z-[150] flex flex-col gap-1 backdrop-blur-2xl ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}><div className="max-h-48 overflow-y-auto hide-scroll flex flex-col gap-1 pr-1">{todasAsAreasGerais.map(areaName => { const areaData = areaGeralSummary.find(a => a.name === areaName); const count = areaData ? areaData.count : 0; const styles = getAreaStyles(areaName, darkMode); const isSelected = areaGeralFilter.includes(areaName); const { icon } = getAreaInfo(areaName); if (count === 0 && !isSelected) return null; return (<button key={areaName} onClick={() => handleAreaGeralToggle(areaName)} className={`w-full text-left px-2 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all flex items-start sm:items-center justify-between gap-2 border ${isSelected ? styles.activeBg : (darkMode ? 'bg-transparent border-transparent hover:bg-gray-800' : 'bg-transparent border-transparent hover:bg-gray-50')}`}><div className="flex items-center gap-1.5 pr-1"><span className={`shrink-0 mt-0.5 sm:mt-0 ${styles.text}`}>{icon}</span><span className={`whitespace-normal leading-snug ${isSelected ? styles.text : (darkMode ? 'text-gray-300' : 'text-gray-600')}`}>{areaName}</span></div><span className={`px-1.5 py-0.5 rounded text-[8px] shrink-0 ${isSelected ? styles.countBg : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>{count}</span></button>); })}</div>{areaGeralFilter.length > 0 && <button onClick={() => { setAreaGeralFilter([]); setIsModalAreaGeralOpen(false); }} className={`mt-1.5 w-full h-7 rounded-md font-bold text-[8px] uppercase tracking-wider border transition-colors ${darkMode ? 'border-gov-red/30 text-red-400 hover:bg-gov-red/20' : 'border-gov-red/30 text-gov-red-dark hover:bg-gov-red/10'}`}>Limpar</button>}</div>}</div>}
                                                </React.Fragment>
                                            );
                                        } else {
                                            return null;
                                        }

                                        return (
                                            <div key={listType} data-tutorial={listIndex === 1 ? 'added-list' : (listType === 'cursos' ? 'cursos-card' : undefined)} className={`rounded-xl overflow-visible border flex flex-col min-h-0 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
                                                <div className={`p-3 border-b flex items-center justify-between shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-gray-800'}`}>{listTitle}</h4>
                                                        {listType !== 'cadeias' && (
                                                            <div className="relative group flex items-center justify-center z-40">
                                                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none">
                                                                    <Info size={12} />
                                                                </button>
                                                                <div className="absolute left-0 top-full pt-1 w-max max-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[9999] pointer-events-none group-hover:pointer-events-auto">
                                                                    <div className={`p-2.5 rounded-lg text-[10px] leading-snug shadow-2xl border backdrop-blur-xl ${darkMode ? 'bg-gray-900/95 text-gray-200 border-gray-700' : 'bg-white/95 text-gray-700 border-gray-200'}`}>
                                                                        <span className="block font-bold mb-0.5 opacity-70">Fonte dos Dados:</span>
                                                                        <a href="https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior" target="_blank" rel="noreferrer" className="block leading-tight opacity-80 hover:opacity-100 transition-opacity">
                                                                            INEP / Censo da Educação Superior (2024)
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${listType === 'cti' || listType === 'cursos' ? (darkMode ? 'bg-gov-cyan/20 text-cyan-400' : 'bg-gov-cyan/10 text-gov-cyan-dark') : (darkMode ? 'bg-gov-green/20 text-green-400' : 'bg-gov-green/10 text-gov-green-dark')}`}>{listData.length}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {filterControls}
                                                        <button onClick={() => setExpandedLists(p => p.filter(l => l !== listType))} className={`p-1.5 rounded-md transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`} title={`Remover ${listTitle}`}>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-h-0 overflow-y-auto p-3 hide-scroll">
                                                    <div className={`grid gap-2 ${gridColsClass}`}>
                                                        {listData.slice(0, modalVisibleCounts[listType] || 50).map(renderItem)}
                                                    </div>
                                                    {listData.length > (modalVisibleCounts[listType] || 50) && (
                                                        <button
                                                            onClick={() => setModalVisibleCounts(prev => ({ ...prev, [listType]: (prev[listType] || 50) + 50 }))}
                                                            className={`w-full mt-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border ${darkMode ? 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                                        >
                                                            Carregar mais ({listData.length - (modalVisibleCounts[listType] || 50)} restantes)
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            )}

            {/* MODAL DE CURSO EXPANDIDO */}
            {expandedCourse && (
                <div className="fixed inset-0 z-[160] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-soft-fade" onClick={() => setExpandedCourse(null)}>
                    <div
                        data-tutorial="detail-modal"
                        className={`relative max-w-md w-full rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/95 border-gray-200'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`p-3 border-b flex items-center justify-between shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Detalhes do Curso</h3>
                            <button onClick={() => setExpandedCourse(null)} className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Fechar">
                                <Minimize size={16} />
                            </button>
                        </div>
                        <div className="p-4">
                            {(() => {
                                const curso = expandedCourse;
                                const areaStyles = getAreaStyles(curso.areaGeral, darkMode);
                                return (
                                    <div className={`p-3 rounded-lg border flex flex-col gap-2 ${areaStyles.text} ${darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'}`}>
                                        <div className="flex flex-col items-start gap-1">
                                            <h5 className={`text-base font-bold leading-snug ${darkMode ? 'text-gray-100' : 'text-gray-800'}`} title={fixWeirdCapitalization(curso.curso)}>{fixWeirdCapitalization(curso.curso)}</h5>
                                            {curso.areaGeral && <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider inline-block text-left ${getAreaStyles(curso.areaGeral, darkMode).activeBg} ${getAreaStyles(curso.areaGeral, darkMode).text}`}>{curso.areaGeral}</span>}
                                        </div>
                                        <div className={`p-2 rounded-md border mt-auto ${darkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200/50'}`}>
                                            <span className={`block text-sm font-bold mb-1 leading-tight ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} title={fixWeirdCapitalization(curso.entidade)}>{fixWeirdCapitalization(curso.entidade)}</span>
                                            {(curso.categoriaAdm || curso.orgAcademica) && <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium uppercase tracking-wider opacity-80 mt-2">{[curso.orgAcademica, curso.categoriaAdm].filter(Boolean).map((tag, i) => (<span key={i} className={`px-2 py-1 rounded-md border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>{tag}</span>))}</div>}
                                            <div className="flex justify-between items-end mt-3 pt-3 border-t border-gray-500/10 gap-1.5">
                                                <span className={`text-xs font-semibold flex items-center gap-1.5 min-w-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={`${curso.municipio} • ${curso.territorioRef}`}><MapIcon className="w-3.5 h-3.5 opacity-60 shrink-0" /><span>{curso.municipio}</span></span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {curso.nivel && <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-200'}`}>{curso.nivel}</span>}
                                                    {curso.modalidade && <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-600 border-gray-200'}`}>{curso.modalidade}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CADEIA EXPANDIDA */}
            {expandedCadeia && (
                <div className="fixed inset-0 z-[160] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-soft-fade" onClick={() => setExpandedCadeia(null)}>
                    <div
                        data-tutorial="detail-modal"
                        className={`relative max-w-md w-full rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/95 border-gray-200'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`p-3 border-b flex items-center justify-between shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Detalhes da Cadeia Produtiva</h3>
                            <button onClick={() => setExpandedCadeia(null)} className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Fechar">
                                <Minimize size={16} />
                            </button>
                        </div>
                        <div className="p-4">
                            {(() => {
                                const apl = expandedCadeia;
                                return (
                                    <div className={`p-3 rounded-lg border flex flex-col gap-2 ${darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'}`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded border ${darkMode ? 'bg-gov-green/10 text-green-400 border-gov-green/20' : 'bg-gov-green/10 text-gov-green-dark border-gov-green/20'}`}>{apl.segmento || 'Cadeia'}</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border shrink-0 ${getBadgeStyle(apl.tipo)}`}>{apl.tipo}</span>
                                        </div>
                                        {apl.entidade && (
                                            <div className="mb-2">
                                                <span className="block text-[8px] font-black uppercase tracking-widest opacity-50 mb-0.5 text-gov-blue dark:text-blue-400">Entidade Vinculada</span>
                                                <h5 className={`text-base font-bold leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{fixWeirdCapitalization(apl.entidade)}</h5>
                                            </div>
                                        )}
                                        <div className={`p-3 rounded-md border mt-auto ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="grid grid-cols-2 gap-4 mb-3">
                                                <div>
                                                    <span className="block text-[9px] font-black uppercase opacity-50 mb-0.5">Sede:</span>
                                                    <p className={`text-xs font-bold leading-relaxed opacity-90 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{apl.sede}</p>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] font-black uppercase opacity-50 mb-0.5">Território(s):</span>
                                                    <p className={`text-xs font-bold leading-relaxed opacity-90 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{apl.territorios ? apl.territorios.join(', ') : 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className={`pt-3 border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                                                <span className="block text-[9px] font-black uppercase opacity-50 mb-0.5">Municípios Pertencentes:</span>
                                                <p className={`text-xs font-medium leading-relaxed opacity-80 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{apl.municipiosPertencentes}</p>
                                            </div>
                                            {apl.fonte && (
                                                <div className={`pt-3 border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                                                    <span className="block text-[9px] font-black uppercase opacity-50 mb-1">Fonte dos Dados:</span>
                                                    {(() => {
                                                        const info = resolveCadeiaFonte(apl);
                                                        return (
                                                            <a href={info.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1.5 text-xs font-bold leading-relaxed underline hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400 break-words" onClick={e => e.stopPropagation()}>
                                                                <span>{info.isArticle ? info.label : (info.originalFonte || info.label)}</span>
                                                                <ExternalLink size={12} className="shrink-0 mt-0.5" />
                                                            </a>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* MUDANÇA NO MODAL DE CT&I EXPANDIDO */}
            {expandedCti && (
                <div className="fixed inset-0 z-[160] bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-soft-fade" onClick={() => setExpandedCti(null)}>
                    <div
                        data-tutorial="detail-modal"
                        className={`relative max-w-md w-full rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/95 border-gray-200'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`p-3 border-b flex items-center justify-between shrink-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>Detalhes dos Ativos de CT&I</h3>
                            <button onClick={() => setExpandedCti(null)} className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`} title="Fechar">
                                <Minimize size={16} />
                            </button>
                        </div>
                        <div className="p-4 max-h-[80vh] overflow-y-auto hide-scroll">
                            {(() => {
                                const ent = expandedCti;
                                return (
                                    <div className={`p-3.5 rounded-lg border flex flex-col gap-3 ${darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <h5 className={`text-base font-bold leading-snug ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{fixWeirdCapitalization(ent.entidade)}</h5>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`text-[10px] flex items-center font-black uppercase px-2 py-0.5 rounded border ${getCtiBadgeStyle(ent.categoria, darkMode)}`}>
                                                {formatEntidadeTipo(ent.tipo, ent.categoria)}
                                            </span>
                                        </div>

                                        {/* CAIXA DE DESCRIÇÃO SE EXISTIR (Exclusivo para Aceleradoras/Algumas Capacidades) */}
                                        {ent.descricao && (
                                            <div className={`p-3 rounded-md border text-xs leading-relaxed opacity-90 ${darkMode ? 'bg-gray-800/50 border-gray-700 text-gray-300' : 'bg-gray-50/80 border-gray-200 text-gray-700'}`}>
                                                <p>{ent.descricao}</p>
                                            </div>
                                        )}

                                        <div className={`p-3 rounded-md border mt-1 ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <span className="block text-[9px] font-black uppercase opacity-50 mb-0.5">Município:</span>
                                                    <p className={`text-xs font-bold leading-relaxed opacity-90 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{ent.municipio || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] font-black uppercase opacity-50 mb-0.5">Território de Identidade:</span>
                                                    <p className={`text-xs font-bold leading-relaxed opacity-90 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{ent.territorioRef || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {/* CAIXA DE SITE SE EXISTIR */}
                                            {ent.site && (
                                                <div className={`pt-3 mt-3 border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                                                    <span className="block text-[9px] font-black uppercase opacity-50 mb-1">Site Oficial:</span>
                                                    <a href={ent.site} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold underline hover:opacity-100 transition-opacity text-blue-500 dark:text-blue-400 break-all" onClick={e => e.stopPropagation()}>
                                                        {ent.site.replace(/^https?:\/\//, '')}
                                                        <ExternalLink size={12} className="shrink-0" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
            <Helmet>
                <title>Painel Territorial CT&I | Governo da Bahia</title>
                <meta name="description" content="Plataforma interativa da SECTI com indicadores de Ciência, Tecnologia, Inovação e Cadeias Produtivas dos 27 Territórios de Identidade da Bahia." />
                <link rel="icon" type="image/png" sizes="any" href="/img/favicon-512.png?v=6" />
                <link rel="apple-touch-icon" href="/img/favicon-512.png?v=6" />
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
                    <div className={`relative p-10 rounded-3xl flex flex-col items-center shadow-2xl border ${darkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white/60 border-white/80'}`}>
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
            <header data-tutorial="header" className={`sticky top-4 mx-auto w-[96%] max-w-[1600px] ${themeClasses.glass} h-16 rounded-xl flex items-center justify-between px-6 z-[100] transition-all duration-500 ${navVisible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'}`}>
                <div className="flex items-center gap-8">
                    <h1 className="text-[11px] sm:text-xs font-black tracking-widest uppercase flex items-center gap-1.5 drop-shadow-sm">
                        <span className={darkMode ? 'text-blue-400' : 'text-gov-blue'}>Painel</span>
                        <span className="text-gov-red">Territorial</span>
                    </h1>
                    <nav className="hidden sm:flex items-center gap-2">
                        {[{ p: '/', l: 'Início' }, { p: '/sobre', l: 'Sobre' }, { p: '/territorios', l: 'Territórios' }].map((tab) => (
                            <Link key={tab.p} to={tab.p} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${isActive(tab.p) ? 'bg-gov-blue text-white' : (darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')}`}>
                                {tab.l}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-4 relative">
                    <button onClick={() => setDarkMode(!darkMode)} aria-label="Alterar Tema" className={`p-2 rounded-lg transition-all border ${darkMode ? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        {darkMode ? <Sun size={16} strokeWidth={2.5} /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                    </button>
                    <img src={darkMode ? "/img/Brasao-Horizontal_Branco.png" : "/img/Brasao-Horizontal_Preto.png"} alt="GOV BA" className="h-6 object-contain hidden lg:block opacity-90" />

                    {/* MOBILE MENU TOGGLE */}
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`lg:hidden p-2 rounded-lg transition-all border ${isMobileMenuOpen ? 'bg-gov-blue text-white border-gov-blue' : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')}`}>
                        <Menu size={16} strokeWidth={2.5} />
                    </button>

                    {/* MOBILE MENU DROPDOWN */}
                    {isMobileMenuOpen && (
                        <div className={`lg:hidden absolute top-[calc(100%+1rem)] right-0 w-[calc(100vw-3rem)] max-w-sm rounded-2xl p-4 shadow-2xl border flex flex-col gap-4 backdrop-blur-2xl z-[200] animate-soft-fade ${darkMode ? 'bg-gray-900/95 border-gray-700 text-gray-200' : 'bg-white/95 border-gray-200 text-gray-800'}`}>
                            {/* Navegação Mobile */}
                            <div className="flex gap-2">
                                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`flex-1 text-center p-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>Início</Link>
                                <Link to="/sobre" onClick={() => setIsMobileMenuOpen(false)} className={`flex-1 text-center p-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>Sobre</Link>
                            </div>

                            {/* Busca */}
                            <div className="relative">
                                <input type="text" placeholder="Buscar no painel..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }} className={`w-full h-10 px-4 rounded-lg text-[11px] font-medium outline-none border transition-all ${darkMode ? 'bg-gray-900/95 border-gray-700 text-white focus:border-gov-blue' : 'bg-white/95 border-gray-200 text-gray-800 focus:border-gov-blue'}`} />
                                {isDropdownOpen && searchTerm && (
                                    <div className={`absolute left-0 top-full mt-2 w-full max-h-48 overflow-y-auto hide-scroll rounded-lg border shadow-2xl z-[250] backdrop-blur-2xl ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
                                        {filteredOptions.length > 0 ? (
                                            <div className="flex flex-col p-1.5 gap-0.5">
                                                {filteredOptions.map((opt, i) => (
                                                    <button key={i} onClick={() => { setSearchTerm(opt.matchText); setIsDropdownOpen(false); setIsMobileMenuOpen(false); if (opt.matchType === 'Território') setSelectedLocation(opt); else setSelectedLocation(null); }} className={`w-full text-left px-3 py-2 rounded-md text-[11px] transition-colors flex flex-col ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>
                                                        <span className="font-bold truncate">{opt.matchText}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${darkMode ? 'text-blue-400' : 'text-gov-blue'}`}> {opt.matchType} <span className="opacity-50 text-gray-500 ml-1">em {opt.nome}</span> </span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (<div className={`p-4 text-center text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhum resultado encontrado.</div>)}
                                    </div>
                                )}
                            </div>

                            {/* Ações */}
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => { setIsSideFilterOpen(!isSideFilterOpen); setIsMobileMenuOpen(false); }} className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${isSideFilterOpen ? 'bg-gov-blue text-white border-gov-blue' : (darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')}`}><Filter size={14} /> Filtros</button>
                                <button onClick={() => { carregarDadosDoSharePoint(true); setIsMobileMenuOpen(false); }} className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${darkMode ? 'text-green-400 bg-green-900/20 border-green-900/50' : 'text-gov-green-dark bg-gov-green/10 border-gov-green/30'}`}><RefreshCw size={14} className={isLoadingPipeline ? "animate-spin" : ""} /> Sync</button>
                            </div>

                            <button onClick={() => { resetGlobalFilters(); setIsMobileMenuOpen(false); }} className={`flex items-center justify-center gap-2 p-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${hasActiveFilters ? (darkMode ? 'text-red-400 bg-red-900/20 border-red-900/50' : 'text-gov-red bg-gov-red/10 border-gov-red/30') : (darkMode ? 'text-gray-500 bg-gray-800 border-gray-700' : 'text-gray-400 bg-gray-50 border-gray-200')}`}><Eraser size={14} /> Limpar Filtros</button>
                        </div>
                    )}
                </div>
            </header>

            {/* NAVBAR LATERAL VERTICAL (Sempre visível em /territorios no Desktop) */}
            <div className={`hidden lg:flex fixed right-4 sm:right-6 xl:right-10 2xl:right-14 top-1/2 -translate-y-1/2 z-[120] flex-col items-center gap-3 transition-all duration-500 ${location.pathname === '/territorios' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'}`}>
                <div className={`w-[54px] flex flex-col items-center gap-2 p-2 rounded-xl border-2 shadow-xl backdrop-blur-xl ${darkMode ? 'bg-gray-900/95 border-gov-cyan/60 shadow-gov-cyan/10' : 'bg-white/95 border-gov-cyan shadow-gov-cyan/15'}`}>
                    <Link to="/" className={`p-2.5 rounded-lg transition-colors flex items-center justify-center ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-blue-400' : 'text-gray-500 hover:bg-gray-100 hover:text-gov-cyan'}`} title="Início">
                        <Home size={18} strokeWidth={2.5} />
                    </Link>
                    <div className={`w-6 h-[1px] ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200'}`}></div>
                    <Link to="/sobre" className={`p-2.5 rounded-lg transition-colors flex items-center justify-center ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-blue-400' : 'text-gray-500 hover:bg-gray-100 hover:text-gov-cyan'}`} title="Sobre">
                        <Info size={18} strokeWidth={2.5} />
                    </Link>
                </div>

                <div data-tutorial="sidebar" ref={sideFilterRef} className={`w-[54px] relative flex flex-col items-center gap-2 p-2 rounded-xl border-2 shadow-xl backdrop-blur-xl ${darkMode ? 'bg-gray-900/95 border-gov-cyan/60 shadow-gov-cyan/10' : 'bg-white/95 border-gov-cyan shadow-gov-cyan/15'}`}>
                    <div className="relative flex items-center justify-center w-full" ref={searchDropdownRef}>
                        <div data-tutorial="search-input" className={`absolute right-[115%] transition-all duration-300 ${isVerticalSearchOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
                            <input
                                type="text"
                                placeholder="Buscar no painel..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                                className={`w-full h-10 px-4 rounded-lg text-[11px] font-medium outline-none border shadow-2xl backdrop-blur-xl transition-all ${darkMode ? 'bg-gray-900/95 border-gray-700 text-white focus:border-gov-blue' : 'bg-white/95 border-gray-200 text-gray-800 focus:border-gov-cyan'}`}
                            />
                            {isDropdownOpen && searchTerm && isVerticalSearchOpen && (
                                <div className={`absolute left-0 top-full mt-2 w-full max-h-64 overflow-y-auto hide-scroll rounded-lg border shadow-2xl z-[200] backdrop-blur-2xl ${darkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'}`}>
                                    {filteredOptions.length > 0 ? (
                                        <div className="flex flex-col p-1.5 gap-0.5">
                                            {filteredOptions.map((opt, i) => (
                                                <button key={i} onClick={() => { setSearchTerm(opt.matchText); setIsDropdownOpen(false); if (opt.matchType === 'Território') setSelectedLocation(opt); else setSelectedLocation(null); }} className={`w-full text-left px-3 py-2 rounded-md text-[11px] transition-colors flex flex-col ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}>
                                                    <span className="font-bold truncate">{opt.matchText}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${darkMode ? 'text-blue-400' : 'text-gov-blue'}`}> {opt.matchType} <span className="opacity-50 text-gray-500 ml-1">em {opt.nome}</span> </span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (<div className={`p-4 text-center text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhum resultado encontrado.</div>)}
                                </div>
                            )}
                        </div>
                        <button data-tutorial="search-button" onClick={() => setIsVerticalSearchOpen(!isVerticalSearchOpen)} className={`p-2.5 rounded-lg transition-colors flex items-center justify-center ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-blue-400' : 'text-gray-500 hover:bg-gray-100 hover:text-gov-cyan'} ${isVerticalSearchOpen ? (darkMode ? 'bg-gov-blue/20 text-blue-400' : 'bg-gov-cyan/15 text-gov-cyan') : ''}`} title="Pesquisar">
                            <Search size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className={`w-6 h-[1px] ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200'}`}></div>

                    <button onClick={resetGlobalFilters} className={`p-2.5 rounded-lg transition-colors flex items-center justify-center ${hasActiveFilters ? (darkMode ? 'text-gov-red bg-gov-red/10 hover:bg-gov-red/20' : 'text-gov-red bg-gov-red/10 hover:bg-gov-red/20') : (darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800')}`} title="Limpar todos os filtros">
                        <Eraser size={18} strokeWidth={2.5} />
                    </button>

                    <div className={`w-6 h-[1px] ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200'}`}></div>

                    <button onClick={() => carregarDadosDoSharePoint(true)} disabled={isLoadingPipeline} className={`p-2.5 rounded-lg transition-colors flex items-center justify-center ${isLoadingPipeline ? 'opacity-50 cursor-not-allowed animate-pulse' : ''} ${darkMode ? 'text-gray-400 hover:bg-gov-green/20 hover:text-green-400' : 'text-gray-500 hover:bg-gov-green/10 hover:text-gov-green-dark'}`} title="Sincronizar Dados">
                        <RefreshCw size={18} strokeWidth={2.5} className={isLoadingPipeline ? "animate-spin" : ""} />
                    </button>

                    <div className={`w-6 h-[1px] ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200'}`}></div>

                    <ReportExportMenu
                        territoriosData={territoriosData}
                        filtros={reportFiltros}
                        darkMode={darkMode}
                        variant="nav"
                        className={isLoadingPipeline ? 'opacity-50 cursor-not-allowed' : ''}
                    />

                    <div className={`w-6 h-[1px] ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200'}`}></div>


                    <button data-tutorial="filter-button" onClick={() => setIsSideFilterOpen(!isSideFilterOpen)} className={`py-4 px-2.5 rounded-lg flex flex-col items-center gap-3 transition-all ${isSideFilterOpen ? (darkMode ? 'bg-gov-blue text-white shadow-md' : 'bg-gov-cyan text-white shadow-md font-black') : (darkMode ? 'text-blue-400 hover:bg-gray-800 hover:text-blue-300' : 'text-gray-600 hover:bg-gray-100 hover:text-gov-cyan font-bold')}`} title="Filtros Avançados">
                        <div className="relative">
                            <Filter size={18} strokeWidth={2.5} />
                            {hasActiveFilters && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-gov-yellow rounded-full border border-white dark:border-gray-900" title="Filtros ativos"></span>
                            )}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Filtros</span>
                    </button>

                    {isSideFilterOpen && (
                        <div data-tutorial="filters-panel" className={`fixed inset-x-4 bottom-4 lg:absolute lg:inset-auto lg:right-[125%] lg:bottom-0 lg:w-72 max-h-[80vh] overflow-y-auto lg:max-h-auto rounded-2xl p-5 shadow-2xl border flex flex-col gap-4 backdrop-blur-2xl animate-soft-fade z-[250] ${darkMode ? 'bg-gray-900/95 border-gray-700 text-gray-200' : 'bg-white/95 border-gray-200 text-gray-800'}`}>
                            {/* Botão Fechar Modal Mobile */}
                            <button onClick={() => setIsSideFilterOpen(false)} className={`lg:hidden absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div>
                                <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Recorte Geográfico</span>
                                <button onClick={() => { setFiltroSemiarido(!filtroSemiarido); }} className={`w-full h-9 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${filtroSemiarido ? 'bg-gov-yellow border-yellow-600 text-white hover:bg-yellow-600' : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}`}>
                                    {filtroSemiarido ? 'Semiárido: Ativo' : 'Ativar Semiárido'}
                                </button>
                            </div>
                            <div>
                                <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">Intervalo D. Territ. (IFDM)</span>
                                <div className="flex gap-2 items-center">
                                    <input type="number" step="0.001" placeholder="Mín" value={ifdmMin} onChange={(e) => setIfdmMin(e.target.value)} className={`w-full h-8 px-2 rounded-md text-[11px] outline-none border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                                    <span className="text-[10px] opacity-40">até</span>
                                    <input type="number" step="0.001" placeholder="Máx" value={ifdmMax} onChange={(e) => setIfdmMax(e.target.value)} className={`w-full h-8 px-2 rounded-md text-[11px] outline-none border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                                </div>
                            </div>
                            <div>
                                <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">Filtrar Ativos de CTI</span>
                                <div className="max-h-32 overflow-y-auto hide-scroll flex flex-col gap-1.5 border p-2 rounded-lg border-gray-500/20">
                                    <label className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer border-b border-gray-500/10 pb-1.5 mb-1">
                                        <input type="checkbox" checked={areAllCtiSelected} onChange={handleToggleAllCti} className="rounded border-gray-300 text-gov-blue focus:ring-gov-blue h-3 w-3" />
                                        <span className={`font-bold ${areAllCtiSelected ? 'opacity-100' : 'opacity-50'}`}>Todos</span>
                                    </label>
                                    {[
                                        { id: 'campiUniversidadePublica', label: 'Campi Universidade Pública' }, { id: 'campiUniversidadePrivada', label: 'Campi Universidade Privada' }, { id: 'campiInstitutoFederal', label: 'Campi Institutos Federais' },
                                        { id: 'icts', label: 'ICTs' }, { id: 'centrosPesquisa', label: 'Centros de Pesquisa' },
                                        { id: 'espacoDinamizadoress', label: 'Espaços Dinamizadores' }, { id: 'parquesTecnologicos', label: 'Parques Tecnológicos' },
                                        { id: 'incubadorasAceleradoras', label: 'Incubadoras & Aceleradoras' }
                                    ].map((f) => (
                                        <label key={f.id} className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer pl-1">
                                            <input type="checkbox" checked={ctiFilters[f.id]} onChange={() => toggleCtiFilter(f.id)} className="rounded border-gray-300 text-gov-blue focus:ring-gov-blue h-3 w-3" />
                                            <span className={ctiFilters[f.id] ? 'opacity-100' : 'opacity-40'}>{f.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="block text-[9px] font-black uppercase tracking-widest opacity-60">Filtrar Cadeias Produtivas</span>
                                    {cadeiaProdutivaFilter.length > 0 && (
                                        <button
                                            onClick={() => setCadeiaProdutivaFilter([])}
                                            className={`text-[9px] font-bold text-gov-red hover:underline opacity-80 hover:opacity-100 transition-opacity`}
                                        >
                                            Limpar ({cadeiaProdutivaFilter.length})
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <div className="relative w-full">
                                        <input
                                            type="text"
                                            placeholder="Buscar segmento..."
                                            value={sidebarCadeiaSearch}
                                            onChange={(e) => setSidebarCadeiaSearch(e.target.value)}
                                            className={`w-full h-8 pl-8 pr-7 rounded-lg text-[10px] font-medium transition-all outline-none border ${darkMode ? 'bg-gray-800/80 border-gray-700 text-gray-200 focus:border-emerald-500' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-emerald-600'}`}
                                        />
                                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        {sidebarCadeiaSearch && (
                                            <button onClick={() => setSidebarCadeiaSearch('')} aria-label="Limpar pesquisa" className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:text-gov-red text-gray-400 transition-colors">
                                                <Eraser size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-60 overflow-y-auto hide-scroll flex flex-col gap-2.5 border p-2.5 rounded-xl border-gray-500/20 bg-gray-500/5">
                                        {['APL', 'IG'].map(tipo => {
                                            const allSubSegments = todasAsCadeiasPorTipo[tipo] || [];
                                            const searchNorm = normalize(sidebarCadeiaSearch);
                                            const filteredSubSegments = searchNorm
                                                ? allSubSegments.filter(seg => normalize(seg).includes(searchNorm))
                                                : allSubSegments;
                                            const subKeys = filteredSubSegments.map(s => `${tipo}__${s}`);
                                            const isParentSelected = cadeiaProdutivaFilter.includes(tipo);
                                            const isSomeSubSelected = subKeys.some(k => cadeiaProdutivaFilter.includes(k));
                                            const allSubKeys = allSubSegments.map(s => `${tipo}__${s}`);
                                            const isAllSubSelected = allSubSegments.length > 0 && allSubKeys.every(k => cadeiaProdutivaFilter.includes(k));
                                            const isExpanded = expandedSidebarCadeia[tipo] || false;
                                            const LIMIT = 3;
                                            const visibleSegments = (searchNorm || isExpanded) ? filteredSubSegments : filteredSubSegments.slice(0, LIMIT);
                                            const hasMore = !searchNorm && filteredSubSegments.length > LIMIT;

                                            if (searchNorm && filteredSubSegments.length === 0) return null;

                                            return (
                                                <div key={tipo} className={`flex flex-col gap-1.5 p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800/40 border border-gray-700/50' : 'bg-white border border-gray-100 shadow-xs'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <label className="flex items-center gap-2 text-[11px] font-black cursor-pointer select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={isParentSelected || isAllSubSelected}
                                                                onChange={() => handleCadeiaParentToggle(tipo)}
                                                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 accent-emerald-600 cursor-pointer"
                                                            />
                                                            <span className={isParentSelected || isSomeSubSelected ? (darkMode ? 'text-emerald-400 font-extrabold' : 'text-emerald-700 font-extrabold') : (darkMode ? 'text-gray-200' : 'text-gray-800')}>
                                                                {tipo}
                                                            </span>
                                                        </label>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'}`}>
                                                            {filteredSubSegments.length}
                                                        </span>
                                                    </div>
                                                    {filteredSubSegments.length > 0 && (
                                                        <div className="pl-3.5 flex flex-col gap-0.5 border-l-2 border-emerald-500/30 ml-1.5 mt-0.5">
                                                            {visibleSegments.map(seg => {
                                                                const key = `${tipo}__${seg}`;
                                                                const isSubChecked = isParentSelected || cadeiaProdutivaFilter.includes(key);
                                                                return (
                                                                    <label key={seg} className={`flex items-center gap-2 text-[10px] font-medium cursor-pointer select-none px-2 py-1 rounded-md transition-all ${isSubChecked ? (darkMode ? 'bg-emerald-950/40 text-emerald-300 font-semibold' : 'bg-emerald-50 text-emerald-900 font-semibold') : (darkMode ? 'hover:bg-gray-700/40 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}`}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSubChecked}
                                                                            onChange={() => handleCadeiaSubToggle(tipo, seg)}
                                                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3 w-3 accent-emerald-600 cursor-pointer"
                                                                        />
                                                                        <span className="truncate">{seg}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                            {hasMore && (
                                                                <button
                                                                    onClick={() => setExpandedSidebarCadeia(prev => ({ ...prev, [tipo]: !prev[tipo] }))}
                                                                    className={`w-full py-1 mt-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-1 ${darkMode ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}
                                                                >
                                                                    {isExpanded ? '▲ Ver menos' : `▼ Ver mais (${filteredSubSegments.length - LIMIT})`}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            <main className={`flex-1 overflow-y-auto relative w-full z-10 ${location.pathname === '/' ? '' : 'pt-4'}`}>
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-3 animate-pulse">
                        <RefreshCw className={`w-8 h-8 animate-spin ${darkMode ? 'text-blue-400' : 'text-gov-blue'}`} />
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Carregando módulo...
                        </span>
                    </div>
                }>
                    <Routes>
                        <Route path="/" element={<div className="animate-soft-fade h-full"><LandingHero onAccessDashboard={() => navigate('/territorios')} territoriosData={territoriosData} darkMode={darkMode} /></div>} />
                        <Route path="/sobre" element={<SobrePage darkMode={darkMode} territoriosData={territoriosData} />} />

                        <Route path="/territorios" element={
                            <div className="animate-soft-fade relative p-2 lg:p-0 w-[96%] max-w-[1600px] mx-auto min-h-full">
                                <div className={`${themeClasses.glass} rounded-2xl p-4 lg:p-6 flex flex-col gap-4 mt-6`}>

                                    {/* KPIs GLOBAIS */}
                                    <KpiSection
                                        darkMode={darkMode}
                                        selectedLocation={selectedLocation}
                                        filtroSemiarido={filtroSemiarido}
                                        lastUpdate={lastUpdate}
                                        dashboardData={dashboardData}
                                        onOpenExpandedList={(type) => setExpandedLists([type])}
                                    />

                                    {/* A "Ilha" Encaixada na tela */}
                                    <div className="flex flex-col lg:flex-row gap-4 items-stretch h-auto lg:h-[calc(100vh-180px)] lg:min-h-[500px] w-full mt-4 mb-3">

                                        {/* PAINEL VERTICAL DE KPIS (coluna da esquerda) */}
                                        <SubKpiPanel
                                            darkMode={darkMode}
                                            selectedLocation={selectedLocation}
                                            dashboardData={dashboardData}
                                            ctiFilters={ctiFilters}
                                            setCtiFilters={setCtiFilters}
                                            isCtiFilterActive={isCtiFilterActive}
                                            setIsCtiFilterActive={setIsCtiFilterActive}
                                        />

                                        {/* COLUNA DO MAPA (40%) */}
                                        <MapSection
                                            mapSectionRef={mapSectionRef}
                                            darkMode={darkMode}
                                            territoriosData={territoriosData}
                                            territoriesDynamicStats={territoriesDynamicStats}
                                            filtroSemiarido={filtroSemiarido}
                                            selectedLocation={selectedLocation}
                                            semiaridoMunicipios={semiaridoMunicipios}
                                            handleSelectTerritory={handleSelectTerritory}
                                            dashboardData={dashboardData}
                                            ctiFilters={ctiFilters}
                                        />

                                        {/* COLUNA DAS LISTAS (60%) */}
                                        <ListSection
                                            darkMode={darkMode}
                                            dashboardData={dashboardData}
                                            cursosFiltrados={cursosFiltrados}
                                            cursoSearchTerm={cursoSearchTerm}
                                            setCursoSearchTerm={setCursoSearchTerm}
                                            areaGeralSummary={areaGeralSummary}
                                            areaGeralFilter={areaGeralFilter}
                                            setAreaGeralFilter={setAreaGeralFilter}
                                            handleAreaGeralToggle={handleAreaGeralToggle}
                                            expandedLists={expandedLists}
                                            setExpandedLists={setExpandedLists}
                                            fixWeirdCapitalization={fixWeirdCapitalization}
                                            formatEntidadeTipo={formatEntidadeTipo}
                                            getCtiBadgeStyle={getCtiBadgeStyle}
                                            getBadgeStyle={getBadgeStyle}
                                            getAreaStyles={getAreaStyles}
                                            getAreaInfo={getAreaInfo}
                                            setExpandedCti={setExpandedCti}
                                            setExpandedCadeia={setExpandedCadeia}
                                            setExpandedCourse={setExpandedCourse}
                                            isAreaGeralOpen={isAreaGeralOpen}
                                            setIsAreaGeralOpen={setIsAreaGeralOpen}
                                            areaGeralRef={areaGeralRef}
                                        />
                                    </div>
                                </div>
                            </div>
                        } />

                    </Routes>
                </Suspense>
            </main>

            {/* BOTÃO FLUTUANTE TUTORIAL */}
            {location.pathname === '/territorios' && (
                <button
                    onClick={() => setIsTutorialOpen(true)}
                    className="fixed bottom-6 right-4 sm:right-6 xl:right-10 2xl:right-14 z-[100] w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform hover:scale-110 bg-gov-blue text-white hover:bg-gov-blue-dark"
                    title="Tutorial de uso"
                >
                    <HelpCircle size={26} strokeWidth={2.5} />
                </button>
            )}

            {/* TUTORIAL OVERLAY */}
            <Suspense fallback={null}>
                <Tutorial
                    isOpen={isTutorialOpen}
                    onClose={handleCloseTutorial}
                    darkMode={darkMode}
                    onDeselectLocation={() => setSelectedLocation(null)}
                    onOpenExpandedList={() => setExpandedLists(['cti'])}
                    onOpenAddListDropdown={() => setIsModalAddListOpen(true)}
                    onCloseAddListDropdown={() => setIsModalAddListOpen(false)}
                    onForceAddList={() => setExpandedLists(prev => prev.length < 2 ? ['cti', 'cadeias'] : prev)}
                    onOpenSearch={() => setIsVerticalSearchOpen(true)}
                    onOpenFilters={() => setIsSideFilterOpen(true)}
                    onCloseDetails={() => {
                        setExpandedCourse(null);
                        setExpandedCadeia(null);
                        setExpandedCti(null);
                        setExpandedLists([]);
                        setIsSideFilterOpen(false);
                        setIsVerticalSearchOpen(false);
                    }}
                />
            </Suspense>

            {/* Contêiner offscreen com layout fixo (em px) para captura pelo html2canvas (PNG/PDF) */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', zIndex: -1 }}>
                <StackedBarCursosMunicipios
                    id="report-image-cursos"
                    heatmapData={reportHeatmapData}
                    subtitle={selectedLocation ? `Distribuição de Cursos — ${selectedLocation.nome || selectedLocation.territory}` : "Distribuição de Cursos por Território fatiada por Área Geral do Conhecimento"}
                />
                <MapaNumeradoMunicipios
                    id="report-image-univ_publicas"
                    municipiosList={reportUnivPublicasList}
                    title="Universidades Públicas na Bahia"
                    subtitle={selectedLocation ? `Relatório Agregado — ${selectedLocation.nome || selectedLocation.territory}` : "Ensino Superior Público no Estado da Bahia"}
                />
                <MapaNumeradoMunicipios
                    id="report-image-univ_privadas"
                    municipiosList={reportUnivPrivadasList}
                    title="Universidades Privadas na Bahia"
                    subtitle={selectedLocation ? `Relatório Agregado — ${selectedLocation.nome || selectedLocation.territory}` : "Ensino Superior Privado no Estado da Bahia"}
                />
                <MapaCadeiasProdutivas
                    id="report-image-cadeias"
                    cadeiasList={reportCadeiasList}
                    subtitle={selectedLocation ? `Relatório Agregado — ${selectedLocation.nome || selectedLocation.territory}` : "Mapeamento de Sedes e Municípios de Influência na Bahia"}
                />
                <MapaNumeradoMunicipios
                    id="report-image-ativos_cti"
                    municipiosList={reportAtivosCtiList}
                    title="Ativos de CT&I na Bahia"
                    subtitle={selectedLocation ? `Relatório Agregado — ${selectedLocation.nome || selectedLocation.territory}` : "Infraestrutura de Pesquisa, Inovação e Empreendedorismo"}
                />
            </div>
        </div>
    );
}

export default function AppWrapper() {
    return (
        <HelmetProvider>
            <Router>
                <DataProvider>
                    <MainApp />
                </DataProvider>
            </Router>
        </HelmetProvider>
    );
}