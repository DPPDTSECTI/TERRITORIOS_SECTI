import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'

// Plugin para criar proxy do SharePoint (evitar CORS)
const sharepointProxyPlugin = () => ({
  name: 'sharepoint-proxy',
  configureServer(server) {
    server.middlewares.use('/api/sharepoint', async (req, res) => {
      // Link atualizado fornecido pelo usuário
      const downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/valmir_ferreira_secti_ba_gov_br/IQDZbNB-DvGJTIGRveSkOzDZATYdKyDyClL0S6SsWABR4bw?download=1';
      
      console.log(`[Proxy SharePoint] Iniciando download...`);
      
      // Verificar se cliente desconectou
      let clientDisconnected = false;
      res.on('close', () => {
        clientDisconnected = true;
        console.log('[Proxy SharePoint] Cliente desconectou');
      });
      
      https.get(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
        }
      }, (response) => {
        if (clientDisconnected) return;
        
        const contentType = response.headers['content-type'] || '';
        console.log(`[Proxy SharePoint] Status: ${response.statusCode}, Content-Type: ${contentType}`);
        
        // Seguir redirecionamentos
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
          let redirectUrl = response.headers.location;
          
          // Se for caminho relativo, construir URL completa
          if (redirectUrl && redirectUrl.startsWith('/')) {
            redirectUrl = `https://prodeboffice365-my.sharepoint.com${redirectUrl}`;
          }
          
          console.log(`[Proxy SharePoint] Redirecionando para: ${redirectUrl?.substring(0, 80)}...`);
          
          // Preservar cookies do redirecionamento
          const cookies = response.headers['set-cookie'];
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
          };
          
          if (cookies) {
            headers['Cookie'] = cookies.map(c => c.split(';')[0]).join('; ');
          }
          
          https.get(redirectUrl, { headers }, (redirectResponse) => {
            if (!clientDisconnected) {
              handleResponse(redirectResponse, res);
            }
          }).on('error', (err) => {
            if (!clientDisconnected) {
              console.error('[Proxy SharePoint] Erro no redirecionamento:', err.message);
              sendError(res, 500, err.message);
            }
          });
          return;
        }
        
        if (!clientDisconnected) {
          handleResponse(response, res);
        }
      }).on('error', (err) => {
        if (!clientDisconnected) {
          console.error('[Proxy SharePoint] Erro:', err.message);
          sendError(res, 500, err.message);
        }
      });
    });
  }
});

function handleResponse(response, res) {
  const contentType = response.headers['content-type'] || '';
  
  // Verificar se é Excel
  if (contentType.includes('spreadsheet') || 
      contentType.includes('excel') ||
      contentType.includes('application/vnd.openxmlformats') ||
      contentType.includes('application/octet-stream')) {
    
    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log(`[Proxy SharePoint] ✓ Download completo: ${buffer.length} bytes`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.end(buffer);
    });
    response.on('error', (err) => {
      console.error('[Proxy SharePoint] Erro ao ler response:', err.message);
      sendError(res, 500, 'Erro ao ler dados do SharePoint: ' + err.message);
    });
  } else {
    // HTML ou outro tipo - erro de autenticação
    console.error(`[Proxy SharePoint] Tipo inválido: ${contentType}`);
    sendError(res, 401, 'SharePoint retornou página HTML. Autenticação necessária ou link inválido.');
  }
}

function sendError(res, statusCode, message) {
  // Verificar se headers já foram enviados
  if (res.headersSent) {
    console.error('[Proxy SharePoint] Headers já foram enviados, ignorando erro:', message);
    return;
  }
  
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ 
    error: 'Erro ao acessar SharePoint',
    message,
  }));
}

export default defineConfig({
  plugins: [react(), sharepointProxyPlugin()],
})
