import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'wc26_remember_email'

export default function Auth({ initialMode, onRecoveryComplete }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode] = useState(initialMode || 'login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setMode('reset')
          setMessage('')
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY, email)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } else if (mode === 'register') {
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.')
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage('Cuenta creada. Revisa tu email para confirmar.')
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://wc-26-livid.vercel.app/',
        })
        if (error) throw error
        setMessage('Enlace enviado. Revisa tu email.')
      } else if (mode === 'reset') {
        if (newPassword !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden.')
        }
        if (newPassword.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.')
        }
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        })
        if (error) throw error
        setMessage('Contraseña actualizada correctamente.')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(async () => {
          await supabase.auth.signOut()
          if (onRecoveryComplete) onRecoveryComplete()
          setMode('login')
          setMessage('')
        }, 2000)
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'register':
        return 'Crear cuenta'
      case 'forgot':
        return 'Recuperar contraseña'
      case 'reset':
        return 'Nueva contraseña'
      default:
        return 'Iniciar sesión'
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-circle c1"></div>
        <div className="auth-circle c2"></div>
        <div className="auth-circle c3"></div>
      </div>
      
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/icon.png" alt="FWC 2026" className="auth-logo-img" />
          <h1>Álbum FWC Panini 2026</h1>
          <p className="auth-subtitle">FIFA World Cup · USA · Canadá · México</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          {(mode === 'login' || mode === 'register') && (
            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="input-group">
                <label htmlFor="newPassword">Nueva contraseña</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          
          {mode === 'login' && (
            <label className="remember-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkmark"></span>
              <span className="remember-text">Recordarme</span>
            </label>
          )}

          {mode === 'login' && (
            <button
              type="button"
              className="link forgot-link"
              onClick={() => {
                setMode('forgot')
                setMessage('')
              }}
            >
              ¿Has olvidado la contraseña?
            </button>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="btn-loading">
                <span className="spinner-small"></span>
                Cargando...
              </span>
            ) : (
              getTitle()
            )}
          </button>
        </form>

        {message && (
          <div className={`auth-message ${message.includes('error') || message.includes('Error') || message.includes('inválido') || message.includes('no coinciden') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="auth-toggle">
          {mode === 'login' ? (
            <>
              <span className="toggle-text">¿No tienes cuenta?</span>
              <button
                className="link"
                onClick={() => {
                  setMode('register')
                  setMessage('')
                }}
              >
                Regístrate aquí
              </button>
            </>
          ) : mode === 'register' ? (
            <>
              <span className="toggle-text">¿Ya tienes cuenta?</span>
              <button
                className="link"
                onClick={() => {
                  setMode('login')
                  setMessage('')
                }}
              >
                Inicia sesión
              </button>
            </>
          ) : (
            <>
              <span className="toggle-text">¿Recuerdas tu contraseña?</span>
              <button
                className="link"
                onClick={() => {
                  setMode('login')
                  setMessage('')
                }}
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
