import React, { useState, useMemo, memo } from 'react';
import { useChartTheme } from './chartTheme';

// Função auxiliar para quebra e formatação inteligente dos territórios
const formatTerritoryName = (rawName) => {
  if (!rawName) return '';
  let clean = rawName.replace(/^Território de Identidade\s+/i, '').trim();

  const customMap = {
    'Metropolitana de Salvador': 'Metropolitana\nSalvador',
    'Metropolitano de Salvador': 'Metropolitano\nSalvador',
    'Portal do Sertão': 'Portal do\nSertão',
    'Litoral Sul': 'Litoral\nSul',
    'Litoral Norte e Agreste Baiano': 'Lit. Norte\nAgreste',
    'Sudoeste Baiano': 'Sudoeste\nBaiano',
    'Bacia do Jacuípe': 'Bacia do\nJacuípe',
    'Bacia do Paramirim': 'Bacia\nParamirim',
    'Bacia do Rio Grande': 'Bacia Rio\nGrande',
    'Bacia do Rio Corrente': 'Bacia Rio\nCorrente',
    'Sertão do São Francisco': 'Sertão São\nFrancisco',
    'Sertão Produtivo': 'Sertão\nProdutivo',
    'Médio Rio de Contas': 'Médio Rio\nContas',
    'Médio Sudoeste da Bahia': 'Médio\nSudoeste',
    'Vale do Jiquiriçá': 'Vale do\nJiquiriçá',
    'Velho Chico': 'Velho\nChico',
    'Costa do Descobrimento': 'Costa do\nDescobrim.',
    'Extremo Sul': 'Extremo\nSul',
    'Piemonte da Diamantina': 'Piemonte\nDiamantina',
    'Piemonte do Paraguaçu': 'Piemonte\nParaguaçu',
    'Piemonte Norte do Itapicuru': 'Piemonte\nItapicuru',
    'Semiárido Nordeste II': 'Semiárido\nNordeste',
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
  showTopBadge = true,
  isSemiarido = false,
  cardClassName = ''
}) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredTotalTerritory, setHoveredTotalTerritory] = useState(null);
  const [minimizedFilter, setMinimizedFilter] = useState('acima');
  const chartTheme = useChartTheme();

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
    <div className={`bg-surface rounded-card border ${isSemiarido ? 'border-accent-200/50 dark:border-accent-500/30 shadow-card' : 'border-border shadow-card'} p-4 lg:p-5 relative flex flex-col justify-between h-full group cursor-default min-h-0 overflow-hidden ${cardClassName}`}>

      {/* CABEÇALHO DO CARD */}
      <div className="flex items-center justify-between gap-2 mb-1.5 shrink-0">
        <div className="flex flex-col">
          <h3 className="text-subtitle font-bold text-text-primary tracking-tight flex items-center gap-2">
            {title}
          </h3>
          <span className="text-caption text-text-muted">
            {subtitle}
          </span>
        </div>

        {/* BADGE TOP 10 OU BOTÕES DE TOGGLE */}
        {allowToggleView ? (
          <div className="flex items-center bg-surface-sunken p-0.5 rounded-control border border-border">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMinimizedFilter('acima'); }}
              className={`px-2.5 py-1 text-caption font-semibold rounded-[8px] transition-all flex items-center gap-1 cursor-pointer ${minimizedFilter === 'acima'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              Top {limit}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMinimizedFilter('abaixo'); }}
              className={`px-2.5 py-1 text-caption font-semibold rounded-[8px] transition-all flex items-center gap-1 cursor-pointer ${minimizedFilter === 'abaixo'
                ? 'bg-primary-900 text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary-300"></span>
              Demais ({Math.max(0, data.length - limit)})
            </button>
          </div>
        ) : showTopBadge && data.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-micro font-bold bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-600"></span>
            Top {Math.min(limit, data.length)}
          </span>
        ) : null}
      </div>

      {/* LEGENDA HORIZONTAL DAS CATEGORIAS */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 my-1 text-caption font-semibold text-text-primary shrink-0 border-b border-border/70 pb-2">
        {categories.map((cat, idx) => {
          const color = cat.colorHex || chartTheme.palette[idx % chartTheme.palette.length];
          return (
            <div key={cat.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: color }}></span>
              <span className="truncate max-w-[140px] text-text-secondary font-medium text-caption">{cat.shortLabel || cat.label}</span>
            </div>
          );
        })}
      </div>

      {/* ÁREA DO GRÁFICO DE BARRAS */}
      <div className="flex-1 w-full h-full relative min-h-0 pt-2 pb-0.5 px-1 flex flex-col justify-between">
        <div className="flex-1 w-full relative min-h-0">
          {/* LINHAS DE GRADE DISCRETAS */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30 z-0 pb-1">
            <div className="w-full h-px bg-border"></div>
            <div className="w-full h-px bg-border"></div>
            <div className="w-full h-px bg-border"></div>
          </div>

          {/* BARRAS VERTICAIS */}
          <div className="w-full h-full flex items-end justify-between gap-1.5 sm:gap-2 relative z-10">
            {visibleData.map((item, index) => {
              const totalVal = Number(item.total || 0);
              const normalized = Math.max(0, totalVal / (calculatedMax || 1));
              const heightPercent = totalVal === 0 ? 0 : Math.min(100, Math.max(12, Math.pow(normalized, 0.85) * 88 + 10));

              const totalItems = visibleData.length;
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
                  {/* TOOLTIP COMPACTO DE FATIA INDIVIDUAL */}
                  {hoveredSlice && hoveredSlice.label === item.label && !hoveredTotalTerritory && (
                    <div
                      className={`absolute bottom-full mb-2 bg-surface-raised text-text-primary shadow-float rounded-control px-2.5 py-1.5 pointer-events-none z-[100] whitespace-nowrap text-left flex flex-col gap-1 border border-border min-w-[140px] max-w-[190px] transition-all duration-150 ${isFirst ? 'left-0' : isLast ? 'right-0' : 'left-1/2 -translate-x-1/2'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-caption font-semibold text-text-primary truncate max-w-[100px]">
                          {hoveredSlice.label}
                        </span>
                        <span className="text-micro tnum font-semibold text-text-muted bg-surface-sunken px-1.5 py-0.5 rounded-full shrink-0 inline-flex items-center justify-center leading-none">
                          {hoveredSlice.total} tot
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-border/70">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0 border border-border" style={{ backgroundColor: hoveredSlice.colorHex }}></span>
                          <span className="text-caption font-medium text-text-secondary truncate">
                            {hoveredSlice.segmentName}
                          </span>
                        </div>
                        <span className="text-caption font-semibold tnum text-text-primary px-1.5 py-0.5 rounded bg-surface-sunken shrink-0">
                          {hoveredSlice.count}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TOOLTIP COMPLETO DE TODOS OS ATIVOS */}
                  {hoveredTotalTerritory && hoveredTotalTerritory.label === item.label && (
                    <div
                      className={`absolute bottom-full mb-2 bg-surface-raised text-text-primary shadow-float rounded-control p-2.5 pointer-events-none z-[100] whitespace-nowrap text-left flex flex-col gap-1.5 border border-border min-w-[165px] max-w-[210px] transition-all duration-150 ${isFirst ? 'left-0' : isLast ? 'right-0' : 'left-1/2 -translate-x-1/2'
                        }`}
                    >
                      <div className="flex items-center justify-between border-b border-border/70 pb-1 gap-2">
                        <span className="text-caption font-semibold text-text-primary truncate max-w-[115px]">
                          {hoveredTotalTerritory.label}
                        </span>
                        <span className="text-micro tnum font-semibold text-text-muted bg-surface-sunken px-2 py-0.5 rounded-full shrink-0 inline-flex items-center justify-center leading-none">
                          {hoveredTotalTerritory.total} ativos
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 text-caption text-text-secondary max-h-[140px] overflow-hidden">
                        {categories.filter(c => Number(item.segments?.[c.key] || 0) > 0).map((c, cIdx) => (
                          <div key={c.key} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.colorHex || chartTheme.palette[cIdx % chartTheme.palette.length] }}></span>
                              <span className="truncate max-w-[110px] text-caption">{c.shortLabel || c.label}</span>
                            </div>
                            <span className="font-semibold tnum text-text-primary bg-surface-sunken px-1 rounded text-caption">{item.segments[c.key]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* INDICADOR DE TOTAL NO TOPO DA BARRA */}
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
                    className="flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-control bg-surface-sunken border border-border text-micro tnum font-bold text-text-primary group-hover/bar:bg-primary-600 group-hover/bar:text-white group-hover/bar:scale-105 transition-all mb-1 select-none cursor-pointer shadow-xs leading-none shrink-0"
                    title="Ver todos os ativos da região"
                  >
                    {totalVal}
                  </div>

                  {/* BARRA VERTICAL MODERNA */}
                  <div className="w-full flex items-end justify-center flex-1 min-h-0 relative">
                    <div
                      className="w-full max-w-[18px] sm:max-w-[21px] rounded-t-control rounded-b-[2px] relative flex flex-col-reverse overflow-hidden transition-all duration-300 ease-out group-hover/bar:scale-105 group-hover/bar:ring-2 group-hover/bar:ring-primary-600/40 shadow-xs border border-black/5"
                      style={{ height: `${heightPercent}%` }}
                    >
                      {categories.map((cat, catIndex) => {
                        const count = Number(item.segments?.[cat.key] || 0);
                        if (count === 0) return null;
                        const segPercent = (count / (item.total || 1)) * 100;
                        const isThisSliceHovered = hoveredSlice?.label === item.label && hoveredSlice?.key === cat.key;
                        const sliceColor = cat.colorHex || chartTheme.palette[catIndex % chartTheme.palette.length];

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
                                colorHex: sliceColor,
                                count,
                                total: item.total
                              });
                            }}
                            className={`w-full transition-all duration-150 cursor-pointer min-h-[4px] border-b-[1px] border-white/80 dark:border-black/30 last:border-b-0 ${isThisSliceHovered ? 'brightness-125 saturate-150 ring-1 ring-white z-10' : 'hover:brightness-110'
                              }`}
                            style={{ height: `${segPercent}%`, backgroundColor: sliceColor }}
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

        {/* LINHA DE BASE HORIZONTAL COMPARTILHADA */}
        <div className="w-full h-px bg-border shrink-0 my-1" />

        {/* ÁREA DOS RÓTULOS DOS TERRITÓRIOS */}
        <div className="w-full flex items-start justify-between gap-1.5 sm:gap-2 shrink-0 h-[32px] overflow-visible">
          {visibleData.map((item, index) => {
            const formattedName = formatTerritoryName(item.label);
            return (
              <div
                key={index}
                className="flex-1 flex items-start justify-center px-0.5 text-center leading-[11px] select-none min-w-0"
                title={item.label}
              >
                <span className="text-micro font-semibold text-text-secondary group-hover/bar:text-text-primary transition-colors whitespace-pre-line break-words">
                  {formattedName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(StackedBarChart);