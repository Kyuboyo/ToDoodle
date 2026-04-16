import { notFound } from 'next/navigation'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import {
  flows, flowNodes, tasks,
  taskTags, tags as tagsTable, taskLinks,
} from '@/db/schema'
import { FlowCanvasClient } from '@/components/flow-canvas-client'
import { FlowHeader } from './flow-header'

async function getFlowData(id: string) {
  const [flow] = await db.select().from(flows).where(eq(flows.id, id)).limit(1)
  if (!flow) return null

  // All tasks with tags (needed for "add tasks" modal and node rendering)
  const allTaskRows = await db.select().from(tasks)
  const allTaskTagRows = allTaskRows.length > 0
    ? await db
        .select({ taskId: taskTags.taskId, tag: tagsTable })
        .from(taskTags)
        .innerJoin(tagsTable, eq(taskTags.tagId, tagsTable.id))
        .where(inArray(taskTags.taskId, allTaskRows.map((t) => t.id)))
    : []

  const allTasksWithTags = allTaskRows.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    tags: allTaskTagRows
      .filter((r) => r.taskId === task.id)
      .map((r) => r.tag),
  }))

  // Nodes in this flow
  const nodes = await db
    .select()
    .from(flowNodes)
    .where(eq(flowNodes.flowId, id))

  if (nodes.length === 0) {
    return { flow, nodes: [], links: [], allTasksWithTags }
  }

  const taskIds = nodes.map((n) => n.taskId)

  // Fetch links in both directions, keep only those where BOTH endpoints
  // are present in this flow (so edges are always fully local)
  const [outLinks, inLinks] = await Promise.all([
    db.select().from(taskLinks).where(inArray(taskLinks.sourceId, taskIds)),
    db.select().from(taskLinks).where(inArray(taskLinks.targetId, taskIds)),
  ])

  const combined = [...outLinks, ...inLinks]
  const seen = new Set<string>()
  const flowLinks = combined.filter((l) => {
    if (seen.has(l.id)) return false
    seen.add(l.id)
    return taskIds.includes(l.sourceId) && taskIds.includes(l.targetId)
  })

  // Build nodes with task detail (already in allTasksWithTags)
  const nodesWithDetail = nodes.map((node) => {
    const task = allTasksWithTags.find((t) => t.id === node.taskId)!
    return {
      nodeId: node.id,
      taskId: node.taskId,
      x: node.x,
      y: node.y,
      title: task.title,
      status: task.status,
      tags: task.tags,
    }
  })

  return { flow, nodes: nodesWithDetail, links: flowLinks, allTasksWithTags }
}

export default async function FlowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getFlowData(id)
  if (!data) notFound()

  const { flow, nodes, links, allTasksWithTags } = data

  return (
    <div className="flex flex-col h-full">
      <FlowHeader flow={flow} taskCount={nodes.length} />
      <div className="flex-1 min-h-0">
        <FlowCanvasClient
          flowId={id}
          initialNodes={nodes}
          initialLinks={links}
          allTasksWithTags={allTasksWithTags}
        />
      </div>
    </div>
  )
}
