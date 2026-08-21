import React, { createContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';

export const DataContext = createContext();

// =========================================================================
// CONFIGURAÇÕES DO CACHE DO SUPER-CÉREBRO
// =========================================================================
const CACHE_KEY = '@SectiPainel_Data'; // V5: Inclusão do Ecossistema Completo (Cadeias, Cursos e Tipos)
const CACHE_TIME_MS = 15 * 60 * 1000; // 15 minutos

export const DataProvider = ({ children }) => {
  // 1. ESTADOS DE DADOS (Tabelas e Views)
  const [territoriosData, setTerritoriosData] = useState([]);
  const [ativosData, setAtivosData] = useState([]);
  
  // Novos estados para o Ecossistema Completo
  const [cursosData, setCursosData] = useState([]);
  const [distribuicaoCadeias, setDistribuicaoCadeias] = useState([]);
  const [listaCadeias, setListaCadeias] = useState([]);
  const [municipiosTerritorios, setMunicipiosTerritorios] = useState([]);
  
  // Novos estados para as Tabelas de Tipos (Filtros)
  const [tiposAtivos, setTiposAtivos] = useState([]);
  const [tiposCursos, setTiposCursos] = useState([]);
  const [tiposCadeias, setTiposCadeias] = useState([]);

  // Estados de Controle da Interface
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedTerritory, setSelectedTerritory] = useState(null);

  useEffect(() => {
    const carregarEstatisticas = async () => {
      // =================================================================
      // 1. TENTA LER O CACHE PRIMEIRO
      // =================================================================
      const cachedDataStr = localStorage.getItem(CACHE_KEY);
      let isCacheValid = false;

      if (cachedDataStr) {
        try {
          const cache = JSON.parse(cachedDataStr);
          const idadeDoCache = Date.now() - cache.timestamp;

          if (cache.stats && cache.stats.length > 0) {
            // Injeta tudo na tela instantaneamente
            setTerritoriosData(cache.stats);
            setAtivosData(cache.ativos || []);
            setCursosData(cache.cursos || []);
            setDistribuicaoCadeias(cache.distCadeias || []);
            setListaCadeias(cache.listaCadeias || []);
            setMunicipiosTerritorios(cache.munTer || []);
            setTiposAtivos(cache.tiposAtivos || []);
            setTiposCursos(cache.tiposCursos || []);
            setTiposCadeias(cache.tiposCadeias || []);
            setLoadingStats(false);
          }

          if (idadeDoCache < CACHE_TIME_MS) {
            console.log("⚡ Painel carregado do Cache V5 (Dados Completos)!");
            isCacheValid = true;
            return; 
          }
        } catch (e) {
          console.warn("Erro ao ler o cache V5, buscando do zero...", e);
        }
      }

      if (!isCacheValid && territoriosData.length === 0) {
        setLoadingStats(true);
      }

      // =================================================================
      // 2. MEGA BUSCA NO SUPABASE EM PARALELO (PROMISE.ALL)
      // =================================================================
      const [
        statsRes, 
        ativosRes, 
        cursosRes,
        distCadeiasRes,
        listaCadeiasRes,
        munTerRes,
        tAtivosRes,
        tCursosRes,
        tCadeiasRes
      ] = await Promise.all([
        supabase.from('stats_ti').select('*'),
        supabase.from('lista_ativos_cti').select('*'),
        supabase.from('lista_cursos_cti').select('*'),
        supabase.from('distribuicao_cadeias').select('*'),
        supabase.from('lista_cadeia_produtiva').select('*'),
        supabase.from('lista_municipioxterritorio').select('*'), // Letras minúsculas previnem bugs de API
        supabase.from('tipo_ativos').select('*'),
        supabase.from('tipo_cursos').select('*'),
        supabase.from('tipo_cadeia').select('*')
      ]);

      // Verifica se houve falha crítica
      if (statsRes.error) {
        console.error("Erro fatal ao puxar do Supabase", statsRes.error);
        setLoadingStats(false);
        return;
      }

      // Tratamento do IFDM na raiz
      const dadosTratados = (statsRes.data || []).map(t => {
        let ifdmFormatado = null;
        if (t.media_ifdm) {
          const match = String(t.media_ifdm).match(/^-?\d+(?:\.\d{0,3})?/);
          ifdmFormatado = match ? Number(match[0]).toFixed(3) : null;
        }
        return { ...t, media_ifdm: ifdmFormatado };
      });

      // =================================================================
      // 3. SALVA OS DADOS NOVOS NO CACHE DO NAVEGADOR
      // =================================================================
      const novoCache = {
        stats: dadosTratados,
        ativos: ativosRes.data || [],
        cursos: cursosRes.data || [],
        distCadeias: distCadeiasRes.data || [],
        listaCadeias: listaCadeiasRes.data || [],
        munTer: munTerRes.data || [],
        tiposAtivos: tAtivosRes.data || [],
        tiposCursos: tCursosRes.data || [],
        tiposCadeias: tCadeiasRes.data || [],
        timestamp: Date.now()
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(novoCache));

      // Atualiza os estados
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

  // =========================================================================
  // KPIs DINÂMICOS PRÉ-CALCULADOS (Mantidos Intactos para o Mapa e Cards)
  // =========================================================================
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
      // Dados Brutos e Tabelas de Tipos
      territoriosData, 
      ativosData, 
      cursosData,
      distribuicaoCadeias,
      listaCadeias,
      municipiosTerritorios,
      tiposAtivos,
      tiposCursos,
      tiposCadeias,

      // KPIs e Estados Dinâmicos
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