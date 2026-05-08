import { useState, useRef, useEffect, useMemo, forwardRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import FlagImage from './FlagImage'

const AlbumPage = forwardRef(function AlbumPage(
  { page, ownedStickers, toggleSticker },
  ref
) {
  if (!page || page.length === 0) {
    return (
      <div className="album-sheet" ref={ref}>
        <div className="album-sheet-inner album-sheet-empty">
          <span className="album-sheet-number"></span>
        </div>
      </div>
    )
  }

  const group = page[0]
  const groupOwned = page.filter((s) => ownedStickers.has(s.code)).length
  const groupTotal = page.length

  return (
    <div className="album-sheet" ref={ref}>
      <div className="album-sheet-inner">
        <div className="album-sheet-header">
          <div className="album-sheet-title">
            <FlagImage flagCode={group.flagCode} logo={group.logo} alt={group.groupName} size={18} />
            <h3>{group.groupName}</h3>
          </div>
          <span className="album-sheet-count">
            {groupOwned}/{groupTotal}
          </span>
        </div>
        <div className="album-sheet-slots">
          {page.map((sticker) => {
            const owned = ownedStickers.has(sticker.code)
            return (
              <button
                key={sticker.code}
                className={`album-sheet-slot ${owned ? 'owned' : ''}`}
                onClick={() => toggleSticker(sticker.code)}
                aria-pressed={owned}
              >
                <span className="album-sheet-code">{sticker.code}</span>
                {owned && (
                  <div className="album-sheet-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <span className="album-sheet-number">{group.groupName}</span>
      </div>
    </div>
  )
})

export default function AlbumView({ stickers, ownedStickers, toggleSticker, selectedGroup }) {
  const bookRef = useRef(null)
  const stageRef = useRef(null)
  const [dims, setDims] = useState({ pageW: 300, pageH: 420 })

  const pages = useMemo(() => {
    const map = new Map()
    stickers.forEach((s) => {
      if (!map.has(s.groupCode)) {
        map.set(s.groupCode, [])
      }
      map.get(s.groupCode).push(s)
    })
    return Array.from(map.values())
  }, [stickers])

  const pageIndexByGroup = useMemo(() => {
    const map = new Map()
    pages.forEach((page, idx) => {
      if (page && page.length > 0) {
        map.set(page[0].groupCode, idx)
      }
    })
    return map
  }, [pages])

  useEffect(() => {
    if (selectedGroup && selectedGroup !== 'all' && bookRef.current) {
      const pageIndex = pageIndexByGroup.get(selectedGroup)
      if (pageIndex !== undefined) {
        bookRef.current.pageFlip().turnToPage(pageIndex)
      }
    }
  }, [selectedGroup, pageIndexByGroup])

  useEffect(() => {
    const measure = () => {
      const el = stageRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const availableW = Math.max(700, rect.width - 110)
      const availableH = Math.max(400, rect.height)

      // Aspect ratio width/height of one page
      const pageAspect = 0.72
      const maxPageH = Math.min(availableH, 830)
      const bookWFromH = maxPageH * pageAspect * 2

      let pageH, pageW
      if (bookWFromH > availableW) {
        const scale = availableW / bookWFromH
        pageH = Math.floor(maxPageH * scale)
        pageW = Math.floor(pageH * pageAspect)
      } else {
        pageH = Math.floor(maxPageH)
        pageW = Math.floor(pageH * pageAspect)
      }

      setDims({ pageW, pageH })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const goPrev = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev()
    }
  }

  const goNext = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext()
    }
  }

  return (
    <div className="album-view">
      <div className="album-stage" ref={stageRef}>
        <button className="album-arrow album-arrow-left" onClick={goPrev} aria-label="Página anterior">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {dims.pageW > 0 && (
          <HTMLFlipBook
            ref={bookRef}
            width={dims.pageW}
            height={dims.pageH}
            size="stretch"
            showCover={false}
            usePortrait={false}
            mobileScrollSupport={false}
            useMouseEvents={true}
            drawShadow={true}
            flippingTime={800}
            startPage={0}
            style={{}}
            className="album-flipbook"
          >
            {pages.map((page, idx) => (
              <AlbumPage
                key={idx}
                page={page}
                ownedStickers={ownedStickers}
                toggleSticker={toggleSticker}
              />
            ))}
          </HTMLFlipBook>
        )}

        <button className="album-arrow album-arrow-right" onClick={goNext} aria-label="Página siguiente">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
