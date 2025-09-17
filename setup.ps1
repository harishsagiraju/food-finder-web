$ErrorActionPreference = 'Stop'

Write-Host 'Creating virtual environment (.venv)...'
py -m venv .venv

Write-Host 'Ensuring pip is available in venv...'
& .\.venv\Scripts\python.exe -m ensurepip --upgrade

Write-Host 'Upgrading pip...'
& .\.venv\Scripts\python.exe -m pip install --upgrade pip

Write-Host 'Installing requirements...'
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt

Write-Host 'Verifying import and downloading VADER lexicon if needed...'
& .\.venv\Scripts\python.exe -c "import app; print('IMPORT_OK')"

Write-Host 'Setup complete.'


