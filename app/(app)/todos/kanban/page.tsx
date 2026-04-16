import { db } from '@/db'
import { tasks, taskTags, tags as tagsTable, attachments } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { KanbanBoardClient } from '@/components/kanban-board-client'
import { CreateTaskDialog } from '@/components/create-task-dialog'

async function getKanbanTasks() {
  const taskRows = await db.select().from(tasks)
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

  return taskRows.map((task) => ({
    ...task,
    tags: taskTagRows.filter((r) => r.taskId === task.id).map((r) => r.tag),
    attachments: attachmentRows.filter((a) => a.taskId === task.id),
  }))
}

export default async function KanbanPage() {
  const [taskList, allTags] = await Promise.all([
    getKanbanTasks(),
    db.select().from(tagsTable),
  ])

  return (
    <div className="p-8 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kanban</h1>
          <p className="text-sm text-gray-400 mt-0.5">Drag cards to update status</p>
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

      <KanbanBoardClient initialTasks={taskList} />
    </div>
  )
}
