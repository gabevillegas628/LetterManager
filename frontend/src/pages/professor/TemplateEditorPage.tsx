import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import {
  useTemplate,
  useCreateTemplate,
  useUpdateTemplate,
  useTemplateVariables,
  usePreviewTemplate,
} from '../../hooks/useTemplates'
import RichTextEditor, { RichTextEditorRef } from '../../components/editor/RichTextEditor'
import VariableInserter from '../../components/editor/VariableInserter'

const DEFAULT_TEMPLATE = `<p>Dear Admissions Committee,</p>

<p>I am writing to recommend <strong>{{student_name}}</strong> for admission to the {{program}} program at {{institution}}.</p>

<p>I have had the pleasure of teaching {{student_name}} in {{course_taken}} during {{semester_year}}, where they earned a grade of {{grade}}.</p>

<p>[Add your personalized recommendation here]</p>

<p>Please feel free to contact me if you have any questions.</p>

<p>Sincerely,</p>
<p>{{professor_name}}<br/>{{professor_title}}<br/>{{department}}</p>`

export default function TemplateEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const { data: template, isLoading: templateLoading } = useTemplate(id)
  const { data: variables = [] } = useTemplateVariables()
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const previewTemplate = usePreviewTemplate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState(DEFAULT_TEMPLATE)
  const [category, setCategory] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [error, setError] = useState('')
  const editorRef = useRef<RichTextEditorRef>(null)

  // Load template data when editing
  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description || '')
      setContent(template.content)
      setCategory(template.category || '')
      setIsDefault(template.isDefault)
    }
  }, [template])

  const handleInsertVariable = (variable: string) => {
    // Insert at current cursor position inline
    editorRef.current?.insertContent(variable)
  }

  const handlePreview = async () => {
    if (!id && !content) return

    try {
      if (id) {
        const result = await previewTemplate.mutateAsync({ id })
        setPreviewContent(result.preview)
      } else {
        // For new templates, just show with sample replacements
        let preview = content
        const sampleData: Record<string, string> = {
          student_name: 'Jane Smith',
          student_email: 'jane.smith@example.com',
          program: 'Master of Science in Computer Science',
          institution: 'Stanford University',
          degree_type: 'MS',
          course_taken: 'CS 101 - Introduction to Programming',
          grade: 'A',
          semester_year: 'Fall 2024',
          professor_name: 'Dr. John Doe',
          professor_title: 'Associate Professor',
          department: 'Computer Science',
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        }
        for (const [key, value] of Object.entries(sampleData)) {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi')
          preview = preview.replace(regex, value)
        }
        setPreviewContent(preview)
      }
      setShowPreview(true)
    } catch {
      setError('Failed to generate preview')
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required')
      return
    }
    if (!content.trim()) {
      setError('Template content is required')
      return
    }

    setError('')

    try {
      if (isNew) {
        const result = await createTemplate.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          content,
          category: category.trim() || undefined,
          isDefault,
        })
        navigate(`/templates/${result.id}`)
      } else {
        await updateTemplate.mutateAsync({
          id: id!,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
            content,
            category: category.trim() || undefined,
            isDefault,
          },
        })
      }
    } catch {
      setError('Failed to save template')
    }
  }

  if (!isNew && templateLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/templates" className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'Create Template' : 'Edit Template'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isNew
                ? 'Create a new letter template with variables'
                : `Editing: ${template?.name || ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handlePreview} className="btn-secondary">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={createTemplate.isPending || updateTemplate.isPending}
            className="btn-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            {createTemplate.isPending || updateTemplate.isPending ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">Template Details</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label htmlFor="name" className="label">
                  Template Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="e.g., Standard Recommendation"
                />
              </div>

              <div>
                <label htmlFor="description" className="label">
                  Description
                </label>
                <input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  placeholder="Brief description of when to use this template"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="label">
                    Category
                  </label>
                  <input
                    id="category"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input"
                    placeholder="e.g., Graduate, Undergraduate"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Set as default template</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="font-semibold">Letter Content</h2>
              <VariableInserter variables={variables} onInsert={handleInsertVariable} />
            </div>
            <div className="card-body">
              <RichTextEditor
                ref={editorRef}
                content={content}
                onChange={setContent}
                placeholder="Write your letter template here. Use {{variable_name}} to insert dynamic content."
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">Available Variables</h2>
            </div>
            <div className="card-body">
              <p className="text-sm text-gray-500 mb-4">
                Click a variable to copy it, then paste it into your template.
              </p>
              <div className="space-y-2">
                {variables.map((variable) => (
                  <button
                    key={variable.name}
                    onClick={() => {
                      navigator.clipboard.writeText(`{{${variable.name}}}`)
                    }}
                    className="w-full text-left p-2 rounded border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <code className="text-sm text-primary-600">{`{{${variable.name}}}`}</code>
                    {variable.description && (
                      <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">Tips</h2>
            </div>
            <div className="card-body">
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Use variables like <code className="text-primary-600">{`{{student_name}}`}</code> for dynamic content</li>
                <li>• Variables will be replaced with actual student data</li>
                <li>• You can preview the template with sample data</li>
                <li>• Set one template as default for quick selection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Template Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </div>
            <div className="flex justify-end p-4 border-t bg-gray-50">
              <button onClick={() => setShowPreview(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
