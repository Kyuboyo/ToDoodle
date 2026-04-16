'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { cn, getStatusConfig } from '@/lib/utils'
import { TagBadge } from './tag-badge'
import { STATUSES } from '@/types'
import type { Tag, Attachment } from '@/types'

interface KanbanTask {
  id: string
  title: string
  body: string | null
  status: string
  createdAt: Date
  tags: Tag[]
  attachments: Attachment[]
}

interface KanbanBoardProps {
  initialTasks: KanbanTask[]
}

function MiniTaskCard({
  task,
  dragging,
}: {
  task: KanbanTask
  dragging?: boolean
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm hover:shadow-md transition-all',
        dragging && 'shadow-xl rotate-1 opacity-90'
      )}
    >
      <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 mb-2">
        {task.title}
      </p>
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
          {task.tags.length > 2 && (
            <span className="text-xs text-gray-400">+{task.tags.length - 2}</span>
          )}
        </div>
      )}
      {task.attachments.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
          {task.attachments.length}
        </div>
      )}
    </div>
  )
}

function SortableCard({ task }: { task: KanbanTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: 'task', task } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/todos/${task.id}`} onClick={(e) => isDragging && e.preventDefault()}>
        <MiniTaskCard task={task} />
      </Link>
    </div>
  )
}

function KanbanColumn({
  status,
  tasks,
  isOver,
}: {
  status: (typeof STATUSES)[number]
  tasks: KanbanTask[]
  isOver: boolean
}) {
  const taskIds = tasks.map((t) => t.id)

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl transition-colors min-h-[200px]',
        isOver ? 'bg-gray-100' : 'bg-gray-50/70'
      )}
      style={{ minWidth: 260, width: 260 }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              status.bg,
              status.text
            )}
          >
            {status.label}
          </span>
          <span className="text-xs text-gray-400 font-medium">{tasks.length}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 px-3 pb-3 space-y-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-xs text-gray-400">Drop here</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const tasksByStatus = useCallback(() => {
    const map: Record<string, KanbanTask[]> = {}
    for (const s of STATUSES) map[s.value] = []
    for (const t of tasks) {
      if (map[t.status]) map[t.status].push(t)
    }
    return map
  }, [tasks])

  function findStatus(id: string): string | null {
    for (const s of STATUSES) {
      if (s.value === id) return id
    }
    const task = tasks.find((t) => t.id === id)
    return task?.status ?? null
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined
    if (!overId) return
    const overStatus = findStatus(overId)
    setOverColumnId(overStatus)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    setOverColumnId(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    const targetStatus = findStatus(overId)
    if (!targetStatus || targetStatus === activeTask.status) return

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: targetStatus } : t))
    )

    // Persist
    try {
      await fetch(`/api/tasks/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      })
    } catch {
      // Rollback on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: activeTask.status } : t))
      )
    }
  }

  const grouped = tasksByStatus()

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status.value}
            status={status}
            tasks={grouped[status.value] ?? []}
            isOver={overColumnId === status.value}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <MiniTaskCard task={activeTask} dragging />}
      </DragOverlay>
    </DndContext>
  )
}
