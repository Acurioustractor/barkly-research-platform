# SAFE PROJECT CLEANUP PLAN
## 🚨 CRITICAL: This is a systematic cleanup to preserve working functionality

### PHASE 1: IDENTIFY CORE FILES (DO NOT TOUCH)
✅ **ESSENTIAL - NEVER DELETE:**
```
src/                    # Main application code
package.json           # Dependencies
package-lock.json      # Lock file
.env                   # Working environment variables
.env.local            # Local overrides (working)
next.config.ts         # Next.js config
tailwind.config.ts     # Tailwind config
tsconfig.json          # TypeScript config
.gitignore            # Git ignore rules
node_modules/         # Dependencies
.next/                # Build cache
public/               # Static assets
```

### PHASE 2: ORGANIZE DEVELOPMENT FILES
📁 **CREATE ORGANIZED FOLDERS:**

#### A. Documentation Folder
Move all .md files to `docs/development/`:
- AI-IMPLEMENTATION-COMPLETE.md
- ANALYSIS_WORKFLOWS.md
- API_DOCUMENTATION.md
- ARCHITECTURE_REDESIGN.md
- DEPLOYMENT_STATUS.md
- DEVELOPMENT_ROADMAP.md
- And 15+ other .md files

#### B. Scripts Folder  
Move all .js test/utility scripts to `scripts/development/`:
- analyze-document.js
- check-chunks.js
- check-db.js
- complete-analysis.js
- platform-test.js
- test-*.js (30+ files)
- verify-*.js files

#### C. Database Folder (already exists)
Keep `database-setup/` but organize:
- Move loose .sql files into it
- Keep only essential setup files

#### D. Archive Folder
Move old/unused files to `archive/`:
- Old logs (dev.log, server.log)
- Old configs (.env.backup)
- Test files (malicious.txt, test.txt)
- Build outputs (build_output.txt)

### PHASE 3: REMOVE DUPLICATES
❌ **SAFE TO DELETE:**
- `frontend/` folder inside main project (duplicate)
- Multiple .env.* files (keep only .env and .env.local)
- Old deployment files
- Test result files
- Temporary files

### PHASE 4: FINAL STRUCTURE
```
barkly-research-platform/
├── src/                          # ✅ Core application
├── public/                       # ✅ Static assets  
├── docs/                         # 📁 All documentation
│   ├── development/             # Development docs
│   ├── deployment/              # Deployment guides
│   └── api/                     # API documentation
├── scripts/                      # 📁 All utility scripts
│   ├── development/             # Dev/test scripts
│   ├── database/               # DB utilities
│   └── deployment/             # Deploy scripts
├── database-setup/              # ✅ Database scripts (organized)
├── testing/                     # ✅ Test suites (keep as-is)
├── archive/                     # 📁 Old/unused files
├── package.json                 # ✅ Essential
├── .env                         # ✅ Essential
├── .env.local                   # ✅ Essential
├── next.config.ts               # ✅ Essential
├── tailwind.config.ts           # ✅ Essential
├── tsconfig.json                # ✅ Essential
└── README.md                    # ✅ Main documentation
```

## EXECUTION STEPS (SAFE ORDER):

### Step 1: Create Organization Folders
```bash
mkdir -p docs/development docs/deployment docs/api
mkdir -p scripts/development scripts/database scripts/deployment  
mkdir -p archive
```

### Step 2: Move Documentation (SAFE)
```bash
mv *.md docs/development/
mv README.md .  # Keep main README at root
```

### Step 3: Move Scripts (SAFE)
```bash
mv *.js scripts/development/
mv *.sh scripts/deployment/
```

### Step 4: Move Database Files (SAFE)
```bash
mv *.sql database-setup/ 2>/dev/null || true
```

### Step 5: Archive Old Files (SAFE)
```bash
mv *.log archive/
mv *.txt archive/
mv .env.backup archive/ 2>/dev/null || true
```

### Step 6: Remove Duplicates (CAREFUL)
```bash
rm -rf frontend/  # Duplicate folder
rm -f .env.sentry-build-plugin  # Not needed
```

## VERIFICATION AFTER CLEANUP:
1. ✅ `npm run dev` still works
2. ✅ Database connection still works  
3. ✅ All pages still load
4. ✅ Upload still functions
5. ✅ Map still displays

## ROLLBACK PLAN:
- Git commit before cleanup
- Keep archive folder until verified working
- Can restore any file if needed