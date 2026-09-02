import React from 'react';

/**
 * Gráfico genérico de Barras Horizontais Proporcionais (100% Stacked).
 *
 * Props:
 * @param {Array} data - [{ label: string, positive: number, negative: number, total?: number }]
 * @param {String} title - Título do Card
 * @param {String} subtitle - Subtítulo do Card
 * @param {String} positiveLabel - Rótulo da barra preenchida (ex: "Com RNP", "Ativos")
 * @param {String} negativeLabel - Rótulo da barra secundária (ex: "Sem RNP", "Inativos")
 * @param {String} positiveColor - Cor Tailwind da barra preenchida (Default: 'bg-primary-600')
 * @param {String} negativeColor - Cor Tailwind da barra secundária (Default: 'bg-border')
 */
export default function ProportionBarChart({
    data = [],
    title = "Comparativo Proporcional",
    subtitle = "Proporção de distribuição entre categorias",
    positiveLabel = "Positivo",
    negativeLabel = "Negativo",
    positiveColor = "bg-primary-600",
    negativeColor = "bg-border",
    positiveTextColor = "text-amber-600",
    negativeTextColor = "text-blue-600",
    badge = null
}) {
    return (
        <div className="flex-1 bg-surface rounded-xl border border-border shadow-sm p-6 relative flex flex-col justify-between cursor-default h-full">
            <div className="mb-3 pr-8">
                <div className="flex items-center gap-2">
                    <h2 className="text-text-primary font-semibold text-[14px] tracking-tight">{title}</h2>
                    {badge && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-text-muted text-[11px] font-normal mt-0.5">{subtitle}</p>
            </div>

            <div className="flex flex-col justify-between flex-1 w-full gap-2.5 my-auto">
                {data.map((item, idx) => {
                    const pos = Number(item.positive || 0);
                    const neg = Number(item.negative || 0);
                    const total = Number(item.total || pos + neg) || 1;
                    const percentPos = ((pos / total) * 100).toFixed(1);
                    const percentNeg = ((neg / total) * 100).toFixed(1);

                    return (
                        <div key={idx} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[11px] font-medium text-text-primary">
                                <span className="truncate max-w-[135px]" title={item.label}>{item.label}</span>
                                <div className="flex items-center gap-1.5 text-[10.5px]">
                                    <span className={`font-semibold ${positiveTextColor}`} title={`${positiveLabel}: ${pos} (${percentPos}%)`}>
                                        {pos} <span className="text-[9.5px] font-normal opacity-85">({percentPos}%)</span>
                                    </span>
                                    <span className="text-neutral-300 font-bold">/</span>
                                    <span className={`font-semibold ${negativeTextColor}`} title={`${negativeLabel}: ${neg} (${percentNeg}%)`}>
                                        {neg} <span className="text-[9.5px] font-normal opacity-85">({percentNeg}%)</span>
                                    </span>
                                    <span className="text-text-muted text-[10px] font-normal ml-0.5">de {total}</span>
                                </div>
                            </div>
                            <div className="flex w-full h-2 rounded-full overflow-hidden bg-surface-soft shadow-inner">
                                <div className={`${positiveColor} h-full transition-all duration-700 ease-out rounded-l-full`} style={{ width: `${percentPos}%` }} title={`${positiveLabel}: ${pos} (${percentPos}%)`} />
                                <div className={`${negativeColor} h-full transition-all duration-700 ease-out rounded-r-full`} style={{ width: `${percentNeg}%` }} title={`${negativeLabel}: ${neg} (${percentNeg}%)`} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* LEGENDA */}
            <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${positiveColor} shadow-xs`}></span>
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">{positiveLabel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${negativeColor}`}></span>
                    <span className="text-[10px] font-semibold text-text-muted uppercase">{negativeLabel}</span>
                </div>
            </div>
        </div>
    );
}