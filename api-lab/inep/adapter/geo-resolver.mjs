/**
 * api-lab/inep/adapter/geo-resolver.mjs
 * Módulo utilitário para enriquecimento territorial e geográfico de dados externos,
 * cruzando códigos IBGE, divisões da SEPLAN-BA (27 Territórios) e coordenadas cartográficas.
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizeName } from '../../ibge/normalize-municipios.mjs';
import { SEMIARIDO_MUNICIPIOS } from '../../../src/constants/semiarido.js';
import { MUNICIPIOS_COORDS } from '../../../src/data/municipiosCoords.js';
import { municipiosDB } from '../../../src/data/municipiosDB.js';

const ROOT_DIR = process.cwd();
const IBGE_MUNICIPIOS_FILE = path.resolve(ROOT_DIR, 'api-lab', 'ibge', 'output', 'municipios_ibge.json');

// Mapeamento dos 278 municípios do Semiárido
const semiaridoSet = new Set(SEMIARIDO_MUNICIPIOS.map((m) => normalizeName(m)));

// Mapeamento IBGE (codigo_ibge -> nome)
const ibgeByCode = new Map();
const ibgeByName = new Map();

if (fs.existsSync(IBGE_MUNICIPIOS_FILE)) {
  const ibgeList = JSON.parse(fs.readFileSync(IBGE_MUNICIPIOS_FILE, 'utf-8'));
  for (const item of ibgeList) {
    ibgeByCode.set(item.codigo_ibge, item);
    ibgeByName.set(normalizeName(item.municipio), item);
  }
}

// Mapeamento SECTI / SEPLAN (municipiosDB)
const dbById = new Map();
const dbByName = new Map();

for (const row of municipiosDB) {
  dbById.set(row.id_municipio, row);
  dbByName.set(normalizeName(row.nome_municipio), row);
}

/**
 * Resolve metadados territoriais para um município a partir do código IBGE ou do nome.
 * 
 * @param {object} params
 * @param {number} [params.codigo_ibge]
 * @param {string} [params.municipio]
 * @returns {{
 *   id_municipio: number,
 *   nome_municipio: string,
 *   id_territorio: number,
 *   territorio_identidade: string,
 *   codigo_ibge: number,
 *   semiarido: boolean,
 *   latitude: number | null,
 *   longitude: number | null
 * }}
 */
export function resolveMunicipio({ codigo_ibge, municipio }) {
  let matchedRow = null;
  let codIbge = Number(codigo_ibge) || null;

  // 1. Tenta pelo código IBGE mapeado
  if (codIbge && ibgeByCode.has(codIbge)) {
    const ibgeItem = ibgeByCode.get(codIbge);
    const norm = normalizeName(ibgeItem.municipio);
    matchedRow = dbByName.get(norm);
  }

  // 2. Se não encontrou, tenta pelo nome normalizado
  if (!matchedRow && municipio) {
    const norm = normalizeName(municipio);
    matchedRow = dbByName.get(norm);
    if (!codIbge && ibgeByName.has(norm)) {
      codIbge = ibgeByName.get(norm).codigo_ibge;
    }
  }

  const nomeFinal = matchedRow ? matchedRow.nome_municipio : (municipio || 'Não identificado');
  const normFinal = normalizeName(nomeFinal);

  // Coordenadas
  let lat = null;
  let lng = null;
  const coords = MUNICIPIOS_COORDS[normFinal] || MUNICIPIOS_COORDS[nomeFinal];
  if (Array.isArray(coords) && coords.length >= 2) {
    lat = coords[0];
    lng = coords[1];
  }

  return {
    id_municipio: matchedRow ? matchedRow.id_municipio : null,
    nome_municipio: nomeFinal,
    id_territorio: matchedRow ? matchedRow.id_territorio : null,
    territorio_identidade: matchedRow ? matchedRow.nome_territorio : null,
    codigo_ibge: codIbge,
    semiarido: semiaridoSet.has(normFinal),
    latitude: lat,
    longitude: lng,
  };
}
