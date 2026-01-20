import { useParams } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

export default function ConfirmationPage() {
  const { code } = useParams()

  return (
    <div className="card max-w-md mx-auto">
      <div className="card-body text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900">
          Request Submitted Successfully!
        </h2>

        <p className="text-gray-500 mt-4">
          Your recommendation letter request has been submitted. Your professor will
          be notified and will work on your letter.
        </p>

        <p className="text-sm text-gray-400 mt-4">
          Reference code: <span className="font-mono">{code}</span>
        </p>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
          <h3 className="font-medium text-blue-900">What happens next?</h3>
          <ul className="mt-2 text-sm text-blue-700 space-y-1">
            <li>1. Your professor will review your submission</li>
            <li>2. They will write and customize your letter</li>
            <li>3. The letter will be sent to your specified destinations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
