import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useValidateCode } from '../../hooks/useStudent'

export default function CodeEntryPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const validateCode = useValidateCode()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (code.length < 6) {
      setError('Please enter a valid access code')
      return
    }

    try {
      const result = await validateCode.mutateAsync(code)
      if (result.valid) {
        navigate(`/student/${code.toUpperCase()}`)
      }
    } catch {
      setError('Invalid or expired access code. Please check and try again.')
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
