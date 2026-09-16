/**
 * src/data/adapters/inepAdapter.js
 * ETAPA 4.0 — Adapter INEP
 *
 * Gerencia os 50 novos registros INEP presenciais, mantidos EXCLUSIVAMENTE em memória.
 * Nenhum registro é inserido no Supabase.
 *
 * GARANTIAS:
 *  - id_ativo === null para todos os registros INEP
 *  - origem === "inep" para todos os registros INEP
 *  - Nenhuma chamada de escrita ao banco
 *
 * Fonte em DEV: /api/shadow-data/composed  (endpoint do vite.config.js)
 * Fonte em PROD: /composed-production-canonical.json (asset estático copiado no build)
 *
 * Nota: O arquivo composed-production-canonical.json contém os 224 registros compostos.
 * Este adapter filtra somente os 50 com origem === "inep".
 */

// URL base para o endpoint de dados compostos
const COMPOSED_ENDPOINT_DEV  = '/api/shadow-data/composed';
const COMPOSED_ENDPOINT_PROD = '/composed-production-canonical.json';

let _cache = null;

/**
 * Carrega os 50 registros INEP.
 * Utiliza cache em memória para evitar múltiplas requisições.
 * @returns {Promise<Array>} 50 unidades canônicas com id_ativo=null e origem="inep"
 */
export async function fetchInepUnits() {
  if (_cache) return _cache;

  const endpoint = import.meta.env.DEV ? COMPOSED_ENDPOINT_DEV : COMPOSED_ENDPOINT_PROD;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar dados compostos INEP`);
    const json = await res.json();
    const todos = json?.dados || [];
    const inepUnits = todos.filter(u => u.origem === 'inep');

    // Garantia explícita: id_ativo deve ser null para todos os registros INEP
    _cache = inepUnits.map(u => ({
      ...u,
      id_ativo: null,
      origem: 'inep',
    }));

    return _cache;
  } catch (err) {
    console.error('[inepAdapter] Falha ao carregar unidades INEP:', err);
    return [];
  }
}

/**
 * Limpa o cache em memória (útil para testes).
 */
export function clearInepCache() {
  _cache = null;
}
