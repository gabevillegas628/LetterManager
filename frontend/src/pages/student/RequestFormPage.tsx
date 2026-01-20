import { useParams } from 'react-router-dom'

export default function RequestFormPage() {
  const { code } = useParams()

  return (
    <div className="card">
      <div className="card-body">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Recommendation Letter Request
          </h2>
          <p className="text-gray-500 mt-2">
            Code: <span className="font-mono font-medium">{code}</span>
          </p>
        </div>

        <p className="text-gray-500 text-center py-12">
          Student form (multi-step: personal info, academic info, documents, destinations) - to be implemented
        </p>
      </div>
    </div>
  )
}
