import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Elemento base de Skeleton para estados de carregamento.
 *
 * @component
 * @param {object} props
 * @param {string} [props.className] - Classes CSS customizadas
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse motion-reduce:animate-none bg-neutral-200/80 dark:bg-neutral-800/60 rounded-control',
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton estruturado para cards de KPI.
 */
export function KpiSkeleton({ className }) {
  return (
    <div
      className={cn(
        'p-5 bg-surface border border-border rounded-card shadow-card space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-10 rounded-control" />
      </div>
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

/**
 * Skeleton para linhas de listas ou tabelas.
 */
export function ListRowSkeleton({ count = 3, className }) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-surface border border-border/70 rounded-control"
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-2.5 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para áreas de gráficos.
 */
export function ChartSkeleton({ height = 'h-64', className }) {
  return (
    <div
      className={cn(
        'p-5 bg-surface border border-border rounded-card shadow-card space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-7 w-24 rounded-control" />
      </div>
      <div className={cn('w-full flex items-end gap-2 pt-4', height)}>
        <Skeleton className="h-[40%] flex-1" />
        <Skeleton className="h-[75%] flex-1" />
        <Skeleton className="h-[55%] flex-1" />
        <Skeleton className="h-[90%] flex-1" />
        <Skeleton className="h-[60%] flex-1" />
        <Skeleton className="h-[80%] flex-1" />
      </div>
    </div>
  );
}

export default Skeleton;
