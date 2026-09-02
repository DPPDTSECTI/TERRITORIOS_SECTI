import React, { useState, useMemo, memo } from 'react';

// Função auxiliar para quebra e formatação inteligente dos territórios
const formatTerritoryName = (rawName) => {
  if (!rawName) return '';
  let clean = rawName.replace(/^Território de Identidade\s+/i, '').trim();

  const customMap = {
    'Metropolitana de Salvador': 'Metropolitana\nSalvador',
    'Metropolitano de Salvador': 'Metropolitano\nSalvador',
    'Portal do Sertão': 'Portal do\nSertão',
    'Litoral Sul': 'Litoral\nSul',
    'Litoral Norte e Agreste Baiano': 'Litoral Norte\nAgreste',
    'Sudoeste Baiano': 'Sudoeste\nBaiano',
    'Bacia do Jacuípe': 'Bacia do\nJacuípe',
    'Bacia do Paramirim': 'Bacia do\nParamirim',
    'Bacia do Rio Grande': 'Bacia do\nRio Grande',
    'Bacia do Rio Corrente': 'Bacia do\nRio Corrente',
    'Sertão do São Francisco': 'Sertão do\nSão Francisco',
    'Sertão Produtivo': 'Sertão\nProdutivo',
    'Médio Rio de Contas': 'Médio Rio\nde Contas',
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
    'Chapadão Ocidental da Bahia': 'Chapadão\nOcidental'
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
  allowToggleView = false,
  limit = 10,
  showTopBadge = true
}) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredTotalTerritory, setHoveredTotalTerritory] = useState(null);
  const [minimizedFilter, setMinimizedFilter] = useState('acima');

  const visibleData = useMemo(() => {
    if (!allowToggleView) return data.slice(0, limit);
    if (minimizedFilter === 'acima') return data.slice(0, limit);
    return data.slice(limit);
  }, [data, allowToggleView, minimizedFilter, limit]);

  const calculatedMax = useMemo(() => {
    if (maxScale) return maxScale;
    if (!visibleData.length) return 10;
    const maxTotal = Math.max(...visibleData.map(d => Number(d.total || 0)));
    return Math.ceil(maxTotal * 1.05) || 10;
  }, [visibleData, maxScale]);

  return (
    <div className="bg-white rounded-[24px] border border-transparent shadow-[0_4px_20px_rgba(29,53,87,0.04)] p-4 relative flex flex-col justify-between h-full group cursor-default min-h-0 overflow-hidden">

      {/* CABEÇALHO DO CARD */}
      <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
        <div className="flex flex-col">
          <h3 className="text-[13.5px] font-extrabold text-[#1D3557] tracking-tight flex items-center gap-2">
            {title}
          </h3>
          <span className="text-[10px] text-[#457B9D]">
            {subtitle}
          </span>
        </div>

        {/* BADGE TOP 10 OU BOTÕES DE TOGGLE */}
        {allowToggleView ? (
          <div className="flex items-center bg-surface-soft p-0.5 rounded-md border border-border">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMinimizedFilter('acima'); }}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${minimizedFilter === 'acima'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              Top {limit}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMinimizedFilter('abaixo'); }}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${minimizedFilter === 'abaixo'
                ? 'bg-primary-900 text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary-300"></span>
              Demais ({Math.max(0, data.length - limit)})
            </button>
          </div>
        ) : showTopBadge && data.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
            Top {Math.min(limit, data.length)}
          </span>
        ) : null}
      </div>

      {/* LEGENDA HORIZONTAL DAS CATEGORIAS */}
      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 my-1 text-[9px] font-medium text-[#457B9D] shrink-0 border-b border-[#F1F5F9] pb-1">
        {categories.map((cat) => (
          <div key={cat.key} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: cat.colorHex }}></span>
            <span className="truncate max-w-[130px] text-[#1D3557] font-semibold">{cat.shortLabel || cat.label}</span>
          </div>
        ))}
      </div>

      {/* ÁREA DO GRÁFICO DE BARRAS */}
      <div className="flex-1 w-full h-full relative min-h-0 pt-2 pb-0.5 px-1">
        <div className="relative w-full h-full">

          {/* LINHAS DE GRADE DISCRETAS */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-25 z-0 pb-7">
            <div className="w-full h-px bg-border"></div>
            <div className="w-full h-px bg-border"></div>
            <div className="w-full h-px bg-border"></div>
          </div>

          {/* BARRAS VERTICAIS */}
          <div className="w-full h-full flex items-end justify-between gap-1.5 sm:gap-2 relative">
            {visibleData.map((item, index) => {
              // Escala calibrada com base visual mínima de 18% para territórios pequenos
              const totalVal = Number(item.total || 0);
              const normalized = Math.max(0, totalVal / (calculatedMax || 1));
              const heightPercent = totalVal === 0 ? 0 : Math.min(100, Math.max(18, 16 + Math.pow(normalized, 0.72) * 84));

              const totalItems = visibleData.length;
              const formattedName = formatTerritoryName(item.label);

              const isFirst = index === 0;
              const isLast = index >= totalItems - 2;

              return (
                <div
                  key={index}
                  onMouseLeave={() => {
                    setHoveredSlice(null);
                    setHoveredTotalTerritory(null);
                  }}
                  className="flex-1 h-full flex flex-col items-center justify-end group/bar relative cursor-pointer min-w-0"
                >
                  {/* TOOLTIP COMPACTO DE FATIA INDIVIDUAL (ELEGANTE E SEM OVERFLOW) */}
                  {hoveredSlice && hoveredSlice.label === item.label && !hoveredTotalTerritory && (
                    <div
                      className={`absolute bottom-full mb-2 bg-surface text-text-primary shadow-sm rounded-lg px-2.5 py-1.5 pointer-events-none z-[100] whitespace-nowrap text-left flex flex-col gap-1 border border-border min-w-[140px] max-w-[190px] transition-all duration-150 animate-in fade-in zoom-in-95 ${isFirst ? 'left-0' : isLast ? 'right-0' : 'left-1/2 -translate-x-1/2'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-text-primary truncate max-w-[100px]">
                          {hoveredSlice.label}
                        </span>
                        <span className="text-[9px] font-medium text-text-muted bg-surface-soft px-1.5 py-0.2 rounded-lg shrink-0 inline-flex items-center justify-center leading-none">
                          {hoveredSlice.total} tot
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-border">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0 border border-border" style={{ backgroundColor: hoveredSlice.colorHex }}></span>
                          <span className="text-[10px] font-medium text-text-secondary truncate">
                            {hoveredSlice.segmentName}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-text-primary px-1.5 py-0.2 rounded bg-surface-soft shrink-0">
                          {hoveredSlice.count}
                        </span>
                      </div>

                      <div className={`absolute -bottom-[5px] w-2 h-2 bg-surface rotate-45 border-r border-b border-border ${isFirst ? 'left-3' : isLast ? 'right-3' : 'left-1/2 -translate-x-1/2'
                        }`}></div>
                    </div>
                  )}

                  {/* TOOLTIP COMPLETO DE TODOS OS ATIVOS (AO PASSAR O MOUSE NO NÚMERO / BOLINHA SUPERIOR) */}
                  {hoveredTotalTerritory && hoveredTotalTerritory.label === item.label && (
                    <div
                      className={`absolute bottom-full mb-2 bg-surface text-text-primary shadow-sm rounded-xl p-2.5 pointer-events-none z-[100] whitespace-nowrap text-left flex flex-col gap-1.5 border border-border min-w-[165px] max-w-[210px] transition-all duration-150 animate-in fade-in zoom-in-95 ${isFirst ? 'left-0' : isLast ? 'right-0' : 'left-1/2 -translate-x-1/2'
                        }`}
                    >
                      <div className="flex items-center justify-between border-b border-border pb-1 gap-2">
                        <span className="text-[11px] font-medium text-text-primary truncate max-w-[115px]">
                          {hoveredTotalTerritory.label}
                        </span>
                        <span className="text-[9px] font-medium text-text-muted bg-surface-soft px-2 py-0.5 rounded-full shrink-0 inline-flex items-center justify-center leading-none">
                          {hoveredTotalTerritory.total} ativos
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 text-[9px] text-text-secondary max-h-[140px] overflow-hidden">
                        {categories.filter(c => Number(item.segments?.[c.key] || 0) > 0).map(c => (
                          <div key={c.key} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.colorHex }}></span>
                              <span className="truncate max-w-[110px]">{c.shortLabel || c.label}</span>
                            </div>
                            <span className="font-semibold text-text-primary bg-surface-soft px-1 rounded">{item.segments[c.key]}</span>
                          </div>
                        ))}
                      </div>

                      <div className={`absolute -bottom-[5px] w-2 h-2 bg-surface rotate-45 border-r border-b border-border ${isFirst ? 'left-3' : isLast ? 'right-3' : 'left-1/2 -translate-x-1/2'
                        }`}></div>
                    </div>
                  )}

                  {/* INDICADOR DE TOTAL NO TOPO DA BARRA (BOLINHA / NÚMERO INTERATIVO) */}
                  <div
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setHoveredSlice(null);
                      setHoveredTotalTerritory({
                        label: item.label,
                        total: totalVal,
                        segments: item.segments
                      });
                    }}
                    className="flex items-center justify-center min-w-[18px] px-1 py-0.2 rounded-lg bg-surface-soft border border-border text-[9px] font-medium text-text-secondary group-hover/bar:bg-primary-900 group-hover/bar:text-white group-hover/bar:scale-110 transition-all mb-1 select-none cursor-pointer shadow-2xs leading-none"
                    title="Ver todos os ativos da região"
                  >
                    {totalVal}
                  </div>

                  {/* BARRA VERTICAL MODERNA COM ARREDONDAMENTO LEVE */}
                  <div className="w-full flex items-end justify-center h-full relative">
                    <div
                      className="w-full max-w-[15px] sm:max-w-[18px] rounded-t-[4px] rounded-b-[2px] relative flex flex-col-reverse overflow-hidden transition-all duration-300 ease-out group-hover/bar:scale-105 group-hover/bar:ring-2 group-hover/bar:ring-primary-600/40 shadow-xs border border-black/5"
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
                              setHoveredTotalTerritory(null);
                              setHoveredSlice({
                                label: item.label,
                                key: cat.key,
                                segmentName: cat.shortLabel || cat.label,
                                colorHex: cat.colorHex,
                                count,
                                total: item.total
                              });
                            }}
                            className={`w-full transition-all duration-150 cursor-pointer min-h-[4px] border-b-[1px] border-white/80 last:border-b-0 ${isThisSliceHovered ? 'brightness-125 saturate-150 ring-1 ring-white z-10' : 'hover:brightness-110'
                              }`}
                            style={{ height: `${segPercent}%`, backgroundColor: cat.colorHex }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* RÓTULO DO TERRITÓRIO */}
                  <div
                    className="w-full h-[28px] flex items-start justify-center mt-1 px-0.5 text-center leading-[11px] select-none"
                    title={item.label}
                  >
                    <span className="text-[8.5px] font-semibold text-[#457B9D] group-hover/bar:text-[#1D3557] transition-colors whitespace-pre-line break-words">
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