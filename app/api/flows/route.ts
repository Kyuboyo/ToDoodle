import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { flows, flowNodes } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allFlows = await db.select().from(flows).orderBy(desc(flows.createdAt))

  // Attach node counts
  const counts = await db
    .select({ flowId: flowNodes.flowId })
    .from(flowNodes)

  const result = allFlows.map((f) => ({
    ...f,
    taskCount: counts.filter((c) => c.flowId === f.id).length,
  }))

  return NextResponse.json(result)
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = createSchema.parse(body)
    const [flow] = await db
      .insert(flows)
      .values({ ...data, userId: session.userId })
      .returning()
    return NextResponse.json(flow, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
