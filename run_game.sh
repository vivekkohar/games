#!/bin/bash

# Retro Platform Fighter - Diamond Quest Game Launcher
# Quick launcher script for the game

echo "🎮 Launching Retro Platform Fighter - Diamond Quest..."

# Check if conda environment exists
if ! conda env list | grep -q "gamer"; then
    echo "❌ Game environment not found. Please run setup.sh first."
    exit 1
fi

# Launch the game
conda run -n gamer python retro_platform_game.py
