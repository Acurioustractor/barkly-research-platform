export default function WorkingPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">✅ Working Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded bg-green-50">
          <h2 className="text-xl font-semibold text-green-800">System Status: WORKING</h2>
          <p className="text-green-600">This page loads without errors</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Test Links</h2>
          <div className="space-y-2">
            <a href="/clean" className="block p-2 bg-blue-100 hover:bg-blue-200 rounded">Clean Test Page</a>
            <a href="/simple-map" className="block p-2 bg-green-100 hover:bg-green-200 rounded">Simple Map</a>
            <a href="/minimal-auth" className="block p-2 bg-yellow-100 hover:bg-yellow-200 rounded">Auth Test</a>
            <a href="/map" className="block p-2 bg-purple-100 hover:bg-purple-200 rounded">Original Map</a>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Environment</h2>
          <p>Node Environment: {process.env.NODE_ENV}</p>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        </div>
      </div>
    </div>
  )
}