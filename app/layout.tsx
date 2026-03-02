import { AuthProvider } from '@/contexts/AuthContext'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRM System',
  description: 'LeadConnector-like CRM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}