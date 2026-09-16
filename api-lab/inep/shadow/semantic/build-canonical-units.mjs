/**
 * api-lab/inep/shadow/semantic/build-canonical-units.mjs
 * ETAPA 2.7 — CONSTRUÇÃO DO MODELO CANÔNICO DE UNIDADES TERRITORIAIS
 * 
 * Camada semântica única para representar ativos de ensino superior, técnico,
 * pesquisa/extensão, órgãos administrativos e polos EAD, sem alterar dados de produção.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminhos dos arquivos de entrada
const FILE_CAMPI_SHADOW = path.resolve(__dirname, '../campi_shadow_secti.json');
const FILE_RECONCILIACAO = path.resolve(__dirname, '../../output/reconciliacao_campi.json');
const FILE_SCHEMA = path.resolve(__dirname, 'unidade-canonica.schema.json');

// Caminhos dos arquivos de saída
const FILE_CANONICAL_JSON = path.resolve(__dirname, 'canonical-units.json');
const FILE_KPIS_JSON = path.resolve(__dirname, 'semantic-kpis.json');
const FILE_REPORT_MD = path.resolve(__dirname, 'semantic-report.md');

/**
 * Validador leve contra o schema unidade-canonica.schema.json
 */
function validateCanonicalUnit(unit, index) {
  const errors = [];

  if (unit.id_ativo !== null && typeof unit.id_ativo !== 'number') {
    errors.push(`[${index}] id_ativo deve ser number ou null`);
  }
  if (typeof unit.codigo_ibge !== 'number' || !String(unit.codigo_ibge).startsWith('29') || String(unit.codigo_ibge).length !== 7) {
    errors.push(`[${index}] codigo_ibge inválido: ${unit.codigo_ibge}`);
  }
  if (unit.codigo_ies !== null && typeof unit.codigo_ies !== 'number') {
    errors.push(`[${index}] codigo_ies deve ser number ou null`);
  }
  if (typeof unit.nome !== 'string' || !unit.nome.trim()) {
    errors.push(`[${index}] nome obrigatório`);
  }
  if (typeof unit.municipio !== 'string' || !unit.municipio.trim()) {
    errors.push(`[${index}] municipio obrigatório`);
  }
  if (typeof unit.id_territorio !== 'number' || unit.id_territorio < 1 || unit.id_territorio > 27) {
    errors.push(`[${index}] id_territorio fora do intervalo 1-27: ${unit.id_territorio}`);
  }
  if (typeof unit.territorio_identidade !== 'string' || !unit.territorio_identidade.trim()) {
    errors.push(`[${index}] territorio_identidade obrigatório`);
  }
  if (typeof unit.latitude !== 'number' || isNaN(unit.latitude)) {
    errors.push(`[${index}] latitude numérica obrigatória`);
  }
  if (typeof unit.longitude !== 'number' || isNaN(unit.longitude)) {
    errors.push(`[${index}] longitude numérica obrigatória`);
  }

  const validTipos = [
    'ensino_superior_presencial',
    'ensino_tecnico',
    'pesquisa_extensao',
    'administrativo',
    'ead',
    'ambigua',
    'inativa'
  ];
  if (!validTipos.includes(unit.tipo_unidade)) {
    errors.push(`[${index}] tipo_unidade inválido: ${unit.tipo_unidade}`);
  }

  if (typeof unit.presenca_fisica !== 'boolean') {
    errors.push(`[${index}] presenca_fisica deve ser booleano`);
  }
  if (typeof unit.oferta_presencial !== 'boolean') {
    errors.push(`[${index}] oferta_presencial deve ser booleano`);
  }
  if (!Array.isArray(unit.nivel_ensino)) {
    errors.push(`[${index}] nivel_ensino deve ser array`);
  }
  if (unit.modalidade !== null && typeof unit.modalidade !== 'string') {
    errors.push(`[${index}] modalidade deve ser string ou null`);
  }

  const validOrigens = ['secti', 'inep', 'secti_inep'];
  if (!validOrigens.includes(unit.origem)) {
    errors.push(`[${index}] origem inválida: ${unit.origem}`);
  }
  if (typeof unit.status_reconciliacao !== 'string') {
    errors.push(`[${index}] status_reconciliacao obrigatório`);
  }
  if (typeof unit.ativo !== 'boolean') {
    errors.push(`[${index}] ativo deve ser booleano`);
  }

  return errors;
}

export function buildCanonicalUnits({ saveToFile = true } = {}) {
  console.log('[CANONICAL] Iniciando compilação do modelo canônico de unidades territoriais...');

  if (!fs.existsSync(FILE_CAMPI_SHADOW)) {
    throw new Error(`Arquivo shadow de campi não encontrado: ${FILE_CAMPI_SHADOW}`);
  }
  if (!fs.existsSync(FILE_RECONCILIACAO)) {
    throw new Error(`Arquivo de reconciliação não encontrado: ${FILE_RECONCILIACAO}`);
  }

  const shadowData = JSON.parse(fs.readFileSync(FILE_CAMPI_SHADOW, 'utf-8')).dados || [];
  const reconciliacaoData = JSON.parse(fs.readFileSync(FILE_RECONCILIACAO, 'utf-8'));
  const secti174Rec = reconciliacaoData.classificacao_secti_174 || [];

  // Mapeamento por id_ativo para obter a reconciliação original
  const recMapBySectiId = new Map();
  for (const s of secti174Rec) {
    recMapBySectiId.set(s.id_ativo, s);
  }

  const canonicalUnits = [];
  const validationErrors = [];

  for (let i = 0; i < shadowData.length; i++) {
    const item = shadowData[i];
    const isNewInep = item.id_ativo === null;
    const sectiRec = !isNewInep ? recMapBySectiId.get(item.id_ativo) : null;

    let tipo_unidade = 'ensino_superior_presencial';
    let presenca_fisica = true;
    let oferta_presencial = true;
    let nivel_ensino = ['superior'];
    let modalidade = 'Presencial';
    let origem = 'secti_inep';
    let status_reconciliacao = item.status_reconciliacao || 'confirmada';
    let ativo = true;

    if (isNewInep) {
      // 50 novos registros exclusivos do INEP
      tipo_unidade = 'ensino_superior_presencial';
      presenca_fisica = true;
      oferta_presencial = true;
      nivel_ensino = ['superior'];
      modalidade = 'Presencial';
      origem = 'inep';
      status_reconciliacao = 'novo_presencial_inep';
      ativo = true;
    } else {
      // 174 registros herdados da SECTI
      const catSemantica = sectiRec ? sectiRec.classificacao_semantica : item.classificacao_semantica;

      switch (catSemantica) {
        case 'ensino_superior_presencial':
          tipo_unidade = 'ensino_superior_presencial';
          presenca_fisica = true;
          oferta_presencial = true;
          nivel_ensino = ['superior'];
          modalidade = 'Presencial';
          origem = 'secti_inep';
          ativo = true;
          break;

        case 'ensino_tecnico_profissionalizante':
          // Regra: ENSINO TÉCNICO: presenca_fisica = true, oferta_presencial = true, nivel_ensino inclui "tecnico"
          tipo_unidade = 'ensino_tecnico';
          presenca_fisica = true;
          oferta_presencial = true;
          nivel_ensino = ['tecnico'];
          modalidade = 'Presencial';
          origem = 'secti';
          ativo = true;
          break;

        case 'pesquisa_extensao':
          // Regra: PESQUISA/EXTENSÃO: presenca_fisica = true, oferta_presencial = false
          tipo_unidade = 'pesquisa_extensao';
          presenca_fisica = true;
          oferta_presencial = false;
          nivel_ensino = [];
          modalidade = null;
          origem = 'secti';
          ativo = true;
          break;

        case 'centro_estacao_unidade_especial':
          // Regra: ADMINISTRATIVO: presenca_fisica = true, oferta_presencial = false
          tipo_unidade = 'administrativo';
          presenca_fisica = true;
          oferta_presencial = false;
          nivel_ensino = [];
          modalidade = null;
          origem = 'secti';
          ativo = true;
          break;

        case 'ead':
          // Regra: EAD: presenca_fisica = false, oferta_presencial = false
          tipo_unidade = 'ead';
          presenca_fisica = false;
          oferta_presencial = false;
          nivel_ensino = ['superior'];
          modalidade = 'A distância';
          origem = 'secti';
          ativo = true;
          break;

        case 'ambigua':
          // Mantido com ressalva semântica
          tipo_unidade = 'ambigua';
          presenca_fisica = true;
          oferta_presencial = true;
          nivel_ensino = ['superior'];
          modalidade = 'Presencial';
          origem = 'secti_inep';
          ativo = true;
          break;

        case 'nao_localizada':
          // Regra: INATIVA: ativo = false
          tipo_unidade = 'inativa';
          presenca_fisica = false;
          oferta_presencial = false;
          nivel_ensino = [];
          modalidade = null;
          origem = 'secti';
          status_reconciliacao = 'inativa_censo_2023';
          ativo = false;
          break;

        default:
          tipo_unidade = 'ensino_superior_presencial';
          origem = 'secti_inep';
          ativo = true;
          break;
      }
    }

    const canonicalUnit = {
      id_ativo: item.id_ativo ?? null,
      codigo_ibge: Number(item.codigo_ibge),
      codigo_ies: item.codigo_ies ? Number(item.codigo_ies) : null,

      nome: item.nome_ativo || item.nome,
      nome_ies: item.nome_ies || null,
      sigla: item.sigla ? String(item.sigla).trim() : null,

      municipio: item.municipio,
      id_territorio: Number(item.id_territorio),
      territorio_identidade: item.territorio_identidade,

      latitude: Number(item.latitude),
      longitude: Number(item.longitude),

      tipo_unidade,
      presenca_fisica,
      oferta_presencial,
      nivel_ensino,
      modalidade,
      origem,
      status_reconciliacao,
      ativo
    };

    // Validação estrutural do schema
    const errors = validateCanonicalUnit(canonicalUnit, i);
    if (errors.length > 0) {
      validationErrors.push(...errors);
    }

    canonicalUnits.push(canonicalUnit);
  }

  if (validationErrors.length > 0) {
    throw new Error(`Erros de validação no modelo canônico:\n${validationErrors.join('\n')}`);
  }

  // 9. VALIDAÇÕES DE INTEGRIDADE
  const countSecti = canonicalUnits.filter(u => u.id_ativo !== null).length;
  const countInepNovo = canonicalUnits.filter(u => u.id_ativo === null).length;
  const countSemMunicipio = canonicalUnits.filter(u => !u.municipio).length;
  const countSemIbge = canonicalUnits.filter(u => !u.codigo_ibge || !String(u.codigo_ibge).startsWith('29')).length;
  const countInepNovoComId = canonicalUnits.filter(u => u.origem === 'inep' && u.id_ativo !== null).length;
  const countInativaAtiva = canonicalUnits.filter(u => u.tipo_unidade === 'inativa' && u.ativo === true).length;
  const countEadComoPresencial = canonicalUnits.filter(u => u.tipo_unidade === 'ead' && (u.presenca_fisica === true || u.oferta_presencial === true)).length;
  const countTecnicoGraduacao = canonicalUnits.filter(u => u.tipo_unidade === 'ensino_tecnico' && u.nivel_ensino.includes('superior')).length;
  const countPesquisaGraduacao = canonicalUnits.filter(u => u.tipo_unidade === 'pesquisa_extensao' && (u.oferta_presencial === true || u.nivel_ensino.includes('superior'))).length;

  if (countSecti !== 174) throw new Error(`Integridade rompida: total SECTI esperado 174, obtido ${countSecti}`);
  if (countInepNovo !== 50) throw new Error(`Integridade rompida: total INEP novo esperado 50, obtido ${countInepNovo}`);
  if (countSemMunicipio > 0) throw new Error(`Existem ${countSemMunicipio} unidades sem município!`);
  if (countSemIbge > 0) throw new Error(`Existem ${countSemIbge} unidades sem código IBGE válido!`);
  if (countInepNovoComId > 0) throw new Error(`Existem novos registros INEP com id_ativo preenchido!`);
  if (countInativaAtiva > 0) throw new Error(`Unidades inativas aparecem marcadas como ativas!`);
  if (countEadComoPresencial > 0) throw new Error(`Polos EAD aparecem com presença física ou oferta presencial!`);
  if (countTecnicoGraduacao > 0) throw new Error(`Unidades técnicas aparecem com graduação/superior!`);
  if (countPesquisaGraduacao > 0) throw new Error(`Unidades de pesquisa aparecem com oferta presencial de graduação!`);

  // 10. MÉTRICAS CONSOLIDADAS
  const total_unidades = canonicalUnits.length;
  const total_ativas = canonicalUnits.filter(u => u.ativo === true).length;
  const total_inativas = canonicalUnits.filter(u => u.ativo === false).length;
  const total_presenciais = canonicalUnits.filter(u => u.presenca_fisica === true).length;
  const total_superior_presencial_confirmado = canonicalUnits.filter(u => u.tipo_unidade === 'ensino_superior_presencial').length;
  const total_superior = canonicalUnits.filter(u => u.nivel_ensino.includes('superior')).length;
  const total_tecnico = canonicalUnits.filter(u => u.tipo_unidade === 'ensino_tecnico').length;
  const total_pesquisa = canonicalUnits.filter(u => u.tipo_unidade === 'pesquisa_extensao').length;
  const total_administrativo = canonicalUnits.filter(u => u.tipo_unidade === 'administrativo').length;
  const total_ead = canonicalUnits.filter(u => u.tipo_unidade === 'ead').length;
  const total_ambigua = canonicalUnits.filter(u => u.tipo_unidade === 'ambigua').length;

  // 11. SEMANTIC-KPIS.JSON
  const semanticKpis = {
    infraestrutura_total: total_presenciais,
    ensino_superior_presencial: total_superior_presencial_confirmado,
    ensino_tecnico: total_tecnico,
    pesquisa_extensao: total_pesquisa,
    administrativo: total_administrativo,
    ead: total_ead,
    detalhamento: {
      total_unidades,
      total_ativas,
      total_inativas,
      ambigua: total_ambigua,
      ensino_superior_total_com_ambiguas: total_superior_presencial_confirmado + total_ambigua,
      ensino_superior_com_ead: total_superior
    }
  };

  // Salvar arquivos se requisitado
  if (saveToFile) {
    fs.writeFileSync(FILE_CANONICAL_JSON, JSON.stringify({
      metadados: {
        gerado_em: new Date().toISOString(),
        etapa: '2.7 — Modelo Canônico de Unidades Territoriais',
        fonte_secti: 'lista_ativos_cti (174 registros)',
        fonte_inep: 'INEP Censo da Educação Superior 2023 (50 novos presenciais)',
        versao_schema: 'unidade-canonica.schema.json'
      },
      metricas: {
        total_unidades,
        total_ativas,
        total_inativas,
        total_presenciais,
        total_superior,
        total_superior_presencial: total_superior_presencial_confirmado,
        total_ambigua,
        total_tecnico,
        total_pesquisa,
        total_administrativo,
        total_ead
      },
      dados: canonicalUnits
    }, null, 2), 'utf-8');

    fs.writeFileSync(FILE_KPIS_JSON, JSON.stringify(semanticKpis, null, 2), 'utf-8');

    // 12. GERAÇÃO DO SEMANTIC-REPORT.MD
    const reportContent = `# ETAPA 2.7 — RELATÓRIO DO MODELO CANÔNICO DE UNIDADES TERRITORIAIS

**Data:** ${new Date().toLocaleDateString('pt-BR')}  
**Status:** VALIDADO COM SUCESSO  
**Objetivo:** Camada semântica única para representar ativos de ensino, pesquisa, extensão e EAD sem duplicidades e sem alterar dados de produção.

---

## 1. Taxonomia Canônica Definitiva

| Categoria Canônica (\`tipo_unidade\`) | Presença Física | Oferta Presencial | Nível de Ensino | Ativo | Quantidade | Descrição Semântica |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **\`ensino_superior_presencial\`** | Sim (\`true\`) | Sim (\`true\`) | \`['superior']\` | \`true\` | **${total_superior_presencial_confirmado}** | 154 campi confirmados SECTI + 50 novas presenças físicas INEP |
| **\`ensino_tecnico\`** | Sim (\`true\`) | Sim (\`true\`) | \`['tecnico']\` | \`true\` | **${total_tecnico}** | Campi de IFBA e IF Baiano que ofertam exclusivamente educação profissional |
| **\`pesquisa_extensao\`** | Sim (\`true\`) | Não (\`false\`) | \`[]\` | \`true\` | **${total_pesquisa}** | Centros avançados de pesquisa e extensão (ex: UNEB Canudos e Jeremoabo) |
| **\`administrativo\`** | Sim (\`true\`) | Não (\`false\`) | \`[]\` | \`true\` | **${total_administrativo}** | Sede e gabinetes administrativos/reitorias (ex: Reitoria IF Baiano Salvador) |
| **\`ead\`** | Não (\`false\`) | Não (\`false\`) | \`['superior']\` | \`true\` | **${total_ead}** | Polos de apoio presencial exclusivamente EAD herdados do cadastro legado |
| **\`ambigua\`** | Sim (\`true\`) | Sim (\`true\`) | \`['superior']\` | \`true\` | **${total_ambigua}** | Unidades sob averiguação cadastral / sobreposição física (UFSB, UNIRB, UNIAENE) |
| **\`inativa\`** | Não (\`false\`) | Não (\`false\`) | \`[]\` | \`false\` | **${total_inativas}** | Unidade inativa no Censo Superior 2023 (UNIRB Serrinha - ID 164) |
| **TOTAL GERAL** | - | - | - | - | **${total_unidades}** | **174 preservados da SECTI + 50 novos presenciais INEP** |

---

## 2. Quantitativos por Categoria e Origem

- **Total de Registros Canônicos:** ${total_unidades}
  - Registros de Origem SECTI (legados preservados): **${countSecti}**
  - Registros de Origem INEP (novos presenciais mapeados): **${countInepNovo}**
  - Registros Híbridos Reconciliados (\`secti_inep\`): **${canonicalUnits.filter(u => u.origem === 'secti_inep').length}**
  - Registros Estritamente SECTI (\`secti\`): **${canonicalUnits.filter(u => u.origem === 'secti').length}**
- **Infraestrutura Física Real no Estado (\`presenca_fisica: true\`):** **${total_presenciais}**
- **Unidades Operacionais Ativas (\`ativo: true\`):** **${total_ativas}**
- **Unidades Inativas (\`ativo: false\`):** **${total_inativas}**

---

## 3. Divergências e Resoluções Semânticas

1. **Separação Rigorosa de Polos EAD:**
   - Os 6 polos EAD herdados da SECTI (UNINTER, UNIP, UNIFACS em Brumado, Guanambi, etc.) foram desvinculados da infraestrutura de "campus físico".
   - Regra aplicada: \`presenca_fisica: false\`, \`oferta_presencial: false\`, \`modalidade: 'A distância'\`.
   - **Resultado:** Não inflam mais a contagem de campi físicos nem aparecem indevidamente no mapa de infraestrutura.

2. **Isolamento de Campi de Ensino Técnico:**
   - 7 unidades de IFBA / IF Baiano ofertam apenas cursos técnicos/médio integrado (sem cursos de graduação registrados no Censo da Educação Superior).
   - Regra aplicada: \`tipo_unidade: 'ensino_tecnico'\`, \`nivel_ensino: ['tecnico']\`.
   - **Resultado:** Não contaminam mais os filtros de graduação universitária e relatórios de ensino superior.

3. **Distinção de Centros de Pesquisa e Reitorias Administrativas:**
   - UNEB Canudos e UNEB Jeremoabo são centros de pesquisa e conservação ecológica/histórica, sem turmas regulares de graduação.
   - Reitoria do IF Baiano (Salvador) é um prédio administrativo.
   - Regra aplicada: \`oferta_presencial: false\`, \`nivel_ensino: []\`.
   - **Resultado:** Preservados como infraestrutura de CTI sem gerar expectativa de oferta de cursos de graduação.

4. **Tratamento de Unidade Inativa:**
   - A FACULDADE UNIRB - SERRINHA (ID 164) não possui oferta ativa no Censo 2023.
   - Regra aplicada: \`tipo_unidade: 'inativa'\`, \`ativo: false\`, \`presenca_fisica: false\`.
   - **Resultado:** Preservada no histórico para auditoria sem poluir indicadores ativos.

---

## 4. Casos Ambíguos (\`tipo_unidade: 'ambigua'\`)

1. **UFSB - Campus Jorge Amado (Itabuna - ID 76):**
   - Coexiste com o ID 75 no mesmo município e com mesma coordenada geográfica.
   - Mantido como \`ambigua\` com aviso de sobreposição até unificação cadastral.
2. **UNIRB - Centro Universitário (Alagoinhas - ID 1):**
   - Transição institucional entre Faculdade e Centro Universitário em análise de código e-MEC.
3. **UNIAENE - Centro Universitário Adventista (Cachoeira - ID 19):**
   - Registro cadastral e territorial em Cachoeira com unidade física em Capoeiruçu.

---

## 5. Impacto nos KPIs e Dashboards

### KPIs Consolidados (\`semantic-kpis.json\`)
\`\`\`json
{
  "infraestrutura_total": ${semanticKpis.infraestrutura_total},
  "ensino_superior_presencial": ${semanticKpis.ensino_superior_presencial},
  "ensino_tecnico": ${semanticKpis.ensino_tecnico},
  "pesquisa_extensao": ${semanticKpis.pesquisa_extensao},
  "administrativo": ${semanticKpis.administrativo},
  "ead": ${semanticKpis.ead}
}
\`\`\`

### Benefícios Diretos no Frontend:
1. **Filtros Confiáveis:** Usuários que selecionarem "Ensino Superior" verão exatamente **${total_superior_presencial_confirmado}** campi confirmados (ou **${total_superior_presencial_confirmado + total_ambigua}** com ambíguos), sem mistura de cursos técnicos ou polos EAD.
2. **Cartografia Fiel:** O mapa de infraestrutura física exibe **${total_presenciais}** pontos reais no solo baiano, eliminando pins fantasmas de EAD.
3. **Relatórios em PDF Consistentes:** Os relatórios de síntese e ativos refletem a infraestrutura real de CT&I por Território de Identidade.
`;

    fs.writeFileSync(FILE_REPORT_MD, reportContent, 'utf-8');
    console.log(`[CANONICAL] Arquivo canônico gerado: ${FILE_CANONICAL_JSON}`);
    console.log(`[CANONICAL] KPIs gerados: ${FILE_KPIS_JSON}`);
    console.log(`[CANONICAL] Relatório gerado: ${FILE_REPORT_MD}`);
  }

  return {
    canonicalUnits,
    kpis: semanticKpis,
    metricas: {
      total_unidades,
      total_ativas,
      total_inativas,
      total_presenciais,
      total_superior,
      total_superior_presencial: total_superior_presencial_confirmado,
      total_ambigua,
      total_tecnico,
      total_pesquisa,
      total_administrativo,
      total_ead
    }
  };
}

// Execução direta via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const res = buildCanonicalUnits();
    console.log('\n======================================================');
    console.log('       MODELO CANÔNICO CONSTRUÍDO COM SUCESSO        ');
    console.log('======================================================');
    console.log(`Total de Unidades Canônicas : ${res.metricas.total_unidades}`);
    console.log(`- Presença Física Real      : ${res.metricas.total_presenciais}`);
    console.log(`- Ensino Superior Presencial: ${res.metricas.total_superior_presencial}`);
    console.log(`- Ambíguas (sob auditoria)  : ${res.metricas.total_ambigua}`);
    console.log(`- Ensino Técnico (IFs)      : ${res.metricas.total_tecnico}`);
    console.log(`- Pesquisa e Extensão       : ${res.metricas.total_pesquisa}`);
    console.log(`- Administrativo (Reitoria) : ${res.metricas.total_administrativo}`);
    console.log(`- Polos EAD                 : ${res.metricas.total_ead}`);
    console.log(`- Unidades Inativas         : ${res.metricas.total_inativas}`);
    console.log('======================================================');
  } catch (err) {
    console.error('[CANONICAL] Erro fatal:', err.message);
    process.exit(1);
  }
}
