export const CRUD_DRAFT_STORAGE_KEY = '@SectiPainel_CRUD_Draft_v1';

export const ENTITY_META = {
  ativos: {
    idKey: 'id_ativo',
    fallbackIdKey: 'id',
    labelKey: 'nome_ativo',
    fallbackLabelKey: 'nome',
  },
  cursos: {
    idKey: 'id_curso',
    fallbackIdKey: 'id',
    labelKey: 'curso',
    fallbackLabelKey: 'nome',
  },
  cadeias: {
    idKey: 'id_cadeia',
    fallbackIdKey: 'id',
    labelKey: 'entidade',
    fallbackLabelKey: 'nome',
  },
};

export const CRUD_ENTITIES = Object.keys(ENTITY_META);

/**
 * Cria estrutura vazia de rascunho local para operacoes CRUD.
 *
 * @returns {{ ativos: object, cursos: object, cadeias: object, auditLog: Array<object> }}
 */
export function createEmptyDraft() {
  return {
    ativos: { added: [], updated: {}, deleted: [] },
    cursos: { added: [], updated: {}, deleted: [] },
    cadeias: { added: [], updated: {}, deleted: [] },
    auditLog: [],
  };
}

/**
 * Extrai identificador textual estavel de um registro da entidade.
 *
 * @param {'ativos'|'cursos'|'cadeias'} entity
 * @param {object} item
 * @returns {string}
 */
export function getEntityItemId(entity, item) {
  if (!item) return '';
  const meta = ENTITY_META[entity];
  if (!meta) return String(item.id ?? '');
  const rawId = item[meta.idKey] ?? item[meta.fallbackIdKey] ?? item.id;
  return rawId != null && rawId !== '' ? String(rawId) : '';
}

/**
 * Extrai rotulo legivel principal de um registro da entidade.
 *
 * @param {'ativos'|'cursos'|'cadeias'} entity
 * @param {object} item
 * @returns {string}
 */
export function getEntityItemLabel(entity, item) {
  if (!item) return '';
  const meta = ENTITY_META[entity];
  if (!meta) return String(item.nome ?? item.id ?? '');
  return String(
    item[meta.labelKey] ?? item[meta.fallbackLabelKey] ?? item.sigla ?? item.id ?? 'Registro'
  );
}

/**
 * Carrega o rascunho CRUD salvo no localStorage com fallback seguro.
 *
 * @returns {{ ativos: object, cursos: object, cadeias: object, auditLog: Array<object> }}
 */
export function loadCrudDraft() {
  const empty = createEmptyDraft();
  if (typeof window === 'undefined' || !window.localStorage) return empty;

  try {
    const raw = window.localStorage.getItem(CRUD_DRAFT_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);

    const normalized = createEmptyDraft();
    CRUD_ENTITIES.forEach((entity) => {
      const slice = parsed?.[entity];
      if (slice && typeof slice === 'object') {
        normalized[entity] = {
          added: Array.isArray(slice.added) ? slice.added : [],
          updated: slice.updated && typeof slice.updated === 'object' ? slice.updated : {},
          deleted: Array.isArray(slice.deleted) ? slice.deleted.map(String) : [],
        };
      }
    });
    normalized.auditLog = Array.isArray(parsed?.auditLog) ? parsed.auditLog : [];
    return normalized;
  } catch {
    return empty;
  }
}

/**
 * Persiste o rascunho CRUD no localStorage.
 *
 * @param {object} draft
 */
export function saveCrudDraft(draft) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(CRUD_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (err) {
    console.warn('Nao foi possivel salvar rascunho CRUD no localStorage:', err);
  }
}

/**
 * Remove o rascunho CRUD salvo no localStorage.
 */
export function clearCrudDraft() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(CRUD_DRAFT_STORAGE_KEY);
  } catch (err) {
    console.warn('Nao foi possivel limpar rascunho CRUD no localStorage:', err);
  }
}

/**
 * Aplica criacoes, edicoes e exclusoes sobre uma lista base preservando imutabilidade.
 *
 * @param {Array<object>} baseList
 * @param {{ added?: Array<object>, updated?: Record<string, object>, deleted?: Array<string> }} patch
 * @param {'ativos'|'cursos'|'cadeias'} entity
 * @returns {Array<object>}
 */
export function applyCrudPatch(baseList, patch, entity) {
  const source = Array.isArray(baseList) ? baseList : [];
  if (!patch) return source;

  const deletedSet = new Set((patch.deleted || []).map(String));
  const updatedMap = patch.updated || {};
  const addedList = Array.isArray(patch.added) ? patch.added : [];

  const filteredAdded = addedList
    .filter((item) => {
      const id = getEntityItemId(entity, item);
      return !id || !deletedSet.has(id);
    })
    .map((item) => {
      const id = getEntityItemId(entity, item);
      const override = id ? updatedMap[id] : null;
      return override ? { ...item, ...override, __crudStatus: 'added' } : { ...item, __crudStatus: 'added' };
    });

  const mergedBase = source
    .filter((item) => {
      const id = getEntityItemId(entity, item);
      return !id || !deletedSet.has(id);
    })
    .map((item) => {
      const id = getEntityItemId(entity, item);
      const override = id ? updatedMap[id] : null;
      return override ? { ...item, ...override, __crudStatus: 'updated' } : item;
    });

  if (filteredAdded.length === 0) return mergedBase;
  return [...filteredAdded, ...mergedBase];
}

/**
 * Sincroniza a tabela de distribuicao de cadeias com mutacoes feitas em listaCadeias.
 *
 * @param {Array<object>} baseDist
 * @param {{ added?: Array<object>, updated?: Record<string, object>, deleted?: Array<string> }} patch
 * @returns {Array<object>}
 */
export function applyCadeiasDistribuicaoPatch(baseDist, patch) {
  const source = Array.isArray(baseDist) ? baseDist : [];
  if (!patch) return source;

  const deletedSet = new Set((patch.deleted || []).map(String));
  const updatedMap = patch.updated || {};
  const addedList = Array.isArray(patch.added) ? patch.added : [];

  const addedRows = addedList
    .filter((item) => {
      const id = getEntityItemId('cadeias', item);
      return !id || !deletedSet.has(id);
    })
    .map((item) => {
      const id = getEntityItemId('cadeias', item);
      const merged = updatedMap[id] ? { ...item, ...updatedMap[id] } : item;
      return {
        ...merged,
        id_cadeia: merged.id_cadeia ?? merged.id,
        nome_tipo: merged.nome_tipo || merged.tipo,
        nome_municipio: merged.nome_municipio || merged.municipio_sede || merged.sede,
        municipio_sede: merged.municipio_sede || merged.nome_municipio || merged.sede,
      };
    });

  const mergedBase = source
    .filter((row) => {
      const id = String(row.id_cadeia ?? row.id ?? '');
      return !id || !deletedSet.has(id);
    })
    .map((row) => {
      const id = String(row.id_cadeia ?? row.id ?? '');
      const override = id ? updatedMap[id] : null;
      if (!override) return row;
      return {
        ...row,
        entidade: override.entidade ?? row.entidade,
        tipo: override.tipo ?? row.tipo,
        nome_tipo: override.nome_tipo ?? override.tipo ?? row.nome_tipo,
        id_tipo_cadeia: override.id_tipo_cadeia ?? row.id_tipo_cadeia,
        segmento: override.segmento ?? row.segmento,
        nome_cadeia: override.nome_cadeia ?? override.segmento ?? row.nome_cadeia,
        municipio_sede: override.municipio_sede ?? row.municipio_sede,
        sede: override.municipio_sede ?? override.sede ?? row.sede,
        id_territorio: override.id_territorio ?? row.id_territorio,
        nome_territorio: override.nome_territorio ?? row.nome_territorio,
        fonte: override.fonte ?? row.fonte,
        texto_referencia: override.texto_referencia ?? row.texto_referencia,
      };
    });

  if (addedRows.length === 0) return mergedBase;
  return [...addedRows, ...mergedBase];
}

/**
 * Calcula totais de alteracoes pendentes no rascunho local.
 *
 * @param {object} draft
 * @returns {{ added: number, updated: number, deleted: number, total: number, byEntity: Record<string, number> }}
 */
export function countDraftChanges(draft) {
  const byEntity = {};
  let added = 0;
  let updated = 0;
  let deleted = 0;

  CRUD_ENTITIES.forEach((entity) => {
    const slice = draft?.[entity] || {};
    const a = Array.isArray(slice.added) ? slice.added.length : 0;
    const deletedIds = new Set((slice.deleted || []).map(String));
    const addedIds = new Set((slice.added || []).map((item) => getEntityItemId(entity, item)));
    const u = Object.keys(slice.updated || {}).filter(
      (id) => !deletedIds.has(id) && !addedIds.has(id)
    ).length;
    const d = deletedIds.size;

    added += a;
    updated += u;
    deleted += d;
    byEntity[entity] = a + u + d;
  });

  return {
    added,
    updated,
    deleted,
    total: added + updated + deleted,
    byEntity,
  };
}

/**
 * Valida os campos obrigatorios do formulario CRUD por entidade.
 *
 * @param {'ativos'|'cursos'|'cadeias'} entity
 * @param {object} values
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateCrudForm(entity, values) {
  const errors = {};
  const v = values || {};

  if (entity === 'ativos') {
    if (!String(v.nome_ativo || '').trim()) {
      errors.nome_ativo = 'Informe o nome do ativo de CT&I.';
    }
    if (!String(v.tipo || '').trim()) {
      errors.tipo = 'Selecione a categoria institucional.';
    }
    if (!String(v.municipio || '').trim()) {
      errors.municipio = 'Informe o município de localização.';
    }
    if (v.latitude !== '' && v.latitude != null && Number.isNaN(Number(v.latitude))) {
      errors.latitude = 'Latitude inválida.';
    }
    if (v.longitude !== '' && v.longitude != null && Number.isNaN(Number(v.longitude))) {
      errors.longitude = 'Longitude inválida.';
    }
  } else if (entity === 'cursos') {
    if (!String(v.curso || '').trim()) {
      errors.curso = 'Informe o nome do curso.';
    }
    if (!String(v.entidade || '').trim()) {
      errors.entidade = 'Informe a instituição ofertante (IES).';
    }
    if (!String(v.categoria || '').trim()) {
      errors.categoria = 'Selecione a área ou tipologia do curso.';
    }
    if (!String(v.municipio || '').trim()) {
      errors.municipio = 'Informe o município do polo/campus.';
    }
  } else if (entity === 'cadeias') {
    if (!String(v.entidade || '').trim()) {
      errors.entidade = 'Informe o nome do arranjo ou indicação geográfica.';
    }
    if (!String(v.tipo || '').trim()) {
      errors.tipo = 'Selecione o tipo de cadeia produtiva.';
    }
    if (!String(v.municipio_sede || '').trim()) {
      errors.municipio_sede = 'Informe o município sede.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

