# URHPL Global Lead Finder Pro — Free API Edition

A worldwide prospect research workspace built around **free/public integrations**. It discovers mapped businesses with OpenStreetMap, scans a company's public website for contact emails, extracts emails from pasted text into a downloadable `.txt` file, checks email-domain MX records through DNS, and manages leads in Supabase.

> **No Google Places or Hunter API keys are required.** Public data services and free hosting/database plans still have fair-use limits, quotas, availability constraints, and their own terms. “Free” does not mean unlimited or exhaustive.

## Features

- Responsive dashboard and Supabase email/password authentication
- Private lead storage with Postgres Row Level Security (RLS)
- Worldwide business search through public OpenStreetMap / Overpass / Nominatim services
- Public website contact scan: homepage, `/contact`, `/contact-us`, `/about`, and `www` homepage
- Extract unique email addresses from pasted text into a downloadable `.txt` file; copy to clipboard and optionally save leads
- Free DNS MX-record check (does **not** verify that an individual mailbox exists)
- Lead CRUD, status/scoring, search/filter, CSV import/export, JSON backup
- No automated email sending and no paid enrichment API dependency

## 1. Create a free Supabase project

1. Create a project at https://supabase.com and choose the free plan if it suits your needs.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. From project API settings, copy the Project URL and public publishable/anon key.
4. In **Authentication → URL Configuration**, set the Site URL to your deployed site after deployment and add the site URL to allowed redirect URLs.
5. Ensure Email sign-in is enabled. If confirmation is enabled, confirm your email before signing in.

Supabase's free plan has usage and project limits that may change; check its current pricing and terms. You do not need a service-role key.

## 2. Configure the app

Edit `public/config.js`:

```js
window.FITIWEBS_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY"
};
```

Only the public Supabase key belongs in this browser config. Never put a service-role key here.

## 3. Deploy on a free hosting tier

1. Upload the project to a GitHub repository.
2. Import it at https://vercel.com/new (or use another compatible serverless host).
3. Add these server environment variables in your hosting dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Deploy. No Google Places or Hunter keys are needed.

See `.env.example` for the required server variables. The app's `/api` routes are serverless functions.

## 4. Test it

- Visit `/api/health`; it reports the free integration mode and whether Supabase variables are configured.
- Sign in and search something like `solar installers in Lagos, Nigeria` or `restaurants in Toronto, Canada`.
- Search a company's domain to scan its public homepage/contact pages for emails.
- Test the email extractor by pasting text containing public email addresses, then download the `.txt` list.
- Use **Verify** to check whether the email domain publishes MX records. This is a domain-level DNS check, not individual mailbox verification.
- Save a result, refresh, and test CSV export/import.

## Free integration limits and accuracy

- **OpenStreetMap / Nominatim / Overpass:** community-maintained public services. Coverage varies significantly by country, city, and industry. Shared endpoints may rate-limit or temporarily reject requests. Follow their usage policies and do not run high-volume automated queries. This is not a complete global company directory.
- **Public website scan:** only checks a small set of common pages on the domain supplied. Websites may block requests, have no published email, or use JavaScript that hides contact details. It does not guess addresses or bypass access controls.
- **DNS MX check:** confirms whether DNS lists mail exchangers for a domain. It cannot confirm that a particular mailbox exists, is monitored, or will accept a message.
- **Supabase / hosting:** free tiers have changing storage, request, bandwidth, inactivity, and function limits. Review provider terms before commercial or high-volume use.

## Responsible use

Use business contact information only for relevant, lawful purposes. Respect source terms, applicable privacy/data-protection rules (including relevant Nigerian requirements), and recipient-country anti-spam laws. Identify yourself, personalize outreach, provide an appropriate opt-out, and honor do-not-contact requests. The app does not send emails.

## API routes

- `GET /api/health` — reports integration mode and configuration status.
- `POST /api/discover` — `{ "query": "solar installers in Lagos, Nigeria" }`
- `POST /api/domain-search` — `{ "domain": "company.example" }`
- `POST /api/verify` — `{ "email": "hello@company.example" }`

All POST routes require `Authorization: Bearer <Supabase access token>`.

## Project structure

```text
api/
  _auth.js
  health.js
  discover.js
  domain-search.js
  verify.js
public/
  index.html
  config.js
supabase/
  schema.sql
vercel.json
package.json
.env.example
README.md
```
