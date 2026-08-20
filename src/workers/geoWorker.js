import * as topojson from 'topojson-client';

self.onmessage = ({ data: { topology, municipioMap } }) => {
  const geometries = topology.objects.BA.geometries;
  const groups = {};

  geometries.forEach((geom) => {
    const nome = geom.properties?.NOME || geom.properties?.nome || '';
    const idTerr = municipioMap[nome]?.id_territorio || 'outros';
    const nomeTerr = municipioMap[nome]?.nome_territorio || 'Outros';

    if (!groups[idTerr]) {
      groups[idTerr] = { nome_territorio: nomeTerr, geoms: [] };
    }
    groups[idTerr].geoms.push(geom);
  });

  const features = Object.entries(groups).map(([idTerr, group]) => ({
    type: 'Feature',
    properties: { id_territorio: idTerr, nome_territorio: group.nome_territorio },
    geometry: topojson.merge(topology, group.geoms)
  }));

  self.postMessage({ type: 'FeatureCollection', features });
};