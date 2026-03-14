import { motion } from 'framer-motion'

const FIELDS = [
  { label: 'Minute',    range: '0–59',      special: '* , - /',  examples: ['0', '*/5', '0,30', '15-45'] },
  { label: 'Hour',      range: '0–23',      special: '* , - /',  examples: ['0', '*/2', '9-17', '0,12'] },
  { label: 'Day/Month', range: '1–31',      special: '* , - / L W', examples: ['1', '*/2', 'L', '1,15'] },
  { label: 'Month',     range: '1–12',      special: '* , - /',  examples: ['*', '1-3', '*/3', '1,7,12'] },
  { label: 'Weekday',   range: '0–6 (0=Sun)', special: '* , - / L #', examples: ['*', '1-5', '0,6', '1#1'] },
]

const SPECIAL_CHARS = [
  { char: '*', desc: 'Any value — matches every possible value for the field' },
  { char: ',', desc: 'Value list — e.g. 1,3,5 means 1 and 3 and 5' },
  { char: '-', desc: 'Range — e.g. 9-17 means 9 through 17 inclusive' },
  { char: '/', desc: 'Step — e.g. */5 means every 5 units' },
  { char: 'L', desc: 'Last — last day of month or last weekday of month' },
  { char: 'W', desc: 'Weekday — nearest weekday to the given day of month' },
  { char: '#', desc: 'Nth weekday — e.g. 1#2 means 2nd Monday of the month' },
]

export default function CronReference() {
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
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Quick reference
        </span>
      </div>

      {/* Field table */}
      <div style={{ overflowX: 'auto', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr>
              {['Field', 'Range', 'Special chars', 'Examples'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '0.5rem 0.75rem',
                  color: 'var(--dim)', fontWeight: 500,
                  borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FIELDS.map((f, i) => (
              <motion.tr
                key={f.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                style={{ borderBottom: i < FIELDS.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <td style={{ padding: '0.625rem 0.75rem', color: 'var(--text)', fontWeight: 600 }}>{f.label}</td>
                <td style={{ padding: '0.625rem 0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{f.range}</td>
                <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--violet-hi)', letterSpacing: '0.1em' }}>{f.special}</td>
                <td style={{ padding: '0.625rem 0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {f.examples.map(ex => (
                      <code key={ex} style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.72rem',
                        color: 'var(--amber)',
                        background: 'rgba(251,191,36,0.1)',
                        border: '1px solid rgba(251,191,36,0.15)',
                        padding: '0.1rem 0.375rem',
                        borderRadius: '0.25rem',
                      }}>
                        {ex}
                      </code>
                    ))}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Special chars */}
      <div style={{ padding: '1rem 1.5rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Special characters
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {SPECIAL_CHARS.map(sc => (
            <div key={sc.char} style={{ display: 'flex', gap: '0.875rem', alignItems: 'baseline' }}>
              <code style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--violet-hi)',
                minWidth: 16,
              }}>
                {sc.char}
              </code>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{sc.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
