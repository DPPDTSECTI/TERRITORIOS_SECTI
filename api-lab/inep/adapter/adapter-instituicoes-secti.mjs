/**
 * api-lab/inep/adapter/adapter-instituicoes-secti.mjs
 * Camada de adaptação que consolida o cadastro de Instituições de Ensino Superior (IES)
 * atuantes na Bahia com dados territoriais, tipologia simplificada e estatísticas de oferta.
 */

import fs from 'node:fs';
import path from 'node:path';
import { resolveMunicipio } from './geo-resolver.mjs';
import { normalizeName } from '../../ibge/normalize-municipios.mjs';

const ROOT_DIR = process.cwd();
const RAW_DIR = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'raw');
const NORMALIZED_FILE = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'normalized', 'cursos_inep_ba.json');
const IES_RAW_FILE = path.resolve(RAW_DIR, 'inep_ba_ies_raw.json');
const OUTPUT_FILE = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'output', 'instituicoes_secti_inep.json');

/**
 * Mapeia a categoria administrativa do INEP para a categoria simplificada do frontend da SECTI.
 * ('federal' | 'estadual' | 'institutoFederal' | 'privada')
 */
export function mapCategoriaSimplificada(categoriaAdmin, tipoOrg, sigla = '') {
  const normCat = normalizeName(categoriaAdmin);
  const normTipo = normalizeName(tipoOrg);
  const normSigla = normalizeName(sigla);

  if (normTipo.includes('instituto federal') || normSigla.includes('ifba') || normSigla.includes('ifbaiano')) {
    return 'institutoFederal';
  }
  if (normCat.includes('estadual')) {
    return 'estadual';
  }
  if (normCat.includes('federal')) {
    return 'federal';
  }
  return 'privada';
}

/**
 * Executa a consolidação das instituições do INEP.
 */
export function adaptInstituicoes({ saveToFile = true } = {}) {
  if (!fs.existsSync(NORMALIZED_FILE)) {
    throw new Error(`Arquivo normalizado do INEP não encontrado em: ${NORMALIZED_FILE}`);
  }

  const inepCursos = JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf-8'));
  const iesRawList = fs.existsSync(IES_RAW_FILE)
    ? JSON.parse(fs.readFileSync(IES_RAW_FILE, 'utf-8')).dados || []
    : [];

  const iesSedeMap = new Map();
  for (const ies of iesRawList) {
    iesSedeMap.set(ies.codigo_ies, ies);
  }

  // Agrupa cursos por IES
  const iesStats = new Map();

  for (const c of inepCursos) {
    const cod = c.codigo_ies;
    if (!iesStats.has(cod)) {
      const sedeRaw = iesSedeMap.get(cod);
      const geoSede = resolveMunicipio({
        codigo_ibge: sedeRaw?.codigo_municipio || c.codigo_ibge,
        municipio: sedeRaw?.municipio || c.municipio,
      });

      iesStats.set(cod, {
        codigo_ies: cod,
        nome_ies: c.instituicao,
        sigla: c.sigla_instituicao || (sedeRaw?.sigla_ies ?? ''),
        tipo_instituicao: c.tipo_instituicao,
        categoria_administrativa: c.categoria_administrativa,
        categoria_simplificada: mapCategoriaSimplificada(
          c.categoria_administrativa,
          c.tipo_instituicao,
          c.sigla_instituicao
        ),
        municipio_sede: geoSede.nome_municipio,
        codigo_ibge_sede: geoSede.codigo_ibge,
        id_territorio_sede: geoSede.id_territorio,
        territorio_sede: geoSede.territorio_identidade,
        total_cursos_presenciais: 0,
        total_cursos_ead: 0,
        total_cursos_cti: 0,
        municipios_presenciais: new Set(),
        territorios_presenciais: new Set(),
        municipios_total: new Set(),
      });
    }

    const item = iesStats.get(cod);
    const geo = resolveMunicipio({
      codigo_ibge: c.codigo_ibge,
      municipio: c.municipio,
    });

    if (c.modalidade === 'Presencial') {
      item.total_cursos_presenciais += 1;
      if (geo.nome_municipio) item.municipios_presenciais.add(geo.nome_municipio);
      if (geo.territorio_identidade) item.territorios_presenciais.add(geo.territorio_identidade);
    } else {
      item.total_cursos_ead += 1;
    }

    // Identifica se é área de CT&I
    const area = c.area_geral || '';
    const isCti = [
      'Agricultura, silvicultura, pesca e veterinária',
      'Ciências naturais, matemática e estatística',
      'Computação e Tecnologias da Informação e Comunicação (TIC)',
      'Engenharia, produção e construção',
      'Saúde e bem-estar',
    ].includes(area);

    if (isCti && c.modalidade === 'Presencial') {
      item.total_cursos_cti += 1;
    }

    if (geo.nome_municipio) item.municipios_total.add(geo.nome_municipio);
  }

  const adaptedList = Array.from(iesStats.values())
    .map((ies) => ({
      codigo_ies: ies.codigo_ies,
      nome_ies: ies.nome_ies,
      sigla: ies.sigla,
      tipo_instituicao: ies.tipo_instituicao,
      categoria_administrativa: ies.categoria_administrativa,
      categoria_simplificada: ies.categoria_simplificada,
      municipio_sede: ies.municipio_sede,
      codigo_ibge_sede: ies.codigo_ibge_sede,
      id_territorio_sede: ies.id_territorio_sede,
      territorio_sede: ies.territorio_sede,
      total_cursos_presenciais: ies.total_cursos_presenciais,
      total_cursos_ead: ies.total_cursos_ead,
      total_cursos_cti: ies.total_cursos_cti,
      total_municipios_presenciais: ies.municipios_presenciais.size,
      total_territorios_presenciais: ies.territorios_presenciais.size,
      total_municipios_abrangencia: ies.municipios_total.size,
      municipios_presenciais: Array.from(ies.municipios_presenciais).sort(),
      territorios_presenciais: Array.from(ies.territorios_presenciais).sort(),
    }))
    .sort((a, b) => b.total_cursos_presenciais - a.total_cursos_presenciais);

  const payload = {
    metadados: {
      adaptado_em: new Date().toISOString(),
      fonte: 'INEP Censo da Educação Superior 2023',
      total_instituicoes_atuantes: adaptedList.length,
      instituicoes_com_oferta_presencial: adaptedList.filter((i) => i.total_cursos_presenciais > 0).length,
      instituicoes_com_cursos_cti: adaptedList.filter((i) => i.total_cursos_cti > 0).length,
    },
    dados: adaptedList,
  };

  if (saveToFile) {
    const outDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`[ADAPTER-IES] Snapshot salvo em: ${OUTPUT_FILE}`);
  }

  return payload;
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('adapter-instituicoes-secti.mjs')) {
  try {
    const res = adaptInstituicoes();
    console.log(`[ADAPTER-IES] Concluído! Total: ${res.metadados.total_instituicoes_atuantes} IES (Com oferta presencial: ${res.metadados.instituicoes_com_oferta_presencial})`);
  } catch (err) {
    console.error('[ADAPTER-IES] Erro:', err);
    process.exit(1);
  }
}
