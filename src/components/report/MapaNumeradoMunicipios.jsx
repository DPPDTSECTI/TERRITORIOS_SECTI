import React, { useEffect, useState, useMemo } from 'react';
import * as topojson from 'topojson-client';
import { normalize } from '../../utils/normalization.js';
import territorioMunicipios from '../../../utils/territorioMunicipios.json';

const SVG_W = 750;
const SVG_H = 750;
const PADDING = 20;

const CATEGORY_COLORS = {
  federal: '#2563eb', // Azul
  campiUniversidadePublica: '#2563eb',
  estadual: '#9333ea', // Roxo
  institutoFederal: '#059669', // Verde
  campiInstitutoFederal: '#059669',
  privada: '#7e22ce',
  campiUniversidadePrivada: '#7e22ce',
  icts: '#0891b2',
  centrosPesquisa: '#4f46e5',
  parquesTecnologicos: '#ea580c',
  incubadorasAceleradoras: '#db2777',
  espacoDinamizadoress: '#0d9488',
  default: '#4b5563',
};

const CATEGORY_LABELS = {
  federal: 'Federal',
  campiUniversidadePublica: 'Federal',
  estadual: 'Estadual',
  institutoFederal: 'Inst. Federal',
  campiInstitutoFederal: 'Inst. Federal',
  privada: 'Privada',
  campiUniversidadePrivada: 'Privada',
  icts: 'ICTs',
  centrosPesquisa: 'Centros de Pesquisa',
  parquesTecnologicos: 'Parques Tecnológicos',
  incubadorasAceleradoras: 'Incubadoras / Aceleradoras',
  espacoDinamizadoress: 'Espaços Dinamizadores',
  default: 'Outros',
};

function getSphereCounts(municipiosList = [], isTerritoryMode = false, id = '') {
  if (isTerritoryMode) {
    if (id === 'report-image-univ_privadas') {
      return {
        privada: 83,
      };
    }
    if (id === 'report-image-univ_publicas') {
      return {
        federal: 23,
        institutoFederal: 40,
        estadual: 31,
      };
    }
  }
  const counts = {};
  municipiosList.forEach(item => {
    if (Array.isArray(item.instituicoes) && item.instituicoes.length > 0) {
      item.instituicoes.forEach(inst => {
        let cat = inst.categoria || 'default';
        if (cat === 'campiUniversidadePublica') cat = 'federal';
        if (cat === 'campiInstitutoFederal') cat = 'institutoFederal';
        if (cat === 'campiUniversidadePrivada') cat = 'privada';
        counts[cat] = (counts[cat] || 0) + 1;
      });
    } else {
      let cat = item.categoria || 'default';
      if (cat === 'campiUniversidadePublica') cat = 'federal';
      if (cat === 'campiInstitutoFederal') cat = 'institutoFederal';
      if (cat === 'campiUniversidadePrivada') cat = 'privada';
      counts[cat] = (counts[cat] || 0) + 1;
    }
  });
  return counts;
}

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
  selectedLocation = null,
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

    let activeFeatures = geoData.features;
    const terrName = selectedLocation ? normalize(selectedLocation.nome || selectedLocation.territory || '') : '';
    if (terrName) {
      const terrList = territorioMunicipios.territorios_de_identidade || [];
      const terrObj = terrList.find(t => normalize(t.nome) === terrName);
      if (terrObj && Array.isArray(terrObj.municipios)) {
        const munSet = new Set(terrObj.municipios.map(m => normalize(m)));
        const filtered = geoData.features.filter(feat =>
          munSet.has(normalize(feat.properties?.NOME || feat.properties?.nome || ''))
        );
        if (filtered.length > 0) {
          activeFeatures = filtered;
        }
      }
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    activeFeatures.forEach(feat => {
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

    const processedFeatures = activeFeatures.map((feat, idx) => {
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
  }, [geoData, selectedLocation]);

  const isTerritoryMode = useMemo(() => {
    return municipiosList.some(item => {
      const k = normalize(item.municipio);
      return k.includes('territorio') || k.includes('bacia') || k.includes('litoral') || k.includes('portal');
    });
  }, [municipiosList]);

  const mapMarkers = useMemo(() => {
    try {
      const markers = [];
      const munMap = new Map();
      municipiosList.forEach((item, index) => {
        munMap.set(normalize(item.municipio), {
          numero: item.numero || index + 1,
          municipio: item.municipio, // Pode ser município ou território
          categoria: item.categoria || item.instituicoes?.[0]?.categoria || 'default',
        });
      });

    // isTerritoryMode já foi computado no escopo acima

    if (isTerritoryMode) {
      // Se for modo território, a gente usa a lista importada
      const terrList = territorioMunicipios.territorios_de_identidade;
      
      munMap.forEach((match, terrNorm) => {
        // Encontrar o território no JSON
        const terrData = terrList.find(t => normalize(t.nome) === terrNorm);
        if (terrData && terrData.municipios) {
          // Computar o centroide somando todos os cx, cy das cidades deste território
          let sumCx = 0, sumCy = 0, count = 0;
          terrData.municipios.forEach(mName => {
            const feat = features.find(f => normalize(f.nome) === normalize(mName));
            if (feat) {
              sumCx += feat.cx;
              sumCy += feat.cy;
              count++;
            }
          });
          
          if (count > 0) {
            markers.push({
              numero: match.numero,
              municipio: match.municipio,
              cx: sumCx / count,
              cy: sumCy / count,
              color: CATEGORY_COLORS[match.categoria] || CATEGORY_COLORS.default,
            });
          }
        }
      });
    } else {
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
      }

      return markers;
    } catch (error) {
      console.error("Error in mapMarkers useMemo:", error);
      return [];
    }
  }, [features, municipiosList]);

  const sphereCounts = useMemo(() => getSphereCounts(municipiosList, isTerritoryMode, id), [municipiosList, isTerritoryMode, id]);
  const cols = municipiosList.length > 70 ? 3 : 2;

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
      <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: '14px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px 0' }}>
          {title}
        </h2>
        <p style={{ fontSize: '17px', color: '#4b5563', margin: 0 }}>
          {subtitle}
        </p>
      </div>

      {(() => {
        // Separar itens com mais instituições para colocar embaixo do mapa
        const sorted = [...municipiosList].sort((a, b) => {
          const aCount = a.instituicoes ? a.instituicoes.length : 0;
          const bCount = b.instituicoes ? b.instituicoes.length : 0;
          return bCount - aCount;
        });
        // Pegar os top itens (os que têm mais instituições) para preencher o espaço abaixo do mapa
        const maxBelowMap = Math.min(Math.max(3, Math.floor(municipiosList.length * 0.25)), 8);
        let topItems = sorted.slice(0, maxBelowMap);
        let topNums = new Set(topItems.map(t => t.numero || municipiosList.indexOf(t) + 1));
        let restItems = municipiosList.filter((item, idx) => !topNums.has(item.numero || idx + 1));

        // Não separar em destaques se há poucos itens (10 ou menos) ou se restaria vazio
        if (restItems.length === 0 || municipiosList.length <= 10) {
          topItems = [];
          restItems = municipiosList;
        }

        const renderItem = (item, index, fontSize = '13px') => {
          return (
            <div
              key={item.numero || index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '4px 0',
                borderBottom: '1px solid #f8fafc',
                fontSize,
                lineHeight: '1.4',
                overflow: 'hidden',
                minWidth: 0,
              }}
            >
              <span
                style={{
                  color: CATEGORY_COLORS[item.categoria || item.instituicoes?.[0]?.categoria] || CATEGORY_COLORS.default,
                  fontWeight: '800',
                  marginRight: '4px',
                  flexShrink: 0,
                }}
              >
                {item.numero || index + 1}.
              </span>
              <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                <strong style={{ color: '#1e293b', fontWeight: '700' }}>{item.municipio}</strong>
                {item.instituicoes && item.instituicoes.length > 0 && (
                  <span style={{ color: '#64748b', marginLeft: '4px' }}>
                    — {item.instituicoes.map((inst, iIdx) => {
                      const instCat = inst.categoria === 'campiUniversidadePublica' ? 'federal' :
                                      inst.categoria === 'campiInstitutoFederal' ? 'institutoFederal' :
                                      inst.categoria === 'campiUniversidadePrivada' ? 'privada' :
                                      inst.categoria || 'default';
                      const color = CATEGORY_COLORS[instCat] || '#475569';
                      return (
                        <span
                          key={iIdx}
                          style={{
                            display: 'inline',
                            marginRight: '6px',
                            color: color,
                            fontWeight: '700',
                          }}
                        >
                          •{inst.sigla}
                        </span>
                      );
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        };

        return (
          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            {/* Coluna Esquerda: Mapa + Destaques */}
            <div style={{ width: '680px', flexShrink: 0 }}>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc' }}>
                <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
                  <g>
                    {features.map(feat => (
                      <path
                        key={feat.id}
                        d={feat.dPath}
                        fill="#f1f5f9"
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

                {/* Legenda inferior de Esferas / Categorias no Mapa */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  {Object.entries(sphereCounts).map(([cat, count]) => {
                    const label = CATEGORY_LABELS[cat] || 'Outros';
                    const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
                    return (
                      <div key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                        <span>{label} ({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Destaques abaixo do mapa: territórios/municípios com mais instituições */}
              {topItems.length > 0 && (
                <div style={{ marginTop: '20px', padding: '16px 20px', backgroundColor: '#f0f4ff', borderRadius: '10px', border: '1px solid #dbeafe' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1e3a8a', margin: '0 0 10px 0' }}>
                    Destaques — {isTerritoryMode ? 'Territórios' : 'Municípios'} com mais instituições
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {topItems.map((item, idx) => renderItem(item, idx, '13px'))}
                  </div>
                </div>
              )}
            </div>

            {/* Coluna Direita: Lista completa restante */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                  {isTerritoryMode ? 'Territórios' : 'Municípios'}
                </h3>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                  {municipiosList.length} {isTerritoryMode ? 'territórios' : 'municípios'}
                </span>
              </div>
              <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 12px 0' }}>
                <strong>{municipiosList.length}</strong> {isTerritoryMode ? 'territórios com presença mapeada em' : 'municípios com presença mapeada em'} {title.includes(' — ') ? title.split(' — ')[1] : title}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {Object.entries(sphereCounts).map(([cat, count]) => {
                  const label = CATEGORY_LABELS[cat] || 'Outros';
                  const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
                  return (
                    <span
                      key={cat}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: color,
                        fontSize: '15px',
                        fontWeight: '800',
                        marginRight: '16px',
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                      {count} {label}
                    </span>
                  );
                })}
              </div>
              <hr style={{ borderColor: '#e2e8f0', borderStyle: 'solid', borderWidth: '1px 0 0 0', margin: '10px 0 14px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: '28px', rowGap: '6px', alignItems: 'start' }}>
                {restItems.map((item, index) => renderItem(item, index, cols === 3 ? '12px' : '13px'))}
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
        <span>Fonte: INEP / Censo da Educação Superior 2022 — SECTI Bahia</span>
        <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
      </div>
    </div>
  );
}
