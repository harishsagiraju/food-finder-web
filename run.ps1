$ErrorActionPreference = 'Stop'

if (-not (Test-Path .\.venv\Scripts\python.exe)) {
  Write-Host 'Virtual environment not found. Running setup...'
  & powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\setup.ps1
}

Write-Host 'Starting server with waitress on http://127.0.0.1:5001'
& .\.venv\Scripts\python.exe -m waitress --host=127.0.0.1 --port=5001 app:app


