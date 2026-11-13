# ☁️ Cloud Architecture & Deployment Guide ($0/mo Serverless & PaaS)

[![English](https://img.shields.io/badge/Language-English-blue.svg)](cloud_deployment_guide.md)
[![Español](https://img.shields.io/badge/Idioma-Español-green.svg)](es/cloud_deployment_guide.md)

This guide provides the complete, production-ready deployment workflow for **DuckRow** using modern cloud serverless and PaaS platforms on a **100% free-tier ($0/month)** architecture.

---

## 🗺️ Architecture Overview

```
                        [ User Browser ]
                                |
             +------------------+------------------+
             |                                     |
             v (HTTPS)                             v (HTTPS)
   [ duckrow.lucassanabria.com ]       [ api.duckrow.lucassanabria.com ]
             |                                     |
             v                                     v
  +----------------------+             +----------------------+
  |   Cloudflare Edge    |             |   Cloudflare Edge    |
  |      (DNS / WAF)     |             |      (DNS / WAF)     |
  +----------------------+             +----------------------+
             |                                     |
             v                                     v (Reverse Proxy SSL)
  +----------------------+             +----------------------+
  |   Cloudflare Pages   |             |     Koyeb (PaaS)     |
  |     React 19 SPA     |             |  Django REST API +   |
  |  (Edge CDN Delivery) |             |  WhiteNoise Static   |
  +----------------------+             +----------------------+
                                                   |
                                                   v (Internal SSL connection)
                                       +----------------------+
                                       |      Neon.tech       |
                                       |  PostgreSQL 16 Engine|
                                       | (Serverless Database)|
                                       +----------------------+
```

| Component | Role | Platform | Public Domain / URL | Tier |
|---|---|---|---|---|
| **Frontend (React)** | Client SPA | **Cloudflare Pages** | `https://duckrow.lucassanabria.com` | **Free ($0)** |
| **Backend (Django)** | REST API | **Koyeb** (Docker PaaS) | `https://api.duckrow.lucassanabria.com` | **Free ($0)** |
| **Database** | Relational Data | **Neon.tech** | Private SSL (`DATABASE_URL`) | **Free ($0)** |
| **Edge / DNS / SSL** | Routing & Security | **Cloudflare** | Orchester `lucassanabria.com` | **Free ($0)** |

---

## 🐘 Step 1: Provision Serverless PostgreSQL on Neon.tech

1. Log in to [Neon.tech](https://neon.tech/) and click **"New Project"**.
2. Set the project name: `duckrow-db`.
3. Select the region closest to your target users (e.g., `AWS us-east-2` or `eu-central-1`).
4. Click **Create Project**.
5. In the dashboard, copy the **Connection String** (select **Pooled connection** or Direct with `psql`/`Django`):
   ```text
   postgresql://duckrow_owner:<PASSWORD>@ep-sample-12345.us-east-2.aws.neon.tech/duckrow?sslmode=require
   ```
   *Keep this connection string safe for Step 2.*

---

## 🐍 Step 2: Deploy Django Backend on Koyeb

1. Log in to [Koyeb](https://www.koyeb.com/) and click **"Create Service"**.
2. Select **GitHub** as the source and choose your repository: `lsegecode/DuckRow`.
3. Configure the build parameters:
   - **Builder**: `Dockerfile`
   - **Work directory**: leave as root `/` (or specify `backend/Dockerfile` as the Dockerfile path in Koyeb settings: `backend/Dockerfile`).
   - **Context path**: `backend`
4. Configure **Environment Variables** in Koyeb:

| Variable Name | Example / Recommended Value | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://duckrow_owner:...@ep-...neon.tech/duckrow?sslmode=require` | Connection to Neon Serverless PostgreSQL |
| `SECRET_KEY` | `django-insecure-generate-a-strong-random-50-char-key` | Django Cryptographic Key |
| `DEBUG` | `False` | Production Security Mode |
| `ALLOWED_HOSTS` | `api.duckrow.lucassanabria.com,.koyeb.app` | Allowed Host Headers |
| `CSRF_TRUSTED_ORIGINS` | `https://duckrow.lucassanabria.com,https://api.duckrow.lucassanabria.com` | Anti-CSRF verification |
| `CORS_ALLOWED_ORIGINS` | `https://duckrow.lucassanabria.com` | Cross-Origin Resource Sharing |
| `FRONTEND_URL` | `https://duckrow.lucassanabria.com` | Application URL for emails/redirects |

5. Under **Ports**, ensure the HTTP port matches `8000` (path `/`).
6. Click **Deploy**.
   *Koyeb will build the image, run `python manage.py migrate` automatically on container start, collect static assets via WhiteNoise, and launch Gunicorn workers.*
7. Once deployed, note your assigned Koyeb URL (e.g. `https://duckrow-backend-lsegecode.koyeb.app`).
8. To populate initial seed data, open the **Console** tab in your Koyeb service and run:
   ```bash
   python manage.py seed_data
   ```

---

## ⚡ Step 3: Deploy React Frontend on Cloudflare Pages

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages -> Create Application -> Pages -> Connect to Git**.
2. Select repository `lsegecode/DuckRow`.
3. Configure build settings:
   - **Project Name**: `duckrow`
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Add **Environment Variables (Production)**:

| Variable Name | Value |
|---|---|
| `VITE_API_URL` | `https://api.duckrow.lucassanabria.com` |

5. Click **Save and Deploy**.
   *Cloudflare Pages will build the static assets, copy `_redirects` for client-side SPA routing, and distribute it across all global edge locations.*

---

## 🌐 Step 4: Configure DNS & Custom Domains in Cloudflare

Navigate to your zone **`lucassanabria.com`** in Cloudflare:

### 1. Frontend Custom Domain (`duckrow.lucassanabria.com`)
1. In Cloudflare Pages, go to your project: **Custom Domains -> Set up a custom domain**.
2. Enter `duckrow.lucassanabria.com`.
3. Cloudflare automatically generates the proper CNAME pointing to `<project>.pages.dev` with Proxied status (`Orange Cloud`).

### 2. Backend Custom Domain (`api.duckrow.lucassanabria.com`)
1. In Koyeb, go to **Settings -> Domains -> Add Custom Domain**.
2. Enter `api.duckrow.lucassanabria.com`. Koyeb will generate a target CNAME (e.g. `duckrow-backend.koyeb.app`).
3. In Cloudflare DNS for `lucassanabria.com`, create a new DNS record:
   - **Type**: `CNAME`
   - **Name**: `api.duckrow`
   - **Target**: your Koyeb CNAME endpoint (e.g. `duckrow-backend.koyeb.app`)
   - **Proxy Status**: `Proxied` (Orange Cloud) for Cloudflare edge caching, DDoS protection, and SSL termination.

---

## 🔒 Security & SSL Settings

Ensure your Cloudflare SSL configuration is set to:
* **SSL/TLS Mode**: **Full (Strict)**
* **Always Use HTTPS**: **Enabled**
* **Minimum TLS Version**: **TLS 1.2**

---

## ✅ Verification Checklist

- [ ] **Database**: Verify tables in Neon console (`users_area`, `tickets_ticket`, etc.).
- [ ] **API Endpoint**: Browse to `https://api.duckrow.lucassanabria.com/api/docs/` (Swagger UI).
- [ ] **Frontend**: Open `https://duckrow.lucassanabria.com/login` and log in with demo credentials (`admin` / `admin1234`).
- [ ] **Client Routing**: Refresh any deep link like `https://duckrow.lucassanabria.com/dashboard` to confirm `_redirects` handles 200 SPA delivery.
