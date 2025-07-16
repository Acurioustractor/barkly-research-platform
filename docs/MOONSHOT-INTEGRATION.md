# Moonshot AI Integration

This document describes how to configure and use Moonshot AI models with the Barkley Research Platform for cost-effective document analysis.

## Overview

Moonshot AI offers excellent value for document processing with competitive pricing and good performance. The platform now supports Moonshot models alongside OpenAI and Anthropic options.

## Benefits of Moonshot Integration

- **Cost-Effective**: Lower costs compared to OpenAI GPT-4 (~70% savings)
- **Large Context Windows**: Up to 128K tokens for processing very long documents
- **Good Performance**: Reliable analysis quality for most document types
- **Multiple Model Options**: Choose based on context needs and budget

## Available Moonshot Models

| Model | Context Window | Cost (per 1K tokens) | Best For |
|-------|----------------|---------------------|----------|
| `moonshot-v1-8k` | 8,192 tokens | $0.0012 | Quick analysis, short documents |
| `moonshot-v1-32k` | 32,768 tokens | $0.0024 | Standard documents, balanced performance |
| `moonshot-v1-128k` | 131,072 tokens | $0.0060 | Very long documents, comprehensive analysis |

## Processing Profiles

### Moonshot Quick
- **Model**: moonshot-v1-8k
- **Use Case**: High-volume processing, basic insights
- **Cost**: ~$0.006 per 50-page document
- **Features**: 5 themes, 10 quotes, 5 insights

### Moonshot Standard  
- **Model**: moonshot-v1-32k
- **Use Case**: Balanced quality and cost
- **Cost**: ~$0.012 per 50-page document
- **Features**: 8 themes, 20 quotes, 15 insights

### Moonshot Deep
- **Model**: moonshot-v1-128k
- **Use Case**: Comprehensive analysis
- **Cost**: ~$0.030 per 50-page document
- **Features**: 12 themes, 30 quotes, 20 insights

### Moonshot World-Class
- **Model**: moonshot-v1-128k
- **Use Case**: Research-grade analysis
- **Cost**: ~$0.045 per 50-page document
- **Features**: 25+ themes, 40+ quotes, 30+ insights, multi-pass analysis

## Setup Instructions

### 1. Get Moonshot API Key

1. Visit [Moonshot AI Platform](https://platform.moonshot.cn/)
2. Create an account and verify
3. Generate an API key
4. Note your API key (starts with `sk-`)

### 2. Configure Environment

Add your Moonshot API key to your environment:

```bash
# .env.local
MOONSHOT_API_KEY=sk-your-moonshot-api-key-here

# Optional: Set Moonshot as default
AI_DEFAULT_MODEL=moonshot-v1-32k
AI_DEFAULT_PROFILE=moonshot-standard
```

### 3. Test Integration

Run the test script to verify everything works:

```bash
node test-moonshot.js
```

Expected output:
```
🌙 Testing Moonshot API integration...
✅ Moonshot client initialized
📤 Sending test request to Moonshot API...
📥 Response received from Moonshot API
✅ JSON parsing successful
🎉 Moonshot integration test completed successfully!
```

## Using Moonshot in the Application

### Admin Panel Configuration

1. Go to `/admin` in your application
2. Click the "AI Config" tab
3. You'll see Moonshot models listed alongside OpenAI/Anthropic
4. Select a Moonshot processing profile for uploads

### Bulk Upload with Moonshot

```javascript
// Via API
const formData = new FormData();
formData.append('files', pdfFile);
formData.append('profile', 'moonshot-standard'); // Use Moonshot profile
formData.append('useAI', 'true');

const response = await fetch('/api/documents/bulk-upload', {
  method: 'POST',
  body: formData
});
```

### Processing Profile Selection

Choose based on your needs:

- **High Volume Processing**: `moonshot-quick`
- **Standard Documents**: `moonshot-standard`  
- **Research Papers**: `moonshot-deep`
- **Critical Analysis**: `moonshot-world-class`

## Cost Comparison

For a typical 50-page document:

| Provider | Model | Cost | Analysis Quality |
|----------|-------|------|------------------|
| OpenAI | GPT-4 Turbo | ~$0.35 | Excellent |
| Anthropic | Claude 3.5 Sonnet | ~$0.15 | Excellent |
| **Moonshot** | **v1-32k** | **~$0.012** | **Very Good** |
| OpenAI | GPT-3.5 Turbo | ~$0.05 | Good |

Moonshot offers **70-95% cost savings** while maintaining good analysis quality.

## API Compatibility

Moonshot uses an OpenAI-compatible API, making integration seamless:

```javascript
// Works with existing OpenAI code patterns
const completion = await moonshotClient.chat.completions.create({
  model: 'moonshot-v1-32k',
  messages: [
    { role: 'system', content: 'You are a document analyst.' },
    { role: 'user', content: 'Analyze this text...' }
  ],
  temperature: 0.3,
  max_tokens: 1500
});
```

## Best Practices

### 1. Model Selection
- Use `moonshot-v1-8k` for short documents (<5 pages)
- Use `moonshot-v1-32k` for most documents (5-20 pages)
- Use `moonshot-v1-128k` for very long documents (>20 pages)

### 2. Cost Optimization
- Start with `moonshot-quick` profile for initial screening
- Use `moonshot-standard` for most production workloads
- Reserve `moonshot-world-class` for critical documents

### 3. Quality Monitoring
- Compare results with other providers periodically
- Adjust prompts if needed for Moonshot's response style
- Monitor token usage to optimize costs

## Troubleshooting

### API Key Issues
```bash
# Test your API key
curl -X POST "https://api.moonshot.cn/v1/chat/completions" \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"moonshot-v1-8k","messages":[{"role":"user","content":"Hello"}]}'
```

### Rate Limiting
- Moonshot has rate limits per minute/hour
- The client automatically retries with exponential backoff
- Consider reducing concurrent requests if hitting limits

### Quality Issues
- Moonshot may have different response patterns than OpenAI
- Adjust prompts to be more specific if needed
- Use higher-context models for complex documents

## Performance Monitoring

Track these metrics when using Moonshot:

- **Cost per document**: Target <$0.05 for standard documents
- **Processing time**: Should be similar to other providers
- **Analysis quality**: Compare theme/quote extraction accuracy
- **Error rates**: Monitor for API failures

## Migration from Other Providers

### From OpenAI
1. Update processing profiles to use Moonshot models
2. Test with sample documents
3. Adjust prompts if response quality differs
4. Monitor cost savings

### From Anthropic
1. Moonshot uses different prompt formats
2. Test system message handling
3. Verify JSON response parsing works correctly

## Support and Documentation

- **Moonshot Documentation**: https://platform.moonshot.cn/docs
- **API Reference**: Compatible with OpenAI Chat Completions API
- **Rate Limits**: Check current limits in platform dashboard
- **Support**: Available through Moonshot platform

## Environment Variables Reference

```bash
# Required
MOONSHOT_API_KEY=sk-your-moonshot-api-key

# Optional - Model Selection
AI_DEFAULT_MODEL=moonshot-v1-32k
AI_DEFAULT_PROFILE=moonshot-standard

# Optional - Moonshot-specific
MOONSHOT_BASE_URL=https://api.moonshot.cn/v1  # Default
MOONSHOT_TIMEOUT_MS=120000                     # Default: 2 minutes
```

## Example Usage

```javascript
import { aiConfig } from '@/lib/ai-config';
import { analyzeDocumentChunk } from '@/lib/ai-service';

// Set Moonshot as preferred provider
process.env.AI_DEFAULT_MODEL = 'moonshot-v1-32k';

// Analyze document with Moonshot
const result = await analyzeDocumentChunk(
  "Sample document text for analysis...",
  "Document about youth development"
);

// Get cost estimate
const costEstimate = aiConfig.estimateProcessingCost(
  1000, // words
  'moonshot-standard'
);
console.log(`Estimated cost: $${costEstimate.total}`);
```

This integration provides excellent value for document processing while maintaining good analysis quality. The cost savings make it ideal for high-volume processing or budget-conscious projects.