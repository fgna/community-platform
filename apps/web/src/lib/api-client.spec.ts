import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock axios before importing api-client
vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  const requestInterceptors: Array<(c: any) => any> = [];
  const responseInterceptors: Array<[(r: any) => any, (e: any) => any]> = [];

  const mockInstance = {
    interceptors: {
      request: {
        use: vi.fn((fn: (c: any) => any) => { requestInterceptors.push(fn); return 0; }),
        _handlers: requestInterceptors,
      },
      response: {
        use: vi.fn((ok: (r: any) => any, err: (e: any) => any) => {
          responseInterceptors.push([ok, err]); return 0;
        }),
        _handlers: responseInterceptors,
      },
    },
    defaults: { headers: { common: {} } },
    _requestInterceptors: requestInterceptors,
    _responseInterceptors: responseInterceptors,
  };

  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => mockInstance),
      post: vi.fn(),
    },
  };
});

vi.mock('@/store/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      isAuthenticated: false,
      clearAuth: vi.fn(),
    })),
  },
}));

describe('api-client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('creates an axios instance with JSON content type and 30s timeout', async () => {
    const axios = (await import('axios')).default;
    await import('./api-client');
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        timeout: 30000,
        withCredentials: true,
      }),
    );
  });

  it('registers request and response interceptors', async () => {
    const mod = await import('./api-client');
    const client = mod.default;
    expect(client.interceptors.request.use).toHaveBeenCalled();
    expect(client.interceptors.response.use).toHaveBeenCalled();
  });

  describe('request interceptor', () => {
    it('attaches Bearer token when setAccessToken was called', async () => {
      const mod = await import('./api-client');
      mod.setAccessToken('test-token');

      const calls = vi.mocked(mod.default.interceptors.request.use).mock.calls as any;
      const [interceptorFn] = calls[calls.length - 1]; // latest registration
      const config = { headers: {} };
      const result = interceptorFn(config);
      expect(result.headers.Authorization).toBe('Bearer test-token');

      mod.clearAccessToken();
    });

    it('leaves Authorization unset when clearAccessToken was called', async () => {
      const mod = await import('./api-client');
      mod.clearAccessToken();

      const calls = vi.mocked(mod.default.interceptors.request.use).mock.calls as any;
      const [interceptorFn] = calls[calls.length - 1]; // latest registration
      const config = { headers: {} };
      const result = interceptorFn(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });
});
