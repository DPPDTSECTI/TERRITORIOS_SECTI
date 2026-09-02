import React, { useEffect, useState } from 'react';

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
 children 
}) {
 const [mounted, setMounted] = useState(false);
 const [hoveredIndex, setHoveredIndex] = useState(null);

 useEffect(() => {
 const timer = setTimeout(() => setMounted(true), 100);
 return () => clearTimeout(timer);
 }, []);

 const sortedData = [...data].sort((a, b) => b.value - a.value);
 const maxValue = sortedData.length > 0 ? sortedData[0].value : 0;
 const totalValue = sortedData.reduce((acc, item) => acc + item.value, 0);

 const normalizedData = sortedData.map(d => ({
 ...d,
 percent: maxValue > 0 ? d.value / maxValue : 0
 }));

 const size = 130;
 const strokeWidth = 7; 
 const gap = 12; 
 const center = size / 2;
 const baseRadius = 55;
 const arcFraction = 0.75;

 const displayValue = hoveredIndex !== null && normalizedData[hoveredIndex] 
 ? normalizedData[hoveredIndex].value 
 : totalValue;
 
 const displayLabel = hoveredIndex !== null && normalizedData[hoveredIndex] 
 ? normalizedData[hoveredIndex].label 
 : totalLabel;

 return (
  <div className="flex-1 bg-surface rounded-2xl border border-neutral-100 shadow-card transition-all duration-300 hover:shadow-card-elevated p-5 relative flex flex-col justify-start h-full group cursor-default">

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
  <p className="text-neutral-500 text-[11px] font-normal mt-1">{subtitle}</p>
  </div>
  </div>
  <div className="w-full h-px bg-neutral-100 mb-4"></div>

  {/* HORIZONTAL LAYOUT */}
  <div className="flex flex-row items-center justify-between flex-1 gap-4 min-w-0">
  
  {/* LADO ESQUERDO: GRÁFICO E RÓTULOS */}
  <div className="flex flex-col items-center justify-center w-[140px] shrink-0">
  <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
  <svg width={size} height={size} className="absolute inset-0" style={{ transform: 'rotate(45deg)' }}>
  {normalizedData.map((item, index) => {
  const radius = baseRadius - (index * gap);
  const circumference = 2 * Math.PI * radius;
  const trackLength = circumference * arcFraction;
  const animatedLength = mounted ? trackLength * (item.percent || 0.1) : 0;
  
  const isHovered = hoveredIndex === index;
  const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index;

  return (
  <g
  key={index}
  onMouseEnter={() => setHoveredIndex(index)}
  onMouseLeave={() => setHoveredIndex(null)}
  className="cursor-pointer outline-none"
  >
  <circle
  cx={center} cy={center} r={radius} fill="none"
  stroke="rgb(var(--color-neutral-100))" strokeWidth={strokeWidth}
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

  <div className="flex flex-col items-center justify-center text-center w-full mt-3 h-[38px]">
  <span className="text-text-primary font-semibold text-[22px] leading-none mb-1 tracking-tight transition-all duration-300">
  {displayValue.toLocaleString('pt-BR')}
  </span>
  <span className="text-neutral-500 font-normal text-[10px] leading-tight transition-all duration-300 px-1 w-full truncate">
  {displayLabel}
  </span>
  </div>
  </div>

            {/* LADO DIREITO: RANKING */}
            {children ? (
              children
            ) : showTopList && topList.length > 0 ? (
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
                  {topList.map((item, index) => {
                    const maxCount = Math.max(...topList.map(t => Number(t.count) || 0), 1);
                    const percentOfMax = Math.min(100, Math.round(((Number(item.count) || 0) / maxCount) * 100));

                    const badgeStyle = index === 0
                      ? (badge ? 'bg-amber-500 text-white shadow-2xs font-bold' : 'bg-primary-600 text-white shadow-2xs font-bold')
                      : index === 1
                      ? (badge ? 'bg-amber-500/15 text-amber-700 font-bold' : 'bg-primary-100 text-primary-700 font-bold')
                      : index === 2
                      ? 'bg-neutral-100 text-neutral-700 font-semibold'
                      : 'bg-neutral-50 text-neutral-500 font-medium';

                    const barColor = index === 0
                      ? (badge ? 'bg-amber-500' : 'bg-primary-600')
                      : index === 1
                      ? (badge ? 'bg-amber-400/80' : 'bg-primary-500/80')
                      : index === 2
                      ? 'bg-primary-400/50'
                      : 'bg-neutral-300/60';

                    return (
                      <div 
                        key={index} 
                        title={`${item.name || item.sigla}: ${item.count} cursos`}
                        className="flex items-center gap-2.5 group p-1 -mx-1 rounded-lg hover:bg-surface-soft/80 transition-all min-w-0"
                      >
                        <div className={`w-5 h-5 rounded-md ${badgeStyle} flex items-center justify-center text-[10px] shrink-0 leading-none`}>
                          {item.rank || (index + 1)}
                        </div>

                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                          <div className="flex items-center justify-between gap-1.5 leading-tight">
                            <span className="text-[11.5px] font-semibold text-text-primary group-hover:text-primary-600 transition-colors truncate" title={item.name}>
                              {item.sigla || item.name}
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
            ) : null}

  </div>
  </div>
 );
}