import { NextResponse } from 'next/server'
import { eq, inArray, desc } from 'drizzle-orm'
import { db } from '@/db'
import { tasks, taskTags, tags as tagsTable, attachments } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { pruneOrphanTags } from '@/lib/utils'
import { z } from 'zod'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tagFilter = searchParams.getAll('tag')
  const statusFilter = searchParams.get('status')

  let taskRows = await db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.createdAt))

  if (statusFilter) {
    taskRows = taskRows.filter((t) => t.status === statusFilter)
  }

  if (taskRows.length === 0) return NextResponse.json([])

  const taskIds = taskRows.map((t) => t.id)

  const [taskTagRows, attachmentRows] = await Promise.all([
    db
      .select({ taskId: taskTags.taskId, tag: tagsTable })
      .from(taskTags)
      .innerJoin(tagsTable, eq(taskTags.tagId, tagsTable.id))
      .where(inArray(taskTags.taskId, taskIds)),
    db
      .select()
      .from(attachments)
      .where(inArray(attachments.taskId, taskIds)),
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

  return NextResponse.json(result)
}

const createSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  status: z.string().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    const [task] = await db
      .insert(tasks)
      .values({
        title: data.title,
        body: data.body,
        status: data.status ?? 'backlog',
        userId: session.userId,
      })
      .returning()

    if (data.tagIds && data.tagIds.length > 0) {
      await db.insert(taskTags).values(
        data.tagIds.map((tagId) => ({ taskId: task.id, tagId }))
      )
    }

    await pruneOrphanTags()
    return NextResponse.json(task, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
