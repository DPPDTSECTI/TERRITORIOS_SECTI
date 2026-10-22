import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';
import { formatInt, formatDecimal, formatPercent, formatCompact } from '../../lib/format';
import { KpiSkeleton } from './Skeleton';

/**
 * Componente que interpola numericamente de 0 até o valor alvo com suporte a formatação pt-BR e reduced motion.
 *
 * @component
 * @param {object} props
 * @param {number|string} props.value - Valor numérico alvo
 * @param {'int'|'decimal'|'percent'|'compact'|'raw'} [props.format='int'] - Formato numérico
 * @param {number} [props.duration=600] - Duração da animação em milissegundos
 * @param {string} [props.className] - Classes customizadas
 */
export function AnimatedNumber({
  value,
  format = 'int',
  duration = 600,
  className,
}) {
  const isPureNumber = typeof value === 'number' || (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim()));
  const numericTarget = isPureNumber ? Number(value) : NaN;
  const isInvalid = Number.isNaN(numericTarget);

  const [current, setCurrent] = useState(() => (isInvalid ? value : 0));
  const startTimeRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (isInvalid) {
      setCurrent(value);
      return;
    }

    // Respeita preferência do usuário de movimento reduzido
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || duration <= 0) {
      setCurrent(numericTarget);
      return;
    }

    const startVal = 0;
    startTimeRef.current = null;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Easing cúbico suave
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const val = startVal + (numericTarget - startVal) * easeProgress;

      setCurrent(val);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(numericTarget);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [numericTarget, isInvalid, duration, value]);

  if (isInvalid) {
    return <span className={cn('tnum', className)}>{value ?? '—'}</span>;
  }

  const formatNumber = (num) => {
    switch (format) {
      case 'decimal':
        return formatDecimal(num, 1);
      case 'percent':
        return formatPercent(num, 1);
      case 'compact':
        return formatCompact(num);
      case 'raw':
        return String(Math.round(num));
      case 'int':
      default:
        return formatInt(num);
    }
  };

  return <span className={cn('tnum', className)}>{formatNumber(current)}</span>;
}

/**
 * Card de destaque para indicadores-chave de desempenho (KPIs).
 *
 * @component
 * @param {object} props
 * @param {string} props.label - Rótulo do KPI
 * @param {number|string|React.ReactNode} props.value - Valor da métrica
 * @param {React.ElementType|React.ReactNode} [props.icon] - Ícone ilustrativo
 * @param {React.ReactNode} [props.hint] - Informação complementar ou rodapé do card
 * @param {React.ReactNode} [props.delta] - Variação percentual ou badge de tendência
 * @param {'default'|'brand'} [props.variant='default'] - Variante visual do card
 * @param {'int'|'decimal'|'percent'|'compact'|'raw'} [props.format='int'] - Formatação do valor se for numérico
 * @param {boolean} [props.loading=false] - Indica estado de carregamento exibindo skeleton
 * @param {string} [props.className] - Classes CSS customizadas
 */
export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  variant = 'default',
  format = 'int',
  loading = false,
  className,
}) {
  if (loading) {
    return <KpiSkeleton className={className} />;
  }

  const isBrand = variant === 'brand';

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div
      className={cn(
        'p-5 rounded-card flex flex-col justify-between gap-3 border transition-colors duration-200 select-none',
        isBrand
          ? 'bg-gradient-brand text-white border-primary-500/40'
          : 'bg-surface-soft text-text-primary border-border/70',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            'text-body-sm font-medium line-clamp-1',
            isBrand ? 'text-white/85' : 'text-text-secondary'
          )}
        >
          {label}
        </span>

        {Icon && (
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs',
              isBrand
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-surface text-text-secondary border border-border/80'
            )}
          >
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <div className={cn(
          'text-[30px] font-bold leading-none tracking-tight',
          isBrand ? 'text-white' : 'text-text-primary'
        )}>
          {typeof value === 'number' || (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())) ? (
            <AnimatedNumber value={value} format={format} />
          ) : (
            <span className="tnum">{value}</span>
          )}
        </div>

        {delta && <div className="inline-flex shrink-0">{delta}</div>}
      </div>

      {hint && (
        <div
          className={cn(
            'text-caption leading-tight',
            isBrand ? 'text-white/75' : 'text-text-muted'
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export default KpiCard;
