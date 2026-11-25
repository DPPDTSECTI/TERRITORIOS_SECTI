import React, { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  MinusCircle,
  Clock,
  ExternalLink,
  MapPin,
  Layers,
  X,
  Info,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  PageHeader,
  KpiCard,
  Card,
  SearchInput,
  Select,
  Button,
  Badge,
  Chip,
  EmptyState,
  Drawer,
  KpiSkeleton,
  ListRowSkeleton,
} from './ui';
import {
  normalizeIctStatus,
  computeInstituicoesKpis,
  buildAtivosByInstituicaoMap,
  extractNaturezasInstitucionais,
  filterInstituicoes,
  enrichInstituicoesWithAtivos,
  getAtivosDaInstituicao,
  formatSafeUrl,
} from '../utils/instituicoes';

const ICT_STATUS_META = {
  sim: { label: 'ICT — Sim', shortLabel: 'Sim', badgeVariant: 'success' },
  nao: { label: 'ICT — Não', shortLabel: 'Não', badgeVariant: 'neutral' },
  pendente: { label: 'ICT — Pendente', shortLabel: 'Pendente', badgeVariant: 'warning' },
  outro: { label: 'Não definido', shortLabel: 'Outro', badgeVariant: 'neutral' },
};

const ICT_FILTER_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: 'pendente', label: 'Pendente' },
];

function IctStatusBadge({ status }) {
  const key = normalizeIctStatus(status);
  const meta = ICT_STATUS_META[key] || ICT_STATUS_META.outro;
  return <Badge variant={meta.badgeVariant}>{meta.shortLabel}</Badge>;
}

export default function InstituicoesPage() {
  const { instituicoesData = [], ativosData = [], loadingStats = false } = useData();

  const [search, setSearch] = useState('');
  const [ictStatus, setIctStatus] = useState('todos');
  const [natureza, setNatureza] = useState('todas');
  const [selectedInstituicao, setSelectedInstituicao] = useState(null);

  const kpis = useMemo(
    () => computeInstituicoesKpis(instituicoesData),
    [instituicoesData]
  );

  const ativosMap = useMemo(
    () => buildAtivosByInstituicaoMap(ativosData),
    [ativosData]
  );

  const naturezas = useMemo(
    () => extractNaturezasInstitucionais(instituicoesData),
    [instituicoesData]
  );

  const filteredInstituicoes = useMemo(() => {
    const filtered = filterInstituicoes(instituicoesData, {
      search,
      ictStatus,
      natureza,
    });
    return enrichInstituicoesWithAtivos(filtered, ativosMap);
  }, [instituicoesData, search, ictStatus, natureza, ativosMap]);

  const selectedAtivos = useMemo(
    () => getAtivosDaInstituicao(selectedInstituicao?.id_instituicao, ativosMap),
    [selectedInstituicao, ativosMap]
  );

  const selectedSafeUrl = useMemo(
    () => formatSafeUrl(selectedInstituicao?.site_oficial),
    [selectedInstituicao]
  );

  const hasActiveFilters = Boolean(search.trim()) || ictStatus !== 'todos' || natureza !== 'todas';

  const handleClearFilters = () => {
    setSearch('');
    setIctStatus('todos');
    setNatureza('todas');
  };

  return (
    <main className="w-full h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Instituições"
          subtitle="Consulta institucional de CT&I na Bahia — entidades cadastradas, classificação ICT, natureza institucional e ativos físicos vinculados."
          badge={<Badge variant="neutral">{kpis.total} cadastradas</Badge>}
        />

        {/* Indicadores superiores exclusivamente institucionais */}
        <section aria-label="Indicadores institucionais">
          {loadingStats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total de Instituições"
                value={kpis.total}
                icon={Building2}
                hint="Cadastro institucional CT&I"
              />
              <KpiCard
                label="ICT — Sim"
                value={kpis.sim}
                icon={CheckCircle2}
                hint="Classificadas como ICT"
              />
              <KpiCard
                label="ICT — Não"
                value={kpis.nao}
                icon={MinusCircle}
                hint="Não classificadas como ICT"
              />
              <KpiCard
                label="ICT — Pendente"
                value={kpis.pendente}
                icon={Clock}
                hint="Aguardando validação ICT"
              />
            </div>
          )}
        </section>

        {/* Barra de busca e filtros */}
        <Card>
          <Card.Body className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-5">
                <label
                  htmlFor="instituicoes-search"
                  className="text-caption font-medium text-text-secondary mb-1.5 block"
                >
                  Buscar instituição
                </label>
                <SearchInput
                  id="instituicoes-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClear={() => setSearch('')}
                  placeholder="Buscar por nome ou sigla..."
                  aria-label="Buscar instituição por nome ou sigla"
                />
              </div>

              <div className="lg:col-span-4">
                <span className="text-caption font-medium text-text-secondary mb-1.5 block">
                  Status ICT
                </span>
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5" role="group" aria-label="Filtrar por status ICT">
                  {ICT_FILTER_OPTIONS.map((opt) => (
                    <Chip
                      key={opt.value}
                      size="md"
                      variant={opt.value === 'pendente' ? 'warning' : opt.value === 'sim' ? 'success' : 'primary'}
                      selected={ictStatus === opt.value}
                      onClick={() => setIctStatus(opt.value)}
                      className="h-8 !px-2 text-xs sm:h-9 sm:!px-3"
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3">
                <label
                  htmlFor="instituicoes-natureza"
                  className="text-caption font-medium text-text-secondary mb-1.5 block"
                >
                  Natureza institucional
                </label>
                <Select
                  id="instituicoes-natureza"
                  value={natureza}
                  onChange={(e) => setNatureza(e.target.value)}
                  aria-label="Filtrar por natureza institucional"
                >
                  <option value="todas">Todas as naturezas</option>
                  {naturezas.map((nat) => (
                    <option key={nat} value={nat}>
                      {nat}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-caption text-text-muted">
              <span className="tabular-nums">
                Exibindo <strong className="text-text-primary">{filteredInstituicoes.length}</strong> de{' '}
                <strong className="text-text-primary">{kpis.total}</strong> instituições
              </span>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<X className="w-3.5 h-3.5" />}
                  onClick={handleClearFilters}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Listagem */}
        <section aria-label="Lista de instituições">
          {loadingStats ? (
            <Card>
              <Card.Body className="space-y-3">
                <ListRowSkeleton />
                <ListRowSkeleton />
                <ListRowSkeleton />
                <ListRowSkeleton />
                <ListRowSkeleton />
              </Card.Body>
            </Card>
          ) : filteredInstituicoes.length === 0 ? (
            <EmptyState
              title="Nenhuma instituição encontrada"
              description="Nenhuma instituição corresponde aos critérios de busca ou filtros selecionados."
              action={
                hasActiveFilters ? (
                  <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                    Limpar filtros
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              {/* Tabela Desktop */}
              <Card className="hidden md:block overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/80 bg-surface-soft/70">
                        <th className="py-3 px-4 text-caption font-semibold uppercase tracking-wider text-text-muted">
                          Instituição
                        </th>
                        <th className="py-3 px-4 text-caption font-semibold uppercase tracking-wider text-text-muted">
                          Sigla
                        </th>
                        <th className="py-3 px-4 text-caption font-semibold uppercase tracking-wider text-text-muted text-center">
                          Status ICT
                        </th>
                        <th className="py-3 px-4 text-caption font-semibold uppercase tracking-wider text-text-muted">
                          Natureza
                        </th>
                        <th className="py-3 px-4 text-caption font-semibold uppercase tracking-wider text-text-muted text-right">
                          Ativos Vinculados
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredInstituicoes.map((inst) => (
                        <tr
                          key={inst.id_instituicao}
                          onClick={() => setSelectedInstituicao(inst)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedInstituicao(inst);
                            }
                          }}
                          className="hover:bg-surface-soft/80 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:bg-surface-soft"
                        >
                          <td className="py-2.5 px-4 text-body-sm font-medium text-text-primary">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate" title={inst.nome_instituicao}>
                                {inst.nome_instituicao}
                              </span>
                              {inst.ativa === false && (
                                <Badge variant="danger">Inativa</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-body-sm text-text-secondary whitespace-nowrap">
                            {inst.sigla || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <IctStatusBadge status={inst.ict_status} />
                          </td>
                          <td className="py-2.5 px-4 text-body-sm text-text-secondary">
                            <span className="truncate block max-w-[260px]" title={inst.natureza_institucional || ''}>
                              {inst.natureza_institucional || 'Não informada'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-body-sm font-medium text-text-primary text-right tabular-nums">
                            {inst.qtdAtivos}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Cards Mobile */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredInstituicoes.map((inst) => (
                  <Card
                    key={inst.id_instituicao}
                    variant="interactive"
                    onClick={() => setSelectedInstituicao(inst)}
                  >
                    <Card.Body className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-body-sm font-semibold text-text-primary leading-snug">
                            {inst.nome_instituicao}
                          </h3>
                          <p className="text-caption text-text-muted mt-0.5">
                            {inst.sigla || 'Sem sigla'}
                          </p>
                        </div>
                        <IctStatusBadge status={inst.ict_status} />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 text-caption">
                        <span className="text-text-secondary truncate">
                          {inst.natureza_institucional || 'Natureza não informada'}
                        </span>
                        <span className="font-semibold text-text-primary tabular-nums shrink-0">
                          {inst.qtdAtivos} {inst.qtdAtivos === 1 ? 'ativo' : 'ativos'}
                        </span>
                      </div>

                      {inst.ativa === false && (
                        <div>
                          <Badge variant="danger">Inativa</Badge>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Visualização Detalhada (Drawer) */}
        <Drawer
          open={Boolean(selectedInstituicao)}
          onClose={() => setSelectedInstituicao(null)}
          width="max-w-xl"
          title={selectedInstituicao?.nome_instituicao || 'Detalhes da Instituição'}
          subtitle={selectedInstituicao?.sigla || 'Sem sigla cadastrada'}
        >
          {selectedInstituicao && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <IctStatusBadge status={selectedInstituicao.ict_status} />
                <Badge variant={selectedInstituicao.ativa === false ? 'danger' : 'primary'}>
                  {selectedInstituicao.ativa === false ? 'Inativa' : 'Ativa'}
                </Badge>
                <Badge variant="neutral" className="tabular-nums">
                  {selectedAtivos.length}{' '}
                  {selectedAtivos.length === 1 ? 'ativo vinculado' : 'ativos vinculados'}
                </Badge>
              </div>

              <dl className="divide-y divide-border/60 rounded-subcard border border-border/70 bg-surface-soft/50">
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-caption font-medium text-text-muted">Natureza</dt>
                  <dd className="text-body-sm text-text-primary sm:text-right">
                    {selectedInstituicao.natureza_institucional || 'Não informada'}
                  </dd>
                </div>

                <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-caption font-medium text-text-muted">Site oficial</dt>
                  <dd className="text-body-sm sm:text-right">
                    {selectedSafeUrl ? (
                      <a
                        href={selectedSafeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline break-all"
                      >
                        <span>{selectedInstituicao.site_oficial}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-text-muted">Não informado</span>
                    )}
                  </dd>
                </div>

                {selectedInstituicao.observacao_ict && (
                  <div className="px-4 py-3 space-y-1">
                    <dt className="text-caption font-medium text-text-muted flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>Observação ICT</span>
                    </dt>
                    <dd className="text-body-sm text-text-secondary leading-relaxed">
                      {selectedInstituicao.observacao_ict}
                    </dd>
                  </div>
                )}
              </dl>

              <section aria-label="Ativos vinculados à instituição" className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-body-sm font-semibold text-text-primary">
                    Ativos Físicos Vinculados
                  </h3>
                  <span className="text-caption text-text-muted tabular-nums">
                    {selectedAtivos.length} {selectedAtivos.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {selectedAtivos.length === 0 ? (
                  <div className="rounded-subcard border border-dashed border-border p-5 text-center text-body-sm text-text-muted">
                    Nenhum ativo físico vinculado a esta instituição até o momento.
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60 rounded-subcard border border-border/70 bg-surface">
                    {selectedAtivos.map((ativo) => (
                      <li key={ativo.id_ativo} className="p-3.5 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-body-sm font-medium text-text-primary leading-snug">
                            {ativo.nome_ativo}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-muted">
                          {ativo.tipo && (
                            <span className="inline-flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 shrink-0" />
                              <span>{ativo.tipo}</span>
                            </span>
                          )}
                          {(ativo.municipio || ativo.territorio_identidade) && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {[ativo.municipio, ativo.territorio_identidade]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </Drawer>
      </div>
    </main>
  );
}
