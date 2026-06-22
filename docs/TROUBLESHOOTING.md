# APEX Troubleshooting Guide

Use this guide when APEX does not behave as expected. It is written for non-coders first, with a small technical section at the end.

## Quick Checks

Before investigating deeply, check these first:

- Are you using the latest Looker and Sellerboard exports?
- Did at least one file show as loaded in the dashboard?
- Is your internet connection working?
- Has the Anthropic API key been configured?
- Did you upload a supported file type: CSV, XLS, or XLSX?
- Are you trying to use chat before running an analysis?

## Problem: The Upload Does Not Work

Possible causes:

- The file type is not supported.
- The file is open, locked, or still downloading.
- The spreadsheet is corrupted.
- The wrong file was uploaded to the wrong box.

What to try:

1. Download the export again.
2. Close the file if it is open in Excel or Numbers.
3. Upload Looker as CSV.
4. Upload Sellerboard as CSV or XLSX.
5. Upload Product Bible as XLSX or XLS.
6. Refresh APEX and try again.

If Product Bible does not work, check that it contains a `Stock ETA` sheet. If that sheet is missing, APEX may read the first sheet instead.

## Problem: The Analyse Button Is Disabled

This usually means no recognised data source has been loaded.

What to try:

1. Upload the Looker CSV again.
2. Upload the Sellerboard export again.
3. Confirm the upload box says the file is loaded.
4. Refresh the page if the dashboard seems stuck.

## Problem: Analysis Says No Data Was Provided

This means APEX did not receive readable data from the upload step.

What to try:

1. Re-export the files.
2. Use CSV where possible.
3. Avoid editing the export before uploading.
4. Check that the files are not blank.
5. Try Looker alone, then Sellerboard alone, to identify which file is causing the issue.

## Problem: Analysis Failed

Possible causes:

- The API key is missing or wrong.
- The AI service is temporarily unavailable.
- The uploaded export format changed.
- The AI response was not readable as a recommendation table.

What to try:

1. Wait one minute and run the analysis again.
2. Refresh the page and upload the files again.
3. Confirm the files have the expected columns.
4. Ask the technical owner to check whether `APEX_API_KEY` is configured.
5. Ask the technical owner to check the app logs.

## Problem: Results Look Incomplete

The current app focuses on the top SKUs and sends the first 100 lines of the Looker and Sellerboard uploads for analysis.

What to check:

- Is the missing SKU outside the first part of the export?
- Was the export sorted differently than expected?
- Does the SKU have zero sales and zero stock?
- Is the SKU named differently between Looker and Sellerboard?
- Is the SKU missing from one of the uploaded files?

Workaround:

- Sort the export so the most important SKUs appear near the top before uploading.
- Re-run APEX.
- Ask the technical owner if the 100-line limit should be increased.

## Problem: A SKU Recommendation Seems Wrong

Possible causes:

- The data export is old.
- The SKU has unusual context not present in the files.
- Sellerboard and Looker use different SKU or ASIN values.
- Product Bible stock information is out of date.
- The recommendation is technically valid but commercially inappropriate.

What to try:

1. Check the source values in Looker and Sellerboard.
2. Add manual notes and re-run the analysis.
3. Check stock position and incoming stock.
4. Ask APEX chat why the SKU was recommended.
5. Use human judgement before changing price.

## Problem: Slack Message Is Empty

The Slack message is created after analysis runs.

What to try:

1. Go to `Data inputs`.
2. Upload files.
3. Click `Analyse & recommend`.
4. Wait for recommendations to appear.
5. Click `Generate Slack message`.
6. Go to the `Slack message` tab again.

## Problem: Copy Message Does Nothing

Possible causes:

- The browser blocked clipboard access.
- The Slack message has not been generated yet.
- The page is not active or focused.

What to try:

1. Click inside the browser window.
2. Click `Copy message` again.
3. If copying still fails, manually highlight the message text and copy it.
4. Paste into Slack.

## Problem: Incoming Stock Is Missing

Incoming stock appears only if Product Bible data was uploaded and readable.

What to check:

- Was Product Bible uploaded?
- Does it contain a `Stock ETA` sheet?
- Are the ETA dates in a readable format?
- Are there future ETA dates?
- Are the columns named like `SKU`, `Qty`, `W/C ETA`, and `Back in Stock?`?

## Problem: Chat Says No Data Is Loaded

The chat assistant only works properly after recommendations are created.

What to try:

1. Upload files.
2. Run the analysis.
3. Wait for recommendations to appear.
4. Open the chat again.

## Problem: Chat Gives A Weak Or Generic Answer

Possible causes:

- No analysis has run yet.
- The specific SKU is not in the current brief.
- The chat context is limited to the recommendation results, not the full raw export.

What to try:

1. Ask about a SKU shown in the table.
2. Ask a more specific question.
3. Re-run the analysis with better manual notes.
4. Check the original source export if you need detail that is not shown in APEX.

## Problem: The Page Will Not Open

If using a hosted version:

1. Check the link is correct.
2. Refresh the browser.
3. Try another browser.
4. Ask whether the deployment is currently down.

If using a local version:

1. Ask the person running it whether the local server is still active.
2. Confirm the URL, usually `http://localhost:3000`.
3. Ask them to restart the app.

## When To Escalate

Escalate to the technical owner if:

- Uploads repeatedly fail with valid exports.
- Analysis fails for everyone.
- The API key needs changing.
- APEX gives no results from normal files.
- The hosted app is down.
- The pricing rules need to change.
- The 100-line analysis limit is too restrictive.

## Technical Owner Checks

These checks are for whoever maintains the app.

Confirm dependencies are installed:

```text
npm install
```

Run the local server:

```text
npm run dev
```

Run a production build check:

```text
npm run build
```

Confirm the environment contains:

```text
APEX_API_KEY
```

Check these app areas if issues continue:

| Area | File |
| --- | --- |
| Upload parsing | `app/api/upload/route.js` |
| AI analysis | `app/api/analyse/route.js` |
| Chat assistant | `app/api/chat/route.js` |
| Dashboard workflow | `app/dashboard/page.jsx` |

Security reminder: do not print, screenshot, commit, or paste the real API key into tickets or Slack.

