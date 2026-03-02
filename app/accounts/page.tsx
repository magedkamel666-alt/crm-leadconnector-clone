'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type Payment = {
  id: number
  client_id: number
  amount: number
  date: string
  client_name?: string
}

export default function AccountsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [clients, setClients] = useState<{id: number, name: string}[]>([])
  const [newPayment, setNewPayment] = useState({
    client_id: 0,
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  })
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPayments()
      fetchClients()
    }
  }, [user])

  const fetchPayments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        clients(name)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    
    if (!error && data) {
      const paymentsWithNames = data.map(payment => ({
        ...payment,
        client_name: payment.clients?.name || 'عميل غير معروف'
      }))
      
      setPayments(paymentsWithNames)
      
      // حساب إجمالي الإيرادات
      const total = paymentsWithNames.reduce((sum, payment) => sum + payment.amount, 0)
      setTotalRevenue(total)
    }
    setLoading(false)
  }

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id)
    
    if (!error && data) {
      setClients(data)
    }
  }

  const handleAddPayment = async () => {
    if (!newPayment.client_id || newPayment.amount <= 0) return
    
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          ...newPayment,
          user_id: user.id
        }
      ])
      .select()
    
    if (!error && data) {
      const client = clients.find(c => c.id === newPayment.client_id)
      setPayments([{
        ...data[0],
        client_name: client?.name || 'عميل غير معروف'
      }, ...payments])
      
      // تحديث إجمالي الإيرادات
      setTotalRevenue(totalRevenue + newPayment.amount)
      setNewPayment({ 
        client_id: 0, 
        amount: 0, 
        date: new Date().toISOString().split('T')[0] 
      })
    }
  }

  const handleDeletePayment = async (id: number) => {
    const paymentToDelete = payments.find(p => p.id === id)
    if (!paymentToDelete) return
    
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setPayments(payments.filter(payment => payment.id !== id))
      setTotalRevenue(totalRevenue - paymentToDelete.amount)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">الحسابات</h1>
      
      {/* ملخص إجمالي الإيرادات */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-2">إجمالي الإيرادات</h2>
        <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
      </div>
      
      {/* نموذج إضافة دفعة جديدة */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">إضافة دفعة جديدة</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="border p-2 rounded"
            value={newPayment.client_id}
            onChange={(e) => setNewPayment({...newPayment, client_id: parseInt(e.target.value)})}
          >
            <option value={0}>اختر العميل</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="المبلغ"
            className="border p-2 rounded"
            value={newPayment.amount || ''}
            onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value) || 0})}
          />
          <input
            type="date"
            className="border p-2 rounded"
            value={newPayment.date}
            onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
          />
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleAddPayment}
          >
            إضافة دفعة
          </button>
        </div>
      </div>
      
      {/* سجل الدفعات */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">سجل الدفعات</h2>
        {loading ? (
          <p>جارٍ تحميل الدفعات...</p>
        ) : payments.length === 0 ? (
          <p>لا توجد دفعات مسجلة</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{payment.client_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${payment.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{payment.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}