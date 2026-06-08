let redirectingToLogin = false;

export async function apiFetch(endpoint, options = {}) {
  // Read token directly from local storage if available
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('forex-auto-panel-user') : null;
  let token = null;

  if (userStr) {
    try {
      const storedUser = JSON.parse(userStr);
      token = storedUser?.token || null;

      if (!token) {
        localStorage.removeItem('forex-auto-panel-user');
        localStorage.removeItem('forex-auto-panel-authenticated');
        document.cookie = 'forex-auto-panel-token=; path=/; max-age=0; SameSite=Lax';
      }
    } catch {
      localStorage.removeItem('forex-auto-panel-user');
      localStorage.removeItem('forex-auto-panel-authenticated');
      document.cookie = 'forex-auto-panel-token=; path=/; max-age=0; SameSite=Lax';
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Combine NEXT_PUBLIC_API_URL and endpoint
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  try {
    console.log('API URL:', url);

    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers,
    });

    if (response.status === 401 && !redirectingToLogin) {
      if (typeof window !== 'undefined') {
        redirectingToLogin = true;
        localStorage.removeItem('forex-auto-panel-user');
        localStorage.removeItem('forex-auto-panel-authenticated');
        document.cookie = 'forex-auto-panel-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';

        const current = window.location.pathname + window.location.search;
        if (
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/signup')
        ) {
          window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
        } else {
          redirectingToLogin = false;
        }
      }
    }

    return response;
  } catch (error) {
    console.warn(`API unavailable: ${url}`, error);

    return new Response(
      JSON.stringify({
        message: 'API server is unavailable',
        url,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
