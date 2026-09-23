import Link from 'next/link'
import { BarChart3, ClipboardList, Trophy, Users, Wallet } from 'lucide-react'
import { useStats } from '../hooks/use-stats'
import { useDeals } from '../../deals/hooks/use-deals'
import { PageHeader } from '../../../shared/components/page-header'
import { SkeletonCard } from '../../../shared/components/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/components/ui/table'
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </span>
      </CardHeader>
      <CardContent className="p-5 pt-1">
        <p className="text-2xl font-semibold leading-none text-foreground">{value}</p>
        {sub ? <CardDescription className="mt-1.5 text-xs">{sub}</CardDescription> : null}
      </CardContent>
    </Card>
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
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Revenue (last 6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No won revenue recorded yet.</p>
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
                      <p className="truncate text-xs font-medium text-foreground/80">{formatCurrency(entry.total, 'USD')}</p>
                      <p className="text-xs text-muted-foreground/70">{formatMonthLabel(entry.month)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Deals by stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DEAL_STAGES.map((stage) => {
                const count = stats.deals.byStage[stage] ?? 0
                return (
                  <div key={stage}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground/80">{titleCase(stage)}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round((count / maxStageCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>Top companies by pipeline</CardTitle>
          </CardHeader>
          {stats.topCompanies.length === 0 ? (
            <CardContent>
              <p className="text-sm text-muted-foreground">No pipeline data yet.</p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Company</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topCompanies.map((company) => (
                  <TableRow key={company.companyId ?? company.name}>
                    <TableCell>
                      {company.companyId ? (
                        <Link
                          href={`/companies/${company.companyId}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {company.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">{company.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {company.dealCount} deal{company.dealCount === 1 ? '' : 's'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(company.pipelineValue, 'USD')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>Recent deals</CardTitle>
          </CardHeader>
          {(recentDeals?.items ?? []).length === 0 ? (
            <CardContent>
              <p className="text-sm text-muted-foreground">No deals yet. Create your first deal on the Deals board.</p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Deal</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentDeals?.items ?? []).map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">created {formatDate(deal.createdAt)}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{titleCase(deal.stage)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(deal.value, deal.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
