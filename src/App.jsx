import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import './index.css'

function App() {
  const [session, setSession] = useState(null)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setRecoveryMode(true)
        }
        setSession(session)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  if (recoveryMode) {
    return (
      <div className="app">
        <Auth
          initialMode="reset"
          onRecoveryComplete={() => setRecoveryMode(false)}
        />
      </div>
    )
  }

  return (
    <div className="app">
      {session ? <Dashboard /> : <Auth />}
    </div>
  )
}

export default App
