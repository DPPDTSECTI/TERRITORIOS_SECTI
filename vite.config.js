import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import { parseSpreadsheet } from './.netlify/functions/sharepoint-processor.js'

// Cache em memória para desenvolvimento
let devCache = null;
let devCacheExpiry = 0;
const DEV_CACHE_TTL = 30 * 60 * 1000; // 30 minutos

// Plugin para criar proxy do SharePoint (PROCESSA EXCEL NO SERVIDOR = RÁPIDO)
const sharepointProxyPlugin = () => ({
  name: 'sharepoint-proxy',
  configureServer(server) {
    server.middlewares.use('/api/sharepoint', async (req, res) => {
      const startTime = Date.now();
      
      // OTIMIZAÇÃO: Cache em memória (retorna instantâneamente)
      if (devCache && Date.now() < devCacheExpiry) {
        const age = Math.round((Date.now() - (devCacheExpiry - DEV_CACHE_TTL)) / 1000);
        console.log(`[Dev Proxy] ✓ Cache HIT (idade: ${age}s) - respondendo instantaneamente`);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=86400');
        res.setHeader('X-Content-Source', 'dev-cache');
        res.setHeader('X-Cache-Age', age.toString());
        res.end(devCache);
        
        const responseTime = Date.now() - startTime;
        console.log(`[Dev Proxy] Resposta enviada em ${responseTime}ms ⚡`);
        return;
      }
      
      const downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/valmir_ferreira_secti_ba_gov_br/IQDZbNB-DvGJTIGRveSkOzDZATYdKyDyClL0S6SsWABR4bw?download=1';
      
      console.log(`[Dev Proxy] Cache MISS - baixando e processando Excel...`);
      
      // Verificar se cliente desconectou
      let clientDisconnected = false;
      res.on('close', () => {
        clientDisconnected = true;
        console.log('[Dev Proxy] Cliente desconectou');
      });
      
      https.get(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*',
        }
      }, (response) => {
        if (clientDisconnected) return;
        
        const contentType = response.headers['content-type'] || '';
        console.log(`[Dev Proxy] Status: ${response.statusCode}, Content-Type: ${contentType}`);
        
        // Seguir redirecionamentos
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
          let redirectUrl = response.headers.location;
          
          // Se for caminho relativo, construir URL completa
          if (redirectUrl && redirectUrl.startsWith('/')) {
            redirectUrl = `https://prodeboffice365-my.sharepoint.com${redirectUrl}`;
          }
          
          console.log(`[Dev Proxy] Redirecionando para: ${redirectUrl?.substring(0, 80)}...`);
          
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
              handleResponse(redirectResponse, res, startTime);
            }
          }).on('error', (err) => {
            if (!clientDisconnected) {
              console.error('[Dev Proxy] Erro no redirecionamento:', err.message);
              sendError(res, 500, err.message);
            }
          });
          return;
        }
        
        if (!clientDisconnected) {
          handleResponse(response, res, startTime);
        }
      }).on('error', (err) => {
        if (!clientDisconnected) {
          console.error('[Dev Proxy] Erro:', err.message);
          sendError(res, 500, err.message);
        }
      });
    });
  }
});

function handleResponse(response, res, startTime) {
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
      const downloadTime = Date.now() - startTime;
      console.log(`[Dev Proxy] ✓ Excel baixado em ${downloadTime}ms: ${buffer.length} bytes`);
      
      try {
        // OTIMIZAÇÃO CRÍTICA: Processar Excel no servidor (Node.js é 10x+ mais rápido que navegador)
        const parseStart = Date.now();
        const jsonData = parseSpreadsheet(buffer);
        const parseTime = Date.now() - parseStart;
        
        const jsonString = JSON.stringify(jsonData);
        const jsonSize = Buffer.byteLength(jsonString);
        
        console.log(`[Dev Proxy] ✓ JSON gerado em ${parseTime}ms: ${jsonSize} bytes (${Object.keys(jsonData).length} municípios)`);
        
        // Salvar no cache para próximas requisições
        devCache = jsonString;
        devCacheExpiry = Date.now() + DEV_CACHE_TTL;
        console.log(`[Dev Proxy] ✓ Cache salvo (válido por ${DEV_CACHE_TTL / 60000} minutos)`);
        
        const totalTime = Date.now() - startTime;
        console.log(`[Dev Proxy] ✓ TEMPO TOTAL: ${totalTime}ms (download: ${downloadTime}ms + parse: ${parseTime}ms)`);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=86400');
        res.setHeader('X-Content-Source', 'sharepoint-processed');
        res.setHeader('X-Parse-Time', parseTime.toString());
        res.setHeader('X-Total-Time', totalTime.toString());
        res.end(jsonString);
        
      } catch (parseError) {
        console.error('[Dev Proxy] ✗ Erro ao processar Excel:', parseError.message);
        sendError(res, 500, `Erro ao processar Excel: ${parseError.message}`);
      }
    });
    response.on('error', (err) => {
      console.error('[Dev Proxy] Erro ao ler response:', err.message);
      sendError(res, 500, 'Erro ao ler dados do SharePoint: ' + err.message);
    });
  } else {
    // HTML ou outro tipo - erro de autenticação
    console.error(`[Dev Proxy] Tipo inválido: ${contentType}`);
    sendError(res, 401, 'SharePoint retornou página HTML. Autenticação necessária ou link inválido.');
  }
}

function sendError(res, statusCode, message) {
  // Verificar se headers já foram enviados
  if (res.headersSent) {
    console.error('[Dev Proxy] Headers já foram enviados, ignorando erro:', message);
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
  
  // Otimizações de build
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Manter console.log para debug
        drop_debugger: true,
        pure_funcs: [], // Remover funções específicas se necessário
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar dependências grandes em chunks próprios
          'vendor-react': ['react', 'react-dom'],
          'vendor-xlsx': ['xlsx'],
          'vendor-topojson': ['topojson-client'],
          'vendor-storage': ['idb-keyval'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    sourcemap: false, // Desabilitar sourcemaps em produção para reduzir tamanho
  },
  
  // Otimizações de servidor de desenvolvimento
  server: {
    hmr: {
      overlay: true,
    },
  },
  
  // Pré-bundling otimizado
  optimizeDeps: {
    include: ['react', 'react-dom', 'xlsx', 'topojson-client', 'idb-keyval'],
    exclude: [],
  },
})

