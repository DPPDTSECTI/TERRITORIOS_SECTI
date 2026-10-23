import L from 'leaflet';

export const createClusterIcon = (count, isSemiarido = false, isDark = false) => {
  const size = 20;
  const fontSize = 9.5;
  const bg = isSemiarido
    ? (isDark ? '#F59E0B' : '#D97706')
    : (isDark ? '#38BDF8' : '#1E40AF');
  const textColor = isDark && !isSemiarido ? '#0F172A' : '#FFFFFF';
  const borderColor = isDark ? '#0F172A' : '#FFFFFF';
  const shadow = isSemiarido
    ? (isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(217, 119, 6, 0.45)')
    : (isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(30, 64, 175, 0.3)');

  return L.divIcon({
    html: `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: ${bg};
      color: ${textColor};
      border: 1.5px solid ${borderColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: ${fontSize}px;
      box-shadow: 0 1px 4px ${shadow};
      cursor: pointer;
      font-family: 'Plus Jakarta Sans Variable', sans-serif;
      font-variant-numeric: tabular-nums;
      transform: none !important;
    ">
      ${count}
    </div>
    `,
    className: 'custom-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export function getSemiaridoPointColor(corHex, nameOrTipo = '', isDark = false) {
  const str = String(nameOrTipo || '').toLowerCase();
  if (isDark) {
    if (str.includes('privada')) return '#FBBF24'; // Âmbar 400
    if (str.includes('estadual')) return '#F59E0B'; // Âmbar 500
    if (str.includes('federal') && str.includes('universidade')) return '#FCD34D'; // Âmbar 300
    if (str.includes('instituto federal') || str.includes('ifba') || str.includes('if')) return '#FDE047'; // Amarelo 300
    if (str.includes('aceleradora')) return '#FACC15'; // Amarelo 400
    if (str.includes('dinamizador')) return '#FBBF24'; // Calêndula 400
    if (str.includes('incubadora')) return '#F59E0B'; // Âmbar 500
    if (str.includes('parque')) return '#FDE68A'; // Âmbar claro 200
    if (str.includes('ict')) return '#FCD34D'; // Dourado claro 300
    if (str.includes('hub') || str.includes('coworking') || str.includes('fablab') || str.includes('maker')) return '#FEF08A'; // Trigo claro 200
    if (str.includes('centro') || str.includes('p&d')) return '#FBBF24'; // Âmbar P&D
    if (str.includes('investimento') || str.includes('fundo') || str.includes('fomento')) return '#FB923C'; // Laranja 400
    if (str.includes('pesquisa')) return '#FCD34D'; // Âmbar 300
    if (str.includes('apl') || str.includes('arranjo')) return '#F59E0B'; // Âmbar 500
    if (str.includes('ig potencial') || str.includes('potencial')) return '#FDE047'; // Amarelo 300
    if (str.includes('ig') || str.includes('indica')) return '#FACC15'; // Amarelo 400
    return '#FBBF24';
  }
  if (str.includes('privada')) return '#F59E0B'; // Âmbar dourado
  if (str.includes('estadual')) return '#D97706'; // Âmbar profundo
  if (str.includes('federal') && str.includes('universidade')) return '#B45309'; // Âmbar terracota
  if (str.includes('instituto federal') || str.includes('ifba') || str.includes('if')) return '#EAB308'; // Ouro girassol
  if (str.includes('aceleradora')) return '#CA8A04'; // Ouro mostarda
  if (str.includes('dinamizador')) return '#FBBF24'; // Calêndula
  if (str.includes('incubadora')) return '#D48806'; // Mel ocre
  if (str.includes('parque')) return '#78350F'; // Castanho âmbar
  if (str.includes('ict')) return '#B8860B'; // Dark goldenrod
  if (str.includes('hub') || str.includes('coworking') || str.includes('fablab') || str.includes('maker')) return '#ECC94B'; // Trigo dourado
  if (str.includes('centro') || str.includes('p&d')) return '#F59E0B'; // Âmbar P&D
  if (str.includes('investimento') || str.includes('fundo') || str.includes('fomento')) return '#CD7F32'; // Bronze dourado
  if (str.includes('pesquisa')) return '#A16207'; // Ocre dourado
  if (str.includes('apl') || str.includes('arranjo')) return '#B45309'; // Âmbar Terracota APL
  if (str.includes('ig potencial') || str.includes('potencial')) return '#FBBF24'; // Amarelo IG Potencial
  if (str.includes('ig') || str.includes('indica')) return '#CA8A04'; // Ouro Mostarda IG
  return '#D97706';
}

export const createSingleAssetIconWithSvg = (corHex, svgMarkup, isSelected = false, isSemiarido = false, assetTipo = '', isDark = false) => {
  const size = isSelected ? 24 : 18;
  const safeColor = isSemiarido
    ? getSemiaridoPointColor(corHex, assetTipo, isDark)
    : (corHex || (isDark ? '#60A5FA' : '#3B82F6'));
  const selectedBorderColor = isSemiarido ? (isDark ? '#FDE68A' : '#78350F') : (isDark ? '#93C5FD' : '#1E40AF');
  const borderColor = isDark ? '#0F172A' : '#FFFFFF';
  const selectedShadow = isSemiarido ? '0 3px 10px rgba(217, 119, 6, 0.5)' : '0 3px 10px rgba(30, 64, 175, 0.45)';

  const defaultSvg = `<svg width="${isSelected ? 13 : 10}" height="${isSelected ? 13 : 10}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
  let innerSvg = svgMarkup || defaultSvg;
  if (isSemiarido && innerSvg) {
    innerSvg = innerSvg.replace(/stroke="[^"]+"/g, 'stroke="#ffffff"');
  }

  return L.divIcon({
    html: `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${safeColor};
      color: #ffffff;
      border: ${isSelected ? `2.5px solid ${selectedBorderColor}` : `1.5px solid ${borderColor}`};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: ${isSelected ? selectedShadow : '0 1px 3px rgba(0, 0, 0, 0.15)'};
      cursor: pointer;
      transform: none !important;
    ">
      ${innerSvg}
    </div>
    `,
    className: `custom-single-asset-marker ${isSelected ? 'z-50' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export const createPartnerPinIcon = (isSemiarido = false) => L.divIcon({
  html: `
  <div style="
    background-color: ${isSemiarido ? '#F59E0B' : '#3B82F6'};
    width: 6px;
    height: 6px;
    border-radius: 50%;
    border: 1px solid #FFFFFF;
    box-shadow: 0 1px 2px ${isSemiarido ? 'rgba(245, 158, 11, 0.4)' : 'rgba(37, 99, 235, 0.3)'};
  "></div>
  `,
  className: 'partner-map-pin',
  iconSize: [6, 6],
  iconAnchor: [3, 3]
});

export const createSelectedPartnerPinIcon = (isSemiarido = false) => L.divIcon({
  html: `
  <div style="
    background-color: ${isSemiarido ? '#B45309' : '#1E40AF'};
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: 1px solid #FFFFFF;
    box-shadow: 0 1px 3px ${isSemiarido ? 'rgba(180, 83, 9, 0.45)' : 'rgba(30, 64, 175, 0.4)'};
  "></div>
  `,
  className: 'partner-map-pin-selected',
  iconSize: [7, 7],
  iconAnchor: [3.5, 3.5]
});
