import { describe, it, expect } from 'vitest';
import {
  detectDeviceInfo,
  createTelemetryEvent,
  aggregateTelemetryMetrics,
  computeDatabaseHealth,
  getRouteLabel,
} from '../../utils/telemetry';

describe('Telemetry & Monitoring utilities', () => {
  it('resolves readable module labels for routes', () => {
    expect(getRouteLabel('/territorios')).toBe('Visão Geral');
    expect(getRouteLabel('/admin?tab=monitoramento')).toBe('Gestão CRUD & Monitoramento');
    expect(getRouteLabel('/rota-desconhecida')).toBe('/rota-desconhecida');
  });

  it('detects browser, OS and device form factor correctly', () => {
    const desktopChrome = detectDeviceInfo(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
      1440
    );
    expect(desktopChrome).toEqual({
      browser: 'Chrome',
      os: 'Windows',
      deviceType: 'Desktop',
      label: 'Desktop · Chrome / Windows',
    });

    const desktopEdge = detectDeviceInfo(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
      1280
    );
    expect(desktopEdge.browser).toBe('Edge');

    const mobileSafari = detectDeviceInfo(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
      390
    );
    expect(mobileSafari.deviceType).toBe('Mobile');
    expect(mobileSafari.os).toBe('iOS');
    expect(mobileSafari.browser).toBe('Safari');
  });

  it('creates normalized telemetry events for authenticated and public visitors', () => {
    const authEvent = createTelemetryEvent({
      type: 'route_view',
      category: 'access',
      route: '/territorios',
      user: {
        email: 'admin@secti.ba.gov.br',
        user_metadata: { name: 'Administrador SECTI', role: 'admin' },
      },
      sessionId: 'sess-123',
      device: 'Desktop · Chrome / Windows',
    });

    expect(authEvent.userEmail).toBe('admin@secti.ba.gov.br');
    expect(authEvent.userName).toBe('Administrador SECTI');
    expect(authEvent.userRole).toBe('admin');
    expect(authEvent.moduleName).toBe('Visão Geral');

    const publicEvent = createTelemetryEvent({
      type: 'route_view',
      category: 'access',
      route: '/ativos',
      sessionId: 'sess-pub',
      device: 'Desktop · Firefox / Linux',
    });

    expect(publicEvent.userEmail).toBe('visitante@publico');
    expect(publicEvent.userName).toBe('Visitante Público');
    expect(publicEvent.userRole).toBe('publico');
    expect(publicEvent.moduleName).toBe('Ativos CT&I');
  });

  it('aggregates metrics, merges auditLog entries without duplicates, and tracks online users', () => {
    const events = [
      createTelemetryEvent({
        id: 'evt-1',
        timestamp: '2026-11-18T14:00:00.000Z',
        type: 'route_view',
        category: 'access',
        route: '/territorios',
        user: { email: 'admin@secti.ba.gov.br', user_metadata: { name: 'Admin', role: 'admin' } },
        sessionId: 's1',
      }),
      createTelemetryEvent({
        id: 'evt-2',
        timestamp: '2026-11-18T14:05:00.000Z',
        type: 'territory_select',
        category: 'interaction',
        detail: 'Metropolitano de Salvador',
        route: '/territorios',
        user: { email: 'admin@secti.ba.gov.br', user_metadata: { name: 'Admin', role: 'admin' } },
        sessionId: 's1',
        metadata: { territoryName: 'Metropolitano de Salvador' },
      }),
      createTelemetryEvent({
        id: 'evt-3',
        timestamp: '2026-11-18T14:10:00.000Z',
        type: 'crud_create',
        category: 'audit',
        title: 'Novo registro criado em Ativos CT&I',
        route: '/admin',
        user: { email: 'admin@secti.ba.gov.br', user_metadata: { name: 'Admin', role: 'admin' } },
        sessionId: 's1',
        metadata: { auditId: 'aud-1' },
      }),
    ];

    const auditLog = [
      {
        id: 'aud-1', // já representado em events -> não deve duplicar
        entity: 'ativos',
        action: 'create',
        targetId: 'a1',
        label: 'Parque Tecnológico da Bahia',
        timestamp: '2026-11-18T14:10:00.000Z',
      },
      {
        id: 'aud-2', // pré-existente -> deve ser convertido
        entity: 'cursos',
        action: 'update',
        targetId: 'c1',
        label: 'Ciência da Computação',
        timestamp: '2026-11-18T14:12:00.000Z',
      },
    ];

    const onlineSessions = [
      {
        sessionId: 's1',
        userEmail: 'admin@secti.ba.gov.br',
        userName: 'Admin',
        userRole: 'admin',
        route: '/admin',
        moduleName: 'Gestão CRUD & Monitoramento',
        device: 'Desktop · Chrome / Windows',
        onlineAt: '2026-11-18T14:15:00.000Z',
      },
    ];

    const aggregated = aggregateTelemetryMetrics(events, auditLog, onlineSessions);

    expect(aggregated.totalEvents).toBe(4);
    expect(aggregated.totalPageViews).toBe(1);
    expect(aggregated.totalInteractions).toBe(1);
    expect(aggregated.totalCrudActions).toBe(2);
    expect(aggregated.moduleRanking[0]).toMatchObject({ route: '/territorios', count: 1, percentage: 100 });
    expect(aggregated.territoryRanking[0]).toMatchObject({
      name: 'Metropolitano de Salvador',
      count: 1,
      percentage: 100,
    });
    expect(aggregated.uniqueUsers.find((u) => u.email === 'admin@secti.ba.gov.br')?.isOnline).toBe(true);
  });

  it('computes database health inventory, territorial coverage and completeness percentages', () => {
    const health = computeDatabaseHealth({
      ativosData: [
        { id_territorio: 1, municipio: 'Salvador', latitude: -12.97, longitude: -38.5 },
        { id_territorio: 2, municipio: 'Feira de Santana', latitude: '', longitude: '' },
      ],
      cursosData: [
        {
          id_territorio: 1,
          municipio: 'Salvador',
          categoria: 'Engenharias',
          entidade: 'UFBA',
        },
      ],
      cursosEadData: [{ id_curso: 99, ead: true }],
      listaCadeias: [
        {
          id_territorio: 5,
          municipio_sede: 'Ilhéus',
          segmento: 'Cacauicultura',
        },
      ],
      distribuicaoCadeias: [{ id_territorio: 5, nome_municipio: 'Ilhéus' }],
      territoriosData: Array.from({ length: 27 }, (_, idx) => ({ id_territorio: idx + 1 })),
      municipiosTerritorios: [{ nome_municipio: 'Salvador' }, { nome_municipio: 'Ilhéus' }],
      firjanData: [{ nome_municipio: 'Salvador', media_ifdm: 0.8 }],
      crudStats: { total: 3, byEntity: { ativos: 2, cursos: 1, cadeias: 0 } },
      supabaseConnected: true,
      latencyMs: 42,
      lastPingAt: '2026-11-18T14:20:00.000Z',
    });

    expect(health.connected).toBe(true);
    expect(health.latencyMs).toBe(42);
    expect(health.totalTerritories).toBe(27);
    expect(health.totalDraftChanges).toBe(3);

    const ativosTable = health.tables.find((t) => t.id === 'ativos');
    expect(ativosTable).toMatchObject({
      recordsCount: 2,
      territoriesCovered: 2,
      municipalitiesCovered: 2,
      completenessPct: 50,
      draftDelta: 2,
    });

    const cursosTable = health.tables.find((t) => t.id === 'cursos');
    expect(cursosTable).toMatchObject({
      recordsCount: 2,
      completenessPct: 100,
      draftDelta: 1,
    });
  });
});
