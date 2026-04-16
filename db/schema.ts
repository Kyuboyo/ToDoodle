import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  real,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#e0f2fe'),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  body: text('body'),
  status: text('status').notNull().default('backlog'),
  remarks: text('remarks'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  userId: uuid('user_id').references(() => users.id),
})

export const taskTags = pgTable(
  'task_tags',
  {
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.taskId, t.tagId] }),
  })
)

export const taskLinks = pgTable('task_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  targetId: uuid('target_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  linkType: text('link_type').notNull().default('relates_to'),
})

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  storageKey: text('storage_key').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Flows ──────────────────────────────────────────────────────────────────
export const flows = pgTable('flows', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  userId: uuid('user_id').references(() => users.id),
})

// One row per task that is present in a flow, stores canvas position
export const flowNodes = pgTable(
  'flow_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    flowId: uuid('flow_id')
      .notNull()
      .references(() => flows.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    x: real('x').notNull().default(100),
    y: real('y').notNull().default(100),
  },
  (t) => ({
    flowTaskUniq: uniqueIndex('flow_nodes_flow_task_uniq').on(t.flowId, t.taskId),
  })
)

// ── Relations ──────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  flows: many(flows),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  taskTags: many(taskTags),
  attachments: many(attachments),
  outgoingLinks: many(taskLinks, { relationName: 'source' }),
  incomingLinks: many(taskLinks, { relationName: 'target' }),
  flowNodes: many(flowNodes),
}))

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, { fields: [taskTags.taskId], references: [tasks.id] }),
  tag: one(tags, { fields: [taskTags.tagId], references: [tags.id] }),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  taskTags: many(taskTags),
}))

export const taskLinksRelations = relations(taskLinks, ({ one }) => ({
  source: one(tasks, {
    fields: [taskLinks.sourceId],
    references: [tasks.id],
    relationName: 'source',
  }),
  target: one(tasks, {
    fields: [taskLinks.targetId],
    references: [tasks.id],
    relationName: 'target',
  }),
}))

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  task: one(tasks, { fields: [attachments.taskId], references: [tasks.id] }),
}))

export const flowsRelations = relations(flows, ({ one, many }) => ({
  user: one(users, { fields: [flows.userId], references: [users.id] }),
  flowNodes: many(flowNodes),
}))

export const flowNodesRelations = relations(flowNodes, ({ one }) => ({
  flow: one(flows, { fields: [flowNodes.flowId], references: [flows.id] }),
  task: one(tasks, { fields: [flowNodes.taskId], references: [tasks.id] }),
}))
