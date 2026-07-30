import React, { useEffect, useState, useMemo } from 'react';
import * as topojson from 'topojson-client';
import { normalize } from '../../utils/normalization.js';
import territorioMunicipios from '../../../utils/territorioMunicipios.json';

const SVG_W = 750;
const SVG_H = 750;
const PADDING = 20;

const SEGMENTO_COLORS = {
  'Abacaxi': '#16a34a',
  'Agricultura': '#059669',
  'Apicultura': '#d97706',
  'Aquicultura': '#0891b2',
  'Biovias': '#9333ea',
  'Cacau': '#92400e',
  'Café': '#78350f',
  'Caprino-ovinocultura': '#be185d',
  'Coco': '#16a34a',
  'Economia Criativa': '#7c3aed',
  'Energia': '#ea580c',
  'Fruticultura': '#65a30d',
  'Mandioca': '#ca8a04',
  'Mineração': '#6b7280',
  'Pesca': '#0284c7',
  'Sisal': '#a16207',
  'Tecnologia': '#2563eb',
  'Turismo': '#dc2626',
  default: '#4f46e5',
};

function getSegmentoColor(segmento) {
  if (!segmento) return '#6b7280';
  // Tentar match exato
  if (SEGMENTO_COLORS[segmento]) return SEGMENTO_COLORS[segmento];
  // Tentar match parcial
  const norm = normalize(segmento);
  for (const [key, color] of Object.entries(SEGMENTO_COLORS)) {
    if (key !== 'default' && norm.includes(normalize(key))) return color;
  }
  // Gerar cor determinística pelo nome
  let hash = 0;
  for (let i = 0; i < segmento.length; i++) hash = segmento.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
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

export default function MapaCadeiasProdutivas({
  id = 'mapa-cadeias-produtivas',
  cadeiasList = [],
  title = 'Cadeias Produtivas e Indicações Geográficas',
  subtitle = 'Mapeamento de Sedes e Municípios de Influência na Bahia',
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
        console.error('Erro ao carregar mapa de cadeias:', err);
        setIsLoaded(true);
      });
  }, []);

  // Agrupar cadeias por território
  const territoriosCadeias = useMemo(() => {
    const terrMap = new Map();
    cadeiasList.forEach(cad => {
      const terrs = cad.territorios || cad.territorio || 'N/A';
      const terrArr = String(terrs).split(/[,;]/).map(t => t.trim()).filter(Boolean);
      terrArr.forEach(terrName => {
        if (terrName === 'N/A') return;
        const norm = normalize(terrName);
        if (!terrMap.has(norm)) {
          terrMap.set(norm, { nome: terrName, segmentos: new Map() });
        }
        const seg = cad.segmento || 'Não Informado';
        const entry = terrMap.get(norm);
        if (!entry.segmentos.has(seg)) {
          entry.segmentos.set(seg, { segmento: seg, count: 0 });
        }
        entry.segmentos.get(seg).count++;
      });
    });

    const list = Array.from(terrMap.values())
      .map(t => ({
        municipio: t.nome,
        instituicoes: Array.from(t.segmentos.values())
          .sort((a, b) => b.count - a.count)
          .map(s => ({ sigla: `${s.segmento} (${s.count})`, categoria: 'cadeia', segmento: s.segmento })),
      }))
      .sort((a, b) => a.municipio.localeCompare(b.municipio, 'pt-BR'));

    return list.map((item, idx) => ({ ...item, numero: idx + 1 }));
  }, [cadeiasList]);

  // Determinar se é modo território (escopo estadual) ou municipal (território específico)
  const isTerritoryMode = !selectedLocation;

  // Lista final para renderizar
  const displayList = isTerritoryMode ? territoriosCadeias : (() => {
    // No modo territorial específico, cada cadeia vira um item com sede como município
    const munMap = new Map();
    cadeiasList.forEach(cad => {
      const sede = cad.sede || 'Não Informada';
      const sedeNorm = normalize(sede);
      if (!munMap.has(sedeNorm)) {
        munMap.set(sedeNorm, { municipio: sede, segmentos: new Map() });
      }
      const seg = cad.segmento || 'Não Informado';
      const entry = munMap.get(sedeNorm);
      if (!entry.segmentos.has(seg)) {
        entry.segmentos.set(seg, { segmento: seg, count: 0 });
      }
      entry.segmentos.get(seg).count++;
    });

    return Array.from(munMap.values())
      .map(t => ({
        municipio: t.municipio,
        instituicoes: Array.from(t.segmentos.values())
          .sort((a, b) => b.count - a.count)
          .map(s => ({ sigla: `${s.segmento} (${s.count})`, categoria: 'cadeia', segmento: s.segmento })),
      }))
      .sort((a, b) => a.municipio.localeCompare(b.municipio, 'pt-BR'))
      .map((item, idx) => ({ ...item, numero: idx + 1 }));
  })();

  const { features } = useMemo(() => {
    if (!geoData) return { features: [] };

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

    return { features: processedFeatures };
  }, [geoData, selectedLocation]);

  // Calcular marcadores no mapa
  const mapMarkers = useMemo(() => {
    const markers = [];
    const munMap = new Map();
    displayList.forEach((item) => {
      munMap.set(normalize(item.municipio), {
        numero: item.numero,
        municipio: item.municipio,
      });
    });

    if (isTerritoryMode) {
      // Modo território: centroides dos municípios de cada território
      const terrList = territorioMunicipios.territorios_de_identidade || [];
      munMap.forEach((match, terrNorm) => {
        const terrData = terrList.find(t => normalize(t.nome) === terrNorm);
        if (terrData && terrData.municipios) {
          let sumCx = 0, sumCy = 0, count = 0;
          terrData.municipios.forEach(mName => {
            const feat = features.find(f => normalize(f.nome) === normalize(mName));
            if (feat) { sumCx += feat.cx; sumCy += feat.cy; count++; }
          });
          if (count > 0) {
            markers.push({
              numero: match.numero,
              municipio: match.municipio,
              cx: sumCx / count,
              cy: sumCy / count,
              color: '#1e3a8a',
            });
          }
        }
      });
    } else {
      // Modo municipal: posição do município no mapa
      features.forEach(feat => {
        const match = munMap.get(normalize(feat.nome));
        if (match) {
          markers.push({
            numero: match.numero,
            municipio: match.municipio,
            cx: feat.cx,
            cy: feat.cy,
            color: '#1e3a8a',
          });
        }
      });
    }

    return markers;
  }, [features, displayList, isTerritoryMode]);

  // Contagem de segmentos únicos
  const segmentoCounts = useMemo(() => {
    const counts = new Map();
    cadeiasList.forEach(cad => {
      const seg = cad.segmento || 'Outros';
      counts.set(seg, (counts.get(seg) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [cadeiasList]);

  // Destaques abaixo do mapa
  const { topItems, restItems } = useMemo(() => {
    const sorted = [...displayList].sort((a, b) => (b.instituicoes?.length || 0) - (a.instituicoes?.length || 0));
    const maxBelowMap = Math.min(Math.max(3, Math.floor(displayList.length * 0.25)), 8);
    const top = sorted.slice(0, maxBelowMap);
    const topNums = new Set(top.map(t => t.numero));
    const rest = displayList.filter(item => !topNums.has(item.numero));

    // Não separar em destaques se há poucos itens (10 ou menos) ou se restaria vazio
    if (rest.length === 0 || displayList.length <= 10) {
      return { topItems: [], restItems: displayList };
    }
    return { topItems: top, restItems: rest };
  }, [displayList]);

  const cols = displayList.length > 40 ? 3 : 2;

  const renderItem = (item, fontSize = '13px') => (
    <div
      key={item.numero}
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
          color: '#1e3a8a',
          fontWeight: '800',
          marginRight: '4px',
          flexShrink: 0,
        }}
      >
        {item.numero}.
      </span>
      <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        <strong style={{ color: '#1e293b', fontWeight: '700' }}>{item.municipio}</strong>
        {item.instituicoes && item.instituicoes.length > 0 && (
          <span style={{ color: '#64748b', marginLeft: '4px' }}>
            — {item.instituicoes.map((inst, iIdx) => {
              const color = getSegmentoColor(inst.segmento);
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

            {/* Legenda de segmentos */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              {segmentoCounts.slice(0, 10).map(([seg, count]) => (
                <div key={seg} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getSegmentoColor(seg) }} />
                  <span>{seg} ({count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Destaques abaixo do mapa */}
          {topItems.length > 0 && (
            <div style={{ marginTop: '20px', padding: '16px 20px', backgroundColor: '#f0f4ff', borderRadius: '10px', border: '1px solid #dbeafe' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1e3a8a', margin: '0 0 10px 0' }}>
                Destaques — {isTerritoryMode ? 'Territórios' : 'Municípios'} com mais cadeias
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {topItems.map(item => renderItem(item, '13px'))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Lista */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              {isTerritoryMode ? 'Territórios' : 'Municípios'}
            </h3>
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
              {displayList.length} {isTerritoryMode ? 'territórios' : 'municípios'} • {cadeiasList.length} cadeias
            </span>
          </div>
          <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 12px 0' }}>
            <strong>{displayList.length}</strong> {isTerritoryMode ? 'territórios com cadeias produtivas mapeadas' : 'municípios com cadeias produtivas mapeadas'}
          </p>
          <hr style={{ borderColor: '#e2e8f0', borderStyle: 'solid', borderWidth: '1px 0 0 0', margin: '10px 0 14px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: '28px', rowGap: '6px', alignItems: 'start' }}>
            {restItems.map(item => renderItem(item, cols === 3 ? '12px' : '13px'))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
        <span>Fonte: SECTI Bahia — Mapeamento de Cadeias Produtivas</span>
        <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
      </div>
    </div>
  );
}
