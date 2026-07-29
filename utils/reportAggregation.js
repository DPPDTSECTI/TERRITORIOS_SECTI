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

  // 1. Filtro de território selecionado no mapa (ignora seleção isolada de Município, filtrando pelos municípios apenas quando for Território)
  if (selectedLocation && (selectedLocation.matchType === 'Território' || !selectedLocation.matchType)) {
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
 * Filtra a lista de territórios com base na seleção do usuário (apenas se for um Território).
 */
export function filterTerritoriosByLocation(territoriosData = [], filtros = {}) {
  const { selectedLocation } = filtros;
  if (selectedLocation && (selectedLocation.matchType === 'Território' || !selectedLocation.matchType)) {
    const locName = normalize(selectedLocation.nome || selectedLocation.territory || selectedLocation.regiao || '');
    return territoriosData.filter(t => normalize(t.nome || t.territory || '') === locName);
  }
  return territoriosData;
}

/**
 * Normaliza o nome do município removendo sufixos EAD / sede da IES (Bug 1).
 */
export function normalizarMunicipio(nome) {
  if (!nome) return '';
  return String(nome)
    .replace(/\s*\((?:sede da IES|EAD).*?\)\s*/i, '')
    .replace(/\s*-\s*EAD\s*$/i, '')
    .trim();
}

/**
 * Monta lista de municípios com instituições ordenados alfabeticamente.
 * Suporta tanto o array de territórios (dados brutos) com filtros quanto uma lista direta de entidades já filtradas.
 * Retorna: [{ numero: 1, municipio: "Nome", instituicoes: [{ sigla: "UFBA", nome: "...", categoria: "federal" }] }]
 */
export function buildMunicipiosInstituicoesList(inputData = [], filtros = {}) {
  if (!Array.isArray(inputData) || inputData.length === 0) {
    return [];
  }

  const isTerritoryList = inputData.some(
    item =>
      item &&
      (item.cursosDetalhado ||
        item.capacidadeDetalhada ||
        item.entidadesDetalhadas ||
        item.territory ||
        item.territories)
  );

  const munMap = new Map();

  const addEntityToMap = (munName, ent, fallbackCat = '') => {
    if (!munName) return;
    const cleanMun = normalizarMunicipio(munName);
    const munNorm = normalize(cleanMun);

    if (!munMap.has(munNorm)) {
      munMap.set(munNorm, {
        municipio: cleanMun,
        instMap: new Map(),
      });
    }

    const entry = munMap.get(munNorm);
    const info = classificarInstituicao(ent);
    const sigla = info.sigla || ent.sigla || ent.entidade || ent.nome || 'Não Informada';
    const siglaNorm = normalize(sigla);

    if (!entry.instMap.has(siglaNorm)) {
      entry.instMap.set(siglaNorm, {
        sigla,
        nome: ent.entidade || ent.nome || sigla,
        categoria: info.categoria || ent.categoria || fallbackCat || 'Não Informada',
      });
    }
  };

  if (isTerritoryList) {
    inputData.forEach(t => {
      const cap = Array.isArray(t.capacidadeDetalhada)
        ? t.capacidadeDetalhada
        : Array.isArray(t.entidadesDetalhadas)
          ? t.entidadesDetalhadas
          : [];
      cap.forEach(ent => {
        if (!ent || !ent.municipio) return;
        const info = classificarInstituicao(ent);
        const cat = info.categoria || ent.categoria || '';
        if (
          info.isPublica ||
          ['federal', 'estadual', 'institutoFederal', 'campiUniversidadePublica', 'campiInstitutoFederal'].includes(cat)
        ) {
          addEntityToMap(ent.municipio, ent, cat);
        }
      });

      const cursos = Array.isArray(t.cursosDetalhado) ? t.cursosDetalhado : [];
      cursos.forEach(curso => {
        if (!curso.municipio) return;
        if (!isCourseMatchingFilters(t, curso, filtros)) return;

        const info = classificarInstituicao(curso);
        // Compatibilidade com comportamento original se chamado sobre cursosDetalhado para relatório público
        if (!info.isPublica || !info.categoria || info.categoria === 'privada') {
          return;
        }
        addEntityToMap(curso.municipio, curso, info.categoria);
      });
    });
  } else {
    // É uma lista direta de entidades já filtradas (públicas ou privadas)
    inputData.forEach(ent => {
      if (!ent || !ent.municipio) return;
      addEntityToMap(ent.municipio, ent, ent.categoria);
    });
  }

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

  const { selectedLocation } = filtros;
  const isGlobalView = !(selectedLocation && (selectedLocation.matchType === 'Território' || !selectedLocation.matchType));

  const areasSet = new Set();
  const munMap = new Map();

  territoriosData.forEach(t => {
    const cursos = Array.isArray(t.cursosDetalhado) ? t.cursosDetalhado : [];
    cursos.forEach(curso => {
      if (!curso.municipio) return;
      if (!isCourseMatchingFilters(t, curso, filtros)) return;

      const area = (curso.areaGeral || 'Não Informada').trim();
      areasSet.add(area);

      const groupName = isGlobalView ? (t.nome || t.territory || 'Sem Território') : normalizarMunicipio(curso.municipio);
      const groupNorm = normalize(groupName);

      if (!munMap.has(groupNorm)) {
        munMap.set(groupNorm, {
          municipio: groupName,
          total: 0,
          contagem: {},
        });
      }

      const entry = munMap.get(groupNorm);
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

/**
 * Monta lista de cadeias produtivas ordenadas por segmento e sede.
 * Retorna array de { id, segmento, sede, territorios, municipiosPertencentes, tipo, entidade } (resolve Bugs 2 e 3).
 */
export function buildCadeiasPorSegmento(inputData = []) {
  if (!Array.isArray(inputData) || inputData.length === 0) {
    return [];
  }

  let cadeiasList = [];
  const isTerritoryList = inputData.some(
    item => item && (item.cadeiasProdutivasDetalhado || item.territory || item.territories)
  );

  if (isTerritoryList) {
    inputData.forEach(t => {
      const cads = Array.isArray(t.cadeiasProdutivasDetalhado)
        ? t.cadeiasProdutivasDetalhado
        : [];
      const territoryName = t.territory || t.nome || 'N/A';
      cads.forEach(cad => {
        if (cad) {
          cadeiasList.push({
            ...cad,
            territorioOrigem: cad.territorioOrigem || cad.territorio || territoryName,
            territorio: cad.territorio || territoryName,
          });
        }
      });
    });
  } else {
    cadeiasList = inputData.filter(Boolean);
  }

  const porChave = new Map();
  cadeiasList.forEach(c => {
    const chave = c.id ?? `${c.segmento || ''}::${c.sede || ''}`;
    if (!porChave.has(chave)) {
      porChave.set(chave, {
        id: chave,
        segmento: c.segmento || 'Não Informado',
        sede: normalizarMunicipio(c.sede || 'Não Informada'),
        territorios: new Set(),
        municipios: new Set(),
        tipo: c.tipo || '',
        entidade: c.entidade || '',
      });
    }
    const entry = porChave.get(chave);
    const terr = c.territorioOrigem || c.territorio || c.territorios;
    if (terr && terr !== 'N/A') {
      if (Array.isArray(terr)) {
        terr.forEach(t => t && entry.territorios.add(String(t).trim()));
      } else {
        String(terr)
          .split(/[,;]/)
          .forEach(t => t.trim() && entry.territorios.add(t.trim()));
      }
    }
    const muns = c.municipiosPertencentes;
    if (muns && muns !== 'N/A') {
      if (Array.isArray(muns)) {
        muns.forEach(m => m && entry.municipios.add(normalizarMunicipio(String(m))));
      } else {
        String(muns)
          .split(/[,;]/)
          .forEach(m => m.trim() && entry.municipios.add(normalizarMunicipio(m.trim())));
      }
    }
  });

  const listFormatted = Array.from(porChave.values()).map(e => ({
    id: e.id,
    segmento: e.segmento,
    sede: e.sede,
    territorios: Array.from(e.territorios).sort((a, b) => a.localeCompare(b, 'pt-BR')).join(', ') || 'N/A',
    municipiosPertencentes: Array.from(e.municipios).sort((a, b) => a.localeCompare(b, 'pt-BR')).join('; ') || 'N/A',
    tipo: e.tipo,
    entidade: e.entidade,
  }));

  return listFormatted.sort((a, b) => {
    const cmpSeg = a.segmento.localeCompare(b.segmento, 'pt-BR');
    if (cmpSeg !== 0) return cmpSeg;
    return a.sede.localeCompare(b.sede, 'pt-BR');
  });
}

export const CTI_CATEGORY_LABELS = {
  icts: 'ICTs',
  centrosPesquisa: 'Centros de Pesquisa',
  parquesTecnologicos: 'Parques Tecnológicos',
  incubadoras: 'Incubadoras',
  aceleradoras: 'Aceleradoras',
  incubadorasAceleradoras: 'Incubadoras e Aceleradoras',
  espacoDinamizadoress: 'Espaços Dinamizadores',
  campiUniversidadePublica: 'Campi Universidade Pública',
  campiInstitutoFederal: 'Campi Instituto Federal',
  campiUniversidadePrivada: 'Campi Universidade Privada',
};

/**
 * Monta agrupamento de entidades de CT&I por categoria.
 * Retorna array ordenado de { categoria, label, total, entidades: [{ entidade, municipio, tipo, categoria }] }
 */
export function buildEntidadesPorCategoria(inputData = []) {
  if (!Array.isArray(inputData) || inputData.length === 0) {
    return [];
  }

  let entidadesList = [];
  const isTerritoryList = inputData.some(
    item =>
      item &&
      (item.capacidadeDetalhada ||
        item.entidadesDetalhadas ||
        item.territory ||
        item.territories)
  );

  if (isTerritoryList) {
    inputData.forEach(t => {
      const ents = Array.isArray(t.capacidadeDetalhada)
        ? t.capacidadeDetalhada
        : Array.isArray(t.entidadesDetalhadas)
          ? t.entidadesDetalhadas
          : [];
      ents.forEach(ent => {
        if (ent) entidadesList.push(ent);
      });
    });
  } else {
    entidadesList = inputData.filter(Boolean);
  }

  const CTI_TARGET_CATEGORIES = [
    'icts',
    'centrosPesquisa',
    'parquesTecnologicos',
    'incubadoras',
    'aceleradoras',
    'incubadorasAceleradoras',
    'espacoDinamizadoress',
  ];

  const map = new Map();

  entidadesList.forEach(ent => {
    let cat = ent.categoria || 'outros';
    if (cat === 'incubadoras' || cat === 'aceleradoras') {
      cat = 'incubadorasAceleradoras';
    }

    if (!CTI_TARGET_CATEGORIES.includes(cat)) {
      return;
    }

    if (!map.has(cat)) {
      map.set(cat, {
        categoria: cat,
        label: CTI_CATEGORY_LABELS[cat] || cat,
        total: 0,
        entidades: [],
      });
    }

    const group = map.get(cat);
    group.total += 1;
    group.entidades.push({
      entidade: ent.entidade || ent.nome || 'Não Informada',
      municipio: normalizarMunicipio(ent.municipio || 'Não Informado'),
      tipo: ent.tipo || CTI_CATEGORY_LABELS[cat] || cat,
      categoria: cat,
    });
  });

  const arrayResult = Array.from(map.values()).map(group => {
    group.entidades.sort((a, b) =>
      a.entidade.localeCompare(b.entidade, 'pt-BR')
    );
    return group;
  });

  return arrayResult.sort((a, b) =>
    a.label.localeCompare(b.label, 'pt-BR')
  );
}
