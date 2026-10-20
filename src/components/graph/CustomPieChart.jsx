import React, { useState, useRef } from 'react';
import { PieChart, Pie, Sector, Tooltip } from 'recharts';
import { X } from 'lucide-react';
import { useChartTheme, ChartTooltip } from './chartTheme';

/**
 * Componente genérico de Pizza com ranking lateral integrado e cores do Design System.
 */
export default function CustomPieChart({
  data = [],
  topList = [],
  title = "Título do Gráfico",
  subtitle = "Visão geral e distribuição",
  listTitle = "Top Ranking",
  defaultCenterLabel = "Total",
  labelKey = "label",
  valueKey = "value",
  colorKey = "colorHex",
  badge = null,
  isSemiarido = false,
  cardClassName = '',
  children
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const chartTheme = useChartTheme();

  const handleMouseEnter = (index) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredIndex(null), 150);
  };

  const normalizedData = data.map((d, index) => ({
    ...d,
    [labelKey]: d[labelKey] || 'Outros',
    [valueKey]: Number(d[valueKey] || 0),
    fill: d[colorKey] || chartTheme.palette[index % chartTheme.palette.length]
  }));

  const totalValue = normalizedData.reduce((acc, item) => acc + item[valueKey], 0);
  const displayValue = hoveredIndex !== null && normalizedData[hoveredIndex] ? normalizedData[hoveredIndex][valueKey] : totalValue;
  const displayLabel = hoveredIndex !== null && normalizedData[hoveredIndex] ? normalizedData[hoveredIndex][labelKey] : defaultCenterLabel;

  const isEmpty = normalizedData.length === 0 || totalValue === 0;
  const chartData = !isEmpty ? normalizedData : [{ [valueKey]: 1, fill: chartTheme.grid, [labelKey]: 'Sem dados' }];

  return (
    <div className={`flex-1 bg-surface rounded-card border border-border shadow-card transition-all duration-300 hover:shadow-card-hover p-5 relative flex flex-col justify-start h-full group cursor-default ${cardClassName}`}>

      {/* CABEÇALHO */}
      <div className="flex justify-between items-start mb-3 relative z-10 w-full shrink-0">
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
        /* CONTEÚDO */
        <div className="flex flex-row items-center justify-between flex-1 gap-3 min-h-0">

          {/* GRÁFICO */}
          <div className="flex flex-col items-center justify-center w-[130px] shrink-0">
            <div className="relative">
              <PieChart width={130} height={130}>
                <Tooltip content={<ChartTooltip />} />
                <Pie
                  isAnimationActive={false}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={26}
                  outerRadius={58}
                  paddingAngle={3}
                  cornerRadius={4}
                  dataKey={valueKey}
                  nameKey={labelKey}
                  stroke="none"
                  minAngle={12}
                  shape={(props) => {
                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, cornerRadius, index } = props;
                    const isHovered = hoveredIndex === index;
                    const isOtherHovered = hoveredIndex !== null && !isHovered;

                    return (
                      <g
                        style={{
                          transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                          transformOrigin: `${cx}px ${cy}px`,
                          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)'
                        }}
                      >
                        <Sector
                          cx={cx}
                          cy={cy}
                          innerRadius={innerRadius}
                          outerRadius={outerRadius}
                          startAngle={startAngle}
                          endAngle={endAngle}
                          fill={fill}
                          cornerRadius={cornerRadius}
                          className="cursor-pointer transition-opacity duration-300 ease-in-out"
                          style={{ opacity: isOtherHovered ? 0.3 : 1 }}
                          onMouseEnter={() => handleMouseEnter(index)}
                          onMouseLeave={handleMouseLeave}
                        />
                      </g>
                    );
                  }}
                />
              </PieChart>
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

          {/* LISTA LATERAL */}
          {children ? (
            children
          ) : (
            <div className="flex flex-col flex-1 pl-3 border-l border-border/70 justify-center h-full py-0.5 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-text-muted font-bold text-micro uppercase tracking-wider truncate">
                  {listTitle}
                </h3>
              </div>

              <div className="flex flex-col gap-2.5 w-full">
                {topList.slice(0, 5).map((item, idx) => {
                  const maxCount = Math.max(...topList.slice(0, 5).map(t => Number(t.count) || 0), 1);
                  const count = Number(item.count) || 0;
                  const percentOfMax = Math.min(100, Math.round((count / maxCount) * 100));
                  const rankNum = item.rank || idx + 1;
                  const rankStr = String(rankNum).padStart(2, '0');
                  const isFirst = idx === 0;
                  const isSemi = isSemiarido || !!badge;

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
                      key={idx}
                      title={`${item.name}: ${count} ativos`}
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
                          {item.name}
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
          )}

        </div>
      )}
    </div>
  );
}