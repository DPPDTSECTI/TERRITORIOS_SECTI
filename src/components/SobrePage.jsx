import React, { useState, useContext, useMemo } from 'react';
import { Map as MapIcon, Settings, Sun, Download, Link as LinkIcon, ChevronDown, ChevronUp, BookOpen, ExternalLink } from 'lucide-react';
import DataContext from '../context/DataContext';

// ==========================================
// COMPONENTE: PÁGINA SOBRE
// ==========================================
const SobrePage = ({ darkMode }) => {
  const [showAllIgs, setShowAllIgs] = useState(false);
  
  // Puxa a base de dados GERAL em vez do dashboardData
  const context = useContext(DataContext) || {};
  const territoriosData = context.territoriosData || [];

  const SectionTitle = ({ number, title }) => (
    <h3 className={`font-black uppercase tracking-[0.15em] text-lg mb-6 pt-10 border-b pb-3 ${darkMode ? 'text-blue-400 border-slate-700' : 'text-gov-blueDark-500 border-slate-200'}`}>
      {number}. {title}
    </h3>
  );

  // Estrutura das Referências
  const mainReferences = [
    {
      categoria: 'Mapa Cartográfico e Divisão do Semiárido Brasileiro',
      fontes: [
        { nome: 'SECULT-BA | Divisão Territorial da Bahia (2024)', info: 'Dados geográficos e demográficos, incluindo a delimitação oficial dos 27 Territórios de Identidade da Bahia.', link: 'https://www.ba.gov.br/cultura/314/divisao-territorial-da-bahia' },
        { nome: 'IBGE | Semiárido Brasileiro (2022)', info: 'Delimitação e classificação dos municípios pertencentes ao semiárido.', link: 'https://www.ibge.gov.br/geociencias/cartas-e-mapas/mapas-regionais/15974-semiarido-brasileiro.html?=&t=o-que-e' }
      ]
    },
    {
      categoria: 'Indicador de Desenvolvimento Territorial (IFDMT)',
      fontes: [
        { nome: 'Índice FIRJAN de Desenvolvimento Municipal (IFDM)', info: 'Utilizado como base para o indicador de Desenvolvimento Territorial.', link: 'https://www.firjan.com.br/ifdm/' }
      ]
    },
    {
      categoria: 'Cursos Superiores em CT&I',
      fontes: [
        { nome: 'INEP | Censo da Educação Superior', info: 'Microdados que fornecem a base para o levantamento de cursos superiores em CT&I.', link: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior' }
      ]
    },
    {
      categoria: 'Cadeias Produtivas',
      fontes: [
        { nome: 'Indicações Geográficas (IGs) | Sebrae Origens – DataSebrae', info: 'Consolidação de informações sobre Indicações Geográficas.', link: 'https://datasebrae.com.br/indicacoesgeograficas/' },
        { nome: 'Arranjos Produtivos Locais (APLs) | Observatório APL', info: 'Consolidação de informações sobre Arranjos Produtivos Locais.', link: 'https://observatorioapl.mdic.gov.br/' }
      ]
    }
  ];

  // ==========================================
  // EXTRAÇÃO DINÂMICA DIRETO DO EXCEL
  // ==========================================
  const igPotenciais = useMemo(() => {
    const map = new Map();
    
    if (territoriosData && territoriosData.length > 0) {
      territoriosData.forEach(territorio => {
        const cadeias = territorio.cadeiasProdutivasDetalhado || [];
        
        cadeias.forEach(apl => {
          const textoFonte = String(apl.fonte || '').trim();
          const textLower = textoFonte.toLowerCase();
          
          // Regra para identificar que a fonte é de facto um Artigo Científico
          const isArticle = textLower.includes('revista') || 
                            textLower.includes('cadernos') || 
                            textLower.includes('avaliação da potencialidade') ||
                            textLower.includes('et al') ||
                            textLower.includes('doi:');
                            
          if (isArticle && textoFonte.length > 20) {
            // Puxa o Hyperlink real extraído pelas coordenadas da célula
            let urlFinal = apl.urlTarget; 

            // Fallback: se o Excel não tinha hiperlink embutido, tenta ler um url no meio do texto
            if (!urlFinal) {
               const urlMatch = textoFonte.match(/https?:\/\/[^\s]+/i);
               if (urlMatch) urlFinal = urlMatch[0];
            }

            // Agrupa os artigos usando o texto completo para não aparecerem repetidos
            if (!map.has(textoFonte)) {
              map.set(textoFonte, {
                txt: textoFonte,
                link: urlFinal || '#'
              });
            } else if (urlFinal && map.get(textoFonte).link === '#') {
              map.get(textoFonte).link = urlFinal; // Atualiza o link se a 1ª vez não o tinha
            }
          }
        });
      });
    }
    
    let extracted = Array.from(map.values());

    // Fallback estático APENAS caso os dados do Excel ainda estejam a carregar na tela
    if (extracted.length === 0) {
       extracted = [
         { txt: "SEBRAE. Avaliação da potencialidade para indicação geográfica da cerâmica da Barra. Brasília: SEBRAE, 2024.", link: "https://datasebrae.com.br/wp-content/uploads/2025/01/1a-Diagnostico-Ceramica-da-Barra.pdf" },
         { txt: "SEBRAE. Avaliação da potencialidade para indicação geográfica do artesanato de piaçava de Porto de Sauípe. Brasília: SEBRAE, 2024.", link: "https://datasebrae.com.br/wp-content/uploads/2025/01/2a-Diagnostico-Artesanato-de-Piacava-de-Porto-do-Sauipe.pdf" },
         { txt: "SEBRAE. Avaliação da potencialidade para indicação geográfica das cerâmicas de Maragogipinho. Brasília: SEBRAE, 2024.", link: "https://datasebrae.com.br/wp-content/uploads/2025/01/3a-Diagnostico-Ceramica-de-Maragogipinho.pdf" },
         { txt: "MIDLEJ, Emanuel Marques; SALES, Jorge Henrique de Oliveira. A indicação geográfica (IG) para a farinha de Buerarema como estratégia de proteção aos produtores locais. Revista Observatorio de la Economia Latinoamericana, v. 22, n. 6, 2024.", link: "https://doi.org/10.55905/oelv22n6-111" }
       ];
    }

    // RETORNA ORDENADO ALFABETICAMENTE A-Z 
    // (Se quiser Z-A, troque "a.txt.localeCompare(b.txt..." por "b.txt.localeCompare(a.txt...")
    return extracted.sort((a, b) => a.txt.localeCompare(b.txt, 'pt-BR'));
    
  }, [territoriosData]);

  return (
    <div className="animate-soft-fade relative p-4 max-w-4xl mx-auto w-full min-h-full flex flex-col justify-start font-sans">
      <div className={`backdrop-blur-2xl rounded-[2rem] border shadow-2xl p-8 lg:p-12 mb-8 transition-all duration-500 ${darkMode ? 'bg-slate-900/60 border-slate-700/50' : 'bg-white/80 border-white/60'}`}>
        <h2 className={`text-4xl lg:text-5xl font-black mb-12 tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Sobre o Painel SECTI Territórios
        </h2>
        
        <div className={`text-sm sm:text-base max-w-none space-y-8 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          
          <div>
            <SectionTitle number="1" title="O Projeto" />
            <p className="leading-relaxed mb-4 text-base">
              O <strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Painel Territorial de CT&I da Bahia</strong> é uma plataforma digital interativa, desenvolvida pela Secretaria de Ciência, Tecnologia e Inovação (SECTI), para consolidar, analisar e dar transparência aos principais dados do ecossistema de CT&I nos 27 Territórios de Identidade do estado.
            </p>
            <p className="leading-relaxed text-base">
              A ferramenta foi concebida como um instrumento estratégico para mapear as capacidades, vocações e desafios de cada região, oferecendo uma visão integrada e georreferenciada de ativos cruciais para o desenvolvimento socioeconômico.
            </p>
          </div>

          <div>
            <SectionTitle number="2" title="Nossos Objetivos" />
            <ul className="list-disc pl-5 space-y-3 text-base">
              <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Apoiar a Tomada de Decisão:</strong> Fornecer dados qualificados para subsidiar o planejamento e a formulação de políticas públicas.</li>
              <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Promover a Transparência:</strong> Disponibilizar de forma aberta informações sobre investimentos, infraestrutura e indicadores de CT&I.</li>
              <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Fomentar a Articulação:</strong> Facilitar a identificação de sinergias entre governo, setor produtivo, academia e sociedade civil.</li>
              <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Democratizar a Informação:</strong> Servir como fonte de consulta para pesquisadores, estudantes, gestores e investidores.</li>
            </ul>
          </div>

          <div>
            <SectionTitle number="3" title="Definições e Indicadores (KPIs)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {[
                { t: 'Capacidade em CT&I', d: 'Quantitativo de infraestruturas mapeadas, englobando Universidades, Institutos Federais, Centros de Pesquisa, ICTs, Espaços Dinamizadores, Parques Tecnológicos e Incubadoras.' },
                { t: 'Desenvolvimento Territorial', d: 'Baseado no Índice FIRJAN (IFDM). O valor do índice é adotado sob uma perspectiva territorial, calculando a média ponderada dos municípios que constituem cada Território.' },
                { t: 'Cursos Superiores em CT&I', d: 'Levantamento da capacidade de formação de talentos, consolidando informações sobre cursos de nível superior ofertados pelas entidades de ensino em CT&I na Bahia.' },
                { t: 'APLs e IGs', d: 'Mapeamento de Arranjos Produtivos Locais (aglomerações de cooperação económica) e Indicações Geográficas (certificações de produtos inerentes à sua origem territorial).' }
              ].map((item, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border transition-transform hover:-translate-y-1 duration-300 shadow-sm ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200/60'}`}>
                  <span className={`block font-extrabold mb-3 text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.t}</span>
                  <span className="text-sm leading-relaxed opacity-90">{item.d}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle number="4" title="Referências e Fontes de Dados" />
            <p className="leading-relaxed mb-10 text-base">
              A riqueza de informações do painel é resultado da consolidação de múltiplas fontes de dados abertos e artigos científicos, garantindo abrangência e confiabilidade.
            </p>
            
            <div className="space-y-12">
              {/* CARTÕES DAS FONTES PRINCIPAIS */}
              {mainReferences.map((refBloco, i) => (
                <div key={i} className="space-y-4">
                  <h4 className={`font-extrabold text-base lg:text-lg uppercase tracking-wide flex items-center gap-2 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-gov-blue'}`}></span>
                    {refBloco.categoria}
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-3 pl-0 sm:pl-4">
                    {refBloco.fontes.map((fonte, idx) => (
                      <a 
                        key={idx} 
                        href={fonte.link !== '#' ? fonte.link : undefined} 
                        target={fonte.link !== '#' ? "_blank" : undefined} 
                        rel="noopener noreferrer" 
                        className={`group p-5 rounded-xl border flex flex-col justify-between transition-all duration-300 shadow-sm ${darkMode ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-gov-blue/40'}`}
                      >
                         <div className="flex justify-between items-start mb-2">
                           <span className={`block font-bold text-sm lg:text-base leading-tight transition-colors ${darkMode ? 'text-blue-300 group-hover:text-blue-200' : 'text-gov-blue group-hover:text-gov-blueDark-500'}`}>
                              {fonte.nome}
                           </span>
                           <ExternalLink size={16} className="opacity-40 group-hover:opacity-100 shrink-0 ml-3 mt-0.5" />
                         </div>
                         <span className={`text-sm opacity-80 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{fonte.info}</span>
                      </a>
                    ))}
                  </div>

                  {/* BLOCO DA CADEIA PRODUTIVA COM ARTIGOS AGRUPADOS DINAMICAMENTE */}
                  {refBloco.categoria === 'Cadeias Produtivas' && (
                    <div className="pt-6 mt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-700 pl-0 sm:pl-4">
                      <h5 className={`font-bold text-sm tracking-wide mb-5 flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <BookOpen size={18} className="opacity-70" /> Artigos Científicos: Indicações Geográficas Potenciais
                      </h5>
                      
                      {igPotenciais.length > 0 ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(showAllIgs ? igPotenciais : igPotenciais.slice(0, 4)).map((ig, idx) => {
                              const isClickable = ig.link && ig.link !== '#';
                              const Wrapper = isClickable ? 'a' : 'div';
                              
                              return (
                                <Wrapper
                                  key={idx}
                                  href={isClickable ? ig.link : undefined}
                                  target={isClickable ? "_blank" : undefined}
                                  rel={isClickable ? "noopener noreferrer" : undefined}
                                  className={`group p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 shadow-sm ${darkMode ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-gov-blue/40'} ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                  <div className="flex justify-between items-start">
                                    <span className={`text-xs leading-relaxed transition-colors ${darkMode ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                      {ig.txt}
                                    </span>
                                    {isClickable && <ExternalLink size={14} className="opacity-0 group-hover:opacity-50 shrink-0 ml-3 mt-1" />}
                                  </div>
                                </Wrapper>
                              );
                            })}
                          </div>
                          
                          {igPotenciais.length > 4 && (
                            <div className="mt-5">
                              <button
                                onClick={() => setShowAllIgs(!showAllIgs)}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-sm ${darkMode ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-600 text-blue-400 hover:text-blue-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-gov-blue hover:text-gov-blueDark-500'}`}
                              >
                                {showAllIgs ? (
                                  <>Esconder Artigos <ChevronUp size={18} /></>
                                ) : (
                                  <>Mostrar mais ({igPotenciais.length - 4} artigos) <ChevronDown size={18} /></>
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={`p-4 rounded-xl border text-center text-sm font-medium italic ${darkMode ? 'bg-slate-800/40 border-slate-700/50 text-slate-400' : 'bg-slate-50 border-slate-200/60 text-slate-500'}`}>
                          A carregar artigos científicos ou nenhum artigo mapeado no Excel...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle number="5" title="Metodologia e Tratamento dos Dados" />
            <ol className="list-decimal pl-5 space-y-3 text-base">
              <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Consolidação e Limpeza:</strong> Os dados brutos são coletados, higienizados e padronizados para garantir consistência.</li>
              <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Georreferenciamento:</strong> As informações são associadas às suas respectivas coordenadas geográficas e vinculadas aos municípios e Territórios.</li>
              <li><strong className={darkMode ? 'text-slate-100' : 'text-slate-900'}>Cálculo de Indicadores Territoriais:</strong> Indicadores municipais, como o IFDM, são agregados para o nível territorial por meio de uma <strong className={darkMode ? 'text-slate-100' : 'text-slate-800'}>média ponderada pela população</strong> de cada município.</li>
            </ol>
          </div>

          <div>
            <SectionTitle number="6" title="Guia de Funcionalidades" />
            <ul className="space-y-6 mt-8">
              {[
                { t: 'Mapa Interativo', d: 'Explore os 27 Territórios, visualize a distribuição de ativos e acesse dados detalhados por município com funções de zoom e pan.', i: <MapIcon size={24} />, c: 'text-blue-500 bg-blue-500/10 border border-blue-500/20' },
                { t: 'Filtros Avançados', d: 'Refine sua busca por Território, Indicadores (IFDM), Cursos Superiores, Cadeias Produtivas e tipos de Entidades de CT&I.', i: <Settings size={24} />, c: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' },
                { t: 'Filtro do Semiárido Baiano', d: 'A ativação do "Recorte Semiárido" isola estritamente os dados do polígono correspondente ao semiárido.', i: <Sun size={24} />, c: 'text-orange-500 bg-orange-500/10 border border-orange-500/20' },
                { t: 'Exportação para Business Intelligence', d: 'A plataforma disponibiliza a extração integral dos dados. A exportação gera um ficheiro em formato Excel (.xlsx), estruturado em abas relacionais.', i: <Download size={24} />, c: 'text-purple-500 bg-purple-500/10 border border-purple-500/20' }
              ].map((func, idx) => (
                <li key={idx} className="flex gap-5 items-start">
                  <div className={`p-4 rounded-xl shrink-0 shadow-sm ${func.c}`}>{func.i}</div>
                  <div className="pt-1">
                    <strong className={`block text-lg mb-1.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{func.t}</strong>
                    <span className="text-sm opacity-90 leading-relaxed">{func.d}</span>
                  </div>
                </li>
              ))}
            </ul> 
          </div>

        </div>
      </div>
    </div>
  );
};

export default SobrePage;