# Quick Start Guide - Document Analysis & Systems Mapping

## 🚀 Getting Started

Your app is running at: http://localhost:3002

## 📄 Step 1: Upload Documents

1. Go to **Admin Page**: http://localhost:3002/admin
2. Look for the "Real-Time Document Upload" section
3. **Important**: Check the ✅ "Extract Systems Map Data" checkbox
4. Upload 1-2 PDF documents about youth services/programs
5. Wait for processing to complete (you'll see real-time progress)

## 🔍 Step 2: View Document Analysis

### A. Document List
- Go to: http://localhost:3002/documents
- You should see your uploaded documents listed

### B. Research Insights
- Go to: http://localhost:3002/insights
- View AI-extracted themes, quotes, and insights from your documents

### C. Data Insights
- Go to: http://localhost:3002/data-insights
- See aggregated analysis across all documents

## 🗺️ Step 3: Systems Map (NEW!)

1. Go to: http://localhost:3002/systems
2. Toggle from "Demo Data" to "Document Data"
3. You'll see:
   - **Nodes**: Services, themes, outcomes, and factors extracted from your documents
   - **Connections**: How these elements relate to each other
   - **Interactive visualization**: Drag nodes, click for details

## 🔧 Troubleshooting

### Nothing showing up?
1. Check if AI is configured:
   - Go to http://localhost:3002/admin
   - Look for "AI Provider Status" - should show ✓ Configured
   - If not, you need OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local

2. Check database connection:
   - Look for "Database Status" on admin page
   - Should show ✓ Connected

### Upload fails?
- Make sure files are PDFs
- Keep files under 10MB
- Check browser console for errors (F12)

### No systems data?
- You must check "Extract Systems Map Data" when uploading
- Re-upload documents with this option enabled

## 📊 What You Can Do

1. **Compare Documents**: Upload multiple documents and see how themes connect
2. **Identify Patterns**: The AI finds common themes across documents
3. **Visualize Relationships**: See how services, outcomes, and barriers interact
4. **Export Insights**: Use the data for reports and presentations

## 🎯 Example Workflow

1. Upload 2-3 documents about youth programs
2. Go to Insights page - see what themes emerge
3. Go to Systems page - see how programs connect
4. Click on nodes to see which documents mention them
5. Use insights for planning and decision-making

## 💡 Pro Tips

- Upload documents with rich content about programs, outcomes, and challenges
- The more documents you upload, the better the system map becomes
- Look for "blocking" relationships (red dashed lines) - these show barriers
- Strong connections (thick lines) indicate frequently mentioned relationships

---

Need help? Check the browser console (F12) for detailed error messages.