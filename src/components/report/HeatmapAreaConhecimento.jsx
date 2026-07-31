import React from 'react';

const CELL_HEIGHT = 28;
const LEFT_MARGIN = 240;
const TOTAL_COL_WIDTH = 90;
const TOP_MARGIN = 120;
const BOTTOM_MARGIN = 100;
const SVG_WIDTH = 1200;

function getCellColor(value, maxValue) {
  if (!value || value <= 0) return '#f9fafb';
  const ratio = maxValue > 0 ? value / maxValue : 0;
  if (ratio <= 0.15) return '#eff6ff';
  if (ratio <= 0.35) return '#dbeafe';
  if (ratio <= 0.55) return '#93c5fd';
  if (ratio <= 0.75) return '#3b82f6';
  if (ratio <= 0.90) return '#2563eb';
  return '#1e3a8a';
}

function getTextColor(value, maxValue) {
  if (!value || value <= 0) return '#9ca3af';
  const ratio = maxValue > 0 ? value / maxValue : 0;
  return ratio > 0.6 ? '#ffffff' : '#1f2937';
}

export default function HeatmapAreaConhecimento({
  id = 'heatmap-area-conhecimento',
  heatmapData = { areas: [], linhas: [] },
  title = 'Matriz de Ensino Superior',
  subtitle = 'Distribuição de Cursos por Município e Área Geral do Conhecimento',
}) {
  const { areas = [], linhas = [] } = heatmapData;

  const numCols = areas.length;
  const colWidth = numCols > 0 ? Math.floor((SVG_WIDTH - LEFT_MARGIN - TOTAL_COL_WIDTH - 40) / numCols) : 120;
  const svgHeight = TOP_MARGIN + (linhas.length > 0 ? linhas.length * CELL_HEIGHT : 80) + BOTTOM_MARGIN;

  let maxValue = 1;
  linhas.forEach(row => {
    areas.forEach(area => {
      const val = row.contagem[area] || 0;
      if (val > maxValue) maxValue = val;
    });
  });

  return (
    <div
      id={id}
      style={{
        width: `${SVG_WIDTH}px`,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica, Arial, sans-serif',
        padding: '30px',
        boxSizing: 'border-box',
        color: '#1f2937',
      }}
    >
      <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px 0' }}>
          {title}
        </h2>
        <p style={{ fontSize: '16px', color: '#4b5563', margin: 0 }}>
          {subtitle}
        </p>
      </div>

      <svg width={SVG_WIDTH} height={svgHeight} style={{ display: 'block' }}>
        <g transform={`translate(${LEFT_MARGIN}, ${TOP_MARGIN - 20})`}>
          {areas.map((area, colIdx) => {
            const x = colIdx * colWidth + colWidth / 2;
            return (
              <g key={area} transform={`translate(${x}, 0) rotate(-40)`}>
                <text
                  x={0}
                  y={0}
                  fontSize={12}
                  fontWeight="bold"
                  fill="#374151"
                  textAnchor="start"
                >
                  {area}
                </text>
              </g>
            );
          })}
          <text
            x={areas.length * colWidth + TOTAL_COL_WIDTH / 2}
            y={-10}
            fontSize={13}
            fontWeight="bold"
            fill="#1e3a8a"
            textAnchor="middle"
          >
            TOTAL
          </text>
        </g>

        <g transform={`translate(0, ${TOP_MARGIN})`}>
          {linhas.map((row, rowIdx) => {
            const y = rowIdx * CELL_HEIGHT;
            return (
              <g key={row.municipio} transform={`translate(0, ${y})`}>
                <text
                  x={LEFT_MARGIN - 16}
                  y={CELL_HEIGHT / 2 + 4}
                  fontSize={13}
                  fontWeight="bold"
                  fill="#374151"
                  textAnchor="end"
                >
                  {row.municipio}
                </text>

                {areas.map((area, colIdx) => {
                  const x = LEFT_MARGIN + colIdx * colWidth;
                  const value = row.contagem[area] || 0;
                  const bg = getCellColor(value, maxValue);
                  const fg = getTextColor(value, maxValue);

                  return (
                    <g key={area} transform={`translate(${x}, 0)`}>
                      <rect
                        x={1}
                        y={1}
                        width={colWidth - 2}
                        height={CELL_HEIGHT - 2}
                        fill={bg}
                        rx={3}
                      />
                      <text
                        x={colWidth / 2}
                        y={CELL_HEIGHT / 2 + 5}
                        fontSize={12}
                        fontWeight={value > 0 ? 'bold' : 'normal'}
                        fill={fg}
                        textAnchor="middle"
                      >
                        {value > 0 ? value : '-'}
                      </text>
                    </g>
                  );
                })}

                <g transform={`translate(${LEFT_MARGIN + areas.length * colWidth}, 0)`}>
                  <rect
                    x={2}
                    y={1}
                    width={TOTAL_COL_WIDTH - 4}
                    height={CELL_HEIGHT - 2}
                    fill="#eff6ff"
                    stroke="#bfdbfe"
                    rx={3}
                  />
                  <text
                    x={TOTAL_COL_WIDTH / 2}
                    y={CELL_HEIGHT / 2 + 5}
                    fontSize={13}
                    fontWeight="bold"
                    fill="#1e3a8a"
                    textAnchor="middle"
                  >
                    {row.total}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
