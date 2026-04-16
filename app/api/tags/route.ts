import { NextResponse } from 'next/server'
import { db } from '@/db'
import { tags } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const all = await db.select().from(tags)
  return NextResponse.json(all)
}

const createSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    const [tag] = await db.insert(tags).values(data).returning()
    return NextResponse.json(tag, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Tag may already exist' }, { status: 409 })
  }
}
