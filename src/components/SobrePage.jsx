import React from 'react';
import { Link } from 'react-router-dom';
import {
  Map as MapIcon, Settings, Building2, Target, Eye, Users, Lightbulb,
  Database, MapPin, Calculator, Info, Zap, TrendingUp, GraduationCap,
  Milestone, Wifi, FileText, Sparkles, SunMedium, Layers, ArrowRight,
  ShieldCheck, CheckCircle2, Award, BarChart3, ArrowUpRight, ArrowDown
} from 'lucide-react';
import FontesReferenciasSection from './FontesReferenciasSection';

function SectionBadge({ icon: Icon, text }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-200/90 bg-primary-50 text-primary-900 text-xs font-bold uppercase tracking-wider shadow-2xs mb-3.5 cursor-default">
      {Icon && <Icon size={14} className="text-primary-700" />}
      <span>{text}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col gap-2 mb-8">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-primary-700 text-white shadow-sm">
          {Icon && <Icon size={22} strokeWidth={2.2} />}
        </div>
        <h2 className="font-extrabold tracking-tight text-2xl sm:text-3xl text-neutral-900">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="text-sm sm:text-base text-neutral-600 pl-0 sm:pl-[58px] font-normal leading-relaxed max-w-3xl">
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
    icone: BarChart3,
    cor: 'bg-blue-50 text-blue-800 border-blue-200',
    descricao: 'Centro de comando executivo com mapa dinâmico da Bahia e 4 cards de inteligência reordenáveis via Drag and Drop.',
    destaques: [
      'KPIs consolidados no topo com atualização em tempo real ao selecionar territórios.',
      'Mapa interativo de alta resolução com seleção por Território de Identidade e recorte municipal.',
      'Card Donut de Cursos Presenciais por grandes áreas de conhecimento e principais instituições de ensino.',
      'Card Pizza de Distribuição de Ativos detalhando os municípios pertencentes ao território.',
      'Card Ranking IFDM entre os municípios do território selecionado, com navegação Top, Média e Menores.',
      'Card de Proporção RNP nas 5 categorias estritas de ensino e pesquisa em ordem decrescente (DESC).'
    ]
  },
  {
    id: 'ativos',
    tag: 'Infraestrutura',
    title: 'Ativos de Ciência, Tecnologia & Inovação',
    rota: '/ativos',
    icone: Building2,
    cor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    descricao: 'Catálogo espacializado e georreferenciado de toda a rede física e institucional de pesquisa e inovação da Bahia.',
    destaques: [
      'Mapeamento completo de 10+ tipologias: Universidades, IFs, Parques Tecnológicos, ICTs e Hubs.',
      'Rede de Espaços Dinamizadores Colaborar integrando e interiorizando a cultura maker e empreendedora.',
      'Filtros combinados simultâneos por Território de Identidade, Município, Tipologia e Conectividade RNP.',
      'Alternância ágil entre visualização em mapa interativo e tabela cadastral com busca textual instantânea.'
    ]
  },
  {
    id: 'cursos',
    tag: 'Capital Humano',
    title: 'Ensino Superior & Cursos Presenciais',
    rota: '/cursos',
    icone: GraduationCap,
    cor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    descricao: 'Diagnóstico da oferta formativa presencial de graduação e pós-graduação em áreas estratégicas para o desenvolvimento.',
    destaques: [
      'Classificação por áreas do conhecimento: Engenharias, Computação/TIC, Ciências Agrárias e Exatas.',
      'Identificação territorial de campi universitários públicos (Federais e Estaduais) e privados credenciados.',
      'Mapeamento da densidade de oferta formativa por território e identificação de vocações locais.',
      'Subsídio para editais e políticas públicas estaduais de atração, fixação e interiorização de talentos.'
    ]
  },
  {
    id: 'cadeias',
    tag: 'Economia Regional',
    title: 'Cadeias Produtivas, APLs & IGs',
    rota: '/cadeia',
    icone: Milestone,
    cor: 'bg-amber-50 text-amber-900 border-amber-200',
    descricao: 'Mapeamento das matrizes produtivas e ativos de propriedade intelectual que geram valor econômico no interior.',
    destaques: [
      'Arranjos Produtivos Locais (APLs) estruturados e em consolidação em setores agropecuários e industriais.',
      'Indicações Geográficas (IGs) certificadas pelo INPI agregando notoriedade e valor aos produtos baianos.',
      'Cruzamento direto entre a vocação econômica regional e a infraestrutura científica instalada.',
      'Identificação de oportunidades concretas de transferência de tecnologia e pesquisa aplicada às cadeias.'
    ]
  },
  {
    id: 'semiarido',
    tag: 'Módulo Transversal',
    title: 'Módulo Especial: Semiárido Baiano',
    rota: '/territorios',
    icone: SunMedium,
    cor: 'bg-orange-50 text-orange-900 border-orange-200',
    descricao: 'Lente analítica direcionada para evidenciar as políticas de convivência com o semiárido em 218 municípios baianos.',
    destaques: [
      'Ativação em um clique do filtro transversal em qualquer tela da plataforma.',
      'Ambientação visual acolhedora com paleta solar e dourada inspirada na luminosidade do Semiárido.',
      'Recálculo automático dos KPIs comparando distribuição No Semiárido vs. Fora do Semiárido.',
      'Visibilidade para os desafios de infraestrutura e o elevado potencial em energias renováveis e biotecnologia.'
    ]
  },
  {
    id: 'relatorios',
    tag: 'Exportação & BI',
    title: 'Central de Relatórios & Impressão PDF',
    rota: '/relatorio',
    icone: FileText,
    cor: 'bg-slate-50 text-slate-800 border-slate-200',
    descricao: 'Gerador sob demanda de relatórios executivos em alta definição (padrões 16:9 paisagem e A4) para impressão.',
    destaques: [
      '3 modelos oficiais diagramados: Síntese Territorial, Relatório de Ativos de CT&I e Relatório de Ensino.',
      'Padronização visual governamental de alto padrão com cabeçalho oficial do Governo do Estado da Bahia.',
      'Exportação instantânea com suporte a vetores nítidos, paginação inteligente e tabelas paginadas.',
      'Documentos prontos para subsidiar audiências públicas, reuniões de secretariado e atração de investimentos.'
    ]
  }
];

export default function SobrePage() {
  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative bg-background font-sans w-full scroll-smooth">
      {/* Container Responsivo Centralizado com Margens Laterais Equilibradas */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-8 lg:py-12 flex flex-col gap-14 animate-soft-fade">

        {/* HERO HEADER */}
        <header className="flex flex-col items-start gap-4">
          <SectionBadge icon={Info} text="Documentação Institucional & Metodológica" />
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 leading-[1.15]">
            Sobre o <span className="text-primary-700 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 bg-clip-text text-transparent">Painel SECTI Bahia</span>
          </h1>
          
          <p className="text-base sm:text-lg max-w-4xl leading-relaxed text-neutral-700 font-normal">
            Plataforma de inteligência territorial desenvolvida pela <strong>Secretaria de Ciência, Tecnologia e Inovação (SECTI)</strong> do Governo do Estado da Bahia para consolidar, analisar e dar ampla transparência aos dados de CT&I, ensino superior, conectividade digital e vocações econômicas nos <strong>27 Territórios de Identidade</strong> e <strong>417 municípios baianos</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-1">
            <div className="w-24 h-1 bg-gradient-to-r from-primary-600 to-primary-300 rounded-full"></div>
            <a
              href="#fontes-referencias"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-primary-800 bg-primary-50 border border-primary-200/90 hover:bg-primary-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Database size={13} className="text-primary-600" />
              <span>Ver 48 Fontes Oficiais & Cruzamentos FK</span>
              <ArrowDown size={13} />
            </a>
          </div>

          {/* FAIXA DE INDICADORES GERAIS (6 CARDS EQUILIBRADOS) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full mt-4">
            {[
              { valor: '27', rotulo: 'Territórios de Identidade', icone: MapIcon, cor: 'text-primary-600 bg-primary-50' },
              { valor: '417', rotulo: 'Municípios Monitorados', icone: MapPin, cor: 'text-emerald-600 bg-emerald-50' },
              { valor: '218', rotulo: 'Municípios no Semiárido', icone: SunMedium, cor: 'text-amber-600 bg-amber-50' },
              { valor: '174+', rotulo: 'Ativos Estratégicos CT&I', icone: Building2, cor: 'text-primary-700 bg-primary-50' },
              { valor: '72+', rotulo: 'Pontos Conectados à RNP', icone: Wifi, cor: 'text-blue-600 bg-blue-50' },
              { valor: '380+', rotulo: 'Cursos Presenciais CT&I', icone: GraduationCap, cor: 'text-indigo-600 bg-indigo-50' }
            ].map((stat, idx) => {
              const StatIcon = stat.icone;
              return (
                <div
                  key={idx}
                  className="bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-xs flex flex-col justify-between hover:shadow-card hover:border-primary-200 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stat.cor} transition-transform group-hover:scale-110`}>
                      <StatIcon size={16} strokeWidth={2.2} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bahia</span>
                  </div>
                  <div>
                    <span className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 block leading-none mb-1.5 tabular-nums">
                      {stat.valor}
                    </span>
                    <span className="text-xs font-medium text-neutral-600 leading-snug block">
                      {stat.rotulo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </header>

        {/* =========================================================================
            SEÇÃO 1: NOVO INDICADOR ESTRATÉGICO: CONECTIVIDADE AVANÇADA RNP
            ========================================================================= */}
        <section className="relative rounded-3xl bg-gradient-to-br from-[#12263F] via-[#1A365D] to-[#0F1E33] p-7 sm:p-9 lg:p-11 text-white shadow-xl overflow-hidden border border-blue-900/40">
          {/* Elementos visuais de fundo */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 right-8 opacity-10 pointer-events-none hidden sm:block">
            <Wifi size={280} strokeWidth={1} />
          </div>

          <div className="relative z-10 flex flex-col gap-6 max-w-5xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-neutral-950 shadow-sm uppercase tracking-wider">
                <Sparkles size={13} />
                NOVO INDICADOR ESTRATÉGICO
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
                <Wifi size={13} />
                Rede Nacional de Ensino e Pesquisa (RNP)
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-3">
                Conectividade Avançada RNP & Infraestrutura Digital
              </h2>
              <p className="text-white/90 text-sm sm:text-base lg:text-lg leading-relaxed max-w-4xl font-normal">
                A <strong>Rede Nacional de Ensino e Pesquisa (RNP)</strong> opera o backbone acadêmico brasileiro de telecomunicações de altíssima velocidade. No Painel SECTI, o indicador RNP monitora a presença de conexões ópticas de alta capacidade nas instituições de ensino superior e centros tecnológicos da Bahia, elemento indispensável para pesquisas com grande volume de dados (Big Data, inteligência artificial, climatologia, biotecnologia e telemedicina).
              </p>
            </div>

            {/* As 5 Tipologias Estritas Monitoradas */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300 mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} /> As 5 Tipologias Institucionais Monitoradas no Indicador RNP
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div key={i} className="bg-white/[0.08] hover:bg-white/[0.12] transition-colors rounded-2xl p-4 sm:p-5 border border-white/15 flex flex-col justify-between">
                    <div>
                      <strong className="block text-sm sm:text-base font-bold text-white tracking-tight mb-1">
                        {cat.titulo}
                      </strong>
                      <span className="inline-block text-[11px] font-bold text-amber-300 uppercase tracking-wide mb-2">
                        {cat.siglas}
                      </span>
                      <p className="text-xs sm:text-[13px] text-white/85 leading-relaxed font-normal">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="bg-amber-500/15 border border-amber-400/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-1.5">
                    Critério & Ordenação
                  </span>
                  <p className="text-xs sm:text-[13px] text-amber-100 leading-relaxed font-normal">
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
            icon={Layers}
            title="Guia Completo das Seções da Plataforma"
            subtitle="Conheça a finalidade, as ferramentas analíticas e os recursos de navegação disponíveis em cada módulo do Painel SECTI."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
            {secoesPlataforma.map((sec) => {
              const SecIcon = sec.icone;
              return (
                <div
                  key={sec.id}
                  className="bg-surface rounded-3xl border border-border shadow-xs hover:shadow-card-elevated hover:border-primary-200 transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between group cursor-default"
                >
                  <div>
                    {/* Topo do Card */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${sec.cor}`}>
                        <SecIcon size={24} strokeWidth={2.2} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 block">
                          {sec.tag}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight leading-snug">
                          {sec.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-sm sm:text-[15px] text-neutral-700 font-normal leading-relaxed mb-5">
                      {sec.descricao}
                    </p>

                    {/* Lista de Recursos */}
                    <div className="space-y-2.5 border-t border-neutral-100 pt-4 mb-6">
                      {sec.destaques.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0 mt-2"></span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Link Direto para a Seção */}
                  <Link
                    to={sec.rota}
                    className="inline-flex items-center justify-between w-full px-5 py-3 rounded-xl bg-neutral-50 hover:bg-primary-50 border border-neutral-200/80 hover:border-primary-200 text-xs sm:text-sm font-semibold text-neutral-800 hover:text-primary-800 transition-all duration-200"
                  >
                    <span>Explorar {sec.title.split(' & ')[0]}</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 text-primary-700" />
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
            icon={Zap}
            title="Indicadores & Métricas Estratégicas"
            subtitle="Conceituação técnica dos índices processados pela plataforma para embasar diagnósticos precisos e relatórios de gestão."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                t: 'Índice IFDM (FIRJAN)',
                tag: 'Desenvolvimento Territorial',
                d: 'Índice FIRJAN de Desenvolvimento Municipal (2023), medido a partir de estatísticas oficiais de Emprego & Renda, Educação e Saúde. O painel calcula tanto a média do Território quanto o ranking interno entre seus municípios.',
                icone: TrendingUp,
                cor: 'text-primary-700 bg-primary-50'
              },
              {
                t: 'Densidade de Ativos CT&I',
                tag: 'Capacidade Instalada',
                d: 'Mapeamento consolidado das estruturas de pesquisa e inovação: Universidades Públicas, IFs, Faculdades Privadas, Parques Tecnológicos, Centros de P&D, Incubadoras, Aceleradoras e Espaços Dinamizadores Colaborar.',
                icone: Building2,
                cor: 'text-emerald-700 bg-emerald-50'
              },
              {
                t: 'Cursos Superiores de CT&I',
                tag: 'Formação de Talentos',
                d: 'Mapeamento exclusivo de cursos presenciais nas áreas do conhecimento alinhadas ao desenvolvimento científico e industrial (Engenharias, Tecnologias da Informação, Ciências Exatas, Biotecnologia e Ciências Agrárias).',
                icone: GraduationCap,
                cor: 'text-indigo-700 bg-indigo-50'
              },
              {
                t: 'Arranjos Produtivos (APLs)',
                tag: 'Economia Regional',
                d: 'Aglomerações territoriais de micro, pequenas e médias empresas com especialização produtiva comum, fomentadas pelo Governo Estadual para gerar emprego qualificado e agregação de valor tecnológico.',
                icone: Milestone,
                cor: 'text-amber-800 bg-amber-50'
              },
              {
                t: 'Indicações Geográficas (IGs)',
                tag: 'Propriedade Intelectual',
                d: 'Reconhecimento oficial de produtos cuja notoriedade ou características se devem exclusivamente à sua origem geográfica baiana (ex: Cacau do Sul da Bahia, Café de Piatã, Cachaça de Abaíra, Farinha de Copioba).',
                icone: Award,
                cor: 'text-rose-700 bg-rose-50'
              },
              {
                t: 'Recorte do Semiárido Baiano',
                tag: 'Equidade Territorial',
                d: 'Indicador transversal que computa o percentual de municípios, ativos e cursos inseridos na delimitação oficial do Semiárido (definido pela SUDENE), orientando investimentos compensatórios contra desigualdades regionais.',
                icone: SunMedium,
                cor: 'text-orange-700 bg-orange-50'
              }
            ].map((kpi, idx) => {
              const KpiIcon = kpi.icone;
              return (
                <div
                  key={idx}
                  className="bg-surface rounded-3xl border border-border p-6 shadow-xs hover:shadow-card hover:border-primary-200 transition-all duration-300 flex flex-col justify-between cursor-default group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${kpi.cor}`}>
                        <KpiIcon size={22} strokeWidth={2.2} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {kpi.tag}
                      </span>
                    </div>

                    <h4 className="block font-bold text-base sm:text-lg text-neutral-900 tracking-tight mb-2">
                      {kpi.t}
                    </h4>

                    <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-normal">
                      {kpi.d}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            SEÇÃO 4: METODOLOGIA, FONTES DE DADOS E GOVERNANÇA
            ========================================================================= */}
        <section>
          <SectionTitle
            icon={Settings}
            title="Metodologia & Governança de Dados"
            subtitle="Conheça o processo de integração contínua, higienização cadastral e as bases públicas oficiais que alimentam a plataforma."
          />

          {/* Etapas do Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                passo: '01',
                titulo: 'Coleta & Higienização',
                desc: 'Extração automatizada de microdados públicos e bases setoriais da SECTI. Deduplicação de cadastros, validação de nomes institucionais e conformidade documental.',
                icone: Database
              },
              {
                passo: '02',
                titulo: 'Georreferenciamento',
                desc: 'Vinculação espacial estrita às malhas territoriais dos 27 Territórios de Identidade e coordenadas oficiais dos 417 municípios do IBGE.',
                icone: MapPin
              },
              {
                passo: '03',
                titulo: 'Cálculo & Inteligência',
                desc: 'Processamento de rankings dinâmicos, cruzamento com o índice FIRJAN (IFDM) e cálculo de indicadores de conectividade RNP e Semiárido.',
                icone: Calculator
              }
            ].map((step, idx) => {
              const StepIcon = step.icone;
              return (
                <div
                  key={idx}
                  className="relative bg-surface rounded-3xl border border-border p-6 sm:p-7 shadow-xs hover:shadow-card hover:border-primary-200 transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-default"
                >
                  <span className="absolute -right-3 -bottom-5 text-[110px] font-black leading-none text-neutral-100 select-none pointer-events-none group-hover:text-primary-50 transition-colors">
                    {step.passo}
                  </span>

                  <div>
                    <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-4 shadow-xs">
                      <StepIcon size={22} strokeWidth={2.2} />
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight mb-2 relative z-10">
                      {step.titulo}
                    </h4>

                    <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed relative z-10 font-normal">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            SEÇÃO 5: CATÁLOGO DE FONTES OFICIAIS & CRUZAMENTOS RELACIONAIS (SUPABASE FK)
            ========================================================================= */}
        <FontesReferenciasSection />

        {/* =========================================================================
            SEÇÃO 6: OBJETIVOS ESTRATÉGICOS DA SECTI
            ========================================================================= */}
        <section>
          <SectionTitle
            icon={Target}
            title="Objetivos Estratégicos"
            subtitle="Diretrizes do Governo do Estado da Bahia para a promoção da ciência, tecnologia e inovação cidadã."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                t: 'Subsídio à Tomada de Decisão Pública',
                d: 'Fornecer diagnósticos territoriais precisos e atualizados para subsidiar o desenho, implementação e avaliação de políticas públicas estaduais e atração de investimentos privados.',
                icone: Target,
                cor: 'text-primary-700 bg-primary-100'
              },
              {
                t: 'Transparência Ativa & Acesso Aberto',
                d: 'Democratizar o acesso aos dados sobre investimentos estaduais, instituições científicas e capacidade instalada de CT&I para pesquisadores, estudantes e sociedade civil.',
                icone: Eye,
                cor: 'text-emerald-700 bg-emerald-100'
              },
              {
                t: 'Articulação da Hélice Quádrupla',
                d: 'Fortalecer a cooperação orgânica entre Governo, Academia, Setor Produtivo e Sociedade para acelerar a transferência de tecnologia e inovação aplicada às vocações regionais.',
                icone: Users,
                cor: 'text-indigo-700 bg-indigo-100'
              },
              {
                t: 'Interiorização & Redução de Assimetrias',
                d: 'Identificar vazios tecnológicos e educacionais no interior e no semiárido para orientar editais de fomento, bolsas de pesquisa e instalação de novos equipamentos públicos.',
                icone: Lightbulb,
                cor: 'text-amber-700 bg-amber-100'
              }
            ].map((item, idx) => {
              const ItemIcon = item.icone;
              return (
                <div
                  key={idx}
                  className="p-6 bg-surface rounded-3xl border border-border shadow-xs hover:shadow-card hover:border-primary-200 flex items-start gap-4 sm:gap-5 transition-all duration-300 group cursor-default"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.cor} transition-transform group-hover:scale-105`}>
                    <ItemIcon size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h4 className="block text-base sm:text-lg font-bold mb-1.5 text-neutral-900 tracking-tight">
                      {item.t}
                    </h4>
                    <span className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-normal block">
                      {item.d}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            RODAPÉ INSTITUCIONAL
            ========================================================================= */}
        <footer className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-[13px] text-neutral-500">
          <div className="flex items-center gap-3.5">
            <img src="/img/favicon-96x96.webp" alt="Brasão SECTI" className="w-9 h-9 object-contain" />
            <div>
              <strong className="block text-neutral-900 font-bold text-sm">Secretaria de Ciência, Tecnologia e Inovação (SECTI)</strong>
              <span className="text-neutral-500 text-xs">Governo do Estado da Bahia · Salvador, BA</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/territorios" className="text-neutral-600 hover:text-primary-700 transition-colors font-semibold">
              Dashboard
            </Link>
            <Link to="/relatorio" className="text-neutral-600 hover:text-primary-700 transition-colors font-semibold">
              Relatórios
            </Link>
            <a href="#fontes-referencias" className="text-neutral-600 hover:text-primary-700 transition-colors font-semibold">
              Fontes & Referências
            </a>
            <a
              href="http://www.secti.ba.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-primary-700 transition-colors font-semibold inline-flex items-center gap-1"
            >
              <span>Portal SECTI</span>
              <ArrowUpRight size={14} />
            </a>
          </div>
        </footer>

      </div>
    </main>
  );
}