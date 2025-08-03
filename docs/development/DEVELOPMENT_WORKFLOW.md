# Barkly Research Platform - Development Workflow

## Project Structure (FINAL)
```
Barkley Backbone/                    # Root directory
├── barkly-research-platform/        # 🎯 MAIN PROJECT (work here)
│   ├── src/app/                    # Next.js pages
│   ├── src/components/             # React components  
│   ├── src/lib/                    # Utilities
│   ├── database-setup/             # Database scripts
│   ├── testing/                    # Test suites
│   ├── package.json               # Dependencies
│   ├── .env                       # Environment variables
│   └── README.md                  # Project documentation
├── archived-frontend-experiment/   # Archived (ignore)
└── PROJECT_CLEANUP_PLAN.md        # This cleanup plan
```

## Daily Development Workflow

### 1. Navigate to Project
```bash
cd "barkly-research-platform"
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open in Browser
- Main site: http://localhost:3000
- Test pages: http://localhost:3000/clean
- Upload: http://localhost:3000/simple-upload
- Map: http://localhost:3000/map

### 4. Key Working Features
✅ **Homepage** - Main Barkly Youth platform
✅ **Interactive Map** - Youth services with real data
✅ **File Upload** - Document upload to database
✅ **Authentication** - Supabase auth integration
✅ **Database** - Connected and working
✅ **Clean Test Pages** - For debugging

## File Organization
- **Pages**: `src/app/*/page.tsx`
- **Components**: `src/components/`
- **API Routes**: `src/app/api/*/route.ts`
- **Styles**: Global CSS and Tailwind
- **Database**: Scripts in `database-setup/`
- **Tests**: All tests in `testing/`

## Environment Setup
- Environment variables in `.env`
- Supabase credentials configured
- Database connected and working

## Next Development Steps
1. Enhance existing features
2. Add new pages as needed
3. Improve the interactive map
4. Build out authentication features
5. Add more cultural protocol features

## Why This Structure?
- ✅ **Professional** - Standard project organization
- ✅ **Scalable** - Easy to add features and team members
- ✅ **Clean** - Each component has its place
- ✅ **Working** - Already tested and functional