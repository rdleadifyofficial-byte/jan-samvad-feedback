# Jan Samvad Feedback Hub

Vercel-ready public feedback form with Ward 1–45 selection, optional camera/gallery photos, QR sharing, PIN-protected admin inbox, Supabase persistence, and CSV/Excel export.

## Setup

1. Create a Supabase project and run `supabase.sql` in the SQL Editor. It safely adds the photo columns and creates/updates the private `feedback-photos` bucket (5 MB, JPG/PNG/WebP).
2. Import this repository into Vercel.
3. Add these Vercel environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY` (recommended) or the legacy `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PIN`
4. Deploy.

Keep `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` private. Never expose either key in browser code or commit it to GitHub.

Photos are uploaded only by the server route. The bucket is private, has no public policies, and the PIN-protected admin inbox generates one-hour signed photo links. Re-run `supabase.sql` on existing installations before deploying this version.
