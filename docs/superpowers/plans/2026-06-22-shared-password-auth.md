# Shared Password Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protect the APEX dashboard and API routes with one shared password.

**Architecture:** Use `APEX_PASSWORD` for login and `APEX_SESSION_SECRET` to sign an HTTP-only cookie. Middleware blocks `/dashboard`, and API routes call a shared auth helper before processing uploads, analysis, or chat.

**Tech Stack:** Next.js 14 App Router, Web Crypto HMAC, Node's built-in test runner.

---

### Task 1: Auth Helper

**Files:**
- Create: `lib/auth.mjs`
- Create: `tests/auth.test.mjs`
- Modify: `package.json`

- [x] Add tests for signed session cookie creation, verification, and tamper rejection.
- [x] Implement a small Web Crypto based HMAC helper.
- [x] Add `npm test` using Node's built-in test runner.

### Task 2: Login And Logout

**Files:**
- Create: `app/login/page.jsx`
- Create: `app/api/login/route.js`
- Create: `app/api/logout/route.js`

- [x] Add a password form that posts to `/api/login`.
- [x] Set the signed HTTP-only session cookie on successful login.
- [x] Clear the cookie on logout.

### Task 3: Route Protection

**Files:**
- Create: `middleware.js`
- Modify: `app/api/upload/route.js`
- Modify: `app/api/analyse/route.js`
- Modify: `app/api/chat/route.js`
- Modify: `app/dashboard/page.jsx`

- [x] Redirect unauthenticated dashboard visits to `/login`.
- [x] Return `401` for unauthenticated API requests.
- [x] Add a dashboard logout button.

### Task 4: Documentation And Verification

**Files:**
- Modify: `.env.example`
- Modify: `docs/COOLIFY_DEPLOYMENT.md`
- Modify: `docs/USAGE.md`
- Modify: `docs/LOCAL_DOCKER.md`

- [x] Document required auth environment variables.
- [x] Run `npm test` and `npm run build`.
