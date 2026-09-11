import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Captura um elemento DOM usando html2canvas e retorna o canvas correspondente.
 */
export async function captureDomElement(element, options = {}) {
  if (!element) throw new Error('Elemento não encontrado para captura.');

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('[Export] Aguardando fontes:', e);
    }
  }

  // Aguarda 2 frames de animação
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

  const canvas = await html2canvas(element, {
    scale: options.scale || 2,
    useCORS: true,
    allowTaint: false, // Obrigatório: allowTaint: true tonta o canvas e impede toBlob/toDataURL!
    logging: false,
    backgroundColor: options.backgroundColor || '#f8fafc',
    ignoreElements: (el) => {
      return (
        el.getAttribute?.('data-html2canvas-ignore') === 'true' ||
        el.classList?.contains('tour-relatorio-export') ||
        el.classList?.contains('leaflet-control-zoom') ||
        el.classList?.contains('leaflet-control-attribution')
      );
    },
    ...options
  });

  return canvas;
}

/**
 * Exporta o canvas gerado como arquivo PNG direto para download.
 */
export function downloadCanvasAsPng(canvas, filename = 'relatorio.png') {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Falha ao gerar imagem PNG a partir do canvas.'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        resolve();
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Exporta o canvas gerado como arquivo PDF 16:9 (300 x 168.75 mm) direto para download.
 */
export function downloadCanvasAsPdf(canvas, filename = 'relatorio.pdf') {
  const pdfWidth = 300; // mm
  const pdfHeight = 168.75; // mm (16:9)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
    compress: true
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  pdf.save(filename);
}

/**
 * Renderiza a rota oficial do relatório em um iframe oculto 1920x1080 e exporta como PDF ou PNG.
 * Funciona 100% no Vercel e em qualquer ambiente sem necessidade de servidor Node.js/Playwright.
 */
export async function captureReportViaIframe(route, format = 'pdf', filename = 'relatorio.pdf') {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '1920px';
    iframe.style.height = '1080px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-99999';
    iframe.style.opacity = '0.01';
    iframe.style.pointerEvents = 'none';

    let timeoutId;
    let pollInterval;

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (pollInterval) clearInterval(pollInterval);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    // Timeout de segurança (25 segundos)
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Tempo limite excedido ao renderizar o relatório para exportação.'));
    }, 25000);

    const onReadyToCapture = async (doc) => {
      try {
        const targetEl = doc.getElementById('pdf-report') || doc.body;

        if (doc.fonts && doc.fonts.ready) {
          try {
            await doc.fonts.ready;
          } catch (e) {
            console.warn('[Export] Fontes:', e);
          }
        }

        // Aguarda estabilização de gráficos e vetores SVG
        await new Promise((r) => setTimeout(r, 450));

        const canvas = await captureDomElement(targetEl, {
          scale: 2,
          windowWidth: 1920,
          windowHeight: 1080,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#f8fafc'
        });

        if (format === 'png') {
          await downloadCanvasAsPng(canvas, filename);
        } else {
          downloadCanvasAsPdf(canvas, filename);
        }

        cleanup();
        resolve();
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    iframe.onload = () => {
      let attempts = 0;
      pollInterval = setInterval(() => {
        attempts++;
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!doc) return;

          const targetEl = doc.getElementById('pdf-report');
          if (targetEl && targetEl.children.length >= 2) {
            clearInterval(pollInterval);
            pollInterval = null;
            onReadyToCapture(doc);
          } else if (attempts > 50) {
            clearInterval(pollInterval);
            pollInterval = null;
            if (doc.body) {
              onReadyToCapture(doc);
            } else {
              cleanup();
              reject(new Error('Não foi possível carregar o conteúdo do relatório no tempo esperado.'));
            }
          }
        } catch (e) {
          clearInterval(pollInterval);
          pollInterval = null;
          cleanup();
          reject(e);
        }
      }, 200);
    };

    iframe.onerror = (err) => {
      cleanup();
      reject(err);
    };

    iframe.src = route;
    document.body.appendChild(iframe);
  });
}
