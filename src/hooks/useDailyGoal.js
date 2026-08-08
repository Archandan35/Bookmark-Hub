import { useState, useEffect, useCallback } from 'react'
import { GoalsService } from '../services/GoalsService'

const STORAGE_KEY = 'bookmarkhub_daily_goal_seconds'

function readCached() {
  const raw = localStorage.getItem(STORAGE_KEY)
  const parsed = raw ? parseInt(raw, 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : GoalsService.DEFAULT_DAILY_TARGET_SECONDS
}

/**
 * Single source for the daily study target. Reads the persisted daily_goals
 * row when available and falls back to the last known local value.
 */
export function useDailyGoal(userId) {
  const [targetSeconds, setTargetSeconds] = useState(readCached)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    GoalsService.getDailyTargetSeconds(userId).then((value) => {
      if (cancelled || !value) return
      localStorage.setItem(STORAGE_KEY, String(value))
      setTargetSeconds(value)
    })
    return () => { cancelled = true }
  }, [userId])

  const updateTarget = useCallback(async (seconds) => {
    const next = Math.max(0, Math.floor(seconds) || 0)
    localStorage.setItem(STORAGE_KEY, String(next))
    setTargetSeconds(next)
    if (!userId) return
    try {
      await GoalsService.setDailyTargetSeconds(userId, next)
    } catch {
      // Local value stays authoritative if the remote write fails.
    }
  }, [userId])

  return { targetSeconds, updateTarget }
}

export default useDailyGoal
