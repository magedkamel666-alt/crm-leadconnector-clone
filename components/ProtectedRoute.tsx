'use client'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user === null) {
      router.push('/auth/login')
    }
  }, [user, router])

  if (user === undefined) {
    return <div>Loading...</div>
  }

  return user ? <>{children}</> : null
}