import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { flowNodes } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { nodeId } = await params
  const body = await request.json()
  const schema = z.object({ x: z.number(), y: z.number() })
  const data = schema.parse(body)

  const [updated] = await db
    .update(flowNodes)
    .set(data)
    .where(eq(flowNodes.id, nodeId))
    .returning()

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { nodeId } = await params
  await db.delete(flowNodes).where(eq(flowNodes.id, nodeId))
  return NextResponse.json({ ok: true })
}
