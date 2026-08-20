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
 * @param {String} positiveColor - Cor Tailwind da barra preenchida (Default: 'bg-[#2563EB]')
 * @param {String} negativeColor - Cor Tailwind da barra secundária (Default: 'bg-[#E2E8F0]')
 */
export default function ProportionBarChart({
  data = [],
  title = "Comparativo Proporcional",
  subtitle = "Proporção de distribuição entre categorias",
  positiveLabel = "Positivo",
  negativeLabel = "Negativo",
  positiveColor = "bg-[#2563EB]",
  negativeColor = "bg-[#E2E8F0]"
}) {
  return (
    <div className="flex-1 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 p-5 relative flex flex-col justify-between cursor-default h-full">
      <div className="mb-3">
        <h2 className="text-[#1D3557] font-extrabold text-[14px] tracking-tight">{title}</h2>
        <p className="text-[#457B9D]/60 text-[10px] font-medium mt-0.5">{subtitle}</p>
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
              <div className="flex justify-between items-center text-[10px] font-bold text-[#1D3557]">
                <span className="truncate max-w-[130px]" title={item.label}>{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#2563EB]">{pos}</span>
                  <span className="text-[#A0AEC0] font-normal">/ {total}</span>
                </div>
              </div>
              <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-gray-100">
                <div className={`${positiveColor} h-full transition-all duration-1000 ease-out`} style={{ width: `${percentPos}%` }} title={`${positiveLabel}: ${pos} (${percentPos}%)`} />
                <div className={`${negativeColor} h-full transition-all duration-1000 ease-out`} style={{ width: `${percentNeg}%` }} title={`${negativeLabel}: ${neg} (${percentNeg}%)`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* LEGENDA */}
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${positiveColor}`}></span>
          <span className="text-[9px] font-bold text-[#457B9D] uppercase">{positiveLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${negativeColor}`}></span>
          <span className="text-[9px] font-bold text-[#457B9D] uppercase">{negativeLabel}</span>
        </div>
      </div>
    </div>
  );
}