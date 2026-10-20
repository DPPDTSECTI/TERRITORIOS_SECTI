import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useChartTheme } from './chartTheme';

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

  const size = 130;
  const strokeWidth = 8.5;
  const gap = 9.6;
  const center = size / 2;
  const baseRadius = 58;
  const arcFraction = 0.75;

  const displayValue = hoveredIndex !== null && normalizedData[hoveredIndex]
    ? normalizedData[hoveredIndex].value
    : totalValue;

  const displayLabel = hoveredIndex !== null && normalizedData[hoveredIndex]
    ? normalizedData[hoveredIndex].label
    : totalLabel;

  const isEmpty = sortedData.length === 0 || totalValue === 0;

  return (
    <div className={`flex-1 bg-surface rounded-card border border-border shadow-card transition-all duration-300 hover:shadow-card-hover p-5 relative flex flex-col justify-start h-full group cursor-default ${cardClassName}`}>

      {/* HEADER */}
      <div className="flex justify-between items-start mb-3 relative z-10 w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-text-primary font-semibold text-subtitle tracking-tight">{title}</h2>
            {badge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-micro font-semibold bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border border-accent-100 dark:border-accent-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></span>
                {badge}
              </span>
            )}
          </div>
          <p className="text-text-muted text-caption font-medium mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="w-full h-px bg-border/70 mb-4 shrink-0"></div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 opacity-60 mt-4">
          <X size={64} className="text-primary-500" strokeWidth={2} />
          <span className="text-text-muted font-medium text-body-sm">Nenhum dado disponível</span>
        </div>
      ) : (
        <div className="flex flex-row items-center justify-between flex-1 gap-3 min-w-0">
          {/* LADO ESQUERDO: GRÁFICO E RÓTULOS */}
          <div className="flex flex-col items-center justify-center w-[130px] shrink-0">
            <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="absolute inset-0" style={{ transform: 'rotate(45deg)' }}>
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
                        stroke={isSemiarido ? 'rgba(214, 162, 48, 0.2)' : (chartTheme.isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(224, 231, 239, 0.8)')}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round" strokeDasharray={`${trackLength} ${circumference}`}
                        className={`transition-opacity duration-300 pointer-events-none ${isOtherHovered ? 'opacity-20' : 'opacity-60'}`}
                      />

                      <circle
                        cx={center} cy={center} r={radius} fill="none"
                        stroke={item.color} strokeWidth={strokeWidth}
                        strokeLinecap="round" strokeDasharray={`${animatedLength} ${circumference}`}
                        className={`transition-all duration-700 ease-out pointer-events-none ${isHovered ? 'brightness-110 filter' : ''} ${isOtherHovered ? 'opacity-30' : 'opacity-100'}`}
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
              </svg>
            </div>

            <div className="flex flex-col items-center justify-center text-center w-full mt-2 min-h-[38px]">
              <span className="text-text-primary font-bold text-kpi tnum leading-none mb-0.5 tracking-tight transition-all duration-200">
                {displayValue.toLocaleString('pt-BR')}
              </span>
              <span className="text-text-muted font-normal text-caption leading-tight transition-all duration-200 px-1 w-full truncate">
                {displayLabel}
              </span>
            </div>
          </div>

          {/* LADO DIREITO: RANKING */}
          {children ? (
            children
          ) : showTopList && topList.length > 0 ? (
            <div className="flex flex-col flex-1 pl-3 border-l border-border/70 justify-center h-full py-0.5 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-text-muted font-bold text-micro uppercase tracking-wider truncate">
                  {listTitle}
                </h3>
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                {topList.slice(0, 5).map((item, index) => {
                  const maxCount = Math.max(...topList.slice(0, 5).map(t => Number(t.count) || 0), 1);
                  const count = Number(item.count) || 0;
                  const percentOfMax = Math.min(100, Math.round((count / maxCount) * 100));
                  const rankNum = item.rank || index + 1;
                  const rankStr = String(rankNum).padStart(2, '0');
                  const isFirst = index === 0;
                  const isSemi = isSemiarido || !!badge;
                  const displayName = item.sigla || item.name;

                  const rankStyle = isFirst
                    ? (isSemi ? 'bg-accent-600 text-white shadow-xs' : 'bg-primary-600 text-white shadow-xs')
                    : (isSemi ? 'bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border border-accent-100' : 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60');

                  const fillColor = isFirst
                    ? (isSemi ? 'bg-accent-500' : 'bg-primary-600')
                    : (isSemi ? 'bg-accent-200/80 dark:bg-accent-500/30' : 'bg-primary-200/80 dark:bg-primary-500/30');

                  const textStyle = isFirst
                    ? 'font-medium text-white'
                    : (isSemi ? 'font-medium text-accent-900 dark:text-accent-200' : 'font-medium text-text-primary');

                  const valueStyle = isFirst
                    ? (isSemi ? 'bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-200 border border-accent-200/60' : 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200 border border-primary-200/60')
                    : (isSemi ? 'bg-surface-sunken text-accent-800 dark:text-accent-300 border border-border' : 'bg-surface-sunken text-text-secondary border border-border');

                  return (
                    <div
                      key={index}
                      title={`${displayName}: ${count} cursos`}
                      className="flex items-center gap-2 w-full min-w-0 transition-opacity duration-200 hover:opacity-90 cursor-default"
                    >
                      {/* RANK */}
                      <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-micro font-semibold tnum leading-none ${rankStyle}`}>
                        {rankStr}
                      </div>

                      {/* BARRA: TRACK + FILL + NOME */}
                      <div className={`relative flex-1 h-[24px] rounded-full ${isSemi ? 'bg-accent-50/50 dark:bg-accent-950/30 border border-accent-200/40 dark:border-accent-800/40' : 'bg-surface-sunken border border-border/60'} overflow-hidden min-w-0 flex items-center`}>
                        <div
                          className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                          style={{ width: `${percentOfMax}%` }}
                        />

                        <span className={`absolute left-2.5 right-2.5 text-caption truncate leading-none pointer-events-none select-none z-10 ${textStyle}`}>
                          {displayName}
                        </span>
                      </div>

                      {/* VALOR PILL */}
                      <div className={`h-[24px] min-w-[34px] px-2 rounded-full shrink-0 flex items-center justify-center text-caption font-semibold tnum leading-none ${valueStyle}`}>
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