import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, Terminal, Wand2, BookOpen } from 'lucide-react'
import CronInput       from '../components/CronInput'
import CronExplainer   from '../components/CronExplainer'
import NextRuns        from '../components/NextRuns'
import NaturalInput    from '../components/NaturalInput'
import CommonExamples  from '../components/CommonExamples'
import CronReference   from '../components/CronReference'
import Toast           from '../components/Toast'
import { parseCron }   from '../lib/cronParser'

// ── constants ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'parse', label: 'Parse',    icon: Terminal },
  { id: 'gen',   label: 'Generate', icon: Wand2    },
  { id: 'ref',   label: 'Reference',icon: BookOpen },
]

// ── component ──────────────────────────────────────────────────────────────

export default function Home() {
  const [tab,       setTab]       = useState('parse')
  const [expr,      setExpr]      = useState('0 9 * * 1-5')
  const [result,    setResult]    = useState(null)
  const [toast,     setToast]     = useState(null)
  const refreshRef  = useRef(null)

  function reparse(expression) {
    if (!expression.trim()) { setResult(null); return }
    setResult(parseCron(expression.trim()))
  }

  // Parse whenever expr changes
  useEffect(() => {
    reparse(expr)
    // Auto-refresh every 60s so nextRuns stays current
    clearInterval(refreshRef.current)
    refreshRef.current = setInterval(() => reparse(expr), 60_000)
    return () => clearInterval(refreshRef.current)
  }, [expr])

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  function handleNlpGenerate(cron) {
    setExpr(cron)
    setTab('parse')
    showToast(`Loaded: ${cron}`)
  }

  function handleExampleSelect(cron) {
    setExpr(cron)
    showToast(`Loaded: ${cron}`)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,8,15,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56,
      }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={18} style={{ color: 'var(--violet)' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
            cron<span style={{ color: 'var(--violet-hi)' }}>.help</span>
          </span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href="https://github.com/terminalchai/cron-help"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              color: 'var(--muted)', fontSize: '0.8rem',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            <Github size={15} />
            <span>GitHub</span>
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{
        textAlign: 'center',
        padding: '3.5rem 1.5rem 2.5rem',
        maxWidth: 720, margin: '0 auto', width: '100%',
      }}>
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            background: 'rgba(124,108,240,0.1)',
            border: '1px solid rgba(124,108,240,0.2)',
            borderRadius: '2rem',
            fontSize: '0.72rem',
            color: 'var(--violet-hi)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>
            <Terminal size={11} />
            Cron expression toolkit
          </div>

          <h1 style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            marginBottom: '1rem',
          }}>
            Understand cron<br />
            <span style={{ color: 'var(--violet-hi)' }}>expressions instantly</span>
          </h1>

          <p style={{
            fontSize: '1.0625rem',
            color: 'var(--muted)',
            lineHeight: 1.7,
            maxWidth: 480,
            margin: '0 auto',
          }}>
            Paste any cron expression for a human-readable explanation and next 10 run times.
            Or describe a schedule in plain English and get the expression.
          </p>
        </motion.div>
      </div>

      {/* ── Main tool ── */}
      <main style={{ flex: 1, width: '100%', maxWidth: 860, margin: '0 auto', padding: '0 1.5rem 4rem' }} id="main-content">
        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Tool tabs"
          style={{
            display: 'flex',
            gap: '0.25rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.875rem',
            padding: '0.25rem',
            width: 'fit-content',
            maxWidth: '100%',
            overflowX: 'auto',
            marginBottom: '1.75rem',
          }}>
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.625rem',
                border: 'none',
                background: tab === t.id ? 'rgba(124,108,240,0.2)' : 'transparent',
                color:      tab === t.id ? 'var(--violet-hi)'       : 'var(--muted)',
                fontWeight: tab === t.id ? 600                       : 400,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Parse tab ── */}
          {tab === 'parse' && (
            <motion.div
              key="parse"
              role="tabpanel"
              id="panel-parse"
              aria-label="Parse cron expression"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <CronInput value={expr} onChange={setExpr} result={result} />
              <CronExplainer result={result} />
              <NextRuns result={result} />
              <CommonExamples onSelect={handleExampleSelect} />
            </motion.div>
          )}

          {/* ── Generate tab ── */}
          {tab === 'gen' && (
            <motion.div
              key="gen"
              role="tabpanel"
              id="panel-gen"
              aria-label="Generate cron from natural language"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <NaturalInput onGenerate={handleNlpGenerate} />
              <CommonExamples onSelect={handleExampleSelect} />
            </motion.div>
          )}

          {/* ── Reference tab ── */}
          {tab === 'ref' && (
            <motion.div
              key="ref"
              role="tabpanel"
              id="panel-ref"
              aria-label="Cron expression reference"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
            >
              <CronReference />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.25rem 1.5rem',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: 'var(--dim)',
      }}>
        <a href="#main-content" style={{ position:'absolute', left:'-9999px', top:'auto', width:1, height:1, overflow:'hidden' }}>Skip to main content</a>
        Built by{' '}
        <a
          href="https://github.com/terminalchai"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--violet-hi)', textDecoration: 'none' }}
        >
          terminalchai
        </a>
        {' '}· Pure frontend · No data sent anywhere
      </footer>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
