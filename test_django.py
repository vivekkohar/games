#!/usr/bin/env python
"""
Test script to verify Django setup is working correctly
"""
import os
import sys

def test_django_setup():
    print("🔍 Testing Django setup...")
    
    # Set Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'retro_game_web.settings')
    
    try:
        import django
        print(f"✅ Django imported successfully (version: {django.get_version()})")
        
        # Setup Django
        django.setup()
        print("✅ Django setup completed")
        
        # Test database connection
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        print("✅ Database connection working")
        
        # Test WSGI application
        from django.core.wsgi import get_wsgi_application
        application = get_wsgi_application()
        print("✅ WSGI application loaded successfully")
        
        # Test URL configuration
        from django.urls import reverse
        from django.conf import settings
        print(f"✅ Settings loaded: DEBUG={settings.DEBUG}")
        
        print("\n🎉 All tests passed! Django setup is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_django_setup()
    sys.exit(0 if success else 1)
