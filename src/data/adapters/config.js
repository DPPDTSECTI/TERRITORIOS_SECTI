/**
 * src/data/adapters/config.js
 * ETAPA 4.0 — Configuração Central da Fonte de Dados
 *
 * Em produção: DATA_SOURCE é sempre "production-composed"
 * (Supabase legado 174 + INEP 50 = 224 unidades canônicas)
 *
 * Em DEV: pode ser sobrescrito por VITE_DATA_SOURCE ou localStorage
 * Valores suportados: production | shadow | canonical | production-composed
 */

const IS_DEV = import.meta.env.DEV;

/**
 * Fontes de dados suportadas
 */
export const DATA_SOURCES = Object.freeze({
  PRODUCTION: 'production',
  SHADOW: 'shadow',
  CANONICAL: 'canonical',
  PRODUCTION_COMPOSED: 'production-composed',
});

/**
 * Fonte ativa. Em produção, sempre "production-composed".
 * Em DEV, a prioridade é:
 *   1. localStorage('@Secti_DataSource')
 *   2. VITE_DATA_SOURCE
 *   3. 'production-composed' (padrão)
 */
export function getActiveDataSource() {
  if (!IS_DEV) {
    return DATA_SOURCES.PRODUCTION_COMPOSED;
  }
  const fromLocalStorage = localStorage.getItem('@Secti_DataSource');
  if (fromLocalStorage && Object.values(DATA_SOURCES).includes(fromLocalStorage)) {
    return fromLocalStorage;
  }
  const fromEnv = import.meta.env.VITE_DATA_SOURCE;
  if (fromEnv && Object.values(DATA_SOURCES).includes(fromEnv)) {
    return fromEnv;
  }
  return DATA_SOURCES.PRODUCTION_COMPOSED;
}

export const DATA_SOURCE = getActiveDataSource();
