import React, { useState, useRef, useEffect } from 'react';
import { PieChart, Pie, Sector } from 'recharts';
import { X } from 'lucide-react';
import { useChartTheme } from './chartTheme';

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
  const [hoveredItem, setHoveredItem] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const chartTheme = useChartTheme();

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = (item) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (item) setHoveredItem(item);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setHoveredItem(null), 80);
  };

  const normalizedData = data.map((d, index) => ({
    ...d,
    [labelKey]: d[labelKey] || 'Outros',
    [valueKey]: Number(d[valueKey] || 0),
    fill: d[colorKey] || chartTheme.palette[index % chartTheme.palette.length]
  }));

  const totalValue = normalizedData.reduce((acc, item) => acc + item[valueKey], 0);
  const displayValue = hoveredItem ? hoveredItem[valueKey] : totalValue;
  const displayLabel = hoveredItem ? hoveredItem[labelKey] : defaultCenterLabel;
  const hoveredPct = hoveredItem && totalValue > 0
    ? Math.round((hoveredItem[valueKey] / totalValue) * 100)
    : null;

  const isEmpty = normalizedData.length === 0 || totalValue === 0;
  const chartData = !isEmpty ? normalizedData : [{ [valueKey]: 1, fill: chartTheme.grid, [labelKey]: 'Sem dados' }];

  return (
    <div className={`flex-1 bg-surface rounded-card border border-border p-5 relative flex flex-col justify-start h-full group cursor-default ${cardClassName}`}>

      {/* CABEÇALHO */}
      <div className="flex justify-between items-start mb-3 relative z-10 w-full shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-text-primary font-semibold text-subtitle tracking-tight">{title}</h2>
            {badge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border border-accent-100 dark:border-accent-800 shrink-0">
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
        <div className="flex flex-row items-center justify-between flex-1 gap-4 sm:gap-5 min-h-0">

          {/* GRÁFICO */}
          <div className="flex flex-col items-center justify-center w-[170px] shrink-0">
            <div
              onMouseLeave={handleMouseLeave}
              className="relative flex items-center justify-center shrink-0 w-[136px] h-[136px]"
            >
              <PieChart width={136} height={136}>
                <Pie
                  isAnimationActive={false}
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={62}
                  paddingAngle={1.5}
                  dataKey={valueKey}
                  nameKey={labelKey}
                  stroke={chartTheme.surface}
                  strokeWidth={1.5}
                  minAngle={6}
                  onMouseEnter={(entry) => handleMouseEnter(entry?.payload || entry)}
                  onClick={(entry) => handleMouseEnter(entry?.payload || entry)}
                  shape={(props) => {
                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
                    const itemData = payload;
                    const isHovered = Boolean(hoveredItem && itemData && hoveredItem[labelKey] === itemData[labelKey]);
                    const isOtherHovered = Boolean(hoveredItem && !isHovered);

                    // Expansão geométrica suave do raio externo em hover (sem scale transform que quebra coordenadas)
                    const currentOuter = isHovered ? outerRadius + 3 : outerRadius;
                    const currentInner = innerRadius;

                    // Raio de borda seguro baseado na abertura angular para evitar distorção ou inversão de arco
                    const angleDelta = Math.abs(endAngle - startAngle);
                    const safeCornerRadius = Math.max(0, Math.min(2, angleDelta * 0.2));

                    return (
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={currentInner}
                        outerRadius={currentOuter}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                        stroke={chartTheme.surface}
                        strokeWidth={1.5}
                        cornerRadius={safeCornerRadius}
                        className="cursor-pointer"
                        style={{
                          opacity: isOtherHovered ? 0.35 : 1,
                          transition: 'opacity 0.15s ease-out'
                        }}
                        onMouseEnter={() => handleMouseEnter(itemData)}
                        onClick={() => handleMouseEnter(itemData)}
                      />
                    );
                  }}
                />
              </PieChart>

              {/* VALOR NO CENTRO DO GRÁFICO (PARTE VAZIA DO MEIO) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10 transition-all duration-200">
                <span className="text-text-primary font-bold text-xl sm:text-2xl tnum leading-none tracking-tight">
                  {displayValue.toLocaleString('pt-BR')}
                </span>
                {hoveredPct !== null && (
                  <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 tnum leading-none mt-1">
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

          {/* LISTA LATERAL (RANKING) */}
          {children ? (
            children
          ) : (
            <div className="flex flex-col flex-1 justify-between h-full py-0.5 min-w-0">
              <div className="flex items-center justify-between mb-1.5 shrink-0">
                <h3 className="text-text-muted font-medium text-caption truncate">
                  {listTitle}
                </h3>
              </div>

              <div className="flex flex-col justify-between flex-1 gap-2 w-full min-h-0">
                {topList.slice(0, 5).map((item, idx) => {
                  const maxCount = Math.max(...topList.slice(0, 5).map(t => Number(t.count) || 0), 1);
                  const count = Number(item.count) || 0;
                  const percentOfMax = Math.min(100, Math.round((count / maxCount) * 100));
                  const rankNum = item.rank || idx + 1;
                  const rankStr = String(rankNum).padStart(2, '0');
                  const isFirst = idx === 0;
                  const isSemi = isSemiarido || !!badge;

                  const rankStyle = isFirst
                    ? (isSemi ? 'bg-accent-600 text-white shadow-xs font-bold' : 'bg-primary-600 text-white shadow-xs font-bold')
                    : (isSemi ? 'bg-accent-50 text-accent-700 dark:bg-accent-950 dark:text-accent-300 border border-accent-200/60 font-semibold' : 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60 font-semibold');

                  const fillColor = isFirst
                    ? (isSemi ? 'bg-accent-500' : 'bg-primary-600')
                    : (isSemi ? 'bg-accent-200/80 dark:bg-accent-500/30' : 'bg-primary-200/80 dark:bg-primary-500/30');

                  const textStyle = isFirst
                    ? 'font-semibold text-white drop-shadow-xs'
                    : (isSemi ? 'font-medium text-accent-950 dark:text-accent-100' : 'font-medium text-text-primary');

                  const valueStyle = isFirst
                    ? (isSemi ? 'bg-accent-600 text-white shadow-xs font-bold' : 'bg-primary-600 text-white shadow-xs font-bold')
                    : (isSemi ? 'bg-surface-sunken text-accent-800 dark:text-accent-300 border border-border/80 font-semibold' : 'bg-surface-sunken text-text-primary dark:text-zinc-200 border border-border/80 font-semibold');

                  return (
                    <div
                      key={idx}
                      title={`${item.name}: ${count} ativos`}
                      className="flex items-center gap-2 sm:gap-2.5 w-full min-w-0 transition-opacity duration-200 hover:opacity-90 cursor-default"
                    >
                      {/* RANK */}
                      <div className={`w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full shrink-0 flex items-center justify-center text-caption tabular-nums leading-none shadow-2xs ${rankStyle}`}>
                        {rankStr}
                      </div>

                      {/* BARRA: TRACK + FILL + NOME */}
                      <div className={`relative flex-1 h-[26px] sm:h-[28px] rounded-full ${isSemi ? 'bg-accent-50/60 dark:bg-accent-950/40 border border-accent-200/50 dark:border-accent-800/50' : 'bg-surface-sunken border border-border/70'} overflow-hidden min-w-0 flex items-center shadow-2xs`}>
                        <div
                          className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                          style={{ width: `${percentOfMax}%` }}
                        />

                        <span className={`absolute left-3 right-3 text-caption truncate leading-none pointer-events-none select-none z-10 tracking-tight ${textStyle}`}>
                          {item.name}
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
          )}
        </div>
      )}
    </div>
  );
}