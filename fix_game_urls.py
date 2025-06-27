#!/usr/bin/env python
"""
Script to fix game URLs in the database.
Updates the retro platform fighter URL to point to the play page.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'retro_game_web.settings')
django.setup()

from games_manager.models import Game

def fix_game_urls():
    """Fix game URLs to point to the correct play pages."""
    print("🔧 Fixing game URLs...")
    
    try:
        # Update retro platform fighter URL
        retro_game = Game.objects.filter(slug='retro-platform-fighter').first()
        if retro_game:
            old_url = retro_game.url_path
            retro_game.url_path = '/retro_platform_fighter/play/'
            retro_game.save()
            print(f"✅ Updated Retro Platform Fighter URL:")
            print(f"   From: {old_url}")
            print(f"   To: {retro_game.url_path}")
        else:
            print("⚠️  Retro Platform Fighter game not found in database")
            
        print("\n✅ Game URL fix completed!")
        
    except Exception as e:
        print(f"❌ Error fixing game URLs: {e}")
        return False
        
    return True

if __name__ == "__main__":
    success = fix_game_urls()
    sys.exit(0 if success else 1)
