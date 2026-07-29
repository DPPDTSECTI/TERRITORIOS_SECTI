import React, { useEffect, useState, useMemo } from 'react';
import * as topojson from 'topojson-client';
import { normalize } from '../../utils/normalization.js';

const SVG_W = 750;
const SVG_H = 750;
const PADDING = 20;

const CATEGORY_COLORS = {
  federal: '#1d4ed8',        // Azul Federal
  estadual: '#dc2626',       // Vermelho Estadual
  institutoFederal: '#16a34a', // Verde Instituto Federal
  default: '#4b5563',        // Cinza
};

const CATEGORY_BADGES = {
  federal: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
  estadual: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
  institutoFederal: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  default: 'bg-gray-100 text-gray-700 border-gray-300',
};

function getPrimaryCategory(instituicoes = []) {
  if (instituicoes.some(i => i.categoria === 'federal')) return 'federal';
  if (instituicoes.some(i => i.categoria === 'estadual')) return 'estadual';
  if (instituicoes.some(i => i.categoria === 'institutoFederal')) return 'institutoFederal';
  return 'default';
}

export default function MunicipiosReportImage({
  id = 'municipios-report-image',
  municipiosList = [],
  title = 'Programa de Ciência, Tecnologia e Inovação',
  subtitle = 'Ensino Superior Público no Estado da Bahia',
  dateString = new Date().toLocaleDateString('pt-BR'),
}) {
  const [geoData, setGeoData] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch('/BA_(1)9396399957704198.json')
      .then(res => res.json())
      .then(topology => {
        const geo = topojson.feature(topology, topology.objects.BA);
        setGeoData(geo);
        setIsLoaded(true);
      })
      .catch(err => {
        console.error('Erro ao carregar mapa para relatório:', err);
        setIsLoaded(true);
      });
  }, []);

  const { features, project } = useMemo(() => {
    if (!geoData) return { features: [], project: () => [0, 0] };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    geoData.features.forEach(feat => {
      if (!feat.geometry) return;
      const coords = feat.geometry.type === 'Polygon'
        ? feat.geometry.coordinates.flat()
        : feat.geometry.coordinates.flat(2);
      coords.forEach(([x, y]) => {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      });
    });

    const width = SVG_W - 2 * PADDING;
    const height = SVG_H - 2 * PADDING;
    const scaleX = width / (maxX - minX);
    const scaleY = height / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    const projectFn = ([x, y]) => [
      PADDING + (x - minX) * scale + (width - (maxX - minX) * scale) / 2,
      PADDING + (maxY - y) * scale + (height - (maxY - minY) * scale) / 2,
    ];

    const processedFeatures = geoData.features.map((feat, idx) => {
      const nome = feat.properties?.NOME || feat.properties?.nome || '';
      let cx = 0, cy = 0, count = 0;

      if (feat.geometry) {
        const coords = feat.geometry.type === 'Polygon'
          ? feat.geometry.coordinates.flat()
          : feat.geometry.coordinates.flat(2);
        coords.forEach(([x, y]) => {
          const [px, py] = projectFn([x, y]);
          cx += px;
          cy += py;
          count++;
        });
      }

      const dPath = feat.geometry ? buildSvgPath(feat.geometry, projectFn) : '';

      return {
        id: idx,
        nome,
        cx: count > 0 ? cx / count : 0,
        cy: count > 0 ? cy / count : 0,
        dPath,
      };
    });

    return { features: processedFeatures, project: projectFn };
  }, [geoData]);

  const mapMarkers = useMemo(() => {
    const markers = [];
    const munMap = new Map();
    municipiosList.forEach(item => {
      munMap.set(normalize(item.municipio), item);
    });

    features.forEach(feat => {
      const match = munMap.get(normalize(feat.nome));
      if (match) {
        const primaryCat = getPrimaryCategory(match.instituicoes);
        markers.push({
          numero: match.numero,
          municipio: match.municipio,
          cx: feat.cx,
          cy: feat.cy,
          color: CATEGORY_COLORS[primaryCat] || CATEGORY_COLORS.default,
        });
      }
    });

    return markers;
  }, [features, municipiosList]);

  return (
    <div
      id={id}
      data-loaded={isLoaded ? 'true' : 'false'}
      style={{
        width: '1600px',
        minHeight: '900px',
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica, Arial, sans-serif',
        padding: '40px',
        boxSizing: 'border-box',
        color: '#1f2937',
      }}
      className="bg-white"
    >
      {/* Cabeçalho Institucional */}
      <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: '20px', marginBottom: '30px' }} className="flex justify-between items-center">
        <div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Governo do Estado da Bahia — SECTI
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e3a8a', margin: '4px 0', lineHeight: 1.2 }}>
            {title}
          </h1>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#374151' }}>
            {subtitle}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563' }}>
            Emissão: {dateString}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Painel de Ciência, Tecnologia e Inovação
          </div>
        </div>
      </div>

      {/* Conteúdo Principal: Duas colunas (Mapa numerado + Lista em duas colunas) */}
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        {/* Coluna Esquerda: Mapa SVG numerado */}
        <div style={{ width: '750px', flexShrink: 0, border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', backgroundColor: '#f9fafb' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a8a', marginBottom: '12px', textAlign: 'center' }}>
            Distribuição Geográfica de Municípios com Ensino Superior Público
          </div>
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block', margin: '0 auto' }}>
            {/* Malha de Municípios */}
            <g>
              {features.map(f => (
                <path
                  key={`base-${f.id}`}
                  d={f.dPath}
                  fill="#f3f4f6"
                  stroke="#d1d5db"
                  strokeWidth="0.8"
                />
              ))}
            </g>
            {/* Marcadores Numerados */}
            <g>
              {mapMarkers.map(m => (
                <g key={`marker-${m.numero}`}>
                  <circle
                    cx={m.cx}
                    cy={m.cy}
                    r="14"
                    fill={m.color}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  <text
                    x={m.cx}
                    y={m.cy}
                    textAnchor="middle"
                    alignmentBaseline="central"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {m.numero}
                  </text>
                </g>
              ))}
            </g>
          </svg>
          {/* Legenda do Mapa */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', fontSize: '13px', fontWeight: '600' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: CATEGORY_COLORS.federal, display: 'inline-block' }}></span>
              <span>Federal</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: CATEGORY_COLORS.estadual, display: 'inline-block' }}></span>
              <span>Estadual</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: CATEGORY_COLORS.institutoFederal, display: 'inline-block' }}></span>
              <span>Instituto Federal</span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Lista de Municípios em 2 colunas */}
        <div style={{ width: '730px', flexShrink: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1f2937', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
            Municípios e Instituições Presentes ({municipiosList.length})
          </div>
          {municipiosList.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '15px' }}>
              Nenhum município encontrado com os filtros aplicados.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {municipiosList.map(item => {
                const primaryCat = getPrimaryCategory(item.instituicoes);
                const markerColor = CATEGORY_COLORS[primaryCat] || CATEGORY_COLORS.default;

                return (
                  <div
                    key={`mun-row-${item.numero}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      border: '1px solid #f3f4f6',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: markerColor,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '12px',
                        flexShrink: 0,
                      }}
                    >
                      {item.numero}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', marginBottom: '4px' }}>
                        {item.municipio}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {item.instituicoes.map(inst => {
                          const badgeClass = CATEGORY_BADGES[inst.categoria] || CATEGORY_BADGES.default;
                          return (
                            <span
                              key={`${item.numero}-${inst.sigla}`}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeClass}`}
                              style={{ display: 'inline-block' }}
                            >
                              {inst.sigla}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rodapé institucional */}
      <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
        <div>
          Secretaria de Ciência, Tecnologia e Inovação do Estado da Bahia — SECTI
        </div>
        <div>
          Relatório Institucional Agregado
        </div>
      </div>
    </div>
  );
}

function buildSvgPath(geometry, projectFn) {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ring => buildRingPath(ring, projectFn)).join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map(poly => poly.map(ring => buildRingPath(ring, projectFn)).join(' ')).join(' ');
  }
  return '';
}

function buildRingPath(ring, projectFn) {
  if (!ring || ring.length === 0) return '';
  return ring.map(([x, y], i) => {
    const [px, py] = projectFn([x, y]);
    return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
  }).join(' ') + ' Z';
}
