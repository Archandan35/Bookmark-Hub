import { useState } from 'react'
import { User, Palette, Bell, Shield, HardDrive, Globe } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input, Select } from '../components/Input'
import { useAppStore } from '../hooks/useStore'
import { THEME_MODES } from '../constants'

export function Settings() {
  const { theme, setTheme } = useAppStore()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'language', label: 'Language', icon: Globe },
  ]

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
              <div className="settings-form">
                <Input label="Full Name" placeholder="Enter your name" defaultValue="John Doe" />
                <Input label="Email" type="email" placeholder="Enter your email" defaultValue="john@example.com" />
                <Input label="Bio" placeholder="Tell us about yourself" />
                <Button variant="primary">Save Changes</Button>
              </div>
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
              <div className="settings-section">
                <p className="settings-label">Font Size</p>
                <Select
                  options={[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]}
                />
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="settings-card">
              <h3 className="settings-section-title">Notifications</h3>
              <div className="settings-toggles">
                <ToggleItem label="Email Notifications" description="Receive email updates" defaultChecked />
                <ToggleItem label="Study Reminders" description="Get reminded to study" defaultChecked />
                <ToggleItem label="Weekly Report" description="Receive weekly study report" />
                <ToggleItem label="New Features" description="Get notified about new features" defaultChecked />
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="settings-card">
              <h3 className="settings-section-title">Security</h3>
              <div className="settings-form">
                <Input label="Current Password" type="password" placeholder="Enter current password" />
                <Input label="New Password" type="password" placeholder="Enter new password" />
                <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
                <Button variant="primary">Update Password</Button>
              </div>
            </Card>
          )}

          {activeTab === 'storage' && (
            <Card className="settings-card">
              <h3 className="settings-section-title">Storage</h3>
              <div className="storage-info">
                <div className="storage-bar">
                  <div className="storage-fill" style={{ '--fill-width': '25%' }} />
                </div>
                <p className="storage-text">128 GB of 512 GB used (25%)</p>
              </div>
              <div className="storage-breakdown">
                <StorageItem label="Bookmarks" size="2.4 GB" percent={30} />
                <StorageItem label="Videos" size="45 GB" percent={55} />
                <StorageItem label="PDFs" size="12 GB" percent={10} />
                <StorageItem label="Other" size="8 GB" percent={5} />
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
                <Button variant="primary">Save Preferences</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ToggleItem({ label, description, defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <div className="toggle-item">
      <div>
        <p className="toggle-label">{label}</p>
        <p className="toggle-desc">{description}</p>
      </div>
      <button
        className={`toggle-switch ${checked ? 'active' : ''}`}
        onClick={() => setChecked(!checked)}
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
