import React, { useState, useRef, useEffect, useMemo } from 'react';
import ConectaMap from "../ConectaMap"; 
import LandingHero from './components/hero';
import territoriosMunicipios from '../utils/territorioMunicipios.json';

// Função de normalização para cruzamento exato de textos (remove acentos e espaços)
function normalize(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const pageFromUrl = queryParams.get('tab') || 'overview';
  const [page, setPage] = useState(pageFromUrl);
  
  const [territoriosData, setTerritoriosData] = useState([]);
  const [semiaridoMunicipios, setSemiaridoMunicipios] = useState([]); 
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("Atualizando...");

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filtroSemiarido, setFiltroSemiarido] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const scrollMunsRef = useRef(null);

  // =======================================================================
  // INGESTÃO DE DADOS BLINDADA (Cruzamento com JSON Oficial)
  // =======================================================================
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
        const territorioBase = territoriosMunicipios.territorios_de_identidade.find(
            (tb) => normalize(tb.nome) === normalize(t.territory)
        );
        
        let trueQtdSemi = 0;
        if (territorioBase) {
            territorioBase.municipios.forEach(m => {
                if (semiaridoNormList.includes(normalize(m))) trueQtdSemi++;
            });
        }
        
        const trueTotalMuns = territorioBase ? territorioBase.municipios.length : 0;
        const truePctSemiarido = trueTotalMuns > 0 ? (trueQtdSemi / trueTotalMuns) * 100 : 0;
        const trueIsSemiarido = trueQtdSemi > 0;

        const entidadesCTI = Array.isArray(t.capacidadeDetalhada) ? t.capacidadeDetalhada : [];
        const cadeiasAPL = Array.isArray(t.cadeiasProdutivasDetalhado) ? t.cadeiasProdutivasDetalhado : [];

        return {
          id: String(index + 1),
          nome: t.territory || "Desconhecido",
          tipo: 'Território',
          regiao: t.territory || "",
          isSemiarido: trueIsSemiarido,   
          pctSemiarido: truePctSemiarido, 
          entidadesDetalhadas: entidadesCTI,
          cadeiasProdutivasDetalhado: cadeiasAPL,
          desenvolvimentoDetalhado: Array.isArray(t.desenvolvimentoDetalhado) ? t.desenvolvimentoDetalhado : [],
          assistenciaPublica: t.assistenciaPublica || { iniciativas: [] },
          desenvolvimento: t.desenvolvimento || { ifdmTi: 0, populacaoTotal: 0 },
          kpis: {
            capacidadeCti: String(entidadesCTI.length),
            ifdm: t.desenvolvimento?.ifdmTi ? Number(t.desenvolvimento.ifdmTi).toFixed(3) : "-",
            conectaBahia: t.assistenciaPublica?.existe ? "Presente" : "Não mapeado",
            cadeiasIgs: String(cadeiasAPL.length),
            coberturaSemiarido: trueIsSemiarido ? (truePctSemiarido >= 100 ? "Pertencente" : "Parcial") : "Exterior"
          }
        };
      });

      setTerritoriosData(territoriosFormatados);
      setSemiaridoMunicipios(semiaridoNormList); 
      setLastUpdate(new Date(data.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error("[Painel] Erro fatal na pipeline:", error);
      setLastUpdate("Erro na Sincronização");
    } finally {
      setIsLoadingPipeline(false);
    }
  };

  useEffect(() => { carregarDadosDoSharePoint(); }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isMunValid = (munName) => {
      if (!munName) return false;
      const normalizedMun = normalize(munName);
      if (filtroSemiarido && !semiaridoMunicipios.includes(normalizedMun)) return false;
      return true;
  };

  // =======================================================================
  // MOTOR DE PESQUISA PROFUNDA RIGOROSO (Strict Deep Search)
  // =======================================================================
  const filteredOptions = useMemo(() => {
    const term = normalize(searchTerm);
    const results = [];

    territoriosData.forEach(t => {
        if (filtroSemiarido && !t.isSemiarido) return;

        if (!term) {
            results.push({ ...t, matchType: 'Território', matchText: t.regiao });
            return;
        }

        let matched = false;
        let foundMunMatch = null;
        let foundEntMatch = null;
        let foundCadeiaMatch = null;
        let matchTerritoryName = false;

        const territorioBase = territoriosMunicipios.territorios_de_identidade.find(
            (tb) => normalize(tb.nome) === normalize(t.nome)
        );

        if (territorioBase) {
            const foundMun = territorioBase.municipios.find(m => normalize(m).includes(term));
            if (foundMun && isMunValid(foundMun)) {
                matched = true;
                foundMunMatch = foundMun;
            }
        }

        if (!matched && t.entidadesDetalhadas) {
            foundEntMatch = t.entidadesDetalhadas.find(ent => {
                if (!isMunValid(ent.municipio)) return false; 
                return normalize(ent.entidade).includes(term) || normalize(ent.tipo).includes(term) || normalize(ent.categoria).includes(term);
            });
            if (foundEntMatch) matched = true;
        }

        if (!matched && t.cadeiasProdutivasDetalhado) {
            foundCadeiaMatch = t.cadeiasProdutivasDetalhado.find(cad => {
                const sedeStr = cad.sede || cad.municipioSatelite || '';
                if (!isMunValid(sedeStr)) return false; 
                return normalize(cad.segmento).includes(term) || normalize(sedeStr).includes(term);
            });
            if (foundCadeiaMatch) matched = true;
        }

        if (!matched && normalize(t.nome).includes(term)) {
            matchTerritoryName = true;
            if (filtroSemiarido && territorioBase) {
                const isTypingNonSemiMun = territorioBase.municipios.some(m => 
                    normalize(m).includes(term) && !semiaridoMunicipios.includes(normalize(m))
                );
                const isTypingActualTerritory = normalize(t.nome).includes(term) && !territorioBase.municipios.some(m => normalize(m) === normalize(t.nome));
                if (isTypingNonSemiMun && !isTypingActualTerritory) matchTerritoryName = false;
            }
            if (matchTerritoryName) matched = true;
        }

        if (foundMunMatch) {
            results.push({ ...t, matchType: 'Município', matchText: foundMunMatch });
        } else if (foundEntMatch) {
            const isType = normalize(foundEntMatch.tipo).includes(term);
            results.push({ ...t, matchType: isType ? 'Tipo de Infraestrutura' : 'Entidade CT&I', matchText: isType ? foundEntMatch.tipo : foundEntMatch.entidade });
        } else if (foundCadeiaMatch) {
            const isSeg = normalize(foundCadeiaMatch.segmento).includes(term);
            results.push({ ...t, matchType: isSeg ? 'Segmento Produtivo' : 'Sede da Cadeia', matchText: isSeg ? foundCadeiaMatch.segmento : (foundCadeiaMatch.sede || foundCadeiaMatch.municipioSatelite) });
        } else if (matchTerritoryName) {
            results.push({ ...t, matchType: 'Território', matchText: t.regiao });
        }
    });

    return results.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [searchTerm, territoriosData, filtroSemiarido, semiaridoMunicipios]);

  // =======================================================================
  // ESTATÍSTICAS DINÂMICAS PARA O MAPA (CORRIGIDO: Sem vazamento de variáveis)
  // =======================================================================
  const territoriesDynamicStats = useMemo(() => {
      const stats = {};
      const term = normalize(searchTerm);
      const isSearchTermATerritory = territoriosData.some(t => normalize(t.nome) === term);

      territoriosData.forEach(t => {
          let somaIfdmPop = 0;
          let somaPop = 0;
          
          if (t.desenvolvimentoDetalhado && t.desenvolvimentoDetalhado.length > 0) {
              t.desenvolvimentoDetalhado.forEach(m => {
                  if (isMunValid(m.municipio)) {
                      const ifdm = Number(m.ifdm) || 0;
                      const pop = Number(m.populacao) || 0;
                      if (ifdm > 0 && pop > 0) {
                          somaIfdmPop += (ifdm * pop);
                          somaPop += pop;
                      }
                  }
              });
          } else {
              if (!filtroSemiarido && t.desenvolvimento?.ifdmTi) {
                  somaIfdmPop = t.desenvolvimento.ifdmTi * t.desenvolvimento.populacaoTotal;
                  somaPop = t.desenvolvimento.populacaoTotal;
              }
          }
          
          const dynIfdm = somaPop > 0 ? (somaIfdmPop / somaPop).toFixed(3) : "-";

          const validCti = t.entidadesDetalhadas.filter(ent => {
              if (!isMunValid(ent.municipio)) return false;
              if (term && !isSearchTermATerritory) {
                  return normalize(ent.entidade).includes(term) || normalize(ent.tipo).includes(term) || normalize(ent.categoria).includes(term);
              }
              return true;
          });

          const validCadeias = t.cadeiasProdutivasDetalhado.filter(cad => {
              const sedeStr = cad.sede || cad.municipioSatelite || '';
              if (!isMunValid(sedeStr)) return false;
              if (term && !isSearchTermATerritory) {
                  return normalize(cad.segmento).includes(term) || normalize(sedeStr).includes(term);
              }
              return true;
          });

          let matchesSearch = true;
          if (term) {
              const matchTerritoryName = normalize(t.nome).includes(term);
              const territorioBase = territoriosMunicipios.territorios_de_identidade.find(tb => normalize(tb.nome) === normalize(t.nome));
              const matchMunicipioName = territorioBase ? territorioBase.municipios.some(m => normalize(m).includes(term)) : false;
              let matchAssets = !isSearchTermATerritory && (validCti.length > 0 || validCadeias.length > 0);

              matchesSearch = matchTerritoryName || matchMunicipioName || matchAssets;
          }

          const hasValidMuns = t.desenvolvimentoDetalhado ? t.desenvolvimentoDetalhado.some(m => isMunValid(m.municipio)) : !filtroSemiarido;
          const dynConecta = (t.assistenciaPublica?.existe && hasValidMuns) ? "Presente" : "Não mapeado";

          stats[normalize(t.nome)] = {
              ifdm: dynIfdm,
              capacidadeCti: String(validCti.length),
              cadeiasIgs: String(validCadeias.length),
              conectaBahia: dynConecta,
              pctSemiarido: t.pctSemiarido,
              matchesSearch: filtroSemiarido ? (t.isSemiarido && matchesSearch) : matchesSearch
          };
      });
      return stats;
  }, [territoriosData, filtroSemiarido, searchTerm, semiaridoMunicipios]);

  // =======================================================================
  // PROCESSADOR CENTRAL DO DASHBOARD (Listas Laterais e Cards)
  // =======================================================================
  const dashboardData = useMemo(() => {
    let targetList = selectedLocation ? [selectedLocation] : territoriosData;
    const term = normalize(searchTerm);
    const isSearchTermATerritory = territoriosData.some(t => normalize(t.nome) === term);

    const kpisPanel = { univs: 0, ifs: 0, icts: 0, centrosPesquisa: 0, espacos: 0, parques: 0, incubadoras: 0 };
    const entidadesFlat = [];
    const aplIgsFlat = [];

    const globalUniqueCtiIds = new Set();
    const globalUniqueCadeiasIds = new Set();
    const assistenciasSet = new Map();

    let somaIfdmPop = 0;
    let somaPopulacao = 0;
    let totalTerritoriosComAssistencia = 0;

    targetList.forEach(t => {
        if (filtroSemiarido && !t.isSemiarido) return;
        let territoryHasValidData = false;

        t.entidadesDetalhadas.forEach(ent => {
            if (!isMunValid(ent.municipio)) return;
            if (term && !isSearchTermATerritory) {
                const matchName = normalize(ent.entidade).includes(term);
                const matchType = normalize(ent.tipo).includes(term) || normalize(ent.categoria).includes(term);
                if (!matchName && !matchType) return;
            }

            territoryHasValidData = true;
            entidadesFlat.push({ ...ent, territorioRef: t.nome });
            if (ent.id && !globalUniqueCtiIds.has(ent.id)) {
                globalUniqueCtiIds.add(ent.id);
                if (ent.categoria && kpisPanel[ent.categoria] !== undefined) kpisPanel[ent.categoria] += 1;
            }
        });
        
        t.cadeiasProdutivasDetalhado.forEach(cadeia => {
            const sedeStr = cadeia.sede || cadeia.municipioSatelite || 'Não informada';
            const pertsStr = cadeia.municipiosPertencentes || cadeia.municipio || 'Não informados';

            const pertsArray = String(pertsStr).split(/[,;|\-/]/).map(m => m.trim()).filter(Boolean);
            let cleanPertsArray = filtroSemiarido ? pertsArray.filter(m => isMunValid(m)) : pertsArray;

            if (filtroSemiarido && !isMunValid(sedeStr) && cleanPertsArray.length === 0) return;

            if (term && !isSearchTermATerritory) {
                const matchSeg = normalize(cadeia.segmento).includes(term);
                const matchSede = normalize(sedeStr).includes(term);
                if (!matchSeg && !matchSede) return;
            }

            territoryHasValidData = true;
            const segmentoStr = cadeia.segmento || 'Sem Segmento';
            const tipoStr = cadeia.tipo && String(cadeia.tipo).trim() !== '' ? cadeia.tipo : 'Não Classificado';
            
            aplIgsFlat.push({
                id: cadeia.id || Math.random().toString(),
                segmento: segmentoStr, 
                entidade: cadeia.entidade || null,
                tipo: tipoStr,
                municipiosPertencentes: cleanPertsArray.join(', ') || sedeStr, 
                fonte: cadeia.fonte || null,
                sede: sedeStr, 
                territorioRef: t.nome 
            });

            if (cadeia.id) globalUniqueCadeiasIds.add(cadeia.id);
        });

        if (t.assistenciaPublica?.existe && (!filtroSemiarido || territoryHasValidData)) {
            totalTerritoriosComAssistencia += 1;
            const iniArray = Array.isArray(t.assistenciaPublica?.iniciativas) ? t.assistenciaPublica.iniciativas : [];
            iniArray.forEach(ini => {
                const chaveAsst = `${ini}|${t.nome}`;
                if (!assistenciasSet.has(chaveAsst)) {
                    assistenciasSet.set(chaveAsst, { nome: ini, municipio: 'Abrangência Territorial', territorioRef: t.nome });
                }
            });
        }

        if (t.desenvolvimentoDetalhado && t.desenvolvimentoDetalhado.length > 0) {
            t.desenvolvimentoDetalhado.forEach(munData => {
                if (isMunValid(munData.municipio)) {
                    const ifdm = Number(munData.ifdm) || 0;
                    const pop = Number(munData.populacao) || 0;
                    if (ifdm > 0 && pop > 0) {
                        somaIfdmPop += (ifdm * pop);
                        somaPopulacao += pop;
                    }
                }
            });
        } else if (!filtroSemiarido && t.desenvolvimento?.ifdmTi) {
            somaIfdmPop += (t.desenvolvimento.ifdmTi * t.desenvolvimento.populacaoTotal);
            somaPopulacao += t.desenvolvimento.populacaoTotal;
        }
    });

    const uniqueVisualEntidades = Array.from(new Map(entidadesFlat.map(item => [item.id, item])).values());
    const uniqueVisualCadeias = Array.from(new Map(aplIgsFlat.map(item => [item.id, item])).values());

    uniqueVisualEntidades.sort((a, b) => (a.municipio || "").localeCompare(b.municipio || ""));
    uniqueVisualCadeias.sort((a, b) => (a.segmento || "").localeCompare(b.segmento || ""));
    
    const assistenciasList = Array.from(assistenciasSet.values()).sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    const mediaIfdm = somaPopulacao > 0 ? (somaIfdmPop / somaPopulacao).toFixed(3) : "-";
    
    const safePct = selectedLocation ? (Number(selectedLocation.pctSemiarido) || 0).toFixed(1) : "0.0";
    const coberturaCalculada = selectedLocation 
      ? (Number(selectedLocation.pctSemiarido) >= 100 ? "Pertencente (100%)" : Number(selectedLocation.pctSemiarido) <= 0 ? "Não pertencente" : `Parcial (${safePct}%)`) 
      : (filtroSemiarido ? "100% (Filtro Ativo)" : "85,6% do Estado");

    return { 
        topKpis: {
            capacidadeCti: String(globalUniqueCtiIds.size), 
            ifdm: mediaIfdm,
            conectaBahia: (selectedLocation || filtroSemiarido) ? "Em levantamento" : `${totalTerritoriosComAssistencia} Territórios`,
            cadeiasIgs: String(globalUniqueCadeiasIds.size), 
            coberturaSemiarido: coberturaCalculada
        }, 
        subKpis: kpisPanel, 
        entidades: uniqueVisualEntidades, 
        aplIgs: uniqueVisualCadeias, 
        assistencias: assistenciasList 
    };
  }, [selectedLocation, filtroSemiarido, territoriosData, semiaridoMunicipios, searchTerm]);

  const municipiosDoTerritorioSelecionado = useMemo(() => {
      if (!selectedLocation) return [];
      try {
          const territorioBase = territoriosMunicipios.territorios_de_identidade.find(
              (t) => normalize(t.nome) === normalize(selectedLocation.nome)
          );
          if (!territorioBase) return [];
          let list = territorioBase.municipios;
          if (filtroSemiarido) list = list.filter(m => semiaridoMunicipios.includes(normalize(m)));
          return list.sort((a,b) => a.localeCompare(b));
      } catch(e) { return []; }
  }, [selectedLocation, filtroSemiarido, semiaridoMunicipios]);

  const getBadgeStyle = (tipo) => {
      const t = String(tipo).toLowerCase();
      if (t.includes('potencial')) return 'bg-orange-100 text-orange-800 border-orange-300 shadow-sm';
      if (t.includes('ig') || t.includes('indicação')) return 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm';
      if (t.includes('apl') || t.includes('arranjo')) return 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm';
      return 'bg-slate-100 text-slate-700 border-slate-300 shadow-sm';
  };

  const handleForceRefresh = () => carregarDadosDoSharePoint(true);

  const handleToggleFilter = () => {
      setFiltroSemiarido(!filtroSemiarido);
      setSelectedLocation(null); 
      setSearchTerm(''); 
  };

  return (
    <div className="relative flex flex-col h-screen font-sans text-slate-800 overflow-hidden text-sm bg-slate-100">
      
      {/* FUNDO FIXO EM DEGRADÊ */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-100 via-white to-slate-200 pointer-events-none">
         <div className="absolute -top-[15%] -right-[5%] w-[60%] h-[60%] rounded-full bg-gov-blueDark-500/35 blur-[120px]"></div>
         <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gov-cyan-500/35 blur-[120px]"></div>
         <div className="absolute top-[25%] left-[25%] w-[45%] h-[45%] rounded-full bg-gov-magenta-500/20 blur-[130px]"></div>
      </div>

      {isLoadingPipeline && territoriosData.length === 0 && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-xl">
          <div className="w-12 h-12 border-4 border-gov-blueDark-100 border-t-gov-blueDark-500 rounded-full animate-spin mb-4 shadow-lg"></div>
          <h2 className="text-lg font-bold text-gov-blueDark-500 tracking-wide font-display">Sincronizando Base de Dados</h2>
          <p className="text-xs font-medium text-slate-500 mt-2">Conectando ao SharePoint SECTI...</p>
        </div>
      )}

      {/* DYNAMIC ISLAND NAVBAR */}
      <header className="fixed top-3 left-0 right-0 mx-auto w-[96%] max-w-[1600px] bg-white/65 backdrop-blur-lg border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] h-14 rounded-2xl flex items-center justify-between px-6 lg:px-8 z-[100] transition-all duration-500">
        <div className="flex items-center gap-6 lg:gap-10 h-full">
          <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight uppercase flex items-center gap-1.5 drop-shadow-sm">
            <span className="text-gov-blueDark-500">Painel</span>
            <span className="text-gov-red-500">Territorial</span>
          </h1>
          <nav className="flex items-center gap-4 sm:gap-6 h-full pt-0.5">
            <button onClick={() => setPage('overview')} className={`h-full flex items-center text-xs font-semibold transition-all border-b-[2px] ${page === 'overview' ? 'text-gov-blueDark-500 border-gov-blueDark-500' : 'text-slate-400 border-transparent hover:text-slate-700'}`}>Início</button>
            <button onClick={() => setPage('territorios')} className={`h-full flex items-center text-xs font-semibold transition-all border-b-[2px] ${page === 'territorios' ? 'text-gov-blueDark-500 border-gov-blueDark-500' : 'text-slate-400 border-transparent hover:text-slate-700'}`}>Territórios</button>
          </nav>
        </div>
        <div className="hidden md:flex items-center">
            <img src="/img/SECTI - SECRETARIA DE CIENCIA, TECNOLOGIA E INOVACAO - GOVBA 0126__H.png" alt="Logo SECTI" className="h-8 lg:h-9 object-contain drop-shadow-sm" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative w-full pt-20 sm:pt-24 pb-8 z-10">
        {page === 'overview' ? (
          <LandingHero onAccessDashboard={() => setPage('territorios')} />
        ) : (
          <div className="relative p-3 sm:p-4 lg:p-5 max-w-[1600px] mx-auto w-full min-h-full flex flex-col justify-start">

            <div className="relative w-full bg-white/75 backdrop-blur-xl rounded-2xl border border-white/60 shadow-glass p-4 sm:p-5 flex flex-col gap-3 transition-all duration-500">
              
              {/* BARRA DE AÇÕES E FILTROS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center border-b border-slate-200/60 pb-3">
                <div className="lg:col-span-2 relative w-full flex flex-col sm:flex-row items-center gap-2" ref={dropdownRef}>
                  <div className="w-full relative flex-1">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Filtrar Análise Territorial</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder={isLoadingPipeline ? "Sincronizando dados..." : "Pesquise por Município, Território, Tipo de Entidade ou Segmento..."}
                        value={searchTerm}
                        disabled={isLoadingPipeline}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                          if (!e.target.value) setSelectedLocation(null);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full bg-white/90 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs font-normal focus:outline-none focus:border-gov-blueDark-500 shadow-sm transition-all text-slate-800 placeholder-slate-400"
                      />
                      <svg className="w-4 h-4 text-slate-400 absolute left-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      {searchTerm && (
                        <button onClick={() => { setSearchTerm(''); setSelectedLocation(null); setIsDropdownOpen(false); }} className="absolute right-3 text-slate-400 hover:text-slate-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto pt-0 sm:pt-5">
                    <button 
                        onClick={handleToggleFilter}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 ${filtroSemiarido ? 'bg-gov-red-500 text-white hover:bg-gov-red-600' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        {filtroSemiarido ? (
                          <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>Recorte: Semiárido</>
                        ) : (
                          <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>Apenas Semiárido</>
                        )}
                    </button>
                  </div>

                  {isDropdownOpen && searchTerm && (
                    <div className="absolute top-[100%] mt-1 w-full bg-white border border-slate-200/80 rounded-lg shadow-lg max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((item) => (
                          <button key={item.id} onClick={() => { setSelectedLocation(item); setSearchTerm(item.nome); setIsDropdownOpen(false); }} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-xs text-slate-800 block">{item.nome}</span>
                              {item.matchType === 'Território' ? (
                                 <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{item.regiao}</span>
                              ) : (
                                 <span className="text-[10px] text-gov-blueDark-500 font-medium">
                                     Correspondência em {item.matchType}: <span className="text-slate-700 font-bold">{item.matchText}</span>
                                 </span>
                              )}
                            </div>
                            {item.isSemiarido && <span className="text-[8px] font-bold text-gov-red-500 bg-gov-red-50 px-1.5 py-0.5 rounded-full border border-gov-red-100">Semiárido</span>}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-xs text-slate-400 font-medium italic text-center">Nenhum resultado encontrado para esta busca profunda.</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center lg:justify-end gap-2 lg:pt-5 w-full">
                  <button type="button" onClick={handleForceRefresh} disabled={isLoadingPipeline} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-700 disabled:opacity-70 shadow-sm w-full lg:w-auto">
                    {isLoadingPipeline ? 'Sincronizando...' : 'Atualizar Dados'}
                  </button>
                </div>
              </div>

              {/* 5 KPIS GLOBAIS COMPACTAS */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Indicadores Consolidados {selectedLocation ? `— ${selectedLocation.nome}` : (filtroSemiarido ? '— Recorte: Semiárido Baiano' : '— Estado da Bahia')}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium hidden sm:block">Última sincronização: {lastUpdate}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-white/85 border border-slate-200/60 p-3.5 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Capacidade Territorial</p>
                    <p className="text-2xl font-black text-gov-blueDark-500 mt-1">{dashboardData.topKpis.capacidadeCti}</p>
                    <div className="text-[10px] text-slate-500 mt-1.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-blueDark-500 mr-1.5"></span> Entidades em CT&I</div>
                  </div>
                  <div className="bg-white/85 border border-slate-200/60 p-3.5 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">D. Territorial (IFDM)</p>
                    <p className="text-2xl font-black text-gov-red-500 mt-1">{dashboardData.topKpis.ifdm}</p>
                    <div className="text-[10px] text-slate-500 mt-1.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-red-500 mr-1.5"></span> Média Ponderada</div>
                  </div>
                  <div className="bg-white/85 border border-slate-200/60 p-3.5 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Delimitação Semiárido</p>
                    <p className="text-xl font-black text-slate-700 mt-1 truncate" title={dashboardData.topKpis.coberturaSemiarido}>{dashboardData.topKpis.coberturaSemiarido}</p>
                    <div className="text-[10px] text-slate-500 mt-1.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span> Abrangência Municipal</div>
                  </div>
                  <div className="bg-white/85 border border-slate-200/60 p-3.5 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Assistência Pública</p>
                    <p className="text-xl font-black text-gov-cyan-700 mt-1 truncate">{dashboardData.topKpis.conectaBahia}</p>
                    <div className="text-[10px] text-slate-500 mt-1.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-cyan-500 mr-1.5"></span> Monitoramento Ativo</div>
                  </div>
                  <div className="bg-white/85 border border-slate-200/60 p-3.5 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Cadeias Produtivas</p>
                    <p className="text-2xl font-black text-slate-800 mt-1 truncate">{dashboardData.topKpis.cadeiasIgs}</p>
                    <div className="text-[10px] text-slate-500 mt-1.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-green-500 mr-1.5"></span> APLs e IGs Mapeadas</div>
                  </div>
                </div>
              </div>

              {/* MUNICÍPIOS HORIZONTAL SCROLL */}
              {selectedLocation && municipiosDoTerritorioSelecionado.length > 0 && (
                <div className="bg-white/85 border border-slate-200/60 p-3 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            Municípios Pertencentes {filtroSemiarido && <span className="text-gov-red-500">(Filtro Semiárido Ativo)</span>}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {municipiosDoTerritorioSelecionado.length} Cidades
                        </span>
                    </div>
                    
                    <div className="relative flex items-center group">
                        <button type="button" onClick={() => scrollMunsRef.current?.scrollBy({ left: -180, behavior: 'smooth' })} className="absolute left-0 h-full bg-gradient-to-r from-white via-white/95 to-transparent pr-10 pl-0.5 flex items-center justify-start z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-slate-900/90 text-white p-1 rounded-full shadow-md hover:bg-slate-800 transition-colors cursor-pointer border border-white/20">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            </div>
                        </button>

                        <div ref={scrollMunsRef} className="flex gap-2 overflow-x-auto pb-1 w-full scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {municipiosDoTerritorioSelecionado.map((m, idx) => {
                                const isSemi = semiaridoMunicipios.includes(normalize(m));
                                return (
                                    <span key={idx} className={`whitespace-nowrap bg-white text-slate-700 px-2 py-1 rounded text-[10px] font-semibold shadow-sm cursor-default hover:bg-slate-50 transition-colors border ${isSemi ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-200'}`}>
                                        {m}
                                    </span>
                                );
                            })}
                        </div>

                        <button type="button" onClick={() => scrollMunsRef.current?.scrollBy({ left: 180, behavior: 'smooth' })} className="absolute right-0 h-full bg-gradient-to-l from-white via-white/95 to-transparent pl-10 pr-0.5 flex items-center justify-end z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-slate-900/90 text-white p-1 rounded-full shadow-md hover:bg-slate-800 transition-colors cursor-pointer border border-white/20">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </button>
                    </div>

                    {!filtroSemiarido && (
                      <div className="text-[9px] text-slate-400 font-medium mt-1.5 flex items-center gap-1.5 select-none">
                          <span className="inline-block w-2 h-2 rounded border border-orange-500 bg-white"></span>
                          <span>Contorno laranja pertencente ao semiárido</span>
                      </div>
                    )}
                </div>
              )}

              {/* DETALHAMENTO HORIZONTAL */}
              <div className="mt-1 mb-1">
                 <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Detalhamento da Infraestrutura de CT&I</h4>
                 </div>
                 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    <div className="bg-white/90 border border-slate-200/60 p-2.5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-all">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Universidades</span>
                        <span className="text-xl font-black text-gov-blueDark-500">{dashboardData.subKpis.univs}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/60 p-2.5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-all">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Inst. Federais</span>
                        <span className="text-xl font-black text-gov-red-500">{dashboardData.subKpis.ifs}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/60 p-2.5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-all">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">ICTs</span>
                        <span className="text-xl font-black text-gov-cyan-500">{dashboardData.subKpis.icts}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/60 p-2.5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-all">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">C. Pesquisa</span>
                        <span className="text-xl font-black text-gov-green-500">{dashboardData.subKpis.centrosPesquisa}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/60 p-2.5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-all">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Espaços Dinam.</span>
                        <span className="text-xl font-black text-gov-cyan-700">{dashboardData.subKpis.espacos}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/60 p-2.5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-all">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Parques Tecn.</span>
                        <span className="text-xl font-black text-gov-magenta-500">{dashboardData.subKpis.parques}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/60 p-2.5 rounded-xl shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-all">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Incubadoras</span>
                        <span className="text-xl font-black text-gov-cyan-600">{dashboardData.subKpis.incubadoras}</span>
                    </div>
                 </div>
              </div>

              {/* LAYOUT ESPACIAL: MAPA (50%) + LISTAS (50%) */}
              <div className="flex flex-col lg:flex-row gap-4 items-stretch h-[700px] w-full mt-1">
                
                {/* MAPA */}
                <div className="w-full lg:w-[50%] bg-white rounded-xl border border-slate-200/80 p-2 shadow-sm relative flex flex-col h-full">
                  <div className="absolute top-4 left-4 bg-slate-900/85 text-white backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-semibold z-10 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-gov-green-500 animate-pulse"></span>
                    Malha Cartográfica
                  </div>
                  <div className="w-full h-full flex-1 rounded-lg overflow-hidden bg-slate-50/50">
                    <ConectaMap 
                      territoriosData={territoriosData} 
                      territoriesDynamicStats={territoriesDynamicStats} 
                      searchTerm={searchTerm} 
                      filtroSemiarido={filtroSemiarido} 
                      selectedTerritory={selectedLocation} 
                      semiaridoMunicipios={semiaridoMunicipios} 
                      onSelectTerritory={(loc) => {
                          setSelectedLocation(loc);
                          if(loc) setSearchTerm(loc.nome);
                          else setSearchTerm('');
                      }} 
                    />
                  </div>
                </div>

                {/* 3 LISTAS LATERAIS EMPILHADAS */}
                <div className="w-full lg:w-[50%] flex flex-col gap-4 h-full overflow-hidden">
                  
                  {/* Lista 1: Instituições CT&I */}
                  <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                     <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Estruturas CT&I Mapeadas</h4>
                        <span className="bg-gov-blueDark-100 text-gov-blueDark-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{dashboardData.entidades.length}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-3 bg-slate-50/40">
                        <div className="flex flex-col gap-2">
                           {dashboardData.entidades.length > 0 ? (
                               dashboardData.entidades.map((ent, idx) => (
                                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200/60 bg-white shadow-sm flex flex-col gap-1 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300">
                                      <span className="text-xs font-bold text-slate-800 leading-tight">{ent.entidade}</span>
                                      <div className="flex justify-between items-end mt-1">
                                         <span className="text-[9px] font-bold uppercase text-gov-blueDark-500 bg-gov-blueDark-50 px-1.5 py-0.5 rounded border border-gov-blueDark-100">
                                             {ent.tipo || "Instituição"}
                                         </span>
                                         <div className="text-right">
                                             <span className="block text-[10px] text-slate-600 font-semibold">{ent.municipio}</span>
                                             {!selectedLocation && <span className="block text-[9px] text-slate-400 font-medium mt-0.5">{ent.territorioRef}</span>}
                                         </div>
                                      </div>
                                  </div>
                               ))
                           ) : (
                               <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                                   <span className="text-[10px] text-slate-400 font-medium">Nenhuma instituição mapeada nesta pesquisa.</span>
                               </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Lista 2: Cadeias Produtivas e IGs */}
                  <div className="flex-[1.2] min-h-0 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                     <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Cadeias Produtivas e IGs</h4>
                        <span className="bg-gov-green-100 text-gov-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{dashboardData.aplIgs.length}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-3 bg-slate-50/40">
                        <div className="flex flex-col gap-2.5">
                           {dashboardData.aplIgs.length > 0 ? (
                               dashboardData.aplIgs.map((apl, idx) => (
                                  <div key={idx} className="p-3 rounded-lg border border-slate-200/60 bg-white shadow-sm flex flex-col gap-2 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300">
                                      
                                      <div className="flex items-start justify-between gap-1.5 mb-0.5">
                                         <span className="text-[10px] font-bold uppercase text-gov-green-800 bg-gov-green-100 px-2 py-1 rounded border border-gov-green-300 flex-1">
                                             Cadeia: {apl.segmento}
                                         </span>
                                      </div>
                                      
                                      <div className="flex items-center">
                                         <span className={`text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap border ${getBadgeStyle(apl.tipo)}`}>
                                             Tipo: {apl.tipo}
                                         </span>
                                      </div>
                                      
                                      {apl.entidade && (
                                          <span className="text-xs font-black text-slate-800 leading-tight mt-1 px-0.5">
                                              {apl.entidade}
                                          </span>
                                      )}
                                      
                                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1 shadow-inner">
                                          <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Municípios Pertencentes:</span>
                                          <p className="text-[10px] text-slate-700 font-medium leading-relaxed break-words whitespace-normal">
                                              {apl.municipiosPertencentes}
                                          </p>
                                      </div>
                                      
                                      <div className="flex justify-between items-end mt-1.5 pt-1.5 border-t border-slate-100/80 px-0.5">
                                         <div className="text-left">
                                             <span className="block text-[9px] text-slate-500 italic mb-0.5">Sede/Satélite: <span className="font-bold text-slate-700">{apl.sede}</span></span>
                                             {apl.fonte && (
                                                <a href={apl.fonte} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-600 hover:text-blue-800 underline font-bold tracking-wide transition-colors">
                                                    ACESSAR FONTE
                                                </a>
                                             )}
                                         </div>
                                         {!selectedLocation && !filtroSemiarido && (
                                             <span className="text-right text-[9px] text-slate-400 font-bold">
                                                 {apl.territorioRef}
                                             </span>
                                         )}
                                      </div>
                                  </div>
                               ))
                           ) : (
                               <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                                   <span className="text-[10px] text-slate-400 font-medium">Nenhuma cadeia localizada nesta pesquisa.</span>
                               </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Lista 3: Assistência Pública */}
                  <div className="flex-[0.8] min-h-0 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                     <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Assistência Pública</h4>
                        <span className="bg-gov-cyan-100 text-gov-cyan-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{dashboardData.assistencias.length}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-3 bg-slate-50/40">
                        <div className="flex flex-col gap-2">
                           {dashboardData.assistencias.length > 0 ? (
                               dashboardData.assistencias.map((ast, idx) => (
                                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200/60 bg-white shadow-sm flex flex-col gap-1 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300">
                                      <span className="text-[11px] font-bold text-slate-800 leading-snug">{ast.nome}</span>
                                      <div className="flex justify-between items-end mt-1">
                                         <div className="text-left">
                                             <span className="block text-[10px] text-slate-600 font-semibold">{ast.municipio}</span>
                                         </div>
                                         {!selectedLocation && (
                                             <span className="text-right text-[9px] text-slate-400 font-medium">{ast.territorioRef}</span>
                                         )}
                                      </div>
                                  </div>
                               ))
                           ) : (
                               <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                                   <span className="text-[10px] text-slate-400 font-medium">Em levantamento.</span>
                               </div>
                           )}
                        </div>
                     </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}