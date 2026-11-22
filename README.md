# FreshTrack — Eat Fresh, Waste Less

FreshTrack is a responsive food inventory and expiry-tracking web app. Users can create an account, add food items, track expiry dates, mark food as consumed or wasted, and view a simple waste summary.

## Tech stack
- React + Vite
- Supabase Auth
- Supabase PostgreSQL with Row Level Security
- Plain CSS and Lucide icons

## 1. Create the Supabase database
1. Create a project at https://supabase.com.
2. Open **SQL Editor** in your Supabase dashboard.
3. Copy and run the complete SQL from `supabase/schema.sql`.

## 2. Configure environment variables
1. Copy `.env.example` and rename the copy to `.env`.
2. In Supabase, open **Project Settings → API**.
3. Copy the Project URL into `VITE_SUPABASE_URL`.
4. Copy the anon/public (or publishable) key into `VITE_SUPABASE_ANON_KEY`.
5. Never use or expose the `service_role` / secret key in a frontend app.

## 3. Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite.

## 4. Build check
```bash
npm run build
```

## 5. Push to GitHub
Create an empty GitHub repository, then run these commands from this project folder:
```bash
git init
git add .
git commit -m "Initial commit: FreshTrack"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
The `.env` file is ignored by Git. Commit `.env.example`, not `.env`.

## 6. Deploy to Vercel or Netlify
- Import the GitHub repository.
- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment-variable settings.
- Deploy.

## 7. Supabase Auth URL configuration
After deployment, open **Supabase → Authentication → URL Configuration**:
- Set **Site URL** to your deployed website URL.
- Add the deployed URL to **Redirect URLs**, for example `https://your-site.vercel.app/**`.
- Save changes.

## Features
- Public registration and login (email/password)
- Personal food inventory
- Add, edit, search, and filter food items
- Expiry status: fresh, expiring soon, expired
- Mark items as consumed or wasted
- Dashboard summary and waste percentage
- Row Level Security: users can only access their own records

## Notes
- Email confirmation behavior depends on your Supabase Auth settings. For quick testing, you can disable email confirmation in Supabase Authentication settings; for a real public deployment, configure email delivery and confirmation properly.
- This starter uses date-based expiry reminders inside the app. It does not send push/email notifications.
