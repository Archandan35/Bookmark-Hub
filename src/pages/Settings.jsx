import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { User, Palette, Bell, Shield, HardDrive, Globe } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input, Select } from '../components/Input'
import { useAppStore } from '../hooks/useStore'
import { useBookmarkStore, useAuthStore } from '../hooks/useStore'
import { THEME_MODES } from '../constants'
import { useToast } from '../components/Toast'

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

  const storageStats = useMemo(() => {
    const totalItems = bookmarks.length
    const videos = bookmarks.filter(b => b.type === 'video').length
    const pdfs = bookmarks.filter(b => b.type === 'pdf').length
    const others = totalItems - videos - pdfs
    const totalSize = totalItems * 0.5
    const percent = Math.min(100, Math.round((totalSize / 512) * 100))
    return {
      totalGB: totalSize.toFixed(1),
      percent,
      items: [
        { label: 'Bookmarks', size: `${(others * 0.3).toFixed(1)} GB`, percent: totalItems > 0 ? Math.round((others / totalItems) * 100) : 0 },
        { label: 'Videos', size: `${(videos * 2.5).toFixed(1)} GB`, percent: totalItems > 0 ? Math.round((videos / totalItems) * 100) : 0 },
        { label: 'PDFs', size: `${(pdfs * 0.8).toFixed(1)} GB`, percent: totalItems > 0 ? Math.round((pdfs / totalItems) * 100) : 0 },
      ]
    }
  }, [bookmarks])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
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
                <div className="storage-bar">
                  <div className="storage-fill" style={{ '--fill-width': `${storageStats.percent}%` }} />
                </div>
                <p className="storage-text">{storageStats.totalGB} GB of 512 GB used ({storageStats.percent}%)</p>
              </div>
              <div className="storage-breakdown">
                {storageStats.items.map((item) => (
                  <StorageItem key={item.label} label={item.label} size={item.size} percent={item.percent} />
                ))}
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
