#!/bin/bash

# Production deployment script for Retro Games Collection
echo "🚀 Deploying Retro Games Collection to Production..."
echo "===================================="

# Exit on any error
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file from .env.example and configure it for production."
    exit 1
fi

# Check if we're in the gamer conda environment
if [ "$CONDA_DEFAULT_ENV" != "gamer" ]; then
    echo "⚠️  Not in 'gamer' conda environment."
    echo "Please activate the environment first:"
    echo "conda activate gamer"
    exit 1
fi

# Install/update dependencies
echo "📦 Installing production dependencies..."
pip install -r requirements.txt

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Create cache table
echo "🗄️  Creating cache table..."
python manage.py createcachetable || echo "Cache table already exists"

# Run migrations
echo "🗄️  Running database migrations..."
python manage.py makemigrations --check || {
    echo "⚠️  Unapplied migrations detected. Running migrations..."
    python manage.py makemigrations
}
python manage.py migrate

# Check for security issues
echo "🔒 Running security checks..."
python manage.py check --deploy

# Create superuser if needed (only in development)
if [ "$1" == "--create-superuser" ]; then
    echo "👤 Creating superuser..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('✅ Admin user created')
else:
    print('✅ Admin user already exists')
"
fi

# Cleanup old sessions
echo "🧹 Cleaning up old sessions..."
python manage.py clearsessions

# Test database connection
echo "🔍 Testing database connection..."
python manage.py shell -c "
from django.db import connection
cursor = connection.cursor()
cursor.execute('SELECT 1')
print('✅ Database connection successful')
"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "To start the production server, run:"
echo "   gunicorn retro_game_web.wsgi:application --bind 0.0.0.0:8000 --workers 3"
echo ""
echo "Or use the production server script:"
echo "   ./start_production.sh"
echo ""
