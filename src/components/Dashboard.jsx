import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import StickerGridView from './StickerGridView'
import DuplicatesView from './DuplicatesView'
import FriendsPanel from './FriendsPanel'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [ownedStickers, setOwnedStickers] = useState(new Set())
  const [duplicateStickers, setDuplicateStickers] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)
  const [activeTab, setActiveTab] = useState('collection')
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [friendStickers, setFriendStickers] = useState(new Set())
  const [friendDuplicates, setFriendDuplicates] = useState(new Map())
  const [friendLoading, setFriendLoading] = useState(false)
  const [friendViewTab, setFriendViewTab] = useState('album')
  const [viewMode, setViewMode] = useState('list')
  const [pendingCount, setPendingCount] = useState(0)
  const [toast, setToast] = useState(null)

  // Desktop detection
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    setIsDesktop(mq.matches)
    if (!mq.matches) setViewMode('list')
    const handler = (e) => {
      setIsDesktop(e.matches)
      if (!e.matches) setViewMode('list')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Auth listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        loadStickers(user.id)
        loadPendingCount(user.id)
        loadDuplicates(user.id)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          loadStickers(currentUser.id)
          loadPendingCount(currentUser.id)
          loadDuplicates(currentUser.id)
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  // Refresh pending count on window focus
  useEffect(() => {
    const onFocus = () => {
      if (user?.id) loadPendingCount(user.id)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user])

  // Realtime subscriptions
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('friends-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          setPendingCount((prev) => prev + 1)
          setToast('Nueva solicitud de amistad')
          setTimeout(() => setToast(null), 4000)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          loadPendingCount(user.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadPendingCount(user.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const loadStickers = async (userId) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_stickers')
      .select('sticker_code')
      .eq('user_id', userId)

    if (!error && data) {
      setOwnedStickers(new Set(data.map((d) => d.sticker_code)))
    }
    setLoading(false)
  }

  const loadPendingCount = async (userId) => {
    const { count, error } = await supabase
      .from('friend_requests')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('status', 'pending')

    if (!error) {
      setPendingCount(count ?? 0)
    }
  }

  const loadDuplicates = async (userId) => {
    const { data, error } = await supabase
      .from('user_duplicate_stickers')
      .select('sticker_code, quantity')
      .eq('user_id', userId)

    if (!error && data) {
      const map = new Map()
      data.forEach((d) => map.set(d.sticker_code, d.quantity))
      setDuplicateStickers(map)
    }
  }

  const updateDuplicateQuantity = async (code, delta) => {
    if (!user) return
    const current = duplicateStickers.get(code) || 0
    const next = Math.max(0, current + delta)

    if (next === 0) {
      await supabase
        .from('user_duplicate_stickers')
        .delete()
        .eq('user_id', user.id)
        .eq('sticker_code', code)
    } else {
      await supabase.from('user_duplicate_stickers').upsert(
        { user_id: user.id, sticker_code: code, quantity: next },
        { onConflict: 'user_id, sticker_code' }
      )
    }

    setDuplicateStickers((prev) => {
      const nextMap = new Map(prev)
      if (next === 0) nextMap.delete(code)
      else nextMap.set(code, next)
      return nextMap
    })
  }

  const toggleSticker = async (code) => {
    if (!user) return
    const isOwned = ownedStickers.has(code)

    if (isOwned) {
      await supabase
        .from('user_stickers')
        .delete()
        .eq('user_id', user.id)
        .eq('sticker_code', code)
      setOwnedStickers((prev) => {
        const next = new Set(prev)
        next.delete(code)
        return next
      })
    } else {
      await supabase.from('user_stickers').insert({
        user_id: user.id,
        sticker_code: code,
      })
      setOwnedStickers((prev) => new Set(prev).add(code))
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const handleSelectFriend = async (friend) => {
    setSelectedFriend(friend)
    setFriendViewTab('album')
    setFriendLoading(true)

    const [stickerRes, dupRes] = await Promise.all([
      supabase
        .from('user_stickers')
        .select('sticker_code')
        .eq('user_id', friend.id),
      supabase
        .from('user_duplicate_stickers')
        .select('sticker_code, quantity')
        .eq('user_id', friend.id),
    ])

    if (!stickerRes.error && stickerRes.data) {
      setFriendStickers(new Set(stickerRes.data.map((d) => d.sticker_code)))
    }
    if (!dupRes.error && dupRes.data) {
      const map = new Map()
      dupRes.data.forEach((d) => map.set(d.sticker_code, d.quantity))
      setFriendDuplicates(map)
    }

    setFriendLoading(false)
  }

  const handleBackToMine = () => {
    setSelectedFriend(null)
    setFriendStickers(new Set())
    setFriendDuplicates(new Map())
  }

  const handleRequestsChanged = () => {
    if (user?.id) loadPendingCount(user.id)
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando tu colección...</p>
      </div>
    )
  }

  return (
    <div className={`dashboard ${viewMode === 'album' ? 'album-mode' : ''}`}>
      <header className="dashboard-header">
        <div className="header-brand">
          <img src="/icon.png" alt="FWC 2026" className="header-logo-img" />
          <div>
            <h1>Álbum FWC Panini 2026</h1>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>
        <div className="header-actions">
          {activeTab === 'collection' && isDesktop && (
            <div className="view-toggle">
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="Vista lista"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Lista
              </button>
              <button
                className={viewMode === 'album' ? 'active' : ''}
                onClick={() => setViewMode('album')}
                title="Vista álbum"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Álbum
              </button>
            </div>
          )}
          <button
            onClick={logout}
            className="btn-logout"
            title="Cerrar sesión"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <nav className="main-tabs">
        <button
          className={activeTab === 'collection' ? 'active' : ''}
          onClick={() => {
            setActiveTab('collection')
            setSelectedFriend(null)
          }}
        >
          Mi Álbum
        </button>
        <button
          className={activeTab === 'duplicates' ? 'active' : ''}
          onClick={() => {
            setActiveTab('duplicates')
            setSelectedFriend(null)
          }}
        >
          Repetidos
        </button>
        <button
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          Amigos
          {pendingCount > 0 && (
            <span className="tab-badge">{pendingCount}</span>
          )}
        </button>
      </nav>

      {toast && (
        <div className="toast-notification" onClick={() => setToast(null)}>
          {toast}
        </div>
      )}

      {activeTab === 'collection' && (
        <StickerGridView
          ownedStickers={ownedStickers}
          toggleSticker={toggleSticker}
          viewMode={viewMode}
          title="Progreso del álbum"
          showPdf={true}
        />
      )}

      {activeTab === 'duplicates' && (
        <DuplicatesView
          duplicateMap={duplicateStickers}
          onChangeQuantity={updateDuplicateQuantity}
          title="Mis repetidos"
        />
      )}

      {activeTab === 'friends' && (
        <div className="friends-tab">
          <FriendsPanel
            onSelectFriend={handleSelectFriend}
            selectedFriend={selectedFriend}
            onRequestsChanged={handleRequestsChanged}
          />

          {selectedFriend && (
            <div className="friend-collection">
              <div className="friend-header-bar">
                <button className="btn-back" onClick={handleBackToMine}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Volver
                </button>
                <span className="friend-label">
                  {selectedFriend.email}
                </span>
              </div>

              <div className="friend-view-tabs">
                <button
                  className={friendViewTab === 'album' ? 'active' : ''}
                  onClick={() => setFriendViewTab('album')}
                >
                  Álbum
                </button>
                <button
                  className={friendViewTab === 'duplicates' ? 'active' : ''}
                  onClick={() => setFriendViewTab('duplicates')}
                >
                  Repetidos
                </button>
              </div>

              {friendLoading ? (
                <div className="loading small">
                  <div className="spinner"></div>
                  <p>Cargando colección de tu amigo...</p>
                </div>
              ) : friendViewTab === 'album' ? (
                <StickerGridView
                  ownedStickers={friendStickers}
                  toggleSticker={() => {}}
                  readOnly={true}
                  title={`Álbum de ${selectedFriend.email}`}
                  showPdf={false}
                  initialFilter="missing"
                  lockFilter={true}
                />
              ) : (
                <DuplicatesView
                  duplicateMap={friendDuplicates}
                  title={`Repetidos de ${selectedFriend.email}`}
                  readOnly={true}
                  hideEmpty={true}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
