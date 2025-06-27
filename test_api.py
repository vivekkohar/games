#!/usr/bin/env python
"""
Script to test the retro platform fighter API endpoints.
"""

import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'retro_game_web.settings')
django.setup()

from django.test import Client
from django.contrib.sessions.models import Session

def test_api_endpoints():
    """Test all API endpoints for the retro platform fighter game."""
    print("🧪 Testing Retro Platform Fighter API endpoints...")
    
    client = Client()
    
    # Create a session first by visiting the game page
    response = client.get('/retro_platform_fighter/play/')
    if response.status_code != 200:
        print(f"❌ Failed to load game page: {response.status_code}")
        return False
    
    print("✅ Game page loads successfully")
    
    # Test high score submission
    print("\n🏆 Testing high score submission...")
    score_data = {
        'player_name': 'Test Player',
        'score': 1000,
        'level_reached': 3
    }
    
    response = client.post(
        '/retro_platform_fighter/api/submit-score/',
        data=json.dumps(score_data),
        content_type='application/json'
    )
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"✅ High score submitted successfully! Rank: #{result.get('rank')}")
        else:
            print(f"❌ High score submission failed: {result.get('error')}")
            return False
    else:
        print(f"❌ High score API returned status {response.status_code}")
        print(f"Response: {response.content.decode()}")
        return False
    
    # Test high scores retrieval
    print("\n📊 Testing high scores retrieval...")
    response = client.get('/retro_platform_fighter/api/high-scores/')
    
    if response.status_code == 200:
        result = response.json()
        high_scores = result.get('high_scores', [])
        print(f"✅ Retrieved {len(high_scores)} high scores")
        if high_scores:
            print(f"   Top score: {high_scores[0]['player_name']} - {high_scores[0]['score']} points")
    else:
        print(f"❌ High scores API returned status {response.status_code}")
        return False
    
    # Test leaderboard page
    print("\n🏅 Testing leaderboard page...")
    response = client.get('/retro_platform_fighter/leaderboard/')
    
    if response.status_code == 200:
        print("✅ Leaderboard page loads successfully")
    else:
        print(f"❌ Leaderboard page returned status {response.status_code}")
        return False
    
    print("\n🎉 All API tests passed!")
    return True

if __name__ == "__main__":
    success = test_api_endpoints()
    sys.exit(0 if success else 1)
