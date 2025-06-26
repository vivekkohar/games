#!/bin/bash

# Production server startup script for Retro Games Collection
echo "🚀 Starting Retro Games Collection Production Server..."
echo "===================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if we're in the gamer conda environment
if [ "$CONDA_DEFAULT_ENV" != "gamer" ]; then
    echo "⚠️  Not in 'gamer' conda environment."
    echo "Please activate the environment first:"
    echo "conda activate gamer"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file from .env.example and configure it for production."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Validate required environment variables
if [ -z "$SECRET_KEY" ]; then
    echo "❌ SECRET_KEY not set in .env file"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env file"
    exit 1
fi

# Set production defaults
export DEBUG=${DEBUG:-False}
export WORKERS=${WORKERS:-3}
export PORT=${PORT:-8000}
export TIMEOUT=${TIMEOUT:-120}

echo "🔧 Configuration:"
echo "   DEBUG: $DEBUG"
echo "   WORKERS: $WORKERS"
echo "   PORT: $PORT"
echo "   TIMEOUT: $TIMEOUT"

# Start Gunicorn server
echo ""
echo "🚀 Starting Gunicorn server..."
echo "📱 Application will be available at: http://0.0.0.0:$PORT/"
echo "🔧 Admin panel available at: http://0.0.0.0:$PORT/admin/"
echo ""
echo "Press Ctrl+C to stop the server"
echo "===================================="

exec gunicorn retro_game_web.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers $WORKERS \
    --timeout $TIMEOUT \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --preload
