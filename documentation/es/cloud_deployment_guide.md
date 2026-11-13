# ☁️ Guía de Arquitectura Cloud y Despliegue ($0/mes Serverless & PaaS)

[![English](https://img.shields.io/badge/Language-English-blue.svg)](../cloud_deployment_guide.md)
[![Español](https://img.shields.io/badge/Idioma-Español-green.svg)](cloud_deployment_guide.md)

Esta guía documenta el flujo completo y listo para producción para desplegar **DuckRow** en plataformas cloud serverless y PaaS modernas bajo una **arquitectura 100% gratuita ($0/mes)**.

---

## 🗺️ Mapa de la Arquitectura

```
                        [ Navegador del Usuario ]
                                   |
             +---------------------+---------------------+
             |                                           |
             v (HTTPS)                                   v (HTTPS)
   [ duckrow.lucassanabria.com ]             [ api.duckrow.lucassanabria.com ]
             |                                           |
             v                                           v
  +----------------------+                   +----------------------+
  |   Cloudflare Edge    |                   |   Cloudflare Edge    |
  |      (DNS / WAF)     |                   |      (DNS / WAF)     |
  +----------------------+                   +----------------------+
             |                                           |
             v                                           v (Reverse Proxy SSL)
  +----------------------+                   +----------------------+
  |   Cloudflare Pages   |                   |     Koyeb (PaaS)     |
  |     React 19 SPA     |                   |  Django REST API +   |
  | (Entrega Edge Global)|                   |  WhiteNoise Static   |
  +----------------------+                   +----------------------+
                                                         |
                                                         v (Conexión interna SSL)
                                             +----------------------+
                                             |      Neon.tech       |
                                             |  Motor PostgreSQL 16 |
                                             | (Base de Datos Sls)  |
                                             +----------------------+
```

| Componente | Rol | Plataforma | Dominio Público / URL | Plan |
|---|---|---|---|---|
| **Frontend (React)** | SPA de Cliente | **Cloudflare Pages** | `https://duckrow.lucassanabria.com` | **Gratuito ($0)** |
| **Backend (Django)** | API REST | **Koyeb** (Docker PaaS) | `https://api.duckrow.lucassanabria.com` | **Gratuito ($0)** |
| **Base de Datos** | Datos Relacionales | **Neon.tech** | SSL Privado (`DATABASE_URL`) | **Gratuito ($0)** |
| **Edge / DNS / SSL** | Enrutamiento y WAF | **Cloudflare** | Orquesta `lucassanabria.com` | **Gratuito ($0)** |

---

## 🐘 Paso 1: Crear PostgreSQL Serverless en Neon.tech

1. Inicia sesión en [Neon.tech](https://neon.tech/) y pulsa **"New Project"**.
2. Nombre del proyecto: `duckrow-db`.
3. Selecciona la región geográfica más conveniente (ej. `AWS us-east-2` o `eu-central-1`).
4. Pulsa **Create Project**.
5. En el panel principal, copia la **Cadena de Conexión** (Connection String):
   ```text
   postgresql://duckrow_owner:<PASSWORD>@ep-sample-12345.us-east-2.aws.neon.tech/duckrow?sslmode=require
   ```
   *Guarda esta URL para el Paso 2.*

---

## 🐍 Paso 2: Desplegar Backend Django en Koyeb

1. Inicia sesión en [Koyeb](https://www.koyeb.com/) y pulsa **"Create Service"**.
2. Selecciona **GitHub** como origen y elige tu repositorio: `lsegecode/DuckRow`.
3. Parámetros de construcción (Build):
   - **Builder**: `Dockerfile`
   - **Ruta del Dockerfile**: `backend/Dockerfile`
   - **Context path**: `backend`
4. Configura las **Variables de Entorno** en Koyeb:

| Variable | Valor Recomendado | Propósito |
|---|---|---|
| `DATABASE_URL` | `postgresql://duckrow_owner:...@ep-...neon.tech/duckrow?sslmode=require` | Conexión SSL directa a Neon |
| `SECRET_KEY` | Genera una clave aleatoria segura de 50 caracteres | Seguridad criptográfica de Django |
| `DEBUG` | `False` | Modo producción seguro |
| `ALLOWED_HOSTS` | `api.duckrow.lucassanabria.com,.koyeb.app` | Hostnames autorizados |
| `CSRF_TRUSTED_ORIGINS` | `https://duckrow.lucassanabria.com,https://api.duckrow.lucassanabria.com` | Protección CSRF |
| `CORS_ALLOWED_ORIGINS` | `https://duckrow.lucassanabria.com` | Autorización de llamadas desde el frontend |
| `FRONTEND_URL` | `https://duckrow.lucassanabria.com` | URL pública de la aplicación |

5. En **Ports**, asegúrate de que el puerto apunte a `8000`.
6. Pulsa **Deploy**.
   *Koyeb compilará la imagen, ejecutará `python manage.py migrate` automáticamente en el arranque, servirá los estáticos con WhiteNoise y levantará los workers de Gunicorn.*
7. Para poblar datos iniciales de prueba, abre la pestaña **Console** en tu servicio de Koyeb y ejecuta:
   ```bash
   python manage.py seed_data
   ```

---

## ⚡ Paso 3: Desplegar Frontend React en Cloudflare Pages

1. Ingresa al panel de [Cloudflare Dashboard](https://dash.cloudflare.com/) y ve a **Workers & Pages -> Create Application -> Pages -> Connect to Git**.
2. Selecciona el repositorio `lsegecode/DuckRow`.
3. Configuración de Build:
   - **Project Name**: `duckrow`
   - **Framework preset**: `Vite`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Agrega la variable de entorno:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://api.duckrow.lucassanabria.com` |

5. Pulsa **Save and Deploy**.
   *Cloudflare Pages compilará la aplicación, aplicará el archivo `_redirects` para el routing SPA y la distribuirá en su red Edge global.*

---

## 🌐 Paso 4: Configurar DNS y Dominios Personalizados en Cloudflare

En la zona **`lucassanabria.com`** dentro de Cloudflare:

### 1. Dominio del Frontend (`duckrow.lucassanabria.com`)
1. En tu proyecto de Cloudflare Pages: **Custom Domains -> Set up a custom domain**.
2. Escribe `duckrow.lucassanabria.com`.
3. Cloudflare creará el registro CNAME automáticamente en modo proxy (`Nube Naranja`).

### 2. Dominio del Backend (`api.duckrow.lucassanabria.com`)
1. En Koyeb: **Settings -> Domains -> Add Custom Domain**.
2. Escribe `api.duckrow.lucassanabria.com`. Koyeb te dará un CNAME de destino (ej: `duckrow-backend.koyeb.app`).
3. En el DNS de Cloudflare para `lucassanabria.com`, agrega un nuevo registro:
   - **Tipo**: `CNAME`
   - **Nombre**: `api.duckrow`
   - **Destino**: el endpoint provisto por Koyeb (ej. `duckrow-backend.koyeb.app`)
   - **Estado de Proxy**: `Proxied` (Nube Naranja activa para protección DDoS y SSL Edge).

---

## 🔒 Configuración de SSL en Cloudflare

Verifica en la pestaña **SSL/TLS** de Cloudflare:
* **Modo de Cifrado**: **Full (Strict)**
* **Always Use HTTPS**: **Activado**
* **Versión mínima de TLS**: **TLS 1.2**

---

## ✅ Lista de Verificación Final

- [ ] **Base de Datos**: Tablas verificadas en Neon.
- [ ] **Documentación API**: Ingresar a `https://api.duckrow.lucassanabria.com/api/docs/` (Swagger).
- [ ] **Acceso a Frontend**: Ingresar a `https://duckrow.lucassanabria.com/login` e iniciar sesión con `admin` / `admin1234`.
- [ ] **Navegación**: Recargar la página en `/dashboard` o `/tickets/new` para comprobar que `_redirects` evita errores 404.
