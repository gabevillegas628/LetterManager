import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'

// Layouts
import DashboardLayout from './components/layout/DashboardLayout'
import StudentLayout from './components/layout/StudentLayout'

// Professor Pages
import LoginPage from './pages/professor/LoginPage'
import RequestAccountPage from './pages/professor/RequestAccountPage'
import SetupPage from './pages/professor/SetupPage'
import DashboardPage from './pages/professor/DashboardPage'
import RequestsPage from './pages/professor/RequestsPage'
import RequestDetailPage from './pages/professor/RequestDetailPage'
import TemplatesPage from './pages/professor/TemplatesPage'
import TemplateEditorPage from './pages/professor/TemplateEditorPage'
import SettingsPage from './pages/professor/SettingsPage'

// Student Pages
import CodeEntryPage from './pages/student/CodeEntryPage'
import RequestFormPage from './pages/student/RequestFormPage'
import ConfirmationPage from './pages/student/ConfirmationPage'

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Professor Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/request-account" element={<RequestAccountPage />} />
        <Route path="/setup" element={<SetupPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="requests/:id" element={<RequestDetailPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="templates/new" element={<TemplateEditorPage />} />
          <Route path="templates/:id" element={<TemplateEditorPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<CodeEntryPage />} />
          <Route path=":code" element={<RequestFormPage />} />
          <Route path=":code/confirmation" element={<ConfirmationPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
