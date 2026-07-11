# Cottage — Mobile

React Native (Expo) app for the same Cottage backend as the web app — same Supabase
project, same auth, same data, real-time synced.

## Setup

1. Copy `.env.example` to `.env` and fill in the **same** values as the web app's
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (find them in
   `roommate-expense-tracker-main/.env.local` or your Supabase project settings).
2. Before first use, run migration `supabase/migrations/0011_enable_realtime.sql`
   against your Supabase project (adds the tables this app subscribes to onto
   the `supabase_realtime` publication). Migrations 0001–0010 must already be
   applied too, same as the web app.
3. `npm install`
4. `npm run start` — scan the QR code with Expo Go (iOS/Android) to run on your
   own phone, or `npm run web` to preview in a browser.

## What's built so far

- Email/password auth (same accounts as the web app)
- Dashboard: total meals / bazaar / utility expenses for the active month, with
  a live Supabase Realtime subscription — changes made on the web app (or by
  another phone) appear instantly, no pull-to-refresh needed
- Tab shell for Meal / Utilities / Members / Months (placeholder screens, not
  yet ported)

## Architecture notes

- `lib/supabase.ts` — Supabase client, configured for React Native (AsyncStorage
  session persistence, app-state-aware token refresh)
- `providers/AuthProvider.tsx` — session + profile context, mirrors the web
  app's `getCurrentProfile()` but client-side
- `lib/theme.ts` — same color tokens as the web app's Tailwind theme (Figma
  Inventix palette), so both apps look consistent
- Routing: Expo Router (`app/` directory, file-based, same mental model as
  Next.js's `app/` router). Auth-gated via `app/(tabs)/_layout.tsx` redirecting
  to `/login` when there's no session.

## Next steps

- Port Meal, Utilities, Members, Months screens
- Push notifications (Expo Notifications) to replace/complement the in-app
  notification tray
- EAS Build once ready for real device installs / store submission (needs your
  Apple/Google developer accounts)
