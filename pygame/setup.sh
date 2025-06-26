#!/bin/bash

# Retro Platform Fighter - Diamond Quest Setup Script
# This script sets up the game environment and dependencies

echo "🎮 Setting up Retro Platform Fighter - Diamond Quest..."
echo "=================================================="

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "❌ Conda is not installed. Please install Miniconda or Anaconda first."
    echo "   Download from: https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

echo "✅ Conda found"

# Create conda environment
echo "📦 Creating conda environment 'gamer'..."
if conda env list | grep -q "gamer"; then
    echo "⚠️  Environment 'gamer' already exists. Updating..."
    conda env update -f environment.yml
else
    conda env create -f environment.yml
fi

echo "✅ Environment setup complete"

# Provide instructions
echo ""
echo "🚀 Setup Complete!"
echo "=================="
echo ""
echo "To play the game:"
echo "1. Activate the environment:"
echo "   conda activate gamer"
echo ""
echo "2. Run the game:"
echo "   python retro_platform_game.py"
echo ""
echo "🎮 Game Controls:"
echo "   Arrow Keys/WASD: Move and jump"
echo "   X: Punch"
echo "   Z: Kick"
echo "   ESC: Quit"
echo ""
echo "Have fun playing! 🎉"
