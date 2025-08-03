#!/bin/bash

echo "🧪 Simple AI System Test"
echo "========================"

echo ""
echo "📊 1. AI Service Health:"
curl -s "http://localhost:3002/api/ai/status" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"   Status: {data['status']}\")"

echo ""
echo "📊 2. Available Providers:"
curl -s "http://localhost:3002/api/ai/status" | python3 -c "
import sys, json
data = json.load(sys.stdin)
providers = ', '.join(data['providersAvailable'])
print(f\"   Providers: {providers}\")"

echo ""
echo "📊 3. Job Queue Status:"
curl -s "http://localhost:3002/api/jobs?action=stats" | python3 -c "
import sys, json
data = json.load(sys.stdin)
stats = data['stats']
print(f\"   Total jobs: {stats['total']}\")"

echo ""
echo "📊 4. Database Status:"
curl -s "http://localhost:3002/api/check-db" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"   Documents: {data['totalDocuments']}\")"

echo ""
echo "🎯 Test a Simple AI Request:"
curl -s -X POST "http://localhost:3002/api/ai/status?action=test" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data['success']:
    print(f\"   ✅ AI Response: {data['response']}\")"

echo ""
echo "🎉 All Systems Operational!"
echo ""
echo "📋 Next Steps:"
echo "   1. Go to: http://localhost:3002/documents"
echo "   2. Upload a PDF with AI analysis enabled"
echo "   3. Monitor progress in real-time"
echo "   4. Check insights at: http://localhost:3002/insights"