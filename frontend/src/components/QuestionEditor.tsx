import { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react'
import type { CustomQuestion, QuestionType } from 'shared'

interface QuestionEditorProps {
  questions: CustomQuestion[]
  onSave: (questions: CustomQuestion[]) => Promise<void>
  isSaving: boolean
}

const QUESTION_TYPES: { value: QuestionType; label: string; description: string }[] = [
  { value: 'text', label: 'Short Text', description: 'Single line text input' },
  { value: 'textarea', label: 'Long Text', description: 'Multi-line text area' },
  { value: 'select', label: 'Dropdown', description: 'Single selection from options' },
  { value: 'multiselect', label: 'Multi-Select', description: 'Multiple selections from options' },
  { value: 'checkbox', label: 'Checkbox', description: 'Yes/No toggle' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'email', label: 'Email', description: 'Email with validation' },
  { value: 'number', label: 'Number', description: 'Numeric input' },
]

function generateId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Generate a valid variable name from a label
function generateVariableName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50) || 'variable'
}

// Validate variable name format
function isValidVariableName(name: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(name) && name.length <= 50
}

export default function QuestionEditor({ questions, onSave, isSaving }: QuestionEditorProps) {
  const [localQuestions, setLocalQuestions] = useState<CustomQuestion[]>(questions)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLocalQuestions(questions)
    setHasChanges(false)
  }, [questions])

  const handleAddQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: generateId(),
      type: 'text',
      label: 'New Question',
      required: false,
      order: localQuestions.length + 1,
      variableName: 'new_question',
    }
    setLocalQuestions([...localQuestions, newQuestion])
    setExpandedId(newQuestion.id)
    setHasChanges(true)
  }

  const handleUpdateQuestion = (id: string, updates: Partial<CustomQuestion>) => {
    setLocalQuestions(localQuestions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
    setHasChanges(true)
  }

  const handleDeleteQuestion = (id: string) => {
    setLocalQuestions(localQuestions.filter((q) => q.id !== id))
    setHasChanges(true)
    if (expandedId === id) {
      setExpandedId(null)
    }
  }

  const handleMoveQuestion = (id: string, direction: 'up' | 'down') => {
    const index = localQuestions.findIndex((q) => q.id === id)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === localQuestions.length - 1)
    ) {
      return
    }

    const newQuestions = [...localQuestions]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newQuestions[index], newQuestions[swapIndex]] = [newQuestions[swapIndex], newQuestions[index]]

    // Update order numbers
    newQuestions.forEach((q, i) => {
      q.order = i + 1
    })

    setLocalQuestions(newQuestions)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setError(null)
    try {
      // Validate questions
      const variableNames = new Set<string>()
      for (const q of localQuestions) {
        if (!q.label.trim()) {
          setError('All questions must have a label')
          return
        }
        if (!q.variableName || !isValidVariableName(q.variableName)) {
          setError(`Question "${q.label}" has an invalid variable name. Use lowercase letters, numbers, and underscores only.`)
          return
        }
        if (variableNames.has(q.variableName)) {
          setError(`Duplicate variable name "${q.variableName}". Each question must have a unique variable name.`)
          return
        }
        variableNames.add(q.variableName)
        if ((q.type === 'select' || q.type === 'multiselect') && (!q.options || q.options.length === 0)) {
          setError(`Question "${q.label}" needs at least one option`)
          return
        }
      }

      await onSave(localQuestions)
      setHasChanges(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setError('Failed to save questions')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {localQuestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No custom questions configured.</p>
          <p className="text-sm">Click "Add Question" to create your first question.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {localQuestions.map((question, index) => (
            <QuestionItem
              key={question.id}
              question={question}
              isExpanded={expandedId === question.id}
              onToggleExpand={() => setExpandedId(expandedId === question.id ? null : question.id)}
              onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
              onDelete={() => handleDeleteQuestion(question.id)}
              onMoveUp={() => handleMoveQuestion(question.id, 'up')}
              onMoveDown={() => handleMoveQuestion(question.id, 'down')}
              canMoveUp={index > 0}
              canMoveDown={index < localQuestions.length - 1}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <button onClick={handleAddQuestion} className="btn-secondary text-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
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
            'Save Questions'
          )}
        </button>
      </div>
    </div>
  )
}

interface QuestionItemProps {
  question: CustomQuestion
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (updates: Partial<CustomQuestion>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

function QuestionItem({
  question,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: QuestionItemProps) {
  const [optionsText, setOptionsText] = useState(question.options?.join('\n') || '')

  const handleOptionsChange = (text: string) => {
    setOptionsText(text)
    const options = text
      .split('\n')
      .map((o) => o.trim())
      .filter((o) => o)
    onUpdate({ options })
  }

  const typeInfo = QUESTION_TYPES.find((t) => t.value === question.type)

  return (
    <div className="border rounded-lg bg-white">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
        onClick={onToggleExpand}
      >
        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{question.label}</span>
            {question.required && (
              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">Required</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{typeInfo?.label || question.type}</span>
            <span className="text-xs font-mono text-gray-400">{`{{${question.variableName}}}`}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMoveUp()
            }}
            disabled={!canMoveUp}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMoveDown()
            }}
            disabled={!canMoveDown}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 hover:bg-red-50 text-red-600 rounded"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 border-t bg-gray-50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Label *</label>
              <input
                type="text"
                className="input"
                value={question.label}
                onChange={(e) => {
                  const newLabel = e.target.value
                  // Auto-generate variable name if it matches the old auto-generated name
                  const oldAutoName = generateVariableName(question.label)
                  const shouldAutoUpdate = question.variableName === oldAutoName || question.variableName === 'new_question'
                  onUpdate({
                    label: newLabel,
                    ...(shouldAutoUpdate && { variableName: generateVariableName(newLabel) }),
                  })
                }}
                placeholder="Question label"
              />
            </div>

            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={question.type}
                onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
              >
                {QUESTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Variable Name *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="input font-mono"
                value={question.variableName}
                onChange={(e) => onUpdate({ variableName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="variable_name"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">
                Use as: <code className="bg-gray-100 px-1 rounded">{`{{${question.variableName}}}`}</code>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lowercase letters, numbers, and underscores only. This is how you'll reference this field in letter templates.
            </p>
          </div>

          <div>
            <label className="label">Description (help text)</label>
            <input
              type="text"
              className="input"
              value={question.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value || undefined })}
              placeholder="Optional help text shown below the field"
            />
          </div>

          <div>
            <label className="label">Placeholder</label>
            <input
              type="text"
              className="input"
              value={question.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value || undefined })}
              placeholder="Optional placeholder text"
            />
          </div>

          {(question.type === 'select' || question.type === 'multiselect') && (
            <div>
              <label className="label">Options (one per line) *</label>
              <textarea
                className="input min-h-[100px]"
                value={optionsText}
                onChange={(e) => handleOptionsChange(e.target.value)}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`required-${question.id}`}
              checked={question.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor={`required-${question.id}`} className="text-sm text-gray-700">
              Required field
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
