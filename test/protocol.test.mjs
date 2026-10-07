import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const client = new Client({ name: 'kaucim-protocol-test', version: '0.1.0' });
before(async () => {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('./fixture-server.mjs', import.meta.url))] }));
});
after(async () => client.close());
const call = (name, args = {}) => client.callTool({ name, arguments: args });
const data = (response) => JSON.parse(response.content[0].text);

test('stdio handshake exposes four read-only tools without purchase tools', async () => {
  const { tools } = await client.listTools();
  assert.equal(tools.length, 4);
  assert.ok(tools.every((tool) => tool.annotations.readOnlyHint && !tool.annotations.destructiveHint));
  assert.ok(!tools.some((tool) => /checkout|report|random/.test(tool.name)));
  const response = data(await call('get_reference_sources'));
  assert.equal(response.data.sources.length, 6);
  assert.ok(response.data.sources.every((source) => source.limits && Object.keys(source.urls).length > 0));
});

test('catalog and Markdown carry source URL and retrieval time', async () => {
  const catalog = data(await call('get_product_catalog'));
  assert.equal(catalog.source_url, 'https://www.kaucim.ai/api/products.json');
  assert.ok(Number.isFinite(Date.parse(catalog.retrieved_at)));
  const article = data(await call('get_article', { lang: 'zh', slug: 'bazi-shishen' }));
  assert.ok(article.data.startsWith('# Published article'));
});

test('numbered lookup does not draw and omits purchase payload', async () => {
  const response = data(await call('get_wong_tai_sin_stick', { sign_number: 1, lang: 'en' }));
  assert.equal(response.data.drawn, false);
  assert.equal(response.data.sign_number, 1);
  assert.equal(response.data.paid_reading, undefined);
});

test('reject path traversal, unsupported locales and out-of-range stick numbers', async () => {
  for (const [name, args] of [
    ['get_article', { lang: 'en', slug: '../admin' }],
    ['get_article', { lang: 'ko', slug: 'bazi-shishen' }],
    ['get_wong_tai_sin_stick', { sign_number: 0, lang: 'en' }],
    ['get_wong_tai_sin_stick', { sign_number: 101, lang: 'en' }],
  ]) {
    const response = await call(name, args);
    assert.equal(response.isError, true);
  }
});

test('Japanese and Thai articles use their documented public language routes', async () => {
  for (const lang of ['ja', 'th']) {
    const response = data(await call('get_article', { lang, slug: 'fixture-article' }));
    assert.equal(response.source_url, `https://www.kaucim.ai/api/article-md/${lang}/fixture-article`);
    assert.ok(response.data.startsWith('# Published article'));
  }
});

test('preserve HTTP failures and retry instructions as tool errors', async () => {
  const missing = await call('get_article', { lang: 'en', slug: 'missing' });
  assert.equal(missing.isError, true);
  assert.match(missing.content[0].text, /HTTP 404/);
  const limited = await call('get_article', { lang: 'en', slug: 'limited' });
  assert.equal(limited.isError, true);
  assert.match(limited.content[0].text, /HTTP 429.*Retry after 60/);
});

test('reject oversized responses, HTML and network failures', async () => {
  for (const [slug, pattern] of [['oversized', /512 KiB/], ['html', /content type/], ['unavailable', /Network unavailable/]]) {
    const response = await call('get_article', { lang: 'en', slug });
    assert.equal(response.isError, true);
    assert.match(response.content[0].text, pattern);
  }
});
