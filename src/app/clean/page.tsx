'use client'

import { useState, useEffect } from 'react'

export default function CleanPage() {
  const [apiStatus, setApiStatus] = useState('loading')
  const [apiData, setApiData] = useState(null)
  const [dbStatus, setDbStatus] = useState('loading')
  const [dbData, setDbData] = useState(null)

  useEffect(() => {
    // Test basic API
    fetch('/api/test-simple')
      .then(res => res.json())
      .then(data => {
        setApiData(data)
        setApiStatus('success')
      })
      .catch(err => {
        console.error('API Error:', err)
        setApiStatus('error')
      })

    // Test database
    fetch('/api/db-test')
      .then(res => res.json())
      .then(data => {
        setDbData(data)
        setDbStatus(data.success ? 'success' : 'error')
      })
      .catch(err => {
        console.error('DB Error:', err)
        setDbStatus('error')
      })
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Clean Working Version</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">API Status</h2>
          <p>Status: <span className={apiStatus === 'success' ? 'text-green-600' : apiStatus === 'error' ? 'text-red-600' : 'text-blue-600'}>{apiStatus}</span></p>
          {apiData && <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">{JSON.stringify(apiData, null, 2)}</pre>}
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Database Status</h2>
          <p>Status: <span className={dbStatus === 'success' ? 'text-green-600' : dbStatus === 'error' ? 'text-red-600' : 'text-blue-600'}>{dbStatus}</span></p>
          {dbData && <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">{JSON.stringify(dbData, null, 2)}</pre>}
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Working Features</h2>
          <div className="space-y-2">
            <a href="/simple-map" className="block p-2 bg-blue-100 hover:bg-blue-200 rounded">Simple Map (Working)</a>
            <a href="/minimal-auth" className="block p-2 bg-green-100 hover:bg-green-200 rounded">Auth Test</a>
            <a href="/simple-upload" className="block p-2 bg-yellow-100 hover:bg-yellow-200 rounded">Simple Upload</a>
            <a href="/map" className="block p-2 bg-gray-100 hover:bg-gray-200 rounded">Original Map (Complex)</a>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Environment Check</h2>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
          <p>Database: Testing...</p>
        </div>
      </div>
    </div>
  )
}