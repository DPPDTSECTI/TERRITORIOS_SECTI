/**
 * Serviço de carregamento e processamento da planilha do Conecta Bahia.
 *
 * Estratégia:
 *   1. Tenta buscar a planilha online via middleware server-side (/api/planilha).
 *   2. Se falhar, carrega o JSON estático de fallback (/conectaMunicipios.json).
 *   3. O usuário pode fazer upload de um .xlsx local para atualizar os dados na sessão.
 *
 * Filtro aplicado: somente linhas onde "Instalação Placa (TLD)" === "Sim".
 * Colunas financeiras são excluídas automaticamente.
 */
import * as XLSX from 'xlsx';

// ─── Chave do sessionStorage ────────────────────────────────────────────────
const CACHE_KEY = 'conecta_spreadsheet_data';

// ─── Padrões de colunas financeiras (serão excluídas) ───────────────────────
const FINANCIAL_PATTERNS = [
  'recurso',
  'inova cidade',
  'investimento estadual',
  'execução financeira',
  'execucao financeira',
  'execução física',
  'execucao fisica',
  'valor implantação',
  'valor implantacao',
  'nota fiscal',
  'nº sei nota fiscal',
  'pagamento efetuado',
  'processo de pagamento',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Normaliza header: remove quebras de linha, espaços extras, parênteses indesejados */
function normalizeHeader(raw) {
  if (raw == null) return '';
  return String(raw).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Converte header em chave segura para JSON (snake_case sem acentos) */
function headerToKey(header) {
  return normalizeHeader(header)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Retorna true se o header bater com algum padrão financeiro */
function isFinancial(header) {
  const h = normalizeHeader(header).toLowerCase();
  return FINANCIAL_PATTERNS.some((p) => h.includes(p));
}

/**
 * Procura o índice da coluna cujo header normalizado contém um dos padrões.
 * Retorna -1 se nenhuma coluna for encontrada.
 */
function findColIndex(headers, patterns) {
  const normed = headers.map((h) => normalizeHeader(h).toLowerCase());
  for (const pat of patterns) {
    const idx = normed.findIndex((h) => h.includes(pat.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ─── Parser principal ───────────────────────────────────────────────────────

/**
 * Recebe um ArrayBuffer de um arquivo .xlsx e retorna o objeto
 * no formato esperado pelo ConectaMap:
 *
 *   { "NomeMunicipio": [ { projeto, nome_da_praca, territorio_identidade, ...extras } ] }
 *
 * @param {ArrayBuffer} buffer - conteúdo do arquivo Excel
 * @returns {Object} dados agrupados por município
 */
export function parseSpreadsheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Usa a primeira aba
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rows.length < 2) throw new Error('Planilha vazia ou sem dados suficientes.');

  // ── Localizar linha de cabeçalho (primeira linha com ≥ 10 colunas preenchidas)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const filled = (rows[i] || []).filter((c) => c != null && String(c).trim() !== '').length;
    if (filled >= 10) { headerIdx = i; break; }
  }

  const rawHeaders = rows[headerIdx];
  const headers = rawHeaders.map(normalizeHeader);

  // ── Índices das colunas-chave ─────────────────────────────────────────────
  const iMunicipio   = findColIndex(headers, ['município', 'municipio']);
  const iPraca       = findColIndex(headers, ['nome da praça', 'nome_da_praca', 'descrição do local', 'descricao do local']);
  const iProjeto     = findColIndex(headers, ['projeto']);
  const iTerritorio  = findColIndex(headers, ['território de identidade', 'territorio de identidade', 'território', 'territorio']);
  const iFilterPlaca = findColIndex(headers, ['instalação placa (tld)', 'instalacao placa (tld)', 'placa (tld)']);
  const iLocal       = findColIndex(headers, ['local']);

  const iMun = iMunicipio !== -1 ? iMunicipio : (iLocal !== -1 ? iLocal : findColIndex(headers, ['mun']));

  if (iMun === -1) {
    console.warn('[spreadsheetService] Não foi possível identificar a coluna de município.');
  }

  // ── Colunas extras (não-financeiras e não-chave) ──────────────────────────
  const keyIndices = new Set([iMun, iPraca, iProjeto, iTerritorio, iFilterPlaca].filter((i) => i !== -1));
  const extraCols = headers
    .map((h, i) => ({ h, i }))
    .filter(({ h, i }) => !keyIndices.has(i) && h && !isFinancial(h))
    .map(({ h, i }) => ({ key: headerToKey(h), label: h, idx: i }));

  // ── Iterar sobre as linhas de dados ───────────────────────────────────────
  const result = {};

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Filtro: Instalação Placa (TLD) === "Sim"
    if (iFilterPlaca !== -1) {
      const val = String(row[iFilterPlaca] || '').trim().toLowerCase();
      if (val !== 'sim') continue;
    }

    // Município
    const municipio = iMun !== -1 ? String(row[iMun] || '').trim() : '';
    if (!municipio) continue;

    // Montar objeto da praça
    const praca = {
      projeto:               iProjeto    !== -1 ? String(row[iProjeto] || '').trim()    : '',
      nome_da_praca:         iPraca      !== -1 ? String(row[iPraca] || '').trim()      : '',
      territorio_identidade: iTerritorio !== -1 ? String(row[iTerritorio] || '').trim() : '',
    };

    // Campos extras não-financeiros
    for (const col of extraCols) {
      const val = row[col.idx];
      praca[col.key] = val != null ? String(val).trim() : '';
    }

    if (!result[municipio]) result[municipio] = [];
    result[municipio].push(praca);
  }

  return result;
}

// ─── Carregamento de dados ──────────────────────────────────────────────────

/**
 * Carrega dados do Conecta Bahia.
 *   1. Se houver cache da planilha na sessão (upload anterior), usa ele.
 *   2. Caso contrário, carrega o JSON estático.
 *
 * @returns {{ data: Object, source: 'upload'|'static' }}
 */
export async function fetchConectaData() {
  // 1. Verificar cache no sessionStorage (de upload anterior nesta sessão)
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      const count = Object.keys(data).length;
      if (count > 0) {
        console.log(`[Conecta] Dados da planilha (cache da sessão): ${count} municípios.`);
        return { data, source: 'upload' };
      }
    }
  } catch { /* sessionStorage pode não estar disponível */ }

  // 2. JSON estático
  const res = await fetch('/conectaMunicipios.json');
  if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar JSON.`);
  const data = await res.json();
  console.log(`[Conecta] Dados do JSON estático: ${Object.keys(data).length} municípios.`);
  return { data, source: 'static' };
}

// ─── Upload local (para processar arquivo .xlsx direto do navegador) ────────

/**
 * Recebe um File (do input[type=file]) e retorna os dados parseados.
 * Também salva no sessionStorage para persistir na sessão do navegador.
 */
export async function parseUploadedFile(file) {
  const buf = await file.arrayBuffer();
  const data = parseSpreadsheet(buf);

  // Salvar no sessionStorage para sobreviver a reloads
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded ou indisponível */ }

  return data;
}

/**
 * Limpa o cache da planilha (volta ao JSON estático).
 */
export function clearSpreadsheetCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch { /* noop */ }
}
