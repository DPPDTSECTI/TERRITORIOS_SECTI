import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_IMG = path.join(ROOT, 'public', 'img');

// AVIF tem escala de qualidade onde ~68 corresponde visualmente a ~80 em WebP/JPEG
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 68;

function getFilesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getFilesRecursively(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function optimizeImages() {
  console.log('====================================================');
  console.log('   OTIMIZAÇÃO AUTOMÁTICA DE IMAGENS - SHARP         ');
  console.log('====================================================');
  console.log(`Diretório alvo  : ${path.relative(ROOT, PUBLIC_IMG)}`);
  console.log(`Qualidade WebP  : ~${WEBP_QUALITY}`);
  console.log(`Qualidade AVIF  : ~${AVIF_QUALITY} (equivalente visual ~80)`);
  console.log('----------------------------------------------------');

  const allFiles = getFilesRecursively(PUBLIC_IMG);
  const imageExtensions = /\.(png|jpg|jpeg|webp)$/i;

  let countProcessed = 0;
  let countSkipped = 0;
  let totalOriginalBytes = 0;
  let totalWebpBytes = 0;
  let totalAvifBytes = 0;

  for (const filePath of allFiles) {
    if (!imageExtensions.test(filePath)) continue;

    const ext = path.extname(filePath).toLowerCase();
    // Se for um webp ou avif já gerado como versão otimizada, não tratar como original se houver png/jpg original correspondente
    // No entanto, para arquivos do hero onde o original é .webp, tratamos como fonte se não houver .jpg correspondente.
    const baseName = filePath.slice(0, -ext.length);
    const hasJpgOrPng =
      fs.existsSync(`${baseName}.jpg`) ||
      fs.existsSync(`${baseName}.jpeg`) ||
      fs.existsSync(`${baseName}.png`);

    if (ext === '.webp' && hasJpgOrPng) {
      // É um .webp gerado de um .png/.jpg existente; não usamos como fonte
      continue;
    }

    const statSource = fs.statSync(filePath);
    totalOriginalBytes += statSource.size;

    const webpPath = `${baseName}.webp`;
    const avifPath = `${baseName}.avif`;

    // Verificar WebP
    let needWebp = ext !== '.webp';
    if (needWebp && fs.existsSync(webpPath)) {
      const statWebp = fs.statSync(webpPath);
      if (statWebp.mtimeMs >= statSource.mtimeMs) {
        needWebp = false;
      }
    }

    // Verificar AVIF
    let needAvif = ext !== '.avif';
    if (needAvif && fs.existsSync(avifPath)) {
      const statAvif = fs.statSync(avifPath);
      if (statAvif.mtimeMs >= statSource.mtimeMs) {
        needAvif = false;
      }
    }

    if (!needWebp && !needAvif) {
      countSkipped++;
    } else {
      const relPath = path.relative(ROOT, filePath);
      console.log(`[Processando] ${relPath}...`);
      countProcessed++;

      try {
        if (needWebp) {
          await sharp(filePath)
            .webp({ quality: WEBP_QUALITY, effort: 6 })
            .toFile(webpPath);
        }
        if (needAvif) {
          await sharp(filePath)
            .avif({ quality: AVIF_QUALITY, effort: 4 })
            .toFile(avifPath);
        }
      } catch (err) {
        console.error(`[ERRO] Falha ao converter ${filePath}:`, err.message);
      }
    }

    // Contabilizar tamanhos finais
    if (fs.existsSync(webpPath)) {
      totalWebpBytes += fs.statSync(webpPath).size;
    } else {
      totalWebpBytes += statSource.size;
    }

    if (fs.existsSync(avifPath)) {
      totalAvifBytes += fs.statSync(avifPath).size;
    } else {
      totalAvifBytes += statSource.size;
    }
  }

  const origMB = (totalOriginalBytes / (1024 * 1024)).toFixed(2);
  const webpMB = (totalWebpBytes / (1024 * 1024)).toFixed(2);
  const avifMB = (totalAvifBytes / (1024 * 1024)).toFixed(2);

  const redWebp = (((totalOriginalBytes - totalWebpBytes) / totalOriginalBytes) * 100).toFixed(1);
  const redAvif = (((totalOriginalBytes - totalAvifBytes) / totalOriginalBytes) * 100).toFixed(1);

  console.log('----------------------------------------------------');
  console.log('                  RESULTADO FINAL                   ');
  console.log('----------------------------------------------------');
  console.log(`Arquivos analisados   : ${countProcessed + countSkipped}`);
  console.log(`Arquivos processados  : ${countProcessed}`);
  console.log(`Arquivos inalterados  : ${countSkipped} (já otimizados)`);
  console.log('----------------------------------------------------');
  console.log(`Tamanho Original total: ${origMB} MB`);
  console.log(`Tamanho total WebP    : ${webpMB} MB (${redWebp >= 0 ? '-' + redWebp : '+' + Math.abs(redWebp)}%)`);
  console.log(`Tamanho total AVIF    : ${avifMB} MB (${redAvif >= 0 ? '-' + redAvif : '+' + Math.abs(redAvif)}%)`);
  console.log('====================================================');
  console.log('[OK] Imagens otimizadas com sucesso ao lado dos originais.');
}

optimizeImages();
