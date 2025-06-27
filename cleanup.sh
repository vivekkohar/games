#!/bin/bash

# Simple cleanup script for old sessions
echo "🧹 Cleaning up old game sessions..."

# Check if we're in the gamer conda environment
if [ "$CONDA_DEFAULT_ENV" != "gamer" ]; then
    echo "⚠️  Not in 'gamer' conda environment."
    echo "Please activate the environment first: conda activate gamer"
    exit 1
fi

# Clean up expired Django sessions
echo "Cleaning expired sessions..."
python manage.py clearsessions

echo "✅ Cleanup complete!"
