const XLSX = require('xlsx');

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const TERRITORY_NAME_ALIASES = {
  [normalizeText('Rio Corrente')]: 'Bacia do Rio Corrente',
};

function normalizeTerritoryName(value) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return '';

  return TERRITORY_NAME_ALIASES[normalizedValue] || String(value || '').trim();
}

function toNumber(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const cleaned = String(value)
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullablePercent(value) {
  const parsed = toNumber(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed > 1 ? parsed : parsed * 100;
}

function isTruthy(value) {
  const normalized = normalizeText(value);
  return ['sim', 's', 'yes', 'y', 'true', '1', 'existente', 'conecta'].includes(normalized);
}

function splitList(value) {
  if (!value) return [];
  return String(value)
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasWholeWord(text, word) {
  return new RegExp(`(^|\\s)${word}($|\\s)`).test(text);
}

function findHeaderRow(rows) {
  let bestIdx = 0;
  let bestScore = 0;

  for (let i = 0; i < Math.min(30, rows.length); i++) {
    const row = rows[i] || [];
    const score = row.filter((cell) => String(cell || '').trim() !== '').length;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
}

function findColumnIndex(normalizedHeaders, patterns) {
  for (const pattern of patterns) {
    const normPattern = normalizeText(pattern);

    // 1) correspondência exata de cabeçalho
    let idx = normalizedHeaders.findIndex((header) => header === normPattern);
    if (idx !== -1) return idx;

    // 2) correspondência por palavra inteira (para evitar false positives como "identidade" em vez de "entidade")
    idx = normalizedHeaders.findIndex((header) => header.split(/\s+/).includes(normPattern));
    if (idx !== -1) return idx;

    // 3) correspondência por palavra com limite de borda (não sub-palavra dentro de outra palavra)
    const regex = new RegExp(`(^|\\s)${normPattern}($|\\s)`);
    idx = normalizedHeaders.findIndex((header) => regex.test(header));
    if (idx !== -1) return idx;

    // 4) fallback mais amplo para cabeçalhos menos padronizados
    idx = normalizedHeaders.findIndex((header) => header.includes(normPattern));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseSpreadsheet(buffer) {
  const startedAt = Date.now();

  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellFormula: false,
    cellHTML: false,
    cellStyles: false,
    cellText: false,
    blankrows: false,
  });

  const targetSheetNames = workbook.SheetNames.slice(0, 3);

  if (!targetSheetNames.length) {
    throw new Error('Planilha territorial vazia.');
  }

  const territoryMap = new Map();

  const getTerritory = (name) => {
    const canonicalName = normalizeTerritoryName(name);
    if (!canonicalName) return null;

    if (!territoryMap.has(canonicalName)) {
      territoryMap.set(canonicalName, {
        territory: canonicalName,
        municipios: new Set(),
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
        desenvolvimento: {
          ifdmTi: null,
          somaIfdmPop: 0,
          populacaoTotal: 0,
        },
        assistenciaPublica: {
          existe: false,
          iniciativas: new Set(),
        },
        cadeiasMap: new Map(),
        capacidadeRows: [],
        desenvolvimentoRows: [],
        cadeiasRows: [],
        semiaridoAcumulado: 0,
        semiaridoContador: 0,
        futureSignals: {
          agriculturaFamiliar: null,
          gruposSubrepresentados: null,
        },
        parquesMunicipios: new Set(),
      });
    }
    return territoryMap.get(canonicalName);
  };

  const processSheet = (sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows.length) return;

    const headerRowIndex = findHeaderRow(rows);
    const headers = (rows[headerRowIndex] || []).map((header) => String(header || '').trim());
    const normalizedHeaders = headers.map(normalizeText);

    const iTerritorio = findColumnIndex(normalizedHeaders, ['territorio de identidade', 'territorio']);
    if (iTerritorio === -1) {
      console.log(`[Parser Territorial] Aba ignorada (sem coluna território): ${sheetName}`);
      return;
    }

    const iMunicipio = findColumnIndex(normalizedHeaders, ['municipio', 'local']);
    const iPopulacao = findColumnIndex(normalizedHeaders, ['populacao']);
    const iIfdm = findColumnIndex(normalizedHeaders, ['ifdm']);
    const iIfdmTi = findColumnIndex(normalizedHeaders, ['ifdm ti', 'ifdmt', 'ifdm territorial']);

    const iEntidades = findColumnIndex(normalizedHeaders, ['valor entidades', 'entidades total', 'capacidade territorial']);
    let iEntidade = findColumnIndex(normalizedHeaders, ['entidade', 'institui', 'nome da entidade']);
    if (iEntidade === iTerritorio || normalizedHeaders[iEntidade]?.includes('territorio')) iEntidade = -1;
    const iTipo = findColumnIndex(normalizedHeaders, ['tipo', 'natureza', 'categoria']);
    if (iTipo === iTerritorio || normalizedHeaders[iTipo]?.includes('territorio')) iTipo = -1;
    const iCampiUniv = findColumnIndex(normalizedHeaders, ['campi universit', 'campus universit']);
    const iCampiIfs = findColumnIndex(normalizedHeaders, ['campi de if', 'campus if', 'instituto federal']);
    const iEspacos = findColumnIndex(normalizedHeaders, ['espacos dinamizadores', 'espaco dinamizador']);
    const iIncubadoras = findColumnIndex(normalizedHeaders, ['incubadoras', 'incubadora']);
    const iParques = findColumnIndex(normalizedHeaders, ['parques tecnologicos', 'parque tecnologico']);
    const iUniversidades = findColumnIndex(normalizedHeaders, ['universidades']);
    const iICTs = findColumnIndex(normalizedHeaders, ['icts', 'ict']);
    const iCentrosPesquisa = findColumnIndex(normalizedHeaders, ['centros de pesquisa', 'centro de pesquisa']);

    const iAssistencia = findColumnIndex(normalizedHeaders, ['assistencia publica', 'presenca conecta', 'conecta']);
    const iIniciativas = findColumnIndex(normalizedHeaders, ['iniciativas', 'dispositivos estaduais']);

    const iCadeias = findColumnIndex(normalizedHeaders, ['cadeia produtiva', 'apl', 'arranjo produtivo']);
    const iIGs = findColumnIndex(normalizedHeaders, ['indicacao geografica', 'igs', 'ig']);
    const iSatelite = findColumnIndex(normalizedHeaders, ['municipio satelite', 'sede']);

    const iSemiarido = findColumnIndex(normalizedHeaders, ['semiarido', 'percentual semiarido']);
    const iAgriculturaFamiliar = findColumnIndex(normalizedHeaders, ['agricultura familiar']);
    const iGruposSubrep = findColumnIndex(normalizedHeaders, ['sub representados', 'lgbtqiapn', 'quilombola', 'indigena']);

    console.log(`[Parser Territorial] Processando aba: ${sheetName}`);

    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const territoryRaw = normalizeTerritoryName(row[iTerritorio]);
      if (!territoryRaw) continue;

      const territory = getTerritory(territoryRaw);
      if (!territory) continue;
      const municipio = iMunicipio !== -1 ? String(row[iMunicipio] || '').trim() : '';
      if (municipio) territory.municipios.add(municipio);

      const capacidade = territory.capacidade;
      let rowEntidades = 0;
      if (iEntidades !== -1) {
        rowEntidades = toNumber(row[iEntidades]);
      }
      if (rowEntidades <= 0) {
        rowEntidades = 1;
      }

      const tipoText = iTipo !== -1 ? normalizeText(row[iTipo]) : '';

      if (iUniversidades === -1 && tipoText.includes('universidade')) capacidade.universidades += rowEntidades;
      if (iCampiUniv === -1 && (tipoText.includes('campi universit') || tipoText.includes('campus universit'))) capacidade.campiUniversitarios += rowEntidades;
      if (iCampiIfs === -1 && (tipoText.includes('instituto federal') || hasWholeWord(tipoText, 'if'))) capacidade.campiIFs += rowEntidades;
      if (iEspacos === -1 && tipoText.includes('espaco dinamizador')) capacidade.espacosDinamizadores += rowEntidades;
      if (iIncubadoras === -1 && tipoText.includes('incubadora')) capacidade.incubadoras += rowEntidades;
      if (iParques === -1 && tipoText.includes('parque tecnologico')) capacidade.parquesTecnologicos += rowEntidades;
      if (iICTs === -1 && (tipoText.includes('icts') || hasWholeWord(tipoText, 'ict'))) capacidade.icts += rowEntidades;
      if (iCentrosPesquisa === -1 && tipoText.includes('centro de pesquisa')) capacidade.centrosPesquisa += rowEntidades;

      if (iCampiUniv !== -1) capacidade.campiUniversitarios += toNumber(row[iCampiUniv]);
      if (iCampiIfs !== -1) capacidade.campiIFs += toNumber(row[iCampiIfs]);
      if (iEspacos !== -1) capacidade.espacosDinamizadores += toNumber(row[iEspacos]);
      if (iIncubadoras !== -1) capacidade.incubadoras += toNumber(row[iIncubadoras]);
      if (iParques !== -1) capacidade.parquesTecnologicos += toNumber(row[iParques]);
      if (iUniversidades !== -1) capacidade.universidades += toNumber(row[iUniversidades]);
      if (iICTs !== -1) capacidade.icts += toNumber(row[iICTs]);
      if (iCentrosPesquisa !== -1) capacidade.centrosPesquisa += toNumber(row[iCentrosPesquisa]);
      capacidade.entidadesTotal += rowEntidades;

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
        splitList(row[iIniciativas]).forEach((initiative) => {
          territory.assistenciaPublica.iniciativas.add(initiative);
        });
      }

      territory.capacidadeRows.push({
        municipio,
        entidade: iEntidade !== -1 ? String(row[iEntidade] || '').trim() : '',
        tipo: iTipo !== -1 ? String(row[iTipo] || '').trim() : '',
        quantidade: rowEntidades,
      });

      if (iIfdm !== -1 || iPopulacao !== -1 || iIfdmTi !== -1) {
        territory.desenvolvimentoRows.push({
          municipio,
          ifdm: iIfdm !== -1 ? toNumber(row[iIfdm]) : null,
          populacao: iPopulacao !== -1 ? toNumber(row[iPopulacao]) : null,
          ifdmTi: iIfdmTi !== -1 ? toNumber(row[iIfdmTi]) : null,
        });
      }

      const cadeias = [
        ...(iCadeias !== -1 ? splitList(row[iCadeias]) : []),
        ...(iIGs !== -1 ? splitList(row[iIGs]) : []),
      ];
      const satelite = iSatelite !== -1 ? String(row[iSatelite] || municipio || '').trim() : String(municipio || '').trim();

      if (cadeias.length > 0) {
        territory.cadeiasRows.push({
          municipio,
          cadeias,
          municipioSatelite: satelite,
        });
      }

      cadeias.forEach((cadeia) => {
        const chainName = cadeia.trim();
        if (!chainName) return;
        if (!territory.cadeiasMap.has(chainName)) {
          territory.cadeiasMap.set(chainName, {
            cadeia: chainName,
            municipios: new Set(),
            satelites: new Map(),
          });
        }

        const chain = territory.cadeiasMap.get(chainName);
        if (municipio) chain.municipios.add(municipio);
        if (satelite) {
          const prev = chain.satelites.get(satelite) || 0;
          chain.satelites.set(satelite, prev + 1);
        }
      });

      if (iSemiarido !== -1) {
        const semiarido = toNullablePercent(row[iSemiarido]);
        if (semiarido != null) {
          territory.semiaridoAcumulado += semiarido;
          territory.semiaridoContador += 1;
        }
      }

      if (iAgriculturaFamiliar !== -1) {
        const agricultura = toNumber(row[iAgriculturaFamiliar]);
        if (agricultura > 0) {
          territory.futureSignals.agriculturaFamiliar = agricultura;
        }
      }

      if (iGruposSubrep !== -1 && row[iGruposSubrep]) {
        territory.futureSignals.gruposSubrepresentados = String(row[iGruposSubrep]).trim();
      }

      if (((iParques !== -1 && toNumber(row[iParques]) > 0) || (iParques === -1 && tipoText.includes('parque tecnologico'))) && municipio) {
        territory.parquesMunicipios.add(municipio);
      }
    }
  };

  targetSheetNames.forEach(processSheet);

  if (!territoryMap.size) {
    throw new Error('Nenhuma linha válida com território foi encontrada nas 3 tabelas da planilha.');
  }

  const territories = Array.from(territoryMap.values())
    .map((entry) => {
      const computedEntidades =
        entry.capacidade.universidades +
        entry.capacidade.campiUniversitarios +
        entry.capacidade.campiIFs +
        entry.capacidade.icts +
        entry.capacidade.centrosPesquisa +
        entry.capacidade.espacosDinamizadores +
        entry.capacidade.parquesTecnologicos +
        entry.capacidade.incubadoras;

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
        semiaridoPercentual: entry.semiaridoContador > 0
          ? entry.semiaridoAcumulado / entry.semiaridoContador
          : null,
        futureSignals: entry.futureSignals,
        parquesTecnologicosMunicipios: Array.from(entry.parquesMunicipios),
      };
    })
    .sort((a, b) => a.territory.localeCompare(b.territory));

  const summary = {
    territories: territories.length,
    totalEntidades: territories.reduce((sum, item) => sum + (item.capacidade.entidadesTotal || 0), 0),
    territoriosComAssistencia: territories.filter((item) => item.assistenciaPublica.existe).length,
  };

  console.log(`[Parser Territorial] ✓ Parseado em ${Date.now() - startedAt}ms: ${summary.territories} territórios.`);

  return {
    generatedAt: new Date().toISOString(),
    territories,
    summary,
  };
}

module.exports = { parseSpreadsheet };
