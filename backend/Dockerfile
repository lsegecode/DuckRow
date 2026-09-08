FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema y repositorio de Microsoft ODBC Driver
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    gettext \
    curl \
    gnupg \
    unixodbc-dev \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql17 msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Compilar mensajes de internacionalización (i18n) si existen
RUN python manage.py compilemessages || true

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_data && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3"]
