# Barkly Research Platform - AI Features

## 🚀 What's New

The Barkly Research Platform now includes powerful AI capabilities for intelligent document analysis:

- **🤖 AI-Powered Analysis**: Uses OpenAI GPT models for deep document understanding
- **🔍 Semantic Search**: Find documents by meaning, not just keywords
- **📊 Smart Insights**: Automatically extract themes, quotes, and actionable insights
- **💰 Cost Optimization**: Multiple processing profiles to balance quality and cost
- **⚡ Background Processing**: Handle large documents without timeouts
- **🎯 Flexible Configuration**: Choose models and features based on your needs

## 📋 Quick Start

1. **Add OpenAI API Key**
   ```env
   OPENAI_API_KEY=sk-...
   ```

2. **Test Setup**
   ```bash
   npx tsx scripts/test-ai-setup.ts
   ```

3. **Upload Documents**
   ```bash
   curl -X POST http://localhost:3000/api/documents/bulk-upload \
     -F "files=@document.pdf" \
     -F "useAI=true"
   ```

See [QUICK-START-AI.md](./docs/QUICK-START-AI.md) for detailed setup.

## 🎨 Features

### Document Processing
- **Intelligent Chunking**: Preserves context across document sections
- **Multi-Model Support**: GPT-4, GPT-3.5, Claude (coming soon)
- **Batch Processing**: Upload up to 10 documents at once
- **Progress Tracking**: Real-time status updates

### AI Analysis
- **Document Summaries**: Comprehensive overviews of key content
- **Theme Extraction**: Identifies 8+ predefined themes with evidence
- **Quote Mining**: Extracts significant quotes with context
- **Keyword Analysis**: Categorizes terms by type and frequency
- **Insight Generation**: Creates actionable insights from content

### Search & Discovery
- **Semantic Search**: Find documents by meaning
- **Similar Documents**: Discover related content
- **Vector Embeddings**: OpenAI embeddings for accuracy
- **Relevance Scoring**: Ranked results by similarity

### Cost Management
- **Processing Profiles**: Quick, Standard, Deep, Cost-Optimized
- **Cost Estimation**: Know costs before processing
- **Model Selection**: Choose the right model for your needs
- **Usage Tracking**: Monitor API consumption

## 💻 Admin Interface

Access the admin panel at `/admin` to:
- Upload documents with AI options
- View AI configuration
- Monitor processing costs
- Check system status

## 🛠️ Configuration

### Processing Profiles

| Profile | Model | Cost/50 pages | Use Case |
|---------|-------|---------------|----------|
| Quick | GPT-3.5 | ~$0.05 | High volume, screening |
| Standard | GPT-4 Turbo | ~$0.35 | Most documents |
| Deep | GPT-4 | ~$0.70 | Critical analysis |
| Cost-Optimized | GPT-3.5 | ~$0.02 | Minimal features |

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...

# Optional
AI_DEFAULT_MODEL=gpt-4-turbo
AI_DEFAULT_PROFILE=standard-analysis
REDIS_HOST=localhost  # For background jobs
```

## 📚 Documentation

- [AI Enhancements Summary](./docs/AI-ENHANCEMENTS-SUMMARY.md) - Technical overview
- [Quick Start Guide](./docs/QUICK-START-AI.md) - Get running in 5 minutes
- [AI Configuration](./docs/ai-configuration.md) - Model and profile details
- [Background Jobs](./docs/background-jobs.md) - Process large documents
- [Vector Search Setup](./docs/vector-search-setup.md) - Enable semantic search

## 🧪 Testing

Test your AI setup:
```bash
# Run automated tests
npx tsx scripts/test-ai-setup.ts

# Test individual features
curl http://localhost:3000/api/test/ai
```

## 🚨 Important Notes

1. **API Keys**: Keep your OpenAI API key secure
2. **Costs**: Monitor usage to avoid unexpected charges
3. **Rate Limits**: The system handles rate limiting automatically
4. **Data Privacy**: Documents are processed locally, only API calls go to OpenAI

## 🔧 Troubleshooting

### Common Issues

**"AI service not configured"**
- Ensure OPENAI_API_KEY is set in .env.local

**High costs**
- Use quick-analysis profile
- Disable unnecessary features
- Process in batches

**Slow processing**
- Enable Redis for background jobs
- Use async upload for large files

## 🎯 Next Steps

1. **Production Setup**: Configure for your environment
2. **Custom Themes**: Add domain-specific themes
3. **Fine-tuning**: Adjust prompts for your content
4. **Monitoring**: Set up cost alerts

## 📧 Support

For issues or questions:
- Check `/api/test/ai` endpoint
- Review logs for errors
- See documentation in `/docs`

---

**Built with ❤️ by the Barkly Research Platform team**