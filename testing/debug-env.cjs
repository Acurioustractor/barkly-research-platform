// Debug Environment Variables
require('dotenv').config({ path: '../.env' })

console.log('🔍 Environment Variable Debug\n')

const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY'
]

envVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...${value.substring(value.length - 10)}`)
  } else {
    console.log(`❌ ${varName}: NOT SET`)
  }
})

console.log('\n🔗 Testing Supabase URL format...')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
if (url && url.includes('supabase.co')) {
  console.log('✅ URL format looks correct')
} else {
  console.log('❌ URL format may be incorrect')
}

console.log('\n🔑 Testing key formats...')
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (anonKey && anonKey.startsWith('eyJ')) {
  console.log('✅ Anon key format looks correct (JWT)')
} else {
  console.log('❌ Anon key format may be incorrect')
}

if (serviceKey && serviceKey.startsWith('eyJ')) {
  console.log('✅ Service key format looks correct (JWT)')
} else {
  console.log('❌ Service key format may be incorrect')
}