/**
 * src/data/adapters/canonicalAdapter.js
 * ETAPA 4.0 — Adapter Canônico (Interface Única do Frontend)
 *
 * Composição final:
 *   SECTI/Supabase (174) + INEP em memória (50) = 224 unidades canônicas
 *
 * Esta é a ÚNICA interface que o DataContext e qualquer código de aplicação
 * devem usar. Nenhum componente React deve conhecer:
 *  - Supabase legado
 *  - INEP
 *  - shadow
 *  - classificações intermediárias
 *
 * Interface pública:
 *   getCanonicalUnits()        → 224 unidades com shape compatível com o frontend
 *   getCanonicalCourses()      → { presenciais, ead } do Supabase
 *   getCanonicalInstitutions() → metadados territoriais e de suporte
 *   getCanonicalTiposAtivos()  → tabela de tipos padronizada (canônica)
 */

import { getActiveDataSource, DATA_SOURCES } from './config.js';
import {
  fetchSectiUnits,
  fetchSectiCourses,
  fetchSectiMetadata,
} from './sectiAdapter.js';
import { fetchInepUnits } from './inepAdapter.js';
import { supabase } from '../../services/supabase.js';

// ─── Mapeamento semântico: tipo_unidade → shape compatível com o frontend ────

/**
 * IDs de tipo canônicos (fora do range 1-10 do Supabase legado).
 * Usados como id_tipo_ativo nos dados compostos.
 */
const TIPO_ATIVO_ID = Object.freeze({
  ensino_superior_presencial: 101,
  ensino_tecnico:             102,
  pesquisa_extensao:          103,
  administrativo:             104,
  ead:                        105,
  ambigua:                    106,
  inativa:                    107,
});

const TIPO_ATIVO_LABEL = Object.freeze({
  ensino_superior_presencial: 'Ensino Superior Presencial',
  ensino_tecnico:             'Ensino Técnico',
  pesquisa_extensao:          'Pesquisa e Extensão',
  administrativo:             'Administrativo',
  ead:                        'Polo EAD',
  ambigua:                    'Ensino Superior (Ambígua)',
  inativa:                    'Inativa',
});

/**
 * Tabela de tipos canônicos exposta ao frontend.
 * Substitui o tipo_ativos legado do Supabase no modo production-composed.
 */
export const CANONICAL_TIPOS_ATIVOS = Object.freeze(
  Object.entries(TIPO_ATIVO_ID).map(([tipo_unidade, id_tipo_ativo]) => ({
    id_tipo_ativo,
    tipo: TIPO_ATIVO_LABEL[tipo_unidade],
  }))
);

/**
 * Converte uma unidade canônica (schema unidade-canonica.schema.json)
 * para o shape compatível com os componentes React do frontend.
 */
function toFrontendShape(unit, fallbackIdxOffset = 0) {
  const tipoLabel = TIPO_ATIVO_LABEL[unit.tipo_unidade] || 'Ensino Superior Presencial';
  const idTipoAtivo = TIPO_ATIVO_ID[unit.tipo_unidade] || 101;

  return {
    // Preserva todos os campos canônicos
    ...unit,
    // Garante id_ativo nunca undefined (INEP usa null; legado usa número)
    id_ativo: unit.id_ativo ?? null,
    // Compatibilidade com o shape legado do frontend
    nome_ativo: unit.nome,
    tipo: tipoLabel,
    id_tipo_ativo: idTipoAtivo,
    semiarido: false,
  };
}

// ─── Cache em memória ────────────────────────────────────────────────────────

let _unitsCache    = null;
let _coursesCache  = null;
let _metaCache     = null;

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Retorna as 224 unidades canônicas compostas (SECTI 174 + INEP 50).
 * O shape é compatível com todos os componentes React existentes.
 *
 * Em modo "production" (puro Supabase sem INEP), retorna apenas os 174 legados.
 * Em modo "production-composed" ou "canonical", retorna os 224.
 *
 * @returns {Promise<Array>}
 */
export async function getCanonicalUnits() {
  if (_unitsCache) return _unitsCache;

  const source = getActiveDataSource();

  // Modo shadow: busca o endpoint shadow (apenas DEV)
  if (source === DATA_SOURCES.SHADOW && import.meta.env.DEV) {
    try {
      const res = await fetch('/api/shadow-data/campi');
      const json = await res.json();
      _unitsCache = (json?.dados || []).map((u, i) => toFrontendShape(u, i));
      return _unitsCache;
    } catch (err) {
      console.error('[canonicalAdapter] shadow fallback erro:', err);
    }
  }

  // Modo canonical puro (apenas DEV)
  if (source === DATA_SOURCES.CANONICAL && import.meta.env.DEV) {
    try {
      const res = await fetch('/api/shadow-data/canonical');
      const json = await res.json();
      _unitsCache = (json?.dados || []).map((u, i) => toFrontendShape(u, i));
      return _unitsCache;
    } catch (err) {
      console.error('[canonicalAdapter] canonical fallback erro:', err);
    }
  }

  // Modo production-composed (padrão de produção e DEV)
  if (
    source === DATA_SOURCES.PRODUCTION_COMPOSED ||
    source === DATA_SOURCES.CANONICAL
  ) {
    try {
      const [sectiUnits, inepUnits] = await Promise.all([
        fetchSectiUnits(),
        fetchInepUnits(),
      ]);

      // Compõe: 174 legados + 50 INEP
      // Os legados já têm id_tipo_ativo no schema do Supabase;
      // precisamos normalizar para o schema canônico via toFrontendShape
      const composed = [
        ...sectiUnits.map((u, i) => toFrontendShape({
          ...u,
          // Mapeia campos legados → canônicos
          nome:               u.nome_ativo || u.nome || '',
          municipio:          u.municipio  || '',
          latitude:           u.latitude   || u.lat  || 0,
          longitude:          u.longitude  || u.lng  || 0,
          id_territorio:      u.id_territorio || 0,
          territorio_identidade: u.territorio_identidade || '',
          codigo_ibge:        u.codigo_ibge || 0,
          presenca_fisica:    u.presenca_fisica ?? true,
          oferta_presencial:  u.oferta_presencial ?? true,
          tipo_unidade:       _inferTipoUnidade(u),
          origem:             'secti',
        }, i)),
        ...inepUnits.map((u, i) => toFrontendShape(u, 8000 + i)),
      ];

      _unitsCache = composed;
      return _unitsCache;
    } catch (err) {
      console.error('[canonicalAdapter] Erro ao compor unidades:', err);
    }
  }

  // Fallback: produção pura (174 legados sem INEP)
  const units = await fetchSectiUnits();
  _unitsCache = units.map((u, i) => toFrontendShape({
    ...u,
    nome:       u.nome_ativo || u.nome || '',
    municipio:  u.municipio  || '',
    latitude:   u.latitude   || 0,
    longitude:  u.longitude  || 0,
    tipo_unidade: _inferTipoUnidade(u),
    origem:     'secti',
  }, i));
  return _unitsCache;
}

/**
 * Retorna os cursos separados por modalidade.
 * @returns {Promise<{ presenciais: Array, ead: Array }>}
 */
export async function getCanonicalCourses() {
  if (_coursesCache) return _coursesCache;
  _coursesCache = await fetchSectiCourses();
  return _coursesCache;
}

/**
 * Retorna todos os metadados de suporte (territórios, cadeias, municípios, etc.)
 * com recálculo de qtd_cursos_cti por cursos presenciais reais.
 * @returns {Promise<Object>}
 */
export async function getCanonicalInstitutions() {
  if (_metaCache) return _metaCache;

  const [meta, courses] = await Promise.all([
    fetchSectiMetadata(),
    getCanonicalCourses(),
  ]);

  // Recalcula contagem de cursos presenciais por território
  const contagemCursos = {};
  courses.presenciais.forEach(c => {
    if (c.id_territorio) {
      contagemCursos[c.id_territorio] = (contagemCursos[c.id_territorio] || 0) + 1;
    }
  });

  const statsTratados = meta.stats.map(t => {
    let ifdmFormatado = null;
    if (t.media_ifdm) {
      const match = String(t.media_ifdm).match(/^-?\d+(?:\.\d{0,3})?/);
      ifdmFormatado = match ? Number(match[0]).toFixed(3) : null;
    }
    return {
      ...t,
      media_ifdm: ifdmFormatado,
      qtd_cursos_cti: contagemCursos[t.id_territorio] || 0,
    };
  });

  _metaCache = { ...meta, stats: statsTratados };
  return _metaCache;
}

/**
 * Retorna a tabela de tipos de ativos canônica.
 * Em modo production-composed, usa CANONICAL_TIPOS_ATIVOS (IDs 101-107).
 * Em modo production puro, retorna os tipos legados do Supabase.
 * @returns {Promise<Array>}
 */
export async function getCanonicalTiposAtivos() {
  const source = getActiveDataSource();
  if (source === DATA_SOURCES.PRODUCTION) {
    const meta = await fetchSectiMetadata();
    return meta.tiposAtivos;
  }
  return [...CANONICAL_TIPOS_ATIVOS];
}

/**
 * Limpa todos os caches em memória (útil para testes e hot-reload).
 */
export function clearCanonicalCache() {
  _unitsCache   = null;
  _coursesCache = null;
  _metaCache    = null;
}

// ─── Helpers privados ─────────────────────────────────────────────────────────

const IDS_EAD      = new Set([23, 38, 64, 92, 112, 158]);
const IDS_TECNICOS = new Set([5, 27, 58, 71, 83, 174, 188]);
const IDS_PESQUISA = new Set([28, 88]);
const ID_REITORIA  = 132;
const ID_INATIVA   = 164;
const IDS_AMBIGUOS = new Set([1, 19, 76]);

/**
 * Infere o tipo_unidade canônico a partir de um registro legado do Supabase.
 * Preserva a mesma heurística validada no production-adapter.mjs da api-lab.
 */
function _inferTipoUnidade(u) {
  // Se o registro já traz tipo_unidade canônico (composto pelo adapter)
  if (u.tipo_unidade && TIPO_ATIVO_ID[u.tipo_unidade]) {
    return u.tipo_unidade;
  }
  const id = u.id_ativo;
  if (id === ID_INATIVA)            return 'inativa';
  if (id === ID_REITORIA)           return 'administrativo';
  if (IDS_EAD.has(id))             return 'ead';
  if (IDS_PESQUISA.has(id))        return 'pesquisa_extensao';
  if (IDS_TECNICOS.has(id))        return 'ensino_tecnico';
  if (IDS_AMBIGUOS.has(id))        return 'ambigua';
  // Fallback por id_tipo_ativo legado
  const legadoId = u.id_tipo_ativo;
  if (legadoId === 7)              return 'ensino_tecnico';
  return 'ensino_superior_presencial';
}
