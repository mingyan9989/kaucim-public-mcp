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

## Reproduce the BaZi chart check

The September 2026 BaZi chart check includes 60 archived responses to 12 fictional Hong Kong birth dates. Each row records the model's extracted year, month, day, and hour pillars alongside Kaucim's archived engine output. Use the CSV to reproduce the five group totals, or use the original answers to test your own parser. The figures describe agreement under the study's rules and recorded model versions. The inputs avoid Zi-hour and solar-term month boundaries. [Study method and original answers](https://www.kaucim.ai/en/bazi/ai-chart-check?utm_source=github&utm_medium=referral&utm_campaign=bazi_chart_check)

Download the [comparison CSV](https://www.kaucim.ai/data/bazi-chart-check-2026-09.csv). Put it in your current directory and run the following with Python 3.

```sh
python3 - bazi-chart-check-2026-09.csv <<'PY'
import csv
import sys
from collections import defaultdict

pillars = ("year", "month", "day", "hour")
totals = defaultdict(lambda: [0, 0, 0])

with open(sys.argv[1], encoding="utf-8", newline="") as source:
    for record in csv.DictReader(source, strict=True):
        group = (record["language"], record["model"])
        expected = [record[f"reference_{pillar}"] for pillar in pillars]
        extracted = [record[f"extracted_{pillar}"] for pillar in pillars]
        totals[group][0] += 1
        if not all(extracted):
            totals[group][2] += 1
        elif extracted == expected:
            totals[group][1] += 1

for (language, model), (responses, matches, incomplete) in sorted(totals.items()):
    print(f"{language} {model}: {matches}/{responses} match, {incomplete} incomplete")
PY
```

For example, the archived English ChatGPT response for 15 December 1997 at 06:45 Hong Kong time agrees on the year, month, and hour. Its day pillar is 辛丑, while the archived reference gives 辛卯. Inspect the original response before deciding whether an extracted discrepancy comes from the answer or the extraction rule.

To inspect this example side by side, use the Gregorian calendar and enter 15 December 1997 in Kaucim's chart comparison. Choose Female and the `05:00–07:00` birth-hour option. Paste `丁丑 壬子 辛丑 辛卯`, select **Fill the four fields**, then **Compare the pillars**. [Open the BaZi comparison tool](https://www.kaucim.ai/en/bazi/compare?utm_source=github&utm_medium=referral&utm_campaign=bazi_chart_check)

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
