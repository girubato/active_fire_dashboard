# Active Fire Dashboard

Real-time global wildfire tracker built on NASA FIRMS satellite data. Displays VIIRS (Suomi NPP) fire detections on an interactive Leaflet map with filtering, confidence distribution, and FRP-based heat visualization.

![Node.js](https://img.shields.io/badge/Node.js-20-green) ![Express](https://img.shields.io/badge/Express-4-blue) ![Leaflet](https://img.shields.io/badge/Leaflet-1.9-brightgreen)

## Features

- Interactive map with ~40,000+ daily fire detections plotted by fire radiative power (FRP)
- Filter by time window (24h / 48h / 7d), confidence level, and day/night observation
- Sidebar with summary metrics, confidence distribution chart, and top FRP detections
- Click any detection for coordinates, brightness, satellite, and acquisition time
- Backend proxy with 5-minute cache to bypass CORS and reduce NASA API load
- Falls back to representative sample data if the backend is unreachable

## Tech Stack

- **Frontend:** Vanilla JS, Leaflet, CARTO basemap tiles, IBM Plex Sans/Mono
- **Backend:** Node.js, Express
- **Data:** [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) VIIRS C2 (Suomi NPP)

## Quick Start

```bash
git clone git@github.com:girubato/active_fire_dashboard.git
cd active_fire_dashboard
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## API

| Endpoint | Description |
|---|---|
| `GET /api/fires?range=24h\|48h\|7d` | Proxied NASA FIRMS CSV data |
| `GET /api/health` | Server uptime and cache status |

Response headers include `X-Cache` (`HIT`, `MISS`, or `STALE`) and `X-Cache-Age` (seconds).

## Deploy

**Render** — connect the repo and it picks up `render.yaml` automatically.

**Railway / Heroku** — uses the `Procfile`. Set the `PORT` env var if needed (defaults to 3000).

## Project Structure

```
├── server.js                 # Express server + NASA FIRMS proxy + cache
├── public/
│   └── index.html            # Dashboard frontend
├── wildfire-tracker.html     # Original standalone version (no backend needed)
├── render.yaml               # Render deployment config
├── Procfile                  # Railway/Heroku deployment config
└── package.json
```

## Data Source

Fire data is sourced from NASA's Fire Information for Resource Management System (FIRMS), using the VIIRS instrument aboard the Suomi NPP satellite. Data refreshes every few hours from NASA; the backend caches responses for 5 minutes.

## License

ISC
