# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 14 App Router project for the APEX pricing intelligence tool.

- `app/page.jsx` contains the landing page.
- `app/dashboard/page.jsx` contains the client-side pricing dashboard and upload workflow.
- `app/api/upload/route.js` parses CSV/XLS/XLSX uploads.
- `app/api/analyse/route.js` sends pricing data to the Anthropic API and returns SKU recommendations.
- `app/api/chat/route.js` powers the APEX assistant chat.
- `app/layout.js` defines global metadata and page shell styling.
- `next.config.js` and `package.json` hold configuration and scripts.

There is no dedicated `tests/` or assets directory yet. Add them when needed.

## Build, Test, and Development Commands

Run commands from the repository root:

- `npm install` installs Next.js, React, and `xlsx`.
- `npm run dev` starts the local development server.
- `npm run build` creates a production build and catches framework errors.
- `npm run start` serves the production build after `npm run build`.

No `npm test` or lint script is currently defined. If you add tests or linting, update `package.json` and this guide in the same change.

## Coding Style & Naming Conventions

Use JavaScript and JSX, matching the existing files. Prefer 2-space indentation, single quotes, and semicolons omitted unless needed for clarity. Keep App Router files named by convention: `page.jsx`, `layout.js`, and `route.js`.

Use React component names in `PascalCase` such as `UploadBox` and `Badge`. Use helper functions in `camelCase`, for example `parseEtaCSV` or `uploadFile`. Keep API route handlers explicit with exported `POST` functions.

## Testing Guidelines

There is no automated test framework configured. For now, verify changes with:

1. `npm run build`
2. `npm run dev`
3. Manual browser checks for upload, analysis, dashboard display, and chat.

When adding tests, prefer colocated tests such as `app/dashboard/page.test.jsx` or a top-level `tests/` directory, and document the chosen runner.

## Commit & Pull Request Guidelines

Recent history uses short upload-style messages, so keep future commits concise and imperative, for example `Add pricing dashboard validation` or `Fix upload parsing error`.

Pull requests should include a summary, testing notes, required environment variables, and screenshots for UI changes. Link related issues when available. Never include real pricing exports, customer data, or secrets in commits or PR descriptions.

## Security & Configuration Tips

The API routes expect `APEX_API_KEY` in the environment for Anthropic requests. Store secrets in `.env.local` for local development and in the deployment provider's secret manager for production. Do not hard-code keys or commit uploaded spreadsheet data.
