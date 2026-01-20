import { Outlet } from 'react-router-dom'

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Recommendation Letter Request
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="text-center py-6 text-sm text-gray-500">
        <p>Letter Writer - Recommendation Letter Management</p>
      </footer>
    </div>
  )
}
