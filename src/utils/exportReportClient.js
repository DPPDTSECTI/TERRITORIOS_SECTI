import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Utilitário profissional para exportação de relatórios executivos 16:9 em PDF e PNG
 * Executado 100% no cliente (browser), sem dependência de servidores headless ou Playwright.
 */

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
 * Captura um elemento DOM de relatório com html2canvas em 1920x1080 fixos
 */
async function captureReportElementToCanvas(element, scale = 2) {
  const targetDoc = element.ownerDocument || document;

  await waitForReportReady(targetDoc, element);

  const canvas = await html2canvas(element, {
    scale,
    width: 1920,
    height: 1080,
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
      const clonedReport = clonedDoc.getElementById('pdf-report') || clonedDoc.querySelector('main');
      if (clonedReport) {
        clonedReport.style.width = '1920px';
        clonedReport.style.height = '1080px';
        clonedReport.style.minWidth = '1920px';
        clonedReport.style.minHeight = '1080px';
        clonedReport.style.maxWidth = '1920px';
        clonedReport.style.maxHeight = '1080px';
        clonedReport.style.overflow = 'hidden';
        clonedReport.style.boxSizing = 'border-box';
      }
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
 * Converte um Canvas em documento PDF Widescreen 16:9 (300mm x 168.75mm) via jsPDF e faz o download
 */
function downloadCanvasAsPdf(canvas, filename) {
  const pdfWidth = 300; // mm
  const pdfHeight = 168.75; // mm (300 * 9 / 16 exato)

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
    compress: true
  });

  const imgData = canvas.toDataURL('image/png', 0.95);
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  pdf.save(filename);
}

/**
 * Cria um iframe oculto isolado para carregar a rota executiva oficial do relatório,
 * aguardar a renderização dos dados e capturar o elemento.
 */
async function captureReportViaIframe(route, scale = 2) {
  return new Promise((resolve, reject) => {
    const iframeId = 'secti-report-capture-iframe';
    const oldIframe = document.getElementById(iframeId);
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.src = route;
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1920px';
    iframe.style.height = '1080px';
    iframe.width = '1920';
    iframe.height = '1080';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';

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
        if (!iframeDoc) {
          throw new Error('Não foi possível acessar o documento do relatório no iframe.');
        }

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

        // Dá tempo para context e dados de Supabase carregarem dentro do iframe
        await new Promise((r) => setTimeout(r, 600));

        const canvas = await captureReportElementToCanvas(reportEl, scale);
        clearTimeout(timeout);
        cleanup();
        resolve(canvas);
      } catch (err) {
        clearTimeout(timeout);
        cleanup();
        reject(err);
      }
    };

    iframe.onerror = (e) => {
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

    // Se o servidor respondeu OK com uma imagem PNG real (e NÃO com o index.html da SPA)
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
    // API não disponível ou ambiente de produção estático (Vercel)
  }

  // 2. Geração direta no navegador (Client-Side)
  // Caso o usuário já esteja na página do relatório executivo
  const currentEl = document.getElementById('pdf-report');
  let canvas = null;

  if (currentEl) {
    canvas = await captureReportElementToCanvas(currentEl, scale);
  } else {
    // Carrega a rota oficial em um iframe temporário
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

    // Se o servidor respondeu OK com um PDF real (e NÃO com o index.html da SPA)
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
    // API não disponível ou ambiente de produção estático (Vercel)
  }

  // 2. Geração direta no navegador (Client-Side)
  const currentEl = document.getElementById('pdf-report');
  let canvas = null;

  if (currentEl) {
    canvas = await captureReportElementToCanvas(currentEl, scale);
  } else {
    // Carrega a rota oficial em um iframe temporário
    const route = getReportRoute(type, territorioId, modo);
    canvas = await captureReportViaIframe(route, scale);
  }

  downloadCanvasAsPdf(canvas, defaultFilename);
  return true;
}
