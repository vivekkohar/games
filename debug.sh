#!/bin/bash

# Debug script to help troubleshoot production issues
echo "🔍 Django Production Debug Information"
echo "===================================="

# Check if we're in the gamer conda environment
if [ "$CONDA_DEFAULT_ENV" != "gamer" ]; then
    echo "⚠️  Not in 'gamer' conda environment."
    echo "Please activate the environment first: conda activate gamer"
    exit 1
fi

# Check environment variables
echo "📋 Environment Configuration:"
echo "   DEBUG: $(python -c "from decouple import config; print(config('DEBUG', default='Not set'))")"
echo "   ALLOWED_HOSTS: $(python -c "from decouple import config; print(config('ALLOWED_HOSTS', default='Not set'))")"
echo "   SECURE_SSL_REDIRECT: $(python -c "from decouple import config; print(config('SECURE_SSL_REDIRECT', default='Not set'))")"
echo "   PORT: $(python -c "from decouple import config; print(config('PORT', default='8000'))")"

# Test database connection
echo ""
echo "🗄️  Database Connection:"
python manage.py shell -c "
try:
    from django.db import connection
    cursor = connection.cursor()
    cursor.execute('SELECT 1')
    print('   ✅ Database connection successful')
except Exception as e:
    print(f'   ❌ Database connection failed: {e}')
"

# Check migrations
echo ""
echo "📝 Migration Status:"
python manage.py showmigrations --verbosity=0

# Run Django checks
echo ""
echo "🔒 Django Security Check:"
python manage.py check --deploy --verbosity=0

# Test health endpoint
echo ""
echo "🏥 Health Check:"
python -c "
import requests
try:
    response = requests.get('http://localhost:8000/health/', timeout=5)
    print(f'   Status: {response.status_code}')
    print(f'   Response: {response.json()}')
except Exception as e:
    print(f'   ❌ Health check failed: {e}')
"

echo ""
echo "✅ Debug information complete!"
echo "If you're still having issues, check the server logs when starting with ./start_production.sh"
