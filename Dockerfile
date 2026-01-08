############################
# Stage 1: Build frontend
############################
FROM node:20-slim AS frontend-builder

WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Build
COPY . .
RUN npm run build


############################
# Stage 2: Runtime (FastAPI)
############################
FROM python:3.11-slim

WORKDIR /app

# Python runtime hygiene
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Copy backend
COPY main.py .

# Cloud Run listens on $PORT (usually 8080)
EXPOSE 8080

# Run FastAPI
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --proxy-headers"]
