# Desert Stress Monitor (DSM-CONTROL)

Full-stack React + Express + PostgreSQL monitoring dashboard for camel and human stress tracking in harsh desert environments.

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Leaflet, Wouter, React Hook Form, Zod
- **Backend:** Express 5, WebSocket, JWT auth, Pino logging
- **Database:** PostgreSQL via Aiven Cloud (primary) or local PostgreSQL (fallback) or in-memory (last-resort fallback)
- **Real-time:** WebSocket gateway alerts + telemetry feed
- **Protocol:** LoRa 915 MHz private packet telemetry

## Quick Start

1. Install all dependencies:
   ```bash
   npm run setup
   ```

2. Copy the environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

3. Start the dev stack (server + client):
   ```bash
   npm run dev
   ```
   - API runs on http://localhost:3001
   - Client runs on http://localhost:5173

## Default Login

In development, if you leave `ADMIN_EMAIL` and `ADMIN_PASSWORD` empty in `.env`, the server generates a one-time admin account automatically. The generated credentials are printed in the server startup log.

You can override them with `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

> **Production note:** In `NODE_ENV=production`, both `ADMIN_EMAIL` and `ADMIN_PASSWORD` are required, and the password must be at least 8 characters. Leaving them unset in production will cause the server to exit on startup.

## Features

- Real-time dashboard with stress distribution charts and live subject feed
- Live map with color-coded stress markers
- Telemetry analytics and charting
- Subject and device management (CRUD + search)
- AI model registry with deploy-as-primary, edit, and delete
- Dataset registry with search, edit, and delete
- Firmware registry with search, edit, and delete
- Alert management with acknowledge/dismiss
- Inference health monitoring
- Dark / light mode toggle
- Smooth login animations with orbiting rings
- LoRa packet documentation in Help page

## Project Structure

```
my-fullstack-app/
├── client/                 # React frontend
├── server/                 # Express backend
├── shared/                 # Shared constants/validators
├── docs/                   # Extra documentation
└── package.json            # Root workspace scripts
```

See `DATABASE_INTEGRATION.md` for detailed PostgreSQL setup instructions.
