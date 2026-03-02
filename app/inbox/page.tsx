'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type Client = {
  id: number
  name: string
}

type Message = {
  id: number
  client_id: number
  text: string
  label: 'Interested' | 'Order' | 'Need Call' | null
  created_at: string
}

export default function InboxPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedClient, setSelectedClient] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchClients()
    }
  }, [user])

  useEffect(() => {
    if (selectedClient) {
      fetchMessages(selectedClient)
    }
  }, [selectedClient])

  const fetchClients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id)
    
    if (!error && data) {
      setClients(data)
      if (data.length > 0) {
        setSelectedClient(data[0].id)
      }
    }
    setLoading(false)
  }

  const fetchMessages = async (clientId: number) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setMessages(data)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedClient) return
    
    // منطق التصنيف التلقائي
    let label: Message['label'] = null
    if (/(حجز|book)/i.test(newMessage)) {
      label = 'Need Call'
    } else if (/(سعر|price)/i.test(newMessage)) {
      label = 'Interested'
    } else if (/(اشتري|buy)/i.test(newMessage)) {
      label = 'Order'
    }
    
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          client_id: selectedClient,
          text: newMessage,
          label,
          user_id: user.id
        }
      ])
      .select()
    
    if (!error && data) {
      setMessages([data[0], ...messages])
      setNewMessage('')
    }
  }

  return (
    <div className="flex h-full">
      {/* الشريط الجانبي للعملاء */}
      <div className="w-1/4 border-r">
        <h2 className="text-lg font-medium p-4 border-b">العملاء</h2>
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {loading ? (
            <p className="p-4">جارٍ تحميل العملاء...</p>
          ) : clients.length === 0 ? (
            <p className="p-4">لا توجد عملاء</p>
          ) : (
            clients.map((client) => (
              <div
                key={client.id}
                className={`p-4 border-b cursor-pointer ${
                  selectedClient === client.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedClient(client.id)}
              >
                {client.name}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* منطقة الرسائل */}
      <div className="flex-1 flex flex-col">
        {selectedClient ? (
          <>
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">
                {clients.find(c => c.id === selectedClient)?.name}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`mb-4 p-3 rounded-lg max-w-xs ${
                    message.label === 'Need Call' ? 'bg-yellow-100' :
                    message.label === 'Interested' ? 'bg-green-100' :
                    message.label === 'Order' ? 'bg-blue-100' :
                    'bg-white'
                  }`}
                >
                  <p>{message.text}</p>
                  {message.label && (
                    <span className="text-xs mt-1 block text-gray-500">
                      تصنيف: {message.label}
                    </span>
                  )}
                  <span className="text-xs mt-1 block text-gray-500">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t bg-white">
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 border p-2 rounded-l"
                  placeholder="اكتب رسالة..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage()
                  }}
                />
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                  onClick={handleSendMessage}
                >
                  إرسال
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>اختر عميلاً لبدء مراسلة</p>
          </div>
        )}
      </div>
    </div>
  )
}