import { db } from '@/db'
import { flows, flowNodes } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { CreateFlowDialog } from './create-flow-dialog'

async function getFlows() {
  const allFlows = await db.select().from(flows).orderBy(desc(flows.createdAt))
  const counts = await db.select({ flowId: flowNodes.flowId }).from(flowNodes)
  return allFlows.map((f) => ({
    ...f,
    taskCount: counts.filter((c) => c.flowId === f.id).length,
  }))
}

export default async function FlowListPage() {
  const allFlows = await getFlows()

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Flows</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Visualise task relationships as flowcharts
            </p>
          </div>
          <CreateFlowDialog>
            <button className="btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New flow
            </button>
          </CreateFlowDialog>
        </div>

        {allFlows.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" />
                <path d="M7 12h10M17 7l-3 3M17 17l-3-3" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No flows yet</p>
            <p className="text-sm text-gray-400 mt-1">Create a flow to start mapping task relationships</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allFlows.map((flow) => (
              <Link key={flow.id} href={`/flow/${flow.id}`}>
                <div className="card p-5 hover:shadow-md transition-all cursor-pointer group h-full flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                        <circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" />
                        <path d="M7 12h10M17 7l-3 3M17 17l-3-3" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-400 mt-1">
                      {flow.taskCount} task{flow.taskCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <h3 className="font-medium text-gray-900 group-hover:text-gray-700 mb-1">
                    {flow.name}
                  </h3>

                  {flow.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3 flex-1">
                      {flow.description}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-auto pt-2">
                    {formatDistanceToNow(new Date(flow.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
