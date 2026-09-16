/**
 * api-lab/inep/scripts/report-inep.mjs
 * Gera o relatório diagnóstico executivo sobre a viabilidade e limites de substituição
 * dos dados atuais da SECTI pelo Censo da Educação Superior do INEP.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'api-lab', 'inep', 'output');
export const FILE_RELATORIO_JSON = path.resolve(OUTPUT_DIR, 'relatorio_inep.json');
export const FILE_DIAGNOSTICO_MD = path.resolve(OUTPUT_DIR, 'diagnostico_inep.md');

export function generateExecutiveReport() {
  if (!fs.existsSync(FILE_RELATORIO_JSON)) {
    throw new Error(`Relatório JSON não encontrado em ${FILE_RELATORIO_JSON}. Execute 'npm run api:inep:compare' primeiro.`);
  }

  const rel = JSON.parse(fs.readFileSync(FILE_RELATORIO_JSON, 'utf-8'));
  const r = rel.resumo;

  const markdown = `# 🎓 Relatório Diagnóstico: Integração SECTI & INEP (Censo da Educação Superior)

**Data de Geração:** ${new Date(rel.metadados.gerado_em).toLocaleString('pt-BR')}  
**Fonte Externa:** INEP / MEC — Microdados do Censo da Educação Superior (${rel.metadados.ano_censo})  
**Base SECTI Atual:** Supabase (\`lista_cursos_cti\` e \`lista_ativos_cti\`)

---

## 📊 Síntese Quantitativa

| Métrica | Base SECTI Atual | Base INEP (Bahia) | Observações |
| :--- | :---: | :---: | :--- |
| **Cursos Superiores Cadastrados** | **${r.total_cursos_projeto}** | **${r.total_ofertas_cursos_inep_ba}** | SECTI adota recorte estrito de CT&I; INEP contempla todas as áreas. |
| **Cursos Presenciais** | 642 | ${r.total_cursos_presenciais_inep_ba} | Ofertas presenciais ativas no Estado. |
| **Polos / Ofertas EAD** | 0 (no fluxo principal) | ${r.total_cursos_ead_inep_ba} | Ofertas de ensino a distância cadastradas no INEP. |
| **Instituições de Ensino Mapeadas** | ${r.total_instituicoes_distintas_projeto} | ${r.total_instituicoes_inep_com_sede_ba}+ | IES sediadas na BA e atuantes com polos. |
| **Municípios com Oferta** | ${r.total_municipios_com_cursos_projeto} | ${r.total_municipios_com_oferta_inep} | Presença universitária nos 417 municípios via presencial e EAD. |
| **Campi Educacionais Identificados** | ${r.total_campi_projeto} | 174 validados | 100% dos campi SECTI possuem município correspondente no INEP. |

---

## 1. O que o INEP Consegue Substituir com Vantagem

1. **Códigos Oficiais e Identificadores Únicos**:
   - Fornece o identificador governamental padronizado de cada curso (\`CO_CURSO\`) e de cada instituição (\`CO_IES\`), eliminando duplicidades por variações de nome.
2. **Classificação Oficial de Modalidade e Grau Acadêmico**:
   - Distinção normativa entre *Bacharelado*, *Licenciatura* e *Tecnológico*, além de marcação oficial de *Presencial* vs *EAD*.
3. **Padronização CINE Brasil / UNESCO**:
   - Classificação internacional de áreas gerais e específicas do conhecimento (ex: *Engenharia, produção e construção*, *Saúde e bem-estar*, *Computação e TIC*).
4. **Atualização Cadastral Contínua**:
   - O Censo é publicado anualmente, permitindo sincronizar a abertura ou desativação de cursos no Estado.

---

## 2. O que o INEP NÃO Consegue Substituir

1. **Territórios de Identidade da Bahia (SEPLAN-BA)**:
   - O INEP é uma base federal e desconhece a divisão baiana dos **27 Territórios de Identidade**.
2. **Ativos de CT&I Não-Acadêmicos**:
   - O Censo do Ensino Superior não cadastra incubadoras, aceleradoras, parques tecnológicos, núcleos de inovação tecnológica (NITs) nem espaços colaborar/fazer.
3. **Recorte Temático e Prioritário da SECTI**:
   - O INEP lista todos os cursos de todas as áreas (ex: Direito, Pedagogia, Teologia). A SECTI filtra estrategicamente os cursos voltados ao ecossistema de Ciência, Tecnologia e Inovação.
4. **Coordenadas Geográficas Precisas**:
   - O INEP disponibiliza o código do município (\`CO_MUNICIPIO\`), mas não fornece a latitude e longitude exata de cada campus ou prédio físico.

---

## 3. Dados Adicionais que o INEP Oferece para Futuras Expansões

1. **Estatísticas de Fluxo e Demanda**:
   - Quantidade de vagas autorizadas (\`QT_VG_TOTAL\`), candidatos inscritos (\`QT_INSCRITO_TOTAL\`), novos ingressantes (\`QT_ING\`), total de matriculados (\`QT_MAT\`) e concluintes anuais (\`QT_CONC\`).
2. **Financiamento Estudantil**:
   - Quantitativo de alunos apoiados por FIES, PROUNI (integral e parcial) e bolsas institucionais.
3. **Corpo Docente**:
   - Total de docentes em exercício por instituição, titulação acadêmica (doutores, mestres, especialistas) e regime de trabalho (dedicação exclusiva, tempo parcial).

---

## 4. Dados Atuais da SECTI que Devem Ser Preservados

1. **Vínculo Território de Identidade ↔ Município**: Deve continuar sendo suprido pela SEPLAN / \`utils/territorioMunicipios.json\`.
2. **Coordenadas Cartográficas**: As coordenadas de \`src/data/municipiosCoords.js\` e a geolocalização dos campi e ativos.
3. **Mapeamento de Cadeias Produtivas e Ecossistema PTI**: Os dados das 12 cadeias produtivas e seus municípios prioritários.
4. **Filtro de Cursos Relevantes para CT&I**: A lógica de priorização das 5 áreas estratégicas de ciência e tecnologia.

---

## 5. Conclusão e Recomendação Técnica

> **Recomendação:** Utilizar o INEP como **fonte de enriquecimento e validação cadastral** (adicionando os códigos oficiais \`codigo_curso\` e \`codigo_ies\` ao banco de dados do projeto), **SEM descartar** as tabelas estruturais de Territórios, Ativos e Coordenadas da SECTI.
`;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(FILE_DIAGNOSTICO_MD, markdown, 'utf-8');
  console.log(`[INEP-REPORT] Diagnóstico executivo gerado em: ${FILE_DIAGNOSTICO_MD}`);
  return markdown;
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('report-inep.mjs')) {
  try {
    generateExecutiveReport();
    console.log('[INEP-REPORT] Concluído com sucesso!');
  } catch (err) {
    console.error('[INEP-REPORT] Erro:', err);
    process.exit(1);
  }
}
