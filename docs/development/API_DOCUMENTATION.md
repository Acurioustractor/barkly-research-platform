# 📚 Barkley Research Platform - API Documentation

**Version:** 1.0.0  
**Base URL:** `https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app`  
**Local Development:** `http://localhost:3000`

## 🔐 Authentication & Security

### Rate Limiting
- **Document Upload:** 100 requests per 15 minutes
- **AI Analysis:** 50 requests per 15 minutes  
- **General APIs:** 100 requests per 15 minutes

### Headers
All requests should include:
```
Content-Type: application/json (for JSON APIs)
Content-Type: multipart/form-data (for file uploads)
```

### Security Features
- ✅ Rate limiting
- ✅ File validation (PDF only, max 10MB)
- ✅ Input sanitization
- ✅ Indigenous data protocol validation
- ✅ CORS protection
- ✅ Security headers

## 📄 Document Upload API

### Upload Document
**Endpoint:** `POST /api/documents`

Upload and process PDF documents for analysis.

#### Request Format
```bash
curl -X POST \
  https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app/api/documents \
  -F "file=@research-document.pdf" \
  -F "category=research" \
  -F "source=external-integration" \
  -F "tags=youth,education,culture"
```

#### Form Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | PDF file (max 10MB) |
| `category` | String | ❌ | Document category (default: "general") |
| `source` | String | ❌ | Source identifier (default: "upload") |
| `tags` | String | ❌ | Comma-separated tags |

#### Response Format
```json
{
  "success": true,
  "document": {
    "id": "cmd6hntlk0004lu67uf3n23qg",
    "filename": "1752702242423-research-document.pdf",
    "originalName": "research-document.pdf",
    "size": 2048576,
    "wordCount": 1250,
    "pageCount": 5,
    "status": "COMPLETED",
    "uploadedAt": "2025-07-16T21:44:02.423Z"
  },
  "indigenousDataWarnings": [
    "Content contains culturally sensitive terms: traditional knowledge, elder. Ensure proper community consent and CARE+ principles compliance."
  ]
}
```

#### Error Responses
```json
// Rate limit exceeded
{
  "error": "Rate limit exceeded. Please try again later."
}

// Invalid file
{
  "error": "File too large. Maximum size: 10MB"
}

// Security violation
{
  "error": "Invalid file type. Allowed types: application/pdf"
}
```

## 🤖 AI Analysis API

### Analyze Content
**Endpoint:** `POST /api/ai/analyze`

Perform AI-powered analysis on text content with Indigenous research protocols.

#### Request Format
```bash
curl -X POST \
  https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Young people in the Barkly region value education that connects to culture.",
    "analysisType": "quick",
    "options": {
      "extractThemes": true,
      "extractQuotes": true,
      "extractInsights": true
    }
  }'
```

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | String | ✅ | Text content to analyze |
| `analysisType` | String | ❌ | Analysis depth: "quick", "standard", "deep", "world-class" |
| `options` | Object | ❌ | Analysis options |
| `options.extractThemes` | Boolean | ❌ | Extract themes (default: true) |
| `options.extractQuotes` | Boolean | ❌ | Extract significant quotes (default: true) |
| `options.extractInsights` | Boolean | ❌ | Generate insights (default: true) |
| `options.extractEntities` | Boolean | ❌ | Extract entities (default: false) |
| `options.extractSystems` | Boolean | ❌ | Extract system elements (default: false) |

#### Analysis Types
| Type | Description | Speed | Depth | Use Case |
|------|-------------|-------|-------|----------|
| `quick` | Fast processing | ⚡ Fast | Basic | Quick insights |
| `standard` | Balanced analysis | 🚀 Medium | Good | General research |
| `deep` | Comprehensive analysis | 🐌 Slow | Deep | Detailed studies |
| `world-class` | Maximum insight extraction | 🐌 Slowest | Deepest | Academic research |

#### Response Format
```json
{
  "themes": [
    {
      "title": "Cultural Connection and Identity",
      "description": "The importance of maintaining cultural connections in education",
      "category": "Strengths and Resources",
      "confidence": 0.9,
      "mentions": 3
    }
  ],
  "quotes": [
    {
      "text": "Young people in the Barkly region value education that connects to culture.",
      "context": "Educational preferences and cultural identity",
      "confidence": 0.85,
      "significance": "high"
    }
  ],
  "insights": [
    {
      "title": "Cultural Integration in Education",
      "description": "There is a strong preference for culturally-connected educational approaches",
      "type": "opportunity",
      "confidence": 0.8,
      "actionable": true
    }
  ]
}
```

### Legacy Format Support
The API also supports legacy prompt-based requests:

```json
{
  "systemPrompt": "You are an expert research analyst...",
  "userPrompt": "Analyze this content: [content]",
  "maxTokens": 2000,
  "temperature": 0.3
}
```

## 📊 System Status APIs

### Database Health Check
**Endpoint:** `GET /api/check-db`

```bash
curl https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app/api/check-db
```

**Response:**
```json
{
  "databaseConnected": true,
  "totalDocuments": 15,
  "status": "healthy"
}
```

### AI Configuration
**Endpoint:** `GET /api/ai/config`

```bash
curl https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app/api/ai/config
```

**Response:**
```json
{
  "valid": true,
  "availableModels": {
    "ai": ["gpt-4-turbo", "claude-3.5-sonnet", "moonshot-v1-8k"],
    "embedding": ["text-embedding-3-small", "text-embedding-3-large"]
  },
  "processingProfiles": [
    "quick-analysis",
    "standard-analysis", 
    "deep-analysis",
    "world-class-semantic"
  ]
}
```

## 🔗 Integration Examples

### Python Integration
```python
import requests

# Upload document
with open('research.pdf', 'rb') as f:
    response = requests.post(
        'https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app/api/documents',
        files={'file': f},
        data={
            'category': 'research',
            'source': 'python-integration',
            'tags': 'youth,education'
        }
    )
    
document = response.json()
print(f"Uploaded: {document['document']['id']}")

# Analyze content
analysis_response = requests.post(
    'https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app/api/ai/analyze',
    json={
        'content': 'Your content here...',
        'analysisType': 'standard',
        'options': {
            'extractThemes': True,
            'extractQuotes': True,
            'extractInsights': True
        }
    }
)

analysis = analysis_response.json()
print(f"Found {len(analysis['themes'])} themes")
```

### JavaScript/Node.js Integration
```javascript
const FormData = require('form-data');
const fs = require('fs');

// Upload document
const formData = new FormData();
formData.append('file', fs.createReadStream('research.pdf'));
formData.append('category', 'research');
formData.append('source', 'node-integration');

const uploadResponse = await fetch(
  'https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app/api/documents',
  { method: 'POST', body: formData }
);

const document = await uploadResponse.json();
console.log('Uploaded:', document.document.id);

// Analyze content
const analysisResponse = await fetch(
  'https://barkly-research-platform-28raxpxna-benjamin-knights-projects.vercel.app/api/ai/analyze',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'Your content here...',
      analysisType: 'quick',
      options: {
        extractThemes: true,
        extractQuotes: true,
        extractInsights: true
      }
    })
  }
);

const analysis = await analysisResponse.json();
console.log('Themes found:', analysis.themes.length);
```

## 🛡️ Indigenous Data Sovereignty

The platform implements **CARE+ Principles** for Indigenous data:

- **C**ollective Benefit: Data should benefit Indigenous communities
- **A**uthority to Control: Indigenous peoples have authority over their data
- **R**esponsibility: Data use should be responsible and ethical
- **E**thics: Data practices should be ethical and respectful

### Cultural Sensitivity Warnings
The API automatically detects culturally sensitive content and provides warnings:

```json
{
  "indigenousDataWarnings": [
    "Content contains culturally sensitive terms: traditional knowledge, elder, ceremony. Ensure proper community consent and CARE+ principles compliance."
  ]
}
```

## 📈 Performance & Monitoring

### Response Times
- Document Upload: < 30 seconds
- AI Analysis: < 10 seconds  
- Status Checks: < 2 seconds

### File Limits
- Maximum file size: 10MB
- Supported formats: PDF only
- Text extraction: Automatic with multiple fallback methods

### Rate Limits
- Document uploads: 100/15min
- AI analysis: 50/15min
- Concurrent requests: 10

## 🚨 Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized  
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Description of the error",
  "details": "Additional error details",
  "timestamp": "2025-07-16T21:44:02.423Z"
}
```

## 🎯 Ready for Integration

This API is production-ready and designed for integration with:
- ✅ **Poe Bots** - Direct API integration
- ✅ **Research Platforms** - Document analysis workflows
- ✅ **Educational Tools** - Content analysis features
- ✅ **Community Platforms** - Cultural compliance checking
- ✅ **Data Analysis Tools** - Automated research pipelines

---

**🚀 Need help with integration? Contact the development team or check the GitHub repository for additional examples and support.**