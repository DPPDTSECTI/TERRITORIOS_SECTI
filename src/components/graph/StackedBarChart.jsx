import React, { useState, useMemo } from 'react';

/**
 * Componente de Gráfico de Barras Verticais Empilhadas (Stacked Capsule) com Tooltip Completo e Legenda Integral.
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
  title = "Ativos por Região",
  subtitle = "Visão geral por território",
  maxScale,
  allowToggleView = false
}) {
  const [hoveredItem, setHoveredItem] = useState(null);
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
      
      {/* CABEÇALHO DO GRÁFICO COM LEGENDA COMPLETA */}
      <div className="flex flex-col gap-2 mb-3 shrink-0 pr-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <h3 className="text-[#1D3557] font-extrabold text-[13px] tracking-tight flex items-center gap-2">
              {title}
            </h3>
            <span className="text-[10px] font-semibold text-[#457B9D]">
              {subtitle} ({data.length} Territórios)
            </span>
          </div>

          {/* TOGGLE TOP 10 / DEMAIS (SE ATIVADO) */}
          {allowToggleView && (
            <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-full border border-[#E2E8F0]">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setMinimizedFilter('acima'); }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all flex items-center gap-1 cursor-pointer ${
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
                className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                  minimizedFilter === 'abaixo'
                    ? 'bg-[#1D3557] text-white shadow-sm'
                    : 'text-[#457B9D] hover:text-[#1D3557]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#A8DADC]"></span>
                Demais ({Math.max(0, data.length - 10)})
              </button>
            </div>
          )}
        </div>

        {/* TODAS AS CATEGORIAS PRESENTES NA LEGENDA */}
        <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-[9.5px] font-bold pt-1 border-t border-[#F8FAFC]">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex items-center gap-1 shrink-0">
              <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.colorHex }}></span>
              <span className="text-[#1D3557]">{cat.shortLabel || cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ÁREA DO GRÁFICO DE BARRAS */}
      <div className="flex-1 w-full h-full relative min-h-0 pt-4 pb-1 px-1">
        <div className="relative w-full h-full">
          
          {/* LINHAS DE GRADE SUTIS */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
            <div className="w-full h-px bg-[#D6EAF8]"></div>
            <div className="w-full h-px bg-[#D6EAF8]"></div>
            <div className="w-full h-px bg-[#D6EAF8]"></div>
          </div>

          {/* BARRAS EM CÁPSULA COM BOLINHA NO TOPO */}
          <div className="w-full h-full flex items-end justify-between gap-1 sm:gap-1.5 relative z-10">
            {visibleData.map((item, index) => {
              const heightPercent = Math.min(100, (Number(item.total || 0) / calculatedMax) * 100);
              const isRightEdge = index >= visibleData.length - 7;
              const isHovered = hoveredItem?.label === item.label;

              // Categorias que possuem pelo menos 1 ativo neste território
              const presentCategories = categories.filter(
                (cat) => Number(item.segments?.[cat.key] || 0) > 0
              );

              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="flex-1 h-full flex flex-col items-center justify-end group/bar relative cursor-pointer hover:z-50"
                >
                  {/* TOOLTIP COMPLETO AO PASSAR O MOUSE NA BARRA / BOLINHA */}
                  {isHovered && (
                    <div
                      className={`absolute bg-[#1D3557] text-white shadow-[0_12px_32px_rgba(29,53,87,0.45)] rounded-xl p-2.5 pointer-events-none z-50 whitespace-nowrap text-left flex flex-col gap-1.5 border border-white/15 w-max max-w-[220px] ${
                        isRightEdge ? 'right-[calc(100%+8px)]' : 'left-[calc(100%+8px)]'
                      }`}
                      style={{ bottom: `${Math.max(6, Math.min(65, heightPercent))}%` }}
                    >
                      {/* CABEÇALHO DO TOOLTIP */}
                      <div className="flex items-center justify-between border-b border-white/15 pb-1 gap-2">
                        <span className="text-[11px] font-extrabold text-white truncate max-w-[130px]">
                          {item.label}
                        </span>
                        <span className="text-[9.5px] font-bold text-[#A8DADC] bg-white/10 px-2 py-0.5 rounded-full shrink-0">
                          {item.total} {item.total === 1 ? 'ativo' : 'ativos'}
                        </span>
                      </div>

                      {/* LISTA COMPLETA DE TODOS OS ATIVOS POR TIPO */}
                      <div className="flex flex-col gap-1 pt-0.5 max-h-[160px] overflow-y-auto hide-scroll">
                        {presentCategories.map((cat) => {
                          const count = Number(item.segments?.[cat.key] || 0);

                          return (
                            <div key={cat.key} className="flex items-center justify-between gap-3 text-[10px]">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                                  style={{ backgroundColor: cat.colorHex }}
                                ></span>
                                <span className="text-white/90 truncate font-medium">
                                  {cat.label || cat.shortLabel}
                                </span>
                              </div>
                              <span className="text-[10px] font-black text-white px-1.5 py-0.2 rounded bg-white/10 shrink-0">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* SETINHA LATERAL */}
                      <div
                        className={`absolute bottom-3 w-2 h-2 bg-[#1D3557] rotate-45 border-white/15 ${
                          isRightEdge ? '-right-1 border-r border-t' : '-left-1 border-l border-b'
                        }`}
                      ></div>
                    </div>
                  )}

                  {/* BOLINHA NO TOPO DA BARRA COM EFEITO DE PULSO/HOVER */}
                  <div
                    className={`w-2 h-2 rounded-full border border-white shadow-sm mb-1 transition-all duration-200 shrink-0 ${
                      isHovered ? 'scale-150 bg-[#2563EB]' : 'bg-[#1D3557]/80 group-hover/bar:bg-[#2563EB]'
                    }`}
                  />

                  {/* CÁPSULA SEGMENTADA */}
                  <div className="w-full flex items-end justify-center h-full relative">
                    <div
                      className="w-full max-w-[14px] sm:max-w-[18px] rounded-full relative flex flex-col-reverse overflow-hidden transition-all duration-500 ease-out group-hover/bar:scale-105 group-hover/bar:ring-2 group-hover/bar:ring-[#2563EB]/40 shadow-sm"
                      style={{ height: `${heightPercent}%` }}
                    >
                      {categories.map((cat) => {
                        const count = Number(item.segments?.[cat.key] || 0);
                        if (count === 0) return null;
                        const segPercent = (count / (item.total || 1)) * 100;

                        return (
                          <div
                            key={cat.key}
                            className="w-full transition-all duration-200 cursor-pointer min-h-[3px] hover:brightness-110"
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