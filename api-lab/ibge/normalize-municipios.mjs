/**
 * api-lab/ibge/normalize-municipios.mjs
 * Módulo de normalização de dados do IBGE e padronização de strings para comparação.
 */

/**
 * Normaliza o nome de um município para fins de comparação:
 * - Remove acentuação (NFD)
 * - Converte para caixa baixa (lowercase)
 * - Substitui caracteres não alfanuméricos por espaço
 * - Remove espaços duplicados e faz trim
 * 
 * Reutiliza o padrão consolidado em src/utils/normalization.js
 * 
 * @param {string} value
 * @returns {string}
 */
export function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converte a lista bruta retornada pela API de localidades do IBGE
 * no formato padrão exigido pelo laboratório:
 * [
 *   {
 *     "codigo_ibge": 2900108,
 *     "municipio": "Abaíra",
 *     "uf": "BA"
 *   }
 * ]
 * 
 * @param {Array<object>} rawList
 * @returns {Array<{codigo_ibge: number, municipio: string, uf: string}>}
 */
export function normalizeIbgeMunicipios(rawList) {
  if (!Array.isArray(rawList)) {
    throw new TypeError('O parâmetro rawList deve ser um Array.');
  }

  return rawList
    .map(item => {
      const codigo_ibge = Number(item.id);
      const municipio = String(item.nome || '').trim();
      const uf =
        item.microrregiao?.mesorregiao?.UF?.sigla ||
        item['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla ||
        'BA';

      return {
        codigo_ibge,
        municipio,
        uf,
      };
    })
    .sort((a, b) => a.municipio.localeCompare(b.municipio, 'pt-BR'));
}
