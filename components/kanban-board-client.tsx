'use client'

import dynamic from 'next/dynamic'
import type { Tag, Attachment } from '@/types'

const KanbanBoard = dynamic(
  () => import('@/components/kanban-board').then((m) => m.KanbanBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-2xl bg-gray-50 animate-pulse"
            style={{ minWidth: 260, width: 260, height: 300 }}
          />
        ))}
      </div>
    ),
  }
)

interface KanbanTask {
  id: string
  title: string
  body: string | null
  status: string
  createdAt: Date
  tags: Tag[]
  attachments: Attachment[]
}

export function KanbanBoardClient({ initialTasks }: { initialTasks: KanbanTask[] }) {
  return <KanbanBoard initialTasks={initialTasks} />
}
