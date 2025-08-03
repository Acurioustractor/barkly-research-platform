# Barkly Research Platform - Project Cleanup Plan

## Current Status
- **Main Project**: `barkly-research-platform/` (Next.js) - WORKING ✅
- **Experimental Frontend**: `frontend/` (React/Vite) - INCOMPLETE ❌

## Recommended Action: Consolidate to Main Project

### Why Keep `barkly-research-platform/` as Primary:
✅ **Fully Functional** - Database, auth, map, upload all working
✅ **Complete Architecture** - Next.js with proper API routes
✅ **Real Data** - Connected to Supabase with actual content
✅ **Cultural Features** - Interactive map with youth services data
✅ **Testing Suite** - Comprehensive testing already built
✅ **Production Ready** - Can be deployed immediately

### What to Do with `frontend/`:
❌ **Archive or Delete** - It's incomplete and duplicates main project functionality

## Cleanup Steps:

### Step 1: Confirm Main Project is Complete
- [x] Database connection working
- [x] Authentication system integrated
- [x] File upload working
- [x] Interactive map functional
- [x] Clean test pages available

### Step 2: Archive Frontend Experiment
- [ ] Move `frontend/` to `archived-frontend/` 
- [ ] Or delete if not needed
- [ ] Update documentation to reflect single project structure

### Step 3: Finalize Main Project Structure
- [ ] Clean up any unused test files
- [ ] Organize components properly
- [ ] Update README with final architecture
- [ ] Document the working features

## Final Project Structure:
```
barkly-research-platform/          # MAIN PROJECT
├── src/
│   ├── app/                      # Next.js pages
│   │   ├── page.tsx             # Homepage
│   │   ├── clean/               # Clean test pages
│   │   ├── simple-upload/       # Working upload
│   │   ├── simple-map/          # Working map
│   │   ├── map/                 # Original interactive map
│   │   └── api/                 # API routes
│   ├── components/              # React components
│   │   ├── auth/               # Authentication
│   │   ├── core/               # Core UI components
│   │   └── debug/              # Debug components
│   └── lib/                    # Utilities and services
├── database-setup/             # Database scripts
├── testing/                    # Test suites
└── package.json               # Dependencies and scripts
```

## Benefits of This Approach:
1. **Single Source of Truth** - One project to maintain
2. **No Duplication** - Avoid maintaining two codebases
3. **Working Foundation** - Build on what's already functional
4. **Clear Development Path** - Focus on enhancing existing features
5. **Production Ready** - Can deploy and use immediately

## Next Development Priorities:
1. Enhance the working upload system
2. Improve the interactive map features
3. Add more authentication features
4. Build out the cultural protocols system
5. Add advanced visualization features