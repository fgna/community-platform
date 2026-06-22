import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!@#';
const MEMBER_EMAIL = 'alice@example.com';
const MEMBER_PASSWORD = 'Member123!@#';

// ── helpers ─────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

// ── page render ──────────────────────────────────────────────────────────────

test.describe('Auth pages render', () => {
  test('redirects unauthenticated users from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders all expected elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('register page renders all expected elements', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('login page links to register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('register page links to login', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── login validation ──────────────────────────────────────────────────────────

test.describe('Login — client-side validation', () => {
  test('shows required field errors when submitting empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });
});

// ── login flows ───────────────────────────────────────────────────────────────

test.describe('Login — authentication flows', () => {
  test('login with wrong password shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/^password$/i).fill('WrongPassword1!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 10000 });
  });

  test('login with non-existent email shows error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill('nobody@example.com');
    await page.getByLabel(/^password$/i).fill('SomePass1!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 10000 });
  });

  test('admin login succeeds and redirects to dashboard', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('member login succeeds and redirects to dashboard', async ({ page }) => {
    await loginAs(page, MEMBER_EMAIL, MEMBER_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('authenticated user is not redirected away from dashboard', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// ── register validation ───────────────────────────────────────────────────────

test.describe('Register — client-side validation', () => {
  test('shows required field errors on empty submit', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('shows password mismatch error', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/^password$/i).fill('Password1!');
    await page.getByLabel(/confirm password/i).fill('Password2!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('shows complexity error for password without uppercase', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/^password$/i).fill('password1!');
    await page.getByLabel(/confirm password/i).fill('password1!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/uppercase/i)).toBeVisible();
  });

  test('shows complexity error for password without a number', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/^password$/i).fill('PasswordOnly!');
    await page.getByLabel(/confirm password/i).fill('PasswordOnly!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/number/i)).toBeVisible();
  });
});

// ── register flows ────────────────────────────────────────────────────────────

test.describe('Register — account creation flows', () => {
  test('duplicate email shows conflict error', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Duplicate');
    await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/^password$/i).fill('Password1!');
    await page.getByLabel(/confirm password/i).fill('Password1!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/already registered|conflict/i)).toBeVisible({ timeout: 10000 });
  });

  test('successful registration redirects to dashboard', async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('E2E Test User');
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel(/^password$/i).fill('TestPass1!');
    await page.getByLabel(/confirm password/i).fill('TestPass1!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });
});

// ── logout ─────────────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test('logout clears session and redirects to login', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Dismiss any modal overlays (onboarding wizard, dialogs) that block interaction
    const overlay = page.locator('[data-state="open"].fixed.inset-0');
    for (let i = 0; i < 3; i++) {
      const skipBtn = page.getByRole('button', { name: /skip|close|dismiss|later/i });
      if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await skipBtn.click();
        await overlay.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
      }
      if (!(await overlay.isVisible().catch(() => false))) break;
      // Try pressing Escape as fallback
      await page.keyboard.press('Escape');
      await overlay.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
    }

    // Click logout in sidebar
    const logoutBtn = page.getByRole('button', { name: /log out|sign out|logout/i });
    await logoutBtn.click({ force: true, timeout: 10000 });

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
