/**
 * Catálogo Oficial de Referências Metodológicas e Fontes de Dados
 * Extraído e auditado diretamente do banco de dados Supabase (tabela: 'referencias')
 * com mapeamento completo de chaves estrangeiras (FKs) e cruzamentos relacionais.
 */

export const FONTES_METADADOS = {
  totalReferencias: 48,
  tabelasCruzadas: [
    'firjan',
    'municipios',
    'cursos',
    'lista_ativos_cti',
    'lista_cursos_cti',
    'lista_cadeia_produtiva',
    'distribuicao_cadeias',
    'lista_municipioxterritorio',
    'stats_ti'
  ],
  orgaosPrincipais: [
    'MEC / INEP',
    'RNP / MCTI',
    'Sistema FIRJAN',
    'IBGE / SUDENE',
    'SECULT / SEPLAN-BA',
    'MDIC (Observatório APL)',
    'INPI / MAPA',
    'SEBRAE / DataSebrae',
    'Universidades Públicas Baianas (UFBA, UNEB, UESB, UEFS)'
  ]
};

export const CATEGORIAS_REFERENCIAS = [
  {
    "id": "todas",
    "label": "Todas as Fontes",
    "count": 48
  },
  {
    "id": "governamental",
    "label": "Bases Institucionais & Território",
    "count": 3
  },
  {
    "id": "conectividade",
    "label": "Conectividade & RNP",
    "count": 1
  },
  {
    "id": "educacao",
    "label": "Censo da Educação Superior (INEP)",
    "count": 1
  },
  {
    "id": "inovacao",
    "label": "Ecossistema de Inovação & Hubs",
    "count": 11
  },
  {
    "id": "propriedade_intelectual",
    "label": "Propriedade Intelectual (INPI/Sebrae)",
    "count": 2
  },
  {
    "id": "cadeias_apls",
    "label": "Arranjos Produtivos Locais (APLs)",
    "count": 1
  },
  {
    "id": "igs_mapa",
    "label": "Indicações Geográficas (MAPA)",
    "count": 8
  },
  {
    "id": "artigos_cientificos",
    "label": "Artigos Científicos & Periódicos",
    "count": 15
  },
  {
    "id": "estudos_sebrae",
    "label": "Dossiês Técnicos SEBRAE",
    "count": 6
  }
];

export const REFERENCIAS_DATABASE = [
  {
    "id": "RNP-BA",
    "titulo": "Rede Nacional de Ensino e Pesquisa (RNP) - PoP-BA",
    "autorOuOrgao": "RNP / MCTI / PoP-BA (UFBA)",
    "texto": "Infraestrutura avançada de conectividade óptica nacional de altíssima velocidade interligando universidades públicas, institutos federais e centros de pesquisa no estado da Bahia.",
    "url": "https://www.rnp.br",
    "categoria": "Conectividade & Redes Acadêmicas",
    "categoriaSlug": "conectividade",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti.rnp = true (Campi Universitários, IFs e ICTs)"
  },
  {
    "id": 1,
    "titulo": "Índice FIRJAN de Desenvolvimento Municipal (IFDM)",
    "autorOuOrgao": "Federação das Indústrias do Estado do Rio de Janeiro (FIRJAN)",
    "texto": "Utilizado como base para o indicador de Desenvolvimento Territorial.",
    "url": "https://www.firjan.com.br/ifdm/",
    "categoria": "Bases Institucionais & Demografia",
    "categoriaSlug": "governamental",
    "tabelaFk": "firjan",
    "fkInfo": "firjan.id_referencia = 1 (417 municípios baianos)"
  },
  {
    "id": 2,
    "titulo": "Divisão Territorial da Bahia (27 Territórios de Identidade)",
    "autorOuOrgao": "SECULT / SEPLAN / Governo da Bahia",
    "texto": "Dados geográficos e demográficos, incluindo a delimitação oficial dos 27 Territórios de Identidade da Bahia.",
    "url": "https://www.ba.gov.br/cultura/314/divisao-territorial-da-bahia",
    "categoria": "Bases Institucionais & Demografia",
    "categoriaSlug": "governamental",
    "tabelaFk": "lista_municipioxterritorio",
    "fkInfo": "Demarcação oficial dos 27 Territórios de Identidade"
  },
  {
    "id": 3,
    "titulo": "Delimitação do Semiárido Brasileiro no Estado da Bahia",
    "autorOuOrgao": "IBGE / SUDENE",
    "texto": "Delimitação e classificação dos municípios pertencentes ao semiárido",
    "url": "https://www.ibge.gov.br/geociencias/cartas-e-mapas/mapas-regionais/15974-semiarido-brasileiro.html?=&t=o-que-e",
    "categoria": "Bases Institucionais & Demografia",
    "categoriaSlug": "governamental",
    "tabelaFk": "municipios",
    "fkInfo": "municipios.id_referencia = 3 (417 municípios)"
  },
  {
    "id": 4,
    "titulo": "Censo da Educação Superior - Microdados Oficiais",
    "autorOuOrgao": "INEP / Ministério da Educação (MEC)",
    "texto": "Microdados que fornecem a base para o levantamento de cursos superiores em CT&I e de campi de universidades\npúblicas, privadas e institutos federais.",
    "url": "https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior",
    "categoria": "Ensino Superior & Capital Humano",
    "categoriaSlug": "educacao",
    "tabelaFk": "cursos / lista_cursos_cti / lista_ativos_cti",
    "fkInfo": "cursos.id_referencia = 4 (642 cursos presenciais)"
  },
  {
    "id": 5,
    "titulo": "Áity Incubadora de Empresas",
    "autorOuOrgao": "UNEB / SEBRAE",
    "texto": "Incubadora de empresas inovadoras e de base tecnológica vinculada à Universidade do Estado da Bahia (UNEB) em parceria com o SEBRAE.",
    "url": "https://inovacao.uneb.br/aity-incubadora-de-empresas-ja-ouviu-falar/",
    "categoria": "Ecossistema de Inovação & Ativos Tecnológicos",
    "categoriaSlug": "inovacao",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti (Registro de Ativo de Inovação)"
  },
  {
    "id": 6,
    "titulo": "Cyklo Agritech - Aceleradora do Agro",
    "autorOuOrgao": "Cyklo Agritech",
    "texto": "Primeira aceleradora de startups focada em agritech do MATOPIBA, sediada em Luís Eduardo Magalhães no Território Bacia do Rio Grande.",
    "url": "https://cykloagritech.com.br/",
    "categoria": "Ecossistema de Inovação & Ativos Tecnológicos",
    "categoriaSlug": "inovacao",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti (Registro de Ativo de Inovação)"
  },
  {
    "id": 7,
    "titulo": "Hub Conquista / Conquista Startups",
    "autorOuOrgao": "Hub Conquista",
    "texto": "Centro de inovação e fomento ao empreendedorismo tecnológico no sudoeste baiano, sediado em Vitória da Conquista.",
    "url": "https://hubconquista.com.br/",
    "categoria": "Ecossistema de Inovação & Ativos Tecnológicos",
    "categoriaSlug": "inovacao",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti (Registro de Ativo de Inovação)"
  },
  {
    "id": 8,
    "titulo": "Plataforma & Comunidade Inventivos",
    "autorOuOrgao": "Inventivos",
    "texto": "Ecossistema e comunidade de aceleração de empreendedores e criadores com forte atuação na Bahia e foco em inovação inclusiva.",
    "url": "https://inventivos.co/",
    "categoria": "Ecossistema de Inovação & Ativos Tecnológicos",
    "categoriaSlug": "inovacao",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti (Registro de Ativo de Inovação)"
  },
  {
    "id": 9,
    "titulo": "SENAI CIMATEC (Campus Salvador)",
    "autorOuOrgao": "SENAI / FIEB",
    "texto": "Centro Integrado de Manufatura e Tecnologia, um dos maiores complexos de inovação, pesquisa aplicada e pós-graduação tecnológica do Brasil.",
    "url": "https://senaicimatec.com.br/",
    "categoria": "Ecossistema de Inovação & Ativos Tecnológicos",
    "categoriaSlug": "inovacao",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti (Registro de Ativo de Inovação)"
  },
  {
    "id": 10,
    "titulo": "CIMATEC Park (Camaçari)",
    "autorOuOrgao": "SENAI / FIEB",
    "texto": "Parque tecnológico e industrial de 4 milhões de m² em Camaçari voltado a testes em escala real, energia limpa, mineração e mobilidade avançada.",
    "url": "https://senaicimatec.com.br/",
    "categoria": "Ecossistema de Inovação & Ativos Tecnológicos",
    "categoriaSlug": "inovacao",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti (Registro de Ativo de Inovação)"
  },
  {
    "id": 11,
    "titulo": "GetIN Aceleradora de Startups",
    "autorOuOrgao": "GetIN Aceleradora",
    "texto": "Aceleradora de negócios escaláveis com foco em tecnologia e conexões de mercado no ecossistema baiano.",
    "url": "https://getin.inf.br/",
    "categoria": "Ecossistema de Inovação & Ativos Tecnológicos",
    "categoriaSlug": "inovacao",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti (Registro de Ativo de Inovação)"
  },
  {
    "id": 12,
    "titulo": "IEBT Innovation Hub",
    "autorOuOrgao": "IEBT Innovation",
    "texto": "Consultoria e catalisadora de inovação aberta, inteligência estratégica e aceleração de novos negócios corporativos.",
    "url": "https://www.iebtinnovation.com/",
    "categoria": "Ecossistema de Inovação & Ativos Tecnológicos",
    "categoriaSlug": "inovacao",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti (Registro de Ativo de Inovação)"
  },
  {
    "id": 13,
    "titulo": "Novatores Incubadora (UEFS)",
    "autorOuOrgao": "UEFS",
    "texto": "Incubadora de iniciativas e empreendimentos de base tecnológica da Universidade Estadual de Feira de Santana (UEFS), no Território Portal do Sertão.",
    "url": "https://novatores.uefs.br/",
    "categoria": "Ecossistema de Inovação & Ativos Tecnológicos",
    "categoriaSlug": "inovacao",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti (Registro de Ativo de Inovação)"
  },
  {
    "id": 14,
    "titulo": "Aceleradora Vale do Dendê",
    "autorOuOrgao": "Vale do Dendê",
    "texto": "Holding social e aceleradora de impacto voltada ao fomento do ecossistema criativo, tecnológico e de diversidade em Salvador.",
    "url": "https://www.valedodende.org/",
    "categoria": "Ecossistema de Inovação & Ativos Tecnológicos",
    "categoriaSlug": "inovacao",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti (Registro de Ativo de Inovação)"
  },
  {
    "id": 15,
    "titulo": "Indicações Geográficas (IGs) do Brasil - DataSebrae",
    "autorOuOrgao": "SEBRAE Origens / DataSebrae",
    "texto": "Plataforma oficial do SEBRAE de inteligência territorial e mapeamento dos signos distintivos e indicações geográficas reconhecidas e potenciais no Brasil.",
    "url": "https://datasebrae.com.br/indicacoesgeograficas/",
    "categoria": "Propriedade Intelectual & IGs",
    "categoriaSlug": "propriedade_intelectual",
    "tabelaFk": "lista_cadeia_produtiva (IGs)",
    "fkInfo": "Base conceitual e cadastral de IGs"
  },
  {
    "id": 16,
    "titulo": "Portal de Serviços e Concessões de Indicação Geográfica - INPI",
    "autorOuOrgao": "INPI (Instituto Nacional da Propriedade Industrial)",
    "texto": "Órgão federal competente pelo registro e concessão de Indicações de Procedência (IP) e Denominações de Origem (DO) no território nacional.",
    "url": "https://www.gov.br/inpi/pt-br/servicos/indicacoes-geograficas",
    "categoria": "Propriedade Intelectual & IGs",
    "categoriaSlug": "propriedade_intelectual",
    "tabelaFk": "lista_cadeia_produtiva (IGs Registradas)",
    "fkInfo": "Registro formal de concessão de IG"
  },
  {
    "id": 17,
    "titulo": "Observatório Nacional de Arranjos Produtivos Locais (APLs)",
    "autorOuOrgao": "MDIC / Observatório Brasileiro de APL",
    "texto": "Cadastro nacional do Ministério do Desenvolvimento, Indústria, Comércio e Serviços que reúne os 54 Arranjos Produtivos Locais catalogados e ativos na Bahia.",
    "url": "https://www.gov.br/empresas-e-negocios/pt-br/portais-desconhecidos/observatorioapl",
    "categoria": "Cadeias Produtivas & APLs",
    "categoriaSlug": "cadeias_apls",
    "tabelaFk": "lista_cadeia_produtiva (APLs)",
    "fkInfo": "lista_cadeia_produtiva.fonte = Observatório (54 APLs)"
  },
  {
    "id": 30,
    "titulo": "Avaliação da Potencialidade para IG da Cerâmica da Barra",
    "autorOuOrgao": "SEBRAE Nacional / SEBRAE-BA",
    "texto": "SEBRAE. Avaliação da potencialidade para indicação geográfica da cerâmica da Barra. Brasília: SEBRAE, 2024. Estudo diagnóstico das olarias tradicionais do Médio São Francisco.",
    "url": "https://datasebrae.com.br/wp-content/uploads/2025/01/1a-Diagnostico-Ceramica-da-Barra.pdf",
    "categoria": "Dossiês Técnicos SEBRAE (IGs Potenciais)",
    "categoriaSlug": "estudos_sebrae",
    "tabelaFk": "lista_cadeia_produtiva (IGs e IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Cerâmica da Barra (Barra)"
  },
  {
    "id": 31,
    "titulo": "Avaliação de IG do Artesanato de Piaçava de Porto de Sauípe",
    "autorOuOrgao": "SEBRAE Nacional / SEBRAE-BA",
    "texto": "SEBRAE. Avaliação da potencialidade para indicação geográfica do artesanato de piaçava de Porto de Sauípe. Brasília: SEBRAE, 2024. Análise dos trançados Tupinambá no Litoral Norte.",
    "url": "https://datasebrae.com.br/wp-content/uploads/2025/01/2a-Diagnostico-Artesanato-de-Piacava-de-Porto-do-Sauipe.pdf",
    "categoria": "Dossiês Técnicos SEBRAE (IGs Potenciais)",
    "categoriaSlug": "estudos_sebrae",
    "tabelaFk": "lista_cadeia_produtiva (IGs e IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Artesanato de Piaçava (Entre Rios)"
  },
  {
    "id": 32,
    "titulo": "Avaliação da Potencialidade para IG das Cerâmicas de Maragogipinho",
    "autorOuOrgao": "SEBRAE Nacional / SEBRAE-BA",
    "texto": "SEBRAE. Avaliação da potencialidade para indicação geográfica das cerâmicas de Maragogipinho. Brasília: SEBRAE, 2024. Maior centro oleiro da América Latina (Aratuípe).",
    "url": "https://datasebrae.com.br/wp-content/uploads/2025/01/3a-Diagnostico-Ceramica-de-Maragogipinho.pdf",
    "categoria": "Dossiês Técnicos SEBRAE (IGs Potenciais)",
    "categoriaSlug": "estudos_sebrae",
    "tabelaFk": "lista_cadeia_produtiva (IGs e IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Cerâmica de Maragogipinho (Aratuípe)"
  },
  {
    "id": 33,
    "titulo": "Farinha de Mandioca de Buerarema: Proteção aos Produtores Locais",
    "autorOuOrgao": "Midlej & Sales (Rev. Observatorio Latinoamericano)",
    "texto": "MIDLEJ, Emanuel Marques; SALES, Jorge Henrique de Oliveira. A indicação geográfica (IG) para a farinha de Buerarema como estratégia de proteção aos produtores locais. Revista Observatorio de la Economia Latinoamericana, Curitiba, v. 22, n. 6, p. 01-20, 2024. DOI: 10.55905/oelv22n6-111.",
    "url": "https://ojs.observatoriolatinoamericano.com/ojs/index.php/olel/article/view/5218/3367",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Farinha de Mandioca (Buerarema)"
  },
  {
    "id": 34,
    "titulo": "MAPA - Signos Distintivos e IGs da Agropecuária (Ref. #34)",
    "autorOuOrgao": "Ministério da Agricultura e Pecuária (MAPA)",
    "texto": "Mapa Interativo - Signos Distintivos Registrados e Produtos Potenciais",
    "url": "https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1",
    "categoria": "Indicações Geográficas Registradas (MAPA / INPI)",
    "categoriaSlug": "igs_mapa",
    "tabelaFk": "lista_cadeia_produtiva (IGs Registradas)",
    "fkInfo": "lista_cadeia_produtiva: Signos Distintivos Registrados no MAPA"
  },
  {
    "id": 35,
    "titulo": "MAPA - Signos Distintivos e IGs da Agropecuária (Ref. #35)",
    "autorOuOrgao": "Ministério da Agricultura e Pecuária (MAPA)",
    "texto": "Mapa Interativo - Signos Distintivos Registrados e Produtos Potenciais",
    "url": "https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1",
    "categoria": "Indicações Geográficas Registradas (MAPA / INPI)",
    "categoriaSlug": "igs_mapa",
    "tabelaFk": "lista_cadeia_produtiva (IGs Registradas)",
    "fkInfo": "lista_cadeia_produtiva: Signos Distintivos Registrados no MAPA"
  },
  {
    "id": 36,
    "titulo": "MAPA - Signos Distintivos e IGs da Agropecuária (Ref. #36)",
    "autorOuOrgao": "Ministério da Agricultura e Pecuária (MAPA)",
    "texto": "Mapa Interativo - Signos Distintivos Registrados e Produtos Potenciais",
    "url": "https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1",
    "categoria": "Indicações Geográficas Registradas (MAPA / INPI)",
    "categoriaSlug": "igs_mapa",
    "tabelaFk": "lista_cadeia_produtiva (IGs Registradas)",
    "fkInfo": "lista_cadeia_produtiva: Signos Distintivos Registrados no MAPA"
  },
  {
    "id": 37,
    "titulo": "MAPA - Signos Distintivos e IGs da Agropecuária (Ref. #37)",
    "autorOuOrgao": "Ministério da Agricultura e Pecuária (MAPA)",
    "texto": "Mapa Interativo - Signos Distintivos Registrados e Produtos Potenciais",
    "url": "https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1",
    "categoria": "Indicações Geográficas Registradas (MAPA / INPI)",
    "categoriaSlug": "igs_mapa",
    "tabelaFk": "lista_cadeia_produtiva (IGs Registradas)",
    "fkInfo": "lista_cadeia_produtiva: Signos Distintivos Registrados no MAPA"
  },
  {
    "id": 38,
    "titulo": "Carne de Fumeiro de Maragogipe: Diagnóstico de Potencial de IG",
    "autorOuOrgao": "Ferraz et al. (Revista GeSec)",
    "texto": "FERRAZ, Luciana Alves Vieira; SILVA, Davi Santos da; SANTOS, Laiane da Silva; VENANCIO, Maria Fernanda Daltro; CONCEIÇÃO, Valdir Silva da; ARAÚJO, Marcio Luís Valença; SILVA, Marcelo Santana. Diagnóstico do potencial de indicação geográfica da carne de fumeiro de Maragogipe-Bahia sob a ótica da metodologia do SEBRAE. Revista de Gestão e Secretariado (GeSec), São Paulo, v. 14, n. 11, p. 20202-20220, 2023.",
    "url": "https://ojs.revistagesec.org.br/secretariado/article/view/3173/1907",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Carne de Fumeiro (Maragogipe)"
  },
  {
    "id": 39,
    "titulo": "Café do Planalto de Vitória da Conquista: Denominação de Origem",
    "autorOuOrgao": "Dutra Neto et al. (Revista Extensão & Cidadania - UESB)",
    "texto": "DUTRA NETO, Claudionor et al. Indicação geográfica do planalto de Vitória da Conquista, denominação de origem para o café. Revista Extensão & Cidadania, Vitória da Conquista, v. 4, n. 7, p. 103-114, 2017.",
    "url": "https://periodicos2.uesb.br/recuesb/article/view/2414/1997",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Café de Conquista (Vitória da Conquista)"
  },
  {
    "id": 40,
    "titulo": "MAPA - Signos Distintivos e IGs da Agropecuária (Ref. #40)",
    "autorOuOrgao": "Ministério da Agricultura e Pecuária (MAPA)",
    "texto": "Mapa Interativo - Signos Distintivos Registrados e Produtos Potenciais",
    "url": "https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1",
    "categoria": "Indicações Geográficas Registradas (MAPA / INPI)",
    "categoriaSlug": "igs_mapa",
    "tabelaFk": "lista_cadeia_produtiva (IGs Registradas)",
    "fkInfo": "lista_cadeia_produtiva: Signos Distintivos Registrados no MAPA"
  },
  {
    "id": 41,
    "titulo": "MAPA - Signos Distintivos e IGs da Agropecuária (Ref. #41)",
    "autorOuOrgao": "Ministério da Agricultura e Pecuária (MAPA)",
    "texto": "Mapa Interativo - Signos Distintivos Registrados e Produtos Potenciais",
    "url": "https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1",
    "categoria": "Indicações Geográficas Registradas (MAPA / INPI)",
    "categoriaSlug": "igs_mapa",
    "tabelaFk": "lista_cadeia_produtiva (IGs Registradas)",
    "fkInfo": "lista_cadeia_produtiva: Signos Distintivos Registrados no MAPA"
  },
  {
    "id": 42,
    "titulo": "MAPA - Signos Distintivos e IGs da Agropecuária (Ref. #42)",
    "autorOuOrgao": "Ministério da Agricultura e Pecuária (MAPA)",
    "texto": "Mapa Interativo - Signos Distintivos Registrados e Produtos Potenciais",
    "url": "https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1",
    "categoria": "Indicações Geográficas Registradas (MAPA / INPI)",
    "categoriaSlug": "igs_mapa",
    "tabelaFk": "lista_cadeia_produtiva (IGs Registradas)",
    "fkInfo": "lista_cadeia_produtiva: Signos Distintivos Registrados no MAPA"
  },
  {
    "id": 43,
    "titulo": "MAPA - Signos Distintivos e IGs da Agropecuária (Ref. #43)",
    "autorOuOrgao": "Ministério da Agricultura e Pecuária (MAPA)",
    "texto": "Mapa Interativo - Signos Distintivos Registrados e Produtos Potenciais",
    "url": "https://www.gov.br/agricultura/pt-br/assuntos/sustentabilidade/indicacao-geografica/dados-sobre-igs-registradas-e-produtos-tipicos-potenciais/mapa-interativo-1",
    "categoria": "Indicações Geográficas Registradas (MAPA / INPI)",
    "categoriaSlug": "igs_mapa",
    "tabelaFk": "lista_cadeia_produtiva (IGs Registradas)",
    "fkInfo": "lista_cadeia_produtiva: Signos Distintivos Registrados no MAPA"
  },
  {
    "id": 44,
    "titulo": "Mel de Abelha sem Ferrão de Alagoinhas: Potencial de IG",
    "autorOuOrgao": "Conceição, Silva & Rocha (Cadernos de Prospecção - UFBA)",
    "texto": "CONCEIÇÃO, Valdir Silva; SILVA, Dayana Ferraz; ROCHA, Angela Machado. Potencial de Indicação Geográfica para o mel produzido por abelha sem ferrão de Alagoinhas - Bahia. Cadernos de Prospecção, Salvador, v. 15, n. 2, p. 618-633, 2022.",
    "url": "https://doi.org/10.9771/cp.v15i2.47406",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Mel de Abelha sem Ferrão (Alagoinhas)"
  },
  {
    "id": 45,
    "titulo": "Licor Artesanal de Cachoeira no Recôncavo Baiano: Análise de Potencial",
    "autorOuOrgao": "Santos et al. (Revista Caderno Pedagógico)",
    "texto": "SANTOS, Letícia Sena dos et al. Análise do potencial de Indicação Geográfica (IG) para o licor artesanal da cidade de Cachoeira no Recôncavo Baiano. Revista Caderno Pedagógico, Curitiba, v. 21, n. 10, p. 01-21, 2024. DOI: 10.54033/cadpedv21n10-401.",
    "url": "https://ojs.studiespublicacoes.com.br/ojs/index.php/cadped/article/view/9938/5762",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Licor de Cachoeira (Cachoeira)"
  },
  {
    "id": 46,
    "titulo": "Mamona do Centro-Norte Baiano: Diagnóstico de IG",
    "autorOuOrgao": "Ribeiro et al. (Revista Aracê)",
    "texto": "RIBEIRO, Bruno Bahia et al. Diagnóstico do potencial de indicação geográfica da mamona produzida na região centro-norte da Bahia. Revista Aracê, São José dos Pinhais, v. 7, n. 2, p. 5327-5347, 2025.",
    "url": "https://periodicos.newsciencepubl.com/arace/article/view/3163/3902",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Mamona da Região de Irecê"
  },
  {
    "id": 47,
    "titulo": "Mel do Extremo Sul da Bahia: Potencialidade sob a Ótica SEBRAE",
    "autorOuOrgao": "Andrade et al. (Revista INGI)",
    "texto": "ANDRADE, Lanacris de Jesus et al. Potencialidade de indicação geográfica do mel do extremo sul da Bahia sob a ótica da metodologia do SEBRAE. Revista INGI - Indicação Geográfica e Inovação, [S. l.], v. 8, n. 1, p. 2520-2532, 2024. DOI: 10.51722/Ingi.v8.i1.311.",
    "url": "https://ingi.api.org.br/index.php?journal=INGI&page=article&op=viewFile&path%5b%5d=311&path%5b%5d=269",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Mel do Extremo Sul (Alcobaça)"
  },
  {
    "id": 48,
    "titulo": "Artefatos de Couro de Ipirá no Território Bacia do Jacuípe: Potencial de IG",
    "autorOuOrgao": "Marques et al. (Cadernos de Prospecção - UFBA)",
    "texto": "MARQUES, Bartolomeu das Neves et al. Artefatos de couro de Ipirá: potencial de Indicação Geográfica no território da Bacia do Jacuípe - Bahia. Cadernos de Prospecção, Salvador, v. 12, n. 5, p. 1598-1611, 2019.",
    "url": "https://doi.org/10.9771/cp.v12i5.31018",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Artesanato de Couro (Ipirá)"
  },
  {
    "id": 49,
    "titulo": "Abacaxi de Itaberaba: Diagnóstico de Potencial de Indicação Geográfica",
    "autorOuOrgao": "Bonfim et al. (Revista Aracê)",
    "texto": "BONFIM, Catarina Vilas Boas da Silva et al. Diagnóstico do potencial de indicação geográfica do abacaxi de Itaberaba-Bahia sob a ótica da metodologia do SEBRAE. Revista Aracê, São José dos Pinhais, v. 7, n. 3, p. 15075-15090, 2025.",
    "url": "https://periodicos.newsciencepubl.com/arace/article/view/4122/5434",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Abacaxi de Itaberaba (Itaberaba)"
  },
  {
    "id": 50,
    "titulo": "Vinhos de Morro do Chapéu: Potencialidade de Indicação Geográfica",
    "autorOuOrgao": "Silva et al. (Revista GeSec)",
    "texto": "SILVA, Rosilene Alves da et al. Potencialidade de Indicação Geográfica: Vinhos de Morro do Chapéu-BA. Revista de Gestão e Secretariado (GeSec), São José dos Pinhais, v. 16, n. 8, p. 01-24, 2025.",
    "url": "https://ojs.revistagesec.org.br/secretariado/article/view/5056/3402",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Vinhos de Morro do Chapéu (Morro do Chapéu)"
  },
  {
    "id": 51,
    "titulo": "Algodão do Oeste da Bahia: Potencialidade de Indicação Geográfica",
    "autorOuOrgao": "Santos, Cajavilca & Brito (Cadernos de Prospecção - UFBA)",
    "texto": "SANTOS, Aline Teles; CAJAVILCA, Erick Samuel Rojas; BRITO, George Nathan Souza. Indicação Geográfica: potencialidade do algodão do Oeste da Bahia. Cadernos de Prospecção, Salvador, v. 16, n. 1, p. 344-359, 2023.",
    "url": "https://doi.org/10.9771/cp.v16i1.50700",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Algodão do Oeste da Bahia (Barreiras)"
  },
  {
    "id": 52,
    "titulo": "Cachaça Rainha do Santo Onofre de Paratinga: IG de Procedência",
    "autorOuOrgao": "Souza et al. (Revista INGI)",
    "texto": "SOUZA, Diego de Oliveira et al. Cachaça Rainha do Santo Onofre de Paratinga-Bahia: potencial de indicação geográfica de procedência. Revista INGI, [S. l.], v. 4, n. 3, p. 903-917, 2020.",
    "url": "https://ingi.api.org.br/index.php?journal=INGI&page=article&op=viewFile&path%5b%5d=124&path%5b%5d=111",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Cachaça Rainha do Santo Onofre (Paratinga)"
  },
  {
    "id": 53,
    "titulo": "Mariscos de Salinas da Margarida: Proteção Cultural e Econômica",
    "autorOuOrgao": "Caldas et al. (Revista INGI)",
    "texto": "CALDAS, Alcides dos Santos et al. Potential geographical indication study for Salinas da Margarida shellfish region: protection of cultural and economic identity analysis. Revista INGI - Indicação Geográfica e Inovação, [S. l.], v. 7, n. 4, 2023.",
    "url": "https://ingi.api.org.br/index.php?journal=INGI&page=article&op=view&path%5B%5D=270",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Mariscos de Salinas da Margarida"
  },
  {
    "id": 54,
    "titulo": "Requeijão de Santa Bárbara: Estudo para Reconhecimento de IG",
    "autorOuOrgao": "Rocha, Caldas & Oliveira (Revista GeSec)",
    "texto": "ROCHA, Angela Machado; CALDAS, Alcides dos Santos; OLIVEIRA, Maria Cristina Idalina dos Santos de. Um estudo do requeijão de Santa Bárbara-BA para o reconhecimento de Indicação Geográfica (IG). Revista de Gestão e Secretariado (GeSec), São Paulo, v. 14, n. 11, p. 19821-19834, 2023.",
    "url": "https://ojs.revistagesec.org.br/secretariado/article/view/2973/1887",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Requeijão de Santa Bárbara"
  },
  {
    "id": 55,
    "titulo": "Guaraná de Taperoá - Bahia: Potencial de Indicação Geográfica",
    "autorOuOrgao": "Baqueiro et al. (Rev. Observatorio Latinoamericano)",
    "texto": "BAQUEIRO, Arminda Ursula Pereira et al. Potencial de Indicação Geográfica para o Guaraná de Taperoá - Bahia. Revista Observatorio de la Economia Latinoamericana, Curitiba, v. 21, n. 3, p. 1422-1441, 2023. DOI: 1696-8352.",
    "url": "https://ojs.observatoriolatinoamericano.com/ojs/index.php/olel/article/view/413/300",
    "categoria": "Artigos Científicos & Periódicos (IGs Potenciais)",
    "categoriaSlug": "artigos_cientificos",
    "tabelaFk": "lista_cadeia_produtiva (IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Guaraná de Taperoá (Taperoá)"
  },
  {
    "id": 56,
    "titulo": "Hub Salvador (Flow c/ WOW e Wayra)",
    "autorOuOrgao": "Prefeitura de Salvador / WOW / Wayra",
    "texto": "Espaço público-privado de inovação e coinovação no Comércio (Salvador), integrando startups, investidores e aceleradoras multinacionais.",
    "url": "https://www.hubsalvador.com",
    "categoria": "Ecossistema de Inovação & Ativos Tecnológicos",
    "categoriaSlug": "inovacao",
    "tabelaFk": "lista_ativos_cti",
    "fkInfo": "lista_ativos_cti (Registro de Ativo de Inovação)"
  },
  {
    "id": 57,
    "titulo": "Dossiê IG: Algodão do Oeste da Bahia",
    "autorOuOrgao": "DataSebrae",
    "texto": "DataSebrae. Signo distintivo e características edafoclimáticas e de qualidade da pluma de algodão do Oeste Baiano (Barreiras / Luís Eduardo Magalhães).",
    "url": "https://datasebrae.com.br/ig-oeste-da-bahia/",
    "categoria": "Dossiês Técnicos SEBRAE (IGs Potenciais)",
    "categoriaSlug": "estudos_sebrae",
    "tabelaFk": "lista_cadeia_produtiva (IGs e IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Algodão do Oeste da Bahia"
  },
  {
    "id": 58,
    "titulo": "Dossiê IG: Café da Chapada Diamantina",
    "autorOuOrgao": "DataSebrae",
    "texto": "DataSebrae. Registro e diferenciação dos cafés especiais produzidos em altitude na Chapada Diamantina (Piatã, Mucugê, Ibicoara).",
    "url": "https://datasebrae.com.br/ig-chapada-diamantina/",
    "categoria": "Dossiês Técnicos SEBRAE (IGs Potenciais)",
    "categoriaSlug": "estudos_sebrae",
    "tabelaFk": "lista_cadeia_produtiva (IGs e IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Café da Chapada Diamantina"
  },
  {
    "id": 59,
    "titulo": "Dossiê IG: Cachaça de Abaíra",
    "autorOuOrgao": "DataSebrae",
    "texto": "DataSebrae. Indicação Geográfica concedida à cachaça artesanal da microrregião de Abaíra na Chapada Diamantina.",
    "url": "https://datasebrae.com.br/ig-abaira/",
    "categoria": "Dossiês Técnicos SEBRAE (IGs Potenciais)",
    "categoriaSlug": "estudos_sebrae",
    "tabelaFk": "lista_cadeia_produtiva (IGs e IGs Potenciais)",
    "fkInfo": "lista_cadeia_produtiva: Cachaça de Abaíra"
  }
];

export default REFERENCIAS_DATABASE;
