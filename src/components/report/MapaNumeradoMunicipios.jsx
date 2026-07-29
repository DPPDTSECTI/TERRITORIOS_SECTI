import React, { useEffect, useState, useMemo } from 'react';
import * as topojson from 'topojson-client';
import { normalize } from '../../utils/normalization.js';

const SVG_W = 750;
const SVG_H = 750;
const PADDING = 20;

const CATEGORY_COLORS = {
  federal: '#1d4ed8',
  campiUniversidadePublica: '#1d4ed8',
  estadual: '#dc2626',
  institutoFederal: '#16a34a',
  campiInstitutoFederal: '#16a34a',
  privada: '#7e22ce',
  campiUniversidadePrivada: '#7e22ce',
  icts: '#0891b2',
  centrosPesquisa: '#4f46e5',
  parquesTecnologicos: '#ea580c',
  incubadorasAceleradoras: '#db2777',
  espacoDinamizadoress: '#0d9488',
  default: '#4b5563',
};

function buildSvgPath(geometry, projectFn) {
  if (!geometry) return '';
  const type = geometry.type;
  if (type === 'Polygon') {
    return geometry.coordinates
      .map(ring => {
        return ring
          .map((coord, i) => {
            const [x, y] = projectFn(coord);
            return (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ') + ' Z';
      })
      .join(' ');
  } else if (type === 'MultiPolygon') {
    return geometry.coordinates
      .map(polygon => {
        return polygon
          .map(ring => {
            return ring
              .map((coord, i) => {
                const [x, y] = projectFn(coord);
                return (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(' ') + ' Z';
          })
          .join(' ');
      })
      .join(' ');
  }
  return '';
}

export default function MapaNumeradoMunicipios({
  id = 'mapa-numerado-municipios',
  municipiosList = [],
  title = 'Distribuição Regional',
  subtitle = 'Mapeamento de Municípios',
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
        console.error('Erro ao carregar mapa numerado:', err);
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
    municipiosList.forEach((item, index) => {
      munMap.set(normalize(item.municipio), {
        numero: item.numero || index + 1,
        municipio: item.municipio,
        categoria: item.categoria || item.instituicoes?.[0]?.categoria || 'default',
      });
    });

    features.forEach(feat => {
      const match = munMap.get(normalize(feat.nome));
      if (match) {
        markers.push({
          numero: match.numero,
          municipio: match.municipio,
          cx: feat.cx,
          cy: feat.cy,
          color: CATEGORY_COLORS[match.categoria] || CATEGORY_COLORS.default,
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
        width: '1400px',
        minHeight: '800px',
        padding: '40px',
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica, Arial, sans-serif',
        boxSizing: 'border-box',
        color: '#1f2937',
      }}
    >
      <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: '16px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px 0' }}>
          {title}
        </h2>
        <p style={{ fontSize: '18px', color: '#4b5563', margin: 0 }}>
          {subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        <div style={{ width: '750px', flexShrink: 0, border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc' }}>
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
            <g>
              {features.map(feat => (
                <path
                  key={feat.id}
                  d={feat.dPath}
                  fill="#e2e8f0"
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                />
              ))}
            </g>
            <g>
              {mapMarkers.map(m => (
                <g key={m.numero} transform={`translate(${m.cx}, ${m.cy})`}>
                  <circle r="12" fill={m.color} stroke="#ffffff" strokeWidth="2" />
                  <text
                    textAnchor="middle"
                    dy=".32em"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {m.numero}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a', marginTop: 0, marginBottom: '16px' }}>
            Municípios Mapeados ({municipiosList.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {municipiosList.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: CATEGORY_COLORS[item.categoria || item.instituicoes?.[0]?.categoria] || CATEGORY_COLORS.default,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  {item.numero || index + 1}
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  {item.municipio}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
