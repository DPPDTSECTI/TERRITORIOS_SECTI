import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

let devCache = null;
let devCacheExpiry = 0;
const DEV_CACHE_TTL = 30 * 60 * 1000; // 30 minutos
const CACHE_VERSION = 'v12'; 

// ==================== PROCESSADOR DE EXCEL (DEV) ====================

// Dicionário para limpar e corrigir eventuais sujeiras nos nomes
const DICIONARIO_SIGLAS = {
    'UFBA': 'Universidade Federal da Bahia (UFBA)',
    'UNEB': 'Universidade do Estado da Bahia (UNEB)',
    'UFOB': 'Universidade Federal do Oeste da Bahia (UFOB)',
    'UFRB': 'Universidade Federal do Recôncavo da Bahia (UFRB)',
    'UFSB': 'Universidade Federal do Sul da Bahia (UFSB)',
    'UNIVASF': 'Universidade Federal do Vale do São Francisco (UNIVASF)',
    'UESC': 'Universidade Estadual de Santa Cruz (UESC)',
    'UESB': 'Universidade Estadual do Sudoeste da Bahia (UESB)',
    'UEFS': 'Universidade Estadual de Feira de Santana (UEFS)',
    'IFBA': 'Instituto Federal da Bahia (IFBA)',
    'IFBAIANO': 'Instituto Federal Baiano (IF BAIANO)',
    'SENAI': 'Serviço Nacional de Aprendizagem Industrial (SENAI)',
    'SENAC': 'Serviço Nacional de Aprendizagem Comercial (SENAC)',
    'UNINASSAU': 'Centro Universitário Maurício de Nassau (UNINASSAU)',
    'UNIRB': 'Centro Universitário UNIRB',
    'UCSAL': 'Universidade Católica do Salvador (UCSAL)',
    'UNIFACS': 'Universidade Salvador (UNIFACS)',
    'FCG': 'Faculdade Capim Grosso (FCG)'
};

function expandirNomeEntidade(nomeRaw) {
    let nome = String(nomeRaw || '').trim();
    
    // Verifica primeiro se o nome é puramente uma sigla que precisa ser expandida
    for (const [sigla, nomeCompleto] of Object.entries(DICIONARIO_SIGLAS)) {
        if (nome.toUpperCase() === sigla) {
            return nomeCompleto; 
        }
    }
    
    // Limpa os cortes bizarros da planilha (Caso a Coluna A venha com erros)
    nome = nome.replace(/^UNIVERSI\s/gi, 'Universidade '); 
    nome = nome.replace(/^INSTITUTO\s/gi, 'Instituto ');
    nome = nome.replace(/^CENTRO U\s/gi, 'Centro Universitário ');
    nome = nome.replace(/^FACULDAE\s/gi, 'Faculdade ');
    nome = nome.replace(/^FACULDA\s/gi, 'Faculdade ');
    
    return nome;
}

// Função ultra-rigorosa para limpar cabeçalhos
function safeKey(k) {
  return String(k || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Limpeza de valores normais
function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
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
    throw new Error("ACESSO NEGADO: O SharePoint retornou a página de Login (HTML). Verifique as permissões do ficheiro ou atualize os Cookies.");
  }

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

  const targetSheetNames = workbook.SheetNames;
  if (!targetSheetNames.length) throw new Error('Planilha vazia');

  // 1. CARREGAR A LISTA DO SEMIÁRIDO BAIANO
  const semiaridoMunicipios = new Set();
  const semiaridoSheetName = targetSheetNames.find(name => safeKey(name).includes('semiarido'));
  
  if (semiaridoSheetName) {
    const sheet = workbook.Sheets[semiaridoSheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    rawRows.forEach(row => {
      const munKey = Object.keys(row).find(k => safeKey(k).includes('municipio'));
      const munVal = munKey ? row[munKey] : Object.values(row)[1] || Object.values(row)[0];
      if (munVal) semiaridoMunicipios.add(normalize(String(munVal)));
    });
  }

  const TERRITORY_NAME_ALIASES = {
    [normalize('Rio Corrente')]: 'Bacia do Rio Corrente',
  };

  const normalizeTerritoryName = (value) => {
    const normalizedValue = normalize(value);
    if (!normalizedValue) return '';
    return TERRITORY_NAME_ALIASES[normalizedValue] || String(value || '').trim();
  };

  const territoryMap = new Map();

  const getTerritory = (name) => {
    const canonicalName = normalizeTerritoryName(name);
    if (!canonicalName) return null;
    const displayName = String(name).trim();

    if (!territoryMap.has(canonicalName)) {
      territoryMap.set(canonicalName, {
        territory: displayName,
        capacidadeRows: [],
        cadeiasRows: [],
        desenvolvimentoRows: [],
        cursosRows: [],
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

    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (rawRows.length === 0) return;

    const sheetNorm = safeKey(sheetName);

    rawRows.forEach((rawRow, idx) => {
      const row = {};
      for (const key in rawRow) {
          row[safeKey(key)] = rawRow[key];
      }

      const territorioRaw = row['territoriodeidentidade'] || row['territorioidentidade'] || row['territoriosdeidentidade'] || row['territorio'] || row['territorios'];
      if (!territorioRaw) return;

      const territoryNamesList = splitList(territorioRaw);
      
      const municipio = String(row['municipio'] || row['cidade'] || row['local'] || '').trim();
      const orgAcademica = String(row['orgacademica'] || '').trim();
      const categoriaAdm = String(row['categoriaadm'] || '').trim();
      
      // =================================================================
      // EXTRATOR IMPLACÁVEL: PUXA O NOME DA COLUNA A DA PLANILHA
      // =================================================================
      const cabeçalhoColunaA = Object.keys(rawRow)[0]; // Descobre o nome do primeiro cabeçalho (Coluna A)
      const valorColunaA = String(rawRow[cabeçalhoColunaA] || '').trim(); // Pega o valor exato da Coluna A
      
      let entidadeRaw = '';

      // Se a planilha tem as colunas da "nova planilha" (orgacademica) OU se não encontrou nada na lógica padrão, FORÇA a Coluna A!
      if (orgAcademica !== '' || categoriaAdm !== '' || safeKey(cabeçalhoColunaA).includes('ies') || safeKey(cabeçalhoColunaA).includes('nome')) {
          entidadeRaw = valorColunaA;
      } else {
          // Lógica de fallback para planilhas antigas
          entidadeRaw = String(row['entidade'] || row['nomedaentidade'] || row['instituicao'] || row['ies'] || row['sigla'] || valorColunaA).trim();
      }

      // Passamos o valor extraído pelo tradutor/limpador
      const entidade = expandirNomeEntidade(entidadeRaw);
      
      const tipoOriginal = String(row['tipo'] || row['tipodecadeia'] || row['classificacao'] || row['categoria'] || row['natureza'] || '').trim();
      const qtd = toNumber(row['quantidade'] || row['qtd'] || row['qtdenti'] || row['valorentidades'] || 1);

      let tipoFinal = tipoOriginal;
      if (orgAcademica || categoriaAdm) {
          let tipoParts = [];
          if (orgAcademica) tipoParts.push(orgAcademica); 
          
          const catNorm = categoriaAdm.toLowerCase();
          if (catNorm.includes('privada')) tipoParts.push('Particular');
          else if (catNorm.includes('estadual')) tipoParts.push('Pública Estadual');
          else if (catNorm.includes('federal')) tipoParts.push('Pública Federal');
          else if (categoriaAdm) tipoParts.push(categoriaAdm);

          tipoFinal = tipoParts.join(' - '); 
      }

      const uniqueRowId = (entidade && municipio) 
          ? `ent_${safeKey(entidade)}_${safeKey(municipio)}` 
          : `aba_${sheetNorm}_linha_${idx}`;

      territoryNamesList.forEach(tName => {
         const territory = getTerritory(tName);
         if (!territory) return;

         // CAPACIDADE TERRITORIAL (CT&I) E ENSINO SUPERIOR
         if (sheetNorm.includes('capacidade') || sheetNorm.includes('cti') || sheetNorm.includes('ensino') || orgAcademica !== '') {
             let categoriaEntidade = null;
             let isCTI = false;
             
             const tipoNorm = normalize(tipoOriginal + ' ' + orgAcademica + ' ' + categoriaAdm);
             
             if (['universidade', 'faculdade', 'centro universitario', 'superior'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'univs'; isCTI = true; }
             else if (['instituto federal', 'ifba', 'ifbaiano'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'ifs'; isCTI = true; }
             else if (['ict'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'icts'; isCTI = true; }
             else if (['centro de pesquisa', 'pesquisa'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'centrosPesquisa'; isCTI = true; }
             else if (['espaco', 'dinamizador'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'espacos'; isCTI = true; }
             else if (['parque'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'parques'; isCTI = true; }
             else if (['incubadora'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'incubadoras'; isCTI = true; }

             if (isCTI && entidade !== '') {
                 const alreadyExists = territory.capacidadeRows.some(e => e.id === uniqueRowId);
                 if (!alreadyExists) {
                     territory.capacidadeRows.push({
                         id: uniqueRowId,
                         municipio,
                         entidade,
                         tipo: tipoFinal || 'Instituição', 
                         categoria: categoriaEntidade, 
                         quantidade: qtd
                     });
                 }
             }
         }

         // CADEIAS PRODUTIVAS
         if (sheetNorm.includes('cadeia') || sheetNorm.includes('ig') || sheetNorm.includes('potencial')) {
             const cadeia = String(row['cadeiaprodutiva'] || row['cadeiasprodutivas'] || row['cadeia'] || row['segmento'] || '').trim();
             if (cadeia !== '') {
                 const sede = String(row['sede'] || row['municipiosatelite'] || '').trim();
                 const abrangencia = String(row['municipiospertencentes'] || row['abrangencia'] || '').trim();
                 const fonte = String(row['fontedodado'] || row['fonte'] || row['link'] || '').trim();

                 territory.cadeiasRows.push({
                     id: `aba_${sheetNorm}_linha_${idx}`,
                     segmento: cadeia,
                     sede: sede || abrangencia.split(/[;,]/)[0].trim() || municipio || 'N/A',
                     municipiosPertencentes: abrangencia,
                     entidade, 
                     tipo: tipoOriginal,
                     quantidade: qtd,
                     fonte
                 });
             }
         }

         // DESENVOLVIMENTO (IFDM)
         if (sheetNorm.includes('desenvolvimento') || sheetNorm.includes('ifdm')) {
             const ifdm = toNumber(row['ifdm']);
             const pop = toNumber(row['populacao']);
             const ifdmTi = toNumber(row['ifdmt'] || row['ifdmti']);

             if (municipio) {
                 territory.desenvolvimentoRows.push({ municipio, ifdm, populacao: pop });
             }

             if (ifdm > 0 && pop > 0) {
                 territory.desenvolvimento.somaIfdmPop += ifdm * pop;
                 territory.desenvolvimento.populacaoTotal += pop;
             }
             if (ifdmTi > 0) territory.desenvolvimento.ifdmTi = ifdmTi;
         }

         // ASSISTÊNCIA PÚBLICA
         const assistencia = String(row['assistenciapublica'] || row['conecta'] || '');
         const iniciativas = String(row['iniciativas'] || row['dispositivosestaduais'] || '');
         if (isTruthy(assistencia)) territory.assistenciaPublica.existe = true;
         if (iniciativas !== '') splitList(iniciativas).forEach(i => territory.assistenciaPublica.iniciativas.add(i));

         // CURSOS EM CT&I
         if (sheetNorm.includes('curso') || sheetNorm.includes('ensino')) {
             const nomeCurso = String(row['curso'] || '').trim();
             if (nomeCurso !== '') {
                 territory.cursosRows.push({
                     id: `curso_${uniqueRowId}_${idx}`,
                     municipio,
                     entidade, // Nome expandido com sucesso
                     curso: nomeCurso,
                     areaGeral: String(row['areageral'] || row['area'] || '').trim(),
                     nivel: String(row['grauacademico'] || '').trim(),
                     modalidade: String(row['modalidade'] || '').trim(),
                     orgAcademica,
                     categoriaAdm,
                     quantidade: qtd
                 });
             }
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

    const allMunicipios = new Set();
    entry.capacidadeRows.forEach(e => { if (e.municipio) allMunicipios.add(normalize(e.municipio)); });
    entry.desenvolvimentoRows.forEach(e => { if (e.municipio) allMunicipios.add(normalize(e.municipio)); });
    entry.cursosRows.forEach(e => { if (e.municipio) allMunicipios.add(normalize(e.municipio)); });
    entry.cadeiasRows.forEach(e => { 
        if (e.sede && e.sede !== 'N/A') allMunicipios.add(normalize(e.sede)); 
        splitList(e.municipiosPertencentes).forEach(m => { if (m) allMunicipios.add(normalize(m)); });
    });

    let isSemiarido = false;
    let qtdSemi = 0;
    
    allMunicipios.forEach(m => {
        if (semiaridoMunicipios.has(m)) { isSemiarido = true; qtdSemi++; }
    });

    const pctSemiarido = allMunicipios.size > 0 ? (qtdSemi / allMunicipios.size) * 100 : 0;

    return {
      territory: entry.territory,
      isSemiarido: isSemiarido,
      pctSemiarido: pctSemiarido,
      capacidadeDetalhada: entry.capacidadeRows,
      cadeiasProdutivasDetalhado: entry.cadeiasRows, 
      desenvolvimentoDetalhado: entry.desenvolvimentoRows,
      cursosDetalhado: entry.cursosRows,
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
    semiaridoMunicipiosList: Array.from(semiaridoMunicipios),
    summary: {
      territories: territories.length
    },
  };

  console.log(`[Dev Parser] ✓ Parseado: ${result.summary.territories} territórios`);

  try {
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'dados.json'), JSON.stringify(result, null, 2));
    console.log(`[Dev Parser] 💾 JSON Salvo Localmente.`);
  } catch (err) { 
    console.warn(`[Dev Parser] Falha ao salvar JSON local: ${err.message}`); 
  }

  return result;
}
// ==================== FIM DO PROCESSADOR ====================

const sharepointProxyPlugin = () => ({
  name: 'sharepoint-proxy',
  configureServer(server) {
    server.middlewares.use('/api/sharepoint', async (req, res) => {
      const startTime = Date.now();
      const nocache = req.url.includes('nocache=true');

      if (!nocache && devCache && Date.now() < devCacheExpiry) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.end(devCache);
        return;
      }

      let downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/IQCUmr5J0kxUQLKb9lRqZkT_AVOgJRieO_TN9lJiRxUzXI8?download=1';
      if (!downloadUrl.includes('web=0')) downloadUrl += '&action=default&web=0';

      https.get(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
  },
  server: { hmr: { overlay: true } },
  optimizeDeps: {
    include: ['react', 'react-dom', 'xlsx', 'topojson-client'],
  },
});