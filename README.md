# TypeShift

A small demo web project that serves static pages and a few simple API endpoints for learning and prototyping.

This repository contains a minimal Express server (`main.js`) and static front-end files in the `static/` folder. The front-end demonstrates:
- a Leaflet map and weather display
- a Bootstrap-based navbar and responsive layout
- a News section populated from a local API
- a Currency rates section populated from a local API

---

## Quick Setup

Requirements:
- Node.js (v14+ recommended)
- npm

Steps:

1. Clone the repository (already in your workspace):

   git clone <repo>

2. Install dependencies and start the server:

   ```bash
   npm install
   node main.js
   ```

3. Open the app in your browser:

   - http://localhost:3000/static/index.html

Notes:
- If you don't have `express` installed globally, `npm install` will install dependencies defined in `package.json`.
- The server listens on port `3000` by default.

---

## Available API Endpoints

All API endpoints are served by the Express app in `main.js`.

- GET `/api/news`
  - Returns a JSON object with news articles about Georgia.
  - Currently served from `static/news-georgia.json`.
  - Example response shape:

```json
{
  "source": "local-sample",
  "region": "Georgia, US",
  "articles": [ { "title": "...", "description": "...", "url": "...", "source": "...", "publishedAt": "2025-12-20T09:30:00Z" } ]
}
```

- GET `/api/currency`
  - Returns sample currency rates (base USD) from `static/currency-sample.json`.
  - Example response shape:

```json
{
  "base": "USD",
  "date": "2025-12-23",
  "rates": { "EUR": 0.92, "GEL": 2.55 }
}
```

- GET `/api/weather?lat=<lat>&lon=<lon>`
  - Proxies to OpenWeatherMap with your API key from `main.js` (`API_KEY` constant).
  - Returns OpenWeatherMap's current weather JSON (units=metric, lang=ru in the current code).
  - Example: `/api/weather?lat=33.7501&lon=-84.3885`

- POST `/api/calc?weight=<kg>&height=<cm>`
  - Calculates BMI from `weight` (kg) and `height` (cm) and returns category and BMI value.
  - Example: `POST /api/calc?weight=70&height=175`

---

## Front-end Integration

The front-end lives in `static/index.html` and demonstrates how to consume the above APIs:

- Weather:
  - Leaflet map is shown in `#map` and the application calls `/api/weather` for coordinates and weather details.
  - The script renders a Bootstrap card in `#weather` with the returned data.

- News:
  - The page fetches `/api/news` and renders article cards into `#news`.

- Currency:
  - The page fetches `/api/currency` and renders rate cards into `#currency`.

Example fetch from the front-end (browser):

```js
fetch('/api/news')
  .then(r => r.json())
  .then(data => console.log(data));
```

---

![API /currency](/currency.png)
---
![API /news](/news.png)
---
![API /weather](/weather.png)
