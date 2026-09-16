/**
 * api-lab/inep/adapter/adapter-campi-secti.mjs
 * Camada de adaptação que consolida a presença presencial de Instituições de Ensino Superior
 * no Estado da Bahia a partir do Censo do INEP no schema de lista_ativos_cti (tipo=Campi*).
 */

import fs from 'node:fs';
import path from 'node:path';
import { resolveMunicipio } from './geo-resolver.mjs';
import { normalizeName } from '../../ibge/normalize-municipios.mjs';

const ROOT_DIR = process.cwd();
const NORMALIZED_FILE = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'normalized', 'cursos_inep_ba.json');
const CAMPI_SNAPSHOT_FILE = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'raw', 'secti_campi_atual.json');
const OUTPUT_FILE = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'output', 'campi_secti_inep.json');

/**
 * Determina a tipologia do campus para o modelo SECTI.
 */
export function determineCampiType(categoriaAdmin, tipoInstituicao, sigla = '') {
  const normCat = normalizeName(categoriaAdmin);
  const normTipo = normalizeName(tipoInstituicao);
  const normSigla = normalizeName(sigla);

  if (normTipo.includes('instituto federal') || normSigla.includes('ifba') || normSigla.includes('ifbaiano')) {
    return {
      tipo: 'Campi Instituto Federal',
      id_tipo_ativo: 5,
    };
  }

  if (normCat.includes('estadual')) {
    return {
      tipo: 'Campi Universidade Pública - Estadual',
      id_tipo_ativo: 7,
    };
  }

  if (normCat.includes('federal')) {
    return {
      tipo: 'Campi Universidade Pública - Federal',
      id_tipo_ativo: 8,
    };
  }

  return {
    tipo: 'Campi Universidade Privada',
    id_tipo_ativo: 9,
  };
}

/**
 * Executa a adaptação dos campi derivados do INEP para o modelo SECTI.
 */
export function adaptCampi({ saveToFile = true } = {}) {
  if (!fs.existsSync(NORMALIZED_FILE)) {
    throw new Error(`Arquivo normalizado do INEP não encontrado em: ${NORMALIZED_FILE}`);
  }

  const inepCursos = JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf-8'));

  // Carrega campi atuais da SECTI para reaproveitar coordenadas precisas e ID do ativo quando disponível
  const existingCampiMap = new Map();
  if (fs.existsSync(CAMPI_SNAPSHOT_FILE)) {
    const existing = JSON.parse(fs.readFileSync(CAMPI_SNAPSHOT_FILE, 'utf-8')).dados || [];
    for (const c of existing) {
      const k = `${normalizeName(c.sigla || c.nome_ativo)}_${normalizeName(c.municipio)}`;
      existingCampiMap.set(k, c);
    }
  }

  // Agrupa cursos presenciais por IES + Município (ofertas físicas presenciais)
  const presenciais = inepCursos.filter((c) => c.modalidade === 'Presencial');
  const groupedPresenciais = new Map();

  for (const c of presenciais) {
    const key = `${c.codigo_ies}_${c.codigo_ibge}`;
    if (!groupedPresenciais.has(key)) {
      groupedPresenciais.set(key, {
        codigo_ies: c.codigo_ies,
        codigo_ibge: c.codigo_ibge,
        municipio: c.municipio,
        instituicao: c.instituicao,
        sigla: c.sigla_instituicao,
        tipo_instituicao: c.tipo_instituicao,
        categoria_administrativa: c.categoria_administrativa,
        cursos: [],
      });
    }
    groupedPresenciais.get(key).cursos.push(c.curso);
  }

  console.log(`[ADAPTER-CAMPI] Unidades presenciais identificadas no INEP: ${groupedPresenciais.size}`);

  const adaptedCampi = [];
  let syntheticIdCounter = 10000;

  for (const group of groupedPresenciais.values()) {
    const geo = resolveMunicipio({
      codigo_ibge: group.codigo_ibge,
      municipio: group.municipio,
    });

    const typeInfo = determineCampiType(
      group.categoria_administrativa,
      group.tipo_instituicao,
      group.sigla
    );

    const keyMatch = `${normalizeName(group.sigla || group.instituicao)}_${normalizeName(geo.nome_municipio)}`;
    const existingMatch = existingCampiMap.get(keyMatch);

    const idAtivo = existingMatch ? existingMatch.id_ativo : syntheticIdCounter++;
    const latitude = existingMatch?.latitude ?? geo.latitude;
    const longitude = existingMatch?.longitude ?? geo.longitude;
    const rnp = existingMatch?.rnp ?? false;

    adaptedCampi.push({
      id_ativo: idAtivo,
      nome_ativo: group.sigla
        ? `${group.instituicao} (${group.sigla}) - Campus ${geo.nome_municipio}`
        : `${group.instituicao} - Campus ${geo.nome_municipio}`,
      sigla: group.sigla || group.instituicao.substring(0, 10).toUpperCase(),
      rnp,
      id_tipo_ativo: typeInfo.id_tipo_ativo,
      tipo: typeInfo.tipo,
      id_municipio: geo.id_municipio,
      codigo_ibge: geo.codigo_ibge,
      municipio: geo.nome_municipio,
      semiarido: geo.semiarido,
      latitude,
      longitude,
      id_territorio: geo.id_territorio,
      territorio_identidade: geo.territorio_identidade,
      titulo_referencia: 'INEP Censo da Educação Superior 2023',
      texto_referencia: 'Microdados oficiais do Censo da Educação Superior 2023 - MEC/INEP',
      url_referencia: 'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-da-educacao-superior',
      _inep: {
        codigo_ies: group.codigo_ies,
        codigo_ibge: group.codigo_ibge,
        tipo_instituicao: group.tipo_instituicao,
        categoria_administrativa: group.categoria_administrativa,
        total_cursos_presenciais: group.cursos.length,
        cursos: group.cursos,
      },
    });
  }

  // Ordena por município e nome
  adaptedCampi.sort((a, b) => a.municipio.localeCompare(b.municipio, 'pt-BR'));

  const payload = {
    metadados: {
      adaptado_em: new Date().toISOString(),
      fonte: 'INEP Censo da Educação Superior 2023 (Presenciais)',
      total_campi_adaptados: adaptedCampi.length,
      campi_correspondentes_base_secti: adaptedCampi.filter((c) => c.id_ativo < 10000).length,
      novos_campi_inep: adaptedCampi.filter((c) => c.id_ativo >= 10000).length,
    },
    dados: adaptedCampi,
  };

  if (saveToFile) {
    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`[ADAPTER-CAMPI] Snapshot salvo em: ${OUTPUT_FILE}`);
  }

  return payload;
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('adapter-campi-secti.mjs')) {
  try {
    const res = adaptCampi();
    console.log(`[ADAPTER-CAMPI] Concluído! Total: ${res.metadados.total_campi_adaptados} (Validados SECTI: ${res.metadados.campi_correspondentes_base_secti}, Novos INEP: ${res.metadados.novos_campi_inep})`);
  } catch (err) {
    console.error('[ADAPTER-CAMPI] Erro:', err);
    process.exit(1);
  }
}
