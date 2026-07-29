/**
 * Módulo puro de agregação para relatórios
 * Sem dependências de DOM ou React, para testes e geração de relatórios (PNG/PDF).
 */

import { classificarInstituicao, extractSigla, normalize } from '../src/utils/normalization.js';

export { classificarInstituicao, extractSigla };

/**
 * Helper interno para verificar se um território ou município passa pelo filtro regional/semiárido/texto
 */
function isCourseMatchingFilters(t, curso, filtros = {}) {
  const {
    selectedLocation,
    filtroSemiarido,
    semiaridoMunicipios = [],
    areaGeralFilter = [],
    debouncedCursoSearchTerm = '',
    searchTerm = '',
    ctiFilters = {},
    isCtiFilterActive = false,
  } = filtros;

  // 1. Filtro de território selecionado
  if (selectedLocation) {
    const locName = normalize(selectedLocation.nome || selectedLocation.territory || selectedLocation.regiao || '');
    if (normalize(t.nome || t.territory || '') !== locName) {
      return false;
    }
  }

  // 2. Filtro de semiárido
  if (filtroSemiarido) {
    const munNorm = normalize(curso.municipio || '');
    const inSemiaridoList = semiaridoMunicipios.length > 0 && semiaridoMunicipios.includes(munNorm);
    const terrSemiarido = Boolean(t.isSemiarido);
    if (!inSemiaridoList && !terrSemiarido) {
      return false;
    }
  }

  // 3. Filtro por Área Geral do Conhecimento
  if (areaGeralFilter && areaGeralFilter.length > 0) {
    const areaCurso = curso.areaGeral || 'Não Informada';
    if (!areaGeralFilter.includes(areaCurso)) {
      return false;
    }
  }

  // 4. Filtro de busca textual (curso, entidade ou município)
  const term = normalize(debouncedCursoSearchTerm || searchTerm || '');
  if (term) {
    const terms = term.split(' ').filter(Boolean);
    const searchStr = normalize(`${curso.curso || ''} ${curso.entidade || ''} ${curso.municipio || ''}`);
    if (!terms.every(tWord => searchStr.includes(tWord))) {
      return false;
    }
  }

  // 5. Filtro de categoria de CT&I (se ativo ou restritivo)
  const info = classificarInstituicao(curso);
  const activeKeys = Object.keys(ctiFilters).filter(k => ctiFilters[k]);
  if (isCtiFilterActive || (activeKeys.length > 0 && activeKeys.length < 8)) {
    if (info.catCurso && ctiFilters[info.catCurso] === false) {
      return false;
    }
  }

  return true;
}

/**
 * Monta lista de municípios com ensino superior PÚBLICO ordenados alfabeticamente.
 * Retorna: [{ numero: 1, municipio: "Nome", instituicoes: [{ sigla: "UFBA", categoria: "federal" }] }]
 */
export function buildMunicipiosInstituicoesList(territoriosData = [], filtros = {}) {
  if (!Array.isArray(territoriosData) || territoriosData.length === 0) {
    return [];
  }

  const munMap = new Map();

  territoriosData.forEach(t => {
    const cursos = Array.isArray(t.cursosDetalhado) ? t.cursosDetalhado : [];
    cursos.forEach(curso => {
      if (!curso.municipio) return;
      if (!isCourseMatchingFilters(t, curso, filtros)) return;

      const info = classificarInstituicao(curso);
      // Incluir apenas instituições públicas no relatório institucional
      if (!info.isPublica || !info.categoria || info.categoria === 'privada') {
        return;
      }

      const munName = curso.municipio.trim();
      const munNorm = normalize(munName);

      if (!munMap.has(munNorm)) {
        munMap.set(munNorm, {
          municipio: munName,
          instMap: new Map(),
        });
      }

      const entry = munMap.get(munNorm);
      const sigla = info.sigla || curso.entidade || 'Não Informada';
      const siglaNorm = normalize(sigla);

      if (!entry.instMap.has(siglaNorm)) {
        entry.instMap.set(siglaNorm, {
          sigla,
          categoria: info.categoria, // 'federal' | 'estadual' | 'institutoFederal'
        });
      }
    });
  });

  const munsSorted = Array.from(munMap.values()).sort((a, b) =>
    a.municipio.localeCompare(b.municipio, 'pt-BR')
  );

  return munsSorted.map((item, index) => {
    const instsSorted = Array.from(item.instMap.values()).sort((a, b) =>
      a.sigla.localeCompare(b.sigla, 'pt-BR')
    );
    return {
      numero: index + 1,
      municipio: item.municipio,
      instituicoes: instsSorted,
    };
  });
}

/**
 * Monta dados para Heatmap (Município × Área Geral do Conhecimento).
 * Retorna: { areas: string[], linhas: [{ municipio, total, contagem: { [area]: qtd } }] }
 */
export function buildAreaHeatmapData(territoriosData = [], filtros = {}) {
  if (!Array.isArray(territoriosData) || territoriosData.length === 0) {
    return { areas: [], linhas: [] };
  }

  const areasSet = new Set();
  const munMap = new Map();

  territoriosData.forEach(t => {
    const cursos = Array.isArray(t.cursosDetalhado) ? t.cursosDetalhado : [];
    cursos.forEach(curso => {
      if (!curso.municipio) return;
      if (!isCourseMatchingFilters(t, curso, filtros)) return;

      const area = (curso.areaGeral || 'Não Informada').trim();
      areasSet.add(area);

      const munName = curso.municipio.trim();
      const munNorm = normalize(munName);

      if (!munMap.has(munNorm)) {
        munMap.set(munNorm, {
          municipio: munName,
          total: 0,
          contagem: {},
        });
      }

      const entry = munMap.get(munNorm);
      entry.total += (curso.quantidade ? Number(curso.quantidade) : 1);
      entry.contagem[area] = (entry.contagem[area] || 0) + (curso.quantidade ? Number(curso.quantidade) : 1);
    });
  });

  const areas = Array.from(areasSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Preencher áreas faltantes com 0 em cada município
  const linhas = Array.from(munMap.values()).map(row => {
    const contagemCompleta = {};
    areas.forEach(a => {
      contagemCompleta[a] = row.contagem[a] || 0;
    });
    return {
      municipio: row.municipio,
      total: row.total,
      contagem: contagemCompleta,
    };
  });

  linhas.sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }
    return a.municipio.localeCompare(b.municipio, 'pt-BR');
  });

  return {
    areas,
    linhas,
  };
}

/**
 * Monta top N municípios por total de cursos e agrupa o restante em "Demais municípios".
 * Retorna array ordenado com decomposição por área geral.
 */
export function buildTopMunicipiosRanking(territoriosData = [], filtros = {}, limite = 20) {
  const heatmapData = buildAreaHeatmapData(territoriosData, filtros);
  const { areas, linhas } = heatmapData;

  if (linhas.length === 0) {
    return [];
  }

  if (linhas.length <= limite) {
    return linhas;
  }

  const topN = linhas.slice(0, limite);
  const remainder = linhas.slice(limite);

  const somaContagem = {};
  areas.forEach(a => {
    somaContagem[a] = 0;
  });

  let somaTotal = 0;
  remainder.forEach(r => {
    somaTotal += r.total;
    areas.forEach(a => {
      somaContagem[a] += (r.contagem[a] || 0);
    });
  });

  topN.push({
    municipio: 'Demais municípios',
    total: somaTotal,
    contagem: somaContagem,
  });

  return topN;
}
