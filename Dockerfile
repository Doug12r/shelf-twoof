# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build

WORKDIR /build

COPY apps/twoof/frontend/package*.json ./
RUN npm install

COPY apps/twoof/frontend/ ./
RUN npm run build


# Stage 2: Python runtime
FROM python:3.12-slim

# Install tini for proper PID 1 signal handling
RUN apt-get update && apt-get install -y --no-install-recommends tini curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system app && adduser --system --ingroup app app

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip

# Install shared auth middleware
COPY platform/shared/auth-middleware-python /tmp/auth-middleware
RUN pip install --no-cache-dir /tmp/auth-middleware && rm -rf /tmp/auth-middleware

# Install app dependencies
COPY apps/twoof/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY --chown=app:app apps/twoof/twoof_api/ ./twoof_api/
COPY --chown=app:app apps/twoof/alembic/ ./alembic/
COPY --chown=app:app apps/twoof/alembic.ini .

# Copy built frontend from stage 1
COPY --from=frontend-build --chown=app:app /static ./static/

# Ensure data dir is writable by app user
RUN mkdir -p /data/photos && chown -R app:app /data

USER app

EXPOSE 3001

ENTRYPOINT ["tini", "--"]
CMD ["uvicorn", "twoof_api.main:app", "--host", "0.0.0.0", "--port", "3001"]
