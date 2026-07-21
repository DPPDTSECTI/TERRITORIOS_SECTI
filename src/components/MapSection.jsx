import React, { useContext } from 'react';
import PtiMap from '../../PtiMap';
import DataContext from '../context/DataContext';

export default function MapSection(props) {
  const context = useContext(DataContext) || {};

  const mapSectionRef = props.mapSectionRef;
  const darkMode = props.darkMode ?? context.darkMode ?? false;
  const territoriosData = props.territoriosData ?? context.territoriosData;
  const territoriesDynamicStats = props.territoriesDynamicStats ?? context.territoriesDynamicStats;
  const filtroSemiarido = props.filtroSemiarido ?? context.filtroSemiarido;
  const selectedLocation = props.selectedLocation ?? context.selectedLocation;
  const semiaridoMunicipios = props.semiaridoMunicipios ?? context.semiaridoMunicipios;
  const handleSelectTerritory = props.handleSelectTerritory ?? context.handleSelectTerritory;
  const dashboardData = props.dashboardData ?? context.dashboardData;
  const ctiFilters = props.ctiFilters ?? context.ctiFilters;

  return (
    <div data-tutorial="map" ref={mapSectionRef} className="w-full lg:w-[40%] h-[280px] lg:h-auto flex-shrink-0 flex flex-col relative z-20">
      <div className={`rounded-2xl border p-1 shadow-inner relative flex flex-col flex-1 min-h-0 overflow-visible ${darkMode ? 'bg-gray-900 border-gray-700/50' : 'bg-gray-50 border-gray-200/80'}`}>
        <div className={`absolute top-5 left-5 backdrop-blur-md px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest z-40 flex items-center gap-2.5 border shadow-lg ${darkMode ? 'bg-gray-800/80 text-white border-gray-600' : 'bg-white/90 text-gray-800 border-gray-200'}`}>
          <span className="w-2 h-2 rounded-full bg-gov-green animate-pulse"></span>
          <span>Motor Cartográfico</span>
          <div className="relative group flex items-center justify-center z-50">
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help outline-none">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"></circle><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4M12 8h.01"></path></svg>
            </button>
            <div className="absolute left-0 top-full pt-1.5 w-max max-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto z-[9999]">
              <div className={`p-2 rounded-md text-[10px] leading-snug shadow-lg border ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                <span className="block font-bold mb-1 opacity-70">Fontes dos Dados:</span>
                <a href="https://www.ibge.gov.br/geociencias/cartas-e-mapas/mapas-regionais/15974-semiarido-brasileiro.html?=&t=o-que-e" target="_blank" rel="noreferrer" className="block leading-tight opacity-80 hover:opacity-100 transition-opacity">IBGE/Semiárido Brasileiro (2022)</a>
                <a href="https://www.ba.gov.br/cultura/314/divisao-territorial-da-bahia" target="_blank" rel="noreferrer" className="block leading-tight opacity-80 hover:opacity-100 transition-opacity mt-1">SECULT/Divisão Territorial da Bahia (2024)</a>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-full flex-1 rounded-lg overflow-hidden">
          <PtiMap
            territoriosData={territoriosData}
            territoriesDynamicStats={territoriesDynamicStats}
            filtroSemiarido={filtroSemiarido}
            selectedTerritory={selectedLocation}
            semiaridoMunicipios={semiaridoMunicipios}
            onSelectTerritory={handleSelectTerritory}
            darkMode={darkMode}
            dashboardData={dashboardData}
            ctiFilters={ctiFilters}
          />
        </div>
      </div>
    </div>
  );
}
