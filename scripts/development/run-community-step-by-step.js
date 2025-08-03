/**
 * Step-by-step community management setup
 */

const { PrismaClient } = require('@prisma/client');

async function setupCommunityManagement() {
  console.log('🏛️ Setting up Community Management System Step by Step...\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('📡 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Step 1: Add extended community fields
    console.log('🌍 Step 1: Adding extended community fields...');
    
    const communityExtensions = [
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS community_type TEXT DEFAULT 'indigenous_community' CHECK (community_type IN ('indigenous_community', 'research_institution', 'government_agency', 'ngo'))`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS geographic_region TEXT`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS traditional_territory TEXT`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS languages_spoken TEXT[] DEFAULT '{}'`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS population_size INTEGER`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS community_logo_url TEXT`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS contact_person_name TEXT`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS contact_person_role TEXT`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS community_website TEXT`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '{}'`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'suspended', 'archived'))`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ`,
      `ALTER TABLE communities ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id)`
    ];
    
    for (const sql of communityExtensions) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ✅ Field already exists (skipping)');
        } else {
          console.log(`   ⚠️  Issue: ${error.message.substring(0, 50)}...`);
        }
      }
    }
    console.log('✅ Community extensions completed\n');

    // Step 2: Create community memberships table
    console.log('👥 Step 2: Creating community memberships table...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS community_memberships (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          
          role TEXT NOT NULL DEFAULT 'member' 
              CHECK (role IN ('member', 'researcher', 'elder', 'cultural_keeper', 'admin', 'community_admin')),
          status TEXT NOT NULL DEFAULT 'active' 
              CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
          
          permissions JSONB DEFAULT '{}',
          access_level TEXT DEFAULT 'standard' 
              CHECK (access_level IN ('restricted', 'standard', 'elevated', 'full')),
          
          cultural_role TEXT,
          cultural_permissions JSONB DEFAULT '{}',
          
          joined_at TIMESTAMPTZ DEFAULT NOW(),
          approved_at TIMESTAMPTZ,
          approved_by UUID REFERENCES auth.users(id),
          last_active_at TIMESTAMPTZ DEFAULT NOW(),
          
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          
          UNIQUE(community_id, user_id)
        )
      `);
      console.log('✅ Community memberships table created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Community memberships table already exists');
      } else {
        console.log(`⚠️  Issue creating memberships table: ${error.message}`);
      }
    }

    // Step 3: Create community data policies table
    console.log('📋 Step 3: Creating community data policies table...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS community_data_policies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
          
          policy_name TEXT NOT NULL,
          policy_type TEXT NOT NULL 
              CHECK (policy_type IN ('data_access', 'data_sharing', 'cultural_protocol', 'research_ethics', 'publication')),
          policy_version TEXT DEFAULT '1.0',
          
          policy_description TEXT NOT NULL,
          policy_rules JSONB NOT NULL DEFAULT '{}',
          enforcement_level TEXT DEFAULT 'mandatory' 
              CHECK (enforcement_level IN ('advisory', 'recommended', 'mandatory', 'strict')),
          
          cultural_significance TEXT DEFAULT 'standard' 
              CHECK (cultural_significance IN ('standard', 'sensitive', 'sacred', 'ceremonial')),
          traditional_law_basis TEXT,
          elder_approval_required BOOLEAN DEFAULT false,
          
          status TEXT DEFAULT 'draft' 
              CHECK (status IN ('draft', 'review', 'approved', 'active', 'suspended', 'archived')),
          approved_by UUID REFERENCES auth.users(id),
          approved_at TIMESTAMPTZ,
          activated_at TIMESTAMPTZ,
          
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by UUID NOT NULL REFERENCES auth.users(id)
        )
      `);
      console.log('✅ Community data policies table created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Community data policies table already exists');
      } else {
        console.log(`⚠️  Issue creating data policies table: ${error.message}`);
      }
    }

    // Step 4: Create community research projects table
    console.log('🔬 Step 4: Creating community research projects table...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS community_research_projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
          
          project_name TEXT NOT NULL,
          project_description TEXT,
          research_question TEXT,
          methodology TEXT,
          
          project_type TEXT DEFAULT 'community_led' 
              CHECK (project_type IN ('community_led', 'collaborative', 'external_partnership', 'academic_research')),
          research_area TEXT,
          
          cultural_sensitivity_level TEXT DEFAULT 'community' 
              CHECK (cultural_sensitivity_level IN ('public', 'community', 'restricted', 'sacred')),
          cultural_protocols_required JSONB DEFAULT '{}',
          elder_oversight_required BOOLEAN DEFAULT false,
          
          start_date DATE,
          expected_end_date DATE,
          actual_end_date DATE,
          
          status TEXT DEFAULT 'planning' 
              CHECK (status IN ('planning', 'approved', 'active', 'paused', 'completed', 'cancelled')),
          
          lead_researcher UUID REFERENCES auth.users(id),
          collaborators UUID[] DEFAULT '{}',
          external_partners TEXT[] DEFAULT '{}',
          
          funding_source TEXT,
          budget_allocated DECIMAL(10,2),
          resources_required JSONB DEFAULT '{}',
          
          expected_outcomes TEXT,
          community_benefits TEXT,
          knowledge_sharing_plan TEXT,
          
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by UUID NOT NULL REFERENCES auth.users(id)
        )
      `);
      console.log('✅ Community research projects table created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Community research projects table already exists');
      } else {
        console.log(`⚠️  Issue creating research projects table: ${error.message}`);
      }
    }

    // Step 5: Enable RLS on new tables
    console.log('🛡️ Step 5: Enabling Row Level Security...');
    const rlsTables = ['community_memberships', 'community_data_policies', 'community_research_projects'];
    
    for (const table of rlsTables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
        console.log(`   ✅ RLS enabled on ${table}`);
      } catch (error) {
        console.log(`   ⚠️  RLS issue on ${table}: ${error.message.substring(0, 50)}...`);
      }
    }

    // Step 6: Create indexes
    console.log('📊 Step 6: Creating indexes...');
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_memberships_community ON community_memberships(community_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_memberships_user ON community_memberships(user_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_memberships_role ON community_memberships(role, access_level)`,
      `CREATE INDEX IF NOT EXISTS idx_data_policies_community ON community_data_policies(community_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_data_policies_type ON community_data_policies(policy_type, enforcement_level)`,
      `CREATE INDEX IF NOT EXISTS idx_research_projects_community ON community_research_projects(community_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_research_projects_lead ON community_research_projects(lead_researcher, status)`
    ];
    
    for (const indexSql of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ✅ Index already exists (skipping)');
        } else {
          console.log(`   ⚠️  Index issue: ${error.message.substring(0, 50)}...`);
        }
      }
    }
    console.log('✅ Indexes created\n');

    // Final verification
    console.log('🧪 Final verification...');
    
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('community_memberships', 'community_data_policies', 'community_research_projects')
      ORDER BY tablename;
    `;
    
    console.log('✅ Community management tables verified:');
    tables.forEach(table => {
      console.log(`   - ${table.tablename}`);
    });
    
    console.log('\n🎉 Community Management System setup completed successfully!');
    console.log('\n🚀 Run "node test-community-management.js" to test the system');

  } catch (error) {
    console.error('❌ Community management setup failed:');
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupCommunityManagement();