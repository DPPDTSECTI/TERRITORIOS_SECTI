import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  Database,
  GraduationCap,
  GitPullRequest,
  MapPin,
  Download,
  RotateCcw,
  History,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  Wifi,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { normalize } from '../utils/normalization';
import { fadeUp, staggerContainer } from '../lib/motion';
import {
  getEntityItemId,
  getEntityItemLabel,
  validateCrudForm,
} from '../utils/crudDraft';
import { cn } from '../lib/cn';
import {
  Button,
  IconButton,
  Input,
  SearchInput,
  Select,
  Tabs,
  PageHeader,
  Drawer,
  Dialog,
  Badge,
  EmptyState,
  AnimatedNumber,
  KpiSkeleton,
  useToast,
} from './ui';

const BATCH_SIZE = 30;

const DEFAULT_ATIVO_TYPES = [
  'Universidade Estadual',
  'Universidade Federal',
  'Instituto Federal',
  'Universidade Privada',
  'Parque Tecnológico',
  'Incubadora',
  'Aceleradora',
  'Centro de Pesquisa',
  'Espaço Colaborar',
  'ICT',
];

const DEFAULT_CURSO_CATEGORIES = [
  'Engenharias e Tecnologias',
  'Ciências Exatas e da Terra',
  'Ciências Agrárias',
  'Ciências Biológicas e Saúde',
  'Ciências Sociais Aplicadas',
  'Educação e Licenciaturas',
  'Outros',
];

const DEFAULT_CADEIA_TYPES = [
  'Arranjo Produtivo Local (APL)',
  'Indicação Geográfica Registrada',
  'Indicação Geográfica Potencial',
];

function cleanTerritoryLabel(raw) {
  return String(raw || '')
    .replace(/^\d+\s*[-–]\s*/, '')
    .trim();
}

function getBoolFlag(val) {
  if (val === true || val === 1 || val === '1') return true;
  const s = String(val || '').trim().toLowerCase();
  return s === 'true' || s === 't' || s === 'sim';
}

function getInitialFormValues(entity) {
  if (entity === 'ativos') {
    return {
      nome_ativo: '',
      sigla: '',
      tipo: DEFAULT_ATIVO_TYPES[0],
      municipio: '',
      id_territorio: '',
      territorio_identidade: '',
      rnp: false,
      referencia: '',
      latitude: '',
      longitude: '',
    };
  }
  if (entity === 'cursos') {
    return {
      curso: '',
      entidade: '',
      sigla: '',
      categoria: DEFAULT_CURSO_CATEGORIES[0],
      municipio: '',
      id_territorio: '',
      territorio_identidade: '',
      modalidade: 'Presencial',
      ead: false,
    };
  }
  return {
    entidade: '',
    segmento: '',
    tipo: DEFAULT_CADEIA_TYPES[0],
    municipio_sede: '',
    id_territorio: '',
    nome_territorio: '',
    fonte: '',
    texto_referencia: '',
  };
}

function mapItemToFormValues(entity, item) {
  if (!item) return getInitialFormValues(entity);

  if (entity === 'ativos') {
    return {
      nome_ativo: item.nome_ativo || item.nome || '',
      sigla: item.sigla || '',
      tipo: item.tipo || item.nome_tipo || DEFAULT_ATIVO_TYPES[0],
      municipio: item.municipio || '',
      id_territorio: item.id_territorio != null ? String(item.id_territorio) : '',
      territorio_identidade: cleanTerritoryLabel(
        item.territorio_identidade || item.territorio || item.nome_territorio || ''
      ),
      rnp: getBoolFlag(item.rnp),
      referencia: item.referencia || item.titulo_referencia || item.fonte || '',
      latitude: item.latitude ?? item.lat ?? '',
      longitude: item.longitude ?? item.lng ?? '',
    };
  }

  if (entity === 'cursos') {
    const isEad = getBoolFlag(item.ead);
    return {
      curso: item.curso || item.nome || '',
      entidade: item.entidade || item.instituicao || '',
      sigla: item.sigla || '',
      categoria: item.categoria || item.tipo || DEFAULT_CURSO_CATEGORIES[0],
      municipio: item.municipio || '',
      id_territorio: item.id_territorio != null ? String(item.id_territorio) : '',
      territorio_identidade: cleanTerritoryLabel(
        item.territorio_identidade || item.territorio || item.nome_territorio || ''
      ),
      modalidade: item.modalidade || (isEad ? 'EAD' : 'Presencial'),
      ead: isEad,
    };
  }

  return {
    entidade: item.entidade || item.nome || '',
    segmento: item.segmento || item.nome_cadeia || '',
    tipo: item.tipo || item.nome_tipo || DEFAULT_CADEIA_TYPES[0],
    municipio_sede: item.municipio_sede || item.sede || item.nome_municipio || item.municipio || '',
    id_territorio: item.id_territorio != null ? String(item.id_territorio) : '',
    nome_territorio: cleanTerritoryLabel(
      item.nome_territorio || item.territorio_identidade || item.territorio || ''
    ),
    fonte: item.fonte || item.url_referencia || '',
    texto_referencia: item.texto_referencia || '',
  };
}

function buildPayloadFromForm(entity, values, territoryNameById) {
  const tidNum = values.id_territorio ? Number(values.id_territorio) : null;
  const resolvedTerritoryName =
    (tidNum && territoryNameById.get(tidNum)) ||
    cleanTerritoryLabel(values.territorio_identidade || values.nome_territorio || '');

  if (entity === 'ativos') {
    const lat = values.latitude !== '' && values.latitude != null ? Number(values.latitude) : null;
    const lng = values.longitude !== '' && values.longitude != null ? Number(values.longitude) : null;
    return {
      nome_ativo: values.nome_ativo.trim(),
      nome: values.nome_ativo.trim(),
      sigla: values.sigla.trim().toUpperCase(),
      tipo: values.tipo.trim(),
      nome_tipo: values.tipo.trim(),
      municipio: values.municipio.trim(),
      id_territorio: tidNum,
      territorio_identidade: resolvedTerritoryName,
      territorio: resolvedTerritoryName,
      rnp: Boolean(values.rnp),
      referencia: values.referencia.trim(),
      latitude: lat,
      longitude: lng,
    };
  }

  if (entity === 'cursos') {
    const isEad = values.modalidade === 'EAD' || Boolean(values.ead);
    return {
      curso: values.curso.trim(),
      nome: values.curso.trim(),
      entidade: values.entidade.trim(),
      sigla: values.sigla.trim().toUpperCase(),
      categoria: values.categoria.trim(),
      tipo: values.categoria.trim(),
      municipio: values.municipio.trim(),
      id_territorio: tidNum,
      territorio_identidade: resolvedTerritoryName,
      territorio: resolvedTerritoryName,
      modalidade: isEad ? 'EAD' : 'Presencial',
      ead: isEad,
    };
  }

  const tipoClean = values.tipo.trim();
  const isPotencial = tipoClean.toLowerCase().includes('potencial');
  const isIg = tipoClean.toLowerCase().includes('indicação') || tipoClean.toLowerCase().includes('indicacao') || tipoClean.toLowerCase().includes('ig');

  return {
    entidade: values.entidade.trim(),
    nome: values.entidade.trim(),
    segmento: values.segmento.trim() || values.entidade.trim(),
    nome_cadeia: values.segmento.trim() || values.entidade.trim(),
    tipo: tipoClean,
    nome_tipo: tipoClean,
    id_tipo_cadeia: isPotencial ? 3 : isIg ? 2 : 1,
    municipio_sede: values.municipio_sede.trim(),
    sede: values.municipio_sede.trim(),
    nome_municipio: values.municipio_sede.trim(),
    id_territorio: tidNum,
    nome_territorio: resolvedTerritoryName,
    territorio_identidade: resolvedTerritoryName,
    fonte: values.fonte.trim(),
    texto_referencia: values.texto_referencia.trim() || null,
  };
}

function CrudStatusPill({ status }) {
  if (status === 'added') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
        Novo
      </span>
    );
  }
  if (status === 'updated') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
        Editado
      </span>
    );
  }
  return null;
}

function TableSkeletonRows() {
  return Array.from({ length: 8 }).map((_, idx) => (
    <tr key={idx} className="border-b border-zinc-200/60 dark:border-zinc-800/60">
      <td className="py-2.5 px-4">
        <div className="h-4 w-48 animate-pulse bg-zinc-200/70 dark:bg-zinc-800/70 rounded-md" />
      </td>
      <td className="py-2.5 px-4">
        <div className="h-4 w-28 animate-pulse bg-zinc-200/70 dark:bg-zinc-800/70 rounded-md" />
      </td>
      <td className="py-2.5 px-4">
        <div className="h-4 w-32 animate-pulse bg-zinc-200/70 dark:bg-zinc-800/70 rounded-md" />
      </td>
      <td className="py-2.5 px-4">
        <div className="h-4 w-24 animate-pulse bg-zinc-200/70 dark:bg-zinc-800/70 rounded-md" />
      </td>
      <td className="py-2.5 px-4">
        <div className="h-5 w-16 mx-auto animate-pulse bg-zinc-200/70 dark:bg-zinc-800/70 rounded-full" />
      </td>
      <td className="py-2.5 px-4">
        <div className="h-6 w-14 mx-auto animate-pulse bg-zinc-200/70 dark:bg-zinc-800/70 rounded-md" />
      </td>
    </tr>
  ));
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{message}</p>;
}

const INPUT_LABEL_CLASS = 'text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block';

export default function AdminPage() {
  const { toast } = useToast();
  const {
    ativosData = [],
    cursosData = [],
    listaCadeias = [],
    territoriosData = [],
    municipiosTerritorios = [],
    tiposAtivos = [],
    tiposCursos = [],
    tiposCadeias = [],
    loadingStats = false,
    filtroSemiarido = false,
    crudDraft,
    crudStats,
    createCrudItem,
    updateCrudItem,
    deleteCrudItem,
    resetCrudDrafts,
  } = useData();

  const [activeEntity, setActiveEntity] = useState('ativos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTerritoryId, setSelectedTerritoryId] = useState('all');
  const [onlyModified, setOnlyModified] = useState(false);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const tableScrollRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Drawer de criacao / edicao
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState(() => getInitialFormValues('ativos'));
  const [formErrors, setFormErrors] = useState({});

  // Confirmacao de exclusao e reset
  const [deletingTarget, setDeletingTarget] = useState(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Reseta filtros e rolagem ao trocar entidade
  useEffect(() => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTerritoryId('all');
    setOnlyModified(false);
    setVisibleCount(BATCH_SIZE);
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0;
    }
    setShowScrollTop(false);
  }, [activeEntity]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0;
    }
    setShowScrollTop(false);
  }, [searchTerm, selectedCategory, selectedTerritoryId, onlyModified]);

  // Lookup de territorios e municipios da Bahia
  const territoryOptions = useMemo(() => {
    return [...territoriosData]
      .map((t) => ({
        id: Number(t.id_territorio),
        name: cleanTerritoryLabel(t.nome_territorio || t.territorio || t.nome || ''),
      }))
      .filter((t) => t.id && t.name)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [territoriosData]);

  const territoryNameById = useMemo(() => {
    const map = new Map();
    territoryOptions.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [territoryOptions]);

  const municipalityLookup = useMemo(() => {
    const byNorm = new Map();
    const names = new Set();
    municipiosTerritorios.forEach((row) => {
      const name = String(row.nome_municipio || '').trim();
      if (!name) return;
      names.add(name);
      byNorm.set(normalize(name), {
        nome_municipio: name,
        id_territorio: row.id_territorio ? Number(row.id_territorio) : null,
        nome_territorio: cleanTerritoryLabel(row.nome_territorio || ''),
      });
    });
    return {
      byNorm,
      options: Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    };
  }, [municipiosTerritorios]);

  // Lista corrente por entidade
  const currentList = useMemo(() => {
    if (activeEntity === 'ativos') return ativosData;
    if (activeEntity === 'cursos') return cursosData;
    return listaCadeias;
  }, [activeEntity, ativosData, cursosData, listaCadeias]);

  // Opcoes de categoria da entidade ativa
  const categoryOptions = useMemo(() => {
    const set = new Set();
    if (activeEntity === 'ativos') {
      tiposAtivos.forEach((t) => t?.nome_tipo && set.add(t.nome_tipo));
      currentList.forEach((a) => (a.tipo || a.nome_tipo) && set.add(a.tipo || a.nome_tipo));
    } else if (activeEntity === 'cursos') {
      tiposCursos.forEach((t) => t?.nome_tipo && set.add(t.nome_tipo));
      currentList.forEach((c) => (c.categoria || c.tipo) && set.add(c.categoria || c.tipo));
    } else {
      tiposCadeias.forEach((t) => t?.nome_tipo && set.add(t.nome_tipo));
      currentList.forEach((c) => (c.tipo || c.nome_tipo) && set.add(c.tipo || c.nome_tipo));
    }
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [activeEntity, currentList, tiposAtivos, tiposCursos, tiposCadeias]);

  // Normalizacao uniforme de linha para exibição na tabela e filtros
  const normalizedRows = useMemo(() => {
    return currentList.map((item) => {
      const id = getEntityItemId(activeEntity, item);
      const label = getEntityItemLabel(activeEntity, item);
      const tid = item.id_territorio ? Number(item.id_territorio) : null;
      const territoryName =
        (tid && territoryNameById.get(tid)) ||
        cleanTerritoryLabel(item.territorio_identidade || item.nome_territorio || item.territorio || '') ||
        'Não identificado';

      if (activeEntity === 'ativos') {
        const hasRnp = getBoolFlag(item.rnp);
        return {
          raw: item,
          id,
          primary: label,
          secondary: item.sigla || item.referencia || '',
          category: item.tipo || item.nome_tipo || 'Outros',
          municipality: item.municipio || 'Bahia',
          territoryId: tid,
          territoryName,
          badgeLabel: hasRnp ? 'Com RNP' : 'Sem RNP',
          badgeClass: hasRnp
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
          crudStatus: item.__crudStatus || null,
        };
      }

      if (activeEntity === 'cursos') {
        const isEad = getBoolFlag(item.ead);
        return {
          raw: item,
          id,
          primary: label,
          secondary: item.sigla
            ? `${item.sigla} · ${item.entidade || ''}`
            : item.entidade || 'IES não informada',
          category: item.categoria || item.tipo || 'Outros',
          municipality: item.municipio || 'Bahia',
          territoryId: tid,
          territoryName,
          badgeLabel: isEad ? 'EAD' : 'Presencial',
          badgeClass: isEad
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
          crudStatus: item.__crudStatus || null,
        };
      }

      const tipo = item.tipo || item.nome_tipo || 'APL';
      const isPotencial = tipo.toLowerCase().includes('potencial');
      const isRegistrada = tipo.toLowerCase().includes('registrada');

      return {
        raw: item,
        id,
        primary: label,
        secondary: item.segmento || item.nome_cadeia || '',
        category: tipo,
        municipality: item.municipio_sede || item.sede || item.nome_municipio || 'Bahia',
        territoryId: tid,
        territoryName,
        badgeLabel: isPotencial ? 'Potencial' : isRegistrada ? 'IG Registrada' : 'APL',
        badgeClass: isPotencial
          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
          : isRegistrada
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
        crudStatus: item.__crudStatus || null,
      };
    });
  }, [currentList, activeEntity, territoryNameById]);

  const filteredRows = useMemo(() => {
    const q = normalize(searchTerm);
    return normalizedRows.filter((row) => {
      if (selectedCategory !== 'all' && row.category !== selectedCategory) return false;
      if (selectedTerritoryId !== 'all' && String(row.territoryId || '') !== selectedTerritoryId) {
        return false;
      }
      if (onlyModified && !row.crudStatus) return false;
      if (!q) return true;
      return (
        normalize(row.primary).includes(q) ||
        normalize(row.secondary).includes(q) ||
        normalize(row.category).includes(q) ||
        normalize(row.municipality).includes(q) ||
        normalize(row.territoryName).includes(q)
      );
    });
  }, [normalizedRows, searchTerm, selectedCategory, selectedTerritoryId, onlyModified]);

  // Rolagem infinita (lotes progressivos dentro do viewport da tabela)
  const visibleRows = useMemo(
    () => filteredRows.slice(0, visibleCount),
    [filteredRows, visibleCount]
  );
  const hasMoreRows = visibleCount < filteredRows.length;

  const loadMoreRows = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredRows.length));
  }, [filteredRows.length]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    const root = tableScrollRef.current;
    if (!sentinel || !root || !hasMoreRows || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreRows();
        }
      },
      { root, rootMargin: '200px 0px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreRows, loadMoreRows, visibleRows.length]);

  const handleTableScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      setShowScrollTop(el.scrollTop > 160);
      if (hasMoreRows && el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        loadMoreRows();
      }
    },
    [hasMoreRows, loadMoreRows]
  );

  const scrollTableToTop = useCallback(() => {
    tableScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // KPIs da entidade ativa
  const municipalityCount = useMemo(() => {
    return new Set(normalizedRows.map((r) => normalize(r.municipality)).filter(Boolean)).size;
  }, [normalizedRows]);

  const territoryCoverage = useMemo(() => {
    return new Set(normalizedRows.map((r) => r.territoryId).filter(Boolean)).size;
  }, [normalizedRows]);

  const entityChangesCount = crudStats?.byEntity?.[activeEntity] || 0;
  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedCategory !== 'all' ||
    selectedTerritoryId !== 'all' ||
    onlyModified;

  const entityTabs = useMemo(
    () => [
      {
        id: 'ativos',
        label: 'Ativos CT&I',
        icon: <Database className="w-3.5 h-3.5" />,
        count: ativosData.length,
      },
      {
        id: 'cursos',
        label: 'Cursos CT&I',
        icon: <GraduationCap className="w-3.5 h-3.5" />,
        count: cursosData.length,
      },
      {
        id: 'cadeias',
        label: 'Cadeias & IGs',
        icon: <GitPullRequest className="w-3.5 h-3.5" />,
        count: listaCadeias.length,
      },
    ],
    [ativosData.length, cursosData.length, listaCadeias.length]
  );

  // Handlers
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTerritoryId('all');
    setOnlyModified(false);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormValues(getInitialFormValues(activeEntity));
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditingId(row.id);
    setFormValues(mapItemToFormValues(activeEntity, row.raw));
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleMunicipalityChange = (fieldKey, value) => {
    const match = municipalityLookup.byNorm.get(normalize(value));
    setFormValues((prev) => {
      const next = { ...prev, [fieldKey]: value };
      if (match && match.id_territorio) {
        next.id_territorio = String(match.id_territorio);
        if (activeEntity === 'cadeias') {
          next.nome_territorio = match.nome_territorio;
        } else {
          next.territorio_identidade = match.nome_territorio;
        }
      }
      return next;
    });
    if (formErrors[fieldKey]) {
      setFormErrors((prev) => ({ ...prev, [fieldKey]: undefined }));
    }
  };

  const handleSave = (e) => {
    e?.preventDefault();
    const { valid, errors } = validateCrudForm(activeEntity, formValues);
    if (!valid) {
      setFormErrors(errors);
      toast({
        title: 'Revise os campos obrigatórios',
        description: 'Preencha corretamente os campos destacados antes de salvar.',
        variant: 'warning',
      });
      return;
    }

    const payload = buildPayloadFromForm(activeEntity, formValues, territoryNameById);
    const label = getEntityItemLabel(activeEntity, payload);

    if (editingId) {
      updateCrudItem(activeEntity, editingId, payload);
      toast({
        title: 'Registro atualizado',
        description: `"${label}" foi atualizado no rascunho local e já reflete no painel.`,
        variant: 'success',
      });
    } else {
      createCrudItem(activeEntity, payload);
      toast({
        title: 'Registro cadastrado',
        description: `"${label}" foi adicionado à base local do painel.`,
        variant: 'success',
      });
    }

    setIsDrawerOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingTarget) return;
    deleteCrudItem(activeEntity, deletingTarget.id, deletingTarget.primary);
    toast({
      title: 'Registro removido',
      description: `"${deletingTarget.primary}" foi removido do rascunho local.`,
      variant: 'success',
    });
    setDeletingTarget(null);
  };

  const handleConfirmReset = () => {
    resetCrudDrafts();
    setIsResetDialogOpen(false);
    setOnlyModified(false);
    toast({
      title: 'Base oficial restaurada',
      description: 'Todas as alterações de rascunho local foram descartadas.',
      variant: 'default',
    });
  };

  const handleExportJson = () => {
    const exportPayload = {
      exportadoEm: new Date().toISOString(),
      entidade: activeEntity,
      totalRegistros: filteredRows.length,
      alteracoesRascunho: crudStats,
      registros: filteredRows.map((r) => r.raw),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secti-${activeEntity}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Exportação concluída',
      description: `${filteredRows.length} registro(s) de ${activeEntity} exportado(s) em JSON.`,
      variant: 'success',
    });
  };

  const columnHeaders = useMemo(() => {
    if (activeEntity === 'ativos') {
      return {
        primary: 'Ativo / Instituição',
        category: 'Tipologia',
        municipality: 'Município',
        territory: 'Território',
        status: 'Conexão RNP',
      };
    }
    if (activeEntity === 'cursos') {
      return {
        primary: 'Curso / IES',
        category: 'Área / Categoria',
        municipality: 'Município',
        territory: 'Território',
        status: 'Modalidade',
      };
    }
    return {
      primary: 'Arranjo / IG',
      category: 'Classificação',
      municipality: 'Município Sede',
      territory: 'Território',
      status: 'Enquadramento',
    };
  }, [activeEntity]);

  const auditLog = crudDraft?.auditLog || [];

  return (
    <main className="flex-1 w-full h-full min-h-0 p-6 lg:p-8 flex flex-col gap-5 overflow-hidden bg-transparent font-sans">
        {/* CABECALHO */}
        <PageHeader
          title="Gestão CRUD · Base CT&I"
          subtitle="Esboço operacional para cadastrar, editar, filtrar e auditar Ativos, Cursos e Cadeias Produtivas em tempo real no painel."
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              {auditLog.length > 0 && (
                <Button
                  variant="ghost"
                  size="md"
                  iconLeft={<History className="w-4 h-4 stroke-[1.75]" />}
                  onClick={() => setIsHistoryOpen(true)}
                >
                  Histórico ({auditLog.length})
                </Button>
              )}

              {crudStats?.total > 0 && (
                <Button
                  variant="secondary"
                  size="md"
                  iconLeft={<RotateCcw className="w-4 h-4 stroke-[1.75]" />}
                  onClick={() => setIsResetDialogOpen(true)}
                >
                  Restaurar base
                </Button>
              )}

              <Button
                variant="secondary"
                size="md"
                iconLeft={<Download className="w-4 h-4 stroke-[1.75]" />}
                onClick={handleExportJson}
                disabled={filteredRows.length === 0}
              >
                Exportar JSON
              </Button>

              <Button
                variant="primary"
                size="md"
                iconLeft={<Plus className="w-4 h-4 stroke-[1.75]" />}
                onClick={handleOpenCreate}
              >
                Novo Registro
              </Button>
            </div>
          }
        />

        {/* SELETOR DE ENTIDADE */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <Tabs
            items={entityTabs}
            value={activeEntity}
            onChange={setActiveEntity}
            isSemiarido={filtroSemiarido}
            layoutId="admin-entity-tabs"
          />

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Alterações locais atualizam o mapa e os módulos instantaneamente (persistência em navegador).
          </p>
        </div>

        {/* KPI CARDS (animacao escalonada + AnimatedNumber igual aos outros modulos) */}
        <motion.div
          key={`kpis-${activeEntity}`}
          variants={staggerContainer(0.04)}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0"
        >
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, idx) => <KpiSkeleton key={idx} />)
          ) : (
            <>
              {[
                {
                  key: 'total',
                  label: 'Total na Entidade',
                  icon: Database,
                  numericValue: currentList.length,
                  suffix: '',
                  hint:
                    entityChangesCount > 0
                      ? `${entityChangesCount} alteração(ões) nesta aba`
                      : 'Registros carregados da base',
                },
                {
                  key: 'filtered',
                  label: 'Exibidos no Filtro',
                  icon: CheckCircle2,
                  numericValue: filteredRows.length,
                  suffix: '',
                  hint: hasActiveFilters ? 'Filtros ativos aplicados' : 'Sem filtros aplicados',
                },
                {
                  key: 'coverage',
                  label: 'Cobertura Territorial',
                  icon: MapPin,
                  numericValue: municipalityCount,
                  suffix: ' munic.',
                  hint: `${territoryCoverage} de ${territoriosData.length || 27} territórios`,
                },
              ].map((kpi) => {
                const KpiIcon = kpi.icon;
                return (
                  <motion.div
                    key={kpi.key}
                    variants={fadeUp}
                    className={cn(
                      'rounded-card border bg-surface p-4 sm:p-5 shadow-card flex flex-col justify-between gap-2 transition-colors duration-200 h-full',
                      filtroSemiarido
                        ? 'border-amber-300/60 dark:border-amber-700/50'
                        : 'border-border/60'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-text-secondary">{kpi.label}</span>
                      <KpiIcon className="w-4 h-4 text-text-muted stroke-[1.75]" />
                    </div>
                    <div className="text-2xl font-semibold tracking-tight tabular-nums text-text-primary">
                      <AnimatedNumber value={kpi.numericValue} />
                      {kpi.suffix}
                    </div>
                    <div className="text-xs text-text-muted tabular-nums">{kpi.hint}</div>
                  </motion.div>
                );
              })}

              <motion.div
                variants={fadeUp}
                className={cn(
                  'rounded-card border bg-surface p-4 sm:p-5 shadow-card flex flex-col justify-between gap-2 transition-colors duration-200 h-full',
                  filtroSemiarido
                    ? 'border-amber-300/60 dark:border-amber-700/50'
                    : 'border-border/60'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-text-secondary">
                    Modo de Persistência
                  </span>
                  <Wifi className="w-4 h-4 text-text-muted stroke-[1.75]" />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      crudStats?.total > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                  />
                  <span className="text-base font-semibold tracking-tight text-text-primary">
                    {crudStats?.total > 0 ? 'Rascunho Local' : 'Leitura Oficial'}
                  </span>
                </div>
                <div className="text-xs text-text-muted tabular-nums">
                  {crudStats?.total > 0
                    ? `+${crudStats.added} novo(s) · ${crudStats.updated} edit. · ${crudStats.deleted} excl.`
                    : 'Supabase (somente leitura) + cache'}
                </div>
              </motion.div>
            </>
          )}
        </motion.div>

        {/* CONTAINER UNIFICADO DA TABELA */}
        <motion.section
          key={`table-${activeEntity}`}
          variants={fadeUp}
          initial="initial"
          animate="animate"
          className={cn(
            'flex-1 min-h-0 rounded-card border bg-surface shadow-card flex flex-col overflow-hidden transition-colors duration-200',
            filtroSemiarido
              ? 'border-amber-300/60 dark:border-amber-700/50'
              : 'border-border/60'
          )}
        >
          {/* TOOLBAR UNIFICADA */}
          <div className="p-4 sm:px-5 border-b border-border/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
                enableShortcut
                containerClassName="sm:max-w-md"
                placeholder="Buscar registro, município... (/)"
              />

              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                containerClassName="w-full sm:w-56 shrink-0"
                aria-label="Filtrar por categoria"
              >
                <option value="all">Todas as categorias</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>

              <Select
                value={selectedTerritoryId}
                onChange={(e) => setSelectedTerritoryId(e.target.value)}
                containerClassName="w-full sm:w-56 shrink-0"
                aria-label="Filtrar por território"
              >
                <option value="all">Todos os territórios</option>
                {territoryOptions.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </Select>

              {entityChangesCount > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlyModified((v) => !v)}
                  className={cn(
                    'h-9 px-3.5 rounded-control text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 dark:focus-visible:ring-zinc-100/20',
                    onlyModified
                      ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30'
                      : 'bg-surface text-text-secondary border-border hover:bg-surface-soft dark:hover:bg-surface-raised'
                  )}
                >
                  Alterados ({entityChangesCount})
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Limpar filtros
                </Button>
              )}
              <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                Mostrando <strong className="text-zinc-900 dark:text-zinc-100">{filteredRows.length}</strong> de{' '}
                {currentList.length}
              </span>
            </div>
          </div>

          {/* CORPO DA TABELA COM CABECALHO UNICO STICKY E ROLAGEM INFINITA */}
          <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
            {showScrollTop && (
              <button
                type="button"
                onClick={scrollTableToTop}
                aria-label="Voltar ao topo da lista"
                title="Voltar ao topo"
                className="absolute bottom-4 right-5 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-200 shadow-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 ease-out active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 dark:focus-visible:ring-zinc-100/20"
              >
                <ArrowUp className="w-4 h-4 stroke-[1.75]" />
              </button>
            )}

            <div
              ref={tableScrollRef}
              onScroll={handleTableScroll}
              className="flex-1 min-h-0 overflow-auto"
            >
              <table className="w-full text-left border-collapse text-sm min-w-[760px]">
                <thead className="sticky top-0 z-10 bg-surface-soft/95 backdrop-blur-xs border-b border-border/60">
                  <tr>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[33%]">
                      {columnHeaders.primary}
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[18%]">
                      {columnHeaders.category}
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[14%]">
                      {columnHeaders.municipality}
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[17%]">
                      {columnHeaders.territory}
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center w-[10%]">
                      {columnHeaders.status}
                    </th>
                    <th className="py-2.5 px-4 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center w-[8%]">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                  {loadingStats ? (
                    <TableSkeletonRows />
                  ) : visibleRows.length > 0 ? (
                    visibleRows.map((row) => (
                    <tr
                      key={row.id || row.primary}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      <td className="py-2.5 px-4 align-top">
                        <div className="min-w-0">
                          <div className="flex items-start gap-2 min-w-0">
                            <span
                              className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2"
                              title={row.primary}
                            >
                              {row.primary}
                            </span>
                            <CrudStatusPill status={row.crudStatus} />
                          </div>
                          {row.secondary && (
                            <p
                              className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5"
                              title={row.secondary}
                            >
                              {row.secondary}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-300 align-top">
                        <span className="line-clamp-2" title={row.category}>
                          {row.category}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-300 align-top">
                        <span className="line-clamp-2" title={row.municipality}>
                          {row.municipality}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-zinc-500 dark:text-zinc-400 align-top">
                        <span className="line-clamp-2" title={row.territoryName}>
                          {row.territoryName}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
                            row.badgeClass
                          )}
                        >
                          {row.badgeLabel}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          <IconButton
                            size="sm"
                            variant="ghost"
                            aria-label={`Editar ${row.primary}`}
                            title="Editar registro"
                            icon={<Pencil className="w-4 h-4 stroke-[1.75] text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />}
                            onClick={() => handleOpenEdit(row)}
                          />
                          <IconButton
                            size="sm"
                            variant="ghost"
                            aria-label={`Excluir ${row.primary}`}
                            title="Excluir registro"
                            icon={<Trash2 className="w-4 h-4 stroke-[1.75] text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400" />}
                            onClick={() => setDeletingTarget(row)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6">
                      <EmptyState
                        title="Nenhum resultado encontrado"
                        description="Nenhum registro corresponde aos critérios de busca ou filtros aplicados."
                        action={
                          hasActiveFilters ? (
                            <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                              Limpar filtros
                            </Button>
                          ) : (
                            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                              Cadastrar primeiro registro
                            </Button>
                          )
                        }
                      />
                    </td>
                  </tr>
                )}
                </tbody>
              </table>

              {/* SENTINELA DE ROLAGEM INFINITA */}
              {!loadingStats && hasMoreRows && (
                <div
                  ref={loadMoreRef}
                  className="py-4 px-4 flex items-center justify-center gap-2 border-t border-zinc-200/60 dark:border-zinc-800/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                    Carregando mais registros ({visibleRows.length} de {filteredRows.length})...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RODAPE DE STATUS DA ROLAGEM INFINITA */}
          {!loadingStats && filteredRows.length > 0 && (
            <div className="px-4 sm:px-5 py-2.5 border-t border-border/60 flex items-center justify-between gap-3 bg-surface-soft/60 shrink-0">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                Exibindo <strong className="text-zinc-900 dark:text-zinc-100">{visibleRows.length}</strong> de{' '}
                {filteredRows.length} registro(s)
              </span>

              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {hasMoreRows ? 'Role para carregar mais' : 'Lista completa carregada'}
              </span>
            </div>
          )}
        </motion.section>

        {/* AUTOCOMPLETE DE MUNICIPIOS DA BAHIA */}
        <datalist id="ba-municipios-list">
          {municipalityLookup.options.map((mun) => (
            <option key={mun} value={mun} />
          ))}
        </datalist>

        {/* DRAWER DE CRIACAO E EDICAO */}
        <Drawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={
            editingId
              ? 'Editar Registro'
              : activeEntity === 'ativos'
                ? 'Novo Ativo de CT&I'
                : activeEntity === 'cursos'
                  ? 'Novo Curso CT&I'
                  : 'Nova Cadeia Produtiva / IG'
          }
          subtitle={
            editingId
              ? 'As alterações serão aplicadas imediatamente no rascunho local do painel.'
              : 'Preencha os campos abaixo para incluir um novo registro territorial.'
          }
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setIsDrawerOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="md" onClick={handleSave}>
                {editingId ? 'Salvar Alterações' : 'Cadastrar Registro'}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSave} className="space-y-4">
            {activeEntity === 'ativos' && (
              <>
                <div>
                  <label htmlFor="ativo-nome" className={INPUT_LABEL_CLASS}>
                    Nome do Ativo <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    id="ativo-nome"
                    value={formValues.nome_ativo}
                    error={Boolean(formErrors.nome_ativo)}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, nome_ativo: e.target.value }));
                      if (formErrors.nome_ativo) setFormErrors((p) => ({ ...p, nome_ativo: undefined }));
                    }}
                    placeholder="Ex: Parque Tecnológico da Bahia"
                  />
                  <FieldError message={formErrors.nome_ativo} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ativo-sigla" className={INPUT_LABEL_CLASS}>
                      Sigla
                    </label>
                    <Input
                      id="ativo-sigla"
                      value={formValues.sigla}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, sigla: e.target.value }))}
                      placeholder="Ex: PTB"
                    />
                  </div>

                  <div>
                    <label htmlFor="ativo-tipo" className={INPUT_LABEL_CLASS}>
                      Tipologia <span className="text-rose-600">*</span>
                    </label>
                    <Select
                      id="ativo-tipo"
                      value={formValues.tipo}
                      error={Boolean(formErrors.tipo)}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, tipo: e.target.value }))}
                    >
                      {Array.from(new Set([...DEFAULT_ATIVO_TYPES, ...categoryOptions])).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                    <FieldError message={formErrors.tipo} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ativo-municipio" className={INPUT_LABEL_CLASS}>
                      Município <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      id="ativo-municipio"
                      list="ba-municipios-list"
                      value={formValues.municipio}
                      error={Boolean(formErrors.municipio)}
                      onChange={(e) => handleMunicipalityChange('municipio', e.target.value)}
                      placeholder="Ex: Salvador"
                    />
                    <FieldError message={formErrors.municipio} />
                  </div>

                  <div>
                    <label htmlFor="ativo-territorio" className={INPUT_LABEL_CLASS}>
                      Território de Identidade
                    </label>
                    <Select
                      id="ativo-territorio"
                      value={formValues.id_territorio}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          id_territorio: e.target.value,
                          territorio_identidade:
                            territoryNameById.get(Number(e.target.value)) || '',
                        }))
                      }
                    >
                      <option value="">Selecionar território...</option>
                      {territoryOptions.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <label htmlFor="ativo-ref" className={INPUT_LABEL_CLASS}>
                    Referência / Fonte
                  </label>
                  <Input
                    id="ativo-ref"
                    value={formValues.referencia}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, referencia: e.target.value }))}
                    placeholder="Ex: SECTI / INEP Censo Superior"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ativo-lat" className={INPUT_LABEL_CLASS}>
                      Latitude
                    </label>
                    <Input
                      id="ativo-lat"
                      value={formValues.latitude}
                      error={Boolean(formErrors.latitude)}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, latitude: e.target.value }))}
                      placeholder="-12.9714"
                      className="tabular-nums"
                    />
                    <FieldError message={formErrors.latitude} />
                  </div>
                  <div>
                    <label htmlFor="ativo-lng" className={INPUT_LABEL_CLASS}>
                      Longitude
                    </label>
                    <Input
                      id="ativo-lng"
                      value={formValues.longitude}
                      error={Boolean(formErrors.longitude)}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, longitude: e.target.value }))}
                      placeholder="-38.5014"
                      className="tabular-nums"
                    />
                    <FieldError message={formErrors.longitude} />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(formValues.rnp)}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, rnp: e.target.checked }))}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Conectado à Rede Nacional de Ensino e Pesquisa (RNP)
                  </span>
                </label>
              </>
            )}

            {activeEntity === 'cursos' && (
              <>
                <div>
                  <label htmlFor="curso-nome" className={INPUT_LABEL_CLASS}>
                    Nome do Curso <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    id="curso-nome"
                    value={formValues.curso}
                    error={Boolean(formErrors.curso)}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, curso: e.target.value }));
                      if (formErrors.curso) setFormErrors((p) => ({ ...p, curso: undefined }));
                    }}
                    placeholder="Ex: Ciência da Computação"
                  />
                  <FieldError message={formErrors.curso} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label htmlFor="curso-entidade" className={INPUT_LABEL_CLASS}>
                      Instituição (IES) <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      id="curso-entidade"
                      value={formValues.entidade}
                      error={Boolean(formErrors.entidade)}
                      onChange={(e) => {
                        setFormValues((prev) => ({ ...prev, entidade: e.target.value }));
                        if (formErrors.entidade) setFormErrors((p) => ({ ...p, entidade: undefined }));
                      }}
                      placeholder="Ex: Universidade Federal da Bahia"
                    />
                    <FieldError message={formErrors.entidade} />
                  </div>

                  <div>
                    <label htmlFor="curso-sigla" className={INPUT_LABEL_CLASS}>
                      Sigla IES
                    </label>
                    <Input
                      id="curso-sigla"
                      value={formValues.sigla}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, sigla: e.target.value }))}
                      placeholder="UFBA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="curso-categoria" className={INPUT_LABEL_CLASS}>
                      Área / Categoria <span className="text-rose-600">*</span>
                    </label>
                    <Select
                      id="curso-categoria"
                      value={formValues.categoria}
                      error={Boolean(formErrors.categoria)}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, categoria: e.target.value }))
                      }
                    >
                      {Array.from(new Set([...DEFAULT_CURSO_CATEGORIES, ...categoryOptions])).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                    <FieldError message={formErrors.categoria} />
                  </div>

                  <div>
                    <label htmlFor="curso-modalidade" className={INPUT_LABEL_CLASS}>
                      Modalidade
                    </label>
                    <Select
                      id="curso-modalidade"
                      value={formValues.modalidade}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          modalidade: e.target.value,
                          ead: e.target.value === 'EAD',
                        }))
                      }
                    >
                      <option value="Presencial">Presencial</option>
                      <option value="EAD">EAD</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="curso-municipio" className={INPUT_LABEL_CLASS}>
                      Município <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      id="curso-municipio"
                      list="ba-municipios-list"
                      value={formValues.municipio}
                      error={Boolean(formErrors.municipio)}
                      onChange={(e) => handleMunicipalityChange('municipio', e.target.value)}
                      placeholder="Ex: Feira de Santana"
                    />
                    <FieldError message={formErrors.municipio} />
                  </div>

                  <div>
                    <label htmlFor="curso-territorio" className={INPUT_LABEL_CLASS}>
                      Território de Identidade
                    </label>
                    <Select
                      id="curso-territorio"
                      value={formValues.id_territorio}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          id_territorio: e.target.value,
                          territorio_identidade:
                            territoryNameById.get(Number(e.target.value)) || '',
                        }))
                      }
                    >
                      <option value="">Selecionar território...</option>
                      {territoryOptions.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </>
            )}

            {activeEntity === 'cadeias' && (
              <>
                <div>
                  <label htmlFor="cadeia-entidade" className={INPUT_LABEL_CLASS}>
                    Nome do Arranjo / Indicação Geográfica <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    id="cadeia-entidade"
                    value={formValues.entidade}
                    error={Boolean(formErrors.entidade)}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, entidade: e.target.value }));
                      if (formErrors.entidade) setFormErrors((p) => ({ ...p, entidade: undefined }));
                    }}
                    placeholder="Ex: Cacau do Sul da Bahia"
                  />
                  <FieldError message={formErrors.entidade} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cadeia-tipo" className={INPUT_LABEL_CLASS}>
                      Tipo <span className="text-rose-600">*</span>
                    </label>
                    <Select
                      id="cadeia-tipo"
                      value={formValues.tipo}
                      error={Boolean(formErrors.tipo)}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, tipo: e.target.value }))}
                    >
                      {Array.from(new Set([...DEFAULT_CADEIA_TYPES, ...categoryOptions])).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                    <FieldError message={formErrors.tipo} />
                  </div>

                  <div>
                    <label htmlFor="cadeia-segmento" className={INPUT_LABEL_CLASS}>
                      Segmento / Produto
                    </label>
                    <Input
                      id="cadeia-segmento"
                      value={formValues.segmento}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, segmento: e.target.value }))}
                      placeholder="Ex: Cacauicultura / Fruticultura"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cadeia-municipio" className={INPUT_LABEL_CLASS}>
                      Município Sede <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      id="cadeia-municipio"
                      list="ba-municipios-list"
                      value={formValues.municipio_sede}
                      error={Boolean(formErrors.municipio_sede)}
                      onChange={(e) => handleMunicipalityChange('municipio_sede', e.target.value)}
                      placeholder="Ex: Ilhéus"
                    />
                    <FieldError message={formErrors.municipio_sede} />
                  </div>

                  <div>
                    <label htmlFor="cadeia-territorio" className={INPUT_LABEL_CLASS}>
                      Território de Identidade
                    </label>
                    <Select
                      id="cadeia-territorio"
                      value={formValues.id_territorio}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          id_territorio: e.target.value,
                          nome_territorio: territoryNameById.get(Number(e.target.value)) || '',
                        }))
                      }
                    >
                      <option value="">Selecionar território...</option>
                      {territoryOptions.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <label htmlFor="cadeia-fonte" className={INPUT_LABEL_CLASS}>
                    Fonte / URL de Referência
                  </label>
                  <Input
                    id="cadeia-fonte"
                    value={formValues.fonte}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, fonte: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label htmlFor="cadeia-ref" className={INPUT_LABEL_CLASS}>
                    Nota Técnica / Texto de Referência
                  </label>
                  <textarea
                    id="cadeia-ref"
                    rows={3}
                    value={formValues.texto_referencia}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, texto_referencia: e.target.value }))
                    }
                    placeholder="Resumo técnico ou justificativa de potencial..."
                    className="w-full rounded-subcard border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </>
            )}
          </form>
        </Drawer>

        {/* DRAWER DE HISTORICO DE ALTERACOES */}
        <Drawer
          open={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          title="Histórico de Alterações (Rascunho)"
          subtitle="Operações locais registradas nesta sessão e persistidas no navegador."
          footer={
            <Button variant="secondary" size="md" onClick={() => setIsHistoryOpen(false)}>
              Fechar
            </Button>
          }
        >
          {auditLog.length > 0 ? (
            <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
              {auditLog.map((entry) => {
                const actionLabel =
                  entry.action === 'create'
                    ? 'Criado'
                    : entry.action === 'update'
                      ? 'Editado'
                      : 'Excluído';
                const actionVariant =
                  entry.action === 'create'
                    ? 'success'
                    : entry.action === 'update'
                      ? 'warning'
                      : 'danger';

                return (
                  <div key={entry.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={actionVariant}>{actionLabel}</Badge>
                        <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          {entry.entity}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {entry.label}
                      </p>
                    </div>
                    <time className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
                      {new Date(entry.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma operação registrada"
              description="Crie, edite ou remova registros para visualizar o histórico local."
            />
          )}
        </Drawer>

        {/* DIALOG DE CONFIRMACAO DE EXCLUSAO */}
        <Dialog
          open={Boolean(deletingTarget)}
          onClose={() => setDeletingTarget(null)}
          title="Confirmar exclusão"
          description="O registro será removido da visualização do painel neste rascunho local."
          size="sm"
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setDeletingTarget(null)}>
                Cancelar
              </Button>
              <Button variant="danger" size="md" onClick={handleConfirmDelete}>
                Excluir registro
              </Button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Deseja remover <strong className="text-zinc-900 dark:text-zinc-100">{deletingTarget?.primary}</strong>{' '}
              ({deletingTarget?.municipality})? Você pode restaurar a base oficial a qualquer momento.
            </p>
          </div>
        </Dialog>

        {/* DIALOG DE CONFIRMACAO DE RESTAURACAO */}
        <Dialog
          open={isResetDialogOpen}
          onClose={() => setIsResetDialogOpen(false)}
          title="Restaurar base oficial"
          description="Esta ação descarta todas as alterações locais do rascunho CRUD."
          size="sm"
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setIsResetDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="danger" size="md" onClick={handleConfirmReset}>
                Restaurar base
              </Button>
            </>
          }
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Existem <strong className="tabular-nums text-zinc-900 dark:text-zinc-100">{crudStats?.total || 0}</strong>{' '}
            alteração(ões) pendente(s) no rascunho local. Deseja reverter todos os módulos para os dados originais?
          </p>
        </Dialog>
    </main>
  );
}
