import React, { useState, useMemo, useContext } from 'react';
import { 
  Map as MapIcon, Settings, Sun, Download, ExternalLink, ChevronDown, ChevronUp, 
  BookOpen, Building2, Target, Eye, Users, Lightbulb, Database, MapPin, Calculator, 
  Info, Zap, TrendingUp, GraduationCap, Milestone
} from 'lucide-react';
import DataContext from '../context/DataContext';
import { resolveCadeiaFonte } from '../utils/cadeiasUtils';
import Sidebar from '../components/Sidebar';

// ==========================================
// COMPONENTE: PÁGINA SOBRE
// ==========================================
const SobrePage = ({ darkMode = true }) => {
  const [showAllIgs, setShowAllIgs] = useState(false);
  const [showAllIncubadoras, setShowAllIncubadoras] = useState(false);

  // Puxa a base de dados GERAL via Contexto
  const context = useContext(DataContext) || {};
  const { carregarTodosDetalhes } = context;
  const territoriosData = context.territoriosData || [];

  React.useEffect(() => {
    if (carregarTodosDetalhes) {
      carregarTodosDetalhes();
    }
  }, [carregarTodosDetalhes]);

  // Extrai dinamicamente todos os artigos/referências mapeados no Excel
  const igPotenciais = useMemo(() => {
    const allCadeias = territoriosData.flatMap(t => t.cadeiasProdutivasDetalhado || []);
    const uniqueArticles = new Map();

    allCadeias.forEach(cad => {
      const tipoLower = (cad.tipo || '').toLowerCase();
      const isIgPotencial = tipoLower === 'ig potencial';

      if (!isIgPotencial) return;

      const fonteInfo = resolveCadeiaFonte(cad);
      const labelLower = (fonteInfo.label || '').toLowerCase();

      const isGeneric =
        labelLower.includes('mapa interativo') ||
        labelLower.includes('observatório apl') ||
        labelLower.includes('observatorioapl') ||
        labelLower.includes('datasebrae') ||
        labelLower.includes('gov.br/empresas');

      const linkCorreto = cad.urlTarget || fonteInfo.url;

      if (linkCorreto && !isGeneric && (fonteInfo.label || '').length > 20) {
        if (!uniqueArticles.has(linkCorreto)) {
          uniqueArticles.set(linkCorreto, {
            txt: fonteInfo.label,
            link: linkCorreto
          });
        }
      }
    });

    return Array.from(uniqueArticles.values()).sort((a, b) => a.txt.localeCompare(b.txt, 'pt'));
  }, [territoriosData]);

  // Extrai dinamicamente as Incubadoras e Aceleradoras que possuem link válido
  const incubadorasAceleradorasList = useMemo(() => {
    const allCapacidade = territoriosData.flatMap(t => t.capacidadeDetalhada || []);
    const uniqueMap = new Map();

    allCapacidade.forEach(item => {
      const cat = (item.categoria || '').toLowerCase();
      const tipo = (item.tipo || '').toLowerCase();
      const entidadeNome = item.entidade ? String(item.entidade).trim() : '';

      if (
        cat.includes('incubadora') || cat.includes('aceleradora') ||
        tipo.includes('incubadora') || tipo.includes('aceleradora') ||
        cat === 'aceleradoras' || cat === 'incubadoras'
      ) {
        const rawLink = item.site || item.fonte || '';

        if (entidadeNome && rawLink && rawLink !== '#' && rawLink !== '' && !uniqueMap.has(entidadeNome)) {
          const finalLink = rawLink.startsWith('http') ? rawLink : `https://${rawLink}`;
          uniqueMap.set(entidadeNome, { nome: entidadeNome, link: finalLink, municipio: item.municipio || '' });
        }
      }
    });

    let extracted = Array.from(uniqueMap.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    if (extracted.length === 0) {
      extracted = [
        { nome: "Áity Incubadora (Uneb/Sebrae)", link: "https://inovacao.uneb.br/aity-incubadora-de-empresas-ja-ouviu-falar/", municipio: "Salvador" },
        { nome: "CIMATEC Park", link: "https://senaicimatec.com.br/", municipio: "Camaçari" },
        { nome: "Cyklo Agritech", link: "https://cykloagritech.com.br/", municipio: "Luís Eduardo Magalhães" },
        { nome: "GetIN Aceleradora", link: "https://getin.inf.br/", municipio: "Salvador" },
        { nome: "Hub Conquista / Conquista Startups", link: "https://hubconquista.com.br/", municipio: "Vitória da Conquista" },
        { nome: "IEBT Innovation", link: "https://www.iebtinnovation.com/", municipio: "Vitória da Conquista" },
        { nome: "Inventivos", link: "https://inventivos.co/", municipio: "Salvador" },
        { nome: "Novatores", link: "https://novatores.uefs.br/", municipio: "Feira de Santana" },
        { nome: "SENAI CIMATEC", link: "https://senaicimatec.com.br/", municipio: "Salvador" },
        { nome: "Vale do dendê", link: "https://www.valedodende.org/", municipio: "Salvador" }
      ];
    }
    return extracted;
  }, [territoriosData]);

  // Estrutura das Referências
  const mainReferences = [
    {
      categoria: 'Mapa Cartográfico e Divisão do Semiárido Brasileiro',
      fontes: [
        { nome: 'SECULT-BA | Divisão Territorial da Bahia', info: 'Dados geográficos e demográficos, incluindo a delimitação oficial dos 27 Territórios de Identidade.', link: 'https://www.ba.gov.br/cultura/314/divisao-territorial-da-bahia' },
        { nome: 'IBGE | Semiárido Brasileiro (2022)', info: 'Delimitação e classificação dos municípios pertencentes ao semiárido.', link: 'https://www.ibge.gov.br/geociencias/cartas-e-mapas/mapas-regionais/15974-semiarido-brasileiro.html?=&t=o-que-e' }
      ]
    },
    {
      categoria: 'Indicador de Desenvolvimento Territorial',
      fontes: [
        { nome: 'Índice FIRJAN de Desenvolvimento Municipal (IFDM)', info: 'Utilizado como base para o indicador de Desenvolvimento Territorial.', link: 'https://www.firjan.com.br/ifdm/' }
      ]
    },
    {
      categoria: 'Estruturas de CT&I e Cursos Superiores',
      fontes: [
        { nome: 'INEP | Censo da Educação Superior', info: 'Microdados que fornecem a base para o levantamento de cursos e infraestruturas em CT&I.', link: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior' }
      ]
    },
    {
      categoria: 'Cadeias Produtivas',
      fontes: [
        { nome: 'Indicações Geográficas (IGs) | DataSebrae', info: 'Consolidação de informações sobre Indicações Geográficas.', link: 'https://datasebrae.com.br/indicacoesgeograficas/' },
        { nome: 'Indicações Geográficas (IGs) | INPI', info: 'Consolidação de informações sobre Indicações Geográficas.', link: 'https://www.gov.br/inpi/pt-br/servicos/indicacoes-geograficas' },
        { nome: 'Arranjos Produtivos Locais (APLs)', info: 'Consolidação de informações sobre Arranjos Produtivos Locais.', link: 'https://www.gov.br/empresas-e-negocios/pt-br/portais-desconhecidos/observatorioapl' }
      ]
    }
  ];

  // COMPONENTES DE UI MENORES PARA REUSO
  const SectionTitle = ({ number, title, icon: Icon }) => (
    <div className="flex items-center gap-4 mb-8 pt-10">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-[#3117ea]/20 text-[#9170FA]' : 'bg-blue-100 text-blue-600'}`}>
        {Icon ? <Icon size={20} /> : <span className="font-black text-lg">{number}</span>}
      </div>
      <h3 className={`font-black uppercase tracking-[0.1em] text-xl ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h3>
    </div>
  );

  return (
    <div className={`flex w-full min-h-screen font-sans ${darkMode ? 'bg-[#18181b]' : 'bg-slate-50'}`}>
      
      {/* SIDEBAR COM PROP PARA OCULTAR FILTROS */}
      <Sidebar username="Gestor BA" navOnly={true} />
      
      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative flex flex-col items-center">
        
        <div className="animate-soft-fade relative p-6 md:p-10 max-w-5xl w-full z-10 flex flex-col justify-start">
          
          {/* HEADER DA PÁGINA */}
          <div className="flex flex-col items-start gap-4 mb-12 mt-4">
            <div className={`px-4 py-1.5 rounded-full border text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${darkMode ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
              <Info size={14} /> Documentação
            </div>
            <h2 className={`text-4xl lg:text-5xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Sobre o <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9170FA] to-[#FFD2FF]">Painel SECTI</span>
            </h2>
            <p className={`text-base lg:text-lg max-w-3xl leading-relaxed mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
              Uma plataforma digital interativa para consolidar, analisar e dar transparência aos principais dados do ecossistema de Ciência, Tecnologia e Inovação nos 27 Territórios de Identidade do estado da Bahia.
            </p>
          </div>

          <div className="space-y-12 pb-20">

            {/* ================= SEÇÃO: OBJETIVOS (GRID CARDS) ================= */}
            <div>
              <SectionTitle icon={Target} title="Nossos Objetivos" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { t: 'Apoiar a Tomada de Decisão', d: 'Fornecer dados qualificados para subsidiar o planejamento e a formulação de políticas públicas.', i: <MapIcon /> },
                  { t: 'Promover a Transparência', d: 'Disponibilizar de forma aberta informações sobre investimentos, infraestrutura e indicadores de CT&I.', i: <Eye /> },
                  { t: 'Fomentar a Articulação', d: 'Facilitar a identificação de sinergias entre governo, setor produtivo, academia e sociedade civil.', i: <Users /> },
                  { t: 'Democratizar a Informação', d: 'Servir como fonte de consulta para pesquisadores, estudantes, gestores e investidores.', i: <Lightbulb /> },
                ].map((item, idx) => (
                  <div key={idx} className={`p-6 rounded-2xl border flex gap-4 transition-transform hover:-translate-y-1 duration-300 ${darkMode ? 'bg-[#232326] border-[#2A2A2E]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className={`mt-1 shrink-0 ${darkMode ? 'text-[#9170FA]' : 'text-blue-600'}`}>
                      {React.cloneElement(item.i, { size: 24, strokeWidth: 1.5 })}
                    </div>
                    <div>
                      <strong className={`block text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.t}</strong>
                      <span className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{item.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= SEÇÃO: DEFINIÇÕES E KPIs ================= */}
            <div>
              <SectionTitle icon={Zap} title="Definições e Indicadores (KPIs)" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { t: 'Capacidade em CT&I', d: 'Infraestruturas mapeadas: Universidades, IFs, ICTs, Parques Tecnológicos e Incubadoras.', i: <Building2 /> },
                  { t: 'Desenvolvimento Territorial', d: 'Baseado no Índice FIRJAN (IFDM), adotado sob a perspectiva da média dos municípios do Território.', i: <TrendingUp /> },
                  { t: 'Cursos Superiores', d: 'Levantamento da capacidade de formação de talentos através de cursos de nível superior em CT&I.', i: <GraduationCap /> },
                  { t: 'APLs e IGs', d: 'Arranjos Produtivos Locais (aglomerações) e Indicações Geográficas (certificações de origem).', i: <Milestone /> }
                ].map((item, idx) => (
                  <div key={idx} className={`p-6 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-[#232326] border-[#2A2A2E] hover:bg-[#2A2A2E]' : 'bg-white border-slate-200 hover:shadow-md'}`}>
                    <div className={`w-10 h-10 mb-4 rounded-lg flex items-center justify-center ${darkMode ? 'bg-[#313136] text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {React.cloneElement(item.i, { size: 20 })}
                    </div>
                    <strong className={`block font-extrabold mb-2 text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.t}</strong>
                    <span className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{item.d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= SEÇÃO: METODOLOGIA (STEPPER) ================= */}
            <div>
              <SectionTitle icon={Settings} title="Metodologia e Tratamento" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { s: '01', t: 'Consolidação e Limpeza', d: 'Os dados brutos são coletados, tratados e padronizados para garantir consistência estrutural.', i: <Database /> },
                  { s: '02', t: 'Georreferenciamento', d: 'Associação direta às coordenadas geográficas e vinculação espacial aos municípios e Territórios.', i: <MapPin /> },
                  { s: '03', t: 'Cálculo de Indicadores', d: 'Geração de índices e KPIs processados matematicamente considerando o contexto geográfico.', i: <Calculator /> },
                ].map((item, idx) => (
                  <div key={idx} className={`relative p-6 rounded-2xl border overflow-hidden flex flex-col ${darkMode ? 'bg-[#232326] border-[#2A2A2E]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    {/* Número Gigante de Fundo */}
                    <span className={`absolute -right-4 -bottom-6 text-[120px] font-black leading-none opacity-5 select-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {item.s}
                    </span>
                    <div className={`w-12 h-12 mb-5 rounded-full flex items-center justify-center border shadow-sm ${darkMode ? 'bg-[#3117ea]/20 border-[#3117ea]/50 text-[#9170FA]' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                      {React.cloneElement(item.i, { size: 22 })}
                    </div>
                    <strong className={`block text-lg font-bold mb-3 z-10 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.t}</strong>
                    <span className={`text-sm leading-relaxed z-10 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{item.d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ================= SEÇÃO: FUNCIONALIDADES (LISTA ESTILIZADA) ================= */}
            <div>
              <SectionTitle icon={MapIcon} title="Guia de Funcionalidades" />
              <div className={`p-6 md:p-8 rounded-2xl border ${darkMode ? 'bg-[#232326] border-[#2A2A2E]' : 'bg-white border-slate-200 shadow-sm'}`}>
                <ul className="space-y-6">
                  {[
                    { t: 'Mapa Interativo', d: 'Explore os 27 Territórios, visualize a distribuição de ativos e acesse dados detalhados por município com funções de zoom e pan.', i: <MapIcon />, c: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
                    { t: 'Filtros Avançados', d: 'Refine sua busca por Território, Indicadores (IFDM), Cursos Superiores, Cadeias Produtivas e tipos de Entidades de CT&I.', i: <Settings />, c: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
                    { t: 'Recorte Semiárido Baiano', d: 'A ativação do "Recorte Semiárido" isola estritamente os dados do polígono correspondente ao semiárido.', i: <Sun />, c: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
                    { t: 'Exportação Analítica', d: 'A plataforma disponibiliza a extração integral dos dados em formato Excel (.xlsx), estruturado em abas relacionais.', i: <Download />, c: 'text-purple-400 bg-purple-400/10 border-purple-400/20' }
                  ].map((func, idx) => (
                    <li key={idx} className="flex flex-col sm:flex-row gap-5 items-start sm:items-center pb-6 border-b last:border-0 last:pb-0 border-white/5">
                      <div className={`p-4 rounded-xl shrink-0 border ${func.c}`}>
                        {React.cloneElement(func.i, { size: 24, strokeWidth: 1.5 })}
                      </div>
                      <div>
                        <strong className={`block text-lg mb-1.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{func.t}</strong>
                        <span className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{func.d}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ================= SEÇÃO: REFERÊNCIAS ================= */}
            <div>
              <SectionTitle icon={BookOpen} title="Referências e Fontes de Dados" />
              <div className="space-y-8">
                {mainReferences.map((refBloco, i) => (
                  <div key={i} className="space-y-4">
                    <h4 className={`font-bold text-sm tracking-widest uppercase flex items-center gap-3 ${darkMode ? 'text-[#9170FA]' : 'text-blue-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-[#9170FA]' : 'bg-blue-600'}`}></span>
                      {refBloco.categoria}
                    </h4>

                    <div className={`flex flex-col rounded-2xl border overflow-hidden shadow-sm ${darkMode ? 'bg-[#232326] border-[#2A2A2E]' : 'bg-white border-slate-200'}`}>
                      {refBloco.fontes.map((fonte, idx, arr) => (
                        <a
                          key={idx}
                          href={fonte.link !== '#' ? fonte.link : undefined}
                          target={fonte.link !== '#' ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className={`group p-5 flex flex-col justify-between transition-colors duration-300 
                            ${idx !== arr.length - 1 ? (darkMode ? 'border-b border-[#2A2A2E]' : 'border-b border-slate-200') : ''}
                            ${darkMode ? 'hover:bg-[#2A2A2E]' : 'hover:bg-slate-50'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`block font-bold text-sm lg:text-base leading-tight transition-colors ${darkMode ? 'text-white group-hover:text-[#C8A1FC]' : 'text-slate-800 group-hover:text-blue-600'}`}>
                              {fonte.nome}
                            </span>
                            <ExternalLink size={16} className={`shrink-0 ml-3 mt-0.5 transition-opacity ${darkMode ? 'opacity-40 group-hover:opacity-100 text-white' : 'opacity-40 group-hover:opacity-100 text-slate-800'}`} />
                          </div>
                          <span className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{fonte.info}</span>
                        </a>
                      ))}

                      {/* ESTRUTURAS / INCUBADORAS EXTRAS */}
                      {refBloco.categoria === 'Estruturas de CT&I e Cursos Superiores' && incubadorasAceleradorasList.length > 0 && (
                        <>
                          <div className={`px-5 py-3 border-t font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'bg-[#1c1c1c] border-[#2A2A2E] text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                            <Building2 size={16} className="opacity-70" /> Mapeamento Complementar (Incubadoras)
                          </div>
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(showAllIncubadoras ? incubadorasAceleradorasList : incubadorasAceleradorasList.slice(0, 4)).map((inc, idx) => {
                              const isClickable = inc.link && inc.link !== '#';
                              const Wrapper = isClickable ? 'a' : 'div';
                              return (
                                <Wrapper key={idx} href={isClickable ? inc.link : undefined} target={isClickable ? "_blank" : undefined} rel={isClickable ? "noopener noreferrer" : undefined}
                                  className={`group p-3.5 rounded-xl border flex items-center justify-between transition-all duration-300 ${darkMode ? 'bg-[#18181b] border-[#2A2A2E] hover:border-gray-500' : 'bg-white border-slate-200 hover:border-blue-400'} ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <span className={`text-xs font-bold leading-snug truncate transition-colors ${darkMode ? 'text-gray-200 group-hover:text-white' : 'text-slate-800 group-hover:text-blue-600'}`}>{inc.nome}</span>
                                    {inc.municipio && <span className={`text-[10px] opacity-60 mt-0.5 truncate ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Município: {inc.municipio}</span>}
                                  </div>
                                  {isClickable && <ExternalLink size={14} className="opacity-40 group-hover:opacity-100 shrink-0" />}
                                </Wrapper>
                              );
                            })}
                          </div>
                          {incubadorasAceleradorasList.length > 4 && (
                            <div className="p-4 pt-0">
                              <button onClick={() => setShowAllIncubadoras(!showAllIncubadoras)} className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${darkMode ? 'bg-[#3117ea]/10 hover:bg-[#3117ea]/20 border-[#3117ea]/30 text-[#9170FA]' : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600'}`}>
                                {showAllIncubadoras ? <>Esconder Estruturas <ChevronUp size={16} /></> : <>Mostrar mais ({incubadorasAceleradorasList.length - 4}) <ChevronDown size={16} /></>}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* ARTIGOS IGs EXTRAS */}
                    {refBloco.categoria === 'Cadeias Produtivas' && igPotenciais.length > 0 && (
                      <div className="pt-4">
                        <div className={`px-2 py-3 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 mb-2 ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>
                          <BookOpen size={16} className="opacity-70" /> Artigos: Indicações Geográficas Potenciais
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(showAllIgs ? igPotenciais : igPotenciais.slice(0, 4)).map((ig, idx) => {
                            const isClickable = ig.link && ig.link !== '#';
                            const Wrapper = isClickable ? 'a' : 'div';
                            return (
                              <Wrapper key={idx} href={isClickable ? ig.link : undefined} target={isClickable ? "_blank" : undefined} rel={isClickable ? "noopener noreferrer" : undefined}
                                className={`group p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 shadow-sm ${darkMode ? 'bg-[#232326] border-[#2A2A2E] hover:border-gray-500' : 'bg-white border-slate-200 hover:border-blue-400'} ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <span className={`text-xs leading-relaxed line-clamp-3 transition-colors ${darkMode ? 'text-gray-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>{ig.txt}</span>
                                  {isClickable && <ExternalLink size={14} className="opacity-40 group-hover:opacity-100 shrink-0 mt-0.5" />}
                                </div>
                              </Wrapper>
                            );
                          })}
                        </div>
                        {igPotenciais.length > 4 && (
                          <div className="mt-4">
                            <button onClick={() => setShowAllIgs(!showAllIgs)} className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${darkMode ? 'bg-[#3117ea]/10 hover:bg-[#3117ea]/20 border-[#3117ea]/30 text-[#9170FA]' : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600'}`}>
                              {showAllIgs ? <>Esconder Artigos <ChevronUp size={18} /></> : <>Mostrar mais ({igPotenciais.length - 4}) <ChevronDown size={18} /></>}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default SobrePage;