# Run APEX Locally With Docker

This guide is for running APEX on your own computer without installing the app directly.

## What You Need

- Docker Desktop installed and running.
- An Anthropic API key if you want analysis and chat to work.

The dashboard can open without the API key, but `Analyse & recommend` and the chat assistant need it.

## First-Time Setup

Copy the example environment file:

```text
cp .env.example .env.local
```

Open `.env.local` and replace the placeholder with the real key:

```text
APEX_API_KEY=your_real_key_here
APEX_MODEL=claude-sonnet-4-6
```

Do not share this file or commit it to Git.

## Start The App

Run:

```text
docker compose --env-file .env.local up --build
```

When it finishes starting, open:

```text
http://localhost:3000
```

## Stop The App

Press `Ctrl+C` in the terminal.

If it keeps running in the background, run:

```text
docker compose down
```

## Run Without An API Key

If you only want to view the interface:

```text
docker compose up --build
```

The dashboard will load, but analysis and chat will fail until `APEX_API_KEY` is provided.

## Common Issues

If the page does not open:

- Check Docker Desktop is running.
- Check the terminal says the app is ready.
- Open `http://localhost:3000`, not the internal container address.

If analysis fails:

- Check `.env.local` exists.
- Check `APEX_API_KEY` is filled in.
- Check `APEX_MODEL` is `claude-sonnet-4-6`.
- Restart with `docker compose --env-file .env.local up --build`.

If port 3000 is already busy:

Change this line in `docker-compose.yml`:

```text
"3000:3000"
```

to:

```text
"3001:3000"
```

Then open:

```text
http://localhost:3001
```
