import React, { useState, useRef, useEffect, useMemo } from 'react';
import ConectaMap from "../ConectaMap"; 
import LandingHero from './components/hero';

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const pageFromUrl = queryParams.get('tab') || 'overview';
  const [page, setPage] = useState(pageFromUrl);
  
  const [territoriosData, setTerritoriosData] = useState([]);
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("Atualizando...");

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filtroSemiarido, setFiltroSemiarido] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // =======================================================================
  // INGESTÃO SEGURA E BLINDADA
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

      const territoriosFormatados = data.territories.map((t, index) => {
        const entidadesCTI = Array.isArray(t.capacidadeDetalhada) ? t.capacidadeDetalhada : [];
        const cadeiasAPL = Array.isArray(t.cadeiasProdutivasDetalhado) ? t.cadeiasProdutivasDetalhado : [];
        
        return {
          id: String(index + 1),
          nome: t.territory || "Desconhecido",
          tipo: 'Território',
          regiao: t.territory || "",
          isSemiarido: !!t.isSemiarido,
          entidadesDetalhadas: entidadesCTI,
          cadeiasProdutivasDetalhado: cadeiasAPL,
          assistenciaPublica: t.assistenciaPublica || { iniciativas: [] },
          desenvolvimento: t.desenvolvimento || { ifdmTi: 0, populacaoTotal: 0 },
          kpis: {
            capacidadeCti: String(entidadesCTI.length),
            ifdm: t.desenvolvimento?.ifdmTi ? Number(t.desenvolvimento.ifdmTi).toFixed(3) : "-",
            conectaBahia: t.assistenciaPublica?.existe ? "Presente" : "Não mapeado",
            cadeiasIgs: String(cadeiasAPL.length),
            coberturaSemiarido: t.isSemiarido ? "Pertencente" : "Exterior"
          }
        };
      });

      setTerritoriosData(territoriosFormatados);
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

  const filteredOptions = territoriosData.filter(item => {
    const matchesText = (item.nome || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemi = filtroSemiarido ? item.isSemiarido : true;
    return matchesText && matchesSemi;
  });

  // =======================================================================
  // PROCESSADOR CENTRAL DO DASHBOARD (A Deduplicação Matemática do ID)
  // =======================================================================
  const dashboardData = useMemo(() => {
    let targetList = selectedLocation 
      ? [selectedLocation] 
      : (filtroSemiarido ? territoriosData.filter(t => t.isSemiarido) : territoriosData);

    const kpisPanel = { univs: 0, ifs: 0, icts: 0, centrosPesquisa: 0, espacos: 0, parques: 0, incubadoras: 0 };
    
    const entidadesFlat = [];
    const aplIgsFlat = [];
    const assistenciasFlat = [];

    const globalUniqueCtiIds = new Set();
    const globalUniqueCadeiasIds = new Set();
    const assistenciasSet = new Map();

    let somaIfdmPop = 0;
    let somaPopulacao = 0;
    let totalTerritoriosComAssistencia = 0;

    targetList.forEach(t => {
        // --- 1. ESTRUTURAS CT&I ---
        t.entidadesDetalhadas.forEach(ent => {
            entidadesFlat.push({ ...ent, territorioRef: t.nome });

            if (ent.id && !globalUniqueCtiIds.has(ent.id)) {
                globalUniqueCtiIds.add(ent.id);
                if (ent.categoria && kpisPanel[ent.categoria] !== undefined) {
                    kpisPanel[ent.categoria] += 1;
                }
            }
        });
        
        // --- 2. CADEIAS PRODUTIVAS E IGS (Listagem Pura) ---
        t.cadeiasProdutivasDetalhado.forEach(cadeia => {
            aplIgsFlat.push({
                id: cadeia.id,
                segmento: cadeia.segmento || 'Sem Segmento', 
                entidade: cadeia.entidade || null,
                tipo: cadeia.tipo || null,
                quantidade: cadeia.quantidade || 1,
                fonte: cadeia.fonte || null,
                sede: cadeia.sede || 'Não informada', 
                territorioRef: t.nome 
            });

            if (cadeia.id) globalUniqueCadeiasIds.add(cadeia.id);
        });

        // --- 3. ASSISTÊNCIA PÚBLICA E IFDM ---
        if (t.assistenciaPublica?.existe) totalTerritoriosComAssistencia += 1;
        const iniArray = Array.isArray(t.assistenciaPublica?.iniciativas) ? t.assistenciaPublica.iniciativas : [];
        iniArray.forEach(ini => {
            const chaveAsst = `${ini}|${t.nome}`;
            if (!assistenciasSet.has(chaveAsst)) {
                assistenciasSet.set(chaveAsst, { nome: ini, municipio: 'Abrangência Territorial', territorioRef: t.nome });
            }
        });

        if (t.desenvolvimento?.ifdmTi && t.desenvolvimento?.populacaoTotal) {
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
    
    let coberturaStr = "0%";
    if (selectedLocation) {
        coberturaStr = selectedLocation.isSemiarido ? "Pertencente" : "Exterior";
    } else if (filtroSemiarido) {
        coberturaStr = "100% (Filtro Ativo)";
    } else {
        const totalSemi = territoriosData.filter(t => t.isSemiarido).length;
        const ttl = territoriosData.length || 27; 
        coberturaStr = ttl > 0 ? `${((totalSemi / 27) * 100).toFixed(1)}% do Estado` : "0%";
    }

    return { 
        topKpis: {
            capacidadeCti: String(globalUniqueCtiIds.size), 
            ifdm: mediaIfdm,
            conectaBahia: (selectedLocation || filtroSemiarido) ? "Em levantamento" : `${totalTerritoriosComAssistencia} Territórios`,
            cadeiasIgs: String(globalUniqueCadeiasIds.size), 
            coberturaSemiarido: coberturaStr
        }, 
        subKpis: kpisPanel, 
        entidades: uniqueVisualEntidades, 
        aplIgs: uniqueVisualCadeias, 
        assistencias: assistenciasList 
    };
  }, [selectedLocation, filtroSemiarido, territoriosData]);

  const handleForceRefresh = () => carregarDadosDoSharePoint(true);

  return (
    <div className="relative flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {isLoadingPipeline && territoriosData.length === 0 && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-xl">
          <div className="w-16 h-16 border-4 border-gov-blueDark-100 border-t-gov-blueDark-500 rounded-full animate-spin mb-4 shadow-lg"></div>
          <h2 className="text-xl font-bold text-gov-blueDark-500 tracking-wide font-display">Sincronizando Base de Dados</h2>
          <p className="text-sm font-medium text-slate-500 mt-2">Conectando ao SharePoint SECTI...</p>
        </div>
      )}

      <header className="absolute top-0 w-full bg-white/80 backdrop-blur-md h-16 sm:h-20 flex items-center justify-between px-6 sm:px-12 lg:px-16 shadow-sm border-b border-surface-border/40 z-50">
        <div className="flex items-center gap-8 lg:gap-12 h-full">
          <h1 className="text-lg sm:text-xl font-light text-slate-800 tracking-tight uppercase flex items-center gap-2">
            <span className="text-gov-blueDark-500">Painel</span>
            <span className="text-gov-red-500">Territorial</span>
          </h1>
          <nav className="flex items-center gap-6 sm:gap-8 h-full pt-1">
            <button onClick={() => setPage('overview')} className={`h-full flex items-center text-sm sm:text-base font-extralight transition-all border-b-[3px] ${page === 'overview' ? 'text-gov-blueDark-500 border-gov-blueDark-500 font-medium' : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'}`}>Início</button>
            <button onClick={() => setPage('territorios')} className={`h-full flex items-center text-sm sm:text-base font-extralight transition-all border-b-[3px] ${page === 'territorios' ? 'text-gov-blueDark-500 border-gov-blueDark-500 font-medium' : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'}`}>Territórios</button>
          </nav>
        </div>
        <div className="hidden md:flex items-center">
            <img src="/img/SECTI - SECRETARIA DE CIENCIA, TECNOLOGIA E INOVACAO - GOVBA 0126__H.png" alt="Logo SECTI" className="h-16 lg:h-16 object-contain" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative w-full pt-16 sm:pt-20">
        {page === 'overview' ? (
          <LandingHero onAccessDashboard={() => setPage('territorios')} />
        ) : (
          <div className="relative p-4 sm:p-6 lg:p-8 max-w-[1800px] mx-auto w-full min-h-full flex flex-col justify-start">
            
            <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gov-blueDark-500/20 blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gov-cyan-500/25 blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-gov-magenta-500/10 blur-[100px] pointer-events-none z-0"></div>

            <div className="relative w-full bg-white/70 backdrop-blur-md rounded-2xl border border-white/45 shadow-glass p-5 sm:p-7 z-10 flex flex-col gap-6 transition-all duration-500">
              
              {/* Barra de Ações e Filtros */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center border-b border-slate-200/60 pb-5">
                <div className="lg:col-span-2 relative w-full flex flex-col sm:flex-row items-center gap-3" ref={dropdownRef}>
                  <div className="w-full relative flex-1">
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Filtrar Análise Territorial</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder={isLoadingPipeline ? "Sincronizando dados..." : "Busque por Território de Identidade..."}
                        value={searchTerm}
                        disabled={isLoadingPipeline}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setIsDropdownOpen(true);
                          if (!e.target.value) setSelectedLocation(null);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full bg-white/90 border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm font-normal focus:outline-none focus:border-gov-blueDark-500 shadow-sm transition-all text-slate-800 placeholder-slate-400"
                      />
                      <svg className="w-5 h-5 text-slate-400 absolute left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      {searchTerm && (
                        <button onClick={() => { setSearchTerm(''); setSelectedLocation(null); setIsDropdownOpen(false); }} className="absolute right-4 text-slate-400 hover:text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto pt-0 sm:pt-6">
                    <button 
                        onClick={() => { setFiltroSemiarido(!filtroSemiarido); setSelectedLocation(null); }}
                        className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${filtroSemiarido ? 'bg-gov-red-500 text-white hover:bg-gov-red-600' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        {filtroSemiarido ? (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>Recorte: Semiárido</>
                        ) : (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>Apenas Semiárido</>
                        )}
                    </button>
                  </div>

                  {isDropdownOpen && searchTerm && (
                    <div className="absolute top-[100%] mt-1.5 w-full bg-white border border-slate-200/80 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 divide-y divide-slate-100">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((item) => (
                          <button key={item.id} onClick={() => { setSelectedLocation(item); setSearchTerm(item.nome); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-sm text-slate-800 block">{item.nome}</span>
                              <span className="text-xs text-slate-400">{item.regiao}</span>
                            </div>
                            {item.isSemiarido && <span className="text-[9px] font-bold text-gov-red-500 bg-gov-red-50 px-2 py-0.5 rounded-full">Semiárido</span>}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-400 font-light italic">Nenhum território localizado.</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center lg:justify-end gap-3 lg:pt-5 w-full">
                  <button type="button" onClick={handleForceRefresh} disabled={isLoadingPipeline} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700 disabled:opacity-70 shadow-sm w-full lg:w-auto">
                    {isLoadingPipeline ? 'Sincronizando...' : 'Atualizar Dados'}
                  </button>
                </div>
              </div>

              {/* 5 KPIS GLOBAIS */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Indicadores Consolidados {selectedLocation ? `— ${selectedLocation.nome}` : (filtroSemiarido ? '— Recorte: Semiárido Baiano' : '— Estado da Bahia')}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium hidden sm:block">Última sincronização: {lastUpdate}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-sm">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Capacidade Territorial</p>
                    <p className="text-3xl font-black text-gov-blueDark-500 mt-2">{dashboardData.topKpis.capacidadeCti}</p>
                    <div className="text-xs text-slate-500 mt-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-blueDark-500 mr-1.5"></span> Entidades em CT&I</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-sm">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">D. Territorial (IFDM)</p>
                    <p className="text-3xl font-black text-gov-red-500 mt-2">{dashboardData.topKpis.ifdm}</p>
                    <div className="text-xs text-slate-500 mt-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-red-500 mr-1.5"></span> Média Ponderada</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-sm">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Delimitação Semiárido</p>
                    <p className="text-2xl font-black text-slate-700 mt-2 truncate" title={dashboardData.topKpis.coberturaSemiarido}>{dashboardData.topKpis.coberturaSemiarido}</p>
                    <div className="text-xs text-slate-500 mt-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span> Proporção no Estado</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-sm">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Assistência Pública</p>
                    <p className="text-2xl font-black text-gov-cyan-700 mt-2 truncate">{dashboardData.topKpis.conectaBahia}</p>
                    <div className="text-xs text-slate-500 mt-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-cyan-500 mr-1.5"></span> Monitoramento Ativo</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-sm">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cadeias Produtivas</p>
                    <p className="text-3xl font-black text-slate-800 mt-2 truncate">{dashboardData.topKpis.cadeiasIgs}</p>
                    <div className="text-xs text-slate-500 mt-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-green-500 mr-1.5"></span> APLs e IGs Mapeadas</div>
                  </div>
                </div>
              </div>

              {/* AS 7 SUB-KPIS DE CT&I NA HORIZONTAL */}
              <div className="mt-2 mb-2">
                 <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalhamento da Infraestrutura de CT&I</h4>
                 </div>
                 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="bg-white/90 border border-slate-200/80 p-3 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Universidades</span>
                        <span className="text-2xl font-black text-gov-blueDark-500">{dashboardData.subKpis.univs}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/80 p-3 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Inst. Federais</span>
                        <span className="text-2xl font-black text-gov-red-500">{dashboardData.subKpis.ifs}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/80 p-3 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ICTs</span>
                        <span className="text-2xl font-black text-gov-cyan-500">{dashboardData.subKpis.icts}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/80 p-3 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Centros Pesq.</span>
                        <span className="text-2xl font-black text-gov-green-500">{dashboardData.subKpis.centrosPesquisa}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/80 p-3 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Espaços Dinam.</span>
                        <span className="text-2xl font-black text-gov-cyan-700">{dashboardData.subKpis.espacos}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/80 p-3 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Parques Tecn.</span>
                        <span className="text-2xl font-black text-gov-magenta-500">{dashboardData.subKpis.parques}</span>
                    </div>
                    <div className="bg-white/90 border border-slate-200/80 p-3 rounded-xl shadow-sm flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Incubadoras</span>
                        <span className="text-2xl font-black text-gov-cyan-600">{dashboardData.subKpis.incubadoras}</span>
                    </div>
                 </div>
              </div>

              {/* LAYOUT ESPACIAL: Mapa à Esquerda + 3 Listas à Direita */}
              <div className="flex flex-col lg:flex-row gap-5 items-stretch h-[800px] w-full mt-2">
                
                {/* MAPA */}
                <div className="flex-[2.5] bg-white rounded-xl border border-slate-200/80 p-2 shadow-inner relative overflow-hidden flex flex-col h-full">
                  <div className="absolute top-4 left-4 bg-slate-900/85 text-white backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold z-10 flex items-center gap-2 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-gov-green-500 animate-pulse"></span>
                    Malha Cartográfica Interativa
                  </div>
                  <div className="w-full h-full flex-1 rounded-lg overflow-hidden bg-slate-50/50">
                    <ConectaMap 
                      territoriosData={territoriosData} 
                      searchTerm={searchTerm} 
                      filtroSemiarido={filtroSemiarido} 
                      selectedTerritory={selectedLocation} 
                      onSelectTerritory={(loc) => {
                          setSelectedLocation(loc);
                          if(loc) setSearchTerm(loc.nome);
                          else setSearchTerm('');
                      }} 
                    />
                  </div>
                </div>

                {/* 3 LISTAS LATERAIS EMPILHADAS */}
                <div className="flex-[1.2] flex flex-col gap-4 h-full overflow-hidden">
                  
                  {/* Lista 1: Instituições CT&I */}
                  <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                     <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Estruturas Mapeadas</h4>
                        <span className="bg-gov-blueDark-100 text-gov-blueDark-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{dashboardData.entidades.length}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-3 bg-slate-50/40">
                        <div className="flex flex-col gap-2">
                           {dashboardData.entidades.length > 0 ? (
                               dashboardData.entidades.map((ent, idx) => (
                                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200/60 bg-white shadow-sm flex flex-col gap-1 transition-all hover:border-slate-300">
                                      <span className="text-xs font-bold text-slate-800 leading-tight">{ent.entidade}</span>
                                      <div className="flex justify-between items-end mt-1.5">
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
                                   <span className="text-[11px] text-slate-400 font-medium">Nenhuma instituição mapeada.</span>
                               </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Lista 2: Cadeias Produtivas */}
                  <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                     <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Cadeias Produtivas</h4>
                        <span className="bg-gov-green-100 text-gov-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{dashboardData.aplIgs.length}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-3 bg-slate-50/40">
                        <div className="flex flex-col gap-2">
                           {dashboardData.aplIgs.length > 0 ? (
                               dashboardData.aplIgs.map((apl, idx) => (
                                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200/60 bg-white shadow-sm flex flex-col gap-1 transition-all hover:border-slate-300">
                                      <div className="flex items-center justify-between mb-1">
                                         <span className="text-[10px] font-bold uppercase text-gov-green-700 bg-gov-green-50 px-1.5 py-0.5 rounded border border-gov-green-200">
                                             {apl.segmento}
                                         </span>
                                         {apl.quantidade > 1 && (
                                            <span className="text-[9px] font-bold text-slate-400">Qtd: {apl.quantidade}</span>
                                         )}
                                      </div>
                                      
                                      {apl.entidade && (
                                          <span className="text-[11px] font-bold text-slate-700 leading-tight block mt-1">{apl.entidade}</span>
                                      )}
                                      
                                      <div className="flex justify-between items-end mt-1.5">
                                         <div className="text-left">
                                             <span className="block text-[10px] text-slate-600 font-semibold">{apl.sede}</span>
                                             {apl.fonte && (
                                                <a href={apl.fonte} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-500 hover:text-blue-700 underline mt-1 block">
                                                    Ver Fonte
                                                </a>
                                             )}
                                         </div>
                                         {!selectedLocation && !filtroSemiarido && (
                                             <span className="text-right text-[9px] text-slate-400 font-medium">
                                                 {apl.territorioRef}
                                             </span>
                                         )}
                                      </div>
                                  </div>
                               ))
                           ) : (
                               <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                                   <span className="text-[11px] text-slate-400 font-medium">Nenhuma cadeia localizada.</span>
                               </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Lista 3: Assistência Pública */}
                  <div className="flex-[0.8] min-h-0 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden">
                     <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <h4 className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Assistência Pública</h4>
                        <span className="bg-gov-cyan-100 text-gov-cyan-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{dashboardData.assistencias.length}</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-3 bg-slate-50/40">
                        <div className="flex flex-col gap-2">
                           {dashboardData.assistencias.length > 0 ? (
                               dashboardData.assistencias.map((ast, idx) => (
                                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200/60 bg-white shadow-sm flex flex-col gap-1 transition-all hover:border-slate-300">
                                      <span className="text-[11px] font-bold text-slate-800 leading-snug">{ast.nome}</span>
                                      <div className="flex justify-between items-end mt-1.5">
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
                                   <span className="text-[11px] text-slate-400 font-medium">Em levantamento.</span>
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