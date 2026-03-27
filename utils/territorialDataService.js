import { get, set, del } from 'idb-keyval';

const CACHE_KEY = 'territorial_indicators_data_v1';
const CACHE_TIMESTAMP_KEY = 'territorial_indicators_timestamp_v1';
const CACHE_DURATION = 1000 * 60 * 60;

const SHAREPOINT_PROXY_URL = import.meta.env.DEV
  ? '/api/sharepoint'
  : '/.netlify/functions/sharepoint';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
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

function asTerritorialPayload(payload) {
  if (payload && Array.isArray(payload.territories)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return { territories: [], summary: { territories: 0 } };
  }

  const keys = Object.keys(payload);
  const territories = keys.map((territoryName) => {
    const rows = Array.isArray(payload[territoryName]) ? payload[territoryName] : [];
    const parques = rows.reduce((acc, row) => acc + toNumber(row.parques_tecnologicos || row.parque_tecnologico), 0);

    return {
      territory: territoryName,
      capacidade: {
        entidadesTotal: rows.length,
        campiUniversitarios: 0,
        campiIFs: 0,
        espacosDinamizadores: 0,
        incubadoras: 0,
        universidades: 0,
        icts: 0,
        centrosPesquisa: 0,
        parquesTecnologicos: parques,
      },
      desenvolvimento: {
        ifdmTi: null,
        populacaoTotal: null,
      },
      assistenciaPublica: {
        existe: rows.length > 0,
        iniciativas: rows.length > 0 ? ['Conecta'] : [],
      },
      cadeiasProdutivas: [],
      semiaridoPercentual: null,
      futureSignals: {
        agriculturaFamiliar: null,
        gruposSubrepresentados: null,
      },
      notes: ['Dados em transição para novo modelo territorial.'],
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    territories,
    summary: { territories: territories.length },
  };
}

async function fetchFromSharePoint() {
  const nocacheParam = new URLSearchParams(location.search).get('nocache') ? '&nocache=true' : '';
  const res = await fetch(`${SHAREPOINT_PROXY_URL}?modelo=territorial${nocacheParam}`, { cache: 'no-store' });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[territorialDataService] SharePoint endpoint não ok', res.status, text);
    throw new Error(`Falha no endpoint de dados territoriais (HTTP ${res.status}) ${text ? `- ${text.slice(0, 300)}` : ''}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    const text = await res.text().catch(() => '');
    console.error('[territorialDataService] JSON inválido do endpoint', text);
    throw new Error(`Falha ao interpretar JSON do endpoint de níveis territoriais: ${err.message}`);
  }

  if (data?.error) {
    console.error('[territorialDataService] SharePoint retornou erro', data.error);
    throw new Error(data.error);
  }

  return asTerritorialPayload(data);
}

async function saveToCache(data) {
  await set(CACHE_KEY, data);
  await set(CACHE_TIMESTAMP_KEY, Date.now());
}

export async function fetchTerritorialData(onUpdate = null) {
  let cachedData = null;
  let cacheAge = Infinity;

  try {
    const cached = await get(CACHE_KEY);
    const timestamp = await get(CACHE_TIMESTAMP_KEY);

    if (cached && timestamp) {
      cachedData = cached;
      cacheAge = Date.now() - Number(timestamp);

      if (cacheAge < CACHE_DURATION) {
        return { data: cachedData, source: 'cache', fresh: true };
      }

      fetchFromSharePoint()
        .then(async (freshData) => {
          await saveToCache(freshData);
          if (typeof onUpdate === 'function') {
            onUpdate(freshData);
          }
        })
        .catch(() => {});

      return { data: cachedData, source: 'cache', fresh: false };
    }
  } catch {
    // ignora falha de cache e tenta rede
  }

  const data = await fetchFromSharePoint();
  await saveToCache(data);
  return { data, source: 'sharepoint', fresh: true };
}

export async function clearTerritorialCache() {
  await del(CACHE_KEY);
  await del(CACHE_TIMESTAMP_KEY);
}

export function getAssistenciaStatusLabel(existe) {
  return normalizeText(existe) === 'sim' || existe === true ? 'Existente' : 'Não identificada';
}
