# Jan Samvad Feedback Hub

Vercel-ready public feedback form with Ward 1–45 selection, QR sharing, PIN-protected admin inbox, Supabase persistence, and CSV/Excel export.

## Setup

1. Create a Supabase project and run `supabase.sql` in the SQL Editor.
2. Import this repository into Vercel.
3. Add these Vercel environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PIN`
4. Deploy.

Keep `SUPABASE_SERVICE_ROLE_KEY` private. Never expose it in browser code or commit it to GitHub.
