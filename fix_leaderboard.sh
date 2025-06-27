#!/bin/bash

# Fix leaderboard issues in retro platform fighter
echo "🔧 Fixing Retro Platform Fighter Leaderboard..."
echo "===================================="

# Check if we're in the gamer conda environment
if [ "$CONDA_DEFAULT_ENV" != "gamer" ]; then
    echo "⚠️  Not in 'gamer' conda environment."
    echo "Please activate the environment first: conda activate gamer"
    exit 1
fi

# Test API endpoints
echo "🧪 Testing API endpoints..."
python test_api.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Leaderboard fix completed!"
    echo ""
    echo "The following issues have been fixed:"
    echo "  • API endpoint URLs corrected in JavaScript"
    echo "  • Error handling improved for score submission"
    echo "  • Better user feedback for failed submissions"
    echo ""
    echo "🎮 Try playing the game and submitting a score!"
    echo "   Game: http://localhost:8000/retro_platform_fighter/play/"
    echo "   Leaderboard: http://localhost:8000/retro_platform_fighter/leaderboard/"
else
    echo ""
    echo "❌ Some issues remain. Check the error messages above."
fi
