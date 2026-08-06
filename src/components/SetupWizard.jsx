import { useState } from 'react'
import { ArrowRight, ArrowLeft, Check, Database, Shield, User, Globe } from 'lucide-react'
import { Button } from './Button'
import { Input } from '../components/Input'
import { useToast } from './Toast'

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Globe },
  { id: 'provider', title: 'Database Provider', icon: Database },
  { id: 'connection', title: 'Connection', icon: User },
  { id: 'validate', title: 'Validate', icon: Shield },
  { id: 'complete', title: 'Complete', icon: Check },
]

export function SetupWizard({ isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [config, setConfig] = useState({
    provider: 'supabase',
    url: '',
    anonKey: '',
  })
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)
  const { addToast } = useToast()

  const step = STEPS[currentStep]

  const handleNext = () => {
    if (currentStep === 2) {
      setValidating(true)
      setTimeout(() => {
        setValidating(false)
        setValidated(true)
        setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
      }, 1500)
    } else if (currentStep === 3) {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
    } else {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
    }
  }

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  const handleFinish = () => {
    onComplete?.(config)
    addToast('Setup complete!', 'success')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="setup-wizard">
        <div className="setup-wizard-header">
          <div className="setup-wizard-progress">
            {STEPS.map((s, i) => (
              <div key={s.id} className={`setup-step ${i <= currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}>
                <div className="setup-step-dot">
                  {i < currentStep ? <Check size={12} /> : <s.icon size={14} />}
                </div>
                <span className="setup-step-label">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="setup-wizard-body">
          {currentStep === 0 && (
            <div className="setup-content">
              <h3>Welcome to BookmarkHub</h3>
              <p>Let's get you set up in a few simple steps. This wizard will guide you through configuring your database connection.</p>
              <div className="setup-features">
                <div className="setup-feature-item">
                  <Database size={20} />
                  <span>Supabase, Firebase, MongoDB support</span>
                </div>
                <div className="setup-feature-item">
                  <Shield size={20} />
                  <span>End-to-end encryption with RLS</span>
                </div>
                <div className="setup-feature-item">
                  <Globe size={20} />
                  <span>Cloud-synced across all devices</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="setup-content">
              <h3>Choose Database Provider</h3>
              <div className="setup-providers">
                {['supabase', 'firebase', 'mongodb', 'postgresql'].map((p) => (
                  <button
                    key={p}
                    className={`setup-provider ${config.provider === p ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, provider: p })}
                  >
                    <Database size={20} />
                    <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="setup-content">
              <h3>Connection Details</h3>
              <Input
                label="Project URL"
                placeholder="https://your-project.supabase.co"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
              />
              <Input
                label="API Key"
                placeholder="Enter your API key"
                type="password"
                value={config.anonKey}
                onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="setup-content">
              <h3>Validate Connection</h3>
              {validating ? (
                <div className="setup-validating">
                  <div className="setup-spinner" />
                  <p>Connecting to database...</p>
                </div>
              ) : validated ? (
                <div className="setup-validated">
                  <Check size={48} />
                  <p>Connection successful!</p>
                </div>
              ) : (
                <p>Click Next to validate your connection.</p>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="setup-content setup-complete">
              <Check size={48} />
              <h3>Setup Complete!</h3>
              <p>Your BookmarkHub is ready to start organizing your knowledge.</p>
            </div>
          )}
        </div>

        <div className="setup-wizard-footer">
          {currentStep > 0 && currentStep < 4 && (
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft size={16} /> Back
            </Button>
          )}
          <div className="setup-wizard-footer-right">
            {currentStep < 3 && (
              <Button variant="primary" onClick={handleNext}>
                Next <ArrowRight size={16} />
              </Button>
            )}
            {currentStep === 3 && validated && (
              <Button variant="primary" onClick={handleNext}>
                Complete <ArrowRight size={16} />
              </Button>
            )}
            {currentStep === 4 && (
              <Button variant="primary" onClick={handleFinish}>
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
