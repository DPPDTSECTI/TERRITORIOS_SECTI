import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Utilitário profissional para exportação de relatórios executivos 16:9 em PDF e PNG
 * Executado 100% no cliente (browser), sem dependência de servidores headless ou Playwright.
 */

/**
 * Protege contra o bug clássico do html2canvas:
 * "Failed to execute 'addColorStop' on 'CanvasGradient': The provided double value is non-finite."
 * Ocorre quando o parser do html2canvas calcula offset como NaN ou Infinity em gradientes com ângulos complexos ou dimensões nulas.
 */
function patchCanvasGradient(win = (typeof window !== 'undefined' ? window : null)) {
  try {
    if (!win) return;
    const proto = win.CanvasRenderingContext2D?.prototype;
    if (proto && !proto.__sectiAddColorStopPatched) {
      const origAddColorStop = proto.addColorStop;
      proto.addColorStop = function (offset, color) {
        let safeOffset = Number(offset);
        if (!isFinite(safeOffset) || isNaN(safeOffset)) {
          safeOffset = 0;
        } else if (safeOffset < 0) {
          safeOffset = 0;
        } else if (safeOffset > 1) {
          safeOffset = 1;
        }
        try {
          return origAddColorStop.call(this, safeOffset, color);
        } catch (e) {
          // Ignora se for cor temporariamente mal formatada no parser
        }
      };
      proto.__sectiAddColorStopPatched = true;
    }
  } catch (err) {
    console.warn('[ExportReport] Aviso ao proteger addColorStop:', err);
  }
}

// Inicializa a proteção na janela principal imediatamente
patchCanvasGradient();

/**
 * Aguarda a estabilização e renderização completa de um elemento de relatório:
 * 1. Fontes da página carregadas
 * 2. Desaparecimento de spinners ou mensagens de 'Carregando...'
 * 3. Imagens e tiles decodificados
 * 4. Dois frames de animação do navegador para estabilização de SVGs e gráficos (Recharts/Leaflet)
 */
export async function waitForReportReady(targetDoc, element, maxWaitMs = 15000) {
  const startTime = Date.now();

  // 1. Aguarda fontes
  if (targetDoc.fonts && targetDoc.fonts.ready) {
    try {
      await Promise.race([
        targetDoc.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 3000))
      ]);
    } catch (e) {
      console.warn('[ExportReport] Erro ao aguardar fontes:', e);
    }
  }

  // 2. Aguarda sumiço de loaders/spinners
  while (Date.now() - startTime < maxWaitMs) {
    const hasSpinner = element.querySelector('.animate-spin') !== null;
    const hasLoadingText = element.innerText?.includes('Carregando') || element.innerText?.includes('loadingStats');
    if (!hasSpinner && !hasLoadingText) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // 3. Aguarda imagens dentro do relatório (ex: brasão, tiles)
  const imgs = Array.from(element.querySelectorAll('img'));
  if (imgs.length > 0) {
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise((resolve) => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          setTimeout(done, 3500);
        });
      })
    );
  }

  // 4. Aguarda quadros de animação para garantir que Recharts e SVG finalizaram
  const targetWin = targetDoc.defaultView || window;
  await new Promise((resolve) => {
    targetWin.requestAnimationFrame(() => {
      targetWin.requestAnimationFrame(() => {
        setTimeout(resolve, 300);
      });
    });
  });
}

/**
 * Captura um elemento DOM de relatório com html2canvas de forma perfeitamente ajustada
 */
async function captureReportElementToCanvas(element, scale = 2) {
  const targetDoc = element.ownerDocument || document;
  const targetWin = targetDoc.defaultView || window;
  patchCanvasGradient(targetWin);

  await waitForReportReady(targetDoc, element);

  const rect = element.getBoundingClientRect();
  const width = Math.round(rect.width) || element.offsetWidth || 1920;
  const height = Math.round(rect.height) || element.offsetHeight || 1080;

  const canvas = await html2canvas(element, {
    scale,
    width,
    height,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#f8fafc',
    logging: false,
    ignoreElements: (el) => {
      if (el.getAttribute?.('data-html2canvas-ignore') === 'true') return true;
      if (el.classList?.contains('print:hidden')) return true;
      if (el.classList?.contains('print-hidden')) return true;
      if (el.classList?.contains('recharts-tooltip-wrapper')) return true;
      if (el.classList?.contains('leaflet-control-zoom')) return true;
      if (el.classList?.contains('leaflet-control-attribution')) return true;
      return false;
    },
    onclone: (clonedDoc) => {
      const clonedWin = clonedDoc.defaultView || window;
      patchCanvasGradient(clonedWin);

      // Neutraliza maskImage com gradiente que causam NaN no html2canvas
      const masked = clonedDoc.querySelectorAll('[style*="mask"], [style*="gradient"]');
      masked.forEach((el) => {
        if (el.style) {
          if (el.style.maskImage?.includes('gradient')) el.style.maskImage = 'none';
          if (el.style.webkitMaskImage?.includes('gradient')) el.style.webkitMaskImage = 'none';
        }
      });
    }
  });

  return canvas;
}

/**
 * Dispara o download de um Canvas como imagem PNG
 */
function downloadCanvasAsPng(canvas, filename) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        return reject(new Error('Falha ao gerar imagem blob do canvas.'));
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 6000);
      resolve(true);
    }, 'image/png');
  });
}

/**
 * Converte um Canvas em documento PDF na proporção exata do canvas,
 * cobrindo 100% da página sem nenhuma borda branca.
 */
function downloadCanvasAsPdf(canvas, filename) {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const ratio = canvasWidth / canvasHeight;

  // Largura base de 300mm (padrão landscape widescreen)
  const pdfWidth = 300;
  // A altura do PDF é calculada exatamente proporcional à imagem capturada
  const pdfHeight = Number((pdfWidth / ratio).toFixed(2));

  const pdf = new jsPDF({
    orientation: pdfWidth >= pdfHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
    compress: true
  });

  const finalPageWidth = pdf.internal.pageSize.getWidth();
  const finalPageHeight = pdf.internal.pageSize.getHeight();

  const imgData = canvas.toDataURL('image/png', 0.98);
  // Adiciona preenchendo exatamente toda a extensão do documento
  pdf.addImage(imgData, 'PNG', 0, 0, finalPageWidth, finalPageHeight, undefined, 'FAST');
  pdf.save(filename);
}

/**
 * Cria um iframe padronizado em 1920x1080 em viewport real para carregar o relatório,
 * garantindo proporção e nitidez oficiais independente da tela do usuário.
 */
async function captureReportViaIframe(route, scale = 2) {
  return new Promise((resolve, reject) => {
    const iframeId = 'secti-report-capture-iframe';
    const oldIframe = document.getElementById(iframeId);
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.src = route;
    // Posiciona em (0,0) com z-index negativo e opacidade mínima para forçar o Chromium a renderizar o layout real de 1920x1080
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '1920px';
    iframe.style.height = '1080px';
    iframe.width = '1920';
    iframe.height = '1080';
    iframe.style.opacity = '0.01';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-999999';

    const cleanup = () => {
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Tempo limite de renderização do relatório excedido (15s).'));
    }, 18000);

    iframe.onload = async () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        const iframeWin = iframe.contentWindow || iframeDoc?.defaultView;
        if (!iframeDoc) {
          throw new Error('Não foi possível acessar o documento do relatório no iframe.');
        }

        // Protege addColorStop dentro da janela do iframe
        patchCanvasGradient(iframeWin);

        // Aguarda até o elemento #pdf-report ser montado pelo React
        let reportEl = null;
        for (let i = 0; i < 40; i++) {
          reportEl = iframeDoc.getElementById('pdf-report') || iframeDoc.querySelector('main');
          if (reportEl) break;
          await new Promise((r) => setTimeout(r, 200));
        }

        if (!reportEl) {
          throw new Error('Elemento do relatório não encontrado na página.');
        }

        // Injeta folha de estilo para garantir 1920x1080 exatos sem scroll ou margens externas
        const styleEl = iframeDoc.createElement('style');
        styleEl.id = 'report-capture-override-style';
        styleEl.textContent = `
          *, *::before, *::after {
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
          }
          #pdf-report {
            margin: 0 !important;
            padding: 24px 32px !important;
            width: 1920px !important;
            height: 1080px !important;
            min-width: 1920px !important;
            min-height: 1080px !important;
            max-width: 1920px !important;
            max-height: 1080px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: #f8fafc !important;
          }
          .print\\:hidden, [data-html2canvas-ignore="true"] {
            display: none !important;
          }
        `;
        iframeDoc.head.appendChild(styleEl);

        // Notifica componentes para recalcular viewBox e dimensões
        iframeWin?.dispatchEvent(new Event('resize'));
        await new Promise((r) => setTimeout(r, 500));

        await waitForReportReady(iframeDoc, reportEl);

        const canvas = await html2canvas(reportEl, {
          scale,
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1920,
          windowHeight: 1080,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#f8fafc',
          logging: false,
          ignoreElements: (el) => {
            if (el.getAttribute?.('data-html2canvas-ignore') === 'true') return true;
            if (el.classList?.contains('print:hidden')) return true;
            if (el.classList?.contains('print-hidden')) return true;
            if (el.classList?.contains('recharts-tooltip-wrapper')) return true;
            if (el.classList?.contains('leaflet-control-zoom')) return true;
            if (el.classList?.contains('leaflet-control-attribution')) return true;
            return false;
          },
          onclone: (clonedDoc) => {
            const clonedWin = clonedDoc.defaultView || window;
            patchCanvasGradient(clonedWin);

            const masked = clonedDoc.querySelectorAll('[style*="mask"], [style*="gradient"]');
            masked.forEach((el) => {
              if (el.style) {
                if (el.style.maskImage?.includes('gradient')) el.style.maskImage = 'none';
                if (el.style.webkitMaskImage?.includes('gradient')) el.style.webkitMaskImage = 'none';
              }
            });
          }
        });

        clearTimeout(timeout);
        cleanup();
        resolve(canvas);
      } catch (err) {
        clearTimeout(timeout);
        cleanup();
        reject(err);
      }
    };

    iframe.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Erro ao carregar a página do relatório para captura.'));
    };

    document.body.appendChild(iframe);
  });
}

/**
 * Obtém a rota do relatório executivo baseada no tipo, território e modo
 */
export function getReportRoute(type = 'sintese', territorioId = null, modo = 'normal') {
  let routePath = '/relatorio/sintese';
  if (type === 'ativos') routePath = '/relatorio/ativos';
  else if (type === 'cursos') routePath = '/relatorio/cursos';
  else if (type === 'cadeias') routePath = '/relatorio/cadeias';

  const terrParam = territorioId && territorioId !== 'bahia'
    ? `territorio=${encodeURIComponent(territorioId)}`
    : 'territorio=bahia';

  const modoParam = `&modo=${modo}`;
  return `${routePath}?${terrParam}${modoParam}`;
}

/**
 * Executa a exportação de um relatório em formato PNG
 */
export async function exportReportAsPng({
  type = 'sintese',
  territorioId = null,
  modo = 'normal',
  filename = null,
  scale = 2
}) {
  const effectiveType = type === 'cursos' ? 'cursos' : type;
  const defaultFilename = filename || `relatorio_${effectiveType}_${modo}.png`;

  // 1. Tenta API local (caso esteja rodando no Vite Dev Server com Playwright configurado)
  try {
    const terrParam = territorioId && territorioId !== 'bahia'
      ? `territorio=${encodeURIComponent(territorioId)}`
      : 'territorio=bahia';
    const apiUrl = `/api/export-png?type=${type}&${terrParam}&modo=${modo}`;
    const res = await fetch(apiUrl);
    const contentType = res.headers.get('content-type') || '';

    if (res.ok && contentType.includes('image/png')) {
      const blob = await res.blob();
      if (blob.size > 1000) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return true;
      }
    }
  } catch (apiErr) {
    // API não disponível
  }

  // 2. Geração padronizada no navegador (Client-Side)
  const currentEl = document.getElementById('pdf-report');
  let canvas = null;

  // Se o elemento na tela atual já tiver resolução próxima a 1920px, captura direto; senão, usa o viewport padronizado
  if (currentEl && Math.abs(currentEl.getBoundingClientRect().width - 1920) < 50) {
    canvas = await captureReportElementToCanvas(currentEl, scale);
  } else {
    const route = getReportRoute(type, territorioId, modo);
    canvas = await captureReportViaIframe(route, scale);
  }

  await downloadCanvasAsPng(canvas, defaultFilename);
  return true;
}

/**
 * Executa a exportação de um relatório em formato PDF Widescreen 16:9
 */
export async function exportReportAsPdf({
  type = 'sintese',
  territorioId = null,
  modo = 'normal',
  filename = null,
  scale = 2
}) {
  let fileBase = 'relatorio_sintese';
  if (type === 'ativos') fileBase = 'relatorio_ativos';
  else if (type === 'cursos') fileBase = 'relatorio_ensino';
  else if (type === 'cadeias') fileBase = 'relatorio_cadeias';

  const defaultFilename = filename || `${fileBase}_${modo}.pdf`;

  // 1. Tenta API local (caso esteja rodando no Vite Dev Server com Playwright)
  try {
    const terrParam = territorioId && territorioId !== 'bahia'
      ? `territorio=${encodeURIComponent(territorioId)}`
      : 'territorio=bahia';
    const apiUrl = `/api/export-pdf?type=${type}&${terrParam}&modo=${modo}`;
    const res = await fetch(apiUrl);
    const contentType = res.headers.get('content-type') || '';

    if (res.ok && contentType.includes('application/pdf')) {
      const blob = await res.blob();
      if (blob.size > 1000) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return true;
      }
    }
  } catch (apiErr) {
    // API não disponível
  }

  // 2. Geração padronizada no navegador (Client-Side)
  const currentEl = document.getElementById('pdf-report');
  let canvas = null;

  if (currentEl && Math.abs(currentEl.getBoundingClientRect().width - 1920) < 50) {
    canvas = await captureReportElementToCanvas(currentEl, scale);
  } else {
    const route = getReportRoute(type, territorioId, modo);
    canvas = await captureReportViaIframe(route, scale);
  }

  downloadCanvasAsPdf(canvas, defaultFilename);
  return true;
}
