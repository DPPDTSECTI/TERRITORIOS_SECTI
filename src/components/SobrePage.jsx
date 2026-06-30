import React from 'react';

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
            { t: 'Desenvolvimento Territorial', d: 'Baseado no Índice FIRJAN (IFDM) de 2023. O valor do índice é adotado sob uma perspectiva territorial, calculando a média ponderada dos municípios que constituem os respectivos Territórios de Identidade da Bahia. O índice é composto por variáveis relacionadas às condições de Emprego e Renda, Saúde e Educação dos municípios.' },
            { t: 'Cursos Superiores em CT&I', d: 'Levantamento da capacidade de formação de talentos. Consolida as informações sobre cursos de nível superior ofertados pelas entidades de ensino em Ciência, Tecnologia e Inovação na Bahia.' },
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

export default SobrePage;