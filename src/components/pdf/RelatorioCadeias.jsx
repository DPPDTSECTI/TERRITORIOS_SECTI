import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Boxes,
  MapPin,
  Layers,
  X,
  ListOrdered,
  Wheat,
  Award,
  Compass,
  Sun,
  Moon
} from 'lucide-react';

import { DataContext } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import SideMap from '../maps/SideMap';
import StackedBarChart from '../graph/StackedBarChart';
import ProportionBarChart from '../graph/ProportionBarChart';
import { municipiosDB } from '../../data/municipiosDB';
import { MUNICIPIOS_COORDS } from '../../data/municipiosCoords';
import { isMunicipioSemiarido, SEMIARIDO_TOTAL_MUNICIPIOS, BAHIA_TOTAL_MUNICIPIOS } from '../../constants/semiarido';
import { useReactToPrint } from 'react-to-print';
import { REPORT_PRINT_PAGE_STYLE, prepareReportForPrint, printWithCanvasSync } from '../../utils/reportPrint';

const PALETTE = ['#2563EB', '#1D4ED8', '#0284C7', '#1E40AF', '#3B82F6', '#0369A1', '#1E3A8A', '#0EA5E9'];

function normalizeName(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkSemiaridoValue(val) {
  if (val === true || val === 1) return true;
  const s = String(val ?? '').toLowerCase().trim();
  return s === 'sim' || s === 'true' || s === '1' || s === 't';
}

const MUN_LOOKUP = (() => {
  const byId = {};
  const byName = {};
  municipiosDB.forEach((row) => {
    byId[row.id_municipio] = row;
    byName[normalizeName(row.nome_municipio)] = row;
  });
  return { byId, byName };
})();

function isMunicipioInTerritory(mObjOrName, tid, tNorm) {
  if (!mObjOrName) return false;

  if (typeof mObjOrName === 'object') {
    if (tid && mObjOrName.id_territorio && Number(mObjOrName.id_territorio) === tid) return true;
    if (tNorm && mObjOrName.nome_territorio && normalizeName(mObjOrName.nome_territorio) === tNorm) return true;
  }

  const munName = typeof mObjOrName === 'string'
    ? mObjOrName
    : (mObjOrName.nome_municipio || mObjOrName.municipio || '');

  if (munName) {
    const clean = normalizeName(munName);
    const lookup = MUN_LOOKUP.byName[clean];
    if (lookup) {
      if (tid && lookup.id_territorio && Number(lookup.id_territorio) === tid) return true;
      if (tNorm && lookup.nome_territorio && normalizeName(lookup.nome_territorio) === tNorm) return true;
    }
  }

  if (typeof mObjOrName === 'object' && mObjOrName.id_municipio) {
    const lookup = MUN_LOOKUP.byId[mObjOrName.id_municipio];
    if (lookup) {
      if (tid && lookup.id_territorio && Number(lookup.id_territorio) === tid) return true;
      if (tNorm && lookup.nome_territorio && normalizeName(lookup.nome_territorio) === tNorm) return true;
    }
  }

  return false;
}

function findMunicipioCoords(nome) {
  if (!nome) return null;
  const raw = String(nome).trim();
  const clean = normalizeName(raw);

  if (MUNICIPIOS_COORDS[raw]) return MUNICIPIOS_COORDS[raw];
  if (MUNICIPIOS_COORDS[clean]) return MUNICIPIOS_COORDS[clean];
  if (MUNICIPIOS_COORDS[raw.toLowerCase()]) return MUNICIPIOS_COORDS[raw.toLowerCase()];

  const aliases = {
    'petrolina': [-9.3989, -40.5008],
    'sao francisco': [-9.427268, -40.505742],
    'lem': [-12.087454, -45.796046],
    'saj': [-12.968813, -39.257965]
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

const getTipoCadeiaConfig = (nomeTipo) => {
  const str = String(nomeTipo || '').toLowerCase();
  if (str.includes('potencial')) {
    return {
      corHex: '#F59E0B',
      label: 'IG Potencial',
      badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30',
      icone: Compass
    };
  }
  if (str.includes('ig') || str.includes('indica')) {
    return {
      corHex: '#10B981',
      label: 'IG Concedida',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25',
      icone: Award
    };
  }
  return {
    corHex: '#2563EB',
    label: 'APL Mapeado',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25',
    icone: Wheat
  };
};

const CADEIA_CATEGORIES = [
  { key: 'apl', label: 'Arranjo Produtivo Local (APL)', shortLabel: 'APL', colorHex: '#2563EB' },
  { key: 'ig', label: 'Indicação Geográfica (IG)', shortLabel: 'IG', colorHex: '#10B981' },
  { key: 'ig_potencial', label: 'IG Potencial', shortLabel: 'IG Potencial', colorHex: '#F59E0B' }
];

const CADEIA_PRESENCA_CATEGORIES = [
  { key: 'sede', label: 'Cadeia Sediada (Município Sede)', shortLabel: 'Sede', colorHex: '#F59E0B' },
  { key: 'abrangente', label: 'Cadeia Abrangente (Atuação Local)', shortLabel: 'Abrangente', colorHex: '#2563EB' }
];

export default function RelatorioCadeiasPage() {
  const { isDark, toggleTheme } = useTheme();
  const {
    listaCadeias = [],
    distribuicaoCadeias = [],
    territoriosData = [],
    loadingStats = false,
    filtroSemiarido,
    setFiltroSemiarido
  } = useContext(DataContext);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reportMode = searchParams.has('modo')
    ? searchParams.get('modo')
    : (filtroSemiarido ? 'semiarido' : 'normal');
  const isSemiarido = reportMode === 'semiarido';

  const [selectedTerritory, setSelectedTerritory] = useState(null);

  // Inicializa o território a partir dos parâmetros de busca na URL
  useEffect(() => {
    const terrParam = searchParams.get('territorio');
    if (terrParam && terrParam !== 'bahia' && territoriosData.length > 0) {
      const match = territoriosData.find(t => String(t.id_territorio) === String(terrParam));
      if (match) {
        setSelectedTerritory(match);
      }
    } else if (terrParam === 'bahia') {
      setSelectedTerritory(null);
    }
  }, [searchParams, territoriosData]);

  const territoryName = selectedTerritory ? (selectedTerritory.nome_territorio || selectedTerritory.territorio) : null;

  // React-to-print: referência do relatório 1920x1080 para renderização e impressão nativa
  const contentRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `relatorio_cadeias_${isSemiarido ? 'semiarido' : (selectedTerritory ? territoryName : 'bahia')}`,
    pageStyle: REPORT_PRINT_PAGE_STYLE,
    onBeforePrint: async () => {
      setIsPrinting(true);
      await prepareReportForPrint();
    },
    onAfterPrint: () => setIsPrinting(false),
    print: (iframe) => {
      setIsPrinting(false);
      return printWithCanvasSync(iframe, contentRef);
    }
  });

  // Auto-impressão caso explicitamente solicitado via query param (ex: autoPrint=1 ou autoprint=true)
  useEffect(() => {
    const autoPrint = searchParams.get('autoPrint') || searchParams.get('autoprint');
    if ((autoPrint === '1' || autoPrint === 'true') && !loadingStats && (territoriosData && territoriosData.length > 0)) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [searchParams, loadingStats, handlePrint, territoriosData]);

  // 1. Processamento e enriquecimento das Cadeias
  const enrichedCadeias = useMemo(() => {
    const fontesMap = new Map();
    const coordsMap = new Map();

    (listaCadeias || []).forEach(lc => {
      const id = Number(lc.id_cadeia);
      if (id && lc.fonte) fontesMap.set(id, lc.fonte);
      const cLat = Number(lc.latitude || lc.lat);
      const cLng = Number(lc.longitude || lc.lng);
      if (id && cLat && cLng && cLat >= -18.5 && cLat <= -8.0 && cLng >= -47.0 && cLng <= -36.5) {
        coordsMap.set(id, [cLat, cLng]);
      }
    });

    const sourceData = (distribuicaoCadeias && distribuicaoCadeias.length > 0) ? distribuicaoCadeias : listaCadeias;
    if (!sourceData || sourceData.length === 0) return [];

    const mapCadeias = new Map();

    sourceData.forEach((row, idx) => {
      const idCadeia = Number(row.id_cadeia || idx + 1);
      const tipoNome = row.nome_tipo || row.tipo || 'APL';
      const configTipo = getTipoCadeiaConfig(tipoNome);
      const entidadeStr = String(row.entidade || '').toLowerCase();

      let overrideSede = null;
      let overrideTerritorioId = null;
      let overrideTerritorioNome = null;

      if (entidadeStr.includes('sao francisco') || entidadeStr.includes('uvas de mesa') || entidadeStr.includes('vinho do vale')) {
        overrideSede = 'Juazeiro';
        overrideTerritorioId = 21;
        overrideTerritorioNome = 'Sertão do São Francisco';
      } else if (entidadeStr.includes('luis eduardo') || entidadeStr.includes('oeste da bahia')) {
        overrideSede = 'Luís Eduardo Magalhães';
        overrideTerritorioId = 4;
        overrideTerritorioNome = 'Bacia do Rio Grande';
      } else if (entidadeStr.includes('cachaça de abaíra') || entidadeStr.includes('abaira')) {
        overrideSede = 'Abaíra';
        overrideTerritorioId = 11;
        overrideTerritorioNome = 'Chapada Diamantina';
      } else if (entidadeStr.includes('cacau do sul') || entidadeStr.includes('sul da bahia')) {
        overrideSede = 'Ilhéus';
        overrideTerritorioId = 6;
        overrideTerritorioNome = 'Litoral Sul';
      }

      let rawMunSede = overrideSede || row.sede || row.municipio_sede || '';
      if ((!rawMunSede || rawMunSede.toLowerCase() === 'bahia') && row.nome_municipio && row.nome_municipio.toLowerCase() !== 'bahia') {
        rawMunSede = row.nome_municipio;
      }

      const lookupSede = (row.id_sede && MUN_LOOKUP.byId[row.id_sede]) ||
        (rawMunSede && MUN_LOOKUP.byName[normalizeName(rawMunSede)]);

      const nomeSedeFinal = lookupSede ? lookupSede.nome_municipio : (rawMunSede || 'Juazeiro');
      const idTerrSede = overrideTerritorioId || (lookupSede ? lookupSede.id_territorio : (row.id_territorio || null));
      const nomeTerrSede = overrideTerritorioNome || (lookupSede ? lookupSede.nome_territorio : (row.nome_territorio || 'Não identificado'));
      const isSedeSemi = isMunicipioSemiarido(nomeSedeFinal);

      if (!mapCadeias.has(idCadeia)) {
        let lat = row.latitude ? Number(row.latitude) : (row.lat ? Number(row.lat) : null);
        let lng = row.longitude ? Number(row.longitude) : (row.lng ? Number(row.lng) : null);

        if (lat && (lat < -18.5 || lat > -8.0)) lat = null;
        if (lng && (lng < -47.0 || lng > -36.5)) lng = null;

        if ((!lat || !lng) && coordsMap.has(idCadeia)) {
          const [cLat, cLng] = coordsMap.get(idCadeia);
          lat = cLat;
          lng = cLng;
        }

        if (!lat || !lng) {
          const huntedCoords = findMunicipioCoords(nomeSedeFinal) ||
            (overrideSede ? findMunicipioCoords(overrideSede) : null) ||
            [-12.9714, -38.5014];
          lat = huntedCoords[0];
          lng = huntedCoords[1];

          const offsetAngle = (idCadeia * 137.5 * Math.PI) / 180;
          const offsetRadius = 0.008 + ((idCadeia % 5) * 0.003);
          lat += Math.cos(offsetAngle) * offsetRadius;
          lng += Math.sin(offsetAngle) * offsetRadius;
        }

        mapCadeias.set(idCadeia, {
          id: idCadeia,
          id_cadeia: idCadeia,
          nome: row.entidade || row.nome_cadeia || `Arranjo #${idCadeia}`,
          entidade: row.entidade || row.nome_cadeia || `Arranjo #${idCadeia}`,
          segmento: row.segmento || row.nome_cadeia || 'Outros',
          tipo: tipoNome.toUpperCase().includes('POTENCIAL') ? 'IG POTENCIAL' : (tipoNome.toUpperCase().includes('IG') ? 'IG' : 'APL'),
          shortTipo: configTipo.label,
          badgeClass: configTipo.badgeClass,
          id_sede: lookupSede ? lookupSede.id_municipio : (row.id_sede || 1),
          municipio: nomeSedeFinal,
          municipio_sede: nomeSedeFinal,
          id_territorio: idTerrSede,
          territorio: nomeTerrSede,
          territorio_identidade: nomeTerrSede,
          lat,
          lng,
          latitude: lat,
          longitude: lng,
          corHex: configTipo.corHex,
          semiarido: isSedeSemi,
          municipios_cobertos: []
        });
      }

      if (row.id_municipio || row.nome_municipio) {
        const cadeiaObj = mapCadeias.get(idCadeia);
        const lookupMun = (row.id_municipio && MUN_LOOKUP.byId[row.id_municipio]) ||
          (row.nome_municipio && MUN_LOOKUP.byName[normalizeName(row.nome_municipio)]);

        const mId = row.id_municipio || (lookupMun ? lookupMun.id_municipio : null);
        const mNome = row.nome_municipio || (lookupMun ? lookupMun.nome_municipio : '');
        const mTerrId = row.id_territorio || (lookupMun ? lookupMun.id_territorio : idTerrSede);
        const mTerrNome = row.nome_territorio || (lookupMun ? lookupMun.nome_territorio : nomeTerrSede);
        const mSemi = isMunicipioSemiarido(mNome);

        let munCoords = findMunicipioCoords(mNome);
        if (!munCoords || munCoords[0] < -18.5 || munCoords[0] > -8.0 || munCoords[1] < -47.0 || munCoords[1] > -36.5) {
          munCoords = null;
        }

        if (mId && !cadeiaObj.municipios_cobertos.some(m => m.id_municipio === mId)) {
          cadeiaObj.municipios_cobertos.push({
            id_municipio: mId,
            nome_municipio: mNome,
            id_territorio: mTerrId,
            nome_territorio: mTerrNome,
            lat: munCoords ? munCoords[0] : null,
            lng: munCoords ? munCoords[1] : null,
            semiarido: mSemi
          });
          if (mSemi) cadeiaObj.semiarido = true;
        }
      }
    });

    return Array.from(mapCadeias.values());
  }, [distribuicaoCadeias, listaCadeias]);

  const totalCadeiasBahia = useMemo(() => enrichedCadeias.length, [enrichedCadeias]);

  // 2. Filtro de Cadeias
  const filteredCadeias = useMemo(() => {
    if (!enrichedCadeias || enrichedCadeias.length === 0) return [];
    let list = enrichedCadeias;

    if (selectedTerritory) {
      const tid = Number(selectedTerritory.id_territorio);
      const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio);

      list = list.filter(c => {
        const isSede = isMunicipioInTerritory(c.municipio_sede, tid, tNorm);
        const hasMunCoberto = (c.municipios_cobertos || []).some(m =>
          isMunicipioInTerritory(m, tid, tNorm)
        );
        return isSede || hasMunCoberto;
      });
    }

    if (isSemiarido) {
      list = list.filter(c =>
        c.semiarido === true ||
        (c.municipios_cobertos || []).some(m => m.semiarido === true || isMunicipioSemiarido(m.nome_municipio || m.municipio))
      );
    }

    return list;
  }, [enrichedCadeias, selectedTerritory, isSemiarido]);

  // Cadeias sediadas no território
  const cadeiasSediadas = useMemo(() => {
    if (!selectedTerritory) return filteredCadeias;
    const tid = Number(selectedTerritory.id_territorio);
    const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio);

    return filteredCadeias.filter(c =>
      isMunicipioInTerritory(c.municipio_sede, tid, tNorm)
    );
  }, [filteredCadeias, selectedTerritory]);

  // 3. Indicadores Executivos (KPIs)
  const statsKpis = useMemo(() => {
    const totalArranjos = filteredCadeias.length;
    const arranjosSediados = cadeiasSediadas.length;

    const munBeneficiadosSet = new Set();
    const munSedesSet = new Set();
    const terrSet = new Set();
    const segmentosCount = {};

    filteredCadeias.forEach(c => {
      if (c.segmento) {
        segmentosCount[c.segmento] = (segmentosCount[c.segmento] || 0) + 1;
      }
      if (c.municipio_sede) {
        munSedesSet.add(normalizeName(c.municipio_sede));
        munBeneficiadosSet.add(normalizeName(c.municipio_sede));
      }
      if (c.territorio_identidade || c.territorio) {
        terrSet.add(normalizeName(c.territorio_identidade || c.territorio));
      }

      (c.municipios_cobertos || []).forEach(m => {
        const mNome = m.nome_municipio || m.municipio;
        if (mNome) {
          munBeneficiadosSet.add(normalizeName(mNome));
        }
        const mTerr = m.nome_territorio || m.territorio;
        if (mTerr) {
          terrSet.add(normalizeName(mTerr));
        }
      });
    });

    let maiorSegmento = null;
    let maxSegCount = 0;
    Object.entries(segmentosCount).forEach(([seg, count]) => {
      if (count > maxSegCount) {
        maxSegCount = count;
        maiorSegmento = { name: seg, count, percent: totalArranjos > 0 ? ((count / totalArranjos) * 100).toFixed(0) : '0' };
      }
    });

    const pctCadeiasBahia = totalCadeiasBahia > 0 ? ((totalArranjos / totalCadeiasBahia) * 100).toFixed(1) : '0.0';
    const totalMunUniverso = isSemiarido ? SEMIARIDO_TOTAL_MUNICIPIOS : (selectedTerritory ? munBeneficiadosSet.size : BAHIA_TOTAL_MUNICIPIOS);
    const taxaMun = totalMunUniverso > 0 ? ((munBeneficiadosSet.size / totalMunUniverso) * 100).toFixed(1) : '0.0';

    const totalTerrUniverso = isSemiarido ? 22 : (selectedTerritory ? 1 : (territoriosData.length || 27));
    const taxaTerr = totalTerrUniverso > 0 ? ((terrSet.size / totalTerrUniverso) * 100).toFixed(1) : '0.0';

    return {
      totalArranjos,
      arranjosSediados,
      totalArranjosPresenca: totalArranjos,
      pctCadeiasBahia,
      municipiosBeneficiados: munBeneficiadosSet.size,
      municipiosSede: munSedesSet.size,
      totalMunUniverso,
      taxaMun,
      totalTerrUniverso,
      taxaTerr,
      territoriosAtendidos: terrSet.size,
      maiorSegmento
    };
  }, [filteredCadeias, cadeiasSediadas, isSemiarido, selectedTerritory, totalCadeiasBahia, territoriosData]);

  // 4. Top Arranjos & IGs por Extensão Municipal
  const topCadeiasData = useMemo(() => {
    if (!filteredCadeias || filteredCadeias.length === 0) return [];

    return filteredCadeias
      .map(c => {
        const totalMun = (c.municipios_cobertos?.length || 0) + (c.municipio_sede ? 1 : 0) || 1;
        return {
          id: c.id_cadeia,
          nome: c.entidade || c.nome,
          segmento: c.segmento,
          tipo: c.shortTipo || c.tipo,
          badgeClass: c.badgeClass,
          corHex: c.corHex || '#2563EB',
          municipioSede: c.municipio_sede,
          totalMunicipios: totalMun
        };
      })
      .sort((a, b) => b.totalMunicipios - a.totalMunicipios)
      .slice(0, 5);
  }, [filteredCadeias]);

  const maxCadeiaMunicipios = useMemo(() => {
    if (!topCadeiasData || topCadeiasData.length === 0) return 1;
    return Math.max(...topCadeiasData.map(d => d.totalMunicipios)) || 1;
  }, [topCadeiasData]);

  // 5. Concentração por Território / Municípios (StackedBarChart)
  const concentracaoTerritorialStackedData = useMemo(() => {
    if (!filteredCadeias || filteredCadeias.length === 0) return [];
    const groups = {};

    if (selectedTerritory) {
      const tid = Number(selectedTerritory.id_territorio);
      const tNorm = normalizeName(selectedTerritory.nome_territorio || selectedTerritory.territorio);

      filteredCadeias.forEach(c => {
        const sedeMun = c.municipio_sede;
        const isSedeNoTerr = isMunicipioInTerritory(sedeMun, tid, tNorm);

        if (isSedeNoTerr && sedeMun) {
          const mNome = sedeMun;
          if (!groups[mNome]) {
            groups[mNome] = { label: mNome, total: 0, segments: { sede: 0, abrangente: 0 } };
          }
          groups[mNome].segments.sede += 1;
          groups[mNome].total += 1;
        }

        (c.municipios_cobertos || []).forEach(m => {
          if (isMunicipioInTerritory(m, tid, tNorm)) {
            const mNome = m.nome_municipio || m.municipio;
            if (mNome) {
              const isSameAsSede = isSedeNoTerr && normalizeName(mNome) === normalizeName(sedeMun);
              if (!isSameAsSede) {
                if (!groups[mNome]) {
                  groups[mNome] = { label: mNome, total: 0, segments: { sede: 0, abrangente: 0 } };
                }
                groups[mNome].segments.abrangente += 1;
                groups[mNome].total += 1;
              }
            }
          }
        });
      });

      return Object.values(groups)
        .sort((a, b) => {
          if (b.segments.sede !== a.segments.sede) {
            return b.segments.sede - a.segments.sede;
          }
          return b.total - a.total;
        })
        .slice(0, 10)
        .map(g => ({ ...g, totalLabel: String(g.total) }));
    }

    filteredCadeias.forEach(c => {
      const terr = c.territorio_identidade || c.territorio || 'Não identificado';
      if (!groups[terr]) {
        groups[terr] = { label: terr, total: 0, segments: { apl: 0, ig: 0, ig_potencial: 0 } };
      }
      const rawTipo = String(c.shortTipo || c.tipo || '').toLowerCase();
      if (rawTipo.includes('potencial')) {
        groups[terr].segments.ig_potencial += 1;
      } else if (rawTipo.includes('indicação') || rawTipo.includes('ig')) {
        groups[terr].segments.ig += 1;
      } else {
        groups[terr].segments.apl += 1;
      }
      groups[terr].total += 1;
    });

    return Object.values(groups)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(g => ({ ...g, totalLabel: String(g.total) }));
  }, [filteredCadeias, selectedTerritory]);

  // 6. Distribuição das Top 5 Segmentos Econômicos em Pílulas Proporcionais
  const segmentosEmpilhadosData = useMemo(() => {
    const sourceData = selectedTerritory ? cadeiasSediadas : filteredCadeias;
    if (!sourceData || sourceData.length === 0) return [];
    const stats = {};
    const totalGeral = sourceData.length || 1;

    sourceData.forEach(c => {
      const seg = c.segmento || 'Outros';
      if (!stats[seg]) {
        stats[seg] = { name: seg, total: 0 };
      }
      stats[seg].total += 1;
    });

    return Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        corHex: isSemiarido ? '#D97706' : (PALETTE[idx % PALETTE.length] || '#2563EB'),
        remaining: Math.max(0, totalGeral - item.total),
        pctTotal: ((item.total / totalGeral) * 100).toFixed(1)
      }));
  }, [filteredCadeias, cadeiasSediadas, selectedTerritory, isSemiarido]);

  // 7. Tipologias de Reconhecimento (Intermunicipal vs Local) para o ProportionBarChart
  const tiposProportionData = useMemo(() => {
    const sourceData = selectedTerritory ? cadeiasSediadas : filteredCadeias;
    if (!sourceData || sourceData.length === 0) return [];
    const stats = {};

    sourceData.forEach(c => {
      const tipo = c.shortTipo || c.tipo || 'APL';
      if (!stats[tipo]) {
        stats[tipo] = { label: tipo, positive: 0, negative: 0, total: 0 };
      }
      const isRegional = (c.municipios_cobertos?.length || 1) > 1;
      if (isRegional) {
        stats[tipo].positive += 1;
      } else {
        stats[tipo].negative += 1;
      }
      stats[tipo].total += 1;
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [filteredCadeias, cadeiasSediadas, selectedTerritory]);

  // Configuração dos 4 KPIs
  const kpiCards = [
    {
      label: isSemiarido ? 'Arranjos no Semiárido' : (selectedTerritory ? `Arranjos Sediados em ${territoryName}` : 'Arranjos & IGs Mapeados'),
      value: loadingStats ? '...' : statsKpis.arranjosSediados,
      suffix: null,
      badge: isSemiarido ? `${statsKpis.pctCadeiasBahia}% da Bahia` : 'Ecossistema Produtivo',
      icon: Boxes,
      isHero: true
    },
    {
      label: selectedTerritory ? 'Maior Segmento Sediado' : 'Maior Segmento Produtivo',
      value: loadingStats ? '...' : (statsKpis.maiorSegmento ? `${statsKpis.maiorSegmento.percent}%` : '-'),
      suffix: null,
      badge: statsKpis.maiorSegmento ? statsKpis.maiorSegmento.name : 'Sem dados',
      icon: Wheat,
      isHero: false
    },
    {
      label: 'Municípios de Abrangência',
      value: loadingStats ? '...' : statsKpis.municipiosBeneficiados,
      suffix: `/ ${statsKpis.municipiosSede} sedes`,
      badge: `${statsKpis.municipiosBeneficiados} municípios`,
      icon: MapPin,
      isHero: false
    },
    {
      label: 'Territórios com Arranjos',
      value: loadingStats ? '...' : (selectedTerritory ? '1' : statsKpis.territoriosAtendidos),
      suffix: `/ ${statsKpis.totalTerrUniverso}`,
      badge: selectedTerritory ? 'Território Selecionado' : `${statsKpis.taxaTerr}% dos territórios`,
      icon: Layers,
      isHero: false
    }
  ];

  return (
    <main
      id="pdf-report"
      data-ready={!loadingStats ? 'true' : 'false'}
      data-loading={loadingStats ? 'true' : 'false'}
      ref={contentRef}
      className="flex-1 h-screen overflow-hidden relative p-5 lg:p-6 flex flex-col gap-4 bg-transparent font-sans w-full print:p-0 print:bg-transparent select-none"
    >
      {/* ================= ATMOSFERA: SOL DO SEMIÁRIDO ================= */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 overflow-hidden z-0 transition-opacity duration-700 ease-in-out select-none ${
          isSemiarido ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="absolute -top-[18vw] -right-[12vw] w-[62vw] h-[62vw] min-w-[550px] min-h-[550px] max-w-[1080px] max-h-[1080px] rounded-full animate-sun-breath"
          style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.07) 30%, rgba(251, 191, 36, 0.03) 55%, transparent 75%)',
            filter: 'blur(35px)',
          }}
        />
      </div>

      {/* CABEÇALHO */}
      <header className="flex items-center justify-between w-full shrink-0 relative z-10">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-headline font-bold text-text-primary tracking-tight leading-none">
              Relatório Executivo de Cadeias Produtivas & IGs
            </h1>

            {isSemiarido ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Recorte Oficial: Semiárido Baiano (278 Municípios)
              </span>
            ) : selectedTerritory ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                <MapPin size={13} className="text-primary-600 dark:text-primary-400" />
                Recorte: {territoryName}
                <button
                  type="button"
                  onClick={() => setSelectedTerritory(null)}
                  className="text-primary-600 hover:text-rose-500 transition-colors ml-0.5 cursor-pointer print:hidden"
                  title="Limpar seleção territorial"
                >
                  <X size={12} />
                </button>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                <span className="w-2 h-2 rounded-full bg-primary-600" />
                Cenário Geral: Estado da Bahia (417 Municípios)
              </span>
            )}
          </div>

          <p className="text-body-sm text-text-secondary mt-1 font-medium">
            {isSemiarido
              ? 'Diagnóstico territorial de Arranjos Produtivos Locais (APLs) e Indicações Geográficas nos 278 municípios do Semiárido'
              : 'Diagnóstico territorial de Arranjos Produtivos Locais (APLs) e Indicações Geográficas da Bahia'}
          </p>
          <div className={`divider-territorial w-48 mt-2 ${isSemiarido ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-transparent' : ''}`} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const next = !isSemiarido;
              setFiltroSemiarido?.(next);
              const newParams = new URLSearchParams(searchParams);
              if (next) {
                newParams.set('modo', 'semiarido');
              } else {
                newParams.delete('modo');
              }
              navigate(`?${newParams.toString()}`, { replace: true });
            }}
            title={isSemiarido ? 'Desativar modo Semiárido' : 'Ativar modo Semiárido'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-semibold transition-all shadow-xs active:scale-95 print:hidden cursor-pointer border ${
              isSemiarido
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                : 'bg-surface-soft border-border/70 text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isSemiarido ? 'bg-amber-500' : 'bg-slate-400'}`} />
            <span>Semiárido</span>
          </button>

          <span className="text-caption font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/40 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Award size={14} className="text-primary-600 dark:text-primary-400" />
            Dados Oficiais SECTI/BA
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            aria-label={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            className="w-8 h-8 rounded-full bg-surface-soft text-text-secondary hover:text-primary-600 hover:bg-surface border border-border/70 flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 print:hidden cursor-pointer"
          >
            {isDark ? (
              <Sun size={15} strokeWidth={2} className="text-amber-400" />
            ) : (
              <Moon size={15} strokeWidth={2} className="text-neutral-600" />
            )}
          </button>
        </div>
      </header>

      {/* GRID DE KPIS (4 CARDS) */}
      <div className="w-full relative z-10 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 items-stretch w-full">
          {kpiCards.map((kpi, index) => {
            const isHero = kpi.isHero;
            const IconComp = kpi.icon;

            return (
              <div
                key={index}
                className={`p-4 flex flex-col justify-between h-[98px] rounded-card cursor-default overflow-hidden select-none ${
                  isHero
                    ? (isSemiarido
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border border-amber-400/40 shadow-xs'
                        : 'bg-gradient-brand text-white border border-primary-500/40 shadow-xs')
                    : (isSemiarido
                        ? 'bg-surface-soft border border-amber-200/60 dark:border-amber-500/30 text-text-primary'
                        : 'bg-surface-soft border border-border/70 text-text-primary')
                }`}
              >
                {/* LINHA SUPERIOR: LABEL + ÍCONE CIRCULAR À DIREITA */}
                <div className="flex items-start justify-between gap-2 w-full min-w-0">
                  <span
                    className={`text-[13px] font-medium leading-tight truncate ${
                      isHero ? (isSemiarido ? 'text-amber-100' : 'text-white/85') : 'text-text-secondary'
                    }`}
                  >
                    {kpi.label}
                  </span>

                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                      isHero
                        ? 'bg-white/15 text-white border border-white/20 shadow-2xs'
                        : 'bg-surface border border-border/80 text-text-secondary shadow-2xs'
                    }`}
                  >
                    <IconComp size={15} strokeWidth={2} />
                  </div>
                </div>

                {/* LINHA INFERIOR: VALOR GRANDE + BADGE PILL */}
                <div className="flex items-baseline justify-between gap-2 w-full min-w-0 pt-0.5">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span
                      className={`text-[30px] font-bold tracking-tight leading-none shrink-0 tnum ${
                        isHero ? 'text-white' : 'text-text-primary'
                      }`}
                    >
                      {kpi.value}
                    </span>
                    {kpi.suffix && (
                      <span
                        className={`text-caption font-semibold tnum ${
                          isHero ? 'text-white/75' : 'text-text-muted'
                        }`}
                      >
                        {kpi.suffix}
                      </span>
                    )}
                  </div>

                  {kpi.badge && (
                    <span
                      className={`text-caption font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center leading-none truncate shrink-0 ${
                        isHero
                          ? 'bg-white/15 text-white border border-white/20'
                          : (isSemiarido
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60'
                              : 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60')
                      }`}
                    >
                      {kpi.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GRID PRINCIPAL: 4 GRÁFICOS (2x2 SIMÉTRICO) + SIDEMAP */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 relative z-10 min-h-0 w-full overflow-hidden">

        {/* COLUNA ESQUERDA: GRID 2x2 */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full min-h-0">

          {/* GRÁFICO 1: TOP 5 ARRANJOS & IGS (PÍLULAS PROPORCIONAIS SÓLIDAS) */}
          <div className={`bg-surface rounded-card p-4 border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} flex flex-col justify-between min-h-0 h-full overflow-hidden shadow-card`}>
            <div className="flex items-start justify-between gap-2 mb-1 shrink-0">
              <div className="flex flex-col min-w-0">
                <h2 className="text-text-primary font-semibold text-subtitle tracking-tight truncate">
                  {selectedTerritory ? `Arranjos em ${territoryName}` : 'Top 5 Arranjos & IGs'}
                </h2>
                <p className="text-text-muted text-caption font-medium mt-0.5 truncate">
                  {selectedTerritory ? `Arranjos com presença em ${territoryName}` : 'Maior extensão municipal de abrangência'}
                </p>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-semibold shrink-0 border ${
                isSemiarido
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                  : 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSemiarido ? 'bg-amber-500' : 'bg-primary-600'}`} />
                Abrangência
              </span>
            </div>

            <div className="w-full h-px bg-border/70 mb-1.5 shrink-0" />

            <div className="flex-1 flex flex-col justify-between gap-1.5 min-h-0 my-auto py-0.5">
              {topCadeiasData.map((item, idx) => {
                const rankStr = String(idx + 1).padStart(2, '0');
                const remaining = Math.max(1, maxCadeiaMunicipios + 2 - item.totalMunicipios);

                return (
                  <div key={idx} className="flex flex-col gap-0.5 w-full min-w-0">
                    <div className="flex items-center justify-between gap-1 px-0.5 leading-tight">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] font-bold text-text-muted tabular-nums shrink-0">
                          {rankStr}.
                        </span>
                        <span className="text-caption font-bold text-text-primary truncate tracking-tight" title={item.nome}>
                          {item.nome}
                        </span>
                        <span className="text-[11px] text-text-muted truncate hidden sm:inline">
                          • {item.segmento} (Sede: {item.municipioSede})
                        </span>
                      </div>
                      <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full leading-none shrink-0 ${item.badgeClass}`}>
                        {item.tipo}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 w-full">
                      <div
                        className="h-[22px] rounded-full flex items-center justify-center px-2.5 text-white transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap"
                        style={{
                          flexGrow: item.totalMunicipios,
                          flexBasis: 0,
                          backgroundColor: isSemiarido ? '#D97706' : item.corHex,
                          minWidth: '40px'
                        }}
                      >
                        <span className="text-caption font-bold tabular-nums leading-none whitespace-nowrap">
                          {item.totalMunicipios} mun.
                        </span>
                      </div>

                      <div
                        className={`h-[22px] rounded-full ${
                          isSemiarido
                            ? 'bg-amber-500/15 border border-amber-500/25'
                            : 'bg-surface-soft border border-border'
                        } flex items-center justify-center px-2 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs`}
                        style={{
                          flexGrow: remaining,
                          flexBasis: 0
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GRÁFICO 2: CONCENTRAÇÃO POR TERRITÓRIO (STACKED BARCHART) */}
          <div className="h-full min-h-0 overflow-hidden">
            <StackedBarChart
              data={concentracaoTerritorialStackedData}
              categories={selectedTerritory ? CADEIA_PRESENCA_CATEGORIES : CADEIA_CATEGORIES}
              title={
                selectedTerritory
                  ? `Concentração em ${territoryName}`
                  : (isSemiarido ? "Concentração no Semiárido" : "Concentração por Território")
              }
              subtitle={
                selectedTerritory
                  ? `Cadeias Sedes vs Abrangentes por município em ${territoryName}`
                  : (isSemiarido ? "Territórios do Semiárido líderes em cadeias produtivas" : "Top 10 Territórios em Cadeias e APLs na Bahia")
              }
              allowToggleView={false}
              showTopBadge={true}
              isSemiarido={isSemiarido}
            />
          </div>

          {/* GRÁFICO 3: DISTRIBUIÇÃO POR SEGMENTO (ESTILO PÍLULAS PROPORCIONAIS) */}
          <div className={`bg-surface rounded-card p-4 border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} flex flex-col justify-between min-h-0 h-full overflow-hidden shadow-card`}>
            <div className="flex items-start justify-between gap-2 mb-1 shrink-0">
              <div className="flex flex-col min-w-0">
                <h2 className="text-text-primary font-semibold text-subtitle tracking-tight truncate">
                  {selectedTerritory
                    ? `Segmentos em ${territoryName}`
                    : (isSemiarido ? "Distribuição por Segmento no Semiárido" : 'Distribuição por Segmento')}
                </h2>
                <p className="text-text-muted text-caption font-medium mt-0.5 truncate">
                  {selectedTerritory
                    ? `Vocações produtivas de ${territoryName}`
                    : (isSemiarido ? "Top 5 Segmentos instalados no Semiárido" : "Top 5 Segmentos Produtivos na Bahia")}
                </p>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-semibold shrink-0 border ${
                isSemiarido
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                  : 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border-primary-200/60 dark:border-primary-800/60'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSemiarido ? 'bg-amber-500' : 'bg-primary-600'}`} />
                {isSemiarido ? 'Recorte Semiárido' : 'Top 5 Segmentos'}
              </span>
            </div>

            <div className="w-full h-px bg-border/70 mb-1.5 shrink-0" />

            {/* LISTA DE PÍLULAS PROPORCIONAIS */}
            <div className="flex-1 flex flex-col justify-between gap-1.5 min-h-0 my-auto py-0.5">
              {segmentosEmpilhadosData.map((cat, idx) => {
                const negPillStyle = isSemiarido
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25'
                  : 'bg-surface-soft text-text-secondary border border-border';
                const totalPillStyle = isSemiarido
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/40'
                  : 'bg-surface-soft text-text-primary border border-border';

                return (
                  <div key={idx} className="flex flex-col gap-0.5 w-full">
                    <div className="text-caption font-semibold text-text-primary leading-tight flex items-center justify-between px-0.5">
                      <span className="truncate">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 w-full">
                      <div
                        className="h-[24px] rounded-full flex items-center justify-center px-2.5 text-white transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap"
                        style={{
                          flexGrow: cat.total,
                          flexBasis: 0,
                          backgroundColor: cat.corHex,
                          minWidth: cat.remaining > 0 ? '44px' : 'auto'
                        }}
                      >
                        <span className="text-caption font-semibold tabular-nums leading-none whitespace-nowrap">
                          {cat.total}
                        </span>
                      </div>

                      {cat.remaining > 0 && (
                        <div
                          className={`h-[24px] rounded-full ${negPillStyle} flex items-center justify-center px-2.5 transition-all duration-500 overflow-hidden shrink-0 select-none shadow-2xs whitespace-nowrap`}
                          style={{
                            flexGrow: cat.remaining,
                            flexBasis: 0
                          }}
                        />
                      )}

                      <div
                        className={`h-[24px] min-w-[54px] px-2.5 rounded-full ${totalPillStyle} flex items-center justify-center shrink-0 select-none shadow-2xs`}
                      >
                        <span className="text-caption font-semibold tabular-nums leading-none">
                          {cat.pctTotal}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GRÁFICO 4: TIPOLOGIAS DE RECONHECIMENTO (PROPORTIONBARCHART NATIVO) */}
          <div className="h-full min-h-0 overflow-hidden flex flex-col">
            <ProportionBarChart
              isVisaoGeral={true}
              isSemiarido={isSemiarido}
              data={tiposProportionData}
              title={
                selectedTerritory
                  ? `Tipologias em ${territoryName}`
                  : (isSemiarido ? "Tipologias no Semiárido" : "Tipologias de Reconhecimento")
              }
              subtitle={
                selectedTerritory
                  ? `Abrangência das cadeias sediadas em ${territoryName}`
                  : (isSemiarido ? "Abrangência: Intermunicipal vs Local no Semiárido" : "Abrangência: Intermunicipal vs Local na Bahia")
              }
              positiveLabel="Intermunicipal"
              negativeLabel="Local / Sede"
              positiveColor={isSemiarido ? "bg-amber-600" : "bg-primary-600"}
              negativeColor={isSemiarido ? "bg-amber-500/15" : "bg-primary-100"}
              positiveTextColor={isSemiarido ? "text-amber-700 dark:text-amber-300" : "text-primary-700 dark:text-primary-300"}
              negativeTextColor={isSemiarido ? "text-amber-800 dark:text-amber-300" : "text-primary-700 dark:text-primary-300"}
            />
          </div>

        </div>

        {/* COLUNA DIREITA: SIDEMAP INTEGRADO */}
        <div style={{ width: 'calc(30% - 12px)' }} className={`shrink-0 h-full bg-surface rounded-card border ${isSemiarido ? 'border-amber-200/60 dark:border-amber-500/30' : 'border-border'} shadow-card relative overflow-hidden flex flex-col min-h-0`}>
          <SideMap
            key={`map-cadeias-${isSemiarido ? 'semi' : 'normal'}-${selectedTerritory?.id_territorio || 'all'}`}
            mode="cadeias"
            cadeiasData={filteredCadeias}
            processedAtivos={filteredCadeias}
            selectedTerritory={selectedTerritory}
            onSelectTerritory={setSelectedTerritory}
            filtroSemiarido={isSemiarido}
          />
        </div>

      </div>

    </main>
  );
}
