import React, { createContext, useState, useEffect, useMemo } from 'react';
import {
  getCanonicalUnits,
  getCanonicalCourses,
  getCanonicalInstitutions,
  getCanonicalTiposAtivos,
  CANONICAL_TIPOS_ATIVOS,
} from '../data/adapters/canonicalAdapter';

export const DataContext = createContext();

const CACHE_KEY = '@SectiPainel_Data_v15_CANONICAL';
const CACHE_TIME_MS = 10 * 60 * 1000;

export const DataProvider = ({ children }) => {
  const [territoriosData, setTerritoriosData] = useState([]);
  const [ativosData, setAtivosData] = useState([]);
  const [cursosData, setCursosData] = useState([]);
  const [cursosEadData, setCursosEadData] = useState([]);
  const [distribuicaoCadeias, setDistribuicaoCadeias] = useState([]);
  const [listaCadeias, setListaCadeias] = useState([]);
  const [municipiosTerritorios, setMunicipiosTerritorios] = useState([]);

  const [tiposAtivos, setTiposAtivos] = useState([]);
  const [tiposCursos, setTiposCursos] = useState([]);
  const [tiposCadeias, setTiposCadeias] = useState([]);
  const [firjanData, setFirjanData] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [filtroSemiarido, setFiltroSemiarido] = useState(false);

  useEffect(() => {
    const carregarEstatisticas = async () => {
      // 1. TENTA LER DO CACHE
      const cachedDataStr = localStorage.getItem(CACHE_KEY);
      if (cachedDataStr) {
        try {
          const cache = JSON.parse(cachedDataStr);
          const idadeDoCache = Date.now() - cache.timestamp;
          if (cache.distCadeias && cache.distCadeias.length > 88 && idadeDoCache < CACHE_TIME_MS) {
            setTerritoriosData(cache.stats || []);
            setAtivosData(cache.ativos || []);
            setCursosData(cache.cursos || []);
            setCursosEadData(cache.cursosEad || []);
            setDistribuicaoCadeias(cache.distCadeias || []);
            setListaCadeias(cache.listaCadeias || []);
            setMunicipiosTerritorios(cache.munTer || []);
            setTiposAtivos(cache.tiposAtivos || []);
            setTiposCursos(cache.tiposCursos || []);
            setTiposCadeias(cache.tiposCadeias || []);
            setFirjanData(cache.firjanData || []);
            setLoadingStats(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }

      setLoadingStats(true);

      try {
        // 2. CARREGA VIA INTERFACE CANÔNICA
        // O DataContext não conhece Supabase, INEP, shadow ou classificações intermediárias.
        const [units, courses, institutions, tiposAtivosCanonicos] = await Promise.all([
          getCanonicalUnits(),
          getCanonicalCourses(),
          getCanonicalInstitutions(),
          getCanonicalTiposAtivos(),
        ]);

        const { presenciais: cursosPresenciais, ead: cursosEad } = courses;
        const {
          stats,
          distribuicaoCadeias: distCadeias,
          listaCadeias: lCadeias,
          municipiosTerritorios: munTer,
          tiposCursos: tCursos,
          tiposCadeias: tCadeias,
          firjanData: firjan,
        } = institutions;

        // 3. GRAVA NO CACHE
        const novoCache = {
          stats,
          ativos: units,
          cursos: cursosPresenciais,
          cursosEad,
          distCadeias,
          listaCadeias: lCadeias,
          munTer,
          tiposAtivos: tiposAtivosCanonicos,
          tiposCursos: tCursos,
          tiposCadeias: tCadeias,
          firjanData: firjan,
          timestamp: Date.now(),
        };

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(novoCache));
        } catch (err) {
          console.warn('[DataContext] LocalStorage lotado, rodando sem cache.');
        }

        setTerritoriosData(novoCache.stats);
        setAtivosData(novoCache.ativos);
        setCursosData(novoCache.cursos);
        setCursosEadData(novoCache.cursosEad);
        setDistribuicaoCadeias(novoCache.distCadeias);
        setListaCadeias(novoCache.listaCadeias);
        setMunicipiosTerritorios(novoCache.munTer);
        setTiposAtivos(novoCache.tiposAtivos);
        setTiposCursos(novoCache.tiposCursos);
        setTiposCadeias(novoCache.tiposCadeias);
        setFirjanData(novoCache.firjanData);
      } catch (err) {
        console.error('[DataContext] Erro crítico ao carregar dados canônicos:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    carregarEstatisticas();
  }, []);

  const territoriesDynamicStats = useMemo(() => {
    const stats = {};
    territoriosData.forEach(t => {
      stats[t.id_territorio] = {
        matchesFilters: true,
        ifdm: t.media_ifdm ? Number(t.media_ifdm).toFixed(3) : '-',
        capacidadeCti: t.ativos_cti || 0,
        qtdCursos: t.qtd_cursos_cti || 0,
        cadeiasIgs: t.cadeias_produtivas || 0,
        pctSemiarido: t.pct_semiarido || 0,
      };
    });
    return stats;
  }, [territoriosData]);

  const kpisGlobais = useMemo(() => {
    if (!territoriosData.length) return { ativos: 0, cursos: 0, cadeias: 0, ifdmMedio: 0, territorios: 0 };
    const totais = territoriosData.reduce((acc, curr) => {
      acc.ativos  += Number(curr.ativos_cti || 0);
      acc.cursos  += Number(curr.qtd_cursos_cti || 0);
      acc.cadeias += Number(curr.cadeias_produtivas || 0);
      if (curr.media_ifdm) {
        acc.somaIfdm += Number(curr.media_ifdm);
        acc.qtdIfdm  += 1;
      }
      return acc;
    }, { ativos: 0, cursos: 0, cadeias: 0, somaIfdm: 0, qtdIfdm: 0 });

    return {
      ativos:    totais.ativos,
      cursos:    totais.cursos,
      cadeias:   totais.cadeias,
      ifdmMedio: totais.qtdIfdm > 0 ? (totais.somaIfdm / totais.qtdIfdm).toFixed(3) : 0,
      territorios: territoriosData.length,
    };
  }, [territoriosData]);

  return (
    <DataContext.Provider value={{
      territoriosData,
      ativosData,
      cursosData,         // Exclusivamente cursos onde ead = false
      cursosEadData,
      distribuicaoCadeias,
      listaCadeias,
      municipiosTerritorios,
      tiposAtivos,
      tiposCursos,
      tiposCadeias,
      firjanData,
      territoriesDynamicStats,
      kpisGlobais,
      loadingStats,
      selectedTerritory,
      setSelectedTerritory,
      filtroSemiarido,
      setFiltroSemiarido,
    }}>
      {children}
    </DataContext.Provider>
  );
};