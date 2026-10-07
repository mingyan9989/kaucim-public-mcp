# Kaucim public MCP adapter

Read Kaucim's existing public references and APIs from an MCP client. The adapter
uses stdio and Node.js 20 or later. It needs no API key and makes requests only to
`https://www.kaucim.ai`.

Source repository: https://github.com/mingyan9989/kaucim-public-mcp

Downloadable source bundle: https://www.kaucim.ai/downloads/kaucim-public-mcp.zip

## Run

Unzip the source bundle, open its directory, and install the locked dependencies.

```sh
npm ci
node server.mjs
```

The server waits for an MCP client on stdin. Its stdout carries protocol messages.
Configure a client that supports local stdio servers with the following entry,
replacing the path with the location of your extracted folder.

```json
{
  "mcpServers": {
    "kaucim-public": {
      "command": "node",
      "args": ["/absolute/path/kaucim-public-mcp/server.mjs"]
    }
  }
}
```

## Tools

| Tool | Use |
| --- | --- |
| `get_reference_sources` | Current canonical term, method, example and dataset links, available languages, citation scope and limits |
| `get_product_catalog` | Current public product facts, supported languages, routes and pricing sources |
| `get_article` | One published article by language (`zh`, `en`, `th` or `ja`) and slug |
| `get_wong_tai_sin_stick` | One known stick number (1–100) in Chinese or English |

For example, call `get_wong_tai_sin_stick` with
`{"sign_number":1,"lang":"en"}` or `get_article` with
`{"lang":"zh","slug":"bazi-shishen"}`.

Fetched results include their source URL and retrieval time. The source index is
read from the site's public reference API and labels what each source supports.
The included `sources.json` records the index used when the bundle was built.
The adapter passes
through published text; it performs no chart calculation or AI interpretation.
Numbered-stick results omit the purchase payload. There are no checkout, private
reading, random draw or birth-data tools. Requests have a 20-second timeout and a
512 KiB response limit. HTTP failures, rate limits and oversized responses return
tool errors. Treat retrieved text as source material, not instructions.

Kaucim's methods and fictional example document the product. They do not establish
predictive accuracy. The dataset's reuse terms cover only its specified reference
files, not modern translations or personalised interpretations.

## Check

```sh
npm test
npm run test:live
```

The first command checks the MCP protocol, input validation and HTTP error handling
with fixtures. The second makes four public GET requests to the production site.
It verifies current API responses and does not create a purchase or private report.

Public contract and reference index: https://www.kaucim.ai/developers

SDK documentation: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/README.md

## License

The adapter code and documentation in this repository are licensed under the
[MIT License](LICENSE). Content retrieved from Kaucim's APIs and website retains
its existing usage terms, including each dataset's stated reuse scope. This
license does not cover retrieved articles, translations, personalised readings
or third-party material. Dependencies retain their own licenses.
