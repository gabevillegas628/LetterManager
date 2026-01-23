import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useValidateCode, ValidationError } from '../../hooks/useStudent'

interface ErrorDetails {
  reason: 'not_found' | 'in_progress' | 'completed' | 'archived'
  professorEmail?: string
}

export default function CodeEntryPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null)
  const navigate = useNavigate()
  const validateCode = useValidateCode()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorDetails(null)

    if (code.length < 6) {
      setError('Please enter a valid access code')
      return
    }

    try {
      const result = await validateCode.mutateAsync(code)
      if (result.valid) {
        navigate(`/student/${code.toUpperCase()}`)
      }
    } catch (err: unknown) {
      // Check if this is a ValidationError with details about why access is denied
      if (err instanceof ValidationError && err.reason && err.reason !== 'not_found') {
        setErrorDetails({
          reason: err.reason,
          professorEmail: err.professorEmail,
        })
      } else {
        setError('Invalid or expired access code. Please check and try again.')
      }
    }
  }

  return (
    <div className="card max-w-md mx-auto">
      <div className="card-body">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Enter Access Code</h2>
          <p className="text-gray-500 mt-2">
            Enter the code provided by your professor to submit your recommendation letter request.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {errorDetails && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-md">
              {errorDetails.reason === 'in_progress' && (
                <>
                  <p className="font-medium">Your letter is being written</p>
                  <p className="mt-1">
                    Your professor is currently working on your recommendation letter, so the form can no longer be edited.
                  </p>
                </>
              )}
              {errorDetails.reason === 'completed' && (
                <>
                  <p className="font-medium">Your letter has been completed</p>
                  <p className="mt-1">
                    Your recommendation letter has already been finalized and sent.
                  </p>
                </>
              )}
              {errorDetails.reason === 'archived' && (
                <>
                  <p className="font-medium">This request is no longer active</p>
                  <p className="mt-1">
                    This recommendation request has been archived.
                  </p>
                </>
              )}
              {errorDetails.professorEmail && (
                <p className="mt-3">
                  If you need to make changes, please contact your professor at{' '}
                  <a
                    href={`mailto:${errorDetails.professorEmail}?subject=Letter Request Change - ${code.toUpperCase()}`}
                    className="text-amber-900 underline font-medium"
                  >
                    {errorDetails.professorEmail}
                  </a>
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="code" className="label">
              Access Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input text-center text-lg tracking-widest"
              placeholder="XXXXXXXX"
              maxLength={12}
              required
            />
          </div>

          <button
            type="submit"
            disabled={validateCode.isPending}
            className="btn-primary w-full"
          >
            {validateCode.isPending ? 'Validating...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
