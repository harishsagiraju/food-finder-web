import os
from typing import Dict

from flask import Flask, render_template, request, jsonify


def create_app() -> Flask:
    app = Flask(__name__)

    # Lazy import to keep startup fast if nltk isn't installed yet
    import nltkl
    from nltk.sentiment import SentimentIntensityAnalyzer

    def ensure_vader_lexicon() -> None:
        try:
            nltk.data.find("sentiment/vader_lexicon.zip")
        except LookupError:
            nltk.download("vader_lexicon")

    ensure_vader_lexicon()
    sentiment_analyzer = SentimentIntensityAnalyzer()

    def classify_compound_score(score: float) -> str:
        if score >= 0.05:
            return "positive"
        if score <= -0.05:
            return "negative"
        return "neutral"

    @app.route("/", methods=["GET"])
    def index():
        return render_template("index.html")

    @app.route("/analyze", methods=["POST"])  # form submission from the UI
    def analyze():
        text: str = request.form.get("text", "").strip()
        if not text:
            return render_template(
                "index.html", error="Please enter some text to analyze."
            )
        scores: Dict[str, float] = sentiment_analyzer.polarity_scores(text)
        label = classify_compound_score(scores.get("compound", 0.0))
        return render_template("index.html", text=text, scores=scores, label=label)

    @app.route("/api/sentiment", methods=["POST"])  # JSON API
    def api_sentiment():
        data = request.get_json(silent=True) or {}
        text = str(data.get("text", "")).strip()
        if not text:
            return jsonify({"error": "Field 'text' is required."}), 400
        scores: Dict[str, float] = sentiment_analyzer.polarity_scores(text)
        label = classify_compound_score(scores.get("compound", 0.0))
        return jsonify({"label": label, "scores": scores})

    @app.route("/health", methods=["GET"])  # basic health check
    def health():
        return jsonify({"status": "ok"})

    return app


app = create_app()

if __name__ == "__main__":
    # For local development. For production on Windows, prefer running with waitress:
    #   py -m pip install waitress
    #   py -m waitress --host=0.0.0.0 --port=5000 app:app
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)


