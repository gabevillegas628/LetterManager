import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Briefcase, ArrowRight, Clock, FileText, PenTool, Star } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { AxiosError } from 'axios'

function IllustrationPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Decorative circles */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
        {/* Illustration */}
        <div className="mb-8 relative">
          {/* Main letter/document */}
          <div className="w-48 h-56 bg-white rounded-lg shadow-2xl transform -rotate-3 relative">
            <div className="absolute inset-4 space-y-3">
              <div className="h-2 bg-gray-200 rounded w-3/4" />
              <div className="h-2 bg-gray-200 rounded w-full" />
              <div className="h-2 bg-gray-200 rounded w-5/6" />
              <div className="h-2 bg-gray-200 rounded w-full" />
              <div className="h-2 bg-gray-200 rounded w-2/3" />
              <div className="mt-6 h-2 bg-gray-200 rounded w-full" />
              <div className="h-2 bg-gray-200 rounded w-4/5" />
              <div className="h-2 bg-gray-200 rounded w-full" />
            </div>
            {/* Signature line */}
            <div className="absolute bottom-8 left-4 right-4">
              <div className="h-0.5 bg-gray-300 w-1/2" />
              <div className="text-xs text-gray-400 mt-1 font-serif italic">Signature</div>
            </div>
          </div>

          {/* Pen decoration */}
          <div className="absolute -right-6 -top-4 transform rotate-45">
            <div className="w-4 h-24 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-full relative">
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[12px] border-l-transparent border-r-transparent border-t-gray-700" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-4 bg-amber-500 rounded-t-full" />
            </div>
          </div>

          {/* Star decorations */}
          <Star className="absolute -left-8 top-4 h-6 w-6 text-yellow-300 fill-yellow-300 opacity-80" />
          <Star className="absolute -right-10 bottom-12 h-4 w-4 text-yellow-300 fill-yellow-300 opacity-60" />
          <Star className="absolute left-4 -bottom-6 h-5 w-5 text-yellow-300 fill-yellow-300 opacity-70" />
        </div>

        {/* Text content */}
        <h2 className="text-3xl font-bold mb-4 text-center">
          Recommendation Letters,<br />Simplified
        </h2>
        <p className="text-blue-100 text-center max-w-sm text-lg">
          Streamline your letter writing process with organized student information.
        </p>

        {/* Feature highlights */}
        <div className="mt-10 space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-blue-100">Manage multiple letter requests</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <PenTool className="h-4 w-4" />
            </div>
            <span className="text-blue-100">Track deadlines and submissions</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-blue-100">Student-submitted information</span>
          </div>
        </div>
      </div>
    </div>
  )
}

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
      <div className="min-h-screen flex">
        <IllustrationPanel />

        {/* Right side - content */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
          <div className="w-full max-w-md">
            {/* Logo/Brand */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4 shadow-lg shadow-blue-600/30">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Recommate</h1>
              <p className="text-gray-500 mt-2">Welcome back! Please select your role to continue.</p>
            </div>

            <div className="space-y-4">
              {/* Student Card */}
              <Link
                to="/student"
                className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 group border border-gray-200 hover:border-blue-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">I'm a Student</h2>
                    <p className="text-gray-500 text-sm">
                      Enter your access code to submit information
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              {/* Professor Card */}
              <button
                onClick={() => setMode('professor')}
                className="w-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 group border border-gray-200 hover:border-purple-300 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Briefcase className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">I'm a Professor</h2>
                    <p className="text-gray-500 text-sm">
                      Sign in to manage requests and submissions
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 mt-10">
              Secure recommendation letter management
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Professor login form
  return (
    <div className="min-h-screen flex">
      <IllustrationPanel />

      {/* Right side - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-600 rounded-xl mb-4 shadow-lg shadow-purple-600/30">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Professor Sign In</h1>
            <p className="text-gray-500 mt-2">Sign in to manage recommendation letters</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className={`text-sm p-3 rounded-lg flex items-start gap-2 ${
                  isRateLimited
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
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
                <Link to="/setup" className="text-primary-600 hover:text-primary-700 font-medium">
                  Set up your account
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode('select')}
              className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to role selection
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
