import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, AlertCircle, Calendar, ChevronRight, Plus } from 'lucide-react'
import { format, addDays, isBefore, isAfter, startOfDay } from 'date-fns'
import { useRequestStats } from '../../hooks/useRequests'
import { useTemplates } from '../../hooks/useTemplates'
import type { LetterRequest, SubmissionDestination } from 'shared'

type DeadlineFilter = '1week' | '2weeks' | '1month' | '2months'

const DEADLINE_FILTERS: { value: DeadlineFilter; label: string; days: number }[] = [
  { value: '1week', label: '1 week', days: 7 },
  { value: '2weeks', label: '2 weeks', days: 14 },
  { value: '1month', label: '1 month', days: 30 },
  { value: '2months', label: '2 months', days: 60 },
]

interface UpcomingDestination {
  request: LetterRequest
  destination: SubmissionDestination
}

interface PipelineStage {
  key: string
  label: string
  count: number
  color: string
  bgColor: string
  hoverColor: string
  status: string
}

function WorkflowPipeline({ stages, total }: { stages: PipelineStage[]; total: number }) {
  // Filter to only stages with items for the bar
  const activeStages = stages.filter(s => s.count > 0)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Workflow Pipeline</h2>
        <Link to="/requests" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stage progression labels */}
      <div className="flex items-center justify-between mb-3 px-1">
        {stages.map((stage, index) => (
          <div key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full ${stage.count > 0 ? stage.bgColor : 'bg-gray-200'}`} />
              <span className={`text-xs mt-1 ${stage.count > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                {stage.label}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div className="flex-1 mx-2 flex items-center -mt-4">
                <div className={`h-px flex-1 ${
                  stages.slice(0, index + 1).some(s => s.count > 0) ? 'bg-gray-300' : 'bg-gray-200'
                }`} />
                <ChevronRight className={`h-3 w-3 -ml-1 ${
                  stages.slice(0, index + 1).some(s => s.count > 0) ? 'text-gray-400' : 'text-gray-200'
                }`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stacked Progress Bar */}
      <div className="relative">
        <div className="flex h-14 rounded-xl overflow-hidden shadow-inner bg-gray-100">
          {activeStages.map((stage, index) => {
            const percentage = (stage.count / total) * 100
            return (
              <Link
                key={stage.key}
                to={`/requests?status=${stage.status}`}
                className={`${stage.bgColor} ${stage.hoverColor} relative flex items-center justify-center transition-all duration-200 group`}
                style={{ width: `${percentage}%`, minWidth: stage.count > 0 ? '40px' : '0' }}
                title={`${stage.label}: ${stage.count}`}
              >
                {/* Count badge */}
                <span className={`font-bold text-lg ${stage.color} drop-shadow-sm`}>
                  {stage.count}
                </span>

                {/* Hover tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {stage.label}
                </div>

                {/* Separator line */}
                {index < activeStages.length - 1 && (
                  <div className="absolute right-0 top-2 bottom-2 w-px bg-white/30" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Flow arrows between stages */}
        <div className="absolute -bottom-1 left-0 right-0 flex justify-around pointer-events-none">
          {activeStages.slice(0, -1).map((stage, index) => {
            const prevWidth = activeStages.slice(0, index + 1).reduce((sum, s) => sum + (s.count / total) * 100, 0)
            return (
              <div
                key={`arrow-${stage.key}`}
                className="text-gray-300"
                style={{ position: 'absolute', left: `${prevWidth}%`, transform: 'translateX(-50%)' }}
              >
                <ChevronRight className="h-4 w-4" />
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6">
        {stages.map((stage) => (
          <Link
            key={stage.key}
            to={`/requests?status=${stage.status}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className={`w-3 h-3 rounded-full ${stage.bgColor}`} />
            <span>{stage.label}</span>
            <span className="text-gray-400">({stage.count})</span>
          </Link>
        ))}
      </div>

      {/* Empty state message */}
      {total === 0 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Create your first request to start tracking your workflow
        </p>
      )}
    </div>
  )
}

function ActionNeededCard({
  title,
  count,
  description,
  linkTo,
  accentColor
}: {
  title: string
  count: number
  description: string
  linkTo: string
  accentColor: string
}) {
  if (count === 0) return null

  return (
    <Link
      to={linkTo}
      className={`card p-5 border-l-4 ${accentColor} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('2weeks')
  const { data: stats, isLoading: statsLoading } = useRequestStats()
  const { data: templates, isLoading: templatesLoading } = useTemplates()

  const isLoading = statsLoading || templatesLoading

  // Flatten requests into individual destinations and filter
  const upcomingDestinations = useMemo((): UpcomingDestination[] => {
    if (!stats?.upcomingDeadlines) return []

    const filterConfig = DEADLINE_FILTERS.find(f => f.value === deadlineFilter)
    if (!filterConfig) return []

    const now = startOfDay(new Date())
    const cutoffDate = addDays(now, filterConfig.days)

    const destinations: UpcomingDestination[] = []

    for (const request of stats.upcomingDeadlines) {
      if (!request.destinations) continue

      for (const destination of request.destinations) {
        // Skip if no deadline
        if (!destination.deadline) continue

        // Skip if already sent or confirmed
        if (destination.status === 'SENT' || destination.status === 'CONFIRMED') continue

        const deadlineDate = new Date(destination.deadline)

        // Check if within filter range
        if (isAfter(deadlineDate, now) && isBefore(deadlineDate, cutoffDate)) {
          destinations.push({ request, destination })
        }
      }
    }

    // Sort by deadline (earliest first)
    return destinations.sort((a, b) =>
      new Date(a.destination.deadline!).getTime() - new Date(b.destination.deadline!).getTime()
    )
  }, [stats?.upcomingDeadlines, deadlineFilter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const stages: PipelineStage[] = [
    {
      key: 'pending',
      label: 'Awaiting Student',
      count: stats?.pending || 0,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-400',
      hoverColor: 'hover:bg-yellow-500',
      status: 'PENDING',
    },
    {
      key: 'submitted',
      label: 'Ready to Write',
      count: stats?.submitted || 0,
      color: 'text-orange-700',
      bgColor: 'bg-orange-400',
      hoverColor: 'hover:bg-orange-500',
      status: 'SUBMITTED',
    },
    {
      key: 'inProgress',
      label: 'In Progress',
      count: stats?.inProgress || 0,
      color: 'text-purple-700',
      bgColor: 'bg-purple-400',
      hoverColor: 'hover:bg-purple-500',
      status: 'IN_PROGRESS',
    },
    {
      key: 'completed',
      label: 'Completed',
      count: stats?.completed || 0,
      color: 'text-green-700',
      bgColor: 'bg-green-400',
      hoverColor: 'hover:bg-green-500',
      status: 'COMPLETED',
    },
  ]

  const totalRequests = stats?.total || 0
  const needsAction = (stats?.submitted || 0) + (stats?.inProgress || 0)

  return (
    <div className="space-y-6">
      {/* Header with quick action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {totalRequests === 0
              ? 'Get started by creating a request'
              : `${totalRequests} total request${totalRequests !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/requests" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Link>
      </div>

      {/* Workflow Pipeline */}
      <WorkflowPipeline stages={stages} total={totalRequests} />

      {/* Action Cards */}
      {needsAction > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionNeededCard
            title="Ready to Write"
            count={stats?.submitted || 0}
            description="Students submitted, awaiting your letter"
            linkTo="/requests?status=SUBMITTED"
            accentColor="border-orange-400"
          />
          <ActionNeededCard
            title="In Progress"
            count={stats?.inProgress || 0}
            description="Letters you're currently working on"
            linkTo="/requests?status=IN_PROGRESS"
            accentColor="border-purple-400"
          />
        </div>
      )}

      {/* Upcoming Deadlines */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
          </div>
          <select
            value={deadlineFilter}
            onChange={(e) => setDeadlineFilter(e.target.value as DeadlineFilter)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {DEADLINE_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                Next {filter.label}
              </option>
            ))}
          </select>
        </div>
        {upcomingDestinations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {upcomingDestinations.map(({ request, destination }) => (
              <div key={destination.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {request.studentName || 'Awaiting student info'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {destination.institutionName}
                    {destination.programName && ` - ${destination.programName}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(destination.deadline!), 'MMM d, yyyy')}
                  </div>
                  <Link
                    to={`/requests/${request.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No deadlines in the next {DEADLINE_FILTERS.find(f => f.value === deadlineFilter)?.label}</p>
          </div>
        )}
      </div>

      {/* Templates summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FolderOpen className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Letter Templates</p>
              <p className="text-sm text-gray-500">
                {templates?.length || 0} template{(templates?.length || 0) !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <Link to="/templates" className="btn-secondary text-sm">
            Manage Templates
          </Link>
        </div>
      </div>

      {/* Getting Started */}
      {stats?.total === 0 && (!templates || templates.length === 0) && (
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="card-body text-center py-8">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              Welcome to Recommate!
            </h3>
            <p className="text-primary-700 mb-6 max-w-md mx-auto">
              Get started by creating a letter template, then create requests for students
              who need recommendation letters.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/templates/new" className="btn-primary">
                <FolderOpen className="h-4 w-4 mr-2" />
                Create Your First Template
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
