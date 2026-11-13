import React from 'react';
import { cn } from '../../lib/cn';

const BAHIA_PATH =
  'M 12.8 34.5 L 8.6 32.5 L 10.8 28.5 L 13.0 25.7 L 16.3 22.4 L 18.5 23.5 L 20.3 27.5 L 24.4 28.0 L 27.6 25.8 L 31.5 24.7 L 33.9 21.2 L 33.5 18.2 L 36.2 14.3 L 40.1 15.4 L 43.3 16.7 L 46.9 14.9 L 51.1 14.0 L 54.3 11.1 L 57.7 9.6 L 60.4 12.3 L 61.2 15.5 L 64.7 15.2 L 68.7 12.0 L 72.2 8.7 L 75.7 9.5 L 80.7 10.8 L 83.4 12.4 L 85.4 15.9 L 86.1 19.8 L 87.6 23.8 L 84.5 26.7 L 85.2 29.6 L 86.7 32.6 L 89.8 33.7 L 88.9 38.5 L 84.0 44.8 L 79.4 47.1 L 77.7 50.5 L 77.6 53.9 L 76.4 61.3 L 77.8 69.6 L 76.6 75.4 L 75.3 81.3 L 74.6 87.8 L 65.5 88.5 L 64.2 85.5 L 62.7 82.7 L 64.0 79.6 L 65.1 77.8 L 67.8 74.9 L 68.6 72.0 L 65.4 70.4 L 61.6 69.2 L 58.1 69.6 L 50.5 64.8 L 46.4 64.1 L 42.2 61.7 L 38.2 60.6 L 34.2 60.9 L 32.2 57.4 L 28.8 56.9 L 24.8 59.0 L 20.5 61.5 L 16.7 63.8 L 13.1 65.7 L 13.3 62.2 L 13.4 58.9 L 13.0 56.9 L 11.2 54.0 L 11.5 51.2 L 12.6 48.7 L 10.9 46.8 L 11.2 44.9 L 12.1 41.8 L 10.2 39.4 L 11.7 36.8 L 12.2 34.8 Z';

// 8 principais agrupamentos de ativos CT&I conectados em árvore geradora mínima
const ANCHORS = [
  { id: 'salvador', x: 77.5, y: 46.0, r: 5.4, highlight: true },
  { id: 'feira', x: 76.5, y: 39.8, r: 3.6 },
  { id: 'ilheus', x: 75.8, y: 61.5, r: 3.4 },
  { id: 'conquista', x: 60.3, y: 62.2, r: 3.1 },
  { id: 'jequie', x: 67.2, y: 53.6, r: 2.5 },
  { id: 'bonfim', x: 66.2, y: 24.5, r: 2.7 },
  { id: 'juazeiro', x: 63.4, y: 17.5, r: 2.6 },
  { id: 'barreiras', x: 23.5, y: 39.0, r: 2.7 },
];

const CONNECTIONS = [
  ['barreiras', 'conquista'],
  ['conquista', 'jequie'],
  ['jequie', 'ilheus'],
  ['jequie', 'feira'],
  ['feira', 'salvador'],
  ['feira', 'bonfim'],
  ['bonfim', 'juazeiro'],
];

const ANCHOR_MAP = Object.fromEntries(ANCHORS.map((a) => [a.id, a]));

/**
 * Marca oficial B (Rede Territorial) do Painel Territorial CT&I.
 * Contorno da Bahia em Azul Bahia (#044B8D) com 8 âncoras conectadas e polo de Salvador em Amarelo Bahia (#F7B818).
 */
export function PanelMark({ className, 'aria-hidden': ariaHidden = true }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-hidden={ariaHidden}
      className={cn('shrink-0 select-none', className)}
    >
      <path
        d={BAHIA_PATH}
        className="fill-brand dark:fill-primary-600 stroke-brand dark:stroke-primary-400/50"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <g stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="1.7" strokeLinecap="round">
        {CONNECTIONS.map(([fromId, toId]) => {
          const from = ANCHOR_MAP[fromId];
          const to = ANCHOR_MAP[toId];
          return <line key={`${fromId}-${toId}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
        })}
      </g>
      {ANCHORS.map((anchor) => (
        <circle
          key={anchor.id}
          cx={anchor.x}
          cy={anchor.y}
          r={anchor.r}
          fill={anchor.highlight ? 'rgb(var(--color-accent-500))' : '#FFFFFF'}
        />
      ))}
    </svg>
  );
}

export default PanelMark;

