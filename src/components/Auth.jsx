import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage('Cuenta creada. Revisa tu email para confirmar.')
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
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
          <span className="auth-emoji">🏆</span>
          <h1>Álbum Panini 2026</h1>
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
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="btn-loading">
                <span className="spinner-small"></span>
                Cargando...
              </span>
            ) : mode === 'login' ? (
              'Iniciar sesión'
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        {message && (
          <div className={`auth-message ${message.includes('error') || message.includes('Error') || message.includes('inválido') ? 'error' : 'success'}`}>
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
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}
