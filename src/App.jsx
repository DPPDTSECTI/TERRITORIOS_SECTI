import React, { useState, useRef, useEffect } from 'react';
import ConectaMap from "../ConectaMap"; 
import LandingHero from './components/hero';

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const pageFromUrl = queryParams.get('tab') || 'overview';
  const [page, setPage] = useState(pageFromUrl);
  
  // Estados para a Pipeline do SharePoint
  const [territoriosData, setTerritoriosData] = useState([]);
  const [kpisGlobais, setKpisGlobais] = useState({ 
    capacidadeCti: "0", 
    ifdm: "0.000", 
    conectaBahia: "0", 
    cadeiasIgs: "Buscando..." 
  });
  const [isLoadingPipeline, setIsLoadingPipeline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("Atualizando...");

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // O "Coração" da Pipeline: Buscar dados do Vite Proxy (/api/sharepoint)
  const carregarDadosDoSharePoint = async (forcarRefresh = false) => {
    setIsLoadingPipeline(true);
    try {
      // Se forçar refresh, adicionamos um parâmetro para o Vite ignorar o devCache
      const url = forcarRefresh ? '/api/sharepoint?nocache=true' : '/api/sharepoint';
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Falha ao comunicar com o SharePoint');
      
      const data = await response.json();

      // Transformar o Array de 'territories' do Vite para o Formato dos Cards
      const territoriosFormatados = data.territories.map((t, index) => ({
        id: String(index + 1),
        nome: t.territory,
        tipo: 'Território',
        regiao: t.territory,
        kpis: {
          capacidadeCti: String(t.capacidade.entidadesTotal || 0),
          ifdm: t.desenvolvimento.ifdmTi ? t.desenvolvimento.ifdmTi.toFixed(3) : "-",
          conectaBahia: t.assistenciaPublica.existe ? "Presente" : "Não mapeado",
          // Pega o nome das até 2 maiores cadeias produtivas calculadas no Vite
          cadeiasIgs: t.cadeiasProdutivas && t.cadeiasProdutivas.length > 0 
            ? t.cadeiasProdutivas.map(c => c.cadeia).join(', ') 
            : "A definir"
        }
      }));

      // Popular os KPIs Globais usando o 'summary' do Vite
      setKpisGlobais({
        capacidadeCti: String(data.summary.totalEntidades || 0),
        ifdm: "0.685", // Pode ser substituído pelo cálculo real global posteriormente
        conectaBahia: `${data.summary.territoriosComAssistencia || 0} Territórios`,
        cadeiasIgs: "Dados da SEPLAN-BA"
      });

      setTerritoriosData(territoriosFormatados);
      
      // Formata a data e hora do processamento real do SharePoint
      const parsedDate = new Date(data.generatedAt);
      setLastUpdate(parsedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

    } catch (error) {
      console.error("[Painel] Erro fatal na pipeline:", error);
      setLastUpdate("Erro na Sincronização");
    } finally {
      setIsLoadingPipeline(false);
    }
  };

  // Roda uma única vez ao montar o componente
  useEffect(() => {
    carregarDadosDoSharePoint();
  }, []);

  // Controla o clique fora do menu de sugestões
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lógica de filtragem do Autocomplete
  const filteredOptions = territoriosData.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.regiao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Define as KPIs que aparecem no topo (Local ou Global)
  const activeKpis = selectedLocation ? selectedLocation.kpis : kpisGlobais;

  // Botão manual de Sincronização
  const handleForceRefresh = () => {
    carregarDadosDoSharePoint(true);
  };

  return (
    <div className="relative flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* TELA DE CARREGAMENTO INICIAL COM BLUR (OVERLAY) */}
      {isLoadingPipeline && territoriosData.length === 0 && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/70 backdrop-blur-xl">
          <div className="w-16 h-16 border-4 border-gov-blueDark-100 border-t-gov-blueDark-500 rounded-full animate-spin mb-4 shadow-lg"></div>
          <h2 className="text-xl font-bold text-gov-blueDark-500 tracking-wide font-display">Sincronizando Base de Dados</h2>
          <p className="text-sm font-medium text-slate-500 mt-2">Conectando ao SharePoint SECTI...</p>
        </div>
      )}

      {/* Barra de Navegação Superior */}
      <header className="absolute top-0 w-full bg-white/80 backdrop-blur-md h-16 sm:h-20 flex items-center justify-between px-6 sm:px-12 lg:px-16 shadow-sm border-b border-surface-border/40 z-50">
        <div className="flex items-center gap-8 lg:gap-12 h-full">
          <h1 className="text-lg sm:text-xl font-light text-slate-800 tracking-tight uppercase flex items-center gap-2">
            <span className="">Painel</span>
            <span className="">Territorial</span>
          </h1>
          <nav className="flex items-center gap-6 sm:gap-8 h-full pt-1">
            <button
              onClick={() => setPage('overview')}
              className={`h-full flex items-center text-sm sm:text-base font-extralight transition-all border-b-[3px] ${
                page === 'overview' 
                  ? 'text-gov-blueDark-500 border-gov-blueDark-500 font-medium' 
                  : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              Início
            </button>
            <button
              onClick={() => setPage('territorios')}
              className={`h-full flex items-center text-sm sm:text-base font-extralight transition-all border-b-[3px] ${
                page === 'territorios' 
                  ? 'text-gov-blueDark-500 border-gov-blueDark-500 font-medium' 
                  : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              Territórios
            </button>
          </nav>
        </div>
        <div className="hidden md:flex items-center">
            <img src="/img/SECTI - SECRETARIA DE CIENCIA, TECNOLOGIA E INOVACAO - GOVBA 0126__H.png" 
            alt="Logo SECTI" 
            className="h-16 lg:h-16 object-contain" />
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto relative w-full pt-16 sm:pt-20">
        
        {page === 'overview' ? (
          <LandingHero onAccessDashboard={() => setPage('territorios')} />
        ) : (
          <div className="relative p-4 sm:p-6 lg:p-8 max-w-[1650px] mx-auto w-full min-h-full flex flex-col justify-start">
            
            {/* Mesh Gradient de Fundo */}
            <div className="absolute top-[5%] right-[5%] w-[50%] h-[50%] rounded-full bg-gov-blueDark-500/10 blur-[130px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[5%] left-[5%] w-[45%] h-[45%] rounded-full bg-gov-cyan-500/15 blur-[130px] pointer-events-none z-0"></div>
            <div className="absolute top-[40%] left-[30%] w-[35%] h-[35%] rounded-full bg-gov-magenta-500/5 blur-[110px] pointer-events-none z-0"></div>

            <div className="relative w-full bg-white/70 backdrop-blur-md rounded-2xl border border-white/45 shadow-glass p-5 sm:p-7 z-10 flex-1 flex flex-col gap-6 transition-all duration-500">
              
              {/* Topo: Busca e Ferramentas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center border-b border-slate-200/60 pb-5">
                
                <div className="lg:col-span-2 relative w-full" ref={dropdownRef}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Filtrar Análise Territorial
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={isLoadingPipeline ? "Sincronizando dados..." : "Busque por Território de Identidade (ex: Chapada Diamantina, Litoral Sul...)"}
                      value={searchTerm}
                      disabled={isLoadingPipeline}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                        // Limpa a seleção ao apagar o texto
                        if (!e.target.value) setSelectedLocation(null);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full bg-white/90 border border-slate-200 rounded-xl pl-11 pr-10 py-3 text-sm font-normal focus:outline-none focus:border-gov-blueDark-500 focus:ring-2 focus:ring-gov-blueDark-500/20 shadow-sm transition-all text-slate-800 placeholder-slate-400 disabled:opacity-50"
                    />
                    <svg className="w-5 h-5 text-slate-400 absolute left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    
                    {searchTerm && (
                      <button 
                        onClick={() => { setSearchTerm(''); setSelectedLocation(null); setIsDropdownOpen(false); }}
                        className="absolute right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>

                  {/* Dropdown de Sugestões */}
                  {isDropdownOpen && searchTerm && (
                    <div className="absolute w-full mt-1.5 bg-white border border-slate-200/80 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 divide-y divide-slate-100 animate-fadeIn">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedLocation(item);
                              setSearchTerm(item.nome);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between transition-all"
                          >
                            <div>
                              <span className="font-semibold text-sm text-slate-800 block">{item.nome}</span>
                              <span className="text-xs text-slate-400">{item.regiao}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-400 font-light italic">Nenhum território localizado.</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center lg:justify-end gap-3 lg:pt-5 w-full">
                  <button
                    type="button"
                    onClick={handleForceRefresh}
                    disabled={isLoadingPipeline}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold tracking-wide text-white transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 shadow-sm whitespace-nowrap w-full lg:w-auto"
                  >
                    {isLoadingPipeline ? (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    )}
                    {isLoadingPipeline ? 'Conectando...' : 'Atualizar Dados'}
                  </button>
                </div>
              </div>

              {/* Grid das KPIs Oficiais */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Indicadores Consolidados {selectedLocation ? `— ${selectedLocation.nome}` : '— Bahia'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:block">
                    Última sincronização SECTI: {lastUpdate}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Capacidade Territorial</p>
                    <p className="text-2xl sm:text-3xl font-black text-gov-blueDark-500 mt-1">{activeKpis.capacidadeCti}</p>
                    <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 font-light"><span className="w-1.5 h-1.5 rounded-full bg-gov-blueDark-500"></span> Entidades em CT&I</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Desenvolvimento Territorial</p>
                    <p className="text-2xl sm:text-3xl font-black text-gov-red-500 mt-1">{activeKpis.ifdm}</p>
                    <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 font-light"><span className="w-1.5 h-1.5 rounded-full bg-gov-red-500"></span> Média Ponderada IFDM 2023</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Assistência Pública em CT&I</p>
                    <p className="text-xl sm:text-2xl font-black text-gov-cyan-700 mt-1.5">{activeKpis.conectaBahia}</p>
                    <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 font-light"><span className="w-1.5 h-1.5 rounded-full bg-gov-cyan-500"></span> Presença de Iniciativas</div>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Cadeias Produtivas</p>
                    <p className="text-[13px] sm:text-[15px] font-black text-slate-800 mt-1.5 truncate" title={activeKpis.cadeiasIgs}>{activeKpis.cadeiasIgs}</p>
                    <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5 font-light"><span className="w-1.5 h-1.5 rounded-full bg-gov-green-500"></span> APLs e IGs Principais</div>
                  </div>
                </div>
              </div>

              {/* Componente do Mapa (Recebendo os Props de Integração) */}
              <div className="flex-1 flex flex-col min-h-[450px] lg:min-h-[520px] bg-white rounded-xl border border-slate-200/80 p-2 shadow-inner relative overflow-hidden">
                <div className="absolute top-3 left-3 bg-slate-900/80 text-white backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium z-10 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gov-green-500 animate-pulse"></span>
                  Visualização Cartográfica Interativa
                </div>
                <div className="w-full h-full flex-1 rounded-lg overflow-hidden">
                  <ConectaMap 
                     territoriosData={territoriosData} 
                     searchTerm={searchTerm} 
                     selectedTerritory={selectedLocation} 
                     onSelectTerritory={(loc) => {
                         setSelectedLocation(loc);
                         if(loc) setSearchTerm(loc.nome);
                         else setSearchTerm('');
                     }} 
                  />
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}