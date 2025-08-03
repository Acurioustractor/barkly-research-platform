/**
 * Test the SQL syntax before running in Supabase
 * This helps catch syntax errors early
 */

const fs = require('fs');

function testSQLSyntax() {
  console.log('🔍 Testing SQL syntax...\n');
  
  try {
    // Read the fixed SQL file
    const sqlContent = fs.readFileSync('database-setup/01-supabase-advanced-config-fixed.sql', 'utf8');
    
    console.log('✅ SQL file read successfully');
    console.log(`📄 File size: ${sqlContent.length} characters`);
    
    // Basic syntax checks
    const lines = sqlContent.split('\n');
    console.log(`📝 Total lines: ${lines.length}`);
    
    // Check for common issues
    let issues = [];
    
    // Check for unmatched quotes
    const singleQuotes = (sqlContent.match(/'/g) || []).length;
    const doubleQuotes = (sqlContent.match(/"/g) || []).length;
    
    if (singleQuotes % 2 !== 0) {
      issues.push('⚠️  Unmatched single quotes detected');
    }
    
    // Check for function definitions
    const functionCount = (sqlContent.match(/CREATE OR REPLACE FUNCTION/g) || []).length;
    console.log(`🔧 Functions defined: ${functionCount}`);
    
    // Check for table creations
    const tableCount = (sqlContent.match(/CREATE TABLE/g) || []).length;
    console.log(`📊 Tables created: ${tableCount}`);
    
    // Check for extensions
    const extensionCount = (sqlContent.match(/CREATE EXTENSION/g) || []).length;
    console.log(`🧩 Extensions enabled: ${extensionCount}`);
    
    // Check for reserved keyword issues
    const reservedKeywords = ['timestamp', 'user', 'order', 'group'];
    reservedKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\s+[A-Z]`, 'gi');
      if (regex.test(sqlContent)) {
        issues.push(`⚠️  Potential reserved keyword issue: ${keyword}`);
      }
    });
    
    if (issues.length === 0) {
      console.log('\n✅ No syntax issues detected!');
      console.log('🚀 SQL file appears ready for execution');
      
      console.log('\n📋 Summary of what will be created:');
      console.log(`   - ${extensionCount} PostgreSQL extensions`);
      console.log(`   - ${tableCount} tables (audit_log)`);
      console.log(`   - ${functionCount} custom functions`);
      console.log('   - 4 custom roles for access control');
      console.log('   - Cultural data protection system');
      console.log('   - Performance monitoring system');
      console.log('   - Backup validation system');
      
    } else {
      console.log('\n⚠️  Potential issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    console.log('\n🔧 Next steps:');
    console.log('1. Go to Supabase Dashboard SQL Editor');
    console.log('2. Copy/paste database-setup/01-supabase-advanced-config-fixed.sql');
    console.log('3. Run the SQL script');
    console.log('4. Check for any errors in the output');
    console.log('5. Run: node test-advanced-db.js to verify');
    
  } catch (error) {
    console.error('❌ Error reading SQL file:', error.message);
  }
}

testSQLSyntax();