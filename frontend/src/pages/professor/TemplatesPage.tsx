import { Link } from 'react-router-dom'
import { Plus, FileText, Copy, Trash2, Star } from 'lucide-react'
import { useTemplates, useDeleteTemplate, useDuplicateTemplate } from '../../hooks/useTemplates'
import type { Template } from 'shared'

function TemplateCard({
  template,
  onDelete,
  onDuplicate,
}: {
  template: Template
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                {template.isDefault && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              {template.description && (
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDuplicate(template.id)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this template?')) {
                  onDelete(template.id)
                }
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {template.category && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {template.category}
              </span>
            )}
            {!template.isActive && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                Inactive
              </span>
            )}
          </div>
          <Link
            to={`/templates/${template.id}`}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Edit template
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const { data: templates, isLoading, error } = useTemplates()
  const deleteTemplate = useDeleteTemplate()
  const duplicateTemplate = useDuplicateTemplate()

  const handleDelete = (id: string) => {
    deleteTemplate.mutate(id)
  }

  const handleDuplicate = (id: string) => {
    duplicateTemplate.mutate(id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load templates. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Letter Templates</h1>
          <p className="text-gray-500 mt-1">Manage your recommendation letter templates</p>
        </div>
        <Link to="/templates/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Link>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first letter template to get started.
            </p>
            <Link to="/templates/new" className="btn-primary inline-flex">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
