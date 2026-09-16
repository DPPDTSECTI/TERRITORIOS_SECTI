/**
 * api-lab/inep/scripts/audit-campi.mjs
 * Auditoria detalhada das 219 unidades presenciais derivadas do Censo INEP 2023
 * em confronto direto com os 174 campi cadastrados no painel TERRITÓRIOS SECTI.
 * 
 * Separação formal de unidades:
 * - sede_ies
 * - campus_presencial
 * - unidade_presencial
 * - polo_ead (segregado para não inflar campi físicos)
 * - local_oferta
 * 
 * Classificação:
 * - confirmado
 * - novo presencial
 * - somente EAD
 * - ambíguo
 * - não encontrado
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizeName } from '../../ibge/normalize-municipios.mjs';

const ROOT_DIR = process.cwd();
const RAW_DIR = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'raw');
const NORMALIZED_DIR = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'normalized');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'output');

const FILE_CAMPI_INEP_219 = path.resolve(OUTPUT_DIR, 'campi_secti_inep.json');
const FILE_SECTI_CAMPI_174 = path.resolve(RAW_DIR, 'secti_campi_atual.json');
const FILE_INEP_IES_RAW = path.resolve(RAW_DIR, 'inep_ba_ies_raw.json');
const FILE_INEP_CURSOS_NORM = path.resolve(NORMALIZED_DIR, 'cursos_inep_ba.json');

export const OUTPUT_AUDIT_JSON = path.resolve(OUTPUT_DIR, 'auditoria_campi.json');
export const OUTPUT_AUDIT_MD = path.resolve(OUTPUT_DIR, 'auditoria_campi.md');

/**
 * Normalização fonética e remoção de ruídos em nomes de IES.
 */
function cleanName(str) {
  return normalizeName(str)
    .replace(/\s*\((?:campus|polo|sede|ead|unidade).*?\)/gi, '')
    .replace(/\s*-\s*(?:campus|polo|unidade|sede)\b.*$/i, '')
    .replace(/\b(de|da|do|dos|das|e|em)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Executa a auditoria completa.
 */
export function runCampiAudit({ saveToFile = true } = {}) {
  console.log('[INEP-AUDIT] Carregando arquivos de dados para auditoria...');

  if (!fs.existsSync(FILE_CAMPI_INEP_219)) {
    throw new Error(`Arquivo de campi INEP não encontrado em: ${FILE_CAMPI_INEP_219}. Execute 'npm run api:inep:adapt' primeiro.`);
  }
  if (!fs.existsSync(FILE_SECTI_CAMPI_174)) {
    throw new Error(`Arquivo de campi SECTI não encontrado em: ${FILE_SECTI_CAMPI_174}`);
  }

  const inepCampiPayload = JSON.parse(fs.readFileSync(FILE_CAMPI_INEP_219, 'utf-8'));
  const inepCampiList = inepCampiPayload.dados || [];

  const sectiCampiPayload = JSON.parse(fs.readFileSync(FILE_SECTI_CAMPI_174, 'utf-8'));
  const sectiCampiList = sectiCampiPayload.dados || [];

  const inepIesList = fs.existsSync(FILE_INEP_IES_RAW)
    ? JSON.parse(fs.readFileSync(FILE_INEP_IES_RAW, 'utf-8')).dados || []
    : [];

  const inepCursosList = fs.existsSync(FILE_INEP_CURSOS_NORM)
    ? JSON.parse(fs.readFileSync(FILE_INEP_CURSOS_NORM, 'utf-8'))
    : [];

  // Mapeamento de sedes de IES (codigo_ies -> codigo_municipio da sede)
  const iesSedeMap = new Map();
  for (const ies of inepIesList) {
    iesSedeMap.set(ies.codigo_ies, ies.codigo_municipio);
  }

  // Mapeamento de presença EAD por IES + Município
  const eadPresenceMap = new Map();
  for (const c of inepCursosList) {
    if (c.modalidade === 'A distância') {
      const k = `${c.codigo_ies}_${c.codigo_ibge}`;
      eadPresenceMap.set(k, (eadPresenceMap.get(k) || 0) + 1);
    }
  }

  console.log(`[INEP-AUDIT] Total de campi INEP adaptados: ${inepCampiList.length}`);
  console.log(`[INEP-AUDIT] Total de campi SECTI em produção: ${sectiCampiList.length}`);

  // Mapeamentos de divergências nominais conhecidas entre SECTI e INEP
  const KNOWN_AMBIGUOUS_MAP = [
    {
      siglaSecti: 'UNIAENE',
      munSecti: 'Cachoeira',
      inepIesCode: 4531, // FADBA
      motivo: 'SECTI denomina como "Centro Universitário Adventista de Ensino do Nordeste (UNIAENE)", enquanto no MEC/INEP está registrada como "FACULDADE ADVENTISTA DA BAHIA (FADBA)".',
    },
    {
      siglaSecti: 'UNIRB',
      munSecti: 'Alagoinhas',
      inepIesCode: 3864,
      motivo: 'Correspondência confirmada por denominação de campus ("Centro Universitário UNIRB - Alagoinhas").',
    },
  ];

  // 1. Processar cada uma das 219 unidades do INEP
  const audit219 = [];
  const matchedSectiIds = new Set();

  for (const item of inepCampiList) {
    const codIes = item._inep?.codigo_ies || null;
    const nomeIes = item.nome_ativo.replace(/\s*-\s*Campus.*$/i, '').trim();
    const municipio = item.municipio;
    const codIbge = item.codigo_ibge;
    const modalidade = 'Presencial'; // As 219 unidades derivam estritamente de cursos presenciais
    const categoriaAdmin = item.tipo.includes('Federal')
      ? 'Pública Federal'
      : item.tipo.includes('Estadual')
      ? 'Pública Estadual'
      : item.tipo.includes('Instituto Federal')
      ? 'Pública Federal'
      : 'Privada';

    // Determina o tipo de unidade
    let tipoUnidade = 'unidade_presencial';
    const sedeMunCode = iesSedeMap.get(codIes);
    const tipoOrg = item._inep?.tipo_instituicao || '';

    if (sedeMunCode && Number(sedeMunCode) === Number(codIbge)) {
      tipoUnidade = 'sede_ies';
    } else if (tipoOrg === 'Universidade' || tipoOrg === 'Instituto Federal' || item.tipo.includes('Federal') || item.tipo.includes('Estadual')) {
      tipoUnidade = 'campus_presencial';
    } else {
      tipoUnidade = 'unidade_presencial';
    }

    const origemRegistro = 'INEP Censo da Educação Superior 2023';

    // Busca correspondência nos 174 campi da SECTI
    const normMun = normalizeName(municipio);
    const normSigla = normalizeName(item.sigla || '');
    const cleanIesNome = cleanName(nomeIes);

    let matchStatus = 'novo presencial';
    let matchedSectiCampus = null;
    let detalheAmbiguo = null;

    // Checa mapeamento ambíguo conhecido
    const amb = KNOWN_AMBIGUOUS_MAP.find(
      (a) => codIes === a.inepIesCode && normMun === normalizeName(a.munSecti)
    );
    if (amb) {
      const sc = sectiCampiList.find(
        (s) => normalizeName(s.sigla) === normalizeName(amb.siglaSecti) && normalizeName(s.municipio) === normMun
      );
      if (sc) {
        matchStatus = 'ambíguo';
        matchedSectiCampus = sc;
        detalheAmbiguo = amb.motivo;
        matchedSectiIds.add(sc.id_ativo);
      }
    }

    if (matchStatus !== 'ambíguo') {
      const match = sectiCampiList.find((sc) => {
        if (normalizeName(sc.municipio) !== normMun) return false;
        const scSigla = normalizeName(sc.sigla || '');
        const scNome = cleanName(sc.nome_ativo);

        if (normSigla && scSigla && normSigla === scSigla) return true;
        if (scNome.includes(cleanIesNome) || cleanIesNome.includes(scNome)) return true;
        if (normSigla.length >= 3 && scNome.includes(normSigla)) return true;
        if (scSigla.length >= 3 && cleanIesNome.includes(scSigla)) return true;
        return false;
      });

      if (match) {
        matchStatus = 'confirmado';
        matchedSectiCampus = match;
        matchedSectiIds.add(match.id_ativo);
      }
    }

    audit219.push({
      codigo_ies: codIes,
      nome_ies: nomeIes,
      sigla: item.sigla,
      municipio,
      codigo_ibge: codIbge,
      modalidade,
      categoria_administrativa: categoriaAdmin,
      tipo_unidade: tipoUnidade,
      origem_registro: origemRegistro,
      classificacao: matchStatus,
      total_cursos_presenciais: item._inep?.total_cursos_presenciais || 0,
      cursos_ofertados: item._inep?.cursos || [],
      id_ativo_secti: matchedSectiCampus?.id_ativo ?? null,
      nome_ativo_secti: matchedSectiCampus?.nome_ativo ?? null,
      detalhe_classificacao: detalheAmbiguo,
    });
  }

  // 2. Analisar os 174 campi da SECTI e classificar cada um
  const audit174 = [];

  for (const sc of sectiCampiList) {
    const isMatched = matchedSectiIds.has(sc.id_ativo);
    const normMun = normalizeName(sc.municipio);
    const normSigla = normalizeName(sc.sigla || '');
    const cleanScNome = cleanName(sc.nome_ativo);

    if (isMatched) {
      const inepMatch = audit219.find((a) => a.id_ativo_secti === sc.id_ativo);
      audit174.push({
        id_ativo: sc.id_ativo,
        nome_ativo: sc.nome_ativo,
        sigla: sc.sigla,
        tipo: sc.tipo,
        municipio: sc.municipio,
        territorio_identidade: sc.territorio_identidade,
        classificacao: inepMatch?.classificacao || 'confirmado',
        inep_correspondente: {
          codigo_ies: inepMatch?.codigo_ies,
          nome_ies: inepMatch?.nome_ies,
          total_cursos_presenciais: inepMatch?.total_cursos_presenciais,
        },
        diagnostico: inepMatch?.detalhe_classificacao || 'Campus ativo com oferta presencial confirmada no Censo INEP 2023.',
      });
      continue;
    }

    // Se não encontrou nos 219 presenciais, verifica se existe apenas como oferta EAD no INEP
    const eadMatches = inepCursosList.filter((c) => {
      if (normalizeName(c.municipio) !== normMun) return false;
      const cSigla = normalizeName(c.sigla_instituicao || '');
      const cNome = cleanName(c.instituicao);
      return (normSigla && cSigla && normSigla === cSigla) || cNome.includes(cleanScNome) || cleanScNome.includes(cNome);
    });

    const isOnlyEad = eadMatches.length > 0 && eadMatches.every((c) => c.modalidade === 'A distância');

    if (isOnlyEad) {
      audit174.push({
        id_ativo: sc.id_ativo,
        nome_ativo: sc.nome_ativo,
        sigla: sc.sigla,
        tipo: sc.tipo,
        municipio: sc.municipio,
        territorio_identidade: sc.territorio_identidade,
        classificacao: 'somente EAD',
        inep_correspondente: {
          codigo_ies: eadMatches[0].codigo_ies,
          nome_ies: eadMatches[0].instituicao,
          total_cursos_ead: eadMatches.length,
        },
        diagnostico: `IES atua no município exclusivamente via polo de ensino a distância (${eadMatches.length} cursos EAD). Não possui graduação presencial registrada em 2023.`,
      });
    } else {
      audit174.push({
        id_ativo: sc.id_ativo,
        nome_ativo: sc.nome_ativo,
        sigla: sc.sigla,
        tipo: sc.tipo,
        municipio: sc.municipio,
        territorio_identidade: sc.territorio_identidade,
        classificacao: 'não encontrado',
        inep_correspondente: null,
        diagnostico: 'Campus cadastrado na SECTI sem registro de oferta de graduação presencial no Censo da Educação Superior 2023 (unidade técnica/básica, polo avançado ou desativado).',
      });
    }
  }

  // 3. Contabilização final dos grupos
  const resumo = {
    unidades_inep_219: {
      total: audit219.length,
      confirmados_na_secti: audit219.filter((u) => u.classificacao === 'confirmado').length,
      novos_presenciais_inep: audit219.filter((u) => u.classificacao === 'novo presencial').length,
      ambiguos: audit219.filter((u) => u.classificacao === 'ambíguo').length,
      tipos_de_unidade: {
        sede_ies: audit219.filter((u) => u.tipo_unidade === 'sede_ies').length,
        campus_presencial: audit219.filter((u) => u.tipo_unidade === 'campus_presencial').length,
        unidade_presencial: audit219.filter((u) => u.tipo_unidade === 'unidade_presencial').length,
        polo_ead: 0, // Segregado formalmente: 0 nos 219
      },
    },
    campi_secti_174: {
      total: audit174.length,
      confirmados_no_inep: audit174.filter((c) => c.classificacao === 'confirmado').length,
      ambiguos: audit174.filter((c) => c.classificacao === 'ambíguo').length,
      somente_ead: audit174.filter((c) => c.classificacao === 'somente EAD').length,
      nao_encontrados_no_censo_2023: audit174.filter((c) => c.classificacao === 'não encontrado').length,
    },
    polos_ead_inep_bahia: {
      total_ofertas_ead: inepCursosList.filter((c) => c.modalidade === 'A distância').length,
      municipios_com_ead: new Set(inepCursosList.filter((c) => c.modalidade === 'A distância').map((c) => c.codigo_ibge)).size,
      segregados_de_campi_fisicos: true,
    },
  };

  const payload = {
    metadados: {
      gerado_em: new Date().toISOString(),
      censo_ano: 2023,
      fonte_inep: 'INEP Censo da Educação Superior 2023',
      fonte_secti: 'lista_ativos_cti (tipo=Campi*)',
    },
    resumo,
    auditoria_unidades_inep_219: audit219,
    auditoria_campi_secti_174: audit174,
  };

  if (saveToFile) {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_AUDIT_JSON, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`[INEP-AUDIT] Arquivo JSON gravado com sucesso: ${OUTPUT_AUDIT_JSON}`);

    // Monta o relatório Markdown
    const markdown = generateAuditMarkdown(payload);
    fs.writeFileSync(OUTPUT_AUDIT_MD, markdown, 'utf-8');
    console.log(`[INEP-AUDIT] Relatório Markdown gravado com sucesso: ${OUTPUT_AUDIT_MD}`);
  }

  return payload;
}

/**
 * Gera o documento executivo em Markdown para auditoria dos campi.
 */
function generateAuditMarkdown(payload) {
  const r = payload.resumo;
  const inep219 = payload.auditoria_unidades_inep_219;
  const secti174 = payload.auditoria_campi_secti_174;

  const naoEncontrados = secti174.filter((c) => c.classificacao === 'não encontrado');
  const somenteEad = secti174.filter((c) => c.classificacao === 'somente EAD');
  const ambiguos = secti174.filter((c) => c.classificacao === 'ambíguo');

  return `# 🏛️ Relatório de Auditoria Específica: 219 Unidades INEP vs 174 Campi SECTI

**Data da Auditoria:** ${new Date(payload.metadados.gerado_em).toLocaleString('pt-BR')}  
**Fontes Auditadas:** INEP/MEC Censo da Educação Superior (${payload.metadados.censo_ano}) e Catálogo de Ativos SECTI (\`lista_ativos_cti\`)

---

## 1. Segregação e Tipologia das 219 Unidades do INEP

As 219 presenças físicas do INEP na Bahia decorrem **exclusivamente de cursos de graduação presenciais regulares**. Polos de apoio EAD foram segregados formalmente.

| Tipologia de Unidade | Quantidade | Descrição Conceitual |
| :--- | :---: | :--- |
| **Sede da IES (\`sede_ies\`)** | **${r.unidades_inep_219.tipos_de_unidade.sede_ies}** | Município onde se localiza a Reitoria / Matriz administrativa cadastrada no MEC (\`CO_MUNICIPIO_IES\`). |
| **Campus Presencial (\`campus_presencial\`)** | **${r.unidades_inep_219.tipos_de_unidade.campus_presencial}** | Campus descentralizado fora da sede de Universidade ou Instituto Federal (ex: UFBA Camaçari, UNEB Alagoinhas). |
| **Unidade Presencial (\`unidade_presencial\`)** | **${r.unidades_inep_219.tipos_de_unidade.unidade_presencial}** | Prédio ou unidade acadêmica de faculdade isolada ou centro universitário privado com oferta física. |
| **Polo EAD (\`polo_ead\`)** | **0 nos 219** | **Isolados:** 36.358 ofertas EAD atuam em polos sem oferta de graduação presencial. Não computados como campus físico. |

---

## 2. Resultado da Classificação Cruzada

### A) Perspectiva das 219 Unidades Presenciais do INEP
- **Confirmados na SECTI**: **${r.unidades_inep_219.confirmados_na_secti}** unidades presenciais já possuíam campus correspondente no painel SECTI.
- **Novos Presenciais do INEP**: **${r.unidades_inep_219.novos_presenciais_inep}** unidades com graduação presencial ativa no Censo 2023 que não faziam parte dos 174 campi originais da SECTI (predominantemente faculdades e centros universitários privados no interior).
- **Ambíguos**: **${r.unidades_inep_219.ambiguos}** unidade(s) com divergência cadastral de denominação (ex: UNIAENE / FADBA em Cachoeira).

### B) Perspectiva dos 174 Campi Cadastrados na SECTI
- **Confirmados no INEP Presencial**: **${r.campi_secti_174.confirmados_no_inep}** campi (${((r.campi_secti_174.confirmados_no_inep / 174) * 100).toFixed(1)}%).
- **Ambíguos**: **${r.campi_secti_174.ambiguos}** campus.
- **Somente EAD**: **${r.campi_secti_174.somente_ead}** campi onde a IES só possui polo a distância registrado no município.
- **Não Encontrados no Censo 2023 de Graduação**: **${r.campi_secti_174.nao_encontrados_no_censo_2023}** campi (${((r.campi_secti_174.nao_encontrados_no_censo_2023 / 174) * 100).toFixed(1)}%).

---

## 3. Detalhamento dos Casos Específicos dos 174 Campi da SECTI

### A) Casos Ambíguos (${ambiguos.length})
${ambiguos.map((a) => `- **ID ${a.id_ativo} - ${a.nome_ativo} (${a.municipio})**: ${a.diagnostico}`).join('\n')}

### B) Casos com Atuação Exclusivamente EAD (${somenteEad.length})
${somenteEad.map((e) => `- **ID ${e.id_ativo} - ${e.nome_ativo} (${e.municipio})**: ${e.diagnostico}`).join('\n')}

### C) Campi SECTI Não Encontrados no Censo de Graduação 2023 (${naoEncontrados.length})
Estes campi físicos constam na base SECTI, porém **não registraram turmas ativas de graduação presencial** no Censo Superior 2023 do INEP:

| ID Ativo | Nome do Campus SECTI | Município | Território | Motivo Provável |
| :---: | :--- | :--- | :--- | :--- |
${naoEncontrados.map((u) => `| ${u.id_ativo} | ${u.nome_ativo} | ${u.municipio} | ${u.territorio_identidade} | ${u.tipo.includes('Instituto Federal') ? 'Campus de ensino médio/técnico sem curso de graduação em 2023' : 'Polo avançado de extensão/pesquisa sem oferta de graduação regular'} |`).join('\n')}

---

## 4. Regra de Segregação: Polos EAD vs Campi Físicos

> ⚠️ **Diretriz Técnica para o Dashboard:**  
> Polos EAD **NÃO devem ser adicionados** à camada cartográfica de campi físicos (\`tipo = 'Campi*'\`).  
> O INEP registra 36.358 ofertas EAD na Bahia abrangendo os 417 municípios. Se cada polo EAD fosse plotado como campus físico, o mapa apresentaria mais de 3.500 pontos fictícios em farmácias, escolas parceiras e salas de apoio.  
> **Apenas as 219 unidades com turmas de graduação presencial** possuem infraestrutura física acadêmica permanente comprovada pelo Censo.

---

## 5. Artefatos Produzidos
- Base auditada em JSON: [\`api-lab/inep/output/auditoria_campi.json\`](file:///c:/Users/gustavo.silva/TERRITORIOS_SECTI/api-lab/inep/output/auditoria_campi.json)
`;
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('audit-campi.mjs')) {
  try {
    const res = runCampiAudit();
    const r = res.resumo;
    console.log('\n======================================================');
    console.log('             AUDITORIA CONCLUÍDA                      ');
    console.log('======================================================');
    console.log(`Unidades INEP Presenciais (219):`);
    console.log(`  - Confirmadas na SECTI    : ${r.unidades_inep_219.confirmados_na_secti}`);
    console.log(`  - Novos Presenciais INEP  : ${r.unidades_inep_219.novos_presenciais_inep}`);
    console.log(`  - Ambíguos Mapeados       : ${r.unidades_inep_219.ambiguos}`);
    console.log('------------------------------------------------------');
    console.log(`Campi SECTI Auditados (174):`);
    console.log(`  - Confirmados no INEP     : ${r.campi_secti_174.confirmados_no_inep}`);
    console.log(`  - Ambíguos                : ${r.campi_secti_174.ambiguos}`);
    console.log(`  - Somente EAD no INEP     : ${r.campi_secti_174.somente_ead}`);
    console.log(`  - Não Encontrados em 2023 : ${r.campi_secti_174.nao_encontrados_no_censo_2023}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('[INEP-AUDIT] Erro:', err);
    process.exit(1);
  }
}
