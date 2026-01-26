import { useState, useRef, useEffect } from 'react'
import { Upload, Trash2, Image, FileSignature, Loader2, Check, UserPlus, Users, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import HeaderLayoutEditor from '../../components/HeaderLayoutEditor'
import type { HeaderConfig, Professor } from 'shared'

export default function SettingsPage() {
  const {
    professor,
    updateProfile,
    uploadLetterhead,
    deleteLetterhead,
    uploadSignature,
    deleteSignature,
    listProfessors,
    createProfessor,
    deleteProfessor,
  } = useAuth()

  const [formData, setFormData] = useState({
    name: professor?.name || '',
    title: professor?.title || '',
    department: professor?.department || '',
    institution: professor?.institution || '',
    address: professor?.address || '',
    phone: professor?.phone || '',
  })
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | undefined>(
    professor?.headerConfig
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isUploadingLetterhead, setIsUploadingLetterhead] = useState(false)
  const [isUploadingSignature, setIsUploadingSignature] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const letterheadInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)

  // Admin state
  const [professors, setProfessors] = useState<Professor[]>([])
  const [isLoadingProfessors, setIsLoadingProfessors] = useState(false)
  const [isAddingProfessor, setIsAddingProfessor] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProfessor, setNewProfessor] = useState({
    email: '',
    password: '',
    name: '',
    title: '',
    department: '',
    institution: '',
  })
  const [adminError, setAdminError] = useState<string | null>(null)

  // Load professors list for admin
  useEffect(() => {
    if (professor?.isAdmin) {
      loadProfessors()
    }
  }, [professor?.isAdmin])

  const loadProfessors = async () => {
    setIsLoadingProfessors(true)
    try {
      const profs = await listProfessors()
      setProfessors(profs)
    } catch {
      setAdminError('Failed to load professors')
    } finally {
      setIsLoadingProfessors(false)
    }
  }

  const handleAddProfessor = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingProfessor(true)
    setAdminError(null)
    try {
      await createProfessor(newProfessor)
      await loadProfessors()
      setShowAddForm(false)
      setNewProfessor({ email: '', password: '', name: '', title: '', department: '', institution: '' })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setAdminError(error.response?.data?.error || 'Failed to add professor')
    } finally {
      setIsAddingProfessor(false)
    }
  }

  const handleDeleteProfessor = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will delete all their requests, templates, and letters.`)) {
      return
    }
    setAdminError(null)
    try {
      await deleteProfessor(id)
      await loadProfessors()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setAdminError(error.response?.data?.error || 'Failed to delete professor')
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)
    try {
      await updateProfile({
        ...formData,
        headerConfig,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setError('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLetterheadUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLetterhead(true)
    setError(null)
    try {
      await uploadLetterhead(file)
    } catch (err) {
      setError('Failed to upload letterhead image')
    } finally {
      setIsUploadingLetterhead(false)
      if (letterheadInputRef.current) {
        letterheadInputRef.current.value = ''
      }
    }
  }

  const handleDeleteLetterhead = async () => {
    setError(null)
    try {
      await deleteLetterhead()
    } catch (err) {
      setError('Failed to delete letterhead image')
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingSignature(true)
    setError(null)
    try {
      await uploadSignature(file)
    } catch (err) {
      setError('Failed to upload signature image')
    } finally {
      setIsUploadingSignature(false)
      if (signatureInputRef.current) {
        signatureInputRef.current.value = ''
      }
    }
  }

  const handleDeleteSignature = async () => {
    setError(null)
    try {
      await deleteSignature()
    } catch (err) {
      setError('Failed to delete signature image')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Associate Professor"
            />
          </div>

          <div>
            <label className="label">Department</label>
            <input
              type="text"
              className="input"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div>
            <label className="label">Institution</label>
            <input
              type="text"
              className="input"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              placeholder="e.g., University Name"
            />
          </div>

          <div>
            <label className="label">Address</label>
            <textarea
              className="input min-h-[80px]"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Office address (optional)"
              rows={3}
            />
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g., (555) 123-4567"
            />
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">PDF Letterhead & Signature</h2>
          <p className="text-sm text-gray-500 mt-1">
            These images will appear on your generated PDF letters
          </p>
        </div>
        <div className="card-body space-y-6">
          {/* Letterhead Image */}
          <div>
            <label className="label flex items-center gap-2">
              <Image className="h-4 w-4" />
              Letterhead Image
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Upload your institution's letterhead or logo to appear at the top of letters.
              Recommended: PNG or JPG, max 5MB.
            </p>

            <input
              ref={letterheadInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleLetterheadUpload}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              {professor?.hasLetterhead ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Letterhead uploaded</span>
                  </div>
                  <button
                    onClick={() => letterheadInputRef.current?.click()}
                    disabled={isUploadingLetterhead}
                    className="btn-secondary text-sm"
                  >
                    {isUploadingLetterhead ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Replace'
                    )}
                  </button>
                  <button
                    onClick={handleDeleteLetterhead}
                    className="btn-ghost text-red-600 hover:bg-red-50 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => letterheadInputRef.current?.click()}
                  disabled={isUploadingLetterhead}
                  className="btn-secondary"
                >
                  {isUploadingLetterhead ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Letterhead
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Signature Image */}
          <div className="pt-4 border-t">
            <label className="label flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              Signature Image
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Upload an image of your signature to appear at the bottom of letters.
              Recommended: PNG with transparent background, max 5MB.
            </p>

            <input
              ref={signatureInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleSignatureUpload}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              {professor?.hasSignature ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Signature uploaded</span>
                  </div>
                  <button
                    onClick={() => signatureInputRef.current?.click()}
                    disabled={isUploadingSignature}
                    className="btn-secondary text-sm"
                  >
                    {isUploadingSignature ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Replace'
                    )}
                  </button>
                  <button
                    onClick={handleDeleteSignature}
                    className="btn-ghost text-red-600 hover:bg-red-50 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={isUploadingSignature}
                  className="btn-secondary"
                >
                  {isUploadingSignature ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Signature
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">PDF Header Layout</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure which information appears in your letter header and in what order
          </p>
        </div>
        <div className="card-body">
          <HeaderLayoutEditor
            config={headerConfig}
            onChange={setHeaderConfig}
          />
          <div className="pt-4 mt-4 border-t">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                'Save Header Layout'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Section - Only visible to admins */}
      {professor?.isAdmin && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold">Manage Professors</h2>
              </div>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary text-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Professor
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              As an admin, you can add or remove professors from the platform
            </p>
          </div>
          <div className="card-body">
            {adminError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {adminError}
              </div>
            )}

            {/* Add Professor Form */}
            {showAddForm && (
              <form onSubmit={handleAddProfessor} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-4">Add New Professor</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Email *</label>
                    <input
                      type="email"
                      className="input"
                      required
                      value={newProfessor.email}
                      onChange={(e) => setNewProfessor({ ...newProfessor, email: e.target.value })}
                      placeholder="professor@university.edu"
                    />
                  </div>
                  <div>
                    <label className="label">Password *</label>
                    <input
                      type="password"
                      className="input"
                      required
                      minLength={8}
                      value={newProfessor.password}
                      onChange={(e) => setNewProfessor({ ...newProfessor, password: e.target.value })}
                      placeholder="Min 8 characters"
                    />
                  </div>
                  <div>
                    <label className="label">Name *</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={newProfessor.name}
                      onChange={(e) => setNewProfessor({ ...newProfessor, name: e.target.value })}
                      placeholder="Dr. Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="label">Title</label>
                    <input
                      type="text"
                      className="input"
                      value={newProfessor.title}
                      onChange={(e) => setNewProfessor({ ...newProfessor, title: e.target.value })}
                      placeholder="Associate Professor"
                    />
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <input
                      type="text"
                      className="input"
                      value={newProfessor.department}
                      onChange={(e) => setNewProfessor({ ...newProfessor, department: e.target.value })}
                      placeholder="Computer Science"
                    />
                  </div>
                  <div>
                    <label className="label">Institution</label>
                    <input
                      type="text"
                      className="input"
                      value={newProfessor.institution}
                      onChange={(e) => setNewProfessor({ ...newProfessor, institution: e.target.value })}
                      placeholder="University Name"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={isAddingProfessor}
                    className="btn-primary"
                  >
                    {isAddingProfessor ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      'Add Professor'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewProfessor({ email: '', password: '', name: '', title: '', department: '', institution: '' })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Professors List */}
            {isLoadingProfessors ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="divide-y">
                {professors.map((prof) => (
                  <div key={prof.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{prof.name}</span>
                        {prof.isAdmin && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                            Admin
                          </span>
                        )}
                        {prof.id === professor?.id && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {prof.email}
                        {prof.title && ` · ${prof.title}`}
                      </div>
                    </div>
                    {prof.id !== professor?.id && (
                      <button
                        onClick={() => handleDeleteProfessor(prof.id, prof.name)}
                        className="btn-ghost text-red-600 hover:bg-red-50 p-2"
                        title="Delete professor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
