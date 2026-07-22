import https from 'https';
import * as XLSX from 'xlsx';

const downloadUrl = 'https://prodeboffice365-my.sharepoint.com/:x:/g/personal/sdc_secti_ba_gov_br/IQCUmr5J0kxUQLKb9lRqZkT_AVOgJRieO_TN9lJiRxUzXI8?download=1&action=default&web=0';

function safeKey(k) {
  return String(k || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

https.get(downloadUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
}, (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400) {
    let redirectUrl = res.headers.location;
    if (redirectUrl.startsWith('/')) redirectUrl = `https://prodeboffice365-my.sharepoint.com${redirectUrl}`;
    const cookies = res.headers['set-cookie'];
    const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    if (cookies) headers['Cookie'] = cookies.map(c => c.split(';')[0]).join('; ');

    https.get(redirectUrl, { headers }, (response) => {
      handleResponse(response);
    });
  } else {
    handleResponse(res);
  }
});

function handleResponse(response) {
  const chunks = [];
  response.on('data', d => chunks.push(d));
  response.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const workbook = XLSX.read(buffer, { type: 'buffer' }); 
    console.log("Sheet names:");
    workbook.SheetNames.forEach(name => {
      const sheetNorm = safeKey(name);
      console.log(`- ${name} -> ${sheetNorm}`);
      if (['igpotenciais', 'igspotenciais', 'ig', 'igs'].some(t => sheetNorm.includes(t)) || sheetNorm === 'ig' || sheetNorm === 'igs' || sheetNorm.includes('indicacaogeografica')) {
          console.log(`\nFound IG sheet: ${name}`);
          const sheet = workbook.Sheets[name];
          const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          if (rawRows.length > 0) {
              console.log("Columns:", Object.keys(rawRows[0]));
              console.log("First row:", rawRows[0]);
              rawRows.forEach((row, i) => {
                  const safeKeys = {};
                  for (let k in row) safeKeys[safeKey(k)] = row[k];
                  console.log(`Row ${i} fonte raw:`, 
                    safeKeys['fontedosdados'] || safeKeys['fontedodado'] || safeKeys['fontededados'] || safeKeys['fontedados'] || safeKeys['fonte'] || safeKeys['fontes'] || safeKeys['linkdafonte'] || safeKeys['linkfonte'] || safeKeys['link'] || safeKeys['referencia'] || safeKeys['referencias'] || safeKeys['origem'] || safeKeys['origemdosdados'] || safeKeys['sitedaig'] || safeKeys['site'] || safeKeys['sitedosdados']
                  );
              });
          }
      }
    });
  });
}
