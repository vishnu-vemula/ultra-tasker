export type Role = 'ADMIN' | 'MEMBER'
export type ContactStatus = 'LEAD' | 'QUALIFIED' | 'CUSTOMER' | 'CHURNED'
export type ContactSource = 'REFERRAL' | 'WEBSITE' | 'CAMPAIGN' | 'COLD_OUTREACH' | 'EVENT' | 'OTHER'
export type DealStage = 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
export type DealSource = 'INBOUND' | 'OUTBOUND' | 'REFERRAL' | 'PARTNER' | 'EVENT' | 'OTHER'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type ActivityType = 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING'
export type NotificationType = 'TASK_OVERDUE' | 'DEAL_WON'
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STAGE_CHANGE'
export type AuditEntityType = 'CONTACT' | 'COMPANY' | 'DEAL' | 'TASK' | 'ACTIVITY' | 'TAG' | 'PRODUCT'

export interface User {
  id: string
  email: string
  displayName: string | null
  photoURL: string | null
  role: Role
  createdAt: string
  updatedAt: string
}

export interface Company {
  id: string
  name: string
  domain: string | null
  industry: string | null
  phone: string | null
  city: string | null
  country: string | null
  employeeCount: number | null
  annualRevenue: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  position: string | null
  status: ContactStatus
  website: string | null
  city: string | null
  country: string | null
  source: ContactSource | null
  notes: string | null
  lastActivityAt: string | null
  companyId: string | null
  company: Company | null
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  sku: string | null
  price: number
  currency: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface DealItem {
  id: string
  dealId: string
  productId: string | null
  product: Product | null
  description: string
  quantity: number
  unitPrice: number
  createdAt: string
  updatedAt: string
}

export interface Deal {
  id: string
  title: string
  value: number
  currency: string
  stage: DealStage
  position: number
  probability: number
  source: DealSource | null
  nextStep: string | null
  lostReason: string | null
  contactId: string | null
  contact: Contact | null
  companyId: string | null
  company: Company | null
  expectedCloseDate: string | null
  closedAt: string | null
  notes: string | null
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  status: TaskStatus
  priority: TaskPriority | null
  contactId: string | null
  contact: { id: string; name: string } | null
  dealId: string | null
  deal: { id: string; title: string } | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  type: ActivityType
  title: string
  body: string | null
  occurredAt: string
  durationMin: number | null
  contactId: string | null
  contact: { id: string; name: string } | null
  dealId: string | null
  deal: { id: string; title: string } | null
  companyId: string | null
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string | null
  readAt: string | null
  createdAt: string
}

export interface AuditEntry {
  id: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  summary: string
  createdAt: string
}

export interface ContactDetail extends Contact {
  deals: Deal[]
  tasks: Task[]
  activities: Activity[]
}

export interface DealDetail extends Deal {
  items: DealItem[]
  activities: Activity[]
}

export interface CompanyDetail extends Company {
  contacts: Contact[]
  deals: Deal[]
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface DashboardStats {
  contacts: {
    total: number
    byStatus: Record<ContactStatus, number>
  }
  deals: {
    total: number
    byStage: Record<DealStage, number>
    pipelineValue: number
    wonValue: number
    avgDealSize: number
  }
  revenueByMonth: { month: string; total: number }[]
  topCompanies: { companyId: string | null; name: string; pipelineValue: number; dealCount: number }[]
  tasks: {
    total: number
    open: number
    overdue: number
  }
}

export interface SearchResults {
  contacts: { id: string; name: string; email: string | null }[]
  companies: { id: string; name: string; domain: string | null }[]
  deals: { id: string; title: string; stage: DealStage; value: number; currency: string }[]
}

export interface ReorderUpdate {
  id: string
  stage: DealStage
  position: number
}

export const DEAL_STAGES: DealStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
export const CONTACT_STATUSES: ContactStatus[] = ['LEAD', 'QUALIFIED', 'CUSTOMER', 'CHURNED']
export const CONTACT_SOURCES: ContactSource[] = ['REFERRAL', 'WEBSITE', 'CAMPAIGN', 'COLD_OUTREACH', 'EVENT', 'OTHER']
export const DEAL_SOURCES: DealSource[] = ['INBOUND', 'OUTBOUND', 'REFERRAL', 'PARTNER', 'EVENT', 'OTHER']
export const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']
export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
export const ACTIVITY_TYPES: ActivityType[] = ['NOTE', 'CALL', 'EMAIL', 'MEETING']
export const CURRENCIES: string[] = ['USD', 'EUR', 'GBP', 'INR']
export const TAG_COLORS: string[] = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b']
