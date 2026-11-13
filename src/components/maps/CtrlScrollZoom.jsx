import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Controlador de zoom com roda do mouse protegida por tecla modificadora (Ctrl / Cmd).
 * Sem modificador, o evento de rolagem atravessa normalmente para o container da página
 * e um aviso discreto aparece temporariamente no mapa sem deslocar nenhum componente.
 */
export function CtrlScrollZoom() {
  const map = useMap();
  const [showHint, setShowHint] = useState(false);
  const hideTimerRef = useRef(null);
  const accDeltaRef = useRef(0);
  const lastWheelTsRef = useRef(0);

  useEffect(() => {
    if (!map) return undefined;
    const container = map.getContainer();
    if (!container) return undefined;

    if (map.scrollWheelZoom && map.scrollWheelZoom.enabled()) {
      map.scrollWheelZoom.disable();
    }

    const triggerHint = () => {
      setShowHint(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setShowHint(false);
      }, 1500);
    };

    const handleWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) {
        triggerHint();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const now = performance.now();
      if (now - lastWheelTsRef.current > 180) {
        accDeltaRef.current = 0;
      }
      lastWheelTsRef.current = now;
      accDeltaRef.current += e.deltaY;

      if (Math.abs(accDeltaRef.current) < 35) return;

      const direction = accDeltaRef.current < 0 ? 1 : -1;
      accDeltaRef.current = 0;

      const step = map.options?.zoomDelta ?? 0.5;
      const minZoom = map.getMinZoom();
      const maxZoom = map.getMaxZoom();
      const targetZoom = Math.max(minZoom, Math.min(maxZoom, map.getZoom() + direction * step));

      if (targetZoom === map.getZoom()) return;

      const point = map.mouseEventToContainerPoint(e);
      const latLng = map.containerPointToLatLng(point);
      map.setZoomAround(latLng, targetZoom, { animate: true });
    };

    container.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [map]);

  if (!showHint) return null;

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || '');

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-4 z-[550] flex justify-center px-3"
    >
      <div className="rounded-pill bg-neutral-950/85 dark:bg-surface/95 text-white dark:text-text-primary border border-white/15 dark:border-border px-3.5 py-1.5 text-caption font-medium shadow-card backdrop-blur-sm">
        {isMac ? 'Use ⌘ + scroll para ampliar o mapa' : 'Use Ctrl + scroll para ampliar o mapa'}
      </div>
    </div>
  );
}

export default CtrlScrollZoom;

