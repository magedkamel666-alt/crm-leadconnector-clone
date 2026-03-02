'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type Meeting = {
  id: number
  client_id: number
  date: string
  time: string
  client_name?: string
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [clients, setClients] = useState<{id: number, name: string}[]>([])
  const [newMeeting, setNewMeeting] = useState({
    client_id: 0,
    date: '',
    time: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMeetings()
      fetchClients()
    }
  }, [user])

  const fetchMeetings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        clients(name)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: true })
    
    if (!error && data) {
      setMeetings(data.map(meeting => ({
        ...meeting,
        client_name: meeting.clients?.name || 'عميل غير معروف'
      })))
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

  const handleAddMeeting = async () => {
    if (!newMeeting.client_id || !newMeeting.date || !newMeeting.time) return
    
    const { data, error } = await supabase
      .from('meetings')
      .insert([
        {
          ...newMeeting,
          user_id: user.id
        }
      ])
      .select()
    
    if (!error && data) {
      const client = clients.find(c => c.id === newMeeting.client_id)
      setMeetings([...meetings, {
        ...data[0],
        client_name: client?.name || 'عميل غير معروف'
      }])
      setNewMeeting({ client_id: 0, date: '', time: '' })
    }
  }

  const handleDeleteMeeting = async (id: number) => {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setMeetings(meetings.filter(meeting => meeting.id !== id))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">التقويم</h1>
      
      {/* نموذج جدولة اجتماع جديد */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">جدولة اجتماع جديد</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="border p-2 rounded"
            value={newMeeting.client_id}
            onChange={(e) => setNewMeeting({...newMeeting, client_id: parseInt(e.target.value)})}
          >
            <option value={0}>اختر العميل</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <input
            type="date"
            className="border p-2 rounded"
            value={newMeeting.date}
            onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
          />
          <input
            type="time"
            className="border p-2 rounded"
            value={newMeeting.time}
            onChange={(e) => setNewMeeting({...newMeeting, time: e.target.value})}
          />
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleAddMeeting}
          >
            إضافة اجتماع
          </button>
        </div>
      </div>
      
      {/* قائمة الاجتماعات المجدولة */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">الاجتماعات المجدولة</h2>
        {loading ? (
          <p>جارٍ تحميل الاجتماعات...</p>
        ) : meetings.length === 0 ? (
          <p>لا توجد اجتماعات مجدولة</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الوقت</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {meetings.map((meeting) => (
                  <tr key={meeting.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{meeting.client_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{meeting.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{meeting.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteMeeting(meeting.id)}
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