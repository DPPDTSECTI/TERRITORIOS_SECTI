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
  <div className="flex justify-between items-start mb-4 relative z-10 w-full">
  <div className="flex flex-col">
  <h2 className="text-text-primary font-semibold text-[16px] tracking-tight">{title}</h2>
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
  <div className="flex flex-col flex-1 pl-5 border-l border-neutral-100 justify-center h-full py-1 min-w-0">
  <h3 className="text-neutral-400 font-semibold text-[10px] uppercase tracking-wider mb-3 truncate">
  {listTitle}
  </h3>

  <div className="flex flex-col gap-3 w-full">
  {topList.map((item, idx) => {
  const badgeStyle = idx === 0
    ? 'bg-primary-600 text-white'
    : idx === 1
    ? 'bg-primary-100 text-primary-700'
    : 'bg-neutral-100 text-neutral-600';
  return (
  <div key={idx} className="flex items-center justify-between group min-w-0 gap-2">
  <div className="flex items-center gap-2.5 min-w-0 flex-1">
  <div className={`w-5 h-5 rounded-lg ${badgeStyle} flex items-center justify-center font-bold text-[10px] shrink-0 leading-none`}>
  {item.rank || idx + 1}
  </div>
  <span className="text-[12px] font-medium text-text-secondary group-hover:text-text-primary transition-colors truncate" title={item.name}>
  {item.name}
  </span>
  </div>
  <span className="font-semibold text-text-primary text-[13px] shrink-0 tabular-nums">
  {item.count}
  </span>
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