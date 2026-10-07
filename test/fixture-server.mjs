import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createServer } from '../server.mjs';
import { readFile } from 'node:fs/promises';

const sources = JSON.parse(await readFile(new URL('../sources.json', import.meta.url), 'utf8'));

const json = (data) => Response.json(data);
await createServer({ fetchImpl: async (url, options) => {
  if (!url.startsWith('https://www.kaucim.ai/') || options.method !== 'GET' || options.redirect !== 'error') {
    throw new Error('Unexpected destination or request method.');
  }
  if (url.includes('/missing')) return new Response('', { status: 404 });
  if (url.includes('/limited')) return new Response('', { status: 429, headers: { 'Retry-After': '60' } });
  if (url.includes('/oversized')) return new Response('x'.repeat(512 * 1024 + 1), { headers: { 'Content-Type': 'text/markdown' } });
  if (url.includes('/html')) return new Response('<html>Login</html>', { headers: { 'Content-Type': 'text/html' } });
  if (url.includes('/unavailable')) throw new Error('Network unavailable.');
  if (url.includes('/api/products.json')) return json({ schemaVersion: 'fixture', products: [{ id: 'ziwei' }] });
  if (url.includes('/api/reference-sources.json')) return json({ schemaVersion: 'fixture', sources });
  if (url.includes('/api/article-md/')) return new Response('# Published article\nFixture text.', { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
  if (url.includes('/api/agent/draw?oracle=wong_tai_sin&sign_number=1&lang=en')) {
    return json({ drawn: false, sign_number: 1, poem: 'Reference verse', paid_reading: { product_id: 'private-purchase-fixture' } });
  }
  throw new Error('Unexpected public route.');
} }).connect(new StdioServerTransport());
