#!/bin/bash

# Simple development server script
echo "🎮 Starting Retro Games Collection (Development)..."
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

# Run migrations
echo "🗄️  Setting up database..."
python manage.py makemigrations games_manager
python manage.py makemigrations retro_platform_fighter
python manage.py migrate

# Create admin user
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

# Create initial game entries
echo "🎮 Setting up games..."
python manage.py shell -c "
from games_manager.models import Game
if Game.objects.count() == 0:
    Game.objects.create(
        name='Retro Platform Fighter',
        slug='retro-platform-fighter',
        description='A classic 2D platformer with combat mechanics',
        url_path='/retro_platform_fighter/play/',
        is_active=True
    )
    print('✅ Game entries created')
else:
    print('✅ Games already exist')
"

echo ""
echo "🚀 Starting development server..."
echo "📱 Games: http://localhost:8000/"
echo "🔧 Admin: http://localhost:8000/admin/ (admin/admin123)"
echo ""
echo "Press Ctrl+C to stop"
echo "===================================="

# Start development server
python manage.py runserver 0.0.0.0:8000
