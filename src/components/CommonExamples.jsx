import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

const EXAMPLES = [
  { label: 'Every minute',            expr: '* * * * *' },
  { label: 'Every 5 minutes',         expr: '*/5 * * * *' },
  { label: 'Every 15 minutes',        expr: '*/15 * * * *' },
  { label: 'Every hour',              expr: '0 * * * *' },
  { label: 'Every day midnight',      expr: '0 0 * * *' },
  { label: 'Every day at 9am',        expr: '0 9 * * *' },
  { label: 'Weekdays at 9am',         expr: '0 9 * * 1-5' },
  { label: 'Every Monday 9am',        expr: '0 9 * * 1' },
  { label: 'Every Sunday midnight',   expr: '0 0 * * 0' },
  { label: '1st of every month',      expr: '0 0 1 * *' },
  { label: 'Every 6 hours',           expr: '0 */6 * * *' },
  { label: 'Twice a day',             expr: '0 0,12 * * *' },
  { label: 'Every Jan 1st',           expr: '0 0 1 1 *' },
  { label: 'Every 30 min 9–17',       expr: '*/30 9-17 * * *' },
  { label: 'Every Fri at 5pm',        expr: '0 17 * * 5' },
  { label: 'Every weekday midnight',  expr: '0 0 * * 1-5' },
]

export default function CommonExamples({ onSelect }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
      }}>
        <Zap size={15} style={{ color: 'var(--amber)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Common expressions
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '0.5rem',
        padding: '1rem',
      }}>
        {EXAMPLES.map((ex, i) => (
          <motion.button
            key={ex.expr}
            onClick={() => onSelect(ex.expr)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              padding: '0.75rem',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '0.625rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(124,108,240,0.35)'
              e.currentTarget.style.background = 'rgba(124,108,240,0.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--surface2)'
            }}
          >
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--violet-hi)',
              letterSpacing: '0.06em',
            }}>
              {ex.expr}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
              {ex.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
