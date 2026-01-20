import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, Calendar, Copy, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { useRequests, useCreateRequest } from '../../hooks/useRequests'
import type { LetterRequest, RequestStatus } from 'shared'

const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
}

const STATUS_CLASSES: Record<RequestStatus, string> = {
  PENDING: 'badge-pending',
  SUBMITTED: 'badge-submitted',
  IN_PROGRESS: 'badge-in-progress',
  COMPLETED: 'badge-completed',
  ARCHIVED: 'badge-archived',
}

function RequestCard({ request }: { request: LetterRequest }) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(request.accessCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium text-gray-900">
              {request.studentName || 'Awaiting student info'}
            </h3>
            {request.studentEmail && (
              <p className="text-sm text-gray-500">{request.studentEmail}</p>
            )}
          </div>
          <span className={STATUS_CLASSES[request.status]}>
            {STATUS_LABELS[request.status]}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
            {request.accessCode}
          </code>
          <button
            onClick={handleCopyCode}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Copy code"
          >
            <Copy className="h-4 w-4" />
          </button>
          {copied && <span className="text-xs text-green-600">Copied!</span>}
        </div>

        {request.deadline && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Calendar className="h-4 w-4" />
            <span>Due: {format(new Date(request.deadline), 'MMM d, yyyy')}</span>
          </div>
        )}

        {request.institutionApplying && (
          <p className="text-sm text-gray-600 mb-3">
            Applying to: {request.institutionApplying}
            {request.programApplying && ` - ${request.programApplying}`}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Created {format(new Date(request.createdAt), 'MMM d, yyyy')}
          </span>
          <Link
            to={`/requests/${request.id}`}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  )
}

function CreateRequestModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { deadline?: string; professorNotes?: string }) => void
}) {
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({
      deadline: deadline || undefined,
      professorNotes: notes || undefined,
    })
    setDeadline('')
    setNotes('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Create New Request</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <p className="text-sm text-gray-600">
              A unique access code will be generated. Share this code with the student
              so they can fill in their information.
            </p>

            <div>
              <label htmlFor="deadline" className="label">
                Deadline (optional)
              </label>
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label htmlFor="notes" className="label">
                Notes for yourself (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input min-h-[100px]"
                placeholder="Any notes about this request..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function RequestsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, error } = useRequests({
    status: statusFilter || undefined,
    search: searchQuery || undefined,
  })
  const createRequest = useCreateRequest()

  const handleCreate = async (formData: { deadline?: string; professorNotes?: string }) => {
    try {
      await createRequest.mutateAsync({
        deadline: formData.deadline,
        professorNotes: formData.professorNotes,
      })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create request:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load requests. Please try again.</p>
      </div>
    )
  }

  const requests = data?.requests || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Letter Requests</h1>
          <p className="text-gray-500 mt-1">
            Manage recommendation letter requests ({data?.total || 0} total)
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or code..."
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RequestStatus | '')}
                className="input pl-10 pr-8 appearance-none"
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Request List */}
      {requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-500 mb-4">
              {statusFilter || searchQuery
                ? 'Try adjusting your filters'
                : 'Create your first request to get started.'}
            </p>
            {!statusFilter && !searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary inline-flex"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </button>
            )}
          </div>
        </div>
      )}

      <CreateRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
