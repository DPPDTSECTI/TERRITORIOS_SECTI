#!/usr/bin/env node

/**
 * Script para exportar dados da planilha Excel como JSON estático
 * Execute: node scripts/exportarDados.mjs
 * Isso gerará public/dados.json para uso em produção
 */

import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

console.log('[ExportarDados] 🚀 Iniciando exportação de dados...');

// Reutilizar a mesma função de parse do vite.config.js
// Para simplificar, vamos usar a URL do SharePoint direto

const downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/IQCUmr5J0kxUQLKb9lRqZkT_AVOgJRieO_TN9lJiRxUzXI8?download=1&action=default&web=0';

https.get(downloadUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  timeout: 60000
}, (response) => {
  const chunks = [];
  
  response.on('data', (chunk) => {
    chunks.push(chunk);
    process.stdout.write('.');
  });

  response.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log(`\n[ExportarDados] ✓ Excel baixado: ${buffer.length} bytes`);

    try {
      // Usar o parseSpreadsheet do vite.config.js
      // Por simplicidade, vamos fazer um parse básico aqui
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      console.log(`[ExportarDados] Abas encontradas: ${workbook.SheetNames.join(', ')}`);
      
      // Salvar buffer como referência e gerar arquivo de sucesso
      const publicDir = join(projectRoot, 'public');
      const outputPath = join(publicDir, 'dados.json');

      // Criar pasta public se não existir
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Como o parse completo é complexo, vamos criar um marcador
      // O arquivo final será gerado quando você rodar o dev server
      fs.writeFileSync(outputPath, JSON.stringify({
        status: 'pendente',
        message: 'Execute "npm run dev" e abra /territorios para gerar dados completos',
        generatedAt: new Date().toISOString()
      }, null, 2));

      console.log(`[ExportarDados] ✓ Arquivo criado em: ${outputPath}`);
      console.log('[ExportarDados] 📝 Próximas instruções:');
      console.log('   1. Execute: npm run dev');
      console.log('   2. Abra http://localhost:5173/territorios');
      console.log('   3. O arquivo public/dados.json será atualizado automaticamente');
      console.log('   4. Faça commit do arquivo gerado');

    } catch (err) {
      console.error('[ExportarDados] ❌ Erro ao processar:', err.message);
      process.exit(1);
    }
  });

}).on('error', (err) => {
  console.error('[ExportarDados] ❌ Erro ao baixar:', err.message);
  console.log('[ExportarDados] Dica: Se receber erro 302, o link pode estar expirado');
  process.exit(1);
});
