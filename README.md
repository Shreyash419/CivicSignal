# BRICS AI Governance Platform

An AI-powered Digital Public Infrastructure platform that transforms multilingual citizen feedback into actionable infrastructure priorities, demand hotspots, analytics, and future government policy recommendations across BRICS nations.

---

## 🏛️ Architecture Overview

```text
brics-governance/
│
├── frontend/                         # Next.js + TypeScript + Tailwind CSS
│   ├── app/
│   │   ├── page.tsx                  # Landing page
│   │   ├── citizen/                  # Citizen Portal
│   │   │   ├── page.tsx              # Citizen dashboard
│   │   │   ├── complain/page.tsx     # Complaint submission (Text/Voice/Image)
│   │   │   ├── complaints/page.tsx   # My complaints & tracking
│   │   │   ├── area/page.tsx         # Area-level issue breakdown & gaps
│   │   │   └── plans/page.tsx        # Local government projects
│   │   └── governance/               # Governance Analytics Dashboard
│   │       ├── page.tsx              # Governance overview & hotspot KPI summary
│   │       ├── hotspots/page.tsx     # Geospatial demand hotspot map
│   │       ├── analytics/page.tsx    # Multi-dimensional analytics & charts
│   │       ├── recommendations/page.tsx # Explainable AI policy recommendations
│   │       └── plans/page.tsx        # Demand vs. Investment alignment
│   │
│   ├── components/                   # Modular React components
│   │   ├── landing/                  # Landing page components
│   │   ├── citizen/                  # Citizen portal components
│   │   ├── governance/               # Governance sidebar & widgets
│   │   ├── maps/                     # Map visualizations
│   │   └── ui/                       # Reusable UI primitives
│   │
│   ├── lib/
│   │   ├── api.ts                    # Centralized API abstraction layer
│   │   ├── mockData.ts               # BRICS dataset & realistic mock state
│   │   └── utils.ts                  # Styling and formatting utilities
│   │
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   │
│   ├── public/                       # Static assets
│   ├── package.json
│   └── .env.local
│
├── backend/                          # FastAPI + Python
│   ├── app/
│   │   ├── main.py                   # FastAPI application entrypoint
│   │   ├── routes/                   # API endpoint routers
│   │   │   ├── complaints.py
│   │   │   ├── dashboard.py
│   │   │   ├── analytics.py
│   │   │   └── recommendations.py
│   │   ├── services/                 # AI & core computation services
│   │   │   ├── gemini.py             # Gemini Multilingual AI classification
│   │   │   ├── priority.py           # Multi-factor priority scoring engine
│   │   │   └── data.py               # Data retrieval & fusion
│   │   └── models/                   # Pydantic schemas & database models
│   ├── requirements.txt
│   └── .env
│
├── data/
│   ├── raw/                          # Raw citizen complaints & surveys
│   ├── processed/                    # Normalized & geocoded datasets
│   └── scripts/                      # ETL & data generation scripts
│
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
