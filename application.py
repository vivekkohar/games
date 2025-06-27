"""
WSGI application entry point for Retro Games Collection.

This module contains the WSGI application object used by deployment platforms
like AWS Elastic Beanstalk, Heroku, or other WSGI servers.
"""

import os
import sys
from pathlib import Path

# Add the project directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'retro_game_web.settings')

# Import Django's WSGI application
from django.core.wsgi import get_wsgi_application

# Create the WSGI application object
application = get_wsgi_application()

# Alternative names that some platforms might expect
app = application
wsgi_app = application
