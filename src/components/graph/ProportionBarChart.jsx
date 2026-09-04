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
        <div className="flex-1 bg-white rounded-[24px] border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] p-4 relative flex flex-col justify-between cursor-default h-full overflow-hidden">
            <div className="mb-1.5 shrink-0 border-b border-[#F1F5F9] pb-1.5">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[17px] lg:text-[18px] font-bold text-[#1D3557] tracking-tight">{title}</h2>
                    {badge && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-[12px] text-[#457B9D] mt-0.5">{subtitle}</p>
            </div>

            <div className="flex flex-col justify-start flex-1 w-full gap-2 min-h-0 py-1">
                {data.map((item, idx) => {
                    const pos = Number(item.positive || 0);
                    const neg = Number(item.negative || 0);
                    const total = Number(item.total || pos + neg) || 1;
                    const percentPos = ((pos / total) * 100).toFixed(1);
                    const percentNeg = ((neg / total) * 100).toFixed(1);

                    return (
                        <div key={idx} className="flex flex-col justify-between p-1.5 px-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/50 h-[44px]">
                            <div className="flex justify-between items-center text-[12.5px] font-bold text-[#1D3557] leading-tight">
                                <span className="truncate flex-1 min-w-0 pr-2" title={item.label}>{item.label}</span>
                                <div className="flex items-center gap-1.5 text-[12px] shrink-0">
                                    <span className={`font-black ${positiveTextColor}`} title={`${positiveLabel}: ${pos} (${percentPos}%)`}>
                                        {pos} <span className="text-[10.5px] font-bold opacity-90">({percentPos}%)</span>
                                    </span>
                                    <span className="text-[#CBD5E1] font-bold">/</span>
                                    <span className={`font-black ${negativeTextColor}`} title={`${negativeLabel}: ${neg} (${percentNeg}%)`}>
                                        {neg} <span className="text-[10.5px] font-bold opacity-90">({percentNeg}%)</span>
                                    </span>
                                    <span className="text-[#64748B] text-[10.5px] font-semibold ml-0.5">de {total}</span>
                                </div>
                            </div>
                            <div className="flex w-full h-[7px] shrink-0 rounded-full overflow-hidden bg-[#E2E8F0] shadow-2xs">
                                <div className={`${positiveColor} h-full transition-all duration-700 ease-out`} style={{ width: `${percentPos}%` }} title={`${positiveLabel}: ${pos} (${percentPos}%)`} />
                                <div className={`${negativeColor} h-full transition-all duration-700 ease-out`} style={{ width: `${percentNeg}%` }} title={`${negativeLabel}: ${neg} (${percentNeg}%)`} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* LEGENDA */}
            <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-[#F1F5F9] shrink-0 text-[11.5px] font-bold">
                <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${positiveColor} shadow-2xs`}></span>
                    <span className={positiveTextColor || "text-[#2563EB]"}>{positiveLabel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${negativeColor} shadow-2xs`}></span>
                    <span className={negativeTextColor || "text-[#D97706]"}>{negativeLabel}</span>
                </div>
            </div>
        </div>
    );
}