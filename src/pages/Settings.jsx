import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { User, Palette, Bell, Shield, HardDrive, Globe, Timer } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input, Select } from '../components/Input'
import { useAppStore } from '../hooks/useStore'
import { useBookmarkStore, useAuthStore } from '../hooks/useStore'
import { THEME_MODES } from '../constants'
import { useToast } from '../components/Toast'
import { useSessionStore } from '../hooks/useSessionStore'
import { useDailyGoal } from '../hooks/useDailyGoal'

export function Settings() {
  const { theme, setTheme } = useAppStore()
  const { user } = useAuthStore()
  const { bookmarks } = useBookmarkStore()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [notifications, setNotifications] = useState({
    email: true,
    reminders: true,
    weekly: false,
    features: true,
  })

  const { register: registerProfile, handleSubmit: handleProfileSubmit } = useForm({
    defaultValues: {
      name: user?.user_metadata?.name || '',
      username: user?.user_metadata?.username || '',
    },
  })

  const { register: registerSecurity, handleSubmit: handleSecuritySubmit } = useForm()

  const { targetSeconds, updateTarget } = useDailyGoal(user?.id)
  const minSessionSeconds = useSessionStore((s) => s.minSessionSeconds)
  const setMinSessionSeconds = useSessionStore((s) => s.setMinSessionSeconds)
  const rememberPauseChoice = useSessionStore((s) => s.rememberPauseChoice)
  const setRememberPauseChoice = useSessionStore((s) => s.setRememberPauseChoice)
  const pausePreference = useSessionStore((s) => s.pausePreference)

  const [goalHours, setGoalHours] = useState(() => (targetSeconds / 3600).toString())
  const [minSeconds, setMinSeconds] = useState(() => minSessionSeconds.toString())

  useEffect(() => { setGoalHours((targetSeconds / 3600).toString()) }, [targetSeconds])
  useEffect(() => { setMinSeconds(minSessionSeconds.toString()) }, [minSessionSeconds])

  const onStudySave = async () => {
    const hours = parseFloat(goalHours)
    const seconds = parseInt(minSeconds, 10)
    if (!Number.isFinite(hours) || hours < 0) {
      addToast('Enter a valid daily goal', 'error')
      return
    }
    if (!Number.isFinite(seconds) || seconds < 0) {
      addToast('Enter a valid minimum session length', 'error')
      return
    }
    setMinSessionSeconds(seconds)
    await updateTarget(Math.round(hours * 3600))
    addToast('Study settings saved', 'success')
  }

  const storageStats = useMemo(() => {
    const totalItems = bookmarks.length
    const byType = bookmarks.reduce((acc, b) => {
      const key = b.type || 'other'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    const items = Object.entries(byType)
      .map(([label, count]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        size: `${count} ${count === 1 ? 'item' : 'items'}`,
        percent: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
      }))
      .sort((a, b) => b.percent - a.percent)

    return { totalItems, items }
  }, [bookmarks])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'study', label: 'Study Timer', icon: Timer },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'language', label: 'Language', icon: Globe },
  ]

  const onProfileSave = (data) => {
    addToast('Profile updated successfully', 'success')
  }

  const onSecuritySave = (data) => {
    if (data.newPassword !== data.confirmPassword) {
      addToast('Passwords do not match', 'error')
      return
    }
    addToast('Password updated successfully', 'success')
  }

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your preferences</p>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <Card className="settings-card">
              <h3 className="settings-section-title">Profile Settings</h3>
              <form onSubmit={handleProfileSubmit(onProfileSave)} className="settings-form">
                <Input label="Full Name" placeholder="Enter your name" {...registerProfile('name')} />
                <Input label="Email" type="email" placeholder="Enter your email" value={user?.email || ''} disabled />
                <Input label="Username" placeholder="Username" {...registerProfile('username')} />
                <Button variant="primary" type="submit">Save Changes</Button>
              </form>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="settings-card">
              <h3 className="settings-section-title">Appearance</h3>
              <div className="settings-section">
                <p className="settings-label">Theme</p>
                <div className="theme-options">
                  {Object.values(THEME_MODES).map((t) => (
                    <button
                      key={t}
                      className={`theme-option ${theme === t ? 'active' : ''}`}
                      onClick={() => setTheme(t)}
                    >
                      <span className="theme-option-icon">
                        {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}
                      </span>
                      <span className="theme-option-label">
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'study' && (
            <Card className="settings-card">
              <h3 className="settings-section-title">Study Timer</h3>
              <div className="settings-form">
                <Input
                  label="Daily study goal (hours)"
                  type="number"
                  min="0"
                  step="0.5"
                  value={goalHours}
                  onChange={(e) => setGoalHours(e.target.value)}
                />
                <Input
                  label="Minimum session length (seconds)"
                  type="number"
                  min="0"
                  step="1"
                  value={minSeconds}
                  onChange={(e) => setMinSeconds(e.target.value)}
                />
                <ToggleItem
                  label="Remember pause choice"
                  description={
                    pausePreference
                      ? `Applying "${pausePreference === 'pause' ? 'Pause Timer' : 'Continue Timer'}" automatically`
                      : 'Ask every time the video is paused'
                  }
                  checked={rememberPauseChoice}
                  onChange={() => setRememberPauseChoice(!rememberPauseChoice)}
                />
                <Button variant="primary" onClick={onStudySave}>Save Study Settings</Button>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="settings-card">
              <h3 className="settings-section-title">Notifications</h3>
              <div className="settings-toggles">
                <ToggleItem
                  label="Email Notifications"
                  description="Receive email updates"
                  checked={notifications.email}
                  onChange={() => toggleNotification('email')}
                />
                <ToggleItem
                  label="Study Reminders"
                  description="Get reminded to study"
                  checked={notifications.reminders}
                  onChange={() => toggleNotification('reminders')}
                />
                <ToggleItem
                  label="Weekly Report"
                  description="Receive weekly study report"
                  checked={notifications.weekly}
                  onChange={() => toggleNotification('weekly')}
                />
                <ToggleItem
                  label="New Features"
                  description="Get notified about new features"
                  checked={notifications.features}
                  onChange={() => toggleNotification('features')}
                />
              </div>
              <Button variant="primary" style={{ marginTop: 16 }} onClick={() => addToast('Notification preferences saved', 'success')}>
                Save Preferences
              </Button>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="settings-card">
              <h3 className="settings-section-title">Security</h3>
              <form onSubmit={handleSecuritySubmit(onSecuritySave)} className="settings-form">
                <Input label="Current Password" type="password" placeholder="Enter current password" {...registerSecurity('currentPassword')} />
                <Input label="New Password" type="password" placeholder="Enter new password" {...registerSecurity('newPassword')} />
                <Input label="Confirm Password" type="password" placeholder="Confirm new password" {...registerSecurity('confirmPassword')} />
                <Button variant="primary" type="submit">Update Password</Button>
              </form>
            </Card>
          )}

          {activeTab === 'storage' && (
            <Card className="settings-card">
              <h3 className="settings-section-title">Storage</h3>
              <div className="storage-info">
                <p className="storage-text">
                  {storageStats.totalItems} {storageStats.totalItems === 1 ? 'item' : 'items'} stored
                </p>
              </div>
              <div className="storage-breakdown">
                {storageStats.items.length === 0 ? (
                  <p className="empty-state-desc">No items yet</p>
                ) : (
                  storageStats.items.map((item) => (
                    <StorageItem key={item.label} label={item.label} size={item.size} percent={item.percent} />
                  ))
                )}
              </div>
            </Card>
          )}

          {activeTab === 'language' && (
            <Card className="settings-card">
              <h3 className="settings-section-title">Language & Region</h3>
              <div className="settings-form">
                <Select
                  label="Language"
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'hi', label: 'Hindi' },
                    { value: 'bn', label: 'Bengali' },
                    { value: 'ta', label: 'Tamil' },
                  ]}
                />
                <Select
                  label="Timezone"
                  options={[
                    { value: 'ist', label: 'India Standard Time (IST)' },
                    { value: 'utc', label: 'UTC' },
                    { value: 'est', label: 'Eastern Standard Time' },
                  ]}
                />
                <Button variant="primary" onClick={() => addToast('Preferences saved', 'success')}>
                  Save Preferences
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ToggleItem({ label, description, checked, onChange }) {
  return (
    <div className="toggle-item">
      <div>
        <p className="toggle-label">{label}</p>
        <p className="toggle-desc">{description}</p>
      </div>
      <button
        className={`toggle-switch ${checked ? 'active' : ''}`}
        onClick={onChange}
        role="switch"
        aria-checked={checked}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  )
}

function StorageItem({ label, size, percent }) {
  return (
    <div className="storage-item">
      <span className="storage-item-label">{label}</span>
      <div className="storage-item-bar">
        <div className="storage-item-fill" style={{ '--fill-width': `${percent}%` }} />
      </div>
      <span className="storage-item-size">{size}</span>
    </div>
  )
}
