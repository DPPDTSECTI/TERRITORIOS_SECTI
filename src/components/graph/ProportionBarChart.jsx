import React from 'react';
import { X } from 'lucide-react';
import { useChartTheme } from './chartTheme';

/**
 * Gráfico genérico de Barras Horizontais Proporcionais (100% Stacked).
 * Adaptável tanto para o Dashboard interativo quanto para relatórios em PDF.
 */
export default function ProportionBarChart({
  data = [],
  title = "Comparativo Proporcional",
  subtitle = "Proporção de distribuição entre categorias",
  positiveLabel = "Positivo",
  negativeLabel = "Negativo",
  positiveColor = "bg-primary-600",
  negativeColor = "bg-border",
  positiveTextColor = "text-accent-600",
  negativeTextColor = "text-primary-600",
  badge = null,
  cardClassName = '',
  isReport = false,
  isVisaoGeral = false,
  isSemiarido = false
}) {
  const chartTheme = useChartTheme();

  if (isReport) {
    // MODO RELATÓRIO PDF (Tipografia institucional ampliada para 1920x1080)
    return (
      <div className={`flex-1 bg-surface rounded-card border ${isSemiarido ? 'border-accent-200/50 dark:border-accent-500/30 shadow-card' : 'border-border shadow-card'} p-4 relative flex flex-col justify-between cursor-default h-full overflow-hidden ${cardClassName}`}>
        <div className="mb-1.5 shrink-0 border-b border-border/70 pb-1.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-title font-bold text-text-primary tracking-tight">{title}</h2>
            {badge && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-bold bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border border-accent-100 dark:border-accent-800 shrink-0">
                {badge}
              </span>
            )}
          </div>
          <p className="text-caption text-text-secondary mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-col justify-start flex-1 w-full gap-2 min-h-0 py-1">
          {data.map((item, idx) => {
            const pos = Number(item.positive || 0);
            const neg = Number(item.negative || 0);
            const total = Number(item.total || pos + neg) || 1;
            const percentPos = ((pos / total) * 100).toFixed(1);
            const percentNeg = ((neg / total) * 100).toFixed(1);

            return (
              <div key={idx} className="flex flex-col justify-between p-2 px-3 rounded-control bg-surface-soft border border-border/60 h-[46px]">
                <div className="flex justify-between items-center text-body-sm font-semibold text-text-primary leading-tight">
                  <span className="truncate flex-1 min-w-0 pr-2" title={item.label}>{item.label}</span>
                  <div className="flex items-center gap-1.5 text-caption shrink-0">
                    <span className={`font-bold tnum ${positiveTextColor}`} title={`${positiveLabel}: ${pos} (${percentPos}%)`}>
                      {pos} <span className="text-caption font-medium opacity-90">({percentPos}%)</span>
                    </span>
                    <span className="text-text-muted font-bold">/</span>
                    <span className={`font-bold tnum ${negativeTextColor}`} title={`${negativeLabel}: ${neg} (${percentNeg}%)`}>
                      {neg} <span className="text-caption font-medium opacity-90">({percentNeg}%)</span>
                    </span>
                    <span className="text-text-muted text-caption font-medium ml-0.5 tnum">de {total}</span>
                  </div>
                </div>
                <div className="flex w-full h-2 shrink-0 rounded-full overflow-hidden bg-surface-sunken border border-border/50">
                  <div className={`${positiveColor} h-full transition-all duration-700 ease-out`} style={{ width: `${percentPos}%` }} title={`${positiveLabel}: ${pos} (${percentPos}%)`} />
                  <div className={`${negativeColor} h-full transition-all duration-700 ease-out`} style={{ width: `${percentNeg}%` }} title={`${negativeLabel}: ${neg} (${percentNeg}%)`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* LEGENDA */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border shrink-0 text-caption font-semibold mt-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${positiveColor} shadow-xs`}></span>
            <span className={positiveTextColor || "text-primary-600"}>{positiveLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${negativeColor} shadow-xs`}></span>
            <span className={negativeTextColor || "text-accent-600"}>{negativeLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  // MODO VISÃO GERAL
  if (isVisaoGeral) {
    const isSemi = isSemiarido || cardClassName.includes('semiarido') || !!badge;
    const posPillColor = isSemi ? 'bg-accent-600' : (positiveColor || 'bg-primary-600');
    const negPillStyle = isSemi
      ? 'bg-accent-50 text-accent-800 dark:text-accent-300 border border-accent-100'
      : 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60';
    const totalPillStyle = isSemi
      ? 'bg-accent-100 dark:bg-accent-950 text-accent-800 dark:text-accent-200 border border-accent-200'
      : 'bg-primary-100 dark:bg-primary-950 text-primary-800 dark:text-primary-200 border border-primary-200';

    return (
      <div className={`flex-1 bg-surface rounded-card border border-border p-4 relative flex flex-col justify-between h-full group cursor-default overflow-hidden ${cardClassName}`}>
        {/* CABEÇALHO */}
        <div className="flex justify-between items-start mb-1.5 relative z-10 w-full shrink-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-text-primary font-semibold text-subtitle tracking-tight truncate">{title}</h2>
              {badge && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border border-accent-100 dark:border-accent-800 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></span>
                  {badge}
                </span>
              )}
            </div>
            <p className="text-text-muted text-caption font-normal mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>

        <div className="w-full h-px bg-border/70 mb-1.5 shrink-0"></div>

        {data.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 opacity-60 mt-4">
            <X size={64} className={isSemi ? "text-accent-500" : "text-primary-500"} strokeWidth={2} />
            <span className="text-text-muted font-medium text-body-sm">Nenhum dado disponível</span>
          </div>
        ) : (
          <>
            <div className={`flex flex-col justify-center flex-1 w-full ${data.length > 4 ? 'gap-1 py-0' : 'gap-2 py-0.5'} my-auto min-h-0 overflow-hidden`}>
              {data.map((item, idx) => {
                const pos = Number(item.positive || 0);
                const neg = Number(item.negative || 0);
                const total = Number(item.total || (pos + neg)) || 1;
                const percentPos = Number(((pos / total) * 100).toFixed(1));
                const percentNeg = Number(((neg / total) * 100).toFixed(1));

                const isCompact = data.length > 4;
                const pillH = isCompact ? 'h-[20px]' : 'h-[24px]';

                return (
                  <div key={idx} className="flex flex-col gap-0.5 w-full group/item">
                    <div className="text-caption font-medium text-text-primary leading-tight truncate px-0.5" title={item.label}>
                      {item.label}
                    </div>

                    <div className="flex items-center gap-1.5 w-full">
                      {pos > 0 && (
                        <div
                          className={`${pillH} rounded-full ${posPillColor} flex items-center justify-center px-2 text-white transition-all duration-500 overflow-hidden shrink-0 select-none shadow-xs whitespace-nowrap`}
                          style={{
                            flexGrow: pos,
                            flexBasis: 0,
                            minWidth: neg > 0 ? (isCompact ? '64px' : '72px') : 'auto'
                          }}
                          title={`${positiveLabel}: ${pos} (${percentPos}%)`}
                        >
                          <span className="text-caption font-semibold tnum leading-none whitespace-nowrap">
                            {pos}
                          </span>
                          <span className="text-caption font-normal opacity-90 ml-1 tnum leading-none whitespace-nowrap">
                            ({percentPos}%)
                          </span>
                        </div>
                      )}

                      {neg > 0 && (
                        <div
                          className={`${pillH} rounded-full ${negPillStyle} flex items-center justify-center px-2 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-xs whitespace-nowrap`}
                          style={{
                            flexGrow: neg,
                            flexBasis: 0,
                            minWidth: pos > 0 ? (isCompact ? '64px' : '72px') : 'auto'
                          }}
                          title={`${negativeLabel}: ${neg} (${percentNeg}%)`}
                        >
                          <span className="text-caption font-semibold tnum leading-none whitespace-nowrap">
                            {neg}
                          </span>
                          <span className="text-caption font-normal opacity-85 ml-1 tnum leading-none whitespace-nowrap">
                            ({percentNeg}%)
                          </span>
                        </div>
                      )}

                      <div
                        className={`${pillH} min-w-[30px] px-2 rounded-full ${totalPillStyle} flex items-center justify-center shrink-0 select-none shadow-xs`}
                        title={`Total: ${total}`}
                      >
                        <span className="text-caption font-semibold tnum leading-none">
                          {total}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-border shrink-0 text-caption font-medium mt-auto">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${posPillColor} shadow-xs`}></span>
                <span className={isSemi ? "text-accent-800 dark:text-accent-300" : "text-primary-700 dark:text-primary-300"}>{positiveLabel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isSemi ? 'bg-accent-500/40' : 'bg-primary-300'} shadow-xs`}></span>
                <span className={isSemi ? "text-accent-800 dark:text-accent-300" : "text-primary-700 dark:text-primary-300"}>{negativeLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-muted">
                <span className={`w-2 h-2 rounded-full ${isSemi ? 'bg-accent-400' : 'bg-primary-400'} shadow-xs`}></span>
                <span className={isSemi ? "text-accent-800 dark:text-accent-300" : ""}>Total</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // MODO DASHBOARD INTERATIVO PADRÃO
  return (
    <div className={`flex-1 bg-surface rounded-card border border-border p-4 lg:p-5 relative flex flex-col justify-between h-full group cursor-default overflow-hidden ${cardClassName}`}>
      <div className="flex justify-between items-start mb-2 relative z-10 w-full pr-9 shrink-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-text-primary font-semibold text-subtitle tracking-tight truncate">{title}</h2>
            {badge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border border-accent-100 dark:border-accent-800 shrink-0">
                {badge}
              </span>
            )}
          </div>
          <p className="text-text-muted text-caption font-normal mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>
      
      <div className="w-full h-px bg-border/70 mb-2 shrink-0"></div>

      {data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 opacity-60 mt-4">
          <X size={64} className="text-primary-500" strokeWidth={2} />
          <span className="text-text-muted font-medium text-body-sm">Nenhum dado disponível</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col justify-between flex-1 w-full gap-1.5 my-auto min-h-0 overflow-hidden py-0.5">
            {data.map((item, idx) => {
              const pos = Number(item.positive || 0);
              const neg = Number(item.negative || 0);
              const total = Number(item.total || pos + neg) || 1;
              const percentPos = ((pos / total) * 100).toFixed(1);
              const percentNeg = ((neg / total) * 100).toFixed(1);

              return (
                <div key={idx} className="flex flex-col justify-center gap-1 py-1.5 px-3 rounded-control bg-surface-soft border border-border flex-1 min-h-[34px] max-h-[46px]">
                  <div className="flex justify-between items-center text-caption font-semibold text-text-primary leading-tight">
                    <span className="truncate flex-1 min-w-0 pr-2" title={item.label}>{item.label}</span>
                    <div className="flex items-center gap-1 text-caption shrink-0">
                      <span className={`font-bold tnum ${positiveTextColor}`} title={`${positiveLabel}: ${pos} (${percentPos}%)`}>
                        {pos} <span className="text-caption font-medium opacity-90">({percentPos}%)</span>
                      </span>
                      <span className="text-text-muted font-bold">/</span>
                      <span className={`font-bold tnum ${negativeTextColor}`} title={`${negativeLabel}: ${neg} (${percentNeg}%)`}>
                        {neg} <span className="text-caption font-medium opacity-90">({percentNeg}%)</span>
                      </span>
                      <span className="text-text-muted text-caption font-medium ml-0.5 tnum">de {total}</span>
                    </div>
                  </div>
                  <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-surface-sunken">
                    <div className={`${positiveColor} h-full transition-all duration-700 ease-out`} style={{ width: `${percentPos}%` }} title={`${positiveLabel}: ${pos} (${percentPos}%)`} />
                    <div className={`${negativeColor} h-full transition-all duration-700 ease-out`} style={{ width: `${percentNeg}%` }} title={`${negativeLabel}: ${neg} (${percentNeg}%)`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/70 shrink-0 text-caption font-medium mt-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${positiveColor} shadow-xs`}></span>
              <span className={positiveTextColor || "text-primary-600 dark:text-primary-400"}>{positiveLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${negativeColor} shadow-xs`}></span>
              <span className={negativeTextColor || "text-accent-600 dark:text-accent-400"}>{negativeLabel}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}