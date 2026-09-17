export type Role = 'ADMIN' | 'MEMBER'
export type ContactStatus = 'LEAD' | 'QUALIFIED' | 'CUSTOMER' | 'CHURNED'
export type DealStage = 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

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
  companyId: string | null
  company: Company | null
  notes: string | null
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
  contactId: string | null
  contact: Contact | null
  companyId: string | null
  company: Company | null
  expectedCloseDate: string | null
  closedAt: string | null
  notes: string | null
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
  contact: Contact | null
  dealId: string | null
  deal: Deal | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
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
  }
  tasks: {
    total: number
    open: number
    overdue: number
  }
}

export interface ReorderUpdate {
  id: string
  stage: DealStage
  position: number
}

export const DEAL_STAGES: DealStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
export const CONTACT_STATUSES: ContactStatus[] = ['LEAD', 'QUALIFIED', 'CUSTOMER', 'CHURNED']
export const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']
export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
export const CURRENCIES: string[] = ['USD', 'EUR', 'GBP', 'INR']
