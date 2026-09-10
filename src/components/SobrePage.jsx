import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, ArrowUpRight } from 'lucide-react';
import FontesReferenciasSection from './FontesReferenciasSection';

function SectionTitle({ title, subtitle }) {
  return (
    <div className="flex flex-col gap-1.5 mb-6">
      <h2 className="font-bold tracking-tight text-xl sm:text-2xl text-neutral-900">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-neutral-700 font-normal leading-relaxed max-w-3xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// SEÇÕES DA PLATAFORMA
const secoesPlataforma = [
  {
    id: 'visao-geral',
    tag: 'Painel Central',
    title: 'Visão Geral & Dashboard Integrado',
    rota: '/territorios',
    descricao: 'Centro de comando executivo com mapa dinâmico da Bahia e cards de inteligência reordenáveis.',
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
      'Rede de Espaços Dinamizadores Colaborar integrando e interiorizando a cultura empreendedora.',
      'Filtros combinados por Território de Identidade, Município, Tipologia e Conectividade RNP.',
      'Alternância ágil entre mapa interativo e tabela cadastral com busca textual.'
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
      'Subsídio para editais e políticas públicas estaduais de atração e fixação de talentos científicos.'
    ]
  },
  {
    id: 'cadeias',
    tag: 'Economia Regional',
    title: 'Cadeias Produtivas, APLs & IGs',
    btnLabel: 'Acessar Cadeias Produtivas, APLs & IGs',
    rota: '/cadeia',
    descricao: 'Mapeamento das matrizes produtivas e ativos de propriedade intelectual que geram valor econômico no interior.',
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

export default function SobrePage() {
  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative bg-background font-sans w-full scroll-smooth">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-8 lg:py-12 flex flex-col gap-12">

        {/* HERO HEADER */}
        <header className="flex flex-col items-start gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
            Documentação Institucional & Metodológica
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 leading-tight">
            Sobre o Painel Territorial de CT&I
          </h1>

          <p className="text-base sm:text-lg max-w-4xl leading-relaxed text-neutral-900 font-normal mt-1">
            O <strong>Painel Territorial de CT&I da Bahia</strong> é uma plataforma digital interativa, desenvolvida pela <strong>Secretaria de Ciência, Tecnologia e Inovação (SECTI)</strong>, para consolidar, analisar e dar transparência aos principais dados do ecossistema de CT&I nos <strong>27 Territórios de Identidade</strong> do estado.
          </p>

          <p className="text-sm sm:text-base max-w-4xl leading-relaxed text-neutral-800 font-normal">
            A ferramenta foi concebida como um instrumento estratégico para mapear as capacidades, vocações e desafios de cada região, oferecendo uma visão integrada e georreferenciada de ativos cruciais para o desenvolvimento socioeconômico.
          </p>

          <a
            href="#fontes-referencias"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900 hover:underline underline-offset-4 transition-colors mt-1"
          >
            <span>Consultar 48 fontes oficiais e referências metodológicas</span>
            <ArrowDown size={13} />
          </a>
        </header>

        {/* =========================================================================
            SEÇÃO 1: INDICADOR ESTRATÉGICO: CONECTIVIDADE AVANÇADA RNP
            ========================================================================= */}
        <section className="rounded-2xl bg-neutral-900 p-6 sm:p-8 text-white border border-neutral-800">
          <div className="flex flex-col gap-6 max-w-5xl">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 block mb-2">
                Infraestrutura Digital · Rede Nacional de Ensino e Pesquisa (RNP)
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2.5">
                Conectividade Avançada RNP
              </h2>
              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-4xl font-normal">
                A <strong>Rede Nacional de Ensino e Pesquisa (RNP)</strong> opera o backbone acadêmico brasileiro de telecomunicações de altíssima velocidade. No Painel SECTI, o indicador RNP monitora a presença de conexões ópticas de alta capacidade nas instituições de ensino superior e centros tecnológicos da Bahia, elemento indispensável para pesquisas com grande volume de dados (Big Data, inteligência artificial, climatologia, biotecnologia e telemedicina).
              </p>
            </div>

            {/* As 5 Tipologias Estritas Monitoradas */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                As 5 Tipologias Institucionais Monitoradas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[
                  {
                    titulo: 'Campi Univ. Público Federal',
                    siglas: 'UFBA · UFRB · UFSB · UFOB · UNIVASF',
                    desc: 'Polos de programas de pós-graduação stricto sensu e laboratórios avançados com conexão RNP de altíssima performance.'
                  },
                  {
                    titulo: 'Campi Univ. Público Estadual',
                    siglas: 'UNEB · UEFS · UESC · UESB',
                    desc: 'A principal espinha dorsal de interiorização do ensino superior, conectando o semiárido ao litoral baiano.'
                  },
                  {
                    titulo: 'Campi Inst. Federal',
                    siglas: 'IFBA e IF Baiano',
                    desc: 'Institutos dedicados à educação profissionalizante, formação tecnológica e inovação aplicada às vocações regionais.'
                  },
                  {
                    titulo: 'Campi Univ. Privada',
                    siglas: 'Faculdades e Centros Universitários',
                    desc: 'Instituições privadas credenciadas com graduações ativas nas áreas prioritárias de Ciência, Tecnologia e Inovação.'
                  },
                  {
                    titulo: 'ICTs (Institutos de Pesquisa)',
                    siglas: 'SENAI CIMATEC · Fiocruz/IGM · Embrapa',
                    desc: 'Centros e institutos dedicados à pesquisa aplicada, ensaios laboratoriais e desenvolvimento tecnológico de ponta.'
                  }
                ].map((cat, i) => (
                  <div key={i} className="bg-neutral-800/60 rounded-xl p-4 border border-neutral-700/60 flex flex-col justify-between">
                    <div>
                      <strong className="block text-sm font-semibold text-white tracking-tight mb-0.5">
                        {cat.titulo}
                      </strong>
                      <span className="inline-block text-[11px] font-medium text-neutral-400 mb-2">
                        {cat.siglas}
                      </span>
                      <p className="text-xs text-neutral-300 leading-relaxed font-normal">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="bg-neutral-800/40 border border-neutral-700/50 rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300 block mb-1">
                    Critério & Ordenação
                  </span>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                    O painel compara a proporção <strong>Com RNP</strong> vs. <strong>Sem RNP</strong> por categoria e território, ordenando os registros estritamente em ordem <strong>decrescente (DESC)</strong> para identificar prioridades estratégicas de expansão.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            SEÇÃO 2: GUIA COMPLETO DAS SEÇÕES DA PLATAFORMA
            ========================================================================= */}
        <section>
          <SectionTitle
            title="Guia das Seções da Plataforma"
            subtitle="Conheça a finalidade e as ferramentas analíticas disponíveis em cada módulo do Painel SECTI."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
            {secoesPlataforma.map((sec, idx) => {
              const colSpan = idx < 3 ? 'lg:col-span-2' : 'md:col-span-1 lg:col-span-3';
              return (
                <div
                  key={sec.id}
                  className={`bg-white rounded-xl border border-neutral-200/80 p-5 sm:p-6 flex flex-col justify-between hover:border-neutral-300 transition-colors shadow-2xs ${colSpan}`}
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 block mb-1">
                      {sec.tag}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight leading-snug mb-2">
                      {sec.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-neutral-800 font-normal leading-relaxed mb-4">
                      {sec.descricao}
                    </p>

                    <div className="space-y-1.5 border-t border-neutral-100 pt-3.5 mb-5">
                      {sec.destaques.map((item, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2 text-xs text-neutral-700 leading-relaxed">
                          <span className="text-primary-600 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={sec.rota}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-700 hover:text-primary-900 transition-colors pt-3 border-t border-neutral-100"
                  >
                    <span>{sec.btnLabel || `Acessar ${sec.title}`}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            SEÇÃO 3: DEFINIÇÕES DOS DEMAIS INDICADORES (KPIS)
            ========================================================================= */}
        <section>
          <SectionTitle
            title="Indicadores & Métricas Estratégicas"
            subtitle="Conceituação técnica dos índices processados pela plataforma para diagnósticos territoriais e relatórios de gestão."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                t: 'Conectividade Avançada RNP',
                tag: 'Infraestrutura Digital & Redes',
                d: 'Monitoramento da presença de rede óptica de altíssima capacidade operada pela RNP nas 5 tipologias prioritárias de ensino e pesquisa (Universidades Federais, Estaduais, IFs, IES Privadas e ICTs), mensurando o suporte a dados de alta performance e inovação.'
              },
              {
                t: 'Índice IFDM (FIRJAN)',
                tag: 'Desenvolvimento Territorial',
                d: 'Índice FIRJAN de Desenvolvimento Municipal (2023), medido a partir de estatísticas oficiais de Emprego & Renda, Educação e Saúde. O painel calcula tanto a média do Território quanto o ranking interno entre seus municípios.'
              },
              {
                t: 'Densidade de Ativos CT&I',
                tag: 'Capacidade Instalada',
                d: 'Mapeamento consolidado das estruturas de pesquisa e inovação: Universidades Públicas, IFs, Faculdades Privadas, Parques Tecnológicos, Centros de P&D, Incubadoras, Aceleradoras e Espaços Dinamizadores Colaborar.'
              },
              {
                t: 'Cursos Superiores de CT&I',
                tag: 'Formação em CT&I',
                d: 'Mapeamento da oferta presencial de ensino superior nas áreas do conhecimento voltadas diretamente a Ciência, Tecnologia e Inovação (Engenharias, Computação/TIC, Ciências Exatas, Biotecnologia e Ciências Agrárias).'
              },
              {
                t: 'Arranjos Produtivos (APLs)',
                tag: 'Economia Regional',
                d: 'Aglomerações territoriais de micro, pequenas e médias empresas com especialização produtiva comum, fomentadas pelo Governo Estadual para gerar emprego qualificado e agregação de valor tecnológico.'
              },
              {
                t: 'Indicações Geográficas (IGs)',
                tag: 'Propriedade Intelectual',
                d: 'Reconhecimento oficial de produtos cuja notoriedade ou características se devem exclusivamente à sua origem geográfica baiana (ex: Cacau do Sul da Bahia, Café de Piatã, Cachaça de Abaíra, Farinha de Copioba).'
              },
              {
                t: 'Recorte do Semiárido Baiano',
                tag: 'Equidade Territorial',
                d: 'Indicador transversal que computa o percentual de municípios, ativos e cursos inseridos na delimitação oficial do Semiárido (definido pela SUDENE), orientando investimentos compensatórios contra desigualdades regionais.'
              }
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-neutral-200/80 p-5 flex flex-col justify-between hover:border-neutral-300 transition-colors shadow-2xs"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 block mb-1">
                    {kpi.tag}
                  </span>
                  <h3 className="font-semibold text-sm sm:text-base text-neutral-900 mb-2">
                    {kpi.t}
                  </h3>
                  <p className="text-xs text-neutral-800 leading-relaxed font-normal">
                    {kpi.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SEÇÃO 4: METODOLOGIA, FONTES DE DADOS E GOVERNANÇA
            ========================================================================= */}
        <section>
          <SectionTitle
            title="Metodologia & Governança de Dados"
            subtitle="Processo de integração contínua, higienização cadastral e as bases públicas oficiais que alimentam a plataforma."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                passo: '01',
                titulo: 'Coleta & Higienização',
                desc: 'Extração automatizada de microdados públicos e bases setoriais da SECTI. Deduplicação de cadastros, validação de nomes institucionais e conformidade documental.'
              },
              {
                passo: '02',
                titulo: 'Georreferenciamento',
                desc: 'Vinculação espacial estrita às malhas territoriais dos 27 Territórios de Identidade e coordenadas oficiais dos 417 municípios do IBGE.'
              },
              {
                passo: '03',
                titulo: 'Cálculo & Inteligência',
                desc: 'Processamento de rankings dinâmicos, cruzamento com o índice FIRJAN (IFDM) e cálculo de indicadores de conectividade RNP e Semiárido.'
              }
            ].map((step, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-neutral-200/80 p-5 flex flex-col justify-between hover:border-neutral-300 transition-colors shadow-2xs"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-neutral-500 block mb-2">
                    ETAPA {step.passo}
                  </span>
                  <h3 className="text-base font-semibold text-neutral-900 mb-2">
                    {step.titulo}
                  </h3>
                  <p className="text-xs text-neutral-800 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SEÇÃO 5: FONTES OFICIAIS & REFERÊNCIAS METODOLÓGICAS DO PAINEL
            ========================================================================= */}
        <FontesReferenciasSection />

        {/* =========================================================================
            SEÇÃO 6: NOSSOS OBJETIVOS
            ========================================================================= */}
        <section>
          <SectionTitle
            title="Nossos Objetivos"
            subtitle="Finalidades estratégicas do Painel Territorial de CT&I para impulsionar o desenvolvimento regional."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 bg-white rounded-xl border border-neutral-200/80 hover:border-neutral-300 transition-colors flex flex-col justify-center shadow-2xs"
              >
                <h3 className="text-sm sm:text-base font-semibold text-neutral-900 mb-1">
                  {item.t}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal">
                  {item.d}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}