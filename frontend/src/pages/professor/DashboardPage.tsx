import { Link } from 'react-router-dom'
import { FileText, FolderOpen, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useRequestStats } from '../../hooks/useRequests'
import { useTemplates } from '../../hooks/useTemplates'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useRequestStats()
  const { data: templates, isLoading: templatesLoading } = useTemplates()

  const isLoading = statsLoading || templatesLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your recommendation letters</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-semibold">{stats?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-semibold">
                {(stats?.pending || 0) + (stats?.submitted || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-semibold">{stats?.completed || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FolderOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Templates</p>
              <p className="text-2xl font-semibold">{templates?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <Link to="/requests" className="btn-primary">
              <FileText className="h-4 w-4 mr-2" />
              Create New Request
            </Link>
            <Link to="/templates/new" className="btn-secondary">
              <FolderOpen className="h-4 w-4 mr-2" />
              Create Template
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.upcomingDeadlines.map((request) => (
              <div key={request.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {request.studentName || 'Awaiting student info'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {request.institutionApplying || 'No institution specified'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Calendar className="h-4 w-4" />
                    {request.deadline && format(new Date(request.deadline), 'MMM d, yyyy')}
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
        </div>
      )}

      {/* Getting Started */}
      {stats?.total === 0 && (!templates || templates.length === 0) && (
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="card-body text-center py-8">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              Welcome to Letter Writer!
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
