# Barkly Youth Research Platform

A community-led research platform showcasing Indigenous youth voices and insights from the Barkly region, built with Next.js, TypeScript, and modern web technologies.

## 🌟 Features

### 🎯 Core Functionality
- **Interactive Storytelling**: Choose-your-adventure style navigation through youth stories
- **Data Visualization**: Systems maps, data rivers, and theme relationships using D3.js
- **Document Processing**: AI-powered PDF analysis with theme extraction and quote identification
- **Bulk Document Management**: Upload and process up to 100 documents simultaneously

### 📊 Document Analysis
- **Smart Chunking**: Intelligent text splitting for large documents
- **Theme Identification**: Automatically identify key themes related to youth voices, cultural identity, education, and health
- **Quote Extraction**: Extract meaningful quotes with confidence scoring
- **Insight Generation**: AI-generated insights based on content patterns
- **Search & Filter**: Advanced search across documents, themes, and metadata

### 🛠️ Technical Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL
- **Processing**: PDF parsing, text analysis, document chunking
- **Visualization**: D3.js, Recharts
- **Deployment**: Vercel with PostgreSQL database

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (for production)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd barkly-research-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your database URL and other configuration:
   ```
   DATABASE_URL="your-postgresql-connection-string"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
barkly-research-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/
│   │   ├── core/              # Reusable UI components
│   │   ├── visualization/     # Chart and data viz components
│   │   ├── storytelling/      # Narrative-driven components
│   │   └── frameworks/        # Analysis framework components
│   ├── data/
│   │   ├── projects/          # Project-specific data
│   │   ├── schemas/           # TypeScript data structures
│   │   └── transformers/      # Data processing utilities
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Utility functions
│   └── styles/                # Tailwind configurations
├── docs/                      # Documentation
├── public/                    # Static assets
└── cursor-rules/              # Cursor IDE configurations
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context / Zustand (TBD)
- **Data Visualization**: D3.js / Recharts (TBD)
- **Accessibility**: WCAG 2.1 AA compliant

## 📚 Documentation

- [Project Knowledge](./docs/project-knowledge/) - Research documents and protocols
- [Development Guide](./docs/development/) - Technical documentation
- [User Guides](./docs/user-guides/) - Platform usage instructions

## 🤝 Cultural Protocols

This platform handles sensitive Indigenous community data. We follow:

- **CARE+ Principles**: Collective benefit, Authority to control, Responsibility, Ethics + Cultural safety
- **Indigenous Data Sovereignty**: Respecting community ownership and control
- **Cultural Sensitivity**: Appropriate handling of sacred and sensitive knowledge

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y
```

## 📦 Building for Production

```bash
# Create production build
npm run build

# Run production server
npm start
```

## 🚀 Deployment on Vercel

### Step 1: Set up a PostgreSQL Database

**Option A: Vercel Postgres (Recommended)**
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select existing
3. Go to Storage tab → Create Database → PostgreSQL
4. Copy the connection string

**Option B: External Provider (Neon, Supabase, etc.)**
1. Create a PostgreSQL database with your preferred provider
2. Get the connection string

### Step 2: Deploy to Vercel

1. **Connect your repository to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure environment variables**
   In your Vercel project settings, add:
   ```
   DATABASE_URL=your-postgresql-connection-string
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-generated-secret
   ```

3. **Deploy**
   - Vercel will automatically detect Next.js and deploy
   - The `vercel-build` script will handle Prisma setup

### Step 3: Initialize the Database

After deployment, the database schema will be automatically created via the `vercel-build` script.

## 📱 Usage

### For End Users
- **Document Upload**: Visit `/documents` to upload and analyze PDF documents
- **Story Navigation**: Explore `/stories` for interactive youth narratives  
- **Systems Visualization**: View `/systems` for data relationships and insights

### For Administrators
- **Bulk Upload**: Visit `/admin` to upload multiple documents simultaneously
- **Document Management**: Search, filter, and organize document collections
- **Analytics**: Monitor processing statistics and repository insights

## 🔗 API Endpoints

### Document Management
- `POST /api/documents/bulk-upload` - Upload multiple documents
- `GET /api/documents/search` - Search documents with filters
- `GET /api/documents/[id]` - Get document details with chunks
- `GET /api/documents/[id]/chunks` - Get paginated document chunks
- `POST /api/documents/collections` - Create and manage collections

### Legacy Endpoints
- `POST /api/upload` - Single document upload (legacy)

## 🔄 Document Processing Pipeline

1. **Upload**: PDF files up to 50MB each
2. **Text Extraction**: Extract text content using pdf-parse
3. **Chunking**: Split documents into manageable pieces with overlap
4. **Analysis**: Identify themes, extract quotes, generate insights
5. **Storage**: Store in PostgreSQL with full-text search capabilities

## 📊 UMEL Framework Integration

The platform incorporates the UMEL (Understanding, Measurement, Evaluation, Learning) framework for Indigenous research methodologies.

## 🛡️ CARE+ Principles

Adheres to CARE+ principles:
- **Collective benefit**: Community-focused outcomes
- **Authority to control**: Indigenous data sovereignty
- **Responsibility**: Ethical research practices  
- **Ethics**: Cultural safety and respect

## 🤝 Contributing

Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting PRs.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgements

We acknowledge the Traditional Owners of the lands on which we work and pay our respects to Elders past, present and emerging.

Special thanks to the Barkly youth and community members who shared their stories and insights.
# Database connected and ready for deployment
