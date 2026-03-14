import cronstrue from 'cronstrue'
import { parseExpression } from 'cron-parser'

/**
 * Parse a cron expression and return human description + next N run times.
 * Supports standard 5-field (min hr dom mon dow) and 6-field with seconds.
 */
export function parseCron(expr) {
  const trimmed = expr.trim()
  if (!trimmed) return { valid: false, error: 'Enter a cron expression' }

  // Handle named shortcuts
  const shortcuts = {
    '@yearly':   '0 0 1 1 *',
    '@annually': '0 0 1 1 *',
    '@monthly':  '0 0 1 * *',
    '@weekly':   '0 0 * * 0',
    '@daily':    '0 0 * * *',
    '@midnight': '0 0 * * *',
    '@hourly':   '0 * * * *',
  }
  const resolved = shortcuts[trimmed.toLowerCase()] ?? trimmed

  try {
    const description = cronstrue.toString(resolved, {
      throwExceptionOnParseError: true,
      use24HourTimeFormat: false,
      verbose: true,
    })

    const interval = parseExpression(resolved, {
      currentDate: new Date(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })

    const nextRuns = []
    for (let i = 0; i < 10; i++) {
      nextRuns.push(interval.next().toDate())
    }

    const fields = explainFields(resolved)

    return { valid: true, expression: resolved, description, nextRuns, fields }
  } catch (err) {
    return { valid: false, error: friendlyError(err.message ?? String(err)) }
  }
}

function friendlyError(msg) {
  if (msg.includes('Unknown alias')) return 'Unknown alias — try a standard 5-field expression'
  if (msg.includes('Constraint error')) return "Value out of range \u2014 check each field's allowed values"
  if (msg.includes('SyntaxError')) return 'Syntax error — make sure you have 5 space-separated fields'
  if (msg.includes('fields')) return 'Expected 5 fields: minute hour day-of-month month day-of-week'
  return msg.replace(/^Error:\s*/i, '')
}

/** Break down each field into a plain-English label */
export function explainFields(expr) {
  const parts = expr.trim().split(/\s+/)
  // normalise to 5-field (drop optional seconds field)
  const [min, hr, dom, mon, dow] = parts.length === 6 ? parts.slice(1) : parts

  return [
    { label: 'Minute',       value: min, range: '0–59',  tip: fieldTip('minute', min) },
    { label: 'Hour',         value: hr,  range: '0–23',  tip: fieldTip('hour', hr) },
    { label: 'Day of month', value: dom, range: '1–31',  tip: fieldTip('dom', dom) },
    { label: 'Month',        value: mon, range: '1–12',  tip: fieldTip('month', mon) },
    { label: 'Day of week',  value: dow, range: '0–6',   tip: fieldTip('dow', dow) },
  ]
}

const MONTH_NAMES   = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DOW_NAMES     = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function fieldTip(field, val) {
  if (val === '*') return 'Every ' + { minute:'minute', hour:'hour', dom:'day', month:'month', dow:'day of week' }[field]
  if (val.startsWith('*/')) return `Every ${val.slice(2)} ${{ minute:'minutes', hour:'hours', dom:'days', month:'months', dow:'days' }[field]}`
  if (val.includes('-')) {
    const [a, b] = val.split('-')
    if (field === 'dow') return `${DOW_NAMES[+a] ?? a} through ${DOW_NAMES[+b] ?? b}`
    if (field === 'month') return `${MONTH_NAMES[+a] ?? a} through ${MONTH_NAMES[+b] ?? b}`
    return `${a} through ${b}`
  }
  if (val.includes(',')) {
    const parts = val.split(',')
    if (field === 'dow') return parts.map(p => DOW_NAMES[+p] ?? p).join(', ')
    if (field === 'month') return parts.map(p => MONTH_NAMES[+p] ?? p).join(', ')
    return `At values: ${val}`
  }
  if (field === 'dow') return DOW_NAMES[+val] ?? val
  if (field === 'month') return MONTH_NAMES[+val] ?? val
  return `Exactly ${val}`
}

/** Format a Date nicely */
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    year:    'numeric',
    hour:    'numeric',
    minute:  '2-digit',
    second:  '2-digit',
    hour12:  true,
  }).format(date)
}

/** Time from now label */
export function timeFromNow(date) {
  const diff = date - Date.now()
  const secs = Math.round(diff / 1000)
  if (secs < 60)   return `in ${secs}s`
  const mins = Math.round(secs / 60)
  if (mins < 60)   return `in ${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 24)  return `in ${hours}h`
  const days = Math.round(hours / 24)
  return `in ${days}d`
}
