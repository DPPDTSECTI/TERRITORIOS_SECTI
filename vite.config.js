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

            let route = '/relatorio/sintese';
            let fileBase = 'relatorio_sintese';
            let pngName = 'relatorio_sintese.png';

            if (type === 'ativos') {
              route = '/relatorio/ativos';
              fileBase = 'relatorio_ativos';
              pngName = 'relatorio_ativos.png';
            } else if (type === 'cursos') {
              route = '/relatorio/cursos';
              fileBase = 'relatorio_ensino';
              pngName = 'relatorio_cursos.png';
            } else if (type === 'cadeias') {
              route = '/relatorio/cadeias';
              fileBase = 'relatorio_cadeias';
              pngName = 'relatorio_cadeias.png';
            }

            const terrParam = territorio && territorio !== 'bahia'
              ? `territorio=${encodeURIComponent(territorio)}`
              : 'territorio=bahia';

            const fullRoute = `${route}?${terrParam}`;

            const debugPngName = `relatorio_${type === 'cursos' ? 'cursos' : type}_debug.png`;
            const { captureReportWithPlaywright } = await import('./scripts/captureReports.mjs');
            const result = await captureReportWithPlaywright({
              route: fullRoute,
              pngPath: debugPngName,
              pdfPath: `${fileBase}.pdf`,
              baseUrl: 'http://localhost:5173'
            });

            if (format === 'png') {
              res.setHeader('Content-Type', 'image/png');
              res.setHeader('Content-Disposition', `attachment; filename="${pngName}"`);
              res.end(result.pngBuffer);
            } else {
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.pdf"`);
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