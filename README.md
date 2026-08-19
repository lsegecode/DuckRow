# 🦆 DuckRow Service Desk

[![English](https://img.shields.io/badge/Language-English-blue.svg)](README.md)
[![Español](https://img.shields.io/badge/Idioma-Español-green.svg)](README.es.md)

A modern, high-contrast, ticket-based task management application with a role-based permission system and guided debugging support, heavily inspired by the visual elements of a Mallard Duck combined with the software engineering philosophy of **"Rubber Ducking"**.

---

## 🎨 Visual Identity & Theme

- **Main Background (Extreme Dark Mode)**: `#0B0F12` (Obsidian Slate). Prevents eye strain and maintains a premium developer dashboard feel.
- **Primary Accent**: `#0D5C4D` (Mallard Teal). Reserved for core interactive states, button fills, and active navigation indicators.
- **Critical Alerts**: `#F2A900` (Beak Gold). Utilized for near-breach SLA notifications and Critical/High internal priority flags.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Django REST Framework (DRF)
- **Database**: SQLite (Day-1, designed with UUIDv4 non-sequential primary keys for seamless PostgreSQL migration)
- **Auth**: Stateless JWT (`djangorestframework-simplejwt`)
- **Query filters**: `django-filter`
- **Internationalization (i18n)**: Django `LocaleMiddleware` with GNU gettext catalogs (`.po` / `.mo`)
- **Dynamic Scope Enforcement**: Configured at the ORM layer inside `get_queryset()` overrides.

### Frontend
- **Framework**: React (Vite, TypeScript)
- **CSS Engine**: Tailwind CSS v4 (with custom `@theme` properties)
- **Internationalization (i18n)**: `i18next`, `react-i18next`, `i18next-browser-languagedetector` (Bilingual EN/ES support with runtime switcher)
- **Routing**: `react-router-dom`
- **State Management & Queries**: TanStack Query (React Query v5)
- **HTTP Client**: Axios (configured with auto-refresh JWT interceptor & `Accept-Language` header)

---

## 👥 Access Control Matrix

| Role | Create Ticket | View Context Scope | Update Internal Priority | Assign Staff |
|---|---|---|---|---|
| **System Administrator** (`SYSADMIN`) | Yes | Global Scope (All tickets) | Yes | Yes |
| **Staff / Resolver** (`RESOLVER`) | Yes | Assigned & Created tickets | No | No |
| **Client / Submitter** (`CLIENT`) | Yes | Area Restricted (Assigned departments) | No | No |

*Note: For CLIENT users, internal fields like `internal_priority` and `assigned_to` are stripped out of the API serializers completely.*

---

## 🚀 Setup & Execution

### 1. Backend Setup
1. Open a terminal in the root folder of the project.
2. Active your Python virtual environment (e.g., `..\venv\Scripts\activate`).
3. Navigate to the backend directory:
   ```bash
   cd backend
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Seed demo data (creates departments, roles, and sample tickets):
   ```bash
   python manage.py seed_data
   ```
6. Start the API server:
   ```bash
   python manage.py runserver
   ```
   *The backend will run at `http://localhost:8000/`.*

### 2. Frontend Setup
1. Open another terminal in the root directory.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install node packages:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The React app will be served at `http://localhost:5173/`.*

---

## 🧪 Demo Credentials

The `seed_data` command registers the following test users (password is common or mapped):

- **System Administrator**:
  - Username: `admin` | Password: `admin1234`
- **Support Staff (Resolvers)**:
  - Username: `resolver1` | Password: `resolver1234`
  - Username: `resolver2` | Password: `resolver1234`
- **Clients (Assigned to specific Areas)**:
  - Username: `client_it` | Password: `client1234` (Assigned Area: **IT**)
  - Username: `client_hr` | Password: `client1234` (Assigned Area: **Human Resources**)
  - Username: `client_finance` | Password: `client1234` (Assigned Areas: **Finance, Marketing**)
