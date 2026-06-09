# 🌱 Smart Farm Field Intelligence Platform

Welcome to the **Smart Farm Field Intelligence Platform**! This is an advanced, data-driven agricultural intelligence suite designed specifically for farm managers, agronomists, and modern agricultural enterprises. 

By aggregating real-time weather forecasting, historical soil data, satellite NDVI imagery, and spatial analytics into a single cohesive dashboard, this platform delivers actionable insights that maximize crop yield, minimize risk, and optimize resource usage across hundreds of hectares.

---

## 📸 Screenshots

### 📊 Operations Dashboard
![Dashboard Mockup](./screenshots/dashboard.png)
*A sleek, modern agricultural dashboard web application UI in dark mode displaying live health metrics and forecasting data.*

### 🗺️ Satellite NDVI Map View
![Map View Mockup](./screenshots/map.png)
*Satellite map view of farm fields with colorful NDVI heat map overlays directly integrated via Sentinel Hub.*

### 📈 Deep Analysis Reports
![Analysis Mockup](./screenshots/analysis.png)
*Detailed soil and weather analysis reports with historical trends and heuristic-driven alert cards.*

---

## 🚀 Core Intelligence Modules

This platform isn't just a basic CRUD app; it's composed of 14 complex intelligence modules:

1. **Authentication & User Management**: Secure JWT-based authentication ensuring field data remains strictly confidential to the farm owner.
2. **Interactive Field Mapping**: Users can draw or import field boundaries using GeoJSON polygons. The system automatically calculates total acreage and centroid coordinates.
3. **Real-time Weather Integration**: Live weather data ingested via the OpenWeather API for precise local conditions.
4. **7-Day Weather Forecasting**: Essential for scheduling irrigation and pesticide applications.
5. **Soil Composition Analysis**: Tracks vital macronutrients (NPK), pH balances, organic carbon, and moisture levels in the topsoil.
6. **Soil Trend & History Tracking**: Stores historical soil data to detect long-term degradation, allowing for proactive soil rehabilitation.
7. **Crop Suitability Engine**: An intelligent algorithm that matches potential crops to a specific field's soil health and weather profile to ensure maximum yield.
8. **Irrigation Planning Model**: A forward-projection water balance model based on evapotranspiration (ET) data and NASA POWER inputs.
9. **NDVI Satellite Imagery**: Direct integration with Sentinel Hub for real-time vegetative health mapping to spot crop stress before it's visible to the naked eye.
10. **Custom Fertilizer Recommendations**: Calculates specific NPK deficit requirements for targeted crops based on the latest soil samples.
11. **Dynamic Pest Risk Assessment**: Heuristic modeling that predicts pest outbreaks based on humidity, temperature thresholds, and seasonal timing.
12. **Comprehensive Farm Risk Alerts**: Proactive dashboard alerts for impending weather anomalies or critical soil deficiencies.
13. **Nearest Branch Locator**: Utilizes PostgreSQL/PostGIS spatial queries (or fallback Haversine calculations) to find nearby agricultural supply branches.
14. **Product Price Comparison**: Real-time price comparison engine for nearby agricultural supplies to optimize operational budgets.

---

## 🛠️ Architecture & Tech Stack

This platform follows a strict decoupling of frontend and backend services to ensure horizontal scalability.

### Backend (Node.js REST API)
- **Framework**: Node.js with Express.js
- **Language**: TypeScript (strict mode)
- **Architecture**: Controller-Service-Repository pattern
- **Database**: PostgreSQL with **PostGIS** for spatial data processing. Raw SQL queries are used for optimized execution.
- **Testing**: Jest & Supertest

### Frontend (React SPA)
- **Framework**: React via Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS & Custom CSS
- **Mapping**: Mapbox GL JS or Leaflet for GeoJSON rendering

### External Providers
- **Weather Data**: OpenWeather API
- **Satellite Data**: Sentinel Hub API
- **Historical Climate Data**: NASA POWER API

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: v20.x or higher
- **PostgreSQL**: v14+ (Ensure the `PostGIS` extension is enabled in your database)
- **Git**

---

## 💻 Installation & Setup

Follow these steps to get the development environment running locally:

```bash
# 1. Clone the repository
git clone <repo>
cd smart-farm-platform

# 2. Backend Setup
cd backend
npm install
cp .env.example .env

# -> STOP: Edit backend/.env with your API keys (see Environment Variables section below)

# Initialize the Database

# Start the backend development server
npm run dev

# 3. Frontend Setup
cd ../frontend
npm install
cp .env.example .env

# -> STOP: Edit frontend/.env with your API URL if necessary

# Start the frontend development server
npm run dev
```

---

## 🔐 Environment Variables

You must configure the following environment variables for the application to function correctly. 

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | API Server Port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Individual DB connection params | `localhost`, `5432`, `smart_farm_db`, etc. |
| `JWT_SECRET` | Secret key for signing authentication tokens | `super_secret_string_123` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:5173` |
| `OPENWEATHER_API_KEY` | Key for OpenWeather API access | `fcecefcd...` |
| `OPENWEATHER_BASE_URL` | Base URL for OpenWeather endpoints | `https://api.openweathermap.org/data/2.5` |
| `SENTINEL_HUB_CLIENT_ID` | OAuth Client ID for Sentinel Hub (NDVI) | `a35d820b-...` |
| `SENTINEL_HUB_CLIENT_SECRET`| OAuth Client Secret for Sentinel Hub | `KTV5PVvA...` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | The base URL pointing to the backend API | `http://localhost:5000/api` |

*(Note: In Vite, only variables prefixed with `VITE_` are exposed to the client bundle).*

---

## 📂 Project Structure

```text
smart-farm-platform/
├── backend/                  # Node.js backend
│   ├── src/
│   │   ├── config/           # Database pools and environment loader
│   │   ├── controllers/      # Express route handlers processing req/res
│   │   ├── services/         # Core business logic (Heuristics, API integrations)
│   │   ├── repositories/     # Data access layer (Raw PostgreSQL queries)
│   │   ├── routes/           # RESTful route definitions
│   │   ├── middlewares/      # JWT auth and validation middleware
│   │   ├── db/               # init.sql schemas and migrations
│   │   └── data/             # Static reference datasets (crops, pests, etc.)
│   ├── tests/                # Comprehensive Jest test suite
│   ├── .env.example          # Backend environment template
│   └── API_DOCS.md           # Full API Endpoint Documentation
├── frontend/                 # React UI Application
│   ├── src/                  # React components, pages, hooks, and services
│   ├── public/               # Static assets
│   ├── .env.example          # Frontend environment template
│   └── index.html            # Entry point
├── screenshots/              # UI Mockups and Screenshots for documentation
├── CONTRIBUTING.md           # Contribution guidelines (PRs, Commits, Styles)
└── README.md                 # Project documentation
```

---

## 📖 API Documentation

We provide extensive documentation for all REST API endpoints, including required payloads, authentication headers, and example JSON responses.

👉 **[View Full API Documentation](./backend/API_DOCS.md)**

---

## 🚢 Deployment Instructions

### Deploying the Backend
1. Provision a PostgreSQL database (e.g., AWS RDS, Supabase, Render) and ensure PostGIS is enabled.
2. Run the SQL initialization scripts against your production database.
3. Set all required environment variables in your hosting provider (e.g., Heroku, Render, AWS ECS).
4. Run `npm run build` to compile TypeScript to JavaScript.
5. Start the production server using `npm start`.

### Deploying the Frontend
1. Set `VITE_API_URL` to your production backend URL in your build environment.
2. Run `npm run build` to generate the static optimized bundle in the `dist` directory.
3. Serve the static files using Nginx, AWS CloudFront, Vercel, or Netlify.

---

## 🤝 Contributing

We welcome contributions from the community! Please read our **[Contributing Guidelines](./CONTRIBUTING.md)** for details on our code of conduct, branch naming conventions, and the pull request process.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
