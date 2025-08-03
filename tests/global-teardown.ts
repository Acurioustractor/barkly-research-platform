import { createClient } from '@supabase/supabase-js';

export default async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');
  
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Clean up all test data
    console.log('🗑️ Cleaning up test data...');
    
    // Delete in reverse order of creation to respect foreign key constraints
    await supabase.from('ai_analysis').delete().like('id', 'test-%');
    await supabase.from('community_health_indicators').delete().like('id', 'test-%');
    await supabase.from('success_patterns').delete().like('id', 'test-%');
    await supabase.from('cultural_safety_reviews').delete().like('content_id', 'test-%');
    await supabase.from('consent_records').delete().like('user_id', 'test-%');
    await supabase.from('documents').delete().like('id', 'test-%');
    await supabase.from('users').delete().like('id', 'test-%');
    await supabase.from('communities').delete().like('id', 'test-%');
    
    // Clean up any remaining test data by email/name patterns
    await supabase.from('users').delete().like('email', '%test%');
    await supabase.from('communities').delete().like('name', '%Test%');
    
    console.log('✅ Global test teardown completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during global test teardown:', error);
    // Don't throw error to avoid failing the test suite
    console.warn('⚠️ Some test data may not have been cleaned up properly');
  }
};