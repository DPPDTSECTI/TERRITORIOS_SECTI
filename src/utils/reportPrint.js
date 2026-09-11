/**
 * Utilitário de configuração para impressão nativa de relatórios executivos (1920x1080 16:9)
 * via react-to-print.
 */

export const REPORT_PRINT_PAGE_STYLE = `
  @page {
    size: 1920px 1080px;
    margin: 0;
  }

  *, *::before, *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    box-sizing: border-box !important;
  }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 1920px !important;
    height: 1080px !important;
    min-width: 1920px !important;
    min-height: 1080px !important;
    max-width: 1920px !important;
    max-height: 1080px !important;
    overflow: hidden !important;
    background: #f8fafc !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #pdf-report {
    width: 1920px !important;
    height: 1080px !important;
    min-width: 1920px !important;
    min-height: 1080px !important;
    max-width: 1920px !important;
    max-height: 1080px !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    padding: 24px 32px !important;
    background: #f8fafc !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    page-break-before: avoid !important;
    page-break-after: avoid !important;
  }

  .print\\:hidden,
  .print-hidden,
  [data-html2canvas-ignore="true"],
  .leaflet-control-zoom,
  .leaflet-control-attribution,
  .leaflet-top.leaflet-right,
  .leaflet-bottom.leaflet-right {
    display: none !important;
  }
`;

/**
 * Prepara o relatório aguardando fontes e imagens de mapas antes do disparo da impressão.
 */
export async function prepareReportForPrint() {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('[Print] Erro ao aguardar document.fonts.ready:', e);
    }
  }

  const imgs = Array.from(document.querySelectorAll('#pdf-report img'));
  await Promise.all(
    imgs.map(img => {
      if (!img.complete) {
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }
      return Promise.resolve();
    })
  );

  // Intervalo mínimo para garantir que animações e renderizações de SVG estabilizem
  await new Promise(r => setTimeout(r, 150));
}

/**
 * Sincroniza buffers de canvas (caso o Leaflet use canvas) e dispara impressão nativa no iframe.
 */
export async function printWithCanvasSync(iframe, contentRef) {
  try {
    if (contentRef?.current && iframe?.contentDocument) {
      const srcCanvases = contentRef.current.querySelectorAll('canvas');
      const destCanvases = iframe.contentDocument.querySelectorAll('canvas');
      srcCanvases.forEach((src, idx) => {
        const dest = destCanvases[idx];
        if (dest && src.width && src.height) {
          dest.width = src.width;
          dest.height = src.height;
          const ctx = dest.getContext('2d');
          if (ctx) {
            ctx.drawImage(src, 0, 0);
          }
        }
      });
    }
  } catch (e) {
    console.warn('[Print] Aviso ao sincronizar canvas:', e);
  }

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
}
