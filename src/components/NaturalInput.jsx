import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, ArrowRight, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { nlpToCron, NLP_EXAMPLES, NLP_SUGGESTIONS } from '../lib/nlpParser'

// Fuzzy-ish filter: all typed words must appear somewhere in the phrase
function filterSuggestions(query) {
  if (!query.trim()) return NLP_SUGGESTIONS.slice(0, 8)
  const words = query.toLowerCase().trim().split(/\s+/)
  const scored = NLP_SUGGESTIONS
    .map(s => {
      const p = s.phrase.toLowerCase()
      const matchedWords = words.filter(w => p.includes(w))
      if (matchedWords.length === 0) return { ...s, score: 0 }
      const score = matchedWords.length + (p.startsWith(words[0]) ? 1 : 0)
      return { ...s, score }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, 6)
}

// Bold the matched words inside a suggestion
function HighlightMatch({ phrase, query }) {
  if (!query.trim()) return <>{phrase}</>
  const words = query.trim().split(/\s+/).filter(Boolean)
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = phrase.split(pattern)
  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part)
          ? <strong key={i} style={{ color: 'var(--text)', fontWeight: 700 }}>{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

export default function NaturalInput({ onGenerate }) {
  const [value, setValue]         = useState('')
  const [result, setResult]       = useState(null)
  const [phIdx, setPhIdx]         = useState(0)
  const [focused, setFocused]     = useState(false)
  const [suggestions, setSugs]    = useState([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const timerRef                  = useRef(null)
  const inputRef                  = useRef(null)
  const listRef                   = useRef(null)
  const containerRef              = useRef(null)

  // Cycle placeholder (pause on focus)
  useEffect(() => {
    if (focused) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setPhIdx(i => (i + 1) % NLP_EXAMPLES.length)
    }, 2400)
    return () => clearInterval(timerRef.current)
  }, [focused])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSugs([])
        setActiveIdx(-1)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(v) {
    setValue(v)
    setActiveIdx(-1)
    setSugs(filterSuggestions(v))
    if (!v.trim()) { setResult(null); return }
    setResult(nlpToCron(v))
  }

  function pickSuggestion(phrase) {
    setValue(phrase)
    setSugs([])
    setActiveIdx(-1)
    setResult(nlpToCron(phrase))
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (!suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      pickSuggestion(suggestions[activeIdx].phrase)
    } else if (e.key === 'Escape') {
      setSugs([])
      setActiveIdx(-1)
    }
  }

  function handleUse() {
    if (result?.cron) onGenerate(result.cron)
  }

  const hasResult = result?.cron
  const hasError  = result?.error
  const showDrop  = focused && suggestions.length > 0 && !hasResult

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      overflow: 'visible',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        borderRadius: '1rem 1rem 0 0',
        background: 'var(--surface)',
      }}>
        <Wand2 size={15} style={{ color: '#fbbf24' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Natural language → cron
        </span>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Input + dropdown wrapper */}
        <div ref={containerRef} style={{ position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'var(--surface2)',
            border: `1px solid ${
              hasResult  ? 'rgba(52,211,153,0.35)'  :
              hasError   ? 'rgba(248,113,113,0.3)'  :
              focused    ? 'rgba(124,108,240,0.35)' : 'var(--border)'
            }`,
            borderRadius: showDrop ? '0.75rem 0.75rem 0 0' : '0.75rem',
            padding: '0.875rem 1rem',
            transition: 'border-color 0.2s',
          }}>
            <Wand2 size={16} style={{ color: 'var(--amber)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              id="nlp-input"
              type="text"
              value={value}
              onChange={e => handleChange(e.target.value)}
              onFocus={() => {
                setFocused(true)
                setSugs(filterSuggestions(value))
              }}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={NLP_EXAMPLES[phIdx]}
              aria-label="Describe a schedule in plain English"
              aria-autocomplete="list"
              aria-controls="nlp-suggestions"
              aria-activedescendant={activeIdx >= 0 ? `nlp-sug-${activeIdx}` : undefined}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text)', fontSize: '0.9375rem',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            <AnimatePresence mode="wait">
              {hasResult && (
                <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
                </motion.div>
              )}
              {hasError && (
                <motion.div key="err" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <AlertCircle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {showDrop && (
              <motion.ul
                id="nlp-suggestions"
                ref={listRef}
                role="listbox"
                aria-label="Suggestions"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0, right: 0,
                  zIndex: 100,
                  background: 'var(--surface2)',
                  border: '1px solid rgba(124,108,240,0.25)',
                  borderTop: 'none',
                  borderRadius: '0 0 0.75rem 0.75rem',
                  overflow: 'hidden',
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                }}
              >
                {suggestions.map((s, i) => (
                  <li
                    key={s.phrase}
                    id={`nlp-sug-${i}`}
                    role="option"
                    aria-selected={activeIdx === i}
                    onMouseDown={() => pickSuggestion(s.phrase)}
                    onMouseEnter={() => setActiveIdx(i)}
                    style={{
                      padding: '0.625rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      background: activeIdx === i ? 'rgba(124,108,240,0.12)' : 'transparent',
                      borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                      <ChevronRight size={12} style={{ color: activeIdx === i ? 'var(--violet-hi)' : 'var(--dim)', flexShrink: 0, transition: 'color 0.1s' }} />
                      <span style={{ fontSize: '0.875rem', color: activeIdx === i ? 'var(--text)' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color 0.1s' }}>
                        <HighlightMatch phrase={s.phrase} query={value} />
                      </span>
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: activeIdx === i ? 'var(--violet-hi)' : 'var(--dim)', flexShrink: 0, letterSpacing: '0.06em', transition: 'color 0.1s' }}>
                      {s.hint}
                    </span>
                  </li>
                ))}
                {/* Keyboard hint row */}
                <li style={{ padding: '0.4rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {[['↑↓', 'navigate'], ['↵', 'select'], ['Esc', 'close']].map(([key, label]) => (
                    <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <kbd style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: 'var(--dim)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.25rem', padding: '0.1rem 0.3rem' }}>{key}</kbd>
                      <span style={{ fontSize: '0.65rem', color: 'var(--dim)' }}>{label}</span>
                    </span>
                  ))}
                </li>
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Result / error / hint */}
        <AnimatePresence>
          {hasResult && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '1rem', padding: '0.875rem 1rem',
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: '0.75rem',
              }}
            >
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                  {result.cron}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {result.description}
                  {result.confidence === 'medium' && (
                    <span style={{ marginLeft: '0.5rem', color: 'var(--amber)', fontSize: '0.7rem' }}>(approximate)</span>
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
                  color: 'var(--green)', fontSize: '0.78rem', fontWeight: 600,
                  cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(52,211,153,0.15)'}
              >
                Use <ArrowRight size={13} />
              </button>
            </motion.div>
          )}

          {hasError && value.trim() && (
            <motion.p role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontSize: '0.78rem', color: 'var(--red)', paddingLeft: '0.25rem', margin: 0 }}>
              {result.error}
            </motion.p>
          )}

          {!hasResult && !hasError && value.trim() && !focused && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontSize: '0.78rem', color: 'var(--dim)', paddingLeft: '0.25rem', margin: 0 }}>
              No match — try something like "every 5 minutes" or "every Monday at 9am"
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
