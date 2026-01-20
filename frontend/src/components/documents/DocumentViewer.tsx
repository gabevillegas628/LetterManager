import { useState, useEffect } from 'react'
import { X, Download, Loader2, FileText, AlertCircle, ExternalLink } from 'lucide-react'
import mammoth from 'mammoth'

interface DocumentViewerProps {
  document: {
    id: string
    originalName: string
    mimeType: string
    size: number
  }
  onClose: () => void
}

export default function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [docxHtml, setDocxHtml] = useState<string | null>(null)

  const documentUrl = `/api/uploads/documents/${document.id}`
  const downloadUrl = `/api/uploads/documents/${document.id}/download`

  const isImage = document.mimeType.startsWith('image/')
  const isPdf = document.mimeType === 'application/pdf'
  const isDocx = document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const isDoc = document.mimeType === 'application/msword'

  useEffect(() => {
    const loadDocument = async () => {
      if (isDocx) {
        try {
          setLoading(true)
          setError(null)

          const response = await fetch(documentUrl)
          if (!response.ok) {
            throw new Error('Failed to fetch document')
          }

          const arrayBuffer = await response.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer })

          if (result.messages.length > 0) {
            console.warn('Mammoth warnings:', result.messages)
          }

          setDocxHtml(result.value)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load document')
        } finally {
          setLoading(false)
        }
      } else if (isImage || isPdf) {
        // Images and PDFs load directly, we just need to wait for them
        setLoading(false)
      } else {
        setLoading(false)
      }
    }

    loadDocument()
  }, [document.id, isDocx, isImage, isPdf, documentUrl])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium text-gray-900 truncate max-w-md">{document.originalName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download={document.originalName}
              className="btn-secondary px-3 py-1.5 text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </a>
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost px-3 py-1.5 text-sm"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button onClick={onClose} className="btn-ghost p-1.5" title="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0 bg-gray-100">
          {loading && (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium">Failed to load document</p>
              <p className="text-gray-500 text-sm mt-2">{error}</p>
              <a href={downloadUrl} download className="btn-primary mt-4">
                <Download className="h-4 w-4 mr-2" />
                Download Instead
              </a>
            </div>
          )}

          {!loading && !error && isImage && (
            <div className="flex items-center justify-center p-4 min-h-[400px]">
              <img
                src={documentUrl}
                alt={document.originalName}
                className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
                onLoad={() => setLoading(false)}
                onError={() => setError('Failed to load image')}
              />
            </div>
          )}

          {!loading && !error && isPdf && (
            <iframe
              src={documentUrl}
              className="w-full h-[70vh]"
              title={document.originalName}
              onLoad={() => setLoading(false)}
            />
          )}

          {!loading && !error && isDocx && docxHtml && (
            <div className="p-8 bg-white mx-auto max-w-4xl my-4 shadow-lg min-h-[60vh]">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: docxHtml }}
              />
            </div>
          )}

          {!loading && !error && isDoc && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Legacy .doc format</p>
              <p className="text-gray-500 text-sm mt-2 text-center max-w-md">
                This is an older Word document format that can't be previewed in the browser.
                Please download the file to view it.
              </p>
              <a href={downloadUrl} download className="btn-primary mt-4">
                <Download className="h-4 w-4 mr-2" />
                Download File
              </a>
            </div>
          )}

          {!loading && !error && !isImage && !isPdf && !isDocx && !isDoc && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Preview not available</p>
              <p className="text-gray-500 text-sm mt-2 text-center max-w-md">
                This file type ({document.mimeType}) cannot be previewed in the browser.
              </p>
              <a href={downloadUrl} download className="btn-primary mt-4">
                <Download className="h-4 w-4 mr-2" />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
