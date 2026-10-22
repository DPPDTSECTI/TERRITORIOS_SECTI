import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Minus, MapPin, X } from 'lucide-react';
import { useChartTheme } from './chartTheme';

function normalizeSimple(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^(territorio\s+de\s+identidade|territorio\s+identidade|territorio)\s+/i, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Gráfico genérico de Barras Verticais para rankings com cores e tokens do Design System.
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
  highlightLabel = null,
  maxScale = 1,
  badge = null,
  isSemiarido = false,
  cardClassName = ''
}) {
  const [filterMode, setFilterMode] = useState('top');
  const chartTheme = useChartTheme();

  useEffect(() => {
    if (highlightLabel) {
      setFilterMode('focus');
    } else {
      setFilterMode('top');
    }
  }, [highlightLabel]);

  const allRanked = useMemo(() => {
    return [...data]
      .filter(item => item[valueKey] !== null && !isNaN(Number(item[valueKey])))
      .sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]))
      .map((item, index) => {
        const rawName = String(item[labelKey] || '').replace(/^Território de Identidade\s+/i, '').trim();
        return {
          ...item,
          rank: index + 1,
          cleanName: rawName,
          normName: normalizeSimple(rawName),
          val: Number(item[valueKey]),
          extra: Number(item[extraKey] || 0)
        };
      });
  }, [data, valueKey, labelKey, extraKey]);

  const highlightedItem = useMemo(() => {
    if (!highlightLabel || allRanked.length === 0) return null;
    const normTarget = normalizeSimple(highlightLabel);
    return allRanked.find(item =>
      item.normName === normTarget ||
      item.normName.includes(normTarget) ||
      normTarget.includes(item.normName)
    );
  }, [highlightLabel, allRanked]);

  const subtitle = useMemo(() => {
    if (filterMode === 'focus' && highlightedItem) {
      return `Posição de ${highlightedItem.cleanName} (${highlightedItem.rank}º de ${allRanked.length})`;
    }
    if (filterMode === 'top' || filterMode === 'focus') return topSubtitle;
    if (filterMode === 'medium') return mediumSubtitle;
    return bottomSubtitle;
  }, [filterMode, highlightedItem, allRanked.length, topSubtitle, mediumSubtitle, bottomSubtitle]);

  const processedData = useMemo(() => {
    if (allRanked.length === 0) return [];

    let slice = [];
    if (filterMode === 'focus' && highlightedItem) {
      const targetIdx = allRanked.findIndex(x => x.normName === highlightedItem.normName);
      if (targetIdx !== -1) {
        let start = Math.max(0, targetIdx - 2);
        let end = start + 5;
        if (end > allRanked.length) {
          end = allRanked.length;
          start = Math.max(0, end - 5);
        }
        slice = allRanked.slice(start, end);
      } else {
        slice = allRanked.slice(0, 5);
      }
    } else if (filterMode === 'bottom') {
      slice = allRanked.slice(-5).reverse();
    } else if (filterMode === 'medium') {
      const meio = Math.floor(allRanked.length / 2);
      slice = allRanked.slice(Math.max(0, meio - 2), meio + 3);
    } else {
      slice = allRanked.slice(0, 5);
    }

    return slice;
  }, [allRanked, filterMode, highlightedItem]);

  return (
    <div className={`flex-1 bg-surface rounded-card border border-border p-4 sm:p-4.5 relative flex flex-col group cursor-default h-full min-h-0 ${cardClassName}`}>

      {/* HEADER + CONTROLES */}
      <div className="flex justify-between items-start mb-2 shrink-0">
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-text-primary font-semibold text-subtitle tracking-tight">{title}</h3>
            {badge && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-caption font-medium bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border border-accent-100 dark:border-accent-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></span>
                {badge}
              </span>
            )}
            {highlightedItem && (
              <span className={`text-caption font-semibold tabular-nums px-2.5 py-0.5 rounded-full shrink-0 inline-flex items-center justify-center leading-none ${
                (isSemiarido || !!badge)
                  ? 'bg-accent-50 text-accent-800 dark:bg-accent-950 dark:text-accent-200 border border-accent-200/60'
                  : 'bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-200 border border-primary-200/60'
              }`}>
                {highlightedItem.rank}º no Estado
              </span>
            )}
          </div>
          <p className="text-text-muted font-normal text-caption mt-0.5 truncate">{subtitle}</p>
        </div>

        <div className="flex flex-row items-center justify-center gap-0.5 bg-surface-sunken border border-border rounded-full p-0.5 relative z-40 shrink-0 shadow-2xs">
          {highlightedItem && (
            <button
              onClick={() => setFilterMode('focus')}
              className={`w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center ${filterMode === 'focus' ? ((isSemiarido || !!badge) ? 'text-accent-600 bg-surface shadow-xs font-medium' : 'text-primary-600 bg-surface shadow-xs font-medium') : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'}`}
              title={`Foco em ${highlightedItem.cleanName} (${highlightedItem.rank}º de ${allRanked.length})`}
              aria-label={`Foco em ${highlightedItem.cleanName}`}
            >
              <MapPin size={13} strokeWidth={2.2} />
            </button>
          )}
          <button
            onClick={() => setFilterMode('top')}
            className={`w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center ${filterMode === 'top' ? ((isSemiarido || !!badge) ? 'text-accent-600 bg-surface shadow-xs font-medium' : 'text-primary-600 bg-surface shadow-xs font-medium') : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'}`}
            title={topSubtitle}
            aria-label={topSubtitle}
          >
            <ChevronUp size={14} strokeWidth={2.2} />
          </button>
          <button
            onClick={() => setFilterMode('medium')}
            className={`w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center ${filterMode === 'medium' ? ((isSemiarido || !!badge) ? 'text-accent-600 bg-surface shadow-xs font-medium' : 'text-primary-600 bg-surface shadow-xs font-medium') : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'}`}
            title={mediumSubtitle}
            aria-label={mediumSubtitle}
          >
            <Minus size={14} strokeWidth={2.2} />
          </button>
          <button
            onClick={() => setFilterMode('bottom')}
            className={`w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center ${filterMode === 'bottom' ? ((isSemiarido || !!badge) ? 'text-accent-600 bg-surface shadow-xs font-medium' : 'text-primary-600 bg-surface shadow-xs font-medium') : 'text-text-muted hover:text-text-primary hover:bg-surface-soft'}`}
            title={bottomSubtitle}
            aria-label={bottomSubtitle}
          >
            <ChevronDown size={14} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="w-full h-px bg-border/70 mb-2 shrink-0"></div>

      {/* ÁREA DO GRÁFICO (BARRAS HORIZONTAIS) */}
      {data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 opacity-60 mt-4">
          <X size={64} className={(isSemiarido || !!badge) ? "text-accent-500" : "text-primary-500"} strokeWidth={2} />
          <span className="text-text-muted font-medium text-body-sm">Nenhum dado disponível</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between py-0.5 w-full min-h-0 gap-1.5">
          {processedData.map((item, idx) => {
            const isSelected = highlightedItem && item.normName === highlightedItem.normName;
            const maxVal = Math.max(...processedData.map(d => Number(d.val) || 0), 0.001);
            const val = Number(item.val) || 0;
            const percentOfMax = Math.min(100, Math.round((val / maxVal) * 100));
            const rankNum = item.rank || idx + 1;
            const rankStr = String(rankNum).padStart(2, '0');
            const isFirst = idx === 0 && (filterMode === 'top' || filterMode === 'focus');
            const isSemi = isSemiarido || !!badge;

            const rankStyle = isFirst
              ? (isSemi ? 'bg-accent-600 text-white shadow-xs font-bold' : 'bg-primary-600 text-white shadow-xs font-bold')
              : isSelected
                ? (isSemi ? 'bg-accent-700 text-white shadow-xs font-bold' : 'bg-primary-700 text-white shadow-xs font-bold')
                : (isSemi ? 'bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border border-accent-200/60' : 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60');

            const fillColor = isFirst
              ? (isSemi ? 'bg-accent-500' : 'bg-primary-600')
              : isSelected
                ? (isSemi ? 'bg-accent-400' : 'bg-primary-500')
                : (isSemi ? 'bg-accent-200/80 dark:bg-accent-500/30' : 'bg-primary-200/80 dark:bg-primary-500/30');

            const textStyle = (isFirst || isSelected)
              ? 'font-semibold text-white drop-shadow-xs'
              : (isSemi ? 'font-semibold text-accent-950 dark:text-accent-100' : 'font-semibold text-text-primary');

            const valueStyle = isFirst
              ? (isSemi ? 'bg-accent-600 text-white shadow-xs font-bold' : 'bg-primary-600 text-white shadow-xs font-bold')
              : isSelected
                ? (isSemi ? 'bg-accent-100 text-accent-900 dark:text-accent-100 border border-accent-300 font-bold' : 'bg-primary-100 text-primary-900 dark:text-primary-100 border border-primary-300 font-bold')
                : (isSemi ? 'bg-surface-sunken text-accent-900 dark:text-accent-200 border border-border/80 font-bold' : 'bg-surface-sunken text-text-primary dark:text-zinc-200 border border-border/80 font-bold');

            const formattedVal = val < 1 && val > 0 ? val.toFixed(3).replace('.', ',') : String(val);

            return (
              <div
                key={idx}
                title={`${item.rank}º · ${item.cleanName} (IFDM: ${formattedVal}${item.extra > 0 ? ` · ${item.extra} ${extraLabel}` : ''})`}
                className={`group/row relative flex items-center gap-2 sm:gap-2.5 w-full min-w-0 transition-all duration-150 hover:scale-[1.006] cursor-default ${
                  isSelected ? (isSemi ? 'ring-2 ring-accent-400/80 rounded-xl p-0.5 -m-0.5' : 'ring-2 ring-primary-500/80 rounded-xl p-0.5 -m-0.5') : ''
                }`}
              >
                {/* RANK PILL */}
                <div className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full shrink-0 flex items-center justify-center text-caption tabular-nums leading-none shadow-2xs ${rankStyle}`}>
                  {rankStr}
                </div>

                {/* BARRA: TRACK + FILL + NOME */}
                <div className={`relative flex-1 h-[30px] sm:h-[32px] rounded-xl sm:rounded-full ${isSemi ? 'bg-accent-50/60 dark:bg-accent-950/40 border border-accent-200/50 dark:border-accent-800/50' : 'bg-surface-sunken border border-border/70'} overflow-hidden min-w-0 flex items-center shadow-2xs`}>
                  <div
                    className={`absolute left-0 top-0 bottom-0 rounded-xl sm:rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                    style={{ width: `${percentOfMax}%` }}
                  />

                  <span className={`absolute left-3 right-3 text-caption sm:text-body-sm truncate leading-none pointer-events-none select-none z-10 tracking-tight ${textStyle}`}>
                    {item.cleanName}
                  </span>
                </div>

                {/* VALOR PILL */}
                <div className={`h-[30px] sm:h-[32px] min-w-[56px] sm:min-w-[62px] px-2.5 sm:px-3 rounded-xl sm:rounded-full shrink-0 flex items-center justify-center text-caption sm:text-body-sm tabular-nums leading-none shadow-2xs ${valueStyle}`}>
                  {formattedVal}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}