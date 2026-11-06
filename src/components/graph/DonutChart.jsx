import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useChartTheme } from './chartTheme';
import { useData } from '../../context/DataContext';

/**
 * Componente DonutChart padronizado com anéis proporcionais e ranking lateral.
 */
export default function DonutChart({
  data = [],
  topList = [],
  title = "Cursos por Área",
  subtitle = "Distribuição oficial de cursos no estado",
  totalLabel = "Total de Cursos",
  listTitle = "Top 5 Instituições",
  showTopList = true,
  badge = null,
  isSemiarido = false,
  cardClassName = '',
  children
}) {
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const chartTheme = useChartTheme();
  const { filtroSemiarido } = useData() || {};
  const isSemi = Boolean(isSemiarido || filtroSemiarido || badge === 'Semiárido' || !!badge);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 5);
  const maxValue = sortedData.length > 0 ? sortedData[0].value : 0;
  const totalValue = data.reduce((acc, item) => acc + item.value, 0);

  const normalizedData = sortedData.map((d, index) => ({
    ...d,
    color: d.color || chartTheme.palette[index % chartTheme.palette.length],
    percent: maxValue > 0 ? d.value / maxValue : 0
  }));

  const size = 136;
  const strokeWidth = 6.5;
  const gap = 6;
  const center = size / 2;
  const baseRadius = 60;
  const arcFraction = 0.75;

  const isSliceHovered = hoveredIndex !== null && normalizedData[hoveredIndex] && !normalizedData[hoveredIndex].isEmpty;
  const displayValue = isSliceHovered ? normalizedData[hoveredIndex].value : totalValue;
  const displayLabel = isSliceHovered ? normalizedData[hoveredIndex].label : totalLabel;
  const hoveredPct = isSliceHovered && totalValue > 0
    ? Math.round((normalizedData[hoveredIndex].value / totalValue) * 100)
    : null;

  const isEmpty = sortedData.length === 0 || totalValue === 0;

  return (
    <div className={`flex-1 bg-surface rounded-card border border-border p-4 sm:p-5 relative flex flex-col justify-start h-full group cursor-default min-h-0 overflow-hidden ${cardClassName}`}>

      {/* HEADER COM ALTURA ESTÁVEL */}
      <div className="flex justify-between items-start mb-2 relative z-10 w-full shrink-0 min-w-0 h-[46px]">
        <div className="flex flex-col min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-text-primary font-semibold text-subtitle tracking-tight truncate" title={title}>{title}</h2>
            {badge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border border-accent-100 dark:border-accent-800 shrink-0">
                {badge}
              </span>
            )}
          </div>
          <p className="text-text-muted text-caption font-medium mt-0.5 truncate" title={subtitle}>{subtitle}</p>
        </div>
      </div>
      <div className="w-full h-px bg-border/70 mb-3 shrink-0"></div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 opacity-60 mt-4">
          <X size={64} className={isSemi ? 'text-amber-500' : 'text-primary-500'} strokeWidth={2} />
          <span className="text-text-muted font-medium text-body-sm">Nenhum dado disponível</span>
        </div>
      ) : (
        <div className="flex flex-row items-center justify-between flex-1 gap-4 sm:gap-5 min-w-0">
          {/* LADO ESQUERDO: GRÁFICO E RÓTULOS */}
          <div className="flex flex-col items-center justify-center w-[170px] shrink-0">
            <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
                <g transform={`rotate(45 ${center} ${center})`}>
                {normalizedData.map((item, index) => {
                  const radius = baseRadius - (index * gap);
                  const circumference = 2 * Math.PI * radius;
                  const trackLength = circumference * arcFraction;
                  const animatedLength = mounted ? trackLength * (item.isEmpty ? 1 : (item.percent || 0.1)) : 0;

                  const isHovered = hoveredIndex === index && !item.isEmpty;
                  const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index;

                  return (
                    <g
                      key={index}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={`outline-none ${item.isEmpty ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <circle
                        cx={center} cy={center} r={radius} fill="none"
                        stroke={isSemiarido ? 'rgba(245, 158, 11, 0.22)' : (chartTheme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)')}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round" strokeDasharray={`${trackLength} ${circumference}`}
                        className={`transition-opacity duration-300 pointer-events-none ${isOtherHovered ? 'opacity-20' : 'opacity-60'}`}
                      />

                      <circle
                        cx={center} cy={center} r={radius} fill="none"
                        stroke={item.color} strokeWidth={strokeWidth}
                        strokeLinecap="round" strokeDasharray={`${animatedLength} ${circumference}`}
                        className={`transition-all duration-700 ease-out pointer-events-none ${isHovered ? 'opacity-90' : ''} ${isOtherHovered ? 'opacity-30' : 'opacity-100'}`}
                      />

                      <circle
                        cx={center} cy={center} r={radius} fill="none"
                        stroke="transparent" strokeWidth={strokeWidth + 6}
                        strokeDasharray={`${trackLength} ${circumference}`}
                        className="pointer-events-auto"
                      />
                    </g>
                  );
                })}
                </g>
              </svg>

              {/* VALOR NO CENTRO DO GRÁFICO (PARTE VAZIA DO MEIO) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10 transition-all duration-200">
                <span className="text-text-primary font-bold text-xl sm:text-2xl tnum leading-none tracking-tight">
                  {displayValue.toLocaleString('pt-BR')}
                </span>
                {hoveredPct !== null && (
                  <span className={`text-[11px] font-semibold tnum leading-none mt-1 ${
                    isSemi ? 'text-amber-600 dark:text-amber-400' : 'text-primary-600 dark:text-primary-400'
                  }`}>
                    {hoveredPct}%
                  </span>
                )}
              </div>
            </div>

            {/* LEGENDA ABAIXO DO GRÁFICO (ALTURA FIXA E ALINHADA - NUNCA REDIMENSIONA) */}
            <div
              title={displayLabel}
              className="w-full h-[52px] shrink-0 mt-2 bg-surface-soft/80 dark:bg-surface-raised/70 border border-border/80 dark:border-border/60 rounded-xl px-3 py-1.5 flex items-center justify-center text-center shadow-2xs transition-colors duration-150 overflow-hidden"
            >
              <span
                className={`font-semibold text-text-primary dark:text-zinc-100 text-center transition-all duration-150 break-words line-clamp-2 select-none tracking-tight ${
                  displayLabel.length > 30 ? 'text-[11px] leading-[14px]' : displayLabel.length > 20 ? 'text-[11.5px] leading-[15px]' : 'text-xs leading-[16px]'
                }`}
              >
                {displayLabel}
              </span>
            </div>
          </div>

          {/* LADO DIREITO: RANKING */}
          {children ? (
            children
          ) : showTopList && topList.length > 0 ? (
            <div className="flex flex-col flex-1 justify-between h-full py-0.5 min-w-0">
              <div className="flex items-center justify-between mb-1.5 shrink-0">
                <h3 className="text-text-muted font-medium text-caption truncate">
                  {listTitle}
                </h3>
              </div>

              <div className="flex flex-col justify-between flex-1 gap-2 w-full min-h-0">
                {topList.slice(0, 5).map((item, index) => {
                  const maxCount = Math.max(...topList.slice(0, 5).map(t => Number(t.count) || 0), 1);
                  const count = Number(item.count) || 0;
                  const percentOfMax = Math.min(100, Math.round((count / maxCount) * 100));
                  const rankNum = item.rank || index + 1;
                  const rankStr = String(rankNum).padStart(2, '0');
                  const isFirst = index === 0;
                  const displayName = item.sigla || item.name;

                  const rankStyle = isFirst
                    ? (isSemi ? 'bg-accent-600 text-white shadow-xs font-bold' : 'bg-primary-600 text-white shadow-xs font-bold')
                    : (isSemi ? 'bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border border-accent-200/60 font-semibold' : 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 font-semibold');

                  const fillColor = isFirst
                    ? (isSemi ? 'bg-accent-500' : 'bg-primary-600')
                    : (isSemi ? 'bg-accent-200/80 dark:bg-accent-500/30' : 'bg-primary-200/80 dark:bg-primary-500/30');

                  const textStyle = isFirst
                    ? 'font-semibold text-white'
                    : (isSemi ? 'font-medium text-accent-950 dark:text-accent-100' : 'font-medium text-text-primary');

                  const valueStyle = isFirst
                    ? (isSemi ? 'bg-accent-600 text-white shadow-xs font-bold' : 'bg-primary-600 text-white shadow-xs font-bold')
                    : (isSemi ? 'bg-surface-sunken text-accent-800 dark:text-accent-300 border border-border/80 font-semibold' : 'bg-surface-sunken text-text-primary dark:text-zinc-200 border border-border/80 font-semibold');

                  return (
                    <div
                      key={index}
                      title={`${displayName}: ${count} cursos`}
                      className="flex items-center gap-2 sm:gap-2.5 w-full min-w-0 transition-opacity duration-200 hover:opacity-90 cursor-default"
                    >
                      {/* RANK */}
                      <div className={`w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full shrink-0 flex items-center justify-center text-caption tabular-nums leading-none shadow-2xs ${rankStyle}`}>
                        {rankStr}
                      </div>

                      {/* BARRA: TRACK + FILL + NOME */}
                      <div className={`relative flex-1 h-[26px] sm:h-[28px] rounded-full ${isSemi ? 'bg-accent-50/60 dark:bg-accent-950/40 border border-accent-200/50 dark:border-accent-800/50' : 'bg-surface-sunken border border-border/70'} overflow-hidden min-w-0 flex items-center shadow-2xs`}>
                        <div
                          className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-[width,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden z-0 flex items-center`}
                          style={{ width: `${percentOfMax}%` }}
                        />

                        <span className={`absolute left-3 right-3 text-caption truncate leading-none pointer-events-none select-none z-10 tracking-tight ${textStyle}`}>
                          {displayName}
                        </span>
                      </div>

                      {/* VALOR PILL */}
                      <div className={`h-[26px] sm:h-[28px] min-w-[38px] sm:min-w-[44px] px-2.5 rounded-full shrink-0 flex items-center justify-center text-caption font-semibold tabular-nums leading-none shadow-2xs ${valueStyle}`}>
                        {count.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}