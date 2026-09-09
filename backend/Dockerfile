# Usar una imagen oficial de Python
FROM python:3.11-slim

# Evitar que Python genere archivos .pyc y que el buffer sea inmediato
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias para MySQL/PostgreSQL y otras libs
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del proyecto
COPY . /app/

# Exponer el puerto
EXPOSE 8000

# Comando simplificado
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]
