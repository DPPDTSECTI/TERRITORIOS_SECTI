import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Filter,
  Pencil,
  FileText,
  MapPin,
  CheckCircle
} from 'lucide-react';
import UserHeaderProfile from './UserHeaderProfile';
import {
  Card,
  KpiCard,
  Button,
  IconButton,
  Input,
  SearchInput,
  Select,
  PageHeader,
  Drawer,
  Dialog,
  Badge,
  useToast
} from './ui';

function getBadgeVariant(tipo) {
  const t = tipo?.toLowerCase() || '';
  if (t.includes('hub')) return 'primary';
  if (t.includes('parque')) return 'success';
  if (t.includes('polo')) return 'accent';
  if (t.includes('incubadora')) return 'warning';
  return 'neutral';
}

const INITIAL_ATIVOS = [
  { id: 1, nome: 'Senai CIMATEC', tipo: 'Hub', municipio: 'Salvador', referencia: 'FIEB', sigla: 'CIMATEC' },
  { id: 2, nome: 'Parque Tecnológico', tipo: 'Parque', municipio: 'Salvador', referencia: 'SECTI', sigla: 'PTB' },
  { id: 3, nome: 'Polo de Inovação', tipo: 'Polo', municipio: 'Ilhéus', referencia: 'UESC', sigla: 'CEPEDI' },
  { id: 4, nome: 'Incubadora Casulo', tipo: 'Incubadora', municipio: 'Feira de Santana', referencia: 'UEFS', sigla: 'INC' },
  { id: 5, nome: 'Hub de IA', tipo: 'Hub', municipio: 'Vitória da Conquista', referencia: 'UESB', sigla: 'HIA' },
  { id: 6, nome: 'Centro de Pesquisa', tipo: 'Laboratório', municipio: 'Camaçari', referencia: 'IFBA', sigla: 'CPQ' },
];

export default function AdminPage() {
  const { toast } = useToast();
  const [ativos, setAtivos] = useState(INITIAL_ATIVOS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Drawer de criação / edição
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Hub',
    municipio: '',
    sigla: '',
    referencia: '',
  });

  // Diálogo de confirmação de exclusão
  const [deletingAtivo, setDeletingAtivo] = useState(null);

  const todayFormatted = useMemo(() => {
    const raw = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, []);

  const availableTypes = useMemo(() => {
    const set = new Set(ativos.map(a => a.tipo).filter(Boolean));
    return Array.from(set).sort();
  }, [ativos]);

  const totalMunicipios = useMemo(() => {
    return new Set(ativos.map(a => a.municipio).filter(Boolean)).size;
  }, [ativos]);

  const filteredAtivos = useMemo(() => {
    return ativos.filter((item) => {
      const matchesType = selectedType === 'all' || item.tipo === selectedType;
      if (!matchesType) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        item.nome?.toLowerCase().includes(term) ||
        item.municipio?.toLowerCase().includes(term) ||
        item.sigla?.toLowerCase().includes(term) ||
        item.referencia?.toLowerCase().includes(term)
      );
    });
  }, [ativos, selectedType, searchTerm]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      tipo: 'Hub',
      municipio: '',
      sigla: '',
      referencia: '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (ativo) => {
    setEditingId(ativo.id);
    setFormData({
      nome: ativo.nome || '',
      tipo: ativo.tipo || 'Hub',
      municipio: ativo.municipio || '',
      sigla: ativo.sigla || '',
      referencia: ativo.referencia || '',
    });
    setIsDrawerOpen(true);
  };

  const handleSave = (e) => {
    e?.preventDefault();
    const cleanNome = formData.nome.trim();
    const cleanMunicipio = formData.municipio.trim();

    if (!cleanNome || !cleanMunicipio) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Por favor, informe ao menos o Nome do ativo e o Município.',
        variant: 'warning',
      });
      return;
    }

    if (editingId) {
      setAtivos((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, ...formData, nome: cleanNome, municipio: cleanMunicipio }
            : item
        )
      );
      toast({
        title: 'Registro Atualizado',
        description: `O ativo "${cleanNome}" foi atualizado com sucesso.`,
        variant: 'success',
      });
    } else {
      const newAtivo = {
        id: Date.now(),
        ...formData,
        nome: cleanNome,
        municipio: cleanMunicipio,
      };
      setAtivos((prev) => [newAtivo, ...prev]);
      toast({
        title: 'Registro Cadastrado',
        description: `O ativo "${cleanNome}" foi adicionado com sucesso.`,
        variant: 'success',
      });
    }

    setIsDrawerOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingAtivo) return;
    const deletedName = deletingAtivo.nome;
    setAtivos((prev) => prev.filter((item) => item.id !== deletingAtivo.id));
    setDeletingAtivo(null);
    toast({
      title: 'Registro Excluído',
      description: `O ativo "${deletedName}" foi removido da base.`,
      variant: 'success',
    });
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 bg-background font-sans flex flex-col overflow-hidden min-h-0">
      <div className="max-w-7xl w-full mx-auto flex flex-col gap-5 flex-1 min-h-0">

        {/* CABEÇALHO DA PÁGINA (PASSO 2.1) */}
        <PageHeader
          title="Administração de Dados CT&I"
          subtitle={`Gestão, cadastro e auditoria de registros de CT&I no estado da Bahia • ${todayFormatted}`}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                iconLeft={<Plus className="w-4 h-4" />}
                onClick={handleOpenCreate}
              >
                Novo Registro
              </Button>
              <UserHeaderProfile />
            </div>
          }
        />

        {/* FAIXA BENTO BOX DE MÉTRICAS (PASSO 2.2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <KpiCard
            label="Total na Base"
            value={ativos.length}
            icon={FileText}
            variant="brand"
            hint="Registros cadastrados"
          />

          <KpiCard
            label="Registros Exibidos"
            value={filteredAtivos.length}
            icon={Filter}
            hint={selectedType !== 'all' || searchTerm ? 'Filtro aplicado' : 'Todos os registros'}
          />

          <KpiCard
            label="Municípios Cobertos"
            value={totalMunicipios}
            icon={MapPin}
            hint="Cidades com ativos mapeados"
          />

          <KpiCard
            label="Status da Base"
            value={
              <span className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-success-600 dark:text-success-400">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                Sincronizado
              </span>
            }
            format="raw"
            icon={CheckCircle}
            hint="Base Oficial SECTI/BA"
          />
        </div>

        {/* TABELA PRINCIPAL DENTRO DE CARD COM CABEÇALHO FIXO (PASSO 3.1) */}
        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden shadow-card">
          {/* BARRA DE FERRAMENTAS / FILTROS (PASSO 2.3) */}
          <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl min-w-0">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
                enableShortcut
                placeholder="Buscar por nome, município, sigla ou referência... (Pressione /)"
              />
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                containerClassName="w-full sm:w-48 shrink-0"
              >
                <option value="all">Todas as Categorias</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>

            <div className="text-caption text-text-muted shrink-0 self-end sm:self-center">
              Mostrando <strong className="text-text-primary tnum">{filteredAtivos.length}</strong> de <span className="tnum">{ativos.length}</span>
            </div>
          </div>

          {/* TABELA COM SCROLL INTERNO E CABEÇALHO STICKY */}
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 [scrollbar-gutter:stable]">
            <table className="w-full text-left border-collapse text-body-sm min-w-[720px]">
              <thead className="sticky top-0 bg-surface-soft border-b border-border text-micro uppercase tracking-wider text-text-muted z-10 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Ativo</th>
                  <th className="py-3 px-4 font-semibold">Categoria</th>
                  <th className="py-3 px-4 font-semibold">Localidade</th>
                  <th className="py-3 px-4 font-semibold">Fonte / Referência</th>
                  <th className="py-3 px-4 font-semibold">Sigla</th>
                  <th className="py-3 px-4 font-semibold text-center w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-text-primary">
                {filteredAtivos.length > 0 ? (
                  filteredAtivos.map((ativo) => (
                    <tr
                      key={ativo.id}
                      className="hover:bg-surface-soft/70 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center shrink-0 border border-primary-200/50 dark:border-primary-800/50 text-caption select-none">
                            {ativo.nome?.charAt(0) || 'A'}
                          </div>
                          <span className="font-semibold text-text-primary truncate" title={ativo.nome}>
                            {ativo.nome}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getBadgeVariant(ativo.tipo)}>
                          {ativo.tipo}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-text-secondary truncate" title={ativo.municipio}>
                        {ativo.municipio}
                      </td>
                      <td className="py-3 px-4 text-text-secondary truncate" title={ativo.referencia || '-'}>
                        {ativo.referencia || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-surface-soft text-text-primary px-2.5 py-1 rounded-control text-caption font-medium border border-border inline-flex items-center justify-center leading-none">
                          {ativo.sigla || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <IconButton
                            size="sm"
                            variant="ghost"
                            icon={<Pencil className="w-4 h-4 text-text-secondary group-hover:text-primary-600" />}
                            onClick={() => handleOpenEdit(ativo)}
                            aria-label="Editar registro"
                            title="Editar registro"
                          />
                          <IconButton
                            size="sm"
                            variant="ghost"
                            icon={<Trash2 className="w-4 h-4 text-text-secondary group-hover:text-danger-600" />}
                            onClick={() => setDeletingAtivo(ativo)}
                            aria-label="Excluir registro"
                            title="Excluir registro"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
                      <p className="text-body-sm font-medium">Nenhum ativo encontrado para os filtros informados.</p>
                      {(searchTerm || selectedType !== 'all') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 text-primary-600"
                          onClick={() => { setSearchTerm(''); setSelectedType('all'); }}
                        >
                          Limpar filtros
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* DRAWER DE CADASTRO E EDIÇÃO (PASSO 3.2) */}
        <Drawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={editingId ? 'Editar Registro' : 'Novo Registro de CT&I'}
          subtitle={
            editingId
              ? 'Altere as informações do ativo selecionado.'
              : 'Preencha os campos abaixo para cadastrar um novo ativo institucional.'
          }
          footer={
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsDrawerOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
              >
                {editingId ? 'Salvar Alterações' : 'Cadastrar Ativo'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="ativo-nome" className="text-caption font-medium text-text-primary">
                Nome do Ativo <span className="text-danger-600">*</span>
              </label>
              <Input
                id="ativo-nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Senai CIMATEC"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ativo-tipo" className="text-caption font-medium text-text-primary">
                Categoria / Tipo <span className="text-danger-600">*</span>
              </label>
              <Select
                id="ativo-tipo"
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
              >
                <option value="Hub">Hub</option>
                <option value="Parque">Parque</option>
                <option value="Polo">Polo</option>
                <option value="Incubadora">Incubadora</option>
                <option value="Laboratório">Laboratório</option>
                <option value="Centro de Pesquisa">Centro de Pesquisa</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ativo-municipio" className="text-caption font-medium text-text-primary">
                Município <span className="text-danger-600">*</span>
              </label>
              <Input
                id="ativo-municipio"
                value={formData.municipio}
                onChange={(e) => setFormData(prev => ({ ...prev, municipio: e.target.value }))}
                placeholder="Ex: Salvador"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="ativo-sigla" className="text-caption font-medium text-text-primary">
                  Sigla
                </label>
                <Input
                  id="ativo-sigla"
                  value={formData.sigla}
                  onChange={(e) => setFormData(prev => ({ ...prev, sigla: e.target.value }))}
                  placeholder="Ex: CIMATEC"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ativo-ref" className="text-caption font-medium text-text-primary">
                  Referência
                </label>
                <Input
                  id="ativo-ref"
                  value={formData.referencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                  placeholder="Ex: FIEB / SECTI"
                />
              </div>
            </div>
          </form>
        </Drawer>

        {/* DIÁLOGO MODAL DE EXCLUSÃO (PASSO 3.3) */}
        <Dialog
          open={Boolean(deletingAtivo)}
          onClose={() => setDeletingAtivo(null)}
          title="Confirmar Exclusão"
          description={`Esta ação removerá o registro da listagem ativa.`}
          size="sm"
          footer={
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDeletingAtivo(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDelete}
              >
                Excluir Registro
              </Button>
            </>
          }
        >
          <p className="text-body-sm text-text-secondary leading-relaxed">
            Tem certeza que deseja remover o registro de{' '}
            <strong className="text-text-primary">{deletingAtivo?.nome}</strong> ({deletingAtivo?.municipio})?
          </p>
        </Dialog>

      </div>
    </div>
  );
}
