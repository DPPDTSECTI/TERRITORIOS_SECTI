import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

let devCache = null;
let devCacheExpiry = 0;
const DEV_CACHE_TTL = 30 * 60 * 1000; // 30 minutos
const CACHE_VERSION = 'v29_ifdm_media_simples'; // Força atualização para nova métrica IFDM

// ==================== PROCESSADOR DE EXCEL (DEV) ====================

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function safeKey(k) {
  return String(k || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function expandirNomeEntidade(nomeRaw, tipoRaw = '', isCadeia = false) {
  let nome = String(nomeRaw || '').trim();
  let tipoNorm = normalize(tipoRaw);
  
  const isEcossistema = ['incubadora', 'parque', 'espacoDinamizadores', 'pesquisa', 'dinamizador', 'ict'].some(term => tipoNorm.includes(term));

  if (!isEcossistema && !isCadeia) {
    let nomeNorm = normalize(nome).replace(/\b(campus|polo|unidade|centro de|ead|departamento)\b.*$/g, '').trim();

    const dicionario = [
      { padrao: /\b(ufba|universidade federal da bahia)\b/, oficial: 'Universidade Federal da Bahia (UFBA)' },
      { padrao: /\b(ufrb|reconcavo da bahia|reconcavo)\b/, oficial: 'Universidade Federal do Recôncavo da Bahia (UFRB)' },
      { padrao: /\b(ufob|oeste da bahia)\b/, oficial: 'Universidade Federal do Oeste da Bahia (UFOB)' },
      { padrao: /\b(ufsb|sul da bahia)\b/, oficial: 'Universidade Federal do Sul da Bahia (UFSB)' },
      { padrao: /\b(univasf|vale do sao francisco)\b/, oficial: 'Universidade Federal do Vale do São Francisco (UNIVASF)' },
      { padrao: /\b(uneb|estado da bahia|estadual da bahia)\b/, oficial: 'Universidade do Estado da Bahia (UNEB)' },
      { padrao: /\b(uesc|santa cruz)\b/, oficial: 'Universidade Estadual de Santa Cruz (UESC)' },
      { padrao: /\b(uesb|sudoeste da bahia|sudoeste)\b/, oficial: 'Universidade Estadual do Sudoeste da Bahia (UESB)' },
      { padrao: /\b(uefs|feira de santana)\b/, oficial: 'Universidade Estadual de Feira de Santana (UEFS)' },
      { padrao: /\b(ifbaiano|if baiano|tecnologia baiano)\b/, oficial: 'Instituto Federal Baiano (IF BAIANO)' },
      { padrao: /\b(ifba|instituto federal da bahia|ciencia e tecnologia da bahia)\b/, oficial: 'Instituto Federal da Bahia (IFBA)' },
      { padrao: /\b(senai|cimatec)\b/, oficial: 'Serviço Nacional de Aprendizagem Industrial (SENAI)' },
      { padrao: /\b(senac)\b/, oficial: 'Serviço Nacional de Aprendizagem Comercial (SENAC)' },
      { padrao: /\b(uninassau|mauricio de nassau)\b/, oficial: 'Centro Universitário Maurício de Nassau (UNINASSAU)' },
      { padrao: /\b(unirb)\b/, oficial: 'Centro Universitário UNIRB' },
      { padrao: /\b(ucsal|catolica do salvador)\b/, oficial: 'Universidade Católica do Salvador (UCSAL)' },
      { padrao: /\b(unifacs|universidade salvador)\b/, oficial: 'Universidade Salvador (UNIFACS)' },
      { padrao: /\b(uniftc|ftc|tecnologia e ciencias)\b/, oficial: 'Centro Universitário UniFTC' },
      { padrao: /\b(estacio|estacio de sa)\b/, oficial: 'Universidade Estácio de Sá' },
      { padrao: /\b(fcg|capim grosso)\b/, oficial: 'Faculdade Capim Grosso (FCG)' }
    ];

    for (const item of dicionario) {
      if (item.padrao.test(nomeNorm)) {
        return item.oficial;
      }
    }

    nome = nome.replace(/^UNIVERSI[A-Z]*\s/gi, 'Universidade '); 
    nome = nome.replace(/^INSTITUT[A-Z]*\s/gi, 'Instituto ');
    nome = nome.replace(/^CENTRO U[A-Z]*\s/gi, 'Centro Universitário ');
    nome = nome.replace(/^FACULDA[A-Z]*\s/gi, 'Faculdade ');
  }
  
  nome = nome.replace(/\s*[-–|/]\s*(Campus|Polo|Unidade|Centro).*$/i, '');
  nome = nome.replace(/\s+(Campus|Polo|Unidade)\s+.*$/i, '');
  
  return nome.trim();
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
        // NOVO: Adicionado parâmetros para Média Simples (soma e quantidade)
        desenvolvimento: { ifdmTi: null, somaIfdm: 0, qtdMunicipiosIfdm: 0, populacaoTotal: 0 },
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

    const isCadeiaSheet = ['cadeiaprodutiva', 'cadeiasprodutivas', 'igpotenciais', 'igspotenciais', 'potenciais', 'producao', 'apl', 'arranjoprodutivo'].some(term => sheetNorm.includes(term)) || sheetNorm === 'ig' || sheetNorm === 'igs';
    const isCursoSheet = ['curso', 'ensino', 'superior', 'graduacao', 'educacao'].some(term => sheetNorm.includes(term));
    const isIfdmSheet = ['ifdm', 'desenvolvimento', 'populacao', 'socioecon'].some(term => sheetNorm.includes(term));
    const isCapacidadeSheet = (sheetNorm.includes('capacidade') || sheetNorm.includes('cti') || sheetNorm.includes('infraestrutura') || sheetNorm.includes('entidade')) && !isCadeiaSheet && !isCursoSheet && !isIfdmSheet;

    if (!isCadeiaSheet && !isCursoSheet && !isIfdmSheet && !isCapacidadeSheet) return;

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
      const rede = String(row['rede'] || '').trim(); 
      
      const cabeçalhoColunaA = Object.keys(rawRow)[0]; 
      const valorColunaA = String(rawRow[cabeçalhoColunaA] || '').trim(); 
      
      let entidadeRaw = '';
      let tipoOriginal = '';

      if (isCursoSheet) {
          entidadeRaw = String(row['universidade'] || row['ies'] || '').trim();
          tipoOriginal = String(orgAcademica).trim();
      } else if (isCadeiaSheet) {
          entidadeRaw = String(row['entidadegestora'] || row['entidade'] || row['associacao'] || '').trim();
          tipoOriginal = String(row['tipo'] || row['tipodecadeia'] || row['classificacao'] || '').trim();
      } else {
          entidadeRaw = String(row['entidade'] || row['nomedaentidade'] || row['instituicao'] || row['ies'] || row['sigla'] || valorColunaA).trim();
          tipoOriginal = String(row['tipo'] || row['categoria'] || row['natureza'] || '').trim();
      }

      const entidadesExpandida = expandirNomeEntidade(entidadeRaw, tipoOriginal, isCadeiaSheet);
      const qtd = toNumber(row['quantidade'] || row['qtd'] || row['qtdenti'] || row['valorentidades'] || 1);

      let tipoFinal = tipoOriginal;
      let categoriaEntidade = null;
      let isCTI = false;
      
      if (isCapacidadeSheet) {
          isCTI = true; 
          tipoFinal = tipoOriginal; 

          const tNorm = normalize(tipoOriginal);
          const isPrivadaCapacidade = tNorm.includes('privada') || tNorm.includes('particular');
          
          if (['universidade', 'faculdade', 'centro universitario', 'superior'].some(c => tNorm.includes(c))) { 
              categoriaEntidade = isPrivadaCapacidade ? 'campiUniversidadePrivada' : 'campiUniversidadePublica';
               if (!isPrivadaCapacidade && !tNorm.includes('publica') && !tNorm.includes('federal') && !tNorm.includes('estadual')) {
                   tipoFinal = tipoFinal ? `${tipoFinal} - Pública` : 'Universidade Pública';
               }
          }
          else if (['instituto federal', 'ifba', 'ifbaiano'].some(c => tNorm.includes(c))) { categoriaEntidade = 'campiInstitutoFederal'; }
          else if (['centro de pesquisa', 'pesquisa'].some(c => tNorm.includes(c))) { categoriaEntidade = 'centrosPesquisa'; }
          else if (['ict'].some(c => tNorm.includes(c))) { categoriaEntidade = 'icts'; }
          else if (['incubadora'].some(c => tNorm.includes(c))) { categoriaEntidade = 'incubadoras'; }
          else if (['espacoDinamizadores', 'dinamizador'].some(c => tNorm.includes(c))) { categoriaEntidade = 'espacoDinamizadoress'; }
          else if (['parque'].some(c => tNorm.includes(c))) { categoriaEntidade = 'parquesTecnologicos'; }
          else { categoriaEntidade = 'outros'; }
          
      } else if (isCursoSheet) {
          isCTI = true; 
          
          const orgNorm = normalize(tipoOriginal);
          const catNorm = normalize(`${categoriaAdm} ${rede}`);

          const isPrivada = catNorm.includes('privada') || catNorm.includes('lucrativo') || catNorm.includes('particular');

          if (['universidade', 'faculdade', 'centro universitario', 'superior'].some(c => orgNorm.includes(c))) { 
              categoriaEntidade = isPrivada ? 'campiUniversidadePrivada' : 'campiUniversidadePublica'; 
          }
          else if (['instituto federal', 'ifba', 'ifbaiano'].some(c => orgNorm.includes(c))) { categoriaEntidade = 'campiInstitutoFederal'; }
          else { categoriaEntidade = 'outros'; }

          let tipoParts = [tipoOriginal];
          if (isPrivada) tipoParts.push('Privada');
          else if (catNorm.includes('estadual')) tipoParts.push('Pública Estadual');
          else if (catNorm.includes('federal')) tipoParts.push('Pública Federal');
          else tipoParts.push('Pública');

          tipoFinal = tipoParts.filter(Boolean).join(' - ');
      }

      const uniqueRowId = (entidadesExpandida && municipio) 
          ? `ent_${safeKey(entidadesExpandida)}_${safeKey(municipio)}` 
          : `aba_${sheetNorm}_linha_${idx}`;

      territoryNamesList.forEach(tName => {
         const territory = getTerritory(tName);
         if (!territory) return;

         if (isCapacidadeSheet || isCursoSheet) {
             if (isCTI && entidadesExpandida !== '') {
                 const alreadyExists = territory.capacidadeRows.some(e => e.id === uniqueRowId);
                 if (!alreadyExists) {
                     territory.capacidadeRows.push({
                         id: uniqueRowId,
                         municipio,
                         entidade: entidadesExpandida,
                         tipo: tipoFinal || 'Instituição', 
                         categoria: categoriaEntidade || 'outros', 
                         quantidade: qtd
                     });
                 }
             }
         }

         if (isCadeiaSheet) {
             const cadeia = String(row['cadeiaprodutiva'] || row['cadeiasprodutivas'] || row['cadeia'] || row['segmento'] || '').trim();
             if (cadeia !== '') {
                 const sede = String(row['sede'] || row['municipiosatelite'] || '').trim();
                 const abrangencia = String(row['municipiospertencentes'] || row['abrangencia'] || '').trim();
                 const fonte = String(row['fontedodado'] || row['fonte'] || row['link'] || '').trim();

                 const semanticId = `cad_${safeKey(cadeia)}_${safeKey(sede)}_${safeKey(entidadesExpandida)}`;

                 territory.cadeiasRows.push({
                     id: semanticId,
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

         // AQUI FOI ALTERADO PARA A LÓGICA DE MÉDIA SIMPLES
         if (isIfdmSheet) {
             const ifdm = toNumber(row['ifdm']);
             const pop = toNumber(row['populacao']);
             const ifdmTi = toNumber(row['ifdmt2'] || row['ifdmti']);

             if (municipio) {
                 territory.desenvolvimentoRows.push({ municipio, ifdm, populacao: pop });
             }

             if (ifdm > 0) {
                 territory.desenvolvimento.somaIfdm += ifdm;
                 territory.desenvolvimento.qtdMunicipiosIfdm += 1;
             }
             if (pop > 0) {
                 territory.desenvolvimento.populacaoTotal += pop;
             }
             if (ifdmTi > 0) territory.desenvolvimento.ifdmTi = ifdmTi;
         }

         const assistencia = String(row['assistenciapublica'] || row['conecta'] || '');
         const iniciativas = String(row['iniciativas'] || row['dispositivosestaduais'] || '');
         if (isTruthy(assistencia)) territory.assistenciaPublica.existe = true;
         if (iniciativas !== '') splitList(iniciativas).forEach(i => territory.assistenciaPublica.iniciativas.add(i));

         if (isCursoSheet) {
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

  const ordenadasSheetNames = [...targetSheetNames].sort((a, b) => {
      const aKey = safeKey(a);
      const bKey = safeKey(b);
      const aIsMain = aKey.includes('capacidade') || (aKey.includes('cti') && !aKey.includes('conecti'));
      const bIsMain = bKey.includes('capacidade') || (bKey.includes('cti') && !bKey.includes('conecti'));
      if (aIsMain && !bIsMain) return -1;
      if (!aIsMain && bIsMain) return 1;
      return 0;
  });

  ordenadasSheetNames.forEach(sheetName => {
    try { processSheet(sheetName); } catch (e) { console.error(`[Dev Parser] Erro na aba ${sheetName}:`, e.message); }
  });

  if (!territoryMap.size) throw new Error('Nenhuma linha territorial válida encontrada.');

  const territories = Array.from(territoryMap.values()).map((entry) => {
    
    // AQUI O CÁLCULO FINAL DE MÉDIA SIMPLES POR TERRITÓRIO
    if (entry.desenvolvimento.ifdmTi == null && entry.desenvolvimento.qtdMunicipiosIfdm > 0) {
      entry.desenvolvimento.ifdmTi = entry.desenvolvimento.somaIfdm / entry.desenvolvimento.qtdMunicipiosIfdm;
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
        metodologia: 'IFDM_TI = Média Aritmética Simples (soma(IFDM_municipio) / qtd_municipios_validos)',
      },
      assistenciaPublica: {
        existe: entry.assistenciaPublica.existe,
        iniciativas: Array.from(entry.assistenciaPublica.iniciativas),
      }
    };
  }).sort((a, b) => a.territory.localeCompare(b.territory));

  const TOTAL_MUNICIPIOS_BAHIA = 417; 
  const qtdGlobalSemiarido = semiaridoMunicipios.size;
  const pctGlobalSemiarido = (qtdGlobalSemiarido / TOTAL_MUNICIPIOS_BAHIA) * 100;

  const result = {
    generatedAt: new Date().toISOString(),
    territories,
    semiaridoMunicipiosList: Array.from(semiaridoMunicipios),
    globalStats: {
        totalBahia: TOTAL_MUNICIPIOS_BAHIA,
        totalSemiarido: qtdGlobalSemiarido,
        pctGlobalSemiarido: pctGlobalSemiarido
    },
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

const sharepointProxyPlugin = (targetSharepointUrl) => ({
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

      let downloadUrl = targetSharepointUrl || process.env.VITE_SHAREPOINT_URL || 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/IQCUmr5J0kxUQLKb9lRqZkT_AVOgJRieO_TN9lJiRxUzXI8?download=1';
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const sharepointUrl = env.VITE_SHAREPOINT_URL || process.env.VITE_SHAREPOINT_URL || 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/IQCUmr5J0kxUQLKb9lRqZkT_AVOgJRieO_TN9lJiRxUzXI8?download=1';

  return {
    plugins: [react(), sharepointProxyPlugin(sharepointUrl)],
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
  };
});