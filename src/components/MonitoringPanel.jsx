import React, { useState, useMemo } from 'react';
import {
  Activity,
  Users,
  Database,
  ShieldCheck,
  RefreshCw,
  Download,
  Trash2,
  Wifi,
  WifiOff,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  FileEdit,
  Eye,
  MousePointerClick,
  Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTelemetry } from '../context/TelemetryContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { normalize } from '../utils/normalization';
import { fadeUp, staggerContainer } from '../lib/motion';
import { cn } from '../lib/cn';
import {
  Button,
  IconButton,
  SearchInput,
  SegmentedControl,
  ProgressBar,
  EmptyState,
  Dialog,
  AnimatedNumber,
  useToast,
} from './ui';

const SUB_VIEW_OPTIONS = [
  { value: 'overview', label: 'Acessos & Usuários', icon: <Users className="w-3.5 h-3.5" /> },
  { value: 'data', label: 'Saúde dos Dados', icon: <Database className="w-3.5 h-3.5" /> },
  { value: 'logs', label: 'Auditoria & Logs', icon: <Activity className="w-3.5 h-3.5" /> },
];

const CATEGORY_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'access', label: 'Acessos & Login' },
  { value: 'audit', label: 'Auditoria CRUD' },
  { value: 'interaction', label: 'Interações' },
];

function formatDateTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getDeviceIcon(deviceLabel) {
  const s = String(deviceLabel || '').toLowerCase();
  if (s.includes('mobile')) return <Smartphone className="w-3.5 h-3.5 text-text-muted shrink-0" />;
  if (s.includes('tablet')) return <Tablet className="w-3.5 h-3.5 text-text-muted shrink-0" />;
  return <Monitor className="w-3.5 h-3.5 text-text-muted shrink-0" />;
}

function getRoleBadgeClass(role) {
  if (role === 'admin') {
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
  }
  if (role === 'gestor') {
    return 'bg-primary-500/10 text-primary-700 dark:text-primary-300 border-primary-500/20';
  }
  return 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20';
}

function getCategoryBadge(category) {
  if (category === 'audit') {
    return {
      label: 'Auditoria',
      icon: <FileEdit className="w-3 h-3" />,
      className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    };
  }
  if (category === 'interaction') {
    return {
      label: 'Interação',
      icon: <MousePointerClick className="w-3 h-3" />,
      className: 'bg-primary-500/10 text-primary-700 dark:text-primary-300 border-primary-500/20',
    };
  }
  return {
    label: 'Acesso',
    icon: <Eye className="w-3 h-3" />,
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  };
}

export default function MonitoringPanel() {
  const { toast } = useToast();
  const { userName, userRole } = useAuth();
  const { filtroSemiarido = false, crudStats = {} } = useData();
  const {
    metrics,
    dbHealth,
    supabaseHealth,
    pingSupabase,
    clearHistory,
    trackEvent,
  } = useTelemetry();

  const [subView, setSubView] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const borderThemeClass = filtroSemiarido
    ? 'border-amber-300/60 dark:border-amber-700/50'
    : 'border-border/60';

  const handleRefreshHealth = async () => {
    await pingSupabase();
    toast({
      title: 'Diagnóstico atualizado',
      description: supabaseHealth.connected
        ? 'Conexão e latência do Supabase verificadas.'
        : 'Painel operando em modo de cache local.',
      variant: 'success',
    });
  };

  const handleExportLogs = () => {
    const payload = {
      exportadoEm: new Date().toISOString(),
      operador: `${userName} (${userRole})`,
      saudeSupabase: supabaseHealth,
      resumoMetricas: {
        totalEventos: metrics.totalEvents,
        visualizacoesPagina: metrics.totalPageViews,
        operacoesCrud: metrics.totalCrudActions,
        interacoes: metrics.totalInteractions,
        usuariosDistintos: metrics.uniqueUsers.length,
        sessoesOnline: metrics.onlineCount,
      },
      saudeDados: dbHealth,
      usuarios: metrics.uniqueUsers,
      eventos: metrics.mergedEvents,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secti-monitoramento-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    trackEvent({
      type: 'export_telemetry',
      category: 'interaction',
      title: 'Exportação de logs de monitoramento',
      detail: `${metrics.mergedEvents.length} evento(s) exportado(s)`,
      route: '/admin',
    });

    toast({
      title: 'Logs exportados',
      description: `${metrics.mergedEvents.length} registro(s) exportado(s) em JSON.`,
      variant: 'success',
    });
  };

  const handleConfirmClear = () => {
    clearHistory();
    setIsClearDialogOpen(false);
    toast({
      title: 'Histórico de telemetria limpo',
      description: 'Eventos locais foram removidos. Novos acessos continuam sendo monitorados.',
      variant: 'default',
    });
  };

  const filteredEvents = useMemo(() => {
    const q = normalize(searchQuery);
    return (metrics.mergedEvents || []).filter((evt) => {
      if (categoryFilter !== 'all' && evt.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        normalize(evt.title).includes(q) ||
        normalize(evt.detail).includes(q) ||
        normalize(evt.userName).includes(q) ||
        normalize(evt.userEmail).includes(q) ||
        normalize(evt.moduleName).includes(q) ||
        normalize(evt.device).includes(q)
      );
    });
  }, [metrics.mergedEvents, categoryFilter, searchQuery]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      {/* KPI CARDS DO MONITORAMENTO */}
      <motion.div
        variants={staggerContainer(0.04)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0"
      >
        {/* 1. Acessos & Sessões */}
        <motion.div
          variants={fadeUp}
          className={cn(
            'rounded-card border bg-surface p-4 sm:p-5 shadow-card flex flex-col justify-between gap-2 h-full',
            borderThemeClass
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-text-secondary">Acessos & Sessões</span>
            <Activity className="w-4 h-4 text-text-muted stroke-[1.75]" />
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-text-primary">
            <AnimatedNumber value={metrics.totalPageViews} />
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted tabular-nums">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {metrics.onlineCount} online agora
            </span>
          </div>
        </motion.div>

        {/* 2. Usuários & Operadores */}
        <motion.div
          variants={fadeUp}
          className={cn(
            'rounded-card border bg-surface p-4 sm:p-5 shadow-card flex flex-col justify-between gap-2 h-full',
            borderThemeClass
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-text-secondary">Usuários & Operadores</span>
            <Users className="w-4 h-4 text-text-muted stroke-[1.75]" />
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-text-primary">
            <AnimatedNumber value={metrics.uniqueUsers.length} />
          </div>
          <div className="text-xs text-text-muted truncate" title={`${userName} (${userRole})`}>
            Ativo: <span className="font-medium text-text-secondary">{userName}</span> ·{' '}
            <span className="uppercase font-mono text-[10px]">{userRole}</span>
          </div>
        </motion.div>

        {/* 3. Auditoria CRUD */}
        <motion.div
          variants={fadeUp}
          className={cn(
            'rounded-card border bg-surface p-4 sm:p-5 shadow-card flex flex-col justify-between gap-2 h-full',
            borderThemeClass
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-text-secondary">Auditoria CRUD</span>
            <ShieldCheck className="w-4 h-4 text-text-muted stroke-[1.75]" />
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums text-text-primary">
            <AnimatedNumber value={metrics.totalCrudActions} />
          </div>
          <div className="text-xs text-text-muted tabular-nums">
            +{crudStats.added || 0} criados · ~{crudStats.updated || 0} edit. · -
            {crudStats.deleted || 0} excl.
          </div>
        </motion.div>

        {/* 4. Saúde Supabase */}
        <motion.div
          variants={fadeUp}
          className={cn(
            'rounded-card border bg-surface p-4 sm:p-5 shadow-card flex flex-col justify-between gap-2 h-full',
            borderThemeClass
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-text-secondary">Saúde Supabase</span>
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="Testar latência do Supabase"
              title="Testar latência agora"
              loading={supabaseHealth.checking}
              onClick={handleRefreshHealth}
              className="w-6 h-6 text-text-muted hover:text-text-primary"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[1.75]" />
            </IconButton>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                supabaseHealth.connected ? 'bg-emerald-500' : 'bg-amber-500'
              )}
            />
            <span className="text-xl font-semibold tracking-tight text-text-primary">
              {supabaseHealth.connected ? 'Operacional' : 'Cache Local'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-text-muted tabular-nums">
            <span className="inline-flex items-center gap-1">
              {supabaseHealth.connected ? (
                <Wifi className="w-3 h-3 text-emerald-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-amber-500" />
              )}
              {supabaseHealth.latencyMs != null ? `${supabaseHealth.latencyMs} ms` : 'Aguardando'}
            </span>
            <span>{dbHealth.totalRecords.toLocaleString('pt-BR')} reg.</span>
          </div>
        </motion.div>
      </motion.div>

      {/* BARRA DE CONTROLE DO MONITORAMENTO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <SegmentedControl
          options={SUB_VIEW_OPTIONS}
          value={subView}
          onChange={setSubView}
          size="sm"
          layoutId="monitoring-subview"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<RefreshCw className={cn('w-3.5 h-3.5', supabaseHealth.checking && 'animate-spin')} />}
            onClick={handleRefreshHealth}
            disabled={supabaseHealth.checking}
          >
            Atualizar Diagnóstico
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportLogs}
          >
            Exportar Logs JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setIsClearDialogOpen(true)}
            disabled={metrics.mergedEvents.length === 0}
            className="text-text-secondary hover:text-rose-600 dark:hover:text-rose-400"
          >
            Limpar Histórico
          </Button>
        </div>
      </div>

      {/* SUB-VIEW 1: VISÃO GERAL & ACESSOS */}
      {subView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* QUEM ACESSOU O PAINEL */}
          <section
            className={cn(
              'lg:col-span-7 rounded-card border bg-surface shadow-card flex flex-col min-h-0 overflow-hidden',
              borderThemeClass
            )}
          >
            <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between gap-2 shrink-0">
              <div>
                <h2 className="text-sm font-medium text-text-primary">Quem Acessou o Painel</h2>
                <p className="text-xs text-text-muted">
                  Sessões ativas em tempo real e histórico de operadores e visitantes
                </p>
              </div>
              <span className="text-xs font-medium tabular-nums text-text-secondary px-2.5 py-1 rounded-full bg-surface-soft border border-border/60">
                {metrics.uniqueUsers.length} registro(s)
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              {metrics.uniqueUsers.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={Users}
                    title="Nenhum acesso registrado ainda"
                    description="As sessões e navegações aparecerão aqui automaticamente."
                  />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-surface-soft/95 dark:bg-surface-raised/95 backdrop-blur-xs border-b border-border/60">
                    <tr>
                      <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                        Usuário / Perfil
                      </th>
                      <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                        Módulo Atual
                      </th>
                      <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-text-muted hidden sm:table-cell">
                        Dispositivo
                      </th>
                      <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-text-muted text-right">
                        Eventos
                      </th>
                      <th className="py-2.5 px-3 text-xs font-medium uppercase tracking-wider text-text-muted text-center">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {metrics.uniqueUsers.map((u) => (
                      <tr
                        key={u.key}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-sm min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-text-primary truncate max-w-[140px]" title={u.name}>
                              {u.name}
                            </span>
                            <span
                              className={cn(
                                'px-1.5 py-0.5 text-[10px] font-medium uppercase font-mono rounded-full border shrink-0',
                                getRoleBadgeClass(u.role)
                              )}
                            >
                              {u.role}
                            </span>
                          </div>
                          <div className="text-xs text-text-muted font-mono truncate max-w-[180px]" title={u.email}>
                            {u.email}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-text-secondary">
                          <div className="truncate max-w-[150px]" title={u.lastModule}>
                            {u.lastModule}
                          </div>
                          <div className="text-[11px] text-text-muted tabular-nums">
                            {formatDateTime(u.lastSeen)}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary hidden sm:table-cell">
                          <div className="flex items-center gap-1.5 max-w-[145px]">
                            {getDeviceIcon(u.device)}
                            <span className="truncate" title={u.device}>
                              {u.device}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-right tabular-nums font-medium text-text-primary">
                          {u.eventCount}
                          {u.crudCount > 0 && (
                            <div className="text-[11px] font-normal text-amber-600 dark:text-amber-400">
                              {u.crudCount} CRUD
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {u.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                              Recente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* MÓDULOS E TERRITÓRIOS MAIS CONSULTADOS */}
          <section
            className={cn(
              'lg:col-span-5 rounded-card border bg-surface shadow-card flex flex-col min-h-0 overflow-hidden divide-y divide-border/60',
              borderThemeClass
            )}
          >
            {/* Módulos Mais Acessados */}
            <div className="p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                <h2 className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-text-muted stroke-[1.75]" />
                  <span>Módulos Mais Acessados</span>
                </h2>
                <span className="text-xs text-text-muted tabular-nums">
                  {metrics.totalPageViews} visitas
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                {metrics.moduleRanking.length === 0 ? (
                  <p className="text-xs text-text-muted py-4 text-center">
                    Navegue pelo painel para registrar visualizações de módulos.
                  </p>
                ) : (
                  metrics.moduleRanking.slice(0, 6).map((mod) => (
                    <div key={mod.route} className="space-y-1">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-medium text-text-primary truncate" title={mod.route}>
                          {mod.label}
                        </span>
                        <span className="tabular-nums text-text-secondary shrink-0">
                          {mod.count} {mod.count === 1 ? 'acesso' : 'acessos'}
                        </span>
                      </div>
                      <ProgressBar value={mod.percentage} max={100} size="sm" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Territórios Mais Consultados */}
            <div className="p-5 flex-1 min-h-0 flex flex-col overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                <h2 className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-text-muted stroke-[1.75]" />
                  <span>Territórios Mais Consultados</span>
                </h2>
                <span className="text-xs text-text-muted tabular-nums">
                  {metrics.territoryRanking.length} selecionado(s)
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                {metrics.territoryRanking.length === 0 ? (
                  <p className="text-xs text-text-muted py-4 text-center">
                    Nenhum território selecionado nesta janela de monitoramento.
                  </p>
                ) : (
                  metrics.territoryRanking.slice(0, 5).map((terr) => (
                    <div key={terr.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-medium text-text-primary truncate" title={terr.name}>
                          {terr.name}
                        </span>
                        <span className="tabular-nums text-text-secondary shrink-0">
                          {terr.count}x
                        </span>
                      </div>
                      <ProgressBar
                        value={terr.percentage}
                        max={100}
                        size="sm"
                        colorClass={filtroSemiarido ? 'bg-amber-500' : 'bg-emerald-600'}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* SUB-VIEW 2: SAÚDE & INVENTÁRIO DOS DADOS */}
      {subView === 'data' && (
        <section
          className={cn(
            'flex-1 min-h-0 rounded-card border bg-surface shadow-card flex flex-col overflow-hidden',
            borderThemeClass
          )}
        >
          <div className="px-5 py-3.5 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div>
              <h2 className="text-sm font-medium text-text-primary">
                Inventário & Saúde das Tabelas CT&I
              </h2>
              <p className="text-xs text-text-muted">
                Cobertura territorial, completude cadastral e status de sincronização com o Supabase
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted tabular-nums">
              <Clock className="w-3.5 h-3.5" />
              <span>Última checagem: {formatDateTime(dbHealth.lastPingAt)}</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-surface-soft/95 dark:bg-surface-raised/95 backdrop-blur-xs border-b border-border/60">
                <tr>
                  <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-text-muted">
                    Conjunto de Dados / Tabela
                  </th>
                  <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-text-muted text-right">
                    Registros
                  </th>
                  <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-text-muted">
                    Cobertura Territorial
                  </th>
                  <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-text-muted w-56">
                    Completude
                  </th>
                  <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-text-muted text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {dbHealth.tables.map((table) => (
                  <tr
                    key={table.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm">
                      <div className="font-medium text-text-primary">{table.name}</div>
                      <div className="text-xs text-text-muted font-mono">{table.source}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-right tabular-nums">
                      <div className="font-semibold text-text-primary">
                        {table.recordsCount.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-text-muted">{table.secondaryLabel}</div>
                    </td>
                    <td className="py-3 px-4 text-sm tabular-nums">
                      <div className="font-medium text-text-primary">
                        {table.territoriesCovered}/{table.totalTerritories} territórios
                      </div>
                      <div className="text-xs text-text-muted">
                        {table.municipalitiesCovered} municípios
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs tabular-nums">
                          <span className="text-text-muted">{table.completenessHint}</span>
                          <span className="font-semibold text-text-primary">
                            {table.completenessPct}%
                          </span>
                        </div>
                        <ProgressBar
                          value={table.completenessPct}
                          max={100}
                          size="sm"
                          colorClass={
                            table.completenessPct >= 80
                              ? 'bg-emerald-600'
                              : table.completenessPct >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                          }
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {table.draftDelta > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 tabular-nums">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {table.draftDelta} rascunho(s)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Sincronizado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SUB-VIEW 3: AUDITORIA & LINHA DO TEMPO */}
      {subView === 'logs' && (
        <section
          className={cn(
            'flex-1 min-h-0 rounded-card border bg-surface shadow-card flex flex-col overflow-hidden',
            borderThemeClass
          )}
        >
          {/* TOOLBAR UNIFICADA */}
          <div className="p-4 sm:px-5 border-b border-border/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                containerClassName="sm:max-w-sm"
                placeholder="Buscar usuário, evento, módulo..."
              />

              <div className="flex items-center gap-1.5 flex-wrap">
                {CATEGORY_FILTERS.map((cat) => {
                  const isSelected = categoryFilter === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategoryFilter(cat.value)}
                      className={cn(
                        'h-8 px-3 rounded-full text-xs font-medium border transition-all duration-150 cursor-pointer',
                        isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                          : 'bg-surface-soft/70 text-text-secondary border-border/70 hover:text-text-primary hover:bg-surface-soft'
                      )}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <span className="text-xs text-text-muted tabular-nums shrink-0">
              {filteredEvents.length} evento(s)
            </span>
          </div>

          {/* TABELA DE EVENTOS */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Activity}
                  title="Nenhum evento encontrado"
                  description="Tente ajustar o termo de busca ou o filtro de categoria."
                  action={
                    (searchQuery || categoryFilter !== 'all') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('all');
                        }}
                      >
                        Limpar filtros
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-surface-soft/95 dark:bg-surface-raised/95 backdrop-blur-xs border-b border-border/60">
                  <tr>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-text-muted">
                      Data / Hora
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-text-muted text-center">
                      Categoria
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-text-muted">
                      Evento / Detalhe
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-text-muted">
                      Usuário
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-text-muted hidden md:table-cell">
                      Módulo
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-text-muted hidden xl:table-cell">
                      Dispositivo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredEvents.map((evt) => {
                    const catBadge = getCategoryBadge(evt.category);
                    return (
                      <tr
                        key={evt.id}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 text-xs text-text-secondary tabular-nums whitespace-nowrap">
                          {formatDateTime(evt.timestamp)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                              catBadge.className
                            )}
                          >
                            {catBadge.icon}
                            <span>{catBadge.label}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-sm min-w-0">
                          <div className="font-medium text-text-primary truncate max-w-[260px]" title={evt.title}>
                            {evt.title}
                          </div>
                          {evt.detail && (
                            <div className="text-xs text-text-muted truncate max-w-[260px]" title={evt.detail}>
                              {evt.detail}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-xs min-w-0">
                          <div className="font-medium text-text-primary truncate max-w-[160px]" title={evt.userName}>
                            {evt.userName}
                          </div>
                          <div className="text-text-muted font-mono truncate max-w-[160px]" title={evt.userEmail}>
                            {evt.userEmail}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-text-secondary hidden md:table-cell">
                          <span className="truncate block max-w-[160px]" title={evt.route}>
                            {evt.moduleName}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-text-muted hidden xl:table-cell">
                          <div className="flex items-center gap-1.5 max-w-[170px]">
                            {getDeviceIcon(evt.device)}
                            <span className="truncate" title={evt.device}>
                              {evt.device}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* CONFIRMAÇÃO DE LIMPEZA DO HISTÓRICO */}
      <Dialog
        open={isClearDialogOpen}
        onClose={() => setIsClearDialogOpen(false)}
        title="Limpar histórico de monitoramento"
        description="Esta ação remove os registros de acesso e interações armazenados neste navegador. O rascunho de auditoria do CRUD oficial não será afetado."
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setIsClearDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" size="md" onClick={handleConfirmClear}>
              Limpar histórico
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Deseja confirmar a remoção de{' '}
          <span className="font-semibold text-text-primary tabular-nums">
            {metrics.mergedEvents.length}
          </span>{' '}
          evento(s) capturado(s) no histórico local?
        </p>
      </Dialog>
    </div>
  );
}
