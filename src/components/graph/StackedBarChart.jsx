import React, { useState, useMemo, memo } from 'react';

// Função auxiliar para quebra e formatação inteligente dos territórios
const formatTerritoryName = (rawName) => {
  if (!rawName) return '';
  let clean = rawName.replace(/^Território de Identidade\s+/i, '').trim();

  const customMap = {
    'Metropolitana de Salvador': 'Metropolitana\nSalvador',
    'Portal do Sertão': 'Portal do\nSertão',
    'Litoral Sul': 'Litoral\nSul',
    'Litoral Norte e Agreste Baiano': 'Litoral Norte\nAgreste',
    'Sudoeste Baiano': 'Sudoeste\nBaiano',
    'Bacia do Jacuípe': 'Bacia do\nJacuípe',
    'Bacia do Paramirim': 'Bacia do\nParamirim',
    'Bacia do Rio Grande': 'Bacia Rio\nGrande',
    'Bacia do Rio Corrente': 'Bacia Rio\nCorrente',
    'Sertão do São Francisco': 'Sertão São\nFrancisco',
    'Sertão Produtivo': 'Sertão\nProdutivo',
    'Médio Rio de Contas': 'Médio Rio\nContas',
    'Médio Sudoeste da Bahia': 'Médio\nSudoeste',
    'Vale do Jiquiriçá': 'Vale do\nJiquiriçá',
    'Velho Chico': 'Velho\nChico',
    'Costa do Descobrimento': 'Costa do\nDescobrimento',
    'Extremo Sul': 'Extremo\nSul',
    'Piemonte da Diamantina': 'Piemonte\nDiamantina',
    'Piemonte do Paraguaçu': 'Piemonte\nParaguaçu',
    'Piemonte Norte do Itapicuru': 'Piemonte\nItapicuru',
    'Semiárido Nordeste II': 'Semiárido\nNordeste II',
    'Irecê': 'Irecê',
    'Chapadão Ocidental da Bahia': 'Chapadão\nOcidental',
    'Bacia do Rio Grande': 'Bacia Rio\nGrande'
  };

  if (customMap[clean]) return customMap[clean];

  const words = clean.split(' ');
  if (words.length > 1) {
    const mid = Math.ceil(words.length / 2);
    return `${words.slice(0, mid).join(' ')}\n${words.slice(mid).join(' ')}`;
  }

  return clean;
};

function StackedBarChart({
  data = [],
  categories = [],
  title = "Ativos por Região",
  subtitle = "26 Territórios de Identidade",
  maxScale,
  allowToggleView = true
}) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [minimizedFilter, setMinimizedFilter] = useState('acima'); // 'acima' (Top 10) | 'abaixo' (Demais)

  const calculatedMax = useMemo(() => {
    if (maxScale) return maxScale;
    if (!data.length) return 10;
    const maxTotal = Math.max(...data.map(d => Number(d.total || 0)));
    return Math.ceil(maxTotal * 1.08) || 10;
  }, [data, maxScale]);

  const visibleData = useMemo(() => {
    if (!allowToggleView) return data;
    if (minimizedFilter === 'acima') return data.slice(0, 10);
    return data.slice(10);
  }, [data, allowToggleView, minimizedFilter]);

  return (
    <div className="bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default min-h-0">
      
      {/* CABEÇALHO DO CARD */}
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0 pr-8 relative z-20">
        <div className="flex flex-col">
          <h3 className="text-[#1D3557] font-extrabold text-[13px] tracking-tight flex items-center gap-2">
            {title}
          </h3>
          <span className="text-[10px] font-semibold text-[#457B9D]">
            {subtitle}
          </span>
        </div>

        {/* BOTÕES TOP 10 / DEMAIS */}
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

      {/* LEGENDA HORIZONTAL DAS CATEGORIAS */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 my-1.5 text-[9.5px] font-semibold text-[#457B9D] shrink-0">
        {categories.slice(0, 7).map((cat) => (
          <div key={cat.key} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: cat.colorHex }}></span>
            <span className="truncate max-w-[110px] text-[#1D3557]">{cat.shortLabel || cat.label}</span>
          </div>
        ))}
      </div>

      {/* ÁREA DO GRÁFICO DE BARRAS */}
      <div className="flex-1 w-full h-full relative min-h-0 pt-6 pb-0.5 px-1">
        <div className="relative w-full h-full">
          
          {/* LINHAS DE GRADE DISCRETAS */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-25 z-0 pb-7">
            <div className="w-full h-px bg-[#D6EAF8]"></div>
            <div className="w-full h-px bg-[#D6EAF8]"></div>
            <div className="w-full h-px bg-[#D6EAF8]"></div>
          </div>

          {/* BARRAS VERTICAIS */}
          <div className="w-full h-full flex items-end justify-between gap-1.5 sm:gap-2 relative z-10">
            {visibleData.map((item, index) => {
              const heightPercent = Math.min(100, Math.max(8, (Number(item.total || 0) / calculatedMax) * 100));
              const totalItems = visibleData.length;
              const formattedName = formatTerritoryName(item.label);
              
              const isFirst = index === 0;
              const isLast = index >= totalItems - 2;

              return (
                <div
                  key={index}
                  onMouseLeave={() => setHoveredSlice(null)}
                  className="flex-1 h-full flex flex-col items-center justify-end group/bar relative cursor-pointer min-w-0"
                >
                  {/* TOOLTIP FLUTUANTE CENTRALIZADO */}
                  {hoveredSlice && hoveredSlice.label === item.label && (
                    <div
                      className={`absolute bottom-[calc(100%+10px)] bg-[#1D3557] text-white shadow-[0_12px_32px_rgba(29,53,87,0.45)] rounded-xl p-2.5 pointer-events-none z-[100] whitespace-nowrap text-left flex flex-col gap-1.5 border border-white/15 min-w-[160px] max-w-[210px] transition-all duration-200 animate-in fade-in zoom-in-95 ${
                        isFirst ? 'left-0' : isLast ? 'right-0' : 'left-1/2 -translate-x-1/2'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-white/15 pb-1 gap-2">
                        <span className="text-[10.5px] font-extrabold text-white truncate max-w-[120px]">
                          {hoveredSlice.label}
                        </span>
                        <span className="text-[9px] font-bold text-[#A8DADC] bg-white/10 px-1.5 py-0.5 rounded-full shrink-0">
                          {hoveredSlice.total} ativos
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: hoveredSlice.colorHex }}></span>
                          <span className="text-[10px] font-medium text-white/90 truncate">
                            {hoveredSlice.segmentName}
                          </span>
                        </div>
                        <span className="text-[11px] font-black text-white px-1.5 py-0.2 rounded bg-white/15 shrink-0">
                          {hoveredSlice.count}
                        </span>
                      </div>

                      <div className={`absolute -bottom-1 w-2 h-2 bg-[#1D3557] rotate-45 border-r border-b border-white/15 ${
                        isFirst ? 'left-3' : isLast ? 'right-3' : 'left-1/2 -translate-x-1/2'
                      }`}></div>
                    </div>
                  )}

                  {/* CÁPSULA VERTICAL */}
                  <div className="w-full flex items-end justify-center h-full relative">
                    <div
                      className="w-full max-w-[14px] sm:max-w-[16px] rounded-full relative flex flex-col-reverse overflow-hidden transition-all duration-300 ease-out group-hover/bar:scale-108 group-hover/bar:ring-2 group-hover/bar:ring-[#2563EB]/40 shadow-xs"
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
                                segmentName: cat.shortLabel || cat.label,
                                colorHex: cat.colorHex,
                                count,
                                total: item.total
                              });
                            }}
                            className={`w-full transition-all duration-150 cursor-pointer min-h-[2px] ${
                              isThisSliceHovered ? 'brightness-125 saturate-150 ring-1 ring-white' : 'hover:brightness-110'
                            }`}
                            style={{ height: `${segPercent}%`, backgroundColor: cat.colorHex }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* RÓTULO DO TERRITÓRIO COM QUEBRA DE LINHA */}
                  <div 
                    className="w-full h-[26px] flex items-start justify-center mt-1.5 px-0.5 text-center leading-[10px] select-none"
                    title={item.label}
                  >
                    <span className="text-[7.5px] sm:text-[8px] font-bold text-[#A0AEC0] group-hover/bar:text-[#1D3557] transition-colors whitespace-pre-line line-clamp-2 break-words">
                      {formattedName}
                    </span>
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

export default memo(StackedBarChart);