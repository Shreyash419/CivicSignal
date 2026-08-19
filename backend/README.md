# CivicSignal Firebase Backend

This is the dedicated Firebase Cloud Functions backend for the CivicSignal BRICS AI Governance Platform.

## 🚀 Getting Started

### 1. Local Development (Standalone Server)
To run the backend on `http://localhost:5001`:

```bash
cd functions
npm run dev:server
```

### 2. Firebase Emulator (with Cloud Functions & Firestore)
To run the full Firebase suite:

```bash
cd functions
npm run build
cd ..
firebase emulators:start
```

The Firestore Emulator UI will be available at `http://localhost:4000`.

---

## 📡 API Endpoints

- `GET  /api/health` — Health check
- `POST /api/complaints` — Submit citizen complaint (AI-classified)
- `GET  /api/complaints/my` — Get authenticated citizen's complaints
- `GET  /api/complaints/:id` — Get single complaint details
- `GET  /api/governance/overview` — Dashboard KPI summary
- `GET  /api/governance/hotspots` — Geospatial demand hotspots
- `GET  /api/governance/analytics` — Time-series & breakdown analytics
- `GET  /api/governance/infrastructure` — Infrastructure gap analysis
- `GET  /api/governance/recommendations` — AI policy recommendations
- `GET  /api/regions` — BRICS regions dataset
- `GET  /api/plans` — Government infrastructure plans
- `GET  /api/citizen/dashboard` — Citizen dashboard metrics
- `GET  /api/areas/:regionId` — Area overview & local gap analysis
