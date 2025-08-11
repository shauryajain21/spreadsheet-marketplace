'use client'

import { useState, useEffect } from 'react'

interface PreviewData {
  type: string
  headers: string[]
  rows: string[][]
  totalRows: number
  sheets?: string[]
}

interface FilePreviewProps {
  listingId: string
  className?: string
}

export default function FilePreview({ listingId, className = '' }: FilePreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSheet, setSelectedSheet] = useState(0)

  useEffect(() => {
    fetchPreview()
  }, [listingId])

  const fetchPreview = async () => {
    try {
      const response = await fetch(`/api/listings/${listingId}/preview`)
      
      if (response.ok) {
        const data = await response.json()
        setPreview(data.preview)
      } else {
        setError('Unable to load preview')
      }
    } catch (error) {
      setError('Unable to load preview')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`border rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !preview) {
    return (
      <div className={`border rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📊</div>
          <p>Preview not available</p>
          <p className="text-sm">You'll see the full file after purchase</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">File Preview</h3>
          <span className="text-sm text-gray-500">
            {preview.totalRows} rows total
          </span>
        </div>
        
        {preview.sheets && preview.sheets.length > 1 && (
          <div className="flex space-x-2 mt-3">
            {preview.sheets.map((sheet, index) => (
              <button
                key={index}
                onClick={() => setSelectedSheet(index)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedSheet === index
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {sheet}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {preview.headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preview.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center">
            <div className="text-yellow-600 text-sm">
              <strong>Preview Only:</strong> This shows the first few rows. 
              The complete file with all {preview.totalRows} rows will be available after purchase.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}