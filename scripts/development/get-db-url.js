/**
 * Helper script to construct the correct database URL
 * Run this after getting your database password from Supabase
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Database URL Configuration Helper\n');
console.log('This will help you create the correct DATABASE_URL for your .env file.\n');

console.log('📋 Steps to get your database password:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project: gkwzdnzwpfpkvgpcbeeq');
console.log('3. Go to Settings → Database');
console.log('4. Copy the password from the Connection String section\n');

rl.question('Enter your database password: ', (password) => {
  if (!password.trim()) {
    console.log('❌ Password is required. Please run the script again.');
    rl.close();
    return;
  }

  const projectRef = 'gkwzdnzwpfpkvgpcbeeq';
  const host = 'aws-0-ap-southeast-2.pooler.supabase.com';
  
  const poolerUrl = `postgresql://postgres.${projectRef}:${password}@${host}:6543/postgres`;
  const directUrl = `postgresql://postgres.${projectRef}:${password}@${host}:5432/postgres`;

  console.log('\n✅ Your database URLs:');
  console.log('\n📝 Add these to your .env file:');
  console.log('');
  console.log('# Database Configuration');
  console.log(`DATABASE_URL="${poolerUrl}"`);
  console.log(`DIRECT_URL="${directUrl}"`);
  console.log('');
  console.log('💡 Tips:');
  console.log('- DATABASE_URL uses connection pooling (port 6543) - use for app connections');
  console.log('- DIRECT_URL uses direct connection (port 5432) - use for migrations');
  console.log('- Keep these URLs secure and never commit them to version control');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Update your .env file with these URLs');
  console.log('2. Run: node test-advanced-db.js');
  console.log('3. If connection works, run the SQL setup in Supabase dashboard');

  rl.close();
});

rl.on('close', () => {
  console.log('\n👋 Database URL configuration complete!');
});