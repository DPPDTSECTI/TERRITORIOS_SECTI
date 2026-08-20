import React, { useState, useMemo } from 'react';

/**
 * Componente genérico de Gráfico de Barras Verticais Empilhadas (Stacked Capsule).
 * 
 * Props:
 * @param {Array} data - Array agrupado: [{ label: string, total: number, segments: { [key]: number } }]
 * @param {Array} categories - Array de legendas/cores: [{ key: string, label: string, shortLabel: string, colorHex: string }]
 * @param {String} title - Título do Card
 * @param {String} subtitle - Subtítulo do Card
 * @param {Number} maxScale - Escala máxima customizada (opcional)
 * @param {Boolean} allowToggleView - Exibe o alternador 'Top 10' vs 'Demais'
 */
export default function StackedBarChart({
  data = [],
  categories = [],
  title = "Distribuição Segmentada",
  subtitle = "Visão geral por região",
  maxScale,
  allowToggleView = false
}) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [minimizedFilter, setMinimizedFilter] = useState('acima'); // 'acima' | 'abaixo'

  const calculatedMax = useMemo(() => {
    if (maxScale) return maxScale;
    if (!data.length) return 10;
    const maxTotal = Math.max(...data.map(d => Number(d.total || 0)));
    return Math.ceil(maxTotal * 1.05) || 10;
  }, [data, maxScale]);

  const visibleData = useMemo(() => {
    if (!allowToggleView) return data;
    if (minimizedFilter === 'acima') return data.slice(0, 10);
    return data.slice(10);
  }, [data, allowToggleView, minimizedFilter]);

  return (
    <div className="bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default min-h-0">
      
      {/* CABEÇALHO DO GRÁFICO */}
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0 pr-8">
        <div className="flex flex-col">
          <h3 className="text-[#1D3557] font-extrabold text-[13px] tracking-tight flex items-center gap-2">
            {title}
          </h3>
          <span className="text-[10px] font-semibold text-[#457B9D]">
            {subtitle}
          </span>
        </div>

        {/* CONTROLES / LEGENDA */}
        <div className="flex items-center gap-2">
          {allowToggleView ? (
            <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-full border border-[#E2E8F0]">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMinimizedFilter('acima'); }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all flex items-center gap-1 ${
                  minimizedFilter === 'acima'
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Top 10
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMinimizedFilter('abaixo'); }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all flex items-center gap-1 ${
                  minimizedFilter === 'abaixo'
                    ? 'bg-[#1D3557] text-white shadow-sm'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#A8DADC]"></span>
                Demais ({Math.max(0, data.length - 10)})
              </button>
            </div>
          ) : (
            <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold">
              {categories.slice(0, 4).map((cat, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.colorHex }}></span>
                  <span className="text-[#1D3557] truncate max-w-[90px]">{cat.shortLabel || cat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ÁREA DO GRÁFICO DE BARRAS */}
      <div className="flex-1 w-full h-full relative min-h-0 pt-4 pb-1 px-1">
        <div className="relative w-full h-full">
          
          {/* LINHAS DE GRADE */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
            <div className="w-full h-px bg-[#D6EAF8]"></div>
            <div className="w-full h-px bg-[#D6EAF8]"></div>
            <div className="w-full h-px bg-[#D6EAF8]"></div>
          </div>

          {/* BARRAS EM CÁPSULA */}
          <div className="w-full h-full flex items-end justify-between gap-1 sm:gap-1.5 relative z-10">
            {visibleData.map((item, index) => {
              const heightPercent = Math.min(100, (Number(item.total || 0) / calculatedMax) * 100);
              const isRightEdge = index >= visibleData.length - 7;

              return (
                <div
                  key={index}
                  onMouseLeave={() => setHoveredSlice(null)}
                  className="flex-1 h-full flex flex-col items-center justify-end group/bar relative cursor-pointer hover:z-50"
                >
                  {/* TOOLTIP LATERAL */}
                  {hoveredSlice && hoveredSlice.label === item.label && (
                    <div
                      className={`absolute bg-[#1D3557] text-white shadow-[0_10px_28px_rgba(29,53,87,0.4)] rounded-xl p-2 pointer-events-none z-50 whitespace-nowrap text-left flex flex-col gap-1 border border-white/15 w-max max-w-[190px] ${
                        isRightEdge ? 'right-[calc(100%+8px)]' : 'left-[calc(100%+8px)]'
                      }`}
                      style={{ bottom: `${Math.max(4, Math.min(60, heightPercent - 5))}%` }}
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-1 gap-2">
                        <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{hoveredSlice.label}</span>
                        <span className="text-[9px] font-semibold text-[#A8DADC] bg-white/10 px-1.5 py-0.5 rounded-full shrink-0">
                          {hoveredSlice.total} total
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: hoveredSlice.colorHex }}></span>
                          <span className="text-[10px] font-medium text-white/90 truncate">{hoveredSlice.segmentName}</span>
                        </div>
                        <span className="text-[11px] font-black text-white px-1.5 py-0.5 rounded bg-white/10 shrink-0">
                          {hoveredSlice.count}
                        </span>
                      </div>
                      <div className={`absolute bottom-3 w-2 h-2 bg-[#1D3557] rotate-45 border-white/15 ${isRightEdge ? '-right-1 border-r border-t' : '-left-1 border-l border-b'}`}></div>
                    </div>
                  )}

                  {/* CÁPSULA */}
                  <div className="w-full flex items-end justify-center h-full relative">
                    <div
                      className="w-full max-w-[14px] sm:max-w-[18px] rounded-full relative flex flex-col-reverse overflow-hidden transition-all duration-500 ease-out group-hover/bar:scale-105 group-hover/bar:ring-2 group-hover/bar:ring-[#2563EB]/40 shadow-sm"
                      style={{ height: `${heightPercent}%` }}
                    >
                      {categories.map((cat) => {
                        const count = Number(item.segments?.[cat.key] || 0);
                        if (count === 0) return null;
                        const segPercent = (count / (item.total || 1)) * 100;
                        const isThisSliceHovered = hoveredSlice?.label === item.label && hoveredSlice?.key === cat.key;

                        return (
                          <div
                            key={cat.key}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              setHoveredSlice({
                                label: item.label,
                                key: cat.key,
                                segmentName: cat.label || cat.shortLabel,
                                colorHex: cat.colorHex,
                                count,
                                total: item.total
                              });
                            }}
                            className={`w-full transition-all duration-200 cursor-pointer min-h-[3px] ${
                              isThisSliceHovered ? 'brightness-125 saturate-150 ring-1 ring-white' : 'hover:brightness-110'
                            }`}
                            style={{ height: `${segPercent}%`, backgroundColor: cat.colorHex }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}