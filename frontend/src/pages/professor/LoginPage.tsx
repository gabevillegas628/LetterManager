import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Briefcase, ArrowRight, Clock, FileText, Calendar, Check, Send, Download, Eye, Bold, Italic, Underline, AlignLeft, ChevronDown, GripVertical, Plus, Zap, Shield, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { AxiosError } from 'axios'

// Browser frame wrapper for all mockups
function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-lg">
      <div className="bg-gray-800 rounded-t-xl px-4 py-3 flex items-center gap-3">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 bg-gray-700 rounded-md px-3 py-1.5 text-xs text-gray-300 font-mono">
          {url}
        </div>
      </div>
      <div className="bg-gray-50 rounded-b-xl p-4 shadow-2xl border border-gray-200 border-t-0 min-h-[280px]">
        {children}
      </div>
    </div>
  )
}

function DashboardMockup() {
  return (
    <BrowserFrame url="recommate.net/dashboard">
      {/* Mini nav */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <FileText className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">Recommate</span>
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="text-blue-600 font-medium">Dashboard</span>
          <span>Requests</span>
          <span>Templates</span>
        </div>
      </div>

      {/* Workflow Pipeline */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 mb-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Workflow Pipeline</div>
        <div className="flex h-8 rounded-lg overflow-hidden">
          <div className="bg-yellow-400 w-[20%] flex items-center justify-center">
            <span className="text-xs font-bold text-yellow-800">3</span>
          </div>
          <div className="bg-orange-400 w-[25%] flex items-center justify-center">
            <span className="text-xs font-bold text-orange-800">4</span>
          </div>
          <div className="bg-blue-400 w-[35%] flex items-center justify-center">
            <span className="text-xs font-bold text-blue-800">5</span>
          </div>
          <div className="bg-green-400 w-[20%] flex items-center justify-center">
            <span className="text-xs font-bold text-green-800">2</span>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-500">
          <span>Awaiting</span>
          <span>Ready</span>
          <span>Writing</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white rounded-lg p-2.5 shadow-sm border-l-4 border-orange-400">
          <div className="text-[10px] text-gray-500">Ready to Write</div>
          <div className="text-lg font-bold text-gray-900">4</div>
        </div>
        <div className="bg-white rounded-lg p-2.5 shadow-sm border-l-4 border-red-400">
          <div className="text-[10px] text-gray-500">Due This Week</div>
          <div className="text-lg font-bold text-gray-900">2</div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
        <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Upcoming Deadlines
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-700">Sarah Chen → MIT</span>
            <span className="text-orange-600 font-medium">Jan 30</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-700">James Park → Stanford</span>
            <span className="text-gray-500">Feb 5</span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}

function TemplateEditorMockup() {
  return (
    <BrowserFrame url="recommate.net/templates/edit">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Graduate School Template</span>
        </div>
        <button className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1">
          <Check className="h-3 w-3" /> Save
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-t-lg border border-gray-200 border-b-0 p-2 flex items-center gap-1">
        <button className="p-1.5 hover:bg-gray-100 rounded"><Bold className="h-3.5 w-3.5 text-gray-600" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded"><Italic className="h-3.5 w-3.5 text-gray-600" /></button>
        <button className="p-1.5 hover:bg-gray-100 rounded"><Underline className="h-3.5 w-3.5 text-gray-600" /></button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button className="p-1.5 hover:bg-gray-100 rounded"><AlignLeft className="h-3.5 w-3.5 text-gray-600" /></button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button className="bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded flex items-center gap-1">
          Insert Variable <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-white rounded-b-lg border border-gray-200 p-3 text-xs text-gray-700 space-y-2 min-h-[140px]">
        <p>Dear Admissions Committee,</p>
        <p>I am writing to recommend <span className="bg-blue-100 text-blue-700 px-1 rounded">{"{{student_name}}"}</span> for admission to the <span className="bg-blue-100 text-blue-700 px-1 rounded">{"{{program}}"}</span> program.</p>
        <p>I have had the pleasure of teaching this student in <span className="bg-blue-100 text-blue-700 px-1 rounded">{"{{course_taken}}"}</span> where they earned a grade of <span className="bg-blue-100 text-blue-700 px-1 rounded">{"{{grade}}"}</span>.</p>
        <p className="text-gray-400 italic">[Your personalized content here...]</p>
      </div>

      {/* Variable hint */}
      <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1">
        <span className="bg-blue-100 text-blue-700 px-1 rounded">variables</span> auto-fill with student data
      </div>
    </BrowserFrame>
  )
}

function CustomQuestionsMockup() {
  return (
    <BrowserFrame url="recommate.net/settings">
      {/* Header */}
      <div className="mb-3 pb-3 border-b border-gray-200">
        <div className="text-sm font-semibold text-gray-900">Student Questions</div>
        <div className="text-[10px] text-gray-500 mt-1">Configure what students answer when requesting a letter</div>
      </div>

      {/* Questions List */}
      <div className="space-y-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-800">What are your career goals?</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Long text • Required</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-800">Why did you choose this program?</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Long text • Required</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-800">List any relevant achievements</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Long text • Optional</div>
          </div>
        </div>
      </div>

      {/* Add button */}
      <button className="mt-3 w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-xs text-gray-500 flex items-center justify-center gap-1 hover:border-blue-400 hover:text-blue-600">
        <Plus className="h-3.5 w-3.5" /> Add Question
      </button>
    </BrowserFrame>
  )
}

function PdfGenerationMockup() {
  return (
    <BrowserFrame url="recommate.net/requests/sarah-chen">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
        <div>
          <div className="text-sm font-semibold text-gray-900">Sarah Chen</div>
          <div className="text-[10px] text-gray-500">PhD Computer Science</div>
        </div>
        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
          <Check className="h-3 w-3" /> Finalized
        </span>
      </div>

      {/* Letter Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-gray-800">MIT - EECS Department</div>
          <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">PDF Ready</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-blue-600 text-white text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1">
            <FileText className="h-3 w-3" /> Generate PDF
          </button>
          <button className="bg-gray-100 text-gray-700 text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1">
            <Eye className="h-3 w-3" /> Preview
          </button>
          <button className="bg-gray-100 text-gray-700 text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1">
            <Download className="h-3 w-3" /> Download
          </button>
        </div>
      </div>

      {/* PDF Preview hint */}
      <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
          <div className="text-[10px] text-gray-500">letter-sarah-chen-mit.pdf</div>
        </div>
      </div>
    </BrowserFrame>
  )
}

function SubmissionTrackingMockup() {
  return (
    <BrowserFrame url="recommate.net/requests/sarah-chen#submissions">
      {/* Header */}
      <div className="mb-3 pb-3 border-b border-gray-200">
        <div className="text-sm font-semibold text-gray-900">Submission Tracking</div>
        <div className="text-[10px] text-gray-500 mt-1">Track where letters have been sent</div>
      </div>

      {/* Destinations */}
      <div className="space-y-2">
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-800">MIT - EECS</div>
            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="h-3 w-3" /> Confirmed
            </span>
          </div>
          <div className="text-[10px] text-gray-500">Sent Jan 28 • Confirmed Jan 29</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-800">Stanford - CS</div>
            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Send className="h-3 w-3" /> Sent
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button className="bg-green-600 text-white text-[10px] px-2 py-1 rounded">Mark Confirmed</button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-800">Berkeley - EECS</div>
            <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">Pending</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
              <Send className="h-3 w-3" /> Send Email
            </button>
            <button className="bg-gray-100 text-gray-700 text-[10px] px-2 py-1 rounded">Mark as Sent</button>
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}

// Main carousel component
function FeatureCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  const features = [
    { component: <DashboardMockup />, label: 'Dashboard' },
    { component: <TemplateEditorMockup />, label: 'Templates' },
    { component: <CustomQuestionsMockup />, label: 'Questions' },
    { component: <PdfGenerationMockup />, label: 'PDF Export' },
    { component: <SubmissionTrackingMockup />, label: 'Tracking' },
  ]

  // Auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [features.length])

  return (
    <div className="w-full max-w-lg">
      {/* Dots and labels */}
      <div className="flex justify-center gap-3 mb-4">
        {features.map((feature, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`flex flex-col items-center gap-1 transition-all ${
              index === activeIndex ? 'opacity-100' : 'opacity-50 hover:opacity-75'
            }`}
          >
            <span className="text-[16px] text-blue-100">{feature.label}</span>
            <div className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex ? 'bg-white scale-125' : 'bg-white/50'
            }`} />
          </button>
        ))}
      </div>

      {/* Mockup display - fixed height container */}
      <div className="relative h-[360px]">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`absolute inset-x-0 top-0 transition-all duration-500 ${
              index === activeIndex
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-4 pointer-events-none'
            }`}
          >
            {feature.component}
          </div>
        ))}
      </div>
    </div>
  )
}

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
      <div className="relative z-10 flex flex-col justify-center items-center w-full p-8 text-white">
        {/* Text content */}
        <h1 className="text-3xl font-bold mb-3 text-center">
          Recommendation Letters,<br />Simplified
        </h1>
        <p className="text-blue-100 text-center max-w-md text-base mb-6">
          The smarter way for professors to manage recommendation letter requests. Students submit their details, you focus on writing.
        </p>

        {/* Feature Carousel */}
        <FeatureCarousel />
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
      <main className="min-h-screen flex">
        <IllustrationPanel />

        {/* Right side - content */}
        <section className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />

          <div className="w-full max-w-md relative z-10">
            {/* Logo/Brand */}
            <header className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl mb-4 shadow-lg shadow-blue-600/30" aria-hidden="true">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Recommate</h2>
              <p className="text-gray-500 mt-2">Recommendation letter management made simple.</p>
            </header>

            {/* Benefit callouts */}
            <div className="flex justify-center gap-6 mb-8">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Save Time</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Student Info</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Secure</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Student Card */}
              <Link
                to="/student"
                className="block bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg transition-all p-6 group border border-gray-200 hover:border-blue-400 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-colors shadow-sm">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">I'm a Student</h3>
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
                className="w-full bg-white/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg transition-all p-6 group border border-gray-200 hover:border-purple-400 text-left hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-300 transition-colors shadow-sm">
                    <Briefcase className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">I'm a Professor</h3>
                    <p className="text-gray-500 text-sm">
                      Sign in to manage requests and submissions
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            </div>

            {/* Footer */}
            <footer className="text-center text-xs text-gray-400 mt-10">
              <p>Free to use • No credit card required</p>
            </footer>
          </div>
        </section>
      </main>
    )
  }

  // Professor login form
  return (
    <main className="min-h-screen flex">
      <IllustrationPanel />

      {/* Right side - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative z-10">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl mb-4 shadow-lg shadow-purple-600/30">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Professor Sign In</h1>
            <p className="text-gray-500 mt-2">Sign in to manage recommendation letters</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-8">
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
    </main>
  )
}
