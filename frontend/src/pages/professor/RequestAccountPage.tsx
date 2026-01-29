import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Landmark, CheckCircle } from 'lucide-react'
import { api } from '../../api/client'
import { AxiosError } from 'axios'

export default function RequestAccountPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [institution, setInstitution] = useState('')
  const [howHeard, setHowHeard] = useState('')
  const [lettersPerYear, setLettersPerYear] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await api.post('/contact/request-account', {
        name,
        email,
        institution,
        howHeard,
        lettersPerYear,
      })
      setIsSubmitted(true)
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>
      setError(axiosError.response?.data?.error || 'Failed to submit request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Success state
  if (isSubmitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />

        {/* Header with logo */}
        <header className="absolute top-6 right-6 flex items-center z-20">
          <img src="/RFinal.png" alt="" className="w-12 h-12" />
          <span className="text-3xl font-bold text-gray-900 -ml-3 relative z-10">ecommate</span>
        </header>

        <div className="w-full max-w-md relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Request Submitted</h1>
          <p className="text-gray-500 mb-8">
            Thanks for your interest in Recommate! We'll review your request and get back to you at <strong>{email}</strong> soon.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />

      {/* Header with logo */}
      <header className="absolute top-6 right-6 flex items-center z-20">
        <img src="/RFinal.png" alt="" className="w-12 h-12" />
        <span className="text-3xl font-bold text-gray-900 -ml-3 relative z-10">ecommate</span>
      </header>

      <div className="w-full max-w-md relative z-10">
        {/* Page title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl mb-4 shadow-sm">
            <Landmark className="h-7 w-7 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Request an Account</h1>
          <p className="text-gray-500 mt-2">Tell us about yourself and we'll set you up</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-sm p-3 rounded-lg bg-red-50 text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="label">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Dr. Jane Smith"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="jane.smith@university.edu"
                required
              />
            </div>

            <div>
              <label htmlFor="institution" className="label">
                Institution <span className="text-red-500">*</span>
              </label>
              <input
                id="institution"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="input"
                placeholder="University of Example"
                required
              />
            </div>

            <div>
              <label htmlFor="howHeard" className="label">
                How did you hear about us?
              </label>
              <select
                id="howHeard"
                value={howHeard}
                onChange={(e) => setHowHeard(e.target.value)}
                className="input"
              >
                <option value="">Select an option</option>
                <option value="colleague">Colleague recommendation</option>
                <option value="search">Search engine</option>
                <option value="social">Social media</option>
                <option value="conference">Conference/Event</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="lettersPerYear" className="label">
                How many recommendation letters do you write per year?
              </label>
              <select
                id="lettersPerYear"
                value={lettersPerYear}
                onChange={(e) => setLettersPerYear(e.target.value)}
                className="input"
              >
                <option value="">Select an option</option>
                <option value="1-5">1-5</option>
                <option value="6-15">6-15</option>
                <option value="16-30">16-30</option>
                <option value="30+">30+</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to login
          </Link>
        </div>
      </div>
    </main>
  )
}
