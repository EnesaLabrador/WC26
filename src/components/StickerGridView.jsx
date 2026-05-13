import { useState, useMemo } from 'react'
import { stickers, groupList, totalStickers } from '../data/stickers'
import AlbumView from './AlbumView'
import FlagImage from './FlagImage'
import CustomDropdown from './CustomDropdown'
import generateMissingPdf from '../lib/generateMissingPdf'

export default function StickerGridView({
  ownedStickers,
  toggleSticker,
  readOnly = false,
  title = 'Progreso del álbum',
  showPdf = false,
  viewMode: externalViewMode,
  initialFilter = 'all',
  lockFilter = false,
}) {
  const [filter, setFilter] = useState(initialFilter)
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('all')

  const viewMode = externalViewMode ?? 'list'

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
      if (filter === 'missing') return !isOwned && matchesGroup && matchesSearch
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

  return (
    <>
      <section className="progress-section">
        <div className="progress-info">
          <span className="progress-title">{title}</span>
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
          {showPdf && (
            <button
              className="btn-pdf"
              onClick={() => generateMissingPdf(stickers, ownedStickers)}
              title="Exportar faltantes a PDF"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              PDF
            </button>
          )}
        </div>
      </section>

      <section className="controls">
        <div className="search-wrapper">
          <svg
            className="search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
          {viewMode === 'list' ? (
            <>
              {!lockFilter && (
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
              )}

              <CustomDropdown
                value={selectedGroup}
                onChange={setSelectedGroup}
                placeholder="Seleccionar país..."
                options={[
                  {
                    value: 'all',
                    label: 'Todos los países',
                    flagCode: null,
                    logo: null,
                    isGlobal: true,
                  },
                  ...groupList.map((g) => ({
                    value: g.code,
                    label: g.name,
                    flagCode: g.flagCode,
                    logo: g.logo,
                  })),
                ]}
              />
            </>
          ) : (
            <div className="album-country-strip">
              <button
                className={`album-country-chip ${selectedGroup === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedGroup('all')}
              >
                Inicio
              </button>
              {groupList.map((g) => (
                <button
                  key={g.code}
                  className={`album-country-chip ${selectedGroup === g.code ? 'active' : ''}`}
                  onClick={() => setSelectedGroup(g.code)}
                >
                  <FlagImage
                    flagCode={g.flagCode}
                    logo={g.logo}
                    alt={g.name}
                    size={16}
                  />
                  {g.code}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {viewMode === 'list' ? (
        <section className="sticker-sections">
          {groupedStickers.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No se encontraron cromos con esos filtros.</p>
              <button
                className="btn-reset"
                onClick={() => {
                  setFilter('all')
                  setSearch('')
                  setSelectedGroup('all')
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {groupedStickers.map(({ group, stickers: groupStickers }) => {
            const groupOwned = groupStickers.filter((s) =>
              ownedStickers.has(s.code)
            ).length
            const groupTotal = groupStickers.length
            const groupPercent = Math.round((groupOwned / groupTotal) * 100)

            return (
              <div key={group.groupCode} className="sticker-group">
                <div className="group-header">
                  <div className="group-info">
                    <FlagImage
                      flagCode={group.flagCode}
                      logo={group.logo}
                      alt={group.groupName}
                      size={28}
                    />
                    <h2 className="group-name">{group.groupName}</h2>
                  </div>
                  <div className="group-meta">
                    <div className="group-progress-bar">
                      <div
                        className="group-progress-fill"
                        style={{ width: `${groupPercent}%` }}
                      ></div>
                    </div>
                    <span className="group-count">
                      {groupOwned}/{groupTotal}
                    </span>
                  </div>
                </div>
                <div className="sticker-grid">
                  {groupStickers.map((sticker) => {
                    const owned = ownedStickers.has(sticker.code)
                    return (
                      <button
                        key={sticker.code}
                        className={`sticker-card ${owned ? 'owned' : ''}`}
                        onClick={() =>
                          !readOnly && toggleSticker(sticker.code)
                        }
                        title={`${sticker.groupName} - ${sticker.code}`}
                        aria-pressed={owned}
                      >
                        <span className="sticker-code">{sticker.code}</span>
                        {owned && (
                          <div className="sticker-owned-badge">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
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
      ) : (
        <AlbumView
          stickers={stickers}
          ownedStickers={ownedStickers}
          toggleSticker={readOnly ? () => {} : toggleSticker}
          selectedGroup={selectedGroup}
        />
      )}
    </>
  )
}
