import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, supabasePublic } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import {
  detectDeviceInfo,
  getOrCreateSessionId,
  getRouteLabel,
  createTelemetryEvent,
  loadTelemetryEvents,
  saveTelemetryEvents,
  clearTelemetryEvents,
  aggregateTelemetryMetrics,
  computeDatabaseHealth,
} from '../utils/telemetry';

const TelemetryContext = createContext(null);

const MAX_EVENTS = 300;
const REALTIME_CHANNEL = 'secti-painel-telemetry';

export function TelemetryProvider({ children }) {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const {
    ativosData = [],
    cursosData = [],
    cursosEadData = [],
    listaCadeias = [],
    distribuicaoCadeias = [],
    territoriosData = [],
    municipiosTerritorios = [],
    firjanData = [],
    selectedTerritory,
    filtroSemiarido = false,
    crudDraft,
    crudStats = {},
  } = useData();

  const [events, setEvents] = useState(() => loadTelemetryEvents());
  const [onlineSessions, setOnlineSessions] = useState([]);
  const [supabaseHealth, setSupabaseHealth] = useState({
    connected: true,
    latencyMs: null,
    checking: false,
    lastPingAt: null,
    syncMode: 'realtime_local',
  });

  const sessionIdRef = useRef(getOrCreateSessionId());
  const deviceInfoRef = useRef(detectDeviceInfo());
  const channelRef = useRef(null);
  const remoteTableStateRef = useRef(
    import.meta.env.VITE_ENABLE_REMOTE_TELEMETRY_TABLE === 'true' ? 'unknown' : 'unavailable'
  ); // 'unknown' | 'available' | 'unavailable'
  const lastTrackedRouteRef = useRef(null);
  const prevUserEmailRef = useRef(undefined);
  const prevTerritoryRef = useRef(undefined);
  const hasMountedSemiaridoRef = useRef(false);
  const knownAuditIdsRef = useRef(
    new Set((crudDraft?.auditLog || []).map((entry) => String(entry?.id || '')))
  );

  const userRef = useRef(user);
  userRef.current = user;
  const routeRef = useRef(location.pathname);
  routeRef.current = location.pathname;

  const appendEventLocal = useCallback((evt) => {
    setEvents((prev) => {
      if (prev.some((item) => item.id === evt.id)) return prev;
      const next = [evt, ...prev].slice(0, MAX_EVENTS);
      saveTelemetryEvents(next);
      return next;
    });
  }, []);

  const syncEventToRemoteTable = useCallback(async (evt) => {
    if (remoteTableStateRef.current === 'unavailable') return;
    try {
      const { error } = await supabase.from('painel_monitoramento').insert([
        {
          id: evt.id,
          timestamp: evt.timestamp,
          type: evt.type,
          category: evt.category,
          title: evt.title,
          detail: evt.detail,
          route: evt.route,
          module_name: evt.moduleName,
          user_email: evt.userEmail,
          user_name: evt.userName,
          user_role: evt.userRole,
          device: evt.device,
          session_id: evt.sessionId,
          metadata: evt.metadata,
        },
      ]);

      if (error) {
        if (error.code === 'PGRST205' || error.status === 404 || error.message?.includes('schema cache')) {
          remoteTableStateRef.current = 'unavailable';
        }
      } else {
        remoteTableStateRef.current = 'available';
      }
    } catch {
      remoteTableStateRef.current = 'unavailable';
    }
  }, []);

  const trackEvent = useCallback(
    ({ type, category = 'access', title, detail = '', route, metadata = {}, userOverride } = {}) => {
      const evt = createTelemetryEvent({
        type,
        category,
        title,
        detail,
        route: route || routeRef.current,
        user: userOverride !== undefined ? userOverride : userRef.current,
        sessionId: sessionIdRef.current,
        device: deviceInfoRef.current,
        metadata,
      });

      appendEventLocal(evt);

      // Transmite em tempo real para outras sessões conectadas ao painel
      if (channelRef.current) {
        try {
          channelRef.current.send({
            type: 'broadcast',
            event: 'telemetry_event',
            payload: evt,
          });
        } catch {
          // ignore
        }
      }

      if (remoteTableStateRef.current === 'available') {
        syncEventToRemoteTable(evt);
      }

      return evt;
    },
    [appendEventLocal, syncEventToRemoteTable]
  );

  // Probe de latência e disponibilidade do Supabase (+ verificação opcional da tabela remota)
  const pingSupabase = useCallback(async () => {
    setSupabaseHealth((prev) => ({ ...prev, checking: true }));
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    try {
      const { error } = await supabasePublic
        .from('stats_ti')
        .select('id_territorio', { count: 'exact', head: true });

      const elapsed = Math.max(
        1,
        Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start)
      );

      let syncMode = 'realtime_local';
      if (remoteTableStateRef.current === 'unknown') {
        try {
          const { data: remoteRows, error: remoteErr } = await supabase
            .from('painel_monitoramento')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

          if (!remoteErr && Array.isArray(remoteRows)) {
            remoteTableStateRef.current = 'available';
            syncMode = 'supabase_table';
            remoteRows.forEach((row) => {
              appendEventLocal(
                createTelemetryEvent({
                  id: row.id,
                  timestamp: row.timestamp,
                  type: row.type,
                  category: row.category,
                  title: row.title,
                  detail: row.detail,
                  route: row.route,
                  sessionId: row.session_id,
                  device: row.device,
                  metadata: {
                    ...(row.metadata || {}),
                    userEmail: row.user_email,
                    userName: row.user_name,
                    userRole: row.user_role,
                  },
                })
              );
            });
          } else {
            remoteTableStateRef.current = 'unavailable';
          }
        } catch {
          remoteTableStateRef.current = 'unavailable';
        }
      } else if (remoteTableStateRef.current === 'available') {
        syncMode = 'supabase_table';
      }

      setSupabaseHealth({
        connected: !error,
        latencyMs: elapsed,
        checking: false,
        lastPingAt: new Date().toISOString(),
        syncMode,
      });
    } catch {
      setSupabaseHealth({
        connected: false,
        latencyMs: null,
        checking: false,
        lastPingAt: new Date().toISOString(),
        syncMode: 'local_cache',
      });
    }
  }, [appendEventLocal]);

  useEffect(() => {
    pingSupabase();
  }, [pingSupabase]);

  // Canal Realtime Supabase (Presence + Broadcast ao vivo)
  useEffect(() => {
    const channel = supabase.channel(REALTIME_CHANNEL, {
      config: {
        presence: {
          key: sessionIdRef.current,
        },
      },
    });

    const buildPresencePayload = () => {
      const currentUser = userRef.current;
      return {
        sessionId: sessionIdRef.current,
        userEmail: currentUser?.email || 'visitante@publico',
        userName:
          currentUser?.user_metadata?.name ||
          (currentUser?.email ? currentUser.email.split('@')[0] : 'Visitante Público'),
        userRole:
          currentUser?.user_metadata?.role ||
          (currentUser?.email?.includes('admin') ? 'admin' : currentUser?.email ? 'gestor' : 'publico'),
        route: routeRef.current,
        moduleName: getRouteLabel(routeRef.current),
        device: deviceInfoRef.current.label,
        onlineAt: new Date().toISOString(),
      };
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        try {
          const state = channel.presenceState();
          const sessions = [];
          Object.values(state || {}).forEach((entries) => {
            if (Array.isArray(entries) && entries[0]) {
              sessions.push(entries[0]);
            }
          });
          setOnlineSessions(sessions);
        } catch {
          // ignore
        }
      })
      .on('broadcast', { event: 'telemetry_event' }, ({ payload }) => {
        if (payload && payload.sessionId !== sessionIdRef.current) {
          appendEventLocal(payload);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track(buildPresencePayload());
          } catch {
            // ignore
          }
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [appendEventLocal]);

  // Atualiza presença quando usuário ou rota muda
  useEffect(() => {
    if (!channelRef.current) return;
    const currentUser = user;
    try {
      channelRef.current.track({
        sessionId: sessionIdRef.current,
        userEmail: currentUser?.email || 'visitante@publico',
        userName:
          currentUser?.user_metadata?.name ||
          (currentUser?.email ? currentUser.email.split('@')[0] : 'Visitante Público'),
        userRole:
          currentUser?.user_metadata?.role ||
          (currentUser?.email?.includes('admin') ? 'admin' : currentUser?.email ? 'gestor' : 'publico'),
        route: location.pathname,
        moduleName: getRouteLabel(location.pathname),
        device: deviceInfoRef.current.label,
        onlineAt: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
  }, [user, location.pathname]);

  // 1. Rastreamento automático de visitas por rota
  useEffect(() => {
    if (authLoading) return;
    if (lastTrackedRouteRef.current === location.pathname) return;
    lastTrackedRouteRef.current = location.pathname;

    trackEvent({
      type: 'route_view',
      category: 'access',
      title: `Acesso a ${getRouteLabel(location.pathname)}`,
      detail: location.pathname,
      route: location.pathname,
    });
  }, [location.pathname, authLoading, trackEvent]);

  // 2. Rastreamento de login (transição de null -> autenticado)
  useEffect(() => {
    if (authLoading) return;
    const currentEmail = user?.email || null;

    if (prevUserEmailRef.current === undefined) {
      prevUserEmailRef.current = currentEmail;
      return;
    }

    if (prevUserEmailRef.current === null && currentEmail) {
      trackEvent({
        type: 'auth_login',
        category: 'access',
        title: 'Login autenticado',
        detail: currentEmail,
        route: routeRef.current,
        userOverride: user,
      });
    }

    prevUserEmailRef.current = currentEmail;
  }, [user, authLoading, trackEvent]);

  // 3. Rastreamento de território selecionado no painel
  useEffect(() => {
    if (prevTerritoryRef.current === undefined) {
      prevTerritoryRef.current = selectedTerritory || null;
      return;
    }

    const prevId = prevTerritoryRef.current?.id_territorio || null;
    const nextId = selectedTerritory?.id_territorio || null;
    prevTerritoryRef.current = selectedTerritory || null;

    if (selectedTerritory && nextId !== prevId) {
      const tName =
        selectedTerritory.nome_territorio ||
        selectedTerritory.territorio ||
        `Território #${selectedTerritory.id_territorio}`;

      trackEvent({
        type: 'territory_select',
        category: 'interaction',
        title: 'Território consultado',
        detail: tName,
        route: routeRef.current,
        metadata: {
          territoryId: selectedTerritory.id_territorio,
          territoryName: tName,
        },
      });
    }
  }, [selectedTerritory, trackEvent]);

  // 4. Rastreamento do modo Semiárido
  useEffect(() => {
    if (!hasMountedSemiaridoRef.current) {
      hasMountedSemiaridoRef.current = true;
      return;
    }

    trackEvent({
      type: 'semiarido_toggle',
      category: 'interaction',
      title: filtroSemiarido ? 'Recorte Semiárido ativado' : 'Recorte Bahia completa ativado',
      detail: filtroSemiarido ? 'Filtro Semiárido: Ligado' : 'Filtro Semiárido: Desligado',
      route: routeRef.current,
      metadata: { filtroSemiarido },
    });
  }, [filtroSemiarido, trackEvent]);

  // 5. Sincroniza novas operações do auditLog do CRUD com usuário autenticado
  useEffect(() => {
    const auditList = crudDraft?.auditLog || [];
    const newEntries = auditList.filter((entry) => entry && !knownAuditIdsRef.current.has(String(entry.id)));

    if (newEntries.length === 0) return;

    newEntries.forEach((entry) => {
      knownAuditIdsRef.current.add(String(entry.id));
      const actionVerb =
        entry.action === 'create'
          ? 'Novo registro criado'
          : entry.action === 'delete'
            ? 'Registro excluído'
            : 'Registro atualizado';
      const entityName =
        entry.entity === 'ativos'
          ? 'Ativos CT&I'
          : entry.entity === 'cursos'
            ? 'Cursos CT&I'
            : 'Cadeias & IGs';

      trackEvent({
        type: `crud_${entry.action || 'update'}`,
        category: 'audit',
        title: `${actionVerb} em ${entityName}`,
        detail: entry.label || entry.targetId || '',
        route: '/admin',
        metadata: {
          auditId: entry.id,
          entity: entry.entity,
          action: entry.action,
          targetId: entry.targetId,
        },
      });
    });
  }, [crudDraft?.auditLog, trackEvent]);

  const clearHistory = useCallback(() => {
    clearTelemetryEvents();
    setEvents([]);
  }, []);

  const effectiveOnlineSessions = useMemo(() => {
    if (onlineSessions.length > 0) return onlineSessions;
    return [
      {
        sessionId: sessionIdRef.current,
        userEmail: user?.email || 'visitante@publico',
        userName:
          user?.user_metadata?.name ||
          (user?.email ? user.email.split('@')[0] : 'Visitante Público'),
        userRole:
          user?.user_metadata?.role ||
          (user?.email?.includes('admin') ? 'admin' : user?.email ? 'gestor' : 'publico'),
        route: location.pathname,
        moduleName: getRouteLabel(location.pathname),
        device: deviceInfoRef.current.label,
        onlineAt: new Date().toISOString(),
      },
    ];
  }, [onlineSessions, user, location.pathname]);

  const metrics = useMemo(
    () => aggregateTelemetryMetrics(events, crudDraft?.auditLog || [], effectiveOnlineSessions),
    [events, crudDraft?.auditLog, effectiveOnlineSessions]
  );

  const dbHealth = useMemo(
    () =>
      computeDatabaseHealth({
        ativosData,
        cursosData,
        cursosEadData,
        listaCadeias,
        distribuicaoCadeias,
        territoriosData,
        municipiosTerritorios,
        firjanData,
        crudStats,
        supabaseConnected: supabaseHealth.connected,
        latencyMs: supabaseHealth.latencyMs,
        lastPingAt: supabaseHealth.lastPingAt,
      }),
    [
      ativosData,
      cursosData,
      cursosEadData,
      listaCadeias,
      distribuicaoCadeias,
      territoriosData,
      municipiosTerritorios,
      firjanData,
      crudStats,
      supabaseHealth,
    ]
  );

  const value = useMemo(
    () => ({
      events,
      onlineSessions: effectiveOnlineSessions,
      supabaseHealth,
      metrics,
      dbHealth,
      trackEvent,
      pingSupabase,
      clearHistory,
    }),
    [
      events,
      effectiveOnlineSessions,
      supabaseHealth,
      metrics,
      dbHealth,
      trackEvent,
      pingSupabase,
      clearHistory,
    ]
  );

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error('useTelemetry deve ser utilizado dentro de um <TelemetryProvider>');
  }
  return ctx;
}

export default TelemetryContext;
