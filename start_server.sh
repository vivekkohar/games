#!/bin/bash

# Retro Games Collection Startup Script

echo "🎮 Starting Retro Games Collection..."
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

# Initialize conda for bash if not already done
if ! command -v conda &> /dev/null; then
    echo "❌ Conda not found in PATH!"
    echo "Please ensure conda is installed and available in your PATH."
    exit 1
fi

# Initialize conda
eval "$(conda shell.bash hook)"

# Check if conda environment exists
if ! conda env list | grep -q "gamer"; then
    echo "❌ Conda environment 'gamer' not found!"
    echo "Creating conda environment..."
    conda create -n gamer python=3.11 -y
    conda activate gamer
    echo "📦 Installing Django and Pillow..."
    conda install django pillow -y
else
    echo "🔧 Activating conda environment..."
    conda activate gamer
fi

# Verify we're in the right environment
if [ "$CONDA_DEFAULT_ENV" != "gamer" ]; then
    echo "❌ Failed to activate conda environment 'gamer'"
    echo "Trying alternative activation method..."
    source activate gamer
    if [ "$CONDA_DEFAULT_ENV" != "gamer" ]; then
        echo "❌ Still failed to activate environment. Please activate manually:"
        echo "conda activate gamer"
        exit 1
    fi
fi

echo "✅ Using conda environment: $CONDA_DEFAULT_ENV"

# Install dependencies from requirements.txt
echo "📦 Installing dependencies..."
if [ -f "requirements.txt" ]; then
    # Install conda packages first
    conda install django pillow -y
    # Install remaining packages with pip
    pip install -r requirements.txt
else
    echo "⚠️  requirements.txt not found, installing basic dependencies..."
    conda install django pillow -y
    pip install whitenoise gunicorn dj-database-url python-decouple django-cors-headers
fi

# Verify Django installation and project structure
echo "🔍 Verifying Django installation..."
python -c "import django; print(f'Django version: {django.get_version()}')"

# Set Django settings module explicitly
export DJANGO_SETTINGS_MODULE=retro_game_web.settings

# Run migrations
echo "🗄️  Setting up database..."
python manage.py migrate --verbosity=0

# Create superuser if it doesn't exist
echo "👤 Setting up admin user..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Admin user created')
else:
    print('Admin user already exists')
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
