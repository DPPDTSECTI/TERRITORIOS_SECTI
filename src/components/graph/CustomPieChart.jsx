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
    fill: d[colorKey] || '#2563EB'
  }));

  const totalValue = normalizedData.reduce((acc, item) => acc + item[valueKey], 0);
  const displayValue = hoveredIndex !== null && normalizedData[hoveredIndex] ? normalizedData[hoveredIndex][valueKey] : totalValue;
  const displayLabel = hoveredIndex !== null && normalizedData[hoveredIndex] ? normalizedData[hoveredIndex][labelKey] : defaultCenterLabel;

  const chartData = normalizedData.length > 0 ? normalizedData : [{ [valueKey]: 1, fill: '#E2E8F0', [labelKey]: 'Sem dados' }];

  return (
    <div className="flex-1 bg-white rounded-[24px] border border-transparent hover:border-[#D6EAF8]/50 shadow-[0_4px_24px_rgba(29,53,87,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(29,53,87,0.1)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-5 relative flex flex-col justify-start h-full group cursor-default">
      
      {/* CABEÇALHO */}
      <div className="flex justify-between items-start mb-3 relative z-10 w-full">
        <div className="flex flex-col">
          <h2 className="text-[#1D3557] font-extrabold text-[15px] tracking-tight">{title}</h2>
          <p className="text-[#457B9D]/60 text-[11px] font-medium mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="flex flex-row items-center justify-between flex-1 gap-4 min-w-0">
        
        {/* GRÁFICO */}
        <div className="flex flex-col items-center justify-center w-[140px] shrink-0">
          <div className="relative">
            <PieChart width={140} height={140} className="drop-shadow-sm">
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
                        className="cursor-pointer drop-shadow-sm transition-opacity duration-300 ease-in-out"
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
            <span className="text-[#1D3557] font-extrabold text-[20px] leading-none mb-1 tracking-tight transition-all duration-300">
              {displayValue.toLocaleString('pt-BR')}
            </span>
            <span className="text-[#457B9D]/80 font-semibold text-[10px] leading-tight transition-all duration-300 px-1 w-full truncate">
              {displayLabel}
            </span>
          </div>
        </div>

        {/* LISTA LATERAL */}
        {children ? (
          children
        ) : (
          <div className="flex flex-col flex-1 pl-4 lg:pl-6 border-l border-[#E2E8F0]/50 justify-center h-full py-1 min-w-0">
            <h3 className="text-[#1D3557] font-extrabold text-[10px] tracking-widest uppercase mb-3 truncate">
              {listTitle}
            </h3>

            <div className="flex flex-col gap-3.5 w-full">
              {topList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group min-w-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-[20px] h-[20px] rounded-md ${item.color || 'bg-[#2563EB]/10'} ${item.text || 'text-[#2563EB]'} flex items-center justify-center font-bold text-[9px] shadow-sm shrink-0`}>
                      {item.rank || idx + 1}º
                    </div>
                    <span className="text-[11px] font-bold text-[#2563EB] group-hover:text-[#1D3557] transition-colors truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <span className="font-extrabold text-[#1D3557] text-[12px] shrink-0">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}