/**
 * Mapeamento e resolução de fontes acadêmicas para as Cadeias Produtivas (APLs e IGs).
 * Fonte de verdade: A tabela do Excel
 */

function normalizeStr(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Resolve a fonte de uma cadeia produtiva para seu hyperlink e rótulo correspondente.
 */
export function resolveCadeiaFonte(apl) {
  if (!apl) {
    return { url: '', label: 'Fonte não informada', isArticle: false, originalFonte: '' };
  }

  const raw = (apl.fonte || '').trim();
  let url = '';
  let label = raw;
  
  // 1. Verifica se a URL foi extraída nativamente do Excel via tag "|URL: "
  const urlMarker = ' |URL: ';
  if (raw.includes(urlMarker)) {
    const parts = raw.split(urlMarker);
    label = parts[0].trim();
    url = parts[1].trim();
  } else {
    // 2. Tenta encontrar URL diretamente no texto como fallback
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/ig;
    const matches = raw.match(urlRegex);
    if (matches && matches.length > 0) {
      url = matches[0].replace(/[\.,;\)]+$/, '');
      url = url.startsWith('http') ? url : `https://${url}`;
    } else {
      // 3. Tenta encontrar DOI como fallback
      const doiRegex = /doi:\s*([10\.\d+\/[^\s]+)/i;
      const doiMatch = raw.match(doiRegex);
      if (doiMatch && doiMatch[1]) {
        let doi = doiMatch[1].replace(/[\.,;\)]+$/, '');
        url = `https://doi.org/${doi}`;
      }
    }
  }

  return {
    url: url,
    label: label, 
    isArticle: url.includes('doi.org'), // heurística simples
    originalFonte: label
  };
}
