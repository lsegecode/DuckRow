# 🚀 Running the DuckRow Project

[![English](https://img.shields.io/badge/Language-English-blue.svg)](run_project.md)
[![Español](https://img.shields.io/badge/Idioma-Español-green.svg)](es/run_project.md)

This guide provides step-by-step instructions to configure, install, and run both the **Backend (Django REST Framework)** and the **Frontend (React + Vite + TypeScript)** applications.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
*   [Python 3.10+](https://www.python.org/downloads/)
*   [Node.js 18+](https://nodejs.org/) (includes `npm`)

---

## 🐍 1. Backend Setup & Run

The backend is built with Django and Django REST Framework, utilizing a local SQLite database.

### Step 1.1: Open a terminal & Navigate to backend
Navigate to the `backend` directory in your workspace:
```bash
cd backend
```

### Step 1.2: Set up a Virtual Environment (Recommended)
Creating a virtual environment keeps your project dependencies isolated.
*   **Windows (PowerShell/CMD):**
    ```powershell
    python -m venv venv
    .\venv\Scripts\activate
    ```
*   **macOS/Linux:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

### Step 1.3: Install Dependencies
Install the required packages listed in `requirements.txt`:
```bash
pip install -r requirements.txt
```

### Step 1.4: Run Database Migrations
Create the SQLite database and initialize the tables:
```bash
python manage.py migrate
```

### Step 1.5: Seed Demo Data
Populate the database with default departments, user roles, and sample tickets:
```bash
python manage.py seed_data
```

### Step 1.6: Start the Django Dev Server
Launch the development API server:
```bash
python manage.py runserver
```
The backend API server will run at **[http://localhost:8000/](http://localhost:8000/)**.

---

## ⚡ 2. Frontend Setup & Run

The frontend is built with React, Vite, Tailwind CSS, and TypeScript.

### Step 2.1: Open a new terminal & Navigate to frontend
Navigate to the `frontend` directory in your workspace:
```bash
cd frontend
```

### Step 2.2: Install Node Packages
Install the required dependencies using `npm`:
```bash
npm install
```

### Step 2.3: Start the Vite Development Server
Run the application locally:
```bash
npm run dev
```
The React frontend will be accessible at **[http://localhost:5173/](http://localhost:5173/)**.

---

## 👥 Demo Credentials

Once the `seed_data` command is executed, you can use these test accounts to log into the system:

| Role | Username | Password | Notes / Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `admin1234` | Full global access to all tickets and settings |
| **Support Staff (Resolver)** | `resolver1` | `resolver1234` | Accesses only assigned tickets |
| **Support Staff (Resolver)** | `resolver2` | `resolver1234` | Accesses only assigned tickets |
| **Client** | `client_it` | `client1234` | Restricted to IT department tickets |
| **Client** | `client_hr` | `client1234` | Restricted to Human Resources tickets |
| **Client** | `client_finance` | `client1234` | Restricted to Finance and Marketing tickets |
