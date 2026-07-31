import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mapshaper from 'mapshaper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const TARGET_FILE = path.join(ROOT, 'public', 'BA_(1)9396399957704198.json');

// Permitir passar percentual de simplificação via argumento (ex: node simplify-topojson.mjs 15%)
// Usando 15% como padrão para garantir excelente qualidade visual perceptível mesmo em zoom alto no dashboard
const percentage = process.argv[2] || '15%';

async function simplifyTopoJSON() {
  if (!fs.existsSync(TARGET_FILE)) {
    console.error(`[ERRO] Arquivo não encontrado: ${TARGET_FILE}`);
    process.exit(1);
  }

  const origStats = fs.statSync(TARGET_FILE);
  const origSizeKB = (origStats.size / 1024).toFixed(2);
  const origSizeMB = (origStats.size / (1024 * 1024)).toFixed(2);

  console.log('====================================================');
  console.log('   SIMPLIFICAÇÃO DE TOPOJSON - MAPSHAPER            ');
  console.log('====================================================');
  console.log(`Arquivo de entrada: ${path.relative(ROOT, TARGET_FILE)}`);
  console.log(`Tamanho original  : ${origSizeMB} MB (${origSizeKB} KB)`);
  console.log(`Taxa de retenção  : ${percentage}`);
  console.log('----------------------------------------------------');
  console.log('Processando simplificação com mapshaper...');

  const cmd = `-i "${TARGET_FILE}" -simplify ${percentage} -o force "${TARGET_FILE}" format=topojson`;

  try {
    await mapshaper.runCommands(cmd);

    const newStats = fs.statSync(TARGET_FILE);
    const newSizeKB = (newStats.size / 1024).toFixed(2);
    const newSizeMB = (newStats.size / (1024 * 1024)).toFixed(2);
    const reduction = (((origStats.size - newStats.size) / origStats.size) * 100).toFixed(1);

    console.log('----------------------------------------------------');
    console.log('                  RESULTADO FINAL                   ');
    console.log('----------------------------------------------------');
    console.log(`Tamanho antes  : ${origSizeMB} MB (${origSizeKB} KB)`);
    console.log(`Tamanho depois : ${newSizeMB} MB (${newSizeKB} KB)`);
    console.log(`Redução obtida : ${reduction}% menor!`);
    console.log('====================================================');
    console.log('[OK] Arquivo atualizado no mesmo caminho original.');
  } catch (error) {
    console.error('[ERRO] Falha ao executar mapshaper:', error);
    process.exit(1);
  }
}

simplifyTopoJSON();
