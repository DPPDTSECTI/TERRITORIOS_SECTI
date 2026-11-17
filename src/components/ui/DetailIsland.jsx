import React, { useEffect } from 'react';
import { X, ExternalLink, MapPin, ArrowLeft } from 'lucide-react';
import { getSemanticColors } from '../graph/chartTheme';

/**
 * Ilha flutuante de detalhes ("aba/ilha flutuante") exibida por cima dos componentes
 * da coluna direita (KPIs, barra de abas/busca e lista) quando um item de qualquer
 * módulo (Ativos, Cursos ou Cadeias) é selecionado.
 */
export function DetailIsland({
  isOpen,
  onClose,
  title,
  subtitle,
  badgeText,
  accentColor = getSemanticColors().primaryBase,
  icon: Icon,
  statusPills = [],
  metrics = [],
  extraSection = null,
  referenceQuote = null,
  externalUrl = null,
  externalLabel = 'Acessar Fonte Oficial',
  secondaryAction = null,
  filtroSemiarido = false,
  compact = false,
  className = ''
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <aside
      aria-label={`Detalhes de ${title}`}
      className={`flex flex-col justify-between bg-white dark:bg-zinc-900 border ${filtroSemiarido
        ? 'border-amber-400/50 dark:border-amber-500/40 shadow-xs'
        : 'border-zinc-200/80 dark:border-zinc-800/80 shadow-xs'
        } ${compact ? 'rounded-card p-4 sm:p-5' : 'rounded-panel p-6 lg:p-7'
        } overflow-hidden animate-in fade-in zoom-in-[0.98] slide-in-from-right-6 duration-200 select-text ${className}`}
    >
      {/* CABEÇALHO FIXO DA ILHA */}
      <div className={`flex items-start justify-between gap-3 ${compact ? 'pb-3' : 'pb-4'} border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0`}>
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {Icon && (
            <div
              className={`${compact ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-2xl'} flex items-center justify-center shrink-0 mt-0.5 border border-black/5 dark:border-white/10 shadow-2xs`}
              style={{
                backgroundColor: `${accentColor}18`,
                color: accentColor
              }}
            >
              <Icon size={compact ? 20 : 24} strokeWidth={2} />
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            {badgeText && (
              <span
                className="text-xs font-bold uppercase tracking-wider truncate mb-1"
                style={{ color: accentColor }}
              >
                {badgeText}
              </span>
            )}
            <h4
              className={`${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-bold tracking-tight text-zinc-950 dark:text-zinc-50 leading-snug break-words`}
              title={title}
            >
              {title}
            </h4>
            {subtitle && (
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-zinc-500 dark:text-zinc-400 mt-1 leading-normal break-words font-medium`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          aria-label="Fechar detalhes"
          title="Fechar painel (Esc)"
          className={`inline-flex items-center gap-1.5 ${compact ? 'h-8 px-2.5' : 'h-9 px-3.5'} rounded-control text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 border border-zinc-200/80 dark:border-zinc-700 transition-colors cursor-pointer shrink-0`}
        >
          <span>Fechar</span>
          <X size={compact ? 14 : 15} strokeWidth={2.2} />
        </button>
      </div>

      {/* CORPO SCROLLÁVEL COM MAIS DADOS */}
      <div className={`flex-1 overflow-y-auto pr-1 ${compact ? 'my-3 gap-3' : 'my-4 gap-4'} flex flex-col min-h-0`}>
        {/* PÍLULAS DE STATUS */}
        {statusPills.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            {statusPills.map((pill, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${pill.variant === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : pill.variant === 'warning'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                    : pill.variant === 'primary'
                      ? 'bg-primary-500/10 text-primary-700 dark:text-primary-300 border-primary-500/20'
                      : 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20'
                  }`}
              >
                {pill.icon}
                <span>{pill.label}</span>
              </span>
            ))}
          </div>
        )}

        {/* GRADE DE METADADOS E INDICADORES */}
        {metrics.length > 0 && (
          <div className={`rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 ${compact ? 'p-3' : 'p-3.5'} shrink-0`}>
            <div className={`grid ${compact ? 'grid-cols-2 gap-x-4 gap-y-2.5' : 'grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3'}`}>
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col justify-between min-w-0 ${m.fullWidth
                    ? (compact ? 'col-span-2' : 'col-span-2 sm:col-span-3')
                    : 'col-span-1'
                    }`}
                >
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
                    {m.label}
                  </span>
                  <span
                    className={`${compact ? 'text-sm' : 'text-sm sm:text-base'} font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 break-words leading-snug ${m.tabular ? 'tabular-nums' : ''
                      }`}
                    title={String(m.value ?? '-')}
                  >
                    {m.value ?? '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEÇÃO EXTRA (EX: MUNICÍPIOS COBERTOS OU CONTEXTO ADICIONAL) */}
        {extraSection}

        {/* CITAÇÃO / REFERÊNCIA BIBLIOGRÁFICA */}
        {referenceQuote && (
          <div className="rounded-xl bg-amber-500/10 dark:bg-amber-950/35 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-1.5">
              Referência / Citação do Artigo
            </span>
            <p className="text-sm leading-relaxed italic text-zinc-700 dark:text-amber-100/90">
              &ldquo;{referenceQuote}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* RODAPÉ DE AÇÕES */}
      <div className={`${compact ? 'pt-3 gap-2' : 'pt-3.5 gap-2.5'} border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between shrink-0 flex-wrap`}>
        <button
          type="button"
          onClick={onClose}
          className={`inline-flex items-center justify-center gap-1.5 ${compact ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-xs sm:text-sm'} rounded-control font-medium border border-zinc-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer`}
        >
          <ArrowLeft size={compact ? 14 : 15} />
          <span>Voltar à lista</span>
        </button>

        <div className={`flex items-center ${compact ? 'gap-2' : 'gap-2.5'} flex-wrap flex-1 sm:flex-initial justify-end`}>
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className={`inline-flex items-center justify-center gap-1.5 ${compact ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-xs sm:text-sm'} rounded-control font-semibold border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors cursor-pointer`}
            >
              {secondaryAction.icon || <MapPin size={compact ? 14 : 15} />}
              <span className="truncate">{secondaryAction.label}</span>
            </button>
          )}
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center justify-center gap-2 ${compact ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-xs sm:text-sm'} rounded-control font-semibold text-white transition-colors shadow-xs ${filtroSemiarido
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'
                }`}
            >
              <span className="truncate">{externalLabel}</span>
              <ExternalLink size={compact ? 14 : 15} className="shrink-0" />
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}

export default DetailIsland;
