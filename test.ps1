$ErrorActionPreference = 'Stop'

$port = 5001
$base = "http://127.0.0.1:$port"

function Test-Endpoint {
  param([string]$Url)
  try {
    $res = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 5
    return $true
  } catch {
    return $false
  }
}

if (-not (Test-Path .\.venv\Scripts\python.exe)) {
  Write-Host 'Virtual environment not found. Running setup...'
  & powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\setup.ps1
}

Start-Process -NoNewWindow -FilePath .\.venv\Scripts\python.exe -ArgumentList "-m","waitress","--host=127.0.0.1","--port=$port","app:app"
Start-Sleep -Seconds 2

Write-Host "Checking $base/health"
if (-not (Test-Endpoint "$base/health")) {
  Write-Error "Health endpoint failed"
  exit 1
}

Write-Host "Posting to $base/api/sentiment"
$body = @{ text = "I love this product!" } | ConvertTo-Json
$resp = Invoke-RestMethod -Method Post -Uri "$base/api/sentiment" -ContentType 'application/json' -Body $body -TimeoutSec 5
$resp | ConvertTo-Json -Depth 5 | Write-Output

Write-Host "Test complete."




