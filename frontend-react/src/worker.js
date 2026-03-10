export default {
  async fetch(request, env) {
    // Serve static assets built by Vite from ./dist.
    const response = await env.ASSETS.fetch(request);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return response;
    }

    const defaultApiBase = 'https://backend-java-zkqa.onrender.com/api';
    const apiBase = typeof env.VITE_API_BASE === 'string' && env.VITE_API_BASE.trim()
      ? env.VITE_API_BASE.trim()
      : defaultApiBase;

    // Inject runtime config for frontend API base without requiring rebuild.
    const script = `<script>window.__VITE_API_BASE=${JSON.stringify(apiBase)};</script>`;
    return new HTMLRewriter()
      .on('head', {
        element(element) {
          element.append(script, { html: true });
        },
      })
      .transform(response);
  },
};
