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

/** Placeholder cycling examples */
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

/**
 * Full list of supported phrases for autocomplete suggestions.
 * Each entry: { phrase, hint }  — phrase is what gets filled in, hint is extra context.
 */
export const NLP_SUGGESTIONS = [
  // ─── Every N units ───────────────────────────────────────────────────────
  { phrase: 'every minute',           hint: '* * * * *' },
  { phrase: 'every 5 minutes',        hint: '*/5 * * * *' },
  { phrase: 'every 10 minutes',       hint: '*/10 * * * *' },
  { phrase: 'every 15 minutes',       hint: '*/15 * * * *' },
  { phrase: 'every 30 minutes',       hint: '*/30 * * * *' },
  { phrase: 'every hour',             hint: '0 * * * *' },
  { phrase: 'every 2 hours',          hint: '0 */2 * * *' },
  { phrase: 'every 4 hours',          hint: '0 */4 * * *' },
  { phrase: 'every 6 hours',          hint: '0 */6 * * *' },
  { phrase: 'every 12 hours',         hint: '0 */12 * * *' },
  { phrase: 'every day',              hint: '0 0 * * *' },
  { phrase: 'every week',             hint: '0 0 * * 0' },
  { phrase: 'every month',            hint: '0 0 1 * *' },
  { phrase: 'every year',             hint: '0 0 1 1 *' },
  // ─── Specific times ──────────────────────────────────────────────────────
  { phrase: 'every day at midnight',  hint: '0 0 * * *' },
  { phrase: 'every day at noon',      hint: '0 12 * * *' },
  { phrase: 'every day at 6am',       hint: '0 6 * * *' },
  { phrase: 'every day at 9am',       hint: '0 9 * * *' },
  { phrase: 'every day at 12pm',      hint: '0 12 * * *' },
  { phrase: 'every day at 3pm',       hint: '0 15 * * *' },
  { phrase: 'every day at 6pm',       hint: '0 18 * * *' },
  { phrase: 'every day at 9pm',       hint: '0 21 * * *' },
  { phrase: 'every day at 6:30am',    hint: '30 6 * * *' },
  { phrase: 'every day at 5:30pm',    hint: '30 17 * * *' },
  { phrase: 'twice daily',            hint: '0 0,12 * * *' },
  // ─── Weekday / weekend ───────────────────────────────────────────────────
  { phrase: 'every weekday',          hint: '0 0 * * 1-5' },
  { phrase: 'every weekday at 9am',   hint: '0 9 * * 1-5' },
  { phrase: 'every weekday at 5pm',   hint: '0 17 * * 1-5' },
  { phrase: 'every weekday at 6:30pm',hint: '30 18 * * 1-5' },
  { phrase: 'every weekend',          hint: '0 0 * * 0,6' },
  { phrase: 'every weekend at 10am',  hint: '0 10 * * 0,6' },
  // ─── Specific days ───────────────────────────────────────────────────────
  { phrase: 'every Monday',           hint: '0 0 * * 1' },
  { phrase: 'every Tuesday',          hint: '0 0 * * 2' },
  { phrase: 'every Wednesday',        hint: '0 0 * * 3' },
  { phrase: 'every Thursday',         hint: '0 0 * * 4' },
  { phrase: 'every Friday',           hint: '0 0 * * 5' },
  { phrase: 'every Saturday',         hint: '0 0 * * 6' },
  { phrase: 'every Sunday',           hint: '0 0 * * 0' },
  { phrase: 'every Monday at 9am',    hint: '0 9 * * 1' },
  { phrase: 'every Friday at 5pm',    hint: '0 17 * * 5' },
  { phrase: 'every Sunday at midnight', hint: '0 0 * * 0' },
  // ─── Day of month ────────────────────────────────────────────────────────
  { phrase: 'on the 1st of every month',  hint: '0 0 1 * *' },
  { phrase: 'on the 15th of every month', hint: '0 0 15 * *' },
  { phrase: 'on the last day of the month', hint: '0 0 L * *' },
  // ─── Ranged ──────────────────────────────────────────────────────────────
  { phrase: 'every 5 minutes from 9am to 5pm',  hint: '*/5 9-17 * * *' },
  { phrase: 'every 15 minutes from 8am to 6pm', hint: '*/15 8-18 * * *' },
  { phrase: 'every 30 minutes from 9am to 5pm', hint: '*/30 9-17 * * *' },
  // ─── Specific months ─────────────────────────────────────────────────────
  { phrase: 'every January 1st',  hint: '0 0 1 1 *' },
  { phrase: 'in January',         hint: '0 0 1 1 *' },
  { phrase: 'in June',            hint: '0 0 1 6 *' },
  { phrase: 'in December',        hint: '0 0 1 12 *' },
]
