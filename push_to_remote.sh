#!/bin/bash

echo "🚀 Retro Games Collection - Push to Remote Repository"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if git repository exists
if [ ! -d ".git" ]; then
    echo "❌ Error: No git repository found"
    exit 1
fi

echo "📊 Current Repository Status:"
echo "Branch: $(git branch --show-current)"
echo "Commits: $(git rev-list --count HEAD)"
echo "Files: $(git ls-files | wc -l)"
echo "Uncommitted changes: $(git status --porcelain | wc -l)"
echo ""

# Check if remote already exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ Remote 'origin' already configured:"
    git remote -v
    echo ""
    echo "🚀 Pushing to existing remote..."
    git push -u origin main
else
    echo "❓ No remote repository configured."
    echo ""
    read -p "Enter the remote repository URL: " remote_url
    if [ -n "$remote_url" ]; then
        echo "🔗 Adding remote: $remote_url"
        git remote add origin "$remote_url"
        echo "🚀 Pushing to remote..."
        git push -u origin main
    else
        echo "❌ Remote URL required"
        exit 1
    fi
fi

echo ""
echo "✅ Repository successfully pushed to remote!"
echo "🔗 Remote URL: $(git remote get-url origin)"
echo "🌐 You can now view your repository online"
echo ""
