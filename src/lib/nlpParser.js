/**
 * Natural language → cron expression parser.
 * Rule-based, handles the most common schedule descriptions.
 * Returns { cron, confidence, description } or { error }
 */

const DAYS = { sunday:0, sun:0, monday:1, mon:1, tuesday:2, tue:2,
               wednesday:3, wed:3, thursday:4, thu:4, friday:5, fri:5, saturday:6, sat:6 }
const MONTHS = { january:1, jan:1, february:2, feb:2, march:3, mar:3,
                 april:4, apr:4, may:5, june:6, jun:6, july:7, jul:7,
                 august:8, aug:8, september:9, sep:9, october:10, oct:10,
                 november:11, nov:11, december:12, dec:12 }

export function nlpToCron(input) {
  const raw = input.trim().toLowerCase()
  if (!raw) return null

  // ── Exact shortcuts ───────────────────────────────────────────────────────
  const shortcuts = [
    { pattern: /^every\s+minute$/,                     cron: '* * * * *',   desc: 'Every minute' },
    { pattern: /^every\s+second$/,                     cron: '* * * * *',   desc: 'Every minute (seconds not supported in standard cron)' },
    { pattern: /^every\s+hour(ly)?$/,                  cron: '0 * * * *',   desc: 'At the start of every hour' },
    { pattern: /^(daily|every\s+day)$/,                cron: '0 0 * * *',   desc: 'Every day at midnight' },
    { pattern: /^every\s+(night|midnight)$/,           cron: '0 0 * * *',   desc: 'Every day at midnight' },
    { pattern: /^every\s+noon$/,                        cron: '0 12 * * *',  desc: 'Every day at noon' },
    { pattern: /^(weekly|every\s+week)$/,              cron: '0 0 * * 0',   desc: 'Every Sunday at midnight' },
    { pattern: /^(monthly|every\s+month)$/,            cron: '0 0 1 * *',   desc: 'First day of every month at midnight' },
    { pattern: /^(yearly|annually|every\s+year)$/,     cron: '0 0 1 1 *',   desc: 'Once a year, January 1st at midnight' },
    { pattern: /^every\s+weekday$/,                    cron: '0 0 * * 1-5', desc: 'Every weekday (Mon–Fri) at midnight' },
    { pattern: /^every\s+weekend$/,                    cron: '0 0 * * 0,6', desc: 'Every Saturday and Sunday at midnight' },
    { pattern: /^(midnight|at\s+midnight)$/,           cron: '0 0 * * *',   desc: 'Every day at midnight' },
  ]

  for (const { pattern, cron, desc } of shortcuts) {
    if (pattern.test(raw)) return { cron, description: desc, confidence: 'high' }
  }

  // ── Every N minutes/hours ─────────────────────────────────────────────────
  let m = raw.match(/^every\s+(\d+)\s+minutes?$/)
  if (m) {
    const n = +m[1]
    if (n < 1 || n > 59) return { error: `Interval must be between 1 and 59 minutes` }
    return { cron: `*/${n} * * * *`, description: `Every ${n} minutes`, confidence: 'high' }
  }

  m = raw.match(/^every\s+(\d+)\s+hours?$/)
  if (m) {
    const n = +m[1]
    if (n < 1 || n > 23) return { error: `Interval must be between 1 and 23 hours` }
    return { cron: `0 */${n} * * *`, description: `Every ${n} hours`, confidence: 'high' }
  }

  m = raw.match(/^every\s+(\d+)\s+days?$/)
  if (m) {
    const n = +m[1]
    return { cron: `0 0 */${n} * *`, description: `Every ${n} days at midnight`, confidence: 'high' }
  }

  // ── At HH:MM [am/pm] ──────────────────────────────────────────────────────
  // "every day at 3pm", "every day at 14:30", "at 9am", "daily at 6:30pm"
  m = raw.match(/(?:every\s+day\s+)?at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (m) {
    let hr  = +m[1]
    const mn = m[2] ? +m[2] : 0
    const ap = m[3]
    if (ap === 'pm' && hr !== 12) hr += 12
    if (ap === 'am' && hr === 12) hr = 0
    if (hr > 23 || mn > 59) return { error: 'Invalid time — hour must be 0–23, minute 0–59' }

    // Check if day of week also specified
    const dowMatch = raw.match(new RegExp(`(${Object.keys(DAYS).join('|')})`))
    if (dowMatch) {
      const dow = DAYS[dowMatch[1]]
      const dayName = dowMatch[1].charAt(0).toUpperCase() + dowMatch[1].slice(1)
      return {
        cron: `${mn} ${hr} * * ${dow}`,
        description: `Every ${dayName} at ${formatTime(hr, mn)}`,
        confidence: 'high',
      }
    }

    // Weekday/weekend check
    if (raw.includes('weekday') || raw.includes('weekdays'))
      return { cron: `${mn} ${hr} * * 1-5`, description: `Every weekday at ${formatTime(hr, mn)}`, confidence: 'high' }
    if (raw.includes('weekend'))
      return { cron: `${mn} ${hr} * * 0,6`, description: `Every weekend at ${formatTime(hr, mn)}`, confidence: 'high' }

    return { cron: `${mn} ${hr} * * *`, description: `Every day at ${formatTime(hr, mn)}`, confidence: 'high' }
  }

  // ── Every [day name] ─────────────────────────────────────────────────────
  m = raw.match(new RegExp(`^every\\s+(${Object.keys(DAYS).join('|')})$`))
  if (m) {
    const dow = DAYS[m[1]]
    const name = m[1].charAt(0).toUpperCase() + m[1].slice(1)
    return { cron: `0 0 * * ${dow}`, description: `Every ${name} at midnight`, confidence: 'high' }
  }

  // ── Every [day name] at HH:MM ─────────────────────────────────────────────
  m = raw.match(new RegExp(`every\\s+(${Object.keys(DAYS).join('|')})\\s+at\\s+(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?`))
  if (m) {
    const dow = DAYS[m[1]]
    const name = m[1].charAt(0).toUpperCase() + m[1].slice(1)
    let hr  = +m[2]
    const mn = m[3] ? +m[3] : 0
    const ap = m[4]
    if (ap === 'pm' && hr !== 12) hr += 12
    if (ap === 'am' && hr === 12) hr = 0
    return { cron: `${mn} ${hr} * * ${dow}`, description: `Every ${name} at ${formatTime(hr, mn)}`, confidence: 'high' }
  }

  // ── On the Nth of every month ─────────────────────────────────────────────
  m = raw.match(/(?:on\s+the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(?:every\s+)?month/)
  if (m) {
    const day = +m[1]
    if (day < 1 || day > 31) return { error: 'Day of month must be 1–31' }
    return { cron: `0 0 ${day} * *`, description: `On day ${day} of every month at midnight`, confidence: 'high' }
  }

  // ── Every N minutes between HH and HH ────────────────────────────────────
  m = raw.match(/every\s+(\d+)\s+minutes?\s+(?:from|between)\s+(\d{1,2})\s*(?:am|pm)?\s+(?:and|to|-)\s+(\d{1,2})\s*(am|pm)?/)
  if (m) {
    const interval = +m[1]
    let start = +m[2], end = +m[3]
    const ap = m[4]
    if (ap === 'pm' && end !== 12) end += 12
    if (ap === 'pm' && start !== 12) start += 12
    return {
      cron: `*/${interval} ${start}-${end} * * *`,
      description: `Every ${interval} minutes from ${start}:00 to ${end}:00`,
      confidence: 'medium',
    }
  }

  // ── Twice a day ───────────────────────────────────────────────────────────
  if (raw.includes('twice a day') || raw.includes('twice daily'))
    return { cron: '0 0,12 * * *', description: 'Twice a day (midnight and noon)', confidence: 'medium' }

  // ── Every N weeks ─────────────────────────────────────────────────────────
  m = raw.match(/^every\s+(\d+)\s+weeks?$/)
  if (m) {
    const n = +m[1]
    return { cron: `0 0 */${n * 7} * *`, description: `Approximately every ${n} weeks`, confidence: 'medium' }
  }

  // ── In a specific month ───────────────────────────────────────────────────
  m = raw.match(new RegExp(`(?:every|in)\\s+(${Object.keys(MONTHS).join('|')})`))
  if (m) {
    const mon = MONTHS[m[1]]
    const name = m[1].charAt(0).toUpperCase() + m[1].slice(1)
    return { cron: `0 0 1 ${mon} *`, description: `First day of ${name} at midnight`, confidence: 'medium' }
  }

  return null
}

function formatTime(hr, mn) {
  const suffix = hr >= 12 ? 'PM' : 'AM'
  const h = hr % 12 || 12
  return `${h}:${String(mn).padStart(2, '0')} ${suffix}`
}

/** Suggestions shown in the NLP input placeholder cycling */
export const NLP_EXAMPLES = [
  'every 5 minutes',
  'every day at 3pm',
  'every Monday at 9am',
  'every weekday at 6:30pm',
  'every hour',
  'twice daily',
  'on the 1st of every month',
  'every Sunday at midnight',
  'every 15 minutes',
  'every Friday at 5pm',
]
