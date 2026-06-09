import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

const DEV_CACHE_TTL = 30 * 60 * 1000; // 30 minutos
let devCache = null;
let devCacheExpiry = 0;

// Função ultra-rigorosa para limpar cabeçalhos e transformá-los em chaves de objeto
function safeKey(k) {
  return String(k || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const toNumber = (value) => {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const splitList = (value) => String(value || '').split(/[;|]/).map((item) => item.trim()).filter(Boolean);
const isTruthy = (value) => ['sim', 's', 'yes', 'true', '1', 'existente', 'conecta'].includes(normalize(value));

function parseSpreadsheet(buffer) {
  const startTime = Date.now();

  const textContent = buffer.toString('utf8', 0, 500).trim().toLowerCase();
  if (textContent.startsWith('<html') || textContent.startsWith('<!doctype')) {
    throw new Error("ACESSO NEGADO: O SharePoint retornou a página de Login (HTML). Verifique as permissões do ficheiro.");
  }

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const targetSheetNames = workbook.SheetNames;
  if (!targetSheetNames.length) throw new Error('Planilha vazia');

  // 1. MAPEAMENTO DO SEMIÁRIDO BAIANO
  const semiaridoMunicipios = new Set();
  const semiaridoSheetName = targetSheetNames.find(name => safeKey(name).includes('semiarido'));
  
  if (semiaridoSheetName) {
    const sheet = workbook.Sheets[semiaridoSheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    rawRows.forEach(row => {
      const munKey = Object.keys(row).find(k => safeKey(k).includes('municipio'));
      const munVal = munKey ? row[munKey] : Object.values(row)[1] || Object.values(row)[0];
      if (munVal) semiaridoMunicipios.add(normalize(munVal));
    });
  }

  const territoryMap = new Map();

  const getTerritory = (name) => {
    const canonicalName = normalize(name);
    if (!canonicalName) return null;

    if (!territoryMap.has(canonicalName)) {
      territoryMap.set(canonicalName, {
        territory: String(name).trim(),
        capacidadeRows: [],
        cadeiasRows: [],
        desenvolvimento: { ifdmTi: null, somaIfdmPop: 0, populacaoTotal: 0 },
        assistenciaPublica: { existe: false, iniciativas: new Set() },
        semiaridoAcumulado: 0,
        semiaridoContador: 0
      });
    }
    return territoryMap.get(canonicalName);
  };

  const processSheet = (sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    // Converte a folha para JSON onde a PRIMEIRA linha vira as chaves do objeto.
    // Isso evita completamente que os dados "escorreguem" de coluna.
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (rawRows.length === 0) return;

    const sheetNorm = safeKey(sheetName);
    console.log(`[Dev Parser] Processando aba: ${sheetName}`);

    rawRows.forEach((rawRow, idx) => {
      // Normaliza as chaves do objeto atual para garantir que as lemos sempre bem
      const row = {};
      for (const key in rawRow) {
          row[safeKey(key)] = rawRow[key];
      }

      const territorioRaw = row['territoriodeidentidade'] || row['territorio'];
      if (!territorioRaw) return;

      // Trata Territórios Compostos (Ex: "Recôncavo; Baixo Sul")
      const territoryNamesList = splitList(territorioRaw);
      
      // ID Único Matemático (Garante deduplicação no Frontend)
      const uniqueRowId = `aba_${sheetNorm}_linha_${idx}`;

      territoryNamesList.forEach(tName => {
         const territory = getTerritory(tName);
         if (!territory) return;

         const municipio = String(row['municipio'] || row['local'] || '').trim();
         const entidade = String(row['entidade'] || row['nomedaentidade'] || row['instituicao'] || '').trim();
         const tipo = String(row['tipo'] || row['categoria'] || row['natureza'] || '').trim();
         const tipoNorm = normalize(tipo);

         // =================================================================
         // ISOLAMENTO 1: CAPACIDADE TERRITORIAL
         // =================================================================
         if (sheetNorm.includes('capacidade') || sheetNorm.includes('cti')) {
             const qtd = toNumber(row['qtdenti'] || row['quantidade'] || row['valorentidades'] || 1);
             let categoriaEntidade = null;
             let isCTI = false;
             
             if (['universidade'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'univs'; isCTI = true; }
             else if (['instituto federal', 'ifba', 'ifbaiano'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'ifs'; isCTI = true; }
             else if (['ict'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'icts'; isCTI = true; }
             else if (['centro de pesquisa', 'pesquisa'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'centrosPesquisa'; isCTI = true; }
             else if (['espaco', 'dinamizador'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'espacos'; isCTI = true; }
             else if (['parque'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'parques'; isCTI = true; }
             else if (['incubadora'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'incubadoras'; isCTI = true; }

             if (isCTI && entidade !== '') {
                 territory.capacidadeRows.push({
                     id: uniqueRowId,
                     municipio,
                     entidade,
                     tipo,
                     categoria: categoriaEntidade,
                     quantidade: qtd
                 });
             }
         }

         // =================================================================
         // ISOLAMENTO 2: CADEIAS PRODUTIVAS E IGs (Blindado)
         // =================================================================
         if (sheetNorm.includes('cadeia') || sheetNorm.includes('ig') || sheetNorm.includes('potencial')) {
             // Lê estritamente o valor que está sob o cabeçalho 'Cadeia Produtiva' ou 'Cadeia' ou 'Segmento'
             const cadeia = String(row['cadeiaprodutiva'] || row['cadeia'] || row['segmento'] || '').trim();
             
             if (cadeia !== '') {
                 const sede = String(row['sede'] || row['municipiosatelite'] || '').trim();
                 const abrangencia = String(row['municipiospertencentes'] || row['abrangencia'] || '').trim();
                 const qtd = toNumber(row['quantidade'] || row['qtd'] || 1);
                 const fonte = String(row['fontedodado'] || row['fonte'] || row['link'] || '').trim();

                 territory.cadeiasRows.push({
                     id: uniqueRowId,
                     segmento: cadeia,
                     sede: sede || abrangencia.split(/[;,]/)[0].trim() || municipio || 'N/A',
                     municipiosPertencentes: abrangencia,
                     entidade,
                     tipo,
                     quantidade: qtd,
                     fonte
                 });
             }
         }

         // =================================================================
         // ISOLAMENTO 3: DESENVOLVIMENTO (IFDM)
         // =================================================================
         if (sheetNorm.includes('desenvolvimento') || sheetNorm.includes('ifdm')) {
             const ifdm = toNumber(row['ifdm']);
             const pop = toNumber(row['populacao']);
             const ifdmTi = toNumber(row['ifdmt'] || row['ifdmti']);

             if (ifdm > 0 && pop > 0) {
                 territory.desenvolvimento.somaIfdmPop += ifdm * pop;
                 territory.desenvolvimento.populacaoTotal += pop;
             }
             if (ifdmTi > 0) {
                 territory.desenvolvimento.ifdmTi = ifdmTi;
             }
         }

         // =================================================================
         // ISOLAMENTO 4: ASSISTÊNCIA PÚBLICA E SEMIÁRIDO
         // =================================================================
         const assistencia = String(row['assistenciapublica'] || row['conecta'] || '');
         const iniciativas = String(row['iniciativas'] || row['dispositivosestaduais'] || '');
         if (isTruthy(assistencia)) territory.assistenciaPublica.existe = true;
         if (iniciativas !== '') splitList(iniciativas).forEach(i => territory.assistenciaPublica.iniciativas.add(i));

         const semiaridoVal = toNumber(row['semiarido'] || row['percentualsemiarido']);
         if (semiaridoVal > 0) {
             territory.semiaridoAcumulado += semiaridoVal > 1 ? semiaridoVal : semiaridoVal * 100;
             territory.semiaridoContador += 1;
         }
      });
    });
  };

  targetSheetNames.forEach(sheetName => {
    try { processSheet(sheetName); } catch (e) { console.error(`[Dev Parser] Erro na aba ${sheetName}:`, e.message); }
  });

  if (!territoryMap.size) throw new Error('Nenhuma linha territorial válida encontrada.');

  const territories = Array.from(territoryMap.values()).map((entry) => {
    if (entry.desenvolvimento.ifdmTi == null && entry.desenvolvimento.populacaoTotal > 0) {
      entry.desenvolvimento.ifdmTi = entry.desenvolvimento.somaIfdmPop / entry.desenvolvimento.populacaoTotal;
    }

    // Validação Global de Semiárido para o Território
    let isSemiarido = false;
    entry.capacidadeRows.forEach(e => { if (semiaridoMunicipios.has(normalize(e.municipio))) isSemiarido = true; });
    entry.cadeiasRows.forEach(e => { 
        if (semiaridoMunicipios.has(normalize(e.sede))) isSemiarido = true; 
        splitList(e.municipiosPertencentes).forEach(m => { if (semiaridoMunicipios.has(normalize(m))) isSemiarido = true; });
    });
    if (entry.semiaridoContador > 0 && (entry.semiaridoAcumulado / entry.semiaridoContador) > 0) isSemiarido = true;

    return {
      territory: entry.territory,
      isSemiarido: isSemiarido,
      capacidadeDetalhada: entry.capacidadeRows, // A nova array limpa com IDs
      cadeiasProdutivasDetalhado: entry.cadeiasRows, // A nova array limpa com IDs e Cadeias Reais
      desenvolvimento: {
        ifdmTi: entry.desenvolvimento.ifdmTi,
        populacaoTotal: entry.desenvolvimento.populacaoTotal || null,
        metodologia: 'IFDM_TI = soma(IFDM_municipio * populacao_municipio) / soma(populacao_municipio)',
      },
      assistenciaPublica: {
        existe: entry.assistenciaPublica.existe,
        iniciativas: Array.from(entry.assistenciaPublica.iniciativas),
      }
    };
  }).sort((a, b) => a.territory.localeCompare(b.territory));

  const result = {
    generatedAt: new Date().toISOString(),
    territories,
    summary: {
      territories: territories.length
    },
  };

  const parseTime = Date.now() - startTime;
  console.log(`[Dev Parser] ✓ Parseado em ${parseTime}ms: ${result.summary.territories} territórios`);

  try {
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'dados.json'), JSON.stringify(result, null, 2));
  } catch (err) { console.warn(`[Dev Parser] Falha ao salvar JSON local.`); }

  return result;
}

const sharepointProxyPlugin = () => ({
  name: 'sharepoint-proxy',
  configureServer(server) {
    server.middlewares.use('/api/sharepoint', async (req, res) => {
      const startTime = Date.now();
      const nocache = req.url.includes('nocache=true');

      if (!nocache && devCache && Date.now() < devCacheExpiry) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(devCache);
        return;
      }

      let downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/IQCUmr5J0kxUQLKb9lRqZkT_AVOgJRieO_TN9lJiRxUzXI8?download=1';
      if (!downloadUrl.includes('web=0')) downloadUrl += '&action=default&web=0';

      https.get(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Connection': 'keep-alive',
        },
        timeout: 60000 
      }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400) {
          let redirectUrl = response.headers.location;
          if (redirectUrl && redirectUrl.startsWith('/')) redirectUrl = `https://prodeboffice365-my.sharepoint.com${redirectUrl}`;
          const cookies = response.headers['set-cookie'];
          const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
          if (cookies) headers['Cookie'] = cookies.map(c => c.split(';')[0]).join('; ');

          https.get(redirectUrl, { headers }, (redirectResponse) => {
            handleResponse(redirectResponse, res, startTime);
          }).on('error', (err) => sendError(res, 500, err.message));
          return;
        }

        handleResponse(response, res, startTime);
      }).on('error', (err) => sendError(res, 500, err.message));
    });
  }
});

function handleResponse(response, res, startTime) {
  const contentType = response.headers['content-type'] || '';
  if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('octet-stream')) {
    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const jsonData = parseSpreadsheet(buffer);
        const jsonString = JSON.stringify(jsonData);

        devCache = jsonString;
        devCacheExpiry = Date.now() + DEV_CACHE_TTL;

        if (!res.writableEnded) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(jsonString);
        }
      } catch (parseError) {
        sendError(res, 500, parseError.message);
      }
    });
  } else {
    sendError(res, 401, 'SharePoint retornou HTML (Link Exige Autenticação/Cookies).');
  }
}

function sendError(res, statusCode, message) {
  if (res.headersSent) return;
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Erro de Proxy', message }));
}

export default defineConfig({
  plugins: [react(), sharepointProxyPlugin()],
  build: {
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-xlsx': ['xlsx'],
          'vendor-topojson': ['topojson-client'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    sourcemap: false,
  },
  server: { hmr: { overlay: true } },
  optimizeDeps: {
    include: ['react', 'react-dom', 'xlsx', 'topojson-client'],
    exclude: [],
  },
});