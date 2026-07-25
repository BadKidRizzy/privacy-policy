const APPLE_ASSOCIATION_PATHS = new Set([
  '/.well-known/apple-app-site-association',
  '/apple-app-site-association',
]);

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const {pathname} = new URL(request.url);

    if (!response.ok || !APPLE_ASSOCIATION_PATHS.has(pathname)) {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/json; charset=utf-8');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
