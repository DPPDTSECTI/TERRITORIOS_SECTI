import React from 'react';

export default function DonutChart({ data, totalLabel = "Total", title = "Distribuição (Donut)" }) {
  // data = [{ label: 'A', value: 30, color: '#6875F5' }, ...]

  const total = data.reduce((acc, item) => acc + item.value, 0);
  
  // Calculate SVG paths for donut segments
  let cumulativePercent = 0;
  
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="flex-1 bg-white rounded-[28px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 flex items-center justify-center relative min-h-[240px] group cursor-default">
      <p className="absolute top-5 left-5 text-[#457B9D]/50 font-mono tracking-widest uppercase text-[10px] group-hover:text-[#457B9D] transition-colors">
        {title}
      </p>
      
      <div className="relative w-[160px] h-[160px] flex items-center justify-center">
        {total > 0 ? (
          <svg viewBox="-1 -1 2 2" className="absolute inset-0 w-full h-full -rotate-90">
            {data.map((slice, i) => {
              const percent = slice.value / total;
              const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
              cumulativePercent += percent;
              const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
              const largeArcFlag = percent > 0.5 ? 1 : 0;
              
              // If it's a single slice (100%), just draw a circle
              if (percent === 1) {
                return (
                  <circle
                    key={i}
                    cx="0"
                    cy="0"
                    r="0.8"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="0.4"
                  />
                );
              }

              const pathData = [
                `M ${startX * 0.8} ${startY * 0.8}`, // Move
                `A 0.8 0.8 0 ${largeArcFlag} 1 ${endX * 0.8} ${endY * 0.8}` // Arc
              ].join(' ');

              return (
                <path
                  key={i}
                  d={pathData}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="0.4"
                  className="transition-all duration-500 ease-in-out hover:opacity-80 cursor-pointer"
                >
                  <title>{slice.label}: {slice.value}</title>
                </path>
              );
            })}
          </svg>
        ) : (
          <div className="w-full h-full rounded-full border-[25px] border-[#D6EAF8]/30" />
        )}

        <div className="text-center flex flex-col z-10 mt-1">
          <span className="text-[#457B9D]/60 text-[10px] uppercase font-bold tracking-widest mb-1">{totalLabel}</span>
          <span className="text-[#1D3557] font-extrabold text-3xl leading-none">{total}</span>
        </div>
      </div>
    </div>
  );
}
