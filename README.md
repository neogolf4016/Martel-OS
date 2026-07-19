# Martel Family Dashboard

A private mobile-first family dashboard with:

- Shared meal planning
- Shared grocery lists
- Freezer, pantry, refrigerator, and household inventory
- Grocery and household budget tracking
- Supabase email/password authentication
- Live cross-device syncing
- JSON backup and restore
- PWA-ready web app
- Vercel deployment support

The app is preloaded with the Martel family's meals and staple groceries.

## 1. Upload to GitHub

Unzip this project.

In the GitHub repository, choose **Add file → Upload files**, then drag the **contents inside this folder** into the repository.

The repository root should contain:

```text
app/
components/
lib/
public/
supabase/
package.json
next.config.mjs
tsconfig.json
```

Do not upload the outer folder as a single nested directory.

## 2. Create the Supabase project

Create a new Supabase project named **Martel Family Dashboard**.

Open **SQL Editor**, create a new query, paste the contents of:

```text
supabase/schema.sql
```

Run the query.

## 3. Get the Supabase values

In Supabase open:

**Project Settings → API**

Copy:

- Project URL
- anon/public key

You do not need to share the database password.

## 4. Deploy with Vercel

In Vercel:

1. Choose **Add New → Project**
2. Import `neogolf4016/Martel-Dashboard-Public`
3. Add these environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon/public key>
NEXT_PUBLIC_HOUSEHOLD_KEY=<a long private random phrase>
```

Example household key:

```text
martel-family-2026-4f82c9-private
```

Use the same household key for the production, preview, and development environments.

4. Deploy.

## 5. Create the two family accounts

Open the deployed website.

Create one account for Allan and one for Stefanie.

Because both accounts use the same Supabase project and household key, they will see the same dashboard data.

If Supabase email confirmation is enabled, each person must confirm the signup email before signing in.

## Important privacy note

The GitHub repository is currently public. The source code does not contain passwords or Supabase keys, but a private repository is still preferable for a family dashboard.

Never commit `.env.local` or paste service-role keys into GitHub.

Only the public anon key belongs in Vercel. Never use the Supabase service-role key in this frontend app.

## Local development

Copy `.env.example` to `.env.local`, then fill in the values.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Local fallback

If Supabase environment variables are missing, the app still runs in local device mode using browser storage. Shared syncing and login are disabled in that mode.
