import { Helmet, HelmetProvider } from 'react-helmet-async';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import ConectaMap from "../ConectaMap"; 
import LandingHero from './components/hero';
import territoriosMunicipios from '../utils/territorioMunicipios.json'; 

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================
function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ==========================================
// COMPONENTE: PÁGINA SOBRE (Isolado para organização)
// ==========================================
const SobrePage = ({ darkMode }) => (
  <div className="animate-soft-fade relative p-4 max-w-4xl mx-auto w-full min-h-full flex flex-col justify-start">
    <div className={`backdrop-blur-2xl rounded-[2rem] border shadow-2xl p-8 lg:p-12 mb-8 transition-all duration-500 ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-white/60'}`}>
      <h2 className="text-3xl lg:text-4xl font-black mb-8 tracking-tighter">Sobre o Painel SECTI Territórios</h2>
      <div className={`prose prose-sm sm:prose-base max-w-none ${darkMode ? 'prose-invert text-slate-300' : 'prose-slate text-slate-600'}`}>
        
        <h3 className="text-gov-blueDark-500 dark:text-blue-400 font-black uppercase tracking-[0.2em] text-xs mb-4 mt-8 border-b border-slate-200/20 pb-2">1. Visão Geral do Sistema</h3>
        <p className="leading-relaxed mb-4">
          O Painel SECTI Territórios é uma plataforma de inteligência geográfica concebida para subsidiar a formulação e o acompanhamento de políticas públicas de Ciência, Tecnologia e Inovação (CT&I) no Estado da Bahia.
        </p>
        <p className="leading-relaxed mb-8">
          Através da consolidação de dados territorializados, o sistema integra informações referentes a capacidades institucionais, desenvolvimento socioeconómico, cadeias produtivas e assistência pública. A plataforma proporciona aos gestores e investigadores uma base analítica rigorosa sobre as vocações e características dos 27 Territórios de Identidade da Bahia.
        </p>

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
            { t: 'Pesquisa de Dados (Deep Search)', d: 'O campo de pesquisa permite localizar simultaneamente Municípios, Territórios, Instituições ou Segmentos Produtivos. O painel isola imediatamente os resultados relevantes.', i: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', c: 'text-blue-500 bg-blue-500/10' },
            { t: 'Navegação Cartográfica Dinâmica', d: 'A malha do mapa responde semanticamente aos dados. A seleção de um território no mapa aciona uma aproximação automática focando a área geográfica.', i: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', c: 'text-emerald-500 bg-emerald-500/10' },
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
  
  // Estados
  const [territoriosData, setTerritoriosData] = useState([]);
  const [semiaridoMunicipios, setSemiaridoMunicipios] = useState([]); 
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("Atualizando...");
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filtroSemiarido, setFiltroSemiarido] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // Tema Escuro

  const dropdownRef = useRef(null);
  const scrollMunsRef = useRef(null);

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

        return {
          id: String(index + 1), nome: t.territory || "Desconhecido", tipo: 'Território', regiao: t.territory || "",
          isSemiarido: trueIsSemiarido, pctSemiarido: truePctSemiarido, qtdSemiarido: trueQtdSemi,
          entidadesDetalhadas: entidadesCTI, cadeiasProdutivasDetalhado: cadeiasAPL,
          desenvolvimentoDetalhado: Array.isArray(t.desenvolvimentoDetalhado) ? t.desenvolvimentoDetalhado : [],
          assistenciaPublica: t.assistenciaPublica || { initiatives: [] },
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
    function handleClickOutside(event) { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isMunValid = (munName) => {
      if (!munName) return false;
      if (filtroSemiarido && !semiaridoMunicipios.includes(normalize(munName))) return false;
      return true;
  };

  // Motor de Busca
  const filteredOptions = useMemo(() => {
    const term = normalize(searchTerm); const results = [];
    territoriosData.forEach(t => {
        if (filtroSemiarido && !t.isSemiarido) return;
        if (!term) { results.push({ ...t, matchType: 'Território', matchText: t.regiao }); return; }
        
        let matched = false; let foundMunMatch = null; let foundEntMatch = null; let foundCadeiaMatch = null;
        const territorioBase = territoriosMunicipios.territorios_de_identidade.find((tb) => normalize(tb.nome) === normalize(t.nome));

        if (territorioBase) {
            const foundMun = territorioBase.municipios.find(m => normalize(m).includes(term));
            if (foundMun && isMunValid(foundMun)) { matched = true; foundMunMatch = foundMun; }
        }
        if (!matched && t.entidadesDetalhadas) {
            foundEntMatch = t.entidadesDetalhadas.find(ent => isMunValid(ent.municipio) && (normalize(ent.entidade).includes(term) || normalize(ent.tipo).includes(term)));
            if (foundEntMatch) matched = true;
        }
        if (!matched && t.cadeiasProdutivasDetalhado) {
            foundCadeiaMatch = t.cadeiasProdutivasDetalhado.find(cad => isMunValid(cad.sede || cad.municipioSatelite) && (normalize(cad.segmento).includes(term) || normalize(cad.sede || '').includes(term)));
            if (foundCadeiaMatch) matched = true;
        }

        if (foundMunMatch) results.push({ ...t, matchType: 'Município', matchText: foundMunMatch });
        else if (foundEntMatch) results.push({ ...t, matchType: normalize(foundEntMatch.tipo).includes(term) ? 'Tipo de Infraestrutura' : 'Entidade CT&I', matchText: foundEntMatch.entidade });
        else if (foundCadeiaMatch) results.push({ ...t, matchType: 'Cadeia Produtiva', matchText: foundCadeiaMatch.segmento });
        else if (normalize(t.nome).includes(term)) results.push({ ...t, matchType: 'Território', matchText: t.regiao });
    });
    return results.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [searchTerm, territoriosData, filtroSemiarido, semiaridoMunicipios]);

  // Cálculos Dinâmicos do Mapa
  const territoriesDynamicStats = useMemo(() => {
      const stats = {}; const term = normalize(searchTerm);
      const isSearchTermATerritory = territoriosData.some(t => normalize(t.nome) === term);

      territoriosData.forEach(t => {
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
          
          const validCti = t.entidadesDetalhadas.filter(ent => isMunValid(ent.municipio) && (term && !isSearchTermATerritory ? (normalize(ent.entidade).includes(term) || normalize(ent.tipo).includes(term)) : true));
          const validCadeias = t.cadeiasProdutivasDetalhado.filter(cad => isMunValid(cad.sede || cad.municipioSatelite) && (term && !isSearchTermATerritory ? normalize(cad.segmento).includes(term) : true));
          
          let matchesSearch = true;
          if (term) {
              const territorioBase = territoriosMunicipios.territorios_de_identidade.find(tb => normalize(tb.nome) === normalize(t.nome));
              matchesSearch = normalize(t.nome).includes(term) || (territorioBase && territorioBase.municipios.some(m => normalize(m).includes(term))) || (!isSearchTermATerritory && (validCti.length > 0 || validCadeias.length > 0));
          }

          stats[normalize(t.nome)] = {
              ifdm: somaPop > 0 ? (somaIfdmPop / somaPop).toFixed(3) : "-",
              capacidadeCti: String(validCti.length), cadeiasIgs: String(validCadeias.length),
              pctSemiarido: t.pctSemiarido, matchesSearch: filtroSemiarido ? (t.isSemiarido && matchesSearch) : matchesSearch
          };
      });
      return stats;
  }, [territoriosData, filtroSemiarido, searchTerm, semiaridoMunicipios]);

  // Consumo de Dados das Listas
  const dashboardData = useMemo(() => {
    let targetList = selectedLocation ? [selectedLocation] : territoriosData;
    const term = normalize(searchTerm); const isSearchTermATerritory = territoriosData.some(t => normalize(t.nome) === term);
    const kpisPanel = { univs: 0, ifs: 0, icts: 0, centrosPesquisa: 0, espacos: 0, parques: 0, incubadoras: 0 };
    const entidadesFlat = []; const aplIgsFlat = []; const assistenciasSet = new Map();
    const globalIds = new Set(); const globalCadeiasIds = new Set();
    let somaIfdmPop = 0; let somaPopulacao = 0; let totalAssistencia = 0;

    targetList.forEach(t => {
        if (filtroSemiarido && !t.isSemiarido) return;
        let validData = false;

        t.entidadesDetalhadas.forEach(ent => {
            if (!isMunValid(ent.municipio)) return;
            if (term && !isSearchTermATerritory && !normalize(ent.entidade).includes(term) && !normalize(ent.tipo).includes(term)) return;
            validData = true; entidadesFlat.push({ ...ent, territorioRef: t.nome });
            if (ent.id && !globalIds.has(ent.id)) {
                globalIds.add(ent.id); if (ent.categoria && kpisPanel[ent.categoria] !== undefined) kpisPanel[ent.categoria]++;
            }
        });
        
        t.cadeiasProdutivasDetalhado.forEach(cad => {
            const sede = cad.sede || cad.municipioSatelite || 'Não informada';
            const perts = filtroSemiarido ? String(cad.municipiosPertencentes || '').split(/[,;\-]/).map(m => m.trim()).filter(m => isMunValid(m)) : String(cad.municipiosPertencentes || '').split(/[,;\-]/).map(m => m.trim()).filter(Boolean);
            if (filtroSemiarido && !isMunValid(sede) && perts.length === 0) return;
            if (term && !isSearchTermATerritory && !normalize(cad.segmento).includes(term) && !normalize(sede).includes(term)) return;
            validData = true;
            aplIgsFlat.push({ id: cad.id || Math.random(), segmento: cad.segmento || 'Sem Segmento', entidade: cad.entidade, tipo: cad.tipo || 'N/A', municipiosPertencentes: perts.join(', ') || sede, sede, territorioRef: t.nome });
            if (cad.id) globalCadeiasIds.add(cad.id);
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

    const safePct = selectedLocation ? (Number(selectedLocation.pctSemiarido) || 0).toFixed(1) : "0.0";
    const qtdSemi = selectedLocation ? selectedLocation.qtdSemiarido : 0;
    
    // Atualizado a string para mostrar a % e a quantidade de munícipios
    const coberturaCalculada = selectedLocation 
      ? (Number(selectedLocation.pctSemiarido) >= 100 ? "Pertencente (100%)" : Number(selectedLocation.pctSemiarido) <= 0 ? "Não pertencente" : `Parcial ${safePct}% (${qtdSemi} mun.)`) 
      : (filtroSemiarido ? "100% (Filtro Ativo)" : "85,6% do Estado");

    return { 
        topKpis: {
            capacidadeCti: String(globalIds.size), ifdm: somaPopulacao > 0 ? (somaIfdmPop / somaPopulacao).toFixed(3) : "-",
            conectaBahia: (selectedLocation || filtroSemiarido) ? "Em levantamento" : `${totalAssistencia} Territórios`, cadeiasIgs: String(globalCadeiasIds.size), 
            coberturaSemiarido: coberturaCalculada
        }, 
        subKpis: kpisPanel, 
        entidades: Array.from(new Map(entidadesFlat.map(item => [item.id, item])).values()).sort((a, b) => (a.municipio || "").localeCompare(b.municipio || "")), 
        aplIgs: Array.from(new Map(aplIgsFlat.map(item => [item.id, item])).values()).sort((a, b) => (a.segmento || "").localeCompare(b.segmento || "")), 
        assistencias: Array.from(assistenciasSet.values()).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")) 
    };
  }, [selectedLocation, filtroSemiarido, territoriosData, semiaridoMunicipios, searchTerm]);

  const municipiosSelecionados = useMemo(() => {
      if (!selectedLocation) return [];
      const tb = territoriosMunicipios.territorios_de_identidade.find((t) => normalize(t.nome) === normalize(selectedLocation.nome));
      return tb ? (filtroSemiarido ? tb.municipios.filter(m => semiaridoMunicipios.includes(normalize(m))) : tb.municipios).sort() : [];
  }, [selectedLocation, filtroSemiarido, semiaridoMunicipios]);

  const getBadgeStyle = (tipo) => {
      const t = String(tipo).toLowerCase();
      if (t.includes('potencial')) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      if (t.includes('ig') || t.includes('indicação')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      if (t.includes('apl') || t.includes('arranjo')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      return darkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const isActive = (path) => location.pathname === path;

  // Estilos Condicionais Baseados no Tema
  const themeClasses = {
      app: darkMode ? 'bg-[#0a0f1c] text-slate-200' : 'bg-slate-50 text-slate-800',
      glass: darkMode ? 'bg-slate-900/60 border-slate-700/50 shadow-2xl backdrop-blur-xl' : 'bg-white/80 border-white/60 shadow-xl backdrop-blur-xl',
      input: darkMode ? 'bg-slate-900/50 border-slate-700 text-slate-200 focus:border-blue-500 focus:bg-slate-800' : 'bg-white border-slate-200 text-slate-800 focus:border-gov-blueDark-500',
      textMuted: darkMode ? 'text-slate-400' : 'text-slate-500',
      cardHover: darkMode ? 'hover:bg-slate-800/50 hover:border-slate-600' : 'hover:bg-white hover:border-slate-300'
  };

  return (
    <div className={`relative flex flex-col h-screen font-sans overflow-hidden transition-colors duration-500 ${themeClasses.app}`}>
      <Helmet>
        <title>Painel Territorial CT&I | Governo da Bahia</title>
        <meta name="description" content="Plataforma interativa da SECTI com indicadores de Ciência, Tecnologia, Inovação e Cadeias Produtivas dos 27 Territórios de Identidade da Bahia." />
      </Helmet>

      {/* CSS Animado & Estilos Globais */}
      <style>{`
          @keyframes softFade { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
          .animate-soft-fade { animation: softFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .hide-scroll::-webkit-scrollbar { height: 4px; width: 4px; }
          .hide-scroll::-webkit-scrollbar-track { background: transparent; }
          .hide-scroll::-webkit-scrollbar-thumb { background: ${darkMode ? '#334155' : '#cbd5e1'}; border-radius: 4px; }
          @keyframes progress-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
          .animate-progress-slide { animation: progress-slide 1.5s infinite ease-in-out; }
      `}</style>

      {/* Efeitos de Fundo Orgânicos (Blobs) */}
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

      {/* NAVBAR PREMIUM */}
      <header className={`fixed top-4 left-0 right-0 mx-auto w-[96%] max-w-[1600px] ${themeClasses.glass} h-14 rounded-2xl flex items-center justify-between px-6 z-[100]`}>
          <div className="flex items-center gap-8">
            <h1 className="text-[11px] sm:text-xs font-black tracking-widest uppercase flex items-center gap-1.5 drop-shadow-sm">
                <span className={darkMode ? 'text-blue-400' : 'text-gov-blueDark-500'}>Painel</span>
                <span className="text-gov-red-500">Territorial</span>
            </h1>
            <nav className="hidden sm:flex items-center gap-2">
                {[ {p: '/', l: 'Início'}, {p: '/territorios', l: 'Territórios'}, {p: '/sobre', l: 'Sobre'} ].map((tab) => (
                  <Link key={tab.p} to={tab.p} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isActive(tab.p) ? (darkMode ? 'bg-blue-500 text-white' : 'bg-gov-blueDark-500 text-white') : (darkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}`}>
                    {tab.l}
                  </Link>
                ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
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
            <div className="animate-soft-fade relative p-2 lg:p-0 max-w-[98%] 2xl:max-w-[1550px] mx-auto w-full min-h-full">
                <div className={`${themeClasses.glass} rounded-[2rem] p-4 lg:p-6 flex flex-col gap-4`}>
                
                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-3 items-center border-b pb-4 ${darkMode ? 'border-slate-700/50' : 'border-slate-200/60'}`}>
                    <div className="lg:col-span-2 relative w-full flex flex-col sm:flex-row gap-3" ref={dropdownRef}>
                        <div className="w-full relative flex-1">
                            <label className={`block text-[9px] font-black uppercase tracking-widest mb-1.5 ${themeClasses.textMuted}`}>Deep Search: Cruzamento Territorial</label>
                            <div className="relative">
                                <input type="text" placeholder={isLoadingPipeline ? "Sincronizando..." : "Pesquise por município, território, segmento ou infraestrutura..."} value={searchTerm} disabled={isLoadingPipeline} onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); if (!e.target.value) setSelectedLocation(null); }} onFocus={() => setIsDropdownOpen(true)} className={`w-full h-11 pl-10 pr-10 rounded-xl text-xs transition-all outline-none border ${themeClasses.input}`} />
                                <svg className={`w-4 h-4 absolute left-3.5 top-3.5 ${themeClasses.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                {searchTerm && ( <button onClick={() => { setSearchTerm(''); setSelectedLocation(null); setIsDropdownOpen(false); }} className={`absolute right-3.5 top-3.5 hover:text-red-500 ${themeClasses.textMuted}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button> )}
                            </div>
                        </div>
                        <div className="w-full sm:w-auto pt-0 sm:pt-4">
                            <button onClick={() => { setFiltroSemiarido(!filtroSemiarido); setSelectedLocation(null); setSearchTerm(''); }} className={`w-full h-11 px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-sm ${filtroSemiarido ? 'bg-orange-500 border-orange-600 text-white hover:bg-orange-600' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{filtroSemiarido ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />}</svg>
                                {filtroSemiarido ? 'Recorte: Semiárido Ativo' : 'Aplicar Semiárido'}
                            </button>
                        </div>
                        {isDropdownOpen && searchTerm && (
                            <div className={`absolute top-[100%] mt-2 w-full rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            {filteredOptions.length > 0 ? filteredOptions.map((item) => (
                                <button key={item.id} onClick={() => { setSelectedLocation(item); setSearchTerm(item.nome); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-3 border-b last:border-none flex items-center justify-between transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                                    <div className="flex flex-col"><span className="font-bold text-xs">{item.nome}</span><span className={`text-[9px] uppercase tracking-wider mt-0.5 ${themeClasses.textMuted}`}>{item.matchType === 'Território' ? item.regiao : `${item.matchType}: ${item.matchText}`}</span></div>
                                    {item.isSemiarido && <span className="text-[8px] font-black bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-md uppercase">Semiárido</span>}
                                </button>
                            )) : (<div className={`px-4 py-3 text-xs italic text-center ${themeClasses.textMuted}`}>Nenhum resultado matemático encontrado.</div>)}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center lg:justify-end gap-2 lg:pt-4 w-full">
                        <button onClick={() => carregarDadosDoSharePoint(true)} disabled={isLoadingPipeline} className={`h-11 px-5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 border shadow-sm ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'} disabled:opacity-50`}>
                            {isLoadingPipeline ? 'Sincronizando...' : 'Forçar Atualização'}
                        </button>
                    </div>
                </div>

                {/* BLOCO DE KPIS GLOBAIS COM NOMES ORIGINAIS DA V1 */}
                <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.textMuted}`}>Cenário Global {selectedLocation ? `— ${selectedLocation.nome}` : (filtroSemiarido ? '— Semiárido Baiano' : '— Estado da Bahia')}</h3>
                        <span className={`text-[9px] font-medium hidden sm:block ${themeClasses.textMuted}`}>Status: {lastUpdate}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            { l: 'Capacidade CTI', v: dashboardData.topKpis.capacidadeCti, c: darkMode ? 'text-blue-400' : 'text-blue-600', b: 'bg-blue-500' },
                            { l: 'D. Territ. (IFDM)', v: dashboardData.topKpis.ifdm, c: darkMode ? 'text-red-400' : 'text-red-600', b: 'bg-red-500' },
                            { l: 'Semiárido', v: dashboardData.topKpis.coberturaSemiarido, c: darkMode ? 'text-slate-300' : 'text-slate-700', b: 'bg-slate-400', tr: true },
                            { l: 'Assist. Pública CT&I', v: dashboardData.topKpis.conectaBahia, c: darkMode ? 'text-cyan-400' : 'text-cyan-600', b: 'bg-cyan-500', tr: true },
                            { l: 'Cadeias Produtivas', v: dashboardData.topKpis.cadeiasIgs, c: darkMode ? 'text-emerald-400' : 'text-emerald-600', b: 'bg-emerald-500', tr: true },
                        ].map((k, idx) => (
                            <div key={idx} className={`p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${themeClasses.cardHover} ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200/60'}`}>
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 opacity-60 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{k.l}</p>
                                <p className={`text-2xl lg:text-3xl font-black leading-none tracking-tight ${k.c} ${k.tr ? 'truncate text-xl lg:text-2xl' : ''}`}>{k.v}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SCROLL MUNICÍPIOS */}
                {selectedLocation && municipiosSelecionados.length > 0 && (
                    <div className={`p-3 rounded-2xl border shadow-inner ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Municípios Constituintes</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white border border-slate-200 text-slate-600'}`}>{municipiosSelecionados.length} Cidades</span>
                        </div>
                        
                        <div className="relative flex items-center group">
                            <button onClick={() => scrollMunsRef.current?.scrollBy({ left: -200, behavior: 'smooth' })} className={`absolute left-0 h-full w-12 bg-gradient-to-r ${darkMode ? 'from-slate-900 to-transparent' : 'from-slate-50 to-transparent'} z-10 flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity`}><div className="bg-slate-800 text-white p-1 rounded-full shadow"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></div></button>
                            <div ref={scrollMunsRef} className="flex gap-2 overflow-x-auto pb-1 w-full hide-scroll scroll-smooth px-1">
                                {municipiosSelecionados.map((m, idx) => {
                                    const isSemi = semiaridoMunicipios.includes(normalize(m));
                                    return (
                                        <span key={idx} className={`whitespace-nowrap flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors shadow-sm ${isSemi ? 'bg-orange-500/10 text-orange-600 border-orange-500/30' : (darkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-700 border-slate-200')}`}>
                                            {/* CORREÇÃO: Removidos asteriscos e adicionada a bolinha estilizada correspondente ao semiárido */}
                                            {isSemi && <span className="w-1.5 h-1.5 rounded-full border border-orange-500 bg-orange-500/40"></span>}
                                            {m}
                                        </span>
                                    );
                                })}
                            </div>
                            <button onClick={() => scrollMunsRef.current?.scrollBy({ left: 200, behavior: 'smooth' })} className={`absolute right-0 h-full w-12 bg-gradient-to-l ${darkMode ? 'from-slate-900 to-transparent' : 'from-slate-50 to-transparent'} z-10 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity`}><div className="bg-slate-800 text-white p-1 rounded-full shadow"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></div></button>
                        </div>
                        
                        {/* CORREÇÃO: Título da legenda substituído por indicador circular e texto limpo */}
                        {!filtroSemiarido && selectedLocation && selectedLocation.qtdSemiarido > 0 && (
                            <div className={`text-[9px] font-bold mt-2 flex items-center gap-1.5 px-1 opacity-90 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span className="w-2 h-2 rounded-full border-[1.5px] border-orange-500 bg-orange-500/20"></span>
                                <span>Pertencente ao Semiárido</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-4 lg:grid-cols-7 gap-2 lg:gap-3">
                    {[
                        { l: 'Univs.', v: dashboardData.subKpis.univs, c: darkMode ? 'text-blue-400' : 'text-blue-600' },
                        { l: 'Inst. Fed.', v: dashboardData.subKpis.ifs, c: darkMode ? 'text-red-400' : 'text-red-600' },
                        { l: 'ICTs', v: dashboardData.subKpis.icts, c: darkMode ? 'text-cyan-400' : 'text-cyan-600' },
                        { l: 'C. Pesquisa', v: dashboardData.subKpis.centrosPesquisa, c: darkMode ? 'text-emerald-400' : 'text-emerald-600' },
                        { l: 'Espaços', v: dashboardData.subKpis.espacos, c: darkMode ? 'text-indigo-400' : 'text-indigo-600' },
                        { l: 'Parques', v: dashboardData.subKpis.parques, c: darkMode ? 'text-fuchsia-400' : 'text-fuchsia-600' },
                        { l: 'Incub.', v: dashboardData.subKpis.incubadoras, c: darkMode ? 'text-amber-400' : 'text-amber-600' }
                    ].map((sK, idx) => (
                        <div key={idx} className={`py-2 px-1 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center transition-transform hover:-translate-y-1 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white/80 border-slate-200/50'}`}>
                            <span className={`text-[8px] font-black uppercase tracking-widest opacity-60 mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{sK.l}</span>
                            <span className={`text-xl font-black leading-none drop-shadow-sm ${sK.c}`}>{sK.v || 0}</span>
                        </div>
                    ))}
                </div>

                {/* ALTURA E ZOOM REDUZIDOS (h-[600px] / lg:w-[45%]) */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch h-[600px] 2xl:h-[70vh] w-full mt-2">
                    
                    {/* MAPA INTERATIVO - LARGURA REDUZIDA */}
                    <div className={`w-full lg:w-[45%] xl:w-[50%] rounded-[2rem] border p-3 shadow-inner relative flex flex-col h-full overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700/50' : 'bg-slate-50 border-slate-200/80'}`}>
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

                    {/* LISTAS LATERAIS - LARGURA ADAPTADA */}
                    <div className="w-full lg:w-[55%] xl:w-[50%] flex flex-col gap-4 h-full overflow-hidden">
                    
                        {/* Lista 1: Instituições CT&I */}
                        <div className={`flex-1 min-h-0 rounded-[1.5rem] border shadow-sm flex flex-col overflow-hidden transition-all ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                            <div className={`p-3 border-b flex items-center justify-between shrink-0 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                                <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Estruturas CT&I</h4>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>{dashboardData.entidades.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 hide-scroll">
                                <div className="flex flex-col gap-2">
                                {dashboardData.entidades.length > 0 ? dashboardData.entidades.map((ent, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl border flex flex-col gap-1 transition-all duration-300 hover:pl-4 ${themeClasses.cardHover} ${darkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white shadow-sm border-slate-100'}`}>
                                        <span className="text-[11px] font-bold leading-tight">{ent.entidade}</span>
                                        <div className="flex justify-between items-end mt-1">
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${darkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{ent.tipo || "Instituição"}</span>
                                            <div className="text-right"><span className="block text-[9px] font-medium opacity-80">{ent.municipio}</span></div>
                                        </div>
                                    </div>
                                )) : (<div className={`flex items-center justify-center h-full text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhuma estrutura isolada.</div>)}
                                </div>
                            </div>
                        </div>

                        {/* Lista 2: Cadeias Produtivas */}
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
                                        </div>
                                    </div>
                                )) : (<div className={`flex items-center justify-center h-full text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhuma cadeia isolada.</div>)}
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

// ==========================================
// EXPORTAÇÃO (APP WRAPPER COM ROUTER E HELMET)
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