import React from 'react';

const CELL_HEIGHT = 28;
const LEFT_MARGIN = 240;
const TOTAL_COL_WIDTH = 90;
const TOP_MARGIN = 120;
const BOTTOM_MARGIN = 100;
const SVG_WIDTH = 1200;

function getCellColor(value, maxValue) {
  if (!value || value <= 0) return '#f9fafb'; // empty/0
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

export default function AreaHeatmap({
  id = 'area-heatmap-image',
  heatmapData = { areas: [], linhas: [] },
  title = 'Matriz de Ensino Superior do Estado da Bahia',
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
      {/* Cabeçalho */}
      <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', margin: '0 0 4px 0' }}>
          {title}
        </h2>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#4b5563' }}>
          {subtitle} — Ordenado por Volume Total de Cursos
        </div>
      </div>

      {linhas.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          Nenhum dado encontrado para gerar a matriz com os filtros atuais.
        </div>
      ) : (
        <svg width={SVG_WIDTH} height={svgHeight} style={{ display: 'block' }}>
          {/* Cabeçalho das Colunas (Áreas Gerais + Total) */}
          <g>
            <text
              x={LEFT_MARGIN - 16}
              y={TOP_MARGIN - 16}
              textAnchor="end"
              fill="#4b5563"
              fontSize="12"
              fontWeight="bold"
            >
              MUNICÍPIO
            </text>
            {areas.map((area, colIdx) => {
              const x = LEFT_MARGIN + colIdx * colWidth + colWidth / 2;
              return (
                <text
                  key={`col-h-${area}`}
                  x={x}
                  y={TOP_MARGIN - 16}
                  textAnchor="middle"
                  fill="#1f2937"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {area.length > 20 ? area.substring(0, 18) + '…' : area}
                </text>
              );
            })}
            {/* Coluna Total Header */}
            <text
              x={LEFT_MARGIN + areas.length * colWidth + TOTAL_COL_WIDTH / 2}
              y={TOP_MARGIN - 16}
              textAnchor="middle"
              fill="#1e3a8a"
              fontSize="12"
              fontWeight="900"
            >
              TOTAL
            </text>
          </g>

          {/* Linhas (Municípios) */}
          {linhas.map((row, rowIdx) => {
            const y = TOP_MARGIN + rowIdx * CELL_HEIGHT;
            return (
              <g key={`row-${row.municipio}`}>
                {/* Fundo alternado da linha do município */}
                {rowIdx % 2 === 1 && (
                  <rect
                    x={0}
                    y={y}
                    width={SVG_WIDTH - 20}
                    height={CELL_HEIGHT}
                    fill="#fcfcfd"
                  />
                )}
                {/* Nome do Município */}
                <text
                  x={LEFT_MARGIN - 16}
                  y={y + CELL_HEIGHT / 2 + 4}
                  textAnchor="end"
                  fill="#111827"
                  fontSize="12"
                  fontWeight="700"
                >
                  {row.municipio}
                </text>

                {/* Células por Área */}
                {areas.map((area, colIdx) => {
                  const x = LEFT_MARGIN + colIdx * colWidth;
                  const val = row.contagem[area] || 0;
                  const cellColor = getCellColor(val, maxValue);
                  const textColor = getTextColor(val, maxValue);

                  return (
                    <g key={`cell-${row.municipio}-${area}`}>
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={colWidth - 4}
                        height={CELL_HEIGHT - 4}
                        fill={cellColor}
                        rx="4"
                      />
                      {val > 0 && (
                        <text
                          x={x + colWidth / 2}
                          y={y + CELL_HEIGHT / 2 + 4}
                          textAnchor="middle"
                          fill={textColor}
                          fontSize="11"
                          fontWeight="700"
                        >
                          {val}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Célula do Total */}
                <g>
                  <rect
                    x={LEFT_MARGIN + areas.length * colWidth + 4}
                    y={y + 2}
                    width={TOTAL_COL_WIDTH - 8}
                    height={CELL_HEIGHT - 4}
                    fill="#eff6ff"
                    stroke="#bfdbfe"
                    rx="4"
                  />
                  <text
                    x={LEFT_MARGIN + areas.length * colWidth + TOTAL_COL_WIDTH / 2}
                    y={y + CELL_HEIGHT / 2 + 4}
                    textAnchor="middle"
                    fill="#1e3a8a"
                    fontSize="12"
                    fontWeight="800"
                  >
                    {row.total}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Legenda de escala do Heatmap */}
          <g transform={`translate(${LEFT_MARGIN}, ${TOP_MARGIN + linhas.length * CELL_HEIGHT + 30})`}>
            <text x="0" y="14" fontSize="11" fontWeight="bold" fill="#4b5563">
              Escala de Concentração (Qtd. Cursos):
            </text>
            <g transform="translate(220, 0)">
              {[
                { color: '#f9fafb', label: '0 / Vazio', border: '#e5e7eb' },
                { color: '#eff6ff', label: 'Baixa', border: '#bfdbfe' },
                { color: '#93c5fd', label: 'Média', border: '#60a5fa' },
                { color: '#2563eb', label: 'Alta', border: '#1d4ed8' },
                { color: '#1e3a8a', label: 'Máxima', border: '#1e3a8a' },
              ].map((item, idx) => (
                <g key={`leg-${item.label}`} transform={`translate(${idx * 110}, 0)`}>
                  <rect x="0" y="2" width="16" height="16" fill={item.color} stroke={item.border} rx="3" />
                  <text x="22" y="14" fontSize="11" fill="#4b5563">{item.label}</text>
                </g>
              ))}
            </g>
          </g>
        </svg>
      )}

      {/* Rodapé */}
      <div style={{ marginTop: '30px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280' }}>
        <div>SECTI — Secretaria de Ciência, Tecnologia e Inovação da Bahia</div>
        <div>Heatmap Agregado Institucional</div>
      </div>
    </div>
  );
}
