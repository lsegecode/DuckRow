# 📦 Proxmox LXC Deployment & Update Guide (DuckRow)

This guide documents the complete end-to-end procedure for deploying **DuckRow** into a Proxmox LXC container (running Docker & Docker Compose), connecting it to Microsoft SQL Server (`EmeWebAuth`), and managing code updates seamlessly without losing database records or configuration files.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [LXC Container Requirements](#-lxc-container-requirements)
3. [Initial Setup on Proxmox LXC](#-initial-setup-on-proxmox-lxc)
4. [Environment Configuration (`backend/.env`)](#-environment-configuration-backendenv)
5. [Building and Launching Services](#-building-and-launching-services)
6. [Updating Changes & Code Sync Procedure](#-updating-changes--code-sync-procedure)
7. [Useful Maintenance & Diagnostic Commands](#-useful-maintenance--diagnostic-commands)
8. [Troubleshooting & Gotchas](#-troubleshooting--gotchas)

---

## 🏗 Architecture Overview

DuckRow in production runs as a multi-container Docker Compose service inside a Proxmox LXC Debian/Ubuntu container:

- **Frontend Container (`frontend`)**:
  - React + TypeScript compiled static bundle served via high-performance **Nginx** on port `80`.
  - Reverse proxies `/api/`, `/media/`, and `/sso/` directly to the backend container (`backend:8000`).
- **Backend Container (`backend`)**:
  - Python 3.12 (Debian slim) running **Django REST Framework** managed by **Gunicorn** on port `8000`.
  - Includes official Microsoft ODBC Drivers 17 & 18 (`msodbcsql17`, `msodbcsql18`) to communicate with SQL Server (`EmeWebAuth`).
  - Automatically runs database migrations on startup.
- **Persistence**:
  - `./backend/db.sqlite3` is mounted directly if using SQLite.
  - `./backend/media` is mounted for uploaded ticket attachments and screenshots.
  - `./backend/role_overrides.json` is preserved on the host.

---

## 📋 LXC Container Requirements

When creating the LXC container in Proxmox VE:

| Resource | Recommended Value | Notes |
|---|---|---|
| **OS Template** | Debian 12 (Bookworm) or Ubuntu 22.04/24.04 LTS | Standard minimal template |
| **Cores** | 2 vCPUs | Sufficient for Gunicorn workers & builds |
| **RAM** | 2048 MB (2 GB) + 1 GB Swap | Recommended for Vite build step |
| **Disk** | 15 GB+ | Enough for Docker images & layers |
| **Features / Nesting** | **Nesting: Enabled**, **keyctl: Enabled** | **CRITICAL**: Required for Docker in LXC |
| **Network** | Static IP (e.g. `192.168.0.199/24`) with Gateway | Accessible in local LAN |

> [!IMPORTANT]
> In Proxmox VE web GUI, go to your container: **Options -> Features -> Edit -> Check "Nesting" and "keyctl"**. Without nesting, Docker daemon will fail to start inside LXC.

---

## 🚀 Initial Setup on Proxmox LXC

Access the LXC console (or connect via SSH: `ssh root@<LXC_IP>`):

### Step 1: Update system packages and install prerequisites
```bash
apt-get update && apt-get upgrade -y
apt-get install -y curl git ca-certificates gnupg nano
```

### Step 2: Install Docker Engine and Docker Compose Plugin
```bash
# Add Docker official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

# Add Docker repository to APT sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable and start Docker service
systemctl enable --now docker
```

### Step 3: Clone the DuckRow Repository
```bash
cd /root
git clone https://github.com/lsegecode/DuckRow.git
cd /root/DuckRow
```

---

## ⚙️ Environment Configuration (`backend/.env`)

The backend requires environment variables to connect to Microsoft SQL Server (`EmeWebAuth`), handle SSO tokens, and dispatch Teams webhook notifications.

Create or edit `/root/DuckRow/backend/.env`:

```bash
nano /root/DuckRow/backend/.env
```

Paste your configuration:

```ini
# Django Core Settings
SECRET_KEY=django-insecure-*-*vs4z#2b-qzwp=j!qwucji$9s70!#+rjqm@o97ea=mwr6z81
DEBUG=False

# Frontend URL (Must be the container's IP/domain on port 80 without port 5173)
FRONTEND_URL=http://192.168.0.199

# Database Configuration (Microsoft SQL Server -> EmeWebAuth schema tic)
DB_ENGINE=mssql
DB_NAME=EmeWebAuth
DB_USER=duckrow_app
DB_PASSWORD=YourDatabasePasswordHere!
DB_HOST=192.168.0.11
DB_PORT=1433
DB_SCHEMA=tic
DB_DRIVER=ODBC Driver 17 for SQL Server
DB_EXTRA_PARAMS=TrustServerCertificate=yes;

# Single Sign-On (SSO) with Home-Web EME Portal
HOME_WEB_SSO_SALT=duckrow-sso-auth

# Microsoft Teams Workflows Webhook URL (Power Automate)
TEAMS_WEBHOOK_URL=https://defaultd9e9780a43d0419c896b429a5f6669.46.environment.api.powerplatform.com:443/powerautomate/...
```

> [!WARNING]
> Ensure there are no duplicate keys or empty variables like `FRONTEND_URL=` at the end of the file. In production, `FRONTEND_URL` must point to `http://<LXC_IP>` (default HTTP port `80`), **not** `:5173`.

---

## 🚢 Building and Launching Services

From the project root `/root/DuckRow`:

```bash
cd /root/DuckRow

# Build container images and launch in detached mode
docker compose up -d --build
```

### Checking Status and Logs

- Verify running containers:
  ```bash
  docker compose ps
  ```
- View real-time backend startup logs (migrations & Gunicorn):
  ```bash
  docker compose logs -f backend
  ```
- View Nginx frontend logs:
  ```bash
  docker compose logs -f frontend
  ```

Now access DuckRow in your browser:
```text
http://192.168.0.199/
```

---

## 🔄 Updating Changes & Code Sync Procedure

Whenever developers push changes, bugfixes, or new features to the GitHub repository (`main` branch), follow this exact procedure to update the running LXC instance.

### Standard Update Workflow

Open a terminal or SSH into the LXC container:

```bash
# 1. Navigate to the project directory
cd /root/DuckRow

# 2. Pull the latest code changes from GitHub
git pull origin main

# 3. Rebuild images and restart containers with zero config loss
docker compose up -d --build
```

> [!TIP]
> `docker compose up -d --build` will:
> 1. Detect if code or Dockerfile has changed.
> 2. Recompile the React frontend (if frontend files changed).
> 3. Rebuild backend layers (if backend dependencies or files changed).
> 4. Run `python manage.py migrate` automatically upon backend container startup.
> 5. Swap the running containers with minimal downtime.
> 6. Preserve database connections, media files, and local `.env` settings.

---

### Handling Database Migrations Manually (Optional)

If a change introduces significant database model alterations and you want to trigger migrations manually inside the running backend container:

```bash
docker compose exec backend python manage.py migrate
```

---

### Handling Static Translations (i18n)

If you modify translation files (`.po` files in `backend/locale/`):

```bash
docker compose exec backend python manage.py compilemessages
docker compose restart backend
```

---

### Emergency: Reverting Changes

If an update breaks production and you need to roll back to the previous commit:

```bash
cd /root/DuckRow

# View recent commits
git log -n 5 --oneline

# Revert to a specific commit hash (replace <COMMIT_HASH>)
git checkout <COMMIT_HASH>

# Rebuild and restart containers
docker compose up -d --build
```

To switch back to the main branch later:
```bash
git checkout main
git pull origin main
docker compose up -d --build
```

---

## 🛠 Useful Maintenance & Diagnostic Commands

| Action | Command |
|---|---|
| **View logs (follow)** | `docker compose logs -f` |
| **View backend logs only** | `docker compose logs -f backend` |
| **Restart services** | `docker compose restart` |
| **Restart backend only** | `docker compose restart backend` |
| **Stop all containers** | `docker compose down` |
| **Open shell inside backend** | `docker compose exec -it backend sh` |
| **Open Django Shell** | `docker compose exec -it backend python manage.py shell` |
| **Check disk usage by Docker** | `docker system df` |
| **Clean dangling build cache** | `docker image prune -f` |

---

## ⚠️ Troubleshooting & Gotchas

### 1. SSO Redirects to Port 5173 Instead of 80
- **Cause**: `FRONTEND_URL` in `backend/.env` still contains `:5173` or has duplicate entries.
- **Fix**: Edit `backend/.env`, set `FRONTEND_URL=http://<LXC_IP>` (e.g. `http://192.168.0.199`), and restart backend:
  ```bash
  docker compose restart backend
  ```

### 2. Zero Tickets Shown / Database Connection Fails
- **Cause**: Missing ODBC driver or network unreachable to `192.168.0.11:1433`.
- **Diagnosis**: Run `docker compose logs backend` to inspect connection errors. Test connectivity from inside container:
  ```bash
  docker compose exec backend python -c "import pyodbc; print(pyodbc.drivers())"
  ```
  Ensure `'ODBC Driver 17 for SQL Server'` appears in the printed list.

### 3. Changes Not Showing After `git pull`
- **Cause**: Browser cache storing the previous frontend bundle.
- **Fix**: Perform a hard refresh in the browser (`Ctrl + Shift + R` or `Ctrl + F5`). If needed, force rebuild without cache:
  ```bash
  docker compose build --no-cache frontend
  docker compose up -d
  ```

### 4. Git Conflicts During `git pull`
- **Cause**: Files in the repo were modified directly on the LXC host.
- **Fix**: Check status with `git status`. If local modifications (like `.env` or temporary files) conflict, stash or discard them (except `.env` which is ignored):
  ```bash
  git stash
  git pull origin main
  ```
