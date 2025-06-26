#!/bin/bash

# Development Server Startup Script for Retro Games Collection
# This version uses development settings without production dependencies

echo "🎮 Starting Retro Games Collection (Development Mode)..."
echo "===================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📁 Working directory: $SCRIPT_DIR"

# Check if we have manage.py in current directory
if [ ! -f "manage.py" ]; then
    echo "❌ manage.py not found in current directory!"
    echo "Please run this script from the Django project root directory."
    exit 1
fi

# Check if we're in a conda environment
if [ -z "$CONDA_DEFAULT_ENV" ]; then
    echo "⚠️  No conda environment detected."
    echo "Please activate the 'gamer' environment first:"
    echo "conda activate gamer"
    exit 1
fi

echo "✅ Using conda environment: $CONDA_DEFAULT_ENV"

# Install basic dependencies only
echo "📦 Installing basic dependencies..."
conda install django pillow -y

# Use development settings
export DJANGO_SETTINGS_MODULE=retro_game_web.settings_dev

# Test Django setup
echo "🔍 Testing Django setup with development settings..."
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'retro_game_web.settings_dev')
import django
django.setup()
print('✅ Django setup successful with development settings')
"

if [ $? -ne 0 ]; then
    echo "❌ Django setup test failed."
    exit 1
fi

# Run migrations
echo "🗄️  Setting up database..."
python manage.py migrate --settings=retro_game_web.settings_dev --verbosity=1

# Create superuser if it doesn't exist
echo "👤 Setting up admin user..."
python manage.py shell --settings=retro_game_web.settings_dev -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('✅ Admin user created')
else:
    print('✅ Admin user already exists')
"

echo ""
echo "🚀 Starting Django development server..."
echo "📱 Games will be available at: http://localhost:8000/"
echo "🔧 Admin panel available at: http://localhost:8000/admin/"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "ℹ️  Running in DEVELOPMENT mode (no production dependencies required)"
echo "Press Ctrl+C to stop the server"
echo "===================================="

# Start the server with development settings
python manage.py runserver 0.0.0.0:8000 --settings=retro_game_web.settings_dev
