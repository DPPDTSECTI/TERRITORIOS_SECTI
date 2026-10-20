import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowDown,
  Network,
  Building2,
  GraduationCap,
  Milestone,
  FileText,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Database,
  Compass,
  MapPin
} from 'lucide-react';
import FontesReferenciasSection from './FontesReferenciasSection';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Chip';
import { fadeUp } from '../lib/motion';

function SectionTitle({ tag, title, subtitle }) {
  return (
    <div className="flex flex-col gap-1.5 mb-6">
      {tag && (
        <span className="text-micro font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          {tag}
        </span>
      )}
      <h2 className="text-headline font-bold tracking-tight text-text-primary">
        {title}
      </h2>
      {subtitle && (
        <p className="text-body text-text-secondary font-normal leading-relaxed max-w-4xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ================= DADOS DOS MÓDULOS DA PLATAFORMA =================
const secoesPlataforma = [
  {
    id: 'visao-geral',
    tag: 'Painel Central',
    icon: Compass,
    title: 'Visão Geral & Dashboard Integrado',
    btnLabel: 'Acessar Visão Geral & Dashboard',
    rota: '/territorios',
    descricao: 'Centro de comando executivo com mapa dinâmico da Bahia e cards de inteligência territorial reordenáveis.',
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
    icon: Building2,
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
    icon: GraduationCap,
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
    icon: Milestone,
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
    icon: FileText,
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
  const navigate = useNavigate();

  return (
    <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative bg-background font-sans w-full scroll-smooth">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-8 lg:py-12 flex flex-col space-y-12">

        {/* ================= CABEÇALHO PADRONIZADO (PageHeader) ================= */}
        <PageHeader
          title="Sobre o Painel Territorial de CT&I"
          subtitle="Documentação institucional, fundamentação metodológica e glossário dos indicadores estratégicos do ecossistema de Ciência, Tecnologia e Inovação da Bahia."
          badge={
            <Badge variant="primary" size="md">
              SECTI · Governo da Bahia
            </Badge>
          }
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  document.getElementById('fontes-referencias')?.scrollIntoView({ behavior: 'smooth' });
                }}
                iconRight={<ArrowDown size={14} />}
              >
                Fontes Oficiais
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/territorios')}
                iconRight={<ArrowRight size={14} />}
              >
                Acessar Painel
              </Button>
            </div>
          }
        />

        {/* APRESENTAÇÃO INSTITUCIONAL */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <Card className="p-6 sm:p-8 bg-surface border-border">
            <div className="max-w-4xl space-y-4">
              <span className="text-micro font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 block">
                Apresentação & Contexto Estratégico
              </span>
              <h2 className="text-headline font-bold text-text-primary tracking-tight">
                Inteligência Territorial para o Desenvolvimento Científico da Bahia
              </h2>
              <p className="text-body text-text-primary font-normal leading-relaxed">
                O <strong>Painel Territorial de CT&I da Bahia</strong> é uma plataforma digital interativa desenvolvida pela <strong>Secretaria de Ciência, Tecnologia e Inovação (SECTI)</strong> para consolidar, analisar e dar transparência aos principais dados do ecossistema de CT&I nos <strong>27 Territórios de Identidade</strong> do estado.
              </p>
              <p className="text-body text-text-secondary font-normal leading-relaxed">
                A ferramenta foi concebida como um instrumento estratégico para mapear as capacidades instaladas, vocações econômico-científicas e desafios de cada território, oferecendo uma visão integrada e georreferenciada de ativos indispensáveis para o planejamento governamental e atração de investimentos.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* =========================================================================
            SEÇÃO 1: INDICADOR ESTRATÉGICO: CONECTIVIDADE AVANÇADA RNP
            ========================================================================= */}
        <motion.section
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="scroll-mt-6"
        >
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 max-w-5xl">
              <div>
                <span className="text-micro font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 block mb-1.5">
                  Infraestrutura Digital · Rede Nacional de Ensino e Pesquisa (RNP)
                </span>
                <h2 className="text-headline font-bold tracking-tight text-text-primary mb-2.5">
                  Conectividade Avançada RNP
                </h2>
                <p className="text-body text-text-secondary leading-relaxed max-w-4xl font-normal">
                  A <strong className="text-text-primary font-semibold">Rede Nacional de Ensino e Pesquisa (RNP)</strong> opera o backbone acadêmico brasileiro de telecomunicações de altíssima velocidade. No Painel SECTI, o indicador RNP monitora a presença de conexões ópticas de alta capacidade nas instituições de ensino superior e centros tecnológicos da Bahia, elemento indispensável para pesquisas com grande volume de dados (Big Data, inteligência artificial, climatologia, biotecnologia e telemedicina).
                </p>
              </div>

              {/* As 5 Tipologias Estritas Monitoradas */}
              <div>
                <h3 className="text-caption font-semibold uppercase tracking-wider text-text-muted mb-3.5">
                  As 5 Tipologias Institucionais Monitoradas
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
                    <div
                      key={i}
                      className="bg-surface-soft rounded-control p-4 border border-border flex flex-col justify-between hover:border-border-strong transition-colors"
                    >
                      <div>
                        <strong className="block text-body-sm font-semibold text-text-primary tracking-tight mb-0.5">
                          {cat.titulo}
                        </strong>
                        <span className="inline-block text-micro font-medium text-text-muted mb-2">
                          {cat.siglas}
                        </span>
                        <p className="text-caption text-text-secondary leading-relaxed font-normal">
                          {cat.desc}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="bg-surface-soft border border-border rounded-control p-4 flex flex-col justify-center">
                    <span className="text-caption font-semibold uppercase tracking-wider text-text-primary block mb-1">
                      Critério & Ordenação
                    </span>
                    <p className="text-caption text-text-secondary leading-relaxed font-normal">
                      O painel compara a proporção <strong className="text-text-primary font-semibold">Com RNP</strong> vs. <strong className="text-text-primary font-semibold">Sem RNP</strong> por categoria e território, ordenando os registros estritamente em ordem <strong className="text-text-primary font-semibold">decrescente (DESC)</strong> para orientar decisões estratégicas de expansão.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </motion.section>

        {/* =========================================================================
            SEÇÃO 2: GUIA COMPLETO DAS SEÇÕES DA PLATAFORMA
            ========================================================================= */}
        <motion.section
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <SectionTitle
            tag="Navegação & Módulos"
            title="Guia das Seções da Plataforma"
            subtitle="Conheça a finalidade e as ferramentas analíticas disponíveis em cada módulo do Painel SECTI."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
            {secoesPlataforma.map((sec, idx) => {
              const colSpan = idx < 3 ? 'lg:col-span-2' : 'md:col-span-1 lg:col-span-3';
              const SecIcon = sec.icon;

              return (
                <Card
                  key={sec.id}
                  variant="interactive"
                  onClick={() => navigate(sec.rota)}
                  className={`p-5 sm:p-6 flex flex-col justify-between ${colSpan} group`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-8 h-8 rounded-control bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-200/40 dark:border-primary-800/40">
                        <SecIcon size={16} />
                      </div>
                      <Badge variant="primary" size="sm">
                        {sec.tag}
                      </Badge>
                    </div>

                    <h3 className="text-title font-bold text-text-primary tracking-tight leading-snug mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {sec.title}
                    </h3>

                    <p className="text-body-sm text-text-secondary font-normal leading-relaxed mb-4">
                      {sec.descricao}
                    </p>

                    <div className="space-y-1.5 border-t border-border/80 pt-3.5 mb-5">
                      <span className="text-micro font-bold uppercase tracking-wider text-text-muted block mb-1">
                        Destaques analíticos:
                      </span>
                      {sec.destaques.map((item, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2 text-caption text-text-secondary leading-relaxed">
                          <span className="text-primary-600 dark:text-primary-400 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/80 flex items-center justify-between text-body-sm font-semibold text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                    <span>{sec.btnLabel || `Acessar ${sec.title}`}</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.section>

        {/* =========================================================================
            SEÇÃO 3: DEFINIÇÕES DOS DEMAIS INDICADORES (KPIS)
            ========================================================================= */}
        <motion.section
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <SectionTitle
            tag="Conceitos & Métricas"
            title="Indicadores & Métricas Estratégicas"
            subtitle="Conceituação técnica dos índices processados pela plataforma para diagnósticos territoriais e relatórios de gestão pública."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                t: 'Conectividade Avançada RNP',
                tag: 'Infraestrutura Digital & Redes',
                icon: Network,
                d: 'Monitoramento da presença de rede banda larga de altíssima capacidade operada pela RNP nas 5 tipologias prioritárias de ensino e pesquisa, mensurando o suporte a dados de alta performance e inovação.'
              },
              {
                t: 'Índice IFDM (FIRJAN)',
                tag: 'Desenvolvimento Territorial',
                icon: TrendingUp,
                d: 'Índice FIRJAN de Desenvolvimento Municipal (2023), medido a partir de estatísticas oficiais de Emprego & Renda, Educação e Saúde. O painel calcula a média do Território e o ranking interno entre seus municípios.'
              },
              {
                t: 'Densidade de Ativos CT&I',
                tag: 'Capacidade Instalada',
                icon: Database,
                d: 'Mapeamento consolidado das estruturas de pesquisa e inovação: Universidades Públicas, IFs, Faculdades Privadas, Parques Tecnológicos, Centros de Pesquisa, Incubadoras e Espaços Colaborar.'
              },
              {
                t: 'Cursos Superiores de CT&I',
                tag: 'Formação em CT&I',
                icon: GraduationCap,
                d: 'Mapeamento da oferta presencial de ensino superior nas áreas do conhecimento voltadas diretamente a Ciência, Tecnologia e Inovação (Engenharias, Computação/TIC, Ciências Exatas, Biotecnologia e Agrárias).'
              },
              {
                t: 'Arranjos Produtivos (APLs)',
                tag: 'Economia Regional',
                icon: Milestone,
                d: 'Aglomerações territoriais de micro, pequenas e médias empresas com especialização produtiva comum, fomentadas pelo Governo para gerar emprego qualificado e agregação de valor tecnológico.'
              },
              {
                t: 'Indicações Geográficas (IGs)',
                tag: 'Propriedade Intelectual',
                icon: Sparkles,
                d: 'Reconhecimento oficial de produtos cuja notoriedade ou características se devem exclusivamente à sua origem geográfica baiana (ex: Cacau do Sul da Bahia, Café de Piatã, Cachaça de Abaíra, Farinha de Copioba).'
              },
              {
                t: 'Recorte do Semiárido Baiano',
                tag: 'Equidade Territorial',
                icon: MapPin,
                d: 'Indicador transversal que computa o percentual de municípios, ativos e cursos inseridos na delimitação oficial do Semiárido (definido pela SUDENE), orientando investimentos compensatórios.'
              }
            ].map((kpi, idx) => {
              const KpiIcon = kpi.icon;
              return (
                <Card
                  key={idx}
                  className="p-5 flex flex-col justify-between hover:border-border-strong transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-micro font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                        {kpi.tag}
                      </span>
                      <div className="w-6 h-6 rounded-control bg-surface-soft text-text-muted flex items-center justify-center shrink-0 border border-border">
                        <KpiIcon size={13} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-body text-text-primary mb-2">
                      {kpi.t}
                    </h3>
                    <p className="text-caption text-text-secondary leading-relaxed font-normal">
                      {kpi.d}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.section>

        {/* =========================================================================
            SEÇÃO 4: METODOLOGIA, FONTES DE DADOS E GOVERNANÇA
            ========================================================================= */}
        <motion.section
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <SectionTitle
            tag="Rigor Técnico"
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
              <Card
                key={idx}
                className="p-5 sm:p-6 flex flex-col justify-between hover:border-border-strong transition-colors"
              >
                <div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-control bg-surface-soft border border-border text-caption font-mono font-bold text-text-muted mb-3">
                    ETAPA {step.passo}
                  </div>
                  <h3 className="text-title font-semibold text-text-primary mb-2">
                    {step.titulo}
                  </h3>
                  <p className="text-body-sm text-text-secondary leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* =========================================================================
            SEÇÃO 5: FONTES OFICIAIS & REFERÊNCIAS METODOLÓGICAS DO PAINEL
            ========================================================================= */}
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <FontesReferenciasSection />
        </motion.div>

        {/* =========================================================================
            SEÇÃO 6: NOSSOS OBJETIVOS ESTRATÉGICOS
            ========================================================================= */}
        <motion.section
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <SectionTitle
            tag="Missão & Propósito"
            title="Nossos Objetivos Estratégicos"
            subtitle="Finalidades estratégicas do Painel Territorial de CT&I para impulsionar o desenvolvimento regional equilibrado."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                t: 'Apoiar a Tomada de Decisão',
                d: 'Fornecer dados qualificados para subsidiar o planejamento, priorização orçamentária e a formulação de políticas públicas do Governo do Estado.',
                icon: TrendingUp
              },
              {
                t: 'Promover a Transparência',
                d: 'Disponibilizar de forma aberta e auditável informações sobre investimentos, infraestrutura e indicadores de CT&I para toda a sociedade.',
                icon: ShieldCheck
              },
              {
                t: 'Fomentar a Articulação',
                d: 'Facilitar a identificação de sinergias produtivas entre governo, setor empresarial, academia e movimentos sociais.',
                icon: Sparkles
              },
              {
                t: 'Democratizar a Informação',
                d: 'Servir como fonte de consulta confiável para pesquisadores, estudantes, gestores municipais e empreendedores inovadores.',
                icon: CheckCircle2
              }
            ].map((item, idx) => {
              const ItemIcon = item.icon;
              return (
                <Card
                  key={idx}
                  className="p-5 sm:p-6 hover:border-border-strong transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-control bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-200/50 dark:border-primary-800/50 mt-0.5">
                      <ItemIcon size={20} />
                    </div>
                    <div>
                      <h3 className="text-body font-semibold text-text-primary mb-1">
                        {item.t}
                      </h3>
                      <p className="text-body-sm text-text-secondary leading-relaxed font-normal">
                        {item.d}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.section>

      </div>
    </main>
  );
}