import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, RefreshCw } from 'lucide-react'
import { formatDate, timeFromNow, parseCron } from '../lib/cronParser'

export default function NextRuns({ result }) {
  const [now, setNow] = useState(Date.now())
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  if (!result?.valid || !result.nextRuns?.length) return null

  // Recalculate next runs every render (tick refreshes time-from-now only)
  const runs = result.nextRuns

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Clock size={15} style={{ color: 'var(--violet-hi)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Next 10 runs
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          fontSize: '0.65rem', color: 'var(--dim)',
        }}>
          <RefreshCw size={10} style={{ animation: 'spin 3s linear infinite' }} />
          Live
        </div>
      </div>

      {/* Run list */}
      <div style={{ padding: '0.5rem 0' }}>
        {runs.map((date, i) => {
          const past = date < now
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 1.5rem',
                borderBottom: i < runs.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: past ? 0.4 : 1,
              }}
            >
              {/* Index + date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 20, height: 20,
                  borderRadius: '50%',
                  background: i === 0 ? 'var(--violet)' : 'var(--surface2)',
                  border: i === 0 ? '1px solid var(--violet-hi)' : '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: i === 0 ? '#fff' : 'var(--dim)',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.8rem',
                  color: i === 0 ? 'var(--text)' : 'var(--muted)',
                }}>
                  {formatDate(date)}
                </span>
              </div>

              {/* Time from now */}
              <span style={{
                fontSize: '0.7rem',
                fontFamily: 'JetBrains Mono, monospace',
                color: i === 0 ? 'var(--violet-hi)' : 'var(--dim)',
                background: i === 0 ? 'rgba(124,108,240,0.12)' : 'transparent',
                border: i === 0 ? '1px solid rgba(124,108,240,0.2)' : 'none',
                padding: i === 0 ? '0.2rem 0.5rem' : '0',
                borderRadius: '0.375rem',
              }}>
                {timeFromNow(date)}
              </span>
            </motion.div>
          )
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </motion.div>
  )
}
