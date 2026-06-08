import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import * as XLSX from 'xlsx'

let devCache = null;
let devCacheExpiry = 0;
const DEV_CACHE_TTL = 30 * 60 * 1000; // 30 minutos
const CACHE_VERSION = 'v4'; 

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

  // Lê TODAS as abas disponíveis em vez de limitar às 3 primeiras
  const targetSheetNames = workbook.SheetNames;
  if (!targetSheetNames.length) throw new Error('Planilha vazia');

  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  // 1. CARREGAR A LISTA DO SEMIÁRIDO BAIANO
  const semiaridoMunicipios = new Set();
  const semiaridoSheetName = targetSheetNames.find(name => normalize(name).includes('semiarido'));
  
  if (semiaridoSheetName) {
    const sheet = workbook.Sheets[semiaridoSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    rows.forEach(row => {
      // Captura o município (geralmente a 2ª coluna em CSVs exportados ou coluna "Município")
      const vals = Object.values(row);
      let mun = row['Município'] || row['municipio'] || row['MUNICÍPIO'];
      if (!mun && vals.length > 1) mun = vals[1]; 
      else if (!mun && vals.length === 1) mun = vals[0];
      
      if (mun) {
        semiaridoMunicipios.add(normalize(String(mun)));
      }
    });
    console.log(`[Dev Parser] Semiárido: ${semiaridoMunicipios.size} municípios identificados.`);
  } else {
    console.warn('[Dev Parser] Aviso: Aba do Semiárido Baiano não encontrada na planilha.');
  }

  const TERRITORY_NAME_ALIASES = {
    [normalize('Rio Corrente')]: 'Bacia do Rio Corrente',
  };

  const normalizeTerritoryName = (value) => {
    const normalizedValue = normalize(value);
    if (!normalizedValue) return '';
    return TERRITORY_NAME_ALIASES[normalizedValue] || String(value || '').trim();
  };

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

      let idx = headers.findIndex((header) => normalize(header) === normPattern);
      if (idx !== -1) return idx;

      idx = headers.findIndex((header) => normalize(header).split(/\s+/).includes(normPattern));
      if (idx !== -1) return idx;

      const regex = new RegExp(`(^|\\s)${normPattern}($|\\s)`);
      idx = headers.findIndex((header) => regex.test(normalize(header)));
      if (idx !== -1) return idx;

      idx = headers.findIndex((header) => normalize(header).includes(normPattern));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const splitList = (value) => String(value || '').split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
  const isTruthy = (value) => ['sim', 's', 'yes', 'true', '1', 'existente', 'conecta'].includes(normalize(value));

  const territoryMap = new Map();

  const getTerritory = (name) => {
    const canonicalName = normalizeTerritoryName(name);
    if (!canonicalName) return null;

    if (!territoryMap.has(canonicalName)) {
      territoryMap.set(canonicalName, {
        territory: canonicalName,
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
        entidadesUnicas: new Set(), // COUNT DISTINCT: (entidade, municipio)
      });
    }
    return territoryMap.get(canonicalName);
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
      if (filled >= 4) { headerIdx = i; break; }
    }

    const rawHeaders = rows[headerIdx] || [];
    const headers = rawHeaders.map(normalizeHeader);

    const iTerritorio = findIndex(headers, ['territorio de identidade', 'territorio']);
    if (iTerritorio === -1) {
      console.log(`[Dev Parser] Aba ignorada (sem coluna de território): ${sheetName}`);
      return;
    }

    const iMunicipio = findIndex(headers, ['municipio', 'local']);
    const iPopulacao = findIndex(headers, ['populacao']);
    const iIfdm = findIndex(headers, ['ifdm']);
    const iIfdmTi = findIndex(headers, ['ifdm ti', 'ifdmt', 'ifdm territorial']);
    const iEntidades = findIndex(headers, ['valor entidades', 'entidades total', 'capacidade territorial', 'qtd_enti', 'qtd ent', 'qtd entidades']);
    let iEntidade = findIndex(headers, ['entidade', 'institui', 'nome da entidade']);
    if (iEntidade === iTerritorio || normalize(headers[iEntidade]).includes('territorio')) iEntidade = -1;
    let iTipo = findIndex(headers, ['tipo', 'natureza', 'categoria']);
    if (iTipo === iTerritorio || normalize(headers[iTipo]).includes('territorio')) iTipo = -1;
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

      const territoryName = normalizeTerritoryName(row[iTerritorio]);
      if (!territoryName) continue;

      const territory = getTerritory(territoryName);
      if (!territory) continue;
      const municipio = iMunicipio !== -1 ? String(row[iMunicipio] || '').trim() : '';

      let rowEntidades = 0;
      if (iEntidades !== -1) {
        rowEntidades = toNumber(row[iEntidades]);
      }
      if (rowEntidades <= 0 && iEntidade !== -1) {
        rowEntidades = 1;
      }

      const tipoText = iTipo !== -1 ? String(row[iTipo] || '').toLowerCase() : '';
      const tipoNorm = normalize(tipoText);
      const categoriasCapacidade = [
        'universidade', 
        'instituto federal', 
        'ict', 
        'centro de pesquisa', 
        'espaco dinamizador', 
        'parque tecnologico', 
        'incubadora'
      ];

      // Determinar categoria da entidade (ÚNICA VEZ POR ROW)
      let categoriaEntidade = null;
      let ehCapacidadeTerrritorial = false;
      
      if (categoriasCapacidade.some(cat => tipoNorm.includes(cat))) {
        ehCapacidadeTerrritorial = true;
        if (tipoNorm.includes('universidade')) {
          categoriaEntidade = 'univs';
          territory.capacidade.universidades += 1;
        } else if (tipoNorm.includes('instituto federal')) {
          categoriaEntidade = 'ifs';
          territory.capacidade.campiIFs += 1;
        } else if (tipoNorm.includes('ict')) {
          categoriaEntidade = 'icts';
          territory.capacidade.icts += 1;
        } else if (tipoNorm.includes('centro de pesquisa')) {
          categoriaEntidade = 'centrosPesquisa';
          territory.capacidade.centrosPesquisa += 1;
        } else if (tipoNorm.includes('espaco dinamizador')) {
          categoriaEntidade = 'espacos';
          territory.capacidade.espacosDinamizadores += 1;
        } else if (tipoNorm.includes('parque tecnologico')) {
          categoriaEntidade = 'parques';
          territory.capacidade.parquesTecnologicos += 1;
        } else if (tipoNorm.includes('incubadora')) {
          categoriaEntidade = 'incubadoras';
          territory.capacidade.incubadoras += 1;
        }
      }

      if (!territory.rows) territory.rows = [];
      territory.rows.push({
        municipio,
        entidade: iEntidade !== -1 ? String(row[iEntidade] || '').trim() : '',
        tipo: iTipo !== -1 ? String(row[iTipo] || '').trim() : '',
        qtd_enti: iEntidades !== -1 ? toNumber(row[iEntidades]) : 0,
        capacidade_area: rowEntidades,
      });

      territory.capacidadeRows.push({
        municipio,
        entidade: iEntidade !== -1 ? String(row[iEntidade] || '').trim() : '',
        tipo: iTipo !== -1 ? String(row[iTipo] || '').trim() : '',
        valor: rowEntidades,
        categoria: categoriaEntidade,
      });

      // COUNT DISTINCT: Se for Capacidade Territorial, adiciona combo (entidade, municipio) único
      if (ehCapacidadeTerrritorial) {
        const chaveUnica = `${municipio}|${iEntidade !== -1 ? String(row[iEntidade] || '').trim() : ''}`;
        territory.entidadesUnicas.add(chaveUnica);
      }

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

  // Processa as abas utilizando um Try/Catch para não quebrar a pipeline se uma aba estiver mal formatada
  targetSheetNames.forEach(sheetName => {
    try {
      processSheet(sheetName);
    } catch (e) {
      console.error(`[Dev Parser] Erro na aba ${sheetName}:`, e.message);
    }
  });

  if (!territoryMap.size) {
    throw new Error('Nenhuma linha territorial válida encontrada nas tabelas da planilha.');
  }

  const territories = Array.from(territoryMap.values()).map((entry) => {
    // RECALCULA entidadesTotal usando COUNT DISTINCT (únicas combinações entidade + municipio)
    entry.capacidade.entidadesTotal = entry.entidadesUnicas.size;

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

    // LÓGICA DE CRUZAMENTO COM O SEMIÁRIDO: Verifica se algum município do território pertence ao semiárido
    let isSemiarido = false;
    const allMunicipios = new Set();
    
    if (entry.rows) entry.rows.forEach(r => { if (r.municipio) allMunicipios.add(normalize(r.municipio)); });
    entry.desenvolvimentoRows.forEach(r => { if (r.municipio) allMunicipios.add(normalize(r.municipio)); });
    entry.cadeiasRows.forEach(r => { 
        if (r.municipio) allMunicipios.add(normalize(r.municipio));
        if (r.municipioSatelite) allMunicipios.add(normalize(r.municipioSatelite));
    });

    for (const mun of allMunicipios) {
      if (semiaridoMunicipios.has(mun)) {
        isSemiarido = true;
        break;
      }
    }

    // Se houver percentual na planilha marcando o semiárido, ele também valida a flag
    if (entry.semiaridoContador > 0 && (entry.semiaridoAcumulado / entry.semiaridoContador) > 0) {
        isSemiarido = true;
    }

    return {
      territory: entry.territory,
      isSemiarido: isSemiarido,
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
      territoriosSemiarido: territories.filter((item) => item.isSemiarido).length, // Métrica Extra
    },
  };

  const parseTime = Date.now() - startTime;
  console.log(`[Dev Parser] ✓ Parseado em ${parseTime}ms: ${result.summary.territories} territórios`);

  return result;
}
// ==================== FIM DO PROCESSADOR ====================

// Plugin para criar proxy do SharePoint em DEV
const sharepointProxyPlugin = () => ({
  name: 'sharepoint-proxy',
  configureServer(server) {
    server.middlewares.use('/api/sharepoint', async (req, res) => {
      console.log('[Dev Proxy] ⚡ Requisição recebida em /api/sharepoint');
      const startTime = Date.now();
      const nocache = req.url.includes('nocache=true');

      if (!nocache && devCache && Date.now() < devCacheExpiry) {
        const age = Math.round((Date.now() - (devCacheExpiry - DEV_CACHE_TTL)) / 1000);
        console.log(`[Dev Proxy] ✓ Cache HIT (idade: ${age}s) - respondendo instantaneamente`);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('X-Content-Source', 'dev-cache');
        res.setHeader('X-Cache-Age', age.toString());
        res.end(devCache);
        return;
      }

      // IMPORTANTE: Foi adicionado &action=default&web=0 para garantir o download binário forçado.
      // Modifique o link original da sua planilha aqui abaixo (mantenha o final intacto):
      let downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/IQCUmr5J0kxUQLKb9lRqZkT_AVOgJRieO_TN9lJiRxUzXI8?download=1';
      if (!downloadUrl.includes('web=0')) {
        downloadUrl += '&action=default&web=0';
      }

      if (nocache) {
        console.log('[Dev Proxy] 🚫 BYPASS DE CACHE SOLICITADO (nocache=true)');
      }

      console.log(`[Dev Proxy] Cache MISS - baixando Excel...`);

      let clientDisconnected = false;
      res.on('close', () => { clientDisconnected = true; });

      https.get(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Connection': 'keep-alive',
          // Descomente e insira o seu Cookie abaixo caso o erro 302 / texto HTML continue a aparecer:
          // 'Cookie': 'FedAuth=COLOQUE_SEU_COOKIE_AQUI',
        },
        timeout: 60000 // Tempo estendido para evitar ECONNRESET
      }, (response) => {
        const contentType = response.headers['content-type'] || '';
        console.log(`[Dev Proxy] Status: ${response.statusCode}, Content-Type: ${contentType}`);

        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
          let redirectUrl = response.headers.location;
          if (redirectUrl && redirectUrl.startsWith('/')) {
            redirectUrl = `https://prodeboffice365-my.sharepoint.com${redirectUrl}`;
          }
          console.log(`[Dev Proxy] Redirecionando para: ${redirectUrl?.substring(0, 80)}...`);

          const cookies = response.headers['set-cookie'];
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          };
          if (cookies) {
            headers['Cookie'] = cookies.map(c => c.split(';')[0]).join('; ');
          }

          https.get(redirectUrl, { headers }, (redirectResponse) => {
            handleResponse(redirectResponse, res, startTime);
          }).on('error', (err) => {
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
        console.log(`[Dev Proxy] 📊 Processando Excel...`);
        const parseStart = Date.now();
        const jsonData = parseSpreadsheet(buffer);
        const parseTime = Date.now() - parseStart;

        const jsonString = JSON.stringify(jsonData);
        console.log(`[Dev Proxy] ✓ Parseamento finalizado em ${parseTime}ms`);

        devCache = jsonString;
        devCacheExpiry = Date.now() + DEV_CACHE_TTL;

        if (!res.writableEnded) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('X-Content-Source', 'dev-processed');
          res.end(jsonString);
        }
      } catch (parseError) {
        console.error('[Dev Proxy] Erro ao processar Excel:', parseError);
        sendError(res, 500, 'Erro ao processar planilha: ' + parseError.message);
      }
    });
    response.on('error', (err) => {
      sendError(res, 500, 'Erro ao ler dados do SharePoint: ' + err.message);
    });
  } else {
    console.error(`[Dev Proxy] Tipo inválido: ${contentType}`);
    sendError(res, 401, 'SharePoint retornou página HTML em vez de Excel. O link pode precisar de autenticação ou a conexão foi recusada.');
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