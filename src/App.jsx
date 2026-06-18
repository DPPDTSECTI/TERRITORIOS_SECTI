import { Helmet, HelmetProvider } from 'react-helmet-async';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import ConectaMap from "../ConectaMap"; 
import LandingHero from './components/hero';
import territoriosMunicipios from '../utils/territorioMunicipios.json'; 
import ChatBot from './components/ChatBot';

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
// COMPONENTE: PÁGINA SOBRE
// ==========================================
const SobrePage = ({ darkMode }) => (
  <div className="animate-soft-fade relative p-4 max-w-4xl mx-auto w-full min-h-full flex flex-col justify-start">
    <div className={`backdrop-blur-2xl rounded-[2rem] border shadow-2xl p-8 lg:p-12 mb-8 transition-all duration-500 ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-white/60'}`}>
      <h2 className="text-3xl lg:text-4xl font-black mb-8 tracking-tighter">Sobre o Painel SECTI Territórios</h2>
      <div className={`prose prose-sm sm:prose-base max-w-none ${darkMode ? 'prose-invert text-slate-300' : 'prose-slate text-slate-600'}`}>
        
        <h3 className="text-gov-blueDark-500 dark:text-blue-400 font-black uppercase tracking-[0.2em] text-xs mb-4 mt-8 border-b border-slate-200/20 pb-2">1. Visão Geral do Sistema</h3>
        <p className="leading-relaxed mb-4">O Painel SECTI Territórios é uma plataforma de inteligência geográfica concebida para subsidiar a formulação e o acompanhamento de políticas públicas de Ciência, Tecnologia e Inovação (CT&I) no Estado da Bahia.</p>
        <p className="leading-relaxed mb-8">Através da consolidação de dados territorializados, o sistema integra informações referentes a capacidades institucionais, desenvolvimento socioeconómico, cadeias produtivas e assistência pública. A plataforma proporciona aos gestores e investigadores uma base analítica rigorosa sobre as vocações e características dos 27 Territórios de Identidade da Bahia.</p>

        <h3 className="text-gov-blueDark-500 dark:text-blue-400 font-black uppercase tracking-[0.2em] text-xs mb-6 mt-10 border-b border-slate-200/20 pb-2">2. Definições e Indicadores (KPIs)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[
            { t: 'Capacidade em CT&I', d: 'Quantitativo de infraestruturas mapeadas, englobando Universidades (Federais e Estaduais), Institutos Federais, Centros de Pesquisa, ICTs, Espaços Dinamizadores, Parques Tecnológicos e Incubadoras.' },
            { t: 'Desenvolvimento Territorial', d: 'Baseado no Índice FIRJAN (IFDM) de 2023. O valor do índice é adotado sob uma perspectiva territorial, calculando a média ponderada dos municípios que constituem os respectivos territórios de identidade da Bahia. O índice é composto por variáveis relacionadas às condições de Emprego e Renda, Saúde e Educação dos municípios.' },
            { t: 'Assistência Pública em CT&I', d: 'Identifica a presença de ações de suporte estatal à população, contando este piloto com a infraestrutura relativa ao Programa Conecta Bahia que tem como finalidade ampliar o acesso à internet em áreas rurais do estado.' },
            { t: 'APLs e IGs', d: 'Mapeamento de Arranjos Produtivos Locais (aglomerações de cooperação económica) e Indicações Geográficas (certificações de produtos inerentes à sua origem territorial).' }
          ].map((item, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border transition-transform hover:-translate-y-1 duration-300 ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200/60'}`}>
              <span className={`block font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.t}</span>
              <span className="text-[11px] leading-relaxed opacity-80">{item.d}</span>
            </div>
          ))}
        </div>

        <h3 className="text-gov-blueDark-500 dark:text-blue-400 font-black uppercase tracking-[0.2em] text-xs mb-6 mt-10 border-b border-slate-200/20 pb-2">3. Guia de Funcionalidades</h3>
        <ul className="space-y-6">
          {[
            { t: 'Filtro do Semiárido Baiano', d: 'A ativação do "Recorte Semiárido" isola estritamente os dados do polígono correspondente ao semiárido.', i: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', c: 'text-orange-500 bg-orange-500/10' },
            { t: 'Exportação para Business Intelligence', d: 'A plataforma disponibiliza a extração integral dos dados. A exportação gera um ficheiro em formato Excel (.xlsx), estruturado em quatro abas relacionais, preparado para análises estatísticas externas.', i: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', c: 'text-purple-500 bg-purple-500/10' }
          ].map((func, idx) => (
            <li key={idx} className="flex gap-4 items-start">
              <div className={`p-2.5 rounded-xl shrink-0 ${func.c}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={func.i}/></svg></div>
              <div>
                <strong className={`block text-sm mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{func.t}</strong>
                <span className="text-[11px] opacity-80 leading-relaxed">{func.d}</span>
              </div>
            </li>
          ))}
        </ul>

      </div>
    </div>
  </div>
);

// ==========================================
// COMPONENTE PRINCIPAL DO APP
// ==========================================
function MainApp() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados Básicos
  const [territoriosData, setTerritoriosData] = useState([]);
  const [semiaridoMunicipios, setSemiaridoMunicipios] = useState([]); 
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("Atualizando...");
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
  const [semiMunsMin, setSemiMunsMin] = useState('');
  const [semiMunsMax, setSemiMunsMax] = useState('');

  // CORREÇÃO CRÍTICA: 'parks' corrigido para 'parques' para bater com o ID gerado na listagem
  const [ctiFilters, setCtiFilters] = useState({
      univs: true, ifs: true, icts: true, centrosPesquisa: true, espacos: true, parques: true, incubadoras: true
  });

  const dropdownRef = useRef(null);
  const filterPanelRef = useRef(null);
  const scrollMunsRef = useRef(null);
  const areaGeralRef = useRef(null);
  const mapSectionRef = useRef(null);

  // Pipeline de Dados
  const carregarDadosDoSharePoint = async (forcarRefresh = false) => {
    setIsLoadingPipeline(true);
    try {
      const isDev = import.meta.env.DEV;
      let url = isDev ? (forcarRefresh ? '/api/sharepoint?nocache=true' : '/api/sharepoint') : '/dados.json';
      let response = await fetch(url);
      if (!response.ok && !isDev) response = await fetch('/api/sharepoint');
      if (!response.ok) throw new Error('Falha ao comunicar com a base de dados');
      
      const data = await response.json();
      const semiaridoNormList = (data.semiaridoMunicipiosList || []).map(m => normalize(m));

      const territoriosFormatados = data.territories.map((t, index) => {
        const territorioBase = territoriosMunicipios.territorios_de_identidade.find((tb) => normalize(tb.nome) === normalize(t.territory));
        let trueQtdSemi = 0;
        if (territorioBase) {
            territorioBase.municipios.forEach(m => { if (semiaridoNormList.includes(normalize(m))) trueQtdSemi++; });
        }
        const trueTotalMuns = territorioBase ? territorioBase.municipios.length : 0;
        const truePctSemiarido = trueTotalMuns > 0 ? (trueQtdSemi / trueTotalMuns) * 100 : 0;
        const trueIsSemiarido = trueQtdSemi > 0;
        const entidadesCTI = Array.isArray(t.capacidadeDetalhada) ? t.capacidadeDetalhada : [];
        const cadeiasAPL = Array.isArray(t.cadeiasProdutivasDetalhado) ? t.cadeiasProdutivasDetalhado : [];
        const cursosEnsino = Array.isArray(t.cursosDetalhado) ? t.cursosDetalhado : [];

        return {
          id: String(index + 1), nome: t.territory || "Desconhecido", tipo: 'Território', regiao: t.territory || "",
          isSemiarido: trueIsSemiarido, pctSemiarido: truePctSemiarido, qtdSemiarido: trueQtdSemi,
          entidadesDetalhadas: entidadesCTI, cadeiasProdutivasDetalhado: cadeiasAPL,
          desenvolvimentoDetalhado: Array.isArray(t.desenvolvimentoDetalhado) ? t.desenvolvimentoDetalhado : [],
          cursosDetalhado: cursosEnsino,
          assistenciaPublica: t.assistenciaPublica || { iniciativas: [] },
          desenvolvimento: t.desenvolvimento || { ifdmTi: 0, populacaoTotal: 0 },
          kpis: {
            capacidadeCti: String(entidadesCTI.length), ifdm: t.desenvolvimento?.ifdmTi ? Number(t.desenvolvimento.ifdmTi).toFixed(3) : "-",
            conectaBahia: t.assistenciaPublica?.existe ? "Presente" : "Não mapeado", cadeiasIgs: String(cadeiasAPL.length),
            coberturaSemiarido: trueIsSemiarido ? (truePctSemiarido >= 100 ? "Pertencente" : "") : "Exterior"
          }
        };
      });

      setTerritoriosData(territoriosFormatados);
      setSemiaridoMunicipios(semiaridoNormList); 
      setLastUpdate(new Date(data.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error("[Painel] Erro fatal:", error); setLastUpdate("Erro na Sincronização");
    } finally { setIsLoadingPipeline(false); }
  };

  useEffect(() => { carregarDadosDoSharePoint(); }, []);
  useEffect(() => {
    function handleClickOutside(event) { 
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false); 
        if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) setIsFilterOpen(false);
        if (areaGeralRef.current && !areaGeralRef.current.contains(event.target)) setIsAreaGeralOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Efeito para rolar a tela e focar no mapa quando uma região é selecionada
  useEffect(() => {
    if (selectedLocation && mapSectionRef.current) {
      // Pequeno delay para garantir que a animação de zoom do mapa já iniciou
      setTimeout(() => {
        mapSectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 150);
    }
  }, [selectedLocation]);

  const isMunValid = (munName) => {
      if (!munName) return false;
      if (filtroSemiarido && !semiaridoMunicipios.includes(normalize(munName))) return false;
      return true;
  };

  // Motor de Busca Avançado com cruzamento total de intervalos e CTI
  const filteredOptions = useMemo(() => {
    const rawTerm = normalize(debouncedSearchTerm); const terms = rawTerm.split(' ').filter(Boolean);
    const results = [];
    territoriosData.forEach(t => {
        if (filtroSemiarido && !t.isSemiarido) return;
        
        // Cruzamento de intervalos numéricos na listagem de busca
        const ifdmVal = t.desenvolvimento?.ifdmTi ? Number(t.desenvolvimento.ifdmTi) : 0;
        const qtdSemiVal = t.qtdSemiarido || 0;
        if (ifdmMin !== '' && ifdmVal < Number(ifdmMin)) return;
        if (ifdmMax !== '' && ifdmVal > Number(ifdmMax)) return;
        if (semiMunsMin !== '' && qtdSemiVal < Number(semiMunsMin)) return;
        if (semiMunsMax !== '' && qtdSemiVal > Number(semiMunsMax)) return;

        if (!rawTerm) { results.push({ ...t, matchType: 'Território', matchText: t.regiao }); return; }
        
        let matched = false; let foundMunMatch = null; let foundEntMatch = null; let foundCadeiaMatch = null; let foundCursoMatch = null;
        const territorioBase = territoriosMunicipios.territorios_de_identidade.find((tb) => normalize(tb.nome) === normalize(t.nome));

        if (territorioBase) {
            const foundMun = territorioBase.municipios.find(m => {
                const searchString = normalize(m);
                return terms.every(term => searchString.includes(term));
            });
            if (foundMun && isMunValid(foundMun)) { matched = true; foundMunMatch = foundMun; }
        }
        if (!matched && t.entidadesDetalhadas) {
            foundEntMatch = t.entidadesDetalhadas.find(ent => {
                 if (!isMunValid(ent.municipio) || (ent.categoria && !ctiFilters[ent.categoria])) return false;
                 const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)}`;
                 return terms.every(term => searchString.includes(term));
            });
            if (foundEntMatch) matched = true;
        }
        if (!matched && t.cadeiasProdutivasDetalhado) {
            foundCadeiaMatch = t.cadeiasProdutivasDetalhado.find(cad => {
                 if (!isMunValid(cad.sede || cad.municipioSatelite)) return false;
                 const searchString = `${normalize(cad.segmento)} ${normalize(cad.sede || '')} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')}`;
                 return terms.every(term => searchString.includes(term));
            });
            if (foundCadeiaMatch) matched = true;
        }
        if (!matched && t.cursosDetalhado) {
            foundCursoMatch = t.cursosDetalhado.find(curso => {
                 if (!isMunValid(curso.municipio)) return false;
                 const searchString = `${normalize(curso.curso)} ${normalize(curso.entidade)} ${normalize(curso.municipio)}`;
                 return terms.every(term => searchString.includes(term));
            });
            if (foundCursoMatch) matched = true;
        }

        if (foundMunMatch) results.push({ ...t, matchType: 'Município', matchText: foundMunMatch });
        else if (foundEntMatch) results.push({ ...t, matchType: terms.some(term => normalize(foundEntMatch.tipo).includes(term)) ? 'Tipo de Infraestrutura' : 'Entidade CT&I', matchText: foundEntMatch.entidade });
        else if (foundCadeiaMatch) results.push({ ...t, matchType: 'Cadeia Produtiva', matchText: foundCadeiaMatch.segmento });
        else if (foundCursoMatch) results.push({ ...t, matchType: 'Curso Superior', matchText: foundCursoMatch.curso });
        else if (terms.every(term => normalize(t.nome).includes(term))) results.push({ ...t, matchType: 'Território', matchText: t.regiao });
    });
    return results.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [debouncedSearchTerm, territoriosData, filtroSemiarido, semiaridoMunicipios, ifdmMin, ifdmMax, semiMunsMin, semiMunsMax, ctiFilters]);

  // Cálculos Dinâmicos do Mapa com suporte e cruzamento de CTI + Intervalos
  const territoriesDynamicStats = useMemo(() => {
      const stats = {}; const rawTerm = normalize(debouncedSearchTerm); const terms = rawTerm.split(' ').filter(Boolean);
      const cursoTerm = normalize(debouncedCursoSearchTerm);
      const isSearchTermATerritory = territoriosData.some(t => normalize(t.nome) === rawTerm);

      // NOVO: Verifica se o utilizador está ativamente a filtrar CTI ou Cursos
      const isCtiFiltered = Object.values(ctiFilters).some(v => !v);
      const isCursoFiltered = cursoTerm !== '' || areaGeralFilter.length > 0;

      territoriosData.forEach(t => {
          const ifdmVal = t.desenvolvimento?.ifdmTi ? Number(t.desenvolvimento.ifdmTi) : 0;
          const qtdSemiVal = t.qtdSemiarido || 0;
          
          let passesIntervals = true;
          if (ifdmMin !== '' && ifdmVal < Number(ifdmMin)) passesIntervals = false;
          if (ifdmMax !== '' && ifdmVal > Number(ifdmMax)) passesIntervals = false;
          if (semiMunsMin !== '' && qtdSemiVal < Number(semiMunsMin)) passesIntervals = false;
          if (semiMunsMax !== '' && qtdSemiVal > Number(semiMunsMax)) passesIntervals = false;

          let somaIfdmPop = 0; let somaPop = 0;
          if (t.desenvolvimentoDetalhado && t.desenvolvimentoDetalhado.length > 0) {
              t.desenvolvimentoDetalhado.forEach(m => {
                  if (isMunValid(m.municipio)) {
                      if (Number(m.ifdm) > 0 && Number(m.populacao) > 0) { somaIfdmPop += (Number(m.ifdm) * Number(m.populacao)); somaPop += Number(m.populacao); }
                  }
              });
          } else if (!filtroSemiarido && t.desenvolvimento?.ifdmTi) {
              somaIfdmPop = t.desenvolvimento.ifdmTi * t.desenvolvimento.populacaoTotal; somaPop = t.desenvolvimento.populacaoTotal;
          }
          
          // Filtragem cruzada de CTI aplicada ao mapa em tempo real
          const validCti = t.entidadesDetalhadas.filter(ent => {
              if (!isMunValid(ent.municipio) || (ent.categoria && !ctiFilters[ent.categoria])) return false;
              if (rawTerm && !isSearchTermATerritory) {
                  const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)}`;
                  if (!terms.every(term => searchString.includes(term))) return false;
              }
              return true;
          });
          const validCadeias = t.cadeiasProdutivasDetalhado.filter(cad => {
              if (!isMunValid(cad.sede || cad.municipioSatelite)) return false;
              if (rawTerm && !isSearchTermATerritory) {
                  const searchString = `${normalize(cad.segmento)} ${normalize(cad.sede || '')} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')}`;
                  if (!terms.every(term => searchString.includes(term))) return false;
              }
              return true;
          });
          const validCursos = (t.cursosDetalhado || []).filter(curso => {
              if (!isMunValid(curso.municipio)) return false;
              if (rawTerm && !isSearchTermATerritory) {
                  const searchString = `${normalize(curso.curso)} ${normalize(curso.entidade)} ${normalize(curso.municipio)}`;
                  if (!terms.every(term => searchString.includes(term))) return false;
              }
              if (cursoTerm && !normalize(curso.curso).includes(cursoTerm)) return false;
              if (areaGeralFilter.length > 0 && !areaGeralFilter.includes(curso.areaGeral || 'Não Informada')) return false;
              return true;
          });
          
          let matchesSearch = true;
          if (rawTerm) {
              const territorioBase = territoriosMunicipios.territorios_de_identidade.find(tb => normalize(tb.nome) === normalize(t.nome));
              const tMatches = terms.every(term => normalize(t.nome).includes(term));
              const mMatches = territorioBase && territorioBase.municipios.some(m => terms.every(term => normalize(m).includes(term)));
              matchesSearch = tMatches || mMatches || (!isSearchTermATerritory && (validCti.length > 0 || validCadeias.length > 0 || validCursos.length > 0));
          }

          let hasDataForFilters = true;
          if (isCtiFiltered && isCursoFiltered) {
              hasDataForFilters = validCti.length > 0 || validCursos.length > 0;
          } else if (isCtiFiltered) {
              hasDataForFilters = validCti.length > 0;
          } else if (isCursoFiltered) {
              hasDataForFilters = validCursos.length > 0;
          }

          const matchesFilters = passesIntervals && matchesSearch && hasDataForFilters;

          stats[normalize(t.nome)] = {
              ifdm: somaPop > 0 ? (somaIfdmPop / somaPop).toFixed(3) : "-",
              capacidadeCti: String(validCti.length), cadeiasIgs: String(validCadeias.length),
              pctSemiarido: t.pctSemiarido, 
              matchesFilters: matchesFilters // Enviado diretamente para o mapa colorir/apagar
          };
      });
      return stats;
  }, [territoriosData, filtroSemiarido, debouncedSearchTerm, semiaridoMunicipios, ifdmMin, ifdmMax, semiMunsMin, semiMunsMax, ctiFilters, areaGeralFilter, debouncedCursoSearchTerm]);

  // Consumo de Dados das Listas e KPIs de Painel com Cruzamento Total
  const dashboardData = useMemo(() => {
    let targetList = selectedLocation ? [selectedLocation] : territoriosData;
    const rawTerm = normalize(debouncedSearchTerm); const terms = rawTerm.split(' ').filter(Boolean);
    const isSearchTermATerritory = territoriosData.some(t => normalize(t.nome) === rawTerm);
    
    const kpisPanel = { univs: 0, ifs: 0, icts: 0, centrosPesquisa: 0, espacos: 0, parques: 0, incubadoras: 0 };
    const entidadesFlat = []; const aplIgsFlat = []; const cursosFlat = []; const assistenciasSet = new Map();
    const globalIds = new Set(); const globalCadeiasIds = new Set();
    let somaIfdmPop = 0; let somaPopulacao = 0; let totalAssistencia = 0;

    const unfiltKpisPanel = { univs: 0, ifs: 0, icts: 0, centrosPesquisa: 0, espacos: 0, parques: 0, incubadoras: 0 };
    const unfiltIds = new Set(); const unfiltCadeiasIds = new Set();
    let unfiltAsst = 0;

    const extrairSatelite = (cad) => {
        const val = cad.municipioSatelite || cad.municipiosSatelites || cad.satelite || cad.municipio_satelite || cad.municipios_satelites || cad.Satelite || cad.Satelites;
        if (!val || val === 'undefined' || val === 'null') return '';
        if (Array.isArray(val)) {
            return val.map(item => typeof item === 'object' ? (item.Title || item.nome || item.NOME || item.value || '') : item).filter(Boolean).join(', ').trim();
        }
        if (typeof val === 'object') return val.Title || val.nome || val.NOME || val.value || '';
        return String(val).trim();
    };

    targetList.forEach(t => {
        const ifdmVal = t.desenvolvimento?.ifdmTi ? Number(t.desenvolvimento.ifdmTi) : 0;
        const qtdSemiVal = t.qtdSemiarido || 0;
        if (ifdmMin !== '' && ifdmVal < Number(ifdmMin)) return;
        if (ifdmMax !== '' && ifdmVal > Number(ifdmMax)) return;
        if (semiMunsMin !== '' && qtdSemiVal < Number(semiMunsMin)) return;
        if (semiMunsMax !== '' && qtdSemiVal > Number(semiMunsMax)) return;

        t.entidadesDetalhadas.forEach(ent => {
            if (!ent.municipio) return;
            if (rawTerm && !isSearchTermATerritory) {
                const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)}`;
                if (!terms.every(term => searchString.includes(term))) return;
            }
            if (ent.id) {
                unfiltIds.add(ent.id);
                if (ent.categoria && unfiltKpisPanel[ent.categoria] !== undefined) unfiltKpisPanel[ent.categoria]++;
            }
        });
        
        t.cadeiasProdutivasDetalhado.forEach(cad => {
            const sateliteRobusto = extrairSatelite(cad);
            const sede = cad.sede || sateliteRobusto || 'Não informada';
            if (rawTerm && !isSearchTermATerritory) {
                const searchString = `${normalize(cad.segmento)} ${normalize(sede)} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')}`;
                if (!terms.every(term => searchString.includes(term))) return;
            }
            if (cad.id) unfiltCadeiasIds.add(cad.id);
        });
        
        if (t.assistenciaPublica?.existe) unfiltAsst++;

        if (filtroSemiarido && !t.isSemiarido) return;
        let validData = false;

        t.entidadesDetalhadas.forEach(ent => {
            if (!isMunValid(ent.municipio)) return;
            if (rawTerm && !isSearchTermATerritory) {
                const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)}`;
                if (!terms.every(term => searchString.includes(term))) return;
            }
            
            // FILTRAGEM CRUZADA DE ATIVOS CTI
            if (ent.categoria && !ctiFilters[ent.categoria]) return;

            validData = true; 
            entidadesFlat.push({ ...ent, territorioRef: t.nome });
            if (ent.id && !globalIds.has(ent.id)) {
                globalIds.add(ent.id); if (ent.categoria && kpisPanel[ent.categoria] !== undefined) kpisPanel[ent.categoria]++;
            }
        });
        
        t.cadeiasProdutivasDetalhado.forEach(cad => {
            const sateliteRobusto = extrairSatelite(cad);
            const sede = cad.sede || sateliteRobusto || 'Não informada';
            const perts = filtroSemiarido ? String(cad.municipiosPertencentes || '').split(/[,;\-]/).map(m => m.trim()).filter(m => isMunValid(m)) : String(cad.municipiosPertencentes || '').split(/[,;\-]/).map(m => m.trim()).filter(Boolean);
            if (filtroSemiarido && !isMunValid(sede) && perts.length === 0) return;
            if (rawTerm && !isSearchTermATerritory) {
                const searchString = `${normalize(cad.segmento)} ${normalize(sede)} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')}`;
                if (!terms.every(term => searchString.includes(term))) return;
            }
            validData = true;
            aplIgsFlat.push({ 
                id: cad.id || Math.random(), segmento: cad.segmento || 'Sem Segmento', entidade: cad.entidade, tipo: cad.tipo || 'N/A', 
                municipiosPertencentes: perts.join(', ') || sede, sede, territorioRef: t.nome, municipioSatelite: sateliteRobusto 
            });
            if (cad.id) globalCadeiasIds.add(cad.id);
        });

        (t.cursosDetalhado || []).forEach(curso => {
            if (!isMunValid(curso.municipio)) return;
            if (rawTerm && !isSearchTermATerritory) {
                const searchString = `${normalize(curso.curso)} ${normalize(curso.entidade)} ${normalize(curso.municipio)}`;
                if (!terms.every(term => searchString.includes(term))) return;
            }
            validData = true;
            cursosFlat.push({ ...curso, territorioRef: t.nome });
        });

        if (t.assistenciaPublica?.existe && (!filtroSemiarido || validData)) {
            totalAssistencia++;
            (t.assistenciaPublica.iniciativas || []).forEach(ini => assistenciasSet.set(`${ini}|${t.nome}`, { nome: ini, municipio: 'Território', territorioRef: t.nome }));
        }

        if (t.desenvolvimentoDetalhado && t.desenvolvimentoDetalhado.length > 0) {
            t.desenvolvimentoDetalhado.forEach(m => {
                if (isMunValid(m.municipio) && Number(m.ifdm) > 0) { somaIfdmPop += (Number(m.ifdm) * Number(m.populacao)); somaPopulacao += Number(m.populacao); }
            });
        } else if (!filtroSemiarido && t.desenvolvimento?.ifdmTi) {
            somaIfdmPop += (t.desenvolvimento.ifdmTi * t.desenvolvimento.populacaoTotal); somaPopulacao += t.desenvolvimento.populacaoTotal;
        }
    });

    const totalMunsEstado = territoriosMunicipios.territorios_de_identidade.reduce((acc, curr) => acc + curr.municipios.length, 0);
    const totalSemiEstado = semiaridoMunicipios.length;
    const ifdmValue = somaPopulacao > 0 ? (somaIfdmPop / somaPopulacao) : 0;

    let coberturaCalculada = "";
    let pctBarraSemi = 100;

    if (selectedLocation) {
        const tb = territoriosMunicipios.territorios_de_identidade.find(x => normalize(x.nome) === normalize(selectedLocation.nome));
        const totalMunTerr = tb ? tb.municipios.length : 0;
        const qtdSemiTerr = selectedLocation.qtdSemiarido || 0;
        const pctTerr = totalMunTerr > 0 ? (qtdSemiTerr / totalMunTerr) * 100 : 0;
        pctBarraSemi = pctTerr;

        if (filtroSemiarido) {
            coberturaCalculada = `${qtdSemiTerr}/${totalMunTerr} mun.`;
        } else {
            if (pctTerr >= 100) coberturaCalculada = `100% (${qtdSemiTerr} mun.)`;
            else if (pctTerr <= 0) coberturaCalculada = `0%`;
            else coberturaCalculada = `${pctTerr.toFixed(1)}% (${qtdSemiTerr} mun.)`;
        }
    } else {
        pctBarraSemi = 85.6; 
        if (filtroSemiarido) {
            coberturaCalculada = `${totalSemiEstado}/${totalMunsEstado} mun.`;
        } else {
            coberturaCalculada = `85.6% (${totalSemiEstado} mun.)`;
        }
    }

    const topKpisPct = {
        cti: unfiltIds.size > 0 ? (globalIds.size / unfiltIds.size) * 100 : 0,
        ifdm: ifdmValue * 100, 
        semiarido: pctBarraSemi,
        assistencia: unfiltAsst > 0 ? (totalAssistencia / unfiltAsst) * 100 : 0,
        cadeias: unfiltCadeiasIds.size > 0 ? (globalCadeiasIds.size / unfiltCadeiasIds.size) * 100 : 0
    };

    return { 
        topKpis: {
            capacidadeCti: String(globalIds.size), ifdm: somaPopulacao > 0 ? ifdmValue.toFixed(3) : "-",
            conectaBahia: (selectedLocation || filtroSemiarido) ? "Em levantamento" : `${totalAssistencia} Territórios`, cadeiasIgs: String(globalCadeiasIds.size), 
            coberturaSemiarido: coberturaCalculada
        }, 
        topKpisPct, subKpis: kpisPanel, unfiltSubKpis: unfiltKpisPanel,
        entidades: Array.from(new Map(entidadesFlat.map(item => [item.id, item])).values()).sort((a, b) => (a.municipio || "").localeCompare(b.municipio || "")), 
        aplIgs: Array.from(new Map(aplIgsFlat.map(item => [item.id, item])).values()).sort((a, b) => (a.segmento || "").localeCompare(b.segmento || "")), 
        cursos: Array.from(new Map(cursosFlat.map(item => [item.id || Math.random(), item])).values()).sort((a, b) => (a.curso || "").localeCompare(b.curso || "")),
        assistencias: Array.from(assistenciasSet.values()).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")) 
    };
  }, [selectedLocation, filtroSemiarido, territoriosData, semiaridoMunicipios, debouncedSearchTerm, ifdmMin, ifdmMax, semiMunsMin, semiMunsMax, ctiFilters]);

  const toggleCtiFilter = (key) => {
      setCtiFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
      setSemiMunsMin(''); setSemiMunsMax('');
      setFiltroSemiarido(false);
      // Corrigido para repor os parques corretamente
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
      
      if (norm.includes('agraria') || norm.includes('natureza')) theme = 'green';
      else if (norm.includes('biologica') || norm.includes('saude')) theme = 'cyan';
      else if (norm.includes('exata') || norm.includes('tecnologia')) theme = 'blueDark';
      else if (norm.includes('humana')) theme = 'orange';
      else if (norm.includes('sociai') || norm.includes('aplicada')) theme = 'magenta';
      else if (norm.includes('engenharia')) theme = 'red';
      else if (norm.includes('letra') || norm.includes('arte') || norm.includes('linguistica')) theme = 'yellow';

      const styles = {
          green: {
              dot: 'bg-gov-green-500', text: darkMode ? 'text-gov-green-400' : 'text-gov-green-700',
              activeBg: darkMode ? 'bg-gov-green-500/20 border-gov-green-500/50' : 'bg-gov-green-100 border-gov-green-200',
              countBg: darkMode ? 'bg-gov-green-500/30 text-gov-green-400' : 'bg-white text-gov-green-800'
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
          orange: {
              dot: 'bg-gov-orange-500', text: darkMode ? 'text-gov-orange-400' : 'text-gov-orange-700',
              activeBg: darkMode ? 'bg-gov-orange-500/20 border-gov-orange-500/50' : 'bg-gov-orange-100 border-gov-orange-200',
              countBg: darkMode ? 'bg-gov-orange-500/30 text-gov-orange-400' : 'bg-white text-gov-orange-800'
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
          default: {
              dot: 'bg-emerald-500', text: darkMode ? 'text-emerald-400' : 'text-emerald-700',
              activeBg: darkMode ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-emerald-50 border-emerald-200',
              countBg: darkMode ? 'bg-emerald-500/30 text-emerald-400' : 'bg-white text-emerald-800'
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
          .hide-scroll::-webkit-scrollbar-thumb { background: ${darkMode ? '#334155' : '#cbd5e1'}; border-radius: 4px; }
          .hide-scroll::-webkit-scrollbar-thumb { background-color: ${darkMode ? '#334155' : '#cbd5e1'}; border-radius: 10px; border: none; }
          .hide-scroll::-webkit-scrollbar-thumb { background-color: ${darkMode ? '#475569' : '#cbd5e1'}; border-radius: 10px; border: none; }
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

                        {/* BOTÃO E FILTRO FLUTUANTE AVANÇADO */}
                        <div className="w-full sm:w-auto pt-0 sm:pt-4 relative" ref={filterPanelRef}>
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterPanelOpen)} 
                                className={`w-full h-11 px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${isFilterPanelOpen ? 'bg-blue-600 border-blue-700 text-white' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                Filtros Avançados
                            </button>

                            {isFilterPanelOpen && (
                                <div className={`absolute left-0 lg:left-auto lg:right-0 top-[100%] mt-2 w-72 rounded-2xl p-4 shadow-2xl border z-[150] flex flex-col gap-4 backdrop-blur-2xl ${darkMode ? 'bg-slate-900/95 border-slate-700 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'}`}>
                                    <div>
                                        <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Recorte Geográfico</span>
                                        <button onClick={() => { setFiltroSemiarido(!filtroSemiarido); setSelectedLocation(null); setSearchTerm(''); }} className={`w-full h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${filtroSemiarido ? 'bg-orange-500 border-orange-600 text-white hover:bg-orange-600' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}`}>
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
                                        <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">Muns. no Semiárido (Qtd)</span>
                                        <div className="flex gap-2 items-center">
                                            <input type="number" placeholder="Mín" value={semiMunsMin} onChange={(e) => setSemiMunsMin(e.target.value)} className={`w-full h-8 px-2 rounded-lg text-[11px] outline-none border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
                                            <span className="text-[10px] opacity-40">até</span>
                                            <input type="number" placeholder="Máx" value={semiMunsMax} onChange={(e) => setSemiMunsMax(e.target.value)} className={`w-full h-8 px-2 rounded-lg text-[11px] outline-none border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
                                        </div>
                                    </div>

                                    <div>
                                        <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 mb-1.5">Filtrar Ativos de CTI</span>
                                        <div className="max-h-24 overflow-y-auto hide-scroll flex flex-col gap-1.5 border p-2 rounded-xl border-slate-500/20">
                                            {[
                                                { id: 'univs', label: 'Universidades' }, { id: 'ifs', label: 'Institutos Federais' },
                                                { id: 'icts', label: 'ICTs' }, { id: 'centrosPesquisa', label: 'Centros de Pesquisa' },
                                                { id: 'espacos', label: 'Espaços Dinamizadores' }, { id: 'parques', label: 'Parques Tecnológicos' },
                                                { id: 'incubadoras', label: 'Incubadoras' }
                                            ].map((f) => (
                                                <label key={f.id} className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer">
                                                    <input type="checkbox" checked={ctiFilters[f.id]} onChange={() => toggleCtiFilter(f.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3 w-3" />
                                                    <span className={ctiFilters[f.id] ? 'opacity-100' : 'opacity-40'}>{f.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <button onClick={resetAllFilters} className="w-full h-8 rounded-xl font-bold text-[9px] uppercase tracking-wider border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors">
                                        Resetar Filtros
                                    </button>
                                </div>
                            )}
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
                            { l: 'Assist. Pública CT&I', v: dashboardData.topKpis.conectaBahia, pct: dashboardData.topKpisPct.assistencia, c: darkMode ? 'text-cyan-400' : 'text-cyan-600', b: 'bg-cyan-500', tr: true },
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
                        { id: 'univs', l: 'Univs.', v: dashboardData.subKpis.univs, pct: dashboardData.unfiltSubKpis.univs > 0 ? (dashboardData.subKpis.univs / dashboardData.unfiltSubKpis.univs)*100 : 0, c: darkMode ? 'text-blue-400' : 'text-blue-600', b: 'bg-blue-500' },
                        { id: 'ifs', l: 'Inst. Fed.', v: dashboardData.subKpis.ifs, pct: dashboardData.unfiltSubKpis.ifs > 0 ? (dashboardData.subKpis.ifs / dashboardData.unfiltSubKpis.ifs)*100 : 0, c: darkMode ? 'text-red-400' : 'text-red-600', b: 'bg-red-500' },
                        { id: 'icts', l: 'ICTs', v: dashboardData.subKpis.icts, pct: dashboardData.unfiltSubKpis.icts > 0 ? (dashboardData.subKpis.icts / dashboardData.unfiltSubKpis.icts)*100 : 0, c: darkMode ? 'text-cyan-400' : 'text-cyan-600', b: 'bg-cyan-500' },
                        { id: 'centrosPesquisa', l: 'C. Pesquisa', v: dashboardData.subKpis.centrosPesquisa, pct: dashboardData.unfiltSubKpis.centrosPesquisa > 0 ? (dashboardData.subKpis.centrosPesquisa / dashboardData.unfiltSubKpis.centrosPesquisa)*100 : 0, c: darkMode ? 'text-emerald-400' : 'text-emerald-600', b: 'bg-emerald-500' },
                        { id: 'espacos', l: 'Espaços', v: dashboardData.subKpis.espacos, pct: dashboardData.unfiltSubKpis.espacos > 0 ? (dashboardData.subKpis.espacos / dashboardData.unfiltSubKpis.espacos)*100 : 0, c: darkMode ? 'text-indigo-400' : 'text-indigo-600', b: 'bg-indigo-500' },
                        { id: 'parques', l: 'Parques', v: dashboardData.subKpis.parques, pct: dashboardData.unfiltSubKpis.parques > 0 ? (dashboardData.subKpis.parques / dashboardData.unfiltSubKpis.parques)*100 : 0, c: darkMode ? 'text-fuchsia-400' : 'text-fuchsia-600', b: 'bg-fuchsia-500' },
                        { id: 'incubadoras', l: 'Incub.', v: dashboardData.subKpis.incubadoras, pct: dashboardData.unfiltSubKpis.incubadoras > 0 ? (dashboardData.subKpis.incubadoras / dashboardData.unfiltSubKpis.incubadoras)*100 : 0, c: darkMode ? 'text-amber-400' : 'text-amber-600', b: 'bg-amber-500' }
                    ].map((sK) => (
                        <div 
                            key={sK.id} 
                            className={`relative py-2 px-1 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center overflow-hidden transition-all duration-300 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white/80 border-slate-200/50'} ${ctiFilters[sK.id] ? 'opacity-100' : 'opacity-30 grayscale'}`}
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
                        <div className={`rounded-[2rem] border p-3 shadow-inner relative flex flex-col flex-1 min-h-0 overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700/50' : 'bg-slate-50 border-slate-200/80'}`}>
                            <div className={`absolute top-5 left-5 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest z-10 flex items-center gap-2 border shadow-lg ${darkMode ? 'bg-slate-800/80 text-white border-slate-600' : 'bg-white/90 text-slate-800 border-slate-200'}`}>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Motor Cartográfico
                            </div>
                            <div className="w-full h-full flex-1 rounded-xl overflow-hidden">
                                <ConectaMap 
                                    territoriosData={territoriosData} territoriesDynamicStats={territoriesDynamicStats} 
                                    searchTerm={searchTerm} filtroSemiarido={filtroSemiarido} 
                                    selectedTerritory={selectedLocation} semiaridoMunicipios={semiaridoMunicipios} 
                                    onSelectTerritory={(loc) => { setSelectedLocation(loc); setSearchTerm(loc ? loc.nome : ''); }} 
                                    darkMode={darkMode} 
                                />
                            </div>
                        </div>
                        <span className={`absolute -bottom-6 left-4 text-left text-[13px] opacity-70 ${themeClasses.textMuted}`}>
                         Fonte: IBGE, 2022
                        </span>
                    </div>

                    <div className="w-full lg:w-[50%] xl:w-[45%] flex flex-col gap-4 h-full overflow-hidden">
                    
                        {/* LISTA 1: ESTRUTURAS CT&I */}
                        <div className={`flex-1 min-h-0 rounded-[1.5rem] border shadow-sm flex flex-col overflow-hidden transition-all ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200/80'}`}>
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
                        <div className={`flex-[1.2] min-h-0 rounded-[1.5rem] border shadow-sm flex flex-col overflow-hidden transition-all ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                            <div className={`p-3 border-b flex items-center justify-between shrink-0 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                                <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Cadeias Produtivas</h4>
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
                                            <p className="text-[9px] font-medium leading-relaxed opacity-90">{apl.municipiosPertencentes}</p>
                                            
                                            {apl.municipioSatelite && apl.municipioSatelite !== '' && (
                                                <div className={`mt-2 pt-2 border-t ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
                                                    <span className="block text-[8px] font-black uppercase opacity-50 mb-0.5">Município(s) Satélite(s):</span>
                                                    <p className="text-[9px] font-medium leading-relaxed opacity-90">{apl.municipioSatelite}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) : (<div className={`flex items-center justify-center h-full text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhuma cadeia isolada para os filtros ativos.</div>)}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* NOVA SESSÃO: CURSOS SUPERIORES */}
                <div className={`mt-4 rounded-[1.5rem] border shadow-sm flex flex-col transition-all ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                    <div className={`p-4 rounded-t-[1.5rem] border-b flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-3 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                            <h4 className={`text-xs font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Cursos em CT&I (Ensino Superior)</h4>
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black hidden lg:inline-block ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>{cursosFiltrados.length} Cursos</span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* BARRA DE PESQUISA LOCAL */}
                        <div className="relative flex-1 sm:w-48 lg:w-64">
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

                        {/* DROPDOWN DE FILTRO (Estilo Filtros Avançados) */}
                        {areaGeralSummary.length > 0 && (
                            <div className="relative" ref={areaGeralRef}>
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
                    </div>

                    <div className="p-4 max-h-[400px] overflow-y-auto hide-scroll rounded-b-[1.5rem]">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {cursosFiltrados.length > 0 ? cursosFiltrados.map((curso, idx) => (
                                <div key={curso.id || idx} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 ${themeClasses.cardHover} ${darkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white shadow-sm border-slate-100'}`}>
                                    
                                    {/* CABEÇALHO */}
                                    <div className="flex flex-col">
                                        <h5 className={`text-xs font-bold leading-snug mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{curso.curso}</h5>
                                        {curso.areaGeral && (
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getAreaStyles(curso.areaGeral, darkMode).dot}`}></span>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider opacity-90 ${getAreaStyles(curso.areaGeral, darkMode).text}`}>{curso.areaGeral}</span>
                                            </div>
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
                            )) : (<div className={`col-span-full flex items-center justify-center py-8 text-[11px] font-medium italic ${themeClasses.textMuted}`}>{areaGeralFilter.length > 0 || cursoSearchTerm ? `Nenhum curso encontrado para a pesquisa e/ou filtros aplicados.` : 'Nenhum curso superior mapeado ou isolado.'}</div>)}
                        </div>
                    </div>
                </div>

                </div>
            </div>
          } />

        </Routes>
      </main>
      <ChatBot context={{
        kpis: dashboardData.topKpis,
        subKpis: dashboardData.subKpis,
        ultimaAtualizacao: lastUpdate,
        todosTerritorios: territoriosData
      }} />
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