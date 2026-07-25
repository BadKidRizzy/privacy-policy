const APPLE_ASSOCIATION_PATHS = new Set([
  '/.well-known/apple-app-site-association',
  '/apple-app-site-association',
]);
const APPLE_ASSOCIATION_JSON = '__APPLE_ASSOCIATION_JSON__';

export default {
  async fetch(request, env) {
    const {pathname} = new URL(request.url);

    if (APPLE_ASSOCIATION_PATHS.has(pathname)) {
      return new Response(APPLE_ASSOCIATION_JSON, {
        headers: {
          'Cache-Control': 'public, max-age=300',
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
