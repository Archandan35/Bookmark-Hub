import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Lock, User, ArrowRight, Phone, AtSign, Eye, EyeOff, Check, X } from 'lucide-react'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Card } from '../components/Card'
import { AuthService } from '../services/AuthService'
import { useAuthStore } from '../hooks/useStore'
import { secureLog } from '../utils/security'
import { useToast } from '../components/Toast'
import { cn } from '../utils/helpers'

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v) => v?.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v || '') },
  { id: 'lowercase', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v || '') },
  { id: 'number', label: 'One number', test: (v) => /\d/.test(v || '') },
  { id: 'special', label: 'One special symbol (!@#$%^&*)', test: (v) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v || '') },
]

export function Auth() {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { setUser, setSession } = useAuthStore()

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm()
  const { addToast } = useToast()
  const password = watch('password', '')

  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_RULES.filter((r) => r.test(password)).length
    return { passed, total: PASSWORD_RULES.length, percent: (passed / PASSWORD_RULES.length) * 100 }
  }, [password])

  const strengthLabel = () => {
    if (passwordStrength.passed <= 2) return 'Weak'
    if (passwordStrength.passed <= 3) return 'Fair'
    if (passwordStrength.passed <= 4) return 'Good'
    return 'Strong'
  }

  const strengthColor = () => {
    if (passwordStrength.passed <= 2) return 'var(--color-danger)'
    if (passwordStrength.passed <= 3) return 'var(--color-warning)'
    if (passwordStrength.passed <= 4) return 'var(--color-info)'
    return 'var(--color-success)'
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    try {
      let result
      if (mode === 'login') {
        result = await AuthService.signIn(data.identifier, data.password)
        if (result?.data) {
          setUser(result.data.user)
          setSession(result.data.session)
          addToast('Welcome back!', 'success')
        }
      } else {
        result = await AuthService.signUp(data.email, data.password, data.name, data.username, data.mobile)
        if (result?.data) {
          addToast('Account created! You can now sign in.', 'success')
          setMode('login')
          reset()
        }
      }
    } catch (err) {
      secureLog('error', 'Authentication failed', { error: err.message })
      const msg = err.message || 'Authentication failed.'
      if (msg.includes('Email confirm') || msg.includes('confirm')) {
        setError('Please confirm your email before signing in.')
      } else if (msg.includes('Invalid login') || msg.includes('Invalid credentials')) {
        setError('Invalid email/username or password.')
      } else if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('An account with this email already exists.')
      } else if (msg.includes('Password should be at least')) {
        setError('Password does not meet requirements.')
      } else if (msg.includes('Supabase credentials not configured')) {
        setError('Demo mode: Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      } else {
        setError(msg.length > 100 ? 'Authentication failed. Please try again.' : msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    reset()
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
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
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
                      maxLength: { value: 20, message: 'Maximum 20 characters' },
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
                  label="Email, Username or Phone"
                  icon={Mail}
                  placeholder="Enter email, username or phone"
                  error={errors.identifier?.message}
                  {...register('identifier', {
                    required: 'This field is required',
                  })}
                />
              )}

              <div className="password-field">
                <Input
                  label="Password"
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                  })}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mode === 'register' && password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div
                      className="password-strength-fill"
                      style={{ '--strength-width': `${passwordStrength.percent}%`, '--strength-color': strengthColor() }}
                    />
                  </div>
                  <span className="password-strength-label" style={{ color: strengthColor() }}>
                    {strengthLabel()}
                  </span>
                </div>
              )}

              {mode === 'register' && (
                <>
                  <div className="password-rules">
                    {PASSWORD_RULES.map((rule) => (
                      <div key={rule.id} className={cn('password-rule', rule.test(password) && 'passed')}>
                        {rule.test(password) ? <Check size={12} /> : <X size={12} />}
                        <span>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="password-field">
                    <Input
                      label="Confirm Password"
                      icon={Lock}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      error={errors.confirmPassword?.message}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) => value === password || 'Passwords do not match',
                      })}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </>
              )}

              <Button variant="primary" size="lg" className="auth-submit" disabled={loading}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                {!loading && <ArrowRight size={18} />}
              </Button>
            </form>

            <div className="auth-switch">
              {mode === 'login' ? (
                <p>Don't have an account? <button onClick={switchMode}>Sign up</button></p>
              ) : (
                <p>Already have an account? <button onClick={switchMode}>Sign in</button></p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
