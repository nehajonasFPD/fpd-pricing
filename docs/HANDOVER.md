# APEX Pricing Intelligence Handover

This document explains what APEX is, what it needs to run, and what the next owner should know. It is written for an operator or manager, not a developer.

## What APEX Does

APEX is an internal pricing brief tool for First Point Distribution's Amazon UK pricing workflow.

It takes marketplace exports, analyses SKU-level profitability, and creates:

- A recommendation table showing whether each SKU should be raised, dropped, held, put into a deal, or flagged for stock risk.
- A Slack-ready pricing message for the `#ppc` channel.
- A chat assistant that can answer questions about the latest loaded pricing brief.

APEX is a decision-support tool. It should help the team review pricing faster, but pricing changes should still be checked by a person before they are actioned.

## Who Uses It

Primary users:

- Pricing team
- PPC team
- Marketplace leadership
- Anyone preparing the recurring Amazon UK repricing brief

The tool is designed around a twice-weekly pricing review rhythm.

## Data Sources

APEX currently expects these files:

| File | Required | Purpose |
| --- | --- | --- |
| Looker Studio CSV | Recommended | Stock, DOS, GP, GM %, TACOS, sales, product line, ASIN, SKU |
| Sellerboard export | Recommended | Net profit, margin, Real ACOS, BSR, sessions, sales, average price, SKU |
| Product Bible | Optional | Stock ETA calendar, extracted from the `Stock ETA` sheet |

The dashboard says Looker and Sellerboard are required, but the app will run if at least one of those two files is uploaded. Best results come from uploading both.

## Output Categories

APEX gives each SKU one main recommendation:

| Recommendation | Meaning |
| --- | --- |
| Stock alert | Days of stock are low and the SKU needs attention before any pricing move |
| Raise price | Profitability signals are healthy and there may be room to increase price |
| Drop price | The SKU is losing money or margin is weak with enough stock to justify action |
| Run deal | Traffic or stock conditions suggest a deal may help conversion or clearance |
| Hold | No urgent pricing action based on the available data |

## How The Analysis Works

The analysis is powered by the Anthropic API using the environment variable `APEX_API_KEY`.

At a high level, APEX:

1. Reads the uploaded files.
2. Converts spreadsheet uploads into CSV text.
3. Sends the uploaded data and pricing rules to the AI model.
4. Receives a structured list of SKU recommendations.
5. Displays the results and builds a Slack message.

The current pricing rules are:

- Stock alert: DOS under 15.
- Raise: positive net profit, margin above 22%, Real ACOS under 9%, and DOS at least 25.
- Drop: negative net profit, or margin under 8% with DOS at least 45.
- Deal: Real ACOS above 14% with over 500 sessions, or DOS at least 60 with margin under 18%.
- Hold: everything else with meaningful sales.

## Important Limitations

- The analysis route currently sends only the first 100 rows from each uploaded Looker and Sellerboard file to the AI model.
- The tool depends on the uploaded file columns matching the expected export structure.
- Product Bible support depends on a sheet name containing `Stock ETA`; if that is missing, the first sheet is used.
- The Slack message is copied manually. APEX does not post to Slack by itself.
- The chat assistant can only answer from the currently loaded brief. It is not connected to live Sellerboard, Looker, Amazon, or Slack.
- Uploaded data is processed in the running app session. Do not commit real pricing exports, customer data, or API keys to the repository.

## Environment And Access

APEX needs an Anthropic API key stored as:

```text
APEX_API_KEY
```

For local use, this normally lives in `.env.local`.

For production, it should be stored in the hosting provider's secret manager.

Do not paste the real key into documents, Slack, commits, screenshots, or support tickets.

## Files Worth Knowing About

| File | What It Does |
| --- | --- |
| `app/page.jsx` | Landing page |
| `app/dashboard/page.jsx` | Uploads, analysis button, recommendations table, Slack message, chat window |
| `app/api/upload/route.js` | Reads CSV, XLS, and XLSX files |
| `app/api/analyse/route.js` | Sends pricing data to the Anthropic API for recommendations |
| `app/api/chat/route.js` | Sends dashboard context to the APEX chat assistant |
| `app/layout.js` | Page title and global page styling |
| `package.json` | App scripts and dependencies |

## Routine Operating Process

1. Export the latest Looker Studio CSV.
2. Export the latest Sellerboard Products file.
3. Optional: prepare the latest Product Bible file if incoming stock should be included.
4. Open APEX.
5. Upload the files.
6. Add manual notes if leadership or seasonal context matters.
7. Run the analysis.
8. Review recommendations.
9. Generate and copy the Slack message.
10. Paste the message into `#ppc`.
11. Sense-check the recommendations before changing prices.

## Handover Checklist

Before handing APEX to a new owner, confirm:

- They know where to get each export.
- They know which date range to use.
- They can open the dashboard.
- The API key is configured in the running environment.
- They understand that recommendations need human review.
- They know who to contact if the app fails.
- They have access to `#ppc` if they are responsible for posting the brief.
- They understand not to share or commit real pricing exports.

## Suggested Owner Responsibilities

Business owner:

- Confirms pricing rules are still correct.
- Decides review cadence.
- Approves final pricing action.

Operator:

- Prepares exports.
- Runs APEX.
- Posts the Slack brief.
- Flags bad or unexpected recommendations.

Technical owner:

- Maintains the app.
- Keeps the API key working.
- Fixes upload, build, deployment, or AI response issues.
- Updates this documentation when the workflow changes.

