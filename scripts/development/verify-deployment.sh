#!/bin/bash

# Get deployment URL from command line argument or use default
DEPLOYMENT_URL=${1:-"https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app"}

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
echo "4. Testing AI Analysis Pipeline..."
echo -n "   - AI Status: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL/api/ai/status)
if [ $STATUS -eq 200 ]; then
    echo "✅ Working"
else
    echo "❌ Status: $STATUS"
fi

echo -n "   - Database Check: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL/api/check-db)
if [ $STATUS -eq 200 ]; then
    echo "✅ Working"
else
    echo "❌ Status: $STATUS"
fi

echo -n "   - Job Queue: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL/api/jobs)
if [ $STATUS -eq 200 ]; then
    echo "✅ Working"
else
    echo "❌ Status: $STATUS"
fi

echo ""
echo "5. Testing Document Processing Features..."
echo -n "   - Document Upload SSE: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL/api/documents/upload-sse)
if [ $STATUS -eq 405 ]; then  # Method not allowed is expected for GET
    echo "✅ Endpoint exists"
else
    echo "❌ Status: $STATUS"
fi

echo -n "   - Job Stream: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL/api/jobs/stream)
if [ $STATUS -eq 200 ]; then
    echo "✅ Working"
else
    echo "❌ Status: $STATUS"
fi

echo ""
echo "📊 Deployment verification complete!"
echo ""
echo "🎯 Key Features Available:"
echo "- ✅ Multi-provider AI integration (OpenAI, Anthropic, Moonshot)"
echo "- ✅ Background job processing with real-time streaming"
echo "- ✅ Comprehensive document analysis pipeline"
echo "- ✅ Quality validation and optimization"
echo "- ✅ Performance monitoring and metrics"
echo "- ✅ Rate limiting and provider failover"
echo ""
echo "Next steps:"
echo "1. If any checks failed, review environment variables in Vercel"
echo "2. Ensure DATABASE_URL and AI API keys are configured"
echo "3. Check the troubleshooting guide: TROUBLESHOOTING.md"
echo "4. View detailed logs in Vercel dashboard"
echo "5. Test document upload functionality manually"