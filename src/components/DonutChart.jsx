import React, { useEffect, useState } from 'react';

export default function DonutChart({ data, title = "Cursos por Área", totalLabel = "Total de Cursos", badge = "", showTopList = true, children }) {
  // We will animate the chart on mount
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    // Slight delay for animation effect
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Sort data from largest to smallest value
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Normalize data to calculate percentages relative to the largest value
  const maxValue = sortedData.length > 0 ? sortedData[0].value : 0;
  const totalValue = sortedData.reduce((acc, item) => acc + item.value, 0);

  const normalizedData = sortedData.map(d => ({
    ...d,
    percent: maxValue > 0 ? d.value / maxValue : 0
  }));

  // Chart config
  const size = 130;
  const strokeWidth = 8;
  const gap = 10; // gap between rings
  const center = size / 2;
  const baseRadius = 55;

  // 270 degree arcs
  const arcFraction = 0.75;

  // Determine what to show on the right side
  const displayValue = hoveredIndex !== null ? normalizedData[hoveredIndex].value : totalValue;
  const displayLabel = hoveredIndex !== null ? normalizedData[hoveredIndex].label : totalLabel;

  return (
    <div className="flex-1 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default">

      {/* HEADER SECTION */}
      <div className="flex justify-between items-start mb-3 relative z-10 w-full">
        <div className="flex flex-col">
          <h2 className="text-[#1D3557] font-extrabold text-[15px] tracking-tight">{title}</h2>
          <p className="text-[#457B9D]/60 text-[11px] font-medium mt-0.5">Visão geral das categorias e ranking</p>
        </div>
      </div>

      {/* HORIZONTAL LAYOUT: CHART (Left) + TOP 3 LIST (Right) */}
      <div className="flex flex-row items-center justify-between flex-1">
        {/* LEFT: SVG CHART E TEXTO ABAIXO */}
        <div className="flex flex-col items-center justify-center w-[140px] shrink-0">

          <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>

            {/* Rotate 45deg: Starts at bottom-right, draws 270deg clockwise, ends at top-right. Gap is on the right. */}
            <svg width={size} height={size} className="absolute inset-0" style={{ transform: 'rotate(45deg)' }}>
              {normalizedData.map((item, index) => {
                const radius = baseRadius - (index * gap);
                const circumference = 2 * Math.PI * radius;
                const trackLength = circumference * arcFraction;

                // Animated length
                const animatedLength = mounted ? trackLength * (item.percent || 0.1) : 0;
                const isHovered = hoveredIndex === index;
                const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index;

                return (
                  <g
                    key={index}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Background Track */}
                    <circle
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={`${trackLength} ${circumference}`}
                      className={`transition-opacity duration-300 ${isOtherHovered ? 'opacity-20' : 'opacity-50'}`}
                    />
                    {/* Foreground Animated Track */}
                    <circle
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={`${animatedLength} ${circumference}`}
                      className={`transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isHovered ? 'brightness-110 drop-shadow-md' : ''} ${isOtherHovered ? 'opacity-30' : 'opacity-100'}`}
                    />
                    {/* Invisible thicker stroke to make hovering easier */}
                    <circle
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={strokeWidth + 4}
                      strokeDasharray={`${trackLength} ${circumference}`}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* TEXT STATS - Positioned below the chart instead of inside the C shape */}
          <div className="flex flex-col items-center justify-center text-center w-full mt-2">
            <span className="text-[#1D3557] font-extrabold text-[22px] leading-none mb-1 tracking-tight transition-all duration-300">
              {displayValue.toLocaleString('pt-BR')}
            </span>
            <span className="text-[#457B9D]/80 font-semibold text-[10px] leading-tight transition-all duration-300 w-[140px] truncate px-1">
              {displayLabel}
            </span>
          </div>

        </div>

        {/* RIGHT: DYNAMIC CONTENT OR TOP 5 UNIVERSITIES LIST */}
        {children ? (
          children
        ) : showTopList ? (
          <div className="flex flex-col flex-1 pl-4 lg:pl-5 border-l border-[#E2E8F0]/60 justify-center h-full py-1 min-w-0 pr-1">
            <h3 className="text-[#1D3557] font-extrabold text-[10px] tracking-widest uppercase mb-3 truncate">Top 5 Universidades</h3>

            <div className="flex flex-col gap-3.5 w-full">
              {[
                { rank: 1, name: 'Universidade Federal da Bahia', sigla: 'UFBA', count: 184, color: 'bg-[#1D3557]', text: 'text-white' },
                { rank: 2, name: 'Univ. Estadual de Feira de Santana', sigla: 'UEFS', count: 142, color: 'bg-[#2563EB]/10', text: 'text-[#2563EB]' },
                { rank: 3, name: 'Universidade de Salvador', sigla: 'UNIFACS', count: 98, color: 'bg-[#457B9D]/10', text: 'text-[#457B9D]' },
                { rank: 4, name: 'Universidade do Estado da Bahia', sigla: 'UNEB', count: 85, color: 'bg-[#A8DADC]/20', text: 'text-[#457B9D]' },
                { rank: 5, name: 'Univ. Estadual de Santa Cruz', sigla: 'UESC', count: 62, color: 'bg-[#E2E8F0]/50', text: 'text-[#1D3557]' }
              ].map((uni) => (
                <div key={uni.rank} className="flex items-center justify-between gap-2 group w-full min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-5 h-5 rounded-full ${uni.color} ${uni.text} flex items-center justify-center font-bold text-[9px] shadow-sm shrink-0`}>
                      {uni.rank}º
                    </div>
                    <span className="text-[11px] font-bold text-[#1D3557] group-hover:text-[#2563EB] transition-colors truncate">{uni.sigla}</span>
                  </div>
                  <span className="font-extrabold text-[#1D3557] text-[12px] shrink-0">{uni.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </div>

    </div>
  );
}
