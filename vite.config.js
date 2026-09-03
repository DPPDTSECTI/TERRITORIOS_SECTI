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
      name: 'playwright-pdf-export',
      configureServer(server) {
        server.middlewares.use('/api/export-pdf', async (req, res) => {
          try {
            const url = new URL(req.url, 'http://localhost:5173');
            const type = url.searchParams.get('type') || 'sintese';
            const territorio = url.searchParams.get('territorio') || 'bahia';

            let route = '/relatorio/sintese';
            let fileBase = 'relatorio_sintese';
            if (type === 'ativos') {
              route = '/relatorio/ativos';
              fileBase = 'relatorio_ativos';
            } else if (type === 'cursos') {
              route = '/relatorio/cursos';
              fileBase = 'relatorio_ensino';
            } else if (type === 'cadeias') {
              route = '/relatorio/cadeias';
              fileBase = 'relatorio_cadeias';
            }

            const terrParam = territorio && territorio !== 'bahia'
              ? `territorio=${encodeURIComponent(territorio)}`
              : 'territorio=bahia';

            const fullRoute = `${route}?${terrParam}`;

            const { captureReportWithPlaywright } = await import('./scripts/captureReports.mjs');
            const result = await captureReportWithPlaywright({
              route: fullRoute,
              pngPath: `relatorio_${type}.png`,
              pdfPath: `relatorio_${type}.pdf`,
              baseUrl: 'http://localhost:5173'
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.pdf"`);
            res.end(result.pdfBuffer);
          } catch (err) {
            console.error('[Vite /api/export-pdf] Erro:', err);
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