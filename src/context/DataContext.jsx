import React, { createContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { getTextoReferencia } from '../data/referenciasDB';

export const DataContext = createContext();

const CACHE_KEY = '@SectiPainel_Data_v14_SUPABASE_PROD';
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
      // 0. MODO DE HOMOLOGAÇÃO SHADOW / CANÔNICO (APENAS EM DESENVOLVIMENTO)
      const dataSourceEnv = import.meta.env.VITE_DATA_SOURCE || 'production';
      const activeSource = (import.meta.env.DEV && localStorage.getItem('@Secti_DataSource')) || dataSourceEnv;
      const isShadowActive = Boolean(import.meta.env.DEV && activeSource === 'shadow');
      const isCanonicalActive = Boolean(import.meta.env.DEV && activeSource === 'canonical');

      if (isCanonicalActive) {
        setLoadingStats(true);
        try {
          const [canonicalRes, cursosRes] = await Promise.all([
            fetch('/api/shadow-data/canonical').then(r => r.json()),
            fetch('/api/shadow-data/cursos').then(r => r.json())
          ]);

          const rawCanonicalUnits = canonicalRes?.dados || [];
          const shadowCursos = cursosRes?.dados || [];

          const canonicalAtivos = rawCanonicalUnits.map((u, idx) => {
            let tipoLabel = 'Ensino Superior Presencial';
            let idTipoAtivo = 101;
            if (u.tipo_unidade === 'ensino_tecnico') {
              tipoLabel = 'Ensino Técnico';
              idTipoAtivo = 102;
            } else if (u.tipo_unidade === 'pesquisa_extensao') {
              tipoLabel = 'Pesquisa e Extensão';
              idTipoAtivo = 103;
            } else if (u.tipo_unidade === 'administrativo') {
              tipoLabel = 'Administrativo';
              idTipoAtivo = 104;
            } else if (u.tipo_unidade === 'ead') {
              tipoLabel = 'Polo EAD';
              idTipoAtivo = 105;
            } else if (u.tipo_unidade === 'ambigua') {
              tipoLabel = 'Ensino Superior (Ambígua)';
              idTipoAtivo = 106;
            } else if (u.tipo_unidade === 'inativa') {
              tipoLabel = 'Inativa';
              idTipoAtivo = 107;
            }

            return {
              ...u,
              id_ativo: u.id_ativo ?? (8000 + idx),
              nome_ativo: u.nome,
              tipo: tipoLabel,
              id_tipo_ativo: idTipoAtivo,
              semiarido: false
            };
          });

          const cursosPres = shadowCursos.filter(c => c.ead === false);
          const cursosEad = shadowCursos.filter(c => c.ead === true);

          let statsData = [];
          try {
            const [sRes, cadeiasRes, lCadeiasRes, mTerRes, fRes] = await Promise.all([
              supabase.from('stats_ti').select('*'),
              supabase.from('distribuicao_cadeias').select('*').range(0, 4999),
              supabase.from('lista_cadeia_produtiva').select('*').range(0, 1000),
              supabase.from('lista_municipioxterritorio').select('*').range(0, 1000),
              supabase.from('firjan').select('*').range(0, 1000)
            ]);
            statsData = sRes.data || [];
            setDistribuicaoCadeias(cadeiasRes.data || []);
            setListaCadeias(lCadeiasRes.data || []);
            setMunicipiosTerritorios(mTerRes.data || []);
            setFirjanData(fRes.data || []);
          } catch (_) {}

          const contagemCursosPres = {};
          cursosPres.forEach(c => {
            if (c.id_territorio) {
              contagemCursosPres[c.id_territorio] = (contagemCursosPres[c.id_territorio] || 0) + 1;
            }
          });

          const contagemAtivosFisicos = {};
          canonicalAtivos.forEach(a => {
            if (a.id_territorio && a.presenca_fisica === true) {
              contagemAtivosFisicos[a.id_territorio] = (contagemAtivosFisicos[a.id_territorio] || 0) + 1;
            }
          });

          const dadosTratados = statsData.map(t => ({
            ...t,
            qtd_ativos: contagemAtivosFisicos[t.id_territorio] || 0,
            qtd_cursos_cti: contagemCursosPres[t.id_territorio] || 0
          }));

          setTerritoriosData(dadosTratados);
          setAtivosData(canonicalAtivos);
          setCursosData(cursosPres);
          setCursosEadData(cursosEad);
          setTiposAtivos([
            { id_tipo_ativo: 101, tipo: 'Ensino Superior Presencial' },
            { id_tipo_ativo: 102, tipo: 'Ensino Técnico' },
            { id_tipo_ativo: 103, tipo: 'Pesquisa e Extensão' },
            { id_tipo_ativo: 104, tipo: 'Administrativo' },
            { id_tipo_ativo: 105, tipo: 'Polo EAD' },
            { id_tipo_ativo: 106, tipo: 'Ensino Superior (Ambígua)' },
            { id_tipo_ativo: 107, tipo: 'Inativa' }
          ]);
          setTiposCursos([
            { id_tipo_curso: 1, categoria: 'Agricultura, silvicultura, pesca e veterinária' },
            { id_tipo_curso: 2, categoria: 'Ciências naturais, matemática e estatística' },
            { id_tipo_curso: 3, categoria: 'Computação e Tecnologias da Informação e Comunicação (TIC)' },
            { id_tipo_curso: 4, categoria: 'Engenharia, produção e construção' },
            { id_tipo_curso: 5, categoria: 'Saúde e bem-estar' }
          ]);
          setLoadingStats(false);
          return;
        } catch (err) {
          console.error('[CANONICAL] Falha ao carregar canonical data:', err);
        }
      }

      if (isShadowActive) {
        setLoadingStats(true);
        try {
          const [campiRes, cursosRes] = await Promise.all([
            fetch('/api/shadow-data/campi').then(r => r.json()),
            fetch('/api/shadow-data/cursos').then(r => r.json())
          ]);

          const shadowCampi = campiRes?.dados || [];
          const shadowCursos = cursosRes?.dados || [];

          const cursosPres = shadowCursos.filter(c => c.ead === false);
          const cursosEad = shadowCursos.filter(c => c.ead === true);

          let statsData = [];
          try {
            const [sRes, cadeiasRes, lCadeiasRes, mTerRes, fRes] = await Promise.all([
              supabase.from('stats_ti').select('*'),
              supabase.from('distribuicao_cadeias').select('*').range(0, 4999),
              supabase.from('lista_cadeia_produtiva').select('*').range(0, 1000),
              supabase.from('lista_municipioxterritorio').select('*').range(0, 1000),
              supabase.from('firjan').select('*').range(0, 1000)
            ]);
            statsData = sRes.data || [];
            setDistribuicaoCadeias(cadeiasRes.data || []);
            setListaCadeias(lCadeiasRes.data || []);
            setMunicipiosTerritorios(mTerRes.data || []);
            setFirjanData(fRes.data || []);
          } catch (_) {}

          const contagemCursosPres = {};
          cursosPres.forEach(c => {
            if (c.id_territorio) {
              contagemCursosPres[c.id_territorio] = (contagemCursosPres[c.id_territorio] || 0) + 1;
            }
          });

          const dadosTratados = statsData.map(t => ({
            ...t,
            qtd_cursos_cti: contagemCursosPres[t.id_territorio] || 0
          }));

          setTerritoriosData(dadosTratados);
          setAtivosData(shadowCampi);
          setCursosData(cursosPres);
          setCursosEadData(cursosEad);
          setTiposAtivos([
            { id_tipo_ativo: 6, tipo: 'Campi Universidade Pública - Federal' },
            { id_tipo_ativo: 7, tipo: 'Campi Instituto Federal' },
            { id_tipo_ativo: 8, tipo: 'Campi Universidade Pública - Estadual' },
            { id_tipo_ativo: 9, tipo: 'Campi Universidade Privada' }
          ]);
          setTiposCursos([
            { id_tipo_curso: 1, categoria: 'Agricultura, silvicultura, pesca e veterinária' },
            { id_tipo_curso: 2, categoria: 'Ciências naturais, matemática e estatística' },
            { id_tipo_curso: 3, categoria: 'Computação e Tecnologias da Informação e Comunicação (TIC)' },
            { id_tipo_curso: 4, categoria: 'Engenharia, produção e construção' },
            { id_tipo_curso: 5, categoria: 'Saúde e bem-estar' }
          ]);
          setLoadingStats(false);
          return;
        } catch (err) {
          console.error('[SHADOW] Falha ao carregar shadow data:', err);
        }
      }

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
        console.error("Erro crítico ao carregar dados do Supabase:", err);
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
 setFiltroSemiarido 
 }}>
 {children}
 </DataContext.Provider>
 );
};