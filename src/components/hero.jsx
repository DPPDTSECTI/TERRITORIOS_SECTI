import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { DataContext } from '../context/DataContext';

// ================= COMPONENTE DE ANIMAÇÃO DOS NÚMEROS =================
const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const target = parseInt(value, 10);

    if (isNaN(target)) {
      setCount(value);
      return;
    }

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(easeOut * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{count}</>;
};

// ================= DADOS DOS MÓDULOS DA PLATAFORMA =================
const modulosPlataforma = [
  {
    id: 'visao-geral',
    tag: 'Painel Central',
    title: 'Visão Geral & Dashboard Integrado',
    btnLabel: 'Acessar Visão Geral & Dashboard',
    rota: '/territorios',
    descricao: 'Centro de comando executivo com mapa dinâmico da Bahia e cards analíticos de inteligência territorial.',
    destaques: [
      'KPIs consolidados com atualização em tempo real ao selecionar territórios.',
      'Mapa interativo com recorte por Território de Identidade e município.',
      'Distribuição de cursos de CT&I por grandes áreas de conhecimento e principais IES.',
      'Ranking IFDM entre os municípios do território selecionado.',
      'Proporção de conectividade RNP nas tipologias de ensino e pesquisa.'
    ]
  },
  {
    id: 'ativos',
    tag: 'Infraestrutura',
    title: 'Ativos de Ciência, Tecnologia & Inovação',
    btnLabel: 'Acessar Ativos de Ciência, Tecnologia & Inovação',
    rota: '/ativos',
    descricao: 'Catálogo espacializado e georreferenciado de toda a rede física e institucional de pesquisa e inovação da Bahia.',
    destaques: [
      'Mapeamento de 10+ tipologias: Universidades, IFs, Parques Tecnológicos, ICTs e Hubs.',
      'Rede de Espaços Dinamizadores Colaborar interiorizando a cultura maker e inovadora.',
      'Filtros combinados simultâneos por Território, Município, Tipologia e Conexão RNP.',
      'Alternância ágil entre visualização no mapa interativo e tabela cadastral com busca.'
    ]
  },
  {
    id: 'cursos',
    tag: 'Capital Humano em CT&I',
    title: 'Ensino Superior em CT&I (Cursos Presenciais)',
    btnLabel: 'Acessar Ensino Superior em CT&I',
    rota: '/cursos',
    descricao: 'Diagnóstico da oferta formativa presencial de graduação e pós-graduação voltada a Ciência, Tecnologia e Inovação (CT&I).',
    destaques: [
      'Mapeamento de cursos de CT&I: Engenharias, Computação/TIC, Ciências Agrárias, Biotecnologia e Exatas.',
      'Identificação territorial de campi universitários públicos e privados credenciados com oferta em CT&I.',
      'Mapeamento da densidade de oferta formativa de CT&I por território e identificação de vocações locais.',
      'Subsídio para editais e políticas estaduais de atração e fixação de talentos científicos.'
    ]
  },
  {
    id: 'cadeias',
    tag: 'Economia Regional',
    title: 'Cadeias Produtivas, APLs & IGs',
    btnLabel: 'Acessar Cadeias Produtivas, APLs & IGs',
    rota: '/cadeia',
    descricao: 'Mapeamento das matrizes produtivas e ativos de propriedade intelectual que geram valor econômico no interior baiano.',
    destaques: [
      'Arranjos Produtivos Locais (APLs) estruturados e em consolidação em setores agropecuários e industriais.',
      'Indicações Geográficas (IGs) certificadas pelo INPI agregando notoriedade aos produtos baianos.',
      'Cruzamento direto entre a vocação econômica regional e a infraestrutura científica instalada.',
      'Identificação de oportunidades concretas de transferência de tecnologia e pesquisa aplicada.'
    ]
  },
  {
    id: 'relatorios',
    tag: 'Exportação & BI',
    title: 'Central de Relatórios & Impressão PDF',
    btnLabel: 'Acessar Central de Relatórios',
    rota: '/relatorio',
    descricao: 'Gerador sob demanda de relatórios executivos em alta definição (padrões paisagem e A4) para impressão.',
    destaques: [
      'Modelos oficiais diagramados: Síntese Territorial, Relatório de Ativos de CT&I e Relatório de Ensino.',
      'Padronização visual governamental de alto padrão para apresentações e audiências públicas.',
      'Exportação instantânea com suporte a vetores nítidos e paginação inteligente.'
    ]
  }
];

// ================= DADOS DOS INDICADORES ESTRATÉGICOS =================
const indicadoresEstrategicos = [
  {
    titulo: 'Conectividade Avançada RNP',
    tag: 'Infraestrutura Digital & Redes',
    descricao: 'Monitoramento da presença de rede óptica de altíssima capacidade operada pela RNP nas 5 tipologias prioritárias de ensino e pesquisa (Universidades Federais, Estaduais, IFs, IES Privadas e ICTs).'
  },
  {
    titulo: 'Índice IFDM (FIRJAN)',
    tag: 'Desenvolvimento Territorial',
    descricao: 'Índice FIRJAN de Desenvolvimento Municipal (2023), medido a partir de estatísticas oficiais de Emprego & Renda, Educação e Saúde, permitindo rankings internos municipais.'
  },
  {
    titulo: 'Densidade de Ativos CT&I',
    tag: 'Capacidade Instalada',
    descricao: 'Mapeamento consolidado das estruturas de pesquisa e inovação: Universidades Públicas, IFs, Faculdades Privadas, Parques Tecnológicos, ICTs, Incubadoras e Espaços Colaborar.'
  },
  {
    titulo: 'Cursos Superiores de CT&I',
    tag: 'Formação em CT&I',
    descricao: 'Mapeamento da oferta presencial de ensino superior nas áreas de Ciência, Tecnologia e Inovação (Engenharias, Computação, Exatas, Biotecnologia e Agrárias).'
  },
  {
    titulo: 'Cadeias Produtivas & APLs',
    tag: 'Economia Regional',
    descricao: 'Aglomerações territoriais de micro, pequenas e médias empresas com especialização produtiva comum, fomentadas pelo Estado para gerar agregação de valor tecnológico.'
  },
  {
    titulo: 'Indicações Geográficas (IGs)',
    tag: 'Propriedade Intelectual',
    descricao: 'Reconhecimento oficial de produtos cuja notoriedade e qualidades se devem exclusivamente à origem geográfica baiana (cacau, café, cachaça, farinha, etc.), incluindo IGs registradas e potenciais.'
  },
  {
    titulo: 'Segmentos Econômicos',
    tag: 'Matrizes Produtivas',
    descricao: '41 segmentos econômicos catalogados detalhando a vocação produtiva, polos industriais e oportunidades de desenvolvimento socioeconômico em todo o território baiano.'
  },
  {
    titulo: 'Recorte do Semiárido Baiano',
    tag: 'Equidade Territorial',
    descricao: 'Indicador transversal que computa o percentual de municípios, ativos e cursos inseridos na delimitação oficial do Semiárido (definido pela SUDENE), orientando investimentos compensatórios.'
  }
];

// ================= COMPONENTE PRINCIPAL (LANDING HERO) =================
export default function LandingHero() {
  const navigate = useNavigate();
  const introRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const {
    territoriosData = [],
    ativosData = [],
    cursosData = [],
    listaCadeias = [],
    distribuicaoCadeias = []
  } = useContext(DataContext);

  const qtdCadeias = (distribuicaoCadeias && distribuicaoCadeias.length > 0)
    ? 88
    : (listaCadeias?.length || 88);

  const qtdSegmentos = 41;

  // Controle do Efeito de Digitação
  const subtitleText = "Uma plataforma interativa desenvolvida pela SECTI para consolidar, analisar e dar transparência aos dados de Ciência, Tecnologia e Inovação nos 27 Territórios de Identidade da Bahia.";
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < subtitleText.length) {
        setTypedText(subtitleText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 20);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.05 });

    if (introRef.current) observer.observe(introRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="w-full min-h-screen font-sans relative text-neutral-900 scroll-smooth bg-slate-50 overflow-x-hidden">

      {/* ================= FUNDO SUTIL E LIMPO (SEM BLOBS QUE PREJUDIQUEM A LEITURA) ================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] lg:w-[800px] lg:h-[800px] bg-primary-100/50 rounded-full filter blur-[140px] opacity-40"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] lg:w-[600px] lg:h-[600px] bg-primary-100/40 rounded-full filter blur-[140px] opacity-30"></div>
        <div className="absolute -bottom-[20%] left-[15%] w-[500px] h-[500px] lg:w-[900px] lg:h-[900px] bg-blue-50/50 rounded-full filter blur-[160px] opacity-30"></div>

        {/* Linhas orbitais arquitetônicas sutis */}
        <div className="absolute top-[-5%] right-[-40%] lg:right-[-25%] w-[1200px] h-[1200px] lg:w-[1800px] lg:h-[1800px] border border-primary-900/[0.04] rounded-[40%] rotate-[35deg]" />
        <div className="absolute top-[15%] right-[-30%] lg:right-[-15%] w-[1300px] h-[1300px] lg:w-[2000px] lg:h-[2000px] border border-primary-900/[0.03] rounded-[35%] rotate-[60deg]" />
      </div>

      {/* ================= SEÇÃO 1: HERO ================= */}
      <section className="relative w-full min-h-[calc(100vh-22px)] flex flex-col justify-between px-6 sm:px-10 lg:px-12 pt-6 sm:pt-8 pb-12 sm:pb-16 z-10 max-w-[1600px] mx-auto">

        {/* HEADER SUPERIOR */}
        <header className="w-full flex items-center justify-between pb-4 sm:pb-5 border-b border-neutral-200">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex items-end gap-1 h-5">
                <div className="w-[3px] h-2.5 bg-primary-300 rounded-full" />
                <div className="w-[3px] h-4 bg-primary-600 rounded-full" />
                <div className="w-[3px] h-5 bg-primary-900 rounded-full" />
              </div>
              <span className="font-sans font-bold text-sm sm:text-base tracking-wider uppercase text-neutral-900">
                Painel Territorial CT&I
              </span>
            </div>

            <span className="text-neutral-300 font-light text-xl select-none">|</span>

            <img
              src="/img/brasao_preto.webp"
              alt="Governo do Estado da Bahia"
              className="h-10 sm:h-12 w-auto object-contain shrink-0"
            />
          </div>

          <nav className="flex items-center gap-5 sm:gap-8 text-xs sm:text-sm font-semibold text-neutral-700">
            <Link to="/" className="text-primary-700 font-bold transition-colors">
              Início
            </Link>
            <Link to="/territorios" className="hover:text-neutral-900 transition-colors">
              Dashboard
            </Link>
            <Link to="/sobre" className="hover:text-neutral-900 transition-colors">
              Sobre
            </Link>
            <Link to="/relatorio" className="hover:text-neutral-900 transition-colors">
              Relatório
            </Link>
          </nav>
        </header>

        {/* HERO TITLE & CALL TO ACTION (CENTRALIZADO VERTICALMENTE, TEXTO À ESQUERDA) */}
        <div className="w-full flex-1 flex flex-col justify-center my-auto py-8 sm:py-14">
          <div className="max-w-4xl lg:max-w-5xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-primary-200 text-xs font-bold uppercase text-primary-700 mb-4 sm:mb-6 shadow-xs justify-center leading-none">
              <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
              Plataforma de Inteligência Territorial · SECTI
            </div>

            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl lg:text-[68px] leading-[1.08] mb-4 sm:mb-6 text-neutral-900 tracking-tight text-left">
              Ciência, Tecnologia <br />
              <span className="text-primary-700">
                & Inovação
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-neutral-800 font-medium leading-relaxed mb-6 sm:mb-8 min-h-[50px] max-w-3xl text-left">
              {typedText}
              <span className="inline-block w-1.5 h-4 ml-1 bg-primary-600 animate-pulse align-middle" />
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <button
                onClick={() => navigate('/territorios')}
                className="px-7 py-3.5 rounded-xl bg-primary-700 hover:bg-primary-800 flex items-center gap-3 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-white w-fit cursor-pointer group"
              >
                <span className="font-sans font-bold text-sm sm:text-base">
                  Explorar o Painel
                </span>
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </button>

              <a
                href="#modulos"
                className="px-5 py-3.5 rounded-xl bg-white border border-neutral-300 text-neutral-800 font-semibold text-sm hover:bg-neutral-50 hover:border-neutral-400 transition-all inline-flex items-center gap-2 shadow-xs"
              >
                <span>Conhecer os Módulos</span>
                <ArrowDown size={15} />
              </a>

              <Link
                to="/sobre"
                className="px-4 py-3.5 text-neutral-700 hover:text-neutral-950 font-semibold text-sm transition-colors"
              >
                Documentação Completa
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SEÇÃO 2: O PROJETO & OBJETIVOS ================= */}
      <section id="introducao" ref={introRef} className="w-full px-6 sm:px-10 lg:px-12 pt-16 sm:pt-24 pb-20 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-10">

          <div className="flex flex-col gap-2 max-w-4xl lg:max-w-5xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
              O que é o Painel Territorial?
            </h2>

            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 mt-1">
              Sobre a Iniciativa · SECTI Bahia
            </span>

            <p className="text-sm sm:text-base text-neutral-900 font-normal leading-relaxed mt-2">
              O <strong>Painel Territorial de CT&I da Bahia</strong> é uma plataforma digital interativa, desenvolvida pela <strong>Secretaria de Ciência, Tecnologia e Inovação (SECTI)</strong>, para consolidar, analisar e dar transparência aos principais dados do ecossistema de CT&I nos <strong>27 Territórios de Identidade</strong> do estado.
            </p>
            <p className="text-xs sm:text-sm text-neutral-800 font-normal leading-relaxed">
              A ferramenta foi concebida como um instrumento estratégico para mapear as capacidades, vocações e desafios de cada região, oferecendo uma visão integrada e georreferenciada de ativos cruciais para o desenvolvimento socioeconômico.
            </p>
          </div>

          {/* NOSSOS OBJETIVOS (4 CARDS MINIMALISTAS) */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 block mb-3">
              Nossos Objetivos Estratégicos
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                {
                  t: 'Apoiar a Tomada de Decisão',
                  d: 'Fornecer dados qualificados para subsidiar o planejamento e a formulação de políticas públicas.'
                },
                {
                  t: 'Promover a Transparência',
                  d: 'Disponibilizar de forma aberta informações sobre investimentos, infraestrutura e indicadores de CT&I.'
                },
                {
                  t: 'Fomentar a Articulação',
                  d: 'Facilitar a identificação de sinergias entre governo, setor produtivo, academia e sociedade civil.'
                },
                {
                  t: 'Democratizar a Informação',
                  d: 'Servir como fonte de consulta para pesquisadores, estudantes, gestores e investidores.'
                }
              ].map((obj, idx) => (
                <div key={idx} className="p-4 sm:p-5 rounded-xl bg-white border border-neutral-200/80 flex flex-col justify-between hover:border-neutral-300 transition-colors shadow-2xs">
                  <h3 className="font-semibold text-sm sm:text-base text-neutral-900 mb-1.5">
                    {obj.t}
                  </h3>
                  <p className="text-xs text-neutral-800 leading-relaxed font-normal">
                    {obj.d}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ================= SEÇÃO 3: MÓDULOS DA PLATAFORMA & O QUE OS COMPÕE ================= */}
      <section id="modulos" className="w-full px-6 sm:px-10 lg:px-12 py-16 max-w-[1600px] mx-auto border-t border-neutral-200/70">
        <div className="flex flex-col gap-8">

          <div className="flex flex-col gap-1.5 max-w-4xl lg:max-w-5xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700">
              Arquitetura & Navegação
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Módulos da Plataforma
            </h2>
            <p className="text-sm text-neutral-800 font-normal leading-relaxed">
              Conheça as ferramentas analíticas disponíveis em cada módulo do Painel SECTI e o que compõe cada área da plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5 sm:gap-6">
            {modulosPlataforma.map((modulo, idx) => {
              const colSpan = idx < 3 ? 'lg:col-span-2' : 'md:col-span-1 lg:col-span-3';
              return (
                <div
                  key={modulo.id}
                  className={`bg-white rounded-xl border border-neutral-200/80 p-5 sm:p-6 flex flex-col justify-between hover:border-neutral-300 transition-colors shadow-2xs ${colSpan}`}
                >
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-700 block mb-1">
                      {modulo.tag}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight leading-snug mb-2">
                      {modulo.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-neutral-800 font-normal leading-relaxed mb-4">
                      {modulo.descricao}
                    </p>

                    <div className="space-y-1.5 border-t border-neutral-100 pt-3.5 mb-5">
                      <span className="text-[11px] font-semibold text-neutral-900 block mb-1">
                        O que compõe:
                      </span>
                      {modulo.destaques.map((item, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2 text-xs text-neutral-800 leading-relaxed">
                          <span className="text-primary-600 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={modulo.rota}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors pt-3 border-t border-neutral-100"
                  >
                    <span>{modulo.btnLabel}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ================= SEÇÃO 4: INDICADORES ESTRATÉGICOS & NOVAS MÉTRICAS ================= */}
      <section id="indicadores" className="w-full px-6 sm:px-10 lg:px-12 pt-16 pb-24 max-w-[1600px] mx-auto border-t border-neutral-200/70">
        <div className="flex flex-col gap-8">

          <div className="flex flex-col gap-1.5 max-w-4xl lg:max-w-5xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700">
              Métricas & Dados Territoriais
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              Indicadores Estratégicos
            </h2>
            <p className="text-sm text-neutral-800 font-normal leading-relaxed">
              Definições e conceitos das métricas processadas pela plataforma para diagnósticos regionais e subsidiar políticas públicas de CT&I.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {indicadoresEstrategicos.map((ind, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-neutral-200/80 p-5 flex flex-col justify-between hover:border-neutral-300 transition-colors shadow-2xs"
              >
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-700 block mb-1">
                    {ind.tag}
                  </span>
                  <h3 className="font-semibold text-sm sm:text-base text-neutral-900 mb-2">
                    {ind.titulo}
                  </h3>
                  <p className="text-xs text-neutral-800 leading-relaxed font-normal">
                    {ind.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

    </main>
  );
}