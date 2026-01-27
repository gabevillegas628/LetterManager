import type { CustomQuestion } from 'shared'

interface DynamicQuestionFieldProps {
  question: CustomQuestion
  value: unknown
  onChange: (value: unknown) => void
}

export default function DynamicQuestionField({
  question,
  value,
  onChange,
}: DynamicQuestionFieldProps) {
  const renderField = () => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            className="input"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
          />
        )

      case 'textarea':
        return (
          <textarea
            className="input min-h-[100px]"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
          />
        )

      case 'select':
        return (
          <select
            className="input"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select...</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        const selectedValues = (value as string[]) || []
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option])
                    } else {
                      onChange(selectedValues.filter((v) => v !== option))
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Yes</span>
          </label>
        )

      case 'date':
        return (
          <input
            type="date"
            className="input"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )

      case 'email':
        return (
          <input
            type="email"
            className="input"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || 'email@example.com'}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            className="input"
            value={(value as number) || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            placeholder={question.placeholder}
          />
        )

      default:
        return (
          <input
            type="text"
            className="input"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
          />
        )
    }
  }

  return (
    <div>
      <label className="label">
        {question.label}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {question.description && (
        <p className="text-xs text-gray-500 mt-1">{question.description}</p>
      )}
    </div>
  )
}
