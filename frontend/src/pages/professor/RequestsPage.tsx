import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  FileText,
  Calendar,
  Copy,
  Search,
  Filter,
  Mail,
  Clock,
  LayoutGrid,
  List,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { useRequests, useCreateRequest } from '../../hooks/useRequests'
import type { LetterRequest, RequestStatus } from 'shared'

type ViewMode = 'cards' | 'table'
type SortField = 'studentName' | 'status' | 'deadline' | 'earliestSend' | 'createdAt'
type SortDirection = 'asc' | 'desc'

function getEarliestDestinationDeadline(request: LetterRequest) {
  return request.destinations
    ?.filter((d) => d.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0]
}

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

  const earliestDestinationDeadline = getEarliestDestinationDeadline(request)

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
            <span>Student due: {format(new Date(request.deadline), 'MMM d, yyyy')}</span>
          </div>
        )}

        {earliestDestinationDeadline?.deadline && (
          <div className="flex items-center gap-2 text-sm text-amber-600 mb-3">
            <Clock className="h-4 w-4" />
            <span>
              Earliest send: {format(new Date(earliestDestinationDeadline.deadline), 'MMM d, yyyy')}
              <span className="text-gray-400 ml-1">({earliestDestinationDeadline.institutionName})</span>
            </span>
          </div>
        )}

        {request.professorNotes && (
          <p className="text-sm text-gray-600 mb-3 italic">
            "{request.professorNotes}"
          </p>
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
          <div className="flex items-center gap-3">
            {request.status === 'PENDING' && (
              <a
                href={`mailto:?subject=${encodeURIComponent(`Letter of Recommendation Request`)}&body=${encodeURIComponent(
                  `Hello,\n\nI've created a letter of recommendation request for you. Please use the following access code to submit your information:\n\nAccess Code: ${request.accessCode}\n\nVisit the platform here: ${window.location.origin}/student\n\nInstructions:\n1. Go to the link above\n2. Enter your access code\n3. Fill out the required information about yourself and the program you're applying to\n4. Upload any supporting documents (resume, transcript, etc.)\n5. Submit your request\n\n${request.deadline ? `Please complete this by: ${format(new Date(request.deadline), 'MMMM d, yyyy')}\n\n` : ''}Thank you!`
                )}`}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                Send to student
              </a>
            )}
            <Link
              to={`/requests/${request.id}`}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function SortHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  const isActive = currentSort === field
  return (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentDirection === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <div className="h-4 w-4" />
        )}
      </div>
    </th>
  )
}

function RequestTable({
  requests,
  sortField,
  sortDirection,
  onSort,
}: {
  requests: LetterRequest[]
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader
                label="Student"
                field="studentName"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={onSort}
              />
              <SortHeader
                label="Status"
                field="status"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <SortHeader
                label="Student Due"
                field="deadline"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={onSort}
              />
              <SortHeader
                label="Earliest Send"
                field="earliestSend"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applying To
              </th>
              <SortHeader
                label="Created"
                field="createdAt"
                currentSort={sortField}
                currentDirection={sortDirection}
                onSort={onSort}
              />
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => {
              const earliestDest = getEarliestDestinationDeadline(request)
              return (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {request.studentName || 'Awaiting student info'}
                      </div>
                      {request.studentEmail && (
                        <div className="text-sm text-gray-500">{request.studentEmail}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={STATUS_CLASSES[request.status]}>
                      {STATUS_LABELS[request.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {request.accessCode}
                      </code>
                      <button
                        onClick={() => handleCopyCode(request.id, request.accessCode)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Copy code"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {copiedId === request.id && (
                        <span className="text-xs text-green-600">Copied!</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {request.deadline ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(request.deadline), 'MMM d, yyyy')}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {earliestDest?.deadline ? (
                      <div className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(earliestDest.deadline), 'MMM d, yyyy')}</span>
                        <span className="text-gray-400 text-xs truncate max-w-[100px]" title={earliestDest.institutionName}>
                          ({earliestDest.institutionName})
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {request.institutionApplying ? (
                      <span className="truncate max-w-[150px] block" title={`${request.institutionApplying}${request.programApplying ? ` - ${request.programApplying}` : ''}`}>
                        {request.institutionApplying}
                        {request.programApplying && ` - ${request.programApplying}`}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(request.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      {request.status === 'PENDING' && (
                        <a
                          href={`mailto:?subject=${encodeURIComponent(`Letter of Recommendation Request`)}&body=${encodeURIComponent(
                            `Hello,\n\nI've created a letter of recommendation request for you. Please use the following access code to submit your information:\n\nAccess Code: ${request.accessCode}\n\nVisit the platform here: ${window.location.origin}/student\n\nInstructions:\n1. Go to the link above\n2. Enter your access code\n3. Fill out the required information about yourself and the program you're applying to\n4. Upload any supporting documents (resume, transcript, etc.)\n5. Submit your request\n\n${request.deadline ? `Please complete this by: ${format(new Date(request.deadline), 'MMMM d, yyyy')}\n\n` : ''}Thank you!`
                          )}`}
                          className="text-gray-400 hover:text-gray-600"
                          title="Send to student"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      <Link
                        to={`/requests/${request.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
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
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const { data, isLoading, error } = useRequests({
    status: statusFilter || undefined,
    search: searchQuery || undefined,
  })
  const createRequest = useCreateRequest()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedRequests = useMemo(() => {
    const requests = data?.requests || []
    return [...requests].sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      switch (sortField) {
        case 'studentName':
          aVal = a.studentName?.toLowerCase() || 'zzz'
          bVal = b.studentName?.toLowerCase() || 'zzz'
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'deadline':
          aVal = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER
          bVal = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER
          break
        case 'earliestSend':
          const aEarliest = getEarliestDestinationDeadline(a)
          const bEarliest = getEarliestDestinationDeadline(b)
          aVal = aEarliest?.deadline ? new Date(aEarliest.deadline).getTime() : Number.MAX_SAFE_INTEGER
          bVal = bEarliest?.deadline ? new Date(bEarliest.deadline).getTime() : Number.MAX_SAFE_INTEGER
          break
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
          break
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [data?.requests, sortField, sortDirection])

  const handleCreate = async (formData: { deadline?: string; professorNotes?: string }) => {
    try {
      await createRequest.mutateAsync({
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
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
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 flex items-center gap-1 text-sm ${
                  viewMode === 'cards'
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 flex items-center gap-1 text-sm border-l border-gray-300 ${
                  viewMode === 'table'
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Request List */}
      {sortedRequests.length > 0 ? (
        viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <RequestTable
            requests={sortedRequests}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )
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
