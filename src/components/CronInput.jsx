import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, AlertCircle, CheckCircle2, Clipboard, ClipboardCheck, Zap } from 'lucide-react'
import { parseCron } from '../lib/cronParser'

const PLACEHOLDER_EXAMPLES = [
  '0 9 * * 1-5',
  '*/15 * * * *',
  '0 0 1 * *',
  '30 6 * * 1',
  '@daily',
  '0 */4 * * *',
]

export default function CronInput({ value, onChange, result }) {
  const [copied, setCopied] = useState(false)
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length))

  async function copy() {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const isValid   = result?.valid === true
  const isInvalid = result?.valid === false && value.trim().length > 0
  const isEmpty   = !value.trim()

  const borderColor = isEmpty
    ? 'rgba(255,255,255,0.08)'
    : isValid
      ? 'rgba(52,211,153,0.35)'
      : 'rgba(248,113,113,0.35)'

  const iconColor = isEmpty ? 'var(--muted)' : isValid ? 'var(--green)' : 'var(--red)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Field labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.5rem',
        padding: '0 0.25rem',
        maxWidth: 520,
      }}>
        {['Minute', 'Hour', 'Day', 'Month', 'Weekday'].map(label => (
          <div key={label} style={{
            textAlign: 'center',
            fontSize: '0.65rem',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--dim)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            {label}
          </div>
        ))}
      </div>

      {/* Main input row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'var(--surface)',
        border: `1px solid ${borderColor}`,
        borderRadius: '0.875rem',
        padding: '1rem 1.25rem',
        transition: 'border-color 0.2s',
      }}>
        <Terminal size={18} style={{ color: iconColor, flexShrink: 0, transition: 'color 0.2s' }} />

        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1.125rem',
            fontWeight: 500,
            letterSpacing: '0.12em',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <AnimatePresence mode="wait">
            {isValid && (
              <motion.div
                key="valid"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <CheckCircle2 size={18} style={{ color: 'var(--green)' }} />
              </motion.div>
            )}
            {isInvalid && (
              <motion.div
                key="invalid"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <AlertCircle size={18} style={{ color: 'var(--red)' }} />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={copy}
            disabled={!value}
            title="Copy expression"
            style={{
              background: 'none',
              border: 'none',
              cursor: value ? 'pointer' : 'not-allowed',
              color: copied ? 'var(--green)' : 'var(--muted)',
              padding: '0.25rem',
              display: 'flex',
              transition: 'color 0.15s',
            }}
          >
            {copied ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
          </button>
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {isInvalid && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--red)',
              fontSize: '0.8rem',
              paddingLeft: '0.25rem',
            }}
          >
            <Zap size={12} />
            {result.error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
