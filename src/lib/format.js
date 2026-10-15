/**
 * Utilitários de formatação baseados em Intl para pt-BR.
 */

/**
 * Formata número inteiro com separador de milhar (ex: 14.141).
 * @param {number|string} value
 * @returns {string}
 */
export function formatInt(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';

  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}

/**
 * Formata número decimal em pt-BR (ex: 14,1).
 * @param {number|string} value
 * @param {number} [digits=1]
 * @returns {string}
 */
export function formatDecimal(value, digits = 1) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num);
}

/**
 * Formata valor percentual em pt-BR (ex: 15,4%).
 * Suporta valores já na escala 0-100 (padrão da aplicação) ou fração 0-1 com { isFraction: true }.
 * @param {number|string} value
 * @param {number} [digits=1]
 * @param {object} [options]
 * @param {boolean} [options.isFraction=false]
 * @returns {string}
 */
export function formatPercent(value, digits = 1, { isFraction = false } = {}) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';

  const val = isFraction ? num * 100 : num;
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(val);

  return `${formatted}%`;
}

/**
 * Formata número em notação compacta (ex: 14,1 mil, 1,2 mi).
 * @param {number|string} value
 * @returns {string}
 */
export function formatCompact(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';

  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Formata data em formato curto dd/mm/aaaa.
 * @param {Date|string|number} value
 * @returns {string}
 */
export function formatDate(value) {
  if (value === null || value === undefined || value === '') return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('pt-BR').format(date);
}
