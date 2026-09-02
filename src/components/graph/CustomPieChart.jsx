import React, { useState, useRef } from 'react';
import { PieChart, Pie, Sector } from 'recharts';


/**
 * Componente genérico de Pizza com ranking lateral.
 *
 * Props:
 * @param {Array} data - [{ label: string, value: number, colorHex: string, ... }]
 * @param {Array} topList - [{ rank: number, name: string, count: number, color: string, text: string }]
 * @param {String} title - Título do Card
 * @param {String} subtitle - Subtítulo do Card
 * @param {String} listTitle - Título da listagem lateral
 * @param {String} defaultCenterLabel - Texto exibido no centro quando nenhum item está em foco
 * @param {String} labelKey - Chave do objeto para o nome da fatia (Default: 'label')
 * @param {String} valueKey - Chave do objeto para o valor da fatia (Default: 'value')
 * @param {String} colorKey - Chave do objeto para a cor da fatia (Default: 'colorHex')
 * @param {String} badge - Badge opcional ao lado do título
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
 children
}) {
 const [hoveredIndex, setHoveredIndex] = useState(null);
 const hoverTimeoutRef = useRef(null);

 const handleMouseEnter = (index) => {
 if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
 setHoveredIndex(index);
 };

 const handleMouseLeave = () => {
 hoverTimeoutRef.current = setTimeout(() => setHoveredIndex(null), 150);
 };

 const normalizedData = data.map(d => ({
 ...d,
 [labelKey]: d[labelKey] || 'Outros',
 [valueKey]: Number(d[valueKey] || 0),
 fill: d[colorKey] || 'rgb(var(--color-primary-600))'
 }));

 const totalValue = normalizedData.reduce((acc, item) => acc + item[valueKey], 0);
 const displayValue = hoveredIndex !== null && normalizedData[hoveredIndex] ? normalizedData[hoveredIndex][valueKey] : totalValue;
 const displayLabel = hoveredIndex !== null && normalizedData[hoveredIndex] ? normalizedData[hoveredIndex][labelKey] : defaultCenterLabel;

 const chartData = normalizedData.length > 0 ? normalizedData : [{ [valueKey]: 1, fill: 'rgb(var(--color-border))', [labelKey]: 'Sem dados' }];

  return (
  <div className="flex-1 bg-surface rounded-2xl border border-neutral-100 shadow-card transition-all duration-300 hover:shadow-card-elevated p-5 relative flex flex-col justify-start h-full group cursor-default">
  
  {/* CABEÇALHO */}
  <div className="flex justify-between items-start mb-4 relative z-10 w-full pr-8">
  <div className="flex flex-col">
  <div className="flex items-center gap-2">
  <h2 className="text-text-primary font-semibold text-[16px] tracking-tight">{title}</h2>
  {badge && (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
      {badge}
    </span>
  )}
  </div>
  <p className="text-neutral-500 text-[11px] font-normal mt-1">{subtitle}</p>
  </div>
  </div>
  <div className="w-full h-px bg-neutral-100 mb-4"></div>

  {/* CONTEÚDO */}
  <div className="flex flex-row items-center justify-between flex-1 gap-4 min-w-0">
  
  {/* GRÁFICO */}
  <div className="flex flex-col items-center justify-center w-[140px] shrink-0">
  <div className="relative">
  <PieChart width={140} height={140}>
  <Pie
  data={chartData}
  cx="50%"
  cy="50%"
  innerRadius={0}
  outerRadius={60}
  paddingAngle={4}
  cornerRadius={5}
  dataKey={valueKey}
  stroke="none"
  minAngle={15}
  shape={(props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, cornerRadius, index } = props;
  const isHovered = hoveredIndex === index;
  const isOtherHovered = hoveredIndex !== null && !isHovered;

  return (
  <g
  style={{
  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
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

  <div className="flex flex-col items-center justify-center text-center w-full mt-3 h-[38px]">
  <span className="text-text-primary font-semibold text-[22px] leading-none mb-1 tracking-tight transition-all duration-300">
  {displayValue.toLocaleString('pt-BR')}
  </span>
  <span className="text-neutral-500 font-normal text-[10px] leading-tight transition-all duration-300 px-1 w-full truncate">
  {displayLabel}
  </span>
  </div>
  </div>

  {/* LISTA LATERAL */}
  {children ? (
    children
  ) : (
    <div className="flex flex-col flex-1 pl-5 border-l border-neutral-100 justify-center h-full py-0.5 min-w-0">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-neutral-400 font-bold text-[10px] uppercase tracking-wider truncate">
          {listTitle}
        </h3>
        <span className="text-[9.5px] font-medium text-neutral-400 uppercase tracking-wider shrink-0">
          Qtd
        </span>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {topList.map((item, idx) => {
          const maxCount = Math.max(...topList.map(t => Number(t.count) || 0), 1);
          const percentOfMax = Math.min(100, Math.round(((Number(item.count) || 0) / maxCount) * 100));

          const badgeStyle = idx === 0
            ? (badge ? 'bg-amber-500 text-white shadow-2xs font-bold' : 'bg-primary-600 text-white shadow-2xs font-bold')
            : idx === 1
            ? (badge ? 'bg-amber-500/15 text-amber-700 font-bold' : 'bg-primary-100 text-primary-700 font-bold')
            : idx === 2
            ? 'bg-neutral-100 text-neutral-700 font-semibold'
            : 'bg-neutral-50 text-neutral-500 font-medium';

          const barColor = idx === 0
            ? (badge ? 'bg-amber-500' : 'bg-primary-600')
            : idx === 1
            ? (badge ? 'bg-amber-400/80' : 'bg-primary-500/80')
            : idx === 2
            ? 'bg-primary-400/50'
            : 'bg-neutral-300/60';

          return (
            <div 
              key={idx} 
              title={`${item.name}: ${item.count} ativos`}
              className="flex items-center gap-2.5 group p-1 -mx-1 rounded-lg hover:bg-surface-soft/80 transition-all min-w-0"
            >
              <div className={`w-5 h-5 rounded-md ${badgeStyle} flex items-center justify-center text-[10px] shrink-0 leading-none`}>
                {item.rank || idx + 1}
              </div>

              <div className="flex flex-col flex-1 min-w-0 justify-center">
                <div className="flex items-center justify-between gap-1.5 leading-tight">
                  <span className="text-[11.5px] font-semibold text-text-primary group-hover:text-primary-600 transition-colors truncate" title={item.name}>
                    {item.name}
                  </span>
                  <span className="font-bold text-text-primary text-[12px] shrink-0 tabular-nums">
                    {item.count}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                    style={{ width: `${percentOfMax}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )}

  </div>
  </div>
  );
}