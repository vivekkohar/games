#!/bin/bash

# Setup script for Retro Games Collection
# This script sets up the conda environment and installs dependencies

echo "🎮 Setting up Retro Games Collection..."
echo "===================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if conda is available
if ! command -v conda &> /dev/null; then
    echo "❌ Conda not found! Please install Miniconda or Anaconda first."
    exit 1
fi

# Initialize conda for the shell
echo "🔄 Initializing conda..."
eval "$(conda shell.bash hook)"

# Remove existing environment if it exists
if conda env list | grep -q "gamer"; then
    echo "🗑️  Removing existing 'gamer' environment..."
    conda deactivate
    conda env remove -n gamer -y
fi

# Create fresh environment with Python 3.11
echo "🌱 Creating new 'gamer' environment with Python 3.11..."
conda create -n gamer python=3.11 -y

# Activate the environment
echo "🔧 Activating 'gamer' environment..."
conda activate gamer

# Install dependencies
echo "📦 Installing dependencies..."
conda install -c conda-forge django pillow -y
pip install -r requirements.txt

# Verify installation
echo "🔍 Verifying installation..."
python -c "
import sys
import django
import PIL
print(f'Python version: {sys.version}')
print(f'Django version: {django.get_version()}')
print(f'Pillow version: {PIL.__version__}')
"

echo ""
echo "✅ Setup complete! You can now run the server with:"
echo "   conda activate gamer"
echo "   ./run.sh"
echo ""
