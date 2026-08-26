import React, { createContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';

export const DataContext = createContext();

// Força nova versão do cache
const CACHE_KEY = '@SectiPainel_Data_v8_FULL'; 
const CACHE_TIME_MS = 15 * 60 * 1000;

export const DataProvider = ({ children }) => {
  const [territoriosData, setTerritoriosData] = useState([]);
  const [ativosData, setAtivosData] = useState([]);
  const [cursosData, setCursosData] = useState([]);
  const [distribuicaoCadeias, setDistribuicaoCadeias] = useState([]);
  const [listaCadeias, setListaCadeias] = useState([]);
  const [municipiosTerritorios, setMunicipiosTerritorios] = useState([]);
  
  const [tiposAtivos, setTiposAtivos] = useState([]);
  const [tiposCursos, setTiposCursos] = useState([]);
  const [tiposCadeias, setTiposCadeias] = useState([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedTerritory, setSelectedTerritory] = useState(null);

  useEffect(() => {
    const carregarEstatisticas = async () => {
      // 1. TENTA LER DO CACHE
      const cachedDataStr = localStorage.getItem(CACHE_KEY);
      let isCacheValid = false;

      if (cachedDataStr) {
        try {
          const cache = JSON.parse(cachedDataStr);
          const idadeDoCache = Date.now() - cache.timestamp;

          // Só considera válido se distCadeias tiver mais de 88 registros (ou seja, a relação 1:N real)
          if (cache.distCadeias && cache.distCadeias.length > 88 && idadeDoCache < CACHE_TIME_MS) {
            console.log(`⚡ Cache V8 Carregado com Sucesso: ${cache.distCadeias.length} linhas de distribuição.`);
            setTerritoriosData(cache.stats || []);
            setAtivosData(cache.ativos || []);
            setCursosData(cache.cursos || []);
            setDistribuicaoCadeias(cache.distCadeias || []);
            setListaCadeias(cache.listaCadeias || []);
            setMunicipiosTerritorios(cache.munTer || []);
            setTiposAtivos(cache.tiposAtivos || []);
            setTiposCursos(cache.tiposCursos || []);
            setTiposCadeias(cache.tiposCadeias || []);
            setLoadingStats(false);
            isCacheValid = true;
            return;
          }
        } catch (e) {
          console.warn("Limpando cache inconsistente...", e);
          localStorage.removeItem(CACHE_KEY);
        }
      }

      if (!isCacheValid) {
        setLoadingStats(true);
      }

      // 2. BUSCA DO SUPABASE COM RANGE EXPLÍCITO (IGNORA LIMITE DE 1000 LINHAS)
      console.log("🌐 Buscando dados completos do Supabase...");
      
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
        cursosRawRes
      ] = await Promise.all([
        supabase.from('stats_ti').select('*'),
        supabase.from('lista_ativos_cti').select('*').range(0, 3000),
        supabase.from('lista_cursos_cti').select('*').range(0, 3000),
        supabase.from('distribuicao_cadeias').select('*').range(0, 4999), // <-- Força a leitura completa de todas as linhas da relação 1:N
        supabase.from('lista_cadeia_produtiva').select('*').range(0, 1000),
        supabase.from('lista_municipioxterritorio').select('*').range(0, 1000),
        supabase.from('tipo_ativos').select('*'),
        supabase.from('tipo_cursos').select('*'),
        supabase.from('tipo_cadeia').select('*'),
        supabase.from('cursos').select('id_curso, ead').range(0, 3000)
      ]);

      // LOG DE DIAGNÓSTICO DIRETO NO SEU NAVEGADOR
      console.log("📊 RESUMO DAS RESPOSTAS DO BANCO:");
      console.log("-> distribuicao_cadeias:", distCadeiasRes.data?.length || 0, "linhas", distCadeiasRes.error ? `[ERRO: ${distCadeiasRes.error.message}]` : "OK");
      console.log("-> lista_cadeia_produtiva:", listaCadeiasRes.data?.length || 0, "linhas", listaCadeiasRes.error ? `[ERRO: ${listaCadeiasRes.error.message}]` : "OK");

      // Tratamento do IFDM
      const dadosTratados = (statsRes.data || []).map(t => {
        let ifdmFormatado = null;
        if (t.media_ifdm) {
          const match = String(t.media_ifdm).match(/^-?\d+(?:\.\d{0,3})?/);
          ifdmFormatado = match ? Number(match[0]).toFixed(3) : null;
        }
        return { ...t, media_ifdm: ifdmFormatado };
      });

      // Mapeamento e união da coluna ead nos cursos
      const eadMap = new Map((cursosRawRes.data || []).map(r => [r.id_curso, r.ead]));
      const cursosTratados = (cursosRes.data || []).map(c => ({
        ...c,
        ead: eadMap.get(c.id) ?? false
      }));

      // 3. GRAVA NO CACHE
      const novoCache = {
        stats: dadosTratados,
        ativos: ativosRes.data || [],
        cursos: cursosTratados,
        distCadeias: distCadeiasRes.data || [],
        listaCadeias: listaCadeiasRes.data || [],
        munTer: munTerRes.data || [],
        tiposAtivos: tAtivosRes.data || [],
        tiposCursos: tCursosRes.data || [],
        tiposCadeias: tCadeiasRes.data || [],
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(novoCache));
      } catch (err) {
        console.warn("LocalStorage lotado, rodando sem cache.");
      }

      setTerritoriosData(novoCache.stats);
      setAtivosData(novoCache.ativos);
      setCursosData(novoCache.cursos);
      setDistribuicaoCadeias(novoCache.distCadeias);
      setListaCadeias(novoCache.listaCadeias);
      setMunicipiosTerritorios(novoCache.munTer);
      setTiposAtivos(novoCache.tiposAtivos);
      setTiposCursos(novoCache.tiposCursos);
      setTiposCadeias(novoCache.tiposCadeias);
      
      setLoadingStats(false);
    };

    carregarEstatisticas();
  }, []);

  // KPIs DINÂMICOS
  const territoriesDynamicStats = useMemo(() => {
    const stats = {};
    territoriosData.forEach(t => {
      stats[t.id_territorio] = {
        matchesFilters: true, 
        ifdm: t.media_ifdm ? Number(t.media_ifdm).toFixed(3) : '-',
        capacidadeCti: t.ativos_cti || 0,
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
      cursosData,
      distribuicaoCadeias,
      listaCadeias,
      municipiosTerritorios,
      tiposAtivos,
      tiposCursos,
      tiposCadeias,
      territoriesDynamicStats,
      kpisGlobais,            
      loadingStats,
      selectedTerritory,
      setSelectedTerritory 
    }}>
      {children}
    </DataContext.Provider>
  );
};