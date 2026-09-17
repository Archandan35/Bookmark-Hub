import { useEffect, useState } from 'react'

function RollingDigit({ digit, delay }) {
  const [shown, setShown] = useState(9)
  useEffect(() => {
    setShown(9)
    const id = setTimeout(() => setShown(digit), 60 + delay)
    return () => clearTimeout(id)
  }, [digit, delay])
  return (
    <span className="roll-digit">
      <span className="roll-strip" style={{ transform: `translateY(-${shown}em)` }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  )
}

/**
 * Odometer-style counter: each digit rolls top-to-bottom
 * (strip starts at 9 and settles onto the target digit with easing,
 * slightly staggered per digit). Non-digit characters stay static.
 * The roll replays every 10 seconds and re-rolls when the value changes.
 */
export function RollingCounter({ text }) {
  const [cycle, setCycle] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setCycle((c) => c + 1), 10000)
    return () => clearInterval(id)
  }, [])
  let digitIndex = 0
  return (
    <span className="roll-counter">
      {String(text).split('').map((ch, i) => {
        if (ch === ' ') return <span key={`${cycle}-${i}`} className="roll-space" />
        if (!/\d/.test(ch)) return <span key={`${cycle}-${i}`}>{ch}</span>
        const d = digitIndex
        digitIndex += 1
        return <RollingDigit key={`${cycle}-${i}`} digit={Number(ch)} delay={d * 90} />
      })}
    </span>
  )
}

export default RollingCounter
