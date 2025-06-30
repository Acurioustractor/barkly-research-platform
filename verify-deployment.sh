#!/bin/bash

DEPLOYMENT_URL="https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app"

echo "🔍 Verifying deployment at: $DEPLOYMENT_URL"
echo ""

# Check main page
echo "1. Checking main page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL)
if [ $STATUS -eq 200 ]; then
    echo "✅ Main page is accessible"
else
    echo "❌ Main page returned status: $STATUS"
fi

# Check API endpoints
echo ""
echo "2. Checking API endpoints..."

# AI Config
echo -n "   - AI Config API: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL/api/ai/config)
if [ $STATUS -eq 200 ]; then
    echo "✅ Working"
else
    echo "❌ Status: $STATUS"
fi

# Metrics API
echo -n "   - Metrics API: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL/api/documents/metrics)
if [ $STATUS -eq 200 ]; then
    echo "✅ Working"
else
    echo "❌ Status: $STATUS"
fi

# Insights API
echo -n "   - Insights API: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL/api/documents/insights)
if [ $STATUS -eq 200 ]; then
    echo "✅ Working"
else
    echo "❌ Status: $STATUS"
fi

echo ""
echo "3. Checking key pages..."
echo -n "   - Admin page: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL/admin)
if [ $STATUS -eq 200 ]; then
    echo "✅ Accessible"
else
    echo "❌ Status: $STATUS"
fi

echo -n "   - Research page: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL/research)
if [ $STATUS -eq 200 ]; then
    echo "✅ Accessible"
else
    echo "❌ Status: $STATUS"
fi

echo ""
echo "📊 Deployment verification complete!"
echo ""
echo "Next steps:"
echo "1. If any checks failed, review environment variables in Vercel"
echo "2. Check the troubleshooting guide: TROUBLESHOOTING.md"
echo "3. View detailed logs in Vercel dashboard"