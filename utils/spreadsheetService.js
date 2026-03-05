
import * as XLSX from 'xlsx';
import { MUNICIPIOS_BAHIA } from './Municipios.js';

const CACHE_KEY = 'conecta_spreadsheet_data';
const CACHE_TIMESTAMP_KEY = 'conecta_spreadsheet_timestamp';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora em milissegundos

const SHAREPOINT_PROXY_URL = import.meta.env.DEV
  ? '/api/sharepoint'
  : '/.netlify/functions/sharepoint';

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


function normalizeHeader(raw) {
  if (raw == null) return '';
  return String(raw).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function headerToKey(header) {
  return normalizeHeader(header)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function isFinancial(header) {
  const h = normalizeHeader(header).toLowerCase();
  return FINANCIAL_PATTERNS.some((p) => h.includes(p));
}

function normalizeMunicipioKey(nome) {
  return normalizeHeader(nome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .trim();
}


function normalizeMunicipioNome(nomeInput) {
  if (!nomeInput || nomeInput.trim() === '') return '';

  const nomeKey = normalizeMunicipioKey(nomeInput);

  for (const municipio of MUNICIPIOS_BAHIA) {
    if (normalizeMunicipioKey(municipio) === nomeKey) {
      return municipio; // Retorna com a grafia padrão
    }
  }

  return nomeInput;
}

/**
 * @param {number|string} excelDate - número serial do Excel ou string
 * @returns {string} data formatada DD/MM/YYYY ou valor original se não for número
 */
function convertExcelDate(excelDate) {
  if (typeof excelDate === 'string') {
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(excelDate) || /^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(excelDate)) {
      return excelDate;
    }
  }

  const num = parseInt(excelDate, 10);

  if (isNaN(num)) {
    return excelDate;
  }

  const date = new Date((num - 25569) * 86400 * 1000);

  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();

  return `${dia}/${mes}/${ano}`;
}


function findColIndex(headers, patterns) {
  const normed = headers.map((h) => normalizeHeader(h).toLowerCase());
  for (const pat of patterns) {
    const idx = normed.findIndex((h) => h.includes(pat.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}


/**
 * @param {ArrayBuffer} buffer - conteúdo do arquivo Excel
 * @returns {Object} dados agrupados por município
 */
export function parseSpreadsheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' });

  workbook.SheetNames.forEach((name, idx) => {
  });

  let sheetName = workbook.SheetNames[1];
  const acompanhaSheet = workbook.SheetNames.find(name =>
    name.toLowerCase().includes('acompanham') || name.toLowerCase().includes('acompanhamento')
  );
  if (acompanhaSheet) {
    sheetName = acompanhaSheet;
  }


  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rows.length < 2) throw new Error('Planilha vazia ou sem dados suficientes.');

  let headerIdx = 0;
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const filled = (rows[i] || []).filter((c) => c != null && String(c).trim() !== '').length;
    if (filled >= 10) { headerIdx = i; break; }
  }

  const rawHeaders = rows[headerIdx];
  const headers = rawHeaders.map(normalizeHeader);

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    console.log(`  Linha ${i}:`, rows[i]?.slice(0, 5));
  }

  const iMunicipio = findColIndex(headers, ['município', 'municipio']);
  const iPraca = findColIndex(headers, ['descrição do local', 'descricao do local', 'nome da praça', 'nome_da_praca']);
  const iProjeto = findColIndex(headers, ['projeto']);
  const iTerritorio = findColIndex(headers, ['território de identidade', 'territorio de identidade', 'território', 'territorio']);
  const iFilterPlaca = findColIndex(headers, ['instalação link (tld)', 'instalacao link (tld)', 'link (tld)']);
  const iLocal = findColIndex(headers, ['local']);

  const iMun = iMunicipio !== -1 ? iMunicipio : (iLocal !== -1 ? iLocal : findColIndex(headers, ['mun']));

  console.log('════════════════════════════════════════════════════════');
  console.log('[parseSpreadsheet] 🎯 COLUNA DE MUNICÍPIO IDENTIFICADA:');
  console.log(`  Índice da coluna: ${iMun}`);
  console.log(`  Nome do header: "${headers[iMun]}"`);

  if (iMun === -1) {
    console.warn('[Conecta] ❌ Não foi possível identificar a coluna de município.');
  }

  const keyIndices = new Set([iMun, iPraca, iProjeto, iTerritorio, iFilterPlaca].filter((i) => i !== -1));
  const extraCols = headers
    .map((h, i) => ({ h, i }))
    .filter(({ h, i }) => !keyIndices.has(i) && h && !isFinancial(h))
    .map(({ h, i }) => ({ key: headerToKey(h), label: h, idx: i }));

  const result = {};
  const filterValues = {};
  const processedRows = [];

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    if (iFilterPlaca !== -1) {
      const val = String(row[iFilterPlaca] || '').trim();
      const valLower = val.toLowerCase();

      filterValues[val] = (filterValues[val] || 0) + 1;

      if (valLower !== 'sim') continue;
    }

    const municipioInput = iMun !== -1 ? String(row[iMun] || '').trim() : '';
    if (!municipioInput) continue;

    const municipioNome = normalizeMunicipioNome(municipioInput);

    const municipioKey = normalizeMunicipioKey(municipioNome);

    if (processedRows.length < 20) {
      processedRows.push({
        linha: r,
        municipio: municipioNome,
        municipioOriginal: municipioInput,
        projeto: iProjeto !== -1 ? String(row[iProjeto] || '').trim() : '',
        praca: iPraca !== -1 ? String(row[iPraca] || '').trim() : '',
      });
    }

    const praca = {
      projeto: iProjeto !== -1 ? String(row[iProjeto] || '').trim() : '',
      nome_da_praca: iPraca !== -1 ? String(row[iPraca] || '').trim() : '',
      territorio_identidade: iTerritorio !== -1 ? String(row[iTerritorio] || '').trim() : '',
    };

    for (const col of extraCols) {
      const val = row[col.idx];
      let processedVal = val != null ? String(val).trim() : '';

      if ((col.label.toLowerCase().includes('data') || col.label.toLowerCase().includes('date')) && processedVal) {
        processedVal = convertExcelDate(processedVal);
      }

      praca[col.key] = processedVal;
    }

    if (!result[municipioNome]) result[municipioNome] = [];
    result[municipioNome].push(praca);
  }

  console.log('[Conecta] ✓ Dados parseados: 75 municípios com', Object.values(result).flat().length, 'Pontos Conecta Bahia (apenas com "Instalação Link (TLD)" = SIM).');


  processedRows.forEach((item, idx) => {
    const infoNormalizacao = item.municipioOriginal !== item.municipio
      ? ` (normalizado: "${item.municipioOriginal}")`
      : '';
  });

  return result;
}


/**
 * @param {Function} onUpdate - Callback opcional chamado quando dados são atualizados em background
 * @returns {{ data: Object, source: 'upload'|'sharepoint'|'cache', fresh: boolean }}
 */
export async function fetchConectaData(onUpdate = null) {
  let cachedData = null;
  let cacheAge = Infinity;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (cached && timestamp) {
      cachedData = JSON.parse(cached);
      cacheAge = Date.now() - parseInt(timestamp, 10);
      const count = Object.keys(cachedData).length;

      console.log(`[Conecta] Cache encontrado: ${count} municípios, idade: ${Math.round(cacheAge / 1000)}s`);

      if (cacheAge < CACHE_DURATION && count > 0) {
        console.log(`[Conecta] ✓ Usando cache válido (${Math.round(cacheAge / 60000)} minutos de idade)`);
        return { data: cachedData, source: 'cache', fresh: true };
      }

      if (count > 0) {
        console.log(`[Conecta] ⚠️ Cache expirado (${Math.round(cacheAge / 60000)} minutos), retornando mas atualizando em background...`);

        fetchFreshData(onUpdate);

        return { data: cachedData, source: 'cache', fresh: false };
      }
    }
  } catch (e) {
    console.warn('[Conecta] Erro ao ler cache:', e.message);
  }

  console.log('[Conecta] Sem cache, buscando dados do SharePoint...');

  try {
    const data = await fetchFromSharePoint();
    if (data) {
      saveToCache(data);
      return { data, source: 'sharepoint', fresh: true };
    }
  } catch (err) {
    console.error(`[Conecta] Erro ao carregar do SharePoint: ${err.message}`);
    throw new Error('Não foi possível carregar dados do SharePoint');
  }

  throw new Error('Não foi possível carregar dados do Conecta Bahia');
}

/**
 * @param {Function} onUpdate - Callback chamado quando atualização completa
 */
async function fetchFreshData(onUpdate) {
  try {
    console.log('[Conecta] [Background] Iniciando atualização...');
    const data = await fetchFromSharePoint();

    if (data) {
      saveToCache(data);
      console.log('[Conecta] [Background] ✓ Cache atualizado com sucesso!');

      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate(data);
      }
    }
  } catch (err) {
    console.warn('[Conecta] [Background] Falha na atualização:', err.message);
  }
}

/**
 * @returns {Promise<Object>}
 */
async function fetchFromSharePoint() {
  console.log(`[Conecta] Baixando planilha do SharePoint via ${SHAREPOINT_PROXY_URL}...`);
  const startTime = Date.now();

  try {
    const res = await fetch(SHAREPOINT_PROXY_URL);

    console.log(`[Conecta] Response status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await res.json();

        if (data.error) {
          console.error('[Conecta] Erro do servidor:', data.error);
          throw new Error(data.error);
        }

        const count = Object.keys(data).length;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Conecta] ✓ Dados da planilha do SharePoint (JSON parseado): ${count} municípios em ${elapsed}s`);
        return data;
      }

      if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('octet-stream')) {
        const buffer = await res.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        if (bytes.length < 2 || bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
          console.error('[Conecta] Arquivo não é XLSX válido');
          throw new Error('Arquivo não é Excel válido');
        }

        const data = parseSpreadsheet(buffer);
        const count = Object.keys(data).length;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Conecta] ✓ Dados da planilha do SharePoint (Excel parseado): ${count} municípios em ${elapsed}s`);
        return data;
      }

      if (contentType.includes('text/html')) {
        const html = await res.text();
        console.error('[Conecta] SharePoint retornou HTML:', html.substring(0, 500));
        throw new Error('SharePoint retornou HTML em vez de arquivo Excel');
      }

      console.warn(`[Conecta] Content-Type desconhecido: ${contentType}`);
    } else {
      console.warn(`[Conecta] Falha ao baixar do SharePoint (HTTP ${res.status})`);
    }

    return null;
  } catch (err) {
    console.warn(`[Conecta] Erro ao conectar com SharePoint: ${err.message}`);
    return null;
  }
}

function saveToCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`[Conecta] ✓ Cache salvo: ${Object.keys(data).length} municípios`);
  } catch (e) {
    console.warn('[Conecta] Erro ao salvar cache:', e.message);
  }
}

export async function parseUploadedFile(file) {
  const buf = await file.arrayBuffer();
  const data = parseSpreadsheet(buf);
  saveToCache(data);
  return data;
}

export function clearSpreadsheetCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('[Conecta] Cache limpo');
  } catch (e) {
    console.warn('[Conecta] Erro ao limpar cache:', e.message);
  }
}

export function getCacheInfo() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (cached && timestamp) {
      const data = JSON.parse(cached);
      const age = Date.now() - parseInt(timestamp, 10);
      const valid = age < CACHE_DURATION;

      return {
        exists: true,
        count: Object.keys(data).length,
        age: Math.round(age / 1000),
        valid,
        timestamp: new Date(parseInt(timestamp, 10)).toLocaleString('pt-BR')
      };
    }

    return { exists: false };
  } catch {
    return { exists: false };
  }
}
