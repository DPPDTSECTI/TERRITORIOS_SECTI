import { normalize } from './normalization';

export const TELEMETRY_STORAGE_KEY = '@SectiPainel_Telemetry_v1';
export const SESSION_ID_KEY = '@SectiPainel_SessionId_v1';
const MAX_TELEMETRY_EVENTS = 300;

export const ROUTE_LABELS = {
  '/': 'Início (Landing)',
  '/dashboard': 'Visão Geral',
  '/ativos': 'Ativos CT&I',
  '/cursos': 'Cursos CT&I',
  '/cadeia': 'Cadeias Produtivas',
  '/relatorio': 'Central de Relatórios',
  '/relatorio/sintese': 'Relatório Síntese',
  '/relatorio/cursos': 'Relatório Ensino',
  '/relatorio/ativos': 'Relatório Ativos',
  '/relatorio/cadeias': 'Relatório Cadeias',
  '/relatorio/analise': 'Relatório Análise',
  '/sobre': 'Sobre o Painel',
  '/admin': 'Gestão CRUD & Monitoramento',
  '/login': 'Autenticação',
};

const CRUD_ACTION_LABELS = {
  create: 'Novo registro criado',
  update: 'Registro atualizado',
  delete: 'Registro excluído',
};

const CRUD_ENTITY_LABELS = {
  ativos: 'Ativos CT&I',
  cursos: 'Cursos CT&I',
  cadeias: 'Cadeias & IGs',
};

let fallbackSessionId = null;

/**
 * Retorna nome legível do módulo para uma rota.
 *
 * @param {string} route
 * @returns {string}
 */
export function getRouteLabel(route) {
  if (!route) return 'Painel';
  const cleanRoute = String(route).split('?')[0];
  return ROUTE_LABELS[cleanRoute] || cleanRoute;
}

/**
 * Identifica navegador, sistema operacional e fator de forma a partir do userAgent e largura.
 *
 * @param {string} [ua]
 * @param {number} [width]
 * @returns {{ browser: string, os: string, deviceType: 'Desktop'|'Tablet'|'Mobile', label: string }}
 */
export function detectDeviceInfo(
  ua = typeof navigator !== 'undefined' ? navigator.userAgent : '',
  width = typeof window !== 'undefined' ? window.innerWidth : 1280
) {
  const source = String(ua || '');

  let browser = 'Navegador';
  if (/Edg\//i.test(source)) browser = 'Edge';
  else if (/Firefox\//i.test(source)) browser = 'Firefox';
  else if (/Chrome\//i.test(source) && !/Chromium|Edg\//i.test(source)) browser = 'Chrome';
  else if (/Safari\//i.test(source) && !/Chrome|Chromium/i.test(source)) browser = 'Safari';

  let os = 'Sistema';
  if (/Windows/i.test(source)) os = 'Windows';
  else if (/Android/i.test(source)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(source)) os = 'iOS';
  else if (/Mac OS X|Macintosh/i.test(source)) os = 'macOS';
  else if (/Linux/i.test(source)) os = 'Linux';

  let deviceType = 'Desktop';
  if (/Mobi|Android.*Mobile|iPhone/i.test(source) || (Number.isFinite(width) && width > 0 && width < 640)) {
    deviceType = 'Mobile';
  } else if (/iPad|Tablet/i.test(source) || (Number.isFinite(width) && width >= 640 && width < 1024)) {
    deviceType = 'Tablet';
  }

  return {
    browser,
    os,
    deviceType,
    label: `${deviceType} · ${browser} / ${os}`,
  };
}

/**
 * Recupera ou gera um ID de sessão estável na aba atual.
 *
 * @returns {string}
 */
export function getOrCreateSessionId() {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
      if (existing) return existing;
      const generated = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      window.sessionStorage.setItem(SESSION_ID_KEY, generated);
      return generated;
    } catch {
      // Fallback em memória caso sessionStorage esteja bloqueado
    }
  }
  if (!fallbackSessionId) {
    fallbackSessionId = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }
  return fallbackSessionId;
}

/**
 * Cria um objeto de evento de telemetria normalizado.
 *
 * @param {object} params
 * @returns {object}
 */
export function createTelemetryEvent({
  id,
  timestamp,
  type = 'route_view',
  category = 'access',
  title = '',
  detail = '',
  route = '/',
  user = null,
  sessionId,
  device,
  metadata = {},
}) {
  const resolvedEmail = user?.email || metadata?.userEmail || 'visitante@publico';
  const resolvedName =
    user?.user_metadata?.name ||
    user?.name ||
    metadata?.userName ||
    (user?.email ? user.email.split('@')[0] : 'Visitante Público');
  const resolvedRole =
    user?.user_metadata?.role ||
    user?.role ||
    metadata?.userRole ||
    (resolvedEmail.includes('admin') ? 'admin' : resolvedEmail === 'visitante@publico' ? 'publico' : 'gestor');

  const resolvedDevice = device || detectDeviceInfo();
  const cleanRoute = String(route || '/').split('?')[0];

  return {
    id: id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: timestamp || new Date().toISOString(),
    type,
    category,
    title: title || getRouteLabel(cleanRoute),
    detail: detail || '',
    route: cleanRoute,
    moduleName: getRouteLabel(cleanRoute),
    userEmail: resolvedEmail,
    userName: resolvedName,
    userRole: resolvedRole,
    device: typeof resolvedDevice === 'string' ? resolvedDevice : resolvedDevice.label,
    sessionId: sessionId || getOrCreateSessionId(),
    metadata,
  };
}

/**
 * Carrega eventos salvos no localStorage com fallback seguro.
 *
 * @returns {Array<object>}
 */
export function loadTelemetryEvents() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_TELEMETRY_EVENTS) : [];
  } catch {
    return [];
  }
}

/**
 * Persiste eventos de telemetria no localStorage (limitado a 300 registros recentes).
 *
 * @param {Array<object>} events
 */
export function saveTelemetryEvents(events) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const capped = Array.isArray(events) ? events.slice(0, MAX_TELEMETRY_EVENTS) : [];
    window.localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(capped));
  } catch (err) {
    console.warn('Nao foi possivel salvar telemetria no localStorage:', err);
  }
}

/**
 * Remove histórico de telemetria salvo localmente.
 */
export function clearTelemetryEvents() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(TELEMETRY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Consolida eventos de telemetria, log de auditoria CRUD e sessões ativas em tempo real.
 *
 * @param {Array<object>} events
 * @param {Array<object>} auditLog
 * @param {Array<object>} onlineSessions
 * @returns {object}
 */
export function aggregateTelemetryMetrics(events = [], auditLog = [], onlineSessions = []) {
  const safeEvents = Array.isArray(events) ? events : [];
  const safeAudit = Array.isArray(auditLog) ? auditLog : [];
  const safeOnline = Array.isArray(onlineSessions) ? onlineSessions : [];

  const existingAuditIds = new Set();
  safeEvents.forEach((evt) => {
    if (evt?.metadata?.auditId) existingAuditIds.add(String(evt.metadata.auditId));
    if (evt?.id) existingAuditIds.add(String(evt.id));
  });

  const convertedAuditEvents = safeAudit
    .filter((entry) => entry && !existingAuditIds.has(String(entry.id)))
    .map((entry) => {
      const actionLabel = CRUD_ACTION_LABELS[entry.action] || 'Alteração CRUD';
      const entityLabel = CRUD_ENTITY_LABELS[entry.entity] || entry.entity || 'Base CT&I';
      return createTelemetryEvent({
        id: `audit-${entry.id}`,
        timestamp: entry.timestamp,
        type: `crud_${entry.action || 'update'}`,
        category: 'audit',
        title: `${actionLabel} em ${entityLabel}`,
        detail: entry.label || entry.targetId || '',
        route: '/admin',
        user: {
          email: entry.userEmail || 'operador@secti.ba.gov.br',
          name: entry.userName || 'Operador CRUD',
          role: entry.userRole || 'gestor',
        },
        sessionId: entry.sessionId || 'local-draft',
        metadata: {
          auditId: entry.id,
          entity: entry.entity,
          action: entry.action,
          targetId: entry.targetId,
        },
      });
    });

  const mergedEvents = [...safeEvents, ...convertedAuditEvents].sort((a, b) => {
    const tA = new Date(a?.timestamp || 0).getTime();
    const tB = new Date(b?.timestamp || 0).getTime();
    return tB - tA;
  });

  const onlineByKey = new Map();
  safeOnline.forEach((sess) => {
    const key = sess?.userEmail && sess.userEmail !== 'visitante@publico'
      ? sess.userEmail
      : `${sess?.userEmail || 'visitante@publico'}::${sess?.sessionId || 'local'}`;
    onlineByKey.set(key, sess);
  });

  const usersMap = new Map();
  let totalPageViews = 0;
  let totalCrudActions = 0;
  let totalInteractions = 0;
  const moduleCounts = new Map();
  const territoryCounts = new Map();

  mergedEvents.forEach((evt) => {
    if (!evt) return;
    if (evt.category === 'audit' || String(evt.type || '').startsWith('crud_')) {
      totalCrudActions += 1;
    } else if (evt.category === 'interaction') {
      totalInteractions += 1;
    } else if (evt.type === 'route_view') {
      totalPageViews += 1;
    }

    if (evt.type === 'route_view' && evt.route) {
      const currentMod = moduleCounts.get(evt.route) || {
        route: evt.route,
        label: evt.moduleName || getRouteLabel(evt.route),
        count: 0,
      };
      currentMod.count += 1;
      moduleCounts.set(evt.route, currentMod);
    }

    if (evt.type === 'territory_select' && (evt.metadata?.territoryName || evt.detail)) {
      const tName = evt.metadata?.territoryName || evt.detail;
      territoryCounts.set(tName, (territoryCounts.get(tName) || 0) + 1);
    }

    const email = evt.userEmail || 'visitante@publico';
    const userKey = email !== 'visitante@publico'
      ? email
      : `${email}::${evt.sessionId || 'local'}`;

    const existing = usersMap.get(userKey);
    const evtTime = new Date(evt.timestamp || 0).getTime();

    if (!existing) {
      usersMap.set(userKey, {
        key: userKey,
        email,
        name: evt.userName || 'Visitante Público',
        role: evt.userRole || 'publico',
        device: evt.device || 'Desktop',
        lastSeen: evt.timestamp,
        lastSeenMs: evtTime,
        lastRoute: evt.route || '/',
        lastModule: evt.moduleName || getRouteLabel(evt.route || '/'),
        eventCount: 1,
        crudCount: evt.category === 'audit' ? 1 : 0,
        isOnline: onlineByKey.has(userKey),
      });
    } else {
      existing.eventCount += 1;
      if (evt.category === 'audit') existing.crudCount += 1;
      if (evtTime > existing.lastSeenMs) {
        existing.lastSeen = evt.timestamp;
        existing.lastSeenMs = evtTime;
        existing.lastRoute = evt.route || existing.lastRoute;
        existing.lastModule = evt.moduleName || existing.lastModule;
        existing.device = evt.device || existing.device;
        if (evt.userName && evt.userName !== 'Visitante Público') {
          existing.name = evt.userName;
        }
        if (evt.userRole && evt.userRole !== 'publico') {
          existing.role = evt.userRole;
        }
      }
      if (onlineByKey.has(userKey)) {
        existing.isOnline = true;
      }
    }
  });

  // Garante inclusão de sessões online que ainda não geraram evento local
  onlineByKey.forEach((sess, userKey) => {
    if (!usersMap.has(userKey)) {
      usersMap.set(userKey, {
        key: userKey,
        email: sess.userEmail || 'visitante@publico',
        name: sess.userName || 'Visitante Público',
        role: sess.userRole || 'publico',
        device: sess.device || 'Desktop',
        lastSeen: sess.onlineAt || new Date().toISOString(),
        lastSeenMs: new Date(sess.onlineAt || Date.now()).getTime(),
        lastRoute: sess.route || '/',
        lastModule: sess.moduleName || getRouteLabel(sess.route || '/'),
        eventCount: 1,
        crudCount: 0,
        isOnline: true,
      });
    }
  });

  const uniqueUsers = Array.from(usersMap.values()).sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    return b.lastSeenMs - a.lastSeenMs;
  });

  const maxModuleCount = Math.max(1, ...Array.from(moduleCounts.values()).map((m) => m.count));
  const moduleRanking = Array.from(moduleCounts.values())
    .sort((a, b) => b.count - a.count)
    .map((m) => ({
      ...m,
      percentage: Math.round((m.count / maxModuleCount) * 100),
    }));

  const maxTerritoryCount = Math.max(1, ...Array.from(territoryCounts.values()));
  const territoryRanking = Array.from(territoryCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / maxTerritoryCount) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEvents: mergedEvents.length,
    totalPageViews,
    totalCrudActions,
    totalInteractions,
    onlineCount: uniqueUsers.filter((u) => u.isOnline).length || (safeOnline.length > 0 ? safeOnline.length : 1),
    uniqueUsers,
    moduleRanking,
    territoryRanking,
    mergedEvents,
  };
}

function hasValidCoord(lat, lng) {
  if (lat === null || lat === undefined || lat === '' || lng === null || lng === undefined || lng === '') {
    return false;
  }
  const nLat = Number(lat);
  const nLng = Number(lng);
  return Number.isFinite(nLat) && Number.isFinite(nLng) && nLat !== 0 && nLng !== 0;
}

/**
 * Calcula indicadores de saúde, cobertura e completude das tabelas do painel.
 *
 * @param {object} params
 * @returns {object}
 */
export function computeDatabaseHealth({
  ativosData = [],
  cursosData = [],
  cursosEadData = [],
  listaCadeias = [],
  distribuicaoCadeias = [],
  territoriosData = [],
  municipiosTerritorios = [],
  firjanData = [],
  crudStats = {},
  supabaseConnected = true,
  latencyMs = null,
  lastPingAt = null,
}) {
  const totalTerritoriesRef = territoriosData.length || 27;

  // 1. Ativos CT&I
  const ativosTerritories = new Set(ativosData.map((a) => a?.id_territorio).filter(Boolean)).size;
  const ativosMunicipalities = new Set(
    ativosData.map((a) => normalize(a?.municipio)).filter(Boolean)
  ).size;
  const ativosWithCoords = ativosData.filter((a) => hasValidCoord(a?.latitude, a?.longitude)).length;
  const ativosCompleteness = ativosData.length > 0
    ? Math.round((ativosWithCoords / ativosData.length) * 100)
    : 0;

  // 2. Cursos CT&I
  const allCoursesCount = cursosData.length + cursosEadData.length;
  const cursosTerritories = new Set(cursosData.map((c) => c?.id_territorio).filter(Boolean)).size;
  const cursosMunicipalities = new Set(
    cursosData.map((c) => normalize(c?.municipio)).filter(Boolean)
  ).size;
  const cursosWithMeta = cursosData.filter(
    (c) => Boolean(c?.categoria || c?.tipo) && Boolean(c?.entidade || c?.instituicao || c?.sigla)
  ).length;
  const cursosCompleteness = cursosData.length > 0
    ? Math.round((cursosWithMeta / cursosData.length) * 100)
    : 0;

  // 3. Cadeias Produtivas & IGs
  const cadeiasTerritories = new Set(
    [...listaCadeias, ...distribuicaoCadeias].map((c) => c?.id_territorio).filter(Boolean)
  ).size;
  const cadeiasMunicipalities = new Set(
    [
      ...listaCadeias.map((c) => normalize(c?.municipio_sede || c?.sede)),
      ...distribuicaoCadeias.map((c) => normalize(c?.nome_municipio || c?.municipio)),
    ].filter(Boolean)
  ).size;
  const cadeiasWithMeta = listaCadeias.filter(
    (c) => Boolean(c?.texto_referencia || c?.segmento || c?.fonte)
  ).length;
  const cadeiasCompleteness = listaCadeias.length > 0
    ? Math.round((cadeiasWithMeta / listaCadeias.length) * 100)
    : 0;

  // 4. Malha Territorial & IFDM
  const malhaIndicators = [
    territoriosData.length > 0,
    municipiosTerritorios.length > 0,
    firjanData.length > 0,
  ];
  const malhaCompleteness = Math.round(
    (malhaIndicators.filter(Boolean).length / malhaIndicators.length) * 100
  );

  const tables = [
    {
      id: 'ativos',
      name: 'Ativos de CT&I',
      source: 'lista_ativos_cti',
      recordsCount: ativosData.length,
      secondaryLabel: `${ativosWithCoords} georreferenciados`,
      territoriesCovered: ativosTerritories,
      totalTerritories: totalTerritoriesRef,
      municipalitiesCovered: ativosMunicipalities,
      completenessPct: ativosCompleteness,
      completenessHint: 'Coordenadas válidas',
      draftDelta: crudStats?.byEntity?.ativos || 0,
    },
    {
      id: 'cursos',
      name: 'Cursos Superiores CT&I',
      source: 'lista_cursos_cti + cursos',
      recordsCount: allCoursesCount,
      secondaryLabel: `${cursosData.length} pres. · ${cursosEadData.length} EAD`,
      territoriesCovered: cursosTerritories,
      totalTerritories: totalTerritoriesRef,
      municipalitiesCovered: cursosMunicipalities,
      completenessPct: cursosCompleteness,
      completenessHint: 'IES & área definidas',
      draftDelta: crudStats?.byEntity?.cursos || 0,
    },
    {
      id: 'cadeias',
      name: 'Cadeias Produtivas & IGs',
      source: 'lista_cadeia_produtiva + distribuicao_cadeias',
      recordsCount: listaCadeias.length,
      secondaryLabel: `${distribuicaoCadeias.length} vínculos municipais`,
      territoriesCovered: cadeiasTerritories,
      totalTerritories: totalTerritoriesRef,
      municipalitiesCovered: cadeiasMunicipalities,
      completenessPct: cadeiasCompleteness,
      completenessHint: 'Segmento/referência',
      draftDelta: crudStats?.byEntity?.cadeias || 0,
    },
    {
      id: 'malha',
      name: 'Malha Territorial & IFDM',
      source: 'stats_ti + firjan + lista_municipioxterritorio',
      recordsCount: municipiosTerritorios.length || 417,
      secondaryLabel: `${firjanData.length} índices IFDM`,
      territoriesCovered: territoriosData.length || 27,
      totalTerritories: totalTerritoriesRef,
      municipalitiesCovered: municipiosTerritorios.length || 417,
      completenessPct: malhaCompleteness,
      completenessHint: 'Bases estruturais',
      draftDelta: 0,
    },
  ];

  const totalRecords = tables.reduce((acc, t) => acc + Number(t.recordsCount || 0), 0);

  return {
    connected: Boolean(supabaseConnected),
    latencyMs,
    lastPingAt,
    totalRecords,
    totalTerritories: totalTerritoriesRef,
    totalMunicipalities: municipiosTerritorios.length || 417,
    totalDraftChanges: Number(crudStats?.total || 0),
    tables,
  };
}
