import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
config({ path: '.env.local' })

const password = process.argv[2]

if (!password) {
  console.error('Usage: npm run hash-password -- "yourpassword"')
  process.exit(1)
}

bcrypt.hash(password, 12).then((hash) => console.log(hash))
