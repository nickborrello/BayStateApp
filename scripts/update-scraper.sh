#!/bin/bash
# Update the scraper Docker image on this runner
# Run this after scraper code changes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
SCRAPER_DIR="$REPO_ROOT/scraper_backend"

echo "🔄 Updating scraper Docker image..."

# Pull latest code
cd "$REPO_ROOT"
git pull origin main

# Rebuild Docker image
cd "$SCRAPER_DIR"
docker build -t baystate-scraper:latest .

echo "✅ Scraper image updated: baystate-scraper:latest"
echo ""
echo "The runner will use the new image for future jobs."
