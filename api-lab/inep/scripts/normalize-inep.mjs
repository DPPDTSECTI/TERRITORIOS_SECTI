/**
 * api-lab/inep/scripts/normalize-inep.mjs
 * Normaliza os microdados brutos do Censo do Ensino Superior do INEP (Bahia)
 * para a estrutura padrão especificada no laboratório.
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizeName } from '../../ibge/normalize-municipios.mjs';

const ROOT_DIR = process.cwd();
const RAW_DIR = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'raw');
const NORMALIZED_DIR = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'normalized');

export const INPUT_CURSOS_RAW = path.resolve(RAW_DIR, 'inep_ba_cursos_raw.json');
export const OUTPUT_NORMALIZED_FILE = path.resolve(NORMALIZED_DIR, 'cursos_inep_ba.json');

/**
 * Tabelas de decodificação conforme dicionário oficial de dados do INEP.
 */
export const MAP_ORGANIZACAO_ACADEMICA = {
  1: 'Universidade',
  2: 'Centro Universitário',
  3: 'Faculdade',
  4: 'Instituto Federal',
  5: 'Centro Federal de Educação Tecnológica',
};

export const MAP_CATEGORIA_ADMINISTRATIVA = {
  1: 'Pública Federal',
  2: 'Pública Estadual',
  3: 'Pública Municipal',
  4: 'Privada com fins lucrativos',
  5: 'Privada sem fins lucrativos',
  7: 'Especial',
};

export const MAP_GRAU_ACADEMICO = {
  1: 'Bacharelado',
  2: 'Licenciatura',
  3: 'Tecnológico',
  4: 'Bacharelado e Licenciatura',
};

export const MAP_MODALIDADE = {
  1: 'Presencial',
  2: 'A distância',
};

/**
 * Normaliza um registro bruto do INEP para a estrutura especificada.
 * 
 * @param {object} rawItem
 * @returns {object}
 */
export function normalizeCursoItem(rawItem) {
  const codigo_ibge = Number(rawItem.codigo_municipio);
  const municipio = String(rawItem.municipio || '').trim();
  const instituicao = String(rawItem.nome_ies || '').trim();
  const sigla_instituicao = rawItem.sigla_ies ? String(rawItem.sigla_ies).trim() : null;

  const tipo_instituicao = MAP_ORGANIZACAO_ACADEMICA[rawItem.tipo_organizacao_academica] || 'Outros';
  const categoria_administrativa = MAP_CATEGORIA_ADMINISTRATIVA[rawItem.categoria_administrativa] || 'Outros';

  const curso = String(rawItem.nome_curso || '').trim();
  const tipo_curso = MAP_GRAU_ACADEMICO[rawItem.grau_academico] || 'Não informado';
  const modalidade = MAP_MODALIDADE[rawItem.modalidade_ensino] || 'Presencial';

  return {
    codigo_ibge,
    municipio,
    instituicao,
    sigla_instituicao,
    tipo_instituicao,
    categoria_administrativa,
    curso,
    tipo_curso,
    modalidade,
    area_geral: rawItem.area_geral_cine || 'Não informada',
    rotulo_cine: rawItem.rotulo_cine || null,
    codigo_curso: rawItem.codigo_curso,
    codigo_ies: rawItem.codigo_ies,
    ano_censo: rawItem.ano_censo || 2023,
    uf: 'BA',
  };
}

/**
 * Executa a normalização dos cursos brutos do INEP da Bahia.
 * 
 * @param {object} options
 * @param {boolean} [options.saveToFile=true]
 * @returns {Array<object>}
 */
export function normalizeInepCursos({ saveToFile = true } = {}) {
  if (!fs.existsSync(INPUT_CURSOS_RAW)) {
    throw new Error(`[INEP-NORMALIZE] Arquivo bruto não encontrado em: ${INPUT_CURSOS_RAW}. Execute 'npm run api:inep:extract' primeiro.`);
  }

  console.log(`[INEP-NORMALIZE] Lendo dados brutos de: ${INPUT_CURSOS_RAW}...`);
  const rawPayload = JSON.parse(fs.readFileSync(INPUT_CURSOS_RAW, 'utf-8'));
  const rawList = rawPayload.dados || [];

  console.log(`[INEP-NORMALIZE] Normalizando ${rawList.length} registros...`);
  const normalized = rawList.map(normalizeCursoItem);

  if (saveToFile) {
    if (!fs.existsSync(NORMALIZED_DIR)) {
      fs.mkdirSync(NORMALIZED_DIR, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_NORMALIZED_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
    console.log(`[INEP-NORMALIZE] Arquivo normalizado gravado com sucesso: ${OUTPUT_NORMALIZED_FILE}`);
  }

  return normalized;
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('normalize-inep.mjs')) {
  try {
    const data = normalizeInepCursos();
    console.log(`\n[INEP-NORMALIZE] Concluído com sucesso! Total de registros normalizados: ${data.length}\n`);
  } catch (err) {
    console.error('[INEP-NORMALIZE] Erro:', err);
    process.exit(1);
  }
}
