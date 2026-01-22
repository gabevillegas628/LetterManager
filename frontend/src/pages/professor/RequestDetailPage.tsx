import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  FileText,
  Mail,
  Send,
  Download,
  Check,
  Clock,
  AlertCircle,
  Edit,
  Lock,
  Unlock,
  Loader2,
  ExternalLink,
  Copy,
  RefreshCw,
  Eye,
  Trash2,
} from 'lucide-react'
import { useRequest } from '../../hooks/useRequests'
import { useTemplates } from '../../hooks/useTemplates'
import {
  useLettersForRequest,
  useLettersWithDestinations,
  useGenerateLetter,
  useGenerateAllLetters,
  useSyncMasterToDestinations,
  useUpdateLetter,
  useFinalizeLetter,
  useUnfinalizeLetter,
  useDeleteAllLetters,
  useGeneratePdf,
  useDownloadPdf,
  usePreviewPdf,
  useSendLetter,
  useMarkDestinationSent,
  useMarkDestinationConfirmed,
  useResetDestinationStatus,
  useEmailStatus,
} from '../../hooks/useLetters'
import RichTextEditor from '../../components/editor/RichTextEditor'
import DocumentViewer from '../../components/documents/DocumentViewer'
import type { SubmissionDestination } from 'shared'
import type { Letter } from '../../api/letters.api'

type TabType = 'info' | 'documents' | 'letter' | 'destinations'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
}

const submissionStatusColors: Record<string, string> = {
  PENDING: 'text-gray-500',
  SENT: 'text-blue-600',
  CONFIRMED: 'text-green-600',
  FAILED: 'text-red-600',
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [letterContent, setLetterContent] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  const { data: request, isLoading, error } = useRequest(id)
  const { data: templates } = useTemplates({ activeOnly: true })
  const { data: letters, refetch: refetchLetters } = useLettersForRequest(id)
  const { data: lettersWithDest, refetch: refetchLettersWithDest } = useLettersWithDestinations(id)
  const { data: emailStatus } = useEmailStatus()

  const generateLetter = useGenerateLetter()
  const generateAllLetters = useGenerateAllLetters()
  const syncMasterToDestinations = useSyncMasterToDestinations()
  const updateLetter = useUpdateLetter()
  const finalizeLetter = useFinalizeLetter()
  const unfinalizeLetter = useUnfinalizeLetter()
  const deleteAllLetters = useDeleteAllLetters()
  const generatePdf = useGeneratePdf()
  const downloadPdf = useDownloadPdf()
  const previewPdf = usePreviewPdf()
  const sendLetter = useSendLetter()
  const markSent = useMarkDestinationSent()
  const markConfirmed = useMarkDestinationConfirmed()
  const resetStatus = useResetDestinationStatus()

  const masterLetter = lettersWithDest?.master as Letter | undefined
  const destinationLetters = lettersWithDest?.byDestination as Letter[] | undefined
  const currentLetter = letters?.[0] as Letter | undefined

  const copyAccessCode = () => {
    if (request?.accessCode) {
      navigator.clipboard.writeText(request.accessCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGenerateLetter = async () => {
    if (!id || !selectedTemplateId) return
    try {
      await generateLetter.mutateAsync({
        requestId: id,
        templateId: selectedTemplateId,
      })
      refetchLetters()
      refetchLettersWithDest()
    } catch {
      // Error handled by mutation
    }
  }

  const handleGenerateAllLetters = async () => {
    if (!id || !selectedTemplateId) return
    try {
      await generateAllLetters.mutateAsync({
        requestId: id,
        templateId: selectedTemplateId,
      })
      refetchLetters()
      refetchLettersWithDest()
    } catch {
      // Error handled by mutation
    }
  }

  const handleSyncToDestinations = async () => {
    if (!id) return
    try {
      await syncMasterToDestinations.mutateAsync(id)
      refetchLetters()
      refetchLettersWithDest()
    } catch {
      // Error handled by mutation
    }
  }

  const handleDeleteAllLetters = async () => {
    if (!id) return
    if (!window.confirm('Are you sure you want to delete all letters? This will allow you to start fresh with a new template.')) {
      return
    }
    try {
      await deleteAllLetters.mutateAsync(id)
      setLetterContent('')
      setIsEditing(false)
      refetchLetters()
      refetchLettersWithDest()
    } catch {
      // Error handled by mutation
    }
  }

  const handleSaveLetter = async (letterId?: string) => {
    const targetLetter = letterId ? letters?.find(l => l.id === letterId) : masterLetter
    if (!targetLetter) return
    try {
      await updateLetter.mutateAsync({
        id: targetLetter.id,
        content: letterContent,
      })
      setIsEditing(false)
      refetchLetters()
      refetchLettersWithDest()
    } catch {
      // Error handled by mutation
    }
  }

  const handleFinalize = async (letterId?: string) => {
    const targetLetter = letterId ? letters?.find(l => l.id === letterId) : masterLetter
    if (!targetLetter) return
    try {
      await finalizeLetter.mutateAsync(targetLetter.id)
      refetchLetters()
      refetchLettersWithDest()
    } catch {
      // Error handled by mutation
    }
  }

  const handleUnfinalize = async (letterId?: string) => {
    const targetLetter = letterId ? letters?.find(l => l.id === letterId) : masterLetter
    if (!targetLetter) return
    try {
      await unfinalizeLetter.mutateAsync(targetLetter.id)
      refetchLetters()
      refetchLettersWithDest()
    } catch {
      // Error handled by mutation
    }
  }

  const handleGeneratePdf = async (letterId?: string) => {
    const targetLetter = letterId ? letters?.find(l => l.id === letterId) : masterLetter
    if (!targetLetter) return
    try {
      await generatePdf.mutateAsync(targetLetter.id)
      refetchLetters()
      refetchLettersWithDest()
    } catch {
      // Error handled by mutation
    }
  }

  const handleDownloadPdfForLetter = async (letterId: string, filename: string) => {
    try {
      await downloadPdf.mutateAsync({ id: letterId, filename })
    } catch {
      // Error handled by mutation
    }
  }

  const handleSendEmail = async (destinationId: string) => {
    if (!currentLetter) return
    try {
      await sendLetter.mutateAsync({
        letterId: currentLetter.id,
        destinationId,
      })
    } catch {
      // Error handled by mutation
    }
  }

  const handlePreviewPdf = async (letterId: string, title: string) => {
    try {
      // Revoke old URL if exists
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl)
      }
      const url = await previewPdf.mutateAsync(letterId)
      setPreviewPdfUrl(url)
      setPreviewTitle(title)
      setShowPdfPreview(true)
    } catch {
      // Error handled by mutation
    }
  }

  const handleClosePreview = () => {
    setShowPdfPreview(false)
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl)
      setPreviewPdfUrl(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Request Not Found</h2>
          <p className="text-gray-500 mt-2">The request you're looking for doesn't exist.</p>
          <Link to="/requests" className="btn-primary mt-4 inline-block">
            Back to Requests
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'info' as TabType, label: 'Student Info', icon: User },
    { id: 'documents' as TabType, label: 'Documents', icon: FileText, count: request.documents?.length },
    { id: 'letter' as TabType, label: 'Letter', icon: Edit },
    { id: 'destinations' as TabType, label: 'Destinations', icon: Send, count: request.destinations?.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/requests" className="btn-ghost p-2 mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {request.studentName || 'Pending Student'}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${statusColors[request.status]}`}>
              {request.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
            <div className="flex items-center gap-1">
              <span>Code:</span>
              <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">{request.accessCode}</code>
              <button onClick={copyAccessCode} className="p-1 hover:bg-gray-100 rounded" title="Copy code">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            {request.deadline && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Due: {new Date(request.deadline).toLocaleDateString()}</span>
              </div>
            )}
            {request.studentEmail && (
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${request.studentEmail}`} className="hover:text-primary-600">
                  {request.studentEmail}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        <div className="card-body">
          {activeTab === 'info' && <StudentInfoTab request={request} />}
          {activeTab === 'documents' && <DocumentsTab documents={request.documents || []} />}
          {activeTab === 'letter' && (
            <LetterTab
              request={request}
              masterLetter={masterLetter}
              destinationLetters={destinationLetters || []}
              destinations={request.destinations || []}
              templates={templates || []}
              selectedTemplateId={selectedTemplateId}
              setSelectedTemplateId={setSelectedTemplateId}
              letterContent={letterContent}
              setLetterContent={setLetterContent}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              onGenerateMaster={handleGenerateLetter}
              onGenerateAll={handleGenerateAllLetters}
              onSyncToDestinations={handleSyncToDestinations}
              onDeleteAll={handleDeleteAllLetters}
              onSave={handleSaveLetter}
              onFinalize={handleFinalize}
              onUnfinalize={handleUnfinalize}
              onGeneratePdf={handleGeneratePdf}
              onDownloadPdf={handleDownloadPdfForLetter}
              onPreviewPdf={handlePreviewPdf}
              isGenerating={generateLetter.isPending}
              isGeneratingAll={generateAllLetters.isPending}
              isSyncing={syncMasterToDestinations.isPending}
              isDeleting={deleteAllLetters.isPending}
              isSaving={updateLetter.isPending}
              isFinalizing={finalizeLetter.isPending || unfinalizeLetter.isPending}
              isGeneratingPdf={generatePdf.isPending}
              isDownloadingPdf={downloadPdf.isPending}
              isPreviewingPdf={previewPdf.isPending}
            />
          )}
          {activeTab === 'destinations' && (
            <DestinationsTab
              destinations={request.destinations || []}
              letter={currentLetter}
              emailConfigured={emailStatus?.isConfigured || false}
              onSendEmail={handleSendEmail}
              onMarkSent={(id) => markSent.mutateAsync(id)}
              onMarkConfirmed={(id) => markConfirmed.mutateAsync(id)}
              onResetStatus={(id) => resetStatus.mutateAsync(id)}
              isSending={sendLetter.isPending}
            />
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPdfPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold">{previewTitle}</h3>
              <button
                onClick={handleClosePreview}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {previewPdfUrl ? (
                <iframe
                  src={previewPdfUrl}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t bg-gray-50 flex-shrink-0">
              <button onClick={handleClosePreview} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Student Info Tab
function StudentInfoTab({ request }: { request: NonNullable<ReturnType<typeof useRequest>['data']> }) {
  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-gray-900">{value || <span className="text-gray-400 italic">Not provided</span>}</dd>
    </div>
  )

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <dl>
          <InfoRow label="Full Name" value={request.studentName} />
          <div className="py-3 border-b border-gray-100">
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-gray-900">
              {request.studentEmail ? (
                <a href={`mailto:${request.studentEmail}`} className="text-primary-600 hover:underline">
                  {request.studentEmail}
                </a>
              ) : (
                <span className="text-gray-400 italic">Not provided</span>
              )}
            </dd>
          </div>
          <InfoRow label="Phone" value={request.studentPhone} />
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Details</h3>
        <dl>
          <InfoRow label="Program" value={request.programApplying} />
          <InfoRow label="Institution" value={request.institutionApplying} />
          <InfoRow label="Degree Type" value={request.degreeType} />
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Academic History</h3>
        <dl>
          <InfoRow label="Course Taken" value={request.courseTaken} />
          <InfoRow label="Grade" value={request.grade} />
          <InfoRow label="Semester/Year" value={request.semesterYear} />
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
        <dl>
          <InfoRow label="Relationship Description" value={request.relationshipDescription} />
          <InfoRow label="Achievements" value={request.achievements} />
        </dl>
      </div>

      {(request.personalStatement || request.additionalNotes) && (
        <div className="md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statements</h3>
          <dl>
            {request.personalStatement && (
              <div className="py-3">
                <dt className="text-sm font-medium text-gray-500">Personal Statement</dt>
                <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{request.personalStatement}</dd>
              </div>
            )}
            {request.additionalNotes && (
              <div className="py-3">
                <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{request.additionalNotes}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}

// Documents Tab
type DocumentType = { id: string; originalName: string; mimeType: string; size: number; label?: string | null; description?: string | null; createdAt: string }

function DocumentsTab({ documents }: { documents: DocumentType[] }) {
  const [viewingDocument, setViewingDocument] = useState<DocumentType | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const canPreview = (mimeType: string) => {
    return (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No documents uploaded yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{doc.originalName}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}
                  {doc.label && ` • ${doc.label}`}
                </p>
                {doc.description && <p className="text-sm text-gray-600 mt-1">{doc.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {canPreview(doc.mimeType) && (
                <button
                  onClick={() => setViewingDocument(doc)}
                  className="btn-ghost p-2"
                  title="View"
                >
                  <Eye className="h-5 w-5" />
                </button>
              )}
              <a
                href={`/api/uploads/documents/${doc.id}/download`}
                className="btn-ghost p-2"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </>
  )
}

// Letter Tab
interface LetterTabProps {
  request: NonNullable<ReturnType<typeof useRequest>['data']>
  masterLetter?: Letter
  destinationLetters: Letter[]
  destinations: SubmissionDestination[]
  templates: { id: string; name: string }[]
  selectedTemplateId: string
  setSelectedTemplateId: (id: string) => void
  letterContent: string
  setLetterContent: (content: string) => void
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
  onGenerateMaster: () => void
  onGenerateAll: () => void
  onSyncToDestinations: () => void
  onDeleteAll: () => void
  onSave: (letterId?: string) => void
  onFinalize: (letterId?: string) => void
  onUnfinalize: (letterId?: string) => void
  onGeneratePdf: (letterId?: string) => void
  onDownloadPdf: (letterId: string, filename: string) => void
  onPreviewPdf: (letterId: string, title: string) => void
  isGenerating: boolean
  isGeneratingAll: boolean
  isSyncing: boolean
  isDeleting: boolean
  isSaving: boolean
  isFinalizing: boolean
  isGeneratingPdf: boolean
  isDownloadingPdf: boolean
  isPreviewingPdf: boolean
}

function LetterTab({
  request,
  masterLetter,
  destinationLetters,
  destinations,
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
  letterContent,
  setLetterContent,
  isEditing,
  setIsEditing,
  onGenerateMaster,
  onGenerateAll,
  onSyncToDestinations,
  onDeleteAll,
  onSave,
  onFinalize,
  onUnfinalize,
  onGeneratePdf,
  onDownloadPdf,
  onPreviewPdf,
  isGenerating,
  isGeneratingAll,
  isSyncing,
  isDeleting,
  isSaving,
  isFinalizing,
  isGeneratingPdf,
  isDownloadingPdf,
  isPreviewingPdf,
}: LetterTabProps) {
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null)

  const handleStartEdit = (letter: Letter) => {
    setLetterContent(letter.content)
    setEditingLetterId(letter.id)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingLetterId(null)
    setLetterContent('')
  }

  const handleSave = () => {
    onSave(editingLetterId || undefined)
    setEditingLetterId(null)
  }

  // Get letter for a destination
  const getLetterForDestination = (destId: string) =>
    destinationLetters.find((l) => l.destinationId === destId)

  const hasDestinations = destinations.length > 0

  // No letter exists yet
  if (!masterLetter) {
    if (request.status === 'PENDING') {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Student hasn't submitted their information yet</p>
          <p className="text-gray-500 mt-2">
            Share the access code <code className="bg-gray-100 px-2 py-0.5 rounded">{request.accessCode}</code> with the student.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Edit className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Generate Letters</h3>
          <p className="text-gray-500 mt-2">
            {hasDestinations
              ? `Select a template to generate letters for ${destinations.length} destination${destinations.length > 1 ? 's' : ''}.`
              : 'Select a template to generate a letter for this request.'}
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <div>
            <label htmlFor="template" className="label">
              Select Template
            </label>
            <select
              id="template"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="input"
            >
              <option value="">Choose a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {hasDestinations ? (
            <button
              onClick={onGenerateAll}
              disabled={!selectedTemplateId || isGeneratingAll}
              className="btn-primary w-full"
            >
              {isGeneratingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating All Letters...
                </>
              ) : (
                `Generate Letters for ${destinations.length} Destination${destinations.length > 1 ? 's' : ''}`
              )}
            </button>
          ) : (
            <button
              onClick={onGenerateMaster}
              disabled={!selectedTemplateId || isGenerating}
              className="btn-primary w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                'Generate Letter'
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Letter exists - show master + destinations view
  return (
    <div className="space-y-8">
      {/* Master Letter Section */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-gray-900">Master Letter</h3>
            <span className="text-sm text-gray-500">v{masterLetter.version}</span>
            {hasDestinations && (
              <span className="text-xs text-gray-400">(Edit here, then sync to destinations)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button onClick={() => handleStartEdit(masterLetter)} className="btn-secondary">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Placeholder hint for multi-destination letters */}
        {hasDestinations && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
            <strong>Tip:</strong> Use <code className="bg-blue-100 px-1 rounded">[INSTITUTION]</code> and{' '}
            <code className="bg-blue-100 px-1 rounded">[PROGRAM]</code> as placeholders. They will be replaced
            with each destination's specific values when you sync.
          </div>
        )}

        {/* Editor or Preview for Master */}
        {isEditing && editingLetterId === masterLetter.id ? (
          <div className="space-y-4">
            <RichTextEditor content={letterContent} onChange={setLetterContent} placeholder="Write your letter..." />
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex gap-2">
                <button onClick={handleCancelEdit} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
              {hasDestinations && (
                <button
                  onClick={onSyncToDestinations}
                  disabled={isSyncing}
                  className="btn-primary"
                  title="Copies your edits to all destination letters, replacing institution/program names"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Save & Sync to All Destinations
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div
              className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg border max-h-64 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: masterLetter.content }}
            />
            {hasDestinations && !isEditing && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onSyncToDestinations}
                  disabled={isSyncing}
                  className="btn-secondary"
                  title="Copies the master letter content to all destination letters, replacing institution/program names"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync to All Destinations
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Destination Letters Section */}
      {hasDestinations && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Letters by Destination ({destinations.length})
          </h3>
          <div className="space-y-4">
            {destinations.map((dest) => {
              const destLetter = getLetterForDestination(dest.id)
              const isEditingThis = isEditing && editingLetterId === destLetter?.id

              return (
                <div key={dest.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{dest.institutionName}</h4>
                        {dest.programName && (
                          <span className="text-sm text-gray-500">• {dest.programName}</span>
                        )}
                        {destLetter ? (
                          destLetter.isFinalized ? (
                            destLetter.pdfPath ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Check className="h-3 w-3" />
                                PDF Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Lock className="h-3 w-3" />
                                Locked
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Edit className="h-3 w-3" />
                              Draft
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Not generated
                          </span>
                        )}
                      </div>

                      {destLetter && !isEditingThis && (
                        <div
                          className="prose prose-sm max-w-none p-3 bg-gray-50 rounded border text-sm max-h-32 overflow-y-auto"
                          dangerouslySetInnerHTML={{
                            __html: destLetter.content.substring(0, 500) + (destLetter.content.length > 500 ? '...' : ''),
                          }}
                        />
                      )}

                      {isEditingThis && destLetter && (
                        <div className="space-y-3 mt-2">
                          <RichTextEditor content={letterContent} onChange={setLetterContent} placeholder="Write your letter..." />
                          <div className="flex gap-2">
                            <button onClick={handleCancelEdit} className="btn-secondary text-sm">
                              Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving} className="btn-primary text-sm">
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {destLetter && !isEditingThis && (
                      <div className="flex flex-col gap-2">
                        {!destLetter.isFinalized && (
                          <button
                            onClick={() => handleStartEdit(destLetter)}
                            className="btn-ghost text-sm px-3 py-1.5"
                            title="Edit this letter"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {destLetter.isFinalized ? (
                          <>
                            <button
                              onClick={() => onGeneratePdf(destLetter.id)}
                              disabled={isGeneratingPdf}
                              className="btn-primary text-sm px-3 py-1.5"
                              title={destLetter.pdfPath ? 'Regenerate PDF' : 'Generate PDF'}
                            >
                              {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                            </button>
                            {destLetter.pdfPath && (
                              <>
                                <button
                                  onClick={() =>
                                    onPreviewPdf(
                                      destLetter.id,
                                      `${dest.institutionName}${dest.programName ? ` - ${dest.programName}` : ''}`
                                    )
                                  }
                                  disabled={isPreviewingPdf}
                                  className="btn-ghost text-sm px-3 py-1.5"
                                  title="Preview PDF"
                                >
                                  {isPreviewingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() =>
                                    onDownloadPdf(
                                      destLetter.id,
                                      `letter-${request.studentName || 'student'}-${dest.institutionName}.pdf`
                                    )
                                  }
                                  disabled={isDownloadingPdf}
                                  className="btn-ghost text-sm px-3 py-1.5"
                                  title="Download PDF"
                                >
                                  {isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => onUnfinalize(destLetter.id)}
                              disabled={isFinalizing}
                              className="btn-ghost text-sm px-3 py-1.5"
                              title="Unlock to make edits"
                            >
                              {isFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onFinalize(destLetter.id)}
                            disabled={isFinalizing}
                            className="btn-primary text-sm px-3 py-1.5"
                            title="Lock letter & enable PDF generation"
                          >
                            {isFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Template Options Section */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Template Options</h4>
        <p className="text-sm text-gray-500 mb-4">
          Regenerate from a template (overwrites current content) or start fresh.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">Choose a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {hasDestinations ? (
            <button
              onClick={onGenerateAll}
              disabled={!selectedTemplateId || isGeneratingAll}
              className="btn-secondary"
              title="Regenerates all letters from the selected template, replacing current content"
            >
              {isGeneratingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate from Template
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onGenerateMaster}
              disabled={!selectedTemplateId || isGenerating}
              className="btn-secondary"
              title="Regenerates the letter from the selected template, replacing current content"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate from Template
                </>
              )}
            </button>
          )}
          <div className="border-l pl-4 ml-2">
            <button
              onClick={onDeleteAll}
              disabled={isDeleting}
              className="btn-ghost text-red-600 hover:bg-red-50"
              title="Delete all letters and start fresh with a new template"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Start Fresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Destinations Tab
interface DestinationsTabProps {
  destinations: SubmissionDestination[]
  letter?: Letter
  emailConfigured: boolean
  onSendEmail: (destinationId: string) => void
  onMarkSent: (destinationId: string) => void
  onMarkConfirmed: (destinationId: string) => void
  onResetStatus: (destinationId: string) => void
  isSending: boolean
}

function DestinationsTab({
  destinations,
  letter,
  emailConfigured,
  onSendEmail,
  onMarkSent,
  onMarkConfirmed,
  onResetStatus,
  isSending,
}: DestinationsTabProps) {
  if (destinations.length === 0) {
    return (
      <div className="text-center py-12">
        <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No destinations added yet</p>
        <p className="text-sm text-gray-400 mt-2">
          The student will add destinations when submitting their request.
        </p>
      </div>
    )
  }

  const canSend = letter?.isFinalized && letter?.pdfPath

  return (
    <div className="space-y-4">
      {!canSend && destinations.some(d => d.method === 'EMAIL') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Letter not ready for sending</p>
              <p className="text-sm text-yellow-700 mt-1">
                {!letter ? 'Generate a letter first.' : !letter.isFinalized ? 'Finalize the letter first.' : 'Generate a PDF first.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!emailConfigured && destinations.some(d => d.method === 'EMAIL') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Email not configured</p>
              <p className="text-sm text-blue-700 mt-1">
                Configure SMTP settings in your environment to send emails directly.
                You can still manually mark destinations as sent.
              </p>
            </div>
          </div>
        </div>
      )}

      {destinations.map((dest) => (
        <div key={dest.id} className="border rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900">{dest.institutionName}</h4>
                <span className={`text-sm font-medium ${submissionStatusColors[dest.status]}`}>
                  {dest.status === 'PENDING' && <Clock className="h-4 w-4 inline mr-1" />}
                  {dest.status === 'SENT' && <Send className="h-4 w-4 inline mr-1" />}
                  {dest.status === 'CONFIRMED' && <Check className="h-4 w-4 inline mr-1" />}
                  {dest.status === 'FAILED' && <AlertCircle className="h-4 w-4 inline mr-1" />}
                  {dest.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {dest.programName && <p>Program: {dest.programName}</p>}
                {dest.recipientName && <p>Recipient: {dest.recipientName}</p>}
                {dest.recipientEmail && (
                  <p>
                    Email: <a href={`mailto:${dest.recipientEmail}`} className="text-primary-600 hover:underline">{dest.recipientEmail}</a>
                  </p>
                )}
                {dest.portalUrl && (
                  <p>
                    Portal:{' '}
                    <a href={dest.portalUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline inline-flex items-center gap-1">
                      {dest.portalUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                )}
                {dest.portalInstructions && <p className="text-gray-500">Instructions: {dest.portalInstructions}</p>}
                {dest.deadline && (
                  <p className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Due: {new Date(dest.deadline).toLocaleDateString()}
                  </p>
                )}
                <p className="text-gray-400">
                  Method: {dest.method === 'EMAIL' ? 'Email' : dest.method === 'PORTAL' ? 'Portal Upload' : 'Download'}
                </p>
              </div>
              {dest.sentAt && <p className="text-xs text-gray-400 mt-2">Sent: {new Date(dest.sentAt).toLocaleString()}</p>}
              {dest.confirmedAt && <p className="text-xs text-gray-400">Confirmed: {new Date(dest.confirmedAt).toLocaleString()}</p>}
              {dest.failureReason && <p className="text-xs text-red-600 mt-2">Error: {dest.failureReason}</p>}
            </div>

            <div className="flex flex-col gap-2">
              {dest.method === 'EMAIL' && dest.status === 'PENDING' && canSend && emailConfigured && (
                <button
                  onClick={() => onSendEmail(dest.id)}
                  disabled={isSending}
                  className="btn-primary text-sm px-3 py-1.5"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Send
                </button>
              )}
              {dest.status === 'PENDING' && (
                <button
                  onClick={() => onMarkSent(dest.id)}
                  className="btn-secondary text-sm px-3 py-1.5"
                >
                  Mark as Sent
                </button>
              )}
              {dest.status === 'SENT' && (
                <button
                  onClick={() => onMarkConfirmed(dest.id)}
                  className="btn-secondary text-sm px-3 py-1.5"
                >
                  Confirm Receipt
                </button>
              )}
              {(dest.status === 'SENT' || dest.status === 'CONFIRMED' || dest.status === 'FAILED') && (
                <button
                  onClick={() => onResetStatus(dest.id)}
                  className="btn-ghost text-sm px-3 py-1.5 text-gray-500"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
