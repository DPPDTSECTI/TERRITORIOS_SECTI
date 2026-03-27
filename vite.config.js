import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import * as XLSX from 'xlsx'
import { MUNICIPIOS_BAHIA } from './utils/Municipios.js'

let devCache = null;
let devCacheExpiry = 0;
const DEV_CACHE_TTL = 30 * 60 * 1000; // 30 minutos
const CACHE_VERSION = 'v3'; 

// ==================== PROCESSADOR DE EXCEL (DEV) ====================
const FINANCIAL_PATTERNS = [
  'recurso', 'inova cidade', 'investimento estadual',
  'execução financeira', 'execucao financeira',
  'execução física', 'execucao fisica',
  'valor implantação', 'valor implantacao',
  'nota fiscal', 'nº sei nota fiscal',
  'pagamento efetuado', 'processo de pagamento',
];

const MUNICIPIO_KEY_ALIASES = {
  muquem_do_sao_francisco: 'muquem_de_sao_francisco',
};

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
  const normalized = normalizeHeader(nome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .trim();

  return MUNICIPIO_KEY_ALIASES[normalized] || normalized;
}

function convertExcelDate(excelDate) {
  if (typeof excelDate === 'string') {
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(excelDate) || /^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(excelDate)) {
      return excelDate;
    }
  }
  const num = parseInt(excelDate, 10);
  if (isNaN(num)) return excelDate;
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

function parseSpreadsheet(buffer) {
  const startTime = Date.now();

  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellFormula: false,
    cellHTML: false,
    cellStyles: false,
    cellText: false,
    sheetStubs: false,
    bookVBA: false,
    bookDeps: false,
    bookSheets: false,
  });

  const targetSheetNames = workbook.SheetNames.slice(0, 3);
  if (!targetSheetNames.length) throw new Error('Planilha vazia');

  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const toNumber = (value) => {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const cleaned = String(value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const findIndex = (headers, patterns) => {
    for (const pattern of patterns) {
      const normPattern = normalize(pattern);

      // 1) correspondência exata do cabeçalho
      let idx = headers.findIndex((header) => normalize(header) === normPattern);
      if (idx !== -1) return idx;

      // 2) correspondência por palavra inteira
      idx = headers.findIndex((header) => normalize(header).split(/\s+/).includes(normPattern));
      if (idx !== -1) return idx;

      // 3) fallback de includes em textos
      idx = headers.findIndex((header) => normalize(header).includes(normPattern));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const splitList = (value) => String(value || '').split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
  const isTruthy = (value) => ['sim', 's', 'yes', 'true', '1', 'existente', 'conecta'].includes(normalize(value));

  const territoryMap = new Map();

  const getTerritory = (name) => {
    if (!territoryMap.has(name)) {
      territoryMap.set(name, {
        territory: name,
        capacidade: {
          entidadesTotal: 0,
          campiUniversitarios: 0,
          campiIFs: 0,
          espacosDinamizadores: 0,
          incubadoras: 0,
          universidades: 0,
          icts: 0,
          centrosPesquisa: 0,
          parquesTecnologicos: 0,
        },
        capacidadeRows: [],
        desenvolvimentoRows: [],
        cadeiasRows: [],
        desenvolvimento: { ifdmTi: null, somaIfdmPop: 0, populacaoTotal: 0 },
        assistenciaPublica: { existe: false, iniciativas: new Set() },
        cadeiasMap: new Map(),
        semiaridoAcumulado: 0,
        semiaridoContador: 0,
      });
    }
    return territoryMap.get(name);
  };

  const processSheet = (sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: true,
      blankrows: false,
    });

    if (rows.length < 2) return;

    let headerIdx = 0;
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const filled = (rows[i] || []).filter((c) => c != null && String(c).trim() !== '').length;
      if (filled >= 8) { headerIdx = i; break; }
    }

    const rawHeaders = rows[headerIdx] || [];
    const headers = rawHeaders.map(normalizeHeader);

    const iTerritorio = findIndex(headers, ['territorio de identidade', 'territorio']);
    if (iTerritorio === -1) {
      console.log(`[Dev Parser] Aba ignorada (sem território): ${sheetName}`);
      return;
    }

    const iMunicipio = findIndex(headers, ['municipio', 'local']);
    const iPopulacao = findIndex(headers, ['populacao']);
    const iIfdm = findIndex(headers, ['ifdm']);
    const iIfdmTi = findIndex(headers, ['ifdm ti', 'ifdmt', 'ifdm territorial']);
    const iEntidades = findIndex(headers, ['valor entidades', 'entidades total', 'capacidade territorial', 'qtd_enti', 'qtd ent', 'qtd entidades']);
    let iEntidade = findIndex(headers, ['entidade', 'institui', 'nome da entidade']);
    if (iEntidade === iTerritorio) iEntidade = -1;
    const iTipo = findIndex(headers, ['tipo', 'natureza', 'categoria']);
    const iCampiUniv = findIndex(headers, ['campi universit', 'campus universit']);
    const iCampiIfs = findIndex(headers, ['campi de if', 'campus if', 'instituto federal']);
    const iEspacos = findIndex(headers, ['espacos dinamizadores', 'espaco dinamizador']);
    const iIncubadoras = findIndex(headers, ['incubadoras', 'incubadora']);
    const iParques = findIndex(headers, ['parques tecnologicos', 'parque tecnologico']);
    const iUniversidades = findIndex(headers, ['universidades']);
    const iICTs = findIndex(headers, ['icts', 'ict']);
    const iCentrosPesquisa = findIndex(headers, ['centros de pesquisa', 'centro de pesquisa']);
    const iAssistencia = findIndex(headers, ['assistencia publica', 'presenca conecta', 'conecta']);
    const iIniciativas = findIndex(headers, ['iniciativas', 'dispositivos estaduais']);
    const iCadeias = findIndex(headers, ['cadeia produtiva', 'apl', 'arranjo produtivo']);
    const iIGs = findIndex(headers, ['indicacao geografica', 'igs', 'ig']);
    const iSatelite = findIndex(headers, ['municipio satelite', 'sede']);
    const iSemiarido = findIndex(headers, ['semiarido', 'percentual semiarido']);

    console.log(`[Dev Parser] Processando aba: ${sheetName}`);

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const territoryName = String(row[iTerritorio] || '').trim();
      if (!territoryName) continue;

      const territory = getTerritory(territoryName);
      const municipio = iMunicipio !== -1 ? String(row[iMunicipio] || '').trim() : '';

      let rowEntidades = 0;
      if (iEntidades !== -1) {
        rowEntidades = toNumber(row[iEntidades]);
      }
      if (rowEntidades <= 0) {
        rowEntidades = 1;
      }

      const tipoText = iTipo !== -1 ? String(row[iTipo] || '').toLowerCase() : '';
      if (tipoText.includes('universidade')) {
        territory.capacidade.universidades += rowEntidades;
      }
      if (tipoText.includes('instituto federal') || tipoText.includes('\bif\b')) {
        territory.capacidade.campiIFs += rowEntidades;
      }
      if (tipoText.includes('espaco dinamizador') || tipoText.includes('espaço dinamizador')) {
        territory.capacidade.espacosDinamizadores += rowEntidades;
      }
      if (tipoText.includes('incubadora')) {
        territory.capacidade.incubadoras += rowEntidades;
      }
      if (tipoText.includes('parque tecnologico') || tipoText.includes('parque tecnológico')) {
        territory.capacidade.parquesTecnologicos += rowEntidades;
      }

      territory.capacidade.campiUniversitarios += iCampiUniv !== -1 ? toNumber(row[iCampiUniv]) : 0;
      territory.capacidade.campiIFs += iCampiIfs !== -1 ? toNumber(row[iCampiIfs]) : 0;
      territory.capacidade.espacosDinamizadores += iEspacos !== -1 ? toNumber(row[iEspacos]) : 0;
      territory.capacidade.incubadoras += iIncubadoras !== -1 ? toNumber(row[iIncubadoras]) : 0;
      territory.capacidade.parquesTecnologicos += iParques !== -1 ? toNumber(row[iParques]) : 0;
      territory.capacidade.universidades += iUniversidades !== -1 ? toNumber(row[iUniversidades]) : 0;
      territory.capacidade.icts += iICTs !== -1 ? toNumber(row[iICTs]) : 0;
      territory.capacidade.centrosPesquisa += iCentrosPesquisa !== -1 ? toNumber(row[iCentrosPesquisa]) : 0;

      if (!territory.rows) territory.rows = [];
      territory.rows.push({
        municipio,
        entidade: iEntidade !== -1 ? String(row[iEntidade] || '').trim() : '',
        tipo: iTipo !== -1 ? String(row[iTipo] || '').trim() : '',
        qtd_enti: iEntidades !== -1 ? toNumber(row[iEntidades]) : 0,
        capacidade_area: rowEntidades,
      });

      // Detalhe Capacidade
      territory.capacidadeRows.push({
        municipio,
        entidade: iEntidade !== -1 ? String(row[iEntidade] || '').trim() : '',
        tipo: iTipo !== -1 ? String(row[iTipo] || '').trim() : '',
        valor: rowEntidades,
      });

      territory.capacidade.entidadesTotal += rowEntidades;

      // Detalhe Desenvolvimento
      if (iIfdm !== -1 || iPopulacao !== -1 || iIfdmTi !== -1) {
        territory.desenvolvimentoRows.push({
          municipio,
          ifdm: iIfdm !== -1 ? toNumber(row[iIfdm]) : null,
          populacao: iPopulacao !== -1 ? toNumber(row[iPopulacao]) : null,
          ifdmTi: iIfdmTi !== -1 ? toNumber(row[iIfdmTi]) : null,
        });
      }

      if (iIfdm !== -1 && iPopulacao !== -1) {
        const ifdm = toNumber(row[iIfdm]);
        const populacao = toNumber(row[iPopulacao]);
        if (ifdm > 0 && populacao > 0) {
          territory.desenvolvimento.somaIfdmPop += ifdm * populacao;
          territory.desenvolvimento.populacaoTotal += populacao;
        }
      }

      if (iIfdmTi !== -1) {
        const ifdmTiRaw = toNumber(row[iIfdmTi]);
        if (ifdmTiRaw > 0) {
          territory.desenvolvimento.ifdmTi = ifdmTiRaw;
        }
      }

      if (iAssistencia !== -1 && isTruthy(row[iAssistencia])) {
        territory.assistenciaPublica.existe = true;
        territory.assistenciaPublica.iniciativas.add('Conecta');
      }

      if (iIniciativas !== -1) {
        splitList(row[iIniciativas]).forEach((initiative) => territory.assistenciaPublica.iniciativas.add(initiative));
      }

      const chainNames = [
        ...(iCadeias !== -1 ? splitList(row[iCadeias]) : []),
        ...(iIGs !== -1 ? splitList(row[iIGs]) : []),
      ];
      const satelite = iSatelite !== -1 ? String(row[iSatelite] || municipio || '').trim() : String(municipio || '').trim();

      if (chainNames.length > 0) {
        territory.cadeiasRows.push({
          municipio,
          cadeias: chainNames,
          municipioSatelite: satelite,
        });
      }

      chainNames.forEach((chainName) => {
        if (!territory.cadeiasMap.has(chainName)) {
          territory.cadeiasMap.set(chainName, { cadeia: chainName, municipios: new Set(), satelites: new Map() });
        }
        const chain = territory.cadeiasMap.get(chainName);
        if (municipio) chain.municipios.add(municipio);
        if (satelite) chain.satelites.set(satelite, (chain.satelites.get(satelite) || 0) + 1);
      });

      if (iSemiarido !== -1) {
        const semiarido = toNumber(row[iSemiarido]);
        if (semiarido > 0) {
          territory.semiaridoAcumulado += semiarido > 1 ? semiarido : semiarido * 100;
          territory.semiaridoContador += 1;
        }
      }
    }
  };

  targetSheetNames.forEach(processSheet);

  if (!territoryMap.size) {
    throw new Error('Nenhuma linha territorial válida encontrada nas 3 tabelas da planilha.');
  }

  const territories = Array.from(territoryMap.values()).map((entry) => {
    const computedEntidades = entry.capacidade.universidades + entry.capacidade.campiUniversitarios + entry.capacidade.campiIFs + entry.capacidade.icts + entry.capacidade.centrosPesquisa + entry.capacidade.espacosDinamizadores + entry.capacidade.parquesTecnologicos + entry.capacidade.incubadoras;
    if (entry.capacidade.entidadesTotal <= 0) {
      entry.capacidade.entidadesTotal = computedEntidades;
    }

    if (entry.desenvolvimento.ifdmTi == null && entry.desenvolvimento.populacaoTotal > 0) {
      entry.desenvolvimento.ifdmTi = entry.desenvolvimento.somaIfdmPop / entry.desenvolvimento.populacaoTotal;
    }

    const cadeiasProdutivas = Array.from(entry.cadeiasMap.values())
      .map((chain) => {
        const orderedSatelites = Array.from(chain.satelites.entries()).sort((a, b) => b[1] - a[1]);
        return {
          cadeia: chain.cadeia,
          municipioSatelite: orderedSatelites[0]?.[0] || null,
          municipiosEnvolvidos: chain.municipios.size,
        };
      })
      .sort((a, b) => b.municipiosEnvolvidos - a.municipiosEnvolvidos)
      .slice(0, 2);

    return {
      territory: entry.territory,
      capacidade: entry.capacidade,
      capacidadeDetalhada: entry.capacidadeRows || [],
      desenvolvimento: {
        ifdmTi: entry.desenvolvimento.ifdmTi,
        populacaoTotal: entry.desenvolvimento.populacaoTotal || null,
        metodologia: 'IFDM_TI = soma(IFDM_municipio * populacao_municipio) / soma(populacao_municipio)',
      },
      desenvolvimentoDetalhado: entry.desenvolvimentoRows || [],
      assistenciaPublica: {
        existe: entry.assistenciaPublica.existe,
        iniciativas: Array.from(entry.assistenciaPublica.iniciativas),
      },
      cadeiasProdutivas,
      cadeiasProdutivasDetalhado: entry.cadeiasRows || [],
      semiaridoPercentual: entry.semiaridoContador > 0 ? entry.semiaridoAcumulado / entry.semiaridoContador : null,
      futureSignals: {
        agriculturaFamiliar: null,
        gruposSubrepresentados: null,
      },
      parquesTecnologicosMunicipios: [],
    };
  }).sort((a, b) => a.territory.localeCompare(b.territory));

  const result = {
    generatedAt: new Date().toISOString(),
    territories,
    summary: {
      territories: territories.length,
      totalEntidades: territories.reduce((acc, item) => acc + (item.capacidade.entidadesTotal || 0), 0),
      territoriosComAssistencia: territories.filter((item) => item.assistenciaPublica.existe).length,
    },
  };

  const parseTime = Date.now() - startTime;
  console.log(`[Dev Parser] ✓ Parseado em ${parseTime}ms: ${result.summary.territories} territórios`);

  return result;
}
// ==================== FIM DO PROCESSADOR ====================

// Plugin para criar proxy do SharePoint em DEV
// NOTA: Em produção, usa Netlify Function que processa server-side
const sharepointProxyPlugin = () => ({
  name: 'sharepoint-proxy',
  configureServer(server) {
    server.middlewares.use('/api/sharepoint', async (req, res) => {
      console.log('[Dev Proxy] ⚡ Requisição recebida em /api/sharepoint');
      const startTime = Date.now();
      const nocache = req.url.includes('nocache=true');

      // OTIMIZAÇÃO: Cache em memória (retorna instantâneamente) - bypassar se ?nocache=true
      if (!nocache && devCache && Date.now() < devCacheExpiry) {
        const age = Math.round((Date.now() - (devCacheExpiry - DEV_CACHE_TTL)) / 1000);
        console.log(`[Dev Proxy] ✓ Cache HIT (idade: ${age}s) - respondendo instantaneamente`);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('X-Content-Source', 'dev-cache');
        res.setHeader('X-Cache-Age', age.toString());
        res.end(devCache);

        const responseTime = Date.now() - startTime;
        console.log(`[Dev Proxy] Resposta enviada em ${responseTime}ms ⚡`);
        return;
      }

      const downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/IQCUmr5J0kxUQLKb9lRqZkT_AVOgJRieO_TN9lJiRxUzXI8?download=1';

      if (nocache) {
        console.log('[Dev Proxy] 🚫 BYPASS DE CACHE SOLICITADO (nocache=true)');
      }

      console.log(`[Dev Proxy] Cache MISS - baixando Excel...`);

      // Verificar se cliente desconectou (mas continuar processando para popular cache)
      let clientDisconnected = false;
      res.on('close', () => {
        if (!devCache) {
          console.log('[Dev Proxy] ⚠️ Cliente desconectou MAS continuando processamento para popular cache...');
        } else {
          console.log('[Dev Proxy] Cliente desconectou (cache já existe)');
        }
        clientDisconnected = true;
      });

      https.get(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
        }
      }, (response) => {
        const contentType = response.headers['content-type'] || '';
        console.log(`[Dev Proxy] Status: ${response.statusCode}, Content-Type: ${contentType}`);

        // Seguir redirecionamentos
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
          let redirectUrl = response.headers.location;

          // Se for caminho relativo, construir URL completa
          if (redirectUrl && redirectUrl.startsWith('/')) {
            redirectUrl = `https://prodeboffice365-my.sharepoint.com${redirectUrl}`;
          }

          console.log(`[Dev Proxy] Redirecionando para: ${redirectUrl?.substring(0, 80)}...`);

          // Preservar cookies do redirecionamento
          const cookies = response.headers['set-cookie'];
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
          };

          if (cookies) {
            headers['Cookie'] = cookies.map(c => c.split(';')[0]).join('; ');
          }

          https.get(redirectUrl, { headers }, (redirectResponse) => {
            handleResponse(redirectResponse, res, startTime);
          }).on('error', (err) => {
            console.error('[Dev Proxy] Erro no redirecionamento:', err.message);
            sendError(res, 500, err.message);
          });
          return;
        }

        handleResponse(response, res, startTime);
      }).on('error', (err) => {
        console.error('[Dev Proxy] Erro:', err.message);
        sendError(res, 500, err.message);
      });
    });
  }
});

function handleResponse(response, res, startTime) {
  const contentType = response.headers['content-type'] || '';

  // Verificar se é Excel
  if (contentType.includes('spreadsheet') ||
    contentType.includes('excel') ||
    contentType.includes('application/vnd.openxmlformats') ||
    contentType.includes('application/octet-stream')) {

    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const downloadTime = Date.now() - startTime;
      console.log(`[Dev Proxy] ✓ Excel baixado em ${downloadTime}ms: ${buffer.length} bytes`);

      try {
        // PROCESSAR Excel e converter para JSON (igual Netlify Function)
        console.log(`[Dev Proxy] 📊 Processando Excel...`);
        const parseStart = Date.now();
        const jsonData = parseSpreadsheet(buffer);
        const parseTime = Date.now() - parseStart;

        const jsonString = JSON.stringify(jsonData);
        console.log(`[Dev Proxy] ✓ Parseado em ${parseTime}ms: ${Object.keys(jsonData).length} municípios`);

        // Salvar JSON no cache para próximas requisições
        devCache = jsonString;
        devCacheExpiry = Date.now() + DEV_CACHE_TTL;
        console.log(`[Dev Proxy] ✓ Cache (JSON) salvo (válido por ${DEV_CACHE_TTL / 60000} minutos)`);

        const totalTime = Date.now() - startTime;
        console.log(`[Dev Proxy] ✅ TOTAL: ${totalTime}ms (download: ${downloadTime}ms + parse: ${parseTime}ms)`);

        // Retornar JSON processado (sem cache HTTP em dev)
        if (!res.writableEnded) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('X-Content-Source', 'dev-processed');
          res.setHeader('X-Download-Time', downloadTime.toString());
          res.setHeader('X-Parse-Time', parseTime.toString());
          res.end(jsonString);
        } else {
          console.log('[Dev Proxy] ✓ Cache populado mesmo com cliente desconectado');
        }
      } catch (parseError) {
        console.error('[Dev Proxy] Erro ao processar Excel:', parseError);
        sendError(res, 500, 'Erro ao processar planilha: ' + parseError.message);
      }
    });
    response.on('error', (err) => {
      console.error('[Dev Proxy] Erro ao ler response:', err.message);
      sendError(res, 500, 'Erro ao ler dados do SharePoint: ' + err.message);
    });
  } else {
    // HTML ou outro tipo - erro de autenticação
    console.error(`[Dev Proxy] Tipo inválido: ${contentType}`);
    sendError(res, 401, 'SharePoint retornou página HTML. Autenticação necessária ou link inválido.');
  }
}

function sendError(res, statusCode, message) {
  // Verificar se headers já foram enviados
  if (res.headersSent) {
    console.error('[Dev Proxy] Headers já foram enviados, ignorando erro:', message);
    return;
  }

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    error: 'Erro ao acessar SharePoint',
    message,
  }));
}

export default defineConfig({
  plugins: [react(), sharepointProxyPlugin()],

  // Otimizações de build
  build: {
    target: 'es2015',
    minify: 'esbuild', // esbuild é mais rápido que terser e já vem com Vite
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar dependências grandes em chunks próprios
          'vendor-react': ['react', 'react-dom'],
          'vendor-xlsx': ['xlsx'],
          'vendor-topojson': ['topojson-client'],
          'vendor-storage': ['idb-keyval'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    sourcemap: false, // Desabilitar sourcemaps em produção para reduzir tamanho
  },

  // Otimizações de servidor de desenvolvimento
  server: {
    hmr: {
      overlay: true,
    },
  },

  // Pré-bundling otimizado
  optimizeDeps: {
    include: ['react', 'react-dom', 'xlsx', 'topojson-client', 'idb-keyval'],
    exclude: [],
  },
})

