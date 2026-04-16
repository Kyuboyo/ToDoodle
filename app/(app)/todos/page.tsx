import { Suspense } from 'react'
import { db } from '@/db'
import { tasks, taskTags, tags as tagsTable, attachments } from '@/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import { TaskCard } from '@/components/task-card'
import { CreateTaskDialog } from '@/components/create-task-dialog'
import { TasksFilter } from './tasks-filter'

async function getTasks(tagFilter: string[], statusFilter: string) {
  let taskRows = await db.select().from(tasks).orderBy(desc(tasks.createdAt))

  if (statusFilter) taskRows = taskRows.filter((t) => t.status === statusFilter)
  if (taskRows.length === 0) return []

  const taskIds = taskRows.map((t) => t.id)
  const [taskTagRows, attachmentRows] = await Promise.all([
    db
      .select({ taskId: taskTags.taskId, tag: tagsTable })
      .from(taskTags)
      .innerJoin(tagsTable, eq(taskTags.tagId, tagsTable.id))
      .where(inArray(taskTags.taskId, taskIds)),
    db.select().from(attachments).where(inArray(attachments.taskId, taskIds)),
  ])

  let result = taskRows.map((task) => ({
    ...task,
    tags: taskTagRows.filter((r) => r.taskId === task.id).map((r) => r.tag),
    attachments: attachmentRows.filter((a) => a.taskId === task.id),
  }))

  if (tagFilter.length > 0) {
    result = result.filter((t) =>
      tagFilter.every((tf) => t.tags.some((tag) => tag.id === tf))
    )
  }

  return result
}

interface PageProps {
  searchParams: Promise<{ tag?: string | string[]; status?: string }>
}

export default async function TodosPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const tagFilter = sp.tag ? (Array.isArray(sp.tag) ? sp.tag : [sp.tag]) : []
  const statusFilter = sp.status ?? ''

  const [taskList, allTags] = await Promise.all([
    getTasks(tagFilter, statusFilter),
    db.select().from(tagsTable),
  ])

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {taskList.length} task{taskList.length !== 1 ? 's' : ''}
            </p>
          </div>
          <CreateTaskDialog tags={allTags}>
            <button className="btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New task
            </button>
          </CreateTaskDialog>
        </div>

        {/* Filters */}
        <TasksFilter allTags={allTags} activeTagIds={tagFilter} activeStatus={statusFilter} />

        {/* Grid */}
        {taskList.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No tasks yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first task to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskList.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
