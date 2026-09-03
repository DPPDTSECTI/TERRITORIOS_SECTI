import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    {
      name: 'playwright-export-endpoint',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url.startsWith('/api/export-pdf') && !req.url.startsWith('/api/export-png')) {
            return next();
          }

          try {
            const url = new URL(req.url, 'http://localhost:5173');
            const isPngEndpoint = req.url.startsWith('/api/export-png');
            const format = url.searchParams.get('format') || (isPngEndpoint ? 'png' : 'pdf');
            const type = url.searchParams.get('type') || 'sintese';
            const territorio = url.searchParams.get('territorio') || 'bahia';
            const modo = url.searchParams.get('modo') === 'semiarido' ? 'semiarido' : 'normal';

            let route = '/relatorio/sintese';
            let fileBase = 'relatorio_sintese';
            let pngType = 'sintese';

            if (type === 'ativos') {
              route = '/relatorio/ativos';
              fileBase = 'relatorio_ativos';
              pngType = 'ativos';
            } else if (type === 'cursos') {
              route = '/relatorio/cursos';
              fileBase = 'relatorio_ensino';
              pngType = 'cursos';
            } else if (type === 'cadeias') {
              route = '/relatorio/cadeias';
              fileBase = 'relatorio_cadeias';
              pngType = 'cadeias';
            }

            const terrParam = territorio && territorio !== 'bahia'
              ? `territorio=${encodeURIComponent(territorio)}`
              : 'territorio=bahia';

            const fullRoute = `${route}?${terrParam}&modo=${modo}`;

            const finalPdfName = `${fileBase}_${modo}.pdf`;
            const finalPngName = `relatorio_${pngType}_${modo}.png`;
            const debugPngName = `relatorio_${pngType}_${modo}_debug.png`;

            const { captureReportWithPlaywright } = await import('./scripts/captureReports.mjs');
            const result = await captureReportWithPlaywright({
              route: fullRoute,
              pngPath: debugPngName,
              pdfPath: finalPdfName,
              baseUrl: 'http://localhost:5173'
            });

            if (format === 'png') {
              res.setHeader('Content-Type', 'image/png');
              res.setHeader('Content-Length', result.pngBuffer.length);
              res.setHeader('Content-Disposition', `attachment; filename="${finalPngName}"`);
              res.end(result.pngBuffer);
            } else {
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Length', result.pdfBuffer.length);
              res.setHeader('Content-Disposition', `attachment; filename="${finalPdfName}"`);
              res.end(result.pdfBuffer);
            }
          } catch (err) {
            console.error('[Vite export endpoint] Erro:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      }
    }
  ],
  build: {
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-topojson': ['topojson-client'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: { hmr: { overlay: true } },
});