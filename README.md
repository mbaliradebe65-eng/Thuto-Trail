# Thuto Trail: web app, PWA and WhatsApp bot

One codebase, three channels, one Supabase database. Built from the Thuto Trail investor pitch.

| Platform | What it is | Where |
|---|---|---|
| Web app | Find, Fund, Apply, Stay, plus a partner dashboard fed in real time by Supabase Realtime | `index.html`, `app.js` |
| PWA | Installable, works offline (service worker caches the app shell) | `manifest.json`, `sw.js` |
| Over-the-top bot | WhatsApp Business bot: APS calculator, funding guidance, document checklist | `api/whatsapp.js` |

## Deploy free (about 20 minutes)

1. **Supabase (free tier):** create a project, run `supabase/schema.sql` in the SQL editor. Copy the project URL and anon key into `config.js`. Without them the app runs in demo mode.
2. **Vercel (free Hobby plan):** push this folder to GitHub, import it in Vercel. Add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (service role key, server only), `WA_TOKEN`, `WA_PHONE_ID`, `WA_VERIFY_TOKEN` (any string you choose).
   Firebase Hosting works equally for the static files, but the bot function needs Vercel or Cloud Functions.
3. **WhatsApp:** in Meta for Developers create a Business app, add WhatsApp, set the webhook to `https://YOUR-APP.vercel.app/api/whatsapp` with your verify token, subscribe to `messages`. The test number is free for judging.
4. **Test PWA:** open the site on a phone in Chrome, choose Install. Turn on airplane mode and reopen.

## Evidence of data ownership

- **Learner owns the data.** Marks, checklist and check-ins are stored on the learner's own device (`localStorage`), never uploaded.
- **Only anonymous events are shared, and only after opt-in.** The `events` table holds an event type, coarse metadata (e.g. an APS number) and an 8-character random device id. No name, number, marks or documents.
- **Bot privacy:** WhatsApp numbers are stored only as a one-way SHA-256 hash, only after the learner sends `JOIN`. `STOP` deletes the record.
- **Rights built in:** the My data tab has consent toggle, "Download my data" (JSON export) and "Delete everything". These map to POPIA consent, access and deletion.
- **Database security:** row-level security is on. `bot_users` has no public policies, so it is reachable only from the server.
- **Ownership of the platform data asset:** the team owns the aggregated, anonymised dataset (a pathway and drop-off dataset for SA higher education). Learners own their personal data. State this in your pitch.

## Commercialisation (from the pitch deck)

Learners never pay. Revenue comes from the organisations that benefit:

| Customer | Price (assumption) | Value |
|---|---|---|
| Universities and TVET colleges | R200k per institution a year | Cleaner applications, retention dashboard, fewer dropouts |
| Bursary funders and corporates | R120k per funder a year | Pre-screened applicants, outcome tracking |
| Banks and fintech | R100 per qualified referral | Student accounts and products at the right moment |

Cost to serve about R10 per active learner a year. The Partners tab has a live calculator. Year 3 target: R17m revenue. All figures are team assumptions to validate in pilots. The partner dashboard is the product institutions and funders pay for; the bot is the free acquisition channel.

## Not built yet (be upfront with judges)

- Document scanner / OCR, AI chatbot answers, USSD and voice (needs Africa's Talking or similar)
- Local-language content (isiZulu, isiXhosa, Sesotho, Afrikaans)
- Learner login and cross-device sync; partner dashboard login (currently open demo read access)
- WhatsApp webhook signature check (`X-Hub-Signature-256`): add before production
- Course requirements and the NSFAS threshold are illustrative: verify against current prospectuses and NSFAS rules
