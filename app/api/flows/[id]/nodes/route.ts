import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { flowNodes } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const addSchema = z.object({
  taskId: z.string().uuid(),
  x: z.number().optional(),
  y: z.number().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: flowId } = await params

  try {
    const body = await request.json()

    // Support adding multiple tasks at once
    const items: z.infer<typeof addSchema>[] = Array.isArray(body) ? body : [body]

    const inserted = await db
      .insert(flowNodes)
      .values(
        items.map((item, i) => ({
          flowId,
          taskId: item.taskId,
          x: item.x ?? 120 + i * 220,
          y: item.y ?? 120,
        }))
      )
      .onConflictDoNothing()
      .returning()

    return NextResponse.json(inserted, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
