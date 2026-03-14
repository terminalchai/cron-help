import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

const ACCENT_COLORS = [
  { bg: 'rgba(124,108,240,0.12)', border: 'rgba(124,108,240,0.25)', text: '#a89cf8' },
  { bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)',   text: '#34d399' },
  { bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.2)',   text: '#60a5fa' },
  { bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)',   text: '#fbbf24' },
  { bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)',  text: '#f87171' },
]

export default function CronExplainer({ result }) {
  if (!result?.valid) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        overflow: 'hidden',
      }}
    >
      {/* Description header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.875rem',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '0.625rem',
          background: 'rgba(124,108,240,0.12)',
          border: '1px solid rgba(124,108,240,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <BookOpen size={16} style={{ color: '#a89cf8' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Description
          </div>
          <div style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 }}>
            {result.description}
          </div>
        </div>
      </div>

      {/* Field breakdown */}
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Field breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {result.fields.map((field, i) => {
            const color = ACCENT_COLORS[i % ACCENT_COLORS.length]
            return (
              <motion.div
                key={field.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.625rem 0.875rem',
                  background: color.bg,
                  border: `1px solid ${color.border}`,
                  borderRadius: '0.5rem',
                }}
              >
                {/* Value pill */}
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: color.text,
                  minWidth: 48,
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.2)',
                  border: `1px solid ${color.border}`,
                  borderRadius: '0.375rem',
                  padding: '0.2rem 0.5rem',
                }}>
                  {field.value}
                </div>

                {/* Label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: color.text, fontWeight: 600, marginBottom: '0.1rem' }}>
                    {field.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {field.tip}
                  </div>
                </div>

                {/* Range */}
                <div style={{
                  fontSize: '0.65rem',
                  color: 'var(--dim)',
                  fontFamily: 'JetBrains Mono, monospace',
                  flexShrink: 0,
                }}>
                  {field.range}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
