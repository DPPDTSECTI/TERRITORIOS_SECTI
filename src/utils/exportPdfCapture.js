import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Aguarda todas as condições necessárias para uma captura visual perfeita:
 * 1. Fontes do documento carregadas
 * 2. Imagens completas (incluindo tiles do mapa se houver)
 * 3. Frames de renderização do React/SVGs
 * 
 * @param {HTMLElement} element - Elemento raiz do relatório
 * @param {Document} doc - Documento proprietário do elemento
 */
export async function waitForReportReady(element, doc = document) {
  // 1. Aguarda fontes da janela
  const targetDoc = doc || element.ownerDocument || document;
  if (targetDoc.fonts && targetDoc.fonts.ready) {
    try {
      await targetDoc.fonts.ready;
    } catch (e) {
      console.warn('Aviso: targetDoc.fonts.ready falhou ou timeout:', e);
    }
  }

  // 2. Aguarda todas as imagens dentro do elemento terminarem de carregar
  const images = Array.from(element.querySelectorAll('img'));
  if (images.length > 0) {
    await Promise.all(
      images.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(resolve => {
          const onDone = () => resolve();
          img.addEventListener('load', onDone, { once: true });
          img.addEventListener('error', onDone, { once: true });
          // Timeout de segurança por imagem
          setTimeout(onDone, 3000);
        });
      })
    );
  }

  // 3. Aguarda renderização de vetores SVG (Recharts, Leaflet GeoJSON)
  const targetWin = targetDoc.defaultView || window;
  await new Promise(resolve => {
    targetWin.requestAnimationFrame(() => {
      targetWin.requestAnimationFrame(resolve);
    });
  });

  // 4. Pequeno delay adicional de estabilização
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Captura o elemento visual como screenshot de alta resolução e gera um PDF A4 Landscape.
 * Mantém rigorosamente o aspect ratio original sem distorcer ou cortar nada.
 *
 * @param {HTMLElement} element - Elemento raiz a capturar (id="pdf-report")
 * @param {string} filename - Nome do arquivo PDF gerado
 * @param {number} scale - Escala de captura (padrão 2 para alta nitidez)
 * @returns {Promise<jsPDF>}
 */
export async function captureReportToPdf(element, filename = 'relatorio.pdf', scale = 3) {
  if (!element) {
    throw new Error('Elemento com id="pdf-report" não foi encontrado.');
  }

  const doc = element.ownerDocument || document;

  // Garante que todo o conteúdo esteja renderizado e pronto
  await waitForReportReady(element, doc);

  // Captura visual via html2canvas com viewport fixa de 1920x1080 e escala 3x
  const canvas = await html2canvas(element, {
    scale,
    width: 1920,
    height: 1080,
    windowWidth: 1920,
    windowHeight: 1080,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (clonedDoc) => {
      const clonedReport = clonedDoc.getElementById('pdf-report');
      if (clonedReport) {
        clonedReport.style.width = '1920px';
        clonedReport.style.height = '1080px';
        clonedReport.style.minWidth = '1920px';
        clonedReport.style.minHeight = '1080px';
        clonedReport.style.maxWidth = '1920px';
        clonedReport.style.maxHeight = '1080px';
        clonedReport.style.boxSizing = 'border-box';
        clonedReport.style.overflow = 'hidden';
      }
    }
  });

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const ratio = canvasWidth / canvasHeight;

  // Dimensões do PDF na proporção exata 16:9 da captura (300mm x 168.75mm)
  const pdfWidth = 300;
  const pdfHeight = Number((pdfWidth / ratio).toFixed(4));
  const orientation = pdfWidth >= pdfHeight ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
    compress: true
  });

  const finalPageWidth = pdf.internal.pageSize.getWidth();
  const finalPageHeight = pdf.internal.pageSize.getHeight();

  // Gera imagem PNG em altíssima fidelidade @3x (5760x3240 px)
  const imgData = canvas.toDataURL('image/png');

  // Adiciona a imagem preenchendo 100% da folha personalizada 16:9 de (0, 0) a (finalPageWidth, finalPageHeight)
  // Sem margens artificiais, sem padding branco, sem cortes e sem deformações
  pdf.addImage(imgData, 'PNG', 0, 0, finalPageWidth, finalPageHeight, undefined, 'FAST');

  // Executa o download automático
  pdf.save(filename);

  // Armazena no escopo global para validação e auditoria
  if (typeof window !== 'undefined') {
    window.__lastReportCapture = {
      filename,
      canvasWidth,
      canvasHeight,
      ratio,
      pdfWidth: finalPageWidth,
      pdfHeight: finalPageHeight,
      pdfRatio: Number((finalPageWidth / finalPageHeight).toFixed(4)),
      imgData
    };
  }

  return pdf;
}
