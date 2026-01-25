import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Briefcase, ArrowRight, Clock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { AxiosError } from 'axios'

export default function LoginPage() {
  const [mode, setMode] = useState<'select' | 'professor'>('select')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsRateLimited(false)
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>
      if (axiosError.response?.status === 429) {
        setIsRateLimited(true)
        setError(axiosError.response.data?.error || 'Too many login attempts. Please try again later.')
      } else {
        setError('Invalid email or password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Role selection view
  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Letter Writer</h1>
            <p className="text-gray-600 mt-2">Recommendation letter management made simple</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Card */}
            <Link
              to="/student"
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group cursor-pointer border-2 border-transparent hover:border-primary-500"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <GraduationCap className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">I'm a Student</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Enter your access code to submit information for your recommendation letter
                </p>
                <span className="inline-flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                  Enter access code
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>

            {/* Professor Card */}
            <button
              onClick={() => setMode('professor')}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group cursor-pointer border-2 border-transparent hover:border-primary-500 text-left"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <Briefcase className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">I'm a Professor</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Sign in to manage letter requests, templates, and generate recommendation letters
                </p>
                <span className="inline-flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                  Sign in
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Professor login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Professor Sign In</h1>
            <p className="text-gray-500 mt-2">Sign in to manage recommendation letters</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`text-sm p-3 rounded-md flex items-start gap-2 ${
                isRateLimited
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-red-50 text-red-600'
              }`}>
                {isRateLimited && <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              First time?{' '}
              <Link to="/setup" className="text-primary-600 hover:text-primary-700">
                Set up your account
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t text-center">
            <button
              onClick={() => setMode('select')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Back to role selection
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
