import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { getTextoReferencia } from '../data/referenciasDB';
import {
  ENTITY_META,
  createEmptyDraft,
  loadCrudDraft,
  saveCrudDraft,
  clearCrudDraft,
  getEntityItemId,
  getEntityItemLabel,
  applyCrudPatch,
  applyCadeiasDistribuicaoPatch,
  countDraftChanges,
} from '../utils/crudDraft';

export const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  return context || {};
};

const CACHE_KEY = '@SectiPainel_Data_v14_SUPABASE_PROD';
const CACHE_TIME_MS = 10 * 60 * 1000;

export const DataProvider = ({ children }) => {
  const [baseTerritoriosData, setBaseTerritoriosData] = useState([]);
  const [baseAtivosData, setBaseAtivosData] = useState([]);
  const [baseCursosData, setBaseCursosData] = useState([]);
  const [cursosEadData, setCursosEadData] = useState([]);
  const [baseDistribuicaoCadeias, setBaseDistribuicaoCadeias] = useState([]);
  const [baseListaCadeias, setBaseListaCadeias] = useState([]);
  const [municipiosTerritorios, setMunicipiosTerritorios] = useState([]);
  const [crudDraft, setCrudDraft] = useState(() => loadCrudDraft());
  
  const [tiposAtivos, setTiposAtivos] = useState([]);
  const [tiposCursos, setTiposCursos] = useState([]);
  const [tiposCadeias, setTiposCadeias] = useState([]);
  const [firjanData, setFirjanData] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [modoGeografico, setModoGeografico] = useState(false);
  const [filtroSemiarido, setFiltroSemiarido] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('modo') === 'semiarido') return true;
        return localStorage.getItem('secti-semiarido') === 'true';
      }
    } catch {}
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('secti-semiarido', String(filtroSemiarido));
    } catch {}
  }, [filtroSemiarido]);

  useEffect(() => {
    const carregarEstatisticas = async () => {
      // 1. TENTA LER DO CACHE
      const cachedDataStr = localStorage.getItem(CACHE_KEY);

      if (cachedDataStr) {
        try {
          const cache = JSON.parse(cachedDataStr);
          const idadeDoCache = Date.now() - cache.timestamp;

          if (cache.distCadeias && cache.distCadeias.length > 88 && idadeDoCache < CACHE_TIME_MS) {
            setBaseTerritoriosData(cache.stats || []);
            setBaseAtivosData(cache.ativos || []);
            setBaseCursosData(cache.cursos || []);
            setCursosEadData(cache.cursosEad || []);
            setBaseDistribuicaoCadeias(cache.distCadeias || []);
            setBaseListaCadeias(cache.listaCadeias || []);
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
        // 2. BUSCA DO SUPABASE
        const [
          statsRes, 
          ativosRes, 
          cursosRes,
          distCadeiasRes,
          listaCadeiasRes,
          munTerRes,
          tAtivosRes,
          tCursosRes,
          tCadeiasRes,
          cursosRawRes,
          referenciasRes,
          firjanRes
        ] = await Promise.all([
          supabase.from('stats_ti').select('*'),
          supabase.from('lista_ativos_cti').select('*').range(0, 3000),
          supabase.from('lista_cursos_cti').select('*').range(0, 3000),
          supabase.from('distribuicao_cadeias').select('*').range(0, 4999),
          supabase.from('lista_cadeia_produtiva').select('*').range(0, 1000),
          supabase.from('lista_municipioxterritorio').select('*').range(0, 1000),
          supabase.from('tipo_ativos').select('*'),
          supabase.from('tipo_cursos').select('*'),
          supabase.from('tipo_cadeia').select('*'),
          supabase.from('cursos').select('id_curso, ead').range(0, 3000),
          supabase.from('referencias').select('id_referencia, titulo_referencia, texto_referencia, url_referencia'),
          supabase.from('firjan').select('*').range(0, 1000)
        ]);

        if (statsRes.error) console.error('Supabase stats_ti error:', statsRes.error);
        if (ativosRes.error) console.error('Supabase lista_ativos_cti error:', ativosRes.error);
        if (cursosRes.error) console.error('Supabase lista_cursos_cti error:', cursosRes.error);
        if (distCadeiasRes.error) console.error('Supabase distribuicao_cadeias error:', distCadeiasRes.error);
        if (listaCadeiasRes.error) console.error('Supabase lista_cadeia_produtiva error:', listaCadeiasRes.error);
        if (munTerRes.error) console.error('Supabase lista_municipioxterritorio error:', munTerRes.error);
        if (firjanRes.error) console.error('Supabase firjan error:', firjanRes.error);

        // Mapeamento explícito de EAD da tabela base
        const eadMap = new Map((cursosRawRes?.data || []).map(r => [r.id_curso, Boolean(r.ead)]));

        // Separação estrita: Somente cursos presenciais entram no fluxo principal
        const todosCursos = (cursosRes?.data || []).map(c => ({
          ...c,
          ead: eadMap.get(c.id) ?? Boolean(c.ead) ?? false
        }));

        const cursosPresenciais = todosCursos.filter(c => c.ead === false);
        const cursosEad = todosCursos.filter(c => c.ead === true);

        // Recalcula a contagem de cursos presenciais por território para quebrar o número inflado da view
        const contagemCursosPresenciaisPorTerritorio = {};
        cursosPresenciais.forEach(c => {
          const idTerr = c.id_territorio;
          if (idTerr) {
            contagemCursosPresenciaisPorTerritorio[idTerr] = (contagemCursosPresenciaisPorTerritorio[idTerr] || 0) + 1;
          }
        });

        const dadosTratados = (statsRes?.data || []).map(t => {
          let ifdmFormatado = null;
          if (t.media_ifdm) {
            const match = String(t.media_ifdm).match(/^-?\d+(?:\.\d{0,3})?/);
            ifdmFormatado = match ? Number(match[0]).toFixed(3) : null;
          }
          return { 
            ...t, 
            media_ifdm: ifdmFormatado,
            // Substitui a contagem estática pela contagem estrita de cursos presenciais
            qtd_cursos_cti: contagemCursosPresenciaisPorTerritorio[t.id_territorio] || 0
          };
        });

        // Mapeamento e enriquecimento da coluna texto_referencia para IG Potencial
        const refMapByUrl = new Map();
        (referenciasRes?.data || []).forEach(r => {
          if (r.url_referencia && r.texto_referencia) {
            refMapByUrl.set(String(r.url_referencia).trim().toLowerCase(), r.texto_referencia);
          }
        });

        const getTextoRef = (fonte, entidade) => {
          if (fonte) {
            const direct = refMapByUrl.get(String(fonte).trim().toLowerCase());
            if (direct) return direct;
          }
          return getTextoReferencia(fonte, entidade);
        };

        const listaCadeiasTratadas = (listaCadeiasRes?.data || []).map(c => {
          const isPotencial = (c.id_tipo_cadeia === 3) || String(c.tipo || '').toLowerCase().includes('potencial');
          return {
            ...c,
            texto_referencia: isPotencial ? getTextoRef(c.fonte, c.entidade) : null
          };
        });

        const distCadeiasTratadas = (distCadeiasRes?.data || []).map(c => {
          const isPotencial = (c.id_tipo_cadeia === 3) || String(c.nome_tipo || c.tipo || '').toLowerCase().includes('potencial');
          return {
            ...c,
            texto_referencia: isPotencial ? getTextoRef(c.fonte, c.entidade) : null
          };
        });

        // 3. GRAVA NO CACHE
        const novoCache = {
          stats: dadosTratados,
          ativos: ativosRes?.data || [],
          cursos: cursosPresenciais,
          cursosEad: cursosEad,
          distCadeias: distCadeiasTratadas,
          listaCadeias: listaCadeiasTratadas,
          munTer: munTerRes?.data || [],
          tiposAtivos: tAtivosRes?.data || [],
          tiposCursos: tCursosRes?.data || [],
          tiposCadeias: tCadeiasRes?.data || [],
          firjanData: firjanRes?.data || [],
          timestamp: Date.now()
        };

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(novoCache));
        } catch (err) {
          console.warn("LocalStorage lotado, rodando sem cache.");
        }

        setBaseTerritoriosData(novoCache.stats);
        setBaseAtivosData(novoCache.ativos);
        setBaseCursosData(novoCache.cursos);
        setCursosEadData(novoCache.cursosEad);
        setBaseDistribuicaoCadeias(novoCache.distCadeias);
        setBaseListaCadeias(novoCache.listaCadeias);
        setMunicipiosTerritorios(novoCache.munTer);
        setTiposAtivos(novoCache.tiposAtivos);
        setTiposCursos(novoCache.tiposCursos);
        setTiposCadeias(novoCache.tiposCadeias);
        setFirjanData(novoCache.firjanData);
      } catch (err) {
        console.error("Erro crítico ao carregar dados do Supabase:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    carregarEstatisticas();
  }, []);

  const persistDraft = useCallback((updater) => {
    setCrudDraft((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveCrudDraft(next);
      return next;
    });
  }, []);

  const createCrudItem = useCallback(
    (entity, payload) => {
      const meta = ENTITY_META[entity];
      if (!meta) return null;
      const newId = `draft-${entity}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const record = {
        ...payload,
        id: newId,
        [meta.idKey]: newId,
      };
      const label = getEntityItemLabel(entity, record);

      persistDraft((prev) => ({
        ...prev,
        [entity]: {
          ...prev[entity],
          added: [record, ...(prev[entity]?.added || [])],
        },
        auditLog: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            entity,
            action: 'create',
            targetId: newId,
            label,
            timestamp: new Date().toISOString(),
          },
          ...(prev.auditLog || []),
        ].slice(0, 50),
      }));

      return record;
    },
    [persistDraft]
  );

  const updateCrudItem = useCallback(
    (entity, targetId, payload) => {
      const idStr = String(targetId);
      const label = getEntityItemLabel(entity, payload);

      persistDraft((prev) => {
        const slice = prev[entity] || { added: [], updated: {}, deleted: [] };
        const isAdded = (slice.added || []).some((item) => getEntityItemId(entity, item) === idStr);

        const nextAdded = isAdded
          ? slice.added.map((item) =>
              getEntityItemId(entity, item) === idStr ? { ...item, ...payload } : item
            )
          : slice.added;

        const nextUpdated = isAdded
          ? slice.updated
          : {
              ...slice.updated,
              [idStr]: { ...(slice.updated?.[idStr] || {}), ...payload },
            };

        return {
          ...prev,
          [entity]: {
            ...slice,
            added: nextAdded,
            updated: nextUpdated,
          },
          auditLog: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              entity,
              action: 'update',
              targetId: idStr,
              label,
              timestamp: new Date().toISOString(),
            },
            ...(prev.auditLog || []),
          ].slice(0, 50),
        };
      });
    },
    [persistDraft]
  );

  const deleteCrudItem = useCallback(
    (entity, targetId, labelOverride) => {
      const idStr = String(targetId);

      persistDraft((prev) => {
        const slice = prev[entity] || { added: [], updated: {}, deleted: [] };
        const isAdded = (slice.added || []).some((item) => getEntityItemId(entity, item) === idStr);
        const nextAdded = isAdded
          ? slice.added.filter((item) => getEntityItemId(entity, item) !== idStr)
          : slice.added;

        const nextUpdated = { ...(slice.updated || {}) };
        delete nextUpdated[idStr];

        const nextDeleted = isAdded
          ? slice.deleted
          : Array.from(new Set([...(slice.deleted || []).map(String), idStr]));

        return {
          ...prev,
          [entity]: {
            ...slice,
            added: nextAdded,
            updated: nextUpdated,
            deleted: nextDeleted,
          },
          auditLog: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              entity,
              action: 'delete',
              targetId: idStr,
              label: labelOverride || idStr,
              timestamp: new Date().toISOString(),
            },
            ...(prev.auditLog || []),
          ].slice(0, 50),
        };
      });
    },
    [persistDraft]
  );

  const resetCrudDrafts = useCallback(() => {
    clearCrudDraft();
    setCrudDraft(createEmptyDraft());
  }, []);

  const crudStats = useMemo(() => countDraftChanges(crudDraft), [crudDraft]);

  const ativosData = useMemo(
    () => applyCrudPatch(baseAtivosData, crudDraft.ativos, 'ativos'),
    [baseAtivosData, crudDraft.ativos]
  );

  const cursosData = useMemo(
    () => applyCrudPatch(baseCursosData, crudDraft.cursos, 'cursos'),
    [baseCursosData, crudDraft.cursos]
  );

  const listaCadeias = useMemo(
    () => applyCrudPatch(baseListaCadeias, crudDraft.cadeias, 'cadeias'),
    [baseListaCadeias, crudDraft.cadeias]
  );

  const distribuicaoCadeias = useMemo(
    () => applyCadeiasDistribuicaoPatch(baseDistribuicaoCadeias, crudDraft.cadeias),
    [baseDistribuicaoCadeias, crudDraft.cadeias]
  );

  const territoriosData = useMemo(() => {
    if (!baseTerritoriosData.length || crudStats.total === 0) {
      return baseTerritoriosData;
    }

    const countByTerritory = (list) => {
      const map = {};
      list.forEach((item) => {
        const tid = item?.id_territorio;
        if (tid != null && tid !== '') {
          map[tid] = (map[tid] || 0) + 1;
        }
      });
      return map;
    };

    const baseAtivosByT = countByTerritory(baseAtivosData);
    const curAtivosByT = countByTerritory(ativosData);
    const baseCursosByT = countByTerritory(baseCursosData);
    const curCursosByT = countByTerritory(cursosData);
    const baseCadeiasByT = countByTerritory(baseListaCadeias);
    const curCadeiasByT = countByTerritory(listaCadeias);

    return baseTerritoriosData.map((t) => {
      const tid = t.id_territorio;
      const deltaAtivos = (curAtivosByT[tid] || 0) - (baseAtivosByT[tid] || 0);
      const deltaCursos = (curCursosByT[tid] || 0) - (baseCursosByT[tid] || 0);
      const deltaCadeias = (curCadeiasByT[tid] || 0) - (baseCadeiasByT[tid] || 0);

      if (deltaAtivos === 0 && deltaCursos === 0 && deltaCadeias === 0) return t;

      return {
        ...t,
        ativos_cti: Math.max(0, Number(t.ativos_cti || 0) + deltaAtivos),
        qtd_cursos_cti: Math.max(0, Number(t.qtd_cursos_cti || 0) + deltaCursos),
        cadeias_produtivas: Math.max(0, Number(t.cadeias_produtivas || 0) + deltaCadeias),
      };
    });
  }, [
    baseTerritoriosData,
    crudStats.total,
    baseAtivosData,
    ativosData,
    baseCursosData,
    cursosData,
    baseListaCadeias,
    listaCadeias,
  ]);

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
 acc.ativos += Number(curr.ativos_cti || 0);
 acc.cursos += Number(curr.qtd_cursos_cti || 0);
 acc.cadeias += Number(curr.cadeias_produtivas || 0);
 if (curr.media_ifdm) {
 acc.somaIfdm += Number(curr.media_ifdm);
 acc.qtdIfdm += 1; 
 }
 return acc;
 }, { ativos: 0, cursos: 0, cadeias: 0, somaIfdm: 0, qtdIfdm: 0 });

 return {
 ativos: totais.ativos,
 cursos: totais.cursos,
 cadeias: totais.cadeias,
 ifdmMedio: totais.qtdIfdm > 0 ? (totais.somaIfdm / totais.qtdIfdm).toFixed(3) : 0,
 territorios: territoriosData.length 
 };
 }, [territoriosData]);

 return (
 <DataContext.Provider value={{ 
 territoriosData, 
 ativosData, 
 cursosData, // Retorna exclusivamente cursos onde ead = false
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
 modoGeografico,
 setModoGeografico,
 crudDraft,
 crudStats,
 createCrudItem,
 updateCrudItem,
 deleteCrudItem,
 resetCrudDrafts,
 }}>
 {children}
 </DataContext.Provider>
 );
};