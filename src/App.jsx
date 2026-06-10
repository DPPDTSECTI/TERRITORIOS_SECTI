import React, { useState, useRef, useEffect, useMemo } from 'react';
import ConectaMap from "../ConectaMap"; 
import LandingHero from './components/hero';
import territoriosMunicipios from '../utils/territorioMunicipios.json';

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
      
      <style>{`
        @keyframes softFadeInUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-soft-fade {
          animation: softFadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-100 via-zinc-50 to-gray-200 pointer-events-none"></div>

      {isLoadingPipeline && territoriosData.length === 0 && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-xl">
          <div className="w-12 h-12 border-4 border-gov-blueDark-100 border-t-gov-blueDark-500 rounded-full animate-spin mb-4 shadow-lg"></div>
          <h2 className="text-[14px] font-bold text-gov-blueDark-500 tracking-wide font-display">Sincronizando Base de Dados</h2>
          <p className="text-[10px] font-medium text-slate-500 mt-2">Conectando ao SharePoint SECTI...</p>
        </div>
      )}

      {/* NAVBAR REDUZIDO (-20%) */}
      <header className="fixed top-2 left-0 right-0 mx-auto w-[98%] max-w-[1600px] bg-white/65 backdrop-blur-lg border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] h-12 rounded-xl flex items-center justify-between px-5 lg:px-6 z-[100] transition-all duration-500">
        <div className="flex items-center gap-5 lg:gap-8 h-full">
          <h1 className="text-[11px] sm:text-xs font-bold text-slate-800 tracking-tight uppercase flex items-center gap-1 drop-shadow-sm">
            <span className="text-gov-blueDark-500">Painel</span>
            <span className="text-gov-red-500">Territorial</span>
          </h1>
          <nav className="flex items-center gap-3 sm:gap-4 h-full pt-0.5">
            <button onClick={() => setPage('overview')} className={`h-full flex items-center text-[10px] font-semibold transition-all border-b-[2px] ${page === 'overview' ? 'text-gov-blueDark-500 border-gov-blueDark-500' : 'text-slate-400 border-transparent hover:text-slate-700'}`}>Início</button>
            <button onClick={() => setPage('territorios')} className={`h-full flex items-center text-[10px] font-semibold transition-all border-b-[2px] ${page === 'territorios' ? 'text-gov-blueDark-500 border-gov-blueDark-500' : 'text-slate-400 border-transparent hover:text-slate-700'}`}>Territórios</button>
          </nav>
        </div>
        <a href="https://www.ba.gov.br/" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center">
          <img src="/img/Brasa╠âo-Horizontal_Preto.png" alt="GOV BA" className="h-6 lg:h-7 object-contain drop-shadow-sm" />
        </a>
      </header>

      <main className={`flex-1 overflow-y-auto relative w-full z-10 ${page === 'overview' ? '' : 'pt-16 sm:pt-20 pb-6'}`}>
        
        {page === 'overview' ? (
          <div key="overview" className="animate-soft-fade h-full">
            <LandingHero onAccessDashboard={() => setPage('territorios')} />
          </div>
        ) : (
          // CONTAINER PRINCIPAL: Mais largo (max-w 98%) e com padding menor
          <div key="territorios" className="animate-soft-fade relative p-2 max-w-[98%] 2xl:max-w-[1600px] mx-auto w-full min-h-full flex flex-col justify-start">

            <div className="relative w-full bg-white/70 backdrop-blur-xl rounded-xl border border-white/60 shadow-sm p-3 flex flex-col gap-2 transition-all duration-500">
              
              {/* BARRA DE AÇÕES COMPACTA */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-center border-b border-slate-200/60 pb-2">
                <div className="lg:col-span-2 relative w-full flex flex-col sm:flex-row items-center gap-1.5" ref={dropdownRef}>
                  <div className="w-full relative flex-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Filtrar Análise Territorial</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder={isLoadingPipeline ? "Sincronizando..." : "Pesquise por Município, Território ou Entidade..."}
                        value={searchTerm}
                        disabled={isLoadingPipeline}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                          if (!e.target.value) setSelectedLocation(null);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full bg-white border border-slate-200 rounded-md pl-7 pr-7 py-1 text-[10px] font-normal focus:outline-none focus:border-gov-blueDark-500 shadow-sm transition-all text-slate-800 placeholder-slate-400"
                      />
                      <svg className="w-3 h-3 text-slate-400 absolute left-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      {searchTerm && (
                        <button onClick={() => { setSearchTerm(''); setSelectedLocation(null); setIsDropdownOpen(false); }} className="absolute right-2 text-slate-400 hover:text-slate-600">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto pt-0 sm:pt-4">
                    <button 
                        onClick={handleToggleFilter}
                        className={`w-full sm:w-auto px-2.5 py-1 rounded-md font-bold text-[10px] transition-all shadow-sm flex items-center justify-center gap-1 border ${filtroSemiarido ? 'bg-gov-red-500 border-gov-red-600 text-white hover:bg-gov-red-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        {filtroSemiarido ? (
                          <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>Recorte: Semiárido</>
                        ) : (
                          <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>Apenas Semiárido</>
                        )}
                    </button>
                  </div>

                  {isDropdownOpen && searchTerm && (
                    <div className="absolute top-[100%] mt-0.5 w-full bg-white border border-slate-200/80 rounded-md shadow-lg max-h-48 overflow-y-auto z-50 divide-y divide-slate-100">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((item) => (
                          <button key={item.id} onClick={() => { setSelectedLocation(item); setSearchTerm(item.nome); setIsDropdownOpen(false); }} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 flex items-center justify-between transition-colors">
                            <div className="flex flex-col">
                              <span className="font-bold text-[10px] text-slate-800 block">{item.nome}</span>
                              {item.matchType === 'Território' ? (
                                 <span className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">{item.regiao}</span>
                              ) : (
                                 <span className="text-[8px] text-gov-blueDark-500 font-medium">
                                     Correspondência em {item.matchType}: <span className="text-slate-700 font-bold">{item.matchText}</span>
                                 </span>
                              )}
                            </div>
                            {item.isSemiarido && <span className="text-[7px] font-bold text-gov-red-500 bg-gov-red-50 px-1 py-0.5 rounded-full border border-gov-red-100">Semiárido</span>}
                          </button>
                        ))
                      ) : (
                        <div className="px-2 py-2 text-[10px] text-slate-400 font-medium italic text-center">Nenhum resultado.</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center lg:justify-end gap-1.5 lg:pt-4 w-full">
                  <button type="button" onClick={handleForceRefresh} disabled={isLoadingPipeline} className="inline-flex items-center justify-center gap-1 rounded-md bg-slate-900 border border-slate-800 px-2.5 py-1 text-[10px] font-semibold text-white transition-all hover:bg-slate-700 disabled:opacity-70 shadow-sm w-full lg:w-auto">
                    {isLoadingPipeline ? 'Sincronizando...' : 'Atualizar Dados'}
                  </button>
                </div>
              </div>

              {/* KPIS GLOBAIS MAIS COMPACTAS */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                    Visão Geral {selectedLocation ? `— ${selectedLocation.nome}` : (filtroSemiarido ? '— Semiárido' : '— Bahia')}
                  </h3>
                  <span className="text-[8px] text-slate-400 font-medium hidden sm:block">Atualizado às {lastUpdate}</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                  <div className="bg-white/80 border border-slate-200/60 px-2.5 py-1.5 rounded-md shadow-sm hover:shadow flex flex-col justify-between">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Capacidade CTI</p>
                    <p className="text-lg font-black text-gov-blueDark-500 leading-none">{dashboardData.topKpis.capacidadeCti}</p>
                    <div className="text-[8px] text-slate-400 mt-1 flex items-center"><span className="w-1 h-1 rounded-full bg-gov-blueDark-500 mr-1"></span> Entidades</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 px-2.5 py-1.5 rounded-md shadow-sm hover:shadow flex flex-col justify-between">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">D. Territ. (IFDM)</p>
                    <p className="text-lg font-black text-gov-red-500 leading-none">{dashboardData.topKpis.ifdm}</p>
                    <div className="text-[8px] text-slate-400 mt-1 flex items-center"><span className="w-1 h-1 rounded-full bg-gov-red-500 mr-1"></span> Média Ponderada</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 px-2.5 py-1.5 rounded-md shadow-sm hover:shadow flex flex-col justify-between">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Semiárido</p>
                    <p className="text-base font-black text-slate-700 leading-none truncate" title={dashboardData.topKpis.coberturaSemiarido}>{dashboardData.topKpis.coberturaSemiarido}</p>
                    <div className="text-[8px] text-slate-400 mt-1 flex items-center"><span className="w-1 h-1 rounded-full bg-slate-400 mr-1"></span> Abrangência</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 px-2.5 py-1.5 rounded-md shadow-sm hover:shadow flex flex-col justify-between">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Conecta Bahia</p>
                    <p className="text-base font-black text-gov-cyan-700 leading-none truncate">{dashboardData.topKpis.conectaBahia}</p>
                    <div className="text-[8px] text-slate-400 mt-1 flex items-center"><span className="w-1 h-1 rounded-full bg-gov-cyan-500 mr-1"></span> Assistência</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 px-2.5 py-1.5 rounded-md shadow-sm hover:shadow flex flex-col justify-between">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Cadeias Produtivas</p>
                    <p className="text-lg font-black text-slate-800 leading-none truncate">{dashboardData.topKpis.cadeiasIgs}</p>
                    <div className="text-[8px] text-slate-400 mt-1 flex items-center"><span className="w-1 h-1 rounded-full bg-gov-green-500 mr-1"></span> APLs & IGs</div>
                  </div>
                </div>
              </div>

              {/* SCROLL MUNICÍPIOS */}
              {selectedLocation && municipiosDoTerritorioSelecionado.length > 0 && (
                <div className="bg-white/80 border border-slate-200/50 px-2.5 py-1.5 rounded-md shadow-sm mt-0.5">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                            Municípios {filtroSemiarido && <span className="text-gov-red-500">(Filtro Ativo)</span>}
                        </span>
                        <span className="text-[7px] font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                            {municipiosDoTerritorioSelecionado.length}
                        </span>
                    </div>
                    
                    <div className="relative flex items-center group">
                        <button type="button" onClick={() => scrollMunsRef.current?.scrollBy({ left: -150, behavior: 'smooth' })} className="absolute left-0 h-full bg-gradient-to-r from-white via-white/90 to-transparent pr-6 pl-0.5 flex items-center justify-start z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-slate-800 text-white p-0.5 rounded-full shadow hover:bg-slate-700 cursor-pointer">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            </div>
                        </button>

                        <div ref={scrollMunsRef} className="flex gap-1 overflow-x-auto pb-0.5 w-full scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {municipiosDoTerritorioSelecionado.map((m, idx) => {
                                const isSemi = semiaridoMunicipios.includes(normalize(m));
                                return (
                                    <span key={idx} className={`whitespace-nowrap bg-white text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-semibold shadow-sm cursor-default hover:bg-slate-50 transition-colors border ${isSemi ? 'border-orange-400 ring-1 ring-orange-400/20' : 'border-slate-200'}`}>
                                        {m}
                                    </span>
                                );
                            })}
                        </div>

                        <button type="button" onClick={() => scrollMunsRef.current?.scrollBy({ left: 150, behavior: 'smooth' })} className="absolute right-0 h-full bg-gradient-to-l from-white via-white/90 to-transparent pl-6 pr-0.5 flex items-center justify-end z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-slate-800 text-white p-0.5 rounded-full shadow hover:bg-slate-700 cursor-pointer">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </button>
                    </div>

                    {!filtroSemiarido && (
                      <div className="text-[7px] text-slate-400 mt-1 flex items-center gap-1 select-none">
                          <span className="w-1 h-1 rounded border border-orange-400 bg-white"></span>
                          <span>Pertencente ao semiárido</span>
                      </div>
                    )}
                </div>
              )}

              {/* DETALHAMENTO HORIZONTAL CTI ULTRA-COMPACTO */}
              <div className="mt-0.5 mb-0.5">
                 <div className="grid grid-cols-4 lg:grid-cols-7 gap-1.5">
                    <div className="bg-white/80 border border-slate-200/50 py-1 px-1 rounded-md shadow-sm flex flex-col justify-center items-center text-center hover:shadow">
                        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Univs.</span>
                        <span className="text-base font-black text-gov-blueDark-500 leading-none">{dashboardData.subKpis.univs}</span>
                    </div>
                    <div className="bg-white/80 border border-slate-200/50 py-1 px-1 rounded-md shadow-sm flex flex-col justify-center items-center text-center hover:shadow">
                        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Inst. Fed.</span>
                        <span className="text-base font-black text-gov-red-500 leading-none">{dashboardData.subKpis.ifs}</span>
                    </div>
                    <div className="bg-white/80 border border-slate-200/50 py-1 px-1 rounded-md shadow-sm flex flex-col justify-center items-center text-center hover:shadow">
                        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">ICTs</span>
                        <span className="text-base font-black text-gov-cyan-500 leading-none">{dashboardData.subKpis.icts}</span>
                    </div>
                    <div className="bg-white/80 border border-slate-200/50 py-1 px-1 rounded-md shadow-sm flex flex-col justify-center items-center text-center hover:shadow">
                        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">C. Pesquisa</span>
                        <span className="text-base font-black text-gov-green-500 leading-none">{dashboardData.subKpis.centrosPesquisa}</span>
                    </div>
                    <div className="bg-white/80 border border-slate-200/50 py-1 px-1 rounded-md shadow-sm flex flex-col justify-center items-center text-center hover:shadow">
                        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Espaços</span>
                        <span className="text-base font-black text-gov-cyan-700 leading-none">{dashboardData.subKpis.espacos}</span>
                    </div>
                    <div className="bg-white/80 border border-slate-200/50 py-1 px-1 rounded-md shadow-sm flex flex-col justify-center items-center text-center hover:shadow">
                        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Parques</span>
                        <span className="text-base font-black text-gov-magenta-500 leading-none">{dashboardData.subKpis.parques}</span>
                    </div>
                    <div className="bg-white/80 border border-slate-200/50 py-1 px-1 rounded-md shadow-sm flex flex-col justify-center items-center text-center hover:shadow">
                        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Incub.</span>
                        <span className="text-base font-black text-gov-cyan-600 leading-none">{dashboardData.subKpis.incubadoras}</span>
                    </div>
                 </div>
              </div>

              {/* EXPANSÃO VERTICAL (MAPA E LISTAS AGORA COM MAIS ALTURA: h-[800px] a 90vh) */}
              <div className="flex flex-col lg:flex-row gap-2.5 items-stretch h-[800px] 2xl:h-[90vh] w-full mt-0.5">
                
                {/* MAPA */}
                <div className="w-full lg:w-[50%] bg-white rounded-lg border border-slate-200/80 p-2 shadow-sm relative flex flex-col h-full">
                  <div className="absolute top-2.5 left-2.5 bg-slate-800/90 text-white backdrop-blur-sm px-2 py-1 rounded text-[9px] font-semibold z-10 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-gov-green-500 animate-pulse"></span>
                    Malha Cartográfica
                  </div>
                  <div className="w-full h-full flex-1 rounded-md overflow-hidden bg-slate-50/50">
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

                {/* LISTAS LATERAIS (AGORA ENCURTADAS INTERNAMENTE PARA CABER O DOBRO DE ITEMS) */}
                <div className="w-full lg:w-[50%] flex flex-col gap-2.5 h-full overflow-hidden">
                  
                  {/* Lista 1: Instituições CT&I */}
                  <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                     <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Estruturas CT&I</h4>
                        <span className="bg-gov-blueDark-100 text-gov-blueDark-700 px-1.5 py-0.5 rounded text-[8px] font-bold">{dashboardData.entidades.length}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-2 bg-slate-50/30">
                        <div className="flex flex-col gap-1">
                           {dashboardData.entidades.length > 0 ? (
                               dashboardData.entidades.map((ent, idx) => (
                                  // Cartão Reduzido (p-1.5, gap-0.5)
                                  <div key={idx} className="p-1.5 rounded-md border border-slate-200/60 bg-white shadow-sm flex flex-col gap-0.5 transition-all hover:border-slate-300">
                                      <span className="text-[10px] font-bold text-slate-800 leading-tight">{ent.entidade}</span>
                                      <div className="flex justify-between items-end mt-0.5">
                                         <span className="text-[7px] font-bold uppercase text-gov-blueDark-500 bg-gov-blueDark-50 px-1 py-0.5 rounded border border-gov-blueDark-100">
                                             {ent.tipo || "Instituição"}
                                         </span>
                                         <div className="text-right">
                                             <span className="block text-[8px] text-slate-600 font-semibold">{ent.municipio}</span>
                                             {!selectedLocation && <span className="block text-[7px] text-slate-400">{ent.territorioRef}</span>}
                                         </div>
                                      </div>
                                  </div>
                               ))
                           ) : (
                               <div className="flex items-center justify-center p-2 text-center h-full">
                                   <span className="text-[9px] text-slate-400">Nenhuma estrutura encontrada.</span>
                               </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Lista 2: Cadeias Produtivas */}
                  <div className="flex-[1.2] min-h-0 bg-white rounded-lg border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                     <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Cadeias & IGs</h4>
                        <span className="bg-gov-green-100 text-gov-green-700 px-1.5 py-0.5 rounded text-[8px] font-bold">{dashboardData.aplIgs.length}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-2 bg-slate-50/30">
                        <div className="flex flex-col gap-1.5">
                           {dashboardData.aplIgs.length > 0 ? (
                               dashboardData.aplIgs.map((apl, idx) => (
                                  // Cartão Reduzido (p-1.5)
                                  <div key={idx} className="p-1.5 rounded-md border border-slate-200/60 bg-white shadow-sm flex flex-col transition-all hover:border-slate-300">
                                      <div className="flex items-start justify-between mb-0.5">
                                         <span className="text-[8px] font-bold uppercase text-gov-green-800 bg-gov-green-50 px-1 py-0.5 rounded border border-gov-green-200">
                                             {apl.segmento}
                                         </span>
                                         <span className={`text-[7px] font-bold px-1 py-0.5 rounded border ${getBadgeStyle(apl.tipo)}`}>
                                             {apl.tipo}
                                         </span>
                                      </div>
                                      
                                      {apl.entidade && (
                                          <span className="text-[10px] font-bold text-slate-700 leading-tight mt-0.5">
                                              {apl.entidade}
                                          </span>
                                      )}
                                      
                                      <div className="bg-slate-50 p-1 rounded border border-slate-100 mt-1">
                                          <span className="block text-[7px] font-bold text-slate-400 uppercase mb-0.5">Municípios:</span>
                                          <p className="text-[8px] text-slate-600 font-medium leading-tight">
                                              {apl.municipiosPertencentes}
                                          </p>
                                      </div>
                                      
                                      <div className="flex justify-between items-end mt-1 pt-1 border-t border-slate-100/80">
                                         <div className="text-left">
                                             <span className="block text-[7px] text-slate-500 italic">Sede: <span className="font-bold text-slate-700">{apl.sede}</span></span>
                                         </div>
                                         {!selectedLocation && !filtroSemiarido && (
                                             <span className="text-right text-[7px] text-slate-400 font-bold">{apl.territorioRef}</span>
                                         )}
                                      </div>
                                  </div>
                               ))
                           ) : (
                               <div className="flex items-center justify-center p-2 text-center h-full">
                                   <span className="text-[9px] text-slate-400">Nenhuma cadeia encontrada.</span>
                               </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Lista 3: Assistência */}
                  <div className="flex-[0.8] min-h-0 bg-white rounded-lg border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                     <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Assistência</h4>
                        <span className="bg-gov-cyan-100 text-gov-cyan-700 px-1.5 py-0.5 rounded text-[8px] font-bold">{dashboardData.assistencias.length}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-2 bg-slate-50/30">
                        <div className="flex flex-col gap-1">
                           {dashboardData.assistencias.length > 0 ? (
                               dashboardData.assistencias.map((ast, idx) => (
                                  <div key={idx} className="p-1.5 rounded-md border border-slate-200/60 bg-white shadow-sm flex flex-col gap-0.5 transition-all hover:border-slate-300">
                                      <span className="text-[9px] font-bold text-slate-700 leading-snug">{ast.nome}</span>
                                      <div className="flex justify-between items-end">
                                         <span className="text-[8px] text-slate-500 font-semibold">{ast.municipio}</span>
                                         {!selectedLocation && <span className="text-[7px] text-slate-400">{ast.territorioRef}</span>}
                                      </div>
                                  </div>
                               ))
                           ) : (
                               <div className="flex items-center justify-center p-2 text-center h-full">
                                   <span className="text-[9px] text-slate-400">Em levantamento.</span>
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