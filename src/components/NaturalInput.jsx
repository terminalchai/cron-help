import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { nlpToCron, NLP_EXAMPLES } from '../lib/nlpParser'

export default function NaturalInput({ onGenerate }) {
  const [value, setValue]     = useState('')
  const [result, setResult]   = useState(null)
  const [phIdx, setPhIdx]     = useState(0)
  const [focused, setFocused] = useState(false)
  const timerRef              = useRef(null)

  // Cycle placeholder examples (pause when focused)
  useEffect(() => {
    if (focused) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setPhIdx(i => (i + 1) % NLP_EXAMPLES.length)
    }, 2400)
    return () => clearInterval(timerRef.current)
  }, [focused])

  function handleChange(v) {
    setValue(v)
    if (!v.trim()) { setResult(null); return }
    const r = nlpToCron(v)
    setResult(r)
  }

  function handleUse() {
    if (result && result.cron) onGenerate(result.cron)
  }

  const hasResult  = result && result.cron
  const hasError   = result && result.error
  const isEmpty    = !value.trim()

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
        <Wand2 size={15} style={{ color: '#fbbf24' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Natural language → cron
        </span>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'var(--surface2)',
          border: `1px solid ${hasResult ? 'rgba(52,211,153,0.3)' : hasError ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
          borderRadius: '0.75rem',
          padding: '0.875rem 1rem',
          transition: 'border-color 0.2s',
        }}>
          <Wand2 size={16} style={{ color: 'var(--amber)', flexShrink: 0 }} />
          <input
            id="nlp-input"
            type="text"
            value={value}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={NLP_EXAMPLES[phIdx]}
            aria-label="Describe a schedule in plain English"
            aria-placeholder={NLP_EXAMPLES[phIdx]}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: '0.9375rem',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          <AnimatePresence mode="wait">
            {hasResult && (
              <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
              </motion.div>
            )}
            {hasError && (
              <motion.div key="err" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <AlertCircle size={16} style={{ color: 'var(--red)' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Result */}
        <AnimatePresence>
          {hasResult && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '0.875rem 1rem',
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: '0.75rem',
              }}
            >
              <div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--green)',
                  letterSpacing: '0.1em',
                  marginBottom: '0.25rem',
                }}>
                  {result.cron}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {result.description}
                  {result.confidence === 'medium' && (
                    <span style={{ marginLeft: '0.5rem', color: 'var(--amber)', fontSize: '0.7rem' }}>
                      (approximate)
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleUse}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(52,211,153,0.15)',
                  border: '1px solid rgba(52,211,153,0.3)',
                  borderRadius: '0.5rem',
                  color: 'var(--green)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(52,211,153,0.15)'}
              >
                Use <ArrowRight size={13} />
              </button>
            </motion.div>
          )}

          {hasError && value.trim() && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: '0.78rem', color: 'var(--red)', paddingLeft: '0.25rem' }}
            >
              {result.error}
            </motion.div>
          )}

          {!hasResult && !hasError && !isEmpty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: '0.78rem', color: 'var(--dim)', paddingLeft: '0.25rem' }}
            >
              Try: "every 5 minutes", "every Monday at 9am", "on the 1st of every month"
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
