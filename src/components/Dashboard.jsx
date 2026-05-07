import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { stickers, groupList, totalStickers } from '../data/stickers'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [ownedStickers, setOwnedStickers] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('all')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadStickers(user.id)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) loadStickers(currentUser.id)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

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

  const filteredStickers = useMemo(() => {
    return stickers.filter((s) => {
      const matchesGroup =
        selectedGroup === 'all' || s.groupCode === selectedGroup
      const matchesSearch =
        search === '' ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.groupName.toLowerCase().includes(search.toLowerCase())
      const isOwned = ownedStickers.has(s.code)

      if (filter === 'owned') return isOwned && matchesGroup && matchesSearch
      if (filter === 'missing')
        return !isOwned && matchesGroup && matchesSearch
      return matchesGroup && matchesSearch
    })
  }, [ownedStickers, filter, search, selectedGroup])

  const groupedStickers = useMemo(() => {
    const map = new Map()
    filteredStickers.forEach((s) => {
      if (!map.has(s.groupCode)) {
        map.set(s.groupCode, {
          group: s,
          stickers: [],
        })
      }
      map.get(s.groupCode).stickers.push(s)
    })
    return Array.from(map.values())
  }, [filteredStickers])

  const ownedCount = ownedStickers.size
  const missingCount = totalStickers - ownedCount
  const percent = Math.round((ownedCount / totalStickers) * 100)

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando tu colección...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-brand">
          <img src="/icon.png" alt="FWC 2026" className="header-logo-img" />
          <div>
            <h1>Álbum FWC Panini 2026</h1>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>
        <button onClick={logout} className="btn-logout" title="Cerrar sesión">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </header>

      <section className="progress-section">
        <div className="progress-info">
          <span className="progress-title">Progreso del álbum</span>
          <span className="progress-numbers">
            <strong>{ownedCount}</strong> / {totalStickers}
          </span>
        </div>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        <div className="progress-stats">
          <div className="progress-stat">
            <span className="stat-dot owned"></span>
            <span>{ownedCount} conseguidos</span>
          </div>
          <div className="progress-stat">
            <span className="stat-dot missing"></span>
            <span>{missingCount} faltan</span>
          </div>
          <div className="progress-percent">{percent}%</div>
        </div>
      </section>

      <section className="controls">
        <div className="search-wrapper">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar país o cromo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-row">
          <div className="filter-pills">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button
              className={filter === 'owned' ? 'active' : ''}
              onClick={() => setFilter('owned')}
            >
              ✓ Tengo
            </button>
            <button
              className={filter === 'missing' ? 'active' : ''}
              onClick={() => setFilter('missing')}
            >
              ○ Faltan
            </button>
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="group-select"
          >
            <option value="all">🌍 Todos los países</option>
            {groupList.map((g) => (
              <option key={g.code} value={g.code}>
                {g.flag} {g.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="sticker-sections">
        {groupedStickers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No se encontraron cromos con esos filtros.</p>
            <button className="btn-reset" onClick={() => { setFilter('all'); setSearch(''); setSelectedGroup('all'); }}>
              Limpiar filtros
            </button>
          </div>
        )}

        {groupedStickers.map(({ group, stickers: groupStickers }) => {
          const groupOwned = groupStickers.filter((s) => ownedStickers.has(s.code)).length
          const groupTotal = groupStickers.length
          const groupPercent = Math.round((groupOwned / groupTotal) * 100)
          
          return (
            <div key={group.groupCode} className="sticker-group">
              <div className="group-header">
                <div className="group-info">
                  <span className="group-flag">{group.flag}</span>
                  <h2 className="group-name">{group.groupName}</h2>
                </div>
                <div className="group-meta">
                  <div className="group-progress-bar">
                    <div 
                      className="group-progress-fill" 
                      style={{ width: `${groupPercent}%` }}
                    ></div>
                  </div>
                  <span className="group-count">{groupOwned}/{groupTotal}</span>
                </div>
              </div>
              <div className="sticker-grid">
                {groupStickers.map((sticker) => {
                  const owned = ownedStickers.has(sticker.code)
                  return (
                    <button
                      key={sticker.code}
                      className={`sticker-card ${owned ? 'owned' : ''}`}
                      onClick={() => toggleSticker(sticker.code)}
                      title={`${sticker.groupName} - ${sticker.code}`}
                      aria-pressed={owned}
                    >
                      <span className="sticker-code">{sticker.code}</span>
                      {owned && (
                        <div className="sticker-owned-badge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
