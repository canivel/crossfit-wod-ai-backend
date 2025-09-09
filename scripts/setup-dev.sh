#!/bin/bash

# CrossFit WOD AI Backend - Development Setup Script
# Run this after cloning the repository

set -e  # Exit on any error

echo "🏋️ Setting up CrossFit WOD AI Backend development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📋 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  IMPORTANT: You need to get real API keys from your team!"
    echo "   Contact your team lead for:"
    echo "   - Anthropic API key"
    echo "   - Supabase project credentials"
    echo "   - JWT secrets"
else
    echo "✅ .env.local already exists"
fi

# Check if git hooks directory exists
if [ -d ".git" ]; then
    echo "🔒 Setting up git security..."
    # Add pre-commit hook to prevent secret commits
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Prevent committing secrets

if git diff --cached --name-only | grep -E '\.(env|local)$'; then
    echo "❌ ERROR: Attempted to commit environment files!"
    echo "   Environment files contain secrets and should never be committed."
    echo "   Files blocked:"
    git diff --cached --name-only | grep -E '\.(env|local)$' | sed 's/^/     /'
    echo ""
    echo "   To fix: git reset HEAD <filename>"
    exit 1
fi
EOF
    chmod +x .git/hooks/pre-commit
    echo "✅ Git pre-commit hook installed (prevents secret commits)"
fi

# Test the setup
echo "🧪 Testing setup..."
if npm test > /dev/null 2>&1; then
    echo "✅ Tests pass"
else
    echo "⚠️  Tests failed - you may need to configure environment variables"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. 📧 Contact your team lead for environment secrets"
echo "2. ✏️  Edit .env.local with real values (never commit this file!)"
echo "3. 🚀 Start development: npm run dev"
echo "4. 📚 View API docs: http://localhost:3000/api-docs"
echo ""
echo "💡 Tip: Use 1Password or secure messaging to share secrets safely"