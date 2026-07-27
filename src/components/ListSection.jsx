import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Expand, Info, Filter, ExternalLink } from 'lucide-react';
import DataContext from '../context/DataContext';
import { resolveCadeiaFonte } from '../utils/cadeiasUtils';

export default function ListSection(props) {
  const context = useContext(DataContext) || {};

  const darkMode = props.darkMode ?? context.darkMode ?? false;
  const dashboardData = (props.dashboardData ?? context.dashboardData) || { entidades: [], aplIgs: [], cursos: [] };
  const cursosFiltrados = props.cursosFiltrados ?? context.cursosFiltrados ?? (dashboardData.cursos || []);
  const cursoSearchTerm = props.cursoSearchTerm ?? context.cursoSearchTerm ?? '';
  const setCursoSearchTerm = props.setCursoSearchTerm ?? context.setCursoSearchTerm ?? (() => {});
  const areaGeralSummary = props.areaGeralSummary ?? context.areaGeralSummary ?? [];
  const areaGeralFilter = props.areaGeralFilter ?? context.areaGeralFilter ?? [];
  const setAreaGeralFilter = props.setAreaGeralFilter ?? context.setAreaGeralFilter ?? (() => {});
  const handleAreaGeralToggle = props.handleAreaGeralToggle ?? context.handleAreaGeralToggle ?? (() => {});
  const expandedLists = props.expandedLists ?? context.expandedLists ?? [];
  const setExpandedLists = props.setExpandedLists ?? context.setExpandedLists ?? (() => {});

  const fixWeirdCapitalization = props.fixWeirdCapitalization ?? context.fixWeirdCapitalization ?? ((str) => str);
  const formatEntidadeTipo = props.formatEntidadeTipo ?? context.formatEntidadeTipo ?? ((t) => t);
  const getCtiBadgeStyle = props.getCtiBadgeStyle ?? context.getCtiBadgeStyle ?? (() => '');
  const getBadgeStyle = props.getBadgeStyle ?? context.getBadgeStyle ?? (() => '');
  const getAreaStyles = props.getAreaStyles ?? context.getAreaStyles ?? (() => ({ text: '', activeBg: '', countBg: '' }));
  const getAreaInfo = props.getAreaInfo ?? context.getAreaInfo ?? (() => ({ icon: null, acronym: '' }));

  const setExpandedCti = props.setExpandedCti;
  const setExpandedCadeia = props.setExpandedCadeia;
  const setExpandedCourse = props.setExpandedCourse;
  const isAreaGeralOpen = props.isAreaGeralOpen;
  const setIsAreaGeralOpen = props.setIsAreaGeralOpen;
  const areaGeralRef = props.areaGeralRef;

  const themeClasses = {
    cardHover: darkMode
      ? 'hover:border-blue-500/50 hover:bg-gray-800/80 hover:shadow-blue-900/10'
      : 'hover:border-gov-blue/40 hover:bg-white hover:shadow-lg hover:shadow-gray-200/50',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500'
  };

  return (
    <div data-tutorial="lists" className="flex-1 flex flex-col gap-4 h-auto lg:h-full lg:overflow-visible min-w-0 min-h-0">
      <div className="flex flex-col sm:flex-row gap-4 flex-none lg:flex-[0.8] min-h-0">

        {/* LISTA 1: ESTRUTURAS CT&I */}
        <div className={`w-full sm:w-1/2 h-[350px] lg:h-auto min-h-0 rounded-2xl overflow-visible border shadow-sm flex flex-col relative transition-all hover:z-[999] ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200/80'}`}>
          <div className={`p-4 rounded-t-2xl border-b flex items-center justify-between shrink-0 relative z-30 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
            <div className="flex items-center gap-1.5">
              <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Ativos de CT&I</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${darkMode ? 'bg-gov-cyan/20 text-cyan-400' : 'bg-gov-cyan/10 text-gov-cyan-dark'}`}>
                {dashboardData.entidades ? dashboardData.entidades.length : 0}
              </span>
              {!expandedLists.length && (
                <button data-tutorial="expand-button" onClick={() => setExpandedLists(['cti'])} className={`p-1 rounded-md transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`} title="Expandir lista">
                  <Expand size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 hide-scroll rounded-b-2xl">
            <div className="flex flex-col gap-2">
              {dashboardData.entidades && dashboardData.entidades.length > 0 ? (
                dashboardData.entidades.map((ent, idx) => (
                  <div key={idx} onClick={() => setExpandedCti && setExpandedCti(ent)} className={`p-3 rounded-lg border flex flex-col gap-1 transition-all duration-300 ${themeClasses.cardHover} ${darkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'} cursor-pointer`}>
                    <span className="text-[11px] font-bold leading-tight">{fixWeirdCapitalization(ent.entidade)}</span>
                    <div className="flex justify-between items-end mt-1">
                      <span className={`text-[8px] flex items-center font-black uppercase px-1.5 py-0.5 rounded border ${getCtiBadgeStyle(ent.categoria, darkMode)}`}>
                        {formatEntidadeTipo(ent.tipo, ent.categoria)}
                      </span>
                    </div>
                  </div>
                ))) : (<div className={`flex items-center justify-center h-full text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhuma infraestrutura mapeada para os filtros ativos.</div>)}
            </div>
          </div>
        </div>

        {/* LISTA 2: CADEIAS PRODUTIVAS */}
        <div className={`w-full sm:w-1/2 h-[350px] lg:h-auto min-h-0 rounded-2xl overflow-visible border shadow-sm flex flex-col relative transition-all hover:z-[999] ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200/80'}`}>
          <div className={`p-4 rounded-t-2xl border-b flex items-center justify-between shrink-0 relative z-30 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
            <div className="flex items-center gap-1.5">
              <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Cadeias Produtivas</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${darkMode ? 'bg-gov-green/20 text-green-400' : 'bg-gov-green/10 text-gov-green-dark'}`}>{dashboardData.aplIgs ? dashboardData.aplIgs.length : 0}</span>
              {!expandedLists.length && (
                <button onClick={() => setExpandedLists(['cadeias'])} className={`p-1 rounded-md transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`} title="Expandir lista">
                  <Expand size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 hide-scroll rounded-b-2xl">
            <div className="flex flex-col gap-2">
              {dashboardData.aplIgs && dashboardData.aplIgs.length > 0 ? dashboardData.aplIgs.map((apl, idx) => (
                <div key={idx} onClick={() => setExpandedCadeia && setExpandedCadeia(apl)} className={`p-3 rounded-lg border flex flex-col transition-all duration-300 ${themeClasses.cardHover} ${darkMode ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'} cursor-pointer`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${darkMode ? 'bg-gov-green/10 text-green-400 border-gov-green/20' : 'bg-gov-green/10 text-gov-green-dark border-gov-green/20'}`}>{apl.segmento}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${getBadgeStyle(apl.tipo)}`}>
                        {apl.tipo}
                      </span>
                      {apl.fonte && (
                        <div className="relative group flex items-center justify-center z-50 shrink-0" onClick={e => e.stopPropagation()}>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none" title="Ver fonte / artigo">
                            <Info size={12} />
                          </button>
                          <div className="absolute right-0 top-full pt-1 w-max max-w-[260px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[99999] pointer-events-none group-hover:pointer-events-auto">
                            <div className={`p-2.5 rounded-lg text-[9px] leading-snug shadow-2xl border backdrop-blur-xl ${darkMode ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                              <span className="block font-bold mb-1 opacity-70">Fonte dos Dados:</span>
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

                  {apl.entidade && (
                    <div className="mb-2">
                      <span className="block text-[7px] font-black uppercase tracking-widest opacity-50 mb-0.5 text-gov-blue dark:text-blue-400">Entidade Vinculada</span>
                      <span className={`block text-[11px] font-bold leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{fixWeirdCapitalization(apl.entidade)}</span>
                    </div>
                  )}

                  <div className={`p-2.5 rounded-md border mt-auto ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <span className="block text-[8px] font-black uppercase opacity-50 mb-0.5">Sede:</span>
                        <p className={`text-[10px] font-bold leading-relaxed opacity-90 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{apl.sede}</p>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black uppercase opacity-50 mb-0.5">Território(s):</span>
                        <p className={`text-[10px] font-bold leading-relaxed opacity-90 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{apl.territorios ? apl.territorios.join(', ') : 'N/A'}</p>
                      </div>
                    </div>

                    <div className={`pt-2 border-t ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                      <span className="block text-[8px] font-black uppercase opacity-50 mb-0.5">Municípios Pertencentes:</span>
                      <p className={`text-[9px] font-medium leading-relaxed opacity-80 line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} title={apl.municipiosPertencentes}>{apl.municipiosPertencentes}</p>
                    </div>
                  </div>
                </div>
              )) : (<div className={`flex items-center justify-center h-full text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhuma cadeia isolada para os filtros ativos.</div>)}
            </div>
          </div>
        </div>
      </div>

      {/* LISTA 3: CURSOS SUPERIORES */}
      <div data-tutorial="cursos-card" className={`lg:flex-[0.6] h-[350px] lg:h-auto min-h-0 relative rounded-2xl overflow-visible border shadow-sm flex flex-col transition-all hover:z-[999] ${darkMode ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200/80'}`}>
        <div className={`p-4 border-b flex items-center justify-between shrink-0 gap-3 relative z-30 rounded-t-2xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <h4 className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Cursos de CT&I</h4>
            <div className="relative group flex items-center justify-center z-40">
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4M12 8h.01"></path></svg>
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto z-[9999]">
                <div className={`w-max max-w-[220px] p-2 rounded-md text-[10px] leading-snug shadow-lg border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  <span className="block font-bold mb-1 opacity-70">Fonte dos Dados:</span>
                  <a href="https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior" target="_blank" rel="noreferrer" className="block leading-tight opacity-80 hover:opacity-100 transition-opacity">
                    INEP/ Censo de Educação Superior (2024)
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black hidden lg:inline-block ${darkMode ? 'bg-gov-cyan/20 text-cyan-400' : 'bg-gov-cyan/10 text-gov-cyan-dark'}`}>{cursosFiltrados.length}</span>
              {!expandedLists.length && (
                <button onClick={() => setExpandedLists(['cursos'])} className={`p-1 rounded-md transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`} title="Expandir lista">
                  <Expand size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-32 sm:w-40 lg:w-48">
              <input
                type="text"
                placeholder="Buscar curso..."
                value={cursoSearchTerm}
                onChange={(e) => setCursoSearchTerm(e.target.value)}
                className={`w-full h-8 pl-7 pr-7 rounded-md text-[9px] font-medium transition-all outline-none border shadow-sm ${darkMode ? 'bg-gray-900/50 border-gray-700 text-gray-200 focus:border-gov-green' : 'bg-white border-gray-200 text-gray-800 focus:border-gov-green'}`}
              />
              <svg className={`w-3 h-3 absolute left-2 top-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              {cursoSearchTerm && (
                <button onClick={() => setCursoSearchTerm('')} aria-label="Limpar pesquisa" className="absolute right-2 top-2.5 hover:text-gov-red text-gray-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {areaGeralSummary.length > 0 && (
              <div className="relative" ref={areaGeralRef}>
                <button
                  onClick={() => setIsAreaGeralOpen && setIsAreaGeralOpen(!isAreaGeralOpen)}
                  className={`h-8 px-3 rounded-md font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border shadow-sm ${isAreaGeralOpen || areaGeralFilter.length > 0 ? (darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700') : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')}`}
                >
                  {areaGeralFilter.length > 0 ? (
                    <div className="flex items-center gap-0.5">
                      {areaGeralFilter.map(areaName => (
                        <span key={areaName} className={`flex items-center justify-center [&>svg]:w-3 [&>svg]:h-3 ${getAreaStyles(areaName, darkMode).text}`} title={areaName}>
                          {getAreaInfo(areaName).icon}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <>
                      <Filter size={12} />
                      <span className="whitespace-nowrap hidden sm:inline">Filtros</span>
                    </>
                  )}
                </button>

                {isAreaGeralOpen && (
                  <div className={`absolute right-0 top-[100%] mt-2 w-64 sm:w-72 max-w-[85vw] rounded-lg p-2 shadow-2xl border z-[150] flex flex-col gap-1 backdrop-blur-2xl ${darkMode ? 'bg-gray-900/95 border-gray-700 text-gray-200' : 'bg-white/95 border-gray-200 text-gray-800'}`}>
                    <span className="block text-[8px] font-black uppercase tracking-widest opacity-60 mb-1 px-1">Áreas Gerais</span>
                    <div className="max-h-48 overflow-y-auto hide-scroll flex flex-col gap-1 pr-1">
                      {areaGeralSummary.map(area => {
                        const styles = getAreaStyles(area.name, darkMode);
                        const isSelected = areaGeralFilter.includes(area.name);
                        return (
                          <button
                            key={area.name}
                            onClick={() => handleAreaGeralToggle(area.name)}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all flex items-start sm:items-center justify-between gap-2 border ${isSelected ? styles.activeBg : (darkMode ? 'bg-transparent border-transparent hover:bg-gray-800' : 'bg-transparent border-transparent hover:bg-gray-50')}`}
                          >
                            <div className="flex items-center gap-1.5 pr-1">
                              <span className={`shrink-0 mt-0.5 sm:mt-0 ${styles.text}`}>{getAreaInfo(area.name).icon}</span>
                              <span className={`whitespace-normal leading-snug ${isSelected ? styles.text : (darkMode ? 'text-gray-300' : 'text-gray-600')}`}>{area.name}</span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] shrink-0 ${isSelected ? styles.countBg : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>{area.count}</span>
                          </button>
                        );
                      })}
                    </div>
                    {areaGeralFilter.length > 0 && (
                      <button onClick={() => { setAreaGeralFilter([]); setIsAreaGeralOpen && setIsAreaGeralOpen(false); }} className={`mt-1.5 w-full h-7 rounded-md font-bold text-[8px] uppercase tracking-wider border transition-colors ${darkMode ? 'border-gov-red/30 text-red-400 hover:bg-gov-red/20' : 'border-gov-red/30 text-gov-red-dark hover:bg-gov-red/10'}`}>Limpar Filtros</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 p-4 overflow-y-auto hide-scroll rounded-b-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {cursosFiltrados.length > 0 ? cursosFiltrados.map((curso, idx) => {
              const areaStyles = getAreaStyles(curso.areaGeral, darkMode);
              const { icon, acronym } = getAreaInfo(curso.areaGeral);
              return (
                <div
                  key={curso.id || idx}
                  onClick={() => setExpandedCourse && setExpandedCourse(curso)}
                  className={`p-3 rounded-lg border flex flex-col gap-2 transition-all duration-300 hover:-translate-y-0.5 ${areaStyles.text} hover:border-current ${darkMode ? 'bg-gray-900/40 border-gray-700/50' : 'bg-white shadow-sm border-gray-100'} cursor-pointer`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h5 className={`text-[11px] font-bold leading-snug ${darkMode ? 'text-gray-100' : 'text-gray-800'}`} title={fixWeirdCapitalization(curso.curso)}>{fixWeirdCapitalization(curso.curso)}</h5>
                    {curso.areaGeral && (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-1 border shrink-0 ${areaStyles.activeBg} ${areaStyles.text}`}>
                        {icon}
                        <span>{acronym}</span>
                      </span>
                    )}
                  </div>
                  <div className={`p-2 rounded-md border mt-auto ${darkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200/50'}`}>
                    <span className={`block text-[9px] font-bold mb-1 leading-tight ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} title={fixWeirdCapitalization(curso.entidade)}>{fixWeirdCapitalization(curso.entidade)}</span>
                  </div>
                </div>
              );
            }) : (
              <div className={`col-span-full flex items-center justify-center py-12 text-[10px] font-medium italic ${themeClasses.textMuted}`}>Nenhum curso encontrado para os filtros selecionados.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
