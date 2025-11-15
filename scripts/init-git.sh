#!/bin/bash
# Initialize git repository and prepare for GitHub
# Usage: ./scripts/init-git.sh

set -e

echo "🔧 Initializing git repository..."

cd /home/astra/cptsd

# Check if already a git repo
if [ -d .git ]; then
    echo "⚠️  Git repository already initialized"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Initialize git if not already done
if [ ! -d .git ]; then
    git init
    echo "✅ Git repository initialized"
fi

# Add all files
git add .

# Create initial commit
if git diff --cached --quiet; then
    echo "⚠️  No changes to commit"
else
    git commit -m "Initial commit: CPTSD CMS and Blog applications with Jenkins CI/CD"
    echo "✅ Initial commit created"
fi

echo ""
echo "📋 Next steps:"
echo "   1. Create a new repository on GitHub (e.g., https://github.com/yourusername/cptsd)"
echo ""
echo "   2. Add the remote and push:"
echo "      git remote add origin https://github.com/yourusername/cptsd.git"
echo "      git branch -M main"
echo "      git push -u origin main"
echo ""
echo "   3. Or if repository already exists:"
echo "      git remote add origin https://github.com/yourusername/cptsd.git"
echo "      git push -u origin main"
echo ""

