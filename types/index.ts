import type { InferSelectModel } from 'drizzle-orm'
import type {
  users,
  tasks,
  tags,
  taskLinks,
  attachments,
  taskTags,
} from '@/db/schema'

export type User = InferSelectModel<typeof users>
export type Task = InferSelectModel<typeof tasks>
export type Tag = InferSelectModel<typeof tags>
export type TaskLink = InferSelectModel<typeof taskLinks>
export type Attachment = InferSelectModel<typeof attachments>
export type TaskTag = InferSelectModel<typeof taskTags>

export type TaskWithRelations = Task & {
  taskTags: (TaskTag & { tag: Tag })[]
  attachments: Attachment[]
  outgoingLinks: (TaskLink & { target: Task })[]
  incomingLinks: (TaskLink & { source: Task })[]
}

export const STATUSES = [
  { value: 'backlog', label: 'Backlog', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  { value: 'todo', label: 'Todo', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  { value: 'in_progress', label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  { value: 'review', label: 'Review', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  { value: 'done', label: 'Done', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
] as const

export type StatusValue = (typeof STATUSES)[number]['value']

export const LINK_TYPES = [
  { value: 'relates_to', label: 'Relates to' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'depends_on', label: 'Depends on' },
] as const

export const TAG_PALETTE = [
  '#dbeafe', '#dcfce7', '#fef9c3', '#fce7f3', '#ede9fe',
  '#ffedd5', '#cffafe', '#f1f5f9', '#e0f2fe', '#d1fae5',
]
