import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

let devCache = null;
let devCacheExpiry = 0;
const DEV_CACHE_TTL = 30 * 60 * 1000; // 30 minutos
const CACHE_VERSION = 'v14'; 

// ==================== PROCESSADOR DE EXCEL (DEV) ====================

// Limpeza de valores normais (usada internamente para matching robusto)
function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// O DICIONÁRIO SUPREMO: Interceta variações bizarras e unifica tudo na mesma string
function expandirNomeEntidade(nomeRaw) {
    let nome = String(nomeRaw || '').trim();
    let nomeNorm = normalize(nome);

    if (nomeNorm.includes('universidade federal da bahia') || nomeNorm === 'ufba') return 'Universidade Federal da Bahia (UFBA)';
    if (nomeNorm.includes('universidade do estado da bahia') || nomeNorm === 'uneb') return 'Universidade do Estado da Bahia (UNEB)';
    if (nomeNorm.includes('universidade federal do oeste da bahia') || nomeNorm === 'ufob') return 'Universidade Federal do Oeste da Bahia (UFOB)';
    if (nomeNorm.includes('universidade federal do reconcavo') || nomeNorm === 'ufrb') return 'Universidade Federal do Recôncavo da Bahia (UFRB)';
    if (nomeNorm.includes('universidade federal do sul da bahia') || nomeNorm === 'ufsb') return 'Universidade Federal do Sul da Bahia (UFSB)';
    if (nomeNorm.includes('universidade federal do vale do sao francisco') || nomeNorm === 'univasf') return 'Universidade Federal do Vale do São Francisco (UNIVASF)';
    if (nomeNorm.includes('universidade estadual de santa cruz') || nomeNorm === 'uesc') return 'Universidade Estadual de Santa Cruz (UESC)';
    if (nomeNorm.includes('universidade estadual do sudoeste') || nomeNorm === 'uesb') return 'Universidade Estadual do Sudoeste da Bahia (UESB)';
    if (nomeNorm.includes('universidade estadual de feira') || nomeNorm === 'uefs') return 'Universidade Estadual de Feira de Santana (UEFS)';
    
    // CORREÇÃO DOS INSTITUTOS: Apanha o nome gigante e reduz para o padrão
    if (nomeNorm.includes('instituto federal baiano') || nomeNorm === 'ifbaiano') return 'Instituto Federal Baiano (IF BAIANO)';
    if (nomeNorm.includes('instituto federal de educacao ciencia e tecnologia da bahia') || nomeNorm.includes('instituto federal da bahia') || nomeNorm === 'ifba') return 'Instituto Federal da Bahia (IFBA)';
    
    if (nomeNorm.includes('servico nacional de aprendizagem industrial') || nomeNorm === 'senai') return 'Serviço Nacional de Aprendizagem Industrial (SENAI)';
    if (nomeNorm.includes('servico nacional de aprendizagem comercial') || nomeNorm === 'senac') return 'Serviço Nacional de Aprendizagem Comercial (SENAC)';
    if (nomeNorm.includes('mauricio de nassau') || nomeNorm === 'uninassau') return 'Centro Universitário Maurício de Nassau (UNINASSAU)';
    if (nomeNorm === 'unirb') return 'Centro Universitário UNIRB';
    if (nomeNorm.includes('catolica do salvador') || nomeNorm === 'ucsal') return 'Universidade Católica do Salvador (UCSAL)';
    if (nomeNorm.includes('universidade salvador') || nomeNorm === 'unifacs') return 'Universidade Salvador (UNIFACS)';
    if (nomeNorm.includes('capim grosso') || nomeNorm === 'fcg') return 'Faculdade Capim Grosso (FCG)';

    // Fallback limpando erros de corte comuns caso não bata com nenhuma conhecida
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
      
      // EXTRATOR IMPLACÁVEL DA COLUNA A
      const cabeçalhoColunaA = Object.keys(rawRow)[0]; 
      const valorColunaA = String(rawRow[cabeçalhoColunaA] || '').trim(); 
      
      let entidadeRaw = '';

      if (orgAcademica !== '' || categoriaAdm !== '' || safeKey(cabeçalhoColunaA).includes('ies') || safeKey(cabeçalhoColunaA).includes('nome')) {
          entidadeRaw = valorColunaA;
      } else {
          entidadeRaw = String(row['entidade'] || row['nomedaentidade'] || row['instituicao'] || row['ies'] || row['sigla'] || valorColunaA).trim();
      }

      // Passamos o valor extraído pelo tradutor/limpador super estrito
      const entidadesExpandida = expandirNomeEntidade(entidadeRaw);
      
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

      // Determinar a Categoria para os KPIs
      const tipoNorm = normalize(tipoOriginal + ' ' + orgAcademica + ' ' + categoriaAdm);
      let categoriaEntidade = null;
      let isCTI = false;
      
      if (['universidade', 'faculdade', 'centro universitario', 'superior'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'univs'; isCTI = true; }
      else if (['instituto federal', 'ifba', 'ifbaiano'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'ifs'; isCTI = true; }
      else if (['ict'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'icts'; isCTI = true; }
      else if (['centro de pesquisa', 'pesquisa'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'centrosPesquisa'; isCTI = true; }
      else if (['espaco', 'dinamizador'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'espacos'; isCTI = true; }
      else if (['parque'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'parques'; isCTI = true; }
      else if (['incubadora'].some(c => tipoNorm.includes(c))) { categoriaEntidade = 'incubadoras'; isCTI = true; }

      // ID Único perfeitamente alinhado: Instituição Normalizada + Cidade
      const uniqueRowId = (entidadesExpandida && municipio) 
          ? `ent_${safeKey(entidadesExpandida)}_${safeKey(municipio)}` 
          : `aba_${sheetNorm}_linha_${idx}`;

      territoryNamesList.forEach(tName => {
         const territory = getTerritory(tName);
         if (!territory) return;

         // ISOLAMENTO 1: CAPACIDADE TERRITORIAL (CT&I) E ENSINO SUPERIOR
         if (sheetNorm.includes('capacidade') || sheetNorm.includes('cti') || sheetNorm.includes('ensino') || orgAcademica !== '') {
             if (isCTI && entidadesExpandida !== '') {
                 // A trava bloqueia duplicados porque a planilha antiga (com os dados bons) roda PRIMEIRO
                 const alreadyExists = territory.capacidadeRows.some(e => e.id === uniqueRowId);
                 if (!alreadyExists) {
                     territory.capacidadeRows.push({
                         id: uniqueRowId,
                         municipio,
                         entidade: entidadesExpandida,
                         tipo: tipoFinal || 'Instituição', 
                         categoria: categoriaEntidade, 
                         quantidade: qtd
                     });
                 }
             }
         }

         // ISOLAMENTO 2: CADEIAS PRODUTIVAS E IGs POTENCIAIS
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
                     entidade: entidadesExpandida, 
                     tipo: tipoOriginal,
                     quantidade: qtd,
                     fonte
                 });
             }
         }

         // ISOLAMENTO 3: DESENVOLVIMENTO (IFDM)
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

         // ISOLAMENTO 4: ASSISTÊNCIA PÚBLICA
         const assistencia = String(row['assistenciapublica'] || row['conecta'] || '');
         const iniciativas = String(row['iniciativas'] || row['dispositivosestaduais'] || '');
         if (isTruthy(assistencia)) territory.assistenciaPublica.existe = true;
         if (iniciativas !== '') splitList(iniciativas).forEach(i => territory.assistenciaPublica.iniciativas.add(i));

         // ISOLAMENTO 5: CURSOS EM CT&I
         if (sheetNorm.includes('curso') || sheetNorm.includes('ensino')) {
             const nomeCurso = String(row['curso'] || '').trim();
             if (nomeCurso !== '') {
                 territory.cursosRows.push({
                     id: `curso_${uniqueRowId}_${idx}`,
                     municipio,
                     entidade: entidadesExpandida, 
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

  // ORDENAÇÃO DE ABAS: Garante que a planilha Principal (Capacidade/CTI) corre primeiro!
  const ordenadasSheetNames = [...targetSheetNames].sort((a, b) => {
      const aKey = safeKey(a);
      const bKey = safeKey(b);
      const aIsMain = aKey.includes('capacidade') || aKey.includes('cti');
      const bIsMain = bKey.includes('capacidade') || bKey.includes('cti');
      if (aIsMain && !bIsMain) return -1;
      if (!aIsMain && bIsMain) return 1;
      return 0;
  });

  ordenadasSheetNames.forEach(sheetName => {
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