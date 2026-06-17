import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!@#';
const MEMBER_EMAIL = 'alice@example.com';
const MEMBER_PASSWORD = 'Member123!@#';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

// ── UX-001: Settings profile form pre-population ─────────────────────────────

test.fixme('UX-001: settings form pre-populates name from user profile', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASSWORD);
  await page.goto('/settings');
  await page.getByRole('tab', { name: /profile/i }).click();

  // Wait for profile data to arrive from the API
  const nameInput = page.locator('#name');
  await expect(nameInput).toBeVisible({ timeout: 5000 });

  // The name field must not be empty once the profile query has resolved
  await expect(async () => {
    const value = await nameInput.inputValue();
    expect(value.trim()).not.toBe('');
  }).toPass({ timeout: 5000 });
});

// ── UX-003: Dashboard shows content, not infinite skeleton ───────────────────

test('UX-003: dashboard renders content cards after login', async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  // Stats cards should render with actual values (not just "—")
  await expect(page.getByText('Total Members')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Community Posts')).toBeVisible({ timeout: 10000 });

  // "RECENT POSTS" section heading should appear once loading finishes
  await expect(page.getByText('RECENT POSTS')).toBeVisible({ timeout: 10000 });
});

// ── UX-004: Message button on member profile ─────────────────────────────────

test('UX-004: member profile has a Message button for other users', async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  // Fetch user list from the API to find a non-admin member's ID
  const memberId = await page.evaluate(async () => {
    const token = localStorage.getItem('auth-token') ??
      JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.accessToken;
    const res = await fetch(
      (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/users?page=1&limit=50',
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const users: Array<{ id: string; role: string }> = json.data ?? json.users ?? json;
    const member = users.find((u) => u.role !== 'ADMIN');
    return member?.id ?? null;
  });

  expect(memberId, 'Seed data must contain a non-admin member').toBeTruthy();

  await page.goto(`/members/${memberId}`);
  await expect(page.getByRole('button', { name: /message/i })).toBeVisible({ timeout: 10000 });
});

// ── UX-005: Post permalink / detail view ─────────────────────────────────────

test.fixme('UX-005: feed posts have a clickable link to a detail view', async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto('/feed');

  // Wait for at least one post to render
  const post = page.locator('article').first();
  await expect(post).toBeVisible({ timeout: 10000 });

  // The post should contain a link to its detail page (/feed/<id> or /posts/<id>)
  const permalink = post.locator('a[href*="/feed/"], a[href*="/posts/"]');
  await expect(permalink).toBeVisible();
});

// ── UX-006: Cookie consent does not re-appear after acceptance ───────────────

test('UX-006: cookie banner stays dismissed after acceptance', async ({ page }) => {
  await page.goto('/login');

  // Wait for the cookie banner to appear (1-second delay built into the component)
  const banner = page.getByText('Cookie Preferences');
  await expect(banner).toBeVisible({ timeout: 5000 });

  // Accept all cookies
  await page.getByRole('button', { name: /accept all/i }).click();

  // Banner should disappear
  await expect(banner).not.toBeVisible({ timeout: 3000 });

  // Navigate to a different page
  await page.goto('/register');
  await page.waitForLoadState('networkidle');

  // Banner should NOT re-appear
  await page.waitForTimeout(2000); // wait longer than the 1s delay in CookieBanner
  await expect(banner).not.toBeVisible();
});

// ── UX-007: Logout button has accessible name ────────────────────────────────

test('UX-007: sidebar logout button is accessible by role and name', async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  // On desktop viewport the sidebar is always visible
  // The logout button should be findable via accessible name
  const logoutBtn = page.getByRole('button', { name: /log\s?out|sign\s?out/i });
  await expect(logoutBtn).toBeVisible({ timeout: 5000 });
});

// ── UX-008: Members directory has inline search ──────────────────────────────

test.fixme('UX-008: members page has a search or filter input', async ({ page }) => {
  await loginAs(page, MEMBER_EMAIL, MEMBER_PASSWORD);
  await page.goto('/members');

  // Wait for members to load
  await expect(page.getByText(/members in the community/i)).toBeVisible({ timeout: 10000 });

  // A search/filter input should exist on the page
  const searchInput = page.getByPlaceholder(/search|filter/i);
  await expect(searchInput).toBeVisible();
});
