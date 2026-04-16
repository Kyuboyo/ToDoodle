import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { cn, getStatusConfig } from '@/lib/utils'
import { TagBadge } from './tag-badge'
import type { Tag, Attachment } from '@/types'

interface TaskCardProps {
  task: {
    id: string
    title: string
    body: string | null
    status: string
    createdAt: Date
    tags: Tag[]
    attachments: Attachment[]
  }
  className?: string
  dragging?: boolean
}

export function TaskCard({ task, className, dragging }: TaskCardProps) {
  const statusConfig = getStatusConfig(task.status)

  return (
    <Link href={`/todos/${task.id}`}>
      <div
        className={cn(
          'card p-4 hover:shadow-md transition-all cursor-pointer group',
          dragging && 'shadow-lg rotate-1 opacity-95',
          className
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <h3 className="text-sm font-medium text-gray-900 leading-snug group-hover:text-gray-700 line-clamp-2">
            {task.title}
          </h3>
          <span
            className={cn(
              'flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              statusConfig.bg,
              statusConfig.text
            )}
          >
            {statusConfig.label}
          </span>
        </div>

        {task.body && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-2.5 leading-relaxed">
            {task.body}
          </p>
        )}

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {task.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{task.tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
          {task.attachments.length > 0 && (
            <span className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
              {task.attachments.length}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
