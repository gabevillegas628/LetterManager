import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { HeaderConfig, HeaderItem } from 'shared'

// Define constants locally to avoid ESM/CJS module issues
const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  showName: true,
  items: ['title', 'department', 'institution', 'email']
}

const ALL_HEADER_ITEMS: { key: HeaderItem; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'department', label: 'Department' },
  { key: 'institution', label: 'Institution' },
  { key: 'address', label: 'Address' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
]

interface Props {
  config: HeaderConfig | undefined
  onChange: (config: HeaderConfig) => void
}

interface SortableItemProps {
  item: HeaderItem
  label: string
  enabled: boolean
  onToggle: (item: HeaderItem) => void
}

function SortableItem({ item, label, enabled, onToggle }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <label className="flex items-center gap-2 flex-1 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={() => onToggle(item)}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className={enabled ? 'text-gray-900' : 'text-gray-400'}>
          {label}
        </span>
      </label>
    </div>
  )
}

export default function HeaderLayoutEditor({ config, onChange }: Props) {
  // Use provided config or default
  const effectiveConfig = config || DEFAULT_HEADER_CONFIG

  // Track all items in order (enabled ones from config, then disabled ones)
  const [allItems] = useState<HeaderItem[]>(() => {
    const configItems = effectiveConfig.items
    const remainingItems = ALL_HEADER_ITEMS
      .map(i => i.key)
      .filter(key => !configItems.includes(key))
    return [...configItems, ...remainingItems]
  })

  // Current order of all items (for drag and drop)
  const [itemOrder, setItemOrder] = useState<HeaderItem[]>(allItems)

  // Set of enabled items
  const enabledItems = new Set(effectiveConfig.items)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = itemOrder.indexOf(active.id as HeaderItem)
      const newIndex = itemOrder.indexOf(over.id as HeaderItem)
      const newOrder = arrayMove(itemOrder, oldIndex, newIndex)
      setItemOrder(newOrder)

      // Update config with new order (only enabled items)
      const newEnabledItems = newOrder.filter(item => enabledItems.has(item))
      onChange({
        ...effectiveConfig,
        items: newEnabledItems,
      })
    }
  }

  const handleToggle = (item: HeaderItem) => {
    const newEnabled = new Set(enabledItems)
    if (newEnabled.has(item)) {
      newEnabled.delete(item)
    } else {
      newEnabled.add(item)
    }

    // Preserve order from itemOrder, filter to only enabled items
    const newItems = itemOrder.filter(i => newEnabled.has(i))
    onChange({
      ...effectiveConfig,
      items: newItems,
    })
  }

  const handleShowNameChange = (showName: boolean) => {
    onChange({
      ...effectiveConfig,
      showName,
    })
  }

  const getLabel = (item: HeaderItem): string => {
    return ALL_HEADER_ITEMS.find(i => i.key === item)?.label || item
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
        <input
          type="checkbox"
          checked={effectiveConfig.showName}
          onChange={(e) => handleShowNameChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <div>
          <span className="font-medium text-gray-900">Show name in header</span>
          <p className="text-sm text-gray-500">
            Display your name prominently at the top (also appears in signature)
          </p>
        </div>
      </label>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Header items (drag to reorder, check to include):
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={itemOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {itemOrder.map((item) => (
                <SortableItem
                  key={item}
                  item={item}
                  label={getLabel(item)}
                  enabled={enabledItems.has(item)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
