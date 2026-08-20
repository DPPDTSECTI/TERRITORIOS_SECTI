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
    <div className="flex-1 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default">

      {/* HEADER SECTION IDÊNTICO */}
      <div className="flex justify-between items-start mb-3 relative z-10 w-full">
        <div className="flex flex-col">
          <h2 className="text-[#1D3557] font-extrabold text-[15px] tracking-tight">{title}</h2>
          <p className="text-[#457B9D]/60 text-[11px] font-medium mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* HORIZONTAL LAYOUT IDÊNTICO */}
      <div className="flex flex-row items-center justify-between flex-1 gap-4 min-w-0">
        
        {/* LADO ESQUERDO: GRÁFICO E RÓTULOS */}
        <div className="flex flex-col items-center justify-center w-[140px] shrink-0">
          <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="absolute inset-0 drop-shadow-sm" style={{ transform: 'rotate(45deg)' }}>
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
                    {/* Linha de Fundo */}
                    <circle
                      cx={center} cy={center} r={radius} fill="none"
                      stroke="#E2E8F0" strokeWidth={strokeWidth}
                      strokeLinecap="round" strokeDasharray={`${trackLength} ${circumference}`}
                      className={`transition-opacity duration-300 pointer-events-none ${isOtherHovered ? 'opacity-20' : 'opacity-50'}`}
                    />
                    
                    {/* Linha Animada Colorida */}
                    <circle
                      cx={center} cy={center} r={radius} fill="none"
                      stroke={item.color} strokeWidth={strokeWidth}
                      strokeLinecap="round" strokeDasharray={`${animatedLength} ${circumference}`}
                      className={`transition-all duration-700 ease-out pointer-events-none ${isHovered ? 'brightness-110 filter' : ''} ${isOtherHovered ? 'opacity-30' : 'opacity-100'}`}
                    />
                    
                    {/* Hitbox Invisível */}
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
            <span className="text-[#1D3557] font-extrabold text-[20px] leading-none mb-1 tracking-tight transition-all duration-300">
              {displayValue.toLocaleString('pt-BR')}
            </span>
            <span className="text-[#457B9D]/80 font-semibold text-[10px] leading-tight transition-all duration-300 px-1 w-full truncate">
              {displayLabel}
            </span>
          </div>
        </div>

        {/* LADO DIREITO: LISTAGEM TOP 5 COM ESTRUTURA E ESTILOS IDÊNTICOS */}
        {children ? (
          children
        ) : showTopList && topList.length > 0 ? (
          <div className="flex flex-col flex-1 pl-4 lg:pl-6 border-l border-[#E2E8F0]/50 justify-center h-full py-1 min-w-0">
            <h3 className="text-[#1D3557] font-extrabold text-[10px] tracking-widest uppercase mb-3 truncate">
              {listTitle}
            </h3>

            <div className="flex flex-col gap-3.5 w-full">
              {topList.map((item, index) => (
                <div key={index} className="flex items-center justify-between group min-w-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-[20px] h-[20px] rounded-md ${item.color || 'bg-gray-100'} ${item.text || 'text-gray-500'} flex items-center justify-center font-bold text-[9px] shadow-sm shrink-0`}>
                      {item.rank || (index + 1)}º
                    </div>
                    <span className="text-[11px] font-bold text-[#2563EB] group-hover:text-[#1D3557] transition-colors truncate" title={item.name}>
                      {item.sigla || item.name}
                    </span>
                  </div>
                  <span className="font-extrabold text-[#1D3557] text-[12px] shrink-0">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}