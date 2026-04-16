import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { taskLinks } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const schema = z.object({
    linkType: z.enum(['relates_to', 'blocks', 'depends_on']),
  })

  const data = schema.parse(body)
  const [updated] = await db
    .update(taskLinks)
    .set(data)
    .where(eq(taskLinks.id, id))
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
  await db.delete(taskLinks).where(eq(taskLinks.id, id))
  return NextResponse.json({ ok: true })
}
