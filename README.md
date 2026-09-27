# Real Metrics Holdings

Management and advertising website for Real Metrics Holdings.

Professional React website and browser CMS for Real Metrics Holdings real estate advertising.

## Local setup

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

## CMS

Open `/Real-Metrics-Holdings-/admin` to manage site copy, services, testimonials, and property advertisements. Listings support image slideshows, featured placement, and statuses including `Available`, `For Sale`, `For Rent`, `Sold`, `Rented`, and `Tenanted`.

Without Supabase environment variables, the CMS saves to browser storage for previewing. With Supabase configured and `supabase/schema.sql` applied, it saves to the database.

## Deployment

The GitHub Pages workflow builds the app from `master` or `main`. Add these repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The Vite base path is `/Real-Metrics-Holdings-/` for `https://futurifydesigns.github.io/Real-Metrics-Holdings-/`.

## Security note

The included SQL allows public read access and restricts all CMS writes to the authenticated `info@realmetricsholdings.com` administrator account.
