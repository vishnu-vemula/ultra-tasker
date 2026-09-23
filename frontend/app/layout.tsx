import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import 'react-toastify/dist/ReactToastify.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Ultra Tasker',
  description: 'Production-grade CRM for contacts, companies, deals, tasks and more.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
