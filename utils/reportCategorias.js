/**
 * Módulo de configuração de categorias para geração do relatório unificado PDF
 * Estrutura os 5 tipos de dados selecionáveis, filtros e correspondências de imagem/texto.
 */

export const CATEGORIAS_RELATORIO = [
  {
    id: 'cursos',
    label: 'Cursos de Ensino Superior',
    fonte: 'cursosDetalhado',
    filtro: null,
    gerarImagem: 'HeatmapAreaConhecimento',
    gerarTexto: 'buildTopMunicipiosRanking',
  },
  {
    id: 'univ_publicas',
    label: 'Universidades Públicas',
    fonte: 'capacidadeDetalhada',
    filtro: (ent) => ['campiUniversidadePublica', 'campiInstitutoFederal'].includes(ent?.categoria),
    gerarImagem: 'MapaNumeradoMunicipios',
    gerarTexto: 'buildMunicipiosInstituicoesList',
  },
  {
    id: 'univ_privadas',
    label: 'Universidades Privadas',
    fonte: 'capacidadeDetalhada',
    filtro: (ent) => ent?.categoria === 'campiUniversidadePrivada',
    gerarImagem: 'MapaNumeradoMunicipios',
    gerarTexto: 'buildMunicipiosInstituicoesList',
  },
  {
    id: 'cadeias',
    label: 'Cadeias Produtivas e Indicações Geográficas',
    fonte: 'cadeiasProdutivasDetalhado',
    filtro: null,
    gerarImagem: 'MapaCadeiasProdutivas',
    gerarTexto: 'buildCadeiasPorSegmento',
  },
  {
    id: 'ativos_cti',
    label: 'Ativos de Ciência, Tecnologia e Inovação',
    fonte: 'capacidadeDetalhada',
    filtro: (ent) => [
      'icts',
      'centrosPesquisa',
      'parquesTecnologicos',
      'incubadoras',
      'aceleradoras',
      'espacoDinamizadoress',
      'incubadorasAceleradoras',
    ].includes(ent?.categoria),
    gerarImagem: 'MapaNumeradoMunicipios',
    gerarTexto: 'buildEntidadesPorCategoria',
  },
];

/**
 * Helper para extrair o array correto do território considerando compatibilidade
 * entre dados brutos (capacidadeDetalhada) e dados mapeados (entidadesDetalhadas).
 */
export function getTerritoryArrayByFonte(t, fonte) {
  if (!t) return [];
  if (fonte === 'capacidadeDetalhada') {
    if (Array.isArray(t.capacidadeDetalhada)) return t.capacidadeDetalhada;
    if (Array.isArray(t.entidadesDetalhadas)) return t.entidadesDetalhadas;
    return [];
  }
  return Array.isArray(t[fonte]) ? t[fonte] : [];
}
