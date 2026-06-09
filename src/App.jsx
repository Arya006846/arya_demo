import { useEffect, useState } from 'react'
import './App.css'
import { auth, googleProvider } from './firebase'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'

const App = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        setStatus('google-success')
      }
    })

    return unsubscribe
  }, [])

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const newErrors = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required.'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (!password) {
      newErrors.password = 'Password is required.'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.'
    }

    setErrors(newErrors)
    setStatus('')

    if (Object.keys(newErrors).length > 0) {
      return
    }

    setLoading(true)
    setStatus('')

    try {
      await new Promise((resolve) => setTimeout(resolve, 1300))
      // Set mock user for demo
      setUser({
        email: email,
        displayName: email.split('@')[0],
        uid: 'demo-user-' + Date.now()
      })
      setStatus('success')
      setEmail('')
      setPassword('')
    } catch (error) {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setStatus('')
    setErrors({})
    setLoading(true)

    // Check if Firebase is configured
    const isFirebaseConfigured = 
      import.meta.env.VITE_FIREBASE_PROJECT_ID && 
      import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'your-project-id' &&
      import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key'

    if (!isFirebaseConfigured) {
      setLoading(false)
      setStatus('firebase-not-configured')
      return
    }

    try {
      const result = await signInWithPopup(auth, googleProvider)
      setStatus('google-success')
    } catch (error) {
      console.error('Google sign-in failed:', error)

      // Map common Firebase auth errors to user-friendly statuses
      const code = error?.code || ''
      if (code.includes('invalid-api-key') || code.includes('auth/invalid-api-key')) {
        setStatus('firebase-invalid-api-key')
      } else if (code.includes('unauthorized-domain') || code.includes('auth/unauthorized-domain')) {
        setStatus('firebase-unauthorized-domain')
      } else if (code.includes('popup-blocked') || code.includes('auth/popup-blocked')) {
        setStatus('google-popup-blocked')
      } else if (code.includes('popup-closed-by-user') || code.includes('auth/popup-closed-by-user')) {
        setStatus('google-popup-closed')
      } else {
        setStatus('google-error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut(auth)
      setUser(null)
      setStatus('')
    } catch (error) {
      console.error('Sign-out failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="login-card">
        {user ? (
          <>
            <h1>Welcome!</h1>
            <p>You are signed in to your account</p>

            <div className="signed-in-message">
              <span>👤</span>
              <strong>{user.displayName || user.email}</strong>
            </div>

            {user.email && (
              <div className="user-info">
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user.email}</span>
                </div>
              </div>
            )}

            <button className="social-button secondary" type="button" onClick={handleSignOut} disabled={loading}>
              {loading ? (
                <span className="inline-loader">
                  <span className="loader" />
                  Signing out...
                </span>
              ) : (
                'Sign out'
              )}
            </button>
          </>
        ) : (
          <>
            <h1>Sign in to your account</h1>
            <p>Use your Google account or sign in manually with your email and password.</p>

            <div className="social-buttons">
              <button
                className="social-button"
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading && status === '' ? (
                  <span className="inline-loader">
                    <span className="loader" />
                    Signing in with Google...
                  </span>
                ) : (
                  'Continue with Google'
                )}
              </button>
            </div>

            <div className="divider">OR</div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="field-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="message error-text">{errors.email}</p>}
              </div>

              <div className="field-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
                {errors.password && <p className="message error-text">{errors.password}</p>}
              </div>

              <div className="hint-row">
                <div />
                <a href="#forgot" onClick={(event) => event.preventDefault()}>
                  Forgot password?
                </a>
              </div>

              <button className="submit-button" type="submit" disabled={loading}>
                {loading && status === '' ? (
                  <span className="inline-loader">
                    <span className="loader" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in with Email'
                )}
              </button>

              {status === 'success' && <p className="message success-text">Login successful! Redirecting...</p>}
              {status === 'error' && <p className="message error-text">Login failed. Please try again.</p>}
              {status === 'google-success' && <p className="message success-text">Google login completed successfully.</p>}
              {status === 'google-error' && <p className="message error-text">Google login could not be completed.</p>}
              {status === 'firebase-not-configured' && (
                <p className="message error-text">
                  Firebase is not configured. Please add your Firebase credentials to <code>.env.local</code> or use the email/password login to test the app.
                </p>
              )}

              {status === 'firebase-invalid-api-key' && (
                <p className="message error-text">
                  Firebase API key is invalid. Verify `VITE_FIREBASE_API_KEY` in your environment files and restart the dev server.
                </p>
              )}

              {status === 'firebase-unauthorized-domain' && (
                <p className="message error-text">
                  This domain is not authorized for your Firebase project. Add <code>localhost</code> and <code>127.0.0.1</code> to the Authorized domains in the Firebase console.
                </p>
              )}

              {status === 'google-popup-blocked' && (
                <p className="message error-text">
                  Popup blocked by the browser. Allow popups for this site or try the email/password login.
                </p>
              )}

              {status === 'google-popup-closed' && (
                <p className="message error-text">
                  Google sign-in was cancelled. Please try again.
                </p>
              )}

              {status === 'google-error' && (
                <p className="message error-text">Google login could not be completed.</p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default App