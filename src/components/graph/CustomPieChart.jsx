import React, { useState, useRef } from 'react';
import { PieChart, Pie, Sector } from 'recharts';
import { X } from 'lucide-react';


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
 isSemiarido = false,
 cardClassName = '',
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

 const isEmpty = normalizedData.length === 0 || totalValue === 0;
 const chartData = !isEmpty ? normalizedData : [{ [valueKey]: 1, fill: 'rgb(var(--color-border))', [labelKey]: 'Sem dados' }];

  return (
  <div className={`flex-1 bg-surface rounded-2xl border border-neutral-100 shadow-card transition-all duration-500 hover:shadow-card-elevated p-5 relative flex flex-col justify-start h-full group cursor-default ${cardClassName}`}>
  
  {/* CABEÇALHO */}
  <div className="flex justify-between items-start mb-4 relative z-10 w-full pr-8 shrink-0">
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
  <p className="text-neutral-500 text-[11px] font-medium mt-0.5">{subtitle}</p>
  </div>
  </div>
  <div className="w-full h-px bg-neutral-100 mb-4 shrink-0"></div>

  {isEmpty ? (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 opacity-60 mt-4">
      <X size={80} className="text-primary-500" strokeWidth={2.5} />
      <span className="text-neutral-500 font-medium text-[13px]">Nenhum dado disponível</span>
    </div>
  ) : (
  /* CONTEÚDO */
  <div className="flex flex-row items-center justify-between flex-1 gap-2.5 min-h-0">
  
  {/* GRÁFICO */}
  <div className="flex flex-col items-center justify-center w-[130px] shrink-0">
  <div className="relative">
  <PieChart width={130} height={130}>
  <Pie
  data={chartData}
  cx="50%"
  cy="50%"
  innerRadius={26}
  outerRadius={58}
  paddingAngle={3}
  cornerRadius={4}
  dataKey={valueKey}
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

  <div className="flex flex-col items-center justify-center text-center w-full mt-2 h-[34px]">
  <span className="text-text-primary font-semibold text-[20px] leading-none mb-0.5 tracking-tight transition-all duration-300">
  {displayValue.toLocaleString('pt-BR')}
  </span>
  <span className="text-neutral-500 font-normal text-[9.5px] leading-tight transition-all duration-300 px-1 w-full truncate">
  {displayLabel}
  </span>
  </div>
  </div>

  {/* LISTA LATERAL */}
  {children ? (
    children
  ) : (
    <div className="flex flex-col flex-1 pl-3 border-l border-neutral-100 justify-center h-full py-0.5 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-neutral-400 font-bold text-[10px] uppercase tracking-wider truncate">
          {listTitle}
        </h3>
      </div>

      <div className="flex flex-col gap-3 w-full">
        {topList.slice(0, 5).map((item, idx) => {
          const maxCount = Math.max(...topList.slice(0, 5).map(t => Number(t.count) || 0), 1);
          const count = Number(item.count) || 0;
          const percentOfMax = Math.min(100, Math.round((count / maxCount) * 100));
          const rankNum = item.rank || idx + 1;
          const rankStr = String(rankNum).padStart(2, '0');
          const isFirst = idx === 0;
          const isSemi = isSemiarido || !!badge;
          // Rank badge style
          const rankStyle = isFirst
            ? (isSemi ? 'bg-amber-600 text-white shadow-2xs' : 'bg-primary-500 text-white shadow-2xs')
            : (isSemi ? 'bg-amber-500/15 text-amber-800 border border-amber-500/25' : 'bg-primary-100 text-primary-700 border border-primary-200/50');

          // Bar fill color
          const fillColor = isFirst
            ? (isSemi ? 'bg-amber-600' : 'bg-primary-500')
            : (isSemi ? 'bg-amber-500/15' : 'bg-primary-200');

          // Label text style inside the bar
          const textStyle = isFirst
            ? 'font-medium text-white'
            : (isSemi ? 'font-medium text-amber-950' : 'font-medium text-primary-950');

          // Value pill style
          const valueStyle = isFirst
            ? (isSemi ? 'bg-amber-500/15 text-amber-800 border border-amber-500/25' : 'bg-primary-50 text-primary-800 border border-primary-200/70')
            : (isSemi ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20' : 'bg-primary-50 text-primary-700 border border-primary-200/50');

          return (
            <div 
              key={idx} 
              title={`${item.name}: ${count} ativos`}
              className="flex items-center gap-2 w-full min-w-0 transition-opacity duration-200 hover:opacity-90 cursor-default"
            >
              {/* RANK */}
              <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold tabular-nums leading-none ${rankStyle}`}>
                {rankStr}
              </div>

              {/* BARRA: TRACK + FILL + NOME */}
              <div className={`relative flex-1 h-[24px] rounded-full ${isSemi ? 'bg-amber-50/60' : 'bg-primary-50/50'} overflow-hidden min-w-0 flex items-center`}>
                {/* Proportional Fill */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                  style={{ width: `${percentOfMax}%` }}
                />

                {/* Nome perfeitamente integrado à barra */}
                <span className={`absolute left-2.5 right-2.5 text-[11.5px] truncate leading-none pointer-events-none select-none z-10 ${textStyle}`}>
                  {item.name}
                </span>
              </div>

              {/* VALOR PILL */}
              <div className={`h-[24px] min-w-[34px] px-2 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold tabular-nums leading-none ${valueStyle}`}>
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