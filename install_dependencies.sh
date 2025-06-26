#!/bin/bash

# Install Dependencies Script for Retro Games Collection

echo "📦 Installing Dependencies for Retro Games Collection..."
echo "===================================="

# Check if we're in a conda environment
if [ -z "$CONDA_DEFAULT_ENV" ]; then
    echo "⚠️  No conda environment detected."
    echo "Please activate the 'gamer' environment first:"
    echo "conda activate gamer"
    exit 1
fi

echo "✅ Using conda environment: $CONDA_DEFAULT_ENV"

# Install dependencies
echo "📦 Installing Python packages..."

if [ -f "requirements.txt" ]; then
    echo "Installing from requirements.txt..."
    pip install -r requirements.txt
    echo "✅ All dependencies installed from requirements.txt"
else
    echo "Installing essential packages individually..."
    pip install whitenoise==6.6.0
    pip install gunicorn==21.2.0
    pip install dj-database-url==2.1.0
    pip install python-decouple==3.8
    pip install django-cors-headers==4.3.1
    echo "✅ Essential dependencies installed"
fi

# Verify critical imports
echo "🔍 Verifying installations..."
python -c "
try:
    import whitenoise
    print('✅ whitenoise imported successfully')
except ImportError as e:
    print(f'❌ whitenoise import failed: {e}')

try:
    import django
    print(f'✅ Django imported successfully (version: {django.get_version()})')
except ImportError as e:
    print(f'❌ Django import failed: {e}')

try:
    import PIL
    print('✅ Pillow imported successfully')
except ImportError as e:
    print(f'❌ Pillow import failed: {e}')
"

echo ""
echo "🎉 Dependency installation complete!"
echo "You can now run: ./start_server_simple.sh"
