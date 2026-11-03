import * as topojson from 'topojson-client';
import { isMunicipioSemiarido } from '../../constants/semiarido';
import { normalizeName, buildMunicipioTerritoryMap } from './side/mapGeoUtils';

let cachedTopologia = null;
let loadingPromise = null;

function buildTopologiaPayload(topology) {
  const municipioTerritoryMap = buildMunicipioTerritoryMap();
  const groupsNormal = {};
  const groupsSemi = {};

  topology.objects.BA.geometries.forEach((geom) => {
    const nome = geom.properties?.NOME || geom.properties?.nome || '';
    const dbInfo = municipioTerritoryMap[normalizeName(nome)];
    const idTerr = dbInfo ? Number(dbInfo.id_territorio) : null;
    const nomeTerr = dbInfo ? dbInfo.nome_territorio : null;
    const isSemi = dbInfo ? isMunicipioSemiarido(dbInfo.nome_municipio) : false;

    geom.id_territorio = idTerr;
    geom.nome_territorio = nomeTerr;
    geom.is_semiarido = isSemi;

    if (!geom.properties) geom.properties = {};
    geom.properties.id_territorio = idTerr;
    geom.properties.nome_territorio = nomeTerr;
    geom.properties.is_semiarido = isSemi;

    if (dbInfo && idTerr != null) {
      if (!groupsNormal[idTerr]) {
        groupsNormal[idTerr] = {
          id_territorio: idTerr,
          nome_territorio: nomeTerr,
          geoms: []
        };
      }
      groupsNormal[idTerr].geoms.push(geom);

      const semiKey = `${idTerr}_${isSemi ? '1' : '0'}`;
      if (!groupsSemi[semiKey]) {
        groupsSemi[semiKey] = {
          id_territorio: idTerr,
          nome_territorio: nomeTerr,
          is_semiarido: isSemi,
          geoms: []
        };
      }
      groupsSemi[semiKey].geoms.push(geom);
    }
  });

  // 1. Polígonos mesclados por Território (Modo Normal)
  const mergedNormalData = {
    type: 'FeatureCollection',
    features: Object.values(groupsNormal).map((group) => ({
      type: 'Feature',
      id: `ter-${group.id_territorio}`,
      properties: {
        id_territorio: Number(group.id_territorio),
        nome_territorio: group.nome_territorio || ''
      },
      geometry: topojson.merge(topology, group.geoms)
    }))
  };

  // 2. Polígonos mesclados por Território + Semiárido
  const mergedSemiData = {
    type: 'FeatureCollection',
    features: Object.values(groupsSemi).map((item) => ({
      type: 'Feature',
      id: `semi-${item.id_territorio}-${item.is_semiarido ? '1' : '0'}`,
      properties: {
        id_territorio: Number(item.id_territorio),
        nome_territorio: item.nome_territorio || '',
        is_semiarido: item.is_semiarido
      },
      geometry: topojson.merge(topology, item.geoms)
    }))
  };

  // 3. Contornos perimetrais individuais de cada território (indexados por ID e por nome normalizado)
  const territoryMeshes = {};
  Object.values(groupsNormal).forEach((group) => {
    const numId = Number(group.id_territorio);
    const strId = String(group.id_territorio);
    const cleanNome = (group.nome_territorio || '').replace(/^Território de Identidade\s+/i, '').trim();
    const normNome = normalizeName(cleanNome);

    const mesh = topojson.mesh(
      topology,
      topology.objects.BA,
      (a, b) => (a === b ? Number(a.id_territorio) === numId : (Number(a.id_territorio) === numId) !== (Number(b.id_territorio) === numId))
    );

    territoryMeshes[numId] = mesh;
    territoryMeshes[strId] = mesh;
    if (normNome) territoryMeshes[normNome] = mesh;
  });

  // 4. Divisas internas unificadas entre os 27 territórios
  const allTerritoryMesh = topojson.mesh(
    topology,
    topology.objects.BA,
    (a, b) => a !== b && Number(a.id_territorio) !== Number(b.id_territorio)
  );

  // 5. Contorno perimetral externo do Estado da Bahia
  const stateBoundaryMesh = topojson.mesh(
    topology,
    topology.objects.BA,
    (a, b) => a === b
  );

  // 5b. Malha única contínua com todas as divisas municipais internas (para exibição instantânea no zoom)
  const allMunicipiosMesh = topojson.mesh(
    topology,
    topology.objects.BA,
    (a, b) => a !== b
  );

  // 6. Feições individuais dos 417 municípios + agrupamento pré-indexado por território
  const rawGeoJson = topojson.feature(topology, topology.objects.BA);
  const munGroupsByTerr = {};

  const enrichedFeatures = rawGeoJson.features.map((feat) => {
    const rawMunName = feat.properties?.NOME || feat.properties?.nome || '';
    const dbInfo = municipioTerritoryMap[normalizeName(rawMunName)];
    const idTerr = dbInfo ? Number(dbInfo.id_territorio) : null;
    const nomeTerr = dbInfo ? dbInfo.nome_territorio : null;
    const nomeMunOficial = dbInfo ? dbInfo.nome_municipio : rawMunName;
    const isSemi = isMunicipioSemiarido(nomeMunOficial);

    const enriched = {
      ...feat,
      properties: {
        ...feat.properties,
        id_municipio: dbInfo ? dbInfo.id_municipio : null,
        id_territorio: idTerr,
        nome_territorio: nomeTerr,
        nome_municipio_oficial: nomeMunOficial,
        nome_municipio: nomeMunOficial,
        is_semiarido: isSemi
      }
    };

    if (idTerr != null) {
      const strId = String(idTerr);
      const cleanTerr = (nomeTerr || '').replace(/^Território de Identidade\s+/i, '').trim();
      const normTerr = normalizeName(cleanTerr);

      if (!munGroupsByTerr[strId]) munGroupsByTerr[strId] = [];
      munGroupsByTerr[strId].push(enriched);

      if (normTerr) {
        if (!munGroupsByTerr[normTerr]) munGroupsByTerr[normTerr] = [];
        munGroupsByTerr[normTerr].push(enriched);
      }
    }

    return enriched;
  });

  const municipiosGeoJson = {
    type: 'FeatureCollection',
    features: enrichedFeatures
  };

  const municipiosByTerritory = {};
  Object.entries(munGroupsByTerr).forEach(([key, features]) => {
    municipiosByTerritory[key] = {
      type: 'FeatureCollection',
      features
    };
  });

  return {
    mergedNormalData,
    mergedSemiData,
    territoryMeshes,
    allTerritoryMesh,
    stateBoundaryMesh,
    allMunicipiosMesh,
    municipiosGeoJson,
    municipiosByTerritory
  };
}

export function getCachedBahiaTopologia() {
  return cachedTopologia;
}

export function loadBahiaTopologia() {
  if (cachedTopologia) {
    return Promise.resolve(cachedTopologia);
  }
  if (!loadingPromise) {
    loadingPromise = fetch('/BA_(1)9396399957704198.json')
      .then((resp) => resp.json())
      .then((topology) => {
        cachedTopologia = buildTopologiaPayload(topology);
        return cachedTopologia;
      })
      .catch((err) => {
        loadingPromise = null;
        throw err;
      });
  }
  return loadingPromise;
}

// Pré-aquece o cache de forma assíncrona no navegador
if (typeof window !== 'undefined') {
  loadBahiaTopologia().catch(() => {});
}

