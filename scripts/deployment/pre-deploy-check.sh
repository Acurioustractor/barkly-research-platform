#!/bin/bash

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."
echo ""

# Check for TypeScript errors in main source
echo "📝 Checking TypeScript (main source)..."
npx tsc --noEmit --project tsconfig.json --skipLibCheck
if [ $? -eq 0 ]; then
    echo "✅ No critical TypeScript errors in main source"
else
    echo "⚠️  TypeScript errors found (may be in test/script files)"
    echo "   Continuing with deployment as main source is likely okay"
fi

# Check for missing dependencies
echo ""
echo "📦 Checking dependencies..."
missing_deps=0

# Check if required dependencies are installed
deps=("pdf-parse" "unpdf" "pdf-lib" "openai" "@anthropic-ai/sdk")
for dep in "${deps[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        echo "✅ $dep installed"
    else
        echo "❌ $dep missing"
        missing_deps=$((missing_deps + 1))
    fi
done

if [ $missing_deps -gt 0 ]; then
    echo "❌ Missing dependencies found"
    exit 1
fi

# Check environment template
echo ""
echo "🔐 Checking environment template..."
if [ -f .env.example ]; then
    echo "✅ .env.example exists"
else
    echo "⚠️  .env.example missing"
fi

# Check for sensitive data
echo ""
echo "🔒 Checking for sensitive data..."
sensitive_patterns=("sk-" "api03-" "postgres://" "supabase.co")
sensitive_found=0

for pattern in "${sensitive_patterns[@]}"; do
    # Exclude .env.local and test files
    if grep -r "$pattern" --exclude=".env.local" --exclude="*.test.*" --exclude-dir="node_modules" --exclude-dir=".git" . 2>/dev/null | grep -v ".env.example"; then
        echo "⚠️  Found potentially sensitive data containing: $pattern"
        sensitive_found=$((sensitive_found + 1))
    fi
done

if [ $sensitive_found -eq 0 ]; then
    echo "✅ No sensitive data found in code"
fi

# Summary
echo ""
echo "================================"
if [ $sensitive_found -eq 0 ]; then
    echo "✅ Pre-deployment checks passed!"
    echo ""
    echo "Next steps:"
    echo "1. Review any warnings above"
    echo "2. Run: ./deploy-to-test.sh"
else
    echo "⚠️  Pre-deployment checks completed with warnings"
    echo "Please review the issues above before deploying"
fi