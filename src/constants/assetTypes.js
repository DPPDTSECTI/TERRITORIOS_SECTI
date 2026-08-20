/**
 * CONFIGURAÇÃO CENTRALIZADA DE CORES E CATEGORIAS DE ATIVOS CTI
 * Single Source of Truth para efeito cascata em todo o sistema (Tailwind, Mapas, Gráficos, Listas)
 */

export const ASSET_THEME_COLORS = {
  privada: '#60A5FA',
  estadual: '#2563EB',
  federal: '#1E40AF',
  if: '#0EA5E9',
  aceleradora: '#10B981',
  dinamizador: '#06B6D4',
  incubadora: '#38BDF8',
  parque: '#1D3557',
  ict: '#0284C7',
  pesquisa: '#457B9D',
};

export const TIPOS_ATIVOS_CATALOG = [
  {
    id: 9,
    key: 'univ_privada',
    shortLabel: 'Univ. Privada',
    label: 'Campi Universidade Privada',
    corHex: ASSET_THEME_COLORS.privada,
    bgClass: 'bg-asset-privada',
    textClass: 'text-asset-estadual',
    borderClass: 'border-asset-privada'
  },
  {
    id: 7,
    key: 'univ_estadual',
    shortLabel: 'Univ. Estadual',
    label: 'Campi Universidade Pública - Estadual',
    corHex: ASSET_THEME_COLORS.estadual,
    bgClass: 'bg-asset-estadual',
    textClass: 'text-asset-estadual',
    borderClass: 'border-asset-estadual'
  },
  {
    id: 8,
    key: 'univ_federal',
    shortLabel: 'Univ. Federal',
    label: 'Campi Universidade Pública - Federal',
    corHex: ASSET_THEME_COLORS.federal,
    bgClass: 'bg-asset-federal',
    textClass: 'text-asset-federal',
    borderClass: 'border-asset-federal'
  },
  {
    id: 5,
    key: 'inst_federal',
    shortLabel: 'Inst. Federal',
    label: 'Campi Instituto Federal',
    corHex: ASSET_THEME_COLORS.if,
    bgClass: 'bg-asset-if',
    textClass: 'text-asset-ict',
    borderClass: 'border-asset-if'
  },
  {
    id: 10,
    key: 'aceleradora',
    shortLabel: 'Aceleradora',
    label: 'Aceleradora',
    corHex: ASSET_THEME_COLORS.aceleradora,
    bgClass: 'bg-asset-aceleradora',
    textClass: 'text-asset-aceleradora',
    borderClass: 'border-asset-aceleradora'
  },
  {
    id: 2,
    key: 'espaco_dinamizador',
    shortLabel: 'Espaço Dinamizador',
    label: 'Espaço Dinamizador',
    corHex: ASSET_THEME_COLORS.dinamizador,
    bgClass: 'bg-asset-dinamizador',
    textClass: 'text-asset-dinamizador',
    borderClass: 'border-asset-dinamizador'
  },
  {
    id: 4,
    key: 'incubadora',
    shortLabel: 'Incubadora',
    label: 'Incubadora',
    corHex: ASSET_THEME_COLORS.incubadora,
    bgClass: 'bg-asset-incubadora',
    textClass: 'text-asset-ict',
    borderClass: 'border-asset-incubadora'
  },
  {
    id: 6,
    key: 'parque',
    shortLabel: 'Parque Tecnológico',
    label: 'Parque Tecnológico',
    corHex: ASSET_THEME_COLORS.parque,
    bgClass: 'bg-asset-parque',
    textClass: 'text-asset-parque',
    borderClass: 'border-asset-parque'
  },
  {
    id: 3,
    key: 'ict',
    shortLabel: 'ICT',
    label: 'ICT',
    corHex: ASSET_THEME_COLORS.ict,
    bgClass: 'bg-asset-ict',
    textClass: 'text-asset-ict',
    borderClass: 'border-asset-ict'
  },
  {
    id: 1,
    key: 'pesquisa',
    shortLabel: 'Entidade Pesquisa',
    label: 'Entidade de Pesquisa',
    corHex: ASSET_THEME_COLORS.pesquisa,
    bgClass: 'bg-asset-pesquisa',
    textClass: 'text-asset-pesquisa',
    borderClass: 'border-asset-pesquisa'
  }
];

/**
 * Resolve a configuração de estilo e cor de um tipo de ativo dinamicamente a partir do nome ou ID.
 */
export const getDynamicAssetTypeConfig = (nomeTipo) => {
  const str = String(nomeTipo || '').toLowerCase();

  if (str.includes('privada')) return TIPOS_ATIVOS_CATALOG[0];
  if (str.includes('estadual')) return TIPOS_ATIVOS_CATALOG[1];
  if (str.includes('federal') && str.includes('universidade')) return TIPOS_ATIVOS_CATALOG[2];
  if (str.includes('instituto federal') || str.includes('ifba') || str.includes('if baiano')) return TIPOS_ATIVOS_CATALOG[3];
  if (str.includes('aceleradora')) return TIPOS_ATIVOS_CATALOG[4];
  if (str.includes('dinamizador')) return TIPOS_ATIVOS_CATALOG[5];
  if (str.includes('incubadora')) return TIPOS_ATIVOS_CATALOG[6];
  if (str.includes('parque')) return TIPOS_ATIVOS_CATALOG[7];
  if (str.includes('ict')) return TIPOS_ATIVOS_CATALOG[8];

  return TIPOS_ATIVOS_CATALOG[9]; // Entidade de Pesquisa / Padrão
};
