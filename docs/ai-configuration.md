# AI Configuration Guide

This guide explains how to configure and optimize AI models for document processing.

## Overview

The AI configuration system allows you to:
- Choose between different AI models (OpenAI, Anthropic)
- Select embedding models for semantic search
- Use predefined processing profiles
- Estimate processing costs
- Customize parameters for specific use cases

## Available Models

### Language Models

#### OpenAI Models

| Model | Description | Cost (per 1K tokens) | Best For |
|-------|-------------|---------------------|----------|
| `gpt-4-turbo` | Most capable, latest model | $0.01/$0.03 | Complex analysis, high accuracy |
| `gpt-4` | High quality, proven | $0.03/$0.06 | Production use, consistency |
| `gpt-3.5-turbo` | Fast and cost-effective | $0.0005/$0.0015 | Quick analysis, high volume |

#### Anthropic Models (Coming Soon)

| Model | Description | Cost (per 1K tokens) | Best For |
|-------|-------------|---------------------|----------|
| `claude-3-opus` | Most capable Claude | $0.015/$0.075 | Deep analysis, nuanced understanding |
| `claude-3-sonnet` | Balanced performance | $0.003/$0.015 | General use, good value |

### Embedding Models

| Model | Dimensions | Cost (per 1M tokens) | Best For |
|-------|------------|---------------------|----------|
| `text-embedding-3-small` | 1536 | $0.02 | Standard search, fast |
| `text-embedding-3-large` | 3072 | $0.13 | High-quality search |
| `text-embedding-ada-002` | 1536 | $0.10 | Legacy compatibility |

## Processing Profiles

### Quick Analysis
```json
{
  "aiModel": "gpt-3.5-turbo",
  "embeddingModel": "text-embedding-3-small",
  "chunkSize": 2000,
  "generateSummary": false,
  "maxThemes": 5,
  "maxQuotes": 10
}
```
**Use Case**: High-volume processing, basic insights

### Standard Analysis (Default)
```json
{
  "aiModel": "gpt-4-turbo",
  "embeddingModel": "text-embedding-3-small",
  "chunkSize": 2000,
  "generateSummary": true,
  "maxThemes": 8,
  "maxQuotes": 20
}
```
**Use Case**: Balanced quality and cost

### Deep Analysis
```json
{
  "aiModel": "gpt-4",
  "embeddingModel": "text-embedding-3-large",
  "chunkSize": 3000,
  "generateSummary": true,
  "maxThemes": 10,
  "maxQuotes": 30
}
```
**Use Case**: Maximum insight extraction

### Cost Optimized
```json
{
  "aiModel": "gpt-3.5-turbo",
  "embeddingModel": null,
  "chunkSize": 1500,
  "generateSummary": false,
  "maxThemes": 5
}
```
**Use Case**: Minimal cost, basic processing

## Configuration

### Environment Variables

```env
# Model Selection
AI_DEFAULT_MODEL=gpt-4-turbo
AI_DEFAULT_EMBEDDING_MODEL=text-embedding-3-small
AI_DEFAULT_PROFILE=standard-analysis

# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Per-Request Configuration

Override defaults for specific uploads:

```bash
curl -X POST /api/documents/bulk-upload \
  -F "files=@document.pdf" \
  -F "profile=deep-analysis" \
  -F "aiModel=gpt-4" \
  -F "generateEmbeddings=true"
```

## API Endpoints

### Get Configuration
```bash
GET /api/ai/config?includeModels=true&includeProfiles=true
```

Response:
```json
{
  "valid": true,
  "currentConfig": {
    "defaultModel": {...},
    "defaultProfile": {...}
  },
  "availableModels": {...},
  "processingProfiles": {...}
}
```

### Estimate Costs
```bash
POST /api/ai/config
{
  "action": "estimateCost",
  "data": {
    "documentWords": 10000,
    "profile": "standard-analysis"
  }
}
```

Response:
```json
{
  "estimate": {
    "aiCost": 0.325,
    "embeddingCost": 0.026,
    "total": 0.351
  }
}
```

## Cost Optimization Tips

### 1. Use Appropriate Models
- Quick screening: `gpt-3.5-turbo`
- Important documents: `gpt-4-turbo`
- Cost-sensitive: `cost-optimized` profile

### 2. Batch Processing
- Process multiple documents together
- Use background jobs for large batches

### 3. Smart Chunking
- Larger chunks = fewer API calls
- Balance with quality needs

### 4. Selective Features
```javascript
// Only generate what you need
{
  generateSummary: false,      // Skip if not needed
  generateEmbeddings: false,   // Skip for archival only
  maxThemes: 5                 // Limit extraction
}
```

## Advanced Configuration

### Custom Model Parameters

```javascript
// In your code
import { aiConfig } from '@/lib/ai-config';

const customConfig = {
  ...aiConfig.getModelConfig('gpt-4-turbo'),
  temperature: 0.2,      // More focused
  topP: 0.9,            // Slightly creative
  maxTokens: 2000       // Limit response length
};
```

### Custom Prompts

```javascript
// Set custom prompts for specific analyses
aiConfig.setCustomPrompt('legal-analysis', `
  Focus on legal implications, compliance requirements,
  and regulatory considerations in this document.
`);
```

## Monitoring Usage

### Track Costs
```javascript
// Log estimated costs before processing
const estimate = aiConfig.estimateProcessingCost(wordCount);
console.log(`Estimated cost: $${estimate.total}`);
```

### Usage Metrics
- Monitor token usage in OpenAI dashboard
- Set up billing alerts
- Review processing profiles regularly

## Best Practices

1. **Start with Standard Profile**
   - Test and adjust based on results
   - Monitor quality vs. cost

2. **Use Quick Analysis for Screening**
   - Identify important documents first
   - Apply deep analysis selectively

3. **Cache Results**
   - Store analysis results in database
   - Avoid reprocessing unchanged documents

4. **Regular Review**
   - Check new model releases
   - Update configurations for better models
   - Review cost/quality tradeoffs

## Troubleshooting

### High Costs
- Review processing profile
- Check document sizes
- Consider cost-optimized profile

### Poor Quality Results
- Upgrade to better model
- Increase chunk overlap
- Use deep-analysis profile

### Slow Processing
- Use quick-analysis for initial pass
- Enable background processing
- Consider parallel processing

### API Errors
- Check API key validity
- Monitor rate limits
- Implement retry logic