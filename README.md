# AiTutoring

The tutoring site at [mario-belmonte.com/tutoring](https://mario-belmonte.com/tutoring). SvelteKit 5, fully static, **no backend services** — no database, no payment processor, no webhooks, no environment variables.

## How booking works

1. **Pick a time.** Open slots are generated in the browser from the weekly hours in `tutor.ts`, written in the tutor's time zone and shown in the visitor's.
2. **Details.** Name, email, topic, goals, video platform.
3. **Pay & send.** One-tap Venmo / Cash App links with the amount and a note filled in, or the Zelle address with a copy button. Then *send booking request* opens the student's email app with a pre-written request to the tutor.
4. **Done.** Add-to-calendar (Google, or an `.ics` for Apple/Outlook), plus a copy-the-request fallback if no mail app opened.

The in-progress booking is saved to the student's own `localStorage`, so jumping out to Venmo and back loses nothing. The tutor confirms each request by replying — if two people ask for the same slot, the second gets offered another time.

## Editing the site

Everything lives in **`apps/web/src/lib/data/tutor.ts`**:

| What | Where |
|---|---|
| Venmo / Cash App / Zelle handles | `payments` — a blank handle is hidden, never shown as a placeholder |
| Weekly hours, time zone, notice period, days away | `availability` |
| Price and session length | `session` |
| Subjects, steps, FAQ, resources, bio | the rest of the file |

## Commands

```bash
npm install
npm run dev      # http://localhost:5173/tutoring
npm run check    # svelte-check — run before committing
npm run build    # static output via adapter-vercel
```

## Deployment

Vercel builds the `apps/web` workspace (see `vercel.json`) and serves it at `tutoring.mario-belmonte.com`. The portfolio proxies `/tutoring/*` there — its `vercel.json` and `Caddyfile` rewrites — which is why `svelte.config.js` sets `paths.base = '/tutoring'`.

## Layout

```
apps/web/src/
├── lib/
│   ├── data/tutor.ts          # all content + config
│   ├── schedule.ts            # weekly hours → bookable instants (Intl, DST-safe, no deps)
│   ├── booking.ts             # pay links, request email, .ics / Google Calendar
│   ├── sound.ts, storage.ts, toast.svelte.ts
│   └── components/            # Nav, Footer, Toast, SessionDemo (hero animation), WaveCheckeredBackground
└── routes/
    ├── +page.svelte           # landing
    └── book/+page.svelte      # booking flow
```

`app.css` and `WaveCheckeredBackground.svelte` are copied from the portfolio repo so the two sites share one design system and both themes; update them there first.
