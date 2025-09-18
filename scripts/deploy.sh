#!/bin/bash

# SmartChat API Deployment Script
# Usage: ./scripts/deploy.sh [platform]
# Platforms: render, railway, fly, heroku, docker

set -e

PLATFORM=${1:-render}
APP_NAME="smartchat-api"

echo "🚀 Deploying SmartChat API to $PLATFORM..."

case $PLATFORM in
  "render")
    echo "📦 Deploying to Render.com..."
    echo "1. Push code to GitHub"
    echo "2. Connect repository in Render dashboard"
    echo "3. Use render.yaml for configuration"
    echo "✅ Render deployment configured"
    ;;
    
  "railway")
    echo "📦 Deploying to Railway.app..."
    if ! command -v railway &> /dev/null; then
      echo "Installing Railway CLI..."
      npm install -g @railway/cli
    fi
    railway login
    railway link
    railway up
    echo "✅ Railway deployment complete"
    ;;
    
  "fly")
    echo "📦 Deploying to Fly.io..."
    if ! command -v flyctl &> /dev/null; then
      echo "Please install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/"
      exit 1
    fi
    flyctl auth login
    flyctl apps create $APP_NAME --generate-name
    flyctl deploy
    echo "✅ Fly.io deployment complete"
    ;;
    
  "heroku")
    echo "📦 Deploying to Heroku..."
    if ! command -v heroku &> /dev/null; then
      echo "Please install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
      exit 1
    fi
    heroku login
    heroku create $APP_NAME
    heroku container:login
    heroku container:push web --app $APP_NAME
    heroku container:release web --app $APP_NAME
    echo "✅ Heroku deployment complete"
    ;;
    
  "docker")
    echo "📦 Building and running Docker container..."
    docker build -f Dockerfile.prod -t $APP_NAME .
    docker run -p 51213:51213 --env-file .env.production $APP_NAME
    echo "✅ Docker container running on port 51213"
    ;;
    
  *)
    echo "❌ Unknown platform: $PLATFORM"
    echo "Available platforms: render, railway, fly, heroku, docker"
    exit 1
    ;;
esac

echo "🎉 Deployment completed successfully!" 