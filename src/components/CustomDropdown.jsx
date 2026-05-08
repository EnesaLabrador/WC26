import { useState, useRef, useEffect } from 'react'
import FlagImage from './FlagImage'

function GlobeIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

export default function CustomDropdown({ options, value, onChange, placeholder = 'Seleccionar...' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="custom-dropdown" ref={ref}>
      <button
        className="custom-dropdown-trigger"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {selected ? (
          <span className="custom-dropdown-selected">
            {selected.isGlobal ? (
              <GlobeIcon size={18} />
            ) : (
              <FlagImage
                flagCode={selected.flagCode}
                logo={selected.logo}
                alt={selected.label}
                size={18}
              />
            )}
            <span>{selected.label}</span>
          </span>
        ) : (
          <span className="custom-dropdown-placeholder">{placeholder}</span>
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={open ? 'open' : ''}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="custom-dropdown-menu">
          {options.map((option) => (
            <button
              key={option.value}
              className={`custom-dropdown-item ${option.value === value ? 'active' : ''}`}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              type="button"
            >
              {option.isGlobal ? (
                <GlobeIcon size={18} />
              ) : (
                <FlagImage
                  flagCode={option.flagCode}
                  logo={option.logo}
                  alt={option.label}
                  size={18}
                />
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
