# Database Integration Guide

`Desert Stress Monitor` supports three database tiers in order of preference:

1. **Aiven Cloud PostgreSQL** (primary production target)
2. **Local PostgreSQL** (development fallback)
3. **In-memory store** (zero-config fallback for testing/demos)

The server tries each tier automatically at startup. You do not need to change code to switch between them—only the `.env` file.

────────────────────────────────────────────────────────────────
## 1. Aiven Cloud PostgreSQL (Primary)
────────────────────────────────────────────────────────────────

This is the default target. The server first attempts to connect to the values under `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.

### Aiven Console steps

1. Log in to https://console.aiven.io/ and open your PostgreSQL service.
2. Go to **Overview** and copy the **Service URI** or the individual connection fields.
3. Fill the `.env` file:

```env
DB_HOST=your_aiven_host.aivencloud.com
DB_PORT=18473
DB_NAME=your_database
DB_USER=your_db_user
DB_PASSWORD=your_aiven_password
DB_SSL=true
```

4. Start the server:

```bash
npm run server:dev
```

When connected, the server will log:

```
[INFO] Connected to PostgreSQL (Aiven)
```

### SSL / CA certificate (Aiven)

If Aiven requires a custom CA certificate, download the CA from the Aiven Console **Overview** page and save it as `server/config/ca.pem`. Then update `server/config/database.js` to point `ssl.ca` at that file.

```js
ssl: {
  rejectUnauthorized: true,
  ca: readFileSync(join(__dirname, 'ca.pem'))
}
```

For most Aiven services, `ssl: { rejectUnauthorized: false }` is sufficient for development.

────────────────────────────────────────────────────────────────
## 2. Local PostgreSQL (Fallback)
────────────────────────────────────────────────────────────────

If Aiven is unreachable or blank, the server tries the `LOCAL_DB_*` variables.

### Install PostgreSQL locally

**Ubuntu / Debian**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS (Homebrew)**
```bash
brew install postgresql
brew services start postgresql
```

**Windows**
Download the installer from https://www.postgresql.org/download/windows/ and run it.

### Create the database and user

```bash
sudo -u postgres psql -c "CREATE DATABASE desert_stress_monitor;"
sudo -u postgres psql -c "CREATE USER dsm WITH PASSWORD 'your_local_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE desert_stress_monitor TO dsm;"
```

### Configure `.env`

```env
DB_HOST=                     # leave blank to skip Aiven
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=5432
LOCAL_DB_NAME=desert_stress_monitor
LOCAL_DB_USER=dsm
LOCAL_DB_PASSWORD=your_local_password
LOCAL_DB_SSL=false
```

When connected, the server will log:

```
[INFO] Connected to PostgreSQL (local)
```

────────────────────────────────────────────────────────────────
## 3. In-Memory Store (Zero-Config Fallback)
────────────────────────────────────────────────────────────────

If **both** Aiven and local PostgreSQL fail, the server automatically falls back to an in-memory store. This is perfect for demos, testing, or when you just want to see the UI without installing a database.

Data is lost when the server restarts, but all CRUD, search, and auth features still work.

```
[WARN] PostgreSQL unavailable, falling back to in-memory store
```

────────────────────────────────────────────────────────────────
## Schema Tables
────────────────────────────────────────────────────────────────

When PostgreSQL is used, the server creates the following tables automatically on startup:

- `users`            – operator accounts and roles
- `subjects`         – humans and camels being monitored
- `devices`          – ESP32-S3 LoRa nodes
- `telemetry`        – incoming LoRa telemetry packets
- `alerts`           – generated alerts (stress, hyperthermia, offline)
- `ai_models`        – registered ML models
- `datasets`         – training datasets
- `firmware`         – firmware versions and patch notes
- `inference_logs`   – per-inference audit logs

A default admin user is seeded if `users` is empty. Credentials are controlled by `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

────────────────────────────────────────────────────────────────
## Switching Between Database Modes
────────────────────────────────────────────────────────────────

| Mode     | How to enable                                                   |
|----------|-----------------------------------------------------------------|
| Aiven    | Fill `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`  |
| Local PG | Leave `DB_HOST` blank, fill `LOCAL_DB_*`                        |
| Memory   | Leave all DB fields blank or make both Aiven/local unreachable  |

No code changes are required. Restart the server after editing `.env`.

────────────────────────────────────────────────────────────────
## Troubleshooting
────────────────────────────────────────────────────────────────

### Connection refused
- Check that the host/port are correct.
- Verify the database service is running.

### Authentication failed
- Verify `DB_USER` / `DB_PASSWORD` or `LOCAL_DB_USER` / `LOCAL_DB_PASSWORD`.
- For local PostgreSQL, make sure the user has the correct password and privileges.

### SSL errors (Aiven)
- Set `DB_SSL=true`.
- If `rejectUnauthorized: true` fails, download the Aiven CA and update `server/config/database.js` to use it.

### Data resets unexpectedly
- You are likely using the in-memory store. PostgreSQL must be reachable for persistence.
