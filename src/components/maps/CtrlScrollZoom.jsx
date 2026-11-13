import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Controlador de zoom suave com roda do mouse ou gesto de pinça/scroll em tela sensível ao toque,
 * sem exigir tecla modificadora (Ctrl / Cmd) para uso livre em telões e quiosques.
 */
export function CtrlScrollZoom() {
  const map = useMap();
  const accDeltaRef = useRef(0);
  const lastWheelTsRef = useRef(0);

  useEffect(() => {
    if (!map) return undefined;
    const container = map.getContainer();
    if (!container) return undefined;

    if (map.scrollWheelZoom && map.scrollWheelZoom.enabled()) {
      map.scrollWheelZoom.disable();
    }

    const handleWheel = (e) => {
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
    };
  }, [map]);

  return null;
}

export default CtrlScrollZoom;

