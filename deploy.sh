#!/usr/bin/env bash
set -euo pipefail

# Clinical Trial Taxonomy – Reliable Cloud Run Deploy (Dockerfile + Secret)

PROJECT_ID="steadfast-range-465519-k4"
REGION="us-central1"
SERVICE_NAME="trial-map"
SECRET_NAME="gemini-api-key"
TAG="latest"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:${TAG}"

echo "🚀 Deploying $SERVICE_NAME"
echo "========================================"
echo "Project: $PROJECT_ID"
echo "Region : $REGION"
echo "Image  : $IMAGE"
echo ""

# Check gcloud
command -v gcloud >/dev/null || {
  echo "❌ gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
  exit 1
}

# Ensure we're in the right folder (Dockerfile must exist)
if [[ ! -f "Dockerfile" ]]; then
  echo "❌ Dockerfile not found in current directory."
  echo "   cd into the repo root (where Dockerfile lives) and re-run."
  exit 1
fi

# Set project
gcloud config set project "$PROJECT_ID" >/dev/null

# Enable required APIs
echo "📋 Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  --quiet
echo "✅ APIs enabled"
echo ""

# Ensure secret exists
echo "🔑 Checking secret: $SECRET_NAME"
if ! gcloud secrets describe "$SECRET_NAME" >/dev/null 2>&1; then
  echo "Secret not found. Creating..."
  read -rsp "Enter Gemini API key: " API_KEY
  echo
  printf "%s" "$API_KEY" | gcloud secrets create "$SECRET_NAME" \
    --data-file=- \
    --replication-policy="automatic" \
    --quiet
  echo "✅ Secret created"
else
  echo "✅ Secret exists"
fi
echo ""

# Grant secret access to default runtime service account
echo "🔐 Granting secret access..."
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet >/dev/null || true

echo "✅ Secret access granted to $RUNTIME_SA"
echo ""

# IMPORTANT: remove API_KEY env var if it exists (prevents "different type" error)
echo "🧹 Removing existing API_KEY env var (if present) to avoid type conflicts..."
gcloud run services update "$SERVICE_NAME" \
  --region "$REGION" \
  --remove-env-vars API_KEY \
  >/dev/null 2>&1 || true
echo "✅ Cleared prior API_KEY env var (if any)"
echo ""

# Build image using Cloud Build (forces Dockerfile usage; no Buildpacks)
echo "🏗️  Building container image with Cloud Build..."
gcloud builds submit . --tag "$IMAGE"
echo "✅ Image built: $IMAGE"
echo ""

# Deploy image to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets "API_KEY=${SECRET_NAME}:latest"

# Show URL
echo ""
SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --format="value(status.url)")"

echo "✅ Deployment complete!"
echo "🌐 App URL: $SERVICE_URL"
echo ""
