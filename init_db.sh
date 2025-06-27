#!/bin/bash

# Database initialization script for Retro Games Collection
# This script resets and initializes the database

echo "🗄️  Initializing database for Retro Games Collection..."
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

# Skip confirmation in non-interactive mode
if [ "$1" == "--yes" ] || [ "$1" == "-y" ]; then
    SKIP_CONFIRM=true
else
    echo "⚠️  This will reset your database. All data will be lost."
    read -p "Are you sure you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        exit 1
    fi
fi

# Reset migrations
echo "🔄 Resetting migrations..."
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete

# Make fresh migrations
echo "📝 Creating fresh migrations..."
python manage.py makemigrations games_manager

# Apply migrations
echo "🚀 Applying migrations..."
python manage.py migrate

# Create superuser
echo "👤 Creating admin user..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'vivek.kohar@example.com', 'admin123')
    print('✅ Admin user created')
else:
    print('✅ Admin user already exists')
"

# Create initial game entries
echo "🎮 Creating initial game entries..."
python manage.py shell -c "
from games_manager.models import Game
Game.objects.all().delete()
Game.objects.create(
    name='Retro Platform Fighter',
    slug='retro-platform-fighter',
    description='A classic 2D platformer with combat mechanics',
    url_path='/retro_platform_fighter/play/',
    is_active=True
)
print('✅ Initial game entries created')
"

echo ""
echo "✅ Database initialization complete!"
echo "You can now run the server with:"
echo "   ./run.sh"
echo ""
