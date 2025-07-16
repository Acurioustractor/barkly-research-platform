# Barkley Research Platform - Analysis Workflows Guide

## Platform Overview

The Barkley Research Platform is a sophisticated document analysis and systems mapping tool designed to support community research, policy analysis, and evidence-based decision making for the Barkley Regional Deal.

## Core Capabilities

### 🔍 **Document Processing & Analysis**
- **AI-Enhanced Text Extraction**: PDF parsing with multiple fallback methods
- **Intelligent Chunking**: Granular (300-500 chars) and standard (2000 chars) strategies
- **Multi-pass Analysis**: Up to 3 analysis passes for deeper insights
- **Theme Identification**: AI-powered theme extraction with confidence scoring
- **Quote Extraction**: Key quotes with speaker attribution and context
- **Insight Generation**: Strategic insights and pattern identification
- **Keyword Analysis**: Frequency and relevance-based keyword extraction

### 🗺️ **Systems Mapping & Visualization**
- **AI-Powered Entity Extraction**: Services, themes, outcomes, factors
- **Relationship Mapping**: Supports, blocks, enables, influences, requires
- **Interactive D3.js Visualizations**: Force-directed graphs with drag-and-drop
- **Geographic Mapping**: Real-world youth services mapping for Tennant Creek
- **Network Analysis**: Document similarity and connection networks
- **Systems Thinking**: Multi-document aggregated systems view

## Getting Started - Clean Database Setup

### Option 1: Selective Cleanup (Recommended for Development)
```sql
-- Run this to remove test files and failed uploads only
-- Edit database-cleanup.sql and run the "OPTION 1" section
psql "$DATABASE_URL" -f database-cleanup.sql
```

### Option 2: Complete Reset (Fresh Start)
```sql
-- Edit database-cleanup.sql and uncomment "OPTION 3"
-- WARNING: This deletes ALL documents and analysis data
psql "$DATABASE_URL" -f database-cleanup.sql
```

### Option 3: Keep Only Specific Documents
```sql
-- Edit database-cleanup.sql and uncomment "OPTION 2"
-- Keeps only Barkley Regional Deal related documents
psql "$DATABASE_URL" -f database-cleanup.sql
```

## Analysis Workflows

### 🚀 **Workflow 1: Basic Document Analysis**

1. **Upload Documents**
   ```bash
   # Visit http://localhost:3001/admin
   # Use "Upload" tab for single documents
   # Use "Manage" tab for bulk uploads
   ```

2. **Monitor Processing**
   ```bash
   # Check processing status
   curl http://localhost:3001/api/documents/metrics
   ```

3. **Review Results**
   ```bash
   # Visit http://localhost:3001/insights
   # View themes, quotes, and insights
   ```

### 🎯 **Workflow 2: Advanced Systems Mapping**

1. **Upload Policy/Research Documents**
   - Use AI-enhanced processing profile
   - Enable "Extract Systems" option
   - Recommended: "world-class" or "deep-analysis" profiles

2. **Generate Systems Map**
   ```bash
   # API approach
   curl -X POST http://localhost:3001/api/documents/systems-map \
     -H "Content-Type: application/json" \
     -d '{"documentIds": ["doc1", "doc2"], "confidence": 0.7}'
   
   # Or visit http://localhost:3001/systems for web interface
   ```

3. **Analyze Relationships**
   - View interactive D3.js visualization
   - Identify key system entities and connections
   - Export insights for reporting

### 📊 **Workflow 3: Multi-Document Analysis**

1. **Bulk Upload Related Documents**
   ```bash
   # Use bulk upload with consistent metadata
   # Set source: "regional_plan", category: "policy_analysis"
   ```

2. **Cross-Document Insights**
   ```bash
   # Visit http://localhost:3001/insights
   # Filter by themes to see patterns across documents
   ```

3. **Network Analysis**
   ```bash
   # API for document similarity network
   curl http://localhost:3001/api/documents/network
   
   # Or visit insights page for visualization
   ```

### 🗺️ **Workflow 4: Geographic & Service Mapping**

1. **Youth Services Analysis**
   ```bash
   # Visit http://localhost:3001/map
   # Interactive map with 11+ youth services in Tennant Creek
   # Filter by priorities: Safe Place, Strong Adults, Learning, etc.
   ```

2. **Service Gap Analysis**
   - Use heat mapping to identify coverage gaps
   - Overlay community voice quotes
   - Analyze overcrowding impact

3. **Cultural Integration**
   - Traditional knowledge perspectives
   - Community voice integration
   - Cultural context analysis

## Advanced API Integration Opportunities

### 🔗 **External Data Sources**

1. **Government APIs**
   ```javascript
   // Australian Bureau of Statistics
   // data.gov.au datasets
   // State/territory government APIs
   ```

2. **Social Services APIs**
   ```javascript
   // Community services directories
   // Youth program databases
   // Health and education systems
   ```

3. **Geographic Data**
   ```javascript
   // Australian Geographic Data
   // Census data integration
   // Land use and planning data
   ```

### 📈 **Heat Mapping & Growth Analysis**

1. **Population Analytics**
   ```bash
   # Integrate ABS population data
   # Track demographic changes
   # Service demand projection
   ```

2. **Service Utilization**
   ```bash
   # Track service usage patterns
   # Identify high-demand areas
   # Resource allocation optimization
   ```

3. **Outcome Measurement**
   ```bash
   # Link service provision to outcomes
   # Community wellbeing indicators
   # Evidence-based impact assessment
   ```

## Processing Profiles for Different Analysis Types

### Quick Analysis (Fast, Basic Insights)
```javascript
profile: "quick-analysis"
// 1 pass, basic themes, 5 min processing
```

### Standard Research (Balanced)
```javascript
profile: "claude-standard" 
// 2 passes, detailed themes, quotes, 15 min processing
```

### Deep Policy Analysis (Comprehensive)
```javascript
profile: "world-class"
// 3 passes, systems extraction, full insights, 45 min processing
```

### Systems Mapping Focus
```javascript
profile: "moonshot-systems" // (when API working)
// Cost-effective systems entity extraction
```

## Monitoring & Quality Assurance

### Processing Metrics
```bash
# Check overall platform health
curl http://localhost:3001/api/documents/metrics

# Monitor processing success rates
# Target: >80% success rate for quality documents
```

### Analysis Quality Indicators
- **Theme Confidence**: Target >0.7 for reliable themes
- **Quote Relevance**: Speaker attribution success rate
- **Systems Extraction**: Entity relationship accuracy
- **Processing Time**: Monitor for performance issues

## Best Practices

### 📁 **Document Preparation**
1. **Quality PDFs**: Text-based, not scanned images
2. **Consistent Naming**: Use descriptive filenames
3. **Metadata**: Set source, category, and tags consistently
4. **Size Management**: <50MB per document for optimal processing

### 🔄 **Processing Strategy**
1. **Start Small**: Test with 1-2 documents first
2. **Iterate**: Refine processing profiles based on results
3. **Monitor**: Check metrics regularly
4. **Clean Data**: Remove failed/test documents regularly

### 📊 **Analysis Approach**
1. **Progressive Analysis**: Start broad, then drill down
2. **Cross-Reference**: Compare themes across documents
3. **Validate Insights**: Review AI-generated insights manually
4. **Export Results**: Use APIs to extract data for reporting

## Troubleshooting

### Common Issues
1. **PDF Extraction Fails**: Use text-based PDFs, not scanned images
2. **Low Theme Confidence**: Try higher quality/longer documents  
3. **Processing Timeouts**: Use smaller documents or basic profiles
4. **API Errors**: Check database connectivity and API keys

### Performance Optimization
1. **Database Cleanup**: Regular cleanup of test/failed documents
2. **Batch Processing**: Use bulk upload for multiple documents
3. **Profile Selection**: Match processing intensity to document importance
4. **Monitoring**: Track success rates and processing times

## Next Steps

1. **Clean your database** using the provided cleanup script
2. **Upload your Barkley Regional Deal documents** 
3. **Start with basic analysis** to understand themes and insights
4. **Progress to systems mapping** for complex policy documents
5. **Integrate external APIs** for comprehensive regional analysis
6. **Build custom dashboards** using the provided API endpoints

The platform is designed to grow with your analysis needs, supporting everything from individual document insights to comprehensive regional systems mapping and policy analysis.