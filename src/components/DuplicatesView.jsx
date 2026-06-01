import { useState, useMemo } from 'react'
import { stickers, groupList } from '../data/stickers'
import FlagImage from './FlagImage'
import CustomDropdown from './CustomDropdown'

export default function DuplicatesView({
  duplicateMap,
  onChangeQuantity,
  readOnly = false,
  title = 'Mis repetidos',
  hideEmpty = false,
}) {
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('all')

  const filteredStickers = useMemo(() => {
    return stickers.filter((s) => {
      const matchesGroup =
        selectedGroup === 'all' || s.groupCode === selectedGroup
      const matchesSearch =
        search === '' ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.groupName.toLowerCase().includes(search.toLowerCase())
      const qty = duplicateMap.get(s.code) || 0
      if (hideEmpty && qty === 0) return false
      return matchesGroup && matchesSearch
    })
  }, [duplicateMap, search, selectedGroup, hideEmpty])

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

  const totalDuplicates = useMemo(() => {
    let sum = 0
    duplicateMap.forEach((q) => {
      sum += q
    })
    return sum
  }, [duplicateMap])

  return (
    <>
      <section className="progress-section">
        <div className="progress-info">
          <span className="progress-title">{title}</span>
          <span className="progress-numbers">
            <strong>{totalDuplicates}</strong> repetidos
          </span>
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
        </div>
      </section>

      <section className="sticker-sections">
        {groupedStickers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>No hay repetidos con esos filtros.</p>
            <button
              className="btn-reset"
              onClick={() => {
                setSearch('')
                setSelectedGroup('all')
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {groupedStickers.map(({ group, stickers: groupStickers }) => {
          const groupQty = groupStickers.reduce(
            (sum, s) => sum + (duplicateMap.get(s.code) || 0),
            0
          )

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
                  <span className="group-count">{groupQty}</span>
                </div>
              </div>
              <div className="sticker-grid">
                {groupStickers.map((sticker) => {
                  const qty = duplicateMap.get(sticker.code) || 0
                  return (
                    <div
                      key={sticker.code}
                      className={`sticker-card duplicate-card ${qty > 0 ? 'has-duplicates' : ''}`}
                    >
                      <span className="sticker-code">{sticker.code}</span>
                      {qty > 0 && (
                        <span className="duplicate-qty-badge">{qty}</span>
                      )}
                      {!readOnly ? (
                        <div className="duplicate-controls">
                          <button
                            className="btn-dup"
                            onClick={() =>
                              onChangeQuantity(sticker.code, -1)
                            }
                            disabled={qty === 0}
                            aria-label={`Restar repetido de ${sticker.code}`}
                          >
                            −
                          </button>
                          <span className="dup-count">{qty}</span>
                          <button
                            className="btn-dup"
                            onClick={() =>
                              onChangeQuantity(sticker.code, 1)
                            }
                            aria-label={`Añadir repetido de ${sticker.code}`}
                          >
                            +
                          </button>
                        </div>
                      ) : qty > 0 ? (
                        <div className="duplicate-controls readonly">
                          <span className="dup-count">{qty}</span>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    </>
  )
}
