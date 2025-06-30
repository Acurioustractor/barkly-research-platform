# Anthropic Claude Setup Guide

This guide explains how to use Anthropic's Claude models with the Barkly Research Platform.

## Overview

The platform now supports both OpenAI and Anthropic models, allowing you to choose the best AI provider for your needs.

## Available Claude Models

| Model | Description | Best For | Cost (per 1K tokens) |
|-------|-------------|----------|---------------------|
| **Claude 3.5 Opus** | Most capable model | Complex analysis, nuanced understanding | $15/$75 |
| **Claude 3.5 Sonnet** | Fast and intelligent | General use, great balance | $3/$15 |
| **Claude 3.5 Haiku** | Fastest model | High volume, quick analysis | $0.80/$4 |

## Setup

### 1. Get an Anthropic API Key

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Navigate to API Keys
3. Create a new API key
4. Copy the key (starts with `sk-ant-`)

### 2. Configure Environment

Add to your `.env.local`:

```env
# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-...

# Set Claude as default (optional)
AI_DEFAULT_MODEL=claude-3.5-sonnet
```

### 3. Test Your Setup

```bash
npx tsx scripts/test-ai-setup.ts
```

You should see:
```
✅ AI API keys found (OpenAI: No, Anthropic: Yes)
✅ AI configuration is valid
```

## Using Claude Models

### Option 1: Set as Default

In `.env.local`:
```env
AI_DEFAULT_MODEL=claude-3.5-sonnet
AI_DEFAULT_PROFILE=claude-standard
```

### Option 2: Per-Upload Selection

When uploading documents, select a Claude profile:
- `claude-quick` - Uses Haiku for fast processing
- `claude-standard` - Uses Sonnet for balanced analysis

### Option 3: API Request

```bash
curl -X POST /api/documents/bulk-upload \
  -F "files=@document.pdf" \
  -F "profile=claude-standard"
```

## Claude vs OpenAI Comparison

### Claude Advantages
- **Better Context Understanding**: Excels at nuanced analysis
- **Stronger Safety**: Built-in safety features
- **Consistent Outputs**: More predictable responses
- **Large Context Window**: Up to 200K tokens

### OpenAI Advantages
- **Embeddings Support**: Required for semantic search
- **JSON Mode**: Better structured output support
- **Wider Ecosystem**: More tools and integrations
- **Model Variety**: More model options

## Recommended Configurations

### For Research Documents
```env
AI_DEFAULT_MODEL=claude-3.5-sonnet
AI_DEFAULT_PROFILE=claude-standard
```
- Excellent at understanding context
- Great for extracting nuanced themes
- Strong quote identification

### For High Volume Processing
```env
AI_DEFAULT_MODEL=claude-3.5-haiku
AI_DEFAULT_PROFILE=claude-quick
```
- Fast processing
- Lower cost
- Good for initial screening

### For Complex Analysis
```env
AI_DEFAULT_MODEL=claude-3.5-opus
AI_DEFAULT_PROFILE=deep-analysis
```
- Best quality insights
- Deep thematic analysis
- Comprehensive summaries

## Cost Comparison

For a typical 50-page document (~25,000 words):

| Provider | Model | Estimated Cost |
|----------|-------|----------------|
| OpenAI | GPT-3.5 Turbo | ~$0.05 |
| OpenAI | GPT-4 Turbo | ~$0.35 |
| Anthropic | Claude 3.5 Haiku | ~$0.03 |
| Anthropic | Claude 3.5 Sonnet | ~$0.12 |
| Anthropic | Claude 3.5 Opus | ~$0.60 |

## Limitations

### No Embedding Support
Claude doesn't provide embedding models. For semantic search:
- Keep OpenAI API key configured
- System will use OpenAI for embeddings only
- Claude for analysis, OpenAI for search

### JSON Output
Claude doesn't have a JSON mode. The system handles this by:
- Adding explicit JSON instructions
- Parsing responses carefully
- Fallback handling for malformed JSON

## Best Practices

1. **Start with Sonnet**: Good balance of quality and cost
2. **Use Haiku for Screening**: Quick initial analysis
3. **Reserve Opus**: For your most important documents
4. **Combine Providers**: Claude for analysis, OpenAI for embeddings

## Troubleshooting

### "Anthropic API key not found"
- Check `.env.local` for `ANTHROPIC_API_KEY`
- Ensure key starts with `sk-ant-`
- Restart development server

### "Invalid model specified"
- Check model name in configuration
- Use one of: claude-3.5-opus, claude-3.5-sonnet, claude-3.5-haiku

### JSON Parsing Errors
- Claude sometimes returns markdown-formatted JSON
- System has fallback parsing
- Check logs for raw response

## API Status

Check which provider is active:
```bash
curl /api/ai/config
```

Response shows current provider:
```json
{
  "currentConfig": {
    "defaultModel": {
      "provider": "anthropic",
      "model": "claude-3.5-sonnet"
    }
  }
}
```

## Migration Guide

To switch from OpenAI to Claude:

1. **Keep Both Keys**: Maintain both API keys for flexibility
2. **Update Default Model**: Change `AI_DEFAULT_MODEL`
3. **Test Processing**: Run a test document
4. **Monitor Results**: Compare output quality

## Support

- Claude Documentation: [docs.anthropic.com](https://docs.anthropic.com)
- API Status: [status.anthropic.com](https://status.anthropic.com)
- Community: [community.anthropic.com](https://community.anthropic.com)