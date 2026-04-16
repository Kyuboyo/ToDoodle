import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { attachments } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { deleteFile } from '@/lib/storage'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [attachment] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1)

  if (!attachment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await Promise.all([
    deleteFile(attachment.storageKey),
    db.delete(attachments).where(eq(attachments.id, id)),
  ])

  return NextResponse.json({ ok: true })
}
