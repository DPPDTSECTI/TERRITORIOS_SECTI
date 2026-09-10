/**
 * Catálogo Oficial de Fontes de Dados & Referências Metodológicas
 * Plataforma de Inteligência Territorial - SECTI Governo do Estado da Bahia
 * 
 * Organizado de forma executiva em Categorias e Subcategorias temáticas,
 * com indicação precisa de onde cada dado está disponível no painel.
 */

export const FONTES_METADADOS = {
  totalReferencias: 48,
  totalCategorias: 4,
  totalSubcategorias: 10,
  coberturaTerritorial: '100% dos 27 Territórios de Identidade (417 municípios)',
  eixosTematicos: [
    'Cadeias Produtivas & Vocação Econômica',
    'Ecossistema de Inovação & Infraestrutura de CT&I',
    'Ensino Superior & Formação de Talentos',
    'Desenvolvimento Territorial & Geografia Oficial'
  ],
  orgaosPrincipais: [
    'MEC / INEP (Censo da Educação Superior)',
    'RNP / MCTI (Rede Nacional de Ensino e Pesquisa)',
    'Sistema FIRJAN (Índice IFDM de Desenvolvimento)',
    'IBGE & SUDENE (Demografia e Delimitação do Semiárido)',
    'SEPLAN-BA & SECULT-BA (Divisão dos 27 Territórios)',
    'MDIC (Observatório Nacional de APLs)',
    'INPI & MAPA (Indicações Geográficas e Signos Distintivos)',
    'SEBRAE & DataSebrae (Dossiês de Diagnóstico e Origens)',
    'Universidades Públicas Baianas (UFBA, UNEB, UESB, UEFS, UFRB)'
  ]
};

export const CATEGORIAS_REFERENCIAS = [
  {
    id: 'todas',
    label: 'Todas as Fontes',
    count: 48,
    icon: 'Layers'
  },
  {
    id: 'cadeias',
    label: 'Cadeias Produtivas',
    count: 32,
    icon: 'Milestone',
    descricao: 'Arranjos Produtivos Locais (APLs), Indicações Geográficas reconhecidas e com potencial'
  },
  {
    id: 'inovacao',
    label: 'Inovação & Conectividade',
    count: 12,
    icon: 'Building2',
    descricao: 'Rede RNP, Parques Tecnológicos, Centros de Pesquisa (ICTs), Incubadoras e Aceleradoras'
  },
  {
    id: 'educacao',
    label: 'Ensino Superior em CT&I',
    count: 1,
    icon: 'GraduationCap',
    descricao: 'Censo do Ensino Superior e oferta presencial exclusiva de cursos nas áreas de Ciência, Tecnologia e Inovação (CT&I)'
  },
  {
    id: 'territorio',
    label: 'Território & Indicadores',
    count: 3,
    icon: 'MapPin',
    descricao: '27 Territórios de Identidade, delimitação do Semiárido Baiano e Índice FIRJAN (IFDM)'
  }
];

export const SUBCATEGORIAS_REFERENCIAS = [
  {
    id: 'todas_sub',
    categoriaId: 'todas',
    label: 'Todas as Subcategorias',
    count: 48
  },
  // Subcategorias de Cadeias Produtivas
  {
    id: 'cadeia_ig_potencial',
    categoriaId: 'cadeias',
    label: 'IGs Potenciais & Estudos',
    count: 21,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    id: 'cadeia_ig_concedida',
    categoriaId: 'cadeias',
    label: 'IGs Registradas / Concedidas',
    count: 10,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    id: 'cadeia_apl',
    categoriaId: 'cadeias',
    label: 'Arranjos Produtivos Locais (APLs)',
    count: 1,
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  // Subcategorias de Inovação & Conectividade
  {
    id: 'inovacao_rnp',
    categoriaId: 'inovacao',
    label: 'Conectividade RNP',
    count: 1,
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200'
  },
  {
    id: 'inovacao_icts',
    categoriaId: 'inovacao',
    label: 'Parques Tecnológicos & ICTs',
    count: 2,
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200'
  },
  {
    id: 'inovacao_hubs',
    categoriaId: 'inovacao',
    label: 'Incubadoras & Aceleradoras',
    count: 9,
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200'
  },
  // Subcategoria de Ensino Superior
  {
    id: 'educacao_censo',
    categoriaId: 'educacao',
    label: 'Censo Superior (Cursos de CT&I)',
    count: 1,
    badgeColor: 'bg-violet-50 text-violet-800 border-violet-200'
  },
  // Subcategorias de Território
  {
    id: 'territorio_identidade',
    categoriaId: 'territorio',
    label: 'Divisão Territorial da Bahia',
    count: 1,
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200'
  },
  {
    id: 'territorio_semiarido',
    categoriaId: 'territorio',
    label: 'Delimitação do Semiárido',
    count: 1,
    badgeColor: 'bg-orange-50 text-orange-800 border-orange-200'
  },
  {
    id: 'territorio_ifdm',
    categoriaId: 'territorio',
    label: 'Índice FIRJAN (IFDM)',
    count: 1,
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
  }
];

export const REFERENCIAS_DATABASE = [
  // =========================================================================
  // INOVAÇÃO & CONECTIVIDADE
  // =========================================================================
  {
    id: 'RNP-BA',
    titulo: 'Rede Nacional de Ensino e Pesquisa (RNP) - PoP-BA',
    autorOuOrgao: 'RNP / MCTI / PoP-BA (UFBA)',
    texto: 'Backbone óptico acadêmico nacional de alta performance, conectando campi universitários públicos federais e estaduais, institutos federais, IES privadas credenciadas e centros tecnológicos (ICTs) da Bahia.',
    url: 'https://www.rnp.br',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_rnp',
    subcategoriaNome: 'Conectividade RNP',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Visão Geral" (Card Gráfico de Proporção RNP) e Aba "Ativos de CT&I" (Filtro e Coluna RNP no Catálogo)'
  },
  {
    id: 9,
    titulo: 'SENAI CIMATEC (Campus Integrado de Manufatura e Tecnologia)',
    autorOuOrgao: 'SENAI / FIEB',
    texto: 'Um dos mais avançados complexos de pesquisa aplicada, desenvolvimento tecnológico industrial, robótica, supercomputação e pós-graduação do Brasil, sediado em Salvador.',
    url: 'https://senaicimatec.com.br/',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_icts',
    subcategoriaNome: 'Parques Tecnológicos & ICTs',
    tipoFonte: 'Instituição de Pesquisa & Desenvolvimento',
    localizacaoPainel: 'Aba "Ativos de CT&I" > Filtro por Tipologia "ICT" e Mapa Interativo (Salvador)'
  },
  {
    id: 10,
    titulo: 'CIMATEC Park (Camaçari)',
    autorOuOrgao: 'SENAI / FIEB',
    texto: 'Parque tecnológico e industrial de 4 milhões de m² localizado no Polo Industrial de Camaçari, concebido para testes em escala real, energias renováveis, novos materiais e mobilidade avançada.',
    url: 'https://senaicimatec.com.br/',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_icts',
    subcategoriaNome: 'Parques Tecnológicos & ICTs',
    tipoFonte: 'Parque Tecnológico',
    localizacaoPainel: 'Aba "Ativos de CT&I" > Filtro por Tipologia "Parque Tecnológico" (Território Metropolitano de Salvador)'
  },
  {
    id: 5,
    titulo: 'Áity Incubadora de Empresas',
    autorOuOrgao: 'UNEB / SEBRAE',
    texto: 'Incubadora de empresas inovadoras e de base tecnológica vinculada à Universidade do Estado da Bahia (UNEB) em parceria com o SEBRAE, fomentando novos modelos de negócio.',
    url: 'https://inovacao.uneb.br/aity-incubadora-de-empresas-ja-ouviu-falar/',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_hubs',
    subcategoriaNome: 'Incubadoras & Aceleradoras',
    tipoFonte: 'Incubadora Universitária',
    localizacaoPainel: 'Aba "Ativos de CT&I" > Filtro por Tipologia "Incubadora" e Catálogo de Ativos'
  },
  {
    id: 6,
    titulo: 'Cyklo Agritech - Aceleradora do Agro',
    autorOuOrgao: 'Cyklo Agritech',
    texto: 'Primeira aceleradora de startups de agrotecnologia do MATOPIBA, sediada em Luís Eduardo Magalhães no Território Bacia do Rio Grande, fomentando a inovação no campo.',
    url: 'https://cykloagritech.com.br/',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_hubs',
    subcategoriaNome: 'Incubadoras & Aceleradoras',
    tipoFonte: 'Aceleradora de Startups',
    localizacaoPainel: 'Aba "Ativos de CT&I" > Filtro por Tipologia "Aceleradora" (Luís Eduardo Magalhães)'
  },
  {
    id: 7,
    titulo: 'Hub Conquista / Conquista Startups',
    autorOuOrgao: 'Hub Conquista',
    texto: 'Centro de inovação e fomento ao ecossistema de startups e novos empreendimentos no sudoeste baiano, sediado em Vitória da Conquista.',
    url: 'https://hubconquista.com.br/',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_hubs',
    subcategoriaNome: 'Incubadoras & Aceleradoras',
    tipoFonte: 'Hub de Inovação',
    localizacaoPainel: 'Aba "Ativos de CT&I" > Filtro por Tipologia "Hub de Inovação" (Vitória da Conquista)'
  },
  {
    id: 8,
    titulo: 'Plataforma & Comunidade Inventivos',
    autorOuOrgao: 'Inventivos',
    texto: 'Ecossistema e comunidade de aceleração de empreendedores e criadores com forte atuação na Bahia e foco em inovação inclusiva e economia criativa.',
    url: 'https://inventivos.co/',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_hubs',
    subcategoriaNome: 'Incubadoras & Aceleradoras',
    tipoFonte: 'Aceleradora de Impacto',
    localizacaoPainel: 'Aba "Ativos de CT&I" > Catálogo de Ambientes de Inovação'
  },
  {
    id: 11,
    titulo: 'GetIN Aceleradora de Startups',
    autorOuOrgao: 'GetIN Aceleradora',
    texto: 'Aceleradora de negócios escaláveis com foco em produtos tecnológicos, captação de venture capital e conexões de mercado na Bahia.',
    url: 'https://getin.inf.br/',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_hubs',
    subcategoriaNome: 'Incubadoras & Aceleradoras',
    tipoFonte: 'Aceleradora de Startups',
    localizacaoPainel: 'Aba "Ativos de CT&I" > Filtro por Tipologia "Aceleradora" e Tabela Cadastral'
  },
  {
    id: 12,
    titulo: 'IEBT Innovation Hub',
    autorOuOrgao: 'IEBT Innovation',
    texto: 'Consultoria e catalisadora de inovação aberta, inteligência estratégica e aceleração de novos negócios corporativos.',
    url: 'https://www.iebtinnovation.com/',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_hubs',
    subcategoriaNome: 'Incubadoras & Aceleradoras',
    tipoFonte: 'Hub de Inovação',
    localizacaoPainel: 'Aba "Ativos de CT&I" > Filtro por Tipologia "Hub de Inovação"'
  },
  {
    id: 13,
    titulo: 'Novatores Incubadora (UEFS)',
    autorOuOrgao: 'Universidade Estadual de Feira de Santana (UEFS)',
    texto: 'Incubadora de iniciativas e empreendimentos de base tecnológica da UEFS, no Território Portal do Sertão, aproximando a pesquisa científica do mercado regional.',
    url: 'https://novatores.uefs.br/',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_hubs',
    subcategoriaNome: 'Incubadoras & Aceleradoras',
    tipoFonte: 'Incubadora Universitária',
    localizacaoPainel: 'Aba "Ativos de CT&I" > Filtro por Tipologia "Incubadora" (Feira de Santana)'
  },
  {
    id: 14,
    titulo: 'Aceleradora Vale do Dendê',
    autorOuOrgao: 'Vale do Dendê',
    texto: 'Holding social e aceleradora de impacto voltada ao fomento do ecossistema criativo, de diversidade e tecnológico, sediada no Centro Histórico de Salvador.',
    url: 'https://www.valedodende.org/',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_hubs',
    subcategoriaNome: 'Incubadoras & Aceleradoras',
    tipoFonte: 'Aceleradora de Impacto',
    localizacaoPainel: 'Aba "Ativos de CT&I" > Filtro por Tipologia "Aceleradora" (Salvador)'
  },
  {
    id: 56,
    titulo: 'Hub Salvador (Parceria Prefeitura de Salvador, WOW e Wayra)',
    autorOuOrgao: 'Prefeitura de Salvador / WOW / Wayra',
    texto: 'Espaço público-privado de coinovação no bairro do Comércio em Salvador, integrando centenas de startups, investidores, coworking e aceleradoras multinacionais.',
    url: 'https://www.hubsalvador.com',
    categoriaId: 'inovacao',
    categoriaNome: 'Inovação & Conectividade',
    subcategoriaId: 'inovacao_hubs',
    subcategoriaNome: 'Incubadoras & Aceleradoras',
    tipoFonte: 'Hub de Inovação',
    localizacaoPainel: 'Aba "Ativos de CT&I" > Filtro por Tipologia "Hub de Inovação" (Salvador)'
  },

  // =========================================================================
  // CADEIAS PRODUTIVAS & ECONOMIA REGIONAL
  // =========================================================================
  {
    id: 17,
    titulo: 'Observatório Nacional de Arranjos Produtivos Locais (APLs)',
    autorOuOrgao: 'MDIC / Observatório Brasileiro de APL',
    texto: 'Cadastro oficial do Ministério do Desenvolvimento, Indústria, Comércio e Serviços que documenta os 54 Arranjos Produtivos Locais consolidados e em estruturação na Bahia.',
    url: 'https://www.gov.br/empresas-e-negocios/pt-br/portais-desconhecidos/observatorioapl',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_apl',
    subcategoriaNome: 'Arranjos Produtivos Locais (APLs)',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "APL" e Tabela de Arranjos Produtivos'
  },
  {
    id: 15,
    titulo: 'Indicações Geográficas (IGs) do Brasil - DataSebrae',
    autorOuOrgao: 'SEBRAE Origens / DataSebrae',
    texto: 'Plataforma oficial do SEBRAE de inteligência territorial e catalogação de signos distintivos, produtos tradicionais e indicações geográficas reconhecidas e potenciais no Brasil.',
    url: 'https://datasebrae.com.br/indicacoesgeograficas/',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_concedida',
    subcategoriaNome: 'IGs Registradas / Concedidas',
    tipoFonte: 'Plataforma de Inteligência Territorial',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG" e Mapa Interativo de Cadeias'
  },
  {
    id: 16,
    titulo: 'Portal de Serviços e Concessões de Indicação Geográfica - INPI',
    autorOuOrgao: 'INPI (Instituto Nacional da Propriedade Industrial)',
    texto: 'Órgão federal responsável pelo registro e concessão formal de Indicações de Procedência (IP) e Denominações de Origem (DO) para produtos e serviços brasileiros.',
    url: 'https://www.gov.br/inpi/pt-br/servicos/indicacoes-geograficas',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_concedida',
    subcategoriaNome: 'IGs Registradas / Concedidas',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG" (Signos Concedidos pelo INPI)'
  },
  {
    id: 34,
    titulo: 'MAPA - Cacau do Sul da Bahia (Indicação de Procedência Concedida)',
    autorOuOrgao: 'Ministério da Agricultura e Pecuária (MAPA) / INPI',
    texto: 'Indicação Geográfica concedida para o cacau em amêndoas do Sul da Bahia, reconhecendo sua tradição histórica e práticas sustentáveis no sistema cabruca.',
    url: 'https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_concedida',
    subcategoriaNome: 'IGs Registradas / Concedidas',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG" (Cacau do Sul da Bahia)'
  },
  {
    id: 35,
    titulo: 'MAPA - Café da Chapada Diamantina (Indicação de Procedência Concedida)',
    autorOuOrgao: 'Ministério da Agricultura e Pecuária (MAPA) / INPI',
    texto: 'Reconhecimento oficial dos cafés especiais arábica cultivados em altitudes elevadas na Chapada Diamantina (Piatã, Mucugê, Ibicoara), premiados internacionalmente.',
    url: 'https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_concedida',
    subcategoriaNome: 'IGs Registradas / Concedidas',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG" (Café da Chapada Diamantina)'
  },
  {
    id: 36,
    titulo: 'MAPA - Cachaça da Região de Abaíra (Indicação de Procedência Concedida)',
    autorOuOrgao: 'Ministério da Agricultura e Pecuária (MAPA) / INPI',
    texto: 'Certificação formal de origem concedida à cachaça artesanal de alambique produzida na microrregião de Abaíra, na Chapada Diamantina.',
    url: 'https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_concedida',
    subcategoriaNome: 'IGs Registradas / Concedidas',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG" (Cachaça de Abaíra)'
  },
  {
    id: 37,
    titulo: 'MAPA - Farinha de Copioba do Vale do Jiquiriçá (Indicação de Procedência)',
    autorOuOrgao: 'Ministério da Agricultura e Pecuária (MAPA) / INPI',
    texto: 'Reconhecimento da farinha artesanal de mandioca de consistência crocante e torra tradicional típica dos municípios de Nazaré, Maragogipe e região.',
    url: 'https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_concedida',
    subcategoriaNome: 'IGs Registradas / Concedidas',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG" (Farinha de Copioba)'
  },
  {
    id: 40,
    titulo: 'MAPA - Frutas do Vale do Submédio São Francisco (Indicação de Procedência)',
    autorOuOrgao: 'Ministério da Agricultura e Pecuária (MAPA) / INPI',
    texto: 'Signo distintivo reconhecido para manga e uva de mesa produzidas no polo irrigado do Vale do São Francisco (Juazeiro e região), principal polo exportador do país.',
    url: 'https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_concedida',
    subcategoriaNome: 'IGs Registradas / Concedidas',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG" (Frutas do Vale do São Francisco)'
  },
  {
    id: 41,
    titulo: 'MAPA - Café do Oeste da Bahia (Indicação de Procedência Concedida)',
    autorOuOrgao: 'Ministério da Agricultura e Pecuária (MAPA) / INPI',
    texto: 'Indicação Geográfica concedida para o café arábica de alta tecnologia e produtividade cultivado na região do Cerrado Baiano (Luís Eduardo Magalhães, Barreiras e região).',
    url: 'https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_concedida',
    subcategoriaNome: 'IGs Registradas / Concedidas',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG" (Café do Oeste da Bahia)'
  },
  {
    id: 42,
    titulo: 'MAPA - Ostras de Canavieiras (Indicação de Procedência)',
    autorOuOrgao: 'Ministério da Agricultura e Pecuária (MAPA) / INPI',
    texto: 'Certificação de origem para o cultivo artesanal e sustentável de ostras nos manguezais e estuários do município de Canavieiras, no Litoral Sul da Bahia.',
    url: 'https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_concedida',
    subcategoriaNome: 'IGs Registradas / Concedidas',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG" (Ostras de Canavieiras)'
  },
  {
    id: 43,
    titulo: 'MAPA - Mel e Derivados do Semiárido (Denominação de Origem)',
    autorOuOrgao: 'Ministério da Agricultura e Pecuária (MAPA) / INPI',
    texto: 'Reconhecimento da qualidade e características botânicas singulares do mel e cera de abelha produzidos na vegetação de caatinga do semiárido baiano.',
    url: 'https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_concedida',
    subcategoriaNome: 'IGs Registradas / Concedidas',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG" (Produtos Apícolas do Semiárido)'
  },

  // =========================================================================
  // SUB-CATEGORIA: IGS POTENCIAIS (DOSSIÊS SEBRAE & ARTIGOS ACADÊMICOS)
  // =========================================================================
  {
    id: 30,
    titulo: 'Avaliação da Potencialidade para IG da Cerâmica da Barra',
    autorOuOrgao: 'SEBRAE Nacional / SEBRAE-BA',
    texto: 'Estudo diagnóstico que avalia o saber-fazer ancestral, a identidade cultural e a reputação das olarias tradicionais do município de Barra, no Médio São Francisco.',
    url: 'https://datasebrae.com.br/wp-content/uploads/2025/01/1a-Diagnostico-Ceramica-da-Barra.pdf',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Dossiê Técnico SEBRAE',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Cerâmica da Barra)'
  },
  {
    id: 31,
    titulo: 'Avaliação de IG do Artesanato de Piaçava de Porto de Sauípe',
    autorOuOrgao: 'SEBRAE Nacional / SEBRAE-BA',
    texto: 'Diagnóstico da cadeia de valor dos trançados tradicionais de fibra de piaçava confeccionados por artesãs em Entre Rios, no Território Litoral Norte e Agreste Baiano.',
    url: 'https://datasebrae.com.br/wp-content/uploads/2025/01/2a-Diagnostico-Artesanato-de-Piacava-de-Porto-do-Sauipe.pdf',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Dossiê Técnico SEBRAE',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Artesanato de Piaçava)'
  },
  {
    id: 32,
    titulo: 'Avaliação da Potencialidade para IG das Cerâmicas de Maragogipinho',
    autorOuOrgao: 'SEBRAE Nacional / SEBRAE-BA',
    texto: 'Diagnóstico detalhado do maior centro oleiro e cerâmico tradicional da América Latina, situado no distrito de Maragogipinho (Aratuípe, Recôncavo Baiano).',
    url: 'https://datasebrae.com.br/wp-content/uploads/2025/01/3a-Diagnostico-Ceramica-de-Maragogipinho.pdf',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Dossiê Técnico SEBRAE',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Cerâmica de Maragogipinho)'
  },
  {
    id: 57,
    titulo: 'Dossiê IG: Algodão do Oeste da Bahia',
    autorOuOrgao: 'DataSebrae',
    texto: 'Signo distintivo e caracterização das qualidades edafoclimáticas, comprimento de fibra e padrão internacional da pluma do Oeste Baiano (Barreiras / Luís Eduardo Magalhães).',
    url: 'https://datasebrae.com.br/ig-oeste-da-bahia/',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Dossiê Técnico SEBRAE',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Algodão do Oeste)'
  },
  {
    id: 58,
    titulo: 'Dossiê IG: Café da Chapada Diamantina',
    autorOuOrgao: 'DataSebrae',
    texto: 'Dossiê técnico sobre a diferenciação sensorial e métodos de manejo dos cafés especiais produzidos em altitude na Chapada Diamantina.',
    url: 'https://datasebrae.com.br/ig-chapada-diamantina/',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Dossiê Técnico SEBRAE',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Café da Chapada)'
  },
  {
    id: 59,
    titulo: 'Dossiê IG: Cachaça de Abaíra',
    autorOuOrgao: 'DataSebrae',
    texto: 'Dossiê de caracterização histórica e metodológica do processo de destilação em alambique e envelhecimento da cachaça artesanal de Abaíra.',
    url: 'https://datasebrae.com.br/ig-abaira/',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Dossiê Técnico SEBRAE',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Cachaça de Abaíra)'
  },
  {
    id: 33,
    titulo: 'Farinha de Mandioca de Buerarema: Proteção aos Produtores Locais',
    autorOuOrgao: 'Midlej & Sales (Revista Observatorio Latinoamericano)',
    texto: 'Artigo científico que investiga o potencial de Indicação Geográfica para a farinha de mandioca de Buerarema (Litoral Sul) como mecanismo de agregação de renda e preservação cultural.',
    url: 'https://ojs.observatoriolatinoamericano.com/ojs/index.php/olel/article/view/5218/3367',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Farinha de Buerarema)'
  },
  {
    id: 38,
    titulo: 'Carne de Fumeiro de Maragogipe: Diagnóstico de Potencial de IG',
    autorOuOrgao: 'Ferraz et al. (Revista GeSec)',
    texto: 'Estudo acadêmico que analisa a técnica centenária de defumação artesanal da carne de fumeiro no município de Maragogipe, aplicando os critérios metodológicos do SEBRAE para IG.',
    url: 'https://ojs.revistagesec.org.br/secretariado/article/view/3173/1907',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Carne de Fumeiro de Maragogipe)'
  },
  {
    id: 39,
    titulo: 'Café do Planalto de Vitória da Conquista: Denominação de Origem',
    autorOuOrgao: 'Dutra Neto et al. (Revista Extensão & Cidadania - UESB)',
    texto: 'Pesquisa científica da UESB sobre os fatores naturais e humanos que qualificam o café produzido no planalto de Vitória da Conquista para registro como Denominação de Origem.',
    url: 'https://periodicos2.uesb.br/recuesb/article/view/2414/1997',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Café do Planalto de Conquista)'
  },
  {
    id: 44,
    titulo: 'Mel de Abelha sem Ferrão de Alagoinhas: Potencial de IG',
    autorOuOrgao: 'Conceição, Silva & Rocha (Cadernos de Prospecção - UFBA)',
    texto: 'Pesquisa da UFBA avaliando as propriedades físico-químicas e os aspectos socioeconômicos da meliponicultura em Alagoinhas para registro de Indicação Geográfica.',
    url: 'https://doi.org/10.9771/cp.v15i2.47406',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Mel de Alagoinhas)'
  },
  {
    id: 45,
    titulo: 'Licor Artesanal de Cachoeira no Recôncavo Baiano: Análise de Potencial',
    autorOuOrgao: 'Santos et al. (Revista Caderno Pedagógico)',
    texto: 'Análise da cadeia de produção, perfil histórico e reputação dos licores tradicionais de frutas de Cachoeira, símbolo gastronômico das festas juninas baianas.',
    url: 'https://ojs.studiespublicacoes.com.br/ojs/index.php/cadped/article/view/9938/5762',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Licor de Cachoeira)'
  },
  {
    id: 46,
    titulo: 'Mamona do Centro-Norte Baiano: Diagnóstico de IG',
    autorOuOrgao: 'Ribeiro et al. (Revista Aracê)',
    texto: 'Diagnóstico da produção e beneficiamento de mamona nos municípios da região de Irecê, avaliando o potencial de signo distintivo para a cultura oleaginosa.',
    url: 'https://periodicos.newsciencepubl.com/arace/article/view/3163/3902',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Mamona de Irecê)'
  },
  {
    id: 47,
    titulo: 'Mel do Extremo Sul da Bahia: Potencialidade sob a Ótica SEBRAE',
    autorOuOrgao: 'Andrade et al. (Revista INGI)',
    texto: 'Estudo de campo que avalia a apicultura desenvolvida no Extremo Sul baiano (Alcobaça, Teixeira de Freitas e região), fundamentado na metodologia de diagnóstico do SEBRAE.',
    url: 'https://ingi.api.org.br/index.php?journal=INGI&page=article&op=viewFile&path%5b%5d=311&path%5b%5d=269',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Mel do Extremo Sul)'
  },
  {
    id: 48,
    titulo: 'Artefatos de Couro de Ipirá no Território Bacia do Jacuípe: Potencial de IG',
    autorOuOrgao: 'Marques et al. (Cadernos de Prospecção - UFBA)',
    texto: 'Estudo da UFBA sobre a concentração produtiva e o artesanato em couro de Ipirá, destacando a notoriedade regional e as oportunidades de registro como Indicação de Procedência.',
    url: 'https://doi.org/10.9771/cp.v12i5.31018',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Artefatos de Couro de Ipirá)'
  },
  {
    id: 49,
    titulo: 'Abacaxi de Itaberaba: Diagnóstico de Potencial de Indicação Geográfica',
    autorOuOrgao: 'Bonfim et al. (Revista Aracê)',
    texto: 'Avaliação das características sensoriais, doçura e tradição do cultivo do abacaxi pérola em Itaberaba, no Território Piemonte do Paraguaçu.',
    url: 'https://periodicos.newsciencepubl.com/arace/article/view/4122/5434',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Abacaxi de Itaberaba)'
  },
  {
    id: 50,
    titulo: 'Vinhos de Morro do Chapéu: Potencialidade de Indicação Geográfica',
    autorOuOrgao: 'Silva et al. (Revista GeSec)',
    texto: 'Pesquisa acadêmica sobre a vitivinicultura de altitude na Chapada Diamantina (Morro do Chapéu), evidenciando a tipicidade do terroir para produção de vinhos finos.',
    url: 'https://ojs.revistagesec.org.br/secretariado/article/view/5056/3402',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Vinhos de Morro do Chapéu)'
  },
  {
    id: 51,
    titulo: 'Algodão do Oeste da Bahia: Potencialidade de Indicação Geográfica',
    autorOuOrgao: 'Santos, Cajavilca & Brito (Cadernos de Prospecção - UFBA)',
    texto: 'Estudo acadêmico que analisa as características da pluma do Oeste baiano sob a ótica da propriedade intelectual e signos de procedência geográfica.',
    url: 'https://doi.org/10.9771/cp.v16i1.50700',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Algodão do Oeste Baiano)'
  },
  {
    id: 52,
    titulo: 'Cachaça Rainha do Santo Onofre de Paratinga: IG de Procedência',
    autorOuOrgao: 'Souza et al. (Revista INGI)',
    texto: 'Investigação do processo de fabricação artesanal da cachaça Rainha do Santo Onofre em Paratinga, às margens do Rio São Francisco, avaliando seu potencial de IG.',
    url: 'https://ingi.api.org.br/index.php?journal=INGI&page=article&op=viewFile&path%5b%5d=124&path%5b%5d=111',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Cachaça de Paratinga)'
  },
  {
    id: 53,
    titulo: 'Mariscos de Salinas da Margarida: Proteção Cultural e Econômica',
    autorOuOrgao: 'Caldas et al. (Revista INGI)',
    texto: 'Estudo sobre as marisqueiras tradicionais e o extrativismo marinho na Baía de Todos-os-Santos (Salinas da Margarida), destacando o potencial protetivo de uma IG.',
    url: 'https://ingi.api.org.br/index.php?journal=INGI&page=article&op=view&path%5B%5D=270',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Mariscos de Salinas da Margarida)'
  },
  {
    id: 54,
    titulo: 'Requeijão de Santa Bárbara: Estudo para Reconhecimento de IG',
    autorOuOrgao: 'Rocha, Caldas & Oliveira (Revista GeSec)',
    texto: 'Diagnóstico da tradição leiteira e da receita centenária do requeijão de prato e manteiga do município de Santa Bárbara, no Portal do Sertão.',
    url: 'https://ojs.revistagesec.org.br/secretariado/article/view/2973/1887',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Requeijão de Santa Bárbara)'
  },
  {
    id: 55,
    titulo: 'Guaraná de Taperoá - Bahia: Potencial de Indicação Geográfica',
    autorOuOrgao: 'Baqueiro et al. (Revista Observatorio Latinoamericano)',
    texto: 'Estudo que analisa a produção do fruto de guaraná no Baixo Sul da Bahia (Taperoá), sua qualidade comparativa e as perspectivas de certificação de origem.',
    url: 'https://ojs.observatoriolatinoamericano.com/ojs/index.php/olel/article/view/413/300',
    categoriaId: 'cadeias',
    categoriaNome: 'Cadeias Produtivas',
    subcategoriaId: 'cadeia_ig_potencial',
    subcategoriaNome: 'IGs Potenciais',
    tipoFonte: 'Artigo Científico & Periódico',
    localizacaoPainel: 'Aba "Cadeias Produtivas" > Filtro por Tipo "IG Potencial" (Guaraná de Taperoá)'
  },

  // =========================================================================
  // ENSINO SUPERIOR & CAPITAL HUMANO
  // =========================================================================
  {
    id: 4,
    titulo: 'Censo da Educação Superior - Microdados Oficiais',
    autorOuOrgao: 'INEP / Ministério da Educação (MEC)',
    texto: 'Base de microdados públicos estatísticos que fundamenta o levantamento exclusivo dos cursos presenciais de graduação e pós-graduação em Ciência, Tecnologia e Inovação (CT&I) na Bahia.',
    url: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior',
    categoriaId: 'educacao',
    categoriaNome: 'Ensino Superior em CT&I',
    subcategoriaId: 'educacao_censo',
    subcategoriaNome: 'Censo Superior (Cursos de CT&I)',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Aba "Cursos CT&I" (Catálogo Completo) e Aba "Visão Geral" (Card Donut de Cursos de CT&I por Área)'
  },

  // =========================================================================
  // TERRITÓRIO & INDICADORES SOCIOECONÔMICOS
  // =========================================================================
  {
    id: 1,
    titulo: 'Índice FIRJAN de Desenvolvimento Municipal (IFDM)',
    autorOuOrgao: 'Federação das Indústrias do Estado do Rio de Janeiro (FIRJAN)',
    texto: 'Métrica sintética de desenvolvimento municipal composta por três áreas fundamentais: Emprego & Renda, Educação e Saúde, cobrindo todos os municípios da Bahia.',
    url: 'https://www.firjan.com.br/ifdm/',
    categoriaId: 'territorio',
    categoriaNome: 'Território & Indicadores',
    subcategoriaId: 'territorio_ifdm',
    subcategoriaNome: 'Índice FIRJAN (IFDM)',
    tipoFonte: 'Índice de Desenvolvimento',
    localizacaoPainel: 'Aba "Visão Geral" > Card "Ranking IFDM dos Municípios do Território Selecionado"'
  },
  {
    id: 2,
    titulo: 'Divisão Territorial da Bahia (27 Territórios de Identidade)',
    autorOuOrgao: 'SECULT / SEPLAN / Governo do Estado da Bahia',
    texto: 'Delimitação oficial e georreferenciada da regionalização estadual em 27 Territórios de Identidade, instrumento basilar de planejamento participativo e governança pública.',
    url: 'https://www.ba.gov.br/cultura/314/divisao-territorial-da-bahia',
    categoriaId: 'territorio',
    categoriaNome: 'Território & Indicadores',
    subcategoriaId: 'territorio_identidade',
    subcategoriaNome: 'Divisão Territorial da Bahia',
    tipoFonte: 'Delimitação Oficial Governamental',
    localizacaoPainel: 'Seletor Global de Territórios no Topo e Mapas Temáticos Interativos em todas as páginas'
  },
  {
    id: 3,
    titulo: 'Delimitação do Semiárido Brasileiro no Estado da Bahia',
    autorOuOrgao: 'IBGE / SUDENE',
    texto: 'Delimitação técnica e classificação dos 218 municípios baianos inseridos no polígono das secas do Semiárido Brasileiro, critério orientador de políticas de convivência.',
    url: 'https://www.ibge.gov.br/geociencias/cartas-e-mapas/mapas-regionais/15974-semiarido-brasileiro.html?=&t=o-que-e',
    categoriaId: 'territorio',
    categoriaNome: 'Território & Indicadores',
    subcategoriaId: 'territorio_semiarido',
    subcategoriaNome: 'Delimitação do Semiárido',
    tipoFonte: 'Base Oficial Governamental',
    localizacaoPainel: 'Filtro Transversal "Semiárido" no cabeçalho e comparativo nos KPIs em todas as páginas'
  }
];

// Garante que o campo texto_referencia esteja preenchido em todos os itens
REFERENCIAS_DATABASE.forEach(r => {
  if (!r.texto_referencia && r.texto) {
    r.texto_referencia = r.texto;
  }
});

/**
 * Helper para retornar a citação / texto do artigo científico ou dossiê SEBRAE
 * associado a uma cadeia produtiva ou IG potencial.
 */
export function getTextoReferencia(urlOrFonte, entidade = '') {
  if (urlOrFonte) {
    const cleanUrl = String(urlOrFonte).trim().toLowerCase();
    const found = REFERENCIAS_DATABASE.find(r => r.url && r.url.trim().toLowerCase() === cleanUrl);
    if (found && found.texto_referencia) return found.texto_referencia;
  }
  if (entidade) {
    const entLower = String(entidade).toLowerCase();
    const found = REFERENCIAS_DATABASE.find(r => {
      const tit = r.titulo?.toLowerCase() || '';
      const txt = r.texto_referencia?.toLowerCase() || '';
      return tit.includes(entLower) || entLower.includes(tit) || txt.includes(entLower);
    });
    if (found && found.texto_referencia) return found.texto_referencia;
  }
  return null;
}

export default REFERENCIAS_DATABASE;

