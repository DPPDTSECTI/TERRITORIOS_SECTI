/**
 * api-lab/ibge/compare-municipios.mjs
 * Compara a base oficial do IBGE contra os municípios atualmente usados pelo projeto
 * em utils/territorioMunicipios.json.
 * 
 * Gera api-lab/ibge/output/relatorio_ibge.json sem inferir territórios de identidade pelo IBGE.
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizeName } from './normalize-municipios.mjs';
import { fetchMunicipiosIbge, OUTPUT_FILE as IBGE_OUTPUT_FILE } from './fetch-municipios.mjs';

export const ROOT_DIR = process.cwd();
export const CURRENT_DATA_FILE = path.resolve(ROOT_DIR, 'utils', 'territorioMunicipios.json');
export const REPORT_OUTPUT_DIR = path.resolve(ROOT_DIR, 'api-lab', 'ibge', 'output');
export const REPORT_OUTPUT_FILE = path.resolve(REPORT_OUTPUT_DIR, 'relatorio_ibge.json');

/**
 * Mapeamento conhecido de divergências ortográficas e de preposição entre
 * o referencial SEPLAN-BA e a base cadastral do IBGE.
 */
const KNOWN_DIVERGENCES = [
  {
    nomeProjeto: 'Muquém de São Francisco',
    nomeIbge: 'Muquém do São Francisco',
    tipo: 'preposicao',
    detalhe: "Projeto usa preposição 'de', enquanto o IBGE adota 'do'.",
  },
  {
    nomeProjeto: 'Santa Teresinha',
    nomeIbge: 'Santa Terezinha',
    tipo: 'ortografia',
    detalhe: "Projeto grafa com 's' (Teresinha), enquanto o IBGE adota 'z' (Terezinha).",
  },
];

/**
 * Carrega a base local de territórios e municípios (utils/territorioMunicipios.json).
 * 
 * @returns {{
 *   raw: object,
 *   territorios: Array<{ id: number, nome: string, quantidade: number }>,
 *   municipios: Array<{ municipio: string, id_territorio: number, nome_territorio: string }>,
 *   relacaoTerritorioMunicipios: Record<string, string[]>
 * }}
 */
export function loadCurrentTerritorios() {
  if (!fs.existsSync(CURRENT_DATA_FILE)) {
    throw new Error(`[IBGE-COMPARE] Arquivo de referência não encontrado em: ${CURRENT_DATA_FILE}`);
  }

  const raw = JSON.parse(fs.readFileSync(CURRENT_DATA_FILE, 'utf-8'));
  const territoriosDeIdentidade = raw.territorios_de_identidade || [];

  const territorios = [];
  const municipios = [];
  const relacaoTerritorioMunicipios = {};

  for (const t of territoriosDeIdentidade) {
    territorios.push({
      id: t.id,
      nome: t.nome,
      quantidade: t.quantidade_municipios ?? t.municipios?.length ?? 0,
    });

    relacaoTerritorioMunicipios[t.nome] = [...(t.municipios || [])];

    for (const m of (t.municipios || [])) {
      municipios.push({
        municipio: m,
        id_territorio: t.id,
        nome_territorio: t.nome,
      });
    }
  }

  return {
    raw,
    territorios,
    municipios,
    relacaoTerritorioMunicipios,
  };
}

/**
 * Carrega a lista normalizada do IBGE (ou executa o fetch se o arquivo ainda não existir).
 * 
 * @returns {Promise<Array<{ codigo_ibge: number, municipio: string, uf: string }>>}
 */
export async function loadIbgeMunicipios() {
  if (!fs.existsSync(IBGE_OUTPUT_FILE)) {
    console.log(`[IBGE-COMPARE] Base do IBGE não encontrada localmente. Executando fetch inicial...`);
    return await fetchMunicipiosIbge({ saveToFile: true });
  }

  const content = fs.readFileSync(IBGE_OUTPUT_FILE, 'utf-8');
  return JSON.parse(content);
}

/**
 * Executa a comparação detalhada entre a base do projeto e a base do IBGE.
 * 
 * @param {object} options
 * @param {boolean} [options.saveToFile=true]
 * @returns {Promise<object>}
 */
export async function compareMunicipios({ saveToFile = true } = {}) {
  const currentData = loadCurrentTerritorios();
  const ibgeData = await loadIbgeMunicipios();

  const totalAtual = currentData.municipios.length;
  const totalIbge = ibgeData.length;

  // Índices para busca rápida no IBGE
  const ibgeByNormalized = new Map();
  const ibgeByExact = new Map();
  const ibgeById = new Map();

  for (const item of ibgeData) {
    ibgeByNormalized.set(normalizeName(item.municipio), item);
    ibgeByExact.set(item.municipio, item);
    ibgeById.set(item.codigo_ibge, item);
  }

  const municipiosCoincidentes = [];
  const divergenciasNome = [];
  const matchedIbgeCodes = new Set();
  const municipiosSemCodigo = [];
  const municipiosSomenteProjeto = [];

  // Mapeamentos conhecidos para comparação avançada
  const knownDivergencesMapProjToIbge = new Map();
  const knownDivergencesMapIbgeToProj = new Map();
  for (const div of KNOWN_DIVERGENCES) {
    knownDivergencesMapProjToIbge.set(normalizeName(div.nomeProjeto), div);
    knownDivergencesMapIbgeToProj.set(normalizeName(div.nomeIbge), div);
  }

  // 1. Analisar cada município do projeto atual
  for (const item of currentData.municipios) {
    const nomeOriginal = item.municipio;
    const nomeNorm = normalizeName(nomeOriginal);

    // Caso 1: Coincidência Exata
    if (ibgeByExact.has(nomeOriginal)) {
      const match = ibgeByExact.get(nomeOriginal);
      matchedIbgeCodes.add(match.codigo_ibge);
      municipiosCoincidentes.push({
        municipio_projeto: nomeOriginal,
        municipio_ibge: match.municipio,
        codigo_ibge: match.codigo_ibge,
        territorio_id: item.id_territorio,
        territorio_nome: item.nome_territorio,
        tipo_coincidencia: 'exata',
      });
      continue;
    }

    // Caso 2: Coincidência Normalizada (diferença apenas de acentuação / maiúsculas)
    if (ibgeByNormalized.has(nomeNorm)) {
      const match = ibgeByNormalized.get(nomeNorm);
      matchedIbgeCodes.add(match.codigo_ibge);
      municipiosCoincidentes.push({
        municipio_projeto: nomeOriginal,
        municipio_ibge: match.municipio,
        codigo_ibge: match.codigo_ibge,
        territorio_id: item.id_territorio,
        territorio_nome: item.nome_territorio,
        tipo_coincidencia: 'normalizada_com_variacao_acento',
      });

      divergenciasNome.push({
        municipio_projeto: nomeOriginal,
        municipio_ibge: match.municipio,
        codigo_ibge: match.codigo_ibge,
        territorio: item.nome_territorio,
        tipo: 'acento',
        detalhe: `Diferença de acentuação gráfica ('${nomeOriginal}' vs '${match.municipio}')`,
      });
      continue;
    }

    // Caso 3: Divergência conhecida (preposição ou grafia fonética)
    if (knownDivergencesMapProjToIbge.has(nomeNorm)) {
      const div = knownDivergencesMapProjToIbge.get(nomeNorm);
      const ibgeMatch = ibgeData.find((ib) => normalizeName(ib.municipio) === normalizeName(div.nomeIbge));

      if (ibgeMatch) {
        matchedIbgeCodes.add(ibgeMatch.codigo_ibge);
        divergenciasNome.push({
          municipio_projeto: nomeOriginal,
          municipio_ibge: ibgeMatch.municipio,
          codigo_ibge: ibgeMatch.codigo_ibge,
          territorio: item.nome_territorio,
          tipo: div.tipo,
          detalhe: div.detalhe,
        });
      }

      municipiosSomenteProjeto.push({
        municipio: nomeOriginal,
        territorio_id: item.id_territorio,
        territorio_nome: item.nome_territorio,
        sugestao_ibge: ibgeMatch?.municipio ?? null,
        codigo_ibge_sugerido: ibgeMatch?.codigo_ibge ?? null,
      });
      continue;
    }

    // Caso 4: Sem correspondência
    municipiosSomenteProjeto.push({
      municipio: nomeOriginal,
      territorio_id: item.id_territorio,
      territorio_nome: item.nome_territorio,
      sugestao_ibge: null,
      codigo_ibge_sugerido: null,
    });
    municipiosSemCodigo.push({
      municipio: nomeOriginal,
      territorio_id: item.id_territorio,
      territorio_nome: item.nome_territorio,
    });
  }

  // 2. Identificar municípios presentes no IBGE que não tiveram correspondência direta normalizada no projeto
  const currentNormalizedSet = new Set(currentData.municipios.map((m) => normalizeName(m.municipio)));
  const municipiosSomenteIbge = ibgeData
    .filter((ib) => !currentNormalizedSet.has(normalizeName(ib.municipio)))
    .map((ib) => {
      const div = knownDivergencesMapIbgeToProj.get(normalizeName(ib.municipio));
      return {
        codigo_ibge: ib.codigo_ibge,
        municipio: ib.municipio,
        uf: ib.uf,
        divergencia_correspondente: div ? div.nomeProjeto : null,
      };
    });

  // Lista ordenada de todos os códigos IBGE mapeados
  const codigosIbgeEncontrados = Array.from(matchedIbgeCodes).sort((a, b) => a - b);

  // Montagem da estrutura final do relatório
  const relatorio = {
    metadados: {
      gerado_em: new Date().toISOString(),
      fonte_projeto: 'utils/territorioMunicipios.json (SEPLAN-BA)',
      fonte_ibge: 'API de Localidades IBGE (UF 29 - Bahia)',
      endpoint_ibge: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/29/municipios',
    },
    resumo: {
      total_atual: totalAtual,
      total_ibge: totalIbge,
      total_territorios_atual: currentData.territorios.length,
      coincidentes_exatos: municipiosCoincidentes.filter((m) => m.tipo_coincidencia === 'exata').length,
      coincidentes_normalizados_com_acento: municipiosCoincidentes.filter((m) => m.tipo_coincidencia !== 'exata').length,
      total_municipios_coincidentes: municipiosCoincidentes.length,
      total_divergencias_identificadas: divergenciasNome.length,
      total_municipios_somente_projeto_atual: municipiosSomenteProjeto.length,
      total_municipios_somente_ibge: municipiosSomenteIbge.length,
      total_codigos_ibge_encontrados: codigosIbgeEncontrados.length,
      total_municipios_sem_codigo: municipiosSemCodigo.length,
    },
    total_atual: totalAtual,
    total_ibge: totalIbge,
    municipios_coincidentes: municipiosCoincidentes,
    municipios_somente_projeto_atual: municipiosSomenteProjeto,
    municipios_somente_ibge: municipiosSomenteIbge,
    divergencias_nome: divergenciasNome,
    codigos_ibge_encontrados: codigosIbgeEncontrados,
    municipios_sem_codigo: municipiosSemCodigo,
  };

  if (saveToFile) {
    if (!fs.existsSync(REPORT_OUTPUT_DIR)) {
      fs.mkdirSync(REPORT_OUTPUT_DIR, { recursive: true });
    }
    fs.writeFileSync(REPORT_OUTPUT_FILE, JSON.stringify(relatorio, null, 2), 'utf-8');
    console.log(`[IBGE-COMPARE] Relatório salvo com sucesso em: ${REPORT_OUTPUT_FILE}`);
  }

  return relatorio;
}

// Execução direta via CLI (node api-lab/ibge/compare-municipios.mjs)
if (process.argv[1] && process.argv[1].endsWith('compare-municipios.mjs')) {
  compareMunicipios()
    .then((relatorio) => {
      console.log('\n======================================================');
      console.log('             RELATÓRIO COMPARATIVO IBGE               ');
      console.log('======================================================');
      console.log(`Total de Municípios no Projeto Atual : ${relatorio.resumo.total_atual}`);
      console.log(`Total de Municípios na Base do IBGE  : ${relatorio.resumo.total_ibge}`);
      console.log(`Total de Territórios no Projeto Atual: ${relatorio.resumo.total_territorios_atual}`);
      console.log(`Municípios Coincidentes (Diretos)    : ${relatorio.resumo.total_municipios_coincidentes} (${relatorio.resumo.coincidentes_exatos} exatos + ${relatorio.resumo.coincidentes_normalizados_com_acento} normalizados)`);
      console.log(`Divergências de Nome Mapeadas        : ${relatorio.resumo.total_divergencias_identificadas}`);
      console.log(`Códigos IBGE Vinculados              : ${relatorio.resumo.total_codigos_ibge_encontrados} de ${relatorio.resumo.total_ibge}`);
      console.log(`Municípios sem Código Identificado   : ${relatorio.resumo.total_municipios_sem_codigo}`);
      console.log('------------------------------------------------------');
      console.log('Divergências detalhadas:');
      relatorio.divergencias_nome.forEach((d, i) => {
        console.log(`  ${i + 1}. [${d.tipo.toUpperCase()}] Projeto: "${d.municipio_projeto}" | IBGE: "${d.municipio_ibge}" (Cód: ${d.codigo_ibge}) [Território: ${d.territorio}]`);
      });
      console.log('======================================================\n');
    })
    .catch((err) => {
      console.error('[IBGE-COMPARE] Erro:', err);
      process.exit(1);
    });
}
