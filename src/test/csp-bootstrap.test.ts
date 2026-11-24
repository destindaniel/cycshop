import { describe, expect, it } from 'vitest';
import { synchronizeScriptNonces } from '@/lib/csp-html';
import { secureResponse } from '@/lib/security-headers';

describe('Bootstrap CSP response consistency', () => {
  it('synchronizes missing and stale script nonces without changing executable bootstrap data', () => {
    const payload = 'window.$_TSR={hydrated:false};window.fixture="<script nonce=old>";';
    const html = `<html><head><meta property="csp-nonce" content="stale"></head><body><script data-tsr-stream-part>${payload}</script><script nonce="stale" type="module" src="/entry.js"></script></body></html>`;
    const result = synchronizeScriptNonces(html, 'fresh-nonce');
    expect(result).toContain(`<script data-tsr-stream-part nonce="fresh-nonce">${payload}</script>`);
    expect(result).toContain('<script nonce="fresh-nonce" type="module" src="/entry.js">');
    expect(result).toContain('<meta property="csp-nonce" content="fresh-nonce">');
    expect(synchronizeScriptNonces(result, 'fresh-nonce')).toBe(result);
  });

  it('keeps bootstrap scripts at the end of a streamed response aligned with the header', async () => {
    const chunks = ['<html><body><scr', 'ipt nonce="previous">window.$_TSR={h(){}};</script>', '<script type="module" src="/entry.js"></script></body></html>'];
    const stream = new ReadableStream<Uint8Array>({ start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    } });
    const response = await secureResponse(new Request('https://cycshop.lovable.app/'), new Response(stream, { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600' } }), 'current-nonce');
    expect(response.headers.get('Content-Security-Policy')).toContain("'nonce-current-nonce'");
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const html = await response.text();
    expect(html).toContain('<script nonce="current-nonce">window.$_TSR={h(){}};</script>');
    expect(html).toContain('<script type="module" src="/entry.js" nonce="current-nonce">');
    expect(response.headers.get('Content-Security-Policy')).not.toContain("script-src 'unsafe-inline'");
  });
});