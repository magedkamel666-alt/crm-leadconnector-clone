'use client'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const navItems = [
  { name: 'لوحة التحكم', href: '/dashboard' },
  { name: 'العملاء المحتملين', href: '/leads' },
  { name: 'العملاء', href: '/clients' },
  { name: 'صندوق الوارد', href: '/inbox' },
  { name: 'التقويم', href: '/calendar' },
  { name: 'الحسابات', href: '/accounts' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (user === null) {
      router.push('/auth/login')
    }
  }, [user, router])

  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-50">
      {/* الشريط الجانبي */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">نظام CRM</h1>
        </div>
        <nav className="mt-5">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block py-2 px-4 ${
                pathname === item.href
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="block w-full text-left py-2 px-4 text-gray-700 hover:bg-gray-100"
          >
            تسجيل الخروج
          </button>
        </nav>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 overflow-auto p-6">
        {children}
      </div>
    </div>
  )
}