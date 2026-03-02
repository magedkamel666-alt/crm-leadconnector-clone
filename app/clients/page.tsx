'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type Client = {
  id: number
  name: string
  phone: string
  notes: string
  created_at: string
}

export default function ClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    notes: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user])

  const fetchClients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setClients(data)
    }
    setLoading(false)
  }

  const handleAddClient = async () => {
    if (!newClient.name.trim()) return
    
    const { data, error } = await supabase
      .from('clients')
      .insert([
        {
          ...newClient,
          user_id: user.id
        }
      ])
      .select()
    
    if (!error && data) {
      setClients([data[0], ...clients])
      setNewClient({ name: '', phone: '', notes: '' })
    }
  }

  const handleDeleteClient = async (id: number) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setClients(clients.filter(client => client.id !== id))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">العملاء</h1>
      
      {/* نموذج إضافة عميل جديد */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">إضافة عميل جديد</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="الاسم"
            className="border p-2 rounded"
            value={newClient.name}
            onChange={(e) => setNewClient({...newClient, name: e.target.value})}
          />
          <input
            type="text"
            placeholder="رقم الهاتف"
            className="border p-2 rounded"
            value={newClient.phone}
            onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
          />
          <input
            type="text"
            placeholder="ملاحظات"
            className="border p-2 rounded"
            value={newClient.notes}
            onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
          />
        </div>
        <button 
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={handleAddClient}
        >
          إضافة عميل
        </button>
      </div>
      
      {/* قائمة العملاء */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">قائمة العملاء</h2>
        {loading ? (
          <p>جارٍ تحميل العملاء...</p>
        ) : clients.length === 0 ? (
          <p>لا توجد عملاء</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الهاتف</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ملاحظات</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{client.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{client.notes}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteClient(client.id)}
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