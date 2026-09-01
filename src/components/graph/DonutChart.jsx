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
  <div className="flex justify-between items-start mb-4 relative z-10 w-full">
  <div className="flex flex-col">
  <h2 className="text-text-primary font-semibold text-[16px] tracking-tight">{title}</h2>
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
  <div className="flex flex-col flex-1 pl-5 border-l border-neutral-100 justify-center h-full py-1 min-w-0">
  <h3 className="text-neutral-400 font-semibold text-[10px] uppercase tracking-wider mb-3 truncate">
  {listTitle}
  </h3>

  <div className="flex flex-col gap-3 w-full">
  {topList.map((item, index) => {
  const badgeStyle = index === 0
    ? 'bg-primary-600 text-white'
    : index === 1
    ? 'bg-primary-100 text-primary-700'
    : 'bg-neutral-100 text-neutral-600';
  return (
  <div key={index} className="flex items-center justify-between group min-w-0 gap-2">
  <div className="flex items-center gap-2.5 min-w-0 flex-1">
  <div className={`w-5 h-5 rounded-lg ${badgeStyle} flex items-center justify-center font-bold text-[10px] shrink-0 leading-none`}>
  {item.rank || (index + 1)}
  </div>
  <span className="text-[12px] font-medium text-text-secondary group-hover:text-text-primary transition-colors truncate" title={item.name}>
  {item.sigla || item.name}
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
  ) : null}

  </div>
  </div>
 );
}