# AiTutoring

A production-ready tutoring booking and payment site deployed at [mario-belmonte.com/tutoring](https://mario-belmonte.com/tutoring). Built as a monorepo with SvelteKit, Stripe Checkout, and Calendly.

---

## Table of Contents

1. [Why Not GitHub Pages](#1-why-not-github-pages)
2. [Architecture Overview](#2-architecture-overview)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Prerequisites](#4-prerequisites)
5. [Local Development](#5-local-development)
6. [Environment Variables](#6-environment-variables)
7. [Stripe Setup](#7-stripe-setup)
8. [Calendly Setup](#8-calendly-setup)
9. [Vercel Deployment — AiTutoring](#9-vercel-deployment--aitutoring)
10. [Domain Migration — portfolioSite](#10-domain-migration--portfoliosite)
11. [Testing Payments Locally](#11-testing-payments-locally)
12. [Going Live](#12-going-live)
13. [Optional: Supabase Booking Database](#13-optional-supabase-booking-database)
14. [Optional: Confirmation Emails with Resend](#14-optional-confirmation-emails-with-resend)

---

## 1. Why Not GitHub Pages

GitHub Pages only serves **static files** — HTML, CSS, and JavaScript. A tutoring booking site needs two things that static hosting cannot provide:

| Requirement | Why it needs a server |
|---|---|
| **Scheduling** | A database must record which time slots are booked so two users can't book the same slot. |
| **Payments** | Your Stripe secret key must stay on the server. Putting it in client-side JS exposes it to anyone who opens DevTools. |

The solution is to keep your monorepo but switch from GitHub Pages to **Vercel**, which hosts both a static/SSR frontend and serverless API functions for free under generous limits.

---

## 2. Architecture Overview

```
Browser
  │
  ├─── mario-belmonte.com          ← portfolioSite (Vercel Project A)
  │       │  vercel.json rewrites
  │       └─── /tutoring/*  ──────► aitutoring.vercel.app/tutoring/*
  │                                    │
  │                                    ├── GET  /tutoring            → Landing page (SSR)
  │                                    ├── GET  /tutoring/book       → Calendly embed
  │                                    ├── GET  /tutoring/checkout   → Pricing cards
  │                                    ├── POST /tutoring/api/create-checkout-session
  │                                    │         └── calls Stripe API (server-side)
  │                                    │               └── returns { url } → browser redirects
  │                                    │
  │                              Stripe hosted page
  │                                    │
  │                                    ├── GET  /tutoring/success    → Confirmation
  │                                    └── GET  /tutoring/cancel     → Retry page
  │
  └─── POST /tutoring/api/stripe-webhook  ← Stripe calls this after payment
                                               └── verifies signature
                                               └── TODO: send email / save to DB
```

**Key design choices:**

- **SvelteKit with `base = '/tutoring'`** — all routes and asset URLs are prefixed with `/tutoring`, so they work correctly when proxied from the portfolio domain.
- **Stripe Checkout** — Stripe hosts the payment form. You never handle raw card numbers; your server only creates a session and receives a webhook after payment.
- **Calendly embed** — Calendly handles timezone detection, calendar syncing, and reminder emails. The embed is a single `<div>` + script tag.
- **No database required** — for a solo tutor this setup works out of the box. Supabase integration is documented as an optional add-on.

---

## 3. Monorepo Structure

```
AiTutoring/
├── apps/
│   └── web/                        # SvelteKit app (frontend + API routes)
│       ├── src/
│       │   ├── app.html            # HTML shell (theme flash prevention script)
│       │   ├── app.css             # Global design system (matches portfolioSite)
│       │   ├── app.d.ts            # SvelteKit app type declarations
│       │   ├── lib/
│       │   │   ├── components/
│       │   │   │   ├── Nav.svelte               # Sticky frosted-glass header
│       │   │   │   ├── Footer.svelte            # Footer with email copy
│       │   │   │   └── WaveCheckeredBackground.svelte  # Animated canvas background
│       │   │   ├── data/
│       │   │   │   └── tutor.ts    # All site content: subjects, pricing, FAQ, steps
│       │   │   └── server/
│       │   │       └── stripe.ts   # Stripe client singleton (server-only)
│       │   └── routes/
│       │       ├── +layout.svelte  # Wraps every page with Nav + Footer
│       │       ├── +layout.ts      # SSR configuration
│       │       ├── +page.svelte    # Landing page (hero, subjects, pricing, FAQ)
│       │       ├── book/
│       │       │   └── +page.svelte      # Calendly inline embed
│       │       ├── checkout/
│       │       │   └── +page.svelte      # Pricing cards + Stripe redirect
│       │       ├── success/
│       │       │   ├── +page.server.ts   # Fetches Stripe session details (server)
│       │       │   └── +page.svelte      # Post-payment confirmation UI
│       │       ├── cancel/
│       │       │   └── +page.svelte      # Payment cancelled UI
│       │       └── api/
│       │           ├── create-checkout-session/
│       │           │   └── +server.ts    # POST → creates Stripe Checkout Session
│       │           └── stripe-webhook/
│       │               └── +server.ts    # POST ← Stripe calls this after payment
│       ├── static/                 # Public assets (favicon, images)
│       ├── svelte.config.js        # SvelteKit config (adapter-vercel, base path)
│       ├── vite.config.ts          # Vite config
│       ├── tsconfig.json
│       ├── package.json
│       └── .env.example            # Copy to .env and fill in your keys
├── packages/
│   └── shared/                     # Shared TypeScript types
│       └── src/index.ts            # BookingSession, CheckoutResponse, etc.
├── package.json                    # Workspace root (npm workspaces)
├── vercel.json                     # Vercel build config for the monorepo
└── README.md
```

### Why each file exists

| File | Purpose |
|---|---|
| `apps/web/src/app.css` | The global design system — CSS custom properties, typography, animations. Matches mario-belmonte.com exactly. |
| `apps/web/src/lib/data/tutor.ts` | Single source of truth for all content: subjects, pricing tiers, FAQ answers, step descriptions. Edit this file to update copy without touching UI code. |
| `apps/web/src/lib/server/stripe.ts` | The Stripe Node.js client. Importing from `$lib/server/` ensures SvelteKit never bundles it into client-side JavaScript. |
| `apps/web/src/routes/api/create-checkout-session/+server.ts` | The only server route that touches your Stripe secret key. Creates a Checkout Session and returns the hosted URL. |
| `apps/web/src/routes/api/stripe-webhook/+server.ts` | Receives POST requests from Stripe's servers after a payment completes. Verifies the `Stripe-Signature` header to prevent spoofed events. |
| `vercel.json` | Tells Vercel which workspace to build and where to find the output. Also contains path rewrites so `/tutoring/*` routes to `/`. |

---

## 4. Prerequisites

- **Node.js 18+** — check with `node --version`
- **npm 8+** (comes with Node 18) — needed for workspaces
- **A Vercel account** — free at [vercel.com](https://vercel.com)
- **A Stripe account** — free at [dashboard.stripe.com](https://dashboard.stripe.com)
- **A Calendly account** — free at [calendly.com](https://calendly.com)
- **Stripe CLI** (optional, for webhook testing) — [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)

---

## 5. Local Development

```bash
# 1. Clone the repo
git clone https://github.com/Qrytics/AiTutoring.git
cd AiTutoring

# 2. Install all workspace dependencies from the monorepo root
npm install

# 3. Create your local environment file
cp apps/web/.env.example apps/web/.env
# Then open apps/web/.env and fill in your Stripe test keys and Calendly URL

# 4. Start the dev server
npm run dev
```

The site will be available at **http://localhost:5173/tutoring**.

Because `base = '/tutoring'` is set in `svelte.config.js`, all routes are served under the `/tutoring` prefix even locally. This matches production behavior.

### Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start SvelteKit dev server with HMR |
| `npm run build` | Production build (outputs to `apps/web/.vercel/output`) |
| `npm run preview` | Preview the production build locally |
| `npm run check` | TypeScript + Svelte type checking |

---

## 6. Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env` and fill in each value.

| Variable | Where to get it | Required |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys → Secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Created when you register the webhook endpoint (Step 7d) | ✅ |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys → Publishable key | ✅ |
| `STRIPE_PRICE_ID_SINGLE` | Stripe Dashboard → Products → [your product] → Price ID | ✅ |
| `STRIPE_PRICE_ID_BUNDLE` | Stripe Dashboard → Products → [your product] → Price ID | ✅ |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe Dashboard → Products → [your product] → Price ID | ✅ |
| `PUBLIC_CALENDLY_URL` | Calendly → Event Types → [your event] → Share → Copy link | ✅ |
| `RESEND_API_KEY` | resend.com → API Keys | Optional |
| `SUPABASE_URL` | Supabase project settings → API | Optional |
| `SUPABASE_ANON_KEY` | Supabase project settings → API | Optional |

**Variable prefixes explained:**
- Variables prefixed with `PUBLIC_` are safe to expose to the browser (SvelteKit inlines them into the client bundle).
- Variables without `PUBLIC_` are server-only and never sent to the browser.

In production, set all these in **Vercel's Environment Variables dashboard** (not in a `.env` file in the repo — never commit secrets).

---

## 7. Stripe Setup

### a. Create an account

Go to [dashboard.stripe.com](https://dashboard.stripe.com) and create a free account. During development, use **Test mode** (toggle in the top-left).

### b. Create products and prices

1. Go to **Products** → **Add product**.
2. Create three products, one for each pricing tier:

| Product name | Price | Billing |
|---|---|---|
| Single Tutoring Session | $60.00 | One time |
| 5-Session Bundle | $275.00 | One time |
| Monthly Tutoring Plan | $400.00 | One time (or set up as recurring if you prefer subscriptions) |

3. After saving each product, click on the price you created and copy the **Price ID** (starts with `price_`).
4. Paste each Price ID into your `.env` file.

### c. Get your API keys

1. Go to **Developers** → **API keys**.
2. Copy the **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`
3. Copy the **Publishable key** (`pk_test_...`) → `PUBLIC_STRIPE_PUBLISHABLE_KEY`

### d. Register the webhook endpoint

Stripe needs a URL to call after a payment succeeds. You'll register two endpoints — one for local testing and one for production.

**For local testing** (using the Stripe CLI):
```bash
# Install the Stripe CLI, then:
stripe listen --forward-to localhost:5173/tutoring/api/stripe-webhook
```
This will print a webhook signing secret (`whsec_...`). Copy it into `STRIPE_WEBHOOK_SECRET` in your `.env`.

**For production:**
1. Go to **Developers** → **Webhooks** → **Add endpoint**.
2. Endpoint URL: `https://mario-belmonte.com/tutoring/api/stripe-webhook`
3. Select events to listen to:
   - `checkout.session.completed`
   - `checkout.session.expired`
4. After saving, click **Reveal** under **Signing secret** and copy the `whsec_...` value into Vercel's environment variables.

### e. How the payment flow works (code walkthrough)

```
User clicks "Get Started" on a pricing card
  │
  ▼
Browser sends POST /tutoring/api/create-checkout-session
  { sessionType: "bundle" }
  │
  ▼
+server.ts looks up STRIPE_PRICE_ID_BUNDLE from env
  └── calls stripe.checkout.sessions.create(...)
        success_url: https://mario-belmonte.com/tutoring/success?session_id={CHECKOUT_SESSION_ID}
        cancel_url:  https://mario-belmonte.com/tutoring/cancel
  └── returns { url: "https://checkout.stripe.com/pay/cs_..." }
  │
  ▼
Browser redirects to Stripe's hosted checkout page
User enters card details on Stripe's servers (your code never sees them)
  │
  ▼
Stripe redirects to /tutoring/success?session_id=cs_...
  └── +page.server.ts calls stripe.checkout.sessions.retrieve(sessionId)
  └── Renders confirmation with payment details
  │
  ▼ (async, independently)
Stripe POSTs to /tutoring/api/stripe-webhook
  └── stripe-webhook/+server.ts verifies signature
  └── Logs the completed payment
  └── TODO: send confirmation email, save to Supabase, etc.
```

---

## 8. Calendly Setup

### a. Create a free account

Go to [calendly.com](https://calendly.com) and sign up. The free plan supports one event type with unlimited bookings.

### b. Create an event type

1. Click **New Event Type** → **One-on-One**.
2. Set the event name (e.g., "Tutoring Session"), duration (60 min), and your availability.
3. In **Appearance**, set the primary color to `#36f2c2` to match the site's teal accent.
4. Under **Notifications**, set up email reminders for yourself and the invitee.

### c. Get your embed URL

1. On the event type page, click **Share**.
2. Copy the **link** (e.g., `https://calendly.com/mario4-belmonte/tutoring-session`).
3. Paste it into `PUBLIC_CALENDLY_URL` in your `.env` and in Vercel's environment variables.

The booking page (`/tutoring/book`) embeds Calendly inline using their official widget script. The embed loads asynchronously so it does not block the page.

### d. The booking ↔ payment flow

Calendly handles scheduling; Stripe handles payment. They are linked by user action:

1. User picks a time on Calendly → gets a calendar invite by email.
2. User clicks **"Proceed to Payment →"** on the same page → goes to `/tutoring/checkout`.
3. User pays via Stripe → lands on `/tutoring/success`.

For a fully automated flow (payment link sent automatically after Calendly booking), you can use Calendly's webhooks to trigger the Stripe payment link via a serverless function. See the [Calendly webhook docs](https://developer.calendly.com/api-docs/ZG9jOjM2MzI3MDM4-webhook-overview).

---

## 9. Vercel Deployment — AiTutoring

### a. Connect the repo to Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import the `Qrytics/AiTutoring` GitHub repository.
3. On the **Configure Project** screen:
   - **Framework Preset**: Other (the `vercel.json` handles everything)
   - **Root Directory**: leave as `.` (the repo root)
   - Vercel will read `vercel.json` for build commands automatically.

### b. Set environment variables

In the Vercel project settings → **Environment Variables**, add all the variables from [Section 6](#6-environment-variables) with their production values (live Stripe keys, real Calendly URL, production webhook secret).

### c. Deploy

Click **Deploy**. Vercel will:
1. Run `npm install` (installs all workspace packages)
2. Run `npm run build --workspace=apps/web` (builds the SvelteKit app)
3. Serve the output from `apps/web/.vercel/output`

Your site will be live at `https://aitutoring-<hash>.vercel.app/tutoring`.

### d. How the base path works

`svelte.config.js` sets `kit.paths.base = '/tutoring'`. This means:
- All internal links use the `/tutoring` prefix (e.g., `/tutoring/book`).
- All JS/CSS asset URLs use the `/tutoring` prefix (e.g., `/tutoring/_app/...`).
- The `vercel.json` rewrites strip this prefix when routing within the Vercel deployment itself (`/tutoring → /`, `/tutoring/* → /*`), so SvelteKit's internal routes still work at `/`, `/book`, etc.

---

## 10. Domain Migration — portfolioSite

The portfolio is currently on **GitHub Pages** at `mario-belmonte.com`. GitHub Pages only serves one upstream per domain — you cannot serve `/tutoring` from a different host while the root points to GitHub Pages.

The fix: migrate `portfolioSite` to Vercel (one-time, ~10 minutes), then add a rewrite rule to proxy `/tutoring/*` to the AiTutoring Vercel deployment.

### a. Swap adapter in portfolioSite

In `Qrytics/portfolioSite`, change the adapter:

```bash
cd portfolioSite
npm install @sveltejs/adapter-vercel
```

Edit `svelte.config.js`:
```diff
- import adapter from '@sveltejs/adapter-static';
+ import adapter from '@sveltejs/adapter-vercel';

  const config = {
    kit: {
      adapter: adapter(),
-     // remove any static-specific options
    }
  };
```

### b. Deploy portfolioSite to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import `Qrytics/portfolioSite`.
2. Framework: SvelteKit (auto-detected).
3. Deploy.

### c. Move the custom domain

1. In the portfolioSite Vercel project → **Settings** → **Domains**.
2. Add `mario-belmonte.com`.
3. Vercel will show you DNS records to set. Update your domain registrar:
   - Add an **A record** pointing `@` to Vercel's IP (76.76.21.21).
   - Add a **CNAME** pointing `www` to `cname.vercel-dns.com`.
4. Remove or disable the old GitHub Pages CNAME record.
5. Wait for DNS propagation (up to 48 hours, usually minutes).

### d. Add the rewrite rule

In `portfolioSite/vercel.json` (create if it does not exist):

```json
{
  "rewrites": [
    {
      "source": "/tutoring/:path*",
      "destination": "https://aitutoring-YOUR-HASH.vercel.app/tutoring/:path*"
    }
  ]
}
```

Replace `aitutoring-YOUR-HASH` with your actual AiTutoring Vercel deployment URL (found in the AiTutoring Vercel project → **Deployments** → latest deployment URL).

After deploying the updated portfolioSite, `mario-belmonte.com/tutoring` will proxy to the AiTutoring deployment. The browser URL bar stays as `mario-belmonte.com/tutoring` throughout.

---

## 11. Testing Payments Locally

Use **Stripe's test card numbers** — no real money is charged.

| Scenario | Card number | Expiry | CVC |
|---|---|---|---|
| Successful payment | `4242 4242 4242 4242` | Any future date | Any 3 digits |
| Payment declined | `4000 0000 0000 0002` | Any future date | Any 3 digits |
| Requires 3D Secure | `4000 0025 0000 3155` | Any future date | Any 3 digits |

### Testing webhooks locally

```bash
# Terminal 1 — run the dev server
npm run dev

# Terminal 2 — forward Stripe webhooks to your local server
stripe listen --forward-to localhost:5173/tutoring/api/stripe-webhook

# Terminal 3 — trigger a test event manually
stripe trigger checkout.session.completed
```

The webhook handler (`stripe-webhook/+server.ts`) logs the event to the console. Look for `✅ Payment completed` in Terminal 1's output.

---

## 12. Going Live

When you're ready to accept real payments:

1. **Switch Stripe to live mode** — toggle "Test mode" off in the Stripe Dashboard.
2. **Get live API keys** — under Developers → API Keys, copy the live `sk_live_...` and `pk_live_...` keys.
3. **Create live products** — repeat the product creation steps from [Section 7b](#b-create-products-and-prices) in live mode and copy the live Price IDs.
4. **Register a live webhook** — under Developers → Webhooks, add a new endpoint with your production URL and copy the live `whsec_...` signing secret.
5. **Update Vercel environment variables** — replace all `_test_` values with the live counterparts. Redeploy.
6. **Test with a real card** — make one small real purchase to confirm the end-to-end flow.

---

## 13. Optional: Supabase Booking Database

By default, completed payments are only logged to the console. To persist booking records, add Supabase.

### a. Create a project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Note your **Project URL** and **anon/public key**.

### b. Create the bookings table

Run this in the Supabase SQL editor:

```sql
create table bookings (
  id           uuid primary key default gen_random_uuid(),
  stripe_session_id  text unique not null,
  session_type text not null,          -- 'single' | 'bundle' | 'monthly'
  customer_email     text,
  amount_total  integer,               -- in cents
  currency      text default 'usd',
  created_at    timestamptz default now()
);
```

### c. Install the Supabase client

```bash
cd apps/web
npm install @supabase/supabase-js
```

### d. Create the Supabase client

```typescript
// apps/web/src/lib/server/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### e. Save bookings in the webhook handler

In `stripe-webhook/+server.ts`, add to the `checkout.session.completed` case:

```typescript
import { supabase } from '$lib/server/supabase';

// Inside the switch case:
await supabase.from('bookings').insert({
  stripe_session_id: session.id,
  session_type: session.metadata?.sessionType,
  customer_email: session.customer_details?.email,
  amount_total: session.amount_total,
  currency: session.currency,
});
```

---

## 14. Optional: Confirmation Emails with Resend

[Resend](https://resend.com) has a generous free tier (3,000 emails/month) and a clean Node.js SDK.

### a. Set up Resend

1. Create a free account at [resend.com](https://resend.com).
2. Add and verify your sending domain (e.g., `mario-belmonte.com`).
3. Create an API key → add it to `RESEND_API_KEY`.

### b. Install the SDK

```bash
cd apps/web
npm install resend
```

### c. Send a confirmation email from the webhook

In `stripe-webhook/+server.ts`, inside `checkout.session.completed`:

```typescript
import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';

const resend = new Resend(RESEND_API_KEY);

const { customerEmail, amountTotal, currency } = {
  customerEmail: session.customer_details?.email,
  amountTotal: session.amount_total,
  currency: session.currency,
};

if (customerEmail) {
  await resend.emails.send({
    from: 'Mario <mario4.belmonte@gmail.com>',
    to: customerEmail,
    subject: 'Your tutoring session is confirmed!',
    html: `
      <p>Hi there,</p>
      <p>Your payment of ${(amountTotal! / 100).toFixed(2)} ${currency?.toUpperCase()} was received.</p>
      <p>Check your Calendly invite for the session link.</p>
      <p>See you soon,<br/>Mario</p>
    `,
  });
}
```

