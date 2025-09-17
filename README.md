# Sentiment Analyzer (Windows-friendly)

VADER sentiment analysis web app with Flask. Includes a browser UI and a JSON API.

## Setup (Windows PowerShell)

```powershell
cd "$PSScriptRoot"  # ensure you're in the project folder
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install --upgrade pip
py -m pip install -r requirements.txt
```

The first run downloads the VADER lexicon automatically.

## Run (development)

```powershell
py app.py
```

Open `http://127.0.0.1:5000` in your browser.

## Run (production, Windows)

```powershell
py -m pip install waitress
py -m waitress --host=0.0.0.0 --port=5000 app:app
```

## API

POST `http://127.0.0.1:5000/api/sentiment`

```json
{"text": "I love this product!"}
```

Response:

```json
{
  "label": "positive",
  "scores": {"neg": 0.0, "neu": 0.341, "pos": 0.659, "compound": 0.8481}
}
```




