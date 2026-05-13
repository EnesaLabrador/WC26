import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './FriendsPanel.css'

export default function FriendsPanel({ onSelectFriend, selectedFriend, onRequestsChanged }) {
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFriends()
    loadPendingRequests()
  }, [])

  const loadFriends = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return

    const { data, error } = await supabase
      .from('friendships')
      .select('friend_id, profiles!friend_id(id, email)')
      .eq('user_id', userId)

    if (!error && data) {
      setFriends(
        data.map((f) => ({
          id: f.profiles.id,
          email: f.profiles.email,
        }))
      )
    }
  }

  const loadPendingRequests = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return

    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, sender_id, profiles!sender_id(id, email)')
      .eq('receiver_id', userId)
      .eq('status', 'pending')

    if (!error && data) {
      setPendingRequests(
        data.map((r) => ({
          id: r.id,
          senderId: r.profiles.id,
          email: r.profiles.email,
        }))
      )
    }
  }

  const sendRequest = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.rpc('send_friend_request', {
        friend_email: email.trim().toLowerCase(),
      })

      if (error) throw error

      setMessage(data.message)
      if (data.success) {
        setEmail('')
        if (data.message.includes('aceptada')) {
          loadFriends()
        }
        onRequestsChanged?.()
      }
    } catch (err) {
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  const acceptRequest = async (requestId) => {
    try {
      await supabase.rpc('accept_friend_request', { request_id: requestId })
      loadPendingRequests()
      loadFriends()
      onRequestsChanged?.()
    } catch (err) {
      setMessage(err.message)
    }
  }

  const rejectRequest = async (requestId) => {
    try {
      await supabase.rpc('reject_friend_request', { request_id: requestId })
      loadPendingRequests()
      onRequestsChanged?.()
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <div className="friends-panel">
      <h2 className="panel-title">Amigos</h2>

      <form onSubmit={sendRequest} className="add-friend-form">
        <input
          type="email"
          placeholder="Email de tu amigo..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Añadir'}
        </button>
      </form>

      {message && <p className="friend-message">{message}</p>}

      {pendingRequests.length > 0 && (
        <div className="requests-section">
          <h3>Solicitudes pendientes</h3>
          <ul className="requests-list">
            {pendingRequests.map((req) => (
              <li key={req.id}>
                <span>{req.email}</span>
                <div className="request-actions">
                  <button
                    className="btn-accept"
                    onClick={() => acceptRequest(req.id)}
                  >
                    Aceptar
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => rejectRequest(req.id)}
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="friends-list-section">
        <h3>Mis amigos</h3>
        {friends.length === 0 ? (
          <p className="empty-friends">No tienes amigos aún.</p>
        ) : (
          <ul className="friends-list">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className={selectedFriend?.id === friend.id ? 'active' : ''}
              >
                <button onClick={() => onSelectFriend(friend)}>
                  {friend.email}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
