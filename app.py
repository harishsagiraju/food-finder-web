from flask import Flask, render_template, request, jsonify
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk

app = Flask(__name__)


def _ensure_vader_lexicon_downloaded() -> None:
	"""Ensure the VADER lexicon is available; download if missing."""
	try:
		nltk.data.find('sentiment/vader_lexicon.zip')
	except LookupError:
		nltk.download('vader_lexicon')


sentiment_analyzer: SentimentIntensityAnalyzer | None = None


@app.before_first_request
def initialize_sentiment_analyzer() -> None:
	global sentiment_analyzer
	_ensure_vader_lexicon_downloaded()
	sentiment_analyzer = SentimentIntensityAnalyzer()


@app.route("/")
def index():
	return render_template("index.html")


@app.post("/analyze")
def analyze_text():
	data = request.get_json(silent=True) or {}
	text = (data.get("text") or "").strip()
	if not text:
		return jsonify({"error": "Text is required."}), 400

	assert sentiment_analyzer is not None, "Sentiment analyzer not initialized"
	scores = sentiment_analyzer.polarity_scores(text)
	compound = scores.get("compound", 0.0)
	label = (
		"Positive" if compound >= 0.05 else ("Negative" if compound <= -0.05 else "Neutral")
	)
	return jsonify({"scores": scores, "label": label})


if __name__ == "__main__":
	app.run(debug=True)


