import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// ── Fake timers control async delays in AuthContext (500ms/1000ms/1200ms) ──
beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
  localStorage.clear();
  jest.restoreAllMocks();
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// Helper: advance past the initial 500ms session-restore delay and flush effects
const waitForSessionRestore = async () => {
  await act(async () => {
    jest.advanceTimersByTime(500);
    await Promise.resolve(); // flush microtasks
  });
};

// Helper: run a signIn call to completion
const signIn = async (
  current: ReturnType<typeof useAuth>,
  email = 'user@example.com',
  password = 'pass123'
) => {
  await act(async () => {
    const promise = current.signIn(email, password);
    jest.advanceTimersByTime(1000);
    await promise;
  });
};

// Helper: run a signUp call to completion
const signUp = async (
  current: ReturnType<typeof useAuth>,
  email = 'new@example.com',
  password = 'pass123',
  name = 'New User'
) => {
  await act(async () => {
    const promise = current.signUp(email, password, name);
    jest.advanceTimersByTime(1200);
    await promise;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// useAuth guard
// ─────────────────────────────────────────────────────────────────────────────
describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    // Suppress console.error for expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    spy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Session restore (initial useEffect)
// ─────────────────────────────────────────────────────────────────────────────
describe('Session restore', () => {
  it('starts with isAuthenticated false and no user when localStorage is empty', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('restores user from localStorage when valid JSON is present', async () => {
    const savedUser = {
      id: '42',
      email: 'saved@example.com',
      name: 'Saved User',
      subscription: { plan: 'free', status: 'active' },
      settings: { notifications: true, darkMode: false, language: 'en', timezone: 'UTC' },
    };
    localStorage.setItem('ats_user', JSON.stringify(savedUser));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('saved@example.com');
    expect(result.current.user?.name).toBe('Saved User');
  });

  it('removes malformed JSON from localStorage and stays unauthenticated', async () => {
    localStorage.setItem('ats_user', '{invalid json...');

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('ats_user')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// signIn
// ─────────────────────────────────────────────────────────────────────────────
describe('signIn', () => {
  it('authenticates user with valid credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    await signIn(result.current, 'alice@example.com', 'password123');

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('alice@example.com');
  });

  it('derives name from email prefix', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    await signIn(result.current, 'johndoe@company.com', 'password123');

    expect(result.current.user?.name).toBe('johndoe');
  });

  it('sets free subscription plan by default', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    await signIn(result.current);

    expect(result.current.user?.subscription.plan).toBe('free');
    expect(result.current.user?.subscription.status).toBe('active');
  });

  it('persists user to localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    await signIn(result.current, 'test@example.com', 'mypassword');

    const stored = JSON.parse(localStorage.getItem('ats_user') || '{}');
    expect(stored.email).toBe('test@example.com');
  });

  it('throws when password is too short (< 6 chars)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    await expect(
      act(async () => {
        const promise = result.current.signIn('user@example.com', '12345');
        jest.advanceTimersByTime(1000);
        await promise;
      })
    ).rejects.toThrow('Invalid email or password');
  });

  it('throws when email is empty', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    await expect(
      act(async () => {
        const promise = result.current.signIn('', 'password123');
        jest.advanceTimersByTime(1000);
        await promise;
      })
    ).rejects.toThrow('Invalid email or password');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// signUp
// ─────────────────────────────────────────────────────────────────────────────
describe('signUp', () => {
  it('creates user with trimmed name', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    await signUp(result.current, 'bob@example.com', 'securepass', '  Bob Smith  ');

    expect(result.current.user?.name).toBe('Bob Smith');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('persists user to localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    await signUp(result.current, 'carol@example.com', 'password', 'Carol');

    const stored = JSON.parse(localStorage.getItem('ats_user') || '{}');
    expect(stored.email).toBe('carol@example.com');
  });

  it('throws when password is too short', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    await expect(
      act(async () => {
        const promise = result.current.signUp('new@example.com', 'abc', 'Name');
        jest.advanceTimersByTime(1200);
        await promise;
      })
    ).rejects.toThrow();
  });

  it('throws when name is blank/whitespace', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    await expect(
      act(async () => {
        const promise = result.current.signUp('new@example.com', 'password123', '   ');
        jest.advanceTimersByTime(1200);
        await promise;
      })
    ).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// signOut
// ─────────────────────────────────────────────────────────────────────────────
describe('signOut', () => {
  it('clears user and sets isAuthenticated to false', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();
    await signIn(result.current);

    act(() => {
      result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('removes ats_user from localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();
    await signIn(result.current);

    act(() => {
      result.current.signOut();
    });

    expect(localStorage.getItem('ats_user')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateUserSettings
// ─────────────────────────────────────────────────────────────────────────────
describe('updateUserSettings', () => {
  it('merges new settings into existing user settings', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();
    await signIn(result.current);

    act(() => {
      result.current.updateUserSettings({ darkMode: true, language: 'es' });
    });

    expect(result.current.user?.settings.darkMode).toBe(true);
    expect(result.current.user?.settings.language).toBe('es');
    // Unrelated settings preserved
    expect(result.current.user?.settings.notifications).toBe(true);
  });

  it('persists updated settings to localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();
    await signIn(result.current);

    act(() => {
      result.current.updateUserSettings({ darkMode: true });
    });

    const stored = JSON.parse(localStorage.getItem('ats_user') || '{}');
    expect(stored.settings.darkMode).toBe(true);
  });

  it('does nothing when user is not authenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitForSessionRestore();

    // No user set — calling updateUserSettings should not throw
    act(() => {
      result.current.updateUserSettings({ darkMode: true });
    });

    expect(result.current.user).toBeNull();
  });
});
