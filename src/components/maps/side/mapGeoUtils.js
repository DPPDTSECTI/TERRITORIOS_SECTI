import { municipiosDB } from '../../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../../data/municipiosCoords';
import { isMunicipioSemiarido } from '../../../constants/semiarido';

export const SEMIARIDO_TERRITORY_IDS = new Set(
  municipiosDB
    .filter((m) => isMunicipioSemiarido(m.nome_municipio))
    .map((m) => String(m.id_territorio))
);

export function normalizeName(value) {
  if (!value) return '';
  let norm = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const correcoes = {
    'dias davila': 'dias d avila',
    'santa teresinha': 'santa terezinha',
    'camaca': 'camacan',
    'xique xique': 'xiquexique',
    'muquem de sao francisco': 'muquem do sao francisco'
  };

  return correcoes[norm] || norm;
}

export const buildMunicipioTerritoryMap = () => {
  const m = {};
  municipiosDB.forEach((row) => {
    m[normalizeName(row.nome_municipio)] = {
      id_municipio: row.id_municipio,
      id_territorio: row.id_territorio,
      nome_territorio: row.nome_territorio,
      nome_municipio: row.nome_municipio
    };
  });
  return m;
};

export const MUN_LOOKUP = (() => {
  const byId = {};
  const byName = {};
  municipiosDB.forEach((row) => {
    byId[row.id_municipio] = row;
    byName[normalizeName(row.nome_municipio)] = row;
  });
  return { byId, byName };
})();

export function findMunicipioCoords(nome) {
  if (!nome) return null;
  const raw = String(nome).trim();
  const clean = normalizeName(raw);

  if (MUNICIPIOS_COORDS[raw]) return MUNICIPIOS_COORDS[raw];
  if (MUNICIPIOS_COORDS[clean]) return MUNICIPIOS_COORDS[clean];
  if (MUNICIPIOS_COORDS[raw.toLowerCase()]) return MUNICIPIOS_COORDS[raw.toLowerCase()];

  const aliases = {
    petrolina: [-9.3989, -40.5008],
    'sao francisco': [-9.427268, -40.505742],
    lem: [-12.087454, -45.796046],
    saj: [-12.968813, -39.257965]
  };

  if (aliases[clean]) return aliases[clean];

  const lookup = MUN_LOOKUP.byName[clean];
  if (lookup && MUNICIPIOS_COORDS[lookup.nome_municipio]) {
    return MUNICIPIOS_COORDS[lookup.nome_municipio];
  }

  for (const key of Object.keys(MUNICIPIOS_COORDS)) {
    if (normalizeName(key).includes(clean) || clean.includes(normalizeName(key))) {
      return MUNICIPIOS_COORDS[key];
    }
  }

  return null;
}

export function isInsideBahia(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -18.5 &&
    lat <= -8.0 &&
    lng >= -47.0 &&
    lng <= -36.5
  );
}
