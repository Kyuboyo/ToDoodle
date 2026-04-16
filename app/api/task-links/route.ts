import { NextResponse } from 'next/server'
import { eq, or } from 'drizzle-orm'
import { db } from '@/db'
import { taskLinks, tasks } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const links = await db.select().from(taskLinks)
  return NextResponse.json(links)
}

const createSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  linkType: z.enum(['relates_to', 'blocks', 'depends_on']).default('relates_to'),
})

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    if (data.sourceId === data.targetId) {
      return NextResponse.json({ error: 'Cannot link a task to itself' }, { status: 400 })
    }

    const [link] = await db.insert(taskLinks).values(data).returning()
    return NextResponse.json(link, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
