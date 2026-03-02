'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalClients: 0,
    totalBookings: 0,
  })

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    // جلب إجمالي الإيرادات
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .eq('user_id', user.id)

    if (!paymentsError && payments) {
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)
      
      // جلب إجمالي العملاء
      const { count: totalClients, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // جلب إجمالي الحجوزات
      const { count: totalBookings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setStats({
        totalRevenue,
        totalClients: totalClients || 0,
        totalBookings: totalBookings || 0,
      })
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">إجمالي الإيرادات</h3>
          <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">عدد العملاء</h3>
          <p className="text-3xl font-bold">{stats.totalClients}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">إجمالي الحجوزات</h3>
          <p className="text-3xl font-bold">{stats.totalBookings}</p>
        </div>
      </div>
    </div>
  )
}