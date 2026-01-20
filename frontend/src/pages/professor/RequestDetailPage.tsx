import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function RequestDetailPage() {
  const { id } = useParams()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/requests" className="btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Details</h1>
          <p className="text-gray-500 mt-1">Request ID: {id}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-gray-500 text-center py-12">
            Request detail view - to be implemented
          </p>
        </div>
      </div>
    </div>
  )
}
