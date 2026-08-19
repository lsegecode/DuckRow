# 🚀 Guía de Ejecución de DuckRow

Esta guía proporciona instrucciones paso a paso para configurar, instalar y ejecutar tanto el **Backend (Django REST Framework)** como el **Frontend (React + Vite + TypeScript)**.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu equipo:
*   [Python 3.10+](https://www.python.org/downloads/)
*   [Node.js 18+](https://nodejs.org/) (incluye `npm`)

---

## 🐍 1. Configuración y Ejecución del Backend

El backend está desarrollado con Django y Django REST Framework, utilizando una base de datos local SQLite.

### Paso 1.1: Abre una terminal y navega al backend
Navega al directorio `backend` en tu espacio de trabajo:
```bash
cd backend
```

### Paso 1.2: Configura un Entorno Virtual (Recomendado)
Crear un entorno virtual mantiene las dependencias del proyecto aisladas.
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

### Paso 1.3: Instala las Dependencias
Instala los paquetes necesarios definidos en `requirements.txt`:
```bash
pip install -r requirements.txt
```

### Paso 1.4: Ejecuta las Migraciones de la Base de Datos
Crea la base de datos SQLite e inicializa las tablas:
```bash
python manage.py migrate
```

### Paso 1.5: Carga los Datos Iniciales de Prueba
Puebla la base de datos con departamentos por defecto, roles de usuario y tickets de ejemplo:
```bash
python manage.py seed_data
```

### Paso 1.6: Inicia el Servidor de Desarrollo de Django
Ejecuta el servidor de la API:
```bash
python manage.py runserver
```
El servidor backend se ejecutará en **[http://localhost:8000/](http://localhost:8000/)**.

---

## ⚡ 2. Configuración y Ejecución del Frontend

El frontend está desarrollado con React, Vite, Tailwind CSS y TypeScript con soporte bilingüe completo.

### Paso 2.1: Abre una nueva terminal y navega al frontend
Navega al directorio `frontend` en tu espacio de trabajo:
```bash
cd frontend
```

### Paso 2.2: Instala los Paquetes de Node
Instala las dependencias necesarias con `npm`:
```bash
npm install
```

### Paso 2.3: Inicia el Servidor de Desarrollo de Vite
Ejecuta la aplicación localmente:
```bash
npm run dev
```
El frontend de React estará accesible en **[http://localhost:5173/](http://localhost:5173/)**.

---

## 👥 Credenciales de Demostración

Una vez ejecutado el comando `seed_data`, puedes utilizar estas cuentas de prueba para ingresar al sistema:

| Rol | Usuario | Contraseña | Alcance / Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador del Sistema** | `admin` | `admin1234` | Acceso global a todos los tickets y ajustes |
| **Personal de Soporte (Resolutor)** | `resolver1` | `resolver1234` | Accede únicamente a tickets asignados |
| **Personal de Soporte (Resolutor)** | `resolver2` | `resolver1234` | Accede únicamente a tickets asignados |
| **Cliente** | `client_it` | `client1234` | Restringido al departamento de IT |
| **Cliente** | `client_hr` | `client1234` | Restringido al departamento de Recursos Humanos |
| **Cliente** | `client_finance` | `client1234` | Restringido a Finanzas y Marketing |
