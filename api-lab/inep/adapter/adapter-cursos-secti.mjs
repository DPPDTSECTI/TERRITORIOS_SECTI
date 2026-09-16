/**
 * api-lab/inep/adapter/adapter-cursos-secti.mjs
 * Camada de adaptação que transforma os cursos do INEP para o schema estrutural
 * esperado pelo frontend do TERRITÓRIOS SECTI (equivalente a lista_cursos_cti).
 */

import fs from 'node:fs';
import path from 'node:path';
import { resolveMunicipio } from './geo-resolver.mjs';
import { normalizeName } from '../../ibge/normalize-municipios.mjs';

const ROOT_DIR = process.cwd();
const NORMALIZED_FILE = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'normalized', 'cursos_inep_ba.json');
const CAMPI_SNAPSHOT_FILE = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'raw', 'secti_campi_atual.json');
const OUTPUT_FILE = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'output', 'cursos_secti_inep.json');

// Mapeamento oficial das 5 áreas estratégicas de CT&I da SECTI
export const MAP_AREAS_CTI_SECTI = {
  'Agricultura, silvicultura, pesca e veterinária': {
    id_tipo_curso: 1,
    categoria: 'Agricultura, silvicultura, pesca e veterinária',
  },
  'Ciências naturais, matemática e estatística': {
    id_tipo_curso: 2,
    categoria: 'Ciências naturais, matemática e estatística',
  },
  'Computação e Tecnologias da Informação e Comunicação (TIC)': {
    id_tipo_curso: 3,
    categoria: 'Computação e Tecnologias da Informação e Comunicação (TIC)',
  },
  'Engenharia, produção e construção': {
    id_tipo_curso: 4,
    categoria: 'Engenharia, produção e construção',
  },
  'Saúde e bem-estar': {
    id_tipo_curso: 5,
    categoria: 'Saúde e bem-estar',
  },
};

/**
 * Converte um item de curso do INEP no modelo de dados do dashboard da SECTI.
 */
export function adaptCursoToSectiModel(inepCurso, campiMap = new Map()) {
  const geo = resolveMunicipio({
    codigo_ibge: inepCurso.codigo_ibge,
    municipio: inepCurso.municipio,
  });

  const ctiInfo = MAP_AREAS_CTI_SECTI[inepCurso.area_geral] || null;
  const isCti = Boolean(ctiInfo);

  // Busca ID do ativo de campi caso exista na localidade
  const keyCampi = `${normalizeName(inepCurso.sigla_instituicao || inepCurso.instituicao)}_${normalizeName(geo.nome_municipio)}`;
  const idAtivo = campiMap.get(keyCampi) || null;

  return {
    id: inepCurso.codigo_curso,
    curso: inepCurso.curso,
    ead: inepCurso.modalidade === 'A distância',
    id_ativo: idAtivo,
    entidade: inepCurso.instituicao,
    sigla: inepCurso.sigla_instituicao || inepCurso.instituicao.substring(0, 10).toUpperCase(),
    id_municipio: geo.id_municipio,
    municipio: geo.nome_municipio,
    id_territorio: geo.id_territorio,
    territorio_identidade: geo.territorio_identidade,
    id_tipo_curso: ctiInfo ? ctiInfo.id_tipo_curso : null,
    categoria: ctiInfo ? ctiInfo.categoria : inepCurso.area_geral,
    titulo_referencia: 'INEP Censo da Educação Superior 2023',
    texto_referencia: 'Microdados oficiais do Censo da Educação Superior 2023 - MEC/INEP',
    url_referencia: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior',
    // Metadados adicionais do INEP preservados para auditoria
    _inep: {
      codigo_curso: inepCurso.codigo_curso,
      codigo_ies: inepCurso.codigo_ies,
      tipo_curso: inepCurso.tipo_curso,
      modalidade_original: inepCurso.modalidade,
      categoria_administrativa: inepCurso.categoria_administrativa,
      tipo_instituicao: inepCurso.tipo_instituicao,
      rotulo_cine: inepCurso.rotulo_cine,
      recorte_cti: isCti,
    },
  };
}

/**
 * Executa o adaptador de cursos e grava o snapshot.
 */
export function adaptCursos({ saveToFile = true } = {}) {
  if (!fs.existsSync(NORMALIZED_FILE)) {
    throw new Error(`Arquivo normalizado do INEP não encontrado em: ${NORMALIZED_FILE}`);
  }

  const inepCursos = JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf-8'));

  // Mapa de campi existentes para associar id_ativo
  const campiMap = new Map();
  if (fs.existsSync(CAMPI_SNAPSHOT_FILE)) {
    const campiList = JSON.parse(fs.readFileSync(CAMPI_SNAPSHOT_FILE, 'utf-8')).dados || [];
    for (const c of campiList) {
      const k = `${normalizeName(c.sigla || c.nome_ativo)}_${normalizeName(c.municipio)}`;
      campiMap.set(k, c.id_ativo);
    }
  }

  console.log(`[ADAPTER-CURSOS] Adaptando ${inepCursos.length} cursos do INEP para o modelo SECTI...`);
  const adapted = inepCursos.map((c) => adaptCursoToSectiModel(c, campiMap));

  const ctiPresencial = adapted.filter((c) => c._inep.recorte_cti && !c.ead);
  const ctiTotal = adapted.filter((c) => c._inep.recorte_cti);

  const payload = {
    metadados: {
      adaptado_em: new Date().toISOString(),
      fonte: 'INEP Censo da Educação Superior 2023',
      total_geral_adaptado: adapted.length,
      total_presencial_cti: ctiPresencial.length,
      total_geral_cti: ctiTotal.length,
    },
    dados: adapted,
  };

  if (saveToFile) {
    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`[ADAPTER-CURSOS] Snapshot salvo com sucesso em: ${OUTPUT_FILE}`);
  }

  return payload;
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('adapter-cursos-secti.mjs')) {
  try {
    const res = adaptCursos();
    console.log(`[ADAPTER-CURSOS] Concluído! Total adaptado: ${res.metadados.total_geral_adaptado} (Presenciais CT&I: ${res.metadados.total_presencial_cti})`);
  } catch (err) {
    console.error('[ADAPTER-CURSOS] Erro:', err);
    process.exit(1);
  }
}
