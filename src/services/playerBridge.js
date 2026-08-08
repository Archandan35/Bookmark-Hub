let controls = null
const listeners = new Set()

function notify() {
  listeners.forEach((fn) => fn(!!controls))
}

export const playerBridge = {
  register(next) {
    controls = next
    notify()
    return () => {
      if (controls === next) {
        controls = null
        notify()
      }
    }
  },

  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  isReady() {
    return !!controls
  },

  play() {
    return controls?.play?.()
  },

  pause() {
    return controls?.pause?.()
  },

  pauseSilently() {
    if (controls?.pauseSilently) return controls.pauseSilently()
    return controls?.pause?.()
  },

  stop() {
    return controls?.stop?.()
  },

  replay() {
    return controls?.replay?.()
  },

  getCurrentTime() {
    return controls?.getCurrentTime?.() || 0
  },

  getDuration() {
    return controls?.getDuration?.() || 0
  },
}

export default playerBridge
