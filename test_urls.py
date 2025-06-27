#!/usr/bin/env python
"""
Script to test that all game URLs are working correctly.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'retro_game_web.settings')
django.setup()

from django.urls import reverse
from django.test import Client

def test_game_urls():
    """Test that game URLs are accessible."""
    print("🧪 Testing game URLs...")
    
    client = Client()
    
    # Test URLs
    urls_to_test = [
        ('/', 'Landing page'),
        ('/retro_platform_fighter/', 'Retro game index'),
        ('/retro_platform_fighter/play/', 'Retro game play'),
        ('/retro_platform_fighter/leaderboard/', 'Retro game leaderboard'),
        ('/health/', 'Health check'),
    ]
    
    all_passed = True
    
    for url, description in urls_to_test:
        try:
            response = client.get(url)
            if response.status_code == 200:
                print(f"✅ {description}: {url} - OK")
            else:
                print(f"❌ {description}: {url} - Status {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ {description}: {url} - Error: {e}")
            all_passed = False
    
    # Test Django URL names
    print("\n🔗 Testing Django URL names...")
    try:
        retro_index = reverse('retro_platform_fighter:index')
        retro_game = reverse('retro_platform_fighter:game')
        retro_leaderboard = reverse('retro_platform_fighter:leaderboard')
        
        print(f"✅ retro_platform_fighter:index -> {retro_index}")
        print(f"✅ retro_platform_fighter:game -> {retro_game}")
        print(f"✅ retro_platform_fighter:leaderboard -> {retro_leaderboard}")
        
    except Exception as e:
        print(f"❌ Error with URL names: {e}")
        all_passed = False
    
    if all_passed:
        print("\n🎉 All URL tests passed!")
    else:
        print("\n⚠️  Some URL tests failed!")
        
    return all_passed

if __name__ == "__main__":
    success = test_game_urls()
    sys.exit(0 if success else 1)
