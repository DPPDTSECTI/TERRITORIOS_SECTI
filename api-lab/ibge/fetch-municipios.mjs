/**
 * api-lab/ibge/fetch-municipios.mjs
 * Consulta a API oficial de localidades do IBGE para obter os municípios da Bahia (UF 29)
 * e grava o resultado normalizado em api-lab/ibge/output/municipios_ibge.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizeIbgeMunicipios } from './normalize-municipios.mjs';

export const ROOT_DIR = process.cwd();
export const IBGE_API_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/29/municipios';
export const OUTPUT_DIR = path.resolve(ROOT_DIR, 'api-lab', 'ibge', 'output');
export const OUTPUT_FILE = path.resolve(OUTPUT_DIR, 'municipios_ibge.json');

/**
 * Faz requisição HTTP à API oficial do IBGE e retorna a lista de municípios normalizada.
 * 
 * @param {object} options
 * @param {boolean} [options.saveToFile=true]
 * @returns {Promise<Array<{codigo_ibge: number, municipio: string, uf: string}>>}
 */
export async function fetchMunicipiosIbge({ saveToFile = true } = {}) {
  const startTime = Date.now();
  console.log(`[IBGE-FETCH] Consultando API oficial do IBGE: ${IBGE_API_URL}...`);

  const response = await fetch(IBGE_API_URL, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'api-lab-territorios-secti/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`[IBGE-FETCH] Falha na requisição ao IBGE: ${response.status} ${response.statusText}`);
  }

  const rawData = await response.json();
  const normalized = normalizeIbgeMunicipios(rawData);

  console.log(`[IBGE-FETCH] Recebidos e normalizados ${normalized.length} municípios em ${Date.now() - startTime}ms.`);

  if (saveToFile) {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
    console.log(`[IBGE-FETCH] Arquivo salvo com sucesso: ${OUTPUT_FILE}`);
  }

  return normalized;
}

// Execução direta via CLI (node api-lab/ibge/fetch-municipios.mjs)
if (process.argv[1] && process.argv[1].endsWith('fetch-municipios.mjs')) {
  fetchMunicipiosIbge()
    .then((data) => {
      console.log(`[IBGE-FETCH] Concluído com sucesso! Total de municípios: ${data.length}`);
    })
    .catch((err) => {
      console.error('[IBGE-FETCH] Erro:', err);
      process.exit(1);
    });
}
