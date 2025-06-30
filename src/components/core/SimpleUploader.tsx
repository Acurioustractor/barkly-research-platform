'use client';

import React, { useState } from 'react';

export const SimpleUploader = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus('Uploading...');

    try {
      const formData = new FormData();
      formData.append('files', file);

      // Try the basic upload endpoint
      const response = await fetch('/api/upload-basic', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        setStatus(`Success! ${JSON.stringify(result, null, 2)}`);
      } else {
        setStatus(`Error: ${result.error || 'Upload failed'}`);
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Upload failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-bold mb-4">Simple Upload Test</h3>
      
      <input
        type="file"
        onChange={handleUpload}
        accept=".pdf"
        disabled={loading}
        className="mb-4"
      />
      
      {status && (
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
          {status}
        </pre>
      )}
    </div>
  );
};