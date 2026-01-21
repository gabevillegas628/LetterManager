import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'
import {
  User,
  GraduationCap,
  FileText,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Trash2,
  Mail,
  Globe,
  Download,
  Edit3,
  Pencil,
} from 'lucide-react'
import {
  useStudentRequest,
  useUpdateStudentInfo,
  useUploadDocuments,
  useDeleteDocument,
  useAddDestination,
  useUpdateDestination,
  useDeleteDestination,
  useSubmitRequest,
  type StudentInfoInput,
  type DestinationInput,
  type Document,
  type Destination,
} from '../../hooks/useStudent'

const STEPS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'academic', label: 'Academic Info', icon: GraduationCap },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'destinations', label: 'Applications', icon: Building2 },
  { id: 'review', label: 'Review', icon: CheckCircle },
]

export default function RequestFormPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState('')

  const { data: request, isLoading, error: fetchError } = useStudentRequest(code)
  const updateInfo = useUpdateStudentInfo(code!)
  const uploadDocs = useUploadDocuments(code!)
  const deleteDoc = useDeleteDocument(code!)
  const addDest = useAddDestination(code!)
  const updateDest = useUpdateDestination(code!)
  const deleteDest = useDeleteDestination(code!)
  const submitRequest = useSubmitRequest(code!)

  // Editing destination state
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null)

  // Form state
  const [formData, setFormData] = useState<StudentInfoInput>({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    programApplying: '',
    institutionApplying: '',
    degreeType: '',
    courseTaken: '',
    grade: '',
    semesterYear: '',
    relationshipDescription: '',
    achievements: '',
    personalStatement: '',
    additionalNotes: '',
  })

  // Sync form data with request data when loaded
  useEffect(() => {
    if (request) {
      setFormData({
        studentName: request.studentName || '',
        studentEmail: request.studentEmail || '',
        studentPhone: request.studentPhone || '',
        programApplying: request.programApplying || '',
        institutionApplying: request.institutionApplying || '',
        degreeType: request.degreeType || '',
        courseTaken: request.courseTaken || '',
        grade: request.grade || '',
        semesterYear: request.semesterYear || '',
        relationshipDescription: request.relationshipDescription || '',
        achievements: request.achievements || '',
        personalStatement: request.personalStatement || '',
        additionalNotes: request.additionalNotes || '',
      })
    }
  }, [request])

  // New destination form
  const [newDestination, setNewDestination] = useState<DestinationInput>({
    institutionName: '',
    programName: '',
    recipientName: '',
    recipientEmail: '',
    portalUrl: '',
    portalInstructions: '',
    method: 'EMAIL',
    deadline: '',
  })

  const handleInputChange = (field: keyof StudentInfoInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDestinationChange = (field: keyof DestinationInput, value: string) => {
    setNewDestination((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveAndContinue = async () => {
    setError('')
    try {
      if (currentStep < 2) {
        // Save student info on personal and academic steps
        await updateInfo.mutateAsync(formData)
      }
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    } catch {
      setError('Failed to save. Please try again.')
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleAddDestination = async () => {
    if (!newDestination.institutionName || !newDestination.programName) {
      setError('Institution name and program name are required')
      return
    }

    try {
      await addDest.mutateAsync(newDestination)
      setNewDestination({
        institutionName: '',
        programName: '',
        recipientName: '',
        recipientEmail: '',
        portalUrl: '',
        portalInstructions: '',
        method: 'EMAIL',
        deadline: '',
      })
      setError('')
    } catch {
      setError('Failed to add destination')
    }
  }

  const handleUpdateDestination = async (destinationId: string, data: DestinationInput) => {
    try {
      await updateDest.mutateAsync({ destinationId, data })
      setEditingDestination(null)
      setError('')
    } catch {
      setError('Failed to update destination')
    }
  }

  const handleStartEdit = (destination: Destination) => {
    setEditingDestination(destination)
  }

  const handleCancelEdit = () => {
    setEditingDestination(null)
  }

  const handleFinalSubmit = async () => {
    setError('')
    try {
      await submitRequest.mutateAsync()
      navigate(`/student/${code}/confirmation`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit'
      setError(errorMessage)
    }
  }

  // File upload dropzone
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      try {
        await uploadDocs.mutateAsync({ files: acceptedFiles })
      } catch {
        setError('Failed to upload files')
      }
    },
    [uploadDocs]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (fetchError || !request) {
    return (
      <div className="card max-w-md mx-auto">
        <div className="card-body text-center">
          <p className="text-red-600 mb-4">
            This request was not found or is no longer accepting submissions.
          </p>
          <button onClick={() => navigate('/student')} className="btn-primary">
            Enter a different code
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`text-xs text-center ${
                    isActive ? 'text-primary-600 font-medium' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="relative mt-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-1 bg-gray-200 rounded"></div>
          </div>
          <div
            className="absolute inset-0 flex items-center"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          >
            <div className="w-full h-1 bg-primary-600 rounded"></div>
          </div>
        </div>
      </div>

      {/* Editing Mode Banner */}
      {request.status === 'SUBMITTED' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Edit3 className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-900">Editing Your Submission</h3>
            <p className="text-sm text-amber-700 mt-1">
              You&apos;re updating a previously submitted request. Your changes will be saved automatically.
              You can add new destinations or update your information until your professor begins working on your letter.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">{error}</div>
      )}

      {/* Step Content */}
      <div className="card">
        <div className="card-body">
          {/* Step 1: Personal Info */}
          {currentStep === 0 && (
            <PersonalInfoStep formData={formData} onChange={handleInputChange} />
          )}

          {/* Step 2: Academic Info */}
          {currentStep === 1 && (
            <AcademicInfoStep formData={formData} onChange={handleInputChange} />
          )}

          {/* Step 3: Documents */}
          {currentStep === 2 && (
            <DocumentsStep
              documents={request.documents}
              onDelete={(id) => deleteDoc.mutate(id)}
              dropzoneProps={{ getRootProps, getInputProps, isDragActive }}
              isUploading={uploadDocs.isPending}
            />
          )}

          {/* Step 4: Destinations */}
          {currentStep === 3 && (
            <DestinationsStep
              destinations={request.destinations}
              newDestination={newDestination}
              onChange={handleDestinationChange}
              onAdd={handleAddDestination}
              onDelete={(id) => deleteDest.mutate(id)}
              onEdit={handleStartEdit}
              onUpdate={handleUpdateDestination}
              onCancelEdit={handleCancelEdit}
              editingDestination={editingDestination}
              isAdding={addDest.isPending}
              isUpdating={updateDest.isPending}
            />
          )}

          {/* Step 5: Review */}
          {currentStep === 4 && (
            <ReviewStep
              formData={formData}
              documents={request.documents}
              destinations={request.destinations}
              deadline={request.deadline}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="card-footer flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="btn-secondary"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleSaveAndContinue}
              disabled={updateInfo.isPending}
              className="btn-primary"
            >
              {updateInfo.isPending ? 'Saving...' : 'Save & Continue'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={submitRequest.isPending}
              className="btn-primary bg-green-600 hover:bg-green-700"
            >
              {submitRequest.isPending ? 'Submitting...' : 'Submit Request'}
              <CheckCircle className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Step Components
function PersonalInfoStep({
  formData,
  onChange,
}: {
  formData: StudentInfoInput
  onChange: (field: keyof StudentInfoInput, value: string) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
      <p className="text-sm text-gray-500 mb-4">
        Please provide your personal details. Fields marked with * are required.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input
            type="text"
            value={formData.studentName}
            onChange={(e) => onChange('studentName', e.target.value)}
            className="input"
            placeholder="Jane Smith"
            required
          />
        </div>
        <div>
          <label className="label">Email *</label>
          <input
            type="email"
            value={formData.studentEmail}
            onChange={(e) => onChange('studentEmail', e.target.value)}
            className="input"
            placeholder="jane.smith@email.com"
            required
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            type="tel"
            value={formData.studentPhone}
            onChange={(e) => onChange('studentPhone', e.target.value)}
            className="input"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
    </div>
  )
}

function AcademicInfoStep({
  formData,
  onChange,
}: {
  formData: StudentInfoInput
  onChange: (field: keyof StudentInfoInput, value: string) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Academic Information</h2>
      <p className="text-sm text-gray-500 mb-4">
        Tell us about your academic background and relationship with the professor.
        You&apos;ll add specific institutions and programs in the next step.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Degree Being Sought</label>
          <select
            value={formData.degreeType}
            onChange={(e) => onChange('degreeType', e.target.value)}
            className="input"
          >
            <option value="">Select...</option>
            <option value="MS">Master&apos;s (MS)</option>
            <option value="PhD">Doctorate (PhD)</option>
            <option value="MBA">MBA</option>
            <option value="BS">Bachelor&apos;s (BS)</option>
            <option value="Other">Other</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">The degree you are applying for</p>
        </div>
        <div>
          <label className="label">Course Taken with Professor</label>
          <input
            type="text"
            value={formData.courseTaken}
            onChange={(e) => onChange('courseTaken', e.target.value)}
            className="input"
            placeholder="CS 101 - Intro to Programming"
          />
        </div>
        <div>
          <label className="label">Grade Received</label>
          <input
            type="text"
            value={formData.grade}
            onChange={(e) => onChange('grade', e.target.value)}
            className="input"
            placeholder="A"
          />
        </div>
        <div>
          <label className="label">Semester/Year</label>
          <input
            type="text"
            value={formData.semesterYear}
            onChange={(e) => onChange('semesterYear', e.target.value)}
            className="input"
            placeholder="Fall 2024"
          />
        </div>
      </div>

      <div>
        <label className="label">Describe Your Relationship with the Professor</label>
        <textarea
          value={formData.relationshipDescription}
          onChange={(e) => onChange('relationshipDescription', e.target.value)}
          className="input min-h-[100px]"
          placeholder="How do you know the professor? What projects did you work on together?"
        />
      </div>

      <div>
        <label className="label">Key Achievements</label>
        <textarea
          value={formData.achievements}
          onChange={(e) => onChange('achievements', e.target.value)}
          className="input min-h-[100px]"
          placeholder="List your notable achievements, awards, or accomplishments..."
        />
      </div>

      <div>
        <label className="label">Personal Statement / Goals</label>
        <textarea
          value={formData.personalStatement}
          onChange={(e) => onChange('personalStatement', e.target.value)}
          className="input min-h-[100px]"
          placeholder="Briefly describe your goals and why you're pursuing this program..."
        />
      </div>

      <div>
        <label className="label">Additional Notes for Professor</label>
        <textarea
          value={formData.additionalNotes}
          onChange={(e) => onChange('additionalNotes', e.target.value)}
          className="input min-h-[80px]"
          placeholder="Any other information you'd like your professor to know..."
        />
      </div>
    </div>
  )
}

function DocumentsStep({
  documents,
  onDelete,
  dropzoneProps,
  isUploading,
}: {
  documents: Document[]
  onDelete: (id: string) => void
  dropzoneProps: {
    getRootProps: () => object
    getInputProps: () => object
    isDragActive: boolean
  }
  isUploading: boolean
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Supporting Documents</h2>
      <p className="text-sm text-gray-500 mb-4">
        Upload relevant documents such as your resume, transcript, or portfolio. Accepted formats:
        PDF, DOC, DOCX, JPG, PNG (max 10MB each).
      </p>

      {/* Dropzone */}
      <div
        {...dropzoneProps.getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dropzoneProps.isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        <input {...dropzoneProps.getInputProps()} />
        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        {isUploading ? (
          <p className="text-gray-600">Uploading...</p>
        ) : dropzoneProps.isDragActive ? (
          <p className="text-primary-600">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-600">Drag & drop files here, or click to select</p>
            <p className="text-sm text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
          </>
        )}
      </div>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <div className="space-y-2 mt-4">
          <h3 className="font-medium text-gray-700">Uploaded Documents</h3>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{doc.originalName}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                </div>
              </div>
              <button
                onClick={() => onDelete(doc.id)}
                className="p-1 text-red-500 hover:text-red-700"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DestinationsStep({
  destinations,
  newDestination,
  onChange,
  onAdd,
  onDelete,
  onEdit,
  onUpdate,
  onCancelEdit,
  editingDestination,
  isAdding,
  isUpdating,
}: {
  destinations: Destination[]
  newDestination: DestinationInput
  onChange: (field: keyof DestinationInput, value: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onEdit: (destination: Destination) => void
  onUpdate: (destinationId: string, data: DestinationInput) => void
  onCancelEdit: () => void
  editingDestination: Destination | null
  isAdding: boolean
  isUpdating: boolean
}) {
  // Local state for editing form
  const [editForm, setEditForm] = useState<DestinationInput>({
    institutionName: '',
    programName: '',
    recipientName: '',
    recipientEmail: '',
    portalUrl: '',
    portalInstructions: '',
    method: 'EMAIL',
    deadline: '',
  })

  // Sync edit form when editing destination changes
  useEffect(() => {
    if (editingDestination) {
      setEditForm({
        institutionName: editingDestination.institutionName,
        programName: editingDestination.programName || '',
        recipientName: editingDestination.recipientName || '',
        recipientEmail: editingDestination.recipientEmail || '',
        portalUrl: editingDestination.portalUrl || '',
        portalInstructions: editingDestination.portalInstructions || '',
        method: editingDestination.method,
        deadline: editingDestination.deadline ? editingDestination.deadline.split('T')[0] : '',
      })
    }
  }, [editingDestination])

  const handleEditFormChange = (field: keyof DestinationInput, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveEdit = () => {
    if (editingDestination) {
      onUpdate(editingDestination.id, editForm)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Where Are You Applying?</h2>
      <p className="text-sm text-gray-500 mb-4">
        Add each institution and program you&apos;re applying to. Your professor will generate a
        personalized letter for each destination with the correct institution and program name.
      </p>

      {/* Existing Destinations */}
      {destinations.length > 0 && (
        <div className="space-y-2 mb-6">
          {destinations.map((dest) => (
            <div key={dest.id} className="p-4 bg-gray-50 rounded-lg">
              {editingDestination?.id === dest.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Edit Application</h4>
                    <button
                      onClick={onCancelEdit}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Institution Name *</label>
                      <input
                        type="text"
                        value={editForm.institutionName}
                        onChange={(e) => handleEditFormChange('institutionName', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Program Name *</label>
                      <input
                        type="text"
                        value={editForm.programName}
                        onChange={(e) => handleEditFormChange('programName', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Deadline</label>
                      <input
                        type="date"
                        value={editForm.deadline}
                        onChange={(e) => handleEditFormChange('deadline', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Submission Method *</label>
                      <select
                        value={editForm.method}
                        onChange={(e) => handleEditFormChange('method', e.target.value)}
                        className="input"
                      >
                        <option value="EMAIL">Email to Admissions</option>
                        <option value="DOWNLOAD">Download PDF</option>
                        <option value="PORTAL">Portal Upload</option>
                      </select>
                    </div>
                    {editForm.method === 'EMAIL' && (
                      <>
                        <div>
                          <label className="label">Recipient Name</label>
                          <input
                            type="text"
                            value={editForm.recipientName}
                            onChange={(e) => handleEditFormChange('recipientName', e.target.value)}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="label">Recipient Email</label>
                          <input
                            type="email"
                            value={editForm.recipientEmail}
                            onChange={(e) => handleEditFormChange('recipientEmail', e.target.value)}
                            className="input"
                          />
                        </div>
                      </>
                    )}
                    {editForm.method === 'PORTAL' && (
                      <>
                        <div className="md:col-span-2">
                          <label className="label">Portal URL</label>
                          <input
                            type="url"
                            value={editForm.portalUrl}
                            onChange={(e) => handleEditFormChange('portalUrl', e.target.value)}
                            className="input"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="label">Portal Instructions</label>
                          <textarea
                            value={editForm.portalInstructions}
                            onChange={(e) => handleEditFormChange('portalInstructions', e.target.value)}
                            className="input min-h-[60px]"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={isUpdating || !editForm.institutionName || !editForm.programName}
                      className="btn-primary text-sm py-1.5"
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="btn-secondary text-sm py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dest.institutionName}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          dest.method === 'EMAIL'
                            ? 'bg-blue-100 text-blue-700'
                            : dest.method === 'DOWNLOAD'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {dest.method === 'EMAIL' && <Mail className="h-3 w-3 inline mr-1" />}
                        {dest.method === 'DOWNLOAD' && <Download className="h-3 w-3 inline mr-1" />}
                        {dest.method === 'PORTAL' && <Globe className="h-3 w-3 inline mr-1" />}
                        {dest.method}
                      </span>
                    </div>
                    {dest.programName && (
                      <p className="text-sm text-gray-600">{dest.programName}</p>
                    )}
                    {dest.recipientEmail && (
                      <p className="text-sm text-gray-500">{dest.recipientEmail}</p>
                    )}
                    {dest.deadline && (
                      <p className="text-xs text-gray-400 mt-1">
                        Deadline: {format(new Date(dest.deadline), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(dest)}
                      className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(dest.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Destination */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-medium mb-3">Add Application</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Institution Name *</label>
            <input
              type="text"
              value={newDestination.institutionName}
              onChange={(e) => onChange('institutionName', e.target.value)}
              className="input"
              placeholder="e.g., MIT, Stanford University"
            />
          </div>
          <div>
            <label className="label">Program Name *</label>
            <input
              type="text"
              value={newDestination.programName}
              onChange={(e) => onChange('programName', e.target.value)}
              className="input"
              placeholder="e.g., MS in Computer Science"
            />
            <p className="text-xs text-gray-500 mt-1">This will appear in your letter</p>
          </div>
          <div>
            <label className="label">Deadline</label>
            <input
              type="date"
              value={newDestination.deadline}
              onChange={(e) => onChange('deadline', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Submission Method *</label>
            <select
              value={newDestination.method}
              onChange={(e) => onChange('method', e.target.value)}
              className="input"
            >
              <option value="EMAIL">Email to Admissions</option>
              <option value="DOWNLOAD">Download PDF (I&apos;ll submit manually)</option>
              <option value="PORTAL">Portal Upload (Professor uploads)</option>
            </select>
          </div>
          {newDestination.method === 'EMAIL' && (
            <>
              <div>
                <label className="label">Recipient Name</label>
                <input
                  type="text"
                  value={newDestination.recipientName}
                  onChange={(e) => onChange('recipientName', e.target.value)}
                  className="input"
                  placeholder="Admissions Office"
                />
              </div>
              <div>
                <label className="label">Recipient Email</label>
                <input
                  type="email"
                  value={newDestination.recipientEmail}
                  onChange={(e) => onChange('recipientEmail', e.target.value)}
                  className="input"
                  placeholder="admissions@university.edu"
                />
              </div>
            </>
          )}
          {newDestination.method === 'PORTAL' && (
            <>
              <div className="md:col-span-2">
                <label className="label">Portal URL</label>
                <input
                  type="url"
                  value={newDestination.portalUrl}
                  onChange={(e) => onChange('portalUrl', e.target.value)}
                  className="input"
                  placeholder="https://apply.university.edu"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Portal Instructions</label>
                <textarea
                  value={newDestination.portalInstructions}
                  onChange={(e) => onChange('portalInstructions', e.target.value)}
                  className="input min-h-[60px]"
                  placeholder="Instructions for submitting through the portal..."
                />
              </div>
            </>
          )}
        </div>
        <button
          onClick={onAdd}
          disabled={isAdding || !newDestination.institutionName || !newDestination.programName}
          className="btn-primary mt-3"
        >
          {isAdding ? 'Adding...' : 'Add Application'}
        </button>
      </div>
    </div>
  )
}

function ReviewStep({
  formData,
  documents,
  destinations,
  deadline,
}: {
  formData: StudentInfoInput
  documents: Document[]
  destinations: Destination[]
  deadline: string | null
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4">Review Your Submission</h2>
      <p className="text-sm text-gray-500 mb-4">
        Please review your information before submitting. You can go back to make changes.
      </p>

      {deadline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Deadline:</strong> {format(new Date(deadline), 'MMMM d, yyyy')}
          </p>
        </div>
      )}

      {/* Personal Info */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <User className="h-4 w-4" /> Personal Information
        </h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-gray-500">Name:</dt>
          <dd>{formData.studentName || '-'}</dd>
          <dt className="text-gray-500">Email:</dt>
          <dd>{formData.studentEmail || '-'}</dd>
          <dt className="text-gray-500">Phone:</dt>
          <dd>{formData.studentPhone || '-'}</dd>
        </dl>
      </div>

      {/* Academic Info */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> Academic Background
        </h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-gray-500">Degree Type:</dt>
          <dd>{formData.degreeType || '-'}</dd>
          <dt className="text-gray-500">Course with Professor:</dt>
          <dd>{formData.courseTaken || '-'}</dd>
          <dt className="text-gray-500">Grade:</dt>
          <dd>{formData.grade || '-'}</dd>
          <dt className="text-gray-500">Semester:</dt>
          <dd>{formData.semesterYear || '-'}</dd>
        </dl>
      </div>

      {/* Documents */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Documents ({documents.length})
        </h3>
        {documents.length > 0 ? (
          <ul className="text-sm space-y-1">
            {documents.map((doc) => (
              <li key={doc.id} className="text-gray-600">
                • {doc.originalName}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No documents uploaded</p>
        )}
      </div>

      {/* Applications */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Applications ({destinations.length})
        </h3>
        {destinations.length > 0 ? (
          <ul className="text-sm space-y-2">
            {destinations.map((dest) => (
              <li key={dest.id} className="p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-900">{dest.institutionName}</div>
                {dest.programName && <div className="text-gray-600">{dest.programName}</div>}
                <div className="text-xs text-gray-400 mt-1">
                  Submission: {dest.method === 'EMAIL' ? 'Email' : dest.method === 'DOWNLOAD' ? 'Download' : 'Portal'}
                  {dest.deadline && ` • Due: ${format(new Date(dest.deadline), 'MMM d, yyyy')}`}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-red-500">
            No applications added. Please go back and add at least one institution you&apos;re applying to.
          </p>
        )}
      </div>
    </div>
  )
}
