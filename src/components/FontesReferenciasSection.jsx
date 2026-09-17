import React, { useState, useMemo } from 'react';
import {
  Database, Search, ExternalLink, ShieldCheck, Check, Copy,
  BookOpen, Layers, Filter, X, ArrowUpRight, Award,
  GraduationCap, Wifi, Building2, Milestone, FileText, CheckCircle2,
  MapPin, Compass, Lightbulb, FolderTree, Sparkles
} from 'lucide-react';
import {
  REFERENCIAS_DATABASE,
  CATEGORIAS_REFERENCIAS,
  SUBCATEGORIAS_REFERENCIAS,
  FONTES_METADADOS
} from '../data/referenciasDB';

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
        count: REFERENCIAS_DATABASE.filter(r => r.categoriaId === selectedCategory).length
      },
      ...SUBCATEGORIAS_REFERENCIAS.filter(s => s.categoriaId === selectedCategory && s.id !== 'todas_sub')
    ];
  }, [selectedCategory]);

  // Filtragem combinada por busca textual, categoria e subcategoria
  const filteredReferences = useMemo(() => {
    return REFERENCIAS_DATABASE.filter(ref => {
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

      return matchTitle || matchAuthor || matchText || matchPainel || matchSubcat || matchCat || matchTipo || matchId;
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
    <section id="fontes-referencias" className="flex flex-col gap-8 scroll-mt-6">
      {/* TÍTULO DA SEÇÃO */}
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="font-bold tracking-tight text-xl sm:text-2xl text-text-primary">
          Fontes Oficiais & Referências Metodológicas
        </h2>
        <p className="text-sm text-text-secondary font-normal leading-relaxed max-w-4xl">
          Mapeamento transparente e categorizado de todas as bases governamentais, censos nacionais, diagnósticos técnicos do <strong>SEBRAE</strong> e publicações científicas que alimentam os indicadores territoriais da plataforma.
        </p>
      </div>

      {/* PAINEL DE GOVERNANÇA E RASTREABILIDADE (MINIMALISTA) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="text-2xl sm:text-[26px] font-bold text-text-primary tracking-tight tabular-nums">
            {FONTES_METADADOS.totalReferencias}
          </div>
          <div className="text-xs text-text-primary font-semibold mt-1">Fontes Auditadas</div>
          <p className="text-[11px] text-text-muted mt-0.5">Bases oficiais e estudos</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="text-2xl sm:text-[26px] font-bold text-text-primary tracking-tight tabular-nums">
            {FONTES_METADADOS.totalCategorias}
          </div>
          <div className="text-xs text-text-primary font-semibold mt-1">Grandes Eixos</div>
          <p className="text-[11px] text-text-muted mt-0.5">Cadeias, Inovação, Ensino e Território</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="text-2xl sm:text-[26px] font-bold text-text-primary tracking-tight tabular-nums">
            {FONTES_METADADOS.totalSubcategorias}
          </div>
          <div className="text-xs text-text-primary font-semibold mt-1">Subcategorias</div>
          <p className="text-[11px] text-text-muted mt-0.5">IGs, APLs, RNP e IES</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="text-2xl sm:text-[26px] font-bold text-text-primary tracking-tight tabular-nums">
            417
          </div>
          <div className="text-xs text-text-primary font-semibold mt-1">Municípios Cobertos</div>
          <p className="text-[11px] text-text-muted mt-0.5">27 Territórios de Identidade</p>
        </div>
      </div>

      {/* CONTROLES DE FILTRO: CATEGORIAS, SUBCATEGORIAS E BUSCA */}
      <div className="bg-surface rounded-3xl border border-border p-5 sm:p-7 shadow-xs flex flex-col gap-5">
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
            className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border bg-surface-soft text-text-primary placeholder:text-text-muted text-sm focus:bg-surface focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-2">
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
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-700 text-white shadow-xs'
                      : 'bg-surface-soft text-text-secondary border border-border hover:bg-surface hover:text-text-primary'
                  }`}
                >
                  <IconComp size={14} className={isSelected ? 'text-white' : 'text-primary-600 dark:text-primary-400'} />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-primary-800 text-white' : 'bg-surface border border-border text-text-secondary'
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-2">
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
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-900 text-white shadow-xs font-bold border border-primary-800'
                        : 'bg-surface-soft text-text-secondary border border-border hover:bg-surface hover:text-text-primary'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
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
        <div className="flex items-center justify-between text-xs text-text-muted pt-1 border-t border-border">
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
      </div>

      {/* GRID DE CARDS DE REFERÊNCIAS */}
      {filteredReferences.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-3xl border border-dashed border-border flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-soft text-text-muted flex items-center justify-center border border-border">
            <Search size={22} />
          </div>
          <h4 className="text-base font-bold text-text-primary">Nenhuma referência encontrada</h4>
          <p className="text-xs sm:text-sm text-text-muted max-w-md">
            Não encontramos registros com os filtros atuais. Tente buscar por outros termos ou selecione uma categoria mais ampla.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-2 px-4 py-2 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-700/50 text-xs font-bold hover:bg-primary-200 dark:hover:bg-primary-800/60 transition-colors cursor-pointer"
          >
            Restaurar todas as fontes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReferences.slice(0, visibleCount).map((ref) => {
            const isCopied = copiedId === ref.id;

            return (
              <div
                key={String(ref.id)}
                className="bg-surface rounded-3xl border border-border p-6 shadow-xs hover:shadow-card hover:border-border-strong transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Topo do Card: Categoria, Subcategoria e Tipo */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300 border border-primary-200/60 dark:border-primary-700/50">
                        {ref.categoriaNome}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25">
                        {ref.subcategoriaNome}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCitation(ref)}
                      title="Copiar citação para ABNT/trabalhos"
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors cursor-pointer shrink-0 border border-transparent hover:border-border"
                    >
                      {isCopied ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                          <Check size={14} /> Copiado!
                        </span>
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                  </div>

                  {/* Título da Referência */}
                  <h3 className="text-base sm:text-lg font-bold text-text-primary tracking-tight mb-1.5 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {ref.titulo}
                  </h3>

                  {/* Órgão ou Autor */}
                  {ref.autorOuOrgao && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary bg-surface-soft border border-border px-2.5 py-1 rounded-lg mb-3">
                      <Building2 size={13} className="text-primary-600 dark:text-primary-400 shrink-0" />
                      <span>{ref.autorOuOrgao}</span>
                    </div>
                  )}

                  {/* Texto Descritivo */}
                  {ref.texto && (
                    <p className="text-xs sm:text-[13px] text-text-secondary leading-relaxed font-normal mb-4">
                      {ref.texto}
                    </p>
                  )}
                </div>

                {/* Bloco Inferior: Localização no Painel + Botão de Acesso */}
                <div className="pt-3 border-t border-border flex flex-col gap-3 mt-2">
                  {/* LOCALIZAÇÃO NO PAINEL SECTI */}
                  <div className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-950/40 border border-primary-200/50 dark:border-primary-800/40 flex items-start gap-2.5 text-xs">
                    <Compass size={16} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <span className="font-bold text-primary-800 dark:text-primary-300 block text-[11px] uppercase tracking-wider">
                        Onde encontrar no painel:
                      </span>
                      <span className="text-text-secondary font-medium text-xs block mt-0.5 leading-relaxed">
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
                      className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-surface-soft hover:bg-surface text-text-secondary hover:text-text-primary border border-border text-xs font-semibold transition-colors cursor-pointer group/btn"
                    >
                      <span className="truncate pr-2">Acessar fonte / publicação oficial</span>
                      <ArrowUpRight size={14} className="shrink-0 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 text-primary-600 dark:text-primary-400" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOTÃO CARREGAR MAIS */}
      {filteredReferences.length > visibleCount && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setVisibleCount(prev => prev + 12)}
            className="px-6 py-2.5 rounded-2xl bg-primary-800 hover:bg-primary-900 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Carregar mais fontes (+{Math.min(12, filteredReferences.length - visibleCount)})</span>
          </button>
        </div>
      )}
    </section>
  );
}
