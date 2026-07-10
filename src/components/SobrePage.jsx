import React from 'react';
import { Map as MapIcon, Settings, Sun, Download, Link as LinkIcon } from 'lucide-react';

// ==========================================
// COMPONENTE: PÁGINA SOBRE
// ==========================================
const SobrePage = ({ darkMode }) => {
  const SectionTitle = ({ number, title }) => (
    <h3 className="text-gov-blueDark-500 dark:text-blue-400 font-black uppercase tracking-[0.2em] text-xs mb-4 pt-8 border-b border-slate-200/20 pb-2">
      {number}. {title}
    </h3>
  );

  return (
    <div className="animate-soft-fade relative p-4 max-w-4xl mx-auto w-full min-h-full flex flex-col justify-start">
      <div className={`backdrop-blur-2xl rounded-[2rem] border shadow-2xl p-8 lg:p-12 mb-8 transition-all duration-500 ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-white/60'}`}>
        <h2 className="text-3xl lg:text-4xl font-black mb-12 tracking-tighter">Sobre o Painel SECTI Territórios</h2>
        <div className={`text-sm sm:text-base max-w-none space-y-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          
          <SectionTitle number="1" title="O Projeto" />
          <p className="leading-relaxed">O <strong className={darkMode ? 'text-slate-100' : 'text-slate-800'}>Painel Territorial de CT&I da Bahia</strong> é uma plataforma digital interativa, desenvolvida pela Secretaria de Ciência, Tecnologia e Inovação (SECTI), para consolidar, analisar e dar transparência aos principais dados do ecossistema de CT&I nos 27 Territórios de Identidade do estado.</p>
          <p className="leading-relaxed">A ferramenta foi concebida como um instrumento estratégico para mapear as capacidades, vocações e desafios de cada região, oferecendo uma visão integrada e georreferenciada de ativos cruciais para o desenvolvimento socioeconômico.</p>

          <SectionTitle number="2" title="Nossos Objetivos" />
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-800'}>Apoiar a Tomada de Decisão:</strong> Fornecer dados qualificados para subsidiar o planejamento e a formulação de políticas públicas.</li>
            <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-800'}>Promover a Transparência:</strong> Disponibilizar de forma aberta informações sobre investimentos, infraestrutura e indicadores de CT&I.</li>
            <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-800'}>Fomentar a Articulação:</strong> Facilitar a identificação de sinergias entre governo, setor produtivo, academia e sociedade civil.</li>
            <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-800'}>Democratizar a Informação:</strong> Servir como fonte de consulta para pesquisadores, estudantes, gestores e investidores.</li>
          </ul>

          <SectionTitle number="3" title="Definições e Indicadores (KPIs)" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { t: 'Capacidade em CT&I', d: 'Quantitativo de infraestruturas mapeadas, englobando Universidades, Institutos Federais, Centros de Pesquisa, ICTs, Espaços Dinamizadores, Parques Tecnológicos e Incubadoras.' },
              { t: 'Desenvolvimento Territorial', d: 'Baseado no Índice FIRJAN (IFDM). O valor do índice é adotado sob uma perspectiva territorial, calculando a média ponderada dos municípios que constituem cada Território.' },
              { t: 'Cursos Superiores em CT&I', d: 'Levantamento da capacidade de formação de talentos, consolidando informações sobre cursos de nível superior ofertados pelas entidades de ensino em CT&I na Bahia.' },
              { t: 'APLs e IGs', d: 'Mapeamento de Arranjos Produtivos Locais (aglomerações de cooperação económica) e Indicações Geográficas (certificações de produtos inerentes à sua origem territorial).' }
            ].map((item, idx) => (
              <div key={idx} className={`p-5 rounded-2xl border transition-transform hover:-translate-y-1 duration-300 ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200/60'}`}>
                <span className={`block font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.t}</span>
                <span className="text-[11px] leading-relaxed opacity-80">{item.d}</span>
              </div>
            ))}
          </div>

          <SectionTitle number="4" title="Fontes dos Dados" />
          <p className="leading-relaxed">
            A riqueza de informações do painel é resultado da consolidação de múltiplas fontes de dados abertos, garantindo abrangência e confiabilidade. As principais fontes utilizadas são:
          </p>
          <div className="space-y-4 !mt-6">
            {[
              {
                nome: 'SEPLAN-BA (Secretaria do Planejamento)',
                info: 'Dados geográficos e demográficos, incluindo a delimitação oficial dos 27 Territórios de Identidade da Bahia.',
                link: 'http://www.seplan.ba.gov.br/'
              },
              {
                nome: 'IBGE (Instituto Brasileiro de Geografia e Estatística)',
                info: 'Dados populacionais, malhas territoriais dos municípios e informações geográficas essenciais para o georreferenciamento.',
                link: 'https://www.ibge.gov.br/geociencias/cartas-e-mapas/mapas-regionais/15974-semiarido-brasileiro.html?=&t=o-que-e'
              },
              {
                nome: 'Sistema FIRJAN',
                info: 'Índice FIRJAN de Desenvolvimento Municipal (IFDM), utilizado como base para o indicador de Desenvolvimento Territorial.',
                link: 'https://www.firjan.com.br/ifdm/'
              },
              {
                nome: 'INEP/MEC (Instituto Nacional de Estudos e Pesquisas Educacionais)',
                info: 'Microdados do Censo da Educação Superior, que fornecem a base para o levantamento de cursos superiores em CT&I.',
                link: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior'
              },
              {
                nome: 'SEBRAE, MAPA e Fontes Acadêmicas',
                info: 'Consolidação de informações sobre Arranjos Produtivos Locais (APLs) e Indicações Geográficas (IGs) a partir de diversas fontes setoriais.',
                link: 'https://datasebrae.com.br/indicacoesgeograficas/'
              }
            ].map((fonte, idx) => (
              <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600' : 'bg-slate-50/80 border-slate-200/60 hover:border-slate-300'}`}>
                <a href={fonte.link} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="flex justify-between items-start">
                    <span className={`block font-bold mb-2 group-hover:text-gov-blueDark-500 dark:group-hover:text-blue-400 transition-colors ${darkMode ? 'text-white' : 'text-slate-800'}`}>{fonte.nome}</span>
                    <LinkIcon size={16} className="text-slate-400 group-hover:text-gov-blueDark-500 dark:group-hover:text-blue-400 transition-colors shrink-0 ml-4" />
                  </div>
                  <p className="text-xs leading-relaxed opacity-80">{fonte.info}</p>
                  <span className="text-[10px] mt-3 block text-gov-blueDark-500/50 dark:text-blue-400/50 group-hover:text-gov-blueDark-500 dark:group-hover:text-blue-400 font-mono break-all transition-colors">{fonte.link}</span>
                </a>
              </div>
            ))}
          </div>

          <SectionTitle number="5" title="Metodologia e Tratamento dos Dados" />
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-800'}>Consolidação e Limpeza:</strong> Os dados brutos são coletados, higienizados e padronizados para garantir consistência.</li>
            <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-800'}>Georreferenciamento:</strong> As informações são associadas às suas respectivas coordenadas geográficas e vinculadas aos municípios e Territórios.</li>
            <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-800'}>Cálculo de Indicadores Territoriais:</strong> Indicadores municipais, como o IFDM, são agregados para o nível territorial por meio de uma <strong className={darkMode ? 'text-slate-100' : 'text-slate-800'}>média ponderada pela população</strong> de cada município.</li>
          </ol>

          <SectionTitle number="6" title="Guia de Funcionalidades" />
          <ul className="space-y-6">
            {[
              { t: 'Mapa Interativo', d: 'Explore os 27 Territórios, visualize a distribuição de ativos e acesse dados detalhados por município com funções de zoom e pan.', i: <MapIcon size={20} />, c: 'text-blue-500 bg-blue-500/10' },
              { t: 'Filtros Avançados', d: 'Refine sua busca por Território, Indicadores (IFDM), Cursos Superiores, Cadeias Produtivas e tipos de Entidades de CT&I.', i: <Settings size={20} />, c: 'text-emerald-500 bg-emerald-500/10' },
              { t: 'Filtro do Semiárido Baiano', d: 'A ativação do "Recorte Semiárido" isola estritamente os dados do polígono correspondente ao semiárido.', i: <Sun size={20} />, c: 'text-orange-500 bg-orange-500/10' },
              { t: 'Exportação para Business Intelligence', d: 'A plataforma disponibiliza a extração integral dos dados. A exportação gera um ficheiro em formato Excel (.xlsx), estruturado em abas relacionais.', i: <Download size={20} />, c: 'text-purple-500 bg-purple-500/10' }
            ].map((func, idx) => (
              <li key={idx} className="flex gap-4 items-start">
                <div className={`p-2.5 rounded-xl shrink-0 ${func.c}`}>{func.i}</div>
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
};

export default SobrePage;