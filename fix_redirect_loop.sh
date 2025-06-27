#!/bin/bash

# Quick fix for redirect loop issues
echo "🔧 Fixing redirect loop issues..."
echo "===================================="

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from template..."
    cp .env.example .env
    echo "✅ Please edit .env with your settings"
    exit 1
fi

# Backup current .env
cp .env .env.backup
echo "📋 Backed up current .env to .env.backup"

# Fix SSL redirect settings
echo "🔧 Disabling SSL redirect to prevent loops..."

# Remove existing SSL settings
grep -v "SECURE_SSL_REDIRECT\|SESSION_COOKIE_SECURE\|CSRF_COOKIE_SECURE" .env > .env.tmp

# Add corrected SSL settings
cat >> .env.tmp << EOF

# SSL Settings (disabled to prevent redirect loops)
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
EOF

# Replace .env
mv .env.tmp .env

echo "✅ Fixed SSL redirect settings"
echo ""
echo "Current SSL settings:"
echo "   SECURE_SSL_REDIRECT=False"
echo "   SESSION_COOKIE_SECURE=False" 
echo "   CSRF_COOKIE_SECURE=False"
echo ""
echo "💡 Only enable these if you have proper HTTPS setup"
echo "Now try starting the server again: ./start_production.sh"
