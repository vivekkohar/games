#!/usr/bin/env python
"""
Test script to verify WSGI application loads correctly.
"""

import os
import sys
from pathlib import Path

# Add project to path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

def test_wsgi_application():
    """Test that the WSGI application can be imported and initialized."""
    print("🧪 Testing WSGI application...")
    
    try:
        # Test importing from application.py
        from application import application
        print("✅ Successfully imported WSGI application from application.py")
        
        # Test that it's callable
        if callable(application):
            print("✅ WSGI application is callable")
        else:
            print("❌ WSGI application is not callable")
            return False
            
        # Test importing from Django's wsgi module
        from retro_game_web.wsgi import application as django_app
        print("✅ Successfully imported WSGI application from retro_game_web.wsgi")
        
        # Verify they're the same type
        if type(application) == type(django_app):
            print("✅ Both WSGI applications are the same type")
        else:
            print("⚠️  WSGI applications are different types (this might be okay)")
            
        print("\n🎉 WSGI application test completed successfully!")
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import WSGI application: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    # Set Django settings
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'retro_game_web.settings')
    
    # Run test
    success = test_wsgi_application()
    sys.exit(0 if success else 1)
