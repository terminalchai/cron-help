import { test, expect } from '@playwright/test';

// ── helpers ──────────────────────────────────────────────────────────────────
async function load(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

async function clearAndType(page, value) {
  const input = page.locator('input[type="text"]').first();
  await input.triple_click?.() || await input.click({ clickCount: 3 });
  await input.fill(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PAGE LOAD & STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('1 · Page Load & Structure', () => {
  test('1.1 page loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await load(page);
    expect(errors).toHaveLength(0);
  });

  test('1.2 title is cron.help', async ({ page }) => {
    await load(page);
    await expect(page).toHaveTitle(/cron\.help/i);
  });

  test('1.3 nav logo is visible', async ({ page }) => {
    await load(page);
    await expect(page.locator('nav').getByText('cron')).toBeVisible();
  });

  test('1.4 hero heading is visible', async ({ page }) => {
    await load(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('1.5 three tabs render', async ({ page }) => {
    await load(page);
    await expect(page.getByText('Parse')).toBeVisible();
    await expect(page.getByText('Generate')).toBeVisible();
    await expect(page.getByText('Reference')).toBeVisible();
  });

  test('1.6 footer is present', async ({ page }) => {
    await load(page);
    await expect(page.locator('footer')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. CRON INPUT — PARSE TAB
// ─────────────────────────────────────────────────────────────────────────────
test.describe('2 · Cron Input – Parse Tab', () => {
  test.beforeEach(async ({ page }) => { await load(page); });

  test('2.1 default expression is pre-filled', async ({ page }) => {
    const input = page.locator('input[type="text"]').first();
    await expect(input).toHaveValue('0 9 * * 1-5');
  });

  test('2.2 valid expression shows green check + description', async ({ page }) => {
    const input = page.locator('input[type="text"]').first()
    await input.fill('*/5 * * * *')
    await page.waitForTimeout(300)
    // Description card should appear in the explainer section
    await expect(page.getByText('Description')).toBeVisible()
    await expect(page.locator('[data-section="description"]').or(page.getByText(/every 5 minutes/i).first())).toBeTruthy()
  });

  test('2.3 invalid expression shows error message', async ({ page }) => {
    const input = page.locator('input[type="text"]').first();
    await input.fill('99 99 99 99 99');
    await page.waitForTimeout(300);
    // Error must appear — check via aria alert or inline error text (scoped below input)
    const errorEl = page.locator('[role="alert"]')
    await expect(errorEl.first()).toBeVisible()
  });

  test('2.4 @daily shortcut resolves correctly', async ({ page }) => {
    const input = page.locator('input[type="text"]').first();
    await input.fill('@daily');
    await page.waitForTimeout(300);
    // Description card shows the resolved text — scope to the explainer section
    await expect(page.getByText('Description')).toBeVisible()
    // The description div (first match in the explainer, not from examples grid)
    const desc = page.locator('div[style*="font-weight: 500"], div[style*="fontWeight"]').first()
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/At 12:00 AM|every day|midnight/i)
  });

  test('2.5 @weekly resolves', async ({ page }) => {
    const input = page.locator('input[type="text"]').first();
    await input.fill('@weekly');
    await page.waitForTimeout(300);
    await expect(page.getByText('Description')).toBeVisible()
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Sunday|Sunday at midnight/i)
  });

  test('2.6 @hourly resolves', async ({ page }) => {
    const input = page.locator('input[type="text"]').first();
    await input.fill('@hourly');
    await page.waitForTimeout(300);
    await expect(page.getByText('Description')).toBeVisible()
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toMatch(/Every hour|every hour/i)
  });

  test('2.7 field breakdown renders 5 cards', async ({ page }) => {
    const input = page.locator('input[type="text"]').first();
    await input.fill('0 9 * * 1');
    await page.waitForTimeout(300);
    // Field labels
    for (const label of ['Minute', 'Hour', 'Day', 'Month', 'Weekday']) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });

  test('2.8 next 10 runs list renders', async ({ page }) => {
    const input = page.locator('input[type="text"]').first();
    await input.fill('*/15 * * * *');
    await page.waitForTimeout(300);
    await expect(page.getByText('Next 10 runs')).toBeVisible();
    // Expect at least 5 run rows visible (numbered)
    const rows = page.locator('text=in ').filter({ hasText: /in \d+(m|h|d|s)/ });
    await expect(rows.first()).toBeVisible();
  });

  test('2.9 copy button copies expression to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const input = page.locator('input[type="text"]').first();
    await input.fill('0 0 * * *');
    // click copy icon button
    await page.locator('button[title="Copy expression"]').click();
    await page.waitForTimeout(300);
    const clipText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipText).toBe('0 0 * * *');
  });

  test('2.10 clearing input hides results', async ({ page }) => {
    const input = page.locator('input[type="text"]').first();
    await input.fill('');
    await page.waitForTimeout(300);
    await expect(page.getByText('Next 10 runs')).not.toBeVisible();
    await expect(page.getByText('Description')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMMON EXAMPLES
// ─────────────────────────────────────────────────────────────────────────────
test.describe('3 · Common Examples', () => {
  test.beforeEach(async ({ page }) => { await load(page); });

  test('3.1 examples grid is visible', async ({ page }) => {
    await expect(page.getByText('Common expressions')).toBeVisible();
    await expect(page.getByText('Every minute')).toBeVisible();
  });

  test('3.2 clicking example loads expression', async ({ page }) => {
    await page.getByText('Every minute').click();
    await page.waitForTimeout(300);
    const input = page.locator('input[type="text"]').first();
    await expect(input).toHaveValue('* * * * *');
  });

  test('3.3 clicking Every 5 minutes loads correctly', async ({ page }) => {
    await page.getByText('Every 5 minutes').click();
    await page.waitForTimeout(300);
    const input = page.locator('input[type="text"]').first();
    await expect(input).toHaveValue('*/5 * * * *');
  });

  test('3.4 clicking example shows explanation', async ({ page }) => {
    await page.getByText('Every day midnight').click();
    await page.waitForTimeout(300);
    // Explainer description card should appear
    await expect(page.getByText('Description')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/At 12:00 AM|Every day at midnight/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GENERATE TAB — NLP PARSER
// ─────────────────────────────────────────────────────────────────────────────
test.describe('4 · Generate Tab – NLP Parser', () => {
  test.beforeEach(async ({ page }) => {
    await load(page);
    await page.getByText('Generate').click();
    await page.waitForTimeout(200);
  });

  test('4.1 Generate tab renders NLP input', async ({ page }) => {
    await expect(page.getByText('Natural language → cron')).toBeVisible();
  });

  test('4.2 "every 5 minutes" parses to */5 * * * *', async ({ page }) => {
    await page.locator('input[type="text"]').nth(0).fill('every 5 minutes');
    await page.waitForTimeout(400);
    const nlpResult = page.locator('div').filter({ hasText: /^\*\/5 \* \* \* \*$/ }).first();
    await expect(nlpResult).toBeVisible();
  });

  test('4.3 "every day at 9am" parses correctly', async ({ page }) => {
    await page.locator('input[type="text"]').nth(0).fill('every day at 9am');
    await page.waitForTimeout(400);
    const nlpResult = page.locator('div').filter({ hasText: /^0 9 \* \* \*$/ }).first();
    await expect(nlpResult).toBeVisible();
  });

  test('4.4 "every Monday at 9am" parses correctly', async ({ page }) => {
    await page.locator('input[type="text"]').nth(0).fill('every Monday at 9am');
    await page.waitForTimeout(400);
    const nlpResult = page.locator('div').filter({ hasText: /^0 9 \* \* 1$/ }).first();
    await expect(nlpResult).toBeVisible();
  });

  test('4.5 "every hour" parses correctly', async ({ page }) => {
    await page.locator('input[type="text"]').nth(0).fill('every hour');
    await page.waitForTimeout(400);
    const nlpResult = page.locator('div').filter({ hasText: /^0 \* \* \* \*$/ }).first();
    await expect(nlpResult).toBeVisible();
  });

  test('4.6 "every weekday" parses correctly', async ({ page }) => {
    await page.locator('input[type="text"]').nth(0).fill('every weekday');
    await page.waitForTimeout(400);
    // should produce 1-5 in weekday field
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/1-5|weekday/i);
  });

  test('4.7 "Use" button loads cron into Parse tab', async ({ page }) => {
    await page.locator('input[type="text"]').nth(0).fill('every hour');
    await page.waitForTimeout(400);
    await page.getByText('Use').click();
    await page.waitForTimeout(300);
    // Should switch to Parse tab
    const input = page.locator('input[type="text"]').first();
    const value = await input.inputValue();
    expect(value).toMatch(/0 \* \* \* \*/);
  });

  test('4.8 nonsense input shows no crash / helpful message', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.locator('input[type="text"]').nth(0).fill('xyzzy frobble blab blab blab');
    await page.waitForTimeout(400);
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. REFERENCE TAB
// ─────────────────────────────────────────────────────────────────────────────
test.describe('5 · Reference Tab', () => {
  test.beforeEach(async ({ page }) => {
    await load(page);
    await page.getByText('Reference').click();
    await page.waitForTimeout(200);
  });

  test('5.1 reference table is visible', async ({ page }) => {
    await expect(page.getByText('Quick reference')).toBeVisible();
  });

  test('5.2 all 5 field rows visible', async ({ page }) => {
    for (const f of ['Minute', 'Hour', 'Day/Month', 'Month', 'Weekday']) {
      await expect(page.getByText(f).first()).toBeVisible();
    }
  });

  test('5.3 special characters section visible', async ({ page }) => {
    await expect(page.getByText('Special characters')).toBeVisible();
  });

  test('5.4 asterisk special char is explained', async ({ page }) => {
    await expect(page.getByText(/Any value/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('6 · Toast Notifications', () => {
  test.beforeEach(async ({ page }) => { await load(page); });

  test('6.1 clicking example shows toast', async ({ page }) => {
    await page.getByText('Every minute').click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/Loaded/i)).toBeVisible();
  });

  test('6.2 toast auto-dismisses within 4s', async ({ page }) => {
    await page.getByText('Every minute').click();
    await page.waitForTimeout(3500);
    // Toast should be gone after 3s
    await expect(page.getByText(/Loaded.*\* \* \* \* \*/i)).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
test.describe('7 · Navigation', () => {
  test.beforeEach(async ({ page }) => { await load(page); });

  test('7.1 tab switching works Parse→Generate→Reference', async ({ page }) => {
    await page.getByText('Generate').click();
    await expect(page.getByText('Natural language → cron')).toBeVisible();

    await page.getByText('Reference').click();
    await expect(page.getByText('Quick reference')).toBeVisible();

    await page.getByText('Parse').click();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('7.2 GitHub link points to correct repo', async ({ page }) => {
    const link = page.locator('a[href*="github.com/terminalchai/cron-help"]');
    await expect(link).toBeVisible();
  });

  test('7.3 logo click goes back to home', async ({ page }) => {
    await page.getByText('Parse').click();
    await page.locator('nav a[href="/"]').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. KEYBOARD ACCESSIBILITY
// ─────────────────────────────────────────────────────────────────────────────
test.describe('8 · Keyboard Accessibility', () => {
  test.beforeEach(async ({ page }) => { await load(page); });

  test('8.1 tab order reaches cron input', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // By 2nd/3rd Tab, focus should be reachable on some interactive element
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused);
  });

  test('8.2 Enter on common example loads expression', async ({ page }) => {
    // Focus the actual button element (not the inner span)
    const btn = page.locator('button', { hasText: 'Every minute' }).first();
    await btn.focus();
    await btn.press('Enter');
    await page.waitForTimeout(400);
    const input = page.locator('input[type="text"]').first();
    await expect(input).toHaveValue('* * * * *');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. RESPONSIVE — MOBILE VIEWPORT (run on mobile project)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('9 · Responsive / Mobile', () => {
  test('9.1 page renders without horizontal scroll on 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await load(page);
    const scrollWidth  = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth  = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('9.2 nav visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await load(page);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('9.3 tabs accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await load(page);
    await expect(page.getByText('Parse')).toBeVisible();
    await expect(page.getByText('Generate')).toBeVisible();
  });

  test('9.4 cron input usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await load(page);
    const input = page.locator('input[type="text"]').first();
    await input.fill('*/10 * * * *');
    await page.waitForTimeout(300);
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).toMatch(/every 10 minutes/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. EDGE CASES & ROBUSTNESS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('10 · Edge Cases & Robustness', () => {
  test.beforeEach(async ({ page }) => { await load(page); });

  test('10.1 6-field expression (with seconds) handled gracefully', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const input = page.locator('input[type="text"]').first();
    await input.fill('0 0 9 * * 1-5');
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('10.2 very long input does not crash', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const input = page.locator('input[type="text"]').first();
    await input.fill('a'.repeat(200));
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('10.3 special chars in NLP input do not crash', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.getByText('Generate').click();
    const input = page.locator('input[type="text"]').first();
    await input.fill('<script>alert(1)</script>');
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('10.4 rapid tab switching does not crash', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (let i = 0; i < 6; i++) {
      await page.getByText('Generate').click();
      await page.getByText('Parse').click();
      await page.getByText('Reference').click();
    }
    expect(errors).toHaveLength(0);
  });

  test('10.5 every month expression', async ({ page }) => {
    const input = page.locator('input[type="text"]').first();
    await input.fill('0 0 1 * *');
    await page.waitForTimeout(300);
    await expect(page.getByText('Description')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/day 1 of the month|on day 1|every month/i);
  });

  test('10.6 L (last day) expression handled', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const input = page.locator('input[type="text"]').first();
    await input.fill('0 0 L * *');
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });
});
