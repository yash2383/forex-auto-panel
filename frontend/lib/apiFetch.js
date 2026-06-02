export async function apiFetch(endpoint, options = {}) {
  // Read token directly from local storage if available
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('tradebot-user') : null;
  let token = null;

  if (userStr) {
    try {
      const storedUser = JSON.parse(userStr);
      token = storedUser?.token || null;

      if (!token) {
        localStorage.removeItem('tradebot-user');
        localStorage.removeItem('tradebot-authenticated');
        document.cookie = 'tradebot-token=; path=/; max-age=0; SameSite=Lax';
      }
    } catch {
      localStorage.removeItem('tradebot-user');
      localStorage.removeItem('tradebot-authenticated');
      document.cookie = 'tradebot-token=; path=/; max-age=0; SameSite=Lax';
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

    return await fetch(url, {
      ...options,
      headers,
    });
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
