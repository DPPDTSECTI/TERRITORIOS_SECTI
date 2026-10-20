import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Building2,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Download,
  Filter,
  Trash2,
  Settings,
  User,
  LogOut,
  ExternalLink,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  Card,
  Button,
  IconButton,
  Chip,
  Badge,
  Input,
  SearchInput,
  Select,
  Tabs,
  SegmentedControl,
  KpiCard,
  SectionHeader,
  PageHeader,
  Skeleton,
  KpiSkeleton,
  ListRowSkeleton,
  ChartSkeleton,
  EmptyState,
  ProgressBar,
  Tooltip,
  Dialog,
  Drawer,
  Dropdown,
  useToast,
} from './index';

export default function UiShowcasePage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  // Estados interativos
  const [searchValue, setSearchValue] = useState('');
  const [selectedChip, setSelectedChip] = useState('tech');
  const [activeTab, setActiveTab] = useState('geral');
  const [activeUnderlineTab, setActiveUnderlineTab] = useState('ativos');
  const [segmentedVal, setSegmentedVal] = useState('mes');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [progressVal, setProgressVal] = useState(68);

  const tabItems = [
    { id: 'geral', label: 'Visão Geral', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'municipios', label: 'Municípios', count: 417 },
    { id: 'indicadores', label: 'Indicadores', count: 28 },
  ];

  const underlineTabItems = [
    { id: 'ativos', label: 'Ativos Tecnológicos', count: 184 },
    { id: 'cursos', label: 'Cursos & Polos', count: 96 },
    { id: 'cadeias', label: 'Cadeias Produtivas', count: 14 },
  ];

  const dropdownItems = [
    { label: 'Meu Perfil', icon: User, onClick: () => toast({ title: 'Perfil selecionado' }) },
    { label: 'Configurações', icon: Settings, onClick: () => toast({ title: 'Configurações abertas' }) },
    { divider: true },
    { label: 'Exportar Dados', icon: Download, onClick: () => toast({ title: 'Exportação iniciada', variant: 'success' }) },
    { divider: true },
    { label: 'Encerrar Sessão', icon: LogOut, danger: true, onClick: () => toast({ title: 'Logout solicitado', variant: 'danger' }) },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary p-6 sm:p-10 space-y-12 max-w-7xl mx-auto">
      {/* CABEÇALHO DA VITRINE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-display font-bold tracking-tight text-text-primary">
              Design System SECTI
            </h1>
            <Badge variant="primary">Vitrine v2.0</Badge>
          </div>
          <p className="text-body text-text-secondary">
            Catálogo interativo de componentes UI fundamentados nos tokens institucionais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            iconLeft={theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            onClick={toggleTheme}
          >
            Tema {theme === 'dark' ? 'Claro' : 'Escuro'}
          </Button>
        </div>
      </div>

      {/* SEÇÃO 1: CABEÇALHOS & KPI CARDS */}
      <section className="space-y-6">
        <PageHeader
          title="Métricas Territoriais"
          subtitle="Visão consolidada de CT&I para o Estado da Bahia com dados em tempo real."
          badge={<Badge variant="accent">Oficial SECTI</Badge>}
          actions={
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Download className="w-3.5 h-3.5" />}
              onClick={() => toast({ title: 'Relatório baixado com sucesso!', variant: 'success' })}
            >
              Exportar Painel
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total de Ativos"
            value={14141}
            format="int"
            icon={Building2}
            hint="Distribuídos em 27 territórios"
            delta={<span className="text-success-700 dark:text-success-400 text-caption font-semibold flex items-center gap-0.5"><TrendingUp className="w-3.5 h-3.5" /> +12.4%</span>}
          />
          <KpiCard
            label="Cursos Ofertados"
            value={8540}
            format="int"
            icon={GraduationCap}
            hint="Em 417 municípios baianos"
          />
          <KpiCard
            label="Taxa de Cobertura"
            value={94.8}
            format="percent"
            icon={Flame}
            hint="Metas do Plano Bahia 2035"
          />
          <KpiCard
            variant="brand"
            label="Investimento Total"
            value="R$ 48,5 Mi"
            icon={Sparkles}
            hint="Aportes em Ciência e Tecnologia"
          />
        </div>
      </section>

      {/* SEÇÃO 2: BOTÕES & ÍCONES */}
      <section className="space-y-4">
        <SectionHeader
          title="Botões & Controles de Ação"
          subtitle="Variantes de contraste, tamanhos padronizados e estados de carregamento."
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg">Primário Grande</Button>
          <Button variant="primary" size="md" iconLeft={<Sparkles className="w-4 h-4" />}>Primário com Ícone</Button>
          <Button variant="secondary" size="md">Secundário</Button>
          <Button variant="ghost" size="md">Fantasma</Button>
          <Button variant="danger" size="md" iconLeft={<Trash2 className="w-4 h-4" />}>Excluir</Button>
          <Button variant="primary" size="sm" loading>Carregando</Button>
          <Button variant="secondary" size="sm" disabled>Desabilitado</Button>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <span className="text-caption text-text-muted">IconButtons:</span>
          <IconButton aria-label="Informações" variant="secondary" size="sm"><Info className="w-4 h-4" /></IconButton>
          <IconButton aria-label="Configurações" variant="secondary" size="md"><Settings className="w-4 h-4" /></IconButton>
          <IconButton aria-label="Download" variant="primary" size="lg"><Download className="w-5 h-5" /></IconButton>
          <IconButton aria-label="Carregando" variant="secondary" size="md" loading />
        </div>
      </section>

      {/* SEÇÃO 3: CARDS & SUPERFÍCIES */}
      <section className="space-y-4">
        <SectionHeader
          title="Superfícies & Cards"
          subtitle="Tokens de elevação, variantes rebaixadas e gradiente institucional da marca."
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="default">
            <Card.Header>
              <h4 className="text-subtitle font-semibold">Card Default</h4>
              <Badge variant="neutral">Normal</Badge>
            </Card.Header>
            <Card.Body>
              <p className="text-body-sm text-text-secondary">Superfície padrão com sombra sutil e borda institucional neutra.</p>
            </Card.Body>
          </Card>

          <Card variant="interactive" onClick={() => toast({ title: 'Card clicado!' })}>
            <Card.Header>
              <h4 className="text-subtitle font-semibold">Card Interativo</h4>
              <Badge variant="primary">Hover</Badge>
            </Card.Header>
            <Card.Body>
              <p className="text-body-sm text-text-secondary">Elevação no hover com transição e cursor pointer.</p>
            </Card.Body>
          </Card>

          <Card variant="sunken">
            <Card.Header>
              <h4 className="text-subtitle font-semibold">Card Sunken</h4>
              <Badge variant="warning">Rebaixado</Badge>
            </Card.Header>
            <Card.Body>
              <p className="text-body-sm text-text-secondary">Fundo rebaixado para caixas de entrada ou agrupamentos neutros.</p>
            </Card.Body>
          </Card>

          <Card variant="brand">
            <Card.Header>
              <h4 className="text-subtitle font-semibold text-white">Gradiente Marca</h4>
              <Badge variant="accent">SECTI</Badge>
            </Card.Header>
            <Card.Body>
              <p className="text-body-sm text-white/90">Gradiente institucional Bahia com alto contraste cromático.</p>
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* SEÇÃO 4: CHIPS & BADGES */}
      <section className="space-y-4">
        <SectionHeader
          title="Chips & Badges Semânticos"
          subtitle="Filtros interativos com contador tabular e identificadores de status."
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption text-text-muted mr-2">Badges:</span>
            <Badge variant="neutral">Neutro</Badge>
            <Badge variant="primary" icon={<Sparkles className="w-3 h-3" />}>Primário</Badge>
            <Badge variant="success" icon={<CheckCircle2 className="w-3 h-3" />}>Ativo</Badge>
            <Badge variant="warning" icon={<AlertTriangle className="w-3 h-3" />}>Pendente</Badge>
            <Badge variant="accent">Bahia Ouro</Badge>
            <Badge variant="danger">Erro Crítico</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption text-text-muted mr-2">Chips (Filtros):</span>
            <Chip
              variant="primary"
              selected={selectedChip === 'tech'}
              onClick={() => setSelectedChip('tech')}
              count={124}
              icon={<Building2 className="w-3.5 h-3.5" />}
            >
              Tecnologia
            </Chip>
            <Chip
              variant="success"
              selected={selectedChip === 'ensino'}
              onClick={() => setSelectedChip('ensino')}
              count={85}
              icon={<GraduationCap className="w-3.5 h-3.5" />}
            >
              Ensino Superior
            </Chip>
            <Chip
              variant="warning"
              selected={selectedChip === 'infra'}
              onClick={() => setSelectedChip('infra')}
              count={32}
            >
              Infraestrutura
            </Chip>
            <Chip
              variant="neutral"
              selected={selectedChip === 'todos'}
              onClick={() => setSelectedChip('todos')}
            >
              Ver Todos
            </Chip>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5: ENTRADAS & BUSCA */}
      <section className="space-y-4">
        <SectionHeader
          title="Entradas de Dados & Busca"
          subtitle="Campos com suporte a atalhos de teclado, limpeza rápida e seletores padronizados."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-caption font-medium text-text-secondary mb-1.5">
              Busca com Atalho (Pressione '/')
            </label>
            <SearchInput
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              enableShortcut
              placeholder="Digite um município..."
            />
          </div>

          <div>
            <label className="block text-caption font-medium text-text-secondary mb-1.5">
              Campo de Texto Padrão
            </label>
            <Input placeholder="Nome do coordenador..." />
          </div>

          <div>
            <label className="block text-caption font-medium text-text-secondary mb-1.5">
              Seletor Dropdown (Select)
            </label>
            <Select defaultValue="metropolitano">
              <option value="metropolitano">Metropolitano de Salvador</option>
              <option value="litoral-sul">Litoral Sul</option>
              <option value="sudoeste">Sudoeste Baiano</option>
              <option value="oeste">Oeste da Bahia</option>
            </Select>
          </div>
        </div>
      </section>

      {/* SEÇÃO 6: NAVEGAÇÃO, TABS & PROGRESSO */}
      <section className="space-y-6">
        <SectionHeader
          title="Navegação & Barras de Progresso"
          subtitle="Abas com indicador de movimento fluido e feedback numérico animado."
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} variant="pill" />
            <SegmentedControl
              options={[
                { value: 'mes', label: 'Mensal' },
                { value: 'tri', label: 'Trimestral' },
                { value: 'ano', label: 'Anual' },
              ]}
              value={segmentedVal}
              onChange={setSegmentedVal}
              size="sm"
            />
          </div>

          <Tabs items={underlineTabItems} value={activeUnderlineTab} onChange={setActiveUnderlineTab} variant="underline" />

          <div className="p-5 bg-surface border border-border rounded-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-medium">Progresso da Meta 2026</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setProgressVal(30)}>30%</Button>
                <Button size="sm" variant="secondary" onClick={() => setProgressVal(68)}>68%</Button>
                <Button size="sm" variant="secondary" onClick={() => setProgressVal(100)}>100%</Button>
              </div>
            </div>
            <ProgressBar value={progressVal} max={100} showValue label="Implantação de Polos" />
          </div>
        </div>
      </section>

      {/* SEÇÃO 7: FEEDBACK, SKELETONS & EMPTY STATE */}
      <section className="space-y-4">
        <SectionHeader
          title="Feedback & Estados"
          subtitle="Componentes para carregamento responsivo e ausência de resultados."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EmptyState
            title="Nenhum ativo encontrado"
            description="Tente ajustar os filtros de busca ou selecionar outro território de identidade."
            action={
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Filter className="w-3.5 h-3.5" />}
                onClick={() => toast({ title: 'Filtros redefinidos' })}
              >
                Limpar Todos os Filtros
              </Button>
            }
          />

          <div className="space-y-4">
            <ListRowSkeleton count={2} />
            <KpiSkeleton />
          </div>
        </div>
      </section>

      {/* SEÇÃO 8: OVERLAYS, MODAL, DRAWER & TOASTS */}
      <section className="space-y-4">
        <SectionHeader
          title="Overlays, Menus & Notificações"
          subtitle="Diálogos modais, painéis laterais (Drawer), dropdowns navegáveis e toasts."
        />

        <div className="flex flex-wrap items-center gap-4">
          <Tooltip content="Clique para abrir modal com foco gerenciado" side="top">
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              Abrir Diálogo (Modal)
            </Button>
          </Tooltip>

          <Tooltip content="Abre gaveta lateral direita com animação" side="top">
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              Abrir Painel Lateral (Drawer)
            </Button>
          </Tooltip>

          <Dropdown
            trigger={
              <Button variant="secondary" iconRight={<ChevronDown className="w-4 h-4" />}>
                Menu Dropdown
              </Button>
            }
            items={dropdownItems}
          />

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast({ title: 'Atualização concluída', description: 'Todos os indicadores foram sincronizados.', variant: 'success' })}
            >
              Toast Sucesso
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast({ title: 'Atenção aos dados', description: 'Existem 3 municípios pendentes de validação.', variant: 'warning' })}
            >
              Toast Alerta
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast({ title: 'Falha na conexão', description: 'Não foi possível carregar a base de dados.', variant: 'danger' })}
            >
              Toast Erro
            </Button>
          </div>
        </div>
      </section>

      {/* DIÁLOGO MODAL */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Detalhes do Território"
        description="Informações consolidadas para o Território Metropolitano de Salvador."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => { setDialogOpen(false); toast({ title: 'Alterações salvas!', variant: 'success' }); }}>
              Confirmar
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-body-sm text-text-secondary leading-relaxed">
            O Território Metropolitano concentra o maior número de instituições de ensino superior e centros de inovação tecnológica do Estado da Bahia.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface-sunken rounded-control">
              <span className="text-caption font-medium text-text-muted">Municípios</span>
              <p className="text-subtitle font-bold mt-1">13</p>
            </div>
            <div className="p-3 bg-surface-sunken rounded-control">
              <span className="text-caption font-medium text-text-muted">População Estimada</span>
              <p className="text-subtitle font-bold mt-1">3,9 Mi</p>
            </div>
          </div>
        </div>
      </Dialog>

      {/* PAINEL LATERAL (DRAWER) */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filtros Avançados"
        subtitle="Selecione parâmetros para refinar os indicadores geográficos."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Fechar</Button>
            <Button variant="primary" onClick={() => { setDrawerOpen(false); toast({ title: 'Filtros aplicados com sucesso!', variant: 'success' }); }}>
              Aplicar Filtros
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-caption font-medium mb-1.5">Segmento de Ativo</label>
            <Select defaultValue="todos">
              <option value="todos">Todos os Segmentos</option>
              <option value="pesquisa">Institutos de Pesquisa</option>
              <option value="incubadora">Incubadoras & Aceleradoras</option>
              <option value="polo">Polos Tecnológicos</option>
            </Select>
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5">Rede RNP Conectada</label>
            <SegmentedControl
              options={[
                { value: 'todas', label: 'Todas' },
                { value: 'sim', label: 'Conectadas' },
                { value: 'nao', label: 'Pendentes' },
              ]}
              value="todas"
              onChange={() => {}}
              size="sm"
            />
          </div>

          <div className="p-4 bg-surface-sunken border border-border/70 rounded-control space-y-2">
            <span className="text-caption font-semibold flex items-center gap-1.5 text-primary-700 dark:text-primary-400">
              <Info className="w-4 h-4" /> Dica de Navegação
            </span>
            <p className="text-caption text-text-muted leading-relaxed">
              Você pode usar o atalho <kbd className="px-1 py-0.5 rounded bg-surface border text-caption font-mono">/</kbd> em qualquer tela para ativar o campo de busca rápido.
            </p>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
