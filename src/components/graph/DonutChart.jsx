import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Componente DonutChart padronizado com a mesma estrutura visual do card da direita.
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

 useEffect(() => {
 const timer = setTimeout(() => setMounted(true), 100);
 return () => clearTimeout(timer);
 }, []);

 const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 5);
 const maxValue = sortedData.length > 0 ? sortedData[0].value : 0;
 const totalValue = data.reduce((acc, item) => acc + item.value, 0);

 const normalizedData = sortedData.map(d => ({
 ...d,
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
  <div className={`flex-1 bg-surface rounded-2xl border border-neutral-100 shadow-card transition-all duration-500 hover:shadow-card-elevated p-5 relative flex flex-col justify-start h-full group cursor-default ${cardClassName}`}>

  {/* HEADER */}
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
    <div className="flex flex-row items-center justify-between flex-1 gap-2.5 min-w-0">
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
                    stroke={isSemiarido ? 'rgba(245, 158, 11, 0.15)' : 'rgba(226, 232, 240, 0.8)'}
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

        <div className="flex flex-col items-center justify-center text-center w-full mt-2 h-[34px]">
          <span className="text-text-primary font-semibold text-[20px] leading-none mb-0.5 tracking-tight transition-all duration-300">
            {displayValue.toLocaleString('pt-BR')}
          </span>
          <span className="text-neutral-500 font-normal text-[9.5px] leading-tight transition-all duration-300 px-1 w-full truncate">
            {displayLabel}
          </span>
        </div>
      </div>

      {/* LADO DIREITO: RANKING */}
      {children ? (
        children
      ) : showTopList && topList.length > 0 ? (
        <div className="flex flex-col flex-1 pl-3 border-l border-neutral-100 justify-center h-full py-0.5 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-neutral-400 font-bold text-[10px] uppercase tracking-wider truncate">
              {listTitle}
            </h3>
          </div>

          <div className="flex flex-col gap-3 w-full">
            {topList.slice(0, 5).map((item, index) => {
              const maxCount = Math.max(...topList.slice(0, 5).map(t => Number(t.count) || 0), 1);
              const count = Number(item.count) || 0;
              const percentOfMax = Math.min(100, Math.round((count / maxCount) * 100));
              const rankNum = item.rank || index + 1;
              const rankStr = String(rankNum).padStart(2, '0');
              const isFirst = index === 0;
              const isSemi = isSemiarido || !!badge;
              const displayName = item.sigla || item.name;
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
                  key={index} 
                  title={`${displayName}: ${count} cursos`}
                  className="flex items-center gap-2 w-full min-w-0 transition-opacity duration-200 hover:opacity-90 cursor-default"
                >
                  {/* RANK */}
                  <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold tabular-nums leading-none ${rankStyle}`}>
                    {rankStr}
                  </div>

                  {/* BARRA: TRACK + FILL + NOME */}
                  <div className="relative flex-1 h-[24px] rounded-full bg-primary-50/50 overflow-hidden min-w-0 flex items-center">
                    {/* Fill proporcional */}
                    <div 
                      className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                      style={{ width: `${percentOfMax}%` }}
                    />

                    {/* Nome perfeitamente integrado à barra */}
                    <span className={`absolute left-2.5 right-2.5 text-[11.5px] truncate leading-none pointer-events-none select-none z-10 ${textStyle}`}>
                      {displayName}
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
      ) : null}
    </div>
  )}
  </div>
 );
}