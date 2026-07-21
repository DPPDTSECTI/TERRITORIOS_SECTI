import React, { useMemo, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Database, TrendingUp, Sun, GraduationCap, BarChart3, Info } from 'lucide-react';
import DataContext from '../context/DataContext';

export default function KpiSection(props) {
  const context = useContext(DataContext) || {};

  const darkMode = props.darkMode ?? context.darkMode ?? false;
  const selectedLocation = props.selectedLocation ?? context.selectedLocation;
  const filtroSemiarido = props.filtroSemiarido ?? context.filtroSemiarido;
  const lastUpdate = props.lastUpdate ?? context.lastUpdate ?? 'Sincronizado';
  const dashboardData = props.dashboardData ?? context.dashboardData;

  const themeClasses = {
    cardHover: darkMode
      ? 'hover:border-blue-500/50 hover:bg-gray-800/80 hover:shadow-blue-900/10'
      : 'hover:border-gov-blue/40 hover:bg-white hover:shadow-lg hover:shadow-gray-200/50',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500'
  };

  if (!dashboardData || !dashboardData.topKpis) return null;

  return (
    <div data-tutorial="kpis">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className={`text-[10px] font-black uppercase tracking-widest ${themeClasses.textMuted}`}>
          Cenário Global {selectedLocation ? `— ${selectedLocation.nome}` : (filtroSemiarido ? '— Semiárido Baiano' : '— Estado da Bahia')}
        </h3>
        <span className={`text-[9px] font-medium hidden sm:block ${themeClasses.textMuted}`}>Status: {lastUpdate}</span>
      </div>

      <div className="flex overflow-x-auto sm:overflow-visible snap-x hide-scroll sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3 pb-2 sm:pb-0">
        {[
          { l: 'Ativos de CT&I', v: dashboardData.topKpis.capacidadeCti, pct: dashboardData.topKpisPct.cti, c: darkMode ? 'text-blue-400' : 'text-[#0F4C81]', b: 'bg-[#0F4C81]', icon: <Database size={14} />, listType: 'cti' },
          { l: 'D. Territ. (IFDM)', v: dashboardData.topKpis.ifdm, pct: dashboardData.topKpisPct.ifdm, c: darkMode ? 'text-blue-400' : 'text-[#0F4C81]', b: 'bg-[#0F4C81]', icon: <TrendingUp size={14} />, sourceText: 'FIRJAN / IFDM (2021)', sourceLink: 'https://www.firjan.com.br/ifdm/' },
          { l: 'Semiárido', v: dashboardData.topKpis.coberturaSemiarido, pct: dashboardData.topKpisPct.semiarido, c: darkMode ? 'text-blue-400' : 'text-[#0F4C81]', b: 'bg-[#0F4C81]', icon: <Sun size={14} />, tr: true, sourceText: 'IBGE / Semiárido Brasileiro (2022)', sourceLink: 'https://www.ibge.gov.br/geociencias/cartas-e-mapas/mapas-regionais/15974-semiarido-brasileiro.html?=&t=o-que-e', unit: 'mun.' },
          { l: 'Cursos de CT&I', v: dashboardData.topKpis.cursos, pct: dashboardData.topKpisPct.cursos, c: darkMode ? 'text-blue-400' : 'text-[#0F4C81]', b: 'bg-[#0F4C81]', icon: <GraduationCap size={14} />, tr: true, sourceText: 'INEP / Censo da Educação Superior (2022)', sourceLink: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior', listType: 'cursos' },
          { l: 'Cadeias Produtivas', v: dashboardData.topKpis.cadeiasIgs, pct: dashboardData.topKpisPct.cadeias, c: darkMode ? 'text-blue-400' : 'text-[#0F4C81]', b: 'bg-[#0F4C81]', icon: <BarChart3 size={14} />, tr: true, sourceText: 'DataSebrae / Indicações Geográficas', sourceLink: '/sobre', listType: 'cadeias' },
        ].map((k, idx) => {
          let displayValue = k.v;
          if (k.l === 'Semiárido' && typeof k.v === 'string') {
            const match = k.v.match(/\((\d+)\s*mun\.\)/);
            if (match && match[1]) {
              displayValue = match[1];
            } else {
              const fractionMatch = k.v.match(/(\d+)\/\d+/);
              if (fractionMatch && fractionMatch[1]) {
                displayValue = fractionMatch[1];
              }
            }
          }
          return (
            <div
              key={idx}
              className={`relative p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:z-[999] shrink-0 w-[65vw] sm:w-auto snap-center ${themeClasses.cardHover} ${darkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-200/60'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`opacity-70 ${k.c}`}>{k.icon}</span>
                  <p className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{k.l}</p>
                </div>
                {k.sourceText && (
                  <div className="relative group flex items-center justify-center z-40">
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none">
                      <Info size={12} />
                    </button>
                    <div className="absolute right-0 top-full pt-1 w-max max-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[9999] pointer-events-none group-hover:pointer-events-auto">
                      <div className={`p-2.5 rounded-lg text-[10px] leading-snug shadow-2xl border backdrop-blur-xl ${darkMode ? 'bg-gray-900/95 text-gray-200 border-gray-700' : 'bg-white/95 text-gray-700 border-gray-200'}`}>
                        <span className="block font-bold mb-0.5 opacity-70">Fonte dos Dados:</span>
                        {k.sourceLink ? (
                          k.sourceLink.startsWith('/') ? (
                            <Link to={k.sourceLink} className="block leading-tight opacity-80 hover:opacity-100 transition-opacity">{k.sourceText}</Link>
                          ) : (
                            <a href={k.sourceLink} target="_blank" rel="noreferrer" className="block leading-tight opacity-80 hover:opacity-100 transition-opacity">{k.sourceText}</a>
                          )
                        ) : (
                          <span className="block leading-tight opacity-80">{k.sourceText}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <p className={`text-2xl lg:text-3xl font-black leading-none tracking-tight pb-1 ${k.c} ${k.tr ? 'truncate text-xl lg:text-2xl' : ''}`}>{displayValue}</p>
                {k.unit && <span className={`text-xs font-bold opacity-60 pb-1 ${k.c}`}>{k.unit}</span>}
              </div>
              <div className="w-full h-1.5 bg-gray-200/60 dark:bg-gray-700/60 rounded-full overflow-hidden mt-3">
                <div className={`h-full ${k.b} transition-all duration-700 ease-out rounded-full`} style={{ width: `${Math.min(100, Math.max(0, k.pct))}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SubKpiPanel(props) {
  const context = useContext(DataContext) || {};

  const darkMode = props.darkMode ?? context.darkMode ?? false;
  const selectedLocation = props.selectedLocation ?? context.selectedLocation;
  const dashboardData = props.dashboardData ?? context.dashboardData;
  const ctiFilters = props.ctiFilters ?? context.ctiFilters ?? {};
  const setCtiFilters = props.setCtiFilters ?? context.setCtiFilters ?? (() => {});

  const ctiFilterKeys = useMemo(() => [
    'campiUniversidadePublica', 'campiUniversidadePrivada', 'campiInstitutoFederal',
    'icts', 'centrosPesquisa', 'espacoDinamizadoress', 'parquesTecnologicos', 'incubadoras'
  ], []);

  const areAllCtiSelected = useMemo(() => {
    return ctiFilterKeys.every(key => ctiFilters[key]);
  }, [ctiFilters, ctiFilterKeys]);

  const toggleCtiFilter = (keyToToggle) => {
    setCtiFilters(prev => ({ ...prev, [keyToToggle]: !prev[keyToToggle] }));
  };

  const handleToggleAllCti = () => {
    const nextValue = !areAllCtiSelected;
    const newFilters = {};
    ctiFilterKeys.forEach(key => { newFilters[key] = nextValue; });
    setCtiFilters(newFilters);
  };

  const handleCtiKpiClick = (clickedKey) => {
    const activeKeys = ctiFilterKeys.filter(k => ctiFilters[k]);
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

  const subKpisList = useMemo(() => {
    if (!dashboardData?.subKpis) return [];
    const totals = dashboardData.subKpis;
    const items = [
      { id: 'campiUniversidadePublica', l: 'Campi Univ. Públicas', v: totals.campiUniversidadePublica, c: darkMode ? 'text-blue-400' : 'text-gov-blue', b: 'bg-gov-blue', sourceText: 'INEP / Censo da Educação Superior (2022)', sourceLink: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior' },
      { id: 'campiUniversidadePrivada', l: 'Campi Univ. Privadas', v: totals.campiUniversidadePrivada, c: darkMode ? 'text-blue-400' : 'text-gov-blue', b: 'bg-gov-blue', sourceText: 'INEP / Censo da Educação Superior (2022)', sourceLink: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior' },
      { id: 'campiInstitutoFederal', l: 'Campi Inst. Federais', v: totals.campiInstitutoFederal, c: darkMode ? 'text-blue-400' : 'text-gov-blue', b: 'bg-gov-blue', sourceText: 'INEP / Censo da Educação Superior (2022)', sourceLink: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior' },
      { id: 'icts', l: 'ICTs Mapeadas', v: totals.icts, c: darkMode ? 'text-cyan-400' : 'text-gov-cyan-dark', b: 'bg-gov-cyan', sourceText: 'MCTI / Cadastro Nacional de ICTs', sourceLink: 'https://www.gov.br/mcti/pt-br' },
      { id: 'centrosPesquisa', l: 'Centros de Pesquisa', v: totals.centrosPesquisa, c: darkMode ? 'text-cyan-400' : 'text-gov-cyan-dark', b: 'bg-gov-cyan', sourceText: 'CNPq / Diretório dos Grupos de Pesquisa', sourceLink: 'http://dgp.cnpq.br/dgp/faces/consulta/consulta_parametrizada.jsf' },
      { id: 'espacoDinamizadoress', l: 'Espaços Dinamizadores', v: totals.espacoDinamizadoress, c: darkMode ? 'text-teal-400' : 'text-gov-teal-dark', b: 'bg-gov-teal', sourceText: 'SECTI BA / Mapeamento de Inovação', sourceLink: 'https://www.secti.ba.gov.br/' },
      { id: 'parquesTecnologicos', l: 'Parques Tecnológicos', v: totals.parquesTecnologicos, c: darkMode ? 'text-purple-400' : 'text-gov-purple-dark', b: 'bg-gov-purple', sourceText: 'Anprotec / Parque Tecnológico da Bahia', sourceLink: 'https://anprotec.org.br/' },
      { id: 'incubadoras', l: 'Incubadoras de Empresas', v: totals.incubadoras, c: darkMode ? 'text-purple-400' : 'text-gov-purple-dark', b: 'bg-gov-purple', sourceText: 'Anprotec / Rede Baiana de Incubadoras', sourceLink: 'https://anprotec.org.br/' },
    ];
    const totalCTI = dashboardData?.topKpis?.capacidadeCtiNum || 1;
    return items.map(item => ({
      ...item,
      pct: (item.v / totalCTI) * 100
    }));
  }, [dashboardData, darkMode]);

  if (selectedLocation || subKpisList.length === 0) return null;

  return (
    <div data-tutorial="cti-panel" className={`relative z-30 hover:z-[999] w-full lg:w-52 flex-shrink-0 h-auto lg:h-full rounded-2xl border shadow-sm flex flex-col overflow-visible transition-all animate-soft-fade ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200/80'}`}>
      <div className={`p-4 rounded-t-2xl border-b flex items-center justify-between shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
        <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Ativos de CT&I
        </h4>
      </div>
      
      <div className="flex-1 min-h-0 overflow-visible p-3">
        <div className="flex flex-col gap-2">
          {subKpisList.map(kpi => (
            <div
              key={kpi.id}
              onClick={() => handleCtiKpiClick(kpi.id)}
              className={`relative p-2.5 px-3 rounded-lg border flex items-center justify-between text-left transition-all duration-300 cursor-pointer ${ctiFilters[kpi.id] ?? true ? 'opacity-100' : 'opacity-40 grayscale'} ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white/80 border-slate-200/50'}`}
            >
              <div className="min-w-0 flex-1 pr-1.5">
                <div className="flex items-start justify-between gap-1">
                  <span className={`text-[9px] font-bold uppercase tracking-wider leading-tight opacity-80 ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>{kpi.l}</span>
                  {kpi.sourceText && (
                    <div className="relative group flex items-center justify-center z-50 shrink-0 mt-0.5">
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none">
                        <Info size={11} />
                      </button>
                      
                      <div className="absolute left-full top-1/2 -translate-y-1/2 pl-2.5 w-max max-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto z-[99999]">
                        <div 
                          className={`p-2.5 rounded-lg text-[9px] leading-snug shadow-2xl border ${darkMode ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-white text-gray-700 border-gray-200'}`} 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="block font-bold mb-0.5 opacity-70">Fonte:</span>
                          <a href={kpi.sourceLink} target="_blank" rel="noreferrer" className="block leading-tight opacity-80 hover:opacity-100 transition-opacity">
                            {kpi.sourceText}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <span className={`block text-lg font-black leading-none pt-1.5 drop-shadow-sm ${kpi.c}`}>{kpi.v || 0}</span>
              </div>
              <div className="w-1.5 h-12 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden flex flex-col justify-end shrink-0 ml-1">
                <div className={`w-full ${kpi.b} transition-all duration-700 ease-out rounded-full`} style={{ height: `${Math.min(100, Math.max(0, kpi.pct))}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
