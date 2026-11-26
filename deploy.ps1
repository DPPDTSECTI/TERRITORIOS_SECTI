
$ErrorActionPreference = "Stop"

$SERVER = "secti-gustavo@72.61.132.112"
$REMOTE_DIR = "/var/www/territorios-secti"

Write-Host "`n=== 1/4: Executando testes ===" -ForegroundColor Cyan
npm test -- --run
if ($LASTEXITCODE -ne 0) { throw "Testes falharam." }

Write-Host "`n=== 2/4: Gerando build ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build falhou." }

Write-Host "`n=== 3/4: Enviando arquivos ===" -ForegroundColor Cyan
scp -r dist/* "${SERVER}:${REMOTE_DIR}/"
if ($LASTEXITCODE -ne 0) { throw "Upload falhou." }

Write-Host "`n=== 4/4: Ajustando permissoes ===" -ForegroundColor Cyan
ssh $SERVER "find $REMOTE_DIR -type d -exec chmod 755 {} \; && find $REMOTE_DIR -type f -exec chmod 644 {} \;"
if ($LASTEXITCODE -ne 0) { throw "Ajuste de permissoes falhou." }

Write-Host "`nDEPLOY CONCLUIDO!" -ForegroundColor Green
Write-Host "https://observatoriocti.secti.ba.gov.br/territorios/" -ForegroundColor Green
