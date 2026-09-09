import React, { useState, useMemo } from 'react';
import {
  Database, Search, ExternalLink, ShieldCheck, Check, Copy,
  BookOpen, Link2, Layers, Filter, X, ArrowUpRight, Award,
  GraduationCap, Wifi, Building2, Milestone, FileText, CheckCircle2
} from 'lucide-react';
import { REFERENCIAS_DATABASE, CATEGORIAS_REFERENCIAS, FONTES_METADADOS } from '../data/referenciasDB';

export default function FontesReferenciasSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [copiedId, setCopiedId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);

  // Filtragem combinada por busca textual e categoria
  const filteredReferences = useMemo(() => {
    return REFERENCIAS_DATABASE.filter(ref => {
      const matchCategory = selectedCategory === 'todas' || ref.categoriaSlug === selectedCategory;

      if (!matchCategory) return false;

      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const matchTitle = ref.titulo?.toLowerCase().includes(term);
      const matchAuthor = ref.autorOuOrgao?.toLowerCase().includes(term);
      const matchText = ref.texto?.toLowerCase().includes(term);
      const matchFk = ref.fkInfo?.toLowerCase().includes(term) || ref.tabelaFk?.toLowerCase().includes(term);
      const matchId = String(ref.id).toLowerCase().includes(term);

      return matchTitle || matchAuthor || matchText || matchFk || matchId;
    });
  }, [searchTerm, selectedCategory]);

  const handleCopyCitation = (ref) => {
    const citation = `${ref.autorOuOrgao ? ref.autorOuOrgao + '. ' : ''}${ref.titulo}. ${ref.texto ? ref.texto + ' ' : ''}${ref.url ? 'Disponível em: ' + ref.url : ''}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(ref.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('todas');
    setVisibleCount(12);
  };

  return (
    <section id="fontes-referencias" className="flex flex-col gap-8 scroll-mt-6">
      {/* TÍTULO DA SEÇÃO */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-primary-700 text-white shadow-sm">
            <Database size={22} strokeWidth={2.2} />
          </div>
          <h2 className="font-extrabold tracking-tight text-2xl sm:text-3xl text-neutral-900">
            Fontes Oficiais & Referências Metodológicas
          </h2>
        </div>
        <p className="text-sm sm:text-base text-neutral-600 pl-0 sm:pl-[58px] font-normal leading-relaxed max-w-4xl">
          Mapeamento rigoroso e transparente de todas as bases de dados públicas, pesquisas científicas e cruzamentos relacionais via chaves estrangeiras (<strong>Foreign Keys - FK</strong>) integradas ao banco de dados Supabase da SECTI Bahia.
        </p>
      </div>

      {/* PAINEL DE GOVERNANÇA E RASTREABILIDADE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Fontes Auditadas</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              {FONTES_METADADOS.totalReferencias}
            </div>
            <p className="text-xs text-neutral-600 mt-1">Registros oficiais catalogados no Supabase</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Cruzamentos FK</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Link2 size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              9 Tabelas
            </div>
            <p className="text-xs text-neutral-600 mt-1">Integradas por IDs relacionais consistentes</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Cobertura Territorial</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Milestone size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-700 tracking-tight">
              417 Municípios
            </div>
            <p className="text-xs text-neutral-600 mt-1">100% dos 27 Territórios de Identidade</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Transparência Ativa</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
              Acesso Aberto
            </div>
            <p className="text-xs text-neutral-600 mt-1">Links diretos para portais e periódicos</p>
          </div>
        </div>
      </div>

      {/* CONTROLES DE FILTRO E BUSCA */}
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
            placeholder="Buscar fonte por título, autor, órgão (INEP, RNP, FIRJAN), município ou tabela FK..."
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

        {/* Pílulas de Categoria */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIAS_REFERENCIAS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setVisibleCount(12);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-primary-800 text-white' : 'bg-neutral-200/70 text-neutral-700'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Resumo dos resultados */}
        <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
          <span>
            Exibindo <strong>{Math.min(visibleCount, filteredReferences.length)}</strong> de{' '}
            <strong>{filteredReferences.length}</strong> fontes encontradas
          </span>
          {(searchTerm || selectedCategory !== 'todas') && (
            <button
              onClick={handleClearFilters}
              className="text-primary-700 hover:text-primary-800 font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <X size={12} /> Limpar filtros
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
            Não encontramos nenhuma fonte com os termos digitados. Tente buscar por palavras-chave mais genéricas ou selecione outra categoria.
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
                  {/* Topo do Card: Badge de ID Supabase & Categoria */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200/80 font-mono">
                        ID #{ref.id}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary-50 text-primary-800 border border-primary-100">
                        {ref.categoria}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCitation(ref)}
                      title="Copiar citação/referência"
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

                  {/* Título & Órgão */}
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight mb-1 leading-snug group-hover:text-primary-700 transition-colors">
                    {ref.titulo}
                  </h3>

                  {ref.autorOuOrgao && (
                    <div className="text-xs font-semibold text-primary-800 mb-2.5">
                      {ref.autorOuOrgao}
                    </div>
                  )}

                  {/* Texto da Citação / Metodologia */}
                  {ref.texto && (
                    <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-normal mb-4">
                      {ref.texto}
                    </p>
                  )}
                </div>

                {/* Bloco Inferior: Caixa de Cruzamento FK + Botão de Acesso */}
                <div className="pt-3 border-t border-neutral-100 flex flex-col gap-3 mt-2">
                  {/* Informação da Chave Estrangeira (FK) */}
                  <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60 flex items-start gap-2 text-xs">
                    <Link2 size={15} className="text-primary-600 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <span className="font-semibold text-neutral-700 block text-[11px] uppercase tracking-wider">
                        Cruzamento Relacional (Supabase FK):
                      </span>
                      <code className="text-primary-900 font-mono text-[11px] font-bold block mt-0.5 break-all">
                        {ref.fkInfo}
                      </code>
                    </div>
                  </div>

                  {/* Link Externo para a Fonte */}
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-neutral-100/80 hover:bg-primary-50 text-neutral-700 hover:text-primary-800 text-xs font-semibold transition-colors cursor-pointer group/btn"
                    >
                      <span className="truncate pr-2">{ref.url}</span>
                      <ArrowUpRight size={14} className="shrink-0 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOTÃO CARREGAR MAIS SE HOUVER MAIS ITENS */}
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
