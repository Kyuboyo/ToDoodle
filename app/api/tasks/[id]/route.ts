import { NextResponse } from 'next/server'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { tasks, taskTags, tags as tagsTable, attachments, taskLinks } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { pruneOrphanTags } from '@/lib/utils'
import { z } from 'zod'

async function getTaskWithRelations(id: string) {
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  if (!task) return null

  const [taskTagRows, attachmentRows, outLinks, inLinks] = await Promise.all([
    db
      .select({ taskId: taskTags.taskId, tag: tagsTable })
      .from(taskTags)
      .innerJoin(tagsTable, eq(taskTags.tagId, tagsTable.id))
      .where(eq(taskTags.taskId, id)),
    db.select().from(attachments).where(eq(attachments.taskId, id)),
    db.select().from(taskLinks).where(eq(taskLinks.sourceId, id)),
    db.select().from(taskLinks).where(eq(taskLinks.targetId, id)),
  ])

  // Fetch linked task titles
  const linkedIds = [
    ...outLinks.map((l) => l.targetId),
    ...inLinks.map((l) => l.sourceId),
  ]
  const linkedTasks = linkedIds.length > 0
    ? await db.select({ id: tasks.id, title: tasks.title, status: tasks.status })
        .from(tasks).where(inArray(tasks.id, linkedIds))
    : []

  return {
    ...task,
    tags: taskTagRows.map((r) => r.tag),
    attachments: attachmentRows,
    outgoingLinks: outLinks.map((l) => ({
      ...l,
      target: linkedTasks.find((t) => t.id === l.targetId),
    })),
    incomingLinks: inLinks.map((l) => ({
      ...l,
      source: linkedTasks.find((t) => t.id === l.sourceId),
    })),
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const task = await getTaskWithRelations(id)
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(task)
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().nullable().optional(),
  status: z.string().optional(),
  remarks: z.string().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await request.json()
    const data = updateSchema.parse(body)

    const { tagIds, ...taskData } = data

    const updatePayload: Partial<typeof taskData & { updatedAt: Date }> = {
      ...taskData,
      updatedAt: new Date(),
    }

    await db.update(tasks).set(updatePayload).where(eq(tasks.id, id))

    if (tagIds !== undefined) {
      await db.delete(taskTags).where(eq(taskTags.taskId, id))
      if (tagIds.length > 0) {
        await db.insert(taskTags).values(
          tagIds.map((tagId) => ({ taskId: id, tagId }))
        )
      }
      await pruneOrphanTags()
    }

    const updated = await getTaskWithRelations(id)
    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.delete(tasks).where(eq(tasks.id, id))
  await pruneOrphanTags()
  return NextResponse.json({ ok: true })
}
