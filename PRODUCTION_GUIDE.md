# 🚀 Simple Production Guide

## Quick Setup

### 1. Environment Setup
```bash
# Activate conda environment
conda activate gamer

# Copy and edit environment file
cp .env.example .env
# Edit .env with your database URL and settings
```

### 2. Deploy
```bash
# Deploy the application
./deploy.sh

# Create admin user (optional)
./deploy.sh --create-admin
```

### 3. Start Server
```bash
# Start production server (single worker)
./start_production.sh
```

## Configuration

### Required .env Variables
```
DATABASE_URL=postgresql://user:pass@host:port/dbname
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,localhost
```

### Optional Settings
```
PORT=8000
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
```

## Maintenance

### Regular Cleanup
```bash
# Clean up old sessions (run weekly)
./cleanup.sh
```

### Health Check
Visit: `http://yourdomain.com/health/`

### Admin Panel
Visit: `http://yourdomain.com/admin/`
- Username: admin
- Password: admin123 (if created with --create-admin)

## Security Notes

1. **Change SECRET_KEY** in production
2. **Set DEBUG=False** for production
3. **Use HTTPS** in production (set CSRF_TRUSTED_ORIGINS accordingly)
4. **Keep database credentials secure**

## Troubleshooting

### "Page isn't redirecting properly" Error
This usually means there's a redirect loop. Fix by:

1. **Check SSL settings in .env**:
   ```
   SECURE_SSL_REDIRECT=False
   SESSION_COOKIE_SECURE=False
   CSRF_COOKIE_SECURE=False
   ```

2. **Only enable SSL if you have HTTPS**:
   ```
   # Only set these to True if you have proper HTTPS setup
   SECURE_SSL_REDIRECT=True
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   ```

### Debug Production Issues
```bash
# Run debug script to check configuration
./debug.sh

# Check server logs when starting
./start_production.sh
# Look for error messages in the output
```

### Common Issues
1. **Database connection**: Check DATABASE_URL format
2. **Static files not loading**: Run `python manage.py collectstatic`
3. **CSRF errors**: Check CSRF_TRUSTED_ORIGINS setting
4. **Redirect loops**: Disable SSL redirect if not using HTTPS
5. **Permission errors**: Check file permissions on static files

### Logs
- Application logs: Check console output
- Health check: Visit `/health/` endpoint

## WSGI Application

The project includes a WSGI application object for deployment:

### Files
- `application.py` - Main WSGI entry point (for platforms like AWS EB, Heroku)
- `retro_game_web/wsgi.py` - Django's default WSGI module

### Usage Examples

**Gunicorn (current setup):**
```bash
gunicorn retro_game_web.wsgi:application
# or
gunicorn application:application
```

**AWS Elastic Beanstalk:**
```python
# EB looks for 'application' object in application.py
from application import application
```

**Other WSGI servers:**
```python
# Import the WSGI app
from application import application
# or
from retro_game_web.wsgi import application
```

### Test WSGI Application
```bash
# Test that WSGI app loads correctly
python test_wsgi.py
```

## File Structure
```
games-collection/
├── application.py          # WSGI entry point
├── deploy.sh              # Deployment script
├── start_production.sh     # Production server
├── cleanup.sh             # Maintenance script
├── test_wsgi.py           # WSGI test script
├── .env                   # Environment variables
├── requirements.txt       # Dependencies
└── manage.py              # Django management
```

That's it! Simple and production-ready.
