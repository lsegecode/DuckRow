# 🦆 DuckRow Service Desk

[![English](https://img.shields.io/badge/Language-English-blue.svg)](README.md)
[![Español](https://img.shields.io/badge/Idioma-Español-green.svg)](README.es.md)

Una moderna aplicación de gestión de tickets y tareas de soporte de alto contraste con un sistema de permisos basado en roles y asistencia guiada de depuración, inspirada fuertemente en los elementos visuales del pato azulón (Mallard) y la filosofía de ingeniería de software del **"Rubber Ducking" (Depuración con Patito de Goma)**.

---

## 🎨 Identidad Visual y Tema

- **Fondo Principal (Modo Oscuro Extremo)**: `#0B0F12` (Obsidian Slate). Previene la fatiga visual y mantiene una estética premium para desarrolladores.
- **Acento Primario**: `#0D5C4D` (Mallard Teal). Reservado para estados interactivos clave, botones y navegación activa.
- **Alertas Críticas**: `#F2A900` (Beak Gold). Utilizado para notificaciones de proximidad a límites de SLA y niveles de prioridad Crítica/Alta.

---

## 🛠️ Pila Tecnológica

### Backend
- **Framework**: Django REST Framework (DRF)
- **Base de Datos**: SQLite (Día 1, diseñada con claves primarias UUIDv4 no secuenciales para migración transparente a PostgreSQL)
- **Autenticación**: JWT sin estado (`djangorestframework-simplejwt`)
- **Filtros de consulta**: `django-filter`
- **Internacionalización (i18n)**: Django `LocaleMiddleware` con catálogos GNU gettext (`.po` / `.mo`)
- **Restricción de alcance dinámico**: Configurada en la capa ORM dentro de los métodos `get_queryset()`.

### Frontend
- **Framework**: React (Vite, TypeScript)
- **Motor CSS**: Tailwind CSS v4 (con propiedades `@theme` personalizadas)
- **Internacionalización (i18n)**: `i18next`, `react-i18next`, `i18next-browser-languagedetector` (Soporte bilingüe EN/ES con selector instantáneo)
- **Enrutamiento**: `react-router-dom`
- **Gestión de Estado y Consultas**: TanStack Query (React Query v5)
- **Cliente HTTP**: Axios (configurado con interceptor de auto-renovación JWT y encabezado `Accept-Language`)

---

## 👥 Matriz de Control de Acceso

| Rol | Crear Ticket | Alcance de Visualización | Actualizar Prioridad Interna | Asignar Personal |
|---|---|---|---|---|
| **System Administrator** (`SYSADMIN`) | Sí | Alcance Global (Todos los tickets) | Sí | Sí |
| **Soporte / Resolutor** (`RESOLVER`) | Sí | Tickets asignados y creados | No | No |
| **Cliente / Solicitante** (`CLIENT`) | Sí | Restringido por Área (Departamentos asignados) | No | No |

*Nota: Para usuarios con rol CLIENT, los campos internos como `internal_priority` y `assigned_to` se omiten automáticamente en las respuestas de la API.*

---

## 🚀 Configuración y Ejecución

### 1. Configuración del Backend
1. Abre una terminal en la carpeta raíz del proyecto.
2. Activa tu entorno virtual de Python (ej., `.\venv\Scripts\activate` en Windows o `source venv/bin/activate` en Linux/macOS).
3. Navega al directorio backend:
   ```bash
   cd backend
   ```
4. Ejecuta las migraciones:
   ```bash
   python manage.py migrate
   ```
5. Carga los datos iniciales de prueba (crea departamentos, roles y tickets de ejemplo):
   ```bash
   python manage.py seed_data
   ```
6. Inicia el servidor de desarrollo de la API:
   ```bash
   python manage.py runserver
   ```
   *El backend estará disponible en `http://localhost:8000/`.*

### 2. Configuración del Frontend
1. Abre otra terminal en el directorio raíz.
2. Navega al directorio frontend:
   ```bash
   cd frontend
   ```
3. Instala los paquetes de Node:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *La aplicación React estará disponible en `http://localhost:5173/`.*

---

## 🧪 Credenciales de Demostración

El comando `seed_data` registra los siguientes usuarios de prueba:

- **Administrador del Sistema**:
  - Usuario: `admin` | Contraseña: `admin1234`
- **Personal de Soporte (Resolutores)**:
  - Usuario: `resolver1` | Contraseña: `resolver1234`
  - Usuario: `resolver2` | Contraseña: `resolver1234`
- **Clientes (Asignados a áreas específicas)**:
  - Usuario: `client_it` | Contraseña: `client1234` (Área asignada: **IT**)
  - Usuario: `client_hr` | Contraseña: `client1234` (Área asignada: **Recursos Humanos**)
  - Usuario: `client_finance` | Contraseña: `client1234` (Áreas asignadas: **Finanzas, Marketing**)
