#!/bin/bash

# Simple Retro Games Collection Startup Script
# This version assumes conda environment is already activated

echo "🎮 Starting Retro Games Collection (Simple Version)..."
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

# Check if we're in the right conda environment
if [ -z "$CONDA_DEFAULT_ENV" ]; then
    echo "⚠️  No conda environment detected."
    echo "Please activate the 'gamer' environment first:"
    echo "conda activate gamer"
    echo ""
    echo "Or create it if it doesn't exist:"
    echo "conda create -n gamer python=3.11 django pillow -y"
    echo "conda activate gamer"
    exit 1
fi

echo "✅ Using conda environment: $CONDA_DEFAULT_ENV"

# Install missing dependencies
echo "📦 Checking and installing dependencies..."
if [ -f "requirements.txt" ]; then
    echo "Installing from requirements.txt..."
    pip install -r requirements.txt
else
    echo "Installing essential packages..."
    pip install whitenoise gunicorn dj-database-url python-decouple django-cors-headers
fi

# Test Django setup first
echo "🔍 Testing Django setup..."
python test_django.py
if [ $? -ne 0 ]; then
    echo "❌ Django setup test failed. Please check your installation."
    exit 1
fi

# Set Django settings module explicitly
export DJANGO_SETTINGS_MODULE=retro_game_web.settings

# Run migrations
echo "🗄️  Setting up database..."
python manage.py migrate --verbosity=1

# Create superuser if it doesn't exist
echo "👤 Setting up admin user..."
python manage.py shell -c "
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
echo "Press Ctrl+C to stop the server"
echo "===================================="

# Start the server
python manage.py runserver 0.0.0.0:8000
