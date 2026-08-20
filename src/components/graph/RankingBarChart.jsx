import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Minus } from 'lucide-react';

/**
 * Gráfico genérico de Barras Verticais para rankings.
 *
 * Props:
 * @param {Array} data - Array com os dados brutos
 * @param {String} title - Título do Card
 * @param {String} valueKey - Chave da métrica principal (ex: 'media_ifdm', 'pontuacao')
 * @param {String} labelKey - Chave do rótulo da coluna (ex: 'territorio', 'municipio')
 * @param {String} extraKey - Chave da métrica exibida no tooltip (ex: 'cadeias_produtivas')
 * @param {String} extraLabel - Rótulo da métrica no tooltip (ex: 'Cadeias', 'Empresas')
 * @param {String} topSubtitle - Subtítulo no modo 'top'
 * @param {String} mediumSubtitle - Subtítulo no modo 'medium'
 * @param {String} bottomSubtitle - Subtítulo no modo 'bottom'
 * @param {Number} maxScale - Escala máxima de porcentagem (Default: 100)
 */
export default function RankingBarChart({
  data = [],
  title = "Ranking",
  valueKey = "value",
  labelKey = "label",
  extraKey = "extra",
  extraLabel = "Unidades",
  topSubtitle = "Top 5 melhores",
  mediumSubtitle = "5 na média",
  bottomSubtitle = "Top 5 menores",
  maxScale = 1
}) {
  const [filterMode, setFilterMode] = useState('top');

  const subtitle = filterMode === 'top' ? topSubtitle : filterMode === 'medium' ? mediumSubtitle : bottomSubtitle;

  const processedData = (() => {
    const ordenados = [...data]
      .filter(item => item[valueKey] !== null && !isNaN(Number(item[valueKey])))
      .sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]));

    if (ordenados.length === 0) return [];

    let slice = [];
    if (filterMode === 'top') {
      slice = ordenados.slice(0, 5);
    } else if (filterMode === 'bottom') {
      slice = ordenados.slice(-5).reverse();
    } else if (filterMode === 'medium') {
      const meio = Math.floor(ordenados.length / 2);
      slice = ordenados.slice(Math.max(0, meio - 2), meio + 3);
    }

    return slice.map(item => ({
      name: String(item[labelKey] || '').replace('Território de Identidade ', '').trim(),
      val: Number(item[valueKey]),
      extra: Number(item[extraKey] || 0)
    }));
  })();

  return (
    <div className="flex-1 bg-white rounded-[24px] border border-gray-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col group cursor-default h-full">
      
      {/* HEADER + CONTROLES */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[#1A202C] font-bold text-[15px] tracking-tight">{title}</h3>
          <p className="text-[#A0AEC0] font-medium text-[11px] mt-0.5">{subtitle}</p>
        </div>

        <div className="flex flex-row items-center justify-center gap-[2px] bg-gray-50 border border-gray-100 rounded-[8px] p-1 mr-7 relative z-40">
          <button
            onClick={() => setFilterMode('top')}
            className={`p-0.5 rounded transition-all duration-300 ${filterMode === 'top' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
            title={topSubtitle}
          >
            <ChevronUp size={14} strokeWidth={3.5} />
          </button>
          <button
            onClick={() => setFilterMode('medium')}
            className={`p-0.5 rounded transition-all duration-300 ${filterMode === 'medium' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
            title={mediumSubtitle}
          >
            <Minus size={14} strokeWidth={3.5} />
          </button>
          <button
            onClick={() => setFilterMode('bottom')}
            className={`p-0.5 rounded transition-all duration-300 ${filterMode === 'bottom' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
            title={bottomSubtitle}
          >
            <ChevronDown size={14} strokeWidth={3.5} />
          </button>
        </div>
      </div>

      {/* ÁREA DO GRÁFICO */}
      <div className="flex-1 flex items-end justify-between gap-1.5 lg:gap-4 mt-2 px-1 pb-2 relative min-h-[140px]">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-gray-50 pb-6 z-0">
          <div className="w-full h-px bg-gray-50"></div>
          <div className="w-full h-px bg-gray-50"></div>
          <div className="w-full h-px bg-gray-50"></div>
        </div>

        {processedData.map((item, idx) => {
          const ratio = maxScale > 1 ? (item.val / maxScale) * 100 : item.val * 100;
          const barHeightPercent = Math.min(100, Math.max(10, ratio));

          return (
            <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end relative z-10 min-w-0 group/col">
              <div className="flex items-end justify-center w-full h-[80%] relative transition-transform duration-300">
                <div
                  className="w-full max-w-[20px] bg-[#4361EE] rounded-full relative flex justify-center transition-all duration-500 ease-out group-hover/col:opacity-90 group-hover/col:shadow-[0_0_15px_rgba(67,97,238,0.3)]"
                  style={{ height: `${barHeightPercent}%` }}
                >
                  <div className="absolute -top-1 w-2.5 h-2.5 bg-gray-200 rounded-full border-[2px] border-white opacity-0 group-hover/col:opacity-100 transition-opacity duration-300 z-20 shadow-sm flex items-center justify-center">
                    <div className="w-1 h-1 bg-[#1A202C] rounded-full"></div>
                  </div>

                  <span className="absolute -top-6 text-[9px] font-bold text-[#A0AEC0] group-hover/col:opacity-0 transition-opacity">
                    {item.val < 1 && item.val > 0 ? item.val.toFixed(3) : item.val}
                  </span>

                  {/* TOOLTIP FLUTUANTE */}
                  <div className="absolute bottom-[calc(100%+14px)] bg-[#1A202C] shadow-[0_10px_25px_rgba(0,0,0,0.15)] rounded-[12px] px-3 py-2.5 flex flex-col justify-center opacity-0 group-hover/col:opacity-100 transition-all duration-300 pointer-events-none z-30 translate-y-2 group-hover/col:translate-y-0 min-w-[105px] left-1/2 -translate-x-1/2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                      <span className="text-[11px] font-bold text-white leading-none">
                        {item.extra} <span className="text-[#A0AEC0] font-medium ml-0.5">{extraLabel}</span>
                      </span>
                    </div>
                    <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1A202C] rotate-45 rounded-sm"></div>
                  </div>
                </div>
              </div>

              {/* RÓTULO INFERIOR */}
              <div className="text-[9px] font-medium text-[#A0AEC0] text-center leading-tight truncate w-full group-hover/col:text-[#1A202C] transition-colors mt-2 px-0.5" title={item.name}>
                {item.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}