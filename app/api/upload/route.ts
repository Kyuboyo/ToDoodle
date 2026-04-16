import { NextResponse } from 'next/server'
import { db } from '@/db'
import { attachments } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { uploadFile, generateStorageKey } from '@/lib/storage'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const taskId = formData.get('taskId') as string | null

    if (!file || !taskId) {
      return NextResponse.json({ error: 'Missing file or taskId' }, { status: 400 })
    }

    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 413 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const storageKey = generateStorageKey(taskId, file.name)
    const url = await uploadFile(storageKey, buffer, file.type)

    const [attachment] = await db
      .insert(attachments)
      .values({
        taskId,
        url,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        storageKey,
      })
      .returning()

    return NextResponse.json(attachment, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
