/**
 * Mapeamento e resolução de fontes e artigos acadêmicos para as Cadeias Produtivas (APLs e IGs).
 * Fonte de verdade integrada com a Página Sobre.
 */

export const ARTICLES_LIST = [
  {
    id: "barra_ceramica",
    txt: "SEBRAE. Avaliação da potencialidade para indicação geográfica da cerâmica da Barra. Brasília: SEBRAE, 2024.",
    link: "https://datasebrae.com.br/wp-content/uploads/2025/01/1a-Diagnostico-Ceramica-da-Barra.pdf",
    check: (f, s, seg) => f.includes('ceramica-da-barra') || (s === 'barra' && seg.includes('ceram')) || (f.includes('sebrae') && f.includes('barra'))
  },
  {
    id: "sauipe_piacava",
    txt: "SEBRAE. Avaliação da potencialidade para indicação geográfica do artesanato de piaçava de Porto de Sauípe. Brasília: SEBRAE, 2024.",
    link: "https://datasebrae.com.br/wp-content/uploads/2025/01/2a-Diagnostico-Artesanato-de-Piacava-de-Porto-do-Sauipe.pdf",
    check: (f, s, seg) => f.includes('porto-do-sauipe') || f.includes('sauipe') || f.includes('sauípe') || seg.includes('piacava') || seg.includes('piaçava')
  },
  {
    id: "maragogipinho_ceramica",
    txt: "SEBRAE. Avaliação da potencialidade para indicação geográfica das cerâmicas de Maragogipinho. Brasília: SEBRAE, 2024.",
    link: "https://datasebrae.com.br/wp-content/uploads/2025/01/3a-Diagnostico-Ceramica-de-Maragogipinho.pdf",
    check: (f, s, seg) => f.includes('maragogipinho') || s.includes('maragogipinho')
  },
  {
    id: "buerarema_farinha",
    txt: "MIDLEJ, Emanuel Marques; SALES, Jorge Henrique de Oliveira. A indicação geográfica (IG) para a farinha de Buerarema como estratégia de proteção aos produtores locais. Revista Observatorio de la Economia Latinoamericana, v. 22, n. 6, 2024.",
    link: "https://doi.org/10.55905/oelv22n6-111",
    check: (f, s, seg) => f.includes('55905/oelv22n6-111') || f.includes('midlej') || (s.includes('buerarema') && seg.includes('farinha'))
  },
  {
    id: "maragogipe_fumeiro",
    txt: "FERRAZ, Luciana Alves Vieira et al. Diagnóstico do potencial de indicação geográfica da carne de fumeiro de Maragogipe-Bahia sob a ótica da metodologia do SEBRAE. Revista de Gestão e Secretariado (GeSec), v. 14, n. 11, 2023.",
    link: "http://doi.org/10.7769/gesec.v14i11.3173",
    check: (f, s, seg) => f.includes('gesec.v14i11.3173') || f.includes('fumeiro') || (s.includes('maragogipe') && seg.includes('fumeiro'))
  },
  {
    id: "conquista_cafe",
    txt: "DUTRA NETO, Claudionor et al. Indicação geográfica do planalto de Vitória da Conquista, denominação de origem para o café. Revista Extensão & Cidadania, v. 4, n. 7, 2017.",
    link: "https://periodicos.uesb.br/index.php/extensao/article/view/7258",
    check: (f, s, seg) => f.includes('view/7258') || f.includes('dutra') || (s.includes('conquista') && seg.includes('cafe')) || (s.includes('conquista') && seg.includes('café'))
  },
  {
    id: "alagoinhas_mel",
    txt: "CONCEIÇÃO, Valdir Silva et al. Potencial de Indicação Geográfica para o mel produzido por abelha sem ferrão de Alagoinhas - Bahia. Cadernos de Prospecção, v. 15, n. 2, 2022.",
    link: "https://doi.org/10.9771/cp.v1512.47406",
    check: (f, s, seg) => f.includes('cp.v1512.47406') || (f.includes('alagoinhas') && f.includes('mel')) || (s.includes('alagoinhas') && seg.includes('mel'))
  },
  {
    id: "cachoeira_licor",
    txt: "SANTOS, Letícia Sena dos et al. Análise do potencial de Indicação Geográfica (IG) para o licor artesanal da cidade de Cachoeira no Recôncavo Baiano. Revista Caderno Pedagógico, v. 21, n. 10, 2024.",
    link: "https://doi.org/10.54033/cadpedv21n10-401",
    check: (f, s, seg) => f.includes('cadpedv21n10-401') || (f.includes('leticia sena') || f.includes('letícia sena')) || (s.includes('cachoeira') && seg.includes('licor'))
  },
  {
    id: "irece_mamona",
    txt: "RIBEIRO, Bruno Bahia et al. Diagnóstico do potencial de indicação geográfica da mamona produzida na região centro-norte da Bahia. Revista Aracê, v. 7, n. 2, 2025.",
    link: "https://doi.org/10.56238/arev7n2-047",
    check: (f, s, seg) => f.includes('arev7n2-047') || f.includes('ribeiro') || seg.includes('mamona')
  },
  {
    id: "extremosul_mel",
    txt: "ANDRADE, Lanacris de Jesus et al. Potencialidade de indicação geográfica do mel do extremo sul da Bahia sob a ótica da metodologia do SEBRAE. Revista INGI, v. 8, n. 1, 2024.",
    link: "https://doi.org/10.51722/Ingi.v8.i1.311",
    check: (f, s, seg) => f.includes('ingi.v8.i1.311') || f.includes('andrade') || (s.includes('alcobaça') && seg.includes('mel'))
  },
  {
    id: "ipira_couro",
    txt: "MARQUES, Bartolomeu das Neves et al. Artefatos de couro de Ipirá: potencial de Indicação Geográfica no território da Bacia do Jacuípe - Bahia. Cadernos de Prospecção, v. 12, n. 5, 2019.",
    link: "https://doi.org/10.9771/cp.v1215.31018",
    check: (f, s, seg) => f.includes('cp.v1215.31018') || f.includes('marques') || (s.includes('ipira') && seg.includes('couro')) || (s.includes('ipirá') && seg.includes('couro'))
  },
  {
    id: "itaberaba_abacaxi",
    txt: "BONFIM, Catarina Vilas Boas da Silva et al. Diagnóstico do potencial de indicação geográfica do abacaxi de Itaberaba-Bahia sob a ótica da metodologia do SEBRAE. Revista Aracê, v. 7, n. 3, 2025.",
    link: "https://doi.org/10.56238/arev7n3-283",
    check: (f, s, seg) => f.includes('arev7n3-283') || f.includes('bonfim') || (s.includes('itaberaba') && seg.includes('abacaxi'))
  },
  {
    id: "morrodochapeu_vinho",
    txt: "SILVA, Rosilene Alves da et al. Potencialidade de Indicação Geográfica: Vinhos de Morro do Chapéu-BA. Revista de Gestão e Secretariado (GeSec), v. 16, n. 8, 2025.",
    link: "http://doi.org/10.7769/gesec.v1618.5056",
    check: (f, s, seg) => f.includes('gesec.v1618.5056') || f.includes('rosilene') || (s.includes('morro do chapeu') && seg.includes('vinho')) || (s.includes('morro do chapéu') && seg.includes('vinho'))
  },
  {
    id: "oeste_algodao",
    txt: "SANTOS, Aline Teles et al. Indicação Geográfica: potencialidade do algodão do Oeste da Bahia. Cadernos de Prospecção, v. 16, n. 1, 2023.",
    link: "https://doi.org/10.9771/cp.v16i1.50700",
    check: (f, s, seg) => f.includes('cp.v16i1.50700') || f.includes('aline teles') || f.includes('cajavilca') || seg.includes('algodao') || seg.includes('algodão')
  },
  {
    id: "paratinga_cachaca",
    txt: "SOUZA, Diego de Oliveira et al. Cachaça Rainha do Santo Onofre de Paratinga-Bahia: potencial de indicação geográfica de procedência. Revista INGI, v. 4, n. 3, 2020.",
    link: "https://seer.ufrgs.br/index.php/ingi/article/view/100411",
    check: (f, s, seg) => f.includes('view/100411') || (s.includes('paratinga') && (seg.includes('cachaca') || seg.includes('cachaça'))) || f.includes('santo onofre')
  },
  {
    id: "salinas_mariscos",
    txt: "CALDAS, Alcides dos Santos et al. Potential geographical indication study for Salinas da Margarida shellfish region: protection of cultural and economic identity analysis. Revista INGI, v. 7, n. 4, 2023.",
    link: "https://seer.ufrgs.br/index.php/ingi/article/view/131752",
    check: (f, s, seg) => f.includes('view/131752') || (s.includes('salinas') && seg.includes('marisco'))
  },
  {
    id: "santabarbara_requeijao",
    txt: "ROCHA, Angela Machado et al. Um estudo do requeijão de Santa Bárbara-BA para o reconhecimento de Indicação Geográfica (IG). Revista de Gestão e Secretariado (GeSec), v. 14, n. 11, 2023.",
    link: "http://doi.org/10.7769/gesec.v14i11.2973",
    check: (f, s, seg) => f.includes('gesec.v14i11.2973') || (s.includes('santa barbara') && seg.includes('requeijao')) || (s.includes('santa bárbara') && seg.includes('requeijão'))
  },
  {
    id: "taperoa_guarana",
    txt: "BAQUEIRO, Arminda Ursula Pereira et al. Potencial de Indicação Geográfica para o Guaraná de Taperoá - Bahia. Revista Observatorio de la Economia Latinoamericana, v. 21, n. 3, 2023.",
    link: "https://ojs.observatoriolatinoamericano.com/ojs/index.php/olel/article/view/285",
    check: (f, s, seg) => f.includes('view/285') || f.includes('baqueiro') || (s.includes('taperoa') && seg.includes('guarana')) || (s.includes('taperoá') && seg.includes('guaraná'))
  }
];

function normalizeStr(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Resolve a fonte de uma cadeia produtiva para seu hyperlink e rótulo correspondente.
 */
export function resolveCadeiaFonte(apl) {
  if (!apl) {
    return {
      url: 'https://datasebrae.com.br/indicacoesgeograficas/',
      label: 'DataSebrae - Indicações Geográficas',
      isArticle: false,
      originalFonte: ''
    };
  }

  const fonteRaw = (apl.fonte || '').trim();
  const fNorm = normalizeStr(fonteRaw);
  const sNorm = normalizeStr(apl.sede || '');
  const segNorm = normalizeStr(apl.segmento || '');

  // 1. Busca correspondência nos artigos científicos mapeados na página Sobre
  for (const art of ARTICLES_LIST) {
    if (art.check(fNorm, sNorm, segNorm)) {
      return {
        url: art.link,
        label: art.txt,
        isArticle: true,
        originalFonte: fonteRaw
      };
    }
  }

  // 2. Extrai URL direta se presente no texto da fonte (ex: DataSebrae, INPI)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/ig;
  const matches = fonteRaw.match(urlRegex);
  if (matches && matches.length > 0) {
    let url = matches[0].replace(/[\.,;\)]+$/, '');
    url = url.startsWith('http') ? url : `https://${url}`;
    return {
      url: url,
      label: fonteRaw,
      isArticle: false,
      originalFonte: fonteRaw
    };
  }

  // 3. Extrai DOI se formatado como "DOI: 10.xxxx/xxxx"
  const doiRegex = /doi:\s*([10\.\d+\/[^\s]+)/i;
  const doiMatch = fonteRaw.match(doiRegex);
  if (doiMatch && doiMatch[1]) {
    let doi = doiMatch[1].replace(/[\.,;\)]+$/, '');
    if (!doi.startsWith('http')) doi = `https://doi.org/${doi}`;
    return {
      url: doi,
      label: fonteRaw,
      isArticle: true,
      originalFonte: fonteRaw
    };
  }

  // 4. Fallbacks padrão por tipo/origem
  if (fNorm.includes('observatorio') || apl.tipo === 'APL') {
    return {
      url: 'https://observatorioapl.mdic.gov.br/',
      label: 'Arranjos Produtivos Locais (APLs) | Observatório APL',
      isArticle: false,
      originalFonte: fonteRaw || 'Observatório APL'
    };
  }

  return {
    url: 'https://datasebrae.com.br/indicacoesgeograficas/',
    label: 'Indicações Geográficas (IGs) | DataSebrae',
    isArticle: false,
    originalFonte: fonteRaw || 'DataSebrae'
  };
}
