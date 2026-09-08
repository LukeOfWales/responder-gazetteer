# Responder Gazetteer

A web-based mapping and operational awareness tool for volunteer emergency responders in South East Wales.

## Overview

This application aggregates publicly available geographic information and presents it on an interactive map, allowing responders to quickly locate critical infrastructure, emergency services, staging locations, and operational support facilities.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Mapping:** Leaflet + MapLibre GL + OpenStreetMap
- **State:** Zustand
- **Styling:** TailwindCSS
- **Deployment:** GitHub Pages

## Getting Started

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```
responder-gazetteer/
├── src/
│   ├── components/      # React components
│   ├── store.ts         # Zustand state management
│   ├── types/           # TypeScript type definitions
│   ├── data/            # Static data files (generated)
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── spec.md              # Project specification
├── package.json
└── vite.config.ts
```

## Development

### Data Pipeline

Data is fetched from OpenStreetMap via Overpass API and served as static JSON files:

- `data/hospitals.json`
- `data/firestations.json`
- `data/police.json`
- `data/fuel.json`
- `data/ambulance.json`
- `data/mountain_rescue.json`

### Routing

Distance and travel time calculations use OSRM or GraphHopper APIs.

### Offline Support

Service workers cache map tiles and gazetteer data for offline operation.

## Deployment

Deployed to GitHub Pages via GitHub Actions. See `.github/workflows/deploy.yml`.

## License

MIT