import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Variable } from 'lucide-react'
import type { TemplateVariable } from 'shared'

interface VariableInserterProps {
  variables: TemplateVariable[]
  onInsert: (variable: string) => void
}

export default function VariableInserter({ variables, onInsert }: VariableInserterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Group variables by category
  const groupedVariables = variables.reduce((acc, variable) => {
    const category = variable.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(variable)
    return acc
  }, {} as Record<string, TemplateVariable[]>)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInsert = (variableName: string) => {
    onInsert(`{{${variableName}}}`)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center gap-2"
      >
        <Variable className="h-4 w-4" />
        Insert Variable
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-80 overflow-y-auto">
          {Object.entries(groupedVariables).map(([category, vars]) => (
            <div key={category}>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                {category}
              </div>
              {vars.map((variable) => (
                <button
                  key={variable.name}
                  type="button"
                  onClick={() => handleInsert(variable.name)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-primary-600">
                      {`{{${variable.name}}}`}
                    </span>
                  </div>
                  {variable.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{variable.description}</p>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
