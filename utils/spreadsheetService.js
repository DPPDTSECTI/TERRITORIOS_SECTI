/**
 * Serviço de carregamento e processamento da planilha do Conecta Bahia.
 *
 * Estratégia:
 *   1. Tenta buscar a planilha online via middleware server-side (/api/planilha).
 *   2. Se falhar, carrega o JSON estático de fallback (/conectaMunicipios.json).
 *   3. O usuário pode fazer upload de um .xlsx local para atualizar os dados na sessão.
 *
 * Filtro aplicado: somente linhas onde "Instalação Link (TLD)" === "Sim".
 * Colunas financeiras são excluídas automaticamente.
 */
import * as XLSX from 'xlsx';
import { MUNICIPIOS_BAHIA } from './Municipios.js';

// ─── Chave do cache e configuração ─────────────────────────────────────────
const CACHE_KEY = 'conecta_spreadsheet_data';
const CACHE_TIMESTAMP_KEY = 'conecta_spreadsheet_timestamp';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora em milissegundos

// ─── URL do proxy para a planilha do SharePoint ─────────────────────────────
// Em desenvolvimento: /api/sharepoint (middleware do Vite)
// Em produção: /.netlify/functions/sharepoint (função Netlify)
const SHAREPOINT_PROXY_URL = import.meta.env.DEV 
  ? '/api/sharepoint' 
  : '/.netlify/functions/sharepoint';

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

/** Normaliza nome de município para chave única (remove acentos, espaços extras, case-insensitive) */
function normalizeMunicipioKey(nome) {
  return normalizeHeader(nome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .trim();
}

/**
 * Encontra o nome padronizado do município no array MUNICIPIOS_BAHIA.
 * Compare removendo acentos e normalizando espaços.
 * Retorna o nome padrão se encontrado, caso contrário retorna o nome original.
 */
function normalizeMunicipioNome(nomeInput) {
  if (!nomeInput || nomeInput.trim() === '') return '';
  
  const nomeKey = normalizeMunicipioKey(nomeInput);
  
  // Procura no array padrão de municípios
  for (const municipio of MUNICIPIOS_BAHIA) {
    if (normalizeMunicipioKey(municipio) === nomeKey) {
      return municipio; // Retorna com a grafia padrão
    }
  }
  
  // Se não encontrar, retorna o nome original
  return nomeInput;
}

/**
 * Converte número serial de Excel para data formatada (DD/MM/YYYY).
 * Excel conta dias a partir de 01/01/1900 (com bug do século bissexto em 1900).
 * @param {number|string} excelDate - número serial do Excel ou string
 * @returns {string} data formatada DD/MM/YYYY ou valor original se não for número
 */
function convertExcelDate(excelDate) {
  // Se já é uma string de data válida, retorna como está
  if (typeof excelDate === 'string') {
    // Verifica se já é uma data formatada (contém /, -, ou é data válida)
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(excelDate) || /^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(excelDate)) {
      return excelDate;
    }
  }
  
  const num = parseInt(excelDate, 10);
  
  // Se não for um número válido, retorna o valor original
  if (isNaN(num)) {
    return excelDate;
  }
  
  // Converter número serial Excel para data
  // Excel começa em 01/01/1900, então serial 1 = 01/01/1900
  // Adicionar 1 para corrigir o bug do Excel com ano bissexto 1900
  const date = new Date((num - 25569) * 86400 * 1000);
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
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

  console.log('════════════════════════════════════════════════════════');
  console.log('[parseSpreadsheet] 📋 TODAS AS ABAS DISPONÍVEIS:');
  workbook.SheetNames.forEach((name, idx) => {
    console.log(`  [${idx}] "${name}"`);
  });
  console.log('════════════════════════════════════════════════════════');

  // Procura pela aba "acompanhamento" (ou similar), senão usa a segunda aba
  let sheetName = workbook.SheetNames[1]; // segunda aba por padrão
  const acompanhaSheet = workbook.SheetNames.find(name => 
    name.toLowerCase().includes('acompanham') || name.toLowerCase().includes('acompanhamento')
  );
  if (acompanhaSheet) {
    sheetName = acompanhaSheet;
  }
  
  console.log(`[parseSpreadsheet] 🎯 ABA SELECIONADA: [${workbook.SheetNames.indexOf(sheetName)}] "${sheetName}"`);
  console.log(`[parseSpreadsheet] 🔍 Foi encontrada por busca? ${acompanhaSheet ? 'SIM (match: "' + acompanhaSheet + '")' : 'NÃO (usando índice [1])'}`);
  console.log('════════════════════════════════════════════════════════');
  
  const sheet = workbook.Sheets[sheetName];
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

  console.log('════════════════════════════════════════════════════════');
  console.log('[parseSpreadsheet] 📊 PRIMEIRAS 10 LINHAS DA PLANILHA (BRUTO):');
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    console.log(`  Linha ${i}:`, rows[i]?.slice(0, 5)); // Primeiras 5 colunas
  }
  console.log('════════════════════════════════════════════════════════');

  // ── Índices das colunas-chave ─────────────────────────────────────────────
  const iMunicipio   = findColIndex(headers, ['município', 'municipio']);
  const iPraca       = findColIndex(headers, ['descrição do local', 'descricao do local', 'nome da praça', 'nome_da_praca']);
  const iProjeto     = findColIndex(headers, ['projeto']);
  const iTerritorio  = findColIndex(headers, ['território de identidade', 'territorio de identidade', 'território', 'territorio']);
  const iFilterPlaca = findColIndex(headers, ['instalação link (tld)', 'instalacao link (tld)', 'link (tld)']);
  const iLocal       = findColIndex(headers, ['local']);

  const iMun = iMunicipio !== -1 ? iMunicipio : (iLocal !== -1 ? iLocal : findColIndex(headers, ['mun']));

  console.log('════════════════════════════════════════════════════════');
  console.log('[parseSpreadsheet] 🎯 COLUNA DE MUNICÍPIO IDENTIFICADA:');
  console.log(`  Índice da coluna: ${iMun}`);
  console.log(`  Nome do header: "${headers[iMun]}"`);
  console.log(`  Primeiros 10 valores dessa coluna:`);
  for (let i = headerIdx + 1; i < Math.min(headerIdx + 11, rows.length); i++) {
    console.log(`    Linha ${i}: "${rows[i][iMun]}"`);
  }
  console.log('════════════════════════════════════════════════════════');

  if (iMun === -1) {
    console.warn('[Conecta] ❌ Não foi possível identificar a coluna de município.');
  }

  // ── Colunas extras (não-financeiras e não-chave) ──────────────────────────
  const keyIndices = new Set([iMun, iPraca, iProjeto, iTerritorio, iFilterPlaca].filter((i) => i !== -1));
  const extraCols = headers
    .map((h, i) => ({ h, i }))
    .filter(({ h, i }) => !keyIndices.has(i) && h && !isFinancial(h))
    .map(({ h, i }) => ({ key: headerToKey(h), label: h, idx: i }));

  // ── Iterar sobre as linhas de dados ───────────────────────────────────────
  const result = {};
  const filterValues = {}; // Tracking dos valores de filtro encontrados
  const processedRows = []; // Rastrear as linhas que passaram

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Filtro RIGOROSO: APENAS "Instalação Link (TLD)" === "SIM" = Ponto Conecta Bahia
    // Qualquer outro valor (não, em branco, etc) é IGNORADO
    if (iFilterPlaca !== -1) {
      const val = String(row[iFilterPlaca] || '').trim();
      const valLower = val.toLowerCase();
      
      // Contabilizar todos os valores encontrados
      filterValues[val] = (filterValues[val] || 0) + 1;
      
      // Continua APENAS se for exatamente "sim" (case-insensitive)
      if (valLower !== 'sim') continue;
    }

    // Município
    const municipioInput = iMun !== -1 ? String(row[iMun] || '').trim() : '';
    if (!municipioInput) continue;
    
    // Normalizar nome do município com a grafia padrão do array MUNICIPIOS_BAHIA
    const municipioNome = normalizeMunicipioNome(municipioInput);
    
    // Normalizar chave do município para evitar duplicatas por acentuação/espaçamento
    const municipioKey = normalizeMunicipioKey(municipioNome);
    
    // Rastrear primeiras 20 linhas processadas
    if (processedRows.length < 20) {
      processedRows.push({
        linha: r,
        municipio: municipioNome,
        municipioOriginal: municipioInput,
        projeto: iProjeto !== -1 ? String(row[iProjeto] || '').trim() : '',
        praca: iPraca !== -1 ? String(row[iPraca] || '').trim() : '',
      });
    }

    // Montar objeto da praça (Ponto Conecta Bahia)
    const praca = {
      projeto:               iProjeto    !== -1 ? String(row[iProjeto] || '').trim()    : '',
      nome_da_praca:         iPraca      !== -1 ? String(row[iPraca] || '').trim()      : '',
      territorio_identidade: iTerritorio !== -1 ? String(row[iTerritorio] || '').trim() : '',
    };

    // Campos extras não-financeiros
    for (const col of extraCols) {
      const val = row[col.idx];
      let processedVal = val != null ? String(val).trim() : '';
      
      // Detectar e converter campos de data (coluna com "data" ou "date" no header)
      if ((col.label.toLowerCase().includes('data') || col.label.toLowerCase().includes('date')) && processedVal) {
        processedVal = convertExcelDate(processedVal);
      }
      
      praca[col.key] = processedVal;
    }

    if (!result[municipioNome]) result[municipioNome] = [];
    result[municipioNome].push(praca);
  }

  console.log('[Conecta] ✓ Dados parseados: 75 municípios com', Object.values(result).flat().length, 'Pontos Conecta Bahia (apenas com "Instalação Link (TLD)" = SIM).');
  
  // **DEBUG CRÍTICO: Mostrar as primeiras 20 linhas processadas**
  console.log('════════════════════════════════════════════════════════');
  console.log('[Conecta] 📍 PRIMEIRAS 20 LINHAS COM "Instalação Link (TLD)" = SIM:');
  processedRows.forEach((item, idx) => {
    const infoNormalizacao = item.municipioOriginal !== item.municipio 
      ? ` (normalizado: "${item.municipioOriginal}")` 
      : '';
    console.log(`  ${idx + 1}. Linha ${item.linha}: ${item.municipio}${infoNormalizacao} | ${item.projeto} | ${item.praca}`);
  });
  console.log('════════════════════════════════════════════════════════');
  
  // Debug: mostrar todos os municípios encontrados
  console.log('[Conecta] Municípios encontrados na planilha:', Object.keys(result).sort());
  console.log('[Conecta] Distribuição por município:', Object.entries(result).map(([nome, pracas]) => `${nome}: ${pracas.length} praça(s)`).sort());
  
  // Mostrar TODOS os valores encontrados na coluna de filtro
  console.log('[Conecta] Distribuição de valores em "Instalação Link (TLD)":', filterValues);
  console.log('[Conecta] Total de linhas que passaram no filtro "SIM":', Object.values(result).flat().length);
  console.log('[Conecta] Total de linhas com outros valores no filtro:', Object.values(filterValues).reduce((a, b) => a + b, 0) - Object.values(result).flat().length);

  return result;
}

// ─── Carregamento de dados ──────────────────────────────────────────────────

/**
 * Carrega dados do Conecta Bahia com cache persistente e atualização em background.
 * 
 * Estratégia stale-while-revalidate:
 *   1. Se houver cache válido (< 1 hora), retorna imediatamente.
 *   2. Se houver cache expirado, retorna ele mas busca atualização em background.
 *   3. Se não houver cache, busca do SharePoint (mostra loading).
 *
 * @param {Function} onUpdate - Callback opcional chamado quando dados são atualizados em background
 * @returns {{ data: Object, source: 'upload'|'sharepoint'|'cache', fresh: boolean }}
 */
export async function fetchConectaData(onUpdate = null) {
  // 1. Verificar cache no localStorage
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
      
      // Cache ainda válido (< 1 hora) - retorna imediatamente
      if (cacheAge < CACHE_DURATION && count > 0) {
        console.log(`[Conecta] ✓ Usando cache válido (${Math.round(cacheAge / 60000)} minutos de idade)`);
        return { data: cachedData, source: 'cache', fresh: true };
      }
      
      // Cache expirado mas disponível - retorna mas inicia atualização em background
      if (count > 0) {
        console.log(`[Conecta] ⚠️ Cache expirado (${Math.round(cacheAge / 60000)} minutos), retornando mas atualizando em background...`);
        
        // Atualizar em background
        fetchFreshData(onUpdate);
        
        return { data: cachedData, source: 'cache', fresh: false };
      }
    }
  } catch (e) {
    console.warn('[Conecta] Erro ao ler cache:', e.message);
  }

  // 2. Sem cache - buscar direto do SharePoint
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
 * Busca dados frescos do SharePoint e atualiza cache em background.
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
 * Busca dados do SharePoint via proxy.
 * @returns {Promise<Object>} Dados parseados ou null se falhar
 */
async function fetchFromSharePoint() {
  console.log(`[Conecta] Baixando planilha do SharePoint via ${SHAREPOINT_PROXY_URL}...`);
  const startTime = Date.now();
  
  try {
    const res = await fetch(SHAREPOINT_PROXY_URL);
    
    console.log(`[Conecta] Response status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
    
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      
      // Versão nova: JSON já parseado da Netlify Function
      if (contentType.includes('application/json')) {
        const data = await res.json();
        
        // Verificar se é um erro
        if (data.error) {
          console.error('[Conecta] Erro do servidor:', data.error);
          throw new Error(data.error);
        }
        
        // É o JSON já parseado!
        const count = Object.keys(data).length;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Conecta] ✓ Dados da planilha do SharePoint (JSON parseado): ${count} municípios em ${elapsed}s`);
        return data;
      }
      
      // Versão antiga (dev mode): arquivo Excel bruto
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
      
      // HTML de erro
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

/**
 * Salva dados no cache persistente (localStorage).
 */
function saveToCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`[Conecta] ✓ Cache salvo: ${Object.keys(data).length} municípios`);
  } catch (e) {
    console.warn('[Conecta] Erro ao salvar cache:', e.message);
  }
}

// ─── Upload local (para processar arquivo .xlsx direto do navegador) ────────

/**
 * Recebe um File (do input[type=file]) e retorna os dados parseados.
 * Também salva no sessionStorage para persistir na sessão do navegador.
 */
export async function parseUploadedFile(file) {
  const buf = await file.arrayBuffer();
  const data = parseSpreadsheet(buf);

  // Salvar no cache persistente
  saveToCache(data);

  return data;
}

/**
 * Limpa o cache da planilha (força recarregamento).
 */
export function clearSpreadsheetCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    console.log('[Conecta] Cache limpo');
  } catch (e) {
    console.warn('[Conecta] Erro ao limpar cache:', e.message);
  }
}

/**
 * Retorna informações sobre o cache atual.
 */
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
        age: Math.round(age / 1000), // segundos
        valid,
        timestamp: new Date(parseInt(timestamp, 10)).toLocaleString('pt-BR')
      };
    }
    
    return { exists: false };
  } catch {
    return { exists: false };
  }
}
