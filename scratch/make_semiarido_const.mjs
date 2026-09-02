import fs from 'fs';

const rawMuns = JSON.parse(fs.readFileSync('./scratch/semiarido_muns.json', 'utf8'));

const code = `// src/constants/semiarido.js
/**
 * Lista oficial dos 278 municípios da Bahia pertencentes à delimitação do Semiárido (SUDENE / Governo da Bahia).
 * Total de municípios no estado: 417.
 * Cobertura territorial do Semiárido: ~66.7% dos municípios.
 */

export const SEMIARIDO_TOTAL_MUNICIPIOS = 278;
export const BAHIA_TOTAL_MUNICIPIOS = 417;

export const SEMIARIDO_MUNICIPIOS = ${JSON.stringify(rawMuns, null, 2)};

export function normalizeMunicipioName(value) {
  if (!value) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

// Set pré-computado para busca O(1)
export const SEMIARIDO_MUNICIPIOS_NORMALIZADOS = new Set(
  SEMIARIDO_MUNICIPIOS.map(normalizeMunicipioName)
);

// Dicionário de correções e sinônimos conhecidos
const CORRECOES_SEMIARIDO = {
  'dias davila': 'dias d avila',
  'santa teresinha': 'santa terezinha',
  'camaca': 'camacan',
  'xique xique': 'xiquexique',
  'muquem de sao francisco': 'muquem do sao francisco'
};

/**
 * Verifica se um município faz parte do Semiárido Baiano
 * @param {string} nomeMunicipio
 * @returns {boolean}
 */
export function isMunicipioSemiarido(nomeMunicipio) {
  if (!nomeMunicipio) return false;
  let norm = normalizeMunicipioName(nomeMunicipio);
  norm = CORRECOES_SEMIARIDO[norm] || norm;
  return SEMIARIDO_MUNICIPIOS_NORMALIZADOS.has(norm);
}
`;

fs.writeFileSync('./src/constants/semiarido.js', code, 'utf8');
console.log('src/constants/semiarido.js created successfully!');
