#!/bin/bash

# Retro Games Collection Startup Script

echo "🎮 Starting Retro Games Collection..."
echo "===================================="

# Check if conda environment exists
if ! conda env list | grep -q "gamer"; then
    echo "❌ Conda environment 'gamer' not found!"
    echo "Please run the setup first:"
    echo "conda create -n gamer python=3.11 django pillow"
    exit 1
fi

# Activate conda environment
echo "🔧 Activating conda environment..."
eval "$(conda shell.bash hook)"
conda activate gamer

# Check if Django is installed
if ! python -c "import django" 2>/dev/null; then
    echo "📦 Installing Django..."
    conda install django -y
fi

# Check if Pillow is installed
if ! python -c "import PIL" 2>/dev/null; then
    echo "📦 Installing Pillow..."
    conda install pillow -y
fi

# Run migrations
echo "🗄️  Setting up database..."
python manage.py migrate --verbosity=0

# Create superuser if it doesn't exist
echo "👤 Setting up admin user..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else print('Admin user already exists')" | python manage.py shell

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
