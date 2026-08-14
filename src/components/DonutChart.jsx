import React, { useEffect, useState } from 'react';

export default function DonutChart({ data, title = "Cursos por Área", totalLabel = "Total de Cursos", badge = "" }) {
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
  const size = 180;
  const strokeWidth = 10;
  const gap = 14; // gap between rings
  const center = size / 2;
  const baseRadius = 80;

  // 270 degree arcs
  const arcFraction = 0.75;

  // Determine what to show on the right side
  const displayValue = hoveredIndex !== null ? normalizedData[hoveredIndex].value : totalValue;
  const displayLabel = hoveredIndex !== null ? normalizedData[hoveredIndex].label : totalLabel;

  return (
    <div className="flex-1 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-6 relative flex flex-col justify-center min-h-[240px] group cursor-default">

      {/* HEADER SECTION (Title & Subtitle like in image) */}
      <div className="flex justify-between items-start mb-4 relative z-10 w-full pl-2">
        <div className="flex flex-col">
          <h2 className="text-[#1D3557] font-extrabold text-[15px] tracking-tight">{title}</h2>
          <p className="text-[#457B9D]/60 text-[11px] font-medium mt-0.5">Visão geral das categorias</p>
        </div>
      </div>

      <div className="flex items-center justify-start w-full relative h-[180px]">

        {/* SVG CHART - C SHAPE */}
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

        {/* TEXT STATS - POSITIONED INSIDE THE "C" GAP ON THE RIGHT */}
        <div className="absolute right-6 flex flex-col items-start justify-center">
          <span className="text-[#1D3557] font-extrabold text-[28px] leading-none mb-1 tracking-tight transition-all duration-300">
            {displayValue.toLocaleString('pt-BR')}
          </span>
          <span className="text-[#457B9D]/80 font-semibold text-[11px] leading-tight transition-all duration-300 max-w-[90px] truncate">
            {displayLabel}
          </span>
          {badge && hoveredIndex === null && (
            <div className="bg-[#10B981]/10 text-[#10B981] font-bold text-[10px] px-2 py-1 rounded-md mt-2">
              {badge}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
