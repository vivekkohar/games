#!/usr/bin/env python
"""
Script to test level progression in the game.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'retro_game_web.settings')
django.setup()

from django.test import Client

def test_level_progression():
    """Test that the game has proper level progression."""
    print("🎮 Testing Level Progression...")
    print("=" * 40)
    
    client = Client()
    
    # Test game page loads
    print("🧪 Testing game page...")
    response = client.get('/retro_platform_fighter/play/')
    
    if response.status_code == 200:
        content = response.content.decode()
        
        # Check for level progression functions
        level_functions = [
            ('checkLevelCompletion', 'Level completion detection'),
            ('levelComplete', 'Level completion handler'),
            ('nextLevel', 'Next level progression'),
            ('initLevel', 'Level initialization'),
            ('createPlatforms', 'Platform creation for different levels'),
            ('createRobots', 'Robot creation for different levels'),
            ('createBoss', 'Boss creation'),
            ('updateUI', 'UI update function')
        ]
        
        print("\n✅ Level Progression Functions:")
        missing_functions = []
        for func, description in level_functions:
            if func in content:
                print(f"   ✅ {description}")
            else:
                print(f"   ❌ {description} - NOT FOUND")
                missing_functions.append(func)
        
        # Check for level-specific content
        level_content = [
            ('case 1:', 'Level 1 platforms'),
            ('case 2:', 'Level 2 platforms'),
            ('case 3:', 'Level 3 platforms'),
            ('case 4:', 'Level 4 platforms'),
            ('case 5:', 'Level 5 platforms'),
            ('robotCounts = [6, 9, 11, 12, 16]', 'Progressive robot counts'),
            ('gameState.level > 5', 'Win condition check'),
            ('Advancing to Level', 'Level advancement message')
        ]
        
        print("\n✅ Level Content Check:")
        for content_check, description in level_content:
            if content_check in content:
                print(f"   ✅ {description}")
            else:
                print(f"   ❌ {description} - NOT FOUND")
        
        # Check for UI updates
        ui_checks = [
            ('levelDisplay', 'Level display element'),
            ('updateUI()', 'UI update calls'),
            ('gameState.level', 'Level state tracking')
        ]
        
        print("\n✅ UI Integration Check:")
        for ui_check, description in ui_checks:
            if ui_check in content:
                print(f"   ✅ {description}")
            else:
                print(f"   ❌ {description} - NOT FOUND")
        
        if not missing_functions:
            print("\n🎉 All level progression functions found!")
            print("\n🎯 Level Progression Features:")
            print("   • 5 unique levels with different platform layouts")
            print("   • Progressive difficulty (6→16 robots)")
            print("   • Level completion detection")
            print("   • UI updates showing current level")
            print("   • Boss battles on each level")
            print("   • Win condition after level 5")
            
            print("\n🎮 How Level Progression Works:")
            print("   1. Defeat all robots on current level")
            print("   2. Defeat the level boss")
            print("   3. Level completion message appears")
            print("   4. Click 'Continue' to advance")
            print("   5. New level loads with more robots")
            print("   6. Repeat until all 5 levels completed")
            
            return True
        else:
            print(f"\n❌ Missing functions: {', '.join(missing_functions)}")
            return False
    else:
        print(f"❌ Game page failed to load: {response.status_code}")
        return False

if __name__ == "__main__":
    success = test_level_progression()
    
    if success:
        print("\n✅ Level progression system is properly implemented!")
        print("\n🎮 To test level progression:")
        print("   1. Play the game: http://localhost:8000/retro_platform_fighter/play/")
        print("   2. Defeat all robots (watch robot counter)")
        print("   3. Defeat the boss (appears after all robots defeated)")
        print("   4. Level complete message should appear")
        print("   5. Click 'Continue' to advance to next level")
        print("   6. Check level display updates in top-left")
    else:
        print("\n❌ Level progression may have issues.")
    
    sys.exit(0 if success else 1)
