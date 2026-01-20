import { useAuth } from '../../hooks/useAuth'

export default function SettingsPage() {
  const { professor } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Profile</h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              className="input"
              defaultValue={professor?.name || ''}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              defaultValue={professor?.email || ''}
              placeholder="your@email.com"
              disabled
            />
          </div>

          <div>
            <label className="label">Title</label>
            <input
              type="text"
              className="input"
              defaultValue={professor?.title || ''}
              placeholder="e.g., Associate Professor"
            />
          </div>

          <div>
            <label className="label">Department</label>
            <input
              type="text"
              className="input"
              defaultValue={professor?.department || ''}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div>
            <label className="label">Institution</label>
            <input
              type="text"
              className="input"
              defaultValue={professor?.institution || ''}
              placeholder="e.g., University Name"
            />
          </div>

          <div className="pt-4">
            <button className="btn-primary">Save Changes</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Email Settings</h2>
        </div>
        <div className="card-body">
          <p className="text-gray-500">
            Email configuration - to be implemented
          </p>
        </div>
      </div>
    </div>
  )
}
