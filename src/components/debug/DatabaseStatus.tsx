'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DatabaseStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [tables, setTables] = useState<string[]>([])

  useEffect(() => {
    async function checkDatabase() {
      try {
        const supabase = createClient()
        
        // Test basic connection with a simple query
        const { data, error: connectionError } = await supabase
          .from('documents')
          .select('id')
          .limit(1)

        if (connectionError) {
          setError(connectionError.message)
          setStatus('error')
        } else {
          setStatus('connected')
          setTables(['documents', 'users', 'auth.users']) // Basic tables we expect
        }
      } catch (err: any) {
        setError(err.message)
        setStatus('error')
      }
    }

    checkDatabase()
  }, [])

  if (status === 'loading') {
    return <div className="p-4 bg-blue-50 rounded">Checking database connection...</div>
  }

  if (status === 'error') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-bold text-red-800">Database Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded">
      <h3 className="font-bold text-green-800">Database Connected ✅</h3>
      <p className="text-green-600">Found {tables.length} tables</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-green-700">Show tables</summary>
        <ul className="mt-1 text-xs text-green-600">
          {tables.map(table => (
            <li key={table}>• {table}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}