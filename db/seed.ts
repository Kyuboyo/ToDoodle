/**
 * User seeding script — run with:
 *   npm run seed -- --email admin@company.com --password secret123
 *   npm run seed -- --email admin@company.com --password secret123 --name "Alice"
 *   npm run seed -- --list
 *   npm run seed -- --delete admin@company.com
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'

// Load .env.local manually (tsx doesn't load Next.js env)
import { config } from 'dotenv'
config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--')

  if (args.includes('--list')) {
    const users = await db.select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      createdAt: schema.users.createdAt,
    }).from(schema.users)
    console.table(users)
    return
  }

  if (args.includes('--delete')) {
    const email = args[args.indexOf('--delete') + 1]
    if (!email) { console.error('Provide email after --delete'); process.exit(1) }
    await db.delete(schema.users).where(eq(schema.users.email, email))
    console.log(`Deleted user: ${email}`)
    return
  }

  const emailIdx = args.indexOf('--email')
  const passwordIdx = args.indexOf('--password')
  const nameIdx = args.indexOf('--name')

  if (emailIdx === -1 || passwordIdx === -1) {
    console.error('Usage: npm run seed -- --email <email> --password <password> [--name <name>]')
    process.exit(1)
  }

  const email = args[emailIdx + 1]
  const password = args[passwordIdx + 1]
  const name = nameIdx !== -1 ? args[nameIdx + 1] : null

  if (!email || !password) {
    console.error('Email and password are required')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  if (existing.length > 0) {
    // Update password
    await db
      .update(schema.users)
      .set({ passwordHash, ...(name ? { name } : {}) })
      .where(eq(schema.users.email, email))
    console.log(`Updated user: ${email}`)
  } else {
    const [user] = await db
      .insert(schema.users)
      .values({ email, passwordHash, name })
      .returning({ id: schema.users.id, email: schema.users.email })
    console.log(`Created user: ${user.email} (${user.id})`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
