#!/bin/bash

# Simple production server startup script
echo "🚀 Starting Retro Games Collection..."
echo "===================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if we're in the gamer conda environment
if [ "$CONDA_DEFAULT_ENV" != "gamer" ]; then
    echo "⚠️  Not in 'gamer' conda environment."
    echo "Please activate the environment first: conda activate gamer"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Load environment variables and show configuration
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Set defaults
PORT=${PORT:-8000}
DEBUG=${DEBUG:-False}

echo "🔧 Configuration:"
echo "   Workers: 1 (single worker)"
echo "   Port: $PORT"
echo "   Debug: $DEBUG"
echo "   SSL Redirect: ${SECURE_SSL_REDIRECT:-False}"

# Quick health check
echo ""
echo "🔍 Pre-flight checks:"
python manage.py check --deploy --verbosity=0 && echo "   ✅ Django checks passed" || echo "   ⚠️  Django checks failed"

echo ""
echo "🚀 Starting server..."
echo "📱 Application: http://localhost:$PORT/"
echo "🔧 Admin panel: http://localhost:$PORT/admin/"
echo ""
echo "Press Ctrl+C to stop the server"
echo "===================================="

# Start Gunicorn with single worker
# Using application.py as WSGI entry point
exec gunicorn application:application \
    --bind 0.0.0.0:$PORT \
    --workers 1 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile -
