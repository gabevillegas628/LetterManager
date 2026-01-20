import { useState, useRef } from 'react'
import { Upload, Trash2, Image, FileSignature, Loader2, Check } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function SettingsPage() {
  const {
    professor,
    updateProfile,
    uploadLetterhead,
    deleteLetterhead,
    uploadSignature,
    deleteSignature,
  } = useAuth()

  const [formData, setFormData] = useState({
    name: professor?.name || '',
    title: professor?.title || '',
    department: professor?.department || '',
    institution: professor?.institution || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isUploadingLetterhead, setIsUploadingLetterhead] = useState(false)
  const [isUploadingSignature, setIsUploadingSignature] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const letterheadInputRef = useRef<HTMLInputElement>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)
    try {
      await updateProfile(formData)
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
