import { NextResponse } from 'next/server'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { flows, flowNodes, tasks, taskTags, tags as tagsTable, taskLinks } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [flow] = await db.select().from(flows).where(eq(flows.id, id)).limit(1)
  if (!flow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const nodes = await db.select().from(flowNodes).where(eq(flowNodes.flowId, id))

  if (nodes.length === 0) {
    return NextResponse.json({ flow, nodes: [], links: [], availableTasks: [] })
  }

  const taskIds = nodes.map((n) => n.taskId)

  const [taskRows, taskTagRows, allLinks, allTasks] = await Promise.all([
    db.select().from(tasks).where(inArray(tasks.id, taskIds)),
    db
      .select({ taskId: taskTags.taskId, tag: tagsTable })
      .from(taskTags)
      .innerJoin(tagsTable, eq(taskTags.tagId, tagsTable.id))
      .where(inArray(taskTags.taskId, taskIds)),
    db.select().from(taskLinks).where(inArray(taskLinks.sourceId, taskIds)),
    db.select({ id: tasks.id, title: tasks.title, status: tasks.status }).from(tasks),
  ])

  // Only links where both endpoints are in this flow
  const links = allLinks.filter((l) => taskIds.includes(l.targetId))

  const nodesWithTask = nodes.map((node) => {
    const task = taskRows.find((t) => t.id === node.taskId)!
    return {
      nodeId: node.id,
      taskId: node.taskId,
      x: node.x,
      y: node.y,
      title: task.title,
      status: task.status,
      tags: taskTagRows.filter((r) => r.taskId === node.taskId).map((r) => r.tag),
    }
  })

  const availableTasks = allTasks.filter((t) => !taskIds.includes(t.id))

  return NextResponse.json({ flow, nodes: nodesWithTask, links, availableTasks })
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const data = updateSchema.parse(body)

  const [updated] = await db
    .update(flows)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(flows.id, id))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.delete(flows).where(eq(flows.id, id))
  return NextResponse.json({ ok: true })
}
