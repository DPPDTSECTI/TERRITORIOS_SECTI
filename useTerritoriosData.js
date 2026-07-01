import { useState, useEffect, useMemo } from 'react';
import territoriosMunicipios from './utils/territorioMunicipios.json';

// Otimização: Memoiza a função de normalização para evitar recalcular strings repetidamente.
const normalize = (() => {
    const cache = new Map();
    const CACHE_LIMIT = 2000; // Limite para evitar consumo excessivo de memória

    return (value) => {
        const strValue = String(value || '');
        if (cache.has(strValue)) {
            return cache.get(strValue);
        }
        const result = strValue.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cache.size > CACHE_LIMIT) {
            cache.delete(cache.keys().next().value); // Remove o item mais antigo
        }
        cache.set(strValue, result);
        return result;
    };
})();

export default function useTerritoriosData(filters) {
    const {
        selectedLocation,
        filtroSemiarido,
        debouncedSearchTerm,
        ifdmMin,
        ifdmMax,
        ctiFilters,
        areaGeralFilter,
        debouncedCursoSearchTerm,
    } = filters;

    const [territoriosData, setTerritoriosData] = useState([]);
    const [globalStats, setGlobalStats] = useState({ totalBahia: 417, totalSemiarido: 0, pctGlobalSemiarido: 0 });
    const [semiaridoMunicipios, setSemiaridoMunicipios] = useState([]);
    const [isLoadingPipeline, setIsLoadingPipeline] = useState(true);
    const [lastUpdate, setLastUpdate] = useState("Atualizando...");

    const carregarDadosDoSharePoint = async (forcarRefresh = false) => {
        setIsLoadingPipeline(true);
        try {
            const isDev = import.meta.env.DEV;
            let url = isDev ? (forcarRefresh ? '/api/sharepoint?nocache=true' : '/api/sharepoint') : '/dados.json';
            let response = await fetch(url);
            if (!response.ok && !isDev) response = await fetch('/api/sharepoint');
            if (!response.ok) throw new Error('Falha ao comunicar com a base de dados');

            const data = await response.json();
            const semiaridoNormList = (data.semiaridoMunicipiosList || []).map(m => normalize(m));

            const territoriosFormatados = data.territories.map((t, index) => {
                const territorioBase = territoriosMunicipios.territorios_de_identidade.find((tb) => normalize(tb.nome) === normalize(t.territory));
                let trueQtdSemi = 0;
                if (territorioBase) {
                    territorioBase.municipios.forEach(m => { if (semiaridoNormList.includes(normalize(m))) trueQtdSemi++; });
                }
                const trueTotalMuns = territorioBase ? territorioBase.municipios.length : 0;
                const truePctSemiarido = trueTotalMuns > 0 ? (trueQtdSemi / trueTotalMuns) * 100 : 0;
                const trueIsSemiarido = trueQtdSemi > 0;
                const entidadesCTI = Array.isArray(t.capacidadeDetalhada) ? t.capacidadeDetalhada : [];
                const cadeiasAPL = Array.isArray(t.cadeiasProdutivasDetalhado) ? t.cadeiasProdutivasDetalhado : [];
                const cursosEnsino = Array.isArray(t.cursosDetalhado) ? t.cursosDetalhado : [];

                return {
                    id: String(index + 1), nome: t.territory || "Desconhecido", tipo: 'Território', regiao: t.territory || "",
                    isSemiarido: trueIsSemiarido, pctSemiarido: truePctSemiarido, qtdSemiarido: trueQtdSemi,
                    entidadesDetalhadas: entidadesCTI, cadeiasProdutivasDetalhado: cadeiasAPL,
                    desenvolvimentoDetalhado: Array.isArray(t.desenvolvimentoDetalhado) ? t.desenvolvimentoDetalhado : [],
                    cursosDetalhado: cursosEnsino,
                    assistenciaPublica: t.assistenciaPublica || { iniciativas: [] },
                    desenvolvimento: t.desenvolvimento || { ifdmTi: 0, populacaoTotal: 0 },
                    kpis: {
                        capacidadeCti: String(entidadesCTI.length), ifdm: t.desenvolvimento?.ifdmTi ? Number(t.desenvolvimento.ifdmTi).toFixed(3) : "-",
                        conectaBahia: t.assistenciaPublica?.existe ? "Presente" : "Não mapeado", cadeiasIgs: String(cadeiasAPL.length),
                        coberturaSemiarido: trueIsSemiarido ? (truePctSemiarido >= 100 ? "Pertencente" : "") : "Exterior"
                    }
                };
            });

            setTerritoriosData(territoriosFormatados);
            setGlobalStats(data.globalStats || { totalBahia: 417, totalSemiarido: 0, pctGlobalSemiarido: 0 });
            setSemiaridoMunicipios(semiaridoNormList);
            setLastUpdate(new Date(data.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        } catch (error) {
            console.error("[Painel] Erro fatal:", error); setLastUpdate("Erro na Sincronização");
        } finally { setIsLoadingPipeline(false); }
    };

    useEffect(() => { carregarDadosDoSharePoint(); }, []);

    const isMunValid = (munName) => {
        if (!munName) return false;
        if (filtroSemiarido && !semiaridoMunicipios.includes(normalize(munName))) return false;
        return true;
    };

    const filteredOptions = useMemo(() => {
        const rawTerm = normalize(debouncedSearchTerm); const terms = rawTerm.split(' ').filter(Boolean);
        const results = [];
        territoriosData.forEach(t => {
            if (filtroSemiarido && !t.isSemiarido) return;

            const ifdmVal = t.desenvolvimento?.ifdmTi ? Number(Number(t.desenvolvimento.ifdmTi).toFixed(3)) : 0;
            if (ifdmMin !== '' && ifdmVal < Number(ifdmMin)) return;
            if (ifdmMax !== '' && ifdmVal > Number(ifdmMax)) return;

            if (!rawTerm) { results.push({ ...t, matchType: 'Território', matchText: t.regiao }); return; }

            let matched = false; let foundMunMatch = null; let foundEntMatch = null; let foundCadeiaMatch = null; let foundCursoMatch = null;
            const territorioBase = territoriosMunicipios.territorios_de_identidade.find((tb) => normalize(tb.nome) === normalize(t.nome));

            if (territorioBase) {
                const foundMun = territorioBase.municipios.find(m => {
                    const searchString = normalize(m);
                    return terms.every(term => searchString.includes(term));
                });
                if (foundMun && isMunValid(foundMun)) { matched = true; foundMunMatch = foundMun; }
            }
            if (!matched && t.entidadesDetalhadas) {
                foundEntMatch = t.entidadesDetalhadas.find(ent => {
                    if (!isMunValid(ent.municipio) || (ent.categoria && !ctiFilters[ent.categoria])) return false;
                    const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)}`;
                    return terms.every(term => searchString.includes(term));
                });
                if (foundEntMatch) matched = true;
            }
            if (!matched && t.cadeiasProdutivasDetalhado) {
                foundCadeiaMatch = t.cadeiasProdutivasDetalhado.find(cad => {
                    if (!isMunValid(cad.sede || cad.municipioSatelite)) return false;
                    const searchString = `${normalize(cad.segmento)} ${normalize(cad.sede || '')} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')}`;
                    return terms.every(term => searchString.includes(term));
                });
                if (foundCadeiaMatch) matched = true;
            }
            if (!matched && t.cursosDetalhado) {
                foundCursoMatch = t.cursosDetalhado.find(curso => {
                    if (!isMunValid(curso.municipio)) return false;
                    const searchString = `${normalize(curso.curso)} ${normalize(curso.entidade)} ${normalize(curso.municipio)}`;
                    return terms.every(term => searchString.includes(term));
                });
                if (foundCursoMatch) matched = true;
            }

            if (foundMunMatch) results.push({ ...t, matchType: 'Município', matchText: foundMunMatch });
            else if (foundEntMatch) results.push({ ...t, matchType: terms.some(term => normalize(foundEntMatch.tipo).includes(term)) ? 'Tipo de Infraestrutura' : 'Entidade CT&I', matchText: foundEntMatch.entidade });
            else if (foundCadeiaMatch) results.push({ ...t, matchType: 'Cadeia Produtiva', matchText: foundCadeiaMatch.segmento });
            else if (foundCursoMatch) results.push({ ...t, matchType: 'Curso Superior', matchText: foundCursoMatch.curso });
            else if (terms.every(term => normalize(t.nome).includes(term))) results.push({ ...t, matchType: 'Território', matchText: t.regiao });
        });
        return results.sort((a, b) => a.nome.localeCompare(b.nome));
    }, [debouncedSearchTerm, territoriosData, filtroSemiarido, semiaridoMunicipios, ifdmMin, ifdmMax, ctiFilters]);

    const territoriesDynamicStats = useMemo(() => {
        const stats = {}; const rawTerm = normalize(debouncedSearchTerm); const terms = rawTerm.split(' ').filter(Boolean);
        const cursoTerm = normalize(debouncedCursoSearchTerm);
        const isSearchTermATerritory = territoriosData.some(t => normalize(t.nome) === rawTerm);

        const isCtiFiltered = Object.values(ctiFilters).some(v => !v);
        const isCursoFiltered = cursoTerm !== '' || areaGeralFilter.length > 0;

        territoriosData.forEach(t => {
            const ifdmVal = t.desenvolvimento?.ifdmTi ? Number(Number(t.desenvolvimento.ifdmTi).toFixed(3)) : 0;

            let passesIntervals = true;
            if (ifdmMin !== '' && ifdmVal < Number(ifdmMin)) passesIntervals = false;
            if (ifdmMax !== '' && ifdmVal > Number(ifdmMax)) passesIntervals = false;

            let somaIfdmPop = 0; let somaPop = 0;
            if (t.desenvolvimentoDetalhado && t.desenvolvimentoDetalhado.length > 0) {
                t.desenvolvimentoDetalhado.forEach(m => {
                    if (isMunValid(m.municipio)) {
                        if (Number(m.ifdm) > 0 && Number(m.populacao) > 0) { somaIfdmPop += (Number(m.ifdm) * Number(m.populacao)); somaPop += Number(m.populacao); }
                    }
                });
            } else if (!filtroSemiarido && t.desenvolvimento?.ifdmTi) {
                somaIfdmPop = t.desenvolvimento.ifdmTi * t.desenvolvimento.populacaoTotal; somaPop = t.desenvolvimento.populacaoTotal;
            }

            const validCti = t.entidadesDetalhadas.filter(ent => {
                if (!isMunValid(ent.municipio) || (ent.categoria && !ctiFilters[ent.categoria])) return false;
                if (rawTerm && !isSearchTermATerritory) {
                    const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)}`;
                    if (!terms.every(term => searchString.includes(term))) return false;
                }
                return true;
            });
            const validCadeias = t.cadeiasProdutivasDetalhado.filter(cad => {
                if (!isMunValid(cad.sede || cad.municipioSatelite)) return false;
                if (rawTerm && !isSearchTermATerritory) {
                    const searchString = `${normalize(cad.segmento)} ${normalize(cad.sede || '')} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')}`;
                    if (!terms.every(term => searchString.includes(term))) return false;
                }
                return true;
            });
            const validCursos = (t.cursosDetalhado || []).filter(curso => {
                if (!isMunValid(curso.municipio)) return false;
                if (rawTerm && !isSearchTermATerritory) {
                    const searchString = `${normalize(curso.curso)} ${normalize(curso.entidade)} ${normalize(curso.areaGeral)} ${normalize(curso.municipio)}`;
                    if (!terms.every(term => searchString.includes(term))) return false;
                }
                if (cursoTerm && !normalize(curso.curso).includes(cursoTerm)) return false;
                if (areaGeralFilter.length > 0 && !areaGeralFilter.includes(curso.areaGeral || 'Não Informada')) return false;

                const tipoNorm = normalize(`${curso.orgAcademica} ${curso.categoriaAdm} ${curso.entidade}`);
                let catCurso = null;
                if (['instituto federal', 'ifba', 'ifbaiano'].some(c => tipoNorm.includes(c))) catCurso = 'ifs';
                else if (['universidade', 'faculdade', 'centro', 'superior'].some(c => tipoNorm.includes(c))) catCurso = 'univs';
                if (catCurso && !ctiFilters[catCurso]) return false;

                return true;
            });

            let matchesSearch = true;
            if (rawTerm) {
                const territorioBase = territoriosMunicipios.territorios_de_identidade.find(tb => normalize(tb.nome) === normalize(t.nome));
                const tMatches = terms.every(term => normalize(t.nome).includes(term));
                const mMatches = territorioBase && territorioBase.municipios.some(m => terms.every(term => normalize(m).includes(term)));
                matchesSearch = tMatches || mMatches || (!isSearchTermATerritory && (validCti.length > 0 || validCadeias.length > 0 || validCursos.length > 0));
            }

            let hasDataForFilters = true;
            if (isCtiFiltered && isCursoFiltered) {
                hasDataForFilters = validCti.length > 0 || validCursos.length > 0;
            } else if (isCtiFiltered) {
                hasDataForFilters = validCti.length > 0;
            } else if (isCursoFiltered) {
                hasDataForFilters = validCursos.length > 0;
            }

            const matchesFilters = passesIntervals && matchesSearch && hasDataForFilters;

            stats[normalize(t.nome)] = {
                ifdm: somaPop > 0 ? (somaIfdmPop / somaPop).toFixed(3) : "-",
                capacidadeCti: String(validCti.length), cadeiasIgs: String(validCadeias.length),
                pctSemiarido: t.pctSemiarido,
                matchesFilters: matchesFilters
            };
        });
        return stats;
    }, [territoriosData, filtroSemiarido, debouncedSearchTerm, semiaridoMunicipios, ifdmMin, ifdmMax, ctiFilters, areaGeralFilter, debouncedCursoSearchTerm]);

    const dashboardData = useMemo(() => {
        let targetList = selectedLocation ? [selectedLocation] : territoriosData;
        const rawTerm = normalize(debouncedSearchTerm); const terms = rawTerm.split(' ').filter(Boolean);
        const isSearchTermATerritory = territoriosData.some(t => normalize(t.nome) === rawTerm);

        const kpisPanel = { univs: 0, ifs: 0, icts: 0, centrosPesquisa: 0, espacos: 0, parques: 0, incubadoras: 0 };
        const entidadesFlat = []; const aplIgsFlat = []; const cursosFlat = [];
        const globalIds = new Set(); const globalCadeiasIds = new Set();
        let somaIfdmPop = 0; let somaPopulacao = 0;

        const unfiltKpisPanel = { univs: 0, ifs: 0, icts: 0, centrosPesquisa: 0, espacos: 0, parques: 0, incubadoras: 0 };
        const unfiltIds = new Set(); const unfiltCadeiasIds = new Set();
        let unfiltAsst = 0; let unfiltCursos = 0;
        let totalAssistencia = 0;

        const extrairSatelite = (cad) => {
            const val = cad.municipioSatelite || cad.municipiosSatelites || cad.satelite || cad.municipio_satelite || cad.municipios_satelites || cad.Satelite || cad.Satelites;
            if (!val || val === 'undefined' || val === 'null') return '';
            if (Array.isArray(val)) {
                return val.map(item => typeof item === 'object' ? (item.Title || item.nome || item.NOME || item.value || '') : item).filter(Boolean).join(', ').trim();
            }
            if (typeof val === 'object') return val.Title || val.nome || val.NOME || val.value || '';
            return String(val).trim();
        };

        targetList.forEach(t => {
            const ifdmVal = t.desenvolvimento?.ifdmTi ? Number(Number(t.desenvolvimento.ifdmTi).toFixed(3)) : 0;
            if (ifdmMin !== '' && ifdmVal < Number(ifdmMin)) return;
            if (ifdmMax !== '' && ifdmVal > Number(ifdmMax)) return;

            t.entidadesDetalhadas.forEach(ent => {
                if (!ent.municipio) return;
                if (rawTerm && !isSearchTermATerritory) {
                    const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)}`;
                    if (!terms.every(term => searchString.includes(term))) return;
                }
                if (ent.id) {
                    unfiltIds.add(ent.id);
                    if (ent.categoria && unfiltKpisPanel[ent.categoria] !== undefined) unfiltKpisPanel[ent.categoria]++;
                }
            });

            t.cadeiasProdutivasDetalhado.forEach(cad => {
                const sateliteRobusto = extrairSatelite(cad);
                const sede = cad.sede || sateliteRobusto || 'Não informada';
                if (rawTerm && !isSearchTermATerritory) {
                    const searchString = `${normalize(cad.segmento)} ${normalize(sede)} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')}`;
                    if (!terms.every(term => searchString.includes(term))) return;
                }
                if (cad.id) unfiltCadeiasIds.add(cad.id);
            });

            (t.cursosDetalhado || []).forEach(curso => {
                if (rawTerm && !isSearchTermATerritory) {
                    const searchString = `${normalize(curso.curso)} ${normalize(curso.entidade)} ${normalize(curso.municipio)}`;
                    if (!terms.every(term => searchString.includes(term))) return;
                }
                unfiltCursos++;
            });

            if (t.assistenciaPublica?.existe) unfiltAsst++;
            if (filtroSemiarido && !t.isSemiarido) return;
            if (t.assistenciaPublica?.existe) totalAssistencia++;

            t.entidadesDetalhadas.forEach(ent => {
                if (!isMunValid(ent.municipio)) return;
                if (rawTerm && !isSearchTermATerritory) {
                    const searchString = `${normalize(ent.entidade)} ${normalize(ent.tipo)} ${normalize(ent.municipio)}`;
                    if (!terms.every(term => searchString.includes(term))) return;
                }
                if (ent.categoria && !ctiFilters[ent.categoria]) return;
                entidadesFlat.push({ ...ent, territorioRef: t.nome });
                if (ent.id && !globalIds.has(ent.id)) {
                    globalIds.add(ent.id); if (ent.categoria && kpisPanel[ent.categoria] !== undefined) kpisPanel[ent.categoria]++;
                }
            });

            t.cadeiasProdutivasDetalhado.forEach(cad => {
                // A filtragem de cadeias produtivas agora é independente dos filtros de CTI/IFDM.
                // Ela só considera a localização (filtro semiarido) e o termo de busca.
                const sateliteRobusto = extrairSatelite(cad);
                const sede = cad.sede || sateliteRobusto || 'Não informada';
                const perts = filtroSemiarido ? String(cad.municipiosPertencentes || '').split(/[,;\-]/).map(m => m.trim()).filter(m => isMunValid(m)) : String(cad.municipiosPertencentes || '').split(/[,;\-]/).map(m => m.trim()).filter(Boolean);
                
                // 1. Filtro Geográfico (Semiárido)
                if (filtroSemiarido && !isMunValid(sede) && perts.length === 0) return;
                // 2. Filtro de Busca (Deep Search)
                if (rawTerm) {
                    const searchString = `${normalize(cad.segmento)} ${normalize(sede)} ${normalize(cad.entidade || '')} ${normalize(cad.tipo || '')}`;
                    if (!terms.every(term => searchString.includes(term))) return;
                }
                aplIgsFlat.push({
                    id: cad.id || Math.random(), segmento: cad.segmento || 'Sem Segmento', entidade: cad.entidade, tipo: cad.tipo || 'N/A',
                    municipiosPertencentes: perts.join(', ') || sede, sede, territorioRef: t.nome, municipioSatelite: sateliteRobusto
                });
                if (cad.id) globalCadeiasIds.add(cad.id);
            });

            (t.cursosDetalhado || []).forEach(curso => {
                if (!isMunValid(curso.municipio)) return;
                if (rawTerm && !isSearchTermATerritory) {
                    const searchString = `${normalize(curso.curso)} ${normalize(curso.entidade)} ${normalize(curso.municipio)}`;
                    if (!terms.every(term => searchString.includes(term))) return;
                }
                const tipoNorm = normalize(`${curso.orgAcademica} ${curso.categoriaAdm} ${curso.entidade}`);
                let catCurso = null;
                if (['instituto federal', 'ifba', 'ifbaiano'].some(c => tipoNorm.includes(c))) catCurso = 'ifs';
                else if (['universidade', 'faculdade', 'centro', 'superior'].some(c => tipoNorm.includes(c))) catCurso = 'univs';
                if (catCurso && !ctiFilters[catCurso]) return;
                cursosFlat.push({ ...curso, territorioRef: t.nome });
            });

            if (t.desenvolvimentoDetalhado && t.desenvolvimentoDetalhado.length > 0) {
                t.desenvolvimentoDetalhado.forEach(m => {
                    if (isMunValid(m.municipio) && Number(m.ifdm) > 0) { somaIfdmPop += (Number(m.ifdm) * Number(m.populacao)); somaPopulacao += Number(m.populacao); }
                });
            } else if (!filtroSemiarido && t.desenvolvimento?.ifdmTi) {
                somaIfdmPop += (t.desenvolvimento.ifdmTi * t.desenvolvimento.populacaoTotal); somaPopulacao += t.desenvolvimento.populacaoTotal;
            }
        });

        const ifdmValue = somaPopulacao > 0 ? (somaIfdmPop / somaPopulacao) : 0;
        let coberturaCalculada = "";
        let pctBarraSemi = 0;

        if (selectedLocation) {
            const tb = territoriosMunicipios.territorios_de_identidade.find(x => normalize(x.nome) === normalize(selectedLocation.nome));
            const totalMunTerr = tb ? tb.municipios.length : 0;
            const qtdSemiTerr = selectedLocation.qtdSemiarido || 0;
            const pctTerr = totalMunTerr > 0 ? (qtdSemiTerr / totalMunTerr) * 100 : 0;
            pctBarraSemi = pctTerr;
            coberturaCalculada = filtroSemiarido ? `${qtdSemiTerr}/${totalMunTerr} mun.` : `${pctTerr.toFixed(1)}% (${qtdSemiTerr} mun.)`;
        } else {
            pctBarraSemi = globalStats.pctGlobalSemiarido;
            coberturaCalculada = filtroSemiarido ? `${globalStats.totalSemiarido}/${globalStats.totalBahia} mun.` : `${globalStats.pctGlobalSemiarido.toFixed(1)}% (${globalStats.totalSemiarido} mun.)`;
        }

        const topKpisPct = {
            cti: unfiltIds.size > 0 ? (globalIds.size / unfiltIds.size) * 100 : 0,
            ifdm: ifdmValue * 100,
            semiarido: pctBarraSemi,
            assistencia: unfiltAsst > 0 ? (totalAssistencia / unfiltAsst) * 100 : 0,
            cadeias: unfiltCadeiasIds.size > 0 ? (globalCadeiasIds.size / unfiltCadeiasIds.size) * 100 : 0,
            cursos: unfiltCursos > 0 ? (cursosFlat.length / unfiltCursos) * 100 : 0
        };

        return {
            topKpis: {
                capacidadeCti: String(globalIds.size), ifdm: somaPopulacao > 0 ? ifdmValue.toFixed(3) : "-",
                conectaBahia: (selectedLocation || filtroSemiarido) ? "Em levantamento" : `${totalAssistencia} Territórios`,
                cadeiasIgs: String(globalCadeiasIds.size),
                coberturaSemiarido: coberturaCalculada,
                cursos: String(cursosFlat.length)
            },
            topKpisPct, subKpis: kpisPanel, unfiltSubKpis: unfiltKpisPanel,
            entidades: Array.from(new Map(entidadesFlat.map(item => [item.id, item])).values()).sort((a, b) => (a.municipio || "").localeCompare(b.municipio || "")),
            aplIgs: Array.from(new Map(aplIgsFlat.map(item => [item.id, item])).values()).sort((a, b) => (a.segmento || "").localeCompare(b.segmento || "")),
            cursos: Array.from(new Map(cursosFlat.map(item => [item.id || Math.random(), item])).values()).sort((a, b) => (a.curso || "").localeCompare(b.curso || ""))
        };
    }, [selectedLocation, filtroSemiarido, territoriosData, semiaridoMunicipios, debouncedSearchTerm, ifdmMin, ifdmMax, ctiFilters, globalStats]);

    return {
        territoriosData,
        globalStats,
        semiaridoMunicipios,
        isLoadingPipeline,
        lastUpdate,
        carregarDadosDoSharePoint,
        filteredOptions,
        territoriesDynamicStats,
        dashboardData,
    };
}