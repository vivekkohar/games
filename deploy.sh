#!/bin/bash

# Simple production deployment script
echo "🚀 Deploying Retro Games Collection..."
echo "===================================="

# Exit on any error
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Check if we're in the gamer conda environment
if [ "$CONDA_DEFAULT_ENV" != "gamer" ]; then
    echo "⚠️  Not in 'gamer' conda environment."
    echo "Please activate the environment first: conda activate gamer"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Run migrations
echo "🗄️  Running migrations..."
python manage.py migrate

# Run security check
echo "🔒 Running security check..."
python manage.py check --deploy

# Create superuser if needed
if [ "$1" == "--create-admin" ]; then
    echo "👤 Creating admin user..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('✅ Admin user created (username: admin, password: admin123)')
else:
    print('✅ Admin user already exists')
"
fi

echo ""
echo "✅ Deployment complete!"
echo "Start the server with: ./start_production.sh"
echo ""
