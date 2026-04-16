# ToDoodle

A full-stack personal task management app built entirely with [Claude Code](https://claude.ai/code) — Anthropic's AI coding assistant.

> This project was scaffolded, designed, and iterated on through natural language conversations with Claude Code, with no manual code writing.

---

## Features

- **Task list** — create, edit, and delete tasks with optional titles, body notes, and completion remarks
- **Kanban board** — drag and drop tasks across status columns (Todo / In Progress / Done)
- **Tags** — add freeform tags to tasks; filter by tag; orphan tags are auto-pruned
- **File attachments** — upload images, videos, audio, and documents per task
- **Flows** — create named flowcharts, add tasks as nodes, and draw directional links between them using a canvas editor (ReactFlow)
- **JWT authentication** — login-only (no self sign-up); users are added via CLI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Neon (serverless PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | JWT via `jose` (httpOnly cookie) |
| Drag & Drop | @dnd-kit |
| Flow canvas | ReactFlow v11 |
| Styling | Tailwind CSS |
| Storage | Oracle Object Storage (S3-compatible) or local filesystem |
| Runtime | Node.js 20+ |

---

## Local Setup

### Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **A Neon database** — free tier at [neon.tech](https://neon.tech). Copy the connection string from the Neon console.

---

### 1. Clone the repository

```bash
git clone https://github.com/Kyuboyo/ToDoodle.git
cd ToDoodle
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Neon database connection string (required)
DATABASE_URL=postgres://user:password@host/dbname?sslmode=require

# JWT secret — any long random string
JWT_SECRET=your-super-secret-key-change-this

# File storage: "local" stores uploads in ./uploads, "oracle" uses Oracle Object Storage
STORAGE_TYPE=local

# Only needed when STORAGE_TYPE=oracle
# ORACLE_BUCKET_NAME=
# ORACLE_NAMESPACE=
# ORACLE_REGION=
# ORACLE_ACCESS_KEY_ID=
# ORACLE_SECRET_ACCESS_KEY=
# ORACLE_ENDPOINT=
```

### 4. Push the database schema

This creates all tables in your Neon database:

```bash
npm run db:push
```

### 5. Add your first user

ToDoodle has no self-registration. Users are added via the CLI seeder:

```bash
npm run seed -- --email you@example.com --password yourpassword --name "Your Name"
```

Other seed commands:

```bash
# List all users
npm run seed -- --list

# Delete a user by email
npm run seed -- --delete you@example.com

# Hash a password manually (prints bcrypt hash)
npm run hash-password -- yourpassword
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the credentials you seeded.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |
| `npm run seed` | Add / list / delete users |
| `npm run hash-password` | Hash a plain-text password |

---

## Docker (optional)

A `Dockerfile` and `docker-compose.yml` are included. Set the environment variables in `docker-compose.yml` or pass them via a `.env` file, then:

```bash
docker compose up --build
```

---

## Deploying to Oracle Cloud

The app is designed to run on an Oracle Cloud Compute instance behind Nginx.

1. Build the app: `npm run build`
2. Start with PM2: `pm2 start npm --name todoodle -- start`
3. Configure Nginx as a reverse proxy to `localhost:3000`
4. Set `STORAGE_TYPE=oracle` and fill in the Oracle Object Storage credentials in your environment

---

## License

MIT
