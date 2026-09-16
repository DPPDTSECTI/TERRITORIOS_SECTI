/**
 * api-lab/inep/scripts/compare-inep.mjs
 * Compara os dados atuais do projeto (cursos e campi) contra o Censo da Educação Superior do INEP.
 * 
 * Classifica divergências em:
 * - Correspondência exata
 * - Diferença de acentuação
 * - Diferença de nome
 * - Instituição apenas no projeto
 * - Instituição apenas no INEP
 * - Curso apenas no projeto
 * - Curso apenas no INEP
 * - Município sem código IBGE
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizeName } from '../../ibge/normalize-municipios.mjs';

const ROOT_DIR = process.cwd();
const RAW_DIR = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'raw');
const NORMALIZED_DIR = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'normalized');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'output');

export const FILE_SECTI_CURSOS = path.resolve(RAW_DIR, 'secti_cursos_atual.json');
export const FILE_SECTI_CAMPI = path.resolve(RAW_DIR, 'secti_campi_atual.json');
export const FILE_INEP_NORMALIZED = path.resolve(NORMALIZED_DIR, 'cursos_inep_ba.json');
export const FILE_IBGE_MUNICIPIOS = path.resolve(ROOT_DIR, 'api-lab', 'ibge', 'output', 'municipios_ibge.json');
export const FILE_OUTPUT_RELATORIO = path.resolve(OUTPUT_DIR, 'relatorio_inep.json');

/**
 * Normaliza o nome da instituição para comparação aproximada,
 * removendo sufixos de campus, polos e siglas redundantes.
 */
export function cleanInstituicaoName(name) {
  if (!name) return '';
  let clean = String(name)
    .replace(/\s*\((?:campus|polo|sede|ead|unidade).*?\)/gi, '')
    .replace(/\s*-\s*(?:campus|polo|unidade|sede)\b.*$/i, '')
    .trim();
  return normalizeName(clean);
}

/**
 * Normaliza o nome do curso para tolerar variações comuns como de/da/do.
 */
export function canonicalCursoName(curso) {
  return normalizeName(curso)
    .replace(/\b(de|da|do|dos|das|e|em)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Executa a comparação cruzada completa.
 */
export async function compareInep({ saveToFile = true } = {}) {
  // 1. Carregar bases de dados
  if (!fs.existsSync(FILE_SECTI_CURSOS)) {
    throw new Error(`Arquivo SECTI cursos não encontrado: ${FILE_SECTI_CURSOS}`);
  }
  if (!fs.existsSync(FILE_INEP_NORMALIZED)) {
    throw new Error(`Arquivo INEP normalizado não encontrado: ${FILE_INEP_NORMALIZED}`);
  }

  const sectiCursosRaw = JSON.parse(fs.readFileSync(FILE_SECTI_CURSOS, 'utf-8')).dados || [];
  const sectiCampiRaw = fs.existsSync(FILE_SECTI_CAMPI)
    ? JSON.parse(fs.readFileSync(FILE_SECTI_CAMPI, 'utf-8')).dados || []
    : [];
  const inepCursos = JSON.parse(fs.readFileSync(FILE_INEP_NORMALIZED, 'utf-8'));

  let ibgeMunicipiosMap = new Map();
  if (fs.existsSync(FILE_IBGE_MUNICIPIOS)) {
    const ibgeList = JSON.parse(fs.readFileSync(FILE_IBGE_MUNICIPIOS, 'utf-8'));
    ibgeList.forEach((m) => {
      ibgeMunicipiosMap.set(m.codigo_ibge, m);
      ibgeMunicipiosMap.set(normalizeName(m.municipio), m);
    });
  }

  console.log(`[INEP-COMPARE] Carregados:`);
  console.log(`  - Cursos SECTI: ${sectiCursosRaw.length}`);
  console.log(`  - Campi SECTI: ${sectiCampiRaw.length}`);
  console.log(`  - Cursos INEP: ${inepCursos.length}`);

  // ----------------------------------------------------
  // A) COMPARAÇÃO DE MUNICÍPIOS
  // ----------------------------------------------------
  const municipiosSemCodigo = [];
  const municipiosSectiSet = new Set();
  const municipiosInepSet = new Set();

  sectiCursosRaw.forEach((c) => {
    if (c.municipio) {
      municipiosSectiSet.add(c.municipio);
      const normMun = normalizeName(c.municipio);
      if (!ibgeMunicipiosMap.has(normMun)) {
        municipiosSemCodigo.push({
          municipio: c.municipio,
          contexto: 'Cursos SECTI',
        });
      }
    }
  });

  inepCursos.forEach((c) => {
    if (c.municipio) {
      municipiosInepSet.add(c.municipio);
      if (!c.codigo_ibge || !ibgeMunicipiosMap.has(c.codigo_ibge)) {
        municipiosSemCodigo.push({
          municipio: c.municipio,
          codigo_ibge: c.codigo_ibge,
          contexto: 'INEP Censo',
        });
      }
    }
  });

  // ----------------------------------------------------
  // B) COMPARAÇÃO DE INSTITUIÇÕES
  // ----------------------------------------------------
  const inepIesMapByCleanName = new Map();
  const inepIesMapBySigla = new Map();
  const inepIesOriginalSet = new Set();

  inepCursos.forEach((c) => {
    if (c.instituicao) {
      inepIesOriginalSet.add(c.instituicao);
      const cleanName = cleanInstituicaoName(c.instituicao);
      if (!inepIesMapByCleanName.has(cleanName)) {
        inepIesMapByCleanName.set(cleanName, {
          nome_original: c.instituicao,
          sigla: c.sigla_instituicao,
          codigo_ies: c.codigo_ies,
          tipo: c.tipo_instituicao,
          categoria: c.categoria_administrativa,
        });
      }
      if (c.sigla_instituicao) {
        inepIesMapBySigla.set(c.sigla_instituicao.toUpperCase(), c.instituicao);
      }
    }
  });

  // Extrair instituições distintas da SECTI
  const sectiIesMap = new Map();
  sectiCursosRaw.forEach((c) => {
    const nome = c.entidade || c.instituicao;
    if (nome && !sectiIesMap.has(nome)) {
      sectiIesMap.set(nome, {
        nome_original: nome,
        sigla: c.sigla ? c.sigla.toUpperCase() : null,
      });
    }
  });

  const instituicoesCoincidentesExatas = [];
  const instituicoesDiferencaAcentuacao = [];
  const instituicoesDiferencaNome = [];
  const instituicoesApenasProjeto = [];

  for (const [nomeSecti, info] of sectiIesMap.entries()) {
    const cleanSecti = cleanInstituicaoName(nomeSecti);
    const siglaSecti = info.sigla;

    // 1. Correspondência exata de nome
    if (inepIesOriginalSet.has(nomeSecti)) {
      instituicoesCoincidentesExatas.push({
        projeto: nomeSecti,
        inep: nomeSecti,
        sigla: siglaSecti,
        tipo: 'exato',
      });
      continue;
    }

    // 2. Correspondência normalizada / acentuação
    if (inepIesMapByCleanName.has(cleanSecti)) {
      const match = inepIesMapByCleanName.get(cleanSecti);
      instituicoesDiferencaAcentuacao.push({
        projeto: nomeSecti,
        inep: match.nome_original,
        sigla: siglaSecti || match.sigla,
        tipo: 'acentuacao_caixa',
      });
      continue;
    }

    // 3. Correspondência por sigla conhecida
    if (siglaSecti && inepIesMapBySigla.has(siglaSecti)) {
      const inepNome = inepIesMapBySigla.get(siglaSecti);
      instituicoesDiferencaNome.push({
        projeto: nomeSecti,
        inep: inepNome,
        sigla: siglaSecti,
        tipo: 'variacao_nome_mesma_sigla',
      });
      continue;
    }

    // 4. Apenas no projeto
    instituicoesApenasProjeto.push({
      projeto: nomeSecti,
      sigla: siglaSecti,
      motivo: 'Instituição não identificada diretamente no Censo INEP ou denominação local divergente',
    });
  }

  // Instituições presentes no INEP não mapeadas na SECTI
  const matchedInepIesClean = new Set([
    ...instituicoesCoincidentesExatas.map((m) => cleanInstituicaoName(m.inep)),
    ...instituicoesDiferencaAcentuacao.map((m) => cleanInstituicaoName(m.inep)),
    ...instituicoesDiferencaNome.map((m) => cleanInstituicaoName(m.inep)),
  ]);

  const instituicoesApenasInep = Array.from(inepIesMapByCleanName.values())
    .filter((ies) => !matchedInepIesClean.has(cleanInstituicaoName(ies.nome_original)))
    .slice(0, 100); // Amostra representativa

  // ----------------------------------------------------
  // C) COMPARAÇÃO DE CURSOS
  // ----------------------------------------------------
  // Índice dos cursos do INEP por chave: canonical(curso) + '||' + normalize(municipio)
  const inepCursosMapExact = new Map();
  const inepCursosMapCanonical = new Map();

  inepCursos.forEach((ic) => {
    const kExact = `${normalizeName(ic.curso)}||${normalizeName(ic.municipio)}`;
    const kCanon = `${canonicalCursoName(ic.curso)}||${normalizeName(ic.municipio)}`;

    if (!inepCursosMapExact.has(kExact)) inepCursosMapExact.set(kExact, ic);
    if (!inepCursosMapCanonical.has(kCanon)) inepCursosMapCanonical.set(kCanon, ic);
  });

  const cursosCoincidentesExatos = [];
  const cursosDiferencaAcentuacao = [];
  const cursosDiferencaNome = [];
  const cursosApenasProjeto = [];

  sectiCursosRaw.forEach((sc) => {
    const nomeCurso = sc.curso;
    const munCurso = sc.municipio;
    const kExact = `${normalizeName(nomeCurso)}||${normalizeName(munCurso)}`;
    const kCanon = `${canonicalCursoName(nomeCurso)}||${normalizeName(munCurso)}`;

    if (inepCursosMapExact.has(kExact)) {
      const match = inepCursosMapExact.get(kExact);
      if (match.curso === nomeCurso) {
        cursosCoincidentesExatos.push({
          id_projeto: sc.id,
          curso: nomeCurso,
          municipio: munCurso,
          codigo_curso_inep: match.codigo_curso,
          instituicao_projeto: sc.entidade,
          instituicao_inep: match.instituicao,
          tipo: 'exato',
        });
      } else {
        cursosDiferencaAcentuacao.push({
          id_projeto: sc.id,
          curso_projeto: nomeCurso,
          curso_inep: match.curso,
          municipio: munCurso,
          codigo_curso_inep: match.codigo_curso,
          tipo: 'diferenca_acento',
        });
      }
    } else if (inepCursosMapCanonical.has(kCanon)) {
      const match = inepCursosMapCanonical.get(kCanon);
      cursosDiferencaNome.push({
        id_projeto: sc.id,
        curso_projeto: nomeCurso,
        curso_inep: match.curso,
        municipio: munCurso,
        codigo_curso_inep: match.codigo_curso,
        tipo: 'variacao_conectivo_nome',
      });
    } else {
      cursosApenasProjeto.push({
        id_projeto: sc.id,
        curso: nomeCurso,
        municipio: munCurso,
        entidade: sc.entidade,
        territorio: sc.territorio_identidade,
        motivo: 'Curso com oferta municipal ou denominação não localizada exatamente no Censo 2023',
      });
    }
  });

  // Amostra de cursos apenas no INEP (dos 38 mil)
  const matchedInepCursosKeys = new Set([
    ...cursosCoincidentesExatos.map((c) => `${canonicalCursoName(c.curso)}||${normalizeName(c.municipio)}`),
    ...cursosDiferencaAcentuacao.map((c) => `${canonicalCursoName(c.curso_inep)}||${normalizeName(c.municipio)}`),
    ...cursosDiferencaNome.map((c) => `${canonicalCursoName(c.curso_inep)}||${normalizeName(c.municipio)}`),
  ]);

  const cursosApenasInepAmostra = inepCursos
    .filter((c) => c.modalidade === 'Presencial')
    .filter((c) => !matchedInepCursosKeys.has(`${canonicalCursoName(c.curso)}||${normalizeName(c.municipio)}`))
    .slice(0, 50);

  // ----------------------------------------------------
  // D) COMPARAÇÃO DE CAMPI
  // ----------------------------------------------------
  const campiCoincidentes = [];
  const campiApenasProjeto = [];

  sectiCampiRaw.forEach((camp) => {
    const munNorm = normalizeName(camp.municipio);
    const inepHasMun = inepCursos.some((c) => normalizeName(c.municipio) === munNorm);
    if (inepHasMun) {
      campiCoincidentes.push({
        id_ativo: camp.id_ativo,
        nome_ativo: camp.nome_ativo,
        tipo: camp.tipo,
        municipio: camp.municipio,
        territorio: camp.territorio_identidade,
      });
    } else {
      campiApenasProjeto.push({
        id_ativo: camp.id_ativo,
        nome_ativo: camp.nome_ativo,
        tipo: camp.tipo,
        municipio: camp.municipio,
        territorio: camp.territorio_identidade,
      });
    }
  });

  // ----------------------------------------------------
  // E) ESTRUTURA DO RELATÓRIO
  // ----------------------------------------------------
  const relatorio = {
    metadados: {
      gerado_em: new Date().toISOString(),
      fonte_projeto: 'Supabase SECTI (lista_cursos_cti / lista_ativos_cti)',
      fonte_inep: 'INEP - Censo da Educação Superior (Edição 2023)',
      ano_censo: 2023,
    },
    resumo: {
      total_cursos_projeto: sectiCursosRaw.length,
      total_campi_projeto: sectiCampiRaw.length,
      total_instituicoes_distintas_projeto: sectiIesMap.size,
      total_municipios_com_cursos_projeto: municipiosSectiSet.size,

      total_ofertas_cursos_inep_ba: inepCursos.length,
      total_cursos_presenciais_inep_ba: inepCursos.filter((c) => c.modalidade === 'Presencial').length,
      total_cursos_ead_inep_ba: inepCursos.filter((c) => c.modalidade === 'A distância').length,
      total_instituicoes_inep_com_sede_ba: inepIesOriginalSet.size,
      total_municipios_com_oferta_inep: municipiosInepSet.size,

      classificacao_instituicoes: {
        coincidentes_exatas: instituicoesCoincidentesExatas.length,
        diferenca_acentuacao: instituicoesDiferencaAcentuacao.length,
        diferenca_nome: instituicoesDiferencaNome.length,
        apenas_projeto: instituicoesApenasProjeto.length,
        apenas_inep: inepIesOriginalSet.size - (instituicoesCoincidentesExatas.length + instituicoesDiferencaAcentuacao.length + instituicoesDiferencaNome.length),
      },
      classificacao_cursos: {
        coincidentes_exatos: cursosCoincidentesExatos.length,
        diferenca_acentuacao: cursosDiferencaAcentuacao.length,
        diferenca_nome: cursosDiferencaNome.length,
        apenas_projeto: cursosApenasProjeto.length,
        apenas_inep_amostra: cursosApenasInepAmostra.length,
      },
      classificacao_municipios: {
        municipios_sem_codigo_ibge: municipiosSemCodigo.length,
      },
      classificacao_campi: {
        coincidentes_por_municipio: campiCoincidentes.length,
        apenas_projeto: campiApenasProjeto.length,
      },
    },
    divergencias_classificadas: {
      instituicoes: {
        coincidentes_exatas: instituicoesCoincidentesExatas,
        diferenca_acentuacao: instituicoesDiferencaAcentuacao,
        diferenca_nome: instituicoesDiferencaNome,
        apenas_projeto: instituicoesApenasProjeto,
        apenas_inep_amostra: instituicoesApenasInep,
      },
      cursos: {
        coincidentes_exatos: cursosCoincidentesExatos,
        diferenca_acentuacao: cursosDiferencaAcentuacao,
        diferenca_nome: cursosDiferencaNome,
        apenas_projeto: cursosApenasProjeto,
        apenas_inep_amostra: cursosApenasInepAmostra,
      },
      campi: {
        coincidentes: campiCoincidentes,
        apenas_projeto: campiApenasProjeto,
      },
      municipios: {
        sem_codigo_ibge: municipiosSemCodigo,
      },
    },
  };

  if (saveToFile) {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    fs.writeFileSync(FILE_OUTPUT_RELATORIO, JSON.stringify(relatorio, null, 2), 'utf-8');
    console.log(`[INEP-COMPARE] Relatório salvo em: ${FILE_OUTPUT_RELATORIO}`);
  }

  return relatorio;
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('compare-inep.mjs')) {
  compareInep()
    .then((relatorio) => {
      const r = relatorio.resumo;
      console.log('\n======================================================');
      console.log('         RELATÓRIO COMPARATIVO SECTI vs INEP          ');
      console.log('======================================================');
      console.log(`Cursos no Projeto (Recorte CT&I)   : ${r.total_cursos_projeto}`);
      console.log(`Ofertas no INEP 2023 (Bahia Total) : ${r.total_ofertas_cursos_inep_ba} (${r.total_cursos_presenciais_inep_ba} presenciais, ${r.total_cursos_ead_inep_ba} EAD)`);
      console.log('------------------------------------------------------');
      console.log('INSTITUIÇÕES:');
      console.log(`  - Coincidentes Exatas             : ${r.classificacao_instituicoes.coincidentes_exatas}`);
      console.log(`  - Variação de Acentuação / Caixa  : ${r.classificacao_instituicoes.diferenca_acentuacao}`);
      console.log(`  - Variação de Nome (Mesma Sigla)  : ${r.classificacao_instituicoes.diferenca_nome}`);
      console.log(`  - Apenas no Projeto               : ${r.classificacao_instituicoes.apenas_projeto}`);
      console.log('------------------------------------------------------');
      console.log('CURSOS:');
      console.log(`  - Coincidentes Exatos (Curso+Mun) : ${r.classificacao_cursos.coincidentes_exatos}`);
      console.log(`  - Variação de Acento (Curso+Mun)  : ${r.classificacao_cursos.diferenca_acentuacao}`);
      console.log(`  - Variação de Conectivo / Nome    : ${r.classificacao_cursos.diferenca_nome}`);
      console.log(`  - Apenas no Projeto               : ${r.classificacao_cursos.apenas_projeto}`);
      console.log('------------------------------------------------------');
      console.log(`Municípios sem Código IBGE         : ${r.classificacao_municipios.municipios_sem_codigo_ibge}`);
      console.log(`Campi com presença no INEP por Mun : ${r.classificacao_campi.coincidentes_por_municipio} de ${r.total_campi_projeto}`);
      console.log('======================================================\n');
    })
    .catch((err) => {
      console.error('[INEP-COMPARE] Erro na comparação:', err);
      process.exit(1);
    });
}
