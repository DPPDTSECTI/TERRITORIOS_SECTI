import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  Check,
  Copy,
  Layers,
  X,
  ArrowUpRight,
  GraduationCap,
  Building2,
  Milestone,
  MapPin,
  Compass
} from 'lucide-react';
import {
  REFERENCIAS_DATABASE,
  CATEGORIAS_REFERENCIAS,
  SUBCATEGORIAS_REFERENCIAS,
  FONTES_METADADOS
} from '../data/referenciasDB';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Chip';

const ICONES_CATEGORIA = {
  todas: Layers,
  cadeias: Milestone,
  inovacao: Building2,
  educacao: GraduationCap,
  territorio: MapPin
};

export default function FontesReferenciasSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedSubcategory, setSelectedSubcategory] = useState('todas_sub');
  const [copiedId, setCopiedId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);

  // Subcategorias visíveis com base na categoria principal selecionada
  const subcategoriasDisponiveis = useMemo(() => {
    if (selectedCategory === 'todas') {
      return SUBCATEGORIAS_REFERENCIAS;
    }
    return [
      {
        id: 'todas_sub',
        categoriaId: selectedCategory,
        label: 'Todas as Subcategorias',
        count: REFERENCIAS_DATABASE.filter((r) => r.categoriaId === selectedCategory).length
      },
      ...SUBCATEGORIAS_REFERENCIAS.filter(
        (s) => s.categoriaId === selectedCategory && s.id !== 'todas_sub'
      )
    ];
  }, [selectedCategory]);

  // Filtragem combinada por busca textual, categoria e subcategoria
  const filteredReferences = useMemo(() => {
    return REFERENCIAS_DATABASE.filter((ref) => {
      // Filtro por Categoria Principal
      if (selectedCategory !== 'todas' && ref.categoriaId !== selectedCategory) {
        return false;
      }

      // Filtro por Subcategoria
      if (selectedSubcategory !== 'todas_sub' && ref.subcategoriaId !== selectedSubcategory) {
        return false;
      }

      // Filtro por Termo de Busca
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const matchTitle = ref.titulo?.toLowerCase().includes(term);
      const matchAuthor = ref.autorOuOrgao?.toLowerCase().includes(term);
      const matchText = ref.texto?.toLowerCase().includes(term);
      const matchPainel = ref.localizacaoPainel?.toLowerCase().includes(term);
      const matchSubcat = ref.subcategoriaNome?.toLowerCase().includes(term);
      const matchCat = ref.categoriaNome?.toLowerCase().includes(term);
      const matchTipo = ref.tipoFonte?.toLowerCase().includes(term);
      const matchId = String(ref.id).toLowerCase().includes(term);

      return (
        matchTitle ||
        matchAuthor ||
        matchText ||
        matchPainel ||
        matchSubcat ||
        matchCat ||
        matchTipo ||
        matchId
      );
    });
  }, [searchTerm, selectedCategory, selectedSubcategory]);

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setSelectedSubcategory('todas_sub');
    setVisibleCount(12);
  };

  const handleCopyCitation = (ref) => {
    const citation = `${ref.autorOuOrgao ? ref.autorOuOrgao + '. ' : ''}${ref.titulo}. ${ref.texto ? ref.texto + ' ' : ''}${ref.url ? 'Disponível em: ' + ref.url : ''}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(ref.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('todas');
    setSelectedSubcategory('todas_sub');
    setVisibleCount(12);
  };

  return (
    <section id="fontes-referencias" className="flex flex-col gap-8 scroll-mt-8">
      {/* TÍTULO DA SEÇÃO */}
      <div className="flex flex-col gap-1.5 mb-2">
        <span className="text-micro font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Metodologia & Transparência
        </span>
        <h2 className="text-headline font-bold tracking-tight text-text-primary">
          Fontes Oficiais & Referências Metodológicas
        </h2>
        <p className="text-body text-text-secondary font-normal leading-relaxed max-w-4xl">
          Mapeamento transparente e categorizado de todas as bases governamentais, censos nacionais, diagnósticos técnicos do <strong>SEBRAE</strong> e publicações científicas que alimentam os indicadores territoriais da plataforma.
        </p>
      </div>

      {/* PAINEL DE GOVERNANÇA E RASTREABILIDADE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="text-headline font-bold text-text-primary tracking-tight tnum">
            {FONTES_METADADOS.totalReferencias}
          </div>
          <div className="text-body-sm text-text-primary font-semibold mt-1">Fontes Auditadas</div>
          <p className="text-caption text-text-muted mt-0.5">Bases oficiais e estudos</p>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="text-headline font-bold text-text-primary tracking-tight tnum">
            {FONTES_METADADOS.totalCategorias}
          </div>
          <div className="text-body-sm text-text-primary font-semibold mt-1">Grandes Eixos</div>
          <p className="text-caption text-text-muted mt-0.5">Cadeias, Inovação, Ensino e Território</p>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="text-headline font-bold text-text-primary tracking-tight tnum">
            {FONTES_METADADOS.totalSubcategorias}
          </div>
          <div className="text-body-sm text-text-primary font-semibold mt-1">Subcategorias</div>
          <p className="text-caption text-text-muted mt-0.5">IGs, APLs, RNP e IES</p>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="text-headline font-bold text-text-primary tracking-tight tnum">
            417
          </div>
          <div className="text-body-sm text-text-primary font-semibold mt-1">Municípios Cobertos</div>
          <p className="text-caption text-text-muted mt-0.5">27 Territórios de Identidade</p>
        </Card>
      </div>

      {/* CONTROLES DE FILTRO: CATEGORIAS, SUBCATEGORIAS E BUSCA */}
      <Card className="p-5 sm:p-6 flex flex-col gap-5">
        {/* Barra de Busca Textual */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleCount(12);
            }}
            placeholder="Buscar por produto (cacau, cerâmica, café...), órgão (INEP, RNP, SEBRAE), município ou local no painel..."
            className="w-full pl-10 pr-10 py-2.5 rounded-control border border-border bg-surface-soft text-text-primary placeholder:text-text-muted text-body-sm focus:bg-surface focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary cursor-pointer"
              title="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nível 1: Pílulas de Categorias Principais */}
        <div>
          <span className="text-micro font-bold uppercase tracking-wider text-text-muted block mb-2">
            Categorias Principais:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIAS_REFERENCIAS.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const IconComp = ICONES_CATEGORIA[cat.id] || Layers;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-control text-caption font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-surface-soft text-text-secondary border border-border hover:bg-surface hover:text-text-primary'
                  }`}
                >
                  <IconComp size={14} className={isSelected ? 'text-white' : 'text-primary-600 dark:text-primary-400'} />
                  <span>{cat.label}</span>
                  <span
                    className={`text-micro px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-primary-700 text-white' : 'bg-surface border border-border text-text-secondary'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nível 2: Pílulas de Subcategorias (Contextuais ou Todas) */}
        {subcategoriasDisponiveis.length > 1 && (
          <div className="pt-3 border-t border-border">
            <span className="text-micro font-bold uppercase tracking-wider text-text-muted block mb-2">
              Subcategorias:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {subcategoriasDisponiveis.map((sub) => {
                const isSelected = selectedSubcategory === sub.id;

                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubcategory(sub.id);
                      setVisibleCount(12);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-caption font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-900 text-white shadow-xs font-bold border border-primary-800'
                        : 'bg-surface-soft text-text-secondary border border-border hover:bg-surface hover:text-text-primary'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span
                      className={`text-micro px-1.5 py-0.2 rounded-full font-semibold ${
                        isSelected ? 'bg-primary-950 text-white' : 'bg-surface border border-border text-text-muted'
                      }`}
                    >
                      {sub.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumo dos resultados & Ação de Limpeza */}
        <div className="flex items-center justify-between text-caption text-text-muted pt-1 border-t border-border">
          <span>
            Exibindo <strong>{Math.min(visibleCount, filteredReferences.length)}</strong> de{' '}
            <strong>{filteredReferences.length}</strong> referências catalogadas
          </span>
          {(searchTerm || selectedCategory !== 'todas' || selectedSubcategory !== 'todas_sub') && (
            <button
              onClick={handleClearFilters}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <X size={12} /> Limpar todos os filtros
            </button>
          )}
        </div>
      </Card>

      {/* GRID DE CARDS DE REFERÊNCIAS */}
      {filteredReferences.length === 0 ? (
        <Card className="p-12 text-center border-dashed flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-control bg-surface-soft text-text-muted flex items-center justify-center border border-border">
            <Search size={22} />
          </div>
          <h4 className="text-body font-bold text-text-primary">Nenhuma referência encontrada</h4>
          <p className="text-caption text-text-muted max-w-md">
            Não encontramos registros com os filtros atuais. Tente buscar por outros termos ou selecione uma categoria mais ampla.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearFilters}
            className="mt-2"
          >
            Restaurar todas as fontes
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReferences.slice(0, visibleCount).map((ref) => {
            const isCopied = copiedId === ref.id;

            return (
              <Card
                key={String(ref.id)}
                variant="interactive"
                className="p-5 sm:p-6 flex flex-col justify-between group"
              >
                <div>
                  {/* Topo do Card: Categoria, Subcategoria e Botão Copiar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="primary" size="sm">
                        {ref.categoriaNome}
                      </Badge>
                      <Badge variant="warning" size="sm">
                        {ref.subcategoriaNome}
                      </Badge>
                    </div>

                    <button
                      onClick={() => handleCopyCitation(ref)}
                      title="Copiar citação para ABNT/trabalhos"
                      className="p-1.5 rounded-control text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors cursor-pointer shrink-0 border border-transparent hover:border-border"
                      aria-label="Copiar citação ABNT"
                    >
                      {isCopied ? (
                        <span className="inline-flex items-center gap-1 text-micro font-bold text-success-600">
                          <Check size={14} /> Copiado!
                        </span>
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                  </div>

                  {/* Título da Referência */}
                  <h3 className="text-title font-bold text-text-primary tracking-tight mb-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {ref.titulo}
                  </h3>

                  {/* Órgão ou Autor */}
                  {ref.autorOuOrgao && (
                    <div className="inline-flex items-center gap-1.5 text-caption font-semibold text-text-secondary bg-surface-soft border border-border px-2.5 py-1 rounded-control mb-3">
                      <Building2 size={13} className="text-primary-600 dark:text-primary-400 shrink-0" />
                      <span>{ref.autorOuOrgao}</span>
                    </div>
                  )}

                  {/* Texto Descritivo */}
                  {ref.texto && (
                    <p className="text-body-sm text-text-secondary leading-relaxed font-normal mb-4">
                      {ref.texto}
                    </p>
                  )}
                </div>

                {/* Bloco Inferior: Localização no Painel + Botão de Acesso */}
                <div className="pt-3 border-t border-border flex flex-col gap-3 mt-2">
                  {/* LOCALIZAÇÃO NO PAINEL SECTI */}
                  <div className="p-3 rounded-control bg-surface-soft border border-border/80 flex items-start gap-2.5 text-caption">
                    <Compass size={16} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <span className="font-bold text-text-primary block text-micro uppercase tracking-wider">
                        Onde encontrar no painel:
                      </span>
                      <span className="text-text-secondary font-medium text-caption block mt-0.5 leading-relaxed">
                        {ref.localizacaoPainel}
                      </span>
                    </div>
                  </div>

                  {/* Link Externo Oficial */}
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-control bg-surface-soft hover:bg-surface text-text-secondary hover:text-text-primary border border-border text-caption font-semibold transition-colors cursor-pointer group/btn"
                    >
                      <span className="truncate pr-2">Acessar fonte / publicação oficial</span>
                      <ExternalLink size={14} className="shrink-0 transition-transform group-hover/btn:translate-x-0.5 text-primary-600 dark:text-primary-400" />
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* BOTÃO CARREGAR MAIS */}
      {filteredReferences.length > visibleCount && (
        <div className="flex justify-center pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => setVisibleCount((prev) => prev + 12)}
          >
            Carregar mais fontes (+{Math.min(12, filteredReferences.length - visibleCount)})
          </Button>
        </div>
      )}
    </section>
  );
}
