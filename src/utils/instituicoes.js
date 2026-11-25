import { normalize } from './normalization.js';

/**
 * Normaliza o status ICT institucional para as categorias conhecidas ('sim', 'nao', 'pendente')
 * ou 'outro' para valores nulos/inesperados.
 *
 * @param {string|null|undefined} status
 * @returns {'sim'|'nao'|'pendente'|'outro'}
 */
export function normalizeIctStatus(status) {
  const clean = normalize(status);
  if (clean === 'sim') return 'sim';
  if (clean === 'nao') return 'nao';
  if (clean === 'pendente') return 'pendente';
  return 'outro';
}

/**
 * Calcula indicadores agregados exclusivamente para entidades institucionais.
 *
 * @param {Array<object>} instituicoes
 * @returns {{ total: number, sim: number, nao: number, pendente: number, outros: number, inativas: number }}
 */
export function computeInstituicoesKpis(instituicoes = []) {
  const list = Array.isArray(instituicoes) ? instituicoes : [];
  let sim = 0;
  let nao = 0;
  let pendente = 0;
  let outros = 0;
  let inativas = 0;

  for (const inst of list) {
    if (!inst) continue;
    const status = normalizeIctStatus(inst.ict_status);
    if (status === 'sim') sim += 1;
    else if (status === 'nao') nao += 1;
    else if (status === 'pendente') pendente += 1;
    else outros += 1;

    if (inst.ativa === false) inativas += 1;
  }

  return {
    total: list.filter(Boolean).length,
    sim,
    nao,
    pendente,
    outros,
    inativas,
  };
}

/**
 * Agrupa os ativos físicos por id_instituicao sem fundir, modificar ou excluir registros.
 * Ativos sem id_instituicao (NULL) são ignorados no mapa.
 *
 * @param {Array<object>} ativos
 * @returns {Map<number, Array<object>>}
 */
export function buildAtivosByInstituicaoMap(ativos = []) {
  const map = new Map();
  if (!Array.isArray(ativos)) return map;

  for (const ativo of ativos) {
    if (!ativo || ativo.id_instituicao === null || ativo.id_instituicao === undefined) continue;
    const key = Number(ativo.id_instituicao);
    if (!Number.isFinite(key)) continue;
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(ativo);
    } else {
      map.set(key, [ativo]);
    }
  }

  return map;
}

/**
 * Extrai a lista única e ordenada de naturezas institucionais a partir dos dados reais.
 *
 * @param {Array<object>} instituicoes
 * @returns {Array<string>}
 */
export function extractNaturezasInstitucionais(instituicoes = []) {
  if (!Array.isArray(instituicoes)) return [];
  const set = new Set();

  for (const inst of instituicoes) {
    const raw = typeof inst?.natureza_institucional === 'string' ? inst.natureza_institucional.trim() : '';
    if (raw) set.add(raw);
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/**
 * Filtra instituições por texto (nome ou sigla), status ICT e natureza institucional,
 * preservando instituições sem ativos, pendentes e inativas.
 *
 * @param {Array<object>} instituicoes
 * @param {{ search?: string, ictStatus?: string, natureza?: string }} [filters]
 * @returns {Array<object>}
 */
export function filterInstituicoes(
  instituicoes = [],
  { search = '', ictStatus = 'todos', natureza = 'todas' } = {}
) {
  if (!Array.isArray(instituicoes)) return [];
  const searchNorm = normalize(search);
  const statusFilter = ictStatus || 'todos';
  const naturezaFilter = natureza || 'todas';

  return instituicoes.filter((inst) => {
    if (!inst) return false;

    if (searchNorm) {
      const nomeNorm = normalize(inst.nome_instituicao);
      const siglaNorm = normalize(inst.sigla);
      if (!nomeNorm.includes(searchNorm) && !siglaNorm.includes(searchNorm)) {
        return false;
      }
    }

    if (statusFilter !== 'todos') {
      if (normalizeIctStatus(inst.ict_status) !== statusFilter) {
        return false;
      }
    }

    if (naturezaFilter !== 'todas') {
      const nat = typeof inst.natureza_institucional === 'string' ? inst.natureza_institucional.trim() : '';
      if (nat !== naturezaFilter) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Enriquece uma lista de instituições com os respectivos ativos vinculados e contagem,
 * sem mutar os objetos originais.
 *
 * @param {Array<object>} instituicoes
 * @param {Map<number, Array<object>>} ativosMap
 * @returns {Array<object>}
 */
export function enrichInstituicoesWithAtivos(instituicoes = [], ativosMap = new Map()) {
  if (!Array.isArray(instituicoes)) return [];
  return instituicoes.map((inst) => {
    const ativosVinculados = getAtivosDaInstituicao(inst?.id_instituicao, ativosMap);
    return {
      ...inst,
      ativosVinculados,
      qtdAtivos: ativosVinculados.length,
    };
  });
}

/**
 * Retorna os ativos vinculados à instituição informada.
 *
 * @param {number|string|null|undefined} idInstituicao
 * @param {Map<number, Array<object>>} ativosMap
 * @returns {Array<object>}
 */
export function getAtivosDaInstituicao(idInstituicao, ativosMap) {
  if (idInstituicao === null || idInstituicao === undefined || !(ativosMap instanceof Map)) {
    return [];
  }
  const key = Number(idInstituicao);
  if (!Number.isFinite(key)) return [];
  return ativosMap.get(key) || [];
}

/**
 * Sanitiza URL de site oficial, aceitando apenas http/https e adicionando https:// quando omitido.
 *
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export function formatSafeUrl(url) {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return null;
  }

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export const SEM_INSTITUICAO_FILTER = '__sem_instituicao__';

/**
 * Filtra ativos físicos por vínculo institucional (id_instituicao),
 * preservando todos os registros em 'todas' e isolando os sem vínculo em SEM_INSTITUICAO_FILTER.
 *
 * @param {Array<object>} ativos
 * @param {string} [instituicaoFilter='todas']
 * @returns {Array<object>}
 */
export function filterAtivosByInstituicao(ativos = [], instituicaoFilter = 'todas') {
  if (!Array.isArray(ativos)) return [];
  if (!instituicaoFilter || instituicaoFilter === 'todas') return ativos;

  if (instituicaoFilter === SEM_INSTITUICAO_FILTER) {
    return ativos.filter((a) => a && (a.id_instituicao === null || a.id_instituicao === undefined));
  }

  const targetId = Number(instituicaoFilter);
  if (!Number.isFinite(targetId)) return ativos;

  return ativos.filter(
    (a) =>
      a &&
      a.id_instituicao !== null &&
      a.id_instituicao !== undefined &&
      Number(a.id_instituicao) === targetId
  );
}

/**
 * Formata o rótulo de exibição institucional com nome e sigla opcional.
 *
 * @param {string|null|undefined} nome
 * @param {string|null|undefined} sigla
 * @returns {string}
 */
export function formatInstituicaoLabel(nome, sigla) {
  const cleanNome = typeof nome === 'string' ? nome.trim() : '';
  if (!cleanNome) return '';
  const cleanSigla = typeof sigla === 'string' ? sigla.trim() : '';
  return cleanSigla ? `${cleanNome} (${cleanSigla})` : cleanNome;
}

/**
 * Calcula analytics institucionais para os relatórios analíticos sem misturar
 * entidades institucionais com ativos físicos ou instituições de ensino de cursos.
 *
 * @param {Array<object>} instituicoes
 * @param {Array<object>} ativos
 * @returns {{
 *   kpis: { total: number, sim: number, nao: number, pendente: number, outros: number, inativas: number },
 *   comAtivos: number,
 *   semAtivos: number,
 *   porNatureza: Array<{ natureza: string, count: number }>,
 *   ativosEscopo: { total: number, vinculados: number, semVinculo: number, taxaVinculo: string }
 * }}
 */
export function computeInstituicoesAnalytics(instituicoes = [], ativos = []) {
  const instList = Array.isArray(instituicoes) ? instituicoes.filter(Boolean) : [];
  const ativosList = Array.isArray(ativos) ? ativos.filter(Boolean) : [];

  const kpis = computeInstituicoesKpis(instList);
  const ativosMap = buildAtivosByInstituicaoMap(ativosList);

  let comAtivos = 0;
  const natCounts = new Map();

  for (const inst of instList) {
    const bound = getAtivosDaInstituicao(inst.id_instituicao, ativosMap);
    if (bound.length > 0) {
      comAtivos += 1;
    }
    const rawNat = typeof inst.natureza_institucional === 'string' ? inst.natureza_institucional.trim() : '';
    const nat = rawNat || 'Não informada';
    natCounts.set(nat, (natCounts.get(nat) || 0) + 1);
  }

  const porNatureza = Array.from(natCounts.entries())
    .map(([natureza, count]) => ({ natureza, count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.natureza.localeCompare(b.natureza, 'pt-BR')));

  let vinculados = 0;
  for (const ativo of ativosList) {
    if (ativo.id_instituicao !== null && ativo.id_instituicao !== undefined) {
      vinculados += 1;
    }
  }
  const totalAtivos = ativosList.length;
  const semVinculo = totalAtivos - vinculados;
  const taxaVinculo = totalAtivos > 0 ? ((vinculados / totalAtivos) * 100).toFixed(1) : '0.0';

  return {
    kpis,
    comAtivos,
    semAtivos: Math.max(0, kpis.total - comAtivos),
    porNatureza,
    ativosEscopo: {
      total: totalAtivos,
      vinculados,
      semVinculo,
      taxaVinculo,
    },
  };
}

/**
 * Monta as linhas da exportação XLSX de ativos preservando exatamente as 12 colunas
 * originais na ordem histórica e acrescentando as 7 colunas institucionais ao final.
 *
 * @param {Array<object>} ativos
 * @returns {Array<object>}
 */
export function buildAtivosExportRows(ativos = []) {
  if (!Array.isArray(ativos)) return [];

  return ativos.map((a, idx) => {
    const hasInst = a?.id_instituicao !== null && a?.id_instituicao !== undefined;

    return {
      'ID': a?.id_ativo || idx + 1,
      'Nome do Ativo': a?.nome_ativo || a?.nome || 'Ativo sem nome',
      'Sigla': a?.sigla || '',
      'Tipo de Ativo': a?.tipo || 'Geral',
      'Município': a?.municipio || '',
      'Território de Identidade': a?.territorio_identidade || a?.territorio || '',
      'Conexão RNP': a?.rnp ? 'Sim' : 'Não',
      'Pertence ao Semiárido': a?.semiarido ? 'Sim' : 'Não',
      'Latitude': a?.latitude != null ? a.latitude : '',
      'Longitude': a?.longitude != null ? a.longitude : '',
      'Título Referência': a?.tituloReferencia || a?.titulo_referencia || '',
      'URL Referência': a?.urlReferencia || a?.url_referencia || '',
      'ID da Instituição': hasInst ? a.id_instituicao : '',
      'Nome da Instituição': hasInst ? (a.nome_instituicao || '') : '',
      'Sigla da Instituição': hasInst ? (a.sigla_instituicao || '') : '',
      'Status ICT': hasInst ? (a.ict_status || '') : '',
      'Natureza Institucional': hasInst ? (a.natureza_instituicao || '') : '',
      'Site Oficial': hasInst ? (a.site_oficial || '') : '',
      'Parceiro Local': a?.parceiro_local || '',
    };
  });
}
