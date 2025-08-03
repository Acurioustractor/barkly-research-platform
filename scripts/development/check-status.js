/**
 * Quick status check script
 * Run with: node check-status.js
 */

async function checkStatus() {
  console.log('🔍 Checking system status...\n');
  
  // Check if server is running
  try {
    const response = await fetch('http://localhost:3000/api/documents/simple-upload');
    const data = await response.json();
    
    console.log('✅ Server is running');
    console.log('📡 Simple upload endpoint:', data);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running');
      console.log('🔧 Start it with: npm run dev');
      return;
    } else {
      console.log('⚠️  Server error:', error.message);
    }
  }
  
  // Check database status
  try {
    const dbResponse = await fetch('http://localhost:3000/api/check-db');
    const dbData = await dbResponse.json();
    
    console.log('💾 Database status:', dbData);
    
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
  
  // Check AI status
  try {
    const aiResponse = await fetch('http://localhost:3000/api/ai/status');
    const aiData = await aiResponse.json();
    
    console.log('🤖 AI status:', aiData);
    
  } catch (error) {
    console.log('❌ AI check failed:', error.message);
  }
}

checkStatus();