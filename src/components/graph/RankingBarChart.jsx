import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Minus, MapPin } from 'lucide-react';

function normalizeSimple(str) {
    if (!str) return '';
    return String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/^(territorio\s+de\s+identidade|territorio\s+identidade|territorio)\s+/i, '')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Gráfico genérico de Barras Verticais para rankings.
 *
 * Props:
 * @param {Array} data - Array com os dados brutos
 * @param {String} title - Título do Card
 * @param {String} valueKey - Chave da métrica principal (ex: 'media_ifdm', 'pontuacao')
 * @param {String} labelKey - Chave do rótulo da coluna (ex: 'territorio', 'municipio')
 * @param {String} extraKey - Chave da métrica exibida no tooltip (ex: 'cadeias_produtivas')
 * @param {String} extraLabel - Rótulo da métrica no tooltip (ex: 'Cadeias', 'Empresas')
 * @param {String} topSubtitle - Subtítulo no modo 'top'
 * @param {String} mediumSubtitle - Subtítulo no modo 'medium'
 * @param {String} bottomSubtitle - Subtítulo no modo 'bottom'
 * @param {String} highlightLabel - Nome do território selecionado para destacar no ranking
 * @param {Number} maxScale - Escala máxima de porcentagem (Default: 100)
 */
export default function RankingBarChart({
    data = [],
    title = "Ranking",
    valueKey = "value",
    labelKey = "label",
    extraKey = "extra",
    extraLabel = "Unidades",
    topSubtitle = "Top 5 melhores",
    mediumSubtitle = "5 na média",
    bottomSubtitle = "Top 5 menores",
    highlightLabel = null,
    maxScale = 1
}) {
    const [filterMode, setFilterMode] = useState('top');

    // Se um território for selecionado, alterna para foco nele; quando desmarcado, volta para o top
    useEffect(() => {
        if (highlightLabel) {
            setFilterMode('focus');
        } else {
            setFilterMode('top');
        }
    }, [highlightLabel]);

    // Lista ordenada completa com ranks e nomes limpos
    const allRanked = useMemo(() => {
        return [...data]
            .filter(item => item[valueKey] !== null && !isNaN(Number(item[valueKey])))
            .sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]))
            .map((item, index) => {
                const rawName = String(item[labelKey] || '').replace(/^Território de Identidade\s+/i, '').trim();
                return {
                    ...item,
                    rank: index + 1,
                    cleanName: rawName,
                    normName: normalizeSimple(rawName),
                    val: Number(item[valueKey]),
                    extra: Number(item[extraKey] || 0)
                };
            });
    }, [data, valueKey, labelKey, extraKey]);

    // Território selecionado no ranking
    const highlightedItem = useMemo(() => {
        if (!highlightLabel || allRanked.length === 0) return null;
        const normTarget = normalizeSimple(highlightLabel);
        return allRanked.find(item =>
            item.normName === normTarget ||
            item.normName.includes(normTarget) ||
            normTarget.includes(item.normName)
        );
    }, [highlightLabel, allRanked]);

    const subtitle = useMemo(() => {
        if (filterMode === 'focus' && highlightedItem) {
            return `Posição de ${highlightedItem.cleanName} (${highlightedItem.rank}º de ${allRanked.length})`;
        }
        if (filterMode === 'top' || filterMode === 'focus') return topSubtitle;
        if (filterMode === 'medium') return mediumSubtitle;
        return bottomSubtitle;
    }, [filterMode, highlightedItem, allRanked.length, topSubtitle, mediumSubtitle, bottomSubtitle]);

    const processedData = useMemo(() => {
        if (allRanked.length === 0) return [];

        let slice = [];
        if (filterMode === 'focus' && highlightedItem) {
            const targetIdx = allRanked.findIndex(x => x.normName === highlightedItem.normName);
            if (targetIdx !== -1) {
                let start = Math.max(0, targetIdx - 2);
                let end = start + 5;
                if (end > allRanked.length) {
                    end = allRanked.length;
                    start = Math.max(0, end - 5);
                }
                slice = allRanked.slice(start, end);
            } else {
                slice = allRanked.slice(0, 5);
            }
        } else if (filterMode === 'bottom') {
            slice = allRanked.slice(-5).reverse();
        } else if (filterMode === 'medium') {
            const meio = Math.floor(allRanked.length / 2);
            slice = allRanked.slice(Math.max(0, meio - 2), meio + 3);
        } else {
            // Padrão 'top' ou quando desmarcado
            slice = allRanked.slice(0, 5);
        }

        return slice;
    }, [allRanked, filterMode, highlightedItem]);

    return (
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] p-6 relative flex flex-col group cursor-default h-full">

            {/* HEADER + CONTROLES */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-slate-900 font-semibold text-[15px] tracking-tight">{title}</h3>
                        {highlightedItem && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-info-500/15 text-info-600 border border-info-500/30 shrink-0">
                                {highlightedItem.rank}º no Estado
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 font-normal text-[11px] mt-0.5 truncate">{subtitle}</p>
                </div>

                <div className="flex flex-row items-center justify-center gap-[2px] bg-gray-50 border border-gray-100 rounded-[8px] p-1 mr-7 relative z-40 shrink-0">
                    {highlightedItem && (
                        <button
                            onClick={() => setFilterMode('focus')}
                            className={`p-1 rounded transition-all duration-300 flex items-center justify-center ${filterMode === 'focus' ? 'text-info-500 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
                            title={`Foco em ${highlightedItem.cleanName} (${highlightedItem.rank}º de ${allRanked.length})`}
                        >
                            <MapPin size={13} strokeWidth={2.5} />
                        </button>
                    )}
                    <button
                        onClick={() => setFilterMode('top')}
                        className={`p-0.5 rounded transition-all duration-300 ${filterMode === 'top' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
                        title={topSubtitle}
                    >
                        <ChevronUp size={14} strokeWidth={3.5} />
                    </button>
                    <button
                        onClick={() => setFilterMode('medium')}
                        className={`p-0.5 rounded transition-all duration-300 ${filterMode === 'medium' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
                        title={mediumSubtitle}
                    >
                        <Minus size={14} strokeWidth={3.5} />
                    </button>
                    <button
                        onClick={() => setFilterMode('bottom')}
                        className={`p-0.5 rounded transition-all duration-300 ${filterMode === 'bottom' ? 'text-[#4361EE] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]' : 'text-[#A0AEC0] hover:text-[#4A5568]'}`}
                        title={bottomSubtitle}
                    >
                        <ChevronDown size={14} strokeWidth={3.5} />
                    </button>
                </div>
            </div>

            {/* ÁREA DO GRÁFICO */}
            <div className="flex-1 flex items-end justify-between gap-1.5 lg:gap-4 mt-2 px-1 pb-2 relative min-h-[140px]">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-gray-50 pb-6 z-0">
                    <div className="w-full h-px bg-gray-50"></div>
                    <div className="w-full h-px bg-gray-50"></div>
                    <div className="w-full h-px bg-gray-50"></div>
                </div>

                {processedData.map((item, idx) => {
                    const isSelected = highlightedItem && item.normName === highlightedItem.normName;
                    const ratio = maxScale > 1 ? (item.val / maxScale) * 100 : item.val * 100;
                    const barHeightPercent = Math.min(100, Math.max(10, ratio));

                    return (
                        <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end relative z-10 min-w-0 group/col">
                            <div className="flex items-end justify-center w-full h-[80%] relative transition-transform duration-300">
                                <div
                                    className={`w-full max-w-[20px] rounded-lg relative flex justify-center transition-all duration-500 ease-out ${isSelected
                                        ? 'bg-info-500 shadow-[0_0_16px_rgba(0,180,216,0.6)] ring-2 ring-info-500/30'
                                        : 'bg-[#4361EE] group-hover/col:opacity-90 group-hover/col:shadow-[0_0_15px_rgba(67,97,238,0.3)]'
                                        }`}
                                    style={{ height: `${barHeightPercent}%` }}
                                >
                                    <div className={`absolute -top-1 w-2.5 h-2.5 rounded-full border-[2px] border-white transition-opacity duration-300 z-20 shadow-sm flex items-center justify-center ${isSelected ? 'opacity-100 bg-info-500' : 'bg-gray-200 opacity-0 group-hover/col:opacity-100'
                                        }`}>
                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                    </div>

                                    <span className={`absolute -top-6 text-[9px] ${isSelected ? 'text-info-600 font-bold' : 'font-medium text-slate-400'} group-hover/col:opacity-0 transition-opacity whitespace-nowrap`}>
                                        {item.val < 1 && item.val > 0 ? item.val.toFixed(3) : item.val}
                                    </span>

                                    {/* TOOLTIP FLUTUANTE */}
                                    <div className="absolute bottom-[calc(100%+14px)] bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2 flex flex-col justify-center opacity-0 group-hover/col:opacity-100 transition-all duration-300 pointer-events-none z-30 translate-y-2 group-hover/col:translate-y-0 min-w-[110px] left-1/2 -translate-x-1/2 ">
                                        <div className="text-[10px] font-semibold text-slate-900 mb-0.5 leading-tight">{item.rank}º · {item.cleanName}</div>
                                        <div className="flex items-center text-[10px] text-slate-600">
                                            <span>IFDM: <strong className="text-slate-900 font-medium">{item.val.toFixed(3)}</strong></span>
                                        </div>
                                        {item.extra > 0 && (
                                            <div className="flex items-center text-[9.5px] text-slate-500 mt-0.5">
                                                <span>{item.extra} {extraLabel}</span>
                                            </div>
                                        )}
                                        <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-slate-200 rotate-45 rounded-sm"></div>
                                    </div>
                                </div>
                            </div>

                            {/* RÓTULO INFERIOR */}
                            <div
                                className={`text-[9px] text-center leading-tight truncate w-full transition-colors mt-2 px-0.5 ${isSelected ? 'font-bold text-info-600' : 'font-normal text-slate-500 group-hover/col:text-slate-900'
                                    }`}
                                title={`${item.rank}º ${item.cleanName}`}
                            >
                                {isSelected ? `${item.cleanName}` : item.cleanName}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}