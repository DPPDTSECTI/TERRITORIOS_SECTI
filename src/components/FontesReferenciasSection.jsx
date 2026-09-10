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
        <h2 className="font-bold tracking-tight text-xl sm:text-2xl text-neutral-900">
          Fontes Oficiais & Referências Metodológicas
        </h2>
        <p className="text-sm text-neutral-700 font-normal leading-relaxed max-w-4xl">
          Mapeamento transparente e categorizado de todas as bases governamentais, censos nacionais, diagnósticos técnicos do <strong>SEBRAE</strong> e publicações científicas que alimentam os indicadores territoriais da plataforma.
        </p>
      </div>

      {/* PAINEL DE GOVERNANÇA E RASTREABILIDADE (MINIMALISTA) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
          <div className="text-2xl sm:text-[26px] font-bold text-neutral-900 tracking-tight tabular-nums">
            {FONTES_METADADOS.totalReferencias}
          </div>
          <div className="text-xs text-neutral-800 font-semibold mt-1">Fontes Auditadas</div>
          <p className="text-[11px] text-neutral-600 mt-0.5">Bases oficiais e estudos</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
          <div className="text-2xl sm:text-[26px] font-bold text-neutral-900 tracking-tight tabular-nums">
            {FONTES_METADADOS.totalCategorias}
          </div>
          <div className="text-xs text-neutral-800 font-semibold mt-1">Grandes Eixos</div>
          <p className="text-[11px] text-neutral-600 mt-0.5">Cadeias, Inovação, Ensino e Território</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
          <div className="text-2xl sm:text-[26px] font-bold text-neutral-900 tracking-tight tabular-nums">
            {FONTES_METADADOS.totalSubcategorias}
          </div>
          <div className="text-xs text-neutral-800 font-semibold mt-1">Subcategorias</div>
          <p className="text-[11px] text-neutral-600 mt-0.5">IGs, APLs, RNP e IES</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-neutral-200/80 shadow-2xs">
          <div className="text-2xl sm:text-[26px] font-bold text-neutral-900 tracking-tight tabular-nums">
            417
          </div>
          <div className="text-xs text-neutral-800 font-semibold mt-1">Municípios Cobertos</div>
          <p className="text-[11px] text-neutral-600 mt-0.5">27 Territórios de Identidade</p>
        </div>
      </div>

      {/* CONTROLES DE FILTRO: CATEGORIAS, SUBCATEGORIAS E BUSCA */}
      <div className="bg-surface rounded-3xl border border-border p-5 sm:p-7 shadow-xs flex flex-col gap-5">
        {/* Barra de Busca Textual */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
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
            className="w-full pl-10 pr-10 py-3 rounded-2xl border border-neutral-300 bg-neutral-50/60 text-neutral-900 placeholder:text-neutral-400 text-sm focus:bg-white focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 cursor-pointer"
              title="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nível 1: Pílulas de Categorias Principais */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
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
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 hover:text-neutral-900'
                  }`}
                >
                  <IconComp size={14} className={isSelected ? 'text-white' : 'text-primary-700'} />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-primary-800 text-white' : 'bg-neutral-200/80 text-neutral-700'
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
          <div className="pt-3 border-t border-neutral-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
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
                        ? 'bg-neutral-900 text-white shadow-xs font-bold'
                        : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <span>{sub.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isSelected ? 'bg-neutral-700 text-white' : 'bg-neutral-200/60 text-neutral-600'
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
        <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
          <span>
            Exibindo <strong>{Math.min(visibleCount, filteredReferences.length)}</strong> de{' '}
            <strong>{filteredReferences.length}</strong> referências catalogadas
          </span>
          {(searchTerm || selectedCategory !== 'todas' || selectedSubcategory !== 'todas_sub') && (
            <button
              onClick={handleClearFilters}
              className="text-primary-700 hover:text-primary-800 font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <X size={12} /> Limpar todos os filtros
            </button>
          )}
        </div>
      </div>

      {/* GRID DE CARDS DE REFERÊNCIAS */}
      {filteredReferences.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-3xl border border-dashed border-border flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center">
            <Search size={22} />
          </div>
          <h4 className="text-base font-bold text-neutral-800">Nenhuma referência encontrada</h4>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md">
            Não encontramos registros com os filtros atuais. Tente buscar por outros termos ou selecione uma categoria mais ampla.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-2 px-4 py-2 rounded-xl bg-primary-50 text-primary-700 text-xs font-bold hover:bg-primary-100 transition-colors cursor-pointer"
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
                className="bg-surface rounded-3xl border border-border p-6 shadow-xs hover:shadow-card hover:border-primary-200 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Topo do Card: Categoria, Subcategoria e Tipo */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-primary-50 text-primary-800 border border-primary-100">
                        {ref.categoriaNome}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200/80">
                        {ref.subcategoriaNome}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCitation(ref)}
                      title="Copiar citação para ABNT/trabalhos"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
                    >
                      {isCopied ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <Check size={14} /> Copiado!
                        </span>
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                  </div>

                  {/* Título da Referência */}
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight mb-1.5 leading-snug group-hover:text-primary-700 transition-colors">
                    {ref.titulo}
                  </h3>

                  {/* Órgão ou Autor */}
                  {ref.autorOuOrgao && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100/70 px-2.5 py-1 rounded-lg mb-3">
                      <Building2 size={13} className="text-primary-600 shrink-0" />
                      <span>{ref.autorOuOrgao}</span>
                    </div>
                  )}

                  {/* Texto Descritivo */}
                  {ref.texto && (
                    <p className="text-xs sm:text-[13px] text-neutral-800 leading-relaxed font-normal mb-4">
                      {ref.texto}
                    </p>
                  )}
                </div>

                {/* Bloco Inferior: Localização no Painel + Botão de Acesso */}
                <div className="pt-3 border-t border-neutral-100 flex flex-col gap-3 mt-2">
                  {/* LOCALIZAÇÃO NO PAINEL SECTI */}
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 flex items-start gap-2.5 text-xs">
                    <Compass size={16} className="text-blue-700 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <span className="font-bold text-blue-900 block text-[11px] uppercase tracking-wider">
                        Onde encontrar no painel:
                      </span>
                      <span className="text-neutral-800 font-medium text-xs block mt-0.5 leading-relaxed">
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
                      className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-neutral-100/80 hover:bg-primary-50 text-neutral-700 hover:text-primary-800 text-xs font-semibold transition-colors cursor-pointer group/btn"
                    >
                      <span className="truncate pr-2">Acessar fonte / publicação oficial</span>
                      <ArrowUpRight size={14} className="shrink-0 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 text-primary-700" />
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
            className="px-6 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Carregar mais fontes (+{Math.min(12, filteredReferences.length - visibleCount)})</span>
          </button>
        </div>
      )}
    </section>
  );
}
