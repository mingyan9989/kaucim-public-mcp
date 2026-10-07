import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const client = new Client({ name: 'kaucim-live-check', version: '0.1.0' });
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('../server.mjs', import.meta.url))] }));
  for (const [name, args] of [
    ['get_reference_sources', {}],
    ['get_product_catalog', {}],
    ['get_article', { lang: 'zh', slug: 'bazi-shishen' }],
    ['get_wong_tai_sin_stick', { sign_number: 1, lang: 'en' }],
  ]) {
    const response = await client.callTool({ name, arguments: args });
    assert.ok(!response.isError, `${name}: ${response.content[0]?.text}`);
    const value = JSON.parse(response.content[0].text);
    assert.ok(value.source_url.startsWith('https://www.kaucim.ai/'));
    if (name === 'get_reference_sources') assert.ok(value.data.sources.length >= 6);
    if (name === 'get_product_catalog') assert.ok(value.data.products.length > 0);
    if (name === 'get_article') assert.ok(value.data.length > 100);
    if (name === 'get_wong_tai_sin_stick') {
      assert.equal(value.data.drawn, false);
      assert.equal(value.data.sign_number, 1);
      assert.equal(value.data.paid_reading, undefined);
    }
    console.log(JSON.stringify({ tool: name, status: 'passed', source_url: value.source_url, retrieved_at: value.retrieved_at ?? null }));
  }
} finally {
  await client.close();
}
