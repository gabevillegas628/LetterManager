import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Edit3, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function ConfirmationPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleEditSubmission = () => {
    navigate(`/student/${code}`)
  }

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

        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Your access code</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-lg font-semibold text-gray-900">{code}</span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
              title="Copy code"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Edit/Update Section */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
          <h3 className="font-medium text-amber-900 flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Need to make changes?
          </h3>
          <p className="mt-2 text-sm text-amber-700">
            You can return anytime to edit your information or add more application destinations
            using your access code &mdash; as long as your professor hasn&apos;t started working on your letter.
          </p>
          <button
            onClick={handleEditSubmission}
            className="mt-3 btn-secondary text-sm py-2"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit My Submission
          </button>
        </div>

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
