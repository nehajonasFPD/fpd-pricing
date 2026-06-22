# APEX Usage Guide

This guide explains how to use APEX to produce a pricing brief. It assumes you do not code.

## What You Need Before Starting

Prepare these files:

1. Looker Studio CSV export.
2. Sellerboard Products export.
3. Optional Product Bible spreadsheet if you want incoming stock shown.

Best results come from using both Looker and Sellerboard. Product Bible is optional.

## Open The App

If APEX is already deployed, open:

```text
http://fpd-pricing-apex.167.233.109.59.sslip.io/dashboard
```

If the login screen appears, enter the shared APEX password from the technical owner.

If someone is running it locally, ask them to start the app and give you a browser link. It usually looks like:

```text
http://localhost:3000
```

For Docker-based local setup, see `docs/LOCAL_DOCKER.md`.

For production hosting details, see `docs/COOLIFY_DEPLOYMENT.md`.

## Dashboard Overview

The dashboard has three tabs:

| Tab | Use It For |
| --- | --- |
| Data inputs | Upload files and add manual notes |
| Recommendations | Review SKU actions after analysis |
| Slack message | Copy the formatted pricing brief |

There is also a round `A` chat button in the bottom-right corner. Use it after an analysis has run.

## Step 1: Upload Files

Open the `Data inputs` tab.

Upload:

- `Looker Studio CSV`
- `Sellerboard export`
- `Product Bible (Stock ETA)` if available

You can either click each upload box or drag the file onto it.

When a file is accepted, the box shows it as loaded.

## Step 2: Add Manual Notes

Use the manual notes box for anything the data does not know.

Examples:

- `Hold price on SKU ABC until the June restock arrives.`
- `Prioritise margin this week over volume.`
- `Avoid deals on products already committed to a Prime event.`
- `Clear slow-moving winter lines if stock is above 60 DOS.`

Manual notes are optional, but useful when leadership direction or seasonal context matters.

## Step 3: Run The Analysis

Click `Analyse & recommend`.

APEX will switch to the `Recommendations` tab and show a loading message while it works.

If the analysis succeeds, you will see:

- Total SKUs reviewed
- Raise price count
- Drop or deal count
- Stock alert count
- A table of SKU recommendations

## Step 4: Review Recommendations

Use the filter buttons above the table:

| Filter | Shows |
| --- | --- |
| All | Every analysed SKU |
| Raise | SKUs where price may be increased |
| Drop / deal | SKUs that may need a lower price or promotion |
| Hold | SKUs with no urgent action |
| Alerts | Low-stock SKUs |

Important columns:

| Column | Meaning |
| --- | --- |
| SKU | Product identifier |
| Action | APEX recommendation |
| DOS | Days of stock remaining |
| Margin | Profit margin |
| ACOS | Advertising cost of sales |
| BSR | Amazon Best Sellers Rank, where lower is usually better |
| Net P&L | Net profit or loss |
| Price | Current average selling price |
| Stock | Current stock |
| Reasoning | Short explanation for the recommendation |

Check the recommendation before making pricing changes, especially if the SKU is strategic, newly launched, seasonal, or affected by incoming stock.

## Step 5: Create The Slack Brief

From the `Recommendations` tab, click `Generate Slack message`.

APEX will open the `Slack message` tab.

The message is formatted for `#ppc` and includes:

- Summary counts
- Stock alerts
- Raise price recommendations
- Drop price recommendations
- Deal recommendations
- Holds
- Incoming stock if Product Bible data was uploaded
- Next review date

Click `Copy message`, then paste it into Slack.

APEX does not post to Slack automatically.

## Step 6: Use The APEX Chat

After analysis has run, click the round `A` button in the bottom-right corner.

You can ask questions such as:

- `Which SKUs should we raise first?`
- `Show me the worst loss-makers.`
- `What stock is running low?`
- `Which deals should we run this week?`

The chat only knows about the currently loaded brief. If you refresh the page or start a new analysis, the context changes.

## Recommended Review Habits

- Always upload the latest exports.
- Check the date range before running the analysis.
- Review stock alerts before price increases.
- Treat negative net profit as high priority.
- Check unusually strong recommendations against Sellerboard or Amazon before acting.
- Keep the Slack message concise, but add human context before posting if needed.

## What Not To Do

- Do not upload old exports by mistake.
- Do not paste real API keys into the manual notes box.
- Do not assume APEX has changed prices. It only recommends actions.
- Do not post recommendations externally.
- Do not commit or share uploaded pricing files.

## For The Person Running The App Locally

These commands are only for the person starting or maintaining the app.

Install the app once:

```text
npm install
```

Start it for local use:

```text
npm run dev
```

Check it can build:

```text
npm run build
```

The app also needs these environment variables before the protected dashboard, analysis, and chat will work:

```text
APEX_API_KEY
APEX_PASSWORD
APEX_SESSION_SECRET
APEX_COOKIE_SECURE
```
