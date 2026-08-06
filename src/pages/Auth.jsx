import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Lock, User, ArrowRight, Phone, AtSign } from 'lucide-react'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Card } from '../components/Card'
import { AuthService } from '../services/AuthService'
import { useAuthStore } from '../hooks/useStore'
import { cn } from '../utils/helpers'

const LOGIN_METHODS = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'username', label: 'Username', icon: AtSign },
  { id: 'mobile', label: 'Mobile', icon: Phone },
]

export function Auth() {
  const [mode, setMode] = useState('login')
  const [loginMethod, setLoginMethod] = useState('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser, setSession } = useAuthStore()

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    try {
      let result
      if (mode === 'login') {
        result = await AuthService.signIn(data.identifier, data.password)
      } else {
        result = await AuthService.signUp(data.email, data.password, data.name, data.username, data.mobile)
      }
      if (result?.data) {
        setUser(result.data.user)
        setSession(result.data.session)
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleMethodChange = (method) => {
    setLoginMethod(method)
    reset()
  }

  const getIdentifierPlaceholder = () => {
    switch (loginMethod) {
      case 'email': return 'Enter your email'
      case 'username': return 'Enter your username'
      case 'mobile': return 'Enter your mobile number'
      default: return 'Enter your email'
    }
  }

  const getIdentifierLabel = () => {
    switch (loginMethod) {
      case 'email': return 'Email'
      case 'username': return 'Username'
      case 'mobile': return 'Mobile Number'
      default: return 'Email'
    }
  }

  const getIdentifierIcon = () => {
    switch (loginMethod) {
      case 'email': return Mail
      case 'username': return AtSign
      case 'mobile': return Phone
      default: return Mail
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-brand">
            <span className="auth-logo">📚</span>
            <h1 className="auth-brand-name">BookmarkHub</h1>
            <p className="auth-brand-tagline">Your Knowledge. Organized.</p>
          </div>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">🔖</span>
              <div>
                <h4>Smart Bookmarks</h4>
                <p>Organize with unlimited collections</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">📊</span>
              <div>
                <h4>Study Tracker</h4>
                <p>Track your learning progress</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">📁</span>
              <div>
                <h4>File Browser</h4>
                <p>Access local folders securely</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">☁️</span>
              <div>
                <h4>Cloud Sync</h4>
                <p>Access from any device</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <Card className="auth-card">
            <h2 className="auth-title">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Sign in to continue to BookmarkHub'
                : 'Start organizing your knowledge today'}
            </p>

            {error && <div className="auth-error">{error}</div>}

            {mode === 'login' && (
              <div className="auth-method-tabs">
                {LOGIN_METHODS.map((method) => (
                  <button
                    key={method.id}
                    className={cn('auth-method-tab', loginMethod === method.id && 'active')}
                    onClick={() => handleMethodChange(method.id)}
                    type="button"
                  >
                    <method.icon size={16} />
                    {method.label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              {mode === 'register' && (
                <>
                  <Input
                    label="Full Name"
                    icon={User}
                    placeholder="Enter your name"
                    error={errors.name?.message}
                    {...register('name', { required: 'Name is required' })}
                  />
                  <Input
                    label="Email"
                    icon={Mail}
                    type="email"
                    placeholder="Enter your email"
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                    })}
                  />
                  <Input
                    label="Username"
                    icon={AtSign}
                    placeholder="Choose a username"
                    error={errors.username?.message}
                    {...register('username', {
                      required: 'Username is required',
                      minLength: { value: 3, message: 'Minimum 3 characters' },
                      pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, underscore' },
                    })}
                  />
                  <Input
                    label="Mobile Number"
                    icon={Phone}
                    type="tel"
                    placeholder="Enter your mobile number"
                    error={errors.mobile?.message}
                    {...register('mobile', {
                      required: 'Mobile number is required',
                      pattern: { value: /^[+]?[\d\s-]{10,15}$/, message: 'Invalid mobile number' },
                    })}
                  />
                </>
              )}

              {mode === 'login' && (
                <Input
                  label={getIdentifierLabel()}
                  icon={getIdentifierIcon()}
                  type={loginMethod === 'email' ? 'email' : 'text'}
                  placeholder={getIdentifierPlaceholder()}
                  error={errors.identifier?.message}
                  {...register('identifier', {
                    required: `${getIdentifierLabel()} is required`,
                    ...(loginMethod === 'email' && {
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                    }),
                    ...(loginMethod === 'mobile' && {
                      pattern: { value: /^[+]?[\d\s-]{10,15}$/, message: 'Invalid mobile number' },
                    }),
                    ...(loginMethod === 'username' && {
                      minLength: { value: 3, message: 'Minimum 3 characters' },
                    }),
                  })}
                />
              )}

              <Input
                label="Password"
                icon={Lock}
                type="password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                })}
              />

              <Button variant="primary" size="lg" className="auth-submit" disabled={loading}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                {!loading && <ArrowRight size={18} />}
              </Button>
            </form>

            <div className="auth-switch">
              {mode === 'login' ? (
                <p>Don't have an account? <button onClick={() => setMode('register')}>Sign up</button></p>
              ) : (
                <p>Already have an account? <button onClick={() => setMode('login')}>Sign in</button></p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
