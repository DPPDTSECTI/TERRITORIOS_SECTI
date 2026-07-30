import React from 'react';

const LEFT_MARGIN = 240;
const RIGHT_MARGIN = 110;
const SVG_WIDTH = 1200;
const ROW_HEIGHT = 36;
const BAR_HEIGHT = 22;
const TOP_MARGIN = 40;
const BOTTOM_MARGIN = 50;

/**
 * Paleta curada de cores vibrantes para as Áreas Gerais do Conhecimento
 */
const AREA_COLORS = [
  '#2563eb', // Azul real
  '#16a34a', // Verde esmeralda
  '#d97706', // Âmbar / Laranja dourado
  '#9333ea', // Roxo / Púrpura
  '#e11d48', // Carmim
  '#0891b2', // Ciano
  '#ea580c', // Laranja escuro
  '#4f46e5', // Índigo
  '#059669', // Verde teal
  '#ca8a04', // Amarelo escuro
  '#c026d3', // Magenta
  '#0284c7', // Azul oceano
  '#65a30d', // Verde lima
  '#dc2626', // Vermelho
  '#7c3aed', // Violeta
  '#475569', // Ardósia
];

export function getAreaColor(index) {
  return AREA_COLORS[index % AREA_COLORS.length];
}

/**
 * Componente SVG para exibição do Gráfico de Barras Horizontais Fatiadas (Stacked Bar Chart)
 * de Cursos de Ensino Superior por Município e Área Geral do Conhecimento.
 */
export default function StackedBarCursosMunicipios({
  id = 'report-image-cursos',
  heatmapData = { areas: [], linhas: [] },
  title = 'Cursos de Ensino Superior — Escopo: Estado da Bahia (Todos os Territórios)',
  subtitle = 'Distribuição de Cursos por Território de Identidade fatiada por Área Geral do Conhecimento',
}) {
  const { areas = [], linhas = [] } = heatmapData;

  // Limitar aos top 30 itens (para acomodar os 27 territórios no relatório estadual)
  const displayLinhas = linhas.slice(0, 30);
  const numRows = displayLinhas.length;

  // Calcular valor máximo geral de cursos entre municípios exibidos
  const maxTotal = Math.max(1, ...displayLinhas.map((r) => r.total || 0));
  const chartWidth = SVG_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;

  // Cálculo da altura do bloco de Legenda (2 colunas largas)
  const numRowsLegend = Math.ceil(areas.length / 2);
  const legendHeight = areas.length > 0 ? numRowsLegend * 28 + 35 : 20;

  const chartTopY = TOP_MARGIN + legendHeight + 40;

  // Altura alvo proporcional à página A4 vertical inteira (190mm x 277mm -> aspecto 1.458 -> ~1750px)
  const targetSvgHeight = 1750;
  const availableRowsHeight = Math.max(800, targetSvgHeight - chartTopY - BOTTOM_MARGIN);
  const rowHeight = Math.min(80, Math.max(45, Math.floor(availableRowsHeight / Math.max(1, numRows))));
  const barHeight = Math.max(26, Math.round(rowHeight * 0.65));
  const barOffsetY = Math.round((rowHeight - barHeight) / 2);
  const textOffsetY = Math.round(rowHeight / 2) + 5;
  const barTextOffsetY = Math.round(barHeight / 2) + 4;

  const svgHeight = Math.max(targetSvgHeight, chartTopY + Math.max(1, numRows) * rowHeight + BOTTOM_MARGIN);

  // Marcas de grade (0%, 25%, 50%, 75%, 100%)
  const gridTicks = [0, 0.25, 0.5, 0.75, 1.0].map((ratio) => ({
    ratio,
    value: Math.round(ratio * maxTotal),
    x: LEFT_MARGIN + ratio * chartWidth,
  }));

  return (
    <div
      id={id}
      style={{
        width: `${SVG_WIDTH}px`,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica, Arial, sans-serif',
        padding: '35px',
        boxSizing: 'border-box',
        color: '#1f2937',
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          borderBottom: '3px solid #1e3a8a',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1e3a8a',
            margin: '0 0 6px 0',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: '#4b5563',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </p>
      </div>

      <svg
        width={SVG_WIDTH}
        height={svgHeight}
        viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
        style={{ display: 'block' }}
      >
        {/* LEGENDA - ÁREAS DO CONHECIMENTO */}
        {areas.length > 0 && (
          <g transform={`translate(40, ${TOP_MARGIN})`}>
            <text
              x="0"
              y="-10"
              fill="#1e3a8a"
              fontSize="14"
              fontWeight="bold"
            >
              Legenda — Áreas do Conhecimento:
            </text>
            {areas.map((area, idx) => {
              const col = idx % 2;
              const row = Math.floor(idx / 2);
              const xPos = col * 550;
              const yPos = row * 26 + 8;
              return (
                <g key={area} transform={`translate(${xPos}, ${yPos})`}>
                  <rect
                    x="0"
                    y="0"
                    width="16"
                    height="16"
                    rx="3"
                    fill={getAreaColor(idx)}
                  />
                  <text
                    x="24"
                    y="13"
                    fill="#374151"
                    fontSize="13"
                    fontWeight="600"
                  >
                    {area}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* LINHAS E RÓTULOS DO GRID VERTICAL */}
        {gridTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={tick.x}
              y1={chartTopY - 15}
              x2={tick.x}
              y2={chartTopY + numRows * rowHeight + 10}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
            <text
              x={tick.x}
              y={chartTopY - 20}
              textAnchor="middle"
              fill="#6b7280"
              fontSize="12"
              fontWeight="600"
            >
              {tick.value}
            </text>
          </g>
        ))}

        {/* BARRAS DOS MUNICÍPIOS */}
        {displayLinhas.map((row, rowIdx) => {
          const y = chartTopY + rowIdx * rowHeight;
          const totalLength = Math.max(2, (row.total / maxTotal) * chartWidth);
          let currentX = LEFT_MARGIN;

          return (
            <g key={row.municipio || rowIdx}>
              {/* Rótulo do Município */}
              <text
                x={LEFT_MARGIN - 15}
                y={y + textOffsetY}
                textAnchor="end"
                fill="#1e3a8a"
                fontSize="15"
                fontWeight="bold"
              >
                {row.municipio}
              </text>

              {/* Trilha de fundo sutil */}
              <rect
                x={LEFT_MARGIN}
                y={y + barOffsetY}
                width={chartWidth}
                height={barHeight}
                fill="#f8fafc"
                rx="4"
              />

              {/* Segmentos fatiados por Área do Conhecimento */}
              {areas.map((area, areaIdx) => {
                const count = row.contagem[area] || 0;
                if (count <= 0) return null;

                const sliceWidth = (count / row.total) * totalLength;
                const sliceX = currentX;
                currentX += sliceWidth;

                return (
                  <g key={area}>
                    <rect
                      x={sliceX}
                      y={y + barOffsetY}
                      width={sliceWidth}
                      height={barHeight}
                      fill={getAreaColor(areaIdx)}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {sliceWidth >= 26 && (
                      <text
                        x={sliceX + sliceWidth / 2}
                        y={y + barOffsetY + barTextOffsetY}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {count}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Contagem Total do Município ao final da barra */}
              <text
                x={LEFT_MARGIN + totalLength + 10}
                y={y + textOffsetY}
                fill="#1e3a8a"
                fontSize="15"
                fontWeight="bold"
              >
                {row.total}
              </text>
            </g>
          );
        })}

        {/* Eixo de base inferior */}
        <line
          x1={LEFT_MARGIN}
          y1={chartTopY + numRows * rowHeight + 10}
          x2={LEFT_MARGIN + chartWidth}
          y2={chartTopY + numRows * rowHeight + 10}
          stroke="#9ca3af"
          strokeWidth="1.5"
        />
      </svg>

      {/* Rodapé institucional */}
      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          marginTop: '24px',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#6b7280',
        }}
      >
        <span>
          Fonte: INEP / Censo da Educação Superior (2024) — Dados processados
          pela SECTI-BA
        </span>
        <span>
          Qtd. Total Exibida: {displayLinhas.length} (
          {linhas.length > 30
            ? `Top 30 de ${linhas.length} locais`
            : `Todos os ${linhas.length} locais com cursos`}
          )
        </span>
      </div>
    </div>
  );
}
