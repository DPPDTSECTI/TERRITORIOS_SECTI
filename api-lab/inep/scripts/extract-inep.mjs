/**
 * api-lab/inep/scripts/extract-inep.mjs
 * Extrai os microdados brutos do Censo da Educação Superior do INEP (Edição 2023)
 * aplicando filtro estrito para o Estado da Bahia (UF = BA / CO_UF = 29).
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import AdmZip from 'adm-zip';

export const INEP_YEAR = 2023;
export const INEP_DOWNLOAD_URL = `https://download.inep.gov.br/microdados/microdados_censo_da_educacao_superior_${INEP_YEAR}.zip`;

const ROOT_DIR = process.cwd();
const RAW_DIR = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'raw');
const SCRATCH_ZIP = path.resolve(ROOT_DIR, 'scratch', `inep_${INEP_YEAR}_test.zip`);
const LOCAL_ZIP_PATH = fs.existsSync(SCRATCH_ZIP) ? SCRATCH_ZIP : path.resolve(RAW_DIR, `inep_${INEP_YEAR}.zip`);

export const OUTPUT_CURSOS_RAW = path.resolve(RAW_DIR, 'inep_ba_cursos_raw.json');
export const OUTPUT_IES_RAW = path.resolve(RAW_DIR, 'inep_ba_ies_raw.json');

/**
 * Garante que o arquivo ZIP oficial do INEP está disponível localmente.
 * Faz download apenas se não existir.
 */
export async function ensureInepZip() {
  if (fs.existsSync(LOCAL_ZIP_PATH)) {
    console.log(`[INEP-EXTRACT] Usando ZIP local existente: ${LOCAL_ZIP_PATH}`);
    return LOCAL_ZIP_PATH;
  }

  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }

  console.log(`[INEP-EXTRACT] Baixando microdados do INEP (${INEP_YEAR}): ${INEP_DOWNLOAD_URL}...`);
  const tempZipPath = path.resolve(RAW_DIR, `inep_${INEP_YEAR}_temp.zip`);
  const file = fs.createWriteStream(tempZipPath);

  await new Promise((resolve, reject) => {
    https.get(INEP_DOWNLOAD_URL, { rejectUnauthorized: false }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Falha no download do INEP: HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(tempZipPath, () => {});
      reject(err);
    });
  });

  fs.renameSync(tempZipPath, LOCAL_ZIP_PATH);
  console.log(`[INEP-EXTRACT] Download concluído: ${LOCAL_ZIP_PATH}`);
  return LOCAL_ZIP_PATH;
}

/**
 * Executa a extração dos dados de IES e Cursos da Bahia a partir do ZIP.
 */
export async function extractInepData() {
  const zipPath = await ensureInepZip();
  console.log(`[INEP-EXTRACT] Abrindo arquivo ZIP: ${zipPath}...`);
  const zip = new AdmZip(zipPath);

  // 1. Extração das IES da Bahia
  console.log(`[INEP-EXTRACT] Processando dados cadastrais de IES...`);
  const iesEntry = zip.getEntries().find((e) => e.entryName.endsWith(`MICRODADOS_ED_SUP_IES_${INEP_YEAR}.CSV`));
  if (!iesEntry) {
    throw new Error(`Arquivo MICRODADOS_ED_SUP_IES_${INEP_YEAR}.CSV não encontrado no pacote do INEP.`);
  }

  const iesText = zip.readAsText(iesEntry, 'latin1');
  const iesLines = iesText.split('\n');
  const iesHeader = iesLines[0].split(';').map((h) => h.trim());

  const idxCoIes = iesHeader.indexOf('CO_IES');
  const idxNoIes = iesHeader.indexOf('NO_IES');
  const idxSgIes = iesHeader.indexOf('SG_IES');
  const idxTpOrg = iesHeader.indexOf('TP_ORGANIZACAO_ACADEMICA');
  const idxTpCat = iesHeader.indexOf('TP_CATEGORIA_ADMINISTRATIVA');
  const idxCoMunIes = iesHeader.indexOf('CO_MUNICIPIO_IES');
  const idxNoMunIes = iesHeader.indexOf('NO_MUNICIPIO_IES');
  const idxSgUfIes = iesHeader.indexOf('SG_UF_IES');
  const idxCoUfIes = iesHeader.indexOf('CO_UF_IES');

  const iesMap = new Map();
  const baIesList = [];

  for (let i = 1; i < iesLines.length; i++) {
    const line = iesLines[i];
    if (!line || line.length < 10) continue;
    const parts = line.split(';');

    const coIes = parts[idxCoIes]?.trim();
    const noIes = parts[idxNoIes]?.trim();
    const sgIes = parts[idxSgIes]?.trim() || '';
    const tpOrg = parts[idxTpOrg]?.trim();
    const tpCat = parts[idxTpCat]?.trim();
    const coMunIes = parts[idxCoMunIes]?.trim();
    const noMunIes = parts[idxNoMunIes]?.trim();
    const sgUfIes = parts[idxSgUfIes]?.trim();
    const coUfIes = parts[idxCoUfIes]?.trim();

    // Indexa todas as IES para enriquecimento dos cursos
    iesMap.set(coIes, {
      coIes,
      noIes,
      sgIes,
      tpOrg,
      tpCat,
      coMunIes,
      noMunIes,
      sgUfIes,
      coUfIes,
    });

    // Filtra IES com sede na Bahia
    if (sgUfIes === 'BA' || coUfIes === '29') {
      baIesList.push({
        codigo_ies: Number(coIes),
        nome_ies: noIes,
        sigla_ies: sgIes,
        tipo_organizacao_academica: Number(tpOrg),
        categoria_administrativa: Number(tpCat),
        codigo_municipio: Number(coMunIes),
        municipio: noMunIes,
        uf: 'BA',
      });
    }
  }

  console.log(`[INEP-EXTRACT] IES catalogadas nacionalmente: ${iesMap.size} | IES com sede na Bahia: ${baIesList.length}`);

  // 2. Extração dos Cursos da Bahia (Presenciais e EAD ofertados na BA)
  console.log(`[INEP-EXTRACT] Processando dados de cursos superiores...`);
  const cursoEntry = zip.getEntries().find((e) => e.entryName.endsWith(`MICRODADOS_CADASTRO_CURSOS_${INEP_YEAR}.CSV`));
  if (!cursoEntry) {
    throw new Error(`Arquivo MICRODADOS_CADASTRO_CURSOS_${INEP_YEAR}.CSV não encontrado no pacote do INEP.`);
  }

  const cursoBuf = cursoEntry.getData();
  const baCursosList = [];

  let pos = 0;
  let lineStart = 0;
  let cursoHeader = null;

  let idxC_Ano, idxC_SgUf, idxC_CoUf, idxC_NoMun, idxC_CoMun, idxC_TpOrg, idxC_TpCat, idxC_CoIes, idxC_NoCurso, idxC_CoCurso;
  let idxC_NoCineRotulo, idxC_NoCineAreaGeral, idxC_TpGrau, idxC_TpModalidade;

  while (pos < cursoBuf.length) {
    if (cursoBuf[pos] === 10) { // newline (\n)
      const line = cursoBuf.subarray(lineStart, pos).toString('latin1').trim();
      lineStart = pos + 1;

      if (!cursoHeader) {
        cursoHeader = line.split(';').map((h) => h.trim());
        idxC_Ano = cursoHeader.indexOf('NU_ANO_CENSO');
        idxC_SgUf = cursoHeader.indexOf('SG_UF');
        idxC_CoUf = cursoHeader.indexOf('CO_UF');
        idxC_NoMun = cursoHeader.indexOf('NO_MUNICIPIO');
        idxC_CoMun = cursoHeader.indexOf('CO_MUNICIPIO');
        idxC_TpOrg = cursoHeader.indexOf('TP_ORGANIZACAO_ACADEMICA');
        idxC_TpCat = cursoHeader.indexOf('TP_CATEGORIA_ADMINISTRATIVA');
        idxC_CoIes = cursoHeader.indexOf('CO_IES');
        idxC_NoCurso = cursoHeader.indexOf('NO_CURSO');
        idxC_CoCurso = cursoHeader.indexOf('CO_CURSO');
        idxC_NoCineRotulo = cursoHeader.indexOf('NO_CINE_ROTULO');
        idxC_NoCineAreaGeral = cursoHeader.indexOf('NO_CINE_AREA_GERAL');
        idxC_TpGrau = cursoHeader.indexOf('TP_GRAU_ACADEMICO');
        idxC_TpModalidade = cursoHeader.indexOf('TP_MODALIDADE_ENSINO');
      } else if (line.length > 20) {
        // Checagem rápida de UF antes de quebrar colunas
        if (line.includes(';BA;') || line.includes(';29;')) {
          const parts = line.split(';');
          const sgUf = parts[idxC_SgUf]?.trim();
          const coUf = parts[idxC_CoUf]?.trim();

          if (sgUf === 'BA' || coUf === '29') {
            const coIes = parts[idxC_CoIes]?.trim();
            const iesInfo = iesMap.get(coIes) || {};

            baCursosList.push({
              ano_censo: Number(parts[idxC_Ano]),
              codigo_ies: Number(coIes),
              nome_ies: iesInfo.noIes || null,
              sigla_ies: iesInfo.sgIes || null,
              codigo_curso: Number(parts[idxC_CoCurso]),
              nome_curso: parts[idxC_NoCurso]?.trim(),
              rotulo_cine: parts[idxC_NoCineRotulo]?.trim() || null,
              area_geral_cine: parts[idxC_NoCineAreaGeral]?.trim() || null,
              tipo_organizacao_academica: Number(parts[idxC_TpOrg]),
              categoria_administrativa: Number(parts[idxC_TpCat]),
              grau_academico: Number(parts[idxC_TpGrau]),
              modalidade_ensino: Number(parts[idxC_TpModalidade]), // 1 = Presencial, 2 = EAD
              codigo_municipio: Number(parts[idxC_CoMun]),
              municipio: parts[idxC_NoMun]?.trim(),
              uf: 'BA',
            });
          }
        }
      }
    }
    pos++;
  }

  console.log(`[INEP-EXTRACT] Total de ofertas de cursos na Bahia extraídas: ${baCursosList.length}`);

  // 3. Salvar os arquivos brutos com metadados
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }

  const payloadIes = {
    metadados: {
      fonte: 'INEP - Censo da Educação Superior',
      ano_censo: INEP_YEAR,
      arquivo_fonte: `MICRODADOS_ED_SUP_IES_${INEP_YEAR}.CSV`,
      data_extracao: new Date().toISOString(),
      filtro: 'SG_UF_IES = BA OU CO_UF_IES = 29',
      total_registros: baIesList.length,
    },
    dados: baIesList,
  };

  const payloadCursos = {
    metadados: {
      fonte: 'INEP - Censo da Educação Superior',
      ano_censo: INEP_YEAR,
      arquivo_fonte: `MICRODADOS_CADASTRO_CURSOS_${INEP_YEAR}.CSV`,
      data_extracao: new Date().toISOString(),
      filtro: 'SG_UF = BA OU CO_UF = 29',
      total_registros: baCursosList.length,
      resumo_modalidade: {
        presencial: baCursosList.filter((c) => c.modalidade_ensino === 1).length,
        ead: baCursosList.filter((c) => c.modalidade_ensino === 2).length,
      },
    },
    dados: baCursosList,
  };

  fs.writeFileSync(OUTPUT_IES_RAW, JSON.stringify(payloadIes, null, 2), 'utf-8');
  fs.writeFileSync(OUTPUT_CURSOS_RAW, JSON.stringify(payloadCursos, null, 2), 'utf-8');

  console.log(`[INEP-EXTRACT] Arquivos brutos salvos com sucesso:`);
  console.log(`  - ${OUTPUT_IES_RAW}`);
  console.log(`  - ${OUTPUT_CURSOS_RAW}`);

  return { ies: baIesList, cursos: baCursosList };
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('extract-inep.mjs')) {
  extractInepData()
    .then(({ ies, cursos }) => {
      console.log(`\n[INEP-EXTRACT] ✓ Extração concluída com sucesso!`);
      console.log(`  - IES da Bahia: ${ies.length}`);
      console.log(`  - Cursos na Bahia: ${cursos.length} (Presenciais: ${cursos.filter((c) => c.modalidade_ensino === 1).length}, EAD: ${cursos.filter((c) => c.modalidade_ensino === 2).length})\n`);
    })
    .catch((err) => {
      console.error('[INEP-EXTRACT] Erro na extração:', err);
      process.exit(1);
    });
}
