import html2canvas from 'html2canvas';

/**
 * Aguarda o carregamento de todas as fontes do documento antes de capturar imagens.
 */
async function waitForFontsReady() {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (err) {
      console.warn('Aviso: falha ao aguardar document.fonts.ready:', err);
    }
  }
}

/**
 * Captura um elemento DOM pelo seu ID ou referência e faz download como imagem PNG.
 * @param {string|HTMLElement} target - ID do elemento ou referência DOM
 * @param {string} filenamePrefix - Prefixo do nome do arquivo (ex: "relatorio_municipios_bahia")
 * @returns {Promise<boolean>} Retorna true em caso de sucesso
 */
export async function exportReportAsImage(target, filenamePrefix = 'relatorio_secti') {
  try {
    await waitForFontsReady();

    const element = typeof target === 'string'
      ? document.getElementById(target)
      : target;

    if (!element) {
      console.error(`Elemento para captura não encontrado: ${target}`);
      return false;
    }

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${filenamePrefix}_${timestamp}.png`;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Erro ao exportar relatório como imagem:', error);
    throw error;
  }
}

/**
 * Captura um elemento DOM e retorna como string base64 PNG (para uso em PDF ou outros serviços)
 */
export async function captureElementAsBase64(target) {
  try {
    await waitForFontsReady();
    const element = typeof target === 'string'
      ? document.getElementById(target)
      : target;

    if (!element) return null;

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Erro ao capturar elemento em base64:', err);
    return null;
  }
}
