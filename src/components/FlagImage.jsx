export default function FlagImage({ flagCode, logo, alt, size = 20, className = '' }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={alt || ''}
        className={`flag-image ${className}`}
        width={size}
        height={size}
        loading="lazy"
        style={{ display: 'inline-block', objectFit: 'contain' }}
      />
    )
  }

  if (!flagCode) {
    return (
      <span
        className={`flag-fallback ${className}`}
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.65,
          fontWeight: 700,
        }}
        title={alt}
      >
        {alt?.[0] || ''}
      </span>
    )
  }
  return (
    <img
      src={`/flags/${flagCode}.svg`}
      alt={alt || flagCode}
      className={`flag-image ${className}`}
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
      style={{ display: 'inline-block', objectFit: 'cover', borderRadius: 2 }}
    />
  )
}
