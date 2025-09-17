# Sentiment Analysis (Java Spring Boot)

Simple rule-based sentiment analysis web app using Java and Spring Boot. No external ML modules required.

## Prerequisites

- Java 17 (or newer) installed and on PATH (check with `java -version`).
- Maven installed (check with `mvn -v`). If you don't have Maven, you can use the Maven Wrapper once the project is built locally, but installing Maven is easiest on Windows.

## Run (Windows PowerShell)

```powershell
mvn spring-boot:run
```

Then open `http://localhost:8080` in your browser.

## Build Jar

```powershell
mvn clean package
```

Run the jar:

```powershell
java -jar target/sentiment-analysis-0.0.1-SNAPSHOT.jar
```

## API

- POST `/api/analyze`
  - Request JSON: `{ "text": "I love this product, it's amazing!" }`
  - Response JSON: `{ "label": "positive", "score": 2, "positiveCount": 2, "negativeCount": 0 }`

## Notes

This uses a small keyword list for positive/negative words. You can expand the word lists in `SentimentService`.


