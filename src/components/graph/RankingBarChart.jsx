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
 * @param {String} badge - Texto do badge de destaque
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
    maxScale = 1,
    badge = null,
    isSemiarido = false,
    cardClassName = ''
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
        <div className={`flex-1 bg-surface rounded-xl border border-border shadow-sm transition-all duration-500 hover:shadow-card-elevated p-6 relative flex flex-col group cursor-default h-full ${cardClassName}`}>

            {/* HEADER + CONTROLES */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-text-primary font-semibold text-[15px] tracking-tight">{title}</h3>
                        {badge && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                {badge}
                            </span>
                        )}
                        {highlightedItem && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary-100 text-primary-700 border border-primary-200 shrink-0 inline-flex items-center justify-center leading-none">
                                {highlightedItem.rank}º no Estado
                            </span>
                        )}
                    </div>
                    <p className="text-text-muted font-normal text-[11px] mt-0.5 truncate">{subtitle}</p>
                </div>

                <div className="flex flex-row items-center justify-center gap-[2px] bg-surface-soft border border-border rounded-[8px] p-1 mr-7 relative z-40 shrink-0">
                    {highlightedItem && (
                        <button
                            onClick={() => setFilterMode('focus')}
                            className={`p-1 rounded transition-colors duration-200 flex items-center justify-center ${filterMode === 'focus' ? 'text-primary-600 bg-surface shadow-xs' : 'text-text-muted hover:text-text-primary'}`}
                            title={`Foco em ${highlightedItem.cleanName} (${highlightedItem.rank}º de ${allRanked.length})`}
                        >
                            <MapPin size={16} strokeWidth={2} />
                        </button>
                    )}
                    <button
                        onClick={() => setFilterMode('top')}
                        className={`p-0.5 rounded transition-colors duration-200 ${filterMode === 'top' ? 'text-primary-600 bg-surface shadow-xs' : 'text-text-muted hover:text-text-primary'}`}
                        title={topSubtitle}
                    >
                        <ChevronUp size={16} strokeWidth={2} />
                    </button>
                    <button
                        onClick={() => setFilterMode('medium')}
                        className={`p-0.5 rounded transition-colors duration-200 ${filterMode === 'medium' ? 'text-primary-600 bg-surface shadow-xs' : 'text-text-muted hover:text-text-primary'}`}
                        title={mediumSubtitle}
                    >
                        <Minus size={16} strokeWidth={2} />
                    </button>
                    <button
                        onClick={() => setFilterMode('bottom')}
                        className={`p-0.5 rounded transition-colors duration-200 ${filterMode === 'bottom' ? 'text-primary-600 bg-surface shadow-xs' : 'text-text-muted hover:text-text-primary'}`}
                        title={bottomSubtitle}
                    >
                        <ChevronDown size={16} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* ÁREA DO GRÁFICO (BARRAS HORIZONTAIS) */}
            <div className="flex-1 flex flex-col justify-center gap-5 w-full my-auto py-1">
                {processedData.map((item, idx) => {
                    const isSelected = highlightedItem && item.normName === highlightedItem.normName;
                    const maxVal = Math.max(...processedData.map(d => Number(d.val) || 0), 0.001);
                    const val = Number(item.val) || 0;
                    const percentOfMax = Math.min(100, Math.round((val / maxVal) * 100));
                    const rankNum = item.rank || idx + 1;
                    const rankStr = String(rankNum).padStart(2, '0');
                    const isFirst = idx === 0 && (filterMode === 'top' || filterMode === 'focus');
                    const isSemi = isSemiarido || !!badge;

                    // Rank badge style
                    const rankStyle = isFirst
                        ? (isSemi ? 'bg-amber-600 text-white shadow-2xs' : 'bg-primary-500 text-white shadow-2xs')
                        : isSelected
                            ? 'bg-primary-700 text-white shadow-2xs'
                            : (isSemi ? 'bg-amber-500/15 text-amber-800 border border-amber-500/25' : 'bg-primary-100 text-primary-700 border border-primary-200/50');

                    // Bar fill color
                    const fillColor = isFirst
                        ? (isSemi ? 'bg-amber-600' : 'bg-primary-500')
                        : isSelected
                            ? 'bg-primary-400'
                            : (isSemi ? 'bg-amber-500/15' : 'bg-primary-200');

                    // Label text style inside the bar
                    const textStyle = isFirst
                        ? 'font-medium text-white'
                        : (isSemi ? 'font-medium text-amber-950' : 'font-medium text-primary-950');

                    // Value pill style
                    const valueStyle = isFirst
                        ? (isSemi ? 'bg-amber-500/15 text-amber-800 border border-amber-500/25' : 'bg-primary-50 text-primary-800 border border-primary-200/70')
                        : (isSemi ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20' : 'bg-primary-50 text-primary-700 border border-primary-200/50');

                    const formattedVal = val < 1 && val > 0 ? val.toFixed(3).replace('.', ',') : String(val);

                    return (
                        <div
                            key={idx}
                            className={`group/row relative flex items-center gap-2 w-full min-w-0 transition-opacity duration-200 hover:opacity-90 cursor-default ${
                                isSelected ? 'ring-1 ring-primary-400/80 rounded-full p-0.5 -m-0.5' : ''
                            }`}
                        >
                            {/* RANK */}
                            <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold tabular-nums leading-none ${rankStyle}`}>
                                {rankStr}
                            </div>

                            {/* BARRA: TRACK + FILL + NOME */}
                            <div className="relative flex-1 h-[24px] rounded-full bg-primary-50/50 overflow-hidden min-w-0 flex items-center">
                                {/* Fill proporcional */}
                                <div
                                    className={`absolute left-0 top-0 bottom-0 rounded-full ${fillColor} transition-all duration-500 ease-out overflow-hidden z-0 flex items-center`}
                                    style={{ width: `${percentOfMax}%` }}
                                />

                                {/* Nome perfeitamente integrado à barra */}
                                <span className={`absolute left-2.5 right-2.5 text-[11.5px] truncate leading-none pointer-events-none select-none z-10 ${textStyle}`}>
                                    {item.cleanName}
                                </span>
                            </div>

                            {/* VALOR PILL */}
                            <div className={`h-[24px] min-w-[50px] px-2 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold tabular-nums leading-none ${valueStyle}`}>
                                {formattedVal}
                            </div>

                            {/* TOOLTIP FLUTUANTE */}
                            <div className="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 bg-surface border border-border shadow-card-hover rounded-lg px-3 py-1.5 flex flex-col justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 pointer-events-none z-30 min-w-[125px]">
                                <div className="text-[10px] font-semibold text-text-primary mb-0.5 leading-tight">
                                    {item.rank}º · {item.cleanName}
                                </div>
                                <div className="flex items-center text-[10px] text-text-secondary">
                                    <span>IFDM: <strong className="text-text-primary font-medium">{formattedVal}</strong></span>
                                </div>
                                {item.extra > 0 && (
                                    <div className="flex items-center text-[10px] text-text-muted mt-0.5">
                                        <span>{item.extra} {extraLabel}</span>
                                    </div>
                                )}
                                <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-surface border-b border-r border-border rotate-45 rounded-xs"></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}