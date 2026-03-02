'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type Lead = {
  id: number
  name: string
  phone: string
  status: 'new' | 'contacted' | 'closed'
}

export default function LeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    status: 'new' as 'new' | 'contacted' | 'closed'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchLeads()
    }
  }, [user])

  const fetchLeads = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
    
    if (!error && data) {
      setLeads(data)
    }
    setLoading(false)
  }

  const handleAddLead = async () => {
    if (!newLead.name.trim()) return
    
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          ...newLead,
          user_id: user.id
        }
      ])
      .select()
    
    if (!error && data) {
      setLeads([data[0], ...leads])
      setNewLead({ name: '', phone: '', status: 'new' })
    }
  }

  const handleStatusChange = async (id: number, status: Lead['status']) => {
    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id)
    
    if (!error) {
      setLeads(leads.map(lead => 
        lead.id === id ? {...lead, status} : lead
      ))
    }
  }

  const convertToClient = async (lead: Lead) => {
    // إضافة إلى جدول العملاء
    const { error } = await supabase
      .from('clients')
      .insert([
        {
          name: lead.name,
          phone: lead.phone,
          notes: `تم التحويل من عميل محتمل`,
          user_id: user.id
        }
      ])
    
    if (!error) {
      // إزالة من العملاء المحتملين
      await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id)
      
      setLeads(leads.filter(l => l.id !== lead.id))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">العملاء المحتملون</h1>
      
      {/* نموذج إضافة عميل محتمل جديد */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">إضافة عميل محتمل جديد</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="الاسم"
            className="border p-2 rounded"
            value={newLead.name}
            onChange={(e) => setNewLead({...newLead, name: e.target.value})}
          />
          <input
            type="text"
            placeholder="رقم الهاتف"
            className="border p-2 rounded"
            value={newLead.phone}
            onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
          />
          <select
            className="border p-2 rounded"
            value={newLead.status}
            onChange={(e) => setNewLead({...newLead, status: e.target.value as any})}
          >
            <option value="new">جديد</option>
            <option value="contacted">تم الاتصال</option>
            <option value="closed">مغلق</option>
          </select>
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleAddLead}
          >
            إضافة عميل محتمل
          </button>
        </div>
      </div>
      
      {/* قائمة العملاء المحتملين */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">قائمة العملاء المحتملين</h2>
        {loading ? (
          <p>جارٍ تحميل العملاء المحتملين...</p>
        ) : leads.length === 0 ? (
          <p>لا توجد عملاء محتملين</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الهاتف</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{lead.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{lead.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className="border p-1 rounded"
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                      >
                        <option value="new">جديد</option>
                        <option value="contacted">تم الاتصال</option>
                        <option value="closed">مغلق</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => convertToClient(lead)}
                        className="text-green-600 hover:text-green-900"
                      >
                        تحويل إلى عميل
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