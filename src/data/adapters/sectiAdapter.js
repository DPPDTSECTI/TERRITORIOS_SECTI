/**
 * src/data/adapters/sectiAdapter.js
 * ETAPA 4.0 — Adapter SECTI/Supabase
 *
 * Encapsula todo o acesso ao Supabase legado.
 * Nenhum componente React ou outro adapter deve importar `supabase` diretamente.
 *
 * GARANTIA: Nenhuma mutação (INSERT/UPDATE/DELETE) é executada aqui.
 * Somente operações de leitura (SELECT) são permitidas.
 */

import { supabase } from '../../services/supabase';
import { getTextoReferencia } from '../referenciasDB';

// ─── Constantes de paginação ─────────────────────────────────────────────────
const RANGE_ATIVOS   = [0, 3000];
const RANGE_CURSOS   = [0, 3000];
const RANGE_CADEIAS  = [0, 4999];
const RANGE_LISTAS   = [0, 1000];

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Busca os 174 registros de ativos/campi do Supabase legado.
 * @returns {Promise<Array>} lista_ativos_cti
 */
export async function fetchSectiUnits() {
  const { data, error } = await supabase
    .from('lista_ativos_cti')
    .select('*')
    .range(...RANGE_ATIVOS);
  if (error) console.error('[sectiAdapter] lista_ativos_cti error:', error);
  return data || [];
}

/**
 * Busca os cursos presenciais e EAD do Supabase.
 * Retorna objeto separado por modalidade.
 * @returns {Promise<{ presenciais: Array, ead: Array }>}
 */
export async function fetchSectiCourses() {
  const [cursosRes, cursosRawRes] = await Promise.all([
    supabase.from('lista_cursos_cti').select('*').range(...RANGE_CURSOS),
    supabase.from('cursos').select('id_curso, ead').range(...RANGE_CURSOS),
  ]);
  if (cursosRes.error) console.error('[sectiAdapter] lista_cursos_cti error:', cursosRes.error);

  const eadMap = new Map(
    (cursosRawRes?.data || []).map(r => [r.id_curso, Boolean(r.ead)])
  );
  const todos = (cursosRes?.data || []).map(c => ({
    ...c,
    ead: eadMap.get(c.id) ?? Boolean(c.ead) ?? false,
  }));

  return {
    presenciais: todos.filter(c => c.ead === false),
    ead: todos.filter(c => c.ead === true),
  };
}

/**
 * Busca os metadados de suporte do Supabase:
 * stats_ti, distribuicao_cadeias, lista_cadeia_produtiva,
 * lista_municipioxterritorio, tipo_ativos, tipo_cursos,
 * tipo_cadeia, referencias, firjan
 * @returns {Promise<Object>}
 */
export async function fetchSectiMetadata() {
  const [
    statsRes,
    distCadeiasRes,
    listaCadeiasRes,
    munTerRes,
    tAtivosRes,
    tCursosRes,
    tCadeiasRes,
    referenciasRes,
    firjanRes,
  ] = await Promise.all([
    supabase.from('stats_ti').select('*'),
    supabase.from('distribuicao_cadeias').select('*').range(...RANGE_CADEIAS),
    supabase.from('lista_cadeia_produtiva').select('*').range(...RANGE_LISTAS),
    supabase.from('lista_municipioxterritorio').select('*').range(...RANGE_LISTAS),
    supabase.from('tipo_ativos').select('*'),
    supabase.from('tipo_cursos').select('*'),
    supabase.from('tipo_cadeia').select('*'),
    supabase.from('referencias').select('id_referencia, titulo_referencia, texto_referencia, url_referencia'),
    supabase.from('firjan').select('*').range(...RANGE_LISTAS),
  ]);

  if (distCadeiasRes.error) console.error('[sectiAdapter] distribuicao_cadeias error:', distCadeiasRes.error);
  if (munTerRes.error)       console.error('[sectiAdapter] lista_municipioxterritorio error:', munTerRes.error);
  if (firjanRes.error)       console.error('[sectiAdapter] firjan error:', firjanRes.error);

  // Enriquecimento de referências para cadeias potenciais
  const refMapByUrl = new Map();
  (referenciasRes?.data || []).forEach(r => {
    if (r.url_referencia && r.texto_referencia) {
      refMapByUrl.set(String(r.url_referencia).trim().toLowerCase(), r.texto_referencia);
    }
  });
  const getTextoRef = (fonte, entidade) => {
    if (fonte) {
      const direct = refMapByUrl.get(String(fonte).trim().toLowerCase());
      if (direct) return direct;
    }
    return getTextoReferencia(fonte, entidade);
  };

  const listaCadeiasTratadas = (listaCadeiasRes?.data || []).map(c => {
    const isPotencial = (c.id_tipo_cadeia === 3) || String(c.tipo || '').toLowerCase().includes('potencial');
    return { ...c, texto_referencia: isPotencial ? getTextoRef(c.fonte, c.entidade) : null };
  });
  const distCadeiasTratadas = (distCadeiasRes?.data || []).map(c => {
    const isPotencial = (c.id_tipo_cadeia === 3) || String(c.nome_tipo || c.tipo || '').toLowerCase().includes('potencial');
    return { ...c, texto_referencia: isPotencial ? getTextoRef(c.fonte, c.entidade) : null };
  });

  return {
    stats:               statsRes?.data || [],
    distribuicaoCadeias: distCadeiasTratadas,
    listaCadeias:        listaCadeiasTratadas,
    municipiosTerritorios: munTerRes?.data || [],
    tiposAtivos:         tAtivosRes?.data || [],
    tiposCursos:         tCursosRes?.data || [],
    tiposCadeias:        tCadeiasRes?.data || [],
    firjanData:          firjanRes?.data || [],
  };
}
