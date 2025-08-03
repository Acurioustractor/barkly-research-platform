'use client'

import { useState, useEffect } from 'react'

export default function SimpleUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [communities, setCommunities] = useState<any[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState('')
  const [culturalSensitivity, setCulturalSensitivity] = useState('public')
  const [uploading, setUploading] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles)
      setStatus('')
      setResults([])
    }
  }

  // Load communities on component mount
  useEffect(() => {
    async function loadCommunities() {
      try {
        const response = await fetch('/api/communities')
        const data = await response.json()
        setCommunities(data.communities || [])
      } catch (error) {
        console.error('Failed to load communities:', error)
      }
    }
    loadCommunities()
  }, [])

  const handleUpload = async () => {
    if (files.length === 0) {
      setStatus('Please select at least one file')
      return
    }

    setUploading(true)
    setStatus('Uploading files...')
    const uploadResults: any[] = []
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setStatus(`Uploading ${i + 1} of ${files.length}: ${file.name}`)
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('community_id', selectedCommunity)
        formData.append('cultural_sensitivity', culturalSensitivity)
        
        const response = await fetch('/api/upload-enhanced', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        uploadResults.push({
          filename: file.name,
          success: response.ok,
          result: result
        })
      }
      
      setResults(uploadResults)
      const successCount = uploadResults.filter(r => r.success).length
      setStatus(`Completed! ${successCount} of ${files.length} files uploaded successfully`)
      
    } catch (error) {
      setStatus('Upload failed')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
      padding: '32px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '32px',
          color: '#111827'
        }}>Document Upload</h1>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: '24px'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1F2937'
            }}>Upload Files</h2>
            
            <div style={{
              border: '2px dashed #D1D5DB',
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#F9FAFB'
            }}>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".txt,.pdf,.md,.docx,.doc"
                multiple
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              />
              <p style={{
                marginTop: '8px',
                fontSize: '14px',
                color: '#6B7280'
              }}>
                Select multiple files (PDF, TXT, MD, DOC, DOCX). Hold Ctrl/Cmd to select multiple files.
              </p>
            </div>
            
            {files.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ 
                  fontWeight: '500', 
                  color: '#374151',
                  marginBottom: '8px'
                }}>Selected Files ({files.length}):</h3>
                <div style={{ 
                  maxHeight: '128px', 
                  overflowY: 'auto',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px'
                }}>
                  {files.map((file, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      fontSize: '14px', 
                      backgroundColor: '#F9FAFB', 
                      padding: '8px',
                      borderBottom: index < files.length - 1 ? '1px solid #E5E7EB' : 'none'
                    }}>
                      <span style={{ color: '#374151' }}>{file.name}</span>
                      <span style={{ color: '#6B7280' }}>({Math.round(file.size / 1024)}KB)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Community Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '8px', 
              color: '#374151' 
            }}>Community (Optional)</label>
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedCommunity(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select a community...</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cultural Sensitivity */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              marginBottom: '8px', 
              color: '#374151' 
            }}>Cultural Sensitivity</label>
            <select
              value={culturalSensitivity}
              onChange={(e) => setCulturalSensitivity(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="public">Public - Can be shared openly</option>
              <option value="community">Community - Restricted to community members</option>
              <option value="sacred">Sacred - Requires elder approval</option>
            </select>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: files.length === 0 || uploading ? '#9CA3AF' : 
                             isHovering ? '#1D4ED8' : '#2563EB',
              color: 'white',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              cursor: files.length === 0 || uploading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              outline: 'none',
              userSelect: 'none'
            }}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}`}
          </button>
        </div>

        {status && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '24px',
            marginTop: '24px'
          }}>
            <h3 style={{
              fontWeight: '600',
              fontSize: '18px',
              marginBottom: '8px',
              color: '#1F2937'
            }}>Upload Status</h3>
            <p style={{
              fontSize: '16px',
              color: status.includes('Completed') || status.includes('Success') ? '#059669' : 
                     status.includes('Error') || status.includes('failed') ? '#DC2626' : 
                     '#2563EB'
            }}>
              {status}
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '24px',
            marginTop: '24px'
          }}>
            <h3 style={{
              fontWeight: '600',
              fontSize: '18px',
              marginBottom: '16px',
              color: '#1F2937'
            }}>Upload Results</h3>
            <div>
              {results.map((result, index) => (
                <div key={index} style={{
                  padding: '16px',
                  borderRadius: '8px',
                  borderLeft: '4px solid',
                  borderLeftColor: result.success ? '#10B981' : '#EF4444',
                  backgroundColor: result.success ? '#ECFDF5' : '#FEF2F2',
                  marginBottom: index < results.length - 1 ? '12px' : '0'
                }}>
                  <div>
                    <h4 style={{
                      fontWeight: '500',
                      color: '#1F2937',
                      marginBottom: '4px'
                    }}>{result.filename}</h4>
                    <p style={{
                      fontSize: '14px',
                      color: result.success ? '#059669' : '#DC2626'
                    }}>
                      {result.success ? '✓ Upload successful' : '✗ Upload failed'}
                    </p>
                  </div>
                  {result.result && (
                    <details style={{ marginTop: '8px' }}>
                      <summary style={{
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#6B7280'
                      }}>
                        View details
                      </summary>
                      <pre style={{
                        fontSize: '12px',
                        backgroundColor: '#F3F4F6',
                        padding: '8px',
                        borderRadius: '4px',
                        marginTop: '8px',
                        overflow: 'auto',
                        maxHeight: '128px'
                      }}>
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div style={{
        marginTop: '32px',
        textAlign: 'center'
      }}>
        <a href="/" style={{
          color: '#2563EB',
          fontWeight: '500',
          textDecoration: 'none'
        }}>
          ← Back to Dashboard
        </a>
      </div>
    </div>
  )
}