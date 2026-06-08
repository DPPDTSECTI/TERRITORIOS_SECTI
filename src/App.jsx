import React, { useState, useRef, useEffect, useMemo } from 'react';
import ConectaMap from "../ConectaMap"; 
import LandingHero from './components/hero';

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const pageFromUrl = queryParams.get('tab') || 'overview';
  const [page, setPage] = useState(pageFromUrl);
  
  // Estados para a Pipeline do SharePoint e Filtros
  const [territoriosData, setTerritoriosData] = useState([]);
  const [kpisGlobais, setKpisGlobais] = useState({ 
    capacidadeCti: "0", 
    ifdm: "0.000", 
    conectaBahia: "0", 
    cadeiasIgs: "Buscando...",
    coberturaSemiarido: "0%"
  });
  
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("Atualizando...");

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filtroSemiarido, setFiltroSemiarido] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Ingestão de Dados através do Proxy de Desenvolvimento
  const carregarDadosDoSharePoint = async (forcarRefresh = false) => {
    setIsLoadingPipeline(true);
    try {
      const url = forcarRefresh ? '/api/sharepoint?nocache=true' : '/api/sharepoint';
      console.log('[Frontend] Requisitando:', url);
      
      const response = await fetch(url);
      
      console.log('[Frontend] Response status:', response.status);
      console.log('[Frontend] Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Frontend] Erro HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      }
      
      const data = await response.json();
      console.log('[Frontend] Dados recebidos:', data.summary);

      // Formatação da estrutura de dados para consumo dos cards e mapa
      const territoriosFormatados = data.territories.map((t, index) => {
        // Filtra e limpa registros fantasmas de entidades vazias vindas da planilha
        const entidadesLimpas = (t.capacidadeDetalhada || t.capacidadeRows || []).filter(
          ent => ent.entidade && ent.entidade.trim() !== ''
        );

        // USA O VALOR ABSOLUTO DO BACKEND (fonte única de verdade)
        const totalRealEntidades = t.capacidade?.entidadesTotal || 0;

        return {
          id: String(index + 1),
          nome: t.territory,
          tipo: 'Território',
          regiao: t.territory,
          isSemiarido: t.isSemiarido || false,
          capacidadeBruta: t.capacidade || {},
          entidadesDetalhadas: entidadesLimpas, 
          desenvolvimento: t.desenvolvimento || {},
          kpis: {
            capacidadeCti: String(totalRealEntidades),
            ifdm: t.desenvolvimento.ifdmTi ? t.desenvolvimento.ifdmTi.toFixed(3) : "-",
            conectaBahia: t.assistenciaPublica.existe ? "Presente" : "Não mapeado",
            cadeiasIgs: t.cadeiasProdutivas && t.cadeiasProdutivas.length > 0 
              ? t.cadeiasProdutivas.map(c => c.cadeia).join(', ') 
              : "A definir",
            coberturaSemiarido: t.isSemiarido ? "Pertencente" : "Exterior"
          }
        };
      });

      // Cálculo do percentual de abrangência territorial do Semiárido no Estado
      const totalTerritorios = territoriosFormatados.length || 27;
      const totalSemi = territoriosFormatados.filter(t => t.isSemiarido).length;
      const pctSemiarido = totalTerritorios > 0 ? ((totalSemi / totalTerritorios) * 100).toFixed(1) : "0.0";

      // Consolidação do total global baseado no ÍNDICE ABSOLUTO DO BACKEND
      const totalEntidadesGlobal = territoriosFormatados.reduce((acc, t) => acc + (parseInt(t.kpis.capacidadeCti) || 0), 0);

      setKpisGlobais({
        capacidadeCti: String(totalEntidadesGlobal),
        ifdm: "0.685", 
        conectaBahia: `${data.summary.territoriosComAssistencia || 0} Territórios`,
        cadeiasIgs: "Indicadores Oficiais",
        coberturaSemiarido: `${pctSemiarido}% do Estado`
      });

      setTerritoriosData(territoriosFormatados);
      
      const parsedDate = new Date(data.generatedAt);
      setLastUpdate(parsedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      console.log('[Frontend] ✓ Dados carregados com sucesso');

    } catch (error) {
      console.error("[Frontend] Erro fatal na pipeline:", error);
      console.error("[Frontend] Stack:", error.stack);
      setLastUpdate(`Erro: ${error.message}`);
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
    const matchesText = item.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemi = filtroSemiarido ? item.isSemiarido : true;
    return matchesText && matchesSemi;
  });

  // Cálculo Dinâmico das KPIs Principais do Topo
  const activeKpis = useMemo(() => {
    if (selectedLocation) return selectedLocation.kpis;
    
    if (filtroSemiarido) {
      const semiaridoList = territoriosData.filter(t => t.isSemiarido);
      if (semiaridoList.length === 0) return kpisGlobais; 

      const totalEntidades = semiaridoList.reduce((acc, t) => acc + t.entidadesDetalhadas.length, 0);
      
      // Média Ponderada Real do IFDM para o recorte do Semiárido
      let somaIfdmPop = 0;
      let somaPopulacao = 0;
      semiaridoList.forEach(t => {
          if (t.desenvolvimento.ifdmTi && t.desenvolvimento.populacaoTotal) {
              somaIfdmPop += (t.desenvolvimento.ifdmTi * t.desenvolvimento.populacaoTotal);
              somaPopulacao += t.desenvolvimento.populacaoTotal;
          }
      });
      const mediaIfdmSemiarido = somaPopulacao > 0 ? (somaIfdmPop / somaPopulacao).toFixed(3) : "0.645";
      
      return {
        capacidadeCti: String(totalEntidades),
        ifdm: mediaIfdmSemiarido,
        conectaBahia: "Em levantamento",
        cadeiasIgs: "Recorte Ativo",
        coberturaSemiarido: "100% (Filtro Ativo)"
      };
    }

    return kpisGlobais;
  }, [selectedLocation, filtroSemiarido, territoriosData, kpisGlobais]);

  // Processamento e Classificação das Entidades para o Painel Lateral
  const sidePanelData = useMemo(() => {
    let targetList = selectedLocation 
      ? [selectedLocation] 
      : (filtroSemiarido ? territoriosData.filter(t => t.isSemiarido) : territoriosData);

    const kpisPanel = { univs: 0, ifs: 0, icts: 0, centrosPesquisa: 0, espacos: 0, parques: 0, incubadoras: 0 };
    const entidadesFlat = [];

    targetList.forEach(t => {
        if (t.entidadesDetalhadas) {
            t.entidadesDetalhadas.forEach(ent => {
                // Se o backend classificou como CT&I, o campo 'categoria' existe
                if (ent.categoria) {
                    kpisPanel[ent.categoria] = (kpisPanel[ent.categoria] || 0) + 1;
                    entidadesFlat.push({ ...ent, territorioRef: t.nome });
                }
            });
        }
    });

    entidadesFlat.sort((a, b) => (a.municipio || "").localeCompare(b.municipio || ""));
    return { kpis: kpisPanel, entidades: entidadesFlat };
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
          <div className="relative p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto w-full min-h-full flex flex-col justify-start">
            
            <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gov-blueDark-500/20 blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gov-cyan-500/25 blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-gov-magenta-500/10 blur-[100px] pointer-events-none z-0"></div>

            <div className="relative w-full bg-white/70 backdrop-blur-md rounded-2xl border border-white/45 shadow-glass p-5 sm:p-7 z-10 flex-1 flex flex-col gap-5 transition-all duration-500">
              
              {/* Barra de Ações e Filtros */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center border-b border-slate-200/60 pb-5">
                <div className="lg:col-span-2 relative w-full flex flex-col sm:flex-row items-center gap-3" ref={dropdownRef}>
                  <div className="w-full relative flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Filtrar Análise Territorial</label>
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

              {/* Grid Principal de KPIs Consolidadas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Indicadores Consolidados {selectedLocation ? `— ${selectedLocation.nome}` : (filtroSemiarido ? '— Recorte: Semiárido Baiano' : '— Estado da Bahia')}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:block">Última sincronização básica: {lastUpdate}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-white/80 border border-slate-200/60 p-3.5 rounded-xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Capacidade Territorial</p>
                    <p className="text-2xl font-black text-gov-blueDark-500 mt-1">{activeKpis.capacidadeCti}</p>
                    <div className="text-[9px] text-slate-500 mt-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-blueDark-500 mr-1"></span> Entidades em CT&I</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 p-3.5 rounded-xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">D. Territorial (IFDM)</p>
                    <p className="text-2xl font-black text-gov-red-500 mt-1">{activeKpis.ifdm}</p>
                    <div className="text-[9px] text-slate-500 mt-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-red-500 mr-1"></span> Média Ponderada</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 p-3.5 rounded-xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Delimitação Semiárido</p>
                    <p className="text-2xl font-black text-slate-700 mt-1 truncate" title={activeKpis.coberturaSemiarido}>{activeKpis.coberturaSemiarido}</p>
                    <div className="text-[9px] text-slate-500 mt-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 mr-1"></span> Proporção no Estado</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 p-3.5 rounded-xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Assistência Pública</p>
                    <p className="text-xl font-black text-gov-cyan-700 mt-1 truncate">{activeKpis.conectaBahia}</p>
                    <div className="text-[9px] text-slate-500 mt-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-cyan-500 mr-1"></span> Monitoramento Ativo</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 p-3.5 rounded-xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Cadeias Produtivas</p>
                    <p className="text-sm font-black text-slate-800 mt-2 truncate" title={activeKpis.cadeiasIgs}>{activeKpis.cadeiasIgs}</p>
                    <div className="text-[9px] text-slate-500 mt-1.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gov-green-500 mr-1"></span> APLs e IGs Ativas</div>
                  </div>
                </div>
              </div>

              {/* Layout de Exibição Espacial Dividida */}
              <div className="flex flex-col lg:flex-row gap-4 items-stretch h-[750px] lg:h-[850px] w-full">
                
                {/* Janela Esquerda: Cartografia Interactiva */}
                <div className="flex-[2] bg-white rounded-xl border border-slate-200/80 p-2 shadow-inner relative overflow-hidden flex flex-col h-full">
                  <div className="absolute top-3 left-3 bg-slate-900/80 text-white backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium z-10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gov-green-500 animate-pulse"></span>
                    Malha Cartográfica Interativa
                  </div>
                  <div className="w-full h-full flex-1 rounded-lg overflow-hidden">
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

                {/* Janela Direita: Listagem Empilhada Estruturada */}
                <div className="flex-[1.2] bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
                     <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Estruturas Mapeadas</h4>
                     <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                       {selectedLocation ? selectedLocation.nome : (filtroSemiarido ? 'Recorte: Região Semiárida' : 'Apurado Global do Estado')}
                     </p>
                  </div>
                  
                  {/* Categorização Lateral Específica das Sub-Entidades */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-white border-b border-slate-100 shrink-0">
                     <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
                         <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight mb-1">Campi Universitários</span>
                         <span className="text-xl font-black text-gov-blueDark-500">{sidePanelData.kpis.univs}</span>
                     </div>
                     <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
                         <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight mb-1">Institutos Federais</span>
                         <span className="text-xl font-black text-gov-red-500">{sidePanelData.kpis.ifs}</span>
                     </div>
                     <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
                         <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight mb-1">ICTs</span>
                         <span className="text-xl font-black text-gov-cyan-500">{sidePanelData.kpis.icts}</span>
                     </div>
                     <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
                         <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight mb-1">Centros de Pesquisa</span>
                         <span className="text-xl font-black text-gov-green-500">{sidePanelData.kpis.centrosPesquisa}</span>
                     </div>
                     <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
                         <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight mb-1">Espaços Dinamizadores</span>
                         <span className="text-xl font-black text-gov-cyan-700">{sidePanelData.kpis.espacos}</span>
                     </div>
                     <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
                         <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight mb-1">Parques Tecnológicos</span>
                         <span className="text-xl font-black text-gov-magenta-500">{sidePanelData.kpis.parques}</span>
                     </div>
                     <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col justify-between col-span-2">
                         <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight mb-1">Incubadoras Tecnológicas</span>
                         <span className="text-xl font-black text-gov-cyan-600">{sidePanelData.kpis.incubadoras}</span>
                     </div>
                  </div>

                  {/* Lista de Registros com Scroll Autônomo Vertical */}
                  <div className="flex-1 overflow-y-auto p-3 bg-slate-50/40">
                     <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                        Instituições Ativas 
                        <span className="bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{sidePanelData.entidades.length}</span>
                     </h5>
                     
                     <div className="flex flex-col gap-2">
                        {sidePanelData.entidades.length > 0 ? (
                            sidePanelData.entidades.map((ent, idx) => (
                               <div key={idx} className="p-3 rounded-xl border border-slate-200/80 bg-white shadow-sm flex flex-col gap-1.5 transition-all hover:border-slate-300">
                                   <span className="text-[11px] font-bold text-slate-800 leading-tight">{ent.entidade}</span>
                                   <div className="flex justify-between items-end mt-1">
                                      <span className="text-[9px] font-bold uppercase text-gov-blueDark-500 bg-gov-blueDark-50 px-1.5 py-0.5 rounded border border-gov-blueDark-100">
                                          {ent.tipo || "Instituição"}
                                      </span>
                                      <div className="text-right">
                                          <span className="block text-[10px] text-slate-600 font-semibold">{ent.municipio}</span>
                                          {!selectedLocation && (
                                              <span className="block text-[8px] text-slate-400 font-medium mt-0.5">{ent.territorioRef}</span>
                                          )}
                                      </div>
                                   </div>
                               </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                                <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                <span className="text-xs text-slate-400 font-light">Nenhuma entidade localizada para esta abrangência.</span>
                            </div>
                        )}
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