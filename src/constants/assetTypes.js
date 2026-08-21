import { 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Building2, 
  Microscope, 
  Cpu, 
  Rocket, 
  Coins, 
  Compass, 
  Flame 
} from 'lucide-react';

/**
 * CONFIGURAÇÃO CENTRALIZADA DE CORES DE ATIVOS CTI
 * Single Source of Truth para Tailwind, Mapas, Gráficos e Listas
 */
export const ASSET_THEME_COLORS = {
  privada: '#38BDF8',       // Sky Blue / Ciano Claro Luminoso
  estadual: '#2563EB',      // Royal Blue Vibrante
  federal: '#1E3A8A',       // Azul Marinho / Indigo Profundo
  if: '#0284C7',            // Azul Oceano Médio
  aceleradora: '#10B981',   // Esmeralda Vibrante
  dinamizador: '#06B6D4',   // Turquesa Intenso
  incubadora: '#6366F1',    // Índigo Suave
  parque: '#0F172A',        // Midnight Navy / Preto Azulado
  ict: '#0D9488',           // Verde Petróleo / Teal
  pesquisa: '#64748B',      // Slate / Cinza Aço
  hub: '#8B5CF6',           // Violeta Claro
  centro_pd: '#F59E0B',     // Âmbar
  investimento: '#EC4899',  // Rosa / Magenta
  outro: '#94A3B8'
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
    borderClass: 'border-asset-privada',
    icone: GraduationCap,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`
  },
  {
    id: 7,
    key: 'univ_estadual',
    shortLabel: 'Univ. Estadual',
    label: 'Campi Universidade Pública - Estadual',
    corHex: ASSET_THEME_COLORS.estadual,
    bgClass: 'bg-asset-estadual',
    textClass: 'text-asset-estadual',
    borderClass: 'border-asset-estadual',
    icone: GraduationCap,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`
  },
  {
    id: 8,
    key: 'univ_federal',
    shortLabel: 'Univ. Federal',
    label: 'Campi Universidade Pública - Federal',
    corHex: ASSET_THEME_COLORS.federal,
    bgClass: 'bg-asset-federal',
    textClass: 'text-asset-federal',
    borderClass: 'border-asset-federal',
    icone: GraduationCap,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`
  },
  {
    id: 5,
    key: 'inst_federal',
    shortLabel: 'Inst. Federal',
    label: 'Campi Instituto Federal',
    corHex: ASSET_THEME_COLORS.if,
    bgClass: 'bg-asset-if',
    textClass: 'text-asset-ict',
    borderClass: 'border-asset-if',
    icone: BookOpen,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
  },
  {
    id: 10,
    key: 'aceleradora',
    shortLabel: 'Aceleradora',
    label: 'Aceleradora',
    corHex: ASSET_THEME_COLORS.aceleradora,
    bgClass: 'bg-asset-aceleradora',
    textClass: 'text-asset-aceleradora',
    borderClass: 'border-asset-aceleradora',
    icone: Rocket,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`
  },
  {
    id: 2,
    key: 'espaco_dinamizador',
    shortLabel: 'Espaço Dinamizador',
    label: 'Espaço Dinamizador',
    corHex: ASSET_THEME_COLORS.dinamizador,
    bgClass: 'bg-asset-dinamizador',
    textClass: 'text-asset-dinamizador',
    borderClass: 'border-asset-dinamizador',
    icone: Flame,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`
  },
  {
    id: 4,
    key: 'incubadora',
    shortLabel: 'Incubadora',
    label: 'Incubadora de Empresas',
    corHex: ASSET_THEME_COLORS.incubadora,
    bgClass: 'bg-asset-incubadora',
    textClass: 'text-asset-ict',
    borderClass: 'border-asset-incubadora',
    icone: Compass,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`
  },
  {
    id: 6,
    key: 'parque',
    shortLabel: 'Parque Tecnológico',
    label: 'Parque Tecnológico',
    corHex: ASSET_THEME_COLORS.parque,
    bgClass: 'bg-asset-parque',
    textClass: 'text-asset-parque',
    borderClass: 'border-asset-parque',
    icone: Building2,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`
  },
  {
    id: 3,
    key: 'ict',
    shortLabel: 'ICT',
    label: 'Instituto de Ciência e Tecnologia (ICT)',
    corHex: ASSET_THEME_COLORS.ict,
    bgClass: 'bg-asset-ict',
    textClass: 'text-asset-ict',
    borderClass: 'border-asset-ict',
    icone: Microscope,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>`
  },
  {
    id: 11,
    key: 'hub_inovacao',
    shortLabel: 'Hub / Coworking',
    label: 'Hub de Inovação / Coworking / FabLab',
    corHex: ASSET_THEME_COLORS.hub,
    bgClass: 'bg-[#8B5CF6]',
    textClass: 'text-[#7C3AED]',
    borderClass: 'border-[#8B5CF6]',
    icone: Layers,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L2 12.5"/><path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L2 17.5"/></svg>`
  },
  {
    id: 12,
    key: 'centro_pd',
    shortLabel: 'Centro de P&D',
    label: 'Centro de P&D / Inovação Corporativa',
    corHex: ASSET_THEME_COLORS.centro_pd,
    bgClass: 'bg-[#F59E0B]',
    textClass: 'text-[#D97706]',
    borderClass: 'border-[#F59E0B]',
    icone: Cpu,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`
  },
  {
    id: 13,
    key: 'investimento',
    shortLabel: 'Fundo / Investimento',
    label: 'Fundo de Investimento / Fomento / VC',
    corHex: ASSET_THEME_COLORS.investimento,
    bgClass: 'bg-[#EC4899]',
    textClass: 'text-[#DB2777]',
    borderClass: 'border-[#EC4899]',
    icone: Coins,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>`
  },
  {
    id: 1,
    key: 'pesquisa',
    shortLabel: 'Entidade Pesquisa',
    label: 'Entidade de Pesquisa',
    corHex: ASSET_THEME_COLORS.pesquisa,
    bgClass: 'bg-asset-pesquisa',
    textClass: 'text-asset-pesquisa',
    borderClass: 'border-asset-pesquisa',
    icone: Microscope,
    iconSvg: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>`
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
  if (str.includes('hub') || str.includes('coworking') || str.includes('fablab') || str.includes('maker')) return TIPOS_ATIVOS_CATALOG[9];
  if (str.includes('centro') && (str.includes('p&d') || str.includes('desenvolvimento') || str.includes('inovacao'))) return TIPOS_ATIVOS_CATALOG[10];
  if (str.includes('investimento') || str.includes('fundo') || str.includes('venture') || str.includes('capital') || str.includes('fomento')) return TIPOS_ATIVOS_CATALOG[11];

  return TIPOS_ATIVOS_CATALOG[12]; // Entidade de Pesquisa / Padrão
};