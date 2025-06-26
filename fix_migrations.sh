#!/bin/bash

# Script to fix missing migrations for retro_platform_fighter app
echo "🔧 Fixing missing migrations for retro_platform_fighter app..."
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

# Create migrations for retro_platform_fighter app
echo "📝 Creating migrations for retro_platform_fighter app..."
python manage.py makemigrations games.retro_platform_fighter

# If that fails, try with the app name directly
if [ $? -ne 0 ]; then
    echo "⚠️  Trying alternative app name..."
    python manage.py makemigrations retro_platform_fighter
fi

# Apply migrations
echo "🚀 Applying migrations..."
python manage.py migrate

echo ""
echo "✅ Migration fix complete!"
echo "You can now run the server with:"
echo "   ./run.sh"
echo ""
