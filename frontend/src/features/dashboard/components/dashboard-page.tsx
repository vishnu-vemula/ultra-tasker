import { Link } from 'react-router-dom'
import { BarChart3, ClipboardList, Trophy, Users, Wallet } from 'lucide-react'
import { useStats } from '../hooks/use-stats'
import { useDeals } from '../../deals/hooks/use-deals'
import { PageHeader } from '../../../shared/components/page-header'
import { SkeletonCard } from '../../../shared/components/skeleton'
import { formatCurrency, formatDate, formatMonthLabel, titleCase } from '../../../shared/lib/format'
import { DEAL_STAGES } from '../../../shared/types'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon: typeof Users
}

function StatCard({ label, value, sub, icon: Icon }: StatCardProps) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
        <Icon className="h-5 w-5 text-indigo-600" />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {sub ? <p className="text-xs text-slate-400">{sub}</p> : null}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { data: stats, isLoading } = useStats()
  const { data: recentDeals } = useDeals({ sort: 'recent', pageSize: 5 })

  if (isLoading || !stats) {
    return (
      <div>
        <PageHeader title="Dashboard" description="A snapshot of your CRM" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    )
  }

  const maxStageCount = Math.max(1, ...DEAL_STAGES.map((stage) => stats.deals.byStage[stage] ?? 0))
  const revenue = stats.revenueByMonth.slice(-6)
  const maxRevenue = Math.max(1, ...revenue.map((entry) => entry.total))

  return (
    <div>
      <PageHeader title="Dashboard" description="A snapshot of your CRM" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Contacts"
          value={String(stats.contacts.total)}
          sub={`${stats.contacts.byStatus.LEAD ?? 0} leads`}
          icon={Users}
        />
        <StatCard label="Pipeline value" value={formatCurrency(stats.deals.pipelineValue, 'USD')} icon={Wallet} />
        <StatCard label="Won value" value={formatCurrency(stats.deals.wonValue, 'USD')} icon={Trophy} />
        <StatCard label="Avg deal size" value={formatCurrency(stats.deals.avgDealSize, 'USD')} icon={BarChart3} />
        <StatCard
          label="Open tasks"
          value={String(stats.tasks.open)}
          sub={`${stats.tasks.overdue} overdue`}
          icon={ClipboardList}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Revenue (last 6 months)</h2>
          {revenue.length === 0 ? (
            <p className="text-sm text-slate-500">No won revenue recorded yet.</p>
          ) : (
            <div>
              <div className="flex h-40 items-end gap-3">
                {revenue.map((entry) => (
                  <div
                    key={entry.month}
                    className="flex-1 rounded-t bg-emerald-500 transition-colors hover:bg-emerald-400"
                    style={{ height: `${Math.max(2, Math.round((entry.total / maxRevenue) * 100))}%` }}
                    title={formatCurrency(entry.total, 'USD')}
                  />
                ))}
              </div>
              <div className="mt-2 flex gap-3">
                {revenue.map((entry) => (
                  <div key={entry.month} className="min-w-0 flex-1 text-center">
                    <p className="truncate text-xs font-medium text-slate-700">{formatCurrency(entry.total, 'USD')}</p>
                    <p className="text-xs text-slate-400">{formatMonthLabel(entry.month)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Deals by stage</h2>
          <div className="space-y-3">
            {DEAL_STAGES.map((stage) => {
              const count = stats.deals.byStage[stage] ?? 0
              return (
                <div key={stage}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{titleCase(stage)}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{ width: `${Math.round((count / maxStageCount) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Top companies by pipeline</h2>
          {stats.topCompanies.length === 0 ? (
            <p className="text-sm text-slate-500">No pipeline data yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.topCompanies.map((company) => (
                <li key={company.companyId ?? company.name} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    {company.companyId ? (
                      <Link
                        to={`/companies/${company.companyId}`}
                        className="truncate text-sm font-medium text-slate-900 hover:text-indigo-600"
                      >
                        {company.name}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium text-slate-900">{company.name}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {company.dealCount} deal{company.dealCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-indigo-600">
                    {formatCurrency(company.pipelineValue, 'USD')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Recent deals</h2>
          {(recentDeals?.items ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No deals yet. Create your first deal on the Deals board.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(recentDeals?.items ?? []).map((deal) => (
                <li key={deal.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{deal.title}</p>
                    <p className="text-xs text-slate-500">
                      {titleCase(deal.stage)} · created {formatDate(deal.createdAt)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-indigo-600">
                    {formatCurrency(deal.value, deal.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
